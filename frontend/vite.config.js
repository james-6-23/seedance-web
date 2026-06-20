import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'

// 前端构建产物输出到 ../public，由 Cloudflare Worker 的 [assets] 托管
export default defineConfig({
  plugins: [
    vue(),
    AutoImport({ resolvers: [ElementPlusResolver()] }),
    Components({ resolvers: [ElementPlusResolver()] }),
  ],
  resolve: {
    alias: { '@': path.resolve(__dirname, 'src') },
  },
  server: {
    host: true,
    port: 3001,
    // 本地 vite 开发时，把 /proxy 直接转发到上游，免去额外启动 server.py
    proxy: {
      '/proxy': {
        target: 'https://ai.centos.hk',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/proxy/, ''),
      },
    },
  },
  build: {
    outDir: '../public',
    emptyOutDir: true,
  },
})
