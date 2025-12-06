import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyToken } from './lib/auth'
import { isAllowed } from './lib/rbac'

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  if (pathname.startsWith('/v1/authorize') || pathname.startsWith('/v1/token')) {
    return NextResponse.next()
  }
  const auth = req.headers.get('authorization') || ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : ''
  if (!token) {
    return NextResponse.json({ error: 'missing_token' }, { status: 401 })
  }
  try {
    const payload = await verifyToken(token)
    const role = (payload.role || '') as 'Viewer' | 'Developer' | 'Admin'
    const allowed = isAllowed(role, req.method, pathname)
    if (!allowed) {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 })
    }
    return NextResponse.next()
  } catch {
    return NextResponse.json({ error: 'invalid_token' }, { status: 401 })
  }
}

export const config = {
  matcher: ['/v1/:path*']
}
