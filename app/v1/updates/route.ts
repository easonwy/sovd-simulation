import { NextRequest, NextResponse } from 'next/server'
import { registerUpdate } from '../../../lib/state'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const id = registerUpdate()
  const loc = `${req.nextUrl.origin}/v1/App/WindowControl/updates/${id}`
  return NextResponse.json({ id }, { status: 201, headers: { Location: loc } })
}
