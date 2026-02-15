'use client';

import { useState, useCallback } from 'react';
import { apiClient } from '@/lib/api-client';

interface Product {
  id: string;
  title: string;
  asin: string | null;
  imageUrl: string | null;
}

export interface ProductWatch {
  id: string;
  productId: string;
  marketplace: string;
  watchType: string;
  threshold: number;
  enabled: boolean;
  lastCheckedAt: string | null;
  createdAt: string;
  product: Product;
}

export interface WatchAlert {
  id: string;
  watchId: string;
  productId: string;
  watchType: string;
  previousValue: number;
  currentValue: number;
  threshold: number;
  read: boolean;
  triggeredAt: string;
  product: Product;
  watch: { marketplace: string };
}

export function useProductWatches() {
  const [watches, setWatches] = useState<ProductWatch[]>([]);
  const [alerts, setAlerts] = useState<WatchAlert[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchWatches = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get('/product-watches');
      if (res.success) setWatches(res.data);
    } catch {
      setError('Failed to load watches');
    }
    setLoading(false);
  }, []);

  const createWatch = useCallback(
    async (input: {
      productId: string;
      marketplace: string;
      watchType: string;
      threshold: number;
    }) => {
      setError(null);
      try {
        const res = await apiClient.post('/product-watches', input);
        if (res.success) {
          setWatches((prev) => [res.data, ...prev]);
          return res.data;
        }
        setError(res.error?.message || 'Failed to create watch');
      } catch {
        setError('Failed to create watch');
      }
      return null;
    },
    [],
  );

  const updateWatch = useCallback(
    async (id: string, input: { threshold?: number; enabled?: boolean }) => {
      setError(null);
      try {
        const res = await apiClient.patch(`/product-watches/${id}`, input);
        if (res.success) {
          setWatches((prev) => prev.map((w) => (w.id === id ? res.data : w)));
          return res.data;
        }
      } catch {
        setError('Failed to update watch');
      }
      return null;
    },
    [],
  );

  const removeWatch = useCallback(async (id: string) => {
    setError(null);
    try {
      const res = await apiClient.delete(`/product-watches/${id}`);
      if (res.success) {
        setWatches((prev) => prev.filter((w) => w.id !== id));
        return true;
      }
    } catch {
      setError('Failed to delete watch');
    }
    return false;
  }, []);

  const fetchAlerts = useCallback(async (unreadOnly = false) => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get(
        `/product-watches/alerts${unreadOnly ? '?unreadOnly=true' : ''}`,
      );
      if (res.success) setAlerts(res.data);
    } catch {
      setError('Failed to load alerts');
    }
    setLoading(false);
  }, []);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = await apiClient.get('/product-watches/alerts/count');
      if (res.success) setUnreadCount(res.data.count);
    } catch {
      // ignore
    }
  }, []);

  const markRead = useCallback(async (alertId: string) => {
    try {
      const res = await apiClient.post(`/product-watches/alerts/${alertId}/read`);
      if (res.success) {
        setAlerts((prev) =>
          prev.map((a) => (a.id === alertId ? { ...a, read: true } : a)),
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch {
      // ignore
    }
  }, []);

  const markAllRead = useCallback(async () => {
    try {
      const res = await apiClient.post('/product-watches/alerts/read-all');
      if (res.success) {
        setAlerts((prev) => prev.map((a) => ({ ...a, read: true })));
        setUnreadCount(0);
      }
    } catch {
      // ignore
    }
  }, []);

  return {
    watches,
    alerts,
    unreadCount,
    loading,
    error,
    fetchWatches,
    createWatch,
    updateWatch,
    removeWatch,
    fetchAlerts,
    fetchUnreadCount,
    markRead,
    markAllRead,
  };
}
