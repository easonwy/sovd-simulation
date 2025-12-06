import { NextRequest, NextResponse } from 'next/server'
import { readFault, confirmFault, clearFault, deleteFault } from '../../../../../../lib/faults'

export const runtime = 'nodejs'

function validCollection(c: string) {
  return c === 'Area' || c === 'Component' || c === 'App' || c === 'Function'
}

export async function GET(req: NextRequest, { params }: { params: { 'entity-collection': string; 'entity-id': string; 'fault-code': string } }) {
  try {
    const collection = params['entity-collection']
    const entityId = params['entity-id']
    const code = params['fault-code']
    if (!validCollection(collection)) {
      return NextResponse.json({ error: 'invalid_entity_collection' }, { status: 400 })
    }

    const f = await readFault(entityId, code)
    if (!f) {
      return NextResponse.json({ error: 'fault_not_found' }, { status: 404 })
    }
    return NextResponse.json(f, { status: 200 })
  } catch (error) {
    console.error('Failed to read fault:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest, { params }: { params: { 'entity-collection': string; 'entity-id': string; 'fault-code': string } }) {
  try {
    const collection = params['entity-collection']
    const entityId = params['entity-id']
    const code = params['fault-code']
    if (!validCollection(collection)) {
      return NextResponse.json({ error: 'invalid_entity_collection' }, { status: 400 })
    }

    const f = await confirmFault(entityId, code)
    if (!f) {
      return NextResponse.json({ error: 'fault_not_found' }, { status: 404 })
    }
    return NextResponse.json(f, { status: 200 })
  } catch (error) {
    console.error('Failed to confirm fault:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { 'entity-collection': string; 'entity-id': string; 'fault-code': string } }) {
  try {
    const collection = params['entity-collection']
    const entityId = params['entity-id']
    const code = params['fault-code']
    if (!validCollection(collection)) {
      return NextResponse.json({ error: 'invalid_entity_collection' }, { status: 400 })
    }

    await deleteFault(entityId, code)
    return NextResponse.json({ ok: true }, { status: 200 })
  } catch (error) {
    console.error('Failed to delete fault:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
