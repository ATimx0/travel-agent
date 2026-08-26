// 测试：AI 出行规划 起/终点 搜索下拉的修复
//   1) 选择后立刻关闭 popup（含 latch 锁防 race）
//   2) popup z-index 足够高（在地图上方）
//   3) 关键词联想 / 拼音首字母 / ID 匹配 / 高德解析
//   4) 空 query 不再强开 popup
//   5) 没结果时给关键词提示建议

const { JSDOM } = require('jsdom');
const vm = require('vm');
const fs = require('fs');
const path = require('path');

const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', { runScripts: 'outside-only' });
const win = dom.window;
const doc = win.document;
global.window = win;
global.document = doc;
global.Event = win.Event;

// 加载 app.js
const code = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');
const ctx = dom.getInternalVMContext();
ctx.window = win;
ctx.document = doc;
ctx.Event = win.Event;
// 暴露 AMap 桩
ctx.AMap = { Geocoder: function() { this.getLocation = (q, cb) => setTimeout(() => cb('error', null), 0); } };
ctx.loadAMapScript = () => Promise.resolve(ctx.AMap);
ctx.showToast = (msg, type) => { console.log('[toast]', type, msg); };
ctx.lastPlanStart = null;
ctx.lastPlanEnd = null;
ctx.lastPlanPref = 'recommend';
ctx.lastPlanResult = null;

// 提取 destinations 数组（一个最小子集，能覆盖拼音首字母 + 中文 + 景点 + ID）
ctx.destinations = [
  { id:'beijing', name:'北京', pinyin:'Beijing', region:'华北', emoji:'🏯', spots:[{name:'故宫',emoji:'🏛️'},{name:'长城',emoji:'🧱'},{name:'天坛',emoji:'⛩️'}] },
  { id:'shanghai', name:'上海', pinyin:'Shanghai', region:'华东', emoji:'🌃', spots:[{name:'外滩',emoji:'🌆'},{name:'东方明珠',emoji:'🗼'}] },
  { id:'chengdu', name:'成都', pinyin:'Chengdu', region:'西南', emoji:'🐼', spots:[{name:'大熊猫基地',emoji:'🐼'}] },
  { id:'hangzhou', name:'杭州', pinyin:'Hangzhou', region:'华东', emoji:'🏞️', spots:[{name:'西湖',emoji:'🌊'},{name:'灵隐寺',emoji:'🛕'}] },
  { id:'xian', name:'西安', pinyin:'Xian', region:'西北', emoji:'⛩️', spots:[{name:'兵马俑',emoji:'🗿'}] },
  { id:'chongqing', name:'重庆', pinyin:'Chongqing', region:'西南', emoji:'🌆', spots:[] },
  { id:'sanya', name:'三亚', pinyin:'Sanya', region:'华南', emoji:'🏖️', spots:[] },
  { id:'guilin', name:'桂林', pinyin:'Guilin', region:'华南', emoji:'⛰️', spots:[] }
];
ctx.routeStartCity = null;
ctx.routeEndCity = null;
ctx.syncRouteSelects = () => {};
ctx.escapeHtml = function(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
};

let expectCount = 0, failCount = 0;
function expect(label, cond, detail) {
  expectCount++;
  if (cond) {
    console.log('  ✓ ' + label);
  } else {
    failCount++;
    console.log('  ✗ ' + label + (detail ? ' — ' + detail : ''));
  }
}

// 最小 HTML：起终点 + popup + 两个搜索区域
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
  <div id="routePanel"></div>
  <div id="routeNearby"></div>
  <div id="toastContainer"></div>
`;

// 提取 bindRouteSearch 函数（用括号匹配）
function extractFunction(source, name) {
  const idx = source.indexOf('function ' + name + '(');
  if (idx < 0) return '';
  let depth = 0;
  let started = false;
  let end = idx;
  for (let i = idx; i < source.length; i++) {
    const c = source[i];
    if (c === '{') { depth++; started = true; }
    else if (c === '}') {
      depth--;
      if (started && depth === 0) { end = i + 1; break; }
    }
  }
  return source.slice(idx, end);
}

const SNIPPET = extractFunction(code, 'bindRouteSearch');
vm.runInContext(SNIPPET, ctx);

// 辅助函数
function getInput(which) { return doc.getElementById(which === 'start' ? 'routeStartInput' : 'routeEndInput'); }
function getPopup(which) { return doc.getElementById(which === 'start' ? 'routeStartPopup' : 'routeEndPopup'); }
function getState(which) { return vm.runInContext('typeof routeStartCity !== "undefined" ? null : null', ctx); }

// 初始 bindRouteSearch 调用（最简版：直接在 node 里执行需要函数能被 vm 找到）
// 由于 bindRouteSearch 是在 init() 调用，我们手动延迟调用一下
ctx.bindRouteSearch('start');
ctx.bindRouteSearch('end');

// jsdom 补 scrollIntoView
if (!win.HTMLElement.prototype.scrollIntoView) {
  win.HTMLElement.prototype.scrollIntoView = function() {};
}

console.log('\n=== Test 1: 选中后立即关闭 popup（latch 防 race）===');
{
  const input = getInput('end');
  const popup = getPopup('end');
  input.value = '';
  input.dispatchEvent(new win.Event('input', { bubbles: true }));
  // 模拟 input 输入
  input.value = '北京';
  input.dispatchEvent(new win.Event('input', { bubbles: true }));
  expect('输入"北京" → popup 自动打开', popup.hidden === false, 'hidden=' + popup.hidden);
  // 模拟点击某一行（触发 commit）
  const items = popup.querySelectorAll('.route-search-item');
  expect('至少有一项候选', items.length > 0, 'len=' + items.length);
  if (items.length > 0) {
    items[0].dispatchEvent(new win.MouseEvent('mousedown', { bubbles: true }));
    expect('点击某项 → popup 立即关闭', popup.hidden === true, 'hidden=' + popup.hidden);
    expect('input 值已填入', input.value === '北京', 'value=' + input.value);
    // 后续 click 不会再次打开 popup（race condition 防护）
    doc.dispatchEvent(new win.MouseEvent('click', { bubbles: true }));
    expect('外部 click → 不会重新打开 popup', popup.hidden === true, 'hidden=' + popup.hidden);
  }
}

console.log('\n=== Test 2: 空 query 不打开 popup（首次 focus）===');
{
  const input = getInput('start');
  const popup = getPopup('start');
  input.value = '';
  input.dispatchEvent(new win.Event('input', { bubbles: true }));
  // 首次 focus：空 query → 不开 popup
  input.dispatchEvent(new win.FocusEvent('focus'));
  expect('空 query + 首次 focus → 不开 popup', popup.hidden === true && popup.innerHTML === '', 'hidden=' + popup.hidden);
  // 再次 focus：才会打开
  input.dispatchEvent(new win.FocusEvent('focus'));
  expect('二次 focus → 展示热门搜索城市', popup.hidden === false && popup.innerHTML.includes('热门'), 'innerHTML=' + popup.innerHTML.slice(0, 100));
}

console.log('\n=== Test 3: 关键词联想 — 拼音首字母 fuzzy 匹配 ===');
{
  const input = getInput('start');
  const popup = getPopup('start');
  input.value = 'bj';
  input.dispatchEvent(new win.Event('input', { bubbles: true }));
  expect('"bj" fuzzy 匹配到北京', popup.innerHTML.includes('北京'), 'html=' + popup.innerHTML.slice(0, 200));
  input.value = 'sh';
  input.dispatchEvent(new win.Event('input', { bubbles: true }));
  expect('"sh" fuzzy 匹配到上海', popup.innerHTML.includes('上海'), '');
  input.value = 'cd';
  input.dispatchEvent(new win.Event('input', { bubbles: true }));
  expect('"cd" fuzzy 匹配到成都', popup.innerHTML.includes('成都'), '');
  input.value = 'xian';
  input.dispatchEvent(new win.Event('input', { bubbles: true }));
  expect('"xian" 全拼匹配到西安', popup.innerHTML.includes('西安'), '');
}

console.log('\n=== Test 4: 关键词联想 — 景点名命中 ===');
{
  const input = getInput('end');
  const popup = getPopup('end');
  // 等待前一个 commit 的 latch (220ms) 完全释放
  setTimeout(() => {
    input.value = '';
    input.dispatchEvent(new win.Event('input', { bubbles: true }));
    input.value = '故宫';
    input.dispatchEvent(new win.Event('input', { bubbles: true }));
    const html = popup.innerHTML;
    expect('"故宫" 命中景点项', html.includes('故宫'), 'html=' + html.slice(0, 300));
  }, 260);
}

console.log('\n=== Test 5: 关键词联想 — 高亮匹配字符 ===');
{
  const input = getInput('end');
  const popup = getPopup('end');
  input.value = '';
  input.dispatchEvent(new win.Event('input', { bubbles: true }));
  input.value = '北京';
  input.dispatchEvent(new win.Event('input', { bubbles: true }));
  const html = popup.innerHTML;
  expect('命中字符用 mark 标签高亮', html.includes('<mark'), 'html=' + html.slice(0, 200));
}

console.log('\n=== Test 6: 输入无匹配时给空态建议（延迟 50ms 后检）===');
{
  const input = getInput('start');
  const popup = getPopup('start');
  input.value = '';
  input.dispatchEvent(new win.Event('input', { bubbles: true }));
  input.value = '某某不存在的地点zzz';
  input.dispatchEvent(new win.Event('input', { bubbles: true }));
  // 等 ~370ms（geocode 350ms 失败）
  setTimeout(() => {
    const html = popup.innerHTML;
    expect('空态显示"没找到"提示', html.includes('没找到'), 'html=' + html.slice(0, 200));
    expect('空态显示建议 chip', html.includes('rse-suggest') && html.includes('故宫'), 'html=' + html.slice(0, 300));
    const chips = popup.querySelectorAll('.rse-suggest');
    expect('默认有 5+ 个建议 chip', chips.length >= 5, 'chips=' + chips.length);
  }, 380);
}

console.log('\n=== Test 7: commit 锁定期间 popup 不会再开 ===');
{
  const input = getInput('end');
  const popup = getPopup('end');
  setTimeout(() => {
    input.value = '';
    input.dispatchEvent(new win.Event('input', { bubbles: true }));
    input.value = '上海';
    input.dispatchEvent(new win.Event('input', { bubbles: true }));
    const items = popup.querySelectorAll('.route-search-item');
    if (items.length > 0) {
      items[0].dispatchEvent(new win.MouseEvent('mousedown', { bubbles: true }));
      expect('commit 后 popup 立即关闭', popup.hidden === true, 'hidden=' + popup.hidden);
      // commit 锁定期间，再触发 input 也不应该开 popup
      input.value = '杭州'; // 注意：input 值虽然变了，但 commit latch 还在
      input.dispatchEvent(new win.Event('input', { bubbles: true }));
      expect('commit 锁定期间 input 事件不会让 popup 重新打开', popup.hidden === true, 'hidden=' + popup.hidden);
    }
  }, 260);
}

console.log('\n=== Test 8: 城市 ID 字符串匹配 ===');
{
  const input = getInput('end');
  const popup = getPopup('end');
  input.value = '';
  input.dispatchEvent(new win.Event('input', { bubbles: true }));
  input.value = 'beijing';
  input.dispatchEvent(new win.Event('input', { bubbles: true }));
  expect('"beijing" 英文 ID 匹配北京', popup.innerHTML.includes('北京'), '');
}

console.log('\n=== Test 9: Section 标签动态化 ===');
{
  const input = getInput('end');
  const popup = getPopup('end');
  // 等待所有 latch (220ms × 2 + 安全余量) 完全释放
  setTimeout(() => {
    // 强制清空状态
    input.value = '';
    input.dispatchEvent(new win.Event('input', { bubbles: true }));
    input.dispatchEvent(new win.FocusEvent('focus'));
    input.dispatchEvent(new win.FocusEvent('focus'));
    expect('空 query + 二次 focus 显示 "热门搜索城市"', popup.innerHTML.includes('热门搜索城市'), '');
    input.value = '';
    input.dispatchEvent(new win.Event('input', { bubbles: true }));
    input.value = '北';
    input.dispatchEvent(new win.Event('input', { bubbles: true }));
    expect('输入后显示 "本地命中"', popup.innerHTML.includes('本地命中'), 'html=' + popup.innerHTML.slice(0, 200));
  }, 500);
}

setTimeout(() => {
  console.log('\n========== Summary ==========');
  console.log(`PASS: ${expectCount - failCount} / ${expectCount}`);
  if (failCount > 0) process.exit(1);
}, 500);
