import { enforcePlanLimit, requireTeamRole } from '@/lib/server/guards';
import { handleRoute, jsonOk, readJson } from '@/lib/server/http';
import { teamsService } from '@/lib/server/services';
import type { TeamRole } from '@sourcetool/shared';

export const POST = handleRoute(async (req) => {
  const { teamId, user } = await requireTeamRole(req, ['OWNER', 'ADMIN']);
  await enforcePlanLimit(teamId, 'team_invite');
  const body = await readJson<{ email: string; role: TeamRole }>(req);
  return jsonOk(await teamsService.createInvite(teamId, body.email, body.role, user.id));
});

export const GET = handleRoute(async (req) => {
  const { teamId } = await requireTeamRole(req, ['OWNER', 'ADMIN']);
  return jsonOk(await teamsService.getInvites(teamId));
});
