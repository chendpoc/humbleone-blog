'use client'

import { useState } from 'react'
import { joinClasses } from './readerUtils'
import type { StandardSource } from './standardReaderTypes'

type StandardSourcesPanelProps = {
  sources: StandardSource[]
  activeSources: number
  selectedSourceId: string | null
  onCollapse: () => void
  onSelectSource: (sourceId: string) => void
}

export function StandardSourcesPanel({
  sources,
  activeSources,
  selectedSourceId,
  onCollapse,
  onSelectSource,
}: StandardSourcesPanelProps) {
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set())
  const [showActiveOnly, setShowActiveOnly] = useState(false)
  const visibleSources = showActiveOnly ? sources.filter((source) => source.active) : sources
  const grouped = visibleSources.reduce<Record<string, StandardSource[]>>((acc, source) => {
    acc[source.category] ??= []
    acc[source.category].push(source)
    return acc
  }, {})

  function toggleGroup(category: string) {
    setCollapsedGroups((current) => {
      const nextGroups = new Set(current)

      if (nextGroups.has(category)) {
        nextGroups.delete(category)
        return nextGroups
      }

      nextGroups.add(category)
      return nextGroups
    })
  }

  return (
    <aside className="standard-sources-panel" aria-label="Sources">
      <header>
        <span>Sources</span>
        <div className="standard-sources-panel-actions">
          <small>
            {showActiveOnly ? visibleSources.length : activeSources}/{sources.length}
          </small>
          <button
            type="button"
            className={showActiveOnly ? 'is-active' : undefined}
            aria-label="Filter active sources"
            aria-pressed={showActiveOnly}
            title="Filter active sources"
            onClick={() => setShowActiveOnly((current) => !current)}
          >
            <FilterIcon />
          </button>
          <button type="button" aria-label="Collapse sources panel" onClick={onCollapse}>
            ⇤
          </button>
        </div>
      </header>
      <div className="standard-source-groups">
        {Object.entries(grouped).map(([category, items]) => {
          const isCollapsed = collapsedGroups.has(category)

          return (
            <section key={category} className={joinClasses('standard-source-group', isCollapsed && 'is-collapsed')}>
              <h2>
                <button
                  type="button"
                  aria-label={`${isCollapsed ? 'Expand' : 'Collapse'} ${category} sources`}
                  aria-expanded={!isCollapsed}
                  onClick={() => toggleGroup(category)}
                >
                  <span>{category}</span>
                  <ChevronIcon />
                </button>
              </h2>
              <div className="standard-source-group-body">
                {items.map((source) => (
                  <button
                    key={source.id}
                    type="button"
                    className={joinClasses(
                      'standard-source-row',
                      source.active && 'is-active',
                      selectedSourceId === source.feedSourceId && 'is-selected',
                    )}
                    aria-pressed={selectedSourceId === source.feedSourceId}
                    onClick={() => onSelectSource(source.feedSourceId)}
                  >
                    <span className="standard-source-dot" />
                    <span>{source.label}</span>
                    {source.count ? <small>{source.count}</small> : null}
                  </button>
                ))}
              </div>
            </section>
          )
        })}
      </div>
    </aside>
  )
}

function FilterIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 16 16">
      <path d="M2.5 4h11L9.3 8.6v3.1l-2.5 1.1V8.6L2.5 4Z" />
    </svg>
  )
}

function ChevronIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 16 16">
      <path d="M4.5 6 8 9.5 11.5 6" />
    </svg>
  )
}
