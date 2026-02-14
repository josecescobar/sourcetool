export const DEAL_SCORE_SYSTEM_PROMPT = `You are an expert Amazon FBA/Walmart/eBay product sourcing analyst. Your job is to evaluate product deals for resellers and provide a deal score from 0-100 along with a verdict.

You will be given product data including:
- Product details (title, category, brand, BSR, ratings)
- Profitability metrics (buy price, sell price, profit, ROI, margin, fees)
- Competition data (offer count, FBA offers, Amazon selling status)
- Historical data (price trends, BSR trends)
- Risk alerts (IP complaints, hazmat, restrictions)

Scoring Guidelines:
- 80-100: STRONG_BUY — Exceptional deal. High ROI (>50%), low competition, strong demand, no risk flags
- 60-79: BUY — Good deal. Solid ROI (30-50%), manageable competition, steady demand
- 40-59: HOLD — Marginal deal. Moderate ROI (15-30%), some concerns about competition or demand
- 20-39: PASS — Poor deal. Low ROI (<15%), high competition, declining demand, or risk flags
- 0-19: STRONG_PASS — Avoid. Negative/minimal profit, serious risk flags, or heavily saturated

Factor Weights:
- Profitability (35%): ROI, margin, absolute profit amount
- Competition (25%): Number of sellers, FBA sellers, Amazon selling
- Demand (25%): BSR ranking, BSR trend, review velocity
- Risk (15%): IP complaints, hazmat, restrictions, meltable, oversized

Respond ONLY with valid JSON matching this exact format:
{
  "score": <number 0-100>,
  "verdict": "<STRONG_BUY|BUY|HOLD|PASS|STRONG_PASS>",
  "reasoning": "<1-2 sentence natural language summary starting with the verdict>",
  "confidence": <number 0-1>,
  "factors": {
    "profitability": { "score": <0-100>, "notes": "<brief note>" },
    "competition": { "score": <0-100>, "notes": "<brief note>" },
    "demand": { "score": <0-100>, "notes": "<brief note>" },
    "risk": { "score": <0-100>, "notes": "<brief note>" }
  }
}`;

export function buildDealScoreUserMessage(input: {
  product: {
    title: string;
    asin?: string;
    category?: string;
    brand?: string;
    bsr?: number;
    bsrCategory?: string;
    rating?: number;
    reviewCount?: number;
  };
  profitability: {
    buyPrice: number;
    sellPrice: number;
    profit: number;
    roi: number;
    margin: number;
    fees: number;
  };
  competition: {
    offerCount?: number;
    fbaOfferCount?: number;
    isAmazonSelling?: boolean;
    buyBoxPrice?: number;
  };
  history?: {
    avgPrice30d?: number;
    avgPrice90d?: number;
    avgBsr30d?: number;
    avgBsr90d?: number;
    priceDropPercent30d?: number;
  };
  alerts?: {
    hasIpComplaints: boolean;
    isHazmat: boolean;
    isRestricted: boolean;
    isMeltable: boolean;
    isOversized: boolean;
  };
}): string {
  return `Analyze this product deal:

PRODUCT:
- Title: ${input.product.title}
${input.product.asin ? `- ASIN: ${input.product.asin}` : ''}
${input.product.category ? `- Category: ${input.product.category}` : ''}
${input.product.brand ? `- Brand: ${input.product.brand}` : ''}
${input.product.bsr ? `- BSR: #${input.product.bsr.toLocaleString()}${input.product.bsrCategory ? ` in ${input.product.bsrCategory}` : ''}` : ''}
${input.product.rating ? `- Rating: ${input.product.rating}/5 (${input.product.reviewCount ?? 0} reviews)` : ''}

PROFITABILITY:
- Buy Price: $${input.profitability.buyPrice.toFixed(2)}
- Sell Price: $${input.profitability.sellPrice.toFixed(2)}
- Total Fees: $${input.profitability.fees.toFixed(2)}
- Profit: $${input.profitability.profit.toFixed(2)}
- ROI: ${input.profitability.roi.toFixed(1)}%
- Margin: ${input.profitability.margin.toFixed(1)}%

COMPETITION:
${input.competition.offerCount !== undefined ? `- Total Offers: ${input.competition.offerCount}` : ''}
${input.competition.fbaOfferCount !== undefined ? `- FBA Offers: ${input.competition.fbaOfferCount}` : ''}
${input.competition.isAmazonSelling !== undefined ? `- Amazon Selling: ${input.competition.isAmazonSelling ? 'YES' : 'No'}` : ''}
${input.competition.buyBoxPrice !== undefined ? `- Buy Box Price: $${input.competition.buyBoxPrice.toFixed(2)}` : ''}

${input.history ? `HISTORICAL DATA:
${input.history.avgPrice30d !== undefined ? `- Avg Price (30d): $${input.history.avgPrice30d.toFixed(2)}` : ''}
${input.history.avgPrice90d !== undefined ? `- Avg Price (90d): $${input.history.avgPrice90d.toFixed(2)}` : ''}
${input.history.avgBsr30d !== undefined ? `- Avg BSR (30d): #${input.history.avgBsr30d.toLocaleString()}` : ''}
${input.history.avgBsr90d !== undefined ? `- Avg BSR (90d): #${input.history.avgBsr90d.toLocaleString()}` : ''}
${input.history.priceDropPercent30d !== undefined ? `- Price Drop (30d): ${input.history.priceDropPercent30d.toFixed(1)}%` : ''}` : ''}

${input.alerts ? `RISK ALERTS:
- IP Complaints: ${input.alerts.hasIpComplaints ? 'YES ⚠️' : 'None'}
- Hazmat: ${input.alerts.isHazmat ? 'YES ⚠️' : 'No'}
- Restricted: ${input.alerts.isRestricted ? 'YES ⚠️' : 'No'}
- Meltable: ${input.alerts.isMeltable ? 'YES ⚠️' : 'No'}
- Oversized: ${input.alerts.isOversized ? 'YES ⚠️' : 'No'}` : ''}

Provide your deal score analysis as JSON.`;
}
