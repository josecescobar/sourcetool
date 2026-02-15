import { Injectable, NotFoundException } from '@nestjs/common';
import { prisma } from '@sourcetool/db';
import type { Marketplace } from '@sourcetool/shared';

interface CreateInput {
  productId: string;
  marketplace: Marketplace;
  purchaseDate: string;
  purchasePrice: number;
  quantity: number;
  listingDate?: string;
  listingPrice?: number;
  notes?: string;
}

interface UpdateInput {
  marketplace?: Marketplace;
  purchaseDate?: string;
  purchasePrice?: number;
  quantity?: number;
  listingDate?: string | null;
  listingPrice?: number | null;
  soldDate?: string | null;
  soldPrice?: number | null;
  actualFees?: number | null;
  notes?: string | null;
}

@Injectable()
export class SourcedProductsService {
  async getAll(teamId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      prisma.sourcedProduct.findMany({
        where: { teamId },
        orderBy: { purchaseDate: 'desc' },
        skip,
        take: limit,
        include: {
          product: {
            select: { id: true, title: true, asin: true, imageUrl: true },
          },
        },
      }),
      prisma.sourcedProduct.count({ where: { teamId } }),
    ]);

    return {
      data,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async getById(id: string, teamId: string) {
    const record = await prisma.sourcedProduct.findFirst({
      where: { id, teamId },
      include: {
        product: {
          select: { id: true, title: true, asin: true, imageUrl: true, brand: true, category: true },
        },
      },
    });
    if (!record) throw new NotFoundException('Sourced product not found');
    return record;
  }

  async create(teamId: string, input: CreateInput) {
    return prisma.sourcedProduct.create({
      data: {
        teamId,
        productId: input.productId,
        marketplace: input.marketplace,
        purchaseDate: new Date(input.purchaseDate),
        purchasePrice: input.purchasePrice,
        quantity: input.quantity,
        listingDate: input.listingDate ? new Date(input.listingDate) : undefined,
        listingPrice: input.listingPrice,
        notes: input.notes,
      },
      include: {
        product: {
          select: { id: true, title: true, asin: true, imageUrl: true },
        },
      },
    });
  }

  async update(id: string, teamId: string, input: UpdateInput) {
    const existing = await prisma.sourcedProduct.findFirst({
      where: { id, teamId },
    });
    if (!existing) throw new NotFoundException('Sourced product not found');

    const data: Record<string, any> = {};

    if (input.marketplace !== undefined) data.marketplace = input.marketplace;
    if (input.purchaseDate !== undefined)
      data.purchaseDate = new Date(input.purchaseDate);
    if (input.purchasePrice !== undefined)
      data.purchasePrice = input.purchasePrice;
    if (input.quantity !== undefined) data.quantity = input.quantity;
    if (input.listingDate !== undefined)
      data.listingDate = input.listingDate ? new Date(input.listingDate) : null;
    if (input.listingPrice !== undefined) data.listingPrice = input.listingPrice;
    if (input.soldDate !== undefined)
      data.soldDate = input.soldDate ? new Date(input.soldDate) : null;
    if (input.soldPrice !== undefined) data.soldPrice = input.soldPrice;
    if (input.actualFees !== undefined) data.actualFees = input.actualFees;
    if (input.notes !== undefined) data.notes = input.notes;

    // Auto-calculate profit when sold
    const purchasePrice = input.purchasePrice ?? existing.purchasePrice;
    const quantity = input.quantity ?? existing.quantity;
    const soldPrice = input.soldPrice !== undefined ? input.soldPrice : existing.soldPrice;
    const actualFees = input.actualFees !== undefined ? input.actualFees : existing.actualFees;

    if (soldPrice != null) {
      const totalCost = purchasePrice * quantity + (actualFees ?? 0);
      const totalRevenue = soldPrice * quantity;
      data.actualProfit = +(totalRevenue - totalCost).toFixed(2);
      data.actualRoi = +(((totalRevenue - totalCost) / (purchasePrice * quantity)) * 100).toFixed(1);
    }

    return prisma.sourcedProduct.update({
      where: { id },
      data,
      include: {
        product: {
          select: { id: true, title: true, asin: true, imageUrl: true },
        },
      },
    });
  }

  async remove(id: string, teamId: string) {
    const existing = await prisma.sourcedProduct.findFirst({
      where: { id, teamId },
    });
    if (!existing) throw new NotFoundException('Sourced product not found');

    await prisma.sourcedProduct.delete({ where: { id } });
    return { deleted: true };
  }
}
