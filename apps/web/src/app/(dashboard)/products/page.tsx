'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import { Search, List, Bookmark, X, Clock, Columns3 } from 'lucide-react';
import { AddToBuyListDialog } from '@/components/add-to-buy-list-dialog';
import { CalibrationCallout } from '@/components/calibration-callout';
import { useSavedSearches } from '@/hooks/useSavedSearches';

export default function ProductsPage() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [product, setProduct] = useState<any>(null);
  const [analysis, setAnalysis] = useState<any>(null);
  const [buyPrice, setBuyPrice] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [buyListOpen, setBuyListOpen] = useState(false);
  const [buyListMessage, setBuyListMessage] = useState('');
  const [lastSearchedQuery, setLastSearchedQuery] = useState('');
  const [verdict, setVerdict] = useState<any>(null);
  const [scoring, setScoring] = useState(false);

  const { searches, fetchSearches, saveSearch, removeSearch } = useSavedSearches();
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchSearches();
  }, [fetchSearches]);

  const runSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) return;
    setLoading(true);
    setError('');
    setProduct(null);
    setAnalysis(null);
    setVerdict(null);
    setQuery(searchQuery);
    setLastSearchedQuery(searchQuery.trim());

    try {
      const data = await apiClient.get(`/products/lookup?identifier=${encodeURIComponent(searchQuery.trim())}`);
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

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    await runSearch(query);
  };

  const handleSaveSearch = async () => {
    if (!lastSearchedQuery) return;
    await saveSearch({ query: lastSearchedQuery });
  };

  const isAlreadySaved = searches.some((s) => s.query === lastSearchedQuery);

  const listing = product?.listings?.[0];

  const handleCalculate = async () => {
    if (!product || !buyPrice) return;
    setLoading(true);
    setVerdict(null);
    try {
      const data = await apiClient.post('/analysis/calculate', {
        productId: product.id,
        asin: product.asin,
        marketplace: 'AMAZON_US',
        fulfillmentType: 'FBA',
        buyPrice: parseFloat(buyPrice),
        sellPrice: listing?.currentPrice || 0,
        category: product.category,
        snapshot: {
          category: product.category,
          brand: product.brand,
          bsr: listing?.bsr,
          offerCount: listing?.offerCount,
          fbaOfferCount: listing?.fbaOfferCount,
          isAmazonSelling: listing?.isAmazonSelling,
          rating: listing?.rating,
          reviewCount: listing?.reviewCount,
        },
      });
      if (data.success) setAnalysis(data.data);
    } catch {
      setError('Calculation failed');
    }
    setLoading(false);
  };

  const handleScore = async () => {
    if (!product || !analysis) return;
    setScoring(true);
    try {
      const data = await apiClient.post('/ai/deal-score', {
        analysisId: analysis.analysisId,
        product: {
          title: product.title,
          asin: product.asin,
          category: product.category,
          brand: product.brand,
          bsr: listing?.bsr,
          rating: listing?.rating,
          reviewCount: listing?.reviewCount,
        },
        profitability: {
          buyPrice: analysis.buyPrice,
          sellPrice: analysis.sellPrice,
          profit: analysis.profit,
          roi: analysis.roi,
          margin: analysis.margin,
          fees: analysis.fees?.totalFees ?? 0,
        },
        competition: {
          offerCount: listing?.offerCount,
          fbaOfferCount: listing?.fbaOfferCount,
          isAmazonSelling: listing?.isAmazonSelling,
          buyBoxPrice: listing?.buyBoxPrice,
        },
      });
      if (data.success) setVerdict(data.data);
    } catch {
      setError('AI scoring failed');
    }
    setScoring(false);
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Product Lookup</h1>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-3 mb-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            ref={searchInputRef}
            type="text" placeholder="Search by ASIN, UPC, EAN, or URL..."
            value={query} onChange={(e) => setQuery(e.target.value)}
            className="w-full rounded-lg border pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <button type="submit" disabled={loading}
          className="rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
          {loading ? 'Searching...' : 'Search'}
        </button>
        {lastSearchedQuery && !isAlreadySaved && (
          <button type="button" onClick={handleSaveSearch}
            className="flex items-center gap-1.5 rounded-lg border px-4 py-2.5 text-sm font-medium hover:bg-gray-50 transition-colors">
            <Bookmark className="h-4 w-4" />
            Save
          </button>
        )}
      </form>

      {/* Saved Searches */}
      {searches.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          {searches.map((s) => (
            <div key={s.id}
              className="group flex items-center gap-1.5 rounded-full border bg-white px-3 py-1 text-sm hover:bg-gray-50 transition-colors">
              <button
                onClick={() => runSearch(s.query)}
                className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground"
              >
                <Clock className="h-3 w-3" />
                <span>{s.query}</span>
                {s.marketplace && (
                  <span className="text-xs text-muted-foreground/60">({s.marketplace.replace('AMAZON_', '').replace('_', ' ')})</span>
                )}
              </button>
              <button
                onClick={() => removeSearch(s.id)}
                className="ml-0.5 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {!searches.length && <div className="mb-5" />}

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
                <div className="flex gap-2 flex-shrink-0">
                  <button
                    onClick={() => setBuyListOpen(true)}
                    className="flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm font-medium hover:bg-gray-50 transition-colors"
                  >
                    <List className="h-4 w-4" />
                    Add to Buy List
                  </button>
                  {product.asin && (
                    <button
                      onClick={() => router.push(`/compare?asins=${product.asin}`)}
                      className="flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm font-medium hover:bg-gray-50 transition-colors"
                    >
                      <Columns3 className="h-4 w-4" />
                      Compare with...
                    </button>
                  )}
                </div>
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
              <>
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
              <CalibrationCallout forecast={analysis.calibrated} />
              <div className="mt-4">
                {!verdict ? (
                  <button
                    onClick={handleScore}
                    disabled={scoring}
                    className="rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-50"
                  >
                    {scoring ? 'Scoring...' : 'Get AI Verdict'}
                  </button>
                ) : (
                  <div className="rounded-lg border border-purple-200 bg-purple-50 p-3">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">{verdict.verdict?.replace(/_/g, ' ')}</span>
                      <span className="text-lg font-bold">{verdict.score}/100</span>
                    </div>
                    {verdict.reasoning && (
                      <p className="text-sm text-muted-foreground mt-1">{verdict.reasoning}</p>
                    )}
                  </div>
                )}
              </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
