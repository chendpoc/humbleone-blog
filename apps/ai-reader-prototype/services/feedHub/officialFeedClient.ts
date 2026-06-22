import axios from 'axios'
import Parser from 'rss-parser'
import type { RsshubData, RsshubDataItem } from './types'

type FeedParserItem = {
  title?: string
  link?: string
  pubDate?: string
  isoDate?: string
  creator?: string
  author?: string
  guid?: string
  id?: string
  content?: string
  contentSnippet?: string
  summary?: string
  categories?: string[]
  'content:encoded'?: string
}

const parser = new Parser<Record<string, unknown>, FeedParserItem>()

export async function requestOfficialFeed(feedUrl: string): Promise<RsshubData> {
  const rawFeed = await fetchFeedText(feedUrl)
  const feed = await parser.parseString(rawFeed)

  return {
    title: feed.title ?? feedUrl,
    description: feed.description,
    link: feed.link ?? feedUrl,
    item: feed.items.map((item) => normalizeFeedParserItem(item, feedUrl)),
  }
}

async function fetchFeedText(feedUrl: string) {
  return fetchWithRetry(async () => {
    const response = await axios.get<string>(feedUrl, {
      headers: {
        Accept: 'application/rss+xml, application/atom+xml, application/xml, text/xml, */*',
        'User-Agent': 'AIReaderPrototype/0.1 (+https://github.com/Facefall/humbleone-blog)',
      },
      responseType: 'text',
      timeout: Number(process.env.FEED_HUB_OFFICIAL_RSS_TIMEOUT_MS ?? 20000),
      transformResponse: (data) => data,
    })

    if (response.status < 200 || response.status >= 300) {
      throw new Error(`Official RSS request failed: ${response.status} ${response.statusText} (${feedUrl})`)
    }

    return response.data
  })
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

function normalizeFeedParserItem(item: FeedParserItem, feedUrl: string): RsshubDataItem {
  const contentHtml = item['content:encoded'] ?? item.content
  const contentText = item.contentSnippet ?? item.summary

  return {
    title: item.title ?? item.link ?? 'Untitled feed item',
    description: contentText ?? contentHtml,
    pubDate: item.isoDate ?? item.pubDate,
    link: item.link ?? item.guid ?? feedUrl,
    author: item.creator ?? item.author,
    guid: item.guid ?? item.id ?? item.link,
    content: {
      ...(contentHtml ? { html: contentHtml } : {}),
      ...(contentText ? { text: contentText } : {}),
    },
    category: item.categories,
  }
}
