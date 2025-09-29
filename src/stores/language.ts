import { defineStore } from 'pinia';
import { ref } from 'vue';

import type { Language } from '@/types';
import { getDefaultLanguage, isValidLanguage } from '@/utils/language';

export const useLanguageStore = defineStore('language', () => {
  // �������
  const storedLanguage = localStorage.getItem('locale');
  const defaultLanguage = getDefaultLanguage();
  const currentLanguage = ref<Language>(
    (storedLanguage && isValidLanguage(storedLanguage)) ? storedLanguage : defaultLanguage,
  );

  // ��������
  const setLanguage = (lang: Language): void => {
    if (isValidLanguage(lang)) {
      currentLanguage.value = lang;
      localStorage.setItem('locale', lang);
    }
  };

  return {
    // �������
    currentLanguage,
    setLanguage,
  };
});
