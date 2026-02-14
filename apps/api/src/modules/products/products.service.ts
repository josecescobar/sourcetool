import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { prisma } from '@sourcetool/db';
import { detectIdentifier } from '@sourcetool/shared';
import type { Marketplace } from '@sourcetool/shared';
import { RainforestService } from '../integrations/rainforest/rainforest.service';
import { STALENESS_THRESHOLD_MS } from '../integrations/rainforest/rainforest.constants';
import type { ExternalProductData } from '../integrations/interfaces/product-data-provider.interface';

@Injectable()
export class ProductsService {
  private readonly logger = new Logger(ProductsService.name);

  constructor(private rainforest: RainforestService) {}

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

  // ─── Private helpers ──────────────────────────────────────────────

  private async fetchFromExternal(
    value: string,
    type: 'ASIN' | 'UPC' | 'EAN',
    marketplace: Marketplace,
  ): Promise<ExternalProductData | null> {
    if (type === 'ASIN') {
      return this.rainforest.getByAsin(value, marketplace);
    }
    return this.rainforest.searchByBarcode(value, type, marketplace);
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

      // Re-fetch with updated listings
      return prisma.product.findUnique({
        where: { id: product.id },
        include: { listings: true, alerts: true },
      });
    }

    return product;
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
}
