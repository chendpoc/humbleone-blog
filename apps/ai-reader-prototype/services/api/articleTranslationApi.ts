import { request, type ApiRequestOptions } from './request'

export type ArticleTranslationLanguage = 'zh-CN' | 'en'

export type ArticleTranslationRequest = {
  articleId: string
  body: string[]
  sourceLanguage: ArticleTranslationLanguage
  targetLanguage: ArticleTranslationLanguage
  title: string
  url: string
}

export type ArticleTranslationResponse = {
  articleId: string
  body: string[]
  cached: boolean
  model: string
  provider: 'deepseek'
  sourceHash: string
  targetLanguage: ArticleTranslationLanguage
  title: string
  translatedAt: string
}

export function translateArticleRequest(payload: ArticleTranslationRequest, options?: ApiRequestOptions) {
  return request<ArticleTranslationResponse>({
    data: payload,
    method: 'POST',
    signal: options?.signal,
    url: '/api/article-translation',
  })
}
