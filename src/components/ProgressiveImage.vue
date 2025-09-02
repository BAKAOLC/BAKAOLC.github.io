<template>
  <div class="progressive-image">
    <!-- 预加载缩略图 -->
    <img
      v-if="preloadThumbnailSrc && showThumbnail"
      :src="preloadThumbnailSrc"
      :alt="alt"
      class="thumbnail"
      :class="{ 'fade-out': imageLoaded }"
      @load="onThumbnailLoad"
    />
    
    <!-- 实际显示的图像 -->
    <img
      v-if="displayImageSrc"
      :src="displayImageSrc"
      :alt="alt"
      :class="[imageClass, { 'fade-in': imageLoaded }]"
      @load="onImageLoad"
      @error="onImageError"
    />
    
    <!-- 加载指示器 -->
    <div v-if="isLoading && showLoader" class="loading-spinner">
      <div class="spinner"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import thumbnailMap from '@/assets/thumbnail-map.json'

interface Props {
  src: string
  alt?: string
  imageClass?: string
  showLoader?: boolean
  objectFit?: 'contain' | 'cover' | 'fill' | 'scale-down' | 'none'
  // 预加载缩略图的尺寸
  preloadSize?: 'tiny' | 'small' | 'medium'
  // 实际显示的图像类型和尺寸
  displayType?: 'original' | 'thumbnail'
  displaySize?: 'tiny' | 'small' | 'medium'
}

const props = withDefaults(defineProps<Props>(), {
  alt: '',
  imageClass: '',
  showLoader: true,
  objectFit: 'cover',
  preloadSize: 'tiny',
  displayType: 'original',
  displaySize: 'medium'
})

const emit = defineEmits<{
  load: []
  error: []
}>()

const imageLoaded = ref(false)
const isLoading = ref(true)
const showThumbnail = ref(false)
const thumbnailLoaded = ref(false)

// 从映射中获取预加载缩略图路径
const preloadThumbnailSrc = computed(() => {
  if (!props.src) return null
  const thumbnails = (thumbnailMap as any)[props.src] as Record<string, string> | undefined
  return thumbnails?.[props.preloadSize] || null
})

// 获取实际显示的图像路径
const displayImageSrc = computed(() => {
  if (!props.src) return null
  
  if (props.displayType === 'original') {
    return props.src
  } else {
    const thumbnails = (thumbnailMap as any)[props.src] as Record<string, string> | undefined
    return thumbnails?.[props.displaySize] || props.src
  }
})

const onThumbnailLoad = () => {
  thumbnailLoaded.value = true
  showThumbnail.value = true
}

const onImageLoad = () => {
  imageLoaded.value = true
  isLoading.value = false
  emit('load')
}

const onImageError = () => {
  isLoading.value = false
  emit('error')
}

// 监听src变化，重置状态
watch(() => props.src, () => {
  if (props.src) {
    imageLoaded.value = false
    isLoading.value = true
    showThumbnail.value = false
    thumbnailLoaded.value = false
    
    // 如果有预加载缩略图，立即显示
    if (preloadThumbnailSrc.value) {
      showThumbnail.value = true
    }
  }
}, { immediate: true })

onMounted(() => {
  if (props.src && preloadThumbnailSrc.value) {
    showThumbnail.value = true
  }
})
</script>

<style scoped>
.progressive-image {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.thumbnail {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: v-bind(objectFit);
  transition: opacity 0.4s ease;
  z-index: 1;
}

.thumbnail.fade-out {
  opacity: 0;
}

.progressive-image img {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: v-bind(objectFit);
  opacity: 1;
  transition: opacity 0.4s ease;
  z-index: 2;
}

.progressive-image img.fade-in {
  opacity: 1;
}

.loading-spinner {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 3;
}

.spinner {
  width: 24px;
  height: 24px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top: 2px solid #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* 深色模式下的loading spinner */
@media (prefers-color-scheme: dark) {
  .spinner {
    border: 2px solid rgba(0, 0, 0, 0.3);
    border-top: 2px solid #60a5fa;
  }
}
</style>
