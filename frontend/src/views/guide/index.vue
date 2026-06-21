<template>
  <div class="guide">
    <!-- 左侧目录 -->
    <aside class="toc">
      <a
        v-for="s in sections"
        :key="s.id"
        class="toc-chip"
        :class="{ active: activeId === s.id }"
        @click="scrollTo(s.id)"
      >
        <b class="no">{{ s.no }}</b>
        <span class="toc-name">{{ s.name }}</span>
      </a>
    </aside>

    <!-- 右侧内容 -->
    <div class="guide-main">
      <!-- 简介 -->
      <el-card shadow="never" class="card">
        <template #header>
          <div class="head">
            <span class="card-title">Seedance 2.0 提示词指南</span>
            <a
              class="src-link"
              href="https://seedance2.ai/zh/guide"
              target="_blank"
              rel="noopener noreferrer"
            >
              官方原文
              <Icon icon="mingcute:external-link-line" width="15" height="15" />
            </a>
          </div>
        </template>
        <p class="intro">{{ intro }}</p>
      </el-card>

      <!-- 各章节 -->
      <el-card
        v-for="s in sections"
        :id="`g-${s.id}`"
        :key="s.id"
        :data-gid="s.id"
        shadow="never"
        class="card"
      >
        <template #header>
          <div class="sec-head">
            <b class="no">{{ s.no }}</b>
            <span class="card-title">{{ s.name }}</span>
          </div>
        </template>

        <p v-if="s.intro" class="sec-intro">{{ s.intro }}</p>

        <template v-for="(b, i) in s.blocks" :key="i">
          <!-- 子标题 -->
          <div v-if="b.kind === 'sub'" class="sub">
            <span class="sub-name">{{ b.name }}</span>
            <p v-if="b.intro" class="sub-intro">{{ b.intro }}</p>
          </div>

          <!-- 提示词公式 -->
          <div v-else-if="b.kind === 'formula'" class="formula">
            <span class="formula-tag">公式</span>
            <code class="formula-text">{{ b.text }}</code>
          </div>

          <!-- 字段构成 -->
          <div v-else-if="b.kind === 'fields'" class="fields">
            <div v-for="(f, fi) in b.items" :key="fi" class="field-item">
              <div class="field-top">
                <el-tag
                  size="small"
                  effect="plain"
                  :type="f.tag === '必需' ? 'danger' : 'info'"
                >
                  {{ f.tag }}
                </el-tag>
                <span class="field-name">{{ f.name }}</span>
              </div>
              <span class="field-desc">{{ f.desc }}</span>
            </div>
          </div>

          <!-- 补充说明 -->
          <el-alert
            v-else-if="b.kind === 'note'"
            type="info"
            :closable="false"
            show-icon
            class="note"
            :title="b.text"
          />

          <!-- 示例 -->
          <div v-else-if="b.kind === 'example'" class="example">
            <div class="ex-head">
              <span class="ex-title">{{ b.title }}</span>
              <el-button text size="small" @click="copy(b.prompt)">
                <Icon icon="mingcute:copy-2-line" width="15" height="15" />
                <span style="margin-left: 4px">复制提示词</span>
              </el-button>
            </div>
            <div v-if="b.refs" class="ex-refs">
              <Icon icon="mingcute:pic-line" width="14" height="14" />
              <span>参考输入：{{ b.refs }}</span>
            </div>
            <p class="ex-prompt">{{ b.prompt }}</p>
          </div>
        </template>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onActivated, onBeforeUnmount } from 'vue'
import { Icon } from '@iconify/vue'
import { ElMessage } from 'element-plus'
import { GUIDE_INTRO, GUIDE_SECTIONS } from '@/constants/guide'

const intro = GUIDE_INTRO
const sections = GUIDE_SECTIONS

function copy(text) {
  navigator.clipboard
    .writeText(text)
    .then(() => ElMessage.success('已复制提示词'))
    .catch(() => ElMessage.error('复制失败'))
}

const activeId = ref(sections[0]?.id || '')

function scrollTo(id) {
  const el = document.getElementById(`g-${id}`)
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  activeId.value = id
}

/* 滚动联动高亮当前章节 */
let observer = null
function setupObserver() {
  if (observer) return
  const cards = Array.from(document.querySelectorAll('[data-gid]'))
  observer = new IntersectionObserver(
    (entries) => {
      entries
        .filter((en) => en.isIntersecting)
        .forEach((en) => (activeId.value = en.target.dataset.gid))
    },
    { rootMargin: '-90px 0px -65% 0px', threshold: 0 }
  )
  cards.forEach((c) => observer.observe(c))
}

onMounted(setupObserver)
onActivated(setupObserver)
onBeforeUnmount(() => observer?.disconnect())
</script>

<style scoped>
/* 默认（窄屏）：目录在顶部横向滚动 */
.guide {
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

.no {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.4px;
  padding: 2px 7px;
  border-radius: 6px;
  font-family: "SFMono-Regular", Menlo, monospace;
  color: var(--el-color-primary);
  background: var(--nav-active-bg);
  border: 1px solid var(--nav-active-border);
  flex-shrink: 0;
}

/* 右侧内容 */
.guide-main {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-width: 0;
}

.head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
}

.src-link {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: var(--el-color-primary);
  text-decoration: none;
  white-space: nowrap;
}
.src-link:hover {
  color: var(--el-color-primary-light-3);
}

.intro {
  margin: 0;
  font-size: 14px;
  line-height: 1.8;
  color: var(--el-text-color-regular);
}

.sec-head {
  display: flex;
  align-items: center;
  gap: 10px;
}

.sec-intro {
  margin: 0 0 4px;
  font-size: 13px;
  line-height: 1.8;
  color: var(--el-text-color-regular);
}

/* 子标题 */
.sub {
  margin-top: 18px;
}
.sub-name {
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}
.sub-intro {
  margin: 4px 0 0;
  font-size: 13px;
  line-height: 1.7;
  color: var(--el-text-color-secondary);
}

/* 提示词公式 */
.formula {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin-top: 10px;
  padding: 12px;
  border-radius: 10px;
  background: var(--soft-fill);
  border: 1px solid var(--glass-border);
}
.formula-tag {
  flex-shrink: 0;
  font-size: 11px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 6px;
  color: var(--el-color-primary);
  background: var(--nav-active-bg);
  border: 1px solid var(--nav-active-border);
}
.formula-text {
  font-size: 13px;
  line-height: 1.7;
  color: var(--el-text-color-primary);
  white-space: pre-wrap;
  word-break: break-word;
}

/* 字段构成 */
.fields {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  margin-top: 12px;
}
.field-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 12px;
  border-radius: 10px;
  background: var(--soft-fill);
  border: 1px solid var(--glass-border);
}
.field-top {
  display: flex;
  align-items: center;
  gap: 8px;
}
.field-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}
.field-desc {
  font-size: 12px;
  line-height: 1.6;
  color: var(--el-text-color-secondary);
}

.note {
  margin-top: 12px;
}

/* 示例 */
.example {
  margin-top: 12px;
  padding: 12px;
  border-radius: 10px;
  background: var(--soft-fill);
  border: 1px solid var(--glass-border);
}
.ex-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.ex-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}
.ex-refs {
  display: flex;
  align-items: center;
  gap: 5px;
  margin-top: 6px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.ex-prompt {
  margin: 8px 0 0;
  font-size: 13px;
  line-height: 1.8;
  color: var(--el-text-color-regular);
  white-space: pre-wrap;
}

@media (min-width: 901px) {
  .guide {
    display: grid;
    grid-template-columns: minmax(168px, 200px) minmax(0, 1fr);
    gap: 20px;
    align-items: start;
  }
  .toc {
    position: sticky;
    top: 88px;
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
  .guide-main {
    width: 100%;
    margin: 0;
    min-width: 0;
  }
}

@media (max-width: 720px) {
  .fields {
    grid-template-columns: 1fr;
  }
}
</style>
