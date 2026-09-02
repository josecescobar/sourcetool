import { prisma } from '@sourcetool/db';
import type { Marketplace } from '@sourcetool/shared';
import { ProductDataChainService } from '../integrations/product-data-chain.service';
import { ProductWatchesService } from './product-watches.service';
import { createLogger } from '../logger';

const RATE_LIMIT_MS = 1500;

export type WatchCheckBatch = {
  checked: number;
  total: number;
  offset: number;
  nextOffset: number | null;
  done: boolean;
};

export class WatchCheckerService {
  private readonly logger = createLogger('WatchCheckerService');

  constructor(
    private productDataChain: ProductDataChainService,
    private watchesService: ProductWatchesService,
  ) {}

  async checkWatchedProducts(options: { offset?: number; limit?: number } = {}): Promise<WatchCheckBatch> {
    const offset = Math.max(0, options.offset ?? 0);
    const limit = options.limit ?? 40;

    this.logger.log(`Starting scheduled watch check (offset=${offset}, limit=${limit})...`);

    const watches = await prisma.productWatch.findMany({
      where: { enabled: true },
      include: {
        product: { select: { asin: true } },
      },
    });

    if (!watches.length) {
      this.logger.log('No active watches to check');
      return { checked: 0, total: 0, offset, nextOffset: null, done: true };
    }

    // Group by productId + marketplace to avoid duplicate fetches
    const groups = new Map<string, { productId: string; asin: string | null; marketplace: Marketplace }>();
    for (const w of watches) {
      const key = `${w.productId}:${w.marketplace}`;
      if (!groups.has(key)) {
        groups.set(key, {
          productId: w.productId,
          asin: w.product.asin,
          marketplace: w.marketplace as Marketplace,
        });
      }
    }

    const ordered = [...groups.values()].sort((a, b) =>
      `${a.productId}:${a.marketplace}`.localeCompare(`${b.productId}:${b.marketplace}`),
    );
    const batch = ordered.slice(offset, offset + limit);
    const nextOffset = offset + batch.length < ordered.length ? offset + batch.length : null;

    this.logger.log(
      `Checking ${batch.length}/${ordered.length} unique product-marketplace combinations (watches=${watches.length})`,
    );

    let checked = 0;
    for (const group of batch) {
      try {
        if (!group.asin) continue;

        const data = await this.productDataChain.getByAsin(
          group.asin,
          group.marketplace,
        );

        if (data?.listing) {
          const price = data.listing.currentPrice;
          const bsr = data.listing.bsr;

          // Record history
          if (price != null) {
            await prisma.priceHistory.create({
              data: {
                productId: group.productId,
                marketplace: group.marketplace,
                price,
                buyBoxPrice: data.listing.buyBoxPrice,
                recordedAt: new Date(),
              },
            });
          }

          if (bsr != null && data.listing.bsrCategory) {
            await prisma.bsrHistory.create({
              data: {
                productId: group.productId,
                marketplace: group.marketplace,
                bsr,
                category: data.listing.bsrCategory,
                recordedAt: new Date(),
              },
            });
          }

          // Check watches
          await this.watchesService.checkProduct(
            group.productId,
            group.marketplace,
            price,
            bsr,
          );
        }

        checked++;
      } catch (err) {
        this.logger.error(
          `Watch check failed for product ${group.productId}: ${err}`,
        );
      }

      // Rate limit
      await new Promise((resolve) => setTimeout(resolve, RATE_LIMIT_MS));
    }

    this.logger.log(`Watch check batch complete: ${checked}/${batch.length} (total ${ordered.length})`);
    return {
      checked,
      total: ordered.length,
      offset,
      nextOffset,
      done: nextOffset === null,
    };
  }
}
