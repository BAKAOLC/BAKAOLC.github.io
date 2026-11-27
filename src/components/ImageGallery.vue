<template>
  <div class="image-gallery" role="region" :aria-label="$t('gallery.imageDisplayArea')">
    <div v-if="images.length === 0" class="no-images" role="status" aria-live="polite">
      <i class="fas fa-images no-images-icon" aria-hidden="true"></i>
      <p class="no-images-text">{{ $t('gallery.noImages') }}</p>
    </div>

    <div
      v-else
      :class="{
        'image-grid': gridView,
        'image-list': !gridView,
      }"
      role="grid"
      :aria-label="gridView ? $t('gallery.gridView') : $t('gallery.listView')"
    >
      <article
        v-for="image in images"
        :key="image.id"
        :class="{ 'image-card': gridView, 'image-list-item': !gridView }"
        role="gridcell"
        :tabindex="0"
        :aria-label="getImageAriaLabel(image)"
        :aria-describedby="`image-${image.id}-description`"
        @click="viewImage(image)"
        @keydown.enter="viewImage(image)"
        @keydown.space.prevent="viewImage(image)"
      >
        <div class="image-container">
          <ProgressiveImage
            v-if="image.displaySrc"
            :src="image.displaySrc"
            :alt="getImageAltText(image)"
            class="image"
            image-class="gallery-image"
            object-fit="contain"
            :show-loader="false"
            :show-progress="false"
            preload-size="tiny"
            display-type="thumbnail"
            display-size="medium"
            :delay-main-image="40"
          />
          <div
            v-else
            class="no-image-placeholder"
            :title="t(image.name, currentLanguage)"
            role="img"
            :aria-label="$t('gallery.noImageAvailable')"
          >
            <svg class="placeholder-icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path
                d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z
                   M9 17l1.5-2L12 17h7V5H5v12z"
              />
            </svg>
          </div>

          <div
            v-if="isImageGroup(image)"
            class="group-indicator"
            :title="$t('gallery.imageGroup')"
            role="img"
            :aria-label="$t('gallery.imageGroup')"
          >
            <LayersIcon class="group-icon" aria-hidden="true" />
          </div>
        </div>

        <div class="image-info">
          <h3 class="image-name">{{ t(image.name, currentLanguage) }}</h3>

          <div class="image-meta">
            <div class="image-tags" role="list" :aria-label="$t('gallery.tags')">
              <span
                v-for="tagId in getSortedTags(getAllImageTags(image))"
                :key="tagId"
                class="image-tag"
                :style="{ backgroundColor: getTagColor(tagId) }"
                role="listitem"
              >
                {{ getTagName(tagId, currentLanguage) }}
              </span>
            </div>
          </div>

          <div :id="`image-${image.id}-description`" class="sr-only">
            {{ getImageDescription(image) }}
          </div>
        </div>
      </article>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Layers as LayersIcon } from '@lucide/vue';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

import ProgressiveImage from './ProgressiveImage.vue';

import { useEventManager } from '@/composables/useEventManager';
import { useTags } from '@/composables/useTags';
import { useGalleryStore } from '@/stores/gallery';
import { useLanguageStore } from '@/stores/language';
import type { DisplayImage, I18nText } from '@/types';
import { getI18nText } from '@/utils/i18nText';

defineProps<{
  images: DisplayImage[];
  gridView: boolean;
}>();

const { t: $t } = useI18n();
const galleryStore = useGalleryStore();
const languageStore = useLanguageStore();
const eventManager = useEventManager();
const { getSortedTags, getTagColor, getTagName } = useTags();

const currentLanguage = computed(() => languageStore.currentLanguage);

const getAllImageTags = (image: DisplayImage): string[] => {
  const allTags = new Set<string>();

  if (!image.childImages) {
    image.tags?.forEach(tag => allTags.add(tag));
    return Array.from(allTags);
  }

  const validChildImages = image.childImages.filter(child => {
    const fullChildImage = galleryStore.getChildImageWithDefaults(image, child);
    return doesImagePassCurrentFilter(fullChildImage);
  });

  image.tags?.forEach(tag => allTags.add(tag));

  if (validChildImages.length > 0) {
    validChildImages.forEach(child => {
      if (child.tags) {
        child.tags.forEach(tag => allTags.add(tag));
      }
    });
  }

  return Array.from(allTags);
};

const doesImagePassCurrentFilter = (image: DisplayImage): boolean => {
  const allRestrictedTags = galleryStore.tags.filter(tag => tag.isRestricted);

  for (const restrictedTag of allRestrictedTags) {
    const imageHasTag = image.tags?.includes(restrictedTag.id);
    const tagIsEnabled = galleryStore.getRestrictedTagState(restrictedTag.id);

    if (imageHasTag && !tagIsEnabled) {
      return false;
    }
  }

  return true;
};

const isImageGroup = (image: DisplayImage): boolean => {
  let originalImage = image;
  if (image && image.id) {
    const originalFromStore = galleryStore.getImageById(image.id);
    if (originalFromStore) {
      originalImage = originalFromStore;
    }
  }

  if (!originalImage || !originalImage.childImages) {
    return false;
  }

  const validChildren = galleryStore.getValidImagesInGroup(originalImage);
  return validChildren.length > 1;
};

const t = (text: I18nText | undefined, lang?: string): string => {
  if (typeof text === 'string') return text;
  const currentLang = lang ?? currentLanguage.value;
  return getI18nText(text, currentLang);
};

const getImageAltText = (image: DisplayImage): string => {
  const name = t(image.name, currentLanguage.value);
  const tags = getAllImageTags(image).map(tagId => getTagName(tagId, currentLanguage.value)).join(', ');
  const isGroup = isImageGroup(image);

  let altText = name;
  if (tags) {
    altText += `, ${$t('gallery.tags')}: ${tags}`;
  }
  if (isGroup) {
    altText += `, ${$t('gallery.imageGroup')}`;
  }

  return altText;
};

const getImageAriaLabel = (image: DisplayImage): string => {
  const name = t(image.name, currentLanguage.value);
  const isGroup = isImageGroup(image);
  const groupText = isGroup ? `, ${$t('gallery.imageGroup')}` : '';
  return `${name}${groupText}, ${$t('gallery.clickToView')}`;
};

const getImageDescription = (image: DisplayImage): string => {
  const name = t(image.name, currentLanguage.value);
  const tags = getAllImageTags(image).map(tagId => getTagName(tagId, currentLanguage.value));
  const isGroup = isImageGroup(image);

  let description = `${$t('gallery.imageName')}: ${name}`;

  if (tags.length > 0) {
    description += `. ${$t('gallery.tags')}: ${tags.join(', ')}`;
  }

  if (isGroup) {
    description += `. ${$t('gallery.imageGroupDescription')}`;
  }

  description += `. ${$t('gallery.clickToViewDescription')}`;

  return description;
};

const viewImage = (image: DisplayImage): void => {
  if (!image || !image.id) {
    console.warn('Invalid image data, cannot view');
    return;
  }

  eventManager.dispatchEvent('viewImage', { imageId: image.id });
};
</script>

<style scoped>
@reference "@/assets/styles/main.css";

.image-gallery {
  width: 100%;
}

.no-images {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 4rem 1.5rem;
  text-align: center;
  color: var(--text-muted);
  background: var(--surface-card);
  border: 1px dashed var(--border-default);
  border-radius: var(--radius-card);
}

.no-images-icon {
  font-size: 2.25rem;
  opacity: 0.55;
}

.no-images-text {
  margin: 0;
  font-size: 0.9375rem;
}

/* Fluid responsive artbook grid */
.image-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(205px, 1fr));
  gap: 0.875rem;
  width: 100%;
}

.image-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  width: 100%;
}

.image-card,
.image-list-item {
  background: var(--surface-card);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-sm);
  overflow: hidden;
  cursor: pointer;
  transition:
    transform 0.22s var(--ease-out-expo),
    box-shadow 0.22s var(--ease-out-expo),
    border-color 0.18s ease;
}

.image-card {
  display: flex;
  flex-direction: column;
}

.image-card:hover {
  transform: translateY(-3px);
  border-color: color-mix(in srgb, var(--accent-primary) 42%, var(--border-default));
  box-shadow: var(--shadow-md);
}

.image-list-item {
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 0.625rem;
  gap: 1rem;
}

.image-list-item:hover {
  transform: translateY(-2px);
  border-color: color-mix(in srgb, var(--accent-primary) 42%, var(--border-default));
  box-shadow: var(--shadow-md);
}

.image-card:focus-visible,
.image-list-item:focus-visible {
  outline: 2px solid var(--accent-primary);
  outline-offset: 2px;
}

.image-container {
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--surface-muted);
}

.image-card .image-container {
  width: 100%;
  aspect-ratio: 4 / 3;
  padding: 0.375rem;
  box-sizing: border-box;
  border-bottom: 1px solid var(--border-subtle);
}

.image-list-item .image-container {
  width: 104px;
  height: 104px;
  flex-shrink: 0;
  border-radius: 0.75rem;
  padding: 0.25rem;
  box-sizing: border-box;
}

.progressive-image {
  transition: transform 0.28s var(--ease-out-expo);
}

.image-card:hover .progressive-image,
.image-list-item:hover .progressive-image {
  transform: scale(1.04);
}

.group-indicator {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.75rem;
  height: 1.75rem;
  border-radius: 9999px;
  background: rgba(15, 23, 42, 0.72);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: #ffffff;
  box-shadow: var(--shadow-sm);
  z-index: 10;
}

.group-icon {
  width: 0.9rem;
  height: 0.9rem;
}

.image-info {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
}

.image-card .image-info {
  padding: 0.75rem 0.75rem 0.85rem;
  text-align: center;
  flex: 1;
  justify-content: space-between;
}

.image-list-item .image-info {
  flex: 1;
  min-width: 0;
  text-align: left;
}

.image-name {
  margin: 0;
  font-size: 0.875rem;
  font-weight: 600;
  line-height: 1.35;
  color: var(--text-primary);
}

.image-card .image-name {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  word-break: break-word;
}

.image-list-item .image-name {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.image-meta {
  display: flex;
  align-items: center;
}

.image-card .image-meta {
  justify-content: center;
}

.image-list-item .image-meta {
  justify-content: flex-start;
}

.image-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.3rem;
}

.image-card .image-tags {
  justify-content: center;
}

.image-tag {
  display: inline-flex;
  align-items: center;
  padding: 0.15rem 0.5rem;
  border-radius: 9999px;
  color: #ffffff;
  font-size: 0.6875rem;
  font-weight: 500;
  line-height: 1.25;
  white-space: nowrap;
}

.no-image-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
}

.placeholder-icon {
  width: 2rem;
  height: 2rem;
  opacity: 0.55;
}

@media (max-width: 640px) {
  .image-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.625rem;
  }

  .image-card .image-container {
    aspect-ratio: 1 / 1;
  }

  .image-card .image-info {
    padding: 0.55rem 0.55rem 0.65rem;
    gap: 0.35rem;
  }

  .image-name {
    font-size: 0.8rem;
  }

  .image-list-item {
    padding: 0.5rem;
    gap: 0.75rem;
  }

  .image-list-item .image-container {
    width: 80px;
    height: 80px;
  }
}

@media (prefers-contrast: high) {
  .image-card,
  .image-list-item {
    border-width: 2px;
  }
}
</style>
