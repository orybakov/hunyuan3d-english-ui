# Hunyuan 3D in English — Chrome extension (English / Russian UI, tooltips, accounts)

**English** · [Русский](#русский) · [Website](https://orybakov.github.io/hunyuan3d-english-ui/) · [Download](../../releases/latest)

Free, unofficial Chrome extension for [Tencent Hunyuan 3D](https://3d.hunyuan.tencent.com) (`3d.hunyuan.tencent.com`, Tencent HY 3D).
The Chinese site has no language switch, and `?lang=en` doesn't work. This extension translates the **whole
interface into English**, Studio included, fixes Tencent's awkward wording and adds tooltips that explain 3D settings.
**Hunyuan 3D на английском, с подсказками на русском**: see [Русский](#русский).

![Hunyuan 3D: Chinese original vs English with the extension](docs/before-after.png)

![Tooltip demo](docs/hint.png)
<sub>Tooltip demo (test button on the login page): English and Russian. Inside the app, tooltips appear on real buttons and settings.</sub>

## Features

- **English everywhere.** The site already ships Tencent's own English translation (used on the international
  site), but never lets you pick it. The extension turns it on before the app starts, both on the main site and
  in the separate **Studio** app (`/studio/...`). No flashes of Chinese, nothing in the app's logic is changed.
- **Better English.** ~620 fixes over Tencent's translation: mistranslations (*"Degreasing treatment"* →
  *"Remove Baked Lighting"*, *"Bone Binding"* → *"Rigging & Skinning"*), Chinglish (*"Copy Success"* → *"Copied"*),
  consistent terminology and shorter button labels.
- **Leftovers translated too.** Hard-coded strings, login dialog, UI-kit texts and server messages go through
  a ~1,900-entry dictionary; anything else is translated by Chrome's built-in **on-device** Translator
  (nothing is sent to third-party servers) and cached.
- **Tooltips for 3D terms** — face count, retopology, quads vs triangles, baked normals, UV, PBR, rigging,
  motion, component split, seed, export formats, etc.: what it is and what to choose.
  Terms with a tooltip have a dotted underline. Tooltips are in **English or Russian**, picked from your browser
  language. **Alt+H** — show/hide tooltips, **Alt+L** — switch tooltip language.
- **Neater look, same design.** Inter font for Latin/Cyrillic (the site expects *PingFang SC*, missing on
  Windows/Linux), no words broken mid-line, thin dark scrollbars, full text on hover for truncated labels.
- **Russian interface** (optional): the whole site in Russian, on top of the polished English.
- **Account switcher.** Have several accounts for more free generations? Save them once and switch in one
  click from the toolbar button; each account shows how many generations it has left today. See [Accounts](#accounts).
  - **Counter on the icon**: Studio generations left today across all saved accounts.
  - **"Out of generations" banner**: when the site reports 0 left, it offers the account that still has some.
  - **Notification** once a day when the limit resets (off by default).
- **Prompt tools**: **RU → EN** / **RU → 中文** buttons above the prompt box (Chrome's on-device translator)
  and prompt **templates** (a few presets + your own).
- **Model library**: every model from every saved account (classic generator and Studio) on one page;
  download one or many at once with readable names: `Downloads/Hunyuan3D/<account>/2026-11-10_17-50_Low-poly_c5b252.fbx`.
- **Report untranslated text** from the popup: opens a GitHub issue with the strings still in Chinese.
- **Everything except the translation can be switched off**: popup → ⚙ Settings.
- Text you type (prompts, inputs) is never touched unless you press a prompt-tool button.

## Install

1. Download the repo: **Code → Download ZIP** (or the zip from [Releases](../../releases)) and unpack it.
2. Open `chrome://extensions`, enable **Developer mode** (top right).
3. Click **Load unpacked** and select the unpacked folder (the one with `manifest.json`).
4. Open or reload https://3d.hunyuan.tencent.com.

Works in Chrome and other Chromium browsers (Edge, Brave, Yandex Browser). The fallback machine translator
needs Chrome's Translator API (Chrome 138+); it downloads a language model after your first click on the page.
Without it, everything else still works.

## Settings

Click the extension's toolbar button (pin it via the puzzle icon) → **⚙**. There you choose the site language
(English / Русский) and switch features on or off: tooltips, account switcher (and its counter, banner, notification),
prompt tools, model library, the report button. Changing the language reloads open site tabs.

## Accounts

In the toolbar popup:

1. Log in on the site and click **Save current** (give it a name, or leave empty).
2. Click **+ Add another**: the current login is kept and you're signed out on the site. Log in to the next account and **Save current** again.
3. Click any account in the list to switch to it, or **→ Switch to the next account with generations**. Open site tabs reload already logged in.
4. **↻ Check all** checks the remaining generations of every account in the background, without logging you out.

Numbers are *Studio · classic generator* (they have separate daily limits). A `~` means "checked on an earlier day,
the limit has probably reset since". Limits reset at midnight Beijing time (16:00 UTC).

Don't press **Sign Out** on the site for an account you want to keep: that ends the saved session on the server.
If an account shows *expired*, log in to it again and click **Save current**.

**Security:** a saved account is a copy of the site's login cookies, stored only in `chrome.storage.local` of your
browser profile and never sent anywhere except to Tencent's own site. Anyone with access to your browser profile
could use them. That's also why the account switcher asks for access to cookies of `*.tencent.com` the first time
you use it (the login cookies are set without the `Secure` flag, so it needs both `http://` and `https://` access).
If you switch the account switcher off, the extension only needs `3d.hunyuan.tencent.com`.

Other permissions: `downloads` (model library), `alarms` + `notifications` (daily reset), `declarativeNetRequestWithHostAccess`
(checks other saved accounts by attaching their cookies only to the extension's own requests to the site's API).

## Troubleshooting

Open DevTools (F12) → Console (context **top**):

- `__hyru.stats()` — status. `bundlePatched: true` means the built-in English is active
  (`forcedLng: "en"` in Studio). `mtState: "ready"` means the on-device translator works.
- `__hyru.missing()` — Chinese strings that are not in the dictionary. Please paste them into an issue.

## How it works

| File | What it does |
|---|---|
| `src/i18n-hook.js` | Main app: intercepts `JSON.parse` of the i18n bundles and copies English values into the Chinese bundle. Studio: forces `lng: "en"` in `i18next.init` via a short-lived `defaultNS` getter. Applies `overrides.js`. |
| `src/dom-translate.js` | MutationObserver-based translation of remaining text and attributes: dictionary → `{{placeholder}}` patterns → Chrome Translator API with a localStorage cache. |
| `src/background.js`, `popup/` | Account switcher (cookie snapshots), quotas (`/api/3d/quotainfo`, Studio `get_remaining_times`), badge, daily alarm, library data; popup with settings. |
| `src/defaults.js`, `src/settings.js`, `src/bridge.js` | Feature toggles: stored in `chrome.storage`, mirrored to the page via localStorage; message bridge page ↔ background. |
| `src/features.js` | Page helpers: prompt tools, "out of generations" banner, watching the site's own quota answers. |
| `src/i18n-ru.js` | Russian UI strings (generated from `tools/i18n_ru.json`). |
| `library/` | Model library page (all accounts, downloads with readable names). |
| `src/hints.js`, `src/theme.css` | Tooltips (texts in `tools/hints_en.json`, `tools/hints_ru.json`), Alt+H / Alt+L, titles for truncated labels; font and small style fixes. |
| `tools/build_dict.py` | Rebuilds `src/dict.js`, `src/overrides.js`, `src/i18n-ru.js`, `src/hints-data.js` from the live site plus `tools/*.json`. A weekly GitHub Action runs it and opens a PR when the site changes. |
| `tools/smoke.mjs` | Headless Chrome smoke test via CDP, injects scripts the same way the extension does. |

After the site updates: `python3 tools/build_dict.py` (needs Python 3 and Node 18+), then reload the extension.
Want tooltips in another language? Add `tools/hints_<lang>.json` with the same keys and the language to `build_dict.py` / `hints.js` — PRs welcome.
Edit wording in `tools/overrides_en.json` (by i18n key) or `tools/manual_zh_en.json` (by Chinese text); Russian — in `tools/i18n_ru.json`.

## Known limitations

- Pages behind login were tested by a real user, not by the automated smoke test (the site requires a Chinese-ecosystem login).
- The Russian UI is a machine-assisted translation with a 3D glossary; some labels may be long or clumsy — reports welcome.
- Prompt translation needs Chrome 138+ with the on-device Translator; the language model downloads on first use.
- Text baked into images (banners, the login illustration) cannot be translated.
- The international site `3d.hunyuanglobal.com` is not supported: it has native English, but blocked us from
  both Russian and EU hosting IPs.

## Disclaimer & license

Not affiliated with or endorsed by Tencent. "Hunyuan" and "Tencent" are trademarks of their owners.
Code: [MIT](LICENSE). Font: [Inter](https://rsms.me/inter/), SIL Open Font License 1.1 (`fonts/LICENSE.txt`).

---

## Русский

**Hunyuan 3D на английском, с подсказками на русском.** Бесплатное неофициальное расширение Chrome для [Tencent Hunyuan 3D](https://3d.hunyuan.tencent.com).
Китайский сайт — тот, что реально открывается из России, но интерфейс у него только на китайском.
Расширение переводит его на английский или русский, исправляет кривые формулировки, добавляет подсказки к 3D-терминам, переключатель аккаунтов, перевод промптов и библиотеку моделей.

### Что умеет

- **Английский везде** — включает родной английский перевод Tencent (на основном сайте и в Studio `/studio/...`) до загрузки приложения, без мелькания китайского.
- **Нормальный английский** — около 620 исправлений: ошибки перевода, «Chinglish», единые термины, короткие кнопки.
- **Остатки** — словарь на ~1900 строк, а что не нашлось — встроенный в Chrome офлайн-переводчик (ничего не уходит на сторонние серверы).
- **Подсказки на русском и английском** к ~70 терминам: полигоны, ретопология, quads/triangles, запекание нормалей, UV, PBR, риг, анимация, разделение на части, seed, форматы экспорта — что это и что выбирать. Язык берётся из языка браузера. Термины с подсказкой подчёркнуты пунктиром. **Alt+H** — вкл/выкл, **Alt+L** — сменить язык подсказок.
- **Аккуратнее, дизайн тот же** — шрифт Inter, слова не рвутся посередине, тонкие скроллбары, полный текст у обрезанных надписей.
- **Русский интерфейс** (по желанию) — весь сайт по-русски, поверх исправленного английского.
- **Переключатель аккаунтов** — если у вас несколько аккаунтов ради бесплатных генераций: сохраните их один раз и переключайтесь в один клик кнопкой расширения на панели. У каждого виден остаток генераций на сегодня.
  - **Счётчик на значке** — сколько генераций Studio осталось на всех аккаунтах.
  - **Плашка «генерации кончились»** — предлагает аккаунт, где они ещё есть.
  - **Уведомление** раз в день, когда лимит обновился (по умолчанию выключено).
- **Промпты**: кнопки **RU → EN** / **RU → 中文** над полем промпта (офлайн-переводчик Chrome) и **шаблоны** промптов.
- **Библиотека моделей** — все модели со всех аккаунтов (обычный генератор и Studio) на одной странице, скачивание по одной или пачкой с понятными именами.
- **Сообщить о непереведённом** — кнопка в окне расширения открывает заявку на GitHub со строками, оставшимися на китайском.
- **Всё, кроме перевода, отключается**: окно расширения → ⚙.
- Поля ввода (промпты) не трогает, пока вы сами не нажмёте кнопку перевода или шаблона.

### Установка

1. **Code → Download ZIP** (или zip из [Releases](../../releases)), распаковать.
2. `chrome://extensions` → включить **Режим разработчика**.
3. **Загрузить распакованное расширение** → выбрать папку с `manifest.json`.
4. Открыть или обновить https://3d.hunyuan.tencent.com.

Подходит для Chrome, Edge, Brave, Яндекс Браузера. Офлайн-переводчику нужен Chrome 138+, модель он скачает после первого клика по странице; без него остальное работает.

### Аккаунты

Кнопка расширения на панели (закрепите через значок пазла). Язык сайта и включение функций — там же, ⚙.

1. Войдите на сайте → **Сохранить текущий** (имя можно не вводить).
2. **+ Добавить ещё** — текущий вход сохранится, на сайте вы выйдете. Войдите в следующий аккаунт → **Сохранить текущий**.
3. Клик по аккаунту или **→ Следующий аккаунт с генерациями** — переключение, вкладки сайта перезагрузятся уже под ним.
4. **↻ Проверить все** — остаток генераций у всех, в фоне, без выхода из текущего.

Цифры — *Studio · обычный генератор* (у них разные дневные лимиты). `~` — проверено в прошлый день, лимит, скорее всего, уже обновился. Лимиты сбрасываются в полночь по Пекину (19:00 МСК).

Не нажимайте на сайте «Sign Out» у аккаунта, который хотите оставить. Сохранённые входы — это копии cookie сайта, они хранятся только в вашем профиле браузера. Поэтому переключатель при первом использовании и просит доступ к cookie `*.tencent.com`; если его выключить, расширению хватает `3d.hunyuan.tencent.com`.

### Если что-то не переведено

Окно расширения → **Сообщить о непереведённом**, или F12 → Console (контекст **top**): `__hyru.stats()` — состояние, `__hyru.missing()` — строки, которых нет в словаре.

### Ограничения

- Не связано с Tencent. Картинки с китайским текстом не переводятся.
- Международная версия `3d.hunyuanglobal.com` не поддерживается — она блокирует российские IP и IP хостингов/VPN.
