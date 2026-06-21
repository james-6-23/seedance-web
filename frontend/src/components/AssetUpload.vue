<template>
  <span class="asset-upload">
    <input
      ref="inputEl"
      type="file"
      :accept="accept"
      class="hidden-input"
      @change="onPick"
    />
    <el-button
      text
      type="primary"
      size="small"
      :loading="uploading"
      @click="trigger"
    >
      <Icon v-if="!uploading" icon="mingcute:upload-2-line" width="16" height="16" />
      <span class="label">{{ uploading ? '上传中…' : '上传' }}</span>
    </el-button>
  </span>
</template>

<script setup>
import { ref } from 'vue'
import { Icon } from '@iconify/vue'
import { ElNotification } from 'element-plus'
import { uploadAsset } from '@/api/seedance'

const props = defineProps({
  accept: { type: String, default: 'image/*' },
})

// modelValue：回填到输入框的 URL；uploaded：通知父组件记录已上传的 url（用于销毁）
const emit = defineEmits(['update:modelValue', 'uploaded'])

const inputEl = ref(null)
const uploading = ref(false)

// 图片规范（与火山引擎要求一致）
const IMG_MIN = 300
const IMG_MAX = 6000
const MAX_BYTES = 50 * 1024 * 1024 // 50MB，与 Worker 端一致

function trigger() {
  inputEl.value?.click()
}

// 左上角错误提示
function notifyError(message) {
  ElNotification.error({
    title: '无法使用该文件',
    message,
    position: 'top-left',
    duration: 4000,
  })
}

// 读取图片宽高，校验是否符合请求规范；返回 true 表示通过
function validateImage(file) {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      const { naturalWidth: w, naturalHeight: h } = img
      if (w < IMG_MIN || h < IMG_MIN) {
        notifyError(`图片尺寸过小（${w}×${h}），宽高需 ≥ ${IMG_MIN}px，请重新上传`)
        return resolve(false)
      }
      if (w > IMG_MAX || h > IMG_MAX) {
        notifyError(`图片尺寸过大（${w}×${h}），宽高需 ≤ ${IMG_MAX}px，请重新上传`)
        return resolve(false)
      }
      resolve(true)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      notifyError('无法读取该图片，请确认文件未损坏后重新上传')
      resolve(false)
    }
    img.src = url
  })
}

async function onPick(e) {
  const file = e.target.files?.[0]
  e.target.value = '' // 允许重复选择同一文件
  if (!file) return

  // 大小预校验
  if (file.size > MAX_BYTES) {
    notifyError('文件过大（上限 50MB），请压缩后重新上传')
    return
  }

  // 图片尺寸预校验：不合规则不上传到 R2，避免无谓的传后即删
  if (file.type.startsWith('image/')) {
    const ok = await validateImage(file)
    if (!ok) return
  }

  uploading.value = true
  try {
    const { url } = await uploadAsset(file)
    emit('update:modelValue', url)
    emit('uploaded', url)
    ElNotification.success({
      title: '上传成功',
      message: '链接已填入',
      position: 'top-left',
      duration: 2000,
    })
  } catch (err) {
    notifyError(err.message || '上传失败，请重试')
  } finally {
    uploading.value = false
  }
}
</script>

<style scoped>
.asset-upload {
  display: inline-flex;
}

.hidden-input {
  display: none;
}

.label {
  margin-left: 2px;
}
</style>
