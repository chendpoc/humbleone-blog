import type { StandardArticle } from '../types/reader'

export function getRelatedStandardArticles(
  articles: StandardArticle[],
  selectedArticle: StandardArticle,
  limit = 3,
) {
  return articles
    .filter((article) => article.id !== selectedArticle.id)
    .filter(
      (article) =>
        article.sourceId === selectedArticle.sourceId ||
        article.standardCategory === selectedArticle.standardCategory ||
        article.tags.some((tag) => selectedArticle.tags.includes(tag)),
    )
    .slice(0, limit)
}
