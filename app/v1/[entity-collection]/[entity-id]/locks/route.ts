import { NextRequest, NextResponse } from 'next/server'
import { listLocks, createLock } from '../../../../../lib/state'

export const runtime = 'nodejs'

function validCollection(c: string) {
  return c === 'Area' || c === 'Component' || c === 'App' || c === 'Function'
}

export async function GET(req: NextRequest, { params }: { params: { 'entity-collection': string; 'entity-id': string } }) {
  const collection = params['entity-collection']
  const entityId = params['entity-id']
  if (!validCollection(collection)) {
    return NextResponse.json({ error: 'invalid_entity_collection' }, { status: 400 })
  }
  const resp = listLocks(collection as any, entityId)
  return NextResponse.json(resp, { status: 200 })
}

export async function POST(req: NextRequest, { params }: { params: { 'entity-collection': string; 'entity-id': string } }) {
  const collection = params['entity-collection']
  const entityId = params['entity-id']
  if (!validCollection(collection)) {
    return NextResponse.json({ error: 'invalid_entity_collection' }, { status: 400 })
  }
  const lock = createLock(collection as any, entityId)
  return NextResponse.json(lock, { status: 201 })
}
