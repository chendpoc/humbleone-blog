export type ArticleAiLanguage = 'zh-CN' | 'en'

export type ArticleAiBaseInput = {
  articleId: string
  sourceLanguage: ArticleAiLanguage
  sourceId?: string
  targetLanguage?: ArticleAiLanguage
  title: string
  url: string
}

export function parseArticleAiBaseInput(value: unknown, payloadLabel: string): ArticleAiBaseInput {
  if (!value || typeof value !== 'object') {
    throw new Error(`${payloadLabel} payload must be an object.`)
  }

  const record = value as Record<string, unknown>

  return {
    articleId: readRequiredString(record.articleId, 'articleId'),
    sourceLanguage: parseArticleAiLanguage(record.sourceLanguage, 'sourceLanguage'),
    sourceId: readOptionalString(record.sourceId),
    targetLanguage: record.targetLanguage
      ? parseArticleAiLanguage(record.targetLanguage, 'targetLanguage')
      : undefined,
    title: readRequiredString(record.title, 'title'),
    url: readRequiredString(record.url, 'url'),
  }
}

export function getArticleAiRouteErrorStatus(error: unknown) {
  if (!(error instanceof Error)) {
    return 500
  }

  if (
    error.message.includes('required') ||
    error.message.includes('payload') ||
    error.message.includes('must be')
  ) {
    return 400
  }

  if (error.message.includes('DEEPSEEK_API_KEY')) {
    return 503
  }

  return 502
}

export function jsonNoStoreResponse(value: unknown, status = 200) {
  return new Response(JSON.stringify(value), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
    },
    status,
  })
}

function readRequiredString(value: unknown, field: string) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(`${field} is required.`)
  }

  return value.trim()
}

function readOptionalString(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined
}

function parseArticleAiLanguage(value: unknown, field: string): ArticleAiLanguage {
  if (value === 'zh-CN' || value === 'en') {
    return value
  }

  throw new Error(`${field} must be zh-CN or en.`)
}
