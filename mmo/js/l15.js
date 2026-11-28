// Build 15: the road to the moon (levels 41-45). The Great Lamp is lit, and the curtain is whole, and the moon is
// coming closer. Ten thousand years ago the Starwrights borrowed a young star-eater from the things that made it, and
// put it to sleep inside Hulrouhn's moon, and hung the curtain round the sky so nothing would hear it breathe. Vhorun
// fed it: every light he ate rose up to the moon. Vesper went up the beam to finish the job and wake it.
// Five lands: the Cracked Vale, the Hatchery, the Moonfall Road, the Shell, and the Waking Heart, on the moon itself.
import * as THREE from './three.js';
import { S, X, chat, floatText } from './core.js';
import { CLASSES, CLASS_KEYS, xpNeed } from './data.js';
import { world } from './world.js';
import { LFG_D } from './social6.js';
import { faction, mount } from './hi9.js';
import * as Loot5 from './loot5.js';
import * as Rep from './rep6.js';
import * as Cb from './combat.js';
import * as R from './render.js';
import { ZSPEC } from './kit9.js';
import { INSTANCES } from './dungeons.js';
import './models15.js';

export const L15 = ['cv15', 'ht15', 'mr15', 'sh15', 'wh15'];
export const LAND_LVL15 = { cv15: 40, ht15: 41, mr15: 42, sh15: 43, wh15: 44 };
X.L15_INST = new Set();
export const qx45 = (lvl, f) => Math.round(xpNeed(Math.min(lvl, 44)) * f * .2), qg45 = lvl => Math.round(16 + lvl * 8);
X.xpMul.push(() => L15.includes(S.zone) || X.L15_INST.has(S.zone) ? .5 : 1);
X.fakeLvlHooks = X.fakeLvlHooks || [];
X.fakeLvlHooks.push(zone => L15.includes(zone) ? Math.max(40, Math.min(45, Math.round(40 + Math.random() ** 1.1 * 5))) : null);
X.gate = X.gate || {};
for (const z of L15) X.gate[z] = () => (S.hero?.lvl || 0) < LAND_LVL15[z] ? `This land is for level ${LAND_LVL15[z]} and beyond.` : null;
const FAMS = ['Fighter', 'Healer', 'Rogue', 'Mage'];
const famsAt = n => FAMS.filter(f => !CLASS_KEYS.some(k => CLASSES[k].family === f && (S.classes[k]?.lvl || 0) >= n));
export const raidWhy45 = need => () => { if ((S.hero?.lvl || 0) < need) return `This raid is for level ${need} and above.`; const m = famsAt(40); return m.length ? `You need a ${m.join(', a ')} at level 40 first.` : null; };
export function addRaid45(key, name, size, need) {
  X.RAIDS.add(key); X.L15_INST.add(key); if (size === 24) X.RAID24.add(key); const why = raidWhy45(need); X.gate[key] = why;
  LFG_D[key] = { name: `${name} (${size}-person raid)`, lvl: [need, 45], zone: key, raid: why, raid24: size === 24 };
}
export function addDungeon45(key, name, lvl) { X.L15_INST.add(key); LFG_D[key] = { name, lvl, zone: key }; }
export function finish45(list) {
  for (const q of list) {
    if (q.xp == null) q.xp = qx45(q.lvl, q.daily ? .3 : q.story ? (q.obj.named ? .75 : .5) : q.obj.named ? .65 : .42);
    if (q.gold == null) q.gold = qg45(q.lvl);
    if (!('text' in q)) Object.defineProperty(q, 'text', { configurable: true, get() { const s = this.say[0]; return typeof s === 'string' ? s : s[1]; } });
  }
  return list;
}
export const st15 = () => (S.ext.l15 = S.ext.l15 || {});
export const MW = r => ({ moon15: r });

// ---------- the Moonwatch: Halden's astronomers, and anyone who keeps an eye on the sky ----------
X.VEND = Object.assign(X.VEND || {}, { moonwatch: ['Star-Clerk Imogen', 'villager2'] });
faction('moon15', 'The Moonwatch', '🌙', 'moonwatch', [
  [1, 220, 'Moonwatcher\'s Band', Rep.ring('Moonwatcher\'s Band', 42, 2)], [2, 550, 'Silver Strider (mount)', 'mount_moon15'],
  [3, 550, 'Pendant of the Pale Tide', Rep.ring('Pendant of the Pale Tide', 45, 3, 'neck')], [4, 0, 'Title: Who Sang the Moon to Sleep', 'title_moon15']], []);
mount('mount_moon15', 'Silver Strider', 'horse_moon15', '#d8dce8', '#b07aff', '#4a4458', true);
Loot5.COLLECT.title_moon15 = { type: 'title', name: 'Who Sang the Moon to Sleep', from: 'rep' };

// ---------- the moon in the sky: bigger in every land, and on the moon, Hulrouhn instead ----------
const MOON_SIZE = { gl14: 0, cv15: 110, ht15: 150, mr15: 200, sh15: 270, wh15: 210 };
let moon = null, moonFor = null;
const INST_PARENT = z => INSTANCES[z]?.parent || (z?.startsWith('x_') ? INSTANCES[z.slice(2)]?.parent : null);
const landOf = z => MOON_SIZE[z] != null ? z : MOON_SIZE[INST_PARENT(z)] != null && !INSTANCES[z] ? INST_PARENT(z) : null;
function makeOrb(home) {
  const g = new THREE.SphereGeometry(1, 64, 44), p = g.attributes.position, col = [], c = new THREE.Color();
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i), n = Math.sin(x * 7.1 + y * 3.3) * Math.cos(z * 5.7 - x * 2.1) + Math.sin(y * 11 + z * 4) * .4;
    if (home) { const land = Math.min(1, Math.max(0, (n - .05) * 4)); c.set('#24508a').lerp(new THREE.Color('#3a6a3a'), land).lerp(new THREE.Color('#ffffff'), Math.max(0, Math.abs(y) - .78) * 4 + (Math.sin(x * 23 + z * 17) > .7 ? .25 : 0)); }
    else c.set('#d8dce8').multiplyScalar(n > .3 ? .5 : n > 0 ? .75 : .95);
    col.push(c.r, c.g, c.b);
  }
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ vertexColors: true, fog: false, depthWrite: false }));
  m.renderOrder = 1; m.frustumCulled = false; return m;
}
X.zone.push(z => {
  const L = landOf(z), size = L ? MOON_SIZE[L] : 0, home = L === 'wh15';
  if (moon && (!size || moonFor !== home)) { R.scene.remove(moon); moon = null; }
  if (!size) return;
  if (!moon) { moon = makeOrb(home); moonFor = home; R.scene.add(moon); }
  moon.scale.setScalar(size);
  world.lowGrav = L === 'wh15';
});
const DIR = new THREE.Vector3(.3, .13, -.95).normalize();
// on the moon the sky is black
X.lightLate = X.lightLate || [];
X.lightLate.push(() => { if (!world.lowGrav || world.cave) return; const u = R.skyMat.uniforms; u.top.value.set('#000002'); u.mid.value.set('#03030a'); u.hor.value.set('#0c0c1e'); R.scene.fog.color.set('#0a0a16'); });
X.light.push(() => { if (!moon) return; moon.position.copy(R.cam.position).addScaledVector(DIR, 900); moon.rotation.y = S.time * .0004; });

// ---------- quakes: the moon's pull cracks the ground in the Vale and the Shell ----------
const QUAKE = { cv15: [50, 80], sh15: [35, 60] };
let quakeT = 30;
X.tick.push(dt => {
  const L = landOf(S.zone), q = QUAKE[L]; if (!q || !S.hero || S.scene) return;
  if ((quakeT -= dt) > 0) return; quakeT = q[0] + Math.random() * (q[1] - q[0]);
  S.shake = .9; chat('sys', null, L === 'sh15' ? 'The Shell heaves, like something breathing in its sleep.' : 'The ground heaves. Overhead, the moon is very large.');
  for (const p of S.party) if (!p.dead) { Cb.buff(p, 'quake15', 2, { slow: .35 }, p); floatText(p, 'Quake', '#c8c0ff'); }
});
// ---------- the moon itself: low gravity, a little faster on your feet ----------
let gravT = 0;
X.tick.push(dt => { if (!world.lowGrav || (gravT -= dt) > 0) return; gravT = .5; for (const p of S.party) if (!p.dead) Cb.buff(p, 'lowgrav15', 1, { spd: .12 }, p); });

// ---------- the way on: west out of the Great Lamp's land ----------
if (ZSPEC.gl14) ZSPEC.gl14.lines.push({ x: -488, z: 200, to: 'cv15', label: 'West, to the Vale, where the ground is cracking', ry: -Math.PI / 2,
  why: () => (S.hero?.lvl || 0) < 40 ? 'The Cracked Vale is for level 40 and beyond.' : S.quests.zv1?.state !== 'turned' && S.quests.zv1?.state !== 'done' ? 'The road west is quiet. Halden wants a word first.' : null });
X.arriveHooks.push((zone, from) => zone === 'gl14' && from === 'cv15' ? { x: -460, z: 200 } : null);

// ---------- things you use and that stay used: smashed eggs in the Hatchery, broken mirrors on the Moonfall Road ----------
// USE[use] = { label, tag, done kind, done tag, lines }. Using one counts toward any active quest that inspects its tag.
import { QUESTS, GIVERS } from './data.js';
import { pick } from './core.js';
import { hgt } from './world.js';
export const USE15 = {
  egg15: { label: 'Smash the egg', tag: 'egg', kind: 'eggcracked15', after: 'eggsmashed', lines: ['The shell cracks. Inside, something small and silver stops moving.', 'You bring your boot down. The egg goes dark.', 'Smashed. The yolk is silver, and it hums, and then it doesn\'t.'] },
  mirror15: { label: 'Break the mirror', tag: 'mirror', kind: 'mirrordark15', after: 'mirrorbroken', lines: ['The mirror shatters. Its beam gutters, and goes out.', 'You break the glass. Far above, one thread of light stops reaching the moon.', 'The mirror cracks across. The tower goes dark, and quiet.'] },
};
const used = () => (st15().used = st15().used || {});
const pl15 = X.propLabel, pu15 = X.propUse;
X.propLabel = e => { const u = USE15[e.prop.use]; if (!u) return pl15 ? pl15(e) : null; return used()[e.prop.id] || e.hatched ? null : u.label; };
X.propUse = e => {
  const u = USE15[e.prop.use]; if (!u) return pu15?.(e);
  if (used()[e.prop.id] || e.hatched) return;
  used()[e.prop.id] = 1; e.kind = u.kind; e.prop.tag = u.after;
  R.burst(e.x, (e.y || 0) + 1.5, e.z, 30, [.8, .7, 1], 2.5, 1, .5);
  chat('sys', null, pick(u.lines));
  for (const q of QUESTS) {
    if (q.obj.inspect !== u.tag || S.quests[q.id]?.state !== 'active') continue;
    const st = S.quests[q.id]; (S.used[q.id] = S.used[q.id] || []).push(e.prop.id); st.n = Math.min(q.obj.n, st.n + 1); floatText(S.hero, `${q.name} ${st.n}/${q.obj.n}`, '#ffd34d');
    if (st.n >= q.obj.n) { st.state = 'done'; chat('sys', null, `${q.name}: done! Return to ${GIVERS[q.turnTo || q.giver].name}.`); }
  }
};
X.zone.push(() => { for (const e of S.ents) { const u = e.prop && USE15[e.prop.use]; if (u && used()[e.prop.id]) { e.kind = u.kind; e.prop.tag = u.after; } } });
// eggs you walk too close to hatch (once a visit): smash them first, or fight what comes out
let eggT = 0;
X.tick.push(dt => {
  if ((eggT -= dt) > 0 || !S.hero || S.scene) return; eggT = .5;
  const h = S.hero;
  for (const e of S.ents) {
    if (e.prop?.use !== 'egg15' || e.hatched || used()[e.prop.id] || Math.hypot(e.x - h.x, e.z - h.z) > 6) continue;
    e.hatched = true; e.kind = 'eggcracked15'; e.prop.tag = 'egghatched';
    const lvl = Math.max(41, Math.min(45, (h.lvl || 42)));
    for (let k = 0; k < 2; k++) { const g = Cb.makeMob('hatchling', lvl, { x: e.x + (Math.random() - .5) * 4, z: e.z + (Math.random() - .5) * 4, home: { x: e.x, z: e.z }, add: true }); g.y = hgt(g.x, g.z); Cb.addThreat(g, h, 5); }
    chat('sys', null, 'An egg splits as you pass. Two hatchlings come out of it, already hungry.');
  }
});
