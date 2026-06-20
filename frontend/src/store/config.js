import { defineStore } from 'pinia'
import { CONFIG_STORAGE_KEY, migrateLegacyConfig } from '@/utils/config-storage'

function isLocalHost() {
  const h = location.hostname
  return h === 'localhost' || h === '127.0.0.1' || h === ''
}

export const useConfigStore = defineStore('config', {
  state: () => ({
    apiBase: 'https://ai.centos.hk',
    apiPath: '/v1/videos',
    apiKey: '',
    // 本地默认走代理解决跨域；线上默认直连，可在「API 配置」里开启
    useProxy: isLocalHost(),
  }),
  getters: {
    // 实际请求基址：开启代理走同源 /proxy，否则直连填写的地址
    base(state) {
      if (state.useProxy) return `${location.origin}/proxy`
      return state.apiBase.trim().replace(/\/+$/, '')
    },
    path(state) {
      let p = (state.apiPath || '/v1/videos').trim()
      if (!p.startsWith('/')) p = `/${p}`
      return p.replace(/\/+$/, '')
    },
    key(state) {
      return state.apiKey.trim()
    },
  },
  persist: {
    key: CONFIG_STORAGE_KEY,
    pick: ['apiBase', 'apiPath', 'apiKey', 'useProxy'],
    afterRestore(ctx) {
      migrateLegacyConfig(ctx.store)
    },
  },
})
