import { requireTeamRole } from '@/lib/server/guards';
import { handleRoute, jsonOk, readJson } from '@/lib/server/http';
import { analysisService } from '@/lib/server/services';
import type { CalculateInput } from '@sourcetool/shared';

export const POST = handleRoute(async (req) => {
  await requireTeamRole(req, ['OWNER', 'ADMIN', 'VA']);
  const input = await readJson<CalculateInput>(req);
  return jsonOk(analysisService.scenario(input));
});
