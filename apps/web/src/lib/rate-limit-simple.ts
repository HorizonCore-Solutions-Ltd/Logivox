import { NextRequest } from "next/server";

type Options = {
  uniqueTokenPerInterval?: number;
  interval?: number;
};

interface TokenData {
  count: number;
  resetTime: number;
}

// Simple in-memory cache implementation
class SimpleCache {
  private cache: Map<string, TokenData> = new Map();
  private maxSize: number;
  private ttl: number;

  constructor(maxSize = 500, ttl = 60000) {
    this.maxSize = maxSize;
    this.ttl = ttl;
  }

  get(key: string): TokenData | undefined {
    const item = this.cache.get(key);
    if (!item) return undefined;

    if (Date.now() > item.resetTime) {
      this.cache.delete(key);
      return undefined;
    }

    return item;
  }

  set(key: string, value: TokenData): void {
    // Simple cleanup if cache gets too large
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }

    this.cache.set(key, value);
  }

  cleanup(): void {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (now > value.resetTime) {
        this.cache.delete(key);
      }
    }
  }
}

export default function rateLimit(options?: Options) {
  const tokenCache = new SimpleCache(
    options?.uniqueTokenPerInterval || 500,
    options?.interval || 60000,
  );

  // Cleanup expired entries periodically
  setInterval(() => {
    tokenCache.cleanup();
  }, 60000); // Cleanup every minute

  return {
    check: (request: NextRequest, limit: number, token?: string) =>
      new Promise<void>((resolve, reject) => {
        const tokenIdentifier = token || getIP(request) || "anonymous";
        const now = Date.now();
        const windowDuration = options?.interval || 60000;

        let tokenData = tokenCache.get(tokenIdentifier);

        if (!tokenData || now > tokenData.resetTime) {
          // Reset or initialize
          tokenData = {
            count: 1,
            resetTime: now + windowDuration,
          };
          tokenCache.set(tokenIdentifier, tokenData);
          resolve();
          return;
        }

        tokenData.count += 1;

        if (tokenData.count > limit) {
          reject(new Error("Rate limit exceeded"));
        } else {
          tokenCache.set(tokenIdentifier, tokenData);
          resolve();
        }
      }),
  };
}

function getIP(request: NextRequest): string | null {
  const xff = request.headers.get("x-forwarded-for");
  return xff ? xff.split(",")[0] : null;
}
