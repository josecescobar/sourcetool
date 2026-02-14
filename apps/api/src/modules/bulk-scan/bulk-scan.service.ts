import { Injectable, NotFoundException } from '@nestjs/common';
import { prisma } from '@sourcetool/db';

@Injectable()
export class BulkScanService {
  async create(teamId: string, userId: string, fileName: string, totalRows: number, marketplace: string, fulfillmentType: string, defaultBuyPrice?: number) {
    return prisma.bulkScan.create({
      data: {
        teamId, userId, fileName, totalRows,
        marketplace: marketplace as any,
        fulfillmentType: fulfillmentType as any,
        defaultBuyPrice,
        status: 'PENDING',
      },
    });
  }

  async getById(id: string) {
    const scan = await prisma.bulkScan.findUnique({ where: { id }, include: { rows: true } });
    if (!scan) throw new NotFoundException('Bulk scan not found');
    return scan;
  }

  async getResults(id: string, sort?: string, filter?: string) {
    return prisma.bulkScanRow.findMany({
      where: { bulkScanId: id },
      include: { product: true, analysis: true },
      orderBy: { rowNumber: 'asc' },
    });
  }

  async delete(id: string) {
    return prisma.bulkScan.delete({ where: { id } });
  }
}
