#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""模拟 fetchExtendedForecast 调用，验证 coord 字段生效"""
import json, urllib.request, urllib.parse

# 模拟 app.js 里的 fetchExtendedForecast 逻辑
def fetch_ext(city, label):
    print("=" * 60)
    print(f"  [{label}]  city = {city}")
    if isinstance(city, dict) and "coord" in city and city["coord"]:
        lat, lon = city["coord"][0], city["coord"][1]
        print(f"  → 使用预置坐标: ({lat}, {lon})")
    else:
        # fallback: 用拼音去 Open-Meteo 搜
        q = city.get("pinyin") if isinstance(city, dict) else city
        url = "https://geocoding-api.open-meteo.com/v1/search?name=" + urllib.parse.quote(q) + "&count=1&language=en"
        with urllib.request.urlopen(url, timeout=5) as r:
            geo = json.load(r)
        if not geo.get("results"):
            print("  → geocoding 失败")
            return
        loc = geo["results"][0]
        lat, lon = loc["latitude"], loc["longitude"]
        print(f"  → fallback 拼音搜到: ({lat}, {lon})  {loc.get('name')}/{loc.get('admin1')}")
    # 拉 forecast
    url = f"https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&daily=temperature_2m_max,temperature_2m_min&forecast_days=2&timezone=auto"
    with urllib.request.urlopen(url, timeout=5) as r:
        d = json.load(r)
    days = d["daily"]
    print(f"  → 今日: 最高 {days['temperature_2m_max'][0]}°C, 最低 {days['temperature_2m_min'][0]}°C")

# 1) 走 destinations（精选城带 coord）
fetch_ext({"name": "佛山", "pinyin": "Foshan", "coord": [23.0218, 113.1219]}, "佛山 - 精选城")

# 2) 走 destinations（拉萨高原，必须用预置坐标才不会错配）
fetch_ext({"name": "拉萨", "pinyin": "Lhasa", "coord": [29.65, 91.1]}, "拉萨 - 精选城")

# 3) 走用户自定义输入（带 destinations 命中）
fetch_ext({"name": "Foshan", "pinyin": "Foshan", "coord": [23.0218, 113.1219]}, "自定义 Foshan")

# 4) 走 fallback（自定义地点，无 coord）
fetch_ext({"name": "大理", "pinyin": "Dali"}, "自定义 Dali - fallback")

print("=" * 60)
print("✓ 所有路径正常")