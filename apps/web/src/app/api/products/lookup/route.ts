import { enforcePlanLimit, requireTeamRole } from '@/lib/server/guards';
import { handleRoute, jsonOk, readJson } from '@/lib/server/http';
import { productsService } from '@/lib/server/services';
import type { Marketplace } from '@sourcetool/shared';

async function lookupFromRequest(req: Request, identifier: string, marketplace?: Marketplace) {
  const { teamId } = await requireTeamRole(req, ['OWNER', 'ADMIN', 'VA', 'VIEWER']);
  await enforcePlanLimit(teamId, 'lookup');
  return jsonOk(await productsService.lookup(identifier, marketplace));
}

export const GET = handleRoute(async (req) => {
  const url = new URL(req.url);
  const identifier = url.searchParams.get('identifier') || '';
  const marketplace = (url.searchParams.get('marketplace') || undefined) as Marketplace | undefined;
  return lookupFromRequest(req, identifier, marketplace);
});

// Dashboard sourced-products / alerts pages POST { identifier } even though Nest only
// exposed GET. Accept both so those screens work against the Vercel API.
export const POST = handleRoute(async (req) => {
  const body = await readJson<{ identifier?: string; marketplace?: Marketplace }>(req);
  return lookupFromRequest(req, body.identifier || '', body.marketplace);
});
