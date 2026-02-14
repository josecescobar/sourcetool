import React, { useState } from 'react';

interface Props {
  product: { price?: number; asin?: string; marketplace?: string };
}

export function ProfitCalculator({ product }: Props) {
  const [buyPrice, setBuyPrice] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const calculate = async () => {
    setLoading(true);
    try {
      const response = await chrome.runtime.sendMessage({
        type: 'CALCULATE_PROFIT',
        data: {
          asin: product.asin,
          marketplace: product.marketplace || 'AMAZON_US',
          fulfillmentType: 'FBA',
          buyPrice: parseFloat(buyPrice),
          sellPrice: product.price || 0,
        },
      });
      setResult(response?.data);
    } catch (err) {
      console.error('Calculate error:', err);
    }
    setLoading(false);
  };

  return (
    <div style={{ marginBottom: 12 }}>
      <h4 style={{ margin: '0 0 8px', fontSize: 13 }}>Profit Calculator</h4>
      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        <input
          type="number"
          placeholder="Buy Price"
          value={buyPrice}
          onChange={(e) => setBuyPrice(e.target.value)}
          style={{ flex: 1, padding: '6px 8px', border: '1px solid #ddd', borderRadius: 4, fontSize: 13 }}
        />
        <button onClick={calculate} disabled={loading || !buyPrice}
          style={{ padding: '6px 12px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 13 }}>
          {loading ? '...' : 'Calculate'}
        </button>
      </div>

      {result && (
        <div style={{ background: '#f9fafb', padding: 8, borderRadius: 6, fontSize: 12 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
            <span>Sell Price:</span><strong>${result.sellPrice?.toFixed(2)}</strong>
            <span>Fees:</span><strong>${result.fees?.totalFees?.toFixed(2)}</strong>
            <span>Profit:</span><strong style={{ color: result.profit >= 0 ? '#16a34a' : '#dc2626' }}>${result.profit?.toFixed(2)}</strong>
            <span>ROI:</span><strong style={{ color: result.roi >= 30 ? '#16a34a' : result.roi >= 0 ? '#ca8a04' : '#dc2626' }}>{result.roi?.toFixed(1)}%</strong>
            <span>Margin:</span><strong>{result.margin?.toFixed(1)}%</strong>
            <span>Breakeven:</span><strong>${result.breakeven?.toFixed(2)}</strong>
          </div>
        </div>
      )}
    </div>
  );
}
