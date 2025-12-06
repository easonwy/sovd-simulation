import { NextRequest, NextResponse } from 'next/server'
import { issueToken } from '../../../lib/auth'

export const runtime = 'nodejs'

function parseBody(contentType: string | null, raw: string) {
  if (contentType && contentType.includes('application/x-www-form-urlencoded')) {
    const params = new URLSearchParams(raw)
    const obj: Record<string, string> = {}
    params.forEach((v, k) => (obj[k] = v))
    return obj
  }
  try {
    return JSON.parse(raw)
  } catch {
    return {}
  }
}

export async function POST(req: NextRequest) {
  const ct = req.headers.get('content-type')
  const raw = await req.text()
  const body = parseBody(ct, raw)
  const role = (body.role || 'Viewer') as 'Viewer' | 'Developer' | 'Admin'
  const grant = body.grant_type || 'client_credentials'
  if (!grant) {
    return NextResponse.json({ error: 'invalid_request' }, { status: 400 })
  }
  const access_token = await issueToken(role)
  return NextResponse.json({ access_token, token_type: 'Bearer', expires_in: 3600 }, { status: 200 })
}
