import React, { useState } from 'react';

export function App() {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const lookup = async () => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const response = await chrome.runtime.sendMessage({
        type: 'LOOKUP_PRODUCT',
        data: { identifier: query.trim() },
      });
      setResult(response?.data);
    } catch (err) {
      console.error('Lookup error:', err);
    }
    setLoading(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') lookup();
  };

  return (
    <div style={{ fontFamily: 'system-ui', padding: 16 }}>
      <h2 style={{ margin: '0 0 12px', fontSize: 18, color: '#3b82f6' }}>SourceTool</h2>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <input
          type="text"
          placeholder="ASIN, UPC, EAN, or URL"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          style={{ flex: 1, padding: '8px 10px', border: '1px solid #ddd', borderRadius: 6, fontSize: 13 }}
        />
        <button onClick={lookup} disabled={loading}
          style={{ padding: '8px 14px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13 }}>
          {loading ? '...' : 'Go'}
        </button>
      </div>

      {result && (
        <div style={{ background: '#f9fafb', padding: 12, borderRadius: 8 }}>
          <h3 style={{ margin: '0 0 8px', fontSize: 14 }}>{result.title}</h3>
          {result.asin && <p style={{ margin: '2px 0', fontSize: 12, color: '#666' }}>ASIN: {result.asin}</p>}
          {result.listings?.[0]?.currentPrice && (
            <p style={{ margin: '2px 0', fontSize: 14, fontWeight: 'bold' }}>${result.listings[0].currentPrice.toFixed(2)}</p>
          )}
        </div>
      )}
    </div>
  );
}
