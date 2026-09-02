import { enforcePlanLimit, requireTeamRole } from '@/lib/server/guards';
import { handleRoute, jsonOk, readJson } from '@/lib/server/http';
import { aiService } from '@/lib/server/services';

export const maxDuration = 60;

export const POST = handleRoute(async (req) => {
  const { teamId } = await requireTeamRole(req, ['OWNER', 'ADMIN', 'VA']);
  await enforcePlanLimit(teamId, 'ai_verdict');
  const input = await readJson<{
    title: string; category?: string; bsr?: number; sellPrice: number;
    offerCount?: number; fbaOfferCount?: number; isAmazonSelling?: boolean; avgBsr30d?: number;
  }>(req);
  return jsonOk(await aiService.getSellThrough(input));
});
