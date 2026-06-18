import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { StandardFeedPanel } from './StandardFeedPanel'
import { StandardReaderStoryFrame } from './StandardReaderStoryFrame'
import { storyArticles } from './readerStoryFixtures'

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
    articles: storyArticles,
    selectedArticleId: storyArticles[0].id,
    selectedCategory: 'All',
    selectedSourceId: null,
    onSelectArticle: () => undefined,
    onSelectCategory: () => undefined,
    onClearSource: () => undefined,
  },
  decorators: [
    (Story) => (
      <StandardReaderStoryFrame width={620}>
        <Story />
      </StandardReaderStoryFrame>
    ),
  ],
} satisfies Meta<typeof StandardFeedPanel>

export default meta

type Story = StoryObj<typeof meta>

export const SelectedArticle: Story = {}

export const SourceFiltered: Story = {
  args: {
    selectedSourceId: storyArticles[0].sourceId,
  },
}

export const SavedWithActionNotice: Story = {
  args: {
    savedArticleIds: new Set([storyArticles[0].id, storyArticles[4].id]),
    actionNotice: {
      articleId: storyArticles[0].id,
      label: 'Saved',
      tone: 'positive',
    },
  },
}

export const EmptyState: Story = {
  args: {
    articles: [],
    selectedSourceId: 'source-anthropic-engineering',
    selectedCategory: 'Research',
  },
}
