import { Injectable } from '@nestjs/common';
import { prisma } from '@sourcetool/db';

@Injectable()
export class ExportService {
  async exportCsv(analysisIds: string[]): Promise<any> {
    const analyses = await prisma.productAnalysis.findMany({
      where: { id: { in: analysisIds } },
      include: { product: true },
    });

    const headers = ['ASIN', 'Title', 'Buy Price', 'Sell Price', 'Fees', 'Profit', 'ROI', 'Margin', 'Marketplace'];
    const rows = analyses.map((a) => [
      a.product.asin || '', a.product.title, a.buyPrice, a.sellPrice,
      a.totalFees, a.profit, a.roi, a.margin, a.marketplace,
    ]);

    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    return { csv, filename: `sourcetool-export-${Date.now()}.csv` };
  }

  async exportGoogleSheets(analysisIds: string[]) {
    // TODO: Implement Google Sheets API integration
    return { message: 'Google Sheets export coming soon', analysisIds };
  }
}
