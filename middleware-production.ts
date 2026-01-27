import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { rateLimit } from '@/lib/rate-limit'

// Enhanced security middleware for production
export async function middleware(request: NextRequest) {
  const response = NextResponse.next()

  // Security headers
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  
  // Content Security Policy
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline' fonts.googleapis.com",
    "img-src 'self' data: https:",
    "font-src 'self' fonts.gstatic.com",
    "connect-src 'self' https://api.github.com https://accounts.google.com",
    "frame-ancestors 'none'",
  ].join('; ')
  
  response.headers.set('Content-Security-Policy', csp)

  // Rate limiting for API routes
  if (request.nextUrl.pathname.startsWith('/api/')) {
    const limitResult = await rateLimit(
      request.ip ?? '127.0.0.1',
      request.nextUrl.pathname
    )

    if (!limitResult.success) {
      return new NextResponse(
        JSON.stringify({ 
          error: 'Rate limit exceeded',
          retryAfter: limitResult.retryAfter 
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': limitResult.retryAfter?.toString() ?? '60',
          },
        }
      )
    }

    // Add rate limit headers
    response.headers.set('X-RateLimit-Limit', limitResult.limit.toString())
    response.headers.set('X-RateLimit-Remaining', limitResult.remaining.toString())
    response.headers.set('X-RateLimit-Reset', new Date(limitResult.reset).toISOString())
  }

  // Authentication check for protected routes
  const protectedPaths = ['/dashboard', '/admin', '/api/protected']
  const isProtectedPath = protectedPaths.some(path => 
    request.nextUrl.pathname.startsWith(path)
  )

  if (isProtectedPath) {
    const token = request.cookies.get('next-auth.session-token') || 
                  request.cookies.get('__Secure-next-auth.session-token')

    if (!token && !request.nextUrl.pathname.startsWith('/api/auth')) {
      const loginUrl = new URL('/auth/signin', request.url)
      loginUrl.searchParams.set('callbackUrl', request.nextUrl.pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  // Audit logging for sensitive operations
  if (request.method !== 'GET' && request.nextUrl.pathname.startsWith('/api/')) {
    try {
      // Log API operations for security auditing
      console.log(`API Request: ${request.method} ${request.nextUrl.pathname}`, {
        ip: request.ip,
        userAgent: request.headers.get('user-agent'),
        timestamp: new Date().toISOString(),
      })
    } catch (error) {
      // Non-blocking logging
      console.error('Audit logging failed:', error)
    }
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public files)
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
}