// 验证「在地图上标出路线」按钮点击时，会把 plan.polyline 真实路况传给 drawRouteByMode
// 回归 bug: bindShowMultiMap 之前只传 order，丢掉了 plan.polyline → 走直线 fallback
const fs = require('fs');
const path = require('path');

let pass = 0, fail = 0;
function expect(name, cond) {
  if (cond) { pass++; console.log('✓', name); }
  else { fail++; console.log('✗ FAIL  ' + name); }
}

const src = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');

// Case 1: bindShowMultiMap 必须接 data 参数（不是 order）
expect('bindShowMultiMap 改用 data 参数',
  /function bindShowMultiMap\(data\)/.test(src));

// Case 2: click handler 必须传 data 作为第 5 参
expect('click handler 调 drawRouteByMode 时传 data (第 5 参)',
  /showBtn\.addEventListener\('click', function\(\) \{[\s\S]*?drawRouteByMode\(routeStartCity, routeEndCity, null, data\.order, data\)/.test(src));

// Case 3: runRoutePlan 多地点分支必须传 data（不是 data.order）
expect('runRoutePlan 调 bindShowMultiMap 传 data',
  /bindShowMultiMap\(data\);[^\n]*\n[^\n]*bindModeSelection\(box\)/.test(src));

// Case 4: 不应该再出现 bindShowMultiMap(data.order)
expect('不应再出现 bindShowMultiMap(data.order)',
  !/bindShowMultiMap\(data\.order\)/.test(src));

// Case 5: drawRouteByMode 的 plan 优先级分支仍然存在
expect('drawRouteByMode 仍保留 plan.polyline 最高优先级分支',
  /if \(plan && plan\.polyline && plan\.polyline\.length > 1\)/.test(src));

console.log('\n' + pass + '/' + (pass+fail) + ' 通过');
process.exit(fail ? 1 : 0);
