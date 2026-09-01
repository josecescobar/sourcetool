'use client';

import { useAnalytics } from '@/hooks/useAnalytics';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { TrendingUp, DollarSign, Percent, Trophy } from 'lucide-react';

const DATE_RANGES = [
  { label: '7d', value: '7d' as const },
  { label: '30d', value: '30d' as const },
  { label: '90d', value: '90d' as const },
  { label: 'All', value: 'all' as const },
];

function formatCurrency(val: number) {
  return val < 0 ? `-$${Math.abs(val).toFixed(2)}` : `$${val.toFixed(2)}`;
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

function roiColor(roi: number) {
  if (roi >= 30) return 'text-green-600';
  if (roi >= 0) return 'text-yellow-600';
  return 'text-red-600';
}

function profitColor(profit: number) {
  return profit >= 0 ? 'text-green-600' : 'text-red-600';
}

function marketplaceLabel(mp: string) {
  return mp
    .replace('AMAZON_', 'AMZ ')
    .replace('WALMART', 'Walmart')
    .replace('EBAY', 'eBay')
    .replace('_', ' ');
}

export default function PerformancePage() {
  const { data, loading, dateRange, setDateRange } = useAnalytics();

  const summary = data?.summary;
  const winRate =
    summary && summary.totalAnalyses > 0
      ? +((summary.profitableCount / summary.totalAnalyses) * 100).toFixed(1)
      : 0;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Performance Dashboard</h1>
        <div className="flex gap-1 rounded-lg border bg-white p-1">
          {DATE_RANGES.map((r) => (
            <button
              key={r.value}
              onClick={() => setDateRange(r.value)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                dateRange === r.value
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-gray-100'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          Loading analytics...
        </div>
      ) : (
        <>
          {/* Row 1: Summary cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <StatCard
              icon={<TrendingUp className="h-4 w-4 text-blue-500" />}
              label="Total Analyses"
              value={String(summary?.totalAnalyses ?? 0)}
              sub={`${dateRange === 'all' ? 'All time' : `Last ${dateRange}`}`}
            />
            <StatCard
              icon={<DollarSign className="h-4 w-4 text-green-500" />}
              label="Total Profit"
              value={formatCurrency(summary?.totalProfit ?? 0)}
              valueClass={profitColor(summary?.totalProfit ?? 0)}
              sub={`${dateRange === 'all' ? 'All time' : `Last ${dateRange}`}`}
            />
            <StatCard
              icon={<Percent className="h-4 w-4 text-purple-500" />}
              label="Avg ROI"
              value={`${summary?.avgRoi ?? 0}%`}
              valueClass={roiColor(summary?.avgRoi ?? 0)}
              sub={`Avg margin: ${summary?.avgMargin ?? 0}%`}
            />
            <StatCard
              icon={<Trophy className="h-4 w-4 text-amber-500" />}
              label="Win Rate"
              value={`${winRate}%`}
              valueClass={winRate >= 50 ? 'text-green-600' : 'text-yellow-600'}
              sub={`${summary?.profitableCount ?? 0} profitable / ${summary?.unprofitableCount ?? 0} not`}
            />
          </div>

          {/* Row 2: Profit over time chart */}
          <div className="rounded-xl border bg-white p-6 shadow-sm mb-6">
            <h2 className="font-medium mb-4">Profit Over Time</h2>
            {data?.profitOverTime.length ? (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={data.profitOverTime}>
                  <defs>
                    <linearGradient id="profitGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={formatDate}
                    tick={{ fontSize: 12 }}
                    stroke="#9ca3af"
                  />
                  <YAxis
                    tickFormatter={(v) => `$${v}`}
                    tick={{ fontSize: 12 }}
                    stroke="#9ca3af"
                  />
                  <Tooltip
                    formatter={(value: number, name: string) => {
                      if (name === 'totalProfit') return [formatCurrency(value), 'Profit'];
                      if (name === 'avgRoi') return [`${value.toFixed(1)}%`, 'Avg ROI'];
                      if (name === 'count') return [value, 'Analyses'];
                      return [value, name];
                    }}
                    labelFormatter={(label) => {
                      const d = new Date(label);
                      return d.toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      });
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="totalProfit"
                    stroke="#22c55e"
                    fill="url(#profitGrad)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-12">
                No analysis data yet. Run product lookups to start tracking performance.
              </p>
            )}
          </div>

          {/* Row 3: Marketplace breakdown + Top products */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Marketplace breakdown */}
            <div className="rounded-xl border bg-white p-6 shadow-sm">
              <h2 className="font-medium mb-4">Profit by Marketplace</h2>
              {data?.marketplaceBreakdown.length ? (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={data.marketplaceBreakdown}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis
                      dataKey="marketplace"
                      tickFormatter={marketplaceLabel}
                      tick={{ fontSize: 12 }}
                      stroke="#9ca3af"
                    />
                    <YAxis
                      tickFormatter={(v) => `$${v}`}
                      tick={{ fontSize: 12 }}
                      stroke="#9ca3af"
                    />
                    <Tooltip
                      formatter={(value: number) => [formatCurrency(value), 'Profit']}
                      labelFormatter={marketplaceLabel}
                    />
                    <Bar dataKey="totalProfit" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-12">
                  No marketplace data yet.
                </p>
              )}
            </div>

            {/* Top products */}
            <div className="rounded-xl border bg-white p-6 shadow-sm">
              <h2 className="font-medium mb-4">Top Products by Profit</h2>
              {data?.topProducts.length ? (
                <div className="overflow-auto max-h-[250px]">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-muted-foreground">
                        <th className="pb-2 font-medium">#</th>
                        <th className="pb-2 font-medium">Product</th>
                        <th className="pb-2 font-medium text-right">Profit</th>
                        <th className="pb-2 font-medium text-right">ROI</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.topProducts.map((p, i) => (
                        <tr key={p.productId} className="border-b last:border-0 hover:bg-gray-50">
                          <td className="py-2 text-muted-foreground">{i + 1}</td>
                          <td className="py-2">
                            <div className="font-medium truncate max-w-[200px]">{p.title}</div>
                            {p.asin && (
                              <div className="text-xs text-muted-foreground">{p.asin}</div>
                            )}
                          </td>
                          <td className={`py-2 text-right font-medium ${profitColor(p.totalProfit)}`}>
                            {formatCurrency(p.totalProfit)}
                          </td>
                          <td className={`py-2 text-right ${roiColor(p.avgRoi)}`}>
                            {p.avgRoi.toFixed(1)}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-12">
                  No product data yet.
                </p>
              )}
            </div>
          </div>

          {/* Row 4: Recent analyses */}
          <div className="rounded-xl border bg-white p-6 shadow-sm">
            <h2 className="font-medium mb-4">Recent Analyses</h2>
            {data?.recentAnalyses.length ? (
              <div className="overflow-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="pb-2 font-medium">Product</th>
                      <th className="pb-2 font-medium">Marketplace</th>
                      <th className="pb-2 font-medium text-right">Buy</th>
                      <th className="pb-2 font-medium text-right">Sell</th>
                      <th className="pb-2 font-medium text-right">Profit</th>
                      <th className="pb-2 font-medium text-right">ROI</th>
                      <th className="pb-2 font-medium text-right">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.recentAnalyses.map((a) => (
                      <tr key={a.id} className="border-b last:border-0 hover:bg-gray-50">
                        <td className="py-2">
                          <div className="font-medium truncate max-w-[200px]">
                            {a.product.title}
                          </div>
                          {a.product.asin && (
                            <div className="text-xs text-muted-foreground">
                              {a.product.asin}
                            </div>
                          )}
                        </td>
                        <td className="py-2">{marketplaceLabel(a.marketplace)}</td>
                        <td className="py-2 text-right">{formatCurrency(a.buyPrice)}</td>
                        <td className="py-2 text-right">{formatCurrency(a.sellPrice)}</td>
                        <td className={`py-2 text-right font-medium ${profitColor(a.profit)}`}>
                          {formatCurrency(a.profit)}
                        </td>
                        <td className={`py-2 text-right ${roiColor(a.roi)}`}>
                          {a.roi.toFixed(1)}%
                        </td>
                        <td className="py-2 text-right text-muted-foreground">
                          {new Date(a.createdAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-12">
                No analyses yet. Run product lookups to see results here.
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  valueClass,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  valueClass?: string;
  sub: string;
}) {
  return (
    <div className="rounded-xl border bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        {icon}
        {label}
      </div>
      <div className={`text-2xl font-bold mt-1 ${valueClass ?? ''}`}>{value}</div>
      <div className="text-xs text-muted-foreground mt-1">{sub}</div>
    </div>
  );
}
