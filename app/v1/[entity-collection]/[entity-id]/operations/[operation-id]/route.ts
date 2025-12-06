import { NextRequest, NextResponse } from 'next/server'
import { readOperation, executeOperation } from '../../../../../../lib/operations'

export const runtime = 'nodejs'

function validCollection(c: string) {
  return c === 'Area' || c === 'Component' || c === 'App' || c === 'Function'
}

export async function GET(req: NextRequest, { params }: { params: { 'entity-collection': string; 'entity-id': string; 'operation-id': string } }) {
  try {
    const collection = params['entity-collection']
    const entityId = params['entity-id']
    const opId = params['operation-id']
    if (!validCollection(collection)) {
      return NextResponse.json({ error: 'invalid_entity_collection' }, { status: 400 })
    }

    const op = await readOperation(entityId, opId)
    if (!op) {
      return NextResponse.json({ error: 'operation_not_found' }, { status: 404 })
    }
    return NextResponse.json(op, { status: 200 })
  } catch (error) {
    console.error('Failed to read operation:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest, { params }: { params: { 'entity-collection': string; 'entity-id': string; 'operation-id': string } }) {
  try {
    const collection = params['entity-collection']
    const entityId = params['entity-id']
    const opId = params['operation-id']
    if (!validCollection(collection)) {
      return NextResponse.json({ error: 'invalid_entity_collection' }, { status: 400 })
    }

    const body = await req.json().catch(() => ({}))
    const execution = await executeOperation(entityId, opId, body.parameters)
    return NextResponse.json(execution, { status: 202 })
  } catch (error) {
    console.error('Failed to execute operation:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
