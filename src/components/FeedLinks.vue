<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

import { useLanguageStore } from '@/stores/language';

const { t } = useI18n();
const languageStore = useLanguageStore();

const feeds = computed(() => {
  const currentLang = languageStore.currentLanguage;
  const langSuffix = currentLang === 'en' ? '' : `.${currentLang}`;

  return [
    {
      name: 'RSS',
      url: `/feeds/rss${langSuffix}.xml`,
      description: 'RSS 2.0 Feed',
    },
    {
      name: 'Atom',
      url: `/feeds/atom${langSuffix}.xml`,
      description: 'Atom 1.0 Feed',
    },
    {
      name: 'JSON',
      url: `/feeds/feed${langSuffix}.json`,
      description: 'JSON Feed',
    },
  ];
});
</script>

<template>
  <section class="feed-links">
    <h3 class="feed-title">
      <i class="fas fa-rss feed-title-icon" aria-hidden="true"></i>
      <span>{{ t('common.feeds', 'Feeds') }}</span>
    </h3>
    <div class="feed-items">
      <a
        v-for="feed in feeds"
        :key="feed.name"
        :href="feed.url"
        :title="feed.description"
        class="feed-item"
        target="_blank"
        rel="noopener noreferrer"
      >
        {{ feed.name }}
      </a>
    </div>
  </section>
</template>

<style scoped>
@reference "@/assets/styles/main.css";

.feed-links {
  background: var(--surface-card);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-sm);
  padding: 0.9rem 1rem;
}

.feed-title {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  margin: 0 0 0.7rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-primary);
}

.feed-title-icon {
  color: var(--accent-primary);
  font-size: 0.8125rem;
}

.feed-items {
  display: flex;
  gap: 0.45rem;
  flex-wrap: wrap;
}

.feed-item {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.375rem 0.8rem;
  border-radius: var(--radius-control);
  background: var(--surface-muted);
  border: 1px solid var(--border-subtle);
  color: var(--accent-primary-hover);
  text-decoration: none;
  font-size: 0.78rem;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  flex: 1 1 auto;
  min-width: 58px;
  transition:
    background-color 0.16s ease,
    border-color 0.16s ease,
    color 0.16s ease,
    transform 0.16s var(--ease-out-expo),
    box-shadow 0.16s ease;
}

.dark .feed-item {
  color: var(--accent-primary);
}

.feed-item:hover {
  background: var(--accent-primary);
  border-color: var(--accent-primary);
  color: #ffffff;
  transform: translateY(-1px);
  box-shadow: var(--shadow-accent);
}

.feed-item:active {
  transform: translateY(0);
}

.feed-item:focus-visible {
  outline: 2px solid var(--accent-primary);
  outline-offset: 2px;
}
</style>
