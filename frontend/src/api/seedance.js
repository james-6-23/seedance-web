import { useConfigStore } from '@/store/config'

// tier 决定能力（分辨率上限/时长）：standard 支持 1080p，fast / mini 封顶 720p。
// group 仅用于下拉分组展示（国内为豆包域、海外为 Dreamina 低审查域）。
export const MODELS = [
  { id: 'doubao-seedance-2-0-260128', tag: '标准版', hint: '画质好，适合正式作品', group: '国内', tier: 'standard' },
  { id: 'doubao-seedance-2-0-fast-260128', tag: '快速版', hint: '出片快，适合试效果', group: '国内', tier: 'fast' },
  { id: 'dreamina-seedance-2-0-260128', tag: '标准版·海外', hint: '画质好，海外节点（低审查）', group: '海外', tier: 'standard' },
  { id: 'dreamina-seedance-2-0-fast-260128', tag: '快速版·海外', hint: '出片快，海外节点（低审查）', group: '海外', tier: 'fast' },
  { id: 'dreamina-seedance-2-0-mini-260615', tag: '迷你版·海外', hint: '更省更快，海外节点（低审查）', group: '海外', tier: 'mini' },
]

export const MODEL_META = Object.fromEntries(MODELS.map((m) => [m.id, m]))

// 按 group 归类，供下拉的 el-option-group 使用（保持 MODELS 中的出现顺序）
export const MODEL_GROUPS = MODELS.reduce((groups, m) => {
  const g = groups.find((x) => x.label === m.group)
  if (g) g.models.push(m)
  else groups.push({ label: m.group, models: [m] })
  return groups
}, [])

// 默认模型：国内快速版
export const MODEL_FAST = 'doubao-seedance-2-0-fast-260128'
export const MODEL_STANDARD = 'doubao-seedance-2-0-260128'

export function getModelMeta(model) {
  return MODEL_META[model] || null
}

export function getModelKeyGroup(model) {
  return MODEL_META[model]?.group === '海外' ? 'overseas' : 'domestic'
}

export function formatModelKeyGroup(model) {
  return getModelKeyGroup(model) === 'overseas'
    ? '海外 API Key（dreamina 分组）'
    : '国内 API Key（seedance 分组）'
}

export function getApiKeyForModel(model, config = useConfigStore()) {
  return getModelKeyGroup(model) === 'overseas'
    ? config.overseasKey
    : config.domesticKey
}

export function hasApiKeyForModel(model, config = useConfigStore()) {
  return !!getApiKeyForModel(model, config)
}

// standard 档支持 1080p，其余（fast / mini）封顶 720p
export function isStandardTier(model) {
  return MODEL_META[model]?.tier === 'standard'
}

export function formatModelLabel(model, { beginner = false } = {}) {
  const meta = MODEL_META[model]
  if (!meta) return model
  if (beginner) return `${model}（${meta.tag}）— ${meta.hint}`
  return `${model}（${meta.tag}）`
}

export const SUCCESS_STATUSES = new Set(['completed', 'succeeded', 'success'])

/* ----------------------------- 错误解析 ----------------------------- */

export class ApiError extends Error {
  constructor(message, { data = null, status = null, parsed = null } = {}) {
    super(message)
    this.name = 'ApiError'
    this.data = data
    this.status = status
    this.parsed = parsed || (data ? parseErrorPayload(data, status) : null)
  }
}

export function parseErrorPayload(data, httpStatus = null) {
  const layers = []
  const seen = new Set()

  function push(type, text, depth = 0) {
    const val = String(text ?? '').trim()
    if (!val || seen.has(val)) return
    seen.add(val)
    layers.push({ type, text: val, depth })
  }

  function walk(node, depth = 0) {
    if (node == null) return
    if (typeof node === 'string') {
      const trimmed = node.trim()
      if (
        (trimmed.startsWith('{') || trimmed.startsWith('[')) &&
        trimmed.includes('message')
      ) {
        try {
          walk(JSON.parse(trimmed), depth + 1)
          return
        } catch (_) {}
      }
      push('message', trimmed, depth)
      return
    }
    if (typeof node !== 'object') return

    if (node.code && node.code !== 'success') push('code', node.code, depth)
    if (node.type) push('type', node.type, depth)
    if (node.param) push('param', node.param, depth)
    if (node.error) walk(node.error, depth + 1)
    if (node.message) walk(node.message, depth + 1)
  }

  walk(data)
  if (httpStatus) push('http', `HTTP ${httpStatus}`, 0)

  const messages = layers.filter((l) => l.type === 'message')
  const primaryMessage =
    [...messages].reverse().find((l) => l.text.length > 8)?.text ||
    messages.at(-1)?.text ||
    layers.find((l) => l.type === 'code')?.text ||
    '请求失败'

  const codes = layers.filter((l) => l.type === 'code')
  const primaryCode =
    codes.at(-1)?.text || (httpStatus ? `HTTP_${httpStatus}` : 'unknown_error')

  return { layers, primaryCode, primaryMessage, raw: data }
}

export function formatErrorForLog(parsed) {
  if (!parsed) return '未知错误'
  const lines = [`错误码: ${parsed.primaryCode}`, `说明: ${parsed.primaryMessage}`]
  parsed.layers.forEach((l) => lines.push(`  [${l.type}] ${l.text}`))
  return lines.join('\n')
}

/* ----------------------------- 结果解析 ----------------------------- */

export function findVideoUrl(data) {
  if (!data || typeof data !== 'object') return null

  const candidates = [
    data.url,
    data.result_url,
    data.video_url,
    data.metadata?.url,
    data.content?.video_url,
    data.data?.url,
    data.data?.content?.video_url,
    data.data?.metadata?.url,
  ]

  for (const val of candidates) {
    if (typeof val === 'string' && val.startsWith('http')) return val
  }

  for (const val of Object.values(data)) {
    if (val && typeof val === 'object') {
      const found = findVideoUrl(val)
      if (found) return found
    }
  }
  return null
}

// 提取尾帧图 URL：网关响应字段名不固定（last_frame_url / last_frame_image_url …），
// 递归查找任何「键名含 last_frame 且值为 http 链接」的字段。
export function findLastFrameUrl(data) {
  if (!data || typeof data !== 'object') return null

  for (const [key, val] of Object.entries(data)) {
    if (
      /last_?frame/i.test(key) &&
      typeof val === 'string' &&
      val.startsWith('http')
    ) {
      return val
    }
    // 形如 { last_frame: { url: '...' } } 或 { last_frame_image: { image_url: {...} } }
    if (/last_?frame/i.test(key) && val && typeof val === 'object') {
      const nested = findVideoUrl(val) // 复用：找内部任意 url 字段
      if (nested) return nested
    }
  }

  for (const val of Object.values(data)) {
    if (val && typeof val === 'object') {
      const found = findLastFrameUrl(val)
      if (found) return found
    }
  }
  return null
}

/* ----------------------------- 请求构建 ----------------------------- */

// 把提示词里的 @Image1 / @Video2 / @Audio1 / @FirstFrame / @LastFrame 引用
// 转成中文「图片1 / 视频2 / 音频1 / 首帧 / 尾帧」，与 content 顺序对应
// （官方指南示例即用「图片 N / 首帧 / 尾帧」指代）。
export function resolveMentions(text) {
  if (!text) return text
  const map = { image: '图片', video: '视频', audio: '音频' }
  return text
    .replace(/@(Image|Video|Audio)(\d+)/gi, (m, kind, n) => {
      const cn = map[kind.toLowerCase()]
      return cn ? `${cn}${n}` : m
    })
    .replace(/@FirstFrame/gi, '首帧')
    .replace(/@LastFrame/gi, '尾帧')
}

export function buildPayload(form, mode) {
  const payload = {
    model: form.model,
    prompt: resolveMentions((form.prompt || '').trim()),
    resolution: form.resolution,
    ratio: form.ratio,
    duration: parseInt(form.duration, 10) || 4,
    generate_audio: form.generateAudio,
    watermark: form.watermark,
  }
  // 返回尾帧图：适用于所有生成模式，便于把视频最后一帧用作下一段首帧
  if (form.returnLastFrame) payload.return_last_frame = true

  if (mode === 'first_frame') {
    const url = (form.firstFrameUrl || '').trim()
    if (!url) throw new Error('请填写首帧 / 参考图 URL')
    if (form.imageRole === 'reference_image') {
      payload.reference_image_urls = [url]
    } else {
      payload.content = [
        { type: 'image_url', role: 'first_frame', image_url: { url } },
      ]
      payload.image = url
    }
  }

  if (mode === 'first_last') {
    const first = (form.firstFrameUrl || '').trim()
    const last = (form.lastFrameUrl || '').trim()
    if (!first || !last) throw new Error('请填写首帧和尾帧图 URL')
    payload.content = [
      { type: 'image_url', role: 'first_frame', image_url: { url: first } },
      { type: 'image_url', role: 'last_frame', image_url: { url: last } },
    ]
    payload.first_frame_url = first
    payload.last_frame_url = last
  }

  if (mode === 'multi_image') {
    const urls = (form.refImageList || []).map((u) => u.trim()).filter(Boolean)
    if (!urls.length) throw new Error('请至少填写一张参考图 URL')
    payload.content = urls.map((url) => ({
      type: 'image_url',
      role: 'reference_image',
      image_url: { url },
    }))
    payload.reference_image_urls = urls
  }

  if (mode === 'multimodal') {
    // 支持多份素材：图片 ≤9、视频 ≤3、音频 ≤3
    const images = (form.refImages || []).map((u) => (u.url || '').trim()).filter(Boolean)
    const videos = (form.refVideos || []).map((u) => (u.url || '').trim()).filter(Boolean)
    const audios = (form.refAudios || []).map((u) => (u.url || '').trim()).filter(Boolean)

    if (!images.length && !videos.length) {
      throw new Error('多模态模式至少需要一张参考图或一个参考视频')
    }
    if (audios.length && !images.length && !videos.length) {
      throw new Error('音频不能单独使用，需配合参考图或视频')
    }

    const content = []
    images.forEach((url) =>
      content.push({ type: 'image_url', role: 'reference_image', image_url: { url } })
    )
    videos.forEach((url) =>
      content.push({ type: 'video_url', role: 'reference_video', video_url: { url } })
    )
    audios.forEach((url) =>
      content.push({ type: 'audio_url', role: 'reference_audio', audio_url: { url } })
    )
    payload.content = content
    if (images.length) payload.reference_image_urls = images
    if (videos.length) payload.reference_video_urls = videos
    if (audios.length) payload.audio_url = audios.length === 1 ? audios[0] : audios
  }

  return payload
}

/* ----------------------------- 网络请求 ----------------------------- */

function raiseApiError(data, status) {
  const parsed = parseErrorPayload(data, status)
  throw new ApiError(parsed.primaryMessage, { data, status, parsed })
}

async function apiRequest(method, path, body, { model } = {}) {
  const config = useConfigStore()
  const base = config.base
  const requestModel = model || body?.model
  const key = getApiKeyForModel(requestModel, config)
  if (!base) throw new Error('请填写 API 地址')
  if (!key) throw new Error(`请填写${formatModelKeyGroup(requestModel)}`)

  const opts = {
    method,
    headers: {
      Authorization: `Bearer ${key}`,
      Accept: 'application/json',
    },
  }
  if (body) {
    opts.headers['Content-Type'] = 'application/json'
    opts.body = JSON.stringify(body)
  }

  let res
  try {
    res = await fetch(`${base}${path}`, opts)
  } catch (err) {
    throw new Error(`网络请求失败（可能是 CORS 跨域问题）：${err.message}`)
  }

  const text = await res.text()
  let data
  try {
    data = text ? JSON.parse(text) : {}
  } catch {
    data = { raw: text }
  }

  const hasTask = !!(data?.id || data?.task_id)
  const hasApiError = !!(data?.error?.message || data?.message || data?.code)
  const isErrorCode = data?.code && data.code !== 'success' && !hasTask

  if (data?.error?.message || isErrorCode || !res.ok) {
    if (!hasApiError && !res.ok) {
      raiseApiError({ message: `HTTP ${res.status}`, raw: text }, res.status)
    } else {
      raiseApiError(data, res.status)
    }
  }
  return data
}

export function createTask(payload) {
  const config = useConfigStore()
  return apiRequest('POST', config.path, payload, { model: payload?.model })
}

export function queryTask(taskId, model) {
  const config = useConfigStore()
  return apiRequest('GET', `${config.path}/${taskId}`, null, { model })
}

/* --------------------- 临时图床（同源 Worker 接口）--------------------- */

// 上传参考素材到自建图床，返回 { key, url }。url 可直接作为参考图/视频地址。
export async function uploadAsset(file) {
  const res = await fetch('/upload', {
    method: 'POST',
    headers: { 'Content-Type': file.type || 'application/octet-stream' },
    body: file,
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.message || `上传失败（HTTP ${res.status}）`)
  return data
}

// 生成结束后销毁临时素材，best-effort，失败不阻塞主流程
export async function deleteAsset(keyOrUrl) {
  if (!keyOrUrl) return
  const payload =
    typeof keyOrUrl === 'string' && keyOrUrl.includes('/files/')
      ? { url: keyOrUrl }
      : { key: keyOrUrl }
  try {
    await fetch('/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
  } catch {
    /* 忽略：生命周期规则会兜底清理 */
  }
}
