import { resolve } from 'path';

import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vite';

import { createAdminApiPlugin } from './admin/api-plugin';

export default defineConfig({
  root: resolve(__dirname),
  cacheDir: resolve(__dirname, 'node_modules/.vite-admin'),
  publicDir: false,
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  plugins: [vue(), createAdminApiPlugin(resolve(__dirname))],
  server: {
    host: '127.0.0.1',
    port: 5174,
    strictPort: true,
    fs: {
      strict: true,
      allow: [resolve(__dirname)],
    },
  },
  build: {
    outDir: resolve(__dirname, '.admin-dist'),
    emptyOutDir: true,
    rollupOptions: {
      input: resolve(__dirname, 'admin/index.html'),
    },
  },
});
