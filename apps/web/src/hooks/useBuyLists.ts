'use client';

import { useState, useCallback } from 'react';
import { apiClient } from '@/lib/api-client';

export function useBuyLists() {
  const [lists, setLists] = useState<any[]>([]);
  const [activeList, setActiveList] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLists = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiClient.get('/buy-lists');
      if (data.success) {
        setLists(data.data);
      } else {
        setError(data.error?.message || 'Failed to fetch lists');
      }
    } catch {
      setError('Failed to fetch lists');
    }
    setLoading(false);
  }, []);

  const createList = useCallback(async (name: string) => {
    setError(null);
    try {
      const data = await apiClient.post('/buy-lists', { name });
      if (data.success) {
        setLists((prev) => [data.data, ...prev]);
        return data.data;
      } else {
        setError(data.error?.message || 'Failed to create list');
      }
    } catch {
      setError('Failed to create list');
    }
    return null;
  }, []);

  const deleteList = useCallback(async (id: string) => {
    setError(null);
    try {
      const data = await apiClient.delete(`/buy-lists/${id}`);
      if (data.success) {
        setLists((prev) => prev.filter((l) => l.id !== id));
        if (activeList?.id === id) setActiveList(null);
      } else {
        setError(data.error?.message || 'Failed to delete list');
      }
    } catch {
      setError('Failed to delete list');
    }
  }, [activeList]);

  const fetchList = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiClient.get(`/buy-lists/${id}`);
      if (data.success) {
        setActiveList(data.data);
      } else {
        setError(data.error?.message || 'Failed to fetch list');
      }
    } catch {
      setError('Failed to fetch list');
    }
    setLoading(false);
  }, []);

  const renameList = useCallback(async (id: string, name: string) => {
    setError(null);
    try {
      const data = await apiClient.patch(`/buy-lists/${id}`, { name });
      if (data.success) {
        setLists((prev) =>
          prev.map((l) => (l.id === id ? data.data : l)),
        );
        if (activeList?.id === id) {
          setActiveList((prev: any) => prev ? { ...prev, name } : prev);
        }
      } else {
        setError(data.error?.message || 'Failed to rename list');
      }
    } catch {
      setError('Failed to rename list');
    }
  }, [activeList]);

  const addItem = useCallback(async (
    listId: string,
    productId: string,
    analysisId?: string,
    notes?: string,
  ) => {
    setError(null);
    try {
      const data = await apiClient.post(`/buy-lists/${listId}/items`, {
        productId,
        analysisId,
        notes,
      });
      if (data.success) {
        if (activeList?.id === listId) {
          setActiveList((prev: any) =>
            prev ? { ...prev, items: [data.data, ...prev.items] } : prev,
          );
        }
        setLists((prev) =>
          prev.map((l) =>
            l.id === listId
              ? { ...l, _count: { items: (l._count?.items || 0) + 1 } }
              : l,
          ),
        );
        return data.data;
      } else {
        setError(data.error?.message || 'Failed to add item');
      }
    } catch {
      setError('Failed to add item');
    }
    return null;
  }, [activeList]);

  const removeItem = useCallback(async (listId: string, itemId: string) => {
    setError(null);
    try {
      const data = await apiClient.delete(`/buy-lists/${listId}/items/${itemId}`);
      if (data.success) {
        if (activeList?.id === listId) {
          setActiveList((prev: any) =>
            prev
              ? { ...prev, items: prev.items.filter((i: any) => i.id !== itemId) }
              : prev,
          );
        }
        setLists((prev) =>
          prev.map((l) =>
            l.id === listId
              ? { ...l, _count: { items: Math.max(0, (l._count?.items || 0) - 1) } }
              : l,
          ),
        );
      } else {
        setError(data.error?.message || 'Failed to remove item');
      }
    } catch {
      setError('Failed to remove item');
    }
  }, [activeList]);

  return {
    lists,
    activeList,
    loading,
    error,
    fetchLists,
    createList,
    deleteList,
    fetchList,
    renameList,
    addItem,
    removeItem,
  };
}
