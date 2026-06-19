'use client'

import { useEffect, useMemo, useState } from 'react'
import type { StandardArticle } from '../../types/reader'
import {
  translateArticleRequest,
  type ArticleTranslationLanguage,
  type ArticleTranslationResponse,
} from '../../services/api/articleTranslationApi'
import { isApiCanceledError, normalizeApiError, type ApiError } from '../../services/api/request'

type ArticleTranslationState = {
  data: ArticleTranslationResponse | null
  error: ApiError | null
  status: 'idle' | 'loading' | 'success' | 'error'
}

export function useArticleTranslation(article: StandardArticle, enabled: boolean) {
  const targetLanguage: ArticleTranslationLanguage = article.language === 'zh-CN' ? 'en' : 'zh-CN'
  const requestKey = useMemo(
    () => [
      article.id,
      article.url,
      article.title,
      article.language,
      targetLanguage,
      article.reader.body.join('\n\n'),
    ].join('\u001f'),
    [article.id, article.language, article.reader.body, article.title, article.url, targetLanguage],
  )
  const [state, setState] = useState<ArticleTranslationState>({
    data: null,
    error: null,
    status: 'idle',
  })

  useEffect(() => {
    if (!enabled) {
      return undefined
    }

    const controller = new AbortController()

    setState((current) => {
      if (current.status === 'success' && current.data?.articleId === article.id) {
        return current
      }

      return {
        data: null,
        error: null,
        status: 'loading',
      }
    })

    void translateArticleRequest({
      articleId: article.id,
      body: article.reader.body,
      sourceLanguage: article.language,
      targetLanguage,
      title: article.title,
      url: article.url,
    }, {
      signal: controller.signal,
    }).then((data) => {
      if (controller.signal.aborted) {
        return
      }

      setState({
        data,
        error: null,
        status: 'success',
      })
    }).catch((error) => {
      if (controller.signal.aborted || isApiCanceledError(error)) {
        return
      }

      setState({
        data: null,
        error: normalizeApiError(error),
        status: 'error',
      })
    })

    return () => {
      controller.abort()
    }
  }, [article, enabled, requestKey, targetLanguage])

  return {
    ...state,
    isError: state.status === 'error',
    isLoading: state.status === 'loading',
    isSuccess: state.status === 'success',
    targetLanguage,
  }
}
