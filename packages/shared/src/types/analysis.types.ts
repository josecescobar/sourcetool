import type { Marketplace, FulfillmentType } from './product.types';

export interface CalculateInput {
  productId?: string;
  asin?: string;
  marketplace: Marketplace;
  fulfillmentType: FulfillmentType;
  buyPrice: number;
  sellPrice: number;
  category?: string;
  dimensions?: {
    lengthInches: number;
    widthInches: number;
    heightInches: number;
    weightPounds: number;
  };
  prepFee?: number;
  inboundShipping?: number;
  monthsInStorage?: number;
  // Math expression support: e.g. "-10% +$2.50"
  buyPriceExpression?: string;
}

export interface FeeBreakdown {
  referralFee: number;
  referralFeePercent: number;
  fulfillmentFee: number;
  storageFee: number;
  prepFee: number;
  inboundShipping: number;
  totalFees: number;
  // eBay-specific
  paymentProcessingFee?: number;
  promotedListingFee?: number;
}

export interface ProfitResult {
  buyPrice: number;
  sellPrice: number;
  fees: FeeBreakdown;
  profit: number;
  roi: number; // percentage
  margin: number; // percentage
  breakeven: number; // minimum sell price to break even
}

export interface ScenarioResult {
  best: ProfitResult;
  expected: ProfitResult;
  worst: ProfitResult;
}

export interface BreakevenInput {
  marketplace: Marketplace;
  fulfillmentType: FulfillmentType;
  buyPrice: number;
  category?: string;
  dimensions?: {
    lengthInches: number;
    widthInches: number;
    heightInches: number;
    weightPounds: number;
  };
}

export interface CategoryFeeMap {
  [category: string]: {
    percentage: number;
    minimumFee?: number;
  };
}

export interface SizeTier {
  name: string;
  maxLength: number;
  maxWidth: number;
  maxHeight: number;
  maxWeight: number;
  fee: number;
}
