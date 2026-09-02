import type { Marketplace } from '@sourcetool/shared';
import type { ExternalProductData } from '../interfaces/product-data-provider.interface';
import type { RainforestProduct } from './rainforest.types';
import { DEFAULT_MARKETPLACE } from './rainforest.constants';

export function mapRainforestProduct(
  product: RainforestProduct,
  marketplace: Marketplace = DEFAULT_MARKETPLACE,
): ExternalProductData {
  // BSR: first entry in bestsellers_rank array
  const topRank = product.bestsellers_rank?.[0];

  // Price: prefer buybox winner, fall back to product.price
  const price =
    product.buybox_winner?.price?.value ?? product.price?.value;

  // Amazon selling check
  const isAmazonSelling =
    product.buybox_winner?.fulfillment?.is_sold_by_amazon;

  // Dimensions parsing: "10.2 x 7.8 x 1.5 inches" → { l, w, h }
  const dims = parseDimensions(product.dimensions);
  const weight = parseWeight(product.weight);

  // UPC/EAN from specifications
  const upc = findSpec(product.specifications, 'UPC')
    ?? findSpec(product.specifications, 'upc');
  const ean = findSpec(product.specifications, 'EAN')
    ?? findSpec(product.specifications, 'ean');

  // Category from bestsellers_rank or categories
  const category =
    topRank?.category ?? product.categories?.[0]?.name;

  return {
    asin: product.asin,
    upc: upc ?? undefined,
    ean: ean ?? undefined,
    title: product.title ?? product.asin ?? 'Unknown',
    brand: product.brand,
    category,
    imageUrl: product.main_image?.link,
    dimensions:
      dims || weight
        ? {
            lengthInches: dims?.length,
            widthInches: dims?.width,
            heightInches: dims?.height,
            weightPounds: weight,
          }
        : undefined,
    listing: {
      marketplace,
      marketplaceId: product.asin ?? '',
      currentPrice: price,
      buyBoxPrice: product.buybox_winner?.price?.value,
      bsr: topRank?.rank,
      bsrCategory: topRank?.category,
      isAmazonSelling,
      rating: product.rating,
      reviewCount: product.ratings_total,
    },
  };
}

function findSpec(
  specs: Array<{ name?: string; value?: string }> | undefined,
  name: string,
): string | null {
  if (!specs) return null;
  const spec = specs.find(
    (s) => s.name?.toLowerCase() === name.toLowerCase(),
  );
  return spec?.value ?? null;
}

function parseDimensions(
  raw: string | undefined,
): { length: number; width: number; height: number } | null {
  if (!raw) return null;
  // Match patterns like "10.2 x 7.8 x 1.5 inches" or "25.9 x 19.8 x 3.8 cm"
  const match = raw.match(
    /([\d.]+)\s*x\s*([\d.]+)\s*x\s*([\d.]+)\s*(inches|in|cm|centimeters)?/i,
  );
  if (!match) return null;

  let l = parseFloat(match[1]!);
  let w = parseFloat(match[2]!);
  let h = parseFloat(match[3]!);
  const unit = match[4]?.toLowerCase();

  if (unit === 'cm' || unit === 'centimeters') {
    l /= 2.54;
    w /= 2.54;
    h /= 2.54;
  }

  return {
    length: +l.toFixed(2),
    width: +w.toFixed(2),
    height: +h.toFixed(2),
  };
}

function parseWeight(raw: string | undefined): number | undefined {
  if (!raw) return undefined;
  // Match patterns like "2.5 pounds", "1.1 kg", "500 grams", "16 ounces"
  const match = raw.match(
    /([\d.]+)\s*(pounds?|lbs?|kg|kilograms?|grams?|g|ounces?|oz)/i,
  );
  if (!match) return undefined;

  const value = parseFloat(match[1]!);
  const unit = match[2]!.toLowerCase();

  if (unit.startsWith('pound') || unit.startsWith('lb')) return value;
  if (unit.startsWith('kg') || unit.startsWith('kilogram'))
    return +(value * 2.20462).toFixed(2);
  if (unit.startsWith('gram') || unit === 'g')
    return +(value * 0.00220462).toFixed(4);
  if (unit.startsWith('ounce') || unit === 'oz')
    return +(value / 16).toFixed(4);

  return value;
}
