import { requireTeamRole } from '@/lib/server/guards';
import { handleRoute, jsonOk } from '@/lib/server/http';
import { historyService } from '@/lib/server/services';
import type { Marketplace } from '@sourcetool/shared';

export const GET = handleRoute(async (req, ctx: { params: Promise<{ productId: string }> }) => {
  await requireTeamRole(req, ['OWNER', 'ADMIN', 'VA', 'VIEWER']);
  const { productId } = await ctx.params;
  const url = new URL(req.url);
  const marketplace = (url.searchParams.get('marketplace') || undefined) as Marketplace | undefined;
  const days = Number(url.searchParams.get('days')) || 90;
  return jsonOk(await historyService.getBsrHistory(productId, marketplace, days));
});
