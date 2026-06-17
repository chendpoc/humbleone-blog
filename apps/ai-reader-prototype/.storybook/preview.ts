import type { Preview } from '@storybook/nextjs-vite'

import '../app/globals.css'

const preview: Preview = {
  parameters: {
    nextjs: {
      appDirectory: true,
    },
    layout: 'centered',
    backgrounds: {
      default: 'standard',
      values: [
        { name: 'standard', value: '#0c0c0c' },
        { name: 'desk', value: '#1b100c' },
        { name: 'paper', value: '#ead6b9' },
      ],
    },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
}

export default preview
