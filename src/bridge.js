// Isolated-world helper: the page scripts (MAIN world) have no chrome.* APIs.
// 1) mirrors settings from chrome.storage into localStorage for src/settings.js;
// 2) relays a few requests from the page scripts to the background worker.
(() => {
  const KEY = "hyru_cfg";
  const ALLOWED = new Set(["quotaSeen", "nextAccount", "switchNext"]);
  // The page can post any message, but it can't fake a trusted click: switching needs a real click on our banner.
  let clickedAt = 0;
  document.addEventListener("click", (e) => {
    if (e.isTrusted && e.target instanceof Element && e.target.closest("#hyru-banner button")) clickedAt = Date.now();
  }, true);
  // Read once at startup by the page scripts: a change reloads the tab.
  const lang = (json) => {
    try {
      const c = JSON.parse(json || "{}");
      return (c.uiLang || "en") + "|" + (c.hints !== false);
    } catch {
      return "en|true";
    }
  };

  function apply(settings) {
    const next = JSON.stringify(settings || {});
    const prev = localStorage.getItem(KEY) || "{}";
    if (next === prev) return;
    localStorage.setItem(KEY, next);
    // The UI language is applied while the site starts up, so a change needs a reload.
    if (lang(next) !== lang(prev)) {
      if (window === window.top) location.reload();
      return;
    }
    window.postMessage({ hyru: "cfg", cfg: settings || {} }, location.origin);
  }

  chrome.storage.local.get("settings").then(({ settings }) => apply(settings));
  chrome.storage.onChanged.addListener((ch, area) => {
    if (area === "local" && ch.settings) apply(ch.settings.newValue);
  });

  window.addEventListener("message", async (e) => {
    if (e.source !== window || !e.data || e.data.hyru !== "req") return;
    const { id, type, data } = e.data;
    let r;
    if (!ALLOWED.has(type)) r = { ok: false, error: "Not allowed: " + type };
    else if (type === "switchNext" && Date.now() - clickedAt > 3000) r = { ok: false, error: "Needs a click" };
    else {
      try {
        r = await chrome.runtime.sendMessage({ ...(data || {}), type });
        if (type === "nextAccount" && r && r.ok && r.result) r = { ok: true, result: { name: r.result.name, left: r.result.left } };
      } catch (err) {
        r = { ok: false, error: String((err && err.message) || err) };
      }
    }
    window.postMessage({ hyru: "res", id, r }, location.origin);
  });
})();
