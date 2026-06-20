<template>
  <div class="shell">
    <div class="bg-glow"></div>

    <header class="topbar">
      <div class="brand">
        <span class="logo-mark">
          <img
            class="logo-img"
            src="https://seedance2.ai/favicon.ico"
            alt="Seedance"
            width="34"
            height="34"
          />
        </span>
        <span class="logo-text">
          <span class="logo-prefix">君の星辰</span>
          <span class="logo-sep" aria-hidden="true"></span>
          <span class="logo-name">
            Seedance<span class="logo-ver">2.0</span>
          </span>
        </span>
      </div>

      <div class="topbar-end">
        <nav class="nav">
          <router-link
            v-for="m in menus"
            :key="m.path"
            :to="m.path"
            class="nav-item"
            active-class="active"
          >
            <Icon :icon="m.meta.icon" width="17" height="17" />
            <span class="nav-label">{{ m.meta.title }}</span>
          </router-link>
        </nav>

        <button
          type="button"
          class="theme-toggle"
          :title="ui.dark ? '切换浅色' : '切换深色'"
          :aria-label="ui.dark ? '切换浅色模式' : '切换深色模式'"
          @click="ui.toggleDark($event)"
        >
          <span class="toggle-icon" :key="ui.dark ? 'sun' : 'moon'">
            <Icon
              :icon="ui.dark ? 'mingcute:sun-line' : 'mingcute:moon-line'"
              width="18"
              height="18"
            />
          </span>
        </button>
      </div>
    </header>

    <main class="content">
      <router-view v-slot="{ Component, route }">
        <transition name="page" mode="out-in">
          <keep-alive>
            <component :is="Component" :key="route.path" />
          </keep-alive>
        </transition>
      </router-view>
    </main>
  </div>
</template>

<script setup>
import { Icon } from '@iconify/vue'
import { menuRoutes } from '@/router'
import { useUiStore } from '@/store/ui'

const ui = useUiStore()
const menus = menuRoutes.map((r) => ({ path: `/${r.path}`, meta: r.meta }))
</script>

<style scoped>
.shell {
  min-height: 100%;
  position: relative;
}

/* 霓虹辉光背景 */
.bg-glow {
  position: fixed;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  transition: background 0.45s ease;
  background:
    radial-gradient(620px circle at 12% 8%, var(--glow-a), transparent 60%),
    radial-gradient(520px circle at 88% 14%, var(--glow-b), transparent 55%),
    radial-gradient(760px circle at 72% 96%, var(--glow-c), transparent 60%);
  animation: glow-drift 16s ease-in-out infinite alternate;
}

@keyframes glow-drift {
  from {
    transform: translate3d(0, 0, 0) scale(1);
  }
  to {
    transform: translate3d(-2%, 1.5%, 0) scale(1.08);
  }
}

/* 顶栏 */
.topbar {
  position: sticky;
  top: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 14px 32px;
  flex-wrap: wrap;
  background: var(--topbar-bg);
  border-bottom: 1px solid var(--glass-border);
  transition: background 0.45s ease, border-color 0.45s ease;
}

.brand {
  display: flex;
  align-items: center;
  gap: 9px;
}

.logo-mark {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  border-radius: 10px;
  overflow: hidden;
  flex-shrink: 0;
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  box-shadow: var(--card-shadow);
}

.logo-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
}

.logo-text {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  line-height: 1;
  white-space: nowrap;
  position: relative;
}

.logo-prefix {
  font-size: 13px;
  font-weight: 500;
  letter-spacing: 0.14em;
  background: var(--logo-prefix-gradient);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  filter: var(--logo-prefix-filter);
}

.logo-sep {
  width: 1px;
  height: 15px;
  flex-shrink: 0;
  background: linear-gradient(
    180deg,
    transparent,
    var(--logo-sep-color) 45%,
    transparent
  );
  opacity: 0.85;
}

.logo-name {
  font-size: 17px;
  font-weight: 700;
  letter-spacing: 0.02em;
  background: var(--logo-name-gradient);
  background-size: 220% auto;
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: logo-shimmer 7s ease-in-out infinite;
  filter: var(--logo-name-filter);
}

.logo-ver {
  margin-left: 1px;
  font-size: 0.72em;
  font-weight: 800;
  letter-spacing: 0.04em;
  background: var(--logo-ver-gradient);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  vertical-align: baseline;
}

.brand:hover .logo-name {
  animation-duration: 3.5s;
}

@keyframes logo-shimmer {
  0%,
  100% {
    background-position: 0% center;
  }
  50% {
    background-position: 100% center;
  }
}

@media (prefers-reduced-motion: reduce) {
  .logo-name {
    animation: none;
    background-size: auto;
  }
}

.topbar-end {
  display: flex;
  align-items: center;
  gap: 10px;
}

.nav {
  display: flex;
  align-items: center;
  gap: 6px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 8px 16px;
  border-radius: 10px;
  font-size: 14px;
  color: var(--el-text-color-secondary);
  text-decoration: none;
  border: 1px solid transparent;
  transition:
    color 0.2s cubic-bezier(0.4, 0, 0.2, 1),
    background 0.2s cubic-bezier(0.4, 0, 0.2, 1),
    border-color 0.2s cubic-bezier(0.4, 0, 0.2, 1),
    box-shadow 0.2s cubic-bezier(0.4, 0, 0.2, 1),
    transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.nav-item:hover {
  color: var(--el-text-color-primary);
  background: var(--nav-hover-bg);
}

.nav-item.active {
  color: var(--nav-active-color);
  background: var(--nav-active-bg);
  border-color: var(--nav-active-border);
  box-shadow: var(--nav-active-glow);
}

.theme-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 10px;
  border: 1px solid var(--glass-border);
  background: var(--theme-toggle-bg);
  color: var(--theme-toggle-color);
  cursor: pointer;
  flex-shrink: 0;
  transition:
    background 0.45s ease,
    color 0.45s ease,
    border-color 0.45s ease,
    transform 0.2s ease;
}

.theme-toggle:hover {
  background: var(--theme-toggle-hover-bg);
  color: var(--theme-toggle-hover-color);
  border-color: var(--nav-active-border);
}

.theme-toggle:active {
  transform: scale(0.9);
}

.toggle-icon {
  display: flex;
  animation: theme-icon-in 0.45s ease;
}

@keyframes theme-icon-in {
  from {
    opacity: 0;
    transform: rotate(-90deg) scale(0.6);
  }
  to {
    opacity: 1;
    transform: rotate(0deg) scale(1);
  }
}

/* 内容区 */
.content {
  position: relative;
  z-index: 1;
  max-width: 1200px;
  margin: 0 auto;
  padding: 28px 24px 64px;
}

.page-enter-active {
  transition:
    opacity 0.22s cubic-bezier(0.4, 0, 0.2, 1),
    transform 0.22s cubic-bezier(0.4, 0, 0.2, 1);
}

.page-leave-active {
  transition:
    opacity 0.16s cubic-bezier(0.4, 0, 1, 1),
    transform 0.16s cubic-bezier(0.4, 0, 1, 1);
}

.page-enter-from {
  opacity: 0;
  transform: translateY(8px);
}

.page-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

@media (prefers-reduced-motion: reduce) {
  .page-enter-active,
  .page-leave-active {
    transition: opacity 0.01ms linear;
  }

  .page-enter-from,
  .page-leave-to {
    transform: none;
  }
}

@media (max-width: 640px) {
  .topbar {
    padding: 12px 16px;
  }
  .logo-prefix {
    font-size: 11px;
    letter-spacing: 0.1em;
  }
  .logo-name {
    font-size: 14px;
  }
  .logo-sep {
    height: 12px;
  }
  .nav-label {
    display: none;
  }
  .content {
    padding: 20px 14px 48px;
  }
}
</style>
