import React from 'react';
import { StatTile } from './StatTile';
import { money, integer } from './format';

interface QuickInfoProps {
  bsr?: number;
  bsrTopPercent?: number;
  estSales?: number | null;
  price?: number;
  offerCount?: number;
  /** Highest buy cost that still hits the target ROI (computed from fees). */
  maxCost?: number | null;
  targetRoi?: number;
}

/** At-a-glance row: BSR, estimated sales, price, offers, max cost. */
export function QuickInfo({
  bsr,
  bsrTopPercent,
  estSales,
  price,
  offerCount,
  maxCost,
  targetRoi = 30,
}: QuickInfoProps) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      <StatTile
        label="BSR"
        value={bsr != null ? `#${integer(bsr)}` : '—'}
        sub={bsrTopPercent != null ? `Top ${bsrTopPercent}%` : undefined}
        tone="neutral"
      />
      <StatTile label="Est. Sales / mo" value={estSales != null ? `${integer(estSales)}+` : '—'} />
      <StatTile label="Buy Box / Price" value={money(price)} />
      <StatTile label="Offers" value={offerCount != null ? integer(offerCount) : '—'} />
      <StatTile
        label="Max Cost"
        value={money(maxCost ?? undefined)}
        sub={`@ ${targetRoi}% ROI`}
        tone={maxCost != null ? 'good' : 'neutral'}
      />
    </div>
  );
}
