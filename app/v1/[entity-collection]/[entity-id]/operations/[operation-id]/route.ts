import { NextRequest, NextResponse } from 'next/server'
import { getOperation, executeOperation } from '../../../../../../lib/state'

export const runtime = 'nodejs'

function validCollection(c: string) {
  return c === 'Area' || c === 'Component' || c === 'App' || c === 'Function'
}

export async function GET(req: NextRequest, { params }: { params: { 'entity-collection': string; 'entity-id': string; 'operation-id': string } }) {
  const collection = params['entity-collection']
  const entityId = params['entity-id']
  const opId = params['operation-id']
  if (!validCollection(collection)) {
    return NextResponse.json({ error: 'invalid_entity_collection' }, { status: 400 })
  }
  const op = getOperation(collection as any, entityId, opId)
  if (!op) return NextResponse.json({ error: 'operation_not_found' }, { status: 404 })
  return NextResponse.json(op, { status: 200 })
}

export async function POST(req: NextRequest, { params }: { params: { 'entity-collection': string; 'entity-id': string; 'operation-id': string } }) {
  const collection = params['entity-collection']
  const entityId = params['entity-id']
  const opId = params['operation-id']
  if (!validCollection(collection)) {
    return NextResponse.json({ error: 'invalid_entity_collection' }, { status: 400 })
  }
  const ex = executeOperation(collection as any, entityId, opId)
  return NextResponse.json(ex, { status: 200 })
}
