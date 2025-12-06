import { NextRequest, NextResponse } from 'next/server'
import { listFaults, clearAllFaults, getFaultsByStatusKey } from '../../../../../lib/faults'

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

    // Get all faults
    let faults = await listFaults(entityId)

    // Parse status[key] query parameters for filtering
    // Format: status[key]=value (multiple values are OR'd together)
    const url = new URL(req.url)
    const statusFilters: Record<string, Set<string>> = {}

    for (const [key, value] of url.searchParams.entries()) {
      if (key.startsWith('status[') && key.endsWith(']')) {
        const statusKey = key.slice(7, -1) // Extract key from 'status[key]'
        if (!statusFilters[statusKey]) {
          statusFilters[statusKey] = new Set()
        }
        statusFilters[statusKey].add(value)
      }
    }

    // Filter faults based on status attributes if filters provided
    if (Object.keys(statusFilters).length > 0) {
      for (const [filterKey, filterValues] of Object.entries(statusFilters)) {
        faults = await getFaultsByStatusKey(entityId, filterKey, Array.from(filterValues))
      }
    }

    const resp = {
      items: faults.map((f: typeof faults[0]) => ({
        code: f.code,
        title: f.title,
        status: f.status,
        severity: f.severity,
        created: f.created
      }))
    }

    return NextResponse.json(resp, { status: 200 })
  } catch (error) {
    console.error('Failed to list faults:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { 'entity-collection': string; 'entity-id': string } }) {
  try {
    const collection = params['entity-collection']
    const entityId = params['entity-id']
    if (!validCollection(collection)) {
      return NextResponse.json({ error: 'invalid_entity_collection' }, { status: 400 })
    }

    const result = await clearAllFaults(entityId)
    return NextResponse.json({ ok: true, cleared: result.cleared }, { status: 200 })
  } catch (error) {
    console.error('Failed to clear all faults:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
