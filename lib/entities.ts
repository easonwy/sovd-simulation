import { prisma } from './prisma'
import type { SOVDEntity, DataValue, Fault, Lock, LogEntry, Operation, Mode, Configuration } from '@prisma/client'

export interface EntityData {
  entityId: string
  name: string
  collection: string
  type: string
  category?: string
  description?: string
  status?: string
  metadata?: Record<string, unknown>
}

/**
 * Get a single entity by collection and ID
 */
export async function getEntity(collection: string, id: string) {
  try {
    const entity = await prisma.sOVDEntity.findUnique({
      where: {
        entityId_collection: {
          entityId: id,
          collection
        }
      },
      include: {
        dataValues: true,
        faults: true,
        locks: true,
        logEntries: true
      }
    })
    return entity
  } catch (error) {
    console.error(`Failed to get entity ${collection}/${id}:`, error)
    throw new Error(`Entity lookup failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * List all entities in a collection
 */
export async function listEntities(collection: string) {
  try {
    const entities = await prisma.sOVDEntity.findMany({
      where: { collection },
      include: {
        _count: {
          select: { dataValues: true, faults: true, locks: true }
        }
      }
    })
    return entities
  } catch (error) {
    console.error(`Failed to list entities for collection ${collection}:`, error)
    throw new Error(`Entity listing failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Create a new entity
 */
export async function createEntity(collection: string, data: EntityData) {
  try {
    const entity = await prisma.sOVDEntity.create({
      data: {
        entityId: data.entityId,
        collection,
        name: data.name,
        type: data.type,
        category: data.category || null,
        description: data.description || null,
        status: data.status || 'active',
        metadata: data.metadata ? JSON.stringify(data.metadata) : null
      }
    })
    return entity
  } catch (error) {
    console.error(`Failed to create entity ${collection}/${data.entityId}:`, error)
    throw new Error(`Entity creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Update an existing entity
 */
export async function updateEntity(collection: string, id: string, data: Partial<EntityData>) {
  try {
    const entity = await prisma.sOVDEntity.update({
      where: {
        entityId_collection: {
          entityId: id,
          collection
        }
      },
      data: {
        name: data.name,
        type: data.type,
        category: data.category,
        description: data.description,
        status: data.status,
        ...(data.metadata && { metadata: JSON.stringify(data.metadata) })
      }
    })
    return entity
  } catch (error) {
    console.error(`Failed to update entity ${collection}/${id}:`, error)
    throw new Error(`Entity update failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Delete an entity and all related data
 */
export async function deleteEntity(collection: string, id: string) {
  try {
    // Cascade delete is handled by Prisma schema
    const entity = await prisma.sOVDEntity.delete({
      where: {
        entityId_collection: {
          entityId: id,
          collection
        }
      }
    })
    return entity
  } catch (error) {
    console.error(`Failed to delete entity ${collection}/${id}:`, error)
    throw new Error(`Entity deletion failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Get entity capabilities/schema
 */
export async function getEntityCapabilities(collection: string, id: string) {
  try {
    const entity = await getEntity(collection, id)
    if (!entity) {
      throw new Error('Entity not found')
    }

    return {
      id: entity.entityId,
      collection: entity.collection,
      name: entity.name,
      type: entity.type,
      description: entity.description,
      capabilities: {
        data: {
          readable: true,
          writable: true,
          description: 'Read and write data values'
        },
        faults: {
          readable: true,
          confirmable: true,
          description: 'Read and manage faults'
        },
        operations: {
          readable: true,
          executable: true,
          description: 'Execute operations'
        },
        locks: {
          readable: true,
          writable: true,
          description: 'Manage locks'
        }
      }
    }
  } catch (error) {
    console.error(`Failed to get entity capabilities ${collection}/${id}:`, error)
    throw new Error(`Capability lookup failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Get related entities (subareas, subcomponents, related-apps, related-components)
 */
export async function getRelatedEntities(collection: string, id: string, relationType: string) {
  try {
    // For now, return empty array as relationships are not fully modeled in schema
    // This can be extended based on actual relationship requirements
    return []
  } catch (error) {
    console.error(`Failed to get related entities for ${collection}/${id} (${relationType}):`, error)
    throw new Error(`Related entity lookup failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Create a lock for an entity
 */
export async function createLock(entityId: string) {
  try {
    const lock = await prisma.lock.create({
      data: {
        entityId
      }
    })
    return { id: lock.id, createdAt: lock.createdAt }
  } catch (error) {
    console.error(`Failed to create lock for entity ${entityId}:`, error)
    throw new Error(`Lock creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * List all locks for an entity
 */
export async function listLocks(entityId: string) {
  try {
    const locks = await prisma.lock.findMany({
      where: { entityId },
      orderBy: { createdAt: 'desc' }
    })
    return locks.map(lock => ({
      id: lock.id,
      createdAt: lock.createdAt
    }))
  } catch (error) {
    console.error(`Failed to list locks for entity ${entityId}:`, error)
    throw new Error(`Lock listing failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Delete a lock
 */
export async function deleteLock(lockId: string) {
  try {
    await prisma.lock.delete({
      where: { id: lockId }
    })
    return { success: true }
  } catch (error) {
    console.error(`Failed to delete lock ${lockId}:`, error)
    throw new Error(`Lock deletion failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}
