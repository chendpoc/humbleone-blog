import type { StorybookConfig } from '@storybook/nextjs-vite'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const storybookDir = path.dirname(fileURLToPath(import.meta.url))
const appDir = path.resolve(storybookDir, '..')

const config: StorybookConfig = {
  stories: ['../components/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
  staticDirs: ['../public'],
  addons: ['@storybook/addon-docs', '@storybook/addon-a11y'],
  framework: {
    name: '@storybook/nextjs-vite',
    options: {},
  },
  viteFinal: async (viteConfig) => {
    viteConfig.resolve ??= {}
    viteConfig.resolve.alias = {
      ...viteConfig.resolve.alias,
      'use-sync-external-store/shim/index.js': path.resolve(
        appDir,
        'node_modules/use-sync-external-store/shim/index.js',
      ),
    }

    return viteConfig
  },
}

export default config
