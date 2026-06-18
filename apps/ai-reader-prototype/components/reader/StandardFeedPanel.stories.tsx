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
    selectedSourceId: null,
    unreadCount: storyArticles.length,
    onSelectArticle: () => undefined,
    onClearSource: () => undefined,
    onMarkAllRead: () => undefined,
    onRefreshFeed: () => undefined,
    onToggleUnreadOnly: () => undefined,
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
    readArticleIds: new Set([storyArticles[2].id]),
    savedArticleIds: new Set([storyArticles[0].id, storyArticles[4].id]),
    favoritedArticleIds: new Set([storyArticles[1].id]),
    actionNotice: {
      articleId: storyArticles[0].id,
      label: 'Saved for later',
      tone: 'positive',
    },
  },
}

export const UnreadOnly: Story = {
  args: {
    showUnreadOnly: true,
    unreadCount: 3,
    readArticleIds: new Set([storyArticles[0].id, storyArticles[1].id, storyArticles[2].id]),
    feedNotice: 'Marked 3 items as read',
  },
}

export const EmptyState: Story = {
  args: {
    articles: [],
    selectedSourceId: 'source-anthropic-engineering',
    unreadCount: 0,
  },
}
