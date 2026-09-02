import { requireTeamRole } from '@/lib/server/guards';
import { handleRoute, jsonOk, readJson } from '@/lib/server/http';
import { alertsService } from '@/lib/server/services';

export const POST = handleRoute(async (req) => {
  await requireTeamRole(req, ['OWNER', 'ADMIN', 'VA', 'VIEWER']);
  const body = await readJson<{ identifiers: string[] }>(req);
  return jsonOk(await alertsService.checkBatch(body.identifiers));
});
