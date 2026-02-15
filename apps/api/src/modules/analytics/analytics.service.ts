import { Injectable } from '@nestjs/common';
import { prisma, Prisma } from '@sourcetool/db';

@Injectable()
export class AnalyticsService {
  private buildDateFilter(startDate?: string, endDate?: string) {
    const now = new Date();
    const end = endDate ? new Date(endDate) : now;
    const start = startDate
      ? new Date(startDate)
      : new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    return { gte: start, lte: end };
  }

  async getSummary(teamId: string, startDate?: string, endDate?: string) {
    const createdAt = this.buildDateFilter(startDate, endDate);
    const where = { teamId, createdAt };

    const [agg, profitableCount, unprofitableCount] = await Promise.all([
      prisma.productAnalysis.aggregate({
        where,
        _count: true,
        _sum: { profit: true },
        _avg: { roi: true, margin: true },
      }),
      prisma.productAnalysis.count({ where: { ...where, profit: { gt: 0 } } }),
      prisma.productAnalysis.count({
        where: { ...where, profit: { lte: 0 } },
      }),
    ]);

    return {
      totalAnalyses: agg._count,
      totalProfit: +(agg._sum.profit ?? 0).toFixed(2),
      avgRoi: +(agg._avg.roi ?? 0).toFixed(1),
      avgMargin: +(agg._avg.margin ?? 0).toFixed(1),
      profitableCount,
      unprofitableCount,
    };
  }

  async getProfitOverTime(
    teamId: string,
    startDate?: string,
    endDate?: string,
  ) {
    const createdAt = this.buildDateFilter(startDate, endDate);

    const rows = await prisma.$queryRaw<
      { date: Date; totalProfit: number; avgRoi: number; count: bigint }[]
    >(Prisma.sql`
      SELECT
        DATE("createdAt") as date,
        SUM(profit)::float as "totalProfit",
        AVG(roi)::float as "avgRoi",
        COUNT(*)::bigint as count
      FROM "ProductAnalysis"
      WHERE "teamId" = ${teamId}
        AND "createdAt" >= ${createdAt.gte}
        AND "createdAt" <= ${createdAt.lte}
      GROUP BY DATE("createdAt")
      ORDER BY date ASC
    `);

    return rows.map((r) => ({
      date: r.date,
      totalProfit: +Number(r.totalProfit).toFixed(2),
      avgRoi: +Number(r.avgRoi).toFixed(1),
      count: Number(r.count),
    }));
  }

  async getMarketplaceBreakdown(
    teamId: string,
    startDate?: string,
    endDate?: string,
  ) {
    const createdAt = this.buildDateFilter(startDate, endDate);

    const groups = await prisma.productAnalysis.groupBy({
      by: ['marketplace'],
      where: { teamId, createdAt },
      _sum: { profit: true },
      _avg: { roi: true, margin: true },
      _count: true,
    });

    return groups.map((g) => ({
      marketplace: g.marketplace,
      totalProfit: +(g._sum.profit ?? 0).toFixed(2),
      avgRoi: +(g._avg.roi ?? 0).toFixed(1),
      avgMargin: +(g._avg.margin ?? 0).toFixed(1),
      count: g._count,
    }));
  }

  async getTopProducts(
    teamId: string,
    startDate?: string,
    endDate?: string,
    limit = 10,
  ) {
    const createdAt = this.buildDateFilter(startDate, endDate);

    const groups = await prisma.productAnalysis.groupBy({
      by: ['productId'],
      where: { teamId, createdAt },
      _sum: { profit: true },
      _avg: { roi: true },
      _count: true,
      orderBy: { _sum: { profit: 'desc' } },
      take: limit,
    });

    const productIds = groups.map((g) => g.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, title: true, asin: true, imageUrl: true },
    });

    const productMap = new Map(products.map((p) => [p.id, p]));

    return groups.map((g) => ({
      productId: g.productId,
      title: productMap.get(g.productId)?.title ?? 'Unknown',
      asin: productMap.get(g.productId)?.asin ?? null,
      imageUrl: productMap.get(g.productId)?.imageUrl ?? null,
      totalProfit: +(g._sum.profit ?? 0).toFixed(2),
      avgRoi: +(g._avg.roi ?? 0).toFixed(1),
      count: g._count,
    }));
  }

  async getRecentAnalyses(teamId: string, limit = 10) {
    const analyses = await prisma.productAnalysis.findMany({
      where: { teamId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        product: {
          select: { title: true, asin: true, imageUrl: true },
        },
      },
    });

    return analyses.map((a) => ({
      id: a.id,
      product: a.product,
      marketplace: a.marketplace,
      fulfillmentType: a.fulfillmentType,
      buyPrice: a.buyPrice,
      sellPrice: a.sellPrice,
      profit: a.profit,
      roi: a.roi,
      margin: a.margin,
      totalFees: a.totalFees,
      createdAt: a.createdAt,
    }));
  }
}
