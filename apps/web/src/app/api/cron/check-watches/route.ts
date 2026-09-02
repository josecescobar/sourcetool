import { NextResponse } from 'next/server';
import { LOOKUP_BATCH_SIZE, chainNewInvocation } from '@/lib/server/self-invoke';
import { watchCheckerService } from '@/lib/server/services';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get('authorization');
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const url = new URL(req.url);
  const offset = Number(url.searchParams.get('offset') || 0);
  const result = await watchCheckerService.checkWatchedProducts({
    offset: Number.isFinite(offset) ? offset : 0,
    limit: LOOKUP_BATCH_SIZE,
  });

  if (!result.done && result.nextOffset != null) {
    chainNewInvocation(`/api/cron/check-watches?offset=${result.nextOffset}`, { method: 'GET' });
  }

  return NextResponse.json({ ok: true, ...result });
}
