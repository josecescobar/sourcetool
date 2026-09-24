import {
  enforceBulkScanRowLimit,
  enforcePlanLimit,
  requireTeamRole,
} from '@/lib/server/guards';
import { ApiError, handleRoute, jsonOk, readJson } from '@/lib/server/http';
import { bulkScanService } from '@/lib/server/services';

export const maxDuration = 60;

export const POST = handleRoute(async (req) => {
  const { user, teamId } = await requireTeamRole(req, ['OWNER', 'ADMIN', 'VA']);
  const body = await readJson<{
    fileName: string;
    marketplace: string;
    fulfillmentType: string;
    defaultBuyPrice?: number;
    rows: Array<{ identifier: string; buyPrice?: number }>;
  }>(req);

  // Validate the upload before incrementing monthly scan quota. An empty or
  // oversized file used to burn a paid scan and then 400.
  if (!Array.isArray(body.rows) || body.rows.length === 0) {
    throw new ApiError(400, 'At least one row is required');
  }
  await enforceBulkScanRowLimit(teamId, body.rows.length);
  await enforcePlanLimit(teamId, 'bulk_scan');

  return jsonOk(await bulkScanService.create(teamId, user.id, body));
});
