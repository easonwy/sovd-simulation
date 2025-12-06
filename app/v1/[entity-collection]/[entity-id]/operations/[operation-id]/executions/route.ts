import { NextRequest, NextResponse } from 'next/server'
import { listExecutions } from '../../../../../../../lib/state'

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
  const resp = listExecutions(collection as any, entityId, opId)
  return NextResponse.json(resp, { status: 200 })
}
