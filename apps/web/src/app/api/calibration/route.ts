import { requireTeamRole } from '@/lib/server/guards';
import { handleRoute, jsonOk } from '@/lib/server/http';
import { calibrationService } from '@/lib/server/services';

export const GET = handleRoute(async (req) => {
  const { teamId } = await requireTeamRole(req, ['OWNER', 'ADMIN', 'VA', 'VIEWER']);
  return jsonOk(await calibrationService.getReport(teamId));
});
