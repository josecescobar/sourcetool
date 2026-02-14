import { Injectable } from '@nestjs/common';
import { prisma } from '@sourcetool/db';
import type { Marketplace } from '@sourcetool/shared';

@Injectable()
export class HistoryService {
  async getPriceHistory(productId: string, marketplace?: Marketplace, days = 90) {
    const since = new Date();
    since.setDate(since.getDate() - days);
    return prisma.priceHistory.findMany({
      where: {
        productId,
        ...(marketplace && { marketplace }),
        recordedAt: { gte: since },
      },
      orderBy: { recordedAt: 'asc' },
    });
  }

  async getBsrHistory(productId: string, marketplace?: Marketplace, days = 90) {
    const since = new Date();
    since.setDate(since.getDate() - days);
    return prisma.bsrHistory.findMany({
      where: {
        productId,
        ...(marketplace && { marketplace }),
        recordedAt: { gte: since },
      },
      orderBy: { recordedAt: 'asc' },
    });
  }

  async getOfferHistory(productId: string, marketplace?: Marketplace, days = 90) {
    const since = new Date();
    since.setDate(since.getDate() - days);
    return prisma.offerHistory.findMany({
      where: {
        productId,
        ...(marketplace && { marketplace }),
        recordedAt: { gte: since },
      },
      orderBy: { recordedAt: 'asc' },
    });
  }
}
