<template>
  <div class="language-switcher" @keydown.esc="closeMenu">
    <button
      ref="buttonRef"
      type="button"
      class="language-button"
      :class="{ 'is-open': isOpen }"
      :aria-expanded="isOpen"
      aria-haspopup="listbox"
      :aria-label="displayLanguage"
      @click="toggleLanguageMenu"
    >
      <GlobeIcon class="icon" aria-hidden="true" />
      <span class="language-text">{{ displayLanguage }}</span>
      <ChevronDownIcon class="arrow-icon" :class="{ 'rotate-180': isOpen }" aria-hidden="true" />
    </button>

    <Transition name="dropdown-pop">
      <div
        v-if="isOpen"
        ref="menuRef"
        class="language-menu"
        role="listbox"
        :aria-label="displayLanguage"
      >
        <button
          v-for="lang in languages"
          :key="lang.value"
          type="button"
          class="language-option"
          :class="{ 'active': currentLanguage === lang.value }"
          role="option"
          :aria-selected="currentLanguage === lang.value"
          @click="changeLanguage(lang.value)"
        >
          <span class="option-label">{{ lang.label }}</span>
          <CheckIcon v-if="currentLanguage === lang.value" class="check-icon" aria-hidden="true" />
        </button>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { CheckIcon, ChevronDownIcon, GlobeIcon } from '@lucide/vue';
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';

import { useClickOutside } from '@/composables/useClickOutside';
import { useLanguageStore } from '@/stores/language';
import type { Language } from '@/types';
import { getEnabledLanguages, getLanguageNativeName } from '@/utils/language';

const { locale } = useI18n();
const languageStore = useLanguageStore();

const isOpen = ref(false);
const menuRef = ref<HTMLDivElement | null>(null);
const buttonRef = ref<HTMLButtonElement | null>(null);

const enabledLanguages = getEnabledLanguages();

const languages = computed(() => {
  return enabledLanguages.map(langCode => ({
    value: langCode as Language,
    label: getLanguageNativeName(langCode),
  }));
});

const currentLanguage = computed(() => languageStore.currentLanguage);

const displayLanguage = computed(() => {
  return getLanguageNativeName(currentLanguage.value);
});

const toggleLanguageMenu = (): void => {
  isOpen.value = !isOpen.value;
};

const closeMenu = (): void => {
  if (!isOpen.value) return;
  isOpen.value = false;
  buttonRef.value?.focus();
};

const changeLanguage = (lang: Language): void => {
  languageStore.setLanguage(lang);
  locale.value = lang;
  isOpen.value = false;
};

useClickOutside({
  targets: [menuRef, buttonRef],
  enabled: () => isOpen.value,
  onClickOutside: () => {
    isOpen.value = false;
  },
});
</script>

<style scoped>
@reference "@/assets/styles/main.css";

.language-switcher {
  position: relative;
}

.language-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.45rem;
  height: 2.25rem;
  padding: 0 0.75rem;
  border-radius: var(--radius-control);
  background: var(--surface-card-solid);
  color: var(--text-secondary);
  border: 1px solid var(--border-subtle);
  font-size: 0.8125rem;
  font-weight: 500;
  cursor: pointer;
  box-shadow: var(--shadow-xs);
  transition:
    background-color 0.16s ease,
    border-color 0.16s ease,
    color 0.16s ease,
    transform 0.16s var(--ease-out-expo);
}

.language-button:hover,
.language-button.is-open {
  background: var(--surface-muted);
  border-color: var(--border-default);
  color: var(--text-primary);
}

.language-button:active {
  transform: scale(0.96);
}

.language-button:focus-visible {
  outline: 2px solid var(--accent-primary);
  outline-offset: 2px;
}

.icon {
  width: 1rem;
  height: 1rem;
  flex-shrink: 0;
}

.language-text {
  white-space: nowrap;
}

.arrow-icon {
  width: 0.875rem;
  height: 0.875rem;
  flex-shrink: 0;
  opacity: 0.7;
  transition: transform 0.2s var(--ease-out-expo);
}

.arrow-icon.rotate-180 {
  transform: rotate(180deg);
}

.language-menu {
  position: absolute;
  right: 0;
  top: calc(100% + 0.45rem);
  z-index: 60;
  min-width: 9.5rem;
  padding: 0.3rem;
  border-radius: 0.875rem;
  background: var(--surface-elevated);
  backdrop-filter: blur(18px) saturate(165%);
  -webkit-backdrop-filter: blur(18px) saturate(165%);
  border: 1px solid var(--border-default);
  box-shadow: var(--shadow-lg);
  transform-origin: top right;
}

.language-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  width: 100%;
  padding: 0.5rem 0.75rem;
  border: none;
  border-radius: 0.5rem;
  background: transparent;
  color: var(--text-secondary);
  font-size: 0.8125rem;
  font-weight: 500;
  text-align: left;
  cursor: pointer;
  transition: background-color 0.15s ease, color 0.15s ease;
}

.language-option:hover {
  background: var(--surface-muted);
  color: var(--text-primary);
}

.language-option.active {
  background: var(--accent-soft);
  color: var(--accent-primary-hover);
  font-weight: 600;
}

.dark .language-option.active {
  color: var(--accent-primary);
}

.check-icon {
  width: 0.875rem;
  height: 0.875rem;
  flex-shrink: 0;
}

.dropdown-pop-enter-active {
  transition: opacity 0.18s var(--ease-out-expo), transform 0.18s var(--ease-out-expo);
}

.dropdown-pop-leave-active {
  transition: opacity 0.13s ease-in, transform 0.13s ease-in;
}

.dropdown-pop-enter-from,
.dropdown-pop-leave-to {
  opacity: 0;
  transform: translateY(-6px) scale(0.96);
}

@media (max-width: 640px) {
  .language-button {
    width: 2.125rem;
    height: 2.125rem;
    padding: 0;
    gap: 0;
  }

  .language-text,
  .arrow-icon {
    display: none;
  }

  .language-menu {
    min-width: 8.5rem;
  }
}
</style>
