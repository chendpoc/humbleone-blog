---
layout: page
title: Source Registry | The Modern Software Developer
date: 2026-06-19
tags:
  - AI-Reader
  - Source-Registry
  - Coding-Agent
  - Course
description: The Modern Software Developer 作为 AI Reader 课程材料型信息源的登记、抓取判断和博客沉淀边界。
---

# Source Registry | The Modern Software Developer

## 结论

[`The Modern Software Developer`](https://themodernsoftware.dev/) 可以加入博客资料层，但不应按普通日报源处理。

它更适合登记为 `course_materials` / `reference_source`：用于支撑专题学习、source registry 公开说明、deep research 证据库和后续长文选题；暂不进入每日 3-8 条信息流的核心自动抓取源。

## Source Registry Entry

```yaml
source_id: modern-software-dev
display_name: The Modern Software Developer
source_family: course_materials
topic_tags:
  - coding-agent
  - ai-engineering
  - mcp
  - claude-code
  - context-engineering
  - ai-security
  - ai-code-review
priority: P1
language: en
official_url: https://themodernsoftware.dev/
fetch_method: manual
adapter: manual_material_index
update_frequency: course_schedule_or_manual_review
evidence_level: primary_site
default_column: 案例
why_follow: >
  这个站点把 coding LLM、agent 架构、MCP、AI IDE、Claude Code、现代终端、
  AI 测试安全、AI code review、自动化 UI / app building、post-deployment agents
  串成一条课程路径。它不是新闻流，但很适合作为 AI Reader 的学习路线和专题证据库。
risk_notes:
  - 未确认存在可用官方 RSS 或 Atom feed。
  - 课程页面、slides、assignment 不应全文复制到博客。
  - 博客只能沉淀自己的中文摘要、主题索引、阅读路径和公开链接。
```

## 内容价值

这个源的价值不在“每天更新”，而在它提供了一条较完整的现代软件开发学习路径：

- 从 coding LLM 和 prompt 基础进入 AI 辅助开发。
- 解释 coding agent 的组成、MCP、工具调用和 agent 架构。
- 覆盖 AI IDE、上下文管理、PRD / spec 驱动开发和 agent 协作方式。
- 把 Claude Code、Warp、Semgrep、Graphite、Vercel、Resolve 等实际产品放进课程上下文。
- 把安全、测试、code review、on-call / support 等生产工程问题纳入 AI 软件工程讨论。

这类内容适合进入：

- `notes/07-source-registry/`：公开说明为什么关注这个源。
- `notes/05-ai-information-reader/`：作为 source registry / deep research 的设计样例。
- `posts/`：后续扩展成中文学习路线或专题文章。
- Deep Research：围绕 MCP、context engineering、Claude Code 工作流、AI 安全等主题组织证据。

## 抓取判断

2026-06-19 检查结果：

- 主页可访问，页面标题指向 Stanford CS146S 课程站点。
- 常见 `/feed.xml`、`/rss.xml`、`/atom.xml`、`/sitemap.xml`、`/robots.txt` 路径返回的是同一个 HTML 应用壳，不是可直接消费的 feed。
- 课程内容主要在前端静态资源中渲染，当前更适合人工索引或后续做轻量 custom scraper。

因此 v0.1 推荐：

1. 先用 `manual` 方式登记为资料型来源。
2. 每次只把高价值主题链接和自己的中文判断写入公开笔记。
3. 如果后续要自动化，新增 `custom_scrape` adapter，抓取公开课程 schedule 和外链，不抓取或再分发受限材料。

## 博客沉淀边界

可以写入博客的内容：

- 中文主题索引。
- 每个主题为什么值得关注。
- 公开原文链接。
- 自己的摘要、学习路线、工程判断和后续问题。
- 与 AI Reader source registry / feed hub / research workspace 的关系。

不要写入博客的内容：

- 课程 slides 或 assignments 的全文。
- 大段原文摘抄。
- 需要登录、课堂权限或私人访问的材料。
- 未验证来源的二手转述。

## 可沉淀选题

优先选题：

1. `现代 Coding Agent 学习路线：从 LLM prompt 到 MCP、Claude Code 与生产安全`
2. `为什么 AI Reader 需要 course_materials 这种资料型来源`
3. `从 CS146S 看 AI 软件工程课程如何组织 agent、IDE、终端、安全和 review`
4. `MCP / context engineering / Claude Code 的学习材料索引`

## Reader 使用方式

在 Reader App 中，这个源应该表现为：

- Source Desk：一叠课程索引卡，而不是每日新闻 slip。
- Today Timeline：只在课程新增重要材料或被某次 deep research 引用时出现。
- Newspaper Reader：适合 `Feature` 或 `Retro Dispatch` skin，用作学习路线和研究 dispatch。
- Research：作为高优先级 seed source，帮助生成主题证据列表。

