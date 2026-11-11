// Feature toggles shared by the popup, the background worker and the page scripts.
// Translation itself is always on; everything here can be switched off in the popup (Settings).
self.HYRU_DEFAULTS = {
  uiLang: "en", // "en" | "ru" — language of the site interface
  hints: true, // tooltips for 3D terms
  accounts: true, // account switcher in the toolbar popup
  badge: true, // generations left (all accounts) on the toolbar icon
  lowQuota: true, // offer to switch when the current account runs out of generations
  resetNotify: false, // notification when the daily generations are back
  promptTools: true, // prompt translation (RU → EN/ZH) and prompt templates next to the prompt box
  library: true, // all models from all accounts on one page, downloads with readable names
  report: true, // "Report untranslated text" button in the popup
};

// Generation limits are daily; the site reports the day as a Beijing date (quotainfo.date = "YYYYMMDD").
self.HYRU_BEIJING_DATE = (t = Date.now()) => new Date(t + 8 * 3600e3).toISOString().slice(0, 10).replace(/-/g, "");
