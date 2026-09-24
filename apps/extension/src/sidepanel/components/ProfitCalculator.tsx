import React, { useState } from 'react';

interface Props {
  product: {
    asin?: string;
    price?: number;
    marketplace?: string;
    category?: string;
    id?: string;
    listings?: Array<{ currentPrice?: number }>;
  };
  onAnalyzed?: (analysisId?: string, result?: any) => void;
  /** Updated after an AI verdict so the score band can replace the first pass. */
  calibratedOverride?: any;
}

export function ProfitCalculator({ product, onAnalyzed, calibratedOverride }: Props) {
  const [buyPrice, setBuyPrice] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const sellPrice = product.listings?.[0]?.currentPrice ?? product.price ?? 0;

  const calculate = async () => {
    setLoading(true);
    try {
      const response = await chrome.runtime.sendMessage({
        type: 'CALCULATE_PROFIT',
        data: {
          productId: product.id,
          asin: product.asin,
          marketplace: product.marketplace || 'AMAZON_US',
          fulfillmentType: 'FBA',
          buyPrice: parseFloat(buyPrice),
          sellPrice,
          category: product.category,
          snapshot: {
            category: product.category,
            bsr: (product as { bsr?: number }).bsr,
          },
        },
      });
      setResult(response?.data);
      onAnalyzed?.(response?.data?.analysisId, response?.data);
    } catch (err) {
      console.error('Calculate error:', err);
    }
    setLoading(false);
  };

  const metrics = result
    ? [
        { label: 'Profit', value: `$${result.profit?.toFixed(2)}`, color: result.profit >= 0 ? 'text-green-600' : 'text-red-600' },
        { label: 'ROI', value: `${result.roi?.toFixed(1)}%`, color: result.roi >= 30 ? 'text-green-600' : result.roi >= 0 ? 'text-yellow-600' : 'text-red-600' },
        { label: 'Margin', value: `${result.margin?.toFixed(1)}%` },
        { label: 'Total Fees', value: `$${result.fees?.totalFees?.toFixed(2)}` },
        { label: 'Referral', value: `$${result.fees?.referralFee?.toFixed(2)}` },
        { label: 'Fulfillment', value: `$${result.fees?.fulfillmentFee?.toFixed(2)}` },
        { label: 'Storage', value: `$${result.fees?.storageFee?.toFixed(2)}` },
        { label: 'Breakeven', value: `$${result.breakeven?.toFixed(2)}` },
      ]
    : [];

  return (
    <div className="mb-3">
      <div className="flex gap-2 mb-2">
        <div className="flex-1">
          <label className="block text-xs text-muted-foreground mb-1">Buy Price</label>
          <input
            type="number"
            step="0.01"
            placeholder="0.00"
            value={buyPrice}
            onChange={(e) => setBuyPrice(e.target.value)}
            className="w-full rounded-md border px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div className="flex-1">
          <label className="block text-xs text-muted-foreground mb-1">Sell Price</label>
          <input
            type="number"
            disabled
            value={sellPrice.toFixed(2)}
            className="w-full rounded-md border px-2.5 py-1.5 text-sm bg-muted"
          />
        </div>
      </div>
      <button
        onClick={calculate}
        disabled={loading || !buyPrice}
        className="w-full rounded-md bg-primary py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
      >
        {loading ? 'Calculating...' : 'Calculate Profit'}
      </button>

      {result && (
        <>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {metrics.map(({ label, value, color }) => (
            <div key={label} className="rounded-md bg-muted p-2">
              <div className="text-xs text-muted-foreground">{label}</div>
              <div className={`text-sm font-bold ${color || ''}`}>{value}</div>
            </div>
          ))}
        </div>
        {(calibratedOverride ?? result.calibrated)?.applied && (
          <div className="mt-2 rounded-md border border-amber-200 bg-amber-50 p-2">
            <div className="text-[11px] font-medium uppercase tracking-wide text-amber-800">
              Calibrated to your track record
            </div>
            <div className="text-sm mt-0.5">
              Expected{' '}
              <span className="font-semibold text-amber-800">
                {(calibratedOverride ?? result.calibrated).calibratedRoi.toFixed(1)}% ROI
              </span>
              {' / '}
              <span className="font-semibold text-amber-800">
                ${(calibratedOverride ?? result.calibrated).calibratedProfit.toFixed(2)}
              </span>
            </div>
            <div className="text-[11px] text-muted-foreground mt-0.5">
              {Math.round((calibratedOverride ?? result.calibrated).realizationRate * 100)}% of forecast · {(calibratedOverride ?? result.calibrated).basis}
              {' · '}
              {(calibratedOverride ?? result.calibrated).sampleSize} sold
            </div>
          </div>
        )}
        </>
      )}
    </div>
  );
}
