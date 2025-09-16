<template>
  <div class="image-viewer-page">
    <fullscreen-viewer :image-id="imageId" :child-image-id="childImageId" :is-active="true" @close="closeViewer" />
  </div>
</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount } from 'vue';
import { useRouter } from 'vue-router';

import FullscreenViewer from '@/components/FullscreenViewer.vue';
import { useEventManager } from '@/composables/useEventManager';
import { useAppStore } from '@/stores/app';

// 获取路由参数
defineProps<{
  imageId: string;
  childImageId?: string;
}>();

const router = useRouter();
const eventManager = useEventManager();
const appStore = useAppStore();

// 关闭查看器
const closeViewer = (): void => {
  // 如果是从画廊进入的，直接返回画廊
  if (appStore.isFromGallery) {
    router.push({ name: 'gallery' });
  } else {
    // 直接访问的情况，检查是否有来源页面可以返回
    if (window.history.length > 1) {
      router.back();
    } else {
      // 如果没有历史记录，默认跳转到画廊
      router.push({ name: 'gallery' });
    }
  }
};

// 监听查看器导航事件
const handleViewerNavigate = (event: CustomEvent): void => {
  if (event.detail && event.detail.imageId && typeof event.detail.imageId === 'string') {
    const { imageId, childImageId } = event.detail;
    
    if (childImageId) {
      router.push({
        name: 'image-viewer-child',
        params: { imageId, childImageId },
      });
    } else {
      router.push({
        name: 'image-viewer',
        params: { imageId },
      });
    }
  } else {
    console.warn('无效的图片ID，无法导航');
  }
};

onMounted(() => {
  // 检查是否是直接导航到查看器
  // 如果前一个路由不存在或不是gallery，说明是直接访问
  const isDirectNavigation = !history.state || 
                            !history.state.back || 
                            !history.state.back.includes('gallery');
  
  if (isDirectNavigation) {
    // 直接访问，重置从画廊进入的标记
    appStore.setFromGallery(false);
  }
  // 如果是从画廊来的（isFromGallery已经是true），保持状态不变

  eventManager.addEventListener('viewerNavigate', handleViewerNavigate as EventListener);
});

onBeforeUnmount(() => {
  // 当离开图像查看器时，重置状态为下次直接访问做准备
  appStore.setFromGallery(false);
  // 事件会通过eventManager自动清理
});
</script>

<style scoped>
.image-viewer-page {
  @apply min-h-screen;
}
</style>
