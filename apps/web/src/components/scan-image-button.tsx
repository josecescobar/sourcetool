'use client';

import { useRef, useState } from 'react';
import { Camera } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { prepareImageForExtraction } from '@/lib/image-prep';
import type { ExtractionResult } from '@sourcetool/shared';

interface ScanImageButtonProps {
  onExtracted: (result: ExtractionResult) => void;
  onError?: (message: string) => void;
}

/**
 * "Scan image" button: pick (or capture) a photo of a shelf, barcode, or a
 * screenshot of another seller tool, send it to /ai/extract-image, and hand the
 * detected identifier/price back to the caller.
 */
export function ScanImageButton({ onExtracted, onError }: ScanImageButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-picking the same file
    if (!file) return;

    setLoading(true);
    try {
      const image = await prepareImageForExtraction(file);
      const data = await apiClient.post('/ai/extract-image', image);
      if (data.success && data.data?.identifier) {
        onExtracted(data.data as ExtractionResult);
      } else if (data.success) {
        onError?.('No product identifier found in that image.');
      } else {
        onError?.(data.error?.message || 'Image scan failed.');
      }
    } catch {
      onError?.('Image scan failed. Please try again.');
    }
    setLoading(false);
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFile}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={loading}
        className="flex items-center gap-1.5 rounded-lg border px-4 py-2.5 text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
      >
        <Camera className="h-4 w-4" />
        {loading ? 'Scanning...' : 'Scan image'}
      </button>
    </>
  );
}
