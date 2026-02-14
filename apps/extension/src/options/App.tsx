import React, { useState, useEffect } from 'react';

export function App() {
  const [apiUrl, setApiUrl] = useState('http://localhost:3001/api');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    chrome.storage.local.get(['apiUrl']).then((result) => {
      if (result.apiUrl) setApiUrl(result.apiUrl);
    });
  }, []);

  const save = async () => {
    await chrome.storage.local.set({ apiUrl });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div style={{ fontFamily: 'system-ui', maxWidth: 600, margin: '40px auto', padding: 20 }}>
      <h1 style={{ fontSize: 24, marginBottom: 20 }}>SourceTool Settings</h1>
      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', marginBottom: 4, fontSize: 14, fontWeight: 600 }}>API URL</label>
        <input type="text" value={apiUrl} onChange={(e) => setApiUrl(e.target.value)}
          style={{ width: '100%', padding: '8px 10px', border: '1px solid #ddd', borderRadius: 6, fontSize: 14 }} />
      </div>
      <button onClick={save}
        style={{ padding: '8px 20px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 14 }}>
        Save Settings
      </button>
      {saved && <span style={{ marginLeft: 12, color: '#16a34a', fontSize: 14 }}>Saved!</span>}
    </div>
  );
}
