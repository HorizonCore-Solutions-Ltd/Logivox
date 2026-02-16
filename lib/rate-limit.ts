import { NextApiRequest, NextApiResponse } from "next";

// Simple in-memory rate limiter for production
const requests = new Map<string, { count: number; resetTime: number }>();

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
  retryAfter?: number;
}

export async function rateLimit(
  identifier: string,
  endpoint: string,
  limit: number = 100,
  windowMs: number = 15 * 60 * 1000, // 15 minutes
): Promise<RateLimitResult> {
  const key = `${identifier}:${endpoint}`;
  const now = Date.now();
  const resetTime = now + windowMs;

  const existing = requests.get(key);

  // Clean up expired entries
  if (existing && now > existing.resetTime) {
    requests.delete(key);
  }

  const current = requests.get(key) || { count: 0, resetTime };

  if (current.count >= limit) {
    return {
      success: false,
      limit,
      remaining: 0,
      reset: current.resetTime,
      retryAfter: Math.ceil((current.resetTime - now) / 1000),
    };
  }

  // Increment request count
  current.count += 1;
  requests.set(key, current);

  return {
    success: true,
    limit,
    remaining: limit - current.count,
    reset: current.resetTime,
  };
}

// API endpoint-specific rate limits
export const RATE_LIMITS = {
  "/api/auth": { limit: 10, window: 15 * 60 * 1000 }, // 10 requests per 15 minutes
  "/api/inventory": { limit: 200, window: 60 * 1000 }, // 200 requests per minute
  "/api/orders": { limit: 100, window: 60 * 1000 }, // 100 requests per minute
  "/api/upload": { limit: 20, window: 60 * 1000 }, // 20 uploads per minute
  default: { limit: 100, window: 15 * 60 * 1000 }, // 100 requests per 15 minutes
};

export function getRateLimitConfig(endpoint: string) {
  // Find matching rate limit configuration
  const matchedKey = Object.keys(RATE_LIMITS).find((key) =>
    endpoint.startsWith(key),
  );

  return (
    RATE_LIMITS[matchedKey as keyof typeof RATE_LIMITS] || RATE_LIMITS.default
  );
}
