import { requireTeamRole } from '@/lib/server/guards';
import { handleRoute, jsonOk } from '@/lib/server/http';
import { productWatchesService } from '@/lib/server/services';

export const GET = handleRoute(async (req) => {
  const { teamId } = await requireTeamRole(req, ['OWNER', 'ADMIN', 'VIEWER']);
  return jsonOk({ count: await productWatchesService.getUnreadCount(teamId) });
});
