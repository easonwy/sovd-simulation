import { NextRequest, NextResponse } from 'next/server'
import { readFault, confirmFault, clearFault } from '../../../../../../lib/state'

export const runtime = 'nodejs'

function validCollection(c: string) {
  return c === 'Area' || c === 'Component' || c === 'App' || c === 'Function'
}

export async function GET(req: NextRequest, { params }: { params: { 'entity-collection': string; 'entity-id': string; 'fault-code': string } }) {
  const collection = params['entity-collection']
  const entityId = params['entity-id']
  const code = params['fault-code']
  if (!validCollection(collection)) {
    return NextResponse.json({ error: 'invalid_entity_collection' }, { status: 400 })
  }
  const f = readFault(collection as any, entityId, code)
  if (!f) return NextResponse.json({ error: 'fault_not_found' }, { status: 404 })
  return NextResponse.json(f, { status: 200 })
}

export async function POST(req: NextRequest, { params }: { params: { 'entity-collection': string; 'entity-id': string; 'fault-code': string } }) {
  const collection = params['entity-collection']
  const entityId = params['entity-id']
  const code = params['fault-code']
  if (!validCollection(collection)) {
    return NextResponse.json({ error: 'invalid_entity_collection' }, { status: 400 })
  }
  const f = confirmFault(collection as any, entityId, code)
  if (!f) return NextResponse.json({ error: 'fault_not_found' }, { status: 404 })
  return NextResponse.json(f, { status: 200 })
}

export async function DELETE(req: NextRequest, { params }: { params: { 'entity-collection': string; 'entity-id': string; 'fault-code': string } }) {
  const collection = params['entity-collection']
  const entityId = params['entity-id']
  const code = params['fault-code']
  if (!validCollection(collection)) {
    return NextResponse.json({ error: 'invalid_entity_collection' }, { status: 400 })
  }
  clearFault(collection as any, entityId, code)
  return NextResponse.json({ ok: true }, { status: 200 })
}
