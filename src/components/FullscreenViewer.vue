<template>
  <div class="fullscreen-viewer"
    :class="{
      'active': isActive,
      'transition-active': transitionActive,
      'closing': isClosing
    }"
    @keydown.esc="close" tabindex="0">
    <div class="viewer-header">
      <div class="viewer-title">
        {{ currentImage ? t(currentImage.name, currentLanguage) : '' }}
      </div>

      <div class="viewer-controls">
        <button class="control-button" @click="toggleInfoPanel" :class="{ 'disabled': infoPanelAnimating }"
          :disabled="infoPanelAnimating" :title="t(showInfoPanel ? 'viewer.hideInfo' : 'viewer.showInfo')">
          <info-icon class="icon" />
        </button>
        <button class="control-button close-button" @click="close" :title="t('viewer.close')">
          <x-icon class="icon" />
        </button>
      </div>
    </div>

    <div class="viewer-content">
      <div class="image-container">
        <transition name="fade" mode="out-in">
          <ProgressiveImage
            v-if="currentImage"
            :key="currentImage.id"
            :src="currentImage.src"
            :alt="t(currentImage.name, currentLanguage)"
            class="image"
            image-class="fullscreen-image"
            object-fit="contain"
            :show-loader="true"
            display-type="original"
            priority="high"
            @load="onImageLoad"
          />
        </transition>
      </div>
    </div>

    <div class="viewer-navigation">
      <button class="nav-button prev-button" @click="prevImage" :disabled="!hasPrevImage" :title="t('viewer.prev')">
        <chevron-left-icon class="icon" />
      </button>

      <div class="image-thumbnails-container"
        :class="{ 'dragging': isDragging }"
        ref="thumbnailsContainer"
        @wheel="handleThumbnailWheel"
        @mousedown="handleThumbnailMouseDown"
        @touchstart="handleThumbnailTouchStart">
        <div class="image-thumbnails" :style="{
          transform: `translateX(${thumbnailsOffset}px)`
        }">
          <button v-for="(image, index) in imagesList" :key="image.id"
            @click="handleThumbnailClick(index, $event)"
            @mousedown="handleThumbnailButtonMouseDown"
            @touchstart="handleThumbnailButtonTouchStart"
            class="thumbnail-button" :class="{ 'active': currentIndex === index }">
            <ProgressiveImage
              :src="image.src"
              :alt="t(image.name, currentLanguage)"
              class="thumbnail-image"
              object-fit="cover"
              :show-loader="false"
              preload-size="tiny"
              display-type="thumbnail"
              display-size="small"
            />
          </button>
        </div>
      </div>

      <button class="nav-button next-button" @click="nextImage" :disabled="!hasNextImage" :title="t('viewer.next')">
        <chevron-right-icon class="icon" />
      </button>
    </div>

    <transition name="slide-fade">
      <div v-show="showInfoPanel" class="viewer-footer">
        <div class="info-toggle-button" @click="toggleInfoPanel" style="display: none;">
          <!-- 信息切换按钮已移至顶部控制栏 -->
        </div>

        <div class="image-info">
          <div class="info-group">
            <h3 class="info-title">{{ t(currentImage?.name, currentLanguage) }}</h3>
            <p class="info-description">{{ t(currentImage?.description, currentLanguage) }}</p>
          </div>

          <div class="info-group">
            <h4 class="info-subtitle">{{ $t('gallery.artist') }}</h4>
            <p>{{ currentImage ? t(currentImage.artist, currentLanguage) : '' }}</p>
          </div>

          <div v-if="currentImage?.date" class="info-group">
            <h4 class="info-subtitle">{{ $t('gallery.date') }}</h4>
            <p>{{ currentImage.date }}</p>
          </div>

          <div class="info-group">
            <h4 class="info-subtitle">{{ $t('gallery.tags') }}</h4>
            <div class="tags-list">
              <span v-for="tagId in currentImage?.tags || []" :key="tagId" class="tag"
                :style="{ backgroundColor: getTagColor(tagId) }">
                {{ getTagName(tagId) }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">

import { XIcon, ChevronLeftIcon, ChevronRightIcon, InfoIcon } from 'lucide-vue-next';
import { ref, computed, watch, nextTick, onMounted, onBeforeUnmount } from 'vue';
import { useI18n } from 'vue-i18n';

import ProgressiveImage from './ProgressiveImage.vue';

import type { I18nText } from '@/types';

import thumbnailMap from '@/assets/thumbnail-map.json';
import { siteConfig } from '@/config/site';
import { imageCache, LoadPriority } from '@/services/imageCache';
import { useAppStore } from '@/stores/app';
import { AnimationDurations } from '@/utils/animations';

const props = defineProps<{
  imageId: string;
  isActive: boolean;
}>();

const emit = defineEmits<{
  close: [];
}>();

const { t: $t } = useI18n();
const appStore = useAppStore();

const currentLanguage = computed(() => appStore.currentLanguage);

// 缩略图容器引用
const thumbnailsContainer = ref<HTMLElement>();

// 添加过渡动画状态
const transitionActive = ref(false);

// 当前图片索引和图片列表
const imagesList = computed(() => appStore.characterImages);
const currentIndex = computed(() => {
  if (!props.imageId) return 0;
  return imagesList.value.findIndex(img => img.id === props.imageId);
});
const currentImage = computed(() => {
  if (currentIndex.value < 0 || currentIndex.value >= imagesList.value.length) {
    return null;
  }
  return imagesList.value[currentIndex.value];
});

// 导航控制
const hasPrevImage = computed(() => currentIndex.value > 0);
const hasNextImage = computed(() => currentIndex.value < imagesList.value.length - 1);

const prevImage = (): void => {
  if (hasPrevImage.value) {
    goToImage(currentIndex.value - 1);
  }
};

const nextImage = (): void => {
  if (hasNextImage.value) {
    goToImage(currentIndex.value + 1);
  }
};

const goToImage = (index: number): void => {
  if (index >= 0 && index < imagesList.value.length) {
    const imageId = imagesList.value[index]?.id;
    if (!imageId) {
      console.warn('图片ID为空，无法导航');
      return;
    }

    // 不再关闭查看器，直接更新内部状态

    // 使用history API更新URL参数，不触发页面刷新
    const newUrl = window.location.pathname.replace(/\/[^/]+$/, `/${imageId}`);
    window.history.pushState({ imageId }, '', newUrl);

    // 触发自定义事件通知父组件
    const event = new CustomEvent('viewerNavigate', { detail: { imageId } });
    window.dispatchEvent(event);

    // 强制重置用户滚动状态，确保自动定位生效
    isUserScrolling.value = false;

    // 更新缩略图位置
    nextTick(() => {
      updateThumbnailsOffset();
    });
  }
};

const onImageLoad = (): void => {
  // 图片加载完成处理
};

// 信息面板控制
const showInfoPanel = ref(true);
const infoPanelAnimating = ref(false);

const toggleInfoPanel = (): void => {
  if (infoPanelAnimating.value) return; // 防止动画过程中重复触发

  infoPanelAnimating.value = true;
  showInfoPanel.value = !showInfoPanel.value;

  // 动画结束后重置状态 - 从CSS读取动画时长
  const duration = AnimationDurations.getInfoPanelTransition();
  if (duration === 0) {
    // 如果没有动画或动画时长为0，立即重置状态
    infoPanelAnimating.value = false;
  } else {
    setTimeout(() => {
      infoPanelAnimating.value = false;
    }, duration);
  }
};

// 已移除小地图计算功能

// 已移除小地图相关代码

// 缩略图滚动条逻辑
const thumbnailsOffset = ref(0);
const thumbnailPadding = ref(0);

// 动态获取缩略图的实际尺寸（基于DOM计算而非硬编码）
const getThumbnailDimensions = (): { width: number; gap: number } => {
  if (!thumbnailsContainer.value) {
    // 后备默认值，但通常不会用到
    return { width: 64, gap: 8 };
  }

  const thumbnailsElement = thumbnailsContainer.value.querySelector('.image-thumbnails') as HTMLElement;
  const thumbnailButtons = thumbnailsContainer.value.querySelectorAll('.thumbnail-button');

  if (thumbnailButtons.length < 1) {
    return { width: 64, gap: 8 };
  }

  const firstButton = thumbnailButtons[0] as HTMLElement;
  const firstRect = firstButton.getBoundingClientRect();
  const { width } = firstRect;

  let gap = 8; // 默认值

  if (thumbnailButtons.length >= 2 && thumbnailsElement) {
    // 通过前两个缩略图的位置计算实际间隙
    const second = thumbnailButtons[1] as HTMLElement;
    const secondRect = second.getBoundingClientRect();
    gap = secondRect.left - firstRect.right;
  } else if (thumbnailsElement) {
    // 如果只有一个缩略图，尝试从CSS计算gap值
    const computedStyle = window.getComputedStyle(thumbnailsElement);
    const gapValue = computedStyle.gap || computedStyle.columnGap;
    if (gapValue && gapValue !== 'normal') {
      const gapPx = parseFloat(gapValue);
      if (!isNaN(gapPx)) {
        gap = gapPx;
      }
    }
  }

  return { width, gap };
};

// 计算缩略图列表的总宽度
const getThumbnailsListWidth = (count: number): number => {
  if (count <= 0) return 0;
  const { width, gap } = getThumbnailDimensions();
  // 总宽度 = (数量-1) × (宽度+间隙) + 最后一个宽度
  return (count - 1) * (width + gap) + width;
};

// 计算特定索引缩略图的中心位置
const getThumbnailCenterPosition = (index: number): number => {
  const { width, gap } = getThumbnailDimensions();
  return index * (width + gap) + width / 2;
};

// 动态获取容器的实际可用宽度
const getThumbnailContainerWidth = (): number => {
  if (!thumbnailsContainer.value) {
    // 后备计算方式
    return window.innerWidth - 136;
  }

  // 基于实际DOM元素计算可用宽度
  const containerRect = thumbnailsContainer.value.getBoundingClientRect();
  return containerRect.width;
};

const updateThumbnailsOffset = (): void => {
  // 如果用户正在手动滚动，不要自动调整位置
  if (isUserScrolling.value) return;

  const containerWidth = getThumbnailContainerWidth();
  const totalWidth = getThumbnailsListWidth(imagesList.value.length);
  const containerCenter = containerWidth / 2;

  // 不使用占位符，直接基于实际内容计算
  thumbnailPadding.value = 0;

  if (totalWidth <= containerWidth) {
    // 如果内容少于一屏，整体居中显示
    thumbnailsOffset.value = (containerWidth - totalWidth) / 2;
    return;
  }

  // 计算当前图片的实际中心位置
  const currentImageCenter = getThumbnailCenterPosition(currentIndex.value);

  // 计算让当前图片居中的理想偏移量
  const idealOffset = containerCenter - currentImageCenter;

  // 计算边界限制：
  // 左边界：第一张图片居中时的偏移量（第一张图片中心对齐容器中心）
  const firstImageCenter = getThumbnailCenterPosition(0);
  const maxOffset = containerCenter - firstImageCenter;

  // 右边界：最后一张图片居中时的偏移量（最后一张图片中心对齐容器中心）
  const lastImageCenter = getThumbnailCenterPosition(imagesList.value.length - 1);
  const minOffset = containerCenter - lastImageCenter;

  // 应用边界限制
  thumbnailsOffset.value = Math.max(minOffset, Math.min(maxOffset, idealOffset));
};

// 手动滚动缩略图的状态
const isDragging = ref(false);
const dragStartX = ref(0);
const dragStartOffset = ref(0);
const isUserScrolling = ref(false); // 标记用户是否在手动滚动

// 手动设置缩略图偏移量（用户拖拽时）
const setManualThumbnailOffset = (offset: number): void => {
  const containerWidth = getThumbnailContainerWidth();
  const totalWidth = getThumbnailsListWidth(imagesList.value.length);
  const containerCenter = containerWidth / 2;

  if (totalWidth <= containerWidth) {
    return; // 如果内容不足一屏，不允许滚动
  }

  // 使用与自动定位相同的边界计算
  // 左边界：第一张图片居中时的偏移量
  const firstImageCenter = getThumbnailCenterPosition(0);
  const maxOffset = containerCenter - firstImageCenter;

  // 右边界：最后一张图片居中时的偏移量
  const lastImageCenter = getThumbnailCenterPosition(imagesList.value.length - 1);
  const minOffset = containerCenter - lastImageCenter;

  thumbnailsOffset.value = Math.max(minOffset, Math.min(maxOffset, offset));
};

// 滚轮事件处理
const handleThumbnailWheel = (event: WheelEvent): void => {
  event.preventDefault();
  isUserScrolling.value = true;

  const scrollSpeed = 40; // 滚动速度
  const delta = event.deltaY > 0 ? -scrollSpeed : scrollSpeed;
  setManualThumbnailOffset(thumbnailsOffset.value + delta);

  // 1秒后重置用户滚动状态
  setTimeout(() => {
    isUserScrolling.value = false;
  }, 1000);
};

// 鼠标拖拽处理
const handleThumbnailMouseDown = (event: MouseEvent): void => {
  if (event.button !== 0) return; // 只处理左键

  event.preventDefault();
  isUserScrolling.value = true;
  dragStartX.value = event.clientX;
  dragStartOffset.value = thumbnailsOffset.value;

  const handleMouseMove = (e: MouseEvent): void => {
    const deltaX = e.clientX - dragStartX.value;

    // 降低拖拽阈值并立即启用拖拽状态以减少卡顿
    if (Math.abs(deltaX) > 2) { // 降低阈值从 dragThreshold 到 2
      if (!isDragging.value) {
        isDragging.value = true;
      }
    }

    if (isDragging.value) {
      setManualThumbnailOffset(dragStartOffset.value + deltaX);
    }
  };

  const handleMouseUp = (): void => {
    // 延迟重置拖拽状态，确保点击事件处理完毕
    setTimeout(() => {
      isDragging.value = false;
    }, 50);

    setTimeout(() => {
      isUserScrolling.value = false;
    }, 500);

    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  };

  document.addEventListener('mousemove', handleMouseMove);
  document.addEventListener('mouseup', handleMouseUp);
};

// 触摸拖拽处理
const handleThumbnailTouchStart = (event: TouchEvent): void => {
  if (event.touches.length !== 1) return;

  const touch = event.touches[0];
  isUserScrolling.value = true;
  dragStartX.value = touch.clientX;
  dragStartOffset.value = thumbnailsOffset.value;

  const handleTouchMove = (e: TouchEvent): void => {
    if (e.touches.length !== 1) return;

    const touch = e.touches[0];
    const deltaX = touch.clientX - dragStartX.value;

    // 降低拖拽阈值并立即启用拖拽状态以减少卡顿
    if (Math.abs(deltaX) > 2) { // 降低阈值从 dragThreshold 到 2
      if (!isDragging.value) {
        isDragging.value = true;
        e.preventDefault(); // 防止页面滚动
      }
    }

    if (isDragging.value) {
      e.preventDefault(); // 防止页面滚动
      setManualThumbnailOffset(dragStartOffset.value + deltaX);
    }
  };

  const handleTouchEnd = (): void => {
    // 延迟重置拖拽状态，确保点击事件处理完毕
    setTimeout(() => {
      isDragging.value = false;
    }, 50);

    setTimeout(() => {
      isUserScrolling.value = false;
    }, 500);

    thumbnailsContainer.value?.removeEventListener('touchmove', handleTouchMove as any);
    thumbnailsContainer.value?.removeEventListener('touchend', handleTouchEnd);
  };

  thumbnailsContainer.value?.addEventListener('touchmove', handleTouchMove as any, { passive: false });
  thumbnailsContainer.value?.addEventListener('touchend', handleTouchEnd);
};

// 拖拽相关状态
const clickStartTime = ref(0);
const clickStartPosition = ref({ x: 0, y: 0 });
const dragThreshold = 5; // 拖拽阈值，超过这个距离算作拖拽而非点击

// 缩略图按钮点击处理（区分点击和拖拽）
const handleThumbnailClick = (index: number, event: MouseEvent): void => {
  // 如果是拖拽操作，则不触发点击
  if (isDragging.value) {
    event.preventDefault();
    return;
  }

  // 检查是否是真正的点击（而非拖拽结束）
  const currentTime = Date.now();
  const timeDiff = currentTime - clickStartTime.value;
  const currentPos = { x: event.clientX, y: event.clientY };
  const distance = Math.sqrt(
    Math.pow(currentPos.x - clickStartPosition.value.x, 2)
    + Math.pow(currentPos.y - clickStartPosition.value.y, 2),
  );

  // 如果时间太长或移动距离太大，认为是拖拽而非点击
  if (timeDiff > 500 || distance > dragThreshold) {
    event.preventDefault();
    return;
  }

  goToImage(index);
};

// 缩略图按钮鼠标按下处理
const handleThumbnailButtonMouseDown = (event: MouseEvent): void => {
  if (event.button !== 0) return; // 只处理左键

  clickStartTime.value = Date.now();
  clickStartPosition.value = { x: event.clientX, y: event.clientY };

  // 调用原有的拖拽逻辑
  handleThumbnailMouseDown(event);
};

// 缩略图按钮触摸开始处理
const handleThumbnailButtonTouchStart = (event: TouchEvent): void => {
  if (event.touches.length !== 1) return;

  const touch = event.touches[0];
  clickStartTime.value = Date.now();
  clickStartPosition.value = { x: touch.clientX, y: touch.clientY };

  // 调用原有的触摸拖拽逻辑
  handleThumbnailTouchStart(event);
};

// 获取标签颜色
const getTagColor = (tagId: string): string => {
  const tag = siteConfig.tags.find(t => t.id === tagId);
  return tag?.color || '#8b5cf6';
};

// 获取标签名称
const getTagName = (tagId: string): string => {
  const tag = siteConfig.tags.find(t => t.id === tagId);
  return tag ? t(tag.name, currentLanguage.value) : tagId;
};

// 关闭查看器
const isClosing = ref(false);
const close = (): void => {
  // 设置关闭状态
  isClosing.value = true;
  // 先添加淡出过渡动画，再关闭查看器
  transitionActive.value = false;

  // 从CSS读取过渡动画时长
  const duration = AnimationDurations.getViewerTransition();
  if (duration === 0) {
    // 如果没有动画或动画时长为0，立即关闭
    emit('close');
    // 重置关闭状态，以便下次打开
    isClosing.value = false;
  } else {
    setTimeout(() => {
      emit('close');
      // 重置关闭状态，以便下次打开
      isClosing.value = false;
    }, duration);
  }
};

// 键盘事件
const handleKeyDown = (event: KeyboardEvent): void => {
  if (!props.isActive) return;

  switch (event.key) {
    case 'Escape':
      close();
      break;
    case 'ArrowLeft':
      prevImage();
      break;
    case 'ArrowRight':
      nextImage();
      break;
  }
};

// 预加载相邻图片
const preloadAdjacentImages = (): void => {
  const currentIdx = currentIndex.value;
  const imagesToPreload: string[] = [];

  // 预加载前一张和后一张图片（普通优先级）
  if (currentIdx > 0) {
    imagesToPreload.push(imagesList.value[currentIdx - 1].src);
  }
  if (currentIdx < imagesList.value.length - 1) {
    imagesToPreload.push(imagesList.value[currentIdx + 1].src);
  }

  // 异步预加载相邻图片
  imagesToPreload.forEach(src => {
    imageCache.preloadImage(src, LoadPriority.OTHER_IMAGE).catch(() => {
      // 预加载失败不影响主要功能
    });
  });

  // 预加载前两张和后两张图片（低优先级）
  const lowPriorityImages: string[] = [];
  if (currentIdx > 1) {
    lowPriorityImages.push(imagesList.value[currentIdx - 2].src);
  }
  if (currentIdx < imagesList.value.length - 2) {
    lowPriorityImages.push(imagesList.value[currentIdx + 2].src);
  }

  // 低优先级预加载 - 延迟执行以确保当前图片优先
  setTimeout(() => {
    lowPriorityImages.forEach(src => {
      imageCache.preloadImage(src, LoadPriority.OTHER_IMAGE).catch(() => {
        // 预加载失败不影响主要功能
      });
    });
  }, 300); // 延迟300ms，给当前图片足够的加载时间
};

// 监听图片变化
watch(currentImage, (newImage) => {
  if (newImage) {
    // 获取当前图片的缩略图URL
    const thumbnailSrc = getThumbnailUrl(newImage.src, 'tiny');

    // 设置当前图片，这会触发优先级重新评估
    imageCache.setCurrentImage(newImage.src, thumbnailSrc || undefined);

    // 延迟触发预加载，确保当前图片优先
    nextTick(() => {
      setTimeout(() => {
        updateThumbnailsOffset();
        // 预加载相邻图片
        preloadAdjacentImages();
      }, 150); // 给当前图片150ms的优先加载时间
    });
  }
});

// 获取缩略图URL的辅助函数
const getThumbnailUrl = (originalSrc: string, size: 'tiny' | 'small' | 'medium'): string | null => {
  const thumbnails = (thumbnailMap as any)[originalSrc] as Record<string, string> | undefined;
  return thumbnails?.[size] || null;
};

// 监听激活状态
watch(() => props.isActive, (newValue) => {
  if (newValue) {
    // 重置关闭状态
    isClosing.value = false;

    // 组件激活时，先添加可见样式，然后再添加过渡动画样式
    nextTick(() => {
      setTimeout(() => {
        transitionActive.value = true;
      }, 50);
    });
  } else {
    // 组件隐藏时的处理已移至close函数
    // 这里不需要额外处理，因为close函数会设置transitionActive.value = false
  }
}, { immediate: true });

// 监听窗口大小变化
const handleResize = (): void => {
  // 窗口大小变化时，强制重新计算位置（忽略用户滚动状态）
  const wasUserScrolling = isUserScrolling.value;
  isUserScrolling.value = false;
  updateThumbnailsOffset();
  // 如果用户之前在滚动，延迟恢复状态
  if (wasUserScrolling) {
    setTimeout(() => {
      isUserScrolling.value = true;
    }, 100);
  }
};

onMounted(() => {
  window.addEventListener('keydown', handleKeyDown);
  window.addEventListener('resize', handleResize);
  nextTick(() => {
    updateThumbnailsOffset();
  });
});

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeyDown);
  window.removeEventListener('resize', handleResize);
});

// 本地化辅助函数
const t = (text: I18nText | string | undefined, lang?: string): string => {
  if (!text) return '';
  if (typeof text === 'string') return text;
  if (!lang) return text.zh || text.en || '';
  return text[lang as keyof I18nText] || text.en || '';
};
</script>

<style scoped>
.fullscreen-viewer {
  position: fixed;
  inset: 0;
  z-index: 50;
  background-color: rgba(0, 0, 0, 0.9);
  display: flex;
  flex-direction: column;
  visibility: hidden;
  opacity: 0;
  outline: none;
  will-change: opacity, visibility;
  /* 默认禁用选择，但允许文本元素覆盖此设置 */
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
}

/* 全局禁止图片拖拽 */
.fullscreen-viewer img {
  -webkit-user-drag: none;
  -webkit-touch-callout: none;
  pointer-events: auto;
}

.fullscreen-viewer.active {
  visibility: visible;
  opacity: 0;
}

.fullscreen-viewer.transition-active {
  transition: opacity 400ms ease;
  opacity: 1;
}

/* 关闭动画 - 与打开动画相同，只有不透明度变化 */
.fullscreen-viewer.closing {
  transition: opacity 400ms ease;
  opacity: 0;
}

.viewer-header {
  @apply flex items-center justify-between;
  @apply py-3 px-4;
  @apply bg-black/50;
}

.viewer-title {
  @apply text-white text-lg font-medium truncate;
  user-select: text;
  -webkit-user-select: text;
  -moz-user-select: text;
  -ms-user-select: text;
}

.viewer-controls {
  @apply flex items-center gap-2;
}

.control-button {
  @apply p-2 rounded-full;
  @apply text-gray-200 hover:text-white;
  @apply bg-gray-800/60 hover:bg-gray-700/60;
  @apply transition-colors duration-200;
}

.control-button.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.close-button {
  @apply bg-red-800/60 hover:bg-red-700/60;
  @apply ml-2;
}

.icon {
  @apply w-5 h-5;
}

.viewer-content {
  @apply flex-1 overflow-hidden;
  @apply flex items-center justify-center;
  @apply relative;
}

.image-container {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  /* 禁止拖拽 */
  -webkit-user-drag: none;
  -webkit-touch-callout: none;
}

/* 图像切换过渡动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* 移除了图像和信息面板的单独关闭动画 */

.viewer-navigation {
  @apply flex items-center;
  @apply h-24 py-2 px-4;
  @apply bg-black/50;
}

.nav-button {
  @apply flex items-center justify-center;
  @apply w-10 h-10 rounded-full;
  @apply text-gray-200 hover:text-white;
  @apply bg-gray-800/60 hover:bg-gray-700/60;
  @apply transition-colors duration-200;
}

.nav-button:disabled {
  @apply opacity-30 cursor-not-allowed;
}

.image-thumbnails-container {
  @apply flex-1 overflow-hidden mx-3;
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
}

.image-thumbnails-container.dragging {
  cursor: grabbing;
}

.image-thumbnails {
  @apply flex items-center gap-2;
  @apply transition-transform duration-300 ease-out;
}

/* 拖拽时禁用动画以避免卡顿 */
.image-thumbnails-container.dragging .image-thumbnails {
  transition: none !important;
}

.thumbnail-button {
  @apply w-16 h-16 rounded-md overflow-hidden;
  @apply border-2 border-transparent;
  @apply transition-all duration-200;
  @apply flex-shrink-0;
  cursor: pointer;
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
}

.image-thumbnails-container.dragging .thumbnail-button {
  cursor: grabbing;
}

.thumbnail-button.active {
  @apply border-blue-500;
}

.thumbnail-image {
  @apply w-full h-full object-contain;
  background-color: rgba(0, 0, 0, 0.2);
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  /* 禁止拖拽 */
  -webkit-user-drag: none;
  -webkit-touch-callout: none;
}

/* 已删除小地图相关样式 */

.viewer-footer {
  padding: 1rem 1.5rem;
  background-color: rgba(0, 0, 0, 0.5);
  position: relative;
  max-height: 24rem;
  overflow: hidden;
}

/* 添加滑动动画 */
.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  max-height: 24rem;
}

.slide-fade-enter-active .image-info,
.slide-fade-leave-active .image-info {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.slide-fade-enter-from,
.slide-fade-leave-to {
  max-height: 0;
  padding-top: 0;
  padding-bottom: 0;
}

.slide-fade-enter-from .image-info,
.slide-fade-leave-to .image-info {
  opacity: 0;
  transform: translateY(10px);
}

.info-toggle-button {
  @apply absolute top-0 left-1/2;
  @apply -translate-x-1/2 -translate-y-1/2;
  @apply flex items-center justify-center;
  @apply w-10 h-10 rounded-full;
  @apply text-gray-200 hover:text-white;
  @apply bg-gray-800/80 hover:bg-gray-700/80;
  @apply shadow-lg;
  @apply transition-colors duration-200;
  @apply cursor-pointer;
  @apply z-10;
}

.image-info {
  @apply text-white;
  will-change: opacity, transform;
  transform: translateY(0);
  opacity: 1;
  user-select: text;
  -webkit-user-select: text;
  -moz-user-select: text;
  -ms-user-select: text;
}

.info-group {
  @apply mb-3;
}

.info-title {
  @apply text-xl font-bold mb-1;
}

.info-subtitle {
  @apply text-sm uppercase tracking-wider text-gray-400 mb-1;
}

.info-description {
  @apply text-gray-300 mb-2;
}

.tags-list {
  @apply flex flex-wrap gap-1;
}

.tag {
  @apply px-2 py-0.5 rounded-full;
  @apply text-xs text-white;
  user-select: text;
  -webkit-user-select: text;
  -moz-user-select: text;
  -ms-user-select: text;
}
</style>
