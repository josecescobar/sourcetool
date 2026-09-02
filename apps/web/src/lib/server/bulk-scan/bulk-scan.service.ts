import { prisma } from '@sourcetool/db';
import { ProductsService } from '../products/products.service';
import { AnalysisService } from '../analysis/analysis.service';
import { AiService } from '../ai/ai.service';
import type { Marketplace, FulfillmentType } from '@sourcetool/shared';
import { ApiError } from '../http';
import { createLogger } from '../logger';
import { LOOKUP_BATCH_SIZE, chainNewInvocation } from '../self-invoke';

interface CreateBulkScanInput {
  fileName: string;
  marketplace: string;
  fulfillmentType: string;
  defaultBuyPrice?: number;
  rows: Array<{ identifier: string; buyPrice?: number }>;
}

export class BulkScanService {
  private readonly logger = createLogger('BulkScanService');

  constructor(
    private productsService: ProductsService,
    private analysisService: AnalysisService,
    private aiService: AiService,
  ) {}

  async create(teamId: string, userId: string, input: CreateBulkScanInput): Promise<any> {
    const scan = await prisma.$transaction(async (tx) => {
      const bulkScan = await tx.bulkScan.create({
        data: {
          teamId,
          userId,
          fileName: input.fileName,
          totalRows: input.rows.length,
          marketplace: input.marketplace as any,
          fulfillmentType: input.fulfillmentType as any,
          defaultBuyPrice: input.defaultBuyPrice,
          status: 'PENDING',
        },
      });

      await tx.bulkScanRow.createMany({
        data: input.rows.map((row, index) => ({
          bulkScanId: bulkScan.id,
          rowNumber: index + 1,
          identifier: row.identifier,
          buyPrice: row.buyPrice,
          status: 'PENDING',
        })),
      });

      return bulkScan;
    });

    this.scheduleContinue(scan.id, teamId, userId);

    return scan;
  }

  async getById(id: string): Promise<any> {
    const scan = await prisma.bulkScan.findUnique({ where: { id } });
    if (!scan) throw new ApiError(404, 'Bulk scan not found');
    return scan;
  }

  async getResults(id: string, sort?: string, filter?: string): Promise<any> {
    const where: any = { bulkScanId: id };

    if (filter === 'success') where.status = 'SUCCESS';
    else if (filter === 'failed') where.status = 'FAILED';

    let orderBy: any = { rowNumber: 'asc' };
    if (sort === 'profit') orderBy = { analysis: { profit: 'desc' } };
    else if (sort === 'roi') orderBy = { analysis: { roi: 'desc' } };

    const rows = await prisma.bulkScanRow.findMany({
      where,
      include: {
        product: { include: { listings: true } },
        analysis: true,
      },
      orderBy,
    });

    return rows;
  }

  async retryFailed(scanId: string, teamId: string, userId: string): Promise<any> {
    const scan = await prisma.bulkScan.findUnique({ where: { id: scanId } });
    if (!scan) throw new ApiError(404, 'Bulk scan not found');
    if (scan.status !== 'COMPLETED') {
      throw new ApiError(400, 'Can only retry a completed scan');
    }

    const failedCount = await prisma.bulkScanRow.count({
      where: { bulkScanId: scanId, status: 'FAILED' },
    });

    if (failedCount === 0) {
      throw new ApiError(400, 'No failed rows to retry');
    }

    await prisma.bulkScanRow.updateMany({
      where: { bulkScanId: scanId, status: 'FAILED' },
      data: { status: 'PENDING', error: null, processedAt: null },
    });

    await prisma.bulkScan.update({
      where: { id: scanId },
      data: { status: 'PROCESSING', completedAt: null },
    });
    await this.refreshScanCounts(scanId);

    this.scheduleContinue(scanId, teamId, userId);

    return prisma.bulkScan.findUnique({ where: { id: scanId } });
  }

  async delete(id: string): Promise<any> {
    return prisma.bulkScan.delete({ where: { id } });
  }

  /**
   * Process one bounded batch of PENDING rows, then hop to a new invocation
   * if work remains. Safe under Vercel maxDuration=300.
   */
  async processChunk(
    scanId: string,
    teamId: string,
    userId: string,
  ): Promise<{ processed: number; remaining: number; done: boolean }> {
    const existing = await prisma.bulkScan.findUnique({ where: { id: scanId } });
    if (!existing) return { processed: 0, remaining: 0, done: true };

    await prisma.bulkScan.update({
      where: { id: scanId },
      data: { status: 'PROCESSING', startedAt: existing.startedAt ?? new Date() },
    });

    const scan = await prisma.bulkScan.findUnique({ where: { id: scanId } });
    if (!scan) return { processed: 0, remaining: 0, done: true };

    const rows = await prisma.bulkScanRow.findMany({
      where: { bulkScanId: scanId, status: 'PENDING' },
      orderBy: { rowNumber: 'asc' },
      take: LOOKUP_BATCH_SIZE,
    });

    const productCache = new Map<string, { product: any; fromApi: boolean } | { error: string }>();
    let lookups = 0;

    for (const row of rows) {
      try {
        const buyPrice = row.buyPrice ?? scan.defaultBuyPrice;
        if (buyPrice == null) {
          throw new Error('No buy price provided');
        }

        const cacheKey = row.identifier.trim().toUpperCase();
        let cached = productCache.get(cacheKey);

        if (!cached) {
          if (lookups > 0) {
            await this.delay(1500);
          }
          lookups += 1;

          try {
            const product = await this.productsService.lookup(
              row.identifier,
              scan.marketplace as Marketplace,
            );
            cached = { product, fromApi: true };
            productCache.set(cacheKey, cached);
          } catch (err: any) {
            const errorMsg = err.message || 'Product lookup failed';
            cached = { error: errorMsg };
            productCache.set(cacheKey, cached);
          }
        }

        if ('error' in cached) {
          throw new Error(cached.error);
        }

        const product = cached.product;

        // Find sell price from listing
        const listing = product.listings?.find(
          (l: any) => l.marketplace === scan.marketplace,
        );

        const sellPrice = listing?.buyBoxPrice ?? listing?.currentPrice;
        if (!sellPrice) {
          throw new Error('No sell price available for this marketplace');
        }

        // Calculate profit
        const analysisResult = await this.analysisService.calculate(
          {
            productId: product.id,
            asin: product.asin,
            marketplace: scan.marketplace as Marketplace,
            fulfillmentType: scan.fulfillmentType as FulfillmentType,
            buyPrice,
            sellPrice,
            category: product.category ?? undefined,
            dimensions: product.dimensions as any,
          },
          userId,
          teamId,
        );

        // Update row as success
        await prisma.bulkScanRow.update({
          where: { id: row.id },
          data: {
            status: 'SUCCESS',
            productId: product.id,
            analysisId: analysisResult.analysisId,
            processedAt: new Date(),
          },
        });

      } catch (err: any) {
        this.logger.warn(`Row ${row.rowNumber} failed: ${err.message}`);

        await prisma.bulkScanRow.update({
          where: { id: row.id },
          data: {
            status: 'FAILED',
            error: err.message || 'Unknown error',
            processedAt: new Date(),
          },
        });

      }
    }

    await this.refreshScanCounts(scanId);
    const remaining = await prisma.bulkScanRow.count({
      where: { bulkScanId: scanId, status: 'PENDING' },
    });

    if (remaining > 0) {
      this.scheduleContinue(scanId, teamId, userId);
      return { processed: rows.length, remaining, done: false };
    }

    const finalScan = await prisma.bulkScan.findUnique({ where: { id: scanId } });
    const aiSummary = finalScan ? await this.generateSummary(finalScan) : null;
    await prisma.bulkScan.update({
      where: { id: scanId },
      data: { status: 'COMPLETED', completedAt: new Date(), aiSummary },
    });
    return { processed: rows.length, remaining: 0, done: true };
  }

  private async generateSummary(scan: {
    id: string;
    fileName: string;
    marketplace: string;
    fulfillmentType: string;
    totalRows: number;
    successRows: number;
    failedRows: number;
  }): Promise<string | null> {
    try {
      const successfulRows = await prisma.bulkScanRow.findMany({
        where: { bulkScanId: scan.id, status: 'SUCCESS' },
        include: { product: true, analysis: true },
      });

      const items = successfulRows
        .filter((row) => row.analysis)
        .map((row) => ({
          title: row.product?.title ?? row.identifier,
          profit: row.analysis!.profit,
          roi: row.analysis!.roi,
        }));

      if (items.length === 0) {
        return null;
      }

      const avgRoi = items.reduce((sum, i) => sum + i.roi, 0) / items.length;
      const avgProfit = items.reduce((sum, i) => sum + i.profit, 0) / items.length;
      const profitableCount = items.filter((i) => i.profit > 0).length;
      const strongBuyCount = items.filter((i) => i.roi >= 30).length;

      const topWinners = items
        .filter((i) => i.profit > 0)
        .sort((a, b) => b.profit - a.profit)
        .slice(0, 5);
      const topLosers = items
        .filter((i) => i.profit < 0)
        .sort((a, b) => a.profit - b.profit)
        .slice(0, 5);

      return await this.aiService.getBulkScanSummary({
        fileName: scan.fileName,
        marketplace: scan.marketplace,
        fulfillmentType: scan.fulfillmentType,
        totalRows: scan.totalRows,
        successRows: scan.successRows,
        failedRows: scan.failedRows,
        avgRoi,
        avgProfit,
        profitableCount,
        strongBuyCount,
        topWinners,
        topLosers,
      });
    } catch (err: any) {
      // Never let a summary failure block the scan from completing.
      this.logger.warn(`Failed to generate AI summary for scan ${scan.id}: ${err.message}`);
      return null;
    }
  }

  private scheduleContinue(scanId: string, teamId: string, userId: string) {
    chainNewInvocation(
      '/api/cron/process-bulk-scan',
      { method: 'POST', body: { scanId, teamId, userId } },
      () => this.processChunk(scanId, teamId, userId),
    );
  }

  private async refreshScanCounts(scanId: string) {
    const [successRows, failedRows] = await Promise.all([
      prisma.bulkScanRow.count({ where: { bulkScanId: scanId, status: 'SUCCESS' } }),
      prisma.bulkScanRow.count({ where: { bulkScanId: scanId, status: 'FAILED' } }),
    ]);
    await prisma.bulkScan.update({
      where: { id: scanId },
      data: {
        successRows,
        failedRows,
        processedRows: successRows + failedRows,
      },
    });
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
