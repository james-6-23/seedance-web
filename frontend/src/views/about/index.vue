<template>
  <div class="page">
    <el-card shadow="never" class="card">
      <template #header>
        <span class="card-title">快速开始</span>
      </template>
      <ol class="steps">
        <li>
          打开「<b>API 配置</b>」，填写网关地址与 API Key。
          还没有 Key？
          <a
            class="link"
            href="https://ai.centos.hk/console/token"
            target="_blank"
            rel="noopener noreferrer"
          >前往创建</a>
        </li>
        <li>进入「<b>视频生成</b>」，选择生成模式，填写提示词和相关参数。</li>
        <li>点击生成后等待进度完成，即可在线预览、复制或下载视频。</li>
        <li>所有生成记录会保存在「<b>历史记录</b>」中，仅存储在本机浏览器，可随时查看或重新填入参数。</li>
      </ol>
    </el-card>

    <el-card shadow="never" class="card">
      <template #header>
        <span class="card-title">生成模式说明</span>
      </template>
      <ul class="notice">
        <li><b>文生视频</b>：只用文字描述生成视频，适合从零创作。</li>
        <li><b>首帧 / 图参考</b>：提供一张参考图作为起始画面，按提示词延展成视频。</li>
        <li><b>首尾帧</b>：分别提供开始和结束画面，生成中间过渡动画。</li>
        <li><b>多图参考</b>：多张图片共同影响画面风格与内容。</li>
        <li><b>多模态</b>：支持图片、视频、音频混合参考，适合更复杂的创作需求。</li>
      </ul>
    </el-card>

    <el-card shadow="never" class="card">
      <template #header>
        <span class="card-title">注意事项</span>
      </template>
      <ul class="notice">
        <li>API Key 须为 <code>seedance</code> 分组，否则可能提示 <code>model_price_error</code>。</li>
        <li>提示词建议写清楚画面主体、镜头运动、风格氛围，中文不超过 500 字。</li>
        <li>视频生成需要一定时间，请耐心等待，不要重复提交相同任务。</li>
        <li>生成完成后的视频链接约 <b>24 小时</b>有效，请及时下载保存到本地。</li>
        <li>若出现请求失败，可在「API 配置」中开启<b>同源代理转发</b>后再试。</li>
        <li>API Key 仅保存在你的浏览器本地，不会上传到第三方服务器。</li>
      </ul>
    </el-card>
  </div>
</template>

<script setup></script>

<style scoped>
.page {
  max-width: 720px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
}

.steps {
  display: flex;
  flex-direction: column;
  gap: 12px;
  line-height: 1.7;
  color: var(--el-text-color-regular);
  padding-left: 20px;
}

.steps li {
  padding-left: 4px;
}

.steps li::marker {
  color: var(--el-color-primary);
  font-weight: 700;
}

.notice {
  display: flex;
  flex-direction: column;
  gap: 10px;
  line-height: 1.7;
  color: var(--el-text-color-regular);
}

.notice li {
  padding-left: 16px;
  position: relative;
}

.notice li::before {
  content: '';
  position: absolute;
  left: 0;
  top: 10px;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--el-color-primary);
}

.link {
  color: var(--el-color-primary);
  text-decoration: none;
  font-weight: 500;
}

.link:hover {
  color: var(--el-color-primary-light-3);
}

code {
  background: var(--soft-fill);
  padding: 1px 6px;
  border-radius: 4px;
  color: var(--el-color-primary);
}
</style>