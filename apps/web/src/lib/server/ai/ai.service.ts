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
    // Prefer the free Vercel AI Gateway (MiniMax M3) model; scoreDeal() falls
    // back to Anthropic internally if the Gateway call fails.
    return scoreDeal(input, 'vercel');
  }

  async getSellThrough(input: {
    title: string; category?: string; bsr?: number; sellPrice: number;
    offerCount?: number; fbaOfferCount?: number; isAmazonSelling?: boolean; avgBsr30d?: number;
  }): Promise<SellThroughPrediction> {
    // Prefer the free Vercel AI Gateway (MiniMax M3) model; predictSellThrough()
    // falls back to Anthropic, then a heuristic, if the Gateway call fails.
    return predictSellThrough(input, 'vercel');
  }

  async getBulkScanSummary(input: BulkScanSummaryInput): Promise<string> {
    // Prefer the free Vercel AI Gateway (MiniMax M3) model; summarizeBulkScan()
    // falls back to Anthropic, then a deterministic heuristic, if the Gateway call fails.
    return summarizeBulkScan(input, 'vercel');
  }

  async getRiskFlags(input: RiskFlagsInput): Promise<RiskFlags> {
    // Prefer the free Vercel AI Gateway (MiniMax M3) model; inferRiskFlags()
    // falls back to Anthropic, then a conservative keyword heuristic, if the
    // Gateway call fails.
    return inferRiskFlags(input, 'vercel');
  }
}
