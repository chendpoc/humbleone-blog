import type { DailyBrief, FeedItem } from '../../lib/prototype-data'
import type { StandardArticle, StandardSource } from './standardReaderTypes'

export const categoryTabs = ['All', 'Breaking', 'AI Labs', 'Builders', 'Runtime', 'Community', 'Research']

const articleImages = [
  '/standard-media/ai-grid.svg',
  '/standard-media/runtime-terminal.svg',
  '/standard-media/builder-notes.svg',
]

const sourceCategoryLabels: Record<string, string> = {
  model_lab: 'AI Labs',
  builder: 'Builders',
  community: 'Community',
  project_changelog: 'Runtime',
  personal_repo: 'Repos',
  research: 'Research',
}

export function flattenArticles(brief: DailyBrief): StandardArticle[] {
  return brief.sections.flatMap((section) =>
    section.items.map((item, index) => ({
      ...item,
      sectionTitle: section.title,
      standardCategory: mapCategory(item, section.title),
      readTime: Math.max(3, Math.round(item.reader.body.join(' ').length / 190)),
      commentCount: Math.round(item.importanceScore * 8 + item.noveltyScore * 5 + index * 71),
      imageUrl: index < 2 ? articleImages[index % articleImages.length] : undefined,
      importance:
        section.id === 'hard_news' && index === 0 ? 'breaking' : item.importanceScore >= 82 ? 'top' : 'standard',
    })),
  )
}

export function buildSources(brief: DailyBrief): StandardSource[] {
  return brief.sourceDesk.sourceSlips.map((source) => ({
    ...source,
    category: sourceCategoryLabels[source.sourceFamily ?? 'research'] ?? 'General',
    active: source.health !== 'failed' && source.state !== 'stale',
    feedSourceId: source.id.replace(/^slip-/, 'source-'),
  }))
}

export function getSelectedArticle(articles: StandardArticle[], selectedItemId: string) {
  return articles.find((article) => article.id === selectedItemId) ?? articles[0]
}

export function formatIssueDate(value: string) {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value.toUpperCase()
  }

  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
    .format(date)
    .toUpperCase()
}

export function normalizeFilter(value: string) {
  return value.trim().toLowerCase()
}

export function matchesCategory(article: StandardArticle, selectedCategory: string) {
  if (selectedCategory === 'All') {
    return true
  }

  if (selectedCategory === 'Breaking') {
    return article.importance === 'breaking'
  }

  return article.standardCategory === selectedCategory.toUpperCase()
}

function mapCategory(item: FeedItem, sectionTitle: string) {
  if (item.sourceFamily === 'model_lab') {
    return 'AI LABS'
  }

  if (item.sourceFamily === 'project_changelog') {
    return 'RUNTIME'
  }

  if (item.sourceFamily === 'community') {
    return 'COMMUNITY'
  }

  if (item.sourceFamily === 'builder' || item.sourceFamily === 'personal_repo') {
    return 'BUILDERS'
  }

  if (item.sourceFamily === 'research') {
    return 'RESEARCH'
  }

  return sectionTitle.toUpperCase()
}
