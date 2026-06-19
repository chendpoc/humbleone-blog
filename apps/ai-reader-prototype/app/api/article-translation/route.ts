import {
  translateArticle,
  type ArticleTranslationInput,
  type ArticleTranslationLanguage,
} from '../../../services/translation/articleTranslation'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(request: Request) {
  try {
    const payload = await request.json()
    const input = parseArticleTranslationInput(payload)
    const result = await translateArticle(input)

    return jsonResponse(result)
  } catch (error) {
    return jsonResponse({
      message: error instanceof Error ? error.message : String(error),
    }, getErrorStatus(error))
  }
}

function parseArticleTranslationInput(value: unknown): ArticleTranslationInput {
  if (!value || typeof value !== 'object') {
    throw new Error('Article translation payload must be an object.')
  }

  const record = value as Partial<ArticleTranslationInput>
  const sourceLanguage = parseLanguage(record.sourceLanguage, 'sourceLanguage')
  const targetLanguage = parseLanguage(record.targetLanguage, 'targetLanguage')

  if (sourceLanguage === targetLanguage) {
    throw new Error('sourceLanguage and targetLanguage must be different.')
  }

  if (!Array.isArray(record.body)) {
    throw new Error('body must be an array of strings.')
  }

  return {
    articleId: readString(record.articleId, 'articleId'),
    body: record.body.map((paragraph) => {
      if (typeof paragraph !== 'string') {
        throw new Error('body must be an array of strings.')
      }

      return paragraph
    }),
    sourceLanguage,
    targetLanguage,
    title: readString(record.title, 'title'),
    url: readString(record.url, 'url'),
  }
}

function readString(value: unknown, field: string) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(`${field} is required.`)
  }

  return value.trim()
}

function parseLanguage(value: unknown, field: string): ArticleTranslationLanguage {
  if (value === 'zh-CN' || value === 'en') {
    return value
  }

  throw new Error(`${field} must be zh-CN or en.`)
}

function getErrorStatus(error: unknown) {
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

function jsonResponse(value: unknown, status = 200) {
  return new Response(JSON.stringify(value), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
    },
    status,
  })
}
