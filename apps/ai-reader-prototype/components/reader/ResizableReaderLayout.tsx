'use client'

import { useRef, useState } from 'react'
import type {
  CSSProperties,
  PointerEvent as ReactPointerEvent,
  ReactNode,
} from 'react'

const collapsedSourceWidth = 50
const resizerWidth = 6
const feedDefaultWidth = 660
const feedMinWidth = 420
const feedMaxWidth = 760
const sourceDefaultWidth = 294
const sourceMinWidth = 210
const sourceMaxWidth = 380
const sourceCollapseWidth = 165
const articleMinWidth = 480

export type ResizableReaderLayoutControls = {
  sourcesCollapsed: boolean
  collapseSourcesPanel: () => void
  expandSourcesPanel: () => void
  toggleSourcesPanel: () => void
  minimizeArticlePanel: () => void
  resetArticlePanel: () => void
}

type ResizableReaderLayoutProps = {
  renderLeft: (controls: ResizableReaderLayoutControls) => ReactNode
  feed: ReactNode
  renderArticle: (controls: ResizableReaderLayoutControls) => ReactNode
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

function joinClasses(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(' ')
}

export function ResizableReaderLayout({
  renderLeft,
  feed,
  renderArticle,
}: ResizableReaderLayoutProps) {
  const workspaceRef = useRef<HTMLDivElement>(null)
  const [sourcesWidth, setSourcesWidth] = useState(sourceDefaultWidth)
  const [feedWidth, setFeedWidth] = useState(feedDefaultWidth)
  const [sourcesCollapsed, setSourcesCollapsed] = useState(false)
  const [dragging, setDragging] = useState<'sources' | 'article' | null>(null)

  function getLeftWidth() {
    return sourcesCollapsed ? collapsedSourceWidth : sourcesWidth
  }

  function getMaxFeedWidth(leftWidth = getLeftWidth()) {
    const workspaceWidth = workspaceRef.current?.getBoundingClientRect().width ?? window.innerWidth
    const maxByArticle = workspaceWidth - leftWidth - articleMinWidth - resizerWidth * 2

    return Math.max(feedMinWidth, Math.min(feedMaxWidth, maxByArticle))
  }

  function expandSourcesPanel() {
    setSourcesCollapsed(false)
    setSourcesWidth((current) => clamp(current, sourceMinWidth, sourceMaxWidth))
  }

  function collapseSourcesPanel() {
    setSourcesCollapsed(true)
  }

  const controls: ResizableReaderLayoutControls = {
    sourcesCollapsed,
    collapseSourcesPanel,
    expandSourcesPanel,
    toggleSourcesPanel: () => {
      if (sourcesCollapsed) {
        expandSourcesPanel()
        return
      }

      collapseSourcesPanel()
    },
    minimizeArticlePanel: () => setFeedWidth(getMaxFeedWidth()),
    resetArticlePanel: () => setFeedWidth(feedDefaultWidth),
  }
  const workspaceStyle = {
    '--standard-left-width': `${getLeftWidth()}px`,
    '--standard-feed-width': `${Math.min(feedWidth, getMaxFeedWidth())}px`,
  } as CSSProperties

  function beginResize(panel: 'sources' | 'article', event: ReactPointerEvent<HTMLDivElement>) {
    event.preventDefault()

    const startX = event.clientX
    const startSourcesWidth = getLeftWidth()
    const startFeedWidth = feedWidth

    setDragging(panel)
    document.body.style.userSelect = 'none'
    document.body.style.cursor = 'col-resize'

    const onPointerMove = (moveEvent: PointerEvent) => {
      if (panel === 'sources') {
        const nextWidth = startSourcesWidth + moveEvent.clientX - startX

        if (nextWidth < sourceCollapseWidth) {
          setSourcesCollapsed(true)
          return
        }

        setSourcesCollapsed(false)
        setSourcesWidth(clamp(nextWidth, sourceMinWidth, sourceMaxWidth))
        return
      }

      const nextWidth = startFeedWidth + moveEvent.clientX - startX

      setFeedWidth(clamp(nextWidth, feedMinWidth, getMaxFeedWidth()))
    }

    const onPointerUp = () => {
      setDragging(null)
      document.body.style.userSelect = ''
      document.body.style.cursor = ''
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', onPointerUp)
    }

    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', onPointerUp, { once: true })
  }

  return (
    <div
      ref={workspaceRef}
      className={joinClasses(
        'standard-workspace',
        sourcesCollapsed && 'is-sources-collapsed',
        dragging === 'sources' && 'is-resizing-sources',
        dragging === 'article' && 'is-resizing-article',
      )}
      style={workspaceStyle}
      data-resizing={dragging ?? undefined}
    >
      {renderLeft(controls)}
      <div
        className={joinClasses('standard-resizer', 'standard-source-resizer', dragging === 'sources' && 'is-active')}
        role="separator"
        aria-orientation="vertical"
        aria-label="Resize sources panel"
        tabIndex={0}
        onPointerDown={(event) => beginResize('sources', event)}
        onDoubleClick={controls.toggleSourcesPanel}
      />
      {feed}
      <div
        className={joinClasses('standard-resizer', 'standard-article-resizer', dragging === 'article' && 'is-active')}
        role="separator"
        aria-orientation="vertical"
        aria-label="Resize article panel"
        tabIndex={0}
        onPointerDown={(event) => beginResize('article', event)}
        onDoubleClick={controls.resetArticlePanel}
      />
      {renderArticle(controls)}
    </div>
  )
}
