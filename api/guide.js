// Vercel Serverless 函数入口
// 部署整个 travel-agent 目录到 Vercel 时，本文件会被当作 /api/guide 接口。
// 攻略核心逻辑复用 ../server/guide-core.js。
const { generateGuide } = require('../server/guide-core');

module.exports = async (req, res) => {
  // CORS（允许前端在 CloudStudio 静态站跨域调用）
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const guide = await generateGuide(req.body || {});
    res.json({ guide });
  } catch (e) {
    res.status(e.status || 500).json({ error: e.message });
  }
};
