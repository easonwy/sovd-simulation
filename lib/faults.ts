import { prisma } from './prisma'
import type { Fault } from '@prisma/client'

export interface FaultFilters {
  status?: string
  severity?: string
  code?: string
  limit?: number
  offset?: number
}

export interface FaultData {
  code: string
  title?: string
  description?: string
  severity?: 'critical' | 'high' | 'medium' | 'low'
  status?: 'active' | 'confirmed' | 'resolved'
  metadata?: Record<string, unknown>
}

/**
 * List all faults for an entity
 */
export async function listFaults(entityId: string, filters?: FaultFilters) {
  try {
    // First, resolve the entity by its friendly entityId to get the internal ID
    const entity = await prisma.sOVDEntity.findFirst({
      where: { entityId },
      select: { id: true }
    })

    if (!entity) {
      console.warn(`Entity not found with entityId: ${entityId}`)
      return []
    }

    const skip = filters?.offset || 0
    const take = filters?.limit || 100

    // Build where clause with status filtering, using the internal entity ID
    const whereClause: any = { entityId: entity.id }

    if (filters?.status) {
      whereClause.status = filters.status
    }
    if (filters?.severity) {
      whereClause.severity = filters.severity
    }
    if (filters?.code) {
      whereClause.code = { contains: filters.code }
    }

    const faults = await prisma.fault.findMany({
      where: whereClause,
      skip,
      take,
      orderBy: { createdAt: 'desc' }
    })

    return faults.map(formatFault)
  } catch (error) {
    console.error(`Failed to list faults for entity ${entityId}:`, error)
    throw new Error(`Fault listing failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Read a single fault
 */
export async function readFault(entityId: string, code: string) {
  try {
    // Resolve entity by friendly entityId
    const entity = await prisma.sOVDEntity.findFirst({
      where: { entityId },
      select: { id: true }
    })

    if (!entity) {
      console.warn(`Entity not found with entityId: ${entityId}`)
      return null
    }

    const fault = await prisma.fault.findUnique({
      where: {
        entityId_code: {
          code,
          entityId: entity.id
        }
      }
    })

    if (!fault) {
      return null
    }

    return formatFault(fault)
  } catch (error) {
    console.error(`Failed to read fault ${entityId}/${code}:`, error)
    throw new Error(`Fault read failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Create a fault
 */
export async function createFault(entityId: string, data: FaultData) {
  try {
    // Resolve entity by friendly entityId
    const entity = await prisma.sOVDEntity.findFirst({
      where: { entityId },
      select: { id: true }
    })

    if (!entity) {
      throw new Error(`Entity not found with entityId: ${entityId}`)
    }

    const fault = await prisma.fault.create({
      data: {
        code: data.code,
        entityId: entity.id,
        title: data.title || `Fault ${data.code}`,
        description: data.description || '',
        severity: data.severity || 'high',
        status: data.status || 'active',
        metadata: data.metadata ? JSON.stringify(data.metadata) : null,
        createdAt: new Date()
      }
    })

    // Log fault creation
    await prisma.logEntry.create({
      data: {
        entityId: entity.id,
        severity: 'warning',
        message: `Fault ${fault.code} created`,
        category: 'fault',
        metadata: JSON.stringify({ code: fault.code }),
        timestamp: new Date()
      }
    })

    return formatFault(fault)
  } catch (error) {
    console.error(`Failed to create fault for entity ${entityId}:`, error)
    throw new Error(`Fault creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Confirm a fault
 */
export async function confirmFault(entityId: string, code: string) {
  try {
    // Resolve entity by friendly entityId
    const entity = await prisma.sOVDEntity.findFirst({
      where: { entityId },
      select: { id: true }
    })

    if (!entity) {
      throw new Error(`Entity not found with entityId: ${entityId}`)
    }

    const fault = await prisma.fault.update({
      where: {
        entityId_code: {
          code,
          entityId: entity.id
        }
      },
      data: {
        status: 'confirmed',
        updatedAt: new Date()
      }
    })

    // Log confirmation
    await prisma.logEntry.create({
      data: {
        entityId: entity.id,
        severity: 'info',
        message: `Fault ${code} confirmed`,
        category: 'fault',
        metadata: JSON.stringify({ code, action: 'confirmed' }),
        timestamp: new Date()
      }
    })

    return formatFault(fault)
  } catch (error) {
    console.error(`Failed to confirm fault ${entityId}/${code}:`, error)
    throw new Error(`Fault confirmation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Clear (resolve) a fault
 */
export async function clearFault(entityId: string, code: string) {
  try {
    // Resolve entity by friendly entityId
    const entity = await prisma.sOVDEntity.findFirst({
      where: { entityId },
      select: { id: true }
    })

    if (!entity) {
      throw new Error(`Entity not found with entityId: ${entityId}`)
    }

    const fault = await prisma.fault.update({
      where: {
        entityId_code: {
          code,
          entityId: entity.id
        }
      },
      data: {
        status: 'resolved',
        updatedAt: new Date()
      }
    })

    // Log resolution
    await prisma.logEntry.create({
      data: {
        entityId: entity.id,
        severity: 'info',
        message: `Fault ${code} cleared`,
        category: 'fault',
        metadata: JSON.stringify({ code, action: 'resolved' }),
        timestamp: new Date()
      }
    })

    return formatFault(fault)
  } catch (error) {
    console.error(`Failed to clear fault ${entityId}/${code}:`, error)
    throw new Error(`Fault clearing failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Clear all faults for an entity
 */
export async function clearAllFaults(entityId: string) {
  try {
    // Resolve entity by friendly entityId
    const entity = await prisma.sOVDEntity.findFirst({
      where: { entityId },
      select: { id: true }
    })

    if (!entity) {
      console.warn(`Entity not found with entityId: ${entityId}`)
      return { cleared: 0 }
    }

    const result = await prisma.fault.updateMany({
      where: { entityId: entity.id, status: { not: 'resolved' } },
      data: {
        status: 'resolved',
        updatedAt: new Date()
      }
    })

    // Log bulk clear
    if (result.count > 0) {
      await prisma.logEntry.create({
        data: {
          entityId: entity.id,
          severity: 'info',
          message: `${result.count} faults cleared`,
          category: 'fault',
          metadata: JSON.stringify({ action: 'clearAll', count: result.count }),
          timestamp: new Date()
        }
      })
    }

    return { cleared: result.count }
  } catch (error) {
    console.error(`Failed to clear all faults for entity ${entityId}:`, error)
    throw new Error(`Bulk fault clearing failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Delete a fault
 */
export async function deleteFault(entityId: string, code: string) {
  try {
    // Resolve entity by friendly entityId
    const entity = await prisma.sOVDEntity.findFirst({
      where: { entityId },
      select: { id: true }
    })

    if (!entity) {
      throw new Error(`Entity not found with entityId: ${entityId}`)
    }

    const fault = await prisma.fault.delete({
      where: {
        entityId_code: {
          code,
          entityId: entity.id
        }
      }
    })

    // Log deletion
    await prisma.logEntry.create({
      data: {
        entityId: entity.id,
        severity: 'info',
        message: `Fault ${code} deleted`,
        category: 'fault',
        metadata: JSON.stringify({ code, action: 'deleted' }),
        timestamp: new Date()
      }
    })

    return { success: true }
  } catch (error) {
    console.error(`Failed to delete fault ${entityId}/${code}:`, error)
    throw new Error(`Fault deletion failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Get faults by status with query parameter filtering
 * Supports filters like status[key]=value for fine-grained control
 */
export async function getFaultsByStatusKey(
  entityId: string,
  statusKey: string,
  values: string | string[]
) {
  try {
    // Resolve entity by friendly entityId
    const entity = await prisma.sOVDEntity.findFirst({
      where: { entityId },
      select: { id: true }
    })

    if (!entity) {
      console.warn(`Entity not found with entityId: ${entityId}`)
      return []
    }

    const valueArray = Array.isArray(values) ? values : [values]

    // Query faults and filter by status[key]
    const allFaults = await prisma.fault.findMany({
      where: { entityId: entity.id },
      orderBy: { createdAt: 'desc' }
    })

    // Filter faults where metadata.status[key] matches any value (OR logic)
    const filtered = allFaults.filter(fault => {
      try {
        const metadata = typeof fault.metadata === 'string' ? JSON.parse(fault.metadata) : fault.metadata
        const status = metadata?.status || {}
        const faultStatusKey = status[statusKey]
        return valueArray.includes(String(faultStatusKey))
      } catch {
        return false
      }
    })

    return filtered.map(formatFault)
  } catch (error) {
    console.error(`Failed to get faults by status key for entity ${entityId}:`, error)
    throw new Error(`Fault filtering failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Helper: Format fault response
 */
function formatFault(fault: Fault) {
  return {
    code: fault.code,
    title: fault.title,
    description: fault.description,
    severity: fault.severity,
    status: fault.status,
    created: fault.createdAt,
    updated: fault.updatedAt,
    metadata: fault.metadata
  }
}
