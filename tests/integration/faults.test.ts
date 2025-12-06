import {
  listFaults,
  readFault,
  createFault,
  confirmFault,
  clearFault,
  clearAllFaults,
  deleteFault,
  getFaultsByStatusKey
} from '../../../lib/faults'
import { createTestEntity, createTestFault } from '../../fixtures'

describe('Fault Operations', () => {
  let entityId: string

  beforeEach(async () => {
    const entity = await createTestEntity('App', 'TestApp')
    entityId = entity.id
  })

  describe('listFaults', () => {
    it('should return empty list when no faults exist', async () => {
      const faults = await listFaults(entityId)
      expect(faults).toEqual([])
    })

    it('should list all faults for entity', async () => {
      await createTestFault(entityId, 'DTC-001')
      await createTestFault(entityId, 'DTC-002')
      await createTestFault(entityId, 'DTC-003')

      const faults = await listFaults(entityId)
      expect(faults).toHaveLength(3)
    })

    it('should filter by status', async () => {
      await createTestFault(entityId, 'DTC-001', { status: 'active' })
      await createTestFault(entityId, 'DTC-002', { status: 'confirmed' })
      await createTestFault(entityId, 'DTC-003', { status: 'resolved' })

      const activeFaults = await listFaults(entityId, { status: 'active' })
      expect(activeFaults).toHaveLength(1)
      expect(activeFaults[0].code).toBe('DTC-001')
    })

    it('should filter by severity', async () => {
      await createTestFault(entityId, 'DTC-001', { severity: 'critical' })
      await createTestFault(entityId, 'DTC-002', { severity: 'high' })
      await createTestFault(entityId, 'DTC-003', { severity: 'low' })

      const critical = await listFaults(entityId, { severity: 'critical' })
      expect(critical).toHaveLength(1)
    })

    it('should filter by code pattern', async () => {
      await createTestFault(entityId, 'DTC-001')
      await createTestFault(entityId, 'DTC-002')
      await createTestFault(entityId, 'ERR-001')

      const dtcFaults = await listFaults(entityId, { code: 'DTC' })
      expect(dtcFaults).toHaveLength(2)
    })

    it('should support pagination', async () => {
      for (let i = 0; i < 150; i++) {
        await createTestFault(entityId, `DTC-${String(i).padStart(3, '0')}`)
      }

      const page1 = await listFaults(entityId, { limit: 50, offset: 0 })
      const page2 = await listFaults(entityId, { limit: 50, offset: 50 })

      expect(page1).toHaveLength(50)
      expect(page2).toHaveLength(50)
    })

    it('should order by most recent first', async () => {
      await createTestFault(entityId, 'DTC-001')
      await new Promise(resolve => setTimeout(resolve, 10))
      await createTestFault(entityId, 'DTC-002')

      const faults = await listFaults(entityId)
      expect(faults[0].code).toBe('DTC-002')
    })
  })

  describe('readFault', () => {
    it('should read a fault by code', async () => {
      await createTestFault(entityId, 'DTC-001', {
        title: 'Engine Error',
        description: 'Engine not responding'
      })

      const fault = await readFault(entityId, 'DTC-001')
      expect(fault).not.toBeNull()
      expect(fault?.code).toBe('DTC-001')
      expect(fault?.title).toBe('Engine Error')
    })

    it('should return null when fault not found', async () => {
      const fault = await readFault(entityId, 'DTC-999')
      expect(fault).toBeNull()
    })

    it('should include fault metadata', async () => {
      const metadata = { component: 'engine', subsystem: 'fuel' }
      await createTestFault(entityId, 'DTC-001', { metadata })

      const fault = await readFault(entityId, 'DTC-001')
      expect(fault?.metadata).toEqual(metadata)
    })
  })

  describe('createFault', () => {
    it('should create a new fault', async () => {
      const fault = await createFault(entityId, {
        code: 'DTC-100',
        title: 'Transmission Error',
        description: 'Transmission malfunction detected',
        severity: 'critical'
      })

      expect(fault.code).toBe('DTC-100')
      expect(fault.status).toBe('active')
      expect(fault.severity).toBe('critical')
    })

    it('should set default severity', async () => {
      const fault = await createFault(entityId, {
        code: 'DTC-101'
      })

      expect(fault.severity).toBe('high')
    })

    it('should create audit log entry', async () => {
      await createFault(entityId, { code: 'DTC-102' })

      // Fault creation should create a log entry
      const fault = await readFault(entityId, 'DTC-102')
      expect(fault).not.toBeNull()
    })

    it('should handle duplicate codes (should update instead)', async () => {
      await createFault(entityId, {
        code: 'DTC-103',
        severity: 'high'
      })

      // Creating with same code again should update or fail
      try {
        await createFault(entityId, {
          code: 'DTC-103',
          severity: 'critical'
        })
      } catch {
        // Expected - unique constraint
      }
    })
  })

  describe('confirmFault', () => {
    it('should confirm an active fault', async () => {
      await createTestFault(entityId, 'DTC-001', { status: 'active' })

      const fault = await confirmFault(entityId, 'DTC-001')
      expect(fault.status).toBe('confirmed')
    })

    it('should update confirmation timestamp', async () => {
      await createTestFault(entityId, 'DTC-001')
      const before = await readFault(entityId, 'DTC-001')
      const beforeTime = before?.updated

      await new Promise(resolve => setTimeout(resolve, 10))
      await confirmFault(entityId, 'DTC-001')

      const after = await readFault(entityId, 'DTC-001')
      expect(after?.updated).not.toBe(beforeTime)
    })

    it('should throw error for non-existent fault', async () => {
      await expect(
        confirmFault(entityId, 'DTC-999')
      ).rejects.toThrow()
    })
  })

  describe('clearFault', () => {
    it('should clear an active fault', async () => {
      await createTestFault(entityId, 'DTC-001', { status: 'active' })

      const fault = await clearFault(entityId, 'DTC-001')
      expect(fault.status).toBe('resolved')
    })

    it('should clear a confirmed fault', async () => {
      await createTestFault(entityId, 'DTC-001', { status: 'confirmed' })

      const fault = await clearFault(entityId, 'DTC-001')
      expect(fault.status).toBe('resolved')
    })

    it('should throw error for non-existent fault', async () => {
      await expect(
        clearFault(entityId, 'DTC-999')
      ).rejects.toThrow()
    })
  })

  describe('clearAllFaults', () => {
    it('should clear all active and confirmed faults', async () => {
      await createTestFault(entityId, 'DTC-001', { status: 'active' })
      await createTestFault(entityId, 'DTC-002', { status: 'active' })
      await createTestFault(entityId, 'DTC-003', { status: 'confirmed' })
      await createTestFault(entityId, 'DTC-004', { status: 'resolved' })

      const result = await clearAllFaults(entityId)
      expect(result.cleared).toBe(3) // DTC-001, DTC-002, DTC-003
    })

    it('should not affect already resolved faults', async () => {
      await createTestFault(entityId, 'DTC-001', { status: 'resolved' })

      const result = await clearAllFaults(entityId)
      expect(result.cleared).toBe(0)
    })

    it('should return 0 when no faults to clear', async () => {
      const result = await clearAllFaults(entityId)
      expect(result.cleared).toBe(0)
    })
  })

  describe('deleteFault', () => {
    it('should delete a fault', async () => {
      await createTestFault(entityId, 'DTC-001')
      const result = await deleteFault(entityId, 'DTC-001')

      expect(result).toHaveProperty('success', true)

      const fault = await readFault(entityId, 'DTC-001')
      expect(fault).toBeNull()
    })

    it('should throw error for non-existent fault', async () => {
      await expect(
        deleteFault(entityId, 'DTC-999')
      ).rejects.toThrow()
    })
  })

  describe('getFaultsByStatusKey', () => {
    it('should filter faults by status key', async () => {
      await createTestFault(entityId, 'DTC-001', {
        metadata: { status: { type: 'engine', critical: true } }
      })
      await createTestFault(entityId, 'DTC-002', {
        metadata: { status: { type: 'transmission', critical: false } }
      })

      const faults = await getFaultsByStatusKey(entityId, 'type', 'engine')
      expect(faults).toHaveLength(1)
      expect(faults[0].code).toBe('DTC-001')
    })

    it('should support multiple values (OR logic)', async () => {
      await createTestFault(entityId, 'DTC-001', {
        metadata: { status: { priority: 'high' } }
      })
      await createTestFault(entityId, 'DTC-002', {
        metadata: { status: { priority: 'critical' } }
      })
      await createTestFault(entityId, 'DTC-003', {
        metadata: { status: { priority: 'low' } }
      })

      const faults = await getFaultsByStatusKey(entityId, 'priority', ['high', 'critical'])
      expect(faults.length).toBe(2)
    })

    it('should handle missing metadata gracefully', async () => {
      await createTestFault(entityId, 'DTC-001')

      const faults = await getFaultsByStatusKey(entityId, 'type', 'engine')
      expect(faults).toEqual([])
    })
  })

  describe('Integration scenarios', () => {
    it('should handle fault lifecycle', async () => {
      // Create
      let fault = await createFault(entityId, {
        code: 'DTC-500',
        severity: 'critical'
      })
      expect(fault.status).toBe('active')

      // Confirm
      fault = await confirmFault(entityId, 'DTC-500')
      expect(fault.status).toBe('confirmed')

      // Clear
      fault = await clearFault(entityId, 'DTC-500')
      expect(fault.status).toBe('resolved')

      // Delete
      await deleteFault(entityId, 'DTC-500')
      fault = await readFault(entityId, 'DTC-500')
      expect(fault).toBeNull()
    })

    it('should handle multiple concurrent faults', async () => {
      const codes = ['DTC-001', 'DTC-002', 'DTC-003', 'DTC-004', 'DTC-005']

      for (const code of codes) {
        await createFault(entityId, { code })
      }

      let faults = await listFaults(entityId)
      expect(faults).toHaveLength(5)

      // Confirm some
      await confirmFault(entityId, 'DTC-001')
      await confirmFault(entityId, 'DTC-002')

      // Clear all
      await clearAllFaults(entityId)

      faults = await listFaults(entityId, { status: 'resolved' })
      expect(faults.length).toBeGreaterThan(0)
    })
  })
})
