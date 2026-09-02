import { requireTeamRole } from '@/lib/server/guards';
import { handleRoute, jsonOk, readJson } from '@/lib/server/http';
import { sourcedProductsService } from '@/lib/server/services';

export const GET = handleRoute(async (req, ctx: { params: Promise<{ id: string }> }) => {
  const { teamId } = await requireTeamRole(req, ['OWNER', 'ADMIN']);
  const { id } = await ctx.params;
  return jsonOk(await sourcedProductsService.getById(id, teamId));
});

export const PATCH = handleRoute(async (req, ctx: { params: Promise<{ id: string }> }) => {
  const { teamId } = await requireTeamRole(req, ['OWNER', 'ADMIN']);
  const { id } = await ctx.params;
  const body = await readJson<any>(req);
  return jsonOk(await sourcedProductsService.update(id, teamId, body));
});

export const DELETE = handleRoute(async (req, ctx: { params: Promise<{ id: string }> }) => {
  const { teamId } = await requireTeamRole(req, ['OWNER', 'ADMIN']);
  const { id } = await ctx.params;
  return jsonOk(await sourcedProductsService.remove(id, teamId));
});
