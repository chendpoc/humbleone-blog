import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import type { CSSProperties } from 'react'

import { ResizableReaderLayout } from './ResizableReaderLayout'

const meta = {
  title: 'AI Reader/Resizable Reader Layout',
  parameters: {
    layout: 'fullscreen',
    backgrounds: {
      default: 'standard',
    },
  },
} satisfies Meta

export default meta

type Story = StoryObj<typeof meta>

export const DraggableBoundaries: Story = {
  render: () => (
    <main className="standard-reader" data-theme="standard">
      <header className="standard-topbar">
        <div className="standard-brand">
          <span>AI</span>
          <i />
          <strong>Layout Lab</strong>
        </div>
        <div className="standard-status">
          <span className="standard-live-dot" />
          <span>DRAGGABLE</span>
          <span>2 BOUNDARIES</span>
        </div>
      </header>
      <ResizableReaderLayout
        renderLeft={(controls) => (
          controls.sourcesCollapsed ? (
            <nav className="standard-icon-rail" aria-label="Layout story rail">
              <div className="standard-rail-mark">▣</div>
              <button
                type="button"
                className="is-active is-collapsed-anchor"
                aria-label="Expand sources"
                aria-pressed={false}
                onClick={controls.expandSourcesPanel}
              >
                ▣
              </button>
              <button type="button" aria-label="Signals">
                ◔
              </button>
              <div className="standard-rail-spacer" />
              <button type="button" aria-label="Reset detail panel" onClick={controls.resetArticlePanel}>
                ↻
              </button>
            </nav>
          ) : (
            <aside className="standard-sources-panel" aria-label="Sources panel story">
              <header>
                <span>Sources</span>
                <div className="standard-sources-panel-actions">
                  <small>3/4</small>
                  <button type="button" aria-label="Collapse sources panel" onClick={controls.collapseSourcesPanel}>
                    ⇤
                  </button>
                </div>
              </header>
              <div className="standard-source-groups">
                <section className="standard-source-group">
                  <h2>Labs</h2>
                  <button type="button" className="standard-source-row is-active is-selected">
                    <span className="standard-source-dot" />
                    <span>Anthropic Engineering</span>
                  </button>
                  <button type="button" className="standard-source-row is-active">
                    <span className="standard-source-dot" />
                    <span>OpenAI Blog</span>
                  </button>
                </section>
                <section className="standard-source-group">
                  <h2>Runtime</h2>
                  <button type="button" className="standard-source-row is-active">
                    <span className="standard-source-dot" />
                    <span>CodeWhale Changelog</span>
                  </button>
                </section>
              </div>
            </aside>
          )
        )}
        feed={
          <section className="standard-feed-panel" aria-label="Feed panel story">
            <nav className="standard-category-tabs" aria-label="Categories">
              <button type="button" className="is-active">
                All
              </button>
              <button type="button">AI Labs</button>
              <button type="button">Runtime</button>
            </nav>
            <div className="standard-feed-list">
              {['Left boundary collapses sources into the icon rail', 'Right boundary keeps a readable detail column', 'Double click either handle to snap'].map(
                (title, index) => (
                  <article
                    key={title}
                    className={index === 0 ? 'standard-feed-card importance-breaking is-selected' : 'standard-feed-card importance-standard'}
                    style={{ '--standard-card-index': index } as CSSProperties}
                  >
                    <div className="standard-feed-meta">
                      <span>LAYOUT</span>
                      <i>·</i>
                      <span>Storybook</span>
                    </div>
                    <h2>{title}</h2>
                    <footer>
                      <span>{index + 1}m ago</span>
                      <span>3m read</span>
                      <span>{120 + index * 24}</span>
                    </footer>
                  </article>
                ),
              )}
            </div>
          </section>
        }
        renderArticle={(controls) => (
          <aside className="standard-article-panel" aria-label="Article panel story">
            <header className="standard-article-context">
              <div>
                <span>LAYOUT</span>
                <i>·</i>
                <span>Resizable</span>
              </div>
              <button type="button" aria-label="Minimize detail" onClick={controls.minimizeArticlePanel}>
                ×
              </button>
            </header>
            <section className="standard-article-lede">
              <h2>Resizable reader layout</h2>
              <div className="standard-article-time">
                <span>interactive</span>
                <span>storybook</span>
              </div>
            </section>
            <section className="standard-summary-block">
              <p>
                Drag the two thin separators. The left separator can collapse the sources panel into the rail. The right separator
                preserves a fixed minimum detail width.
              </p>
            </section>
          </aside>
        )}
      />
    </main>
  ),
}
