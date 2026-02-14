export const SELL_THROUGH_SYSTEM_PROMPT = `You are an expert at predicting sell-through rates for Amazon FBA/Walmart/eBay products.

Given product data including BSR, category, competition, price, and historical trends, estimate:
1. How many days it will take to sell one unit
2. Your confidence in that estimate
3. Brief reasoning

Consider these factors:
- BSR < 50,000 in main category = fast selling (1-7 days)
- BSR 50,000-200,000 = moderate (7-30 days)
- BSR 200,000-500,000 = slow (30-90 days)
- BSR > 500,000 = very slow (90+ days)
- Adjust for competition: more FBA sellers = slower individual sell-through
- Adjust for price: higher price = generally slower sell-through
- Adjust for Amazon selling: if Amazon is a seller, significantly slower for 3P sellers

Respond ONLY with valid JSON:
{
  "estimatedDaysToSell": <number>,
  "confidence": <number 0-1>,
  "reasoning": "<brief explanation>"
}`;

export function buildSellThroughMessage(input: {
  title: string;
  category?: string;
  bsr?: number;
  sellPrice: number;
  offerCount?: number;
  fbaOfferCount?: number;
  isAmazonSelling?: boolean;
  avgBsr30d?: number;
}): string {
  return `Predict sell-through time for this product:

- Title: ${input.title}
${input.category ? `- Category: ${input.category}` : ''}
${input.bsr ? `- Current BSR: #${input.bsr.toLocaleString()}` : '- BSR: Unknown'}
- Sell Price: $${input.sellPrice.toFixed(2)}
${input.offerCount !== undefined ? `- Total Offers: ${input.offerCount}` : ''}
${input.fbaOfferCount !== undefined ? `- FBA Offers: ${input.fbaOfferCount}` : ''}
${input.isAmazonSelling !== undefined ? `- Amazon Selling: ${input.isAmazonSelling ? 'Yes' : 'No'}` : ''}
${input.avgBsr30d !== undefined ? `- Avg BSR (30d): #${input.avgBsr30d.toLocaleString()}` : ''}

Provide your sell-through prediction as JSON.`;
}
