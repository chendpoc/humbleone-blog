import type { DailyBrief, DailySectionKind, FeedItem } from '../../lib/prototype-data'
import type { SourceRegistryRecord } from '../sourceRegistry'

export type FeedHubSourceConfig = {
  sourceId: string
  rsshubRoute: string
  section: DailySectionKind
  maxItems: number
  enabled: boolean
}

export type FeedHubSourceResult = {
  sourceId: string
  rsshubRoute: string
  itemCount: number
  status: 'ok' | 'empty' | 'failed'
  error?: string
}

export type FeedHubResponse = {
  mode: 'rsshub' | 'fallback'
  fetchedAt: string
  brief: DailyBrief
  sourceResults: FeedHubSourceResult[]
}

export type RsshubDataItem = {
  title: string
  description?: string
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
