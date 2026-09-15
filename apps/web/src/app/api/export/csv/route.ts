import { requireTeamRole } from '@/lib/server/guards';
import { handleRoute, jsonOk, readJson } from '@/lib/server/http';
import { exportService } from '@/lib/server/services';

export const POST = handleRoute(async (req) => {
  await requireTeamRole(req, ['OWNER', 'ADMIN']);
  const body = await readJson<{ analysisIds: string[] }>(req);
  return jsonOk(await exportService.exportCsv(body.analysisIds));
});
