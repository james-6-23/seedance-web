<template>
  <div class="generate-page" :class="ui.genMode">
    <div class="page-toolbar">
      <div class="toolbar-info">
        <span class="page-title">视频生成</span>
        <transition name="sub-fade" mode="out-in">
          <span :key="ui.genMode" class="page-sub">
            {{ ui.isBeginner ? '简单几步，快速出片' : '完整参数与调试信息' }}
          </span>
        </transition>
      </div>
      <el-segmented v-model="ui.genMode" :options="VIEW_MODES" class="mode-segmented" />
    </div>

    <transition name="view-switch" mode="out-in">
    <div :key="ui.genMode" class="view-body">
    <el-alert
      v-if="ui.isBeginner && missingApiKey"
      type="warning"
      :closable="false"
      show-icon
      class="config-alert"
      title="请先配置 API Key"
      description="生成视频前需要填写网关地址与 API Key。"
    >
      <router-link to="/config" class="alert-link">前往 API 配置</router-link>
    </el-alert>

    <div class="workspace">
    <!-- 生成参数 -->
    <el-card shadow="never" class="card">
      <template #header>
        <span class="card-title">{{ ui.isBeginner ? '创作向导' : '生成参数' }}</span>
      </template>

      <!-- 新手：步骤引导 -->
      <div v-if="ui.isBeginner" class="step-guide">
        <div v-for="s in BEGINNER_STEPS" :key="s.step" class="step-item">
          <span class="step-num">{{ s.step }}</span>
          <div class="step-content">
            <span class="step-title">{{ s.title }}</span>
            <span class="step-desc">{{ s.desc }}</span>
          </div>
        </div>
      </div>

      <!-- 新手：创作方式卡片 -->
      <template v-if="ui.isBeginner">
        <p class="section-label">① 选择创作方式</p>
        <div class="mode-cards">
          <button
            v-for="m in basicModeCards"
            :key="m.key"
            type="button"
            class="mode-card"
            :class="{ active: mode === m.key }"
            @click="selectMode(m.key)"
          >
            <span v-if="m.tag" class="mode-card-tag">{{ m.tag }}</span>
            <Icon :icon="m.icon" width="22" height="22" class="mode-card-icon" />
            <span class="mode-card-title">{{ m.label }}</span>
            <span class="mode-card-desc">{{ m.desc }}</span>
          </button>
        </div>
        <button
          v-if="advancedModeCards.length"
          type="button"
          class="advanced-toggle"
          @click="showAdvancedModes = !showAdvancedModes"
        >
          <Icon
            :icon="showAdvancedModes ? 'mingcute:up-line' : 'mingcute:down-line'"
            width="16"
            height="16"
          />
          {{ showAdvancedModes ? '收起进阶模式' : '展开进阶模式（首尾帧 / 多图 / 多模态）' }}
        </button>
        <div v-if="showAdvancedModes" class="mode-cards mode-cards-advanced">
          <button
            v-for="m in advancedModeCards"
            :key="m.key"
            type="button"
            class="mode-card"
            :class="{ active: mode === m.key }"
            @click="selectMode(m.key)"
          >
            <Icon :icon="m.icon" width="22" height="22" class="mode-card-icon" />
            <span class="mode-card-title">{{ m.label }}</span>
            <span class="mode-card-desc">{{ m.desc }}</span>
          </button>
        </div>
        <div class="mode-detail">
          <div class="mode-detail-head">
            <Icon icon="mingcute:information-line" width="18" height="18" />
            <span>{{ currentModeDetail.title }}</span>
          </div>
          <ul class="mode-detail-list">
            <li v-for="(pt, i) in currentModeDetail.points" :key="i">{{ pt }}</li>
          </ul>
        </div>
      </template>

      <!-- 专业：Tab 切换 -->
      <el-tabs v-else v-model="mode" class="mode-tabs">
        <el-tab-pane
          v-for="m in MODES"
          :key="m.key"
          :label="m.label"
          :name="m.key"
        />
      </el-tabs>

      <p v-if="ui.isPro" class="mode-hint">{{ MODE_HINTS[mode] }}</p>

      <el-form label-position="top">
        <p v-if="ui.isBeginner" class="section-label">② 调整画面设置</p>
        <div class="grid" :class="{ 'grid-beginner': ui.isBeginner }">
          <el-form-item label="模型">
            <el-select v-model="form.model" @change="onModelChange">
              <el-option
                :label="formatModelLabel(MODEL_FAST, { beginner: ui.isBeginner })"
                :value="MODEL_FAST"
              />
              <el-option
                :label="formatModelLabel(MODEL_STANDARD, { beginner: ui.isBeginner })"
                :value="MODEL_STANDARD"
              />
            </el-select>
            <p v-if="ui.isBeginner" class="field-hint">{{ BEGINNER_FIELD_HINTS.model }}</p>
          </el-form-item>

          <el-form-item :label="ui.isBeginner ? '清晰度' : resolutionLabel">
            <el-select v-model="form.resolution">
              <el-option
                v-for="r in resolutions"
                :key="r"
                :label="ui.isBeginner ? (RESOLUTION_LABELS[r] || r) : r"
                :value="r"
              />
            </el-select>
            <p v-if="ui.isBeginner" class="field-hint">{{ BEGINNER_FIELD_HINTS.resolution }}</p>
          </el-form-item>

          <el-form-item :label="ui.isBeginner ? '画面比例' : '画幅比例'">
            <el-select v-model="form.ratio">
              <el-option
                v-for="r in RATIOS"
                :key="r"
                :label="ui.isBeginner ? (RATIO_LABELS[r] || r) : r"
                :value="r"
              />
            </el-select>
            <p v-if="ui.isBeginner" class="field-hint">{{ BEGINNER_FIELD_HINTS.ratio }}</p>
          </el-form-item>

          <el-form-item :label="ui.isBeginner ? '视频时长' : durationLabel">
            <el-select v-model="form.duration">
              <el-option v-for="d in DURATIONS" :key="d" :label="`${d} 秒`" :value="d" />
            </el-select>
            <p v-if="ui.isBeginner" class="field-hint">{{ BEGINNER_FIELD_HINTS.duration }}</p>
          </el-form-item>

          <el-form-item class="span-2">
            <template #label>
              <span>{{ ui.isBeginner ? '③ 描述你想要的画面' : '提示词' }}</span>
            </template>
            <el-mention
              v-model="form.prompt"
              :options="mentionOptions"
              type="textarea"
              :rows="ui.isBeginner ? 4 : 3"
              :maxlength="PROMPT_MAX"
              show-word-limit
              whole
              :placeholder="promptPlaceholder"
            />
            <p v-if="ui.isBeginner" class="field-hint">{{ BEGINNER_FIELD_HINTS.prompt }}</p>
            <div v-if="ui.isBeginner" class="prompt-examples">
              <span class="prompt-examples-label">试试这些示例：</span>
              <button
                v-for="ex in PROMPT_EXAMPLES"
                :key="ex.label"
                type="button"
                class="prompt-chip"
                @click="applyPromptExample(ex.text)"
              >
                {{ ex.label }}
              </button>
            </div>
            <el-collapse v-if="ui.isBeginner" class="prompt-tips-collapse">
              <el-collapse-item title="不知道怎么写？看这里">
                <ul class="prompt-tips-list">
                  <li v-for="(tip, i) in PROMPT_WRITING_TIPS" :key="i">{{ tip }}</li>
                </ul>
              </el-collapse-item>
            </el-collapse>
          </el-form-item>

          <!-- 首帧 / 图参考 -->
          <template v-if="mode === 'first_frame'">
            <el-form-item :label="ui.isBeginner ? '参考图片链接' : '首帧 / 参考图 URL'" class="span-2">
              <div class="mm-item">
                <span class="mm-tag">@{{ form.imageRole === 'reference_image' ? 'Image1' : 'FirstFrame' }}</span>
                <el-input
                  v-model="form.firstFrameUrl"
                  :placeholder="ui.isBeginner ? '粘贴图片的网络地址，如 https://...' : 'https://example.com/image.png'"
                />
                <AssetUpload
                  accept="image/*"
                  v-model="form.firstFrameUrl"
                  @uploaded="trackUpload"
                />
              </div>
              <p v-if="ui.isBeginner" class="field-hint">{{ BEGINNER_FIELD_HINTS.firstFrameUrl }}</p>
            </el-form-item>
            <el-form-item :label="ui.isBeginner ? '图片怎么用' : '图片角色'">
              <el-select v-model="form.imageRole">
                <el-option
                  :label="ui.isBeginner ? '作为起始画面（推荐）' : 'first_frame（首帧）'"
                  value="first_frame"
                />
                <el-option
                  :label="ui.isBeginner ? '仅借鉴风格' : 'reference_image（参考图）'"
                  value="reference_image"
                />
              </el-select>
              <p v-if="ui.isBeginner" class="field-hint">{{ BEGINNER_FIELD_HINTS.imageRole }}</p>
            </el-form-item>
          </template>

          <!-- 首尾帧 -->
          <template v-else-if="mode === 'first_last'">
            <el-form-item :label="ui.isBeginner ? '开始画面（图片链接）' : '首帧图 URL'" class="span-2">
              <div class="mm-item">
                <span class="mm-tag">@FirstFrame</span>
                <el-input v-model="form.firstFrameUrl" placeholder="https://example.com/start.png" />
                <AssetUpload accept="image/*" v-model="form.firstFrameUrl" @uploaded="trackUpload" />
              </div>
              <p v-if="ui.isBeginner" class="field-hint">{{ BEGINNER_FIELD_HINTS.firstFrameUrl }}</p>
            </el-form-item>
            <el-form-item :label="ui.isBeginner ? '结束画面（图片链接）' : '尾帧图 URL'" class="span-2">
              <div class="mm-item">
                <span class="mm-tag">@LastFrame</span>
                <el-input v-model="form.lastFrameUrl" placeholder="https://example.com/end.png" />
                <AssetUpload accept="image/*" v-model="form.lastFrameUrl" @uploaded="trackUpload" />
              </div>
              <p v-if="ui.isBeginner" class="field-hint">{{ BEGINNER_FIELD_HINTS.lastFrameUrl }}</p>
            </el-form-item>
          </template>

          <!-- 多图参考 -->
          <template v-else-if="mode === 'multi_image'">
            <el-form-item :label="ui.isBeginner ? '参考图片（可多张）' : '参考图 URL 列表'" class="span-2">
              <div class="url-list">
                <div v-for="(u, i) in form.refImageList" :key="i" class="mm-item">
                  <span class="mm-tag">@Image{{ i + 1 }}</span>
                  <el-input
                    v-model="form.refImageList[i]"
                    placeholder="https://example.com/ref.png"
                  />
                  <AssetUpload
                    accept="image/*"
                    v-model="form.refImageList[i]"
                    @uploaded="trackUpload"
                  />
                  <el-button
                    circle
                    :disabled="form.refImageList.length <= 1"
                    @click="removeRefImage(i)"
                  >
                    <Icon icon="mingcute:close-line" width="16" height="16" />
                  </el-button>
                </div>
                <el-button text type="primary" @click="form.refImageList.push('')">
                  + 添加参考图
                </el-button>
              </div>
              <p v-if="ui.isBeginner" class="field-hint">{{ BEGINNER_FIELD_HINTS.refImageList }}</p>
            </el-form-item>
          </template>

          <!-- 多模态：多素材 + @ 引用 -->
          <template v-else-if="mode === 'multimodal'">
            <!-- 参考图片 -->
            <el-form-item class="span-2">
              <template #label>
                <span>参考图片 <span class="mm-count">{{ mmCounts.image }}/{{ MM_LIMITS.image }}</span></span>
              </template>
              <div class="mm-group">
                <div v-for="(item, i) in form.refImages" :key="`img-${i}`" class="mm-item">
                  <span class="mm-tag">@Image{{ i + 1 }}</span>
                  <el-input v-model="item.url" placeholder="https://example.com/ref.png 或点击上传" />
                  <AssetUpload
                    accept="image/*"
                    @uploaded="(url) => onMaterialUploaded('image', i, url)"
                  />
                  <el-button circle @click="removeMaterial('image', i)">
                    <Icon icon="mingcute:close-line" width="16" height="16" />
                  </el-button>
                </div>
                <el-button
                  text
                  type="primary"
                  :disabled="mmCounts.image >= MM_LIMITS.image"
                  @click="addMaterial('image')"
                >
                  + 添加参考图
                </el-button>
              </div>
            </el-form-item>

            <!-- 参考视频 -->
            <el-form-item class="span-2">
              <template #label>
                <span>参考视频 <span class="mm-count">{{ mmCounts.video }}/{{ MM_LIMITS.video }}</span></span>
              </template>
              <div class="mm-group">
                <div v-for="(item, i) in form.refVideos" :key="`vid-${i}`" class="mm-item">
                  <span class="mm-tag">@Video{{ i + 1 }}</span>
                  <el-input v-model="item.url" placeholder="https://example.com/ref.mp4 或点击上传" />
                  <AssetUpload
                    accept="video/*"
                    @uploaded="(url) => onMaterialUploaded('video', i, url)"
                  />
                  <el-button circle @click="removeMaterial('video', i)">
                    <Icon icon="mingcute:close-line" width="16" height="16" />
                  </el-button>
                </div>
                <el-button
                  text
                  type="primary"
                  :disabled="mmCounts.video >= MM_LIMITS.video"
                  @click="addMaterial('video')"
                >
                  + 添加参考视频
                </el-button>
              </div>
            </el-form-item>

            <!-- 参考音频 -->
            <el-form-item class="span-2">
              <template #label>
                <span>参考音频 <span class="mm-count">{{ mmCounts.audio }}/{{ MM_LIMITS.audio }}</span> <span class="mm-hint-inline">需配合图或视频</span></span>
              </template>
              <div class="mm-group">
                <div v-for="(item, i) in form.refAudios" :key="`aud-${i}`" class="mm-item">
                  <span class="mm-tag">@Audio{{ i + 1 }}</span>
                  <el-input v-model="item.url" placeholder="https://example.com/ref.mp3 或点击上传" />
                  <AssetUpload
                    accept="audio/*"
                    @uploaded="(url) => onMaterialUploaded('audio', i, url)"
                  />
                  <el-button circle @click="removeMaterial('audio', i)">
                    <Icon icon="mingcute:close-line" width="16" height="16" />
                  </el-button>
                </div>
                <el-button
                  text
                  type="primary"
                  :disabled="mmCounts.audio >= MM_LIMITS.audio"
                  @click="addMaterial('audio')"
                >
                  + 添加参考音频
                </el-button>
              </div>
            </el-form-item>

            <!-- 多重参考指南 -->
            <el-form-item class="span-2">
              <div class="mm-guide">
                <div class="mm-guide-title">
                  <Icon icon="mingcute:information-line" width="16" height="16" />
                  <span>多重参考指南</span>
                </div>
                <p class="mm-guide-tip">
                  在提示词中输入 <code>@</code> 可快速插入已上传的素材引用（如
                  <code>@Image1</code>、<code>@Video1</code>、<code>@Audio1</code>），
                  让 AI 明确知道使用哪份素材。提交时会自动转为「图片1 / 视频1 / 音频1」。
                </p>
                <ul class="mm-guide-list">
                  <li>最多 9 张参考图、3 个参考视频、3 个参考音频</li>
                  <li>视频 / 音频总时长建议 ≤ 15 秒</li>
                  <li>音频不能单独使用，至少需要一张图片或一个视频</li>
                </ul>
              </div>
            </el-form-item>
          </template>
        </div>

        <!-- 新手：带说明的开关 -->
        <div v-if="ui.isBeginner" class="option-cards">
          <p class="section-label">其他选项</p>
          <div class="option-card">
            <el-switch v-model="form.generateAudio" />
            <div class="option-card-text">
              <span class="option-card-title">{{ BEGINNER_OPTION_HINTS.generateAudio.title }}</span>
              <span class="option-card-desc">{{ BEGINNER_OPTION_HINTS.generateAudio.desc }}</span>
            </div>
          </div>
          <div class="option-card">
            <el-switch v-model="form.watermark" />
            <div class="option-card-text">
              <span class="option-card-title">{{ BEGINNER_OPTION_HINTS.watermark.title }}</span>
              <span class="option-card-desc">{{ BEGINNER_OPTION_HINTS.watermark.desc }}</span>
            </div>
          </div>
          <div class="option-card">
            <el-switch v-model="form.returnLastFrame" />
            <div class="option-card-text">
              <span class="option-card-title">{{ BEGINNER_OPTION_HINTS.returnLastFrame.title }}</span>
              <span class="option-card-desc">{{ BEGINNER_OPTION_HINTS.returnLastFrame.desc }}</span>
            </div>
          </div>
        </div>

        <!-- 专业：简洁开关 -->
        <div v-else class="options">
          <el-switch v-model="form.generateAudio" active-text="生成音频" />
          <el-switch v-model="form.watermark" active-text="添加水印" />
          <el-switch v-model="form.returnLastFrame" active-text="返回尾帧图" />
        </div>

        <div v-if="ui.isPro" class="actions">
          <el-button
            type="primary"
            :loading="generating"
            @click="handleGenerate"
          >
            {{ generating ? '生成中…' : '开始生成' }}
          </el-button>
          <el-button v-if="generating" @click="cancel">取消轮询</el-button>
        </div>

        <div v-if="ui.isBeginner" class="actions actions-beginner">
          <el-button
            type="primary"
            :loading="generating"
            @click="handleGenerate"
          >
            {{ generating ? '生成中…' : '开始生成' }}
          </el-button>
          <el-button v-if="generating" @click="cancel">取消</el-button>
        </div>
      </el-form>
    </el-card>

    <!-- 生成结果 -->
    <div ref="resultPanel" class="result-panel">
    <el-card shadow="never" class="card result-card">
      <template #header>
        <span class="card-title">{{ ui.isBeginner ? '生成进度' : '生成结果' }}</span>
      </template>

      <div class="result-body">
      <!-- 新手：空闲引导 -->
      <div v-if="ui.isBeginner && status.state === 'idle' && !logs.length" class="beginner-tips block">
        <div class="beginner-tips-head">
          <Icon icon="mingcute:lightbulb-line" width="20" height="20" />
          <span>生成前小贴士</span>
        </div>
        <ul>
          <li>第一次用？选「文生视频」，填好提示词就能开始</li>
          <li>生成通常需要 <b>1–3 分钟</b>，右侧会实时显示进度</li>
          <li>视频链接约 <b>24 小时</b>有效，完成后请尽快下载</li>
          <li>所有记录自动保存在「历史记录」，可随时找回</li>
        </ul>
        <p class="beginner-tips-foot">
          还没配置 API Key？
          <router-link to="/config" class="alert-link">前往配置</router-link>
        </p>
      </div>

      <!-- 状态 -->
      <div class="status" :class="status.state">
        <div class="status-icon">
          <Icon
            :icon="displayStatus.icon"
            width="22"
            height="22"
            :class="{ 'status-icon-spin': status.state === 'queued' || status.state === 'processing' }"
          />
        </div>
        <div class="status-text">
          <div class="status-title">{{ displayStatus.title }}</div>
          <div class="status-desc">{{ displayStatus.desc }}</div>
        </div>
      </div>
      <el-progress
        v-if="status.showProgress"
        :percentage="status.progress"
        :status="status.state === 'error' ? 'exception' : status.state === 'success' ? 'success' : ''"
        :stroke-width="ui.isBeginner ? 10 : 8"
        class="progress"
      />

      <!-- 新手：实时动态 -->
      <div v-if="ui.isBeginner" class="live-log block">
        <div class="live-log-head">
          <span>实时动态</span>
          <el-tag v-if="generating" size="small" type="warning" effect="plain">进行中</el-tag>
          <el-tag v-else-if="status.state === 'success'" size="small" type="success" effect="plain">
            已完成
          </el-tag>
        </div>
        <div ref="liveLogBox" class="live-log-list">
          <div
            v-for="(line, i) in displayLogs"
            :key="i"
            class="live-log-item"
            :class="line.level"
          >
            <span class="live-dot" aria-hidden="true"></span>
            <div class="live-body">
              <span class="live-text">{{ line.text }}</span>
              <span class="live-time">{{ line.time }}</span>
            </div>
          </div>
          <div v-if="!displayLogs.length" class="live-empty">
            点击「开始生成」后，这里会实时显示进度
          </div>
        </div>
      </div>

      <!-- 错误 -->
      <el-alert
        v-if="error"
        type="error"
        :closable="false"
        show-icon
        class="block"
        :title="ui.isBeginner ? '生成遇到问题' : `${error.primaryCode}${errorHttp ? ' · HTTP ' + errorHttp : ''}`"
      >
        <div class="error-msg">{{ error.primaryMessage }}</div>
        <p v-if="ui.isBeginner && beginnerErrorTip" class="error-tip">{{ beginnerErrorTip }}</p>
        <div v-if="ui.isPro && error.layers.length" class="error-chain">
          <div
            v-for="(l, i) in error.layers"
            :key="i"
            class="chain-item"
            :style="{ paddingLeft: l.depth * 10 + 'px' }"
          >
            <el-tag size="small" type="info" effect="plain">{{ l.type }}</el-tag>
            <span>{{ l.text }}</span>
          </div>
        </div>
      </el-alert>

      <!-- 任务信息 -->
      <el-descriptions v-if="ui.isPro && taskId" :column="1" border size="small" class="block">
        <el-descriptions-item label="Task ID">
          <div class="copy-row">
            <code>{{ taskId }}</code>
            <el-button text type="primary" size="small" @click="copy(taskId)">复制</el-button>
          </div>
        </el-descriptions-item>
        <el-descriptions-item label="轮询状态">
          <span :class="`poll-${pollLevel}`">{{ pollText }}</span>
        </el-descriptions-item>
      </el-descriptions>

      <!-- 视频结果 -->
      <div v-if="videoUrl" class="video-result block">
        <div class="player-wrap">
          <video :src="videoUrl" controls playsinline class="player"></video>
        </div>

        <!-- 尾帧图：API 返回 return_last_frame 时展示 -->
        <div v-if="lastFrameUrl" class="last-frame">
          <div class="last-frame-info">
            <img :src="lastFrameUrl" class="last-frame-thumb" alt="尾帧图" />
            <div class="last-frame-text">
              <span class="last-frame-title">视频尾帧图</span>
              <span class="last-frame-desc">可用作下一段视频的首帧，实现连续接帧</span>
            </div>
          </div>
          <div class="last-frame-actions">
            <el-button type="primary" size="small" @click="useLastFrameAsFirst">
              用作下一段首帧
            </el-button>
            <el-button size="small" @click="copy(lastFrameUrl)">复制链接</el-button>
            <el-button
              size="small"
              tag="a"
              :href="lastFrameUrl"
              target="_blank"
              rel="noopener noreferrer"
            >
              新窗口打开
            </el-button>
          </div>
        </div>

        <template v-if="ui.isBeginner">
          <div class="result-actions">
            <el-button type="primary" tag="a" :href="videoUrl" target="_blank" rel="noopener noreferrer">
              下载视频
            </el-button>
            <el-button @click="copy(videoUrl)">复制链接</el-button>
            <el-button @click="router.push('/history')">查看历史</el-button>
          </div>
          <p v-if="tokens" class="token-hint">本次消耗 {{ tokens }} tokens · 链接 24 小时内有效</p>
        </template>

        <template v-else>
          <div class="result-label">
            视频下载链接
            <el-tag v-if="tokens" size="small" effect="plain">Token 消耗: {{ tokens }}</el-tag>
          </div>
          <div class="url-box">
            <a :href="videoUrl" target="_blank" rel="noopener noreferrer">{{ videoUrl }}</a>
            <el-button text type="primary" size="small" @click="copy(videoUrl)">复制链接</el-button>
          </div>
          <div class="result-actions">
            <el-button tag="a" :href="videoUrl" target="_blank" rel="noopener noreferrer">
              新窗口打开
            </el-button>
            <el-button tag="a" :href="proxyDownloadUrl" target="_blank" rel="noopener noreferrer">
              代理下载
            </el-button>
          </div>
        </template>
      </div>

      <!-- 请求 / 原始响应 -->
      <el-collapse v-if="ui.isPro && requestJson" class="block">
        <el-collapse-item title="查看请求 JSON">
          <pre class="raw">{{ requestJson }}</pre>
        </el-collapse-item>
      </el-collapse>

      <el-collapse v-if="ui.isPro && rawJson" class="block">
        <el-collapse-item title="查看原始响应 JSON">
          <pre class="raw">{{ rawJson }}</pre>
        </el-collapse-item>
      </el-collapse>

      <!-- 运行日志 -->
      <div v-if="ui.isPro" class="log-section block">
        <div class="log-head">
          <span>运行日志</span>
          <el-button text size="small" @click="logs = []">清空</el-button>
        </div>
        <div ref="logBox" class="log-output">
          <div
            v-for="(line, i) in logs"
            :key="i"
            class="log-line"
            :class="`log-${line.level}`"
          >
            [{{ line.time }}] {{ line.message }}
          </div>
          <div v-if="!logs.length" class="log-empty">暂无日志</div>
        </div>
      </div>
      </div>
    </el-card>
    </div>
    </div>

    <!-- 新手模式：底部固定操作栏 -->
    <div v-if="ui.isBeginner" class="sticky-bar">
      <el-button
        type="primary"
        size="large"
        class="sticky-btn"
        :loading="generating"
        @click="handleGenerate"
      >
        {{ generating ? '生成中…' : '开始生成' }}
      </el-button>
      <el-button v-if="generating" size="large" @click="cancel">取消</el-button>
    </div>
    </div>
    </transition>
  </div>
</template>

<script setup>
import { reactive, ref, computed, watch, nextTick, onActivated, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Icon } from '@iconify/vue'
import { ElMessage, ElNotification } from 'element-plus'
import { useConfigStore } from '@/store/config'
import { useHistoryStore } from '@/store/history'
import { useUiStore } from '@/store/ui'
import {
  GENERATION_MODES,
  MODE_HINTS,
  BEGINNER_STEPS,
  BEGINNER_MODE_CARDS,
  BEGINNER_FIELD_HINTS,
  BEGINNER_MODE_DETAILS,
  BEGINNER_OPTION_HINTS,
  BEGINNER_ERROR_TIPS,
  RESOLUTION_LABELS,
  RATIO_LABELS,
  PROMPT_WRITING_TIPS,
  PROMPT_EXAMPLES,
} from '@/constants/modes'
import {
  MODEL_FAST,
  MODEL_STANDARD,
  formatModelLabel,
  SUCCESS_STATUSES,
  buildPayload,
  createTask,
  queryTask,
  findVideoUrl,
  findLastFrameUrl,
  parseErrorPayload,
  formatErrorForLog,
  ApiError,
  deleteAsset,
} from '@/api/seedance'
import AssetUpload from '@/components/AssetUpload.vue'

const router = useRouter()
const config = useConfigStore()
const history = useHistoryStore()
const ui = useUiStore()

const MODES = GENERATION_MODES
const VIEW_MODES = [
  { label: '新手模式', value: 'beginner' },
  { label: '专业模式', value: 'pro' },
]
const PROMPT_MAX = 500
const RATIOS = ['16:9', '9:16', '1:1', '4:3', '3:4', '21:9', 'adaptive']
const DURATIONS = [4, 5, 6, 8, 10, 12, 15]

const missingApiKey = computed(() => !config.key)

const showAdvancedModes = ref(false)

const basicModeCards = computed(() =>
  BEGINNER_MODE_CARDS.filter((m) => m.tier === 'basic')
)
const advancedModeCards = computed(() =>
  BEGINNER_MODE_CARDS.filter((m) => m.tier === 'advanced')
)
const currentModeDetail = computed(
  () => BEGINNER_MODE_DETAILS[mode.value] || BEGINNER_MODE_DETAILS.text
)
const beginnerErrorTip = computed(() => {
  if (!error.value) return ''
  const code = error.value.primaryCode || ''
  return BEGINNER_ERROR_TIPS[code] || BEGINNER_ERROR_TIPS.default
})

const mode = ref('text')
const form = reactive({
  model: MODEL_FAST,
  resolution: '720p',
  ratio: '16:9',
  duration: 4,
  prompt: '一只橘猫在阳光下伸懒腰，温馨治愈风格',
  generateAudio: true,
  watermark: false,
  firstFrameUrl: '',
  imageRole: 'first_frame',
  lastFrameUrl: '',
  returnLastFrame: false,
  refImageList: [''],
  refImages: [],
  refVideos: [],
  refAudios: [],
})

// 本次会话内上传到自建图床的素材 URL
const uploadedAssets = ref(new Set())

function trackUpload(url) {
  if (url) uploadedAssets.value.add(url)
}

// 仅当某个素材被移除 / 被新上传替换时，才销毁它对应的临时文件。
// 注意：不要在生成结束后统一删除——重试或微调重提交仍需这些 URL 有效，
// 提早删除会导致火山后端下载 404。会话遗弃的文件由 R2 生命周期规则（1 天）兜底清理。
function discardAsset(url) {
  if (!url || !uploadedAssets.value.has(url)) return
  uploadedAssets.value.delete(url)
  deleteAsset(url)
}

// 把生成视频的尾帧图用作下一段视频的首帧，便于连续接帧
function useLastFrameAsFirst() {
  if (!lastFrameUrl.value) return
  mode.value = 'first_frame'
  form.firstFrameUrl = lastFrameUrl.value
  form.imageRole = 'first_frame'
  ElMessage.success('已将尾帧填入首帧，可继续生成下一段')
}

const isFast = computed(() => form.model === MODEL_FAST)
const resolutions = computed(() => (isFast.value ? ['480p', '720p'] : ['480p', '720p', '1080p']))
const resolutionLabel = computed(() =>
  isFast.value ? '分辨率（快速版最高 720p）' : '分辨率（标准版支持 1080p）'
)
const durationLabel = computed(() =>
  isFast.value ? '时长（fast 文生视频建议 4）' : '时长（标准版支持 4–15）'
)

function onModelChange() {
  if (isFast.value && form.resolution === '1080p') form.resolution = '720p'
}

function selectMode(key) {
  mode.value = key
  if (advancedModeCards.value.some((m) => m.key === key)) {
    showAdvancedModes.value = true
  }
}

function applyPromptExample(text) {
  form.prompt = text
}

function removeRefImage(i) {
  if (form.refImageList.length > 1) form.refImageList.splice(i, 1)
}

/* --------------------- 多模态：多素材 + @ 引用 --------------------- */

const MM_LIMITS = { image: 9, video: 3, audio: 3 }

// 供 el-mention 下拉：按当前模式生成可引用的素材 token（英文显示）
const mentionOptions = computed(() => {
  const opts = []
  if (mode.value === 'first_frame') {
    if (form.firstFrameUrl) {
      opts.push(
        form.imageRole === 'reference_image'
          ? { value: 'Image1', label: 'Image1' }
          : { value: 'FirstFrame', label: 'FirstFrame' }
      )
    }
  } else if (mode.value === 'first_last') {
    if (form.firstFrameUrl) opts.push({ value: 'FirstFrame', label: 'FirstFrame' })
    if (form.lastFrameUrl) opts.push({ value: 'LastFrame', label: 'LastFrame' })
  } else if (mode.value === 'multi_image') {
    form.refImageList.forEach((u, i) => {
      if ((u || '').trim()) opts.push({ value: `Image${i + 1}`, label: `Image${i + 1}` })
    })
  } else if (mode.value === 'multimodal') {
    form.refImages.forEach((_, i) => opts.push({ value: `Image${i + 1}`, label: `Image${i + 1}` }))
    form.refVideos.forEach((_, i) => opts.push({ value: `Video${i + 1}`, label: `Video${i + 1}` }))
    form.refAudios.forEach((_, i) => opts.push({ value: `Audio${i + 1}`, label: `Audio${i + 1}` }))
  }
  return opts
})

const promptPlaceholder = computed(() => {
  if (mentionOptions.value.length) {
    return '输入 @ 引用上传的素材，例如 @Image1 / @FirstFrame。再描述你想生成的画面'
  }
  return ui.isBeginner
    ? '例如：一只橘猫在阳光下伸懒腰，毛发蓬松，温馨治愈风格，慢镜头'
    : '描述你想生成的视频内容，例如：一只橘猫在阳光下伸懒腰，温馨治愈风格'
})

const mmCounts = computed(() => ({
  image: form.refImages.length,
  video: form.refVideos.length,
  audio: form.refAudios.length,
}))

function addMaterial(kind) {
  const list = { image: form.refImages, video: form.refVideos, audio: form.refAudios }[kind]
  if (list.length >= MM_LIMITS[kind]) {
    ElMessage.warning(`最多 ${MM_LIMITS[kind]} 个`)
    return
  }
  list.push({ url: '' })
}

function removeMaterial(kind, i) {
  const list = { image: form.refImages, video: form.refVideos, audio: form.refAudios }[kind]
  const [removed] = list.splice(i, 1)
  if (removed?.url) discardAsset(removed.url)
}

// 上传成功后填入对应素材槽的 url；若该槽原有已上传文件则先销毁旧的
function onMaterialUploaded(kind, i, url) {
  const list = { image: form.refImages, video: form.refVideos, audio: form.refAudios }[kind]
  const slot = list[i]
  if (!slot) return
  if (slot.url && slot.url !== url) discardAsset(slot.url)
  slot.url = url
  trackUpload(url)
}

function snapshotForm() {
  return {
    mode: mode.value,
    form: {
      model: form.model,
      resolution: form.resolution,
      ratio: form.ratio,
      duration: form.duration,
      prompt: form.prompt,
      generateAudio: form.generateAudio,
      watermark: form.watermark,
      firstFrameUrl: form.firstFrameUrl,
      imageRole: form.imageRole,
      lastFrameUrl: form.lastFrameUrl,
      returnLastFrame: form.returnLastFrame,
      refImageList: [...form.refImageList],
      refImages: form.refImages.map((x) => ({ ...x })),
      refVideos: form.refVideos.map((x) => ({ ...x })),
      refAudios: form.refAudios.map((x) => ({ ...x })),
    },
  }
}

function applyRestoreDraft() {
  const draft = history.consumeRestoreDraft()
  if (!draft) return
  mode.value = draft.mode
  Object.assign(form, draft.form)
  if (Array.isArray(draft.form.refImageList)) {
    form.refImageList = [...draft.form.refImageList]
  }
  form.refImages = (draft.form.refImages || []).map((x) => ({ ...x }))
  form.refVideos = (draft.form.refVideos || []).map((x) => ({ ...x }))
  form.refAudios = (draft.form.refAudios || []).map((x) => ({ ...x }))
  ElNotification.success({
    title: '参数已填入',
    message: '可在本页修改后提交',
    position: 'top-right',
    duration: 3000,
  })
}

/* --------------------------- 运行时状态 --------------------------- */

const status = reactive({
  state: 'idle',
  title: '等待提交',
  desc: '填写参数后点击「开始生成」',
  progress: 0,
  showProgress: false,
})
const STATUS_ICONS = {
  idle: 'mingcute:time-line',
  queued: 'mingcute:loading-line',
  processing: 'mingcute:loading-3-line',
  success: 'mingcute:check-circle-line',
  error: 'mingcute:close-circle-line',
}
const statusIcon = computed(() => STATUS_ICONS[status.state] || STATUS_ICONS.idle)

const taskId = ref('')
const pollText = ref('—')
const pollLevel = ref('warn')
const error = ref(null)
const errorHttp = ref(null)
const videoUrl = ref('')
const lastFrameUrl = ref('')
const tokens = ref(0)
const rawJson = ref('')
const requestJson = ref('')
const logs = ref([])
const logBox = ref(null)
const liveLogBox = ref(null)
const resultPanel = ref(null)
const generating = ref(false)
const currentHistoryId = ref('')

let pollTimer = null
let pollAborted = false

const proxyDownloadUrl = computed(
  () => `${config.base}${config.path}/${taskId.value}/content`
)

const displayLogs = computed(() =>
  logs.value.map((l) => ({
    ...l,
    text: l.friendly || l.message,
  }))
)

const displayStatus = computed(() => {
  if (ui.isPro) {
    return { title: status.title, desc: status.desc, icon: statusIcon.value }
  }
  const friendly = {
    idle: { title: '准备就绪', desc: '填写参数后，点击开始生成' },
    queued: { title: '正在提交', desc: '视频任务排队中，请稍候…' },
    processing: { title: '正在生成', desc: `已完成 ${status.progress}%` },
    success: {
      title: '生成成功',
      desc: videoUrl.value ? '视频已就绪，请尽快下载保存' : status.desc,
    },
    error: {
      title: '生成失败',
      desc: error.value?.primaryMessage || status.desc,
    },
  }
  const item = friendly[status.state]
  return item
    ? { ...item, icon: statusIcon.value }
    : { title: status.title, desc: status.desc, icon: statusIcon.value }
})

function setStatus(state, title, desc, progress) {
  status.state = state
  status.title = title
  status.desc = desc
  const active = state === 'processing' || state === 'queued'
  if (progress !== undefined && active) {
    status.showProgress = true
    status.progress = progress
  } else if (state === 'success') {
    status.showProgress = true
    status.progress = 100
  } else {
    status.showProgress = active
  }
}

function setPoll(text, level = 'warn') {
  pollText.value = text
  pollLevel.value = level
}

function appendLog(message, level = 'info', friendly) {
  const time = new Date().toLocaleTimeString('zh-CN', { hour12: false })
  logs.value.push({ time, level, message, friendly: friendly || '' })
  nextTick(() => {
    const box = ui.isBeginner ? liveLogBox.value : logBox.value
    if (box) box.scrollTop = box.scrollHeight
  })
}

function copy(text) {
  navigator.clipboard
    .writeText(text)
    .then(() => ElMessage.success('已复制'))
    .catch(() => ElMessage.error('复制失败'))
}

function scrollToResult() {
  nextTick(() => {
    resultPanel.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  })
}

function showError(err) {
  const parsed = err?.parsed || parseErrorPayload(err?.data || {}, err?.status || null)
  error.value = parsed
  errorHttp.value = err?.status || null
  if (parsed.raw && Object.keys(parsed.raw).length) {
    rawJson.value = JSON.stringify(parsed.raw, null, 2)
  }
}

const STATUS_LABELS = {
  queued: '排队中',
  processing: '生成中',
  in_progress: '生成中',
  running: '生成中',
  pending: '等待中',
  completed: '已完成',
  succeeded: '已完成',
}

const POLL_INTERVAL_MS = 5000

function pollTask(id) {
  pollAborted = false
  let attempt = 0
  const maxAttempts = 60
  appendLog('5s 后进行首次状态查询…', 'info', '任务已提交，即将查询进度')

  return new Promise((resolve, reject) => {
    async function tick() {
      if (pollAborted) return reject(new Error('已取消轮询'))
      try {
        const result = await queryTask(id)
        rawJson.value = JSON.stringify(result, null, 2)

        const st = (result.status || '').toLowerCase()
        const progress = result.progress ?? 0
        const shownId = result.id || id
        taskId.value = shownId
        const label = STATUS_LABELS[st] || st

        if (SUCCESS_STATUSES.has(st)) {
          const url = findVideoUrl(result)
          const lastFrame = findLastFrameUrl(result)
          const tk = result.metadata?.total_tokens
          setPoll(`${label} · 100%`, 'success')
          appendLog(
            `生成完成 · progress=100%${tk ? ` · tokens=${tk}` : ''}`,
            'success',
            tk ? `视频生成完成，消耗 ${tk} tokens` : '视频生成完成'
          )
          if (url) appendLog(`视频链接: ${url}`, 'success', '视频已就绪，可以预览和下载')
          if (lastFrame) appendLog(`尾帧图: ${lastFrame}`, 'success', '已返回视频尾帧图')
          setStatus(
            'success',
            '生成完成',
            url
              ? `已提取视频链接${tk ? `，消耗 ${tk} tokens` : ''}`
              : '任务成功但未找到视频链接，请查看原始响应'
          )
          if (url) {
            videoUrl.value = url
            tokens.value = tk || 0
          }
          if (lastFrame) lastFrameUrl.value = lastFrame
          if (currentHistoryId.value) {
            history.updateRecord(currentHistoryId.value, {
              status: 'completed',
              taskId: shownId,
              videoUrl: url || '',
              tokens: tk || 0,
            })
          }
          return resolve(result)
        }

        if (result.code && result.code !== 'success' && !SUCCESS_STATUSES.has(st)) {
          const parsed = parseErrorPayload(result)
          throw new ApiError(parsed.primaryMessage, { data: result, parsed })
        }

        if (st === 'failed') {
          const parsed = parseErrorPayload(result)
          const err = new ApiError(parsed.primaryMessage, { data: result, parsed })
          setPoll(`失败 · ${parsed.primaryCode}`, 'error')
          appendLog(formatErrorForLog(parsed), 'error', parsed.primaryMessage)
          showError(err)
          setStatus('error', '生成失败', parsed.primaryMessage)
          if (currentHistoryId.value) {
            history.updateRecord(currentHistoryId.value, {
              status: 'failed',
              taskId: shownId,
              errorMessage: parsed.primaryMessage,
            })
          }
          return reject(err)
        }

        setPoll(`${label} · ${progress}%`, 'warn')
        appendLog(
          `第 ${attempt + 1} 次轮询 · ${label} · progress=${progress}%`,
          'info',
          `${label}，当前进度 ${progress}%`
        )
        setStatus('processing', label, `Task ID: ${shownId}`, progress)
        attempt++

        if (attempt >= maxAttempts) {
          setPoll('轮询超时', 'error')
          appendLog('轮询超时，请稍后手动查询任务', 'error', '等待时间较长，可在历史记录中查看任务')
          setStatus('error', '轮询超时', '已超过最大等待时间，请稍后手动查询任务')
          if (currentHistoryId.value) {
            history.updateRecord(currentHistoryId.value, {
              status: 'failed',
              taskId: taskId.value,
              errorMessage: '轮询超时',
            })
          }
          return reject(new Error('轮询超时'))
        }

        appendLog('等待 5s 后继续轮询…', 'info', '继续等待中（5 秒后再查询）')
        pollTimer = setTimeout(tick, POLL_INTERVAL_MS)
      } catch (err) {
        const parsed = err.parsed || parseErrorPayload(err.data, err.status)
        setPoll(`查询失败 · ${parsed.primaryCode}`, 'error')
        appendLog(`查询失败:\n${formatErrorForLog(parsed)}`, 'error', parsed.primaryMessage)
        showError(err)
        setStatus('error', '查询失败', parsed.primaryMessage)
        if (currentHistoryId.value) {
          history.updateRecord(currentHistoryId.value, {
            status: 'failed',
            taskId: taskId.value,
            errorMessage: parsed.primaryMessage,
          })
        }
        reject(err)
      }
    }
    pollTimer = setTimeout(tick, POLL_INTERVAL_MS)
  })
}

function stopPoll() {
  pollAborted = true
  if (pollTimer) clearTimeout(pollTimer)
  pollTimer = null
}

function cancel() {
  stopPoll()
  generating.value = false
  setPoll('已取消', 'warn')
  appendLog('用户取消轮询', 'warn', '已取消本次生成')
  setStatus('idle', '已取消', '轮询已停止，可重新提交')
  if (currentHistoryId.value) {
    history.updateRecord(currentHistoryId.value, {
      status: 'cancelled',
      taskId: taskId.value,
    })
    currentHistoryId.value = ''
  }
}

async function handleGenerate() {
  stopPoll()
  currentHistoryId.value = ''
  videoUrl.value = ''
  lastFrameUrl.value = ''
  tokens.value = 0
  taskId.value = ''
  error.value = null
  errorHttp.value = null
  rawJson.value = ''
  requestJson.value = ''
  logs.value = []
  setPoll('—')

  let payload
  try {
    payload = buildPayload(form, mode.value)
    requestJson.value = JSON.stringify(payload, null, 2)
  } catch (err) {
    appendLog(`参数错误: ${err.message}`, 'error', err.message)
    setStatus('error', '参数错误', err.message)
    return
  }

  if (!payload.prompt) {
    appendLog('参数错误: 请填写提示词', 'error', '请填写提示词')
    setStatus('error', '参数错误', '请填写提示词')
    return
  }

  if (ui.isBeginner && missingApiKey.value) {
    ElMessage.warning('请先配置 API Key')
    return
  }

  generating.value = true
  scrollToResult()
  setStatus('queued', '提交任务中', '正在向 API 发送请求…', 0)
  appendLog(
    `提交任务 · model=${payload.model} · ${payload.prompt.slice(0, 40)}…`,
    'info',
    '正在提交你的视频请求…'
  )

  currentHistoryId.value = history.addRecord({
    mode: mode.value,
    prompt: payload.prompt,
    model: payload.model,
    resolution: payload.resolution,
    ratio: payload.ratio,
    duration: payload.duration,
    formSnapshot: snapshotForm(),
  })

  try {
    const createRes = await createTask(payload)
    rawJson.value = JSON.stringify(createRes, null, 2)

    const id = createRes.id || createRes.task_id
    if (!id) throw new Error('创建成功但未返回任务 ID，请查看原始响应')

    taskId.value = id
    history.updateRecord(currentHistoryId.value, { taskId: id })
    setPoll(`${createRes.status || 'queued'} · 0%`, 'warn')
    appendLog(`任务提交成功 · Task ID: ${id}`, 'success', '任务创建成功，进入排队')
    appendLog(`初始状态: ${createRes.status || 'queued'} · 开始轮询…`, 'info', '开始跟踪生成进度')
    setStatus('queued', '任务已提交', `Task ID: ${id}`, 0)

    await pollTask(id)
  } catch (err) {
    if (!pollAborted) {
      const parsed = err.parsed || parseErrorPayload(err.data, err.status)
      appendLog(`API 错误:\n${formatErrorForLog(parsed)}`, 'error', parsed.primaryMessage)
      showError(err)
      setPoll(`失败 · ${parsed.primaryCode}`, 'error')
      setStatus('error', '请求失败', parsed.primaryMessage)
      if (currentHistoryId.value) {
        history.updateRecord(currentHistoryId.value, {
          status: 'failed',
          taskId: taskId.value,
          errorMessage: parsed.primaryMessage,
        })
      }
    }
  } finally {
    generating.value = false
  }
}

onMounted(applyRestoreDraft)
onActivated(applyRestoreDraft)
watch(isFast, onModelChange)
</script>

<style scoped>
.generate-page.beginner {
  padding-bottom: 0;
}

@media (max-width: 768px) {
  .generate-page.beginner {
    padding-bottom: 80px;
  }
}

.page-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.toolbar-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.page-title {
  font-size: 18px;
  font-weight: 700;
  color: var(--el-text-color-primary);
}

.page-sub {
  display: block;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.sub-fade-enter-active,
.sub-fade-leave-active {
  transition: opacity 0.18s ease, transform 0.18s ease;
}

.sub-fade-enter-from {
  opacity: 0;
  transform: translateY(4px);
}

.sub-fade-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

.view-switch-enter-active {
  transition:
    opacity 0.24s cubic-bezier(0.4, 0, 0.2, 1),
    transform 0.24s cubic-bezier(0.4, 0, 0.2, 1);
}

.view-switch-leave-active {
  transition:
    opacity 0.16s cubic-bezier(0.4, 0, 1, 1),
    transform 0.16s cubic-bezier(0.4, 0, 1, 1);
}

.view-switch-enter-from {
  opacity: 0;
  transform: translateY(10px);
}

.view-switch-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

@media (prefers-reduced-motion: reduce) {
  .sub-fade-enter-active,
  .sub-fade-leave-active,
  .view-switch-enter-active,
  .view-switch-leave-active {
    transition: opacity 0.01ms linear;
  }

  .sub-fade-enter-from,
  .sub-fade-leave-to,
  .view-switch-enter-from,
  .view-switch-leave-to {
    transform: none;
  }
}

.config-alert {
  margin-bottom: 16px;
}

.alert-link {
  color: var(--el-color-primary);
  text-decoration: none;
  font-weight: 500;
}

.alert-link:hover {
  color: var(--el-color-primary-light-3);
}

.mode-hint {
  margin: 0 0 12px;
  padding: 10px 12px;
  border-radius: 10px;
  font-size: 13px;
  line-height: 1.6;
  color: var(--el-text-color-regular);
  background: var(--soft-fill);
  border: 1px solid var(--glass-border);
}

/* 新手引导 */
.step-guide {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  margin-bottom: 20px;
  padding: 14px;
  border-radius: 12px;
  background: linear-gradient(135deg, var(--soft-fill) 0%, transparent 100%);
  border: 1px solid var(--glass-border);
}

@media (max-width: 640px) {
  .step-guide {
    grid-template-columns: 1fr;
  }
}

.step-item {
  display: flex;
  gap: 10px;
  align-items: flex-start;
}

.step-num {
  flex-shrink: 0;
  width: 26px;
  height: 26px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  font-size: 13px;
  font-weight: 700;
  color: #fff;
  background: var(--el-color-primary);
}

.step-content {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.step-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.step-desc {
  font-size: 12px;
  line-height: 1.5;
  color: var(--el-text-color-secondary);
}

.section-label {
  margin: 0 0 10px;
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.mode-cards {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
  margin-bottom: 12px;
}

.mode-cards-advanced {
  margin-top: 10px;
}

@media (max-width: 480px) {
  .mode-cards {
    grid-template-columns: 1fr;
  }
}

.mode-card {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
  padding: 12px 14px;
  border-radius: 12px;
  border: 1px solid var(--glass-border);
  background: var(--soft-fill);
  cursor: pointer;
  text-align: left;
  transition: border-color 0.2s, background 0.2s, box-shadow 0.2s;
}

.mode-card:hover {
  border-color: var(--el-color-primary-light-5);
}

.mode-card.active {
  border-color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
  box-shadow: 0 0 0 1px var(--el-color-primary-light-7);
}

.mode-card-tag {
  position: absolute;
  top: 8px;
  right: 8px;
  padding: 2px 8px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 600;
  color: #fff;
  background: var(--el-color-primary);
}

.mode-card-icon {
  color: var(--el-color-primary);
}

.mode-card-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.mode-card-desc {
  font-size: 12px;
  line-height: 1.45;
  color: var(--el-text-color-secondary);
}

.advanced-toggle {
  display: flex;
  align-items: center;
  gap: 6px;
  width: 100%;
  margin-bottom: 4px;
  padding: 8px 0;
  border: none;
  background: none;
  font-size: 13px;
  color: var(--el-color-primary);
  cursor: pointer;
}

.advanced-toggle:hover {
  color: var(--el-color-primary-light-3);
}

.mode-detail {
  margin-bottom: 18px;
  padding: 12px 14px;
  border-radius: 10px;
  background: var(--soft-fill);
  border: 1px dashed var(--glass-border);
}

.mode-detail-head {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 8px;
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.mode-detail-head .iconify {
  color: var(--el-color-primary);
}

.mode-detail-list {
  margin: 0;
  padding-left: 18px;
  font-size: 12px;
  line-height: 1.65;
  color: var(--el-text-color-secondary);
}

.field-hint {
  margin: 6px 0 0;
  font-size: 12px;
  line-height: 1.55;
  color: var(--el-text-color-secondary);
}

.prompt-examples {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin-top: 10px;
}

.prompt-examples-label {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.prompt-chip {
  padding: 4px 12px;
  border-radius: 20px;
  border: 1px solid var(--glass-border);
  background: var(--el-bg-color);
  font-size: 12px;
  color: var(--el-color-primary);
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s;
}

.prompt-chip:hover {
  border-color: var(--el-color-primary-light-5);
  background: var(--el-color-primary-light-9);
}

.prompt-tips-collapse {
  margin-top: 10px;
  border: none;
}

.prompt-tips-collapse :deep(.el-collapse-item__header) {
  height: 36px;
  font-size: 12px;
  color: var(--el-color-primary);
  background: transparent;
  border: none;
}

.prompt-tips-collapse :deep(.el-collapse-item__wrap) {
  border: none;
}

.prompt-tips-list {
  margin: 0;
  padding-left: 18px;
  font-size: 12px;
  line-height: 1.65;
  color: var(--el-text-color-secondary);
}

.option-cards {
  margin: 8px 0 18px;
}

.option-card {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px 14px;
  border-radius: 10px;
  background: var(--soft-fill);
  border: 1px solid var(--glass-border);
}

.option-card + .option-card {
  margin-top: 8px;
}

.option-card-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.option-card-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.option-card-desc {
  font-size: 12px;
  line-height: 1.5;
  color: var(--el-text-color-secondary);
}

.error-tip {
  margin: 8px 0 0;
  padding: 8px 10px;
  border-radius: 8px;
  font-size: 12px;
  line-height: 1.55;
  color: var(--el-text-color-regular);
  background: var(--soft-fill);
}

.workspace {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 16px;
  align-items: stretch;
  min-height: calc(100vh - 148px);
}

.workspace > .card,
.result-panel {
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.workspace > .card :deep(.el-card__body) {
  flex: 1;
  min-height: 0;
}

.generate-page.beginner .workspace {
  grid-template-columns: minmax(0, 1.08fr) minmax(320px, 0.92fr);
}

.generate-page.pro .workspace {
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
}

@media (max-width: 960px) {
  .generate-page.beginner .workspace,
  .generate-page.pro .workspace {
    grid-template-columns: minmax(0, 1fr);
    min-height: 0;
  }

  .workspace > .card,
  .result-panel {
    height: auto;
  }

  .result-card {
    height: auto;
  }

  .result-card :deep(.el-card__body) {
    overflow: visible;
  }

  .result-body {
    overflow: visible;
    max-height: none;
  }
}

.result-panel {
  scroll-margin-top: 88px;
}

.result-card {
  flex: 1;
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.result-card :deep(.el-card__body) {
  flex: 1;
  min-height: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.result-body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding-right: 2px;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
}

.mode-tabs {
  margin-bottom: 4px;
}

.grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0 16px;
}

.grid .span-2 {
  grid-column: 1 / -1;
}

.generate-page.beginner .grid-beginner {
  grid-template-columns: 1fr 1fr;
}

@media (max-width: 640px) {
  .generate-page.beginner .grid-beginner {
    grid-template-columns: 1fr;
  }
}

.options {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  margin: 4px 0 18px;
}

.actions {
  display: flex;
  gap: 12px;
}

@media (max-width: 768px) {
  .actions-beginner {
    display: none;
  }
}

.url-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 100%;
}

.url-item {
  display: flex;
  gap: 8px;
  align-items: center;
}

.url-with-upload {
  display: flex;
  gap: 8px;
  align-items: center;
  width: 100%;
}

.url-with-upload .el-input {
  flex: 1;
}

/* 多模态：多素材分组 + @ 引用 */
.mm-group {
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 100%;
}

.mm-item {
  display: flex;
  gap: 8px;
  align-items: center;
}

.mm-item .el-input {
  flex: 1;
}

.mm-tag {
  flex-shrink: 0;
  min-width: 64px;
  white-space: nowrap;
  font-size: 12px;
  font-weight: 600;
  text-align: center;
  padding: 4px 8px;
  border-radius: 6px;
  font-family: "SFMono-Regular", Menlo, monospace;
  color: var(--el-color-primary);
  background: var(--nav-active-bg);
  border: 1px solid var(--nav-active-border);
}

.mm-count {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  font-weight: 400;
}

.mm-hint-inline {
  font-size: 12px;
  font-weight: 400;
  color: var(--el-text-color-secondary);
}

.mm-guide {
  width: 100%;
  padding: 14px;
  border-radius: 10px;
  background: var(--soft-fill);
  border: 1px solid var(--glass-border);
}

.mm-guide-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.mm-guide-tip {
  margin: 8px 0 0;
  font-size: 13px;
  line-height: 1.8;
  color: var(--el-text-color-regular);
}

.mm-guide-tip code {
  padding: 1px 5px;
  border-radius: 4px;
  font-size: 12px;
  background: var(--el-fill-color-light);
  color: var(--el-color-primary);
}

.mm-guide-list {
  margin: 8px 0 0;
  padding-left: 18px;
  font-size: 12px;
  line-height: 1.9;
  color: var(--el-text-color-secondary);
}

/* 状态面板 */
.status {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px;
  border-radius: 10px;
  background: var(--soft-fill);
}

.status-icon {
  display: flex;
  width: 40px;
  height: 40px;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  background: var(--el-bg-color);
  color: var(--el-text-color-secondary);
}

.status.queued .status-icon,
.status.processing .status-icon {
  color: var(--el-color-primary);
}

.status-icon-spin {
  animation: status-icon-spin 1s linear infinite;
}

@keyframes status-icon-spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

@media (prefers-reduced-motion: reduce) {
  .status-icon-spin {
    animation: none;
  }
}
.status.success .status-icon {
  color: var(--el-color-success);
}
.status.error .status-icon {
  color: var(--el-color-danger);
}

.status-title {
  font-weight: 600;
}

.status-desc {
  font-size: 13px;
  color: var(--el-text-color-secondary);
  word-break: break-all;
}

.progress {
  margin-top: 12px;
}

.block {
  margin-top: 16px;
}

.error-msg {
  margin: 4px 0 6px;
  font-weight: 500;
}

.error-chain {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.chain-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
}

.copy-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.poll-success {
  color: var(--el-color-success);
}
.poll-error {
  color: var(--el-color-danger);
}
.poll-warn {
  color: var(--el-color-warning);
}

.video-result {
  display: flex;
  flex-direction: column;
  gap: 10px;
  flex-shrink: 0;
}

.result-label {
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
}

.url-box {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 8px;
  background: var(--soft-fill);
}

.url-box a {
  flex: 1;
  color: var(--el-color-primary);
  word-break: break-all;
  text-decoration: none;
  font-size: 13px;
}

.player-wrap {
  width: 100%;
  height: 200px;
  flex-shrink: 0;
  border-radius: 10px;
  overflow: hidden;
  background: #000;
}

.player {
  display: block;
  width: 100%;
  height: 100%;
  border-radius: 10px;
  background: #000;
  object-fit: contain;
}

.result-actions {
  display: flex;
  gap: 12px;
}

.last-frame {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 12px;
  border-radius: 10px;
  border: 1px solid var(--glass-border);
  background: var(--soft-fill);
}

.last-frame-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.last-frame-thumb {
  width: 96px;
  height: 54px;
  object-fit: cover;
  border-radius: 6px;
  background: #000;
  flex-shrink: 0;
}

.last-frame-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.last-frame-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.last-frame-desc {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.last-frame-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.raw {
  max-height: 280px;
  overflow: auto;
  font-size: 12px;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-all;
}

.log-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
  font-weight: 600;
}

.log-section {
  flex-shrink: 0;
}

.log-output {
  height: 180px;
  min-height: 180px;
  max-height: 180px;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 10px 12px;
  border-radius: 8px;
  background: var(--soft-fill);
  font-family: "SFMono-Regular", Consolas, Menlo, monospace;
  font-size: 12px;
  line-height: 1.7;
}

.log-line {
  white-space: pre-wrap;
  word-break: break-all;
}

.log-info {
  color: var(--el-text-color-regular);
}
.log-success {
  color: var(--el-color-success);
}
.log-warn {
  color: var(--el-color-warning);
}
.log-error {
  color: var(--el-color-danger);
}

.log-empty {
  color: var(--el-text-color-secondary);
}

.beginner-tips {
  margin-bottom: 16px;
  padding: 16px 16px 14px;
  border-radius: 10px;
  background: var(--soft-fill);
  border: 1px solid var(--glass-border);
}

.beginner-tips-head {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.beginner-tips-head .iconify {
  color: var(--el-color-warning);
}

.beginner-tips-foot {
  margin: 12px 0 0;
  padding-top: 10px;
  border-top: 1px dashed var(--glass-border);
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.beginner-tips ul {
  margin: 0;
  padding-left: 18px;
  font-size: 13px;
  line-height: 1.7;
  color: var(--el-text-color-secondary);
}

.token-hint {
  margin: 0;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.live-log {
  flex-shrink: 0;
  border: 1px solid var(--glass-border);
  border-radius: 12px;
  overflow: hidden;
  background: var(--soft-fill);
}

.live-log-head {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  font-size: 13px;
  font-weight: 600;
  border-bottom: 1px solid var(--glass-border);
  background: var(--el-bg-color);
}

.live-log-list {
  height: 280px;
  min-height: 280px;
  max-height: 280px;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 10px 12px;
}

.live-log-item {
  display: flex;
  gap: 10px;
  padding: 8px 0;
}

.live-log-item + .live-log-item {
  border-top: 1px dashed var(--el-border-color-extra-light);
}

.live-dot {
  width: 8px;
  height: 8px;
  margin-top: 6px;
  border-radius: 50%;
  flex-shrink: 0;
  background: var(--el-text-color-secondary);
}

.live-log-item.success .live-dot {
  background: var(--el-color-success);
  box-shadow: 0 0 8px rgba(103, 194, 58, 0.45);
}

.live-log-item.warn .live-dot {
  background: var(--el-color-warning);
}

.live-log-item.error .live-dot {
  background: var(--el-color-danger);
}

.live-log-item.info .live-dot {
  background: var(--el-color-primary);
}

.live-body {
  flex: 1;
  min-width: 0;
}

.live-text {
  display: block;
  font-size: 13px;
  line-height: 1.5;
  color: var(--el-text-color-primary);
}

.live-time {
  display: block;
  margin-top: 2px;
  font-size: 11px;
  color: var(--el-text-color-secondary);
}

.live-empty {
  padding: 20px 8px;
  text-align: center;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.sticky-bar {
  display: none;
}

@media (max-width: 768px) {
  .generate-page.beginner .sticky-bar {
    display: flex;
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 20;
    gap: 10px;
    padding: 12px 16px calc(12px + env(safe-area-inset-bottom));
    background: var(--topbar-bg);
    border-top: 1px solid var(--glass-border);
    box-shadow: 0 -8px 24px rgba(0, 0, 0, 0.12);
  }

  .sticky-btn {
    flex: 1;
  }
}
</style>
