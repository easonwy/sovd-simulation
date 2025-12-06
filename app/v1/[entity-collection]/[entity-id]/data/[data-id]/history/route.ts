import { NextRequest, NextResponse } from 'next/server'
import { getDataHistory } from '@/lib/data'

export const runtime = 'nodejs'

export async function GET(
  req: NextRequest,
  {
    params
  }: {
    params: {
      'entity-collection': string
      'entity-id': string
      'data-id': string
    }
  }
) {
  try {
    const collection = params['entity-collection']
    const entityId = params['entity-id']
    const dataId = params['data-id']

    // Get query parameters
    const timeRange = (req.nextUrl.searchParams.get('timeRange') || '24h') as
      | '1h'
      | '6h'
      | '24h'
      | '7d'
      | '30d'
    const bucketSize = (req.nextUrl.searchParams.get('bucketSize') || 'hour') as
      | 'minute'
      | 'hour'
      | 'day'

    // Fetch history
    const history = await getDataHistory(entityId, dataId, {
      timeRange,
      bucketSize
    })

    return NextResponse.json(
      {
        dataId,
        entityId,
        timeRange,
        bucketSize,
        items: history
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Failed to get data history:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
