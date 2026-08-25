<script setup lang="ts">
import {
  darkTheme, dateEnUS, dateJaJP, dateZhCN, enUS, jaJP, NConfigProvider, NDialogProvider, NMessageProvider, zhCN,
} from 'naive-ui';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

import AdminWorkspace from './components/AdminWorkspace.vue';

const { locale } = useI18n();
const naiveLocale = computed(() => locale.value === 'en' ? enUS : locale.value === 'jp' ? jaJP : zhCN);
const naiveDateLocale = computed(() => locale.value === 'en' ? dateEnUS : locale.value === 'jp' ? dateJaJP : dateZhCN);

const themeOverrides = {
  common: {
    primaryColor: '#7c8cff',
    primaryColorHover: '#96a2ff',
    primaryColorPressed: '#6574eb',
    borderRadius: '10px',
    borderRadiusSmall: '8px',
    fontFamily: 'Inter, "Noto Sans SC", "Microsoft YaHei", system-ui, sans-serif',
  },
  Input: {
    color: '#0f141a',
    colorFocus: '#0f141a',
    border: '1px solid #303744',
    borderHover: '1px solid #5967bb',
    borderFocus: '1px solid #7c8cff',
    boxShadowFocus: '0 0 0 2px rgb(124 140 255 / 14%)',
  },
};
</script>

<template>
  <NConfigProvider
    :theme="darkTheme"
    :locale="naiveLocale"
    :date-locale="naiveDateLocale"
    :theme-overrides="themeOverrides"
  >
    <NDialogProvider>
      <NMessageProvider placement="top-right">
        <AdminWorkspace />
      </NMessageProvider>
    </NDialogProvider>
  </NConfigProvider>
</template>
