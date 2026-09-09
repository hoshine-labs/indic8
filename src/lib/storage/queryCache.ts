/**
 * Query Cache Layer
 * 
 * Implements disposable client-side query caching with:
 * - Cache key management
 * - Stale-while-revalidate semantics
 * - Targeted cache invalidation upon provider sync or mutations
 */

import { IndexedDBCache } from "./indexedDbCache";

const QUERY_PREFIX = "cache_query_";

export interface CachedQueryResult<T> {
  data: T;
  isStale: boolean;
  cachedAt: number;
}

export const QueryCache = {
  makeKey(resource: string, params: Record<string, unknown> = {}): string {
    const sorted = Object.keys(params)
      .sort()
      .map((k) => `${k}=${JSON.stringify(params[k])}`)
      .join("&");
    return `${QUERY_PREFIX}${resource}:${sorted}`;
  },

  async fetchWithCache<T>(
    key: string,
    fetcher: () => Promise<T>,
    options: { ttlMinutes?: number; revalidateInBackground?: boolean } = {}
  ): Promise<T> {
    const ttlMs = (options.ttlMinutes || 10) * 60 * 1000;
    const cached = await IndexedDBCache.get<T>(key);

    if (cached !== null) {
      if (options.revalidateInBackground) {
        // Trigger background revalidation
        fetcher()
          .then((fresh) => IndexedDBCache.set(key, fresh, ttlMs))
          .catch((err) => console.warn("[QueryCache] Background revalidation failed", err));
      }
      return cached;
    }

    const fresh = await fetcher();
    await IndexedDBCache.set(key, fresh, ttlMs);
    return fresh;
  },

  async invalidateResource(resource: string): Promise<void> {
    await IndexedDBCache.clearMatching(`${QUERY_PREFIX}${resource}`);
  },

  async invalidateAllSync(): Promise<void> {
    // Invalidate dashboard, products, transactions, metrics, activity
    await Promise.all([
      this.invalidateResource("dashboard"),
      this.invalidateResource("products"),
      this.invalidateResource("transactions"),
      this.invalidateResource("subscriptions"),
      this.invalidateResource("activity"),
      this.invalidateResource("milestones"),
      this.invalidateResource("compare"),
    ]);
  },
};
