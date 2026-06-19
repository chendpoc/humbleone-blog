'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import uniq from 'lodash/uniq'
import type { SourceCollectionConfig } from '../lib/prototype-data'
import { readSourceCollectionState, writeSourceCollectionState } from '../services/sourceCollectionStorage'
import type { SourceCollectionState, StandardSource } from '../types/reader'
import {
  applySourceCollectionState,
  buildDefaultSourceCollectionState,
  createSourceCollectionId,
  ensureSourceHasCollection,
  normalizeSourceCollectionName,
  reconcileSourceCollectionState,
} from '../utils/sourceCollections'

const emptyConfiguredCollections: SourceCollectionConfig[] = []

type UseSourceCollectionsOptions = {
  editable?: boolean
}

export function useSourceCollections(
  baseSources: StandardSource[],
  configuredCollections = emptyConfiguredCollections,
  options: UseSourceCollectionsOptions = {},
) {
  const editable = options.editable ?? false
  const defaultState = useMemo(
    () => buildDefaultSourceCollectionState(baseSources, configuredCollections),
    [baseSources, configuredCollections],
  )
  const [state, setState] = useState<SourceCollectionState>(() => defaultState)
  const [hydrated, setHydrated] = useState(false)
  const sourceById = useMemo(
    () => new Map(baseSources.map((source) => [source.feedSourceId, source])),
    [baseSources],
  )
  const sources = useMemo(() => applySourceCollectionState(baseSources, state), [baseSources, state])

  useEffect(() => {
    setState(
      editable
        ? reconcileSourceCollectionState(baseSources, readSourceCollectionState(), configuredCollections)
        : defaultState,
    )
    setHydrated(editable)
  }, [baseSources, configuredCollections, defaultState, editable])

  useEffect(() => {
    if (!editable || !hydrated) {
      return
    }

    writeSourceCollectionState(reconcileSourceCollectionState(baseSources, state, configuredCollections))
  }, [baseSources, configuredCollections, editable, hydrated, state])

  const createCollection = useCallback((name: string) => {
    if (!editable) {
      return
    }

    const normalizedName = normalizeSourceCollectionName(name)

    if (!normalizedName) {
      return
    }

    setState((current) => {
      const existingIds = new Set(current.collections.map((collection) => collection.id))

      return {
        ...current,
        collections: [
          ...current.collections,
          {
            id: createSourceCollectionId(normalizedName, existingIds),
            name: normalizedName,
            sourceIds: [],
          },
        ],
      }
    })
  }, [editable])

  const renameCollection = useCallback((collectionId: string, name: string) => {
    if (!editable) {
      return
    }

    const normalizedName = normalizeSourceCollectionName(name)

    if (!normalizedName) {
      return
    }

    setState((current) => ({
      ...current,
      collections: current.collections.map((collection) =>
        collection.id === collectionId
          ? { ...collection, name: normalizedName, systemCategory: undefined }
          : collection,
      ),
    }))
  }, [editable])

  const deleteCollection = useCallback((collectionId: string) => {
    if (!editable) {
      return
    }

    setState((current) => {
      if (current.collections.length <= 1) {
        return current
      }

      const deletedCollection = current.collections.find((collection) => collection.id === collectionId)
      const remainingCollections = current.collections.filter((collection) => collection.id !== collectionId)

      if (!deletedCollection) {
        return current
      }

      const assignedSourceIds = new Set(remainingCollections.flatMap((collection) => collection.sourceIds))
      const unassignedSourceIds = deletedCollection.sourceIds.filter((sourceId) => !assignedSourceIds.has(sourceId))
      const fallbackCollection = remainingCollections.find((collection) => collection.id === 'general') ?? remainingCollections[0]

      if (!fallbackCollection || !unassignedSourceIds.length) {
        return { ...current, collections: remainingCollections }
      }

      return {
        ...current,
        collections: remainingCollections.map((collection) =>
          collection.id === fallbackCollection.id
            ? { ...collection, sourceIds: uniq([...collection.sourceIds, ...unassignedSourceIds]) }
            : collection,
        ),
      }
    })
  }, [editable])

  const addSourcesToCollection = useCallback((collectionId: string, sourceIds: string[]) => {
    if (!editable) {
      return
    }

    const validSourceIds = sourceIds.filter((sourceId) => sourceById.has(sourceId))

    if (!validSourceIds.length) {
      return
    }

    setState((current) => ({
      ...current,
      collections: current.collections.map((collection) =>
        collection.id === collectionId
          ? { ...collection, sourceIds: uniq([...collection.sourceIds, ...validSourceIds]) }
          : collection,
      ),
    }))
  }, [editable, sourceById])

  const removeSourceFromCollection = useCallback((collectionId: string, sourceId: string) => {
    if (!editable) {
      return
    }

    setState((current) => {
      const nextState = {
        ...current,
        collections: current.collections.map((collection) =>
          collection.id === collectionId
            ? { ...collection, sourceIds: collection.sourceIds.filter((item) => item !== sourceId) }
            : collection,
        ),
      }

      return ensureSourceHasCollection(nextState, sourceId)
    })
  }, [editable])

  const moveSourceToCollection = useCallback((sourceId: string, fromCollectionId: string, toCollectionId: string, beforeSourceId?: string) => {
    if (!editable) {
      return
    }

    if (!sourceById.has(sourceId)) {
      return
    }

    setState((current) => {
      const targetCollection = current.collections.find((collection) => collection.id === toCollectionId)

      if (!targetCollection) {
        return current
      }

      return {
        ...current,
        collections: current.collections.map((collection) => {
          if (collection.id !== fromCollectionId && collection.id !== toCollectionId) {
            return collection
          }

          const withoutMovedSource = collection.sourceIds.filter((item) => item !== sourceId)

          if (collection.id === fromCollectionId && collection.id !== toCollectionId) {
            return {
              ...collection,
              sourceIds: withoutMovedSource,
            }
          }

          if (collection.id === toCollectionId) {
            const targetIndex =
              beforeSourceId && beforeSourceId !== sourceId
                ? withoutMovedSource.findIndex((item) => item === beforeSourceId)
                : -1
            const nextSourceIds =
              targetIndex >= 0
                ? [
                    ...withoutMovedSource.slice(0, targetIndex),
                    sourceId,
                    ...withoutMovedSource.slice(targetIndex),
                  ]
                : [...withoutMovedSource, sourceId]

            return {
              ...collection,
              sourceIds: nextSourceIds,
            }
          }

          return collection
        }),
      }
    })
  }, [editable, sourceById])

  const renameSource = useCallback((sourceId: string, name: string) => {
    if (!editable) {
      return
    }

    const normalizedName = normalizeSourceCollectionName(name)

    setState((current) => {
      const nextAliases = { ...current.sourceAliases }
      const defaultName = sourceById.get(sourceId)?.label

      if (!normalizedName || normalizedName === defaultName) {
        delete nextAliases[sourceId]
      } else {
        nextAliases[sourceId] = normalizedName
      }

      return {
        ...current,
        sourceAliases: nextAliases,
      }
    })
  }, [editable, sourceById])

  const resetCollections = useCallback(() => {
    setState(defaultState)
  }, [defaultState])

  return {
    collections: state.collections,
    sources,
    sourceAliases: state.sourceAliases,
    actions: {
      addSourcesToCollection,
      createCollection,
      deleteCollection,
      moveSourceToCollection,
      removeSourceFromCollection,
      renameCollection,
      renameSource,
      resetCollections,
    },
  }
}
