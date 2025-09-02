<template>
  <div class="fullscreen-viewer" 
    :class="{ 
      'active': isActive, 
      'transition-active': transitionActive, 
      'closing': isClosing 
    }"
    @keydown.esc="close" tabindex="0">
    <div class="viewer-header">
      <div class="viewer-title">
        {{ currentImage ? t(currentImage.name, currentLanguage) : '' }}
      </div>

      <div class="viewer-controls">
        <button class="control-button" @click="toggleInfoPanel" :class="{ 'disabled': infoPanelAnimating }"
          :disabled="infoPanelAnimating" :title="t(showInfoPanel ? 'viewer.hideInfo' : 'viewer.showInfo')">
          <info-icon class="icon" />
        </button>
        <button class="control-button close-button" @click="close" :title="t('viewer.close')">
          <x-icon class="icon" />
        </button>
      </div>
    </div>

    <div class="viewer-content">
      <div class="image-container">
        <transition name="fade" mode="out-in">
          <img v-if="currentImage" :key="currentImage.id" :src="currentImage.src"
            :alt="t(currentImage.name, currentLanguage)" class="image" ref="imageRef" @load="onImageLoad"
            draggable="false" />
        </transition>
      </div>
    </div>

    <div class="viewer-navigation">
      <button class="nav-button prev-button" @click="prevImage" :disabled="!hasPrevImage" :title="t('viewer.prev')">
        <chevron-left-icon class="icon" />
      </button>

      <div class="image-thumbnails-container">
        <div class="image-thumbnails" :style="{ transform: `translateX(${thumbnailsOffset}px)` }">
          <button v-for="(image, index) in imagesList" :key="image.id" @click="goToImage(index)"
            class="thumbnail-button" :class="{ 'active': currentIndex === index }">
            <img :src="getOptimizedImageUrl(image.src)" :alt="t(image.name, currentLanguage)" class="thumbnail-image"
              draggable="false" />
          </button>
        </div>
      </div>

      <button class="nav-button next-button" @click="nextImage" :disabled="!hasNextImage" :title="t('viewer.next')">
        <chevron-right-icon class="icon" />
      </button>
    </div>

    <transition name="slide-fade">
      <div v-show="showInfoPanel" class="viewer-footer">
        <div class="info-toggle-button" @click="toggleInfoPanel" style="display: none;">
          <!-- 信息切换按钮已移至顶部控制栏 -->
        </div>

        <div class="image-info">
          <div class="info-group">
            <h3 class="info-title">{{ t(currentImage?.name, currentLanguage) }}</h3>
            <p class="info-description">{{ t(currentImage?.description, currentLanguage) }}</p>
          </div>

          <div class="info-group">
            <h4 class="info-subtitle">{{ $t('gallery.artist') }}</h4>
            <p>{{ currentImage ? t(currentImage.artist, currentLanguage) : '' }}</p>
          </div>

          <div v-if="currentImage?.date" class="info-group">
            <h4 class="info-subtitle">{{ $t('gallery.date') }}</h4>
            <p>{{ currentImage.date }}</p>
          </div>

          <div class="info-group">
            <h4 class="info-subtitle">{{ $t('gallery.tags') }}</h4>
            <div class="tags-list">
              <span v-for="tagId in currentImage?.tags || []" :key="tagId" class="tag"
                :style="{ backgroundColor: getTagColor(tagId) }">
                {{ getTagName(tagId) }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onBeforeUnmount } from 'vue'
import { useI18n } from 'vue-i18n'
import { XIcon, ChevronLeftIcon, ChevronRightIcon, InfoIcon } from 'lucide-vue-next'
import { siteConfig } from '@/config/site'
import { useAppStore } from '@/stores/app'
import type { I18nText } from '@/types'

const props = defineProps<{
  imageId: string
  isActive: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const { t: $t } = useI18n()
const appStore = useAppStore()

const imageRef = ref<HTMLImageElement | null>(null)
const currentLanguage = computed(() => appStore.currentLanguage)

// 添加过渡动画状态
const transitionActive = ref(false)

// 当前图片索引和图片列表
const imagesList = computed(() => appStore.characterImages)
const currentIndex = computed(() => {
  if (!props.imageId) return 0
  return imagesList.value.findIndex(img => img.id === props.imageId)
})
const currentImage = computed(() => {
  if (currentIndex.value < 0 || currentIndex.value >= imagesList.value.length) {
    return null
  }
  return imagesList.value[currentIndex.value]
})

// 导航控制
const hasPrevImage = computed(() => currentIndex.value > 0)
const hasNextImage = computed(() => currentIndex.value < imagesList.value.length - 1)

const prevImage = () => {
  if (hasPrevImage.value) {
    goToImage(currentIndex.value - 1)
  }
}

const nextImage = () => {
  if (hasNextImage.value) {
    goToImage(currentIndex.value + 1)
  }
}

const goToImage = (index: number) => {
  if (index >= 0 && index < imagesList.value.length) {
    const imageId = imagesList.value[index]?.id
    if (!imageId) {
      console.warn('图片ID为空，无法导航')
      return
    }
    
    // 不再关闭查看器，直接更新内部状态

    // 使用history API更新URL参数，不触发页面刷新
    const newUrl = window.location.pathname.replace(/\/[^/]+$/, `/${imageId}`)
    window.history.pushState({ imageId }, '', newUrl)

    // 触发自定义事件通知父组件
    const event = new CustomEvent('viewerNavigate', { detail: { imageId } })
    window.dispatchEvent(event)

    // 更新缩略图位置
    nextTick(() => {
      updateThumbnailsOffset()
    })
  }
}

const onImageLoad = () => {
  // 图片加载完成处理
}

// 信息面板控制
const showInfoPanel = ref(true)
const infoPanelAnimating = ref(false)

const toggleInfoPanel = () => {
  if (infoPanelAnimating.value) return // 防止动画过程中重复触发

  infoPanelAnimating.value = true
  showInfoPanel.value = !showInfoPanel.value

  // 动画结束后重置状态
  setTimeout(() => {
    infoPanelAnimating.value = false
  }, 400) // 与动画时长一致
}

// 已移除小地图计算功能

// 已移除小地图相关代码

// 缩略图滚动条逻辑
const thumbnailsOffset = ref(0)
const THUMBNAIL_WIDTH = 80 // 缩略图宽度加间隙

const updateThumbnailsOffset = () => {
  const containerWidth = window.innerWidth - 160 // 减去导航按钮的宽度
  const totalWidth = imagesList.value.length * THUMBNAIL_WIDTH

  if (totalWidth <= containerWidth) {
    // 如果图片少于一屏，居中显示
    thumbnailsOffset.value = (containerWidth - totalWidth) / 2
    return
  }

  // 计算当前图片在缩略图中的中心位置，使当前图片永远居中显示
  const targetOffset = -(currentIndex.value * THUMBNAIL_WIDTH - containerWidth / 2 + THUMBNAIL_WIDTH / 2)

  // 限制范围
  const minOffset = -(totalWidth - containerWidth)
  thumbnailsOffset.value = Math.max(minOffset, Math.min(0, targetOffset))
}

// 获取优化后的图片URL（缩略图）
const getOptimizedImageUrl = (src: string): string => {
  return src
}

// 获取标签颜色
const getTagColor = (tagId: string): string => {
  const tag = siteConfig.tags.find(t => t.id === tagId)
  return tag?.color || '#8b5cf6'
}

// 获取标签名称
const getTagName = (tagId: string): string => {
  const tag = siteConfig.tags.find(t => t.id === tagId)
  return tag ? t(tag.name, currentLanguage.value) : tagId
}

// 关闭查看器
const isClosing = ref(false)
const close = () => {
  // 设置关闭状态
  isClosing.value = true
  // 先添加淡出过渡动画，再关闭查看器
  transitionActive.value = false
  
  setTimeout(() => {
    emit('close')
    // 重置关闭状态，以便下次打开
    isClosing.value = false
  }, 400) // 等待过渡动画完成
}

// 键盘事件
const handleKeyDown = (event: KeyboardEvent) => {
  if (!props.isActive) return

  switch (event.key) {
    case 'Escape':
      close()
      break
    case 'ArrowLeft':
      prevImage()
      break
    case 'ArrowRight':
      nextImage()
      break
  }
}

// 监听图片变化
watch(currentImage, () => {
  updateThumbnailsOffset()
})

// 监听激活状态
watch(() => props.isActive, (newValue) => {
  if (newValue) {
    // 重置关闭状态
    isClosing.value = false
    
    // 组件激活时，先添加可见样式，然后再添加过渡动画样式
    nextTick(() => {
      setTimeout(() => {
        transitionActive.value = true
      }, 50)
    })
  } else {
    // 组件隐藏时的处理已移至close函数
    // 这里不需要额外处理，因为close函数会设置transitionActive.value = false
  }
}, { immediate: true })

// 监听窗口大小变化
const handleResize = () => {
  updateThumbnailsOffset()
}

onMounted(() => {
  window.addEventListener('keydown', handleKeyDown)
  window.addEventListener('resize', handleResize)
  nextTick(() => {
    updateThumbnailsOffset()
    // 滚动到当前图片位置
    const activeThumb = document.querySelector('.thumbnail-button.active')
    if (activeThumb) {
      activeThumb.scrollIntoView({ behavior: 'smooth', inline: 'center' })
    }
  })
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeyDown)
  window.removeEventListener('resize', handleResize)
})

// 本地化辅助函数
const t = (text: I18nText | string | undefined, lang?: string) => {
  if (!text) return ''
  if (typeof text === 'string') return text
  if (!lang) return text.zh || text.en || ''
  return text[lang as keyof I18nText] || text.en || ''
}
</script>

<style scoped>
.fullscreen-viewer {
  position: fixed;
  inset: 0;
  z-index: 50;
  background-color: rgba(0, 0, 0, 0.9);
  display: flex;
  flex-direction: column;
  visibility: hidden;
  opacity: 0;
  outline: none;
  will-change: opacity, visibility;
}

.fullscreen-viewer.active {
  visibility: visible;
  opacity: 0;
}

.fullscreen-viewer.transition-active {
  transition: opacity 400ms ease;
  opacity: 1;
}

/* 关闭动画 - 与打开动画相同，只有不透明度变化 */
.fullscreen-viewer.closing {
  transition: opacity 400ms ease;
  opacity: 0;
}

.viewer-header {
  @apply flex items-center justify-between;
  @apply py-3 px-4;
  @apply bg-black/50;
}

.viewer-title {
  @apply text-white text-lg font-medium truncate;
}

.viewer-controls {
  @apply flex items-center gap-2;
}

.control-button {
  @apply p-2 rounded-full;
  @apply text-gray-200 hover:text-white;
  @apply bg-gray-800/60 hover:bg-gray-700/60;
  @apply transition-colors duration-200;
}

.control-button.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.close-button {
  @apply bg-red-800/60 hover:bg-red-700/60;
  @apply ml-2;
}

.icon {
  @apply w-5 h-5;
}

.viewer-content {
  @apply flex-1 overflow-hidden;
  @apply flex items-center justify-center;
  @apply relative;
}

.image-container {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

/* 图像切换过渡动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* 移除了图像和信息面板的单独关闭动画 */

.viewer-navigation {
  @apply flex items-center;
  @apply h-24 py-2 px-4;
  @apply bg-black/50;
}

.nav-button {
  @apply flex items-center justify-center;
  @apply w-10 h-10 rounded-full;
  @apply text-gray-200 hover:text-white;
  @apply bg-gray-800/60 hover:bg-gray-700/60;
  @apply transition-colors duration-200;
}

.nav-button:disabled {
  @apply opacity-30 cursor-not-allowed;
}

.image-thumbnails-container {
  @apply flex-1 overflow-hidden mx-3;
}

.image-thumbnails {
  @apply flex items-center gap-2;
  @apply transition-transform duration-300 ease-out;
}

.thumbnail-button {
  @apply w-16 h-16 rounded-md overflow-hidden;
  @apply border-2 border-transparent;
  @apply transition-all duration-200;
  @apply flex-shrink-0;
}

.thumbnail-button.active {
  @apply border-blue-500;
}

.thumbnail-image {
  @apply w-full h-full object-contain;
  background-color: rgba(0, 0, 0, 0.2);
}

/* 已删除小地图相关样式 */

.viewer-footer {
  padding: 1rem 1.5rem;
  background-color: rgba(0, 0, 0, 0.5);
  position: relative;
  max-height: 24rem;
  overflow: hidden;
}

/* 添加滑动动画 */
.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  max-height: 24rem;
}

.slide-fade-enter-active .image-info,
.slide-fade-leave-active .image-info {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.slide-fade-enter-from,
.slide-fade-leave-to {
  max-height: 0;
  padding-top: 0;
  padding-bottom: 0;
}

.slide-fade-enter-from .image-info,
.slide-fade-leave-to .image-info {
  opacity: 0;
  transform: translateY(10px);
}

.info-toggle-button {
  @apply absolute top-0 left-1/2;
  @apply -translate-x-1/2 -translate-y-1/2;
  @apply flex items-center justify-center;
  @apply w-10 h-10 rounded-full;
  @apply text-gray-200 hover:text-white;
  @apply bg-gray-800/80 hover:bg-gray-700/80;
  @apply shadow-lg;
  @apply transition-colors duration-200;
  @apply cursor-pointer;
  @apply z-10;
}

.image-info {
  @apply text-white;
  will-change: opacity, transform;
  transform: translateY(0);
  opacity: 1;
}

.info-group {
  @apply mb-3;
}

.info-title {
  @apply text-xl font-bold mb-1;
}

.info-subtitle {
  @apply text-sm uppercase tracking-wider text-gray-400 mb-1;
}

.info-description {
  @apply text-gray-300 mb-2;
}

.tags-list {
  @apply flex flex-wrap gap-1;
}

.tag {
  @apply px-2 py-0.5 rounded-full;
  @apply text-xs text-white;
}
</style>
