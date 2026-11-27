<template>
  <div class="modal-container">
    <DialogRoot
      v-for="modal in visibleModals"
      :key="modal.id"
      :open="modal.visible"
      modal
      @update:open="(open) => handleOpenChange(modal, open)"
    >
      <DialogPortal>
        <div
          class="modal-wrapper"
          :class="[
            modal.options?.className,
            {
              'visible': modal.visible,
              'fullscreen': modal.options?.fullscreen,
              'centered': modal.options?.centered !== false
            }
          ]"
          :style="{ zIndex: modal.zIndex }"
          :data-modal-id="modal.id"
        >
          <DialogOverlay class="modal-mask" />

          <DialogContent
            class="modal-content"
            :class="{ 'custom-size': modal.options?.width ?? modal.options?.height }"
            :style="getContentStyle(modal)"
            @escape-key-down="(event) => handleEscapeKeyDown(event, modal)"
            @pointer-down-outside="(event) => handlePointerDownOutside(event, modal)"
            @interact-outside="(event) => handleInteractOutside(event, modal)"
          >
            <VisuallyHidden>
              <DialogTitle>{{ getModalTitle(modal) }}</DialogTitle>
              <DialogDescription>{{ getModalDescription(modal) }}</DialogDescription>
            </VisuallyHidden>

            <component
              :is="modal.component"
              v-bind="modal.props"
              :on-close="() => closeModal(modal.id)"
              :on-navigate="modal.onNavigate"
              @close="() => closeModal(modal.id)"
              @modal-close="() => closeModal(modal.id)"
            />
          </DialogContent>
        </div>
      </DialogPortal>
    </DialogRoot>
  </div>
</template>

<script setup lang="ts">
import {
  DialogContent,
  DialogDescription,
  DialogOverlay,
  DialogPortal,
  DialogRoot,
  DialogTitle,
  VisuallyHidden,
} from 'reka-ui';
import { computed } from 'vue';

import { useModalStore, type ModalInstance } from '@/stores/modal';

const modalStore = useModalStore();
const visibleModals = computed(() => modalStore.visibleModals);

type DismissEvent = Event & { preventDefault: () => void };

const handleOpenChange = (modal: ModalInstance, open: boolean): void => {
  if (open) return;

  if (modal.options?.closable !== false) {
    modalStore.close(modal.id);
  }
};

// 关闭弹窗
const closeModal = (id: string): void => {
  modalStore.close(id);
};

// 获取内容样式
const getContentStyle = (modal: ModalInstance): Record<string, string> => {
  const style: Record<string, string> = {};

  if (modal.options?.width) {
    style['--modal-width'] = typeof modal.options.width === 'number'
      ? `${modal.options.width}px`
      : modal.options.width;
  }

  if (modal.options?.height) {
    style['--modal-height'] = typeof modal.options.height === 'number'
      ? `${modal.options.height}px`
      : modal.options.height;
  }

  return style;
};

const handleEscapeKeyDown = (event: DismissEvent, modal: ModalInstance): void => {
  const isTopModal = modalStore.topModal?.id === modal.id;

  if (!isTopModal || modal.options?.escClosable === false || modal.options?.closable === false) {
    event.preventDefault();
  }
};

const handlePointerDownOutside = (event: DismissEvent, modal: ModalInstance): void => {
  const isTopModal = modalStore.topModal?.id === modal.id;

  if (!isTopModal || modal.options?.maskClosable === false || modal.options?.closable === false) {
    event.preventDefault();
  }
};

const handleInteractOutside = (event: DismissEvent, modal: ModalInstance): void => {
  const isTopModal = modalStore.topModal?.id === modal.id;

  if (!isTopModal || modal.options?.maskClosable === false || modal.options?.closable === false) {
    event.preventDefault();
  }
};

const getModalTitle = (modal: ModalInstance): string => `Modal ${modal.id}`;

const getModalDescription = (modal: ModalInstance): string => `Dialog content for ${modal.id}`;
</script>

<style scoped>
@reference "@/assets/styles/main.css";

.modal-container {
  @apply contents;
  @apply pointer-events-none;
}

.modal-wrapper {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.22s var(--ease-out-expo);
  padding: 0.75rem;
}

.modal-wrapper.visible {
  opacity: 1;
  pointer-events: auto;
}

.modal-wrapper.fullscreen {
  padding: 0;
}

.modal-mask {
  position: absolute;
  inset: 0;
  background: rgba(9, 15, 29, 0.56);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  transition: opacity 0.22s ease;
}

.modal-content {
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  transform: scale(0.96) translateY(10px);
  transition: transform 0.24s var(--ease-out-expo);
  outline: none;
}

.modal-wrapper.visible .modal-content {
  transform: scale(1) translateY(0);
}

.modal-wrapper.fullscreen .modal-content {
  width: 100vw;
  height: 100vh;
  height: 100dvh;
  max-width: none;
  max-height: none;
  border-radius: 0;
  transform: none;
}

.modal-content.custom-size {
  width: var(--modal-width, auto);
  height: var(--modal-height, auto);
}

/* 移动端适配 */
@media (max-width: 640px) {
  .modal-wrapper {
    padding: 0.5rem;
  }

  .modal-content {
    width: 100%;
    border-radius: var(--radius-card);
  }

  .modal-wrapper:not(.fullscreen) .modal-content {
    max-height: calc(100dvh - 1rem);
  }
}
</style>
