import React, { useState, useEffect } from 'react';

export function AlertsBadge() {
  const [alerts, setAlerts] = useState<any[]>([]);

  // Alerts would be populated from the product data
  if (alerts.length === 0) return null;

  return (
    <div style={{ display: 'flex', gap: 4, marginBottom: 8, flexWrap: 'wrap' }}>
      {alerts.map((alert, i) => (
        <span key={i} style={{
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
