import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { dailyBrief } from '../../lib/prototype-data'
import { StandardFeedPanel } from './StandardFeedPanel'
import { flattenArticles } from './standardReaderModel'

const articles = flattenArticles(dailyBrief)

const meta = {
  title: 'AI Reader/Standard Feed Panel',
  component: StandardFeedPanel,
  parameters: {
    layout: 'fullscreen',
    backgrounds: {
      default: 'standard',
    },
  },
  args: {
    articles,
    selectedArticleId: articles[0].id,
    selectedCategory: 'All',
    selectedSourceId: null,
    onSelectArticle: () => undefined,
    onSelectCategory: () => undefined,
    onClearSource: () => undefined,
  },
} satisfies Meta<typeof StandardFeedPanel>

export default meta

type Story = StoryObj<typeof meta>

export const SelectedArticle: Story = {}

export const SourceFiltered: Story = {
  args: {
    selectedSourceId: articles[0].sourceId,
  },
}

export const EmptyState: Story = {
  args: {
    articles: [],
    selectedSourceId: 'source-anthropic-engineering',
    selectedCategory: 'Research',
  },
}
