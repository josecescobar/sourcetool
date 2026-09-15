import { requireTeamRole } from '@/lib/server/guards';
import { handleRoute, jsonOk, readJson } from '@/lib/server/http';
import { analysisService } from '@/lib/server/services';
import type { AnalysisContext } from '@/lib/server/analysis/analysis.service';
import type { CalculateInput } from '@sourcetool/shared';

export const POST = handleRoute(async (req) => {
  const { user, teamId } = await requireTeamRole(req, ['OWNER', 'ADMIN', 'VA']);
  // `snapshot` is optional context the caller already has on screen (BSR, offer
  // counts, an AI verdict). It is frozen with the analysis for calibration.
  const { snapshot, ...input } = await readJson<CalculateInput & { snapshot?: AnalysisContext }>(
    req,
  );
  return jsonOk(await analysisService.calculate(input, user.id, teamId, snapshot ?? {}));
});
