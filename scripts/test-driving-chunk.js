// 行为验证：amapPlan 内 drivingPolyline 兜底对跨城提取有效
// 我们直接复制粘贴关键代码块（fetchDrivingPolyline + chunkDrivingPolyline）到 vm 里跑，
// 用 mock 的 AMap 验证整条链路。
const vm = require('vm');
let pass = 0, fail = 0;
function expect(name, cond) {
  if (cond) { pass++; console.log('✓', name); }
  else { fail++; console.log('✗ FAIL  ' + name); }
}

// === 设备 ===
function extractPath(route) {
  const path = [];
  (function pick(p) {
    if (!p) return;
    if (Array.isArray(p)) {
      p.forEach(function(x) {
        if (Array.isArray(x) && x.length >= 2) path.push([x[0], x[1]]);
        else if (x && typeof x.lng === 'number') path.push([x.lng, x.lat]);
      });
    }
  })(route && route.steps && route.steps[0] && route.steps[0].path);
  return path;
}

// === 测试 1：一次性返回空 path，走 chunk fallback
//     chunk 拆成 3 段（k=1,2,3），每段返回 3 点 → 拼接后 9 点（去重）
async function runChunkTest() {
  let callIndex = 0;
  const callLog = [];
  const mockAMap = {
    LngLat: function(l, lat) { this.lng = l; this.lat = lat; },
    Driving: function() {
      this.search = function(o, d, cb) {
        callIndex++;
        callLog.push({ i: callIndex, from: o && [o.lng, o.lat], to: d && [d.lng, d.lat] });
        // 第 1 次为空：触发 chunk fallback
        // 第 2/3/4 次：返回 3 点一段
        const isEmpty = callIndex === 1;
        // 真实 AMap.Driving 返回的 path 首点 ≈ 请求起点 → 让 dedup 语义生效
        const seg = [[o.lng, o.lat], [o.lng + 0.1, o.lat + 0.05], [o.lng + 0.2, o.lat + 0.1]];
        setTimeout(function() {
          cb('complete', { routes: [{ steps: [{ path: isEmpty ? [] : seg }], distance: 0 }] });
        }, 0);
      };
    }
  };

  // 把 amapPlan 函数体里关键的两段直接拼出来
  const code = `
    var origin = new AMap.LngLat(100, 30);
    var dest = new AMap.LngLat(105, 35);
    var __result = null;
    function extractPath(route) {
      var path = [];
      function pick(p) {
        if (!p) return;
        if (Array.isArray(p)) {
          p.forEach(function(x) {
            if (Array.isArray(x) && x.length >= 2 && typeof x[0] === 'number') path.push([x[0], x[1]]);
            else if (x && typeof x.lng === 'number') path.push([x.lng, x.lat]);
          });
        } else if (typeof p.lng === 'number') path.push([p.lng, p.lat]);
      }
      pick(route.steps[0].path);
      return path;
    }
    function fetchDrivingPolyline(cb) {
      try {
        if (!AMap.Driving) return cb(null);
        var dsvc = new AMap.Driving();
        dsvc.search(origin, dest, function(s, r) {
          if (s === 'complete' && r && r.routes && r.routes[0]) {
            var p = extractPath(r.routes[0]);
            if (p && p.length > 1) return cb(p);
            return chunkDrivingPolyline(origin, dest, 3, cb);
          } else { cb(null); }
        });
      } catch (e) { cb(null); }
    }
    function chunkDrivingPolyline(o, d, n, cb) {
      try {
        if (!AMap || !AMap.Driving) return cb(null);
        var L = function(p) { return new AMap.LngLat(p[0], p[1]); };
        var segs = [];
        function step(k) {
          if (k > n) {
            var all = [];
            segs.forEach(function(s) {
              if (!all.length) { all = all.concat(s); return; }
              s.slice(1).forEach(function(pt) { all.push(pt); });
            });
            return cb(all.length > 2 ? all : null);
          }
          var t = k / (n + 1);
          var mid = [o.lng + (d.lng - o.lng) * t, o.lat + (d.lat - o.lat) * t];
          var svc = new AMap.Driving();
          if (k === 1) {
            svc.search(o, L(mid), function(s1, r1) {
              if (s1 === 'complete' && r1 && r1.routes && r1.routes[0]) {
                var p1 = extractPath(r1.routes[0]);
                if (p1 && p1.length > 1) segs.push(p1);
              }
              step(k + 1);
            });
          } else if (k === n) {
            var lastSeg = segs.length ? segs[segs.length - 1].slice(-1)[0] : o;
            var start = lastSeg ? L(lastSeg) : L(mid);
            svc.search(start, d, function(sn, rn) {
              if (sn === 'complete' && rn && rn.routes && rn.routes[0]) {
                var pn = extractPath(rn.routes[0]);
                if (pn && pn.length > 1) segs.push(pn);
              }
              step(k + 1);
            });
          } else {
            var prevSeg = segs.length ? segs[segs.length - 1].slice(-1)[0] : null;
            var from = prevSeg ? L(prevSeg) : L(mid);
            svc.search(from, L(mid), function(sm, rm) {
              if (sm === 'complete' && rm && rm.routes && rm.routes[0]) {
                var pm = extractPath(rm.routes[0]);
                if (pm && pm.length > 1) segs.push(pm);
              }
              step(k + 1);
            });
          }
        }
        step(1);
      } catch (e) { cb(null); }
    }
    fetchDrivingPolyline(function(dp) { __result = dp; });
  `;

  const sandbox = { AMap: mockAMap };
  vm.createContext(sandbox);
  vm.runInContext(code, sandbox);

  await new Promise(r => setTimeout(r, 200));
  expect('至少调 4 次 AMap.Driving.search（1 全 + 3 chunks）', callLog.length >= 4);
  expect('__result 是 polyline 数组', Array.isArray(sandbox.__result));
  expect('拼接后点数 > 5', sandbox.__result && sandbox.__result.length > 5);
  expect('拼接段去重无重复点', sandbox.__result && (function() {
    const seen = new Set();
    for (const p of sandbox.__result) {
      const k = p[0].toFixed(6) + ',' + p[1].toFixed(6);
      if (seen.has(k)) return false;
      seen.add(k);
    }
    return true;
  })());
}

// === 测试 2：一次返回成功（10 点）时，直接采用不走 chunk ===
async function runDirectPathTest() {
  const mockAMap = {
    LngLat: function(l, lat) { this.lng = l; this.lat = lat; },
    Driving: function() {
      this.search = function(o, d, cb) {
        setTimeout(function() {
          cb('complete', { routes: [{
            steps: [{ path: [[100,30],[101,31],[102,32],[103,33],[104,34],[105,35],[106,36],[107,37],[108,38],[109,40]] }]
          }] });
        }, 0);
      };
    }
  };

  const code = `
    var origin = new AMap.LngLat(100, 30);
    var dest = new AMap.LngLat(109, 40);
    var __result = null;
    var __callCount = 0;
    function extractPath(route) {
      var path = [];
      function pick(p) {
        if (!p) return;
        if (Array.isArray(p)) {
          p.forEach(function(x) {
            if (Array.isArray(x) && x.length >= 2 && typeof x[0] === 'number') path.push([x[0], x[1]]);
            else if (x && typeof x.lng === 'number') path.push([x.lng, x.lat]);
          });
        } else if (typeof p.lng === 'number') path.push([p.lng, p.lat]);
      }
      pick(route.steps[0].path);
      return path;
    }
    function fetchDrivingPolyline(cb) {
      try {
        if (!AMap.Driving) return cb(null);
        var dsvc = new AMap.Driving();
        dsvc.search(origin, dest, function(s, r) {
          __callCount++;
          if (s === 'complete' && r && r.routes && r.routes[0]) {
            var p = extractPath(r.routes[0]);
            if (p && p.length > 1) return cb(p);
            return chunkDrivingPolyline(origin, dest, 3, cb);
          } else { cb(null); }
        });
      } catch (e) { cb(null); }
    }
    function chunkDrivingPolyline(o, d, n, cb) {
      cb(null); // 不应被调用
    }
    fetchDrivingPolyline(function(dp) { __result = dp; });
  `;

  const sandbox = { AMap: mockAMap };
  vm.createContext(sandbox);
  vm.runInContext(code, sandbox);
  await new Promise(r => setTimeout(r, 50));

  expect('一次成功返回 10 点 polyline', sandbox.__result && sandbox.__result.length === 10);
  expect('未触发 chunk fallback（callCount === 1）', sandbox.__callCount === 1);
}

// === 测试 3：safeDp 硬保证 —— drivingPolyline 兜底全失败时仍能给出非空 polyline ===
async function runSafeDpFallbackTest() {
  const sandbox = { AMap: null, console };
  vm.createContext(sandbox);
  // 把 buildWavyPath 内联：把真实 app.js 的函数搬过来
  vm.runInContext(`
    function buildWavyPath(sc, ec, mode, density) {
      density = density || 'base';
      var cfg = { 'base':{n:14,amp:0.6},'highway':{n:10,amp:0.4},'avoid':{n:20,amp:0.9},'bus':{n:12,amp:0.5},'walk':{n:10,amp:0.5},'ride':{n:12,amp:0.55} }[density] || { n: 14, amp: 0.6 };
      if (mode === 'walk') cfg = { n: 10, amp: 0.5 };
      else if (mode === 'ride') cfg = { n: 12, amp: 0.55 };
      else if (mode === 'transit') cfg = (density === 'bus') ? { n: 12, amp: 0.5 } : { n: 14, amp: 0.6 };
      var dLng = ec[0] - sc[0];
      var dLat = ec[1] - sc[1];
      if (Math.abs(dLng) + Math.abs(dLat) < 0.001) return [sc, ec];
      var path = [sc];
      var seed = Math.abs((sc[0] * 31 + sc[1] * 17 + ec[0] * 13 + ec[1] * 7) | 0) || 1;
      function rand(i) {
        var x = Math.sin(seed * 9301 + i * 49297 + density.charCodeAt(0) * 13) * 233280;
        return x - Math.floor(x);
      }
      for (var i = 1; i < cfg.n; i++) {
        var t = i / cfg.n;
        var lng = sc[0] + dLng * t + Math.cos(t * Math.PI) * cfg.amp * dLat * (rand(i) - 0.5) * 0.6;
        var lat = sc[1] + dLat * t + Math.cos(t * Math.PI) * cfg.amp * dLng * (rand(i + 31) - 0.5) * 0.6;
        path.push([lng, lat]);
      }
      path.push(ec);
      return path;
    }
    var coordOf = function(c) { return c.coord; };
    // 完整模拟 amapPlan 内 safeDp 计算
    var start = { coord: [113.2644, 23.1291] }; // 广州
    var end   = { coord: [110.2995, 25.2742] }; // 桂林
    var d = 432.7;
    var safeDp = buildWavyPath(coordOf(start), coordOf(end), 'drive', d < 50 ? 'base' : 'highway');
    this.__safeDp = safeDp;
  `, sandbox);

  const safeDp = sandbox.__safeDp;
  expect('safeDp 是 polyline 数组', Array.isArray(safeDp));
  expect('safeDp 长度 ≥ 2（拖尾不会空）', safeDp && safeDp.length >= 2);
  expect('safeDp 起点 ≠ 终点', safeDp && Math.abs(safeDp[0][0] - safeDp[safeDp.length-1][0]) + Math.abs(safeDp[0][1] - safeDp[safeDp.length-1][1]) > 0.001);
  expect('safeDp 是有序 polyline (中间点位在起点终点之间)', safeDp && safeDp.every(function(p, i) {
    if (i === 0 || i === safeDp.length - 1) return true;
    return p[0] >= Math.min(safeDp[0][0], safeDp[safeDp.length-1][0]) && p[0] <= Math.max(safeDp[0][0], safeDp[safeDp.length-1][0]);
  }));
}

// === 测试 4：amapPlan 内 fetchDrivingPolyline() 全失败 → plan.drivingPolyline 仍非空 ===
// 真实从 app.js 里提取 amapPlan 的关键段，跑一次"全 no_data"场景
async function runAmapPlanSafeDpTest() {
  const fs = require('fs');
  const src = fs.readFileSync(require('path').join(__dirname, '..', 'app.js'), 'utf8');

  // 高德 Driving 永远 no_data（模拟"全失败"）
  const mockAMap = {
    LngLat: function(l, lat) { this.lng = l; this.lat = lat; this[0] = l; this[1] = lat; },
    Size: function() {},
    Pixel: function() {},
    Marker: function() {},
    Icon: function() {},
    Polyline: function() {},
    Transfer: function() {
      return {
        search: function(o, d, cb) {
          // 模拟：AMap.Transfer 公交跨城返回稀疏 segments[].path
          setTimeout(function() {
            cb('complete', {
              plans: [{
                distance: 432700,
                time: 13790,
                segments: [
                  { instruction: '步行', path: [[o.lng, o.lat]] },
                  { instruction: '公交', transit: { lines: [{ path: [] }] } }
                ]
              }]
            });
          }, 0);
        }
      };
    },
    Driving: function() {
      return { search: function(o, d, cb) { setTimeout(function() { cb('no_data', { routes: [] }); }, 0); } };
    },
    Walking: function() { return { search: function(o,d,cb){ setTimeout(function(){ cb('no_data', { routes: [] }); }, 0); } }; },
    Riding:  function() { return { search: function(o,d,cb){ setTimeout(function(){ cb('no_data', { routes: [] }); }, 0); } }; },
    TransferPolicy: undefined
  };

  const sandbox = {
    AMap: mockAMap,
    window: { AMap: mockAMap },
    document: { getElementById: function(id){ if(id==='routePref') return {value:'fastest'}; return null; }, querySelector: function(){return null;}, querySelectorAll: function(){return [];} },
    console, Math, Date, Object, Array, Number, String, JSON, RegExp, parseFloat, parseInt, isNaN,
    Promise, setTimeout, setInterval, clearInterval
  };
  vm.createContext(sandbox);

  // 提取 amapPlan + 依赖函数
  function extract(name) {
    var re = new RegExp("function " + name + "\\s*\\(([^)]*)\\)");
    var m = re.exec(src);
    if (!m) return null;
    var s = m.index, bs = src.indexOf('{', s), d = 1, i = bs + 1;
    while (i < src.length && d > 0) { if (src[i] === '{') d++; else if (src[i] === '}') d--; i++; }
    return src.substring(s, i);
  }
  const fns = ['extractPath','secToH','metersToKm','countLights','parseTransitSteps','parseDriveSteps',
    'buildWavyPath','drivingPolicyFor','transferPolicyFor','policyVal',
    'applyPrefToStrategies','enrichTransitWithFlight','coordOf','amapPlan'];
  let ok = true;
  fns.forEach(function(fn){
    const c = extract(fn);
    if (!c) { ok = false; return; }
    try { vm.runInContext(c + '\nthis.' + fn + ' = ' + fn + ';', sandbox); }
    catch (e) { ok = false; }
  });
  expect('所有依赖函数提取成功', ok);

  const start = { name: '广州', coord: [113.2644, 23.1291] };
  const end   = { name: '桂林', coord: [110.2995, 25.2742] };
  const res = await sandbox.amapPlan(start, end, 'transit', 'fastest');

  expect('amapPlan 返回非 null（结构完整）', res !== null);
  expect('plan.drivingPolyline 永远非空（硬保证）', res && res.drivingPolyline && res.drivingPolyline.length >= 2);
  expect('strategy[0].path 永远非空', res && res.strategies[0] && res.strategies[0].path && res.strategies[0].path.length >= 2);
  expect('strategy[0].pathSource 标为兜底', res && res.strategies[0] && res.strategies[0].pathSource === 'wavy-fallback');
  if (res && res.drivingPolyline) {
    expect('drivingPolyline 起点 = 起点坐标', res.drivingPolyline[0][0] === start.coord[0] && res.drivingPolyline[0][1] === start.coord[1]);
    expect('drivingPolyline 终点 = 终点坐标', res.drivingPolyline[res.drivingPolyline.length-1][0] === end.coord[0] && res.drivingPolyline[res.drivingPolyline.length-1][1] === end.coord[1]);
  }
}

(async () => {
  await runChunkTest();
  await runDirectPathTest();
  await runSafeDpFallbackTest();
  await runAmapPlanSafeDpTest();
  console.log('\n' + pass + '/' + (pass + fail) + ' 通过');
  process.exit(fail ? 1 : 0);
})();
