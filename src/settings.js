// Settings for the page scripts. The popup stores them in chrome.storage; src/bridge.js mirrors them
// into localStorage ("hyru_cfg") so they are available synchronously at document_start.
(() => {
  const cfg = { ...self.HYRU_DEFAULTS };
  try {
    Object.assign(cfg, JSON.parse(localStorage.getItem("hyru_cfg") || "{}"));
  } catch {}
  window.__HYRU_CFG = cfg;
  window.__HYRU_LANG = cfg.uiLang === "ru" ? "ru" : "en";

  // Live updates from the bridge (everything except the UI language, which needs a reload)
  window.addEventListener("message", (e) => {
    if (e.source !== window || !e.data || e.data.hyru !== "cfg") return;
    Object.assign(cfg, self.HYRU_DEFAULTS, e.data.cfg || {});
    window.dispatchEvent(new CustomEvent("hyru-cfg"));
  });

  // Requests to the extension's background worker through the bridge: __hyruCall("state").then(...)
  let seq = 0;
  const waiting = new Map();
  window.addEventListener("message", (e) => {
    if (e.source !== window || !e.data || e.data.hyru !== "res" || !waiting.has(e.data.id)) return;
    const { resolve, reject } = waiting.get(e.data.id);
    waiting.delete(e.data.id);
    const r = e.data.r;
    r && r.ok ? resolve(r.result) : reject(new Error((r && r.error) || "No response from the extension"));
  });
  window.__hyruCall = (type, data = {}) =>
    new Promise((resolve, reject) => {
      const id = "hyru" + ++seq;
      waiting.set(id, { resolve, reject });
      window.postMessage({ hyru: "req", id, type, data }, location.origin);
    });
})();
