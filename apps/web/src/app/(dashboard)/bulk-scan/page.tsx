'use client';

import { useState } from 'react';
import { Upload } from 'lucide-react';

export default function BulkScanPage() {
  const [file, setFile] = useState<File | null>(null);
  const [scans, setScans] = useState<any[]>([]);

  const handleUpload = async () => {
    if (!file) return;
    // TODO: Implement CSV upload
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Bulk Scan</h1>

      <div className="rounded-xl border bg-white p-6 shadow-sm mb-6">
        <h2 className="font-medium mb-4">Upload Wholesale Catalog</h2>
        <div className="border-2 border-dashed rounded-lg p-8 text-center">
          <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground mb-2">Drag & drop a CSV file, or click to browse</p>
          <input type="file" accept=".csv" onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="text-sm" />
          {file && (
            <div className="mt-4">
              <p className="text-sm font-medium">{file.name}</p>
              <button onClick={handleUpload}
                className="mt-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
                Start Scan
              </button>
            </div>
          )}
        </div>
      </div>

      {scans.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-8">No bulk scans yet. Upload a CSV to get started.</p>
      )}
    </div>
  );
}
