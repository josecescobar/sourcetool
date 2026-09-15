import { prisma } from '@sourcetool/db';

function csvCell(value: unknown): string {
  const raw = value == null ? '' : String(value);
  // Neutralise spreadsheet formula injection before quoting.
  const guarded = /^[=+\-@\t\r]/.test(raw) ? `'${raw}` : raw;
  return `"${guarded.replace(/"/g, '""')}"`;
}

export class ExportService {
  async exportCsv(analysisIds: string[], teamId: string): Promise<any> {
    const analyses = await prisma.productAnalysis.findMany({
      where: { id: { in: analysisIds }, teamId },
      include: { product: true },
    });

    const headers = ['ASIN', 'Title', 'Buy Price', 'Sell Price', 'Fees', 'Profit', 'ROI', 'Margin', 'Marketplace'];
    const rows = analyses.map((a) => [
      a.product.asin || '', a.product.title, a.buyPrice, a.sellPrice,
      a.totalFees, a.profit, a.roi, a.margin, a.marketplace,
    ]);

    const csv = [
      headers.map(csvCell).join(','),
      ...rows.map((r) => r.map(csvCell).join(',')),
    ].join('\n');
    return { csv, filename: `sourcetool-export-${Date.now()}.csv` };
  }

  async exportGoogleSheets(analysisIds: string[]) {
    // TODO: Implement Google Sheets API integration
    return { message: 'Google Sheets export coming soon', analysisIds };
  }
}
