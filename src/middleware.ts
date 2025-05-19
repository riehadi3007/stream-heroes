import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // If user accesses the root page, redirect to signin
  if (request.nextUrl.pathname === '/') {
    return NextResponse.redirect(new URL('/signin', request.url))
  }
  
  return NextResponse.next()
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: ['/', '/api/:path*'],
} 