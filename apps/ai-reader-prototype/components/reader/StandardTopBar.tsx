import type { DailyBrief } from '../../lib/prototype-data'
import { formatIssueDate } from './standardReaderModel'

type StandardTopBarProps = {
  brief: DailyBrief
  feedCount: number
  searchQuery: string
  onSearchQueryChange: (value: string) => void
}

export function StandardTopBar({
  brief,
  feedCount,
  searchQuery,
  onSearchQueryChange,
}: StandardTopBarProps) {
  return (
    <header className="standard-topbar">
      <div className="standard-brand">
        <span>AI</span>
        <i />
        <strong>Newspaper Reader</strong>
      </div>
      <div className="standard-search" role="search">
        <span aria-hidden="true">⌕</span>
        <input
          aria-label="Search articles, sources, topics"
          placeholder="search articles, sources, topics..."
          value={searchQuery}
          onChange={(event) => onSearchQueryChange(event.target.value)}
        />
      </div>
      <div className="standard-status">
        <span className="standard-live-dot" />
        <span>LIVE</span>
        <span>{feedCount.toLocaleString('en-US')} FEEDS</span>
        <span>01:36</span>
        <span>{formatIssueDate(brief.date)}</span>
      </div>
    </header>
  )
}
