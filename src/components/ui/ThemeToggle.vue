<template>
  <button
    type="button"
    class="theme-toggle"
    :title="themeLabel"
    :aria-label="themeLabel"
    @click="toggleTheme"
  >
    <span class="sr-only">{{ themeLabel }}</span>
    <Transition name="theme-icon" mode="out-in">
      <component :is="themeIcon" :key="themeMode" class="icon" aria-hidden="true" />
    </Transition>
  </button>
</template>

<script setup lang="ts">
import { MonitorIcon, MoonIcon, SunIcon } from '@lucide/vue';
import { computed, type Component } from 'vue';
import { useI18n } from 'vue-i18n';

import { useThemeStore } from '@/stores/theme';

const { t } = useI18n();
const themeStore = useThemeStore();

const themeMode = computed(() => themeStore.themeMode);

const toggleTheme = (): void => {
  themeStore.toggleThemeMode();
};

const themeIcon = computed<Component>(() => {
  switch (themeMode.value) {
    case 'light':
      return SunIcon;
    case 'dark':
      return MoonIcon;
    case 'auto':
    default:
      return MonitorIcon;
  }
});

const themeLabel = computed<string>(() => {
  switch (themeMode.value) {
    case 'light':
      return t('theme.light');
    case 'dark':
      return t('theme.dark');
    case 'auto':
    default:
      return t('theme.auto');
  }
});
</script>

<style scoped>
@reference "@/assets/styles/main.css";

.theme-toggle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.25rem;
  height: 2.25rem;
  border-radius: var(--radius-control);
  background: var(--surface-card-solid);
  color: var(--text-secondary);
  border: 1px solid var(--border-subtle);
  cursor: pointer;
  box-shadow: var(--shadow-xs);
  transition:
    background-color 0.16s ease,
    border-color 0.16s ease,
    color 0.16s ease,
    transform 0.16s var(--ease-out-expo);
}

.theme-toggle:hover {
  background: var(--surface-muted);
  border-color: var(--border-default);
  color: var(--accent-primary);
}

.theme-toggle:active {
  transform: scale(0.94);
}

.theme-toggle:focus-visible {
  outline: 2px solid var(--accent-primary);
  outline-offset: 2px;
}

.icon {
  width: 1.0625rem;
  height: 1.0625rem;
}

.theme-icon-enter-active,
.theme-icon-leave-active {
  transition: opacity 0.15s ease, transform 0.15s var(--ease-out-expo);
}

.theme-icon-enter-from {
  opacity: 0;
  transform: rotate(-30deg) scale(0.75);
}

.theme-icon-leave-to {
  opacity: 0;
  transform: rotate(30deg) scale(0.75);
}

@media (max-width: 640px) {
  .theme-toggle {
    width: 2.125rem;
    height: 2.125rem;
  }
}
</style>
