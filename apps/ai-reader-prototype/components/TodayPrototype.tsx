import type { DailyBrief, FeedItem, SourceDeskItem } from '../lib/prototype-data'
import { PrototypeSwitcher } from './PrototypeSwitcher'
import {
  ClippingCard,
  DeskFooterAction,
  DeskHeaderTools,
  PinnedNoteCard,
  SourceDeskFooter,
  SourceDeskHeader,
  SourceDeskSection,
  SourceDeskShell,
  SourceSlip,
  StampBadge,
} from './source-desk/SourceDeskPrimitives'

export type PrototypeVariant = 'A' | 'B' | 'C'

const variantCopy: Record<PrototypeVariant, { label: string; title: string; note: string }> = {
  A: {
    label: 'Variant A',
    title: 'Editor desk / timeline / newspaper',
    note: 'Balanced three-pane structure for validating the current product direction.',
  },
  B: {
    label: 'Variant B',
    title: 'Timeline-led morning sort',
    note: 'The central daily list dominates while the source desk compresses into tactile source slips.',
  },
  C: {
    label: 'Variant C',
    title: 'Newspaper-first reading room',
    note: 'The reader owns the surface while source and timeline context stay visible at the edge.',
  },
}

function flattenItems(brief: DailyBrief) {
  return brief.sections.flatMap((section) => section.items)
}

function formatDate(value: string) {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat('zh-CN', {
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  }).format(date)
}

function getFeaturedItem(brief: DailyBrief) {
  const items = flattenItems(brief)

  return items.find((item) => item.id === brief.reader.selectedItemId) ?? items.find((item) => item.id === brief.selectedItemId) ?? items[0]
}

export function TodayPrototype({
  brief,
  variant,
}: {
  brief: DailyBrief
  variant: PrototypeVariant
}) {
  const copy = variantCopy[variant]
  const featuredItem = getFeaturedItem(brief)

  return (
    <main className={`reader-shell variant-${variant.toLowerCase()}`}>
      <PrototypeSwitcher variant={variant} />
      <section className="prototype-masthead" aria-labelledby="prototype-title">
        <div>
          <p className="prototype-kicker">{copy.label}</p>
          <h1 id="prototype-title">{brief.title}</h1>
          <p>{brief.judgment}</p>
        </div>
        <aside className="masthead-card" aria-label="Prototype framing">
          <span>{formatDate(brief.date)}</span>
          <strong>{copy.title}</strong>
          <small>{copy.note}</small>
        </aside>
      </section>
      <section className="three-pane-stage" aria-label="Today reader prototype">
        <SourceDesk brief={brief} compact={variant !== 'A'} />
        <TodayTimeline brief={brief} dominant={variant === 'B'} />
        <NewspaperReader brief={brief} item={featuredItem} dominant={variant === 'C'} />
      </section>
    </main>
  )
}

function SourceDesk({ brief, compact }: { brief: DailyBrief; compact?: boolean }) {
  const desk = brief.sourceDesk
  const visibleNavigation = compact ? desk.navigation.slice(0, 3) : desk.navigation
  const visibleGroups = compact ? desk.sourceGroups.slice(0, 3) : desk.sourceGroups
  const visibleSlips = compact ? desk.sourceSlips.slice(0, 5) : desk.sourceSlips
  const visibleNotes = compact ? desk.pinnedNotes.slice(0, 1) : desk.pinnedNotes.slice(0, 3)

  return (
    <SourceDeskShell density={compact ? 'compact' : 'regular'} aria-label="Source Desk">
      <SourceDeskHeader
        label={desk.issueLabel}
        title={compact ? 'Source Desk' : desk.masthead}
        action={<DeskHeaderTools />}
      />
      <div className="desk-nav" aria-label="Desk navigation">
        {visibleNavigation.map((item) => (
          <DeskChip key={item.id} item={item} />
        ))}
      </div>
      <SourceDeskSection label="Source Desk" tab kind="folders">
        {visibleGroups.map((source, index) => (
          <SourceSlip key={source.id} source={source} index={index} density={compact ? 'compact' : 'regular'} />
        ))}
      </SourceDeskSection>
      <SourceDeskSection label="Watched Sources">
        {visibleSlips.map((source, index) => (
          <SourceSlip key={source.id} source={source} index={index} density={compact ? 'compact' : 'regular'} />
        ))}
      </SourceDeskSection>
      <SourceDeskSection label="Pinned Notes" action="Edit" kind="notes">
        {visibleNotes.map((note) => (
          <PinnedNoteCard key={note.id} note={note} />
        ))}
      </SourceDeskSection>
      {!compact ? (
        <SourceDeskSection label="Quick Access" action="Drag to pin" kind="clippings">
          {desk.quickAccess.slice(0, 4).map((item) => (
            <ClippingCard key={item.id} item={item} />
          ))}
        </SourceDeskSection>
      ) : null}
      <SourceDeskFooter>
        <DeskFooterAction>{desk.footerAction.label}</DeskFooterAction>
        {!compact ? <span>{desk.footerAction.secondaryLabel}</span> : null}
      </SourceDeskFooter>
    </SourceDeskShell>
  )
}

function DeskChip({ item }: { item: SourceDeskItem }) {
  return (
    <span className={`desk-chip state-${item.state} health-${item.health}`}>
      {item.label}
      {item.count ? <b>{item.count}</b> : null}
    </span>
  )
}

function TodayTimeline({ brief, dominant }: { brief: DailyBrief; dominant?: boolean }) {
  return (
    <section className={`today-timeline panel ${dominant ? 'is-dominant' : ''}`} aria-label="Today Timeline">
      <header className="panel-header">
        <div>
          <p className="panel-label">Today Timeline</p>
          <h2>{dominant ? 'Morning signal order' : 'Today picks'}</h2>
        </div>
        <StampBadge>{brief.itemCount} filed</StampBadge>
      </header>
      <div className="timeline-list">
        {brief.sections.map((section) => (
          <section key={section.id} className="timeline-section" aria-label={section.title}>
            <header>
              <h3>{section.title}</h3>
              <p>{section.description}</p>
            </header>
            {section.items.map((item, index) => (
              <TimelineCard key={item.id} item={item} index={index} dominant={dominant} />
            ))}
          </section>
        ))}
      </div>
    </section>
  )
}

function TimelineCard({ item, index, dominant }: { item: FeedItem; index: number; dominant?: boolean }) {
  return (
    <article className="timeline-card">
      <div className="timeline-index">{String(index + 1).padStart(2, '0')}</div>
      <div>
        <div className="timeline-meta">
          <span>{item.sourceName}</span>
          <span>{item.relativeTime}</span>
        </div>
        <h4>{item.title}</h4>
        <p>{dominant ? item.whyItMatters : item.summary}</p>
        <footer>
          {item.tags.slice(0, dominant ? 4 : 2).map((tag) => (
            <span key={tag}>{tag}</span>
          ))}
        </footer>
      </div>
      <aside className="score-stamp" aria-label={`Importance score ${item.importanceScore}`}>
        <span>{item.importanceScore}</span>
      </aside>
    </article>
  )
}

function NewspaperReader({
  brief,
  item,
  dominant,
}: {
  brief: DailyBrief
  item?: FeedItem
  dominant?: boolean
}) {
  if (!item) {
    return (
      <article className={`newspaper-reader panel ${dominant ? 'is-dominant' : ''}`}>
        <p className="panel-label">Newspaper Reader</p>
        <h2>No items yet</h2>
        <p>The reader pane is waiting for today&apos;s brief.</p>
      </article>
    )
  }

  return (
    <article className={`newspaper-reader panel ${dominant ? 'is-dominant' : ''}`} aria-label="Newspaper Reader">
      <header className="newspaper-flag">
        <p>{brief.reader.masthead}</p>
        <span>{brief.reader.editionLine}</span>
      </header>
      <p className="reader-kicker">{item.reader.kicker}</p>
      <h2>{item.reader.headline}</h2>
      <p className="reader-standfirst">{item.reader.aiSummary}</p>
      <div className="newspaper-body">
        {item.reader.body.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </div>
      <section className="proof-box" aria-label="Source proof">
        <h3>Source Proof</h3>
        {item.reader.sourceProof.map((proof) => (
          <p key={proof}>{proof}</p>
        ))}
      </section>
      <footer className="reader-footer">
        <span>{item.status}</span>
        <span>{item.language}</span>
        <span>{item.evidenceLevel}</span>
      </footer>
    </article>
  )
}
