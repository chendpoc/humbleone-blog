import { joinClasses } from './readerUtils'

type StandardSourceRailProps = {
  selectedMode: string
  sourcesCollapsed: boolean
  onSelectMode: (mode: string) => void
}

const railItems = [
  { id: 'sources', label: 'Sources', glyph: '▣' },
  { id: 'signals', label: 'Signals', glyph: '◔' },
  { id: 'trends', label: 'Trends', glyph: '⌁' },
  { id: 'radio', label: 'Radio', glyph: '◎' },
]

export function StandardSourceRail({
  selectedMode,
  sourcesCollapsed,
  onSelectMode,
}: StandardSourceRailProps) {
  return (
    <nav className="standard-icon-rail" aria-label="Reader modes">
      <div className="standard-rail-mark">▣</div>
      {railItems.map((item) => (
        <button
          key={item.id}
          type="button"
          className={joinClasses(
            selectedMode === item.id && 'is-active',
            item.id === 'sources' && sourcesCollapsed && 'is-collapsed-anchor',
          )}
          aria-label={item.label}
          aria-pressed={selectedMode === item.id}
          title={item.label}
          onClick={() => onSelectMode(item.id)}
        >
          {item.glyph}
        </button>
      ))}
      <div className="standard-rail-spacer" />
      <button type="button" aria-label="Library" title="Library">
        ▱
      </button>
      <button type="button" aria-label="Settings" title="Settings">
        ⚙
      </button>
    </nav>
  )
}
