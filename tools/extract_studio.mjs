// Достаёт en/zh наборы i18next из приложения /studio (объектные литералы в index-*.js).
// Вывод: JSON {en:{...}, zh:{...}} в stdout.
import vm from "node:vm";

const BASE = "https://3d.hunyuan.tencent.com";
const html = await (await fetch(BASE + "/studio/creation/concept")).text();
const src = html.match(/src="([^"]*\/index-[\w-]+\.js)"/)?.[1];
if (!src) throw new Error("studio index-*.js not found");
const js = await (await fetch(src.startsWith("//") ? "https:" + src : src)).text();

// конец объектного литерала, начинающегося с '{' в позиции i (учитывает строки)
function matchBrace(s, i) {
  let depth = 0;
  for (let p = i; p < s.length; p++) {
    const c = s[p];
    if (c === '"' || c === "'" || c === "`") {
      for (p++; p < s.length && s[p] !== c; p++) if (s[p] === "\\") p++;
      continue;
    }
    if (c === "{") depth++;
    else if (c === "}" && --depth === 0) return p + 1;
  }
  throw new Error("unbalanced");
}
const evalLit = (lit) => vm.runInNewContext("(" + lit + ")", {}, { timeout: 2000 });

const m = js.match(/resources:\{en:\{translation:([\w$]+)\},zh:\{translation:\{/);
if (!m) throw new Error("i18n resources not found in studio bundle");
const zhStart = m.index + m[0].length - 1;
const zh = evalLit(js.slice(zhStart, matchBrace(js, zhStart)));
const defRe = new RegExp("[,;\\s]" + m[1].replace(/\$/g, "\\$") + "=\\{");
const d = defRe.exec(js);
if (!d) throw new Error("en translation var not found");
const enStart = d.index + d[0].length - 1;
const en = evalLit(js.slice(enStart, matchBrace(js, enStart)));
process.stdout.write(JSON.stringify({ en, zh }));
