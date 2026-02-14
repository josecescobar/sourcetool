import type { Marketplace } from '@sourcetool/shared';

export interface ExternalProductData {
  asin?: string;
  upc?: string;
  ean?: string;
  title: string;
  brand?: string;
  category?: string;
  imageUrl?: string;
  dimensions?: {
    lengthInches?: number;
    widthInches?: number;
    heightInches?: number;
    weightPounds?: number;
  };
  listing?: {
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
  };
}

export interface ProductDataProvider {
  getByAsin(
    asin: string,
    marketplace?: Marketplace,
  ): Promise<ExternalProductData | null>;

  searchByBarcode(
    barcode: string,
    type: 'UPC' | 'EAN',
    marketplace?: Marketplace,
  ): Promise<ExternalProductData | null>;
}
