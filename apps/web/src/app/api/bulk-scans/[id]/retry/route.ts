import { requireTeamRole } from '@/lib/server/guards';
import { handleRoute, jsonOk } from '@/lib/server/http';
import { bulkScanService } from '@/lib/server/services';

export const maxDuration = 60;

export const POST = handleRoute(async (req, ctx: { params: Promise<{ id: string }> }) => {
  const { user, teamId } = await requireTeamRole(req, ['OWNER', 'ADMIN', 'VA']);
  const { id } = await ctx.params;
  return jsonOk(await bulkScanService.retryFailed(id, teamId, user.id));
});
