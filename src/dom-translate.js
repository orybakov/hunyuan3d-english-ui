// Добивает китайский текст, который не прошёл через i18next:
// захардкоженные строки, ответы сервера, компоненты TDesign.
// 1) точный словарь, 2) шаблоны с {{x}}, 3) встроенный в Chrome Translator API (офлайн), с кэшем.
(() => {
  const D = window.__HYRU_DICT;
  if (!D) return;

  const TARGET = "en";
  const CJK = /[\u4e00-\u9fff]/;
  const ATTRS = ["placeholder", "title", "aria-label", "alt"];
  const SKIP_TAGS = new Set(["SCRIPT", "STYLE", "NOSCRIPT", "TEXTAREA", "CODE", "PRE"]);
  const CACHE_KEY = "hyru_mt_" + TARGET;

  const exact = new Map(Object.entries(D.exact));
  const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const patterns = D.patterns.map(([zh, en]) => {
    const names = [];
    const src = zh
      .split(/(\{\{\s*\w+\s*\}\})/)
      .map((part) => {
        const m = part.match(/^\{\{\s*(\w+)\s*\}\}$/);
        if (!m) return esc(part);
        names.push(m[1]);
        return "(.+?)";
      })
      .join("");
    return { re: new RegExp("^" + src + "$", "s"), en, names };
  });

  let mtCache = {};
  try {
    mtCache = JSON.parse(localStorage.getItem(CACHE_KEY) || "{}");
  } catch {}
  const missing = new Set();

  function lookup(core) {
    if (exact.has(core)) return exact.get(core);
    if (mtCache[core]) return mtCache[core];
    for (const p of patterns) {
      const m = core.match(p.re);
      if (!m) continue;
      let out = p.en;
      p.names.forEach((n, i) => {
        const v = m[i + 1];
        const tv = CJK.test(v) ? lookup(v.trim()) || v : v;
        out = out.split("{{" + n + "}}").join(tv);
      });
      return out;
    }
    // Составные строки вида «Персонаж · Бочка»
    if (core.includes(" · ")) {
      const parts = core.split(" · ").map((s) => (CJK.test(s) ? lookup(s.trim()) : s));
      if (parts.every((x) => x != null)) return parts.join(" · ");
    }
    return null;
  }

  // Перевод строки с сохранением пробелов по краям. null — пока нечем перевести.
  function tr(s) {
    if (!s || !CJK.test(s)) return null;
    const lead = s.match(/^\s*/)[0];
    const trail = s.match(/\s*$/)[0];
    const core = s.trim();
    const r = lookup(core);
    if (r != null) return lead + r + trail;
    queueMT(core);
    return null;
  }

  // ---------- DOM ----------
  const done = new WeakMap(); // node -> последнее записанное нами значение

  function skip(el) {
    for (let e = el; e && e !== document.documentElement; e = e.parentElement) {
      if (SKIP_TAGS.has(e.tagName) || e.isContentEditable) return true;
    }
    return false;
  }

  function doText(node) {
    const v = node.nodeValue;
    if (!v || done.get(node) === v || !CJK.test(v)) return;
    if (node.parentElement && skip(node.parentElement)) return;
    const r = tr(v);
    if (r != null) {
      done.set(node, r);
      node.nodeValue = r;
    } else {
      pend(node);
    }
  }

  function doAttrs(el) {
    if (SKIP_TAGS.has(el.tagName) && el.tagName !== "TEXTAREA") return;
    for (const a of ATTRS) {
      const v = el.getAttribute(a);
      if (!v || !CJK.test(v)) continue;
      const r = tr(v);
      if (r != null) {
        el.setAttribute(a, r);
      } else {
        pend(el);
      }
    }
    if (el.tagName === "INPUT" && /^(button|submit|reset)$/i.test(el.type) && CJK.test(el.value)) {
      const r = tr(el.value);
      if (r != null) el.value = r;
    }
  }

  function walk(root) {
    if (root.nodeType === Node.TEXT_NODE) return doText(root);
    if (root.nodeType !== Node.ELEMENT_NODE && root.nodeType !== Node.DOCUMENT_NODE) return;
    if (root.nodeType === Node.ELEMENT_NODE) {
      if (SKIP_TAGS.has(root.tagName)) {
        if (root.tagName === "TEXTAREA") doAttrs(root);
        return;
      }
      doAttrs(root);
    }
    const it = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT, {
      acceptNode: (n) =>
        n.nodeType === Node.ELEMENT_NODE && SKIP_TAGS.has(n.tagName) && n.tagName !== "TEXTAREA"
          ? NodeFilter.FILTER_REJECT
          : NodeFilter.FILTER_ACCEPT,
    });
    let n;
    while ((n = it.nextNode())) {
      if (n.nodeType === Node.TEXT_NODE) doText(n);
      else doAttrs(n);
    }
    if (root.shadowRoot) walk(root.shadowRoot);
  }

  function translateTitle() {
    const r = tr(document.title);
    if (r != null) document.title = r;
  }

  const obs = new MutationObserver((muts) => {
    for (const m of muts) {
      if (m.type === "characterData") doText(m.target);
      else if (m.type === "attributes") doAttrs(m.target);
      else for (const n of m.addedNodes) walk(n);
      if (m.target === document.head || (m.target.parentNode && m.target.parentNode.nodeName === "TITLE")) translateTitle();
    }
  });

  function start() {
    obs.observe(document.documentElement, {
      subtree: true,
      childList: true,
      characterData: true,
      attributes: true,
      attributeFilter: ATTRS.concat("value"),
    });
    walk(document.documentElement);
    translateTitle();
  }
  if (document.documentElement) start();
  else document.addEventListener("readystatechange", start, { once: true });

  // ---------- Машинный перевод для того, чего нет в словаре ----------
  const pendingNodes = new Set(); // WeakRef на узлы, ждущие перевода
  const queue = new Set();
  let translator = null;
  let mtState = "init"; // init | ready | need-click | unavailable
  let timer = 0;

  function pend(node) {
    pendingNodes.add(new WeakRef(node));
  }

  function queueMT(core) {
    if (core.length > 2000) return;
    missing.add(core);
    queue.add(core);
    if (mtState === "ready") schedule();
  }

  function schedule() {
    clearTimeout(timer);
    timer = setTimeout(flush, 250);
  }

  let saveTimer = 0;
  function saveCache() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify(mtCache));
      } catch {}
    }, 1000);
  }

  async function flush() {
    if (!translator || !queue.size) return;
    const items = [...queue];
    queue.clear();
    let any = false;
    for (const s of items) {
      if (mtCache[s]) continue;
      try {
        const out = await translator.translate(s);
        if (out && !CJK.test(out)) {
          mtCache[s] = out;
          missing.delete(s);
          any = true;
        }
      } catch (e) {
        console.debug("[hyru] translate failed", s, e);
      }
    }
    if (!any) return;
    saveCache();
    for (const ref of [...pendingNodes]) {
      const n = ref.deref();
      pendingNodes.delete(ref);
      if (!n || !n.isConnected) continue;
      if (n.nodeType === Node.TEXT_NODE) doText(n);
      else doAttrs(n);
    }
  }

  const OPTS = { sourceLanguage: "zh", targetLanguage: TARGET };

  async function create() {
    translator = await self.Translator.create(OPTS);
    mtState = "ready";
    schedule();
  }

  async function initMT() {
    if (!("Translator" in self)) {
      mtState = "unavailable";
      return;
    }
    try {
      const a = await self.Translator.availability(OPTS);
      if (a === "available") return await create();
      if (a === "unavailable") {
        mtState = "unavailable";
        return;
      }
      // Модель надо скачать — Chrome требует жест пользователя.
      mtState = "need-click";
      const onGesture = () => {
        create().catch((e) => console.warn("[hyru] Translator.create:", e));
      };
      window.addEventListener("pointerdown", onGesture, { once: true, capture: true });
      window.addEventListener("keydown", onGesture, { once: true, capture: true });
    } catch (e) {
      mtState = "unavailable";
      console.warn("[hyru] Translator API:", e);
    }
  }
  initMT();

  // Отладка из консоли: __hyru.missing() — что не нашлось в словаре
  window.__hyru = {
    missing: () => [...missing],
    stats: () => ({
      bundlePatched: !!window.__HYRU_BUNDLE_PATCHED,
      dict: exact.size,
      patterns: patterns.length,
      mtState,
      mtCached: Object.keys(mtCache).length,
      missing: missing.size,
    }),
    clearCache: () => {
      mtCache = {};
      localStorage.removeItem(CACHE_KEY);
    },
  };
})();
