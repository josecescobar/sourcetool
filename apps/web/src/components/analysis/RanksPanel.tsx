import React from 'react';
import { Panel } from './StatTile';
import { money, integer } from './format';

interface RanksPanelProps {
  bsr?: number;
  bsrTopPercent?: number;
  buyBoxPrice?: number;
  lowestFba?: number;
  lowestFbm?: number;
  estTimeToSale?: string;
}

/** Ranks & Prices summary, mirroring SellerAmp's panel. */
export function RanksPanel({
  bsr,
  bsrTopPercent,
  buyBoxPrice,
  lowestFba,
  lowestFbm,
  estTimeToSale,
}: RanksPanelProps) {
  const rows: Array<[string, string]> = [
    ['BSR (Top %)', bsr != null ? `#${integer(bsr)}${bsrTopPercent != null ? ` (${bsrTopPercent}%)` : ''}` : '—'],
    ['Buy Box', money(buyBoxPrice)],
    ['Lowest FBA', money(lowestFba)],
    ['Lowest FBM', money(lowestFbm)],
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
