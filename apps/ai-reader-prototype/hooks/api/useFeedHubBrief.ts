'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import useSWRInfinite from 'swr/infinite'
import { getFeedHubBrief, refreshFeedHubBrief } from '../../services/api/feedHubApi'
import type { FeedHubResponse } from '../../services/feedHub/types'
import { normalizeApiError, type ApiError } from '../../services/api/request'
import type { FeedItem } from '../../lib/prototype-data'

const feedHubBriefKey = '/api/feed-hub'
const firstPageLimit = 20
const pollingIntervalMs = 3000
const pollingWindowMs = 45000
type FeedHubBriefPageKey = [typeof feedHubBriefKey, number, number, string]

type UseFeedHubBriefOptions = {
  sourceId?: string | null
}

export function useFeedHubBrief({ sourceId = null }: UseFeedHubBriefOptions = {}) {
  const sourceFilterKey = sourceId ?? ''
  const [pollingExpiresAt, setPollingExpiresAt] = useState(0)
  const polling = pollingExpiresAt > Date.now()
  const getFeedHubPageKey = useCallback((
    pageIndex: number,
    previousPageData: FeedHubResponse | null,
  ): FeedHubBriefPageKey | null => {
    if (pageIndex === 0) {
      return [feedHubBriefKey, firstPageLimit, 0, sourceFilterKey]
    }

    if (!previousPageData?.pageInfo.hasMore || typeof previousPageData.pageInfo.nextOffset !== 'number') {
      return null
    }

    return [feedHubBriefKey, firstPageLimit, previousPageData.pageInfo.nextOffset, sourceFilterKey]
  }, [sourceFilterKey])
  const {
    data,
    error,
    isLoading,
    isValidating,
    mutate,
    setSize,
    size,
  } = useSWRInfinite<FeedHubResponse, ApiError>(
    getFeedHubPageKey,
    (key: FeedHubBriefPageKey) => {
      const [, limit, offset, sourceId] = key

      return getFeedHubBrief({ limit, offset, sourceId })
    },
    {
      dedupingInterval: 1000,
      keepPreviousData: true,
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      refreshInterval: polling ? pollingIntervalMs : 0,
      refreshWhenHidden: false,
    },
  )
  const pages = data ?? []
  const mergedData = useMemo(() => mergeFeedHubPages(pages), [pages])
  const latestPage = pages.at(-1)
  const hasMore = Boolean(latestPage?.pageInfo.hasMore)
  const isLoadingMore = size > pages.length
  const loadedCount = mergedData?.pageInfo.returnedCount ?? 0
  const totalCount = mergedData?.pageInfo.totalCount ?? 0

  useEffect(() => {
    if (!polling) {
      return undefined
    }

    const timeout = window.setTimeout(() => {
      setPollingExpiresAt(0)
    }, Math.max(0, pollingExpiresAt - Date.now()))

    return () => window.clearTimeout(timeout)
  }, [polling, pollingExpiresAt])

  const refetch = useCallback(async () => {
    const nextData = await mutate()

    return mergeFeedHubPages(nextData ?? []) ?? null
  }, [mutate])
  const refresh = useCallback(async () => {
    const controller = new AbortController()
    const data = await refreshFeedHubBrief({
      limit: firstPageLimit,
      offset: 0,
      sourceId,
      signal: controller.signal,
    })

    await setSize(1)
    void mutate([data], {
      revalidate: false,
    })
    setPollingExpiresAt(Date.now() + pollingWindowMs)

    return data
  }, [mutate, setSize, sourceId])
  const loadMore = useCallback(async () => {
    if (!hasMore || isLoadingMore) {
      return mergedData ?? null
    }

    const nextPages = await setSize(size + 1)

    return mergeFeedHubPages(nextPages ?? []) ?? null
  }, [hasMore, isLoadingMore, mergedData, setSize, size])

  return {
    canLoadMore: hasMore,
    data: mergedData,
    error: error ? normalizeApiError(error) : null,
    isError: Boolean(error),
    isIdle: false,
    isLoading,
    isLoadingMore,
    isPolling: polling,
    isSuccess: Boolean(mergedData) && !error,
    isValidating,
    loadMore,
    loadedCount,
    refetch,
    refresh,
    status: error ? 'error' as const : mergedData ? 'success' as const : isLoading ? 'loading' as const : 'idle' as const,
    totalCount,
  }
}

function mergeFeedHubPages(pages: FeedHubResponse[]): FeedHubResponse | null {
  const firstPage = pages[0]

  if (!firstPage) {
    return null
  }

  const latestPage = pages.at(-1) ?? firstPage
  const sectionById = new Map(firstPage.brief.sections.map((section) => [
    section.id,
    {
      ...section,
      items: [] as FeedItem[],
    },
  ]))
  const seenItemIds = new Set<string>()

  pages.forEach((page) => {
    page.brief.sections.forEach((section) => {
      const targetSection = sectionById.get(section.id)

      if (!targetSection) {
        return
      }

      section.items.forEach((item) => {
        if (seenItemIds.has(item.id)) {
          return
        }

        seenItemIds.add(item.id)
        targetSection.items.push(item)
      })
    })
  })

  const sections = firstPage.brief.sections.map((section) => sectionById.get(section.id) ?? section)
  const loadedItemCount = sections.reduce((count, section) => count + section.items.length, 0)
  const selectedItemId = sections.flatMap((section) => section.items)[0]?.id ?? firstPage.brief.selectedItemId

  return {
    ...latestPage,
    brief: {
      ...latestPage.brief,
      itemCount: loadedItemCount,
      reader: {
        ...latestPage.brief.reader,
        selectedItemId,
      },
      sections,
      selectedItemId,
      sourceDesk: latestPage.brief.sourceDesk,
    },
    pageInfo: {
      ...latestPage.pageInfo,
      offset: 0,
      returnedCount: loadedItemCount,
    },
  }
}
