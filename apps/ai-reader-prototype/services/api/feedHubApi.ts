import { request, type ApiRequestOptions } from './request'
import type { FeedHubResponse } from '../feedHub/types'

export type FeedHubBriefRequestOptions = ApiRequestOptions & {
  limit?: number
  offset?: number
  sourceId?: string | null
}

export function getFeedHubBrief(options?: FeedHubBriefRequestOptions) {
  return request<FeedHubResponse>({
    method: 'GET',
    url: '/api/feed-hub',
    params: {
      limit: options?.limit,
      offset: options?.offset,
      sourceId: options?.sourceId || undefined,
    },
    signal: options?.signal,
    headers: {
      'Cache-Control': 'no-cache',
    },
  })
}

export function refreshFeedHubBrief(options?: FeedHubBriefRequestOptions) {
  return request<FeedHubResponse>({
    method: 'POST',
    signal: options?.signal,
    url: '/api/feed-hub/refresh',
    params: {
      limit: options?.limit,
      offset: options?.offset,
      sourceId: options?.sourceId || undefined,
    },
  })
}
