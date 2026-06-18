import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { useState } from 'react'

import { ResizableReaderLayout } from './ResizableReaderLayout'
import { StandardArticlePanel } from './StandardArticlePanel'
import { StandardFeedPanel } from './StandardFeedPanel'
import { StandardReaderStoryFrame } from './StandardReaderStoryFrame'
import { StandardSourceRail } from './StandardSourceRail'
import { StandardSourcesPanel } from './StandardSourcesPanel'
import { StandardTopBar } from './StandardTopBar'
import {
  storyActiveSources,
  storyArticles,
  storyBrief,
  storyRelatedArticles,
  storySelectedArticle,
  storySources,
} from './readerStoryFixtures'

const meta = {
  title: 'AI Reader/Resizable Reader Layout',
  parameters: {
    layout: 'fullscreen',
    backgrounds: {
      default: 'standard',
    },
  },
} satisfies Meta

export default meta

type Story = StoryObj<typeof meta>

export const DraggableBoundaries: Story = {
  render: () => <ResizableLayoutStory />,
}

function ResizableLayoutStory() {
  const [selectedArticleId, setSelectedArticleId] = useState(storySelectedArticle.id)
  const [selectedSourceId, setSelectedSourceId] = useState<string | null>(storySources[0].feedSourceId)
  const selectedArticle = storyArticles.find((article) => article.id === selectedArticleId) ?? storySelectedArticle
  const visibleArticles = selectedSourceId
    ? storyArticles.filter((article) => article.sourceId === selectedSourceId)
    : storyArticles

  function selectSource(sourceId: string) {
    setSelectedSourceId((current) => (current === sourceId ? null : sourceId))
  }

  return (
    <StandardReaderStoryFrame>
      <StandardTopBar
        brief={storyBrief}
        feedCount={storyActiveSources}
        resultCount={visibleArticles.length}
        searchQuery=""
        onSearchQueryChange={() => undefined}
      />
      <ResizableReaderLayout
        renderLeft={(controls) => (
          controls.sourcesCollapsed ? (
            <StandardSourceRail
              selectedMode="sources"
              sourcesCollapsed={controls.sourcesCollapsed}
              onSelectMode={controls.expandSourcesPanel}
            />
          ) : (
            <StandardSourcesPanel
              sources={storySources}
              activeSources={storyActiveSources}
              selectedSourceId={selectedSourceId}
              onCollapse={controls.collapseSourcesPanel}
              onSelectSource={selectSource}
            />
          )
        )}
        feed={
          <StandardFeedPanel
            articles={visibleArticles}
            selectedArticleId={selectedArticle.id}
            selectedCategory="All"
            selectedSourceId={selectedSourceId}
            onSelectArticle={setSelectedArticleId}
            onSelectCategory={() => undefined}
            onClearSource={() => setSelectedSourceId(null)}
          />
        }
        renderArticle={(controls) => (
          <StandardArticlePanel
            article={selectedArticle}
            feedback={null}
            relatedArticles={storyRelatedArticles}
            onClose={controls.minimizeArticlePanel}
            onFeedback={() => undefined}
            onSelectRelatedArticle={setSelectedArticleId}
          />
        )}
      />
    </StandardReaderStoryFrame>
  )
}
