'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { TodayPrototype, type PrototypeVariant } from '../components/TodayPrototype'
import { StandardReaderPrototype } from '../components/reader/StandardReaderPrototype'
import { useFeedHubBrief } from '../hooks/api/useFeedHubBrief'
import { dailyBrief } from '../lib/prototype-data'

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
  return (
    <main className="reader-csr-shell" aria-busy="true" aria-label="Loading reader">
      <span>AI</span>
      <strong>Loading reader workspace</strong>
    </main>
  )
}

export function ReaderAppClient() {
  const [mounted, setMounted] = useState(false)
  const feedHubBrief = useFeedHubBrief()
  const searchParams = useSearchParams()
  const brief = feedHubBrief.data?.brief ?? dailyBrief

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <ReaderAppClientFallback />
  }

  const variant = normalizeVariant(searchParams.get('variant'))
  const theme = normalizeTheme(searchParams.get('theme'))

  if (theme === 'source-desk') {
    return <TodayPrototype brief={brief} variant={variant} />
  }

  return <StandardReaderPrototype brief={brief} showThemeSwitch />
}
