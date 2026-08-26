import { useEventListener } from '@vueuse/core';
import type { Ref } from 'vue';

export const preservesNativeContextMenu = (target: EventTarget | null): boolean => {
  const element = target instanceof HTMLElement ? target : null;
  return Boolean(element?.closest('input, textarea, [contenteditable="true"]'));
};

export const useContextMenuEscape = (show: Ref<boolean>): void => {
  useEventListener(document, 'keydown', event => {
    if (event.key !== 'Escape' || !show.value) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    show.value = false;
  }, { capture: true });
};
