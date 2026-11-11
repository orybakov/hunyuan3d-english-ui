const $ = (s) => document.querySelector(s);
const STR = {
  en: {
    title: "Model library", search: "Search", allKinds: "All", classic: "Classic generator", reload: "↻ Reload",
    selectAll: "Select all shown", format: "Format:", download: "Download", selected: "selected", allAccounts: "All accounts",
    loading: "Loading models from all accounts…", models: "models", none: "No models found.",
    notLoggedIn: "Not logged in on 3d.hunyuan.tencent.com and no saved accounts — log in on the site first.",
    started: "Downloads started:", noFmt: "no such format", folder: "Files go to Downloads/Hunyuan3D/<account>/",
  },
  ru: {
    title: "Библиотека моделей", search: "Поиск", allKinds: "Все", classic: "Обычный генератор", reload: "↻ Обновить",
    selectAll: "Выбрать все показанные", format: "Формат:", download: "Скачать", selected: "выбрано", allAccounts: "Все аккаунты",
    loading: "Загружаю модели со всех аккаунтов…", models: "моделей", none: "Модели не найдены.",
    notLoggedIn: "На 3d.hunyuan.tencent.com нет входа и сохранённых аккаунтов — сначала войдите на сайте.",
    started: "Скачивание началось:", noFmt: "нет такого формата", folder: "Файлы попадут в Загрузки/Hunyuan3D/<аккаунт>/",
  },
};
let L = STR.en;
const t = (k) => L[k] || STR.en[k] || k;

let items = [];
const picked = new Set();

const pad = (n) => String(n).padStart(2, "0");
const stamp = (ms) => {
  const d = new Date(ms || 0);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}_${pad(d.getHours())}-${pad(d.getMinutes())}`;
};
const slug = (s, max = 40) =>
  (s || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, max)
    .replace(/-+$/, "");

// Windows can't create files/folders with these names
const safe = (s) => (/^(con|prn|aux|nul|com\d|lpt\d)$/i.test(s) ? "_" + s : s);

// Downloads/Hunyuan3D/<account>/<date>_<prompt or model>_<id>.<ext>
function fileName(it, f) {
  const base = [stamp(it.createdAt), slug(it.title) || slug(it.model) || it.kind, String(it.id).replace(/-/g, "").slice(-6)]
    .filter(Boolean)
    .join("_");
  const extra = /no texture/i.test(f.label) ? "_notex" : "";
  return `Hunyuan3D/${safe(slug(it.account, 30) || "account")}/${base}${extra}.${f.ext || "bin"}`;
}

function download(it, f) {
  return chrome.downloads.download({ url: f.url, filename: fileName(it, f), conflictAction: "uniquify" });
}

function shown() {
  const q = $("#q").value.trim().toLowerCase();
  const acc = $("#acc").value;
  const kind = $("#kind").value;
  return items.filter(
    (it) =>
      (!acc || it.account === acc) &&
      (!kind || it.kind === kind) &&
      (!q || `${it.title} ${it.model} ${it.account}`.toLowerCase().includes(q))
  );
}

function render() {
  const list = shown();
  $("#count").textContent = `${list.length} ${t("models")}`;
  const grid = $("#grid");
  grid.textContent = "";
  if (!list.length) {
    const p = document.createElement("p");
    p.className = "empty";
    p.textContent = t("none");
    grid.append(p);
  }
  for (const it of list) {
    const card = document.createElement("article");
    card.className = "card" + (picked.has(it) ? " picked" : "");
    const img = document.createElement("img");
    img.loading = "lazy";
    img.referrerPolicy = "no-referrer";
    if (it.thumb) img.src = it.thumb;
    img.alt = "";
    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.checked = picked.has(it);
    cb.onchange = () => {
      cb.checked ? picked.add(it) : picked.delete(it);
      card.classList.toggle("picked", cb.checked);
      updateBulk();
    };
    const meta = document.createElement("div");
    meta.className = "meta";
    const title = document.createElement("div");
    title.className = "title";
    title.textContent = it.title || it.model || it.kind;
    title.title = it.title || "";
    const sub = document.createElement("div");
    sub.className = "sub";
    sub.textContent = `${it.account} · ${it.kind === "studio" ? "Studio" : t("classic")} · ${stamp(it.createdAt).replace("_", " ").replace(/-(\d\d)$/, ":$1")}`;
    const files = document.createElement("div");
    files.className = "files";
    for (const f of it.files) {
      const b = document.createElement("button");
      b.textContent = f.label + (f.ext === "zip" ? " (zip)" : "");
      b.title = fileName(it, f);
      b.onclick = () => download(it, f);
      files.append(b);
    }
    meta.append(title, sub, files);
    card.append(cb, img, meta);
    grid.append(card);
  }
  $("#all").checked = list.length > 0 && list.every((it) => picked.has(it));
  updateBulk();
}

function updateBulk() {
  const labels = [...new Set(items.flatMap((it) => it.files.map((f) => f.label)))];
  const fmt = $("#fmt");
  const cur = fmt.value;
  if (fmt.options.length !== labels.length) {
    fmt.textContent = "";
    for (const l of labels) fmt.append(new Option(l, l));
    if (labels.includes(cur)) fmt.value = cur;
  }
  $("#dl").disabled = !picked.size;
  $("#dl").textContent = `${t("download")} (${picked.size} ${t("selected")})`;
}

async function load() {
  $("#status").textContent = t("loading");
  $("#grid").textContent = "";
  picked.clear();
  const r = await chrome.runtime.sendMessage({ type: "library" });
  if (!r || !r.ok) {
    $("#status").textContent = (r && r.error) || "Error";
    return;
  }
  items = r.result.items;
  $("#status").textContent = t("folder");
  const errs = r.result.errors || [];
  $("#errors").hidden = !errs.length;
  $("#errors").textContent = errs.join(" · ");
  if (!items.length && !r.result.loggedIn) $("#status").textContent = t("notLoggedIn");
  const acc = $("#acc");
  acc.textContent = "";
  acc.append(new Option(t("allAccounts"), ""));
  for (const a of [...new Set(items.map((it) => it.account))]) acc.append(new Option(a, a));
  render();
}

$("#q").oninput = render;
$("#acc").onchange = render;
$("#kind").onchange = render;
$("#reload").onclick = load;
$("#all").onchange = () => {
  for (const it of shown()) $("#all").checked ? picked.add(it) : picked.delete(it);
  render();
};
$("#dl").onclick = async () => {
  const label = $("#fmt").value;
  let n = 0;
  const skipped = [];
  for (const it of picked) {
    const f = it.files.find((x) => x.label === label);
    if (!f) {
      skipped.push(it.title || it.model);
      continue;
    }
    await download(it, f);
    n++;
  }
  $("#status").textContent = `${t("started")} ${n}` + (skipped.length ? ` · ${label}: ${t("noFmt")} (${skipped.length})` : "");
};

(async () => {
  const set = { ...HYRU_DEFAULTS, ...((await chrome.storage.local.get("settings")).settings || {}) };
  L = STR[set.uiLang] || STR.en;
  document.documentElement.lang = set.uiLang;
  document.title = "Hunyuan 3D — " + t("title");
  document.querySelectorAll("[data-t]").forEach((e) => (e.textContent = t(e.dataset.t)));
  document.querySelectorAll("[data-t-ph]").forEach((e) => (e.placeholder = t(e.dataset.tPh)));
  load();
})();
