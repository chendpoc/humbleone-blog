import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import type { FeedItem } from '../../lib/prototype-data'
import {
  findArticleContentByUrl,
  upsertArticleContent,
  type StoredArticleContent,
} from '../articles/articleContentRepository'
import { createArticleSourceHash } from '../articles/articleSourceHash'
import { getReaderDatabase } from '../db/readerDatabase'
import { feedHubWarn } from './feedHubLogger'

type ArticleContentCacheEntry = {
  body: string[]
  error?: string
  fetchedAt: string
  source: 'rss' | 'web'
  status: 'ok' | 'failed'
  textLength: number
  title: string
  url: string
}

type ArticleContentCache = {
  entries: Record<string, ArticleContentCacheEntry>
  version: 1
}

export type ResolvedArticleInput = {
  articleId: string
  sourceId?: string
  sourceLanguage: 'zh-CN' | 'en'
  title: string
  url: string
}

export type ResolvedArticleContent = {
  body: string[]
  title: string
}

type ArticleContentCandidate = {
  body: string[]
  source: ArticleContentCacheEntry['source']
}

type FeedItemLookupInput = {
  articleId?: string
  sourceId?: string
  url?: string
}

type FeedItemRow = {
  item_json: string
}

const cacheDirectory = path.join(process.cwd(), '.cache', 'feed-hub')
const cachePath = path.join(cacheDirectory, 'article-content-v1.json')
const cacheTtlMs = 1000 * 60 * 60 * 24 * 14
const failedCacheTtlMs = 1000 * 60 * 60 * 6
const sufficientTextLength = 900
const fetchTimeoutMs = Number(process.env.FEED_HUB_ARTICLE_FETCH_TIMEOUT_MS ?? 7000)

export async function resolveArticleContentForAi(
  input: ResolvedArticleInput,
): Promise<ResolvedArticleContent | null> {
  const articleId = input.articleId.trim()
  const sourceId = input.sourceId?.trim()
  const title = input.title.trim()
  const url = input.url.trim()

  if (!articleId) {
    throw new Error('articleId is required.')
  }

  if (!title) {
    throw new Error('title is required.')
  }

  if (!url) {
    throw new Error('url is required.')
  }

  const feedItem = findFeedItemByIdentity({
    articleId,
    sourceId,
    url,
  })
  const seedItem = feedItem ?? makeSeedFeedItem({
    articleId,
    sourceId,
    sourceLanguage: input.sourceLanguage,
    title,
    url,
  })
  const [resolvedItem] = await hydrateFeedItemsWithArticleContent([seedItem])
  const resolvedBody = resolvedItem.reader.body

  if (!resolvedBody.length) {
    return null
  }

  return {
    body: resolvedBody,
    title: resolvedItem.title.trim() || title,
  }
}

export async function hydrateFeedItemsWithArticleContent(items: FeedItem[]) {
  if (!items.length) {
    return items
  }

  const legacyCache = await readArticleContentCache()
  const hydratedItems = await Promise.all(
    items.map(async (item) => {
      return hydrateFeedItemWithArticleContent(item, legacyCache)
    }),
  )

  return hydratedItems
}

export function applyCachedArticleContentToFeedItems(items: FeedItem[]) {
  if (!items.length) {
    return items
  }

  return items.map((item) => {
    const storedEntry = findArticleContentByUrlSafely(item.url)

    if (storedEntry && isFreshStoredArticleContent(storedEntry)) {
      return applyArticleBody(item, storedEntry.body, storedEntry.source)
    }

    return item
  })
}

async function hydrateFeedItemWithArticleContent(item: FeedItem, cache: ArticleContentCache) {
  const storedEntry = findArticleContentByUrlSafely(item.url)
  const key = getArticleContentCacheKey(item.url)
  const cachedEntry = cache.entries[key]
  const rssCandidate = buildRssCandidate(item)

  if (storedEntry && isFreshStoredArticleContent(storedEntry)) {
    return applyArticleBody(item, storedEntry.body, storedEntry.source)
  }

  if (storedEntry?.status === 'failed' && isFreshFailedStoredArticleContent(storedEntry)) {
    return item
  }

  if (isFreshCacheEntry(cachedEntry)) {
    upsertArticleContentSafely(buildStoredContentRecordFromCacheEntry(item, cachedEntry))

    return applyArticleBody(item, cachedEntry.body, cachedEntry.source)
  }

  if (isSufficientBody(rssCandidate.body)) {
    upsertArticleContentSafely(buildStoredContentRecord(item, rssCandidate))

    return item
  }

  if (cachedEntry?.status === 'failed' && isFreshFailedCacheEntry(cachedEntry)) {
    upsertArticleContentSafely(buildStoredContentRecordFromCacheEntry(item, cachedEntry))

    return item
  }

  const webCandidate = await fetchArticleContent(item.url)

  if (webCandidate && getBodyTextLength(webCandidate.body) > getBodyTextLength(rssCandidate.body)) {
    upsertArticleContentSafely(buildStoredContentRecord(item, webCandidate))

    return applyArticleBody(item, webCandidate.body, webCandidate.source)
  }

  upsertArticleContentSafely({
    ...buildStoredContentRecord(item, rssCandidate),
    error: webCandidate ? undefined : 'Original article extraction returned no usable body.',
    status: webCandidate ? 'ok' : 'failed',
  })

  return item
}

function buildRssCandidate(item: FeedItem): ArticleContentCandidate {
  return {
    body: item.reader.body,
    source: 'rss',
  }
}

async function fetchArticleContent(url: string): Promise<ArticleContentCandidate | null> {
  if (!isFetchableUrl(url)) {
    return null
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), fetchTimeoutMs)

  try {
    const response = await fetch(url, {
      headers: {
        Accept: 'text/html,application/xhtml+xml',
        'User-Agent': 'AIReaderPrototype/0.1 (+https://github.com/Facefall/humbleone-blog)',
      },
      signal: controller.signal,
    })

    if (!response.ok) {
      return null
    }

    const contentType = response.headers.get('content-type') ?? ''

    if (contentType && !contentType.includes('text/html') && !contentType.includes('application/xhtml')) {
      return null
    }

    const html = await response.text()
    const body = extractArticleParagraphs(html)

    return body.length ? { body, source: 'web' } : null
  } catch {
    return null
  } finally {
    clearTimeout(timeout)
  }
}

function extractArticleParagraphs(html: string) {
  const articleHtml = pickArticleHtml(html)
  const text = stripHtmlToText(preserveTextBreaks(articleHtml))

  return splitParagraphs(text)
    .filter(isUsefulParagraph)
    .slice(0, 48)
}

function pickArticleHtml(html: string) {
  const withoutNoise = html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, '')
    .replace(/<svg[\s\S]*?<\/svg>/gi, '')
    .replace(/<form[\s\S]*?<\/form>/gi, '')

  return (
    findLongestMatch(withoutNoise, /<article\b[\s\S]*?<\/article>/gi) ??
    findLongestMatch(withoutNoise, /<main\b[\s\S]*?<\/main>/gi) ??
    findLongestMatch(withoutNoise, /<body\b[\s\S]*?<\/body>/gi) ??
    withoutNoise
  )
}

function findLongestMatch(value: string, pattern: RegExp) {
  const matches = [...value.matchAll(pattern)].map((match) => match[0])

  if (!matches.length) {
    return null
  }

  return matches.reduce((longest, current) => (current.length > longest.length ? current : longest), '')
}

function preserveTextBreaks(value: string) {
  return value
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|section|article|main|h[1-6]|li|blockquote|pre)>/gi, '\n\n')
}

function stripHtmlToText(value: string) {
  return value
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&ldquo;|&rdquo;/g, '"')
    .replace(/&lsquo;|&rsquo;/g, "'")
}

function splitParagraphs(value: string) {
  const normalized = value
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n[ \t]+/g, '\n')
    .trim()

  if (!normalized) {
    return []
  }

  const paragraphs = normalized
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.replace(/\s+/g, ' ').trim())
    .filter(Boolean)

  if (paragraphs.length > 1) {
    return paragraphs
  }

  return splitLongParagraph(normalized)
}

function splitLongParagraph(value: string) {
  const sentences = value.split(/(?<=[.!?。！？])\s+/)
  const paragraphs: string[] = []
  let current = ''

  sentences.forEach((sentence) => {
    const next = current ? `${current} ${sentence}` : sentence

    if (next.length > 520 && current) {
      paragraphs.push(current)
      current = sentence
      return
    }

    current = next
  })

  if (current) {
    paragraphs.push(current)
  }

  return paragraphs
}

function isUsefulParagraph(paragraph: string) {
  const normalized = paragraph.toLowerCase()

  if (paragraph.length < 36) {
    return false
  }

  return ![
    'cookie',
    'subscribe',
    'sign up',
    'privacy policy',
    'terms of service',
    'all rights reserved',
  ].some((phrase) => normalized.includes(phrase))
}

function applyArticleBody(
  item: FeedItem,
  body: string[],
  source: ArticleContentCandidate['source'],
): FeedItem {
  return {
    ...item,
    reader: {
      ...item.reader,
      body,
      sourceProof: source === 'web'
        ? [...item.reader.sourceProof, 'Article content: original page extraction.']
        : item.reader.sourceProof,
    },
  }
}

function makeSeedFeedItem({
  articleId,
  sourceId,
  sourceLanguage,
  title,
  url,
}: {
  articleId: string
  sourceId?: string
  sourceLanguage: 'zh-CN' | 'en'
  title: string
  url: string
}): FeedItem {
  const now = new Date().toISOString()

  return {
    id: articleId,
    sourceId: sourceId ?? 'manual-source',
    sourceName: 'manual-source',
    sourceFamily: 'community',
    evidenceLevel: 'rss',
    title,
    summary: title,
    whyItMatters: 'AI information reader item',
    url,
    author: 'Manual',
    relativeTime: 'unknown',
    publishedAt: now,
    fetchedAt: now,
    tags: ['manual'],
    importanceScore: 0,
    noveltyScore: 0,
    language: sourceLanguage,
    status: 'new',
    evidenceLinks: [{ label: 'Manual', url }],
    reader: {
      kicker: 'Manual source',
      headline: title,
      body: [],
      aiSummary: '',
      sourceProof: ['No cached item body, fetch by URL.'],
      followUpQuestions: [],
    },
  }
}

function findFeedItemByIdentity(input: FeedItemLookupInput): FeedItem | null {
  const trimmedArticleId = input.articleId?.trim()
  const trimmedSourceId = input.sourceId?.trim()
  const trimmedUrl = input.url?.trim()

  if (!trimmedArticleId && !trimmedSourceId && !trimmedUrl) {
    return null
  }

  const where: string[] = []
  const params: string[] = []

  if (trimmedSourceId) {
    where.push('source_id = ?')
    params.push(trimmedSourceId)
  }

  if (trimmedArticleId) {
    where.push('id = ?')
    params.push(trimmedArticleId)
  } else if (trimmedUrl) {
    where.push('url = ?')
    params.push(trimmedUrl)
  }

  const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : ''
  const row = getReaderDatabase()
    .prepare(`
      SELECT item_json
      FROM feed_items
      ${whereClause}
      ORDER BY published_at DESC
      LIMIT 1
    `)
    .get(...params) as FeedItemRow | undefined

  if (!row) {
    return null
  }

  try {
    return JSON.parse(row.item_json) as FeedItem
  } catch {
    return null
  }
}

function buildStoredContentRecord(
  item: FeedItem,
  candidate: ArticleContentCandidate,
): StoredArticleContent {
  const now = new Date().toISOString()

  return {
    articleId: item.id,
    body: candidate.body,
    extractedAt: now,
    source: candidate.source,
    sourceHash: createArticleSourceHash({
      body: candidate.body,
      title: item.title,
      url: item.url,
    }),
    status: 'ok',
    textLength: getBodyTextLength(candidate.body),
    title: item.title,
    updatedAt: now,
    url: item.url,
  }
}

function buildStoredContentRecordFromCacheEntry(
  item: FeedItem,
  entry: ArticleContentCacheEntry,
): StoredArticleContent {
  return {
    articleId: item.id,
    body: entry.body,
    error: entry.error,
    extractedAt: entry.fetchedAt,
    source: entry.source,
    sourceHash: createArticleSourceHash({
      body: entry.body,
      title: entry.title || item.title,
      url: entry.url || item.url,
    }),
    status: entry.status,
    textLength: entry.textLength,
    title: entry.title || item.title,
    updatedAt: new Date().toISOString(),
    url: entry.url || item.url,
  }
}

function isSufficientBody(body: string[]) {
  return body.length >= 3 && getBodyTextLength(body) >= sufficientTextLength
}

function getBodyTextLength(body: string[]) {
  return body.join(' ').length
}

function isFreshCacheEntry(entry: ArticleContentCacheEntry | undefined) {
  return entry?.status === 'ok' && Date.now() - new Date(entry.fetchedAt).getTime() < cacheTtlMs
}

function isFreshStoredArticleContent(entry: StoredArticleContent | null) {
  return entry?.status === 'ok' && Date.now() - new Date(entry.extractedAt).getTime() < cacheTtlMs
}

function isFreshFailedCacheEntry(entry: ArticleContentCacheEntry) {
  return Date.now() - new Date(entry.fetchedAt).getTime() < failedCacheTtlMs
}

function isFreshFailedStoredArticleContent(entry: StoredArticleContent) {
  return Date.now() - new Date(entry.extractedAt).getTime() < failedCacheTtlMs
}

function isFetchableUrl(url: string) {
  try {
    const parsedUrl = new URL(url)

    return parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:'
  } catch {
    return false
  }
}

function getArticleContentCacheKey(url: string) {
  return createHash('sha256').update(url).digest('hex')
}

async function readArticleContentCache(): Promise<ArticleContentCache> {
  try {
    const raw = await readFile(cachePath, 'utf8')
    const parsed = JSON.parse(raw) as Partial<ArticleContentCache>

    if (parsed.version === 1 && parsed.entries && typeof parsed.entries === 'object') {
      return {
        version: 1,
        entries: parsed.entries,
      }
    }
  } catch {
    // A missing or corrupt cache should not block feed rendering.
  }

  return {
    version: 1,
    entries: {},
  }
}

function findArticleContentByUrlSafely(url: string) {
  try {
    return findArticleContentByUrl(url)
  } catch (error) {
    feedHubWarn('failed to read article content from database', {
      error: error instanceof Error ? error.message : String(error),
      url,
    })

    return null
  }
}

function upsertArticleContentSafely(record: StoredArticleContent) {
  try {
    upsertArticleContent(record)
  } catch (error) {
    feedHubWarn('failed to persist article content', {
      error: error instanceof Error ? error.message : String(error),
      articleId: record.articleId,
      url: record.url,
    })
  }
}
