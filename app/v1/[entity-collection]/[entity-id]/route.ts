import { NextRequest, NextResponse } from 'next/server'
import { getEntity } from '../../../../lib/entities'

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

    const entity = await getEntity(collection, entityId)
    if (!entity) {
      return NextResponse.json({ error: 'entity_not_found' }, { status: 404 })
    }

    const base = `${req.nextUrl.origin}/v1/${collection}/${entityId}`
    const body: any = { id: entity.entityId, name: entity.name }
    body['configurations'] = `${base}/configurations`
    body['bulk-data'] = `${base}/bulk-data`
    body['data'] = `${base}/data`
    body['data-lists'] = `${base}/data-lists`
    body['faults'] = `${base}/faults`
    body['operations'] = `${base}/operations`
    body['updates'] = `${base}/updates`
    body['modes'] = `${base}/modes`
    if (collection === 'Component') body['relatedapps'] = `${base.replace(/\/Component\/.*/, '')}/components/${entityId}/related-apps`
    if (collection === 'Area') body['relatedcomponents'] = `${base.replace(/\/Area\/.*/, '')}/areas/${entityId}/related-components`
    if (collection === 'Area') body['subareas'] = `${base.replace(/\/Area\/.*/, '')}/areas/${entityId}/subareas`
    if (collection === 'Component') body['subcomponents'] = `${base.replace(/\/Component\/.*/, '')}/components/${entityId}/subcomponents`
    body['locks'] = `${base}/locks`
    body['logs'] = `${base}/logs`

    return NextResponse.json(body, { status: 200 })
  } catch (error) {
    console.error('Failed to get entity:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
