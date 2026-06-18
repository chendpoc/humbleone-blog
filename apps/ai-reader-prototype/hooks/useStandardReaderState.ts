'use client'

import { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { DailyBrief } from '../lib/prototype-data'
import { copyTextToClipboard } from '../services/browserClipboard'
import { readStandardArticleState, writeStandardArticleState } from '../services/standardReaderStorage'
import type {
  StandardActionNotice,
  StandardFeedback,
  StandardLibraryFilter,
  StandardReaderInitialState,
} from '../types/reader'
import { filterStandardArticles } from '../utils/readerFiltering'
import { resolveStandardReaderInitialState } from '../utils/readerInitialState'
import { getRelatedStandardArticles } from '../utils/readerRelations'
import { readStandardReaderInitialStateFromSearch, writeStandardReaderUrlState } from '../utils/readerUrlState'
import { buildSources, flattenArticles, getSelectedArticle } from '../utils/standardReaderModel'

export function useStandardReaderState(brief: DailyBrief, initialState?: StandardReaderInitialState) {
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
  const [selectedSourceId, setSelectedSourceId] = useState<string | null>(
    () => explicitInitialState.selectedSourceId ?? null,
  )
  const [selectedRailMode, setSelectedRailMode] = useState('sources')
  const [searchQuery, setSearchQuery] = useState(() => explicitInitialState.searchQuery ?? '')
  const [articlePanelOpen, setArticlePanelOpen] = useState(() => explicitInitialState.articlePanelOpen ?? true)
  const [feedback, setFeedback] = useState<StandardFeedback>(null)
  const [readArticleIds, setReadArticleIds] = useState(() => readStandardArticleState(articles).readArticleIds)
  const [savedArticleIds, setSavedArticleIds] = useState(() => readStandardArticleState(articles).savedArticleIds)
  const [favoritedArticleIds, setFavoritedArticleIds] = useState(
    () => readStandardArticleState(articles).favoritedArticleIds,
  )
  const [articleStateHydrated, setArticleStateHydrated] = useState(false)
  const [showUnreadOnly, setShowUnreadOnly] = useState(false)
  const [libraryFilter, setLibraryFilter] = useState<StandardLibraryFilter | null>(null)
  const [actionNotice, setActionNotice] = useState<StandardActionNotice>(null)
  const [feedNotice, setFeedNotice] = useState<string | null>(null)
  const [copiedAnalysisArticleId, setCopiedAnalysisArticleId] = useState<string | null>(null)
  const [relatedOpen, setRelatedOpen] = useState(false)
  const [urlHydrated, setUrlHydrated] = useState(hasExplicitInitialState)
  const deferredSearchQuery = useDeferredValue(searchQuery)
  const noticeTimerRef = useRef<number | null>(null)
  const feedNoticeTimerRef = useRef<number | null>(null)
  const copyTimerRef = useRef<number | null>(null)

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
  const unreadCount = articles.reduce((count, article) => count + (readArticleIds.has(article.id) ? 0 : 1), 0)

  useEffect(() => {
    const nextArticleState = readStandardArticleState(articles)

    setReadArticleIds(nextArticleState.readArticleIds)
    setSavedArticleIds(nextArticleState.savedArticleIds)
    setFavoritedArticleIds(nextArticleState.favoritedArticleIds)
    setArticleStateHydrated(true)
  }, [articles])

  useEffect(() => {
    if (!articleStateHydrated) {
      return
    }

    writeStandardArticleState({ readArticleIds, savedArticleIds, favoritedArticleIds })
  }, [articleStateHydrated, favoritedArticleIds, readArticleIds, savedArticleIds])

  useEffect(
    () => () => {
      if (noticeTimerRef.current) {
        window.clearTimeout(noticeTimerRef.current)
      }

      if (copyTimerRef.current) {
        window.clearTimeout(copyTimerRef.current)
      }

      if (feedNoticeTimerRef.current) {
        window.clearTimeout(feedNoticeTimerRef.current)
      }
    },
    [],
  )

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
    setSelectedSourceId(urlInitialState.selectedSourceId ?? null)
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
    setSelectedSourceId((current) => (current === sourceId ? null : sourceId))
  }

  function clearSourceFilter() {
    setSelectedSourceId(null)
  }

  function selectLibraryFilter(filter: StandardLibraryFilter) {
    setSelectedSourceId(null)
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
    setSelectedSourceId(null)
    setShowUnreadOnly(false)
    setLibraryFilter(null)
  }

  function refreshFeed() {
    showFeedNotice(t('feed.notice.refreshed', { count: articles.length }))
  }

  function markAllRead() {
    setReadArticleIds((current) => {
      const next = new Set(current)

      filteredArticles.forEach((article) => next.add(article.id))
      return next
    })
    showFeedNotice(t('feed.notice.markedRead', { count: filteredArticles.length }))
  }

  function toggleSaveArticle(articleId: string) {
    const willSave = !savedArticleIds.has(articleId)

    setSavedArticleIds((current) => {
      const next = new Set(current)

      if (next.has(articleId)) {
        next.delete(articleId)
        return next
      }

      next.add(articleId)
      return next
    })
    showActionNotice(articleId, willSave ? t('actions.saved') : t('actions.removed'), willSave ? 'positive' : 'neutral')
  }

  function toggleFavoriteArticle(articleId: string) {
    const willFavorite = !favoritedArticleIds.has(articleId)

    setFavoritedArticleIds((current) => {
      const next = new Set(current)

      if (next.has(articleId)) {
        next.delete(articleId)
        return next
      }

      next.add(articleId)
      return next
    })
    showActionNotice(articleId, willFavorite ? t('actions.favorited') : t('actions.unfavorited'), willFavorite ? 'positive' : 'neutral')
  }

  function shareArticle(articleId: string) {
    const article = articles.find((item) => item.id === articleId)

    if (!article) {
      return
    }

    void copyTextToClipboard(article.url)
    showActionNotice(articleId, t('actions.linkCopied'), 'positive')
  }

  function copyAnalysis(articleId: string) {
    const article = articles.find((item) => item.id === articleId)

    if (!article) {
      return
    }

    void copyTextToClipboard(article.reader.aiSummary)
    setCopiedAnalysisArticleId(articleId)
    showActionNotice(articleId, t('actions.analysisCopied'), 'positive')

    if (copyTimerRef.current) {
      window.clearTimeout(copyTimerRef.current)
    }

    copyTimerRef.current = window.setTimeout(() => setCopiedAnalysisArticleId(null), 1800)
  }

  function showActionNotice(articleId: string, label: string, tone: 'neutral' | 'positive') {
    setActionNotice({ articleId, label, tone })

    if (noticeTimerRef.current) {
      window.clearTimeout(noticeTimerRef.current)
    }

    noticeTimerRef.current = window.setTimeout(() => setActionNotice(null), 1800)
  }

  function showFeedNotice(label: string) {
    setFeedNotice(label)

    if (feedNoticeTimerRef.current) {
      window.clearTimeout(feedNoticeTimerRef.current)
    }

    feedNoticeTimerRef.current = window.setTimeout(() => setFeedNotice(null), 1800)
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
    actionNotice,
    feedNotice,
    copiedAnalysisArticleId,
    relatedArticles,
    relatedOpen,
    hasActiveFilters,
    actions: {
      clearSourceFilter,
      clearLibraryFilter,
      clearReaderFilters,
      copyAnalysis,
      closeArticlePanel,
      openArticlePanel,
      markAllRead,
      refreshFeed,
      shareArticle,
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
      toggleFavoriteArticle,
      toggleSaveArticle,
    },
  }
}
