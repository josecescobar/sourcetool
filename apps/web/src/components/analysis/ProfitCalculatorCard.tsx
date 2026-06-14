'use client';

import React, { useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { Panel, StatTile } from './StatTile';
import { money, percent } from './format';

export interface FeeBreakdown {
  totalFees?: number;
  referralFee?: number;
  referralFeePercent?: number;
  fulfillmentFee?: number;
  storageFee?: number;
  paymentProcessingFee?: number;
}

export interface AnalysisResult {
  profit?: number;
  roi?: number;
  margin?: number;
  breakeven?: number;
  fees?: FeeBreakdown;
}

type Fulfillment = 'FBA' | 'FBM';

interface ProfitCalculatorCardProps {
  product: {
    id?: string;
    asin?: string;
    category?: string;
    listings?: Array<{ currentPrice?: number }>;
  };
  buyPrice: string;
  onBuyPriceChange: (value: string) => void;
  onResult: (analysis: AnalysisResult | null, sellPrice: number) => void;
}

/** Profit Calculator panel: cost/sale, FBA·FBM, storage → profit/ROI/margin/fees. */
export function ProfitCalculatorCard({
  product,
  buyPrice,
  onBuyPriceChange,
  onResult,
}: ProfitCalculatorCardProps) {
  const listPrice = product.listings?.[0]?.currentPrice;
  const [sellPrice, setSellPrice] = useState(listPrice != null ? String(listPrice) : '');
  const [fulfillment, setFulfillment] = useState<Fulfillment>('FBA');
  const [storageMonths, setStorageMonths] = useState('0');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);

  const sell = parseFloat(sellPrice) || 0;
  const estPayout =
    analysis?.fees?.totalFees != null ? sell - analysis.fees.totalFees : null;

  const calculate = async () => {
    if (!buyPrice || !sellPrice) return;
    setLoading(true);
    setError('');
    try {
      const data = await apiClient.post('/analysis/calculate', {
        productId: product.id,
        asin: product.asin,
        marketplace: 'AMAZON_US',
        fulfillmentType: fulfillment,
        buyPrice: parseFloat(buyPrice),
        sellPrice: sell,
        category: product.category,
        monthsInStorage: parseInt(storageMonths, 10) || 0,
      });
      if (data.success) {
        setAnalysis(data.data);
        onResult(data.data, sell);
      } else {
        setError(data.error?.message || 'Calculation failed');
      }
    } catch {
      setError('Calculation failed');
    }
    setLoading(false);
  };

  return (
    <Panel title="Profit Calculator">
      <div className="flex flex-wrap items-end gap-3">
        <Field label="Cost Price">
          <input
            type="number"
            step="0.01"
            placeholder="0.00"
            value={buyPrice}
            onChange={(e) => onBuyPriceChange(e.target.value)}
            className="w-28 rounded-md border px-3 py-2 text-sm"
          />
        </Field>
        <Field label="Sale Price">
          <input
            type="number"
            step="0.01"
            value={sellPrice}
            onChange={(e) => setSellPrice(e.target.value)}
            className="w-28 rounded-md border px-3 py-2 text-sm"
          />
        </Field>
        <Field label="Fulfilment">
          <div className="inline-flex overflow-hidden rounded-md border">
            {(['FBA', 'FBM'] as Fulfillment[]).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFulfillment(f)}
                className={`px-3 py-2 text-sm font-medium transition-colors ${
                  fulfillment === f
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-white text-muted-foreground hover:bg-gray-50'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </Field>
        <Field label="Storage (mo)">
          <input
            type="number"
            min="0"
            value={storageMonths}
            onChange={(e) => setStorageMonths(e.target.value)}
            className="w-20 rounded-md border px-3 py-2 text-sm"
          />
        </Field>
        <button
          onClick={calculate}
          disabled={!buyPrice || !sellPrice || loading}
          className="rounded-md bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {loading ? 'Calculating…' : 'Calculate'}
        </button>
      </div>

      {error && <p className="mt-3 text-sm text-destructive">{error}</p>}

      {analysis && (
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <StatTile
            label="Profit"
            value={money(analysis.profit)}
            tone={(analysis.profit ?? 0) >= 0 ? 'good' : 'bad'}
          />
          <StatTile
            label="ROI"
            value={percent(analysis.roi)}
            tone={
              (analysis.roi ?? 0) >= 30 ? 'good' : (analysis.roi ?? 0) >= 0 ? 'warn' : 'bad'
            }
          />
          <StatTile label="Margin" value={percent(analysis.margin)} />
          <StatTile label="Breakeven" value={money(analysis.breakeven)} />
          <StatTile label="Total Fees" value={money(analysis.fees?.totalFees)} />
          <StatTile label="Est. Payout" value={money(estPayout ?? undefined)} />
        </div>
      )}

      {analysis?.fees && (
        <div className="mt-3 grid grid-cols-2 gap-x-6 gap-y-1 border-t pt-3 text-xs text-muted-foreground sm:grid-cols-3">
          <FeeRow
            label="Referral"
            value={money(analysis.fees.referralFee)}
            note={
              analysis.fees.referralFeePercent != null
                ? `${analysis.fees.referralFeePercent}%`
                : undefined
            }
          />
          <FeeRow label="Fulfilment" value={money(analysis.fees.fulfillmentFee)} />
          <FeeRow label="Storage" value={money(analysis.fees.storageFee)} />
          {analysis.fees.paymentProcessingFee != null && (
            <FeeRow label="Processing" value={money(analysis.fees.paymentProcessingFee)} />
          )}
        </div>
      )}
    </Panel>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-xs text-muted-foreground">{label}</label>
      {children}
    </div>
  );
}

function FeeRow({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="flex items-center justify-between">
      <span>
        {label}
        {note ? ` (${note})` : ''}
      </span>
      <span className="font-medium text-foreground">{value}</span>
    </div>
  );
}
