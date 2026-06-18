import type { FeedItem, SourceDeskItem } from '../lib/prototype-data'
import type { SourceRegistryRecord } from '../services/sourceRegistry'

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
  feedSourceId: string
  registry?: SourceRegistryRecord
}

export type StandardFeedback = 'helpful' | 'not-helpful' | null

export type StandardActionNotice = {
  articleId: string
  label: string
  tone: 'neutral' | 'positive'
} | null

export type StandardReaderInitialState = {
  selectedArticleId?: string
  selectedCategory?: string
  selectedSourceId?: string | null
  searchQuery?: string
  articlePanelOpen?: boolean
}

export type SourcePanelPreferences = {
  activeOnly: boolean
  collapsedGroups: string[]
}
