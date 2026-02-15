import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/lib/api-client';

interface BillingStatus {
  subscription: {
    planTier: string;
    status: string;
    currentPeriodStart?: string;
    currentPeriodEnd?: string;
    cancelAtPeriodEnd?: boolean;
  };
  todayUsage: {
    lookupCount: number;
    bulkScanCount: number;
    aiVerdictCount: number;
    exportCount: number;
  };
  periodUsage: {
    lookupCount: number;
    bulkScanCount: number;
    aiVerdictCount: number;
    exportCount: number;
  };
  memberCount: number;
  limits: {
    lookupsPerDay: number;
    bulkScansPerMonth: number;
    aiVerdicts: boolean;
    maxTeamMembers: number;
  };
  plan: {
    name: string;
    tier: string;
    price: number;
  };
}

export function useBilling() {
  const [status, setStatus] = useState<BillingStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const refresh = useCallback(async () => {
    try {
      const data = await apiClient.get('/billing/status');
      if (data.success) {
        setStatus(data.data);
      }
    } catch {
      setError('Failed to load billing status');
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const canUse = useCallback(
    (feature: 'lookup' | 'bulk_scan' | 'ai' | 'export' | 'invite') => {
      if (!status) return true;
      switch (feature) {
        case 'lookup':
          return status.limits.lookupsPerDay === null || status.todayUsage.lookupCount < status.limits.lookupsPerDay;
        case 'bulk_scan':
          return status.limits.bulkScansPerMonth === null || status.periodUsage.bulkScanCount < status.limits.bulkScansPerMonth;
        case 'ai':
          return status.limits.aiVerdicts;
        case 'export':
          return status.subscription.planTier === 'PROFESSIONAL' || status.subscription.planTier === 'ENTERPRISE';
        case 'invite':
          return status.limits.maxTeamMembers === null || status.memberCount < status.limits.maxTeamMembers;
        default:
          return true;
      }
    },
    [status],
  );

  const isAtLimit = useCallback(
    (feature: 'lookup' | 'bulk_scan' | 'ai' | 'export' | 'invite') => !canUse(feature),
    [canUse],
  );

  const startCheckout = useCallback(async (planTier: string) => {
    try {
      const data = await apiClient.post('/billing/checkout', { planTier });
      if (data.success && data.data.url) {
        window.location.href = data.data.url;
      }
    } catch {
      setError('Failed to start checkout');
    }
  }, []);

  const openPortal = useCallback(async () => {
    try {
      const data = await apiClient.post('/billing/portal');
      if (data.success && data.data.url) {
        window.location.href = data.data.url;
      }
    } catch {
      setError('Failed to open billing portal');
    }
  }, []);

  return {
    status,
    loading,
    error,
    canUse,
    isAtLimit,
    startCheckout,
    openPortal,
    refresh,
  };
}
