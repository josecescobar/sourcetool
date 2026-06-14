import React from 'react';
import { Panel } from './StatTile';
import { money, integer } from './format';

interface RanksPanelProps {
  bsr?: number;
  bsrTopPercent?: number;
  buyBoxPrice?: number;
  offerCount?: number;
  fbaOfferCount?: number;
  isAmazonSelling?: boolean;
  estTimeToSale?: string;
}

/** Ranks & Prices summary, mirroring SellerAmp's panel. */
export function RanksPanel({
  bsr,
  bsrTopPercent,
  buyBoxPrice,
  offerCount,
  fbaOfferCount,
  isAmazonSelling,
  estTimeToSale,
}: RanksPanelProps) {
  const rows: Array<[string, string]> = [
    ['BSR (Top %)', bsr != null ? `#${integer(bsr)}${bsrTopPercent != null ? ` (${bsrTopPercent}%)` : ''}` : '—'],
    ['Buy Box', money(buyBoxPrice)],
    ['Offers', offerCount != null ? integer(offerCount) : '—'],
    ['FBA Offers', fbaOfferCount != null ? integer(fbaOfferCount) : '—'],
    ['Amazon Selling', isAmazonSelling == null ? '—' : isAmazonSelling ? 'Yes' : 'No'],
    ['Est. Time to Sale', estTimeToSale || '—'],
  ];

  return (
    <Panel title="Ranks & Prices">
      <ul className="divide-y">
        {rows.map(([label, value]) => (
          <li key={label} className="flex items-center justify-between py-2 text-sm">
            <span className="text-muted-foreground">{label}</span>
            <span className="font-medium">{value}</span>
          </li>
        ))}
      </ul>
    </Panel>
  );
}
