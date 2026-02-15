'use client';

import { useEffect, useState } from 'react';
import {
  useProductWatches,
  type ProductWatch,
  type WatchAlert,
} from '@/hooks/useProductWatches';
import { apiClient } from '@/lib/api-client';
import {
  Plus,
  Trash2,
  X,
  Bell,
  Eye,
  CheckCheck,
} from 'lucide-react';

const MARKETPLACES = [
  { value: 'AMAZON_US', label: 'Amazon US' },
  { value: 'AMAZON_CA', label: 'Amazon CA' },
  { value: 'AMAZON_UK', label: 'Amazon UK' },
  { value: 'AMAZON_DE', label: 'Amazon DE' },
  { value: 'WALMART_US', label: 'Walmart US' },
  { value: 'EBAY_US', label: 'eBay US' },
  { value: 'EBAY_UK', label: 'eBay UK' },
];

const WATCH_TYPES = [
  { value: 'PRICE_BELOW', label: 'Price drops below' },
  { value: 'PRICE_ABOVE', label: 'Price rises above' },
  { value: 'BSR_BELOW', label: 'BSR improves below' },
  { value: 'BSR_ABOVE', label: 'BSR worsens above' },
];

function marketplaceLabel(mp: string) {
  return MARKETPLACES.find((m) => m.value === mp)?.label ?? mp;
}

function watchTypeLabel(type: string) {
  return WATCH_TYPES.find((t) => t.value === type)?.label ?? type;
}

function formatValue(type: string, value: number) {
  if (type.startsWith('PRICE_')) return `$${value.toFixed(2)}`;
  return `#${Math.round(value).toLocaleString()}`;
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function AlertsPage() {
  const {
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
    markRead,
    markAllRead,
  } = useProductWatches();

  const [tab, setTab] = useState<'alerts' | 'watches'>('alerts');
  const [showForm, setShowForm] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    fetchWatches();
    fetchAlerts();
  }, [fetchWatches, fetchAlerts]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Alerts</h1>
        {tab === 'watches' && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add Watch
          </button>
        )}
        {tab === 'alerts' && unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className="flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium text-muted-foreground hover:bg-gray-50 transition-colors"
          >
            <CheckCheck className="h-4 w-4" />
            Mark All Read
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b">
        <button
          onClick={() => setTab('alerts')}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
            tab === 'alerts'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <span className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Alerts
            {unreadCount > 0 && (
              <span className="rounded-full bg-red-500 px-2 py-0.5 text-xs text-white">
                {unreadCount}
              </span>
            )}
          </span>
        </button>
        <button
          onClick={() => setTab('watches')}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
            tab === 'watches'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <span className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Watches
            {watches.length > 0 && (
              <span className="rounded-full bg-gray-200 px-2 py-0.5 text-xs text-gray-600">
                {watches.length}
              </span>
            )}
          </span>
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          Loading...
        </div>
      ) : tab === 'alerts' ? (
        <AlertsList alerts={alerts} onMarkRead={markRead} />
      ) : (
        <>
          {showForm && (
            <WatchForm
              onSubmit={async (data) => {
                await createWatch(data);
                setShowForm(false);
              }}
              onCancel={() => setShowForm(false)}
            />
          )}

          {deleteId && (
            <div className="mb-4 rounded-lg border bg-white p-4 shadow-sm flex items-center justify-between">
              <span className="text-sm">Delete this watch?</span>
              <div className="flex gap-2">
                <button
                  onClick={() => setDeleteId(null)}
                  className="rounded-md px-3 py-1.5 text-sm text-muted-foreground hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    await removeWatch(deleteId);
                    setDeleteId(null);
                  }}
                  className="rounded-md bg-red-600 px-3 py-1.5 text-sm text-white hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            </div>
          )}

          <WatchesList
            watches={watches}
            onToggle={(id, enabled) => updateWatch(id, { enabled })}
            onDelete={(id) => setDeleteId(id)}
          />
        </>
      )}
    </div>
  );
}

function AlertsList({
  alerts,
  onMarkRead,
}: {
  alerts: WatchAlert[];
  onMarkRead: (id: string) => void;
}) {
  if (!alerts.length) {
    return (
      <div className="rounded-xl border bg-white p-6 shadow-sm">
        <p className="text-sm text-muted-foreground text-center py-12">
          No alerts yet. Set up watches to start monitoring products.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {alerts.map((alert) => (
        <div
          key={alert.id}
          className={`rounded-xl border bg-white p-4 shadow-sm flex items-center gap-4 transition-colors ${
            !alert.read ? 'border-primary/30 bg-primary/5' : ''
          }`}
        >
          {alert.product.imageUrl && (
            <img
              src={alert.product.imageUrl}
              alt=""
              className="h-10 w-10 rounded object-cover"
            />
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium truncate">{alert.product.title}</span>
              {!alert.read && (
                <span className="rounded-full bg-primary h-2 w-2 flex-shrink-0" />
              )}
            </div>
            <div className="text-sm text-muted-foreground mt-0.5">
              {alertDescription(alert)} &middot;{' '}
              {marketplaceLabel(alert.watch.marketplace)}
            </div>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <span className="text-xs text-muted-foreground">
              {timeAgo(alert.triggeredAt)}
            </span>
            {!alert.read && (
              <button
                onClick={() => onMarkRead(alert.id)}
                className="rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-gray-100"
              >
                Mark read
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function alertDescription(alert: WatchAlert): string {
  const prev = formatValue(alert.watchType, alert.previousValue);
  const curr = formatValue(alert.watchType, alert.currentValue);
  const threshold = formatValue(alert.watchType, alert.threshold);

  switch (alert.watchType) {
    case 'PRICE_BELOW':
      return `Price dropped below ${threshold}: ${prev} → ${curr}`;
    case 'PRICE_ABOVE':
      return `Price rose above ${threshold}: ${prev} → ${curr}`;
    case 'BSR_BELOW':
      return `BSR improved below ${threshold}: ${prev} → ${curr}`;
    case 'BSR_ABOVE':
      return `BSR worsened above ${threshold}: ${prev} → ${curr}`;
    default:
      return `${alert.watchType}: ${prev} → ${curr}`;
  }
}

function WatchesList({
  watches,
  onToggle,
  onDelete,
}: {
  watches: ProductWatch[];
  onToggle: (id: string, enabled: boolean) => void;
  onDelete: (id: string) => void;
}) {
  if (!watches.length) {
    return (
      <div className="rounded-xl border bg-white p-6 shadow-sm">
        <p className="text-sm text-muted-foreground text-center py-12">
          No watches set up yet. Watch products to get alerted on price and BSR
          changes.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-gray-50 text-left text-muted-foreground">
            <th className="px-4 py-3 font-medium">Product</th>
            <th className="px-4 py-3 font-medium">Marketplace</th>
            <th className="px-4 py-3 font-medium">Condition</th>
            <th className="px-4 py-3 font-medium text-right">Threshold</th>
            <th className="px-4 py-3 font-medium">Last Checked</th>
            <th className="px-4 py-3 font-medium">Enabled</th>
            <th className="px-4 py-3 font-medium text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {watches.map((w) => (
            <tr key={w.id} className="border-b last:border-0 hover:bg-gray-50">
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  {w.product.imageUrl && (
                    <img
                      src={w.product.imageUrl}
                      alt=""
                      className="h-8 w-8 rounded object-cover"
                    />
                  )}
                  <div>
                    <div className="font-medium truncate max-w-[180px]">
                      {w.product.title}
                    </div>
                    {w.product.asin && (
                      <div className="text-xs text-muted-foreground">
                        {w.product.asin}
                      </div>
                    )}
                  </div>
                </div>
              </td>
              <td className="px-4 py-3">{marketplaceLabel(w.marketplace)}</td>
              <td className="px-4 py-3">{watchTypeLabel(w.watchType)}</td>
              <td className="px-4 py-3 text-right font-medium">
                {formatValue(w.watchType, w.threshold)}
              </td>
              <td className="px-4 py-3 text-muted-foreground">
                {w.lastCheckedAt ? timeAgo(w.lastCheckedAt) : 'Never'}
              </td>
              <td className="px-4 py-3">
                <button
                  onClick={() => onToggle(w.id, !w.enabled)}
                  className={`rounded-full px-3 py-1 text-xs font-medium ${
                    w.enabled
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {w.enabled ? 'On' : 'Off'}
                </button>
              </td>
              <td className="px-4 py-3 text-right">
                <button
                  onClick={() => onDelete(w.id)}
                  className="rounded p-1 text-muted-foreground hover:bg-red-50 hover:text-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function WatchForm({
  onSubmit,
  onCancel,
}: {
  onSubmit: (data: {
    productId: string;
    marketplace: string;
    watchType: string;
    threshold: number;
  }) => Promise<void>;
  onCancel: () => void;
}) {
  const [identifier, setIdentifier] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [productResult, setProductResult] = useState<{
    id: string;
    title: string;
    asin: string | null;
  } | null>(null);
  const [marketplace, setMarketplace] = useState('AMAZON_US');
  const [watchType, setWatchType] = useState('PRICE_BELOW');
  const [threshold, setThreshold] = useState('');
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
    if (!productResult || !threshold) return;
    setSubmitting(true);
    await onSubmit({
      productId: productResult.id,
      marketplace,
      watchType,
      threshold: Number(threshold),
    });
    setSubmitting(false);
  };

  return (
    <div className="mb-6 rounded-xl border bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-medium">Add Watch</h2>
        <button onClick={onCancel} className="rounded p-1 hover:bg-gray-100">
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Product search */}
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

      {/* Watch config */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
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
            Condition
          </label>
          <select
            value={watchType}
            onChange={(e) => setWatchType(e.target.value)}
            className="w-full rounded-md border px-3 py-2 text-sm"
          >
            {WATCH_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-1">
            Threshold
          </label>
          <input
            type="number"
            step={watchType.startsWith('PRICE_') ? '0.01' : '1'}
            value={threshold}
            onChange={(e) => setThreshold(e.target.value)}
            placeholder={watchType.startsWith('PRICE_') ? '25.00' : '5000'}
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
          disabled={submitting || !productResult || !threshold}
          className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {submitting ? 'Creating...' : 'Create Watch'}
        </button>
      </div>
    </div>
  );
}
