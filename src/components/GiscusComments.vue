<template>
  <div class="giscus-comments">
    <Giscus
      :repo="repo"
      :repo-id="repoId"
      :category="category"
      :category-id="categoryId"
      :mapping="mapping"
      :term="term"
      :strict="strict"
      :reactions-enabled="reactionsEnabled"
      :emit-metadata="emitMetadata"
      :input-position="inputPosition"
      :theme="theme"
      :lang="lang"
      :loading="loading"
    />
  </div>
</template>

<script setup lang="ts">
import Giscus from '@giscus/vue';
import { computed } from 'vue';

import { useAppStore } from '@/stores/app';

const appStore = useAppStore();

// Props for dynamic configuration
interface Props {
  uniqueId?: string;
}

const props = withDefaults(defineProps<Props>(), {
  uniqueId: 'default',
});

// Giscus configuration based on the provided settings
const repo = 'BAKAOLC/BAKAOLC.github.io';
const repoId = 'R_kgDOJ3xZcg';
const category = 'Giscus';
const categoryId = 'DIC_kwDOJ3xZcs4CvjNZ';
const mapping = 'specific';
const term = computed(() => `image-viewer-${props.uniqueId}`);
const strict = '1';
const reactionsEnabled = '1';
const emitMetadata = '0';
const inputPosition = 'top';
const loading = 'lazy';

// Dynamic theme and language
const theme = computed(() => appStore.isDarkMode ? 'dark' : 'light');
const lang = computed(() => {
  switch (appStore.currentLanguage) {
    case 'en':
      return 'en';
    case 'jp':
      return 'ja';
    case 'zh':
    default:
      return 'zh-CN';
  }
});
</script>

<style scoped>
.giscus-comments {
  width: 100%;
  height: 100%;
}
</style>
