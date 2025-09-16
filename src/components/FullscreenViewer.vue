<template>
  <div class="fullscreen-viewer" :class="{
    'active': isActive,
    'transition-active': transitionActive,
    'closing': isClosing
  }" @keydown.esc="close" tabindex="0">
    <div class="viewer-header">
      <div class="viewer-title">
        {{ currentImage ? t(currentImage.name, currentLanguage) : '' }}
      </div>

      <div class="viewer-controls">
        <button class="control-button zoom-button" @click="zoomOut" :title="$t('viewer.zoomOut')"
          :class="{ 'disabled': isZoomDisabled }" :disabled="isZoomDisabled">
          <zoom-out-icon class="icon" />
        </button>
        <button class="control-button zoom-button" @click="resetZoom" :title="$t('viewer.resetZoom')"
          :class="{ 'disabled': isZoomDisabled }" :disabled="isZoomDisabled">
          <rotate-ccw-icon class="icon" />
        </button>
        <button class="control-button zoom-button" @click="zoomIn" :title="$t('viewer.zoomIn')"
          :class="{ 'disabled': isZoomDisabled }" :disabled="isZoomDisabled">
          <zoom-in-icon class="icon" />
        </button>
        <button class="control-button" @click="toggleInfoPanel"
          :class="{ 'disabled': infoPanelAnimating || mobileInfoOverlayAnimating }"
          :disabled="infoPanelAnimating || mobileInfoOverlayAnimating" :title="getInfoButtonTitle()">
          <info-icon class="icon" />
        </button>
        <button class="control-button close-button" @click="close" :title="t('viewer.close')">
          <x-icon class="icon" />
        </button>
      </div>
    </div>

    <div class="viewer-content">
      <div class="image-container" ref="imageContainer" @wheel="handleImageWheel" @mousedown="handleImageMouseDown"
        @touchstart="handleImageTouchStart" @touchmove="handleImageTouchMove" @touchend="handleImageTouchEnd">
        <transition name="fade" mode="out-in">
          <ProgressiveImage v-if="currentImage && currentImage.src" :key="currentImage.id" :src="currentImage.src"
            :alt="t(currentImage.name, currentLanguage)" class="image" image-class="fullscreen-image"
            object-fit="contain" :show-loader="true" display-type="original" priority="high" @load="onImageLoad"
            ref="imageElement" :style="{
              transform: imageTransform,
              transition: imageTransitionStyle
            }" />
          <div v-else-if="currentImage" class="no-image-display">
            <div class="no-image-content">
              <svg class="no-image-icon" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17l1.5-2L12 17h7V5H5v12z"/>
              </svg>
              <p class="no-image-text">{{ t(currentImage.name, currentLanguage) }}</p>
            </div>
          </div>
        </transition>

        <!-- 小地图控件 -->
        <div v-if="showMinimap" class="minimap-container" :class="{ 'dragging': isDraggingMinimap }"
          @mousedown="handleMinimapMouseDown" @touchstart="handleMinimapTouchStart">
          <div class="minimap-image-container">
            <img :src="currentImage?.src" :alt="t(currentImage?.name, currentLanguage)" class="minimap-image"
              ref="minimapImage" />
            <div class="minimap-image-border" :style="imageBorderStyle"></div>
            <div class="minimap-viewport" :style="viewportStyle"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- 图像组选择器 -->
    <transition name="slide-in-right">
      <div v-if="showGroupSelector" class="group-selector">
        <div class="group-selector-header">
          <h4 class="group-title">{{ $t('viewer.imageGroup') }}</h4>
        </div>
        <div class="group-images-list">
          <button 
            v-for="image in groupImagesList" 
            :key="image.id"
            @click="goToGroupImage(image.id)"
            class="group-image-button"
            :class="{ 'active': image.id === currentDisplayImageId }"
          >
            <ProgressiveImage 
              v-if="image.src"
              :src="image.src" 
              :alt="t(image.name, currentLanguage)" 
              class="group-image-thumbnail"
              object-fit="cover" 
              :show-loader="false" 
              preload-size="tiny" 
              display-type="thumbnail"
              display-size="small" 
            />
            <div v-else class="group-image-placeholder">
              <svg class="placeholder-icon" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17l1.5-2L12 17h7V5H5v12z"/>
              </svg>
            </div>
            <div class="group-image-info">
              <span class="group-image-name">{{ t(image.name, currentLanguage) }}</span>
            </div>
          </button>
        </div>
      </div>
    </transition>

    <div class="viewer-navigation">
      <button class="nav-button prev-button" @click="prevImage" :disabled="!hasPrevImage" :title="t('viewer.prev')">
        <chevron-left-icon class="icon" />
      </button>

      <div class="image-thumbnails-container" :class="{ 'dragging': isDragging }" ref="thumbnailsContainer"
        @wheel="handleThumbnailWheel" @mousedown="handleThumbnailMouseDown" @touchstart="handleThumbnailTouchStart">
        <div class="image-thumbnails" :style="{
          transform: `translateX(${thumbnailsOffset}px)`
        }">
          <button v-for="(image, index) in imagesList" :key="image.id" @click="handleThumbnailClick(index, $event)"
            @mousedown="handleThumbnailButtonMouseDown" @touchstart="handleThumbnailButtonTouchStart"
            class="thumbnail-button" :class="{ 'active': currentIndex === index }">
            <ProgressiveImage 
              v-if="image.src"
              :src="image.src" 
              :alt="t(image.name, currentLanguage)" 
              class="thumbnail-image"
              object-fit="cover" 
              :show-loader="false" 
              preload-size="tiny" 
              display-type="thumbnail"
              display-size="small" 
            />
            <div v-else class="thumbnail-placeholder">
              <svg class="placeholder-icon" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17l1.5-2L12 17h7V5H5v12z"/>
              </svg>
            </div>
          </button>
        </div>
      </div>

      <button class="nav-button next-button" @click="nextImage" :disabled="!hasNextImage" :title="t('viewer.next')">
        <chevron-right-icon class="icon" />
      </button>
    </div>

    <!-- 桌面端信息面板 -->
    <transition name="slide-fade">
      <div v-show="showInfoPanel && !isMobile" class="viewer-footer">
        <div class="info-toggle-button" @click="toggleInfoPanel" style="display: none;">
          <!-- 信息切换按钮已移至顶部控制栏 -->
        </div>

        <div class="image-info">
          <div class="info-group">
            <h3 class="info-title">{{ t(currentImage?.name, currentLanguage) }}</h3>
            <p class="info-description">{{ t(getDescriptionWithFallback, currentLanguage) }}</p>
          </div>

          <div class="info-group">
            <h4 class="info-subtitle">{{ $t('gallery.artist') }}</h4>
            <p>{{ t(getArtistWithFallback, currentLanguage) }}</p>
          </div>

          <div class="info-group">
            <h4 class="info-subtitle">{{ $t('gallery.date') }}</h4>
            <p>{{ currentImage?.date || 'N/A' }}</p>
          </div>

          <div class="info-group">
            <h4 class="info-subtitle">{{ $t('gallery.tags') }}</h4>
            <div class="tags-list">
              <span v-for="tagId in getSortedTags(currentImage?.tags || [])" :key="tagId" class="tag"
                :style="{ backgroundColor: getTagColor(tagId) }">
                {{ getTagName(tagId, currentLanguage) }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </transition>

    <!-- 移动端信息覆盖层 -->
    <transition name="mobile-overlay-fade">
      <div v-show="showMobileInfoOverlay && isMobile" class="mobile-info-overlay" @click="closeMobileInfoOverlay">
        <transition name="mobile-info-slide">
          <div v-show="showMobileInfoOverlay" class="mobile-info-panel" @click.stop>
            <div class="mobile-info-header">
              <h3 class="mobile-info-title">{{ $t('viewer.imageInfo') }}</h3>
              <button class="mobile-info-close" @click="closeMobileInfoOverlay">
                <x-icon class="icon" />
              </button>
            </div>

            <div class="mobile-info-content">
              <div class="info-group">
                <h3 class="info-title">{{ t(currentImage?.name, currentLanguage) }}</h3>
                <p class="info-description">{{ t(getDescriptionWithFallback, currentLanguage) }}</p>
              </div>

              <div class="info-group">
                <h4 class="info-subtitle">{{ $t('gallery.artist') }}</h4>
                <p>{{ t(getArtistWithFallback, currentLanguage) }}</p>
              </div>

              <div class="info-group">
                <h4 class="info-subtitle">{{ $t('gallery.date') }}</h4>
                <p>{{ currentImage?.date || 'N/A' }}</p>
              </div>

              <div class="info-group">
                <h4 class="info-subtitle">{{ $t('gallery.tags') }}</h4>
                <div class="tags-list">
                  <span v-for="tagId in getSortedTags(currentImage?.tags || [])" :key="tagId" class="tag"
                    :style="{ backgroundColor: getTagColor(tagId) }">
                    {{ getTagName(tagId, currentLanguage) }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </transition>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">

import { XIcon, ChevronLeftIcon, ChevronRightIcon, InfoIcon, ZoomInIcon, ZoomOutIcon, RotateCcwIcon } from 'lucide-vue-next';
import { ref, computed, watch, nextTick, onMounted, onBeforeUnmount } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';

import ProgressiveImage from './ProgressiveImage.vue';

import type { I18nText } from '@/types';

import thumbnailMap from '@/assets/thumbnail-map.json';
import { useEventManager } from '@/composables/useEventManager';
import { useMobileDetection } from '@/composables/useScreenManager';
import { useTags } from '@/composables/useTags';
import { useTimers } from '@/composables/useTimers';
import { imageCache, LoadPriority } from '@/services/imageCache';
import { useAppStore } from '@/stores/app';
import { AnimationDurations } from '@/utils/animations';

const props = defineProps<{
  imageId: string;
  childImageId?: string;
  isActive: boolean;
}>();

const emit = defineEmits<{
  close: [];
}>();

const { t: $t } = useI18n();
const router = useRouter();
const appStore = useAppStore();
const timers = useTimers();
const eventManager = useEventManager();
const { isMobile, onScreenChange } = useMobileDetection();
const { getSortedTags, getTagColor, getTagName } = useTags();

const currentLanguage = computed(() => appStore.currentLanguage);

// 缩略图容器引用
const thumbnailsContainer = ref<HTMLElement>();

// 图像容器和图像元素引用
const imageContainer = ref<HTMLElement>();
const imageElement = ref<any>(); // Vue组件实例
const minimapImage = ref<HTMLElement>();

// 添加过渡动画状态
const transitionActive = ref(false);

// 图像缩放和拖拽状态
const imageScale = ref(1);
const imageOffset = ref({ x: 0, y: 0 });
const isDraggingImage = ref(false);
const isZooming = ref(false);
const dragStart = ref({ x: 0, y: 0 });
const lastTouchDistance = ref(0);
const enableImageTransition = ref(true);

// 小地图相关状态
const showMinimap = ref(false);
const viewportRect = ref({ x: 0, y: 0, width: 0, height: 0 });
const isDraggingMinimap = ref(false);
const minimapDragStart = ref({ x: 0, y: 0 });

// 图像加载状态
const isOriginalImageLoaded = ref(false);

// 检测是否是直接访问（通过URL直接打开图像查看器）
const isDirectAccess = computed(() => {
  // 使用应用状态中的标记来判断是否从画廊进入
  return !appStore.isFromGallery;
});

// 当前图片索引和图片列表（支持图像组）
const imagesList = computed(() => {
  if (isDirectAccess.value) {
    // 直接访问时的逻辑
    if (props.childImageId) {
      // 访问子图像：/:imageId/:childImageId
      // 显示完整的图集，但会索引到目标childImage
      const parentImage = appStore.getImageById(props.imageId);
      if (parentImage && parentImage.childImages && parentImage.childImages.length > 0) {
        // 返回完整的图集（包含所有子图像）
        const groupImages = appStore.getValidImagesInGroup(parentImage);
        return groupImages;
      }
      return [];
    } else {
      // 访问图像：/:imageId
      const image = appStore.getImageById(props.imageId);
      if (image) {
        // 检查这个imageId是否是一个childImage
        const groupInfo = appStore.getImageGroupByChildId(props.imageId);
        if (groupInfo) {
          // 如果imageId是childImage，只显示这一张子图像（不允许切换）
          return [image];
        } else {
          // 如果是父图像或普通图像
          if (image.childImages && image.childImages.length > 0) {
            // 如果是组图的主图像，显示整个图集
            const groupImages = appStore.getValidImagesInGroup(image);
            return groupImages;
          } else {
            // 普通图像，只显示该图像
            return [image];
          }
        }
      }
      return [];
    }
  }
  // 从画廊访问时，使用当前筛选的图像列表
  return appStore.characterImages;
});

// 当前显示的图像ID（可能是父图像或子图像）
const currentDisplayImageId = computed(() => {
  return props.childImageId || props.imageId;
});

const currentIndex = computed(() => {
  if (!currentDisplayImageId.value) return 0;
  return imagesList.value.findIndex(img => img.id === currentDisplayImageId.value);
});

const currentImage = computed(() => {
  if (currentIndex.value < 0 || currentIndex.value >= imagesList.value.length) {
    // 如果在当前列表中找不到，尝试直接从配置中获取
    return appStore.getImageById(currentDisplayImageId.value) || null;
  }
  return imagesList.value[currentIndex.value];
});

// 当前图像组信息（如果是图像组）
const currentImageGroup = computed(() => {
  if (!currentImage.value) return null;
  
  // 如果当前图像有子图像，说明它是父图像
  if (currentImage.value.childImages && currentImage.value.childImages.length > 0) {
    return {
      parentImage: currentImage.value,
      validImages: appStore.getValidImagesInGroup(currentImage.value),
      isParent: true,
    };
  }
  
  // 检查是否是某个组的子图像
  const groupInfo = appStore.getImageGroupByChildId(currentImage.value.id);
  if (groupInfo) {
    return {
      parentImage: groupInfo.parentImage,
      validImages: appStore.getValidImagesInGroup(groupInfo.parentImage),
      isParent: false,
    };
  }
  
  return null;
});

// 图像组内的图像列表（用于右侧选择器）
const groupImagesList = computed(() => {
  return currentImageGroup.value?.validImages || [];
});

// 是否显示图像组选择器
const showGroupSelector = computed(() => {
  // 如果是直接访问单个子图像 (/:childImageId)，不显示组选择器
  if (isDirectAccess.value && !props.childImageId) {
    // 检查是否是直接访问子图像
    const groupInfo = appStore.getImageGroupByChildId(props.imageId);
    if (groupInfo) {
      // 直接访问子图像，不显示组选择器
      return false;
    }
  }
  
  // 其他情况：如果有多个图像则显示选择器
  return groupImagesList.value.length > 1;
});

// 导航控制
const hasPrevImage = computed(() => currentIndex.value > 0);
const hasNextImage = computed(() => currentIndex.value < imagesList.value.length - 1);

// Artist 和 Description 的 fallback 助手函数
const getArtistWithFallback = computed(() => {
  if (!currentImage.value) return { en: 'N/A', zh: 'N/A', jp: 'N/A' };
  if (currentImage.value.artist) return currentImage.value.artist;
  return { en: 'N/A', zh: 'N/A', jp: 'N/A' };
});

const getDescriptionWithFallback = computed(() => {
  if (!currentImage.value) return { en: '', zh: '', jp: '' };
  if (currentImage.value.description) return currentImage.value.description;
  return { en: '', zh: '', jp: '' };
});

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

// 导航到指定索引的图像
const goToImage = (index: number): void => {
  if (index >= 0 && index < imagesList.value.length) {
    const targetImage = imagesList.value[index];
    if (!targetImage?.id) {
      console.warn('图片ID为空，无法导航');
      return;
    }

    // 导航到目标图像，选择第一个有效图像
    navigateToImage(targetImage.id);
  }
};

// 在图像组内导航到指定图像
const goToGroupImage = (imageId: string): void => {
  if (!currentImageGroup.value) return;
  
  const parentImageId = currentImageGroup.value.parentImage.id;
  const targetImage = groupImagesList.value.find(img => img.id === imageId);
  
  if (!targetImage) return;
  
  // 如果目标是父图像，使用父图像路由
  if (targetImage.id === parentImageId) {
    navigateToImage(parentImageId);
  } else {
    // 如果目标是子图像，使用子图像路由
    navigateToImage(parentImageId, targetImage.id);
  }
};

// 通用导航函数
const navigateToImage = (imageId: string, childImageId?: string): void => {
  const routeName = childImageId ? 'image-viewer-child' : 'image-viewer';
  const params = childImageId ? { imageId, childImageId } : { imageId };
  
  // 使用 Vue Router 导航
  router.push({ name: routeName, params });
  
  // 触发自定义事件通知父组件
  eventManager.dispatchEvent('viewerNavigate', { imageId, childImageId });
  
  // 强制重置用户滚动状态，确保自动定位生效
  isUserScrolling.value = false;
  
  // 更新缩略图位置
  nextTick(() => {
    updateThumbnailsOffset();
  });
};

const onImageLoad = (): void => {
  // 标记原始图像已加载
  isOriginalImageLoaded.value = true;
  // 图片加载完成处理
  nextTick(() => {
    resetImageTransform();
    updateMinimapVisibility();
  });
};

// 图像变换样式
const imageTransform = computed(() => {
  return `translate(${imageOffset.value.x}px, ${imageOffset.value.y}px) scale(${imageScale.value})`;
});

// 图像过渡样式
const imageTransitionStyle = computed(() => {
  return enableImageTransition.value ? 'transform 0.15s ease-out' : 'none';
});

// 检查是否应该禁用缩放功能
const isZoomDisabled = computed(() => {
  return !isOriginalImageLoaded.value;
});

// 小地图视口样式
const viewportStyle = computed(() => {
  return {
    left: `${viewportRect.value.x}px`,
    top: `${viewportRect.value.y}px`,
    width: `${viewportRect.value.width}px`,
    height: `${viewportRect.value.height}px`,
  };
});

// 小地图图像边框样式
const imageBorderStyle = computed(() => {
  if (!minimapImage.value || !currentImage.value) {
    return { display: 'none' };
  }

  const minimapRect = minimapImage.value.getBoundingClientRect();
  const info = getImageDisplayInfo();
  if (!info) {
    return { display: 'none' };
  }

  // 计算小地图中实际显示的图像区域
  const minimapAspect = minimapRect.width / minimapRect.height;
  const imageAspect = info.displayWidth / info.displayHeight;

  let imageBorderWidth, imageBorderHeight, imageBorderX, imageBorderY;
  if (imageAspect > minimapAspect) {
    // 图像更宽，以宽度为准
    imageBorderWidth = minimapRect.width;
    imageBorderHeight = minimapRect.width / imageAspect;
    imageBorderX = 0;
    imageBorderY = (minimapRect.height - imageBorderHeight) / 2;
  } else {
    // 图像更高，以高度为准
    imageBorderHeight = minimapRect.height;
    imageBorderWidth = minimapRect.height * imageAspect;
    imageBorderX = (minimapRect.width - imageBorderWidth) / 2;
    imageBorderY = 0;
  }

  return {
    left: `${imageBorderX}px`,
    top: `${imageBorderY}px`,
    width: `${imageBorderWidth}px`,
    height: `${imageBorderHeight}px`,
  };
});

// 重置图像变换
const resetImageTransform = (): void => {
  imageScale.value = 1;
  imageOffset.value = { x: 0, y: 0 };
  updateMinimapVisibility();
};

// 获取图像的实际显示信息（考虑object-fit: contain）
const getImageDisplayInfo = (): {
  naturalWidth: number;
  naturalHeight: number;
  displayWidth: number;
  displayHeight: number;
  scaledWidth: number;
  scaledHeight: number;
  imageX: number;
  imageY: number;
  containerWidth: number;
  containerHeight: number;
  offsetX: number;
  offsetY: number;
} | null => {
  if (!imageElement.value || !imageContainer.value) {
    return null;
  }

  // 从Vue组件实例中获取实际的DOM元素
  const imageEl = imageElement.value.$el || imageElement.value;
  const image = imageEl.querySelector ? imageEl.querySelector('img') as HTMLImageElement : imageEl as HTMLImageElement;
  if (!image) {
    return null;
  }

  const containerRect = imageContainer.value.getBoundingClientRect();

  // 获取图像的原始尺寸
  const { naturalWidth } = image;
  const { naturalHeight } = image;

  // 计算contain模式下的实际显示尺寸
  const containerAspect = containerRect.width / containerRect.height;
  const imageAspect = naturalWidth / naturalHeight;

  let displayWidth, displayHeight;
  if (imageAspect > containerAspect) {
    // 图像更宽，以宽度为准
    displayWidth = containerRect.width;
    displayHeight = containerRect.width / imageAspect;
  } else {
    // 图像更高，以高度为准
    displayHeight = containerRect.height;
    displayWidth = containerRect.height * imageAspect;
  }

  // 应用用户缩放
  const scaledWidth = displayWidth * imageScale.value;
  const scaledHeight = displayHeight * imageScale.value;

  // 计算图像在容器中的位置（居中）
  const imageX = (containerRect.width - scaledWidth) / 2;
  const imageY = (containerRect.height - scaledHeight) / 2;

  return {
    naturalWidth,
    naturalHeight,
    displayWidth,
    displayHeight,
    scaledWidth,
    scaledHeight,
    imageX,
    imageY,
    containerWidth: containerRect.width,
    containerHeight: containerRect.height,
    offsetX: (containerRect.width - displayWidth) / 2,
    offsetY: (containerRect.height - displayHeight) / 2,
  };
};

// 计算拖拽限制
const calculateDragLimits = (): {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
} => {
  const info = getImageDisplayInfo();
  if (!info) {
    return { minX: 0, maxX: 0, minY: 0, maxY: 0 };
  }

  // 防止除零错误和极端值
  if (info.containerWidth <= 0 || info.containerHeight <= 0
    || info.scaledWidth <= 0 || info.scaledHeight <= 0) {
    return { minX: 0, maxX: 0, minY: 0, maxY: 0 };
  }

  // 图像以容器中心为原点缩放
  // imageOffset是相对于图像默认居中位置的偏移
  // 缩放后图像的实际位置：
  // 左边界：containerWidth/2 - scaledWidth/2 + imageOffset.x
  // 右边界：containerWidth/2 + scaledWidth/2 + imageOffset.x
  // 上边界：containerHeight/2 - scaledHeight/2 + imageOffset.y
  // 下边界：containerHeight/2 + scaledHeight/2 + imageOffset.y

  // 限制条件：
  // 左边界 >= 0: containerWidth/2 - scaledWidth/2 + imageOffset.x >= 0
  // 右边界 <= containerWidth: containerWidth/2 + scaledWidth/2 + imageOffset.x <= containerWidth
  // 上边界 >= 0: containerHeight/2 - scaledHeight/2 + imageOffset.y >= 0
  // 下边界 <= containerHeight: containerHeight/2 + scaledHeight/2 + imageOffset.y <= containerHeight

  // 解出imageOffset的限制：
  let minX, maxX, minY, maxY;

  if (info.scaledWidth <= info.containerWidth) {
    // 图像宽度小于等于容器宽度，水平居中，不允许水平拖拽
    minX = maxX = 0;
  } else {
    // 图像宽度大于容器宽度，允许在限制范围内拖拽
    const halfWidthDiff = (info.scaledWidth - info.containerWidth) / 2;
    minX = -halfWidthDiff;
    maxX = halfWidthDiff;
  }

  if (info.scaledHeight <= info.containerHeight) {
    // 图像高度小于等于容器高度，垂直居中，不允许垂直拖拽
    minY = maxY = 0;
  } else {
    // 图像高度大于容器高度，允许在限制范围内拖拽
    const halfHeightDiff = (info.scaledHeight - info.containerHeight) / 2;
    minY = -halfHeightDiff;
    maxY = halfHeightDiff;
  }

  // 确保限制值是有限数值
  minX = isFinite(minX) ? minX : 0;
  maxX = isFinite(maxX) ? maxX : 0;
  minY = isFinite(minY) ? minY : 0;
  maxY = isFinite(maxY) ? maxY : 0;

  return { minX, maxX, minY, maxY };
};

// 应用拖拽限制
const applyDragLimits = (): void => {
  const limits = calculateDragLimits();

  // 限制在边界内
  imageOffset.value.x = Math.max(limits.minX, Math.min(limits.maxX, imageOffset.value.x));
  imageOffset.value.y = Math.max(limits.minY, Math.min(limits.maxY, imageOffset.value.y));
};

// 更新小地图可见性
const updateMinimapVisibility = (): void => {
  const info = getImageDisplayInfo();
  if (!info) {
    showMinimap.value = false;
    return;
  }

  // 检查图像是否超出容器边界或已缩放
  const isImageLarger = info.scaledWidth > info.containerWidth || info.scaledHeight > info.containerHeight;
  const isScaled = imageScale.value > 1;

  showMinimap.value = isImageLarger || isScaled;

  if (showMinimap.value) {
    nextTick(() => {
      updateMinimapViewport();
    });
  }
};

// 更新小地图视口位置
const updateMinimapViewport = (): void => {
  if (!imageElement.value || !imageContainer.value || !minimapImage.value) {
    return;
  }

  const info = getImageDisplayInfo();
  if (!info) return;

  const minimapRect = minimapImage.value.getBoundingClientRect();

  // 计算小地图中实际显示的图像区域
  // 小地图使用object-fit: contain，所以需要计算实际图像在小地图中的位置和尺寸
  const minimapAspect = minimapRect.width / minimapRect.height;
  const imageAspect = info.displayWidth / info.displayHeight;

  let minimapImageWidth, minimapImageHeight, minimapImageX, minimapImageY;
  if (imageAspect > minimapAspect) {
    // 图像更宽，以宽度为准
    minimapImageWidth = minimapRect.width;
    minimapImageHeight = minimapRect.width / imageAspect;
    minimapImageX = 0;
    minimapImageY = (minimapRect.height - minimapImageHeight) / 2;
  } else {
    // 图像更高，以高度为准
    minimapImageHeight = minimapRect.height;
    minimapImageWidth = minimapRect.height * imageAspect;
    minimapImageX = (minimapRect.width - minimapImageWidth) / 2;
    minimapImageY = 0;
  }

  // 计算当前视口在缩放后图像中的位置
  const imageLeft = info.imageX + imageOffset.value.x;
  const imageTop = info.imageY + imageOffset.value.y;

  // 计算视口在缩放后图像中的相对位置
  const viewportInScaledImageLeft = Math.max(0, -imageLeft);
  const viewportInScaledImageTop = Math.max(0, -imageTop);
  const viewportInScaledImageRight = Math.min(info.scaledWidth, info.containerWidth - imageLeft);
  const viewportInScaledImageBottom = Math.min(info.scaledHeight, info.containerHeight - imageTop);

  const viewportInScaledImageWidth = Math.max(0, viewportInScaledImageRight - viewportInScaledImageLeft);
  const viewportInScaledImageHeight = Math.max(0, viewportInScaledImageBottom - viewportInScaledImageTop);

  // 将缩放后图像中的视口位置转换为原始图像中的位置
  const scaleFactor = imageScale.value;
  const viewportInOriginalImageLeft = viewportInScaledImageLeft / scaleFactor;
  const viewportInOriginalImageTop = viewportInScaledImageTop / scaleFactor;
  const viewportInOriginalImageWidth = viewportInScaledImageWidth / scaleFactor;
  const viewportInOriginalImageHeight = viewportInScaledImageHeight / scaleFactor;

  // 计算小地图中图像区域的缩放比例
  const minimapScaleX = minimapImageWidth / info.displayWidth;
  const minimapScaleY = minimapImageHeight / info.displayHeight;

  // 计算视口框在小地图中的位置和尺寸
  const minimapViewportX = minimapImageX + viewportInOriginalImageLeft * minimapScaleX;
  const minimapViewportY = minimapImageY + viewportInOriginalImageTop * minimapScaleY;
  const minimapViewportWidth = viewportInOriginalImageWidth * minimapScaleX;
  const minimapViewportHeight = viewportInOriginalImageHeight * minimapScaleY;

  // 确保视口框不超出小地图中图像的实际显示范围
  const clampedX = Math.max(
    minimapImageX,
    Math.min(minimapViewportX, minimapImageX + minimapImageWidth - minimapViewportWidth),
  );
  const clampedY = Math.max(
    minimapImageY,
    Math.min(minimapViewportY, minimapImageY + minimapImageHeight - minimapViewportHeight),
  );
  const clampedWidth = Math.max(0, Math.min(minimapViewportWidth, minimapImageX + minimapImageWidth - clampedX));
  const clampedHeight = Math.max(0, Math.min(minimapViewportHeight, minimapImageY + minimapImageHeight - clampedY));

  viewportRect.value = {
    x: clampedX,
    y: clampedY,
    width: clampedWidth,
    height: clampedHeight,
  };
};

// 移动端检测现在通过 useMobileDetection 管理

// 信息面板控制
const showInfoPanel = ref(true);
const infoPanelAnimating = ref(false);

// 移动端覆盖层信息面板控制
const showMobileInfoOverlay = ref(false);
const mobileInfoOverlayAnimating = ref(false);

// 用户对固定信息栏的显示偏好（只针对桌面端的固定信息栏）
const userInfoPanelPreference = ref(true); // 默认显示固定信息栏

const toggleInfoPanel = (): void => {
  if (isMobile.value) {
    // 移动端：切换覆盖层显示（临时弹窗，不影响固定信息栏偏好）
    toggleMobileInfoOverlay();
  } else {
    // 桌面端：切换固定信息栏并记录用户偏好
    if (infoPanelAnimating.value) return; // 防止动画过程中重复触发

    infoPanelAnimating.value = true;
    showInfoPanel.value = !showInfoPanel.value;

    // 记录用户对固定信息栏的偏好
    userInfoPanelPreference.value = showInfoPanel.value;

    // 动画结束后重置状态 - 从CSS读取动画时长
    const duration = AnimationDurations.getInfoPanelTransition();
    if (duration === 0) {
      // 如果没有动画或动画时长为0，立即重置状态
      infoPanelAnimating.value = false;
    } else {
      timers.setTimeout(() => {
        infoPanelAnimating.value = false;
      }, duration);
    }
  }
};

// 注意：handleInfoPanelToggleComplete 函数已被移除，
// 其功能已由 handleImageContainerResize 通过 ResizeObserver 实现

// 移动端信息覆盖层切换
const toggleMobileInfoOverlay = (): void => {
  if (mobileInfoOverlayAnimating.value) return;

  mobileInfoOverlayAnimating.value = true;
  showMobileInfoOverlay.value = !showMobileInfoOverlay.value;

  // 防止背景滚动
  if (showMobileInfoOverlay.value) {
    document.body.style.overflow = 'hidden';
  } else {
    document.body.style.overflow = '';
  }

  // 动画结束后重置状态
  timers.setTimeout(() => {
    mobileInfoOverlayAnimating.value = false;
    // 移动端覆盖层不会改变图像容器大小，无需额外处理
  }, 300); // 覆盖层动画时长
};

// 关闭移动端信息覆盖层
const closeMobileInfoOverlay = (): void => {
  if (mobileInfoOverlayAnimating.value) return;

  mobileInfoOverlayAnimating.value = true;
  showMobileInfoOverlay.value = false;

  // 恢复背景滚动
  document.body.style.overflow = '';

  timers.setTimeout(() => {
    mobileInfoOverlayAnimating.value = false;
    // 移动端覆盖层不会改变图像容器大小，无需额外处理
  }, 300);
};

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
  timers.setTimeout(() => {
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
    timers.setTimeout(() => {
      isDragging.value = false;
    }, 50);

    timers.setTimeout(() => {
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
    timers.setTimeout(() => {
      isDragging.value = false;
    }, 50);

    timers.setTimeout(() => {
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

// 图像缩放和拖拽处理
const handleImageWheel = (event: WheelEvent): void => {
  if (isZoomDisabled.value) return;

  event.preventDefault();

  const delta = event.deltaY > 0 ? -0.1 : 0.1;
  const newScale = Math.max(0.5, Math.min(5, imageScale.value + delta));

  if (newScale !== imageScale.value) {
    imageScale.value = newScale;
    // 缩放后应用拖拽限制
    applyDragLimits();
    updateMinimapVisibility();
  }
};

const handleImageMouseDown = (event: MouseEvent): void => {
  if (event.button !== 0) return;

  event.preventDefault();
  enableImageTransition.value = false; // 禁用过渡动画
  isDraggingImage.value = true;
  dragStart.value = { x: event.clientX, y: event.clientY };

  const handleMouseMove = (e: MouseEvent): void => {
    if (!isDraggingImage.value) return;

    const deltaX = e.clientX - dragStart.value.x;
    const deltaY = e.clientY - dragStart.value.y;

    // 直接应用移动
    imageOffset.value.x += deltaX;
    imageOffset.value.y += deltaY;

    // 应用边界限制
    applyDragLimits();

    dragStart.value = { x: e.clientX, y: e.clientY };
    updateMinimapViewport();
  };

  const handleMouseUp = (): void => {
    isDraggingImage.value = false;
    enableImageTransition.value = true; // 重新启用过渡动画
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  };

  document.addEventListener('mousemove', handleMouseMove);
  document.addEventListener('mouseup', handleMouseUp);
};

const handleImageTouchStart = (event: TouchEvent): void => {
  if (event.touches.length === 1) {
    // 单指拖拽
    enableImageTransition.value = false; // 禁用过渡动画
    const touch = event.touches[0];
    isDraggingImage.value = true;
    dragStart.value = { x: touch.clientX, y: touch.clientY };
  } else if (event.touches.length === 2) {
    // 双指缩放
    if (isZoomDisabled.value) return;

    event.preventDefault();
    enableImageTransition.value = false; // 禁用过渡动画
    isZooming.value = true;
    const touch1 = event.touches[0];
    const touch2 = event.touches[1];
    lastTouchDistance.value = Math.sqrt(
      Math.pow(touch2.clientX - touch1.clientX, 2)
      + Math.pow(touch2.clientY - touch1.clientY, 2),
    );
  }
};

const handleImageTouchMove = (event: TouchEvent): void => {
  if (event.touches.length === 1 && isDraggingImage.value) {
    // 单指拖拽
    event.preventDefault(); // 防止页面滚动
    const touch = event.touches[0];
    const deltaX = touch.clientX - dragStart.value.x;
    const deltaY = touch.clientY - dragStart.value.y;

    // 直接应用移动
    imageOffset.value.x += deltaX;
    imageOffset.value.y += deltaY;

    // 应用边界限制
    applyDragLimits();

    dragStart.value = { x: touch.clientX, y: touch.clientY };
    updateMinimapViewport();
  } else if (event.touches.length === 2 && isZooming.value) {
    // 双指缩放
    if (isZoomDisabled.value) return;

    event.preventDefault();
    const touch1 = event.touches[0];
    const touch2 = event.touches[1];
    const currentDistance = Math.sqrt(
      Math.pow(touch2.clientX - touch1.clientX, 2)
      + Math.pow(touch2.clientY - touch1.clientY, 2),
    );

    const scaleChange = currentDistance / lastTouchDistance.value;
    const newScale = Math.max(0.5, Math.min(5, imageScale.value * scaleChange));

    if (newScale !== imageScale.value) {
      imageScale.value = newScale;
      lastTouchDistance.value = currentDistance;
      // 缩放后应用拖拽限制
      applyDragLimits();
      updateMinimapVisibility();
    }
  }
};

const handleImageTouchEnd = (): void => {
  isDraggingImage.value = false;
  isZooming.value = false;
  enableImageTransition.value = true; // 重新启用过渡动画
};

// 小地图交互处理
const handleMinimapMouseDown = (event: MouseEvent): void => {
  event.preventDefault();
  event.stopPropagation();

  if (!imageElement.value || !imageContainer.value || !minimapImage.value) return;

  const info = getImageDisplayInfo();
  if (!info) return;

  const minimapRect = minimapImage.value.getBoundingClientRect();
  const clickX = event.clientX - minimapRect.left;
  const clickY = event.clientY - minimapRect.top;

  // 计算小地图中实际显示的图像区域
  const minimapAspect = minimapRect.width / minimapRect.height;
  const imageAspect = info.displayWidth / info.displayHeight;

  let minimapImageWidth, minimapImageHeight, minimapImageX, minimapImageY;
  if (imageAspect > minimapAspect) {
    minimapImageWidth = minimapRect.width;
    minimapImageHeight = minimapRect.width / imageAspect;
    minimapImageX = 0;
    minimapImageY = (minimapRect.height - minimapImageHeight) / 2;
  } else {
    minimapImageHeight = minimapRect.height;
    minimapImageWidth = minimapRect.height * imageAspect;
    minimapImageX = (minimapRect.width - minimapImageWidth) / 2;
    minimapImageY = 0;
  }

  // 检查是否点击在图像区域内
  const isClickInImage = clickX >= minimapImageX && clickX <= minimapImageX + minimapImageWidth
    && clickY >= minimapImageY && clickY <= minimapImageY + minimapImageHeight;

  if (!isClickInImage) return; // 点击在图像区域外，忽略

  // 检查是否点击在视口框内
  const viewport = viewportRect.value;
  const isClickInViewport = clickX >= viewport.x && clickX <= viewport.x + viewport.width
    && clickY >= viewport.y && clickY <= viewport.y + viewport.height;

  if (isClickInViewport) {
    // 点击在视口框内，开始拖拽视口
    enableImageTransition.value = false; // 禁用过渡动画
    isDraggingMinimap.value = true;
    minimapDragStart.value = { x: clickX, y: clickY };

    const handleMinimapMouseMove = (e: MouseEvent): void => {
      if (!isDraggingMinimap.value) return;

      const minimapRect = minimapImage.value!.getBoundingClientRect();
      const currentX = e.clientX - minimapRect.left;
      const currentY = e.clientY - minimapRect.top;

      const deltaX = currentX - minimapDragStart.value.x;
      const deltaY = currentY - minimapDragStart.value.y;

      // 计算小地图中图像区域到原始图像的缩放比例
      const scaleX = info.displayWidth / minimapImageWidth;
      const scaleY = info.displayHeight / minimapImageHeight;

      // 将小地图中的移动转换为原始图像中的移动
      const deltaXInOriginal = deltaX * scaleX;
      const deltaYInOriginal = deltaY * scaleY;

      // 转换为缩放后图像中的移动
      const deltaXInScaled = deltaXInOriginal * imageScale.value;
      const deltaYInScaled = deltaYInOriginal * imageScale.value;

      // 应用移动（注意方向相反）
      imageOffset.value.x -= deltaXInScaled;
      imageOffset.value.y -= deltaYInScaled;

      // 应用边界限制
      applyDragLimits();

      minimapDragStart.value = { x: currentX, y: currentY };
      updateMinimapViewport();
    };

    const handleMinimapMouseUp = (): void => {
      isDraggingMinimap.value = false;
      enableImageTransition.value = true; // 重新启用过渡动画
      document.removeEventListener('mousemove', handleMinimapMouseMove);
      document.removeEventListener('mouseup', handleMinimapMouseUp);
    };

    document.addEventListener('mousemove', handleMinimapMouseMove);
    document.addEventListener('mouseup', handleMinimapMouseUp);
  } else {
    // 点击在视口框外，直接跳转到点击位置
    // 将点击位置转换为相对于图像区域的坐标
    const clickXInImage = clickX - minimapImageX;
    const clickYInImage = clickY - minimapImageY;

    // 计算小地图中图像区域到原始图像的缩放比例
    const scaleX = info.displayWidth / minimapImageWidth;
    const scaleY = info.displayHeight / minimapImageHeight;

    // 计算点击位置在原始图像中的位置（相对于图像左上角）
    const targetXInOriginal = clickXInImage * scaleX;
    const targetYInOriginal = clickYInImage * scaleY;

    // 计算点击位置相对于原始图像中心的偏移
    const targetOffsetFromCenterX = targetXInOriginal - info.displayWidth / 2;
    const targetOffsetFromCenterY = targetYInOriginal - info.displayHeight / 2;

    // 转换为缩放后图像中相对于中心的偏移
    const targetOffsetScaledX = targetOffsetFromCenterX * imageScale.value;
    const targetOffsetScaledY = targetOffsetFromCenterY * imageScale.value;

    // 计算需要的imageOffset，使点击位置居中
    // imageOffset是相对于图像默认居中位置的偏移
    imageOffset.value = {
      x: -targetOffsetScaledX,
      y: -targetOffsetScaledY,
    };

    // 应用拖拽限制
    applyDragLimits();

    // 设置拖拽状态，允许接着拖拽
    isDraggingMinimap.value = true;
    minimapDragStart.value = { x: clickX, y: clickY };

    const handleMinimapMouseMove = (e: MouseEvent): void => {
      if (!isDraggingMinimap.value) return;

      const minimapRect = minimapImage.value!.getBoundingClientRect();
      const currentX = e.clientX - minimapRect.left;
      const currentY = e.clientY - minimapRect.top;

      const deltaX = currentX - minimapDragStart.value.x;
      const deltaY = currentY - minimapDragStart.value.y;

      // 计算小地图中图像区域到原始图像的缩放比例
      const scaleX = info.displayWidth / minimapImageWidth;
      const scaleY = info.displayHeight / minimapImageHeight;

      // 将小地图中的移动转换为原始图像中的移动
      const deltaXInOriginal = deltaX * scaleX;
      const deltaYInOriginal = deltaY * scaleY;

      // 转换为缩放后图像中的移动
      const deltaXInScaled = deltaXInOriginal * imageScale.value;
      const deltaYInScaled = deltaYInOriginal * imageScale.value;

      // 应用移动（注意方向相反）
      imageOffset.value.x -= deltaXInScaled;
      imageOffset.value.y -= deltaYInScaled;

      // 应用边界限制
      applyDragLimits();

      minimapDragStart.value = { x: currentX, y: currentY };
      updateMinimapViewport();
    };

    const handleMinimapMouseUp = (): void => {
      isDraggingMinimap.value = false;
      enableImageTransition.value = true; // 重新启用过渡动画
      document.removeEventListener('mousemove', handleMinimapMouseMove);
      document.removeEventListener('mouseup', handleMinimapMouseUp);
    };

    document.addEventListener('mousemove', handleMinimapMouseMove);
    document.addEventListener('mouseup', handleMinimapMouseUp);

    updateMinimapViewport();
  }
};

const handleMinimapTouchStart = (event: TouchEvent): void => {
  if (event.touches.length !== 1) return;

  event.preventDefault();
  event.stopPropagation();

  if (!imageElement.value || !imageContainer.value || !minimapImage.value) return;

  const info = getImageDisplayInfo();
  if (!info) return;

  const touch = event.touches[0];
  const minimapRect = minimapImage.value.getBoundingClientRect();
  const clickX = touch.clientX - minimapRect.left;
  const clickY = touch.clientY - minimapRect.top;

  // 计算小地图中实际显示的图像区域
  const minimapAspect = minimapRect.width / minimapRect.height;
  const imageAspect = info.displayWidth / info.displayHeight;

  let minimapImageWidth, minimapImageHeight, minimapImageX, minimapImageY;
  if (imageAspect > minimapAspect) {
    minimapImageWidth = minimapRect.width;
    minimapImageHeight = minimapRect.width / imageAspect;
    minimapImageX = 0;
    minimapImageY = (minimapRect.height - minimapImageHeight) / 2;
  } else {
    minimapImageHeight = minimapRect.height;
    minimapImageWidth = minimapRect.height * imageAspect;
    minimapImageX = (minimapRect.width - minimapImageWidth) / 2;
    minimapImageY = 0;
  }

  // 检查是否点击在图像区域内
  const isClickInImage = clickX >= minimapImageX && clickX <= minimapImageX + minimapImageWidth
    && clickY >= minimapImageY && clickY <= minimapImageY + minimapImageHeight;

  if (!isClickInImage) return; // 点击在图像区域外，忽略

  // 检查是否点击在视口框内
  const viewport = viewportRect.value;
  const isClickInViewport = clickX >= viewport.x && clickX <= viewport.x + viewport.width
    && clickY >= viewport.y && clickY <= viewport.y + viewport.height;

  if (isClickInViewport) {
    // 点击在视口框内，开始拖拽视口
    enableImageTransition.value = false; // 禁用过渡动画
    isDraggingMinimap.value = true;
    minimapDragStart.value = { x: clickX, y: clickY };

    const handleMinimapTouchMove = (e: TouchEvent): void => {
      if (!isDraggingMinimap.value || e.touches.length !== 1) return;

      e.preventDefault();
      e.stopPropagation();

      const touch = e.touches[0];
      const minimapRect = minimapImage.value!.getBoundingClientRect();
      const currentX = touch.clientX - minimapRect.left;
      const currentY = touch.clientY - minimapRect.top;

      const deltaX = currentX - minimapDragStart.value.x;
      const deltaY = currentY - minimapDragStart.value.y;

      // 计算小地图中图像区域到原始图像的缩放比例
      const scaleX = info.displayWidth / minimapImageWidth;
      const scaleY = info.displayHeight / minimapImageHeight;

      // 将小地图中的移动转换为原始图像中的移动
      const deltaXInOriginal = deltaX * scaleX;
      const deltaYInOriginal = deltaY * scaleY;

      // 转换为缩放后图像中的移动
      const deltaXInScaled = deltaXInOriginal * imageScale.value;
      const deltaYInScaled = deltaYInOriginal * imageScale.value;

      // 应用移动（注意方向相反）
      imageOffset.value.x -= deltaXInScaled;
      imageOffset.value.y -= deltaYInScaled;

      // 应用边界限制
      applyDragLimits();

      minimapDragStart.value = { x: currentX, y: currentY };
      updateMinimapViewport();
    };

    const handleMinimapTouchEnd = (): void => {
      isDraggingMinimap.value = false;
      enableImageTransition.value = true; // 重新启用过渡动画
      document.removeEventListener('touchmove', handleMinimapTouchMove);
      document.removeEventListener('touchend', handleMinimapTouchEnd);
    };

    document.addEventListener('touchmove', handleMinimapTouchMove, { passive: false });
    document.addEventListener('touchend', handleMinimapTouchEnd);
  } else {
    // 点击在视口框外，直接跳转到点击位置
    // 将点击位置转换为相对于图像区域的坐标
    const clickXInImage = clickX - minimapImageX;
    const clickYInImage = clickY - minimapImageY;

    // 计算小地图中图像区域到原始图像的缩放比例
    const scaleX = info.displayWidth / minimapImageWidth;
    const scaleY = info.displayHeight / minimapImageHeight;

    // 计算点击位置在原始图像中的位置（相对于图像左上角）
    const targetXInOriginal = clickXInImage * scaleX;
    const targetYInOriginal = clickYInImage * scaleY;

    // 计算点击位置相对于原始图像中心的偏移
    const targetOffsetFromCenterX = targetXInOriginal - info.displayWidth / 2;
    const targetOffsetFromCenterY = targetYInOriginal - info.displayHeight / 2;

    // 转换为缩放后图像中相对于中心的偏移
    const targetOffsetScaledX = targetOffsetFromCenterX * imageScale.value;
    const targetOffsetScaledY = targetOffsetFromCenterY * imageScale.value;

    // 计算需要的imageOffset，使点击位置居中
    // imageOffset是相对于图像默认居中位置的偏移
    imageOffset.value = {
      x: -targetOffsetScaledX,
      y: -targetOffsetScaledY,
    };

    // 应用拖拽限制
    applyDragLimits();

    // 设置拖拽状态，允许接着拖拽
    isDraggingMinimap.value = true;
    minimapDragStart.value = { x: clickX, y: clickY };

    const handleMinimapTouchMove = (e: TouchEvent): void => {
      if (!isDraggingMinimap.value || e.touches.length !== 1) return;

      e.preventDefault();
      e.stopPropagation();

      const touch = e.touches[0];
      const minimapRect = minimapImage.value!.getBoundingClientRect();
      const currentX = touch.clientX - minimapRect.left;
      const currentY = touch.clientY - minimapRect.top;

      const deltaX = currentX - minimapDragStart.value.x;
      const deltaY = currentY - minimapDragStart.value.y;

      // 计算小地图中图像区域到原始图像的缩放比例
      const scaleX = info.displayWidth / minimapImageWidth;
      const scaleY = info.displayHeight / minimapImageHeight;

      // 将小地图中的移动转换为原始图像中的移动
      const deltaXInOriginal = deltaX * scaleX;
      const deltaYInOriginal = deltaY * scaleY;

      // 转换为缩放后图像中的移动
      const deltaXInScaled = deltaXInOriginal * imageScale.value;
      const deltaYInScaled = deltaYInOriginal * imageScale.value;

      // 应用移动（注意方向相反）
      imageOffset.value.x -= deltaXInScaled;
      imageOffset.value.y -= deltaYInScaled;

      // 应用边界限制
      applyDragLimits();

      minimapDragStart.value = { x: currentX, y: currentY };
      updateMinimapViewport();
    };

    const handleMinimapTouchEnd = (): void => {
      isDraggingMinimap.value = false;
      enableImageTransition.value = true; // 重新启用过渡动画
      document.removeEventListener('touchmove', handleMinimapTouchMove);
      document.removeEventListener('touchend', handleMinimapTouchEnd);
    };

    document.addEventListener('touchmove', handleMinimapTouchMove, { passive: false });
    document.addEventListener('touchend', handleMinimapTouchEnd);

    updateMinimapViewport();
  }
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
    timers.setTimeout(() => {
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
    case '0':
    case 'Home':
      if (!isZoomDisabled.value) {
        resetImageTransform();
      }
      break;
    case '+':
    case '=':
      if (!isZoomDisabled.value) {
        imageScale.value = Math.min(5, imageScale.value + 0.2);
        applyDragLimits();
        updateMinimapVisibility();
      }
      break;
    case '-':
      if (!isZoomDisabled.value) {
        imageScale.value = Math.max(0.5, imageScale.value - 0.2);
        applyDragLimits();
        updateMinimapVisibility();
      }
      break;
  }
};

// 缩放按钮功能
const zoomIn = (): void => {
  if (isZoomDisabled.value) return;
  imageScale.value = Math.min(5, imageScale.value + 0.2);
  applyDragLimits();
  updateMinimapVisibility();
};

const zoomOut = (): void => {
  if (isZoomDisabled.value) return;
  imageScale.value = Math.max(0.5, imageScale.value - 0.2);
  applyDragLimits();
  updateMinimapVisibility();
};

const resetZoom = (): void => {
  if (isZoomDisabled.value) return;
  resetImageTransform();
};

// 预加载相邻图片
const preloadAdjacentImages = (): void => {
  const currentIdx = currentIndex.value;
  const imagesToPreload: string[] = [];

  // 预加载前一张和后一张图片（普通优先级）
  if (currentIdx > 0 && imagesList.value[currentIdx - 1].src) {
    imagesToPreload.push(imagesList.value[currentIdx - 1].src!);
  }
  if (currentIdx < imagesList.value.length - 1 && imagesList.value[currentIdx + 1].src) {
    imagesToPreload.push(imagesList.value[currentIdx + 1].src!);
  }

  // 异步预加载相邻图片
  imagesToPreload.forEach(src => {
    imageCache.preloadImage(src, LoadPriority.OTHER_IMAGE).catch(() => {
      // 预加载失败不影响主要功能
    });
  });

  // 预加载前两张和后两张图片（低优先级）
  const lowPriorityImages: string[] = [];
  if (currentIdx > 1 && imagesList.value[currentIdx - 2].src) {
    lowPriorityImages.push(imagesList.value[currentIdx - 2].src!);
  }
  if (currentIdx < imagesList.value.length - 2 && imagesList.value[currentIdx + 2].src) {
    lowPriorityImages.push(imagesList.value[currentIdx + 2].src!);
  }

  // 低优先级预加载 - 延迟执行以确保当前图片优先
  timers.setTimeout(() => {
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
    // 重置图像变换状态
    resetImageTransform();

    // 重置图像加载状态
    isOriginalImageLoaded.value = false;

    // 只对有src的图像处理缓存
    if (newImage.src) {
      // 获取当前图片的缩略图URL
      const thumbnailSrc = getThumbnailUrl(newImage.src, 'tiny');

      // 设置当前图片，这会触发优先级重新评估
      imageCache.setCurrentImage(newImage.src, thumbnailSrc || undefined);
    }

    // 延迟触发预加载，确保当前图片优先
    nextTick(() => {
      timers.setTimeout(() => {
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
      timers.setTimeout(() => {
        transitionActive.value = true;
      }, 50);
    });
  } else {
    // 组件隐藏时的处理已移至close函数
    // 这里不需要额外处理，因为close函数会设置transitionActive.value = false
  }
}, { immediate: true });

// 检查图像宽度和高度是否能分别完全显示在当前容器中
const getImageFitStatus = (): { canFitWidth: boolean; canFitHeight: boolean } => {
  const info = getImageDisplayInfo();
  if (!info) return { canFitWidth: false, canFitHeight: false };

  // 分别检查宽度和高度是否能完全显示在容器中
  const canFitWidth = info.scaledWidth <= info.containerWidth;
  const canFitHeight = info.scaledHeight <= info.containerHeight;

  return { canFitWidth, canFitHeight };
};

// 自动居中图像（分别处理宽度和高度）
const autoCenterImage = (): void => {
  const { canFitWidth, canFitHeight } = getImageFitStatus();

  // 只有当宽度或高度能完全显示时，才对相应方向进行居中
  let needsUpdate = false;
  const newOffset = { ...imageOffset.value };

  if (canFitWidth) {
    // 如果图像宽度能完全显示，重置水平偏移量使其水平居中
    newOffset.x = 0;
    needsUpdate = true;
  }

  if (canFitHeight) {
    // 如果图像高度能完全显示，重置垂直偏移量使其垂直居中
    newOffset.y = 0;
    needsUpdate = true;
  }

  if (needsUpdate) {
    imageOffset.value = newOffset;
    // 启用过渡动画使居中更平滑
    enableImageTransition.value = true;
    timers.setTimeout(() => {
      enableImageTransition.value = false;
    }, 150);
  }
};

// resize事件防抖定时器
let resizeDebounceTimer: number | null = null;

// ResizeObserver 用于监听图像容器尺寸变化
let imageContainerResizeObserver: ResizeObserver | null = null;
let containerResizeDebounceTimer: number | null = null;

// 处理图像容器尺寸变化
const handleImageContainerResize = (): void => {
  if (containerResizeDebounceTimer !== null) {
    timers.clearTimeout(containerResizeDebounceTimer);
  }

  containerResizeDebounceTimer = timers.setTimeout(() => {
    // 立即应用拖拽限制修正，确保图像在新的容器尺寸下保持在有效范围内
    applyDragLimits();

    // 更新小地图
    updateMinimapVisibility();

    // 检查图像是否能完全显示，如果可以则自动居中
    autoCenterImage();

    containerResizeDebounceTimer = null;
  }, 16);
};

// 处理屏幕变化（移动端状态切换等）
const handleScreenChange = (wasMobile: boolean, currentIsMobile: boolean): void => {
  // 如果从移动端切换到桌面端
  if (wasMobile && !currentIsMobile) {
    // 关闭移动端覆盖层
    showMobileInfoOverlay.value = false;
    mobileInfoOverlayAnimating.value = false;
    // 根据用户对固定信息栏的偏好设置桌面端信息面板状态
    showInfoPanel.value = userInfoPanelPreference.value;
  } else if (!wasMobile && currentIsMobile) {
    // 如果从桌面端切换到移动端
    // 移动端不显示桌面端的固定信息面板
    showInfoPanel.value = false;
    // 移动端信息浮窗保持关闭状态（临时弹窗不持久化）
    showMobileInfoOverlay.value = false;
  }

  // 清除之前的防抖定时器
  if (resizeDebounceTimer !== null) {
    timers.clearTimeout(resizeDebounceTimer);
  }

  // 使用防抖处理图像相关的更新，避免频繁重新计算
  resizeDebounceTimer = timers.setTimeout(() => {
    handleResizeDebounced();
    resizeDebounceTimer = null;
  }, 150); // 150ms防抖延迟
};

// 防抖后的resize处理函数
const handleResizeDebounced = (): void => {
  // 窗口大小变化时，强制重新计算位置（忽略用户滚动状态）
  const wasUserScrolling = isUserScrolling.value;
  isUserScrolling.value = false;
  updateThumbnailsOffset();

  // 立即应用拖拽限制修正，确保图像在新的容器尺寸下保持在有效范围内
  applyDragLimits();

  // 更新小地图
  updateMinimapVisibility();

  // 检查图像是否能完全显示，如果可以则自动居中
  nextTick(() => {
    autoCenterImage();
  });

  // 如果用户之前在滚动，延迟恢复状态
  if (wasUserScrolling) {
    timers.setTimeout(() => {
      isUserScrolling.value = true;
    }, 100);
  }
};

// 屏幕变化监听器取消函数
let unsubscribeScreenChange: (() => void) | null = null;

onMounted(() => {
  // 根据设备类型和用户偏好设置初始状态
  if (isMobile.value) {
    showInfoPanel.value = false; // 移动端不显示桌面端的固定信息面板
    showMobileInfoOverlay.value = false; // 移动端信息浮窗默认关闭
  } else {
    showInfoPanel.value = userInfoPanelPreference.value; // 桌面端使用用户对固定信息栏的偏好
  }

  // 注册屏幕变化监听器
  let previousMobile = isMobile.value;
  unsubscribeScreenChange = onScreenChange((currentIsMobile) => {
    handleScreenChange(previousMobile, currentIsMobile);
    previousMobile = currentIsMobile;
  });

  window.addEventListener('keydown', handleKeyDown);

  // 设置图像容器的 ResizeObserver
  nextTick(() => {
    if (imageContainer.value && 'ResizeObserver' in window) {
      imageContainerResizeObserver = new ResizeObserver((entries) => {
        // 只有当容器尺寸确实发生变化时才处理
        for (const entry of entries) {
          if (entry.target === imageContainer.value) {
            handleImageContainerResize();
            break;
          }
        }
      });

      imageContainerResizeObserver.observe(imageContainer.value);
    }

    updateThumbnailsOffset();
  });
});

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeyDown);

  // 取消屏幕变化监听器
  if (unsubscribeScreenChange) {
    unsubscribeScreenChange();
    unsubscribeScreenChange = null;
  }

  // 清理resize防抖定时器
  if (resizeDebounceTimer !== null) {
    timers.clearTimeout(resizeDebounceTimer);
    resizeDebounceTimer = null;
  }

  // 清理容器resize防抖定时器
  if (containerResizeDebounceTimer !== null) {
    timers.clearTimeout(containerResizeDebounceTimer);
    containerResizeDebounceTimer = null;
  }

  // 清理 ResizeObserver
  if (imageContainerResizeObserver) {
    imageContainerResizeObserver.disconnect();
    imageContainerResizeObserver = null;
  }

  // 清理移动端覆盖层状态
  if (showMobileInfoOverlay.value) {
    document.body.style.overflow = '';
  }
});

// 获取信息按钮标题
const getInfoButtonTitle = (): string => {
  if (isMobile.value) {
    return showMobileInfoOverlay.value ? $t('viewer.hideInfo') : $t('viewer.showInfo');
  } else {
    return showInfoPanel.value ? $t('viewer.hideInfo') : $t('viewer.showInfo');
  }
};

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

.zoom-button {
  @apply bg-blue-800/60 hover:bg-blue-700/60;
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
  cursor: grab;
  overflow: hidden;
}

.image-container:active {
  cursor: grabbing;
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

/* 小地图样式 */
.minimap-container {
  position: absolute;
  bottom: 20px;
  right: 20px;
  width: 200px;
  height: 150px;
  background-color: rgba(0, 0, 0, 0.8);
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  z-index: 10;
  backdrop-filter: blur(4px);
  transition: all 0.2s ease;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.minimap-container:hover {
  border-color: rgba(255, 255, 255, 0.5);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.4);
}

.minimap-image-container {
  position: relative;
  width: 100%;
  height: 100%;
}

.minimap-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
  opacity: 0.7;
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  -webkit-user-drag: none;
  -webkit-touch-callout: none;
  transition: opacity 0.2s ease;
}

.minimap-image-border {
  position: absolute;
  border: 1px solid rgba(255, 255, 255, 0.2);
  pointer-events: none;
  transition: border-color 0.2s ease;
}

.minimap-viewport {
  position: absolute;
  border: 2px solid #3b82f6;
  background-color: rgba(59, 130, 246, 0.2);
  pointer-events: auto;
  box-shadow: 0 0 8px rgba(59, 130, 246, 0.4);
  cursor: move;
}

.minimap-container:hover .minimap-image {
  opacity: 0.9;
}

.minimap-container:hover .minimap-image-border {
  border-color: rgba(255, 255, 255, 0.4);
}

.minimap-container:hover .minimap-viewport {
  border-color: #60a5fa;
  background-color: rgba(96, 165, 250, 0.3);
  box-shadow: 0 0 12px rgba(96, 165, 250, 0.5);
}

/* 拖拽时保持视口框样式稳定，避免hover效果影响 */
.minimap-container.dragging .minimap-viewport {
  border-color: #3b82f6 !important;
  background-color: rgba(59, 130, 246, 0.2) !important;
  box-shadow: 0 0 8px rgba(59, 130, 246, 0.4) !important;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .minimap-container {
    width: 150px;
    height: 112px;
    bottom: 15px;
    right: 15px;
  }
}

@media (max-width: 480px) {
  .minimap-container {
    width: 120px;
    height: 90px;
    bottom: 10px;
    right: 10px;
  }
}

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

/* 移动端信息覆盖层样式 */
.mobile-info-overlay {
  position: fixed;
  inset: 0;
  z-index: 60;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  touch-action: none;
}

.mobile-info-panel {
  width: 100%;
  max-height: 70vh;
  background-color: rgba(0, 0, 0, 0.95);
  border-radius: 1rem 1rem 0 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.mobile-info-header {
  @apply flex items-center justify-between;
  @apply py-4 px-6;
  @apply border-b border-gray-600;
  flex-shrink: 0;
}

.mobile-info-title {
  @apply text-white text-lg font-semibold;
}

.mobile-info-close {
  @apply p-2 rounded-full;
  @apply text-gray-300 hover:text-white;
  @apply bg-gray-700/60 hover:bg-gray-600/60;
  @apply transition-colors duration-200;
}

.mobile-info-content {
  @apply flex-1 overflow-y-auto;
  @apply p-6;
  @apply text-white;
  user-select: text;
  -webkit-user-select: text;
  -moz-user-select: text;
  -ms-user-select: text;
}

/* 移动端覆盖层动画 */
.mobile-overlay-fade-enter-active,
.mobile-overlay-fade-leave-active {
  transition: opacity 0.3s ease;
}

.mobile-overlay-fade-enter-from,
.mobile-overlay-fade-leave-to {
  opacity: 0;
}

.mobile-info-slide-enter-active,
.mobile-info-slide-leave-active {
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.mobile-info-slide-enter-from,
.mobile-info-slide-leave-to {
  transform: translateY(100%);
}

/* 图像组选择器 */
.group-selector {
  position: fixed;
  top: 60px;
  right: 20px;
  bottom: 100px;
  width: 200px;
  @apply bg-gray-900/95 backdrop-blur-sm rounded-lg shadow-2xl;
  @apply text-white;
  @apply flex flex-col;
  z-index: 50;
  overflow: hidden;
}

.group-selector-header {
  @apply px-4 py-3 border-b border-gray-700/50;
}

.group-title {
  @apply text-sm font-medium text-gray-200 m-0;
}

.group-images-list {
  @apply flex-1 overflow-y-auto p-2;
  @apply space-y-2;
}

.group-image-button {
  @apply w-full flex items-center p-2 rounded-lg;
  @apply bg-transparent hover:bg-gray-800/60;
  @apply transition-colors duration-200;
  @apply border border-transparent;
  @apply cursor-pointer;
}

.group-image-button.active {
  @apply bg-blue-600/30 border-blue-500/50;
}

.group-image-thumbnail {
  @apply w-12 h-12 rounded object-cover flex-shrink-0;
}

.group-image-info {
  @apply ml-3 flex-1 text-left overflow-hidden;
}

.group-image-name {
  @apply text-sm text-gray-200 block truncate;
}

/* 组选择器进入动画 */
.slide-in-right-enter-active,
.slide-in-right-leave-active {
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease;
}

.slide-in-right-enter-from,
.slide-in-right-leave-to {
  transform: translateX(100%);
  opacity: 0;
}

/* 移动端适配 */
@media (max-width: 768px) {
  .group-selector {
    top: 50px;
    right: 10px;
    bottom: 80px;
    width: 160px;
  }
  
  .group-image-thumbnail {
    @apply w-10 h-10;
  }
  
  .group-image-name {
    @apply text-xs;
  }
}

/* 确保移动端覆盖层在小屏幕上正确显示 */
@media (max-width: 768px) {
  .mobile-info-panel {
    max-height: 80vh;
  }

  .mobile-info-content {
    @apply p-4;
  }

  .mobile-info-header {
    @apply py-3 px-4;
  }
}

/* Image placeholders */
.no-image-display {
  @apply w-full h-full flex items-center justify-center;
  @apply bg-gray-900/50;
  @apply text-gray-400;
}

.no-image-content {
  @apply text-center;
}

.no-image-icon {
  @apply w-16 h-16 mx-auto mb-4;
}

.no-image-text {
  @apply text-lg;
}

.group-image-placeholder,
.thumbnail-placeholder {
  @apply w-full h-full flex items-center justify-center;
  @apply bg-gray-700/50 text-gray-500;
}

.group-image-placeholder .placeholder-icon,
.thumbnail-placeholder .placeholder-icon {
  @apply w-6 h-6;
}

</style>
