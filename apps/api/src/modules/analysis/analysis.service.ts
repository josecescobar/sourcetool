import { Injectable } from '@nestjs/common';
import { ProfitCalculatorEngine } from './engines/profit-calculator.engine';
import { prisma } from '@sourcetool/db';
import type { CalculateInput, BreakevenInput } from '@sourcetool/shared';

@Injectable()
export class AnalysisService {
  constructor(private engine: ProfitCalculatorEngine) {}

  async calculate(input: CalculateInput, userId: string, teamId: string): Promise<any> {
    const result = this.engine.calculate(input);

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
