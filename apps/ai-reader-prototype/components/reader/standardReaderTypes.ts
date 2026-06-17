import type { FeedItem, SourceDeskItem } from '../../lib/prototype-data'

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
}

export type StandardFeedback = 'helpful' | 'not-helpful' | null

export type StandardReaderInitialState = {
  selectedArticleId?: string
  selectedCategory?: string
  selectedSourceId?: string | null
  searchQuery?: string
  articlePanelOpen?: boolean
}
