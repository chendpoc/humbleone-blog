'use client'

import { useEffect, useMemo, useRef } from 'react'
import useSWRMutation from 'swr/mutation'
import type { StandardArticle } from '../../types/reader'
import {
  type ArticleTranslationRequest,
  translateArticleRequest,
  type ArticleTranslationLanguage,
  type ArticleTranslationResponse,
} from '../../services/api/articleTranslationApi'
import { isApiCanceledError, normalizeApiError, type ApiError } from '../../services/api/request'
import { useMinimumVisibleLoading } from '../useMinimumVisibleLoading'

type ArticleTranslationMutationArg = {
  payload: ArticleTranslationRequest
  signal: AbortSignal
}

const minimumLoadingMs = 900

export function useArticleTranslation(article: StandardArticle, enabled: boolean) {
  const targetLanguage: ArticleTranslationLanguage = article.language === 'zh-CN' ? 'en' : 'zh-CN'
  const requestKey = useMemo(
    () => [
      article.id,
      article.sourceId,
      article.url,
      article.title,
      article.language,
      targetLanguage,
    ].join('\u001f'),
    [article.id, article.language, article.sourceId, article.title, article.url, targetLanguage],
  )
  const mutationKey = useMemo(() => `/api/article-translation:${requestKey}`, [requestKey])
  const completedRequestKeyRef = useRef<string | null>(null)
  const {
    data = null,
    error: rawError,
    isMutating,
    trigger,
  } = useSWRMutation<ArticleTranslationResponse, ApiError, string, ArticleTranslationMutationArg>(
    mutationKey,
    (_key, { arg }) => translateArticleRequest(arg.payload, { signal: arg.signal }),
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
        sourceId: article.sourceId,
        sourceLanguage: article.language,
        targetLanguage,
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
  }, [article, enabled, requestKey, targetLanguage, trigger])

  return {
    data,
    error,
    status,
    isError: status === 'error',
    isLoading: isMinimumLoadingVisible,
    isSuccess: status === 'success',
    targetLanguage,
  }
}
