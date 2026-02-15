import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { prisma } from '@sourcetool/db';
import type { Marketplace } from '@sourcetool/shared';
import { ProductDataChainService } from '../integrations/product-data-chain.service';
import { ProductWatchesService } from './product-watches.service';

const RATE_LIMIT_MS = 1500;

@Injectable()
export class WatchCheckerService {
  private readonly logger = new Logger(WatchCheckerService.name);

  constructor(
    private productDataChain: ProductDataChainService,
    private watchesService: ProductWatchesService,
  ) {}

  @Cron('0 */6 * * *')
  async checkWatchedProducts() {
    this.logger.log('Starting scheduled watch check...');

    const watches = await prisma.productWatch.findMany({
      where: { enabled: true },
      include: {
        product: { select: { asin: true } },
      },
    });

    if (!watches.length) {
      this.logger.log('No active watches to check');
      return;
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

    this.logger.log(
      `Checking ${groups.size} unique product-marketplace combinations for ${watches.length} watches`,
    );

    let checked = 0;
    for (const [, group] of groups) {
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

    this.logger.log(`Watch check complete: ${checked}/${groups.size} products checked`);
  }
}
