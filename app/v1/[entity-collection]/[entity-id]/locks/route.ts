import { NextRequest, NextResponse } from 'next/server'
import { listLocks, createLock } from '../../../../../lib/entities'

export const runtime = 'nodejs'

function validCollection(c: string) {
  return c === 'Area' || c === 'Component' || c === 'App' || c === 'Function'
}

export async function GET(req: NextRequest, { params }: { params: { 'entity-collection': string; 'entity-id': string } }) {
  try {
    const collection = params['entity-collection']
    const entityId = params['entity-id']
    if (!validCollection(collection)) {
      return NextResponse.json({ error: 'invalid_entity_collection' }, { status: 400 })
    }

    const locks = await listLocks(entityId)
    const resp = {
      items: locks.map((lock: typeof locks[0]) => ({
        id: lock.id,
        createdAt: lock.createdAt
      }))
    }

    return NextResponse.json(resp, { status: 200 })
  } catch (error) {
    console.error('Failed to list locks:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest, { params }: { params: { 'entity-collection': string; 'entity-id': string } }) {
  try {
    const collection = params['entity-collection']
    const entityId = params['entity-id']
    if (!validCollection(collection)) {
      return NextResponse.json({ error: 'invalid_entity_collection' }, { status: 400 })
    }

    const lock = await createLock(entityId)
    return NextResponse.json(lock, { status: 201 })
  } catch (error) {
    console.error('Failed to create lock:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
