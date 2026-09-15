import { requireTeamRole } from '@/lib/server/guards';
import { handleRoute, jsonOk } from '@/lib/server/http';
import { productWatchesService } from '@/lib/server/services';

export const GET = handleRoute(async (req) => {
  const { teamId } = await requireTeamRole(req, ['OWNER', 'ADMIN', 'VIEWER']);
  const url = new URL(req.url);
  const unreadOnly = url.searchParams.get('unreadOnly') === 'true';
  return jsonOk(await productWatchesService.getAlerts(teamId, unreadOnly));
});
