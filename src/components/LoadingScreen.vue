<template>
  <div
    class="loading-screen"
    :class="{ 'fade-out': fadeOut, 'is-embedded': !fullscreen }"
    role="status"
    aria-live="polite"
    :aria-label="t('loading.title')"
  >
    <div class="loading-backdrop" aria-hidden="true"></div>

    <div class="loading-card">
      <div class="loading-emblem" aria-hidden="true">
        <div class="emblem-ring"></div>
        <img
          v-if="siteConfig.personal.avatar"
          :src="siteConfig.personal.avatar"
          alt=""
          class="emblem-avatar"
        />
        <div v-else class="emblem-core"></div>
      </div>

      <div class="loading-progress">
        <div class="progress-track">
          <div class="progress-fill" :style="{ width: `${progress}%` }"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

import { useTimers } from '@/composables/useTimers';
import { siteConfig } from '@/config/site';
import { lockBodyScroll, unlockBodyScroll } from '@/utils/bodyScrollLock';

const props = withDefaults(defineProps<{
  onComplete?: () => void;
  fullscreen?: boolean;
  ready?: boolean;
}>(), {
  fullscreen: true,
  onComplete: undefined,
  ready: true,
});

const emit = defineEmits<{
  complete: [];
}>();

const { t } = useI18n();
const fadeOut = ref(false);
const progress = ref(12);
const animationFrameId = ref<number | null>(null);
const { setTimeout, requestAnimationFrame, cancelAnimationFrame } = useTimers();
const loadingScreenScrollLockId = 'loading-screen';

const MIN_VISIBLE_MS = 260;
const FADE_OUT_MS = 240;
let mountedAt = 0;
let isFinishing = false;

const finishLoading = (): void => {
  if (isFinishing) return;
  isFinishing = true;

  if (animationFrameId.value !== null) {
    cancelAnimationFrame(animationFrameId.value);
    animationFrameId.value = null;
  }

  progress.value = 100;

  const elapsed = Date.now() - mountedAt;
  const remaining = Math.max(0, MIN_VISIBLE_MS - elapsed);

  setTimeout(() => {
    fadeOut.value = true;
    setTimeout(() => {
      emit('complete');
      props.onComplete?.();
    }, FADE_OUT_MS);
  }, remaining);
};

const tickProgress = (): void => {
  if (isFinishing) return;

  const elapsed = Date.now() - mountedAt;
  if (props.ready && elapsed >= MIN_VISIBLE_MS * 0.7) {
    finishLoading();
    return;
  }

  // Smooth ease-out curve that approaches 88% while waiting
  const target = 12 + (1 - Math.exp(-elapsed / 180)) * 76;
  progress.value = Math.min(88, Math.max(progress.value, target));
  animationFrameId.value = requestAnimationFrame(tickProgress);
};

watch(() => props.ready, (isReady) => {
  if (isReady && mountedAt > 0) {
    finishLoading();
  }
});

onMounted(() => {
  mountedAt = Date.now();
  if (props.fullscreen) {
    lockBodyScroll(loadingScreenScrollLockId);
  }

  animationFrameId.value = requestAnimationFrame(tickProgress);

  // Hard safety cap so splash never stalls under any condition
  setTimeout(() => {
    finishLoading();
  }, 600);
});

onBeforeUnmount(() => {
  if (props.fullscreen) {
    unlockBodyScroll(loadingScreenScrollLockId);
  }
  if (animationFrameId.value !== null) {
    cancelAnimationFrame(animationFrameId.value);
  }
});
</script>

<style scoped>
@reference "@/assets/styles/main.css";

.loading-screen {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--bg-canvas);
  opacity: 1;
  transition: opacity 240ms var(--ease-out-expo);
}

.loading-screen.is-embedded {
  position: absolute;
  z-index: 30;
}

.loading-screen.fade-out {
  opacity: 0;
  pointer-events: none;
}

.loading-backdrop {
  position: absolute;
  inset: 0;
}

.loading-card {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
  width: min(260px, calc(100vw - 3rem));
  padding: 2rem 1.75rem 1.75rem;
  border-radius: var(--radius-modal);
  background: var(--surface-card);
  border: 1px solid var(--border-subtle);
  box-shadow: var(--shadow-lg);
}

.loading-emblem {
  position: relative;
  width: 4.5rem;
  height: 4.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.emblem-ring {
  position: absolute;
  inset: -4px;
  border-radius: 9999px;
  border: 2.5px solid var(--border-subtle);
  border-top-color: var(--accent-primary);
  animation: spin 0.9s linear infinite;
}

.emblem-avatar {
  width: 3.75rem;
  height: 3.75rem;
  border-radius: 9999px;
  object-fit: cover;
  border: 2px solid var(--border-subtle);
}

.emblem-core {
  width: 3rem;
  height: 3rem;
  border-radius: 9999px;
  background: var(--accent-primary);
}

.loading-progress {
  width: 100%;
}

.progress-track {
  width: 100%;
  height: 4px;
  border-radius: 9999px;
  background: var(--surface-muted);
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  border-radius: 9999px;
  background: var(--accent-primary);
  transition: width 160ms var(--ease-out-expo);
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
