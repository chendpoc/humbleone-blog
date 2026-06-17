export type SourceFamily =
  | "model_lab"
  | "builder"
  | "community"
  | "project_changelog"
  | "personal_repo"
  | "research";

export type EvidenceLevel =
  | "official"
  | "github"
  | "builder"
  | "community"
  | "rss"
  | "manual";

export type SourceHealth = "fresh" | "quiet" | "stale" | "failed";

export type ReadingSkin = "postmodern_newspaper" | "compact_digest" | "source_proof";

export type DailySectionKind = "hard_news" | "cases" | "interesting";

export type SourceDeskItemKind =
  | "navigation"
  | "source_group"
  | "source_slip"
  | "quick_access";

export type SourceDeskItemState =
  | "default"
  | "hover"
  | "selected"
  | "new"
  | "stale"
  | "failed"
  | "dragging"
  | "drop-target";

export type SourceDeskItem = {
  id: string;
  kind: SourceDeskItemKind;
  label: string;
  count?: number;
  sourceFamily?: SourceFamily;
  evidenceLevel?: EvidenceLevel;
  health: SourceHealth;
  state: SourceDeskItemState;
  description?: string;
};

export type PinnedNote = {
  id: string;
  title: string;
  sourceHint: string;
  color: "ivory" | "amber" | "rose" | "blue";
  text: string;
};

export type ClippingItem = {
  id: string;
  title: string;
  source: string;
  url: string;
  health: SourceHealth;
  note: string;
};

export type FeedItem = {
  id: string;
  sourceId: string;
  sourceName: string;
  sourceFamily: SourceFamily;
  evidenceLevel: EvidenceLevel;
  title: string;
  summary: string;
  whyItMatters: string;
  url: string;
  author?: string;
  relativeTime: string;
  publishedAt: string;
  fetchedAt: string;
  tags: string[];
  importanceScore: number;
  noveltyScore: number;
  language: "zh-CN" | "en";
  status: "new" | "read" | "saved" | "annotated" | "archived";
  evidenceLinks: Array<{
    label: string;
    url: string;
  }>;
  reader: {
    kicker: string;
    headline: string;
    body: string[];
    aiSummary: string;
    sourceProof: string[];
    followUpQuestions: string[];
  };
};

export type DailySection = {
  id: DailySectionKind;
  title: string;
  description: string;
  items: FeedItem[];
};

export type SourceDeskData = {
  masthead: string;
  issueLabel: string;
  deskDate: string;
  navigation: SourceDeskItem[];
  sourceGroups: SourceDeskItem[];
  sourceSlips: SourceDeskItem[];
  pinnedNotes: PinnedNote[];
  quickAccess: ClippingItem[];
  footerAction: {
    label: string;
    secondaryLabel: string;
  };
};

export type NewspaperReaderData = {
  skin: ReadingSkin;
  masthead: string;
  editionLine: string;
  topicLine: string;
  selectedItemId: string;
};

export type DailyBrief = {
  id: string;
  date: string;
  title: string;
  judgment: string;
  itemCount: number;
  selectedItemId: string;
  sourceDesk: SourceDeskData;
  sections: DailySection[];
  reader: NewspaperReaderData;
};

const fetchedAt = "2026-06-17T09:30:00+08:00";

const hardNewsItems: FeedItem[] = [
  {
    id: "item-anthropic-engineering-claude-code-agent-interface",
    sourceId: "source-anthropic-engineering",
    sourceName: "Anthropic Engineering",
    sourceFamily: "model_lab",
    evidenceLevel: "official",
    title: "Claude Code 更新代理协作接口",
    summary: "CLI 与桌面协作能力增强，任务上下文更适合长链路工程。",
    whyItMatters: "影响 coding-agent 工作流设计。",
    url: "https://www.anthropic.com/engineering",
    author: "Anthropic Engineering",
    relativeTime: "10m ago",
    publishedAt: "2026-06-17T09:20:00+08:00",
    fetchedAt,
    tags: ["coding-agent", "claude-code", "workflow"],
    importanceScore: 94,
    noveltyScore: 82,
    language: "zh-CN",
    status: "new",
    evidenceLinks: [
      {
        label: "Anthropic Engineering",
        url: "https://www.anthropic.com/engineering",
      },
    ],
    reader: {
      kicker: "Hard News / 官方工程更新",
      headline: "Claude Code 更新代理协作接口",
      body: [
        "Anthropic Engineering 的更新继续把 Claude Code 从单次命令工具推向更长链路的工程协作界面。CLI 与桌面协作能力增强后，任务上下文、文件范围和人工审查边界会更容易被明确表达。",
        "对个人 AI information reader 来说，这类更新不只是产品新闻，也会改变后续 agent workflow 的设计假设。读者需要知道它影响哪里，而不是只看到一条版本动态。",
      ],
      aiSummary:
        "Claude Code 的协作接口正在强化长任务上下文管理，值得作为今日硬新闻的头条。",
      sourceProof: [
        "来源归类为官方工程渠道，证据等级为 official。",
        "条目被放入 hard news，因为它直接影响 coding-agent 工作流设计。",
      ],
      followUpQuestions: [
        "这次接口变化会如何影响多 agent 编排的人工审查点？",
        "是否需要为 Claude Code 单独维护 workflow pattern 笔记？",
      ],
    },
  },
  {
    id: "item-codewhale-changelog-runtime-control-plane",
    sourceId: "source-codewhale-changelog",
    sourceName: "CodeWhale Changelog",
    sourceFamily: "project_changelog",
    evidenceLevel: "github",
    title: "CodeWhale runtime 控制面更新",
    summary: "运行时状态与工具调用边界更清晰，便于多 agent 编排。",
    whyItMatters: "可作为本产品后续 agent workflow 的工程参考。",
    url: "https://github.com",
    author: "CodeWhale",
    relativeTime: "36m ago",
    publishedAt: "2026-06-17T08:54:00+08:00",
    fetchedAt,
    tags: ["runtime", "agent-orchestration", "changelog"],
    importanceScore: 88,
    noveltyScore: 76,
    language: "zh-CN",
    status: "new",
    evidenceLinks: [
      {
        label: "GitHub changelog",
        url: "https://github.com",
      },
    ],
    reader: {
      kicker: "Hard News / 工程变更",
      headline: "CodeWhale runtime 控制面更新",
      body: [
        "CodeWhale 的 changelog 指向一个更清晰的 runtime 控制面：运行时状态、工具调用边界和 agent 编排职责被拆得更明确。",
        "这类变化适合进入 hard news，因为它能为本产品未来的 agent workflow、调度和审查界面提供工程参考。",
      ],
      aiSummary:
        "CodeWhale 的 runtime 控制面更新强化了状态和工具边界，适合作为工程架构参考。",
      sourceProof: [
        "来源归类为 GitHub changelog，证据等级为 github。",
        "条目与多 agent 编排和 runtime 状态表达直接相关。",
      ],
      followUpQuestions: [
        "哪些 runtime 状态值得进入本产品的 source registry？",
        "是否需要把 CodeWhale changelog 做成高优先级监控源？",
      ],
    },
  },
];

const caseItems: FeedItem[] = [
  {
    id: "item-wayland-zhang-ai-agent-book-case",
    sourceId: "source-wayland-zhang",
    sourceName: "Wayland Zhang",
    sourceFamily: "builder",
    evidenceLevel: "builder",
    title: "AI Agent Book 新增项目案例",
    summary: "用真实项目解释 agent 规划、工具调用和评估。",
    whyItMatters: "适合沉淀到 builder 案例栏目。",
    url: "https://waylandz.com",
    author: "Wayland Zhang",
    relativeTime: "1h ago",
    publishedAt: "2026-06-17T08:30:00+08:00",
    fetchedAt,
    tags: ["builder-case", "agent-planning", "evaluation"],
    importanceScore: 82,
    noveltyScore: 71,
    language: "zh-CN",
    status: "new",
    evidenceLinks: [
      {
        label: "Wayland Zhang",
        url: "https://waylandz.com",
      },
    ],
    reader: {
      kicker: "Cases / Builder 案例",
      headline: "AI Agent Book 新增项目案例",
      body: [
        "Wayland Zhang 的新增内容继续沿着真实项目案例展开，重点不是抽象讲 agent，而是把规划、工具调用和评估放回具体工程场景。",
        "这类材料适合在 reader 中作为案例沉淀，而不是和官方更新混在同一个新闻流里。",
      ],
      aiSummary:
        "一个可复用的 builder 案例来源，适合追踪 agent 规划与评估实践。",
      sourceProof: [
        "来源归类为独立 builder，证据等级为 builder。",
        "条目适合进入 cases，因为它提供项目实践而非单纯观点。",
      ],
      followUpQuestions: [
        "这个案例能否抽取成 agent planning checklist？",
        "是否需要给 Wayland Zhang 建独立 source slip？",
      ],
    },
  },
  {
    id: "item-hacker-news-claude-code-context-management",
    sourceId: "source-hacker-news",
    sourceName: "Hacker News",
    sourceFamily: "community",
    evidenceLevel: "community",
    title: "开发者讨论 Claude Code 的上下文管理",
    summary: "社区关注长期任务、文件范围和人工审查边界。",
    whyItMatters: "暴露实际使用痛点。",
    url: "https://news.ycombinator.com",
    author: "Hacker News community",
    relativeTime: "3h ago",
    publishedAt: "2026-06-17T06:30:00+08:00",
    fetchedAt,
    tags: ["community-signal", "claude-code", "context-management"],
    importanceScore: 78,
    noveltyScore: 68,
    language: "zh-CN",
    status: "new",
    evidenceLinks: [
      {
        label: "Hacker News",
        url: "https://news.ycombinator.com",
      },
    ],
    reader: {
      kicker: "Cases / 社区使用痛点",
      headline: "开发者讨论 Claude Code 的上下文管理",
      body: [
        "Hacker News 的讨论把 Claude Code 的真实使用痛点集中到了长期任务、文件范围控制和人工审查边界上。",
        "社区讨论不适合作为唯一事实来源，但适合暴露产品和 workflow 的摩擦点。",
      ],
      aiSummary:
        "社区正在反复讨论上下文管理，这提示 reader 应突出人工审查与证据链。",
      sourceProof: [
        "来源归类为社区讨论，证据等级为 community。",
        "条目被放入 cases，因为它反映真实开发者使用场景。",
      ],
      followUpQuestions: [
        "上下文管理痛点是否应进入本产品的 source risk notes？",
        "是否要为社区讨论单独标出低事实强度提示？",
      ],
    },
  },
];

const interestingItems: FeedItem[] = [
  {
    id: "item-shumer-something-big-agents",
    sourceId: "source-shumer-dev",
    sourceName: "shumer.dev",
    sourceFamily: "builder",
    evidenceLevel: "builder",
    title: "Something big is happening with agents",
    summary: "独立 builder 对 agent 产品化节奏的观察。",
    whyItMatters: "适合引发 follow-up research。",
    url: "https://shumer.dev/something-big-is-happening",
    author: "shumer",
    relativeTime: "6h ago",
    publishedAt: "2026-06-17T03:30:00+08:00",
    fetchedAt,
    tags: ["agent-products", "builder-observation", "research-lead"],
    importanceScore: 73,
    noveltyScore: 85,
    language: "en",
    status: "saved",
    evidenceLinks: [
      {
        label: "shumer.dev",
        url: "https://shumer.dev/something-big-is-happening",
      },
    ],
    reader: {
      kicker: "Interesting / Follow-up Research",
      headline: "Something big is happening with agents",
      body: [
        "这篇独立 builder 观察更像一个研究线索：它不提供完整工程结论，但捕捉到了 agent 产品化节奏正在变化。",
        "在今日阅读里，它适合放进 interesting，提醒读者稍后做二次研究，而不是立刻把它当成 hard news。",
      ],
      aiSummary:
        "一个高信号观察条目，适合触发后续 research，而不是直接作为事实结论。",
      sourceProof: [
        "来源归类为独立 builder，证据等级为 builder。",
        "条目被放入 interesting，因为它主要提供观察和研究方向。",
      ],
      followUpQuestions: [
        "文中的产品化判断是否有可验证案例支撑？",
        "是否能与 Anthropic 和 CodeWhale 的工程变化形成同一条趋势线？",
      ],
    },
  },
  {
    id: "item-litomore-github-ai-coding-workflow",
    sourceId: "source-litomore-github",
    sourceName: "LitoMore GitHub",
    sourceFamily: "personal_repo",
    evidenceLevel: "github",
    title: "新工具仓库展示 AI coding workflow",
    summary: "仓库结构显示个人工具链正在向 agent-first 迁移。",
    whyItMatters: "可进入有意思或案例栏目。",
    url: "https://github.com/LitoMore",
    author: "LitoMore",
    relativeTime: "8h ago",
    publishedAt: "2026-06-17T01:30:00+08:00",
    fetchedAt,
    tags: ["github", "personal-tooling", "agent-first"],
    importanceScore: 67,
    noveltyScore: 79,
    language: "zh-CN",
    status: "new",
    evidenceLinks: [
      {
        label: "LitoMore GitHub",
        url: "https://github.com/LitoMore",
      },
    ],
    reader: {
      kicker: "Interesting / GitHub 工具线索",
      headline: "新工具仓库展示 AI coding workflow",
      body: [
        "LitoMore GitHub 的新工具仓库更像一个轻量信号：个人工具链正在把 agent-first workflow 作为默认组织方式。",
        "它可以先进入 interesting，如果后续仓库活跃度和文档质量足够，再升级成 cases。",
      ],
      aiSummary:
        "GitHub 仓库结构提供了一个 agent-first 个人工具链迁移信号。",
      sourceProof: [
        "来源归类为个人 GitHub 仓库，证据等级为 github。",
        "条目放入 interesting，因为它目前是线索而非完整案例。",
      ],
      followUpQuestions: [
        "仓库是否有足够文档支撑案例化？",
        "是否需要追踪 release、stars 或 commit 频率作为信号？",
      ],
    },
  },
];

export const dailyBrief = {
  id: "daily-2026-06-17-ai-builder",
  date: "2026-06-17",
  title: "Today",
  judgment:
    "今天的高信号集中在 coding-agent 协作接口、runtime 控制面和真实 builder 使用痛点。",
  itemCount: 6,
  selectedItemId: hardNewsItems[0].id,
  sourceDesk: {
    masthead: "AI Builder Daily",
    issueLabel: "Issue 017",
    deskDate: "2026.06.17",
    navigation: [
      {
        id: "nav-today",
        kind: "navigation",
        label: "Today",
        count: 6,
        health: "fresh",
        state: "selected",
        description: "今日 3-8 条高信号信息饮食。",
      },
      {
        id: "nav-sources",
        kind: "navigation",
        label: "Sources",
        health: "quiet",
        state: "default",
      },
      {
        id: "nav-explore",
        kind: "navigation",
        label: "Explore",
        health: "quiet",
        state: "default",
      },
      {
        id: "nav-signals",
        kind: "navigation",
        label: "Signals",
        count: 3,
        health: "fresh",
        state: "new",
      },
      {
        id: "nav-library",
        kind: "navigation",
        label: "Library",
        health: "quiet",
        state: "default",
      },
    ],
    sourceGroups: [
      {
        id: "group-all-sources",
        kind: "source_group",
        label: "All Sources",
        count: 24,
        health: "fresh",
        state: "default",
      },
      {
        id: "group-high-signal",
        kind: "source_group",
        label: "High Signal",
        count: 9,
        health: "fresh",
        state: "new",
        description: "优先进入每日 3-8 条筛选池。",
      },
      {
        id: "group-annotated",
        kind: "source_group",
        label: "Annotated",
        count: 5,
        health: "quiet",
        state: "default",
      },
      {
        id: "group-archived",
        kind: "source_group",
        label: "Archived",
        count: 18,
        health: "stale",
        state: "stale",
      },
    ],
    sourceSlips: [
      {
        id: "slip-anthropic-engineering",
        kind: "source_slip",
        label: "Anthropic Engineering",
        sourceFamily: "model_lab",
        evidenceLevel: "official",
        health: "fresh",
        state: "new",
      },
      {
        id: "slip-codewhale-changelog",
        kind: "source_slip",
        label: "CodeWhale Changelog",
        sourceFamily: "project_changelog",
        evidenceLevel: "github",
        health: "fresh",
        state: "new",
      },
      {
        id: "slip-wayland-zhang",
        kind: "source_slip",
        label: "Wayland Zhang",
        sourceFamily: "builder",
        evidenceLevel: "builder",
        health: "fresh",
        state: "default",
      },
      {
        id: "slip-hacker-news",
        kind: "source_slip",
        label: "Hacker News",
        sourceFamily: "community",
        evidenceLevel: "community",
        health: "fresh",
        state: "default",
      },
      {
        id: "slip-openai-blog",
        kind: "source_slip",
        label: "OpenAI Blog",
        sourceFamily: "model_lab",
        evidenceLevel: "official",
        health: "quiet",
        state: "default",
      },
      {
        id: "slip-old-rsshub-route",
        kind: "source_slip",
        label: "Old RSSHub Route",
        evidenceLevel: "rss",
        health: "failed",
        state: "failed",
        description: "保留为失败态样例，不进入今日 timeline。",
      },
    ],
    pinnedNotes: [
      {
        id: "note-anthropic-news",
        title: "Anthropic News",
        sourceHint: "official",
        color: "ivory",
        text: "优先检查 Claude Code、API、engineering 三条线。",
      },
      {
        id: "note-openai-blog",
        title: "OpenAI Blog",
        sourceHint: "official",
        color: "blue",
        text: "仅在发布直接影响 builder workflow 时进入今日简报。",
      },
      {
        id: "note-market-watch",
        title: "Market Watch",
        sourceHint: "manual",
        color: "amber",
        text: "观察独立 builder、工具仓库和社区痛点是否形成同一趋势。",
      },
    ],
    quickAccess: [
      {
        id: "quick-ai-builder-daily",
        title: "AI Builder Daily",
        source: "internal",
        url: "/",
        health: "fresh",
        note: "今日阅读面板。",
      },
      {
        id: "quick-arxiv-cs-ai",
        title: "arXiv CS.AI",
        source: "arXiv",
        url: "https://arxiv.org/list/cs.AI/recent",
        health: "quiet",
        note: "研究源，暂不进入今日 6 条。",
      },
      {
        id: "quick-hacker-news",
        title: "Hacker News",
        source: "Y Combinator",
        url: "https://news.ycombinator.com",
        health: "fresh",
        note: "社区使用痛点。",
      },
      {
        id: "quick-lesswrong",
        title: "LessWrong",
        source: "LessWrong",
        url: "https://www.lesswrong.com",
        health: "stale",
        note: "低频思想源，进入 interesting 前需人工筛选。",
      },
    ],
    footerAction: {
      label: "Add Source",
      secondaryLabel: "New Clipping",
    },
  },
  sections: [
    {
      id: "hard_news",
      title: "Hard News",
      description: "直接改变工具、平台或工程工作流的更新。",
      items: hardNewsItems,
    },
    {
      id: "cases",
      title: "Cases",
      description: "来自 builder 和社区的真实使用案例。",
      items: caseItems,
    },
    {
      id: "interesting",
      title: "Interesting",
      description: "值得后续研究的观察、仓库和弱信号。",
      items: interestingItems,
    },
  ],
  reader: {
    skin: "postmodern_newspaper",
    masthead: "AI BUILDER DAILY",
    editionLine: "Morning Edition / 2026.06.17 / Personal Desk",
    topicLine: "Coding Agents, Builder Workflows, Runtime Control",
    selectedItemId: hardNewsItems[0].id,
  },
} satisfies DailyBrief;
