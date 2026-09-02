import { after } from 'next/server';

/** How many provider lookups one Vercel invocation can finish under 300s. */
export const LOOKUP_BATCH_SIZE = 40;

export function appBaseUrl() {
  if (process.env.WEB_URL) return process.env.WEB_URL.replace(/\/$/, '');
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return 'http://localhost:3000';
}

function canChain(): boolean {
  return Boolean(process.env.CRON_SECRET && (process.env.WEB_URL || process.env.VERCEL_URL));
}

/**
 * Start a *new* serverless invocation after the current response.
 * `after()` in the same request does not reset maxDuration, so long jobs
 * must hop to a fresh URL instead of looping in-process.
 */
export function chainNewInvocation(
  path: string,
  init: { method?: string; body?: unknown } = {},
  fallback?: () => Promise<unknown>,
) {
  if (!canChain()) {
    if (fallback) {
      after(async () => {
        try {
          await fallback();
        } catch (err) {
          console.error('[chainNewInvocation:fallback]', err);
        }
      });
    }
    return;
  }

  const url = `${appBaseUrl()}${path}`;
  after(async () => {
    try {
      const res = await fetch(url, {
        method: init.method ?? 'POST',
        headers: {
          Authorization: `Bearer ${process.env.CRON_SECRET}`,
          'Content-Type': 'application/json',
        },
        body: init.body === undefined ? undefined : JSON.stringify(init.body),
      });
      if (!res.ok) {
        console.error('[chainNewInvocation]', url, res.status, await res.text());
      }
    } catch (err) {
      console.error('[chainNewInvocation]', url, err);
    }
  });
}
