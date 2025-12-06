import { NextRequest, NextResponse } from 'next/server'
import { getMode } from '../../../../../../lib/state'

export const runtime = 'nodejs'

function validCollection(c: string) {
  return c === 'Area' || c === 'Component' || c === 'App' || c === 'Function'
}

export async function GET(req: NextRequest, { params }: { params: { 'entity-collection': string; 'entity-id': string; 'mode-id': string } }) {
  const collection = params['entity-collection']
  const entityId = params['entity-id']
  const modeId = params['mode-id']
  if (!validCollection(collection)) {
    return NextResponse.json({ error: 'invalid_entity_collection' }, { status: 400 })
  }
  const m = getMode(collection as any, entityId, modeId)
  if (!m) return NextResponse.json({ error: 'mode_not_found' }, { status: 404 })
  return NextResponse.json(m, { status: 200 })
}
