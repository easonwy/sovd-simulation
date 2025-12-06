import { prisma } from './prisma'
import type { DataValue } from '@prisma/client'

export interface DataFilters {
  category?: string
  status?: string
  limit?: number
  offset?: number
}

export interface DataHistoryOptions {
  timeRange?: '1h' | '6h' | '24h' | '7d' | '30d'
  bucketSize?: 'minute' | 'hour' | 'day'
}

/**
 * Read a single data value
 */
export async function readDataValue(entityId: string, dataId: string) {
  try {
    const dataValue = await prisma.dataValue.findUnique({
      where: {
        entityId_dataId: {
          dataId,
          entityId
        }
      }
    })

    if (!dataValue) {
      return null
    }

    return {
      id: dataValue.dataId,
      value: JSON.parse(dataValue.value),
      type: dataValue.type,
      unit: dataValue.unit,
      category: dataValue.category,
      status: dataValue.status,
      timestamp: dataValue.timestamp
    }
  } catch (error) {
    console.error(`Failed to read data value ${entityId}/${dataId}:`, error)
    throw new Error(`Data read failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Write a data value
 */
export async function writeDataValue(entityId: string, dataId: string, value: unknown) {
  try {
    const now = new Date()

    // Upsert data value and create snapshot for history
    const dataValue = await prisma.dataValue.upsert({
      where: {
        entityId_dataId: {
          dataId,
          entityId
        }
      },
      update: {
        value: JSON.stringify(value),
        status: 'updated',
        timestamp: now
      },
      create: {
        dataId,
        entityId,
        value: JSON.stringify(value),
        type: 'dynamic',
        status: 'active',
        timestamp: now
      }
    })

    // Create snapshot for time-series history
    await prisma.dataSnapshot.create({
      data: {
        dataId,
        entityId,
        value: JSON.stringify(value),
        timestamp: now
      }
    })

    return {
      id: dataValue.dataId,
      value,
      status: dataValue.status,
      timestamp: dataValue.timestamp
    }
  } catch (error) {
    console.error(`Failed to write data value ${entityId}/${dataId}:`, error)
    throw new Error(`Data write failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * List all data values for an entity
 */
export async function listDataValues(entityId: string, filters?: DataFilters) {
  try {
    const skip = filters?.offset || 0
    const take = filters?.limit || 100

    const dataValues = await prisma.dataValue.findMany({
      where: {
        entityId,
        ...(filters?.category && { category: filters.category }),
        ...(filters?.status && { status: filters.status })
      },
      skip,
      take,
      orderBy: { timestamp: 'desc' }
    })

    return dataValues.map(dv => ({
      id: dv.dataId,
      value: JSON.parse(dv.value),
      type: dv.type,
      unit: dv.unit,
      category: dv.category,
      status: dv.status,
      timestamp: dv.timestamp
    }))
  } catch (error) {
    console.error(`Failed to list data values for entity ${entityId}:`, error)
    throw new Error(`Data listing failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Get historical data values (time-series)
 */
export async function getDataHistory(
  entityId: string,
  dataId: string,
  options?: DataHistoryOptions
) {
  try {
    const timeRange = options?.timeRange || '24h'
    const bucketSize = options?.bucketSize || 'hour'

    // Calculate date range
    const now = new Date()
    let startTime: Date

    switch (timeRange) {
      case '1h':
        startTime = new Date(now.getTime() - 60 * 60 * 1000)
        break
      case '6h':
        startTime = new Date(now.getTime() - 6 * 60 * 60 * 1000)
        break
      case '24h':
        startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000)
        break
      case '7d':
        startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case '30d':
        startTime = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        break
      default:
        startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    }

    // Fetch snapshots
    const snapshots = await prisma.dataSnapshot.findMany({
      where: {
        dataId,
        entityId,
        timestamp: { gte: startTime, lte: now }
      },
      orderBy: { timestamp: 'asc' }
    })

    // Group by bucket and aggregate
    const buckets = new Map<string, { timestamps: Date[]; values: number[] }>()

    snapshots.forEach(snapshot => {
      const bucketKey = getBucketKey(snapshot.timestamp, bucketSize)
      if (!buckets.has(bucketKey)) {
        buckets.set(bucketKey, { timestamps: [], values: [] })
      }

      const bucket = buckets.get(bucketKey)!
      bucket.timestamps.push(snapshot.timestamp)

      try {
        const value = JSON.parse(snapshot.value)
        if (typeof value === 'number') {
          bucket.values.push(value)
        }
      } catch {
        // Skip non-numeric values
      }
    })

    // Create aggregated response
    const history = Array.from(buckets.entries()).map(([bucketKey, data]) => {
      const values = data.values
      const avg = values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0
      const min = values.length > 0 ? Math.min(...values) : 0
      const max = values.length > 0 ? Math.max(...values) : 0

      return {
        timestamp: new Date(bucketKey),
        value: avg,
        min,
        max,
        count: data.timestamps.length
      }
    })

    return history
  } catch (error) {
    console.error(`Failed to get data history for ${entityId}/${dataId}:`, error)
    throw new Error(`Data history lookup failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Create a data list (batch of data IDs)
 */
export async function createDataList(entityId: string, dataIds: string[]) {
  try {
    // In the current schema, data-lists are represented as arrays of data IDs
    // This could be extended to create a DataList model if needed
    const dataValues = await prisma.dataValue.findMany({
      where: {
        entityId,
        dataId: { in: dataIds }
      }
    })

    return {
      id: `list_${Date.now()}`,
      entityId,
      dataIds,
      count: dataValues.length,
      values: dataValues.map(dv => ({
        id: dv.dataId,
        value: JSON.parse(dv.value),
        category: dv.category
      }))
    }
  } catch (error) {
    console.error(`Failed to create data list for entity ${entityId}:`, error)
    throw new Error(`Data list creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Get a data list by ID
 */
export async function getDataList(entityId: string, listId: string) {
  try {
    // Parse list ID to get data IDs
    // This is a simplified implementation - could be extended with a DataList model
    const dataValues = await prisma.dataValue.findMany({
      where: { entityId },
      take: 50
    })

    return {
      id: listId,
      entityId,
      values: dataValues.map(dv => ({
        id: dv.dataId,
        value: JSON.parse(dv.value),
        category: dv.category
      }))
    }
  } catch (error) {
    console.error(`Failed to get data list ${listId} for entity ${entityId}:`, error)
    throw new Error(`Data list lookup failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Delete a data value
 */
export async function deleteDataValue(entityId: string, dataId: string) {
  try {
    await prisma.dataValue.delete({
      where: {
        entityId_dataId: {
          dataId,
          entityId
        }
      }
    })

    return { success: true }
  } catch (error) {
    console.error(`Failed to delete data value ${entityId}/${dataId}:`, error)
    throw new Error(`Data deletion failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Helper: Get bucket key for time aggregation
 */
function getBucketKey(date: Date, bucketSize: 'minute' | 'hour' | 'day'): string {
  const d = new Date(date)

  switch (bucketSize) {
    case 'minute':
      d.setSeconds(0, 0)
      return d.toISOString()
    case 'hour':
      d.setMinutes(0, 0, 0)
      return d.toISOString()
    case 'day':
      d.setHours(0, 0, 0, 0)
      return d.toISOString()
  }
}
