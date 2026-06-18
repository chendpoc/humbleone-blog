import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { StandardReaderStoryFrame } from './StandardReaderStoryFrame'
import { StandardTopBar } from './StandardTopBar'
import { storyBrief } from './readerStoryFixtures'

const meta = {
  title: 'AI Reader/Standard Top Bar',
  component: StandardTopBar,
  parameters: {
    layout: 'fullscreen',
    backgrounds: {
      default: 'standard',
    },
  },
  args: {
    brief: storyBrief,
    feedCount: 5,
    resultCount: 6,
    searchQuery: '',
    onSearchQueryChange: () => undefined,
  },
  decorators: [
    (Story) => (
      <StandardReaderStoryFrame>
        <Story />
      </StandardReaderStoryFrame>
    ),
  ],
} satisfies Meta<typeof StandardTopBar>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const Searching: Story = {
  args: {
    resultCount: 2,
    searchQuery: 'claude code',
  },
}
