import { NextRequest, NextResponse } from 'next/server'
import { readData, writeData } from '../../../../../../lib/state'

export const runtime = 'nodejs'

function validCollection(c: string) {
  return c === 'Area' || c === 'Component' || c === 'App' || c === 'Function'
}

export async function GET(req: NextRequest, { params }: { params: { 'entity-collection': string; 'entity-id': string; 'data-id': string } }) {
  const collection = params['entity-collection']
  const entityId = params['entity-id']
  const dataId = params['data-id']
  if (!validCollection(collection)) {
    return NextResponse.json({ error: 'invalid_entity_collection' }, { status: 400 })
  }
  const val = readData(collection as any, entityId, dataId)
  if (!val) {
    return NextResponse.json({ error: 'data_not_found' }, { status: 404 })
  }
  return NextResponse.json(val, { status: 200 })
}

export async function POST(req: NextRequest, { params }: { params: { 'entity-collection': string; 'entity-id': string; 'data-id': string } }) {
  const collection = params['entity-collection']
  const entityId = params['entity-id']
  const dataId = params['data-id']
  if (!validCollection(collection)) {
    return NextResponse.json({ error: 'invalid_entity_collection' }, { status: 400 })
  }
  const body = await req.json()
  const val = writeData(collection as any, entityId, dataId, body.data)
  return NextResponse.json(val, { status: 200 })
}
