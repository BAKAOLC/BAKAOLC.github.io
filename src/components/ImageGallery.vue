<template>
  <div class="image-gallery">
    <div v-if="images.length === 0" class="no-images">
      {{ $t('gallery.noImages') }}
    </div>

    <div v-else :class="{ 'image-grid': gridView, 'image-list': !gridView }">
      <div v-for="image in images" :key="image.id" :class="{ 'image-card': gridView, 'image-list-item': !gridView }"
        @click="viewImage(image)">
        <div class="image-container">
          <img :src="getOptimizedImageUrl(image.src)" :alt="t(image.name, currentLanguage)" loading="lazy"
            class="image" />
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
import type { I18nText, CharacterImage } from '@/types'

defineProps<{
  images: CharacterImage[]
  gridView: boolean
}>()

const { t: $t } = useI18n() // 用于模板中的翻译
const appStore = useAppStore()

const currentLanguage = computed(() => appStore.currentLanguage)

// 获取优化后的图片URL（缩略图）
const getOptimizedImageUrl = (src: string): string => {
  // 如果图片已经有缩略图，直接使用缩略图
  // 否则使用原图，但可以添加图片处理参数
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

// 查看图片
const viewImage = (image: CharacterImage) => {
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
  @apply bg-gray-100 dark:bg-gray-900;
}

.image-card .image-container {
  width: 100%;
  height: 200px;
  /* 固定高度 */
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: visible;
  /* 允许图片溢出，确保完整显示 */
  @apply bg-gray-100 dark:bg-gray-800;
  /* 背景颜色，深色模式适配 */
  margin-bottom: 1rem;
  /* 添加底部边距，防止溢出内容重叠 */
}

.image-list-item .image-container {
  width: 120px;
  height: 120px;
  flex-shrink: 0;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: visible;
  /* 允许图片溢出，确保完整显示 */
  @apply bg-gray-100 dark:bg-gray-800;
  /* 背景颜色，深色模式适配 */
  border-radius: 0.5rem;
  /* 圆角 */
  margin-right: 1rem;
  /* 添加右侧边距 */
}

.image {
  @apply transition-transform duration-300;
  max-width: 100%;
  max-height: 100%;
  width: auto;
  height: auto;
  object-fit: contain;
  /* 确保图像保持其纵横比并完全可见 */
}

.image-card:hover .image,
.image-list-item:hover .image {
  transform: scale(1.05);
  z-index: 5;
  /* 确保悬停时图片在最上层，不被其他元素遮挡 */
}

.image-info {
  @apply p-3;
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

.image-tags {
  @apply flex flex-wrap gap-1;
}

.image-tag {
  @apply px-1.5 py-0.5 rounded-full;
  @apply text-white text-xs;
  @apply whitespace-nowrap;
  @apply opacity-90;
}
</style>
