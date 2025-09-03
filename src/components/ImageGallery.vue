<template>
  <div class="image-gallery">
    <div v-if="images.length === 0" class="no-images">
      {{ $t('gallery.noImages') }}
    </div>

    <div
      v-else
      :class="{
        'image-grid': gridView,
        'image-list': !gridView,
        'transitioning': isTransitioning
      }"
      :key="transitionKey"
    >
        <div
          v-for="image in images"
          :key="image.id"
          :class="{ 'image-card': gridView, 'image-list-item': !gridView }"
          @click="viewImage(image)"
        >
          <div class="image-container">
            <ProgressiveImage
              :src="image.src"
              :alt="t(image.name, currentLanguage)"
              class="image"
              image-class="gallery-image"
              object-fit="contain"
              :show-loader="false"
              :show-progress="false"
              preload-size="tiny"
              display-type="thumbnail"
              display-size="medium"
              :delay-main-image="50"
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
import { computed, ref, watch, nextTick } from 'vue';
import { useI18n } from 'vue-i18n';

import { useEventManager } from '@/composables/useEventManager';

import ProgressiveImage from './ProgressiveImage.vue';

import type { I18nText, CharacterImage } from '@/types';

import { siteConfig } from '@/config/site';
import { useAppStore } from '@/stores/app';

const props = defineProps<{
  images: CharacterImage[];
  gridView: boolean;
}>();

const isTransitioning = ref(false);
const transitionKey = ref(0);

watch(() => props.gridView, async (newView, oldView) => {
  if (newView !== oldView) {
    isTransitioning.value = true;
    transitionKey.value++;

    await nextTick();

    setTimeout(() => {
      isTransitioning.value = false;
    }, 200);
  }
});

watch(() => props.images, async (newImages, oldImages) => {
  if (oldImages && newImages !== oldImages) {
    isTransitioning.value = true;
    transitionKey.value++;

    await nextTick();

    setTimeout(() => {
      isTransitioning.value = false;
    }, 100);
  }
}, { deep: true });

const { t: $t } = useI18n();
const appStore = useAppStore();
const eventManager = useEventManager();

const currentLanguage = computed(() => appStore.currentLanguage);

const getTagColor = (tagId: string): string => {
  const tag = siteConfig.tags.find(t => t.id === tagId);
  return tag?.color || '#8b5cf6';
};

const getTagName = (tagId: string): string => {
  const tag = siteConfig.tags.find(t => t.id === tagId);
  return tag ? t(tag.name, currentLanguage.value) : tagId;
};

const viewImage = (image: CharacterImage): void => {
  if (!image || !image.id) {
    console.warn('无效的图片数据，无法查看');
    return;
  }

  eventManager.dispatchEvent('viewImage', { imageId: image.id });
};

const t = (text: I18nText | string, lang?: string): string => {
  if (typeof text === 'string') return text;
  if (!lang) return text.zh || text.en || '';
  return text[lang as keyof I18nText] || text.en || '';
};
</script>

<style scoped>
.image-gallery {
  @apply w-full;
}

.aspect-ratio-box {
  position: relative;
  width: 100%;
}

.no-images {
  @apply text-center py-12 text-gray-500 dark:text-gray-400;
  @apply text-lg italic;
}

.image-grid {
  @apply grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 gap-3;
  padding-right: 8px;
  width: 100%;
  padding-bottom: 1rem;
  transition: all 0.2s ease-out;
  transform-origin: center;
  position: relative;
}

@media (max-width: 640px) {
  .image-grid {
    @apply grid-cols-2 gap-2;
    padding-bottom: 2rem;
  }
}

.image-list {
  @apply flex flex-col gap-4;
  padding-right: 8px;
  width: 100%;
  transition: all 0.2s ease-out;
  transform-origin: center;
  position: relative;
}

.transitioning {
  pointer-events: none;
}

.transitioning .image-card,
.transitioning .image-list-item {
  opacity: 0;
  transform: scale(0.95);
  transition: all 0.1s ease-out;
}

.image-card,
.image-list-item {
  will-change: transform, opacity;
  backface-visibility: hidden;
  transform-style: preserve-3d;
}

@media (prefers-reduced-motion: reduce) {
  .transitioning .image-card,
  .transitioning .image-list-item {
    transition: none !important;
    animation: none !important;
  }
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
  height: 160px; /* 减小默认高度 */
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  @apply rounded-lg;
  margin-bottom: 0.75rem; /* 减小间距 */
}

@media (max-width: 640px) {
  .image-card .image-container {
    height: 120px; /* 移动端进一步减小高度 */
    margin-bottom: 0.5rem;
  }
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
    @apply text-center p-2; /* 移动端减小内边距 */
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

@media (max-width: 640px) {
  .image-name {
    @apply text-xs mb-1; /* 移动端更小的字体和间距 */
  }
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

@media (max-width: 640px) {
  .image-tag {
    @apply px-1 py-0.5 text-xs; /* 移动端更紧凑的标签 */
    font-size: 10px; /* 更小的字体 */
  }
}

</style>
