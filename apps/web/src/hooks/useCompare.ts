'use client';

import { useState, useCallback } from 'react';
import { apiClient } from '@/lib/api-client';

export function useCompare() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const compare = useCallback(async (asins: string[]) => {
    const filtered = asins.map((a) => a.trim()).filter(Boolean);
    if (filtered.length < 2 || filtered.length > 3) {
      setError('Enter 2 or 3 ASINs to compare');
      return;
    }
    setLoading(true);
    setError(null);
    setData(null);
    try {
      const res = await apiClient.post('/products/compare', { asins: filtered });
      if (res.success) {
        setData(res.data);
      } else {
        setError(res.error?.message || 'Comparison failed');
      }
    } catch {
      setError('Comparison failed. Please try again.');
    }
    setLoading(false);
  }, []);

  return { data, loading, error, compare };
}
