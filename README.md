# Seedance 2.0 视频生成

基于 **Seedance 2.0** 视频模型的 Web 应用：填入 API Key 即可在浏览器里文生视频、图生视频、多模态生成，并实时轮询进度、在线预览与下载。

前端 **Vue 3 + Element Plus**，后端是一个 **Cloudflare Worker**（托管静态资源 + 反向代理解决跨域），可一键部署到 Cloudflare，无需服务器、无需数据库。

> 暗色电影工作室风格 UI · 支持明/暗主题切换 · 生成记录本地保存

---

## ✨ 功能

- **5 种生成模式**：文生视频、首帧/图参考、首尾帧、多图参考、多模态（图/视频/音频混合）
- **实时进度**：提交后自动轮询任务状态，进度条 + 运行日志
- **结果处理**：在线预览、复制链接、新窗口打开、代理下载
- **错误链解析**：把多层嵌套的 API 错误拆解展示，定位问题更快
- **API 文档页**：内置 6 个接口的参数说明与请求示例（左侧固定目录，滚动联动）
- **历史记录**：生成记录保存在浏览器本地，可回看或重新填入参数
- **API 配置**：网关地址 / Key / 同源代理开关，全部存在浏览器本地，不上传服务器

---

## 🧱 技术栈

| 层 | 技术 |
|---|---|
| 前端 | Vue 3、Vue Router、Pinia（持久化）、Element Plus、Vite |
| 后端 | Cloudflare Worker（静态资源 `[assets]` 绑定 + `/proxy` 反向代理）|
| 本地预览 | Vite Dev Server / Wrangler / `server.py`（Python 标准库）|

---

## 📁 目录结构

```
seedance-web/
├── frontend/              # 前端工程（Vue3 + Vite）
│   ├── src/
│   │   ├── api/           # Seedance 接口请求、错误解析、payload 构建
│   │   ├── layout/        # 顶栏 + 霓虹背景布局壳
│   │   ├── store/         # config（API 配置）/ ui（主题）/ history（历史）
│   │   ├── views/         # generate / history / config / docs / about
│   │   └── style.css      # 主题变量（明暗双主题）
│   └── vite.config.js     # 构建输出到 ../public
├── src/index.js           # Cloudflare Worker：静态托管 + /proxy 反代
├── wrangler.toml          # Worker 配置（[assets] + [build] 自动构建前端）
├── server.py              # 可选：纯静态本地预览 + 代理（Python）
└── public/                # 构建产物（自动生成，已 gitignore）
```

---

## 🚀 本地开发

需要 Node.js 18+。

```bash
cd frontend
npm install
npm run dev          # → http://localhost:3001
```

Vite 已内置 `/proxy` 转发到上游，开发时无需另起代理。首次进入页面到「**API 配置**」填入你的 API Key 即可。

### 跟线上一致的预览（Cloudflare 运行时）

```bash
# 在项目根目录
npx wrangler dev     # → http://localhost:8787，会自动构建前端
```

---

## ☁️ 部署到 Cloudflare

本项目**无需绑定任何资源**（没有数据库/KV/R2/密钥），唯一的绑定是静态资源 `[assets]`，已在 `wrangler.toml` 配好。

### 方式 A：命令行

```bash
npx wrangler login
npx wrangler deploy   # 自动构建前端 + 上传
```

### 方式 B：GitHub 自动部署（Workers Builds）

1. 把仓库推到 GitHub
2. Cloudflare 控制台 → **Workers & Pages** → **Create** → **Workers** → **Import a repository**
3. 选中本仓库，构建配置：
   - **Build command**：留空
   - **Deploy command**：`npx wrangler deploy`
   - **Root directory**：`/`
4. 创建后，每次 `git push` 到 `main` 自动重新部署

> `npx wrangler deploy` 会触发 `wrangler.toml` 里的 `[build]` 钩子自动构建前端，Cloudflare 端无需额外配置。

---

## ⚙️ 配置说明

| 项 | 说明 |
|---|---|
| API 地址 | 星辰网关地址，默认 `https://ai.centos.hk` |
| 视频接口路径 | 默认 `/v1/videos` |
| API Key | 须为 `seedance` 分组，否则可能提示 `model_price_error`；仅存浏览器本地 |
| 同源代理转发 | 开启后请求走同源 `/proxy`（由 Worker / `server.py` 反代），解决浏览器跨域 |

---

## 📖 API 参考

应用内「**API 文档**」页已内置以下接口的参数与示例，详情见各接口的 Apifox 原文：

- 文生视频 · 首尾帧/图生视频 · 多图参考 · 多模态 · 官方格式参数 · 查询生成结果

核心约定：

- 创建任务 `POST /v1/videos`，查询 `GET /v1/videos/{id}`
- 状态枚举：`queued` / `in_progress` / `completed` / `failed`
- 视频链接在 `metadata.url`，Token 消耗在 `metadata.total_tokens`
- 任务 ID 仅保存 7 天，签名视频链接 24 小时有效

---

## 📝 说明

- API Key 与生成历史仅保存在你的浏览器本地，不会上传到第三方。
- 提示词建议写清画面主体、镜头运动、风格氛围，中文不超过 500 字。
