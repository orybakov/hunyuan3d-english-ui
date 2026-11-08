#!/usr/bin/env python3
"""Собирает словарь zh -> en из бандла сайта + ручного словаря.

Запуск: python3 tools/build_dict.py   (качает актуальный index.js с сайта)
Результат: src/dict.js
"""
import json
import re
import subprocess
import sys
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SITE = "https://3d.hunyuan.tencent.com/"
CJK = re.compile(r"[\u4e00-\u9fff]")
UA = {"User-Agent": "Mozilla/5.0"}


def get(url):
    return urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=60).read().decode("utf-8")


def flat(d, p=""):
    out = {}
    for k, v in d.items():
        if isinstance(v, dict):
            out.update(flat(v, p + k + "."))
        else:
            out[p + k] = v
    return out


def extract_bundles(js):
    found = []
    for m in re.finditer(r"JSON\.parse\('((?:[^'\\]|\\.)*)'\)", js):
        # снимаем экранирование JS-строки ('...'), затем это обычный JSON
        raw = m.group(1).encode("utf-8").decode("unicode_escape").encode("latin1").decode("utf-8")
        try:
            d = json.loads(raw)
        except Exception:
            continue
        if isinstance(d, dict) and {"common", "navigation", "creation"} <= set(d):
            found.append(d)
    return found


def main():
    html = get(SITE)
    m = re.search(r'src="([^"]*/index__\w+\.js)"', html)
    if not m:
        sys.exit("index.js not found on the page")
    bundles = extract_bundles(get(m.group(1)))
    zh = next(b for b in bundles if CJK.search(json.dumps(b["navigation"], ensure_ascii=False)))
    en = next(b for b in bundles if b is not zh)
    pairs = [(flat(zh), flat(en))]

    # приложение /studio — отдельная сборка, наборы — объектные литералы
    studio = json.loads(subprocess.run(["node", str(ROOT / "tools/extract_studio.mjs")],
                                       capture_output=True, text=True, check=True).stdout)
    pairs.append((flat(studio["zh"]), flat(studio["en"])))

    exact, patterns = {}, []
    for fz, fe in pairs:
        for key, zv in fz.items():
            ev = fe.get(key)
            if not isinstance(zv, str) or not isinstance(ev, str) or not CJK.search(zv):
                continue
            if "{{" in zv:
                patterns.append([zv, ev])
            else:
                exact.setdefault(zv.strip(), ev.strip())

    # extra — авто-выжимка из захардкоженных строк, manual — ручные правки (имеют приоритет)
    manual = json.loads((ROOT / "tools/extra_zh_en.json").read_text("utf-8"))
    manual.update(json.loads((ROOT / "tools/manual_zh_en.json").read_text("utf-8")))
    for zv, ev in manual.items():
        (patterns.append([zv, ev]) if "{{" in zv else exact.__setitem__(zv.strip(), ev.strip()))

    out = ROOT / "src/dict.js"
    out.write_text(
        "// Сгенерировано tools/build_dict.py — не редактировать вручную\n"
        "window.__HYRU_DICT = " + json.dumps({"exact": exact, "patterns": patterns}, ensure_ascii=False, indent=0) + ";\n",
        "utf-8",
    )
    print(f"exact={len(exact)} patterns={len(patterns)} -> {out}")


if __name__ == "__main__":
    main()
