'use client'

import { useRef } from 'react'
import type { DailyBrief } from '../../lib/prototype-data'
import { ResizableReaderLayout } from './ResizableReaderLayout'
import type { ResizableReaderLayoutControls } from './ResizableReaderLayout'
import { useStandardReaderKeyboard } from '../../hooks/useStandardReaderKeyboard'
import { useStandardReaderState } from '../../hooks/useStandardReaderState'
import { StandardArticlePanel } from './StandardArticlePanel'
import { StandardFeedPanel } from './StandardFeedPanel'
import { StandardSourceRail } from './StandardSourceRail'
import { StandardSourcesPanel } from './StandardSourcesPanel'
import { StandardSearchCommand } from './StandardSearchCommand'
import type { StandardReaderInitialState } from '../../types/reader'
import { StandardArticleRestorePanel } from './StandardArticleRestorePanel'

type StandardReaderPrototypeProps = {
  brief: DailyBrief
  canLoadMoreFeed?: boolean
  initialState?: StandardReaderInitialState
  loadingMoreFeed?: boolean
  loadedFeedCount?: number
  onRefreshFeed?: () => Promise<DailyBrief | null>
  onLoadMoreFeed?: () => Promise<void> | void
  onSourceConfigChanged?: () => Promise<void> | void
  onSelectedSourceIdChange?: (sourceId: string | null) => void
  selectedSourceId?: string | null
  totalFeedCount?: number
}

export function StandardReaderPrototype({
  brief,
  canLoadMoreFeed = false,
  initialState,
  loadingMoreFeed = false,
  loadedFeedCount = brief.itemCount,
  onLoadMoreFeed,
  onRefreshFeed,
  onSelectedSourceIdChange,
  onSourceConfigChanged,
  selectedSourceId,
  totalFeedCount = brief.itemCount,
}: StandardReaderPrototypeProps) {
  const searchInputRef = useRef<HTMLInputElement>(null)
  const readerState = useStandardReaderState(brief, initialState, {
    onRefreshFeed,
    onSelectedSourceIdChange,
    selectedSourceId,
  })
  useStandardReaderKeyboard({
    hasActiveFilters: readerState.hasActiveFilters,
    actions: readerState.actions,
  })

  function selectRailMode(mode: string, controls: ResizableReaderLayoutControls) {
    readerState.actions.setSelectedRailMode(mode)

    if (mode === 'sources') {
      controls.expandSourcesPanel()
      return
    }

    if (mode === 'signals') {
      readerState.actions.clearSourceFilter()
      readerState.actions.clearLibraryFilter()
      readerState.actions.setShowUnreadOnly(true)
      return
    }

    if (mode === 'trends') {
      readerState.actions.setShowUnreadOnly(false)
      readerState.actions.selectLibraryFilter('favorites')
      return
    }

    if (mode === 'radio') {
      void readerState.actions.refreshFeed()
    }
  }

  function activateRailHome(controls: ResizableReaderLayoutControls) {
    readerState.actions.setSelectedRailMode('sources')
    readerState.actions.clearReaderFilters()
    controls.expandSourcesPanel()
  }

  function activateRailLibrary() {
    readerState.actions.setSelectedRailMode('library')
    readerState.actions.setShowUnreadOnly(false)
    readerState.actions.selectLibraryFilter('bookmarks')
  }

  function activateRailSettings(controls: ResizableReaderLayoutControls) {
    readerState.actions.setSelectedRailMode('settings')
    controls.expandSourcesPanel()
  }

  return (
    <main className="standard-reader" data-theme="standard">
      <StandardSearchCommand
        resultCount={readerState.filteredArticles.length}
        searchQuery={readerState.searchQuery}
        searchInputRef={searchInputRef}
        onSearchQueryChange={readerState.actions.setSearchQuery}
      />
      <ResizableReaderLayout
        articlePanelOpen={readerState.articlePanelOpen}
        renderLeft={(controls) => (
          controls.sourcesCollapsed && !controls.sourcesCollapsing ? (
            <StandardSourceRail
              selectedMode={readerState.selectedRailMode}
              sourcesCollapsed={controls.sourcesCollapsed}
              onActivateHome={() => activateRailHome(controls)}
              onOpenLibrary={activateRailLibrary}
              onOpenSettings={() => activateRailSettings(controls)}
              onSelectMode={(mode) => selectRailMode(mode, controls)}
            />
          ) : (
            <StandardSourcesPanel
              sources={readerState.sources}
              activeSources={readerState.activeSources}
              collapsing={controls.sourcesCollapsing}
              configuredCollections={brief.sourceDesk.sourceCollections}
              libraryCounts={{
                bookmarks: readerState.savedArticleIds.size,
                favorites: readerState.favoritedArticleIds.size,
              }}
              libraryFilter={readerState.libraryFilter}
              selectedSourceId={readerState.selectedSourceId}
              onCollapse={controls.collapseSourcesPanel}
              onSelectLibraryFilter={readerState.actions.selectLibraryFilter}
              onSelectSource={readerState.actions.selectSource}
              onSourceConfigChanged={onSourceConfigChanged}
            />
          )
        )}
        feed={
          <StandardFeedPanel
            articles={readerState.filteredArticles}
            selectedArticleId={readerState.selectedArticle.id}
            selectedSourceId={readerState.selectedSourceId}
            articlePanelOpen={readerState.articlePanelOpen}
            unreadCount={readerState.unreadCount}
            readArticleIds={readerState.readArticleIds}
            savedArticleIds={readerState.savedArticleIds}
            favoritedArticleIds={readerState.favoritedArticleIds}
            showUnreadOnly={readerState.showUnreadOnly}
            actionNotice={readerState.actionNotice}
            feedNotice={readerState.feedNotice}
            feedRefreshing={readerState.feedRefreshing}
            hasMoreArticles={canLoadMoreFeed}
            libraryFilter={readerState.libraryFilter}
            loadedArticleCount={loadedFeedCount}
            loadingMoreArticles={loadingMoreFeed}
            totalArticleCount={totalFeedCount}
            onSelectArticle={readerState.actions.selectArticle}
            onClearLibraryFilter={readerState.actions.clearLibraryFilter}
            onClearSource={readerState.actions.clearSourceFilter}
            onRestoreArticlePanel={readerState.actions.openArticlePanel}
            onFavoriteArticle={readerState.actions.toggleFavoriteArticle}
            onMarkAllRead={readerState.actions.markAllRead}
            onLoadMoreArticles={onLoadMoreFeed}
            onRefreshFeed={readerState.actions.refreshFeed}
            onSaveArticle={readerState.actions.toggleSaveArticle}
            onShareArticle={readerState.actions.shareArticle}
            onToggleUnreadOnly={readerState.actions.setShowUnreadOnly}
          />
        }
        renderArticle={(controls) => (
          readerState.articlePanelOpen ? (
            <StandardArticlePanel
              article={readerState.selectedArticle}
              feedback={readerState.feedback}
              copyStatus={readerState.copiedAnalysisArticleId === readerState.selectedArticle.id ? 'copied' : 'idle'}
              relatedArticles={readerState.relatedArticles}
              relatedOpen={readerState.relatedOpen}
              onCopyAnalysis={readerState.actions.copyAnalysis}
              onFeedback={readerState.actions.setFeedback}
              onSelectRelatedArticle={readerState.actions.selectArticle}
              onToggleRelated={() => readerState.actions.setRelatedOpen(!readerState.relatedOpen)}
            />
          ) : (
            <StandardArticleRestorePanel
              article={readerState.selectedArticle}
              onRestore={() => {
                readerState.actions.openArticlePanel()
                controls.resetArticlePanel()
              }}
            />
          )
        )}
      />
    </main>
  )
}
