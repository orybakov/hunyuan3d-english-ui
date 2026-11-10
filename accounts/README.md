# Hunyuan 3D — Account Switcher (experimental)

A separate, optional Chrome extension: save several Hunyuan 3D logins and switch between them in one click.
Shows how many generations each account has left today.

## Install

`chrome://extensions` → Developer mode → **Load unpacked** → select this `accounts/` folder.
It works independently from the English UI extension; you can use both.

## Use

1. Log in on https://3d.hunyuan.tencent.com, open the extension popup, click **Save current**.
2. Click **+ Add another**: the current login is kept in the extension and you are signed out on the site.
   Log in to the next account and click **Save current** again.
3. Click an account in the list to switch to it — open site tabs reload already logged in.
4. **↻ Check all** checks the remaining generations of every saved account and then returns you to the current one.

Don't press **Sign Out** on the site for an account you want to keep: that ends the saved session on the server too.
If an account shows *session expired*, log in to it again and click **Save current**.

## How it works and security

The site keeps the login in cookies. A saved account is a copy of the cookies for `3d.hunyuan.tencent.com`
(including `.tencent.com` ones) in `chrome.storage.local`. Switching deletes the current cookies and restores the saved ones.
Quota comes from the site's own `/api/3d/getuserinfo` and `/api/3d/quotainfo`.

Saved cookies give access to your accounts. They stay on your computer in the browser profile and are
never sent anywhere except the Hunyuan site itself — but anyone with access to that browser profile can use them.

---

## Русский

Отдельное необязательное расширение: сохраняет несколько входов в Hunyuan 3D и переключает их в один клик,
показывает остаток генераций на сегодня у каждого аккаунта.

1. Войдите на сайте → откройте расширение → **Save current**.
2. **+ Add another** — текущий вход сохранится, на сайте вы выйдете. Войдите в следующий аккаунт → **Save current**.
3. Клик по аккаунту — переключение, вкладки сайта перезагрузятся уже под ним.
4. **↻ Check all** — проверить остаток генераций у всех аккаунтов.

Не нажимайте на сайте «Sign Out» у аккаунта, который хотите оставить: это завершит и сохранённую сессию.
Сохранённые cookie дают доступ к аккаунтам — хранятся только в вашем профиле браузера.
