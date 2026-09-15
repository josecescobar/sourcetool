import type { DealVerdict } from './ai.types';

/**
 * What was known about a product at the moment a buy decision was scored.
 *
 * Frozen onto the analysis because live product data drifts: by the time a unit
 * sells, its BSR and offer count no longer resemble the numbers the forecast was
 * built from. Calibration is only meaningful against the inputs actually used.
 */
export interface DecisionSnapshot {
  category?: string;
  brand?: string;
  bsr?: number;
  offerCount?: number;
  fbaOfferCount?: number;
  isAmazonSelling?: boolean;
  rating?: number;
  reviewCount?: number;
  aiScore?: number;
  aiVerdict?: DealVerdict;
  aiConfidence?: number;
}

/** One forecast paired with what actually happened. */
export interface ResolvedOutcome {
  predictedProfit: number;
  predictedRoi: number;
  realizedProfit: number;
  realizedRoi: number;
  category?: string;
  aiScore?: number;
  aiVerdict?: DealVerdict;
  /** Calendar days from purchase to sale. */
  daysToSell?: number;
}

export interface CalibrationSegment {
  key: string;
  label: string;
  sampleSize: number;
  predictedRoi: number;
  realizedRoi: number;
  predictedProfit: number;
  realizedProfit: number;
  /**
   * Mean realized ROI over mean predicted ROI. 1.0 is perfectly calibrated,
   * 0.6 means this segment delivers 60% of what it promises.
   */
  realizationRate: number;
  /** Share of outcomes that actually made money. */
  winRate: number;
  medianDaysToSell: number | null;
}

export type CalibrationBias =
  | 'OPTIMISTIC'
  | 'PESSIMISTIC'
  | 'CALIBRATED'
  | 'INSUFFICIENT_DATA';

export interface CalibrationSummary {
  sampleSize: number;
  /** Resolved outcomes needed before any segment is treated as trustworthy. */
  minSampleSize: number;
  bias: CalibrationBias;
  overall: CalibrationSegment | null;
  byCategory: CalibrationSegment[];
  byScoreBand: CalibrationSegment[];
  byVerdict: CalibrationSegment[];
  generatedAt: string;
}

/** A forecast adjusted by the team's own track record. */
export interface CalibratedForecast {
  predictedRoi: number;
  calibratedRoi: number;
  predictedProfit: number;
  calibratedProfit: number;
  realizationRate: number;
  /** Which segment supplied the adjustment, for explainability. */
  basis: string;
  sampleSize: number;
  applied: boolean;
}
