'use client'

import { useEffect, useMemo, useRef } from 'react'
import useSWRMutation from 'swr/mutation'
import type { StandardArticle } from '../../types/reader'
import {
  type ArticleBriefRequest,
  generateArticleBriefRequest,
  type ArticleBriefResponse,
} from '../../services/api/articleBriefApi'
import { isApiCanceledError, normalizeApiError, type ApiError } from '../../services/api/request'
import { useMinimumVisibleLoading } from '../useMinimumVisibleLoading'

type ArticleBriefMutationArg = {
  payload: ArticleBriefRequest
  signal: AbortSignal
}

const minimumLoadingMs = 900

export function useArticleBrief(article: StandardArticle, enabled: boolean) {
  const requestKey = useMemo(
    () => [
      article.id,
      article.url,
      article.title,
      article.language,
      article.reader.body.join('\n\n'),
    ].join('\u001f'),
    [article.id, article.language, article.reader.body, article.title, article.url],
  )
  const mutationKey = useMemo(() => `/api/article-brief:${requestKey}`, [requestKey])
  const completedRequestKeyRef = useRef<string | null>(null)
  const {
    data = null,
    error: rawError,
    isMutating,
    trigger,
  } = useSWRMutation<ArticleBriefResponse, ApiError, string, ArticleBriefMutationArg>(
    mutationKey,
    (_key, { arg }) => generateArticleBriefRequest(arg.payload, { signal: arg.signal }),
    {
      throwOnError: false,
    },
  )
  const isMinimumLoadingVisible = useMinimumVisibleLoading(isMutating, {
    minDurationMs: minimumLoadingMs,
    resetKey: requestKey,
  })
  const error = rawError && !isApiCanceledError(rawError) ? normalizeApiError(rawError) : null
  const status = isMinimumLoadingVisible
    ? 'loading'
    : error
      ? 'error'
      : data
        ? 'success'
        : 'idle'

  useEffect(() => {
    if (!enabled) {
      return undefined
    }

    if (completedRequestKeyRef.current === requestKey) {
      return undefined
    }

    const controller = new AbortController()

    void trigger({
      payload: {
        articleId: article.id,
        body: article.reader.body,
        sourceLanguage: article.language,
        targetLanguage: 'zh-CN',
        title: article.title,
        url: article.url,
      },
      signal: controller.signal,
    }, {
      throwOnError: false,
    }).then((data) => {
      if (!data || controller.signal.aborted) {
        return
      }

      completedRequestKeyRef.current = requestKey
    }).catch(() => {
      // SWR owns the mutation error state; canceled requests are normalized below.
    })

    return () => {
      controller.abort()
    }
  }, [article, enabled, requestKey, trigger])

  return {
    data,
    error,
    status,
    isError: status === 'error',
    isLoading: isMinimumLoadingVisible,
    isSuccess: status === 'success',
  }
}
