// Hunyuan 3D Account Switcher: the site keeps the login in cookies, so an "account" is a cookie snapshot.
// Storage (chrome.storage.local): { accounts: [{ id, name, userId, cookies, quota, checkedAt }], activeId }

const ORIGIN = "https://3d.hunyuan.tencent.com";
const SITE = ORIGIN + "/";
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
  const res = await fetch(ORIGIN + path, {
    method: body ? "POST" : "GET",
    credentials: "include",
    headers: HEADERS,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  diag.steps.push(`bg: ${res.status} ${text.slice(0, 160)}`);
  return JSON.parse(text);
}

async function whoAmI() {
  try {
    const u = await api("/api/3d/getuserinfo");
    // getuserinfo answers with the user object at the top level; other endpoints wrap it in { data }
    const d = u && !u.error ? (u.data && typeof u.data === "object" ? u.data : u) : null;
    if (!d || !(d.userId ?? d.userid ?? d.uid)) return null;
    const id = d.userId ?? d.userid ?? d.uid ?? d.id;
    return {
      userId: id != null ? String(id) : null,
      nickname: d.nickname || d.nickName || d.userName || d.name || d.email || d.phoneNumber || "",
    };
  } catch (e) {
    if (lastDiag) lastDiag.steps.push(`error: ${(e && e.message) || e}`);
    return null;
  }
}

async function quota() {
  try {
    const q = await api("/api/3d/quotainfo", { sceneType: "3dCreations" });
    const d = q && !q.error ? (q.data && typeof q.data === "object" ? q.data : q) : null;
    if (!d || q.error) return null;
    return { remain: d.remainQuota, total: d.totalQuota };
  } catch {
    return null;
  }
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
    const perm = await chrome.permissions.contains({ origins: [SITE + "*"] });
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
  const q = await quota();
  if (q) Object.assign(acc, { quota: q, checkedAt: Date.now() });
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
        if (current.quota) Object.assign(acc, { quota: current.quota, checkedAt: Date.now() });
        await store(state);
      }
    }
    const diag = me ? null : { ...lastDiag, cookies: await cookieDiag() };
    return { ...state, accounts: state.accounts.map(({ cookies, ...a }) => a), current, diag };
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
    const q = await quota();
    if (q) Object.assign(acc, { quota: q, checkedAt: Date.now() });
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

  // Check remaining generations of every saved account by briefly swapping cookies, then restore the original login.
  async refreshAll() {
    let state = await load();
    const me = await whoAmI();
    state = await snapshotActive(state, me);
    const original = strip(await getCookies());
    try {
      for (const acc of state.accounts) {
        if (me && acc.userId === me.userId) continue;
        await clearCookies();
        await setCookies(acc.cookies || []);
        const who = await whoAmI();
        if (!who) {
          acc.quota = null;
          acc.expired = true;
          continue;
        }
        acc.expired = false;
        const q = await quota();
        if (q) Object.assign(acc, { quota: q, checkedAt: Date.now() });
        acc.cookies = strip(await getCookies());
      }
    } finally {
      await clearCookies();
      await setCookies(original);
      await store(state);
    }
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
