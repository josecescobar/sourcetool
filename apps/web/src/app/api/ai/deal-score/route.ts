import { enforcePlanLimit, requireTeamRole } from '@/lib/server/guards';
import { handleRoute, jsonOk, readJson } from '@/lib/server/http';
import { aiService, calibrationService } from '@/lib/server/services';
import { createLogger } from '@/lib/server/logger';
import type { DealScoreInput } from '@sourcetool/shared';

export const maxDuration = 60;

const logger = createLogger('DealScoreRoute');

export const POST = handleRoute(async (req) => {
  const { teamId } = await requireTeamRole(req, ['OWNER', 'ADMIN', 'VA']);
  await enforcePlanLimit(teamId, 'ai_verdict');
  const input = await readJson<DealScoreInput>(req);

  // Close the loop: score this deal against what this seller actually realizes,
  // not just the raw numbers. A missing track record must never block scoring.
  let calibration: string | undefined;
  try {
    calibration = await calibrationService.getCalibrationBrief(teamId, {
      category: input.product?.category,
    });
  } catch (err) {
    logger.warn(`Calibration context unavailable: ${(err as Error).message}`);
  }

  return jsonOk(await aiService.getDealScore({ ...input, calibration }));
});
