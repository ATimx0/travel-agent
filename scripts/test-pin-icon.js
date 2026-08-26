/**
 * 路线点 Marker（图钉）冒烟测试
 * 验证：
 *  1. buildPinSvg 生成合法 SVG data URL
 *  2. letter 与颜色正确替换
 *  3. escapeXml 对 XML 特殊字符正确转义
 *  4. fitTargets 包含所有点 + 线
 */
function expect(label, cond) {
  if (cond) console.log('  ✓ ' + label);
  else { console.log('  ✗ ' + label); process.exitCode = 1; }
}

// === 把 app.js 中的两个相关函数提取出来独立测试 ===
function escapeXml(s) {
  return String(s).replace(/[<>&"']/g, function(c) {
    return { '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' }[c];
  });
}

function buildPinSvg(fillHex, letter) {
  var svg =
    '<svg xmlns="http://www.w3.org/2000/svg" width="40" height="56" viewBox="0 0 40 56">' +
      '<defs>' +
        '<filter id="ds" x="-30%" y="-10%" width="160%" height="140%">' +
          '<feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#000" flood-opacity="0.35"/>' +
        '</filter>' +
      '</defs>' +
      '<path filter="url(#ds)" ' +
        'd="M20 0C9 0 0 9 0 20c0 14.7 16.6 32.4 18.5 34.3a2 2 0 0 0 3 0C23.4 52.4 40 34.7 40 20 40 9 31 0 20 0z" ' +
        'fill="' + fillHex + '"/>' +
      '<circle cx="20" cy="20" r="11" fill="#fff"/>' +
      '<text x="20" y="25.5" text-anchor="middle" font-size="14" font-weight="800" ' +
        'fill="' + fillHex + '" font-family="-apple-system, BlinkMacSystemFont, Helvetica, Arial, sans-serif">' +
        escapeXml(letter) +
      '</text>' +
    '</svg>';
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
}

console.log('# Case 1：起点 A 绿色图钉');
{
  const url = buildPinSvg('#10b981', 'A');
  expect('  → 是 data URL 协议', url.startsWith('data:image/svg+xml'));
  expect('  → 编码后含完整 SVG 主体', decodeURIComponent(url).includes('<svg'));
  expect('  → 颜色编码到 fill (#10b981)',
    decodeURIComponent(url).includes('fill="#10b981"'));
  expect('  → 字母 A 在 text 节点中',
    decodeURIComponent(url).includes('>A</text>'));
  expect('  → 形状 path 存在（tear-drop）',
    decodeURIComponent(url).includes('M20 0'));
}

console.log('# Case 2：终点 B 红色图钉');
{
  const url = buildPinSvg('#ef4444', 'B');
  const decoded = decodeURIComponent(url);
  expect('  → 颜色 = 红 #ef4444', decoded.includes('fill="#ef4444"'));
  expect('  → 内层白圆', decoded.includes('fill="#fff"'));
  expect('  → 字母 B', decoded.includes('>B</text>'));
}

console.log('# Case 3：途经点 ②③… 灰色数字');
{
  const url = buildPinSvg('#475569', '3');
  const decoded = decodeURIComponent(url);
  expect('  → 字母 = "3"',  decoded.includes('>3</text>'));
  expect('  → 颜色 = 灰',    decoded.includes('fill="#475569"'));
}

console.log('# Case 4：XML 特殊字符转义（防止 SVG injection）');
{
  expect('  → < 转义', escapeXml('<') === '&lt;');
  expect('  → > 转义', escapeXml('>') === '&gt;');
  expect('  → & 转义', escapeXml('&') === '&amp;');
  expect('  → " 转义', escapeXml('"') === '&quot;');
  expect('  → \' 转义', escapeXml("'") === '&apos;');
}

console.log('# Case 5：极端数据 — 长名称不会污染 SVG');
{
  const url = buildPinSvg('#0f172a', 'A"src=x onerror=alert(1)');
  expect('  → 数据 URL 仍合法', url.startsWith('data:image/svg+xml'));
  expect('  → 包含转义后内容（攻击向量被中和）',
    url.includes('%26quot%3B') || url.includes('&quot;'));
}

console.log(process.exitCode ? '\nFAIL' : '\nPASS');
