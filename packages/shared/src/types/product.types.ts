export interface Product {
  id: string;
  asin?: string;
  upc?: string;
  ean?: string;
  title: string;
  brand?: string;
  category?: string;
  imageUrl?: string;
  dimensions?: ProductDimensions;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductDimensions {
  lengthInches: number;
  widthInches: number;
  heightInches: number;
  weightPounds: number;
}

export interface MarketplaceListing {
  id: string;
  productId: string;
  marketplace: Marketplace;
  marketplaceId: string;
  currentPrice?: number;
  buyBoxPrice?: number;
  bsr?: number;
  bsrCategory?: string;
  offerCount?: number;
  fbaOfferCount?: number;
  isAmazonSelling?: boolean;
  rating?: number;
  reviewCount?: number;
  lastFetchedAt?: Date;
}

export type Marketplace =
  | 'AMAZON_US' | 'AMAZON_CA' | 'AMAZON_UK' | 'AMAZON_DE'
  | 'WALMART_US' | 'EBAY_US' | 'EBAY_UK';

export type FulfillmentType =
  | 'FBA' | 'FBM' | 'WFS' | 'WFM' | 'EBAY_MANAGED' | 'EBAY_SELLER';
