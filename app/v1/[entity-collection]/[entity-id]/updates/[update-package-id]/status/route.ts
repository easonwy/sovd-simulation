import { NextRequest, NextResponse } from 'next/server'
import { getUpdateStatus } from '../../../../../../../lib/state'

export const runtime = 'nodejs'

export async function GET(req: NextRequest, { params }: { params: { 'update-package-id': string } }) {
  const id = params['update-package-id']
  const st = getUpdateStatus(id)
  if (!st) return NextResponse.json({ error: 'update_not_found' }, { status: 404 })
  return NextResponse.json(st, { status: 200 })
}
