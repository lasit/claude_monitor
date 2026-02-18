interface CacheEntry<T> {
  data: T;
  cachedAt: number;
  ttlMs: number;
}

interface CacheSlot<T> {
  entry: CacheEntry<T> | null;
  refreshPromise: Promise<T> | null;
}

/**
 * In-memory cache with stale-while-revalidate semantics.
 * Deduplicates concurrent fetches for the same key.
 */
export class CacheManager {
  private slots = new Map<string, CacheSlot<unknown>>();
  private serverStartedAt = Date.now();

  private getSlot<T>(key: string): CacheSlot<T> {
    if (!this.slots.has(key)) {
      this.slots.set(key, { entry: null, refreshPromise: null });
    }
    return this.slots.get(key) as CacheSlot<T>;
  }

  /**
   * Get data from cache, fetching if needed.
   * - Fresh cache: returns immediately
   * - Stale cache: returns stale data, triggers background refresh
   * - No cache: awaits fetch
   */
  async get<T>(key: string, ttlMs: number, fetcher: () => Promise<T>): Promise<T> {
    const slot = this.getSlot<T>(key);

    // Check if cache is fresh
    if (slot.entry && Date.now() - slot.entry.cachedAt < slot.entry.ttlMs) {
      return slot.entry.data;
    }

    // If stale data exists, return it and refresh in background
    if (slot.entry) {
      this.refreshInBackground(key, ttlMs, fetcher);
      return slot.entry.data;
    }

    // No data at all, must await
    return this.refresh(key, ttlMs, fetcher);
  }

  /**
   * Force refresh a cache entry (awaits result).
   */
  async refresh<T>(key: string, ttlMs: number, fetcher: () => Promise<T>): Promise<T> {
    const slot = this.getSlot<T>(key);

    // Deduplicate: if a refresh is already in-flight, wait for it
    if (slot.refreshPromise) {
      return slot.refreshPromise;
    }

    const promise = fetcher()
      .then((data) => {
        slot.entry = { data, cachedAt: Date.now(), ttlMs };
        slot.refreshPromise = null;
        return data;
      })
      .catch((err) => {
        slot.refreshPromise = null;
        // If we have stale data, return it on error
        if (slot.entry) {
          console.error(`[cache] Refresh failed for ${key}, using stale data:`, err.message);
          return slot.entry.data;
        }
        throw err;
      });

    slot.refreshPromise = promise;
    return promise;
  }

  private refreshInBackground<T>(key: string, ttlMs: number, fetcher: () => Promise<T>) {
    const slot = this.getSlot<T>(key);
    if (slot.refreshPromise) return; // already refreshing

    slot.refreshPromise = fetcher()
      .then((data) => {
        slot.entry = { data, cachedAt: Date.now(), ttlMs };
        slot.refreshPromise = null;
        console.log(`[cache] Background refresh complete for ${key}`);
        return data;
      })
      .catch((err) => {
        slot.refreshPromise = null;
        console.error(`[cache] Background refresh failed for ${key}:`, err.message);
        return slot.entry?.data as T;
      });
  }

  /**
   * Invalidate a specific cache entry.
   */
  invalidate(key: string) {
    const slot = this.slots.get(key);
    if (slot) {
      slot.entry = null;
    }
  }

  /**
   * Get status of all cache entries.
   */
  getStatus() {
    const now = Date.now();
    const caches: Array<{
      endpoint: string;
      cachedAt: string | null;
      ttlMs: number;
      isStale: boolean;
      isRefreshing: boolean;
    }> = [];

    for (const [key, slot] of this.slots) {
      caches.push({
        endpoint: key,
        cachedAt: slot.entry ? new Date(slot.entry.cachedAt).toISOString() : null,
        ttlMs: slot.entry?.ttlMs ?? 0,
        isStale: slot.entry ? now - slot.entry.cachedAt >= slot.entry.ttlMs : true,
        isRefreshing: slot.refreshPromise !== null,
      });
    }

    return {
      caches,
      serverStartedAt: new Date(this.serverStartedAt).toISOString(),
      uptime: now - this.serverStartedAt,
    };
  }
}

export const cache = new CacheManager();
