<template>
  <div id="app" class="app">
    <loading-screen v-if="isLoading" :progress="loadingProgress" @complete="onLoadingComplete" />

    <template v-else>
      <header class="header">
        <div class="header-content">
          <router-link to="/" class="logo-link">
            <img src="/assets/avatar.png" alt="Logo" class="logo" />
            <h1 class="site-title">{{ t('app.title') }}</h1>
          </router-link>

          <div class="header-controls">
            <language-switcher class="language-control" />
            <theme-toggle class="theme-control" />
          </div>
        </div>
      </header>

      <main class="main">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </main>

      <footer class="footer">
        <div class="footer-content">
          <p>© 2025 {{ t('app.title') }}</p>
        </div>
      </footer>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAppStore } from '@/stores/app'
import { siteConfig } from '@/config/site'
import LoadingScreen from '@/components/LoadingScreen.vue'
import LanguageSwitcher from '@/components/ui/LanguageSwitcher.vue'
import ThemeToggle from '@/components/ui/ThemeToggle.vue'

const { t } = useI18n()
const appStore = useAppStore()

// 加载状态
const isLoading = computed(() => appStore.isLoading)
const loadingProgress = ref(0)
const totalAssets = ref(0)
const loadedAssets = ref(0)

// 预加载基本图像（不包括画廊图片）
const preloadImages = async () => {
  // 获取基本图片URL
  const imageUrls = new Set<string>()

  // 添加基本图像（如头像）
  imageUrls.add('/assets/avatar.png')

  // 添加角色头像
  siteConfig.characters.forEach(character => {
    if (character.avatar) {
      imageUrls.add(character.avatar)
    }
  })

  // 注意：不再预加载画廊图片，因为已经有预览图处理
  // 画廊图片将在需要时按需加载

  totalAssets.value = imageUrls.size

  // 开始预加载
  const promises = Array.from(imageUrls).map(url => {
    return new Promise<void>((resolve) => {
      const img = new Image()
      img.onload = () => {
        loadedAssets.value++
        loadingProgress.value = (loadedAssets.value / totalAssets.value) * 100
        resolve()
      }
      img.onerror = () => {
        loadedAssets.value++
        loadingProgress.value = (loadedAssets.value / totalAssets.value) * 100
        resolve() // 即使加载失败也继续
      }
      img.src = url
    })
  })

  // 确保至少有2秒的加载时间，即使资源很快加载完
  await Promise.all([
    Promise.all(promises),
    new Promise(resolve => setTimeout(resolve, 2000))
  ])

  // 确保进度为100%
  loadingProgress.value = 100
}

// 加载完成
const onLoadingComplete = () => {
  appStore.isLoading = false
}

// 初始化
onMounted(() => {
  // 设置初始主题
  if (appStore.isDarkMode) {
    document.documentElement.classList.add('dark')
  } else {
    document.documentElement.classList.remove('dark')
  }

  // 处理GitHub Pages 404重定向
  const redirect = sessionStorage.redirect
  delete sessionStorage.redirect
  if (redirect && redirect !== location.href) {
    history.replaceState(null, '', redirect)
  }

  // 开始预加载图像
  preloadImages()
})
</script>

<style scoped>
.app {
  @apply flex flex-col h-screen;
  @apply overflow-hidden;
  /* 防止整体滚动 */
}

.header {
  @apply bg-white dark:bg-gray-800;
  @apply border-b border-gray-200 dark:border-gray-700;
  @apply shadow-sm;
  @apply transition-colors duration-500;
  min-height: 60px;
  /* 最小头部高度，允许在移动端扩展 */
}

.header-content {
  @apply container mx-auto px-4;
  @apply flex items-center justify-between;
  min-height: 60px;
}

.logo-link {
  @apply flex items-center gap-3;
  @apply text-gray-900 dark:text-white;
  @apply no-underline;
}

.logo {
  @apply w-8 h-8 rounded-full;
}

.site-title {
  @apply text-xl font-bold;
}

.header-controls {
  @apply flex items-center gap-3;
}

.main {
  @apply flex-1;
  @apply bg-gray-50 dark:bg-gray-900;
  @apply transition-colors duration-500;
  @apply overflow-hidden;
  /* 防止主体区域滚动，让内部组件自己控制滚动 */
}

.footer {
  @apply bg-white dark:bg-gray-800;
  @apply border-t border-gray-200 dark:border-gray-700;
  @apply transition-colors duration-500;
  height: 60px;
  /* 固定底部高度 */
}

.footer-content {
  @apply container mx-auto px-4;
  @apply flex items-center justify-center;
  @apply text-gray-500 dark:text-gray-400;
  @apply text-sm;
  height: 100%;
}

/* Page Transitions */
.fade-enter-active,
.fade-leave-active {
  @apply transition-opacity duration-300;
}

.fade-enter-from,
.fade-leave-to {
  @apply opacity-0;
}

@media (max-width: 640px) {
  .header {
    min-height: auto;
  }
  
  .header-content {
    @apply flex-row items-center justify-between;
    @apply py-3;
    min-height: auto;
  }

  .site-title {
    @apply text-lg;
  }
  
  .header-controls {
    @apply gap-2;
  }
}
</style>
