import { requireTeamRole } from '@/lib/server/guards';
import { handleRoute, jsonOk, readJson } from '@/lib/server/http';
import { calibrationService } from '@/lib/server/services';

/** Adjust a fresh forecast by the team's own realized track record. */
export const POST = handleRoute(async (req) => {
  const { teamId } = await requireTeamRole(req, ['OWNER', 'ADMIN', 'VA', 'VIEWER']);
  const body = await readJson<{
    predictedRoi: number;
    predictedProfit: number;
    category?: string;
    aiScore?: number;
  }>(req);
  return jsonOk(await calibrationService.calibrateForecast(teamId, body));
});
