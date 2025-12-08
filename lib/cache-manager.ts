/**
 * Cache Manager
 * Provides multi-layer caching mechanism: memory cache + Redis cache
 */

export interface CacheOptions {
  ttl?: number // Cache time (seconds)
  keyPrefix?: string // Key prefix
  useMemoryCache?: boolean // Whether to use memory cache
  useRedisCache?: boolean // Whether to use Redis cache
}

export interface CacheResult<T> {
  data: T | null
  fromCache: boolean
  cacheType?: 'memory' | 'redis'
}

/**
 * Memory Cache Implementation
 */
class MemoryCache {
  private cache = new Map<string, { data: any; expiresAt: number }>()
  private cleanupInterval: NodeJS.Timeout | null = null

  constructor() {
    // Periodically clean up expired cache
    this.cleanupInterval = setInterval(() => {
      this.cleanup()
    }, 60000) // Clean up every minute
  }

  get<T>(key: string): T | null {
    const item = this.cache.get(key)
    if (!item) return null

    if (Date.now() > item.expiresAt) {
      this.cache.delete(key)
      return null
    }

    return item.data
  }

  set(key: string, data: any, ttl: number): void {
    const expiresAt = Date.now() + ttl * 1000
    this.cache.set(key, { data, expiresAt })
  }

  delete(key: string): void {
    this.cache.delete(key)
  }

  clear(): void {
    this.cache.clear()
  }

  private cleanup(): void {
    const now = Date.now()
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiresAt) {
        this.cache.delete(key)
      }
    }
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
      this.cleanupInterval = null
    }
    this.clear()
  }
}

/**
 * Cache Manager
 */
export class CacheManager {
  private static instance: CacheManager
  private memoryCache: MemoryCache
  private defaultOptions: CacheOptions = {
    ttl: 300, // Default 5 minutes
    keyPrefix: 'sovd:',
    useMemoryCache: true,
    useRedisCache: false // Redis is not used for now, can be extended later
  }

  private constructor() {
    this.memoryCache = new MemoryCache()
  }

  static getInstance(): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager()
    }
    return CacheManager.instance
  }

  /**
   * Get cached data
   */
  async get<T>(key: string, options: CacheOptions = {}): Promise<CacheResult<T>> {
    const opts = { ...this.defaultOptions, ...options }
    const fullKey = opts.keyPrefix + key

    // Check memory cache first
    if (opts.useMemoryCache) {
      const memoryData = this.memoryCache.get<T>(fullKey)
      if (memoryData !== null) {
        return {
          data: memoryData,
          fromCache: true,
          cacheType: 'memory'
        }
      }
    }

    // TODO: Check Redis cache
    if (opts.useRedisCache) {
      // Redis cache logic to be implemented
    }

    return {
      data: null,
      fromCache: false
    }
  }

  /**
   * Set cached data
   */
  async set(key: string, data: any, options: CacheOptions = {}): Promise<void> {
    const opts = { ...this.defaultOptions, ...options }
    const fullKey = opts.keyPrefix + key

    // Set memory cache
    if (opts.useMemoryCache) {
      this.memoryCache.set(fullKey, data, opts.ttl || 300)
    }

    // TODO: Set Redis cache
    if (opts.useRedisCache) {
      // Redis cache logic to be implemented
    }
  }

  /**
   * Delete cache
   */
  async delete(key: string, options: CacheOptions = {}): Promise<void> {
    const opts = { ...this.defaultOptions, ...options }
    const fullKey = opts.keyPrefix + key

    // Delete memory cache
    if (opts.useMemoryCache) {
      this.memoryCache.delete(fullKey)
    }

    // TODO: Delete Redis cache
    if (opts.useRedisCache) {
      // Redis cache logic to be implemented
    }
  }

  /**
   * Clear cache
   */
  async clear(options: CacheOptions = {}): Promise<void> {
    const opts = { ...this.defaultOptions, ...options }

    // Clear memory cache
    if (opts.useMemoryCache) {
      this.memoryCache.clear()
    }

    // TODO: Clear Redis cache
    if (opts.useRedisCache) {
      // Redis cache logic to be implemented
    }
  }

  /**
   * Get or set cache (atomic operation)
   */
  async getOrSet<T>(
    key: string,
    fetcher: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<T> {
    // Try to get from cache first
    const cached = await this.get<T>(key, options)
    if (cached.fromCache && cached.data !== null) {
      return cached.data
    }

    // Fetch new data
    const data = await fetcher()

    // Set cache
    await this.set(key, data, options)

    return data
  }

  /**
   * Batch get cache
   */
  async getMany<T>(keys: string[], options: CacheOptions = {}): Promise<CacheResult<T>[]> {
    const results: CacheResult<T>[] = []
    
    for (const key of keys) {
      const result = await this.get<T>(key, options)
      results.push(result)
    }

    return results
  }

  /**
   * Batch set cache
   */
  async setMany(entries: Array<{ key: string; data: any }>, options: CacheOptions = {}): Promise<void> {
    for (const entry of entries) {
      await this.set(entry.key, entry.data, options)
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    memoryCacheSize: number
    uptime: number
  } {
    return {
      memoryCacheSize: this.memoryCache['cache'].size,
      uptime: process.uptime()
    }
  }

  /**
   * Destroy cache manager
   */
  destroy(): void {
    this.memoryCache.destroy()
  }
}

// Create a singleton instance
export const cacheManager = CacheManager.getInstance()

// For ease of use, export some shortcut functions
export async function getCache<T>(key: string, options?: CacheOptions): Promise<CacheResult<T>> {
  return cacheManager.get<T>(key, options)
}

export async function setCache(key: string, data: any, options?: CacheOptions): Promise<void> {
  return cacheManager.set(key, data, options)
}

export async function deleteCache(key: string, options?: CacheOptions): Promise<void> {
  return cacheManager.delete(key, options)
}

export async function getOrSetCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  options?: CacheOptions
): Promise<T> {
  return cacheManager.getOrSet<T>(key, fetcher, options)
}