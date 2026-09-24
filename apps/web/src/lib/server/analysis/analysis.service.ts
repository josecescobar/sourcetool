import { ProfitCalculatorEngine } from './engines/profit-calculator.engine';
import { prisma } from '@sourcetool/db';
import type {
  CalculateInput,
  CalculateResult,
  BreakevenInput,
  DecisionSnapshot,
} from '@sourcetool/shared';
import { ApiError } from '../http';
import type { CalibrationService } from '../calibration/calibration.service';

/** Extra decision-time context to freeze alongside the forecast. */
export type AnalysisContext = DecisionSnapshot;

export class AnalysisService {
  constructor(
    private engine: ProfitCalculatorEngine,
    private calibrationService?: CalibrationService,
  ) {}

  async calculate(
    input: CalculateInput,
    userId: string,
    teamId: string,
    context: AnalysisContext = {},
  ): Promise<CalculateResult> {
    const result = this.engine.calculate(input);

    const snapshot = buildSnapshot(input, context);

    // Save analysis to DB
    const analysis = await prisma.productAnalysis.create({
      data: {
        productId: input.productId || 'unknown',
        teamId,
        userId,
        marketplace: input.marketplace,
        fulfillmentType: input.fulfillmentType,
        buyPrice: result.buyPrice,
        sellPrice: result.sellPrice,
        referralFee: result.fees.referralFee,
        fulfillmentFee: result.fees.fulfillmentFee,
        storageFee: result.fees.storageFee,
        prepFee: result.fees.prepFee,
        inboundShipping: result.fees.inboundShipping,
        totalFees: result.fees.totalFees,
        profit: result.profit,
        roi: result.roi,
        margin: result.margin,
        breakeven: result.breakeven,
        aiScore: context.aiScore,
        aiVerdict: context.aiVerdict,
        snapshot: snapshot as object,
      },
    });

    const payload: CalculateResult = { ...result, analysisId: analysis.id };

    // A buy decision must still return numbers if the track-record query fails.
    if (this.calibrationService) {
      try {
        payload.calibrated = await this.calibrationService.calibrateForecast(teamId, {
          predictedRoi: result.roi,
          predictedProfit: result.profit,
          category: snapshot.category,
          aiScore: context.aiScore,
        });
      } catch {
        // leave calibrated unset
      }
    }

    return payload;
  }

  calculateBreakeven(input: BreakevenInput) {
    return { breakeven: this.engine.calculateBreakevenPrice(input) };
  }

  scenario(input: CalculateInput) {
    return this.engine.scenario(input);
  }

  async getHistory(teamId: string, page = 1, limit = 20): Promise<any> {
    const skip = (page - 1) * limit;
    const [analyses, total] = await Promise.all([
      prisma.productAnalysis.findMany({
        where: { teamId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: { product: true },
      }),
      prisma.productAnalysis.count({ where: { teamId } }),
    ]);

    return {
      data: analyses,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  /**
   * Write a deal-score result onto the analysis that produced the numbers.
   * Without this, dashboard/extension verdicts live only in component state
   * and byScoreBand never fills in.
   */
  async recordVerdict(
    analysisId: string,
    teamId: string,
    verdict: {
      score: number;
      verdict: DecisionSnapshot['aiVerdict'];
      reasoning?: string;
      confidence?: number;
    },
    extras: AnalysisContext = {},
  ) {
    const existing = await prisma.productAnalysis.findFirst({
      where: { id: analysisId, teamId },
    });
    if (!existing) throw new ApiError(404, 'Analysis not found');

    const previous = (existing.snapshot ?? {}) as DecisionSnapshot;
    const snapshot = buildSnapshot(
      { category: existing.snapshot ? previous.category : undefined } as CalculateInput,
      {
        ...previous,
        ...extras,
        aiScore: verdict.score,
        aiVerdict: verdict.verdict,
        aiConfidence: verdict.confidence,
      },
    );

    const updated = await prisma.productAnalysis.update({
      where: { id: analysisId },
      data: {
        aiScore: verdict.score,
        aiVerdict: verdict.verdict,
        aiReasoning: verdict.reasoning,
        snapshot: snapshot as object,
      },
    });

    // Re-apply now that we have a score — byScoreBand can finally win.
    let calibrated;
    if (this.calibrationService) {
      try {
        calibrated = await this.calibrationService.calibrateForecast(teamId, {
          predictedRoi: existing.roi,
          predictedProfit: existing.profit,
          category: snapshot.category,
          aiScore: verdict.score,
        });
      } catch {
        // verdict persist already succeeded
      }
    }

    return { analysis: updated, calibrated };
  }
}

/**
 * Only defined fields are kept: a snapshot full of nulls would make it
 * impossible to tell "we knew the BSR was absent" from "we never recorded it".
 */
function buildSnapshot(input: CalculateInput, context: AnalysisContext): DecisionSnapshot {
  const snapshot: DecisionSnapshot = {
    category: context.category ?? input.category,
    brand: context.brand,
    bsr: context.bsr,
    offerCount: context.offerCount,
    fbaOfferCount: context.fbaOfferCount,
    isAmazonSelling: context.isAmazonSelling,
    rating: context.rating,
    reviewCount: context.reviewCount,
    aiScore: context.aiScore,
    aiVerdict: context.aiVerdict,
    aiConfidence: context.aiConfidence,
  };

  for (const key of Object.keys(snapshot) as Array<keyof DecisionSnapshot>) {
    if (snapshot[key] === undefined) delete snapshot[key];
  }

  return snapshot;
}
