import type { SourcePanelPreferences, StandardArticle } from '../types/reader'

const savedArticlesStorageKey = 'humbleone.ai-reader.standard.savedArticles.v1'
const sourcePanelStorageKey = 'humbleone.ai-reader.standard.sourcePanel.v1'

const defaultSourcePanelPreferences: SourcePanelPreferences = {
  activeOnly: false,
  collapsedGroups: [],
}

export function readSavedArticleIds(articles: StandardArticle[]) {
  const seededIds = articles.filter((article) => article.status === 'saved').map((article) => article.id)
  const storedValue = readJson<unknown>(savedArticlesStorageKey)
  const storedIds = Array.isArray(storedValue)
    ? storedValue.filter((item): item is string => typeof item === 'string')
    : null
  const validArticleIds = new Set(articles.map((article) => article.id))
  const sourceIds = storedIds ?? seededIds

  return new Set(sourceIds.filter((id) => validArticleIds.has(id)))
}

export function writeSavedArticleIds(articleIds: Set<string>) {
  writeJson(savedArticlesStorageKey, [...articleIds])
}

export function readSourcePanelPreferences(validGroups: string[]) {
  const stored = readJson<Partial<SourcePanelPreferences>>(sourcePanelStorageKey)
  const validGroupNames = new Set(validGroups)

  return {
    activeOnly: typeof stored?.activeOnly === 'boolean' ? stored.activeOnly : defaultSourcePanelPreferences.activeOnly,
    collapsedGroups: Array.isArray(stored?.collapsedGroups)
      ? stored.collapsedGroups.filter((group) => validGroupNames.has(group))
      : defaultSourcePanelPreferences.collapsedGroups,
  }
}

export function writeSourcePanelPreferences(preferences: SourcePanelPreferences) {
  writeJson(sourcePanelStorageKey, preferences)
}

function readJson<T>(key: string): T | null {
  if (typeof window === 'undefined') {
    return null
  }

  try {
    const raw = window.localStorage.getItem(key)

    return raw ? (JSON.parse(raw) as T) : null
  } catch {
    return null
  }
}

function writeJson(key: string, value: unknown) {
  if (typeof window === 'undefined') {
    return
  }

  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Non-critical prototype state should not interrupt reading.
  }
}
