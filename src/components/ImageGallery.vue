<template>
  <div class="image-gallery">
    <div v-if="images.length === 0" class="no-images">
      {{ $t('gallery.noImages') }}
    </div>

    <div v-else :class="{ 'image-grid': gridView, 'image-list': !gridView }">
      <div v-for="image in images" :key="image.id" :class="{ 'image-card': gridView, 'image-list-item': !gridView }"
        @click="viewImage(image)">
        <div class="image-container">
          <ProgressiveImage 
            :src="image.src" 
            :alt="t(image.name, currentLanguage)" 
            class="image"
            image-class="gallery-image"
            object-fit="contain"
            :show-loader="true"
            preload-size="tiny"
            display-type="thumbnail"
            display-size="medium"
            :delay-main-image="100"
          />
        </div>

        <div class="image-info">
          <h3 class="image-name">{{ t(image.name, currentLanguage) }}</h3>

          <div class="image-meta">
            <div class="image-tags">
              <span v-for="tagId in image.tags" :key="tagId" class="image-tag"
                :style="{ backgroundColor: getTagColor(tagId) }">
                {{ getTagName(tagId) }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { siteConfig } from '@/config/site'
import { useAppStore } from '@/stores/app'
import ProgressiveImage from './ProgressiveImage.vue'
import type { I18nText, CharacterImage } from '@/types'

defineProps<{
  images: CharacterImage[]
  gridView: boolean
}>()

const { t: $t } = useI18n() // 用于模板中的翻译
const appStore = useAppStore()

const currentLanguage = computed(() => appStore.currentLanguage)

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

// 查看图片
const viewImage = (image: CharacterImage) => {
  if (!image || !image.id) {
    console.warn('无效的图片数据，无法查看')
    return
  }
  
  // 创建和触发自定义事件，由父组件处理
  const event = new CustomEvent('viewImage', { detail: { imageId: image.id } })
  window.dispatchEvent(event)
}

// 本地化辅助函数
const t = (text: I18nText | string, lang?: string) => {
  if (typeof text === 'string') return text
  if (!lang) return text.zh || text.en || ''
  return text[lang as keyof I18nText] || text.en || ''
}
</script>

<style scoped>
.image-gallery {
  @apply w-full;
}

/* 图片容器自适应样式 */
.aspect-ratio-box {
  position: relative;
  width: 100%;
}

.no-images {
  @apply text-center py-12 text-gray-500 dark:text-gray-400;
  @apply text-lg italic;
}

.image-grid {
  @apply grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5;
  padding-right: 8px;
  /* 增加右侧空间，保证滚动条有足够显示空间 */
  width: 100%;
}

.image-list {
  @apply flex flex-col gap-4;
  padding-right: 8px;
  /* 增加右侧空间，保证滚动条有足够显示空间 */
  width: 100%;
}

.image-card {
  @apply bg-white dark:bg-gray-800 rounded-lg overflow-hidden;
  @apply border border-gray-200 dark:border-gray-700;
  @apply shadow-sm hover:shadow-md;
  @apply transition-all duration-300;
  @apply cursor-pointer;
  @apply flex flex-col;
  @apply transform hover:scale-[1.02];
}

.image-list-item {
  @apply bg-white dark:bg-gray-800 rounded-lg overflow-hidden;
  @apply border border-gray-200 dark:border-gray-700;
  @apply shadow-sm hover:shadow-md;
  @apply transition-all duration-300;
  @apply cursor-pointer;
  @apply flex flex-row;
  @apply transform hover:scale-[1.01];
}

.image-container {
  @apply overflow-hidden;
}

.image-card .image-container {
  width: 100%;
  height: 200px;
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  @apply rounded-lg;
  margin-bottom: 1rem;
}

.image-list-item .image-container {
  width: 120px;
  height: 120px;
  flex-shrink: 0;
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  @apply rounded-lg;
  margin-right: 1rem;
}

.progressive-image {
  transition: transform 0.3s ease;
}

.image-card:hover .progressive-image,
.image-list-item:hover .progressive-image {
  transform: scale(1.05);
}

.image-info {
  @apply p-3;
}

@media (max-width: 640px) {
  .image-info {
    @apply text-center;
  }
}

.image-list-item .image-info {
  @apply flex-1 flex flex-col justify-center;
}

.image-name {
  @apply font-medium text-sm;
  @apply text-gray-900 dark:text-gray-100;
  @apply mb-2 truncate;
}

.image-meta {
  @apply flex items-center justify-between;
}

@media (max-width: 640px) {
  .image-meta {
    @apply justify-center;
  }
}

.image-tags {
  @apply flex flex-wrap gap-1;
}

@media (max-width: 640px) {
  .image-tags {
    @apply justify-center;
  }
}

.image-tag {
  @apply px-1.5 py-0.5 rounded-full;
  @apply text-white text-xs;
  @apply whitespace-nowrap;
  @apply opacity-90;
}
</style>
