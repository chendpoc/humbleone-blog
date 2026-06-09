<template>
  <section class="comments" aria-label="评论">
    <div ref="container"></div>
    <p v-if="missingConfig" class="comments-pending">
      评论区将在 GitHub Discussions 配置完成后启用。
    </p>
  </section>
</template>

<script lang="ts" setup>
import { computed, nextTick, ref } from 'vue'
import { onContentUpdated, useData } from 'vitepress'

const { theme } = useData()
const container = ref<HTMLDivElement | null>(null)

const giscus = computed(() => theme.value.giscus ?? {})
const missingConfig = computed(() => !giscus.value.repoId || !giscus.value.categoryId)

function clearChildren(element: Element): void {
  while (element.lastElementChild) {
    element.removeChild(element.lastElementChild)
  }
}

function renderGiscus(): void {
  if (!container.value) return
  clearChildren(container.value)

  if (missingConfig.value) return

  const script = document.createElement('script')
  script.src = 'https://giscus.app/client.js'
  script.async = true
  script.crossOrigin = 'anonymous'
  script.setAttribute('data-repo', giscus.value.repo)
  script.setAttribute('data-repo-id', giscus.value.repoId)
  script.setAttribute('data-category', giscus.value.category)
  script.setAttribute('data-category-id', giscus.value.categoryId)
  script.setAttribute('data-mapping', 'pathname')
  script.setAttribute('data-strict', '0')
  script.setAttribute('data-reactions-enabled', '1')
  script.setAttribute('data-emit-metadata', '0')
  script.setAttribute('data-input-position', 'bottom')
  script.setAttribute('data-theme', 'preferred_color_scheme')
  script.setAttribute('data-lang', 'zh-CN')
  script.setAttribute('data-loading', 'lazy')
  container.value.appendChild(script)
}

onContentUpdated(() => {
  nextTick(renderGiscus)
})
</script>

<style scoped>
.comments {
  margin: 48px auto 24px;
  max-width: 760px;
  padding-top: 24px;
  border-top: 1px dashed var(--vp-c-divider);
}

.comments-pending {
  color: var(--vp-c-text-2);
  font-size: 0.9rem;
}
</style>
