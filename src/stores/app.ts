import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

import type { Language, CharacterImage } from '@/types';

import { siteConfig } from '@/config/site';

export const useAppStore = defineStore('app', () => {
  // 加载状态
  const isLoading = ref(true);
  const loadingProgress = ref(0);
  const loadingMessage = ref('');
  const loadingTip = ref('');

  // 搜索状态
  const searchQuery = ref('');

  // 是否处于搜索状态
  const isSearching = computed(() => !!searchQuery.value.trim());

  // 存储搜索前的状态，以便清除搜索时恢复
  const previousCharacterId = ref('');
  const previousTagId = ref('');

  // 主题相关
  const isDarkMode = ref(localStorage.getItem('theme') === 'dark'
    || (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches));

  // 设置暗色模式
  const toggleDarkMode = (): void => {
    isDarkMode.value = !isDarkMode.value;
    localStorage.setItem('theme', isDarkMode.value ? 'dark' : 'light');

    if (isDarkMode.value) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  // 语言相关
  const currentLanguage = ref<Language>(localStorage.getItem('locale') as Language || 'zh');

  // 设置语言
  const setLanguage = (lang: Language): void => {
    currentLanguage.value = lang;
    localStorage.setItem('locale', lang);
  };

  // 当前选择的角色
  const selectedCharacterId = ref(siteConfig.characters[0]?.id || '');

  // 当前选择的标签
  const selectedTag = ref('all');

  // 特殊标签的选择状态（默认都不选中）
  const selectedRestrictedTags = ref<Record<string, boolean>>({});

  // 排序设置
  const sortBy = ref<'name' | 'artist' | 'date'>('name');
  const sortOrder = ref<'asc' | 'desc'>('asc');

  // 当前选择的角色
  const selectedCharacter = computed(() => {
    return siteConfig.characters.find(character => character.id === selectedCharacterId.value);
  });

  // 当前角色的图像列表
  const characterImages = computed(() => {
    let { images } = siteConfig;

    // 如果有搜索，则先按搜索过滤
    if (searchQuery.value.trim()) {
      images = filterImagesBySearch(images, searchQuery.value.trim());
    }

    // 如果不是查看全部角色，则按角色过滤
    if (selectedCharacterId.value !== 'all') {
      images = images.filter(image => image.characters.includes(selectedCharacterId.value));
    }

    // 按标签过滤
    if (selectedTag.value !== 'all') {
      images = images.filter(image => image.tags.includes(selectedTag.value));
    }

    // 特殊标签过滤：如果图片有任一特殊tag不满足启用状态，便不会加入结果中
    images = images.filter(image => {
      const restrictedTags = siteConfig.tags.filter(tag => tag.isRestricted);

      for (const restrictedTag of restrictedTags) {
        const imageHasTag = image.tags.includes(restrictedTag.id);
        const tagIsEnabled = selectedRestrictedTags.value[restrictedTag.id] || false;

        // 如果图片有这个特殊标签，但是这个标签没有被启用，则过滤掉
        if (imageHasTag && !tagIsEnabled) {
          return false;
        }
      }

      return true;
    });

    // 排序
    images = sortImages(images);

    return images;
  });

  // 图像排序函数
  const sortImages = (images: CharacterImage[]): CharacterImage[] => {
    return [...images].sort((a, b) => {
      let comparison = 0;

      switch (sortBy.value) {
        case 'name': {
          const aName = getSearchableText(a.name);
          const bName = getSearchableText(b.name);
          comparison = aName.localeCompare(bName);
          break;
        }
        case 'artist': {
          const aArtist = getSearchableText(a.artist);
          const bArtist = getSearchableText(b.artist);
          comparison = aArtist.localeCompare(bArtist);
          break;
        }
        case 'date': {
          // 将无日期的项目视为最早的作品
          const aDate = a.date || '0000-00-00';
          const bDate = b.date || '0000-00-00';
          comparison = aDate.localeCompare(bDate);
          break;
        }
      }

      return sortOrder.value === 'asc' ? comparison : -comparison;
    });
  };

  // 按搜索条件过滤图片
  const filterImagesBySearch = (images: CharacterImage[], query: string): CharacterImage[] => {
    const lowerQuery = query.toLowerCase();
    return images.filter(image => {
      // 搜索图片名称
      const name = getSearchableText(image.name);

      // 搜索描述
      const description = image.description ? getSearchableText(image.description) : '';

      // 搜索标签
      const tagsMatch = image.tags?.some(tagId => {
        const tag = siteConfig.tags.find(t => t.id === tagId);
        if (!tag) return false;

        const tagName = getSearchableText(tag.name);
        return tagName.includes(lowerQuery);
      }) || false;

      // 搜索艺术家名称
      const artist = getSearchableText(image.artist);

      return name.includes(lowerQuery)
             || description.includes(lowerQuery)
             || artist.includes(lowerQuery)
             || tagsMatch;
    });
  };

  // 从I18nText或字符串中提取可搜索文本
  const getSearchableText = (text: any): string => {
    if (typeof text === 'string') {
      return text.toLowerCase();
    }

    // 确保是对象
    if (!text || typeof text !== 'object') return '';

    // 将所有语言版本组合成一个字符串
    return Object.values(text)
      .filter(value => typeof value === 'string')
      .join(' ')
      .toLowerCase();
  };

  // 标签计数
  const tagCounts = computed(() => {
    const counts: Record<string, number> = { all: 0 };

    let imagesToCount = siteConfig.images;

    // 如果有搜索查询，先按搜索过滤
    if (searchQuery.value.trim()) {
      imagesToCount = filterImagesBySearch(imagesToCount, searchQuery.value.trim());
    }

    // 无论是否在搜索，始终按当前选择的角色进行过滤
    // 如果选择了特定角色并且不是"all"
    if (selectedCharacterId.value !== 'all') {
      imagesToCount = imagesToCount.filter(image => image.characters.includes(selectedCharacterId.value));
    }

    // 应用特殊标签过滤
    imagesToCount = imagesToCount.filter(image => {
      const restrictedTags = siteConfig.tags.filter(tag => tag.isRestricted);

      for (const restrictedTag of restrictedTags) {
        const imageHasTag = image.tags.includes(restrictedTag.id);
        const tagIsEnabled = selectedRestrictedTags.value[restrictedTag.id] || false;

        // 如果图片有这个特殊标签，但是这个标签没有被启用，则过滤掉
        if (imageHasTag && !tagIsEnabled) {
          return false;
        }
      }

      return true;
    });

    // 计算每个标签的数量
    siteConfig.tags.forEach(tag => {
      const count = imagesToCount.filter(image => image.tags.includes(tag.id)).length;

      counts[tag.id] = count;
    });

    // "all"选项的计数是所有匹配的图像总数
    counts.all = imagesToCount.length;

    return counts;
  });

  // 获取每个角色的匹配图像数量
  const getCharacterMatchCount = (characterId: string): number => {
    let imagesToCount = siteConfig.images;

    // 如果有搜索查询，先按搜索过滤
    if (searchQuery.value.trim()) {
      imagesToCount = filterImagesBySearch(imagesToCount, searchQuery.value.trim());
    }

    // 应用限制级标签过滤
    imagesToCount = imagesToCount.filter(image => {
      const restrictedTags = siteConfig.tags.filter(tag => tag.isRestricted);

      for (const restrictedTag of restrictedTags) {
        const imageHasTag = image.tags.includes(restrictedTag.id);
        const tagIsEnabled = selectedRestrictedTags.value[restrictedTag.id] || false;

        // 如果图片有这个特殊标签，但是这个标签没有被启用，则过滤掉
        if (imageHasTag && !tagIsEnabled) {
          return false;
        }
      }

      return true;
    });

    // 如果是"全部"选项，返回所有匹配图像的总数
    if (characterId === 'all') return imagesToCount.length;

    // 计算该角色的匹配数量
    return imagesToCount.filter(img => img.characters.includes(characterId)).length;
  };

  // 获取单个图像
  const getImageById = (id: string): CharacterImage | undefined => {
    return siteConfig.images.find(img => img.id === id);
  };

  // 在当前筛选条件下获取图像的索引
  const getImageIndexById = (id: string): number => {
    return characterImages.value.findIndex(img => img.id === id);
  };

  // 根据索引获取图像
  const getImageByIndex = (index: number): CharacterImage | undefined => {
    if (index < 0 || index >= characterImages.value.length) return undefined;
    return characterImages.value[index];
  };

  // 查看器状态
  const isFullscreenViewer = ref(false);
  const currentViewingImage = ref<CharacterImage | null>(null);

  // 跟踪用户是否从画廊进入查看器（用于区分直接访问）
  const isFromGallery = ref(false);

  // 设置搜索查询
  const setSearchQuery = (query: string): void => {
    // 先设置查询
    searchQuery.value = query;

    // 如果开始搜索（之前无搜索，现在有搜索），保存当前选择
    if (query.trim()) {
      // 如果没有保存之前的选择，则保存
      if (!previousCharacterId.value) {
        previousCharacterId.value = selectedCharacterId.value;
        previousTagId.value = selectedTag.value;

        // 切换到"全部"角色和标签
        selectedCharacterId.value = 'all';
        selectedTag.value = 'all';
      }
    } else {
      // 如果清空了搜索，恢复之前的选择
      if (previousCharacterId.value) {
        selectedCharacterId.value = previousCharacterId.value;
        previousCharacterId.value = '';
      }

      if (previousTagId.value) {
        selectedTag.value = previousTagId.value;
        previousTagId.value = '';
      }
    }
  };

  // 清除搜索
  const clearSearch = (): void => {
    // 设置空字符串会触发setSearchQuery中的恢复逻辑
    setSearchQuery('');
  };

  // 设置从画廊进入查看器的标记
  const setFromGallery = (value: boolean): void => {
    isFromGallery.value = value;
  };

  // 递归获取所有依赖某个标签的子标签
  const getAllDependentTags = (tagId: string, visited = new Set<string>()): string[] => {
    if (visited.has(tagId)) {
      return []; // 防止循环依赖
    }

    visited.add(tagId);
    const dependentTags: string[] = [];

    // 找到所有直接依赖当前标签的子标签
    const directDependents = siteConfig.tags.filter(tag => tag.isRestricted
      && tag.prerequisiteTags
      && tag.prerequisiteTags.includes(tagId));

    directDependents.forEach(dependentTag => {
      dependentTags.push(dependentTag.id);
      // 递归获取子标签的依赖标签
      const subDependents = getAllDependentTags(dependentTag.id, new Set(visited));
      dependentTags.push(...subDependents);
    });

    return dependentTags;
  };

  // 设置特殊标签的选择状态
  const setRestrictedTagState = (tagId: string, enabled: boolean): void => {
    selectedRestrictedTags.value[tagId] = enabled;

    // 如果取消选择一个标签，需要递归取消选择所有依赖它的子标签
    if (!enabled) {
      const allDependentTags = getAllDependentTags(tagId);

      allDependentTags.forEach(dependentTagId => {
        if (selectedRestrictedTags.value[dependentTagId]) {
          selectedRestrictedTags.value[dependentTagId] = false;
        }
      });
    }
  };

  // 获取特殊标签的选择状态
  const getRestrictedTagState = (tagId: string): boolean => {
    return selectedRestrictedTags.value[tagId] || false;
  };

  return {
    // 加载状态
    isLoading,
    loadingProgress,
    loadingMessage,
    loadingTip,

    // 主题相关
    isDarkMode,
    toggleDarkMode,

    // 语言相关
    currentLanguage,
    setLanguage,

    // 搜索相关
    searchQuery,
    isSearching,
    setSearchQuery,
    clearSearch,

    // 画廊相关
    selectedCharacterId,
    selectedTag,
    selectedCharacter,
    characterImages,
    tagCounts,
    getCharacterMatchCount,

    // 特殊标签相关
    selectedRestrictedTags,
    setRestrictedTagState,
    getRestrictedTagState,

    // 排序相关
    sortBy,
    sortOrder,

    // 图像查询
    getImageById,
    getImageIndexById,
    getImageByIndex,

    // 查看器状态
    isFullscreenViewer,
    currentViewingImage,
    isFromGallery,
    setFromGallery,
  };
});
