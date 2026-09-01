import { generateWithClaude } from '../providers/anthropic.provider';
import { generateWithOpenAI } from '../providers/openai.provider';
import { generateWithVercelGateway } from '../providers/vercel-gateway.provider';
import { BULK_SCAN_SUMMARY_SYSTEM_PROMPT, buildBulkScanSummaryMessage } from '../prompts/bulk-scan-summary.prompt';
import type { AIProvider } from './deal-scoring.service';

export interface BulkScanSummaryInput {
  fileName: string;
  marketplace: string;
  fulfillmentType: string;
  totalRows: number;
  successRows: number;
  failedRows: number;
  avgRoi: number;
  avgProfit: number;
  profitableCount: number;
  strongBuyCount: number;
  topWinners: Array<{ title: string; profit: number; roi: number }>;
  topLosers: Array<{ title: string; profit: number; roi: number }>;
}

export async function summarizeBulkScan(
  input: BulkScanSummaryInput,
  provider: AIProvider = 'anthropic'
): Promise<string> {
  const userMessage = buildBulkScanSummaryMessage(input);

  try {
    if (provider === 'anthropic') {
      return (await generateWithClaude(BULK_SCAN_SUMMARY_SYSTEM_PROMPT, userMessage, {
        temperature: 0.4,
        maxTokens: 300,
      })).trim();
    } else if (provider === 'vercel') {
      return (await generateWithVercelGateway(BULK_SCAN_SUMMARY_SYSTEM_PROMPT, userMessage, {
        temperature: 0.4,
        maxTokens: 300,
      })).trim();
    } else {
      return (await generateWithOpenAI(BULK_SCAN_SUMMARY_SYSTEM_PROMPT, userMessage, {
        temperature: 0.4,
        maxTokens: 300,
      })).trim();
    }
  } catch (error) {
    // If the Gateway call fails, try Anthropic before giving up to the heuristic.
    if (provider === 'vercel' && process.env.ANTHROPIC_API_KEY) {
      try {
        return (await generateWithClaude(BULK_SCAN_SUMMARY_SYSTEM_PROMPT, userMessage, {
          temperature: 0.4,
          maxTokens: 300,
        })).trim();
      } catch {
        return heuristicBulkScanSummary(input);
      }
    } else if (provider === 'anthropic' && process.env.OPENAI_API_KEY) {
      try {
        return (await generateWithOpenAI(BULK_SCAN_SUMMARY_SYSTEM_PROMPT, userMessage, {
          temperature: 0.4,
          maxTokens: 300,
        })).trim();
      } catch {
        return heuristicBulkScanSummary(input);
      }
    }
    return heuristicBulkScanSummary(input);
  }
}

function heuristicBulkScanSummary(input: BulkScanSummaryInput): string {
  const successRate = input.totalRows > 0 ? Math.round((input.successRows / input.totalRows) * 100) : 0;
  const best = input.topWinners[0];
  const worst = input.topLosers[0];

  let summary = `Scanned ${input.totalRows} items (${successRate}% matched) — ${input.profitableCount} look profitable with an average ROI of ${input.avgRoi.toFixed(1)}% and average profit of $${input.avgProfit.toFixed(2)}.`;

  if (best) {
    summary += ` Top pick: "${best.title}" at $${best.profit.toFixed(2)} profit (${best.roi.toFixed(1)}% ROI).`;
  }
  if (worst && worst.profit < 0) {
    summary += ` Watch out for "${worst.title}" — it's losing $${Math.abs(worst.profit).toFixed(2)} at current pricing.`;
  }
  if (input.failedRows > 0) {
    summary += ` ${input.failedRows} item(s) couldn't be matched to a listing.`;
  }

  return summary;
}
