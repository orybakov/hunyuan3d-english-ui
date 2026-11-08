// Подменяет китайский набор строк i18next на встроенный английский.
// Сайт держит оба набора как JSON.parse('...') в index.js и выбирает язык по домену,
// поэтому ловим разбор обоих и переливаем английские значения в китайский объект.
(() => {
  const CJK = /[\u4e00-\u9fff]/;
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
      if (zh && en) {
        deepAssign(zh, en);
        window.__HYRU_BUNDLE_PATCHED = true;
      }
    }
    return r;
  };
  patched.toString = () => origParse.toString();
  JSON.parse = patched;
})();
