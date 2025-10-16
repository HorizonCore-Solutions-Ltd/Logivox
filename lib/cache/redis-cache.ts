/**
 * Redis Cache Manager
 * Centralized caching layer for improved performance
 */

import { Redis } from '@upstash/redis';

// Initialize Redis client
const redis = process.env.UPSTASH_REDIS_REST_URL
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
    })
  : null;

/**
 * Cache key prefixes for different data types
 */
export const CachePrefix = {
  USER: 'user:',
  INVENTORY: 'inventory:',
  ORDER: 'order:',
  WAREHOUSE: 'warehouse:',
  PRODUCT: 'product:',
  CUSTOMER: 'customer:',
  SUPPLIER: 'supplier:',
  STATS: 'stats:',
  REPORT: 'report:',
  SETTINGS: 'settings:',
  SESSION: 'session:',
} as const;

/**
 * Cache TTL (Time To Live) in seconds
 */
export const CacheTTL = {
  SHORT: 60, // 1 minute
  MEDIUM: 300, // 5 minutes
  LONG: 3600, // 1 hour
  VERY_LONG: 86400, // 24 hours
  WEEK: 604800, // 7 days
} as const;

/**
 * Cache Manager Class
 */
export class CacheManager {
  private static instance: CacheManager;
  private redis: Redis | null;
  private memoryCache: Map<string, { value: any; expiry: number }>;

  private constructor() {
    this.redis = redis;
    this.memoryCache = new Map();
  }

  static getInstance(): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager();
    }
    return CacheManager.instance;
  }

  /**
   * Get value from cache
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      // Try Redis first
      if (this.redis) {
        const value = await this.redis.get<T>(key);
        return value;
      }

      // Fallback to memory cache
      const cached = this.memoryCache.get(key);
      if (cached) {
        if (Date.now() < cached.expiry) {
          return cached.value as T;
        }
        this.memoryCache.delete(key);
      }

      return null;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  /**
   * Set value in cache with TTL
   */
  async set(key: string, value: any, ttl: number = CacheTTL.MEDIUM): Promise<void> {
    try {
      // Set in Redis
      if (this.redis) {
        await this.redis.setex(key, ttl, JSON.stringify(value));
      }

      // Also set in memory cache as backup
      this.memoryCache.set(key, {
        value,
        expiry: Date.now() + ttl * 1000,
      });
    } catch (error) {
      console.error('Cache set error:', error);
    }
  }

  /**
   * Delete value from cache
   */
  async delete(key: string): Promise<void> {
    try {
      if (this.redis) {
        await this.redis.del(key);
      }
      this.memoryCache.delete(key);
    } catch (error) {
      console.error('Cache delete error:', error);
    }
  }

  /**
   * Delete all keys matching pattern
   */
  async deletePattern(pattern: string): Promise<void> {
    try {
      if (this.redis) {
        const keys = await this.redis.keys(pattern);
        if (keys.length > 0) {
          await this.redis.del(...keys);
        }
      }

      // Clear matching keys from memory cache
      for (const key of this.memoryCache.keys()) {
        if (key.includes(pattern.replace('*', ''))) {
          this.memoryCache.delete(key);
        }
      }
    } catch (error) {
      console.error('Cache delete pattern error:', error);
    }
  }

  /**
   * Check if key exists in cache
   */
  async exists(key: string): Promise<boolean> {
    try {
      if (this.redis) {
        const exists = await this.redis.exists(key);
        return exists === 1;
      }

      const cached = this.memoryCache.get(key);
      return cached !== undefined && Date.now() < cached.expiry;
    } catch (error) {
      console.error('Cache exists error:', error);
      return false;
    }
  }

  /**
   * Get or set pattern - fetch from cache or compute and cache
   */
  async getOrSet<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttl: number = CacheTTL.MEDIUM
  ): Promise<T> {
    // Try to get from cache
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    // Fetch and cache
    const value = await fetchFn();
    await this.set(key, value, ttl);
    return value;
  }

  /**
   * Clear all cache
   */
  async clear(): Promise<void> {
    try {
      if (this.redis) {
        await this.redis.flushdb();
      }
      this.memoryCache.clear();
    } catch (error) {
      console.error('Cache clear error:', error);
    }
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<{
    redisConnected: boolean;
    memoryKeys: number;
  }> {
    return {
      redisConnected: this.redis !== null,
      memoryKeys: this.memoryCache.size,
    };
  }
}

/**
 * Convenience functions
 */
export const cache = CacheManager.getInstance();

export async function getCached<T>(key: string): Promise<T | null> {
  return cache.get<T>(key);
}

export async function setCached(key: string, value: any, ttl?: number): Promise<void> {
  return cache.set(key, value, ttl);
}

export async function deleteCached(key: string): Promise<void> {
  return cache.delete(key);
}

export async function invalidateCache(pattern: string): Promise<void> {
  return cache.deletePattern(pattern);
}

/**
 * Cache invalidation helpers
 */
export async function invalidateUserCache(userId: string): Promise<void> {
  await invalidateCache(`${CachePrefix.USER}${userId}*`);
}

export async function invalidateInventoryCache(inventoryId?: string): Promise<void> {
  if (inventoryId) {
    await invalidateCache(`${CachePrefix.INVENTORY}${inventoryId}*`);
  } else {
    await invalidateCache(`${CachePrefix.INVENTORY}*`);
  }
}

export async function invalidateOrderCache(orderId?: string): Promise<void> {
  if (orderId) {
    await invalidateCache(`${CachePrefix.ORDER}${orderId}*`);
  } else {
    await invalidateCache(`${CachePrefix.ORDER}*`);
  }
}

export async function invalidateWarehouseCache(warehouseId?: string): Promise<void> {
  if (warehouseId) {
    await invalidateCache(`${CachePrefix.WAREHOUSE}${warehouseId}*`);
  } else {
    await invalidateCache(`${CachePrefix.WAREHOUSE}*`);
  }
}

export async function invalidateStatsCache(): Promise<void> {
  await invalidateCache(`${CachePrefix.STATS}*`);
}

/**
 * Decorator for caching function results
 */
export function Cached(prefix: string, ttl: number = CacheTTL.MEDIUM) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const cacheKey = `${prefix}:${propertyKey}:${JSON.stringify(args)}`;
      
      const cached = await getCached(cacheKey);
      if (cached !== null) {
        return cached;
      }

      const result = await originalMethod.apply(this, args);
      await setCached(cacheKey, result, ttl);
      return result;
    };

    return descriptor;
  };
}
