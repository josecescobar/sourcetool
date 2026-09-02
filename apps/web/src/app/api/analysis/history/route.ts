import { NextResponse } from 'next/server';
import { requireTeamRole } from '@/lib/server/guards';
import { handleRoute } from '@/lib/server/http';
import { analysisService } from '@/lib/server/services';

export const GET = handleRoute(async (req) => {
  const { teamId: tokenTeamId } = await requireTeamRole(req, ['OWNER', 'ADMIN', 'VA', 'VIEWER']);
  const url = new URL(req.url);
  const teamId = url.searchParams.get('teamId') || tokenTeamId;
  const page = Number(url.searchParams.get('page')) || 1;
  const limit = Number(url.searchParams.get('limit')) || 20;
  const result = await analysisService.getHistory(teamId, page, limit);
  return NextResponse.json({ success: true, ...result });
});
