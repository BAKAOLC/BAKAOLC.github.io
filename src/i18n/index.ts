import { createI18n } from 'vue-i18n';

import type { Language } from '@/types';

import { getDefaultLanguage, getFallbackLanguage, getEnabledLanguages, isValidLanguage, getLanguagesConfig } from '@/utils/language';

const getNavigatorLanguage = (): Language => {
  const browserLang = navigator.language.toLowerCase();
  const languagesConfig = getLanguagesConfig();

  // �����������õ����ԣ�����Ƿ�ƥ��
  for (const [langCode, config] of Object.entries(languagesConfig.languages)) {
    if (!config.enabled) continue;

    const langCodeLower = langCode.toLowerCase();

    // 1. ��ȷƥ�����Դ���
    if (browserLang === langCodeLower) {
      return langCode as Language;
    }

    // 2. ��ȷƥ�����
    if (config.aliases) {
      for (const alias of config.aliases) {
        const aliasLower = alias.toLowerCase();
        if (browserLang === aliasLower) {
          return langCode as Language;
        }
      }
    }

    // 3. ǰ׺ƥ�����Դ��루�� zh-CN ƥ�� zh��
    if (browserLang.startsWith(`${langCodeLower}-`)) {
      return langCode as Language;
    }

    // 4. ǰ׺ƥ��������� zh-CN ƥ�� zh-cn ������
    if (config.aliases) {
      for (const alias of config.aliases) {
        const aliasLower = alias.toLowerCase();
        if (browserLang.startsWith(`${aliasLower}-`)) {
          return langCode as Language;
        }
      }
    }
  }

  return getDefaultLanguage() as Language;
};

// ��ȡ�洢����������
const storedLocale = localStorage.getItem('locale') as Language | null;

// ȷ������ʹ�õ����ԣ����ȼ����洢����Ч���� > ������������ > Ĭ������
let locale: Language;
if (storedLocale && isValidLanguage(storedLocale)) {
  locale = storedLocale;
} else {
  const detectedLanguage = getNavigatorLanguage();
  // ˫����֤��⵽�������Ƿ���Ч
  if (isValidLanguage(detectedLanguage)) {
    locale = detectedLanguage;
  } else {
    // ������ʧ�ܣ�ʹ��Ĭ������
    locale = getDefaultLanguage() as Language;
    console.warn(`Failed to detect valid language, falling back to default: ${locale}`);
  }
}

// ʹ�� Vite �� glob ���빦�ܶ�̬�������������ļ�
const languageModules = import.meta.glob('./*.json', { eager: false });

// ��̬���������ļ�
const loadLanguageMessages = async (): Promise<Record<string, any>> => {
  const messages: Record<string, any> = {};
  const enabledLanguages = getEnabledLanguages();

  for (const lang of enabledLanguages) {
    const modulePath = `./${lang}.json`;
    const moduleLoader = languageModules[modulePath];

    if (moduleLoader) {
      try {
        const module = await moduleLoader();
        messages[lang] = (module as any).default || module;
      } catch (error) {
        console.warn(`Failed to load language file for '${lang}':`, error);
      }
    } else {
      console.warn(`Language file '${lang}.json' not found.`);
      console.warn('Available language files:', Object.keys(languageModules));
    }
  }

  return messages;
};

// �첽��ʼ�� i18n
const initializeI18n = async (): Promise<any> => {
  const messages = await loadLanguageMessages();

  // ���հ�ȫ��飺ȷ��ѡ�����������Ϣ�����д���
  if (!messages[locale]) {
    console.warn(`Selected locale '${locale}' not available in messages, falling back to '${getFallbackLanguage()}'`);
    locale = getFallbackLanguage() as Language;

    // �����������Ҳ�����ڣ�ʹ�õ�һ�����õ�����
    if (!messages[locale] && Object.keys(messages).length > 0) {
      locale = Object.keys(messages)[0] as Language;
      console.warn(`Fallback locale not available, using first available: '${locale}'`);
    }
  }

  return createI18n({
    legacy: false,
    locale: locale,
    fallbackLocale: getFallbackLanguage(),
    messages,
  });
};

// �����첽��ʼ��������ͬ������ʱʵ��
export const createI18nInstance = initializeI18n;

// ����һ����ʱ�� i18n ʵ��������Ӧ������ʱ��ռλ
const tempI18n = createI18n({
  legacy: false,
  locale: getDefaultLanguage() as Language,
  fallbackLocale: getFallbackLanguage(),
  messages: {}, // ����Ϣ���Ժ�ᱻ�滻
});

export default tempI18n;
