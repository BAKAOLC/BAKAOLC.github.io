<template>
  <section class="gallery-page" :aria-label="$t('gallery.galleryTitle')">
    <div class="gallery-shell">
      <header class="gallery-header">
        <div class="gallery-heading">
          <h1 class="gallery-title">{{ $t('gallery.title') }}</h1>
          <span
            v-if="searchQuery"
            id="search-results-info"
            class="search-results-badge"
            aria-live="polite"
          >
            {{ $t('gallery.searchResults') }}: {{ characterImages.length }}
            {{ $t('gallery.imageCount', { count: characterImages.length }) }}
          </span>
        </div>

        <!-- 统一搜索与控制栏 -->
        <div class="page-toolbar gallery-toolbar" role="search" :aria-label="$t('gallery.searchImages')">
          <div class="page-toolbar-input-wrap">
            <label for="gallery-search" class="sr-only">{{ $t('gallery.searchPlaceholder') }}</label>
            <i class="fas fa-search page-toolbar-search-icon" aria-hidden="true"></i>
            <input
              id="gallery-search"
              ref="searchInput"
              type="text"
              :value="searchQuery"
              :placeholder="$t('gallery.searchPlaceholder')"
              class="page-toolbar-input"
              :aria-describedby="searchQuery ? 'search-results-info' : undefined"
              autocomplete="off"
              @input="(e: Event) => updateSearchQuery((e.target as HTMLInputElement).value)"
            />
            <button
              v-if="searchQuery"
              type="button"
              class="page-toolbar-clear"
              :aria-label="$t('gallery.clearSearch')"
              @click="clearSearch"
            >
              <i :class="getIconClass('times')" aria-hidden="true"></i>
            </button>
          </div>

          <div class="page-toolbar-actions" role="group" :aria-label="$t('gallery.galleryControls')">
            <SortSelector />
            <button
              type="button"
              class="page-toolbar-btn sort-order-button"
              :title="$t(sortOrder === 'asc' ? 'gallery.sortAsc' : 'gallery.sortDesc')"
              :aria-label="$t(sortOrder === 'asc' ? 'gallery.sortAsc' : 'gallery.sortDesc')"
              @click="toggleSortOrder"
            >
              <i
                :class="getIconClass(sortOrder === 'asc' ? 'sort-alpha-down' : 'sort-alpha-up')"
                aria-hidden="true"
              ></i>
              <span class="btn-label">{{ $t(sortOrder === 'asc' ? 'gallery.sortAsc' : 'gallery.sortDesc') }}</span>
            </button>
            <button
              type="button"
              class="page-toolbar-btn grid-view-toggle"
              :aria-label="$t(isGridView ? 'gallery.listView' : 'gallery.gridView')"
              :aria-pressed="isGridView"
              @click="toggleGridView"
            >
              <i :class="getIconClass(isGridView ? 'th' : 'list')" aria-hidden="true"></i>
              <span class="btn-label">{{ $t(isGridView ? 'gallery.listView' : 'gallery.gridView') }}</span>
            </button>
          </div>
        </div>
      </header>

      <div class="gallery-content">
        <aside class="gallery-sidebar" role="complementary" :aria-label="$t('gallery.filters')">
          <button
            class="sidebar-toggle"
            type="button"
            :aria-expanded="isMobileSidebarOpen"
            :aria-controls="isMobileSidebarOpen ? 'mobile-filter-content' : undefined"
            @click="toggleMobileSidebar"
          >
            <span class="sidebar-toggle-left">
              <i :class="getIconClass('filter')" class="icon" aria-hidden="true"></i>
              <span>{{ $t('gallery.filters') }}</span>
            </span>
            <i class="fas fa-sliders-h sidebar-toggle-chevron" aria-hidden="true"></i>
          </button>

          <div class="sidebar-content" :aria-hidden="isMobile">
            <CharacterSelector />
            <TagSelector />
            <RestrictedTagSelector />
          </div>
        </aside>

        <section
          ref="galleryMain"
          class="gallery-main"
          role="region"
          :aria-label="$t('gallery.imageDisplayArea')"
          @scroll="handleScroll"
        >
          <div
            v-if="galleryStore.isConfigLoading && !galleryStore.isConfigLoaded"
            class="gallery-state"
            role="status"
            aria-live="polite"
          >
            <i class="fas fa-spinner fa-spin state-icon" aria-hidden="true"></i>
            <span>{{ $t('common.loading') }}</span>
          </div>
          <div
            v-else-if="galleryStore.configLoadError"
            class="gallery-state gallery-state-error"
            role="alert"
          >
            <i class="fas fa-exclamation-triangle state-icon" aria-hidden="true"></i>
            <span>{{ $t('common.error') }}</span>
          </div>
          <ImageGallery v-else :images="characterImages" :grid-view="isGridView" />
        </section>
      </div>
    </div>

    <MobileFilterOverlay
      :visible="isMobileSidebarOpen"
      :title="$t('gallery.filters')"
      :close-label="$t('gallery.closeFilters')"
      body-role="region"
      :body-aria-label="$t('gallery.filters')"
      @close="closeMobileSidebar"
    >
      <CharacterSelector />
      <TagSelector />
      <RestrictedTagSelector />
    </MobileFilterOverlay>

    <ScrollToTopButton
      :visible="showScrollToTop"
      :aria-label="$t('gallery.scrollToTop')"
      @click="scrollToTop"
    />
  </section>
</template>

<script setup lang="ts">
import { computed, defineAsyncComponent, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';

import CharacterSelector from '@/components/CharacterSelector.vue';
import ImageGallery from '@/components/ImageGallery.vue';
import RestrictedTagSelector from '@/components/RestrictedTagSelector.vue';
import TagSelector from '@/components/TagSelector.vue';
import MobileFilterOverlay from '@/components/ui/MobileFilterOverlay.vue';
import ScrollToTopButton from '@/components/ui/ScrollToTopButton.vue';
import SortSelector from '@/components/ui/SortSelector.vue';
import { useDebouncedSetter } from '@/composables/useDebouncedSetter';
import { useEventManager } from '@/composables/useEventManager';
import { useMobileFilterOverlay } from '@/composables/useMobileFilterOverlay';
import { useModalManager } from '@/composables/useModalManager';
import { useMobileDetection, type ScreenInfo } from '@/composables/useScreenManager';
import { useScrollToTop } from '@/composables/useScrollToTop';
import { siteConfig } from '@/config/site';
import { useGalleryStore } from '@/stores/gallery';
import type { ExternalImageInfo, GroupImage, ImageBase, ViewerUIConfig } from '@/types';
import { getIconClass } from '@/utils/icons';
import { encodeKey, parseParam } from '@/utils/idHashMap';

interface Props {
  imageId?: string;
  childImageId?: string;
  externalImage?: ExternalImageInfo;
}

const props = withDefaults(defineProps<Props>(), {
  imageId: undefined,
  childImageId: undefined,
  externalImage: undefined,
});

const { t: $t } = useI18n();
const router = useRouter();
const galleryStore = useGalleryStore();
const { addEventListener } = useEventManager();
const { isMobile, onScreenChange } = useMobileDetection();
const modalManager = useModalManager();
const ImageViewerModal = defineAsyncComponent(() => import('@/components/modals/ImageViewerModal.vue'));

const isGridView = ref(true);
const galleryMain = ref<HTMLElement | null>(null);
const searchInput = ref<HTMLInputElement | null>(null);
const {
  showScrollToTop,
  handleScroll,
  scrollToTop,
} = useScrollToTop(galleryMain);

const searchQuery = computed({
  get: () => galleryStore.searchQuery,
  set: (value: string) => galleryStore.setSearchQuery(value),
});

const characterImages = computed(() => galleryStore.characterImages);
const {
  setDebouncedValue: updateSearchQuery,
  setValueImmediately: setSearchQueryImmediately,
} = useDebouncedSetter<string>(value => {
  galleryStore.setSearchQuery(value);
});

const imageViewerModalId = ref<string | null>(null);
const mobileSidebarScrollLockId = 'gallery-mobile-sidebar';
const {
  isOpen: isMobileSidebarOpen,
  toggle: toggleMobileSidebar,
  close: closeMobileSidebar,
} = useMobileFilterOverlay(mobileSidebarScrollLockId);

const toggleGridView = (): void => {
  isGridView.value = !isGridView.value;
};

const handleScreenChange = (info: ScreenInfo): void => {
  if (!info.isMobile) {
    closeMobileSidebar();
  }
};

const handleKeydown = (event: KeyboardEvent): void => {
  if (event.key === 'Escape' && isMobileSidebarOpen.value) {
    closeMobileSidebar();
    return;
  }

  if (event.ctrlKey || event.metaKey) {
    switch (event.key) {
      case 'f':
      case 'F': {
        event.preventDefault();
        searchInput.value?.focus();
        break;
      }
      case 'g':
      case 'G': {
        event.preventDefault();
        toggleGridView();
        break;
      }
    }
  }

  if (isGridView.value && (event.key === 'ArrowUp' || event.key === 'ArrowDown'
      || event.key === 'ArrowLeft' || event.key === 'ArrowRight')) {
    handleGridNavigation(event);
  }
};

const handleGridNavigation = (event: KeyboardEvent): void => {
  const currentElement = event.target as HTMLElement;
  if (!currentElement || !currentElement.closest('.image-card')) return;

  const gridContainer = currentElement.closest('.image-grid');
  if (!gridContainer) return;

  const cards = Array.from(gridContainer.querySelectorAll('.image-card')) as HTMLElement[];
  const currentIndex = cards.indexOf(currentElement);

  if (currentIndex === -1) return;

  let nextIndex = currentIndex;
  const cols = getComputedStyle(gridContainer).gridTemplateColumns.split(' ').length;

  switch (event.key) {
    case 'ArrowUp':
      nextIndex = Math.max(0, currentIndex - cols);
      break;
    case 'ArrowDown':
      nextIndex = Math.min(cards.length - 1, currentIndex + cols);
      break;
    case 'ArrowLeft':
      nextIndex = Math.max(0, currentIndex - 1);
      break;
    case 'ArrowRight':
      nextIndex = Math.min(cards.length - 1, currentIndex + 1);
      break;
  }

  if (nextIndex !== currentIndex) {
    event.preventDefault();
    cards[nextIndex]?.focus();
  }
};

const clearSearch = (): void => {
  setSearchQueryImmediately('');
};

const sortOrder = computed({
  get: () => galleryStore.sortOrder,
  set: (value: 'asc' | 'desc') => galleryStore.sortOrder = value,
});

const toggleSortOrder = (): void => {
  sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc';
};

const openViewer = async (event: CustomEvent): Promise<void> => {
  if (!(event.detail && event.detail.imageId && typeof event.detail.imageId === 'string')) {
    console.warn('Invalid image ID, cannot open viewer');
    return;
  }

  await galleryStore.ensureConfigLoaded();

  const { imageId } = event.detail;
  let childImageId: string | undefined;

  const image = galleryStore.getImageById(imageId);
  if (image && 'childImages' in image) {
    const groupImage = image as GroupImage;
    const firstValidChildId = galleryStore.getFirstValidChildId(groupImage);

    if (firstValidChildId) {
      childImageId = firstValidChildId;
      const hashed = encodeKey([imageId, firstValidChildId]);
      if (hashed) {
        await router.push({ name: 'image-viewer', params: { imageId: hashed } });
      } else {
        await router.push({
          name: 'image-viewer-child',
          params: {
            imageId: imageId,
            childImageId: firstValidChildId,
          },
        });
      }
    } else {
      console.warn('Image group has no valid children, cannot open viewer');
      return;
    }
  } else {
    const hashed = encodeKey([imageId]);
    if (hashed) {
      await router.push({ name: 'image-viewer', params: { imageId: hashed } });
    } else {
      await router.push({ name: 'image-viewer', params: { imageId } });
    }
  }

  isModalFromGallery.value = true;

  imageViewerModalId.value = modalManager.open({
    id: `image-viewer-${Date.now()}`,
    component: ImageViewerModal,
    props: {
      imageId: imageId,
      childImageId: childImageId,
      imageList: characterImages.value,
      viewerUIConfig: siteConfig.features.viewerUI,
      commentsUniqueId: imageId,
      commentsPrefix: 'gallery-comment',
      onNavigate: handleViewerNavigate,
    },
    options: {
      fullscreen: true,
      closable: true,
      maskClosable: true,
      escClosable: true,
      destroyOnClose: true,
    },
    onClose: closeViewer,
  });
};

const openUrlViewer = async (): Promise<void> => {
  await galleryStore.ensureConfigLoaded();

  const urlData = getUrlImageData();
  if (urlData.imageList.length === 0) {
    router.replace({ name: 'gallery' });
    return;
  }

  isModalFromGallery.value = false;

  imageViewerModalId.value = modalManager.open({
    id: `url-image-viewer-${Date.now()}`,
    component: ImageViewerModal,
    props: {
      imageId: urlData.lookupImageId ?? props.imageId,
      childImageId: urlData.lookupChildId ?? props.childImageId,
      imageList: urlData.imageList,
      viewerUIConfig: urlData.viewerUIConfig,
      commentsUniqueId: urlData.lookupChildId ?? urlData.lookupImageId ?? props.imageId ?? props.childImageId,
      commentsPrefix: 'gallery-comment',
      onNavigate: handleViewerNavigate,
    },
    options: {
      fullscreen: true,
      closable: true,
      maskClosable: true,
      escClosable: true,
      destroyOnClose: true,
    },
    onClose: closeViewer,
  });
};

const openExternalImageViewer = (externalImage: ExternalImageInfo): void => {
  imageViewerModalId.value = modalManager.open({
    id: `external-image-viewer-${Date.now()}`,
    component: ImageViewerModal,
    props: {
      externalImage: externalImage,
      imageList: [],
      viewerUIConfig: {
        imageList: false,
        imageGroupList: false,
        viewerTitle: false,
        infoPanel: {
          title: false,
          description: false,
          artist: false,
          date: false,
          tags: false,
        },
        commentsButton: false,
      },
      onNavigate: handleViewerNavigate,
    },
    options: {
      fullscreen: true,
      closable: true,
      maskClosable: true,
      escClosable: true,
      destroyOnClose: true,
    },
    onClose: closeViewer,
  });
};

const handleViewerNavigate = async (imageId: string, childImageId?: string): Promise<void> => {
  if (childImageId && childImageId === imageId) {
    const possibleImage = galleryStore.getImageById(imageId);
    if (possibleImage && !('childImages' in possibleImage)) {
      childImageId = undefined;
    }
  }

  if (imageViewerModalId.value) {
    const modal = modalManager.getModal(imageViewerModalId.value);
    if (modal) {
      const currentViewingImageId = childImageId ?? imageId;
      modal.props = {
        ...modal.props,
        imageId: imageId,
        childImageId: childImageId,
        commentsUniqueId: currentViewingImageId,
      };
    }
  }

  if (childImageId) {
    const hashed = encodeKey([imageId, childImageId]);
    if (hashed) {
      await router.push({ name: 'image-viewer', params: { imageId: hashed } });
    } else {
      await router.push({ name: 'image-viewer-child', params: { imageId, childImageId } });
    }
  } else {
    const hashed = encodeKey([imageId]);
    if (hashed) {
      await router.push({ name: 'image-viewer', params: { imageId: hashed } });
    } else {
      await router.push({ name: 'image-viewer', params: { imageId } });
    }
  }
};

const closeViewer = (): void => {
  if (imageViewerModalId.value) {
    modalManager.close(imageViewerModalId.value);
    imageViewerModalId.value = null;
  }

  router.push('/gallery');
};

let unsubscribeScreenChange: (() => void) | null = null;

const getUrlImageData = (): {
  imageList: ImageBase[];
  viewerUIConfig: ViewerUIConfig;
  lookupImageId?: string;
  lookupChildId?: string;
} => {
  const urlViewerConfig = {
    ...siteConfig.features.viewerUI,
    imageList: false,
    imageGroupList: true,
  };

  if (!props.imageId) {
    return { imageList: [], viewerUIConfig: urlViewerConfig };
  }

  const parsedParam = parseParam(props.imageId);
  let lookupImageId = parsedParam.parts[0] as string | undefined;
  const lookupChildId: string | undefined = parsedParam.parts[1];
  if (!lookupImageId && props.imageId) lookupImageId = props.imageId as string;
  if (!lookupImageId) {
    return { imageList: [], viewerUIConfig: urlViewerConfig };
  }

  const image = galleryStore.getImageById(lookupImageId);
  if (!image) {
    return { imageList: [], viewerUIConfig: urlViewerConfig };
  }

  if (lookupChildId) {
    const childImage = galleryStore.getValidImagesInGroupWithoutFilter(image).filter(i => i.id === lookupChildId);
    if (childImage.length === 0) {
      return { imageList: [], viewerUIConfig: urlViewerConfig };
    }

    const resultImage: GroupImage = {
      ...image,
      childImages: childImage as ImageBase[],
    };

    return { imageList: [resultImage], viewerUIConfig: urlViewerConfig, lookupImageId, lookupChildId };
  }

  const childImage = galleryStore.getValidImagesInGroupWithoutFilter(image);

  const resultImage: GroupImage = {
    ...image,
    childImages: childImage as ImageBase[],
  };

  return {
    imageList: [resultImage],
    viewerUIConfig: urlViewerConfig,
    lookupImageId,
    lookupChildId,
  };
};

const isModalFromGallery = ref(false);

watch([() => props.imageId, () => props.childImageId, characterImages], () => {
  if (imageViewerModalId.value) {
    const parsedImage = parseParam(props.imageId);
    const decodedImageId = parsedImage.parts[0] ?? props.imageId;
    let decodedChildId: string | undefined = parsedImage.parts[1];
    if (!decodedChildId && props.childImageId) {
      const parsedChild = parseParam(props.childImageId);
      decodedChildId = parsedChild.parts[0] ?? parsedChild.parts[1] ?? props.childImageId;
    }

    const targetProps = {
      imageId: decodedImageId,
      childImageId: decodedChildId,
      commentsUniqueId: decodedChildId ?? decodedImageId,
      commentsPrefix: 'gallery-comment',
      onNavigate: handleViewerNavigate,
    };
    const modal = modalManager.getModal(imageViewerModalId.value);
    if (modal) {
      if (isModalFromGallery.value) {
        modal.props = {
          ...targetProps,
          imageList: characterImages.value,
          viewerUIConfig: siteConfig.features.viewerUI,
        };
      } else {
        const urlData = getUrlImageData();
        modal.props = {
          ...targetProps,
          imageList: urlData.imageList,
          viewerUIConfig: urlData.viewerUIConfig,
        };
      }
    }
  }
});

onMounted(() => {
  addEventListener('viewImage', openViewer);
  unsubscribeScreenChange = onScreenChange(handleScreenChange);
  addEventListener('keydown', handleKeydown);

  const galleryConfigLoad = galleryStore.ensureConfigLoaded().catch(error => {
    console.error('Failed to load gallery config:', error);
  });

  if (props.externalImage) {
    openExternalImageViewer(props.externalImage);
  } else if (props.imageId) {
    galleryConfigLoad.then(() => {
      void openUrlViewer();
    });
  }
});

onBeforeUnmount(() => {
  if (unsubscribeScreenChange) {
    unsubscribeScreenChange();
    unsubscribeScreenChange = null;
  }
});
</script>

<style scoped>
@reference "@/assets/styles/main.css";

.gallery-page {
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.gallery-shell {
  flex: 1 1 0%;
  min-height: 0;
  width: 100%;
  max-width: 1440px;
  margin: 0 auto;
  padding: 1rem 1.25rem 0;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  box-sizing: border-box;
}

.gallery-header {
  flex-shrink: 0;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem 1.25rem;
  padding-bottom: 0.875rem;
  border-bottom: 1px solid var(--border-subtle);
}

.gallery-heading {
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 0.625rem;
}

.gallery-title {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 800;
  letter-spacing: -0.02em;
  color: var(--text-primary);
}

.search-results-badge {
  display: inline-flex;
  align-items: center;
  padding: 0.2rem 0.625rem;
  border-radius: 9999px;
  background: var(--accent-soft);
  color: var(--accent-primary-hover);
  font-size: 0.75rem;
  font-weight: 600;
}

.dark .search-results-badge {
  color: var(--accent-primary);
}

.gallery-toolbar {
  flex: 1 1 420px;
  max-width: 720px;
}

.gallery-content {
  flex: 1 1 0%;
  min-height: 0;
  display: flex;
  flex-direction: row;
  gap: 1.25rem;
  overflow: hidden;
}

.gallery-sidebar {
  width: 17rem;
  flex-shrink: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  padding-bottom: 1rem;
}

.sidebar-toggle {
  display: none;
}

.sidebar-content {
  flex: 0 1 auto;
  max-height: 100%;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 0.875rem;
  background: var(--surface-card);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-sm);
  scrollbar-gutter: stable;
}

.gallery-main {
  flex: 1 1 0%;
  min-width: 0;
  min-height: 0;
  overflow-y: auto;
  padding: 0.125rem 0.25rem 1.5rem;
  scrollbar-gutter: stable;
}

.gallery-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  min-height: 18rem;
  color: var(--text-muted);
  font-size: 0.9375rem;
}

.state-icon {
  font-size: 1.75rem;
  color: var(--accent-primary);
}

.gallery-state-error,
.gallery-state-error .state-icon {
  color: var(--danger-text);
}

@media (min-width: 768px) and (max-width: 1024px) {
  .gallery-shell {
    padding: 0.875rem 0.875rem 0;
  }

  .gallery-sidebar {
    width: 15rem;
  }
}

@media (max-width: 767px) {
  .gallery-shell {
    padding: 0.75rem 0.75rem 0;
    gap: 0.75rem;
  }

  .gallery-header {
    flex-direction: column;
    align-items: stretch;
    gap: 0.625rem;
    padding-bottom: 0.75rem;
  }

  .gallery-title {
    font-size: 1.25rem;
  }

  .gallery-toolbar {
    flex: none;
    max-width: none;
    width: 100%;
  }

  .gallery-toolbar .btn-label {
    display: none;
  }

  .gallery-toolbar .page-toolbar-btn {
    min-width: 2.25rem;
    height: 2.125rem;
    padding: 0 0.55rem;
  }

  .gallery-toolbar .page-toolbar-input {
    height: 2.125rem;
  }

  .gallery-content {
    flex-direction: column;
    gap: 0.75rem;
  }

  .gallery-sidebar {
    width: 100%;
    padding-bottom: 0;
  }

  .sidebar-toggle {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    padding: 0.625rem 0.875rem;
    border-radius: var(--radius-control);
    background: var(--surface-card);
    border: 1px solid var(--border-subtle);
    color: var(--text-primary);
    font-size: 0.875rem;
    font-weight: 600;
    box-shadow: var(--shadow-xs);
    cursor: pointer;
  }

  .sidebar-toggle-left {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
  }

  .sidebar-toggle-chevron {
    color: var(--text-muted);
    font-size: 0.85rem;
  }

  .sidebar-content {
    display: none;
  }

  .gallery-main {
    padding: 0 0 4.5rem;
  }
}
</style>
