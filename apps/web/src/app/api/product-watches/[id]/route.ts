import { requireTeamRole } from '@/lib/server/guards';
import { handleRoute, jsonOk, readJson } from '@/lib/server/http';
import { productWatchesService } from '@/lib/server/services';

export const PATCH = handleRoute(async (req, ctx: { params: Promise<{ id: string }> }) => {
  const { teamId } = await requireTeamRole(req, ['OWNER', 'ADMIN']);
  const { id } = await ctx.params;
  const body = await readJson<any>(req);
  return jsonOk(await productWatchesService.update(id, teamId, body));
});

export const DELETE = handleRoute(async (req, ctx: { params: Promise<{ id: string }> }) => {
  const { teamId } = await requireTeamRole(req, ['OWNER', 'ADMIN']);
  const { id } = await ctx.params;
  return jsonOk(await productWatchesService.remove(id, teamId));
});
