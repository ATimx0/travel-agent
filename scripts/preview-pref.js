const fs = require('fs');
const vm = require('vm');
const { JSDOM } = require('jsdom');
const dom = new JSDOM('<!DOCTYPE html><body></body>', { runScripts: 'outside-only' });
const src = fs.readFileSync('app.js', 'utf8');

function extractFn(name) {
  const re = new RegExp('function ' + name + '\\s*\\(([^)]*)\\)');
  const m = re.exec(src);
  if (!m) return null;
  const start = m.index;
  let bodyStart = src.indexOf('{', start);
  let depth = 1, i = bodyStart + 1;
  while (i < src.length && depth > 0) {
    if (src[i] === '{') depth++;
    else if (src[i] === '}') depth--;
    i++;
  }
  return src.substring(start, i);
}
function extractVar(name) {
  const re = new RegExp('var ' + name + '\\s*=\\s*');
  const m = re.exec(src);
  if (!m) return null;
  let depth = 0, end = m.index + m[0].length;
  while (end < src.length) {
    const ch = src[end];
    if (ch === '{' || ch === '[') depth++;
    else if (ch === '}' || ch === ']') {
      if (depth === 0) break;
      depth--;
    } else if (ch === ';' && depth === 0) {
      break;
    }
    end++;
  }
  return src.substring(m.index, end + 1);
}

const sandbox = {
  console, Math, Date, Object, Array, Number, String, JSON, RegExp,
  parseFloat, parseInt, isNaN,
  document: dom.window.document
};
vm.createContext(sandbox);
const code =
  (extractVar('PREF_META') || '') + 'this.PREF_META = PREF_META; \n' +
  (extractVar('MODE_META') || '') + 'this.MODE_META = MODE_META; \n' +
  (extractFn('fmtDuration') || '') + '\nthis.fmtDuration = fmtDuration; \n' +
  (extractFn('escapeHtml') || '') + '\nthis.escapeHtml = escapeHtml; \n' +
  (extractFn('renderSteps') || '') + '\nthis.renderSteps = renderSteps; \n' +
  (extractFn('buildRouteHTML') || '') + '\nthis.buildRouteHTML = buildRouteHTML;';
console.log('Total injected lines:', code.split('\n').length);
vm.runInContext(code, sandbox);

function renderAndShow(label, pref, plan) {
  sandbox.lastPlanPref = pref;
  const html = sandbox.buildRouteHTML({name:'德令哈'}, {name:'随州'}, plan);
  console.log('\n========== ' + label + ' ==========');
  console.log('--- 顶部摘要 ---');
  console.log(html.match(/<div class="route-summary">[\s\S]*?<\/div>/)[0]
    .replace(/<[^>]+>/g,' ')
    .replace(/\s+/g,' ')
    .trim());
  console.log('--- 卡片 ---');
  const re = /<div class="(route-strategy[^"]+)"[^>]*data-i="(\d+)"[^>]*>[\s\S]*?<span class="rs-tag rs-tag-\d+">([^<]+)<\/span>[\s\S]*?<span class="rs-cost">([^<]+)<\/span>[\s\S]*?<div class="rs-sub">([^<]+)<\/div>/g;
  let m, i = 0;
  while ((m = re.exec(html)) !== null) {
    i++;
    console.log('  [' + i + '] class=' + m[1] + ' tag=' + JSON.stringify(m[3]) + ' cost=' + m[4].trim());
    console.log('        sub=' + m[5].trim());
  }
}

renderAndShow('场景A：公交跨城 1986km · 偏好 fastest', 'fastest', {
  mode: 'transit',
  startName: '德令哈', endName: '随州',
  distanceKm: 1986.9,
  hasCrossCityHint: true,
  strategies: [
    { tag: '⚡ 最快到达', title: '最快到达', timeH: 5.2, costYuan: 1200, toll: 0, lights: 0, distanceKm: 1986.9, isFlightEstimate: true, steps: [
      { icon:'🚖', text:'前往出发机场', distKm:25 },
      { icon:'✈️', text:'航班直飞', distKm:1900 },
      { icon:'🛬', text:'落地后前往目的地', distKm:35 }
    ] },
    { tag: '方案2', title: '方案2', timeH: 8.0, costYuan: 900, toll: 0, lights: 0, distanceKm: 1986.9, isHsrEstimate: true, steps: [
      { icon:'🚖', text:'前往高铁站', distKm:8 },
      { icon:'🚄', text:'高铁直达', distKm:1986.9 }
    ] },
    { tag: '方案3', title: '方案3', timeH: 26.9, costYuan: 499, toll: 0, lights: 0, distanceKm: 1986.9, steps: [
      { icon:'🚖', text:'出租车到德令哈', distKm:39.1 },
      { icon:'🚆', text:'C892 火车', distKm:479.3 }
    ] }
  ]
});

renderAndShow('场景B：驾车 600km · 偏好 cheapest', 'cheapest', {
  mode: 'drive',
  startName: '起点', endName: '终点',
  distanceKm: 580,
  strategies: [
    { tag: '💰 最省钱', title: '最省钱', timeH: 8.5, costYuan: 380, toll: 200, lights: 12, distanceKm: 580, steps: [
      { icon:'🚩', text:'从起点出发', distKm:0 },
      { icon:'🛣️', text:'走国道', distKm:580 },
      { icon:'🏁', text:'到达终点', distKm:0 }
    ] },
    { tag: '方案2', title: '方案2', timeH: 5.5, costYuan: 620, toll: 350, lights: 3, distanceKm: 605, steps: [
      { icon:'🚩', text:'走高速', distKm:605 }
    ] }
  ]
});

renderAndShow('场景C：驾车 200km · 偏好 avoidtraffic', 'avoidtraffic', {
  mode: 'drive',
  startName: 'A', endName: 'B',
  distanceKm: 200,
  strategies: [
    { tag: '🛣️ 躲避拥堵', title: '躲避拥堵', timeH: 2.6, costYuan: 180, toll: 0, lights: 8, distanceKm: 200, steps: [
      { icon:'🚩', text:'走城市快速路', distKm:200 }
    ] },
    { tag: '方案2', title: '方案2', timeH: 2.2, costYuan: 200, toll: 0, lights: 12, distanceKm: 200, steps: [
      { icon:'🚩', text:'走主干道', distKm:200 }
    ] }
  ]
});
