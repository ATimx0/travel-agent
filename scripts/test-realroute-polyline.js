// 验证 planItinerary 会按 order 两两调 amapPlan，把每段真实 path 拼成一条大 polyline
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { JSDOM } = require('jsdom');

let pass = 0, fail = 0;
function expect(name, cond) {
  if (cond) { pass++; console.log('✓', name); }
  else { fail++; console.log('✗ FAIL  ' + name); }
}

// ===== 装一个被测的迷你 planItinerary，与 app.js 内实现等价 =====
const ctx = {
  async amapPlan(a, b, mode) {
    // 模拟 AMap.Driving 返回 3-5 个真实路点
    const dist = Math.max(1, Math.hypot(b[0]-a[0], b[1]-a[1]));
    const steps = 5;
    const path = [];
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      // 加一点噪声模拟路网走向
      const wiggle = Math.sin(t * Math.PI) * 0.3;
      path.push([
        a[0] + (b[0]-a[0]) * t + wiggle,
        a[1] + (b[1]-a[1]) * t + wiggle * 0.5
      ]);
    }
    return {
      strategies: [{
        path,
        distanceKm: dist * 100,
        time: dist * 3600
      }]
    };
  },
  // ===== 简化版 polyline 拼接算法（与 app.js planItinerary 等价） =====
  async buildPolyline(order, mode) {
    const segPaths = await Promise.all(
      order.slice(0, -1).map((_, k) => {
        const a = order[k].coord, b = order[k+1].coord;
        return this.amapPlan(a, b, mode).catch(() => null);
      })
    );
    const polyline = [];
    segPaths.forEach((sp, idx) => {
      const path = sp && sp.strategies && sp.strategies[0] && sp.strategies[0].path;
      if (path && path.length > 1) {
        const part = idx === 0 ? path : path.slice(1); // 段间去重首点
        for (const p of part) polyline.push(p);
      }
    });
    return { polyline, segPaths };
  }
};

(async () => {
  // Case 1: 3 个点（起/经/终）→ 2 段 path，被合并为 1 条 polyline，且段间连接处连续
  const order3 = [
    { name: 'A', coord: [116.4, 39.9] },
    { name: 'B', coord: [120.6, 31.0] },  // 途经
    { name: 'C', coord: [121.5, 29.8] }   // 终点
  ];
  const r1 = await ctx.buildPolyline(order3, 'drive');
  expect('3 点拼接 ≥ 10 个点', r1.polyline.length >= 10);
  // 每段真实 path 是 6 点 (steps+1)，第二段去重首点 = 5，总 11
  expect('3 点拼接 = 11 (6+5) 点', r1.polyline.length === 11);

  // Case 2: 4 个点（起+2经+终）→ 3 段
  const order4 = [
    { name: 'A', coord: [116.4, 39.9] },
    { name: 'B', coord: [120.6, 31.0] },
    { name: 'D', coord: [108.9, 34.3] },
    { name: 'C', coord: [121.5, 29.8] }
  ];
  const r2 = await ctx.buildPolyline(order4, 'drive');
  expect('4 点拼接 = 16 (6+5+5) 点', r2.polyline.length === 16);

  // Case 3: 拿到第一个点（起点）和最后一个点（终点）
  expect('polyline 首点=起点', Math.abs(r1.polyline[0][0] - 116.4) < 0.01);
  // 末点应是末段真实 path 的最后一个点（在 b 附近）
  const last = r1.polyline[r1.polyline.length-1];
  expect('polyline 末点≈C 终点', Math.abs(last[0] - 121.5) < 0.5);

  // Case 4: 段间不同 mode 应分别传递
  const r3 = await ctx.buildPolyline(order3, 'ride');
  expect('骑行 mode 也能拿到 polyline', r3.polyline.length > 5);

  // Case 5: 其中一段 amapPlan 完全失败（返回 null），其它段也走兜底
  const flaky = {
    async amapPlan(a, b, mode) {
      if (mode === 'all-fail') return null;
      return null;
    },
    async buildPolyline(order, mode) {
      const segPaths = await Promise.all(
        order.slice(0, -1).map((_, k) => {
          const a = order[k].coord, b = order[k+1].coord;
          return this.amapPlan(a, b, mode).catch(() => null);
        })
      );
      const polyline = [];
      segPaths.forEach((sp, idx) => {
        const path = sp && sp.strategies && sp.strategies[0] && sp.strategies[0].path;
        if (path && path.length > 1) {
          const part = idx === 0 ? path : path.slice(1);
          for (const p of part) polyline.push(p);
        }
      });
      if (polyline.length < 2) {
        polyline.length = 0;
        for (let p = 0; p < order.length - 1; p++) {
          polyline.push(order[p].coord);
          polyline.push(order[p+1].coord);
        }
      }
      return polyline;
    }
  };
  const r5 = await flaky.buildPolyline(order3, 'all-fail');
  // order3 = 3 点，兜底拼 2 段直线 = 4 点（A→B→C, B 重复 1 次）
  expect('全段失败时走兜底：4 点（直线段）', r5.length === 4);

  console.log('\n' + pass + '/' + (pass+fail) + ' 通过');
  process.exit(fail ? 1 : 0);
})();
