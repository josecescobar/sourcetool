'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/lib/api-client';
import { List, Plus, Check, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@sourcetool/ui';

interface AddToBuyListDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: Array<{ productId: string; analysisId?: string }>;
  onSuccess?: () => void;
}

export function AddToBuyListDialog({
  open,
  onOpenChange,
  items,
  onSuccess,
}: AddToBuyListDialogProps) {
  const [lists, setLists] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [result, setResult] = useState<{ added: number; skipped: number } | null>(null);
  const [error, setError] = useState('');

  const fetchLists = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiClient.get('/buy-lists');
      if (data.success) setLists(data.data);
    } catch {
      setError('Failed to load buy lists');
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (open) {
      fetchLists();
      setResult(null);
      setError('');
      setNewListName('');
      setCreating(false);
    }
  }, [open, fetchLists]);

  const addToList = async (listId: string) => {
    setAdding(true);
    setError('');
    try {
      const firstItem = items[0];
      if (items.length === 1 && firstItem) {
        const data = await apiClient.post(`/buy-lists/${listId}/items`, {
          productId: firstItem.productId,
          analysisId: firstItem.analysisId,
        });
        if (data.success) {
          setResult({ added: 1, skipped: 0 });
          onSuccess?.();
        } else {
          if (data.error?.message?.includes('already exists')) {
            setResult({ added: 0, skipped: 1 });
          } else {
            setError(data.error?.message || 'Failed to add item');
          }
        }
      } else {
        const data = await apiClient.post(`/buy-lists/${listId}/items/batch`, {
          items: items.map((i) => ({
            productId: i.productId,
            analysisId: i.analysisId,
          })),
        });
        if (data.success) {
          setResult({ added: data.data.added, skipped: data.data.skipped });
          onSuccess?.();
        } else {
          setError(data.error?.message || 'Failed to add items');
        }
      }
    } catch {
      setError('Failed to add items');
    }
    setAdding(false);
  };

  const handleCreateAndAdd = async () => {
    if (!newListName.trim()) return;
    setAdding(true);
    setError('');
    try {
      const createData = await apiClient.post('/buy-lists', {
        name: newListName.trim(),
      });
      if (createData.success) {
        await addToList(createData.data.id);
        setAdding(false);
        return;
      } else {
        setError(createData.error?.message || 'Failed to create list');
      }
    } catch {
      setError('Failed to create list');
    }
    setAdding(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add to Buy List</DialogTitle>
          <DialogDescription>
            {items.length === 1
              ? 'Choose a buy list to add this product to.'
              : `Choose a buy list to add ${items.length} products to.`}
          </DialogDescription>
        </DialogHeader>

        {result ? (
          <div className="py-4 text-center">
            <Check className="h-8 w-8 mx-auto text-green-600 mb-2" />
            <p className="text-sm font-medium">
              {result.added > 0 && `Added ${result.added} item${result.added !== 1 ? 's' : ''}`}
              {result.added > 0 && result.skipped > 0 && ', '}
              {result.skipped > 0 && `${result.skipped} already existed`}
              {result.added === 0 && result.skipped === 0 && 'No items to add'}
            </p>
            <button
              onClick={() => onOpenChange(false)}
              className="mt-4 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Done
            </button>
          </div>
        ) : (
          <div className="py-2">
            {error && (
              <div className="mb-3 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="space-y-1 max-h-64 overflow-y-auto">
                {lists.map((list) => (
                  <button
                    key={list.id}
                    onClick={() => addToList(list.id)}
                    disabled={adding}
                    className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm hover:bg-gray-100 disabled:opacity-50 transition-colors"
                  >
                    <List className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span className="flex-1 font-medium truncate">{list.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {list._count?.items || 0} items
                    </span>
                  </button>
                ))}

                {creating ? (
                  <div className="flex items-center gap-2 px-3 py-2">
                    <Plus className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <input
                      type="text"
                      autoFocus
                      placeholder="List name..."
                      value={newListName}
                      onChange={(e) => setNewListName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleCreateAndAdd();
                        if (e.key === 'Escape') setCreating(false);
                      }}
                      className="flex-1 rounded-md border px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <button
                      onClick={handleCreateAndAdd}
                      disabled={!newListName.trim() || adding}
                      className="rounded-md bg-primary px-3 py-1 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                    >
                      {adding ? 'Adding...' : 'Add'}
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setCreating(true)}
                    disabled={adding}
                    className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-primary hover:bg-gray-100 disabled:opacity-50 transition-colors"
                  >
                    <Plus className="h-4 w-4 flex-shrink-0" />
                    <span className="font-medium">Create New List</span>
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
