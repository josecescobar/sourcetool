import { requireTeamRole } from '@/lib/server/guards';
import { handleRoute, jsonOk } from '@/lib/server/http';
import { bulkScanService } from '@/lib/server/services';

export const GET = handleRoute(async (req, ctx: { params: Promise<{ id: string }> }) => {
  await requireTeamRole(req, ['OWNER', 'ADMIN', 'VA', 'VIEWER']);
  const { id } = await ctx.params;
  return jsonOk(await bulkScanService.getById(id));
});

export const DELETE = handleRoute(async (req, ctx: { params: Promise<{ id: string }> }) => {
  await requireTeamRole(req, ['OWNER', 'ADMIN', 'VA']);
  const { id } = await ctx.params;
  await bulkScanService.delete(id);
  return jsonOk(undefined);
});
