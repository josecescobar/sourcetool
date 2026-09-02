import { requireTeamRole } from '@/lib/server/guards';
import { handleRoute, jsonOk } from '@/lib/server/http';
import { analyticsService } from '@/lib/server/services';

export const GET = handleRoute(async (req) => {
  const { teamId } = await requireTeamRole(req, ['OWNER', 'ADMIN']);
  const url = new URL(req.url);
  const startDate = url.searchParams.get('startDate') || undefined;
  const endDate = url.searchParams.get('endDate') || undefined;
  const limit = Number(url.searchParams.get('limit')) || 10;
  return jsonOk(await analyticsService.getTopProducts(teamId, startDate, endDate, limit));
});
