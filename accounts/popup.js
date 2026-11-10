const $ = (s) => document.querySelector(s);
const msg = (text, err) => {
  $("#msg").textContent = text || "";
  $("#msg").className = err ? "err" : "";
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

const ago = (t) => {
  if (!t) return "";
  const m = Math.round((Date.now() - t) / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  return h < 24 ? `${h} h ago` : `${Math.round(h / 24)} d ago`;
};

function quotaEl(q) {
  const s = document.createElement("span");
  s.className = "quota";
  if (!q || q.remain == null) {
    s.classList.add("unknown");
    s.textContent = "—";
  } else {
    s.textContent = `${q.remain}/${q.total}`;
    if (q.remain < 1) s.classList.add("zero");
  }
  s.title = "Generations left today";
  return s;
}

async function render() {
  let st;
  try {
    st = await call("state");
  } catch (e) {
    msg(e.message, true);
    return;
  }
  const cur = $("#current");
  cur.textContent = "";
  if (st.current) {
    const known = st.accounts.some((a) => a.id === st.activeId);
    cur.append("Logged in: ");
    const b = document.createElement("b");
    b.textContent = st.current.nickname || st.current.userId || "unknown";
    cur.append(b, known ? "" : " (not saved)");
  } else {
    cur.textContent = "Not logged in (or the site is unreachable).";
    if (st.diag) {
      const d = document.createElement("details");
      const sm = document.createElement("summary");
      sm.textContent = "Details";
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
    sub.textContent = active ? "active" : a.expired ? "expired — log in again & save" : a.checkedAt ? `checked ${ago(a.checkedAt)}` : "";
    name.append(sub);

    const ren = document.createElement("button");
    ren.className = "icon";
    ren.textContent = "✎";
    ren.title = "Rename";
    ren.onclick = (e) => {
      e.stopPropagation();
      li.onclick = null;
      li.textContent = "";
      li.append(
        nameForm(a.name, "Account name", (n) => (n ? busy("", () => call("rename", { id: a.id, name: n })) : render()), render)
      );
    };
    const del = document.createElement("button");
    del.className = "icon";
    del.textContent = "✕";
    del.title = "Forget this account (does not log out on the site)";
    del.onclick = (e) => {
      e.stopPropagation();
      if (del.classList.contains("confirm")) return busy("", () => call("remove", { id: a.id }));
      del.classList.add("confirm");
      del.textContent = "Forget?";
      setTimeout(() => {
        del.classList.remove("confirm");
        del.textContent = "✕";
      }, 3000);
    };

    li.append(name, quotaEl(a.quota), ren, del);
    if (!active) {
      li.title = "Switch to this account";
      li.onclick = () => busy(`Switching to ${a.name}…`, () => call("switch", { id: a.id }));
    }
    list.append(li);
  }
  $("#empty").hidden = st.accounts.length > 0;
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
  no.textContent = "Cancel";
  f.onclick = (e) => e.stopPropagation();
  f.onsubmit = (e) => {
    e.preventDefault();
    onOk(input.value.trim());
  };
  no.onclick = onCancel;
  input.onkeydown = (e) => e.key === "Escape" && (e.preventDefault(), onCancel());
  f.append(input, ok, no);
  setTimeout(() => input.focus(), 0);
  return f;
}

$("#save").onclick = () => {
  const box = $("#ask");
  box.textContent = "";
  box.append(
    nameForm("", "Name (empty = nickname)", (n) => {
      box.textContent = "";
      busy("Saving…", () => call("save", { name: n }));
    }, () => (box.textContent = ""))
  );
};
$("#add").onclick = () =>
  busy("Signing out…", async () => {
    await call("addNew");
    return "Log in to another account on the site, then open this popup and click Save current.";
  });
$("#refresh").onclick = () => busy("Checking all accounts…", () => call("refreshAll"));

render();
