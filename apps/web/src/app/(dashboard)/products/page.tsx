'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import { Search, List, Bookmark, X, Clock, Columns3 } from 'lucide-react';
import { AddToBuyListDialog } from '@/components/add-to-buy-list-dialog';
import { ScanImageButton } from '@/components/scan-image-button';
import { useSavedSearches } from '@/hooks/useSavedSearches';
import { QuickInfo } from '@/components/analysis/QuickInfo';
import { ProfitCalculatorCard, type AnalysisResult } from '@/components/analysis/ProfitCalculatorCard';
import { AlertsPanel } from '@/components/analysis/AlertsPanel';
import { OffersPanel } from '@/components/analysis/OffersPanel';
import { RanksPanel } from '@/components/analysis/RanksPanel';
import type { ExtractionResult } from '@sourcetool/shared';

const TARGET_ROI = 30;

export default function ProductsPage() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [product, setProduct] = useState<any>(null);
  const [buyPrice, setBuyPrice] = useState('');
  const [analysisCtx, setAnalysisCtx] = useState<{ analysis: AnalysisResult; sellPrice: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [buyListOpen, setBuyListOpen] = useState(false);
  const [buyListMessage, setBuyListMessage] = useState('');
  const [lastSearchedQuery, setLastSearchedQuery] = useState('');

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
    setAnalysisCtx(null);
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

  const handleExtracted = (result: ExtractionResult) => {
    setError('');
    // Prefill buy price from the retail price read off the image (scan → cost).
    if (result.retailPriceCents != null) {
      setBuyPrice((result.retailPriceCents / 100).toFixed(2));
    }
    const id = result.identifier?.value;
    if (id) {
      setQuery(id);
      runSearch(id);
    } else {
      setError('No product identifier found in that image.');
    }
  };

  const handleSaveSearch = async () => {
    if (!lastSearchedQuery) return;
    await saveSearch({ query: lastSearchedQuery });
  };

  const isAlreadySaved = searches.some((s) => s.query === lastSearchedQuery);

  const listing = product?.listings?.[0];
  const totalFees = analysisCtx?.analysis.fees?.totalFees;
  const sellForMax = analysisCtx?.sellPrice ?? listing?.currentPrice;
  const maxCost =
    totalFees != null && sellForMax
      ? (sellForMax - totalFees) / (1 + TARGET_ROI / 100)
      : null;

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Product Lookup</h1>

      {/* Search */}
      <form onSubmit={handleSearch} className="mb-3 flex flex-wrap gap-3">
        <div className="relative min-w-[240px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search by ASIN, UPC, EAN, or URL..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full rounded-lg border py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {loading ? 'Searching...' : 'Search'}
        </button>
        <ScanImageButton onExtracted={handleExtracted} onError={(m) => setError(m)} />
        {lastSearchedQuery && !isAlreadySaved && (
          <button
            type="button"
            onClick={handleSaveSearch}
            className="flex items-center gap-1.5 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors hover:bg-gray-50"
          >
            <Bookmark className="h-4 w-4" />
            Save
          </button>
        )}
      </form>

      {/* Saved Searches */}
      {searches.length > 0 && (
        <div className="mb-6 flex flex-wrap gap-2">
          {searches.map((s) => (
            <div
              key={s.id}
              className="group flex items-center gap-1.5 rounded-full border bg-white px-3 py-1 text-sm transition-colors hover:bg-gray-50"
            >
              <button
                onClick={() => runSearch(s.query)}
                className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground"
              >
                <Clock className="h-3 w-3" />
                <span>{s.query}</span>
                {s.marketplace && (
                  <span className="text-xs text-muted-foreground/60">
                    ({s.marketplace.replace('AMAZON_', '').replace('_', ' ')})
                  </span>
                )}
              </button>
              <button
                onClick={() => removeSearch(s.id)}
                className="ml-0.5 text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {!searches.length && <div className="mb-5" />}

      {error && (
        <div className="mb-4 rounded-lg bg-destructive/10 p-4 text-sm text-destructive">{error}</div>
      )}

      {product && (
        <AddToBuyListDialog
          open={buyListOpen}
          onOpenChange={setBuyListOpen}
          items={[{ productId: product.id, analysisId: undefined }]}
          onSuccess={() => {
            setBuyListMessage('Added to buy list');
            setTimeout(() => setBuyListMessage(''), 3000);
          }}
        />
      )}

      {/* Analysis */}
      {product && (
        <div className="space-y-4">
          {/* Product header */}
          <div className="rounded-xl border bg-white p-6 shadow-sm">
            <div className="flex gap-4">
              {product.imageUrl && (
                <img src={product.imageUrl} alt="" className="h-24 w-24 rounded-lg border object-contain" />
              )}
              <div className="flex-1">
                <div className="flex items-start justify-between gap-4">
                  <h2 className="text-lg font-semibold">{product.title}</h2>
                  <div className="flex flex-shrink-0 gap-2">
                    <button
                      onClick={() => setBuyListOpen(true)}
                      className="flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm font-medium transition-colors hover:bg-gray-50"
                    >
                      <List className="h-4 w-4" />
                      Add to Buy List
                    </button>
                    {product.asin && (
                      <button
                        onClick={() => router.push(`/compare?asins=${product.asin}`)}
                        className="flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm font-medium transition-colors hover:bg-gray-50"
                      >
                        <Columns3 className="h-4 w-4" />
                        Compare with...
                      </button>
                    )}
                  </div>
                </div>
                {buyListMessage && <div className="mt-2 text-sm text-green-600">{buyListMessage}</div>}
                <div className="mt-2 flex flex-wrap gap-4 text-sm text-muted-foreground">
                  {product.asin && <span>ASIN: {product.asin}</span>}
                  {product.upc && <span>UPC: {product.upc}</span>}
                  {product.brand && <span>Brand: {product.brand}</span>}
                  {product.category && <span>Category: {product.category}</span>}
                </div>
                {listing && (
                  <div className="mt-2 flex flex-wrap gap-4 text-sm">
                    <span className="text-lg font-semibold">${listing.currentPrice?.toFixed(2)}</span>
                    {listing.bsr && <span className="text-muted-foreground">BSR: #{listing.bsr.toLocaleString()}</span>}
                    {listing.rating && (
                      <span className="text-muted-foreground">
                        {listing.rating}/5 ({listing.reviewCount} reviews)
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Quick info */}
          <QuickInfo
            bsr={listing?.bsr ?? product.bsr}
            bsrTopPercent={product.bsrTopPercent}
            estSales={product.estimatedSales ?? null}
            price={listing?.currentPrice}
            offerCount={listing?.offerCount}
            maxCost={maxCost}
            targetRoi={TARGET_ROI}
          />

          {/* Two-column analysis */}
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="space-y-4 lg:col-span-2">
              <ProfitCalculatorCard
                product={product}
                buyPrice={buyPrice}
                onBuyPriceChange={setBuyPrice}
                onResult={(analysis, sellPrice) =>
                  setAnalysisCtx(analysis ? { analysis, sellPrice } : null)
                }
              />
              <OffersPanel offers={product.offers} />
            </div>
            <div className="space-y-4">
              <AlertsPanel product={product} />
              <RanksPanel
                bsr={listing?.bsr ?? product.bsr}
                bsrTopPercent={product.bsrTopPercent}
                buyBoxPrice={product.buyBoxPrice ?? listing?.currentPrice}
                lowestFba={product.lowestFba}
                lowestFbm={product.lowestFbm}
                estTimeToSale={product.estTimeToSale}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
