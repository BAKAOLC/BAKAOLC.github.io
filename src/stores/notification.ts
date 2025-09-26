import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

import type { I18nText } from '@/types';

import { useTimers } from '@/composables/useTimers';

export interface NotificationConfig {
  id: string;
  message: string | I18nText;
  type?: 'success' | 'error' | 'warning' | 'info';
  duration?: number; // ��ʾʱ����0��ʾ���Զ��ر�
  closable?: boolean; // �Ƿ���ֶ��ر�
  icon?: string; // ͼ������
}

export interface NotificationInstance extends NotificationConfig {
  visible: boolean;
  timer?: number;
}

export const useNotificationStore = defineStore('notification', () => {
  const notifications = ref<NotificationInstance[]>([]);
  const maxNotifications = ref(5);
  const pendingQueue = ref<NotificationConfig[]>([]);
  const { setTimeout, clearTimeout } = useTimers();

  // ��ȡ�ɼ�֪ͨ����
  const visibleCount = computed(() => notifications.value.filter(n => n.visible).length);

  // ��ʾ֪ͨ
  const show = (config: NotificationConfig): string => {
    // ��������������������ȴ�����
    if (visibleCount.value >= maxNotifications.value) {
      pendingQueue.value.push(config);
      return config.id;
    }

    return showNotification(config);
  };

  // ������ʾ֪ͨ
  const showNotification = (config: NotificationConfig): string => {
    const notification: NotificationInstance = {
      ...config,
      visible: true,
      duration: config.duration ?? 3000,
      closable: config.closable ?? true,
      type: config.type || 'info',
    };

    notifications.value.push(notification);

    // �����Զ��رն�ʱ��
    if (notification.duration && notification.duration > 0) {
      notification.timer = setTimeout(() => {
        remove(notification.id);
      }, notification.duration);
    }

    return config.id;
  };

  // �Ƴ�֪ͨ
  const remove = (id: string): void => {
    const index = notifications.value.findIndex(n => n.id === id);
    if (index === -1) return;

    const notification = notifications.value[index];

    // �����ʱ��
    if (notification.timer) {
      clearTimeout(notification.timer);
    }

    // ����Ϊ���ɼ����ö�������
    notification.visible = false;

    // �ӳ��Ƴ����ȴ��������
    setTimeout(() => {
      const currentIndex = notifications.value.findIndex(n => n.id === id);
      if (currentIndex !== -1) {
        notifications.value.splice(currentIndex, 1);
      }

      // ����ȴ�����
      processQueue();
    }, 300);
  };

  // ����ȴ�����
  const processQueue = (): void => {
    // ����������У���ʹ���ӳ٣�ȷ���ϸ�˳����ʾ
    while (pendingQueue.value.length > 0 && visibleCount.value < maxNotifications.value) {
      const nextNotification = pendingQueue.value.shift();
      if (nextNotification) {
        showNotification(nextNotification);
      }
    }
  };

  // �������֪ͨ
  const clear = (): void => {
    // ��յȴ�����
    pendingQueue.value = [];

    // ������ж�ʱ�����Ƴ�֪ͨ
    notifications.value.forEach(notification => {
      if (notification.timer) {
        clearTimeout(notification.timer);
      }
    });

    notifications.value = [];
  };

  // �������֪ͨ����
  const setMaxNotifications = (max: number): void => {
    maxNotifications.value = Math.max(1, max);
  };

  // ��ݷ���
  const success = (message: string | I18nText, options: Partial<NotificationConfig> = {}): string => {
    const id = options.id || `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    return show({
      id,
      message,
      type: 'success',
      ...options,
    });
  };

  const error = (message: string | I18nText, options: Partial<NotificationConfig> = {}): string => {
    const id = options.id || `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    return show({
      id,
      message,
      type: 'error',
      ...options,
    });
  };

  const warning = (message: string | I18nText, options: Partial<NotificationConfig> = {}): string => {
    const id = options.id || `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    return show({
      id,
      message,
      type: 'warning',
      ...options,
    });
  };

  const info = (message: string | I18nText, options: Partial<NotificationConfig> = {}): string => {
    const id = options.id || `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    return show({
      id,
      message,
      type: 'info',
      ...options,
    });
  };

  return {
    notifications,
    maxNotifications,
    visibleCount,
    show,
    remove,
    clear,
    setMaxNotifications,
    success,
    error,
    warning,
    info,
  };
});
