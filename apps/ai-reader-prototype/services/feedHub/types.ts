import type { DailyBrief, DailySectionKind, FeedItem } from '../../lib/prototype-data'
import type { SourceRegistryRecord } from '../sourceRegistry'

export type FeedHubSourceConfig = {
  adapter: string
  endpoint: string
  fetchMethod: SourceRegistryRecord['fetchMethod']
  lookbackDays: number
  sourceId: string
  rsshubRoute: string
  section: DailySectionKind
  enabled: boolean
  updateFrequency: string
}

export type FeedHubSourceResult = {
  endpoint: string
  fetchMethod: SourceRegistryRecord['fetchMethod']
  sourceId: string
  rsshubRoute: string
  itemCount: number
  rawItemCount?: number
  normalizedItemCount?: number
  fetchedItemCount?: number
  upstreamItemCount?: number
  status: 'ok' | 'empty' | 'failed'
  error?: string
}

export type FeedHubPageInfo = {
  hasMore: boolean
  limit: number
  nextOffset?: number
  offset: number
  returnedCount: number
  totalCount: number
}

export type FeedHubResponse = {
  mode: 'feedhub' | 'rsshub' | 'fallback'
  fetchedAt: string
  brief: DailyBrief
  pageInfo: FeedHubPageInfo
  sourceResults: FeedHubSourceResult[]
}

export type RsshubDataItem = {
  title: string
  description?: string
  discussionUrl?: string
  metaText?: string
  pubDate?: number | string | Date
  link?: string
  author?: string | Array<{ name: string; url?: string; avatar?: string }>
  guid?: string
  id?: string
  content?: {
    html?: string
    text?: string
  }
  updated?: number | string | Date
  category?: string[]
}

export type RsshubData = {
  title: string
  description?: string
  link?: string
  item?: RsshubDataItem[]
}

export type NormalizedFeedSource = {
  config: FeedHubSourceConfig
  registry: SourceRegistryRecord
  items: FeedItem[]
}
