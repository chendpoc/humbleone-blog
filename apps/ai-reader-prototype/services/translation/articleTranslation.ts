import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { createArticleSourceHash } from '../articles/articleSourceHash'
import {
  findArticleTranslation,
  upsertArticleTranslation,
  type StoredArticleTranslation,
} from './articleTranslationRepository'

export type ArticleTranslationLanguage = 'zh-CN' | 'en'

export type ArticleTranslationInput = {
  articleId: string
  body: string[]
  sourceLanguage: ArticleTranslationLanguage
  targetLanguage: ArticleTranslationLanguage
  title: string
  url: string
}

export type ArticleTranslationResult = {
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

type ArticleTranslationCacheEntry = Omit<ArticleTranslationResult, 'cached'>

type ArticleTranslationCache = {
  entries: Record<string, ArticleTranslationCacheEntry>
  version: 1
}

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

type DeepSeekTranslationPayload = {
  body: string[]
  title: string
}

const cacheDirectory = path.join(process.cwd(), '.cache', 'feed-hub')
const cachePath = path.join(cacheDirectory, 'article-translations-v1.json')
const provider = 'deepseek' as const
const defaultModel = 'deepseek-v4-flash'
const defaultBaseUrl = 'https://api.deepseek.com'
const promptVersion = 'article-translation-v1'
const requestTimeoutMs = Number(process.env.DEEPSEEK_TRANSLATION_TIMEOUT_MS ?? 90000)
const maxArticleChars = Number(process.env.DEEPSEEK_TRANSLATION_MAX_CHARS ?? 90000)

export async function translateArticle(input: ArticleTranslationInput): Promise<ArticleTranslationResult> {
  const normalizedInput = normalizeTranslationInput(input)
  const model = process.env.DEEPSEEK_TRANSLATION_MODEL ?? defaultModel
  const sourceHash = createArticleSourceHash(normalizedInput)
  const storedEntry = findArticleTranslationSafely({
    model,
    promptVersion,
    provider,
    sourceHash,
    targetLanguage: normalizedInput.targetLanguage,
    url: normalizedInput.url,
  })

  if (storedEntry) {
    return toTranslationResult(storedEntry, true)
  }

  const cacheKey = createCacheKey({ model, sourceHash, targetLanguage: normalizedInput.targetLanguage })
  const cache = await readTranslationCache()
  const cachedEntry = cache.entries[cacheKey]

  if (cachedEntry) {
    const migratedEntry = buildStoredTranslationRecord({
      input: normalizedInput,
      result: cachedEntry,
      sourceHash,
    })

    upsertArticleTranslationSafely(migratedEntry)

    return toTranslationResult(migratedEntry, true)
  }

  const apiKey = process.env.DEEPSEEK_API_KEY

  if (!apiKey) {
    throw new Error('DEEPSEEK_API_KEY is not configured. Add it to apps/ai-reader-prototype/.env.local or the server environment.')
  }

  const translated = await requestDeepSeekTranslation({
    apiKey,
    input: normalizedInput,
    model,
  })
  const entry = buildStoredTranslationRecord({
    input: normalizedInput,
    result: {
      articleId: normalizedInput.articleId,
      body: translated.body,
      model,
      provider,
      sourceHash,
      targetLanguage: normalizedInput.targetLanguage,
      title: translated.title,
      translatedAt: new Date().toISOString(),
    },
    sourceHash,
  })

  upsertArticleTranslationSafely(entry)

  return toTranslationResult(entry, false)
}

function buildStoredTranslationRecord({
  input,
  result,
  sourceHash,
}: {
  input: ArticleTranslationInput
  result: ArticleTranslationCacheEntry
  sourceHash: string
}): StoredArticleTranslation {
  const now = new Date().toISOString()

  return {
    articleId: result.articleId || input.articleId,
    body: result.body,
    model: result.model,
    promptVersion,
    provider,
    sourceHash,
    status: 'ok',
    targetLanguage: result.targetLanguage,
    title: result.title,
    translatedAt: result.translatedAt,
    updatedAt: now,
    url: input.url,
  }
}

function findArticleTranslationSafely(
  lookup: Parameters<typeof findArticleTranslation>[0],
) {
  try {
    return findArticleTranslation(lookup)
  } catch (error) {
    console.warn('[translation] failed to read article translation from database', error)

    return null
  }
}

function upsertArticleTranslationSafely(record: StoredArticleTranslation) {
  try {
    upsertArticleTranslation(record)
  } catch (error) {
    console.warn('[translation] failed to persist article translation', error)
  }
}

function toTranslationResult(
  record: StoredArticleTranslation,
  cached: boolean,
): ArticleTranslationResult {
  return {
    articleId: record.articleId,
    body: record.body,
    cached,
    model: record.model,
    provider: record.provider,
    sourceHash: record.sourceHash,
    targetLanguage: record.targetLanguage,
    title: record.title,
    translatedAt: record.translatedAt,
  }
}

function normalizeTranslationInput(input: ArticleTranslationInput): ArticleTranslationInput {
  const body = input.body
    .map((paragraph) => paragraph.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
  const title = input.title.trim()
  const truncatedBody = truncateArticleBody(body, maxArticleChars)

  if (!input.articleId.trim()) {
    throw new Error('articleId is required.')
  }

  if (!title) {
    throw new Error('title is required.')
  }

  if (!input.url.trim()) {
    throw new Error('url is required.')
  }

  if (!truncatedBody.length) {
    throw new Error('article body is required.')
  }

  return {
    ...input,
    articleId: input.articleId.trim(),
    body: truncatedBody,
    title,
    url: input.url.trim(),
  }
}

function truncateArticleBody(body: string[], maxChars: number) {
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

async function requestDeepSeekTranslation({
  apiKey,
  input,
  model,
}: {
  apiKey: string
  input: ArticleTranslationInput
  model: string
}): Promise<DeepSeekTranslationPayload> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), requestTimeoutMs)

  try {
    const response = await fetch(`${process.env.DEEPSEEK_BASE_URL ?? defaultBaseUrl}/chat/completions`, {
      body: JSON.stringify({
        messages: [
          {
            content: buildTranslationSystemPrompt(input.targetLanguage),
            role: 'system',
          },
          {
            content: buildTranslationUserPrompt(input),
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
      throw new Error(data.error?.message ?? `DeepSeek translation failed with HTTP ${response.status}.`)
    }

    const content = data.choices?.[0]?.message?.content

    if (!content) {
      throw new Error('DeepSeek returned an empty translation.')
    }

    return parseTranslationPayload(content)
  } finally {
    clearTimeout(timeout)
  }
}

function buildTranslationSystemPrompt(targetLanguage: ArticleTranslationLanguage) {
  const target = targetLanguage === 'zh-CN' ? 'Simplified Chinese' : 'English'

  return [
    `You are a professional technical translator. Translate the complete article into ${target}.`,
    'Do not summarize. Do not explain. Do not add facts. Do not omit details.',
    'Preserve product names, model names, API names, code identifiers, commands, paths, and brand names unless a common translation is clearly established.',
    'Keep technical terms stable: agent, tool call, runtime, context window, prompt, benchmark, eval, repository, CLI.',
    'Return only strict JSON with this shape: {"title":"translated title","body":["paragraph 1","paragraph 2"]}.',
  ].join('\n')
}

function buildTranslationUserPrompt(input: ArticleTranslationInput) {
  return JSON.stringify({
    body: input.body,
    sourceLanguage: input.sourceLanguage,
    targetLanguage: input.targetLanguage,
    title: input.title,
    url: input.url,
  })
}

function parseTranslationPayload(content: string): DeepSeekTranslationPayload {
  const parsed = JSON.parse(extractJsonObject(content)) as Partial<DeepSeekTranslationPayload>
  const title = typeof parsed.title === 'string' ? parsed.title.trim() : ''
  const body = Array.isArray(parsed.body)
    ? parsed.body
        .map((paragraph) => typeof paragraph === 'string' ? paragraph.replace(/\s+/g, ' ').trim() : '')
        .filter(Boolean)
    : []

  if (!title || !body.length) {
    throw new Error('DeepSeek translation JSON did not include title and body.')
  }

  return {
    body,
    title,
  }
}

function extractJsonObject(content: string) {
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

function createCacheKey({
  model,
  sourceHash,
  targetLanguage,
}: {
  model: string
  sourceHash: string
  targetLanguage: ArticleTranslationLanguage
}) {
  return createHash('sha256')
    .update(provider)
    .update('\n')
    .update(model)
    .update('\n')
    .update(targetLanguage)
    .update('\n')
    .update(sourceHash)
    .digest('hex')
}

async function readTranslationCache(): Promise<ArticleTranslationCache> {
  try {
    const raw = await readFile(cachePath, 'utf8')
    const parsed = JSON.parse(raw) as Partial<ArticleTranslationCache>

    if (parsed.version === 1 && parsed.entries && typeof parsed.entries === 'object') {
      return {
        version: 1,
        entries: parsed.entries,
      }
    }
  } catch {
    // Missing or corrupt translation cache should not block article reading.
  }

  return {
    version: 1,
    entries: {},
  }
}
