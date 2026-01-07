/**
 * Security Middleware
 * Implements rate limiting, CSRF protection, and security headers
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Rate limiting store (in production, use Redis)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Rate limit configuration
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
const MAX_REQUESTS_PER_WINDOW = 100;
const API_MAX_REQUESTS = 1000; // Higher limit for authenticated API requests

// CSRF token store (in production, use Redis or session store)
const csrfTokens = new Map<string, { token: string; expiresAt: number }>();

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const response = NextResponse.next();

  // Apply rate limiting
  const clientId = getClientIdentifier(request);
  if (!checkRateLimit(clientId, pathname)) {
    return new NextResponse('Too Many Requests', {
      status: 429,
      headers: {
        'Retry-After': String(Math.ceil(RATE_LIMIT_WINDOW / 1000)),
        'X-RateLimit-Limit': String(MAX_REQUESTS_PER_WINDOW),
        'X-RateLimit-Remaining': '0',
      },
    });
  }

  // Add security headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set(
    'Strict-Transport-Security',
    'max-age=63072000; includeSubDomains; preload'
  );
  response.headers.set(
    'Referrer-Policy',
    'strict-origin-when-cross-origin'
  );

  // CSRF protection for state-changing operations
  if (
    ['POST', 'PUT', 'DELETE', 'PATCH'].includes(request.method) &&
    pathname.startsWith('/api/')
  ) {
    const csrfToken = request.headers.get('x-csrf-token');
    const sessionId = getSessionId(request);

    if (!validateCsrfToken(sessionId, csrfToken)) {
      return new NextResponse('CSRF token validation failed', {
        status: 403,
      });
    }
  }

  // Add CSRF token to response for GET requests
  if (request.method === 'GET') {
    const sessionId = getSessionId(request);
    const token = generateCsrfToken(sessionId);
    response.headers.set('X-CSRF-Token', token);
  }

  // Add rate limit headers
  const rateLimit = rateLimitStore.get(clientId);
  if (rateLimit) {
    response.headers.set('X-RateLimit-Limit', String(MAX_REQUESTS_PER_WINDOW));
    response.headers.set('X-RateLimit-Remaining', String(MAX_REQUESTS_PER_WINDOW - rateLimit.count));
    response.headers.set('X-RateLimit-Reset', String(Math.ceil(rateLimit.resetTime / 1000)));
  }

  return response;
}

function getClientIdentifier(request: NextRequest): string {
  // Use IP address + user agent for rate limiting
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0] : request.ip || 'unknown';
  const userAgent = request.headers.get('user-agent') || 'unknown';
  return `${ip}:${userAgent}`;
}

function checkRateLimit(clientId: string, pathname: string): boolean {
  const now = Date.now();
  const limit = pathname.startsWith('/api/') ? API_MAX_REQUESTS : MAX_REQUESTS_PER_WINDOW;

  let rateLimit = rateLimitStore.get(clientId);

  if (!rateLimit || rateLimit.resetTime < now) {
    rateLimit = {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW,
    };
    rateLimitStore.set(clientId, rateLimit);
    return true;
  }

  if (rateLimit.count >= limit) {
    return false;
  }

  rateLimit.count++;
  return true;
}

function getSessionId(request: NextRequest): string {
  // Get session ID from cookie or generate temporary one
  const sessionCookie = request.cookies.get('session-id');
  return sessionCookie?.value || `temp-${Date.now()}`;
}

function generateCsrfToken(sessionId: string): string {
  const token = Buffer.from(
    `${sessionId}-${Date.now()}-${Math.random().toString(36)}`
  ).toString('base64');

  csrfTokens.set(sessionId, {
    token,
    expiresAt: Date.now() + 3600000, // 1 hour
  });

  return token;
}

function validateCsrfToken(sessionId: string, token: string | null): boolean {
  if (!token) return false;

  const storedToken = csrfTokens.get(sessionId);
  if (!storedToken) return false;

  if (storedToken.expiresAt < Date.now()) {
    csrfTokens.delete(sessionId);
    return false;
  }

  return storedToken.token === token;
}

// Cleanup expired entries periodically
setInterval(() => {
  const now = Date.now();

  // Clean up expired rate limits
  for (const [key, value] of rateLimitStore.entries()) {
    if (value.resetTime < now) {
      rateLimitStore.delete(key);
    }
  }

  // Clean up expired CSRF tokens
  for (const [key, value] of csrfTokens.entries()) {
    if (value.expiresAt < now) {
      csrfTokens.delete(key);
    }
  }
}, 300000); // Every 5 minutes

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
};
