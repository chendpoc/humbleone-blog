import groupBy from 'lodash/groupBy'
import uniq from 'lodash/uniq'
import type { SourceCollection, SourceCollectionState, StandardSource } from '../types/reader'

const fallbackCollectionId = 'general'

export function buildDefaultSourceCollectionState(sources: StandardSource[]): SourceCollectionState {
  const groupedSources = groupBy(sources, 'category')

  return {
    collections: Object.entries(groupedSources).map(([category, items]) => ({
      id: category,
      name: category,
      systemCategory: category,
      sourceIds: items.map((source) => source.feedSourceId),
    })),
    sourceAliases: {},
  }
}

export function reconcileSourceCollectionState(
  sources: StandardSource[],
  storedState: Partial<SourceCollectionState> | null,
): SourceCollectionState {
  const defaultState = buildDefaultSourceCollectionState(sources)

  if (!storedState?.collections?.length) {
    return defaultState
  }

  const validSourceIds = new Set(sources.map((source) => source.feedSourceId))
  const defaultCollectionById = new Map(defaultState.collections.map((collection) => [collection.id, collection]))
  const collections = storedState.collections.reduce<SourceCollection[]>((nextCollections, collection) => {
      if (!collection || typeof collection.id !== 'string' || typeof collection.name !== 'string') {
        return nextCollections
      }

      const defaultCollection = defaultCollectionById.get(collection.id)
      const nextCollection: SourceCollection = {
        id: collection.id,
        name: collection.name.trim() || defaultCollection?.name || collection.id,
        systemCategory:
          typeof collection.systemCategory === 'string' ? collection.systemCategory : defaultCollection?.systemCategory,
        sourceIds: Array.isArray(collection.sourceIds)
          ? uniq(collection.sourceIds.filter((sourceId) => validSourceIds.has(sourceId)))
          : [],
      }

      nextCollections.push(nextCollection)
      return nextCollections
    }, [])

  const knownCollectionIds = new Set(collections.map((collection) => collection.id))

  defaultState.collections.forEach((collection) => {
    if (!knownCollectionIds.has(collection.id)) {
      collections.push(collection)
    }
  })

  const assignedSourceIds = new Set(collections.flatMap((collection) => collection.sourceIds))

  defaultState.collections.forEach((defaultCollection) => {
    const missingSourceIds = defaultCollection.sourceIds.filter((sourceId) => !assignedSourceIds.has(sourceId))

    if (!missingSourceIds.length) {
      return
    }

    const targetCollection = collections.find((collection) => collection.id === defaultCollection.id) ?? collections[0]

    if (targetCollection) {
      targetCollection.sourceIds = uniq([...targetCollection.sourceIds, ...missingSourceIds])
    }
  })

  const sourceAliases = Object.fromEntries(
    Object.entries(storedState.sourceAliases ?? {})
      .filter(
        (entry): entry is [string, string] =>
          validSourceIds.has(entry[0]) && typeof entry[1] === 'string' && entry[1].trim().length > 0,
      )
      .map(([sourceId, alias]) => [sourceId, alias.trim()]),
  )

  return {
    collections: collections.length ? collections : defaultState.collections,
    sourceAliases,
  }
}

export function applySourceCollectionState(
  sources: StandardSource[],
  state: SourceCollectionState,
): StandardSource[] {
  return sources.map((source) => ({
    ...source,
    label: state.sourceAliases[source.feedSourceId] ?? source.label,
  }))
}

export function ensureSourceHasCollection(state: SourceCollectionState, sourceId: string) {
  if (state.collections.some((collection) => collection.sourceIds.includes(sourceId))) {
    return state
  }

  const fallbackCollection =
    state.collections.find((collection) => collection.id === fallbackCollectionId) ?? state.collections[0]

  if (!fallbackCollection) {
    return state
  }

  return {
    ...state,
    collections: state.collections.map((collection) =>
      collection.id === fallbackCollection.id
        ? { ...collection, sourceIds: uniq([...collection.sourceIds, sourceId]) }
        : collection,
    ),
  }
}

export function createSourceCollectionId(name: string, existingIds: Set<string>) {
  const slug = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 32)
  const baseId = slug ? `custom-${slug}` : 'custom-group'
  let nextId = baseId
  let suffix = 2

  while (existingIds.has(nextId)) {
    nextId = `${baseId}-${suffix}`
    suffix += 1
  }

  return nextId
}

export function normalizeSourceCollectionName(name: string) {
  return name.trim().replace(/\s+/g, ' ')
}
