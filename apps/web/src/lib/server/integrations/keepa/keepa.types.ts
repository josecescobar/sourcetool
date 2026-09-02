export interface KeepaResponse {
  products?: KeepaProduct[];
  tokensConsumed?: number;
  tokensLeft?: number;
  error?: { message: string };
}

export interface KeepaProduct {
  asin: string;
  title?: string;
  brand?: string;
  rating?: number;
  imagesCSV?: string;
  categoryTree?: Array<{ catId: number; name: string }>;
  itemHeight?: number;
  itemLength?: number;
  itemWidth?: number;
  itemWeight?: number;
  packageHeight?: number;
  packageLength?: number;
  packageWidth?: number;
  packageWeight?: number;
  stats?: KeepaStats;
  offers?: KeepaOffer[];
  numberOfOffers?: number;
  stockPerCondition3rdFBA?: number[];
  stockPerConditionFBM?: number[];
}

export interface KeepaStats {
  current: number[];
}

export interface KeepaOffer {
  sellerId?: string;
  condition?: number;
  isPrime?: boolean;
  isFBA?: boolean;
  isBuyBoxWinner?: boolean;
  offerCSV?: number[];
}

// CsvType indices for stats.current array
export const KEEPA_CSV_AMAZON = 0;
export const KEEPA_CSV_NEW = 1;
export const KEEPA_CSV_SALES_RANK = 3;
export const KEEPA_CSV_NEW_FBA = 10;
export const KEEPA_CSV_RATING = 16;
export const KEEPA_CSV_REVIEW_COUNT = 17;
export const KEEPA_CSV_BUY_BOX = 18;
