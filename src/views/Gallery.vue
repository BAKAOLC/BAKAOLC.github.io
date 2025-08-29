<template>
  <div class="gallery-page">
    <div class="container mx-auto px-4 py-4 flex-1 h-full overflow-hidden">
      <div class="gallery-header">
        <h1 class="gallery-title">{{ $t('gallery.title') }}</h1>
        <div class="gallery-controls">
          <div class="search-container">
            <input 
              type="text" 
              :value="searchQuery"
              @input="e => updateSearchQuery((e.target as HTMLInputElement).value)" 
              :placeholder="$t('gallery.searchPlaceholder')" 
              class="search-input"
            />
            <button v-if="searchQuery" @click="clearSearch" class="search-clear">
              <i class="fa fa-times" aria-hidden="true"></i>
            </button>
          </div>
          <button class="grid-view-toggle" @click="toggleGridView">
            <i :class="isGridView ? 'fa fa-th-large' : 'fa fa-th-list'" class="icon"></i>
            {{ $t(isGridView ? 'gallery.listView' : 'gallery.gridView') }}
          </button>
        </div>
      </div>


      
      <div class="gallery-content">
        <aside class="gallery-sidebar">
          <div class="sidebar-toggle md:hidden" @click="toggleSidebar">
            <i :class="isSidebarOpen ? 'fa fa-times' : 'fa fa-filter'" class="icon"></i>
            {{ $t('gallery.filters') }}
          </div>
          <div class="sidebar-content" :class="{ 'active': isSidebarOpen }">
            <character-selector />
            <type-selector />
          </div>
        </aside>

        <div class="gallery-main">
          <image-gallery :images="characterImages" :grid-view="isGridView" />
        </div>
      </div>
    </div>

    <!-- 在画廊页面内显示全屏查看器 -->
    <fullscreen-viewer v-if="viewerActive" :image-id="currentImageId" :is-active="viewerActive" @close="closeViewer" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAppStore } from '@/stores/app'
import CharacterSelector from '@/components/CharacterSelector.vue'
import TypeSelector from '@/components/TypeSelector.vue'
import ImageGallery from '@/components/ImageGallery.vue'
import FullscreenViewer from '@/components/FullscreenViewer.vue'

const { t: $t } = useI18n()
const appStore = useAppStore()

const isGridView = ref(true)
const isSidebarOpen = ref(false)
const searchDebounceTimeout = ref<number | null>(null)

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

// 切换侧边栏
const toggleSidebar = () => {
  isSidebarOpen.value = !isSidebarOpen.value
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
})

onBeforeUnmount(() => {
  window.removeEventListener('viewImage', openViewer as EventListener)
  window.removeEventListener('viewerNavigate', handleViewerNavigate as EventListener)
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
  @apply flex flex-wrap items-center justify-between mb-6;
  @apply border-b border-gray-200 dark:border-gray-700 pb-4;
}

@media (max-width: 768px) {
  .gallery-header {
    @apply flex-col items-center text-center gap-4;
  }
}

.gallery-title {
  @apply text-3xl font-bold;
  @apply text-gray-900 dark:text-white;
}

.gallery-controls {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

@media (max-width: 768px) {
  .gallery-controls {
    @apply flex-col items-center gap-3 w-full;
  }
}

.grid-view-toggle {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  border-radius: 0.5rem;
  background-color: rgb(243, 244, 246);
  color: rgb(55, 65, 81);
  font-size: 0.875rem;
  font-weight: 500;
  transition: background-color 0.2s;
}

.dark .grid-view-toggle {
  background-color: rgb(31, 41, 55);
  color: rgb(209, 213, 219);
}

.grid-view-toggle:hover {
  background-color: rgb(229, 231, 235);
}

.dark .grid-view-toggle:hover {
  background-color: rgb(55, 65, 81);
}

.search-container {
  position: relative;
  width: 16rem;
  margin-right: 0.5rem;
}

@media (max-width: 768px) {
  .search-container {
    @apply w-full max-w-sm mx-0;
  }
}

.search-input {
  width: 100%;
  padding: 0.5rem 0.75rem;
  padding-right: 2.5rem;
  border: 1px solid rgb(209, 213, 219);
  border-radius: 0.375rem;
  background-color: white;
  color: rgb(55, 65, 81);
  font-size: 0.875rem;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.dark .search-input {
  background-color: rgb(31, 41, 55);
  border-color: rgb(75, 85, 99);
  color: rgb(229, 231, 235);
}

.search-input:focus {
  outline: none;
  border-color: rgb(59, 130, 246);
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
}

.dark .search-input:focus {
  border-color: rgb(96, 165, 250);
  box-shadow: 0 0 0 2px rgba(96, 165, 250, 0.2);
}

.search-clear {
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

.search-clear:hover {
  color: rgb(107, 114, 128);
  background-color: rgb(243, 244, 246);
}

.dark .search-clear:hover {
  color: rgb(209, 213, 219);
  background-color: rgb(55, 65, 81);
}



.icon {
  @apply w-4 h-4;
}

.gallery-content {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  height: calc(100vh - 12rem);
  /* 设置固定高度减去header和footer高度 */
  padding-bottom: 2rem;
}

@media (min-width: 768px) {
  .gallery-content {
    flex-direction: row;
  }
}

.gallery-sidebar {
  width: 100%;
  flex-shrink: 0;
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
}

/* 删除了gallery-info相关样式 */
</style>
