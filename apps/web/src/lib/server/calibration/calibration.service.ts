import { prisma } from '@sourcetool/db';
import type {
  CalibratedForecast,
  CalibrationSummary,
  DealVerdict,
  ResolvedOutcome,
} from '@sourcetool/shared';
import { applyCalibration, buildCalibrationBrief, buildCalibrationSummary } from './calibration.engine';

const MS_PER_DAY = 1000 * 60 * 60 * 24;

export interface CalibrationReport extends CalibrationSummary {
  /**
   * Sold units that carry no analysis link, so they cannot be scored. Surfaced
   * so the dashboard can explain why the sample is smaller than the sales count.
   */
  unlinkedSoldCount: number;
}

export class CalibrationService {
  /**
   * A forecast is only comparable to an outcome when the unit actually sold and
   * we know which analysis justified the buy.
   */
  async getResolvedOutcomes(teamId: string): Promise<ResolvedOutcome[]> {
    const sold = await prisma.sourcedProduct.findMany({
      where: {
        teamId,
        soldDate: { not: null },
        analysisId: { not: null },
        actualRoi: { not: null },
      },
      include: {
        analysis: true,
        product: { select: { category: true } },
      },
      orderBy: { soldDate: 'desc' },
    });

    return sold.flatMap((row) => {
      const analysis = row.analysis;
      if (!analysis) return [];

      const snapshot = (analysis.snapshot ?? {}) as { category?: string };
      const quantity = row.quantity > 0 ? row.quantity : 1;

      return [
        {
          predictedProfit: analysis.profit,
          predictedRoi: analysis.roi,
          // actualProfit is booked across the whole lot; the forecast is per unit.
          realizedProfit: (row.actualProfit ?? 0) / quantity,
          realizedRoi: row.actualRoi ?? 0,
          category: snapshot.category ?? row.product.category ?? undefined,
          aiScore: analysis.aiScore ?? undefined,
          aiVerdict: (analysis.aiVerdict as DealVerdict | null) ?? undefined,
          daysToSell: daysBetween(row.purchaseDate, row.soldDate),
        },
      ];
    });
  }

  async getReport(teamId: string): Promise<CalibrationReport> {
    const [outcomes, unlinkedSoldCount] = await Promise.all([
      this.getResolvedOutcomes(teamId),
      prisma.sourcedProduct.count({
        where: { teamId, soldDate: { not: null }, analysisId: null },
      }),
    ]);

    return { ...buildCalibrationSummary(outcomes), unlinkedSoldCount };
  }

  async calibrateForecast(
    teamId: string,
    forecast: {
      predictedRoi: number;
      predictedProfit: number;
      category?: string;
      aiScore?: number;
    },
  ): Promise<CalibratedForecast> {
    const summary = buildCalibrationSummary(await this.getResolvedOutcomes(teamId));
    return applyCalibration(forecast, summary);
  }

  /** Prompt context for the deal scorer, or undefined when history is too thin. */
  async getCalibrationBrief(
    teamId: string,
    context: { category?: string } = {},
  ): Promise<string | undefined> {
    const summary = buildCalibrationSummary(await this.getResolvedOutcomes(teamId));
    return buildCalibrationBrief(summary, context);
  }

  /**
   * Attach a purchase to the analysis that most plausibly drove it: the latest
   * one for the same product and team at or just before the purchase date. The
   * grace window covers date-only purchase dates entered after the fact.
   */
  async findLikelyAnalysisId(
    teamId: string,
    productId: string,
    purchaseDate: Date,
  ): Promise<string | null> {
    const cutoff = new Date(purchaseDate.getTime() + MS_PER_DAY);
    const analysis = await prisma.productAnalysis.findFirst({
      where: { teamId, productId, createdAt: { lte: cutoff } },
      orderBy: { createdAt: 'desc' },
      select: { id: true },
    });
    return analysis?.id ?? null;
  }
}

function daysBetween(from: Date, to: Date | null): number | undefined {
  if (!to) return undefined;
  const days = Math.round((to.getTime() - from.getTime()) / MS_PER_DAY);
  return days >= 0 ? days : undefined;
}
