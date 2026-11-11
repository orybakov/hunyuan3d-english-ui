// Optional helpers on the site pages (each one can be switched off in the popup → Settings):
//  - lowQuota: when the site reports 0 generations left, offer to switch to an account that still has some;
//  - promptTools: translate a Russian prompt to English/Chinese (Chrome's on-device Translator) and prompt templates.
// Also reports the quota numbers the site loads anyway to the background worker (toolbar badge).
(() => {
  if (window !== window.top) return;
  const cfg = () => window.__HYRU_CFG || {};
  const RU = window.__HYRU_LANG === "ru";
  const T = (en, ru) => (RU ? ru : en);
  const call = (type, data) => (window.__hyruCall ? window.__hyruCall(type, data) : Promise.reject(new Error("no bridge")));

  // ---------- watch the site's own API answers ----------
  let userId = null;
  function seen(url, text) {
    if (!/\/api\//.test(url)) return;
    let j;
    try {
      j = JSON.parse(text);
    } catch {
      return;
    }
    if (/\/api\/3d\/getuserinfo/.test(url)) {
      const d = j && (j.data && typeof j.data === "object" ? j.data : j);
      if (d && d.userId) userId = String(d.userId);
    } else if (/\/api\/3d\/quotainfo/.test(url) && j && j.remainQuota != null) {
      onQuota("classic", j.remainQuota, j.totalQuota);
    } else if (/get_remaining_times/.test(url) && j && j.data && j.data.remainingTimes != null) {
      onQuota("studio", j.data.remainingTimes);
    }
  }

  const origFetch = window.fetch;
  window.fetch = function (input, init) {
    const p = origFetch.apply(this, arguments);
    try {
      const url = typeof input === "string" ? input : (input && input.url) || "";
      if (/\/api\/(3d\/(getuserinfo|quotainfo)|game3d\/general_info\/get_remaining_times)/.test(url))
        p.then((r) => r.clone().text().then((t) => seen(url, t))).catch(() => {});
    } catch {}
    return p;
  };
  window.fetch.toString = () => origFetch.toString();

  const xo = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function (m, url) {
    this.__hyruUrl = String(url || "");
    return xo.apply(this, arguments);
  };
  const xs = XMLHttpRequest.prototype.send;
  XMLHttpRequest.prototype.send = function () {
    if (/\/api\/(3d\/(getuserinfo|quotainfo)|game3d\/general_info\/get_remaining_times)/.test(this.__hyruUrl || ""))
      this.addEventListener("load", () => {
        try {
          if (!this.responseType || this.responseType === "text") seen(this.__hyruUrl, this.responseText);
          else if (this.responseType === "json") seen(this.__hyruUrl, JSON.stringify(this.response));
        } catch {}
      });
    return xs.apply(this, arguments);
  };

  async function onQuota(kind, remain, total) {
    if (!cfg().accounts) return;
    // getuserinfo usually comes first; give it a moment if not
    for (let i = 0; i < 20 && !userId; i++) await new Promise((r) => setTimeout(r, 250));
    call("quotaSeen", { userId, kind, remain, total }).catch(() => {});
    const onStudio = location.pathname.startsWith("/studio");
    if (remain === 0 && cfg().lowQuota && (kind === "studio") === onStudio) offerSwitch(kind);
  }

  // ---------- "no generations left" banner ----------
  let banner = null;
  const resetTime = () => {
    const d = new Date();
    d.setUTCHours(16, 0, 0, 0);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };
  async function offerSwitch(kind) {
    if (sessionStorage.getItem("hyru_noswitch_" + kind)) return;
    let next = null;
    try {
      next = await call("nextAccount", { userId, kind });
    } catch {}
    if (banner) banner.remove();
    banner = document.createElement("div");
    banner.id = "hyru-banner";
    const text = document.createElement("span");
    banner.append(text);
    if (next) {
      text.textContent = T(
        `No generations left on this account. “${next.name}” has ${next.left}.`,
        `На этом аккаунте генерации закончились. У «${next.name}» осталось ${next.left}.`
      );
      const b = document.createElement("button");
      b.textContent = T("Switch", "Переключиться");
      b.onclick = () => {
        b.disabled = true;
        b.textContent = T("Switching…", "Переключаю…");
        call("switchNext", { userId, kind }).catch((e) => {
          text.textContent = e.message;
          b.remove();
        });
      };
      banner.append(b);
    } else {
      text.textContent = T(
        `No generations left today on your saved accounts. They come back at about ${resetTime()} (midnight in Beijing).`,
        `Генерации на сохранённых аккаунтах на сегодня закончились. Они вернутся примерно в ${resetTime()} (полночь по Пекину).`
      );
    }
    const x = document.createElement("button");
    x.className = "hyru-x";
    x.textContent = "✕";
    x.title = T("Hide until the tab is closed", "Скрыть до закрытия вкладки");
    x.onclick = () => {
      sessionStorage.setItem("hyru_noswitch_" + kind, "1");
      banner.remove();
    };
    banner.append(x);
    (document.body || document.documentElement).append(banner);
  }

  // ---------- prompt tools ----------
  const TPL_KEY = "hyru_templates";
  const PRESETS = [
    { name: T("Game character, T-pose", "Игровой персонаж, T-поза"), text: "full body game character, T-pose, symmetrical, clean silhouette, neutral lighting" },
    { name: T("Monster for a game engine", "Монстр для игрового движка"), text: "game-ready fantasy monster, full body, T-pose, separated limbs, PBR textures" },
    { name: T("Prop / weapon", "Предмет / оружие"), text: "single game prop, centered, clean hard edges, realistic PBR materials" },
    { name: T("Stylized low-poly", "Стилизованный low-poly"), text: "stylized low-poly game asset, simple shapes, flat colors" },
  ];
  const loadTpl = () => {
    try {
      return JSON.parse(localStorage.getItem(TPL_KEY) || "[]");
    } catch {
      return [];
    }
  };
  const saveTpl = (list) => localStorage.setItem(TPL_KEY, JSON.stringify(list));

  const valueSetter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value").set;
  function setText(ta, v) {
    if (ta.maxLength > 0 && v.length > ta.maxLength) v = v.slice(0, ta.maxLength); // the site limits prompt length
    valueSetter.call(ta, v);
    ta.dispatchEvent(new Event("input", { bubbles: true }));
    ta.dispatchEvent(new Event("change", { bubbles: true }));
  }

  const translators = {};
  async function translate(text, target) {
    if (!("Translator" in self)) throw new Error(T("This Chrome has no built-in translator (needs Chrome 138+).", "В этом Chrome нет встроенного переводчика (нужен Chrome 138+)."));
    const key = "ru-" + target;
    if (!translators[key]) {
      const opts = { sourceLanguage: "ru", targetLanguage: target };
      const a = await self.Translator.availability(opts);
      if (a === "unavailable") throw new Error(T("Chrome can't translate Russian → " + target, "Chrome не умеет переводить с русского на " + target));
      translators[key] = await self.Translator.create(opts); // first time: downloads the language model
    }
    // keep the line structure: translate line by line
    const lines = text.split("\n");
    const out = [];
    for (const l of lines) out.push(/[а-яё]/i.test(l) ? await translators[key].translate(l) : l);
    return out.join("\n");
  }

  let bar = null;
  let target = null; // the textarea the bar is attached to
  let menu = null;
  let undo = null;

  const isPrompt = (ta) => {
    if (!ta.isConnected || ta.closest("#hyru-bar")) return false;
    const r = ta.getBoundingClientRect();
    return r.width > 180 && r.height > 40 && r.bottom > 0 && r.top < innerHeight && getComputedStyle(ta).visibility !== "hidden";
  };

  function btn(label, title, onclick) {
    const b = document.createElement("button");
    b.type = "button";
    b.textContent = label;
    if (title) b.title = title;
    b.addEventListener("mousedown", (e) => e.preventDefault()); // keep the textarea focused
    b.addEventListener("click", (e) => {
      e.stopPropagation();
      onclick(b);
    });
    return b;
  }

  function buildBar() {
    bar = document.createElement("div");
    bar.id = "hyru-bar";
    const tr = btn("RU → EN", T("Translate the Russian prompt to English (on-device, Chrome)", "Перевести промпт с русского на английский (офлайн, встроенный переводчик Chrome)"), (b) => doTranslate(b, "en"));
    const trZh = btn("RU → 中文", T("Translate the Russian prompt to Chinese — the model often understands it best", "Перевести промпт на китайский — модель часто понимает его лучше"), (b) => doTranslate(b, "zh"));
    const back = btn("↶", T("Undo the translation", "Вернуть текст до перевода"), () => {
      if (target && undo != null) setText(target, undo);
      undo = null;
      back.hidden = true;
    });
    back.hidden = true;
    bar.__back = back;
    const tpl = btn(T("Templates ▾", "Шаблоны ▾"), T("Insert a saved prompt", "Вставить сохранённый промпт"), toggleMenu);
    bar.append(tr, trZh, back, tpl);
    document.body.append(bar);
  }

  async function doTranslate(b, lang) {
    const ta = target;
    if (!ta) return;
    const text = ta.value;
    if (!/[а-яё]/i.test(text)) return flash(b, T("No Russian text", "Нет русского текста"));
    const label = b.textContent;
    b.disabled = true;
    b.textContent = "…";
    try {
      const out = await translate(text, lang);
      undo = text;
      setText(ta, out);
      bar.__back.hidden = false;
    } catch (e) {
      flash(b, e.message, 4000);
    } finally {
      b.disabled = false;
      if (b.textContent === "…") b.textContent = label;
    }
  }

  function flash(b, text, ms = 2000) {
    const old = b.dataset.label || b.textContent;
    b.dataset.label = old;
    b.textContent = text;
    setTimeout(() => {
      b.textContent = old;
      delete b.dataset.label;
    }, ms);
  }

  function closeMenu() {
    if (menu) menu.remove();
    menu = null;
  }

  function toggleMenu(anchor) {
    if (menu) return closeMenu();
    menu = document.createElement("div");
    menu.id = "hyru-menu";
    const fill = () => {
      menu.textContent = "";
      const own = loadTpl();
      const add = (t, i) => {
        const row = document.createElement("div");
        row.className = "hyru-item";
        row.title = t.text;
        const name = document.createElement("span");
        name.textContent = t.name;
        row.append(name);
        row.addEventListener("mousedown", (e) => e.preventDefault());
        row.onclick = () => {
          if (!target) return;
          const cur = target.value.trim();
          setText(target, cur ? cur.replace(/[,\s]*$/, "") + ", " + t.text : t.text);
          closeMenu();
        };
        if (i != null) {
          const del = document.createElement("button");
          del.type = "button";
          del.textContent = "✕";
          del.title = T("Delete template", "Удалить шаблон");
          del.onclick = (e) => {
            e.stopPropagation();
            const l = loadTpl();
            l.splice(i, 1);
            saveTpl(l);
            fill();
          };
          row.append(del);
        }
        menu.append(row);
      };
      own.forEach((t, i) => add(t, i));
      if (own.length) menu.append(Object.assign(document.createElement("hr")));
      PRESETS.forEach((t) => add(t, null));
      menu.append(Object.assign(document.createElement("hr")));
      const f = document.createElement("form");
      f.className = "hyru-save";
      const inp = document.createElement("input");
      inp.placeholder = T("Name for the current prompt", "Название для текущего промпта");
      inp.maxLength = 40;
      const ok = document.createElement("button");
      ok.textContent = T("Save", "Сохранить");
      f.append(inp, ok);
      f.onsubmit = (e) => {
        e.preventDefault();
        const text = target && target.value.trim();
        if (!text) return (inp.placeholder = T("The prompt box is empty", "Поле промпта пустое"));
        const l = loadTpl();
        l.unshift({ name: inp.value.trim() || text.slice(0, 30), text });
        saveTpl(l);
        fill();
      };
      menu.append(f);
    };
    fill();
    document.body.append(menu);
    const r = anchor.getBoundingClientRect();
    const mh = menu.offsetHeight;
    menu.style.left = Math.min(r.left, innerWidth - menu.offsetWidth - 8) + "px";
    menu.style.top = (r.bottom + mh + 8 < innerHeight ? r.bottom + 4 : Math.max(8, r.top - mh - 4)) + "px";
  }
  document.addEventListener("mousedown", (e) => {
    if (menu && !menu.contains(e.target) && !(bar && bar.contains(e.target))) closeMenu();
  }, true);

  function place() {
    const on = cfg().promptTools !== false;
    if (!on || !document.body) {
      if (bar) bar.hidden = true;
      closeMenu();
      return;
    }
    if (!target || !isPrompt(target)) {
      target = [...document.querySelectorAll("textarea")].find(isPrompt) || null;
      undo = null;
      if (bar) bar.__back.hidden = true;
    }
    if (!target) {
      if (bar) bar.hidden = true;
      closeMenu();
      return;
    }
    if (!bar || !bar.isConnected) buildBar();
    bar.hidden = false;
    const r = target.getBoundingClientRect();
    const h = bar.offsetHeight || 24;
    // just above the prompt box, right-aligned
    bar.style.left = Math.max(4, r.right - bar.offsetWidth) + "px";
    bar.style.top = Math.max(4, r.top - h - 4) + "px";
  }
  setInterval(place, 400);
  window.addEventListener("scroll", place, true);
  window.addEventListener("resize", place);
  window.addEventListener("hyru-cfg", () => {
    place();
    if (banner && (!cfg().lowQuota || !cfg().accounts)) banner.remove();
  });

  if (window.__hyru) window.__hyru.features = () => ({ userId, prompt: !!target, bar: !!(bar && !bar.hidden) });
  else window.__hyruFeatures = () => ({ userId, prompt: !!target, bar: !!(bar && !bar.hidden) });
})();
