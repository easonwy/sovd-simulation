import { NextRequest, NextResponse } from 'next/server'
import { createDataList } from '../../../../../lib/data'

export const runtime = 'nodejs'

function validCollection(c: string) {
  return c === 'Area' || c === 'Component' || c === 'App' || c === 'Function'
}

export async function POST(req: NextRequest, { params }: { params: { 'entity-collection': string; 'entity-id': string } }) {
  try {
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

    const result = await createDataList(entityId, ids)
    const location = `${req.nextUrl.origin}/v1/${collection}/${entityId}/data-lists/${result.id}`
    return NextResponse.json({ id: result.id }, { status: 201, headers: { Location: location } })
  } catch (error) {
    console.error('Failed to create data list:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
