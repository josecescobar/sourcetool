import { requireTeamRole } from '@/lib/server/guards';
import { handleRoute, jsonOk } from '@/lib/server/http';
import { alertsService } from '@/lib/server/services';

export const GET = handleRoute(async (req) => {
  const { teamId } = await requireTeamRole(req, ['OWNER', 'ADMIN', 'VA', 'VIEWER']);
  const url = new URL(req.url);
  const page = url.searchParams.get('page');
  const limit = url.searchParams.get('limit');
  return jsonOk(await alertsService.getRecentForTeam(
    teamId,
    page ? parseInt(page, 10) : undefined,
    limit ? parseInt(limit, 10) : undefined,
  ));
});
