import { beforeEach, describe, expect, it, vi } from 'vitest';

const sourcedProduct = { findMany: vi.fn(), count: vi.fn() };
const productAnalysis = { findFirst: vi.fn() };

vi.mock('@sourcetool/db', () => ({ prisma: { sourcedProduct, productAnalysis } }));

const { CalibrationService } = await import('./calibration.service');

const TEAM = 'team-1';

function soldRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'sp-1',
    teamId: TEAM,
    quantity: 1,
    purchaseDate: new Date('2026-01-01'),
    soldDate: new Date('2026-01-31'),
    actualProfit: 10,
    actualRoi: 40,
    analysis: {
      profit: 20,
      roi: 80,
      aiScore: 85,
      aiVerdict: 'STRONG_BUY',
      snapshot: { category: 'Toys & Games' },
    },
    product: { category: 'Toys & Games' },
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  sourcedProduct.count.mockResolvedValue(0);
});

describe('CalibrationService.getResolvedOutcomes', () => {
  it('only considers units that sold with a linked analysis', async () => {
    sourcedProduct.findMany.mockResolvedValue([]);

    await new CalibrationService().getResolvedOutcomes(TEAM);

    expect(sourcedProduct.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          teamId: TEAM,
          soldDate: { not: null },
          analysisId: { not: null },
          actualRoi: { not: null },
        },
      }),
    );
  });

  it('divides lot profit by quantity to compare against a per-unit forecast', async () => {
    // $60 booked across 6 units = $10/unit, against a $20/unit forecast.
    sourcedProduct.findMany.mockResolvedValue([
      soldRow({ quantity: 6, actualProfit: 60 }),
    ]);

    const [outcome] = await new CalibrationService().getResolvedOutcomes(TEAM);

    expect(outcome!.realizedProfit).toBe(10);
    expect(outcome!.predictedProfit).toBe(20);
  });

  it('does not divide by a zero quantity', async () => {
    sourcedProduct.findMany.mockResolvedValue([
      soldRow({ quantity: 0, actualProfit: 15 }),
    ]);

    const [outcome] = await new CalibrationService().getResolvedOutcomes(TEAM);

    expect(Number.isFinite(outcome!.realizedProfit)).toBe(true);
    expect(outcome!.realizedProfit).toBe(15);
  });

  it('measures days to sell from purchase to sale', async () => {
    sourcedProduct.findMany.mockResolvedValue([
      soldRow({
        purchaseDate: new Date('2026-01-01'),
        soldDate: new Date('2026-01-31'),
      }),
    ]);

    const [outcome] = await new CalibrationService().getResolvedOutcomes(TEAM);

    expect(outcome!.daysToSell).toBe(30);
  });

  it('drops a nonsensical sale date recorded before the purchase', async () => {
    sourcedProduct.findMany.mockResolvedValue([
      soldRow({
        purchaseDate: new Date('2026-02-01'),
        soldDate: new Date('2026-01-01'),
      }),
    ]);

    const [outcome] = await new CalibrationService().getResolvedOutcomes(TEAM);

    expect(outcome!.daysToSell).toBeUndefined();
  });

  it('prefers the decision-time category over the product\'s current one', async () => {
    sourcedProduct.findMany.mockResolvedValue([
      soldRow({
        analysis: {
          ...soldRow().analysis,
          snapshot: { category: 'Category At Purchase' },
        },
        product: { category: 'Recategorised Since' },
      }),
    ]);

    const [outcome] = await new CalibrationService().getResolvedOutcomes(TEAM);

    expect(outcome!.category).toBe('Category At Purchase');
  });

  it('falls back to the product category when no snapshot was captured', async () => {
    sourcedProduct.findMany.mockResolvedValue([
      soldRow({ analysis: { ...soldRow().analysis, snapshot: null } }),
    ]);

    const [outcome] = await new CalibrationService().getResolvedOutcomes(TEAM);

    expect(outcome!.category).toBe('Toys & Games');
  });

  it('skips a row whose analysis was deleted out from under it', async () => {
    sourcedProduct.findMany.mockResolvedValue([soldRow({ analysis: null })]);

    await expect(new CalibrationService().getResolvedOutcomes(TEAM)).resolves.toEqual([]);
  });
});

describe('CalibrationService.getReport', () => {
  it('counts sold units that cannot be scored so the gap is explainable', async () => {
    sourcedProduct.findMany.mockResolvedValue([soldRow()]);
    sourcedProduct.count.mockResolvedValue(7);

    const report = await new CalibrationService().getReport(TEAM);

    expect(report.unlinkedSoldCount).toBe(7);
    expect(report.sampleSize).toBe(1);
  });

  it('returns a usable report for a team with no sales yet', async () => {
    sourcedProduct.findMany.mockResolvedValue([]);

    const report = await new CalibrationService().getReport(TEAM);

    expect(report.sampleSize).toBe(0);
    expect(report.bias).toBe('INSUFFICIENT_DATA');
    expect(report.overall).toBeNull();
  });
});

describe('CalibrationService.findLikelyAnalysisId', () => {
  it('takes the most recent analysis at or before the purchase', async () => {
    productAnalysis.findFirst.mockResolvedValue({ id: 'analysis-9' });

    const id = await new CalibrationService().findLikelyAnalysisId(
      TEAM,
      'product-1',
      new Date('2026-03-01'),
    );

    expect(id).toBe('analysis-9');
    expect(productAnalysis.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ teamId: TEAM, productId: 'product-1' }),
        orderBy: { createdAt: 'desc' },
      }),
    );
  });

  it('allows a day of slack for date-only purchase dates', async () => {
    productAnalysis.findFirst.mockResolvedValue({ id: 'analysis-9' });

    await new CalibrationService().findLikelyAnalysisId(
      TEAM,
      'product-1',
      new Date('2026-03-01T00:00:00Z'),
    );

    const { where } = productAnalysis.findFirst.mock.calls[0]![0];
    expect(where.createdAt.lte).toEqual(new Date('2026-03-02T00:00:00Z'));
  });

  it('returns null rather than guessing when nothing matches', async () => {
    productAnalysis.findFirst.mockResolvedValue(null);

    await expect(
      new CalibrationService().findLikelyAnalysisId(TEAM, 'product-1', new Date()),
    ).resolves.toBeNull();
  });
});
