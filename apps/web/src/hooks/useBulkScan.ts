'use client';

import { useState, useCallback, useRef } from 'react';
import { apiClient } from '@/lib/api-client';

interface BulkScanRow {
  identifier: string;
  buyPrice?: number;
}

interface ScanStatus {
  id: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  totalRows: number;
  processedRows: number;
  successRows: number;
  failedRows: number;
  marketplace: string;
}

export function useBulkScan() {
  const [scan, setScan] = useState<ScanStatus | null>(null);
  const [results, setResults] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const fetchResults = useCallback(async (scanId: string) => {
    const data = await apiClient.get(`/bulk-scans/${scanId}/results`);
    if (data.success) {
      setResults(data.data);
    }
  }, []);

  const pollStatus = useCallback(async (scanId: string) => {
    const data = await apiClient.get(`/bulk-scans/${scanId}`);
    if (!data.success) return;

    const status = data.data as ScanStatus;
    setScan(status);

    if (status.status === 'COMPLETED' || status.status === 'FAILED') {
      stopPolling();
      await fetchResults(scanId);
    }
  }, [stopPolling, fetchResults]);

  const startScan = useCallback(async (input: {
    fileName: string;
    marketplace: string;
    fulfillmentType: string;
    defaultBuyPrice?: number;
    rows: BulkScanRow[];
  }) => {
    setLoading(true);
    setError(null);
    setResults(null);

    try {
      const data = await apiClient.post('/bulk-scans', input);
      if (!data.success) {
        setError(data.error?.message || 'Failed to start scan');
        setLoading(false);
        return;
      }

      const scanData = data.data as ScanStatus;
      setScan(scanData);
      setLoading(false);

      // Start polling every 2 seconds
      pollRef.current = setInterval(() => {
        pollStatus(scanData.id);
      }, 2000);
    } catch {
      setError('Failed to start scan');
      setLoading(false);
    }
  }, [pollStatus]);

  const reset = useCallback(() => {
    stopPolling();
    setScan(null);
    setResults(null);
    setLoading(false);
    setError(null);
  }, [stopPolling]);

  return { scan, results, loading, error, startScan, reset };
}
