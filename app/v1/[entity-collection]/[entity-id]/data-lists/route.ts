import { NextRequest, NextResponse } from 'next/server'
import { createDataList } from '../../../../../lib/state'

export const runtime = 'nodejs'

function validCollection(c: string) {
  return c === 'Area' || c === 'Component' || c === 'App' || c === 'Function'
}

export async function POST(req: NextRequest, { params }: { params: { 'entity-collection': string; 'entity-id': string } }) {
  const collection = params['entity-collection']
  const entityId = params['entity-id']
  if (!validCollection(collection)) {
    return NextResponse.json({ error: 'invalid_entity_collection' }, { status: 400 })
  }
  const body = await req.json()
  const ids = Array.isArray(body.ids) ? body.ids : []
  if (!ids.length) {
    return NextResponse.json({ error: 'invalid_ids' }, { status: 400 })
  }
  const id = createDataList(collection as any, entityId, ids)
  const location = `${req.nextUrl.origin}/v1/${collection}/${entityId}/data-lists/${id}`
  return NextResponse.json({ id }, { status: 201, headers: { Location: location } })
}
