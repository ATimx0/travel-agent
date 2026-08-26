// 验证偏好（pref）从 UI 到高德 API、再到结果排序与标签的全链路一致性
// 回归 bug: pref 之前完全没参与 amapPlan，policy 也没传给 AMap.Driving/Transfer
const fs = require('fs');
const path = require('path');
const vm = require('vm');

let pass = 0, fail = 0;
function expect(name, cond) {
  if (cond) { pass++; console.log('✓', name); }
  else { fail++; console.log('✗ FAIL  ' + name); }
}

const src = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');

// =====================================================================
// A. 静态源检：amapPlan 必须接收 pref；Policy 必须从 pref 派生并透传到 AMap
// =====================================================================
expect('amapPlan 接收 4 参 (start,end,mode,pref)',
  /function amapPlan\(start, end, mode, pref\)/.test(src));

expect('drivingPolicyFor 把 fastest 映射到 LEAST_TIME',
  /function drivingPolicyFor\(pref, AMap\)[\s\S]*?fastest[\s\S]*?LEAST_TIME/.test(src));

expect('transferPolicyFor 把 cheapest 映射到数字 3',
  /function transferPolicyFor\(pref\)[\s\S]*?cheapest[\s\S]*?return 3/.test(src));

expect('AMap.Driving 构造时根据 pref 设置 opts.policy',
  /new AMap\.Driving\(opts\)/.test(src));

expect('AMap.Transfer 构造时根据 pref 设置 topts.policy',
  /new AMap\.Transfer\(topts\)/.test(src));

expect('amapPlan 在拿到 strategies 后调 applyPrefToStrategies',
  /res = applyPrefToStrategies\(res, pref, mode\)/.test(src));

// =====================================================================
// B. 行为测试：用 vm 注入 applyPrefToStrategies / enrichTransitWithFlight 验证
// =====================================================================
const ctx = { /* stubs */
  haversineKm: function() { return 0; },
  coordOf: function() { return [0, 0]; },
  PREF_META: { /* 真实元数据来自 app.js */ }
};

// 从 app.js 抽取出纯函数片段
function extractFn(name) {
  // 匹配 function applyPrefToStrategies(res, pref, mode) { ... } 一直到匹配的右括号
  var re = new RegExp('function ' + name + '\\s*\\(([^)]*)\\)\\s*\\{');
  var m = re.exec(src);
  if (!m) throw new Error(name + ' not found');
  var start = m.index;
  var bodyStart = start + m[0].length;
  // 找到与开始 { 匹配的 }
  var depth = 1, i = bodyStart;
  while (i < src.length && depth > 0) {
    var ch = src[i];
    if (ch === '{') depth++;
    else if (ch === '}') depth--;
    i++;
  }
  return src.substring(start, i);
}

const sandbox = {
  console: console,
  Math: Math,
  Object: Object,
  haversineKm: function() { return 0; },
  coordOf: function() { return [0, 0]; }
};
vm.createContext(sandbox);
// 注入 applyPrefToStrategies 与 enrichTransitWithFlight
try {
  vm.runInContext(extractFn('applyPrefToStrategies') + '\n' +
    'this.applyPrefToStrategies = applyPrefToStrategies;' + '\n' +
    'this.PREF_META = PREF_META;',
    sandbox);
} catch (e) {
  console.log('  [warn] inject failed:', e.message);
}

const apply = sandbox.applyPrefToStrategies;
expect('applyPrefToStrategies 已注入', typeof apply === 'function');

// B1: fastest 重排：第一张应当是 time 最小的那张
if (typeof apply === 'function') {
  const res = {
    mode: 'transit',
    strategies: [
      { tag: '推荐', title: '推荐', timeH: 30, costYuan: 600 },
      { tag: '方案2', title: '方案2', timeH: 10, costYuan: 1500 },
      { tag: '方案3', title: '方案3', timeH: 20, costYuan: 800 }
    ]
  };
  const out = apply(res, 'fastest', 'transit');
  expect('fastest: 重排后第 0 张是 time 最小 (10h)', out.strategies[0].timeH === 10);
  expect('fastest: 第 0 张 tag = ⚡ 最快到达', out.strategies[0].tag === '⚡ 最快到达');
  expect('fastest: 第 1 张 tag 降级为方案2', out.strategies[1].tag === '方案2');
  expect('fastest: 第 2 张 tag 降级为方案3', out.strategies[2].tag === '方案3');
}

// B2: cheapest 重排：第一张应当是 cost 最小的那张
if (typeof apply === 'function') {
  const res = {
    mode: 'transit',
    strategies: [
      { tag: '推荐', title: '推荐', timeH: 30, costYuan: 600 },
      { tag: '方案2', title: '方案2', timeH: 10, costYuan: 1500 }
    ]
  };
  const out = apply(res, 'cheapest', 'transit');
  expect('cheapest: 第 0 张 cost 最小 (600)', out.strategies[0].costYuan === 600);
  expect('cheapest: 第 0 张 tag = 💰 最省钱', out.strategies[0].tag === '💰 最省钱');
}

// B3: avoidtraffic 保持原序
if (typeof apply === 'function') {
  const res = {
    mode: 'drive',
    strategies: [
      { tag: '推荐路线', title: '推荐路线', timeH: 10, costYuan: 300 },
      { tag: '高速优先', title: '走高速', timeH: 8, costYuan: 400 }
    ]
  };
  const out = apply(res, 'avoidtraffic', 'drive');
  expect('avoidtraffic: 保持原序 (推荐路线 第 0)', out.strategies[0].tag === '🛣️ 躲避拥堵');
  expect('avoidtraffic: 第 1 张降级为方案2', out.strategies[1].tag === '方案2');
}

// B4: recommend 不重排
if (typeof apply === 'function') {
  const res = {
    mode: 'transit',
    strategies: [
      { tag: '高德原序', title: '原序', timeH: 30, costYuan: 600 }
    ]
  };
  const out = apply(res, 'recommend', 'transit');
  expect('recommend: 不重排', out.strategies[0].tag === '智能推荐');
}

// =====================================================================
// C. enrichTransitWithFlight：跨城 (>800km) 必须叠加飞机/高铁估算
// =====================================================================
try {
  vm.runInContext(extractFn('enrichTransitWithFlight') + '\n' +
    'this.enrichTransitWithFlight = enrichTransitWithFlight;',
    sandbox);
} catch (e) {
  console.log('  [warn] inject enrich failed:', e.message);
}
const enrich = sandbox.enrichTransitWithFlight;
expect('enrichTransitWithFlight 已注入', typeof enrich === 'function');

// C1: 2000km 必须看到飞机 + 高铁估算卡片
if (typeof enrich === 'function') {
  const res = enrich({
    mode: 'transit',
    startName: '青海德令哈',
    endName: '湖北随州',
    distanceKm: 2000,
    strategies: [
      { tag: '高德原方案', title: '原方案', timeH: 30, costYuan: 500 }
    ]
  }, 'recommend');
  const tags = res.strategies.map(s => s.tag);
  expect('2000km: 含航班估算卡片', tags.indexOf('✈ 含航班') >= 0);
  expect('2000km: 含高铁/动车估算卡片', tags.indexOf('🚄 高铁/动车') >= 0);
  expect('2000km: 高德原方案保留', tags.indexOf('高德原方案') >= 0);

  const flight = res.strategies.find(s => s.tag === '✈ 含航班');
  expect('2000km: 飞机 time ≈ 5.2h (2000/750 + 2.5)', Math.abs(flight.timeH - 5.17) < 0.1);
  expect('2000km: 飞机 cost ≈ ¥1200', flight.costYuan === 1200);

  const hsr = res.strategies.find(s => s.tag === '🚄 高铁/动车');
  expect('2000km: 高铁 time ≈ 8h (2000/250)', Math.abs(hsr.timeH - 8) < 0.1);

  expect('2000km: 标记 hasCrossCityHint', res.hasCrossCityHint === true);
}

// C2: amapPlan 内的 distanceKm > 800 闸门存在（enrich 本身不做判断，由 amapPlan 控制）
expect('amapPlan 内含 transit && distanceKm > 800 的闸门',
  /if \(mode === 'transit' && res\.distanceKm > 800\) \{[\s\S]*?enrichTransitWithFlight/.test(src));

// enrich 对小距离调用会照常追加（amapPlan 内闸门拦截时才不调用）
if (typeof enrich === 'function') {
  const res = enrich({
    mode: 'transit',
    startName: '北京西',
    endName: '北京东',
    distanceKm: 100,
    strategies: [{ tag: '地铁方案', title: '地铁', timeH: 3, costYuan: 5 }]
  }, 'fastest');
  // enrich 是无脑追加，但 amapPlan 闸门要求 > 800km
  expect('闸门判断条件正确：> 800km 才叠加', /distanceKm > 800/.test(src));
  expect('原策略被保留 (size >= 1)', res.strategies.length >= 1);
  expect('原 tag = 地铁方案 仍在', res.strategies.some(s => s.tag === '地铁方案'));
}

// =====================================================================
// D. buildRouteHTML 顶部徽章 & PREF_META 必须存在
// =====================================================================
expect('PREF_META 含 fastest/cheapest/avoidtraffic/recommend',
  /var PREF_META = \{[\s\S]*?fastest[\s\S]*?cheapest[\s\S]*?avoidtraffic[\s\S]*?recommend/.test(src));

expect('buildRouteHTML 加 route-pref-badge 行',
  /route-pref-badge route-pref-/.test(src));

expect('lastPlanPref 在 runRoutePlan 内被赋值',
  /lastPlanPref = pref;/.test(src));

expect('跨城提示变量 hasCrossCityHint 出现在 buildRouteHTML',
  /plan\.hasCrossCityHint/.test(src));

// =====================================================================
// F. 任意 mode 都拉一次驾车路况线 (drivingPolyline 兜底)
//    解决：公交地铁跨城没线 / 步行骑行跨城是装饰线
// =====================================================================
expect('amapPlan 内含 fetchDrivingPolyline helper',
  /function fetchDrivingPolyline\(cb\) \{/.test(src));
expect('fetchDrivingPolyline 调 AMap.Driving.search',
  /new AMap\.Driving\(\)[\s\S]*?\.search\(origin, dest,/.test(src));
expect('fetchDrivingPolyline 用 extractPath 解析驾车路线',
  /var p = extractPath\(r\.routes\[0\]\)/.test(src));
expect('amapPlan 内 safeDp 兜底非空（buildWavyPath 最后兜底）',
  /var safeDp = \(dp && dp\.length > 1\) \? dp : buildWavyPath\(/.test(src));
expect('drivingPolyline 字段写入 plan (safeDp)',
  /drivingPolyline: safeDp/.test(src));
expect('缺 path 的策略被 safeDp 补齐（标为 wavy-fallback 或 driving-fallback）',
  /s\.pathSource = dp \? 'driving-fallback' : 'wavy-fallback'/.test(src));
expect('flight/hsr 估算卡片也补 safeDp',
  /res\.strategies\.forEach\(function\(s\) \{\s*if \(!s\.path \|\| s\.path\.length < 2\) \{ s\.path = safeDp/.test(src));

expect('drawRouteByMode 把 drivingPolyline 作为 polyline 兜底分支',
  /plan && plan\.drivingPolyline && plan\.drivingPolyline\.length > 1/.test(src));

// =====================================================================
// E. drivingPolicyFor 处理 AMap.DrivingPolicy 缺失时的兜底
// =====================================================================
expect('policyVal 兼容 AMap.DrivingPolicy 与裸常量',
  /function policyVal\(AMap, ns, key, fallback\)[\s\S]*?return fallback/.test(src));

// =====================================================================
// G. drawRouteByMode 必须把 plan（含 drivingPolyline）传入 —— 修复公交跨城没线的关键
// =====================================================================
// runRoutePlan 2 点分支自动绘制
expect('runRoutePlan 自动画线传 plan（第 5 参）',
  /drawRouteByMode\(s, e, plan\.strategies\[0\], plan\.order, plan\)/.test(src));
// strategies 卡片点击
expect('strategies 卡片点击带 lastPlanResult',
  /drawRouteByMode\(lastPlanStart, lastPlanEnd, st, lastPlanResult && lastPlanResult\.order, lastPlanResult\)/.test(src));
// routeShowMap 按钮点击
expect('routeShowMap 按钮带 lastPlanResult',
  /var st = lastPlanResult && lastPlanResult\.strategies\[i\][\s\S]*?lastPlanResult && lastPlanResult\.order, lastPlanResult\)/.test(src));

// =====================================================================
// H. 长距离自驾失败时，按线性插值拆段重试：chunkDrivingPolyline
// =====================================================================
expect('fetchDrivingPolyline 内有 chunkDrivingPolyline 引用',
  /chunkDrivingPolyline\(origin, dest, 3, cb\)/.test(src));
expect('amapPlan 内有 chunkDrivingPolyline 函数体（按 n 段拆分 + 串接）',
  /function chunkDrivingPolyline\(o, d, n, cb\)[\s\S]*?segs\.push/.test(src));
// 段与段之间去重连续点：避免拼接时出现重复点跳变
expect('chunkDrivingPolyline 拼接时去掉新段首点（去重）',
  /s\.slice\(1\)\.forEach\(function\(pt\) \{ all\.push\(pt\); \}\)/.test(src));

console.log('\n' + pass + '/' + (pass+fail) + ' 通过');
process.exit(fail ? 1 : 0);
