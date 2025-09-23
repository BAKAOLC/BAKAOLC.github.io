import { createPinia } from 'pinia';
import { createApp } from 'vue';

import App from './App.vue';
import { createI18nInstance } from './i18n';
import router from './router';

import '@/assets/styles/main.css';

// �첽��ʼ��Ӧ��
const initApp = async (): Promise<void> => {
  const app = createApp(App);

  // �첽���� i18n ʵ��
  const i18n = await createI18nInstance();

  app.use(createPinia());
  app.use(router);
  app.use(i18n);

  app.mount('#app');
};

// ����Ӧ��
initApp().catch(error => {
  console.error('Failed to initialize app:', error);
});
