// Build 14: the Lamplighters' road (levels 36-40). Vhorun "died" at the Throat of the World and the Starwrights carried
// his hunger away in a lantern. Not all of it went. What was left (the Remnant) feeds on light; a cult, the Dusk Covenant,
// wants the makers back and lights the way for them; and the light it sends up is seen by something else, which falls.
// You found the Lamplighters to relight the lamps of Hulrouhn. Five lands: the Lampless Reach (pitch black), the Dusk
// Hollows (under the sea), Starfall (the wreck of a star-eater scout), the Makers' Forge (where Vhorun was made) and
// the Great Lamp. One raid in each. This file holds the shared rules and the systems the lands need.
import * as THREE from './three.js';
import { S, X, chat, pick, rnd, dist, floatText, clamp } from './core.js';
import { QUESTS, MOBS, CLASSES, CLASS_KEYS, xpNeed, GIVERS } from './data.js';
import { TALK } from './dialogue.js';
import { world, hgt } from './world.js';
import { LFG_D } from './social6.js';
import { faction, mount } from './hi9.js';
import * as Loot5 from './loot5.js';
import * as Rep from './rep6.js';
import * as Cb from './combat.js';
import * as R from './render.js';
import { ZSPEC } from './kit9.js';
import { INSTANCES } from './dungeons.js';
import './models14.js';

// ---------- levels and gates ----------
export const L14 = ['lr14', 'dh14', 'sf14', 'mf14', 'gl14'];
export const LAND_LVL14 = { lr14: 35, dh14: 37, sf14: 38, mf14: 39, gl14: 40 };
X.L14_INST = new Set();
export const qx40 = (lvl, f) => Math.round(xpNeed(Math.min(lvl, 39)) * f * .22), qg40 = lvl => Math.round(14 + lvl * 7);
X.xpMul.push(() => L14.includes(S.zone) || X.L14_INST.has(S.zone) ? .55 : 1);
X.fakeLvlHooks = X.fakeLvlHooks || [];
X.fakeLvlHooks.push(zone => L14.includes(zone) ? Math.max(35, Math.min(40, Math.round(35 + Math.random() ** 1.1 * 5))) : null);
X.gate = X.gate || {};
for (const z of L14) X.gate[z] = () => (S.hero?.lvl || 0) < LAND_LVL14[z] ? `This land is for level ${LAND_LVL14[z]} and beyond.` : null;
const FAMS = ['Fighter', 'Healer', 'Rogue', 'Mage'];
const famsAt = n => FAMS.filter(f => !CLASS_KEYS.some(k => CLASSES[k].family === f && (S.classes[k]?.lvl || 0) >= n));
export const raidWhy40 = need => () => { if ((S.hero?.lvl || 0) < need) return `This raid is for level ${need} and above.`; const m = famsAt(35); return m.length ? `You need a ${m.join(', a ')} at level 35 first.` : null; };
export function addRaid40(key, name, size, need) {
  X.RAIDS.add(key); X.L14_INST.add(key); if (size === 24) X.RAID24.add(key); const why = raidWhy40(need); X.gate[key] = why;
  LFG_D[key] = { name: `${name} (${size}-person raid)`, lvl: [need, 40], zone: key, raid: why, raid24: size === 24 };
}
export function addDungeon40(key, name, lvl) { X.L14_INST.add(key); LFG_D[key] = { name, lvl, zone: key }; }
// quest rewards, and the text the quest log shows
export function finish40(list) {
  for (const q of list) {
    if (q.xp == null) q.xp = qx40(q.lvl, q.daily ? .3 : q.story ? (q.obj.named ? .75 : .5) : q.obj.named ? .65 : .42);
    if (q.gold == null) q.gold = qg40(q.lvl);
    if (!('text' in q)) Object.defineProperty(q, 'text', { configurable: true, get() { const s = this.say[0]; return typeof s === 'string' ? s : s[1]; } });
  }
  return list;
}
// a compact way to write the many smaller quests: Q(id, giver, lvl, name, where, obj, say, done, extra)
export const Q = (id, giver, lvl, name, where, obj, say, done, extra = {}) => ({ id, giver, lvl, name, where, obj, say: [].concat(say), done: [].concat(done), ...extra });
// objective shorthands, for the hundreds of smaller quests
export const K = (mobs, n, what, near, nearR = 140) => ({ kill: mobs, n, what, ...(near ? { near, nearR } : {}) });
export const C = (mobs, item, n, what, chance = .5) => ({ collect: mobs, item, chance, n, what });
export const N = (named, what) => ({ named, n: 1, what });
export const A = (at, what) => ({ at, what });
export const I = (inspect, n, what) => ({ inspect, n, what });
export const TK = what => ({ talk: true, what });
// side(zone, rep, pre, rows): each row is [id, giver, lvl, name, where, obj, say, done, extra]
export function side(zone, rep, pre, rows) {
  return rows.map(([id, giver, lvl, name, where, obj, say, done, ex = {}]) => ({ id, giver, lvl, pre, name, where, zone, obj, say: [].concat(say), done: [].concat(done), ...ex, rep: rep(ex.rep || (obj.named ? 350 : 250)) }));
}
// things to inspect, scattered around a spot when the land is built: [tag, name, kind, x, z, n, spread, lore]
export function props14(rows, rng) {
  for (const [tag, name, kind, cx, cz, n, sp = 40, lore] of rows) for (let i = 0; i < n; i++) {
    const a = i / n * Math.PI * 2 + rng() * .8, r = sp * (.35 + rng() * .65);
    world.props.push({ id: `p14${tag}${i}`, kind, tag, name, x: cx + Math.cos(a) * r, z: cz + Math.sin(a) * r, yaw: rng() * 6.28, scale: 1, ...(lore && i === 0 ? { lore } : {}) });
  }
}
X.inspectSay = X.inspectSay || {};
export const st14 = () => (S.ext.l14 = S.ext.l14 || { shrines: {}, order: false });

// ---------- the Lamplighters: the order you found ----------
X.VEND = Object.assign(X.VEND || {}, { firstlamp: ['Wick-Mother Hesk', 'villager3'] });
faction('lamp14', 'The Lamplighters', '🏮', 'firstlamp', [
  [1, 200, 'Lamplighter\'s Band', Rep.ring('Lamplighter\'s Band', 37, 2)], [2, 500, 'Wickstrider (mount)', 'mount_lamp14'],
  [3, 500, 'Torc of the Kept Flame', Rep.ring('Torc of the Kept Flame', 40, 3, 'neck')], [4, 0, 'Title: Founder of the Lamplighters', 'title_lamp14']], []);
mount('mount_lamp14', 'Wickstrider', 'horse_lamp14', '#2a2430', '#ffd27a', '#5a4a3a', true);
Loot5.COLLECT.title_lamp14 = { type: 'title', name: 'Founder of the Lamplighters', from: 'rep' };
export const LL = r => ({ lamp14: r });

// ---------- the dark: the Lampless Reach has no light but yours ----------
export const DARK = new Set(['lr14']);
X.darkZones14 = DARK;
let lamp = null, shrineLights = [];
function lightsFor(zone) {
  const dark = DARK.has(zone);
  if (dark && !lamp) {
    lamp = new THREE.PointLight('#ffd49a', 70, 30, 1.4); R.scene.add(lamp);
    for (let i = 0; i < 4; i++) { const l = new THREE.PointLight('#ffd27a', 0, 36, 1.4); R.scene.add(l); shrineLights.push(l); }
  } else if (!dark && lamp) { R.scene.remove(lamp); for (const l of shrineLights) R.scene.remove(l); lamp = null; shrineLights = []; }
}
const INST_PARENT = z => INSTANCES[z]?.parent || (z?.startsWith('x_') ? INSTANCES[z.slice(2)]?.parent : null);
const inDark = () => DARK.has(S.zone) || DARK.has(INST_PARENT(S.zone));
X.zone.push(z => lightsFor(inDark() ? 'lr14' : z));
X.lightLate = X.lightLate || [];
X.lightLate.push(() => {
  if (!inDark()) return;
  R.sun.intensity = .04; R.hemi.intensity = .07; R.fillL.intensity = .03;
  const f = R.scene.fog; f.color.set('#020204'); f.near = 16; f.far = 66;
  for (const u of ['top', 'mid', 'hor']) R.skyMat.uniforms[u].value.set('#010103');
});
// the hero's lamp, and the four nearest lit wayshrines
X.tick.push(dt => {
  if (!lamp || !S.hero) return;
  const h = S.hero, flick = 1 + Math.sin(S.time * 13) * .04 + Math.sin(S.time * 5.3) * .05;
  lamp.position.set(h.x + Math.sin(h.yaw || 0) * 1.2, (h.y || 0) + 5.5, h.z + Math.cos(h.yaw || 0) * 1.2); lamp.intensity = 70 * flick * (h.dead ? .3 : 1);
  const lit = (world.props || []).filter(p => p.use === 'shrine14' && st14().shrines[p.id]).sort((a, b) => Math.hypot(a.x - h.x, a.z - h.z) - Math.hypot(b.x - h.x, b.z - h.z));
  shrineLights.forEach((l, i) => { const p = lit[i]; if (p) { l.position.set(p.x, hgt(p.x, p.z) + 3.4, p.z); l.intensity = 90 * (1 + Math.sin(S.time * 3 + i) * .05); } else l.intensity = 0; });
});
// ...and the trouble with light in the dark: anything that stands in a lit shrine's glow feeds on it
let glutT = 0;
X.tick.push(dt => {
  if ((glutT -= dt) > 0 || S.zone !== 'lr14') return; glutT = 1;
  const lit = (world.props || []).filter(p => p.use === 'shrine14' && st14().shrines[p.id]);
  for (const m of S.ents) if (m.mob && !m.dead && lit.some(p => Math.hypot(p.x - m.x, p.z - m.z) < 18)) {
    if (!m.buffs.some(b => b.id === 'glutted')) floatText(m, 'Glutted on light', '#ffb05a');
    Cb.buff(m, 'glutted', 2.5, { pow: .15, regen: .01 }, m);
  }
});
// the wayshrines themselves: light one and it stays lit
const pl = X.propLabel, pu = X.propUse;
X.propLabel = e => e.prop.use === 'shrine14' ? (st14().shrines[e.prop.id] ? null : 'Light the wayshrine') : pl ? pl(e) : null;
X.propUse = e => {
  if (e.prop.use !== 'shrine14') return pu?.(e);
  const s = st14(); if (s.shrines[e.prop.id]) return;
  s.shrines[e.prop.id] = 1; e.kind = 'wayshrinelit14'; e.prop.tag = 'wayshrinelit';
  R.burst(e.x, e.y + 3, e.z, 40, [1, .85, .5], 3, 1.2, .6);
  chat('sys', null, pick(['The wick takes. For the first time in weeks, there is a circle of light here.', 'The wayshrine catches. The dark pulls back a few yards, sulking.', 'It lights. Somewhere out in the dark, something turns its head.']));
  for (const q of QUESTS) {
    if (q.obj.inspect !== 'wayshrine' || S.quests[q.id]?.state !== 'active') continue;
    const st = S.quests[q.id]; (S.used[q.id] = S.used[q.id] || []).push(e.prop.id); st.n = Math.min(q.obj.n, st.n + 1); floatText(S.hero, `${q.name} ${st.n}/${q.obj.n}`, '#ffd34d');
    if (st.n >= q.obj.n) { st.state = 'done'; chat('sys', null, `${q.name}: done! Return to ${GIVERS[q.turnTo || q.giver].name}.`); }
  }
};
X.zone.push(z => { if (z !== 'lr14') return; for (const e of S.ents) if (e.prop?.use === 'shrine14' && st14().shrines[e.prop.id]) { e.kind = 'wayshrinelit14'; e.prop.tag = 'wayshrinelit'; } });

// ---------- under the Dusk Sea: everyone swims ----------
export const UNDER = new Set(['dh14']);
const inSea = () => UNDER.has(S.zone) || UNDER.has(INST_PARENT(S.zone));
X.zone.push(() => { world.swimBob = inSea(); if (inSea()) world.underwater = true; });
X.lightLate.push(() => { if (inSea() && !world.cave) { R.scene.fog.color.set('#0e2c46'); R.scene.fog.far = 95; R.sun.intensity *= .8; R.skyMat.uniforms.top.value.set('#020a14'); R.skyMat.uniforms.mid.value.set('#08223a'); R.skyMat.uniforms.hor.value.set('#0e2c46'); } });
let swimT = 0;
X.tick.push(dt => {
  if (!inSea() || (swimT -= dt) > 0) return; swimT = .5;
  for (const p of S.party) if (!p.dead) Cb.buff(p, 'swimming14', 1, { slow: .12 }, p);
});

// ---------- the way in: east out of the Throat of the World, once the Starwrights have been ----------
if (ZSPEC.xt13) ZSPEC.xt13.lines.push({ x: 488, z: 0, to: 'lr14', label: 'East, where the dark never lifted: the Lampless Reach', ry: Math.PI / 2,
  why: () => (S.hero?.lvl || 0) < 35 ? 'The Lampless Reach is for level 35 and beyond.' : S.quests.zl1?.state !== 'turned' && S.quests.zl1?.state !== 'done' ? 'There is nothing that way. Nobody comes back to say otherwise.' : null });
X.arriveHooks.push((zone, from) => zone === 'xt13' && from === 'lr14' ? { x: 460, z: 0 } : null);
