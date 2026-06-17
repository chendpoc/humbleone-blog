import type { StandardArticle, StandardFeedback } from './standardReaderTypes'

type StandardArticlePanelProps = {
  article: StandardArticle
  feedback: StandardFeedback
  onClose: () => void
  onFeedback: (value: Exclude<StandardFeedback, null>) => void
}

export function StandardArticlePanel({
  article,
  feedback,
  onClose,
  onFeedback,
}: StandardArticlePanelProps) {
  return (
    <aside className="standard-article-panel" aria-label="Selected article">
      <header className="standard-article-context">
        <div>
          <span>{article.standardCategory}</span>
          <i>·</i>
          <span>{article.sourceName}</span>
        </div>
        <button type="button" aria-label="Minimize detail panel" onClick={onClose}>
          ×
        </button>
      </header>
      <section className="standard-article-lede">
        {article.importance === 'breaking' ? <span className="standard-breaking">● Breaking</span> : null}
        <h2>{article.title}</h2>
        <div className="standard-article-time">
          <span>{article.relativeTime}</span>
          <span>{article.readTime}m read</span>
        </div>
      </section>
      {article.imageUrl ? <img className="standard-detail-image" src={article.imageUrl} alt="" loading="lazy" /> : null}
      <section className="standard-summary-block">
        <p>{article.summary}</p>
        <a href={article.url}>Read full article ↗</a>
      </section>
      <section className="standard-analysis-block">
        <header>
          <span>AI Analysis</span>
          <strong>positive</strong>
        </header>
        <p>{article.reader.aiSummary}</p>
        <div className="standard-analysis-feedback">
          <span>Was this helpful?</span>
          <button
            type="button"
            className={feedback === 'helpful' ? 'is-selected' : undefined}
            aria-label="Helpful"
            aria-pressed={feedback === 'helpful'}
            onClick={() => onFeedback('helpful')}
          >
            ♡
          </button>
          <button
            type="button"
            className={feedback === 'not-helpful' ? 'is-selected' : undefined}
            aria-label="Not helpful"
            aria-pressed={feedback === 'not-helpful'}
            onClick={() => onFeedback('not-helpful')}
          >
            ♧
          </button>
        </div>
      </section>
      <section className="standard-key-points">
        <span>Key Points</span>
        {article.reader.sourceProof.concat(article.reader.followUpQuestions.slice(0, 2)).map((point) => (
          <p key={point}>
            <i>→</i>
            {point}
          </p>
        ))}
      </section>
    </aside>
  )
}
