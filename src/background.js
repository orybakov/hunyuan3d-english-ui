// Background worker: account switcher, quota badge, daily reset alarm, model library.
// The site keeps the login in cookies, so an "account" is a cookie snapshot.
// Storage (chrome.storage.local): { settings, accounts: [{ id, name, userId, cookies, quota, checkedAt, expired }], activeId }
// quota = { remain, total, date (Beijing day "YYYYMMDD"), studio (Studio generations left) }
importScripts("defaults.js");

const ORIGIN = "https://3d.hunyuan.tencent.com";
const SITE = ORIGIN + "/";
// Login cookies live on .tencent.com without Secure: reading/restoring them needs http+https access to *.tencent.com.
const ACCESS = ["https://*.tencent.com/*", "http://*.tencent.com/*"];
const HEADERS = { "x-source": "web", "x-product": "hunyuan3d", "Content-Type": "application/json" };

const load = async () => {
  const s = await chrome.storage.local.get(["accounts", "activeId"]);
  return { accounts: s.accounts || [], activeId: s.activeId || null };
};
const store = (state) => chrome.storage.local.set(state);

async function siteTab() {
  const tabs = await chrome.tabs.query({ url: ORIGIN + "/*" });
  return tabs.find((t) => t.active) || tabs[0] || null;
}

// Last API attempt, shown in the popup when the login isn't detected.
let lastDiag = null;

// API calls run inside an open site tab when possible (same origin, exactly like the site), otherwise from here.
async function api(path, body) {
  const diag = (lastDiag = { path, tab: null, steps: [] });
  const tab = await siteTab();
  diag.tab = tab ? `${tab.status} ${tab.url.slice(0, 60)}` : "no site tab";
  if (tab && tab.status === "complete") {
    try {
      const [r] = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        world: "MAIN",
        args: [path, body ?? null, HEADERS],
        func: async (path, body, headers) => {
          const res = await fetch(path, {
            method: body ? "POST" : "GET",
            credentials: "include",
            headers,
            body: body ? JSON.stringify(body) : undefined,
          });
          return { status: res.status, text: await res.text() };
        },
      });
      const out = r && r.result;
      diag.steps.push(out ? `tab: ${out.status} ${out.text.slice(0, 160)}` : "tab: no result");
      if (out) return JSON.parse(out.text);
    } catch (e) {
      // tab may be navigating or showing an error page — fall back
      diag.steps.push(`tab: ${(e && e.message) || e}`);
    }
  }
  // same lock as apiAs(): its DNR rule would otherwise put another account's cookies on this request
  const text = await withLock(async () => {
    const res = await fetch(ORIGIN + path, {
      method: body ? "POST" : "GET",
      credentials: "include",
      headers: HEADERS,
      body: body ? JSON.stringify(body) : undefined,
    });
    diag.status = res.status;
    return res.text();
  });
  diag.steps.push(`bg: ${diag.status} ${text.slice(0, 160)}`);
  return JSON.parse(text);
}

async function whoAmI(call = api) {
  try {
    return parseUser(await call("/api/3d/getuserinfo"));
  } catch (e) {
    if (lastDiag) lastDiag.steps.push(`error: ${(e && e.message) || e}`);
    return null;
  }
}

const parseUser = (u) => {
  // getuserinfo answers with the user object at the top level; other endpoints wrap it in { data }
  const d = u && !u.error ? (u.data && typeof u.data === "object" ? u.data : u) : null;
  if (!d || !(d.userId ?? d.userid ?? d.uid)) return null;
  const id = d.userId ?? d.userid ?? d.uid ?? d.id;
  return {
    userId: id != null ? String(id) : null,
    nickname: d.nickname || d.nickName || d.userName || d.name || d.email || d.phoneNumber || "",
  };
};
const rid = () => Math.random().toString(36).slice(2, 14);

// Classic generator (/creation) and Studio (/studio) have separate daily counters.
async function quota(call = api) {
  let out = null;
  try {
    const q = await call("/api/3d/quotainfo", { sceneType: "3dCreations" });
    const d = q && !q.error ? (q.data && typeof q.data === "object" ? q.data : q) : null;
    if (d && d.remainQuota != null) out = { remain: d.remainQuota, total: d.totalQuota, date: d.date || HYRU_BEIJING_DATE() };
  } catch {}
  try {
    const r = await call("/api/game3d/general_info/get_remaining_times", { requestId: rid() });
    if (r && r.errNo === 0 && r.data && r.data.remainingTimes != null) {
      out = out || { date: HYRU_BEIJING_DATE() };
      out.studio = r.data.remainingTimes;
    }
  } catch {}
  return out;
}

// Numbers checked on an earlier (Beijing) day are stale: the daily limit has been reset since then.
function effective(q) {
  if (!q) return null;
  if (q.date && q.date !== HYRU_BEIJING_DATE())
    return { remain: q.total ?? null, total: q.total ?? null, studio: q.studioMax ?? q.total ?? null, assumed: true };
  return q;
}
const mergeQuota = (old, q) => (q ? { ...q, studioMax: Math.max(q.studio ?? 0, (old && old.studioMax) || 0) || undefined } : old);

// API as a saved account without touching the browser's cookies: a session DNR rule puts the account's
// cookies on the extension's own requests (tabIds: [-1]), so open site tabs keep their login.
let asLock = Promise.resolve();
const withLock = (fn) => {
  const run = asLock.then(fn);
  asLock = run.catch(() => {});
  return run;
};
// A rule left behind by a worker that was stopped mid-request must not outlive it.
const dnrReady = chrome.declarativeNetRequest.updateSessionRules({ removeRuleIds: [1] }).catch(() => {});
asLock = dnrReady;
function apiAs(acc) {
  const cookie = (acc.cookies || []).filter(applies).map((c) => `${c.name}=${c.value}`).join("; ");
  return (path, body) => {
    return withLock(async () => {
      await chrome.declarativeNetRequest.updateSessionRules({
        removeRuleIds: [1],
        addRules: [{
          id: 1,
          priority: 1,
          action: {
            type: "modifyHeaders",
            // the API rejects POSTs with a chrome-extension:// Origin
            requestHeaders: [
              { header: "cookie", operation: "set", value: cookie || "x=1" },
              { header: "origin", operation: "set", value: ORIGIN },
              { header: "referer", operation: "set", value: SITE },
            ],
          },
          condition: { urlFilter: "|" + ORIGIN + "/api/", tabIds: [-1] },
        }],
      });
      try {
        const res = await fetch(ORIGIN + path, {
          method: body ? "POST" : "GET",
          credentials: "omit",
          headers: HEADERS,
          body: body ? JSON.stringify(body) : undefined,
        });
        return JSON.parse(await res.text());
      } finally {
        await chrome.declarativeNetRequest.updateSessionRules({ removeRuleIds: [1] });
      }
    });
  };
}

// All cookies the site gets, including partitioned ones (getAll({ url }) alone can return nothing).
const HOST = new URL(SITE).hostname;
const applies = (c) => {
  const d = c.domain.replace(/^\./, "");
  return d === HOST || HOST.endsWith("." + d);
};
async function getCookies() {
  const seen = new Map();
  const queries = [{ url: SITE }, { domain: "tencent.com" }, { url: SITE, partitionKey: {} }, { domain: "tencent.com", partitionKey: {} }];
  for (const q of queries) {
    let list = [];
    try {
      list = await chrome.cookies.getAll(q);
    } catch {}
    for (const c of list) {
      if (!applies(c)) continue;
      const key = [c.name, c.domain, c.path, c.storeId, JSON.stringify(c.partitionKey || null)].join("|");
      seen.set(key, c);
    }
  }
  return [...seen.values()];
}

async function cookieDiag() {
  const parts = [];
  for (const [label, q] of [["url", { url: SITE }], ["domain", { domain: "tencent.com" }], ["all-partitions", { url: SITE, partitionKey: {} }]]) {
    try {
      parts.push(`${label}=${(await chrome.cookies.getAll(q)).length}`);
    } catch (e) {
      parts.push(`${label}: ${(e && e.message) || e}`);
    }
  }
  const stores = await chrome.cookies.getAllCookieStores();
  parts.push(`stores=${stores.map((s) => s.id).join("/")}`);
  let all = [];
  try {
    all = await chrome.cookies.getAll({});
  } catch {}
  const related = all
    .filter((c) => /tencent|hunyuan|qq\.com/.test(c.domain))
    .map((c) => `${c.domain}${c.path}:${c.name}${c.partitionKey ? "(p)" : ""}`);
  parts.push(`total=${all.length}`);
  for (const pk of [{ topLevelSite: "https://tencent.com" }, { topLevelSite: "https://tencent.com", hasCrossSiteAncestor: false }]) {
    try {
      parts.push(`pk(${JSON.stringify(pk)})=${(await chrome.cookies.getAll({ partitionKey: pk })).length}`);
    } catch (e) {
      parts.push(`pk: ${(e && e.message) || e}`);
    }
  }
  try {
    const perm = await chrome.permissions.contains({ origins: ACCESS });
    parts.push(`hostPerm=${perm}`);
  } catch {}
  return parts.join(", ") + "; related: " + (related.join(", ") || "none");
}

async function clearCookies() {
  for (const c of await getCookies()) {
    const host = c.domain.replace(/^\./, "");
    await chrome.cookies.remove({
      url: `https://${host}${c.path}`,
      name: c.name,
      storeId: c.storeId,
      ...(c.partitionKey ? { partitionKey: c.partitionKey } : {}),
    });
  }
}

async function setCookies(list) {
  for (const c of list) {
    const host = c.domain.replace(/^\./, "");
    const d = {
      url: `https://${host}${c.path}`,
      name: c.name,
      value: c.value,
      path: c.path,
      secure: c.secure,
      httpOnly: c.httpOnly,
      sameSite: c.sameSite,
    };
    if (!c.hostOnly) d.domain = c.domain;
    if (!c.session && c.expirationDate) d.expirationDate = c.expirationDate;
    if (c.partitionKey) d.partitionKey = c.partitionKey;
    try {
      await chrome.cookies.set(d);
    } catch (e) {
      console.warn("cookie not restored", c.name, e);
    }
  }
}

const strip = (cs) =>
  cs.map(({ name, value, domain, path, secure, httpOnly, sameSite, hostOnly, session, expirationDate, partitionKey }) => ({
    name, value, domain, path, secure, httpOnly, sameSite, hostOnly, session, expirationDate, partitionKey,
  }));

function setQuota(acc, q) {
  if (!q) return;
  acc.quota = mergeQuota(acc.quota, q);
  acc.checkedAt = Date.now();
  acc.expired = false;
}

// The site refreshes its session cookies, so the active account's snapshot is re-taken before leaving it.
async function snapshotActive(state, me) {
  me = me || (await whoAmI());
  if (!me) return state;
  let acc = state.accounts.find((a) => me.userId && a.userId === me.userId);
  if (!acc) {
    // an unsaved login would be lost on switch — keep it
    acc = { id: crypto.randomUUID(), userId: me.userId, name: me.nickname || `Account ${state.accounts.length + 1}` };
    state.accounts.push(acc);
  }
  const cookies = strip(await getCookies());
  if (cookies.length) acc.cookies = cookies;
  setQuota(acc, await quota());
  state.activeId = acc.id;
  return state;
}

async function reloadSiteTabs(toLogin) {
  const tabs = await chrome.tabs.query({ url: ORIGIN + "/*" });
  if (!tabs.length) return chrome.tabs.create({ url: SITE });
  for (const t of tabs) {
    if (toLogin && t.active) await chrome.tabs.update(t.id, { url: SITE });
    else await chrome.tabs.reload(t.id);
  }
}

const getSettings = async () => ({ ...HYRU_DEFAULTS, ...((await chrome.storage.local.get("settings")).settings || {}) });
const publicAcc = ({ cookies, ...a }) => ({ ...a, eff: effective(a.quota) });

// ---------- badge: generations left today over all saved accounts ----------
async function updateBadge() {
  const [st, set] = await Promise.all([load(), getSettings()]);
  if (!set.accounts || !set.badge || !st.accounts.length) {
    await chrome.action.setBadgeText({ text: "" });
    await chrome.action.setTitle({ title: "Hunyuan 3D" });
    return;
  }
  let studio = 0, classic = 0, known = false;
  for (const a of st.accounts) {
    const q = effective(a.quota);
    if (!q || a.expired) continue;
    known = true;
    studio += q.studio || 0;
    classic += q.remain || 0;
  }
  await chrome.action.setBadgeText({ text: known ? String(studio) : "?" });
  await chrome.action.setBadgeBackgroundColor({ color: studio > 0 ? "#2f9e6e" : "#c9792b" });
  await chrome.action.setTitle({
    title: `Hunyuan 3D — generations left today (all accounts): Studio ${studio}, classic generator ${classic}`,
  });
}
chrome.storage.onChanged.addListener((ch, area) => {
  if (area === "local" && (ch.accounts || ch.settings)) updateBadge();
});

// ---------- daily reset: the counters are per Beijing day, i.e. they reset at 16:00 UTC ----------
function scheduleReset() {
  const now = Date.now();
  const d = new Date(now);
  let t = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 16, 2);
  if (t <= now) t += 24 * 3600e3;
  chrome.alarms.create("reset", { when: t, periodInMinutes: 24 * 60 });
}
chrome.runtime.onInstalled.addListener(() => (scheduleReset(), updateBadge()));
chrome.runtime.onStartup.addListener(() => (scheduleReset(), updateBadge()));

// Re-check every saved account in the background (no cookie swapping, open tabs are not touched).
async function checkAll(state) {
  for (const acc of state.accounts) {
    if (!acc.cookies || !acc.cookies.length) continue;
    const call = apiAs(acc);
    const who = await whoAmI(call);
    if (!who || (acc.userId && who.userId !== acc.userId)) {
      acc.expired = true;
      continue;
    }
    setQuota(acc, await quota(call));
  }
  return state;
}

chrome.alarms.onAlarm.addListener(async (a) => {
  if (a.name !== "reset") return;
  const set = await getSettings();
  if (!set.accounts) return;
  const state = await checkAll(await load());
  await store(state);
  if (!set.resetNotify) return;
  const ok = state.accounts.filter((x) => !x.expired && x.quota);
  const studio = ok.reduce((n, x) => n + (x.quota.studio || 0), 0);
  const classic = ok.reduce((n, x) => n + (x.quota.remain || 0), 0);
  if (!studio && !classic) return;
  chrome.notifications.create("reset", {
    type: "basic",
    iconUrl: chrome.runtime.getURL("icons/icon128.png"),
    title: set.uiLang === "ru" ? "Генерации Hunyuan 3D обновились" : "Hunyuan 3D generations are back",
    message:
      set.uiLang === "ru"
        ? `На ${ok.length} акк.: Studio — ${studio}, обычный генератор — ${classic}.`
        : `Across ${ok.length} account(s): Studio ${studio}, classic generator ${classic}.`,
  });
});
chrome.notifications.onClicked.addListener(() => chrome.tabs.create({ url: SITE }));

// ---------- model library ----------
const extOf = (url) => ((url.split("?")[0].match(/\.(\w+)$/) || [])[1] || "").toLowerCase();
const fileList = (pairs) =>
  pairs.filter(([, url]) => typeof url === "string" && /^https?:\/\//.test(url)).map(([label, url]) => ({ label, url, ext: extOf(url) }));

function studioFiles(item) {
  const files = [];
  let thumb = "";
  const walk = (o, depth) => {
    if (!o || typeof o !== "object" || depth > 6) return;
    for (const [k, v] of Object.entries(o)) {
      if (typeof v === "string" && /^https?:\/\//.test(v)) {
        const e = extOf(v);
        if (/^(png|jpe?g|webp)$/.test(e)) {
          if (!thumb && /image|preview|cover|render/i.test(k)) thumb = v;
        } else if (/^(glb|obj|fbx|stl|usdz|zip)$/.test(e) && !files.some((f) => f.ext === e)) files.push({ label: e.toUpperCase(), url: v, ext: e });
      } else if (typeof v === "object") walk(v, depth + 1);
    }
  };
  walk(item.modelInfo, 0);
  const order = ["glb", "fbx", "obj", "stl", "usdz", "zip"];
  files.sort((a, b) => order.indexOf(a.ext) - order.indexOf(b.ext));
  return { files, thumb: thumb || item.singleImage || "" };
}

async function libraryOf(call, accountName) {
  const out = [];
  // classic generator
  const PAGE = 20; // the API answers 400 above ~30
  for (let offset = 0; offset < 1000; offset += PAGE) {
    const l = await call("/api/3d/creations/list", { limit: PAGE, offset, sceneTypeList: [] });
    const list = (l && l.creations) || [];
    for (const c of list) {
      for (const r of c.result || []) {
        if (r.status !== "success" || !r.urlResult) continue;
        const u = r.urlResult;
        const files = fileList([
          ["GLB", u.glb || u.textureGlb],
          ["OBJ", u.obj || u.textureObj],
          ["GLB (no texture)", u.geometryGlb],
        ]);
        out.push({
          account: accountName,
          kind: "classic",
          id: r.assetId || r.taskId || c.id,
          createdAt: (c.createdAt || 0) * 1000,
          title: c.prompt || c.title || "",
          model: (c.modelType || c.sceneType || "").replace(/^multiView2Model/, "Multi-view → 3D ").replace(/^image2Model/, "Image → 3D ").replace(/^text2Model/, "Text → 3D "),
          thumb: r.urlResult.image_url || (c.imageList || [])[0] || "",
          files,
        });
      }
    }
    if (list.length < PAGE || offset + PAGE >= (l.totalCount || 0)) break;
  }
  // Studio
  try {
    const w = await call("/api/game3d/general_info/get_works_list", { worksPipeline: 0, worksIds: [], requestId: rid() });
    for (const it of (w && w.data && w.data.list) || []) {
      const { files, thumb } = studioFiles(it);
      if (!files.length) continue;
      const step = (it.reqPath || "").split("/").filter(Boolean).pop() || "studio";
      const STEPS = { low_poly_topology: "Low-poly", texture: "Texture", uv: "UV unwrap", segment: "Component split", rig: "Rigging" };
      out.push({
        account: accountName,
        kind: "studio",
        id: it.worksId,
        createdAt: Date.parse(it.createdAt) || 0,
        title: it.prompt || "",
        model: STEPS[step] || Object.entries(STEPS).find(([k]) => step.includes(k))?.[1] || step.replace(/_/g, " "),
        thumb,
        files,
      });
    }
  } catch {}
  return out;
}

const handlers = {
  async state() {
    const state = await load();
    const me = await whoAmI();
    let current = null;
    if (me) {
      current = { ...me, quota: await quota() };
      const acc = state.accounts.find((a) => me.userId && a.userId === me.userId);
      if (acc) {
        state.activeId = acc.id;
        setQuota(acc, current.quota);
        await store(state);
      }
    }
    const diag = me ? null : { ...lastDiag, cookies: await cookieDiag() };
    return { ...state, accounts: state.accounts.map(publicAcc), current, diag };
  },

  async save({ name }) {
    const me = await whoAmI();
    if (!me) throw new Error("Not logged in on 3d.hunyuan.tencent.com");
    const state = await load();
    let acc = state.accounts.find((a) => me.userId && a.userId === me.userId);
    if (!acc) {
      acc = { id: crypto.randomUUID(), userId: me.userId };
      state.accounts.push(acc);
    }
    const cookies = strip(await getCookies());
    if (!cookies.length) throw new Error("Can't read the site's cookies — " + (await cookieDiag()));
    acc.name = (name || "").trim() || acc.name || me.nickname || `Account ${state.accounts.length}`;
    acc.cookies = cookies;
    setQuota(acc, await quota());
    state.activeId = acc.id;
    await store(state);
  },

  async switch({ id }) {
    let state = await load();
    const target = state.accounts.find((a) => a.id === id);
    if (!target) throw new Error("Unknown account");
    if (!target.cookies || !target.cookies.length) throw new Error("This account has no saved login — log in to it and click Save current");
    state = await snapshotActive(state);
    await clearCookies();
    await setCookies(target.cookies || []);
    state.activeId = target.id;
    await store(state);
    await reloadSiteTabs(false);
  },

  // Save the current login (if it is a known account) and log out locally, so another account can sign in.
  async addNew() {
    const state = await snapshotActive(await load());
    state.activeId = null;
    await store(state);
    await clearCookies();
    await reloadSiteTabs(true);
  },

  async rename({ id, name }) {
    const state = await load();
    const acc = state.accounts.find((a) => a.id === id);
    if (acc && name.trim()) acc.name = name.trim();
    await store(state);
  },

  async remove({ id }) {
    const state = await load();
    state.accounts = state.accounts.filter((a) => a.id !== id);
    if (state.activeId === id) state.activeId = null;
    await store(state);
  },

  // Check remaining generations of every saved account (the current one through the site, others in the background).
  async refreshAll() {
    let state = await load();
    const me = await whoAmI();
    state = await snapshotActive(state, me);
    const others = { ...state, accounts: state.accounts.filter((a) => !me || a.userId !== me.userId) };
    await checkAll(others);
    await store(state);
  },

  // The page saw the site's own quota request (src/features.js)
  async quotaSeen({ userId, kind, remain, total }) {
    const state = await load();
    const acc = state.accounts.find((a) => userId && a.userId === String(userId));
    if (!acc || remain == null) return;
    const q = { ...(effective(acc.quota) && !effective(acc.quota).assumed ? acc.quota : {}), date: HYRU_BEIJING_DATE() };
    if (kind === "studio") q.studio = remain;
    else Object.assign(q, { remain, total });
    setQuota(acc, q);
    await store(state);
  },

  // Best other account that still has generations of this kind ("studio" | "classic")
  async nextAccount({ userId, kind }) {
    const set = await getSettings();
    if (!set.accounts) return null;
    const state = await load();
    const left = (a) => {
      const q = effective(a.quota);
      return q ? (kind === "studio" ? q.studio : q.remain) ?? 0 : 0;
    };
    const best = state.accounts
      .filter((a) => a.userId !== String(userId) && !a.expired && a.cookies && a.cookies.length && left(a) > 0)
      .sort((a, b) => left(b) - left(a))[0];
    return best ? { id: best.id, name: best.name, left: left(best) } : null;
  },

  // From the page banner (only after a real click, checked by src/bridge.js): switch to the best account
  async switchNext({ userId, kind }) {
    const n = await handlers.nextAccount({ userId, kind });
    if (!n) throw new Error("No other saved account has generations left");
    await handlers.switch({ id: n.id });
  },

  // All models of the current login and of every saved account
  async library() {
    const set = await getSettings();
    const state = await load();
    const me = await whoAmI();
    const items = [];
    const errors = [];
    if (me) {
      const acc = state.accounts.find((a) => a.userId === me.userId);
      items.push(...(await libraryOf(api, (acc && acc.name) || me.nickname || "current")));
    }
    if (set.accounts) {
      for (const acc of state.accounts) {
        if (me && acc.userId === me.userId) continue;
        if (!acc.cookies || !acc.cookies.length) continue;
        try {
          const call = apiAs(acc);
          if (!(await whoAmI(call))) {
            errors.push(`${acc.name}: login expired`);
            continue;
          }
          items.push(...(await libraryOf(call, acc.name)));
        } catch (e) {
          errors.push(`${acc.name}: ${(e && e.message) || e}`);
        }
      }
    }
    items.sort((a, b) => b.createdAt - a.createdAt);
    return { items, errors, loggedIn: !!me };
  },
};

chrome.runtime.onMessage.addListener((msg, _sender, reply) => {
  const h = handlers[msg && msg.type];
  if (!h) return false;
  h(msg)
    .then((r) => reply({ ok: true, result: r }))
    .catch((e) => reply({ ok: false, error: String((e && e.message) || e) }));
  return true;
});
