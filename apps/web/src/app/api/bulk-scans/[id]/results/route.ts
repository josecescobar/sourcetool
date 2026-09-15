import { requireTeamRole } from '@/lib/server/guards';
import { handleRoute, jsonOk } from '@/lib/server/http';
import { bulkScanService } from '@/lib/server/services';

export const GET = handleRoute(async (req, ctx: { params: Promise<{ id: string }> }) => {
  await requireTeamRole(req, ['OWNER', 'ADMIN', 'VA', 'VIEWER']);
  const { id } = await ctx.params;
  const url = new URL(req.url);
  return jsonOk(await bulkScanService.getResults(id, url.searchParams.get('sort') || undefined, url.searchParams.get('filter') || undefined));
});
