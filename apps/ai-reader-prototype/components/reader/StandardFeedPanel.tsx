'use client'

import { useEffect, useRef } from 'react'
import type { CSSProperties } from 'react'
import { useTranslation } from 'react-i18next'
import {
  ArrowPathIcon,
  BookmarkIcon,
  CheckCircleIcon,
  ClockIcon,
  ExternalIcon,
  EyeIcon,
  MessageIcon,
  ShareIcon,
  StarIcon,
} from './ReaderIcons'
import { activateFromKeyboard, joinClasses } from '../../utils/readerUtils'
import type { StandardActionNotice, StandardArticle, StandardLibraryFilter } from '../../types/reader'
import { useGsapStaggerReveal } from '../../hooks/useGsapMotion'

type StandardFeedPanelProps = {
  articles: StandardArticle[]
  selectedArticleId: string
  selectedSourceId: string | null
  articlePanelOpen?: boolean
  unreadCount?: number
  readArticleIds?: Set<string>
  savedArticleIds?: Set<string>
  favoritedArticleIds?: Set<string>
  showUnreadOnly?: boolean
  actionNotice?: StandardActionNotice
  feedNotice?: string | null
  libraryFilter?: StandardLibraryFilter | null
  onSelectArticle: (articleId: string) => void
  onClearSource: () => void
  onClearLibraryFilter?: () => void
  onRestoreArticlePanel?: () => void
  onFavoriteArticle?: (articleId: string) => void
  onMarkAllRead?: () => void
  onRefreshFeed?: () => void
  onSaveArticle?: (articleId: string) => void
  onShareArticle?: (articleId: string) => void
  onToggleUnreadOnly?: (value: boolean) => void
}

const emptyReadArticleIds = new Set<string>()
const emptySavedArticleIds = new Set<string>()
const emptyFavoritedArticleIds = new Set<string>()

export function StandardFeedPanel({
  articles,
  selectedArticleId,
  selectedSourceId,
  articlePanelOpen = true,
  unreadCount = 0,
  readArticleIds = emptyReadArticleIds,
  savedArticleIds = emptySavedArticleIds,
  favoritedArticleIds = emptyFavoritedArticleIds,
  showUnreadOnly = false,
  actionNotice = null,
  feedNotice = null,
  libraryFilter = null,
  onSelectArticle,
  onClearSource,
  onClearLibraryFilter,
  onRestoreArticlePanel,
  onFavoriteArticle,
  onMarkAllRead,
  onRefreshFeed,
  onSaveArticle,
  onShareArticle,
  onToggleUnreadOnly,
}: StandardFeedPanelProps) {
  const { t } = useTranslation('reader')
  const listRef = useRef<HTMLDivElement>(null)
  const selectedCardRef = useRef<HTMLElement | null>(null)
  const articleMotionKey = articles.map((article) => article.id).join('|')
  const actionNoticeMotionKey = actionNotice
    ? `${actionNotice.articleId}:${actionNotice.label}:${actionNotice.tone}`
    : null

  useGsapStaggerReveal(listRef, articleMotionKey, {
    selector: '.standard-feed-card',
    duration: 0.22,
    stagger: 0.018,
    y: 7,
  })
  useGsapStaggerReveal(listRef, actionNoticeMotionKey, {
    selector: '.standard-feed-card-status',
    duration: 0.16,
    scale: 0.94,
    stagger: 0,
    y: -2,
  })

  useEffect(() => {
    selectedCardRef.current?.scrollIntoView({ block: 'nearest' })
  }, [selectedArticleId])

  return (
    <section className="standard-feed-panel" aria-label={t('feed.aria')}>
      <header className="standard-feed-toolbar">
        <div className="standard-feed-toolbar-status">
          <span>
            {libraryFilter
              ? t(`feed.library.${libraryFilter}`)
              : showUnreadOnly
                ? t('feed.unreadList')
                : t('feed.list')}
          </span>
          <small>{t('feed.shownUnread', { shown: articles.length, unread: unreadCount })}</small>
          {feedNotice ? <strong aria-live="polite">{feedNotice}</strong> : null}
        </div>
        <div className="standard-feed-toolbar-actions" aria-label={t('feed.actionsAria')}>
          <button type="button" aria-label={t('feed.refreshAria')} onClick={onRefreshFeed}>
            <ArrowPathIcon />
            <span>{t('feed.refresh')}</span>
          </button>
          <button
            type="button"
            className={showUnreadOnly ? 'is-active' : undefined}
            aria-label={t('feed.unreadOnlyAria')}
            aria-pressed={showUnreadOnly}
            onClick={() => onToggleUnreadOnly?.(!showUnreadOnly)}
          >
            <EyeIcon />
            <span>{t('feed.unreadOnly')}</span>
          </button>
          <button type="button" aria-label={t('feed.markReadAria')} onClick={onMarkAllRead}>
            <CheckCircleIcon />
            <span>{t('feed.markRead')}</span>
          </button>
        </div>
      </header>
      {selectedSourceId ? (
        <div className="standard-filter-strip">
          <span>{t('feed.sourceFilterActive')}</span>
          <button type="button" onClick={onClearSource}>
            {t('common:actions.clear')}
          </button>
        </div>
      ) : null}
      {libraryFilter ? (
        <div className="standard-filter-strip is-library-filter">
          <span>{t(`feed.libraryActive.${libraryFilter}`)}</span>
          <button type="button" onClick={onClearLibraryFilter}>
            {t('common:actions.clear')}
          </button>
        </div>
      ) : null}
      {!articlePanelOpen ? (
        <div className="standard-detail-restore-strip">
          <span>{t('feed.detailMinimized')}</span>
          <button type="button" onClick={onRestoreArticlePanel}>
            {t('common:actions.restore')}
          </button>
        </div>
      ) : null}
      <div ref={listRef} className="standard-feed-list">
        {articles.length ? (
          articles.map((article, index) => {
            const isRead = readArticleIds.has(article.id)
            const isSaved = savedArticleIds.has(article.id)
            const isFavorited = favoritedArticleIds.has(article.id)
            const articleNotice = actionNotice?.articleId === article.id ? actionNotice : null

            return (
              <article
                key={article.id}
                ref={selectedArticleId === article.id ? selectedCardRef : undefined}
                className={joinClasses(
                  'standard-feed-card',
                  `importance-${article.importance}`,
                  selectedArticleId === article.id && 'is-selected',
                  isRead && 'is-read',
                  isSaved && 'is-saved',
                  isFavorited && 'is-favorited',
                )}
                style={{ '--standard-card-index': index } as CSSProperties}
                role="button"
                tabIndex={0}
                aria-current={selectedArticleId === article.id ? 'true' : undefined}
                onClick={() => onSelectArticle(article.id)}
                onKeyDown={(event) => activateFromKeyboard(event, () => onSelectArticle(article.id))}
                >
                <div className="standard-feed-state-marks" aria-hidden="true">
                  {isSaved ? <span className="mark-bookmark" /> : null}
                  {isFavorited ? <span className="mark-favorite">★</span> : null}
                </div>
                {article.importance === 'breaking' ? (
                  <span className="standard-breaking">● {t('feed.breaking')}</span>
                ) : null}
                <div className="standard-feed-card-body">
                  <div className="standard-feed-card-main">
                    <div className="standard-feed-meta">
                      <span>{article.sourceName}</span>
                    </div>
                    <h2>{article.title}</h2>
                    {article.importance !== 'standard' ? <p>{article.summary}</p> : null}
                    {article.imageUrl && article.importance !== 'standard' ? (
                      <img src={article.imageUrl} alt="" loading="lazy" />
                    ) : null}
                    <footer>
                      <span>
                        <ClockIcon />
                        {article.relativeTime}
                      </span>
                      <span>{t('feed.readTime', { minutes: article.readTime })}</span>
                      <span>
                        <MessageIcon />
                        {article.commentCount}
                      </span>
                      {articleNotice ? (
                        <span className={`standard-feed-card-status tone-${articleNotice.tone}`} aria-live="polite">
                          {articleNotice.label}
                        </span>
                      ) : null}
                    </footer>
                  </div>
                  <div className="standard-feed-actions" aria-label={t('feed.actionsAriaArticle')}>
                    <button
                      type="button"
                      className={isSaved ? 'is-active' : undefined}
                      aria-label={isSaved ? t('feed.unsaveAria') : t('feed.saveAria')}
                      title={isSaved ? t('feed.unsave') : t('feed.save')}
                      aria-pressed={isSaved}
                      onClick={(event) => {
                        event.stopPropagation()
                        onSaveArticle?.(article.id)
                      }}
                    >
                      <BookmarkIcon />
                    </button>
                    <button
                      type="button"
                      className={isFavorited ? 'is-active is-favorite' : 'is-favorite'}
                      aria-label={isFavorited ? t('feed.unfavoriteAria') : t('feed.favoriteAria')}
                      title={isFavorited ? t('feed.unfavoriteTitle') : t('feed.favoriteTitle')}
                      aria-pressed={isFavorited}
                      onClick={(event) => {
                        event.stopPropagation()
                        onFavoriteArticle?.(article.id)
                      }}
                    >
                      <StarIcon />
                    </button>
                    <button
                      type="button"
                      aria-label={t('feed.shareAria')}
                      onClick={(event) => {
                        event.stopPropagation()
                        onShareArticle?.(article.id)
                      }}
                    >
                      <ShareIcon />
                    </button>
                    <a href={article.url} aria-label={t('feed.openOriginalAria')} onClick={(event) => event.stopPropagation()}>
                      <ExternalIcon />
                    </a>
                  </div>
                </div>
              </article>
            )
          })
        ) : (
          <div className="standard-empty-state">
            <strong>{t('feed.emptyTitle')}</strong>
            <span>{t('feed.emptyHint')}</span>
          </div>
        )}
      </div>
    </section>
  )
}
