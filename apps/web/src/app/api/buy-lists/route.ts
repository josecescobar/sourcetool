import { requireTeamRole } from '@/lib/server/guards';
import { handleRoute, jsonOk, readJson } from '@/lib/server/http';
import { buyListsService } from '@/lib/server/services';

export const GET = handleRoute(async (req) => {
  const { teamId } = await requireTeamRole(req, ['OWNER', 'ADMIN', 'VA', 'VIEWER']);
  return jsonOk(await buyListsService.getAll(teamId));
});

export const POST = handleRoute(async (req) => {
  const { teamId } = await requireTeamRole(req, ['OWNER', 'ADMIN', 'VA']);
  const body = await readJson<{ name: string }>(req);
  return jsonOk(await buyListsService.create(teamId, body.name));
});
