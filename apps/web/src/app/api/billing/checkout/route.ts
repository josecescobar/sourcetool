import { requireTeamRole } from '@/lib/server/guards';
import { handleRoute, jsonOk, readJson } from '@/lib/server/http';
import { billingService } from '@/lib/server/services';
import type { PlanTier } from '@sourcetool/shared';

export const POST = handleRoute(async (req) => {
  const { teamId } = await requireTeamRole(req, ['OWNER']);
  const body = await readJson<{ planTier: PlanTier }>(req);
  return jsonOk(await billingService.createCheckoutSession(teamId, body.planTier));
});
