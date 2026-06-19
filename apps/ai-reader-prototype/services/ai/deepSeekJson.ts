type DeepSeekChatResponse = {
  choices?: Array<{
    message?: {
      content?: string
    }
  }>
  error?: {
    message?: string
  }
}

type DeepSeekJsonContentRequest = {
  apiKey: string
  model: string
  operationName: string
  systemPrompt: string
  timeoutMs: number
  userPrompt: string
}

const defaultBaseUrl = 'https://api.deepseek.com'

export async function requestDeepSeekJsonContent({
  apiKey,
  model,
  operationName,
  systemPrompt,
  timeoutMs,
  userPrompt,
}: DeepSeekJsonContentRequest) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetch(`${process.env.DEEPSEEK_BASE_URL ?? defaultBaseUrl}/chat/completions`, {
      body: JSON.stringify({
        messages: [
          {
            content: systemPrompt,
            role: 'system',
          },
          {
            content: userPrompt,
            role: 'user',
          },
        ],
        model,
        response_format: {
          type: 'json_object',
        },
        temperature: 0.2,
      }),
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      method: 'POST',
      signal: controller.signal,
    })
    const data = await response.json() as DeepSeekChatResponse

    if (!response.ok) {
      throw new Error(data.error?.message ?? `DeepSeek ${operationName} failed with HTTP ${response.status}.`)
    }

    const content = data.choices?.[0]?.message?.content

    if (!content) {
      throw new Error(`DeepSeek returned an empty ${operationName}.`)
    }

    return content
  } finally {
    clearTimeout(timeout)
  }
}

export function extractJsonObject(content: string) {
  const trimmed = content.trim()

  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    return trimmed
  }

  const start = trimmed.indexOf('{')
  const end = trimmed.lastIndexOf('}')

  if (start >= 0 && end > start) {
    return trimmed.slice(start, end + 1)
  }

  return trimmed
}

export function normalizeArticleParagraphs(body: string[]) {
  return body
    .map((paragraph) => paragraph.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
}

export function truncateArticleBody(body: string[], maxChars: number) {
  const nextBody: string[] = []
  let total = 0

  for (const paragraph of body) {
    if (total >= maxChars) {
      break
    }

    const remaining = maxChars - total
    const nextParagraph = paragraph.length > remaining ? paragraph.slice(0, remaining).trim() : paragraph

    if (nextParagraph) {
      nextBody.push(nextParagraph)
      total += nextParagraph.length
    }
  }

  return nextBody
}
