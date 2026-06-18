'use client'

import { useMemo, useRef, useState } from 'react'
import {
  DndContext,
  PointerSensor,
  pointerWithin,
  useSensor,
  useSensors,
  type CollisionDetection,
  type DragCancelEvent,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import countBy from 'lodash/countBy'
import { useTranslation } from 'react-i18next'
import { useGsapElementEntrance, useGsapElementPulse } from '../../hooks/useGsapMotion'
import { useSourceCollections } from '../../hooks/useSourceCollections'
import { useSourcePanelPreferences } from '../../hooks/useSourcePanelPreferences'
import type { SourceContentType } from '../../services/sourceRegistry'
import type { SourceCollection, StandardLibraryFilter, StandardSource } from '../../types/reader'
import {
  ArrowLeftStartOnRectangleIcon,
  ChatBubbleLeftRightIcon,
  DocumentTextIcon,
  PhotoIcon,
  PlayCircleIcon,
  Squares2X2Icon,
} from './ReaderIcons'
import { StandardSourceFilterMenu } from './StandardSourceFilterMenu'
import { StandardSourceGroup } from './StandardSourceGroup'
import { StandardSourceDeleteDialog } from './StandardSourceDeleteDialog'
import { StandardSourceGroupsToolbar } from './StandardSourceGroupsToolbar'
import { StandardSourceInspector } from './StandardSourceInspector'
import { StandardSourceMembershipDialog } from './StandardSourceMembershipDialog'
import { StandardSourceTextDialog } from './StandardSourceTextDialog'

type StandardSourcesPanelProps = {
  sources: StandardSource[]
  activeSources: number
  collapsing?: boolean
  libraryCounts?: Record<StandardLibraryFilter, number>
  libraryFilter?: StandardLibraryFilter | null
  selectedSourceId: string | null
  onCollapse: () => void
  onSelectLibraryFilter?: (filter: StandardLibraryFilter) => void
  onSelectSource: (sourceId: string) => void
}

type SourceContentFilter = SourceContentType | 'all'

type SourceManagementDialog =
  | { type: 'create-collection' }
  | { type: 'rename-collection'; collection: SourceCollection }
  | { type: 'delete-collection'; collection: SourceCollection }
  | { type: 'add-sources'; collection: SourceCollection }
  | { type: 'rename-source'; source: StandardSource }

type SourceDragData = {
  collectionId: string
  sourceId: string
  sourceLabel: string
  type: 'source'
}

type SourceCollectionDropData = {
  collectionId: string
  type: 'source-collection'
}

type SourceRowDropData = {
  collectionId: string
  sourceId: string
  type: 'source-row'
}

const sourceContentTabs = [
  { id: 'all', icon: Squares2X2Icon },
  { id: 'article', icon: DocumentTextIcon },
  { id: 'social', icon: ChatBubbleLeftRightIcon },
  { id: 'image', icon: PhotoIcon },
  { id: 'video', icon: PlayCircleIcon },
] satisfies Array<{ id: SourceContentFilter; icon: typeof Squares2X2Icon }>

const sourceCollisionDetection: CollisionDetection = (args) => {
  const collisions = pointerWithin(args)
  const rowCollisions = collisions.filter((collision) => String(collision.id).startsWith('source-row:'))

  return rowCollisions.length ? rowCollisions : collisions
}

export function StandardSourcesPanel({
  sources,
  activeSources,
  collapsing = false,
  libraryCounts = { bookmarks: 0, favorites: 0 },
  libraryFilter = null,
  selectedSourceId,
  onCollapse,
  onSelectLibraryFilter,
  onSelectSource,
}: StandardSourcesPanelProps) {
  const { t } = useTranslation('reader')
  const panelRef = useRef<HTMLElement>(null)
  const [selectedContentType, setSelectedContentType] = useState<SourceContentFilter>('all')
  const [filterMenuMotionKey, setFilterMenuMotionKey] = useState(0)
  const [managementDialog, setManagementDialog] = useState<SourceManagementDialog | null>(null)
  const [activeDrag, setActiveDrag] = useState<SourceDragData | null>(null)
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 6,
      },
    }),
  )
  const sourceCollections = useSourceCollections(sources)
  const groupIds = useMemo(
    () => sourceCollections.collections.map((collection) => collection.id),
    [sourceCollections.collections],
  )
  const sourcePanelPreferences = useSourcePanelPreferences(groupIds)
  const { collapsedGroups, showActiveOnly } = sourcePanelPreferences
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

  function handleDragStart(event: DragStartEvent) {
    const dragData = readSourceDragData(event.active.data.current)

    if (dragData) {
      setActiveDrag(dragData)
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    const dragData = readSourceDragData(event.active.data.current)
    const rowDropData = readSourceRowDropData(event.over?.data.current)
    const collectionDropData = readCollectionDropData(event.over?.data.current)

    setActiveDrag(null)

    if (!dragData) {
      return
    }

    if (rowDropData) {
      sourceCollections.actions.moveSourceToCollection(
        dragData.sourceId,
        dragData.collectionId,
        rowDropData.collectionId,
        rowDropData.sourceId,
      )
      return
    }

    if (collectionDropData) {
      sourceCollections.actions.moveSourceToCollection(
        dragData.sourceId,
        dragData.collectionId,
        collectionDropData.collectionId,
      )
    }
  }

  function handleDragCancel(_event: DragCancelEvent) {
    setActiveDrag(null)
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
              totalCount={sources.length}
              showActiveOnly={showActiveOnly}
              onCollapseAll={sourcePanelPreferences.actions.collapseAllGroups}
              onExpandAll={sourcePanelPreferences.actions.expandAllGroups}
              onOpenChange={() => setFilterMenuMotionKey((current) => current + 1)}
              onShowActiveOnlyChange={sourcePanelPreferences.actions.setShowActiveOnly}
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
      <StandardSourceGroupsToolbar
        groupCount={sourceCollections.collections.length}
        onCreateCollection={() => setManagementDialog({ type: 'create-collection' })}
      />
      <DndContext
        sensors={sensors}
        collisionDetection={sourceCollisionDetection}
        onDragCancel={handleDragCancel}
        onDragEnd={handleDragEnd}
        onDragStart={handleDragStart}
      >
        <div className="standard-source-groups">
          {sourceGroups.map(({ collection, items }) => {
            const isCollapsed = collapsedGroups.has(collection.id)
            const collectionLabel = getCollectionLabel(collection)

            return (
              <StandardSourceGroup
                key={collection.id}
                collection={collection}
                collectionCount={sourceCollections.collections.length}
                collectionLabel={collectionLabel}
                collapsed={isCollapsed}
                draggingSourceId={activeDrag?.sourceId ?? null}
                items={items}
                selectedSourceId={selectedSourceId}
                onAddSources={(nextCollection) => setManagementDialog({ type: 'add-sources', collection: nextCollection })}
                onCreateCollection={() => setManagementDialog({ type: 'create-collection' })}
                onDeleteCollection={(nextCollection) => setManagementDialog({ type: 'delete-collection', collection: nextCollection })}
                onRemoveSourceFromCollection={sourceCollections.actions.removeSourceFromCollection}
                onRenameCollection={(nextCollection) => setManagementDialog({ type: 'rename-collection', collection: nextCollection })}
                onRenameSource={(source) => setManagementDialog({ type: 'rename-source', source })}
                onSelectSource={onSelectSource}
                onToggle={sourcePanelPreferences.actions.toggleGroup}
              />
            )
          })}
        </div>
      </DndContext>
      <StandardSourceInspector
        sources={sourceCollections.sources}
        libraryCounts={libraryCounts}
        libraryFilter={libraryFilter}
        onSelectLibraryFilter={onSelectLibraryFilter}
      />
      <StandardSourceTextDialog
        description={t('sourceManagement.createGroupDescription')}
        label={t('sourceManagement.groupNameLabel')}
        open={managementDialog?.type === 'create-collection'}
        placeholder={t('sourceManagement.groupNamePlaceholder')}
        submitLabel={t('sourceManagement.createGroupSubmit')}
        title={t('sourceManagement.createGroupTitle')}
        onOpenChange={(open) => !open && setManagementDialog(null)}
        onSubmit={sourceCollections.actions.createCollection}
      />
      <StandardSourceTextDialog
        description={t('sourceManagement.renameGroupDescription')}
        initialValue={managementDialog?.type === 'rename-collection' ? getCollectionLabel(managementDialog.collection) : ''}
        label={t('sourceManagement.groupNameLabel')}
        open={managementDialog?.type === 'rename-collection'}
        placeholder={t('sourceManagement.groupNamePlaceholder')}
        title={t('sourceManagement.renameGroupTitle')}
        onOpenChange={(open) => !open && setManagementDialog(null)}
        onSubmit={(value) => {
          if (managementDialog?.type === 'rename-collection') {
            sourceCollections.actions.renameCollection(managementDialog.collection.id, value)
          }
        }}
      />
      <StandardSourceTextDialog
        description={t('sourceManagement.renameSourceDescription')}
        initialValue={managementDialog?.type === 'rename-source' ? managementDialog.source.label : ''}
        label={t('sourceManagement.sourceNameLabel')}
        open={managementDialog?.type === 'rename-source'}
        placeholder={t('sourceManagement.sourceNamePlaceholder')}
        title={t('sourceManagement.renameSourceTitle')}
        onOpenChange={(open) => !open && setManagementDialog(null)}
        onSubmit={(value) => {
          if (managementDialog?.type === 'rename-source') {
            sourceCollections.actions.renameSource(managementDialog.source.feedSourceId, value)
          }
        }}
      />
      <StandardSourceMembershipDialog
        collectionName={managementDialog?.type === 'add-sources' ? getCollectionLabel(managementDialog.collection) : ''}
        existingSourceIds={managementDialog?.type === 'add-sources' ? managementDialog.collection.sourceIds : []}
        open={managementDialog?.type === 'add-sources'}
        sources={sourceCollections.sources}
        onOpenChange={(open) => !open && setManagementDialog(null)}
        onSubmit={(sourceIds) => {
          if (managementDialog?.type === 'add-sources') {
            sourceCollections.actions.addSourcesToCollection(managementDialog.collection.id, sourceIds)
          }
        }}
      />
      <StandardSourceDeleteDialog
        collectionName={managementDialog?.type === 'delete-collection' ? getCollectionLabel(managementDialog.collection) : ''}
        open={managementDialog?.type === 'delete-collection'}
        sourceCount={managementDialog?.type === 'delete-collection' ? managementDialog.collection.sourceIds.length : 0}
        onOpenChange={(open) => !open && setManagementDialog(null)}
        onConfirm={() => {
          if (managementDialog?.type === 'delete-collection') {
            sourceCollections.actions.deleteCollection(managementDialog.collection.id)
          }
        }}
      />
    </aside>
  )
}

function readSourceDragData(value: unknown): SourceDragData | null {
  if (!value || typeof value !== 'object') {
    return null
  }

  const data = value as Partial<SourceDragData>

  return data.type === 'source' &&
    typeof data.sourceId === 'string' &&
    typeof data.collectionId === 'string' &&
    typeof data.sourceLabel === 'string'
    ? {
        collectionId: data.collectionId,
        sourceId: data.sourceId,
        sourceLabel: data.sourceLabel,
        type: 'source',
      }
    : null
}

function readCollectionDropData(value: unknown): SourceCollectionDropData | null {
  if (!value || typeof value !== 'object') {
    return null
  }

  const data = value as Partial<SourceCollectionDropData>

  return data.type === 'source-collection' && typeof data.collectionId === 'string'
    ? {
        collectionId: data.collectionId,
        type: 'source-collection',
      }
    : null
}

function readSourceRowDropData(value: unknown): SourceRowDropData | null {
  if (!value || typeof value !== 'object') {
    return null
  }

  const data = value as Partial<SourceRowDropData>

  return data.type === 'source-row' && typeof data.collectionId === 'string' && typeof data.sourceId === 'string'
    ? {
        collectionId: data.collectionId,
        sourceId: data.sourceId,
        type: 'source-row',
      }
    : null
}
