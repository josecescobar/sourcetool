import { requireTeamRole } from '@/lib/server/guards';
import { handleRoute, jsonOk } from '@/lib/server/http';
import { productWatchesService } from '@/lib/server/services';

export const POST = handleRoute(async (req, ctx: { params: Promise<{ id: string }> }) => {
  const { teamId } = await requireTeamRole(req, ['OWNER', 'ADMIN']);
  const { id } = await ctx.params;
  return jsonOk(await productWatchesService.markRead(id, teamId));
});
