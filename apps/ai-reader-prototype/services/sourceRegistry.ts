import type { EvidenceLevel, SourceFamily } from '../lib/prototype-data'

export type FetchMethod = 'official_rss' | 'official_api' | 'rsshub' | 'custom_scrape' | 'manual'
export type SourceContentType = 'article' | 'social' | 'image' | 'video'

export type SourceRegistryRecord = {
  sourceId: string
  displayName: string
  sourceFamily: SourceFamily
  topicTags: string[]
  priority: 'critical' | 'high' | 'medium' | 'low'
  language: 'zh-CN' | 'en' | 'mixed'
  officialUrl: string
  fetchMethod: FetchMethod
  contentType: SourceContentType
  adapter: string
  rsshubRoute?: string
  updateFrequency: string
  evidenceLevel: EvidenceLevel
  whyFollow: string
  riskNotes: string
}

export const sourceRegistry: Record<string, SourceRegistryRecord> = {
  'source-anthropic-engineering': {
    sourceId: 'source-anthropic-engineering',
    displayName: 'Anthropic Engineering',
    sourceFamily: 'model_lab',
    topicTags: ['claude-code', 'api', 'agent-workflow'],
    priority: 'critical',
    language: 'en',
    officialUrl: 'https://www.anthropic.com/engineering',
    fetchMethod: 'official_rss',
    contentType: 'article',
    adapter: 'anthropic.engineering.feed',
    rsshubRoute: '/anthropic/engineering',
    updateFrequency: 'daily check',
    evidenceLevel: 'official',
    whyFollow: 'Official engineering updates often change coding-agent workflow assumptions.',
    riskNotes: 'Product posts can be broad; keep engineering evidence separate from launch copy.',
  },
  'source-claude-code-changelog': {
    sourceId: 'source-claude-code-changelog',
    displayName: 'Claude Code Changelog',
    sourceFamily: 'model_lab',
    topicTags: ['claude-code', 'changelog', 'coding-agent'],
    priority: 'critical',
    language: 'en',
    officialUrl: 'https://docs.anthropic.com/en/docs/claude-code/changelog',
    fetchMethod: 'rsshub',
    contentType: 'article',
    adapter: 'rsshub.claude.code.changelog',
    rsshubRoute: '/claude/code/changelog',
    updateFrequency: 'daily check',
    evidenceLevel: 'official',
    whyFollow: 'Claude Code changelog is a direct signal for coding-agent workflow changes.',
    riskNotes: 'Changelog items can be small; keep only workflow-impacting updates in daily picks.',
  },
  'source-codewhale-changelog': {
    sourceId: 'source-codewhale-changelog',
    displayName: 'CodeWhale Changelog',
    sourceFamily: 'project_changelog',
    topicTags: ['runtime', 'tool-boundary', 'multi-agent'],
    priority: 'high',
    language: 'zh-CN',
    officialUrl: 'https://github.com',
    fetchMethod: 'official_api',
    contentType: 'article',
    adapter: 'github.releases-and-commits',
    updateFrequency: 'daily check',
    evidenceLevel: 'github',
    whyFollow: 'Runtime and tool-call changes are direct references for this reader product.',
    riskNotes: 'Changelog language can be implementation-heavy; summarize only verified behavior.',
  },
  'source-wayland-zhang': {
    sourceId: 'source-wayland-zhang',
    displayName: 'Wayland Zhang',
    sourceFamily: 'builder',
    topicTags: ['builder-case', 'agent-planning', 'evaluation'],
    priority: 'high',
    language: 'zh-CN',
    officialUrl: 'https://waylandz.com',
    fetchMethod: 'official_rss',
    contentType: 'article',
    adapter: 'site.rss',
    updateFrequency: 'daily check',
    evidenceLevel: 'builder',
    whyFollow: 'Builder notes provide concrete project cases instead of abstract agent claims.',
    riskNotes: 'Treat as practitioner evidence; cross-check broad claims against official sources.',
  },
  'source-hacker-news': {
    sourceId: 'source-hacker-news',
    displayName: 'Hacker News',
    sourceFamily: 'community',
    topicTags: ['community-signal', 'pain-points', 'tool-usage'],
    priority: 'medium',
    language: 'en',
    officialUrl: 'https://news.ycombinator.com',
    fetchMethod: 'rsshub',
    contentType: 'social',
    adapter: 'rsshub.hackernews.search',
    updateFrequency: 'twice daily',
    evidenceLevel: 'community',
    whyFollow: 'Discussion threads surface practical friction before it appears in official docs.',
    riskNotes: 'Community signal is noisy; use it for questions and patterns, not final facts.',
  },
  'source-cursor-changelog': {
    sourceId: 'source-cursor-changelog',
    displayName: 'Cursor Changelog',
    sourceFamily: 'model_lab',
    topicTags: ['cursor', 'coding-agent', 'changelog'],
    priority: 'high',
    language: 'en',
    officialUrl: 'https://cursor.com/changelog',
    fetchMethod: 'rsshub',
    contentType: 'article',
    adapter: 'rsshub.cursor.changelog',
    rsshubRoute: '/cursor/changelog',
    updateFrequency: 'daily check',
    evidenceLevel: 'official',
    whyFollow: 'Cursor release notes show how agentic coding UX is evolving in production tools.',
    riskNotes: 'Product changelog language can be broad; prefer concrete workflow and editor behavior changes.',
  },
  'source-openai-blog': {
    sourceId: 'source-openai-blog',
    displayName: 'OpenAI Blog',
    sourceFamily: 'model_lab',
    topicTags: ['api', 'model-release', 'agents'],
    priority: 'medium',
    language: 'en',
    officialUrl: 'https://openai.com/blog',
    fetchMethod: 'official_rss',
    contentType: 'article',
    adapter: 'openai.blog.feed',
    updateFrequency: 'daily check',
    evidenceLevel: 'official',
    whyFollow: 'Official launch details matter when they change builder workflows or APIs.',
    riskNotes: 'Marketing posts should not enter the daily brief unless workflow impact is concrete.',
  },
  'source-old-rsshub-route': {
    sourceId: 'source-old-rsshub-route',
    displayName: 'Old RSSHub Route',
    sourceFamily: 'research',
    topicTags: ['rsshub', 'maintenance', 'broken-route'],
    priority: 'low',
    language: 'mixed',
    officialUrl: 'https://docs.rsshub.app',
    fetchMethod: 'rsshub',
    contentType: 'article',
    adapter: 'rsshub.legacy.route',
    updateFrequency: 'disabled',
    evidenceLevel: 'rss',
    whyFollow: 'Kept as a failure-state sample for source health and repair workflows.',
    riskNotes: 'Known failed route; do not include in daily picks until repaired.',
  },
}

export function getSourceRegistryRecord(sourceId: string) {
  return sourceRegistry[sourceId]
}
