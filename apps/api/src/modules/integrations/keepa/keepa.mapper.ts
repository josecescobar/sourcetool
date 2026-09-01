import type { Marketplace } from '@sourcetool/shared';
import type { ExternalProductData } from '../interfaces/product-data-provider.interface';
import type { KeepaProduct } from './keepa.types';
import {
  KEEPA_CSV_AMAZON,
  KEEPA_CSV_NEW,
  KEEPA_CSV_SALES_RANK,
  KEEPA_CSV_NEW_FBA,
  KEEPA_CSV_RATING,
  KEEPA_CSV_REVIEW_COUNT,
  KEEPA_CSV_BUY_BOX,
} from './keepa.types';

export function mapKeepaProduct(
  product: KeepaProduct,
  marketplace: Marketplace,
): ExternalProductData {
  const current = product.stats?.current;

  // ── Prices (Keepa stores as integer cents, -1 = no data) ─────────
  const buyBoxRaw = getStatValue(current, KEEPA_CSV_BUY_BOX);
  const amazonRaw = getStatValue(current, KEEPA_CSV_AMAZON);
  const newFbaRaw = getStatValue(current, KEEPA_CSV_NEW_FBA);
  const newRaw = getStatValue(current, KEEPA_CSV_NEW);

  const buyBoxPrice = buyBoxRaw != null ? buyBoxRaw / 100 : undefined;
  const currentPrice =
    buyBoxPrice ??
    (amazonRaw != null ? amazonRaw / 100 : undefined) ??
    (newFbaRaw != null ? newFbaRaw / 100 : undefined) ??
    (newRaw != null ? newRaw / 100 : undefined);

  // ── BSR ──────────────────────────────────────────────────────────
  const bsrRaw = getStatValue(current, KEEPA_CSV_SALES_RANK);
  const bsr = bsrRaw != null ? bsrRaw : undefined;
  const bsrCategory = product.categoryTree?.[0]?.name;

  // ── Rating & reviews ─────────────────────────────────────────────
  const ratingRaw = getStatValue(current, KEEPA_CSV_RATING);
  const rating = ratingRaw != null ? ratingRaw / 10 : undefined;

  const reviewCountRaw = getStatValue(current, KEEPA_CSV_REVIEW_COUNT);
  const reviewCount = reviewCountRaw != null ? reviewCountRaw : undefined;

  // ── Offer counts ─────────────────────────────────────────────────
  const fbaOfferCount = product.stockPerCondition3rdFBA?.[0] ?? undefined;
  const fbmOfferCount = product.stockPerConditionFBM?.[0] ?? undefined;
  const offerCount =
    fbaOfferCount != null && fbmOfferCount != null
      ? fbaOfferCount + fbmOfferCount
      : product.numberOfOffers ?? undefined;

  // ── Amazon selling ───────────────────────────────────────────────
  const isAmazonSelling = amazonRaw != null && amazonRaw > 0;

  // ── Image ────────────────────────────────────────────────────────
  const firstImage = product.imagesCSV?.split(',')[0];
  const imageUrl = firstImage
    ? `https://images-na.ssl-images-amazon.com/images/I/${firstImage}`
    : undefined;

  // ── Dimensions (mm → inches, grams → pounds) ────────────────────
  const hasItemDims =
    product.itemLength || product.itemWidth || product.itemHeight;
  const dims = hasItemDims
    ? {
        lengthInches: mmToInches(product.itemLength),
        widthInches: mmToInches(product.itemWidth),
        heightInches: mmToInches(product.itemHeight),
        weightPounds: gramsToPounds(product.itemWeight),
      }
    : product.packageLength || product.packageWidth || product.packageHeight
      ? {
          lengthInches: mmToInches(product.packageLength),
          widthInches: mmToInches(product.packageWidth),
          heightInches: mmToInches(product.packageHeight),
          weightPounds: gramsToPounds(product.packageWeight),
        }
      : undefined;

  return {
    asin: product.asin,
    title: product.title ?? product.asin ?? 'Unknown',
    brand: product.brand,
    category: bsrCategory,
    imageUrl,
    dimensions: dims,
    listing: {
      marketplace,
      marketplaceId: product.asin,
      currentPrice,
      buyBoxPrice,
      bsr,
      bsrCategory,
      offerCount,
      fbaOfferCount,
      isAmazonSelling,
      rating,
      reviewCount,
    },
  };
}

function getStatValue(
  current: number[] | undefined,
  index: number,
): number | null {
  if (!current || current.length <= index) return null;
  const val = current[index];
  return val != null && val !== -1 ? val : null;
}

function mmToInches(mm: number | undefined): number | undefined {
  if (mm == null || mm <= 0) return undefined;
  return +(mm / 25.4).toFixed(2);
}

function gramsToPounds(g: number | undefined): number | undefined {
  if (g == null || g <= 0) return undefined;
  return +(g / 453.592).toFixed(2);
}
