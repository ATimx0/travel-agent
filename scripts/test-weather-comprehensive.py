#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
全面天气回归测试（模拟浏览器端 showWeatherForPlace 的真实决策链路）

验证维度：
  1) 实时卡(wttr.in) 与 7天卡(Open-Meteo) 共用同一坐标 —— 绝不跨城错配 / 不一致
  2) 任意城市都能返回「实时 + 24h + 7天」完整数据
  3) 温度与 8 月实况吻合（不出现冬季温度）
  4) 特别验证：深圳/湛江 等之前错配的城市已修正

测试覆盖城市类型：
  - 精选城（预置 coord，零误差）
  - 全国库城市（拼音 → Open-Meteo geocoding）
  - 高原/北方/热带 等极端气候（验证温度合理）
注：纯中文名 + 不在任何库 的场景依赖浏览器端高德兜底，本脚本标记需浏览器验证。
"""
import json
import urllib.request
import urllib.parse
import sys
from datetime import datetime

UA = {'User-Agent': 'Mozilla/5.0 (test)'}

# (中文名, 英文拼音, 类型, 预置coord 或 None)
CITIES = [
    ("北京", "Beijing", "精选城", [39.9075, 116.39723]),
    ("上海", "Shanghai", "精选城", [31.230, 121.473]),
    ("佛山", "Foshan", "精选城", [23.0218, 113.1219]),
    ("拉萨", "Lhasa", "精选城", [29.645, 91.14]),
    ("哈尔滨", "Harbin", "精选城", [45.803, 126.535]),
    ("三亚", "Sanya", "精选城", [18.247, 109.508]),
    ("大理", "Dali", "精选城", [25.606, 100.267]),
    ("杭州", "Hangzhou", "精选城", [30.274, 120.155]),
    ("深圳", "Shenzhen", "全国库", None),   # 之前错配到香港
    ("湛江", "Zhanjiang", "全国库", None),  # 之前只显示3天
    ("漠河", "Mohe", "全国库", None),
    ("青岛", "Qingdao", "精选城", [36.067, 120.382]),
]


def get(url):
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=15) as r:
        return json.loads(r.read().decode('utf-8'))


def resolve_coord_via_pinyin(pinyin):
    """模拟 resolveCoord 的拼音路径：拼音 → Open-Meteo geocoding"""
    url = "https://geocoding-api.open-meteo.com/v1/search?name=" + \
          urllib.parse.quote(pinyin) + "&count=1&language=en"
    d = get(url)
    if d.get("results"):
        r = d["results"][0]
        return [r["latitude"], r["longitude"]]
    return None


def fetch_wttr_by_coord(lat, lon):
    """实时卡：wttr.in/~lat,lon（坐标格式，最准）"""
    d = get("https://wttr.in/~%s,%s?format=j1" % (lat, lon))
    a = d["nearest_area"][0]
    cur = d["current_condition"][0]
    area = a["areaName"][0]["value"]
    region = a.get("region", [{}])[0].get("value", "")
    return {
        "temp": int(cur["temp_C"]),
        "area": area,
        "region": region,
        "raw": "%s/%s" % (area, region),
    }


def fetch_openmeteo(lat, lon):
    """7天卡：Open-Meteo 坐标查询"""
    url = ("https://api.open-meteo.com/v1/forecast?latitude=%s&longitude=%s"
           "&hourly=temperature_2m,precipitation_probability"
           "&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,sunrise,sunset,uv_index_max"
           "&forecast_days=7&timezone=auto") % (lat, lon)
    return get(url)


def main():
    print("=" * 78)
    print("全面天气回归测试  |  时间(本地):", datetime.now().strftime("%Y-%m-%d %H:%M"))
    print("=" * 78)
    passed = 0
    failed = 0
    fails = []

    for cn, py, kind, preset in CITIES:
        # 1) 解析坐标（模拟 resolveCoord：预置coord → 拼音Open-Meteo）
        coord = preset
        if coord is None:
            coord = resolve_coord_via_pinyin(py)
        if not coord:
            print("[FAIL] %s(%s) 无法解析坐标" % (cn, py))
            failed += 1
            fails.append("%s 坐标解析失败" % cn)
            continue
        lat, lon = coord[0], coord[1]

        # 2) 实时卡（wttr.in 坐标格式）
        try:
            wt = fetch_wttr_by_coord(lat, lon)
        except Exception as e:
            print("[FAIL] %s 实时卡异常 %s" % (cn, e))
            failed += 1
            fails.append("%s 实时卡异常" % cn)
            continue

        # 3) 7天卡（Open-Meteo）
        try:
            om = fetch_openmeteo(lat, lon)
        except Exception as e:
            print("[FAIL] %s 7天卡异常 %s" % (cn, e))
            failed += 1
            fails.append("%s 7天卡异常" % cn)
            continue

        daily = om["daily"]
        hourly = om["hourly"]
        n_days = len(daily["time"])
        n_hours = len(hourly["time"])
        today_max = round(daily["temperature_2m_max"][0])
        today_min = round(daily["temperature_2m_min"][0])

        # 断言
        ok = True
        msgs = []

        # 完整度：7天 + 24h
        if n_days != 7:
            ok = False; msgs.append("7天不足(%d)" % n_days)
        if n_hours < 20:
            ok = False; msgs.append("24h不足(%d)" % n_hours)

        # 温度合理性（8月不出现冬季温度）：今日最低不应 < 零下10（覆盖绝大多数中国城市）
        if today_min < -12:
            ok = False; msgs.append("今日最低异常低(%d°)" % today_min)

        # 一致性：实时卡温度应落在今日 [min-3, max+3]
        if not (today_min - 3 <= wt["temp"] <= today_max + 3):
            ok = False
            msgs.append("实时/7天不一致(%d° vs %d~%d°)" % (wt["temp"], today_min, today_max))

        # 跨城错配专项：深圳不应匹配到香港 Muk Wu
        if cn == "深圳" and ("Muk Wu" in wt["raw"] or "Hong Kong" in wt["raw"] or "香港" in wt["raw"]):
            ok = False
            msgs.append("深圳错配到: " + wt["raw"])

        if ok:
            passed += 1
            print("[PASS] %-4s %-7s 实时%s°  7天%d天  24h%d点  今日%d~%d°  坐标[%.3f,%.3f]"
                  % (cn, kind, wt["temp"], n_days, n_hours, today_min, today_max, lat, lon))
        else:
            failed += 1
            fails.append("%s: %s" % (cn, ";".join(msgs)))
            print("[FAIL] %-4s %-7s 实时%s° 7天%s 24h%s 今日%s~%s  nearest=%s  -> %s"
                  % (cn, kind, wt["temp"], n_days, n_hours, today_min, today_max, wt["raw"], ";".join(msgs)))

    print("=" * 78)
    print("结果: %d 通过 / %d 失败" % (passed, failed))
    if fails:
        print("失败项:")
        for f in fails:
            print("  -", f)
    print("=" * 78)
    return failed


if __name__ == "__main__":
    sys.exit(1 if main() else 0)
