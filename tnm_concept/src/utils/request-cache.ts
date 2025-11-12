/**
 * Request Cache Utility
 * Implements intelligent caching with TTL and invalidation
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

class RequestCache {
  private cache = new Map<string, CacheEntry<any>>();
  private readonly maxSize = 100; // Limit cache size to prevent memory issues

  /**
   * Get cached data or fetch new data
   * @param key - Cache key
   * @param fetcher - Function to fetch data if not cached
   * @param ttl - Time to live in milliseconds (default: 5 minutes)
   */
  async get<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl: number = 5 * 60 * 1000
  ): Promise<T> {
    const cached = this.cache.get(key);
    const now = Date.now();

    // Return cached data if still valid
    if (cached && now < cached.expiresAt) {
      console.log(`[CACHE HIT] ${key}`);
      return cached.data as T;
    }

    // Fetch new data
    console.log(`[CACHE MISS] ${key}`);
    const data = await fetcher();

    // Store in cache
    this.cache.set(key, {
      data,
      timestamp: now,
      expiresAt: now + ttl
    });

    // Enforce max cache size (LRU eviction)
    if (this.cache.size > this.maxSize) {
      const oldestKey = this.findOldestKey();
      if (oldestKey) {
        this.cache.delete(oldestKey);
        console.log(`[CACHE EVICT] ${oldestKey}`);
      }
    }

    return data;
  }

  /**
   * Invalidate cache entries matching a pattern
   */
  invalidate(keyPattern: string | RegExp) {
    const pattern = typeof keyPattern === 'string' 
      ? new RegExp(keyPattern) 
      : keyPattern;

    let count = 0;
    for (const key of this.cache.keys()) {
      if (pattern.test(key)) {
        this.cache.delete(key);
        count++;
      }
    }

    if (count > 0) {
      console.log(`[CACHE INVALIDATE] Removed ${count} entries matching pattern`);
    }
  }

  /**
   * Clear all cache entries
   */
  clear() {
    const size = this.cache.size;
    this.cache.clear();
    console.log(`[CACHE CLEAR] Removed ${size} entries`);
  }

  /**
   * Get cache statistics
   */
  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      keys: Array.from(this.cache.keys())
    };
  }

  /**
   * Find the oldest entry for LRU eviction
   */
  private findOldestKey(): string | null {
    let oldestKey: string | null = null;
    let oldestTime = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (entry.timestamp < oldestTime) {
        oldestTime = entry.timestamp;
        oldestKey = key;
      }
    }

    return oldestKey;
  }

  /**
   * Remove expired entries
   */
  cleanup() {
    const now = Date.now();
    let count = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now >= entry.expiresAt) {
        this.cache.delete(key);
        count++;
      }
    }

    if (count > 0) {
      console.log(`[CACHE CLEANUP] Removed ${count} expired entries`);
    }
  }
}

// Export singleton instance
export const requestCache = new RequestCache();

// Auto-cleanup expired entries every 5 minutes
if (typeof window !== 'undefined') {
  setInterval(() => {
    requestCache.cleanup();
  }, 5 * 60 * 1000);
}
