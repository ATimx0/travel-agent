// 地图配置（高德 AMap）—— 本项目只需修改这一处
// 把下面两行换成你在高德开放平台申请的 Key 和 安全密钥
// 申请地址：https://console.amap.com/
//   创建应用 → 添加 Key → 服务平台务必选「Web端(JS API)」
window.MAP_CONFIG = {
  key: 'b9aa3a3827a5c65ec163da004e02a4fd',
  securityJsCode: '299c56646c6b03a14d2ae9d33f2f7ac3'
};

// 攻略后端地址：
//   留空 '' 表示「同源」——本地用 server/index.js 跑在 localhost:3000，或把整个站+Vercel 函数部署到同一域名时。
//   若把攻略函数单独部署到云端（Vercel / 腾讯云 SCF），在此填写该函数的公网地址，例如：
//     window.GUIDE_API_BASE = 'https://your-project.vercel.app';
//     window.GUIDE_API_BASE = 'https://xxx.apigw.tencentcs.com/release';
//   前端会把攻略请求发往  GUIDE_API_BASE + '/api/guide'。
window.GUIDE_API_BASE = '';
