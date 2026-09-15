import { after } from 'next/server';

/** Keep background work alive after the HTTP response on Vercel. */
export function runAfter(task: () => Promise<unknown>) {
  after(async () => {
    try {
      await task();
    } catch (err) {
      console.error('[runAfter]', err);
    }
  });
}
