import type { RsshubData } from './types'

type RSSHubModule = {
  init: (config?: Record<string, string | undefined>) => Promise<void>
  request: (path: string) => Promise<RsshubData>
}

let rsshubModulePromise: Promise<RSSHubModule> | null = null
let rsshubInitPromise: Promise<void> | null = null

async function loadRSSHub() {
  setRSSHubEnvironmentDefaults()
  rsshubModulePromise ??= import('rsshub') as Promise<RSSHubModule>
  return rsshubModulePromise
}

export async function requestRSSHubRoute(path: string) {
  const rsshub = await loadRSSHub()

  await ensureRSSHubInitialized(rsshub)

  return rsshub.request(path)
}

function getRSSHubInitConfig() {
  return {
    CACHE_TYPE: 'memory',
    LOGGER_LEVEL: process.env.RSSHUB_LOGGER_LEVEL ?? 'error',
    NO_LOGFILES: 'true',
    REQUEST_TIMEOUT: process.env.RSSHUB_REQUEST_TIMEOUT ?? '12000',
  }
}

async function ensureRSSHubInitialized(rsshub: RSSHubModule) {
  rsshubInitPromise ??= rsshub.init(getRSSHubInitConfig()).catch((error) => {
    rsshubInitPromise = null
    throw error
  })

  await rsshubInitPromise
}

function setRSSHubEnvironmentDefaults() {
  process.env.IS_PACKAGE ??= 'true'
  process.env.LOGGER_LEVEL ??= 'error'
  process.env.NO_LOGFILES ??= 'true'
}
