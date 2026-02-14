import { Injectable, NotFoundException } from '@nestjs/common';
import { prisma } from '@sourcetool/db';
import { detectIdentifier } from '@sourcetool/shared';
import type { Marketplace } from '@sourcetool/shared';

@Injectable()
export class ProductsService {
  async lookup(identifier: string, marketplace?: Marketplace) {
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
        // TODO: Search via external APIs (Amazon PA-API, etc.)
        throw new NotFoundException(`Could not resolve identifier: ${identifier}`);
    }

    if (!product) {
      // TODO: Fetch from external APIs and create product record
      throw new NotFoundException(`Product not found: ${identifier}`);
    }

    return product;
  }

  async getById(id: string) {
    const product = await prisma.product.findUnique({
      where: { id },
      include: { listings: true, alerts: true },
    });
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  async getListings(id: string) {
    return prisma.marketplaceListing.findMany({
      where: { productId: id },
    });
  }

  async crossMatch(identifier: string) {
    const detected = detectIdentifier(identifier);
    // Find the product
    let product;
    if (detected.type === 'ASIN') {
      product = await prisma.product.findUnique({ where: { asin: detected.value } });
    }
    if (!product) throw new NotFoundException('Product not found for cross-matching');

    // Find all listings for this product across marketplaces
    const listings = await prisma.marketplaceListing.findMany({
      where: { productId: product.id },
    });

    return { product, listings };
  }
}
