<template>
  <div class="tag-selector">
    <h3 class="selector-title">{{ $t('gallery.tags') }}</h3>
    <div class="tags-list">
      <button class="tag-button" :class="{ 'active': selectedTag === 'all' }" @click="selectTag('all')">
        <i class="fa fa-th-large tag-icon"></i>
        <span class="tag-name">{{ $t('common.all') }}</span>
        <span class="tag-count">{{ tagCounts.all }}</span>
      </button>

      <button v-for="tag in sortedTags" :key="tag.id" class="tag-button"
        :class="{ 'active': selectedTag === tag.id }" @click="selectTag(tag.id)" :style="{
          '--tag-color': tag.color || '#8b5cf6',
          '--tag-hover-color': tag.color ? `${tag.color}20` : '#8b5cf620'
        }">
        <i v-if="tag.icon" :class="`fa fa-${tag.icon}`" class="tag-icon"></i>
        <span class="tag-name">{{ tag.name[currentLanguage] || tag.name.en || tag.id }}</span>
        <span class="tag-count">{{ tagCounts[tag.id] || 0 }}</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

import { siteConfig } from '@/config/site';
import { useAppStore } from '@/stores/app';

const { t: $t } = useI18n();
const appStore = useAppStore();

// 按名称排序的标签列表
const sortedTags = computed(() => {
  let tags = [...siteConfig.tags];

  // 过滤掉数量为0的标签
  tags = tags.filter(tag => {
    const tagCount = appStore.tagCounts[tag.id];
    return tagCount > 0;
  });

  // 按当前语言的名称排序
  tags.sort((a, b) => {
    const aName = a.name[appStore.currentLanguage] || a.name.en || a.id;
    const bName = b.name[appStore.currentLanguage] || b.name.en || b.id;
    return aName.localeCompare(bName);
  });

  return tags;
});

const selectedTag = computed({
  get: () => appStore.selectedTag,
  set: (value) => appStore.selectedTag = value,
});

const currentLanguage = computed(() => appStore.currentLanguage);
const tagCounts = computed(() => appStore.tagCounts);

const selectTag = (id: string): void => {
  selectedTag.value = id;
};
</script>

<style scoped>
.tag-selector {
  margin-bottom: 2rem;
}

.selector-title {
  font-size: 1.125rem;
  font-weight: 600;
  margin-bottom: 0.75rem;
  color: #1f2937;
}

.dark .selector-title {
  color: #e5e7eb;
}

.tags-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.tag-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  background-color: #f3f4f6;
  color: #4b5563;
  border: 1px solid transparent;
  transition: all 200ms;
  font-size: 0.875rem;
  font-weight: 500;
}

.dark .tag-button {
  background-color: #1f2937;
  color: #d1d5db;
}

.tag-button:hover {
  background-color: #e5e7eb;
}

.dark .tag-button:hover {
  background-color: #374151;
}

.tag-button.active {
  background-color: var(--tag-color, #8b5cf6);
  color: white;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
}

.tag-icon {
  width: 1rem;
  height: 1rem;
}

.tag-name {
  margin-right: 0.25rem;
}

.tag-count {
  font-size: 0.75rem;
  padding: 0 0.375rem;
  border-radius: 9999px;
  background-color: #e5e7eb;
  color: #4b5563;
}

.dark .tag-count {
  background-color: #4b5563;
  color: #e5e7eb;
}

.tag-button.active .tag-count {
  background-color: rgba(255, 255, 255, 0.3);
  color: white;
}
</style>
