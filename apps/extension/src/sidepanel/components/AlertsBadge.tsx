import React, { useState, useEffect } from 'react';

interface Alert {
  id: string;
  title: string;
  severity: number;
}

interface Props {
  identifier?: string;
}

export function AlertsBadge({ identifier }: Props) {
  const [alerts, setAlerts] = useState<Alert[]>([]);

  useEffect(() => {
    if (!identifier) {
      setAlerts([]);
      return;
    }

    let cancelled = false;

    chrome.runtime.sendMessage({ type: 'CHECK_ALERTS', data: { identifier } })
      .then((response) => {
        if (!cancelled && response?.success) {
          setAlerts(response.data ?? []);
        }
      })
      .catch((err) => {
        console.error('Check alerts error:', err);
      });

    return () => {
      cancelled = true;
    };
  }, [identifier]);

  if (alerts.length === 0) return null;

  return (
    <div style={{ display: 'flex', gap: 4, marginBottom: 8, flexWrap: 'wrap' }}>
      {alerts.map((alert) => (
        <span key={alert.id} style={{
          padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 600,
          background: alert.severity >= 4 ? '#fef2f2' : '#fffbeb',
          color: alert.severity >= 4 ? '#dc2626' : '#ca8a04',
          border: `1px solid ${alert.severity >= 4 ? '#fecaca' : '#fde68a'}`,
        }}>
          {alert.title}
        </span>
      ))}
    </div>
  );
}
