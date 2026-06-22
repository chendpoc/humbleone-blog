import type { DailySection, DailySectionKind, SourceDeskData, SourceHealth } from '../../lib/prototype-data'
import { dailyBrief } from '../../lib/prototype-data'
import {
  getSourceRegistryRecord,
  loadEffectiveSourceRegistry,
  type EffectiveSourceRegistry,
} from '../sourceRegistry'
import {
  readSourceResultsFromState,
  readStoredFeedSources,
  type StoredFeedSourcesResult,
} from './feedHubRepository'
import { getFeedHubSources } from './rsshubSources'
import type { FeedHubResponse, FeedHubSourceConfig, FeedHubSourceResult, NormalizedFeedSource } from './types'

const defaultFeedHubLimit = 20
const maxFeedHubLimit = 200

const sectionMeta: Record<DailySectionKind, Pick<DailySection, 'title' | 'description'>> = {
  hard_news: {
    title: 'Hard News',
    description: '直接改变工具、平台或工程工作流的更新。',
  },
  cases: {
    title: 'Cases',
    description: '来自 builder、工具产品和社区的真实使用案例。',
  },
  interesting: {
    title: 'Interesting',
    description: '值得后续研究的观察、仓库和弱信号。',
  },
}

type ReadFeedHubProjectionPagination = {
  limit?: number
  offset?: number
}

type FeedHubPageInfo = {
  hasMore: boolean
  limit: number
  nextOffset?: number
  offset: number
  returnedCount: number
  totalCount: number
}

export async function readFeedHubProjection({
  fetchedAt = new Date().toISOString(),
  limit = defaultFeedHubLimit,
  offset = 0,
  sourceId,
}: {
  fetchedAt?: string
  limit?: number
  offset?: number
  sourceId?: string | null
} = {}): Promise<FeedHubResponse> {
  const pagination = normalizePagination({ limit, offset })
  const sourceRegistry = await loadEffectiveSourceRegistry()
  const feedHubSources = getFeedHubSources(sourceRegistry)
  const enabledFeedHubSources = feedHubSources.filter((source) => source.enabled)
  const sourceEntries = getFeedHubSourceEntries(enabledFeedHubSources, sourceRegistry)
  const normalizedSourceId = sourceId?.trim()
  const filteredSourceEntries = normalizedSourceId
    ? sourceEntries.filter(({ config }) => config.sourceId === normalizedSourceId)
    : sourceEntries
  const storedSources = readStoredFeedSources(filteredSourceEntries, pagination)
  const sourceResults = readSourceResultsFromState(feedHubSources)

  return buildFeedHubResponse({
    fetchedAt,
    feedHubSources,
    pagination: {
      ...storedSources,
      limit: pagination.limit,
      offset: pagination.offset,
    },
    sections: buildSections(storedSources.sources),
    selectedSourceId: normalizedSourceId,
    sourceRegistry,
    sourceResults,
  })
}

function buildFeedHubResponse({
  fetchedAt,
  feedHubSources,
  pagination,
  sections,
  selectedSourceId,
  sourceRegistry,
  sourceResults,
}: {
  fetchedAt: string
  feedHubSources: FeedHubSourceConfig[]
  pagination: StoredFeedSourcesResult & { limit: number; offset: number }
  sections: DailySection[]
  selectedSourceId?: string
  sourceRegistry: EffectiveSourceRegistry
  sourceResults: FeedHubSourceResult[]
}): FeedHubResponse {
  const pageInfo = buildPageInfo(pagination)
  const items = sections.flatMap((section) => section.items)
  const sourceDesk = buildSourceDesk(
    sourceResults,
    getTotalSourceItemCount(sourceResults),
    fetchedAt,
    sourceRegistry,
    feedHubSources,
  )

  if (!items.length && pageInfo.totalCount === 0) {
    const fallbackBrief = buildFallbackBrief(selectedSourceId, sourceDesk)
    const fallbackItemCount = fallbackBrief.sections.reduce((count, section) => count + section.items.length, 0)

    return {
      mode: 'fallback',
      fetchedAt,
      brief: fallbackBrief,
      pageInfo: {
        hasMore: false,
        limit: pagination.limit,
        offset: 0,
        returnedCount: fallbackItemCount,
        totalCount: fallbackItemCount,
      },
      sourceResults,
    }
  }

  const selectedItemId = items[0]?.id ?? dailyBrief.selectedItemId

  return {
    mode: 'feedhub',
    fetchedAt,
    brief: {
      id: `feedhub-${formatLocalDate(new Date(fetchedAt))}`,
      date: formatLocalDate(new Date(fetchedAt)),
      title: 'Today',
      judgment: `Feed Hub 已同步 ${pageInfo.totalCount} 条 AI / coding-agent 高信号更新，当前显示 ${items.length} 条。优先阅读官方工程更新、工具 changelog 和高信号社区案例。`,
      itemCount: items.length,
      selectedItemId,
      sourceDesk: {
        ...sourceDesk,
      },
      sections,
      reader: {
        skin: 'postmodern_newspaper',
        masthead: 'AI BUILDER DAILY',
        editionLine: `Feed Hub Edition / ${formatDisplayDate(new Date(fetchedAt))} / Personal Desk`,
        topicLine: 'Coding Agents, Builder Workflows, Runtime Control',
        selectedItemId,
      },
    },
    pageInfo,
    sourceResults,
  }
}

function buildFallbackBrief(selectedSourceId: string | undefined, sourceDesk: SourceDeskData) {
  if (!selectedSourceId) {
    const itemCount = dailyBrief.sections.reduce((count, section) => count + section.items.length, 0)

    return {
      ...dailyBrief,
      itemCount,
      sourceDesk,
    }
  }

  const sections = dailyBrief.sections.map((section) => ({
    ...section,
    items: section.items.filter((item) => item.sourceId === selectedSourceId),
  }))
  const items = sections.flatMap((section) => section.items)
  const selectedItemId = items[0]?.id ?? dailyBrief.selectedItemId

  return {
    ...dailyBrief,
    itemCount: items.length,
    selectedItemId,
    reader: {
      ...dailyBrief.reader,
      selectedItemId,
    },
    sections,
    sourceDesk,
  }
}

function buildPageInfo(
  pagination: {
    hasMore: boolean
    nextOffset?: number
    totalCount: number
    returnedCount: number
    limit: number
    offset: number
  },
): FeedHubPageInfo {
  return {
    hasMore: pagination.hasMore,
    limit: pagination.limit,
    ...(pagination.nextOffset ? { nextOffset: pagination.nextOffset } : {}),
    offset: pagination.offset,
    returnedCount: pagination.returnedCount,
    totalCount: pagination.totalCount,
  }
}

function normalizePagination({
  limit,
  offset,
}: ReadFeedHubProjectionPagination) {
  const normalizedLimit = typeof limit === 'number' && Number.isInteger(limit)
    ? Math.min(Math.max(limit, 1), maxFeedHubLimit)
    : defaultFeedHubLimit
  const normalizedOffset = typeof offset === 'number' && Number.isInteger(offset) ? Math.max(offset, 0) : 0

  return {
    limit: normalizedLimit,
    offset: normalizedOffset,
  }
}

function getFeedHubSourceEntries(
  feedHubSources: FeedHubSourceConfig[],
  sourceRegistry: EffectiveSourceRegistry,
) {
  return feedHubSources.flatMap((config) => {
    const registry = getSourceRegistryRecord(sourceRegistry, config.sourceId)

    return registry ? [{ config, registry }] : []
  })
}

function buildSections(sources: NormalizedFeedSource[]): DailySection[] {
  return (Object.keys(sectionMeta) as DailySectionKind[]).map((sectionId) => {
    const items = sources
      .filter((source) => source.config.section === sectionId)
      .flatMap((source) => source.items)
      .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())

    return {
      id: sectionId,
      ...sectionMeta[sectionId],
      items,
    }
  })
}

function buildSourceDesk(
  sourceResults: FeedHubSourceResult[],
  totalSourceItemCount: number,
  fetchedAt: string,
  sourceRegistry: EffectiveSourceRegistry,
  feedHubSources: FeedHubSourceConfig[],
): SourceDeskData {
  const resultBySourceId = new Map(sourceResults.map((result) => [result.sourceId, result]))
  const feedHubSourceById = new Map(feedHubSources.map((source) => [source.sourceId, source]))
  const sourceSlips = sourceRegistry.records
    .map((registry) => {
      const result = resultBySourceId.get(registry.sourceId)
      const feedHubSource = feedHubSourceById.get(registry.sourceId)
      const health = getSourceHealth(result, feedHubSource)
      const sourceItemCount = getSourceItemCount(result)

      return {
        id: sourceIdToSlipId(registry.sourceId),
        kind: 'source_slip' as const,
        label: registry.displayName,
        count: sourceItemCount || undefined,
        sourceFamily: registry.sourceFamily,
        evidenceLevel: registry.evidenceLevel,
        health,
        state: resolveSourceSlipState(health, sourceItemCount, Boolean(feedHubSource?.enabled)),
        description: registry.whyFollow,
        contentType: registry.contentType,
        topicTags: registry.topicTags,
        adapter: registry.adapter,
        fetchConfigurable: Boolean(feedHubSource),
        fetchEnabled: feedHubSource?.enabled ?? false,
        fetchLookbackDays: feedHubSource?.lookbackDays,
      }
    })

  const failedCount = sourceResults.filter((result) => result.status === 'failed').length

  return {
    ...dailyBrief.sourceDesk,
    issueLabel: 'Feed Hub v0.1',
    deskDate: formatDisplayDate(new Date(fetchedAt)),
    navigation: [
      {
        id: 'nav-today',
        kind: 'navigation',
        label: 'Today',
        count: totalSourceItemCount,
        health: totalSourceItemCount ? 'fresh' : 'quiet',
        state: 'selected',
        description: '今日 Feed Hub 高信号信息饮食。',
      },
      ...dailyBrief.sourceDesk.navigation.filter((item) => item.id !== 'nav-today'),
    ],
    sourceGroups: sourceRegistry.groups.map((group) => ({
      id: group.id,
      kind: 'source_group' as const,
      label: group.name,
      count: group.sourceIds.length,
      health: failedCount ? 'quiet' : 'fresh',
      state: group.sourceIds.some((sourceId) => resultBySourceId.get(sourceId)?.status === 'ok')
        ? 'new' as const
        : 'default' as const,
    })),
    sourceCollections: sourceRegistry.groups,
    sourceSlips,
  }
}

function getSourceItemCount(result: FeedHubSourceResult | undefined) {
  return result?.normalizedItemCount ?? result?.fetchedItemCount ?? result?.itemCount ?? 0
}

function getTotalSourceItemCount(sourceResults: FeedHubSourceResult[]) {
  return sourceResults.reduce((total, result) => total + getSourceItemCount(result), 0)
}

function resolveSourceSlipState(health: SourceHealth, itemCount: number, fetchEnabled: boolean) {
  if (health === 'failed') {
    return 'failed' as const
  }

  if (itemCount) {
    return 'new' as const
  }

  return fetchEnabled ? 'stale' as const : 'default' as const
}

function getSourceHealth(result: FeedHubSourceResult | undefined, feedHubSource: FeedHubSourceConfig | undefined): SourceHealth {
  if (!feedHubSource?.enabled || !result) {
    return 'quiet'
  }

  if (result.status === 'failed') {
    return 'failed'
  }

  if (result.status === 'empty') {
    return 'quiet'
  }

  return 'fresh'
}

function sourceIdToSlipId(sourceId: string) {
  return `slip-${sourceId.replace(/^source-/, '')}`
}

function formatLocalDate(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function formatDisplayDate(date: Date) {
  return formatLocalDate(date).replaceAll('-', '.')
}
