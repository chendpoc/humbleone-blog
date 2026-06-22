import type { FeedHubSourceConfig } from './types'
import type { EffectiveSourceRegistry } from '../sourceRegistry'

export function getFeedHubSources(registry: EffectiveSourceRegistry): FeedHubSourceConfig[] {
  return registry.records.flatMap((record) => {
    if (!record.feedHub) {
      return []
    }

    const endpoint = resolveEndpoint(record)

    if (!endpoint) {
      return []
    }

    return [{
      adapter: record.adapter,
      endpoint,
      fetchMethod: record.fetchMethod,
      lookbackDays: record.feedHub.lookbackDays,
      sourceId: record.sourceId,
      rsshubRoute: endpoint,
      section: record.feedHub.section,
      enabled: record.feedHub.enabled,
      updateFrequency: record.updateFrequency,
    }]
  })
}

export function getFeedHubRsshubSources(registry: EffectiveSourceRegistry): FeedHubSourceConfig[] {
  return getFeedHubSources(registry).filter((source) => source.fetchMethod === 'rsshub')
}

function resolveEndpoint(record: EffectiveSourceRegistry['records'][number]) {
  if (record.fetchMethod === 'rsshub') {
    return record.rsshubRoute
  }

  if (record.fetchMethod === 'official_rss') {
    return record.feedUrl
  }

  if (record.fetchMethod === 'official_api') {
    return record.apiEndpoint
  }

  return undefined
}
