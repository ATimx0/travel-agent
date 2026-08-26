// 攻略生成核心逻辑（纯 Node，不依赖任何 Web 框架）。
// 被以下三种部署方式共用：
//   1) 本地 server/index.js
//   2) Vercel 函数 api/guide.js
//   3) 腾讯云 SCF 函数 tencent-scf/index.js
// 所有大模型配置均从环境变量读取：
//   LLM_API_KEY / LLM_BASE_URL / LLM_MODEL / LLM_TEMPERATURE / LLM_TIMEOUT

function buildSystemPrompt() {
  return '你是一位资深的旅行攻略创作者，擅长写小红书风格、实用又走心的中国城市旅行攻略。' +
    '你只输出一个 JSON 对象，不要任何额外解释文字、不要 markdown 代码块包裹。';
}

function buildUserPrompt(city, category, spots) {
  const spotText = spots.length
    ? spots.map(function (s, i) { return (i + 1) + '. ' + (s.name || '') + '（' + (s.emoji || '') + '）：' + (s.intro || ''); }).join('\n')
    : '（前端未提供景点数据，请基于该城市常识合理推荐）';

  return '请为「' + city.name + '」生成一篇「' + category + '」主题的全面旅行攻略，风格参考小红书（口语化、有情绪、有干货、分点清晰）。\n\n' +
    '【城市信息】\n' +
    '- 名称：' + city.name + '\n' +
    '- 地区：' + (city.region || '中国') + '\n' +
    '- 一句话简介：' + (city.description || '') + '\n' +
    '- 最佳季节：' + (city.bestSeason || '全年适宜') + '\n' +
    '- 已知景点与简介：\n' + spotText + '\n\n' +
    '【主题要求】请按「' + category + '」来编排：\n' +
    '- 一日游：紧凑高效，一天内玩透核心；\n' +
    '- 两天一夜：分 Day1/Day2，并给出住宿区域建议；\n' +
    '- 情侣游 / 二人游：侧重浪漫氛围、二人互动、出片机位；\n' +
    '- 亲子游：侧重适合孩子、节奏舒缓、安全；\n' +
    '- 美食探店：侧重餐厅/小吃、必点菜、人均；\n' +
    '- 摄影打卡：侧重机位、最佳时间、构图建议。\n\n' +
    '请严格输出如下 JSON（字段用中文，emoji 用常见表情）：\n' +
    '{\n' +
    '  "title": "吸引人的攻略标题（含城市与主题，带 emoji）",\n' +
    '  "emoji": "封面主 emoji",\n' +
    '  "summary": "2-3 句小红书风格种草引言",\n' +
    '  "tags": ["标签1","标签2","标签3"],\n' +
    '  "highlights": ["必打卡亮点1","必打卡亮点2","必打卡亮点3"],\n' +
    '  "itinerary": [\n' +
    '    {"day":"Day1","time":"09:00","title":"环节标题","detail":"具体做什么、怎么玩、小贴士","spot":"关联景点名(可空)"}\n' +
    '  ],\n' +
    '  "food": [\n' +
    '    {"name":"餐厅/小吃名","rec":"为什么值得吃、怎么点"}\n' +
    '  ],\n' +
    '  "tips": ["实用贴士1","实用贴士2"],\n' +
    '  "budget": {"perPerson":"人均约 ¥xxx","note":"费用构成说明"}\n' +
    '}\n\n' +
    '要求：itinerary 每半天 1-2 个环节，共 3-8 条，基于所给景点并可补充合理周边；detail 具体可操作；' +
    'tips 3-6 条含交通/预约/避坑；内容真实可行，不要编造不存在的景点。只返回 JSON。';
}

async function generateGuide(input) {
  const body = input || {};
  const city = body.city || {};
  const category = body.category || '一日游';
  const spots = Array.isArray(body.spots) ? body.spots : [];

  const LLM_API_KEY = process.env.LLM_API_KEY || '';
  const LLM_BASE_URL = process.env.LLM_BASE_URL || 'https://api.deepseek.com/v1';
  const LLM_MODEL = process.env.LLM_MODEL || 'deepseek-chat';
  const LLM_TEMPERATURE = process.env.LLM_TEMPERATURE ? Number(process.env.LLM_TEMPERATURE) : 0.9;
  const LLM_TIMEOUT = process.env.LLM_TIMEOUT ? Number(process.env.LLM_TIMEOUT) : 45000;

  if (!LLM_API_KEY) {
    const e = new Error('未配置大模型 API Key。请在环境变量中填写 LLM_API_KEY（本地：server/.env；云端：平台的环境变量设置）。');
    e.status = 503;
    throw e;
  }
  // 把明显的占位符（比如 .env 模板里的 sk-your-deepseek-key-here）当作"未配置"，
  // 自动走本地兜底预览，避免真的去请求 DeepSeek 被 401 拒绝、UI 出红框报错。
  if (/sk-your-|your-deepseek-key-here|EXAMPLE|placeholder/i.test(LLM_API_KEY)) {
    const e = new Error('检测到占位符 API Key（未替换 .env 模板）。当前使用「本地兜底预览」，不会调用大模型。如需真实 AI 攻略，请在 server/.env 把 LLM_API_KEY 替换为真实 Key。');
    e.status = 503;
    throw e;
  }
  if (!city.name) {
    const e = new Error('缺少城市信息（city.name）');
    e.status = 400;
    throw e;
  }

  try {
    const controller = new AbortController();
    const timer = setTimeout(function () { controller.abort(); }, LLM_TIMEOUT);

    const upstream = await fetch(LLM_BASE_URL.replace(/\/+$/, '') + '/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + LLM_API_KEY,
      },
      body: JSON.stringify({
        model: LLM_MODEL,
        messages: [
          { role: 'system', content: buildSystemPrompt() },
          { role: 'user', content: buildUserPrompt(city, category, spots) },
        ],
        temperature: LLM_TEMPERATURE,
        max_tokens: 2200,
        response_format: { type: 'json_object' },
      }),
      signal: controller.signal,
    });
    clearTimeout(timer);

    if (!upstream.ok) {
      const txt = await upstream.text();
      // 把常见错误码翻译成人话，避免用户看英文一脸懵
      let friendly = '大模型接口返回 ' + upstream.status + '：' + txt.slice(0, 300);
      if (upstream.status === 402) {
        friendly = 'DeepSeek 账户余额不足（402）。请到 https://platform.deepseek.com 的「余额管理」充值（最低 10 元左右）后，重新点击「生成攻略」即可。';
      } else if (upstream.status === 401) {
        friendly = 'DeepSeek API Key 无效（401）。请确认 server/.env 里的 LLM_API_KEY 是否完整、未带多余空格，且没有被当成占位符。';
      } else if (upstream.status === 429) {
        friendly = '请求太频繁被限流（429）。请稍等十几秒再试一次。';
      }
      const e = new Error(friendly);
      e.status = 502;
      throw e;
    }

    const data = await upstream.json();
    const raw = data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
    if (!raw) {
      const e = new Error('大模型返回内容为空');
      e.status = 502;
      throw e;
    }

    // 兼容模型偶尔包裹 ```json 的情况
    let guide = null;
    try {
      guide = JSON.parse(raw);
    } catch (e) {
      const m = raw.match(/\{[\s\S]*\}/);
      if (m) {
        try { guide = JSON.parse(m[0]); } catch (e2) { /* ignore */ }
      }
    }
    if (!guide || typeof guide !== 'object') {
      const e = new Error('大模型返回内容不是合法 JSON');
      e.status = 502;
      throw e;
    }

    // 简单字段兜底
    guide.title = guide.title || ((city.emoji || '') + ' ' + city.name + category + '攻略');
    guide.emoji = guide.emoji || city.emoji || '🧭';
    guide.summary = guide.summary || '';
    guide.tags = Array.isArray(guide.tags) ? guide.tags : [];
    guide.highlights = Array.isArray(guide.highlights) ? guide.highlights : [];
    guide.itinerary = Array.isArray(guide.itinerary) ? guide.itinerary : [];
    guide.food = Array.isArray(guide.food) ? guide.food : [];
    guide.tips = Array.isArray(guide.tips) ? guide.tips : [];
    guide.budget = guide.budget && typeof guide.budget === 'object' ? guide.budget : { perPerson: '', note: '' };

    return guide;
  } catch (err) {
    if (err.name === 'AbortError') {
      const e = new Error('大模型请求超时，请稍后重试或调大 LLM_TIMEOUT');
      e.status = 504;
      throw e;
    }
    if (err.status) throw err; // 已是带 status 的业务错误，直接透传
    console.error('[guide] 生成失败:', err);
    const e = new Error('攻略生成失败：' + (err.message || err));
    e.status = 500;
    throw e;
  }
}

module.exports = { generateGuide, buildSystemPrompt, buildUserPrompt };
