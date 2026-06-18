import type { DailyBrief, DailySection, DailySectionKind, FeedItem, SourceDeskData, SourceHealth } from '../../lib/prototype-data'
import { dailyBrief } from '../../lib/prototype-data'
import { getSourceRegistryRecord, type SourceRegistryRecord } from '../sourceRegistry'
import { normalizeRSSHubItems } from './normalize'
import { requestRSSHubRoute } from './rsshubClient'
import { feedHubRsshubSources } from './rsshubSources'
import type { FeedHubResponse, FeedHubSourceConfig, FeedHubSourceResult, NormalizedFeedSource } from './types'

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

export async function getFeedHubBrief(): Promise<FeedHubResponse> {
  const fetchedAt = new Date().toISOString()
  const sourceOutputs = await Promise.all(feedHubRsshubSources.filter((source) => source.enabled).map(fetchRSSHubSource))
  const normalizedSources = sourceOutputs.flatMap((output) => output.source ?? [])
  const sourceResults = sourceOutputs.map((output) => output.result)
  const sections = buildSections(normalizedSources)
  const items = sections.flatMap((section) => section.items)

  if (!items.length) {
    return {
      mode: 'fallback',
      fetchedAt,
      brief: dailyBrief,
      sourceResults,
    }
  }

  const selectedItemId = items[0].id

  return {
    mode: 'rsshub',
    fetchedAt,
    brief: {
      id: `rsshub-${formatLocalDate(new Date(fetchedAt))}`,
      date: formatLocalDate(new Date(fetchedAt)),
      title: 'Today',
      judgment: `RSSHub 已同步 ${items.length} 条 AI / coding-agent 高信号更新，优先阅读官方工程更新和工具 changelog。`,
      itemCount: items.length,
      selectedItemId,
      sourceDesk: buildSourceDesk(normalizedSources, sourceResults, fetchedAt),
      sections,
      reader: {
        skin: 'postmodern_newspaper',
        masthead: 'AI BUILDER DAILY',
        editionLine: `RSSHub Edition / ${formatDisplayDate(new Date(fetchedAt))} / Personal Desk`,
        topicLine: 'Coding Agents, Builder Workflows, Runtime Control',
        selectedItemId,
      },
    },
    sourceResults,
  }
}

async function fetchRSSHubSource(config: FeedHubSourceConfig) {
  const registry = getSourceRegistryRecord(config.sourceId)

  if (!registry) {
    return {
      result: {
        sourceId: config.sourceId,
        rsshubRoute: config.rsshubRoute,
        itemCount: 0,
        status: 'failed',
        error: 'Source registry record is missing.',
      } satisfies FeedHubSourceResult,
    }
  }

  try {
    const data = await requestRSSHubRoute(config.rsshubRoute)
    const items = normalizeRSSHubItems({
      config,
      data,
      fetchedAt: new Date().toISOString(),
      registry,
    })

    return {
      result: {
        sourceId: config.sourceId,
        rsshubRoute: config.rsshubRoute,
        itemCount: items.length,
        status: items.length ? 'ok' : 'empty',
      } satisfies FeedHubSourceResult,
      source: {
        config,
        registry,
        items,
      } satisfies NormalizedFeedSource,
    }
  } catch (error) {
    return {
      result: {
        sourceId: config.sourceId,
        rsshubRoute: config.rsshubRoute,
        itemCount: 0,
        status: 'failed',
        error: error instanceof Error ? error.message : String(error),
      } satisfies FeedHubSourceResult,
    }
  }
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
  sources: NormalizedFeedSource[],
  sourceResults: FeedHubSourceResult[],
  fetchedAt: string,
): SourceDeskData {
  const sourceIds = new Set(feedHubRsshubSources.map((source) => source.sourceId))
  const itemsBySourceId = new Map(sources.map((source) => [source.config.sourceId, source.items]))
  const resultBySourceId = new Map(sourceResults.map((result) => [result.sourceId, result]))
  const sourceSlips = Array.from(sourceIds)
    .map((sourceId) => {
      const registry = getSourceRegistryRecord(sourceId)

      if (!registry) {
        return null
      }

      const items = itemsBySourceId.get(sourceId) ?? []
      const result = resultBySourceId.get(sourceId)
      const health = getSourceHealth(result)

      return {
        id: sourceIdToSlipId(sourceId),
        kind: 'source_slip' as const,
        label: registry.displayName,
        count: items.length || undefined,
        sourceFamily: registry.sourceFamily,
        evidenceLevel: registry.evidenceLevel,
        health,
        state: health === 'failed' ? 'failed' as const : items.length ? 'new' as const : 'default' as const,
        description: registry.whyFollow,
      }
    })
    .filter((source): source is NonNullable<typeof source> => Boolean(source))

  const itemCount = sources.reduce((total, source) => total + source.items.length, 0)
  const activeCount = sourceResults.filter((result) => result.status === 'ok').length
  const failedCount = sourceResults.filter((result) => result.status === 'failed').length

  return {
    ...dailyBrief.sourceDesk,
    issueLabel: 'RSSHub v0.1',
    deskDate: formatDisplayDate(new Date(fetchedAt)),
    navigation: [
      {
        id: 'nav-today',
        kind: 'navigation',
        label: 'Today',
        count: itemCount,
        health: itemCount ? 'fresh' : 'quiet',
        state: 'selected',
        description: '今日 RSSHub 高信号信息饮食。',
      },
      ...dailyBrief.sourceDesk.navigation.filter((item) => item.id !== 'nav-today'),
    ],
    sourceGroups: [
      {
        id: 'group-all-sources',
        kind: 'source_group',
        label: 'All Sources',
        count: sourceSlips.length,
        health: failedCount ? 'quiet' : 'fresh',
        state: 'default',
      },
      {
        id: 'group-high-signal',
        kind: 'source_group',
        label: 'High Signal',
        count: activeCount,
        health: activeCount ? 'fresh' : 'quiet',
        state: activeCount ? 'new' : 'default',
        description: 'RSSHub 当前成功拉取的高信号源。',
      },
      {
        id: 'group-failed',
        kind: 'source_group',
        label: 'Needs Repair',
        count: failedCount,
        health: failedCount ? 'failed' : 'quiet',
        state: failedCount ? 'failed' : 'default',
      },
    ],
    sourceSlips,
  }
}

function getSourceHealth(result: FeedHubSourceResult | undefined): SourceHealth {
  if (!result) {
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
