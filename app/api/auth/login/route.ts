import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { generateEnhancedToken } from '@/lib/enhanced-jwt'
import { getRoleAccess } from '@/lib/rbac'
import bcrypt from 'bcryptjs'

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

        const looksHashed = user.password.startsWith('$2')
        let isValidPassword = false
        if (looksHashed) {
            isValidPassword = await bcrypt.compare(password, user.password)
        } else {
            isValidPassword = password === user.password
            if (isValidPassword) {
                const hashed = await bcrypt.hash(password, 10)
                await prisma.user.update({ where: { id: user.id }, data: { password: hashed } })
            }
        }

        if (!isValidPassword) {
            return NextResponse.json(
                { error: 'Invalid email or password' },
                { status: 401 }
            )
        }


        // Get user permissions
        const { allow: permissions, deny: denyPermissions } = await getRoleAccess(user.role as any)
        const effectivePermissions = filterAllowsAgainstDenies(permissions, denyPermissions)

        // Use enhanced JWT tool to generate token
        const tokenResult = await generateEnhancedToken({
            userId: user.id,
            email: user.email,
            role: user.role,
            oid: 'default', // Default organization ID, can be extended for multi-tenant later
            permissions: effectivePermissions,
            denyPermissions,
            scope: 'api:access'
        })

        return NextResponse.json({
            token: tokenResult.token,
            expiresAt: tokenResult.expiresAt,
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
                permissions: effectivePermissions,
                denyPermissions
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

/**
 * Get user permission list
 */
async function getUserPermissions(role: string): Promise<string[]> {
    try {
        // Get role permissions from database
        const rolePermissions = await prisma.permission.findMany({
            where: { role },
            select: { method: true, pathPattern: true }
        })

        // Convert to permission string format
        const permissions = rolePermissions.map(perm =>
            `${perm.method}:${perm.pathPattern}`
        )

        // Add base permissions
        const basePermissions = getBasePermissions(role)

        return [...new Set([...basePermissions, ...permissions])]
    } catch (error) {
        console.error('Failed to get user permissions:', error)
        return getBasePermissions(role)
    }
}

/**
 * Get base permissions
 */
function getBasePermissions(role: string): string[] {
    const basePerms = {
        'Viewer': [
            'GET:/v1/App',
            'GET:/v1/App/*/data',
            'GET:/v1/App/*/faults'
        ],
        'Developer': [
            'GET:/v1/App',
            'POST:/v1/App',
            'GET:/v1/App/*/data',
            'POST:/v1/App/*/data',
            'PUT:/v1/App/*/data',
            'GET:/v1/App/*/faults',
            'POST:/v1/App/*/faults',
            'DELETE:/v1/App/*/faults',
            'GET:/v1/App/*/lock'
        ],
        'Admin': ['*'] // Admin has all permissions
    }

    return basePerms[role as keyof typeof basePerms] || []
}

function getBaseDenyPermissions(role: string): string[] {
    if (role === 'Viewer') {
        return [
            'POST:/v1/*',
            'PUT:/v1/*',
            'DELETE:/v1/*'
        ]
    }
    if (role === 'Developer') {
        return [
            'POST:/v1/Admin/*',
            'PUT:/v1/Admin/*',
            'DELETE:/v1/Admin/*'
        ]
    }
    if (role === 'Admin') {
        return [
            'DELETE:/v1/*',
            'POST:/v1/*',
            'PUT:/v1/*',
            'GET:/v1/Component/*/faults'
        ]
    }
    return []
}

function filterAllowsAgainstDenies(allows: string[], denies: string[]): string[] {
    if (!Array.isArray(denies) || denies.length === 0) return Array.from(new Set(allows))
    const denyRegexes = denies.map(toRegexFromPattern).filter(Boolean) as RegExp[]
    const result = allows.filter((perm) => {
        if (perm === '*') return true
        return !denyRegexes.some((rx) => rx.test(perm))
    })
    return Array.from(new Set(result))
}

function toRegexFromPattern(pattern: string): RegExp | null {
    if (!pattern || typeof pattern !== 'string') return null
    const escaped = pattern.replace(/[.+?^${}()|\[\]\\]/g, '\\$&').replace(/\*/g, '.*')
    return new RegExp(`^${escaped}$`)
}
