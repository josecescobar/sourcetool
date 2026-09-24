import { beforeEach, describe, expect, it, vi } from 'vitest';

const bulkScan = { findFirst: vi.fn() };
const bulkScanRow = { findMany: vi.fn() };
const sourcedProduct = { findMany: vi.fn(), count: vi.fn() };

vi.mock('@sourcetool/db', () => ({
  prisma: { bulkScan, bulkScanRow, sourcedProduct },
}));

const { BulkScanService } = await import('./bulk-scan.service');
const { CalibrationService } = await import('../calibration/calibration.service');

const TEAM = 'team-1';
const SCAN = 'scan-1';

function sold(overrides: Record<string, unknown> = {}) {
  return {
    id: 'sp-1',
    teamId: TEAM,
    quantity: 1,
    purchaseDate: new Date('2026-01-01'),
    soldDate: new Date('2026-01-31'),
    actualProfit: 5,
    actualRoi: 25,
    analysis: {
      profit: 10,
      roi: 50,
      aiScore: 85,
      aiVerdict: 'STRONG_BUY',
      snapshot: { category: 'Toys & Games' },
    },
    product: { category: 'Toys & Games' },
    ...overrides,
  };
}

function manySold(count: number, overrides: Record<string, unknown> = {}) {
  return Array.from({ length: count }, (_, i) => sold({ id: `sp-${i}`, ...overrides }));
}

function makeService() {
  return new BulkScanService({} as never, {} as never, {} as never, new CalibrationService());
}

beforeEach(() => {
  vi.clearAllMocks();
  bulkScan.findFirst.mockResolvedValue({ id: SCAN, teamId: TEAM });
  sourcedProduct.count.mockResolvedValue(0);
});

describe('BulkScanService.getResults calibration', () => {
  it('attaches a forecast from one team summary, not a per-row query', async () => {
    sourcedProduct.findMany.mockResolvedValue(manySold(10));
    bulkScanRow.findMany.mockResolvedValue([
      {
        id: 'row-1',
        rowNumber: 1,
        analysis: { roi: 60, profit: 12, aiScore: null, snapshot: { category: 'Toys & Games' } },
        product: { category: 'Toys & Games' },
      },
      {
        id: 'row-2',
        rowNumber: 2,
        analysis: { roi: 40, profit: 8, aiScore: null, snapshot: { category: 'Toys & Games' } },
        product: { category: 'Toys & Games' },
      },
      {
        id: 'row-3',
        rowNumber: 3,
        analysis: null,
        product: null,
      },
    ]);

    const rows = await makeService().getResults(SCAN, TEAM);

    expect(sourcedProduct.findMany).toHaveBeenCalledTimes(1);
    expect(rows[0].calibrated.applied).toBe(true);
    expect(rows[0].calibrated.calibratedRoi).toBeCloseTo(30, 0);
    expect(rows[1].calibrated.applied).toBe(true);
    expect(rows[2].calibrated).toBeUndefined();
  });

  it('sorts by calibrated ROI when asked', async () => {
    sourcedProduct.findMany.mockResolvedValue([
      ...manySold(8, {
        analysis: {
          profit: 10,
          roi: 50,
          snapshot: { category: 'Toys & Games' },
        },
        product: { category: 'Toys & Games' },
        actualRoi: 10,
        actualProfit: 2,
      }),
      ...manySold(8, {
        id: 'g',
        analysis: {
          profit: 10,
          roi: 50,
          snapshot: { category: 'Grocery' },
        },
        product: { category: 'Grocery' },
        actualRoi: 50,
        actualProfit: 10,
      }),
    ]);

    bulkScanRow.findMany.mockResolvedValue([
      {
        id: 'toys',
        rowNumber: 1,
        analysis: { roi: 80, profit: 16, snapshot: { category: 'Toys & Games' } },
        product: { category: 'Toys & Games' },
      },
      {
        id: 'grocery',
        rowNumber: 2,
        analysis: { roi: 40, profit: 8, snapshot: { category: 'Grocery' } },
        product: { category: 'Grocery' },
      },
    ]);

    const rows = await makeService().getResults(SCAN, TEAM, 'calibrated');

    // Grocery realizes ~100% of forecast (40), Toys ~20% (16). Grocery first.
    expect(rows.map((r: { id: string }) => r.id)).toEqual(['grocery', 'toys']);
    expect(rows[0].calibrated.calibratedRoi).toBeGreaterThan(rows[1].calibrated.calibratedRoi);
  });

  it('still returns rows when the summary query fails', async () => {
    sourcedProduct.findMany.mockRejectedValue(new Error('db timeout'));
    bulkScanRow.findMany.mockResolvedValue([
      { id: 'row-1', analysis: { roi: 20, profit: 4, snapshot: {} }, product: {} },
    ]);

    const rows = await makeService().getResults(SCAN, TEAM);

    expect(rows).toHaveLength(1);
    expect(rows[0].calibrated).toBeUndefined();
  });
});
