import { NextRequest, NextResponse } from 'next/server'
import { listFaults, clearFault } from '../../../../../lib/state'

export const runtime = 'nodejs'

function validCollection(c: string) {
  return c === 'Area' || c === 'Component' || c === 'App' || c === 'Function'
}

export async function GET(req: NextRequest, { params }: { params: { 'entity-collection': string; 'entity-id': string } }) {
  const collection = params['entity-collection']
  const entityId = params['entity-id']
  if (!validCollection(collection)) {
    return NextResponse.json({ error: 'invalid_entity_collection' }, { status: 400 })
  }
  
  // Get all faults
  const resp = listFaults(collection as any, entityId)
  
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
  
  // Filter faults based on status attributes
  if (Object.keys(statusFilters).length > 0) {
    resp.items = resp.items.filter((fault: any) => {
      // Check if fault matches any status filter
      for (const [filterKey, filterValues] of Object.entries(statusFilters)) {
        const faultValue = (fault as any).status // Currently we only have 'status' attribute
        if (filterKey === 'status' && filterValues.has(faultValue)) {
          return true // Match found, include this fault
        }
      }
      return false // No match found, exclude this fault
    })
  }
  
  return NextResponse.json(resp, { status: 200 })
}

export async function DELETE(req: NextRequest, { params }: { params: { 'entity-collection': string; 'entity-id': string } }) {
  const collection = params['entity-collection']
  const entityId = params['entity-id']
  if (!validCollection(collection)) {
    return NextResponse.json({ error: 'invalid_entity_collection' }, { status: 400 })
  }
  clearFault(collection as any, entityId)
  return NextResponse.json({ ok: true }, { status: 200 })
}
