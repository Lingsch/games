/* Rod's Games: save sync.
   Keeps each game's save in a private gist on the player's own GitHub account, so the same
   save follows them between devices. One key (a GitHub token with only the "gist" permission)
   is pasted once per device; after that nothing needs doing.

   How it decides:
   - Every stored save carries a revision id (new on every upload). Each device remembers the one it last matched.
   - Stored id unchanged + this device changed  -> upload.
   - Stored id different + this device unchanged -> download (and reload if the game is running).
   - Both changed                                     -> the more recently played one wins.
   - First time a device joins and both sides hold different saves -> ask the player once.
   Before a download replaces a local save, the local one is kept in a one-slot backup.

   A game uses it like this, before it reads its save:
     await RodSync.start({ game: "mmo", keys: ["ossuary-mmo-1"] });   // localStorage keys
     ...load the game...
     RodSync.arm();                                                    // after the game's own listeners exist
   A game that keeps its save elsewhere passes adapter: { read, write, stamp } instead of keys. */
(function () {
  "use strict";
  if (window.RodSync) return;

  var API = "https://api.github.com";
  var TOKEN_KEY = "rg_sync_key";
  var PREFIX = "Rod's Games save: ";
  var FILE = "save.json";
  var KEY_URL = "https://github.com/settings/tokens/new?scopes=gist&description=" + encodeURIComponent("Rod's Games saves");

  var LS = {
    get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { localStorage.setItem(k, v); return true; } catch (e) { return false; } },
    del: function (k) { try { localStorage.removeItem(k); } catch (e) { } }
  };
  function token() { return (LS.get(TOKEN_KEY) || "").trim(); }
  function hash(s) { var h = 2166136261; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0).toString(36) + "." + s.length; }
  function deviceName() {
    var u = navigator.userAgent || "";
    if (/iPhone/.test(u)) return "iPhone";
    if (/iPad/.test(u) || (/Macintosh/.test(u) && navigator.maxTouchPoints > 1)) return "iPad";
    if (/Android/.test(u)) return "Android";
    if (/Windows/.test(u)) return "PC";
    if (/Macintosh/.test(u)) return "Mac";
    return "computer";
  }

  /* ---------- GitHub */
  async function gh(path, opt) {
    opt = opt || {};
    var headers = { "Authorization": "Bearer " + (opt.token || token()), "Accept": "application/vnd.github+json" };
    if (opt.body) headers["Content-Type"] = "application/json";
    var r;
    try { r = await fetch(API + path, { method: opt.method || "GET", headers: headers, body: opt.body, cache: "no-store", keepalive: !!opt.keepalive }); }
    catch (e) { var ne = new Error("offline"); ne.code = "offline"; throw ne; }
    if (r.status === 401) { var ke = new Error("key"); ke.code = "key"; throw ke; }
    if (!r.ok) { var he = new Error("GitHub said " + r.status); he.code = r.status; throw he; }
    if (opt.raw) return r;
    return r.json();
  }

  /* ---------- packing: big saves are gzipped so they stay well inside GitHub's limits */
  function b64(bytes) { var s = "", n = 0x8000; for (var i = 0; i < bytes.length; i += n) s += String.fromCharCode.apply(null, bytes.subarray(i, i + n)); return btoa(s); }
  function unb64(str) { var s = atob(str), out = new Uint8Array(s.length); for (var i = 0; i < s.length; i++) out[i] = s.charCodeAt(i); return out; }
  async function gzip(str) { return b64(new Uint8Array(await new Response(new Blob([str]).stream().pipeThrough(new CompressionStream("gzip"))).arrayBuffer())); }
  async function gunzip(str) { return await new Response(new Blob([unb64(str)]).stream().pipeThrough(new DecompressionStream("gzip"))).text(); }
  async function packDoc(rev, at, dataStr) {
    var head = '{"v":1,"rev":' + JSON.stringify(rev) + ',"at":' + at + ',"device":' + JSON.stringify(deviceName());
    if (dataStr.length > 150000 && typeof CompressionStream !== "undefined") return head + ',"gz":' + JSON.stringify(await gzip(dataStr)) + "}";
    return head + ',"data":' + dataStr + "}";
  }
  async function unpackDoc(text) {
    var d = JSON.parse(text);
    if (d.gz) { d.dataStr = await gunzip(d.gz); delete d.gz; }
    else d.dataStr = JSON.stringify(d.data === undefined ? {} : d.data);
    delete d.data;
    return d;
  }

  /* ---------- where a game's save lives */
  function lsAdapter(keys) {
    return {
      read: async function () { var o = {}; keys.forEach(function (k) { o[k] = LS.get(k); }); return o; },
      write: async function (o) { keys.forEach(function (k) { if (o[k] == null) LS.del(k); else LS.set(k, o[k]); }); },
      empty: function (o) { return keys.every(function (k) { return o[k] == null; }); }
    };
  }

  var G = null, adapter = null, booted = false, armed = false, busy = false, timer = null;
  var lastSeen = null, lastStamp = null, lastSync = 0, lastRemoteCheck = 0, cachedStr = null, problem = null;

  function stKey() { return "rg_sync_state_" + G.game; }
  function state() { try { return JSON.parse(LS.get(stKey())) || {}; } catch (e) { return {}; } }
  function setState(s) { LS.set(stKey(), JSON.stringify(s)); }
  function gistKey(game) { return "rg_sync_gist_" + game; }

  async function readLocal(force) {
    if (!force && adapter.stamp && cachedStr !== null && adapter.stamp() === lastStamp) return cachedStr;
    if (adapter.stamp) lastStamp = adapter.stamp();
    var o = await adapter.read();
    cachedStr = JSON.stringify(o);
    return cachedStr;
  }
  function isEmpty(str) { var o = JSON.parse(str); return adapter.empty ? adapter.empty(o) : Object.keys(o).length === 0; }

  async function findGist(game, tok) {
    var id = LS.get(gistKey(game)); if (id) return id;
    for (var page = 1; page <= 5; page++) {
      var list = await gh("/gists?per_page=100&page=" + page, { token: tok });
      for (var i = 0; i < list.length; i++) if (list[i].description === PREFIX + game && list[i].files && list[i].files[FILE]) { LS.set(gistKey(game), list[i].id); return list[i].id; }
      if (list.length < 100) break;
    }
    return null;
  }
  async function fetchDoc(id) {
    var g;
    try { g = await gh("/gists/" + id); }
    catch (e) { if (e.code === 404) { LS.del(gistKey(G.game)); return null; } throw e; }
    var f = g.files && g.files[FILE]; if (!f) return null;
    var text = f.content;
    if (f.truncated) { var r = await fetch(f.raw_url, { cache: "no-store" }); if (!r.ok) throw new Error("couldn't read the stored save"); text = await r.text(); }
    return await unpackDoc(text);
  }
  function newRev() { return Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8); }
  async function push(id, str, keepalive) {
    var st = state(), at = st.at || Date.now(), rev = newRev();
    var content = await packDoc(rev, at, str);
    var body = JSON.stringify({ files: (function () { var f = {}; f[FILE] = { content: content }; return f; })() });
    if (id) await gh("/gists/" + id, { method: "PATCH", body: body, keepalive: keepalive && body.length < 60000 });
    else {
      var made = await gh("/gists", { method: "POST", body: JSON.stringify({ description: PREFIX + G.game, "public": false, files: JSON.parse(body).files }) });
      LS.set(gistKey(G.game), made.id);
    }
    setState({ rev: rev, hash: hash(str), at: at, when: Date.now() });
    lastSeen = hash(str);
  }
  async function apply(remote) {
    var cur = await readLocal(true);
    if (!isEmpty(cur) && cur.length < 1500000) LS.set("rg_sync_backup_" + G.game, cur);
    await adapter.write(JSON.parse(remote.dataStr));
    cachedStr = null;
    var h = hash(remote.dataStr);
    setState({ rev: remote.rev, hash: h, at: remote.at || 0, when: Date.now() });
    lastSeen = h;
    if (booted) { toast("Newer save found from your " + (remote.device || "other device") + ". Loading it…"); setTimeout(function () { location.reload(); }, 900); }
    else toast("Loaded your save from your " + (remote.device || "other device"));
  }

  async function syncOnce(opt) {
    opt = opt || {};
    if (busy || !G || !token()) return;
    busy = true;
    try {
      var st = state(), str = await readLocal(), lh = hash(str), dirty = lh !== st.hash, empty = isEmpty(str);
      if (lastSeen !== null && lh !== lastSeen) { st.at = Date.now(); setState(st); }
      lastSeen = lh;
      var id = await findGist(G.game);
      var remote = id ? await fetchDoc(id) : null;
      if (!remote) id = LS.get(gistKey(G.game));
      lastRemoteCheck = Date.now();
      if (!remote) { if (!empty) await push(id, str, opt.keepalive); }
      else if (remote.rev === st.rev) { if (dirty) await push(id, str, opt.keepalive); }
      else if (hash(remote.dataStr) === lh) setState({ rev: remote.rev, hash: lh, at: remote.at || st.at || 0, when: Date.now() });
      else if (!dirty || empty) await apply(remote);
      else if (st.rev == null) {
        var pick = await choose(remote);
        if (pick === "remote") await apply(remote); else { st.at = Date.now(); setState(st); await push(id, str); }
      }
      else if ((st.at || 0) >= (remote.at || 0)) await push(id, str, opt.keepalive);
      else await apply(remote);
      lastSync = Date.now(); problem = null;
    } catch (e) {
      problem = e.code === "key" ? "key" : e.code === "offline" ? "offline" : (e.message || "error");
      if (e.code === "key" && !opt.quiet) toast("Save sync: GitHub no longer accepts the key. Set it up again from the Games page.", 6000);
      else if (e.code !== "offline") console.warn("[sync]", e);
    } finally { busy = false; }
  }

  /* Leaving the page: send what we have without first asking what's stored (there may be no time). */
  async function flush() {
    if (!G || !token() || busy) return;
    try {
      var st = state(), str = await readLocal(true), lh = hash(str);
      if (lh === st.hash || isEmpty(str) || st.rev == null) return;
      var id = LS.get(gistKey(G.game)); if (!id) return;
      st.at = Date.now(); setState(st);
      busy = true;
      await push(id, str, true);
    } catch (e) { } finally { busy = false; }
  }

  function tick() {
    if (document.hidden || !token()) return;
    readLocal().then(function (str) {
      var lh = hash(str), now = Date.now();
      if (lastSeen !== null && lh !== lastSeen) { var st = state(); st.at = now; setState(st); }
      lastSeen = lh;
      var dirty = lh !== state().hash;
      if ((dirty && now - lastSync > 20000) || now - lastRemoteCheck > 60000) syncOnce({ quiet: true });
    }).catch(function () { });
  }

  function withTimeout(p, ms) { return Promise.race([p, new Promise(function (ok) { setTimeout(ok, ms); })]); }

  async function start(cfg) {
    G = cfg; adapter = cfg.adapter || lsAdapter(cfg.keys || []);
    if (!token()) { offHint(); return; }
    try { lastSeen = hash(await readLocal(true)); } catch (e) { }
    await withTimeout(syncOnce({ boot: true }), cfg.wait || 6000);
    booted = true;
    if (!timer) timer = setInterval(tick, 10000);
  }
  function arm() {
    booted = true;
    if (armed) return; armed = true;
    // The art layer (lighting, effects, interface skin; see artkit/) loads from each game's own index.html.
    // If a rebuilt index.html has lost that line, load it from here so the art does not quietly vanish.
    try { if ((G.game === "mmo" || G.game === "stars") && !window.__ART) setTimeout(function () { if (window.__ART) return; var s = document.createElement("script"); s.type = "module"; s.src = "art/art.js"; document.head.appendChild(s); }, 3000); } catch (e) { }
    document.addEventListener("visibilitychange", function () { if (document.hidden) flush(); else syncOnce({ quiet: true }); });
    addEventListener("pagehide", flush);
  }

  /* ---------- the key */
  async function checkKey(tok) {
    var r = await gh("/gists?per_page=1", { token: tok, raw: true });
    var scopes = r.headers.get("x-oauth-scopes");
    if (scopes !== null && scopes.split(",").map(function (s) { return s.trim(); }).indexOf("gist") < 0) { var e = new Error("scope"); e.code = "scope"; throw e; }
    return true;
  }
  async function setKey(tok) {
    tok = (tok || "").trim();
    await checkKey(tok);
    LS.set(TOKEN_KEY, tok); LS.del("rg_sync_hint_off");
    return true;
  }
  function clearKey() { LS.del(TOKEN_KEY); }
  function info(game) {
    var st = {}; try { st = JSON.parse(LS.get("rg_sync_state_" + game)) || {}; } catch (e) { }
    return { on: !!token(), linked: st.rev != null, when: st.when || 0 };
  }

  /* ---------- small bits of interface (self-contained, so any game can show them) */
  var css = false;
  function style() {
    if (css) return; css = true;
    var s = document.createElement("style");
    s.textContent =
      ".rgs-toast{position:fixed;left:50%;top:calc(env(safe-area-inset-top,0px) + 10px);transform:translateX(-50%);z-index:2147483000;background:#14121be6;color:#ece6d8;border:1px solid #3a3546;border-radius:999px;padding:7px 14px;font:500 14px/1.3 system-ui,sans-serif;max-width:88vw;text-align:center;pointer-events:none;opacity:0;transition:opacity .25s}" +
      ".rgs-toast.on{opacity:1}" +
      ".rgs-hint{position:fixed;left:50%;bottom:calc(env(safe-area-inset-bottom,0px) + 10px);transform:translateX(-50%);z-index:2147483000;display:flex;gap:2px;align-items:center;background:#14121bf2;color:#cfc8ba;border:1px solid #3a3546;border-radius:999px;font:500 14px/1.2 system-ui,sans-serif;white-space:nowrap;opacity:0;transition:opacity .3s}" +
      ".rgs-hint.on{opacity:1}.rgs-hint button{all:unset;cursor:pointer;padding:9px 12px;color:#e2ba6e;font-weight:700}.rgs-hint span{padding:9px 0 9px 14px}.rgs-hint button.x{color:#a39c8e;padding:9px 12px 9px 6px}" +
      ".rgs-veil{position:fixed;inset:0;z-index:2147483001;background:#000b;display:flex;align-items:center;justify-content:center;padding:18px;font:400 16px/1.45 system-ui,sans-serif}" +
      ".rgs-box{background:#15131c;color:#ece6d8;border:1px solid #3a3546;border-radius:16px;max-width:430px;width:100%;padding:20px;max-height:92vh;overflow:auto;box-sizing:border-box}" +
      ".rgs-box h3{margin:0 0 8px;font:700 20px/1.2 system-ui,sans-serif}.rgs-box p{margin:0 0 12px;color:#cfc8ba}.rgs-box ol{margin:0 0 12px;padding-left:22px;color:#cfc8ba}.rgs-box li{margin:4px 0}" +
      ".rgs-box a{color:#e2ba6e}.rgs-box input{width:100%;box-sizing:border-box;background:#0b0a10;color:#ece6d8;border:1px solid #3a3546;border-radius:10px;padding:12px;font:16px ui-monospace,monospace;margin:0 0 10px}" +
      ".rgs-row{display:flex;gap:10px;flex-wrap:wrap}.rgs-row button{flex:1;min-height:46px;border-radius:10px;border:1px solid #3a3546;background:#211e2a;color:#ece6d8;font:700 16px system-ui,sans-serif;cursor:pointer;padding:0 14px}" +
      ".rgs-row button.pri{background:#e2ba6e;color:#120e08;border-color:#e2ba6e}.rgs-err{color:#ff9d8a;min-height:1.4em;margin:0 0 8px;font-size:15px}";
    document.head.appendChild(s);
  }
  var toastEl = null, toastT = 0;
  function toast(text, ms) {
    style();
    if (!toastEl) { toastEl = document.createElement("div"); toastEl.className = "rgs-toast"; toastEl.setAttribute("role", "status"); document.body.appendChild(toastEl); }
    toastEl.textContent = text; toastEl.classList.add("on");
    clearTimeout(toastT); toastT = setTimeout(function () { toastEl.classList.remove("on"); }, ms || 2600);
  }
  function offHint() {
    if (LS.get("rg_sync_hint_off") || !document.body) return;
    style();
    var el = document.createElement("div"); el.className = "rgs-hint";
    el.innerHTML = '<span>Save sync is off</span><button type="button" class="go">Set up</button><button type="button" class="x" aria-label="Don\'t show this again">✕</button>';
    document.body.appendChild(el);
    requestAnimationFrame(function () { el.classList.add("on"); });
    var gone = function () { el.remove(); };
    var t = setTimeout(gone, 9000);
    el.querySelector(".go").onclick = function () { clearTimeout(t); gone(); setup().then(function (ok) { if (ok) location.reload(); }); };
    el.querySelector(".x").onclick = function () { clearTimeout(t); LS.set("rg_sync_hint_off", "1"); gone(); };
  }
  function dialog(html) {
    style();
    var veil = document.createElement("div"); veil.className = "rgs-veil";
    veil.innerHTML = '<div class="rgs-box" role="dialog" aria-modal="true">' + html + "</div>";
    document.body.appendChild(veil);
    ["pointerdown", "touchstart", "mousedown", "keydown", "keyup", "click"].forEach(function (ev) { veil.addEventListener(ev, function (e) { e.stopPropagation(); }); });
    return veil;
  }
  /* Paste-the-key dialog. Resolves true once a working key is stored. */
  function setup() {
    return new Promise(function (done) {
      var v = dialog(
        "<h3>Turn on save sync</h3>" +
        "<p>Your saves are kept in your own GitHub account and follow you between devices. You do this once per device.</p>" +
        "<ol><li><a href=\"" + KEY_URL + "\" target=\"_blank\" rel=\"noopener\">Open GitHub's key page</a></li>" +
        "<li>Set <b>Expiration</b> to <b>No expiration</b></li><li>Tap <b>Generate token</b>, then copy it</li><li>Paste it here</li></ol>" +
        "<p>Already set up on another device? On that device open the Games page and use <b>Add another device</b> instead.</p>" +
        '<input type="text" inputmode="text" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="ghp_…" aria-label="Your key">' +
        '<div class="rgs-err" role="alert"></div>' +
        '<div class="rgs-row"><button type="button" class="no">Not now</button><button type="button" class="pri yes">Turn on</button></div>');
      var input = v.querySelector("input"), err = v.querySelector(".rgs-err"), yes = v.querySelector(".yes");
      v.querySelector(".no").onclick = function () { v.remove(); done(false); };
      yes.onclick = async function () {
        var tok = input.value.trim(); if (!tok) { err.textContent = "Paste the key first."; return; }
        yes.disabled = true; err.textContent = "Checking…";
        try { await setKey(tok); v.remove(); done(true); }
        catch (e) {
          err.textContent = e.code === "key" ? "GitHub didn't accept that key. Copy it again and retry."
            : e.code === "scope" ? "That key can't store saves. Make one from the link above; it needs the \"gist\" box ticked."
            : e.code === "offline" ? "Couldn't reach GitHub. Check your connection and retry." : "Something went wrong (" + e.message + ").";
          yes.disabled = false;
        }
      };
    });
  }
  /* First time this device joins and both sides have a save. */
  function choose(remote) {
    return new Promise(function (done) {
      var when = remote.at ? new Date(remote.at).toLocaleString([], { dateStyle: "medium", timeStyle: "short" }) : "earlier";
      var v = dialog("<h3>Two saves found</h3><p>This device has a save, and your " + (remote.device || "other device") + " stored a different one (" + when + "). Which should both devices use from now on?</p>" +
        '<p>The one you don\'t pick is replaced.</p><div class="rgs-row"><button type="button" class="mine">Keep this device\'s</button><button type="button" class="pri theirs">Use the stored one</button></div>');
      v.querySelector(".mine").onclick = function () { v.remove(); done("local"); };
      v.querySelector(".theirs").onclick = function () { v.remove(); done("remote"); };
    });
  }

  window.RodSync = { start: start, arm: arm, now: function () { return syncOnce({}); }, setup: setup, setKey: setKey, clearKey: clearKey,
    key: token, info: info, toast: toast, status: function () { return { on: !!token(), problem: problem, lastSync: lastSync }; }, KEY_URL: KEY_URL };
})();
