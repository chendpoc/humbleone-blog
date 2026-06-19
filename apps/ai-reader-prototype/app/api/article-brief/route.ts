import {
  generateArticleBrief,
  type ArticleBriefInput,
} from '../../../services/ai/articleBrief'
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
    const input = parseArticleBriefInput(payload)
    const result = await generateArticleBrief(input)

    return jsonNoStoreResponse(result)
  } catch (error) {
    return jsonNoStoreResponse({
      message: error instanceof Error ? error.message : String(error),
    }, getArticleAiRouteErrorStatus(error))
  }
}

function parseArticleBriefInput(value: unknown): ArticleBriefInput {
  const input = parseArticleAiBaseInput(value, 'Article brief')

  return {
    ...input,
    targetLanguage: input.targetLanguage ?? 'zh-CN',
  }
}
