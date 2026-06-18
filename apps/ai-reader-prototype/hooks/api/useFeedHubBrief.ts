'use client'

import { useCallback } from 'react'
import { getFeedHubBrief } from '../../services/api/feedHubApi'
import type { FeedHubResponse } from '../../services/feedHub/types'
import { useApiQuery } from './useApiQuery'

export function useFeedHubBrief() {
  const queryFeedHubBrief = useCallback(
    ({ signal }: { signal: AbortSignal }) => getFeedHubBrief({ signal }),
    [],
  )

  return useApiQuery<FeedHubResponse>(queryFeedHubBrief)
}
