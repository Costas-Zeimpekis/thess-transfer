import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const SESSION_COOKIE = 'tt_session'

const PUBLIC_ROUTES = [
  '/login',
  '/api/auth/login',
  '/api/auth/logout',
]

function isPublicRoute(pathname: string): boolean {
  if (PUBLIC_ROUTES.includes(pathname)) return true
  if (pathname.startsWith('/api/intake/')) return true
  return false
}

function isDashboardRoute(pathname: string): boolean {
  // Matches anything that isn't login or an API route
  if (pathname.startsWith('/api/')) return false
  if (pathname === '/login') return false
  return true
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const sessionId = request.cookies.get(SESSION_COOKIE)?.value

  const isLoggedIn = Boolean(sessionId)

  // If logged in and hitting /login, redirect to /bookings
  if (isLoggedIn && pathname === '/login') {
    return NextResponse.redirect(new URL('/bookings', request.url))
  }

  // Protect all dashboard routes
  if (!isPublicRoute(pathname) && isDashboardRoute(pathname) && !isLoggedIn) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for static files and Next.js internals
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
