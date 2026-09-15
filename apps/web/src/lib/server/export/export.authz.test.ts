import { beforeEach, describe, expect, it, vi } from 'vitest';

const productAnalysis = { findMany: vi.fn() };

vi.mock('@sourcetool/db', () => ({ prisma: { productAnalysis } }));

const { ExportService } = await import('./export.service');

const TEAM = 'team-owner';

function analysis(overrides: Record<string, unknown> = {}) {
  return {
    id: 'a1',
    teamId: TEAM,
    buyPrice: 10,
    sellPrice: 30,
    totalFees: 8,
    profit: 12,
    roi: 120,
    margin: 40,
    marketplace: 'AMAZON_US',
    product: { asin: 'B000000001', title: 'Widget' },
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  productAnalysis.findMany.mockResolvedValue([analysis()]);
});

describe('ExportService.exportCsv', () => {
  it('scopes the query to the requesting team', async () => {
    await new ExportService().exportCsv(['a1', 'a2'], TEAM);

    expect(productAnalysis.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: { in: ['a1', 'a2'] }, teamId: TEAM },
      }),
    );
  });

  it('returns nothing when the ids belong to another team', async () => {
    productAnalysis.findMany.mockResolvedValue([]);

    const { csv } = await new ExportService().exportCsv(['someone-elses-id'], TEAM);

    // Header row only.
    expect(csv.split('\n')).toHaveLength(1);
  });

  it('quotes fields so a comma in a title cannot shift columns', async () => {
    productAnalysis.findMany.mockResolvedValue([
      analysis({ product: { asin: 'B1', title: 'Widget, large' } }),
    ]);

    const { csv } = await new ExportService().exportCsv(['a1'], TEAM);
    const dataRow = csv.split('\n')[1]!;

    expect(dataRow).toContain('"Widget, large"');
    expect(csv.split('\n')).toHaveLength(2);
  });

  it('escapes embedded quotes', async () => {
    productAnalysis.findMany.mockResolvedValue([
      analysis({ product: { asin: 'B1', title: 'The "Best" Widget' } }),
    ]);

    const { csv } = await new ExportService().exportCsv(['a1'], TEAM);

    expect(csv).toContain('"The ""Best"" Widget"');
  });

  it('neutralises spreadsheet formula injection in titles', async () => {
    productAnalysis.findMany.mockResolvedValue([
      analysis({ product: { asin: 'B1', title: '=HYPERLINK("http://evil","click")' } }),
    ]);

    const { csv } = await new ExportService().exportCsv(['a1'], TEAM);
    const dataRow = csv.split('\n')[1]!;

    expect(dataRow).toContain(`"'=HYPERLINK`);
    expect(dataRow).not.toMatch(/(^|,)"?=HYPERLINK/);
  });
});
