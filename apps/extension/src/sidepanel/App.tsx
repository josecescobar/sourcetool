import React, { useState, useEffect } from 'react';
import { ProfitCalculator } from './components/ProfitCalculator';
import { KeepaChart } from './components/KeepaChart';
import { AIVerdict } from './components/AIVerdict';
import { AlertsBadge } from './components/AlertsBadge';
import { CompetitionTable } from './components/CompetitionTable';
import { TrafficLight } from './components/TrafficLight';

interface ProductData {
  asin?: string;
  title: string;
  price?: number;
  imageUrl?: string;
  bsr?: number;
  bsrCategory?: string;
  rating?: number;
  reviewCount?: number;
  brand?: string;
  marketplace?: string;
}

export function App() {
  const [product, setProduct] = useState<ProductData | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'calculator' | 'history' | 'competition'>('calculator');

  useEffect(() => {
    // Listen for product data from background
    chrome.runtime.onMessage.addListener((message) => {
      if (message.type === 'PRODUCT_DATA') {
        setProduct(message.data);
      }
    });

    // Request current product data
    chrome.runtime.sendMessage({ type: 'GET_CURRENT_PRODUCT' });
  }, []);

  if (!product) {
    return (
      <div style={{ padding: 20, textAlign: 'center', fontFamily: 'system-ui' }}>
        <h2>SourceTool</h2>
        <p>Navigate to a product page to analyze it.</p>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: 'system-ui', padding: 12 }}>
      {/* Product Header */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        {product.imageUrl && <img src={product.imageUrl} alt="" style={{ width: 60, height: 60, objectFit: 'contain' }} />}
        <div>
          <h3 style={{ margin: 0, fontSize: 14, lineHeight: 1.3 }}>{product.title}</h3>
          <p style={{ margin: '4px 0', fontSize: 12, color: '#666' }}>
            {product.asin && `ASIN: ${product.asin}`} {product.brand && `| ${product.brand}`}
          </p>
        </div>
      </div>

      <TrafficLight />
      <AlertsBadge />

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 12, borderBottom: '1px solid #eee', paddingBottom: 8 }}>
        {(['calculator', 'history', 'competition'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '6px 12px', fontSize: 12, border: 'none', borderRadius: 4, cursor: 'pointer',
              background: activeTab === tab ? '#3b82f6' : '#f3f4f6',
              color: activeTab === tab ? '#fff' : '#333',
            }}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {activeTab === 'calculator' && <ProfitCalculator product={product} />}
      {activeTab === 'history' && <KeepaChart productId={product.asin} />}
      {activeTab === 'competition' && <CompetitionTable product={product} />}

      <AIVerdict product={product} />
    </div>
  );
}
