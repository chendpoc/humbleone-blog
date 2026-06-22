'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { TodayPrototype, type PrototypeVariant } from '../components/TodayPrototype'
import { ReaderLoadingScreen } from '../components/reader/ReaderLoadingScreen'
import { StandardReaderPrototype } from '../components/reader/StandardReaderPrototype'
import { useFeedHubBrief } from '../hooks/api/useFeedHubBrief'
import { dailyBrief } from '../lib/prototype-data'
import { I18nProvider } from '../providers/I18nProvider'

type ReaderTheme = 'standard' | 'source-desk'

const variants: PrototypeVariant[] = ['A', 'B', 'C']

function normalizeVariant(value: string | null): PrototypeVariant {
  const candidate = value?.toUpperCase()

  if (candidate && variants.includes(candidate as PrototypeVariant)) {
    return candidate as PrototypeVariant
  }

  return 'A'
}

function normalizeTheme(value: string | null): ReaderTheme {
  if (value === 'source-desk') {
    return 'source-desk'
  }

  return 'standard'
}

function ReaderAppClientFallback() {
  const { t } = useTranslation('common')

  return (
    <ReaderLoadingScreen detail={t('loading.reader')} />
  )
}

function ReaderAppDataFallback() {
  const { t } = useTranslation('common')

  return <ReaderLoadingScreen detail={t('loading.sources')} />
}

export function ReaderAppClient() {
  const searchParams = useSearchParams()
  const [mounted, setMounted] = useState(false)
  const [selectedSourceId, setSelectedSourceId] = useState<string | null>(() => normalizeSourceId(searchParams.get('source')))
  const feedHubBrief = useFeedHubBrief({ sourceId: selectedSourceId })
  const brief = feedHubBrief.data?.brief ?? dailyBrief

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <I18nProvider>
        <ReaderAppClientFallback />
      </I18nProvider>
    )
  }

  if (feedHubBrief.isLoading && !feedHubBrief.data) {
    return (
      <I18nProvider>
        <ReaderAppDataFallback />
      </I18nProvider>
    )
  }

  const variant = normalizeVariant(searchParams.get('variant'))
  const theme = normalizeTheme(searchParams.get('theme'))

  return (
    <I18nProvider>
      {theme === 'source-desk' ? (
        <TodayPrototype brief={brief} variant={variant} />
      ) : (
        <StandardReaderPrototype
          brief={brief}
          canLoadMoreFeed={feedHubBrief.canLoadMore}
          loadedFeedCount={feedHubBrief.data ? feedHubBrief.loadedCount : brief.itemCount}
          loadingMoreFeed={feedHubBrief.isLoadingMore}
          selectedSourceId={selectedSourceId}
          totalFeedCount={feedHubBrief.data ? feedHubBrief.totalCount : brief.itemCount}
          onLoadMoreFeed={async () => {
            await feedHubBrief.loadMore()
          }}
          onRefreshFeed={async () => {
            const response = await feedHubBrief.refresh()

            return response?.brief ?? null
          }}
          onSelectedSourceIdChange={setSelectedSourceId}
          onSourceConfigChanged={async () => {
            await feedHubBrief.refetch()
          }}
        />
      )}
    </I18nProvider>
  )
}

function normalizeSourceId(value: string | null) {
  const trimmed = value?.trim()

  return trimmed || null
}
