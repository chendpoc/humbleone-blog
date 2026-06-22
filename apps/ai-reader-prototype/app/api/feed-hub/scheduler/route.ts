import { dailyBrief } from '../../../../lib/prototype-data'
import { refreshFeedHubBrief } from '../../../../services/feedHub'
import type { FeedHubResponse } from '../../../../services/feedHub/types'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(request: Request) {
  return handleSchedulerRequest(request)
}

export async function POST(request: Request) {
  return handleSchedulerRequest(request)
}

async function handleSchedulerRequest(request: Request) {
  if (!isSchedulerAuthorized(request)) {
    return jsonResponse({ error: 'Unauthorized scheduler request.' }, { status: 401 })
  }

  try {
    const response = await refreshFeedHubBrief({ force: false, hydrateArticles: true })

    return jsonResponse(response)
  } catch (error) {
    return jsonResponse({
      mode: 'fallback',
      fetchedAt: new Date().toISOString(),
      brief: dailyBrief,
      pageInfo: emptyPageInfo,
      sourceResults: [
        {
          endpoint: 'feed-hub-scheduler',
          fetchMethod: 'manual',
          sourceId: 'feed-hub-scheduler',
          rsshubRoute: 'rsshub-package',
          itemCount: 0,
          status: 'failed',
          error: error instanceof Error ? error.message : String(error),
        },
      ],
    })
  }
}

const emptyPageInfo = {
  hasMore: false,
  limit: 0,
  offset: 0,
  returnedCount: 0,
  totalCount: 0,
}

function isSchedulerAuthorized(request: Request) {
  const schedulerToken = process.env.FEED_HUB_SCHEDULER_TOKEN?.trim()
    || process.env.CRON_SECRET?.trim()

  if (!schedulerToken) {
    return process.env.NODE_ENV !== 'production'
  }

  return readBearerToken(request) === schedulerToken
    || request.headers.get('x-scheduler-token') === schedulerToken
}

function readBearerToken(request: Request) {
  const authorization = request.headers.get('authorization')
  const match = authorization?.match(/^Bearer\s+(.+)$/i)

  return match?.[1]?.trim()
}

function jsonResponse(value: FeedHubResponse | { error: string }, init?: ResponseInit) {
  return new Response(JSON.stringify(value), {
    ...init,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      ...init?.headers,
    },
  })
}
