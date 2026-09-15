import { ProfitCalculatorEngine } from './engines/profit-calculator.engine';
import { prisma } from '@sourcetool/db';
import type { CalculateInput, BreakevenInput, DecisionSnapshot } from '@sourcetool/shared';

/** Extra decision-time context to freeze alongside the forecast. */
export type AnalysisContext = DecisionSnapshot;

export class AnalysisService {
  constructor(private engine: ProfitCalculatorEngine) {}

  async calculate(
    input: CalculateInput,
    userId: string,
    teamId: string,
    context: AnalysisContext = {},
  ): Promise<any> {
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

    return { ...result, analysisId: analysis.id };
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
