<template>
  <div class="content">
    <pre class="ascii" aria-hidden="true">+----------------------+
| HumbleOne Chen      |
| learn / write / log |
+----------------------+</pre>
    <img :src="withBase(theme.avator)" width="135" height="135" class="avator" alt="HumbleOne Chen" />
  </div>
</template>

<script lang="ts" setup>
import { useData, withBase } from 'vitepress'

const { theme } = useData()
</script>

<style scoped>
.content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 300px;
  gap: 18px;
}

.ascii {
  margin: 0;
  color: var(--vp-c-text-1);
  font-size: 0.9rem;
  line-height: 1.35;
  letter-spacing: 0;
  text-align: left;
}

.avator {
  border-radius: 50%;
  border: 2px solid var(--vp-avator-border);
  background: var(--vp-c-bg);
}
</style>
