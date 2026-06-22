import type { DailyBrief, FeedItem } from '../lib/prototype-data'
import type { StandardArticle, StandardSource } from '../types/reader'

export { formatIssueDate } from '../lib/i18n/formatters'

export function flattenArticles(brief: DailyBrief): StandardArticle[] {
  return brief.sections.flatMap((section) =>
    section.items.map((item, index) => ({
      ...item,
      sectionTitle: section.title,
      standardCategory: mapCategory(item, section.title),
      importance:
        section.id === 'hard_news' && index === 0 ? 'breaking' : item.importanceScore >= 82 ? 'top' : 'standard',
    })),
  )
}

export function buildSources(brief: DailyBrief): StandardSource[] {
  return brief.sourceDesk.sourceSlips.map((source) => {
    const feedSourceId = source.id.replace(/^slip-/, 'source-')

    return {
      ...source,
      category: source.sourceFamily ?? 'general',
      active: source.fetchConfigurable
        ? Boolean(source.fetchEnabled) && source.health !== 'failed' && source.state !== 'stale'
        : source.health !== 'failed' && source.state !== 'stale',
      contentType: source.contentType ?? (source.sourceFamily === 'community' ? 'social' : 'article'),
      feedSourceId,
    }
  })
}

export function getSelectedArticle(articles: StandardArticle[], selectedItemId: string) {
  return articles.find((article) => article.id === selectedItemId) ?? articles[0]
}

export function normalizeFilter(value: string) {
  return value.trim().toLowerCase()
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
