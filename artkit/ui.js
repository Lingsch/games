// Art layer, part 3: the interface skin. Adds the stylesheet, and swaps every emoji the game writes for a pictograph.
// The game keeps writing emoji; a watcher replaces each one as it lands in the page (and on the map canvases).
import { EMOJI, PLACED, SCHOOL, KIND } from './iconmap.js';
export function initUi(G) {
  const { S, CLASSES, theme, SET } = G;
  const root = document.documentElement, url = n => `url("${G.base}icons/${n}.svg?v=${G.version}")`;
  const RX = /\p{Extended_Pictographic}️?(?:‍\p{Extended_Pictographic}️?)*/gu;
  const ABILITY = theme.icons || {};
  let on = false, link = null, obs = null;
  const find = e => EMOJI[e] || EMOJI[e + '️'] || EMOJI[e.replace(/️/g, '')];

  // ability lookups, rebuilt when a name is missed (classes gain abilities as the game loads its modules)
  let byName = null, byKey = null;
  function index() { byName = {}; byKey = {}; for (const ck in CLASSES) { const A = CLASSES[ck].abilities || {}; for (const k in A) { const a = A[k]; if (!a || !a.name) continue; byName[a.name] = a; (byKey[k] || (byKey[k] = [])).push(a); } } }
  const baseName = s => (s || '').replace(/\s+(?:I{1,3}|IV|V|\(.*\))$/, '').trim();
  function ability(el, emoji) {
    if (!byName) index();
    let name = null, key = null;
    const k = el.closest('.k');
    if (k) name = k.querySelector('.lab')?.textContent;
    else { const sp = el.closest('.sp'); if (sp) name = sp.querySelector('b')?.textContent; }
    if (!name) { const be = el.closest('#barEdit'); if (be && S.bar && S.heroCls) { const b = el.closest('button'), i = [...be.children].indexOf(b); key = (S.bar[S.heroCls] || [])[i]; if (key === 'attack') name = 'Attack'; else if (key) name = CLASSES[S.heroCls]?.abilities[key]?.name; } }
    if (!name) { const t = el.closest('[title]'); if (t && byKey[t.title]) { const a = byKey[t.title].find(a => a.icon === emoji) || byKey[t.title][0]; name = a.name; } }
    if (!name) return null;
    name = baseName(name); if (theme.nameFix) name = theme.nameFix(name);
    let a = byName[name]; if (!a && name !== 'Attack' && name !== 'Auto Attack') { index(); a = byName[name]; }
    const icon = ABILITY[name] || (theme.iconFor && theme.iconFor(name, a));
    const col = a ? (SCHOOL[a.school] || (theme.kindCol && theme.kindCol(a)) || null) : null;
    return icon || col ? { icon, col, a } : null;
  }
  function make(emoji, host) {
    const base = find(emoji); let icon = base && base[0], col = base && base[1];
    for (const p of PLACED) if (p[1] === emoji && host.closest(p[0])) { icon = p[2]; col = p[3]; }
    const ab = ability(host, emoji);
    if (ab) { if (ab.icon) icon = ab.icon; if (ab.col) col = ab.col; else if (ab.icon && ab.a && !base) col = KIND[ab.a.kind]; }
    if (!icon) return null;
    const s = document.createElement('span'); s.className = 'pic'; s.style.setProperty('--i', url(icon)); if (col) s.style.setProperty('--pc', col);
    const e = document.createElement('span'); e.className = 'pe'; e.textContent = emoji; s.appendChild(e);
    const tile = host.closest('.k,.sp .ic,.cls .ic,#barEdit button'); if (tile && col) tile.style.setProperty('--pc', col);
    return s;
  }
  const SKIP = { SCRIPT: 1, STYLE: 1, TEXTAREA: 1, INPUT: 1, CANVAS: 1 };
  function swap(t) {
    const p = t.parentNode; if (!p || SKIP[p.nodeName] || p.classList?.contains('pe') || p.isContentEditable) return;
    const s = t.nodeValue; RX.lastIndex = 0; if (!RX.test(s)) return;
    RX.lastIndex = 0; let m, last = 0, frag = null;
    while ((m = RX.exec(s))) {
      const el = make(m[0], p); if (!el) continue;
      frag = frag || document.createDocumentFragment();
      if (m.index > last) frag.appendChild(document.createTextNode(s.slice(last, m.index)));
      frag.appendChild(el); last = m.index + m[0].length;
    }
    if (!frag) return;
    if (last < s.length) frag.appendChild(document.createTextNode(s.slice(last)));
    p.replaceChild(frag, t);
  }
  function scan(n) {
    if (!n) return;
    if (n.nodeType === 3) return swap(n);
    if (n.nodeType !== 1 || SKIP[n.nodeName] || n.classList.contains('pic')) return;
    const w = document.createTreeWalker(n, NodeFilter.SHOW_TEXT), list = []; let t;
    while ((t = w.nextNode())) if (t.nodeValue.length && t.nodeValue.charCodeAt(0) + t.nodeValue.length > 0) list.push(t);
    for (const x of list) swap(x);
    if (n.querySelector) settingsRow(n);
  }
  // Settings → Graphics gets the switch for the whole layer, and a line saying what it does
  function settingsRow(n) {
    const b = n.querySelector('button[data-o="gfx"]'); if (!b) return;
    const seg = b.parentElement, card = seg.parentElement; if (card.querySelector('[data-o="art"]')) return;
    const p = document.createElement('p'); p.className = 'setl'; p.textContent = 'New art';
    const s = document.createElement('div'); s.className = 'seg'; s.innerHTML = `<button data-o="art" data-v="1" class="${SET.art ? 'on' : ''}">On</button><button data-o="art" data-v="0" class="${SET.art ? '' : 'on'}">Off</button>`;
    const c = document.createElement('p'); c.className = 'artnote'; c.textContent = 'New art adds sun shadows, glow, weather, combat effects, new models and the interface skin.';
    seg.after(p, s, c);
  }
  function revert() { document.querySelectorAll('.pic').forEach(p => p.replaceWith(document.createTextNode(p.textContent))); document.querySelectorAll('[style*="--pc"]').forEach(e => e.style.removeProperty('--pc')); }

  // the map canvases draw emoji as text; draw the pictograph instead once its picture has loaded
  const imgs = new Map(), C2D = CanvasRenderingContext2D.prototype, fill0 = C2D.fillText;
  function tinted(icon, col) {
    const key = icon + col; let r = imgs.get(key);
    if (!r) {
      r = { cv: null }; imgs.set(key, r);
      const im = new Image(); im.onload = () => { const cv = document.createElement('canvas'); cv.width = cv.height = 64; const g = cv.getContext('2d'); g.drawImage(im, 0, 0, 64, 64); g.globalCompositeOperation = 'source-in'; g.fillStyle = col || '#fff'; g.fillRect(0, 0, 64, 64); r.cv = cv; };
      im.src = `${G.base}icons/${icon}.svg?v=${G.version}`;
    }
    return r.cv;
  }
  C2D.fillText = function (text, x, y, w) {
    if (on && typeof text === 'string' && text.length <= 8) {
      const e = find(text);
      if (e) { const cv = tinted(e[0], e[1]); if (cv) { const px = parseFloat((this.font.match(/([\d.]+)px/) || [0, 14])[1]) * 1.2; const ax = this.textAlign === 'center' ? x - px / 2 : this.textAlign === 'right' || this.textAlign === 'end' ? x - px : x; const ay = this.textBaseline === 'middle' ? y - px / 2 : this.textBaseline === 'top' ? y : y - px * .85;
        this.save(); this.shadowColor = 'rgba(0,0,0,.9)'; this.shadowBlur = 3; this.drawImage(cv, ax, ay, px, px); this.restore(); return; } }
    }
    return w === undefined ? fill0.call(this, text, x, y) : fill0.call(this, text, x, y, w);
  };

  function setOn(v) {
    if (v === on) return; on = v;
    root.classList.toggle('art', v); root.classList.toggle('art-' + (theme.skin || 'fantasy'), v);
    if (v) {
      if (!link) { link = document.createElement('link'); link.rel = 'stylesheet'; link.href = G.base + 'ui.css?v=' + (G.version || 1); document.head.appendChild(link); }
      link.disabled = false; root.style.setProperty('--lock', url('padlock'));
      scan(document.body);
      obs = new MutationObserver(ms => { for (const m of ms) { if (m.type === 'characterData') swap(m.target); else for (const n of m.addedNodes) scan(n); } });
      obs.observe(document.body, { childList: true, subtree: true, characterData: true });
    } else { if (obs) obs.disconnect(); obs = null; if (link) link.disabled = true; revert(); }
  }
  return { setOn };
}
