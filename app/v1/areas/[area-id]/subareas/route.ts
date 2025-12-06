import { NextRequest, NextResponse } from 'next/server'
import { listSubareas } from '../../../../../lib/state'

export const runtime = 'nodejs'

export async function GET(req: NextRequest, { params }: { params: { 'area-id': string } }) {
  const origin = req.nextUrl.origin
  const resp = listSubareas(origin, params['area-id'])
  return NextResponse.json(resp, { status: 200 })
}
