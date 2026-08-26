/* jsdom 冒烟测试：地图自由选点 + 途经点逻辑
   - 第 1 击 = 起点
   - 第 2 击 = 终点（不自动退出！）
   - 第 3+ 击 = 途经点（关键需求）
   - 「✓ 完成选点」触发 finishPickAndPlan
*/
const {JSDOM} = require('jsdom');
const vm = require('vm');

const dom = new JSDOM(`
<section class="map-section">
  <div class="route-panel" id="routePanel">
    <div class="route-actions">
      <button id="routePlanBtn"></button>
      <button id="routePickBtn"></button>
      <button id="routeDoneBtn" hidden></button>
      <button id="routeClearBtn"></button>
    </div>
    <input id="routeStartInput"><input type="hidden" id="routeStart">
    <input id="routeEndInput"><input type="hidden" id="routeEnd">
    <input id="waypointInput">
    <button id="waypointAdd"></button>
    <div id="waypointChips"></div>
    <select id="routePref"><option value="recommend" selected>智能</option></select>
    <div id="chinaMap"></div>
    <div id="routeResult"></div>
    <div id="routeTabs"></div>
  </div>
</section>`, {runScripts: 'outside-only'});

const win = dom.window;
const doc = win.document;
const $ = sel => doc.querySelector(sel.startsWith('#') ? sel : '#' + sel);

const SNIPPET = `
var routeStartCity = null, routeEndCity = null, routeWaypoints = [];
var routePickMode = false, currentRouteMode = 'drive';
var __planCalled = false;
var __dest = [
  {id:'beijing',name:'北京',coord:[116.40,39.90]},
  {id:'xian',name:'西安',coord:[108.94,34.34]},
  {id:'luoyang',name:'洛阳',coord:[112.45,34.62]},
  {id:'wuhan',name:'武汉',coord:[114.30,30.60]}
];
function syncRouteSelects(){
  var i=document.getElementById('routeStartInput');
  i.value = routeStartCity ? routeStartCity.name : '';
}
function showDoneBtn(v){
  var b=document.getElementById('routeDoneBtn'); if(!b) return;
  if(v){
    b.hidden=false;
    var s=routeStartCity?1:0, e=routeEndCity?1:0, w=(routeWaypoints||[]).length;
    b.textContent = '✓ 完成选点（' + (s+e+w) + '）';
  } else { b.hidden = true; }
}
function renderWaypointChips(){
  var box = document.getElementById('waypointChips');
  box.innerHTML = routeWaypoints.map(function(wp,i){
    return '<span data-i="'+i+'">'+wp.name+'</span>';
  }).join('');
}
function exitPickMode(){
  routePickMode=false;
  var m=document.getElementById('chinaMap'); if(m) m.classList.remove('picking');
  showDoneBtn(false);
}
function toggleRoutePick(){
  if(routePickMode){ exitPickMode(); return; }
  routePickMode=true; routeStartCity=null; routeEndCity=null; routeWaypoints=[];
  syncRouteSelects(); renderWaypointChips();
  var m=document.getElementById('chinaMap'); m.classList.add('picking');
  showDoneBtn(true);
}
function setRouteEndpoint(c){
  if(!routeStartCity){
    routeStartCity=c; syncRouteSelects(); showDoneBtn(true);
  } else if(!routeEndCity){
    routeEndCity=c; syncRouteSelects(); showDoneBtn(true);
  } else {
    routeWaypoints.push({id:'wp-'+Date.now(), name:c.name, coord:c.coord});
    renderWaypointChips(); showDoneBtn(true);
  }
}
function runRoutePlan(){ __planCalled = true; }
function finishPickAndPlan(){
  if(!routePickMode) return;
  if(!routeStartCity || !routeEndCity){
    // 缺起/终点 → 保持在 pick 模式 + 提示
    routePickMode = true;
    var m=document.getElementById('chinaMap'); if(m) m.classList.add('picking');
    showDoneBtn(true);
    return;
  }
  exitPickMode();
  runRoutePlan();
}
window.__set=setRouteEndpoint;
window.__toggle=toggleRoutePick;
window.__finish=finishPickAndPlan;
window.__wps=function(){return routeWaypoints;};
window.__s=function(){return routeStartCity;};
window.__e=function(){return routeEndCity;};
window.__cleared=function(){return __planCalled;};
window.__dest = __dest;
`;

const ctx = dom.getInternalVMContext();
ctx.window = win; ctx.document = doc;
ctx.console = console;
ctx.setTimeout = setTimeout; ctx.clearTimeout = clearTimeout;
ctx.setInterval = setInterval; ctx.clearInterval = clearInterval;
ctx.showToast = () => {};
vm.createContext(ctx);
vm.runInContext(SNIPPET, ctx);

let pass = 0, fail = 0;
function expect(label, cond) {
  if (cond) { pass++; console.log('  OK  ' + label); }
  else      { fail++; console.log('  FAIL ' + label); }
}

(async () => {
  const dest = ctx.__dest;

  ctx.__toggle();
  expect('进 pick 模式：起/终/途经 都为空',
    ctx.__s() === null && ctx.__e() === null && ctx.__wps().length === 0);
  expect('  → 完成按钮可见 + 计数 = 0',
    !$('#routeDoneBtn').hidden && $('#routeDoneBtn').textContent === '✓ 完成选点（0）');

  ctx.__set(dest[0]); // 北京
  expect('第 1 击 = 起点（北京）', ctx.__s() && ctx.__s().name === '北京');
  expect('  → 完成按钮计数 = 1', $('#routeDoneBtn').textContent === '✓ 完成选点（1）');

  ctx.__set(dest[1]); // 西安
  expect('第 2 击 = 终点（西安）', ctx.__e() && ctx.__e().name === '西安');
  expect('  → 完成按钮计数 = 2', $('#routeDoneBtn').textContent === '✓ 完成选点（2）');
  expect('  → 还在 pick 模式（不再自动退出）', /picking/.test($('#chinaMap').className));

  ctx.__set(dest[2]); // 洛阳
  ctx.__set(dest[3]); // 武汉
  const wps = ctx.__wps();
  expect('第 3/4 击 = 2 个途经点', wps.length === 2);
  expect('  → 顺序：洛阳 → 武汉', wps[0].name === '洛阳' && wps[1].name === '武汉');
  expect('  → 完成按钮计数 = 4 (1起+1终+2途经)',
    $('#routeDoneBtn').textContent === '✓ 完成选点（4）');

  // 关键需求：2 个点时不应该自动 plan
  expect('仅设了 2 个点时 plan 未触发', ctx.__cleared() === false);

  // 主动点完成 → 触发 plan + 退出 pick
  ctx.__finish();
  expect('点完成 → 退出 pick 模式', !/picking/.test($('#chinaMap').className));
  expect('  → plan 已被触发', ctx.__cleared() === true);
  expect('  → 完成按钮已隐藏', $('#routeDoneBtn').hidden === true);

  // 边界：只设了起点 → 点完成应不变（仍在 pick）
  ctx.__toggle();
  ctx.__set(dest[0]);
  ctx.__finish();
  expect('只有起点时点完成 → 仍在 pick 模式', /picking/.test($('#chinaMap').className));

  console.log('\n总计：' + pass + '/' + (pass + fail) + ' 通过');
  if (fail) process.exit(1);
})();
