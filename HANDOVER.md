# 云帆跨境项目交接文档

## 项目基本信息

- **项目名称**：云帆跨境
- **GitHub 仓库**：https://github.com/cw005727-dotcom/cloud-sail
- **线上地址**：https://www.chensan.vip
- **框架**：静态网站 + Vercel Serverless API

## 已完成功能

### 1. 前端页面
- `index.html` - 首页（品牌介绍 + 登录入口）
- `register.html` - 注册页面（姓名、手机号、邀请码）
- `login.html` - 登录页面（手机号 + 密码）
- `dashboard.html` - 工作台（框架，内容待完善）

### 2. 后端 API（Vercel Serverless）
- `api/register.js` - 注册接口（验证邀请码，创建用户）
- `api/login.js` - 登录接口（验证用户，返回 token）

### 3. 已配置的邀请码
```
YF2026A, YF2026B, YF2026C, YF2026D, YF2026E
YF2026F, YF2026G, YF2026H, YF2026J, YF2026K
VIP001, VIP002, VIP003, VIP004, VIP005
CLOUD001, CLOUD002, CLOUD003, CLOUD004, CLOUD005
TEST01, TEST02, TEST03, TEST04, TEST05
DEMO01, DEMO02, DEMO03, DEMO04, DEMO05
```

## 当前问题

### 注册后登录显示"演示模式"
**原因**：Vercel Serverless Functions 无状态，注册接口和登录接口无法共享内存数据

**解决方案**：需要接入数据库

## 下一步任务（待 OpenClaw 完成）

### 优先级 1：接入 Vercel KV 数据库

1. 在 Vercel Storage 里创建 KV 数据库
2. 获取 `KV_REST_API_URL` 和 `KV_REST_API_TOKEN`
3. 修改 `api/register.js`，注册时把用户数据写入 KV
4. 修改 `api/login.js`，登录时从 KV 读取验证

### 优先级 2：完善工作台页面
- `dashboard.html` 需要显示用户信息
- 添加退出登录功能

### 优先级 3：后续功能（待定）
- 商品采集功能
- AI 图文优化
- 数据分析展示

## 技术栈

- **前端**：HTML + CSS + JavaScript（原生，无框架）
- **后端**：Vercel Serverless Functions（Node.js）
- **数据库**：Vercel KV（待接入）
- **部署**：Vercel + GitHub 自动部署
- **域名**：Cloudflare 托管，CNAME 指向 Vercel

## Vercel 账号信息

需要用户提供：
- Vercel 登录邮箱/手机号
- 项目已关联 GitHub

## 代码文件清单

```
cloud-sail/
├── index.html          # 首页
├── register.html       # 注册页
├── login.html          # 登录页
├── dashboard.html      # 工作台
└── api/
    ├── register.js     # 注册 API
    └── login.js        # 登录 API
```

## 操作命令

### 本地开发
```bash
cd ~/workspace/cloud-sail
vercel dev  # 本地预览
```

### 部署
推送代码到 GitHub，Vercel 自动部署

### 查看 Vercel 日志
```bash
vercel logs cloud-sail
```

---

## 交接时用户提供的飞书信息（待补充）

用户想把用户数据存到飞书多维表格，但尚未提供：
- 飞书应用 App ID
- 飞书应用 App Secret
- 多维表格 App Token
- 多维表格 Table ID

如需接入飞书多维表格，需用户提供上述信息。

---

**文档更新时间**：2026-04-22
**交接人**：Hermes Agent
