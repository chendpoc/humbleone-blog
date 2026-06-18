'use client'

import { useTranslation } from 'react-i18next'
import type { StandardLibraryFilter, StandardSource } from '../../types/reader'
import { BookmarkIcon, StarIcon } from './ReaderIcons'

type StandardSourceInspectorProps = {
  sources: StandardSource[]
  libraryCounts?: Record<StandardLibraryFilter, number>
  libraryFilter?: StandardLibraryFilter | null
  onSelectLibraryFilter?: (filter: StandardLibraryFilter) => void
}

export function StandardSourceInspector({
  sources,
  libraryCounts = { bookmarks: 0, favorites: 0 },
  libraryFilter = null,
  onSelectLibraryFilter,
}: StandardSourceInspectorProps) {
  const { t } = useTranslation('reader')
  const activeCount = sources.filter((source) => source.active).length
  const failedCount = sources.filter((source) => source.health === 'failed').length

  return (
    <section className="standard-source-inspector" aria-label={t('inspector.overviewAria')}>
      <header>
        <span>{t('inspector.quickAccess')}</span>
        <strong>
          {activeCount}/{sources.length}
        </strong>
      </header>
      <div className="standard-quick-access-list" aria-label={t('inspector.quickAccessAria')}>
        <button
          type="button"
          className={libraryFilter === 'bookmarks' ? 'is-active' : undefined}
          aria-pressed={libraryFilter === 'bookmarks'}
          onClick={() => onSelectLibraryFilter?.('bookmarks')}
        >
          <BookmarkIcon />
          <span>{t('inspector.bookmarks')}</span>
          <b>{libraryCounts.bookmarks}</b>
        </button>
        <button
          type="button"
          className={libraryFilter === 'favorites' ? 'is-active' : undefined}
          aria-pressed={libraryFilter === 'favorites'}
          onClick={() => onSelectLibraryFilter?.('favorites')}
        >
          <StarIcon />
          <span>{t('inspector.favorites')}</span>
          <b>{libraryCounts.favorites}</b>
        </button>
      </div>
      <div className="standard-source-stat-grid">
        <span>
          {t('inspector.active')}
          <b>{activeCount}</b>
        </span>
        <span>
          {t('inspector.failed')}
          <b>{failedCount}</b>
        </span>
      </div>
      <p>{t('inspector.overviewHint')}</p>
    </section>
  )
}
