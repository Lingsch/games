// Screens, HUD, spell bar + spellbook, orders, city panel, minimap, and every input path.
import * as THREE from './three.js';
import { S, WH, TAU } from './core.js';
import { cam, renderer, scene } from './render.js';
import { world, hgt } from './world.js';
import * as Game from './game.js';
import * as PR from './progress.js';
import * as UP from './upgrades.js';
import * as Un from './units.js';

const $ = id => document.getElementById(id);
const SPELL = id => Game.SPELLS.find(s => s.id === id);
const CLS = () => Game.CLASSES[S.cls] || Game.CLASSES.elem;
// a spell's colour: its element for the Elementalist, the summoner's palette otherwise
const EL_HEX = { fireball: '#ff6a2b', imps: '#ff6a2b', kindle: '#ff6a2b', undine: '#4fb0e8', nova: '#4fb0e8', rain: '#4fb0e8', golem: '#d9a441', quake: '#d9a441', stoneskin: '#d9a441', sprites: '#a58cff', chain: '#a58cff', tailwind: '#a58cff' };
const TYPE_COL = { summon: '#e0b040', attack: '#ff7a5a', buff: '#7fd6c8' };
const spellCol = s => EL_HEX[s.id] || (s.cls === 'druid' ? { summon: '#e0a33a', attack: '#8fce5a', buff: '#6fd0a0' } : { summon: '#c9e8a8', attack: '#9be36b', buff: '#7fffd4' })[s.type];
export const input = { ix: 0, iz: 0 };
const AIM_PX = .14, SEND_PX = .3;      // world units per pixel of drag

// ---------- options ----------
const OPTS = { squads: false, fieldTap: false, assist: true, cls: 'elem' };
function loadOpts() { try { Object.assign(OPTS, JSON.parse(localStorage.getItem('shr_opts')) || {}); } catch (e) { } S.assist = OPTS.assist; }
function saveOpts() { try { localStorage.setItem('shr_opts', JSON.stringify(OPTS)); } catch (e) { } S.assist = OPTS.assist; }

// ---------- messages: a quiet feed under your stats ----------
const fmt = n => Math.floor(n).toLocaleString();
const LOG = [];
let lastMsg = '', lastMsgT = 0;
function feed(html, type, life) {
  const d = document.createElement('div'); d.className = 'msg ' + type; d.innerHTML = html; $('feed').prepend(d);
  while ($('feed').children.length > 3) $('feed').lastChild.remove();
  setTimeout(() => d.classList.add('out'), life); setTimeout(() => d.remove(), life + 800);
}
const esc = t => String(t).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c]);
export function toast(msg, type = '') {
  const now = performance.now(); if (msg === lastMsg && now - lastMsgT < 1500) return; lastMsg = msg; lastMsgT = now;
  LOG.unshift(msg); LOG.length = Math.min(LOG.length, 30);
  feed(esc(msg), type, 3200);
}
export function loreCard(title, text, sub) {
  LOG.unshift(`${title}: ${text}${sub ? ` (${sub})` : ''}`); LOG.length = Math.min(LOG.length, 30);
  feed(`<b>${esc(title)}</b><i>${esc(text)}</i>${sub ? `<br><span class="dim">${esc(sub)}</span>` : ''}`, 'lore', 6500);
}
export function hurtFlash() { const f = $('hurt'); f.style.opacity = .8; clearTimeout(f._t); f._t = setTimeout(() => f.style.opacity = 0, 160); }
export function shake(a) { S.shake = Math.max(S.shake || 0, a); }
export function boss() { }
function show(id, on = true) { $(id).classList.toggle('hide', !on); }
function anyPanel() { return ['title', 'menu', 'shop', 'over', 'cityPanel', 'book'].some(id => !$(id).classList.contains('hide')); }
function setPaused() { S.paused = anyPanel(); }
function withLoading(fn) { $('gen').classList.remove('hide'); setTimeout(() => { try { fn(); } finally { $('gen').classList.add('hide'); } }, 40); }

// ---------- title and class choice ----------
function renderClasses() {
  $('classes').innerHTML = Object.entries(Game.CLASSES).map(([id, c]) => `<button class="cls${OPTS.cls === id ? ' sel' : ''}" data-c="${id}" style="--c:${c.color}"><b>${c.name}</b><em>${c.role}</em><small>${c.blurb}</small></button>`).join('');
}
export function showTitle() {
  const save = Game.loadRunSave();
  $('btnContinue').classList.toggle('hide', !save);
  if (save) $('btnContinue').textContent = `Continue run (${(Game.CLASSES[save.cls || 'elem'] || {}).name || 'Elementalist'})`;
  $('titleEmbers').textContent = `${fmt(S.meta.embers)} embers · ${S.meta.runs} runs`;
  renderClasses(); show('title'); show('hud', false); setPaused();
}
function startNew() {
  const raw = $('seedIn').value.trim(), seed = raw ? (parseInt(raw, 10) || [...raw].reduce((a, c) => a * 31 + c.charCodeAt(0) | 0, 7)) : (Math.random() * 1e9) | 0;
  show('title', false); show('over', false); show('shop', false);
  withLoading(() => {
    Game.newRun(seed, null, OPTS.cls);
    toast('Tap a spell to cast where you face. Drag from it to aim. Hold it to open your spellbook.', 'good');
    setTimeout(() => toast('Drag from the Horde button to send your creatures somewhere.', 'good'), 3600);
  });
}
export function onRunStart() {
  document.documentElement.style.setProperty('--acc', CLS().color);
  show('hud'); show('title', false); show('over', false); setPaused();
  buildBar(); buildOrders();
}
export function showGameOver(st) {
  const sk = S.skills.map(id => PR.allNodes(S.cls).find(n => n.id === id)).filter(Boolean).map(n => n.name);
  const gear = PR.SLOTS.map(sl => S.equip[sl]).filter(Boolean), rel = S.relics.map(id => (PR.RELICS.find(r => r.id === id) || {}).name).filter(Boolean);
  $('overStats').innerHTML = [['Summoner', CLS().name], ['Time survived', `${Math.floor(st.mins)} min`], ['Foes slain', fmt(st.kills)], ['Cities taken', st.cities], ['Level reached', st.level]]
    .map(([a, b]) => `<div class="row"><span>${a}</span><b>${b}</b></div>`).join('')
    + `<div class="build"><b>Spells</b> ${S.known.map(id => SPELL(id).name + (Game.rankOf(id) > 1 ? ' ' + ROMAN[Game.rankOf(id)] + ' (' + S.spellUps[id].map(u => u.name).join(', ') + ')' : '')).join('; ')}</div>`
    + `<div class="build"><b>Skills</b> ${sk.join(', ') || 'none'}</div>`
    + `<div class="build"><b>Gear</b> ${gear.map(g => `<span style="color:${PR.RARITY[g.r].col}">${g.name}</span>`).join(', ') || 'none'}</div>`
    + `<div class="build"><b>Relics</b> ${rel.join(', ') || 'none'}</div>`;
  $('overEmbers').textContent = `+${st.embers} embers`;
  setTimeout(() => { show('over'); setPaused(); }, 1200);
  show('book', false); show('cityPanel', false);
}
function renderShop() {
  $('shopEmbers').textContent = `${fmt(S.meta.embers)} embers. Upgrades apply to every summoner.`;
  $('shopList').innerHTML = Game.META_UPS.map(u => {
    const l = Game.metaLvl(u.id), max = l >= u.max, cost = u.cost(l);
    return `<div class="up"><div><b>${u.name}</b><small>${u.desc}</small><span class="pips">${'●'.repeat(l)}${'○'.repeat(u.max - l)}</span></div>
      <button data-buy="${u.id}" ${max || S.meta.embers < cost ? 'disabled' : ''}>${max ? 'Max' : `${cost} embers`}</button></div>`;
  }).join('');
}

// ---------- ground markers ----------
const ringMesh = (col, op) => { const m = new THREE.Mesh(new THREE.RingGeometry(.86, 1, 40).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: op, depthWrite: false, blending: THREE.AdditiveBlending })); m.visible = false; scene.add(m); return m; };
const aimRing = ringMesh('#ffb347', .55), sendRing = ringMesh('#9be36b', .8), tgtMark = ringMesh('#9be36b', .7);
function placeRing(m, x, z, r) { m.position.set(x, hgt(x, z) + .2, z); m.scale.setScalar(r); m.visible = true; }

// ---------- spell bar ----------
let press = null;
function buildBar() {
  $('spellbar').innerHTML = S.loadout.map((id, k) => {
    if (!id) return `<button class="sb empty" data-k="${k}"><small>+</small><kbd>${KEYS[k]}</kbd></button>`;
    const s = SPELL(id), r = Game.rankOf(id);
    return `<button class="sb" data-k="${k}" style="--c:${spellCol(s)}"><b>${s.name}</b><small>${Math.ceil(Game.spellCost(s))}</small>${r > 1 ? `<i class="rk">${ROMAN[r]}</i>` : ''}<kbd>${KEYS[k]}</kbd></button>`; }).join('');
  refreshBookBtn();
}
function refreshBookBtn() { const n = (S.spellPts || 0) + (S.newGear ? 1 : 0); if (n) $('bookBtn').dataset.n = n; else delete $('bookBtn').dataset.n; }
const KEYS = '1234567890-=', ROMAN = ['', 'I', 'II', 'III', 'IV', 'V'];
function castSlot(k, at, el) {
  if (!S.loadout[k]) { openBook(k); return; }
  const why = Game.castSpell(S.loadout[k], at);
  const b = el || document.querySelector(`.sb[data-k="${k}"]`);
  if (why) { toast(why); if (b) { b.classList.remove('nope'); void b.offsetWidth; b.classList.add('nope'); } }
}
function dragAim(s, dx, dy) {
  const h = S.hero; let vx = dx * AIM_PX, vz = dy * AIM_PX; const l = Math.hypot(vx, vz);
  if (l > s.range) { vx *= s.range / l; vz *= s.range / l; }
  return { x: h.x + vx, z: h.z + vz };
}
function bindSpellbar() {
  const bar = $('spellbar');
  bar.addEventListener('pointerdown', e => {
    const b = e.target.closest('.sb'); if (!b || S.paused || !S.running) return;
    e.preventDefault(); try { b.setPointerCapture(e.pointerId); } catch (_) { }
    const k = +b.dataset.k;
    press = { kind: 'spell', k, b, id: e.pointerId, x: e.clientX, y: e.clientY, moved: false, picked: false };
    press.timer = setTimeout(() => { if (press && !press.moved && press.kind === 'spell') { press.picked = true; openBook(k); } }, 450);
  });
  bar.addEventListener('pointermove', e => {
    if (!press || press.kind !== 'spell' || e.pointerId !== press.id) return;
    const dx = e.clientX - press.x, dy = e.clientY - press.y;
    if (!press.moved && Math.hypot(dx, dy) > 14) { press.moved = true; clearTimeout(press.timer); }
    const s = SPELL(S.loadout[press.k]);
    if (press.moved && s && s.aim) S.aimOverride = dragAim(s, dx, dy);
  });
  const end = e => {
    if (!press || press.kind !== 'spell' || e.pointerId !== press.id) return;
    clearTimeout(press.timer);
    if (!press.picked && e.type === 'pointerup') castSlot(press.k, press.moved && S.aimOverride ? S.aimOverride : null, press.b);
    S.aimOverride = null; press = null;
  };
  bar.addEventListener('pointerup', end); bar.addEventListener('pointercancel', end);
}

// ---------- spellbook ----------
let bookSlot = -1, bookFilter = 'all';
let bookTab = 'spells', upgOpen = null;
function openBook(k = -1) { bookSlot = k; renderBook(); show('book'); setPaused(); }
function renderBook() {
  if (bookTab === 'skills') bookTab = 'spells';
  for (const t of ['spells', 'skills', 'gear']) show('tab' + t[0].toUpperCase() + t.slice(1), bookTab === t);
  document.querySelectorAll('#bookTabs button').forEach(b => { b.classList.toggle('on', b.dataset.tab === bookTab); const n = b.dataset.tab === 'spells' ? S.spellPts : b.dataset.tab === 'skills' ? S.skillPts : S.newGear ? '!' : 0; if (n) b.dataset.n = n; else delete b.dataset.n; });
  if (bookTab === 'skills') renderSkills(); else if (bookTab === 'gear') { S.newGear = false; renderGear(); }
  const c = CLS(), mine = Game.SPELLS.filter(s => s.cls === S.cls);
  $('bookTitle').textContent = `${c.name}'s spellbook`;
  $('loadout').innerHTML = S.loadout.map((id, k) => { const s = id && SPELL(id); return `<button class="lslot${k === bookSlot ? ' sel' : ''}" data-slot="${k}" style="--c:${s ? spellCol(s) : '#555'}"><small>${KEYS[k]}${s ? ' · ' + Game.typeLabel(s) : ''}</small><b>${s ? s.name : 'empty'}</b></button>`; }).join('');
  $('learn').innerHTML = S.spellPts ? `<div class="learn"><b>${S.spellPts} spell point${S.spellPts > 1 ? 's' : ''}</b> <span class="dim" style="font-size:12.5px">Tap Upgrade on a spell. Each level offers three paths.</span></div>` : '';
  $('filters').innerHTML = ['all', 'summon', 'buff', 'attack'].map(f => `<button data-f="${f}" class="${bookFilter === f ? 'on' : ''}">${f === 'all' ? 'All' : Game.TYPE_NAME[f] + 's'}</button>`).join('');
  const known = mine.filter(s => S.known.includes(s.id) && (bookFilter === 'all' || s.type === bookFilter));
  $('spellList').innerHTML = known.map(s => {
    const slot = S.loadout.indexOf(s.id), lv = Game.rankOf(s.id), ups = (S.spellUps || {})[s.id] || [], open = upgOpen === s.id;
    const chips = ups.map(u => `<span class="uchip" style="--r:${UP.RAR[u.r].col}" title="${u.text}">${u.name}</span>`).join('');
    const canUp = S.spellPts > 0 && lv < Game.MAX_RANK;
    const cards = open && canUp ? `<div class="ucards"><div class="dim" style="font-size:12px">Level ${ROMAN[lv + 1]}: pick one</div>${Game.upgradeOffer(s.id).map((u, k) => `<button class="ucard" data-take="${s.id}:${k}" style="--r:${UP.RAR[u.r].col}"><small>${UP.RAR[u.r].name}</small><b>${u.name}</b><span>${u.text}</span></button>`).join('')}</div>` : '';
    return `<div class="spl" style="--c:${spellCol(s)}"><b>${s.name} ${ROMAN[lv]}<span class="tag">${Game.typeLabel(s)}</span>${slot >= 0 ? `<span class="tag" style="background:var(--ink)">Key ${KEYS[slot]}</span>` : ''}</b><span class="lab">${Game.spellLabel(s)}</span><span class="meta">${Math.ceil(Game.spellCost(s))} mana${s.aim ? ' · aimed' : ''} · level ${lv} of ${Game.MAX_RANK}</span><i>${s.desc}</i>${chips ? `<div class="uchips">${chips}</div>` : ''}
      <div class="acts"><button data-eq="${s.id}">${slot >= 0 ? 'Remove from bar' : 'Put on bar'}</button>${lv < Game.MAX_RANK ? `<button data-up="${s.id}" class="${canUp ? 'primary' : ''}" ${canUp ? '' : 'disabled'}>${open && canUp ? 'Hide upgrades' : 'Upgrade'}</button>` : '<span class="dim" style="font-size:12px;align-self:center">Fully upgraded</span>'}</div>${cards}</div>`;
  }).join('') || '<div class="dim">No spells of this kind yet.</div>';
  const locked = Game.lockedSpells();
  $('bookCount').innerHTML = `Spells: ${S.known.length}/${mine.length}`;
}
function renderSkills() {
  const tree = PR.TREES[S.cls];
  $('tabSkills').innerHTML = `<div class="dim" style="font-size:12.5px;margin-bottom:6px">${S.skillPts ? `<b style="color:var(--acc)">${S.skillPts} skill point${S.skillPts > 1 ? 's' : ''} to spend.</b> ` : ''}One point per level. Each branch unlocks top to bottom.</div>
  <div class="tree">${tree.map(b => `<div class="branch" style="--c:${b.col}"><b>${b.name}</b>${b.nodes.map(n => {
    const got = S.skills.includes(n.id), can = PR.canTake(S.cls, n.id);
    return `<button class="node${got ? ' got' : can ? ' can' : ''}" data-sk="${n.id}"><b>${n.name}</b>${n.desc}</button>`;
  }).join('')}</div>`).join('')}</div>`;
}
const itemHTML = (it, acts) => { const set = it.set && PR.SETS.find(x => x.id === it.set);
  return `<div class="item" style="--c:${PR.RARITY[it.r].col}"><b>${it.name}</b> <span class="dim">${PR.RARITY[it.r].name} ${PR.SLOT_NAME[it.slot]}</span><div>${it.stats.map(PR.statText).join(' · ')}</div>${it.power ? `<div class="pow">${it.power}</div>` : ''}${set ? `<div class="setl">${set.name} (${PR.setCount(set.id)}/4 worn): ${[2, 3, 4].map(n => `<span class="${PR.setCount(set.id) >= n ? 'on' : ''}">${n}: ${set.bonus[n][1]}</span>`).join(' ')}</div>` : ''}<i>${it.lore}</i>${acts ? `<div class="acts">${acts}</div>` : ''}</div>`; };
function renderGear() {
  const rel = S.relics.map(id => PR.RELICS.find(r => r.id === id)).filter(Boolean);
  $('tabGear').innerHTML = `<div class="gearbtns"><button id="autoEq" class="primary">Equip best</button><button id="sellOld">Sell old gear</button></div>
  <div class="slots">${PR.SLOTS.map(sl => { const it = S.equip[sl]; return `<button class="gslot" data-uneq="${sl}" style="--c:${it ? PR.RARITY[it.r].col : '#555'}"><small>${PR.SLOT_NAME[sl]}</small>${it ? it.name : '<span class="dim">empty</span>'}</button>`; }).join('')}</div>
  ${PR.SLOTS.filter(sl => S.equip[sl]).map(sl => itemHTML(S.equip[sl])).join('')}
  <h3 style="margin:10px 0 4px;font:700 14px Cinzel,serif">Relics <span class="dim" style="font:12px sans-serif">${rel.length} of ${PR.RELICS.length}</span></h3>
  <div class="relics">${rel.map(r => `<span class="relic" title="${r.lore}"><b>${r.name}</b>: ${r.desc}</span>`).join('') || '<span class="dim" style="font-size:12px">None yet.</span>'}</div>
  <h3 style="margin:10px 0 4px;font:700 14px Cinzel,serif">Pack <span class="dim" style="font:12px sans-serif">${S.inv.length}/24</span></h3>
  ${S.inv.map(it => itemHTML(it, `<button class="primary" data-equip="${it.uid}">Equip</button><button data-sell="${it.uid}">Sell for ${PR.sellPrice(it)} gold</button>`)).join('') || '<div class="dim" style="font-size:12px">Nothing in your pack.</div>'}`;
}
function bindBook() {
  $('bookTabs').addEventListener('click', e => { const b = e.target.closest('[data-tab]'); if (b) { bookTab = b.dataset.tab; renderBook(); } });
  $('pots').addEventListener('pointerdown', e => { const b = e.target.closest('[data-pot]'); if (!b) return; e.stopPropagation(); if (Game.usePotion(b.dataset.pot)) toast(b.dataset.pot === 'hp' ? 'Healed.' : b.dataset.pot === 'mp' ? 'Mana restored.' : 'Fury! Your horde rages for 15 seconds.', 'good'); });
  $('tabGear').addEventListener('click', e => {
    const eq = e.target.closest('[data-equip]'), sv = e.target.closest('[data-sell]'), un = e.target.closest('[data-uneq]');
    if (e.target.closest('#autoEq')) { const n = Game.autoEquip(); toast(n ? `Equipped your best gear (${n} change${n > 1 ? 's' : ''}).` : 'You are already wearing your best gear.'); }
    else if (e.target.closest('#sellOld')) { const [n, g] = Game.sellOld(); toast(n ? `Sold ${n} old item${n > 1 ? 's' : ''} for ${g} gold.` : 'Nothing worse than what you wear. Legendaries and set pieces are never auto-sold.'); }
    else if (eq) Game.equip(+eq.dataset.equip); else if (sv) Game.sell(+sv.dataset.sell); else if (un) Game.unequip(un.dataset.uneq); else return;
    renderBook();
  });
  $('book').addEventListener('click', e => {
    const sl = e.target.closest('[data-slot]'), f = e.target.closest('[data-f]'), eq = e.target.closest('[data-eq]'), up = e.target.closest('[data-up]'), tk = e.target.closest('[data-take]');
    if (e.target.closest('#sortBtn')) { Game.sortBar(); bookSlot = -1; buildBar(); renderBook(); }
    else if (sl) { // tap a key to select it, then another key to swap the two
      const k = +sl.dataset.slot;
      if (bookSlot >= 0 && bookSlot !== k) { [S.loadout[bookSlot], S.loadout[k]] = [S.loadout[k], S.loadout[bookSlot]]; bookSlot = -1; buildBar(); }
      else bookSlot = bookSlot === k ? -1 : k;
      renderBook();
    }
    else if (f) { bookFilter = f.dataset.f; renderBook(); }
    else if (up) { upgOpen = upgOpen === up.dataset.up ? null : up.dataset.up; renderBook(); }
    else if (tk) { const [id, k] = tk.dataset.take.split(':'), c = Game.takeUpgrade(id, +k); if (c) { toast(`${SPELL(id).name} ${ROMAN[Game.rankOf(id)]}: ${c.name}. ${c.text}.`, 'good'); upgOpen = null; buildBar(); refreshBookBtn(); renderBook(); } }
    else if (eq) { Game.toggleEquip(eq.dataset.eq, bookSlot >= 0 ? bookSlot : 0); bookSlot = -1; buildBar(); renderBook(); }
  });
  $('bookClose').onclick = () => { show('book', false); setPaused(); Game.saveRun(); };
  $('bookBtn').onclick = () => { if (S.running && !S.over) openBook(); };
}

// ---------- orders ----------
const MODES = ['follow', 'charge', 'hold'], MODE_TXT = { follow: 'Follow', charge: 'Hunt', hold: 'Hold', target: 'Attack' };
function buildOrders() {
  const c = CLS();
  $('orders').innerHTML = OPTS.squads ? [0, 1, 2, 3].map(e => `<button class="ob sq" data-el="${e}" style="--c:${c.sqCol[e]}"><b>${c.squads[e]}</b><small></small></button>`).join('')
    : `<button class="ob big" data-el="all"><b>Horde</b><small></small></button>`;
  refreshOrders();
}
function refreshOrders() {
  document.querySelectorAll('.ob').forEach(b => { const el = b.dataset.el, m = S.orders[el === 'all' ? 0 : +el].mode; b.querySelector('small').textContent = MODE_TXT[m]; b.classList.toggle('on', m === 'target'); });
  if (!S.orders.some(o => o.mode === 'target')) tgtMark.visible = false;
}
function sendTo(el, x, z) { Game.setOrder(el, 'target', x, z); placeRing(tgtMark, x, z, 2); refreshOrders(); }
function cycleOrder(el) {
  const m = S.orders[el === 'all' ? 0 : el].mode, next = m === 'target' ? 'charge' : MODES[(MODES.indexOf(m) + 1) % 3];
  Game.setOrder(el, next); refreshOrders();
}
function bindOrders() {
  const o = $('orders');
  o.addEventListener('pointerdown', e => {
    const b = e.target.closest('.ob'); if (!b || S.paused || !S.running) return;
    e.preventDefault(); try { b.setPointerCapture(e.pointerId); } catch (_) { }
    press = { kind: 'order', el: b.dataset.el === 'all' ? 'all' : +b.dataset.el, id: e.pointerId, x: e.clientX, y: e.clientY, moved: false };
  });
  o.addEventListener('pointermove', e => {
    if (!press || press.kind !== 'order' || e.pointerId !== press.id) return;
    const dx = e.clientX - press.x, dy = e.clientY - press.y;
    if (Math.hypot(dx, dy) > 14) press.moved = true;
    if (press.moved) { let vx = dx * SEND_PX, vz = dy * SEND_PX; const l = Math.hypot(vx, vz); if (l > 55) { vx *= 55 / l; vz *= 55 / l; } press.tx = S.hero.x + vx; press.tz = S.hero.z + vz; placeRing(sendRing, press.tx, press.tz, 2.4); }
  });
  const end = e => {
    if (!press || press.kind !== 'order' || e.pointerId !== press.id) return;
    sendRing.visible = false;
    if (e.type === 'pointerup') { if (press.moved && press.tx !== undefined) sendTo(press.el, press.tx, press.tz); else cycleOrder(press.el); }
    press = null;
  };
  o.addEventListener('pointerup', end); o.addEventListener('pointercancel', end);
}
const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
function groundPick(cx, cy) {
  if (!world.ground) return null;
  ndc.set(cx / innerWidth * 2 - 1, -(cy / innerHeight) * 2 + 1); ray.setFromCamera(ndc, cam);
  const hit = ray.intersectObject(world.ground, false)[0]; return hit ? hit.point : null;
}

// ---------- city panel ----------
let panelCity = null;
function openCity(c) { panelCity = c; renderCity(); show('cityPanel'); setPaused(); }
function renderCity() {
  const c = panelCity; if (!c) return;
  const L = c.lvl || 1, nx = Game.CITY_COST[L + 1], [cg, ce] = Game.CRAFT_COST, P = Game.POTION_COST;
  $('cityTitle').textContent = `${c.name} · level ${L} of ${Game.CITY_MAX}`;
  $('citySub').textContent = `Heart ${fmt(c.heartHP)}/${c.heartMax} · Perk: ${c.perk.text} · You have ${fmt(S.res.gold)} gold, ${fmt(S.res.essence)} essence`;
  const has = c.buildings.filter(b => b.type).map(b => `${Game.BTYPES[b.type].name} ${b.lvl}`);
  $('plots').innerHTML = `<div class="plot"><b>This city gives you</b><small>${has.length ? has.join(' · ') : 'Its heart and its perk. Upgrade it to raise buildings.'}</small>
    ${nx ? `<button data-up="1" ${S.res.gold >= nx[0] && S.res.essence >= nx[1] ? '' : 'class="poor"'}><span>Upgrade to level ${L + 1}</span><small>${Game.CITY_LEVEL_TEXT[L + 1]}</small><em>${nx[0]} gold · ${nx[1]} essence</em></button>` : '<small>Fully upgraded.</small>'}</div>
    <div class="plot"><b>Market</b>
    <button data-craft="1" ${S.res.gold >= cg && S.res.essence >= ce ? '' : 'class="poor"'}><span>Craft gear</span><small>A random piece${L >= 3 ? ', Rare or better' : ''}. Better at higher city levels.</small><em>${cg} gold · ${ce} essence</em></button>
    ${[['hp', 'Health potion', 'Heals half your health'], ['mp', 'Mana potion', 'Fills your mana'], ['fury', 'Fury potion', 'Your horde deals more damage and moves faster for 15s']].map(([k, n, d]) => `<button data-buy="${k}" ${S.res.gold >= P ? '' : 'class="poor"'}><span>${n} (have ${S.potions[k] || 0})</span><small>${d}</small><em>${P} gold</em></button>`).join('')}</div>`;
}

// ---------- minimap ----------
const mmc = $('mini'), mg = mmc.getContext('2d');
const VIEW = 560;   // world units across the minimap
function mapView() { const W = mmc.width, k = W / VIEW, h = S.hero || { x: 0, z: 0 }, cx = Math.max(-WH + VIEW / 2, Math.min(WH - VIEW / 2, h.x)), cz = Math.max(-WH + VIEW / 2, Math.min(WH - VIEW / 2, h.z)); return { W, k, cx, cz, p: (x, z) => [(x - cx) * k + W / 2, (z - cz) * k + W / 2] }; }
function drawMini() {
  const { W, k, cx, cz, p } = mapView();
  if (world.minimap) { const M = world.minimap.width, s = M / (2 * WH); mg.imageSmoothingEnabled = true; mg.drawImage(world.minimap, (cx - VIEW / 2 + WH) * s, (cz - VIEW / 2 + WH) * s, VIEW * s, VIEW * s, 0, 0, W, W); }
  else { mg.fillStyle = '#222'; mg.fillRect(0, 0, W, W); }
  const dot = (i, col, r) => { const [x, y] = p(Un.X[i], Un.Z[i]); if (x < 0 || y < 0 || x > W || y > W) return; mg.fillStyle = col; mg.fillRect(x - r, y - r, r * 2, r * 2); };
  for (let i = 0; i < Un.U.N; i += 2) if (Un.TEAM[i]) dot(i, '#ff4a3a', 2); else dot(i, '#ffd36b', 1.6);
  const blink = (performance.now() / 300 | 0) % 2;
  for (const c of world.cities) {
    let [x, y] = p(c.x, c.z); const col = c.state === 'owned' ? (c.raid && blink ? '#ff3b2f' : '#ffb347') : c.state === 'breached' ? '#ffe07a' : '#d8473a';
    const out = x < 8 || y < 8 || x > W - 8 || y > W - 8;
    if (out) { // off the map: a pointer at the edge
      const dx = x - W / 2, dy = y - W / 2, f = (W / 2 - 9) / Math.max(Math.abs(dx), Math.abs(dy)); x = W / 2 + dx * f; y = W / 2 + dy * f;
      const a = Math.atan2(dy, dx); mg.fillStyle = col; mg.beginPath(); mg.moveTo(x + Math.cos(a) * 9, y + Math.sin(a) * 9); mg.lineTo(x + Math.cos(a + 2.4) * 7, y + Math.sin(a + 2.4) * 7); mg.lineTo(x + Math.cos(a - 2.4) * 7, y + Math.sin(a - 2.4) * 7); mg.closePath(); mg.fill(); continue;
    }
    mg.fillStyle = 'rgba(0,0,0,.55)'; mg.beginPath(); mg.arc(x, y, 11, 0, TAU); mg.fill();
    mg.lineWidth = 3.5; mg.strokeStyle = col; mg.beginPath(); mg.arc(x, y, 10, 0, TAU); mg.stroke();
    mg.fillStyle = col; mg.fillRect(x - 3.5, y - 3.5, 7, 7);
  }
  for (const c of world.camps) if (c.discovered) {
    const [x, y] = p(c.x, c.z); if (x < 0 || y < 0 || x > W || y > W) continue;
    mg.fillStyle = c.cleared ? 'rgba(210,210,210,.7)' : '#ff5a48'; mg.strokeStyle = 'rgba(0,0,0,.6)'; mg.lineWidth = 1.5;
    mg.beginPath(); mg.moveTo(x, y - 7); mg.lineTo(x + 6.5, y + 5); mg.lineTo(x - 6.5, y + 5); mg.closePath(); mg.fill(); mg.stroke();
  }
  for (const l of S.loot || []) { const [x, y] = p(l.x, l.z); mg.fillStyle = l.tome ? '#c8a6ff' : l.relic ? '#ffd36b' : '#8fc8ff'; mg.beginPath(); mg.arc(x, y, 3.5, 0, TAU); mg.fill(); }
  if (S.hero) { // you: an arrow pointing the way you face
    const [x, y] = p(S.hero.x, S.hero.z), a = Math.atan2(Math.cos(S.hero.yaw), Math.sin(S.hero.yaw));
    mg.fillStyle = '#fff'; mg.strokeStyle = '#000'; mg.lineWidth = 2; mg.beginPath();
    mg.moveTo(x + Math.cos(a) * 10, y + Math.sin(a) * 10); mg.lineTo(x + Math.cos(a + 2.5) * 8, y + Math.sin(a + 2.5) * 8); mg.lineTo(x + Math.cos(a - 2.5) * 8, y + Math.sin(a - 2.5) * 8); mg.closePath(); mg.stroke(); mg.fill();
  }
  if (tgtMark.visible) { const [x, y] = p(tgtMark.position.x, tgtMark.position.z); mg.strokeStyle = '#9be36b'; mg.lineWidth = 3; mg.beginPath(); mg.arc(x, y, 7, 0, TAU); mg.stroke(); }
}

// ---------- per-frame HUD ----------
let textT = 0, miniT = 0, nearCity = null;
const BUFFS = [['kindle', 'Fury', '#ff6a2b'], ['stone', 'Armor', '#d9a441'], ['tail', 'Haste', '#a58cff'], ['shape', 'Bear form', '#c08a4a']];
export function update(dt) {
  if (tgtMark.visible) { tgtMark.rotation.y += dt; tgtMark.material.opacity = .5 + Math.sin(performance.now() / 200) * .3; }
  if (!S.running || !S.hero) { aimRing.visible = false; return; }
  const h = S.hero;
  const dragging = press && press.kind === 'spell' && press.moved && S.aimOverride;
  const aimS = dragging ? SPELL(S.loadout[press.k]) : S.loadout.filter(Boolean).map(SPELL).find(s => s.aim);
  if (aimS && S.aim && !S.over) { placeRing(aimRing, S.aim.x, S.aim.z, dragging ? Game.aimRadius(aimS) : (S.aim.locked ? 1.6 : 1.2)); aimRing.material.opacity = dragging ? .9 : S.aim.locked ? .8 : .45; }
  else aimRing.visible = false;
  $('hpBar').style.width = (h.hp / h.hpMax * 100) + '%'; $('manaBar').style.width = (h.mana / h.manaMax * 100) + '%';
  $('xpBar').style.width = (Game.xpFrac() * 100) + '%';
  textT -= dt;
  if (textT <= 0) {
    textT = .25;
    $('lvl').textContent = `${CLS().name} · ${h.level}`;
    $('res').innerHTML = `<span class="g">${fmt(S.res.gold)}</span><span class="e">${fmt(S.res.essence)}</span>`;
    $('pots').innerHTML = [['hp', 'Health'], ['mp', 'Mana'], ['fury', 'Fury']].map(([k, n]) => `<button data-pot="${k}" class="pot ${k}${S.potions && S.potions[k] ? '' : ' none'}" aria-label="${n} potion"><b>${S.potions ? S.potions[k] || 0 : 0}</b><small>${n}</small></button>`).join('');
    refreshBookBtn();
    $('horde').textContent = `Horde ${S.pcTotal}/${Math.floor(S.st.cap)}`;
    $('threat').textContent = `Threat ${S.threat.toFixed(1)}`;
    $('fps').textContent = `· ${S.fps || 0} fps, ${Un.U.N} units`;
    $('buffs').innerHTML = BUFFS.filter(([k]) => S.buffs[k] > 0).map(([k, n, c]) => `<span style="--c:${c}">${n} ${Math.ceil(S.buffs[k])}s</span>`).join('');
    document.querySelectorAll('.sb').forEach(b => { const id = S.loadout[+b.dataset.k]; if (id) b.classList.toggle('poor', h.mana < Game.spellCost(SPELL(id))); });
    nearCity = world.cities.find(c => c.state === 'owned' && Math.hypot(h.x - c.x, h.z - c.z) < c.R);
    $('cityBtn').classList.toggle('hide', !nearCity || S.over);
    if (nearCity) $('cityBtn').textContent = `Build in ${nearCity.name}`;
    { // boss bar: the nearest lord or camp chief close to you
      let bi = -1, bd = 34 * 34;
      for (let i = 0; i < Un.U.N; i++) if (Un.ROLE[i] === 3 || Un.ROLE[i] === 4) { const d = (Un.X[i] - h.x) ** 2 + (Un.Z[i] - h.z) ** 2; if (d < bd) { bd = d; bi = i; } }
      $('boss').classList.toggle('show', bi >= 0);
      if (bi >= 0) { $('bossName').textContent = Un.ROLE[bi] === 3 ? world.cities[Un.CITY[bi]].lordName : world.camps[Un.CAMP[bi]].chief; $('bossBar').style.width = (Un.HP[bi] / Un.HPM[bi] * 100) + '%'; }
    }
    refreshOrders(); refreshBookBtn();
    const st = $('stats').getBoundingClientRect(); $('feed').style.top = (st.bottom + 4) + 'px';
  }
  miniT -= dt; if (miniT <= 0) { miniT = .25; drawMini(); }
}

// ---------- input ----------
const keys = {}, stick = { id: null, ox: 0, oy: 0, x: 0, y: 0 }, tap = { id: null, x: 0, y: 0, t: 0 };
let padPrev = [];
export function pollInput() {
  let ix = stick.x + ((keys.d || keys.arrowright) ? 1 : 0) - ((keys.a || keys.arrowleft) ? 1 : 0);
  let iz = stick.y + ((keys.s || keys.arrowdown) ? 1 : 0) - ((keys.w || keys.arrowup) ? 1 : 0);
  const pad = navigator.getGamepads ? [...navigator.getGamepads()].find(p => p) : null;
  if (pad && S.hero) {
    const ax = pad.axes, dz = v => Math.abs(v) < .2 ? 0 : v;
    ix += dz(ax[0] || 0); iz += dz(ax[1] || 0);
    const b = i => pad.buttons[i] && pad.buttons[i].pressed, down = i => b(i) && !padPrev[i];
    if (!S.paused && S.running) {
      const rx = dz(ax[2] || 0), ry = dz(ax[3] || 0);   // right stick aims
      if (rx || ry) S.aimOverride = { x: S.hero.x + rx * 16, z: S.hero.z + ry * 16 }; else if (!press) S.aimOverride = null;
      [0, 1, 2, 3].forEach(k => { if (down(k)) castSlot(k, null); });
      if (down(5)) cycleOrder(OPTS.squads ? 0 : 'all');
      if (down(4)) sendTo('all', S.aim.x, S.aim.z);
      if (down(12)) S.zoom = S.zoom === 1 ? 1.6 : S.zoom === 1.6 ? .7 : 1;
      if (down(8)) { if (nearCity) openCity(nearCity); else openBook(); }
    }
    if (down(9)) toggleMenu();
    padPrev = pad.buttons.map(x => x.pressed);
  }
  const l = Math.hypot(ix, iz); if (l > 1) { ix /= l; iz /= l; }
  input.ix = S.paused ? 0 : ix; input.iz = S.paused ? 0 : iz;
  return input;
}
function toggleMenu() {
  if (!S.running || S.over) return;
  if (!$('book').classList.contains('hide')) { show('book', false); setPaused(); return; }
  const open = $('menu').classList.contains('hide');
  show('menu', open); if (open) renderMenu(); setPaused();
}
function renderMenu() {
  $('optSquads').textContent = `Order buttons: ${OPTS.squads ? 'one per creature type' : 'one for the whole horde'}`;
  $('optTap').textContent = `Tap the field to send the horde: ${OPTS.fieldTap ? 'on' : 'off'}`;
  $('optAssist').textContent = `Aim assist: ${OPTS.assist ? 'on' : 'off'}`;
  $('olBtn').textContent = S.outlines ? 'Outlines: on' : 'Outlines: off';
  $('codeBox').classList.add('hide'); $('abandon').textContent = 'Abandon run';
  $('log').innerHTML = LOG.map(m => `<div>${esc(m)}</div>`).join('') || 'Nothing yet.';
}
async function goFull() {
  const el = document.documentElement, req = el.requestFullscreen || el.webkitRequestFullscreen;
  try { if (!req) throw 0; await req.call(el); show('menu', false); setPaused(); }
  catch (e) { $('fullNote').classList.remove('hide'); $('fullNote').textContent = 'This browser will not let a page go full screen here. On iPhone, Safari only allows it for a web app added to the Home Screen from its own address.'; }
}

export function init() {
  loadOpts();
  const cv = renderer.domElement;
  cv.addEventListener('pointerdown', e => {
    if (S.paused || !S.running) return;
    if (OPTS.fieldTap && e.clientX > innerWidth * .45) { tap.id = e.pointerId; tap.x = e.clientX; tap.y = e.clientY; tap.t = performance.now(); return; }
    if (stick.id !== null) return;
    stick.id = e.pointerId; stick.ox = e.clientX; stick.oy = e.clientY; stick.x = stick.y = 0;
    const s = $('stick'); s.style.display = 'block'; s.style.left = e.clientX + 'px'; s.style.top = e.clientY + 'px';
  });
  addEventListener('pointermove', e => {
    if (e.pointerId !== stick.id) return;
    let dx = (e.clientX - stick.ox) / 50, dy = (e.clientY - stick.oy) / 50;
    const l = Math.hypot(dx, dy); if (l > 1) { dx /= l; dy /= l; }
    stick.x = dx; stick.y = dy; $('nub').style.transform = `translate(${dx * 35}px,${dy * 35}px)`;
  });
  const up = e => {
    if (e.pointerId === stick.id) { stick.id = null; stick.x = stick.y = 0; $('stick').style.display = 'none'; $('nub').style.transform = ''; }
    if (e.pointerId === tap.id) {
      tap.id = null;
      if (performance.now() - tap.t < 350 && Math.hypot(e.clientX - tap.x, e.clientY - tap.y) < 14) { const p = groundPick(e.clientX, e.clientY); if (p) sendTo('all', p.x, p.z); }
    }
  };
  addEventListener('pointerup', up); addEventListener('pointercancel', up);
  bindSpellbar(); bindOrders(); bindBook();
  $('mini').addEventListener('click', e => {
    if (!S.running || S.paused) return;
    const r = $('mini').getBoundingClientRect(), v = mapView(), x = ((e.clientX - r.left) / r.width * v.W - v.W / 2) / v.k + v.cx, z = ((e.clientY - r.top) / r.height * v.W - v.W / 2) / v.k + v.cz; sendTo('all', x, z);
  });
  addEventListener('keydown', e => {
    const k = e.key.toLowerCase(); keys[k] = 1;
    if (k === 'escape') toggleMenu();
    if (S.paused || !S.running) return;
    const n = KEYS.indexOf(e.key); if (n >= 0) castSlot(n, null);
    if (k === ' ') { e.preventDefault(); castSlot(0, null); }
    if (k === 'tab' || k === 'q') { e.preventDefault(); openBook(); }
    if (k === 'c') cycleOrder(OPTS.squads ? 0 : 'all');
    if (k === 'f') sendTo('all', S.aim.x, S.aim.z);
    if (k === 'z') S.zoom = S.zoom === 1 ? 1.6 : S.zoom === 1.6 ? .7 : 1;
    if (k === 'b' && nearCity) openCity(nearCity);
  });
  addEventListener('keyup', e => { keys[e.key.toLowerCase()] = 0; });
  // title, shop, menu, over
  $('classes').addEventListener('click', e => { const b = e.target.closest('.cls'); if (b) { OPTS.cls = b.dataset.c; saveOpts(); renderClasses(); } });
  $('btnNew').onclick = startNew;
  $('btnContinue').onclick = () => { const s = Game.loadRunSave(); if (s) { show('title', false); withLoading(() => { Game.newRun(s.seed, s); toast('Run restored.', 'good'); }); } };
  $('btnShop').onclick = () => { renderShop(); show('shop'); setPaused(); };
  $('overShop').onclick = () => { renderShop(); show('shop'); setPaused(); };
  $('overNew').onclick = () => { show('over', false); showTitle(); };
  $('shopBack').onclick = () => { show('shop', false); if (S.over) show('over'); else if (!S.running) showTitle(); setPaused(); };
  $('shopList').addEventListener('click', e => { const b = e.target.closest('[data-buy]'); if (b && Game.buyMeta(b.dataset.buy)) renderShop(); });
  $('menuBtn').onclick = toggleMenu; $('resume').onclick = toggleMenu;
  $('fullBtn').onclick = goFull;
  $('saveNow').onclick = () => toast(Game.saveRun() ? 'Run saved on this device.' : 'This browser would not save. Use a save code instead.', '');
  $('copyCode').onclick = async () => {
    Game.saveRun(); const code = await Game.exportCode(); $('codeBox').classList.remove('hide'); $('codeIn').value = code;
    try { await navigator.clipboard.writeText(code); toast('Save code copied. Keep it somewhere safe.', 'good'); } catch (e) { $('codeIn').select(); toast('Copy the code from the box.', ''); }
  };
  $('loadCode').onclick = () => { $('codeBox').classList.remove('hide'); $('codeIn').value = ''; $('codeIn').focus(); };
  const loadFrom = async (v, from) => {
    $('gen').classList.remove('hide'); await new Promise(r => setTimeout(r, 40));
    let ok = false; try { ok = await Game.importCode(v); } finally { $('gen').classList.add('hide'); }
    if (ok) { show(from, false); show('title', false); toast('Run loaded from your save code.', 'good'); } else toast('That code did not load. Make sure you copied all of it.', 'bad');
    setPaused();
  };
  $('codeGo').onclick = () => loadFrom($('codeIn').value, 'menu');
  $('tCodeBtn').onclick = () => { $('tCodeBox').classList.toggle('hide'); $('tCodeIn').focus(); };
  $('tPaste').onclick = async () => { try { $('tCodeIn').value = await navigator.clipboard.readText(); } catch (e) { toast('Paste the code into the box instead.'); } };
  $('tCodeGo').onclick = () => loadFrom($('tCodeIn').value, 'title');
  $('optSquads').onclick = () => { OPTS.squads = !OPTS.squads; saveOpts(); renderMenu(); if (S.running) { Game.setOrder('all', 'charge'); buildOrders(); } };
  $('optTap').onclick = () => { OPTS.fieldTap = !OPTS.fieldTap; saveOpts(); renderMenu(); };
  $('optAssist').onclick = () => { OPTS.assist = !OPTS.assist; saveOpts(); renderMenu(); };
  $('olBtn').onclick = () => { S.outlines = !S.outlines; renderMenu(); };
  $('zoomBtn').onclick = () => { S.zoom = S.zoom === 1 ? 1.6 : S.zoom === 1.6 ? .7 : 1; };
  $('abandon').onclick = () => { if ($('abandon').textContent !== 'Tap again to abandon') { $('abandon').textContent = 'Tap again to abandon'; return; } show('menu', false); setPaused(); Game.gameOver(); };
  $('cityBtn').onclick = () => nearCity && openCity(nearCity);
  $('cityClose').onclick = () => { show('cityPanel', false); panelCity = null; setPaused(); };
  $('plots').addEventListener('click', e => { if (e.target.closest('[data-up]')) Game.upgradeCity(panelCity); else if (e.target.closest('[data-craft]')) { const it = Game.craft(panelCity); if (it) toast(`Crafted ${it.name}. It's in your pack.`, 'good'); } else { const b = e.target.closest('[data-buy]'); if (b) Game.buyPotion(b.dataset.buy); } renderCity(); });
}
