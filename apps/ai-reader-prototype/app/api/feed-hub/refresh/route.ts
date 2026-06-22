import { after } from 'next/server'
import { dailyBrief } from '../../../../lib/prototype-data'
import { getFeedHubBrief, refreshFeedHubBrief } from '../../../../services/feedHub'
import { isFeedHubDebugEnabled, feedHubWarn } from '../../../../services/feedHub/feedHubLogger'
import type { FeedHubResponse } from '../../../../services/feedHub/types'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(request: Request) {
  try {
    const syncOptions = { force: true, hydrateArticles: false } as const
    const projectionOptions = readFeedHubProjectionQuery(request)

    if (isFeedHubDebugEnabled()) {
      await refreshFeedHubBrief(syncOptions, projectionOptions)
    } else {
      after(async () => {
        try {
          await refreshFeedHubBrief(syncOptions, projectionOptions)
        } catch (error) {
          feedHubWarn('background refresh failed', {
            error: error instanceof Error ? error.message : String(error),
          })
        }
      })
    }

    const response = await getFeedHubBrief(projectionOptions)

    return jsonResponse(response)
  } catch (error) {
    return jsonResponse({
      mode: 'fallback',
      fetchedAt: new Date().toISOString(),
      brief: dailyBrief,
      pageInfo: emptyPageInfo,
      sourceResults: [
        {
          endpoint: 'feed-hub-refresh',
          fetchMethod: 'manual',
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

const emptyPageInfo = {
  hasMore: false,
  limit: 50,
  offset: 0,
  returnedCount: 0,
  totalCount: 0,
}

function readFeedHubProjectionQuery(request: Request) {
  const url = new URL(request.url)
  const offset = readOptionalInteger(url.searchParams.get('offset'))
  const cursor = readOptionalInteger(url.searchParams.get('cursor'))

  return {
    limit: readOptionalInteger(url.searchParams.get('limit')),
    offset: offset ?? cursor ?? 0,
    sourceId: readOptionalString(url.searchParams.get('sourceId')),
  }
}

function readOptionalString(value: string | null) {
  const trimmed = value?.trim()

  return trimmed || undefined
}

function readOptionalInteger(value: string | null) {
  if (!value) {
    return undefined
  }

  const parsed = Number(value)

  return Number.isInteger(parsed) ? parsed : undefined
}

function jsonResponse(value: FeedHubResponse) {
  return new Response(JSON.stringify(value), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  })
}
