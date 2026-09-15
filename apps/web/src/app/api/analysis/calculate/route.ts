import { requireTeamRole } from '@/lib/server/guards';
import { handleRoute, jsonOk, readJson } from '@/lib/server/http';
import { analysisService } from '@/lib/server/services';
import type { CalculateInput } from '@sourcetool/shared';

export const POST = handleRoute(async (req) => {
  const { user, teamId } = await requireTeamRole(req, ['OWNER', 'ADMIN', 'VA']);
  const input = await readJson<CalculateInput>(req);
  return jsonOk(await analysisService.calculate(input, user.id, teamId));
});
