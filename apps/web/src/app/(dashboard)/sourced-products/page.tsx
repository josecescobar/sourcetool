'use client';

import { useEffect, useState } from 'react';
import { useSourcedProducts, type SourcedProduct } from '@/hooks/useSourcedProducts';
import { apiClient } from '@/lib/api-client';
import { Plus, Trash2, Pencil, X, ChevronLeft, ChevronRight } from 'lucide-react';

const MARKETPLACES = [
  { value: 'AMAZON_US', label: 'Amazon US' },
  { value: 'AMAZON_CA', label: 'Amazon CA' },
  { value: 'AMAZON_UK', label: 'Amazon UK' },
  { value: 'AMAZON_DE', label: 'Amazon DE' },
  { value: 'WALMART_US', label: 'Walmart US' },
  { value: 'EBAY_US', label: 'eBay US' },
  { value: 'EBAY_UK', label: 'eBay UK' },
];

function formatCurrency(val: number | null | undefined) {
  if (val == null) return '—';
  return val < 0 ? `-$${Math.abs(val).toFixed(2)}` : `$${val.toFixed(2)}`;
}

function formatDate(dateStr: string | null | undefined) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function getStatus(item: SourcedProduct) {
  if (item.soldDate) return { label: 'Sold', color: 'bg-green-100 text-green-700' };
  if (item.listingDate) return { label: 'Listed', color: 'bg-blue-100 text-blue-700' };
  return { label: 'Purchased', color: 'bg-gray-100 text-gray-700' };
}

function roiColor(roi: number | null | undefined) {
  if (roi == null) return '';
  if (roi >= 30) return 'text-green-600';
  if (roi >= 0) return 'text-yellow-600';
  return 'text-red-600';
}

function profitColor(profit: number | null | undefined) {
  if (profit == null) return '';
  return profit >= 0 ? 'text-green-600' : 'text-red-600';
}

function marketplaceLabel(mp: string) {
  return MARKETPLACES.find((m) => m.value === mp)?.label ?? mp;
}

export default function SourcedProductsPage() {
  const { products, meta, loading, error, fetchAll, create, update, remove } =
    useSourcedProducts();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Sourced Products</h1>
        <button
          onClick={() => {
            setShowForm(true);
            setEditingId(null);
          }}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add Product
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Add/Edit Form */}
      {showForm && (
        <FormPanel
          editingItem={editingId ? products.find((p) => p.id === editingId) : undefined}
          onSubmit={async (data) => {
            if (editingId) {
              await update(editingId, data);
            } else {
              await create(data as any);
            }
            setShowForm(false);
            setEditingId(null);
          }}
          onCancel={() => {
            setShowForm(false);
            setEditingId(null);
          }}
        />
      )}

      {/* Delete confirmation */}
      {deleteId && (
        <div className="mb-4 rounded-lg border bg-white p-4 shadow-sm flex items-center justify-between">
          <span className="text-sm">Are you sure you want to delete this sourced product?</span>
          <div className="flex gap-2">
            <button
              onClick={() => setDeleteId(null)}
              className="rounded-md px-3 py-1.5 text-sm text-muted-foreground hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              onClick={async () => {
                await remove(deleteId);
                setDeleteId(null);
              }}
              className="rounded-md bg-red-600 px-3 py-1.5 text-sm text-white hover:bg-red-700"
            >
              Delete
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          Loading sourced products...
        </div>
      ) : products.length === 0 ? (
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <p className="text-sm text-muted-foreground text-center py-12">
            No sourced products yet. Start tracking your purchases to measure real profit.
          </p>
        </div>
      ) : (
        <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50 text-left text-muted-foreground">
                  <th className="px-4 py-3 font-medium">Product</th>
                  <th className="px-4 py-3 font-medium">Marketplace</th>
                  <th className="px-4 py-3 font-medium">Purchased</th>
                  <th className="px-4 py-3 font-medium text-right">Buy Price</th>
                  <th className="px-4 py-3 font-medium text-right">Qty</th>
                  <th className="px-4 py-3 font-medium text-right">List Price</th>
                  <th className="px-4 py-3 font-medium text-right">Sold Price</th>
                  <th className="px-4 py-3 font-medium text-right">Profit</th>
                  <th className="px-4 py-3 font-medium text-right">ROI</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((item) => {
                  const status = getStatus(item);
                  return (
                    <tr key={item.id} className="border-b last:border-0 hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {item.product.imageUrl && (
                            <img
                              src={item.product.imageUrl}
                              alt=""
                              className="h-8 w-8 rounded object-cover"
                            />
                          )}
                          <div>
                            <div className="font-medium truncate max-w-[180px]">
                              {item.product.title}
                            </div>
                            {item.product.asin && (
                              <div className="text-xs text-muted-foreground">
                                {item.product.asin}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">{marketplaceLabel(item.marketplace)}</td>
                      <td className="px-4 py-3">{formatDate(item.purchaseDate)}</td>
                      <td className="px-4 py-3 text-right">{formatCurrency(item.purchasePrice)}</td>
                      <td className="px-4 py-3 text-right">{item.quantity}</td>
                      <td className="px-4 py-3 text-right">
                        {formatCurrency(item.listingPrice)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {formatCurrency(item.soldPrice)}
                      </td>
                      <td
                        className={`px-4 py-3 text-right font-medium ${profitColor(item.actualProfit)}`}
                      >
                        {formatCurrency(item.actualProfit)}
                      </td>
                      <td className={`px-4 py-3 text-right ${roiColor(item.actualRoi)}`}>
                        {item.actualRoi != null ? `${item.actualRoi.toFixed(1)}%` : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${status.color}`}
                        >
                          {status.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => {
                              setEditingId(item.id);
                              setShowForm(true);
                            }}
                            className="rounded p-1 text-muted-foreground hover:bg-gray-100 hover:text-foreground"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setDeleteId(item.id)}
                            className="rounded p-1 text-muted-foreground hover:bg-red-50 hover:text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {meta && meta.totalPages > 1 && (
            <div className="flex items-center justify-between border-t px-4 py-3">
              <span className="text-sm text-muted-foreground">
                Page {meta.page} of {meta.totalPages} ({meta.total} total)
              </span>
              <div className="flex gap-2">
                <button
                  disabled={meta.page <= 1}
                  onClick={() => fetchAll(meta.page - 1)}
                  className="rounded-md border px-3 py-1.5 text-sm disabled:opacity-50 hover:bg-gray-50"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  disabled={meta.page >= meta.totalPages}
                  onClick={() => fetchAll(meta.page + 1)}
                  className="rounded-md border px-3 py-1.5 text-sm disabled:opacity-50 hover:bg-gray-50"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function FormPanel({
  editingItem,
  onSubmit,
  onCancel,
}: {
  editingItem?: SourcedProduct;
  onSubmit: (data: Record<string, any>) => Promise<void>;
  onCancel: () => void;
}) {
  const isEditing = !!editingItem;

  // Product search state (only for new)
  const [identifier, setIdentifier] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [productResult, setProductResult] = useState<{
    id: string;
    title: string;
    asin: string | null;
  } | null>(
    editingItem
      ? { id: editingItem.productId, title: editingItem.product.title, asin: editingItem.product.asin }
      : null,
  );

  // Form fields
  const [marketplace, setMarketplace] = useState(editingItem?.marketplace ?? 'AMAZON_US');
  const [purchaseDate, setPurchaseDate] = useState(
    editingItem?.purchaseDate ? editingItem.purchaseDate.split('T')[0] : new Date().toISOString().split('T')[0],
  );
  const [purchasePrice, setPurchasePrice] = useState(
    editingItem?.purchasePrice?.toString() ?? '',
  );
  const [quantity, setQuantity] = useState(editingItem?.quantity?.toString() ?? '1');
  const [listingDate, setListingDate] = useState(
    editingItem?.listingDate ? editingItem.listingDate.split('T')[0] : '',
  );
  const [listingPrice, setListingPrice] = useState(
    editingItem?.listingPrice?.toString() ?? '',
  );
  const [soldDate, setSoldDate] = useState(
    editingItem?.soldDate ? editingItem.soldDate.split('T')[0] : '',
  );
  const [soldPrice, setSoldPrice] = useState(
    editingItem?.soldPrice?.toString() ?? '',
  );
  const [actualFees, setActualFees] = useState(
    editingItem?.actualFees?.toString() ?? '',
  );
  const [notes, setNotes] = useState(editingItem?.notes ?? '');
  const [submitting, setSubmitting] = useState(false);

  const searchProduct = async () => {
    if (!identifier.trim()) return;
    setSearchLoading(true);
    try {
      const res = await apiClient.post('/products/lookup', {
        identifier: identifier.trim(),
      });
      if (res.success && res.data) {
        setProductResult({
          id: res.data.id,
          title: res.data.title,
          asin: res.data.asin,
        });
      }
    } catch {
      // ignore
    }
    setSearchLoading(false);
  };

  const handleSubmit = async () => {
    if (!isEditing && !productResult) return;
    setSubmitting(true);

    const data: Record<string, any> = {
      marketplace,
      purchaseDate,
      purchasePrice: Number(purchasePrice),
      quantity: Number(quantity),
    };

    if (!isEditing && productResult) {
      data.productId = productResult.id;
    }
    if (listingDate) data.listingDate = listingDate;
    if (listingPrice) data.listingPrice = Number(listingPrice);
    if (soldDate) data.soldDate = soldDate;
    if (soldPrice) data.soldPrice = Number(soldPrice);
    if (actualFees) data.actualFees = Number(actualFees);
    if (notes) data.notes = notes;

    await onSubmit(data);
    setSubmitting(false);
  };

  return (
    <div className="mb-6 rounded-xl border bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-medium">
          {isEditing ? 'Edit Sourced Product' : 'Add Sourced Product'}
        </h2>
        <button onClick={onCancel} className="rounded p-1 hover:bg-gray-100">
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Product search (only for new) */}
      {!isEditing && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-muted-foreground mb-1">
            Product (search by ASIN or UPC)
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && searchProduct()}
              placeholder="e.g. B0GDCGGR6K"
              className="flex-1 rounded-md border px-3 py-2 text-sm"
            />
            <button
              onClick={searchProduct}
              disabled={searchLoading}
              className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {searchLoading ? 'Searching...' : 'Search'}
            </button>
          </div>
          {productResult && (
            <div className="mt-2 rounded-md bg-green-50 px-3 py-2 text-sm text-green-700">
              {productResult.title}
              {productResult.asin && ` (${productResult.asin})`}
            </div>
          )}
        </div>
      )}

      {/* Show editing product */}
      {isEditing && productResult && (
        <div className="mb-4 rounded-md bg-gray-50 px-3 py-2 text-sm">
          {productResult.title}
          {productResult.asin && ` (${productResult.asin})`}
        </div>
      )}

      {/* Form fields */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-1">
            Marketplace
          </label>
          <select
            value={marketplace}
            onChange={(e) => setMarketplace(e.target.value)}
            className="w-full rounded-md border px-3 py-2 text-sm"
          >
            {MARKETPLACES.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-1">
            Purchase Date
          </label>
          <input
            type="date"
            value={purchaseDate}
            onChange={(e) => setPurchaseDate(e.target.value)}
            className="w-full rounded-md border px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-1">
            Buy Price ($)
          </label>
          <input
            type="number"
            step="0.01"
            value={purchasePrice}
            onChange={(e) => setPurchasePrice(e.target.value)}
            placeholder="0.00"
            className="w-full rounded-md border px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-1">
            Quantity
          </label>
          <input
            type="number"
            min="1"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className="w-full rounded-md border px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-1">
            Listing Date
          </label>
          <input
            type="date"
            value={listingDate}
            onChange={(e) => setListingDate(e.target.value)}
            className="w-full rounded-md border px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-1">
            Listing Price ($)
          </label>
          <input
            type="number"
            step="0.01"
            value={listingPrice}
            onChange={(e) => setListingPrice(e.target.value)}
            placeholder="0.00"
            className="w-full rounded-md border px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-1">
            Sold Date
          </label>
          <input
            type="date"
            value={soldDate}
            onChange={(e) => setSoldDate(e.target.value)}
            className="w-full rounded-md border px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-1">
            Sold Price ($)
          </label>
          <input
            type="number"
            step="0.01"
            value={soldPrice}
            onChange={(e) => setSoldPrice(e.target.value)}
            placeholder="0.00"
            className="w-full rounded-md border px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-1">
            Actual Fees ($)
          </label>
          <input
            type="number"
            step="0.01"
            value={actualFees}
            onChange={(e) => setActualFees(e.target.value)}
            placeholder="0.00"
            className="w-full rounded-md border px-3 py-2 text-sm"
          />
        </div>
        <div className="col-span-2 md:col-span-3">
          <label className="block text-sm font-medium text-muted-foreground mb-1">
            Notes
          </label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Optional notes..."
            className="w-full rounded-md border px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <button
          onClick={onCancel}
          className="rounded-md px-4 py-2 text-sm text-muted-foreground hover:bg-gray-100"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={submitting || (!isEditing && !productResult)}
          className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {submitting ? 'Saving...' : isEditing ? 'Save Changes' : 'Add Product'}
        </button>
      </div>
    </div>
  );
}
