/**
 * API Cache Manager
 * Provides client-side caching for API responses
 */

export class CacheManager {
  private cache = new Map<string, { data: any; expires: number }>();
  private maxSize = 100; // Maximum number of cached items

  set(key: string, data: any, ttl: number = 300000): void {
    // Default TTL: 5 minutes
    if (this.cache.size >= this.maxSize) {
      // Remove oldest entry
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    this.cache.set(key, {
      data,
      expires: Date.now() + ttl
    });
  }

  get(key: string): any | null {
    const cached = this.cache.get(key);
    
    if (!cached) {
      return null;
    }

    if (Date.now() > cached.expires) {
      // Expired, remove it
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  has(key: string): boolean {
    const cached = this.cache.get(key);
    if (!cached) return false;
    
    if (Date.now() > cached.expires) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }

  invalidate(pattern?: string): void {
    if (!pattern) {
      this.cache.clear();
      return;
    }

    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }

  clear(): void {
    this.cache.clear();
  }

  getStats(): { size: number; maxSize: number } {
    return {
      size: this.cache.size,
      maxSize: this.maxSize
    };
  }
}

export const cacheManager = new CacheManager();

