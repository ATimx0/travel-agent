/**
 * 一键下载景点经典图（在你自己的电脑上运行，不在 WorkBuddy 沙箱里跑）
 * ---------------------------------------------------------------
 * 用法（在 travel-agent 文件夹里打开终端 / 双击同目录的 run-download.bat）：
 *   node download-images.js
 *
 * 说明：
 *  - 通过维基百科 API 取每个景点的"词条主图"（即最具代表性的经典视角图），
 *    再下载到 images/ 目录，并生成 images-data.js（页面会优先用这些本地图，离线也能显示）。
 *  - 图片来自维基共享资源，多为 CC 授权；脚本会尽量记录作者与许可，并在景点弹窗里标注署名。
 *  - 下载失败的景点会自动跳过，页面会回退到联网实时获取。
 *  - 想重新下载：直接再跑一次即可（已存在的文件会覆盖更新）。
 */

const fs = require('fs');
const path = require('path');

const __dir = __dirname;
const IMG_DIR = path.join(__dir, 'images');

// 36 个景点（与 app.js 中 destinations 的 spots.wiki 一一对应，顺序即编号）
const SPOTS = [
  '故宫', '长城', '天坛',
  '上海外滩', '上海迪士尼乐园', '东方明珠广播电视塔',
  '成都大熊猫繁育研究基地', '宽窄巷子', '锦里',
  '杭州西湖', '灵隐寺', '杭州宋城',
  '兵马俑', '大雁塔', '西安城墙',
  '洪崖洞', '长江索道', '磁器口古镇',
  '亚龙湾', '天涯海角', '蜈支洲岛',
  '漓江', '阳朔', '象鼻山',
  '丽江古城', '玉龙雪山', '泸沽湖',
  '张家界国家森林公园', '天门山 (张家界)', '张家界玻璃栈道',
  '鼓浪屿', '厦门环岛路', '南普陀寺',
  '青岛栈桥', '八大关', '崂山',
  '橘子洲', '岳麓山', '湖南省博物馆',
  '黄鹤楼', '东湖 (武汉)', '武汉大学',
  '哈尔滨冰雪大世界', '中央大街 (哈尔滨)', '圣索菲亚教堂 (哈尔滨)',
  '洱海', '大理古城', '苍山',
  '布达拉宫', '大昭寺', '八廓街',
  '拙政园', '平江路', '虎丘',
  '中山陵', '夫子庙', '玄武湖',
  '天津之眼', '五大道', '天津意式风情区'
];

const UA = 'travel-agent-image-downloader/1.0 (educational use; contact: local)';
const THUMB_WIDTH = 1280;

function stripTags(html) {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
}

async function getJson(url) {
  const r = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!r.ok) throw new Error('HTTP ' + r.status);
  return r.json();
}

async function resolveImage(wiki) {
  // 1) 取词条主图的文件名 + 缩略图
  const api1 =
    'https://zh.wikipedia.org/w/api.php?action=query&redirects=1' +
    '&titles=' + encodeURIComponent(wiki) +
    '&prop=pageimages&piprop=name|thumbnail&pithumbsize=' + THUMB_WIDTH +
    '&format=json&origin=*';
  const data1 = await getJson(api1);
  const pages = (data1.query && data1.query.pages) || {};
  let pageimage = null;
  Object.keys(pages).forEach(function (k) {
    const p = pages[k];
    if (p.pageimage) pageimage = p.pageimage;
  });
  if (!pageimage) throw new Error('no pageimage for ' + wiki);

  // 2) 取文件信息：高清缩略图地址 + 署名/许可
  const api2 =
    'https://commons.wikimedia.org/w/api.php?action=query&redirects=1' +
    '&titles=' + encodeURIComponent('File:' + pageimage) +
    '&prop=imageinfo&iiprop=url%7Cextmetadata&iiurlwidth=' + THUMB_WIDTH +
    '&format=json&origin=*';
  const data2 = await getJson(api2);
  const pages2 = (data2.query && data2.query.pages) || {};
  let info = null;
  Object.keys(pages2).forEach(function (k) {
    const ii = pages2[k].imageinfo && pages2[k].imageinfo[0];
    if (ii) info = ii;
  });
  if (!info) throw new Error('no imageinfo for ' + pageimage);
  const src = info.thumburl || info.url;
  if (!src) throw new Error('no src for ' + pageimage);
  const meta = info.extmetadata || {};
  const artist = stripTags((meta.Artist && meta.Artist.value) || '');
  const license = (meta.LicenseShortName && meta.LicenseShortName.value) || 'CC';
  const credit = (artist ? '© ' + artist + ' / ' : '© Wikimedia 贡献者 / ') + license;
  return { src: src, credit: credit };
}

async function download(url, dest) {
  const r = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!r.ok) throw new Error('download HTTP ' + r.status);
  const buf = Buffer.from(await r.arrayBuffer());
  fs.writeFileSync(dest, buf);
}

function pad(n) { return (n < 10 ? '0' : '') + n; }

async function main() {
  fs.mkdirSync(IMG_DIR, { recursive: true });
  const map = {};
  const credits = {};
  let ok = 0;
  let fail = 0;

  for (let i = 0; i < SPOTS.length; i++) {
    const wiki = SPOTS[i];
    const file = 'spot-' + pad(i + 1) + '.jpg';
    const dest = path.join(IMG_DIR, file);
    process.stdout.write('[' + pad(i + 1) + '/' + SPOTS.length + '] ' + wiki + ' ... ');
    try {
      const img = await resolveImage(wiki);
      await download(img.src, dest);
      map[wiki] = file;
      credits[wiki] = img.credit;
      ok++;
      console.log('OK -> ' + file);
    } catch (e) {
      fail++;
      console.log('跳过 (' + e.message + ')');
    }
  }

  const out =
    '/* 本文件由 download-images.js 自动生成，请勿手动编辑。\n' +
    '   页面会优先使用这里的本地经典图；没有对应项时回退到联网实时获取。 */\n' +
    'window.SPOT_IMAGES = ' + JSON.stringify(map, null, 2) + ';\n' +
    'window.SPOT_CREDITS = ' + JSON.stringify(credits, null, 2) + ';\n';
  fs.writeFileSync(path.join(__dir, 'images-data.js'), out, 'utf8');

  console.log('\n完成：成功 ' + ok + ' 张，跳过 ' + fail + ' 张。');
  console.log('映射已写入 images-data.js，刷新网页即可看到本地经典图。');
}

main().catch(function (e) {
  console.error('运行出错：', e);
  process.exit(1);
});
