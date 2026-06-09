# HumbleOne Chen

个人学习博客，基于 VitePress 和 `clark-cui/vitepress-blog-zaun` 源码模板改造。

线上地址计划为：

```text
https://Facefall.github.io/humbleone-blog/
```

## 环境要求

必须先切换 Node 版本：

```powershell
nvm use
node -v
```

期望版本为 `v24.14.0` 或兼容的 `24.14.0+`。项目使用 `pnpm@9.15.5`。

## 本地启动

```powershell
pnpm install
pnpm dev
```

构建和预览：

```powershell
pnpm build
pnpm serve
```

## 写作目录

- `posts/**/*.md`：文章，参与首页文章列表、归档和 RSS。
- `notes/**/*.md`：学习笔记，参与笔记侧栏和大纲。
- `about.md`：关于页。

文章 frontmatter 示例：

```md
---
title: 文章标题
date: 2026-06-09
tags:
  - learning
description: 一句话摘要
---
```

## 评论

评论使用 Giscus，数据保存在 `Facefall/humbleone-blog` 的 GitHub Discussions 中，分类为 `General`。

创建仓库后需要：

1. 在仓库设置中启用 Discussions。
2. 安装或授权 Giscus App。
3. 回填 `.vitepress/config.ts` 中的 `repoId` 和 `categoryId`。

评论只在文章和笔记页面显示。

## 部署

GitHub Actions 使用 `.github/workflows/pages.yml` 构建并发布 GitHub Pages。

部署设置：

- Repository visibility: public
- Pages source: GitHub Actions
- Build output: `.vitepress/dist`

## Attribution

This site is based on the MIT-licensed package metadata from `clark-cui/vitepress-blog-zaun`.
