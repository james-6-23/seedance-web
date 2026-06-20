/** 配置持久化：稳定 key + 旧版迁移 + 导出/导入备份 */

export const CONFIG_STORAGE_KEY = 'seedance-web/config'
export const CONFIG_BACKUP_VERSION = 1

const LEGACY_CONFIG_KEYS = ['config', 'seedance-config']

export function readLegacyConfig() {
  for (const key of LEGACY_CONFIG_KEYS) {
    try {
      const raw = localStorage.getItem(key)
      if (!raw) continue
      const data = JSON.parse(raw)
      if (data && typeof data === 'object') return { key, data }
    } catch {
      /* ignore malformed entries */
    }
  }
  return null
}

/** 从旧 localStorage key 迁移到当前 store（仅在 Key 为空时） */
export function migrateLegacyConfig(store) {
  if (store.apiKey?.trim()) return false

  const legacy = readLegacyConfig()
  if (!legacy) return false

  const { data } = legacy
  if (data.apiBase) store.apiBase = data.apiBase
  if (data.apiPath) store.apiPath = data.apiPath
  if (data.apiKey) store.apiKey = data.apiKey
  if (typeof data.useProxy === 'boolean') store.useProxy = data.useProxy

  return Boolean(store.apiKey?.trim())
}

export function buildConfigBackup(store) {
  return {
    version: CONFIG_BACKUP_VERSION,
    app: 'seedance-web',
    exportedAt: new Date().toISOString(),
    config: {
      apiBase: store.apiBase,
      apiPath: store.apiPath,
      apiKey: store.apiKey,
      useProxy: store.useProxy,
    },
  }
}

export function parseConfigBackup(raw) {
  const data = typeof raw === 'string' ? JSON.parse(raw) : raw
  if (!data || typeof data !== 'object') {
    throw new Error('备份格式无效')
  }

  const cfg = data.config && typeof data.config === 'object' ? data.config : data
  if (!cfg.apiKey && !cfg.apiBase) {
    throw new Error('备份中未找到有效配置')
  }

  return {
    apiBase: String(cfg.apiBase || 'https://ai.centos.hk').trim(),
    apiPath: String(cfg.apiPath || '/v1/videos').trim(),
    apiKey: String(cfg.apiKey || '').trim(),
    useProxy: Boolean(cfg.useProxy),
  }
}

export function applyConfigBackup(store, cfg) {
  store.apiBase = cfg.apiBase
  store.apiPath = cfg.apiPath
  store.apiKey = cfg.apiKey
  store.useProxy = cfg.useProxy
}

export function downloadConfigBackup(store) {
  const payload = buildConfigBackup(store)
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const stamp = new Date().toISOString().slice(0, 10)
  const a = document.createElement('a')
  a.href = url
  a.download = `seedance-config-${stamp}.json`
  a.click()
  URL.revokeObjectURL(url)
}