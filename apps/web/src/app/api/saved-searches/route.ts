import { requireTeamRole } from '@/lib/server/guards';
import { handleRoute, jsonOk, readJson } from '@/lib/server/http';
import { savedSearchesService } from '@/lib/server/services';

export const GET = handleRoute(async (req) => {
  const { teamId } = await requireTeamRole(req, ['OWNER', 'ADMIN', 'VA', 'VIEWER']);
  return jsonOk(await savedSearchesService.getAll(teamId));
});

export const POST = handleRoute(async (req) => {
  const { teamId, user } = await requireTeamRole(req, ['OWNER', 'ADMIN', 'VA']);
  const body = await readJson<{ query: string; marketplace?: string; filters?: any }>(req);
  return jsonOk(await savedSearchesService.create(teamId, user.id, body));
});
