import React, { useState, useEffect } from 'react';

interface Props {
  product: { id?: string; asin?: string };
}

export function HistoryTab({ product }: Props) {
  const [priceHistory, setPriceHistory] = useState<any[]>([]);
  const [bsrHistory, setBsrHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const productId = product.id;

  useEffect(() => {
    if (!productId) return;
    setLoading(true);
    Promise.all([
      chrome.runtime.sendMessage({ type: 'GET_HISTORY', data: { productId, days: 90 } }),
      chrome.runtime.sendMessage({ type: 'GET_BSR_HISTORY', data: { productId, days: 90 } }),
    ]).then(([priceRes, bsrRes]) => {
      setPriceHistory(priceRes?.data || []);
      setBsrHistory(bsrRes?.data || []);
      setLoading(false);
    });
  }, [productId]);

  if (loading) return <div className="text-xs text-muted-foreground p-2">Loading history...</div>;

  return (
    <div>
      <HistoryCard
        data={priceHistory}
        label="Price History"
        valueKey="price"
        formatter={(v) => `$${v.toFixed(2)}`}
      />
      <HistoryCard
        data={bsrHistory}
        label="BSR History"
        valueKey="bsr"
        formatter={(v) => `#${Math.round(v).toLocaleString()}`}
      />
      {!priceHistory.length && !bsrHistory.length && !loading && (
        <p className="text-xs text-muted-foreground text-center py-4">
          No history data available yet. History is recorded each time this product is looked up.
        </p>
      )}
    </div>
  );
}

function HistoryCard({
  data,
  label,
  valueKey,
  formatter,
}: {
  data: any[];
  label: string;
  valueKey: string;
  formatter: (v: number) => string;
}) {
  const values = data.map((d) => d[valueKey]).filter((v): v is number => v != null);
  if (!values.length) return null;

  const current = values[values.length - 1] as number;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const avg = values.reduce((a, b) => a + b, 0) / values.length;

  return (
    <div className="rounded-lg border p-3 mb-2">
      <h4 className="text-xs font-medium mb-2">{label} (90d)</h4>
      <div className="grid grid-cols-4 gap-2 text-center">
        {[
          { label: 'Current', value: formatter(current) },
          { label: 'Low', value: formatter(min) },
          { label: 'Avg', value: formatter(avg) },
          { label: 'High', value: formatter(max) },
        ].map((s) => (
          <div key={s.label}>
            <div className="text-xs text-muted-foreground">{s.label}</div>
            <div className="text-sm font-semibold">{s.value}</div>
          </div>
        ))}
      </div>
      <div className="text-xs text-muted-foreground mt-2">{data.length} data points</div>
    </div>
  );
}
