import { readFeedHubProjection } from './feedHubProjection'
import { syncFeedHubSources, type FeedHubSyncOptions } from './feedHubSync'
import type { FeedHubResponse } from './types'

export type FeedHubProjectionOptions = {
  limit?: number
  offset?: number
  sourceId?: string | null
}

export async function getFeedHubBrief(options: FeedHubProjectionOptions = {}): Promise<FeedHubResponse> {
  return readFeedHubProjection(options)
}

export async function refreshFeedHubBrief(
  syncOptions: FeedHubSyncOptions = {},
  projectionOptions: FeedHubProjectionOptions = {},
): Promise<FeedHubResponse> {
  await syncFeedHubSources(syncOptions)

  return readFeedHubProjection(projectionOptions)
}
