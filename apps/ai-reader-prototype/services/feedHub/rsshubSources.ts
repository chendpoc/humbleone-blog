import type { FeedHubSourceConfig } from './types'

export const feedHubRsshubSources: FeedHubSourceConfig[] = [
  {
    sourceId: 'source-anthropic-engineering',
    rsshubRoute: '/anthropic/engineering',
    section: 'hard_news',
    maxItems: 2,
    enabled: true,
  },
  {
    sourceId: 'source-claude-code-changelog',
    rsshubRoute: '/claude/code/changelog',
    section: 'hard_news',
    maxItems: 2,
    enabled: true,
  },
  {
    sourceId: 'source-cursor-changelog',
    rsshubRoute: '/cursor/changelog',
    section: 'cases',
    maxItems: 2,
    enabled: true,
  },
]
