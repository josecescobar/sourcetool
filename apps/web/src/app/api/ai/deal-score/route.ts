import { enforcePlanLimit, requireTeamRole } from '@/lib/server/guards';
import { handleRoute, jsonOk, readJson } from '@/lib/server/http';
import { aiService } from '@/lib/server/services';
import type { DealScoreInput } from '@sourcetool/shared';

export const maxDuration = 60;

export const POST = handleRoute(async (req) => {
  const { teamId } = await requireTeamRole(req, ['OWNER', 'ADMIN', 'VA']);
  await enforcePlanLimit(teamId, 'ai_verdict');
  const input = await readJson<DealScoreInput>(req);
  return jsonOk(await aiService.getDealScore(input));
});
