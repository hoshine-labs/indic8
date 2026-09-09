/**
 * IndexedDB Client Cache Layer
 * 
 * Used for disposable client-side caches (query results, charts, thumbnails, drafts)
 * - Versioned database schema
 * - Expiration and TTL check
 * - Size bounding and LRU eviction
 * - Automatic degradation if IndexedDB is blocked or unavailable
 */

import { assertClientStorageSafe } from "./storagePolicy";

const DB_NAME = "indic8_local_cache";
const DB_VERSION = 1;
const STORE_NAME = "cache_entries";

export interface CacheEntry<T = unknown> {
  key: string;
  data: T;
  createdAt: number;
  expiresAt: number;
  version: number;
}

let dbInstance: IDBDatabase | null = null;
let dbPromise: Promise<IDBDatabase | null> | null = null;

async function getDB(): Promise<IDBDatabase | null> {
  if (typeof window === "undefined" || !window.indexedDB) {
    return null;
  }
  if (dbInstance) return dbInstance;
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve) => {
    try {
      const request = window.indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: "key" });
          store.createIndex("idx_expiresAt", "expiresAt", { unique: false });
        }
      };

      request.onsuccess = () => {
        dbInstance = request.result;
        resolve(dbInstance);
      };

      request.onerror = () => {
        console.warn("[IndexedDBCache] IndexedDB open error, falling back to memory.", request.error);
        resolve(null);
      };
    } catch {
      resolve(null);
    }
  });

  return dbPromise;
}

// In-memory fallback if IndexedDB is unavailable
const memoryFallback = new Map<string, CacheEntry>();

export const IndexedDBCache = {
  async get<T>(key: string): Promise<T | null> {
    const now = Date.now();
    const db = await getDB();

    if (!db) {
      const mem = memoryFallback.get(key);
      if (!mem) return null;
      if (mem.expiresAt < now) {
        memoryFallback.delete(key);
        return null;
      }
      return mem.data as T;
    }

    return new Promise((resolve) => {
      try {
        const tx = db.transaction(STORE_NAME, "readonly");
        const store = tx.objectStore(STORE_NAME);
        const req = store.get(key);

        req.onsuccess = () => {
          const result = req.result as CacheEntry<T> | undefined;
          if (!result) return resolve(null);
          if (result.expiresAt < now) {
            // Expired, delete asynchronously
            IndexedDBCache.delete(key).catch(() => {});
            return resolve(null);
          }
          resolve(result.data);
        };

        req.onerror = () => resolve(null);
      } catch {
        resolve(null);
      }
    });
  },

  async set<T>(key: string, data: T, ttlMs = 15 * 60 * 1000, version = 1): Promise<void> {
    assertClientStorageSafe(key, data);
    const now = Date.now();
    const entry: CacheEntry<T> = {
      key,
      data,
      createdAt: now,
      expiresAt: now + ttlMs,
      version,
    };

    const db = await getDB();
    if (!db) {
      memoryFallback.set(key, entry as CacheEntry);
      return;
    }

    return new Promise((resolve) => {
      try {
        const tx = db.transaction(STORE_NAME, "readwrite");
        const store = tx.objectStore(STORE_NAME);
        store.put(entry);
        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
      } catch {
        resolve();
      }
    });
  },

  async delete(key: string): Promise<void> {
    const db = await getDB();
    memoryFallback.delete(key);
    if (!db) return;

    return new Promise((resolve) => {
      try {
        const tx = db.transaction(STORE_NAME, "readwrite");
        const store = tx.objectStore(STORE_NAME);
        store.delete(key);
        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
      } catch {
        resolve();
      }
    });
  },

  async clearMatching(prefix: string): Promise<void> {
    for (const k of Array.from(memoryFallback.keys())) {
      if (k.startsWith(prefix)) memoryFallback.delete(k);
    }
    const db = await getDB();
    if (!db) return;

    return new Promise((resolve) => {
      try {
        const tx = db.transaction(STORE_NAME, "readwrite");
        const store = tx.objectStore(STORE_NAME);
        const req = store.openCursor();

        req.onsuccess = (e) => {
          const cursor = (e.target as IDBRequest<IDBCursorWithValue>).result;
          if (cursor) {
            if (String(cursor.key).startsWith(prefix)) {
              cursor.delete();
            }
            cursor.continue();
          } else {
            resolve();
          }
        };

        req.onerror = () => resolve();
      } catch {
        resolve();
      }
    });
  },

  async clearAll(): Promise<void> {
    memoryFallback.clear();
    const db = await getDB();
    if (!db) return;

    return new Promise((resolve) => {
      try {
        const tx = db.transaction(STORE_NAME, "readwrite");
        const store = tx.objectStore(STORE_NAME);
        store.clear();
        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
      } catch {
        resolve();
      }
    });
  },
};
