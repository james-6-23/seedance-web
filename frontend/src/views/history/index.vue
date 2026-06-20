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
        <div v-for="item in history.sortedItems" :key="item.id" class="item">
          <div class="item-main">
            <div class="item-top">
              <el-tag size="small" effect="plain" :type="statusType(item.status)">
                {{ statusLabel(item.status) }}
              </el-tag>
              <el-tag size="small" effect="plain">{{ item.modeLabel }}</el-tag>
              <span class="item-time">{{ formatTime(item.createdAt) }}</span>
            </div>

            <p class="item-prompt">{{ item.prompt || '（无提示词）' }}</p>

            <div class="item-meta">
              <span>{{ shortModel(item.model) }}</span>
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
            <video
              v-if="item.videoUrl"
              :src="item.videoUrl"
              class="thumb"
              muted
              playsinline
              preload="metadata"
              @click="openVideo(item.videoUrl)"
            />
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
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { Icon } from '@iconify/vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useHistoryStore } from '@/store/history'

const router = useRouter()
const history = useHistoryStore()

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

function shortModel(model) {
  if (!model) return '—'
  return model.includes('fast') ? 'fast' : '标准'
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
  window.open(url, '_blank', 'noopener,noreferrer')
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