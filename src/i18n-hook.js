// Включает встроенный английский перевод сайта. На сайте два разных приложения:
//  - основное (/, /creation, ...): строки лежат в index.js как JSON.parse('...'), язык по домену;
//  - studio (/studio/...): строки — объектные литералы, в i18next.init передаётся lng:"zh" жёстко.
(() => {
  const CJK = /[\u4e00-\u9fff]/;
  const diag = (window.__HYRU_HOOK = { installedAt: performance.now(), seen: [], forcedLng: null, overrides: 0 });
  const OV = window.__HYRU_OVERRIDES || {};

  // Правки английских текстов (tools/overrides_en.json) по пути ключа "a.b.c"
  const applyOverrides = (root, map) => {
    if (!root || !map) return;
    for (const [path, val] of Object.entries(map)) {
      const parts = path.split(".");
      let o = root;
      for (let i = 0; i < parts.length - 1 && o; i++) {
        if (typeof o[parts[i]] !== "object" || o[parts[i]] === null) o[parts[i]] = {};
        o = o[parts[i]];
      }
      if (o) {
        o[parts[parts.length - 1]] = val;
        diag.overrides++;
      }
    }
  };

  // --- 1. Основное приложение: переливаем английские значения в китайский набор ---
  const origParse = JSON.parse;
  let zh = null;
  let en = null;

  const isBundle = (o) =>
    o && typeof o === "object" && !Array.isArray(o) &&
    o.common && o.navigation && o.creation && typeof o.navigation === "object";

  const deepAssign = (dst, src) => {
    for (const k of Object.keys(src)) {
      const s = src[k];
      if (s && typeof s === "object" && dst[k] && typeof dst[k] === "object") deepAssign(dst[k], s);
      else dst[k] = s;
    }
  };

  const patched = function parse(text, reviver) {
    const r = origParse.call(this, text, reviver);
    if (isBundle(r)) {
      if (CJK.test(JSON.stringify(r.navigation))) zh = r;
      else en = r;
      diag.seen.push(r === zh ? "zh" : "en");
      if (zh && en) {
        deepAssign(zh, en);
        applyOverrides(zh, OV.main);
        window.__HYRU_BUNDLE_PATCHED = true;
      }
    }
    return r;
  };
  patched.toString = () => origParse.toString();
  JSON.parse = patched;

  // --- 2. Любой i18next без своего defaultNS (studio): подменяем lng в опциях init ---
  // i18next.init читает options.defaultNS; если его нет в объекте, чтение уходит в прототип.
  // Временный геттер на Object.prototype ловит этот момент, меняет lng и сразу удаляется.
  const KEY = "defaultNS";
  if (!Object.prototype.hasOwnProperty(KEY)) {
    const restore = () => {
      delete Object.prototype[KEY];
    };
    Object.defineProperty(Object.prototype, KEY, {
      configurable: true,
      enumerable: false,
      get() {
        try {
          const res = this && this !== Object.prototype && this.resources;
          if (res && typeof res === "object" && ("lng" in this || "fallbackLng" in this)) {
            const enKey = Object.keys(res).find((k) => /^en\b/i.test(k));
            if (enKey) {
              this.lng = enKey;
              const t = res[enKey] && res[enKey].translation;
              if (t && typeof t === "object") applyOverrides(t, OV.studio);
              diag.forcedLng = enKey;
              window.__HYRU_BUNDLE_PATCHED = true;
              restore();
            }
          }
        } catch {}
        return undefined;
      },
      set(v) {
        Object.defineProperty(this, KEY, { value: v, writable: true, enumerable: true, configurable: true });
      },
    });
    // страховка: не держим геттер дольше, чем нужно для старта приложения
    setTimeout(restore, 60000);
  }
})();
