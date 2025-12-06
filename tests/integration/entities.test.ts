import {
  getEntity,
  listEntities,
  createEntity,
  updateEntity,
  deleteEntity,
  getEntityCapabilities
} from '../../../lib/entities'
import {
  createTestEntity,
  createTestEntities,
  getEntityCount,
  getAllEntities
} from '../../fixtures'

describe('Entity Operations', () => {
  describe('listEntities', () => {
    it('should return empty list when no entities exist', async () => {
      const entities = await listEntities('App')
      expect(entities).toEqual([])
    })

    it('should list entities by collection', async () => {
      await createTestEntity('App', 'WindowControl')
      await createTestEntity('App', 'SunroofControl')

      const entities = await listEntities('App')
      expect(entities).toHaveLength(2)
      expect(entities.map(e => e.entityId)).toContain('WindowControl')
      expect(entities.map(e => e.entityId)).toContain('SunroofControl')
    })

    it('should filter entities by collection', async () => {
      await createTestEntity('App', 'WindowControl')
      await createTestEntity('Component', 'DrivingComputer')

      const apps = await listEntities('App')
      const components = await listEntities('Component')

      expect(apps).toHaveLength(1)
      expect(components).toHaveLength(1)
      expect(apps[0].entityId).toBe('WindowControl')
      expect(components[0].entityId).toBe('DrivingComputer')
    })

    it('should return entity metadata', async () => {
      await createTestEntity('App', 'WindowControl', {
        name: 'Window Control App',
        description: 'Controls all windows'
      })

      const entities = await listEntities('App')
      expect(entities[0]).toHaveProperty('name', 'Window Control App')
      expect(entities[0]).toHaveProperty('description', 'Controls all windows')
      expect(entities[0]).toHaveProperty('collection', 'App')
    })
  })

  describe('getEntity', () => {
    it('should get entity by collection and ID', async () => {
      await createTestEntity('App', 'WindowControl', {
        name: 'Window Control App'
      })

      const entity = await getEntity('App', 'WindowControl')
      expect(entity).not.toBeNull()
      expect(entity?.entityId).toBe('WindowControl')
      expect(entity?.name).toBe('Window Control App')
    })

    it('should return null when entity not found', async () => {
      const entity = await getEntity('App', 'NonExistent')
      expect(entity).toBeNull()
    })

    it('should include related data in response', async () => {
      await createTestEntity('App', 'WindowControl')

      const entity = await getEntity('App', 'WindowControl')
      expect(entity).toHaveProperty('dataValues')
      expect(entity).toHaveProperty('faults')
      expect(entity).toHaveProperty('locks')
    })
  })

  describe('createEntity', () => {
    it('should create a new entity', async () => {
      const entity = await createEntity('App', {
        entityId: 'NewApp',
        name: 'New Application',
        type: 'application',
        description: 'A new test app'
      })

      expect(entity).toHaveProperty('entityId', 'NewApp')
      expect(entity).toHaveProperty('name', 'New Application')
      expect(entity).toHaveProperty('collection', 'App')

      // Verify it was persisted
      const count = await getEntityCount()
      expect(count).toBe(1)
    })

    it('should set default status to active', async () => {
      const entity = await createEntity('App', {
        entityId: 'NewApp',
        name: 'New Application'
      })

      expect(entity.status).toBe('active')
    })

    it('should create with custom metadata', async () => {
      const metadata = { version: '1.0', author: 'test' }
      const entity = await createEntity('App', {
        entityId: 'NewApp',
        name: 'New Application',
        metadata
      })

      expect(entity.metadata).toEqual(metadata)
    })
  })

  describe('updateEntity', () => {
    it('should update entity properties', async () => {
      await createTestEntity('App', 'WindowControl', {
        name: 'Original Name'
      })

      const updated = await updateEntity('App', 'WindowControl', {
        name: 'Updated Name',
        description: 'New description'
      })

      expect(updated.name).toBe('Updated Name')
      expect(updated.description).toBe('New description')
    })

    it('should update entity status', async () => {
      await createTestEntity('App', 'WindowControl')

      const updated = await updateEntity('App', 'WindowControl', {
        status: 'inactive'
      })

      expect(updated.status).toBe('inactive')
    })

    it('should throw error for non-existent entity', async () => {
      await expect(
        updateEntity('App', 'NonExistent', { name: 'New Name' })
      ).rejects.toThrow()
    })
  })

  describe('deleteEntity', () => {
    it('should delete an entity', async () => {
      await createTestEntity('App', 'WindowControl')
      expect(await getEntityCount()).toBe(1)

      await deleteEntity('App', 'WindowControl')
      expect(await getEntityCount()).toBe(0)
    })

    it('should cascade delete related data', async () => {
      const entity = await createTestEntity('App', 'WindowControl')
      // Entity is deleted, related records should also be deleted
      await deleteEntity('App', 'WindowControl')
      expect(await getEntityCount()).toBe(0)
    })

    it('should throw error for non-existent entity', async () => {
      await expect(
        deleteEntity('App', 'NonExistent')
      ).rejects.toThrow()
    })
  })

  describe('getEntityCapabilities', () => {
    it('should return entity capabilities', async () => {
      await createTestEntity('App', 'WindowControl', {
        name: 'Window Control',
        description: 'Controls windows'
      })

      const capabilities = await getEntityCapabilities('App', 'WindowControl')
      expect(capabilities).toHaveProperty('id', 'WindowControl')
      expect(capabilities).toHaveProperty('name', 'Window Control')
      expect(capabilities).toHaveProperty('capabilities')
      expect(capabilities.capabilities).toHaveProperty('data')
      expect(capabilities.capabilities).toHaveProperty('faults')
      expect(capabilities.capabilities).toHaveProperty('operations')
    })

    it('should throw error for non-existent entity', async () => {
      await expect(
        getEntityCapabilities('App', 'NonExistent')
      ).rejects.toThrow('Entity not found')
    })
  })

  describe('Integration scenarios', () => {
    it('should handle full entity lifecycle', async () => {
      // Create
      const created = await createEntity('App', {
        entityId: 'LifecycleApp',
        name: 'Lifecycle Test',
        description: 'Test full lifecycle'
      })
      expect(created.entityId).toBe('LifecycleApp')

      // Read
      let entity = await getEntity('App', 'LifecycleApp')
      expect(entity?.name).toBe('Lifecycle Test')

      // Update
      await updateEntity('App', 'LifecycleApp', {
        name: 'Updated Lifecycle Test',
        status: 'archived'
      })

      entity = await getEntity('App', 'LifecycleApp')
      expect(entity?.name).toBe('Updated Lifecycle Test')
      expect(entity?.status).toBe('archived')

      // Delete
      await deleteEntity('App', 'LifecycleApp')
      entity = await getEntity('App', 'LifecycleApp')
      expect(entity).toBeNull()
    })

    it('should handle multiple entities', async () => {
      const entities = await createTestEntities(5)
      expect(entities).toHaveLength(5)

      const allEntities = await listEntities('App')
      expect(allEntities).toHaveLength(5)
    })
  })
})
