import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

import type { Language, CharacterImage, ChildImage, I18nText } from '@/types';

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
  const sortBy = ref<'name' | 'artist' | 'date'>('date');
  const sortOrder = ref<'asc' | 'desc'>('desc');

  // 当前选择的角色
  const selectedCharacter = computed(() => {
    return siteConfig.characters.find(character => character.id === selectedCharacterId.value);
  });

  // 当前角色的图像列表（支持图像组）
  const characterImages = computed(() => {
    const resultImages: CharacterImage[] = [];

    for (const parentImage of siteConfig.images) {
      // 检查父图像和子图像中是否有任何一个通过过滤
      const validImages = getValidImagesInGroup(parentImage);
      
      if (validImages.length > 0) {
        // 获取要显示的图像（优先父图像，否则第一个有效子图像）
        const displayImage = getDisplayImageForGroup(parentImage);
        
        // 标记是否为图像组（有子图像且有多个有效图像）
        const isGroup = parentImage.childImages && validImages.length > 1;
        
        // 创建显示用的图像对象，保留组信息
        const imageForDisplay = {
          ...displayImage,
          // 如果是组图的显示图像，保留原始的childImages信息
          childImages: isGroup ? parentImage.childImages : displayImage.childImages,
        };
        
        resultImages.push(imageForDisplay);
      }
    }

    // 排序
    const sortedImages = sortImages(resultImages);

    return sortedImages;
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
          const aArtist = a.artist ? getSearchableText(a.artist) : 'n/a';
          const bArtist = b.artist ? getSearchableText(b.artist) : 'n/a';
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

  // 标签计数（支持图像组）
  const tagCounts = computed(() => {
    const counts: Record<string, number> = { all: 0 };

    // 计算有效的图像组数量
    const validImageGroups: CharacterImage[] = [];
    for (const parentImage of siteConfig.images) {
      const validImages = getValidImagesInGroup(parentImage);
      if (validImages.length > 0) {
        const displayImage = getDisplayImageForGroup(parentImage);
        validImageGroups.push(displayImage);
      }
    }

    // 计算每个标签的数量
    siteConfig.tags.forEach(tag => {
      const count = validImageGroups.filter(image => image.tags.includes(tag.id)).length;
      counts[tag.id] = count;
    });

    // "all"选项的计数是所有匹配的图像总数
    counts.all = validImageGroups.length;

    return counts;
  });

  // 获取每个角色的匹配图像数量（支持图像组）
  const getCharacterMatchCount = (characterId: string): number => {
    // 计算有效的图像组数量
    let validGroupCount = 0;
    
    for (const parentImage of siteConfig.images) {
      const validImages = getValidImagesInGroup(parentImage);
      if (validImages.length > 0) {
        const displayImage = getDisplayImageForGroup(parentImage);
        
        // 如果是"全部"选项，或者显示图像包含该角色
        if (characterId === 'all' || displayImage.characters.includes(characterId)) {
          validGroupCount++;
        }
      }
    }

    return validGroupCount;
  };

  // 获取单个图像（支持子图像ID）
  const getImageById = (id: string): CharacterImage | undefined => {
    // 首先查找父图像
    const parentImage = siteConfig.images.find(img => img.id === id);
    if (parentImage) {
      return parentImage;
    }

    // 如果没找到，查找子图像
    const groupInfo = getImageGroupByChildId(id);
    if (groupInfo) {
      return getChildImageWithDefaults(groupInfo.parentImage, groupInfo.childImage);
    }

    return undefined;
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

  // 图像组相关辅助函数
  
  // 根据child image ID获取父图像和子图像
  const getImageGroupByChildId = (childId: string): { parentImage: CharacterImage; childImage: ChildImage } | null => {
    for (const image of siteConfig.images) {
      if (image.childImages) {
        const childImage = image.childImages.find(child => child.id === childId);
        if (childImage) {
          return { parentImage: image, childImage };
        }
      }
    }
    return null;
  };

  // 获取子图像的完整信息（继承父图像属性）
  const getChildImageWithDefaults = (parentImage: CharacterImage, childImage: ChildImage): CharacterImage => {
    // Artist fallback logic: child.artist || parent.artist || "N/A"
    const getArtistWithFallback = (): I18nText => {
      if (childImage.artist) return childImage.artist;
      if (parentImage.artist) return parentImage.artist;
      return { en: 'N/A', zh: 'N/A', jp: 'N/A' };
    };

    // Description fallback logic: child.description || parent.description || empty string
    const getDescriptionWithFallback = (): I18nText => {
      if (childImage.description) return childImage.description;
      if (parentImage.description) return parentImage.description;
      return { en: '', zh: '', jp: '' };
    };

    return {
      id: childImage.id,
      name: childImage.name || parentImage.name,
      description: getDescriptionWithFallback(),
      artist: getArtistWithFallback(),
      src: childImage.src,
      tags: childImage.tags || parentImage.tags,
      characters: childImage.characters || parentImage.characters,
      date: childImage.date || parentImage.date,
      // 子图像不会有自己的子图像
      childImages: undefined,
    };
  };

  // 检查图像是否通过过滤器
  const doesImagePassFilter = (image: CharacterImage): boolean => {
    // 应用限制级标签过滤
    const restrictedTags = siteConfig.tags.filter(tag => tag.isRestricted);

    for (const restrictedTag of restrictedTags) {
      const imageHasTag = image.tags.includes(restrictedTag.id);
      const tagIsEnabled = selectedRestrictedTags.value[restrictedTag.id] || false;

      // 如果图片有这个特殊标签，但是这个标签没有被启用，则过滤掉
      if (imageHasTag && !tagIsEnabled) {
        return false;
      }
    }

    // 应用搜索过滤
    if (searchQuery.value.trim()) {
      const query = searchQuery.value.trim().toLowerCase();
      
      // 搜索图片名称
      const name = getSearchableText(image.name);
      
      // 搜索描述
      const description = getSearchableText(image.description);
      
      // 搜索艺术家名称
      const artist = getSearchableText(image.artist);
      
      // 搜索标签
      const tagsMatch = image.tags?.some(tagId => {
        const tag = siteConfig.tags.find(t => t.id === tagId);
        if (!tag) return false;
        
        const tagName = getSearchableText(tag.name);
        return tagName.includes(query);
      }) || false;
      
      const matchesSearch = name.includes(query) 
                         || description.includes(query) 
                         || artist.includes(query) 
                         || tagsMatch;
      
      if (!matchesSearch) {
        return false;
      }
    }

    // 应用角色过滤
    if (selectedCharacterId.value !== 'all') {
      if (!image.characters.includes(selectedCharacterId.value)) {
        return false;
      }
    }

    // 应用标签过滤
    if (selectedTag.value !== 'all') {
      if (!image.tags.includes(selectedTag.value)) {
        return false;
      }
    }

    return true;
  };

  // 获取图像组的显示图像（用于画廊显示）
  const getDisplayImageForGroup = (parentImage: CharacterImage): CharacterImage => {
    // 如果父图像有src且通过过滤，优先显示父图像
    if (parentImage.src && doesImagePassFilter(parentImage)) {
      return parentImage;
    }

    // 如果父图像没有src或被过滤，查找第一个通过过滤的子图像
    if (parentImage.childImages) {
      for (const childImage of parentImage.childImages) {
        const fullChildImage = getChildImageWithDefaults(parentImage, childImage);
        if (doesImagePassFilter(fullChildImage)) {
          return fullChildImage;
        }
      }
    }

    // 如果都没通过过滤，返回父图像（用于标识这是个组图）
    return parentImage;
  };

  // 获取图像组的所有有效图像（通过过滤的）
  const getValidImagesInGroup = (parentImage: CharacterImage): CharacterImage[] => {
    const validImages: CharacterImage[] = [];

    // 检查父图像（只有当它有src时才可能被包含）
    if (parentImage.src && doesImagePassFilter(parentImage)) {
      validImages.push(parentImage);
    }

    // 检查子图像
    if (parentImage.childImages) {
      for (const childImage of parentImage.childImages) {
        const fullChildImage = getChildImageWithDefaults(parentImage, childImage);
        if (doesImagePassFilter(fullChildImage)) {
          validImages.push(fullChildImage);
        }
      }
    }

    return validImages;
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

    // 图像组相关
    getImageGroupByChildId,
    getChildImageWithDefaults,
    getDisplayImageForGroup,
    getValidImagesInGroup,
  };
});
