import { requireTeamRole } from '@/lib/server/guards';
import { handleRoute, jsonOk } from '@/lib/server/http';
import { savedSearchesService } from '@/lib/server/services';

export const DELETE = handleRoute(async (req, ctx: { params: Promise<{ id: string }> }) => {
  const { teamId } = await requireTeamRole(req, ['OWNER', 'ADMIN', 'VA']);
  const { id } = await ctx.params;
  return jsonOk(await savedSearchesService.remove(id, teamId));
});
