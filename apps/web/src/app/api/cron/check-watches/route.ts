import { NextResponse } from 'next/server';
import { watchCheckerService } from '@/lib/server/services';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get('authorization');
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await watchCheckerService.checkWatchedProducts();
  return NextResponse.json({ ok: true });
}
