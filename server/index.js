// 攻略生成后端代理（本地开发用）
// 作用：隐藏大模型 API Key、解决浏览器跨域，并托管整个静态站点。
// 攻略生成核心逻辑见 ./guide-core.js（与 Vercel / 腾讯云 SCF 共用）。
// 兼容所有 OpenAI 格式接口（DeepSeek / 通义千问 / 智谱 / OpenAI 等），切换只需改 .env。

require('dotenv').config();
const express = require('express');
const path = require('path');
const { generateGuide } = require('./guide-core');

const app = express();
const ROOT = path.join(__dirname, '..'); // travel-agent 目录，用于托管静态站点
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '1mb' }));

// 允许跨域（方便用 file:// 直接打开前端时也能请求本服务）
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

// 状态检查：前端据此判断密钥是否已配置
app.get('/api/status', (req, res) => {
  res.json({
    configured: Boolean(process.env.LLM_API_KEY),
    provider: process.env.LLM_BASE_URL,
    model: process.env.LLM_MODEL,
  });
});

// 攻略生成
app.post('/api/guide', async (req, res) => {
  try {
    const guide = await generateGuide(req.body || {});
    res.json({ guide });
  } catch (e) {
    const status = e.status || 500;
    res.status(status).json({ error: e.message });
  }
});

// 托管整个静态站点（index.html / app.js / style.css / images ...）
app.use(express.static(ROOT, { extensions: ['html'] }));

app.listen(PORT, () => {
  console.log('✦ 攻略代理服务已启动：http://localhost:' + PORT);
  if (!process.env.LLM_API_KEY) {
    console.log('⚠️  尚未配置 LLM_API_KEY，攻略功能不可用。请复制 server/.env.example 为 server/.env 并填写密钥后重启。');
  }
});
