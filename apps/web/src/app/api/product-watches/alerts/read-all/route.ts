import { requireTeamRole } from '@/lib/server/guards';
import { handleRoute, jsonOk } from '@/lib/server/http';
import { productWatchesService } from '@/lib/server/services';

export const POST = handleRoute(async (req) => {
  const { teamId } = await requireTeamRole(req, ['OWNER', 'ADMIN']);
  return jsonOk(await productWatchesService.markAllRead(teamId));
});
