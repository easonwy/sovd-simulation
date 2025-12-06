import { NextRequest, NextResponse } from 'next/server'
import { listEntities } from '../../../lib/entities'

export const runtime = 'nodejs'

function validCollection(c: string) {
  return c === 'Area' || c === 'Component' || c === 'App' || c === 'Function'
}

function parseIncludeSchema(req: NextRequest) {
  const v = req.nextUrl.searchParams.get('include-schema')
  if (v === null) return false
  return v === 'true' || v === '1'
}

export async function GET(req: NextRequest, { params }: { params: { 'entity-collection': string } }) {
  try {
    const collection = params['entity-collection']
    if (!validCollection(collection)) {
      return NextResponse.json({ error: 'invalid_entity_collection' }, { status: 400 })
    }

    const entities = await listEntities(collection)
    const includeSchema = parseIncludeSchema(req)

    const response = {
      items: entities.map((e: typeof entities[0]) => ({
        id: e.entityId,
        name: e.name,
        type: e.type,
        description: e.description,
        collection: e.collection
      }))
    }

    if (includeSchema) {
      return NextResponse.json({ ...response, schema: {} }, { status: 200 })
    }

    return NextResponse.json(response, { status: 200 })
  } catch (error) {
    console.error('Failed to list entities:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
