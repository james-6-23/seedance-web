<template>
  <div class="page">
    <el-card shadow="never" class="card">
      <template #header>
        <div class="card-head">
          <span class="card-title">API 配置</span>
          <span class="card-hint">填写星辰网关地址与国内 / 海外 API Key，配置自动保存在浏览器本地</span>
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
              国内 API Key（需 seedance 分组）
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
            v-model="domesticApiKeyInput"
            type="password"
            show-password
            placeholder="sk-..."
            spellcheck="false"
          />
        </el-form-item>

        <el-form-item>
          <template #label>
            <span class="key-label">
              海外 API Key（需 dreamina 分组）
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
            v-model="config.overseasApiKey"
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
    </el-card>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { Icon } from '@iconify/vue'
import { useConfigStore } from '@/store/config'

const config = useConfigStore()
const domesticApiKeyInput = computed({
  get: () => config.domesticApiKey || config.apiKey,
  set: (value) => {
    config.domesticApiKey = value
    config.apiKey = value
  },
})
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
</style>
