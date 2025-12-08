/**
 * SHARED CACHE UTILITIES
 * ======================
 * TTL-based cache with automatic eviction and cleanup for AI Brain services.
 */

export interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

export class TTLCache<K, V> {
  private cache: Map<K, CacheEntry<V>> = new Map();
  private timers: Map<K, NodeJS.Timeout> = new Map();
  private cleanupInterval: NodeJS.Timeout | null = null;
  
  constructor(
    private readonly defaultTTL: number = 10 * 60 * 1000,
    private readonly maxSize: number = 100,
    private readonly cleanupFrequency: number = 5 * 60 * 1000
  ) {
    this.startCleanup();
  }

  private startCleanup(): void {
    if (this.cleanupInterval) return;
    this.cleanupInterval = setInterval(() => this.evictExpired(), this.cleanupFrequency);
    if (this.cleanupInterval.unref) this.cleanupInterval.unref();
  }

  private evictExpired(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now >= entry.expiresAt) {
        this.delete(key);
      }
    }
    this.enforceMaxSize();
  }

  private enforceMaxSize(): void {
    if (this.cache.size <= this.maxSize) return;
    
    const entries = Array.from(this.cache.entries())
      .sort((a, b) => a[1].expiresAt - b[1].expiresAt);
    
    const toRemove = entries.slice(0, entries.length - this.maxSize);
    for (const [key] of toRemove) {
      this.delete(key);
    }
  }

  set(key: K, value: V, ttl: number = this.defaultTTL): void {
    const existingTimer = this.timers.get(key);
    if (existingTimer) clearTimeout(existingTimer);
    
    this.cache.set(key, { value, expiresAt: Date.now() + ttl });
    
    const timer = setTimeout(() => this.delete(key), ttl);
    if (timer.unref) timer.unref();
    this.timers.set(key, timer);
    
    this.enforceMaxSize();
  }

  get(key: K): V | undefined {
    const entry = this.cache.get(key);
    if (!entry) return undefined;
    if (Date.now() >= entry.expiresAt) {
      this.delete(key);
      return undefined;
    }
    return entry.value;
  }

  has(key: K): boolean {
    return this.get(key) !== undefined;
  }

  delete(key: K): boolean {
    const timer = this.timers.get(key);
    if (timer) clearTimeout(timer);
    this.timers.delete(key);
    return this.cache.delete(key);
  }

  clear(): void {
    for (const timer of this.timers.values()) clearTimeout(timer);
    this.timers.clear();
    this.cache.clear();
  }

  get size(): number {
    return this.cache.size;
  }

  *entries(): IterableIterator<[K, V]> {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now < entry.expiresAt) {
        yield [key, entry.value];
      }
    }
  }

  values(): V[] {
    const now = Date.now();
    return Array.from(this.cache.values())
      .filter(entry => now < entry.expiresAt)
      .map(entry => entry.value);
  }

  shutdown(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.clear();
  }
}

export const createTTLCache = <K, V>(
  defaultTTL?: number,
  maxSize?: number,
  cleanupFrequency?: number
): TTLCache<K, V> => new TTLCache<K, V>(defaultTTL, maxSize, cleanupFrequency);
