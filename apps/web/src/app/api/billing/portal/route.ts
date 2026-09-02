import { requireTeamRole } from '@/lib/server/guards';
import { handleRoute, jsonOk } from '@/lib/server/http';
import { billingService } from '@/lib/server/services';

export const POST = handleRoute(async (req) => {
  const { teamId } = await requireTeamRole(req, ['OWNER']);
  return jsonOk(await billingService.createPortalSession(teamId));
});
