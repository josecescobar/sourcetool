import type { Marketplace } from '@sourcetool/shared';
import type { ExternalProductData } from '../interfaces/product-data-provider.interface';
import type {
  SpCatalogItemResponse,
  SpCompetitivePricingResponse,
  SpFeesEstimateResponse,
  SpDimensionValue,
} from './amazon-sp-api.types';

export interface SpApiMergedData {
  catalog: SpCatalogItemResponse;
  pricing: SpCompetitivePricingResponse | null;
  fees: SpFeesEstimateResponse | null;
}

export function mapSpApiProduct(
  data: SpApiMergedData,
  marketplaceId: string,
  marketplace: Marketplace,
): ExternalProductData {
  const { catalog, pricing } = data;

  // ── Summaries ────────────────────────────────────────────────────
  const summary =
    catalog.summaries?.find((s) => s.marketplaceId === marketplaceId) ??
    catalog.summaries?.[0];

  // ── Identifiers ──────────────────────────────────────────────────
  const identifierSet =
    catalog.identifiers?.find((i) => i.marketplaceId === marketplaceId) ??
    catalog.identifiers?.[0];

  const upc = identifierSet?.identifiers?.find(
    (i) => i.identifierType === 'UPC' || i.identifierType === 'GTIN',
  )?.identifier;

  const ean = identifierSet?.identifiers?.find(
    (i) => i.identifierType === 'EAN',
  )?.identifier;

  // ── Images ───────────────────────────────────────────────────────
  const imageSet =
    catalog.images?.find((i) => i.marketplaceId === marketplaceId) ??
    catalog.images?.[0];
  const mainImage =
    imageSet?.images?.find((img) => img.variant === 'MAIN') ??
    imageSet?.images?.[0];

  // ── Dimensions ───────────────────────────────────────────────────
  const dimSet =
    catalog.dimensions?.find((d) => d.marketplaceId === marketplaceId) ??
    catalog.dimensions?.[0];
  const itemDims = dimSet?.item ?? dimSet?.package;
  const dimensions = itemDims
    ? {
        lengthInches: convertToInches(itemDims.length),
        widthInches: convertToInches(itemDims.width),
        heightInches: convertToInches(itemDims.height),
        weightPounds: convertToPounds(itemDims.weight),
      }
    : undefined;

  // ── Sales Ranks ──────────────────────────────────────────────────
  const rankSet =
    catalog.salesRanks?.find((r) => r.marketplaceId === marketplaceId) ??
    catalog.salesRanks?.[0];
  const topRank =
    rankSet?.classificationRanks?.[0] ?? rankSet?.displayGroupRanks?.[0];

  // ── Pricing ──────────────────────────────────────────────────────
  const pricingProduct = pricing?.payload?.[0]?.Product;
  const competitivePrices =
    pricingProduct?.CompetitivePricing?.CompetitivePrices ?? [];

  const buyBoxEntry = competitivePrices.find(
    (cp) => cp.CompetitivePriceId === '1' && cp.condition === 'New',
  );
  const buyBoxPrice = buyBoxEntry?.Price?.LandedPrice?.Amount;
  const currentPrice = buyBoxPrice ?? buyBoxEntry?.Price?.ListingPrice?.Amount;

  const offerListings =
    pricingProduct?.CompetitivePricing?.NumberOfOfferListings ?? [];
  const offerCount = offerListings.find((o) => o.condition === 'New')?.Count;

  // ── BSR (catalog preferred, pricing fallback) ────────────────────
  const pricingBsr = pricingProduct?.SalesRankings?.[0];
  const bsr = topRank?.rank ?? pricingBsr?.Rank;
  const bsrCategory =
    topRank && 'title' in topRank
      ? topRank.title
      : pricingBsr?.ProductCategoryId;

  return {
    asin: catalog.asin,
    upc,
    ean,
    title: summary?.itemName ?? catalog.asin ?? 'Unknown',
    brand: summary?.brandName,
    category: bsrCategory ?? summary?.itemClassification,
    imageUrl: mainImage?.link,
    dimensions,
    listing: {
      marketplace,
      marketplaceId: catalog.asin,
      currentPrice,
      buyBoxPrice,
      bsr,
      bsrCategory,
      offerCount,
    },
  };
}

// ── Unit conversion helpers ──────────────────────────────────────────

function convertToInches(dim: SpDimensionValue | undefined): number | undefined {
  if (!dim) return undefined;
  const unit = dim.unit.toLowerCase();
  if (unit === 'inches' || unit === 'in') return +dim.value.toFixed(2);
  if (unit === 'centimeters' || unit === 'cm') return +(dim.value / 2.54).toFixed(2);
  if (unit === 'meters' || unit === 'm') return +(dim.value * 39.3701).toFixed(2);
  return +dim.value.toFixed(2);
}

function convertToPounds(dim: SpDimensionValue | undefined): number | undefined {
  if (!dim) return undefined;
  const unit = dim.unit.toLowerCase();
  if (unit === 'pounds' || unit === 'lbs' || unit === 'lb') return +dim.value.toFixed(2);
  if (unit === 'kilograms' || unit === 'kg') return +(dim.value * 2.20462).toFixed(2);
  if (unit === 'grams' || unit === 'g') return +(dim.value * 0.00220462).toFixed(4);
  if (unit === 'ounces' || unit === 'oz') return +(dim.value / 16).toFixed(4);
  return +dim.value.toFixed(2);
}
