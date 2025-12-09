import { NextRequest, NextResponse } from 'next/server'
import { parseEnhancedToken } from '@/lib/enhanced-jwt'
import { checkPermissionDetails } from '@/lib/rbac'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { token, method, path } = body

    if (!token || !method || !path) {
      return NextResponse.json(
        { error: 'Missing required fields: token, method, path' },
        { status: 400 }
      )
    }

    // 解析Token
    const payload = parseEnhancedToken(token)
    if (!payload) {
      return NextResponse.json(
        { error: 'invalid_token', message: 'Invalid token format' },
        { status: 400 }
      )
    }

    // 检查权限
    const result = await checkPermissionDetails(
      payload.role as any,
      method,
      path,
      payload.permissions,
      payload.denyPermissions,
      'deny'
    )

    return NextResponse.json({
      allowed: result.allowed,
      reason: result.reason,
      details: {
        requiredPermissions: result.requiredPermissions,
        userPermissions: result.userPermissions,
        currentRole: payload.role,
        resource: path,
        action: method,
        suggestion: result.allowed ? undefined : 'Contact your administrator to request access'
      }
    }, { status: 200 })

  } catch (error) {
    console.error('Permission check error:', error)
    return NextResponse.json(
      { 
        error: 'permission_check_failed',
        message: error instanceof Error ? error.message : 'Permission check failed',
        allowed: false
      },
      { status: 500 }
    )
  }
}
