import { dailyBrief } from '../../../lib/prototype-data'
import { getFeedHubBrief } from '../../../services/feedHub'
import type { FeedHubResponse } from '../../../services/feedHub/types'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET() {
  try {
    const response = await getFeedHubBrief()

    return jsonResponse(response)
  } catch (error) {
    return jsonResponse({
      mode: 'fallback',
      fetchedAt: new Date().toISOString(),
      brief: dailyBrief,
      sourceResults: [
        {
          sourceId: 'feed-hub',
          rsshubRoute: 'rsshub-package',
          itemCount: 0,
          status: 'failed',
          error: error instanceof Error ? error.message : String(error),
        },
      ],
    })
  }
}

function jsonResponse(value: FeedHubResponse) {
  return new Response(JSON.stringify(value), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  })
}
