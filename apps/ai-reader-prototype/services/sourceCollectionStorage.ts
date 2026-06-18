import type { SourceCollectionState } from '../types/reader'

const sourceCollectionStorageKey = 'humbleone.ai-reader.standard.sourceCollections.v1'

export function readSourceCollectionState() {
  if (typeof window === 'undefined') {
    return null
  }

  try {
    const raw = window.localStorage.getItem(sourceCollectionStorageKey)

    return raw ? (JSON.parse(raw) as Partial<SourceCollectionState>) : null
  } catch {
    return null
  }
}

export function writeSourceCollectionState(state: SourceCollectionState) {
  if (typeof window === 'undefined') {
    return
  }

  try {
    window.localStorage.setItem(
      sourceCollectionStorageKey,
      JSON.stringify({
        collections: state.collections,
        sourceAliases: state.sourceAliases,
      }),
    )
  } catch {
    // Source organization is user preference state; storage failure should not block reading.
  }
}
