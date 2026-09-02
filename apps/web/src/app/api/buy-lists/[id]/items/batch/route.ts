import { requireTeamRole } from '@/lib/server/guards';
import { handleRoute, jsonOk, readJson } from '@/lib/server/http';
import { buyListsService } from '@/lib/server/services';

export const POST = handleRoute(async (req, ctx: { params: Promise<{ id: string }> }) => {
  const { teamId } = await requireTeamRole(req, ['OWNER', 'ADMIN', 'VA']);
  const { id } = await ctx.params;
  const body = await readJson<{ items: Array<{ productId: string; analysisId?: string; notes?: string }> }>(req);
  return jsonOk(await buyListsService.addItemsBatch(id, teamId, body.items));
});
