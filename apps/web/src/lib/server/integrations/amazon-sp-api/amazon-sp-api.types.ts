// ── LWA Auth ─────────────────────────────────────────────────────────

export interface LwaTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

// ── Catalog Items API v2022-04-01 ────────────────────────────────────

export interface SpCatalogItemResponse {
  asin: string;
  summaries?: SpCatalogSummary[];
  identifiers?: SpCatalogIdentifierSet[];
  images?: SpCatalogImageSet[];
  dimensions?: SpCatalogDimensionSet[];
  salesRanks?: SpCatalogSalesRankSet[];
}

export interface SpCatalogSummary {
  marketplaceId: string;
  brandName?: string;
  itemName?: string;
  itemClassification?: string;
}

export interface SpCatalogIdentifierSet {
  marketplaceId: string;
  identifiers: Array<{
    identifierType: string;
    identifier: string;
  }>;
}

export interface SpCatalogImageSet {
  marketplaceId: string;
  images: Array<{
    variant: string;
    link: string;
    height: number;
    width: number;
  }>;
}

export interface SpCatalogDimensionSet {
  marketplaceId: string;
  item?: SpDimensionGroup;
  package?: SpDimensionGroup;
}

export interface SpDimensionGroup {
  height?: SpDimensionValue;
  length?: SpDimensionValue;
  width?: SpDimensionValue;
  weight?: SpDimensionValue;
}

export interface SpDimensionValue {
  value: number;
  unit: string;
}

export interface SpCatalogSalesRankSet {
  marketplaceId: string;
  classificationRanks?: Array<{
    classificationId: string;
    title: string;
    rank: number;
  }>;
  displayGroupRanks?: Array<{
    websiteDisplayGroup: string;
    title: string;
    rank: number;
  }>;
}

export interface SpSearchCatalogItemsResponse {
  numberOfResults: number;
  items: SpCatalogItemResponse[];
}

// ── Product Pricing API v0 ───────────────────────────────────────────

export interface SpCompetitivePricingResponse {
  payload: Array<{
    ASIN: string;
    status: string;
    Product?: {
      CompetitivePricing?: {
        CompetitivePrices?: Array<{
          CompetitivePriceId: string;
          belongsToRequester: boolean;
          condition: string;
          Price?: {
            LandedPrice?: SpMoneyType;
            ListingPrice?: SpMoneyType;
            Shipping?: SpMoneyType;
          };
        }>;
        NumberOfOfferListings?: Array<{
          condition: string;
          Count: number;
        }>;
      };
      SalesRankings?: Array<{
        ProductCategoryId: string;
        Rank: number;
      }>;
    };
  }>;
}

export interface SpMoneyType {
  CurrencyCode: string;
  Amount: number;
}

// ── Product Fees API v0 ──────────────────────────────────────────────

export interface SpFeesEstimateRequest {
  FeesEstimateRequest: {
    MarketplaceId: string;
    IdType: 'ASIN';
    IdValue: string;
    IsAmazonFulfilled: boolean;
    PriceToEstimateFees: {
      ListingPrice: SpMoneyType;
    };
    Identifier: string;
  };
}

export interface SpFeesEstimateResponse {
  payload?: {
    FeesEstimateResult?: {
      Status: string;
      FeesEstimate?: {
        TotalFeesEstimate?: SpMoneyType;
        FeeDetailList?: Array<{
          FeeType: string;
          FeeAmount: SpMoneyType;
          FeePromotion?: SpMoneyType;
          FinalFee: SpMoneyType;
        }>;
      };
    };
  };
  errors?: Array<{
    code: string;
    message: string;
  }>;
}
