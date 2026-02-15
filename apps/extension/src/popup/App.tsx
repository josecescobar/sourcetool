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
    <div className="p-4">
      <h2 className="text-lg font-bold text-primary mb-3">SourceTool</h2>

      <div className="flex gap-2 mb-4">
        <input
          type="text"
          placeholder="ASIN, UPC, EAN, or URL"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-1 rounded-md border px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <button
          onClick={lookup}
          disabled={loading}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {loading ? '...' : 'Go'}
        </button>
      </div>

      {result && (
        <div className="rounded-lg bg-muted p-3">
          <h3 className="text-sm font-semibold mb-1 line-clamp-2">{result.title}</h3>
          {result.asin && (
            <p className="text-xs text-muted-foreground">ASIN: {result.asin}</p>
          )}
          {result.listings?.[0]?.currentPrice && (
            <p className="text-sm font-bold mt-1">${result.listings[0].currentPrice.toFixed(2)}</p>
          )}
        </div>
      )}
    </div>
  );
}
