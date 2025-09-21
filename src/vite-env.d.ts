/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue';
  const component: DefineComponent<{}, {}, any>;
  export default component;
}

// ��չ Vue Router �����Ͷ���
declare module 'vue-router' {
  interface RouteMeta {
    titleKey?: string | null; // ҳ�����Ĺ��ʻ���
  }

  export function createRouter(options: any): any;
  export function createWebHashHistory(base?: string): any;
  export function useRouter(): any;
  export function useRoute(): any;

  export interface RouteLocationNormalized {
    name?: string | symbol | null | undefined;
    meta?: Record<string | number | symbol, any>;
    params?: Record<string, string | string[]>;
    query?: Record<string, string | string[]>;
    hash?: string;
    fullPath?: string;
    path?: string;
    matched?: any[];
    redirectedFrom?: any;
  }
}
