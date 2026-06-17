import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { dailyBrief } from '../../lib/prototype-data'
import { StandardReaderPrototype } from './StandardReaderPrototype'

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
    brief: dailyBrief,
  },
}

export const InteractionSandbox: Story = {
  args: {
    brief: dailyBrief,
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
