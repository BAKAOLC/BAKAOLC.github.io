import { createApp } from 'vue';

import App from './App.vue';
import adminI18n from './i18n';
import './styles.css';

createApp(App).use(adminI18n).mount('#admin-app');
