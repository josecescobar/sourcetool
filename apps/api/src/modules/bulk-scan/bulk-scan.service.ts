import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { prisma } from '@sourcetool/db';
import { ProductsService } from '../products/products.service';
import { AnalysisService } from '../analysis/analysis.service';
import type { Marketplace, FulfillmentType } from '@sourcetool/shared';

interface CreateBulkScanInput {
  fileName: string;
  marketplace: string;
  fulfillmentType: string;
  defaultBuyPrice?: number;
  rows: Array<{ identifier: string; buyPrice?: number }>;
}

@Injectable()
export class BulkScanService {
  private readonly logger = new Logger(BulkScanService.name);

  constructor(
    private productsService: ProductsService,
    private analysisService: AnalysisService,
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

    // Fire-and-forget async processing
    this.processAsync(scan.id, teamId, userId).catch((err) => {
      this.logger.error(`Bulk scan ${scan.id} processing failed: ${err.message}`);
    });

    return scan;
  }

  async getById(id: string): Promise<any> {
    const scan = await prisma.bulkScan.findUnique({ where: { id } });
    if (!scan) throw new NotFoundException('Bulk scan not found');
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
    if (!scan) throw new NotFoundException('Bulk scan not found');
    if (scan.status !== 'COMPLETED') {
      throw new BadRequestException('Can only retry a completed scan');
    }

    const failedRows = await prisma.bulkScanRow.findMany({
      where: { bulkScanId: scanId, status: 'FAILED' },
      orderBy: { rowNumber: 'asc' },
    });

    if (failedRows.length === 0) {
      throw new BadRequestException('No failed rows to retry');
    }

    await prisma.bulkScan.update({
      where: { id: scanId },
      data: { status: 'PROCESSING' },
    });

    // Fire-and-forget
    this.processRetryAsync(scanId, teamId, userId, failedRows).catch((err) => {
      this.logger.error(`Bulk scan retry ${scanId} failed: ${err.message}`);
    });

    return prisma.bulkScan.findUnique({ where: { id: scanId } });
  }

  async delete(id: string): Promise<any> {
    return prisma.bulkScan.delete({ where: { id } });
  }

  // ─── Private ──────────────────────────────────────────────────────

  private async processAsync(scanId: string, teamId: string, userId: string): Promise<void> {
    await prisma.bulkScan.update({
      where: { id: scanId },
      data: { status: 'PROCESSING', startedAt: new Date() },
    });

    const scan = await prisma.bulkScan.findUnique({ where: { id: scanId } });
    if (!scan) return;

    const rows = await prisma.bulkScanRow.findMany({
      where: { bulkScanId: scanId },
      orderBy: { rowNumber: 'asc' },
    });

    // In-memory cache to dedup API calls for identical identifiers
    const productCache = new Map<string, { product: any; fromApi: boolean } | { error: string }>();

    for (const row of rows) {
      try {
        const buyPrice = row.buyPrice ?? scan.defaultBuyPrice;
        if (buyPrice == null) {
          throw new Error('No buy price provided');
        }

        const cacheKey = row.identifier.trim().toUpperCase();
        let cached = productCache.get(cacheKey);

        if (!cached) {
          // Fresh lookup needed — rate limit
          const needsDelay = productCache.size > 0; // not the first call
          if (needsDelay) {
            await this.delay(1500);
          }

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

        await prisma.bulkScan.update({
          where: { id: scanId },
          data: {
            processedRows: { increment: 1 },
            successRows: { increment: 1 },
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

        await prisma.bulkScan.update({
          where: { id: scanId },
          data: {
            processedRows: { increment: 1 },
            failedRows: { increment: 1 },
          },
        });
      }
    }

    // Mark scan as completed
    await prisma.bulkScan.update({
      where: { id: scanId },
      data: { status: 'COMPLETED', completedAt: new Date() },
    });
  }

  private async processRetryAsync(
    scanId: string,
    teamId: string,
    userId: string,
    failedRows: Array<{ id: string; rowNumber: number; identifier: string; buyPrice: any }>,
  ): Promise<void> {
    const scan = await prisma.bulkScan.findUnique({ where: { id: scanId } });
    if (!scan) return;

    for (let i = 0; i < failedRows.length; i++) {
      const row = failedRows[i]!;
      try {
        const buyPrice = row.buyPrice ?? scan.defaultBuyPrice;
        if (buyPrice == null) {
          throw new Error('No buy price provided');
        }

        if (i > 0) {
          await this.delay(1500);
        }

        const product = await this.productsService.lookup(
          row.identifier,
          scan.marketplace as Marketplace,
        );

        const listing = product.listings?.find(
          (l: any) => l.marketplace === scan.marketplace,
        );

        const sellPrice = listing?.buyBoxPrice ?? listing?.currentPrice;
        if (!sellPrice) {
          throw new Error('No sell price available for this marketplace');
        }

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

        await prisma.bulkScanRow.update({
          where: { id: row.id },
          data: {
            status: 'SUCCESS',
            productId: product.id,
            analysisId: analysisResult.analysisId,
            error: null,
            processedAt: new Date(),
          },
        });

        await prisma.bulkScan.update({
          where: { id: scanId },
          data: {
            successRows: { increment: 1 },
            failedRows: { decrement: 1 },
          },
        });
      } catch (err: any) {
        this.logger.warn(`Retry row ${row.rowNumber} failed: ${err.message}`);

        await prisma.bulkScanRow.update({
          where: { id: row.id },
          data: {
            error: err.message || 'Unknown error',
            processedAt: new Date(),
          },
        });
      }
    }

    await prisma.bulkScan.update({
      where: { id: scanId },
      data: { status: 'COMPLETED' },
    });
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
