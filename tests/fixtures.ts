import { prisma } from '../../lib/prisma'

/**
 * Test fixture: Create a test entity
 */
export async function createTestEntity(
  collection: string = 'App',
  entityId: string = 'TestApp',
  overrides: any = {}
) {
  return prisma.sOVDEntity.create({
    data: {
      entityId,
      collection,
      name: overrides.name || `${collection}-${entityId}`,
      type: overrides.type || 'test',
      status: overrides.status || 'active',
      description: overrides.description || 'Test entity',
      metadata: overrides.metadata || {}
    }
  })
}

/**
 * Test fixture: Create multiple test entities
 */
export async function createTestEntities(count: number = 3) {
  const entities = []
  for (let i = 0; i < count; i++) {
    entities.push(
      await createTestEntity('App', `TestApp${i}`, {
        name: `Test App ${i}`
      })
    )
  }
  return entities
}

/**
 * Test fixture: Create test data value
 */
export async function createTestDataValue(
  entityId: string,
  dataId: string = 'TestData',
  overrides: any = {}
) {
  return prisma.dataValue.create({
    data: {
      entityId,
      dataId,
      value: JSON.stringify(overrides.value || 42),
      type: overrides.type || 'dynamic',
      category: overrides.category || 'currentData',
      status: overrides.status || 'active',
      unit: overrides.unit || '°C'
    }
  })
}

/**
 * Test fixture: Create test fault
 */
export async function createTestFault(
  entityId: string,
  code: string = 'DTC-001',
  overrides: any = {}
) {
  return prisma.fault.create({
    data: {
      entityId,
      code,
      title: overrides.title || `Fault ${code}`,
      description: overrides.description || 'Test fault',
      status: overrides.status || 'active',
      severity: overrides.severity || 'high',
      metadata: overrides.metadata || {}
    }
  })
}

/**
 * Test fixture: Create test operation
 */
export async function createTestOperation(
  entityId: string,
  operationId: string = 'restart',
  overrides: any = {}
) {
  return prisma.operation.create({
    data: {
      entityId,
      operationId,
      name: overrides.name || `Operation ${operationId}`,
      description: overrides.description || 'Test operation',
      parameters: overrides.parameters || {},
      expectedOutput: overrides.expectedOutput || {},
      status: overrides.status || 'available',
      metadata: overrides.metadata || {}
    }
  })
}

/**
 * Test fixture: Create test lock
 */
export async function createTestLock(entityId: string) {
  return prisma.lock.create({
    data: {
      entityId
    }
  })
}

/**
 * Test fixture: Create test log entry
 */
export async function createTestLogEntry(
  entityId: string,
  overrides: any = {}
) {
  return prisma.logEntry.create({
    data: {
      entityId,
      severity: overrides.severity || 'info',
      message: overrides.message || 'Test log entry',
      category: overrides.category || 'test',
      metadata: overrides.metadata || {}
    }
  })
}

/**
 * Test fixture: Create test permission
 */
export async function createTestPermission(
  role: string = 'Developer',
  overrides: any = {}
) {
  return prisma.permission.create({
    data: {
      role,
      pathPattern: overrides.pathPattern || '/v1/App/*/data',
      method: overrides.method || 'GET',
      access: overrides.access || { allowed: true }
    }
  })
}

/**
 * Helper: Get entity count
 */
export async function getEntityCount() {
  return prisma.sOVDEntity.count()
}

/**
 * Helper: Get fault count for entity
 */
export async function getFaultCount(entityId: string) {
  return prisma.fault.count({ where: { entityId } })
}

/**
 * Helper: Get all entities
 */
export async function getAllEntities() {
  return prisma.sOVDEntity.findMany()
}
