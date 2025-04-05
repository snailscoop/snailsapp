import { Permit, PERMIT_TYPES } from './wallet';

interface CachedPermit {
  permit: Permit;
  timestamp: number;
  expiresAt: number;
}

const CACHE_DURATION = 60 * 60 * 1000; // 1 hour in milliseconds

class PermitCache {
  private static instance: PermitCache;
  private cache: Map<string, CachedPermit>;
  private timeoutId: number | null = null;

  private constructor() {
    this.cache = new Map();
  }

  static getInstance(): PermitCache {
    if (!PermitCache.instance) {
      PermitCache.instance = new PermitCache();
    }
    return PermitCache.instance;
  }

  getPermit(address: string, type: keyof typeof PERMIT_TYPES): Permit | null {
    const key = `${address}-${type}`;
    const cached = this.cache.get(key);
    
    if (!cached) return null;
    
    if (Date.now() > cached.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    
    return cached.permit;
  }

  setPermit(address: string, type: keyof typeof PERMIT_TYPES, permit: Permit): void {
    const key = `${address}-${type}`;
    const now = Date.now();
    
    this.cache.set(key, {
      permit,
      timestamp: now,
      expiresAt: now + CACHE_DURATION
    });

    // Start expiration timer if not already running
    if (!this.timeoutId) {
      this.startExpirationTimer();
    }
  }

  getTimeRemaining(address: string, type: keyof typeof PERMIT_TYPES): number | null {
    const key = `${address}-${type}`;
    const cached = this.cache.get(key);
    
    if (!cached) return null;
    
    const remaining = cached.expiresAt - Date.now();
    return remaining > 0 ? remaining : null;
  }

  private startExpirationTimer(): void {
    // Check for expired permits every minute
    this.timeoutId = window.setInterval(() => {
      const now = Date.now();
      for (const [key, cached] of this.cache.entries()) {
        if (now > cached.expiresAt) {
          this.cache.delete(key);
        }
      }
      
      // Stop timer if cache is empty
      if (this.cache.size === 0) {
        if (this.timeoutId) {
          clearInterval(this.timeoutId);
          this.timeoutId = null;
        }
      }
    }, 60000);
  }
}

export const permitCache = PermitCache.getInstance(); 