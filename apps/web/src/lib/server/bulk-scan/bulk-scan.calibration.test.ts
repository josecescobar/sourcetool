import { beforeEach, describe, expect, it, vi } from 'vitest';
import { buildCalibrationSummary } from '../calibration/calibration.engine';
import type { ResolvedOutcome } from '@sourcetool/shared';

const bulkScan = {
  findFirst: vi.fn(),
};
const bulkScanRow = {
  findMany: vi.fn(),
};

vi.mock('@sourcetool/db', () => ({
  prisma: { bulkScan, bulkScanRow },
}));

const { BulkScanService } = await import('./bulk-scan.service');

const TEAM = 'team-1';
const SCAN = 'scan-1';

function outcome(overrides: Partial<ResolvedOutcome> = {}): ResolvedOutcome {
  return {
    predictedProfit: 10,
    predictedRoi: 50,
    realizedProfit: 5,
    realizedRoi: 25,
    category: 'Toys & Games',
    ...overrides,
  };
}

function many(count: number, overrides: Partial<ResolvedOutcome> = {}) {
  return Array.from({ length: count }, () => outcome(overrides));
}

function makeService(calibration?: { getSummary: ReturnType<typeof vi.fn> }) {
  return new BulkScanService({} as never, {} as never, {} as never, calibration as never);
}

beforeEach(() => {
  vi.clearAllMocks();
  bulkScan.findFirst.mockResolvedValue({ id: SCAN, teamId: TEAM });
});

describe('BulkScanService.getResults calibration', () => {
  it('attaches a forecast from one team summary, not a per-row query', async () => {
    const summary = buildCalibrationSummary(many(10));
    const getSummary = vi.fn().mockResolvedValue(summary);

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

    const rows = await makeService({ getSummary }).getResults(SCAN, TEAM);

    expect(getSummary).toHaveBeenCalledTimes(1);
    expect(getSummary).toHaveBeenCalledWith(TEAM);
    expect(rows[0].calibrated.applied).toBe(true);
    expect(rows[0].calibrated.calibratedRoi).toBeCloseTo(30, 0);
    expect(rows[1].calibrated.applied).toBe(true);
    expect(rows[2].calibrated).toBeUndefined();
  });

  it('sorts by calibrated ROI when asked', async () => {
    const summary = buildCalibrationSummary([
      ...many(8, { category: 'Toys & Games', predictedRoi: 50, realizedRoi: 10 }),
      ...many(8, { category: 'Grocery', predictedRoi: 50, realizedRoi: 50 }),
    ]);
    const getSummary = vi.fn().mockResolvedValue(summary);

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

    const rows = await makeService({ getSummary }).getResults(SCAN, TEAM, 'calibrated');

    // Grocery realizes ~100% of forecast (40), Toys ~20% (16). Grocery first.
    expect(rows.map((r: { id: string }) => r.id)).toEqual(['grocery', 'toys']);
    expect(rows[0].calibrated.calibratedRoi).toBeGreaterThan(rows[1].calibrated.calibratedRoi);
  });

  it('still returns rows when the summary query fails', async () => {
    const getSummary = vi.fn().mockRejectedValue(new Error('db timeout'));
    bulkScanRow.findMany.mockResolvedValue([
      { id: 'row-1', analysis: { roi: 20, profit: 4, snapshot: {} }, product: {} },
    ]);

    const rows = await makeService({ getSummary }).getResults(SCAN, TEAM);

    expect(rows).toHaveLength(1);
    expect(rows[0].calibrated).toBeUndefined();
  });
});
