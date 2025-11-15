import { createClient } from "redis";
export class CacheService {
    logger;
    redis = null;
    enabled = false;
    constructor(logger) {
        this.logger = logger;
        this.initialize();
    }
    initialize() {
        try {
            const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";
            this.redis = createClient({ url: redisUrl });
            this.redis.on("connect", () => {
                this.enabled = true;
                this.logger?.info?.("[chat-service] Redis connected successfully");
            });
            this.redis.on("error", (err) => {
                this.enabled = false;
                this.logger?.warn?.("[chat-service] Redis connection error - caching disabled", err);
            });
            // Connect to Redis (but don't block if it fails)
            this.redis.connect().catch((err) => {
                this.enabled = false;
                this.logger?.warn?.("[chat-service] Redis connection failed - caching disabled", err);
            });
        }
        catch (error) {
            this.logger?.warn?.("[chat-service] Redis initialization failed - caching disabled", error);
            this.enabled = false;
        }
    }
    /**
     * Get value from cache
     */
    async get(key) {
        if (!this.enabled || !this.redis) {
            return null;
        }
        try {
            const value = await this.redis.get(key);
            if (!value) {
                return null;
            }
            return JSON.parse(value);
        }
        catch (error) {
            this.logger?.warn?.("[chat-service] Cache get error", error);
            return null;
        }
    }
    /**
     * Set value in cache
     */
    async set(key, value, options) {
        if (!this.enabled || !this.redis) {
            return false;
        }
        try {
            const ttl = options?.ttl ?? 300; // Default 5 minutes
            const serialized = JSON.stringify(value);
            await this.redis.setEx(key, ttl, serialized);
            return true;
        }
        catch (error) {
            this.logger?.warn?.("[chat-service] Cache set error", error);
            return false;
        }
    }
    /**
     * Delete specific key(s) from cache
     */
    async delete(...keys) {
        if (!this.enabled || !this.redis || keys.length === 0) {
            return false;
        }
        try {
            await this.redis.del(keys);
            return true;
        }
        catch (error) {
            this.logger?.warn?.("[chat-service] Cache delete error", error);
            return false;
        }
    }
    /**
     * Delete all keys matching pattern
     * Uses SCAN instead of KEYS for better performance on large Redis instances
     */
    async deletePattern(pattern) {
        if (!this.enabled || !this.redis) {
            return false;
        }
        try {
            const keys = [];
            let cursor = 0;
            do {
                const result = await this.redis.scan(cursor, {
                    MATCH: pattern,
                    COUNT: 100,
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
        }
        catch (error) {
            this.logger?.warn?.("[chat-service] Cache delete pattern error", error);
            return false;
        }
    }
    /**
     * Delete multiple keys in batch (more efficient than multiple delete calls)
     */
    async deleteBatch(keys) {
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
        }
        catch (error) {
            this.logger?.warn?.("[chat-service] Cache delete batch error", error);
            return false;
        }
    }
    /**
     * Wrapper for cache-aside pattern
     * Tries to get from cache, if miss, calls fetcher and caches result
     */
    async getOrSet(key, fetcher, options) {
        // Try to get from cache
        const cached = await this.get(key);
        if (cached !== null) {
            this.logger?.debug?.("[chat-service] Cache hit", { key });
            return cached;
        }
        // Cache miss - fetch and cache
        this.logger?.debug?.("[chat-service] Cache miss - fetching", { key });
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
    async close() {
        if (this.redis) {
            await this.redis.quit();
            this.enabled = false;
        }
    }
    /**
     * Check if cache is available
     */
    isEnabled() {
        return this.enabled;
    }
}
// Singleton instance
let cacheInstance = null;
export const getCacheService = (logger) => {
    if (!cacheInstance) {
        cacheInstance = new CacheService(logger);
    }
    return cacheInstance;
};
