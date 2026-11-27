<template>
  <div class="articles-page">
    <div class="articles-shell">
      <header class="articles-header" role="banner">
        <div class="header-title-section">
          <h1 class="articles-title">{{ $t('articles.title') }}</h1>
          <p class="articles-subtitle">{{ $t('articles.subtitle') }}</p>
        </div>

        <div class="page-toolbar articles-toolbar" role="search" :aria-label="$t('articles.searchArticles')">
          <div class="page-toolbar-input-wrap">
            <label for="article-search" class="sr-only">{{ $t('articles.searchPlaceholder') }}</label>
            <i class="fas fa-search page-toolbar-search-icon" aria-hidden="true"></i>
            <input
              id="article-search"
              v-model="searchQuery"
              type="text"
              :placeholder="$t('articles.searchPlaceholder')"
              class="page-toolbar-input"
              :aria-describedby="searchQuery ? 'search-results-info' : undefined"
              autocomplete="off"
            />
            <button
              v-if="searchQuery"
              type="button"
              class="page-toolbar-clear"
              :aria-label="$t('articles.clearSearch')"
              @click="clearSearch"
            >
              <i :class="getIconClass('times')" aria-hidden="true"></i>
            </button>
          </div>

          <div class="page-toolbar-actions" role="group" :aria-label="$t('articles.sortAndFilterControls')">
            <button
              type="button"
              class="page-toolbar-btn sort-order-button"
              :aria-label="$t(sortOrder === 'asc' ? 'articles.sortAsc' : 'articles.sortDesc')"
              :aria-pressed="sortOrder === 'asc'"
              @click="toggleSortOrder"
            >
              <i
                :class="getIconClass(sortOrder === 'asc' ? 'sort-alpha-down' : 'sort-alpha-up')"
                aria-hidden="true"
              ></i>
              <span class="btn-label">{{
                $t(sortOrder === 'asc' ? 'articles.sortAsc' : 'articles.sortDesc')
              }}</span>
            </button>

            <button
              type="button"
              class="page-toolbar-btn sort-by-button"
              :aria-label="sortBy.includes('date') ? $t('articles.sortDate') : $t('articles.sortTitle')"
              :aria-pressed="sortBy.includes('date')"
              @click="toggleSortBy"
            >
              <i :class="getIconClass(sortBy.includes('date') ? 'calendar' : 'font')" aria-hidden="true"></i>
              <span class="btn-label">{{
                sortBy.includes('date') ? $t('articles.sortDate') : $t('articles.sortTitle')
              }}</span>
            </button>

            <AccessibleSelect
              v-model="pageSizeValue"
              class="page-size-selector"
              :options="pageSizeOptions"
              :placeholder="displayPageSize"
              :aria-label="$t('articles.selectPageSize')"
              icon="list-ol"
            />
          </div>
        </div>
      </header>

      <div class="articles-content">
        <!-- 侧边栏（桌面端独立滚动，移动端收起为筛选按钮，避免挤压首屏文章） -->
        <aside class="articles-sidebar" role="complementary" :aria-label="$t('articles.sidebar')">
          <button
            type="button"
            class="sidebar-toggle"
            :aria-expanded="isMobileSidebarOpen"
            @click="toggleMobileSidebar"
          >
            <span class="sidebar-toggle-left">
              <i :class="getIconClass('filter')" class="icon" aria-hidden="true"></i>
              <span>{{ $t('articles.categories') }}</span>
            </span>
            <i class="fas fa-sliders-h sidebar-toggle-chevron" aria-hidden="true"></i>
          </button>

          <div class="sidebar-desktop-stack">
            <!-- 作者卡片 -->
            <section class="personal-info-card" :aria-label="$t('articles.authorInfo')">
              <img
                :src="personalInfo.avatar"
                :alt="getI18nText(personalInfo.name, currentLanguage)"
                class="avatar"
                role="img"
              />
              <div class="author-name">{{ getI18nText(personalInfo.name, currentLanguage) }}</div>
              <div class="social-links" role="list" :aria-label="$t('articles.socialLinks')">
                <a
                  v-for="link in personalInfo.links"
                  :key="link.url"
                  :href="link.url"
                  :title="getI18nText(link.name, currentLanguage)"
                  :aria-label="getI18nText(link.name, currentLanguage)"
                  class="social-link"
                  :style="{ '--icon-color': link.color ?? '#0ea5e9' }"
                  target="_blank"
                  rel="noopener noreferrer"
                  role="listitem"
                >
                  <i :class="getIconClass(link.icon)" aria-hidden="true"></i>
                </a>
              </div>
            </section>

            <!-- 分类筛选 -->
            <section class="category-selector-card" :aria-label="$t('articles.categories')">
              <ArticleCategoryFilter
                v-model:selected-category="selectedCategory"
                v-model:expanded="isCategoriesExpanded"
                :categories="visibleCategories"
                :category-counts="categoryCounts"
                :total-count="totalArticlesCount"
                :search-result-count="filteredArticles.length"
                :is-searching="isArticleSearchActive"
                options-id="categories-list"
              />
            </section>

            <!-- 额外信息卡片 -->
            <div v-if="infoCards && infoCards.length > 0" class="info-cards-section">
              <div v-for="card in infoCards" :key="card.id" class="info-card">
                <img
                  :src="getCardImage(card.image)"
                  :alt="getI18nText(card.title, currentLanguage)"
                  class="info-card-image"
                />
              </div>
            </div>

            <!-- Feed 链接 -->
            <FeedLinks />
          </div>
        </aside>

        <!-- 文章列表主滚动区 -->
        <section
          ref="articlesMain"
          class="articles-main"
          :aria-label="$t('articles.articlesList')"
          @scroll="handleScroll"
        >
          <div v-if="searchQuery" id="search-results-info" class="sr-only" aria-live="polite">
            {{ $t('articles.searchResults', { count: filteredArticles.length, query: searchQuery }) }}
          </div>

          <div class="articles-list" role="list" :aria-label="$t('articles.articlesList')">
            <div v-if="isArticlesLoading" class="no-articles" role="status" aria-live="polite">
              <i :class="getIconClass('spinner')" class="fa-spin no-articles-icon" aria-hidden="true"></i>
              <p class="no-articles-text">{{ $t('common.loading') }}</p>
            </div>

            <div v-else-if="articlesLoadError" class="no-articles is-error" role="alert">
              <i :class="getIconClass('exclamation-triangle')" class="no-articles-icon" aria-hidden="true"></i>
              <p class="no-articles-text">{{ $t('common.error') }}</p>
            </div>

            <div v-else-if="paginatedArticles.length === 0" class="no-articles" role="status" aria-live="polite">
              <i :class="getIconClass('newspaper')" class="no-articles-icon" aria-hidden="true"></i>
              <p class="no-articles-text">
                {{ searchQuery ? $t('articles.noSearchResults') : $t('articles.noArticles') }}
              </p>
            </div>

            <template v-else>
              <article
                v-for="article in paginatedArticles"
                :key="article.id"
                class="article-card"
                role="listitem"
                :tabindex="0"
                :aria-label="$t('articles.readArticle', { title: getI18nText(article.title, currentLanguage) })"
                @click="openArticle(article)"
                @keydown.enter="openArticle(article)"
                @keydown.space.prevent="openArticle(article)"
              >
                <div v-if="getArticleCover(article.cover, currentLanguage)" class="article-cover">
                  <img
                    :src="getArticleCover(article.cover, currentLanguage)"
                    :alt="getI18nText(article.title, currentLanguage)"
                    class="cover-image"
                    role="img"
                  />
                </div>

                <div class="article-info">
                  <div class="article-info-top">
                    <h2 class="article-title">{{ getI18nText(article.title, currentLanguage) }}</h2>

                    <div class="article-meta">
                      <time
                        class="article-date"
                        :datetime="article.date"
                        :aria-label="$t('articles.publishedDate', { date: formatDate(article.date) })"
                      >
                        <i :class="getIconClass('calendar')" class="meta-icon" aria-hidden="true"></i>
                        {{ formatDate(article.date) }}
                      </time>

                      <div class="article-categories" role="list" :aria-label="$t('articles.articleCategories')">
                        <span
                          v-for="categoryId in article.categories"
                          :key="categoryId"
                          class="category-tag"
                          :style="{
                            '--cat-color': getCategoryColor(categoryId),
                          }"
                          role="listitem"
                          :aria-label="$t('articles.category', {
                            name: getCategoryName(categoryId)
                          })"
                        >
                          {{ getCategoryName(categoryId) }}
                        </span>
                      </div>
                    </div>

                    <p class="article-summary">{{ getArticleSummary(article, currentLanguage) }}</p>
                  </div>

                  <div class="article-actions">
                    <button
                      type="button"
                      class="read-more-btn"
                      :aria-label="$t('articles.readMoreAbout', { title: getI18nText(article.title, currentLanguage) })"
                      @click.stop="openArticle(article)"
                    >
                      <span>{{ $t('articles.readMore') }}</span>
                      <i :class="getIconClass('arrow-right')" class="btn-icon" aria-hidden="true"></i>
                    </button>
                  </div>
                </div>
              </article>
            </template>
          </div>

          <!-- 分页器 -->
          <nav
            v-if="pagination.totalPages > 1"
            class="pagination"
            role="navigation"
            :aria-label="$t('articles.pagination')"
          >
            <div class="pagination-controls">
              <button
                type="button"
                class="pagination-btn prev-btn"
                :disabled="!pagination.hasPrev"
                :aria-label="$t('articles.goToPreviousPage')"
                @click="goToPage(pagination.currentPage - 1)"
              >
                <i :class="getIconClass('chevron-left')" aria-hidden="true"></i>
                <span class="pagination-btn-text">{{ $t('articles.previousPage') }}</span>
              </button>

              <div class="pagination-numbers">
                <template v-for="(page, index) in paginationButtons" :key="index">
                  <button
                    v-if="typeof page === 'number'"
                    type="button"
                    class="page-btn"
                    :class="{ 'active': page === pagination.currentPage }"
                    :aria-label="$t('articles.goToPageNumber', { page })"
                    :aria-current="page === pagination.currentPage ? 'page' : undefined"
                    @click="goToPage(page)"
                  >
                    {{ page }}
                  </button>
                  <span v-else class="page-ellipsis" aria-hidden="true">…</span>
                </template>
              </div>

              <button
                type="button"
                class="pagination-btn next-btn"
                :disabled="!pagination.hasNext"
                :aria-label="$t('articles.goToNextPage')"
                @click="goToPage(pagination.currentPage + 1)"
              >
                <span class="pagination-btn-text">{{ $t('articles.nextPage') }}</span>
                <i :class="getIconClass('chevron-right')" aria-hidden="true"></i>
              </button>
            </div>

            <div class="pagination-info">
              <span
                class="page-info"
                :aria-label="$t('articles.currentPageInfo', {
                  current: pagination.currentPage,
                  total: pagination.totalPages
                })"
              >
                {{ $t('articles.page', { current: pagination.currentPage, total: pagination.totalPages }) }}
              </span>

              <div class="page-jump">
                <label for="page-jump-input" class="sr-only">{{ $t('articles.jumpToPage') }}</label>
                <input
                  id="page-jump-input"
                  v-model.number="jumpToPageNumber"
                  type="number"
                  :min="1"
                  :max="pagination.totalPages"
                  class="page-input"
                  :aria-label="$t('articles.pageNumberInput')"
                  @keyup.enter="jumpToPage"
                />
                <button
                  type="button"
                  class="jump-btn"
                  :aria-label="$t('articles.goToPageNumber', { page: jumpToPageNumber })"
                  @click="jumpToPage"
                >
                  {{ $t('articles.goToPage') }}
                </button>
              </div>
            </div>
          </nav>
        </section>
      </div>
    </div>

    <MobileFilterOverlay
      :visible="isMobileSidebarOpen"
      :title="$t('articles.categories')"
      :close-label="$t('common.close')"
      :z-index="60"
      @close="closeMobileSidebar"
    >
      <ArticleCategoryFilter
        v-model:selected-category="selectedCategory"
        v-model:expanded="isCategoriesExpanded"
        :categories="visibleCategories"
        :category-counts="categoryCounts"
        :total-count="totalArticlesCount"
        :search-result-count="filteredArticles.length"
        :is-searching="isArticleSearchActive"
      />
      <FeedLinks />
    </MobileFilterOverlay>

    <ScrollToTopButton
      :visible="showScrollToTop"
      :aria-label="$t('articles.scrollToTop')"
      @click="scrollToTop"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, defineAsyncComponent, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';

import ArticleCategoryFilter from '@/components/ArticleCategoryFilter.vue';
import FeedLinks from '@/components/FeedLinks.vue';
import AccessibleSelect, { type AccessibleSelectOption } from '@/components/ui/AccessibleSelect.vue';
import MobileFilterOverlay from '@/components/ui/MobileFilterOverlay.vue';
import ScrollToTopButton from '@/components/ui/ScrollToTopButton.vue';
import { useMobileFilterOverlay } from '@/composables/useMobileFilterOverlay';
import { useModalManager } from '@/composables/useModalManager';
import { useMobileDetection, type ScreenInfo } from '@/composables/useScreenManager';
import { useScrollToTop } from '@/composables/useScrollToTop';
import { loadArticlesConfig } from '@/config/articles';
import articleCategoriesConfig from '@/config/articles-categories.json5';
import articlesPageConfig from '@/config/articles-page.json5';
import { siteConfig } from '@/config/site';
import { useLanguageStore } from '@/stores/language';
import type { ModalConfig } from '@/stores/modal';
import { useThemeStore } from '@/stores/theme';
import type {
  Article,
  ArticleCategoriesConfig,
  ArticleCategory,
  ArticleFilterState,
  ArticlePagination,
  ArticlesPageConfig,
} from '@/types';
import {
  calculatePagination,
  countArticlesByCategory,
  filterArticles,
  formatDate,
  getArticleCover,
  getArticleSummary,
  paginateArticles,
} from '@/utils/articles';
import { getCurrentSiteBaseUrl } from '@/utils/browser';
import { getI18nText } from '@/utils/i18nText';
import { getIconClass } from '@/utils/icons';
import { encodeKey, parseParam } from '@/utils/idHashMap';
import { filterVisible } from '@/utils/visibility';

interface Props {
  articleId?: string;
}

const props = withDefaults(defineProps<Props>(), {
  articleId: undefined,
});

const { t: $t } = useI18n();
const languageStore = useLanguageStore();
const themeStore = useThemeStore();
const { onScreenChange } = useMobileDetection();
const route = useRoute();
const router = useRouter();
const modalManager = useModalManager();
const ArticleViewerModal = defineAsyncComponent(() => import('@/components/modals/ArticleViewerModal.vue'));

const searchQuery = ref('');
const selectedCategory = ref<string>('');
const sortBy = ref<'date-desc' | 'date-asc' | 'title-asc' | 'title-desc'>('date-desc');
const sortOrder = ref<'asc' | 'desc'>('desc');
const pageSize = ref<number | 'all'>(10);
const currentPage = ref(1);
const jumpToPageNumber = ref(1);
const selectedArticle = ref<Article | null>(null);
const isCategoriesExpanded = ref(true);
const articlesMain = ref<HTMLElement | null>(null);
const {
  showScrollToTop,
  handleScroll,
  scrollToTop,
} = useScrollToTop(articlesMain);

const articleViewerModalId = ref<string | null>(null);
const mobileSidebarScrollLockId = 'articles-mobile-sidebar';
const {
  isOpen: isMobileSidebarOpen,
  toggle: toggleMobileSidebar,
  close: closeMobileSidebar,
} = useMobileFilterOverlay(mobileSidebarScrollLockId);

const currentLanguage = computed(() => languageStore.currentLanguage);

const getCardImage = (image: string | { light: string; dark: string }): string => {
  if (typeof image === 'string') return image;
  return themeStore.isDarkMode ? image.dark : image.light;
};

const articles = ref<Article[]>([]);
const isArticlesLoading = ref(false);
const articlesLoadError = ref<unknown | null>(null);
const articleCategories = ref<ArticleCategoriesConfig>(articleCategoriesConfig as ArticleCategoriesConfig);
const personalInfo = computed(() => siteConfig.personal);
const infoCards = ref((articlesPageConfig as ArticlesPageConfig).infoCards);

const filterState = computed<ArticleFilterState>(() => ({
  selectedCategories: selectedCategory.value ? [selectedCategory.value] : [],
  sortBy: sortBy.value,
  searchQuery: searchQuery.value,
  pageSize: pageSize.value,
  currentPage: currentPage.value,
}));

const filteredArticles = computed(() => {
  return filterArticles(articles.value, filterState.value, currentLanguage.value);
});

const visibleArticles = computed(() => {
  return filterVisible(articles.value);
});

const pagination = computed<ArticlePagination>(() => {
  return calculatePagination(
    filteredArticles.value.length,
    currentPage.value,
    pageSize.value,
  );
});

const paginatedArticles = computed(() => {
  return paginateArticles(
    filteredArticles.value,
    currentPage.value,
    pageSize.value,
  );
});

const allCategoryCounts = computed(() => {
  return countArticlesByCategory(articles.value);
});

const filteredCategoryCounts = computed(() => {
  return countArticlesByCategory(filteredArticles.value);
});

const isArticleSearchActive = computed(() => searchQuery.value.trim() !== '');

const categoryCounts = computed(() => {
  return isArticleSearchActive.value ? filteredCategoryCounts.value : allCategoryCounts.value;
});

const visibleCategories = computed(() => {
  const visibleCats: ArticleCategoriesConfig = {};
  Object.entries(articleCategories.value).forEach(([categoryId, category]) => {
    if (categoryCounts.value[categoryId] > 0) {
      visibleCats[categoryId] = category;
    }
  });
  return visibleCats;
});

const totalArticlesCount = computed(() => {
  return visibleArticles.value.length;
});

const clearSearch = (): void => {
  searchQuery.value = '';
};

const toggleSortOrder = (): void => {
  sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc';
  if (sortBy.value.includes('date')) {
    sortBy.value = sortOrder.value === 'asc' ? 'date-asc' : 'date-desc';
  } else {
    sortBy.value = sortOrder.value === 'asc' ? 'title-asc' : 'title-desc';
  }
};

const toggleSortBy = (): void => {
  if (sortBy.value.includes('date')) {
    sortBy.value = sortOrder.value === 'asc' ? 'title-asc' : 'title-desc';
  } else {
    sortBy.value = sortOrder.value === 'asc' ? 'date-asc' : 'date-desc';
  }
};

const pageSizeOptions = computed<AccessibleSelectOption[]>(() => [
  { label: '10', value: '10' },
  { label: '20', value: '20' },
  { label: '50', value: '50' },
  { label: '100', value: '100' },
  { label: $t('articles.showAll'), value: 'all' },
]);

const displayPageSize = computed(() => {
  if (pageSize.value === 'all') {
    return $t('articles.showAll');
  }
  return pageSize.value.toString();
});

const pageSizeValue = computed({
  get: () => pageSize.value.toString(),
  set: (value: string) => {
    changePageSize(value === 'all' ? 'all' : Number(value));
  },
});

const changePageSize = (size: number | 'all'): void => {
  pageSize.value = size;
  currentPage.value = 1;
};

const getCategoryConfig = (categoryId: string): ArticleCategory | undefined => {
  return articleCategories.value[categoryId];
};

const getCategoryColor = (categoryId: string): string => {
  return getCategoryConfig(categoryId)?.color ?? '#0ea5e9';
};

const getCategoryName = (categoryId: string): string => {
  const name = getCategoryConfig(categoryId)?.name;
  return name ? getI18nText(name, currentLanguage.value) : categoryId;
};

const scrollToArticlesList = (): void => {
  nextTick(() => {
    articlesMain.value?.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  });
};

const goToPage = (page: number): void => {
  if (page >= 1 && page <= pagination.value.totalPages) {
    currentPage.value = page;
    jumpToPageNumber.value = page;
    scrollToArticlesList();
  }
};

const jumpToPage = (): void => {
  if (jumpToPageNumber.value >= 1 && jumpToPageNumber.value <= pagination.value.totalPages) {
    currentPage.value = jumpToPageNumber.value;
    scrollToArticlesList();
  }
};

const paginationButtons = computed(() => {
  const current = pagination.value.currentPage;
  const total = pagination.value.totalPages;

  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const buttons: (number | string)[] = [];

  if (current <= 4) {
    buttons.push(1, 2, 3, 4, 5, '...', total);
  } else if (current >= total - 3) {
    buttons.push(1, '...', total - 4, total - 3, total - 2, total - 1, total);
  } else {
    buttons.push(1, '...', current - 1, current, current + 1, '...', total);
  }

  return buttons;
});

const createArticleViewerModal = (article: Article): ModalConfig => {
  const hashedArticle = encodeKey([article.id]);
  const articleParam = hashedArticle ?? article.id;
  const articleLink = `${getCurrentSiteBaseUrl() ?? ''}#/articles/${articleParam}`;
  return {
    id: `article-viewer-${Date.now()}`,
    component: ArticleViewerModal,
    props: {
      article: article,
      articles: filteredArticles.value,
      customLink: articleLink,
    },
    options: {
      fullscreen: true,
      closable: true,
      maskClosable: true,
      escClosable: true,
    },
    onClose: () => {
      closeArticle();
    },
    onNavigate: (articleId: string) => {
      navigateToArticle(articleId);
    },
  };
};

const openArticle = (article: Article): void => {
  selectedArticle.value = article;
  articleViewerModalId.value = modalManager.open(createArticleViewerModal(article));

  const articleParam = encodeKey([article.id]) ?? article.id;
  router.push({ name: 'article-detail', params: { articleId: articleParam } });
};

const closeArticle = (): void => {
  selectedArticle.value = null;

  if (articleViewerModalId.value) {
    modalManager.close(articleViewerModalId.value);
    articleViewerModalId.value = null;
  }

  router.push({ name: 'articles' });
};

const navigateToArticle = (articleId: string): void => {
  const article = visibleArticles.value.find(a => a.id === articleId);
  if (article) {
    selectedArticle.value = article;

    if (articleViewerModalId.value) {
      modalManager.close(articleViewerModalId.value);
    }

    articleViewerModalId.value = modalManager.open(createArticleViewerModal(article));

    const hashed = encodeKey([article.id]);
    router.push({ name: 'article-detail', params: { articleId: hashed ?? article.id } });
  }
};

const openArticleFromRoute = (): void => {
  const rawParam = props.articleId ?? route.params.articleId as string;
  if (rawParam) {
    const parsed = parseParam(rawParam);
    const articleId = parsed.parts.length > 0 ? parsed.parts.join('/') : rawParam;
    if (articleId) {
      const article = visibleArticles.value.find(a => a.id === articleId);
      if (article) {
        selectedArticle.value = article;
        articleViewerModalId.value = modalManager.open(createArticleViewerModal(article));
      } else {
        router.replace({ name: 'articles' });
      }
    }
  }
};

const loadArticles = async (): Promise<void> => {
  isArticlesLoading.value = true;
  articlesLoadError.value = null;

  try {
    articles.value = await loadArticlesConfig();
  } catch (error) {
    articlesLoadError.value = error;
    console.error('Failed to load articles config:', error);
  } finally {
    isArticlesLoading.value = false;
  }
};

const handleScreenChange = ({ isMobile }: ScreenInfo): void => {
  if (!isMobile) {
    closeMobileSidebar();
  }
};

watch([searchQuery, selectedCategory, sortBy], () => {
  currentPage.value = 1;
});

watch(selectedCategory, () => {
  if (isMobileSidebarOpen.value) {
    closeMobileSidebar();
  }
});

watch(pagination, (newPagination) => {
  jumpToPageNumber.value = newPagination.currentPage;
});

let unsubscribeScreenChange: (() => void) | null = null;

onMounted(() => {
  jumpToPageNumber.value = currentPage.value;
  unsubscribeScreenChange = onScreenChange(handleScreenChange);

  void loadArticles().then(() => {
    openArticleFromRoute();
  });
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

.articles-page {
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.articles-shell {
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

.articles-header {
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

.articles-title {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 800;
  letter-spacing: -0.02em;
  color: var(--text-primary);
}

.articles-subtitle {
  margin: 0;
  font-size: 0.8125rem;
  color: var(--text-muted);
}

.articles-toolbar {
  flex: 1 1 420px;
  max-width: 740px;
}

.articles-content {
  flex: 1 1 0%;
  min-height: 0;
  display: flex;
  flex-direction: row;
  gap: 1.25rem;
  overflow: hidden;
}

.articles-sidebar {
  width: 18.5rem;
  flex-shrink: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.sidebar-toggle {
  display: none;
}

.sidebar-desktop-stack {
  flex: 1 1 0%;
  min-height: 0;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 0.875rem;
  padding-bottom: 1.25rem;
  padding-right: 0.2rem;
}

.personal-info-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  padding: 1.125rem 1rem;
  background: var(--surface-card);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-sm);
  text-align: center;
}

.avatar {
  display: block;
  width: 3.75rem;
  height: 3.75rem;
  border-radius: 9999px;
  object-fit: cover;
  border: 2px solid var(--border-subtle);
  background: transparent;
}

.author-name {
  font-size: 0.9375rem;
  font-weight: 700;
  color: var(--text-primary);
}

.social-links {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.45rem;
}

.social-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.125rem;
  height: 2.125rem;
  border-radius: var(--radius-control);
  color: #ffffff;
  font-size: 0.85rem;
  background-color: var(--icon-color, #0284c7);
  border: 1px solid rgba(255, 255, 255, 0.14);
  box-shadow: var(--shadow-xs);
  transition: transform 0.18s var(--ease-out-expo), opacity 0.16s ease;
}

.social-link:hover {
  transform: translateY(-2px);
  opacity: 0.9;
}

.category-selector-card {
  background: var(--surface-card);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-sm);
  padding: 0.875rem;
}

.info-cards-section {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.info-card {
  pointer-events: none;
}

.info-card-image {
  display: block;
  width: 100%;
  height: auto;
}

/* Main Articles Scroll Region */
.articles-main {
  flex: 1 1 0%;
  min-width: 0;
  min-height: 0;
  overflow-y: auto;
  padding: 0.125rem 0.25rem 1.5rem;
  scrollbar-gutter: stable;
}

.articles-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.no-articles {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 4rem 1.5rem;
  text-align: center;
  background: var(--surface-card);
  border: 1px dashed var(--border-default);
  border-radius: var(--radius-card);
  color: var(--text-muted);
}

.no-articles-icon {
  font-size: 2rem;
  opacity: 0.65;
  color: var(--accent-primary);
}

.no-articles.is-error .no-articles-icon,
.no-articles.is-error .no-articles-text {
  color: var(--danger-text);
}

.no-articles-text {
  margin: 0;
  font-size: 0.9375rem;
}

.article-card {
  display: flex;
  flex-direction: row;
  background: var(--surface-card);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-card);
  overflow: hidden;
  box-shadow: var(--shadow-sm);
  cursor: pointer;
  transition:
    transform 0.22s var(--ease-out-expo),
    box-shadow 0.22s var(--ease-out-expo),
    border-color 0.18s ease;
}

.article-card:hover {
  transform: translateY(-2px);
  border-color: color-mix(in srgb, var(--accent-primary) 42%, var(--border-default));
  box-shadow: var(--shadow-md);
}

.article-card:focus-visible {
  outline: 2px solid var(--accent-primary);
  outline-offset: 2px;
}

.article-cover {
  width: 14rem;
  flex-shrink: 0;
  background: var(--surface-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border-right: 1px solid var(--border-subtle);
}

.cover-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s var(--ease-out-expo);
}

.article-card:hover .cover-image {
  transform: scale(1.04);
}

.article-info {
  flex: 1;
  min-width: 0;
  padding: 1.25rem 1.375rem;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 0.875rem;
}

.article-title {
  margin: 0 0 0.5rem;
  font-size: 1.1875rem;
  font-weight: 700;
  line-height: 1.35;
  color: var(--text-primary);
  transition: color 0.16s ease;
}

.article-card:hover .article-title {
  color: var(--accent-primary-hover);
}

.dark .article-card:hover .article-title {
  color: var(--accent-primary);
}

.article-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem 0.875rem;
  margin-bottom: 0.625rem;
}

.article-date {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.78rem;
  color: var(--text-muted);
}

.meta-icon {
  font-size: 0.72rem;
}

.article-categories {
  display: flex;
  flex-wrap: wrap;
  gap: 0.375rem;
}

.category-tag {
  padding: 0.15rem 0.55rem;
  border-radius: 9999px;
  font-size: 0.72rem;
  font-weight: 600;
  color: var(--cat-color);
  background: color-mix(in srgb, var(--cat-color) 14%, transparent);
  border: 1px solid color-mix(in srgb, var(--cat-color) 32%, transparent);
}

.article-summary {
  margin: 0;
  font-size: 0.875rem;
  line-height: 1.65;
  color: var(--text-secondary);
  display: -webkit-box;
  -webkit-line-clamp: 3;
  line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.article-actions {
  display: flex;
  justify-content: flex-end;
}

.read-more-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.45rem 0.9rem;
  border-radius: var(--radius-control);
  border: 1px solid rgba(14, 165, 233, 0.25);
  background: var(--accent-soft);
  color: var(--accent-primary-hover);
  font-size: 0.8125rem;
  font-weight: 600;
  cursor: pointer;
  transition:
    background-color 0.16s ease,
    color 0.16s ease,
    border-color 0.16s ease,
    transform 0.16s var(--ease-out-expo);
}

.dark .read-more-btn {
  color: var(--accent-primary);
}

.article-card:hover .read-more-btn,
.read-more-btn:hover {
  background: var(--accent-primary);
  border-color: var(--accent-primary);
  color: #ffffff;
}

.btn-icon {
  font-size: 0.75rem;
  transition: transform 0.18s var(--ease-out-expo);
}

.article-card:hover .btn-icon {
  transform: translateX(2px);
}

/* Pagination */
.pagination {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  background: var(--surface-card);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-sm);
  padding: 0.875rem 1rem;
}

.pagination-controls {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  width: 100%;
}

.pagination-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.4rem 0.75rem;
  border-radius: var(--radius-control);
  border: 1px solid var(--border-subtle);
  background: var(--surface-muted);
  color: var(--text-secondary);
  font-size: 0.8125rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.16s ease, color 0.16s ease;
}

.pagination-btn:hover:not(:disabled) {
  background: var(--surface-muted-hover);
  color: var(--text-primary);
}

.pagination-btn:disabled {
  opacity: 0.42;
  cursor: not-allowed;
}

.pagination-numbers {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: 0.25rem;
}

.page-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 2rem;
  height: 2rem;
  padding: 0 0.5rem;
  border-radius: 0.5rem;
  border: 1px solid var(--border-subtle);
  background: var(--surface-card-solid);
  color: var(--text-secondary);
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.16s ease, color 0.16s ease, border-color 0.16s ease;
}

.page-btn:hover {
  background: var(--surface-muted);
  color: var(--text-primary);
}

.page-btn.active {
  background: var(--accent-primary);
  border-color: var(--accent-primary);
  color: #ffffff;
}

.page-ellipsis {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 1.5rem;
  height: 2rem;
  color: var(--text-muted);
  font-size: 0.8rem;
}

.pagination-info {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 0.75rem 1.25rem;
  font-size: 0.8rem;
  color: var(--text-muted);
}

.page-jump {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
}

.page-input {
  width: 3.25rem;
  height: 1.85rem;
  padding: 0 0.35rem;
  border-radius: 0.5rem;
  border: 1px solid var(--border-default);
  background: var(--surface-muted);
  color: var(--text-primary);
  text-align: center;
  font-size: 0.78rem;
}

.jump-btn {
  height: 1.85rem;
  padding: 0 0.65rem;
  border-radius: 0.5rem;
  border: none;
  background: var(--accent-primary);
  color: #ffffff;
  font-size: 0.78rem;
  font-weight: 600;
  cursor: pointer;
  transition: filter 0.16s ease;
}

.jump-btn:hover {
  filter: brightness(1.08);
}

@media (max-width: 1024px) {
  .articles-shell {
    padding: 0.875rem 0.875rem 0;
  }

  .articles-sidebar {
    width: 16rem;
  }

  .article-card {
    flex-direction: column;
  }

  .article-cover {
    width: 100%;
    height: 12.5rem;
    border-right: none;
    border-bottom: 1px solid var(--border-subtle);
  }
}

@media (max-width: 767px) {
  .articles-shell {
    padding: 0.75rem 0.75rem 0;
    gap: 0.75rem;
  }

  .articles-header {
    flex-direction: column;
    align-items: stretch;
    gap: 0.625rem;
    padding-bottom: 0.75rem;
  }

  .articles-title {
    font-size: 1.25rem;
  }

  .articles-toolbar {
    flex: none;
    max-width: none;
    width: 100%;
  }

  .articles-toolbar .btn-label {
    display: none;
  }

  .articles-toolbar .page-toolbar-btn {
    min-width: 2.25rem;
    height: 2.125rem;
    padding: 0 0.55rem;
  }

  .articles-toolbar .page-toolbar-input {
    height: 2.125rem;
  }

  .articles-content {
    flex-direction: column;
    gap: 0.75rem;
  }

  .articles-sidebar {
    width: 100%;
  }

  .sidebar-desktop-stack {
    display: none;
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

  .articles-main {
    padding: 0 0 4.5rem;
  }

  .article-info {
    padding: 1rem;
  }

  .article-title {
    font-size: 1.0625rem;
  }

  .pagination-btn-text {
    display: none;
  }
}
</style>
