import React, { useState, useEffect } from 'react';

interface Props {
  product: { id?: string; asin?: string; marketplace?: string };
}

const WATCH_TYPES = [
  { value: 'PRICE_BELOW', label: 'Price Below' },
  { value: 'PRICE_ABOVE', label: 'Price Above' },
  { value: 'BSR_BELOW', label: 'BSR Below' },
  { value: 'BSR_ABOVE', label: 'BSR Above' },
] as const;

export function AlertsTab({ product }: Props) {
  const [watches, setWatches] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [watchType, setWatchType] = useState('PRICE_BELOW');
  const [threshold, setThreshold] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadData();
  }, [product.id]);

  const loadData = async () => {
    if (!product.id) return;
    setLoading(true);
    try {
      const [watchRes, alertRes] = await Promise.all([
        chrome.runtime.sendMessage({ type: 'GET_WATCHES' }),
        chrome.runtime.sendMessage({ type: 'GET_ALERTS' }),
      ]);
      const allWatches = watchRes?.data || [];
      setWatches(allWatches.filter((w: any) => w.productId === product.id));
      // Show alerts for this product
      const allAlerts = alertRes?.data || [];
      setAlerts(allAlerts.filter((a: any) => a.productId === product.id));
    } catch {}
    setLoading(false);
  };

  const createWatch = async () => {
    if (!threshold || !product.id) return;
    setCreating(true);
    try {
      await chrome.runtime.sendMessage({
        type: 'CREATE_WATCH',
        data: {
          productId: product.id,
          marketplace: product.marketplace || 'AMAZON_US',
          watchType,
          threshold: parseFloat(threshold),
        },
      });
      setShowForm(false);
      setThreshold('');
      loadData();
    } catch {}
    setCreating(false);
  };

  const deleteWatch = async (id: string) => {
    await chrome.runtime.sendMessage({ type: 'DELETE_WATCH', data: { id } });
    loadData();
  };

  const markRead = async (id: string) => {
    await chrome.runtime.sendMessage({ type: 'MARK_ALERT_READ', data: { id } });
    loadData();
  };

  if (loading) return <div className="text-xs text-muted-foreground p-2">Loading...</div>;

  return (
    <div>
      {/* Active Watches */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-xs font-medium">Active Watches</h4>
          <button
            onClick={() => setShowForm(!showForm)}
            className="text-xs text-primary hover:underline"
          >
            {showForm ? 'Cancel' : '+ Add Watch'}
          </button>
        </div>

        {showForm && (
          <div className="rounded-md border p-2 mb-2 space-y-2">
            <select
              value={watchType}
              onChange={(e) => setWatchType(e.target.value)}
              className="w-full rounded-md border px-2 py-1.5 text-xs bg-background"
            >
              {WATCH_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
            <div className="flex gap-2">
              <input
                type="number"
                step="0.01"
                placeholder="Threshold"
                value={threshold}
                onChange={(e) => setThreshold(e.target.value)}
                className="flex-1 rounded-md border px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <button
                onClick={createWatch}
                disabled={creating || !threshold}
                className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {creating ? '...' : 'Add'}
              </button>
            </div>
          </div>
        )}

        {watches.length === 0 ? (
          <p className="text-xs text-muted-foreground">No watches on this product</p>
        ) : (
          <div className="space-y-1">
            {watches.map((w) => (
              <div key={w.id} className="flex items-center justify-between rounded-md border px-2 py-1.5">
                <div className="text-xs">
                  <span className="font-medium">{w.watchType.replace(/_/g, ' ')}</span>
                  <span className="text-muted-foreground ml-1">
                    {w.watchType.includes('PRICE') ? `$${w.threshold}` : `#${w.threshold}`}
                  </span>
                </div>
                <button
                  onClick={() => deleteWatch(w.id)}
                  className="text-xs text-destructive hover:underline"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Alerts */}
      <div>
        <h4 className="text-xs font-medium mb-2">Recent Alerts</h4>
        {alerts.length === 0 ? (
          <p className="text-xs text-muted-foreground">No alerts yet</p>
        ) : (
          <div className="space-y-1">
            {alerts.slice(0, 10).map((a) => (
              <div
                key={a.id}
                className={`rounded-md border px-2 py-1.5 text-xs ${a.read ? 'opacity-60' : ''}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    {!a.read && <span className="h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />}
                    <span className="font-medium">{a.watchType.replace(/_/g, ' ')}</span>
                  </div>
                  {!a.read && (
                    <button
                      onClick={() => markRead(a.id)}
                      className="text-primary hover:underline"
                    >
                      Mark read
                    </button>
                  )}
                </div>
                <p className="text-muted-foreground mt-0.5">
                  {a.previousValue} → {a.currentValue} (threshold: {a.threshold})
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
