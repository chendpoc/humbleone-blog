import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { StandardArticlePanel } from './StandardArticlePanel'
import { StandardReaderStoryFrame } from './StandardReaderStoryFrame'
import { storyArticles, storyRelatedArticles, storySelectedArticle } from './readerStoryFixtures'

const meta = {
  title: 'AI Reader/Standard Article Panel',
  component: StandardArticlePanel,
  parameters: {
    layout: 'fullscreen',
    backgrounds: {
      default: 'standard',
    },
  },
  args: {
    article: storySelectedArticle,
    feedback: null,
    onClose: () => undefined,
    onFeedback: () => undefined,
  },
  decorators: [
    (Story) => (
      <StandardReaderStoryFrame align="right" width={420}>
        <Story />
      </StandardReaderStoryFrame>
    ),
  ],
} satisfies Meta<typeof StandardArticlePanel>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const HelpfulFeedback: Story = {
  args: {
    feedback: 'helpful',
  },
}

export const CopiedWithRelatedStories: Story = {
  args: {
    copyStatus: 'copied',
    relatedOpen: true,
    relatedArticles: storyRelatedArticles,
  },
}
