import { createHash } from 'node:crypto'
import type { FeedItem } from '../../lib/prototype-data'
import { getReaderDatabase } from '../db/readerDatabase'
import type { SourceRegistryRecord } from '../sourceRegistry'
import { applyCachedArticleContentToFeedItems } from './articleContent'
import type { FeedHubSourceConfig, FeedHubSourceResult, NormalizedFeedSource } from './types'

export type SourceFetchState = {
  enabled: boolean
  itemCount: number
  normalizedItemCount?: number
  rawItemCount?: number
  lastCheckedAt?: string
  lastError?: string
  lastFeedHash?: string
  lastItemPublishedAt?: string
  lastSuccessAt?: string
  nextCheckAt?: string
  rsshubRoute: string
  sourceId: string
  status: 'idle' | 'ok' | 'empty' | 'failed' | 'skipped'
  updateFrequency: string
  updatedAt: string
}

type SourceFetchStateRow = {
  enabled: 0 | 1
  item_count: number
  normalized_item_count: number | null
  raw_item_count: number | null
  last_checked_at: string | null
  last_error: string | null
  last_feed_hash: string | null
  last_item_published_at: string | null
  last_success_at: string | null
  next_check_at: string | null
  rsshub_route: string
  source_id: string
  status: SourceFetchState['status']
  update_frequency: string
  updated_at: string
}

type FeedItemRow = {
  item_json: string
}

type FeedItemBySourceRow = FeedItemRow & {
  source_id: string
}

type PaginationWindow = {
  limit: number
  offset: number
}

export type StoredFeedSourcesResult = {
  sources: NormalizedFeedSource[]
  hasMore: boolean
  nextOffset?: number
  returnedCount: number
  totalCount: number
}

type UpsertFeedSourceInput = {
  config: FeedHubSourceConfig
  fetchedAt: string
  result: FeedHubSourceResult
  source?: NormalizedFeedSource
}

export function getSourceFetchStates(sourceIds: string[]) {
  if (!sourceIds.length) {
    return new Map<string, SourceFetchState>()
  }

  const placeholders = sourceIds.map(() => '?').join(', ')
  const rows = getReaderDatabase()
    .prepare(`
      SELECT *
      FROM source_fetch_states
      WHERE source_id IN (${placeholders})
    `)
    .all(...sourceIds) as SourceFetchStateRow[]

  return new Map(rows.map((row) => [row.source_id, parseSourceFetchStateRow(row)]))
}

export function getDueFeedHubSources({
  force,
  now,
  sources,
}: {
  force: boolean
  now: Date
  sources: FeedHubSourceConfig[]
}) {
  const states = getSourceFetchStates(sources.map((source) => source.sourceId))
  const nowMs = now.getTime()

  return sources.filter((source) => {
    if (!source.enabled) {
      return false
    }

    if (force) {
      return true
    }

    if (source.updateFrequency.toLowerCase().includes('disabled')) {
      return false
    }

    const state = states.get(source.sourceId)

    if (!state?.nextCheckAt) {
      return true
    }

    return new Date(state.nextCheckAt).getTime() <= nowMs
  })
}

export function readStoredFeedSources(
  sources: Array<{ config: FeedHubSourceConfig; registry: SourceRegistryRecord }>,
  pagination: PaginationWindow,
): StoredFeedSourcesResult {
  const db = getReaderDatabase()
  const { limit, offset } = normalizeFeedHubPagination(pagination)

  if (!sources.length) {
    return {
      sources: [],
      hasMore: false,
      returnedCount: 0,
      totalCount: 0,
    }
  }

  const conditions = sources
    .map(() => '(source_id = ? AND published_at >= ?)')
    .join(' OR ')
  const params = sources.flatMap(({ config }) => [config.sourceId, getLookbackStartAt(config.lookbackDays)])

  const totalCountRow = db
    .prepare(`
      SELECT COUNT(*) AS total_count
      FROM feed_items
      WHERE ${conditions}
    `)
    .all(...params) as Array<{ total_count: number }>

  const totalCount = Number(totalCountRow.at(0)?.total_count ?? 0)

  const rows = db
    .prepare(`
      SELECT source_id, item_json
      FROM feed_items
      WHERE ${conditions}
      ORDER BY published_at DESC
      LIMIT ? OFFSET ?
    `)
    .all(...params, limit, offset) as FeedItemBySourceRow[]

  const hydratedItems = applyCachedArticleContentToFeedItems(
    rows
      .map((row) => parseFeedItem(row.item_json))
      .filter((item): item is FeedItem => Boolean(item)),
  )
  const itemsBySourceId = new Map<string, FeedItem[]>()

  hydratedItems.forEach((item) => {
    const sourceItems = itemsBySourceId.get(item.sourceId)

    if (sourceItems) {
      sourceItems.push(item)
      return
    }

    itemsBySourceId.set(item.sourceId, [item])
  })

  const returnedCount = hydratedItems.length
  const hasMore = offset + returnedCount < totalCount

  return {
    sources: sources.map(({ config, registry }) => ({
      config,
      registry,
      items: itemsBySourceId.get(config.sourceId) ?? [],
    })),
    hasMore,
    nextOffset: hasMore ? offset + returnedCount : undefined,
    returnedCount,
    totalCount,
  }
}

export function readSourceResultsFromState(sources: FeedHubSourceConfig[]): FeedHubSourceResult[] {
  const states = getSourceFetchStates(sources.map((source) => source.sourceId))

  return sources.map((source) => {
    const state = states.get(source.sourceId)

    if (!state) {
      return {
        endpoint: source.endpoint,
        fetchMethod: source.fetchMethod,
        sourceId: source.sourceId,
        rsshubRoute: source.rsshubRoute,
        itemCount: 0,
        normalizedItemCount: 0,
        rawItemCount: 0,
        fetchedItemCount: 0,
        status: 'empty',
      }
    }

    const normalizedItemCount = state.normalizedItemCount ?? 0

    return {
      endpoint: source.endpoint,
      fetchMethod: source.fetchMethod,
      sourceId: source.sourceId,
      rsshubRoute: source.rsshubRoute,
      itemCount: normalizedItemCount,
      fetchedItemCount: state.itemCount,
      normalizedItemCount: state.normalizedItemCount,
      rawItemCount: state.rawItemCount,
      upstreamItemCount: state.rawItemCount,
      status: state.status === 'failed' ? 'failed' : normalizedItemCount ? 'ok' : 'empty',
      error: state.lastError,
    }
  })
}

export function upsertFeedHubSourceResult({
  config,
  fetchedAt,
  result,
  source,
}: UpsertFeedSourceInput) {
  const db = getReaderDatabase()
  const now = new Date(fetchedAt)
  const items = dedupeFeedItems(source?.items ?? [])
  const storedItemCount = items.length
  const feedHash = createFeedHash(items)
  const lastItemPublishedAt = items
    .map((item) => item.publishedAt)
    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0]
  const nextCheckAt = new Date(now.getTime() + getUpdateFrequencyMs(config.updateFrequency)).toISOString()
  const write = db.transaction(() => {
    db.prepare(`
      INSERT INTO source_fetch_states (
        source_id,
        rsshub_route,
        enabled,
        update_frequency,
        status,
        item_count,
        raw_item_count,
        normalized_item_count,
        last_checked_at,
        last_success_at,
        next_check_at,
        last_error,
        last_feed_hash,
        last_item_published_at,
        updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(source_id) DO UPDATE SET
        rsshub_route = excluded.rsshub_route,
        enabled = excluded.enabled,
        update_frequency = excluded.update_frequency,
        status = excluded.status,
        item_count = excluded.item_count,
        raw_item_count = excluded.raw_item_count,
        normalized_item_count = excluded.normalized_item_count,
        last_checked_at = excluded.last_checked_at,
        last_success_at = COALESCE(excluded.last_success_at, source_fetch_states.last_success_at),
        next_check_at = excluded.next_check_at,
        last_error = excluded.last_error,
        last_feed_hash = COALESCE(excluded.last_feed_hash, source_fetch_states.last_feed_hash),
        last_item_published_at = COALESCE(excluded.last_item_published_at, source_fetch_states.last_item_published_at),
        updated_at = excluded.updated_at
    `).run(
      result.sourceId,
      result.rsshubRoute,
      config.enabled ? 1 : 0,
      config.updateFrequency,
      result.status,
      storedItemCount,
      result.rawItemCount ?? null,
      result.normalizedItemCount ?? result.itemCount,
      fetchedAt,
      result.status === 'ok' || result.status === 'empty' ? fetchedAt : null,
      nextCheckAt,
      result.error ?? null,
      feedHash || null,
      lastItemPublishedAt ?? null,
      fetchedAt,
    )

    const upsertItem = db.prepare(`
      INSERT INTO feed_items (
        id,
        source_id,
        url,
        title,
        published_at,
        fetched_at,
        content_hash,
        item_json,
        updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT DO UPDATE SET
        id = excluded.id,
        source_id = excluded.source_id,
        url = excluded.url,
        title = excluded.title,
        published_at = excluded.published_at,
        fetched_at = excluded.fetched_at,
        content_hash = excluded.content_hash,
        item_json = excluded.item_json,
        updated_at = excluded.updated_at
    `)

    items.forEach((item) => {
      upsertItem.run(
        item.id,
        item.sourceId,
        item.url,
        item.title,
        item.publishedAt,
        item.fetchedAt,
        createFeedItemHash(item),
        JSON.stringify(item),
        fetchedAt,
      )
    })
  })

  write()
}

function dedupeFeedItems(items: FeedItem[]) {
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

function parseSourceFetchStateRow(row: SourceFetchStateRow): SourceFetchState {
  return {
    enabled: row.enabled === 1,
    itemCount: row.item_count,
    normalizedItemCount: row.normalized_item_count ?? undefined,
    rawItemCount: row.raw_item_count ?? undefined,
    lastCheckedAt: row.last_checked_at ?? undefined,
    lastError: row.last_error ?? undefined,
    lastFeedHash: row.last_feed_hash ?? undefined,
    lastItemPublishedAt: row.last_item_published_at ?? undefined,
    lastSuccessAt: row.last_success_at ?? undefined,
    nextCheckAt: row.next_check_at ?? undefined,
    rsshubRoute: row.rsshub_route,
    sourceId: row.source_id,
    status: row.status,
    updateFrequency: row.update_frequency,
    updatedAt: row.updated_at,
  }
}

function normalizeFeedHubPagination(pagination: PaginationWindow) {
  return {
    limit: Number.isFinite(pagination.limit) ? Math.max(1, Math.floor(pagination.limit)) : 50,
    offset: Number.isFinite(pagination.offset) ? Math.max(0, Math.floor(pagination.offset)) : 0,
  }
}

export function parseFeedItem(value: string) {
  try {
    const parsed = JSON.parse(value) as FeedItem

    return parsed?.id && parsed?.sourceId && parsed?.url ? parsed : null
  } catch {
    return null
  }
}

function getUpdateFrequencyMs(value: string) {
  const normalized = value.toLowerCase()
  const hourMs = 1000 * 60 * 60

  if (normalized.includes('twice')) {
    return hourMs * 12
  }

  if (normalized.includes('hour')) {
    return hourMs
  }

  if (normalized.includes('weekly')) {
    return hourMs * 24 * 7
  }

  return hourMs * 24
}

function createFeedHash(items: FeedItem[]) {
  if (!items.length) {
    return ''
  }

  return createHash('sha256')
    .update(items.map((item) => createFeedItemHash(item)).join('\n'))
    .digest('hex')
}

function getLookbackStartAt(lookbackDays: number) {
  const dayMs = 24 * 60 * 60 * 1000

  return new Date(Date.now() - lookbackDays * dayMs).toISOString()
}

function createFeedItemHash(item: FeedItem) {
  return createHash('sha256')
    .update(item.url)
    .update('\n')
    .update(item.title)
    .update('\n')
    .update(item.publishedAt)
    .update('\n')
    .update(item.summary)
    .update('\n')
    .update(item.reader.body.join('\n\n'))
    .digest('hex')
}
