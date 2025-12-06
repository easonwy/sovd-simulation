import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export const runtime = 'nodejs'

// GET /api/admin/users/:id
export async function GET(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const user = await prisma.user.findUnique({
            where: { id: params.id },
            select: {
                id: true,
                email: true,
                role: true,
                createdAt: true,
                updatedAt: true
            }
        })

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        return NextResponse.json({ user }, { status: 200 })
    } catch (error) {
        console.error('Failed to get user:', error)
        return NextResponse.json({ error: 'Failed to get user' }, { status: 500 })
    }
}

// PUT /api/admin/users/:id
export async function PUT(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const body = await req.json()
        const { email, role } = body

        const user = await prisma.user.update({
            where: { id: params.id },
            data: { email, role },
            select: {
                id: true,
                email: true,
                role: true,
                updatedAt: true
            }
        })

        return NextResponse.json({ user }, { status: 200 })
    } catch (error) {
        console.error('Failed to update user:', error)
        return NextResponse.json({ error: 'Failed to update user' }, { status: 500 })
    }
}

// DELETE /api/admin/users/:id
export async function DELETE(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        await prisma.user.delete({
            where: { id: params.id }
        })

        return NextResponse.json({ ok: true }, { status: 200 })
    } catch (error) {
        console.error('Failed to delete user:', error)
        return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 })
    }
}
