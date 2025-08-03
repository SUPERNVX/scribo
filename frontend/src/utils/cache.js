// Advanced Cache Manager for performance optimization
class CacheManager {
  constructor() {
    this.cache = new Map();
    this.ttl = 5 * 60 * 1000; // 5 minutos padrão
    this.maxSize = 100; // Máximo de 100 itens no cache
  }

  /**
   * Set item in cache with TTL
   */
  set(key, data, customTTL = null) {
    // Remove oldest items if cache is full
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: customTTL || this.ttl,
    });
  }

  /**
   * Get item from cache
   */
  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;

    // Check if item has expired
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  /**
   * Check if item exists and is valid
   */
  has(key) {
    return this.get(key) !== null;
  }

  /**
   * Remove item from cache
   */
  delete(key) {
    return this.cache.delete(key);
  }

  /**
   * Clear all cache
   */
  clear() {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      keys: Array.from(this.cache.keys()),
    };
  }

  /**
   * Clean expired items
   */
  cleanup() {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > item.ttl) {
        this.cache.delete(key);
      }
    }
  }
}

// Create singleton instances for different types of data
export const apiCache = new CacheManager();
export const userCache = new CacheManager();
export const themeCache = new CacheManager();

// Auto cleanup every 5 minutes
setInterval(
  () => {
    apiCache.cleanup();
    userCache.cleanup();
    themeCache.cleanup();
  },
  5 * 60 * 1000
);

export default CacheManager;
