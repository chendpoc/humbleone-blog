'use client'

import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useGsapElementEntrance } from '../../hooks/useGsapMotion'
import type { StandardSource } from '../../types/reader'
import { joinClasses } from '../../utils/readerUtils'
import { ChevronRightIcon, Cog6ToothIcon, FunnelIcon } from './ReaderIcons'

type StandardSourceFilterMenuProps = {
  activeCount: number
  selectedSourceId: string | null
  sources: StandardSource[]
  totalCount: number
  showActiveOnly: boolean
  updatingSourceId?: string | null
  onCollapseAll: () => void
  onEditSourceConfig: (source: StandardSource) => void
  onExpandAll: () => void
  onOpenChange?: (open: boolean) => void
  onSelectSource: (sourceId: string) => void
  onShowActiveOnlyChange: (value: boolean) => void
  onToggleSourceFetch: (source: StandardSource) => void
}

export function StandardSourceFilterMenu({
  activeCount,
  selectedSourceId,
  sources,
  totalCount,
  showActiveOnly,
  updatingSourceId = null,
  onCollapseAll,
  onEditSourceConfig,
  onExpandAll,
  onOpenChange,
  onSelectSource,
  onShowActiveOnlyChange,
  onToggleSourceFetch,
}: StandardSourceFilterMenuProps) {
  const { t } = useTranslation('reader')
  const [open, setOpen] = useState(false)
  const [viewPage, setViewPage] = useState<'main' | 'allSources'>('main')
  const popoverRef = useRef<HTMLDivElement>(null)

  useGsapElementEntrance(popoverRef, open, {
    duration: 0.16,
    scale: 0.98,
    y: -6,
  })

  function updateOpen(nextOpen: boolean) {
    setOpen(nextOpen)

    if (!nextOpen) {
      setViewPage('main')
    }

    onOpenChange?.(nextOpen)
  }

  function selectSourceScope(activeOnly: boolean) {
    onShowActiveOnlyChange(activeOnly)
    updateOpen(false)
  }

  function runMenuAction(action: () => void) {
    action()
    updateOpen(false)
  }

  function selectSource(sourceId: string) {
    onSelectSource(sourceId)
    updateOpen(false)
  }

  function editSourceConfig(source: StandardSource) {
    updateOpen(false)
    onEditSourceConfig(source)
  }

  function formatFetchWindow(source: StandardSource) {
    const lookbackDays = source.fetchLookbackDays ?? 365

    if (lookbackDays === 365) {
      return t('sources.fetchLastYear')
    }

    return t('sources.fetchLastDays', { count: lookbackDays })
  }

  return (
    <DropdownMenu.Root open={open} onOpenChange={updateOpen}>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          className={joinClasses('standard-source-filter-trigger', showActiveOnly && 'is-active')}
          aria-label={t('filter.openAria')}
          title={t('filter.title')}
        >
          <FunnelIcon />
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content ref={popoverRef} className="standard-source-filter-popover" align="end" sideOffset={8}>
          {viewPage === 'allSources' ? (
            <>
              <DropdownMenu.Item
                className="standard-source-filter-back"
                onSelect={(event) => {
                  event.preventDefault()
                  setViewPage('main')
                }}
              >
                <ChevronRightIcon />
                <strong>{t('filter.sourceView')}</strong>
                <small>{t('sources.sourceCount', { count: sources.length })}</small>
              </DropdownMenu.Item>
              <DropdownMenu.Group
                className="standard-source-filter-source-list"
                aria-label={t('sources.allSourcesInventoryAria')}
              >
                {sources.map((source) => (
                  <div
                    key={source.feedSourceId}
                    role="group"
                    aria-label={source.label}
                    className={joinClasses(
                      'standard-source-filter-source-row',
                      source.active && 'is-active',
                      source.health === 'failed' && 'is-failed',
                      selectedSourceId === source.feedSourceId && 'is-selected',
                    )}
                  >
                    <button
                      type="button"
                      className="standard-source-filter-source-main"
                      onClick={() => selectSource(source.feedSourceId)}
                    >
                      <span className="standard-source-dot" />
                      <span>
                        <strong>{source.label}</strong>
                        <small>
                          {t(`categories.${source.sourceFamily ?? source.category}`, { defaultValue: source.category })}
                          {' · '}
                          {t(`sources.tabs.${source.contentType}`)}
                        </small>
                      </span>
                      <em>{source.adapter ?? t('sources.noAdapter')}</em>
                      <small>{formatFetchWindow(source)}</small>
                    </button>
                    <button
                      type="button"
                      className={joinClasses('standard-source-fetch-toggle', source.fetchEnabled && 'is-on')}
                      aria-label={t('sourceManagement.sourceFetchToggleAria', { name: source.label })}
                      aria-pressed={Boolean(source.fetchEnabled)}
                      disabled={!source.fetchConfigurable || updatingSourceId === source.feedSourceId}
                      onClick={() => onToggleSourceFetch(source)}
                    >
                      <span>{source.fetchEnabled ? t('sourceManagement.fetchOn') : t('sourceManagement.fetchOff')}</span>
                    </button>
                    <button
                      type="button"
                      className="standard-source-filter-config-button"
                      aria-label={t('sourceManagement.sourceConfigAria', { name: source.label })}
                      onClick={() => editSourceConfig(source)}
                    >
                      <Cog6ToothIcon />
                    </button>
                  </div>
                ))}
              </DropdownMenu.Group>
            </>
          ) : (
            <>
              <span>{t('filter.sourceView')}</span>
              <DropdownMenu.Item
                className="standard-source-filter-option"
                onSelect={(event) => {
                  event.preventDefault()
                  onShowActiveOnlyChange(false)
                  setViewPage('allSources')
                }}
              >
                <strong>{t('filter.allSources')}</strong>
                <small>{t('filter.allFeeds', { count: totalCount })}</small>
              </DropdownMenu.Item>
              <DropdownMenu.Item
                aria-checked={showActiveOnly}
                className={joinClasses('standard-source-filter-option', showActiveOnly && 'is-selected')}
                onSelect={() => selectSourceScope(true)}
              >
                <strong>{t('filter.activeOnly')}</strong>
                <small>{t('filter.activeLive', { count: activeCount })}</small>
              </DropdownMenu.Item>
              <DropdownMenu.Separator className="standard-source-filter-separator" />
              <DropdownMenu.Item className="standard-source-filter-option" onSelect={() => runMenuAction(onExpandAll)}>
                <strong>{t('filter.expandGroups')}</strong>
                <small>{t('filter.expandHint')}</small>
              </DropdownMenu.Item>
              <DropdownMenu.Item className="standard-source-filter-option" onSelect={() => runMenuAction(onCollapseAll)}>
                <strong>{t('filter.collapseGroups')}</strong>
                <small>{t('filter.collapseHint')}</small>
              </DropdownMenu.Item>
            </>
          )}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}
