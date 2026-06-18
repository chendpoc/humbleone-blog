import { resolveStandardReaderInitialState } from './readerInitialState'
import type { StandardArticle, StandardReaderInitialState, StandardSource } from '../types/reader'

type StandardReaderUrlState = {
  articlePanelOpen: boolean
  defaultArticleId: string
  searchQuery: string
  selectedArticleId: string
  selectedCategory: string
  selectedSourceId: string | null
}

export function readStandardReaderInitialStateFromSearch(
  search: string,
  selectedItemId: string,
  articles: StandardArticle[],
  sources: StandardSource[],
): StandardReaderInitialState {
  const params = new URLSearchParams(search)

  return resolveStandardReaderInitialState({
    selectedItemId,
    articles,
    sources,
    state: {
      selectedArticleId: params.get('item') ?? undefined,
      selectedCategory: params.get('category') ?? undefined,
      selectedSourceId: params.get('source'),
      searchQuery: params.get('q') ?? undefined,
      articlePanelOpen: params.get('detail') === '0' ? false : undefined,
    },
  })
}

export function writeStandardReaderUrlState(url: URL, state: StandardReaderUrlState) {
  applyUrlParam(url, 'q', state.searchQuery)
  applyUrlParam(url, 'category', state.selectedCategory === 'All' ? '' : state.selectedCategory)
  applyUrlParam(url, 'source', state.selectedSourceId ?? '')
  applyUrlParam(url, 'item', state.selectedArticleId === state.defaultArticleId ? '' : state.selectedArticleId)
  applyUrlParam(url, 'detail', state.articlePanelOpen ? '' : '0')
}

function applyUrlParam(url: URL, key: string, value: string) {
  if (value) {
    url.searchParams.set(key, value)
    return
  }

  url.searchParams.delete(key)
}
