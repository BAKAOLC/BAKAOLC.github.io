<template>
  <div class="links-page">
    <div class="links-shell">
      <header class="links-header">
        <div class="header-title-section">
          <h1 class="links-title">{{ $t('links.title') }}</h1>
          <p class="links-subtitle">{{ $t('links.subtitle') }}</p>
        </div>

        <div class="page-toolbar links-toolbar" role="search" :aria-label="$t('links.searchResults')">
          <div class="page-toolbar-input-wrap">
            <label for="links-search-input" class="sr-only">{{ $t('links.searchPlaceholder') }}</label>
            <i class="fas fa-search page-toolbar-search-icon" aria-hidden="true"></i>
            <input
              id="links-search-input"
              type="text"
              :value="searchQuery"
              :placeholder="$t('links.searchPlaceholder')"
              class="page-toolbar-input"
              :aria-describedby="searchQuery ? 'search-results-info' : undefined"
              autocomplete="off"
              @input="e => updateSearchQuery((e.target as HTMLInputElement).value)"
            />
            <button
              v-if="searchQuery"
              type="button"
              class="page-toolbar-clear"
              :aria-label="$t('links.clearSearch')"
              @click="clearSearch"
            >
              <i :class="getIconClass('times')" aria-hidden="true"></i>
            </button>
          </div>

          <div class="page-toolbar-actions">
            <button
              type="button"
              class="page-toolbar-btn generate-button"
              :title="$t('links.generateFriendLinkDesc')"
              :aria-label="$t('links.generateFriendLinkDesc')"
              @click="generateFriendLinkInfo"
            >
              <i :class="getIconClass('code')" aria-hidden="true"></i>
              <span class="btn-label">{{ $t('links.generateFriendLink') }}</span>
            </button>
          </div>
        </div>
      </header>

      <div class="links-content">
        <aside class="links-sidebar" role="complementary" :aria-label="$t('links.categories')">
          <button
            class="sidebar-toggle"
            type="button"
            :aria-expanded="isMobileSidebarOpen"
            :aria-controls="isMobileSidebarOpen ? 'mobile-filter-content' : undefined"
            :aria-label="$t('links.categories')"
            @click="toggleMobileSidebar"
          >
            <span class="sidebar-toggle-left">
              <i :class="getIconClass('filter')" class="icon" aria-hidden="true"></i>
              <span>{{ $t('links.categories') }}</span>
            </span>
            <i class="fas fa-sliders-h sidebar-toggle-chevron" aria-hidden="true"></i>
          </button>

          <div
            id="category-filter-panel"
            class="sidebar-content"
            role="region"
            :aria-label="$t('links.categories')"
            :aria-hidden="isMobile"
          >
            <LinkCategoryFilter
              v-model:selected-category="selectedCategory"
              v-model:expanded="isCategoriesExpanded"
              :categories="visibleCategories"
              :category-counts="categoryCounts"
              options-id="links-categories-list"
            />
          </div>
        </aside>

        <section
          ref="linksMain"
          class="links-main"
          :aria-label="$t('links.title')"
          @scroll="handleScroll"
        >
          <div v-if="searchQuery" id="search-results-info" class="sr-only" aria-live="polite">
            {{ $t('links.searchResults') }}: {{ filteredLinks.length }}
            {{ $t('links.linkCount', { count: filteredLinks.length }) }}
          </div>

          <div v-if="filteredLinks.length === 0" class="no-links" role="status" aria-live="polite">
            <i :class="getIconClass('link')" class="no-links-icon" aria-hidden="true"></i>
            <p class="no-links-text">
              {{ searchQuery ? $t('links.noSearchResults') : $t('links.noLinks') }}
            </p>
          </div>

          <div v-else class="links-grid">
            <section
              v-for="category in filteredCategories"
              :key="category.id"
              class="category-section"
              :aria-labelledby="`category-${category.id}-title`"
            >
              <div class="category-section-head">
                <h2 :id="`category-${category.id}-title`" class="category-section-title">
                  <span>{{ t(category.name, currentLanguage) }}</span>
                  <span
                    class="category-count"
                    :aria-label="$t('links.categoryCount', { count: category.links.length })"
                  >
                    {{ category.links.length }}
                  </span>
                </h2>
                <p v-if="t(category.description, currentLanguage)" class="category-section-description">
                  {{ t(category.description, currentLanguage) }}
                </p>
              </div>

              <div
                class="links-cards"
                role="list"
                :aria-label="$t('links.categoryLinksList', { category: t(category.name, currentLanguage) })"
              >
                <article
                  v-for="link in category.links"
                  :key="link.id"
                  class="link-card"
                  role="listitem"
                  tabindex="0"
                  :aria-label="$t('links.visitWebsite', { name: t(link.name, currentLanguage) })"
                  @click="visitLink(link.url)"
                  @keydown.enter="visitLink(link.url)"
                  @keydown.space.prevent="visitLink(link.url)"
                >
                  <div v-if="linksConfig.settings.showAvatar" class="link-avatar">
                    <ProgressiveImage
                      :src="link.avatar ?? linksConfig.settings.defaultAvatar"
                      :alt="$t('links.avatarAlt', { name: t(link.name, currentLanguage) })"
                      class="avatar-img"
                      object-fit="cover"
                      :show-loader="false"
                    />
                  </div>

                  <div class="link-content">
                    <div class="link-info">
                      <h3 class="link-name">{{ t(link.name, currentLanguage) }}</h3>
                      <p v-if="linksConfig.settings.showDescription" class="link-description">
                        {{ t(link.description, currentLanguage) }}
                      </p>
                    </div>

                    <div
                      v-if="linksConfig.settings.showTags && link.tags && link.tags.length > 0"
                      class="link-tags"
                      role="list"
                      :aria-label="$t('links.tags')"
                    >
                      <span v-for="tag in link.tags" :key="tag" class="link-tag" role="listitem">
                        {{ getTagText(tag, currentLanguage) }}
                      </span>
                    </div>
                  </div>

                  <div class="link-action" aria-hidden="true">
                    <i :class="getIconClass('external-link-alt')" class="external-icon"></i>
                  </div>
                </article>
              </div>
            </section>
          </div>
        </section>
      </div>
    </div>

    <MobileFilterOverlay
      :visible="isMobileSidebarOpen"
      :title="$t('links.categories')"
      :close-label="$t('common.close')"
      body-id="mobile-filter-description"
      described-by="mobile-filter-description"
      @close="closeMobileSidebar"
    >
      <LinkCategoryFilter
        v-model:selected-category="selectedCategory"
        v-model:expanded="isCategoriesExpanded"
        :categories="visibleCategories"
        :category-counts="categoryCounts"
        @select="closeMobileSidebar"
      />
    </MobileFilterOverlay>

    <ScrollToTopButton
      :visible="showScrollToTop"
      :aria-label="$t('common.scrollToTop')"
      @click="scrollToTop"
    />
  </div>
</template>

<script setup lang="ts">
import JSON5 from 'json5';
import { computed, defineAsyncComponent, onBeforeUnmount, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';

import LinkCategoryFilter from '@/components/LinkCategoryFilter.vue';
import ProgressiveImage from '@/components/ProgressiveImage.vue';
import MobileFilterOverlay from '@/components/ui/MobileFilterOverlay.vue';
import ScrollToTopButton from '@/components/ui/ScrollToTopButton.vue';
import { useDebouncedSetter } from '@/composables/useDebouncedSetter';
import { useMobileFilterOverlay } from '@/composables/useMobileFilterOverlay';
import { useModalManager } from '@/composables/useModalManager';
import { useNotificationManager } from '@/composables/useNotificationManager';
import { useMobileDetection, type ScreenInfo } from '@/composables/useScreenManager';
import { useScrollToTop } from '@/composables/useScrollToTop';
import htmlConfig from '@/config/html.json5';
import linksConfigData from '@/config/links.json5';
import personalConfig from '@/config/personal.json5';
import { useLanguageStore } from '@/stores/language';
import type { FriendLink, I18nText, LinkCategory, PersonalInfo } from '@/types';
import { getBrowserWindow, getCurrentOrigin, writeClipboardText } from '@/utils/browser';
import { getI18nText } from '@/utils/i18nText';
import { getIconClass } from '@/utils/icons';
import { parseLinksConfig } from '@/utils/linksConfig';
import { toAbsoluteUrl } from '@/utils/url';
import { filterVisible } from '@/utils/visibility';

const { t: $t } = useI18n();
const languageStore = useLanguageStore();
const modalManager = useModalManager();
const notificationManager = useNotificationManager();
const { isMobile, onScreenChange } = useMobileDetection();
const JsonViewerModal = defineAsyncComponent(() => import('@/components/modals/JsonViewerModal.vue'));

const linksConfig = parseLinksConfig(linksConfigData);
const personalInfoConfig = personalConfig as PersonalInfo;
const htmlMetaConfig = htmlConfig as { title: string };

const searchQuery = ref('');
const selectedCategory = ref('');
const isCategoriesExpanded = ref(true);
const linksMain = ref<HTMLElement | null>(null);
const {
  showScrollToTop,
  handleScroll,
  scrollToTop,
} = useScrollToTop(linksMain);
const mobileSidebarScrollLockId = 'links-mobile-sidebar';
const {
  isOpen: isMobileSidebarOpen,
  toggle: toggleMobileSidebar,
  close: closeMobileSidebar,
} = useMobileFilterOverlay(mobileSidebarScrollLockId);

const currentLanguage = computed(() => languageStore.currentLanguage);

const visibleLinkCategories = computed(() => {
  return filterVisible(linksConfig.categories).map(category => ({
    ...category,
    links: filterVisible(category.links),
  }));
});

const t = (text: I18nText, lang: string): string => {
  return getI18nText(text, lang);
};

const getTagText = (tagId: string, lang: string): string => {
  const tagConfig = linksConfig.tags?.[tagId];
  if (tagConfig) {
    return getI18nText(tagConfig, lang);
  }
  return tagId;
};

type FriendLinkWithCategory = FriendLink & {
  categoryId: string;
};

const normalizedSearchQuery = computed(() => searchQuery.value.toLowerCase().trim());

const linkMatchesSearch = (link: FriendLink): boolean => {
  const query = normalizedSearchQuery.value;
  if (!query) return true;

  const name = t(link.name, currentLanguage.value).toLowerCase();
  const description = t(link.description, currentLanguage.value).toLowerCase();
  const tags = link.tags?.map(tagId => getTagText(tagId, currentLanguage.value)).join(' ').toLowerCase() ?? '';

  return name.includes(query) || description.includes(query) || tags.includes(query);
};

const searchedLinkCategories = computed<LinkCategory[]>(() => {
  return visibleLinkCategories.value.map(category => ({
    ...category,
    links: category.links.filter(linkMatchesSearch),
  }));
});

const filteredLinks = computed<FriendLinkWithCategory[]>(() => {
  return filteredCategories.value.flatMap(
    category => category.links.map(link => ({ ...link, categoryId: category.id })),
  );
});

const categoryCounts = computed(() => {
  const counts: Record<string, number> = {};
  let totalCount = 0;

  searchedLinkCategories.value.forEach(category => {
    counts[category.id] = category.links.length;
    totalCount += category.links.length;
  });

  counts[''] = totalCount;

  return counts;
});

const filteredCategories = computed(() => {
  const categories = selectedCategory.value
    ? searchedLinkCategories.value.filter(cat => cat.id === selectedCategory.value)
    : searchedLinkCategories.value;

  return categories.filter(category => category.links.length > 0);
});

const visibleCategories = computed(() => {
  return visibleLinkCategories.value.filter(category => {
    const count = categoryCounts.value[category.id] ?? 0;
    return count > 0;
  });
});

const {
  setDebouncedValue: updateSearchQuery,
  setValueImmediately: setSearchQueryImmediately,
} = useDebouncedSetter<string>(value => {
  searchQuery.value = value;
});

const clearSearch = (): void => {
  setSearchQueryImmediately('');
};

const visitLink = (url: string): void => {
  getBrowserWindow()?.open(url, '_blank', 'noopener,noreferrer');
};

const generateFriendLinkInfo = async (): Promise<void> => {
  const currentUrl = getCurrentOrigin() ?? '';
  const name = getI18nText(personalInfoConfig.name, currentLanguage.value);
  const blogName = htmlMetaConfig.title;
  const avatarUrl = toAbsoluteUrl(personalInfoConfig.avatar);

  const friendLinkInfo = {
    name: name,
    blogName: blogName,
    url: currentUrl,
    logo: avatarUrl,
  };

  const jsonString = JSON5.stringify(friendLinkInfo, null, 2);

  if (await writeClipboardText(jsonString)) {
    notificationManager.success($t('links.copied'));
    return;
  }

  showJsonModal(jsonString);
};

const showJsonModal = (jsonString: string): void => {
  modalManager.openModal(JsonViewerModal, {
    title: $t('links.friendLinkGenerated'),
    content: jsonString,
  });
};

const handleScreenChange = ({ isMobile }: ScreenInfo): void => {
  if (!isMobile) {
    closeMobileSidebar();
  }
};

let unsubscribeScreenChange: (() => void) | null = null;

onMounted(() => {
  unsubscribeScreenChange = onScreenChange(handleScreenChange);
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

.links-page {
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.links-shell {
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

.links-header {
  flex-shrink: 0;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem 1.25rem;
  padding-bottom: 0.875rem;
  border-bottom: 1px solid var(--border-subtle);
}

.header-title-section {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.links-title {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 800;
  letter-spacing: -0.02em;
  color: var(--text-primary);
}

.links-subtitle {
  margin: 0;
  font-size: 0.8125rem;
  color: var(--text-muted);
}

.links-toolbar {
  flex: 1 1 380px;
  max-width: 640px;
}

.generate-button {
  background: var(--accent-soft);
  border-color: rgba(14, 165, 233, 0.25);
  color: var(--accent-primary-hover);
}

.dark .generate-button {
  color: var(--accent-primary);
}

.generate-button:hover {
  background: var(--accent-primary);
  border-color: var(--accent-primary);
  color: #ffffff;
}

.links-content {
  flex: 1 1 0%;
  min-height: 0;
  display: flex;
  flex-direction: row;
  gap: 1.25rem;
  overflow: hidden;
}

.links-sidebar {
  width: 16.5rem;
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

.links-main {
  flex: 1 1 0%;
  min-width: 0;
  min-height: 0;
  overflow-y: auto;
  padding: 0.125rem 0.25rem 1.5rem;
  scrollbar-gutter: stable;
}

.no-links {
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

.no-links-icon {
  font-size: 2rem;
  opacity: 0.55;
}

.no-links-text {
  margin: 0;
  font-size: 0.9375rem;
}

.links-grid {
  display: flex;
  flex-direction: column;
  gap: 1.75rem;
}

.category-section {
  display: flex;
  flex-direction: column;
  gap: 0.875rem;
}

.category-section-head {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.category-section-title {
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.2rem;
  font-weight: 700;
  color: var(--text-primary);
}

.category-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 1.5rem;
  height: 1.375rem;
  padding: 0 0.45rem;
  border-radius: 9999px;
  background: var(--surface-muted);
  color: var(--text-muted);
  font-size: 0.75rem;
  font-weight: 600;
}

.category-section-description {
  margin: 0;
  font-size: 0.84rem;
  color: var(--text-muted);
}

.links-cards {
  display: grid;
  gap: 0.875rem;
  grid-template-columns: repeat(auto-fill, minmax(290px, 1fr));
}

.link-card {
  display: flex;
  align-items: flex-start;
  gap: 0.875rem;
  padding: 1rem;
  border-radius: var(--radius-card);
  background: var(--surface-card);
  border: 1px solid var(--border-subtle);
  box-shadow: var(--shadow-sm);
  cursor: pointer;
  min-width: 0;
  transition:
    transform 0.22s var(--ease-out-expo),
    box-shadow 0.22s var(--ease-out-expo),
    border-color 0.18s ease;
}

.link-card:hover {
  transform: translateY(-2px);
  border-color: color-mix(in srgb, var(--accent-primary) 45%, var(--border-default));
  box-shadow: var(--shadow-md);
}

.link-card:focus-visible {
  outline: 2px solid var(--accent-primary);
  outline-offset: 2px;
}

.link-avatar {
  flex-shrink: 0;
}

.avatar-img {
  width: 3rem;
  height: 3rem;
  border-radius: 9999px;
  overflow: hidden;
  border: 2px solid var(--border-subtle);
  background: transparent;
}

.link-content {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 0.5rem;
  height: 100%;
}

.link-name {
  margin: 0 0 0.25rem;
  font-size: 0.96rem;
  font-weight: 700;
  color: var(--text-primary);
  word-break: break-word;
}

.link-description {
  margin: 0;
  font-size: 0.8125rem;
  line-height: 1.5;
  color: var(--text-secondary);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.link-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.3rem;
}

.link-tag {
  padding: 0.125rem 0.5rem;
  border-radius: 9999px;
  background: var(--surface-muted);
  color: var(--text-muted);
  font-size: 0.7rem;
  font-weight: 500;
}

.link-action {
  flex-shrink: 0;
  align-self: center;
  color: var(--text-muted);
  transition: color 0.16s ease, transform 0.2s var(--ease-out-expo);
}

.link-card:hover .link-action {
  color: var(--accent-primary);
  transform: translate(2px, -2px);
}

.external-icon {
  font-size: 0.85rem;
}

@media (min-width: 768px) and (max-width: 1024px) {
  .links-shell {
    padding: 0.875rem 0.875rem 0;
  }

  .links-sidebar {
    width: 14.5rem;
  }
}

@media (max-width: 767px) {
  .links-shell {
    padding: 0.75rem 0.75rem 0;
    gap: 0.75rem;
  }

  .links-header {
    flex-direction: column;
    align-items: stretch;
    gap: 0.625rem;
    padding-bottom: 0.75rem;
  }

  .links-title {
    font-size: 1.25rem;
  }

  .links-toolbar {
    flex: none;
    max-width: none;
    width: 100%;
  }

  .links-toolbar .btn-label {
    display: none;
  }

  .links-toolbar .page-toolbar-btn {
    min-width: 2.25rem;
    height: 2.125rem;
    padding: 0 0.55rem;
  }

  .links-toolbar .page-toolbar-input {
    height: 2.125rem;
  }

  .links-content {
    flex-direction: column;
    gap: 0.75rem;
  }

  .links-sidebar {
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

  .links-main {
    padding: 0 0 4.5rem;
  }

  .links-cards {
    grid-template-columns: 1fr;
    gap: 0.75rem;
  }
}
</style>
