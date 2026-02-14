'use client';

import { useState, useCallback } from 'react';
import { apiClient } from '@/lib/api-client';

export function useProduct() {
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const lookup = useCallback(async (identifier: string, marketplace?: string) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ identifier });
      if (marketplace) params.set('marketplace', marketplace);
      const data = await apiClient.get(`/products/lookup?${params}`);
      if (data.success) {
        setProduct(data.data);
      } else {
        setError(data.error?.message || 'Product not found');
        setProduct(null);
      }
    } catch {
      setError('Failed to lookup product');
      setProduct(null);
    }
    setLoading(false);
  }, []);

  return { product, loading, error, lookup };
}
