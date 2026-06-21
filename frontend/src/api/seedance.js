import { useConfigStore } from '@/store/config'

export const MODEL_FAST = 'doubao-seedance-2-0-fast-260128'
export const MODEL_STANDARD = 'doubao-seedance-2-0-260128'

export const MODEL_META = {
  [MODEL_FAST]: { tag: '快速版', hint: '出片快，适合试效果' },
  [MODEL_STANDARD]: { tag: '标准版', hint: '画质好，适合正式作品' },
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

export function buildPayload(form, mode) {
  const payload = {
    model: form.model,
    prompt: (form.prompt || '').trim(),
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
    const img = (form.refImageUrl || '').trim()
    const vid = (form.refVideoUrl || '').trim()
    const aud = (form.refAudioUrl || '').trim()
    if (!img && !vid) throw new Error('多模态模式至少需要参考图或参考视频')
    if (aud && !img && !vid) throw new Error('音频不能单独使用，需配合参考图或视频')
    const content = []
    if (img) {
      content.push({
        type: 'image_url',
        role: 'reference_image',
        image_url: { url: img },
      })
    }
    if (vid) {
      content.push({
        type: 'video_url',
        role: 'reference_video',
        video_url: { url: vid },
      })
    }
    if (aud) {
      content.push({
        type: 'audio_url',
        role: 'reference_audio',
        audio_url: { url: aud },
      })
    }
    payload.content = content
    if (img) payload.reference_image_urls = [img]
    if (vid) payload.reference_video_urls = [vid]
    if (aud) payload.audio_url = aud
  }

  return payload
}

/* ----------------------------- 网络请求 ----------------------------- */

function raiseApiError(data, status) {
  const parsed = parseErrorPayload(data, status)
  throw new ApiError(parsed.primaryMessage, { data, status, parsed })
}

async function apiRequest(method, path, body) {
  const config = useConfigStore()
  const base = config.base
  const key = config.key
  if (!base) throw new Error('请填写 API 地址')
  if (!key) throw new Error('请填写 API Key')

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
  return apiRequest('POST', config.path, payload)
}

export function queryTask(taskId) {
  const config = useConfigStore()
  return apiRequest('GET', `${config.path}/${taskId}`)
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
