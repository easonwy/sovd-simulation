import { NextRequest, NextResponse } from 'next/server'
import { listConfigurations } from '../../../../../lib/state'

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
  const collection = params['entity-collection']
  const entityId = params['entity-id']
  if (!validCollection(collection)) {
    return NextResponse.json({ error: 'invalid_entity_collection' }, { status: 400 })
  }
  const resp = listConfigurations(collection as any, entityId)
  const includeSchema = parseIncludeSchema(req)
  if (includeSchema) {
    return NextResponse.json({ ...resp, schema: {} }, { status: 200 })
  }
  return NextResponse.json(resp, { status: 200 })
}
