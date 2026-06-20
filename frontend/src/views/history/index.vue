<template>
  <div class="page">
    <el-card shadow="never" class="card">
      <template #header>
        <div class="head">
          <div>
            <span class="card-title">历史记录</span>
            <span class="card-hint">共 {{ history.total }} 条 · 仅保存在本机浏览器</span>
          </div>
          <el-button
            v-if="history.total"
            text
            type="danger"
            @click="confirmClear"
          >
            清空全部
          </el-button>
        </div>
      </template>

      <el-empty v-if="!history.total" description="暂无生成记录">
        <el-button type="primary" @click="router.push('/generate')">去生成视频</el-button>
      </el-empty>

      <div v-else class="list">
        <div v-for="item in pagedItems" :key="item.id" class="item">
          <div class="item-main">
            <div class="item-top">
              <el-tag size="small" effect="plain" :type="statusType(item.status)">
                {{ statusLabel(item.status) }}
              </el-tag>
              <el-tag size="small" effect="plain">{{ item.modeLabel }}</el-tag>
              <span class="item-time">{{ formatTime(item.createdAt) }}</span>
            </div>

            <p
              class="item-prompt"
              :class="{ expanded: expandedIds.has(item.id) }"
            >
              {{ item.prompt || '（无提示词）' }}
            </p>
            <el-button
              v-if="isLongPrompt(item.prompt)"
              text
              type="primary"
              size="small"
              class="prompt-toggle"
              @click="toggleExpand(item.id)"
            >
              {{ expandedIds.has(item.id) ? '收起' : '展开' }}
            </el-button>

            <div class="item-meta">
              <span class="model-name">{{ item.model || '—' }}</span>
              <span>{{ item.resolution }}</span>
              <span>{{ item.ratio }}</span>
              <span>{{ item.duration }}s</span>
              <span v-if="item.taskId" class="task-id">ID: {{ shortId(item.taskId) }}</span>
            </div>

            <p v-if="item.status === 'failed' && item.errorMessage" class="item-error">
              {{ item.errorMessage }}
            </p>
          </div>

          <div class="item-side">
            <div
              v-if="item.videoUrl"
              class="thumb-wrap"
              @click="openVideo(item.videoUrl)"
            >
              <video
                :src="item.videoUrl"
                class="thumb"
                muted
                playsinline
                preload="metadata"
              />
              <div class="play-overlay">
                <Icon icon="mingcute:play-circle-fill" width="40" height="40" />
              </div>
            </div>
            <div v-else class="thumb placeholder">
              <Icon :icon="statusIcon(item.status)" width="28" height="28" />
            </div>

            <div class="item-actions">
              <el-button
                v-if="item.formSnapshot"
                text
                type="primary"
                size="small"
                @click="restore(item.id)"
              >
                填入参数
              </el-button>
              <el-button
                v-if="item.videoUrl"
                text
                type="primary"
                size="small"
                @click="copy(item.videoUrl)"
              >
                复制链接
              </el-button>
              <el-button
                v-if="item.videoUrl"
                text
                type="primary"
                size="small"
                :loading="downloadingId === item.id"
                @click="download(item)"
              >
                下载
              </el-button>
              <el-button
                text
                type="danger"
                size="small"
                @click="history.removeRecord(item.id)"
              >
                删除
              </el-button>
            </div>
          </div>
        </div>

        <div v-if="history.total > PAGE_SIZE" class="pager">
          <el-pagination
            layout="prev, pager, next"
            background
            :total="history.total"
            :page-size="PAGE_SIZE"
            :current-page="currentPage"
            @current-change="onPageChange"
          />
        </div>
      </div>
    </el-card>

    <el-dialog
      v-model="playerVisible"
      width="720px"
      align-center
      append-to-body
      destroy-on-close
      class="video-dialog"
      :show-close="true"
      @closed="playerUrl = ''"
    >
      <video
        v-if="playerUrl"
        :src="playerUrl"
        class="player"
        controls
        autoplay
        playsinline
      />
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue'
import { Icon } from '@iconify/vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useHistoryStore } from '@/store/history'

const router = useRouter()
const history = useHistoryStore()

const PAGE_SIZE = 5
const PROMPT_LIMIT = 60

const playerVisible = ref(false)
const playerUrl = ref('')
const downloadingId = ref('')

const currentPage = ref(1)
const expandedIds = reactive(new Set())

const totalPages = computed(() =>
  Math.max(1, Math.ceil(history.total / PAGE_SIZE)),
)

const pagedItems = computed(() => {
  const start = (currentPage.value - 1) * PAGE_SIZE
  return history.sortedItems.slice(start, start + PAGE_SIZE)
})

// 记录数变化（删除/清空）后，避免停留在不存在的空白页
watch(totalPages, (pages) => {
  if (currentPage.value > pages) currentPage.value = pages
})

function isLongPrompt(prompt) {
  return (prompt || '').length > PROMPT_LIMIT
}

function toggleExpand(id) {
  if (expandedIds.has(id)) expandedIds.delete(id)
  else expandedIds.add(id)
}

function onPageChange(page) {
  currentPage.value = page
}

const STATUS_MAP = {
  processing: { label: '生成中', type: 'warning', icon: 'mingcute:loading-3-line' },
  completed: { label: '已完成', type: 'success', icon: 'mingcute:check-circle-line' },
  failed: { label: '失败', type: 'danger', icon: 'mingcute:close-circle-line' },
  cancelled: { label: '已取消', type: 'info', icon: 'mingcute:time-line' },
}

function statusLabel(status) {
  return STATUS_MAP[status]?.label || status
}

function statusType(status) {
  return STATUS_MAP[status]?.type || 'info'
}

function statusIcon(status) {
  return STATUS_MAP[status]?.icon || 'mingcute:video-line'
}

function formatTime(ts) {
  return new Date(ts).toLocaleString('zh-CN', { hour12: false })
}

function shortId(id) {
  if (!id || id.length <= 14) return id
  return `${id.slice(0, 8)}…${id.slice(-4)}`
}

function copy(text) {
  navigator.clipboard
    .writeText(text)
    .then(() => ElMessage.success('已复制'))
    .catch(() => ElMessage.error('复制失败'))
}

function openVideo(url) {
  playerUrl.value = url
  playerVisible.value = true
}

async function download(item) {
  const url = item.videoUrl
  if (!url || downloadingId.value) return
  const filename = `seedance-${item.taskId || item.id}.mp4`
  downloadingId.value = item.id
  try {
    const res = await fetch(url)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const blob = await res.blob()
    const objectUrl = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = objectUrl
    a.download = filename
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(objectUrl)
    ElMessage.success('已开始下载')
  } catch (err) {
    // 跨域等原因导致 fetch 失败时，退回到新标签页打开，由浏览器处理
    window.open(url, '_blank', 'noopener,noreferrer')
    ElMessage.warning('无法直接下载，已在新标签页打开')
  } finally {
    downloadingId.value = ''
  }
}

function restore(id) {
  if (!history.prepareRestore(id)) {
    ElMessage.warning('该记录没有可恢复的参数')
    return
  }
  router.push('/generate')
}

function confirmClear() {
  ElMessageBox.confirm('确定清空全部历史记录？此操作不可恢复。', '清空历史', {
    type: 'warning',
    confirmButtonText: '清空',
    cancelButtonText: '取消',
  })
    .then(() => {
      history.clearAll()
      ElMessage.success('已清空')
    })
    .catch(() => {})
}
</script>

<style scoped>
.page {
  max-width: 960px;
  margin: 0 auto;
}

.head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.card-title {
  display: block;
  font-size: 16px;
  font-weight: 600;
}

.card-hint {
  display: block;
  margin-top: 4px;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.item {
  display: flex;
  gap: 16px;
  padding: 14px;
  border-radius: 12px;
  border: 1px solid var(--glass-border);
  background: var(--soft-fill);
}

.item-main {
  flex: 1;
  min-width: 0;
}

.item-top {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.item-time {
  margin-left: auto;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.item-prompt {
  font-size: 14px;
  line-height: 1.6;
  color: var(--el-text-color-primary);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.item-prompt.expanded {
  display: block;
  -webkit-line-clamp: unset;
  overflow: visible;
  white-space: pre-wrap;
}

.prompt-toggle {
  height: auto;
  padding: 2px 0;
  margin-top: 2px;
}

.pager {
  display: flex;
  justify-content: center;
  margin-top: 16px;
}

.item-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 8px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.task-id {
  font-family: "SFMono-Regular", Menlo, monospace;
}

.model-name {
  font-family: "SFMono-Regular", Menlo, monospace;
  word-break: break-all;
}

.item-error {
  margin-top: 8px;
  font-size: 12px;
  color: var(--el-color-danger);
  line-height: 1.5;
}

.item-side {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
  flex-shrink: 0;
}

.thumb {
  width: 120px;
  height: 68px;
  border-radius: 8px;
  object-fit: cover;
  background: #000;
  cursor: pointer;
}

.thumb-wrap {
  position: relative;
  width: 120px;
  height: 68px;
  cursor: pointer;
}

.thumb-wrap .thumb {
  width: 100%;
  height: 100%;
  display: block;
}

.play-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  color: #fff;
  background: rgba(0, 0, 0, 0.28);
  opacity: 0.85;
  transition: opacity 0.15s ease, background 0.15s ease;
  pointer-events: none;
}

.thumb-wrap:hover .play-overlay {
  opacity: 1;
  background: rgba(0, 0, 0, 0.4);
}

.player {
  width: 100%;
  max-height: 70vh;
  display: block;
  border-radius: 8px;
  background: #000;
}

.thumb.placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--el-text-color-secondary);
  background: var(--el-bg-color);
  border: 1px solid var(--glass-border);
  cursor: default;
}

.item-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 2px;
}

@media (max-width: 720px) {
  .item {
    flex-direction: column;
  }
  .item-side {
    align-items: stretch;
  }
  .thumb-wrap,
  .thumb {
    width: 100%;
    height: auto;
    aspect-ratio: 16 / 9;
  }
  .item-actions {
    justify-content: flex-start;
  }
  .item-time {
    margin-left: 0;
    width: 100%;
  }
}
</style>