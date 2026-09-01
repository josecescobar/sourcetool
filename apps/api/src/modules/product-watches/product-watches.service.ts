import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { prisma } from '@sourcetool/db';
import type { Marketplace } from '@sourcetool/shared';

interface CreateWatchInput {
  productId: string;
  marketplace: Marketplace;
  watchType: 'PRICE_BELOW' | 'PRICE_ABOVE' | 'BSR_BELOW' | 'BSR_ABOVE';
  threshold: number;
}

interface UpdateWatchInput {
  threshold?: number;
  enabled?: boolean;
}

@Injectable()
export class ProductWatchesService {
  private readonly logger = new Logger(ProductWatchesService.name);

  async getAll(teamId: string) {
    return prisma.productWatch.findMany({
      where: { teamId },
      orderBy: { createdAt: 'desc' },
      include: {
        product: {
          select: { id: true, title: true, asin: true, imageUrl: true },
        },
      },
    });
  }

  async create(teamId: string, input: CreateWatchInput) {
    return prisma.productWatch.create({
      data: {
        teamId,
        productId: input.productId,
        marketplace: input.marketplace,
        watchType: input.watchType,
        threshold: input.threshold,
      },
      include: {
        product: {
          select: { id: true, title: true, asin: true, imageUrl: true },
        },
      },
    });
  }

  async update(id: string, teamId: string, input: UpdateWatchInput) {
    const watch = await prisma.productWatch.findFirst({
      where: { id, teamId },
    });
    if (!watch) throw new NotFoundException('Watch not found');

    return prisma.productWatch.update({
      where: { id },
      data: input,
      include: {
        product: {
          select: { id: true, title: true, asin: true, imageUrl: true },
        },
      },
    });
  }

  async remove(id: string, teamId: string) {
    const watch = await prisma.productWatch.findFirst({
      where: { id, teamId },
    });
    if (!watch) throw new NotFoundException('Watch not found');

    await prisma.productWatch.delete({ where: { id } });
    return { deleted: true };
  }

  async getAlerts(teamId: string, unreadOnly = false) {
    return prisma.watchAlert.findMany({
      where: {
        teamId,
        ...(unreadOnly ? { read: false } : {}),
      },
      orderBy: { triggeredAt: 'desc' },
      take: 50,
      include: {
        product: {
          select: { id: true, title: true, asin: true, imageUrl: true },
        },
        watch: {
          select: { marketplace: true },
        },
      },
    });
  }

  async getUnreadCount(teamId: string) {
    return prisma.watchAlert.count({
      where: { teamId, read: false },
    });
  }

  async markRead(alertId: string, teamId: string) {
    const alert = await prisma.watchAlert.findFirst({
      where: { id: alertId, teamId },
    });
    if (!alert) throw new NotFoundException('Alert not found');

    return prisma.watchAlert.update({
      where: { id: alertId },
      data: { read: true },
    });
  }

  async markAllRead(teamId: string) {
    const result = await prisma.watchAlert.updateMany({
      where: { teamId, read: false },
      data: { read: true },
    });
    return { updated: result.count };
  }

  async checkProduct(
    productId: string,
    marketplace: Marketplace,
    currentPrice: number | undefined,
    currentBsr: number | undefined,
  ) {
    const watches = await prisma.productWatch.findMany({
      where: {
        productId,
        marketplace,
        enabled: true,
      },
    });

    if (!watches.length) return;

    // Get previous values from the latest listing
    const listing = await prisma.marketplaceListing.findUnique({
      where: { productId_marketplace: { productId, marketplace } },
    });

    for (const watch of watches) {
      let triggered = false;
      let previousValue = 0;
      let currentValue = 0;

      switch (watch.watchType) {
        case 'PRICE_BELOW':
          if (currentPrice != null) {
            previousValue = listing?.currentPrice ?? 0;
            currentValue = currentPrice;
            triggered = currentPrice <= watch.threshold;
          }
          break;
        case 'PRICE_ABOVE':
          if (currentPrice != null) {
            previousValue = listing?.currentPrice ?? 0;
            currentValue = currentPrice;
            triggered = currentPrice >= watch.threshold;
          }
          break;
        case 'BSR_BELOW':
          if (currentBsr != null) {
            previousValue = listing?.bsr ?? 0;
            currentValue = currentBsr;
            triggered = currentBsr <= watch.threshold;
          }
          break;
        case 'BSR_ABOVE':
          if (currentBsr != null) {
            previousValue = listing?.bsr ?? 0;
            currentValue = currentBsr;
            triggered = currentBsr >= watch.threshold;
          }
          break;
      }

      if (triggered) {
        // Avoid duplicate alerts within 1 hour
        const recent = await prisma.watchAlert.findFirst({
          where: {
            watchId: watch.id,
            triggeredAt: { gte: new Date(Date.now() - 60 * 60 * 1000) },
          },
        });

        if (!recent) {
          await prisma.watchAlert.create({
            data: {
              watchId: watch.id,
              teamId: watch.teamId,
              productId,
              watchType: watch.watchType,
              previousValue,
              currentValue,
              threshold: watch.threshold,
            },
          });
          this.logger.log(
            `Alert triggered: ${watch.watchType} for product ${productId} (${currentValue} vs threshold ${watch.threshold})`,
          );
        }
      }

      // Update lastCheckedAt
      await prisma.productWatch.update({
        where: { id: watch.id },
        data: { lastCheckedAt: new Date() },
      });
    }
  }
}
