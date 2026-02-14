import React, { useState } from 'react';

interface Props {
  product: { asin?: string; title: string; price?: number; bsr?: number; bsrCategory?: string; rating?: number; reviewCount?: number };
}

export function AIVerdict({ product }: Props) {
  const [verdict, setVerdict] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const getVerdict = async () => {
    setLoading(true);
    try {
      const response = await chrome.runtime.sendMessage({
        type: 'GET_DEAL_SCORE',
        data: {
          product: {
            title: product.title,
            asin: product.asin,
            bsr: product.bsr,
            bsrCategory: product.bsrCategory,
            rating: product.rating,
            reviewCount: product.reviewCount,
          },
          profitability: {
            buyPrice: 0, sellPrice: product.price || 0,
            profit: 0, roi: 0, margin: 0, fees: 0,
          },
          competition: {},
        },
      });
      setVerdict(response?.data);
    } catch (err) {
      console.error('AI verdict error:', err);
    }
    setLoading(false);
  };

  const verdictColors: Record<string, string> = {
    STRONG_BUY: '#16a34a', BUY: '#22c55e', HOLD: '#eab308', PASS: '#f97316', STRONG_PASS: '#dc2626',
  };

  return (
    <div style={{ marginTop: 12 }}>
      {!verdict ? (
        <button onClick={getVerdict} disabled={loading}
          style={{ width: '100%', padding: '8px 12px', background: '#7c3aed', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13 }}>
          {loading ? 'Analyzing...' : 'Get AI Verdict'}
        </button>
      ) : (
        <div style={{ background: '#f9fafb', padding: 10, borderRadius: 6 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 18, fontWeight: 'bold', color: verdictColors[verdict.verdict] || '#333' }}>
              {verdict.verdict?.replace('_', ' ')}
            </span>
            <span style={{ fontSize: 24, fontWeight: 'bold' }}>{verdict.score}/100</span>
          </div>
          <p style={{ fontSize: 12, color: '#555', margin: 0 }}>{verdict.reasoning}</p>
        </div>
      )}
    </div>
  );
}
