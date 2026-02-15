'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/lib/api-client';

interface Summary {
  totalAnalyses: number;
  totalProfit: number;
  avgRoi: number;
  avgMargin: number;
  profitableCount: number;
  unprofitableCount: number;
}

interface ProfitDataPoint {
  date: string;
  totalProfit: number;
  avgRoi: number;
  count: number;
}

interface MarketplaceData {
  marketplace: string;
  totalProfit: number;
  avgRoi: number;
  avgMargin: number;
  count: number;
}

interface TopProduct {
  productId: string;
  title: string;
  asin: string | null;
  imageUrl: string | null;
  totalProfit: number;
  avgRoi: number;
  count: number;
}

interface RecentAnalysis {
  id: string;
  product: { title: string; asin: string | null; imageUrl: string | null };
  marketplace: string;
  fulfillmentType: string;
  buyPrice: number;
  sellPrice: number;
  profit: number;
  roi: number;
  margin: number;
  totalFees: number;
  createdAt: string;
}

interface AnalyticsData {
  summary: Summary;
  profitOverTime: ProfitDataPoint[];
  marketplaceBreakdown: MarketplaceData[];
  topProducts: TopProduct[];
  recentAnalyses: RecentAnalysis[];
}

type DateRange = '7d' | '30d' | '90d' | 'all';

function getDateParams(range: DateRange): string {
  if (range === 'all') return '';
  const days = range === '7d' ? 7 : range === '30d' ? 30 : 90;
  const start = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0];
  return `?startDate=${start}`;
}

export function useAnalytics() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<DateRange>('30d');

  const fetchData = useCallback(async (range: DateRange) => {
    setLoading(true);
    setError(null);

    const params = getDateParams(range);

    try {
      const [summary, profitOverTime, marketplaceBreakdown, topProducts, recentAnalyses] =
        await Promise.all([
          apiClient.get(`/analytics/summary${params}`),
          apiClient.get(`/analytics/profit-over-time${params}`),
          apiClient.get(`/analytics/marketplace-breakdown${params}`),
          apiClient.get(`/analytics/top-products${params}`),
          apiClient.get('/analytics/recent'),
        ]);

      if (summary.success) {
        setData({
          summary: summary.data,
          profitOverTime: profitOverTime.data ?? [],
          marketplaceBreakdown: marketplaceBreakdown.data ?? [],
          topProducts: topProducts.data ?? [],
          recentAnalyses: recentAnalyses.data ?? [],
        });
      } else {
        setError(summary.error?.message || 'Failed to load analytics');
      }
    } catch {
      setError('Failed to load analytics');
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData(dateRange);
  }, [dateRange, fetchData]);

  return { data, loading, error, dateRange, setDateRange };
}
