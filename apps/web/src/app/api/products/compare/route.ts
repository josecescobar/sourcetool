import { requireTeamRole } from '@/lib/server/guards';
import { handleRoute, jsonOk, readJson } from '@/lib/server/http';
import { productsService } from '@/lib/server/services';

export const POST = handleRoute(async (req) => {
  const { teamId } = await requireTeamRole(req, ['OWNER', 'ADMIN', 'VA', 'VIEWER']);
  const body = await readJson<{ asins: string[] }>(req);
  return jsonOk(await productsService.compare(body.asins, teamId));
});
