import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { CalculateInput } from '@sourcetool/shared';

const productAnalysis = {
  create: vi.fn(),
  findMany: vi.fn(),
  count: vi.fn(),
  findFirst: vi.fn(),
  update: vi.fn(),
};

vi.mock('@sourcetool/db', () => ({
  prisma: { productAnalysis },
}));

const { AnalysisService } = await import('./analysis.service');

const TEAM = 'team-1';
const USER = 'user-1';

const engineResult = {
  buyPrice: 10,
  sellPrice: 30,
  fees: {
    referralFee: 4.5,
    referralFeePercent: 15,
    fulfillmentFee: 3.22,
    storageFee: 0.78,
    prepFee: 0,
    inboundShipping: 0,
    totalFees: 8.5,
  },
  profit: 11.5,
  roi: 115,
  margin: 38.3,
  breakeven: 18.5,
};

function input(): CalculateInput {
  return {
    productId: 'prod-1',
    asin: 'B000000001',
    marketplace: 'AMAZON_US',
    fulfillmentType: 'FBA',
    buyPrice: 10,
    sellPrice: 30,
    category: 'Toys & Games',
  };
}

function makeService(calibration?: { calibrateForecast: ReturnType<typeof vi.fn> }) {
  return new AnalysisService(
    { calculate: vi.fn().mockReturnValue(engineResult) } as never,
    calibration as never,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  productAnalysis.create.mockResolvedValue({ id: 'analysis-1' });
});

describe('AnalysisService.recordVerdict', () => {
  it('re-applies calibration with the new score so the score band can attach', async () => {
    productAnalysis.findFirst.mockResolvedValue({
      id: 'analysis-1',
      roi: 80,
      profit: 16,
      snapshot: { category: 'Toys & Games' },
    });
    productAnalysis.update.mockResolvedValue({ id: 'analysis-1', aiScore: 92 });

    const calibrateForecast = vi.fn().mockResolvedValue({
      applied: true,
      basis: 'Scored 80-100 (Strong Buy)',
      calibratedRoi: 24,
      sampleSize: 8,
    });

    const result = await makeService({ calibrateForecast }).recordVerdict(
      'analysis-1',
      TEAM,
      { score: 92, verdict: 'STRONG_BUY' },
      { category: 'Toys & Games' },
    );

    expect(result.calibrated).toMatchObject({
      applied: true,
      basis: 'Scored 80-100 (Strong Buy)',
    });
    expect(calibrateForecast).toHaveBeenCalledWith(TEAM, {
      predictedRoi: 80,
      predictedProfit: 16,
      category: 'Toys & Games',
      aiScore: 92,
    });
  });

  it('still persists the verdict when calibration throws', async () => {
    productAnalysis.findFirst.mockResolvedValue({
      id: 'analysis-1',
      roi: 40,
      profit: 8,
      snapshot: {},
    });
    productAnalysis.update.mockResolvedValue({ id: 'analysis-1' });

    const result = await makeService({
      calibrateForecast: vi.fn().mockRejectedValue(new Error('db timeout')),
    }).recordVerdict('analysis-1', TEAM, { score: 70, verdict: 'BUY' });

    expect(productAnalysis.update).toHaveBeenCalled();
    expect(result.calibrated).toBeUndefined();
  });
});

describe('AnalysisService.calculate', () => {
  it('attaches a calibrated forecast when the team has a track record', async () => {
    const calibrateForecast = vi.fn().mockResolvedValue({
      predictedRoi: 115,
      calibratedRoi: 34.5,
      predictedProfit: 11.5,
      calibratedProfit: 3.45,
      realizationRate: 0.3,
      basis: 'Toys & Games',
      sampleSize: 12,
      applied: true,
    });

    const result = await makeService({ calibrateForecast }).calculate(input(), USER, TEAM, {
      category: 'Toys & Games',
    });

    expect(result.analysisId).toBe('analysis-1');
    expect(result.profit).toBe(11.5);
    expect(result.calibrated).toMatchObject({
      applied: true,
      calibratedRoi: 34.5,
      basis: 'Toys & Games',
    });
    expect(calibrateForecast).toHaveBeenCalledWith(TEAM, {
      predictedRoi: 115,
      predictedProfit: 11.5,
      category: 'Toys & Games',
      aiScore: undefined,
    });
  });

  it('still returns the raw forecast when calibration throws', async () => {
    const calibrateForecast = vi.fn().mockRejectedValue(new Error('db timeout'));

    const result = await makeService({ calibrateForecast }).calculate(input(), USER, TEAM);

    expect(result.analysisId).toBe('analysis-1');
    expect(result.roi).toBe(115);
    expect(result.calibrated).toBeUndefined();
  });

  it('skips calibration when no service is wired', async () => {
    const result = await makeService().calculate(input(), USER, TEAM);

    expect(result.analysisId).toBe('analysis-1');
    expect(result.calibrated).toBeUndefined();
  });
});
