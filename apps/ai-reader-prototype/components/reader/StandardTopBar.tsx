'use client'

import { useEffect, useRef, useState } from 'react'
import type { ReactNode, RefObject } from 'react'
import { useTranslation } from 'react-i18next'
import type { DailyBrief } from '../../lib/prototype-data'
import { formatIssueDate } from '../../lib/i18n/formatters'
import { isEditableTarget } from '../../utils/readerUtils'
import { MagnifyingGlassIcon, XMarkIcon } from './ReaderIcons'

type StandardTopBarProps = {
  brief: DailyBrief
  feedCount: number
  resultCount?: number
  searchQuery: string
  searchInputRef?: RefObject<HTMLInputElement | null>
  actions?: ReactNode
  onSearchQueryChange: (value: string) => void
}

export function StandardTopBar({
  brief,
  feedCount,
  resultCount,
  searchQuery,
  searchInputRef,
  actions,
  onSearchQueryChange,
}: StandardTopBarProps) {
  const { i18n, t } = useTranslation('reader')
  const [searchOpen, setSearchOpen] = useState(false)
  const localSearchInputRef = useRef<HTMLInputElement | null>(null)
  const shortcutLabel =
    typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform)
      ? t('topbar.shortcutMac')
      : t('topbar.shortcutWin')

  useEffect(() => {
    if (!searchOpen) {
      return
    }

    localSearchInputRef.current?.focus()
    localSearchInputRef.current?.select()
  }, [searchOpen])

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const isSearchShortcut = (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k'

      if (isSearchShortcut) {
        event.preventDefault()
        setSearchOpen(true)
        return
      }

      if (event.key === '/' && !isEditableTarget(event.target)) {
        event.preventDefault()
        setSearchOpen(true)
        return
      }

      if (event.key === 'Escape' && searchOpen) {
        event.preventDefault()
        setSearchOpen(false)
      }
    }

    window.addEventListener('keydown', onKeyDown)

    return () => window.removeEventListener('keydown', onKeyDown)
  }, [searchOpen])

  function setSearchInputNode(node: HTMLInputElement | null) {
    localSearchInputRef.current = node

    if (searchInputRef) {
      searchInputRef.current = node
    }
  }

  return (
    <header className="standard-topbar">
      <div className="standard-brand">
        <span>AI</span>
        <i />
        <strong>{t('topbar.brand')}</strong>
      </div>
      <div className="standard-search" data-active={searchQuery ? 'true' : undefined}>
        <button
          type="button"
          className="standard-search-trigger"
          aria-label={t('topbar.searchOpenAria')}
          aria-expanded={searchOpen}
          data-empty={searchQuery ? undefined : 'true'}
          onClick={() => setSearchOpen(true)}
        >
          <MagnifyingGlassIcon />
          <span>{searchQuery || t('topbar.searchPlaceholder')}</span>
          <kbd>{shortcutLabel}</kbd>
        </button>
        {searchQuery ? (
          <button
            className="standard-search-clear"
            type="button"
            aria-label={t('topbar.searchClearAria')}
            onClick={() => onSearchQueryChange('')}
          >
            <XMarkIcon />
          </button>
        ) : null}
      </div>
      <div className="standard-status">
        <span className="standard-live-dot" />
        <span>{t('topbar.live')}</span>
        <span>{t('topbar.feeds', { count: feedCount })}</span>
        {typeof resultCount === 'number' ? <span>{t('topbar.items', { count: resultCount })}</span> : null}
        <span>01:36</span>
        <span>{formatIssueDate(brief.date, i18n.language)}</span>
      </div>
      {actions ? <div className="standard-topbar-actions">{actions}</div> : null}
      {searchOpen ? (
        <div className="standard-search-overlay" role="presentation" onMouseDown={() => setSearchOpen(false)}>
          <section
            className="standard-search-modal"
            role="dialog"
            aria-modal="true"
            aria-label={t('topbar.searchDialogAria')}
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="standard-search-modal-box" role="search">
              <MagnifyingGlassIcon />
              <input
                ref={setSearchInputNode}
                aria-label={t('topbar.searchInputAria')}
                placeholder={t('topbar.searchInputPlaceholder')}
                value={searchQuery}
                onChange={(event) => onSearchQueryChange(event.target.value)}
              />
              {searchQuery ? (
                <button type="button" aria-label={t('topbar.searchClearAria')} onClick={() => onSearchQueryChange('')}>
                  <XMarkIcon />
                </button>
              ) : null}
            </div>
            <div className="standard-search-modal-body">
              <span>
                {typeof resultCount === 'number'
                  ? t('topbar.matchingItems', { count: resultCount })
                  : t('topbar.filteringFeed')}
              </span>
              <p>{t('topbar.searchHint')}</p>
            </div>
            <footer className="standard-search-modal-footer">
              <span>
                <kbd>↑</kbd>
                <kbd>↓</kbd>
                {t('topbar.navigateFeed')}
              </span>
              <span>
                <kbd>Esc</kbd>
                {t('common:actions.close')}
              </span>
            </footer>
          </section>
        </div>
      ) : null}
    </header>
  )
}
