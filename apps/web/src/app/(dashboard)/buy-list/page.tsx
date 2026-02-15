'use client';

import { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, X, Pencil, Check, List } from 'lucide-react';
import { useBuyLists } from '@/hooks/useBuyLists';

export default function BuyListPage() {
  const {
    lists,
    activeList,
    loading,
    error,
    fetchLists,
    createList,
    deleteList,
    fetchList,
    renameList,
    removeItem,
  } = useBuyLists();

  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const newInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchLists();
  }, [fetchLists]);

  useEffect(() => {
    if (creating) newInputRef.current?.focus();
  }, [creating]);

  const handleCreate = async () => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    const created = await createList(trimmed);
    if (created) {
      setNewName('');
      setCreating(false);
      fetchList(created.id);
    }
  };

  const handleRename = async (id: string) => {
    const trimmed = editName.trim();
    if (!trimmed) return;
    await renameList(id, trimmed);
    setEditingId(null);
  };

  const handleDelete = async (id: string) => {
    await deleteList(id);
    setDeleteConfirm(null);
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Buy Lists</h1>

      {error && (
        <div className="mb-4 rounded-lg bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="flex gap-6" style={{ minHeight: 'calc(100vh - 180px)' }}>
        {/* Left: Lists sidebar */}
        <div className="w-72 flex-shrink-0">
          <div className="rounded-xl border bg-white shadow-sm">
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <span className="text-sm font-medium text-muted-foreground">Your Lists</span>
              <button
                onClick={() => setCreating(true)}
                className="rounded-md p-1 hover:bg-gray-100 text-muted-foreground hover:text-foreground"
                title="New List"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>

            <div className="p-2 space-y-1">
              {/* New list input */}
              {creating && (
                <div className="flex items-center gap-1 px-2 py-1">
                  <input
                    ref={newInputRef}
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleCreate();
                      if (e.key === 'Escape') { setCreating(false); setNewName(''); }
                    }}
                    placeholder="List name..."
                    className="flex-1 rounded-md border px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                  <button
                    onClick={handleCreate}
                    className="rounded p-1 hover:bg-gray-100 text-green-600"
                  >
                    <Check className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => { setCreating(false); setNewName(''); }}
                    className="rounded p-1 hover:bg-gray-100 text-muted-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}

              {lists.length === 0 && !creating && (
                <p className="px-3 py-6 text-center text-xs text-muted-foreground">
                  No lists yet. Click + to create one.
                </p>
              )}

              {lists.map((list) => (
                <div key={list.id}>
                  {editingId === list.id ? (
                    <div className="flex items-center gap-1 px-2 py-1">
                      <input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleRename(list.id);
                          if (e.key === 'Escape') setEditingId(null);
                        }}
                        autoFocus
                        className="flex-1 rounded-md border px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                      />
                      <button
                        onClick={() => handleRename(list.id)}
                        className="rounded p-1 hover:bg-gray-100 text-green-600"
                      >
                        <Check className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="rounded p-1 hover:bg-gray-100 text-muted-foreground"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => fetchList(list.id)}
                      className={`w-full flex items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                        activeList?.id === list.id
                          ? 'bg-primary/10 text-primary font-medium'
                          : 'hover:bg-gray-100'
                      }`}
                    >
                      <span className="truncate">{list.name}</span>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-muted-foreground">
                          {list._count?.items ?? 0}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingId(list.id);
                            setEditName(list.name);
                          }}
                          className="rounded p-0.5 hover:bg-gray-200 text-muted-foreground hover:text-foreground"
                        >
                          <Pencil className="h-3 w-3" />
                        </button>
                        {deleteConfirm === list.id ? (
                          <div className="flex items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => handleDelete(list.id)}
                              className="rounded px-1.5 py-0.5 text-xs bg-red-600 text-white hover:bg-red-700"
                            >
                              Yes
                            </button>
                            <button
                              onClick={() => setDeleteConfirm(null)}
                              className="rounded px-1.5 py-0.5 text-xs hover:bg-gray-200"
                            >
                              No
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteConfirm(list.id);
                            }}
                            className="rounded p-0.5 hover:bg-gray-200 text-muted-foreground hover:text-red-600"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: List detail */}
        <div className="flex-1 min-w-0">
          {!activeList ? (
            <div className="rounded-xl border bg-white p-12 text-center shadow-sm h-full flex flex-col items-center justify-center">
              <List className="h-12 w-12 text-muted-foreground/40 mb-3" />
              <p className="text-muted-foreground">Select a list to view its items</p>
            </div>
          ) : (
            <div className="rounded-xl border bg-white shadow-sm">
              <div className="flex items-center justify-between px-6 py-4 border-b">
                <div>
                  <h2 className="text-lg font-semibold">{activeList.name}</h2>
                  <p className="text-sm text-muted-foreground">
                    {activeList.items?.length || 0} item{activeList.items?.length !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>

              {activeList.items?.length === 0 ? (
                <div className="p-12 text-center">
                  <p className="text-muted-foreground">
                    No items in this list yet. Add products from the product lookup or bulk scan.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-gray-50">
                        <th className="text-left px-4 py-3 font-medium text-muted-foreground">Product</th>
                        <th className="text-left px-4 py-3 font-medium text-muted-foreground">ASIN</th>
                        <th className="text-right px-4 py-3 font-medium text-muted-foreground">Price</th>
                        <th className="text-right px-4 py-3 font-medium text-muted-foreground">Buy</th>
                        <th className="text-right px-4 py-3 font-medium text-muted-foreground">Profit</th>
                        <th className="text-right px-4 py-3 font-medium text-muted-foreground">ROI</th>
                        <th className="text-left px-4 py-3 font-medium text-muted-foreground">Notes</th>
                        <th className="text-center px-4 py-3 font-medium text-muted-foreground">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeList.items.map((item: any) => {
                        const listing = item.product?.listings?.[0];
                        const analysis = item.analysis;

                        return (
                          <tr key={item.id} className="border-b last:border-0 hover:bg-gray-50">
                            <td className="px-4 py-3 max-w-[250px]">
                              <div className="flex items-center gap-2">
                                {item.product?.imageUrl && (
                                  <img
                                    src={item.product.imageUrl}
                                    alt=""
                                    className="h-8 w-8 rounded object-contain border flex-shrink-0"
                                  />
                                )}
                                <span className="truncate text-xs">{item.product?.title || 'Unknown'}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 font-mono text-xs">
                              {item.product?.asin || '-'}
                            </td>
                            <td className="px-4 py-3 text-right">
                              {listing?.currentPrice != null
                                ? `$${listing.currentPrice.toFixed(2)}`
                                : '-'}
                            </td>
                            <td className="px-4 py-3 text-right">
                              {analysis?.buyPrice != null
                                ? `$${analysis.buyPrice.toFixed(2)}`
                                : '-'}
                            </td>
                            <td className="px-4 py-3 text-right font-medium">
                              {analysis?.profit != null ? (
                                <span className={analysis.profit >= 0 ? 'text-green-600' : 'text-red-600'}>
                                  ${analysis.profit.toFixed(2)}
                                </span>
                              ) : '-'}
                            </td>
                            <td className="px-4 py-3 text-right font-medium">
                              {analysis?.roi != null ? (
                                <span className={analysis.roi >= 30 ? 'text-green-600' : analysis.roi >= 0 ? 'text-yellow-600' : 'text-red-600'}>
                                  {analysis.roi.toFixed(1)}%
                                </span>
                              ) : '-'}
                            </td>
                            <td className="px-4 py-3 text-xs text-muted-foreground max-w-[150px] truncate">
                              {item.notes || '-'}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <button
                                onClick={() => removeItem(activeList.id, item.id)}
                                className="rounded-md p-1 text-muted-foreground hover:text-red-600 hover:bg-red-50"
                                title="Remove from list"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
