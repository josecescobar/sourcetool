import React from 'react';

interface Props {
  product: { offerCount?: number; bsr?: number; bsrCategory?: string; rating?: number; reviewCount?: number };
}

export function CompetitionTable({ product }: Props) {
  return (
    <div style={{ marginBottom: 12 }}>
      <h4 style={{ margin: '0 0 8px', fontSize: 13 }}>Competition Overview</h4>
      <div style={{ background: '#f9fafb', padding: 8, borderRadius: 6, fontSize: 12 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <tbody>
            <tr><td style={{ padding: '4px 0', color: '#666' }}>BSR</td><td style={{ textAlign: 'right', fontWeight: 600 }}>#{product.bsr?.toLocaleString() || 'N/A'}</td></tr>
            <tr><td style={{ padding: '4px 0', color: '#666' }}>Category</td><td style={{ textAlign: 'right', fontWeight: 600 }}>{product.bsrCategory || 'N/A'}</td></tr>
            <tr><td style={{ padding: '4px 0', color: '#666' }}>Sellers</td><td style={{ textAlign: 'right', fontWeight: 600 }}>{product.offerCount ?? 'N/A'}</td></tr>
            <tr><td style={{ padding: '4px 0', color: '#666' }}>Rating</td><td style={{ textAlign: 'right', fontWeight: 600 }}>{product.rating ? `${product.rating}/5` : 'N/A'}</td></tr>
            <tr><td style={{ padding: '4px 0', color: '#666' }}>Reviews</td><td style={{ textAlign: 'right', fontWeight: 600 }}>{product.reviewCount?.toLocaleString() || 'N/A'}</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
