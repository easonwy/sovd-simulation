import { NextRequest, NextResponse } from 'next/server'
import { verifyEnhancedToken } from '@/lib/enhanced-jwt'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { token } = body

    if (!token) {
      return NextResponse.json(
        { error: 'Missing token' },
        { status: 400 }
      )
    }

    // 验证Token
    const result = await verifyEnhancedToken(token)

    return NextResponse.json(result, { status: 200 })

  } catch (error) {
    console.error('Token verification error:', error)
    return NextResponse.json(
      {
        error: 'token_verification_failed',
        message: error instanceof Error ? error.message : 'Token verification failed',
        valid: false
      },
      { status: 500 }
    )
  }
}
