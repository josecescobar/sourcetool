import { enforcePlanLimit, requireTeamRole } from '@/lib/server/guards';
import { handleRoute, jsonOk, readJson } from '@/lib/server/http';
import { bulkScanService } from '@/lib/server/services';

export const maxDuration = 60;

export const POST = handleRoute(async (req) => {
  const { user, teamId } = await requireTeamRole(req, ['OWNER', 'ADMIN', 'VA']);
  await enforcePlanLimit(teamId, 'bulk_scan');
  const body = await readJson<{
    fileName: string;
    marketplace: string;
    fulfillmentType: string;
    defaultBuyPrice?: number;
    rows: Array<{ identifier: string; buyPrice?: number }>;
  }>(req);
  return jsonOk(await bulkScanService.create(teamId, user.id, body));
});
