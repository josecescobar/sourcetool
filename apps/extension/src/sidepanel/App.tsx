import React, { useState, useEffect } from 'react';
import { LoginForm } from './components/LoginForm';
import { ProductHeader } from './components/ProductHeader';
import { ProfitCalculator } from './components/ProfitCalculator';
import { HistoryTab } from './components/HistoryTab';
import { AlertsTab } from './components/AlertsTab';
import { AIVerdict } from './components/AIVerdict';
import { AddToBuyList } from './components/AddToBuyList';

interface ProductData {
  id?: string;
  asin?: string;
  title: string;
  price?: number;
  imageUrl?: string;
  bsr?: number;
  bsrCategory?: string;
  rating?: number;
  reviewCount?: number;
  offerCount?: number;
  brand?: string;
  category?: string;
  marketplace?: string;
  listings?: Array<{
    currentPrice?: number;
    bsr?: number;
    bsrCategory?: string;
    rating?: number;
    reviewCount?: number;
    offerCount?: number;
  }>;
}

type Tab = 'calculator' | 'history' | 'alerts';

export function App() {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [product, setProduct] = useState<ProductData | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('calculator');
  const [showBuyList, setShowBuyList] = useState(false);

  useEffect(() => {
    chrome.runtime.sendMessage({ type: 'CHECK_AUTH' }).then((res) => {
      setAuthenticated(res?.authenticated ?? false);
    });
  }, []);

  useEffect(() => {
    if (!authenticated) return;

    const listener = (message: any) => {
      if (message.type === 'PRODUCT_DATA') {
        setProduct(message.data);
      }
    };
    chrome.runtime.onMessage.addListener(listener);

    // Request current product on mount
    chrome.runtime.sendMessage({ type: 'GET_CURRENT_PRODUCT' }).then((data) => {
      if (data) setProduct(data);
    });

    return () => chrome.runtime.onMessage.removeListener(listener);
  }, [authenticated]);

  if (authenticated === null) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-sm text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!authenticated) {
    return <LoginForm onLoginSuccess={() => setAuthenticated(true)} />;
  }

  if (!product) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center">
        <div className="text-lg font-bold text-primary mb-2">SourceTool</div>
        <p className="text-sm text-muted-foreground">
          Navigate to an Amazon product page to analyze it.
        </p>
      </div>
    );
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: 'calculator', label: 'Calculator' },
    { key: 'history', label: 'History' },
    { key: 'alerts', label: 'Alerts' },
  ];

  return (
    <div className="p-3 text-sm">
      <ProductHeader product={product} onAddToBuyList={() => setShowBuyList(true)} />

      {showBuyList && product.id && (
        <AddToBuyList productId={product.id} onClose={() => setShowBuyList(false)} />
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-3 border-b pb-2">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              activeTab === tab.key
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-secondary'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'calculator' && <ProfitCalculator product={product} />}
      {activeTab === 'history' && <HistoryTab product={product} />}
      {activeTab === 'alerts' && <AlertsTab product={product} />}

      <AIVerdict product={product} />
    </div>
  );
}
