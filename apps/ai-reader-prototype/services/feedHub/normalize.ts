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

export function normalizeRSSHubItems({
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
  return (data.item ?? []).slice(0, config.maxItems).map((item, index) =>
    normalizeRSSHubItem({
      config,
      data,
      fetchedAt,
      index,
      item,
      registry,
    }),
  )
}

function normalizeRSSHubItem({
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
  const summary = buildSummary(item)
  const title = stripHtml(item.title).trim() || registry.displayName
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
      body: [
        summary || `${registry.displayName} 发布了新条目，需要进一步阅读原文判断具体影响。`,
        `${registry.whyFollow} 当前条目来自 RSSHub 路由 ${config.rsshubRoute}，原始链接保留在 evidence links 中。`,
      ],
      aiSummary: summary || title,
      sourceProof: [
        `Source Registry: ${registry.displayName} / ${registry.fetchMethod} / ${registry.evidenceLevel}.`,
        `RSSHub route: ${config.rsshubRoute}.`,
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
  return `rsshub-${sourceId}-${hashString(String(rawId))}`
}

function buildSummary(item: RsshubDataItem) {
  const value = item.description ?? item.content?.text ?? item.content?.html ?? ''
  return truncate(stripHtml(value).replace(/\s+/g, ' ').trim(), 180)
}

function normalizeDate(value: string | number | Date) {
  const date = value instanceof Date ? value : new Date(value)

  if (Number.isNaN(date.getTime())) {
    return new Date().toISOString()
  }

  return date.toISOString()
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
