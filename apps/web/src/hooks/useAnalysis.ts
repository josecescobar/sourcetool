'use client';

import { useState, useCallback } from 'react';
import { apiClient } from '@/lib/api-client';
import type { CalculateInput, ProfitResult } from '@sourcetool/shared';

export function useAnalysis() {
  const [result, setResult] = useState<ProfitResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const calculate = useCallback(async (input: CalculateInput) => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiClient.post('/analysis/calculate', input);
      if (data.success) {
        setResult(data.data);
      } else {
        setError(data.error?.message || 'Calculation failed');
      }
    } catch {
      setError('Failed to calculate');
    }
    setLoading(false);
  }, []);

  return { result, loading, error, calculate };
}
