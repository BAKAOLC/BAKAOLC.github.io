import { defineStore } from 'pinia';
import { computed, ref } from 'vue';

import { siteConfig } from '@/config/site';
import type { CharacterImage, ImageBase } from '@/types';

export const useGalleryStore = defineStore('gallery', () => {
  // ����״̬
  const searchQuery = ref('');

  // �Ƿ�������״̬
  const isSearching = computed(() => !!searchQuery.value.trim());

  // �洢����ǰ��״̬���Ա��������ʱ�ָ�
  const previousCharacterId = ref('');
  const previousTagId = ref('');

  // ��ǰѡ��Ľ�ɫ
  const selectedCharacterId = ref(siteConfig.characters[0]?.id ?? '');

  // ��ǰѡ��ı�ǩ
  const selectedTag = ref('all');

  // �����ǩ��ѡ��״̬��Ĭ�϶���ѡ�У�
  const selectedRestrictedTags = ref<Record<string, boolean>>({});

  // ��������
  const sortBy = ref<'name' | 'artist' | 'date'>('date');
  const sortOrder = ref<'asc' | 'desc'>('desc');

  // ��ǰѡ��Ľ�ɫ
  const selectedCharacter = computed(() => {
    return siteConfig.characters.find(character => character.id === selectedCharacterId.value);
  });

  // ��ǰ��ɫ��ͼ���б�֧��ͼ���飩
  const characterImages = computed(() => {
    const resultImages: CharacterImage[] = [];

    for (const parentImage of siteConfig.images) {
      // ��鸸ͼ�����ͼ�����Ƿ����κ�һ��ͨ������
      const validImages = getValidImagesInGroup(parentImage);

      if (validImages.length > 0) {
        // ��ȡҪ��ʾ��ͼ�����ȸ�ͼ�񣬷����һ����Ч��ͼ��
        const displayImage = getDisplayImageForGroup(parentImage);

        // ����Ƿ�Ϊͼ���飨����ͼ�����ж����Чͼ��
        const isGroup = parentImage.childImages && validImages.length > 1;

        // ������ʾ�õ�ͼ����󣬱�������Ϣ
        const imageForDisplay = {
          ...displayImage,
          // �������ͼ����ʾͼ�񣬱���ԭʼ��childImages��Ϣ
          childImages: isGroup ? parentImage.childImages : displayImage.childImages,
        };

        resultImages.push(imageForDisplay);
      }
    }

    // ����
    const sortedImages = sortImages(resultImages);

    return sortedImages;
  });

  // ͼ��������
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
          // �������ڵ���Ŀ��Ϊ�������Ʒ
          const aDate = a.date ?? '0000-00-00';
          const bDate = b.date ?? '0000-00-00';
          comparison = aDate.localeCompare(bDate);
          break;
        }
      }

      return sortOrder.value === 'asc' ? comparison : -comparison;
    });
  };

  // ��I18nText���ַ�������ȡ�������ı�
  const getSearchableText = (text: any): string => {
    if (typeof text === 'string') {
      return text.toLowerCase();
    }

    // ȷ���Ƕ���
    if (!text || typeof text !== 'object') return '';

    // ���������԰汾��ϳ�һ���ַ���
    return Object.values(text)
      .filter(value => typeof value === 'string')
      .join(' ')
      .toLowerCase();
  };

  // ��ǩ������֧��ͼ���飩
  const tagCounts = computed(() => {
    const counts: Record<string, number> = { all: 0 };

    // ������Ч��ͼ��������
    const validImageGroups: CharacterImage[] = [];
    for (const parentImage of siteConfig.images) {
      const validImages = getValidImagesInGroup(parentImage);
      if (validImages.length > 0) {
        const displayImage = getDisplayImageForGroup(parentImage);
        validImageGroups.push(displayImage);
      }
    }

    // ����ÿ����ǩ������
    siteConfig.tags.forEach(tag => {
      const count = validImageGroups.filter(image => image.tags?.includes(tag.id)).length;
      counts[tag.id] = count;
    });

    // "all"ѡ��ļ���������ƥ���ͼ������
    counts.all = validImageGroups.length;

    return counts;
  });

  // ��ȡÿ����ɫ��ƥ��ͼ��������֧��ͼ���飩
  const getCharacterMatchCount = (characterId: string): number => {
    // ������Ч��ͼ��������
    let validGroupCount = 0;

    for (const parentImage of siteConfig.images) {
      const validImages = getValidImagesInGroup(parentImage);
      if (validImages.length > 0) {
        const displayImage = getDisplayImageForGroup(parentImage);

        // �����"ȫ��"ѡ�������ʾͼ������ý�ɫ
        if (characterId === 'all' || displayImage.characters?.includes(characterId)) {
          validGroupCount++;
        }
      }
    }

    return validGroupCount;
  };

  // ��ȡ����ͼ��֧����ͼ��ID��
  const getImageById = (id: string): CharacterImage | undefined => {
    // ���Ȳ��Ҹ�ͼ��
    const parentImage = siteConfig.images.find(img => img.id === id);
    if (parentImage) {
      return parentImage;
    }

    // ���û�ҵ���������ͼ��
    const groupInfo = getImageGroupByChildId(id);
    if (groupInfo) {
      return getChildImageWithDefaults(groupInfo.parentImage, groupInfo.childImage) as CharacterImage;
    }

    return undefined;
  };

  // �ڵ�ǰɸѡ�����»�ȡͼ�������
  const getImageIndexById = (id: string): number => {
    return characterImages.value.findIndex(img => img.id === id);
  };

  // ����������ȡͼ��
  const getImageByIndex = (index: number): CharacterImage | undefined => {
    if (index < 0 || index >= characterImages.value.length) return undefined;
    return characterImages.value[index];
  };

  // �ݹ��ȡ��������ĳ����ǩ���ӱ�ǩ
  const getAllDependentTags = (tagId: string, visited = new Set<string>()): string[] => {
    if (visited.has(tagId)) {
      return []; // ��ֹѭ������
    }

    visited.add(tagId);
    const dependentTags: string[] = [];

    // �ҵ�����ֱ��������ǰ��ǩ���ӱ�ǩ
    const directDependents = siteConfig.tags.filter(tag => tag.isRestricted
      && tag.prerequisiteTags?.includes(tagId));

    directDependents.forEach(dependentTag => {
      dependentTags.push(dependentTag.id);
      // �ݹ��ȡ�ӱ�ǩ��������ǩ
      const subDependents = getAllDependentTags(dependentTag.id, new Set(visited));
      dependentTags.push(...subDependents);
    });

    return dependentTags;
  };

  // ���������ǩ��ѡ��״̬
  const setRestrictedTagState = (tagId: string, enabled: boolean): void => {
    selectedRestrictedTags.value[tagId] = enabled;

    // ���ȡ��ѡ��һ����ǩ����Ҫ�ݹ�ȡ��ѡ���������������ӱ�ǩ
    if (!enabled) {
      const allDependentTags = getAllDependentTags(tagId);

      allDependentTags.forEach(dependentTagId => {
        if (selectedRestrictedTags.value[dependentTagId]) {
          selectedRestrictedTags.value[dependentTagId] = false;
        }
      });
    }
  };

  // ��ȡ�����ǩ��ѡ��״̬
  const getRestrictedTagState = (tagId: string): boolean => {
    return selectedRestrictedTags.value[tagId] ?? false;
  };

  // ͼ������ظ�������

  // ����child image ID��ȡ��ͼ�����ͼ��
  const getImageGroupByChildId = (childId: string): { parentImage: CharacterImage; childImage: ImageBase } | null => {
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

  // ��ȡ��ͼ���������Ϣ���̳и�ͼ�����ԣ�
  const getChildImageWithDefaults = (parentImage: CharacterImage, childImage: ImageBase): ImageBase => {
    const resultImage: ImageBase = {
      id: childImage.id,
      name: childImage.name ?? parentImage.name ?? '',
      listName: childImage.listName ?? parentImage.listName ?? '',
      description: childImage.description ?? parentImage.description ?? '',
      artist: childImage.artist ?? parentImage.artist ?? 'N/A',
      authorLinks: childImage.authorLinks ?? parentImage.authorLinks,
      src: childImage.src,
      tags: childImage.tags ?? parentImage.tags,
      characters: childImage.characters ?? parentImage.characters,
      date: childImage.date ?? parentImage.date,
    };
    return resultImage;
  };

  const doesImageValid = (image: CharacterImage | ImageBase): boolean => {
    if (!image.src) {
      return false;
    }
    return true;
  };

  // ���ͼ���Ƿ�ͨ��������
  const doesImagePassFilter = (image: CharacterImage | ImageBase): boolean => {
    if (!doesImageValid(image)) {
      return false;
    }

    // Ӧ�����Ƽ���ǩ����
    const restrictedTags = siteConfig.tags.filter(tag => tag.isRestricted);

    for (const restrictedTag of restrictedTags) {
      // ��鸸ͼ���Ƿ��и����Ƽ���ǩ
      let imageHasTag = image.tags?.includes(restrictedTag.id) ?? false;

      // �����ͼ��û�У������ͼ���Ƿ��и����Ƽ���ǩ
      if (!imageHasTag && 'childImages' in image && image.childImages) {
        imageHasTag = image.childImages.some((child: ImageBase) => child.tags?.includes(restrictedTag.id));
      }

      const tagIsEnabled = selectedRestrictedTags.value[restrictedTag.id] ?? false;

      // ���ͼƬ��������ͼ������������ǩ�����������ǩû�б����ã�����˵�
      if (imageHasTag && !tagIsEnabled) {
        return false;
      }
    }

    // Ӧ����������
    if (searchQuery.value.trim()) {
      const query = searchQuery.value.trim().toLowerCase();

      // ����ͼƬ����
      const name = getSearchableText(image.name);

      // ��������
      const description = image.description ? getSearchableText(image.description) : '';

      // ��������������
      const artist = image.artist ? getSearchableText(image.artist) : '';

      // ������ǩ
      const tagsMatch = image.tags?.some(tagId => {
        const tag = siteConfig.tags.find(t => t.id === tagId);
        if (!tag) return false;

        const tagName = getSearchableText(tag.name);
        return tagName.includes(query);
      }) ?? false;

      const matchesSearch = name.includes(query)
                         || description.includes(query)
                         || artist.includes(query)
                         || tagsMatch;

      if (!matchesSearch) {
        return false;
      }
    }

    // Ӧ�ý�ɫ����
    if (selectedCharacterId.value !== 'all') {
      if (!image.characters?.includes(selectedCharacterId.value)) {
        return false;
      }
    }

    // Ӧ�ñ�ǩ����
    if (selectedTag.value !== 'all') {
      if (!image.tags?.includes(selectedTag.value)) {
        return false;
      }
    }

    return true;
  };

  // ��ȡͼ�������ʾͼ�����ڻ�����ʾ��
  const getDisplayImageForGroup = (parentImage: CharacterImage): CharacterImage => {
    // ���û����ͼ������һ����ͨ�ĵ���ͼ��ֱ�ӷ��ظ�ͼ��
    if (!parentImage.childImages) {
      return parentImage;
    }

    // ����ͼ���飬��Զ����ʾ��ͼ������Ϊ��ͼ���ǺϷ��Ŀ�ѡͼ��
    // �ȼ�����Чͼ������
    let validCount = 0;
    let firstValidChild: ImageBase | null = null;

    for (const childImage of parentImage.childImages) {
      const fullChildImage = getChildImageWithDefaults(parentImage, childImage);
      if (doesImagePassFilter(fullChildImage)) {
        firstValidChild ??= childImage;
        validCount++;
      }
    }

    if (firstValidChild) {
      const fullFirstChild = getChildImageWithDefaults(parentImage, firstValidChild);
      // ������Чͼ��������Ϣ�������ظ�����
      return getGroupDisplayInfo(parentImage, fullFirstChild, validCount > 1);
    }

    // ���û����Ч����ͼ�񣬷��ظ�ͼ�����ڱ�ʶ���Ǹ���ͼ��������ѡ��
    return parentImage;
  };

  // ��ȡͼ�����е�һ��ͨ�����˵���ͼ��ID
  const getFirstValidChildId = (parentImage: CharacterImage): string | null => {
    if (doesImageValid(parentImage)) {
      return parentImage.id;
    }

    if (!parentImage.childImages) {
      return null;
    }

    for (const childImage of parentImage.childImages) {
      const fullChildImage = getChildImageWithDefaults(parentImage, childImage);
      if (doesImagePassFilter(fullChildImage)) {
        return childImage.id;
      }
    }

    return null;
  };

  // ��ȡͼ�������ʾ��Ϣ��������Чͼ�������������ȼ���
  const getGroupDisplayInfo = (
    parentImage: CharacterImage,
    childImage: ImageBase,
    hasMultipleValidImages?: boolean,
  ): CharacterImage => {
    // ���û���ṩ��Чͼ��������Ϣ�������
    let hasMultiple = hasMultipleValidImages;
    if (hasMultiple === undefined) {
      // ������Чͼ��������������ѭ������
      let validCount = 0;
      if (parentImage.childImages) {
        for (const child of parentImage.childImages) {
          const fullChildImage = getChildImageWithDefaults(parentImage, child);
          if (doesImagePassFilter(fullChildImage)) {
            validCount++;
            if (validCount > 1) break; // ֻ��Ҫ֪���Ƿ񳬹�1��
          }
        }
      }
      hasMultiple = validCount > 1;
    }

    if (hasMultiple) {
      // �ж��ͼ��ʱ������ʹ��ͼ������Ϣ
      return {
        id: parentImage.id, // ʹ�ø�ͼ��ID������ͼ��ʶ
        name: parentImage.name ?? '', // ������ʾ��ͼ������
        description: parentImage.description ?? childImage.description ?? '',
        artist: parentImage.artist ?? childImage.artist ?? 'N/A',
        authorLinks: parentImage.authorLinks ?? childImage.authorLinks ?? [],
        src: childImage.src, // ��ʾ��ͼ���ʵ��ͼƬ
        tags: parentImage.tags ?? [], // ������ʾ��ͼ���ǩ
        characters: parentImage.characters, // ������ʾ��ͼ���ɫ
        date: parentImage.date ?? childImage.date, // ������ʾ��ͼ������
        childImages: parentImage.childImages, // ������ͼ����Ϣ������ͼ�ж�
      };
    } else {
      // ֻ��һ��ͼ��ʱ������ʹ�ø�ͼ�����Ϣ
      return {
        id: childImage.id, // ʹ����ͼ��ID
        name: childImage.name ?? parentImage.name ?? '', // ������ʾ��ͼ������
        description: childImage.description ?? parentImage.description ?? '',
        artist: childImage.artist ?? parentImage.artist ?? 'N/A',
        authorLinks: childImage.authorLinks ?? parentImage.authorLinks ?? [],
        src: childImage.src, // ��ʾ��ͼ���ʵ��ͼƬ
        tags: childImage.tags ?? [], // ������ʾ��ͼ���ǩ
        characters: childImage.characters ?? parentImage.characters, // ������ʾ��ͼ���ɫ
        date: childImage.date ?? parentImage.date, // ������ʾ��ͼ������
        childImages: undefined, // ����ͼ��ʱ��������ͼ����Ϣ
      };
    }
  };

  // ��ȡͼ�����������Чͼ��ͨ�����˵ģ�
  const getValidImagesInGroup = (parentImage: CharacterImage): ImageBase[] => {
    const validImages: ImageBase[] = [];

    if (doesImagePassFilter(parentImage)) {
      validImages.push(parentImage as ImageBase);
    }
    if (parentImage.childImages && parentImage.childImages.length > 0) {
      for (const childImage of parentImage.childImages) {
        const fullChildImage = getChildImageWithDefaults(parentImage, childImage);
        if (doesImagePassFilter(fullChildImage)) {
          validImages.push(fullChildImage);
        }
      }
    }

    return validImages;
  };

  const getValidImagesInGroupWithoutFilter = (parentImage: CharacterImage): ImageBase[] => {
    const validImages: ImageBase[] = [];
    if (doesImageValid(parentImage)) {
      validImages.push(parentImage as ImageBase);
    }
    if (parentImage.childImages && parentImage.childImages.length > 0) {
      for (const childImage of parentImage.childImages) {
        const fullChildImage = getChildImageWithDefaults(parentImage, childImage);
        if (doesImageValid(fullChildImage)) {
          validImages.push(fullChildImage);
        }
      }
    }
    return validImages;
  };

  // ����������ѯ
  const setSearchQuery = (query: string): void => {
    // �����ò�ѯ
    searchQuery.value = query;

    // �����ʼ������֮ǰ�������������������������浱ǰѡ��
    if (query.trim()) {
      // ���û�б���֮ǰ��ѡ���򱣴�
      if (!previousCharacterId.value) {
        previousCharacterId.value = selectedCharacterId.value;
        previousTagId.value = selectedTag.value;

        // �л���"ȫ��"��ɫ�ͱ�ǩ
        selectedCharacterId.value = 'all';
        selectedTag.value = 'all';
      }
    } else {
      // ���������������ָ�֮ǰ��ѡ��
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

  // �������
  const clearSearch = (): void => {
    // ���ÿ��ַ����ᴥ��setSearchQuery�еĻָ��߼�
    setSearchQuery('');
  };

  return {
    // �������
    searchQuery,
    isSearching,
    setSearchQuery,
    clearSearch,

    // �������
    selectedCharacterId,
    selectedTag,
    selectedCharacter,
    characterImages,
    tagCounts,
    getCharacterMatchCount,

    // �����ǩ���
    selectedRestrictedTags,
    setRestrictedTagState,
    getRestrictedTagState,

    // �������
    sortBy,
    sortOrder,

    // ͼ���ѯ
    getImageById,
    getImageIndexById,
    getImageByIndex,

    // ͼ�������
    getImageGroupByChildId,
    getChildImageWithDefaults,
    getDisplayImageForGroup,
    getValidImagesInGroup,
    getGroupDisplayInfo,
    getFirstValidChildId,
    getValidImagesInGroupWithoutFilter,
  };
});
