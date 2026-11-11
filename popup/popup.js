const $ = (s) => document.querySelector(s);
const REPO = "https://github.com/orybakov/hunyuan3d-english-ui";
const SITE = "https://3d.hunyuan.tencent.com/";

const STR = {
  en: {
    library: "Library", settings: "Settings", accounts: "Accounts", checkAll: "↻ Check all",
    checkAllTitle: "Check remaining generations of all accounts",
    accessText: "The account switcher needs access to tencent.com cookies (that's where the site keeps your login).",
    allow: "Allow access", empty: "No saved accounts yet. Log in on the site, then click Save current.",
    save: "Save current", add: "+ Add another", addTitle: "Save the current login and sign out, so you can log in to another account",
    report: "Report untranslated text", uiLang: "Site language", alwaysOn: "Translation is always on. Everything below can be switched off.",
    done: "Done", loggedIn: "Logged in: ", notSaved: " (not saved)", notLoggedIn: "Not logged in (or the site is unreachable).",
    details: "Details", active: "active", expired: "expired — log in again & save", checked: "checked", rename: "Rename",
    forget: "Forget this account (does not log out on the site)", forgetQ: "Forget?", switchTo: "Switch to this account",
    switching: "Switching to", saving: "Saving…", signingOut: "Signing out…", checking: "Checking all accounts…",
    afterAdd: "Log in to another account on the site, then open this popup and click Save current.",
    nameNew: "Name (empty = nickname)", accName: "Account name", cancel: "Cancel",
    noAccess: "Access not granted — saving and switching accounts won't work.",
    next: "→ Switch to the next account with generations", noNext: "No other saved account has generations left right now.",
    leftTitle: "Generations left today: Studio · classic generator", assumed: "assumed: the daily limit has reset since the last check",
    noTab: "Open 3d.hunyuan.tencent.com first.", nothingMissing: "Nothing untranslated on the open page — thanks!",
    reportOpened: "A GitHub issue form opened in a new tab — check it and click Submit.",
    justNow: "just now", min: "min ago", h: "h ago", d: "d ago",
    t_hints: ["Tooltips for 3D terms", "Underlined terms explain themselves on hover (Alt+H — hide, Alt+L — hint language)."],
    t_accounts: ["Account switcher", "Save several logins and switch in one click."],
    t_badge: ["Generations counter on the icon", "Studio generations left today across all saved accounts."],
    t_lowQuota: ["Offer to switch when out of generations", "A banner on the site with the account that still has some."],
    t_resetNotify: ["Notify when generations are back", "Once a day, after the limit resets (00:00 Beijing time)."],
    t_promptTools: ["Prompt translation & templates", "RU → EN / 中文 buttons and saved prompts above the prompt box."],
    t_library: ["Model library", "All models from all accounts on one page, downloads with readable names."],
    t_report: ["“Report untranslated text” button", "Sends the strings left in Chinese to GitHub."],
  },
  ru: {
    library: "Библиотека", settings: "Настройки", accounts: "Аккаунты", checkAll: "↻ Проверить все",
    checkAllTitle: "Проверить остаток генераций у всех аккаунтов",
    accessText: "Переключателю аккаунтов нужен доступ к cookie tencent.com — там сайт хранит вход.",
    allow: "Разрешить доступ", empty: "Сохранённых аккаунтов нет. Войдите на сайте и нажмите «Сохранить текущий».",
    save: "Сохранить текущий", add: "+ Добавить ещё", addTitle: "Сохранить текущий вход и выйти, чтобы войти в другой аккаунт",
    report: "Сообщить о непереведённом", uiLang: "Язык сайта", alwaysOn: "Перевод работает всегда. Остальное можно выключить.",
    done: "Готово", loggedIn: "Вход: ", notSaved: " (не сохранён)", notLoggedIn: "Вход не выполнен (или сайт недоступен).",
    details: "Подробности", active: "активен", expired: "вход истёк — войдите снова и сохраните", checked: "проверено", rename: "Переименовать",
    forget: "Забыть аккаунт (на сайте не выходит)", forgetQ: "Забыть?", switchTo: "Переключиться на этот аккаунт",
    switching: "Переключаю на", saving: "Сохраняю…", signingOut: "Выхожу…", checking: "Проверяю все аккаунты…",
    afterAdd: "Войдите на сайте в другой аккаунт, затем откройте это окно и нажмите «Сохранить текущий».",
    nameNew: "Имя (пусто = ник)", accName: "Имя аккаунта", cancel: "Отмена",
    noAccess: "Доступ не выдан — сохранять и переключать аккаунты не получится.",
    next: "→ Следующий аккаунт с генерациями", noNext: "Сейчас ни у одного другого сохранённого аккаунта нет генераций.",
    leftTitle: "Осталось генераций сегодня: Studio · обычный генератор", assumed: "предположительно: лимит обновился после последней проверки",
    noTab: "Сначала откройте 3d.hunyuan.tencent.com.", nothingMissing: "На открытой странице всё переведено — спасибо!",
    reportOpened: "В новой вкладке открылась форма заявки на GitHub — проверьте и нажмите Submit.",
    justNow: "только что", min: "мин назад", h: "ч назад", d: "дн назад",
    t_hints: ["Подсказки к 3D-терминам", "Подчёркнутые термины объясняются при наведении (Alt+H — скрыть, Alt+L — язык подсказок)."],
    t_accounts: ["Переключатель аккаунтов", "Сохраните несколько входов и переключайтесь в один клик."],
    t_badge: ["Счётчик генераций на значке", "Сколько генераций Studio осталось сегодня на всех аккаунтах."],
    t_lowQuota: ["Предлагать переключиться, когда генерации кончились", "Плашка на сайте с аккаунтом, где они ещё есть."],
    t_resetNotify: ["Уведомлять, когда генерации вернулись", "Раз в день, после сброса лимита (полночь по Пекину, 19:00 МСК)."],
    t_promptTools: ["Перевод промптов и шаблоны", "Кнопки RU → EN / 中文 и сохранённые промпты над полем промпта."],
    t_library: ["Библиотека моделей", "Все модели со всех аккаунтов на одной странице, скачивание с понятными именами."],
    t_report: ["Кнопка «Сообщить о непереведённом»", "Отправляет оставшиеся китайские строки на GitHub."],
  },
};
let set = { ...HYRU_DEFAULTS };
let L = STR.en;
const t = (k) => L[k] || STR.en[k] || k;

const msg = (text, err) => {
  $("#msg").textContent = text || "";
  $("#msg").className = err ? "err" : "";
};

function applyLang() {
  L = STR[set.uiLang] || STR.en;
  document.documentElement.lang = set.uiLang;
  document.querySelectorAll("[data-t]").forEach((e) => (e.textContent = t(e.dataset.t)));
  document.querySelectorAll("[data-t-title]").forEach((e) => (e.title = t(e.dataset.tTitle)));
}

// ---------- settings ----------
const TOGGLES = ["hints", "accounts", "badge", "lowQuota", "resetNotify", "promptTools", "library", "report"];
const NEEDS_ACCOUNTS = new Set(["badge", "lowQuota", "resetNotify"]);

function renderSettings() {
  $("#uiLang").value = set.uiLang;
  const box = $("#toggles");
  box.textContent = "";
  for (const k of TOGGLES) {
    const [title, note] = t("t_" + k);
    const row = document.createElement("label");
    row.className = "opt toggle" + (NEEDS_ACCOUNTS.has(k) ? " sub" : "");
    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.checked = !!set[k];
    cb.disabled = NEEDS_ACCOUNTS.has(k) && !set.accounts;
    cb.onchange = () => saveSettings({ [k]: cb.checked });
    const text = document.createElement("span");
    text.textContent = title;
    const small = document.createElement("small");
    small.textContent = note;
    text.append(small);
    row.append(text, cb);
    box.append(row);
  }
}

async function saveSettings(patch) {
  set = { ...set, ...patch };
  await chrome.storage.local.set({ settings: set });
  applyLang();
  renderSettings();
  applyVisibility();
}

$("#uiLang").onchange = () => saveSettings({ uiLang: $("#uiLang").value });
$("#gear").onclick = () => {
  const open = $("#settings").hidden;
  $("#settings").hidden = !open;
  $("#main").hidden = open;
  if (!open) render();
};
$("#back").onclick = () => {
  $("#settings").hidden = true;
  $("#main").hidden = false;
  render();
};

function applyVisibility() {
  $("#accountsBox").hidden = !set.accounts;
  $("#openLib").hidden = !set.library;
  $("#report").hidden = !set.report;
}

// ---------- accounts ----------
const ACCESS = { origins: ["https://*.tencent.com/*", "http://*.tencent.com/*"] };
const hasAccess = () => chrome.permissions.contains(ACCESS);

// Must run inside a click handler: permissions.request needs a user gesture.
async function ensureAccess() {
  const ok = await chrome.permissions.request(ACCESS); // resolves true without a prompt if already granted
  if (!ok) msg(t("noAccess"), true);
  return ok;
}
const guarded = (fn) => async (...a) => {
  if (await ensureAccess()) return fn(...a);
};

async function call(type, data = {}) {
  const r = await chrome.runtime.sendMessage({ type, ...data });
  if (!r || !r.ok) throw new Error((r && r.error) || "No response");
  return r.result;
}

async function busy(label, fn) {
  document.querySelectorAll("button").forEach((b) => (b.disabled = true));
  msg(label);
  try {
    const after = await fn();
    msg(typeof after === "string" ? after : "");
  } catch (e) {
    msg(e.message, true);
  } finally {
    await render();
  }
}

const ago = (ts) => {
  if (!ts) return "";
  const m = Math.round((Date.now() - ts) / 60000);
  if (m < 1) return t("justNow");
  if (m < 60) return `${m} ${t("min")}`;
  const h = Math.round(m / 60);
  return h < 24 ? `${h} ${t("h")}` : `${Math.round(h / 24)} ${t("d")}`;
};

function quotaEl(q) {
  const s = document.createElement("span");
  s.className = "quota";
  if (!q || (q.remain == null && q.studio == null)) {
    s.classList.add("unknown");
    s.textContent = "—";
  } else {
    const st = q.studio != null ? q.studio : "?";
    const cl = q.remain != null ? `${q.remain}/${q.total}` : "?";
    s.textContent = `${q.assumed ? "~" : ""}${st} · ${cl}`;
    if (!q.studio && !q.remain) s.classList.add("zero");
  }
  s.title = t("leftTitle") + (q && q.assumed ? `\n(${t("assumed")})` : "");
  return s;
}

let lastState = null;

async function render() {
  applyVisibility();
  if (!set.accounts) return;
  $("#access").hidden = await hasAccess();
  let st;
  try {
    st = lastState = await call("state");
  } catch (e) {
    msg(e.message, true);
    return;
  }
  const cur = $("#current");
  cur.textContent = "";
  if (st.current) {
    const known = st.accounts.some((a) => a.id === st.activeId);
    cur.append(t("loggedIn"));
    const b = document.createElement("b");
    b.textContent = st.current.nickname || st.current.userId || "unknown";
    cur.append(b, known ? "" : t("notSaved"));
  } else {
    cur.textContent = t("notLoggedIn");
    if (st.diag) {
      const d = document.createElement("details");
      const sm = document.createElement("summary");
      sm.textContent = t("details");
      const pre = document.createElement("pre");
      pre.textContent = [`tab: ${st.diag.tab}`, ...(st.diag.steps || []), `cookies: ${st.diag.cookies || "none"}`].join("\n");
      d.append(sm, pre);
      cur.append(d);
    }
  }

  const list = $("#list");
  list.textContent = "";
  for (const a of st.accounts) {
    const li = document.createElement("li");
    const active = a.id === st.activeId && st.current;
    if (active) li.classList.add("active");
    const name = document.createElement("span");
    name.className = "name";
    name.textContent = a.name;
    const sub = document.createElement("span");
    sub.className = "sub";
    sub.textContent = active ? t("active") : a.expired ? t("expired") : a.checkedAt ? `${t("checked")} ${ago(a.checkedAt)}` : "";
    name.append(sub);

    const ren = document.createElement("button");
    ren.className = "icon";
    ren.textContent = "✎";
    ren.title = t("rename");
    ren.onclick = (e) => {
      e.stopPropagation();
      li.onclick = null;
      li.textContent = "";
      li.append(nameForm(a.name, t("accName"), (n) => (n ? busy("", () => call("rename", { id: a.id, name: n })) : render()), render));
    };
    const del = document.createElement("button");
    del.className = "icon";
    del.textContent = "✕";
    del.title = t("forget");
    del.onclick = (e) => {
      e.stopPropagation();
      if (del.classList.contains("confirm")) return busy("", () => call("remove", { id: a.id }));
      del.classList.add("confirm");
      del.textContent = t("forgetQ");
      setTimeout(() => {
        del.classList.remove("confirm");
        del.textContent = "✕";
      }, 3000);
    };

    li.append(name, quotaEl(a.eff || a.quota), ren, del);
    if (!active) {
      li.title = t("switchTo");
      li.onclick = guarded(() => busy(`${t("switching")} ${a.name}…`, () => call("switch", { id: a.id })));
    }
    list.append(li);
  }
  $("#empty").hidden = st.accounts.length > 0;
  $("#next").hidden = st.accounts.length < 2;
  $("#next").textContent = t("next");
  document.querySelectorAll("button").forEach((b) => (b.disabled = false));
  $("#save").disabled = !st.current;
  $("#refresh").disabled = !st.accounts.length;
}

// Inline name input: window.prompt() is clipped inside extension popups.
function nameForm(value, placeholder, onOk, onCancel) {
  const f = document.createElement("form");
  f.className = "ask";
  const input = document.createElement("input");
  input.value = value;
  input.placeholder = placeholder;
  input.maxLength = 40;
  const ok = document.createElement("button");
  ok.textContent = "OK";
  const no = document.createElement("button");
  no.type = "button";
  no.className = "ghost";
  no.textContent = t("cancel");
  f.onclick = (e) => e.stopPropagation();
  f.onsubmit = (e) => {
    e.preventDefault();
    onOk(input.value.trim());
  };
  no.onclick = onCancel;
  input.onkeydown = (e) => {
    // returning false from an on-handler would block typing, so no expression body here
    if (e.key === "Escape") {
      e.preventDefault();
      onCancel();
    }
  };
  f.append(input, ok, no);
  setTimeout(() => input.focus(), 0);
  return f;
}

$("#save").onclick = guarded(() => {
  const box = $("#ask");
  box.textContent = "";
  box.append(
    nameForm("", t("nameNew"), (n) => {
      box.textContent = "";
      busy(t("saving"), () => call("save", { name: n }));
    }, () => (box.textContent = ""))
  );
});
$("#add").onclick = guarded(() =>
  busy(t("signingOut"), async () => {
    await call("addNew");
    return t("afterAdd");
  }));
$("#refresh").onclick = guarded(() => busy(t("checking"), () => call("refreshAll")));
$("#grant").onclick = async () => {
  if (await ensureAccess()) render();
};

// Studio and the classic generator have separate counters: pick by the open site page.
$("#next").onclick = guarded(async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const kind = tab && tab.url && tab.url.includes("/studio") ? "studio" : "classic";
  const userId = lastState && lastState.current && lastState.current.userId;
  const n = await call("nextAccount", { userId, kind });
  if (!n) return msg(t("noNext"));
  busy(`${t("switching")} ${n.name}…`, () => call("switch", { id: n.id }));
});

// ---------- tools ----------
$("#openLib").onclick = () => chrome.tabs.create({ url: chrome.runtime.getURL("library/library.html") });

$("#report").onclick = async () => {
  const tabs = await chrome.tabs.query({ url: SITE + "*" });
  const tab = tabs.find((x) => x.active) || tabs[0];
  if (!tab) return msg(t("noTab"), true);
  let found = [];
  try {
    const res = await chrome.scripting.executeScript({
      target: { tabId: tab.id, allFrames: true },
      world: "MAIN",
      func: () => (window.__hyru ? window.__hyru.missing() : []),
    });
    found = [...new Set(res.flatMap((r) => r.result || []))];
  } catch (e) {
    return msg(e.message, true);
  }
  if (!found.length) return msg(t("nothingMissing"));
  const path = new URL(tab.url).pathname;
  const v = chrome.runtime.getManifest().version;
  let body = `Page: \`${path}\`\nExtension: v${v}, UI: ${set.uiLang}\n\nStrings left in Chinese:\n\n\`\`\`\n`;
  for (const s of found) {
    if (body.length + s.length > 5500) break;
    body += s.replace(/\n/g, " ") + "\n";
  }
  body += "```\n";
  const url = `${REPO}/issues/new?labels=untranslated&title=${encodeURIComponent(`Untranslated text on ${path}`)}&body=${encodeURIComponent(body)}`;
  chrome.tabs.create({ url });
  msg(t("reportOpened"));
};

// ---------- start ----------
(async () => {
  set = { ...HYRU_DEFAULTS, ...((await chrome.storage.local.get("settings")).settings || {}) };
  applyLang();
  renderSettings();
  render();
})();
