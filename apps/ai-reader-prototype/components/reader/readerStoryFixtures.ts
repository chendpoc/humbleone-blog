import { dailyBrief } from '../../lib/prototype-data'
import { buildSources, flattenArticles } from '../../utils/standardReaderModel'

export const storyBrief = dailyBrief
export const storyArticles = flattenArticles(storyBrief)
export const storySources = buildSources(storyBrief)
export const storyActiveSources = storySources.filter((source) => source.active).length
export const storySelectedArticle = storyArticles[0]
export const storyRelatedArticles = storyArticles.slice(1, 4)
