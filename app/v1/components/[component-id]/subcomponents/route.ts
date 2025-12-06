import { NextRequest, NextResponse } from 'next/server'
import { listSubcomponents } from '../../../../../lib/state'

export const runtime = 'nodejs'

export async function GET(req: NextRequest, { params }: { params: { 'component-id': string } }) {
  const origin = req.nextUrl.origin
  const resp = listSubcomponents(origin, params['component-id'])
  return NextResponse.json(resp, { status: 200 })
}
