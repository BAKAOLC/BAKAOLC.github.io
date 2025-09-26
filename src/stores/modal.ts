import { defineStore } from 'pinia';
import { ref, computed, nextTick, markRaw, type Component } from 'vue';

import { useTimers } from '@/composables/useTimers';

export interface ModalOptions {
  closable?: boolean; // �Ƿ�ɹر�
  maskClosable?: boolean; // ��������Ƿ�ر�
  escClosable?: boolean; // ��ESC�Ƿ�ر�
  destroyOnClose?: boolean; // �ر�ʱ�Ƿ�����
  zIndex?: number; // �Զ���㼶
  className?: string; // �Զ�����ʽ��
  width?: string | number; // ���
  height?: string | number; // �߶�
  fullscreen?: boolean; // �Ƿ�ȫ��
  centered?: boolean; // �Ƿ����
}

export interface ModalConfig {
  id: string;
  component: Component;
  props?: Record<string, any>;
  options?: ModalOptions;
  onClose?: () => void;
  onDestroy?: () => void;
}

export interface ModalInstance extends ModalConfig {
  visible: boolean;
  zIndex: number;
  parentId?: string; // ������ID�����ڲ㼶����
  children: Set<string>; // �ӵ���ID����
  createdAt: number; // ����ʱ���
}

export const useModalStore = defineStore('modal', () => {
  const modals = ref<Map<string, ModalInstance>>(new Map());
  const baseZIndex = ref(2000);
  const currentZIndex = ref(2000);
  const activeModalStack = ref<string[]>([]); // ��Ծ����ջ
  const { setTimeout } = useTimers();

  // ��ȡ�ɼ�����
  const visibleModals = computed(() => {
    return Array.from(modals.value.values())
      .filter(modal => modal.visible)
      .sort((a, b) => a.zIndex - b.zIndex);
  });

  // ��ȡ���㵯��
  const topModal = computed(() => {
    const visible = visibleModals.value;
    return visible.length > 0 ? visible[visible.length - 1] : null;
  });

  // �򿪵���
  const open = (config: ModalConfig): string => {
    const modal: ModalInstance = {
      ...config,
      component: markRaw(config.component), // ʹ��markRaw�����������Ӧʽ��
      visible: true,
      zIndex: ++currentZIndex.value,
      children: new Set(),
      createdAt: Date.now(),
      options: {
        closable: true,
        maskClosable: true,
        escClosable: true,
        destroyOnClose: false,
        centered: true,
        ...config.options,
      },
    };

    // ����л�Ծ�ĵ������������ӹ�ϵ
    if (activeModalStack.value.length > 0) {
      const parentId = activeModalStack.value[activeModalStack.value.length - 1];
      const parentModal = modals.value.get(parentId);
      if (parentModal) {
        modal.parentId = parentId;
        parentModal.children.add(config.id);
      }
    }

    modals.value.set(config.id, modal);
    activeModalStack.value.push(config.id);

    // ��ֹ��������
    updateBodyOverflow();

    return config.id;
  };

  // �رյ���
  const close = (id: string): void => {
    const modal = modals.value.get(id);
    if (!modal || !modal.visible) return;

    // �ȹر������ӵ���
    const childrenToClose = Array.from(modal.children);
    childrenToClose.forEach(childId => {
      close(childId);
    });

    // ����Ϊ���ɼ�
    modal.visible = false;

    // �ӻ�Ծջ���Ƴ�
    const stackIndex = activeModalStack.value.indexOf(id);
    if (stackIndex !== -1) {
      activeModalStack.value.splice(stackIndex, 1);
    }

    // �Ӹ��������Ӽ������Ƴ�
    if (modal.parentId) {
      const parentModal = modals.value.get(modal.parentId);
      if (parentModal) {
        parentModal.children.delete(id);
      }
    }

    // ���ùرջص�
    if (modal.onClose) {
      modal.onClose();
    }

    // �ӳ����٣��ȴ��������
    setTimeout(() => {
      if (modal.options?.destroyOnClose !== false) {
        modals.value.delete(id);

        // �������ٻص�
        if (modal.onDestroy) {
          modal.onDestroy();
        }
      }

      // ����body����״̬
      updateBodyOverflow();
    }, 300);
  };

  // �ر����е���
  const closeAll = (): void => {
    const modalIds = Array.from(modals.value.keys());
    modalIds.forEach(id => {
      close(id);
    });
  };

  // ��ȡָ������
  const getModal = (id: string): ModalInstance | undefined => {
    return modals.value.get(id);
  };

  // ��鵯���Ƿ��
  const isModalOpen = (id: string): boolean => {
    const modal = modals.value.get(id);
    return modal ? modal.visible : false;
  };

  // ����body����״̬
  const updateBodyOverflow = (): void => {
    nextTick(() => {
      const hasVisibleModals = visibleModals.value.length > 0;
      if (typeof document !== 'undefined') {
        document.body.style.overflow = hasVisibleModals ? 'hidden' : '';
      }
    });
  };

  // ���û���z-index
  const setBaseZIndex = (zIndex: number): void => {
    baseZIndex.value = zIndex;
    currentZIndex.value = zIndex;
  };

  return {
    modals,
    visibleModals,
    topModal,
    activeModalStack,
    open,
    close,
    closeAll,
    getModal,
    isModalOpen,
    setBaseZIndex,
  };
});
