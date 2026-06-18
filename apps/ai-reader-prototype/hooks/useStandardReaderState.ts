'use client'

import { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react'
import type { DailyBrief } from '../lib/prototype-data'
import { copyTextToClipboard } from '../services/browserClipboard'
import { readSavedArticleIds, writeSavedArticleIds } from '../services/standardReaderStorage'
import type {
  StandardActionNotice,
  StandardFeedback,
  StandardReaderInitialState,
} from '../types/reader'
import { filterStandardArticles } from '../utils/readerFiltering'
import { resolveStandardReaderInitialState } from '../utils/readerInitialState'
import { getRelatedStandardArticles } from '../utils/readerRelations'
import { readStandardReaderInitialStateFromSearch, writeStandardReaderUrlState } from '../utils/readerUrlState'
import { buildSources, flattenArticles, getSelectedArticle } from '../utils/standardReaderModel'

const defaultCategory = 'All'

export function useStandardReaderState(brief: DailyBrief, initialState?: StandardReaderInitialState) {
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
  const [selectedCategory, setSelectedCategory] = useState(
    () => explicitInitialState.selectedCategory ?? defaultCategory,
  )
  const [selectedSourceId, setSelectedSourceId] = useState<string | null>(
    () => explicitInitialState.selectedSourceId ?? null,
  )
  const [selectedRailMode, setSelectedRailMode] = useState('sources')
  const [searchQuery, setSearchQuery] = useState(() => explicitInitialState.searchQuery ?? '')
  const [articlePanelOpen, setArticlePanelOpen] = useState(() => explicitInitialState.articlePanelOpen ?? true)
  const [feedback, setFeedback] = useState<StandardFeedback>(null)
  const [savedArticleIds, setSavedArticleIds] = useState(() => readSavedArticleIds(articles))
  const [savedIdsHydrated, setSavedIdsHydrated] = useState(false)
  const [actionNotice, setActionNotice] = useState<StandardActionNotice>(null)
  const [copiedAnalysisArticleId, setCopiedAnalysisArticleId] = useState<string | null>(null)
  const [relatedOpen, setRelatedOpen] = useState(false)
  const [urlHydrated, setUrlHydrated] = useState(hasExplicitInitialState)
  const deferredSearchQuery = useDeferredValue(searchQuery)
  const noticeTimerRef = useRef<number | null>(null)
  const copyTimerRef = useRef<number | null>(null)

  const activeSources = sources.filter((source) => source.active).length
  const filteredArticles = useMemo(
    () =>
      filterStandardArticles({
        articles,
        searchQuery: deferredSearchQuery,
        selectedCategory,
        selectedSourceId,
      }),
    [articles, deferredSearchQuery, selectedCategory, selectedSourceId],
  )
  const selectedArticle =
    filteredArticles.find((article) => article.id === selectedArticleId) ??
    getSelectedArticle(articles, selectedArticleId)
  const hasActiveFilters = Boolean(searchQuery || selectedCategory !== defaultCategory || selectedSourceId)
  const relatedArticles = useMemo(() => getRelatedStandardArticles(articles, selectedArticle), [articles, selectedArticle])

  useEffect(() => {
    setSavedArticleIds(readSavedArticleIds(articles))
    setSavedIdsHydrated(true)
  }, [articles])

  useEffect(() => {
    if (!savedIdsHydrated) {
      return
    }

    writeSavedArticleIds(savedArticleIds)
  }, [savedArticleIds, savedIdsHydrated])

  useEffect(
    () => () => {
      if (noticeTimerRef.current) {
        window.clearTimeout(noticeTimerRef.current)
      }

      if (copyTimerRef.current) {
        window.clearTimeout(copyTimerRef.current)
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
    setSelectedCategory(urlInitialState.selectedCategory ?? defaultCategory)
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
      selectedCategory,
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
    selectedCategory,
    selectedSourceId,
    urlHydrated,
  ])

  function selectSource(sourceId: string) {
    setSelectedSourceId((current) => (current === sourceId ? null : sourceId))
  }

  function clearSourceFilter() {
    setSelectedSourceId(null)
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
    setSelectedCategory(defaultCategory)
    setSelectedSourceId(null)
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
    showActionNotice(articleId, willSave ? 'Saved' : 'Removed', willSave ? 'positive' : 'neutral')
  }

  function shareArticle(articleId: string) {
    const article = articles.find((item) => item.id === articleId)

    if (!article) {
      return
    }

    void copyTextToClipboard(article.url)
    showActionNotice(articleId, 'Link copied', 'positive')
  }

  function copyAnalysis(articleId: string) {
    const article = articles.find((item) => item.id === articleId)

    if (!article) {
      return
    }

    void copyTextToClipboard(article.reader.aiSummary)
    setCopiedAnalysisArticleId(articleId)
    showActionNotice(articleId, 'Analysis copied', 'positive')

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

  return {
    articles,
    sources,
    activeSources,
    filteredArticles,
    selectedArticle,
    selectedCategory,
    selectedSourceId,
    selectedRailMode,
    searchQuery,
    articlePanelOpen,
    feedback,
    savedArticleIds,
    actionNotice,
    copiedAnalysisArticleId,
    relatedArticles,
    relatedOpen,
    hasActiveFilters,
    actions: {
      clearSourceFilter,
      clearReaderFilters,
      copyAnalysis,
      closeArticlePanel,
      openArticlePanel,
      shareArticle,
      selectArticle,
      selectNextArticle,
      selectSource,
      setFeedback,
      setArticlePanelOpen,
      setRelatedOpen,
      setSearchQuery,
      setSelectedCategory,
      setSelectedRailMode,
      toggleSaveArticle,
    },
  }
}
