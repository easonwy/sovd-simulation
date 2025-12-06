import { NextRequest, NextResponse } from 'next/server'
import { executeUpdate } from '../../../../../../../lib/state'

export const runtime = 'nodejs'

export async function PUT(req: NextRequest, { params }: { params: { 'entity-collection': string; 'entity-id': string; 'update-package-id': string } }) {
  const id = params['update-package-id']
  const st = executeUpdate(params['entity-collection'] as any, params['entity-id'], id)
  const loc = `${req.nextUrl.origin}/v1/${params['entity-collection']}/${params['entity-id']}/updates/${id}/status`
  return NextResponse.json(st, { status: 202, headers: { Location: loc } })
}
