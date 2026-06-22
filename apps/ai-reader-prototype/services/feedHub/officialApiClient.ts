import axios from 'axios'
import type { FeedHubSourceConfig, RsshubData, RsshubDataItem } from './types'
import { requestOfficialFeed } from './officialFeedClient'

type HackerNewsItem = {
  by?: string
  dead?: boolean
  deleted?: boolean
  descendants?: number
  discussionComments?: HackerNewsItem[]
  id: number
  kids?: number[]
  parent?: number
  score?: number
  text?: string
  time?: number
  title?: string
  type?: string
  url?: string
}

type GitHubRelease = {
  author?: {
    login?: string
  }
  body?: string
  draft?: boolean
  html_url: string
  id: number
  name?: string
  prerelease?: boolean
  published_at?: string
  tag_name: string
}

export async function requestOfficialApiSource(config: FeedHubSourceConfig): Promise<RsshubData> {
  if (config.adapter === 'hackernews.api.topstories') {
    return requestHackerNewsTopStories(config)
  }

  if (config.adapter === 'github.releases.api') {
    return requestGitHubReleases(config)
  }

  throw new Error(`Unsupported official API adapter: ${config.adapter}`)
}

async function requestHackerNewsTopStories(config: FeedHubSourceConfig): Promise<RsshubData> {
  let items: RsshubDataItem[] = []

  try {
    const storyIds = await fetchJson<number[]>(config.endpoint)
    const stories = await requestHackerNewsStories(storyIds)

    items = stories
      .filter(isReadableHackerNewsStory)
      .map(toHackerNewsFeedItem)

    if (!items.length) {
      items = await requestHackerNewsRssFallback(config)
    }
  } catch {
    items = await requestHackerNewsRssFallback(config)
  }

  return {
    title: 'Hacker News Top Stories',
    description: 'Official Hacker News Firebase API top stories.',
    link: 'https://news.ycombinator.com/news',
    item: items,
  }
}

async function requestHackerNewsRssFallback(config: FeedHubSourceConfig) {
  const fallbackFeed = await requestOfficialFeed('https://news.ycombinator.com/rss')

  return (fallbackFeed.item ?? []).map((item) => ({
    ...item,
    category: Array.from(new Set([...(item.category ?? []), 'hacker-news', 'community-signal'])),
  }))
}

function buildHackerNewsItemApiUrl(storyId: number) {
  return `https://hacker-news.firebaseio.com/v0/item/${storyId}.json?print=pretty`
}

async function requestHackerNewsStories(storyIds: number[]) {
  const stories = new Array<HackerNewsItem | null>(storyIds.length)
  const concurrencyLimit = Math.max(1, getHackerNewsStoryRequestConcurrency())
  let cursor = 0

  const worker = async () => {
    while (cursor < storyIds.length) {
      const index = cursor
      const storyId = storyIds[index]
      cursor += 1

      if (!Number.isInteger(storyId) || storyId <= 0) {
        continue
      }

      try {
        const story = await fetchJson<HackerNewsItem>(buildHackerNewsItemApiUrl(storyId))

        stories[index] = await hydrateHackerNewsStoryDiscussion(story)
      } catch {
        // Best-effort: keep reading remaining stories even if one request fails.
      }
    }
  }

  const workerCount = Math.min(storyIds.length, concurrencyLimit)
  await Promise.all(Array.from({ length: workerCount }).map(() => worker()))

  return stories.filter((story): story is HackerNewsItem => Boolean(story))
}

function getHackerNewsStoryRequestConcurrency() {
  const rawLimit = Number(process.env.FEED_HUB_HN_STORY_CONCURRENCY)
  const parsedLimit = Number.isFinite(rawLimit) ? rawLimit : 16

  return Math.max(1, Math.floor(parsedLimit))
}

function getHackerNewsDiscussionCommentLimit() {
  const rawLimit = Number(process.env.FEED_HUB_HN_DISCUSSION_COMMENT_LIMIT ?? 3)
  const parsedLimit = Number.isFinite(rawLimit) ? rawLimit : 3

  return Math.max(0, Math.floor(parsedLimit))
}

async function hydrateHackerNewsStoryDiscussion(story: HackerNewsItem) {
  const limit = getHackerNewsDiscussionCommentLimit()
  const commentIds = story.kids?.filter((id) => Number.isInteger(id) && id > 0).slice(0, limit) ?? []

  if (!commentIds.length) {
    return story
  }

  const comments: HackerNewsItem[] = []

  for (const commentId of commentIds) {
    try {
      const comment = await fetchJson<HackerNewsItem>(buildHackerNewsItemApiUrl(commentId))

      if (isReadableHackerNewsComment(comment)) {
        comments.push(comment)
      }
    } catch {
      // Best-effort: one missing/deleted comment should not drop the story.
    }
  }

  return {
    ...story,
    discussionComments: comments,
  }
}

function isReadableHackerNewsStory(item: HackerNewsItem) {
  return !item.deleted && !item.dead && item.type === 'story' && Boolean(item.title)
}

function isReadableHackerNewsComment(item: HackerNewsItem) {
  return !item.deleted && !item.dead && item.type === 'comment' && Boolean(item.text)
}

function toHackerNewsFeedItem(item: HackerNewsItem): RsshubDataItem {
  const commentsUrl = `https://news.ycombinator.com/item?id=${item.id}`
  const pointsText = typeof item.score === 'number' ? `${item.score} points` : 'score unavailable'
  const commentsText = typeof item.descendants === 'number' ? `${item.descendants} comments` : 'comments unavailable'
  const metaText = `${pointsText} by ${item.by ?? 'unknown'}; ${commentsText}.`
  const description = buildHackerNewsDescription(item, metaText, commentsUrl)

  return {
    title: item.title ?? 'Untitled Hacker News story',
    description,
    discussionUrl: commentsUrl,
    metaText,
    pubDate: item.time ? item.time * 1000 : undefined,
    link: item.url ?? commentsUrl,
    author: item.by,
    guid: String(item.id),
    id: String(item.id),
    category: ['hacker-news', 'community-signal'],
  }
}

function buildHackerNewsDescription(
  item: HackerNewsItem,
  metaText: string,
  commentsUrl: string,
) {
  const comments = (item.discussionComments ?? [])
    .map(formatHackerNewsComment)
    .filter(Boolean)

  return [
    `Hacker News discussion metadata: ${metaText} Comments: ${commentsUrl}`,
    comments.length ? `Top HN comments:\n${comments.join('\n\n')}` : '',
  ].filter(Boolean).join('\n\n')
}

function formatHackerNewsComment(comment: HackerNewsItem) {
  const text = truncate(normalizeHackerNewsText(comment.text ?? ''), 420)

  if (!text) {
    return ''
  }

  return `${comment.by ?? 'unknown'}: ${text}`
}

function normalizeHackerNewsText(value: string) {
  return stripHtml(value)
    .replace(/\s+/g, ' ')
    .trim()
}

function stripHtml(value: string) {
  return value
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<pre><code>([\s\S]*?)<\/code><\/pre>/gi, ' $1 ')
    .replace(/<p\s*\/?>/gi, '\n\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#x([0-9a-f]+);/gi, decodeHexHtmlEntity)
    .replace(/&#([0-9]+);/g, decodeDecimalHtmlEntity)
    .replace(/&#x27;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
}

function decodeHexHtmlEntity(match: string, value: string) {
  return decodeHtmlEntity(match, Number.parseInt(value, 16))
}

function decodeDecimalHtmlEntity(match: string, value: string) {
  return decodeHtmlEntity(match, Number.parseInt(value, 10))
}

function decodeHtmlEntity(match: string, codePoint: number) {
  if (!Number.isFinite(codePoint)) {
    return match
  }

  try {
    return String.fromCodePoint(codePoint)
  } catch {
    return match
  }
}

function truncate(value: string, maxLength: number) {
  if (value.length <= maxLength) {
    return value
  }

  return `${value.slice(0, maxLength - 1).trim()}...`
}

async function requestGitHubReleases(config: FeedHubSourceConfig): Promise<RsshubData> {
  const lookbackStartMs = getLookbackStartMs(config.lookbackDays)
  const allReleases: GitHubRelease[] = []
  let page = 1

  while (true) {
    const { data: releases, headers } = await fetchJsonWithResponse<GitHubRelease[]>(buildGitHubReleasesApiUrl(config.endpoint, page))
    const releasePage = releases.filter((release) => !release.draft)

    allReleases.push(...releasePage)

    const isLastPage = !hasNextPage(headers.link)
    const allOlderThanLookback = isReleasePageOutsideLookback(releases, lookbackStartMs)

    if (isLastPage || !releasePage.length || allOlderThanLookback) {
      break
    }

    page += 1
  }

  const items = allReleases.map(toGitHubReleaseFeedItem)

  return {
    title: config.sourceId,
    description: 'Official GitHub releases API feed.',
    link: config.endpoint,
    item: items,
  }
}

function buildGitHubReleasesApiUrl(endpoint: string, page: number) {
  const apiUrl = new URL(endpoint)

  apiUrl.searchParams.set('per_page', '100')
  apiUrl.searchParams.set('page', String(page))

  return apiUrl.toString()
}

function getLookbackStartMs(lookbackDays: number) {
  const dayMs = 24 * 60 * 60 * 1000

  return Date.now() - lookbackDays * dayMs
}

function isReleasePageOutsideLookback(releases: GitHubRelease[], lookbackStartMs: number) {
  let hasComparableDate = false

  for (const release of releases) {
    const publishedAtMs = Date.parse(release.published_at ?? '')

    if (Number.isNaN(publishedAtMs)) {
      continue
    }

    hasComparableDate = true
    if (publishedAtMs >= lookbackStartMs) {
      return false
    }
  }

  return hasComparableDate
}

function hasNextPage(linkHeader: unknown) {
  const header = Array.isArray(linkHeader) ? linkHeader[0] : typeof linkHeader === 'string' ? linkHeader : null

  if (!header) {
    return false
  }

  return header.split(',').some((segment: string) => /rel="next"/.test(segment))
}

function toGitHubReleaseFeedItem(release: GitHubRelease): RsshubDataItem {
  const title = release.name?.trim() || release.tag_name

  return {
    title,
    description: release.body,
    pubDate: release.published_at,
    link: release.html_url,
    author: release.author?.login,
    guid: String(release.id),
    id: String(release.id),
    content: {
      text: release.body,
    },
    category: [
      'github-release',
      ...(release.prerelease ? ['prerelease'] : []),
    ],
  }
}

async function fetchJsonWithResponse<T>(url: string) {
  return fetchWithRetry(async () => {
    const response = await axios.get<T>(url, {
      headers: {
        Accept: 'application/json, application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'User-Agent': 'AIReaderPrototype/0.1 (+https://github.com/Facefall/humbleone-blog)',
      },
      timeout: Number(process.env.FEED_HUB_OFFICIAL_API_TIMEOUT_MS ?? 12000),
    })

    if (response.status < 200 || response.status >= 300) {
      throw new Error(`Official API request failed: ${response.status} ${response.statusText} (${url})`)
    }

    return response
  })
}

async function fetchJson<T>(url: string): Promise<T> {
  return fetchJsonWithResponse<T>(url).then((response) => response.data)
}

async function fetchWithRetry<T>(operation: () => Promise<T>) {
  let lastError: unknown

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      return await operation()
    } catch (error) {
      lastError = error
      await delay(attempt * 500)
    }
  }

  throw lastError
}

function delay(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}
