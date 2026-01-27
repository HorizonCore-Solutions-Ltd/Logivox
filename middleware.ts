/**
 * PRODUCTION SECURITY MIDDLEWARE
 * Implements enterprise-grade security controls
 */
import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

// Security headers configuration
const SECURITY_HEADERS = {
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Content-Security-Policy': `default-src 'self'; script-src 'self' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self';`,
};

// Rate limiting store (in production, use Redis)
const rateLimitStore = new Map();

function getRateLimitKey(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0] : 'unknown';
  return `rate_limit:${ip}`;
}

function isRateLimited(key: string, limit: number = 100, window: number = 60000): boolean {
  const now = Date.now();
  const windowStart = now - window;
  
  let requests = rateLimitStore.get(key) || [];
  requests = requests.filter((time: number) => time > windowStart);
  
  if (requests.length >= limit) {
    return true;
  }
  
  requests.push(now);
  rateLimitStore.set(key, requests);
  return false;
}

export async function middleware(request: NextRequest) {
  const response = NextResponse.next();
  
  // Add security headers to all responses
  Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  // Rate limiting for API routes
  if (request.nextUrl.pathname.startsWith('/api/')) {
    const rateLimitKey = getRateLimitKey(request);
    
    if (isRateLimited(rateLimitKey)) {
      return new NextResponse('Too Many Requests', {
        status: 429,
        headers: {
          'Retry-After': '60',
          ...SECURITY_HEADERS,
        },
      });
    }
  }

  // Authentication check for protected routes
  const protectedPaths = ['/dashboard', '/admin', '/api/'];
  const isProtectedPath = protectedPaths.some(path => 
    request.nextUrl.pathname.startsWith(path)
  );

  if (isProtectedPath && !request.nextUrl.pathname.startsWith('/api/auth/')) {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token) {
      const url = request.nextUrl.clone();
      url.pathname = '/auth/signin';
      url.searchParams.set('callbackUrl', request.nextUrl.pathname);
      return NextResponse.redirect(url);
    }

    // Add user context to headers
    response.headers.set('x-user-id', token.id || '');
    response.headers.set('x-user-role', token.role || '');
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};