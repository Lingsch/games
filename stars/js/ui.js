// The HUD, touch and keyboard input, nameplates, and every panel.
import * as THREE from './three.js';
import { S, WH, TAU, clamp, dist, fct, chat, X } from './core.js';
import { cam } from './render.js';
import { world, hgt, regionAt, REGION_NAMES } from './world.js';
import { CLASSES, CLASS_KEYS, FAMILIES, MOBS, QUESTS, GIVERS, ELEMENTS, RARITY, SLOTS, SLOT_NAMES, POTIONS, xpNeed, defaultBar, MAX_LVL, roleOf, rankOf, rankName, WTYPE, BASE_NAMES, SETS } from './data.js';
import * as Sea from './sea.js';
import { LORE, PERKS } from './story.js';
import { TALK, VILLAGER_LINES, MOB_LORE } from './dialogue.js';
import { QUICK } from './banter.js';
import * as Cb from './combat.js';
import * as Game from './game.js';
import * as MapUI from './mapui.js';
import * as Craft from './crafting.js';
import * as Loot5 from './loot5.js';
import { TESTIMONY } from './mystery.js';
import { SET, OPTS, setOpt, apply as applySettings } from './settings.js';
import * as P8 from './party8.js';

const $ = id => document.getElementById(id);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const RES_COL = { mana: 'var(--mana)', rage: 'var(--rage)', focus: 'var(--focus)', energy: '#f0d040', momentum: '#ff8a4a' };
const ROLE_ICON = { tank: '🛡️', healer: '✚', dps: '⚔️' };
// one icon per family, so you can tell who's who at a glance
const resName = e => e.resType === 'mana' && !(X.magicCls || []).includes(e.cls) ? 'charge' : e.resType;
export const FAMILY_ICON = { Fighter: '🛡️', Healer: '💚', Rogue: '🗡️', Mage: '🔧' };
const roleIcon = c => FAMILY_ICON[CLASSES[c].family];
export const input = { mx: 0, mz: 0, camDrag: 0, lastDragT: -99 };

// ---------- small helpers ----------
export function toast(msg) { const t = $('toast'); t.textContent = msg; t.style.opacity = 1; clearTimeout(t._t); t._t = setTimeout(() => t.style.opacity = 0, 1800); }
let errT = 0;
function err(msg) { if (!msg || msg === 'gcd' || S.time - errT < .6) return; errT = S.time; toast(msg); }
export function hurtFlash() { const f = $('hurt'); f.style.opacity = .7; clearTimeout(f._t); f._t = setTimeout(() => f.style.opacity = 0, 160); }
const pct = (a, b) => b > 0 ? clamp(a / b * 100, 0, 100) : 0;

// ---------- the hotbar ----------
const keyEls = [];
let swapPick = -1;
function buildKeys() {
  const box = $('keys'); box.innerHTML = '';
  keyEls.length = 0;
  for (let i = 0; i < 12; i++) {
    const b = document.createElement('button'); b.className = 'k'; b.innerHTML = '<span class="ic"></span><span class="sw"></span><span class="num"></span><span class="uf"></span><span class="lab"></span>';
    let pressT = 0, longT = null;
    b.addEventListener('pointerdown', ev => { ev.stopPropagation(); pressT = performance.now(); longT = setTimeout(() => { longT = null; showTip(i, b); }, 450); });
    b.addEventListener('pointerup', ev => { ev.stopPropagation(); if (longT) { clearTimeout(longT); longT = null; pressKey(i); } hideTip(); });
    b.addEventListener('pointerleave', () => { if (longT) clearTimeout(longT); longT = null; hideTip(); });
    box.appendChild(b); keyEls.push(b);
  }
}
function barOf() { return S.bar[S.heroCls] || (S.bar[S.heroCls] = defaultBar(S.heroCls)); }
// the bar shows only what you've learned, packed in your chosen order
function shownBar() {
  const h = S.hero;
  return barOf().filter(k => k && (k === 'attack' || (CLASSES[S.heroCls].abilities[k] && CLASSES[S.heroCls].abilities[k].lvl <= h.lvl)));
}
export function pressKey(i) {
  const key = shownBar()[i]; if (!key || !S.hero || S.hero.dead) return;
  const h = S.hero;
  let t = S.target;
  const ab = Cb.abilityOf(h, key);
  if ((key === 'attack' || ab?.tgt === 'enemy') && (!t || t.dead || !Cb.isEnemy(h, t))) { t = autoTarget(); if (t) setTarget(t); }
  const why = Cb.useAbility(h, key, t);
  if (why) err(why);
}
function showTip(i, el) {
  const key = shownBar()[i]; if (!key) return;
  const tip = $('tip');
  if (key === 'attack') tip.innerHTML = '<b>Auto Attack</b><br>Toggle attacking your target with your weapon.';
  else { const ab = CLASSES[S.heroCls].abilities[key]; const c = Cb.costOf(S.hero, ab); tip.innerHTML = `<b>${esc(rankName(S.hero, ab))}</b> ${ab.kind === 'ult' ? '· Ultimate' : ''}<br>${esc(ab.desc)}<br><span class="dim">${c ? c + ' ' + S.hero.resType + ' · ' : ''}${ab.cast ? ab.cast + ' s cast' : 'Instant'}${ab.cd ? ' · ' + ab.cd + ' s cooldown' : ''}</span>`; }
  const r = el.getBoundingClientRect(); tip.classList.remove('hide');
  tip.style.left = clamp(r.left - 60, 6, innerWidth - 250) + 'px'; tip.style.top = (r.top - tip.offsetHeight - 8) + 'px';
}
function hideTip() { $('tip').classList.add('hide'); }
let lastBarSig = '';
function refreshKeys(force) {
  const h = S.hero, bar = shownBar(), sig = S.heroCls + bar.join(',');
  if (force || sig !== lastBarSig) {
    lastBarSig = sig;
    // the bar is only as tall as it needs to be
    const wide = innerWidth / innerHeight >= 4 / 3, rows = wide ? 1 : Math.max(1, Math.ceil(bar.length / 6));
    document.documentElement.style.setProperty('--barH', `calc(var(--key)*${rows} + ${(rows - 1) * 4}px)`);
    keyEls.forEach((el, i) => {
      const key = bar[i];
      el.style.display = key ? '' : 'none';
      if (!key) return;
      el.classList.toggle('ultk', CLASSES[S.heroCls].abilities[key]?.kind === 'ult');
      el.querySelector('.ic').textContent = key === 'attack' ? '⚔️' : CLASSES[S.heroCls].abilities[key].icon;
      el.querySelector('.lab').textContent = key === 'attack' ? 'Attack' : (X.abName ? X.abName(S.hero, CLASSES[S.heroCls].abilities[key]) : CLASSES[S.heroCls].abilities[key].name);
      el.style.setProperty('--c', key === 'attack' ? '#c9ccd2' : kindCol(CLASSES[S.heroCls].abilities[key]));
    });
  }
  bar.forEach((key, i) => {
    const el = keyEls[i];
    if (key === 'attack') { el.classList.toggle('on', h.autoOn); el.querySelector('.sw').style.setProperty('--p', '0%'); el.querySelector('.num').textContent = ''; return; }
    const ab = CLASSES[S.heroCls].abilities[key];
    const cd = h.cds[key] || 0;
    const why = Cb.cantUse(h, key, S.target);
    el.classList.toggle('no', (why && why.startsWith('Not enough')) || (ab.kind === 'ult' && h.ult < 100));
    el.classList.toggle('oor', why === 'Out of range' || why === 'Not in line of sight' || why === 'Must be behind the target');
    el.classList.toggle('ultready', ab.kind === 'ult' && h.ult >= 100);
    const p = cd > 0 ? cd / ab.cd : (ab.gcd !== false && h.gcdT > 0 ? h.gcdT / 1.5 : 0);
    el.querySelector('.sw').style.setProperty('--p', (p * 100).toFixed(1) + '%');
    el.querySelector('.num').textContent = cd > 1 ? Math.ceil(cd) : '';
    el.querySelector('.uf').style.width = ab.kind === 'ult' ? h.ult + '%' : '0';
  });
}
const kindCol = ab => ({ attack: '#ff8a5a', heal: '#7dff7a', buff: '#8fd0ff', util: '#e0d0ff', ult: '#ffd34d' }[ab.kind]);

// ---------- targeting ----------
export function setTarget(t) { S.target = t; }
function autoTarget() {
  const h = S.hero;
  const list = S.ents.filter(e => !e.dead && e.mob && !e.evading && dist(e, h) < 30).sort((a, b) => (b.engaged && [...b.threat.keys()].some(k => S.party.includes(k)) ? 1 : 0) - (a.engaged && [...a.threat.keys()].some(k => S.party.includes(k)) ? 1 : 0) || dist(a, h) - dist(b, h));
  return list[0] || null;
}
let cycleList = [], cycleT = 0;
export function cycleTarget() {
  const h = S.hero;
  if (S.time - cycleT > 3 || !cycleList.length) {
    const fwd = S.camYaw;
    cycleList = S.ents.filter(e => !e.dead && e.mob && !e.evading && dist(e, h) < 40).map(e => ({ e, s: dist(e, h) * (1 + Math.abs(Math.atan2(Math.sin(Math.atan2(e.x - h.x, e.z - h.z) - fwd), Math.cos(Math.atan2(e.x - h.x, e.z - h.z) - fwd))) * .6) - (e.engaged ? 15 : 0) })).sort((a, b) => a.s - b.s).map(o => o.e);
  }
  cycleT = S.time;
  if (!cycleList.length) { toast('No enemies near'); return; }
  const i = cycleList.indexOf(S.target);
  setTarget(cycleList[(i + 1) % cycleList.length]);
}

// ---------- input: joystick, camera drag, taps ----------
const v3 = new THREE.Vector3();
function screenOf(e, yOff = 1) { v3.set(e.rx ?? e.x, e.y + yOff * (e.scale || 1), e.rz ?? e.z).project(cam); return { x: (v3.x + 1) / 2 * innerWidth, y: (1 - v3.y) / 2 * innerHeight, behind: v3.z > 1 }; }
function pickAt(x, y) {
  let best = null, bd = 1e9;
  for (const e of S.ents) {
    if (e.remove || e === S.hero || e.mount) continue;
    if (e.dead && !(e.mob && e.loot?.length && e.lootFor === 'party') && !(e.cls && e.inParty)) continue;
    if (dist(e, S.hero) > 70) continue;
    const s = screenOf(e, e.mob ? .9 : 1); if (s.behind) continue;
    const dd = Math.hypot(s.x - x, s.y - y), lim = 56 * SET.tapSens * Math.max(1, e.scale || 1) + 18 * (e.boss ? 2 : 0);
    if (dd < lim && dd + dist(e, S.hero) * .5 < bd) { bd = dd + dist(e, S.hero) * .5; best = e; }
  }
  return best;
}
const touches = new Map();
let joyId = null, joyO = null;
function onDown(ev) {
  if (ev.target.closest('button,#sheet,#title,.pf,#mini,#death,#tgt,#bigmap,#huntTag,#track .go')) return;
  const p = { id: ev.pointerId, x0: ev.clientX, y0: ev.clientY, x: ev.clientX, y: ev.clientY, t: performance.now(), moved: 0 };
  // the joystick lives in the bottom-left corner: only touches that start on it move you; everywhere else is for tapping and turning
  const j = $('joy'), r = j.getBoundingClientRect(), jc = { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  if (joyId === null && Math.hypot(ev.clientX - jc.x, ev.clientY - jc.y) < r.width * .75) {
    joyId = ev.pointerId; joyO = jc; j.classList.add('on'); p.joy = true;
    const jm = 46 * SET.joySize, jx = clamp(ev.clientX - jc.x, -jm, jm), jy = clamp(ev.clientY - jc.y, -jm, jm); j.firstChild.style.transform = `translate(${jx}px,${jy}px)`; input.mx = jx / jm; input.mz = jy / jm;
  }
  touches.set(ev.pointerId, p);
}
function onMove(ev) {
  const p = touches.get(ev.pointerId); if (!p) return;
  const dx = ev.clientX - p.x, dy = ev.clientY - p.y; p.x = ev.clientX; p.y = ev.clientY; p.moved += Math.abs(dx) + Math.abs(dy);
  if (p.joy) {
    let jx = ev.clientX - joyO.x, jy = ev.clientY - joyO.y; const l = Math.hypot(jx, jy), m = 46 * SET.joySize;
    if (l > m) { jx *= m / l; jy *= m / l; }
    $('joy').firstChild.style.transform = `translate(${jx}px,${jy}px)`;
    input.mx = jx / m; input.mz = jy / m;
    return;
  }
  // two fingers on the right side pinch-zoom; one finger turns the camera
  const others = [...touches.values()].filter(o => !o.joy);
  if (others.length >= 2) {
    const [a, b] = others, dd = Math.hypot(a.x - b.x, a.y - b.y);
    if (input.pinch) S.camDist = clamp(S.camDist * input.pinch / dd, 3.5, 16);
    input.pinch = dd; return;
  }
  if (p.moved > 14 && (ev.pointerType !== 'mouse' || ev.buttons)) {
    S.camYaw -= dx * .006 * SET.camSpeed; S.camPitch = clamp(S.camPitch + dy * .004 * SET.camSpeed, -.15, 1.15); input.lastDragT = S.time;
  }
}
function onUp(ev) {
  const p = touches.get(ev.pointerId); touches.delete(ev.pointerId);
  if ([...touches.values()].filter(o => !o.joy).length < 2) input.pinch = null;
  if (!p) return;
  if (p.joy) { joyId = null; input.mx = input.mz = 0; $('joy').classList.remove('on'); $('joy').firstChild.style.transform = ''; return; }
  if (p.moved < 18 * SET.tapSens && performance.now() - p.t < 550 * Math.max(1, SET.tapSens)) {
    const e = pickAt(ev.clientX, ev.clientY);
    if (e) tapEntity(e); else if (S.target) { S.target = null; }
  }
}
function tapEntity(e) {
  if (S.target === e) {
    // a second tap on someone acts: talk, loot, attack
    if (e.team === 'npc') interact(e);
    else if (e.mob && e.dead) openLoot(e);
    else if (e.mob && !S.hero.autoOn) Cb.useAbility(S.hero, 'attack', e);
  }
  setTarget(e);
}
const keys = {};
function onKey(ev, down) {
  if (ev.target.tagName === 'INPUT' || ev.target.tagName === 'TEXTAREA') return;
  const k = ev.key.toLowerCase(); keys[k] = down;
  if (!down) return;
  if (k === 'tab') { ev.preventDefault(); cycleTarget(); }
  const map = '1234567890-='; const i = map.indexOf(k); if (i >= 0 && S.running && !sheetOpen()) pressKey(i);
  if (k === 'escape') { if (!$('sheet').classList.contains('hide')) closeSheet(); else S.target = null; }
  if (k === 'f') doAct();
  if (k === 'm') { if (MapUI.isOpen()) MapUI.closeBig(); else openMap(); }
  if (k === 'b') openBook('char'); if (k === 'l') openBook('quests'); if (k === 'o') openBook('social'); if (k === 'p') openBook('spells');
  if (k === 'x') toggleSit();
}
export function pollInput() {
  let mx = input.mx, mz = input.mz;
  if (keys.w || keys.arrowup) mz -= 1; if (keys.s || keys.arrowdown) mz += 1;
  if (keys.a) mx -= 1; if (keys.d) mx += 1;
  if (keys.q || keys.arrowleft) { S.camYaw += .04; input.lastDragT = S.time; } if (keys.e || keys.arrowright) { S.camYaw -= .04; input.lastDragT = S.time; }
  const l = Math.hypot(mx, mz); if (l > 1) { mx /= l; mz /= l; }
  return { mx, mz };
}
function toggleSit() { const h = S.hero; if (h.dead) return; if (Cb.inCombat(h) && !h.sit) { err("You can't rest in combat"); return; } h.sit = !h.sit; h.casting = null; }

// ---------- context action (talk / loot / corpse) ----------
let actFn = null;
function doAct() { if (actFn) actFn(); }
function updateAct() {
  const h = S.hero, b = $('act');
  let label = null; actFn = null;
  if (h.dead) { b.classList.add('hide'); return; }
  const sa = (h.onBoat || Sea.sea.fish) ? Sea.action() : null;
  if (sa) { label = sa.label; actFn = sa.fn; }
  else if (S.corpse && S.corpse.ent && dist(h, S.corpse) < 6) { label = 'Recover your gear'; actFn = () => Game.lootCorpse(); }
  else {
    const t = S.target;
    if (t && t.prop && dist(h, t) < 6 && Game.inspectLabel(t)) { label = Game.inspectLabel(t); actFn = () => { propUse(Game.inspect(t)); }; }
    else if (t && (t.team === 'npc' || t.guard) && !t.corpse && !t.prop && !t.vanity && dist(h, t) < 7) { label = 'Talk to ' + t.name.split(' ')[0]; actFn = () => interact(t); }
    else if (t && t.mob && t.dead && t.loot?.length && t.lootFor === 'party' && dist(h, t) < 7) { label = 'Loot'; actFn = () => openLoot(t); }
    else {
      const body = S.ents.find(e => e.mob && e.dead && e.lootFor === 'party' && (e.loot?.length) && dist(e, h) < 5);
      const pr = !body && S.ents.find(e => e.prop && !e.remove && dist(e, h) < 4.5 && Game.inspectLabel(e));
      if (pr) { label = Game.inspectLabel(pr); actFn = () => { propUse(Game.inspect(pr)); }; }
      else if (body) { label = 'Loot ' + body.name; actFn = () => openLoot(body); }
      else { const n = S.ents.find(e => e.team === 'npc' && !e.corpse && !e.prop && !e.vanity && !e.remove && dist(e, h) < 4.5); if (n) { label = (n.bindstone ? 'Bind here' : 'Talk to ' + n.name.split(' ')[0]); actFn = () => interact(n); } }
    }
    if (!label) { const a = Sea.action(); if (a) { label = a.label; actFn = a.fn; } }
  }
  b.classList.toggle('hide', !label); if (label && b.textContent !== label) b.textContent = label;
}
// what using a prop opens: a lore page, or a crafting station
function propUse(r) { if (!r) return; if (r.station) openCraft(r.station); else openLore(r); }
function interact(n) {
  if (n.vanity) return;
  if (dist(S.hero, n) > 8) { toast('Too far away'); return; }
  if (n.prop) { propUse(Game.inspect(n)); return; }
  if (n.bindstone) { S.bind = { zone: S.zone, x: n.x, z: n.z + 1.5 }; const pl = placeAt(n.x, n.z); chat('sys', null, 'You are bound here.'); toast('Bound to ' + (pl ? pl.name : world.names.town)); Game.save(); return; }
  if (n.corpse) return;
  if (n.team === 'npc' || n.guard) openTalk(n);
}

// ---------- frames ----------
const partyEls = [];
function frameRes(e) { return e.resType === 'mana' ? `${Math.round(e.res)} / ${e.resMax}` : `${Math.round(e.res)} ${resName(e)}`; }
// buff and debuff icons: debuffs get a red rim, long buffs about to run out fade and pulse
const isDebuff = b => b.src && (b.src.mob || b.src.team === 'enemy') && !b.src.charmed;
function buffRow(u, max) {
  return u.buffs.filter(b => (b.dur > 1 || isDebuff(b)) && !b.id.includes(':') && b.id !== 'wardlock').slice(0, max)
    .map(b => `<span class="${isDebuff(b) ? 'deb' : ''}${b.dur >= 60 && b.t < 30 ? ' low' : ''}">${BUFF_ICON[b.id] || '•'}${b.data.stacks ? b.data.stacks : ''}</span>`).join('');
}
function updateFrames() {
  const h = S.hero;
  { const tt = Game.heroTitle(); const nm = tt ? (tt.startsWith('of ') || tt.startsWith('the ') ? `${h.name} ${tt}` : `${h.name} ${tt}`) : h.name; if ($('meName').textContent !== nm) $('meName').textContent = nm; } $('meLvl').textContent = `${h.lvl} ${CLASSES[h.cls].name}`;
  $('meHp').style.width = pct(h.hp, h.maxHp) + '%'; $('meHpT').textContent = `${Math.ceil(h.hp)} / ${h.maxHp}`;
  $('meRes').style.width = pct(h.res, h.resMax) + '%'; $('meRes').style.background = RES_COL[h.resType]; $('meResT').textContent = frameRes(h);
  const bs = buffRow(h, 12) + (S.corpse ? '<span>🪦</span>' : '');
  if ($('buffs')._s !== bs) { $('buffs').innerHTML = bs; $('buffs')._s = bs; }
  // party
  const box = $('party'), mates = S.party.filter(p => !p.isHero);
  while (partyEls.length < mates.length) {
    const d = document.createElement('div'); d.className = 'pf plate';
    d.innerHTML = '<div class="fname"><b></b><small></small></div><div class="bar"><i style="background:var(--hp)"></i></div><div class="bar thin"><i></i></div><span class="cast"></span><div class="pbuffs"></div>';
    d.addEventListener('click', () => { const p = d._p; if (p) setTarget(p); });
    box.appendChild(d); partyEls.push(d);
  }
  partyEls.forEach((d, i) => {
    const p = mates[i]; d.style.display = p ? '' : 'none'; d._p = p; if (!p) return;
    d.style.setProperty('--c', CLASSES[p.cls].color);
    d.querySelector('b').textContent = roleIcon(p.cls) + ' ' + p.name; d.querySelector('small').textContent = p.lvl;
    d.querySelectorAll('i')[0].style.width = pct(p.hp, p.maxHp) + '%'; const ri = d.querySelectorAll('i')[1]; ri.style.width = pct(p.res, p.resMax) + '%'; ri.style.background = RES_COL[p.resType];
    d.classList.toggle('dead', p.dead); d.classList.toggle('sel', S.target === p);
    d.querySelector('.cast').textContent = p.dead ? '💀' : p.casting ? '✦' : p.sit ? 'z' : '';
    { const pb = d.querySelector('.pbuffs'), bh = p.dead ? '' : buffRow(p, 10); if (pb._s !== bh) { pb.innerHTML = bh; pb._s = bh; } }
    const aggro = !p.dead && S.ents.some(m => m.mob && !m.dead && m.target === p && m.engaged) && roleOf(p) !== 'tank';
    if (aggro && !d.querySelector('.aggro')) { const a = document.createElement('span'); a.className = 'aggro'; d.appendChild(a); } else if (!aggro) d.querySelector('.aggro')?.remove();
  });
  let cmds = $('cmds');
  if (mates.length && !cmds) { cmds = document.createElement('div'); cmds.id = 'cmds'; cmds.innerHTML = ['follow', 'assist', 'hold', 'pull', 'clear', 'hunt'].map(c => `<button data-c="${c}">${{ follow: 'Follow', assist: 'Assist', hold: 'Hold', pull: 'Pull', clear: 'Clear', hunt: 'Hunt' }[c]}</button>`).join('') + '<button data-c="say" class="say1">💬</button>'; cmds.onclick = ev => { const c = ev.target.closest('button')?.dataset.c; if (c === 'say') openSay(); else if (c) Game.partyCommand(c); }; box.appendChild(cmds); }
  if (cmds) { cmds.style.display = mates.length ? '' : 'none'; if (cmds.parentElement !== box || cmds.nextElementSibling?.classList.contains('pf')) box.appendChild(cmds); /* re-appending every frame ate mouse clicks on PC */ cmds.querySelectorAll('button').forEach(b => b.classList.toggle('on', b.dataset.c === S.cmd)); }
  // target
  const t = S.target, tf = $('tgt');
  if (!t || t.remove) { tf.classList.add('hide'); }
  else {
    tf.classList.remove('hide');
    const con = t.mob ? Cb.conColor(h.lvl, t.lvl) : t.team === 'npc' ? '#ffd34d' : CLASSES[t.cls]?.color || '#fff';
    $('tgtName').textContent = (t.cls ? roleIcon(t.cls) + ' ' : '') + t.name + (t.dead ? ' (dead)' : ''); $('tgtName').style.color = con;
    $('tgtLvl').textContent = t.team === 'npc' ? '' : (t.boss ? 'Boss ' : t.named ? 'Named ' : t.elite ? 'Elite ' : '') + (t.lvl ? 'L' + t.lvl : '');
    $('tgtHp').parentElement.classList.toggle('hide', t.team === 'npc');
    $('tgtHp').style.width = pct(t.hp, t.maxHp) + '%'; $('tgtHpT').textContent = t.team === 'npc' ? '' : t.mob ? Math.round(pct(t.hp, t.maxHp)) + '%' : `${Math.ceil(t.hp)} / ${t.maxHp}`;
    $('tgtResW').classList.toggle('hide', !t.cls); if (t.cls) { $('tgtRes').style.width = pct(t.res, t.resMax) + '%'; $('tgtRes').style.background = RES_COL[t.resType]; }
    let info = '';
    if (t.mob) { const M = MOBS[t.mob]; info = [M.undead ? 'Undead' : M.beast ? 'Beast' : M.human ? 'Humanoid' : 'Monster', t.evading ? 'Evading' : ''].filter(Boolean).join(' · '); $('tgtWeak').innerHTML = M.weak ? `Weak ${ELEMENTS[M.weak]}${M.resist ? ' Resists ' + ELEMENTS[M.resist] : ''}` : ''; }
    else if (t.cls) { info = `${CLASSES[t.cls].name}${t.fake?.guild ? ' · <' + t.fake.guild + '>' : ''}`; $('tgtWeak').textContent = t.fake?.friend ? '★ Friend' : ''; }
    else if (t.pet) { info = 'Serves ' + t.pet.owner.name; $('tgtWeak').textContent = ''; }
    else { $('tgtWeak').textContent = ''; info = t.title || ''; }
    if (t.mob) {
      if (t.charmed) info = 'Charmed · ' + Math.ceil(t.charmed.until - S.time) + ' s';
      const cc = t.buffs.find(b => b.data.mez || b.data.stun);
      if (cc) info += (info ? ' · ' : '') + (cc.data.mez ? 'Asleep ' : 'Stunned ') + Math.ceil(cc.t) + ' s';
      const st = Cb.poisonStacks(t, h); if (st) info += ` · ☣${st}`;
      if (Object.values(CLASSES[h.cls].abilities).some(a => a.behind) && !t.dead) info += Cb.behind(h, t) ? ' · behind ✓' : ' · get behind';
    }
    $('tgtInfo').textContent = info;
    const cast = t.mcast || t.casting, cb = $('tgtCast');
    cb.classList.toggle('hide', !cast);
    if (cast) { cb.firstElementChild.style.width = pct(cast.t, cast.total) + '%'; cb.lastElementChild.textContent = t.mcast ? (t.mcast.kind === 'heal' ? 'Healing chant' : 'Shadow bolt') : Cb.abilityOf(t, cast.key)?.name || ''; }
    const tot = t.target && !t.dead ? t.target : null;
    $('tot').textContent = tot ? '→ ' + tot.name : '';
    // buttons: invite, friend, kick
    let btns = '';
    if (t.fake && !t.inParty && !t.dead) btns = `<button data-a="inv">Invite</button><button data-a="fr">${t.fake.friend ? 'Unfriend' : 'Friend'}</button>`;
    else if (t.fake && t.inParty) btns = `<button data-a="fr">${t.fake.friend ? 'Unfriend' : 'Friend'}</button><button data-a="kick">Remove</button>`;
    else if ((t.team === 'npc' || t.guard) && !t.corpse && !t.prop) btns = `<button data-a="talk">${t.bindstone ? 'Bind' : 'Talk'}</button>`;
    else if (t.mob && t.dead && t.loot?.length && t.lootFor === 'party') btns = `<button data-a="loot">Loot</button>`;
    if (!t.prop && !t.corpse && !(t.mob && t.dead)) btns += '<button data-a="insp">Inspect</button>';
    if ($('tgtBtns')._s !== btns) { $('tgtBtns').innerHTML = btns; $('tgtBtns')._s = btns; }
    // threat is kept hidden: tanking is read from the fight, not a meter
  }
  // quest tracker under the target frame
  const tr = $('track'), r = tf.classList.contains('hide') ? null : tf.getBoundingClientRect();
  tr.style.top = (r && (innerWidth / innerHeight < 4 / 3) ? r.bottom + 6 : (parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--st')) || 6) + 112) + 'px';
  { const mb = $('mapbox').getBoundingClientRect().bottom + 6; if (innerWidth / innerHeight >= 4 / 3 || parseFloat(tr.style.top) < mb) tr.style.top = mb + 'px'; }
  const qs = QUESTS.filter(q => S.quests[q.id] && S.quests[q.id].state !== 'turned').sort((a, b) => (b.story ? 1 : 0) - (a.story ? 1 : 0)).slice(0, 3);
  const tq = qs.map(q => { const st = S.quests[q.id]; return st.state === 'done' ? `<div class="go" data-q="${q.id}">${esc(q.name)}: <b>⤴ ${esc(GIVERS[Game.turnToOf(q)].name.split(' ').pop())}</b></div>` : `<div>${esc(q.name)}: <b>${q.obj.at ? 'travel' : st.n + '/' + q.obj.n}</b></div>`; }).join('');
  if (tr._s !== tq) { tr.innerHTML = tq; tr._s = tq; }
  // xp, cast bar
  $('xpFill').style.width = h.lvl >= MAX_LVL ? '100%' : pct(h.xp, xpNeed(h.lvl)) + '%';
  const c = h.casting; $('castbar').classList.toggle('hide', !c);
  if (c) { $('castName').textContent = Cb.abilityOf(h, c.key).name + (c.tgt && c.tgt !== h ? ' → ' + c.tgt.name : ''); $('castFill').style.width = pct(c.t, c.total) + '%'; }
  $('hpotN').textContent = S.pots.hpot; $('mpotN').textContent = S.pots.mpot;
  const pcd = h.cds.pot || 0; for (const id of ['hpotBtn', 'mpotBtn']) { let cd = $(id).querySelector('.cd'); if (pcd > 0 && !cd) { cd = document.createElement('span'); cd.className = 'cd'; $(id).appendChild(cd); } else if (pcd <= 0 && cd) cd.remove(); }
  $('sitBtn').textContent = h.sit ? '🧍' : '🪑';
  const qn = QUESTS.filter(q => S.quests[q.id]?.state === 'done').length;
  if (qn) $('bookBtn').dataset.n = qn; else delete $('bookBtn').dataset.n;
}
const BUFF_ICON = { scroll: '📜', mounted: '🏍️', guildbanner: '🏳️', fed: '🍖', elixir: '🧪', frenzy: '😡', boneshield: '🦴', webbed: '🕸️', shout: '🎺', iron: '⚙️', fort: '🛐', inner: '🔆', eagle: '🦅', trueshot: '🎖️', kindle: '🕯️', eward: '🔮', shieldwall: '🧱', unbreak: '⛰️', moon: '🌙', deadeye: '👁️', slow: '🐌', root: '📌',
  focusmind: '🎯', wolfspirit: '🐺', markwild: '🐾', poisonblades: '🗡️', restsong: '🎼', hastesong: '🥁', haste: '⏩', ward: '🛡️', shelter: '🔯', renew: '🌱', rejuv: '🍃', wild: '🌳', regrowth: '🍀',
  bear: '🐻', cat: '🐆', chain: '🤺', untouch: '🌪️', crescendo: '🎺', empower: '💪', unbound: '🌋', treeoflife: '🌲', guard: '🛡️', evade: '💨', shadowstep: '🌑', fists: '👐', crescendo2: '🎶' };
for (const c in CLASSES) for (const [k, a] of Object.entries(CLASSES[c].abilities)) if (!BUFF_ICON[k]) BUFF_ICON[k] = a.icon;

// ---------- chat ----------
function updateChat() {
  if (!S.logDirty && S.frame % 30) return;
  S.logDirty = false;
  const lines = S.log.slice(-4), box = $('chat');
  const html = lines.map(l => `<div class="ch-${l.ch} ${S.time - l.t > 25 ? 'old' : ''}">${l.from ? `<b>${l.ch === 'gen' ? '[General] ' : l.ch === 'guild' ? '[Guild] ' : l.ch === 'whisper' ? '' : ''}${esc(l.from)}${l.ch === 'whisper' ? ' whispers' : ''}${l.ch === 'say' ? ' says' : ''}:</b> ` : ''}${esc(l.text)}</div>`).join('');
  if (box._s !== html) { box.innerHTML = html; box._s = html; }
}

// ---------- nameplates and floating text ----------
const plates = [], fctEls = [];
function updatePlates(dt) {
  const box = $('plates'), h = S.hero;
  const list = [];
  for (const e of S.ents) {
    if (e.remove || e === h || e.mount) continue;
    const dd = dist(e, h); if (dd > 45) continue;
    if (e.dead && !(e.mob && e.loot?.length && e.lootFor === 'party')) continue;
    if (e.mob && !(e === S.target || (e.engaged && [...e.threat.keys()].some(k => S.party.includes(k))) || e.named || e.boss) && !e.dead) continue;
    if (e.guard && dd > 15) continue;
    if (e.prop && (dd > (e.prop.node || e.prop.station ? 10 : 22) || !Game.inspectLabel(e))) continue;
    list.push(e);
  }
  list.sort((a, b) => dist(a, h) - dist(b, h)); list.length = Math.min(list.length, 26);
  while (plates.length < list.length) { const d = document.createElement('div'); d.className = 'np'; box.appendChild(d); plates.push(d); }
  const placed = [];
  plates.forEach((d, i) => {
    const e = list[i]; if (!e) { d.style.display = 'none'; return; }
    const s = screenOf(e, (e.mob ? 2.1 : 2.25) * (e.boss ? 1.4 : 1));
    if (s.behind || s.x < -50 || s.x > innerWidth + 50) { d.style.display = 'none'; return; }
    // nudge labels up so close neighbours don't print over each other
    const w = Math.min(160, e.name.length * 6.5 + 10), hh = 14;
    let y = s.y;
    for (let tries = 0; tries < 6; tries++) { const hit = placed.find(p => Math.abs(p.x - s.x) < (p.w + w) / 2 && Math.abs(p.y - y) < hh); if (!hit) break; y = hit.y - hh; }
    placed.push({ x: s.x, y, w });
    d.style.display = ''; d.style.left = s.x + 'px'; d.style.top = y + 'px';
    let html = '', col = '#fff';
    if (e.team === 'npc') {
      let mk = '';
      if (e.giver) mk = questMark(e.giver);
      col = e.corpse || e.prop ? '#8dffef' : '#ffd34d';
      if (e.prop) { html = `✦ ${esc(e.name)}`; if (d._s !== html) { d.innerHTML = html; d._s = html; } d.style.color = col; d.style.opacity = clamp(1.4 - dist(e, h) / 25, .4, 1); return; }
      html = `${mk ? `<span class="mk">${mk}</span>` : ''}${esc(e.name)}${e.title ? `<small>${esc(e.title)}</small>` : ''}`;
    } else if (e.mob) {
      col = e.dead ? '#cfcfcf' : Cb.conColor(h.lvl, e.lvl);
      html = `${e.dead ? '✦ ' : ''}${esc(e.name)}${e.dead ? '' : `<div class="bar"><i style="width:${pct(e.hp, e.maxHp)}%;background:var(--hp)"></i></div>`}`;
    } else {
      col = e.inParty ? '#8fd0ff' : e.guard ? '#c9ccd2' : '#e8e0c8';
      html = `${e.cls ? roleIcon(e.cls) + ' ' : ''}${esc(e.name)}${e.fake?.guild && !e.inParty && dist(e, h) < 18 ? `<small>&lt;${esc(e.fake.guild)}&gt;</small>` : ''}`;
    }
    if (e === S.target) col = '#fff';
    if (d._s !== html) { d.innerHTML = html; d._s = html; }
    d.style.color = col; d.style.opacity = e === S.target ? 1 : clamp(1.4 - dist(e, h) / 40, .35, 1);
  });
  // combat text floats up and fades
  for (let i = fct.length - 1; i >= 0; i--) { fct[i].t += dt; if (fct[i].t > 1.1) fct.splice(i, 1); }
  while (fctEls.length < fct.length) { const d = document.createElement('div'); d.className = 'ft'; box.appendChild(d); fctEls.push(d); }
  fctEls.forEach((d, i) => {
    const f = fct[i]; if (!f) { d.style.display = 'none'; return; }
    const s = screenOf(f.e, 2); if (s.behind) { d.style.display = 'none'; return; }
    d.style.display = ''; d.style.left = (s.x + f.ox) + 'px'; d.style.top = (s.y - f.t * 60) + 'px'; d.style.opacity = 1 - Math.max(0, f.t - .6) / .5;
    if (d.textContent !== f.text) d.textContent = f.text; d.style.color = f.col; d.classList.toggle('big', f.big);
  });
}

// ---------- minimap ----------
let zoneName = '';
const placeAt = (x, z) => (world.places || []).find(p => Math.hypot(x - p.x, z - p.z) < p.R);
export function questMark(k) {
  if (Game.turnInsFor(k).length) return '?';
  return Game.nextOffer(k) ? '!' : '';
}
function updateMini() {
  if (S.frame % 3) return;
  MapUI.drawMini($('mini'));
  const h = S.hero, pl = placeAt(h.x, h.z), zn = pl ? pl.name : REGION_NAMES()[regionAt(h.x, h.z)] || world.names.zone;
  if (zn !== zoneName) { if (zoneName) toast(zn); zoneName = zn; $('zone').textContent = zn; }
  const hi = Game.huntInfo(), tag = $('huntTag');
  tag.classList.toggle('hide', !hi);
  if (hi) { const t = hi.zone ? `🏹 ${hi.zone.name}${hi.rest ? ' · resting' : hi.wait ? ' · waiting' : ''}` : '🏹 Hunting: no enemies here'; if (tag.textContent !== t) tag.textContent = t; }
}

// ---------- panels ----------
let sheetRender = null;
export function openSheet(title, render) { $('sheetTitle').textContent = title; sheetRender = render; $('sheet').classList.remove('hide'); refreshSheet(); }
export function refreshSheet() { if (!sheetRender) return; const st = $('sheetBody').scrollTop; $('sheetBody').innerHTML = ''; sheetRender($('sheetBody')); $('sheetBody').scrollTop = st; }
export function closeSheet() { $('sheet').classList.add('hide'); sheetRender = null; swapPick = swapPick; }
const sheetOpen = () => !$('sheet').classList.contains('hide');
function el(html) { const d = document.createElement('div'); d.innerHTML = html; return d.firstElementChild || d; }
Object.assign(X.ui, { el, esc, toast, openSheet, refreshSheet, closeSheet, openBook: t => openBook(t), openTalk: n => openTalk(n), refreshKeys: f => refreshKeys(f) });
function itemHtml(it, cmp) {
  const rc = RARITY[it.rarity].c, s = it.stats;
  const st = Object.entries(s).map(([k, v]) => { const dlt = cmp ? v - (cmp.stats[k] || 0) : 0; return `<span>${{ sta: 'Stamina', pow: 'Power', crit: 'Crit %', arm: 'Armor' }[k]} ${v}${cmp && dlt ? ` <i class="${dlt > 0 ? 'up' : 'down'}">${dlt > 0 ? '+' : ''}${Math.round(dlt * 10) / 10}</i>` : ''}</span>`; }).join('');
  if (cmp) for (const k in cmp.stats) if (!(k in s)) { }
  return `<b>${esc(it.name)}</b> <span class="dim">· ${SLOT_NAMES[it.slot]}${it.armorType ? ' · ' + it.armorType : it.type && it.type !== it.slot ? ' · ' + it.type : ''} · L${it.lvl}${it.crafted ? ' · crafted' : ''}</span><div class="st">${st}</div>${it.desc ? `<div style="font-size:12px;color:#d8c890">${esc(it.desc)}</div>` : ''}${it.ench ? `<div class="dim" style="font-size:11.5px;color:#8affff">✨ ${esc(it.ench.name)}</div>` : ''}${it.set && SETS[it.set] ? `<div style="font-size:11.5px;color:#d8b24a">Set: ${esc(SETS[it.set].name)}. ${esc(SETS[it.set].desc)}</div>` : ''}`;
}
let bookTab = 'char';
export function openBook(tab) {
  if (tab) bookTab = tab;
  openSheet('Book', body => {
    const extra = X.book.filter(b => !b[3] || b[3]());
    const tabs = el(`<div class="tabs">${[['char', 'Character'], ['spells', 'Abilities'], ['quests', 'Quests'], ['bags', 'Bags'], ['trade', 'Trade'], ['lore', 'Lore'], ['social', 'Social'], ...extra].filter(t => !(X.hideTabs || []).includes(t[0])).map(([k, n]) => `<button data-t="${k}" class="${bookTab === k ? 'on' : ''}">${n}</button>`).join('')}</div>`);
    tabs.onclick = ev => { const t = ev.target.dataset.t; if (t) { bookTab = t; refreshSheet(); } };
    body.appendChild(tabs);
    const fns = { char: tabChar, spells: tabSpells, quests: tabQuests, bags: tabBags, lore: tabLore, social: tabSocial, trade: tabTrade }; for (const b of extra) fns[b[0]] = b[2];
    (fns[bookTab] || tabChar)(body);
  });
}
// ---------- weapons: equip a class's weapon to play it ----------
const WICON = { duskblade: '🩸', reliquary: '⚱️', duskknife: '🗡️', skullcase: '💀', lampblade: '🔆', lantern: '🏮', shortblade: '🗡️', cannon: '💥', injector: '💉', mace: '🔨', staff: '🪄', bow: '🏹', blade: '⚔️', greatsword: '🗡️', wraps: '👊', dagger: '🔪', rapier: '🤺', wand: '✨' };
export const weaponOf = k => `${BASE_NAMES.weapon[WTYPE[k][0]][0]} & ${BASE_NAMES.off[WTYPE[k][1]][0]}`;
const wIcon = k => WICON[WTYPE[k][0]] || '⚔️';
function weaponRack(body) {
  const own = CLASS_KEYS.filter(k => Game.owns(k)), lock = CLASS_KEYS.filter(k => !Game.owns(k));
  const card = el(`<div class="card"><h3>Your weapons</h3>
    ${S.unlockPicks > 0 ? `<div class="acts" style="margin:4px 0 8px"><button class="pri" data-a="pick">⭐ Choose your new weapon (${S.unlockPicks})</button></div>` : ''}
    <div class="wrack">${own.map(k => { const c = CLASSES[k], on = k === S.heroCls, w = S.gear[k]?.weapon; return `<div class="wpn ${on ? 'on' : ''}" style="--c:${c.color}"><span class="wi">${wIcon(k)}</span><div style="flex:1;min-width:0"><b>${esc(w ? w.name : weaponOf(k))}</b><small>${roleIcon(k)} ${c.name} · level ${Game.levelOf(k)}</small></div>${on ? '<span class="dim" style="font-size:12px">Equipped</span>' : `<button data-eq="${k}">Equip</button>`}</div>`; }).join('')}</div>
    <div class="acts" style="margin-top:6px"><button data-a="friends">👥 Crew classes and jobs</button></div>
    </div>`);
  card.onclick = ev => {
    const b = ev.target.closest('button'); if (!b) return;
    if (b.dataset.a === 'pick') { openWeaponPick(); return; }
    if (b.dataset.a === 'friends') { openFriendPick(false); return; }
    if (b.dataset.eq && Game.switchClass(b.dataset.eq)) { refreshKeys(true); openFriendPick(false, true); }
  };
  body.appendChild(card);
}
export function openWeaponPick() {
  if (!(S.unlockPicks > 0)) { openBook('char'); return; }
  let sel = null;
  openSheet('The weapon rack', body => {
    const ch = Game.weaponChoices();
    const fams = FAMILIES.filter(f => ch.some(k => CLASSES[k].family === f));
    body.appendChild(el(`<p style="margin-top:0">Choose one.</p>`));
    for (const f of fams) {
      body.appendChild(el(`<p style="margin:8px 0 3px;font:700 12px Orbitron;color:var(--acc)">${FAMILY_ICON[f]} ${X.famPl?.[f] || f + 's'}</p>`));
      for (const k of ch.filter(k => CLASSES[k].family === f)) {
        const c = CLASSES[k];
        const card = el(`<div class="card cls ${sel === k ? 'on' : ''}" style="--c:${c.color}"><div class="ic">${wIcon(k)}</div><div style="flex:1"><b style="color:${c.color}">${weaponOf(k)}</b> <span class="dim">· ${c.name} · ${c.role}</span><p style="margin:1px 0">${esc(c.blurb)}</p></div></div>`);
        card.onclick = () => { sel = k; refreshSheet(); };
        body.appendChild(card);
      }
    }
    const b = el(`<div class="acts" style="position:sticky;bottom:0;background:var(--bg);padding:6px 0"><button class="pri" ${sel ? '' : 'disabled'} style="flex:1">${sel ? `Take the ${weaponOf(sel)} (${CLASSES[sel].name})` : 'Tap a weapon to choose it'}</button></div>`);
    b.querySelector('button').onclick = () => { if (sel && Game.unlockClass(sel)) { toast(`${CLASSES[sel].name} unlocked`); openFriendPick(true, false, sel); } };
    body.appendChild(b);
  });
}
// you choose what your friends play; any class goes
export function openFriendPick(afterUnlock, afterSwitch, newCls) {
  const pend = {};
  const friends = () => (S.friends || []).filter(fr => S.party.some(p => p.name === fr.name && p.fake?.bff));
  if (!friends().length) { if (afterUnlock) openBook('char'); return; }
  openSheet('Your friends', body => {
    body.appendChild(el(`<p style="margin-top:0">${afterUnlock ? 'Your friends are picking up new weapons too.' : afterSwitch ? 'Your friends could switch too.' : ''} <span class="dim">You: ${roleIcon(S.heroCls)} ${CLASSES[S.heroCls].name}.</span></p>`));
    for (const fr of friends()) {
      const cur = pend[fr.name] || fr.cls;
      const box = el(`<div class="card"><h3>${esc(fr.name)} <span class="dim" style="font:500 12px Exo 2">· ${roleIcon(cur)} ${CLASSES[cur].name} (${CLASSES[cur].role})</span></h3><div class="fpick">${FAMILIES.map(f => CLASS_KEYS.filter(k => CLASSES[k].family === f).map(k => `<button data-k="${k}" class="${k === cur ? 'on' : ''}" style="--c:${CLASSES[k].color}">${roleIcon(k)} ${CLASSES[k].name}</button>`).join('')).join('')}</div></div>`);
      const job = fr.craft || {}, J = Craft.PROFS;
      box.appendChild(el(`<div><p class="setl" style="margin-top:8px">Gathers</p><div class="seg">${['', ...Craft.GATHER_JOBS].map(p => `<button data-g="${p}" class="${(job.gather || '') === p ? 'on' : ''}">${p ? J[p].icon + ' ' + J[p].name + (job.skill?.[p] ? ' ' + job.skill[p] : '') : 'Nothing'}</button>`).join('')}</div>
        <p class="setl">Crafts</p><div class="seg">${['', ...Craft.MAKE_JOBS].map(p => `<button data-m="${p}" class="${(job.make || '') === p ? 'on' : ''}">${p ? J[p].icon + ' ' + J[p].name + (job.skill?.[p] ? ' ' + job.skill[p] : '') : 'Nothing'}</button>`).join('')}</div></div>`));
      box.onclick = ev => { const b = ev.target.closest('button'); if (!b) return; if (b.dataset.k) { pend[fr.name] = b.dataset.k; refreshSheet(); } if (b.dataset.g !== undefined) { Craft.setJob(fr, 'gather', b.dataset.g); Game.save(); refreshSheet(); } if (b.dataset.m !== undefined) { Craft.setJob(fr, 'make', b.dataset.m); Game.save(); refreshSheet(); } };
      body.appendChild(box);
    }
    const roles = [CLASSES[S.heroCls].role, ...friends().map(fr => CLASSES[pend[fr.name] || fr.cls].role)];
    const gaps = ['tank', 'healer'].filter(r => !roles.includes(r));
    const b = el(`<div class="acts" style="position:sticky;bottom:0;background:var(--bg);padding:6px 0"><button class="pri" style="flex:1">${Object.keys(pend).length ? 'Done' : afterUnlock ? 'Keep their classes' : 'Keep them as they are'}</button></div>`);
    b.querySelector('button').onclick = () => { for (const [n, k] of Object.entries(pend)) Game.setFriendClass(n, k); openBook('char'); };
    body.appendChild(b);
  });
}
function tabChar(body) {
  const h = S.hero, C = CLASSES[S.heroCls];
  body.appendChild(el(`<div class="card"><h3 style="color:${C.color}">${esc(h.name)} · Level ${h.lvl} ${C.name}</h3><p>${X.fam?.[C.family] || C.family} · ${C.role}. ${esc(C.blurb)}</p>
    <div class="grid2" style="margin-top:6px"><div><div class="stat"><span>Health</span><span>${h.maxHp}</span></div><div class="stat"><span>${resName(h)}</span><span>${h.resMax}</span></div><div class="stat"><span>Power</span><span>${Math.round(h.power)}</span></div></div>
    <div><div class="stat"><span>Armor</span><span>${Math.round(h.armor)}</span></div><div class="stat"><span>Crit</span><span>${(h.crit * 100).toFixed(1)}%</span></div><div class="stat"><span>XP</span><span>${h.lvl >= MAX_LVL ? 'max' : Math.round(h.xp) + ' / ' + xpNeed(h.lvl)}</span></div></div></div>
    <p>Credits: ${S.gold}</p></div>`));
  weaponRack(body);
  // progression: just the numbers; the game doesn't explain itself
  { const fam = FAMILIES.map(f => { const b = Game.famBest(f); return `<span class="fam ${b >= 10 ? 'ok' : ''}">${{ Fighter: '🛡️', Healer: '💚', Rogue: '🗡️', Mage: '🔧' }[f]} ${f} ${b}</span>`; }).join('');
    body.appendChild(el(`<div class="card"><h3>Families</h3><div class="fams">${fam}</div></div>`));
    const open = Game.perksOpen();
    if (open.length) {
      const pc = el(`<div class="card"><h3>Perks <span class="dim" style="font:500 12px Exo 2">· ${S.perks.length}/2</span></h3><div class="perks">${open.map(k => { const P = PERKS[k], on = S.perks.includes(k); return `<button data-p="${k}" class="perk ${on ? 'on' : ''}"><span>${P.icon}</span><b>${esc(P.name)}</b><small>${esc(P.desc)}</small></button>`; }).join('')}</div></div>`);
      pc.onclick = ev => { const b = ev.target.closest('button'); if (b && b.dataset.p) { Game.togglePerk(b.dataset.p); refreshSheet(); } };
      body.appendChild(pc);
    }
  }
  const g = S.gear[S.heroCls];
  body.appendChild(el('<h3 style="font:700 13px Orbitron;margin:8px 0 4px;color:var(--dim)">Equipped</h3>'));
  for (const sl of SLOTS) {
    const it = g[sl];
    const c = el(`<div class="card it" style="--c:${it ? RARITY[it.rarity].c : '#444'}">${it ? itemHtml(it) : `<span class="dim">${SLOT_NAMES[sl]}: empty</span>`}${it ? '<div class="acts"><button>Unequip</button></div>' : ''}</div>`);
    if (it) c.querySelector('button').onclick = () => { Game.unequip(sl); refreshSheet(); };
    body.appendChild(c);
  }
  if (S.corpse) body.appendChild(el(`<p class="dim">Your ${CLASSES[S.corpse.cls].name} gear is on your corpse. Run back and recover it.</p>`));
}
function tabSpells(body) {
  const C = CLASSES[S.heroCls], h = S.hero, bar = barOf();
  body.appendChild(el(`<p class="dim" style="margin-top:0">Tap an ability to put it on the bar, then tap a bar slot below to place it. Swap two bar slots by tapping one, then the other. Default bars hold your active abilities, then your buffs, then the ultimate.</p>`));
  const slots = el('<div id="barEdit" style="display:grid;grid-template-columns:repeat(6,1fr);gap:5px;margin-bottom:10px"></div>');
  bar.forEach((k, i) => {
    const ab = k && k !== 'attack' ? C.abilities[k] : null, known = !ab || ab.lvl <= h.lvl;
    const b = el(`<button style="min-height:46px;font-size:20px;padding:0;${swapEdit === i ? 'box-shadow:0 0 0 2px var(--acc)' : ''}">${k && known ? (k === 'attack' ? '⚔️' : ab.icon) : '·'}</button>`);
    b.onclick = () => {
      if (pendingSpell !== null) { const j = bar.indexOf(pendingSpell); if (j >= 0) bar[j] = bar[i]; bar[i] = pendingSpell; pendingSpell = null; refreshKeys(true); refreshSheet(); return; }
      if (swapEdit >= 0) { [bar[swapEdit], bar[i]] = [bar[i], bar[swapEdit]]; swapEdit = -1; refreshKeys(true); refreshSheet(); return; }
      swapEdit = i; refreshSheet();
    };
    slots.appendChild(b);
  });
  body.appendChild(slots);
  const tools = el('<div class="acts" style="margin:-4px 0 10px"><button data-a="clear">Clear selected slot</button><button data-a="reset">Reset to default</button></div>');
  tools.onclick = ev => { const a = ev.target.dataset.a; if (a === 'clear' && swapEdit >= 0) { bar[swapEdit] = null; swapEdit = -1; } if (a === 'reset') S.bar[S.heroCls] = defaultBar(S.heroCls); refreshKeys(true); refreshSheet(); };
  body.appendChild(tools);
  const all = [['attack', { name: 'Auto Attack', icon: '⚔️', lvl: 1, kind: 'attack', desc: 'Toggle attacking your target with your weapon.' }], ...Object.entries(C.abilities).filter(([, a]) => a.lvl <= h.lvl)];
  for (const [k, ab] of all) {
    const lock = false, cost = k === 'attack' ? 0 : Cb.costOf(h, ab), onBar = bar.includes(k);
    const card = el(`<div class="card sp ${lock ? 'lock' : ''}" style="${pendingSpell === k ? 'box-shadow:0 0 0 2px var(--acc)' : ''}"><div class="ic">${ab.icon}</div><div style="flex:1"><b>${esc(k === 'attack' ? ab.name : rankName(h, ab))}</b> <small>${ab.kind === 'ult' ? 'ULTIMATE' : ab.kind.toUpperCase()}</small> <p style="margin:2px 0">${esc(ab.desc)}</p><span class="dim" style="font-size:12px">${cost ? cost + ' ' + h.resType + ' · ' : ''}${ab.cast ? ab.cast + ' s cast' : 'Instant'}${ab.cd ? ' · ' + ab.cd + ' s cooldown' : ''}${onBar ? ' · on bar' : ''}</span></div></div>`);
    card.onclick = () => { pendingSpell = pendingSpell === k ? null : k; swapEdit = -1; refreshSheet(); };
    body.appendChild(card);
  }
  if (Object.values(C.abilities).some(a => a.kind === 'ult' && a.lvl <= h.lvl)) body.appendChild(el(`<p class="dim" style="font-size:12px">Ultimates charge from fighting: damage dealt, damage taken and healing done fill the gold strip on the key.</p>`));
}
let pendingSpell = null, swapEdit = -1, editPick = -1;
function tabLore(body) {
  const ids = Object.keys(LORE), got = ids.filter(id => S.lore[id]);
  body.appendChild(el(`<p class="dim" style="margin-top:0">Pages found: <b style="color:var(--acc)">${got.length} / ${ids.length}</b>. Some things out here are worth reading twice.</p>`));
  for (const id of ids) {
    if (!S.lore[id]) { body.appendChild(el('<div class="card dim">An undiscovered page.</div>')); continue; }
    const c = el(`<div class="card"><h3>${esc(LORE[id].title)}</h3><p class="lore">${esc(Game.fill(LORE[id].text))}</p></div>`); body.appendChild(c);
  }
}
export function openLore(id) { openSheet('Lore', body => { body.appendChild(el(`<div class="card"><h3>${esc(LORE[id].title)}</h3><p class="lore">${esc(Game.fill(LORE[id].text))}</p></div>`)); const b = el('<button>All lore</button>'); b.onclick = () => openBook('lore'); body.appendChild(b); }); }
// the bank: shared by all your classes
function openBank() {
  openSheet('Bank', body => {
    body.appendChild(el(`<p class="dim" style="margin-top:0">Your bank is shared by every class. ${S.bank.length} / ${Game.BANK_SLOTS} slots.</p>`));
    body.appendChild(el('<h3 style="font:700 13px Orbitron;margin:4px 0;color:var(--dim)">In the bank</h3>'));
    if (!S.bank.length) body.appendChild(el('<p class="dim">Empty.</p>'));
    for (const it of S.bank) { const c = el(`<div class="card it" style="--c:${RARITY[it.rarity || 0].c}">${itemHtml(it)}<div class="acts"><button>Take</button></div></div>`); c.querySelector('button').onclick = () => { Game.bankTake(it); refreshSheet(); }; body.appendChild(c); }
    body.appendChild(el('<h3 style="font:700 13px Orbitron;margin:10px 0 4px;color:var(--dim)">In your bags</h3>'));
    if (!S.bag.length) body.appendChild(el('<p class="dim">Your bags are empty.</p>'));
    for (const it of S.bag) { const c = el(`<div class="card it" style="--c:${RARITY[it.rarity || 0].c}">${itemHtml(it)}<div class="acts"><button>Store</button></div></div>`); c.querySelector('button').onclick = () => { Game.bankStore(it); refreshSheet(); }; body.appendChild(c); }
  });
}
// ---------- story scenes: letterboxed captions over the game camera ----------
function updateScene() {
  const sc = S.scene, box = $('scene');
  document.body.classList.toggle('inscene', !!sc);
  if (!sc) { box.classList.add('hide'); if (reopenAfterScene && !sheetOpen()) { const k = reopenAfterScene; reopenAfterScene = null; openGiver(k); } return; }
  box.classList.remove('hide');
  const shot = sc.shots[sc.i], key = sc.id + sc.i;
  if (box._k !== key) { box._k = key; $('sceneWho').textContent = shot.who ? spName(shot.who) : ''; $('sceneWho').style.display = shot.who ? '' : 'none'; $('sceneTxt').textContent = Game.fill(shot.text); $('sceneTxt').classList.toggle('narr', !shot.who); }
}
function tabQuests(body) {
  const act = QUESTS.filter(q => S.quests[q.id] && S.quests[q.id].state !== 'turned');
  if (!act.length) body.appendChild(el(`<p class="dim">No quests yet.</p>`));
  for (const q of act) {
    const st = S.quests[q.id];
    const card = el(`<div class="card"><h3>${esc(q.name)} <span class="dim" style="font:500 12px Exo 2">· level ${q.lvl}</span></h3><p>${esc(Game.fill(q.text))}</p><p style="color:var(--ink)">${q.story ? '<b style="color:#c8a2ff">Main story</b> · ' : ''}${objText(q)}: <b style="color:var(--acc)">${st.state === 'done' ? (q.obj.talk || q.obj.at ? 'Talk to ' : 'Done. Return to ') + GIVERS[Game.turnToOf(q)].name + '.' : q.obj.at ? 'travel there' : st.n + ' / ' + q.obj.n}</b></p></div>`);
    if (st.state === 'done') { const b = el(`<div class="acts"><button class="pri">⤴ Return to ${esc(GIVERS[Game.turnToOf(q)].name)}</button></div>`); b.querySelector('button').onclick = () => { if (Game.returnToGiver(q)) closeSheet(); }; card.appendChild(b); }
    body.appendChild(card);
  }
  const done = QUESTS.filter(q => S.quests[q.id]?.state === 'turned');
  if (done.length) body.appendChild(el(`<p class="dim" style="font-size:12px">Completed: ${done.map(q => esc(q.name)).join(', ')}</p>`));
}
const plural = w => /man$/.test(w) ? w.replace(/man$/, 'men') : /Bones$/.test(w) ? w : /(?:wolf|elf)$/i.test(w) ? w.replace(/f$/i, 'ves') : /(s|x|ch|sh)$/i.test(w) ? w + 'es' : /[^aeiou]y$/i.test(w) ? w.slice(0, -1) + 'ies' : w + 's';
const orList = a => a.length < 2 ? a.join('') : a.slice(0, -1).join(', ') + ' or ' + a[a.length - 1];
function objText(q) {
  const o = q.obj, nm = k => MOBS[k].name, n = o.n || 1;
  if (o.what) return Game.fill(o.what);
  for (const f of X.objText) { const t = f(q); if (t) return t; }
  if (o.named) return `Defeat ${world.names[o.named] || MOBS[o.named]?.name || o.named}`;
  const where = o.dungeon ? ' in the Ossuary' : o.near === 'waste' ? ' in the Grey Waste' : o.reef ? ' on the Drowned Reef' : '';
  if (o.collect) return `Collect ${n} ${o.item}${n > 1 && !/s$/.test(o.item) && !/silk|ectoplasm|bacon/i.test(o.item) ? 's' : ''} from ${orList([...new Set(o.collect.map(k => plural(nm(k))))])}${where}`;
  return `Defeat ${n} ${orList([...new Set(o.kill.map(k => n > 1 ? plural(nm(k)) : nm(k)))])}${where}`;
}
// ---------- professions, materials, food and the collection ----------
function tabTrade(body) {
  const P = Craft.PROFS;
  body.appendChild(el(`<div class="card"><h3>Professions</h3><div class="profs">${Object.entries(P).map(([k, p]) => { const v = Craft.skill(k); return `<div class="prof ${v === null ? 'off' : ''}"><span>${p.icon}</span><b>${p.name}</b><small>${v === null ? 'not learned' : v + ' / 100'}</small>${v === null ? '' : `<i style="width:${v}%"></i>`}</div>`; }).join('')}</div></div>`));
  const jobs = (S.friends || []).filter(fr => fr.craft && (fr.craft.gather || fr.craft.make));
  if (jobs.length) body.appendChild(el(`<div class="card"><h3>Friends' jobs</h3>${jobs.map(fr => `<p style="margin:2px 0">${esc(fr.name)}: ${[fr.craft.gather, fr.craft.make].filter(Boolean).map(p => `${P[p].icon} ${P[p].name} ${Craft.skill(p, fr)}`).join(' · ')}</p>`).join('')}</div>`));
  const mats = Object.entries(S.mats || {}).filter(([, n]) => n > 0);
  body.appendChild(el(`<div class="card"><h3>Materials</h3>${mats.length ? `<div class="mats">${mats.map(([k, n]) => `<span>${Craft.MATS[k].icon} ${esc(Craft.MATS[k].name)} <b>${n}</b></span>`).join('')}</div>` : '<p class="dim" style="margin:0">None yet.</p>'}</div>`));
  const cons = Object.entries(S.cons || {}).filter(([, n]) => n > 0);
  if (cons.length) {
    const c = el(`<div class="card"><h3>Food and elixirs</h3>${cons.map(([k, n]) => `<div class="who"><div><b>${Craft.CONS[k].icon} ${esc(Craft.CONS[k].name)}</b> <small>×${n} · ${esc(Craft.CONS[k].desc)}</small></div><button data-c="${k}">Use</button></div>`).join('')}</div>`);
    c.onclick = ev => { const k = ev.target.dataset.c; if (k) { Craft.useCons(k); Game.save(); refreshSheet(); } };
    body.appendChild(c);
  }
  const col = (S.collection || []).map(k => [k, Loot5.COLLECT[k]]).filter(([, c]) => c);
  if (col.length) {
    const c = el(`<div class="card"><h3>Collection</h3>${col.map(([k, c]) => `<div class="who"><div><b>${c.type === 'pet' ? '🐾' : c.type === 'title' ? '🏷️' : '🏆'} ${esc(c.name)}</b>${c.desc ? `<small> · ${esc(c.desc)}</small>` : ''}</div>${c.type === 'pet' ? `<button data-p="${k}">${S.pet === k ? 'Dismiss' : 'Summon'}</button>` : c.type === 'title' ? `<button data-t="${k}">${S.title === k ? 'Remove' : 'Wear'}</button>` : ''}</div>`).join('')}</div>`);
    c.onclick = ev => { const b = ev.target.closest('button'); if (!b) return; if (b.dataset.p) Game.setPet(b.dataset.p); if (b.dataset.t) Game.setTitle(b.dataset.t); refreshSheet(); };
    body.appendChild(c);
  }
}
let craftPick = 0;
export function openCraft(st) {
  const S0 = Craft.STATIONS[st]; craftPick = 0;
  openSheet(S0.name, body => {
    const all = Craft.craftersAt(st);
    if (!all.length) { body.appendChild(el(`<div class="card"><p style="margin:0">Nobody in your group knows ${S0.profs.map(p => Craft.PROFS[p].name).join(' or ')}. A trainer in the crafters' quarter can teach you, or give a friend the job.</p></div>`)); return; }
    if (craftPick >= all.length) craftPick = 0;
    if (all.length > 1) { const tabs = el(`<div class="seg">${all.map((c, i) => `<button data-i="${i}" class="${i === craftPick ? 'on' : ''}">${Craft.PROFS[c.p].icon} ${c.who ? esc(c.who.name) : 'You'} · ${Craft.skill(c.p, c.who)}</button>`).join('')}</div>`); tabs.onclick = ev => { const i = ev.target.closest('button')?.dataset.i; if (i !== undefined) { craftPick = +i; refreshSheet(); } }; body.appendChild(tabs); }
    for (const { who, p } of [all[craftPick]]) {
      const v = Craft.skill(p, who), P = Craft.PROFS[p];
      body.appendChild(el(`<h3 style="font:700 14px Orbitron;margin:8px 0 4px">${P.icon} ${P.name}${who ? ' · ' + esc(who.name) : ''} <span class="dim" style="font:500 12px Exo 2">· ${v} / 100</span></h3>`));
      const list = Object.values(Craft.RECIPES).filter(r => r.prof === p && Craft.knows(r, who)).sort((a, b) => a.req - b.req);
      for (const r of list) {
        const can = v >= r.req, has = Craft.haveMats(r), col = v < r.req ? '#888' : v < r.req + 15 ? '#ff9a3a' : v < r.req + 30 ? '#ffd34d' : v < r.req + 45 ? '#7fd35a' : '#9a9a9a';
        const mats = Object.entries(r.mats).map(([k, n]) => { const have = (S.mats || {})[k] || 0; return `<span style="color:${have >= n ? 'var(--ink)' : '#ff8a6a'}">${Craft.MATS[k].icon} ${have}/${n} ${esc(Craft.MATS[k].name)}</span>`; }).join(' ');
        const c = el(`<div class="card craft"><div><b style="color:${col}">${esc(r.name)}</b>${r.rare ? ' <small style="color:#b86bff">rare</small>' : ''}<small class="dim"> · skill ${r.req}</small><div class="mats">${mats}</div></div><button ${can && has ? '' : 'disabled'}>Craft</button></div>`);
        c.querySelector('button').onclick = () => { const m = Craft.craft(r.id, Game, who); if (m) toast(m); refreshSheet(); };
        body.appendChild(c);
      }
    }
    body.appendChild(el('<p class="dim" style="font-size:12px">Orange recipes always raise your skill; yellow usually; green sometimes; grey never.</p>'));
  });
}
function tabBags(body) {
  body.appendChild(el(`<p style="margin-top:0">Credits: <b style="color:var(--acc)">${S.gold}</b> · Potions: 🧪 ${S.pots.hpot} · 💧 ${S.pots.mpot} · Bags ${S.bag.length}/30</p>`));
  if (!S.bag.length) body.appendChild(el('<p class="dim">Your bags are empty.</p>'));
  const vend = S.ents.some(n => n.vendor && !n.dead && dist(S.hero, n) < 8), C0 = CLASSES[S.heroCls].abilities;
  if (vend && S.bag.some(it => it.junk)) { const b = el(`<div class="acts" style="margin:0 0 6px"><button>Sell all trade goods (${S.bag.filter(it => it.junk).reduce((a, it) => a + it.value, 0)}g)</button></div>`); b.querySelector('button').onclick = () => { P8.sellJunk(); refreshSheet(); }; body.appendChild(b); }
  for (const it of S.bag) {
    const ok = Game.canWear(S.heroCls, it), cur = S.gear[S.heroCls][it.slot], bk = it.book, why = bk && (bk.blank ? (X.blankOptions(S.hero, bk.rank).length ? null : 'None of your spells are ready for this rank.') : X.whyNot(S.hero, bk.cls, bk.key, bk.rank));
    const note = bk ? (why ? `<p style="font-size:12px;margin:2px 0">${esc(why)}</p>` : '') : it.junk ? '' : ok ? '' : `<p style="font-size:12px;margin:2px 0">A ${CLASSES[S.heroCls].name} can't use this.</p>`;
    const c = el(`<div class="card it" style="--c:${RARITY[it.rarity].c}">${itemHtml(it, ok ? cur : null)}${note}<div class="acts">${ok ? '<button data-a="eq">Equip</button>' : ''}${bk && !why ? '<button data-a="study">Study</button>' : ''}${vend ? `<button data-a="sell">Sell ${it.value}g</button>` : ''}${S.party.length > 1 ? '<button data-a="give">Give…</button>' : ''}${Craft.skill('enchanting') !== null && it.rarity >= 1 ? '<button data-a="de">Disenchant</button>' : ''}</div></div>`);
    c.onclick = ev => {
      const a = ev.target.dataset.a;
      if (a === 'eq') { Game.equip(it); refreshSheet(); }
      if (a === 'study') { if (bk.blank) { const acts = c.querySelector('.acts'); acts.innerHTML = X.blankOptions(S.hero, bk.rank).map(k => `<button data-w="${k}">${C0[k].icon} ${esc(C0[k].name)}</button>`).join(''); return; } const m = X.study(S.hero, it); if (m) toast(m); Game.save(); refreshKeys(true); refreshSheet(); }
      if (ev.target.dataset.w) { const m = X.study(S.hero, it, ev.target.dataset.w); if (m) toast(m); Game.save(); refreshKeys(true); refreshSheet(); }
      if (a === 'sell') { Game.sell(it); refreshSheet(); }
      if (a === 'de') { const m = Craft.disenchant(it, Game); if (m) toast(m); refreshSheet(); }
      if (a === 'give') { const acts = c.querySelector('.acts'); acts.innerHTML = S.party.filter(p => !p.isHero).map((p, i) => `<button data-g="${i}">${esc(p.name)}${Game.canWear(p.cls, it) ? ' ✓' : ''}</button>`).join(''); }
      if (ev.target.dataset.g !== undefined) { const p = S.party.filter(p => !p.isHero)[+ev.target.dataset.g]; S.bag = S.bag.filter(b => b !== it); Game.assignLoot({ loot: [it] }, it, p); refreshSheet(); }
    };
    body.appendChild(c);
  }
  if (!vend) body.appendChild(el(`<p class="dim" style="font-size:12px">Sell items to any town vendor.</p>`));
}
function tabSocial(body) {
  const mates = S.party.filter(p => !p.isHero);
  body.appendChild(el(`<h3 style="font:700 13px Orbitron;margin:0 0 4px;color:var(--dim)">Your group (${S.party.length}/6)</h3>`));
  if (!mates.length) body.appendChild(el('<p class="dim" style="margin-top:0">Just you. A good group is 1 tank, 2 healers and 3 damage.</p>'));
  for (const p of mates) {
    const c = el(`<div class="who"><div><b style="color:${CLASSES[p.cls].color}">${roleIcon(p.cls)} ${esc(p.name)}</b> <small>L${p.lvl} ${CLASSES[p.cls].name}${p.fake.friend ? ' · ★ friend' : ''}${p.fake.guild ? ' · &lt;' + esc(p.fake.guild) + '&gt;' : ''}</small></div><button data-a="fr">${p.fake.friend ? 'Unfriend' : 'Friend'}</button><button data-a="kick">Remove</button></div>`);
    c.onclick = ev => { const a = ev.target.dataset.a; if (a === 'fr') Game.befriend(p); if (a === 'kick') Game.kick(p); refreshSheet(); };
    body.appendChild(c);
  }
  body.appendChild(el(`<h3 style="font:700 13px Orbitron;margin:10px 0 4px;color:var(--dim)">Who's around</h3>`));
  const roleOrder = { tank: 0, healer: 1, dps: 2 };
  const others = S.fakes.filter(f => !f.inParty && !f.dead && dist(f, S.hero) < 120).sort((a, b) => (b.fake.friend - a.fake.friend) || (roleOrder[CLASSES[a.cls].role] - roleOrder[CLASSES[b.cls].role]) || Math.abs(a.lvl - S.hero.lvl) - Math.abs(b.lvl - S.hero.lvl));
  if (!others.length) body.appendChild(el('<p class="dim">Nobody nearby. Try the town.</p>'));
  for (const f of others) {
    const busy = f.fake.group ? ' · in a group' : f.fake.state === 'hunt' ? ' · hunting' : '';
    const c = el(`<div class="who"><div><b style="color:${CLASSES[f.cls].color}">${roleIcon(f.cls)} ${esc(f.name)}</b> <small>L${f.lvl} ${CLASSES[f.cls].name}${f.fake.friend ? ' · ★' : ''}${busy} · ${Math.round(dist(f, S.hero))} m</small></div><button data-a="inv" ${S.party.length >= Game.partyCap() ? 'disabled' : ''}>Invite</button></div>`);
    c.onclick = ev => { if (ev.target.dataset.a === 'inv') { Game.invite(f); refreshSheet(); } };
    body.appendChild(c);
  }
  body.appendChild(el(`<h3 style="font:700 13px Orbitron;margin:10px 0 4px;color:var(--dim)">Chat log</h3>`));
  body.appendChild(el(`<div id="log">${S.log.slice(-60).reverse().map(l => `<div class="ch-${l.ch}">${l.from ? `<b>${l.ch === 'gen' ? '[General] ' : l.ch === 'guild' ? '[Guild] ' : ''}${esc(l.from)}:</b> ` : ''}${esc(l.text)}</div>`).join('')}</div>`));
}
const spName = sp => sp === 'you' ? S.heroName : GIVERS[sp]?.name || (conv && sp === conv.k && conv.n ? conv.n.name : '') || sp;
function sayHtml(lines, def) {
  return '<div class="says">' + (lines || []).map(l => { const [sp, t] = typeof l === 'string' ? [def, l] : l; return `<div class="say${sp === 'you' ? ' me' : sp === def ? '' : ' alt'}">${sp ? `<b>${esc(spName(sp))}</b>` : ''}<p>${esc(Game.fill(t))}</p></div>`; }).join('') + '</div>';
}
let conv = null, reopenAfterScene = null;
const ACCEPT_LINES = ["Thank you, {hero}. I'll be right here when you get back.", 'Wonderful. Good luck out there, and do try to come back in one piece.', "I knew I could count on you. Off you go, then."];
const pickOf = a => a && a.length ? a[Math.floor(Math.random() * a.length)] : null;
// a conversation with someone who gives quests: a greeting, then things you can say
export const talkKey = n => n.tk ? n.tk : n.giver ? n.giver : n.banker ? 'banker' : n.vendor ? 'vendor:' + n.vendor : n.armory ? 'armory' : n.guard ? 'guard' : 'villager:' + n.name;
const talkOf = k => TALK[k] || (k.startsWith('villager:') ? TALK['villager:Hollin Villager'] : {});
function openGiver(k) { const n = S.npcs?.[k]; openTalk(n && n.giver === k ? n : { giver: k, name: GIVERS[k].name, title: GIVERS[k].title }); }
export function openTalk(n) {
  const k = talkKey(n), T = talkOf(k);
  const greet = pickOf(T.greet) || (Array.isArray(VILLAGER_LINES[n.name]) ? pickOf(VILLAGER_LINES[n.name]) : VILLAGER_LINES[n.name]) || 'Hello there.';
  conv = { k, n, view: 'menu', lines: [greet] };
  const ready = n.giver && Game.turnInsFor(k)[0]; if (ready) conv = { k, n, view: 'done', q: ready };
  openSheet(n.name || GIVERS[k]?.name, renderConv);
}
function renderConv(body) {
  const c = conv, k = c.k, g = GIVERS[k] || c.n || {}, T = talkOf(k), h = S.hero, nn = c.n;
  body.appendChild(el(`<p class="dim" style="margin:0 0 6px">${esc(Game.fill((nn && nn.title) ?? g.title ?? ''))}</p>`));
  const go = (o) => { Object.assign(conv, o); refreshSheet(); };
  const opts = (list) => { const box = el('<div class="opts"></div>'); for (const [label, fn, cls] of list) { const b = el(`<button class="opt ${cls || ''}">${label}</button>`); b.onclick = fn; box.appendChild(b); } body.appendChild(box); };
  const q = c.q;
  if (c.view === 'menu' || c.view === 'reply') {
    body.appendChild(el(sayHtml(c.lines, k)));
    const list = [];
    for (const r of Game.turnInsFor(k)) list.push([`▸ I've done what you asked. <span class="qn">${esc(r.name)}</span>`, () => go({ view: 'done', q: r }), 'hl']);
    const off = Game.nextOffer(k);
    if (off) list.push([`▸ ${off.story ? "What's going on?" : 'Is there anything I can help you with?'} <span class="qn">${off.story ? 'Main story · ' : ''}${esc(off.name)}</span>`, () => go({ view: 'offer', q: off }), 'hl']);
    for (const a of Game.activeFrom(k)) list.push([`▸ About "${esc(a.name)}"…`, () => go({ view: 'active', q: a })]);
    for (const a of Game.asksFor(k)) list.push([`▸ I have some questions about the murder. <span class="qn">${esc(a.name)}</span>`, () => go({ view: 'ask', q: a }), 'hl']);
    for (const p of Craft.TRAINERS[k] || []) if (Craft.skill(p) === null) list.push([`▸ Teach me ${Craft.PROFS[p].name}. <span class="qn">${Craft.PROFS[p].icon}</span>`, () => { Craft.learn(p); Game.save(); go({ view: 'reply', lines: [`There. You know the basics of ${Craft.PROFS[p].name.toLowerCase()} now. The rest is practice, and practice, and a bit more practice.`] }); }, 'hl']);
    if (nn?.vendor) list.push(['▸ Show me what you have for sale.', () => { closeSheet(); openVendor(nn); }, 'hl']);
    if (nn?.banker || k === 'banker') list.push(["▸ I'd like to use my vault.", () => { closeSheet(); openBank(); }, 'hl']);
    if (nn?.armory) { list.push(["▸ I'd like to switch weapons.", () => { closeSheet(); openBook('char'); }, 'hl']); if (S.unlockPicks > 0) list.push(['▸ Show me the weapon rack.', () => { closeSheet(); openWeaponPick(); }, 'hl']); }
    for (const f of X.talk) list.push(...(f(k, nn, { go, close: closeSheet }) || []));
    for (const t of (T.topics || [])) if ((!t.after || S.quests[t.after]?.state === 'turned') && (!t.when || t.when())) list.push([`▸ ${esc(Game.fill(t.q))}`, () => go({ view: 'topic', t })]);
    list.push(['▸ Farewell.', () => closeSheet()]);
    opts(list);
    return;
  }
  if (c.view === 'ask') {
    const T2 = TESTIMONY[c.q.id]?.[k], lines = T2 ? T2(S.flags) : ["I don't know anything about that."];
    body.appendChild(el(sayHtml([['you', 'I have some questions about the murder.'], ...lines], k)));
    Game.askSuspect(c.q, k);
    opts([['▸ Thank you. Let me ask you something else.', () => go({ view: 'menu', lines: [] })], ['▸ Farewell.', () => closeSheet()]]);
    return;
  }
  if (c.view === 'topic') {
    body.appendChild(el(sayHtml([['you', c.t.q], ...c.t.a], k)));
    opts([['▸ I see. Let me ask you something else.', () => go({ view: 'menu', lines: [] })], ['▸ Farewell.', () => closeSheet()]]);
    return;
  }
  body.appendChild(el(`<h3 class="qt">${esc(q.name)} <span class="dim">· level ${q.lvl}${q.story ? ' · main story' : ''}</span></h3>`));
  if (c.view === 'offer') {
    body.appendChild(el(sayHtml(q.say || [q.text], q.giver)));
    body.appendChild(el(`<p class="obj"><b>Objective:</b> ${esc(objText(q))}.<br><span class="dim">Reward: ${q.xp} xp and ${q.gold} credits${q.gear ? ', plus a piece of gear' : ''}.${q.lvl > h.lvl ? ` <span style="color:#ff8a6a">Level ${q.lvl} is recommended.</span>` : ''}</span></p>`));
    const a = el('<div class="acts"><button class="pri" data-a="acc">Accept</button><button data-a="dec">Decline</button></div>');
    a.onclick = ev => {
      const act = ev.target.dataset.a; if (!act) return;
      if (act === 'acc') {
        Game.acceptQuest(q); refreshKeys(true);
        if (S.pendingScene) { reopenAfterScene = q.obj.talk && Game.turnToOf(q) === k ? k : null; closeSheet(); return; }
        if (q.obj.talk && Game.turnToOf(q) === k) go({ view: 'done' });
        else go({ view: 'reply', lines: [pickOf(ACCEPT_LINES)] });
      } else { Game.declineQuest(q); go({ view: 'reply', lines: [T.decline || 'Very well. Perhaps another time.'] }); }
    };
    body.appendChild(a);
    return;
  }
  if (c.view === 'active') {
    const st = S.quests[q.id];
    body.appendChild(el(sayHtml([q.story ? "Any luck so far? I'm counting on you, {hero}." : "How is it going? Come back and see me when it's done."], k)));
    body.appendChild(el(`<p class="obj"><b>Objective:</b> ${esc(objText(q))}: <b style="color:var(--acc)">${q.obj.at ? 'not there yet' : st.n + ' / ' + q.obj.n}</b></p>`));
    opts([['▸ I\'m working on it.', () => go({ view: 'menu', lines: ["Good. I'll be here."] })], ['▸ Farewell.', () => closeSheet()]]);
    return;
  }
  if (c.view === 'done') {
    const def = Game.turnToOf(q);
    body.appendChild(el(sayHtml((typeof q.done === 'function' ? q.done(S.flags) : q.done) || ['Well done, and thank you.'], def)));
    const chOk = ch => !ch.if || Game.flagMatch(ch.if);
    const a = el(`<div class="acts col">${q.choices ? q.choices.map((ch, i) => chOk(ch) ? `<button class="pri" data-c="${i}">${esc(Game.fill(ch.t))}</button>` : '').join('') : '<button class="pri" data-c="-1">Complete the quest</button>'}</div>`);
    a.onclick = ev => {
      const cc = ev.target.dataset.c; if (cc === undefined) return;
      const reply = Game.turnIn(q, +cc >= 0 ? +cc : null);
      refreshKeys(true);
      if (q.unlock) { openWeaponPick(); return; }
      const lines = [...(reply ? [reply] : []), ['', `Quest complete: ${q.name}. You earn ${q.xp} xp and ${q.gold} credits.`]];
      if (S.pendingScene) { closeSheet(); return; }
      go({ view: 'reply', lines, k: def });
    };
    body.appendChild(a);
  }
}
// ---------- talking to your group ----------
function openSay() {
  openSheet('Talk to your group', body => {
    body.appendChild(el('<p class="dim" style="margin:0 0 6px">Type anything, or tap a phrase. Your group answers, and they follow orders like "follow me", "wait here", "pull", "heal me" or "what\'s next?"</p>'));
    const f = el('<form class="sayf"><input id="sayIn" type="text" maxlength="140" autocomplete="off" placeholder="Say something…"><button class="pri" type="submit">Send</button></form>');
    f.onsubmit = ev => { ev.preventDefault(); const v = $('sayIn').value; if (!v.trim()) return; closeSheet(); Game.partySay(v); };
    body.appendChild(f);
    const q = el(`<div class="quick">${QUICK.map(t => `<button>${esc(t)}</button>`).join('')}</div>`);
    q.onclick = ev => { const b = ev.target.closest('button'); if (!b) return; closeSheet(); Game.partySay(b.textContent); };
    body.appendChild(q);
  });
}
// ---------- inspecting someone ----------
const PERSONA_TXT = { chill: 'Easygoing, and plays for the fun of it.', tryhard: 'Wants every fight to be perfect, and every drop.', joker: "Never manages to stay serious for more than a minute.", newbie: 'Still learning the ropes, and asks a lot of questions.', veteran: 'Has seen it all, and will happily tell you about it.', grumpy: 'Complains about everything, and shows up every single time.', friendly: 'One of your oldest friends.' };
function conText(t) {
  const d = t.lvl - S.hero.lvl;
  if (d <= -3) return ['#9a9a9a', 'should be an easy fight'];
  if (d < 0) return ['#5fd35a', 'should be no trouble'];
  if (d === 0) return ['#e8e0c8', 'looks like an even fight'];
  if (d <= 2) return ['#ffd34d', 'looks like a tough fight'];
  return ['#ff5a3a', 'looks dangerous: bring friends'];
}
export function openInspect(t) {
  if (!t) return;
  openSheet(t.name, body => {
    if (t.mob) {
      const M = MOBS[t.mob], [col, con] = conText(t);
      const tags = [t.boss ? 'Boss' : t.boss2 ? 'Mini-boss' : t.named ? 'Named' : t.elite ? 'Elite' : null, M.undead ? 'Undead' : M.beast ? 'Beast' : M.human ? 'Humanoid' : null].filter(Boolean).join(' · ');
      body.appendChild(el(`<div class="card"><h3 style="color:${col}">Level ${t.lvl} ${esc(t.name)}</h3><p style="margin:2px 0">${esc(S.hero.name)}, this ${con}.${tags ? ` <span class="dim">${tags}.</span>` : ''}</p>
        <p class="lore" style="margin:6px 0">${esc(Game.fill(MOB_LORE[t.mob] || 'Little is known about this creature.'))}</p>
        <p class="dim" style="margin:2px 0">Health ${Math.round(t.hp)} / ${t.maxHp}.${M.weak ? ` Weak to ${M.weak}.` : ''}${M.resist ? ` Resists ${M.resist}.` : ''}${M.caster ? ' Casts spells from range.' : ''}${M.healer ? ' Heals its allies.' : ''}</p></div>`));
      return;
    }
    if (t.cls) {
      const C = CLASSES[t.cls], f = t.fake, fam = { Fighter: '🛡️', Healer: '💚', Rogue: '🗡️', Mage: '🔧' }[C.family];
      const rel = t.isHero ? 'This is you.' : f?.bff ? '' : t.inParty ? 'In your group.' : f?.friend ? 'On your friends list.' : '';
      body.appendChild(el(`<div class="card"><h3>${fam} ${esc(t.name)}</h3><p style="margin:2px 0">Level ${t.lvl} ${esc(C.name)} · ${esc(C.family)} · ${esc(C.role === 'dps' ? 'damage' : C.role)}</p>
        ${f?.guild ? `<p class="dim" style="margin:2px 0">&lt;${esc(f.guild)}&gt;</p>` : ''}${f ? `<p style="margin:4px 0">${esc(PERSONA_TXT[f.bff ? 'friendly' : f.persona] || '')}</p>` : ''}${rel ? `<p class="dim" style="margin:2px 0">${rel}</p>` : ''}
        <p class="dim" style="margin:4px 0 0">Health ${Math.round(t.hp)} / ${t.maxHp} · Power ${Math.round(t.power)} · Armor ${Math.round(t.armor)}</p></div>`));
      if (f && !t.inParty && !t.dead) { const a = el(`<div class="acts"><button class="pri">Invite to group</button><button>${f.friend ? 'Unfriend' : 'Add friend'}</button></div>`); a.children[0].onclick = () => { Game.invite(t); closeSheet(); }; a.children[1].onclick = () => { Game.befriend(t); refreshSheet(); }; body.appendChild(a); }
      return;
    }
    if (t.team === 'npc' && !t.prop && !t.corpse) {
      const T = talkOf(talkKey(t));
      const bio = T?.bio || (t.storyNpc ? (Array.isArray(VILLAGER_LINES[t.name]) ? 'One of the people who live and work here, getting on with life as best they can.' : VILLAGER_LINES[t.name] ? 'One of Little Hollin\'s residents. Not all of them are still breathing.' : '') : t.guard ? 'A member of the town guard, keeping the gates safe.' : t.vendor ? 'A merchant who sells supplies and buys whatever you bring back.' : '');
      body.appendChild(el(`<div class="card"><h3>${esc(t.name)}</h3>${t.title ? `<p class="dim" style="margin:0 0 4px">${esc(Game.fill(t.title))}</p>` : ''}<p class="lore" style="margin:4px 0">${esc(Game.fill(bio || 'Nothing remarkable, at first glance.'))}</p></div>`));
      if (!t.bindstone) { const a = el('<div class="acts"><button class="pri">Talk</button></div>'); a.firstChild.onclick = () => { closeSheet(); interact(t); }; body.appendChild(a); }
    }
  });
}
function openVendor(n) {
  openSheet(n ? n.name : 'Supplies', body => {
    body.appendChild(el(`<p style="margin-top:0">Credits: <b style="color:var(--acc)">${S.gold}</b></p>`));
    for (const [k, p] of Object.entries(POTIONS)) {
      if (p.once && (world.zone !== 'coast' || S.pole)) continue;
      const c = el(`<div class="card sp"><div class="ic">${p.icon}</div><div style="flex:1"><b>${p.name}</b> <span class="dim">${p.once ? '' : '· you have ' + S.pots[k]}</span><p style="margin:2px 0">${p.desc}</p><div class="acts"><button ${S.gold < p.price ? 'disabled' : ''}>Buy for ${p.price}g</button></div></div></div>`);
      c.querySelector('button').onclick = () => { Game.buyPot(k); refreshSheet(); };
      body.appendChild(c);
    }
    body.appendChild(el(`<p class="dim">To sell gear, open Bags while you stand here.</p>`));
    const b = el('<button>Open Bags</button>'); b.onclick = () => openBook('bags'); body.appendChild(b);
  });
}
// master looter: you decide who gets each item
export function openLoot(m) {
  if (!m.loot?.length || m.lootFor !== 'party') return;
  if (dist(S.hero, m) > 8) { toast('Too far away'); return; }
  if (m.lootGold) { S.gold += m.lootGold; chat('loot', null, `You loot ${m.lootGold} credits.`); m.lootGold = 0; }
  // From the MMO's Build 12: by default gear goes to need-or-greed rolls; recipes and collectibles are yours.
  if (SET.loot !== 'master' && S.party.length <= 6 && X.rollItems) {
    const mine = m.loot.filter(it => it.recipe || it.collect), roll = m.loot.filter(it => !(it.recipe || it.collect));
    for (const it of mine) Game.assignLoot({ loot: [it] }, it, S.hero);
    if (S.party.some(p => !p.isHero && !p.dead)) X.rollItems(roll, 'You'); else for (const it of roll) Game.assignLoot({ loot: [it] }, it, S.hero);
    m.loot = []; Game.save(); return;
  }
  m.loot = m.loot.filter(it => !(X.isSmall(it) && X.takeSmall(it)));
  if (!m.loot.length) { Game.save(); return; }
  openSheet('Loot: ' + m.name, body => {
    if (!m.loot.length) { body.appendChild(el('<p class="dim">Nothing left.</p>')); setTimeout(closeSheet, 400); return; }
    body.appendChild(el('<p class="dim" style="margin-top:0">You are the master looter. Choose who gets each item. Your companions notice whether you\'re fair.</p>'));
    for (const it of m.loot) {
      const who = S.party;
      const c = el(`<div class="card it" style="--c:${RARITY[it.rarity].c}">${itemHtml(it)}<div class="acts">${who.map((p, i) => `<button data-i="${i}">${p.isHero ? 'Me' : esc(p.name)}${Game.canWear(p.cls, it) ? ' ✓' : ''}</button>`).join('')}</div></div>`);
      c.onclick = ev => { const i = ev.target.dataset.i; if (i === undefined) return; Game.assignLoot(m, it, who[+i]); refreshSheet(); };
      body.appendChild(c);
    }
    body.appendChild(el('<p class="dim" style="font-size:12px">✓ marks who can use it.</p>'));
  });
}
function openMap() { MapUI.openBig(); }
// ---------- settings: on the title screen and in the menu ----------
function renderSettings(box, inGame, back) {
  const info = Game.saveInfo();
  box.innerHTML = `${back ? '<button data-a="back" style="margin-bottom:8px">← Back</button>' : ''}
    <div class="card" style="text-align:left"><h3>Camera &amp; touch</h3>${['camSpeed', 'joySize', 'tapSens'].map(segHtml).join('')}</div>
    <div class="card" style="text-align:left"><h3>Text &amp; interface size</h3>${['ui', 'text'].map(segHtml).join('')}</div>
    <div class="card" style="text-align:left"><h3>Loot</h3>${segHtml('loot')}</div>
    <div class="card" style="text-align:left"><h3>Graphics</h3>${segHtml('gfx')}<p class="dim" style="font-size:12px;margin:0">Low and Medium draw fewer pixels, so the game runs smoother and the phone stays cooler.</p></div>
    <div class="card" style="text-align:left"><h3>Save codes</h3>
      ${info ? `<p style="margin:0 0 6px">Your character: <b>${esc(info.name)}</b>, level ${info.lvl} ${CLASSES[info.cls]?.name || ''}.</p><div class="acts"><button data-a="copy">Copy save code</button></div><textarea id="codeOut" readonly class="hide" style="height:60px"></textarea>` : '<p class="dim" style="margin:0 0 6px">No character saved on this device yet.</p>'}
      <p style="margin:8px 0 4px">Load a save code:</p><textarea id="codeIn" placeholder="Paste a code starting STAR1." style="height:60px"></textarea><div class="acts"><button data-a="paste">📥 Paste</button><button data-a="load">Load</button></div><p class="dim" style="font-size:12px;margin:4px 0 0">Copy the code on one device, send it to yourself, then paste it here on the other. The game saves every few seconds.</p>
      ${info ? `<p style="margin:10px 0 4px">Delete character: this can't be undone. Copy your save code first if you might want them back.</p><div class="acts"><button data-a="del" style="color:#ff8a6a">Delete ${esc(info.name)}</button></div>` : ''}</div>
    ${inGame ? `<div class="card" style="text-align:left"><h3>Controls</h3><p>Left thumb: move. Right thumb: turn the camera, pinch to zoom. Tap someone to target them; tap again to talk, loot or attack. 🎯 cycles enemy targets. Tap the minimap for the full map. On a keyboard: WASD, Q/E turn, Tab, 1-0 - =, F to interact, X to sit, M for the map.</p></div>` : ''}`;
  let delArmed = false;
  box.onclick = async ev => {
    const b = ev.target.closest('button'); if (!b) return;
    if (b.dataset.o) { setOpt(b.dataset.o, isNaN(+b.dataset.v) ? b.dataset.v : +b.dataset.v); b.parentElement.querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b)); return; }
    const a = b.dataset.a;
    if (a === 'back') back();
    if (a === 'copy') { if (S.running) Game.save(); const code = await Game.makeCode(inGame ? null : true); const t = $('codeOut'); t.value = code; t.classList.remove('hide'); try { await navigator.clipboard.writeText(code); toast('Save code copied'); } catch (e) { t.select(); toast('Select and copy the code'); } }
    if (a === 'paste') { try { $('codeIn').value = await navigator.clipboard.readText(); } catch (e) { $('codeIn').focus(); toast('Long-press the box to paste'); } }
    if (a === 'load') { try { const sv = await Game.readCode($('codeIn').value); Game.loadSave(sv); closeSheet(); afterStart(); toast('Save loaded'); } catch (e) { toast("That code didn't work"); } }
    if (a === 'del') {
      if (!delArmed) { delArmed = true; b.textContent = `Tap again to delete ${info.name} forever`; return; }
      Game.deleteSave(); closeSheet(); toast(`${info.name} has been deleted`); showTitle();
    }
  };
}
const segHtml = k => { const [label, opts] = OPTS[k]; return `<p class="setl">${label}</p><div class="seg">${opts.map(([n, v]) => `<button data-o="${k}" data-v="${v}" class="${SET[k] === v ? 'on' : ''}">${n}</button>`).join('')}</div>`; };
function openMenu() {
  openSheet('Menu', body => {
    const st = document.createElement('div'); st.innerHTML = P8.statsHtml(); st.onclick = ev => P8.statsClick(ev); body.appendChild(st);
    const box = document.createElement('div'); body.appendChild(box);
    renderSettings(box, true, null);
    const nw = el('<div class="card"><h3>New character</h3><p>Start someone new from the title screen. You only have room for one character on this device, so copy your save code first.</p><div class="acts"><button>Back to the title screen</button></div></div>');
    nw.querySelector('button').onclick = () => { Game.save(); S.running = false; closeSheet(); MapUI.closeBig(); showTitle(); };
    body.appendChild(nw);
  });
}

// ---------- title ----------
export function showTitle(view = 'home') {
  if (S.scene) Game.endScene(); S.pendingScene = null; document.body.classList.remove('inscene'); $('scene').classList.add('hide');
  $('hud').classList.add('hide'); $('title').classList.remove('hide');
  const T = $('titleIn'), info = Game.saveInfo();
  const PATHS = { smuggler: ['Smuggler', 'The free worlds', 'You inherit a grounded freighter and a debt on the frontier moon of Dustfall.', '#ffb347'], justice: ['Justice', 'The Republic and the order', 'A first-year novice of the lamp-keepers, posted to a freezing fort on the edge of Republic space.', '#6ad8ff'], dark: ['Dark', 'The Empire and the Dusk Covenant', 'A conscript who survived the Winnowing. Now an initiate of the Covenant on the furnace world of Cinder, where the other initiates would like your bunk.', '#ff4a3a'] };
  const heroes = Object.keys(PATHS).map(p => [p, Game.saveInfoFor(p)]).filter(x => x[1]);
  if (view === 'home') X.newPath = null;
  const head = `<h1>Stars Beneath</h1><div class="sub">Build 10 · two thousand years after the Gravelord fell</div>`;
  if (view === 'home') {
    T.innerHTML = `${head}<div class="tmenu">
      ${heroes.map(([p, i]) => `<button class="pri" data-a="cont" data-p="${p}">Continue<small>${esc(i.name)} · level ${i.lvl} ${CLASSES[i.cls]?.name || ''} · ${PATHS[p][0]}</small></button>`).join('')}
      <button class="${heroes.length ? '' : 'pri'}" data-a="new">New character</button>
      <button data-a="set">Settings</button></div>
      <div class="acts" style="justify-content:center;margin-top:10px">${info ? '<button data-a="copyc">📋 Copy save code</button>' : ''}<button data-a="pastec">📥 Paste save code</button></div>
      <textarea id="codeBox" class="hide" style="height:70px;width:100%;margin-top:6px" placeholder="Paste a code starting STAR1."></textarea><div class="acts hide" id="codeGo" style="justify-content:center"><button data-a="loadc">Load this code</button></div>`;
    const loadCode = async code => { try { const sv = await Game.readCode(code); Game.setSlot(sv.ext?.path || 'smuggler'); Game.loadSave(sv); afterStart(); toast('Save loaded'); } catch (e) { toast("That code didn't work"); } };
    T.onclick = async ev => {
      const a = ev.target.closest('button')?.dataset.a, bp = ev.target.closest('button')?.dataset.p;
      if (a === 'copyc') { const code = await Game.makeCode(true); try { await navigator.clipboard.writeText(code); toast('Save code copied'); } catch (e) { const t = $('codeBox'); t.classList.remove('hide'); t.value = code; t.select(); toast('Select and copy the code'); } }
      if (a === 'pastec') { let code = ''; try { code = await navigator.clipboard.readText(); } catch (e) { } if (code && code.trim().startsWith('STAR1.')) { if (!info || confirmReplace(info)) loadCode(code); } else { $('codeBox').classList.remove('hide'); $('codeBox').value = ''; $('codeGo').classList.remove('hide'); $('codeBox').focus(); } }
      if (a === 'loadc') loadCode($('codeBox').value);
      if (a === 'cont') { try { if (bp) Game.setSlot(bp); Game.loadSave(); afterStart(); } catch (e) { console.error(e); toast('That save could not be loaded'); } }
      if (a === 'new') showTitle('path');
      if (a === 'set') showTitle('set');
    };
    return;
  }
  if (view === 'path') {
    T.innerHTML = `${head}<button data-a="back" style="margin:8px 0">← Back</button><div class="card" style="text-align:left"><h3>Choose your path</h3><p class="dim" style="margin:0 0 6px">Each path has its own hero, its own start and its own story.</p>
      ${Object.entries(PATHS).map(([p, [n, who, txt, c]]) => `<div class="card" data-path="${p}" style="cursor:pointer;border-color:${c};margin:6px 0"><b style="color:${c}">${n}</b> <small class="dim">· ${who}</small><p style="margin:3px 0 0">${txt}</p>${Game.saveInfoFor(p) ? `<p style="color:#ff8a6a;font-size:12px;margin:3px 0 0">You already have a ${n.toLowerCase()} hero. A new one replaces them.</p>` : ''}</div>`).join('')}
      </div>`;
    T.onclick = ev => { const c = ev.target.closest('[data-path]'); if (c) { X.newPath = c.dataset.path; Game.setSlot(X.newPath); showTitle('new'); return; } if (ev.target.closest('button')?.dataset.a === 'back') showTitle('home'); };
    return;
  }
  if (view === 'set') { T.onclick = null; T.innerHTML = head; const box = document.createElement('div'); T.appendChild(box); renderSettings(box, false, () => showTitle('home')); return; }
  // a new character starts with one weapon, and the weapon makes the class
  let pick = null, fcls = [];
  const draw = () => {
    T.innerHTML = `${head}<button data-a="back" style="margin:8px 0">← Back</button>
      <div class="card" style="text-align:left"><h3>Name your captain</h3><input type="text" id="heroName" maxlength="14" placeholder="Hero name" value="${esc(T.dataset.name || pickName())}"></div>
      <div class="card" style="text-align:left"><h3>Choose your weapon</h3>
      ${FAMILIES.map(f => `<p style="margin:10px 0 4px;font:700 13px Orbitron;color:var(--acc)">${FAMILY_ICON[f]} ${X.famPl?.[f] || f + 's'}</p><div class="wpick">${CLASS_KEYS.filter(k => CLASSES[k].family === f && !(X.hiddenCls || []).includes(k)).map(k => { const c = CLASSES[k]; return `<div class="card ${pick === k ? 'on' : ''}" data-k="${k}" style="border-color:${c.color}"><span class="wi">${wIcon(k)}</span><div><b style="color:${c.color}">${weaponOf(k)}</b><small>${c.name} · ${c.role}</small><p>${esc(c.blurb)}</p></div></div>`; }).join('')}</div>`).join('')}</div>
      ${info ? `<p style="color:#ff8a6a;font-size:13px">Starting a new character replaces ${esc(info.name)} (level ${info.lvl}). Copy their save code in Settings first if you want to keep them.</p>` : ''}
      <div style="position:sticky;bottom:0;padding:8px 0;background:linear-gradient(transparent,rgba(13,17,20,.95) 30%)"><button class="pri" data-a="go" style="width:100%;opacity:1" ${pick ? '' : 'disabled'}>${pick ? `${X.newPath === 'justice' ? 'Report to Fort Lastlight' : X.newPath === 'dark' ? 'Kneel at the Ember Citadel' : 'Wake up on Dustfall'} as a ${CLASSES[pick].name}` : 'Tap a weapon to choose it'}</button></div>`;
  };
  T.dataset.name = '';
  draw();
  T.onchange = ev => { const sel = ev.target.closest('select[data-f]'); if (sel) fcls[+sel.dataset.f] = sel.value; };
  T.onclick = ev => {
    const card = ev.target.closest('.wpick .card'), a = ev.target.closest('button')?.dataset.a;
    if (card) { T.dataset.name = $('heroName').value; const y = $('title').scrollTop; if (pick !== card.dataset.k) fcls = Game.defaultFriendCls(card.dataset.k); pick = card.dataset.k; draw(); $('title').scrollTop = y; return; }
    if (a === 'back') showTitle('path');
    if (a === 'go' && pick) { const n = ($('heroName').value || 'Hero').trim().slice(0, 14) || 'Hero'; Game.newGame(pick, n, undefined, [], X.newPath || 'smuggler'); afterStart(); }
  };
}
let replArmed = 0;
function confirmReplace(info) { if (Date.now() - replArmed < 4000) return true; replArmed = Date.now(); toast(`Tap Paste again to replace ${info.name}`); return false; }
function pickName() { return ['Kael', 'Wren', 'Corvane', 'Zadie', 'Taran', 'Merrow', 'Halcyon', 'Brisa'][(Math.random() * 8) | 0]; }
function afterStart() {
  $('title').classList.add('hide'); $('hud').classList.remove('hide');
  S.camYaw = Math.PI; S.camPitch = .36; S.camDist = 10.5; refreshKeys(true); zoneName = '';
  Game.save();
}

// ---------- each frame ----------
export function update(dt) {
  if (!S.running || !S.hero) return;
  S.frame++;
  updateScene();
  if (S.scene) return;
  updateFrames(); refreshKeys(); updateChat(); updatePlates(dt); updateMini(); updateAct(); MapUI.tick();
  { const h = S.hero, br = $('breath'), show = h.breath !== undefined && h.breath < Sea.BREATH_MAX - .01 && !h.dead; br.classList.toggle('hide', !show); if (show) br.firstElementChild.style.width = (h.breath / Sea.BREATH_MAX * 100) + '%'; }
  const dead = S.hero.dead;
  $('death').classList.toggle('hide', !dead);
  if (dead) {
    const healer = S.party.find(p => p.cls === 'cleric' && !p.dead && p !== S.hero);
    $('deathTxt').textContent = healer ? `${healer.name} can resurrect you once the fight is over. Or release now: you wake at the bind stone, lose some xp, and must run back to your corpse for your gear.` : 'Release to wake at the bind stone. You lose some xp, and your gear stays on your corpse until you run back for it.';
  }
  if (sheetOpen() && S.frame % 30 === 0 && sheetRender && bookTab === 'social' && $('sheetTitle').textContent === 'Book') { /* live list is fine to leave */ }
}
function openGate() {
  openSheet('Grove Gate', body => {
    body.appendChild(el('<p class="dim" style="margin-top:0">Where should the grove take your group?</p>'));
    for (const t of Sea.gateTargets()) { const b = el(`<button style="display:block;width:100%;margin:6px 0">${esc(t.label)}</button>`); b.onclick = () => { closeSheet(); Sea.gateTo(t); }; body.appendChild(b); }
  });
}
export function init() {
  Cb.setHooks({ gate: () => openGate() });
  buildKeys();
  addEventListener('pointerdown', onDown); addEventListener('pointermove', onMove); addEventListener('pointerup', onUp); addEventListener('pointercancel', onUp);
  const typing = e => /INPUT|TEXTAREA/.test(e.target?.tagName || '');
  addEventListener('keydown', e => { if (!typing(e)) onKey(e, true); }); addEventListener('keyup', e => { if (!typing(e)) onKey(e, false); });
  addEventListener('resize', () => { lastBarSig = ''; });
  addEventListener('wheel', e => { if (!sheetOpen()) S.camDist = clamp(S.camDist * (1 + Math.sign(e.deltaY) * .1), 3.5, 16); }, { passive: true });
  $('cycle').addEventListener('pointerup', e => { e.stopPropagation(); cycleTarget(); });
  $('sheetX').onclick = closeSheet;
  $('sheet').addEventListener('pointerdown', e => { if (e.target.id === 'sheet') closeSheet(); });
  $('bookBtn').onclick = () => openBook();
  $('menuBtn').onclick = openMenu;
  $('mini').onclick = openMap;
  MapUI.bind({ objText, questMark, toast }); MapUI.init(); applySettings();
  $('huntTag').onclick = () => Game.partyCommand('hunt');
  $('track').addEventListener('pointerup', ev => { const d = ev.target.closest('.go'); if (!d) return; ev.stopPropagation(); const q = QUESTS.find(q => q.id === d.dataset.q); if (q && Game.returnToGiver(q)) toast(`Back to ${GIVERS[Game.turnToOf(q)].name}`); });
  $('act').onclick = doAct;
  $('scene').addEventListener('pointerup', ev => { ev.stopPropagation(); if (ev.target.id === 'sceneSkip') Game.endScene(); else Game.nextShot(); });
  $('scene').addEventListener('pointerdown', ev => ev.stopPropagation());
  $('sitBtn').onclick = toggleSit;
  $('hpotBtn').onclick = () => err(Game.drinkPot('hpot'));
  $('mpotBtn').onclick = () => err(Game.drinkPot('mpot'));
  $('releaseBtn').onclick = () => Game.release();
  const clearTgt = ev => { ev.stopPropagation(); ev.preventDefault(); S.target = null; if (S.hero) S.hero.autoOn = false; };
  $('tgtX').addEventListener('pointerup', clearTgt); $('tgtX').onclick = clearTgt;
  $('tgtBtns').onclick = ev => {
    const a = ev.target.dataset.a, t = S.target; if (!a || !t) return;
    if (a === 'inv') Game.invite(t); if (a === 'fr') Game.befriend(t); if (a === 'kick') Game.kick(t); if (a === 'talk') interact(t); if (a === 'loot') openLoot(t); if (a === 'insp') openInspect(t);
    $('tgtBtns')._s = null;
  };
  // the long-press callout menu on iOS
  addEventListener('contextmenu', e => e.preventDefault());
}
