<template>
  <DialogRoot :open="visible" @update:open="handleOpenChange">
    <DialogPortal>
      <div class="mobile-filter-layer" :style="{ zIndex }">
        <DialogOverlay class="mobile-filter-overlay" />
        <DialogContent
          :id="contentId"
          class="mobile-filter-content"
          :aria-describedby="describedBy"
        >
          <div class="sheet-handle-bar" aria-hidden="true">
            <span class="sheet-handle"></span>
          </div>
          <header class="mobile-filter-header">
            <DialogTitle :id="titleId" class="mobile-filter-title">{{ title }}</DialogTitle>
            <DialogClose
              class="close-button"
              :aria-label="closeLabel"
              type="button"
            >
              <i :class="getIconClass('times')" aria-hidden="true"></i>
            </DialogClose>
          </header>
          <div
            :id="bodyId"
            class="mobile-filter-body"
            :role="bodyRole"
            :aria-label="bodyAriaLabel"
          >
            <slot />
          </div>
        </DialogContent>
      </div>
    </DialogPortal>
  </DialogRoot>
</template>

<script setup lang="ts">
import { DialogClose, DialogContent, DialogOverlay, DialogPortal, DialogRoot, DialogTitle } from 'reka-ui';

import { getIconClass } from '@/utils/icons';

interface Props {
  visible: boolean;
  title: string;
  closeLabel: string;
  titleId?: string;
  contentId?: string;
  bodyId?: string;
  bodyRole?: string;
  bodyAriaLabel?: string;
  describedBy?: string;
  zIndex?: number;
}

withDefaults(defineProps<Props>(), {
  titleId: 'mobile-filter-title',
  contentId: 'mobile-filter-content',
  bodyId: undefined,
  bodyRole: undefined,
  bodyAriaLabel: undefined,
  describedBy: undefined,
  zIndex: 1000,
});

const emit = defineEmits<{
  (e: 'close'): void;
}>();

const handleOpenChange = (open: boolean): void => {
  if (!open) {
    emit('close');
  }
};
</script>

<style scoped>
@reference "@/assets/styles/main.css";

.mobile-filter-layer {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  pointer-events: none;
}

.mobile-filter-overlay {
  position: fixed;
  inset: 0;
  background: rgba(9, 15, 29, 0.52);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  touch-action: none;
  pointer-events: auto;
  animation: overlayFadeIn 0.2s ease-out;
}

.mobile-filter-content {
  position: relative;
  width: 100%;
  max-height: 82vh;
  max-height: 82dvh;
  background: var(--surface-elevated);
  backdrop-filter: blur(22px) saturate(165%);
  -webkit-backdrop-filter: blur(22px) saturate(165%);
  border-top: 1px solid var(--border-default);
  border-radius: 1.25rem 1.25rem 0 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  pointer-events: auto;
  box-shadow: 0 -20px 48px rgba(0, 0, 0, 0.28);
  outline: none;
  animation: mobileFilterIn 0.24s var(--ease-out-expo);
}

.sheet-handle-bar {
  display: flex;
  justify-content: center;
  padding-top: 0.625rem;
}

.sheet-handle {
  width: 2.5rem;
  height: 4px;
  border-radius: 9999px;
  background: var(--border-strong);
}

.mobile-filter-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1.25rem 0.875rem;
  border-bottom: 1px solid var(--border-subtle);
  flex-shrink: 0;
}

.mobile-filter-title {
  margin: 0;
  font-size: 1rem;
  font-weight: 700;
  color: var(--text-primary);
}

.close-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border: 1px solid var(--border-subtle);
  border-radius: 0.5rem;
  background: var(--surface-muted);
  color: var(--text-secondary);
  cursor: pointer;
  transition: background-color 0.16s ease, color 0.16s ease;
}

.close-button:hover {
  background: var(--surface-muted-hover);
  color: var(--text-primary);
}

.close-button:focus-visible {
  outline: 2px solid var(--accent-primary);
  outline-offset: 2px;
}

.mobile-filter-body {
  flex: 1 1 0%;
  min-height: 0;
  overflow-y: auto;
  padding: 1rem 1.25rem calc(1.25rem + env(safe-area-inset-bottom, 0px));
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

@keyframes overlayFadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes mobileFilterIn {
  from {
    transform: translateY(100%);
  }
  to {
    transform: translateY(0);
  }
}
</style>
