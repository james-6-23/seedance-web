<template>
  <div class="docs">
    <!-- 左侧固定目录 -->
    <aside class="toc">
      <a
        class="toc-chip"
        :class="{ active: activeId === 'base' }"
        @click="scrollTo('base')"
      >
        <Icon icon="mingcute:list-check-line" width="15" height="15" />
        <span class="toc-name">接口基础</span>
      </a>
      <a
        v-for="e in endpoints"
        :key="e.id"
        class="toc-chip"
        :class="{ active: activeId === e.id }"
        @click="scrollTo(e.id)"
      >
        <b class="m" :class="e.method.toLowerCase()">{{ e.method }}</b>
        <span class="toc-name">{{ e.name }}</span>
      </a>
    </aside>

    <!-- 右侧内容 -->
    <div class="docs-main">
      <!-- 基础说明 -->
      <el-card id="ep-base" data-epid="base" shadow="never" class="card">
        <template #header>
          <div class="head">
            <span class="card-title">接口基础</span>
            <span class="card-hint">Seedance 2.0 视频模型 · 统一入口 <code>/v1/videos</code></span>
          </div>
        </template>

        <div class="base-grid">
          <div class="base-item">
            <span class="k">鉴权</span>
            <span class="v"><code>Authorization: Bearer sk-xxx</code>（请求头）</span>
          </div>
          <div class="base-item">
            <span class="k">创建任务</span>
            <span class="v"><b class="m post">POST</b> <code>/v1/videos</code></span>
          </div>
          <div class="base-item">
            <span class="k">查询结果</span>
            <span class="v"><b class="m get">GET</b> <code>/v1/videos/&#123;id&#125;</code></span>
          </div>
          <div class="base-item">
            <span class="k">状态枚举</span>
            <span class="v">
              <el-tag size="small" effect="plain">queued</el-tag>
              <el-tag size="small" effect="plain">in_progress</el-tag>
              <el-tag size="small" effect="plain" type="success">completed</el-tag>
              <el-tag size="small" effect="plain" type="danger">failed</el-tag>
            </span>
          </div>
          <div class="base-item">
            <span class="k">视频链接</span>
            <span class="v"><code>metadata.url</code></span>
          </div>
          <div class="base-item">
            <span class="k">Token 消耗</span>
            <span class="v"><code>metadata.total_tokens</code></span>
          </div>
          <div class="base-item">
            <span class="k">进度</span>
            <span class="v"><code>progress</code> · 0–100，完成为 100</span>
          </div>
          <div class="base-item">
            <span class="k">任务有效期</span>
            <span class="v">任务 ID 仅保存 7 天，签名视频链接 24 小时有效</span>
          </div>
        </div>
      </el-card>

      <!-- 各接口 -->
      <el-card
        v-for="e in endpoints"
        :id="`ep-${e.id}`"
        :key="e.id"
        :data-epid="e.id"
        shadow="never"
        class="card endpoint"
      >
        <template #header>
          <div class="ep-head">
            <div class="ep-title">
              <b class="m" :class="e.method.toLowerCase()">{{ e.method }}</b>
              <span class="card-title">{{ e.name }}</span>
            </div>
            <a class="ep-link" :href="e.url" target="_blank" rel="noopener noreferrer">
              Apifox 原文
              <Icon icon="mingcute:external-link-line" width="15" height="15" />
            </a>
          </div>
        </template>

        <code class="ep-path">{{ e.path }}</code>
        <p v-if="e.desc" class="ep-desc">{{ e.desc }}</p>

        <el-alert
          v-if="e.warn"
          type="warning"
          :closable="false"
          show-icon
          class="ep-warn"
          :title="e.warn"
        />

        <div v-if="e.params?.length" class="table-wrap">
          <table class="param-table">
            <thead>
              <tr>
                <th>参数</th>
                <th>类型</th>
                <th>必填</th>
                <th>说明</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="p in e.params" :key="p.name">
                <td><code>{{ p.name }}</code></td>
                <td class="t-type">{{ p.type }}</td>
                <td>
                  <span :class="p.required ? 'req' : 'opt'">
                    {{ p.required ? '必填' : '可选' }}
                  </span>
                </td>
                <td class="t-desc">{{ p.desc }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="code-block">
          <div class="code-head">
            <span>{{ e.exampleLabel || '请求示例' }}</span>
            <el-button text size="small" @click="copy(e.example)">
              <Icon icon="mingcute:copy-2-line" width="15" height="15" />
              <span style="margin-left: 4px">复制</span>
            </el-button>
          </div>
          <pre><code>{{ e.example }}</code></pre>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onActivated, onBeforeUnmount } from 'vue'
import { Icon } from '@iconify/vue'
import { ElMessage } from 'element-plus'

function copy(text) {
  navigator.clipboard
    .writeText(text)
    .then(() => ElMessage.success('已复制'))
    .catch(() => ElMessage.error('复制失败'))
}

const activeId = ref('base')

function scrollTo(id) {
  const el = document.getElementById(`ep-${id}`)
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  activeId.value = id
}

/* 滚动联动高亮当前接口 */
let observer = null
function setupObserver() {
  if (observer) return
  const cards = Array.from(document.querySelectorAll('[data-epid]'))
  observer = new IntersectionObserver(
    (entries) => {
      entries
        .filter((en) => en.isIntersecting)
        .forEach((en) => (activeId.value = en.target.dataset.epid))
    },
    { rootMargin: '-90px 0px -65% 0px', threshold: 0 }
  )
  cards.forEach((c) => observer.observe(c))
}

onMounted(setupObserver)
onActivated(setupObserver)
onBeforeUnmount(() => observer?.disconnect())

const COMMON = [
  { name: 'model', type: 'string', required: true, desc: '模型名称，如 doubao-seedance-2-0-fast-260128 / doubao-seedance-2-0-260128' },
  { name: 'prompt', type: 'string', required: true, desc: '提示词' },
  { name: 'resolution', type: 'string', required: true, desc: '480p / 720p / 1080p（fast 不支持 1080p）' },
  { name: 'ratio', type: 'string', required: true, desc: '21:9 / 16:9 / 4:3 / 1:1 / 3:4 / 9:16 / adaptive，默认 adaptive' },
  { name: 'duration', type: 'integer', required: false, desc: '时长（秒），4–15，默认 5' },
  { name: 'generate_audio', type: 'boolean', required: false, desc: '是否生成有声视频，默认 true' },
  { name: 'watermark', type: 'boolean', required: false, desc: '是否含右下角 AI 水印，默认 false' },
]

const endpoints = [
  {
    id: 'text',
    name: '文生视频',
    method: 'POST',
    path: 'POST /v1/videos',
    url: 'https://docs-api.apifox.cn/456703490e0.md',
    desc: '最基础的纯文本生成视频，无需任何参考素材。',
    params: COMMON,
    example: `{
  "model": "doubao-seedance-2-0-fast-260128",
  "prompt": "一只橘猫在阳光下伸懒腰，温馨治愈风格",
  "resolution": "720p",
  "ratio": "16:9",
  "duration": 5,
  "generate_audio": true,
  "watermark": false
}`,
  },
  {
    id: 'frame',
    name: '首尾帧 / 图生视频',
    method: 'POST',
    path: 'POST /v1/videos',
    url: 'https://docs-api.apifox.cn/456703628e0.md',
    desc: '通过 content 数组传入参考图。图生视频-首帧、首尾帧、多模态参考为 3 种互斥场景。',
    warn: '图生视频-首帧、首尾帧、多模态参考生视频为 3 种互斥场景，不可混用。',
    params: [
      { name: 'content', type: 'array', required: true, desc: '输入素材数组，元素含 type=image_url、role、image_url.url' },
      { name: 'content[].role', type: 'string', required: true, desc: 'first_frame（首帧）/ last_frame（尾帧）/ reference_image（参考图）' },
      { name: 'return_last_frame', type: 'boolean', required: false, desc: '是否返回尾帧图像，默认 false' },
      { name: '其余参数', type: '—', required: false, desc: '同文生视频（model/prompt/resolution/ratio/duration…）' },
    ],
    example: `{
  "model": "doubao-seedance-2-0-260128",
  "prompt": "镜头平稳推进，人物表情自然变化",
  "content": [
    {
      "type": "image_url",
      "role": "first_frame",
      "image_url": { "url": "https://example.com/start.png" }
    },
    {
      "type": "image_url",
      "role": "last_frame",
      "image_url": { "url": "https://example.com/end.png" }
    }
  ],
  "return_last_frame": true,
  "resolution": "720p",
  "ratio": "16:9",
  "duration": 5
}`,
  },
  {
    id: 'multi',
    name: '多图参考生成',
    method: 'POST',
    path: 'POST /v1/videos',
    url: 'https://docs-api.apifox.cn/456703635e0.md',
    desc: 'content 数组传入多张参考图，role 统一为 reference_image，融合多图气质生成视频。',
    params: [
      { name: 'content', type: 'array', required: true, desc: '参考图数组，每项 type=image_url、role=reference_image、image_url.url' },
      { name: 'content[].role', type: 'string', required: true, desc: '固定为 reference_image' },
      { name: '其余参数', type: '—', required: true, desc: '同文生视频（model/prompt/resolution/ratio/duration）' },
    ],
    example: `{
  "model": "doubao-seedance-2-0-260128",
  "prompt": "融合多张参考图中的人物与场景气质，生成电影感短视频",
  "content": [
    { "type": "image_url", "role": "reference_image", "image_url": { "url": "https://example.com/ref1.png" } },
    { "type": "image_url", "role": "reference_image", "image_url": { "url": "https://example.com/ref2.png" } },
    { "type": "image_url", "role": "reference_image", "image_url": { "url": "https://example.com/ref3.png" } }
  ],
  "resolution": "720p",
  "ratio": "16:9",
  "duration": 5
}`,
  },
  {
    id: 'multimodal',
    name: '多模态视频生成',
    method: 'POST',
    path: 'POST /v1/videos',
    url: 'https://docs-api.apifox.cn/456703644e0.md',
    desc: 'content 支持图片、视频、音频混合输入；音频仅支持 reference_audio，需配合图或视频。',
    params: [
      { name: 'content[].image_url', type: 'object', required: false, desc: 'role 可选 first_frame / last_frame / reference_image，url 支持链接或 Base64' },
      { name: 'content[].video_url', type: 'object', required: false, desc: 'role 为 reference_video，url 为视频公网地址' },
      { name: 'content[].audio_url', type: 'object', required: false, desc: 'role 为 reference_audio，url 或 Base64 二选一' },
      { name: '其余参数', type: '—', required: true, desc: '同文生视频' },
    ],
    example: `{
  "model": "doubao-seedance-2-0-fast-260128",
  "prompt": "第一人称视角果茶宣传广告",
  "content": [
    { "type": "image_url", "role": "reference_image", "image_url": { "url": "https://.../pic1.jpg" } },
    { "type": "video_url", "role": "reference_video", "video_url": { "url": "https://.../video1.mp4" } },
    { "type": "audio_url", "role": "reference_audio", "audio_url": { "url": "https://.../audio1.mp3" } }
  ],
  "generate_audio": true,
  "ratio": "16:9",
  "duration": 11,
  "watermark": true
}`,
  },
  {
    id: 'official',
    name: '官方格式参数生成',
    method: 'POST',
    path: 'POST /v1/videos',
    url: 'https://docs-api.apifox.cn/456704217e0.md',
    desc: '官方原生格式：用 metadata 对象包装媒体数据与参数，整体结构同步官网接口。',
    params: [
      { name: 'metadata', type: 'object', required: true, desc: '媒体信息包装，内含 content 数组与 generate_audio/ratio/duration/watermark 等' },
      { name: 'metadata.content', type: 'array', required: true, desc: '同多模态：image_url / video_url / audio_url + role' },
      { name: 'model / prompt', type: 'string', required: true, desc: '置于顶层' },
    ],
    example: `{
  "model": "doubao-seedance-2-0-260128",
  "prompt": "首帧为图片1，尾帧定格为图片2，背景声音统一为女声",
  "metadata": {
    "content": [
      { "type": "image_url", "role": "reference_image", "image_url": { "url": "https://.../pic1.jpg" } },
      { "type": "video_url", "role": "reference_video", "video_url": { "url": "https://.../video1.mp4" } },
      { "type": "audio_url", "role": "reference_audio", "audio_url": { "url": "https://.../audio1.mp3" } }
    ],
    "generate_audio": true,
    "ratio": "16:9",
    "duration": 11,
    "watermark": true
  }
}`,
  },
  {
    id: 'query',
    name: '查询视频生成结果',
    method: 'GET',
    path: 'GET /v1/videos/{id}',
    url: 'https://docs-api.apifox.cn/456703505e0.md',
    desc: '用创建任务返回的 id 轮询状态；completed 时从 metadata.url 取视频链接。',
    params: [
      { name: 'id', type: 'string', required: true, desc: '路径参数，创建任务返回的 task id' },
      { name: 'status', type: 'string', required: true, desc: '响应字段：queued / in_progress / completed / failed' },
      { name: 'progress', type: 'integer', required: true, desc: '响应字段：进度 0–100' },
      { name: 'metadata.url', type: 'string', required: true, desc: '响应字段：完成后的视频下载链接' },
      { name: 'metadata.total_tokens', type: 'string', required: true, desc: '响应字段：本次消耗 token' },
    ],
    exampleLabel: '响应示例（completed）',
    example: `{
  "id": "task_qghsnDbtZo7FeliS4PAA1jGQsq1X1laH",
  "task_id": "task_qghsnDbtZo7FeliS4PAA1jGQsq1X1laH",
  "object": "video",
  "model": "doubao-seedance-2-0-fast-260128",
  "status": "completed",
  "progress": 100,
  "created_at": 1778479354,
  "completed_at": 1778479512,
  "metadata": {
    "url": "https://.../result.mp4",
    "total_tokens": "54789"
  }
}`,
  },
]
</script>

<style scoped>
/* 默认（窄屏）：目录在顶部横向滚动 */
.docs {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.toc {
  position: sticky;
  top: 62px;
  z-index: 5;
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding: 8px 0;
  background: var(--toc-sticky-bg);
}

.toc-chip {
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 9px 12px;
  border-radius: 10px;
  font-size: 13px;
  color: var(--el-text-color-regular);
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  cursor: pointer;
  flex-shrink: 0;
  transition: all 0.18s ease;
}
.toc-chip:hover {
  color: var(--el-text-color-primary);
  border-color: var(--nav-active-border);
}
.toc-chip.active {
  color: var(--toc-active-color);
  background: var(--nav-active-bg);
  border-color: var(--nav-active-border);
  box-shadow: var(--toc-active-glow);
}
.toc-name {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 右侧内容 */
.docs-main {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-width: 0;
}

.head {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
}

.card-hint {
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

/* 基础说明网格 */
.base-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px 24px;
}

.base-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.base-item .k {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.base-item .v {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: var(--el-text-color-regular);
  overflow-wrap: anywhere;
  word-break: break-word;
}

/* 方法徽章 */
.m {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.4px;
  padding: 2px 7px;
  border-radius: 6px;
  font-family: "SFMono-Regular", Menlo, monospace;
  flex-shrink: 0;
}
.m.post {
  color: var(--method-post-color);
  background: var(--method-post-bg);
  border: 1px solid var(--method-post-border);
}
.m.get {
  color: var(--method-get-color);
  background: var(--method-get-bg);
  border: 1px solid var(--method-get-border);
}

/* 接口卡片 */
.ep-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
}

.ep-title {
  display: flex;
  align-items: center;
  gap: 10px;
}

.ep-link {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: var(--el-color-primary);
  text-decoration: none;
  white-space: nowrap;
}
.ep-link:hover {
  color: var(--el-color-primary-light-3);
}

.ep-path {
  display: inline-block;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.ep-desc {
  margin: 8px 0 0;
  font-size: 13px;
  color: var(--el-text-color-regular);
  line-height: 1.7;
}

.ep-warn {
  margin-top: 12px;
}

/* 参数表 */
.table-wrap {
  margin-top: 14px;
  overflow-x: auto;
  border: 1px solid var(--glass-border);
  border-radius: 10px;
}

.param-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.param-table th {
  text-align: left;
  padding: 9px 12px;
  font-weight: 600;
  color: var(--el-text-color-secondary);
  background: var(--desc-cell-bg);
  border-bottom: 1px solid var(--glass-border);
  white-space: nowrap;
}

.param-table td {
  padding: 9px 12px;
  border-bottom: 1px solid var(--el-border-color-extra-light);
  vertical-align: top;
  color: var(--el-text-color-regular);
}

.param-table tr:last-child td {
  border-bottom: none;
}

.t-type {
  color: var(--el-text-color-secondary);
  font-family: "SFMono-Regular", Menlo, monospace;
  white-space: nowrap;
}

.t-desc {
  line-height: 1.6;
}

.req {
  color: #f0abfc;
}
.opt {
  color: var(--el-text-color-secondary);
}

/* 代码块 */
.code-block {
  margin-top: 14px;
  border-radius: 10px;
  overflow: hidden;
  border: 1px solid var(--glass-border);
  background: var(--code-block-bg);
}

.code-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 8px 6px 12px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  border-bottom: 1px solid var(--glass-border);
  background: var(--desc-cell-bg);
}

.code-block pre {
  margin: 0;
  padding: 14px;
  overflow-x: auto;
  font-size: 12.5px;
  line-height: 1.7;
  color: var(--code-block-text);
}

code {
  font-family: "SFMono-Regular", Menlo, monospace;
  background: var(--code-inline-bg);
  padding: 1px 6px;
  border-radius: 5px;
  color: var(--code-inline-color);
  font-size: 0.92em;
}

.code-block pre code {
  background: none;
  padding: 0;
  color: inherit;
}

/* 宽屏：目录占左列（文档流内 sticky），正文占右列，避免 fixed 与正文重叠 */
@media (min-width: 901px) {
  .docs {
    display: grid;
    grid-template-columns: minmax(168px, 200px) minmax(0, 1fr);
    gap: 20px;
    align-items: start;
  }
  .toc {
    position: sticky;
    top: 88px;
    left: auto;
    transform: none;
    flex-direction: column;
    gap: 6px;
    width: 100%;
    max-height: calc(100vh - 100px);
    overflow-y: auto;
    overflow-x: hidden;
    padding: 0;
    background: none;
    z-index: 1;
  }
  .toc-chip {
    width: 100%;
    min-width: 0;
  }
  .docs-main {
    width: 100%;
    margin: 0;
    min-width: 0;
  }
}

@media (max-width: 720px) {
  .base-grid {
    grid-template-columns: 1fr;
  }
}
</style>
