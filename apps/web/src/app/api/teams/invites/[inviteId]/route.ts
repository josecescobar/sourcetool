import { NextResponse } from 'next/server';
import { requireTeamRole } from '@/lib/server/guards';
import { handleRoute } from '@/lib/server/http';
import { teamsService } from '@/lib/server/services';

export const DELETE = handleRoute(async (req, ctx: { params: Promise<{ inviteId: string }> }) => {
  const { teamId } = await requireTeamRole(req, ['OWNER', 'ADMIN']);
  const { inviteId } = await ctx.params;
  await teamsService.revokeInvite(teamId, inviteId);
  return NextResponse.json({ success: true });
});
