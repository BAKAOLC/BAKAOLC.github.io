import { defineStore } from 'pinia';
import { computed, ref } from 'vue';

export const useThemeStore = defineStore('theme', () => {
  // �������
  type ThemeMode = 'light' | 'dark' | 'auto';

  const themeMode = ref<ThemeMode>((localStorage.getItem('theme') as ThemeMode) ?? 'auto');
  const systemDarkMode = ref(window.matchMedia('(prefers-color-scheme: dark)').matches);

  // ����ʵ�ʵİ�ɫģʽ״̬
  const isDarkMode = computed(() => {
    if (themeMode.value === 'auto') {
      return systemDarkMode.value;
    }
    return themeMode.value === 'dark';
  });

  // Ӧ�����⵽ DOM
  const applyTheme = (): void => {
    if (isDarkMode.value) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  // ��������ģʽ
  const setThemeMode = (mode: ThemeMode): void => {
    themeMode.value = mode;
    localStorage.setItem('theme', mode);
    applyTheme();
  };

  // �л�����ģʽ��ѭ����auto -> light -> dark -> auto��
  const toggleThemeMode = (): void => {
    const modes: ThemeMode[] = ['auto', 'light', 'dark'];
    const currentIndex = modes.indexOf(themeMode.value);
    const nextIndex = (currentIndex + 1) % modes.length;
    setThemeMode(modes[nextIndex]);
  };

  // ����ϵͳ����仯
  const handleSystemThemeChange = (e: { matches: boolean }): void => {
    systemDarkMode.value = e.matches;
    // �����ǰ���Զ�ģʽ����Ҫ����Ӧ������
    if (themeMode.value === 'auto') {
      applyTheme();
    }
  };

  // ����ϵͳ����仯
  const setupSystemThemeListener = (): (() => void) => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    mediaQuery.addEventListener('change', handleSystemThemeChange);

    // ����������
    return () => {
      mediaQuery.removeEventListener('change', handleSystemThemeChange);
    };
  };

  // ���ݾɰ汾�� toggleDarkMode ����
  const toggleDarkMode = (): void => {
    toggleThemeMode();
  };

  return {
    // �������
    themeMode,
    isDarkMode,
    systemDarkMode,
    setThemeMode,
    toggleThemeMode,
    toggleDarkMode, // ���ݾɰ汾
    applyTheme,
    setupSystemThemeListener,
  };
});
