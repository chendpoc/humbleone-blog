---
layout: page
title: AI Reader 后端数据存储架构
date: 2026-06-18
tags:
  - AI-Reader
  - Backend
  - SQLite
  - RSSHub
  - Feed-Hub
description: AI 信息阅读器 v0.1 后端数据存储、RSSHub 抓取、刷新链路和状态持久化设计。
---

# AI Reader 后端数据存储架构

## 1. 结论

v0.1 采用：

> SQLite-first + DB 驱动页面 + RSSHub 写穿刷新 + Source Registry 配置为源头。

核心链路：

```text
Reader Page
  -> Reader API
  -> SQLite read query

Refresh / Scheduler
  -> RSSHub.request(route)
  -> raw feed item
  -> normalize / dedupe
  -> upsert SQLite
  -> query latest DB view
  -> return page data
```

关键原则：

1. 页面默认只读 DB。
2. 手动刷新可以实时调用后端 endpoint。
3. 手动刷新必须经过 `RSSHub -> normalize -> upsert DB -> query DB -> return page`。
4. RSSHub 原始数据不直接成为页面状态。
5. 信息源长期保存，只通过 filter 控制展示范围。
6. `read / saved / favorited / archived / bookmarks / saved_views` 全部入库。
7. v0.1 不做完整 feed versioning、不做复杂队列、不做独立 RSSHub service、不承诺真正全文搜索。

## 2. 背景与目标

当前 Reader App 已经完成第一个 RSSHub tracer bullet：后端可以通过 `rsshub` package 请求 route，并把结果归一化成 `DailyBrief`。

但实时请求 RSSHub 不能成为页面默认读路径。原因：

- 页面加载会被外部 route 的延迟、失败、反爬和超时影响。
- 收藏、保存、已读、归档、书签和 saved view 都需要持久状态。
- 信息源列表需要长期保存，不能只显示当前 RSSHub 返回的数据。
- 用户希望按最近几天、一周内、未读、保存、source、topic 等 filter 查看内容。

v0.1 的目标不是构建通用 RSS 平台，而是完成个人 AI / coding-agent 信息阅读闭环：

```text
订阅源配置 -> 定时/手动抓取 -> 入库去重 -> 页面过滤阅读 -> 保存/收藏/书签 -> 日报编排
```

## 3. 范围

### 3.1 v0.1 必须做

- SQLite 持久化。
- Source Registry 配置同步到 DB。
- RSSHub endpoint 存储模型。
- 定时抓取需要的 endpoint 状态字段。
- 单 endpoint 手动刷新。
- 页面 API 从 DB 读取 feed list / source list / selected item。
- `read / saved / favorited / archived` item 状态。
- `bookmark` 和 `saved_view`。
- source list 长期保存，并支持时间范围和状态 filter。
- fetch run 记录：成功、失败、耗时、错误、新增、更新、未变。
- raw item 保存，便于 debug 和重新 normalize。
- normalized feed item upsert。
- 最小内容搜索字段预留。

### 3.2 v0.1 暂不做

- 多用户账号系统。
- 复杂 job queue。
- 独立 RSSHub service/container。
- 完整 feed item version history。
- 全文抓取和真正全文搜索。
- Meilisearch / Typesense。
- Postgres。
- 多设备同步。
- 新增订阅源 UI。
- Folo Discover 式 URL 自动识别导入。
- 公开部署许可证处理。

### 3.3 v0.2 再考虑

- `feed_item_versions`。
- `daily_briefs` 固化。
- SQLite FTS5 内容搜索。
- refresh job 表和 job 状态轮询。
- 独立 worker process。
- source health dashboard。
- RSSHub 独立进程或 service。

## 4. 系统数据流

```mermaid
flowchart LR
  A[Source Registry Config] --> B[Registry Sync]
  B --> C[(source_families / source_endpoints)]
  C --> D[Scheduler]
  C --> E[Manual Refresh Endpoint]
  D --> F[Adapter Layer]
  E --> F
  F --> G[RSSHub.request(route)]
  G --> H[(fetch_runs)]
  G --> I[(raw_feed_items)]
  I --> J[Normalizer]
  J --> K[Dedupe / Upsert]
  K --> L[(feed_items)]
  L --> M[(item_states)]
  L --> N[Reader Query]
  M --> N
  N --> O[Reader API]
  O --> P[Reader Page]
```

## 5. Source Registry 与 DB 的关系

### 5.1 Source Registry 是定义源头

Source Registry 继续由项目配置维护。它回答：

- 订阅谁。
- 为什么订阅。
- 属于哪个 source family。
- 使用哪个 adapter。
- RSSHub route 是什么。
- 抓取频率是什么。
- 重要级别是什么。
- 默认内容类型和栏目是什么。

### 5.2 DB 是运行态镜像

DB 保存：

- 当前生效的 source family / endpoint 镜像。
- 抓取状态。
- 抓取历史。
- 原始 item。
- 归一化 item。
- 用户阅读状态。
- filter / bookmark / saved view。

规则：

```text
配置决定 source 定义。
DB 保存运行状态和历史。
配置删除 source 时，DB 只软删除 source，不删除历史 item。
```

### 5.3 信息源不因 filter 删除

source list 永久保存。页面展示只是查询视图。

示例 filter：

- 全部 source。
- 最近 24 小时有更新。
- 最近 3 天有更新。
- 最近 7 天有更新。
- 只看 failed / stale source。
- 只看 critical / high priority source。
- 只看文章 / 社交媒体 / 图片 / 视频。
- 只看收藏或保存过内容的 source。

## 6. v0.1 SQLite Schema

### 6.1 `source_families`

订阅对象，例如 Anthropic、Claude Code、Cursor、Waylandz。

```sql
CREATE TABLE source_families (
  id TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  source_family TEXT NOT NULL,
  priority TEXT NOT NULL,
  language TEXT NOT NULL,
  official_url TEXT,
  why_follow TEXT NOT NULL,
  risk_notes TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
```

`status`：

- `active`
- `paused`
- `deprecated`

### 6.2 `source_endpoints`

具体抓取入口。RSSHub route 是 endpoint 的一种 adapter 配置。

```sql
CREATE TABLE source_endpoints (
  id TEXT PRIMARY KEY,
  source_family_id TEXT NOT NULL REFERENCES source_families(id),
  label TEXT NOT NULL,
  adapter_type TEXT NOT NULL,
  rsshub_route TEXT,
  source_url TEXT,
  default_section TEXT NOT NULL,
  content_type TEXT NOT NULL,
  polling_interval_minutes INTEGER NOT NULL,
  priority TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  last_success_at TEXT,
  last_failure_at TEXT,
  failure_count INTEGER NOT NULL DEFAULT 0,
  last_error_message TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
```

`adapter_type`：

- `rsshub`
- `official_rss`
- `official_api`
- `github_feed`
- `github_api`
- `custom_scrape`

约束：

```sql
CREATE UNIQUE INDEX idx_source_endpoints_rsshub_route
ON source_endpoints(rsshub_route)
WHERE rsshub_route IS NOT NULL;
```

### 6.3 `fetch_runs`

每次抓取记录。用于 source health、debug 和刷新反馈。

```sql
CREATE TABLE fetch_runs (
  id TEXT PRIMARY KEY,
  endpoint_id TEXT NOT NULL REFERENCES source_endpoints(id),
  trigger_type TEXT NOT NULL,
  status TEXT NOT NULL,
  started_at TEXT NOT NULL,
  finished_at TEXT,
  duration_ms INTEGER,
  inserted_count INTEGER NOT NULL DEFAULT 0,
  updated_count INTEGER NOT NULL DEFAULT 0,
  unchanged_count INTEGER NOT NULL DEFAULT 0,
  failed_count INTEGER NOT NULL DEFAULT 0,
  error_message TEXT
);
```

`trigger_type`：

- `scheduled`
- `manual`
- `bootstrap`
- `debug`

`status`：

- `running`
- `success`
- `partial`
- `failed`

### 6.4 `raw_feed_items`

保存 RSSHub/API 原始 item。它不是页面展示对象。

```sql
CREATE TABLE raw_feed_items (
  id TEXT PRIMARY KEY,
  fetch_run_id TEXT NOT NULL REFERENCES fetch_runs(id),
  endpoint_id TEXT NOT NULL REFERENCES source_endpoints(id),
  external_id TEXT,
  guid TEXT,
  link TEXT,
  title TEXT,
  published_at TEXT,
  raw_payload_json TEXT NOT NULL,
  raw_hash TEXT NOT NULL,
  created_at TEXT NOT NULL
);
```

约束：

```sql
CREATE UNIQUE INDEX idx_raw_feed_items_endpoint_hash
ON raw_feed_items(endpoint_id, raw_hash);
```

### 6.5 `feed_items`

页面主要内容对象。

```sql
CREATE TABLE feed_items (
  id TEXT PRIMARY KEY,
  source_family_id TEXT NOT NULL REFERENCES source_families(id),
  endpoint_id TEXT NOT NULL REFERENCES source_endpoints(id),
  raw_item_id TEXT REFERENCES raw_feed_items(id),
  external_id TEXT,
  guid TEXT,
  canonical_url TEXT,
  title TEXT NOT NULL,
  title_zh TEXT,
  author TEXT,
  summary TEXT,
  raw_excerpt TEXT,
  content_text TEXT,
  published_at TEXT,
  first_seen_at TEXT NOT NULL,
  last_seen_at TEXT NOT NULL,
  content_hash TEXT NOT NULL,
  language TEXT NOT NULL,
  default_section TEXT NOT NULL,
  content_type TEXT NOT NULL,
  importance_score INTEGER NOT NULL DEFAULT 50,
  novelty_score INTEGER NOT NULL DEFAULT 50,
  evidence_level TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
```

建议索引：

```sql
CREATE INDEX idx_feed_items_published_at ON feed_items(published_at);
CREATE INDEX idx_feed_items_endpoint_seen ON feed_items(endpoint_id, last_seen_at);
CREATE INDEX idx_feed_items_source ON feed_items(source_family_id);
CREATE INDEX idx_feed_items_section ON feed_items(default_section);
CREATE INDEX idx_feed_items_content_type ON feed_items(content_type);
```

v0.1 去重优先级：

1. `endpoint_id + guid`
2. `endpoint_id + canonical_url`
3. `endpoint_id + external_id`
4. `endpoint_id + title + published_at`
5. `endpoint_id + content_hash`

### 6.6 `item_states`

用户状态独立保存，刷新内容时不能覆盖。

```sql
CREATE TABLE item_states (
  feed_item_id TEXT PRIMARY KEY REFERENCES feed_items(id),
  read_at TEXT,
  saved_at TEXT,
  favorited_at TEXT,
  archived_at TEXT,
  note TEXT,
  updated_at TEXT NOT NULL
);
```

语义：

| 状态 | 含义 | 生命周期 |
|---|---|---|
| `read_at` | 已读 | 可清空 |
| `saved_at` | 稍后读 / 保存 | 短中期 |
| `favorited_at` | 长期收藏 | 长期 |
| `archived_at` | 从默认列表归档 | 长期 |

### 6.7 `bookmarks`

书签不是文章收藏的同义词。它用于固定入口。

```sql
CREATE TABLE bookmarks (
  id TEXT PRIMARY KEY,
  target_type TEXT NOT NULL,
  target_id TEXT NOT NULL,
  label TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
```

`target_type`：

- `source`
- `topic`
- `search_view`
- `feed_view`

### 6.8 `saved_views`

保存 filter 查询，例如“一周内 Claude Code 未读”。

```sql
CREATE TABLE saved_views (
  id TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  view_type TEXT NOT NULL,
  filter_json TEXT NOT NULL,
  sort_json TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
```

示例：

```json
{
  "range": "7d",
  "sourceFamilyIds": ["source-claude-code-changelog"],
  "state": "unread",
  "contentTypes": ["article"]
}
```

## 7. 页面查询模型

### 7.1 Feed list API

```http
GET /api/feed?range=7d&state=unread&contentType=article
```

返回：

```ts
type FeedListResponse = {
  items: FeedItemView[];
  filters: ActiveFeedFilters;
  sourceHealth: SourceHealthSummary[];
  fetchedAt: string;
};
```

`FeedItemView` 由 DB 查询组合：

```text
feed_items
  + source_families
  + source_endpoints
  + item_states
```

v0.1 不做 materialized read model，先用 service query 或 SQL view 组合。

### 7.2 Source list API

```http
GET /api/sources?updatedWithin=7d&status=active
```

返回长期保存的 source list，并附带运行态字段：

- `last_success_at`
- `last_failure_at`
- `failure_count`
- `health_status`
- `recent_item_count`
- `unread_count`
- `saved_count`

### 7.3 Item state API

```http
POST /api/items/:itemId/state
```

请求：

```ts
type UpdateItemStateRequest = {
  read?: boolean;
  saved?: boolean;
  favorited?: boolean;
  archived?: boolean;
  note?: string | null;
};
```

规则：

- 更新 `item_states`。
- 不修改 `feed_items`。
- 不触发 RSSHub。

## 8. 刷新链路

### 8.1 单 endpoint 手动刷新

适合页面刷新按钮。

```text
POST /api/endpoints/:endpointId/refresh
  -> validate endpoint
  -> acquire endpoint lock
  -> create fetch_run
  -> RSSHub.request(route)
  -> save raw_feed_items
  -> normalize
  -> upsert feed_items
  -> preserve item_states
  -> update source_endpoints health
  -> query current DB filter
  -> return latest page data
```

返回：

```ts
type RefreshEndpointResponse = {
  mode: 'synced';
  fetchRunId: string;
  insertedCount: number;
  updatedCount: number;
  unchangedCount: number;
  failedCount: number;
  items: FeedItemView[];
};
```

### 8.2 全部刷新

v0.1 不建议页面同步刷新全部 source。

可选流程：

```text
POST /api/feed-hub/refresh
  -> run due endpoints sequentially
  -> return summary
```

如果超过 10-20 秒，应改为 v0.2 的 job 模型：

```text
POST /api/feed-hub/refresh
  -> create refresh job
  -> return jobId
  -> GET /api/jobs/:jobId
```

### 8.3 定时刷新

v0.1 可以先用脚本或 Next server 内部 cron-like runner，后续再独立 worker。

规则：

- 定时任务找出 due endpoints。
- 每个 endpoint 独立 fetch run。
- 某个 endpoint 失败不影响其他 endpoint。
- P0 source 失败需要进入 degraded 状态。
- 页面继续显示最后一次成功入库的数据。

## 9. 并发与一致性规则

### 9.1 不在 RSSHub 请求期间打开 DB 长事务

错误做法：

```text
BEGIN
  RSSHub.request(...)
  upsert
COMMIT
```

正确做法：

```text
RSSHub.request(...)
BEGIN
  insert fetch run result
  insert raw items
  upsert feed items
COMMIT
```

### 9.2 endpoint lock

同一 endpoint 同一时间只允许一个 refresh。

如果重复点击刷新：

- 如果已有 refresh 正在运行，返回当前 fetch run 状态。
- 不重复请求 RSSHub。

### 9.3 用户状态优先

后台抓取不能阻塞保存、收藏、归档。

实践规则：

- 用户状态写入事务必须短。
- refresh 批量 upsert 分批提交。
- v0.1 设置 SQLite `busy_timeout`。
- v0.1 开启 WAL。

## 10. 搜索策略

v0.1 只叫“内容搜索”，不叫“全文搜索”。

搜索范围：

- title
- title_zh
- author
- source name
- summary
- raw_excerpt
- content_text
- tags/topic 的后续字段

第一版可以先用 SQL `LIKE` 或简单 search query。

v0.2 再接 SQLite FTS5。

注意：

- FTS5 可作为内置搜索起点。
- 中文分词体验可能不稳定。
- 后续如果内容规模和中文搜索要求变高，再考虑 Meilisearch / Typesense。

## 11. 部署边界

### 11.1 v0.1 适合

- 本地开发。
- 单机部署。
- 个人使用。
- 小规模 source。
- 低并发读写。

### 11.2 v0.1 不适合

- 多用户公开 SaaS。
- serverless 本地文件写入。
- 网络文件系统上的 SQLite WAL。
- 高频实时新闻抓取。
- 大规模全文搜索。

### 11.3 后续迁移路线

| 阶段 | 存储 | 适用 |
|---|---|---|
| v0.1 | SQLite + WAL | 个人版、本地、单机 |
| v0.2 | SQLite + FTS5 + worker | 稳定个人产品 |
| v1 | Postgres / Turso / libSQL | 公开部署、多设备、同步 |
| v1+ | Meilisearch / Typesense | 高质量中文搜索 |

## 12. 风险与缓解

| 风险 | 影响 | 缓解 |
|---|---|---|
| 架构过重 | 拖慢阅读体验验证 | v0.1 控制表数量和功能范围 |
| RSSHub route 慢或失败 | 刷新超时 | 单 endpoint 同步，多 endpoint job 化 |
| RSSHub package 依赖重 | Next API 冷启动或运行复杂 | v0.1 内嵌，v0.2 考虑独立 worker |
| SQLite 写锁竞争 | 保存/收藏卡顿 | WAL、busy_timeout、短事务、endpoint lock |
| Source Registry 与 DB 漂移 | source 状态不一致 | 配置为源头，DB 为运行态镜像，软删除 |
| 去重错误 | 重复或误吞内容 | v0.1 保存 content_hash，v0.2 增加 versions |
| 中文搜索质量差 | 搜索体验弱 | 第一版叫内容搜索，不承诺全文搜索 |
| AGPL 许可证 | 公开部署风险 | v0.1 内部使用，公开前复核 |

## 13. 验收标准

v0.1 后端存储通过标准：

1. 页面刷新后可以从 DB 读取 feed list，不直接依赖 RSSHub 实时返回。
2. 单个 endpoint 手动刷新能调用 RSSHub、写入 DB、返回最新 DB 查询结果。
3. 同一 item 重复刷新不会重复出现在列表。
4. 内容更新时不会覆盖 `read / saved / favorited / archived` 状态。
5. 信息源 list 长期保存，并可按最近 1 天、3 天、7 天过滤。
6. source health 能显示最近成功、最近失败、失败次数和错误摘要。
7. RSSHub route 失败时页面仍显示最后一次成功入库的数据。
8. 收藏、保存、归档、书签和 saved view 关闭页面后仍保留。
9. 私有状态不导出到公开博客 notes。
10. v0.1 不需要实现完整队列、全文搜索和 feed version history。

## 14. 冻结决策

当前冻结：

- v0.1 使用 SQLite。
- 页面默认读 DB。
- 单 endpoint 手动刷新走 write-through refresh。
- Source Registry 配置是 source-of-truth。
- DB 保存 source runtime state。
- 信息源长期保存，通过 filter 展示。
- 用户状态独立存储，不被内容刷新覆盖。
- RSSHub 是 adapter，不是产品数据层。

当前不冻结：

- 最终是否使用 Postgres。
- 是否独立部署 RSSHub service。
- 是否引入 FTS5 或外部搜索引擎。
- 是否保留完整 item version history。
- 是否做多用户同步。

## 15. 下一步实现顺序

1. 建立 SQLite schema 和 migration 脚本。
2. 把现有 Source Registry 同步到 `source_families` 和 `source_endpoints`。
3. 实现 `refreshEndpoint(endpointId)`。
4. 把现有 `/api/feed-hub` 改成读 DB。
5. 增加 `POST /api/endpoints/:endpointId/refresh`。
6. 增加 item state 写入 API。
7. 增加 source list filter API。
8. 最后再补定时刷新脚本。

实现顺序必须先保持数据闭环，再补复杂体验。

