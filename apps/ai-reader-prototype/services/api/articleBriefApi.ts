import { request, type ApiRequestOptions } from './request'

export type ArticleBriefLanguage = 'zh-CN' | 'en'

export type ArticleBriefRequest = {
  articleId: string
  sourceLanguage: ArticleBriefLanguage
  targetLanguage?: ArticleBriefLanguage
  sourceId?: string
  title: string
  url: string
}

export type ArticleBriefResponse = {
  articleId: string
  body: string
  cached: boolean
  generatedAt: string
  keyPoints: string[]
  language: ArticleBriefLanguage
  model: string
  provider: 'deepseek'
}

export function generateArticleBriefRequest(payload: ArticleBriefRequest, options?: ApiRequestOptions) {
  return request<ArticleBriefResponse>({
    data: payload,
    method: 'POST',
    signal: options?.signal,
    url: '/api/article-brief',
  })
}
