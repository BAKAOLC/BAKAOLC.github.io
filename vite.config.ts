import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'
import { createRequire } from 'module'

const require = createRequire(import.meta.url)
const { thumbnailPlugin } = require('./vite-plugins/thumbnail-plugin.cjs')

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    thumbnailPlugin(),
    vue()
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html')
      }
    }
  }
})
