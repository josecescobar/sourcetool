import React from 'react';

interface Props {
  product: {
    imageUrl?: string;
    title: string;
    asin?: string;
    brand?: string;
    category?: string;
    price?: number;
    bsr?: number;
    bsrCategory?: string;
    rating?: number;
    reviewCount?: number;
    offerCount?: number;
    listings?: Array<{
      currentPrice?: number;
      bsr?: number;
      bsrCategory?: string;
      rating?: number;
      reviewCount?: number;
      offerCount?: number;
    }>;
  };
  onAddToBuyList: () => void;
}

export function ProductHeader({ product, onAddToBuyList }: Props) {
  const listing = product.listings?.[0];
  const price = listing?.currentPrice ?? product.price;
  const bsr = listing?.bsr ?? product.bsr;
  const rating = listing?.rating ?? product.rating;
  const reviewCount = listing?.reviewCount ?? product.reviewCount;
  const offerCount = listing?.offerCount ?? product.offerCount;

  return (
    <div className="mb-3">
      <div className="flex gap-2 mb-2">
        {product.imageUrl && (
          <img src={product.imageUrl} alt="" className="w-14 h-14 rounded-md object-contain border flex-shrink-0" />
        )}
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold leading-tight line-clamp-2">{product.title}</h3>
          <div className="flex flex-wrap gap-x-2 mt-1 text-xs text-muted-foreground">
            {product.asin && <span>ASIN: {product.asin}</span>}
            {product.brand && <span>{product.brand}</span>}
            {product.category && <span>{product.category}</span>}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 text-xs mb-2">
        {price != null && <span className="text-base font-bold">${price.toFixed(2)}</span>}
        {bsr != null && <span className="text-muted-foreground">BSR #{bsr.toLocaleString()}</span>}
        {rating != null && (
          <span className="text-muted-foreground">
            {rating}/5 ({reviewCount ?? 0})
          </span>
        )}
        {offerCount != null && (
          <span className="text-muted-foreground">{offerCount} sellers</span>
        )}
      </div>

      <button
        onClick={onAddToBuyList}
        className="w-full rounded-md border px-3 py-1.5 text-xs font-medium hover:bg-secondary transition-colors"
      >
        + Add to Buy List
      </button>
    </div>
  );
}
