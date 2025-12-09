import { prisma } from './prisma'
import type { Operation, OperationExecution } from '@prisma/client'

export interface OperationData {
  operationId: string
  name: string
  description?: string
  parameters?: Record<string, unknown>
  expectedOutput?: Record<string, unknown>
  metadata?: Record<string, unknown>
}

export interface ExecutionParams {
  [key: string]: unknown
}

/**
 * List all operations for an entity
 */
export async function listOperations(entityId: string) {
  try {
    const operations = await prisma.operation.findMany({
      where: { entityId },
      include: {
        executions: {
          take: 5,
          orderBy: { timestamp: 'desc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return operations.map(op => ({
      id: op.operationId,
      name: op.name,
      description: op.description,
      parameters: op.parameters,
      expectedOutput: op.expectedOutput,
      status: op.status,
      lastExecution: op.executions[0] || null,
      executionCount: op.executions.length
    }))
  } catch (error) {
    console.error(`Failed to list operations for entity ${entityId}:`, error)
    throw new Error(`Operation listing failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Read a single operation
 */
export async function readOperation(entityId: string, operationId: string) {
  try {
    const operation = await prisma.operation.findUnique({
      where: {
        entityId_operationId: {
          operationId,
          entityId
        }
      },
      include: {
        executions: {
          orderBy: { timestamp: 'desc' },
          take: 10
        }
      }
    })

    if (!operation) {
      return null
    }

    return {
      id: operation.operationId,
      name: operation.name,
      description: operation.description,
      parameters: operation.parameters,
      expectedOutput: operation.expectedOutput,
      status: operation.status,
      executions: operation.executions.map(ex => ({
        id: ex.executionId,
        status: ex.status,
        result: ex.result,
        error: ex.error,
        timestamp: ex.timestamp
      }))
    }
  } catch (error) {
    console.error(`Failed to read operation ${entityId}/${operationId}:`, error)
    throw new Error(`Operation read failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Create an operation
 */
export async function createOperation(entityId: string, data: OperationData) {
  try {
    const operation = await prisma.operation.create({
      data: {
        operationId: data.operationId,
        entityId,
        name: data.name,
        description: data.description || '',
        parameters: data.parameters ? JSON.stringify(data.parameters) : null,
        expectedOutput: data.expectedOutput ? JSON.stringify(data.expectedOutput) : null,
        status: 'available',
        metadata: data.metadata ? JSON.stringify(data.metadata) : null,
        createdAt: new Date()
      }
    })

    // Log operation creation
    await prisma.logEntry.create({
      data: {
        entityId,
        severity: 'info',
        message: `Operation ${operation.operationId} created`,
        category: 'operation',
        metadata: JSON.stringify({ operationId: operation.operationId }),
        timestamp: new Date()
      }
    })

    return {
      id: operation.operationId,
      name: operation.name,
      status: operation.status
    }
  } catch (error) {
    console.error(`Failed to create operation for entity ${entityId}:`, error)
    throw new Error(`Operation creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Execute an operation
 */
export async function executeOperation(
  entityId: string,
  operationId: string,
  params?: ExecutionParams
) {
  try {
    // Verify operation exists
    const operation = await prisma.operation.findUnique({
      where: {
        entityId_operationId: {
          operationId,
          entityId
        }
      }
    })

    if (!operation) {
      throw new Error('Operation not found')
    }

    // Create execution record
    const executionId = `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    const execution = await prisma.operationExecution.create({
      data: {
        executionId,
        operationId,
        entityId,
        parameters: params ? JSON.stringify(params) : null,
        status: 'in-progress',
        timestamp: new Date()
      }
    })

    // Log execution start
    await prisma.logEntry.create({
      data: {
        entityId,
        severity: 'info',
        message: `Operation ${operationId} started (${executionId})`,
        category: 'operation',
        metadata: JSON.stringify({ operationId, executionId, action: 'started' }),
        timestamp: new Date()
      }
    })

    // Simulate operation execution (in real scenarios, this would call actual endpoints)
    // For now, mark as completed successfully
    setTimeout(async () => {
      await completeOperationExecution(executionId, {
        status: 'completed',
        output: { success: true, message: 'Operation executed successfully' }
      })
    }, 100)

    return {
      executionId,
      operationId,
      status: 'in-progress',
      timestamp: execution.timestamp
    }
  } catch (error) {
    console.error(`Failed to execute operation ${entityId}/${operationId}:`, error)
    throw new Error(`Operation execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Get execution status
 */
export async function getExecutionStatus(executionId: string) {
  try {
    const execution = await prisma.operationExecution.findUnique({
      where: { executionId }
    })

    if (!execution) {
      return null
    }

    return {
      id: execution.executionId,
      operationId: execution.operationId,
      status: execution.status,
      result: execution.result,
      error: execution.error,
      timestamp: execution.timestamp
    }
  } catch (error) {
    console.error(`Failed to get execution status for ${executionId}:`, error)
    throw new Error(`Execution status lookup failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Complete an operation execution (internal use)
 */
export async function completeOperationExecution(
  executionId: string,
  result: {
    status: 'completed' | 'failed'
    output?: Record<string, unknown>
    error?: string
  }
) {
  try {
    const execution = await prisma.operationExecution.update({
      where: { executionId },
      data: {
        status: result.status,
        result: result.output || {},
        error: result.error || null
      },
      include: { operation: true }
    })

    // Log completion
    await prisma.logEntry.create({
      data: {
        entityId: execution.entityId,
        severity: result.status === 'completed' ? 'info' : 'error',
        message: `Operation ${execution.operationId} ${result.status}`,
        category: 'operation',
        metadata: JSON.stringify({
          operationId: execution.operationId,
          executionId,
          status: result.status
        }),
        timestamp: new Date()
      }
    })

    return execution
  } catch (error) {
    console.error(`Failed to complete operation execution ${executionId}:`, error)
    throw new Error(`Operation completion failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * List executions for an operation
 */
export async function listExecutions(
  entityId: string,
  operationId: string,
  limit: number = 20
) {
  try {
    const executions = await prisma.operationExecution.findMany({
      where: {
        entityId,
        operationId
      },
      orderBy: { timestamp: 'desc' },
      take: limit
    })

    return executions.map(ex => ({
      id: ex.executionId,
      status: ex.status,
      result: ex.result,
      error: ex.error,
      timestamp: ex.timestamp
    }))
  } catch (error) {
    console.error(
      `Failed to list executions for operation ${entityId}/${operationId}:`,
      error
    )
    throw new Error(`Execution listing failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}
