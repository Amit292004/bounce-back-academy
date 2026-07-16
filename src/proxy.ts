import { NextResponse } from 'next/server'
import type { NextProxy } from 'next/server'
import { verifyToken } from '@/lib/auth'

// Vercel Deployment Trigger: Finalizing environment variable and proxy migration
export const proxy: NextProxy = async (request) => {
  const { pathname } = request.nextUrl

  // API routes protection
  if (pathname.startsWith('/api/admin')) {
    if (pathname === '/api/admin/login' || pathname === '/api/admin/google-auth' || pathname === '/api/admin/logout') {
      return NextResponse.next()
    }

    const token = request.cookies.get('admin_token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized: No token provided' }, { status: 401 })
    }

    const verifiedToken = await verifyToken(token)
    if (!verifiedToken) {
      const response = NextResponse.json({ error: 'Unauthorized: Invalid token' }, { status: 401 })
      response.cookies.delete('admin_token')
      return response
    }
  }

  // Admin routes protection
  if (pathname.startsWith('/admin') && !pathname.startsWith('/admin/login')) {
    const token = request.cookies.get('admin_token')?.value

    if (!token) {
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }

    const verifiedToken = await verifyToken(token)

    if (!verifiedToken) {
      // Invalid or expired token
      const response = NextResponse.redirect(new URL('/admin/login', request.url))
      response.cookies.delete('admin_token')
      return response
    }
  }

  return NextResponse.next()
}

export default proxy

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
}
