import type { CSSProperties } from 'react'
import { activateFromKeyboard, joinClasses } from './readerUtils'
import { categoryTabs } from './standardReaderModel'
import type { StandardArticle } from './standardReaderTypes'

type StandardFeedPanelProps = {
  articles: StandardArticle[]
  selectedArticleId: string
  selectedCategory: string
  selectedSourceId: string | null
  onSelectArticle: (articleId: string) => void
  onSelectCategory: (category: string) => void
  onClearSource: () => void
}

export function StandardFeedPanel({
  articles,
  selectedArticleId,
  selectedCategory,
  selectedSourceId,
  onSelectArticle,
  onSelectCategory,
  onClearSource,
}: StandardFeedPanelProps) {
  return (
    <section className="standard-feed-panel" aria-label="Today feed">
      <nav className="standard-category-tabs" aria-label="Feed categories">
        {categoryTabs.map((tab) => (
          <button
            key={tab}
            type="button"
            className={tab === selectedCategory ? 'is-active' : undefined}
            aria-selected={tab === selectedCategory}
            onClick={() => onSelectCategory(tab)}
          >
            {tab}
          </button>
        ))}
      </nav>
      {selectedSourceId ? (
        <div className="standard-filter-strip">
          <span>Source filter active</span>
          <button type="button" onClick={onClearSource}>
            Clear
          </button>
        </div>
      ) : null}
      <div className="standard-feed-list">
        {articles.length ? (
          articles.map((article, index) => (
            <article
              key={article.id}
              className={joinClasses(
                'standard-feed-card',
                `importance-${article.importance}`,
                selectedArticleId === article.id && 'is-selected',
              )}
              style={{ '--standard-card-index': index } as CSSProperties}
              role="button"
              tabIndex={0}
              aria-current={selectedArticleId === article.id ? 'true' : undefined}
              onClick={() => onSelectArticle(article.id)}
              onKeyDown={(event) => activateFromKeyboard(event, () => onSelectArticle(article.id))}
            >
              {article.importance === 'breaking' ? <span className="standard-breaking">● Breaking</span> : null}
              <div className="standard-feed-meta">
                <span>{article.standardCategory}</span>
                <i>·</i>
                <span>{article.sourceName}</span>
              </div>
              <h2>{article.title}</h2>
              {article.importance !== 'standard' ? <p>{article.summary}</p> : null}
              {article.imageUrl && article.importance !== 'standard' ? (
                <img src={article.imageUrl} alt="" loading="lazy" />
              ) : null}
              <footer>
                <span>{article.relativeTime}</span>
                <span>{article.readTime}m read</span>
                <span>{article.commentCount}</span>
              </footer>
            </article>
          ))
        ) : (
          <div className="standard-empty-state">
            <strong>No matching signals</strong>
            <span>Clear the source filter or search query.</span>
          </div>
        )}
      </div>
    </section>
  )
}
