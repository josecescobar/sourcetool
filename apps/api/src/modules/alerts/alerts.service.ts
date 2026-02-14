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
}
