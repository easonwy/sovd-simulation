import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export const runtime = 'nodejs'

// GET /api/admin/users - List all users
export async function GET(req: NextRequest) {
    try {
        // TODO: Add admin role check from token

        const users = await prisma.user.findMany({
            select: {
                id: true,
                email: true,
                role: true,
                createdAt: true,
                updatedAt: true
                // Never return password
            },
            orderBy: { createdAt: 'desc' }
        })

        return NextResponse.json({ users }, { status: 200 })
    } catch (error) {
        console.error('Failed to list users:', error)
        return NextResponse.json(
            { error: 'Failed to list users' },
            { status: 500 }
        )
    }
}

// POST /api/admin/users - Create new user
export async function POST(req: NextRequest) {
    try {
        // TODO: Add admin role check from token

        const body = await req.json()
        const { email, password, role } = body

        // Validation
        if (!email || !password || !role) {
            return NextResponse.json(
                { error: 'Email, password, and role are required' },
                { status: 400 }
            )
        }

        if (!['Admin', 'Developer', 'Viewer'].includes(role)) {
            return NextResponse.json(
                { error: 'Invalid role. Must be Admin, Developer, or Viewer' },
                { status: 400 }
            )
        }

        // Check if user already exists
        const existing = await prisma.user.findUnique({ where: { email } })
        if (existing) {
            return NextResponse.json(
                { error: 'User with this email already exists' },
                { status: 409 }
            )
        }

        // TODO: Hash password with bcrypt before storing
        // For now, storing plain text (NOT SECURE - will fix in next step)
        const user = await prisma.user.create({
            data: {
                email,
                password, // Should be hashed!
                role
            },
            select: {
                id: true,
                email: true,
                role: true,
                createdAt: true
            }
        })

        return NextResponse.json({ user }, { status: 201 })
    } catch (error) {
        console.error('Failed to create user:', error)
        return NextResponse.json(
            { error: 'Failed to create user' },
            { status: 500 }
        )
    }
}
