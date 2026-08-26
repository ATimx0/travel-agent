/**
 * 多地点路线绘制回归测试：
 *  1. drawRouteByMode 在 order.length > 1 时选用 plan.order 画折线（不绕过途经点）
 *  2. runRoutePlan 多地点分支会立即调 drawRouteByMode（不靠手动按钮）
 *  3. bindShowMultiMap 也走 drawRouteByMode（用路由标记）而非已废弃的 drawMultiRoute
 */

const fs = require('fs');
const path = require('path');
const appSrc = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');

function expect(label, cond) {
  if (cond) console.log('  ✓ ' + label);
  else { console.log('  ✗ ' + label); process.exitCode = 1; }
}

console.log('# Case 1：drawRouteByMode 在多地点时走 plan.order 折线（不绕过途经点）');
{
  // polyline 构建的三分支顺序：strategy.path → order → 2-pt fallback
  const branches = [
    /if\s*\(strategy\s*&&\s*strategy\.path/,
    /else if\s*\(order\s*&&\s*order\.length\s*>\s*1\)/,
    /\}\s*else\s*\{[\s\S]{0,200}buildWavyPath/
  ];
  branches.forEach((re, i) => {
    expect('  → 分支 ' + (i+1) + '（strategy.path / order / fallback）',
      re.test(appSrc));
  });
  // order 分支应当按 order 全节点顺序构建 LngLat，不能只画 A→B
  expect('  → order 分支遍历所有节点',
    /order\.map\(function\(p\)\s*\{[\s\S]{0,300}new AMap\.LngLat/.test(appSrc));
}

console.log('# Case 2：runRoutePlan 多地点分支会主动调用 drawRouteByMode');
{
  // 找到含 "if (routeWaypoints && routeWaypoints.length)" 块
  const idx = appSrc.indexOf('if (routeWaypoints && routeWaypoints.length)');
  expect('  → 多地点分支存在', idx !== -1);
  if (idx !== -1) {
    // 取该分支在 runRoutePlan 内的子字符串（约 150 字符到下一个 else）
    const sub = appSrc.substr(idx, 1000);
    // 该子串必须含 drawRouteByMode 与 data.order
    expect('  → 含 drawRouteByMode(...)', /drawRouteByMode\(/.test(sub));
    expect('  → 含 data.order', sub.includes('data.order'));
    // 不允许只写 bindShowMultiMap 而不绘制
    expect('  → 含 scrollIntoView（自动滚到地图）', /scrollIntoView/.test(sub));
  }
}

console.log('# Case 3：bindShowMultiMap 走统一的 drawRouteByMode');
{
  const fnIdx = appSrc.indexOf('function bindShowMultiMap(');
  expect('  → bindShowMultiMap 函数存在', fnIdx !== -1);
  if (fnIdx !== -1) {
    const sub = appSrc.substr(fnIdx, 600);
    expect('  → click handler 调 drawRouteByMode（带标记）', /drawRouteByMode\(/.test(sub));
    expect('  → 不再调废弃的 drawMultiRoute', !/drawMultiRoute\(/.test(sub));
  }
}

console.log('# Case 4：drawMultiRoute 函数彻底移除');
{
  expect('  → app.js 不再含 drawMultiRoute 定义', !/function drawMultiRoute\b/.test(appSrc));
  expect('  → app.js 不再含 drawMultiRoute 任何调用', !/drawMultiRoute\(/.test(appSrc));
}

console.log('# Case 5：lastPlanResult 在多地点分支也被赋值（保留上一次结果）');
{
  const idx = appSrc.indexOf('if (routeWaypoints && routeWaypoints.length)');
  const sub = appSrc.substr(idx, 1000);
  expect('  → 多地点分支给 lastPlanResult 赋值', /lastPlanResult\s*=\s*data/.test(sub));
  expect('  → 多地点分支给 lastPlanStart/End 赋值', /lastPlanStart\s*=\s*s/.test(sub) && /lastPlanEnd\s*=\s*e/.test(sub));
}

console.log(process.exitCode ? '\nFAIL' : '\nPASS');
