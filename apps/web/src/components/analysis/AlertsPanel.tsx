import React from 'react';
import { Panel } from './StatTile';

type AlertTone = 'good' | 'bad' | 'warn' | 'muted';

interface AlertRow {
  label: string;
  value: string;
  tone: AlertTone;
}

const toneClass: Record<AlertTone, string> = {
  good: 'text-green-600',
  bad: 'text-red-600',
  warn: 'text-yellow-600',
  muted: 'text-muted-foreground',
};

interface AlertsPanelProps {
  product: {
    buyBoxPrice?: number;
    variationCount?: number;
    dimensions?: unknown;
    flags?: Partial<Record<string, { value: string; tone?: AlertTone }>>;
  };
}

/**
 * SellerAmp-style alerts panel. Renders the flags the API provides today and
 * shows the rest as "Not available" so the layout is ready as backend support
 * lands (IP/meltable/private-label checks are in the §8 backlog).
 */
export function AlertsPanel({ product }: AlertsPanelProps) {
  const rows: AlertRow[] = [
    flag('Amazon Share Buy Box', product.flags?.['amazonBuyBox']),
    flag('Private Label', product.flags?.['privateLabel']),
    flag('IP Analysis', product.flags?.['ipAnalysis']),
    flag(
      'Size',
      product.flags?.['size'] ??
        (product.dimensions ? { value: 'Standard', tone: 'good' } : undefined)
    ),
    flag('Meltable', product.flags?.['meltable']),
    flag(
      'Variations',
      product.variationCount != null
        ? { value: `${product.variationCount} variations`, tone: product.variationCount > 0 ? 'warn' : 'good' }
        : undefined
    ),
  ];

  return (
    <Panel title="Alerts">
      <ul className="divide-y">
        {rows.map((r) => (
          <li key={r.label} className="flex items-center justify-between py-2 text-sm">
            <span className="text-muted-foreground">{r.label}</span>
            <span className={`font-medium ${toneClass[r.tone]}`}>{r.value}</span>
          </li>
        ))}
      </ul>
    </Panel>
  );
}

function flag(label: string, data?: { value: string; tone?: AlertTone }): AlertRow {
  if (!data) return { label, value: 'Not available', tone: 'muted' };
  return { label, value: data.value, tone: data.tone ?? 'muted' };
}
