import { PrismaClient } from '@prisma/client'
import { checkPermissions as checkPermissionsUtil } from './permissions-util'

const prisma = new PrismaClient()

export type Role = 'Viewer' | 'Developer' | 'Admin'

/**
 * Permission Check Result
 */
export interface PermissionCheckResult {
  allowed: boolean
  reason?: string
  requiredPermissions?: string[]
  userPermissions?: string[]
}

/**
 * Check user permissions (legacy version, maintains compatibility)
 */
export function isAllowedLegacy(role: Role | undefined, method: string, path: string): boolean {
  if (!role) return false
  if (role === 'Admin') return true
  if (role === 'Viewer') return method === 'GET'
  if (role === 'Developer') {
    if (method === 'PUT') return true
    if (path.includes('/locks')) {
      if (method === 'GET') return true
      return false
    }
    if (method === 'GET' || method === 'POST') return true
    if (method === 'DELETE') return path.includes('/faults')
    return false
  }
  return false
}

/**
 * Enhanced permission check (supports specific permission list)
 */
export async function isAllowed(
  role: Role | undefined, 
  method: string, 
  path: string,
  userPermissions?: string[],
  denyPermissions?: string[],
  defaultPolicy: 'allow' | 'deny'
): Promise<boolean>

export async function isAllowed(
  role: Role | undefined, 
  method: string, 
  path: string,
  userPermissions?: string[],
  denyPermissions?: string[],
  defaultPolicy: 'allow' | 'deny' = 'deny'
): Promise<boolean> {
  if (!role) return false
  
  // Admin always has permissions
  if (role === 'Admin') return true
  
  // If specific permission list exists, prioritize permission list check
  if (userPermissions && userPermissions.length > 0) {
    return checkPermissionsUtil(userPermissions, method, path, denyPermissions, defaultPolicy)
  }
  
  // Fallback to role-based permission check
  return checkRoleBasedPermissions(role, method, path)
}

/**
 * Permission check based on permission list
 */
function checkPermissions(userPermissions: string[], method: string, path: string, denyPermissions?: string[], defaultPolicy: 'allow' | 'deny' = 'deny'): boolean {
  return checkPermissionsUtil(userPermissions, method, path, denyPermissions, defaultPolicy)
}

/**
 * Role-based permission check (maintains compatibility)
 */
function checkRoleBasedPermissions(role: Role, method: string, path: string): boolean {
  if (role === 'Viewer') return method === 'GET'
  if (role === 'Developer') {
    if (method === 'PUT') return true
    if (path.includes('/locks')) {
      if (method === 'GET') return true
      return false
    }
    if (method === 'GET' || method === 'POST') return true
    if (method === 'DELETE') return path.includes('/faults')
    return false
  }
  return false
}

/**
 * Detailed permission check (returns detailed information)
 */
export async function checkPermissionDetails(
  role: Role | undefined,
  method: string,
  path: string,
  userPermissions?: string[],
  denyPermissions?: string[],
  defaultPolicy: 'allow' | 'deny' = 'deny'
): Promise<PermissionCheckResult> {
  if (!role) {
    return {
      allowed: false,
      reason: 'No role provided'
    }
  }
  
  // Admin always has permissions
  if (role === 'Admin') {
    return {
      allowed: true,
      reason: 'Admin role has all permissions'
    }
  }
  
  // Build required permissions
  const requiredPermissions = [`${method}:${path}`]
  
  // If specific permission list exists, perform detailed check
  if (userPermissions && userPermissions.length > 0) {
    const allowed = checkPermissions(userPermissions, method, path, denyPermissions, defaultPolicy)
    return {
      allowed,
      reason: allowed ? 'User has required permissions' : 'User lacks required permissions',
      requiredPermissions,
      userPermissions
    }
  }
  
  // Role-based check
  const allowed = checkRoleBasedPermissions(role, method, path)
  return {
    allowed,
    reason: allowed ? `Role ${role} has permission` : `Role ${role} lacks permission`,
    requiredPermissions
  }
}

/**
 * Get all permissions for role
 */
export async function getRolePermissions(role: Role): Promise<string[]> {
  try {
    const rolePermissions = await prisma.permission.findMany({
      where: { role },
      select: { method: true, pathPattern: true, access: true }
    })

    const fromDb = rolePermissions
      .filter(p => normalizeAccess(p.access) === 'allow')
      .map(p => `${p.method}:${p.pathPattern}`)

    const basePermissions = getBasePermissions(role)
    const source = fromDb.length > 0 ? fromDb : basePermissions
    return [...new Set(source)]
  } catch (error) {
    console.error('Failed to get role permissions:', error)
    return getBasePermissions(role)
  }
}

/**
 * Get base permissions
 */
function getBasePermissions(role: Role): string[] {
  const basePerms = {
    'Viewer': [
      'GET:/sovd/v1/*'
    ],
    'Developer': [
      'GET:/sovd/v1/*',
      'POST:/sovd/v1/*',
      'PUT:/sovd/v1/*',
      'DELETE:/sovd/v1/*',
    ],
    'Admin': ['*']
  }

  return basePerms[role] || []
}

export async function getRoleAccess(role: Role): Promise<{ allow: string[]; deny: string[] }> {
  try {
    const rows = await prisma.permission.findMany({
      where: { role },
      select: { method: true, pathPattern: true, access: true }
    })

    const allowFromDb = rows
      .filter(p => normalizeAccess(p.access) === 'allow')
      .map(p => `${p.method}:${p.pathPattern}`)

    const denyFromDb = rows
      .filter(p => normalizeAccess(p.access) === 'deny')
      .map(p => `${p.method}:${p.pathPattern}`)

    const allowBase = getBasePermissions(role)
    const denyBase = getBaseDenyPermissions(role)

    // Prefer DB configuration; fall back to base only when DB has no entries for that access type
    const allowSource = allowFromDb.length > 0 ? allowFromDb : allowBase
    const allow = Array.from(new Set(allowSource))
    const denySource = denyFromDb.length > 0 ? denyFromDb : denyBase
    const deny = Array.from(new Set(denySource))

    return { allow, deny }
  } catch (error) {
    console.error('Failed to get role access:', error)
    return { allow: getBasePermissions(role), deny: getBaseDenyPermissions(role) }
  }
}

function normalizeAccess(access?: string | null): 'allow' | 'deny' {
  if (!access) return 'deny'
  const t = access.trim()
  const l = t.toLowerCase()
  if (l === 'allow' || l === 'allowed' || l === 'true') return 'allow'
  if (l === 'deny' || l === 'denied' || l === 'false') return 'deny'
  try {
    const obj = JSON.parse(t)
    if (obj && typeof obj.allowed === 'boolean') {
      return obj.allowed ? 'allow' : 'deny'
    }
  } catch {}
  return 'deny'
}

function getBaseDenyPermissions(role: Role): string[] {
  if (role === 'Viewer') {
    return [
      'POST:/sovd/v1/*',
      'PUT:/sovd/v1/*',
      'DELETE:/sovd/v1/*'
    ]
  }
  if (role === 'Developer') {
    return [
      'POST:/sovd/v1/Admin/*',
      'PUT:/sovd/v1/Admin/*',
      'DELETE:/sovd/v1/Admin/*'
    ]
  }
  if (role === 'Admin') {
    return []
  }
  return []
}
