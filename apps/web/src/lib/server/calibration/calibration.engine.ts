import type {
  CalibratedForecast,
  CalibrationBias,
  CalibrationSegment,
  CalibrationSummary,
  ResolvedOutcome,
} from '@sourcetool/shared';

/**
 * Below this many resolved outcomes a segment is noise, not signal, and is
 * never used to adjust a forecast.
 */
export const MIN_SAMPLE_SIZE = 5;

/**
 * A realization rate outside this range almost always comes from a handful of
 * extreme outcomes rather than a real pattern. Clamping keeps a small sample
 * from producing an absurd adjustment.
 */
const MIN_REALIZATION_RATE = 0.1;
const MAX_REALIZATION_RATE = 3;

/** Ratios are unstable when the denominator approaches zero. */
const MIN_MEANINGFUL_PREDICTED_ROI = 1;

const OPTIMISTIC_BELOW = 0.85;
const PESSIMISTIC_ABOVE = 1.15;

const SCORE_BANDS: Array<{ key: string; label: string; min: number; max: number }> = [
  { key: '80-100', label: 'Scored 80-100 (Strong Buy)', min: 80, max: 100 },
  { key: '60-79', label: 'Scored 60-79 (Buy)', min: 60, max: 79 },
  { key: '40-59', label: 'Scored 40-59 (Hold)', min: 40, max: 59 },
  { key: '20-39', label: 'Scored 20-39 (Pass)', min: 20, max: 39 },
  { key: '0-19', label: 'Scored 0-19 (Strong Pass)', min: 0, max: 19 },
];

function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1]! + sorted[mid]!) / 2 : sorted[mid]!;
}

function round(value: number, places = 2): number {
  const factor = 10 ** places;
  return Math.round(value * factor) / factor;
}

/**
 * Aggregate ratio rather than the mean of per-item ratios: a single deal with a
 * near-zero forecast would otherwise dominate the whole segment.
 */
function realizationRate(predictedRoi: number, realizedRoi: number): number {
  if (predictedRoi < MIN_MEANINGFUL_PREDICTED_ROI) return 1;
  const raw = realizedRoi / predictedRoi;
  if (!Number.isFinite(raw)) return 1;
  return Math.min(MAX_REALIZATION_RATE, Math.max(MIN_REALIZATION_RATE, raw));
}

export function buildSegment(
  key: string,
  label: string,
  outcomes: ResolvedOutcome[],
): CalibrationSegment {
  const predictedRoi = mean(outcomes.map((o) => o.predictedRoi));
  const realizedRoi = mean(outcomes.map((o) => o.realizedRoi));
  const daysToSell = outcomes
    .map((o) => o.daysToSell)
    .filter((d): d is number => typeof d === 'number' && Number.isFinite(d));

  return {
    key,
    label,
    sampleSize: outcomes.length,
    predictedRoi: round(predictedRoi, 1),
    realizedRoi: round(realizedRoi, 1),
    predictedProfit: round(mean(outcomes.map((o) => o.predictedProfit))),
    realizedProfit: round(mean(outcomes.map((o) => o.realizedProfit))),
    realizationRate: round(realizationRate(predictedRoi, realizedRoi), 3),
    winRate: round(
      outcomes.length === 0
        ? 0
        : (outcomes.filter((o) => o.realizedProfit > 0).length / outcomes.length) * 100,
      1,
    ),
    medianDaysToSell: daysToSell.length > 0 ? median(daysToSell) : null,
  };
}

function classifyBias(overall: CalibrationSegment | null): CalibrationBias {
  if (!overall || overall.sampleSize < MIN_SAMPLE_SIZE) return 'INSUFFICIENT_DATA';
  if (overall.realizationRate < OPTIMISTIC_BELOW) return 'OPTIMISTIC';
  if (overall.realizationRate > PESSIMISTIC_ABOVE) return 'PESSIMISTIC';
  return 'CALIBRATED';
}

function groupBy<T>(items: T[], key: (item: T) => string | undefined): Map<string, T[]> {
  const groups = new Map<string, T[]>();
  for (const item of items) {
    const k = key(item);
    if (k === undefined) continue;
    const existing = groups.get(k);
    if (existing) existing.push(item);
    else groups.set(k, [item]);
  }
  return groups;
}

function scoreBandFor(score: number | undefined) {
  if (score === undefined || !Number.isFinite(score)) return undefined;
  return SCORE_BANDS.find((b) => score >= b.min && score <= b.max);
}

export function buildCalibrationSummary(
  outcomes: ResolvedOutcome[],
  now: Date = new Date(),
): CalibrationSummary {
  const overall =
    outcomes.length > 0 ? buildSegment('overall', 'All resolved deals', outcomes) : null;

  const byCategory = [...groupBy(outcomes, (o) => o.category).entries()]
    .map(([category, group]) => buildSegment(`category:${category}`, category, group))
    .sort((a, b) => b.sampleSize - a.sampleSize);

  const byScoreBand = SCORE_BANDS.map((band) => {
    const group = outcomes.filter((o) => scoreBandFor(o.aiScore)?.key === band.key);
    return group.length > 0 ? buildSegment(`score:${band.key}`, band.label, group) : null;
  }).filter((s): s is CalibrationSegment => s !== null);

  const byVerdict = [...groupBy(outcomes, (o) => o.aiVerdict).entries()]
    .map(([verdict, group]) => buildSegment(`verdict:${verdict}`, verdict, group))
    .sort((a, b) => b.sampleSize - a.sampleSize);

  return {
    sampleSize: outcomes.length,
    minSampleSize: MIN_SAMPLE_SIZE,
    bias: classifyBias(overall),
    overall,
    byCategory,
    byScoreBand,
    byVerdict,
    generatedAt: now.toISOString(),
  };
}

/**
 * Adjust a fresh forecast by the team's own track record, preferring the most
 * specific segment that has enough history to be believable.
 */
export function applyCalibration(
  forecast: { predictedRoi: number; predictedProfit: number; category?: string; aiScore?: number },
  summary: CalibrationSummary,
): CalibratedForecast {
  const candidates: Array<CalibrationSegment | undefined> = [
    forecast.category
      ? summary.byCategory.find((s) => s.key === `category:${forecast.category}`)
      : undefined,
    summary.byScoreBand.find((s) => s.key === `score:${scoreBandFor(forecast.aiScore)?.key}`),
    summary.overall ?? undefined,
  ];

  const segment = candidates.find(
    (s): s is CalibrationSegment => !!s && s.sampleSize >= summary.minSampleSize,
  );

  if (!segment) {
    return {
      predictedRoi: forecast.predictedRoi,
      calibratedRoi: forecast.predictedRoi,
      predictedProfit: forecast.predictedProfit,
      calibratedProfit: forecast.predictedProfit,
      realizationRate: 1,
      basis: 'No track record yet',
      sampleSize: summary.sampleSize,
      applied: false,
    };
  }

  return {
    predictedRoi: forecast.predictedRoi,
    calibratedRoi: round(forecast.predictedRoi * segment.realizationRate, 1),
    predictedProfit: forecast.predictedProfit,
    calibratedProfit: round(forecast.predictedProfit * segment.realizationRate),
    realizationRate: segment.realizationRate,
    basis: segment.label,
    sampleSize: segment.sampleSize,
    applied: true,
  };
}

/**
 * Condense the track record into prompt context so the scorer is anchored to
 * what this seller actually realizes rather than to generic FBA heuristics.
 */
export function buildCalibrationBrief(
  summary: CalibrationSummary,
  context: { category?: string } = {},
): string | undefined {
  if (!summary.overall || summary.overall.sampleSize < MIN_SAMPLE_SIZE) return undefined;

  const lines: string[] = [];
  const o = summary.overall;
  const asPercent = (rate: number) => `${Math.round(rate * 100)}%`;

  lines.push(
    `- Across ${o.sampleSize} resolved deals, realized ROI averaged ${o.realizedRoi}% against ${o.predictedRoi}% forecast (${asPercent(o.realizationRate)} of forecast).`,
  );
  lines.push(`- ${o.winRate}% of those deals were profitable.`);
  if (o.medianDaysToSell !== null) {
    lines.push(`- Median time to sell: ${o.medianDaysToSell} days.`);
  }

  const categorySegment = context.category
    ? summary.byCategory.find((s) => s.key === `category:${context.category}`)
    : undefined;
  if (categorySegment && categorySegment.sampleSize >= MIN_SAMPLE_SIZE) {
    lines.push(
      `- In ${categorySegment.label} specifically (${categorySegment.sampleSize} deals), realized ROI averaged ${asPercent(categorySegment.realizationRate)} of forecast with a ${categorySegment.winRate}% win rate.`,
    );
  }

  const topBand = summary.byScoreBand.find((s) => s.sampleSize >= MIN_SAMPLE_SIZE);
  if (topBand) {
    lines.push(
      `- ${topBand.label}: ${topBand.winRate}% win rate over ${topBand.sampleSize} deals.`,
    );
  }

  if (summary.bias === 'OPTIMISTIC') {
    lines.push(
      '- This seller\'s forecasts have run OPTIMISTIC. Be more conservative than the raw numbers suggest.',
    );
  } else if (summary.bias === 'PESSIMISTIC') {
    lines.push(
      '- This seller\'s forecasts have run PESSIMISTIC. Realized results have beaten forecast.',
    );
  }

  return lines.join('\n');
}
