import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { prisma, AlertType } from '@sourcetool/db';
import { detectIdentifier } from '@sourcetool/shared';
import type { Marketplace } from '@sourcetool/shared';
import { ProductDataChainService } from '../integrations/product-data-chain.service';
import { STALENESS_THRESHOLD_MS } from '../integrations/rainforest/rainforest.constants';
import type { ExternalProductData } from '../integrations/interfaces/product-data-provider.interface';
import { ProductWatchesService } from '../product-watches/product-watches.service';
import { AiService } from '../ai/ai.service';
import { isOversizeDimensions } from '../analysis/fee-tables/amazon-storage-fees';

@Injectable()
export class ProductsService {
  private readonly logger = new Logger(ProductsService.name);

  constructor(
    private productDataChain: ProductDataChainService,
    private productWatches: ProductWatchesService,
    private aiService: AiService,
  ) {}

  async lookup(identifier: string, marketplace?: Marketplace): Promise<any> {
    const detected = detectIdentifier(identifier);

    let product;

    switch (detected.type) {
      case 'ASIN':
        product = await prisma.product.findUnique({
          where: { asin: detected.value },
          include: { listings: true, alerts: true },
        });
        break;
      case 'UPC':
        product = await prisma.product.findFirst({
          where: { upc: detected.value },
          include: { listings: true, alerts: true },
        });
        break;
      case 'EAN':
        product = await prisma.product.findFirst({
          where: { ean: detected.value },
          include: { listings: true, alerts: true },
        });
        break;
      default:
        throw new NotFoundException(`Could not resolve identifier: ${identifier}`);
    }

    const mp = (marketplace ?? detected.marketplace ?? 'AMAZON_US') as Marketplace;

    // Found in DB — check freshness
    if (product) {
      const listing = product.listings?.find(
        (l: any) => l.marketplace === mp,
      );
      if (listing && !this.isStale(listing.lastFetchedAt)) {
        return product;
      }
      // Stale or missing listing for this marketplace — return cached, refresh in background
      this.refreshProductAsync(detected.value, detected.type, mp);
      return product;
    }

    // Not in DB — fetch from external API
    const external = await this.fetchFromExternal(
      detected.value,
      detected.type,
      mp,
    );

    if (!external) {
      throw new NotFoundException(`Product not found: ${identifier}`);
    }

    return this.persistExternalProduct(external);
  }

  async getById(id: string): Promise<any> {
    const product = await prisma.product.findUnique({
      where: { id },
      include: { listings: true, alerts: true },
    });
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  async getListings(id: string): Promise<any> {
    return prisma.marketplaceListing.findMany({
      where: { productId: id },
    });
  }

  async crossMatch(identifier: string): Promise<any> {
    const detected = detectIdentifier(identifier);
    let product;
    if (detected.type === 'ASIN') {
      product = await prisma.product.findUnique({ where: { asin: detected.value } });
    }
    if (!product) throw new NotFoundException('Product not found for cross-matching');

    const listings = await prisma.marketplaceListing.findMany({
      where: { productId: product.id },
    });

    return { product, listings };
  }

  async compare(asins: string[], teamId: string): Promise<any> {
    const unique = [...new Set(asins.map((a) => a.trim().toUpperCase()))];
    if (unique.length < 2 || unique.length > 3) {
      throw new BadRequestException('Provide 2 or 3 ASINs to compare');
    }

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const products = await Promise.all(
      unique.map(async (asin) => {
        const product = await this.lookup(asin);
        const listing = product.listings?.[0] || null;

        const [analysis, priceHistory, bsrHistory] = await Promise.all([
          prisma.productAnalysis.findFirst({
            where: { productId: product.id, teamId },
            orderBy: { createdAt: 'desc' },
          }),
          prisma.priceHistory.findMany({
            where: { productId: product.id, recordedAt: { gte: thirtyDaysAgo } },
            orderBy: { recordedAt: 'asc' },
          }),
          prisma.bsrHistory.findMany({
            where: { productId: product.id, recordedAt: { gte: thirtyDaysAgo } },
            orderBy: { recordedAt: 'asc' },
          }),
        ]);

        return { product, listing, analysis, priceHistory, bsrHistory };
      }),
    );

    return { products };
  }

  // ─── Private helpers ──────────────────────────────────────────────

  private async fetchFromExternal(
    value: string,
    type: 'ASIN' | 'UPC' | 'EAN',
    marketplace: Marketplace,
  ): Promise<ExternalProductData | null> {
    if (type === 'ASIN') {
      return this.productDataChain.getByAsin(value, marketplace);
    }
    return this.productDataChain.searchByBarcode(value, type, marketplace);
  }

  private async persistExternalProduct(
    data: ExternalProductData,
  ): Promise<any> {
    const product = await prisma.product.upsert({
      where: { asin: data.asin ?? '' },
      update: {
        title: data.title,
        brand: data.brand,
        category: data.category,
        imageUrl: data.imageUrl,
        upc: data.upc,
        ean: data.ean,
        dimensions: data.dimensions as any,
      },
      create: {
        asin: data.asin,
        upc: data.upc,
        ean: data.ean,
        title: data.title,
        brand: data.brand,
        category: data.category,
        imageUrl: data.imageUrl,
        dimensions: data.dimensions as any,
      },
      include: { listings: true, alerts: true },
    });

    if (data.listing) {
      await prisma.marketplaceListing.upsert({
        where: {
          productId_marketplace: {
            productId: product.id,
            marketplace: data.listing.marketplace,
          },
        },
        update: {
          marketplaceId: data.listing.marketplaceId,
          currentPrice: data.listing.currentPrice,
          buyBoxPrice: data.listing.buyBoxPrice,
          bsr: data.listing.bsr,
          bsrCategory: data.listing.bsrCategory,
          offerCount: data.listing.offerCount,
          fbaOfferCount: data.listing.fbaOfferCount,
          isAmazonSelling: data.listing.isAmazonSelling,
          rating: data.listing.rating,
          reviewCount: data.listing.reviewCount,
          lastFetchedAt: new Date(),
        },
        create: {
          productId: product.id,
          marketplace: data.listing.marketplace,
          marketplaceId: data.listing.marketplaceId,
          currentPrice: data.listing.currentPrice,
          buyBoxPrice: data.listing.buyBoxPrice,
          bsr: data.listing.bsr,
          bsrCategory: data.listing.bsrCategory,
          offerCount: data.listing.offerCount,
          fbaOfferCount: data.listing.fbaOfferCount,
          isAmazonSelling: data.listing.isAmazonSelling,
          rating: data.listing.rating,
          reviewCount: data.listing.reviewCount,
          lastFetchedAt: new Date(),
        },
      });

      // Record history and check watches (fire-and-forget)
      this.recordHistoryAndCheckWatches(
        product.id,
        data.listing.marketplace,
        data.listing.currentPrice,
        data.listing.buyBoxPrice,
        data.listing.bsr,
        data.listing.bsrCategory,
      ).catch((err) => {
        this.logger.error(`History/watch check failed: ${err}`);
      });
    }

    await this.generateAlertsIfNeeded(product);

    // Re-fetch so callers see any freshly-created listing/alerts
    return prisma.product.findUnique({
      where: { id: product.id },
      include: { listings: true, alerts: true },
    });
  }

  // Generate risk-flag alerts the first time we see a product; skipped once
  // it already has alerts so we don't re-call AI on every refresh.
  private async generateAlertsIfNeeded(product: {
    id: string;
    title: string;
    brand: string | null;
    category: string | null;
    dimensions: unknown;
    alerts?: unknown[];
  }): Promise<void> {
    if (product.alerts && product.alerts.length > 0) {
      return;
    }

    const existingCount = await prisma.alert.count({ where: { productId: product.id } });
    if (existingCount > 0) {
      return;
    }

    const alertsToCreate: Array<{
      productId: string;
      alertType: AlertType;
      severity: number;
      title: string;
      description?: string;
      source: string;
    }> = [];

    // Rule-based: oversize is a deterministic fact from dimensions, not an AI guess.
    const dims = product.dimensions as
      | { lengthInches: number; widthInches: number; heightInches: number; weightPounds: number }
      | null
      | undefined;
    if (dims && isOversizeDimensions(dims)) {
      alertsToCreate.push({
        productId: product.id,
        alertType: AlertType.OVERSIZED,
        severity: 2,
        title: 'Oversize item',
        description: 'Dimensions/weight exceed Amazon standard-size thresholds — expect higher fulfillment and storage fees.',
        source: 'RULE_BASED',
      });
    }

    // AI-inferred: risks that need judgment from the product's text, not raw data.
    try {
      const flags = await this.aiService.getRiskFlags({
        title: product.title,
        brand: product.brand ?? undefined,
        category: product.category ?? undefined,
      });

      const flagToAlert: Array<[keyof typeof flags, AlertType, number, string]> = [
        ['ipComplaints', AlertType.IP_COMPLAINT, 4, 'Potential IP complaint risk'],
        ['hazmat', AlertType.HAZMAT, 5, 'Likely hazmat'],
        ['restricted', AlertType.RESTRICTED, 4, 'Likely restricted category'],
        ['meltable', AlertType.MELTABLE, 2, 'Heat-sensitive product'],
        ['privateLabel', AlertType.PRIVATE_LABEL, 1, 'Likely private-label brand'],
      ];

      for (const [key, alertType, severity, title] of flagToAlert) {
        const result = flags[key];
        if (result?.flagged) {
          alertsToCreate.push({
            productId: product.id,
            alertType,
            severity,
            title,
            description: result.reason,
            source: 'AI_INFERENCE',
          });
        }
      }
    } catch (err: any) {
      this.logger.warn(`Risk flag inference failed for product ${product.id}: ${err.message}`);
    }

    if (alertsToCreate.length > 0) {
      await prisma.alert.createMany({ data: alertsToCreate });
    }
  }

  private refreshProductAsync(
    value: string,
    type: 'ASIN' | 'UPC' | 'EAN',
    marketplace: Marketplace,
  ): void {
    this.fetchFromExternal(value, type, marketplace)
      .then((data) => {
        if (data) return this.persistExternalProduct(data);
      })
      .catch((err) => {
        this.logger.error(`Background refresh failed for ${value}: ${err}`);
      });
  }

  private isStale(lastFetchedAt: Date | null | undefined): boolean {
    if (!lastFetchedAt) return true;
    return Date.now() - lastFetchedAt.getTime() > STALENESS_THRESHOLD_MS;
  }

  private async recordHistoryAndCheckWatches(
    productId: string,
    marketplace: Marketplace,
    currentPrice: number | undefined,
    buyBoxPrice: number | undefined,
    bsr: number | undefined,
    bsrCategory: string | undefined,
  ) {
    const now = new Date();

    if (currentPrice != null) {
      await prisma.priceHistory.create({
        data: { productId, marketplace, price: currentPrice, buyBoxPrice, recordedAt: now },
      });
    }

    if (bsr != null && bsrCategory) {
      await prisma.bsrHistory.create({
        data: { productId, marketplace, bsr, category: bsrCategory, recordedAt: now },
      });
    }

    await this.productWatches.checkProduct(productId, marketplace, currentPrice, bsr);
  }
}
