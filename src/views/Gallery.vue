<template>
  <div class="gallery-page">
    <div class="container mx-auto px-4 py-4 flex-1 h-full overflow-hidden">
      <div class="gallery-header">
        <h1 class="gallery-title">{{ $t('gallery.title') }}</h1>
        <!-- 统一搜索栏 -->
        <div class="unified-search-bar">
          <div class="search-container">
            <input type="text" :value="searchQuery"
              @input="e => updateSearchQuery((e.target as HTMLInputElement).value)"
              :placeholder="$t('gallery.searchPlaceholder')" class="search-input" />
            <button v-if="searchQuery" @click="clearSearch" class="search-clear">
              <i class="fa fa-times" aria-hidden="true"></i>
            </button>
          </div>

          <div class="search-controls">
            <select v-model="sortBy" class="sort-select">
              <option value="name">{{ $t('gallery.sortName') }}</option>
              <option value="artist">{{ $t('gallery.sortArtist') }}</option>
              <option value="date">{{ $t('gallery.sortDate') }}</option>
            </select>
            <button @click="toggleSortOrder" class="sort-order-button"
              :title="$t(sortOrder === 'asc' ? 'gallery.sortAsc' : 'gallery.sortDesc')">
              <i :class="sortOrder === 'asc' ? 'fa fa-sort-amount-down' : 'fa fa-sort-amount-up'"></i>
              <span class="sort-order-text">{{ $t(sortOrder === 'asc' ? 'gallery.sortAsc' : 'gallery.sortDesc')
              }}</span>
            </button>
            <button class="grid-view-toggle" @click="toggleGridView">
              <i :class="isGridView ? 'fa fa-th-large' : 'fa fa-th-list'"></i>
              <span class="grid-view-text">{{ $t(isGridView ? 'gallery.listView' : 'gallery.gridView') }}</span>
            </button>
          </div>
        </div>
      </div>

      <div class="gallery-content">
        <aside class="gallery-sidebar">
          <div class="sidebar-toggle md:hidden" @click="toggleMobileSidebar">
            <i class="fa fa-filter icon"></i>
            {{ $t('gallery.filters') }}
          </div>
          <div class="sidebar-content" :class="{ 'active': isSidebarOpen }">
            <character-selector />
            <tag-selector />
          </div>
        </aside>

        <div class="gallery-main" ref="galleryMain" @scroll="handleScroll">
          <image-gallery :images="characterImages" :grid-view="isGridView" />
        </div>
      </div>
    </div>

    <!-- 移动端全屏筛选弹窗 -->
    <div v-if="isMobileSidebarOpen" class="mobile-filter-overlay" @click="closeMobileSidebar">
      <div class="mobile-filter-content" @click.stop>
        <div class="mobile-filter-header">
          <h3>{{ $t('gallery.filters') }}</h3>
          <button @click="closeMobileSidebar" class="close-button">
            <i class="fa fa-times"></i>
          </button>
        </div>
        <div class="mobile-filter-body">
          <character-selector />
          <tag-selector />
        </div>
      </div>
    </div>

    <!-- 返回顶部按钮 -->
    <button v-if="showScrollToTop" @click="scrollToTop" class="scroll-to-top-button"
      :style="{ bottom: scrollToTopBottom + 'px' }">
      <i class="fa fa-chevron-up"></i>
    </button>

    <!-- 在画廊页面内显示全屏查看器 -->
    <fullscreen-viewer v-if="viewerActive" :image-id="currentImageId" :is-active="viewerActive" @close="closeViewer" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAppStore } from '@/stores/app'
import CharacterSelector from '@/components/CharacterSelector.vue'
import TagSelector from '@/components/TagSelector.vue'
import ImageGallery from '@/components/ImageGallery.vue'
import FullscreenViewer from '@/components/FullscreenViewer.vue'

const { t: $t } = useI18n()
const appStore = useAppStore()

const isGridView = ref(true)
const isSidebarOpen = ref(false)
const isMobileSidebarOpen = ref(false)
const searchDebounceTimeout = ref<number | null>(null)
const galleryMain = ref<HTMLElement | null>(null)
const showScrollToTop = ref(false)
const scrollToTopBottom = ref(80) // 默认距离底部80px
const lastScrollTop = ref(0)

// 将搜索查询绑定到 appStore
const searchQuery = computed({
  get: () => appStore.searchQuery,
  set: (value) => appStore.setSearchQuery(value)
})

// 搜索结果图片直接使用 appStore 中的过滤结果
const characterImages = computed(() => appStore.characterImages)

// 全屏查看器状态
const viewerActive = ref(false)
const currentImageId = ref('')

// 切换网格视图
const toggleGridView = () => {
  isGridView.value = !isGridView.value
}

// 移动端筛选弹窗相关
const toggleMobileSidebar = () => {
  isMobileSidebarOpen.value = !isMobileSidebarOpen.value
  // 阻止背景滚动
  if (isMobileSidebarOpen.value) {
    document.body.style.overflow = 'hidden'
  } else {
    document.body.style.overflow = ''
  }
}

const closeMobileSidebar = () => {
  isMobileSidebarOpen.value = false
  // 恢复背景滚动
  document.body.style.overflow = ''
}

// 处理滚动事件
const handleScroll = () => {
  if (!galleryMain.value) return

  const scrollTop = galleryMain.value.scrollTop

  lastScrollTop.value = scrollTop

  // 显示/隐藏返回顶部按钮
  showScrollToTop.value = scrollTop > 200

  // 更新返回顶部按钮位置
  updateScrollToTopPosition()
}

// 更新返回顶部按钮位置
const updateScrollToTopPosition = () => {
  const footer = document.querySelector('.footer') as HTMLElement
  if (footer) {
    const footerRect = footer.getBoundingClientRect()
    const viewportHeight = window.innerHeight

    if (footerRect.top < viewportHeight) {
      // Footer在视口内，按钮应该在footer上方
      const distanceFromBottom = viewportHeight - footerRect.top + 20
      scrollToTopBottom.value = Math.max(distanceFromBottom, 80)
    } else {
      // Footer不在视口内，使用默认位置
      scrollToTopBottom.value = 80
    }
  }
}

// 滚动到顶部
const scrollToTop = () => {
  if (galleryMain.value) {
    galleryMain.value.scrollTo({
      top: 0,
      behavior: 'smooth'
    })
  }
}

// 监听窗口大小变化
const handleResize = () => {
  const isMobile = window.innerWidth < 768
  if (!isMobile) {
    // 切换到桌面端时关闭移动端功能
    isMobileSidebarOpen.value = false
    isSidebarOpen.value = false
    // 恢复背景滚动
    document.body.style.overflow = ''
  }

  // 更新返回顶部按钮位置
  updateScrollToTopPosition()
}

// 更新搜索查询并触发搜索
const updateSearchQuery = (value: string) => {
  // 防抖处理
  if (searchDebounceTimeout.value) {
    clearTimeout(searchDebounceTimeout.value)
  }

  searchDebounceTimeout.value = setTimeout(() => {
    // 使用 store 的方法更新搜索查询
    appStore.setSearchQuery(value)

    // 搜索处理完成
    searchDebounceTimeout.value = null
  }, 300) as unknown as number
}

// 清除搜索
const clearSearch = () => {
  // 使用Store的清空搜索方法
  appStore.clearSearch()
}

// 排序相关
const sortBy = computed({
  get: () => appStore.sortBy,
  set: (value) => appStore.sortBy = value
})

const sortOrder = computed({
  get: () => appStore.sortOrder,
  set: (value) => appStore.sortOrder = value
})

// 切换排序顺序
const toggleSortOrder = () => {
  sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
}

// 打开查看器
const openViewer = (event: CustomEvent) => {
  if (event.detail && event.detail.imageId && typeof event.detail.imageId === 'string') {
    currentImageId.value = event.detail.imageId
    viewerActive.value = true

    // 更新 URL 但不导航到新页面
    const newUrl = `/viewer/${event.detail.imageId}`
    window.history.pushState({ imageId: event.detail.imageId }, '', newUrl)
  } else {
    console.warn('无效的图片ID，无法打开查看器')
  }
}

// 关闭查看器
const closeViewer = () => {
  viewerActive.value = false

  // 恢复原来的 URL
  window.history.pushState({}, '', '/gallery')
}

// 监听查看器导航事件
const handleViewerNavigate = (event: CustomEvent) => {
  if (event.detail && event.detail.imageId && typeof event.detail.imageId === 'string') {
    currentImageId.value = event.detail.imageId

    // 更新 URL 但不导航到新页面
    const newUrl = `/viewer/${event.detail.imageId}`
    window.history.pushState({ imageId: event.detail.imageId }, '', newUrl)
  } else {
    console.warn('无效的图片ID，无法更新查看器')
  }
}

onMounted(() => {
  window.addEventListener('viewImage', openViewer as EventListener)
  window.addEventListener('viewerNavigate', handleViewerNavigate as EventListener)
  window.addEventListener('resize', handleResize)

  // 初始化返回顶部按钮位置
  updateScrollToTopPosition()
})

onBeforeUnmount(() => {
  window.removeEventListener('viewImage', openViewer as EventListener)
  window.removeEventListener('viewerNavigate', handleViewerNavigate as EventListener)
  window.removeEventListener('resize', handleResize)

  // 清理body样式
  document.body.style.overflow = ''
})
</script>

<style scoped>
.gallery-page {
  display: flex;
  flex-direction: column;
  height: 100%;
  /* 占满整个主区域高度 */
  overflow: hidden;
  /* 防止外部滚动 */
}

.gallery-header {
  @apply flex flex-wrap items-center justify-between mb-4;
  @apply border-b border-gray-200 dark:border-gray-700 pb-3;
  transition: transform 0.3s ease, opacity 0.3s ease, margin-bottom 0.3s ease;
}

.gallery-header.hidden-mobile {
  transform: translateY(-100%);
  opacity: 0;
  pointer-events: none;
}

@media (max-width: 768px) {
  .gallery-header {
    @apply flex-col items-center text-center gap-2 mb-3;
    padding-bottom: 0.75rem;
  }

  .gallery-header.hidden-mobile {
    margin-bottom: 0;
  }
}

.gallery-title {
  @apply text-2xl font-bold;
  @apply text-gray-900 dark:text-white;
  transition: font-size 0.3s ease, margin-bottom 0.3s ease;
}

@media (max-width: 768px) {
  .gallery-title {
    @apply text-xl;
    margin-bottom: 0.5rem;
    transition: font-size 0.3s ease, margin-bottom 0.3s ease;
  }
}

.gallery-controls {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

/* 统一搜索栏样式 */
.unified-search-bar {
  display: flex;
  align-items: center;
  justify-content: center;
  /* 居中对齐 */
  gap: 0.5rem;
  margin-bottom: 0.75rem;
  padding: 0.5rem;
  background-color: white;
  border: 1px solid rgb(229, 231, 235);
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
  flex-wrap: wrap;
  position: relative;
  transition: gap 0.3s ease, padding 0.3s ease, margin-bottom 0.3s ease;
}

.unified-search-bar::after {
  content: '';
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 1px;
  height: 60%;
  background-color: rgb(229, 231, 235);
  opacity: 0.5;
}

.dark .unified-search-bar::after {
  background-color: rgb(75, 85, 99);
}

.dark .unified-search-bar {
  background-color: rgb(31, 41, 55);
  border-color: rgb(75, 85, 99);
}

.unified-search-bar .search-container {
  flex: 1;
  min-width: 200px;
  display: flex;
  align-items: center;
  position: relative;
}

.unified-search-bar .search-input {
  width: 100%;
  padding: 0.5rem;
  padding-right: 2.5rem;
  border: 1px solid rgb(209, 213, 219);
  border-radius: 0.375rem;
  font-size: 0.875rem;
  background-color: white;
  color: rgb(17, 24, 39);
  transition: border-color 0.2s, box-shadow 0.2s;
  height: 2.25rem;
  /* 设置固定高度 */
  box-sizing: border-box;
}

.dark .unified-search-bar .search-input {
  background-color: rgb(55, 65, 81);
  border-color: rgb(75, 85, 99);
  color: rgb(243, 244, 246);
}

.unified-search-bar .search-input:focus {
  outline: none;
  border-color: rgb(59, 130, 246);
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
}

.dark .unified-search-bar .search-input:focus {
  border-color: rgb(96, 165, 250);
  box-shadow: 0 0 0 2px rgba(96, 165, 250, 0.2);
}

.unified-search-bar .search-clear {
  position: absolute;
  right: 0.5rem;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: rgb(156, 163, 175);
  padding: 0.25rem;
  cursor: pointer;
  font-size: 0.875rem;
  border-radius: 9999px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.unified-search-bar .search-clear:hover {
  color: rgb(107, 114, 128);
  background-color: rgb(243, 244, 246);
}

.dark .unified-search-bar .search-clear:hover {
  color: rgb(209, 213, 219);
  background-color: rgb(55, 65, 81);
}

.unified-search-bar .search-controls {
  display: flex;
  align-items: center;
  justify-content: center;
  /* 居中对齐 */
  gap: 0.5rem;
  flex-wrap: wrap;
}

.unified-search-bar .sort-select {
  padding: 0.5rem;
  border: 1px solid rgb(209, 213, 219);
  border-radius: 0.375rem;
  font-size: 0.875rem;
  min-width: 100px;
  background-color: white;
  color: rgb(17, 24, 39);
  height: 2.25rem;
  /* 设置固定高度 */
  box-sizing: border-box;
}

.dark .unified-search-bar .sort-select {
  background-color: rgb(55, 65, 81);
  border-color: rgb(75, 85, 99);
  color: rgb(243, 244, 246);
}

.unified-search-bar .sort-order-button,
.unified-search-bar .grid-view-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  border: 1px solid rgb(209, 213, 219);
  border-radius: 0.375rem;
  background-color: white;
  color: rgb(107, 114, 128);
  font-size: 0.875rem;
  font-weight: 500;
  transition: all 0.2s;
  white-space: nowrap;
  height: 2.25rem;
  /* 设置固定高度 */
  box-sizing: border-box;
}

.dark .unified-search-bar .sort-order-button,
.dark .unified-search-bar .grid-view-toggle {
  background-color: rgb(55, 65, 81);
  border-color: rgb(75, 85, 99);
  color: rgb(156, 163, 175);
}

.unified-search-bar .sort-order-button:hover,
.unified-search-bar .grid-view-toggle:hover {
  background-color: rgb(243, 244, 246);
  color: rgb(55, 65, 81);
}

.dark .unified-search-bar .sort-order-button:hover,
.dark .unified-search-bar .grid-view-toggle:hover {
  background-color: rgb(75, 85, 99);
  color: rgb(209, 213, 219);
}

/* 移动端响应式调整 */
@media (max-width: 768px) {
  .unified-search-bar {
    gap: 0.25rem;
    padding: 0.375rem;
    margin-bottom: 0.5rem;
    transition: gap 0.3s ease, padding 0.3s ease, margin-bottom 0.3s ease;
  }

  .unified-search-bar::after {
    display: none; /* 移动端隐藏分隔线 */
    transition: opacity 0.3s ease;
  }

  .unified-search-bar .sort-order-button .sort-order-text,
  .unified-search-bar .grid-view-toggle .grid-view-text {
    display: none;
  }

  .unified-search-bar .sort-order-button,
  .unified-search-bar .grid-view-toggle {
    min-width: 44px;
    padding: 0.375rem;
    height: 2rem;
  }

  .unified-search-bar .sort-select {
    min-width: 80px;
    height: 2rem;
    padding: 0.375rem;
  }

  .unified-search-bar .search-input {
    height: 2rem;
    padding: 0.375rem;
    padding-right: 2rem;
  }
}

/* 桌面端显示文字标签 */
@media (min-width: 769px) {

  .unified-search-bar .sort-order-text,
  .unified-search-bar .grid-view-text {
    display: inline;
  }
}







.icon {
  @apply w-4 h-4;
}

.gallery-content {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  height: calc(100vh - var(--app-header-height, 60px) - var(--app-footer-height, 60px) - var(--gallery-header-height, 0px) - 2rem);
  /* 动态计算高度：100vh - 应用头部 - 应用底部 - 画廊头部 - 额外边距 */
  padding-bottom: 2rem;
  transition: height 0.3s ease, margin-top 0.3s ease, flex-direction 0.3s ease, gap 0.3s ease;
  /* 添加高度、margin、布局方向和间距的过渡动画 */
}

.gallery-content.header-hidden-mobile {
  height: calc(100vh - var(--app-header-height, 60px) - var(--app-footer-height, 60px) - 2rem);
  /* 隐藏画廊头部时的高度计算 */
  margin-top: calc(-1 * var(--gallery-header-height, 10rem));
  /* 使用动态计算的header高度 */
}

@media (min-width: 768px) {
  .gallery-content {
    flex-direction: row;
    height: calc(100vh - var(--app-header-height, 60px) - var(--app-footer-height, 60px) - var(--gallery-header-height, 0px) - 2rem);
    /* 桌面端使用固定高度计算 */
    transition: height 0.3s ease, margin-top 0.3s ease, flex-direction 0.3s ease, gap 0.3s ease;
  }

  .gallery-content.header-hidden-mobile {
    margin-top: 0;
    /* 桌面端不需要调整 */
    height: calc(100vh - var(--app-header-height, 60px) - var(--app-footer-height, 60px) - var(--gallery-header-height, 0px) - 2rem);
  }
}

@media (max-width: 767px) {
  .gallery-content {
    /* 移动端确保有足够的底部空间 */
    height: calc(100vh - var(--app-header-height, 60px) - var(--app-footer-height, 60px) - var(--gallery-header-height, 0px) - 4rem);
    padding-bottom: 3rem;
    /* 移动端增加底部内边距 */
  }

  .gallery-content.header-hidden-mobile {
    height: calc(100vh - var(--app-header-height, 60px) - var(--app-footer-height, 60px) - 4rem);
    /* 移动端隐藏头部时的高度计算 */
  }
}

.gallery-sidebar {
  width: 100%;
  flex-shrink: 0;
  transition: width 0.3s ease, position 0.3s ease, top 0.3s ease;
}

.sidebar-toggle {
  @apply flex items-center justify-between gap-2 py-3 px-4 mb-3 rounded-lg;
  @apply bg-white dark:bg-gray-800;
  @apply border border-gray-200 dark:border-gray-700;
  @apply text-gray-700 dark:text-gray-300;
  @apply font-medium;
  @apply shadow-sm;
  @apply cursor-pointer;
}

.sidebar-content {
  @apply flex flex-col gap-4;
  @apply overflow-hidden max-h-0 transition-all duration-300;
  @apply bg-white dark:bg-gray-800 rounded-lg p-0;
  @apply border border-transparent;
}

.sidebar-content.active {
  @apply max-h-[500px] p-4 mb-4;
  @apply border-gray-200 dark:border-gray-700;
  @apply overflow-y-auto;
}

@media (min-width: 768px) {
  .gallery-sidebar {
    width: 16rem;
    position: sticky;
    top: 1rem;
    transition: width 0.3s ease, position 0.3s ease, top 0.3s ease;
  }

  .sidebar-toggle {
    display: none;
    /* 在中等及以上尺寸屏幕隐藏折叠按钮 */
  }

  .sidebar-content {
    @apply max-h-[calc(100vh-16rem)] p-4;
    @apply bg-white dark:bg-gray-800 rounded-lg;
    @apply border border-gray-200 dark:border-gray-700;
    @apply shadow-sm overflow-y-auto;
    @apply sticky top-4;
  }
}

.gallery-main {
  flex: 1;
  position: relative;
  height: 100%;
  overflow-y: auto;
  padding-left: 16px;
  /* 增加左侧内边距，解决空间过窄的问题 */
  padding-right: 16px;
  /* 增加右侧内边距，解决空间过窄的问题 */
  padding-top: 2rem;
  /* 顶部内边距 */
  padding-bottom: 2rem;
  /* 底部内边距 */
  transition: padding-left 0.3s ease, padding-right 0.3s ease;
}

/* 移动端全屏筛选弹窗 */
.mobile-filter-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 1000;
  display: flex;
  align-items: flex-end;
  touch-action: none;
  /* 防止触摸滚动穿透 */
}

.mobile-filter-content {
  width: 100%;
  max-height: 80vh;
  background: white;
  border-radius: 1rem 1rem 0 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.dark .mobile-filter-content {
  background: rgb(31, 41, 55);
}

.mobile-filter-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid rgb(229, 231, 235);
}

.dark .mobile-filter-header {
  border-bottom-color: rgb(75, 85, 99);
}

.mobile-filter-header h3 {
  font-size: 1.125rem;
  font-weight: 600;
  color: rgb(17, 24, 39);
}

.dark .mobile-filter-header h3 {
  color: rgb(243, 244, 246);
}

.close-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border-radius: 0.5rem;
  background: rgb(243, 244, 246);
  color: rgb(75, 85, 99);
  transition: background-color 0.2s;
}

.dark .close-button {
  background: rgb(55, 65, 81);
  color: rgb(209, 213, 219);
}

.close-button:hover {
  background: rgb(229, 231, 235);
}

.dark .close-button:hover {
  background: rgb(75, 85, 99);
}

.mobile-filter-body {
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem;
}

/* 返回顶部按钮 */
.scroll-to-top-button {
  position: fixed;
  right: 1.5rem;
  width: 3rem;
  height: 3rem;
  background: rgb(59, 130, 246);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transition: all 0.3s ease;
  z-index: 999;
  cursor: pointer;
}

.scroll-to-top-button:hover {
  background: rgb(37, 99, 235);
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
}

@media (max-width: 768px) {
  .scroll-to-top-button {
    right: 1rem;
    width: 2.5rem;
    height: 2.5rem;
    font-size: 0.875rem;
  }
}



/* 响应式布局过渡动画 */
@media (prefers-reduced-motion: no-preference) {
  .gallery-page {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }
  
  .gallery-header,
  .gallery-content,
  .gallery-sidebar,
  .gallery-main,
  .unified-search-bar {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }
}

/* 为减少动画偏好的用户禁用过渡 */
@media (prefers-reduced-motion: reduce) {
  .gallery-page,
  .gallery-header,
  .gallery-content,
  .gallery-sidebar,
  .gallery-main,
  .unified-search-bar,
  .layout-transition-enter-active,
  .layout-transition-leave-active {
    transition: none !important;
  }
}

/* 为切换按钮添加过渡效果 */
.unified-search-bar .grid-view-toggle {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
  transform-origin: center;
}

.unified-search-bar .grid-view-toggle:active {
  transform: scale(0.95);
}

.unified-search-bar .grid-view-toggle::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: left 0.5s;
}

.unified-search-bar .grid-view-toggle:hover::before {
  left: 100%;
}

.dark .unified-search-bar .grid-view-toggle::before {
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
}

/* 为所有控制按钮添加统一的点击效果 */
.unified-search-bar .sort-order-button,
.unified-search-bar .sort-select {
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.unified-search-bar .sort-order-button:active,
.unified-search-bar .sort-select:active {
  transform: scale(0.98);
}

/* 删除了gallery-info相关样式 */
</style>
