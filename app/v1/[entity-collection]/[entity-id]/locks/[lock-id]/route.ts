import { NextRequest, NextResponse } from 'next/server'
import { releaseLock } from '../../../../../../lib/state'

export const runtime = 'nodejs'

function validCollection(c: string) {
  return c === 'Area' || c === 'Component' || c === 'App' || c === 'Function'
}

export async function DELETE(req: NextRequest, { params }: { params: { 'entity-collection': string; 'entity-id': string; 'lock-id': string } }) {
  const collection = params['entity-collection']
  const entityId = params['entity-id']
  const lockId = params['lock-id']
  if (!validCollection(collection)) {
    return NextResponse.json({ error: 'invalid_entity_collection' }, { status: 400 })
  }
  const ok = releaseLock(collection as any, entityId, lockId)
  if (!ok) {
    return NextResponse.json({ error: 'lock_not_found' }, { status: 404 })
  }
  return NextResponse.json({ ok: true }, { status: 200 })
}
