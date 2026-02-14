import { isValidAsin, extractAsin } from './asin-validator';
import { isValidUpc, isValidEan } from './upc-validator';

export type IdentifierType = 'ASIN' | 'UPC' | 'EAN' | 'URL' | 'UNKNOWN';

export interface DetectedIdentifier {
  type: IdentifierType;
  value: string;
  marketplace?: string;
}

export function detectIdentifier(input: string): DetectedIdentifier {
  const trimmed = input.trim();

  // Check if it's a URL
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.includes('amazon.') || trimmed.includes('walmart.') || trimmed.includes('ebay.')) {
    const asin = extractAsin(trimmed);
    if (asin) {
      const marketplace = detectMarketplaceFromUrl(trimmed);
      return { type: 'ASIN', value: asin, marketplace };
    }
    return { type: 'URL', value: trimmed };
  }

  // Check ASIN
  if (isValidAsin(trimmed)) {
    return { type: 'ASIN', value: trimmed.toUpperCase() };
  }

  // Check UPC (12 digits)
  if (isValidUpc(trimmed)) {
    return { type: 'UPC', value: trimmed };
  }

  // Check EAN (13 digits)
  if (isValidEan(trimmed)) {
    return { type: 'EAN', value: trimmed };
  }

  // Fallback: treat 12/13-digit numbers as UPC/EAN even if check digit fails
  if (/^\d{12}$/.test(trimmed)) {
    return { type: 'UPC', value: trimmed };
  }
  if (/^\d{13}$/.test(trimmed)) {
    return { type: 'EAN', value: trimmed };
  }

  return { type: 'UNKNOWN', value: trimmed };
}

function detectMarketplaceFromUrl(url: string): string | undefined {
  if (url.includes('amazon.com')) return 'AMAZON_US';
  if (url.includes('amazon.ca')) return 'AMAZON_CA';
  if (url.includes('amazon.co.uk')) return 'AMAZON_UK';
  if (url.includes('amazon.de')) return 'AMAZON_DE';
  if (url.includes('walmart.com')) return 'WALMART_US';
  if (url.includes('ebay.com')) return 'EBAY_US';
  if (url.includes('ebay.co.uk')) return 'EBAY_UK';
  return undefined;
}
