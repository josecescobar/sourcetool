import React, { useState, useEffect } from 'react';

interface Props {
  productId: string;
  analysisId?: string;
  onClose: () => void;
}

export function AddToBuyList({ productId, analysisId, onClose }: Props) {
  const [lists, setLists] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    chrome.runtime.sendMessage({ type: 'GET_BUY_LISTS' }).then((res) => {
      setLists(res?.data || []);
      setLoading(false);
    });
  }, []);

  const addToList = async (listId: string, listName: string) => {
    setAdding(true);
    setError('');
    try {
      const res = await chrome.runtime.sendMessage({
        type: 'ADD_TO_BUY_LIST',
        data: { listId, productId, analysisId },
      });
      if (res?.success) {
        setSuccess(`Added to "${listName}"`);
        setTimeout(() => onClose(), 1500);
      } else {
        setError(res?.error?.message || 'Already in this list');
      }
    } catch {
      setError('Failed to add');
    }
    setAdding(false);
  };

  return (
    <div className="rounded-lg border bg-card p-3 mb-3">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-xs font-medium">Add to Buy List</h4>
        <button onClick={onClose} className="text-xs text-muted-foreground hover:text-foreground">
          Close
        </button>
      </div>

      {success ? (
        <div className="text-xs text-green-600 font-medium">{success}</div>
      ) : error ? (
        <div className="text-xs text-destructive mb-2">{error}</div>
      ) : null}

      {loading ? (
        <div className="text-xs text-muted-foreground">Loading lists...</div>
      ) : lists.length === 0 ? (
        <div className="text-xs text-muted-foreground">No buy lists yet. Create one in the dashboard.</div>
      ) : (
        <div className="space-y-1">
          {lists.map((list) => (
            <button
              key={list.id}
              onClick={() => addToList(list.id, list.name)}
              disabled={adding || !!success}
              className="w-full text-left rounded-md border px-2 py-1.5 text-xs hover:bg-secondary transition-colors disabled:opacity-50"
            >
              <span className="font-medium">{list.name}</span>
              {list._count?.items != null && (
                <span className="text-muted-foreground ml-1">({list._count.items} items)</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
