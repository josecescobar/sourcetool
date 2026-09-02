import { requireTeamRole } from '@/lib/server/guards';
import { handleRoute, jsonOk } from '@/lib/server/http';
import { alertsService } from '@/lib/server/services';

export const GET = handleRoute(async (req, ctx: { params: Promise<{ productId: string }> }) => {
  await requireTeamRole(req, ['OWNER', 'ADMIN', 'VA', 'VIEWER']);
  const { productId } = await ctx.params;
  return jsonOk(await alertsService.getByProductId(productId));
});
