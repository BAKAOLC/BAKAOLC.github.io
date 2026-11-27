<template>
  <div class="character-profiles-page">
    <div class="profiles-shell">
      <!-- 顶部角色 / 差分选择器 -->
      <div class="selector-section">
        <div class="selector-container">
          <!-- 角色选择器 -->
          <div class="character-selector">
            <div
              ref="characterScrollContainer"
              class="selector-scroll-container"
              :class="{ 'expanded': isCharacterListExpanded }"
            >
              <button
                v-for="character in characterProfiles"
                :key="character.id"
                :ref="element => setCharacterButtonRef(character.id, element)"
                type="button"
                :data-character-id="character.id"
                class="selector-button"
                :class="{ 'active': selectedCharacter?.id === character.id }"
                @click="selectCharacter(character)"
              >
                {{ getI18nText(character.name, currentLanguage) }}
              </button>
            </div>
            <button
              v-if="showCharacterExpandButton"
              type="button"
              class="expand-toggle-button"
              :aria-expanded="isCharacterListExpanded"
              @click="toggleCharacterListExpanded"
            >
              <i
                class="fa"
                :class="getIconClass(isCharacterListExpanded ? 'chevron-up' : 'chevron-down')"
                aria-hidden="true"
              ></i>
            </button>
          </div>

          <!-- 差分选择器 -->
          <div v-if="selectedCharacter" class="variant-selector">
            <div
              ref="variantScrollContainer"
              class="selector-scroll-container"
              :class="{ 'expanded': isVariantListExpanded }"
            >
              <button
                v-for="(variant, index) in selectedCharacter.variants"
                :key="variant.id"
                :ref="element => setVariantButtonRef(variant.id, element)"
                type="button"
                :data-variant-id="variant.id"
                class="selector-button variant-button"
                :class="{ 'active': selectedVariant?.id === variant.id }"
                @click="selectVariant(variant)"
              >
                <span class="variant-number">{{ index + 1 }}</span>
                <span>{{ getI18nText(variant.name, currentLanguage) }}</span>
              </button>
            </div>
            <button
              v-if="showVariantExpandButton"
              type="button"
              class="expand-toggle-button"
              :aria-expanded="isVariantListExpanded"
              @click="toggleVariantListExpanded"
            >
              <i
                class="fa"
                :class="getIconClass(isVariantListExpanded ? 'chevron-up' : 'chevron-down')"
                aria-hidden="true"
              ></i>
            </button>
          </div>
        </div>
      </div>

      <!-- 主内容区域 -->
      <div v-if="isProfilesLoading" class="empty-state" role="status" aria-live="polite">
        <i class="fas fa-spinner fa-spin state-icon" aria-hidden="true"></i>
        <h3>{{ $t('common.loading') }}</h3>
      </div>

      <div v-else-if="profilesLoadError" class="empty-state is-error" role="alert">
        <i class="fas fa-exclamation-triangle state-icon" aria-hidden="true"></i>
        <h3>{{ $t('common.error') }}</h3>
      </div>

      <div v-else-if="selectedCharacter && selectedVariant" class="profiles-workspace">
        <!-- 左侧设定信息卡片 -->
        <aside class="info-section" :aria-label="$t('characterProfiles.title')">
          <div ref="infoCardsContainer" class="info-cards">
            <article
              v-for="card in displayInfoCards"
              :key="card.id"
              class="info-card"
              :style="{ '--card-color': card.color ?? '#0ea5e9' }"
            >
              <h3 v-if="card.title" class="card-title">
                {{ getI18nText(card.title, currentLanguage) }}
              </h3>
              <p v-if="card.content" class="card-content">
                {{ getI18nText(card.content, currentLanguage) }}
              </p>
            </article>
          </div>
        </aside>

        <!-- 展示舞台 + 缩略图栏 -->
        <div class="showcase-section">
          <div class="main-image-stage">
            <div
              v-if="selectedImage"
              class="main-image-wrapper"
              role="button"
              tabindex="0"
              :aria-label="$t('gallery.viewFullscreen')"
              @click="openImageViewer(selectedImage)"
              @keydown.enter="openImageViewer(selectedImage)"
              @keydown.space.prevent="openImageViewer(selectedImage)"
            >
              <ProgressiveImage
                :key="selectedImage.id"
                :src="selectedImage.src"
                :alt="getI18nText(selectedImage.alt, currentLanguage)"
                class="main-image"
                object-fit="contain"
                display-type="original"
              />
              <span class="zoom-hint" aria-hidden="true">
                <i class="fas fa-expand"></i>
              </span>
            </div>
            <div v-else class="no-image-placeholder">
              <i class="fas fa-image" aria-hidden="true"></i>
              <p>{{ $t('characterProfiles.noImageSelected') }}</p>
            </div>
          </div>

          <!-- 缩略图栏（宽屏右侧竖排，中/小屏底部横排，均正常滚动不溢出） -->
          <div class="image-list-section">
            <div v-if="selectedVariant.images.length > 0" class="image-list">
              <button
                v-for="image in selectedVariant.images"
                :key="image.id"
                type="button"
                class="image-item"
                :class="{ 'active': selectedImage?.id === image.id }"
                :aria-pressed="selectedImage?.id === image.id"
                @click="selectImage(image)"
              >
                <ProgressiveImage
                  :src="image.src"
                  :alt="getI18nText(image.alt, currentLanguage)"
                  class="image-thumbnail"
                  object-fit="contain"
                  display-type="thumbnail"
                  display-size="medium"
                />
              </button>
            </div>
            <div v-else class="no-images-placeholder">
              <i class="fas fa-images" aria-hidden="true"></i>
              <p>{{ $t('characterProfiles.noImages') }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-else class="empty-state">
        <i class="fas fa-user-circle state-icon" aria-hidden="true"></i>
        <h3>{{ $t('characterProfiles.noCharacterSelected') }}</h3>
        <p>{{ $t('characterProfiles.selectCharacterToView') }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  computed,
  defineAsyncComponent,
  nextTick,
  onMounted,
  onUnmounted,
  ref,
  watch,
  type ComponentPublicInstance,
} from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';

import ProgressiveImage from '@/components/ProgressiveImage.vue';
import { useModalManager } from '@/composables/useModalManager';
import { loadCharacterProfilesConfig } from '@/config/characterProfiles';
import { useLanguageStore } from '@/stores/language';
import type { CharacterProfile, CharacterVariant, CharacterVariantImage } from '@/types';
import { getResizeObserverConstructor } from '@/utils/browser';
import { CharacterConfigManager } from '@/utils/characterConfigManager';
import { getI18nText } from '@/utils/i18nText';
import { getIconClass } from '@/utils/icons';
import { encodeKey, parseParam } from '@/utils/idHashMap';

useI18n();
const ImageViewerModal = defineAsyncComponent(() => import('@/components/modals/ImageViewerModal.vue'));
const languageStore = useLanguageStore();
const modalManager = useModalManager();
const route = useRoute();
const router = useRouter();

const currentLanguage = computed(() => languageStore.currentLanguage);

const characterProfiles = ref<CharacterProfile[]>([]);
const isProfilesLoading = ref(false);
const profilesLoadError = ref<unknown | null>(null);
const selectedCharacter = ref<CharacterProfile | null>(null);
const selectedVariant = ref<CharacterVariant | null>(null);
const selectedImage = ref<CharacterVariantImage | null>(null);

const isCharacterListExpanded = ref(false);
const isVariantListExpanded = ref(false);

const characterScrollContainer = ref<HTMLElement | null>(null);
const variantScrollContainer = ref<HTMLElement | null>(null);
const infoCardsContainer = ref<HTMLElement | null>(null);
const characterButtonRefs = new Map<string, HTMLElement>();
const variantButtonRefs = new Map<string, HTMLElement>();

const showCharacterExpandButton = ref(false);
const showVariantExpandButton = ref(false);

const checkOverflow = (element: HTMLElement | null): boolean => {
  if (!element) return false;
  return element.scrollWidth > element.clientWidth + 2;
};

const updateButtonVisibility = (): void => {
  nextTick(() => {
    showCharacterExpandButton.value = isCharacterListExpanded.value || checkOverflow(characterScrollContainer.value);
    showVariantExpandButton.value = isVariantListExpanded.value || checkOverflow(variantScrollContainer.value);
  });
};

type TemplateRefValue = Element | ComponentPublicInstance | null;

const setButtonRef = (
  refs: Map<string, HTMLElement>,
  id: string,
  element: TemplateRefValue,
): void => {
  if (element instanceof HTMLElement) {
    refs.set(id, element);
    return;
  }

  refs.delete(id);
};

const setCharacterButtonRef = (id: string, element: TemplateRefValue): void => {
  setButtonRef(characterButtonRefs, id, element);
};

const setVariantButtonRef = (id: string, element: TemplateRefValue): void => {
  setButtonRef(variantButtonRefs, id, element);
};

const scrollButtonIntoView = (refs: Map<string, HTMLElement>, id: string): void => {
  nextTick(() => {
    refs.get(id)?.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
      inline: 'center',
    });
  });
};

let characterResizeObserver: ResizeObserver | null = null;
let variantResizeObserver: ResizeObserver | null = null;

const createButtonVisibilityResizeObserver = (): ResizeObserver | null => {
  const ResizeObserverConstructor = getResizeObserverConstructor();
  if (!ResizeObserverConstructor) return null;

  return new ResizeObserverConstructor(() => {
    updateButtonVisibility();
  });
};

const toggleCharacterListExpanded = (): void => {
  isCharacterListExpanded.value = !isCharacterListExpanded.value;
  updateButtonVisibility();
};

const toggleVariantListExpanded = (): void => {
  isVariantListExpanded.value = !isVariantListExpanded.value;
  updateButtonVisibility();
};

const displayInfoCards = computed(() => {
  if (!selectedCharacter.value || !selectedVariant.value) {
    return [];
  }

  return CharacterConfigManager.getCharacterCards(
    selectedCharacter.value,
    currentLanguage.value,
    selectedVariant.value.id,
    selectedImage.value?.id,
  );
});

watch(displayInfoCards, () => {
  nextTick(() => {
    if (infoCardsContainer.value) {
      infoCardsContainer.value.scrollTop = 0;
    }
  });
});

const isInitializingFromUrl = ref(false);

const updateUrl = (characterId?: string, variantId?: string, imageId?: string): void => {
  if (isInitializingFromUrl.value) return;

  const params: Record<string, string> = {};
  const keyParts = [characterId, variantId, imageId].filter(Boolean) as string[];
  if (keyParts.length > 0) {
    const hashed = encodeKey(keyParts);
    if (hashed) {
      params.character = hashed;
    } else if (characterId) {
      params.character = characterId;
      if (variantId) params.variant = variantId;
      if (imageId) params.image = imageId;
    }
  }

  const currentCharacter = route.params.character as string | undefined;
  const currentVariant = route.params.variant as string | undefined;
  const currentImage = route.params.image as string | undefined;

  if (
    currentCharacter !== params.character
    || currentVariant !== params.variant
    || currentImage !== params.image
  ) {
    router.replace({
      name: 'character-profiles',
      params,
    });
  }
};

const selectCharacter = (character: CharacterProfile, skipUrlUpdate = false): void => {
  selectedCharacter.value = character;
  if (character.variants.length > 0) {
    selectVariant(character.variants[0], skipUrlUpdate);
  } else {
    selectedVariant.value = null;
    selectedImage.value = null;
    if (!skipUrlUpdate) {
      updateUrl(character.id);
    }
  }

  scrollButtonIntoView(characterButtonRefs, character.id);
};

const selectVariant = (variant: CharacterVariant, skipUrlUpdate = false): void => {
  selectedVariant.value = variant;

  if (variant.images.length > 0) {
    selectImage(variant.images[0], skipUrlUpdate);
  } else {
    selectedImage.value = null;
    if (!skipUrlUpdate && selectedCharacter.value) {
      updateUrl(selectedCharacter.value.id, variant.id);
    }
  }

  scrollButtonIntoView(variantButtonRefs, variant.id);
};

const selectImage = (image: CharacterVariantImage, skipUrlUpdate = false): void => {
  selectedImage.value = image;
  if (!skipUrlUpdate && selectedCharacter.value && selectedVariant.value) {
    updateUrl(selectedCharacter.value.id, selectedVariant.value.id, image.id);
  }
};

const openImageViewer = (image: CharacterVariantImage): void => {
  if (!selectedCharacter.value || !selectedVariant.value) return;

  const imageData = {
    id: image.id,
    src: image.src,
  };

  modalManager.open({
    id: `character-image-viewer-${Date.now()}`,
    component: ImageViewerModal,
    props: {
      imageId: image.id,
      imageList: [imageData],
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
    },
    options: {
      fullscreen: true,
      closable: true,
      maskClosable: true,
      escClosable: true,
      destroyOnClose: true,
    },
  });
};

watch([characterProfiles, currentLanguage], () => {
  updateButtonVisibility();
});

watch(selectedCharacter, () => {
  nextTick(() => {
    updateButtonVisibility();
    if (variantResizeObserver) {
      variantResizeObserver.disconnect();
    }
    if (variantScrollContainer.value) {
      variantResizeObserver = createButtonVisibilityResizeObserver();
      variantResizeObserver?.observe(variantScrollContainer.value);
    }
  });
});

const initializeFromUrl = (): void => {
  isInitializingFromUrl.value = true;

  let characterId = route.params.character as string | undefined;
  let variantId = route.params.variant as string | undefined;
  let imageId = route.params.image as string | undefined;

  if (characterId) {
    const parsed = parseParam(characterId);
    if (parsed.isHash && parsed.parts.length > 0) {
      characterId = parsed.parts[0];
      variantId = parsed.parts[1];
      imageId = parsed.parts[2];
    }
  }

  if (characterId && characterProfiles.value.length > 0) {
    const character = characterProfiles.value.find(c => c.id === characterId);
    if (character) {
      selectCharacter(character, true);

      if (variantId && character.variants.length > 0) {
        const variant = character.variants.find(v => v.id === variantId);
        if (variant) {
          selectVariant(variant, true);

          if (imageId && variant.images.length > 0) {
            const image = variant.images.find(img => img.id === imageId);
            if (image) {
              selectImage(image, true);
              isInitializingFromUrl.value = false;
              return;
            }
          }
        }
      }

      isInitializingFromUrl.value = false;
      if (selectedCharacter.value && selectedVariant.value && selectedImage.value) {
        updateUrl(selectedCharacter.value.id, selectedVariant.value.id, selectedImage.value.id);
      } else if (selectedCharacter.value && selectedVariant.value) {
        updateUrl(selectedCharacter.value.id, selectedVariant.value.id);
      } else if (selectedCharacter.value) {
        updateUrl(selectedCharacter.value.id);
      }
      return;
    }
  }

  isInitializingFromUrl.value = false;
  if (characterProfiles.value.length > 0) {
    selectCharacter(characterProfiles.value[0]);
  }
};

const loadCharacterProfiles = async (): Promise<void> => {
  isProfilesLoading.value = true;
  profilesLoadError.value = null;

  try {
    characterProfiles.value = await loadCharacterProfilesConfig();
    initializeFromUrl();
  } catch (error) {
    profilesLoadError.value = error;
    console.error('Failed to load character profiles config:', error);
  } finally {
    isProfilesLoading.value = false;
  }
};

onMounted(() => {
  void loadCharacterProfiles();

  if (characterScrollContainer.value) {
    characterResizeObserver = createButtonVisibilityResizeObserver();
    characterResizeObserver?.observe(characterScrollContainer.value);
  }

  if (variantScrollContainer.value) {
    variantResizeObserver = createButtonVisibilityResizeObserver();
    variantResizeObserver?.observe(variantScrollContainer.value);
  }

  updateButtonVisibility();
});

watch(() => route.params, (newParams, oldParams) => {
  if (isInitializingFromUrl.value) return;

  const newCharacterId = newParams.character as string | undefined;
  const newVariantId = newParams.variant as string | undefined;
  const newImageId = newParams.image as string | undefined;

  const oldCharacterId = oldParams?.character as string | undefined;
  const oldVariantId = oldParams?.variant as string | undefined;
  const oldImageId = oldParams?.image as string | undefined;

  if (
    newCharacterId !== oldCharacterId
    || newVariantId !== oldVariantId
    || newImageId !== oldImageId
  ) {
    if (
      (newCharacterId && newCharacterId !== selectedCharacter.value?.id)
      || (newVariantId && newVariantId !== selectedVariant.value?.id)
      || (newImageId && newImageId !== selectedImage.value?.id)
    ) {
      initializeFromUrl();
    }
  }
}, { deep: true });

onUnmounted(() => {
  characterResizeObserver?.disconnect();
  variantResizeObserver?.disconnect();
});
</script>

<style scoped>
@reference "@/assets/styles/main.css";

.character-profiles-page {
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.profiles-shell {
  flex: 1 1 0%;
  min-height: 0;
  width: 100%;
  max-width: 1440px;
  margin: 0 auto;
  padding: 0.875rem 1.25rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.875rem;
  box-sizing: border-box;
  overflow: hidden;
}

/* Selector Bar */
.selector-section {
  flex-shrink: 0;
}

.selector-container {
  background: var(--surface-card);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-sm);
  padding: 0.5rem 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
}

.character-selector,
.variant-selector {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-width: 0;
}

.variant-selector {
  border-top: 1px solid var(--border-subtle);
  padding-top: 0.45rem;
}

.selector-scroll-container {
  flex: 1 1 0%;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  overflow-x: auto;
  padding: 0.2rem 0.125rem;
  scroll-behavior: smooth;
  -webkit-overflow-scrolling: touch;
}

.selector-scroll-container.expanded {
  flex-wrap: wrap;
  overflow-x: hidden;
  overflow-y: auto;
  max-height: 11rem;
}

.selector-button {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.4rem 0.8rem;
  border-radius: var(--radius-control);
  border: 1px solid var(--border-subtle);
  background: var(--surface-muted);
  color: var(--text-secondary);
  font-size: 0.8125rem;
  font-weight: 500;
  white-space: nowrap;
  flex-shrink: 0;
  cursor: pointer;
  transition:
    background-color 0.16s ease,
    border-color 0.16s ease,
    color 0.16s ease;
}

.selector-button:hover {
  background: var(--surface-muted-hover);
  color: var(--text-primary);
}

.selector-button:focus-visible {
  outline: 2px solid var(--accent-primary);
  outline-offset: 2px;
}

.selector-button.active {
  background: var(--accent-primary);
  border-color: var(--accent-primary);
  color: #ffffff;
  font-weight: 600;
}

.selector-button.active:hover {
  background: var(--accent-primary-hover);
  border-color: var(--accent-primary-hover);
  color: #ffffff;
}

.variant-number {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 1.25rem;
  height: 1.25rem;
  padding: 0 0.25rem;
  border-radius: 9999px;
  background: var(--surface-card-solid);
  color: var(--text-muted);
  font-size: 0.7rem;
  font-weight: 700;
}

.selector-button.active .variant-number {
  background: rgba(255, 255, 255, 0.24);
  color: #ffffff;
}

.expand-toggle-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border-radius: var(--radius-control);
  border: 1px solid var(--border-subtle);
  background: var(--surface-muted);
  color: var(--text-secondary);
  font-size: 0.75rem;
  flex-shrink: 0;
  cursor: pointer;
  transition: background-color 0.16s ease, color 0.16s ease;
}

.expand-toggle-button:hover {
  background: var(--surface-muted-hover);
  color: var(--text-primary);
}

/* Main Three-Column Artbook Workspace */
.profiles-workspace {
  flex: 1 1 0%;
  min-height: 0;
  display: flex;
  flex-direction: row;
  gap: 1.25rem;
  overflow: hidden;
}

.info-section {
  width: 20rem;
  flex-shrink: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.info-cards {
  flex: 1 1 0%;
  min-height: 0;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding-right: 0.25rem;
  scrollbar-gutter: stable;
}

.info-card {
  padding: 0.95rem 1.05rem;
  border-radius: var(--radius-card);
  background: var(--surface-card);
  border: 1px solid var(--border-subtle);
  border-left: 4px solid var(--card-color, #0ea5e9);
  box-shadow: var(--shadow-sm);
}

.card-title {
  margin: 0 0 0.4rem;
  font-size: 0.9375rem;
  font-weight: 700;
  color: var(--text-primary);
}

.card-content {
  margin: 0;
  font-size: 0.84rem;
  line-height: 1.65;
  color: var(--text-secondary);
  white-space: pre-wrap;
}

/* Showcase: Image Stage + Thumbnail Strip */
.showcase-section {
  flex: 1 1 0%;
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: row;
  gap: 1rem;
  overflow: hidden;
}

.main-image-stage {
  flex: 1 1 0%;
  min-width: 0;
  min-height: 0;
  background: var(--surface-card);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
}

.main-image-wrapper {
  width: 100%;
  height: 100%;
  padding: 1rem;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  cursor: zoom-in;
}

.main-image-wrapper:focus-visible {
  outline: 2px solid var(--accent-primary);
  outline-offset: -3px;
  border-radius: var(--radius-card);
}

.zoom-hint {
  position: absolute;
  right: 0.875rem;
  bottom: 0.875rem;
  width: 2.125rem;
  height: 2.125rem;
  border-radius: 9999px;
  background: var(--surface-glass-strong);
  border: 1px solid var(--border-default);
  color: var(--text-secondary);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  box-shadow: var(--shadow-sm);
  opacity: 0.72;
  transition: opacity 0.18s ease, transform 0.2s var(--ease-out-expo), color 0.16s ease;
  pointer-events: none;
}

.main-image-wrapper:hover .zoom-hint {
  opacity: 1;
  color: var(--accent-primary);
  transform: scale(1.06);
}

.image-list-section {
  width: 6.25rem;
  flex-shrink: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  background: var(--surface-card);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-sm);
  padding: 0.45rem;
  box-sizing: border-box;
}

/* Properly scrollable thumbnail rail! */
.image-list {
  flex: 1 1 0%;
  min-height: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 0.15rem;
}

.image-item {
  width: 4.5rem;
  height: 4.5rem;
  padding: 0.2rem;
  border-radius: 0.75rem;
  overflow: hidden;
  border: 2px solid transparent;
  background: var(--surface-muted);
  cursor: pointer;
  flex-shrink: 0;
  box-sizing: border-box;
  transition: border-color 0.16s ease, transform 0.16s var(--ease-out-expo), box-shadow 0.16s ease;
}

.image-item:hover {
  border-color: var(--border-strong);
  transform: scale(1.03);
}

.image-item.active {
  border-color: var(--accent-primary);
  box-shadow: 0 0 0 2px var(--accent-soft);
}

.image-item:focus-visible {
  outline: 2px solid var(--accent-primary);
  outline-offset: 2px;
}

.no-image-placeholder,
.no-images-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  text-align: center;
  color: var(--text-muted);
  padding: 1.5rem;
  height: 100%;
  font-size: 0.85rem;
}

.no-image-placeholder i,
.no-images-placeholder i {
  font-size: 2rem;
  opacity: 0.55;
}

.empty-state {
  flex: 1 1 0%;
  min-height: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  text-align: center;
  color: var(--text-muted);
  background: var(--surface-card);
  border: 1px dashed var(--border-default);
  border-radius: var(--radius-card);
  padding: 2rem;
}

.state-icon {
  font-size: 2.5rem;
  color: var(--accent-primary);
  opacity: 0.8;
}

.empty-state.is-error .state-icon {
  color: var(--danger-text);
}

.empty-state h3 {
  margin: 0;
  font-size: 1.0625rem;
  font-weight: 700;
  color: var(--text-primary);
}

.empty-state p {
  margin: 0;
  font-size: 0.875rem;
}

/* Tablet (768px - 1199px): Left info cards, Right image stage + horizontal thumbnail rail */
@media (min-width: 768px) and (max-width: 1199px) {
  .profiles-shell {
    padding: 0.75rem 0.875rem 0.875rem;
  }

  .info-section {
    width: 17.5rem;
  }

  .showcase-section {
    flex-direction: column;
    gap: 0.75rem;
  }

  .image-list-section {
    width: 100%;
    height: auto;
    flex-shrink: 0;
  }

  .image-list {
    flex-direction: row;
    overflow-x: auto;
    overflow-y: hidden;
    padding: 0.15rem 0.25rem;
  }
}

/* Mobile (< 768px): Single scrollable column, Artwork FIRST so character is immediately visible */
@media (max-width: 767px) {
  .profiles-shell {
    padding: 0.625rem 0.75rem 4.5rem;
    gap: 0.75rem;
    overflow-y: auto;
  }

  .profiles-workspace {
    flex: none;
    flex-direction: column;
    gap: 0.875rem;
    overflow: visible;
  }

  .showcase-section {
    order: 1;
    flex: none;
    flex-direction: column;
    gap: 0.625rem;
    overflow: visible;
  }

  .main-image-stage {
    flex: none;
    height: clamp(280px, 48dvh, 420px);
  }

  .image-list-section {
    width: 100%;
    height: auto;
    padding: 0.4rem;
  }

  .image-list {
    flex-direction: row;
    overflow-x: auto;
    overflow-y: hidden;
    padding: 0.125rem;
  }

  .image-item {
    width: 4rem;
    height: 4rem;
  }

  .info-section {
    order: 2;
    width: 100%;
    flex: none;
  }

  .info-cards {
    overflow: visible;
    padding-right: 0;
  }
}
</style>
