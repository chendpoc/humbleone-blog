'use client'

import { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react'
import type { DailyBrief } from '../../lib/prototype-data'
import {
  buildSources,
  flattenArticles,
  getSelectedArticle,
  matchesCategory,
  normalizeFilter,
} from './standardReaderModel'
import type { StandardFeedback, StandardReaderInitialState } from './standardReaderTypes'

const defaultCategory = 'All'

export function useStandardReaderState(brief: DailyBrief, initialState: StandardReaderInitialState = {}) {
  const articles = useMemo(() => flattenArticles(brief), [brief])
  const sources = useMemo(() => buildSources(brief), [brief])
  const [selectedArticleId, setSelectedArticleId] = useState(initialState.selectedArticleId ?? brief.selectedItemId)
  const [selectedCategory, setSelectedCategory] = useState(initialState.selectedCategory ?? defaultCategory)
  const [selectedSourceId, setSelectedSourceId] = useState<string | null>(initialState.selectedSourceId ?? null)
  const [selectedRailMode, setSelectedRailMode] = useState('sources')
  const [searchQuery, setSearchQuery] = useState(initialState.searchQuery ?? '')
  const [articlePanelOpen, setArticlePanelOpen] = useState(initialState.articlePanelOpen ?? true)
  const [feedback, setFeedback] = useState<StandardFeedback>(null)
  const deferredSearchQuery = useDeferredValue(searchQuery)
  const didWriteUrl = useRef(false)

  const activeSources = sources.filter((source) => source.active).length
  const filteredArticles = useMemo(() => {
    const query = normalizeFilter(deferredSearchQuery)

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
  }, [articles, deferredSearchQuery, selectedCategory, selectedSourceId])
  const selectedArticle =
    filteredArticles.find((article) => article.id === selectedArticleId) ??
    getSelectedArticle(articles, selectedArticleId)

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    const url = new URL(window.location.href)

    applyUrlParam(url, 'q', searchQuery)
    applyUrlParam(url, 'category', selectedCategory === defaultCategory ? '' : selectedCategory)
    applyUrlParam(url, 'source', selectedSourceId ?? '')
    applyUrlParam(url, 'item', selectedArticle.id === brief.selectedItemId ? '' : selectedArticle.id)
    applyUrlParam(url, 'detail', articlePanelOpen ? '' : '0')

    const nextUrl = `${url.pathname}${url.search}${url.hash}`
    const currentUrl = `${window.location.pathname}${window.location.search}${window.location.hash}`

    if (didWriteUrl.current && nextUrl === currentUrl) {
      return
    }

    didWriteUrl.current = true
    window.history.replaceState(window.history.state, '', nextUrl)
  }, [
    articlePanelOpen,
    brief.selectedItemId,
    searchQuery,
    selectedArticle.id,
    selectedCategory,
    selectedSourceId,
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
    actions: {
      clearSourceFilter,
      clearReaderFilters,
      closeArticlePanel,
      openArticlePanel,
      selectArticle,
      selectNextArticle,
      selectSource,
      setFeedback,
      setArticlePanelOpen,
      setSearchQuery,
      setSelectedCategory,
      setSelectedRailMode,
    },
  }
}

function applyUrlParam(url: URL, key: string, value: string) {
  if (value) {
    url.searchParams.set(key, value)
    return
  }

  url.searchParams.delete(key)
}
