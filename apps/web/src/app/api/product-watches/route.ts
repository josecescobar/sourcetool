import { requireTeamRole } from '@/lib/server/guards';
import { handleRoute, jsonOk, readJson } from '@/lib/server/http';
import { productWatchesService } from '@/lib/server/services';

export const GET = handleRoute(async (req) => {
  const { teamId } = await requireTeamRole(req, ['OWNER', 'ADMIN']);
  return jsonOk(await productWatchesService.getAll(teamId));
});

export const POST = handleRoute(async (req) => {
  const { teamId } = await requireTeamRole(req, ['OWNER', 'ADMIN']);
  const body = await readJson<any>(req);
  return jsonOk(await productWatchesService.create(teamId, body));
});
