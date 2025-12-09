import { NextRequest, NextResponse } from 'next/server'
import { generateEnhancedToken } from '@/lib/enhanced-jwt'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
  const {
      role,
      email,
      userId,
      oid,
      scope,
      clientId,
      expiresIn,
      permissions,
      denyPermissions
    } = body

    // 验证必要字段
    if (!role || !email || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields: role, email, userId' },
        { status: 400 }
      )
    }

    // 生成Token
    const tokenResult = await generateEnhancedToken({
      userId,
      email,
      role,
      oid: oid || 'default',
      permissions: permissions || [],
      denyPermissions: denyPermissions || [],
      scope: scope || 'api:access',
      clientId
    }, {
      expiresIn: expiresIn || '24h',
      issuer: 'sovd-admin-tool',
      audience: 'sovd-api'
    })

    return NextResponse.json({
      token: tokenResult.token,
      payload: tokenResult.payload,
      expiresAt: tokenResult.expiresAt
    }, { status: 200 })

  } catch (error) {
    console.error('Token generation error:', error)
    return NextResponse.json(
      {
        error: 'token_generation_failed',
        message: error instanceof Error ? error.message : 'Token generation failed'
      },
      { status: 500 }
    )
  }
}
