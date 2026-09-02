import { enforcePlanLimit, requireTeamRole } from '@/lib/server/guards';
import { handleRoute, jsonOk } from '@/lib/server/http';
import { productsService } from '@/lib/server/services';
import type { Marketplace } from '@sourcetool/shared';

export const GET = handleRoute(async (req) => {
  const { teamId } = await requireTeamRole(req, ['OWNER', 'ADMIN', 'VA', 'VIEWER']);
  await enforcePlanLimit(teamId, 'lookup');
  const url = new URL(req.url);
  const identifier = url.searchParams.get('identifier') || '';
  const marketplace = (url.searchParams.get('marketplace') || undefined) as Marketplace | undefined;
  return jsonOk(await productsService.lookup(identifier, marketplace));
});
