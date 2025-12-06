import { prisma } from './prisma'
import type { Permission, Access } from '@prisma/client'

export interface PermissionData {
  role: string
  pathPattern: string
  method: string
  access: {
    allowed: boolean
    reason?: string
  }
}

/**
 * Check if a role has permission for a method on a path
 */
export async function checkPermission(role: string, method: string, path: string): Promise<boolean> {
  try {
    // First, check database permissions
    const permission = await prisma.permission.findFirst({
      where: {
        role,
        method,
        pathPattern: path
      }
    })

    if (permission) {
      const access = permission.access as any
      return access.allowed === true
    }

    // Fall back to hardcoded RBAC rules for compatibility
    return checkHardcodedPermission(role, method, path)
  } catch (error) {
    console.error(`Failed to check permission for ${role} ${method} ${path}:`, error)
    // Default to deny on error
    return false
  }
}

/**
 * List all permissions, optionally filtered by role
 */
export async function listPermissions(role?: string) {
  try {
    const permissions = await prisma.permission.findMany({
      where: role ? { role } : {},
      orderBy: [{ role: 'asc' }, { pathPattern: 'asc' }]
    })

    return permissions.map(p => ({
      id: p.id,
      role: p.role,
      method: p.method,
      pathPattern: p.pathPattern,
      access: p.access,
      createdAt: p.createdAt
    }))
  } catch (error) {
    console.error(`Failed to list permissions for role ${role || 'all'}:`, error)
    throw new Error(`Permission listing failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Create a new permission
 */
export async function createPermission(data: PermissionData) {
  try {
    const permission = await prisma.permission.create({
      data: {
        role: data.role,
        pathPattern: data.pathPattern,
        method: data.method,
        access: data.access as any,
        createdAt: new Date()
      }
    })

    // Log permission creation
    await logAudit({
      userId: 'system',
      action: 'CREATE_PERMISSION',
      resource: `${data.role}:${data.method}:${data.pathPattern}`,
      result: 'success',
      details: { permissionId: permission.id }
    })

    return {
      id: permission.id,
      role: permission.role,
      method: permission.method,
      pathPattern: permission.pathPattern,
      access: permission.access
    }
  } catch (error) {
    console.error(`Failed to create permission:`, error)
    throw new Error(`Permission creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Update a permission
 */
export async function updatePermission(id: string, access: Partial<Access>) {
  try {
    const permission = await prisma.permission.update({
      where: { id },
      data: {
        access: access as any
      }
    })

    // Log permission update
    await logAudit({
      userId: 'system',
      action: 'UPDATE_PERMISSION',
      resource: `${permission.role}:${permission.method}:${permission.pathPattern}`,
      result: 'success',
      details: { permissionId: id, newAccess: access }
    })

    return {
      id: permission.id,
      role: permission.role,
      method: permission.method,
      pathPattern: permission.pathPattern,
      access: permission.access
    }
  } catch (error) {
    console.error(`Failed to update permission ${id}:`, error)
    throw new Error(`Permission update failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Delete a permission
 */
export async function deletePermission(id: string) {
  try {
    const permission = await prisma.permission.delete({
      where: { id }
    })

    // Log permission deletion
    await logAudit({
      userId: 'system',
      action: 'DELETE_PERMISSION',
      resource: `${permission.role}:${permission.method}:${permission.pathPattern}`,
      result: 'success',
      details: { permissionId: id }
    })

    return { success: true }
  } catch (error) {
    console.error(`Failed to delete permission ${id}:`, error)
    throw new Error(`Permission deletion failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Get permissions by role with detailed path patterns
 */
export async function getPermissionsByRole(role: string) {
  try {
    const permissions = await prisma.permission.findMany({
      where: { role },
      orderBy: { pathPattern: 'asc' }
    })

    // Group by HTTP method
    const byMethod = new Map<string, string[]>()

    permissions.forEach(p => {
      if (!byMethod.has(p.method)) {
        byMethod.set(p.method, [])
      }
      byMethod.get(p.method)!.push(p.pathPattern)
    })

    return {
      role,
      permissions: Object.fromEntries(byMethod),
      count: permissions.length
    }
  } catch (error) {
    console.error(`Failed to get permissions for role ${role}:`, error)
    throw new Error(`Permission lookup failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Audit logging helper
 */
export async function logAudit(entry: {
  userId: string
  action: string
  resource: string
  result: 'success' | 'error'
  details?: Record<string, unknown>
}) {
  try {
    await prisma.auditLog.create({
      data: {
        userId: entry.userId,
        action: entry.action,
        resource: entry.resource,
        result: entry.result,
        details: JSON.stringify(entry.details || {}),
        timestamp: new Date()
      }
    })
  } catch (error) {
    // Don't throw - audit logging should not fail the request
    console.error('Failed to log audit entry:', error)
  }
}

/**
 * Get audit logs
 */
export async function getAuditLogs(
  filters?: {
    userId?: string
    action?: string
    resource?: string
    limit?: number
    offset?: number
  }
) {
  try {
    const skip = filters?.offset || 0
    const take = filters?.limit || 100

    const logs = await prisma.auditLog.findMany({
      where: {
        ...(filters?.userId && { userId: filters.userId }),
        ...(filters?.action && { action: filters.action }),
        ...(filters?.resource && { resource: { contains: filters.resource } })
      },
      skip,
      take,
      orderBy: { timestamp: 'desc' }
    })

    return logs.map(log => ({
      id: log.id,
      userId: log.userId,
      action: log.action,
      resource: log.resource,
      result: log.result,
      details: log.details ? JSON.parse(log.details) : {},
      timestamp: log.timestamp
    }))
  } catch (error) {
    console.error(`Failed to get audit logs:`, error)
    throw new Error(`Audit log retrieval failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Hardcoded RBAC fallback (for compatibility with Phase 1-2)
 */
function checkHardcodedPermission(role: string, method: string, path: string): boolean {
  // Viewer: read-only access
  if (role === 'Viewer') {
    return method === 'GET'
  }

  // Developer: full read, limited write
  if (role === 'Developer') {
    // Can GET and POST everywhere
    if (method === 'GET' || method === 'POST') {
      return true
    }
    // Can DELETE on faults
    if (method === 'DELETE' && path.includes('/faults')) {
      return true
    }
    // Can PUT on data
    if (method === 'PUT' && path.includes('/data')) {
      return true
    }
    return false
  }

  // Admin: full access
  if (role === 'Admin') {
    return true
  }

  // Default: deny
  return false
}
