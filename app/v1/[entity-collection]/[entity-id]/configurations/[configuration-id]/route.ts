import { NextRequest, NextResponse } from 'next/server'
import { readConfiguration, writeConfiguration, listConfigurations } from '../../../../../../lib/state'

export const runtime = 'nodejs'

function validCollection(c: string) {
  return c === 'Area' || c === 'Component' || c === 'App' || c === 'Function'
}

function parseIncludeSchema(req: NextRequest) {
  const v = req.nextUrl.searchParams.get('include-schema')
  if (v === null) return false
  return v === 'true' || v === '1'
}

export async function GET(req: NextRequest, { params }: { params: { 'entity-collection': string; 'entity-id': string; 'configuration-id': string } }) {
  const collection = params['entity-collection']
  const entityId = params['entity-id']
  const configId = params['configuration-id']
  if (!validCollection(collection)) {
    return NextResponse.json({ error: 'invalid_entity_collection' }, { status: 400 })
  }
  const metaList = listConfigurations(collection as any, entityId).items
  const meta = metaList.find(m => m.id === configId)
  if (!meta) return NextResponse.json({ error: 'configuration_not_found' }, { status: 404 })
  const accept = req.headers.get('accept') || ''
  const val = readConfiguration(collection as any, entityId, configId)
  if (!val) return NextResponse.json({ error: 'configuration_not_found' }, { status: 404 })
  if (meta.type === 'bulk') {
    if (accept && accept.includes('application/json')) {
      return NextResponse.json({ error: 'not_acceptable' }, { status: 406 })
    }
    const body = typeof val.data === 'string' ? val.data : ''
    return new NextResponse(body, { status: 200, headers: { 'Content-Type': meta.content_type || 'application/octet-stream' } })
  }
  const includeSchema = parseIncludeSchema(req)
  const body = includeSchema ? { ...val, schema: {} } : val
  return NextResponse.json(body, { status: 200 })
}

export async function PUT(req: NextRequest, { params }: { params: { 'entity-collection': string; 'entity-id': string; 'configuration-id': string } }) {
  const collection = params['entity-collection']
  const entityId = params['entity-id']
  const configId = params['configuration-id']
  if (!validCollection(collection)) {
    return NextResponse.json({ error: 'invalid_entity_collection' }, { status: 400 })
  }
  const contentType = req.headers.get('content-type')
  const raw = await req.text()
  const ok = await writeConfiguration(collection as any, entityId, configId, contentType, raw)
  if (!ok) return NextResponse.json({ error: 'bad_request' }, { status: 400 })
  return new NextResponse(null, { status: 204 })
}
