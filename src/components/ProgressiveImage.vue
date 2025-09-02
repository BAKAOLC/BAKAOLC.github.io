<template>
  <div class="progressive-image">
    <!-- 预加载缩略图 -->
    <img
      v-if="preloadThumbnailSrc && showThumbnail && !thumbnailHidden"
      :src="preloadThumbnailSrc"
      :alt="alt"
      class="thumbnail"
      :class="{ 'fade-out': imageLoaded }"
      @load="onThumbnailLoad"
      @error="onThumbnailError"
    />
    
    <!-- 实际显示的图像 -->
    <img
      v-if="displayImageSrc && shouldShowMainImage"
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
  // 延迟加载主图的时间（毫秒）
  delayMainImage?: number
}

const props = withDefaults(defineProps<Props>(), {
  alt: '',
  imageClass: '',
  showLoader: true,
  objectFit: 'cover',
  preloadSize: 'tiny',
  displayType: 'original',
  displaySize: 'medium',
  delayMainImage: 200
})

const emit = defineEmits<{
  load: []
  error: []
}>()

const imageLoaded = ref(false)
const isLoading = ref(true)
const showThumbnail = ref(false)
const thumbnailLoaded = ref(false)
const thumbnailHidden = ref(false)
const shouldShowMainImage = ref(false)
const mainImageStartedLoading = ref(false)

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
  
  // 缩略图加载完成后，延迟开始加载主图
  if (!mainImageStartedLoading.value) {
    mainImageStartedLoading.value = true
    setTimeout(() => {
      shouldShowMainImage.value = true
    }, props.delayMainImage)
  }
}

const onThumbnailError = () => {
  console.warn('缩略图加载失败:', preloadThumbnailSrc.value)
  // 如果缩略图加载失败，立即开始加载主图
  if (!mainImageStartedLoading.value) {
    mainImageStartedLoading.value = true
    shouldShowMainImage.value = true
  }
}

const onImageLoad = () => {
  imageLoaded.value = true
  isLoading.value = false
  
  // 主图加载完成后，等待fade-out动画完成再隐藏缩略图
  // 这样可以避免透明图片的光晕效果
  setTimeout(() => {
    thumbnailHidden.value = true
  }, 250) // 略大于fade-out过渡时间(200ms)
  
  emit('load')
}

const onImageError = () => {
  isLoading.value = false
  emit('error')
}

// 监听src变化，重置状态
watch(() => props.src, (newSrc) => {
  if (newSrc) {
    // 重置所有状态
    imageLoaded.value = false
    isLoading.value = true
    showThumbnail.value = false
    thumbnailLoaded.value = false
    thumbnailHidden.value = false
    shouldShowMainImage.value = false
    mainImageStartedLoading.value = false
    
    // 如果有预加载缩略图，立即开始加载
    if (preloadThumbnailSrc.value) {
      // 立即显示缩略图元素，让浏览器开始加载
      showThumbnail.value = true
    } else {
      // 如果没有缩略图，直接加载主图
      shouldShowMainImage.value = true
      mainImageStartedLoading.value = true
    }
  }
}, { immediate: true })

onMounted(() => {
  // 组件挂载时的初始化逻辑已在 watch 中处理
})
</script>

<style scoped>
.progressive-image {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background-color: transparent;
}

@media (prefers-color-scheme: dark) {
  .progressive-image {
    background-color: transparent;
  }
}

.thumbnail {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: v-bind(objectFit);
  opacity: 1;
  transition: opacity 0.3s ease-out;
  z-index: 1;
  /* 添加轻微的模糊效果以表明这是预览图 */
  filter: blur(1px);
}

.thumbnail.fade-out {
  opacity: 0;
  transition: opacity 0.2s ease-out;
}

.progressive-image img:not(.thumbnail) {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: v-bind(objectFit);
  opacity: 0;
  transition: opacity 0.5s ease-in;
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
  background-color: rgba(255, 255, 255, 0.8);
  border-radius: 50%;
  padding: 6px;
  backdrop-filter: blur(4px);
}

@media (prefers-color-scheme: dark) {
  .loading-spinner {
    background-color: rgba(0, 0, 0, 0.8);
  }
}

.spinner {
  width: 24px;
  height: 24px;
  border: 2px solid rgba(59, 130, 246, 0.3);
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
    border: 2px solid rgba(96, 165, 250, 0.3);
    border-top: 2px solid #60a5fa;
  }
}

/* 响应式优化 */
@media (max-width: 640px) {
  .spinner {
    width: 20px;
    height: 20px;
  }
  
  .loading-spinner {
    padding: 6px;
  }
}
</style>
