<template>
  <div v-if="config.enabled && config.tracks.length > 0" class="bgm-player">
    <div
      class="bgm-player-container"
      :class="{ 'expanded': isExpanded, 'playing': isPlaying }"
      :style="pulseStyle"
    >
      <Transition name="bgm-morph" mode="out-in">
        <!-- 折叠状态：悬浮圆形玻璃按钮 -->
        <button
          v-if="!isExpanded"
          key="collapsed"
          type="button"
          class="bgm-toggle-btn"
          :title="t('bgm.expand')"
          :aria-label="t('bgm.expand')"
          @click="toggleExpand"
        >
          <i class="fas fa-music" aria-hidden="true"></i>
        </button>

        <!-- 展开状态：磨砂玻璃完整播放器 -->
        <div v-else key="expanded" class="bgm-player-expanded">
          <!-- 顶部：封面、曲目信息和收起按钮 -->
          <div class="bgm-header">
            <div
              class="bgm-artwork"
              :class="{
                'bgm-artwork-placeholder': !currentTrack?.artwork?.length,
                'bgm-artwork-clickable': !!currentTrack?.artwork?.length,
              }"
              @click="openArtworkViewer"
            >
              <img
                v-if="currentTrack?.artwork?.length"
                :src="getI18nText(currentTrack.artwork[0].src, currentLanguage)"
                :alt="t('bgm.cover')"
                class="bgm-artwork-img"
              />
              <i v-else class="fas fa-music" aria-hidden="true"></i>
            </div>

            <div class="bgm-track-info">
              <div ref="trackNameRef" class="bgm-track-name scrolling-text">
                <span class="scrolling-text-content">{{ getTrackName(currentTrack) }}</span>
              </div>
              <div v-if="getTrackArtist(currentTrack)" ref="trackArtistRef" class="bgm-track-artist scrolling-text">
                <span class="scrolling-text-content">{{ getTrackArtist(currentTrack) }}</span>
              </div>
              <div v-if="getTrackAlbum(currentTrack)" ref="trackAlbumRef" class="bgm-track-album scrolling-text">
                <span class="scrolling-text-content">{{ getTrackAlbum(currentTrack) }}</span>
              </div>
              <div class="bgm-time-display">
                {{ formatTime(currentTime) }} / {{ formatTime(duration) }}
              </div>
            </div>

            <div class="bgm-header-controls">
              <button
                type="button"
                class="bgm-icon-btn"
                :title="t('bgm.collapse')"
                :aria-label="t('bgm.collapse')"
                @click="toggleExpand"
              >
                <i class="fas fa-chevron-down" aria-hidden="true"></i>
              </button>
            </div>
          </div>

          <!-- 支持点击与拖拽的进度条 -->
          <div
            ref="progressBarRef"
            class="bgm-progress-bar"
            :class="{ 'is-dragging': isScrubbing }"
            role="slider"
            tabindex="0"
            :aria-valuemin="0"
            :aria-valuemax="Math.round(duration)"
            :aria-valuenow="Math.round(currentTime)"
            @pointerdown="handleProgressPointerDown"
            @pointermove="handleProgressPointerMove"
            @pointerup="handleProgressPointerUp"
            @pointercancel="handleProgressPointerUp"
          >
            <div class="bgm-progress-track">
              <div
                v-if="(currentTrack?.loop || currentTrack?.dualFile) && duration > 0"
                class="bgm-loop-indicator"
                :style="getLoopIndicatorStyle()"
              ></div>
              <div class="bgm-progress-fill" :style="{ width: `${progressPercent}%` }">
                <span class="bgm-progress-thumb" aria-hidden="true"></span>
              </div>
            </div>
          </div>

          <!-- 播放控制与音量 -->
          <div class="bgm-controls">
            <div class="bgm-controls-primary">
              <button
                type="button"
                class="bgm-control-btn"
                :title="t('bgm.previous')"
                :aria-label="t('bgm.previous')"
                @click="playPrevious"
              >
                <i class="fas fa-step-backward" aria-hidden="true"></i>
              </button>

              <button
                type="button"
                class="bgm-play-btn"
                :title="isPlaying ? t('bgm.pause') : t('bgm.play')"
                :aria-label="isPlaying ? t('bgm.pause') : t('bgm.play')"
                @click="togglePlay"
              >
                <i :class="isPlaying ? 'fas fa-pause' : 'fas fa-play'" aria-hidden="true"></i>
              </button>

              <button
                type="button"
                class="bgm-control-btn"
                :title="t('bgm.next')"
                :aria-label="t('bgm.next')"
                @click="playNext"
              >
                <i class="fas fa-step-forward" aria-hidden="true"></i>
              </button>

              <button
                type="button"
                class="bgm-control-btn"
                :title="getModeTitle()"
                :aria-label="getModeTitle()"
                @click="toggleMode"
              >
                <i :class="getModeIcon()" aria-hidden="true"></i>
              </button>

              <button
                v-if="currentTrack?.loop || currentTrack?.dualFile"
                type="button"
                class="bgm-control-btn"
                :class="{ 'active-dim': useLoop }"
                :title="useLoop ? t('bgm.disableLoop') : t('bgm.enableLoop')"
                :aria-label="useLoop ? t('bgm.disableLoop') : t('bgm.enableLoop')"
                @click="toggleUseLoop"
              >
                <i class="fas fa-sync-alt" aria-hidden="true"></i>
              </button>

              <button
                type="button"
                class="bgm-control-btn"
                :class="{ 'active-dim': autoplayEnabled }"
                :title="autoplayEnabled ? t('bgm.disableAutoplay') : t('bgm.enableAutoplay')"
                :aria-label="autoplayEnabled ? t('bgm.disableAutoplay') : t('bgm.enableAutoplay')"
                @click="toggleAutoplay"
              >
                <i class="fas fa-power-off" aria-hidden="true"></i>
              </button>
            </div>

            <div class="bgm-volume">
              <i class="fas fa-volume-up" aria-hidden="true"></i>
              <input
                type="range"
                min="0"
                max="100"
                :value="volume * 100"
                class="bgm-volume-slider"
                :title="t('bgm.volume', { value: Math.round(volume * 100) })"
                :aria-label="t('bgm.volume', { value: Math.round(volume * 100) })"
                @input="handleVolumeChange"
              />
            </div>
          </div>

          <!-- 播放列表折叠面板（CSS Grid 平滑折叠） -->
          <div v-if="config.tracks.length > 0" class="bgm-playlist-wrapper" :class="{ 'open': isPlaylistExpanded }">
            <button
              type="button"
              class="bgm-playlist-toggle"
              :class="{ 'open': isPlaylistExpanded }"
              :aria-expanded="isPlaylistExpanded"
              @click="togglePlaylist"
            >
              <i class="fas fa-list" aria-hidden="true"></i>
              <span>{{ t('bgm.playlist') }} ({{ config.tracks.length }})</span>
              <i class="fas fa-chevron-down bgm-playlist-toggle-chevron" aria-hidden="true"></i>
            </button>

            <div class="bgm-playlist-collapse" :class="{ 'open': isPlaylistExpanded }">
              <div class="bgm-playlist-collapse-inner">
                <div class="bgm-playlist">
                  <button
                    v-for="(track, index) in config.tracks"
                    :key="index"
                    type="button"
                    class="bgm-playlist-item"
                    :class="{ 'active': index === currentTrackIndex }"
                    @click="playTrack(index)"
                  >
                    <i
                      :class="index === currentTrackIndex && isPlaying ? 'fas fa-volume-up' : 'fas fa-music'"
                      aria-hidden="true"
                    ></i>
                    <span class="track-info">
                      <span class="track-name scrolling-text">
                        <span class="scrolling-text-content">{{ getTrackName(track) }}</span>
                      </span>
                      <span v-if="getTrackArtist(track)" class="track-artist scrolling-text">
                        <span class="scrolling-text-content">{{ getTrackArtist(track) }}</span>
                      </span>
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, defineAsyncComponent, onMounted, onUnmounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

import { useBgmPlayerCustom } from '@/composables/useBgmPlayerCustom';
import { useModalManager } from '@/composables/useModalManager';
import { useTimers } from '@/composables/useTimers';
import bgmConfig from '@/config/bgm.json5';
import { useLanguageStore } from '@/stores/language';
import type { BgmConfig, BgmTrack } from '@/types/bgm';
import { getI18nText } from '@/utils/i18nText';

const config = bgmConfig as BgmConfig;
const ImageViewerModal = defineAsyncComponent(() => import('@/components/modals/ImageViewerModal.vue'));
const isExpanded = ref(false);
const isPlaylistExpanded = ref(false);
const isScrubbing = ref(false);
const currentTime = ref(0);
const duration = ref(0);
const progressPercent = ref(0);
const audioIntensity = ref(0);

const { t } = useI18n();
const languageStore = useLanguageStore();
const currentLanguage = computed(() => languageStore.currentLanguage);
const modalManager = useModalManager();

const {
  setTimeout,
  clearTimeout,
  setInterval,
  clearInterval,
  requestAnimationFrame,
  cancelAnimationFrame,
} = useTimers();
let progressInterval: number | null = null;
let intensityAnimationId: number | null = null;
let scrollingTextTimeoutId: number | null = null;

const progressBarRef = ref<HTMLElement | null>(null);
const trackNameRef = ref<HTMLElement | null>(null);
const trackArtistRef = ref<HTMLElement | null>(null);
const trackAlbumRef = ref<HTMLElement | null>(null);

const getScrollingTextContent = (element: HTMLElement | null): HTMLElement | null => {
  if (!element) return null;
  return element.querySelector<HTMLElement>('.scrolling-text-content');
};

const updateScrollingTextElement = (element: HTMLElement | null, text: string): void => {
  const content = getScrollingTextContent(element);
  if (!element || !content) return;

  element.classList.remove('overflow');
  content.textContent = text;

  if (content.scrollWidth > element.clientWidth) {
    element.classList.add('overflow');
    content.textContent = `${text}   ${text}`;
  }
};

const updateScrollingText = (): void => {
  updateScrollingTextElement(trackNameRef.value, getTrackName(currentTrack.value));
  updateScrollingTextElement(trackArtistRef.value, getTrackArtist(currentTrack.value));
  updateScrollingTextElement(trackAlbumRef.value, getTrackAlbum(currentTrack.value));
};

const clearScrollingTextUpdate = (): void => {
  if (scrollingTextTimeoutId === null) {
    return;
  }

  clearTimeout(scrollingTextTimeoutId);
  scrollingTextTimeoutId = null;
};

const scheduleScrollingTextUpdate = (delay: number): void => {
  clearScrollingTextUpdate();
  scrollingTextTimeoutId = setTimeout(() => {
    updateScrollingText();
    scrollingTextTimeoutId = null;
  }, delay);
};

const {
  currentTrack,
  currentTrackIndex,
  isPlaying,
  volume,
  currentMode,
  autoplayEnabled,
  useLoop,
  playTrack,
  playNext,
  playPrevious,
  togglePlay,
  toggleMode,
  toggleAutoplay,
  toggleUseLoop,
  setVolume,
  init,
  getCurrentTime,
  getDuration,
  getIntroDuration,
  getLoopDuration,
  seek,
  getFrequencyData,
} = useBgmPlayerCustom(config);

const pulseStyle = computed(() => {
  if (!isPlaying.value) return {};

  const scaleMultiplier = isExpanded.value ? 0.06 : 0.36;
  const scale = 1 + (audioIntensity.value * scaleMultiplier);
  const opacity = 0.28 + (audioIntensity.value * 0.45);
  const borderColor = `rgba(14, 165, 233, ${(0.45 + audioIntensity.value * 0.5).toFixed(2)})`;

  return {
    '--pulse-scale': scale.toString(),
    '--pulse-opacity': opacity.toString(),
    '--pulse-border-color': borderColor,
  };
});

const toggleExpand = (): void => {
  isExpanded.value = !isExpanded.value;
};

const openArtworkViewer = (): void => {
  const artwork = currentTrack.value?.artwork;
  if (!artwork?.length) return;
  modalManager.open({
    id: `bgm-artwork-viewer-${Date.now()}`,
    component: ImageViewerModal,
    props: {
      externalImage: {
        url: artwork[0].src,
        name: currentTrack.value?.name ?? '',
      },
      imageList: [],
      viewerUIConfig: {
        imageList: false,
        imageGroupList: false,
        viewerTitle: true,
        infoPanel: {
          title: false,
          description: false,
          artist: false,
          date: false,
          tags: false,
        },
        commentsButton: false,
      },
    },
    options: {
      fullscreen: true,
      closable: true,
      maskClosable: true,
      escClosable: true,
      destroyOnClose: true,
    },
  });
};

const togglePlaylist = (): void => {
  isPlaylistExpanded.value = !isPlaylistExpanded.value;
};

const handleVolumeChange = (event: Event): void => {
  const target = event.target as HTMLInputElement;
  setVolume(parseInt(target.value, 10) / 100);
};

const formatTime = (seconds: number): string => {
  if (!isFinite(seconds) || seconds < 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const getModeIcon = (): string => {
  switch (currentMode.value) {
    case 'single-loop':
      return 'fas fa-1';
    case 'list-order':
      return 'fas fa-repeat';
    case 'list-shuffle':
      return 'fas fa-random';
    default:
      return 'fas fa-list';
  }
};

const getModeTitle = (): string => {
  switch (currentMode.value) {
    case 'single-loop':
      return t('bgm.mode.singleLoop');
    case 'list-order':
      return t('bgm.mode.listOrder');
    case 'list-shuffle':
      return t('bgm.mode.listShuffle');
    default:
      return t('bgm.mode.default');
  }
};

const getTrackName = (track: BgmTrack | null): string => {
  if (!track) return t('bgm.noTrack');
  return getI18nText(track.name, currentLanguage.value);
};

const getTrackArtist = (track: BgmTrack | null): string => {
  if (!track?.artist) return '';
  return getI18nText(track.artist, currentLanguage.value);
};

const getTrackAlbum = (track: BgmTrack | null): string => {
  if (!track?.album) return '';
  return getI18nText(track.album, currentLanguage.value);
};

const updateProgress = (): void => {
  if (isScrubbing.value) return;

  const time = getCurrentTime();
  const dur = getDuration();

  currentTime.value = time;
  duration.value = dur;

  if (dur > 0) {
    progressPercent.value = Math.min(100, Math.max(0, (time / dur) * 100));
  } else {
    progressPercent.value = 0;
  }
};

const seekFromPointer = (clientX: number): void => {
  const bar = progressBarRef.value;
  if (!bar || duration.value <= 0) return;

  const rect = bar.getBoundingClientRect();
  if (rect.width <= 0) return;

  const percent = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
  const newTime = percent * duration.value;
  progressPercent.value = percent * 100;
  currentTime.value = newTime;
  seek(newTime);
};

const handleProgressPointerDown = (event: PointerEvent): void => {
  const target = event.currentTarget as HTMLElement | null;
  target?.setPointerCapture?.(event.pointerId);
  isScrubbing.value = true;
  seekFromPointer(event.clientX);
};

const handleProgressPointerMove = (event: PointerEvent): void => {
  if (!isScrubbing.value) return;
  seekFromPointer(event.clientX);
};

const handleProgressPointerUp = (event: PointerEvent): void => {
  if (!isScrubbing.value) return;
  const target = event.currentTarget as HTMLElement | null;
  if (target?.hasPointerCapture?.(event.pointerId)) {
    target.releasePointerCapture(event.pointerId);
  }
  isScrubbing.value = false;
  updateProgress();
};

const getLoopIndicatorStyle = (): Record<string, string> => {
  if (duration.value <= 0) return {};

  const track = currentTrack.value;
  if (!track) return {};

  if (track.dualFile) {
    const introDuration = getIntroDuration();
    const loopDuration = getLoopDuration();

    if (introDuration <= 0 || loopDuration <= 0) return {};

    const startPercent = (introDuration / duration.value) * 100;
    const widthPercent = (loopDuration / duration.value) * 100;

    return {
      left: `${startPercent}%`,
      width: `${widthPercent}%`,
    };
  }

  if (track.loop) {
    const { start, end } = track.loop;
    const startPercent = (start / duration.value) * 100;
    const widthPercent = ((end - start) / duration.value) * 100;

    return {
      left: `${startPercent}%`,
      width: `${widthPercent}%`,
    };
  }

  return {};
};

const updateAudioIntensity = (): void => {
  if (!isPlaying.value) {
    audioIntensity.value = 0;
    return;
  }

  const frequencyData = getFrequencyData();
  if (frequencyData.length === 0) {
    audioIntensity.value = 0;
    intensityAnimationId = requestAnimationFrame(updateAudioIntensity);
    return;
  }

  let sum = 0;
  for (let i = 0; i < frequencyData.length; i++) {
    sum += frequencyData[i];
  }
  const average = sum / frequencyData.length;
  audioIntensity.value = average / 255;

  intensityAnimationId = requestAnimationFrame(updateAudioIntensity);
};

const clearProgressUpdate = (): void => {
  if (progressInterval === null) {
    return;
  }

  clearInterval(progressInterval);
  progressInterval = null;
};

const clearIntensityAnimation = (): void => {
  if (intensityAnimationId === null) {
    return;
  }

  cancelAnimationFrame(intensityAnimationId);
  intensityAnimationId = null;
};

watch(isPlaying, (playing) => {
  if (playing) {
    clearProgressUpdate();
    progressInterval = setInterval(() => {
      updateProgress();
    }, 100);

    clearIntensityAnimation();
    updateAudioIntensity();
  } else {
    clearProgressUpdate();
    clearIntensityAnimation();
    audioIntensity.value = 0;
  }
});

watch([currentTrack, currentLanguage], () => {
  scheduleScrollingTextUpdate(100);
});

watch(isExpanded, (expanded) => {
  if (expanded) {
    scheduleScrollingTextUpdate(200);
  }
});

onMounted(() => {
  init();
  scheduleScrollingTextUpdate(200);
});

onUnmounted(() => {
  clearProgressUpdate();
  clearIntensityAnimation();
  clearScrollingTextUpdate();
});
</script>

<style scoped>
@reference "@/assets/styles/main.css";

.bgm-player {
  position: fixed;
  bottom: 48px;
  left: 16px;
  z-index: 50;
}

.bgm-player-container {
  position: relative;
}

.bgm-player-container::before {
  content: '';
  position: absolute;
  inset: -4px;
  border: 2px solid var(--pulse-border-color, var(--accent-primary));
  opacity: 0;
  transform: scale(1);
  transition: transform 0.2s ease-out, opacity 0.2s ease-out, border-radius 0.22s ease;
  pointer-events: none;
}

.bgm-player-container.playing::before {
  opacity: var(--pulse-opacity, 0.55);
  transform: scale(var(--pulse-scale, 1));
}

.bgm-player-container:not(.expanded)::before {
  border-radius: 50%;
}

.bgm-player-container.expanded::before {
  border-radius: calc(var(--radius-card) + 3px);
}

.bgm-toggle-btn {
  width: 46px;
  height: 46px;
  border-radius: 9999px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: var(--accent-primary);
  color: #ffffff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 17px;
  box-shadow: var(--shadow-accent);
  transition: transform 0.2s var(--ease-out-expo), background-color 0.18s ease, box-shadow 0.2s ease;
}

.bgm-toggle-btn:hover {
  transform: scale(1.06);
  background: var(--accent-primary-hover);
}

.bgm-toggle-btn:active {
  transform: scale(0.95);
}

.bgm-toggle-btn:focus-visible {
  outline: 2px solid var(--accent-primary);
  outline-offset: 3px;
}

.bgm-player-expanded {
  width: min(392px, calc(100vw - 32px));
  background: var(--surface-elevated);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-lg);
  padding: 0.9rem;
  transform-origin: bottom left;
}

/* Smooth Morph Transition */
.bgm-morph-enter-active {
  transition: opacity 0.2s var(--ease-out-expo), transform 0.22s var(--ease-out-expo);
}

.bgm-morph-leave-active {
  transition: opacity 0.14s ease-in, transform 0.14s ease-in;
}

.bgm-morph-enter-from,
.bgm-morph-leave-to {
  opacity: 0;
  transform: scale(0.92) translateY(8px);
}

.bgm-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 0.75rem;
  gap: 0.75rem;
}

.bgm-artwork {
  flex-shrink: 0;
  width: 48px;
  height: 48px;
  border-radius: 0.625rem;
  overflow: hidden;
  border: 1px solid var(--border-subtle);
  box-shadow: var(--shadow-xs);
}

.bgm-artwork-clickable {
  cursor: pointer;
  transition: opacity 0.18s ease, transform 0.2s var(--ease-out-expo);
}

.bgm-artwork-clickable:hover {
  opacity: 0.9;
  transform: scale(1.04);
}

.bgm-artwork-placeholder {
  background: var(--accent-soft);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--accent-primary);
  font-size: 18px;
}

.bgm-artwork-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.bgm-track-info {
  flex: 1;
  min-width: 0;
}

.bgm-track-name {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 2px;
  line-height: 1.35;
}

.scrolling-text {
  position: relative;
  overflow: hidden;
  white-space: nowrap;
}

.scrolling-text-content {
  display: inline-block;
}

.scrolling-text.overflow {
  mask-image: linear-gradient(to right, transparent 0%, black 6%, black 94%, transparent 100%);
  -webkit-mask-image: linear-gradient(to right, transparent 0%, black 6%, black 94%, transparent 100%);
}

.scrolling-text.overflow .scrolling-text-content {
  animation: scroll-text 16s linear infinite;
}

@keyframes scroll-text {
  0% {
    transform: translateX(0);
  }
  100% {
    transform: translateX(-50%);
  }
}

.scrolling-text.overflow:hover .scrolling-text-content {
  animation-play-state: paused;
}

.bgm-track-artist {
  font-size: 0.75rem;
  color: var(--accent-primary-hover);
  margin-bottom: 1px;
  line-height: 1.3;
}

.dark .bgm-track-artist {
  color: var(--accent-primary);
}

.bgm-track-album {
  font-size: 0.7rem;
  color: var(--text-muted);
  margin-bottom: 2px;
  line-height: 1.3;
}

.bgm-time-display {
  font-size: 0.7rem;
  font-variant-numeric: tabular-nums;
  color: var(--text-muted);
}

.bgm-header-controls {
  display: flex;
  gap: 0.35rem;
  flex-shrink: 0;
}

.bgm-icon-btn {
  width: 28px;
  height: 28px;
  border-radius: 0.5rem;
  border: 1px solid var(--border-subtle);
  background: var(--surface-muted);
  color: var(--text-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  transition: background-color 0.16s ease, color 0.16s ease;
}

.bgm-icon-btn:hover {
  background: var(--surface-muted-hover);
  color: var(--accent-primary);
}

/* Interactive Draggable Progress Bar */
.bgm-progress-bar {
  padding: 6px 0;
  margin-bottom: 0.5rem;
  cursor: pointer;
  touch-action: none;
}

.bgm-progress-track {
  position: relative;
  height: 6px;
  background: var(--surface-muted);
  border-radius: 9999px;
}

.bgm-loop-indicator {
  position: absolute;
  top: 0;
  height: 100%;
  background: var(--accent-soft);
  border-left: 2px solid var(--accent-primary);
  border-right: 2px solid var(--accent-primary);
  pointer-events: none;
  z-index: 1;
}

.bgm-progress-fill {
  position: relative;
  height: 100%;
  background: var(--accent-primary);
  border-radius: 9999px;
  z-index: 2;
}

.bgm-progress-thumb {
  position: absolute;
  right: -5px;
  top: 50%;
  width: 11px;
  height: 11px;
  border-radius: 9999px;
  background: var(--surface-card-solid);
  border: 2px solid var(--accent-primary);
  box-shadow: var(--shadow-xs);
  transform: translateY(-50%) scale(0);
  transition: transform 0.16s var(--ease-spring);
}

.bgm-progress-bar:hover .bgm-progress-thumb,
.bgm-progress-bar.is-dragging .bgm-progress-thumb {
  transform: translateY(-50%) scale(1);
}

/* Controls Layout */
.bgm-controls {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  margin-bottom: 0.65rem;
}

.bgm-controls-primary {
  display: flex;
  align-items: center;
  gap: 0.375rem;
}

.bgm-control-btn {
  width: 32px;
  height: 32px;
  border-radius: 9999px;
  border: 1px solid transparent;
  background: var(--surface-muted);
  color: var(--text-secondary);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  transition: background-color 0.16s ease, color 0.16s ease, transform 0.16s var(--ease-out-expo);
  flex-shrink: 0;
}

.bgm-control-btn:hover {
  background: var(--surface-muted-hover);
  color: var(--text-primary);
  transform: scale(1.05);
}

.bgm-control-btn.active-dim {
  background: var(--accent-soft);
  color: var(--accent-primary-hover);
  border-color: rgba(14, 165, 233, 0.28);
}

.dark .bgm-control-btn.active-dim {
  color: var(--accent-primary);
}

.bgm-play-btn {
  width: 38px;
  height: 38px;
  border-radius: 9999px;
  border: none;
  background: var(--accent-primary);
  color: #ffffff;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  box-shadow: var(--shadow-accent);
  transition: transform 0.18s var(--ease-out-expo), background-color 0.16s ease;
  flex-shrink: 0;
}

.bgm-play-btn:hover {
  transform: scale(1.05);
  background: var(--accent-primary-hover);
}

.bgm-play-btn:active {
  transform: scale(0.95);
}

.bgm-volume {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  flex: 1 1 92px;
  min-width: 84px;
}

.bgm-volume i {
  color: var(--text-muted);
  font-size: 13px;
  flex-shrink: 0;
}

.bgm-volume-slider {
  flex: 1;
  min-width: 52px;
  height: 4px;
  border-radius: 9999px;
  outline: none;
  -webkit-appearance: none;
  appearance: none;
  background: var(--surface-muted-hover);
  cursor: pointer;
}

.bgm-volume-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: var(--accent-primary);
  cursor: pointer;
  transition: transform 0.16s ease;
}

.bgm-volume-slider::-webkit-slider-thumb:hover {
  transform: scale(1.2);
}

.bgm-volume-slider::-moz-range-thumb {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: var(--accent-primary);
  cursor: pointer;
  border: none;
}

/* Playlist */
.bgm-playlist-wrapper {
  border-radius: var(--radius-control);
  overflow: hidden;
  border: 1px solid var(--border-subtle);
  transition: border-color 0.18s ease;
}

.bgm-playlist-wrapper.open {
  border-color: rgba(14, 165, 233, 0.32);
}

.bgm-playlist-toggle {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  width: 100%;
  padding: 0.45rem 0.65rem;
  border: none;
  background: var(--surface-muted);
  color: var(--text-secondary);
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.16s ease, color 0.16s ease;
}

.bgm-playlist-toggle:hover,
.bgm-playlist-toggle.open {
  background: var(--accent-soft);
  color: var(--accent-primary-hover);
}

.dark .bgm-playlist-toggle:hover,
.dark .bgm-playlist-toggle.open {
  color: var(--accent-primary);
}

.bgm-playlist-toggle span {
  flex: 1;
  text-align: left;
}

.bgm-playlist-toggle-chevron {
  transition: transform 0.22s var(--ease-out-expo);
  font-size: 11px;
}

.bgm-playlist-toggle.open .bgm-playlist-toggle-chevron {
  transform: rotate(180deg);
}

.bgm-playlist-collapse {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows 0.24s var(--ease-out-expo);
}

.bgm-playlist-collapse.open {
  grid-template-rows: 1fr;
}

.bgm-playlist-collapse-inner {
  overflow: hidden;
}

.bgm-playlist {
  max-height: 152px;
  overflow-y: auto;
  border-top: 1px solid var(--border-subtle);
  padding: 0.25rem;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.bgm-playlist-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
  padding: 0.45rem 0.55rem;
  border: none;
  border-radius: 0.5rem;
  background: transparent;
  cursor: pointer;
  text-align: left;
  color: var(--text-secondary);
  font-size: 0.78rem;
  transition: background-color 0.15s ease, color 0.15s ease;
}

.bgm-playlist-item:hover {
  background: var(--surface-muted);
  color: var(--text-primary);
}

.bgm-playlist-item.active {
  background: var(--accent-soft);
  color: var(--accent-primary-hover);
  font-weight: 600;
}

.dark .bgm-playlist-item.active {
  color: var(--accent-primary);
}

.bgm-playlist-item i:first-child {
  font-size: 11px;
  flex-shrink: 0;
}

.bgm-playlist-item .track-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.bgm-playlist-item .track-name {
  line-height: 1.35;
}

.bgm-playlist-item .track-artist {
  font-size: 0.68rem;
  opacity: 0.72;
  line-height: 1.25;
}

@media (max-width: 767px) {
  .bgm-player {
    bottom: 42px;
    left: 12px;
  }

  .bgm-toggle-btn {
    width: 42px;
    height: 42px;
    font-size: 15px;
  }

  .bgm-player-expanded {
    width: min(350px, calc(100vw - 24px));
    padding: 0.75rem;
  }
}
</style>
