/* test-nav-features.js
   验证「手机导航」增强：从我位置出发 / 实时路况开关 / ETA / 开始导航面板 / 转向解析
   运行：node scripts/test-nav-features.js */
const fs = require('fs');
const vm = require('vm');
const path = require('path');

const root = path.resolve(__dirname, '..');
const appSrc = fs.readFileSync(path.join(root, 'app.js'), 'utf8');
const htmlSrc = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

let pass = 0, fail = 0;
function expect(name, cond) {
  if (cond) { pass++; console.log('  ✓ ' + name); }
  else { fail++; console.log('  ✗ ' + name); }
}

/* ---- 提取纯函数 ---- */
function extractFn(name) {
  const re = new RegExp('function ' + name + '\\s*\\(([^)]*)\\)');
  const m = re.exec(appSrc);
  if (!m) return null;
  const start = m.index;
  let bodyStart = appSrc.indexOf('{', start);
  let depth = 1, i = bodyStart + 1;
  while (i < appSrc.length && depth > 0) {
    if (appSrc[i] === '{') depth++; else if (appSrc[i] === '}') depth--;
    i++;
  }
  return appSrc.substring(start, i);
}
function extractVar(name) {
  const re = new RegExp('var ' + name + '\\s*=');
  const m = re.exec(appSrc);
  if (!m) return null;
  let eq = appSrc.indexOf('=', m.index);
  let end = eq + 1, depth = 0;
  while (end < appSrc.length) {
    const ch = appSrc[end];
    if (ch === '{' || ch === '[') depth++;
    else if (ch === '}' || ch === ']') { if (depth === 0) break; depth--; }
    else if (ch === ';' && depth === 0) break;
    end++;
  }
  return appSrc.substring(m.index, end + 1);
}

const sandbox = {
  console, Math, Date, Object, Array, Number, String, JSON, RegExp,
  parseFloat, parseInt, isNaN,
  document: { getElementById: () => null, querySelector: () => null, querySelectorAll: () => [], addEventListener: () => {}, body: { classList: { add(){}, remove(){} } } },
  window: {}, navigator: {}
};
vm.createContext(sandbox);

['fmtDuration','fmtETA','escapeHtml','maneuverFromText'].forEach(n => {
  const c = extractFn(n);
  if (c) vm.runInContext(c + '\nthis.' + n + ' = ' + n + ';', sandbox);
});
['MODE_META','PREF_META'].forEach(n => {
  const c = extractVar(n);
  if (c) vm.runInContext(c + '\nthis.' + n + ' = ' + n + ';', sandbox);
});

console.log('== A. ETA 预计到达时间 ==');
expect('fmtETA 是函数', typeof sandbox.fmtETA === 'function');
const eta = sandbox.fmtETA(2.5); // 现在 + 2.5h
expect('fmtETA 返回 HH:MM 格式', /^\d{2}:\d{2}$/.test(eta));
expect('fmtETA 比当前时间晚（小时部分在合理范围）', (function(){
  const now = new Date();
  const nowH = now.getHours();
  const etaH = parseInt(eta.slice(0,2), 10);
  const diff = (etaH - nowH + 24) % 24;
  return diff === 2 || diff === 3; // 2.5h 后，可能跨小时
})());
expect('fmtETA(0) 返回当前时间 HH:MM', /^\d{2}:\d{2}$/.test(sandbox.fmtETA(0)));

console.log('== B. 转向解析 maneuverFromText ==');
const m = sandbox.maneuverFromText;
expect('maneuverFromText 是函数', typeof m === 'function');
expect('「右转进入长安街」→ right', m('右转进入长安街').dir === 'right');
expect('「左转」→ left', m('向左转入辅路').dir === 'left');
expect('「靠左行驶」→ slight-left', m('靠左行驶').dir === 'slight-left');
expect('「靠右」→ slight-right', m('靠右侧车道').dir === 'slight-right');
expect('「掉头」→ uturn', m('前方50米掉头').dir === 'uturn');
expect('「到达目的地」→ arrive', m('到达目的地').dir === 'arrive');
expect('「从公司出发」→ depart', m('从公司出发').dir === 'depart');
expect('普通「沿主路行驶」→ straight', m('沿主路行驶约10公里').dir === 'straight');

console.log('== C. HTML 元素齐备 ==');
expect('index.html 含 routeLocateBtn（从我位置出发）', /id="routeLocateBtn"/.test(htmlSrc));
expect('index.html 含 trafficToggle（实时路况开关）', /id="trafficToggle"/.test(htmlSrc));
expect('index.html 含 navOverlay（全屏导航面板）', /id="navOverlay"/.test(htmlSrc));
expect('routeLocateBtn 在起点搜索框内', /data-which="start"[\s\S]*?id="routeLocateBtn"/.test(htmlSrc));

console.log('== D. JS 功能接入 ==');
expect('bindRouteEvents 内绑定 routeLocateBtn', /getElementById\('routeLocateBtn'\)[\s\S]*?navigator\.geolocation/.test(appSrc));
expect('定位成功写 routeStartCity + syncRouteSelects', /routeStartCity = \{[\s\S]*?__loc: true[\s\S]*?syncRouteSelects/.test(appSrc));
expect('定位失败 toast 提示降级', /定位失败，请手动输入起点/.test(appSrc));
expect('trafficToggle 用 AMap.TrafficLayer 叠加/移除', /new window\.AMap\.TrafficLayer\(\)[\s\S]*?_trafficLayer\.setMap/.test(appSrc));
expect('trafficToggle 切换 aria-pressed 状态', /aria-pressed/.test(appSrc));
expect('openNavigation 函数存在', /function openNavigation\(plan, start, end\)/.test(appSrc));
expect('buildRouteHTML 含 开始导航 按钮', /id="routeNavBtn"[^>]*>🧭 开始导航/.test(appSrc));
expect('openNavigation 绑定到 routeNavBtn 点击', /querySelector\('#routeNavBtn'\)[\s\S]*?openNavigation\(lastPlanResult/.test(appSrc));
expect('导航面板含 ETA / 剩余 / 大箭头 / 步骤列表 / 下一段', /nav-eta-time/.test(appSrc) && /nav-remain/.test(appSrc) && /nav-arrow/.test(appSrc) && /nav-steps/.test(appSrc) && /navAdvance/.test(appSrc));
expect('导航支持语音播报（speechSynthesis）', /speechSynthesis/.test(appSrc));
expect('导航支持 ESC / 方向键关闭与步进', /Escape/.test(appSrc) && /ArrowDown/.test(appSrc));
expect('buildRouteHTML 顶部摘要含 预计到达 ETA', /预计 <strong>' \+ fmtETA/.test(appSrc) || /fmtETA\(plan\.strategies\[0\]\.timeH\)/.test(appSrc));

console.log('\n' + pass + '/' + (pass + fail) + ' 通过');
process.exit(fail ? 1 : 0);
