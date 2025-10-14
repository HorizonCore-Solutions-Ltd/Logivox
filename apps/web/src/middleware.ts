import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const isAuth = !!token
    const isAuthPage = req.nextUrl.pathname.startsWith("/sign-in") || 
                       req.nextUrl.pathname.startsWith("/sign-up")
    const isDashboard = req.nextUrl.pathname.startsWith("/dashboard")

    // Redirect to dashboard if trying to access auth pages while logged in
    if (isAuthPage && isAuth) {
      return NextResponse.redirect(new URL("/dashboard/dashboard", req.url))
    }

    // Allow access to dashboard if authenticated
    if (isDashboard && isAuth) {
      return NextResponse.next()
    }

    // Redirect to sign-in if trying to access dashboard without auth
    if (isDashboard && !isAuth) {
      let from = req.nextUrl.pathname
      if (req.nextUrl.search) {
        from += req.nextUrl.search
      }

      return NextResponse.redirect(
        new URL(`/sign-in?callbackUrl=${encodeURIComponent(from)}`, req.url)
      )
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: () => true, // We handle authorization in the middleware function
    },
  }
)

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/sign-in",
    "/sign-up",
  ],
}
