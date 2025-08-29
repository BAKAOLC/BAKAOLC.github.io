<template>
  <div class="image-viewer-page">
    <fullscreen-viewer :image-id="imageId" :is-active="true" @close="closeViewer" />
  </div>
</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import FullscreenViewer from '@/components/FullscreenViewer.vue'

// 获取路由参数
const props = defineProps<{
  imageId: string
}>()

const router = useRouter()

// 关闭查看器
const closeViewer = () => {
  router.push({ name: 'gallery' })
}

// 监听查看器导航事件
const handleViewerNavigate = (event: CustomEvent) => {
  if (event.detail && event.detail.imageId) {
    router.push({
      name: 'image-viewer',
      params: { imageId: event.detail.imageId }
    })
  }
}

onMounted(() => {
  window.addEventListener('viewerNavigate', handleViewerNavigate as EventListener)
})

onBeforeUnmount(() => {
  window.removeEventListener('viewerNavigate', handleViewerNavigate as EventListener)
})
</script>

<style scoped>
.image-viewer-page {
  @apply min-h-screen;
}
</style>
