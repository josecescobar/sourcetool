import React from 'react';

interface Props {
  verdict?: 'STRONG_BUY' | 'BUY' | 'HOLD' | 'PASS' | 'STRONG_PASS';
}

export function TrafficLight({ verdict }: Props) {
  const colors = {
    STRONG_BUY: '#16a34a',
    BUY: '#22c55e',
    HOLD: '#eab308',
    PASS: '#f97316',
    STRONG_PASS: '#dc2626',
  };

  if (!verdict) return null;

  const color = colors[verdict] || '#999';

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
      <div style={{ width: 12, height: 12, borderRadius: '50%', background: color }} />
      <span style={{ fontSize: 12, fontWeight: 600, color }}>{verdict.replace('_', ' ')}</span>
    </div>
  );
}
