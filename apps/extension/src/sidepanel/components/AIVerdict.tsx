import React, { useState } from 'react';

interface Props {
  product: {
    asin?: string;
    title: string;
    price?: number;
    bsr?: number;
    bsrCategory?: string;
    rating?: number;
    reviewCount?: number;
    category?: string;
    brand?: string;
    listings?: Array<{ currentPrice?: number }>;
  };
  analysisId?: string;
  analysis?: {
    buyPrice?: number;
    sellPrice?: number;
    profit?: number;
    roi?: number;
    margin?: number;
    fees?: { totalFees?: number };
  } | null;
  onCalibrated?: (forecast: unknown) => void;
}

const verdictColors: Record<string, string> = {
  STRONG_BUY: 'text-green-600',
  BUY: 'text-green-500',
  HOLD: 'text-yellow-500',
  PASS: 'text-orange-500',
  STRONG_PASS: 'text-red-600',
};

const verdictBg: Record<string, string> = {
  STRONG_BUY: 'bg-green-50 border-green-200',
  BUY: 'bg-green-50 border-green-100',
  HOLD: 'bg-yellow-50 border-yellow-200',
  PASS: 'bg-orange-50 border-orange-200',
  STRONG_PASS: 'bg-red-50 border-red-200',
};

export function AIVerdict({ product, analysisId, analysis, onCalibrated }: Props) {
  const [verdict, setVerdict] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const getVerdict = async () => {
    setLoading(true);
    try {
      const response = await chrome.runtime.sendMessage({
        type: 'GET_DEAL_SCORE',
        data: {
          analysisId,
          product: {
            title: product.title,
            asin: product.asin,
            category: product.category,
            brand: product.brand,
            bsr: product.bsr,
            bsrCategory: product.bsrCategory,
            rating: product.rating,
            reviewCount: product.reviewCount,
          },
          profitability: {
            buyPrice: analysis?.buyPrice ?? 0,
            sellPrice: analysis?.sellPrice ?? product.listings?.[0]?.currentPrice ?? product.price ?? 0,
            profit: analysis?.profit ?? 0,
            roi: analysis?.roi ?? 0,
            margin: analysis?.margin ?? 0,
            fees: analysis?.fees?.totalFees ?? 0,
          },
          competition: {},
        },
      });
      setVerdict(response?.data);
      if (response?.data?.calibrated) onCalibrated?.(response.data.calibrated);
    } catch (err) {
      console.error('AI verdict error:', err);
    }
    setLoading(false);
  };

  return (
    <div className="mt-3">
      {!verdict ? (
        <button
          onClick={getVerdict}
          disabled={loading}
          className="w-full rounded-md bg-purple-600 py-2 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-50"
        >
          {loading ? 'Analyzing...' : 'Get AI Verdict'}
        </button>
      ) : (
        <div className={`rounded-lg border p-3 ${verdictBg[verdict.verdict] || 'bg-muted'}`}>
          <div className="flex items-center justify-between mb-2">
            <span className={`text-base font-bold ${verdictColors[verdict.verdict] || ''}`}>
              {verdict.verdict?.replace(/_/g, ' ')}
            </span>
            <span className="text-xl font-bold">{verdict.score}/100</span>
          </div>
          {verdict.factors && (
            <div className="grid grid-cols-2 gap-1 mb-2">
              {Object.entries(verdict.factors).map(([key, val]: [string, any]) => (
                <div key={key} className="text-xs">
                  <span className="text-muted-foreground capitalize">{key}: </span>
                  <span className="font-medium">{val?.score ?? val}/25</span>
                </div>
              ))}
            </div>
          )}
          <p className="text-xs text-muted-foreground">{verdict.reasoning}</p>
        </div>
      )}
    </div>
  );
}
