import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { StandardReaderPrototype } from './StandardReaderPrototype'
import { storyBrief } from './readerStoryFixtures'

const meta = {
  title: 'AI Reader/Standard Reader',
  component: StandardReaderPrototype,
  parameters: {
    layout: 'fullscreen',
    backgrounds: {
      default: 'standard',
    },
  },
} satisfies Meta<typeof StandardReaderPrototype>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    brief: storyBrief,
  },
}

export const InteractionSandbox: Story = {
  args: {
    brief: storyBrief,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Standard reader with draggable left and right separators, source filtering, category tabs, article selection, search, and feedback buttons.',
      },
    },
  },
}

export const FilteredDeepLink: Story = {
  args: {
    brief: storyBrief,
    initialState: {
      selectedCategory: 'AI Labs',
      selectedArticleId: 'item-anthropic-engineering-claude-code-agent-interface',
      selectedSourceId: 'source-anthropic-engineering',
      searchQuery: 'claude',
    },
  },
  parameters: {
    docs: {
      description: {
        story:
          'Reader booted from a deep-link style state: search query, category, source, and selected article are all preselected.',
      },
    },
  },
}
