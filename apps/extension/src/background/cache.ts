interface CacheEntry {
  data: any;
  expiresAt: number;
}

export class CacheManager {
  private memCache = new Map<string, CacheEntry>();

  async get(key: string): Promise<any | null> {
    // Check memory cache first
    const memEntry = this.memCache.get(key);
    if (memEntry && memEntry.expiresAt > Date.now()) {
      return memEntry.data;
    }
    this.memCache.delete(key);

    // Check storage
    try {
      const result = await chrome.storage.local.get(key);
      const entry = result[key] as CacheEntry | undefined;
      if (entry && entry.expiresAt > Date.now()) {
        this.memCache.set(key, entry);
        return entry.data;
      }
      if (entry) {
        chrome.storage.local.remove(key);
      }
    } catch {}

    return null;
  }

  async set(key: string, data: any, ttlMs: number): Promise<void> {
    const entry: CacheEntry = { data, expiresAt: Date.now() + ttlMs };
    this.memCache.set(key, entry);
    try {
      await chrome.storage.local.set({ [key]: entry });
    } catch {}
  }

  async clear(): Promise<void> {
    this.memCache.clear();
  }
}
