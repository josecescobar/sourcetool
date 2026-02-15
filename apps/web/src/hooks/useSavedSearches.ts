'use client';

import { useState, useCallback } from 'react';
import { apiClient } from '@/lib/api-client';

export interface SavedSearch {
  id: string;
  query: string;
  marketplace: string | null;
  filters: any;
  createdAt: string;
}

export function useSavedSearches() {
  const [searches, setSearches] = useState<SavedSearch[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchSearches = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/saved-searches');
      if (res.success) setSearches(res.data);
    } catch {
      // ignore
    }
    setLoading(false);
  }, []);

  const saveSearch = useCallback(
    async (input: { query: string; marketplace?: string; filters?: any }) => {
      try {
        const res = await apiClient.post('/saved-searches', input);
        if (res.success) {
          setSearches((prev) => [res.data, ...prev]);
          return res.data;
        }
      } catch {
        // ignore
      }
      return null;
    },
    [],
  );

  const removeSearch = useCallback(async (id: string) => {
    try {
      const res = await apiClient.delete(`/saved-searches/${id}`);
      if (res.success) {
        setSearches((prev) => prev.filter((s) => s.id !== id));
        return true;
      }
    } catch {
      // ignore
    }
    return false;
  }, []);

  return { searches, loading, fetchSearches, saveSearch, removeSearch };
}
