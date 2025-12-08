import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyEnhancedToken } from './lib/enhanced-jwt'
import { checkPermissions } from './lib/permissions-util'
import { EnhancedTokenPayload } from './lib/enhanced-jwt'
// import { auditLogger } from './lib/audit-logger'
// import { AuditEventType, AuditSeverity } from './lib/audit-logger'
import { getClientIp, getUserAgent } from './lib/request-utils'

export async function middleware(req: NextRequest) {
  const startTime = Date.now()

  const { pathname } = req.nextUrl

  // Whitelist paths, no authentication required
  if (pathname.startsWith('/v1/authorize') || pathname.startsWith('/v1/token')) {
    return NextResponse.next()
  }

  const auth = req.headers.get('authorization') || ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : ''

  if (!token) {
    // Record audit log

    console.log(`[Middleware] Missing token for ${req.method} ${pathname}`)

    return NextResponse.json({
      error: 'missing_token',
      code: 'MISSING_TOKEN',
      message: 'Authorization header is required'
    }, { status: 401 })
  }

  try {
    // Use enhanced JWT verification
    const verification = await verifyEnhancedToken(token)

    if (!verification.valid || !verification.payload) {
      // Record token security event

      console.log(`[Middleware] Token invalid: ${verification.error}`)

      return NextResponse.json({
        error: 'invalid_token',
        code: verification.code || 'INVALID_TOKEN',
        message: verification.error || 'Token validation failed'
      }, { status: 401 })
    }

    const payload = verification.payload as EnhancedTokenPayload
    const role = (payload.role || '') as 'Viewer' | 'Developer' | 'Admin'

    // Use permissions directly from token payload (avoid DB call in middleware)
    // This solves the Edge Runtime compatibility issue
    const currentPermissions = payload.permissions || []

    // Check permissions
    // We import checkPermissions from enhanced-permissions but verify it's exported first
    // If checkPermissions is not available, we can implement a simple check here or use the imported one
    // We just exported it, so it should be fine.

    // Import checkPermissions dynamically or assume it's available?
    // We need to update imports at the top first. For now, let's use the tool again to update imports if needed.
    // Actually, I can replace the whole block and the imports in one go if I use multi_replace, but I am using replace_file_content.
    // I will use checkPermissions from the import. I need to update the import statement too.

    const isAllowed = checkPermissions(currentPermissions, req.method, pathname)

    const duration = Date.now() - startTime

    if (!isAllowed) {
      // Record permission denial event

      console.log(`[Middleware] Permission denied for ${payload.email} to ${req.method} ${pathname}`)

      return NextResponse.json({
        error: 'forbidden',
        code: 'INSUFFICIENT_PERMISSIONS',
        message: `Role '${role}' does not have permission to ${req.method} ${pathname}`,
        details: {
          requiredRole: getRequiredRole(req.method, pathname),
          currentRole: role,
          currentPermissions: payload.permissions,
          requiredPermissions: [`${req.method}:${pathname}`],
          resource: pathname,
          action: req.method,
          suggestion: 'Contact your administrator to request access'
        }
      }, { status: 403 })
    }

    // Record permission check pass event (async, doesn't block request)


    // Add user information to request headers for subsequent processing
    const requestHeaders = new Headers(req.headers)
    requestHeaders.set('x-user-id', payload.userId)
    requestHeaders.set('x-user-email', payload.email)
    requestHeaders.set('x-user-role', payload.role)
    requestHeaders.set('x-user-oid', payload.oid)
    requestHeaders.set('x-user-permissions', JSON.stringify(payload.permissions))
    requestHeaders.set('x-token-id', payload.jti)

    return NextResponse.next({
      request: {
        headers: requestHeaders
      }
    })
  } catch (error) {
    console.error('Middleware authentication error:', error)

    // Record authentication error event


    return NextResponse.json({
      error: 'authentication_error',
      code: 'AUTHENTICATION_ERROR',
      message: 'Authentication service error'
    }, { status: 500 })
  }
}

/**
 * Get required role for specified operation (for error messages)
 */
function getRequiredRole(method: string, pathname: string): string {
  if (method === 'GET') {
    return 'Viewer'
  }

  if (pathname.includes('/admin/') || method === 'DELETE') {
    return 'Admin'
  }

  return 'Developer'
}

export const config = {
  matcher: ['/v1/:path*', '/api/admin/:path*']
}
