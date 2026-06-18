'use client'

import { useCallback, useRef } from 'react'
import type { CSSProperties } from 'react'
import { useDraggable, useDroppable } from '@dnd-kit/core'
import { useTranslation } from 'react-i18next'
import { useGsapDisclosure } from '../../hooks/useGsapMotion'
import type { SourceCollection, StandardSource } from '../../types/reader'
import { joinClasses } from '../../utils/readerUtils'
import { ChevronDownIcon } from './ReaderIcons'
import { StandardSourceCollectionMenu } from './StandardSourceCollectionMenu'
import { StandardSourceRowMenu } from './StandardSourceRowMenu'

type StandardSourceGroupProps = {
  collection: SourceCollection
  collectionCount: number
  collectionLabel: string
  collapsed: boolean
  draggingSourceId?: string | null
  items: StandardSource[]
  selectedSourceId: string | null
  onAddSources: (collection: SourceCollection) => void
  onCreateCollection: () => void
  onDeleteCollection: (collection: SourceCollection) => void
  onRemoveSourceFromCollection: (collectionId: string, sourceId: string) => void
  onRenameCollection: (collection: SourceCollection) => void
  onRenameSource: (source: StandardSource) => void
  onSelectSource: (sourceId: string) => void
  onToggle: (collectionId: string) => void
}

export function StandardSourceGroup({
  collection,
  collectionCount,
  collectionLabel,
  collapsed,
  draggingSourceId = null,
  items,
  selectedSourceId,
  onAddSources,
  onCreateCollection,
  onDeleteCollection,
  onRemoveSourceFromCollection,
  onRenameCollection,
  onRenameSource,
  onSelectSource,
  onToggle,
}: StandardSourceGroupProps) {
  const { t } = useTranslation('reader')
  const bodyRef = useRef<HTMLDivElement>(null)
  const { isOver, setNodeRef } = useDroppable({
    id: `source-collection:${collection.id}`,
    data: {
      collectionId: collection.id,
      type: 'source-collection',
    },
  })

  useGsapDisclosure(bodyRef, !collapsed, {
    childSelector: '.standard-source-row-shell',
    duration: 0.2,
  })

  return (
    <section
      ref={setNodeRef}
      className={joinClasses(
        'standard-source-group',
        collapsed && 'is-collapsed',
        isOver && draggingSourceId ? 'is-drop-target' : false,
      )}
    >
      <div className="standard-source-group-header">
        <button
          type="button"
          className="standard-source-group-toggle"
          aria-label={collapsed ? t('group.expandAria', { category: collectionLabel }) : t('group.collapseAria', { category: collectionLabel })}
          aria-expanded={!collapsed}
          onClick={() => onToggle(collection.id)}
        >
          <span>{collectionLabel}</span>
          <small>{collection.sourceIds.length}</small>
          <ChevronDownIcon />
        </button>
        <StandardSourceCollectionMenu
          canDelete={collectionCount > 1}
          onAddSources={() => onAddSources(collection)}
          onCreateCollection={onCreateCollection}
          onDeleteCollection={() => onDeleteCollection(collection)}
          onRenameCollection={() => onRenameCollection(collection)}
        />
      </div>
      <div ref={bodyRef} className="standard-source-group-body" aria-hidden={collapsed}>
        {items.length ? (
          items.map((source) => (
            <StandardDraggableSourceRow
              key={`${collection.id}-${source.feedSourceId}`}
              collectionId={collection.id}
              draggingSourceId={draggingSourceId}
              selected={selectedSourceId === source.feedSourceId}
              source={source}
              onRemoveSourceFromCollection={onRemoveSourceFromCollection}
              onRenameSource={onRenameSource}
              onSelectSource={onSelectSource}
            />
          ))
        ) : (
          <button
            type="button"
            className="standard-source-empty-slot"
            aria-label={t('sourceManagement.addSources')}
            onClick={() => onAddSources(collection)}
          >
            <span className="is-empty-label">{t('group.empty')}</span>
            <span className="is-action-label">{t('sourceManagement.addSources')}</span>
          </button>
        )}
      </div>
    </section>
  )
}

type StandardDraggableSourceRowProps = {
  collectionId: string
  draggingSourceId?: string | null
  selected: boolean
  source: StandardSource
  onRemoveSourceFromCollection: (collectionId: string, sourceId: string) => void
  onRenameSource: (source: StandardSource) => void
  onSelectSource: (sourceId: string) => void
}

function StandardDraggableSourceRow({
  collectionId,
  draggingSourceId = null,
  selected,
  source,
  onRemoveSourceFromCollection,
  onRenameSource,
  onSelectSource,
}: StandardDraggableSourceRowProps) {
  const { attributes, isDragging, listeners, setNodeRef: setDraggableNodeRef, transform } = useDraggable({
    id: `source:${collectionId}:${source.feedSourceId}`,
    data: {
      collectionId,
      sourceId: source.feedSourceId,
      sourceLabel: source.label,
      type: 'source',
    },
  })
  const { isOver, setNodeRef: setDroppableNodeRef } = useDroppable({
    id: `source-row:${collectionId}:${source.feedSourceId}`,
    data: {
      collectionId,
      sourceId: source.feedSourceId,
      type: 'source-row',
    },
  })
  const setRowNodeRef = useCallback(
    (node: HTMLDivElement | null) => {
      setDraggableNodeRef(node)
      setDroppableNodeRef(node)
    },
    [setDraggableNodeRef, setDroppableNodeRef],
  )
  const rowStyle: CSSProperties | undefined = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined

  return (
    <div
      ref={setRowNodeRef}
      className={joinClasses(
        'standard-source-row-shell',
        selected && 'is-selected',
        isDragging && 'is-dragging',
        isOver && draggingSourceId && draggingSourceId !== source.feedSourceId ? 'is-row-drop-target' : false,
      )}
      style={rowStyle}
    >
      <button
        type="button"
        className={joinClasses('standard-source-row', source.active && 'is-active', selected && 'is-selected')}
        onClick={() => onSelectSource(source.feedSourceId)}
        {...attributes}
        {...listeners}
        aria-pressed={selected}
      >
        <span className="standard-source-dot" />
        <span>{source.label}</span>
        {source.count ? <small>{source.count}</small> : null}
      </button>
      <StandardSourceRowMenu
        onRemoveFromCollection={() => onRemoveSourceFromCollection(collectionId, source.feedSourceId)}
        onRenameSource={() => onRenameSource(source)}
      />
    </div>
  )
}
