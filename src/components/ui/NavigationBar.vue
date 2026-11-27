<template>
  <nav v-if="shouldShowNavigation" class="navigation-bar" :aria-label="t('nav.menu')">
    <div ref="navTrackRef" class="nav-track">
      <router-link
        v-for="item in visibleNavItems"
        :key="item.name"
        :ref="el => setNavItemRef(item.path, el)"
        :to="item.path"
        class="nav-item"
        :class="{ 'nav-item-active': isActiveRoute(item.path) }"
        :title="t(item.label)"
        :aria-label="t(item.label)"
        :aria-current="isActiveRoute(item.path) ? 'page' : undefined"
      >
        <i v-if="item.icon" :class="item.icon" class="nav-icon" aria-hidden="true"></i>
        <span class="nav-text">{{ t(item.label) }}</span>
      </router-link>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch, type ComponentPublicInstance } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute } from 'vue-router';

import { siteConfig } from '@/config/site';

interface NavItem {
  name: string;
  path: string;
  label: string;
  icon?: string;
  requiresFeature?: keyof typeof siteConfig.features;
}

const { t } = useI18n();
const route = useRoute();

const navTrackRef = ref<HTMLElement | null>(null);
const navItemElements = new Map<string, HTMLElement>();

const navItems: NavItem[] = [
  {
    name: 'home',
    path: '/',
    label: 'nav.home',
    icon: 'fas fa-home',
  },
  {
    name: 'gallery',
    path: '/gallery',
    label: 'nav.gallery',
    icon: 'fas fa-images',
    requiresFeature: 'gallery',
  },
  {
    name: 'articles',
    path: '/articles',
    label: 'nav.articles',
    icon: 'fas fa-newspaper',
    requiresFeature: 'articles',
  },
  {
    name: 'character-profiles',
    path: '/character-profiles',
    label: 'nav.characterProfiles',
    icon: 'fas fa-user-circle',
    requiresFeature: 'characterProfiles',
  },
  {
    name: 'links',
    path: '/links',
    label: 'nav.links',
    icon: 'fas fa-link',
    requiresFeature: 'links',
  },
];

const visibleNavItems = computed(() => {
  return navItems.filter(item => {
    if (!item.requiresFeature) return true;
    return siteConfig.features[item.requiresFeature];
  });
});

const shouldShowNavigation = computed(() => {
  return visibleNavItems.value.length > 1;
});

const isActiveRoute = (path: string): boolean => {
  if (path === '/') {
    return route.path === '/';
  }
  return route.path.startsWith(path);
};

const setNavItemRef = (path: string, el: Element | ComponentPublicInstance | null): void => {
  if (!el) {
    navItemElements.delete(path);
    return;
  }

  const domEl = el instanceof HTMLElement
    ? el
    : ('$el' in el && el.$el instanceof HTMLElement ? el.$el : null);

  if (domEl) {
    navItemElements.set(path, domEl);
  }
};

const centerActiveItem = (): void => {
  nextTick(() => {
    const activeItem = visibleNavItems.value.find(item => isActiveRoute(item.path));
    if (!activeItem) return;

    const targetEl = navItemElements.get(activeItem.path);
    if (!targetEl || !navTrackRef.value) return;

    if (navTrackRef.value.scrollWidth > navTrackRef.value.clientWidth) {
      targetEl.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center',
      });
    }
  });
};

watch(() => route.path, () => {
  centerActiveItem();
});

onMounted(() => {
  centerActiveItem();
});
</script>

<style scoped>
@reference "@/assets/styles/main.css";

.navigation-bar {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  min-width: 0;
}

.nav-track {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  max-width: 100%;
  padding: 0.22rem;
  border-radius: var(--radius-control);
  background: var(--surface-muted);
  border: 1px solid var(--border-subtle);
  overflow-x: auto;
  scrollbar-width: none;
  -webkit-overflow-scrolling: touch;
}

.nav-track::-webkit-scrollbar {
  display: none;
}

.nav-item {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  padding: 0.375rem 0.825rem;
  border-radius: 0.375rem;
  color: var(--text-secondary);
  text-decoration: none;
  font-size: 0.8125rem;
  font-weight: 500;
  line-height: 1.25;
  white-space: nowrap;
  flex-shrink: 0;
  transition:
    color 0.16s ease,
    background-color 0.16s ease,
    box-shadow 0.16s ease;
}

.nav-item:hover {
  color: var(--text-primary);
  background: var(--surface-glass-strong);
}

.nav-item:active {
  transform: scale(0.97);
}

.nav-item:focus-visible {
  outline: 2px solid var(--accent-primary);
  outline-offset: -2px;
}

.nav-item-active {
  color: var(--accent-primary-hover);
  background: var(--surface-card-solid);
  font-weight: 600;
  box-shadow: var(--shadow-sm);
}

.dark .nav-item-active {
  color: var(--accent-primary);
  background: rgba(56, 189, 248, 0.16);
  box-shadow: inset 0 0 0 1px rgba(56, 189, 248, 0.28);
}

.nav-icon {
  font-size: 0.78rem;
  opacity: 0.85;
}

.nav-item-active .nav-icon {
  opacity: 1;
}

.nav-text {
  line-height: 1.2;
}

@media (max-width: 1024px) {
  .nav-item {
    padding: 0.375rem 0.725rem;
    font-size: 0.8rem;
  }
}

@media (max-width: 767px) {
  .navigation-bar {
    justify-content: flex-start;
  }

  .nav-track {
    width: 100%;
    justify-content: flex-start;
    background: transparent;
    border: none;
    padding: 0.125rem 0;
    gap: 0.375rem;
    border-radius: 0;
  }

  .nav-item {
    padding: 0.375rem 0.75rem;
    font-size: 0.8125rem;
    background: var(--surface-muted);
    border: 1px solid transparent;
  }

  .nav-item-active {
    background: var(--accent-soft);
    border-color: rgba(14, 165, 233, 0.25);
    box-shadow: none;
  }

  .dark .nav-item-active {
    background: rgba(56, 189, 248, 0.18);
    border-color: rgba(56, 189, 248, 0.32);
    box-shadow: none;
  }
}
</style>
