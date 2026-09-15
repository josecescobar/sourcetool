import { requireTeamRole } from '@/lib/server/guards';
import { handleRoute, jsonOk } from '@/lib/server/http';
import { alertsService } from '@/lib/server/services';

export const GET = handleRoute(async (req, ctx: { params: Promise<{ identifier: string }> }) => {
  await requireTeamRole(req, ['OWNER', 'ADMIN', 'VA', 'VIEWER']);
  const { identifier } = await ctx.params;
  return jsonOk(await alertsService.checkByIdentifier(identifier));
});
