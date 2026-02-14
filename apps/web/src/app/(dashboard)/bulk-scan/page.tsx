'use client';

import { useState, useCallback, useEffect } from 'react';
import { Upload, FileText, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { parseCSV, type ParseResult } from '@/lib/csv-parser';
import { useBulkScan } from '@/hooks/useBulkScan';

type Phase = 'upload' | 'processing' | 'results';

export default function BulkScanPage() {
  const [phase, setPhase] = useState<Phase>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [parsed, setParsed] = useState<ParseResult | null>(null);
  const [marketplace, setMarketplace] = useState('AMAZON_US');
  const [fulfillmentType, setFulfillmentType] = useState('FBA');
  const [defaultBuyPrice, setDefaultBuyPrice] = useState('');

  const { scan, results, loading, error, startScan, reset } = useBulkScan();

  const handleFileChange = useCallback(async (selectedFile: File) => {
    setFile(selectedFile);
    const text = await selectedFile.text();
    const result = parseCSV(text);
    setParsed(result);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile?.name.endsWith('.csv')) {
      handleFileChange(droppedFile);
    }
  }, [handleFileChange]);

  const handleStartScan = async () => {
    if (!parsed || !file) return;

    const dp = defaultBuyPrice ? parseFloat(defaultBuyPrice) : undefined;

    await startScan({
      fileName: file.name,
      marketplace,
      fulfillmentType,
      defaultBuyPrice: dp,
      rows: parsed.rows,
    });

    setPhase('processing');
  };

  const handleNewScan = () => {
    reset();
    setFile(null);
    setParsed(null);
    setDefaultBuyPrice('');
    setPhase('upload');
  };

  // Transition to results when scan completes
  useEffect(() => {
    if (phase === 'processing' && scan && (scan.status === 'COMPLETED' || scan.status === 'FAILED')) {
      setPhase('results');
    }
  }, [phase, scan]);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Bulk Scan</h1>

      {error && (
        <div className="mb-4 rounded-lg bg-destructive/10 p-4 text-sm text-destructive">{error}</div>
      )}

      {/* Upload & Configure Phase */}
      {phase === 'upload' && (
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <h2 className="font-medium mb-4">Upload Wholesale Catalog</h2>

          <div
            className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            onClick={() => document.getElementById('csv-input')?.click()}
          >
            <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground mb-2">Drag & drop a CSV file, or click to browse</p>
            <input
              id="csv-input"
              type="file"
              accept=".csv"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFileChange(f);
              }}
            />
          </div>

          {/* Parsed preview */}
          {parsed && file && (
            <div className="mt-6 space-y-4">
              <div className="flex items-center gap-2 text-sm">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{file.name}</span>
                <span className="text-muted-foreground">
                  — {parsed.totalRows} rows detected
                  {parsed.skippedRows > 0 && ` (${parsed.skippedRows} skipped)`}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div className="rounded-lg bg-gray-50 p-3">
                  <span className="text-muted-foreground">Identifier column:</span>{' '}
                  <span className="font-medium">{parsed.detectedColumns.identifier}</span>
                </div>
                <div className="rounded-lg bg-gray-50 p-3">
                  <span className="text-muted-foreground">Buy price column:</span>{' '}
                  <span className="font-medium">
                    {parsed.detectedColumns.buyPrice || 'Not detected'}
                  </span>
                </div>
              </div>

              {/* Configuration */}
              <div className="border-t pt-4">
                <h3 className="font-medium mb-3">Scan Settings</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">Marketplace</label>
                    <select
                      value={marketplace}
                      onChange={(e) => setMarketplace(e.target.value)}
                      className="w-full rounded-md border px-3 py-2 text-sm"
                    >
                      <option value="AMAZON_US">Amazon US</option>
                      <option value="AMAZON_CA">Amazon CA</option>
                      <option value="AMAZON_UK">Amazon UK</option>
                      <option value="AMAZON_DE">Amazon DE</option>
                      <option value="WALMART_US">Walmart US</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">Fulfillment</label>
                    <select
                      value={fulfillmentType}
                      onChange={(e) => setFulfillmentType(e.target.value)}
                      className="w-full rounded-md border px-3 py-2 text-sm"
                    >
                      <option value="FBA">FBA</option>
                      <option value="FBM">FBM</option>
                      <option value="WFS">WFS</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">
                      Default Buy Price {parsed.detectedColumns.buyPrice && '(fallback)'}
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={defaultBuyPrice}
                      onChange={(e) => setDefaultBuyPrice(e.target.value)}
                      className="w-full rounded-md border px-3 py-2 text-sm"
                    />
                  </div>
                </div>
              </div>

              <button
                onClick={handleStartScan}
                disabled={loading || parsed.totalRows === 0}
                className="w-full rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {loading ? 'Starting...' : `Start Scan (${parsed.totalRows} products)`}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Processing Phase */}
      {phase === 'processing' && scan && (
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <h2 className="font-medium">Processing Scan...</h2>
          </div>

          {/* Progress bar */}
          <div className="mb-4">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-medium">
                {scan.totalRows > 0
                  ? Math.round((scan.processedRows / scan.totalRows) * 100)
                  : 0}%
              </span>
            </div>
            <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-500"
                style={{
                  width: `${scan.totalRows > 0 ? (scan.processedRows / scan.totalRows) * 100 : 0}%`,
                }}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="rounded-lg bg-gray-50 p-3">
              <div className="text-2xl font-bold">{scan.processedRows}/{scan.totalRows}</div>
              <div className="text-xs text-muted-foreground">Processed</div>
            </div>
            <div className="rounded-lg bg-green-50 p-3">
              <div className="text-2xl font-bold text-green-600">{scan.successRows}</div>
              <div className="text-xs text-muted-foreground">Success</div>
            </div>
            <div className="rounded-lg bg-red-50 p-3">
              <div className="text-2xl font-bold text-red-600">{scan.failedRows}</div>
              <div className="text-xs text-muted-foreground">Failed</div>
            </div>
          </div>
        </div>
      )}

      {/* Results Phase */}
      {phase === 'results' && scan && (
        <div className="space-y-4">
          {/* Summary bar */}
          <div className="rounded-xl border bg-white p-4 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-4 text-sm">
              <span className="font-medium">Scan Complete</span>
              <span className="text-green-600 flex items-center gap-1">
                <CheckCircle2 className="h-4 w-4" /> {scan.successRows} success
              </span>
              {scan.failedRows > 0 && (
                <span className="text-red-600 flex items-center gap-1">
                  <XCircle className="h-4 w-4" /> {scan.failedRows} failed
                </span>
              )}
            </div>
            <button
              onClick={handleNewScan}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              New Scan
            </button>
          </div>

          {/* Results table */}
          {results && results.length > 0 && (
            <div className="rounded-xl border bg-white shadow-sm overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">#</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Product</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">ASIN</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">Price</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">BSR</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">Buy</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">Profit</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">ROI</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">Margin</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">Fees</th>
                    <th className="text-center px-4 py-3 font-medium text-muted-foreground">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((row: any) => {
                    const listing = row.product?.listings?.find(
                      (l: any) => l.marketplace === scan.marketplace,
                    ) ?? row.product?.listings?.[0];

                    return (
                      <tr key={row.id} className="border-b last:border-0 hover:bg-gray-50">
                        <td className="px-4 py-3 text-muted-foreground">{row.rowNumber}</td>
                        <td className="px-4 py-3 max-w-[200px]">
                          {row.product ? (
                            <div className="flex items-center gap-2">
                              {row.product.imageUrl && (
                                <img
                                  src={row.product.imageUrl}
                                  alt=""
                                  className="h-8 w-8 rounded object-contain border flex-shrink-0"
                                />
                              )}
                              <span className="truncate text-xs">{row.product.title}</span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">{row.identifier}</span>
                          )}
                        </td>
                        <td className="px-4 py-3 font-mono text-xs">
                          {row.product?.asin || '-'}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {listing?.currentPrice != null
                            ? `$${listing.currentPrice.toFixed(2)}`
                            : '-'}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {listing?.bsr != null
                            ? `#${listing.bsr.toLocaleString()}`
                            : '-'}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {row.analysis?.buyPrice != null
                            ? `$${row.analysis.buyPrice.toFixed(2)}`
                            : '-'}
                        </td>
                        <td className="px-4 py-3 text-right font-medium">
                          {row.analysis?.profit != null ? (
                            <span className={row.analysis.profit >= 0 ? 'text-green-600' : 'text-red-600'}>
                              ${row.analysis.profit.toFixed(2)}
                            </span>
                          ) : '-'}
                        </td>
                        <td className="px-4 py-3 text-right font-medium">
                          {row.analysis?.roi != null ? (
                            <span className={row.analysis.roi >= 30 ? 'text-green-600' : row.analysis.roi >= 0 ? 'text-yellow-600' : 'text-red-600'}>
                              {row.analysis.roi.toFixed(1)}%
                            </span>
                          ) : '-'}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {row.analysis?.margin != null
                            ? `${row.analysis.margin.toFixed(1)}%`
                            : '-'}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {row.analysis?.totalFees != null
                            ? `$${row.analysis.totalFees.toFixed(2)}`
                            : '-'}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {row.status === 'SUCCESS' ? (
                            <span className="inline-flex items-center gap-1 text-xs text-green-600">
                              <CheckCircle2 className="h-3.5 w-3.5" /> OK
                            </span>
                          ) : row.status === 'FAILED' ? (
                            <span
                              className="inline-flex items-center gap-1 text-xs text-red-600"
                              title={row.error || ''}
                            >
                              <XCircle className="h-3.5 w-3.5" /> Failed
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground">Pending</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
