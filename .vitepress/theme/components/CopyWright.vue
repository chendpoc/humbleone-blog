<template>
  <footer>
    <span>HumbleOne Chen</span>
    <span>|</span>
    <a href="https://github.com/Facefall/humbleone-blog" target="_blank" rel="noopener">GitHub</a>
    <span>|</span>
    <span>2019-{{ date }} MIT</span>
  </footer>
</template>

<script lang="ts" setup>
const date = new Date().getFullYear()
</script>

<style scoped>
footer {
  display: flex;
  gap: 8px;
  justify-content: center;
  flex-wrap: wrap;
  text-align: center;
  width: 100%;
  padding: 32px 20px 20px;
  background: var(--vp-c-bg);
  color: var(--vp-c-text);
}

a {
  color: var(--vp-c-brand);
  font-weight: bold;
}

a:hover {
  text-decoration: none;
  color: var(--vp-c-hover);
}
</style>
