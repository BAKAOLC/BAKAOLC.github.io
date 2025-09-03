<template>
  <div class="image-viewer-page">
    <fullscreen-viewer :image-id="imageId" :is-active="true" @close="closeViewer" />
  </div>
</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount } from 'vue';
import { useRouter } from 'vue-router';

import FullscreenViewer from '@/components/FullscreenViewer.vue';
import { useEventManager } from '@/composables/useEventManager';

// 获取路由参数
defineProps<{
  imageId: string;
}>();

const router = useRouter();
const eventManager = useEventManager();

// 关闭查看器
const closeViewer = (): void => {
  router.push({ name: 'gallery' });
};

// 监听查看器导航事件
const handleViewerNavigate = (event: CustomEvent): void => {
  if (event.detail && event.detail.imageId && typeof event.detail.imageId === 'string') {
    router.push({
      name: 'image-viewer',
      params: { imageId: event.detail.imageId },
    });
  } else {
    console.warn('无效的图片ID，无法导航');
  }
};

onMounted(() => {
  eventManager.addEventListener('viewerNavigate', handleViewerNavigate as EventListener);
});

onBeforeUnmount(() => {
  // 事件会通过eventManager自动清理
});
</script>

<style scoped>
.image-viewer-page {
  @apply min-h-screen;
}
</style>
