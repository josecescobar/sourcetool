import { NextResponse } from 'next/server';
import { requireTeamRole } from '@/lib/server/guards';
import { handleRoute, jsonOk, readJson } from '@/lib/server/http';
import { teamsService } from '@/lib/server/services';
import type { TeamRole } from '@sourcetool/shared';

export const PATCH = handleRoute(async (req, ctx: { params: Promise<{ memberId: string }> }) => {
  const { teamId, user } = await requireTeamRole(req, ['OWNER', 'ADMIN']);
  const { memberId } = await ctx.params;
  const body = await readJson<{ role: TeamRole }>(req);
  return jsonOk(await teamsService.updateMemberRole(teamId, memberId, body.role, user.id));
});

export const DELETE = handleRoute(async (req, ctx: { params: Promise<{ memberId: string }> }) => {
  const { teamId, user } = await requireTeamRole(req, ['OWNER', 'ADMIN']);
  const { memberId } = await ctx.params;
  await teamsService.removeMember(teamId, memberId, user.id);
  return NextResponse.json({ success: true });
});
