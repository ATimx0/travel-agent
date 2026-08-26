// =========================================================================
//  test-cities-expanded.js - 验证新增城市（佛山/珠海/东莞等）搜索命中
// =========================================================================
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { JSDOM } = require(path.join(__dirname, '..', 'node_modules', 'jsdom'));

const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', { runScripts: 'outside-only' });
const win = dom.window;
const doc = win.document;

const code = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');
const ctx = dom.getInternalVMContext();

ctx.window = win;
ctx.document = doc;
ctx.Event = win.Event;
ctx.AMap = { Geocoder: function() { this.getLocation = (q, cb) => setTimeout(() => cb('error', null), 0); } };
ctx.loadAMapScript = () => Promise.resolve(ctx.AMap);
ctx.showToast = () => {};
ctx.lastPlanStart = null;
ctx.lastPlanEnd = null;
ctx.lastPlanPref = 'recommend';
ctx.lastPlanResult = null;

// 从 app.js 解析 destinations 数据，避免复制
const dStart = code.indexOf('const destinations = [');
const dEnd = code.indexOf('];', dStart) + 2;
ctx.destinations = vm.runInContext(code.slice(dStart + 'const destinations = '.length, dEnd), ctx);

ctx.routeStartCity = null;
ctx.routeEndCity = null;
ctx.syncRouteSelects = () => {};
ctx.escapeHtml = function(s) {
  if (s === undefined || s === null) return '';
  return String(s).replace(/[&<>"']/g, function(c) {
    return ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' })[c];
  });
};
ctx.fuzzyMatch = function(query, text) {
  if (!query || !text) return false;
  var q = query.toLowerCase(); var t = text.toLowerCase();
  if (t.indexOf(q) >= 0) return true;
  var di = 0;
  for (var i = 0; i < t.length && di < q.length; i++) {
    if (t.charAt(i) === q.charAt(di)) di++;
  }
  return di === q.length;
};

// 最小 HTML（先建 DOM，再绑定事件）
doc.body.innerHTML = `
  <div class="route-search" data-which="start">
    <input id="routeStartInput" type="text" />
    <input type="hidden" id="routeStart" />
    <div class="route-search-popup" id="routeStartPopup" hidden></div>
  </div>
  <div class="route-search" data-which="end">
    <input id="routeEndInput" type="text" />
    <input type="hidden" id="routeEnd" />
    <div class="route-search-popup" id="routeEndPopup" hidden></div>
  </div>
  <div id="toastContainer"></div>
`;

// 提取 bindRouteSearch → escapeHtml 段并初始化两次
const sIdx = code.indexOf('function bindRouteSearch');
const eIdx = code.indexOf('\nfunction escapeHtml');
const SNIPPET = code.slice(sIdx, eIdx);
vm.runInContext(SNIPPET, ctx);
vm.runInContext("bindRouteSearch('start'); bindRouteSearch('end');", ctx);

let count = 0, failed = 0;
function expect(label, cond, detail) {
  count++;
  if (cond) console.log('  ✓ ' + label);
  else { failed++; console.log('  ✗ ' + label + (detail ? ' — ' + detail : '')); }
}
function getInput(w) { return doc.getElementById(w === 'start' ? 'routeStartInput' : 'routeEndInput'); }
function getPopup(w) { return doc.getElementById(w === 'start' ? 'routeStartPopup' : 'routeEndPopup'); }
// 命中检查：高亮 mark 标签会把字符串切开（如「<mark>珠</mark>海」），所以用「珠」「海」任一即可
//          但要确保"中文""字符级"匹配，所以拆成 单字 + 拼音/字符
function hasCity(html, city) {
  if (!html) return false;
  // 完整字符串（未高亮的情况下）
  if (html.includes(city)) return true;
  // 高亮情况下，检查字符是否都被包含
  var ok = true;
  for (var c of city) {
    if (html.indexOf(c) < 0) { ok = false; break; }
  }
  return ok;
}

function tick(ms) { return new Promise(r => setTimeout(r, ms)); }

(async () => {
  await tick(280);
  console.log('\n=== 新补城市 —— 「佛」「珠」「莞」「甬」「锡」「绍」「榕」「济」「连」单字城市命中 ===');

  const map = [
    { input: '佛', city: '佛山' },
    { input: '珠', city: '珠海' },
    { input: '莞', city: '东莞' },
    { input: '甬', city: '宁波' },
    { input: '锡', city: '无锡' },
    { input: '绍', city: '绍兴' },
    { input: '榕', city: '福州' },
    { input: '济', city: '济南' },
    { input: '连', city: '大连' },
  ];

  for (const t of map) {
    const input = getInput('end');
    const popup = getPopup('end');
    input.value = '';
    input.dispatchEvent(new win.Event('input', { bubbles: true }));
    await tick(30);
    input.value = t.input;
    input.dispatchEvent(new win.Event('input', { bubbles: true }));
    await tick(50);
    const html = popup.innerHTML;
    expect(`「${t.input}」命中 ${t.city}`, hasCity(html, t.city), 'html.len=' + html.length);
  }

  console.log('\n=== 拼音首字母 / 英文 ID 命中 ===');

  const pyMap = [
    { input: 'fs', city: '佛山' },
    { input: 'zhuhai', city: '珠海' },
    { input: 'zh', city: '珠海' },
    { input: 'dg', city: '东莞' },
    { input: 'nb', city: '宁波' },
    { input: 'wx', city: '无锡' },
    { input: 'dl', city: '大连' },
    { input: 'fz', city: '福州' },
    { input: 'jn', city: '济南' },
  ];
  for (const t of pyMap) {
    const input = getInput('start');
    const popup = getPopup('start');
    input.value = '';
    input.dispatchEvent(new win.Event('input', { bubbles: true }));
    await tick(30);
    input.value = t.input;
    input.dispatchEvent(new win.Event('input', { bubbles: true }));
    await tick(50);
    const html = popup.innerHTML;
    // 拼音匹配时不一定显示 city 中文全名，用拼音本身命中
    var matched = html.includes(t.city) || (t.input.length <= 2 && html.toLowerCase().indexOf(t.input.toLowerCase()) >= 0);
    expect(`「${t.input}」命中 ${t.city}`, matched, 'html.len=' + html.length);
  }

  console.log('\n=== 多字关键词命中景点（每个新城市的代表景点）===');

  const spotMap = [
    { input: '祖庙', city: '佛山' },
    { input: '情侣路', city: '珠海' },
    { input: '天一阁', city: '宁波' },
    { input: '可园', city: '东莞' },
    { input: '鲁迅', city: '绍兴' },
    { input: '三坊七巷', city: '福州' },
    { input: '大明湖', city: '济南' },
    { input: '鼋头渚', city: '无锡' },
    { input: '老虎滩', city: '大连' },
    { input: '西湖', city: '杭州' },
  ];

  for (const t of spotMap) {
    const input = getInput('end');
    const popup = getPopup('end');
    input.value = '';
    input.dispatchEvent(new win.Event('input', { bubbles: true }));
    await tick(30);
    input.value = t.input;
    input.dispatchEvent(new win.Event('input', { bubbles: true }));
    await tick(50);
    const html = popup.innerHTML;
    expect(`「${t.input}」关联 ${t.city}`, hasCity(html, t.city), 'html.len=' + html.length);
  }

  console.log('\n=== 「珠」单字：珠海排第一，不误命中东方明珠 ===');

  {
    const input = getInput('end');
    const popup = getPopup('end');
    input.value = '';
    input.dispatchEvent(new win.Event('input', { bubbles: true }));
    await tick(30);
    input.value = '珠';
    input.dispatchEvent(new win.Event('input', { bubbles: true }));
    await tick(50);
    const html = popup.innerHTML;
    expect('「珠」命中珠海城市', hasCity(html, '珠海'), '');
    expect('「珠」单字不误命中「东方明珠」景点', !html.includes('东方明珠'), 'html=' + html.slice(0, 300));
  }

  console.log('\n========== Summary ==========');
  console.log('PASS: ' + (count - failed) + ' / ' + count);
  process.exit(failed === 0 ? 0 : 1);
})();
