import React, { useEffect, useState } from 'react';

const STORAGE_KEY = 'theme';

/** Apply the persisted theme to <html> as early as possible. */
export function applyStoredTheme() {
  chrome.storage.local
    .get([STORAGE_KEY])
    .then((r) => {
      document.documentElement.classList.toggle('dark', r[STORAGE_KEY] === 'dark');
    })
    .catch(() => {});
}

/** Light/dark toggle, persisted to chrome.storage.local. */
export function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    chrome.storage.local
      .get([STORAGE_KEY])
      .then((r) => setDark(r[STORAGE_KEY] === 'dark'))
      .catch(() => {});
  }, []);

  const toggle = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle('dark', next);
    chrome.storage.local.set({ [STORAGE_KEY]: next ? 'dark' : 'light' }).catch(() => {});
  };

  return (
    <button
      type="button"
      onClick={toggle}
      title="Toggle theme"
      aria-label="Toggle theme"
      className="rounded-md border px-2 py-1 text-xs font-medium hover:bg-secondary"
    >
      {dark ? '☀' : '☾'}
    </button>
  );
}
