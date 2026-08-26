#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""一次性给 destinations 41 个城市加 coord 字段（市中心经纬度）"""
import re
import sys

FILE = r"C:/Users/Lenovo/WorkBuddy/2026-08-22-18-10-45/travel-agent/app.js"

# 41 个城市的市中心经纬度（来源：百度百科/Open-Meteo 验证过的标准坐标）
CITY_COORDS = {
    'beijing':     (39.9042, 116.4074),
    'shanghai':    (31.2304, 121.4737),
    'chengdu':     (30.5728, 104.0668),
    'hangzhou':    (30.2741, 120.1551),
    'xian':        (34.3416, 108.9398),
    'chongqing':   (29.4316, 106.9123),
    'sanya':       (18.2528, 109.5119),
    'guilin':      (25.2736, 110.2900),
    'lijiang':     (26.8721, 100.2330),
    'zhangjiajie': (29.1170, 110.4791),
    'xiamen':      (24.4798, 118.0894),
    'qingdao':     (36.0671, 120.3826),
    'changsha':    (28.2282, 112.9388),
    'wuhan':       (30.5928, 114.3055),
    'harbin':      (45.8038, 126.5350),
    'dali':        (25.6065, 100.2678),
    'lhasa':       (29.6500,  91.1000),
    'suzhou':      (31.2989, 120.5853),
    'nanjing':     (32.0603, 118.7969),
    'tianjin':     (39.3434, 117.3616),
    'guangzhou':   (23.1291, 113.2644),
    'huangshan':   (29.7148, 118.3375),
    'guiyang':     (26.6470, 106.6302),
    'shenyang':    (41.8057, 123.4315),
    'luoyang':     (34.6197, 112.4539),
    'dunhuang':    (40.1421,  94.6612),
    'urumqi':      (43.8256,  87.6168),
    'hulunbeier':  (49.2120, 119.7572),
    'taiyuan':     (37.8706, 112.5489),
    'nanchang':    (28.6820, 115.8579),
    'yinchuan':    (38.4872, 106.2309),
    'xining':      (36.6232, 101.7804),
    'foshan':      (23.0218, 113.1219),
    'zhuhai':      (22.2710, 113.5767),
    'dongguan':    (23.0207, 113.7518),
    'wuxi':        (31.4912, 120.3119),
    'ningbo':      (29.8683, 121.5440),
    'shaoxing':    (30.0023, 120.5810),
    'fuzhou':      (26.0745, 119.2965),
    'jinan':       (36.6512, 117.1201),
    'dalian':      (38.9140, 121.6147),
}

with open(FILE, 'r', encoding='utf-8') as f:
    src = f.read()

processed = 0
skipped = []
failed = []

for cid, (lat, lon) in CITY_COORDS.items():
    # 两种结尾模式：1) "...', \n    spots:["  2) "aliases:[...], \n    spots:["
    # 我们改在 spots 之前的主行末尾插 coord
    pat_a = r"(id:'" + cid + r"'[^\n]*?)(\s+spots:\[)"
    # 对带 aliases 的，把 coord 插在 aliases 后面
    pat_b = r"(id:'" + cid + r"'[^\n]*?aliases:\[[^\]]+\],)(\s+spots:\[)"

    coord_str = " coord:[{},{}],".format(lat, lon)

    if re.search(pat_b, src):
        new_src = re.sub(pat_b, lambda m: m.group(1) + coord_str + m.group(2), src, count=1)
        if new_src != src:
            src = new_src
            processed += 1
        else:
            failed.append(cid + " (B-pattern matched but no change)")
    elif re.search(pat_a, src):
        new_src = re.sub(pat_a, lambda m: m.group(1) + coord_str + m.group(2), src, count=1)
        if new_src != src:
            src = new_src
            processed += 1
        else:
            failed.append(cid + " (A-pattern matched but no change)")
    else:
        failed.append(cid + " (no pattern matched)")

# 写回
with open(FILE, 'w', encoding='utf-8') as f:
    f.write(src)

print("Processed:", processed)
print("Failed:", failed if failed else "none")
print("Total cities expected:", len(CITY_COORDS))