<template>
  <div class="character-selector">
    <h3 class="selector-title">{{ $t('gallery.characters') }}</h3>
    <div class="characters-list">
      <button v-for="character in characters" :key="character.id" @click="selectCharacter(character.id)"
        class="character-button" :class="{ 'active': selectedCharacterId === character.id }" :style="{
          '--character-color': character.color || '#667eea',
          '--character-hover-color': character.color ? `${character.color}80` : '#667eea80'
        }">
        {{ character.name[currentLanguage] || character.name.en || character.id }}
        <span v-if="isSearching" class="character-count">{{ appStore.getCharacterMatchCount(character.id) }}</span>
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

// 判断是否在搜索
const isSearching = computed(() => appStore.isSearching);

// 全部角色选项
const allOption = {
  id: 'all',
  name: { en: 'All', zh: '全部', jp: 'すべて' },
  color: '#667eea',
};

// 所有可选角色
const allCharacters = computed(() => {
  // 如果在搜索，则添加"全部"选项
  if (isSearching.value) {
    return [allOption, ...siteConfig.characters];
  }
  return siteConfig.characters;
});

// 根据搜索过滤要显示的角色
const characters = computed(() => {
  if (!isSearching.value) return allCharacters.value;

  // 如果正在搜索，只显示有匹配图像的角色
  return allCharacters.value.filter(char => {
    if (char.id === 'all') return true; // "全部"始终显示

    // 检查该角色是否有匹配的图像
    const count = appStore.getCharacterMatchCount(char.id);
    return count > 0;
  });
});

const selectedCharacterId = computed({
  get: () => appStore.selectedCharacterId,
  set: (value) => appStore.selectedCharacterId = value,
});
const currentLanguage = computed(() => appStore.currentLanguage);

// 删除未使用的getCharacterCount函数

const selectCharacter = (id: string): void => {
  selectedCharacterId.value = id;
};

// 不再需要监听搜索状态变化，由app store统一管理
</script>

<style scoped>
.character-selector {
  margin-bottom: 1.5rem;
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

.characters-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.character-button {
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  background-color: #f3f4f6;
  color: #4b5563;
  border: 1px solid transparent;
  transition: all 200ms;
  font-size: 0.875rem;
  font-weight: 500;
}

.dark .character-button {
  background-color: #1f2937;
  color: #d1d5db;
}

.character-button:hover {
  background-color: #e5e7eb;
}

.dark .character-button:hover {
  background-color: #374151;
}

.character-button.active {
  border-color: transparent;
  background-color: var(--character-color);
  color: white;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
}

.character-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-left: 0.25rem;
  padding: 0 0.375rem;
  min-width: 1.25rem;
  height: 1.25rem;
  border-radius: 9999px;
  background-color: rgba(255, 255, 255, 0.2);
  color: inherit;
  font-size: 0.75rem;
  font-weight: 600;
}
</style>
