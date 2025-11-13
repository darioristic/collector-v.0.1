import { createClient, type RedisClientType } from "redis";

export interface CacheOptions {
  ttl?: number; // Time to live in seconds (default: 300 = 5 minutes)
}

export class CacheService {
  private redis: RedisClientType | null = null;
  private enabled: boolean = false;

  constructor(private logger?: { info?: (msg: string) => void; warn?: (msg: string, err?: unknown) => void; debug?: (msg: string, meta?: unknown) => void }) {
    this.initialize();
  }

  private initialize() {
    try {
      const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";

      this.redis = createClient({ url: redisUrl }) as RedisClientType;

      this.redis.on("connect", () => {
        this.enabled = true;
        this.logger?.info?.("[notification-service] Redis connected successfully");
      });

      this.redis.on("error", (err) => {
        this.enabled = false;
        this.logger?.warn?.("[notification-service] Redis connection error - caching disabled", err);
      });

      // Connect to Redis (but don't block if it fails)
      this.redis.connect().catch((err) => {
        this.enabled = false;
        this.logger?.warn?.("[notification-service] Redis connection failed - caching disabled", err);
      });
    } catch (error) {
      this.logger?.warn?.("[notification-service] Redis initialization failed - caching disabled", error);
      this.enabled = false;
    }
  }

  /**
   * Get value from cache
   */
  async get<T>(key: string): Promise<T | null> {
    if (!this.enabled || !this.redis) {
      return null;
    }

    try {
      const value = await this.redis.get(key);
      if (!value) {
        return null;
      }
      return JSON.parse(value) as T;
    } catch (error) {
      this.logger?.warn?.("[notification-service] Cache get error", error);
      return null;
    }
  }

  /**
   * Set value in cache
   */
  async set(key: string, value: unknown, options?: CacheOptions): Promise<boolean> {
    if (!this.enabled || !this.redis) {
      return false;
    }

    try {
      const ttl = options?.ttl ?? 300; // Default 5 minutes
      const serialized = JSON.stringify(value);

      await this.redis.setEx(key, ttl, serialized);
      return true;
    } catch (error) {
      this.logger?.warn?.("[notification-service] Cache set error", error);
      return false;
    }
  }

  /**
   * Delete specific key(s) from cache
   */
  async delete(...keys: string[]): Promise<boolean> {
    if (!this.enabled || !this.redis || keys.length === 0) {
      return false;
    }

    try {
      await this.redis.del(keys);
      return true;
    } catch (error) {
      this.logger?.warn?.("[notification-service] Cache delete error", error);
      return false;
    }
  }

  /**
   * Delete all keys matching pattern
   * Uses SCAN instead of KEYS for better performance on large Redis instances
   */
  async deletePattern(pattern: string): Promise<boolean> {
    if (!this.enabled || !this.redis) {
      return false;
    }

    try {
      const keys: string[] = [];
      let cursor = 0;

      do {
        const result = await this.redis.scan(cursor, {
          MATCH: pattern,
          COUNT: 100
        });
        cursor = result.cursor;
        keys.push(...result.keys);
      } while (cursor !== 0);

      // Delete in batches to avoid overwhelming Redis
      if (keys.length > 0) {
        const batchSize = 100;
        for (let i = 0; i < keys.length; i += batchSize) {
          const batch = keys.slice(i, i + batchSize);
          await this.redis.del(batch);
        }
      }
      return true;
    } catch (error) {
      this.logger?.warn?.("[notification-service] Cache delete pattern error", error);
      return false;
    }
  }

  /**
   * Delete multiple keys in batch (more efficient than multiple delete calls)
   */
  async deleteBatch(keys: string[]): Promise<boolean> {
    if (!this.enabled || !this.redis || keys.length === 0) {
      return false;
    }

    try {
      // Delete in batches to avoid overwhelming Redis
      const batchSize = 100;
      for (let i = 0; i < keys.length; i += batchSize) {
        const batch = keys.slice(i, i + batchSize);
        await this.redis.del(batch);
      }
      return true;
    } catch (error) {
      this.logger?.warn?.("[notification-service] Cache delete batch error", error);
      return false;
    }
  }

  /**
   * Wrapper for cache-aside pattern
   * Tries to get from cache, if miss, calls fetcher and caches result
   */
  async getOrSet<T>(
    key: string,
    fetcher: () => Promise<T>,
    options?: CacheOptions
  ): Promise<T> {
    // Try to get from cache
    const cached = await this.get<T>(key);
    if (cached !== null) {
      this.logger?.debug?.("[notification-service] Cache hit", { key });
      return cached;
    }

    // Cache miss - fetch and cache
    this.logger?.debug?.("[notification-service] Cache miss - fetching", { key });
    const value = await fetcher();

    // Don't cache null/undefined values
    if (value !== null && value !== undefined) {
      await this.set(key, value, options);
    }

    return value;
  }

  /**
   * Close Redis connection
   */
  async close(): Promise<void> {
    if (this.redis) {
      await this.redis.quit();
      this.enabled = false;
    }
  }

  /**
   * Check if cache is available
   */
  isEnabled(): boolean {
    return this.enabled;
  }
}

// Singleton instance
let cacheInstance: CacheService | null = null;

export const getCacheService = (logger?: { info?: (msg: string) => void; warn?: (msg: string, err?: unknown) => void; debug?: (msg: string, meta?: unknown) => void }): CacheService => {
  if (!cacheInstance) {
    cacheInstance = new CacheService(logger);
  }
  return cacheInstance;
};

