<template>
  <div class="page">
    <el-card shadow="never" class="card">
      <template #header>
        <div class="card-head">
          <span class="card-title">API 配置</span>
          <span class="card-hint">填写星辰网关地址与 API Key，配置自动保存在浏览器本地</span>
        </div>
      </template>

      <el-form label-position="top" class="form">
        <el-form-item label="API 地址">
          <el-input
            v-model="config.apiBase"
            placeholder="https://your-api-domain.com"
            spellcheck="false"
          />
        </el-form-item>

        <el-form-item label="视频接口路径">
          <el-input v-model="config.apiPath" placeholder="/v1/videos" spellcheck="false" />
        </el-form-item>

        <el-form-item>
          <template #label>
            <span class="key-label">
              API Key（需 seedance 分组）
              <a
                class="key-link"
                href="https://ai.centos.hk/console/token"
                target="_blank"
                rel="noopener noreferrer"
              >
                前往创建 Key
                <Icon icon="mingcute:external-link-line" width="14" height="14" />
              </a>
            </span>
          </template>
          <el-input
            v-model="config.apiKey"
            type="password"
            show-password
            placeholder="sk-..."
            spellcheck="false"
          />
        </el-form-item>

        <el-form-item>
          <div class="switch-row">
            <el-switch v-model="config.useProxy" />
            <div class="switch-text">
              <span>使用同源代理转发（解决浏览器跨域）</span>
              <small v-if="config.useProxy">
                请求将转发到 <code>{{ config.apiBase }}</code>（由 Worker / server.py 代理）
              </small>
              <small v-else>关闭后浏览器直连上方地址，若上游未开放 CORS 可能失败</small>
            </div>
          </div>
        </el-form-item>
      </el-form>

      <el-alert
        type="info"
        :closable="false"
        show-icon
        title="配置实时生效"
        description="修改即保存，无需额外操作。API Key 仅存储在你本机浏览器中。"
      />

      <div class="backup-section">
        <div class="backup-head">
          <span class="backup-title">配置备份</span>
          <span class="backup-hint">
            建议导出备份。换域名、清缓存或项目大版本更新后，可用备份一键恢复 Key。
          </span>
        </div>
        <div class="backup-actions">
          <el-button @click="exportBackup">
            <Icon icon="mingcute:download-2-line" width="16" height="16" />
            <span>导出备份</span>
          </el-button>
          <el-button @click="copyBackup">
            <Icon icon="mingcute:copy-2-line" width="16" height="16" />
            <span>复制备份</span>
          </el-button>
          <el-button @click="pickBackupFile">
            <Icon icon="mingcute:upload-2-line" width="16" height="16" />
            <span>从文件恢复</span>
          </el-button>
          <input
            ref="fileInput"
            type="file"
            accept="application/json,.json"
            class="file-input"
            @change="onBackupFile"
          />
        </div>
        <p class="backup-note">
          配置按「网站域名」分别保存。例如
          <code>*.workers.dev</code>
          与自定义域名互不相通；换浏览器或无痕模式也需要重新填写或导入备份。
        </p>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { Icon } from '@iconify/vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useConfigStore } from '@/store/config'
import {
  buildConfigBackup,
  parseConfigBackup,
  applyConfigBackup,
  downloadConfigBackup,
} from '@/utils/config-storage'

const config = useConfigStore()
const fileInput = ref(null)

function exportBackup() {
  downloadConfigBackup(config)
  ElMessage.success('备份文件已下载')
}

function copyBackup() {
  const text = JSON.stringify(buildConfigBackup(config), null, 2)
  navigator.clipboard
    .writeText(text)
    .then(() => ElMessage.success('备份已复制到剪贴板'))
    .catch(() => ElMessage.error('复制失败，请改用导出备份'))
}

function pickBackupFile() {
  fileInput.value?.click()
}

async function restoreBackup(raw) {
  try {
    const cfg = parseConfigBackup(raw)
    await ElMessageBox.confirm(
      '将用备份覆盖当前 API 地址、路径、Key 与代理设置，是否继续？',
      '恢复配置',
      { type: 'warning', confirmButtonText: '恢复', cancelButtonText: '取消' }
    )
    applyConfigBackup(config, cfg)
    ElMessage.success('配置已从备份恢复')
  } catch (e) {
    if (e === 'cancel' || e === 'close') return
    ElMessage.error(e?.message || '备份无效，请检查文件内容')
  }
}

function onBackupFile(event) {
  const file = event.target.files?.[0]
  event.target.value = ''
  if (!file) return

  const reader = new FileReader()
  reader.onload = () => restoreBackup(reader.result)
  reader.onerror = () => ElMessage.error('读取文件失败')
  reader.readAsText(file)
}
</script>

<style scoped>
.page {
  max-width: 720px;
  margin: 0 auto;
}

.card-head {
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

.form {
  margin-bottom: 8px;
}

.switch-row {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.switch-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.switch-text small {
  color: var(--el-text-color-secondary);
}

code {
  color: var(--el-color-primary);
}

.key-label {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.key-link {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-size: 12px;
  font-weight: 500;
  color: var(--el-color-primary);
  text-decoration: none;
}

.key-link:hover {
  color: var(--el-color-primary-light-3);
}

.backup-section {
  margin-top: 20px;
  padding-top: 18px;
  border-top: 1px solid var(--glass-border);
}

.backup-head {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 12px;
}

.backup-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.backup-hint {
  font-size: 13px;
  color: var(--el-text-color-secondary);
  line-height: 1.6;
}

.backup-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.backup-actions .el-button {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.backup-note {
  margin: 12px 0 0;
  font-size: 12px;
  line-height: 1.7;
  color: var(--el-text-color-secondary);
}

.file-input {
  display: none;
}
</style>
