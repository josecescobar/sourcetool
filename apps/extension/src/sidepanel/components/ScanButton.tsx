import React, { useRef, useState } from 'react';
import { prepareImageForExtraction } from '../../lib/image-prep';
import type { ExtractionResult } from '@sourcetool/shared';

interface ScanButtonProps {
  /** Called after a successful scan triggers a product lookup. */
  onProduct?: () => void;
  variant?: 'primary' | 'ghost';
}

/**
 * Scan a shelf photo / barcode / screenshot: prep the image in the panel, ask
 * the background to run Claude vision (EXTRACT_IMAGE), then look up the detected
 * identifier via the normal PRODUCT_DETECTED flow so the panel updates itself.
 */
export function ScanButton({ onProduct, variant = 'primary' }: ScanButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setLoading(true);
    setError('');
    try {
      const image = await prepareImageForExtraction(file);
      const res = await chrome.runtime.sendMessage({ type: 'EXTRACT_IMAGE', data: image });
      const result: ExtractionResult | null = res?.success ? res.data : null;
      const id = result?.identifier?.value;
      if (id) {
        await chrome.runtime.sendMessage({ type: 'PRODUCT_DETECTED', data: { asin: id } });
        onProduct?.();
      } else {
        setError('No product identifier found in that image.');
      }
    } catch {
      setError('Image scan failed. Please try again.');
    }
    setLoading(false);
  };

  return (
    <div className={variant === 'primary' ? 'w-full' : ''}>
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
        className={
          variant === 'primary'
            ? 'w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50'
            : 'rounded-md border px-3 py-1.5 text-xs font-medium hover:bg-secondary disabled:opacity-50'
        }
      >
        {loading ? 'Scanning…' : 'Scan image'}
      </button>
      {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
    </div>
  );
}
