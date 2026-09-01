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
}

export function ProfitCalculator({ product }: Props) {
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
        },
      });
      setResult(response?.data);
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
        <div className="mt-3 grid grid-cols-2 gap-2">
          {metrics.map(({ label, value, color }) => (
            <div key={label} className="rounded-md bg-muted p-2">
              <div className="text-xs text-muted-foreground">{label}</div>
              <div className={`text-sm font-bold ${color || ''}`}>{value}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
