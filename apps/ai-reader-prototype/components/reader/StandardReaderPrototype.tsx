'use client'

import type { DailyBrief } from '../../lib/prototype-data'
import { ResizableReaderLayout } from './ResizableReaderLayout'
import type { ResizableReaderLayoutControls } from './ResizableReaderLayout'
import { StandardArticlePanel } from './StandardArticlePanel'
import { StandardFeedPanel } from './StandardFeedPanel'
import { StandardSourceRail } from './StandardSourceRail'
import { StandardSourcesPanel } from './StandardSourcesPanel'
import { StandardTopBar } from './StandardTopBar'
import { useStandardReaderState } from './useStandardReaderState'

export function StandardReaderPrototype({ brief }: { brief: DailyBrief }) {
  const readerState = useStandardReaderState(brief)

  function selectRailMode(mode: string, controls: ResizableReaderLayoutControls) {
    readerState.actions.setSelectedRailMode(mode)

    if (mode === 'sources') {
      controls.expandSourcesPanel()
    }
  }

  return (
    <main className="standard-reader" data-theme="standard">
      <StandardTopBar
        brief={brief}
        feedCount={readerState.activeSources}
        searchQuery={readerState.searchQuery}
        onSearchQueryChange={readerState.actions.setSearchQuery}
      />
      <ResizableReaderLayout
        renderLeft={(controls) => (
          controls.sourcesCollapsed ? (
            <StandardSourceRail
              selectedMode={readerState.selectedRailMode}
              sourcesCollapsed={controls.sourcesCollapsed}
              onSelectMode={(mode) => selectRailMode(mode, controls)}
            />
          ) : (
            <StandardSourcesPanel
              sources={readerState.sources}
              activeSources={readerState.activeSources}
              selectedSourceId={readerState.selectedSourceId}
              onCollapse={controls.collapseSourcesPanel}
              onSelectSource={readerState.actions.selectSource}
            />
          )
        )}
        feed={
          <StandardFeedPanel
            articles={readerState.filteredArticles}
            selectedArticleId={readerState.selectedArticle.id}
            selectedCategory={readerState.selectedCategory}
            selectedSourceId={readerState.selectedSourceId}
            onSelectArticle={readerState.actions.selectArticle}
            onSelectCategory={readerState.actions.setSelectedCategory}
            onClearSource={readerState.actions.clearSourceFilter}
          />
        }
        renderArticle={(controls) => (
          <StandardArticlePanel
            article={readerState.selectedArticle}
            feedback={readerState.feedback}
            onClose={controls.minimizeArticlePanel}
            onFeedback={readerState.actions.setFeedback}
          />
        )}
      />
    </main>
  )
}
