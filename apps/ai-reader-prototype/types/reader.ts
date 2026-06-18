import type { FeedItem, SourceDeskItem } from '../lib/prototype-data'
import type { SourceContentType, SourceRegistryRecord } from '../services/sourceRegistry'

export type StandardArticle = FeedItem & {
  sectionTitle: string
  standardCategory: string
  readTime: number
  commentCount: number
  imageUrl?: string
  importance: 'breaking' | 'top' | 'standard'
}

export type StandardSource = SourceDeskItem & {
  category: string
  active: boolean
  contentType: SourceContentType
  feedSourceId: string
  registry?: SourceRegistryRecord
}

export type SourceCollection = {
  id: string
  name: string
  sourceIds: string[]
  systemCategory?: string
}

export type SourceCollectionState = {
  collections: SourceCollection[]
  sourceAliases: Record<string, string>
}

export type StandardFeedback = 'helpful' | 'not-helpful' | null

export type StandardLibraryFilter = 'bookmarks' | 'favorites'

export type StandardActionNotice = {
  articleId: string
  label: string
  tone: 'neutral' | 'positive'
} | null

export type StandardReaderInitialState = {
  selectedArticleId?: string
  selectedSourceId?: string | null
  searchQuery?: string
  articlePanelOpen?: boolean
}

export type SourcePanelPreferences = {
  activeOnly: boolean
  collapsedGroups: string[]
}
