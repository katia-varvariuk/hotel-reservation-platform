import { NextRequest, NextResponse } from 'next/server'

export function middleware(req: NextRequest) {
  const token = req.cookies.get('token')?.value
  const { pathname } = req.nextUrl

  if (pathname.startsWith('/admin') || pathname.startsWith('/bookings') || pathname.startsWith('/profile') || pathname.startsWith('/favorites')) {
    if (!token) {
      return NextResponse.redirect(new URL('/auth/login', req.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*', '/bookings/:path*', '/profile/:path*', '/profile', '/favorites'],
}
