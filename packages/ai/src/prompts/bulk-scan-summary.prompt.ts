export const BULK_SCAN_SUMMARY_SYSTEM_PROMPT = `You are an expert wholesale sourcing analyst helping an Amazon/Walmart/eBay reseller review a bulk catalog scan.

You will be given aggregate stats for the scan plus the standout winners and losers (by profit/ROI). Write a short, punchy summary of the batch: how it looks overall, what to buy first, and what to avoid.

Guidelines:
- 3-5 sentences, plain text only — no markdown, no bullet points, no JSON.
- Lead with the headline (e.g. how many items look profitable and the average ROI).
- Call out the single best pick by name if one stands out.
- Call out any red flags: a high failure rate, several loss-making items, thin margins across the board.
- Be direct and concrete — use the actual numbers you were given, don't hedge with generic advice.`;

export function buildBulkScanSummaryMessage(input: {
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
}): string {
  return `Summarize this bulk scan:

FILE: ${input.fileName}
MARKETPLACE: ${input.marketplace} (${input.fulfillmentType})

RESULTS:
- Total rows: ${input.totalRows}
- Successfully matched: ${input.successRows}
- Failed to match: ${input.failedRows}
- Profitable items (positive profit): ${input.profitableCount}
- Strong buys (ROI >= 30%): ${input.strongBuyCount}
- Average ROI across matched items: ${input.avgRoi.toFixed(1)}%
- Average profit across matched items: $${input.avgProfit.toFixed(2)}

TOP WINNERS:
${input.topWinners.length > 0
    ? input.topWinners.map((w) => `- ${w.title}: $${w.profit.toFixed(2)} profit, ${w.roi.toFixed(1)}% ROI`).join('\n')
    : '- None'}

TOP LOSERS:
${input.topLosers.length > 0
    ? input.topLosers.map((l) => `- ${l.title}: $${l.profit.toFixed(2)} profit, ${l.roi.toFixed(1)}% ROI`).join('\n')
    : '- None'}

Write the summary now.`;
}
