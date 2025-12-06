import { NextRequest, NextResponse } from 'next/server'
import { listRelatedApps } from '../../../../../lib/state'

export const runtime = 'nodejs'

export async function GET(req: NextRequest, { params }: { params: { 'component-id': string } }) {
  const origin = req.nextUrl.origin
  const resp = listRelatedApps(origin, params['component-id'])
  return NextResponse.json(resp, { status: 200 })
}
