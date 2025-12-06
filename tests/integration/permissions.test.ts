import {
  checkPermission,
  listPermissions,
  createPermission,
  updatePermission,
  deletePermission,
  getPermissionsByRole,
  getAuditLogs
} from '../../../lib/permissions'
import { createTestPermission } from '../../fixtures'

describe('Permissions & RBAC', () => {
  describe('checkPermission', () => {
    it('should allow Viewer to GET', async () => {
      const allowed = await checkPermission('Viewer', 'GET', '/v1/App')
      expect(allowed).toBe(true)
    })

    it('should deny Viewer POST', async () => {
      const allowed = await checkPermission('Viewer', 'POST', '/v1/App')
      expect(allowed).toBe(false)
    })

    it('should allow Developer to GET', async () => {
      const allowed = await checkPermission('Developer', 'GET', '/v1/App')
      expect(allowed).toBe(true)
    })

    it('should allow Developer to POST', async () => {
      const allowed = await checkPermission('Developer', 'POST', '/v1/App/data')
      expect(allowed).toBe(true)
    })

    it('should allow Developer to DELETE faults', async () => {
      const allowed = await checkPermission('Developer', 'DELETE', '/v1/App/faults')
      expect(allowed).toBe(true)
    })

    it('should allow Admin all operations', async () => {
      const methods = ['GET', 'POST', 'PUT', 'DELETE']

      for (const method of methods) {
        const allowed = await checkPermission('Admin', method, '/v1/App')
        expect(allowed).toBe(true)
      }
    })

    it('should check database permissions first', async () => {
      // Create explicit database permission
      await createTestPermission('CustomRole', {
        method: 'GET',
        pathPattern: '/v1/App/*/data',
        access: { allowed: true }
      })

      const allowed = await checkPermission('CustomRole', 'GET', '/v1/App/*/data')
      expect(allowed).toBe(true)
    })
  })

  describe('listPermissions', () => {
    it('should list all permissions', async () => {
      await createTestPermission('Developer', { method: 'GET' })
      await createTestPermission('Developer', { method: 'POST' })
      await createTestPermission('Admin', { method: 'DELETE' })

      const permissions = await listPermissions()
      expect(permissions.length).toBeGreaterThanOrEqual(3)
    })

    it('should filter permissions by role', async () => {
      await createTestPermission('Developer', { method: 'GET' })
      await createTestPermission('Developer', { method: 'POST' })
      await createTestPermission('Viewer', { method: 'GET' })

      const devPermissions = await listPermissions('Developer')
      expect(devPermissions.every(p => p.role === 'Developer')).toBe(true)
    })

    it('should return permission details', async () => {
      await createTestPermission('Developer')

      const permissions = await listPermissions('Developer')
      const perm = permissions[0]

      expect(perm).toHaveProperty('id')
      expect(perm).toHaveProperty('role', 'Developer')
      expect(perm).toHaveProperty('method')
      expect(perm).toHaveProperty('pathPattern')
      expect(perm).toHaveProperty('access')
    })
  })

  describe('createPermission', () => {
    it('should create a permission', async () => {
      const permission = await createPermission({
        role: 'DataAnalyst',
        pathPattern: '/v1/App/*/data',
        method: 'GET',
        access: { allowed: true }
      })

      expect(permission.role).toBe('DataAnalyst')
      expect(permission.method).toBe('GET')
      expect(permission.access.allowed).toBe(true)
    })

    it('should enforce unique constraints', async () => {
      await createTestPermission('Developer', {
        method: 'GET',
        pathPattern: '/v1/App/*/data'
      })

      // Try to create duplicate
      await expect(
        createPermission({
          role: 'Developer',
          pathPattern: '/v1/App/*/data',
          method: 'GET',
          access: { allowed: false }
        })
      ).rejects.toThrow()
    })

    it('should create audit log', async () => {
      await createPermission({
        role: 'Developer',
        pathPattern: '/v1/App/*/data',
        method: 'GET',
        access: { allowed: true }
      })

      const logs = await getAuditLogs({ action: 'CREATE_PERMISSION' })
      expect(logs.length).toBeGreaterThan(0)
    })
  })

  describe('updatePermission', () => {
    it('should update a permission', async () => {
      const permission = await createTestPermission()

      const updated = await updatePermission(permission.id, {
        allowed: false,
        reason: 'Restricted access'
      })

      expect(updated.access.allowed).toBe(false)
      expect(updated.access.reason).toBe('Restricted access')
    })

    it('should create audit log for updates', async () => {
      const permission = await createTestPermission()

      await updatePermission(permission.id, { allowed: false })

      const logs = await getAuditLogs({ action: 'UPDATE_PERMISSION' })
      expect(logs.length).toBeGreaterThan(0)
    })
  })

  describe('deletePermission', () => {
    it('should delete a permission', async () => {
      const permission = await createTestPermission()

      const result = await deletePermission(permission.id)
      expect(result).toHaveProperty('success', true)

      // Verify deleted
      const permissions = await listPermissions()
      expect(permissions.find(p => p.id === permission.id)).toBeUndefined()
    })

    it('should create audit log for deletion', async () => {
      const permission = await createTestPermission()

      await deletePermission(permission.id)

      const logs = await getAuditLogs({ action: 'DELETE_PERMISSION' })
      expect(logs.length).toBeGreaterThan(0)
    })
  })

  describe('getPermissionsByRole', () => {
    it('should get permissions grouped by method', async () => {
      await createTestPermission('Developer', { method: 'GET' })
      await createTestPermission('Developer', { method: 'POST' })
      await createTestPermission('Developer', { method: 'DELETE' })

      const result = await getPermissionsByRole('Developer')

      expect(result.role).toBe('Developer')
      expect(result.permissions).toHaveProperty('GET')
      expect(result.permissions).toHaveProperty('POST')
      expect(result.permissions).toHaveProperty('DELETE')
      expect(result.count).toBe(3)
    })

    it('should return empty for role with no permissions', async () => {
      const result = await getPermissionsByRole('NonExistentRole')

      expect(result.role).toBe('NonExistentRole')
      expect(result.count).toBe(0)
    })
  })

  describe('Audit Logging', () => {
    it('should log permission creates', async () => {
      await createPermission({
        role: 'Analyst',
        pathPattern: '/v1/*/operations',
        method: 'GET',
        access: { allowed: true }
      })

      const logs = await getAuditLogs({ action: 'CREATE_PERMISSION' })
      expect(logs.length).toBeGreaterThan(0)

      const log = logs[0]
      expect(log.resource).toContain('Analyst')
    })

    it('should support audit log filtering', async () => {
      await createPermission({
        role: 'Analyst',
        pathPattern: '/v1/data',
        method: 'GET',
        access: { allowed: true }
      })

      const logs = await getAuditLogs({
        action: 'CREATE_PERMISSION',
        limit: 10
      })

      expect(logs.length).toBeGreaterThan(0)
    })

    it('should support pagination on audit logs', async () => {
      // Create multiple permissions
      for (let i = 0; i < 5; i++) {
        await createPermission({
          role: `Role${i}`,
          pathPattern: `/v1/path${i}`,
          method: 'GET',
          access: { allowed: true }
        })
      }

      const page1 = await getAuditLogs({ limit: 2, offset: 0 })
      const page2 = await getAuditLogs({ limit: 2, offset: 2 })

      expect(page1.length).toBeLessThanOrEqual(2)
      expect(page2.length).toBeLessThanOrEqual(2)
    })
  })

  describe('RBAC Integration', () => {
    it('should enforce permissions across operations', async () => {
      // Viewer can only GET
      expect(await checkPermission('Viewer', 'GET', '/v1/App')).toBe(true)
      expect(await checkPermission('Viewer', 'POST', '/v1/App')).toBe(false)
      expect(await checkPermission('Viewer', 'DELETE', '/v1/App')).toBe(false)

      // Developer has more permissions
      expect(await checkPermission('Developer', 'GET', '/v1/App')).toBe(true)
      expect(await checkPermission('Developer', 'POST', '/v1/App/data')).toBe(true)
      expect(await checkPermission('Developer', 'DELETE', '/v1/App/faults')).toBe(true)

      // Admin has all permissions
      expect(await checkPermission('Admin', 'GET', '/v1/App')).toBe(true)
      expect(await checkPermission('Admin', 'POST', '/v1/App')).toBe(true)
      expect(await checkPermission('Admin', 'DELETE', '/v1/App')).toBe(true)
    })

    it('should support custom role creation', async () => {
      // Create custom role with specific permissions
      await createPermission({
        role: 'DataViewer',
        pathPattern: '/v1/*/data',
        method: 'GET',
        access: { allowed: true }
      })

      // Verify permission check works
      const allowed = await checkPermission('DataViewer', 'GET', '/v1/*/data')
      expect(allowed).toBe(true)
    })
  })
})
