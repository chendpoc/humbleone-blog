<template>
  <h1 class="title">{{ page.title }}</h1>
  <div class="date">发布于：{{ publishDate }}</div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import { useData, onContentUpdated } from 'vitepress'

const { page } = useData()
const publishDate = ref('')

onContentUpdated(() => {
  const { frontmatter } = page.value
  publishDate.value = String(frontmatter.date || '').slice(0, 10)
})
</script>

<style scoped>
.title {
  color: var(--vp-c-text-1);
  font-weight: 600;
  font-size: 2.25em;
  margin-top: 0.3em;
  margin-bottom: 0.3em;
  line-height: 1.3;
  font-family: var(--vp-font-family-base);
}

.date {
  font-size: 0.875rem;
  line-height: 1.25rem;
  margin-bottom: 1em;
  padding-bottom: 1em;
  border-bottom: 1px dashed #c7c7c7;
}
</style>
