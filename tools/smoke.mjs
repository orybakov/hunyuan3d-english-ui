// Смоук-тест без установки расширения: Chrome headless + CDP, скрипты внедряются
// так же, как content script world=MAIN run_at=document_start.
// node tools/smoke.mjs [url] [--off]
import { spawn } from "node:child_process";
import { readFileSync, writeFileSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const url = process.argv[2] && !process.argv[2].startsWith("--") ? process.argv[2] : "https://3d.hunyuan.tencent.com/";
const off = process.argv.includes("--off");
const manifest = JSON.parse(readFileSync(join(root, "manifest.json"), "utf8"));
const code = manifest.content_scripts[0].js.map((f) => readFileSync(join(root, f), "utf8")).join("\n;\n");

const port = 9333;
const chrome = spawn("google-chrome-stable", [
  "--headless=new", `--remote-debugging-port=${port}`, `--user-data-dir=${mkdtempSync(join(tmpdir(), "hyru-"))}`,
  "--no-first-run", "--window-size=1600,1000", "--lang=en-US", "about:blank",
], { stdio: "ignore" });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
try {
  let targets;
  for (let i = 0; i < 50; i++) {
    try { targets = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); break; } catch { await sleep(200); }
  }
  const page = targets.find((t) => t.type === "page");
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((r) => ws.addEventListener("open", r, { once: true }));
  let id = 0; const wait = new Map();
  ws.addEventListener("message", (e) => { const m = JSON.parse(e.data); if (m.id && wait.has(m.id)) { wait.get(m.id)(m); wait.delete(m.id); } });
  const send = (method, params = {}) => new Promise((r) => { const i = ++id; wait.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
  await send("Page.enable");
  if (!off) await send("Page.addScriptToEvaluateOnNewDocument", { source: code });
  await send("Page.navigate", { url });
  await sleep(15000);
  const ev = async (expr) => (await send("Runtime.evaluate", { expression: expr, returnByValue: true })).result.result.value;
  const click = process.argv.find((a) => a.startsWith("--click="));
  if (click) {
    // клик по элементу с заданным текстом (после перевода), например --click="Start Using"
    const label = click.slice(8);
    await ev(`[...document.querySelectorAll("button,a,div,span")].reverse().find(e=>e.innerText&&e.innerText.trim()===${JSON.stringify(label)})?.click()`);
    await sleep(5000);
  }
  const stats = await ev("window.__hyru ? JSON.stringify(window.__hyru.stats()) : 'no ext'");
  const text = await ev("document.body.innerText");
  const cjk = (text.match(/[\u4e00-\u9fff]+/g) || []);
  const shot = await send("Page.captureScreenshot", { format: "png" });
  const out = join("/tmp/opencode", `hyru-smoke${off ? "-off" : ""}.png`);
  writeFileSync(out, Buffer.from(shot.result.data, "base64"));
  console.log("stats:", stats);
  console.log("title:", await ev("document.title"));
  console.log("CJK fragments left:", cjk.length, JSON.stringify([...new Set(cjk)].slice(0, 40)));
  console.log("missing:", await ev("window.__hyru ? JSON.stringify(window.__hyru.missing().slice(0,40)) : ''"));
  console.log("text sample:", text.slice(0, 600).replace(/\n+/g, " | "));
  console.log("screenshot:", out);
  ws.close();
} finally {
  chrome.kill();
}
