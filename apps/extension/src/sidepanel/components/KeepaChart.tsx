import React, { useState, useEffect } from 'react';

interface Props {
  productId?: string;
}

export function KeepaChart({ productId }: Props) {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!productId) return;
    setLoading(true);
    chrome.runtime.sendMessage({
      type: 'GET_HISTORY',
      data: { productId, days: 90 },
    }).then((response) => {
      setHistory(response?.data || []);
      setLoading(false);
    });
  }, [productId]);

  if (loading) return <div style={{ fontSize: 12, padding: 8 }}>Loading history...</div>;
  if (!history.length) return <div style={{ fontSize: 12, padding: 8, color: '#999' }}>No price history available</div>;

  // Simple text-based price history display
  const prices = history.map((h: any) => h.price).filter(Boolean);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const avg = prices.reduce((a: number, b: number) => a + b, 0) / prices.length;

  return (
    <div style={{ marginBottom: 12 }}>
      <h4 style={{ margin: '0 0 8px', fontSize: 13 }}>Price History (90d)</h4>
      <div style={{ background: '#f9fafb', padding: 8, borderRadius: 6, fontSize: 12 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 4, textAlign: 'center' }}>
          <div><div style={{ color: '#666' }}>Low</div><strong>${min.toFixed(2)}</strong></div>
          <div><div style={{ color: '#666' }}>Avg</div><strong>${avg.toFixed(2)}</strong></div>
          <div><div style={{ color: '#666' }}>High</div><strong>${max.toFixed(2)}</strong></div>
        </div>
        <div style={{ marginTop: 8, color: '#666' }}>{history.length} data points</div>
      </div>
    </div>
  );
}
