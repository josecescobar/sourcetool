import { describe, expect, it } from 'vitest';
import type { CalibrationSummary, ResolvedOutcome } from '@sourcetool/shared';
import {
  MIN_SAMPLE_SIZE,
  applyCalibration,
  buildCalibrationBrief,
  buildCalibrationSummary,
  buildSegment,
} from './calibration.engine';

function outcome(overrides: Partial<ResolvedOutcome> = {}): ResolvedOutcome {
  return {
    predictedProfit: 10,
    predictedRoi: 50,
    realizedProfit: 5,
    realizedRoi: 25,
    category: 'Toys & Games',
    aiScore: 85,
    aiVerdict: 'STRONG_BUY',
    daysToSell: 30,
    ...overrides,
  };
}

function manyOutcomes(count: number, overrides: Partial<ResolvedOutcome> = {}) {
  return Array.from({ length: count }, () => outcome(overrides));
}

describe('buildSegment', () => {
  it('reports realized ROI as a fraction of forecast', () => {
    // Forecast 50%, realized 25% — half of what was promised.
    const segment = buildSegment('k', 'l', manyOutcomes(5));

    expect(segment.realizationRate).toBeCloseTo(0.5, 2);
    expect(segment.predictedRoi).toBe(50);
    expect(segment.realizedRoi).toBe(25);
  });

  it('counts a win as a positive realized profit', () => {
    const segment = buildSegment('k', 'l', [
      outcome({ realizedProfit: 5 }),
      outcome({ realizedProfit: 5 }),
      outcome({ realizedProfit: -5 }),
      outcome({ realizedProfit: -5 }),
    ]);

    expect(segment.winRate).toBe(50);
  });

  it('does not count breaking even as a win', () => {
    const segment = buildSegment('k', 'l', [outcome({ realizedProfit: 0 })]);

    expect(segment.winRate).toBe(0);
  });

  it('takes the median, not the mean, of days to sell', () => {
    const segment = buildSegment('k', 'l', [
      outcome({ daysToSell: 10 }),
      outcome({ daysToSell: 20 }),
      // One unit that sat for years should not drag the typical case.
      outcome({ daysToSell: 900 }),
    ]);

    expect(segment.medianDaysToSell).toBe(20);
  });

  it('omits days to sell when no outcome recorded one', () => {
    const segment = buildSegment('k', 'l', [outcome({ daysToSell: undefined })]);

    expect(segment.medianDaysToSell).toBeNull();
  });

  it('does not divide by a near-zero forecast', () => {
    const segment = buildSegment('k', 'l', [
      outcome({ predictedRoi: 0.0001, realizedRoi: 40 }),
    ]);

    expect(Number.isFinite(segment.realizationRate)).toBe(true);
    expect(segment.realizationRate).toBe(1);
  });

  it('clamps an extreme realization rate from a lucky outlier', () => {
    const segment = buildSegment('k', 'l', [
      outcome({ predictedRoi: 10, realizedRoi: 5000 }),
    ]);

    expect(segment.realizationRate).toBeLessThanOrEqual(3);
  });

  it('handles a segment that lost money on every deal', () => {
    const segment = buildSegment('k', 'l', manyOutcomes(5, {
      realizedProfit: -8,
      realizedRoi: -40,
    }));

    expect(segment.winRate).toBe(0);
    expect(segment.realizedRoi).toBe(-40);
    expect(segment.realizationRate).toBeGreaterThanOrEqual(0.1);
  });
});

describe('buildCalibrationSummary', () => {
  it('reports no usable signal below the sample threshold', () => {
    const summary = buildCalibrationSummary(manyOutcomes(MIN_SAMPLE_SIZE - 1));

    expect(summary.bias).toBe('INSUFFICIENT_DATA');
  });

  it('flags a seller whose forecasts consistently overshoot', () => {
    const summary = buildCalibrationSummary(
      manyOutcomes(10, { predictedRoi: 50, realizedRoi: 20 }),
    );

    expect(summary.bias).toBe('OPTIMISTIC');
    expect(summary.overall?.realizationRate).toBeLessThan(0.85);
  });

  it('flags a seller who beats their own forecasts', () => {
    const summary = buildCalibrationSummary(
      manyOutcomes(10, { predictedRoi: 30, realizedRoi: 45 }),
    );

    expect(summary.bias).toBe('PESSIMISTIC');
  });

  it('calls a seller calibrated when realized tracks forecast', () => {
    const summary = buildCalibrationSummary(
      manyOutcomes(10, { predictedRoi: 40, realizedRoi: 40 }),
    );

    expect(summary.bias).toBe('CALIBRATED');
    expect(summary.overall?.realizationRate).toBeCloseTo(1, 2);
  });

  it('separates categories that behave differently', () => {
    const summary = buildCalibrationSummary([
      ...manyOutcomes(6, { category: 'Toys & Games', predictedRoi: 50, realizedRoi: 10 }),
      ...manyOutcomes(6, { category: 'Grocery', predictedRoi: 50, realizedRoi: 50 }),
    ]);

    const toys = summary.byCategory.find((s) => s.label === 'Toys & Games')!;
    const grocery = summary.byCategory.find((s) => s.label === 'Grocery')!;

    expect(toys.realizationRate).toBeLessThan(grocery.realizationRate);
  });

  it('orders category segments by how much evidence backs them', () => {
    const summary = buildCalibrationSummary([
      ...manyOutcomes(2, { category: 'Rare' }),
      ...manyOutcomes(9, { category: 'Common' }),
    ]);

    expect(summary.byCategory[0]!.label).toBe('Common');
  });

  it('buckets outcomes into the score band they were scored in', () => {
    const summary = buildCalibrationSummary([
      ...manyOutcomes(3, { aiScore: 90 }),
      ...manyOutcomes(3, { aiScore: 65 }),
      ...manyOutcomes(3, { aiScore: 10 }),
    ]);

    expect(summary.byScoreBand.map((s) => s.key)).toEqual([
      'score:80-100',
      'score:60-79',
      'score:0-19',
    ]);
  });

  it('skips outcomes with no score rather than bucketing them as zero', () => {
    const summary = buildCalibrationSummary(manyOutcomes(5, { aiScore: undefined }));

    expect(summary.byScoreBand).toHaveLength(0);
    expect(summary.sampleSize).toBe(5);
  });

  it('returns an empty but well-formed summary with no history', () => {
    const summary = buildCalibrationSummary([]);

    expect(summary.sampleSize).toBe(0);
    expect(summary.overall).toBeNull();
    expect(summary.bias).toBe('INSUFFICIENT_DATA');
    expect(summary.byCategory).toEqual([]);
  });
});

describe('applyCalibration', () => {
  const optimistic = buildCalibrationSummary(
    manyOutcomes(10, { category: 'Toys & Games', predictedRoi: 50, realizedRoi: 25 }),
  );

  it('discounts a forecast for a seller who runs optimistic', () => {
    const result = applyCalibration(
      { predictedRoi: 60, predictedProfit: 12, category: 'Toys & Games', aiScore: 85 },
      optimistic,
    );

    expect(result.applied).toBe(true);
    expect(result.calibratedRoi).toBeLessThan(result.predictedRoi);
    expect(result.calibratedRoi).toBeCloseTo(30, 0);
  });

  it('scales profit by the same rate as ROI', () => {
    const result = applyCalibration(
      { predictedRoi: 60, predictedProfit: 12, category: 'Toys & Games', aiScore: 85 },
      optimistic,
    );

    expect(result.calibratedProfit).toBeCloseTo(12 * result.realizationRate, 2);
  });

  it('prefers the category segment over the overall average', () => {
    const summary = buildCalibrationSummary([
      ...manyOutcomes(8, { category: 'Toys & Games', predictedRoi: 50, realizedRoi: 10 }),
      ...manyOutcomes(8, { category: 'Grocery', predictedRoi: 50, realizedRoi: 50 }),
    ]);

    const toys = applyCalibration(
      { predictedRoi: 50, predictedProfit: 10, category: 'Toys & Games' },
      summary,
    );

    expect(toys.basis).toBe('Toys & Games');
    expect(toys.calibratedRoi).toBeLessThan(20);
  });

  it('falls back to a broader segment when the category is unproven', () => {
    const result = applyCalibration(
      { predictedRoi: 50, predictedProfit: 10, category: 'Never Sourced Before', aiScore: 85 },
      optimistic,
    );

    expect(result.applied).toBe(true);
    expect(result.basis).not.toBe('Never Sourced Before');
  });

  it('leaves a forecast untouched when there is no track record', () => {
    const result = applyCalibration(
      { predictedRoi: 50, predictedProfit: 10, category: 'Toys & Games' },
      buildCalibrationSummary([]),
    );

    expect(result.applied).toBe(false);
    expect(result.calibratedRoi).toBe(50);
    expect(result.calibratedProfit).toBe(10);
  });

  it('ignores a segment that has not cleared the sample threshold', () => {
    const thin = buildCalibrationSummary(manyOutcomes(MIN_SAMPLE_SIZE - 1));

    const result = applyCalibration(
      { predictedRoi: 50, predictedProfit: 10, category: 'Toys & Games' },
      thin,
    );

    expect(result.applied).toBe(false);
  });

  it('names the segment it used so the adjustment is explainable', () => {
    const result = applyCalibration(
      { predictedRoi: 60, predictedProfit: 12, category: 'Toys & Games', aiScore: 85 },
      optimistic,
    );

    expect(result.basis).toBe('Toys & Games');
    expect(result.sampleSize).toBe(10);
  });
});

describe('buildCalibrationBrief', () => {
  it('stays silent until there is enough history to be worth saying', () => {
    const brief = buildCalibrationBrief(buildCalibrationSummary(manyOutcomes(2)));

    expect(brief).toBeUndefined();
  });

  it('tells the scorer when the seller has been running optimistic', () => {
    const brief = buildCalibrationBrief(
      buildCalibrationSummary(manyOutcomes(10, { predictedRoi: 50, realizedRoi: 20 })),
    )!;

    expect(brief).toMatch(/OPTIMISTIC/);
    expect(brief).toMatch(/10 resolved deals/);
  });

  it('includes the category track record when scoring in that category', () => {
    const summary = buildCalibrationSummary(
      manyOutcomes(8, { category: 'Toys & Games', predictedRoi: 50, realizedRoi: 15 }),
    );

    const brief = buildCalibrationBrief(summary, { category: 'Toys & Games' })!;

    expect(brief).toMatch(/Toys & Games specifically \(8 deals\)/);
  });

  it('omits a category the seller has barely touched', () => {
    const summary = buildCalibrationSummary([
      ...manyOutcomes(10, { category: 'Grocery', predictedRoi: 50, realizedRoi: 20 }),
      ...manyOutcomes(2, { category: 'Jewelry', predictedRoi: 50, realizedRoi: 20 }),
    ]);

    const brief = buildCalibrationBrief(summary, { category: 'Jewelry' })!;

    expect(brief).not.toMatch(/Jewelry specifically/);
  });

  it('is safe to embed with no overall segment', () => {
    const summary: CalibrationSummary = buildCalibrationSummary([]);

    expect(buildCalibrationBrief(summary)).toBeUndefined();
  });
});
