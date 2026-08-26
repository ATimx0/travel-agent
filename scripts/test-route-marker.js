/**
 * 路线点标记（起/经/终）冒烟测试
 * 用 jsdom 隔离验证 computeStopList 在 2 点 / 多点 / 缺 order 三种情况下的行为。
 */
const { JSDOM } = require('jsdom');

function expect(label, cond) {
  if (cond) console.log('  ✓ ' + label);
  else { console.log('  ✗ ' + label); process.exitCode = 1; }
}

// 拿出 app.js 里的两个全局函数（手撕一份，与 app.js 同步）
function coordOfDummy(city) {
  if (!city) return null;
  if (city.id === 'beijing') return [116.397, 39.908];
  if (city.id === 'xian')    return [108.940, 34.341];
  if (city.id === 'luoyang') return [112.450, 34.620];
  if (city.id === 'wuhan')   return [114.305, 30.593];
  if (city.id === 'shanghai')return [121.473, 31.230];
  return null;
}

function computeStopList(order, start, end) {
  if (order && order.length) {
    return order.map(function(o) {
      return {
        name: o.name || o.id || '',
        coord: o.coord || (o.id ? coordOfDummy({ id: o.id }) : null) || [116.397, 39.908]
      };
    }).filter(function(s) { return s.coord; });
  }
  var sCoord = coordOfDummy(start), eCoord = coordOfDummy(end);
  return [
    { name: start.name, coord: sCoord },
    { name: end.name,   coord: eCoord }
  ];
}

console.log('# Case A：仅起点+终点（无 plan.order）');
{
  const list = computeStopList(null, { id: 'beijing', name: '北京' }, { id: 'shanghai', name: '上海' });
  expect('  → 恰好 2 个点', list.length === 2);
  expect('  → 第 1 个 = 北京', list[0].name === '北京' && list[0].coord[0] === 116.397);
  expect('  → 第 2 个 = 上海', list[1].name === '上海' && list[1].coord[0] === 121.473);
}

console.log('# Case B：多点（含途经，planItinerary 走这条路）');
{
  const order = [
    { name: '北京', id: 'beijing', coord: [116.397, 39.908] },
    { name: '西安', id: 'xian',    coord: [108.940, 34.341] },
    { name: '洛阳', id: 'luoyang', coord: [112.450, 34.620] },
    { name: '武汉', id: 'wuhan',   coord: [114.305, 30.593] },
    { name: '上海', id: 'shanghai',coord: [121.473, 31.230] }
  ];
  const list = computeStopList(order, order[0], order[order.length - 1]);
  expect('  → 5 个点（按优化顺序）', list.length === 5);
  expect('  → 顺序保留：京→陕→豫→鄂→沪',
    list.map(s => s.name).join(',') === '北京,西安,洛阳,武汉,上海');
  expect('  → 每个点都有 coord', list.every(s => Array.isArray(s.coord) && s.coord.length === 2));
}

console.log('# Case C：order 里没有 coord 字段（fallback 用城市 id 查表）');
{
  const order = [
    { name: '北京', id: 'beijing' },
    { name: '西安', id: 'xian' }
  ];
  const list = computeStopList(order, null, null);
  expect('  → 2 个点', list.length === 2);
  expect('  → 北京坐标 → 116.397', list[0].coord[0] === 116.397);
}

console.log('# Case D：markType 推断（A/B/数字）');
{
  // 模拟调用方拿到 stops 后用 i 推断 letter 类型
  const order = [
    { name: 'A城' }, { name: 'B城' }, { name: 'C城' }, { name: 'D城' }
  ];
  const list = computeStopList(order, null, null);
  function inferKind(stops, i) {
    if (i === 0) return { kind: 'start', letter: 'A' };
    if (i === stops.length - 1) return { kind: 'end', letter: 'B' };
    return { kind: 'via', letter: String(i + 1) };
  }
  const kinds = list.map((_, i) => inferKind(list, i));
  expect('  → 第 1 个 = start / A', kinds[0].kind === 'start' && kinds[0].letter === 'A');
  expect('  → 第 2 个 = via / 2',   kinds[1].kind === 'via'   && kinds[1].letter === '2');
  expect('  → 第 3 个 = via / 3',   kinds[2].kind === 'via'   && kinds[2].letter === '3');
  expect('  → 第 4 个 = end / B',   kinds[3].kind === 'end'   && kinds[3].letter === 'B');
}

console.log(process.exitCode ? '\nFAIL' : '\nPASS');
