<template>
  <div class="type-selector">
    <h3 class="selector-title">{{ $t('gallery.types') }}</h3>
    <div class="types-list">
      <button class="type-button" :class="{ 'active': selectedType === 'all' }" @click="selectType('all')">
        <i class="fa fa-th-large type-icon"></i>
        <span class="type-name">{{ $t('common.all') }}</span>
        <span class="type-count">{{ imageTypeCounts.all }}</span>
      </button>

      <button v-for="type in imageTypes" :key="type.id" class="type-button"
        :class="{ 'active': selectedType === type.id }" @click="selectType(type.id)" :style="{
          '--type-color': type.color || '#8b5cf6',
          '--type-hover-color': type.color ? `${type.color}20` : '#8b5cf620'
        }">
        <i :class="`fa fa-${type.icon || 'image'}`" class="type-icon"></i>
        <span class="type-name">{{ type.name[currentLanguage] || type.name.en || type.id }}</span>
        <span class="type-count">{{ imageTypeCounts[type.id] || 0 }}</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { siteConfig } from '@/config/site'
import { useAppStore } from '@/stores/app'

const { t: $t } = useI18n()
const appStore = useAppStore()

// 判断是否在搜索
const isSearching = computed(() => appStore.isSearching)

// 当前角色类型列表
const imageTypes = computed(() => {
  if (!isSearching.value) return siteConfig.imageTypes;
  
  // 如果正在搜索，只显示有匹配结果的类型
  return siteConfig.imageTypes.filter(type => {
    const typeCount = appStore.imageTypeCounts[type.id];
    return typeCount > 0;
  });
});

const selectedType = computed({
  get: () => appStore.selectedImageType,
  set: (value) => appStore.selectedImageType = value
})
const currentLanguage = computed(() => appStore.currentLanguage)
const imageTypeCounts = computed(() => appStore.imageTypeCounts)

const selectType = (id: string) => {
  selectedType.value = id
}

// 不再需要监听搜索状态变化，由app store统一管理
</script>

<style scoped>
.type-selector {
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

.types-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.type-button {
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

.dark .type-button {
  background-color: #1f2937;
  color: #d1d5db;
}

.type-button:hover {
  background-color: #e5e7eb;
}

.dark .type-button:hover {
  background-color: #374151;
}

.type-button.active {
  background-color: var(--type-color, #8b5cf6);
  color: white;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
}

.type-icon {
  width: 1rem;
  height: 1rem;
}

.type-name {
  margin-right: 0.25rem;
}

.type-count {
  font-size: 0.75rem;
  padding: 0 0.375rem;
  border-radius: 9999px;
  background-color: #e5e7eb;
  color: #4b5563;
}

.dark .type-count {
  background-color: #4b5563;
  color: #e5e7eb;
}

.type-button.active .type-count {
  background-color: rgba(255, 255, 255, 0.3);
  color: white;
}
</style>
