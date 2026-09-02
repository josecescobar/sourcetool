import { requireTeamRole } from '@/lib/server/guards';
import { handleRoute, jsonOk } from '@/lib/server/http';
import { productsService } from '@/lib/server/services';

export const GET = handleRoute(async (req, ctx: { params: Promise<{ id: string }> }) => {
  await requireTeamRole(req, ['OWNER', 'ADMIN', 'VA', 'VIEWER']);
  const { id } = await ctx.params;
  return jsonOk(await productsService.getById(id));
});
