'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { X, ArrowUpRight } from 'lucide-react';

const featureLabels: Record<string, string> = {
  lookup: 'product lookup',
  bulk_scan: 'bulk scan',
  ai_verdict: 'AI deal verdict',
  export: 'Google Sheets export',
  team_invite: 'team member',
};

export function UpgradePrompt() {
  const router = useRouter();
  const [visible, setVisible] = useState(false);
  const [feature, setFeature] = useState('');

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      const feat = detail?.feature || '';
      setFeature(featureLabels[feat] || feat || 'feature');
      setVisible(true);

      setTimeout(() => setVisible(false), 8000);
    };

    window.addEventListener('plan-limit-reached', handler);
    return () => window.removeEventListener('plan-limit-reached', handler);
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-sm animate-in slide-in-from-bottom-4 fade-in duration-300">
      <div className="rounded-xl border bg-white p-4 shadow-lg">
        <div className="flex items-start gap-3">
          <div className="rounded-full bg-yellow-100 p-1.5">
            <ArrowUpRight className="h-4 w-4 text-yellow-700" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium">Plan limit reached</p>
            <p className="text-sm text-muted-foreground mt-0.5">
              You&apos;ve reached your {feature} limit. Upgrade your plan for more.
            </p>
            <button
              onClick={() => {
                setVisible(false);
                router.push('/settings?tab=billing');
              }}
              className="mt-2 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Upgrade Now
            </button>
          </div>
          <button
            onClick={() => setVisible(false)}
            className="rounded-md p-0.5 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
