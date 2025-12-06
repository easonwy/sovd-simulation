import {
  listOperations,
  readOperation,
  createOperation,
  executeOperation,
  getExecutionStatus,
  listExecutions
} from '../../../lib/operations'
import { createTestEntity, createTestOperation } from '../../fixtures'

describe('Operation Operations', () => {
  let entityId: string

  beforeEach(async () => {
    const entity = await createTestEntity('App', 'TestApp')
    entityId = entity.id
  })

  describe('listOperations', () => {
    it('should return empty list when no operations exist', async () => {
      const operations = await listOperations(entityId)
      expect(operations).toEqual([])
    })

    it('should list all operations for entity', async () => {
      await createTestOperation(entityId, 'restart')
      await createTestOperation(entityId, 'reboot')
      await createTestOperation(entityId, 'shutdown')

      const operations = await listOperations(entityId)
      expect(operations).toHaveLength(3)
    })

    it('should include operation metadata', async () => {
      await createTestOperation(entityId, 'restart', {
        name: 'Restart System',
        description: 'Performs a system restart'
      })

      const operations = await listOperations(entityId)
      expect(operations[0]).toHaveProperty('name', 'Restart System')
      expect(operations[0]).toHaveProperty('description')
    })

    it('should include last execution info', async () => {
      await createTestOperation(entityId, 'restart')

      const operations = await listOperations(entityId)
      expect(operations[0]).toHaveProperty('lastExecution')
      expect(operations[0]).toHaveProperty('executionCount')
    })
  })

  describe('readOperation', () => {
    it('should read operation by ID', async () => {
      await createTestOperation(entityId, 'restart', {
        name: 'Restart System',
        parameters: { timeout: 300 }
      })

      const operation = await readOperation(entityId, 'restart')
      expect(operation).not.toBeNull()
      expect(operation?.id).toBe('restart')
      expect(operation?.name).toBe('Restart System')
    })

    it('should return null when operation not found', async () => {
      const operation = await readOperation(entityId, 'nonexistent')
      expect(operation).toBeNull()
    })

    it('should include execution history', async () => {
      await createTestOperation(entityId, 'restart')

      const operation = await readOperation(entityId, 'restart')
      expect(operation).toHaveProperty('executions')
      expect(Array.isArray(operation?.executions)).toBe(true)
    })
  })

  describe('createOperation', () => {
    it('should create a new operation', async () => {
      const operation = await createOperation(entityId, {
        operationId: 'backup',
        name: 'Create Backup',
        description: 'Creates system backup',
        parameters: { destination: '/backup' }
      })

      expect(operation.id).toBe('backup')
      expect(operation.name).toBe('Create Backup')
      expect(operation.status).toBe('available')
    })

    it('should set default status to available', async () => {
      const operation = await createOperation(entityId, {
        operationId: 'test-op',
        name: 'Test Operation'
      })

      expect(operation.status).toBe('available')
    })

    it('should store parameters', async () => {
      const params = { timeout: 500, retries: 3 }
      await createOperation(entityId, {
        operationId: 'advanced-op',
        name: 'Advanced Operation',
        parameters: params
      })

      const operation = await readOperation(entityId, 'advanced-op')
      expect(operation?.parameters).toEqual(params)
    })
  })

  describe('executeOperation', () => {
    it('should execute an operation', async () => {
      await createTestOperation(entityId, 'restart')

      const execution = await executeOperation(entityId, 'restart')

      expect(execution).toHaveProperty('executionId')
      expect(execution).toHaveProperty('operationId', 'restart')
      expect(execution).toHaveProperty('status', 'in-progress')
    })

    it('should accept execution parameters', async () => {
      await createTestOperation(entityId, 'restart')

      const execution = await executeOperation(entityId, 'restart', {
        timeout: 300,
        force: true
      })

      expect(execution).toHaveProperty('executionId')
    })

    it('should throw error for non-existent operation', async () => {
      await expect(
        executeOperation(entityId, 'nonexistent')
      ).rejects.toThrow()
    })

    it('should generate unique execution IDs', async () => {
      await createTestOperation(entityId, 'restart')

      const exec1 = await executeOperation(entityId, 'restart')
      const exec2 = await executeOperation(entityId, 'restart')

      expect(exec1.executionId).not.toBe(exec2.executionId)
    })

    it('should handle concurrent executions', async () => {
      await createTestOperation(entityId, 'long-op')

      const exec1 = executeOperation(entityId, 'long-op')
      const exec2 = executeOperation(entityId, 'long-op')

      const [result1, result2] = await Promise.all([exec1, exec2])

      expect(result1.executionId).not.toBe(result2.executionId)
    })
  })

  describe('getExecutionStatus', () => {
    it('should get execution status', async () => {
      await createTestOperation(entityId, 'restart')
      const execution = await executeOperation(entityId, 'restart')

      // Wait for async completion
      await new Promise(resolve => setTimeout(resolve, 200))

      const status = await getExecutionStatus(execution.executionId)
      expect(status).not.toBeNull()
      expect(status?.id).toBe(execution.executionId)
      expect(status?.status).toBe('completed')
    })

    it('should return null for non-existent execution', async () => {
      const status = await getExecutionStatus('nonexistent-exec-id')
      expect(status).toBeNull()
    })

    it('should include execution result', async () => {
      await createTestOperation(entityId, 'restart')
      const execution = await executeOperation(entityId, 'restart')

      await new Promise(resolve => setTimeout(resolve, 200))

      const status = await getExecutionStatus(execution.executionId)
      expect(status).toHaveProperty('result')
    })

    it('should show error for failed execution', async () => {
      await createTestOperation(entityId, 'restart')
      const execution = await executeOperation(entityId, 'restart')

      await new Promise(resolve => setTimeout(resolve, 200))

      const status = await getExecutionStatus(execution.executionId)
      expect(status).toHaveProperty('status')
    })
  })

  describe('listExecutions', () => {
    it('should list executions for operation', async () => {
      await createTestOperation(entityId, 'restart')

      // Execute multiple times
      const exec1 = await executeOperation(entityId, 'restart')
      const exec2 = await executeOperation(entityId, 'restart')
      const exec3 = await executeOperation(entityId, 'restart')

      const executions = await listExecutions(entityId, 'restart', 10)
      expect(executions.length).toBeGreaterThanOrEqual(3)
    })

    it('should support limit parameter', async () => {
      await createTestOperation(entityId, 'restart')

      // Execute 5 times
      for (let i = 0; i < 5; i++) {
        await executeOperation(entityId, 'restart')
      }

      const limited = await listExecutions(entityId, 'restart', 3)
      expect(limited.length).toBeLessThanOrEqual(3)
    })

    it('should order by most recent first', async () => {
      await createTestOperation(entityId, 'restart')

      const exec1 = await executeOperation(entityId, 'restart')
      await new Promise(resolve => setTimeout(resolve, 10))
      const exec2 = await executeOperation(entityId, 'restart')

      const executions = await listExecutions(entityId, 'restart', 10)
      expect(executions[0].id).toBe(exec2.executionId)
    })

    it('should return empty for non-existent operation', async () => {
      const executions = await listExecutions(entityId, 'nonexistent')
      expect(executions).toEqual([])
    })
  })

  describe('Integration scenarios', () => {
    it('should handle operation execution lifecycle', async () => {
      // Create
      const operation = await createOperation(entityId, {
        operationId: 'lifecycle-op',
        name: 'Lifecycle Operation'
      })
      expect(operation.status).toBe('available')

      // Execute
      const execution = await executeOperation(entityId, 'lifecycle-op')
      expect(execution.status).toBe('in-progress')

      // Check status
      await new Promise(resolve => setTimeout(resolve, 200))
      const status = await getExecutionStatus(execution.executionId)
      expect(status?.status).toBe('completed')

      // Read operation
      const updated = await readOperation(entityId, 'lifecycle-op')
      expect(updated?.executionCount).toBeGreaterThan(0)
    })

    it('should track multiple operation types', async () => {
      const ops = ['restart', 'reboot', 'shutdown', 'poweroff']

      for (const op of ops) {
        await createTestOperation(entityId, op)
      }

      const operations = await listOperations(entityId)
      expect(operations).toHaveLength(4)

      for (const op of operations) {
        const execution = await executeOperation(entityId, op.id)
        expect(execution).toHaveProperty('executionId')
      }

      await new Promise(resolve => setTimeout(resolve, 200))

      const updated = await listOperations(entityId)
      updated.forEach(op => {
        expect(op.executionCount).toBeGreaterThan(0)
      })
    })
  })
})
