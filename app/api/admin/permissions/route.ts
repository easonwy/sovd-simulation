import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export const runtime = 'nodejs'

// GET /api/admin/permissions - List permissions (optionally filtered by role)
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url)
        const role = searchParams.get('role')

        const where = role ? { role } : {}

        const permissions = await prisma.permission.findMany({
            where,
            orderBy: [
                { role: 'asc' },
                { pathPattern: 'asc' }
            ]
        })

        return NextResponse.json({ permissions }, { status: 200 })
    } catch (error) {
        console.error('Failed to list permissions:', error)
        return NextResponse.json(
            { error: 'Failed to list permissions' },
            { status: 500 }
        )
    }
}

// POST /api/admin/permissions - Create new permission
export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const { role, pathPattern, method, access } = body

        // Validation
        if (!role || !pathPattern || !method || !access) {
            return NextResponse.json(
                { error: 'Role, pathPattern, method, and access are required' },
                { status: 400 }
            )
        }

        if (!['Admin', 'Developer', 'Viewer'].includes(role)) {
            return NextResponse.json(
                { error: 'Invalid role' },
                { status: 400 }
            )
        }

        const permission = await prisma.permission.create({
            data: {
                role,
                pathPattern,
                method,
                access: typeof access === 'string' ? access : JSON.stringify(access)
            }
        })

        return NextResponse.json({ permission }, { status: 201 })
    } catch (error) {
        console.error('Failed to create permission:', error)
        return NextResponse.json(
            { error: 'Failed to create permission' },
            { status: 500 }
        )
    }
}
