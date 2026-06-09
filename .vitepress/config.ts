import { defineConfig } from 'vitepress'
import { transformerTwoslash } from '@shikijs/vitepress-twoslash'
import mathjax3 from 'markdown-it-mathjax3'
import { getPosts, getNotesSidebar } from './theme/serverUtils'
import { buildBlogRSS } from './theme/rss'
import type { Post, NoteCategory } from './theme/serverUtils'

interface BlogThemeConfig {
  logo: string
  avator: string
  search: { provider: string }
  docsDir: string
  posts: Post[]
  pageSize: number
  postLength: number
  notesSidebar: NoteCategory[]
  nav: any[]
  socialLinks: any[]
  aside: boolean
  showFireworksAnimation: boolean
  giscus: {
    repo: string
    repoId: string
    category: string
    categoryId: string
  }
}

const RSS_ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20">
  <path fill="currentColor" d="M6.18 15.64a2.18 2.18 0 0 1 2.18 2.18C8.36 19.01 7.38 20 6.18 20C4.98 20 4 19.01 4 17.82a2.18 2.18 0 0 1 2.18-2.18M4 4.44A15.56 15.56 0 0 1 19.56 20h-2.83A12.73 12.73 0 0 0 4 7.27V4.44m0 5.66a9.9 9.9 0 0 1 9.9 9.9h-2.83A7.07 7.07 0 0 0 4 12.93V10.1Z"/>
</svg>`

const SITE_BASE = '/humbleone-blog/'
const SITE_URL = 'https://facefall.github.io/humbleone-blog/'

export default async () => {
  const [posts, notesSidebar] = await Promise.all([
    getPosts(),
    getNotesSidebar(),
  ])

  const themeConfig: BlogThemeConfig = {
    logo: '/humbleone.svg',
    avator: '/humbleone.svg',
    search: { provider: 'local' },
    docsDir: '/',
    posts,
    pageSize: 5,
    postLength: posts.length,
    notesSidebar,
    nav: [
      { text: '首页', link: '/' },
      { text: '文章', link: '/blogs/' },
      { text: '笔记', link: notesSidebar[0]?.items[0]?.path ?? '/notes/' },
      { text: '归档', link: '/archives' },
      { text: '关于', link: '/about' },
    ],
    socialLinks: [
      { icon: 'github', link: 'https://github.com/Facefall/humbleone-blog', ariaLabel: 'GitHub' },
      { icon: { svg: RSS_ICON_SVG }, link: `${SITE_URL}feed.xml`, ariaLabel: 'RSS' },
    ],
    aside: false,
    showFireworksAnimation: false,
    giscus: {
      repo: 'Facefall/humbleone-blog',
      repoId: 'R_kgDOS1Zykg',
      category: 'General',
      categoryId: 'DIC_kwDOS1Zyks4C-0t_',
    },
  }

  return defineConfig({
    lang: 'zh-CN',
    title: 'HumbleOne Chen',
    description: 'HumbleOne Chen 的个人学习博客。',
    base: SITE_BASE,
    cleanUrls: false,
    srcExclude: ['README.md', 'AGENTS.md'],
    head: [
      ['link', { rel: 'icon', type: 'image/svg+xml', href: `${SITE_BASE}humbleone.svg` }],
      ['meta', { name: 'author', content: 'HumbleOne Chen' }],
      ['meta', { property: 'og:title', content: 'HumbleOne Chen' }],
      ['meta', { property: 'og:description', content: '个人学习、技术笔记与长期思考。' }],
      ['meta', { property: 'og:url', content: SITE_URL }],
    ],
    lastUpdated: false,
    themeConfig: themeConfig as any,
    buildEnd: buildBlogRSS,
    markdown: {
      theme: {
        light: 'vitesse-light',
        dark: 'vitesse-dark',
      },
      codeTransformers: [transformerTwoslash() as any],
      config: (md) => {
        md.use(mathjax3)

        const defaultFence = md.renderer.rules.fence!.bind(md.renderer.rules)
        md.renderer.rules.fence = (tokens, idx, options, env, self) => {
          const token = tokens[idx]
          if (token.info.trim() === 'mermaid') {
            return `<pre class="mermaid">${md.utils.escapeHtml(token.content)}</pre>`
          }
          return defaultFence(tokens, idx, options, env, self)
        }
      },
    },
  })
}
