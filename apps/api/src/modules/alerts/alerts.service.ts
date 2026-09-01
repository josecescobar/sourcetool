import { Injectable } from '@nestjs/common';
import { prisma } from '@sourcetool/db';
import { detectIdentifier } from '@sourcetool/shared';

@Injectable()
export class AlertsService {
  async checkByIdentifier(identifier: string): Promise<any> {
    const detected = detectIdentifier(identifier);
    if (detected.type === 'ASIN') {
      const product = await prisma.product.findUnique({ where: { asin: detected.value } });
      if (product) {
        return prisma.alert.findMany({ where: { productId: product.id } });
      }
    }
    return [];
  }

  async checkBatch(identifiers: string[]) {
    const results: Record<string, any[]> = {};
    for (const id of identifiers) {
      results[id] = await this.checkByIdentifier(id);
    }
    return results;
  }

  async getByProductId(productId: string): Promise<any> {
    return prisma.alert.findMany({ where: { productId }, orderBy: { createdAt: 'desc' } });
  }

  // Alerts on any product this team has looked up (via analysis), most recent first.
  async getRecentForTeam(teamId: string, page = 1, limit = 20): Promise<any> {
    const skip = (page - 1) * limit;
    const where = { product: { analyses: { some: { teamId } } } };

    const [alerts, total] = await Promise.all([
      prisma.alert.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: { product: true },
      }),
      prisma.alert.count({ where }),
    ]);

    return {
      data: alerts,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }
}
