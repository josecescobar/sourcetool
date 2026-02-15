import React, { useState, useEffect } from 'react';

export function App() {
  const [apiUrl, setApiUrl] = useState('http://localhost:3001/api');
  const [saved, setSaved] = useState(false);
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    chrome.storage.local.get(['apiUrl']).then((result) => {
      if (result.apiUrl) setApiUrl(result.apiUrl);
    });
    chrome.runtime.sendMessage({ type: 'CHECK_AUTH' }).then((res) => {
      setAuthenticated(res?.authenticated ?? false);
    });
  }, []);

  const save = async () => {
    await chrome.storage.local.set({ apiUrl });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const logout = async () => {
    await chrome.runtime.sendMessage({ type: 'LOGOUT' });
    setAuthenticated(false);
  };

  return (
    <div className="max-w-lg mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">SourceTool Settings</h1>

      <div className="mb-6">
        <label className="block text-sm font-medium mb-1">API URL</label>
        <input
          type="text"
          value={apiUrl}
          onChange={(e) => setApiUrl(e.target.value)}
          className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={save}
          className="rounded-md bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Save Settings
        </button>
        {saved && <span className="text-sm text-green-600">Saved!</span>}
      </div>

      <div className="border-t pt-6">
        <h2 className="text-lg font-semibold mb-3">Account</h2>
        {authenticated === null ? (
          <p className="text-sm text-muted-foreground">Checking...</p>
        ) : authenticated ? (
          <div className="flex items-center gap-3">
            <span className="text-sm text-green-600">Logged in</span>
            <button
              onClick={logout}
              className="rounded-md border px-4 py-1.5 text-sm font-medium hover:bg-secondary transition-colors"
            >
              Log Out
            </button>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Not logged in. Open the side panel to sign in.
          </p>
        )}
      </div>
    </div>
  );
}
