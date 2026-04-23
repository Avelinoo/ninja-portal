import { NextRequest, NextResponse } from 'next/server'
import { verifySessionEdge } from '@/lib/session-edge'

const PUBLIC_PATHS = ['/login', '/api/auth/login']

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  if (PUBLIC_PATHS.some(p => pathname.startsWith(p))) return NextResponse.next()

  const token = req.cookies.get('ninja_session')?.value
  if (!token) return NextResponse.redirect(new URL('/login', req.url))

  const secret = process.env.SESSION_SECRET!
  const valid = await verifySessionEdge(token, secret)
  if (!valid) return NextResponse.redirect(new URL('/login', req.url))

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*', '/api/users/:path*', '/api/proxy/:path*'],
}
