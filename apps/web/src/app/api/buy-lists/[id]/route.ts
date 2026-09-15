import { requireTeamRole } from '@/lib/server/guards';
import { handleRoute, jsonOk, readJson } from '@/lib/server/http';
import { buyListsService } from '@/lib/server/services';

export const GET = handleRoute(async (req, ctx: { params: Promise<{ id: string }> }) => {
  const { teamId } = await requireTeamRole(req, ['OWNER', 'ADMIN', 'VA', 'VIEWER']);
  const { id } = await ctx.params;
  return jsonOk(await buyListsService.getById(id, teamId));
});

export const PATCH = handleRoute(async (req, ctx: { params: Promise<{ id: string }> }) => {
  const { teamId } = await requireTeamRole(req, ['OWNER', 'ADMIN', 'VA']);
  const { id } = await ctx.params;
  const body = await readJson<{ name: string }>(req);
  return jsonOk(await buyListsService.update(id, teamId, body.name));
});

export const DELETE = handleRoute(async (req, ctx: { params: Promise<{ id: string }> }) => {
  const { teamId } = await requireTeamRole(req, ['OWNER', 'ADMIN', 'VA']);
  const { id } = await ctx.params;
  return jsonOk(await buyListsService.delete(id, teamId));
});
