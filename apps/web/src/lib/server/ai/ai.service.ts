import {
  scoreDeal,
  predictSellThrough,
  summarizeBulkScan,
  inferRiskFlags,
  type BulkScanSummaryInput,
  type RiskFlagsInput,
  type RiskFlags,
} from '@sourcetool/ai';
import type { DealScoreInput, DealScoreOutput, SellThroughPrediction } from '@sourcetool/shared';

export class AiService {
  async getDealScore(input: DealScoreInput): Promise<DealScoreOutput> {
    // Provider is SOURCETOOL_AI_PROVIDER. Off (the default) returns a heuristic
    // and makes no paid call. A failed provider does not fall across to another.
    return scoreDeal(input);
  }

  async getSellThrough(input: {
    title: string; category?: string; bsr?: number; sellPrice: number;
    offerCount?: number; fbaOfferCount?: number; isAmazonSelling?: boolean; avgBsr30d?: number;
  }): Promise<SellThroughPrediction> {
    return predictSellThrough(input);
  }

  async getBulkScanSummary(input: BulkScanSummaryInput): Promise<string> {
    return summarizeBulkScan(input);
  }

  async getRiskFlags(input: RiskFlagsInput): Promise<RiskFlags> {
    return inferRiskFlags(input);
  }
}
