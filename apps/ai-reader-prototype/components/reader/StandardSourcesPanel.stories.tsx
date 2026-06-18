import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { StandardReaderStoryFrame } from './StandardReaderStoryFrame'
import { StandardSourcesPanel } from './StandardSourcesPanel'
import { storyActiveSources, storySources } from './readerStoryFixtures'

const meta = {
  title: 'AI Reader/Standard Sources Panel',
  component: StandardSourcesPanel,
  parameters: {
    layout: 'fullscreen',
    backgrounds: {
      default: 'standard',
    },
  },
  args: {
    sources: storySources,
    activeSources: storyActiveSources,
    selectedSourceId: storySources[0].feedSourceId,
    onCollapse: () => undefined,
    onSelectSource: () => undefined,
  },
  decorators: [
    (Story) => (
      <StandardReaderStoryFrame width={280}>
        <Story />
      </StandardReaderStoryFrame>
    ),
  ],
} satisfies Meta<typeof StandardSourcesPanel>

export default meta

type Story = StoryObj<typeof meta>

export const SelectedSource: Story = {}

export const QuickAccessOverview: Story = {
  args: {
    selectedSourceId: null,
  },
}

export const FailedSourceProfile: Story = {
  args: {
    selectedSourceId: 'source-old-rsshub-route',
  },
}
