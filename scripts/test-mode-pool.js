/* jsdom 测试：transportForLeg 严格按 mode 过滤候选出行方式
   用户反馈：选了驾车 tab，结果却给出 4 种其他方式。修后必须按 mode 收敛。
*/
function transportForLeg(d, pref, mode) {
  var driveT = d / 40, walk = d / 4.5, cycle = d / 14, bus = d / 18, subway = d / 30, hsr = d / 250, flight = d / 750;
  function cost(km, perKm, base) { return Math.max(base || 0, Math.round((base || 0) + (km * (perKm || 0)))); }
  var all = {
    walk:   { key:'walk',   name:'步行',     time: walk,   cost: 0,                     reason:'' },
    cycle:  { key:'cycle',  name:'共享单车', time: cycle,  cost: cost(d, 0.5, 1.5),     reason:'' },
    bus:    { key:'bus',    name:'公交/大巴', time: bus,   cost: cost(d, 0.3, 2),       reason:'' },
    subway: { key:'subway', name:'地铁',     time: subway, cost: cost(d, 0.4, 2),       reason:'' },
    taxi:   { key:'taxi',   name:'打车/网约车', time: driveT, cost: cost(d, 2.3, 14),    reason:'' },
    drive:  { key:'drive',  name:'自驾',     time: driveT, cost: cost(d, 0.8, 0),       reason:'' },
    hsr:    { key:'hsr',    name:'高铁/动车', time: hsr,   cost: cost(d, 0.45, 0),      reason:'' },
    flight: { key:'flight', name:'飞机',     time: flight + 2.5, cost: cost(d, 0.6, 0), reason:'' }
  };

  var byMode;
  if (mode === 'drive') {
    byMode = d < 3 ? ['taxi', 'drive', 'walk']
                    : (pref === 'avoidtraffic' ? ['taxi', 'drive'] : ['drive', 'taxi']);
  } else if (mode === 'transit') {
    if (d < 5)        byMode = ['subway', 'bus', 'walk'];
    else if (d > 200) byMode = ['hsr', 'subway', 'bus'];
    else              byMode = ['subway', 'bus', 'hsr'];
  } else if (mode === 'walk') {
    byMode = d > 50 ? [] : ['walk'];
  } else if (mode === 'ride') {
    byMode = d < 2 ? ['cycle', 'walk'] : (d > 60 ? [] : ['cycle']);
  } else {
    byMode = ['drive', 'taxi', 'subway', 'bus', 'cycle', 'walk', 'hsr'];
  }
  if (!byMode.length) byMode = ['walk'];
  var pool = byMode.map(function(k){ return all[k]; });

  if (pref === 'fastest')      pool = pool.slice().sort(function(a, b){ return a.time - b.time; });
  else if (pref === 'cheapest') pool = pool.slice().sort(function(a, b){ return a.cost - b.cost; });

  pool.forEach(function(m, i){ m.reco = (i === 0); });
  return pool;
}

let pass = 0, fail = 0;
function expect(label, cond) {
  if (cond) { pass++; console.log('  OK  ' + label); }
  else      { fail++; console.log('  FAIL ' + label); }
}

function keysOf(pool) { return pool.map(function(m) { return m.key; }); }
function hasOnlyDrive(pool) {
  return pool.every(function(m) { return ['drive','taxi','walk'].indexOf(m.key) >= 0; });
}
function hasOnlyTransit(pool) {
  return pool.every(function(m) { return ['subway','bus','hsr','walk'].indexOf(m.key) >= 0; });
}
function hasOnlyCycleOrWalk(pool) {
  return pool.every(function(m) { return ['cycle','walk'].indexOf(m.key) >= 0; });
}

// 用户场景：229km 驾车 tab + 智能推荐 → 之前显示 4 种混合（地铁/打车/高铁/自驾）→ 现在应只有 drive/taxi
console.log('\n=== 用户场景：驾车 tab + 229km + recommend ===');
{
  const p = transportForLeg(229, 'recommend', 'drive');
  expect('只有自驾/打车', hasOnlyDrive(p));
  expect('至少一个自驾/打车', p.some(function(m){ return ['drive','taxi'].indexOf(m.key) >= 0; }));
  expect('不含地铁', !p.some(function(m){ return m.key === 'subway'; }));
  expect('不含高铁', !p.some(function(m){ return m.key === 'hsr'; }));
  expect('不含公交', !p.some(function(m){ return m.key === 'bus'; }));
  expect('第一项标记为推荐', p[0].reco === true);
}

console.log('\n=== 公交地铁 tab + 30km ===');
{
  const p = transportForLeg(30, 'recommend', 'transit');
  expect('只有地铁/公交/高铁 (+ 短距离 walk)', hasOnlyTransit(p));
  expect('至少有地铁', p.some(function(m){ return m.key === 'subway'; }));
  expect('不含自驾/打车', !p.some(function(m){ return ['drive','taxi'].indexOf(m.key) >= 0; }));
}

console.log('\n=== 公交地铁 tab + 350km (HSR) ===');
{
  const p = transportForLeg(350, 'recommend', 'transit');
  expect('含高铁（长距离）', p[0].key === 'hsr');
  expect('不含自驾', !p.some(function(m){ return m.key === 'drive'; }));
}

console.log('\n=== 步行 tab + 5km ===');
{
  const p = transportForLeg(5, 'recommend', 'walk');
  expect('只有步行', p.length === 1 && p[0].key === 'walk');
}

console.log('\n=== 步行 tab + 80km (太远) ===');
{
  const p = transportForLeg(80, 'recommend', 'walk');
  // 80km 太远，pool 应为空 → fallback 到 walk
  expect('至少含步行（兜底）', p.length >= 1 && p[0].key === 'walk');
}

console.log('\n=== 骑行 tab + 5km ===');
{
  const p = transportForLeg(5, 'recommend', 'ride');
  expect('只有单车(+短距离步行)', hasOnlyCycleOrWalk(p));
  expect('优先单车', p[0].key === 'cycle');
}

console.log('\n=== 驾车 tab + 躲避拥堵 ===');
{
  const p = transportForLeg(50, 'avoidtraffic', 'drive');
  expect('躲避拥堵下打车应排前', p[0].key === 'taxi');
  expect('不含其他方式', hasOnlyDrive(p));
}

console.log('\n=== 驾车 tab + 最快 ===');
{
  const p = transportForLeg(100, 'fastest', 'drive');
  expect('只有驾车类', hasOnlyDrive(p));
  // drive/taxi 时间相同（都是 d/40），排序稳定但只在池内
}

console.log('\n总计：' + pass + '/' + (pass + fail) + ' 通过');
if (fail) process.exit(1);
