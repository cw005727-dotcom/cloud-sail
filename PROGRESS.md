# 项目进度同步

> 本文件由大脑 agent 整理，供各 AI 协作者了解项目现状和彼此进度。

---

## 一、架构AI 完成的工作（cloud-sail）

### 已完成
1. **`data/courses.json`** — 新增 `siteConfig` 顶层配置：
   - `heroImage`、`heroTitle`、`heroSubtitle`、`sites[]`、`pageTitle`
2. **`ml-center.html`** — 动态化改造：
   - 用 `loadSiteConfig()` 替代硬编码 HERO
   - 从 `/data/courses.json` 读取 siteConfig + sections（一次 fetch）
3. **`api/site-config.js`** — 新建 API 端点：
   - GET → 读取 siteConfig
   - POST → 更新 siteConfig

### 进行中（未完成）
- **`admin.html`** 重写（富文本编辑器 + 网站设置 Tab）— 子 agent 任务未完成就被中断

---

## 二、大脑AI 最新进度（云帆跨境 Pro）

### 项目背景
- 路径：`~/yunfan-pro-dev/`
- 目标：将原来的单文件 `index.html`（122KB，React 18 + Tailwind CDN）重构为 Vite + React 模块化项目

### 已完成 ✅

**1. 项目脚手架**
- `package.json` — Vite + React 18 + Tailwind + Lucide
- `vite.config.js` — 代理 `localhost:8506` 并注入 `X-Admin-Token: YUNFAN_ADMIN_2026`
- `tailwind.config.js` / `postcss.config.js`
- `index.html`

**2. 入口文件**
- `src/main.jsx` — 干净入口，无 AppProvider
- `src/index.css` — Tailwind 初始化 + 自定义动画（popup-zoom / card-in / section-rise / glow-pulse）

**3. 组件**
- `src/components/Icon.jsx` — Lucide 图标封装（默认 size=16）
- `src/context/AppContext.jsx` — 空 context（Vite preload 机制需要）

**4. 视图（全部写入 `src/views/`）**
- `NewsView.jsx` — 5条新闻卡片
- `OrderOverviewView.jsx` — 订单概览（fetch `/api/orders`，搜索+筛选）
- `ShopReputationView.jsx` — 店铺信誉（fetch `/api/shop_reputation`，风险滚动+健康度+信誉图）
- `DataAnalysisView.jsx` — 数据分析（6站点 tab + 5指标卡片 + 6排名 tab）
- `OptimizeTitleView.jsx` — AI标题优化
- `ImageLabView.jsx` — 图片实验室
- `KeywordIntelligenceView.jsx` — 关键词情报
- `BusinessIntroView.jsx` — 业务介绍
- `ActivityCenterView.jsx` — 活动中心
- `LoginPage.jsx` — OAuth登录页（含 Brand 导出）

**5. 主组件**
- `src/App.jsx`（23KB）— 完整应用：topTab + sidebarItem 状态、OAuth回调检测（`?auth=success`）、店铺授权弹窗、4个顶部Tab + 侧边栏 + 移动端底部导航、各视图渲染

**6. 构建验证**
- `npm run build` ✅ 通过（1588模块，JS 990KB / CSS 45KB）
- 开发服务器正常运行 `http://localhost:5173/`

### 技术细节
- 图标：`lucide-react` npm 包
- 样式：`tailwindcss`
- 代理：`vite.config.js` 中 `createSchema` 添加 `'/api': { target: 'http://localhost:8506', changeOrigin: true, headers: { 'X-Admin-Token': 'YUNFAN_ADMIN_2026' } }`
- 生产构建：`minify: 'esbuild'`（Vite v6 内置，移除了 terser）

### 待做 / 待确认
1. `api_server.py` 的 `/api/stores` 是否通了？需要验证
2. 前端登录状态持久化（目前刷新丢失）
3. 商店授权流程（点击"授权"→跳转ML OAuth→回调存DB）
4. admin.html 重写（架构AI未完成的部分）

---

## 三、数据库（yunfan-pro-dev）

- 路径：`~/.accio/.../MID-.../project/mercadolibre.db`
- 表：users / stores / orders_v2 / ai_analysis_logs
- orders_v2: 298条，MLB最多
- stores: 7条，含 nickname 字段

---

## 四、接口（api_server.py）

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/stores` | GET | 店铺列表 |
| `/api/orders` | GET | 订单列表 |
| `/api/shop_reputation` | GET | 店铺信誉 |
| `/api/market_radar` | GET | 市场雷达 |
| `/api/generate_auth_url` | POST | 生成OAuth URL |
| `/api/wechat/send` | POST | 发微信消息 |

---

*更新时间：2026-04-26*
