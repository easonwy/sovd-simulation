import { NextRequest, NextResponse } from 'next/server'
import { listOperations } from '../../../../../lib/operations'

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

    const operations = await listOperations(entityId)
    const resp = {
      items: operations.map((op: typeof operations[0]) => ({
        id: op.id,
        name: op.name,
        description: op.description,
        status: op.status
      }))
    }

    return NextResponse.json(resp, { status: 200 })
  } catch (error) {
    console.error('Failed to list operations:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
