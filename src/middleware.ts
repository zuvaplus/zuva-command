import { NextRequest, NextResponse } from 'next/server'
import { SESSION_COOKIE, verifySessionToken } from '@/lib/session'

const PUBLIC_PATHS = ['/login', '/api/auth/login', '/api/auth/logout']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (PUBLIC_PATHS.some((path) => pathname === path)) {
    return NextResponse.next()
  }

  const session = request.cookies.get(SESSION_COOKIE)?.value
  if (!(await verifySessionToken(session))) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
