import { NextRequest, NextResponse } from 'next/server'
import { downloadBulkData, deleteBulkData } from '../../../../../../../lib/state'

export const runtime = 'nodejs'

function validCollection(c: string) {
  return c === 'Area' || c === 'Component' || c === 'App' || c === 'Function'
}

export async function GET(req: NextRequest, { params }: { params: { 'entity-collection': string; 'entity-id': string; category: string; 'bulk-data-id': string } }) {
  const collection = params['entity-collection']
  const entityId = params['entity-id']
  const category = params['category']
  const id = params['bulk-data-id']
  if (!validCollection(collection)) {
    return NextResponse.json({ error: 'invalid_entity_collection' }, { status: 400 })
  }
  const content = downloadBulkData(collection as any, entityId, category, id)
  return new NextResponse(content, { status: 200, headers: { 'Content-Type': 'application/octet-stream' } })
}

export async function DELETE(req: NextRequest, { params }: { params: { 'entity-collection': string; 'entity-id': string; category: string; 'bulk-data-id': string } }) {
  const collection = params['entity-collection']
  const entityId = params['entity-id']
  const category = params['category']
  const id = params['bulk-data-id']
  deleteBulkData(collection as any, entityId, category, id)
  return new NextResponse(null, { status: 204 })
}
