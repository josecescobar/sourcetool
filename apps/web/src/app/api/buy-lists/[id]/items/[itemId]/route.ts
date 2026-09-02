import { requireTeamRole } from '@/lib/server/guards';
import { handleRoute, jsonOk } from '@/lib/server/http';
import { buyListsService } from '@/lib/server/services';

export const DELETE = handleRoute(async (req, ctx: { params: Promise<{ id: string; itemId: string }> }) => {
  const { teamId } = await requireTeamRole(req, ['OWNER', 'ADMIN', 'VA']);
  const { id, itemId } = await ctx.params;
  return jsonOk(await buyListsService.removeItem(id, itemId, teamId));
});
