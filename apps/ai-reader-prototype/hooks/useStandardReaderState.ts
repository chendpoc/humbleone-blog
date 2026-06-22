'use client'

import { useDeferredValue, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useArticleReadState } from './useArticleReadState'
import { useArticleLibraryState } from './api/useArticleLibraryState'
import { useFeedRefreshControl } from './useFeedRefreshControl'
import { useReaderArticleActions } from './useReaderArticleActions'
import { useTimedState } from './useTimedState'
import type { DailyBrief } from '../lib/prototype-data'
import type {
  StandardFeedback,
  StandardLibraryFilter,
  StandardReaderInitialState,
} from '../types/reader'
import { filterStandardArticles } from '../utils/readerFiltering'
import { resolveStandardReaderInitialState } from '../utils/readerInitialState'
import { getRelatedStandardArticles } from '../utils/readerRelations'
import { readStandardReaderInitialStateFromSearch, writeStandardReaderUrlState } from '../utils/readerUrlState'
import { buildSources, flattenArticles, getSelectedArticle } from '../utils/standardReaderModel'

type UseStandardReaderStateOptions = {
  onSelectedSourceIdChange?: (sourceId: string | null) => void
  onRefreshFeed?: () => Promise<DailyBrief | null>
  selectedSourceId?: string | null
}

export function useStandardReaderState(
  brief: DailyBrief,
  initialState?: StandardReaderInitialState,
  options: UseStandardReaderStateOptions = {},
) {
  const { t } = useTranslation('reader')
  const articles = useMemo(() => flattenArticles(brief), [brief])
  const sources = useMemo(() => buildSources(brief), [brief])
  const explicitInitialState = useMemo(
    () =>
      resolveStandardReaderInitialState({
        selectedItemId: brief.selectedItemId,
        articles,
        sources,
        state: initialState,
      }),
    [articles, brief, initialState, sources],
  )
  const hasExplicitInitialState = Boolean(initialState && Object.keys(initialState).length)
  const [selectedArticleId, setSelectedArticleId] = useState(
    () => explicitInitialState.selectedArticleId ?? brief.selectedItemId,
  )
  const [internalSelectedSourceId, setInternalSelectedSourceId] = useState<string | null>(
    () => explicitInitialState.selectedSourceId ?? null,
  )
  const sourceStateControlled = Boolean(options.onSelectedSourceIdChange)
  const selectedSourceId = sourceStateControlled ? options.selectedSourceId ?? null : internalSelectedSourceId
  const [selectedRailMode, setSelectedRailMode] = useState('sources')
  const [searchQuery, setSearchQuery] = useState(() => explicitInitialState.searchQuery ?? '')
  const [articlePanelOpen, setArticlePanelOpen] = useState(() => explicitInitialState.articlePanelOpen ?? true)
  const [feedback, setFeedback] = useState<StandardFeedback>(null)
  const articleReadState = useArticleReadState(articles)
  const { readArticleIds, unreadCount } = articleReadState
  const articleLibraryState = useArticleLibraryState(articles)
  const { favoritedArticleIds, savedArticleIds } = articleLibraryState
  const [showUnreadOnly, setShowUnreadOnly] = useState(false)
  const [libraryFilter, setLibraryFilter] = useState<StandardLibraryFilter | null>(null)
  const articleActions = useReaderArticleActions({
    articles,
    labels: {
      analysisCopied: t('actions.analysisCopied'),
      favorited: t('actions.favorited'),
      linkCopied: t('actions.linkCopied'),
      removed: t('actions.removed'),
      saved: t('actions.saved'),
      unfavorited: t('actions.unfavorited'),
    },
    libraryActions: articleLibraryState.actions,
  })
  const feedNoticeState = useTimedState<string | null>(null)
  const feedRefreshControl = useFeedRefreshControl({
    articleCount: articles.length,
    labels: {
      refreshed: (count) => t('feed.notice.refreshed', { count }),
      refreshFailed: t('feed.notice.refreshFailed'),
    },
    onNotice: showFeedNotice,
    onRefreshFeed: options.onRefreshFeed,
  })
  const [relatedOpen, setRelatedOpen] = useState(false)
  const [urlHydrated, setUrlHydrated] = useState(hasExplicitInitialState)
  const deferredSearchQuery = useDeferredValue(searchQuery)

  const activeSources = sources.filter((source) => source.active).length
  const filteredArticles = useMemo(
    () => {
      const nextArticles = filterStandardArticles({
        articles,
        searchQuery: deferredSearchQuery,
        selectedSourceId,
      })
      const libraryFilteredArticles =
        libraryFilter === 'bookmarks'
          ? nextArticles.filter((article) => savedArticleIds.has(article.id))
          : libraryFilter === 'favorites'
            ? nextArticles.filter((article) => favoritedArticleIds.has(article.id))
            : nextArticles

      return showUnreadOnly
        ? libraryFilteredArticles.filter((article) => !readArticleIds.has(article.id))
        : libraryFilteredArticles
    },
    [
      articles,
      deferredSearchQuery,
      favoritedArticleIds,
      libraryFilter,
      readArticleIds,
      savedArticleIds,
      selectedSourceId,
      showUnreadOnly,
    ],
  )
  const selectedArticle =
    filteredArticles.find((article) => article.id === selectedArticleId) ??
    getSelectedArticle(articles, selectedArticleId)
  const hasActiveFilters = Boolean(searchQuery || selectedSourceId || showUnreadOnly || libraryFilter)
  const relatedArticles = useMemo(() => getRelatedStandardArticles(articles, selectedArticle), [articles, selectedArticle])

  useEffect(() => {
    if (hasExplicitInitialState || typeof window === 'undefined') {
      setUrlHydrated(true)
      return
    }

    const urlInitialState = readStandardReaderInitialStateFromSearch(
      window.location.search,
      brief.selectedItemId,
      articles,
      sources,
    )

    setSelectedArticleId(urlInitialState.selectedArticleId ?? brief.selectedItemId)
    setReaderSelectedSourceId(urlInitialState.selectedSourceId ?? null)
    setSearchQuery(urlInitialState.searchQuery ?? '')
    setArticlePanelOpen(urlInitialState.articlePanelOpen ?? true)
    setUrlHydrated(true)
  }, [articles, brief, hasExplicitInitialState, sources])

  useEffect(() => {
    if (!filteredArticles.length) {
      return
    }

    if (filteredArticles.some((article) => article.id === selectedArticleId)) {
      return
    }

    setSelectedArticleId(filteredArticles[0].id)
    setFeedback(null)
  }, [filteredArticles, selectedArticleId])

  useEffect(() => {
    if (!urlHydrated || typeof window === 'undefined') {
      return
    }

    const url = new URL(window.location.href)

    writeStandardReaderUrlState(url, {
      articlePanelOpen,
      defaultArticleId: brief.selectedItemId,
      searchQuery,
      selectedArticleId: selectedArticle.id,
      selectedSourceId,
    })

    const nextUrl = `${url.pathname}${url.search}${url.hash}`
    const currentUrl = `${window.location.pathname}${window.location.search}${window.location.hash}`

    if (nextUrl === currentUrl) {
      return
    }

    window.history.replaceState(window.history.state, '', nextUrl)
  }, [
    articlePanelOpen,
    brief.selectedItemId,
    searchQuery,
    selectedArticle.id,
    selectedSourceId,
    urlHydrated,
  ])

  function selectSource(sourceId: string) {
    setLibraryFilter(null)
    setReaderSelectedSourceId(selectedSourceId === sourceId ? null : sourceId)
  }

  function clearSourceFilter() {
    setReaderSelectedSourceId(null)
  }

  function selectLibraryFilter(filter: StandardLibraryFilter) {
    setReaderSelectedSourceId(null)
    setLibraryFilter((current) => (current === filter ? null : filter))
  }

  function clearLibraryFilter() {
    setLibraryFilter(null)
  }

  function selectArticle(articleId: string) {
    setSelectedArticleId(articleId)
    setArticlePanelOpen(true)
    setFeedback(null)
    setRelatedOpen(false)
    articleReadState.actions.markArticleRead(articleId)
  }

  function closeArticlePanel() {
    setArticlePanelOpen(false)
  }

  function openArticlePanel() {
    setArticlePanelOpen(true)
  }

  function selectNextArticle(direction: 1 | -1) {
    if (!filteredArticles.length) {
      return
    }

    const currentIndex = filteredArticles.findIndex((article) => article.id === selectedArticle.id)
    const safeIndex = currentIndex >= 0 ? currentIndex : 0
    const nextIndex = (safeIndex + direction + filteredArticles.length) % filteredArticles.length

    selectArticle(filteredArticles[nextIndex].id)
  }

  function clearReaderFilters() {
    setSearchQuery('')
    setReaderSelectedSourceId(null)
    setShowUnreadOnly(false)
    setLibraryFilter(null)
  }

  function setReaderSelectedSourceId(sourceId: string | null) {
    if (options.onSelectedSourceIdChange) {
      options.onSelectedSourceIdChange(sourceId)
      return
    }

    setInternalSelectedSourceId(sourceId)
  }

  function markAllRead() {
    articleReadState.actions.markArticlesRead(filteredArticles.map((article) => article.id))
    showFeedNotice(t('feed.notice.markedRead', { count: filteredArticles.length }))
  }

  function showFeedNotice(label: string) {
    feedNoticeState.setTimedValue(label)
  }

  return {
    articles,
    sources,
    activeSources,
    filteredArticles,
    unreadCount,
    selectedArticle,
    selectedSourceId,
    selectedRailMode,
    searchQuery,
    articlePanelOpen,
    feedback,
    readArticleIds,
    savedArticleIds,
    favoritedArticleIds,
    libraryFilter,
    showUnreadOnly,
    actionNotice: articleActions.actionNotice,
    feedNotice: feedNoticeState.value,
    feedRefreshing: feedRefreshControl.feedRefreshing,
    copiedAnalysisArticleId: articleActions.copiedAnalysisArticleId,
    relatedArticles,
    relatedOpen,
    hasActiveFilters,
    actions: {
      clearSourceFilter,
      clearLibraryFilter,
      clearReaderFilters,
      copyAnalysis: articleActions.actions.copyAnalysis,
      closeArticlePanel,
      openArticlePanel,
      markAllRead,
      refreshFeed: feedRefreshControl.refreshFeed,
      shareArticle: articleActions.actions.shareArticle,
      selectArticle,
      selectLibraryFilter,
      selectNextArticle,
      selectSource,
      setFeedback,
      setArticlePanelOpen,
      setRelatedOpen,
      setSearchQuery,
      setShowUnreadOnly,
      setSelectedRailMode,
      toggleFavoriteArticle: articleActions.actions.toggleFavoriteArticle,
      toggleSaveArticle: articleActions.actions.toggleSaveArticle,
    },
  }
}
