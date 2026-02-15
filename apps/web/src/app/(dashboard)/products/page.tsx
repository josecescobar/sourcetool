'use client';

import { useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { Search, List } from 'lucide-react';
import { AddToBuyListDialog } from '@/components/add-to-buy-list-dialog';

export default function ProductsPage() {
  const [query, setQuery] = useState('');
  const [product, setProduct] = useState<any>(null);
  const [analysis, setAnalysis] = useState<any>(null);
  const [buyPrice, setBuyPrice] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [buyListOpen, setBuyListOpen] = useState(false);
  const [buyListMessage, setBuyListMessage] = useState('');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setError('');
    setProduct(null);
    setAnalysis(null);

    try {
      const data = await apiClient.get(`/products/lookup?identifier=${encodeURIComponent(query.trim())}`);
      if (data.success) {
        setProduct(data.data);
      } else {
        setError(data.error?.message || 'Product not found');
      }
    } catch {
      setError('Search failed. Please try again.');
    }
    setLoading(false);
  };

  const handleCalculate = async () => {
    if (!product || !buyPrice) return;
    setLoading(true);
    try {
      const data = await apiClient.post('/analysis/calculate', {
        productId: product.id,
        asin: product.asin,
        marketplace: 'AMAZON_US',
        fulfillmentType: 'FBA',
        buyPrice: parseFloat(buyPrice),
        sellPrice: product.listings?.[0]?.currentPrice || 0,
        category: product.category,
      });
      if (data.success) setAnalysis(data.data);
    } catch {
      setError('Calculation failed');
    }
    setLoading(false);
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Product Lookup</h1>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-3 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text" placeholder="Search by ASIN, UPC, EAN, or URL..."
            value={query} onChange={(e) => setQuery(e.target.value)}
            className="w-full rounded-lg border pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <button type="submit" disabled={loading}
          className="rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
          {loading ? 'Searching...' : 'Search'}
        </button>
      </form>

      {error && <div className="mb-4 rounded-lg bg-destructive/10 p-4 text-sm text-destructive">{error}</div>}

      {product && (
        <AddToBuyListDialog
          open={buyListOpen}
          onOpenChange={setBuyListOpen}
          items={[{ productId: product.id, analysisId: analysis?.id }]}
          onSuccess={() => {
            setBuyListMessage('Added to buy list');
            setTimeout(() => setBuyListMessage(''), 3000);
          }}
        />
      )}

      {/* Product Result */}
      {product && (
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <div className="flex gap-4 mb-6">
            {product.imageUrl && (
              <img src={product.imageUrl} alt="" className="h-24 w-24 rounded-lg object-contain border" />
            )}
            <div className="flex-1">
              <div className="flex items-start justify-between gap-4">
                <h2 className="text-lg font-semibold">{product.title}</h2>
                <button
                  onClick={() => setBuyListOpen(true)}
                  className="flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm font-medium hover:bg-gray-50 transition-colors flex-shrink-0"
                >
                  <List className="h-4 w-4" />
                  Add to Buy List
                </button>
              </div>
              {buyListMessage && (
                <div className="mt-2 text-sm text-green-600">{buyListMessage}</div>
              )}
              <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
                {product.asin && <span>ASIN: {product.asin}</span>}
                {product.brand && <span>Brand: {product.brand}</span>}
                {product.category && <span>Category: {product.category}</span>}
              </div>
              {product.listings?.[0] && (
                <div className="flex gap-4 mt-2 text-sm">
                  <span className="font-semibold text-lg">${product.listings[0].currentPrice?.toFixed(2)}</span>
                  {product.listings[0].bsr && <span className="text-muted-foreground">BSR: #{product.listings[0].bsr.toLocaleString()}</span>}
                  {product.listings[0].rating && <span className="text-muted-foreground">{product.listings[0].rating}/5 ({product.listings[0].reviewCount} reviews)</span>}
                </div>
              )}
            </div>
          </div>

          {/* Calculator */}
          <div className="border-t pt-4">
            <h3 className="font-medium mb-3">Profit Calculator</h3>
            <div className="flex gap-3 items-end">
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Buy Price</label>
                <input type="number" step="0.01" placeholder="0.00" value={buyPrice} onChange={(e) => setBuyPrice(e.target.value)}
                  className="w-32 rounded-md border px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Sell Price</label>
                <input type="number" disabled value={product.listings?.[0]?.currentPrice?.toFixed(2) || ''}
                  className="w-32 rounded-md border px-3 py-2 text-sm bg-gray-50" />
              </div>
              <button onClick={handleCalculate} disabled={!buyPrice || loading}
                className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
                Calculate
              </button>
            </div>

            {analysis && (
              <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="rounded-lg bg-gray-50 p-3">
                  <div className="text-xs text-muted-foreground">Profit</div>
                  <div className={`text-lg font-bold ${analysis.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ${analysis.profit?.toFixed(2)}
                  </div>
                </div>
                <div className="rounded-lg bg-gray-50 p-3">
                  <div className="text-xs text-muted-foreground">ROI</div>
                  <div className={`text-lg font-bold ${analysis.roi >= 30 ? 'text-green-600' : analysis.roi >= 0 ? 'text-yellow-600' : 'text-red-600'}`}>
                    {analysis.roi?.toFixed(1)}%
                  </div>
                </div>
                <div className="rounded-lg bg-gray-50 p-3">
                  <div className="text-xs text-muted-foreground">Margin</div>
                  <div className="text-lg font-bold">{analysis.margin?.toFixed(1)}%</div>
                </div>
                <div className="rounded-lg bg-gray-50 p-3">
                  <div className="text-xs text-muted-foreground">Total Fees</div>
                  <div className="text-lg font-bold">${analysis.fees?.totalFees?.toFixed(2)}</div>
                </div>
                <div className="rounded-lg bg-gray-50 p-3">
                  <div className="text-xs text-muted-foreground">Referral Fee</div>
                  <div className="text-sm font-medium">${analysis.fees?.referralFee?.toFixed(2)} ({analysis.fees?.referralFeePercent}%)</div>
                </div>
                <div className="rounded-lg bg-gray-50 p-3">
                  <div className="text-xs text-muted-foreground">Fulfillment Fee</div>
                  <div className="text-sm font-medium">${analysis.fees?.fulfillmentFee?.toFixed(2)}</div>
                </div>
                <div className="rounded-lg bg-gray-50 p-3">
                  <div className="text-xs text-muted-foreground">Storage Fee</div>
                  <div className="text-sm font-medium">${analysis.fees?.storageFee?.toFixed(2)}</div>
                </div>
                <div className="rounded-lg bg-gray-50 p-3">
                  <div className="text-xs text-muted-foreground">Breakeven</div>
                  <div className="text-sm font-medium">${analysis.breakeven?.toFixed(2)}</div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
