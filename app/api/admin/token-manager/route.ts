import { NextRequest, NextResponse } from 'next/server'
import { parseEnhancedToken, generateEnhancedToken, verifyEnhancedToken } from '@/lib/enhanced-jwt'

/**
 * Token Management API
 * Provides endpoints for token operations: decrypt, verify, generate
 */

// GET: Decode and verify token
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json(
        { error: 'Token is required' },
        { status: 400 }
      )
    }

    // Parse token
    const payload = parseEnhancedToken(token)
    if (!payload) {
      return NextResponse.json(
        { error: 'Invalid token format' },
        { status: 400 }
      )
    }

    // Verify token
    const verification = await verifyEnhancedToken(token)

    // Parse header
    const parts = token.split('.')
    const header = parts[0] ? JSON.parse(atob(parts[0])) : null

    return NextResponse.json({
      header,
      payload,
      signature: parts[2] || '',
      isValid: verification.valid,
      error: verification.error,
      code: verification.code
    })
  } catch (error) {
    console.error('Token decode error:', error)
    return NextResponse.json(
      { error: 'Failed to decode token' },
      { status: 500 }
    )
  }
}

// POST: Generate new token
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      userId, 
      email, 
      role, 
      oid, 
      permissions, 
      scope, 
      clientId,
      expiresIn,
      issuer,
      audience,
      subject 
    } = body

    // Validate required fields
    const requiredFields = ['userId', 'email', 'role', 'oid', 'permissions', 'scope']
    const missingFields = requiredFields.filter(field => !body[field])
    
    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(', ')}` },
        { status: 400 }
      )
    }

    // Generate token
    const result = await generateEnhancedToken(
      {
        userId,
        email,
        role,
        oid,
        permissions,
        scope,
        clientId
      },
      {
        expiresIn,
        issuer,
        audience,
        subject
      }
    )

    return NextResponse.json({
      token: result.token,
      payload: result.payload,
      expiresAt: result.expiresAt.toISOString()
    })
  } catch (error) {
    console.error('Token generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate token' },
      { status: 500 }
    )
  }
}

// PUT: Refresh existing token
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { token, ...options } = body

    if (!token) {
      return NextResponse.json(
        { error: 'Token is required for refresh' },
        { status: 400 }
      )
    }

    // Verify token first
    const verification = await verifyEnhancedToken(token)
    if (!verification.valid) {
      return NextResponse.json(
        { error: 'Cannot refresh invalid token' },
        { status: 400 }
      )
    }

    // Extract current payload
    const currentPayload = verification.payload!
    
    // Generate new token with same payload but new timestamps
    const result = await generateEnhancedToken({
      userId: currentPayload.userId,
      email: currentPayload.email,
      role: currentPayload.role,
      oid: currentPayload.oid,
      permissions: currentPayload.permissions,
      scope: currentPayload.scope,
      clientId: currentPayload.clientId
    }, options)

    return NextResponse.json({
      token: result.token,
      payload: result.payload,
      expiresAt: result.expiresAt.toISOString()
    })
  } catch (error) {
    console.error('Token refresh error:', error)
    return NextResponse.json(
      { error: 'Failed to refresh token' },
      { status: 500 }
    )
  }
}