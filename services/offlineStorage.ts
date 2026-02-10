// services/offlineStorage.ts
// IndexedDB-based offline data persistence
// Stores API responses locally for offline access

const DB_NAME = 'prosperus-offline';
const DB_VERSION = 1;
const STORE_NAME = 'cache';

// Max age for cached data (in ms)
const MAX_CACHE_AGE = 30 * 60 * 1000; // 30 minutes

interface CacheEntry {
    key: string;
    data: unknown;
    timestamp: number;
    expiresAt: number;
}

/**
 * Open or create the IndexedDB database
 */
function openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = () => {
            const db = request.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: 'key' });
            }
        };

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

/**
 * Save data to IndexedDB cache
 */
export async function cacheData(key: string, data: unknown, ttlMs: number = MAX_CACHE_AGE): Promise<void> {
    try {
        const db = await openDB();
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);

        const entry: CacheEntry = {
            key,
            data,
            timestamp: Date.now(),
            expiresAt: Date.now() + ttlMs
        };

        store.put(entry);
        await new Promise<void>((resolve, reject) => {
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        });
    } catch (error) {
        console.warn('[OfflineStorage] Failed to cache data:', error);
    }
}

/**
 * Retrieve cached data from IndexedDB
 * Returns null if not found or expired
 */
export async function getCachedData<T = unknown>(key: string): Promise<T | null> {
    try {
        const db = await openDB();
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);

        return new Promise((resolve, reject) => {
            const request = store.get(key);
            request.onsuccess = () => {
                const entry = request.result as CacheEntry | undefined;
                if (!entry) {
                    resolve(null);
                    return;
                }

                // Check expiration
                if (Date.now() > entry.expiresAt) {
                    // Expired — remove it
                    removeCachedData(key).catch(() => { });
                    resolve(null);
                    return;
                }

                resolve(entry.data as T);
            };
            request.onerror = () => reject(request.error);
        });
    } catch (error) {
        console.warn('[OfflineStorage] Failed to retrieve cached data:', error);
        return null;
    }
}

/**
 * Remove a specific cache entry
 */
export async function removeCachedData(key: string): Promise<void> {
    try {
        const db = await openDB();
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        store.delete(key);
        await new Promise<void>((resolve, reject) => {
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        });
    } catch (error) {
        console.warn('[OfflineStorage] Failed to remove cached data:', error);
    }
}

/**
 * Clear all expired entries from the cache
 */
export async function cleanExpiredCache(): Promise<void> {
    try {
        const db = await openDB();
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const now = Date.now();

        const request = store.openCursor();
        request.onsuccess = () => {
            const cursor = request.result;
            if (cursor) {
                const entry = cursor.value as CacheEntry;
                if (now > entry.expiresAt) {
                    cursor.delete();
                }
                cursor.continue();
            }
        };

        await new Promise<void>((resolve, reject) => {
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        });
    } catch (error) {
        console.warn('[OfflineStorage] Failed to clean expired cache:', error);
    }
}

/**
 * Clear the entire offline cache
 */
export async function clearOfflineCache(): Promise<void> {
    try {
        const db = await openDB();
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        store.clear();
        await new Promise<void>((resolve, reject) => {
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        });
    } catch (error) {
        console.warn('[OfflineStorage] Failed to clear offline cache:', error);
    }
}

/**
 * Fetch with offline fallback
 * Tries network first, falls back to IndexedDB cache if offline
 */
export async function fetchWithOfflineCache<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttlMs: number = MAX_CACHE_AGE
): Promise<{ data: T; fromCache: boolean }> {
    // If online, try network first
    if (navigator.onLine) {
        try {
            const data = await fetcher();
            // Cache the result for offline use
            await cacheData(key, data, ttlMs);
            return { data, fromCache: false };
        } catch (error) {
            // Network failed even though navigator.onLine — try cache
            const cached = await getCachedData<T>(key);
            if (cached !== null) {
                return { data: cached, fromCache: true };
            }
            throw error;
        }
    }

    // If offline, use cache
    const cached = await getCachedData<T>(key);
    if (cached !== null) {
        return { data: cached, fromCache: true };
    }

    throw new Error('No cached data available and device is offline');
}
