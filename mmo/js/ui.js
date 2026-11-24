// The HUD, touch and keyboard input, nameplates, and every panel.
import * as THREE from './three.js';
import { S, WH, TAU, clamp, dist, fct, chat } from './core.js';
import { cam } from './render.js';
import { world, hgt, regionAt, REGION_NAMES } from './world.js';
import { CLASSES, CLASS_KEYS, FAMILIES, MOBS, QUESTS, GIVERS, ELEMENTS, RARITY, SLOTS, SLOT_NAMES, POTIONS, xpNeed, defaultBar, MAX_LVL, roleOf, rankOf, rankName } from './data.js';
import * as Sea from './sea.js';
import { LORE, PERKS } from './story.js';
import { TALK, VILLAGER_LINES, MOB_LORE } from './dialogue.js';
import * as Cb from './combat.js';
import * as Game from './game.js';

const $ = id => document.getElementById(id);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const RES_COL = { mana: 'var(--mana)', rage: 'var(--rage)', focus: 'var(--focus)', energy: '#f0d040', momentum: '#ff8a4a' };
const ROLE_ICON = { tank: '🛡️', healer: '✚', dps: '⚔️' };
// one icon per family, so you can tell who's who at a glance
export const FAMILY_ICON = { Fighter: '🛡️', Healer: '💚', Rogue: '🗡️', Mage: '🔮' };
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
  else { const ab = CLASSES[S.heroCls].abilities[key]; const c = Cb.costOf(S.hero, ab); tip.innerHTML = `<b>${esc(rankName(S.hero, ab))}</b> ${ab.kind === 'ult' ? '· Ultimate' : ''}${rankOf(S.hero, ab) > 1 ? ' <span style="color:var(--acc)">(35% stronger)</span>' : ''}<br>${esc(ab.desc)}<br><span class="dim">${c ? c + ' ' + S.hero.resType + ' · ' : ''}${ab.cast ? ab.cast + ' s cast' : 'Instant'}${ab.cd ? ' · ' + ab.cd + ' s cooldown' : ''}</span>`; }
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
      el.querySelector('.lab').textContent = key === 'attack' ? 'Attack' : CLASSES[S.heroCls].abilities[key].name;
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
    if (e.remove || e === S.hero) continue;
    if (e.dead && !(e.mob && e.loot?.length && e.lootFor === 'party') && !(e.cls && e.inParty)) continue;
    if (dist(e, S.hero) > 70) continue;
    const s = screenOf(e, e.mob ? .9 : 1); if (s.behind) continue;
    const dd = Math.hypot(s.x - x, s.y - y), lim = 56 * Math.max(1, e.scale || 1) + 18 * (e.boss ? 2 : 0);
    if (dd < lim && dd + dist(e, S.hero) * .5 < bd) { bd = dd + dist(e, S.hero) * .5; best = e; }
  }
  return best;
}
const touches = new Map();
let joyId = null, joyO = null;
function onDown(ev) {
  if (ev.target.closest('button,#sheet,#title,.pf,#mini,#death,#tgt')) return;
  const p = { id: ev.pointerId, x0: ev.clientX, y0: ev.clientY, x: ev.clientX, y: ev.clientY, t: performance.now(), moved: 0 };
  // the joystick lives in the bottom-left corner: only touches that start on it move you; everywhere else is for tapping and turning
  const j = $('joy'), r = j.getBoundingClientRect(), jc = { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  if (joyId === null && Math.hypot(ev.clientX - jc.x, ev.clientY - jc.y) < r.width * .75) {
    joyId = ev.pointerId; joyO = jc; j.classList.add('on'); p.joy = true;
    const jx = clamp(ev.clientX - jc.x, -46, 46), jy = clamp(ev.clientY - jc.y, -46, 46); j.firstChild.style.transform = `translate(${jx}px,${jy}px)`; input.mx = jx / 46; input.mz = jy / 46;
  }
  touches.set(ev.pointerId, p);
}
function onMove(ev) {
  const p = touches.get(ev.pointerId); if (!p) return;
  const dx = ev.clientX - p.x, dy = ev.clientY - p.y; p.x = ev.clientX; p.y = ev.clientY; p.moved += Math.abs(dx) + Math.abs(dy);
  if (p.joy) {
    let jx = ev.clientX - joyO.x, jy = ev.clientY - joyO.y; const l = Math.hypot(jx, jy), m = 46;
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
    S.camYaw -= dx * .006; S.camPitch = clamp(S.camPitch + dy * .004, -.15, 1.15); input.lastDragT = S.time;
  }
}
function onUp(ev) {
  const p = touches.get(ev.pointerId); touches.delete(ev.pointerId);
  if ([...touches.values()].filter(o => !o.joy).length < 2) input.pinch = null;
  if (!p) return;
  if (p.joy) { joyId = null; input.mx = input.mz = 0; $('joy').classList.remove('on'); $('joy').firstChild.style.transform = ''; return; }
  if (p.moved < 18 && performance.now() - p.t < 550) {
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
    if (t && t.prop && dist(h, t) < 6 && Game.inspectLabel(t)) { label = Game.inspectLabel(t); actFn = () => { const lore = Game.inspect(t); if (lore) openLore(lore); }; }
    else if (t && t.team === 'npc' && !t.corpse && !t.prop && dist(h, t) < 7) { label = (t.banker ? 'Bank with ' : 'Talk to ') + t.name.split(' ')[0]; actFn = () => interact(t); }
    else if (t && t.mob && t.dead && t.loot?.length && t.lootFor === 'party' && dist(h, t) < 7) { label = 'Loot'; actFn = () => openLoot(t); }
    else {
      const body = S.ents.find(e => e.mob && e.dead && e.lootFor === 'party' && (e.loot?.length) && dist(e, h) < 5);
      const pr = !body && S.ents.find(e => e.prop && !e.remove && dist(e, h) < 4.5 && Game.inspectLabel(e));
      if (pr) { label = Game.inspectLabel(pr); actFn = () => { const lore = Game.inspect(pr); if (lore) openLore(lore); }; }
      else if (body) { label = 'Loot ' + body.name; actFn = () => openLoot(body); }
      else { const n = S.ents.find(e => e.team === 'npc' && !e.corpse && !e.prop && !e.remove && dist(e, h) < 4.5); if (n) { label = (n.banker ? 'Bank with ' : 'Talk to ') + n.name.split(' ')[0]; actFn = () => interact(n); } }
    }
    if (!label) { const a = Sea.action(); if (a) { label = a.label; actFn = a.fn; } }
  }
  b.classList.toggle('hide', !label); if (label && b.textContent !== label) b.textContent = label;
}
function interact(n) {
  if (dist(S.hero, n) > 8) { toast('Too far away'); return; }
  if (n.prop) { const lore = Game.inspect(n); if (lore) openLore(lore); }
  else if (n.banker) openBank();
  else if (n.giver) openGiver(n.giver);
  else if (n.storyNpc || n.guard || n.team === 'npc') { const v = VILLAGER_LINES[n.name]; const line = Array.isArray(v) ? pickOf(v) : v || (n.guard ? 'Move along, citizen. Nothing to see here, and I intend to keep it that way.' : 'Good day to you.'); chat('say', n.name, Game.fill(line)); toast(n.name + ': ' + Game.fill(line)); }
  else if (n.vendor) openVendor(n);
  else if (n.armory) openBook('char');
  else if (n.bindstone) { S.bind = { zone: S.zone, x: n.x, z: n.z + 1.5 }; const pl = placeAt(n.x, n.z); chat('sys', null, 'You are bound here.'); toast('Bound to ' + (pl ? pl.name : world.names.town)); Game.save(); }
}

// ---------- frames ----------
const partyEls = [];
function frameRes(e) { return e.resType === 'mana' ? `${Math.round(e.res)} / ${e.resMax}` : `${Math.round(e.res)} ${e.resType}`; }
function updateFrames() {
  const h = S.hero;
  $('meName').textContent = h.name; $('meLvl').textContent = `${h.lvl} ${CLASSES[h.cls].name}`;
  $('meHp').style.width = pct(h.hp, h.maxHp) + '%'; $('meHpT').textContent = `${Math.ceil(h.hp)} / ${h.maxHp}`;
  $('meRes').style.width = pct(h.res, h.resMax) + '%'; $('meRes').style.background = RES_COL[h.resType]; $('meResT').textContent = frameRes(h);
  const bs = h.buffs.filter(b => b.dur > 1 && !b.id.includes(':') && b.id !== 'wardlock').slice(0, 12).map(b => `<span title="${b.id}">${BUFF_ICON[b.id] || '•'}${b.data.stacks ? b.data.stacks : ''}</span>`).join('') + (S.corpse ? '<span>🪦</span>' : '');
  if ($('buffs')._s !== bs) { $('buffs').innerHTML = bs; $('buffs')._s = bs; }
  // party
  const box = $('party'), mates = S.party.filter(p => !p.isHero);
  while (partyEls.length < mates.length) {
    const d = document.createElement('div'); d.className = 'pf plate';
    d.innerHTML = '<div class="fname"><b></b><small></small></div><div class="bar"><i style="background:var(--hp)"></i></div><div class="bar thin"><i></i></div><span class="cast"></span>';
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
    const aggro = !p.dead && S.ents.some(m => m.mob && !m.dead && m.target === p && m.engaged) && roleOf(p) !== 'tank';
    if (aggro && !d.querySelector('.aggro')) { const a = document.createElement('span'); a.className = 'aggro'; d.appendChild(a); } else if (!aggro) d.querySelector('.aggro')?.remove();
  });
  let cmds = $('cmds');
  if (mates.length && !cmds) { cmds = document.createElement('div'); cmds.id = 'cmds'; cmds.innerHTML = ['follow', 'assist', 'hold', 'pull', 'clear'].map(c => `<button data-c="${c}">${{ follow: 'Follow', assist: 'Assist', hold: 'Hold', pull: 'Pull', clear: 'Clear' }[c]}</button>`).join(''); cmds.onclick = ev => { const c = ev.target.dataset.c; if (c) Game.partyCommand(c); }; box.appendChild(cmds); }
  if (cmds) { cmds.style.display = mates.length ? '' : 'none'; box.appendChild(cmds); cmds.querySelectorAll('button').forEach(b => b.classList.toggle('on', b.dataset.c === S.cmd)); }
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
    else if (t.team === 'npc' && !t.corpse && !t.prop) btns = `<button data-a="talk">${t.banker ? 'Bank' : 'Talk'}</button>`;
    else if (t.mob && t.dead && t.loot?.length && t.lootFor === 'party') btns = `<button data-a="loot">Loot</button>`;
    if (!t.prop && !t.corpse && !(t.mob && t.dead)) btns += '<button data-a="insp">Inspect</button>';
    if ($('tgtBtns')._s !== btns) { $('tgtBtns').innerHTML = btns; $('tgtBtns')._s = btns; }
    // threat on the target
    let th = '';
    if (t.mob && t.engaged && !t.dead && t.threat.size) {
      const rows = [...t.threat.entries()].filter(([e]) => !e.dead).sort((a, b) => b[1] - a[1]).slice(0, 4), top = rows[0]?.[1] || 1;
      const tankTop = rows[0] && roleOf(rows[0][0]) === 'tank';
      th = rows.map(([e, v]) => { const me = e === h, hot = me && roleOf(h) !== 'tank' && v > top * .9 && rows[0][0] !== h && tankTop; return `<div class="th ${me ? 'me' : ''} ${hot ? 'hot' : ''}"><b>${esc(e.name)}</b><span>${Math.round(v / top * 100)}%</span><div class="bar" style="grid-column:1/3"><i style="width:${v / top * 100}%;background:${e === t.target ? '#ff6a4a' : CLASSES[e.cls]?.color || '#999'}"></i></div></div>`; }).join('');
      th = '<div class="dim" style="font-size:10px">Threat</div>' + th;
    }
    if ($('threat')._s !== th) { $('threat').innerHTML = th; $('threat')._s = th; }
  }
  // quest tracker under the target frame
  const tr = $('track'), r = tf.classList.contains('hide') ? null : tf.getBoundingClientRect();
  tr.style.top = (r && (innerWidth / innerHeight < 4 / 3) ? r.bottom + 6 : (parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--st')) || 6) + 112) + 'px';
  if (innerWidth / innerHeight >= 4 / 3) tr.style.top = '120px';
  const qs = QUESTS.filter(q => S.quests[q.id] && S.quests[q.id].state !== 'turned').sort((a, b) => (b.story ? 1 : 0) - (a.story ? 1 : 0)).slice(0, 3);
  const tq = qs.map(q => { const st = S.quests[q.id]; return `<div>${esc(q.name)}: <b>${st.state === 'done' ? (q.obj.talk || q.obj.at ? 'talk to ' + esc(GIVERS[Game.turnToOf(q)].name.split(' ').pop()) : 'done ✓') : q.obj.at ? 'travel' : st.n + '/' + q.obj.n}</b></div>`; }).join('');
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
const BUFF_ICON = { shout: '🎺', iron: '⚙️', fort: '🛐', inner: '🔆', eagle: '🦅', trueshot: '🎖️', kindle: '🕯️', eward: '🔮', shieldwall: '🧱', unbreak: '⛰️', moon: '🌙', deadeye: '👁️', slow: '🐌', root: '📌',
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
    if (e.remove || e === h) continue;
    const dd = dist(e, h); if (dd > 45) continue;
    if (e.dead && !(e.mob && e.loot?.length && e.lootFor === 'party')) continue;
    if (e.mob && !(e === S.target || (e.engaged && [...e.threat.keys()].some(k => S.party.includes(k))) || e.named || e.boss) && !e.dead) continue;
    if (e.guard && dd > 15) continue;
    if (e.prop && (dd > 22 || !Game.inspectLabel(e))) continue;
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
  const c = $('mini'), g = c.getContext('2d'), h = S.hero, W = c.width, span = 140, sc = W / span;
  g.save(); g.clearRect(0, 0, W, W); g.beginPath(); g.arc(W / 2, W / 2, W / 2, 0, TAU); g.clip();
  g.translate(W / 2, W / 2); g.rotate(-S.camYaw + Math.PI); g.translate(-W / 2, -W / 2);
  const mm = world.minimap, k = mm.width / (2 * WH);
  g.drawImage(mm, (h.x + WH - span / 2) * k, (h.z + WH - span / 2) * k, span * k, span * k, 0, 0, W, W);
  const P = (x, z) => [(x - h.x) * sc + W / 2, (z - h.z) * sc + W / 2];
  const dot = (x, z, r, col) => { const [px, pz] = P(x, z); g.fillStyle = col; g.beginPath(); g.arc(px, pz, r, 0, TAU); g.fill(); };
  for (const e of S.ents) {
    if (e.dead || e.remove || Math.abs(e.x - h.x) > span / 2 || Math.abs(e.z - h.z) > span / 2) continue;
    if (e.mob) { if (e.engaged || e === S.target) dot(e.x, e.z, e.boss ? 6 : 3.5, e === S.target ? '#fff' : '#ff4a3a'); else if (e.named || e.boss) dot(e.x, e.z, 4, '#ff9a3a'); }
    else if (e.inParty && !e.isHero) dot(e.x, e.z, 4, '#5fd3ff');
    else if (e.fake) dot(e.x, e.z, 2.5, '#d8d8ff');
    else if (e.giver) { const qs = Game.questsFor(e.giver); const mk = questMark(e.giver); if (mk) { const [px, pz] = P(e.x, e.z); g.fillStyle = '#ffd34d'; g.font = 'bold 18px Cinzel'; g.textAlign = 'center'; g.fillText(mk, px, pz + 6); } }
  }
  if (Sea.sea.ferry) { const f = Sea.sea.ferry; dot(f.x, f.z, 5, '#ffd34d'); }
  for (const d of world.docks || []) dot(d.x, d.z, 2.5, '#c8a878');
  if (S.corpse && (S.corpse.zone || 'vale') === S.zone) { const [px, pz] = P(S.corpse.x, S.corpse.z); g.strokeStyle = '#8dffef'; g.lineWidth = 3; g.beginPath(); g.moveTo(px - 6, pz - 6); g.lineTo(px + 6, pz + 6); g.moveTo(px + 6, pz - 6); g.lineTo(px - 6, pz + 6); g.stroke(); }
  g.restore();
  // you, as an arrow pointing where you face
  g.save(); g.translate(W / 2, W / 2); g.rotate(-(h.yaw - S.camYaw)); g.fillStyle = '#fff'; g.strokeStyle = '#000'; g.lineWidth = 2;
  g.beginPath(); g.moveTo(0, -10); g.lineTo(7, 8); g.lineTo(0, 4); g.lineTo(-7, 8); g.closePath(); g.stroke(); g.fill(); g.restore();
  g.strokeStyle = 'rgba(238,228,204,.5)'; g.lineWidth = 3; g.beginPath(); g.arc(W / 2, W / 2, W / 2 - 1.5, 0, TAU); g.stroke();
  // compass N
  const na = -S.camYaw + Math.PI; g.fillStyle = '#ffd34d'; g.font = 'bold 20px Cinzel'; g.textAlign = 'center'; g.fillText('N', W / 2 + Math.sin(na) * (W / 2 - 14) * -1, W / 2 - Math.cos(na) * (W / 2 - 14) + 7);
  const pl = placeAt(h.x, h.z), zn = pl ? pl.name : REGION_NAMES()[regionAt(h.x, h.z)] || world.names.zone;
  if (zn !== zoneName) { if (zoneName) toast(zn); zoneName = zn; $('zone').textContent = zn; }
}

// ---------- panels ----------
let sheetRender = null;
export function openSheet(title, render) { $('sheetTitle').textContent = title; sheetRender = render; $('sheet').classList.remove('hide'); refreshSheet(); }
export function refreshSheet() { if (!sheetRender) return; const st = $('sheetBody').scrollTop; $('sheetBody').innerHTML = ''; sheetRender($('sheetBody')); $('sheetBody').scrollTop = st; }
export function closeSheet() { $('sheet').classList.add('hide'); sheetRender = null; swapPick = swapPick; }
const sheetOpen = () => !$('sheet').classList.contains('hide');
function el(html) { const d = document.createElement('div'); d.innerHTML = html; return d.firstElementChild || d; }
function itemHtml(it, cmp) {
  const rc = RARITY[it.rarity].c, s = it.stats;
  const st = Object.entries(s).map(([k, v]) => { const dlt = cmp ? v - (cmp.stats[k] || 0) : 0; return `<span>${{ sta: 'Stamina', pow: 'Power', crit: 'Crit %', arm: 'Armor' }[k]} ${v}${cmp && dlt ? ` <i class="${dlt > 0 ? 'up' : 'down'}">${dlt > 0 ? '+' : ''}${Math.round(dlt * 10) / 10}</i>` : ''}</span>`; }).join('');
  if (cmp) for (const k in cmp.stats) if (!(k in s)) { }
  return `<b>${esc(it.name)}</b> <span class="dim">· ${SLOT_NAMES[it.slot]}${it.armorType ? ' · ' + it.armorType : it.type ? ' · ' + it.type : ''} · L${it.lvl}</span><div class="st">${st}</div>`;
}
let bookTab = 'char';
export function openBook(tab) {
  if (tab) bookTab = tab;
  openSheet('Book', body => {
    const tabs = el(`<div class="tabs">${[['char', 'Character'], ['spells', 'Spells'], ['quests', 'Quests'], ['bags', 'Bags'], ['lore', 'Lore'], ['social', 'Social']].map(([k, n]) => `<button data-t="${k}" class="${bookTab === k ? 'on' : ''}">${n}</button>`).join('')}</div>`);
    tabs.onclick = ev => { const t = ev.target.dataset.t; if (t) { bookTab = t; refreshSheet(); } };
    body.appendChild(tabs);
    ({ char: tabChar, spells: tabSpells, quests: tabQuests, bags: tabBags, lore: tabLore, social: tabSocial })[bookTab](body);
  });
}
function tabChar(body) {
  const h = S.hero, C = CLASSES[S.heroCls];
  body.appendChild(el(`<div class="card"><h3 style="color:${C.color}">${esc(h.name)} · Level ${h.lvl} ${C.name}</h3><p>${C.family} · ${C.role}. ${esc(C.blurb)}</p>
    <div class="grid2" style="margin-top:6px"><div><div class="stat"><span>Health</span><span>${h.maxHp}</span></div><div class="stat"><span>${h.resType}</span><span>${h.resMax}</span></div><div class="stat"><span>Power</span><span>${Math.round(h.power)}</span></div></div>
    <div><div class="stat"><span>Armor</span><span>${Math.round(h.armor)}</span></div><div class="stat"><span>Crit</span><span>${(h.crit * 100).toFixed(1)}%</span></div><div class="stat"><span>XP</span><span>${h.lvl >= MAX_LVL ? 'max' : Math.round(h.xp) + ' / ' + xpNeed(h.lvl)}</span></div></div></div>
    <p>Gold: ${S.gold}</p></div>`));
  // progression across classes: the level 10 lock, faster xp, account bonuses, perks
  { const fam = FAMILIES.map(f => { const b = Game.famBest(f); return `<span class="fam ${b >= 10 ? 'ok' : ''}">${{ Fighter: '🛡️', Healer: '💚', Rogue: '🗡️', Mage: '🔮' }[f]} ${f} ${b}${b >= 10 ? ' ✓' : ''}</span>`; }).join('');
    const locked = Game.lockedAt10(), A = h.acct || {}, boost = Math.round(Game.xpBoost() * 100);
    body.appendChild(el(`<div class="card"><h3>Your classes</h3><div class="fams">${fam}</div>
      <p style="margin:6px 0 2px">${locked ? 'Levels above 10 are <b style="color:#ff8a6a">locked</b> until you have one class from each family at level 10.' : 'Level 10 lock lifted. Every class can level to 20.'} ${Game.raidReady() ? 'Raid ready: one class from each family at 20.' : '<span class="dim">The raid needs one class from each family at 20.</span>'}</p>
      <p class="dim" style="margin:2px 0">Faster xp for this class: <b style="color:var(--acc)">+${boost}%</b> (20% for each other class at 10+). Account bonus for every class: +${A.sta || 0} stamina, +${A.pow || 0} power.${S.vetXp > 0 ? ` Veteran xp banked: <b style="color:#c8a2ff">${Math.round(S.vetXp)}</b> (doubles xp for classes that can still level).` : ''}</p></div>`));
    const open = Game.perksOpen();
    const pc = el(`<div class="card"><h3>Perks <span class="dim" style="font:500 12px Alegreya Sans">· ${S.perks.length}/2 slotted · each class at level 10 unlocks one</span></h3><div class="perks">${CLASS_KEYS.map(k => { const P = PERKS[k], on = S.perks.includes(k), ok = open.includes(k); return `<button data-p="${k}" class="perk ${on ? 'on' : ''}" ${ok ? '' : 'disabled'}><span>${P.icon}</span><b>${esc(P.name)}</b><small>${ok ? esc(P.desc) : CLASSES[k].name + ' 10'}</small></button>`; }).join('')}</div></div>`);
    pc.onclick = ev => { const b = ev.target.closest('button'); if (b && b.dataset.p) { Game.togglePerk(b.dataset.p); refreshSheet(); } };
    body.appendChild(pc);
  }
  const g = S.gear[S.heroCls];
  body.appendChild(el('<h3 style="font:700 13px Cinzel;margin:8px 0 4px;color:var(--dim)">Equipped</h3>'));
  for (const sl of SLOTS) {
    const it = g[sl];
    const c = el(`<div class="card it" style="--c:${it ? RARITY[it.rarity].c : '#444'}">${it ? itemHtml(it) : `<span class="dim">${SLOT_NAMES[sl]}: empty</span>`}${it ? '<div class="acts"><button>Unequip</button></div>' : ''}</div>`);
    if (it) c.querySelector('button').onclick = () => { Game.unequip(sl); refreshSheet(); };
    body.appendChild(c);
  }
  if (S.corpse) body.appendChild(el(`<p class="dim">Your ${CLASSES[S.corpse.cls].name} gear is on your corpse. Run back and recover it.</p>`));
  body.appendChild(el('<h3 style="font:700 13px Cinzel;margin:10px 0 4px;color:var(--dim)">Classes (each levels on its own)</h3>'));
  for (const k of CLASS_KEYS) {
    if (k === CLASS_KEYS.find(x => CLASSES[x].family === CLASSES[k].family)) body.appendChild(el(`<p style="margin:8px 0 3px;font:700 12px Cinzel;color:var(--acc)">${CLASSES[k].family}s</p>`));
    const c = CLASSES[k], on = k === S.heroCls;
    const card = el(`<div class="card cls ${on ? 'on' : ''}" style="--c:${c.color}"><div class="ic">${roleIcon(k)}</div><div style="flex:1"><b style="color:${c.color}">${c.name}</b> <span class="dim">· ${c.family} · level ${S.classes[k].lvl}</span><p style="margin:1px 0">${esc(c.blurb)}</p></div>${on ? '' : '<button>Switch</button>'}</div>`);
    if (!on) card.querySelector('button').onclick = () => { if (Game.switchClass(k)) { refreshKeys(true); refreshSheet(); } };
    body.appendChild(card);
  }
}
function tabSpells(body) {
  const C = CLASSES[S.heroCls], h = S.hero, bar = barOf();
  body.appendChild(el(`<p class="dim" style="margin-top:0">Tap a spell to put it on the bar, then tap a bar slot below to place it. Swap two bar slots by tapping one, then the other. Default bars hold your active spells, then your buffs, then the ultimate.</p>`));
  const slots = el('<div id="barEdit" style="display:grid;grid-template-columns:repeat(6,1fr);gap:5px;margin-bottom:10px"></div>');
  bar.forEach((k, i) => {
    const ab = k && k !== 'attack' ? C.abilities[k] : null;
    const b = el(`<button style="min-height:46px;font-size:20px;padding:0;${editPick === i || (pendingSpell && 1) ? '' : ''}${swapEdit === i ? 'box-shadow:0 0 0 2px var(--acc)' : ''}">${k ? (k === 'attack' ? '⚔️' : ab.icon) : '·'}</button>`);
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
  const all = [['attack', { name: 'Auto Attack', icon: '⚔️', lvl: 1, kind: 'attack', desc: 'Toggle attacking your target with your weapon.' }], ...Object.entries(C.abilities)];
  for (const [k, ab] of all) {
    const lock = ab.lvl > h.lvl, cost = k === 'attack' ? 0 : Cb.costOf(h, ab), onBar = bar.includes(k);
    const card = el(`<div class="card sp ${lock ? 'lock' : ''}" style="${pendingSpell === k ? 'box-shadow:0 0 0 2px var(--acc)' : ''}"><div class="ic">${ab.icon}</div><div style="flex:1"><b>${esc(k === 'attack' ? ab.name : rankName(h, ab))}</b> <small>${ab.kind === 'ult' ? 'ULTIMATE' : ab.kind.toUpperCase()}</small> <span class="dim">${lock ? '· level ' + ab.lvl : k !== 'attack' && rankOf(h, ab) < 2 && ab.lvl + 10 <= MAX_LVL ? '· Rank II at ' + (ab.lvl + 10) : ''}</span><p style="margin:2px 0">${esc(ab.desc)}</p><span class="dim" style="font-size:12px">${cost ? cost + ' ' + h.resType + ' · ' : ''}${ab.cast ? ab.cast + ' s cast' : 'Instant'}${ab.cd ? ' · ' + ab.cd + ' s cooldown' : ''}${onBar ? ' · on bar' : ''}</span></div></div>`);
    card.onclick = () => { pendingSpell = pendingSpell === k ? null : k; swapEdit = -1; refreshSheet(); };
    body.appendChild(card);
  }
  if (Object.values(C.abilities).some(a => a.kind === 'ult')) body.appendChild(el(`<p class="dim" style="font-size:12px">Ultimates charge from fighting: damage dealt, damage taken and healing done fill the gold strip on the key.</p>`));
}
let pendingSpell = null, swapEdit = -1, editPick = -1;
function tabLore(body) {
  const ids = Object.keys(LORE), got = ids.filter(id => S.lore[id]);
  body.appendChild(el(`<p class="dim" style="margin-top:0">Pages found: <b style="color:var(--acc)">${got.length} / ${ids.length}</b>. Look for glowing lecterns ✦ around the world.</p>`));
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
    body.appendChild(el('<h3 style="font:700 13px Cinzel;margin:4px 0;color:var(--dim)">In the bank</h3>'));
    if (!S.bank.length) body.appendChild(el('<p class="dim">Empty.</p>'));
    for (const it of S.bank) { const c = el(`<div class="card it" style="--c:${RARITY[it.rarity || 0].c}">${itemHtml(it)}<div class="acts"><button>Take</button></div></div>`); c.querySelector('button').onclick = () => { Game.bankTake(it); refreshSheet(); }; body.appendChild(c); }
    body.appendChild(el('<h3 style="font:700 13px Cinzel;margin:10px 0 4px;color:var(--dim)">In your bags</h3>'));
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
  if (!act.length) body.appendChild(el(`<p class="dim">No quests yet. Look for the <b style="color:#ffd34d">!</b> over people's heads in ${esc(world.names.town)}.</p>`));
  for (const q of act) {
    const st = S.quests[q.id];
    body.appendChild(el(`<div class="card"><h3>${esc(q.name)} <span class="dim" style="font:500 12px Alegreya Sans">· level ${q.lvl}</span></h3><p>${esc(Game.fill(q.text))}</p><p style="color:var(--ink)">${q.story ? '<b style="color:#c8a2ff">Main story</b> · ' : ''}${objText(q)}: <b style="color:var(--acc)">${st.state === 'done' ? (q.obj.talk || q.obj.at ? 'Talk to ' : 'Done. Return to ') + GIVERS[Game.turnToOf(q)].name + '.' : q.obj.at ? 'travel there' : st.n + ' / ' + q.obj.n}</b></p></div>`));
  }
  const done = QUESTS.filter(q => S.quests[q.id]?.state === 'turned');
  if (done.length) body.appendChild(el(`<p class="dim" style="font-size:12px">Completed: ${done.map(q => esc(q.name)).join(', ')}</p>`));
}
const plural = w => /man$/.test(w) ? w.replace(/man$/, 'men') : /Bones$/.test(w) ? w : /(?:wolf|elf)$/i.test(w) ? w.replace(/f$/i, 'ves') : /(s|x|ch|sh)$/i.test(w) ? w + 'es' : /[^aeiou]y$/i.test(w) ? w.slice(0, -1) + 'ies' : w + 's';
const orList = a => a.length < 2 ? a.join('') : a.slice(0, -1).join(', ') + ' or ' + a[a.length - 1];
function objText(q) {
  const o = q.obj, nm = k => MOBS[k].name, n = o.n || 1;
  if (o.what) return Game.fill(o.what);
  if (o.named) return `Defeat ${world.names[o.named] || MOBS[o.named]?.name || o.named}`;
  const where = o.dungeon ? ' in the Ossuary' : o.near === 'waste' ? ' in the Grey Waste' : o.reef ? ' on the Drowned Reef' : '';
  if (o.collect) return `Collect ${n} ${o.item}${n > 1 && !/s$/.test(o.item) && !/silk|ectoplasm|bacon/i.test(o.item) ? 's' : ''} from ${orList([...new Set(o.collect.map(k => plural(nm(k))))])}${where}`;
  return `Defeat ${n} ${orList([...new Set(o.kill.map(k => n > 1 ? plural(nm(k)) : nm(k)))])}${where}`;
}
function tabBags(body) {
  body.appendChild(el(`<p style="margin-top:0">Gold: <b style="color:var(--acc)">${S.gold}</b> · Potions: 🧪 ${S.pots.hpot} · 💧 ${S.pots.mpot} · Bags ${S.bag.length}/30</p>`));
  if (!S.bag.length) body.appendChild(el('<p class="dim">Your bags are empty.</p>'));
  const vend = S.ents.some(n => n.vendor && !n.dead && dist(S.hero, n) < 8);
  for (const it of S.bag) {
    const ok = Game.canWear(S.heroCls, it), cur = S.gear[S.heroCls][it.slot];
    const c = el(`<div class="card it" style="--c:${RARITY[it.rarity].c}">${itemHtml(it, ok ? cur : null)}${ok ? '' : `<p style="font-size:12px;margin:2px 0">A ${CLASSES[S.heroCls].name} can't use this.</p>`}<div class="acts">${ok ? '<button data-a="eq">Equip</button>' : ''}${vend ? `<button data-a="sell">Sell ${it.value}g</button>` : ''}${S.party.length > 1 ? '<button data-a="give">Give…</button>' : ''}</div></div>`);
    c.onclick = ev => {
      const a = ev.target.dataset.a;
      if (a === 'eq') { Game.equip(it); refreshSheet(); }
      if (a === 'sell') { Game.sell(it); refreshSheet(); }
      if (a === 'give') { const acts = c.querySelector('.acts'); acts.innerHTML = S.party.filter(p => !p.isHero).map((p, i) => `<button data-g="${i}">${esc(p.name)}${Game.canWear(p.cls, it) ? ' ✓' : ''}</button>`).join(''); }
      if (ev.target.dataset.g !== undefined) { const p = S.party.filter(p => !p.isHero)[+ev.target.dataset.g]; S.bag = S.bag.filter(b => b !== it); Game.assignLoot({ loot: [it] }, it, p); refreshSheet(); }
    };
    body.appendChild(c);
  }
  if (!vend) body.appendChild(el(`<p class="dim" style="font-size:12px">Sell items to any town vendor.</p>`));
}
function tabSocial(body) {
  const mates = S.party.filter(p => !p.isHero);
  body.appendChild(el(`<h3 style="font:700 13px Cinzel;margin:0 0 4px;color:var(--dim)">Your group (${S.party.length}/6)</h3>`));
  if (!mates.length) body.appendChild(el('<p class="dim" style="margin-top:0">Just you. A good group is 1 tank, 2 healers and 3 damage.</p>'));
  for (const p of mates) {
    const c = el(`<div class="who"><div><b style="color:${CLASSES[p.cls].color}">${roleIcon(p.cls)} ${esc(p.name)}</b> <small>L${p.lvl} ${CLASSES[p.cls].name}${p.fake.friend ? ' · ★ friend' : ''}${p.fake.guild ? ' · &lt;' + esc(p.fake.guild) + '&gt;' : ''}</small></div><button data-a="fr">${p.fake.friend ? 'Unfriend' : 'Friend'}</button><button data-a="kick">Remove</button></div>`);
    c.onclick = ev => { const a = ev.target.dataset.a; if (a === 'fr') Game.befriend(p); if (a === 'kick') Game.kick(p); refreshSheet(); };
    body.appendChild(c);
  }
  body.appendChild(el(`<h3 style="font:700 13px Cinzel;margin:10px 0 4px;color:var(--dim)">Who's around</h3>`));
  const roleOrder = { tank: 0, healer: 1, dps: 2 };
  const others = S.fakes.filter(f => !f.inParty && !f.dead && dist(f, S.hero) < 120).sort((a, b) => (b.fake.friend - a.fake.friend) || (roleOrder[CLASSES[a.cls].role] - roleOrder[CLASSES[b.cls].role]) || Math.abs(a.lvl - S.hero.lvl) - Math.abs(b.lvl - S.hero.lvl));
  if (!others.length) body.appendChild(el('<p class="dim">Nobody nearby. Try the town.</p>'));
  for (const f of others) {
    const busy = f.fake.group ? ' · in a group' : f.fake.state === 'hunt' ? ' · hunting' : '';
    const c = el(`<div class="who"><div><b style="color:${CLASSES[f.cls].color}">${roleIcon(f.cls)} ${esc(f.name)}</b> <small>L${f.lvl} ${CLASSES[f.cls].name}${f.fake.friend ? ' · ★' : ''}${busy} · ${Math.round(dist(f, S.hero))} m</small></div><button data-a="inv" ${S.party.length >= 6 ? 'disabled' : ''}>Invite</button></div>`);
    c.onclick = ev => { if (ev.target.dataset.a === 'inv') { Game.invite(f); refreshSheet(); } };
    body.appendChild(c);
  }
  body.appendChild(el(`<h3 style="font:700 13px Cinzel;margin:10px 0 4px;color:var(--dim)">Chat log</h3>`));
  body.appendChild(el(`<div id="log">${S.log.slice(-60).reverse().map(l => `<div class="ch-${l.ch}">${l.from ? `<b>${l.ch === 'gen' ? '[General] ' : l.ch === 'guild' ? '[Guild] ' : ''}${esc(l.from)}:</b> ` : ''}${esc(l.text)}</div>`).join('')}</div>`));
}
const spName = sp => sp === 'you' ? S.heroName : GIVERS[sp]?.name || sp;
function sayHtml(lines, def) {
  return '<div class="says">' + (lines || []).map(l => { const [sp, t] = typeof l === 'string' ? [def, l] : l; return `<div class="say${sp === 'you' ? ' me' : sp === def ? '' : ' alt'}">${sp ? `<b>${esc(spName(sp))}</b>` : ''}<p>${esc(Game.fill(t))}</p></div>`; }).join('') + '</div>';
}
let conv = null, reopenAfterScene = null;
const ACCEPT_LINES = ["Thank you, {hero}. I'll be right here when you get back.", 'Wonderful. Good luck out there, and do try to come back in one piece.', "I knew I could count on you. Off you go, then."];
const pickOf = a => a && a.length ? a[Math.floor(Math.random() * a.length)] : null;
// a conversation with someone who gives quests: a greeting, then things you can say
function openGiver(k) {
  const T = TALK[k] || {};
  conv = { k, view: 'menu', lines: [pickOf(T.greet) || 'Hello there.'] };
  const ready = Game.turnInsFor(k)[0]; if (ready) conv = { k, view: 'done', q: ready };
  openSheet(GIVERS[k].name, renderConv);
}
function renderConv(body) {
  const c = conv, k = c.k, g = GIVERS[k], T = TALK[k] || {}, h = S.hero;
  body.appendChild(el(`<p class="dim" style="margin:0 0 6px">${esc(Game.fill(g.title || ''))}</p>`));
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
    for (const t of (T.topics || [])) if (!t.after || S.quests[t.after]?.state === 'turned') list.push([`▸ ${esc(Game.fill(t.q))}`, () => go({ view: 'topic', t })]);
    list.push(['▸ Farewell.', () => closeSheet()]);
    opts(list);
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
    body.appendChild(el(`<p class="obj"><b>Objective:</b> ${esc(objText(q))}.<br><span class="dim">Reward: ${q.xp} xp and ${q.gold} gold${q.gear ? ', plus a piece of gear' : ''}.${q.lvl > h.lvl ? ` <span style="color:#ff8a6a">Level ${q.lvl} is recommended.</span>` : ''}</span></p>`));
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
    body.appendChild(el(sayHtml(q.done || ['Well done, and thank you.'], def)));
    const a = el(`<div class="acts col">${q.choices ? q.choices.map((ch, i) => `<button class="pri" data-c="${i}">${esc(Game.fill(ch.t))}</button>`).join('') : '<button class="pri" data-c="-1">Complete the quest</button>'}</div>`);
    a.onclick = ev => {
      const cc = ev.target.dataset.c; if (cc === undefined) return;
      const reply = Game.turnIn(q, +cc >= 0 ? +cc : null);
      refreshKeys(true);
      const lines = [...(reply ? [reply] : []), ['', `Quest complete: ${q.name}. You earn ${q.xp} xp and ${q.gold} gold.`]];
      if (S.pendingScene) { closeSheet(); return; }
      go({ view: 'reply', lines, k: def });
    };
    body.appendChild(a);
  }
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
      const C = CLASSES[t.cls], f = t.fake, fam = { Fighter: '🛡️', Healer: '💚', Rogue: '🗡️', Mage: '🔮' }[C.family];
      const rel = t.isHero ? 'This is you.' : f?.bff ? 'Your friend. Always your level, and always plays the role your group is missing.' : t.inParty ? 'In your group.' : f?.friend ? 'On your friends list.' : '';
      body.appendChild(el(`<div class="card"><h3>${fam} ${esc(t.name)}</h3><p style="margin:2px 0">Level ${t.lvl} ${esc(C.name)} · ${esc(C.family)} · ${esc(C.role === 'dps' ? 'damage' : C.role)}</p>
        ${f?.guild ? `<p class="dim" style="margin:2px 0">&lt;${esc(f.guild)}&gt;</p>` : ''}${f ? `<p style="margin:4px 0">${esc(PERSONA_TXT[f.bff ? 'friendly' : f.persona] || '')}</p>` : ''}${rel ? `<p class="dim" style="margin:2px 0">${rel}</p>` : ''}
        <p class="dim" style="margin:4px 0 0">Health ${Math.round(t.hp)} / ${t.maxHp} · Power ${Math.round(t.power)} · Armor ${Math.round(t.armor)}</p></div>`));
      if (f && !t.inParty && !t.dead) { const a = el(`<div class="acts"><button class="pri">Invite to group</button><button>${f.friend ? 'Unfriend' : 'Add friend'}</button></div>`); a.children[0].onclick = () => { Game.invite(t); closeSheet(); }; a.children[1].onclick = () => { Game.befriend(t); refreshSheet(); }; body.appendChild(a); }
      return;
    }
    if (t.team === 'npc' && !t.prop && !t.corpse) {
      const T = t.giver ? TALK[t.giver] : t.banker ? TALK.banker : null;
      const bio = T?.bio || (t.storyNpc ? (Array.isArray(VILLAGER_LINES[t.name]) ? 'One of the villagers of Little Hollin, getting on with life as best they can.' : VILLAGER_LINES[t.name] ? 'One of Little Hollin\'s residents. Not all of them are still breathing.' : '') : t.guard ? 'A member of the town guard, keeping the gates safe.' : t.vendor ? 'A merchant who sells supplies and buys whatever you bring back.' : '');
      body.appendChild(el(`<div class="card"><h3>${esc(t.name)}</h3>${t.title ? `<p class="dim" style="margin:0 0 4px">${esc(Game.fill(t.title))}</p>` : ''}<p class="lore" style="margin:4px 0">${esc(Game.fill(bio || 'Nothing remarkable, at first glance.'))}</p></div>`));
      const a = el(`<div class="acts"><button class="pri">${t.banker ? 'Open bank' : 'Talk'}</button></div>`); a.firstChild.onclick = () => { closeSheet(); interact(t); }; body.appendChild(a);
    }
  });
}
function openVendor(n) {
  openSheet(n ? n.name : 'Supplies', body => {
    body.appendChild(el(`<p style="margin-top:0">Gold: <b style="color:var(--acc)">${S.gold}</b></p>`));
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
  if (m.lootGold) { S.gold += m.lootGold; chat('loot', null, `You loot ${m.lootGold} gold.`); m.lootGold = 0; }
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
function openMap() {
  openSheet('Map', body => {
    const c = document.createElement('canvas'); c.width = c.height = 600; c.style.width = '100%'; c.style.borderRadius = '10px'; body.appendChild(c);
    const g = c.getContext('2d'), sc = 600 / (2 * WH), P = (x, z) => [(x + WH) * sc, (z + WH) * sc];
    g.drawImage(world.minimap, 0, 0, 600, 600);
    g.font = 'bold 15px Cinzel'; g.textAlign = 'center'; g.fillStyle = '#fff'; g.strokeStyle = '#000'; g.lineWidth = 3;
    const label = (t, x, z) => { const [px, pz] = P(x, z); g.strokeText(t, px, pz); g.fillText(t, px, pz); };
    if (world.zone === 'vale') {
      label(world.names.town, 0, -34); label(world.names.ruin.replace('The ', ''), world.ruin.x, world.ruin.z - 44);
      label(world.names.wood, 0, 160); label(world.names.waste, 0, -150); label(world.names.road, 150, 80); label('Fields (1-3)', -50, 50);
      g.font = '12px Alegreya Sans';
      for (const cp of world.camps) label(cp.kind === 'bandit' ? 'Bandits (3-5)' : 'Orcs (5-7)', cp.x, cp.z);
      label(`${world.names.tusk} (8)`, world.hollow.x, world.hollow.z + 12);
      g.font = 'bold 13px Cinzel';
      for (const p of world.extraPlaces || []) label(p.name, p.x, p.z - p.R - 4);
      g.font = '12px Alegreya Sans';
      label('Pale Choir (4-5)', world.spots.choircamp.x, world.spots.choircamp.z + 14); label('Boars (3-5)', -190, -20); label('Spiders (4-5)', world.spots.spiders.x, world.spots.spiders.z + 22); label('Harpies (6-8)', world.spots.crag.x + 16, world.spots.crag.z + 20); label('Deacon (8-9)', world.spots.deacon.x, world.spots.deacon.z + 14);
    } else {
      for (const p of world.places) label(p.name.replace('The ', ''), p.x, p.z - p.R - 6);
      g.font = '12px Alegreya Sans';
      for (const l of world.mapLabels || []) label(l.t, l.x, l.z);
      for (const d of world.docks || []) label('⚓', d.x, d.z + 5);
      if (Sea.sea.ferry) { const [fx, fz] = P(Sea.sea.ferry.x, Sea.sea.ferry.z); g.fillStyle = '#ffd34d'; g.beginPath(); g.arc(fx, fz, 6, 0, TAU); g.fill(); g.stroke(); }
    }
    g.font = '12px Alegreya Sans';
    for (const z of world.zoneLines) label('➜ ' + z.label.replace(/ \(.*$/, ''), clamp(z.x, -WH + 50, WH - 50), z.z + 10);
    const [hx, hz] = P(S.hero.x, S.hero.z); g.fillStyle = '#fff'; g.beginPath(); g.arc(hx, hz, 6, 0, TAU); g.fill(); g.stroke();
    for (const p of S.party) if (!p.isHero) { const [px, pz] = P(p.x, p.z); g.fillStyle = '#5fd3ff'; g.beginPath(); g.arc(px, pz, 4, 0, TAU); g.fill(); }
    if (S.corpse && (S.corpse.zone || 'vale') === S.zone) { const [px, pz] = P(S.corpse.x, S.corpse.z); g.fillStyle = '#8dffef'; g.font = 'bold 18px sans-serif'; g.fillText('✖', px, pz + 6); }
    body.appendChild(el(`<p class="dim" style="font-size:12px">North is up. ${world.zone === 'vale' ? 'The Ossuary (levels 8-10) is a 6-person open-world dungeon. The Kingsroad runs east to the Saltreach Coast (11-20).' : world.zone === 'coast' ? 'The gold dot is the ferry (Saltmarrow, Fort Halyard, Smuggler\'s Rock, Gullwick). Rent rowboats at any dock ⚓. The Sea Caves (15-17) are open-world; the buoy on the Drowned Reef is the dive to the Sunken Fleet (level 20 instance).' : 'The Sunken Fleet: a 6-person instance. It resets when you leave.'}</p>`));
  });
}
function openMenu() {
  openSheet('Menu', body => {
    const b = el(`<div><div class="card"><h3>Save code</h3><p>Copy this to move your progress to another build or device.</p><div class="acts"><button data-a="copy">Copy save code</button></div><textarea id="codeOut" readonly class="hide"></textarea></div>
      <div class="card"><h3>Load a save code</h3><textarea id="codeIn" placeholder="Paste a code starting OSSU1."></textarea><div class="acts"><button data-a="load">Load</button></div></div>
      <div class="card"><h3>Controls</h3><p>Left thumb: move. Right thumb: turn the camera, pinch to zoom. Tap someone to target them; tap again to talk, loot or attack. 🎯 cycles enemy targets. Hold a spell key to read it. On a keyboard: WASD, Q/E turn, Tab, 1-0 - =, F to interact, X to sit.</p></div>
      <div class="card"><h3>Start over</h3><p>A new world with a new seed. Your current save is replaced.</p><div class="acts"><button data-a="new">New game</button></div></div></div>`);
    b.onclick = async ev => {
      const a = ev.target.dataset.a;
      if (a === 'copy') { const code = await Game.makeCode(); const t = $('codeOut'); t.value = code; t.classList.remove('hide'); try { await navigator.clipboard.writeText(code); toast('Save code copied'); } catch (e) { t.select(); toast('Select and copy the code'); } }
      if (a === 'load') { try { const sv = await Game.readCode($('codeIn').value); Game.loadSave(sv); closeSheet(); afterStart(); toast('Save loaded'); } catch (e) { toast("That code didn't work"); } }
      if (a === 'new') { closeSheet(); showTitle(true); }
    };
    body.appendChild(b);
  });
}

// ---------- title ----------
export function showTitle(forceNew) {
  $('hud').classList.add('hide'); $('title').classList.remove('hide');
  let pick = 'bulwark';
  const has = Game.hasSave() && !forceNew;
  const T = $('titleIn');
  T.innerHTML = `<h1>Single-Player MMO</h1><div class="sub">Build 4.2 · the Vale's story · a century after the summoner wars</div>
    ${has ? '<button class="pri" id="contBtn" style="width:100%;margin-bottom:12px">Continue</button>' : ''}
    <div class="card" style="text-align:left"><h3>New hero</h3><input type="text" id="heroName" maxlength="14" placeholder="Hero name" value="${pickName()}">
    ${FAMILIES.map(f => `<p style="margin:10px 0 4px;font:700 13px Cinzel;color:var(--acc)">${f}s</p><div class="clsPick">${CLASS_KEYS.filter(k => CLASSES[k].family === f).map(k => { const c = CLASSES[k]; return `<div class="card" data-k="${k}" style="border-color:${c.color}"><b style="color:${c.color}">${roleIcon(k)} ${c.name}</b><p>${esc(c.blurb)}</p></div>`; }).join('')}</div>`).join('')}
    <p class="dim" style="font-size:12px;margin:8px 0">🛡️ Fighter · 💚 Healer · 🗡️ Rogue · 🔮 Mage. The last class in each family is its support. Your hero can take up every class later; each levels on its own.</p>
    <button class="pri" id="newBtn" style="width:100%">Enter the world</button></div>
    <div class="card" style="text-align:left"><h3>Load a save code</h3><textarea id="titleCode" placeholder="OSSU1.…" style="height:60px"></textarea><div class="acts"><button id="codeBtn">Load</button></div></div>`;
  const cards = T.querySelectorAll('.clsPick .card');
  const sel = () => cards.forEach(c => c.classList.toggle('on', c.dataset.k === pick)); sel();
  cards.forEach(c => c.onclick = () => { pick = c.dataset.k; sel(); });
  $('newBtn').onclick = () => { const n = ($('heroName').value || 'Hero').trim().slice(0, 14) || 'Hero'; Game.newGame(pick, n); afterStart(); };
  if (has) $('contBtn').onclick = () => { try { Game.loadSave(); afterStart(); } catch (e) { console.error(e); toast('That save could not be loaded'); } };
  $('codeBtn').onclick = async () => { try { const sv = await Game.readCode($('titleCode').value); Game.loadSave(sv); afterStart(); } catch (e) { toast("That code didn't work"); } };
}
function pickName() { return ['Aldric', 'Wren', 'Corvane', 'Isolde', 'Taran', 'Merrow', 'Halcyon', 'Brisa'][(Math.random() * 8) | 0]; }
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
  updateFrames(); refreshKeys(); updateChat(); updatePlates(dt); updateMini(); updateAct();
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
  addEventListener('keydown', e => onKey(e, true)); addEventListener('keyup', e => onKey(e, false));
  addEventListener('resize', () => { lastBarSig = ''; });
  addEventListener('wheel', e => { if (!sheetOpen()) S.camDist = clamp(S.camDist * (1 + Math.sign(e.deltaY) * .1), 3.5, 16); }, { passive: true });
  $('cycle').addEventListener('pointerup', e => { e.stopPropagation(); cycleTarget(); });
  $('sheetX').onclick = closeSheet;
  $('sheet').addEventListener('pointerdown', e => { if (e.target.id === 'sheet') closeSheet(); });
  $('bookBtn').onclick = () => openBook();
  $('menuBtn').onclick = openMenu;
  $('mini').onclick = openMap;
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
