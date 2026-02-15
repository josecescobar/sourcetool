'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { SUBSCRIPTION_PLANS } from '@sourcetool/shared';
import { useBilling } from '@/hooks/useBilling';
import { useAuth } from '@/contexts/auth-context';
import { usePermissions } from '@/hooks/usePermissions';
import { Check, ExternalLink } from 'lucide-react';

export default function SettingsPage() {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState<'account' | 'billing' | 'preferences'>('account');
  const { status, loading, startCheckout, openPortal } = useBilling();
  const { user } = useAuth();
  const { isOwner } = usePermissions();

  const success = searchParams.get('success') === 'true';
  const canceled = searchParams.get('canceled') === 'true';

  useEffect(() => {
    if (tabParam === 'billing') setActiveTab('billing');
  }, [tabParam]);

  const currentTier = status?.subscription?.planTier || 'FREE';

  const formatLimit = (val: number) => {
    if (val === null || !isFinite(val)) return 'Unlimited';
    return val.toLocaleString();
  };

  const usagePercent = (current: number, limit: number) => {
    if (!isFinite(limit) || limit === 0) return 0;
    return Math.min(100, Math.round((current / limit) * 100));
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Settings</h1>

      <div className="flex gap-2 mb-6">
        {(['account', 'billing', 'preferences'] as const).map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === tab ? 'bg-primary text-primary-foreground' : 'bg-white border hover:bg-muted'
            }`}>
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {activeTab === 'account' && (
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <h2 className="font-medium mb-4">Account Settings</h2>
          <div className="space-y-4 max-w-md">
            <div>
              <label className="block text-sm font-medium mb-1">Name</label>
              <input type="text" className="w-full rounded-md border px-3 py-2 text-sm" defaultValue={user?.name || ''} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input type="email" className="w-full rounded-md border px-3 py-2 text-sm bg-gray-50" disabled value={user?.email || ''} />
            </div>
            <button className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
              Save Changes
            </button>
          </div>
        </div>
      )}

      {activeTab === 'billing' && (
        <div className="space-y-6">
          {/* Success / canceled messages from Stripe redirect */}
          {success && (
            <div className="rounded-lg bg-green-50 border border-green-200 p-4 text-sm text-green-800">
              Your subscription has been activated! It may take a moment for changes to appear.
            </div>
          )}
          {canceled && (
            <div className="rounded-lg bg-yellow-50 border border-yellow-200 p-4 text-sm text-yellow-800">
              Checkout was canceled. No charges were made.
            </div>
          )}

          {loading ? (
            <div className="rounded-xl border bg-white p-12 shadow-sm text-center text-muted-foreground">
              Loading billing info...
            </div>
          ) : status ? (
            <>
              {/* Current plan card */}
              <div className="rounded-xl border bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-medium text-muted-foreground text-sm">Current Plan</h2>
                    <div className="flex items-center gap-3 mt-1">
                      <p className="text-2xl font-bold">{status.plan.name}</p>
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        status.subscription.status === 'ACTIVE'
                          ? 'bg-green-100 text-green-700'
                          : status.subscription.status === 'PAST_DUE'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {status.subscription.status === 'ACTIVE' ? 'Active'
                          : status.subscription.status === 'PAST_DUE' ? 'Past Due'
                          : status.subscription.status === 'CANCELED' ? 'Canceled'
                          : status.subscription.status}
                      </span>
                      {status.subscription.cancelAtPeriodEnd && (
                        <span className="text-xs text-yellow-600 font-medium">Cancels at period end</span>
                      )}
                    </div>
                    {status.subscription.currentPeriodEnd && (
                      <p className="text-sm text-muted-foreground mt-1">
                        Current period ends {new Date(status.subscription.currentPeriodEnd).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  {isOwner && currentTier !== 'FREE' && (
                    <button
                      onClick={openPortal}
                      className="flex items-center gap-1.5 rounded-md border px-4 py-2 text-sm font-medium hover:bg-gray-50 transition-colors"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Manage Subscription
                    </button>
                  )}
                </div>
              </div>

              {/* Usage meters */}
              <div className="rounded-xl border bg-white p-6 shadow-sm">
                <h2 className="font-medium mb-4">Usage</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Lookups today */}
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-muted-foreground">Lookups today</span>
                      <span className="font-medium">
                        {status.todayUsage.lookupCount} / {formatLimit(status.limits.lookupsPerDay)}
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          usagePercent(status.todayUsage.lookupCount, status.limits.lookupsPerDay) >= 90
                            ? 'bg-red-500'
                            : usagePercent(status.todayUsage.lookupCount, status.limits.lookupsPerDay) >= 70
                            ? 'bg-yellow-500'
                            : 'bg-primary'
                        }`}
                        style={{ width: `${usagePercent(status.todayUsage.lookupCount, status.limits.lookupsPerDay)}%` }}
                      />
                    </div>
                  </div>

                  {/* Bulk scans this month */}
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-muted-foreground">Bulk scans this period</span>
                      <span className="font-medium">
                        {status.periodUsage.bulkScanCount} / {formatLimit(status.limits.bulkScansPerMonth)}
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          usagePercent(status.periodUsage.bulkScanCount, status.limits.bulkScansPerMonth) >= 90
                            ? 'bg-red-500'
                            : usagePercent(status.periodUsage.bulkScanCount, status.limits.bulkScansPerMonth) >= 70
                            ? 'bg-yellow-500'
                            : 'bg-primary'
                        }`}
                        style={{ width: `${usagePercent(status.periodUsage.bulkScanCount, status.limits.bulkScansPerMonth)}%` }}
                      />
                    </div>
                  </div>

                  {/* AI verdicts */}
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-muted-foreground">AI deal verdicts</span>
                      <span className={`font-medium ${status.limits.aiVerdicts ? 'text-green-600' : 'text-muted-foreground'}`}>
                        {status.limits.aiVerdicts ? 'Included' : 'Upgrade required'}
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${status.limits.aiVerdicts ? 'bg-green-500' : 'bg-gray-300'}`}
                        style={{ width: status.limits.aiVerdicts ? '100%' : '0%' }}
                      />
                    </div>
                  </div>

                  {/* Team members */}
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-muted-foreground">Team members</span>
                      <span className="font-medium">
                        {status.memberCount} / {formatLimit(status.limits.maxTeamMembers)}
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          usagePercent(status.memberCount, status.limits.maxTeamMembers) >= 90
                            ? 'bg-red-500'
                            : 'bg-primary'
                        }`}
                        style={{ width: `${usagePercent(status.memberCount, status.limits.maxTeamMembers)}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Plan comparison */}
              <div>
                <h2 className="font-medium mb-4">Plans</h2>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {Object.values(SUBSCRIPTION_PLANS).map((plan) => {
                    const isCurrent = currentTier === plan.tier;
                    return (
                      <div key={plan.tier} className={`rounded-xl border bg-white p-6 shadow-sm ${isCurrent ? 'ring-2 ring-primary' : ''}`}>
                        <h3 className="font-bold text-lg">{plan.name}</h3>
                        <p className="text-2xl font-bold mt-2">
                          {plan.price === 0 ? 'Free' : `$${(plan.price / 100).toFixed(0)}`}
                          {plan.price > 0 && <span className="text-sm font-normal text-muted-foreground">/mo</span>}
                        </p>
                        <ul className="mt-4 space-y-2 text-sm">
                          {plan.features.map((f) => (
                            <li key={f} className="flex items-start gap-2 text-muted-foreground">
                              <Check className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                              {f}
                            </li>
                          ))}
                        </ul>
                        {isCurrent ? (
                          <div className="mt-4 w-full rounded-md bg-primary/10 px-4 py-2 text-sm font-medium text-primary text-center">
                            Current Plan
                          </div>
                        ) : isOwner && plan.price > 0 ? (
                          <button
                            onClick={() => startCheckout(plan.tier)}
                            className="mt-4 w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                          >
                            {plan.price > (SUBSCRIPTION_PLANS[currentTier as keyof typeof SUBSCRIPTION_PLANS]?.price || 0) ? 'Upgrade' : 'Switch'}
                          </button>
                        ) : (
                          <div className="mt-4 w-full rounded-md border px-4 py-2 text-sm font-medium text-muted-foreground text-center">
                            {plan.price === 0 ? 'Free Tier' : isOwner ? 'Upgrade' : 'Contact Owner'}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          ) : null}
        </div>
      )}

      {activeTab === 'preferences' && (
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <h2 className="font-medium mb-4">Preferences</h2>
          <div className="space-y-4 max-w-md">
            <div>
              <label className="block text-sm font-medium mb-1">Default Marketplace</label>
              <select className="w-full rounded-md border px-3 py-2 text-sm">
                <option value="AMAZON_US">Amazon US</option>
                <option value="AMAZON_CA">Amazon Canada</option>
                <option value="AMAZON_UK">Amazon UK</option>
                <option value="WALMART_US">Walmart US</option>
                <option value="EBAY_US">eBay US</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Default Fulfillment</label>
              <select className="w-full rounded-md border px-3 py-2 text-sm">
                <option value="FBA">Amazon FBA</option>
                <option value="FBM">Amazon FBM</option>
                <option value="WFS">Walmart WFS</option>
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
