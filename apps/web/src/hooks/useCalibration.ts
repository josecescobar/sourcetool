'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';
import type { CalibrationSegment, CalibrationSummary } from '@sourcetool/shared';

export interface CalibrationReport extends CalibrationSummary {
  unlinkedSoldCount: number;
}

export type { CalibrationSegment };

export function useCalibration() {
  const [data, setData] = useState<CalibrationReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await apiClient.get('/calibration');
      if (res.success) setData(res.data);
      else setError(res.error?.message || 'Failed to load calibration');
    } catch {
      setError('Failed to load calibration');
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}
