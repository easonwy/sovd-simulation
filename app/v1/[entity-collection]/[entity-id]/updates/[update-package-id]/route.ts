import { NextRequest, NextResponse } from 'next/server'
import { getUpdateDetail, deleteUpdate } from '../../../../../../lib/state'

export const runtime = 'nodejs'

function validCollection(c: string) {
  return c === 'Area' || c === 'Component' || c === 'App' || c === 'Function'
}

function parseIncludeSchema(req: NextRequest) {
  const v = req.nextUrl.searchParams.get('include-schema')
  if (v === null) return false
  return v === 'true' || v === '1'
}

export async function GET(req: NextRequest, { params }: { params: { 'entity-collection': string; 'entity-id': string; 'update-package-id': string } }) {
  const collection = params['entity-collection']
  const entityId = params['entity-id']
  const id = params['update-package-id']
  if (!validCollection(collection)) {
    return NextResponse.json({ error: 'invalid_entity_collection' }, { status: 400 })
  }
  const detail = getUpdateDetail(id)
  if (!detail) return NextResponse.json({ error: 'update_not_found' }, { status: 404 })
  const includeSchema = parseIncludeSchema(req)
  const body = includeSchema ? { ...detail, schema: {} } : detail
  return NextResponse.json(body, { status: 200 })
}

export async function DELETE(req: NextRequest, { params }: { params: { 'entity-collection': string; 'entity-id': string; 'update-package-id': string } }) {
  const collection = params['entity-collection']
  const entityId = params['entity-id']
  const id = params['update-package-id']
  if (!validCollection(collection)) {
    return NextResponse.json({ error: 'invalid_entity_collection' }, { status: 400 })
  }
  deleteUpdate(collection as any, entityId, id)
  return new NextResponse(null, { status: 204 })
}
