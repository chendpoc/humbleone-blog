import { dailyBrief } from '../lib/prototype-data'
import { TodayPrototype, type PrototypeVariant } from '../components/TodayPrototype'
import { StandardReaderPrototype } from '../components/reader/StandardReaderPrototype'

type SearchParams =
  | Record<string, string | string[] | undefined>
  | Promise<Record<string, string | string[] | undefined>>

const variants: PrototypeVariant[] = ['A', 'B', 'C']
type ReaderTheme = 'standard' | 'source-desk'

function normalizeVariant(value: string | string[] | undefined): PrototypeVariant {
  const firstValue = Array.isArray(value) ? value[0] : value
  const candidate = firstValue?.toUpperCase()

  if (candidate && variants.includes(candidate as PrototypeVariant)) {
    return candidate as PrototypeVariant
  }

  return 'A'
}

function normalizeTheme(value: string | string[] | undefined): ReaderTheme {
  const firstValue = Array.isArray(value) ? value[0] : value

  if (firstValue === 'source-desk') {
    return 'source-desk'
  }

  return 'standard'
}

export default async function Page({
  searchParams,
}: {
  searchParams?: SearchParams
}) {
  const params = searchParams ? await searchParams : {}
  const variant = normalizeVariant(params.variant)
  const theme = normalizeTheme(params.theme)

  if (theme === 'source-desk') {
    return <TodayPrototype brief={dailyBrief} variant={variant} />
  }

  return <StandardReaderPrototype brief={dailyBrief} />
}
