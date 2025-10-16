/**
 * Rate Limiting Middleware
 * Protects against brute force attacks and API abuse
 */

import { NextRequest, NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

// Initialize Redis client for distributed rate limiting
const redis = process.env.UPSTASH_REDIS_REST_URL
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
  : null;

// In-memory fallback for development
const memoryStore = new Map<string, { count: number; resetAt: number }>();

export interface RateLimitConfig {
  /**
   * Maximum number of requests allowed in the time window
   */
  maxRequests: number;

  /**
   * Time window in seconds
   */
  windowSeconds: number;

  /**
   * Custom identifier function (defaults to IP address)
   */
  identifier?: (req: NextRequest) => string;

  /**
   * Skip rate limiting based on condition
   */
  skip?: (req: NextRequest) => boolean;

  /**
   * Custom error message
   */
  message?: string;
}

/**
 * Default rate limit configurations for different endpoint types
 */
export const RateLimitPresets = {
  /**
   * Strict limit for authentication endpoints
   * 5 requests per 15 minutes
   */
  AUTH: {
    maxRequests: 5,
    windowSeconds: 900, // 15 minutes
    message: 'Too many authentication attempts. Please try again later.',
  },

  /**
   * Standard API limit
   * 100 requests per minute
   */
  API: {
    maxRequests: 100,
    windowSeconds: 60,
    message: 'Too many requests. Please slow down.',
  },

  /**
   * Lenient limit for reads
   * 300 requests per minute
   */
  READ: {
    maxRequests: 300,
    windowSeconds: 60,
  },

  /**
   * Moderate limit for writes
   * 50 requests per minute
   */
  WRITE: {
    maxRequests: 50,
    windowSeconds: 60,
  },

  /**
   * Very strict for password reset
   * 3 requests per hour
   */
  PASSWORD_RESET: {
    maxRequests: 3,
    windowSeconds: 3600, // 1 hour
    message: 'Too many password reset attempts. Please try again later.',
  },
} as const;

/**
 * Get client identifier from request
 */
function getIdentifier(req: NextRequest, customIdentifier?: (req: NextRequest) => string): string {
  if (customIdentifier) {
    return customIdentifier(req);
  }

  // Try to get IP from various headers (supporting proxies)
  const forwarded = req.headers.get('x-forwarded-for');
  const realIp = req.headers.get('x-real-ip');
  const ip = forwarded?.split(',')[0] || realIp || 'unknown';

  return ip;
}

/**
 * Check rate limit using Redis
 */
async function checkRateLimitRedis(
  key: string,
  maxRequests: number,
  windowSeconds: number
): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
  const now = Date.now();
  const windowMs = windowSeconds * 1000;
  const resetAt = now + windowMs;

  try {
    // Use Redis pipeline for atomic operations
    const pipeline = redis!.pipeline();
    
    // Increment counter
    pipeline.incr(key);
    
    // Set expiry on first request
    pipeline.expire(key, windowSeconds);
    
    // Get current count
    pipeline.get(key);

    const results = await pipeline.exec();
    const count = Number(results[2]) || 0;

    const allowed = count <= maxRequests;
    const remaining = Math.max(0, maxRequests - count);

    return { allowed, remaining, resetAt };
  } catch (error) {
    console.error('Redis rate limit error:', error);
    // Fail open - allow request if Redis is down
    return { allowed: true, remaining: maxRequests, resetAt };
  }
}

/**
 * Check rate limit using memory store (fallback)
 */
function checkRateLimitMemory(
  key: string,
  maxRequests: number,
  windowSeconds: number
): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const windowMs = windowSeconds * 1000;

  const record = memoryStore.get(key);

  if (!record || now > record.resetAt) {
    // Create new record
    const resetAt = now + windowMs;
    memoryStore.set(key, { count: 1, resetAt });
    return { allowed: true, remaining: maxRequests - 1, resetAt };
  }

  // Increment existing record
  record.count++;
  const allowed = record.count <= maxRequests;
  const remaining = Math.max(0, maxRequests - record.count);

  return { allowed, remaining, resetAt: record.resetAt };
}

/**
 * Rate limiting middleware
 */
export async function rateLimit(
  req: NextRequest,
  config: RateLimitConfig
): Promise<NextResponse | null> {
  const { maxRequests, windowSeconds, identifier, skip, message } = config;

  // Skip if condition is met
  if (skip && skip(req)) {
    return null;
  }

  // Get client identifier
  const clientId = getIdentifier(req, identifier);
  const key = `ratelimit:${req.nextUrl.pathname}:${clientId}`;

  // Check rate limit
  const result = redis
    ? await checkRateLimitRedis(key, maxRequests, windowSeconds)
    : checkRateLimitMemory(key, maxRequests, windowSeconds);

  // Add rate limit headers
  const headers = {
    'X-RateLimit-Limit': maxRequests.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': new Date(result.resetAt).toISOString(),
  };

  // If limit exceeded, return 429
  if (!result.allowed) {
    return NextResponse.json(
      {
        success: false,
        error: message || 'Too many requests. Please try again later.',
        code: 'RATE_LIMIT_EXCEEDED',
      },
      {
        status: 429,
        headers: {
          ...headers,
          'Retry-After': Math.ceil(
            (result.resetAt - Date.now()) / 1000
          ).toString(),
        },
      }
    );
  }

  // Add headers to response (will be merged by caller)
  return NextResponse.next({ headers });
}

/**
 * Create a rate limiter middleware with preset configuration
 */
export function createRateLimiter(config: RateLimitConfig) {
  return async (req: NextRequest) => rateLimit(req, config);
}

/**
 * Cleanup memory store (call periodically in development)
 */
export function cleanupMemoryStore() {
  const now = Date.now();
  for (const [key, record] of memoryStore.entries()) {
    if (now > record.resetAt) {
      memoryStore.delete(key);
    }
  }
}

// Auto-cleanup every 5 minutes in development
if (!redis && process.env.NODE_ENV === 'development') {
  setInterval(cleanupMemoryStore, 5 * 60 * 1000);
}
