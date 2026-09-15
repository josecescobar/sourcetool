import { enforcePlanLimit, requireTeamRole } from '@/lib/server/guards';
import { handleRoute, jsonOk, readJson } from '@/lib/server/http';
import { exportService } from '@/lib/server/services';

export const POST = handleRoute(async (req) => {
  const { teamId } = await requireTeamRole(req, ['OWNER', 'ADMIN']);
  await enforcePlanLimit(teamId, 'export');
  const body = await readJson<{ analysisIds: string[] }>(req);
  return jsonOk(await exportService.exportGoogleSheets(body.analysisIds));
});
