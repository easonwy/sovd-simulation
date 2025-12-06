import { NextRequest, NextResponse } from 'next/server'
import { listBulkDataDescriptors, uploadBulkData, deleteBulkDataCategory } from '../../../../../../lib/state'

export const runtime = 'nodejs'

function validCollection(c: string) {
  return c === 'Area' || c === 'Component' || c === 'App' || c === 'Function'
}

function parseIncludeSchema(req: NextRequest) {
  const v = req.nextUrl.searchParams.get('include-schema')
  if (v === null) return false
  return v === 'true' || v === '1'
}

export async function GET(req: NextRequest, { params }: { params: { 'entity-collection': string; 'entity-id': string; category: string } }) {
  const collection = params['entity-collection']
  const entityId = params['entity-id']
  const category = params['category']
  if (!validCollection(collection)) {
    return NextResponse.json({ error: 'invalid_entity_collection' }, { status: 400 })
  }
  const resp = listBulkDataDescriptors(collection as any, entityId, category)
  const includeSchema = parseIncludeSchema(req)
  if (includeSchema) {
    return NextResponse.json({ ...resp, schema: {} }, { status: 200 })
  }
  return NextResponse.json(resp, { status: 200 })
}

export async function POST(req: NextRequest, { params }: { params: { 'entity-collection': string; 'entity-id': string; category: string } }) {
  const collection = params['entity-collection']
  const entityId = params['entity-id']
  const category = params['category']
  const disposition = req.headers.get('content-disposition') || ''
  let id: string | null = null
  const m = /name="([^"]+)"/.exec(disposition)
  if (m) id = m[1]
  const raw = await req.text()
  const assignedId = uploadBulkData(collection as any, entityId, category, id, raw)
  const loc = `${req.nextUrl.origin}/v1/${collection}/${entityId}/bulk-data/${category}/${assignedId}`
  return NextResponse.json({ id: assignedId }, { status: 201, headers: { Location: loc } })
}

export async function DELETE(req: NextRequest, { params }: { params: { 'entity-collection': string; 'entity-id': string; category: string } }) {
  const collection = params['entity-collection']
  const entityId = params['entity-id']
  const category = params['category']
  const result = deleteBulkDataCategory(collection as any, entityId, category)
  return NextResponse.json(result, { status: 200 })
}
