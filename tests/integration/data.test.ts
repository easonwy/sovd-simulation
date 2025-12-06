import {
  readDataValue,
  writeDataValue,
  listDataValues,
  getDataHistory,
  createDataList,
  deleteDataValue
} from '../../../lib/data'
import {
  createTestEntity,
  createTestDataValue,
  getFaultCount
} from '../../fixtures'

describe('Data Operations', () => {
  let entityId: string

  beforeEach(async () => {
    const entity = await createTestEntity('App', 'TestApp')
    entityId = entity.id
  })

  describe('writeDataValue', () => {
    it('should write a new data value', async () => {
      const result = await writeDataValue(entityId, 'Speed', 100)

      expect(result).toHaveProperty('id', 'Speed')
      expect(result).toHaveProperty('value', 100)
      expect(result).toHaveProperty('status', 'active')
    })

    it('should update existing data value', async () => {
      await writeDataValue(entityId, 'Speed', 50)
      const result = await writeDataValue(entityId, 'Speed', 75)

      expect(result.value).toBe(75)
    })

    it('should handle complex objects', async () => {
      const complexValue = { x: 10, y: 20, z: 30 }
      const result = await writeDataValue(entityId, 'Coordinates', complexValue)

      expect(result.value).toEqual(complexValue)
    })

    it('should create snapshot for history', async () => {
      await writeDataValue(entityId, 'Speed', 100)

      // Verify data can be read back
      const data = await readDataValue(entityId, 'Speed')
      expect(data?.value).toBe(100)
    })

    it('should handle string values', async () => {
      const result = await writeDataValue(entityId, 'Status', 'running')
      expect(result.value).toBe('running')
    })

    it('should handle boolean values', async () => {
      const result = await writeDataValue(entityId, 'IsActive', true)
      expect(result.value).toBe(true)
    })
  })

  describe('readDataValue', () => {
    it('should read a data value', async () => {
      await writeDataValue(entityId, 'Temperature', 42)

      const data = await readDataValue(entityId, 'Temperature')
      expect(data).not.toBeNull()
      expect(data?.value).toBe(42)
    })

    it('should return null when data not found', async () => {
      const data = await readDataValue(entityId, 'NonExistent')
      expect(data).toBeNull()
    })

    it('should return data metadata', async () => {
      await writeDataValue(entityId, 'Temperature', 42)

      const data = await readDataValue(entityId, 'Temperature')
      expect(data).toHaveProperty('type')
      expect(data).toHaveProperty('status')
      expect(data).toHaveProperty('timestamp')
    })
  })

  describe('listDataValues', () => {
    it('should list all data values for entity', async () => {
      await writeDataValue(entityId, 'Speed', 100)
      await writeDataValue(entityId, 'Temperature', 42)
      await writeDataValue(entityId, 'Rpm', 3000)

      const dataValues = await listDataValues(entityId)
      expect(dataValues).toHaveLength(3)
    })

    it('should support pagination', async () => {
      for (let i = 0; i < 150; i++) {
        await writeDataValue(entityId, `Data${i}`, i)
      }

      const page1 = await listDataValues(entityId, { limit: 50, offset: 0 })
      const page2 = await listDataValues(entityId, { limit: 50, offset: 50 })
      const page3 = await listDataValues(entityId, { limit: 50, offset: 100 })

      expect(page1).toHaveLength(50)
      expect(page2).toHaveLength(50)
      expect(page3).toHaveLength(50)
    })

    it('should filter by category', async () => {
      await createTestDataValue(entityId, 'Data1', { category: 'currentData' })
      await createTestDataValue(entityId, 'Data2', { category: 'identData' })
      await createTestDataValue(entityId, 'Data3', { category: 'currentData' })

      const currentData = await listDataValues(entityId, { category: 'currentData' })
      expect(currentData).toHaveLength(2)
    })

    it('should filter by status', async () => {
      await createTestDataValue(entityId, 'Data1', { status: 'active' })
      await createTestDataValue(entityId, 'Data2', { status: 'inactive' })

      const active = await listDataValues(entityId, { status: 'active' })
      expect(active).toHaveLength(1)
    })

    it('should order by most recent first', async () => {
      await writeDataValue(entityId, 'Data1', 1)
      await new Promise(resolve => setTimeout(resolve, 10))
      await writeDataValue(entityId, 'Data2', 2)

      const dataValues = await listDataValues(entityId)
      expect(dataValues[0].id).toBe('Data2')
    })
  })

  describe('getDataHistory', () => {
    it('should return empty history when no snapshots exist', async () => {
      const history = await getDataHistory(entityId, 'NonExistent')
      expect(history).toEqual([])
    })

    it('should get data history with time range', async () => {
      await writeDataValue(entityId, 'Speed', 50)
      await new Promise(resolve => setTimeout(resolve, 10))
      await writeDataValue(entityId, 'Speed', 75)
      await new Promise(resolve => setTimeout(resolve, 10))
      await writeDataValue(entityId, 'Speed', 100)

      const history = await getDataHistory(entityId, 'Speed', {
        timeRange: '24h'
      })

      expect(history.length).toBeGreaterThan(0)
    })

    it('should aggregate values in buckets', async () => {
      // Write multiple values
      for (let i = 0; i < 5; i++) {
        await writeDataValue(entityId, 'Temperature', 40 + i)
        await new Promise(resolve => setTimeout(resolve, 5))
      }

      const history = await getDataHistory(entityId, 'Temperature', {
        timeRange: '1h',
        bucketSize: 'minute'
      })

      expect(history.length).toBeGreaterThan(0)
      // Check aggregation fields exist
      history.forEach(bucket => {
        expect(bucket).toHaveProperty('timestamp')
        expect(bucket).toHaveProperty('value')
        expect(bucket).toHaveProperty('min')
        expect(bucket).toHaveProperty('max')
        expect(bucket).toHaveProperty('count')
      })
    })

    it('should support different time ranges', async () => {
      await writeDataValue(entityId, 'Data', 100)

      const ranges = ['1h', '6h', '24h', '7d', '30d'] as const
      for (const range of ranges) {
        const history = await getDataHistory(entityId, 'Data', {
          timeRange: range
        })
        expect(history).toBeDefined()
      }
    })
  })

  describe('createDataList', () => {
    it('should create a data list', async () => {
      await writeDataValue(entityId, 'Data1', 1)
      await writeDataValue(entityId, 'Data2', 2)
      await writeDataValue(entityId, 'Data3', 3)

      const list = await createDataList(entityId, ['Data1', 'Data2', 'Data3'])

      expect(list).toHaveProperty('dataIds')
      expect(list.dataIds).toHaveLength(3)
      expect(list).toHaveProperty('count', 3)
      expect(list).toHaveProperty('values')
    })

    it('should handle partial list', async () => {
      await writeDataValue(entityId, 'Data1', 1)
      await writeDataValue(entityId, 'Data2', 2)

      const list = await createDataList(entityId, ['Data1', 'Data2'])
      expect(list.count).toBe(2)
    })

    it('should handle empty list', async () => {
      const list = await createDataList(entityId, [])
      expect(list.count).toBe(0)
      expect(list.values).toEqual([])
    })
  })

  describe('deleteDataValue', () => {
    it('should delete a data value', async () => {
      await writeDataValue(entityId, 'Speed', 100)
      const result = await deleteDataValue(entityId, 'Speed')

      expect(result).toHaveProperty('success', true)

      const data = await readDataValue(entityId, 'Speed')
      expect(data).toBeNull()
    })

    it('should throw error for non-existent data', async () => {
      await expect(
        deleteDataValue(entityId, 'NonExistent')
      ).rejects.toThrow()
    })
  })

  describe('Integration scenarios', () => {
    it('should handle data value lifecycle', async () => {
      // Write
      await writeDataValue(entityId, 'Temperature', 20)

      // Read
      let data = await readDataValue(entityId, 'Temperature')
      expect(data?.value).toBe(20)

      // Update
      await writeDataValue(entityId, 'Temperature', 25)

      data = await readDataValue(entityId, 'Temperature')
      expect(data?.value).toBe(25)

      // Delete
      await deleteDataValue(entityId, 'Temperature')
      data = await readDataValue(entityId, 'Temperature')
      expect(data).toBeNull()
    })

    it('should track multiple data points', async () => {
      const dataIds = ['Speed', 'Temperature', 'RPM', 'FuelLevel', 'Battery']

      for (const id of dataIds) {
        await writeDataValue(entityId, id, Math.random() * 100)
      }

      const allData = await listDataValues(entityId)
      expect(allData).toHaveLength(5)
    })
  })
})
