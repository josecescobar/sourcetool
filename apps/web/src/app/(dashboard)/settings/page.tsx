'use client';

import { useState } from 'react';
import { SUBSCRIPTION_PLANS } from '@sourcetool/shared';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'account' | 'billing' | 'preferences'>('account');

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
              <input type="text" className="w-full rounded-md border px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input type="email" className="w-full rounded-md border px-3 py-2 text-sm" disabled />
            </div>
            <button className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
              Save Changes
            </button>
          </div>
        </div>
      )}

      {activeTab === 'billing' && (
        <div className="space-y-6">
          <div className="rounded-xl border bg-white p-6 shadow-sm">
            <h2 className="font-medium mb-4">Current Plan</h2>
            <p className="text-lg font-bold">Free</p>
            <p className="text-sm text-muted-foreground">10 lookups/day</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {Object.values(SUBSCRIPTION_PLANS).map((plan) => (
              <div key={plan.tier} className="rounded-xl border bg-white p-6 shadow-sm">
                <h3 className="font-bold text-lg">{plan.name}</h3>
                <p className="text-2xl font-bold mt-2">
                  {plan.price === 0 ? 'Free' : `$${(plan.price / 100).toFixed(2)}`}
                  {plan.price > 0 && <span className="text-sm font-normal text-muted-foreground">/mo</span>}
                </p>
                <ul className="mt-4 space-y-2 text-sm">
                  {plan.features.map((f) => (
                    <li key={f} className="text-muted-foreground">- {f}</li>
                  ))}
                </ul>
                <button className="mt-4 w-full rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted transition-colors">
                  {plan.price === 0 ? 'Current Plan' : 'Upgrade'}
                </button>
              </div>
            ))}
          </div>
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
