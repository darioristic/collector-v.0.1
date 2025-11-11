import Redis from 'ioredis';
import type { FastifyInstance } from 'fastify';

export interface CacheOptions {
  ttl?: number; // Time to live in seconds (default: 300 = 5 minutes)
}

export class CacheService {
  private redis: Redis | null = null;
  private enabled: boolean = false;

  constructor(private logger?: FastifyInstance['log']) {
    this.initialize();
  }

  private initialize() {
    try {
      const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

      this.redis = new Redis(redisUrl, {
        maxRetriesPerRequest: 3,
        retryStrategy(times) {
          const delay = Math.min(times * 50, 2000);
          return delay;
        },
        reconnectOnError(err) {
          const targetErrors = ['READONLY', 'ECONNREFUSED'];
          return targetErrors.some(targetError => err.message.includes(targetError));
        }
      });

      this.redis.on('connect', () => {
        this.enabled = true;
        this.logger?.info('Redis connected successfully');
      });

      this.redis.on('error', (err) => {
        this.enabled = false;
        this.logger?.warn({ err }, 'Redis connection error - caching disabled');
      });

    } catch (error) {
      this.logger?.warn({ error }, 'Redis initialization failed - caching disabled');
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
      this.logger?.warn({ error, key }, 'Cache get error');
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

      await this.redis.setex(key, ttl, serialized);
      return true;
    } catch (error) {
      this.logger?.warn({ error, key }, 'Cache set error');
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
      await this.redis.del(...keys);
      return true;
    } catch (error) {
      this.logger?.warn({ error, keys }, 'Cache delete error');
      return false;
    }
  }

  /**
   * Delete all keys matching pattern
   */
  async deletePattern(pattern: string): Promise<boolean> {
    if (!this.enabled || !this.redis) {
      return false;
    }

    try {
      const keys = await this.redis.keys(pattern);
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
      return true;
    } catch (error) {
      this.logger?.warn({ error, pattern }, 'Cache delete pattern error');
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
      this.logger?.debug({ key }, 'Cache hit');
      return cached;
    }

    // Cache miss - fetch and cache
    this.logger?.debug({ key }, 'Cache miss - fetching');
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

export const getCacheService = (logger?: FastifyInstance['log']): CacheService => {
  if (!cacheInstance) {
    cacheInstance = new CacheService(logger);
  }
  return cacheInstance;
};

// Fastify plugin
import fp from 'fastify-plugin';

export const cachePlugin = fp(async (fastify: FastifyInstance) => {
  const cache = getCacheService(fastify.log);

  fastify.decorate('cache', cache);
  fastify.decorateRequest('cache', {
    getter() {
      return cache;
    }
  });

  fastify.addHook('onClose', async () => {
    await cache.close();
  });
}, {
  name: 'cache-plugin',
  fastify: '4.x'
});

// TypeScript declarations
declare module 'fastify' {
  interface FastifyInstance {
    cache: CacheService;
  }

  interface FastifyRequest {
    cache: CacheService;
  }
}