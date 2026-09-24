import { NextResponse } from 'next/server';
import { isAuthorizedCron } from '@/lib/server/cron-auth';
import { bulkScanService } from '@/lib/server/services';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(req: Request) {
  if (!isAuthorizedCron(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = (await req.json().catch(() => ({}))) as {
    scanId?: string;
    teamId?: string;
    userId?: string;
  };

  if (!body.scanId || !body.teamId || !body.userId) {
    return NextResponse.json({ error: 'scanId, teamId, and userId are required' }, { status: 400 });
  }

  const result = await bulkScanService.processChunk(body.scanId, body.teamId, body.userId);
  return NextResponse.json({ ok: true, ...result });
}
