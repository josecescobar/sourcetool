import { enforcePlanLimit, requireTeamRole } from '@/lib/server/guards';
import { handleRoute, jsonOk, readJson } from '@/lib/server/http';
import { aiService, analysisService, calibrationService } from '@/lib/server/services';
import { createLogger } from '@/lib/server/logger';
import type { DealScoreInput } from '@sourcetool/shared';

export const maxDuration = 60;

const logger = createLogger('DealScoreRoute');

export const POST = handleRoute(async (req) => {
  const { teamId } = await requireTeamRole(req, ['OWNER', 'ADMIN', 'VA']);
  await enforcePlanLimit(teamId, 'ai_verdict');
  const { analysisId, ...input } = await readJson<DealScoreInput & { analysisId?: string }>(req);

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

  const score = await aiService.getDealScore({ ...input, calibration });

  // Persist onto the analysis when the client tells us which one it scored.
  // A missing or foreign id must not fail the score itself. The persist path
  // also re-applies calibration so the score band can adjust the forecast.
  let calibrated = undefined;
  if (analysisId) {
    try {
      const persisted = await analysisService.recordVerdict(analysisId, teamId, score, {
        category: input.product?.category,
        brand: input.product?.brand,
        bsr: input.product?.bsr,
        offerCount: input.competition?.offerCount,
        fbaOfferCount: input.competition?.fbaOfferCount,
        isAmazonSelling: input.competition?.isAmazonSelling,
        rating: input.product?.rating,
        reviewCount: input.product?.reviewCount,
      });
      calibrated = persisted.calibrated;
    } catch (err) {
      logger.warn(`Could not persist verdict on ${analysisId}: ${(err as Error).message}`);
    }
  }

  if (!calibrated) {
    try {
      calibrated = await calibrationService.calibrateForecast(teamId, {
        predictedRoi: input.profitability.roi,
        predictedProfit: input.profitability.profit,
        category: input.product?.category,
        aiScore: score.score,
      });
    } catch (err) {
      logger.warn(`Post-score calibration unavailable: ${(err as Error).message}`);
    }
  }

  return jsonOk({ ...score, calibrated });
});
