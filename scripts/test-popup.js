const {JSDOM} = require('jsdom');
const vm = require('vm');

const dom = new JSDOM(`
<section id="guide" class="guide-section">
  <div class="gs-cockpit">
    <div class="gs-cp-dest">
      <input id="guideCityInput" value="">
      <button id="guideCitySwitch">常用 ▾</button>
      <div class="guide-city-popup" id="guideCityPopup" hidden></div>
    </div>
    <div class="gs-cp-seg" id="guideCats"></div>
  </div>
  <div class="gs-e-swatches">
    <button class="gs-swatch" style="isolation:isolate"></button>
    <button class="gs-swatch" style="isolation:isolate"></button>
  </div>
</section>`, {runScripts: 'outside-only'});

const win = dom.window;
const doc = win.document;

const ESC = {
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
};
function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ESC[c]);
}

const SNIPPET = `
function escapeHtml(s) { return String(s).replace(/[&<>"']/g, function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];}); }
window.destinations = [
  {name:'北京', pinyin:'beijing', region:'华北', emoji:'🏯'},
  {name:'西安', pinyin:'xian', region:'西北', emoji:'🏛'},
  {name:'成都', pinyin:'chengdu', region:'西南', emoji:'🐼'},
  {name:'上海', pinyin:'shanghai', region:'华东', emoji:'🛥'}
];
function renderGuidePopup() {
  var popup = document.getElementById('guideCityPopup');
  var inp = document.getElementById('guideCityInput');
  if (!popup || !inp) return;
  var q = (inp.value || '').trim().toLowerCase();
  var matches = window.destinations.slice();
  if (q) {
    matches = matches.filter(function(d) {
      return (d.name||'').toLowerCase().indexOf(q) >= 0 ||
        (d.pinyin||'').toLowerCase().indexOf(q) >= 0 ||
        (d.region||'').toLowerCase().indexOf(q) >= 0;
    });
  }
  var html = '';
  if (matches.length) {
    html += '<div class="gcp-section-title">常用城市（' + matches.length + '）</div>';
    html += matches.slice(0,12).map(function(d) {
      return '<div class="gcp-item" data-city-name="' + escapeHtml(d.name) + '">' +
        '<span class="gcp-emoji">' + (d.emoji||'📍') + '</span>' +
        '<span class="gcp-name">' + escapeHtml(d.name) + '</span>' +
        '<span class="gcp-region">' + escapeHtml(d.region||'') + '</span></div>';
    }).join('');
  } else {
    html += '<div class="gcp-empty">没有匹配的城市。直接输入任意名称（中文/拼音/景点名）后按回车即可 ✏️</div>';
  }
  html += '<div class="gcp-hint">💡 支持任意城市与景点地标，输入即生效</div>';
  popup.innerHTML = html;
}
window.renderGuidePopup = renderGuidePopup;
`;

const ctx = dom.getInternalVMContext();
ctx.console = console;
ctx.setTimeout = setTimeout;
ctx.clearTimeout = clearTimeout;
ctx.setInterval = setInterval;
ctx.clearInterval = clearInterval;
vm.runInContext(SNIPPET, ctx);

const inp = doc.getElementById('guideCityInput');
const popup = doc.getElementById('guideCityPopup');

function dispatch(name) {
  inp.dispatchEvent(new win.Event(name, {bubbles: true}));
}

let pass = 0, fail = 0;
function expect(label, cond) {
  console.log((cond ? 'OK   ' : 'FAIL ') + label);
  cond ? pass++ : fail++;
}

// Case 1：空 query
ctx.renderGuidePopup();
expect('空 query 时 渲染 4 个城市', popup.querySelectorAll('.gcp-item').length === 4);
expect('空 query 时 含 section-title', !!popup.querySelector('.gcp-section-title'));
expect('空 query 时 含 hint', !!popup.querySelector('.gcp-hint'));
expect('空 query 时 不含 empty', !popup.querySelector('.gcp-empty'));

// Case 2：输入「西」 → 命中「西安」(name) + 「成都」(region=西南)
inp.value = '西';
dispatch('input');
ctx.renderGuidePopup();
const xs = popup.querySelectorAll('.gcp-item');
const xsNames = Array.from(xs).map(function(x) { return x.querySelector('.gcp-name').textContent; });
expect('输入「西」过滤 =2 项', xs.length === 2);
expect('  → 含「西安」', xsNames.indexOf('西安') >= 0);
expect('  → 含「成都」（region=西南）', xsNames.indexOf('成都') >= 0);

// Case 3：拼音命中「cheng」→ 成都
inp.value = 'cheng';
dispatch('input');
ctx.renderGuidePopup();
const py = popup.querySelectorAll('.gcp-item');
expect('输入「cheng」过滤 =1 项', py.length === 1);
expect('  → 命中「成都」', py[0] && py[0].querySelector('.gcp-name').textContent === '成都');

// Case 4：大小写不敏感「BEIJING」→ 北京
inp.value = 'BEIJING';
dispatch('input');
ctx.renderGuidePopup();
const bj = popup.querySelectorAll('.gcp-item');
expect('输入「BEIJING」大小写不敏感命中北京', bj.length === 1 && bj[0].querySelector('.gcp-name').textContent === '北京');

// Case 5：无匹配 → empty 提示
inp.value = '火星';
dispatch('input');
ctx.renderGuidePopup();
expect('输入「火星」0 匹配 → 显示 empty', !!popup.querySelector('.gcp-empty'));
expect('  → 0 个 .gcp-item', popup.querySelectorAll('.gcp-item').length === 0);

// Case 6：清空 → 恢复所有
inp.value = '';
dispatch('input');
ctx.renderGuidePopup();
expect('清空 query → 恢复 4 个城市', popup.querySelectorAll('.gcp-item').length === 4);

// CSS 验证：检查关键规则存在
const fs = require('fs');
const css = fs.readFileSync('style.css', 'utf8');
function has(re) { return re.test(css); }

expect('CSS: .gs-cockpit 含 isolation: isolate',
  /\.gs-cockpit\s*\{[^}]*isolation:\s*isolate/.test(css));
expect('CSS: .gs-cockpit 含 z-index: 20',
  /\.gs-cockpit\s*\{[^}]*z-index:\s*20/.test(css));
expect('CSS: .guide-city-popup 含 z-index: 50',
  /\.guide-city-popup\s*\{[^}]*z-index:\s*50/.test(css));
expect('CSS: .guide-city-popup 有进场动画 transition',
  /\.guide-city-popup\s*\{[^}]*transition:[^;]*opacity/.test(css));
expect('CSS: .gcp-item 有 hover 高亮',
  /\.gcp-item:hover\s*\{/.test(css));
expect('CSS: .gcp-item 有对齐布局',
  /\.gcp-item\s*\{[^}]*display:\s*flex/.test(css));

console.log('\n通过 ' + pass + ' / ' + (pass + fail));
process.exit(fail ? 1 : 0);
