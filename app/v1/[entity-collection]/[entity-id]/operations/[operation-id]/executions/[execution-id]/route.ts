import { NextRequest, NextResponse } from 'next/server'
import { getExecution } from '../../../../../../../../lib/state'

export const runtime = 'nodejs'

function validCollection(c: string) {
  return c === 'Area' || c === 'Component' || c === 'App' || c === 'Function'
}

export async function GET(req: NextRequest, { params }: { params: { 'entity-collection': string; 'entity-id': string; 'operation-id': string; 'execution-id': string } }) {
  const collection = params['entity-collection']
  const entityId = params['entity-id']
  const opId = params['operation-id']
  const execId = params['execution-id']
  if (!validCollection(collection)) {
    return NextResponse.json({ error: 'invalid_entity_collection' }, { status: 400 })
  }
  const ex = getExecution(collection as any, entityId, opId, execId)
  if (!ex) return NextResponse.json({ error: 'execution_not_found' }, { status: 404 })
  return NextResponse.json(ex, { status: 200 })
}
