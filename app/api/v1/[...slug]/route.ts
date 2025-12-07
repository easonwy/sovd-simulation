import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { listFaults, readFault, deleteFault } from '@/lib/faults'

export async function GET(req: Request, { params }: { params: { slug: string[] } }) {
    const { slug } = params

    // 1. List Entities: /v1/[collection]
    if (slug.length === 1) {
        const collection = slug[0]
        // Verify valid collection? (Optional)
        const entities = await prisma.sOVDEntity.findMany({
            where: { collection: collection },
            select: { entityId: true, name: true }
        })

        // SOVD response format: { items: [...] }
        return NextResponse.json({
            items: entities.map(e => ({ id: e.entityId, name: e.name }))
        })
    }

    // 2. Get Entity: /v1/[collection]/[entityId]
    if (slug.length === 2) {
        const [collection, entityId] = slug
        const entity = await prisma.sOVDEntity.findFirst({
            where: { entityId, collection }
        })

        if (!entity) {
            return NextResponse.json({ error: 'Entity not found' }, { status: 404 })
        }

        return NextResponse.json(entity)
    }

    // 3. List Resource Items: /v1/[collection]/[entityId]/[resource]
    if (slug.length === 3) {
        const [collection, entityId, resource] = slug

        // Check if entity exists first? (Optional, helps with 404)
        const entity = await prisma.sOVDEntity.findFirst({ where: { entityId } })
        if (!entity) return NextResponse.json({ error: 'Entity not found' }, { status: 404 })

        if (resource === 'faults') {
            const faults = await listFaults(entityId)
            return NextResponse.json({ items: faults })
        }

        // Fallback for implemented resources
        return NextResponse.json({ items: [], message: `Resource '${resource}' not yet implemented in simulation` })
    }

    // 4. Get Resource Item: /v1/[collection]/[entityId]/[resource]/[itemId]
    if (slug.length === 4) {
        const [collection, entityId, resource, itemId] = slug

        if (resource === 'faults') {
            const fault = await readFault(entityId, itemId)
            if (!fault) return NextResponse.json({ error: 'Fault not found' }, { status: 404 })
            return NextResponse.json(fault)
        }
    }

    return NextResponse.json({ error: 'Not found' }, { status: 404 })
}

export async function DELETE(req: Request, { params }: { params: { slug: string[] } }) {
    const { slug } = params

    // Delete Resource Item: /v1/[collection]/[entityId]/[resource]/[itemId]
    if (slug.length === 4) {
        const [collection, entityId, resource, itemId] = slug

        if (resource === 'faults') {
            try {
                await deleteFault(entityId, itemId)
                return NextResponse.json({ success: true }, { status: 200 }) // 204 No Content is also standard
            } catch (e) {
                return NextResponse.json({ error: 'Fault not found or could not be deleted' }, { status: 404 })
            }
        }
    }

    return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
}
