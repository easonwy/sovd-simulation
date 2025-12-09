import { NextRequest, NextResponse } from 'next/server'
import { generateEnhancedToken } from '@/lib/enhanced-jwt'
import { PrismaClient } from '@prisma/client'
import { getRoleAccess } from '@/lib/rbac'

const prisma = new PrismaClient()

export const runtime = 'nodejs'

function parseBody(contentType: string | null, raw: string) {
  if (contentType && contentType.includes('application/x-www-form-urlencoded')) {
    const params = new URLSearchParams(raw)
    const obj: Record<string, string> = {}
    params.forEach((v, k) => (obj[k] = v))
    return obj
  }
  try {
    return JSON.parse(raw)
  } catch {
    return {}
  }
}

export async function POST(req: NextRequest) {
  try {
    // HS256 signing requires no key preload
    const ct = req.headers.get('content-type')
    const raw = await req.text()
    const body = parseBody(ct, raw)

    const role = (body.role || 'Viewer') as 'Viewer' | 'Developer' | 'Admin'
    const grant = body.grant_type || 'client_credentials'
    const expiresIn = body.expires_in || '1h'

    if (!grant) {
      return NextResponse.json({ error: 'invalid_request' }, { status: 400 })
    }

    const { allow: permissions, deny: denyPermissions } = await getRoleAccess(role as any)
    const effectivePermissions = filterAllowsAgainstDenies(permissions, denyPermissions)

    // Use enhanced JWT tool to generate token
    const tokenResult = await generateEnhancedToken({
      userId: 'system', // System generated token
      email: 'system@sovd.local',
      role,
      oid: 'default',
      permissions: effectivePermissions,
      denyPermissions,
      scope: 'api:access',
      clientId: 'sovd-cli'
    }, {
      expiresIn,
      issuer: 'sovd-system',
      audience: 'sovd-api'
    })

    return NextResponse.json({
      access_token: tokenResult.token,
      token_type: 'Bearer',
      expires_in: Math.floor((tokenResult.expiresAt.getTime() - Date.now()) / 1000),
      scope: 'api:access',
      permissions: effectivePermissions,
      denyPermissions
    }, { status: 200 })
  } catch (error) {
    console.error('Token generation error:', error)
    return NextResponse.json({
      error: 'token_generation_failed',
      error_description: 'Failed to generate access token'
    }, { status: 500 })
  }
}

/**
 * Get role permission list
 */
async function getRolePermissions(role: string): Promise<string[]> {
  try {
    // Get role permissions from database
    const rolePermissions = await prisma.permission.findMany({
      where: { role },
      select: { method: true, pathPattern: true }
    })

    // Convert to permission string format
    const permissions = rolePermissions.map(perm =>
      `${perm.method}:${perm.pathPattern}`
    )

    // Add base permissions
    const basePermissions = getBasePermissions(role)

    return [...new Set([...basePermissions, ...permissions])]
  } catch (error) {
    console.error('Failed to get role permissions:', error)
    return getBasePermissions(role)
  }
}

/**
 * Get base permissions
 */
function getBasePermissions(role: string): string[] {
  const basePerms = {
    'Viewer': [
      'GET:/v1/App',
      'GET:/v1/App/*/data',
      'GET:/v1/App/*/faults'
    ],
    'Developer': [
      'GET:/v1/App',
      'POST:/v1/App',
      'GET:/v1/App/*/data',
      'POST:/v1/App/*/data',
      'PUT:/v1/App/*/data',
      'GET:/v1/App/*/faults',
      'POST:/v1/App/*/faults',
      'DELETE:/v1/App/*/faults',
      'GET:/v1/App/*/lock'
    ],
    'Admin': ['*'] // Admin has all permissions
  }

  return basePerms[role as keyof typeof basePerms] || []
}

function getBaseDenyPermissions(role: string): string[] {
  if (role === 'Viewer') {
    return [
      'POST:/v1/*',
      'PUT:/v1/*',
      'DELETE:/v1/*'
    ]
  }
  if (role === 'Developer') {
    return [
      'POST:/v1/Admin/*',
      'PUT:/v1/Admin/*',
      'DELETE:/v1/Admin/*'
    ]
  }
  if (role === 'Admin') {
    return [
      'DELETE:/v1/*',
      'POST:/v1/*',
      'PUT:/v1/*',
      'GET:/v1/Component/*/faults'
    ]
  }
  return []
}

function filterAllowsAgainstDenies(allows: string[], denies: string[]): string[] {
  if (!Array.isArray(denies) || denies.length === 0) return Array.from(new Set(allows))
  const denyRegexes = denies.map(toRegexFromPattern).filter(Boolean) as RegExp[]
  const result = allows.filter((perm) => {
    // keep global wildcard; rely on middleware deny precedence
    if (perm === '*') return true
    // drop if any deny regex matches
    return !denyRegexes.some((rx) => rx.test(perm))
  })
  // dedupe
  return Array.from(new Set(result))
}

function toRegexFromPattern(pattern: string): RegExp | null {
  if (!pattern || typeof pattern !== 'string') return null
  // escape regex special chars except '*'
  const escaped = pattern.replace(/[.+?^${}()|\[\]\\]/g, '\\$&').replace(/\*/g, '.*')
  return new RegExp(`^${escaped}$`)
}
