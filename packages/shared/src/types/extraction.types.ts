// Types for image-based product extraction (Claude vision): reading a product
// identifier / price / store from a shelf photo, packaging shot, barcode, or a
// screenshot of another seller tool. Shared across api, web, and extension.

export type IdentifierKind = 'asin' | 'upc' | 'ean' | 'title';

export interface ExtractedIdentifier {
  kind: IdentifierKind;
  value: string;
}

export interface ExtractionResult {
  identifier: ExtractedIdentifier | null;
  retailPriceCents?: number;
  storeName?: string;
  notes?: string;
}

export type ExtractionMediaType =
  | 'image/jpeg'
  | 'image/png'
  | 'image/webp'
  | 'image/gif';

export interface ImageExtractionInput {
  /** base64-encoded image data, with no `data:` URL prefix. */
  base64: string;
  mediaType: ExtractionMediaType;
}
