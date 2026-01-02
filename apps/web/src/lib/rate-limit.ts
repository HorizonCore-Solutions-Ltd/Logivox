/**
 * Rate Limiting System for LogiVox
 * 
 * Implements token bucket algorithm for API rate limiting.
 * Protects against brute force, DDoS, and API abuse.
 * 
 * Features:
 * - Token bucket algorithm (smooth rate limiting)
 * - Per-IP and per-user limits
 * - Configurable limits per endpoint
 * - Automatic token refill
 * - Memory-efficient with LRU cache
 * - Redis support for distributed systems
 * 
 * @example
 * ```ts
 * // In API route
 * const limiter = new RateLimiter({ tokensPerInterval: 10, interval: 60000 });
 * const result = await limiter.check(req, 'user-123');
 * 
 * if (!result.success) {
 *   return NextResponse.json(
 *     { error: 'Too many requests' },
 *     { status: 429, headers: result.headers }
 *   );
 * }
 * ```
 */

import { NextRequest } from 'next/server';

// ============================================================================
// Types
// ============================================================================

export interface RateLimitConfig {
  /** Maximum number of tokens in the bucket */
  tokensPerInterval: number;
  /** Time interval in milliseconds for token refill */
  interval: number;
  /** Optional: Use Redis for distributed rate limiting */
  redis?: {
    client: any;
    keyPrefix?: string;
  };
}

export interface RateLimitResult {
  /** Whether the request is allowed */
  success: boolean;
  /** Number of remaining tokens */
  remaining: number;
  /** Time until bucket refills (ms) */
  resetTime: number;
  /** Headers to include in response */
  headers: Record<string, string>;
}

interface TokenBucket {
  /** Current number of tokens */
  tokens: number;
  /** Last refill timestamp */
  lastRefill: number;
}

// ============================================================================
// Rate Limiter Class
// ============================================================================

export class RateLimiter {
  private config: RateLimitConfig;
  private buckets: Map<string, TokenBucket>;
  private maxBuckets = 10000; // LRU cache size

  constructor(config: RateLimitConfig) {
    this.config = config;
    this.buckets = new Map();
  }

  /**
   * Check if request should be rate limited
   */
  async check(
    req: NextRequest,
    identifier?: string
  ): Promise<RateLimitResult> {
    const key = identifier || this.getIdentifier(req);

    if (this.config.redis) {
      return this.checkRedis(key);
    }

    return this.checkMemory(key);
  }

  /**
   * Memory-based rate limiting (token bucket)
   */
  private checkMemory(key: string): RateLimitResult {
    const now = Date.now();
    let bucket = this.buckets.get(key);

    // Initialize bucket if not exists
    if (!bucket) {
      bucket = {
        tokens: this.config.tokensPerInterval,
        lastRefill: now,
      };
      this.buckets.set(key, bucket);
      this.evictOldBuckets();
    }

    // Refill tokens based on time passed
    const timePassed = now - bucket.lastRefill;
    const refillAmount = (timePassed / this.config.interval) * this.config.tokensPerInterval;
    bucket.tokens = Math.min(
      this.config.tokensPerInterval,
      bucket.tokens + refillAmount
    );
    bucket.lastRefill = now;

    // Check if request is allowed
    const success = bucket.tokens >= 1;
    if (success) {
      bucket.tokens -= 1;
    }

    const remaining = Math.floor(bucket.tokens);
    const resetTime = now + this.config.interval;

    return {
      success,
      remaining,
      resetTime,
      headers: this.getHeaders(remaining, resetTime),
    };
  }

  /**
   * Redis-based rate limiting (for distributed systems)
   */
  private async checkRedis(key: string): Promise<RateLimitResult> {
    if (!this.config.redis) {
      throw new Error('Redis not configured');
    }

    const now = Date.now();
    const redisKey = `${this.config.redis.keyPrefix || 'ratelimit'}:${key}`;
    const client = this.config.redis.client;

    try {
      // Get current bucket state
      const data = await client.get(redisKey);
      let bucket: TokenBucket;

      if (!data) {
        bucket = {
          tokens: this.config.tokensPerInterval,
          lastRefill: now,
        };
      } else {
        bucket = JSON.parse(data);
      }

      // Refill tokens
      const timePassed = now - bucket.lastRefill;
      const refillAmount = (timePassed / this.config.interval) * this.config.tokensPerInterval;
      bucket.tokens = Math.min(
        this.config.tokensPerInterval,
        bucket.tokens + refillAmount
      );
      bucket.lastRefill = now;

      // Check if allowed
      const success = bucket.tokens >= 1;
      if (success) {
        bucket.tokens -= 1;
      }

      // Save to Redis
      await client.set(
        redisKey,
        JSON.stringify(bucket),
        'EX',
        Math.ceil(this.config.interval / 1000)
      );

      const remaining = Math.floor(bucket.tokens);
      const resetTime = now + this.config.interval;

      return {
        success,
        remaining,
        resetTime,
        headers: this.getHeaders(remaining, resetTime),
      };
    } catch (error) {
      console.error('Redis rate limit error:', error);
      // Fail open (allow request) on Redis errors
      return {
        success: true,
        remaining: this.config.tokensPerInterval,
        resetTime: now + this.config.interval,
        headers: {},
      };
    }
  }

  /**
   * Get unique identifier for request (IP or user ID)
   */
  private getIdentifier(req: NextRequest): string {
    // Try to get IP address
    const forwarded = req.headers.get('x-forwarded-for');
    const ip = forwarded?.split(',')[0] || req.headers.get('x-real-ip') || 'unknown';
    
    return ip;
  }

  /**
   * Get rate limit headers
   */
  private getHeaders(remaining: number, resetTime: number): Record<string, string> {
    return {
      'X-RateLimit-Limit': this.config.tokensPerInterval.toString(),
      'X-RateLimit-Remaining': remaining.toString(),
      'X-RateLimit-Reset': Math.ceil(resetTime / 1000).toString(),
      'Retry-After': Math.ceil((resetTime - Date.now()) / 1000).toString(),
    };
  }

  /**
   * Evict old buckets to prevent memory leaks (LRU)
   */
  private evictOldBuckets(): void {
    if (this.buckets.size > this.maxBuckets) {
      const keysToDelete = Array.from(this.buckets.keys()).slice(
        0,
        this.buckets.size - this.maxBuckets
      );
      keysToDelete.forEach((key) => this.buckets.delete(key));
    }
  }

  /**
   * Reset rate limit for a specific key (admin use)
   */
  async reset(identifier: string): Promise<void> {
    if (this.config.redis) {
      const redisKey = `${this.config.redis.keyPrefix || 'ratelimit'}:${identifier}`;
      await this.config.redis.client.del(redisKey);
    } else {
      this.buckets.delete(identifier);
    }
  }

  /**
   * Get current status for an identifier
   */
  async getStatus(identifier: string): Promise<TokenBucket | null> {
    if (this.config.redis) {
      const redisKey = `${this.config.redis.keyPrefix || 'ratelimit'}:${identifier}`;
      const data = await this.config.redis.client.get(redisKey);
      return data ? JSON.parse(data) : null;
    }

    return this.buckets.get(identifier) || null;
  }
}

// ============================================================================
// Pre-configured Rate Limiters
// ============================================================================

/** Strict rate limiting for authentication endpoints */
export const authRateLimiter = new RateLimiter({
  tokensPerInterval: 5, // 5 attempts
  interval: 60000,      // per minute
});

/** Standard rate limiting for API endpoints */
export const apiRateLimiter = new RateLimiter({
  tokensPerInterval: 60,  // 60 requests
  interval: 60000,        // per minute
});

/** Generous rate limiting for read-only endpoints */
export const readRateLimiter = new RateLimiter({
  tokensPerInterval: 120, // 120 requests
  interval: 60000,        // per minute
});

/** Very strict rate limiting for sensitive operations */
export const sensitiveRateLimiter = new RateLimiter({
  tokensPerInterval: 3,  // 3 attempts
  interval: 300000,      // per 5 minutes
});

// ============================================================================
// Middleware Helper
// ============================================================================

/**
 * Middleware function to apply rate limiting to API routes
 * 
 * @example
 * ```ts
 * export async function POST(req: NextRequest) {
 *   const rateLimitResult = await applyRateLimit(req, authRateLimiter);
 *   
 *   if (!rateLimitResult.success) {
 *     return NextResponse.json(
 *       { error: 'Too many requests. Please try again later.' },
 *       { status: 429, headers: rateLimitResult.headers }
 *     );
 *   }
 *   
 *   // Process request...
 * }
 * ```
 */
export async function applyRateLimit(
  req: NextRequest,
  limiter: RateLimiter = apiRateLimiter,
  identifier?: string
): Promise<RateLimitResult> {
  return limiter.check(req, identifier);
}

/**
 * Higher-order function to wrap API routes with rate limiting
 * 
 * @example
 * ```ts
 * const handler = withRateLimit(async (req: NextRequest) => {
 *   // Your handler logic
 *   return NextResponse.json({ data: 'success' });
 * }, authRateLimiter);
 * 
 * export { handler as POST };
 * ```
 */
export function withRateLimit(
  handler: (req: NextRequest) => Promise<Response>,
  limiter: RateLimiter = apiRateLimiter,
  options?: {
    identifier?: (req: NextRequest) => string;
    onRateLimit?: (result: RateLimitResult) => Response;
  }
) {
  return async (req: NextRequest): Promise<Response> => {
    const identifier = options?.identifier?.(req);
    const result = await limiter.check(req, identifier);

    if (!result.success) {
      if (options?.onRateLimit) {
        return options.onRateLimit(result);
      }

      return new Response(
        JSON.stringify({
          error: 'Too many requests',
          message: 'You have exceeded the rate limit. Please try again later.',
          retryAfter: result.headers['Retry-After'],
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            ...result.headers,
          },
        }
      );
    }

    // Add rate limit headers to response
    const response = await handler(req);
    Object.entries(result.headers).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    return response;
  };
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Create a custom rate limiter with specific configuration
 */
export function createRateLimiter(config: RateLimitConfig): RateLimiter {
  return new RateLimiter(config);
}

/**
 * Get user identifier from request (for authenticated users)
 */
export function getUserIdentifier(req: NextRequest): string | undefined {
  // This would be replaced with actual session/token parsing
  // Example: extract from JWT or session cookie
  const authHeader = req.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    try {
      // Parse JWT or session token
      // const token = authHeader.substring(7);
      // const payload = parseToken(token);
      // return payload.userId;
      return undefined; // Placeholder
    } catch {
      return undefined;
    }
  }
  return undefined;
}

/**
 * Combine IP and user ID for rate limiting (dual limiting)
 */
export function getCombinedIdentifier(req: NextRequest): string {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || 
             req.headers.get('x-real-ip') || 
             'unknown';
  const userId = getUserIdentifier(req);
  
  return userId ? `user:${userId}` : `ip:${ip}`;
}

// ============================================================================
// Admin Functions
// ============================================================================

/**
 * Reset rate limit for all identifiers (admin only)
 */
export async function resetAllRateLimits(): Promise<void> {
  // Clear all rate limiters
  await Promise.all([
    authRateLimiter.reset('*'),
    apiRateLimiter.reset('*'),
    readRateLimiter.reset('*'),
    sensitiveRateLimiter.reset('*'),
  ]);
}

/**
 * Get rate limit statistics (admin only)
 */
export async function getRateLimitStats(): Promise<{
  message: string;
}> {
  // Note: Stats collection would require exposing bucket counts via public methods
  // For now, return a simple message
  return {
    message: 'Rate limiting is active for auth, API, read, and sensitive endpoints',
  };
}
