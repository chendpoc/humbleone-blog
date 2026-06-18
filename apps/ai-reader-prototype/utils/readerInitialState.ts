import { categoryTabs } from './standardReaderModel'
import type { StandardArticle, StandardReaderInitialState, StandardSource } from '../types/reader'

type ResolveStandardReaderInitialStateInput = {
  selectedItemId: string
  articles: StandardArticle[]
  sources: StandardSource[]
  state?: StandardReaderInitialState
}

export function resolveStandardReaderInitialState({
  selectedItemId,
  articles,
  sources,
  state = {},
}: ResolveStandardReaderInitialStateInput): StandardReaderInitialState {
  return {
    selectedArticleId: resolveArticleId(state.selectedArticleId, articles, selectedItemId),
    selectedCategory: resolveCategory(state.selectedCategory),
    selectedSourceId: resolveSourceId(state.selectedSourceId, sources),
    searchQuery: state.searchQuery?.trim(),
    articlePanelOpen: state.articlePanelOpen,
  }
}

function resolveArticleId(value: string | undefined, articles: StandardArticle[], fallbackId: string) {
  if (value && articles.some((article) => article.id === value)) {
    return value
  }

  return articles.some((article) => article.id === fallbackId) ? fallbackId : articles[0]?.id
}

function resolveCategory(value: string | undefined) {
  if (!value) {
    return undefined
  }

  return categoryTabs.find((category) => category.toLowerCase() === value.toLowerCase())
}

function resolveSourceId(value: string | null | undefined, sources: StandardSource[]) {
  if (!value) {
    return undefined
  }

  return sources.some((source) => source.feedSourceId === value) ? value : undefined
}
