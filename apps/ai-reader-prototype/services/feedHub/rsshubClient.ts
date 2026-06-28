import { init, request } from 'rsshub'

import type { RsshubData } from './types'

/** RSSHub `init()` config (`ConfigEnv` in the library; not exported). */
export type RSSHubInitConfig = NonNullable<Parameters<typeof init>[0]>

type ReaderRSSHubRuntimeConfig = Pick<
  RSSHubInitConfig,
  'CACHE_TYPE' | 'LOGGER_LEVEL' | 'NO_LOGFILES' | 'REQUEST_TIMEOUT'
>

let rsshubInitPromise: Promise<void> | null = null

export function buildRSSHubRequestPath(route: string) {
  const trimmedRoute = route.trim()

  if (!trimmedRoute) {
    throw new Error('RSSHub route is required.')
  }

  const parsed = parseRSSHubRoute(trimmedRoute)
  const path = ensureLeadingSlash(parsed.pathname)
  const queryEntries = Array.from(parsed.searchParams.entries())
  const query = queryEntries.map(([name, value]) => `${encodeURIComponent(name)}=${encodeURIComponent(value)}`).join('&')

  return `${path}${query ? `?${query}` : ''}`
}

function parseRSSHubRoute(route: string) {
  const parsed = route.startsWith('http://') || route.startsWith('https://')
    ? new URL(route)
    : new URL(route, 'https://rsshub.internal')

  return parsed
}

function ensureLeadingSlash(path: string) {
  const normalizedPath = path.trim() || '/'
  return normalizedPath.startsWith('/') ? normalizedPath : `/${normalizedPath}`
}

export async function requestRSSHubRoute(route: string) {
  const requestPath = buildRSSHubRequestPath(route)

  await ensureRSSHubInitialized()

  return request(requestPath) as Promise<RsshubData>
}

function getRSSHubInitConfig(): ReaderRSSHubRuntimeConfig {
  return {
    CACHE_TYPE: 'memory',
    LOGGER_LEVEL: process.env.RSSHUB_LOGGER_LEVEL ?? 'error',
    NO_LOGFILES: 'true',
    REQUEST_TIMEOUT: process.env.RSSHUB_REQUEST_TIMEOUT ?? '12000',
  }
}

async function ensureRSSHubInitialized() {
  rsshubInitPromise ??= init(getRSSHubInitConfig()).catch((error) => {
    rsshubInitPromise = null
    throw error
  })

  await rsshubInitPromise
}
