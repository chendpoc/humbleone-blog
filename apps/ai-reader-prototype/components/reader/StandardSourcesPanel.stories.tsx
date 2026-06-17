import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { dailyBrief } from '../../lib/prototype-data'
import { StandardSourcesPanel } from './StandardSourcesPanel'
import { buildSources } from './standardReaderModel'

const sources = buildSources(dailyBrief)
const activeSources = sources.filter((source) => source.active).length

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
    sources,
    activeSources,
    selectedSourceId: sources[0].feedSourceId,
    onCollapse: () => undefined,
    onSelectSource: () => undefined,
  },
} satisfies Meta<typeof StandardSourcesPanel>

export default meta

type Story = StoryObj<typeof meta>

export const SelectedSource: Story = {}
