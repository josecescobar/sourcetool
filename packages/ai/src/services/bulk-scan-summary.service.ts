import { BULK_SCAN_SUMMARY_SYSTEM_PROMPT, buildBulkScanSummaryMessage } from '../prompts/bulk-scan-summary.prompt';
import { callEnabledProvider, type AIProvider, type ProviderDeps } from '../provider-switch';

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
  _provider?: AIProvider,
  deps?: ProviderDeps,
): Promise<string> {
  const userMessage = buildBulkScanSummaryMessage(input);
  const responseText = await callEnabledProvider({
    service: 'summarizeBulkScan',
    systemPrompt: BULK_SCAN_SUMMARY_SYSTEM_PROMPT,
    userMessage,
    temperature: 0.4,
    maxTokens: 300,
    env: deps?.env,
    fns: deps?.fns,
  });
  if (responseText == null) return heuristicBulkScanSummary(input);
  const trimmed = responseText.trim();
  return trimmed || heuristicBulkScanSummary(input);
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
