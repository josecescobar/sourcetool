'use client';

import { useState, useCallback } from 'react';
import { apiClient } from '@/lib/api-client';

interface Product {
  id: string;
  title: string;
  asin: string | null;
  imageUrl: string | null;
}

export interface SourcedProduct {
  id: string;
  productId: string;
  marketplace: string;
  purchaseDate: string;
  purchasePrice: number;
  quantity: number;
  listingDate: string | null;
  listingPrice: number | null;
  soldDate: string | null;
  soldPrice: number | null;
  actualFees: number | null;
  actualProfit: number | null;
  actualRoi: number | null;
  notes: string | null;
  product: Product;
}

interface Meta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export function useSourcedProducts() {
  const [products, setProducts] = useState<SourcedProduct[]>([]);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async (page = 1) => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get(`/sourced-products?page=${page}&limit=20`);
      if (res.success) {
        setProducts(res.data);
        setMeta(res.meta);
      } else {
        setError(res.error?.message || 'Failed to load sourced products');
      }
    } catch {
      setError('Failed to load sourced products');
    }
    setLoading(false);
  }, []);

  const create = useCallback(
    async (input: {
      productId: string;
      marketplace: string;
      purchaseDate: string;
      purchasePrice: number;
      quantity: number;
      listingDate?: string;
      listingPrice?: number;
      notes?: string;
    }) => {
      setError(null);
      try {
        const res = await apiClient.post('/sourced-products', input);
        if (res.success) {
          await fetchAll(meta?.page ?? 1);
          return res.data;
        }
        setError(res.error?.message || 'Failed to create');
      } catch {
        setError('Failed to create sourced product');
      }
      return null;
    },
    [fetchAll, meta?.page],
  );

  const update = useCallback(
    async (id: string, input: Record<string, any>) => {
      setError(null);
      try {
        const res = await apiClient.patch(`/sourced-products/${id}`, input);
        if (res.success) {
          setProducts((prev) =>
            prev.map((p) => (p.id === id ? res.data : p)),
          );
          return res.data;
        }
        setError(res.error?.message || 'Failed to update');
      } catch {
        setError('Failed to update sourced product');
      }
      return null;
    },
    [],
  );

  const remove = useCallback(
    async (id: string) => {
      setError(null);
      try {
        const res = await apiClient.delete(`/sourced-products/${id}`);
        if (res.success) {
          setProducts((prev) => prev.filter((p) => p.id !== id));
          return true;
        }
        setError(res.error?.message || 'Failed to delete');
      } catch {
        setError('Failed to delete sourced product');
      }
      return false;
    },
    [],
  );

  return { products, meta, loading, error, fetchAll, create, update, remove };
}
