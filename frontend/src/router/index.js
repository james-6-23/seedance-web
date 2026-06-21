import { createRouter, createWebHistory } from 'vue-router'
import Layout from '@/layout/index.vue'

export const menuRoutes = [
  {
    path: 'generate',
    name: 'generate',
    meta: { title: '视频生成', icon: 'mingcute:video-line' },
    component: () => import('@/views/generate/index.vue'),
  },
  {
    path: 'guide',
    name: 'guide',
    meta: { title: '提示词指南', icon: 'mingcute:magic-line' },
    component: () => import('@/views/guide/index.vue'),
  },
  {
    path: 'history',
    name: 'history',
    meta: { title: '历史记录', icon: 'mingcute:history-line' },
    component: () => import('@/views/history/index.vue'),
  },
  {
    path: 'config',
    name: 'config',
    meta: { title: 'API 配置', icon: 'mingcute:settings-3-line' },
    component: () => import('@/views/config/index.vue'),
  },
  {
    path: 'docs',
    name: 'docs',
    meta: { title: 'API 文档', icon: 'mingcute:file-code-line' },
    component: () => import('@/views/docs/index.vue'),
  },
  {
    path: 'about',
    name: 'about',
    meta: { title: '使用说明', icon: 'mingcute:book-2-line' },
    component: () => import('@/views/about/index.vue'),
  },
]

const routes = [
  {
    path: '/',
    component: Layout,
    redirect: '/generate',
    children: menuRoutes,
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) return savedPosition
    if (to.hash) return { el: to.hash, behavior: 'smooth' }
    return { top: 0, behavior: 'smooth' }
  },
})

export default router
