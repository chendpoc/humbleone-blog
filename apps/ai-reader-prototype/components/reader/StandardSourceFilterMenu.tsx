'use client'

import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useGsapElementEntrance } from '../../hooks/useGsapMotion'
import { joinClasses } from '../../utils/readerUtils'
import { FunnelIcon } from './ReaderIcons'

type StandardSourceFilterMenuProps = {
  activeCount: number
  totalCount: number
  showActiveOnly: boolean
  onCollapseAll: () => void
  onExpandAll: () => void
  onOpenChange?: (open: boolean) => void
  onShowActiveOnlyChange: (value: boolean) => void
}

export function StandardSourceFilterMenu({
  activeCount,
  totalCount,
  showActiveOnly,
  onCollapseAll,
  onExpandAll,
  onOpenChange,
  onShowActiveOnlyChange,
}: StandardSourceFilterMenuProps) {
  const { t } = useTranslation('reader')
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)

  useGsapElementEntrance(popoverRef, open, {
    duration: 0.16,
    scale: 0.98,
    y: -6,
  })

  useEffect(() => {
    if (!open) {
      return
    }

    function onPointerDown(event: PointerEvent) {
      if (menuRef.current?.contains(event.target as Node)) {
        return
      }

      setOpen(false)
      onOpenChange?.(false)
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false)
        onOpenChange?.(false)
      }
    }

    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)

    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [onOpenChange, open])

  function selectSourceScope(activeOnly: boolean) {
    onShowActiveOnlyChange(activeOnly)
    setOpen(false)
    onOpenChange?.(false)
  }

  function runMenuAction(action: () => void) {
    action()
    setOpen(false)
    onOpenChange?.(false)
  }

  return (
    <div className="standard-source-filter-menu" ref={menuRef}>
      <button
        type="button"
        className={joinClasses('standard-source-filter-trigger', showActiveOnly && 'is-active')}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={t('filter.openAria')}
        title={t('filter.title')}
        onClick={() => {
          setOpen((current) => {
            const nextOpen = !current

            onOpenChange?.(nextOpen)
            return nextOpen
          })
        }}
      >
        <FunnelIcon />
      </button>
      {open ? (
        <div ref={popoverRef} className="standard-source-filter-popover" role="menu">
          <span>{t('filter.sourceView')}</span>
          <button
            type="button"
            role="menuitemradio"
            aria-checked={!showActiveOnly}
            className={!showActiveOnly ? 'is-selected' : undefined}
            onClick={() => selectSourceScope(false)}
          >
            <strong>{t('filter.allSources')}</strong>
            <small>{t('filter.allFeeds', { count: totalCount })}</small>
          </button>
          <button
            type="button"
            role="menuitemradio"
            aria-checked={showActiveOnly}
            className={showActiveOnly ? 'is-selected' : undefined}
            onClick={() => selectSourceScope(true)}
          >
            <strong>{t('filter.activeOnly')}</strong>
            <small>{t('filter.activeLive', { count: activeCount })}</small>
          </button>
          <i />
          <button type="button" role="menuitem" onClick={() => runMenuAction(onExpandAll)}>
            <strong>{t('filter.expandGroups')}</strong>
            <small>{t('filter.expandHint')}</small>
          </button>
          <button type="button" role="menuitem" onClick={() => runMenuAction(onCollapseAll)}>
            <strong>{t('filter.collapseGroups')}</strong>
            <small>{t('filter.collapseHint')}</small>
          </button>
        </div>
      ) : null}
    </div>
  )
}
