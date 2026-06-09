<template>
  <div class="about-page">
    <div class="about-content">
      <div class="about-avatar">
        <img :src="withBase('/humbleone.svg')" alt="HumbleOne Chen" />
      </div>
      <h1 class="about-name">HumbleOne Chen</h1>
      <p class="about-bio">
        学习记录 / 技术笔记 / 长期思考
      </p>
      <div class="about-desc">
        <p>
          这里是我整理学习材料、工程实践和阶段性思考的个人博客。内容以 Markdown 为核心单元，优先记录能被复盘、能被链接、能长期维护的材料。
        </p>
        <p>
          文章用于沉淀较完整的主题，笔记用于保存学习过程中的结构化片段。网站会持续保持轻量、可读、可搜索。
        </p>
        <p>
          如果某篇内容对你有帮助，欢迎在文章或笔记页下方通过 GitHub Discussions 评论。
        </p>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { withBase } from 'vitepress'
</script>

<style scoped>
.about-page {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: calc(100vh - var(--vp-nav-height, 64px) - 80px);
  padding: 40px 24px;
}

.about-content {
  max-width: 580px;
  width: 100%;
  text-align: center;
}

.about-avatar {
  display: flex;
  justify-content: center;
  margin-bottom: 24px;
}

.about-avatar img {
  width: 135px;
  height: 135px;
  border-radius: 50%;
  border: 2px solid var(--vp-avator-border);
  background: var(--vp-c-bg);
}

.about-name {
  font-size: 2.2em;
  font-weight: 700;
  letter-spacing: 0;
  color: var(--vp-c-text-1);
  margin: 0 0 8px;
  line-height: 1.2;
}

.about-bio {
  font-size: 1.1em;
  color: var(--vp-c-text-2);
  margin: 0 0 28px;
  font-weight: 500;
}

.about-desc {
  text-align: left;
  font-size: 0.95em;
  color: var(--vp-c-text-2);
  line-height: 1.9;
}

.about-desc p {
  margin: 0 0 16px;
}

.about-desc p:last-child {
  margin-bottom: 0;
}

@media (max-width: 640px) {
  .about-name {
    font-size: 1.8em;
  }

  .about-page {
    padding: 32px 20px 80px;
  }
}
</style>
