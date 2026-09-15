import { requireTeamRole } from '@/lib/server/guards';
import { handleRoute, jsonOk, readJson } from '@/lib/server/http';
import { productsService } from '@/lib/server/services';

export const POST = handleRoute(async (req) => {
  await requireTeamRole(req, ['OWNER', 'ADMIN', 'VA']);
  const body = await readJson<{ identifier: string }>(req);
  return jsonOk(await productsService.crossMatch(body.identifier));
});
