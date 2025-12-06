import { NextRequest, NextResponse } from 'next/server'
import { listRelatedComponents } from '../../../../../lib/state'

export const runtime = 'nodejs'

export async function GET(req: NextRequest, { params }: { params: { 'area-id': string } }) {
  const origin = req.nextUrl.origin
  const resp = listRelatedComponents(origin, params['area-id'])
  return NextResponse.json(resp, { status: 200 })
}
