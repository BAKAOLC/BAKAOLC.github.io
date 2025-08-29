<template>
  <div class="language-switcher">
    <button @click="toggleLanguageMenu" class="language-button" :aria-expanded="isOpen" aria-haspopup="true">
      <globe-icon class="icon" />
      <span class="language-text">{{ displayLanguage }}</span>
      <chevron-down-icon class="arrow-icon" :class="{ 'rotate-180': isOpen }" />
    </button>

    <div v-show="isOpen" class="language-menu" :class="{ 'menu-open': isOpen }">
      <button v-for="lang in languages" :key="lang.value" @click="changeLanguage(lang.value)" class="language-option"
        :class="{ 'active': currentLanguage === lang.value }">
        {{ lang.label }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useI18n } from 'vue-i18n'
import { GlobeIcon, ChevronDownIcon } from 'lucide-vue-next'
import { useAppStore } from '@/stores/app'
import type { Language } from '@/types'

const { locale } = useI18n()
const appStore = useAppStore()

const isOpen = ref(false)
const menuRef = ref<HTMLDivElement | null>(null)
const buttonRef = ref<HTMLButtonElement | null>(null)

const languages = [
  { label: '简体中文', value: 'zh' as Language },
  { label: 'English', value: 'en' as Language },
  { label: '日本語', value: 'jp' as Language }
]

const currentLanguage = computed(() => appStore.currentLanguage)

const displayLanguage = computed(() => {
  const lang = languages.find(l => l.value === currentLanguage.value)
  return lang ? lang.label : '简体中文'
})

const toggleLanguageMenu = () => {
  isOpen.value = !isOpen.value
}

const changeLanguage = (lang: Language) => {
  appStore.setLanguage(lang)
  locale.value = lang
  isOpen.value = false
}

const handleClickOutside = (event: MouseEvent) => {
  const target = event.target as HTMLElement
  if (
    isOpen.value &&
    menuRef.value &&
    buttonRef.value &&
    !menuRef.value.contains(target) &&
    !buttonRef.value.contains(target)
  ) {
    isOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
.language-switcher {
  @apply relative;
}

.language-button {
  @apply flex items-center gap-2 py-2 px-3 rounded-lg;
  @apply bg-white dark:bg-gray-800;
  @apply text-gray-700 dark:text-gray-300;
  @apply border border-gray-200 dark:border-gray-700;
  @apply hover:bg-gray-50 dark:hover:bg-gray-700;
  @apply transition-colors duration-200;
  @apply focus:outline-none focus:ring-2 focus:ring-primary-500;
}

.icon {
  @apply w-4 h-4;
}



.language-menu {
  @apply absolute right-0 mt-2 py-1;
  @apply bg-white dark:bg-gray-800;
  @apply border border-gray-200 dark:border-gray-700;
  @apply rounded-lg shadow-lg;
  @apply w-40 z-10;
  @apply opacity-0 scale-95 origin-top-right;
  @apply transition-all duration-200;
}

.menu-open {
  @apply opacity-100 scale-100;
}

.language-option {
  @apply flex items-center w-full px-4 py-2;
  @apply text-left text-sm text-gray-700 dark:text-gray-300;
  @apply hover:bg-gray-100 dark:hover:bg-gray-700;
  @apply transition-colors duration-150;
}

.language-option.active {
  @apply bg-primary-50 dark:bg-primary-900/20;
  @apply text-primary-700 dark:text-primary-400;
  @apply font-medium;
}

.language-text {
  @apply hidden sm:inline;
}

.arrow-icon {
  @apply hidden sm:inline-block w-4 h-4 ml-1 transition-transform duration-200;
}

@media (max-width: 640px) {
  .language-button {
    @apply p-2;
  }
  
  .language-menu {
    @apply w-32;
  }
}
</style>
