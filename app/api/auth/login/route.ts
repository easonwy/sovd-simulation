import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { SignJWT } from 'jose'

const prisma = new PrismaClient()

export const runtime = 'nodejs'

// POST /api/auth/login
export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const { email, password } = body

        if (!email || !password) {
            return NextResponse.json(
                { error: 'Email and password are required' },
                { status: 400 }
            )
        }

        // Find user by email
        const user = await prisma.user.findUnique({
            where: { email },
            select: {
                id: true,
                email: true,
                password: true,
                role: true
            }
        })

        if (!user) {
            return NextResponse.json(
                { error: 'Invalid email or password' },
                { status: 401 }
            )
        }

        // TODO: In production, use bcrypt.compare(password, user.password)
        // For now, plain text comparison (INSECURE - for demo only)
        if (password !== user.password) {
            return NextResponse.json(
                { error: 'Invalid email or password' },
                { status: 401 }
            )
        }

        // Generate JWT token
        const secret = new TextEncoder().encode(
            process.env.JWT_SECRET || 'sovd-secret-key-change-in-production'
        )

        const token = await new SignJWT({
            userId: user.id,
            email: user.email,
            role: user.role
        })
            .setProtectedHeader({ alg: 'HS256' })
            .setIssuedAt()
            .setExpirationTime('24h')
            .sign(secret)

        return NextResponse.json({
            token,
            user: {
                id: user.id,
                email: user.email,
                role: user.role
            }
        }, { status: 200 })
    } catch (error) {
        console.error('Login error:', error)
        return NextResponse.json(
            { error: 'Login failed' },
            { status: 500 }
        )
    }
}
