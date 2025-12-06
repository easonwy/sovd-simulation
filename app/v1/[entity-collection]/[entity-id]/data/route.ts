import { NextRequest, NextResponse } from 'next/server'
import { listDataValues } from '../../../../../lib/data'

export const runtime = 'nodejs'

function validCollection(c: string) {
  return c === 'Area' || c === 'Component' || c === 'App' || c === 'Function'
}

function parseIncludeSchema(req: NextRequest) {
  const v = req.nextUrl.searchParams.get('include-schema')
  if (v === null) return false
  return v === 'true' || v === '1'
}

export async function GET(req: NextRequest, { params }: { params: { 'entity-collection': string; 'entity-id': string } }) {
  try {
    const collection = params['entity-collection']
    const entityId = params['entity-id']
    if (!validCollection(collection)) {
      return NextResponse.json({ error: 'invalid_entity_collection' }, { status: 400 })
    }

    const dataValues = await listDataValues(entityId)
    const includeSchema = parseIncludeSchema(req)

    const resp = {
      items: dataValues.map((dv: typeof dataValues[0]) => ({
        id: dv.id,
        value: dv.value,
        category: dv.category,
        type: dv.type
      }))
    }

    if (includeSchema) {
      return NextResponse.json({ ...resp, schema: {} }, { status: 200 })
    }
    return NextResponse.json(resp, { status: 200 })
  } catch (error) {
    console.error('Failed to list data values:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
