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
import { ElMessage } from 'element-plus'
import { uploadAsset } from '@/api/seedance'

const props = defineProps({
  accept: { type: String, default: 'image/*' },
})

// modelValue：回填到输入框的 URL；uploaded：通知父组件记录已上传的 url（用于销毁）
const emit = defineEmits(['update:modelValue', 'uploaded'])

const inputEl = ref(null)
const uploading = ref(false)

function trigger() {
  inputEl.value?.click()
}

async function onPick(e) {
  const file = e.target.files?.[0]
  e.target.value = '' // 允许重复选择同一文件
  if (!file) return
  uploading.value = true
  try {
    const { url } = await uploadAsset(file)
    emit('update:modelValue', url)
    emit('uploaded', url)
    ElMessage.success('已上传，链接已填入')
  } catch (err) {
    ElMessage.error(err.message || '上传失败')
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
