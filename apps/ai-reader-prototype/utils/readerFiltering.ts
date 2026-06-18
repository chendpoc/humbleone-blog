import { matchesCategory, normalizeFilter } from './standardReaderModel'
import type { StandardArticle } from '../types/reader'

type FilterStandardArticlesInput = {
  articles: StandardArticle[]
  searchQuery: string
  selectedCategory: string
  selectedSourceId: string | null
}

export function filterStandardArticles({
  articles,
  searchQuery,
  selectedCategory,
  selectedSourceId,
}: FilterStandardArticlesInput) {
  const query = normalizeFilter(searchQuery)

  return articles.filter((article) => {
    const sourceMatch = selectedSourceId ? article.sourceId === selectedSourceId : true
    const categoryMatch = matchesCategory(article, selectedCategory)
    const queryMatch = query
      ? [article.title, article.summary, article.sourceName, article.standardCategory, ...article.tags]
          .join(' ')
          .toLowerCase()
          .includes(query)
      : true

    return sourceMatch && categoryMatch && queryMatch
  })
}
