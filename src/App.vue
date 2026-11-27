<template>
  <div id="app" class="app">
    <LoadingScreen v-if="isLoading" :ready="isPreloadReady" @complete="onLoadingComplete" />

    <template v-else>
      <header class="header">
        <div class="header-inner">
          <div class="header-bar">
            <router-link to="/" class="logo-link">
              <img :src="siteConfig.personal.avatar" :alt="t('common.logo')" class="logo" />
              <h1 class="site-title">{{ appTitle }}</h1>
            </router-link>

            <div class="header-nav-desktop">
              <NavigationBar />
            </div>

            <div class="header-controls">
              <LanguageSwitcher class="language-control" />
              <ThemeToggle class="theme-control" />
            </div>
          </div>

          <div class="header-nav-mobile">
            <NavigationBar />
          </div>
        </div>
      </header>

      <main class="main">
        <router-view v-slot="{ Component }">
          <transition name="page-fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </main>

      <footer class="footer">
        <div class="footer-content">
          <p class="footer-text">{{ appCopyright }}</p>
        </div>
      </footer>
    </template>

    <!-- Live2D 挂件 -->
    <Live2DWidget v-if="siteConfig.features.live2d" />

    <!-- BGM播放器 -->
    <BgmPlayer />

    <!-- 弹窗容器 -->
    <ModalContainer />

    <!-- 通知容器 -->
    <NotificationContainer />
  </div>
</template>

<script setup lang="ts">
import { computed, defineAsyncComponent, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

import LoadingScreen from '@/components/LoadingScreen.vue';
import LanguageSwitcher from '@/components/ui/LanguageSwitcher.vue';
import NavigationBar from '@/components/ui/NavigationBar.vue';
import ThemeToggle from '@/components/ui/ThemeToggle.vue';
import { useTimers } from '@/composables/useTimers';
import { siteConfig } from '@/config/site';
import { getEventManagerService } from '@/services/eventManagerService';
import { getImageCache } from '@/services/imageCache';
import { getScreenManagerService } from '@/services/screenManagerService';
import { getTimerService } from '@/services/timerService';
import { titleManager } from '@/services/titleManager';
import { useAppStore } from '@/stores/app';
import { useLanguageStore } from '@/stores/language';
import { useThemeStore } from '@/stores/theme';
import { getAppCopyright, getAppTitle } from '@/utils/appConfig';

const { locale, t } = useI18n();
const appStore = useAppStore();
const languageStore = useLanguageStore();
const themeStore = useThemeStore();
const { setTimeout } = useTimers();

const BgmPlayer = defineAsyncComponent(() => import('@/components/BgmPlayer.vue'));
const Live2DWidget = defineAsyncComponent(() => import('@/components/Live2DWidget.vue'));
const ModalContainer = defineAsyncComponent(() => import('@/components/modals/ModalContainer.vue'));
const NotificationContainer = defineAsyncComponent(() => import('@/components/NotificationContainer.vue'));

const appTitle = computed(() => getAppTitle(languageStore.currentLanguage));
const appCopyright = computed(() => getAppCopyright(languageStore.currentLanguage));

const preloadedImages = ref<HTMLImageElement[]>([]);
const isPreloadReady = ref(false);
const isLoading = computed(() => appStore.isLoading);

// 轻量预加载基础头像资源，设置最大 420ms 上限，不阻塞首屏体验
const preloadImages = async (): Promise<void> => {
  const imageUrls = new Set<string>();

  if (siteConfig.personal.avatar) {
    imageUrls.add(siteConfig.personal.avatar);
  }

  siteConfig.characters.forEach(character => {
    if (character.avatar) {
      imageUrls.add(character.avatar);
    }
  });

  if (imageUrls.size === 0) {
    isPreloadReady.value = true;
    return;
  }

  const imagePromises = Array.from(imageUrls).map(url => {
    return new Promise<void>((resolve) => {
      const img = new Image();
      preloadedImages.value.push(img);

      const settle = (): void => {
        resolve();
      };

      img.onload = settle;
      img.onerror = settle;
      img.src = url;
    });
  });

  await Promise.race([
    Promise.all(imagePromises),
    new Promise<void>(resolve => setTimeout(() => resolve(), 420)),
  ]);

  isPreloadReady.value = true;
};

const onLoadingComplete = (): void => {
  appStore.isLoading = false;
};

const updateDocumentTitle = (): void => {
  titleManager.updateCurrentTitle();
};

let cleanupSystemThemeListener: (() => void) | null = null;

onMounted(() => {
  getScreenManagerService().initialize();
  themeStore.applyTheme();
  cleanupSystemThemeListener = themeStore.setupSystemThemeListener();
  void preloadImages();
});

watch(locale, () => {
  updateDocumentTitle();
}, { immediate: false });

onBeforeUnmount(() => {
  preloadedImages.value.forEach(img => {
    img.onload = null;
    img.onerror = null;
    img.src = '';
  });
  preloadedImages.value = [];

  if (cleanupSystemThemeListener) {
    cleanupSystemThemeListener();
  }

  try {
    getScreenManagerService().destroy();
    getEventManagerService().destroy();
    getTimerService().destroy();
    getImageCache().clearAllCache();
  } catch (error) {
    console.error('Error cleaning up services:', error);
  }
});
</script>

<style scoped>
@reference "@/assets/styles/main.css";

.app {
  display: flex;
  flex-direction: column;
  height: 100vh;
  height: 100dvh;
  overflow: hidden;
  background-color: var(--bg-canvas);
  color: var(--text-primary);
}

.header {
  position: relative;
  z-index: 40;
  flex-shrink: 0;
  background: var(--surface-glass);
  backdrop-filter: blur(18px) saturate(165%);
  -webkit-backdrop-filter: blur(18px) saturate(165%);
  border-bottom: 1px solid var(--border-subtle);
  box-shadow: var(--shadow-xs);
  transition: background-color 0.25s ease, border-color 0.25s ease;
}

.header-inner {
  width: 100%;
  max-width: 1440px;
  margin: 0 auto;
  padding: 0 1.25rem;
}

.header-bar {
  display: grid;
  grid-template-columns: minmax(0, auto) minmax(0, 1fr) auto;
  align-items: center;
  gap: 1rem;
  min-height: 58px;
}

.logo-link {
  display: inline-flex;
  align-items: center;
  gap: 0.625rem;
  color: var(--text-primary);
  text-decoration: none;
  min-width: 0;
  padding: 0.25rem 0.375rem 0.25rem 0.25rem;
  border-radius: 0.75rem;
  transition: opacity 0.18s ease, transform 0.2s var(--ease-out-expo);
}

.logo-link:hover {
  opacity: 0.88;
}

.logo-link:focus-visible {
  outline: 2px solid var(--accent-primary);
  outline-offset: 2px;
}

.logo {
  width: 2rem;
  height: 2rem;
  border-radius: 9999px;
  object-fit: cover;
  flex-shrink: 0;
  border: 1.5px solid var(--border-default);
  box-shadow: var(--shadow-xs);
}

.site-title {
  margin: 0;
  font-size: 1.0625rem;
  font-weight: 700;
  letter-spacing: -0.015em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.header-nav-desktop {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 0;
}

.header-nav-mobile {
  display: none;
}

.header-controls {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.5rem;
  flex-shrink: 0;
}

.main {
  flex: 1 1 0%;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
}

.footer {
  flex-shrink: 0;
  height: 36px;
  background: var(--surface-glass);
  backdrop-filter: blur(14px) saturate(150%);
  -webkit-backdrop-filter: blur(14px) saturate(150%);
  border-top: 1px solid var(--border-subtle);
  transition: background-color 0.25s ease, border-color 0.25s ease;
}

.footer-content {
  height: 100%;
  max-width: 1440px;
  margin: 0 auto;
  padding: 0 1.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.footer-text {
  margin: 0;
  font-size: 0.75rem;
  color: var(--text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Page Transitions */
.page-fade-enter-active {
  transition: opacity 0.22s var(--ease-out-expo), transform 0.22s var(--ease-out-expo);
}

.page-fade-leave-active {
  transition: opacity 0.14s ease-in;
}

.page-fade-enter-from {
  opacity: 0;
  transform: translateY(6px);
}

.page-fade-leave-to {
  opacity: 0;
}

/* Tablet tightening */
@media (max-width: 1024px) {
  .header-inner {
    padding: 0 0.875rem;
  }

  .header-bar {
    gap: 0.625rem;
  }
}

/* Mobile: compact top bar + full-width 1-tap horizontal pill nav strip */
@media (max-width: 767px) {
  .header-inner {
    padding: 0 0.75rem;
  }

  .header-bar {
    display: flex;
    justify-content: space-between;
    min-height: 50px;
    gap: 0.5rem;
  }

  .header-nav-desktop {
    display: none;
  }

  .header-nav-mobile {
    display: block;
    border-top: 1px solid var(--border-subtle);
    margin: 0 -0.75rem;
    padding: 0.375rem 0.75rem;
  }

  .logo {
    width: 1.75rem;
    height: 1.75rem;
  }

  .site-title {
    font-size: 0.9375rem;
  }

  .header-controls {
    gap: 0.375rem;
  }

  .footer {
    height: 32px;
  }
}
</style>
