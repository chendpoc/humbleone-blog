import { randomUUID } from 'node:crypto'
import {
  getSourceRegistryRecord,
  loadEffectiveSourceRegistry,
  type EffectiveSourceRegistry,
} from '../sourceRegistry'
import { hydrateFeedItemsWithArticleContent } from './articleContent'
import {
  getDueFeedHubSources,
  upsertFeedHubSourceResult,
} from './feedHubRepository'
import {
  completeFetchRun,
  createFetchRun,
  mapFeedHubResultStatus,
  type FetchRunTriggerType,
} from '../logging/fetchRunRepository'
import { feedHubDebug, isFeedHubDebugEnabled } from './feedHubLogger'
import { normalizeFeedItems } from './normalize'
import { requestOfficialApiSource } from './officialApiClient'
import { requestOfficialFeed } from './officialFeedClient'
import { requestRSSHubRoute } from './rsshubClient'
import { getFeedHubSources } from './rsshubSources'
import type { FeedHubSourceConfig, FeedHubSourceResult, NormalizedFeedSource, RsshubData } from './types'

export type FeedHubSyncOptions = {
  force?: boolean
  hydrateArticles?: boolean
}

type FeedHubSourceSyncOutput = {
  config: FeedHubSourceConfig
  result: FeedHubSourceResult
  source?: NormalizedFeedSource
}

export async function syncFeedHubSources({
  force = false,
  hydrateArticles = false,
}: FeedHubSyncOptions = {}) {
  const fetchedAt = new Date().toISOString()
  const sourceRegistry = await loadEffectiveSourceRegistry()
  const feedHubSources = getFeedHubSources(sourceRegistry)
  const dueSources = getDueFeedHubSources({
    force,
    now: new Date(fetchedAt),
    sources: feedHubSources,
  })

  const syncCorrelationId = randomUUID()
  const triggerType = resolveFetchTriggerType(force)

  feedHubDebug('starting feed hub sync', {
    force,
    hydrateArticles,
    enabledSourceCount: feedHubSources.filter((source) => source.enabled).length,
    dueSourceCount: dueSources.length,
    dueSourceIds: dueSources.map((source) => source.sourceId),
    triggerType,
  }, syncCorrelationId)

  const sourceOutputs = await Promise.all(
    dueSources.map((source) => fetchFeedHubSource(source, sourceRegistry, triggerType, syncCorrelationId)),
  )
  const refreshSources = sourceOutputs.flatMap((output) => output.source ?? [])
  const persistedRefreshSources = hydrateArticles
    ? await hydrateNormalizedFeedSources(refreshSources)
    : refreshSources
  const refreshSourceById = new Map(
    persistedRefreshSources.map((source) => [source.config.sourceId, source]),
  )

  sourceOutputs.forEach((output) => {
    upsertFeedHubSourceResult({
      config: output.config,
      fetchedAt,
      result: output.result,
      source: refreshSourceById.get(output.config.sourceId),
    })
  })

  return {
    dueSourceCount: dueSources.length,
    fetchedAt,
    sourceResults: sourceOutputs.map((output) => output.result),
  }
}

async function fetchFeedHubSource(
  config: FeedHubSourceConfig,
  sourceRegistry: EffectiveSourceRegistry,
  triggerType: FetchRunTriggerType,
  syncCorrelationId: string,
): Promise<FeedHubSourceSyncOutput> {
  const startedAt = new Date().toISOString()
  const startedMs = Date.now()
  const registry = getSourceRegistryRecord(sourceRegistry, config.sourceId)

  if (!registry) {
    return {
      config,
      result: {
        endpoint: config.endpoint,
        fetchMethod: config.fetchMethod,
        sourceId: config.sourceId,
        rsshubRoute: config.rsshubRoute,
        itemCount: 0,
        normalizedItemCount: 0,
        rawItemCount: 0,
        upstreamItemCount: 0,
        fetchedItemCount: 0,
        status: 'failed',
        error: 'Source registry record is missing.',
      },
    }
  }

  const fetchRunId = createFetchRun({
    endpoint: config.endpoint,
    fetchMethod: config.fetchMethod,
    sourceId: config.sourceId,
    startedAt,
    triggerType,
  })

  try {
    feedHubDebug(`fetching Feed Hub source for ${config.sourceId}`, {
      adapter: config.adapter,
      endpoint: config.endpoint,
      fetchMethod: config.fetchMethod,
      sourceId: config.sourceId,
      section: config.section,
      fetchRunId,
    }, syncCorrelationId)

    const data = await requestFeedHubSource(config)
    const rawItemCount = data.item?.length ?? 0

    feedHubDebug(`Feed Hub response for ${config.sourceId}`, {
      adapter: config.adapter,
      endpoint: config.endpoint,
      fetchMethod: config.fetchMethod,
      sourceId: config.sourceId,
      feedTitle: data.title,
      feedLink: data.link,
      itemCount: rawItemCount,
      itemPreview: (data.item ?? []).slice(0, 5).map((item) => ({
        title: item.title,
        link: item.link,
        pubDate: item.pubDate,
      })),
    }, syncCorrelationId)

    const items = normalizeFeedItems({
      config,
      data,
      fetchedAt: new Date().toISOString(),
      registry,
    })

    feedHubDebug(`normalized Feed Hub items for ${config.sourceId}`, {
      sourceId: config.sourceId,
      itemCount: items.length,
      itemPreview: items.slice(0, 8).map((item) => ({
        id: item.id,
        title: item.title,
        url: item.url,
        publishedAt: item.publishedAt,
        sourceName: item.sourceName,
      })),
    }, syncCorrelationId)

    const result: FeedHubSourceResult = {
      endpoint: config.endpoint,
      fetchMethod: config.fetchMethod,
      sourceId: config.sourceId,
      rsshubRoute: config.rsshubRoute,
      itemCount: items.length,
      normalizedItemCount: items.length,
      upstreamItemCount: rawItemCount,
      fetchedItemCount: items.length,
      rawItemCount,
      status: items.length ? 'ok' : 'empty',
    }

    completeFetchRun({
      id: fetchRunId,
      finishedAt: new Date().toISOString(),
      durationMs: Date.now() - startedMs,
      status: mapFeedHubResultStatus(result.status),
      rawItemCount,
      normalizedItemCount: items.length,
      insertedCount: items.length,
    })

    return {
      config,
      result,
      source: {
        config,
        registry,
        items,
      },
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)

    feedHubDebug(`Feed Hub fetch failed for ${config.sourceId}`, {
      adapter: config.adapter,
      endpoint: config.endpoint,
      fetchMethod: config.fetchMethod,
      sourceId: config.sourceId,
      error: errorMessage,
    }, syncCorrelationId)

    completeFetchRun({
      id: fetchRunId,
      finishedAt: new Date().toISOString(),
      durationMs: Date.now() - startedMs,
      status: 'failed',
      rawItemCount: 0,
      normalizedItemCount: 0,
      insertedCount: 0,
      errorMessage,
    })

    return {
      config,
      result: {
        endpoint: config.endpoint,
        fetchMethod: config.fetchMethod,
        sourceId: config.sourceId,
        rsshubRoute: config.rsshubRoute,
        itemCount: 0,
        normalizedItemCount: 0,
        upstreamItemCount: 0,
        fetchedItemCount: 0,
        rawItemCount: 0,
        status: 'failed',
        error: errorMessage,
      },
    }
  }
}

function resolveFetchTriggerType(force: boolean): FetchRunTriggerType {
  if (isFeedHubDebugEnabled()) {
    return 'debug'
  }

  if (force) {
    return 'manual'
  }

  return 'scheduled'
}

async function requestFeedHubSource(config: FeedHubSourceConfig): Promise<RsshubData> {
  if (config.fetchMethod === 'rsshub') {
    return requestRSSHubRoute(config.rsshubRoute)
  }

  if (config.fetchMethod === 'official_rss') {
    return requestOfficialFeed(config.endpoint)
  }

  if (config.fetchMethod === 'official_api') {
    return requestOfficialApiSource(config)
  }

  throw new Error(`Unsupported Feed Hub fetch method: ${config.fetchMethod}`)
}

async function hydrateNormalizedFeedSources(sources: NormalizedFeedSource[]) {
  const items = sources.flatMap((source) => source.items)
  const hydratedItems = await hydrateFeedItemsWithArticleContent(items)
  const hydratedItemById = new Map(hydratedItems.map((item) => [item.id, item]))

  return sources.map((source) => ({
    ...source,
    items: source.items.map((item) => hydratedItemById.get(item.id) ?? item),
  }))
}
