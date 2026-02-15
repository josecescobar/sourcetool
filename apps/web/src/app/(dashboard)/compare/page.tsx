'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Plus, X, List, ShieldAlert, ArrowRight } from 'lucide-react';
import { useCompare } from '@/hooks/useCompare';
import { AddToBuyListDialog } from '@/components/add-to-buy-list-dialog';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

const COLORS = ['#6366f1', '#f59e0b', '#10b981'];

function formatCurrency(val: number | null | undefined) {
  if (val == null) return '—';
  return val < 0 ? `-$${Math.abs(val).toFixed(2)}` : `$${val.toFixed(2)}`;
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

function CompareContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data, loading, error, compare } = useCompare();

  const initialAsins = searchParams.get('asins')?.split(',').filter(Boolean) || [];
  const [inputs, setInputs] = useState<string[]>(
    initialAsins.length >= 2
      ? initialAsins.slice(0, 3)
      : ['', ''],
  );
  const [chartMode, setChartMode] = useState<'price' | 'bsr'>('price');
  const [buyListOpen, setBuyListOpen] = useState(false);
  const [buyListProduct, setBuyListProduct] = useState<any>(null);

  useEffect(() => {
    if (initialAsins.length >= 2) {
      compare(initialAsins.slice(0, 3));
    }
    // Only run on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateInput = (index: number, value: string) => {
    setInputs((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };

  const addSlot = () => {
    if (inputs.length < 3) setInputs((prev) => [...prev, '']);
  };

  const removeSlot = (index: number) => {
    if (inputs.length > 2) {
      setInputs((prev) => prev.filter((_, i) => i !== index));
    }
  };

  const handleCompare = () => {
    const asins = inputs.map((a) => a.trim()).filter(Boolean);
    if (asins.length >= 2) {
      router.replace(`/compare?asins=${asins.join(',')}`, { scroll: false });
      compare(asins);
    }
  };

  const products: any[] = data?.products || [];

  // Build chart data by merging all products' history into unified date buckets
  const chartData = buildChartData(products, chartMode);

  // Winner logic
  const getBestIndex = (values: (number | null)[], mode: 'lowest' | 'highest') => {
    let bestIdx = -1;
    let bestVal: number | null = null;
    values.forEach((v, i) => {
      if (v == null) return;
      if (bestVal == null || (mode === 'lowest' ? v < bestVal : v > bestVal)) {
        bestVal = v;
        bestIdx = i;
      }
    });
    return bestIdx;
  };

  const winnerClass = (idx: number, bestIdx: number) =>
    idx === bestIdx ? 'bg-green-50 font-semibold' : '';

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Product Comparison</h1>

      {/* ASIN Input Bar */}
      <div className="rounded-xl border bg-white p-6 shadow-sm mb-6">
        <div className="flex items-end gap-3 flex-wrap">
          {inputs.map((val, i) => (
            <div key={i} className="flex-1 min-w-[180px]">
              <label className="block text-xs text-muted-foreground mb-1">
                Product {i + 1}
              </label>
              <div className="flex gap-1">
                <input
                  type="text"
                  placeholder="Enter ASIN..."
                  value={val}
                  onChange={(e) => updateInput(i, e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCompare()}
                  className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary font-mono"
                />
                {inputs.length > 2 && (
                  <button
                    onClick={() => removeSlot(i)}
                    className="rounded-md p-2 text-muted-foreground hover:text-destructive hover:bg-red-50"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
          {inputs.length < 3 && (
            <button
              onClick={addSlot}
              className="rounded-md border px-3 py-2 text-sm text-muted-foreground hover:bg-gray-50"
            >
              <Plus className="h-4 w-4" />
            </button>
          )}
          <button
            onClick={handleCompare}
            disabled={loading || inputs.filter((a) => a.trim()).length < 2}
            className="rounded-lg bg-primary px-6 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {loading ? 'Comparing...' : 'Compare'}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-destructive/10 p-4 text-sm text-destructive">{error}</div>
      )}

      {/* Comparison Results */}
      {products.length >= 2 && (
        <>
          {/* Buy List Dialog */}
          {buyListProduct && (
            <AddToBuyListDialog
              open={buyListOpen}
              onOpenChange={setBuyListOpen}
              items={[{ productId: buyListProduct.id }]}
              onSuccess={() => setBuyListProduct(null)}
            />
          )}

          <div className="rounded-xl border bg-white shadow-sm mb-6 overflow-x-auto">
            <table className="w-full text-sm">
              <colgroup>
                <col className="w-40" />
                {products.map((_, i) => (
                  <col key={i} />
                ))}
              </colgroup>

              {/* Product Headers */}
              <thead>
                <tr className="border-b">
                  <th className="px-4 py-4 text-left font-medium text-muted-foreground">Product</th>
                  {products.map((p, i) => (
                    <th key={i} className="px-4 py-4 text-left">
                      <div className="flex gap-3 items-start">
                        {p.product.imageUrl && (
                          <img
                            src={p.product.imageUrl}
                            alt=""
                            className="h-16 w-16 rounded-lg object-contain border flex-shrink-0"
                          />
                        )}
                        <div className="min-w-0">
                          <div className="font-semibold text-sm leading-tight line-clamp-2">
                            {p.product.title}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1 space-x-2">
                            {p.product.asin && <span className="font-mono">{p.product.asin}</span>}
                            {p.product.brand && <span>{p.product.brand}</span>}
                          </div>
                        </div>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {/* Price */}
                <CompareRow
                  label="Current Price"
                  values={products.map((p) => p.listing?.currentPrice)}
                  format={formatCurrency}
                  bestIndex={getBestIndex(products.map((p) => p.listing?.currentPrice), 'lowest')}
                  winnerClass={winnerClass}
                />
                <CompareRow
                  label="Buy Box Price"
                  values={products.map((p) => p.listing?.buyBoxPrice)}
                  format={formatCurrency}
                  bestIndex={getBestIndex(products.map((p) => p.listing?.buyBoxPrice), 'lowest')}
                  winnerClass={winnerClass}
                />

                {/* BSR */}
                <CompareRow
                  label="BSR"
                  values={products.map((p) => p.listing?.bsr)}
                  format={(v) => v != null ? `#${v.toLocaleString()}` : '—'}
                  bestIndex={getBestIndex(products.map((p) => p.listing?.bsr), 'lowest')}
                  winnerClass={winnerClass}
                />
                <CompareRow
                  label="BSR Category"
                  values={products.map((p) => p.listing?.bsrCategory)}
                  format={(v) => v || '—'}
                  bestIndex={-1}
                  winnerClass={winnerClass}
                />

                {/* Fees (from analysis) */}
                <CompareRow
                  label="Referral Fee"
                  values={products.map((p) => p.analysis?.referralFee)}
                  format={formatCurrency}
                  bestIndex={getBestIndex(products.map((p) => p.analysis?.referralFee), 'lowest')}
                  winnerClass={winnerClass}
                />
                <CompareRow
                  label="Fulfillment Fee"
                  values={products.map((p) => p.analysis?.fulfillmentFee)}
                  format={formatCurrency}
                  bestIndex={getBestIndex(products.map((p) => p.analysis?.fulfillmentFee), 'lowest')}
                  winnerClass={winnerClass}
                />
                <CompareRow
                  label="Storage Fee"
                  values={products.map((p) => p.analysis?.storageFee)}
                  format={formatCurrency}
                  bestIndex={getBestIndex(products.map((p) => p.analysis?.storageFee), 'lowest')}
                  winnerClass={winnerClass}
                />
                <CompareRow
                  label="Total Fees"
                  values={products.map((p) => p.analysis?.totalFees)}
                  format={formatCurrency}
                  bestIndex={getBestIndex(products.map((p) => p.analysis?.totalFees), 'lowest')}
                  winnerClass={winnerClass}
                />

                {/* Profitability */}
                <CompareRow
                  label="Profit"
                  values={products.map((p) => p.analysis?.profit)}
                  format={formatCurrency}
                  bestIndex={getBestIndex(products.map((p) => p.analysis?.profit), 'highest')}
                  winnerClass={winnerClass}
                  colorFn={(v) => v != null ? (v >= 0 ? 'text-green-600' : 'text-red-600') : ''}
                />
                <CompareRow
                  label="ROI"
                  values={products.map((p) => p.analysis?.roi)}
                  format={(v) => v != null ? `${v.toFixed(1)}%` : '—'}
                  bestIndex={getBestIndex(products.map((p) => p.analysis?.roi), 'highest')}
                  winnerClass={winnerClass}
                  colorFn={(v) => v != null ? (v >= 30 ? 'text-green-600' : v >= 0 ? 'text-yellow-600' : 'text-red-600') : ''}
                />
                <CompareRow
                  label="Margin"
                  values={products.map((p) => p.analysis?.margin)}
                  format={(v) => v != null ? `${v.toFixed(1)}%` : '—'}
                  bestIndex={getBestIndex(products.map((p) => p.analysis?.margin), 'highest')}
                  winnerClass={winnerClass}
                />

                {/* Offers */}
                <CompareRow
                  label="Offer Count"
                  values={products.map((p) => p.listing?.offerCount)}
                  format={(v) => v != null ? String(v) : '—'}
                  bestIndex={-1}
                  winnerClass={winnerClass}
                />
                <CompareRow
                  label="FBA Offers"
                  values={products.map((p) => p.listing?.fbaOfferCount)}
                  format={(v) => v != null ? String(v) : '—'}
                  bestIndex={-1}
                  winnerClass={winnerClass}
                />

                {/* Reviews */}
                <CompareRow
                  label="Rating"
                  values={products.map((p) => p.listing?.rating)}
                  format={(v) => v != null ? `${v}/5` : '—'}
                  bestIndex={getBestIndex(products.map((p) => p.listing?.rating), 'highest')}
                  winnerClass={winnerClass}
                />
                <CompareRow
                  label="Reviews"
                  values={products.map((p) => p.listing?.reviewCount)}
                  format={(v) => v != null ? v.toLocaleString() : '—'}
                  bestIndex={getBestIndex(products.map((p) => p.listing?.reviewCount), 'highest')}
                  winnerClass={winnerClass}
                />

                {/* Amazon */}
                <CompareRow
                  label="Amazon Selling?"
                  values={products.map((p) => p.listing?.isAmazonSelling)}
                  format={(v) =>
                    v === true ? 'Yes' : v === false ? 'No' : '—'
                  }
                  bestIndex={-1}
                  winnerClass={winnerClass}
                  colorFn={(v) => v === true ? 'text-red-600' : v === false ? 'text-green-600' : ''}
                />

                {/* Actions */}
                <tr className="border-t">
                  <td className="px-4 py-3 text-xs font-medium text-muted-foreground">Actions</td>
                  {products.map((p, i) => (
                    <td key={i} className="px-4 py-3">
                      <div className="flex gap-2 flex-wrap">
                        <button
                          onClick={() => {
                            setBuyListProduct(p.product);
                            setBuyListOpen(true);
                          }}
                          className="flex items-center gap-1 rounded-md border px-2 py-1 text-xs hover:bg-gray-50"
                        >
                          <List className="h-3 w-3" /> Buy List
                        </button>
                        <button
                          onClick={() => router.push(`/products?q=${p.product.asin}`)}
                          className="flex items-center gap-1 rounded-md border px-2 py-1 text-xs hover:bg-gray-50"
                        >
                          <ArrowRight className="h-3 w-3" /> Details
                        </button>
                        <button
                          onClick={() => router.push('/alerts')}
                          className="flex items-center gap-1 rounded-md border px-2 py-1 text-xs hover:bg-gray-50"
                        >
                          <ShieldAlert className="h-3 w-3" /> Alert
                        </button>
                      </div>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>

          {/* Price / BSR History Chart */}
          {chartData.length > 0 && (
            <div className="rounded-xl border bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-medium">
                  {chartMode === 'price' ? 'Price' : 'BSR'} History (30 Days)
                </h2>
                <div className="flex gap-1 rounded-lg border bg-white p-1">
                  <button
                    onClick={() => setChartMode('price')}
                    className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                      chartMode === 'price'
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-gray-100'
                    }`}
                  >
                    Price
                  </button>
                  <button
                    onClick={() => setChartMode('bsr')}
                    className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                      chartMode === 'bsr'
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-gray-100'
                    }`}
                  >
                    BSR
                  </button>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={formatDate}
                    tick={{ fontSize: 12 }}
                    stroke="#9ca3af"
                  />
                  <YAxis
                    tickFormatter={(v) =>
                      chartMode === 'price' ? `$${v}` : v.toLocaleString()
                    }
                    tick={{ fontSize: 12 }}
                    stroke="#9ca3af"
                    reversed={chartMode === 'bsr'}
                  />
                  <Tooltip
                    labelFormatter={(label) => {
                      const d = new Date(label);
                      return d.toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      });
                    }}
                    formatter={(value: number, name: string) => [
                      chartMode === 'price'
                        ? `$${value.toFixed(2)}`
                        : `#${value.toLocaleString()}`,
                      name,
                    ]}
                  />
                  <Legend />
                  {products.map((p, i) => (
                    <Line
                      key={i}
                      type="monotone"
                      dataKey={p.product.asin || `product_${i}`}
                      stroke={COLORS[i]}
                      strokeWidth={2}
                      dot={false}
                      connectNulls
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </>
      )}

      {/* Empty state */}
      {!loading && !data && !error && (
        <div className="rounded-xl border bg-white p-12 text-center shadow-sm">
          <p className="text-muted-foreground">
            Enter 2-3 ASINs above and click Compare to see a side-by-side analysis.
          </p>
        </div>
      )}
    </div>
  );
}

function CompareRow({
  label,
  values,
  format,
  bestIndex,
  winnerClass,
  colorFn,
}: {
  label: string;
  values: any[];
  format: (v: any) => string;
  bestIndex: number;
  winnerClass: (idx: number, bestIdx: number) => string;
  colorFn?: (v: any) => string;
}) {
  return (
    <tr className="border-b last:border-0">
      <td className="px-4 py-2.5 text-xs font-medium text-muted-foreground">{label}</td>
      {values.map((v, i) => (
        <td
          key={i}
          className={`px-4 py-2.5 text-sm ${winnerClass(i, bestIndex)} ${colorFn?.(v) || ''}`}
        >
          {format(v)}
        </td>
      ))}
    </tr>
  );
}

function buildChartData(products: any[], mode: 'price' | 'bsr') {
  if (!products.length) return [];

  // Collect all dates across products
  const dateMap = new Map<string, Record<string, number | null>>();

  products.forEach((p) => {
    const history = mode === 'price' ? p.priceHistory : p.bsrHistory;
    const key = p.product.asin || `product`;

    history?.forEach((h: any) => {
      const dateStr = new Date(h.recordedAt).toISOString().split('T')[0] as string;
      if (!dateMap.has(dateStr)) {
        dateMap.set(dateStr, {});
      }
      const entry = dateMap.get(dateStr);
      if (entry) entry[key] = mode === 'price' ? h.price : h.bsr;
    });
  });

  // Sort by date and return
  return Array.from(dateMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, values]) => ({ date, ...values }));
}

export default function ComparePage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          Loading...
        </div>
      }
    >
      <CompareContent />
    </Suspense>
  );
}
