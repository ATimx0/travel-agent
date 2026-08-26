# 攻略后端部署到云端

攻略功能需要一个 Node 代理来**隐藏 DeepSeek Key 并解决跨域**。本地 `server/` 已经能跑，但要让它「云端稳定可用、手机也能访问」，需要把后端部署成云函数，前端静态托管到 CloudStudio。

> 前端（`index.html` 等）已用 WorkBuddy 内置工具部署到 CloudStudio，得到分享链接；但该链接**只托管静态文件、不含后端**。攻略是否真的调用大模型，取决于下面「函数 URL」是否填好。

---

## 前置：DeepSeek Key（必须）

1. 申请：https://platform.deepseek.com → 注册 → 控制台 → 新建 API Key（有免费额度）。
2. 无论选哪种云，都要把 `LLM_API_KEY` 填到对应平台的**环境变量**里。

---

## 方案 A：腾讯云 SCF（国内访问快，推荐）

1. 注册登录腾讯云：https://cloud.tencent.com
2. 进入 **云函数 SCF** → 新建函数 → 创建方式选「空白函数」→ 运行环境选 **Node.js 18+**。
3. 在函数代码区，把本项目 `tencent-scf/` 目录里的三个文件（`index.js` / `guide-core.js` / `package.json`）上传或粘贴进去（保持同目录）。
4. 进入「函数配置」→ 编辑环境变量，添加：
   - `LLM_API_KEY` = 你的 DeepSeek key
   - `LLM_BASE_URL` = `https://api.deepseek.com`（默认，可改）
   - `LLM_MODEL` = `deepseek-chat`
5. 进入「触发管理」→ **创建「函数 URL」**（公网访问，免 API 网关），复制得到的地址，形如：
   `https://xxx.apigw.tencentcs.com/release`
6. 打开 `travel-agent/config.js`，把 `window.GUIDE_API_BASE` 改成该地址：
   ```js
   window.GUIDE_API_BASE = 'https://xxx.apigw.tencentcs.com/release';
   ```
7. 保存后，前端（CloudStudio 分享链接）硬刷新即可使用真·AI 攻略。

---

## 方案 B：Vercel（最省心，但国内访问可能慢 / 需代理）

1. 注册 Vercel（可用 GitHub 登录）：https://vercel.com
2. 本地安装并登录 CLI：
   ```bat
   npm i -g vercel
   vercel login
   ```
3. 在 `travel-agent/` 目录下执行（把整个项目部署上去，`api/guide.js` 会被当作 Serverless 函数）：
   ```bat
   vercel --prod
   ```
4. 在 Vercel 项目 **Settings → Environment Variables** 添加 `LLM_API_KEY`（值填你的 DeepSeek key）。
5. 部署完成后得到地址，例如 `https://your-project.vercel.app`，函数地址就是 `https://your-project.vercel.app/api/guide`。
6. 把 `config.js` 的 `window.GUIDE_API_BASE` 改为 `https://your-project.vercel.app`（同源也可留空）。
7. 改完再执行一次 `vercel --prod` 让配置生效。

---

## 前端静态托管（CloudStudio）

- 已用 WorkBuddy 内置「CloudStudio 部署」工具部署 `travel-agent/` 目录（含 `index.html`），得到**分享链接**。
- 该链接只托管前端静态文件，**不含后端**；攻略是否真·AI 取决于上方函数 URL 是否已填好并部署。

---

## 本地开发（不使用云，最省事）

```bat
cd travel-agent/server
cp .env.example .env        :: 打开 .env，把 LLM_API_KEY 改成你的 DeepSeek key
node index.js              :: 保持窗口开着
```
浏览器访问 `http://localhost:3000`（此时 `config.js` 的 `GUIDE_API_BASE` 留空即可同源）。

---

## 文件结构说明

| 文件 | 用途 |
| --- | --- |
| `server/guide-core.js` | 攻略生成核心逻辑（纯 Node，被三端共用） |
| `server/index.js` | 本地开发服务器（含静态托管 + `/api/guide`） |
| `server/.env.example` | 本地环境变量模板 |
| `api/guide.js` | Vercel Serverless 函数入口 |
| `tencent-scf/` | 腾讯云 SCF 自包含函数（index.js + guide-core.js + package.json） |
| `config.js` | 前端配置，`GUIDE_API_BASE` 控制攻略请求发往哪里（空=同源） |
