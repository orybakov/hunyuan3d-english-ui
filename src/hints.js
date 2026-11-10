// Подсказки к элементам интерфейса + всплывающий полный текст у обрезанных надписей.
// Данные: window.__HYRU_HINTS = { "label": { ru: {d, r}, en: {d, r} } } (src/hints-data.js).
// Язык подсказок — по языку браузера (ru → русский, иначе английский), Alt+L — переключить.
// Alt+H — включить/выключить подсказки.
(() => {
  const RAW = window.__HYRU_HINTS || {};
  const norm = (s) => s.replace(/\s+/g, " ").trim().toLowerCase();
  const hints = new Map(Object.entries(RAW).map(([k, v]) => [norm(k), { ...v, label: k }]));
  const OFF_KEY = "hyru_hints_off";
  const LANG_KEY = "hyru_hints_lang";
  let lang = localStorage.getItem(LANG_KEY) || ((navigator.language || "").toLowerCase().startsWith("ru") ? "ru" : "en");
  let off = localStorage.getItem(OFF_KEY) === "1";
  const MAX_LABEL = Math.max(0, ...[...hints.keys()].map((k) => k.length));

  const setOffClass = () => document.documentElement && document.documentElement.classList.toggle("hyru-hints-off", off);

  // ---------- разметка ----------
  function mark(textNode) {
    const v = textNode.nodeValue;
    if (!v || v.length > MAX_LABEL + 4) return;
    const key = norm(v);
    if (!key || !hints.has(key)) return;
    const el = textNode.parentElement;
    if (el && el.getAttribute("data-hyru-hint") !== key) el.setAttribute("data-hyru-hint", key);
  }

  function scan(root) {
    if (!hints.size) return;
    if (root.nodeType === Node.TEXT_NODE) return mark(root);
    if (root.nodeType !== Node.ELEMENT_NODE) return;
    const it = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let n;
    while ((n = it.nextNode())) mark(n);
  }

  // Перевод текста (dom-translate) тоже приходит сюда через characterData
  const obs = new MutationObserver((muts) => {
    for (const m of muts) {
      if (m.type === "characterData") mark(m.target);
      else for (const n of m.addedNodes) scan(n);
    }
  });

  // ---------- всплывашка ----------
  let tip = null;
  let showTimer = 0;
  let current = null;

  function ensureTip() {
    if (tip && tip.isConnected) return tip;
    tip = document.createElement("div");
    tip.id = "hyru-tip";
    document.body.appendChild(tip);
    return tip;
  }

  function show(el) {
    const entry = hints.get(el.getAttribute("data-hyru-hint"));
    if (!entry) return;
    const h = entry[lang] || entry.en || entry.ru;
    if (!h) return;
    const t = ensureTip();
    t.textContent = "";
    const b = document.createElement("b");
    b.textContent = entry.label;
    t.appendChild(b);
    t.appendChild(document.createTextNode(h.d || ""));
    if (h.r) {
      const r = document.createElement("div");
      r.className = "tip-hint";
      r.textContent = h.r;
      t.appendChild(r);
    }
    const rect = el.getBoundingClientRect();
    t.style.left = "0px";
    t.style.top = "0px";
    t.classList.remove("show");
    const tw = t.offsetWidth;
    const th = t.offsetHeight;
    let x = Math.min(Math.max(8, rect.left + rect.width / 2 - tw / 2), innerWidth - tw - 8);
    let y = rect.bottom + 8;
    if (y + th > innerHeight - 8) y = rect.top - th - 8;
    t.style.left = x + "px";
    t.style.top = Math.max(8, y) + "px";
    requestAnimationFrame(() => t.classList.add("show"));
  }

  function hide() {
    clearTimeout(showTimer);
    current = null;
    if (tip) tip.classList.remove("show");
  }

  // У обрезанной надписи (ellipsis) без title показываем полный текст стандартным title
  function fixTruncated(el) {
    for (let e = el, i = 0; e && i < 3; e = e.parentElement, i++) {
      if (e.hasAttribute("title") || e.scrollWidth <= e.clientWidth + 1) continue;
      if (getComputedStyle(e).textOverflow !== "ellipsis") continue;
      const txt = e.textContent.trim();
      if (txt && txt.length < 300) e.setAttribute("title", txt);
      return;
    }
  }

  document.addEventListener(
    "mouseover",
    (ev) => {
      const target = ev.target instanceof Element ? ev.target : null;
      if (!target) return;
      fixTruncated(target);
      if (off) return;
      const el = target.closest("[data-hyru-hint]");
      if (el === current) return;
      hide();
      if (!el) return;
      current = el;
      showTimer = setTimeout(() => current === el && el.isConnected && show(el), 450);
    },
    true
  );
  document.addEventListener("mousedown", hide, true);
  document.addEventListener("scroll", hide, true);
  window.addEventListener("blur", hide);

  document.addEventListener(
    "keydown",
    (e) => {
      if (e.altKey && !e.ctrlKey && !e.metaKey && e.code === "KeyH") {
        off = !off;
        localStorage.setItem(OFF_KEY, off ? "1" : "0");
        setOffClass();
        hide();
        e.preventDefault();
      } else if (e.altKey && !e.ctrlKey && !e.metaKey && e.code === "KeyL") {
        lang = lang === "ru" ? "en" : "ru";
        localStorage.setItem(LANG_KEY, lang);
        if (current) show(current);
        e.preventDefault();
      }
    },
    true
  );

  function start() {
    setOffClass();
    obs.observe(document.documentElement, { subtree: true, childList: true, characterData: true });
    scan(document.documentElement);
  }
  if (document.documentElement) start();
  else document.addEventListener("readystatechange", start, { once: true });

  if (window.__hyru) window.__hyru.hints = () => ({ total: hints.size, marked: document.querySelectorAll("[data-hyru-hint]").length, off });
})();
