#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""模拟修复后的 fetchExtendedForecast 决策 + 验证 Open-Meteo 7 天返回"""
import json, urllib.request, urllib.parse, re

# 模拟 destinations 41 城 + 部分 CITY_DB 条目
CITY_DB = {
    '湛江': 'Zhanjiang', '深圳': 'Shenzhen', '广州': 'Guangzhou',
    '漠河': 'Mohe', '喀什': 'Kashi', '拉萨': 'Lhasa',
}

def has_letters(s):
    return bool(re.search(r'[A-Za-z]', s or ''))

def open_meteo_geo(q):
    """用拼音/英文去 Open-Meteo 搜，返回 [lat, lon] 或 None"""
    url = "https://geocoding-api.open-meteo.com/v1/search?name=" + urllib.parse.quote(q) + "&count=1&language=en"
    try:
        with urllib.request.urlopen(url, timeout=8) as r:
            d = json.load(r)
        if d.get("results"):
            loc = d["results"][0]
            return [loc["latitude"], loc["longitude"]]
    except Exception as e:
        print(f"    [Open-Meteo 异常] {e}")
    return None

def fetch_ext_forecast(city, label):
    """模拟 fetchExtendedForecast 修复后逻辑（不含高德兜底，Python 无法跑浏览器 API）"""
    print(f"\n=== [{label}] city={city} ===")
    py = city.get("pinyin", "")
    nm = city.get("name", "")
    query = py if has_letters(py) else (nm if has_letters(nm) else (py or nm))
    print(f"  query 选择: '{query}'")
    latlon = city.get("coord")  # coord 优先
    if latlon:
        print(f"  → 用预置 coord: {latlon}")
    else:
        # 用 query 去 Open-Meteo
        if has_letters(query):
            geo = open_meteo_geo(query)
            if geo:
                print(f"  → Open-Meteo 拼音搜到: {geo}")
                latlon = geo
            else:
                print(f"  → Open-Meteo 搜不到，本应走高德兜底（浏览器端，Python 跳过）")
                return None
        else:
            print(f"  → 纯中文无拼音，需高德兜底（浏览器端，Python 跳过）")
            return None
    if not latlon:
        return None
    # 拉 7 天预报
    url = (f"https://api.open-meteo.com/v1/forecast?latitude={latlon[0]}&longitude={latlon[1]}"
           f"&daily=temperature_2m_max,temperature_2m_min&forecast_days=7&timezone=auto")
    with urllib.request.urlopen(url, timeout=8) as r:
        d = json.load(r)
    days = d["daily"]["time"]
    print(f"  → 7 天预报: {len(days)} 天")
    for i, t in enumerate(days):
        print(f"     [{i}] {t}  最高={d['daily']['temperature_2m_max'][i]}°  最低={d['daily']['temperature_2m_min'][i]}°")
    return len(days)

# 测试用例
print("=" * 65)
ok = True
# 1) 湛江：destinations 没有，但 CITY_DB 能拿到拼音
res1 = fetch_ext_forecast({"name": "湛江", "pinyin": CITY_DB["湛江"], "coord": None}, "湛江 (CITY_DB 拼音)")
if res1 != 7: ok = False
# 2) 深圳：destinations 命中（含 coord）
res2 = fetch_ext_forecast({"name": "深圳", "pinyin": "Shenzhen", "coord": [22.5431, 114.0579]}, "深圳 (destinations 预置 coord)")
if res2 != 7: ok = False
# 3) 拉萨：高原，预置 coord 必须准
res3 = fetch_ext_forecast({"name": "拉萨", "pinyin": "Lhasa", "coord": [29.65, 91.1]}, "拉萨 (预置 coord)")
if res3 != 7: ok = False
# 4) 漠河：CITY_DB 拼音
res4 = fetch_ext_forecast({"name": "漠河", "pinyin": CITY_DB["漠河"], "coord": None}, "漠河 (CITY_DB 拼音)")
if res4 != 7: ok = False
# 5) 佛山：destinations 预置 coord（上一轮修复）
res5 = fetch_ext_forecast({"name": "佛山", "pinyin": "Foshan", "coord": [23.0218, 113.1219]}, "佛山 (destinations 预置 coord)")
if res5 != 7: ok = False

print("\n" + "=" * 65)
print("✓ 全部 7 天" if ok else "✗ 存在非 7 天结果，需排查")
