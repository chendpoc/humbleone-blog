import {
  translateArticle,
  type ArticleTranslationInput,
} from '../../../services/translation/articleTranslation'
import {
  getArticleAiRouteErrorStatus,
  jsonNoStoreResponse,
  parseArticleAiBaseInput,
} from '../articleAiRouteUtils'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(request: Request) {
  try {
    const payload = await request.json()
    const input = parseArticleTranslationInput(payload)
    const result = await translateArticle(input)

    return jsonNoStoreResponse(result)
  } catch (error) {
    return jsonNoStoreResponse({
      message: error instanceof Error ? error.message : String(error),
    }, getArticleAiRouteErrorStatus(error))
  }
}

function parseArticleTranslationInput(value: unknown): ArticleTranslationInput {
  const input = parseArticleAiBaseInput(value, 'Article translation')
  const { sourceLanguage, targetLanguage } = input

  if (!targetLanguage) {
    throw new Error('targetLanguage is required.')
  }

  if (sourceLanguage === targetLanguage) {
    throw new Error('sourceLanguage and targetLanguage must be different.')
  }

  return {
    ...input,
    targetLanguage,
  }
}
