'use client'

import { useEffect, useState } from 'react'
import { readSourcePanelPreferences, writeSourcePanelPreferences } from '../services/standardReaderStorage'

export function useSourcePanelPreferences(groupNames: string[]) {
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set())
  const [showActiveOnly, setShowActiveOnly] = useState(false)
  const [preferencesHydrated, setPreferencesHydrated] = useState(false)

  useEffect(() => {
    const preferences = readSourcePanelPreferences(groupNames)

    setCollapsedGroups(new Set(preferences.collapsedGroups))
    setShowActiveOnly(preferences.activeOnly)
    setPreferencesHydrated(true)
  }, [groupNames])

  useEffect(() => {
    if (!preferencesHydrated) {
      return
    }

    writeSourcePanelPreferences({
      activeOnly: showActiveOnly,
      collapsedGroups: [...collapsedGroups],
    })
  }, [collapsedGroups, preferencesHydrated, showActiveOnly])

  function toggleGroup(category: string) {
    setCollapsedGroups((current) => {
      const nextGroups = new Set(current)

      if (nextGroups.has(category)) {
        nextGroups.delete(category)
        return nextGroups
      }

      nextGroups.add(category)
      return nextGroups
    })
  }

  function collapseAllGroups() {
    setCollapsedGroups(new Set(groupNames))
  }

  function expandAllGroups() {
    setCollapsedGroups(new Set())
  }

  return {
    collapsedGroups,
    showActiveOnly,
    actions: {
      collapseAllGroups,
      expandAllGroups,
      setShowActiveOnly,
      toggleGroup,
    },
  }
}
