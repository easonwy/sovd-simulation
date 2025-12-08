import { PrismaClient } from '@prisma/client'

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
  userPermissions?: string[]
): Promise<boolean>

export async function isAllowed(
  role: Role | undefined, 
  method: string, 
  path: string,
  userPermissions?: string[]
): Promise<boolean> {
  if (!role) return false
  
  // Admin always has permissions
  if (role === 'Admin') return true
  
  // If specific permission list exists, prioritize permission list check
  if (userPermissions && userPermissions.length > 0) {
    return checkPermissions(userPermissions, method, path)
  }
  
  // Fallback to role-based permission check
  return checkRoleBasedPermissions(role, method, path)
}

/**
 * Permission check based on permission list
 */
function checkPermissions(userPermissions: string[], method: string, path: string): boolean {
  // Check if wildcard permission exists
  if (userPermissions.includes('*')) {
    return true
  }
  
  // Build requested permission string
  const requestedPermission = `${method}:${path}`
  
  // Check exact match
  if (userPermissions.includes(requestedPermission)) {
    return true
  }
  
  // Check wildcard match
  for (const permission of userPermissions) {
    if (permission.includes('*')) {
      const pattern = permission.replace(/\*/g, '.*')
      const regex = new RegExp(`^${pattern}$`)
      if (regex.test(requestedPermission)) {
        return true
      }
    }
  }
  
  return false
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
  userPermissions?: string[]
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
    const allowed = checkPermissions(userPermissions, method, path)
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
function getBasePermissions(role: Role): string[] {
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

  return basePerms[role] || []
}
