'use client'

import { useMemo, useRef, useState } from 'react'
import countBy from 'lodash/countBy'
import { useTranslation } from 'react-i18next'
import { useGsapElementEntrance, useGsapElementPulse } from '../../hooks/useGsapMotion'
import { useSourceCollections } from '../../hooks/useSourceCollections'
import { useSourcePanelPreferences } from '../../hooks/useSourcePanelPreferences'
import type { SourceCollectionConfig, SourceContentType } from '../../lib/prototype-data'
import { updateSourceFeedHubConfig } from '../../services/api/sourceRegistryApi'
import type { SourceCollection, StandardLibraryFilter, StandardSource } from '../../types/reader'
import {
  ArrowLeftStartOnRectangleIcon,
  ChatBubbleLeftRightIcon,
  DocumentTextIcon,
  PhotoIcon,
  PlayCircleIcon,
  Squares2X2Icon,
} from './ReaderIcons'
import { StandardSourceConfigDialog, type StandardSourceConfigDialogValue } from './StandardSourceConfigDialog'
import { StandardSourceFilterMenu } from './StandardSourceFilterMenu'
import { StandardSourceGroup } from './StandardSourceGroup'
import { StandardSourceGroupsToolbar } from './StandardSourceGroupsToolbar'
import { StandardSourceInspector } from './StandardSourceInspector'

type StandardSourcesPanelProps = {
  sources: StandardSource[]
  activeSources: number
  collapsing?: boolean
  configuredCollections?: SourceCollectionConfig[]
  libraryCounts?: Record<StandardLibraryFilter, number>
  libraryFilter?: StandardLibraryFilter | null
  selectedSourceId: string | null
  onCollapse: () => void
  onSelectLibraryFilter?: (filter: StandardLibraryFilter) => void
  onSelectSource: (sourceId: string) => void
  onSourceConfigChanged?: () => Promise<void> | void
}

type SourceContentFilter = SourceContentType | 'all'

const sourceContentTabs = [
  { id: 'all', icon: Squares2X2Icon },
  { id: 'article', icon: DocumentTextIcon },
  { id: 'social', icon: ChatBubbleLeftRightIcon },
  { id: 'image', icon: PhotoIcon },
  { id: 'video', icon: PlayCircleIcon },
] satisfies Array<{ id: SourceContentFilter; icon: typeof Squares2X2Icon }>

export function StandardSourcesPanel({
  sources,
  activeSources,
  collapsing = false,
  configuredCollections,
  libraryCounts = { bookmarks: 0, favorites: 0 },
  libraryFilter = null,
  selectedSourceId,
  onCollapse,
  onSelectLibraryFilter,
  onSelectSource,
  onSourceConfigChanged,
}: StandardSourcesPanelProps) {
  const { t } = useTranslation('reader')
  const panelRef = useRef<HTMLElement>(null)
  const [selectedContentType, setSelectedContentType] = useState<SourceContentFilter>('all')
  const [filterMenuMotionKey, setFilterMenuMotionKey] = useState(0)
  const [configSourceId, setConfigSourceId] = useState<string | null>(null)
  const [configSavingSourceId, setConfigSavingSourceId] = useState<string | null>(null)
  const [configSubmitError, setConfigSubmitError] = useState<string | null>(null)
  const sourceCollections = useSourceCollections(sources, configuredCollections)
  const groupIds = useMemo(
    () => sourceCollections.collections.map((collection) => collection.id),
    [sourceCollections.collections],
  )
  const sourcePanelPreferences = useSourcePanelPreferences(groupIds)
  const { collapsedGroups, showActiveOnly } = sourcePanelPreferences
  const configSource = useMemo(
    () => sourceCollections.sources.find((source) => source.feedSourceId === configSourceId) ?? null,
    [configSourceId, sourceCollections.sources],
  )
  const contentCounts = useMemo(() => {
    const counts = countBy(sourceCollections.sources, 'contentType') as Partial<Record<SourceContentType, number>>

    return {
      all: sourceCollections.sources.length,
      article: counts.article ?? 0,
      image: counts.image ?? 0,
      social: counts.social ?? 0,
      video: counts.video ?? 0,
    } satisfies Record<SourceContentFilter, number>
  }, [sourceCollections.sources])
  const visibleSources = useMemo(() => {
    const contentFilteredSources =
      selectedContentType === 'all'
        ? sourceCollections.sources
        : sourceCollections.sources.filter((source) => source.contentType === selectedContentType)

    return showActiveOnly ? contentFilteredSources.filter((source) => source.active) : contentFilteredSources
  }, [selectedContentType, showActiveOnly, sourceCollections.sources])
  const sourceGroups = useMemo(() => {
    const visibleSourceById = new Map(visibleSources.map((source) => [source.feedSourceId, source]))

    return sourceCollections.collections
      .map((collection) => ({
        collection,
        items: collection.sourceIds
          .map((sourceId) => visibleSourceById.get(sourceId))
          .filter((source): source is StandardSource => Boolean(source)),
      }))
  }, [selectedContentType, showActiveOnly, sourceCollections.collections, visibleSources])

  function getCollectionLabel(collection: SourceCollection) {
    return collection.systemCategory
      ? t(`categories.${collection.systemCategory}`, { defaultValue: collection.name })
      : collection.name
  }

  function openSourceConfig(source: StandardSource) {
    setConfigSubmitError(null)
    setConfigSourceId(source.feedSourceId)
  }

  async function submitSourceConfig(source: StandardSource, value: StandardSourceConfigDialogValue) {
    await saveSourceConfig(source, value)
    setConfigSourceId(null)
  }

  async function toggleSourceFetch(source: StandardSource) {
    await saveSourceConfig(source, {
      enabled: !source.fetchEnabled,
      lookbackDays: source.fetchLookbackDays ?? 365,
    })
  }

  async function saveSourceConfig(source: StandardSource, value: StandardSourceConfigDialogValue) {
    if (!source.fetchConfigurable) {
      setConfigSubmitError(t('sourceManagement.sourceConfigUnavailable'))
      setConfigSourceId(source.feedSourceId)
      return
    }

    setConfigSavingSourceId(source.feedSourceId)
    setConfigSubmitError(null)

    try {
      await updateSourceFeedHubConfig({
        sourceId: source.feedSourceId,
        enabled: value.enabled,
        lookbackDays: value.lookbackDays,
      })
      await onSourceConfigChanged?.()
    } catch (error) {
      setConfigSubmitError(readErrorMessage(error))
      setConfigSourceId(source.feedSourceId)
    } finally {
      setConfigSavingSourceId(null)
    }
  }

  useGsapElementEntrance(panelRef, 'standard-sources-panel', {
    duration: 0.22,
    scale: 0.985,
    x: -14,
    y: 0,
  })
  useGsapElementPulse(panelRef, filterMenuMotionKey, {
    duration: 0.18,
    scale: 0.988,
    x: -2,
  })

  return (
    <aside
      ref={panelRef}
      className={`standard-sources-panel${collapsing ? ' is-collapsing' : ''}`}
      aria-label={t('sources.aria')}
    >
      <header>
        <div className="standard-sources-panel-heading">
          <span>{t('sources.title')}</span>
          <div className="standard-sources-panel-actions">
            <small>
              {showActiveOnly ? visibleSources.length : activeSources}/{sources.length}
            </small>
            <StandardSourceFilterMenu
              activeCount={activeSources}
              selectedSourceId={selectedSourceId}
              sources={sourceCollections.sources}
              totalCount={sources.length}
              showActiveOnly={showActiveOnly}
              updatingSourceId={configSavingSourceId}
              onCollapseAll={sourcePanelPreferences.actions.collapseAllGroups}
              onEditSourceConfig={openSourceConfig}
              onExpandAll={sourcePanelPreferences.actions.expandAllGroups}
              onOpenChange={() => setFilterMenuMotionKey((current) => current + 1)}
              onSelectSource={onSelectSource}
              onShowActiveOnlyChange={sourcePanelPreferences.actions.setShowActiveOnly}
              onToggleSourceFetch={toggleSourceFetch}
            />
            <button type="button" aria-label={t('sources.collapseAria')} onClick={onCollapse}>
              <ArrowLeftStartOnRectangleIcon />
            </button>
          </div>
        </div>
        <div className="standard-source-content-tabs" aria-label={t('sources.contentTypesAria')}>
          {sourceContentTabs.map((tab) => {
            const ContentIcon = tab.icon
            const label = t(`sources.tabs.${tab.id}`)

            return (
              <button
                key={tab.id}
                type="button"
                className={tab.id === selectedContentType ? 'is-active' : undefined}
                aria-label={t('sources.showTabAria', { label, count: contentCounts[tab.id] })}
                aria-pressed={tab.id === selectedContentType}
                data-tooltip={label}
                onClick={() => setSelectedContentType(tab.id)}
              >
                <ContentIcon />
                <small>{contentCounts[tab.id]}</small>
              </button>
            )
          })}
        </div>
      </header>
      <StandardSourceGroupsToolbar groupCount={sourceCollections.collections.length} />
      <div className="standard-source-groups">
        {sourceGroups.map(({ collection, items }) => {
          const isCollapsed = collapsedGroups.has(collection.id)
          const collectionLabel = getCollectionLabel(collection)

          return (
            <StandardSourceGroup
              key={collection.id}
              collection={collection}
              collectionLabel={collectionLabel}
              collapsed={isCollapsed}
              items={items}
              selectedSourceId={selectedSourceId}
              onSelectSource={onSelectSource}
              onToggle={sourcePanelPreferences.actions.toggleGroup}
            />
          )
        })}
      </div>
      <StandardSourceInspector
        libraryCounts={libraryCounts}
        libraryFilter={libraryFilter}
        onSelectLibraryFilter={onSelectLibraryFilter}
      />
      <StandardSourceConfigDialog
        open={Boolean(configSource)}
        source={configSource}
        submitError={configSubmitError}
        submitting={Boolean(configSource && configSavingSourceId === configSource.feedSourceId)}
        onOpenChange={(open) => {
          if (!open) {
            setConfigSourceId(null)
            setConfigSubmitError(null)
          }
        }}
        onSubmit={(value) => {
          if (!configSource) {
            return
          }

          return submitSourceConfig(configSource, value)
        }}
      />
    </aside>
  )
}

function readErrorMessage(error: unknown) {
  if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') {
    return error.message
  }

  if (error instanceof Error) {
    return error.message
  }

  return 'Source config update failed.'
}
