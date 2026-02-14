export type DealVerdict = 'STRONG_BUY' | 'BUY' | 'HOLD' | 'PASS' | 'STRONG_PASS';

export interface DealScoreInput {
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
}

export interface DealScoreOutput {
  score: number; // 0-100
  verdict: DealVerdict;
  reasoning: string;
  confidence: number; // 0-1
  factors: {
    profitability: { score: number; notes: string };
    competition: { score: number; notes: string };
    demand: { score: number; notes: string };
    risk: { score: number; notes: string };
  };
}

export interface SellThroughPrediction {
  estimatedDaysToSell: number;
  confidence: number;
  reasoning: string;
}
