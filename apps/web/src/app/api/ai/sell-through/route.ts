import { enforcePlanLimit, requireTeamRole } from '@/lib/server/guards';
import { handleRoute, jsonOk, readJson } from '@/lib/server/http';
import { aiService } from '@/lib/server/services';
import { AI_VERDICT_OFF_MESSAGE, isAIVerdictOff } from '@sourcetool/ai';

export const maxDuration = 60;

export const POST = handleRoute(async (req) => {
  const { teamId } = await requireTeamRole(req, ['OWNER', 'ADMIN', 'VA']);
  // Plan gate first. Unpaid plans must get the upgrade error, not a successful
  // aiOff status. Skip the usage increment when no verdict will run.
  const providerOff = isAIVerdictOff();
  await enforcePlanLimit(teamId, 'ai_verdict', providerOff ? { recordUsage: false } : undefined);
  if (providerOff) {
    return jsonOk({ aiOff: true, message: AI_VERDICT_OFF_MESSAGE });
  }
  const input = await readJson<{
    title: string; category?: string; bsr?: number; sellPrice: number;
    offerCount?: number; fbaOfferCount?: number; isAmazonSelling?: boolean; avgBsr30d?: number;
  }>(req);
  return jsonOk(await aiService.getSellThrough(input));
});
