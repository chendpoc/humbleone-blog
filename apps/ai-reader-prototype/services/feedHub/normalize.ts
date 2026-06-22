import type { DailySectionKind, FeedItem } from '../../lib/prototype-data'
import type { SourceRegistryRecord } from '../sourceRegistry'
import type { FeedHubSourceConfig, RsshubData, RsshubDataItem } from './types'

const sectionLabels: Record<DailySectionKind, string> = {
  hard_news: 'Hard News',
  cases: 'Cases',
  interesting: 'Interesting',
}

const priorityScore: Record<SourceRegistryRecord['priority'], number> = {
  critical: 92,
  high: 84,
  medium: 74,
  low: 62,
}

export function normalizeFeedItems({
  config,
  data,
  fetchedAt,
  registry,
}: {
  config: FeedHubSourceConfig
  data: RsshubData
  fetchedAt: string
  registry: SourceRegistryRecord
}) {
  const lookbackStartMs = getLookbackStartMs(fetchedAt, config.lookbackDays)

  const items = (data.item ?? [])
    .map((item, index) =>
      normalizeFeedItem({
        config,
        data,
        fetchedAt,
        index,
        item,
        registry,
      }),
    )
    .filter((item) => new Date(item.publishedAt).getTime() >= lookbackStartMs)

  return dedupeNormalizedFeedItems(items)
}

export const normalizeRSSHubItems = normalizeFeedItems

function normalizeFeedItem({
  config,
  data,
  fetchedAt,
  index,
  item,
  registry,
}: {
  config: FeedHubSourceConfig
  data: RsshubData
  fetchedAt: string
  index: number
  item: RsshubDataItem
  registry: SourceRegistryRecord
}): FeedItem {
  const publishedAt = normalizeDate(item.pubDate ?? item.updated ?? fetchedAt)
  const url = item.link ?? data.link ?? registry.officialUrl
  const title = stripHtml(item.title).trim() || registry.displayName
  const summary = buildSummary(item, config, title)
  const body = buildBody(item, summary, registry, config, url)
  const sectionLabel = sectionLabels[config.section]
  const baseScore = priorityScore[registry.priority]

  return {
    id: buildItemId(config.sourceId, item, index),
    sourceId: config.sourceId,
    sourceName: registry.displayName,
    sourceFamily: registry.sourceFamily,
    evidenceLevel: registry.evidenceLevel,
    title,
    summary,
    whyItMatters: registry.whyFollow,
    url,
    author: normalizeAuthor(item.author) ?? data.title ?? registry.displayName,
    relativeTime: formatRelativeTime(publishedAt),
    publishedAt,
    fetchedAt,
    tags: Array.from(new Set([...registry.topicTags, ...(item.category ?? [])])).slice(0, 6),
    importanceScore: Math.max(50, baseScore - index * 4),
    noveltyScore: Math.max(50, baseScore - 8 - index * 3),
    language: registry.language === 'zh-CN' ? 'zh-CN' : 'en',
    status: 'new',
    evidenceLinks: [
      {
        label: registry.displayName,
        url,
      },
    ],
    reader: {
      kicker: `${sectionLabel} / ${registry.displayName}`,
      headline: title,
      body,
      aiSummary: summary || title,
      sourceProof: [
        `Source Registry: ${registry.displayName} / ${registry.fetchMethod} / ${registry.evidenceLevel}.`,
        `Adapter: ${config.adapter}.`,
        `Endpoint: ${config.endpoint}.`,
      ],
      followUpQuestions: [
        '这条更新是否会改变 coding-agent 的日常工作流？',
        '是否值得沉淀为 source note 或后续 research 线索？',
      ],
    },
  }
}

function buildItemId(sourceId: string, item: RsshubDataItem, index: number) {
  const rawId = item.guid ?? item.id ?? item.link ?? item.title ?? `${sourceId}-${index}`
  return `feed-${sourceId}-${hashString(String(rawId))}`
}

function dedupeNormalizedFeedItems(items: FeedItem[]) {
  const itemById = new Map<string, FeedItem>()
  const seenSourceUrls = new Set<string>()

  items.forEach((item) => {
    const sourceUrlKey = `${item.sourceId}\u0000${item.url}`

    if (itemById.has(item.id) || seenSourceUrls.has(sourceUrlKey)) {
      return
    }

    itemById.set(item.id, item)
    seenSourceUrls.add(sourceUrlKey)
  })

  return Array.from(itemById.values())
}

function buildSummary(item: RsshubDataItem, config: FeedHubSourceConfig, title: string) {
  if (isHackerNewsAdapter(config)) {
    const text = readItemText(item).replace(/\s+/g, ' ').trim()

    return truncate(text || `Hacker News 热门链接：${title}.`, 220)
  }

  const text = readItemText(item).replace(/\s+/g, ' ').trim()

  return truncate(text || title, 180)
}

function buildBody(
  item: RsshubDataItem,
  summary: string,
  registry: SourceRegistryRecord,
  config: FeedHubSourceConfig,
  url: string,
) {
  if (isHackerNewsAdapter(config)) {
    const discussionParagraphs = splitParagraphs(readItemText(item))

    return [
      `Hacker News API 只提供标题、外部链接和讨论元信息；它不是原文正文来源。外部原文链接：${url}`,
      ...(discussionParagraphs.length
        ? discussionParagraphs
        : [
            item.discussionUrl
              ? `HN 讨论页：${item.discussionUrl}${item.metaText ? `。讨论元信息：${item.metaText}` : ''}`
              : summary,
          ]),
    ]
  }

  const paragraphs = splitParagraphs(readItemText(item))

  if (paragraphs.length) {
    return paragraphs
  }

  return [
    summary || `${registry.displayName} 发布了新条目，需要进一步阅读原文判断具体影响。`,
    `${registry.whyFollow} 当前条目来自 ${registry.fetchMethod} adapter，原始链接保留在 evidence links 中。`,
  ]
}

function isHackerNewsAdapter(config: FeedHubSourceConfig) {
  return config.adapter === 'hackernews.api.topstories'
}

function normalizeDate(value: string | number | Date) {
  const date = value instanceof Date ? value : new Date(value)

  if (Number.isNaN(date.getTime())) {
    return new Date().toISOString()
  }

  return date.toISOString()
}

function getLookbackStartMs(fetchedAt: string, lookbackDays: number) {
  const fetchedAtMs = new Date(fetchedAt).getTime()
  const dayMs = 24 * 60 * 60 * 1000

  return (Number.isNaN(fetchedAtMs) ? Date.now() : fetchedAtMs) - lookbackDays * dayMs
}

function normalizeAuthor(author: RsshubDataItem['author']) {
  if (!author) {
    return undefined
  }

  if (typeof author === 'string') {
    return author
  }

  return author.map((item) => item.name).filter(Boolean).join(', ') || undefined
}

function formatRelativeTime(value: string) {
  const date = new Date(value)
  const diffMs = Date.now() - date.getTime()
  const diffMinutes = Math.max(0, Math.round(diffMs / 60000))

  if (diffMinutes < 60) {
    return `${diffMinutes || 1}m ago`
  }

  const diffHours = Math.round(diffMinutes / 60)

  if (diffHours < 24) {
    return `${diffHours}h ago`
  }

  return `${Math.round(diffHours / 24)}d ago`
}

function stripHtml(value: string) {
  return value
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
}

function readItemText(item: RsshubDataItem) {
  const value = item.content?.text ?? item.content?.html ?? item.description ?? ''

  return stripHtml(preserveTextBreaks(value)).trim()
}

function preserveTextBreaks(value: string) {
  return value
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|section|article|h[1-6]|li|blockquote)>/gi, '\n\n')
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
    .filter((paragraph) => paragraph.length > 0)

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

    if (next.length > 420 && current) {
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

function truncate(value: string, maxLength: number) {
  if (value.length <= maxLength) {
    return value
  }

  return `${value.slice(0, maxLength - 1).trim()}...`
}

function hashString(value: string) {
  let hash = 5381

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 33) ^ value.charCodeAt(index)
  }

  return (hash >>> 0).toString(36)
}
