import React from 'react';
import { Panel } from './StatTile';
import { money, percent, integer } from './format';

export interface Offer {
  seller?: string;
  fulfillment?: string; // 'FBA' | 'FBM' | 'SFP'
  stock?: number;
  price?: number;
  profit?: number;
  roi?: number;
}

interface OffersPanelProps {
  offers?: Offer[];
  /** Aggregate counts from the listing, shown when per-seller rows aren't available. */
  offerCount?: number;
  fbaOfferCount?: number;
}

/** Live offers table (Seller / Stock / Price / Profit / ROI, FBA vs FBM/SFP). */
export function OffersPanel({ offers, offerCount, fbaOfferCount }: OffersPanelProps) {
  const fbaCount = offers?.length
    ? offers.filter((o) => o.fulfillment === 'FBA').length
    : fbaOfferCount;
  const totalCount = offers?.length ?? offerCount;

  return (
    <Panel
      title="Offers"
      right={
        totalCount != null ? (
          <span className="text-xs text-muted-foreground">
            {totalCount} total{fbaCount != null ? ` · ${fbaCount} FBA` : ''}
          </span>
        ) : undefined
      }
    >
      {!offers?.length ? (
        <p className="py-6 text-center text-sm text-muted-foreground">
          {totalCount != null
            ? `${totalCount} offer${totalCount === 1 ? '' : 's'} on this listing${
                fbaCount != null ? ` (${fbaCount} FBA)` : ''
              }. Per-seller breakdown not available yet.`
            : 'No live offers available for this product.'}
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-muted-foreground">
                <th className="pb-2 font-medium">Seller</th>
                <th className="pb-2 font-medium">Stock</th>
                <th className="pb-2 text-right font-medium">Price</th>
                <th className="pb-2 text-right font-medium">Profit</th>
                <th className="pb-2 text-right font-medium">ROI</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {offers.map((o, i) => (
                <tr key={i}>
                  <td className="py-2">
                    <span className="inline-flex items-center gap-1.5">
                      {o.fulfillment && (
                        <span className="rounded bg-secondary px-1.5 py-0.5 text-[10px] font-semibold text-secondary-foreground">
                          {o.fulfillment}
                        </span>
                      )}
                      {o.seller || '—'}
                    </span>
                  </td>
                  <td className="py-2">{integer(o.stock)}</td>
                  <td className="py-2 text-right">{money(o.price)}</td>
                  <td
                    className={`py-2 text-right ${(o.profit ?? 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}
                  >
                    {money(o.profit)}
                  </td>
                  <td className="py-2 text-right">{percent(o.roi)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Panel>
  );
}
