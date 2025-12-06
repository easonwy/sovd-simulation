import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export const runtime = 'nodejs'

// PUT /api/admin/permissions/:id
export async function PUT(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const body = await req.json()
        const { pathPattern, method, access } = body

        const permission = await prisma.permission.update({
            where: { id: params.id },
            data: {
                pathPattern,
                method,
                access: typeof access === 'string' ? access : JSON.stringify(access)
            }
        })

        return NextResponse.json({ permission }, { status: 200 })
    } catch (error) {
        console.error('Failed to update permission:', error)
        return NextResponse.json({ error: 'Failed to update permission' }, { status: 500 })
    }
}

// DELETE /api/admin/permissions/:id
export async function DELETE(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        await prisma.permission.delete({
            where: { id: params.id }
        })

        return NextResponse.json({ ok: true }, { status: 200 })
    } catch (error) {
        console.error('Failed to delete permission:', error)
        return NextResponse.json({ error: 'Failed to delete permission' }, { status: 500 })
    }
}
