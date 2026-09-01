'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, ShieldAlert, Info } from 'lucide-react';
import { apiClient } from '@/lib/api-client';

interface Alert {
  id: string;
  alertType: string;
  severity: number;
  title: string;
  description: string | null;
  source: string | null;
  createdAt: string;
  product: {
    id: string;
    title: string;
    asin: string | null;
    imageUrl: string | null;
  };
}

const ALERT_TYPE_LABELS: Record<string, string> = {
  IP_COMPLAINT: 'IP Complaint',
  HAZMAT: 'Hazmat',
  RESTRICTED: 'Restricted',
  MELTABLE: 'Meltable',
  OVERSIZED: 'Oversized',
  PRIVATE_LABEL: 'Private Label',
};

function severityStyle(severity: number) {
  if (severity >= 5) return { icon: ShieldAlert, bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', badge: 'bg-red-100 text-red-700' };
  if (severity >= 3) return { icon: AlertTriangle, bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', badge: 'bg-amber-100 text-amber-700' };
  return { icon: Info, bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', badge: 'bg-blue-100 text-blue-700' };
}

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await apiClient.get('/alerts?limit=50');
        if (res.success) {
          setAlerts(res.data.data);
        } else {
          setError(res.error?.message || 'Failed to load alerts');
        }
      } catch {
        setError('Failed to load alerts');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Alerts & Restrictions</h1>

      {error && (
        <div className="mb-4 rounded-lg bg-destructive/10 p-4 text-sm text-destructive">{error}</div>
      )}

      {loading ? (
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <p className="text-sm text-muted-foreground text-center py-8">Loading alerts...</p>
        </div>
      ) : !alerts || alerts.length === 0 ? (
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <p className="text-sm text-muted-foreground text-center py-8">
            No alerts yet — product alerts and restriction checks will appear here as you analyze products.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {alerts.map((alert) => {
            const style = severityStyle(alert.severity);
            const Icon = style.icon;
            return (
              <div
                key={alert.id}
                className={`rounded-xl border ${style.border} ${style.bg} p-4 shadow-sm flex items-start gap-3`}
              >
                <Icon className={`h-5 w-5 flex-shrink-0 mt-0.5 ${style.text}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${style.badge}`}>
                      {ALERT_TYPE_LABELS[alert.alertType] ?? alert.alertType}
                    </span>
                    <span className="text-sm font-medium">{alert.title}</span>
                  </div>
                  {alert.description && (
                    <p className="text-sm text-muted-foreground mb-1">{alert.description}</p>
                  )}
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    {alert.product.imageUrl && (
                      <img src={alert.product.imageUrl} alt="" className="h-5 w-5 rounded object-contain border" />
                    )}
                    <span className="truncate">{alert.product.title}</span>
                    {alert.product.asin && <span className="font-mono">{alert.product.asin}</span>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
