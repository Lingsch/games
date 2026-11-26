// Build 9: the peoples of the world. Humans of the Vale, and three peoples descended from what the summoners made:
// the Varr (beast-folk, bred from the druids' war-beasts), the Grael (stone-born, from the elementalists' golems)
// and the Sallow (the necromancers' thralls, who woke up free when their masters died).
import * as THREE from './three.js';
import { S, pick, chat, X, dist, isNight } from './core.js';
import { CLASSES, CLASS_KEYS } from './data.js';
import * as R from './render.js';
import { build, P, T, Box, Cyl, Sph, Cone, Oct, Dod } from './models.js';
const O = [0, 0, 0], HEAD = [0, 1.46, 0];

export const RACES = {
  human: { name: 'Human', plural: 'Humans', start: 'vale', icon: '🧑', blurb: 'The people of the Vale and the eight kingdoms. Stubborn, curious, and very good at getting back up.',
    bonus: { powP: .03 }, rep: .1, bonusText: '+3% power · +10% reputation',
    ability: { name: "Hearth's Resolve", icon: '🔥', cd: 180, desc: 'Racial. Shake off every slow and root, and heal 20% of your health.' } },
  varr: { name: 'Varr', plural: 'Varr', start: 'weald', icon: '🦌', blurb: 'Horned beast-folk of the grown groves, bred by the druids for war and left behind when the war was over. They remember the leash and do not forgive it.',
    bonus: { crit: .02, dodge: .02 }, bonusText: '+2% critical chance · +2% dodge', skin: '#8a6a4a', scale: 1.04,
    ability: { name: 'Bloodhowl', icon: '🐺', cd: 180, desc: 'Racial. Howl: you gain 20% power for 12 seconds and your group gains 5%.' } },
  grael: { name: 'Grael', plural: 'Grael', start: 'kiln', icon: '🪨', blurb: 'Stone-born, the children of the elementalists\' war golems, with a little fire still in their chests. Slow to anger. Slower to stop.',
    bonus: { armorP: .08, hpP: .04 }, bonusText: '+8% armor · +4% health', skin: '#8a8478', scale: 1.1,
    ability: { name: 'Stoneform', icon: '🗿', cd: 180, desc: 'Racial. Turn to stone for 8 seconds: take 40% less damage and shrug off slows.' } },
  sallow: { name: 'Sallow', plural: 'Sallow', start: 'hush', icon: '🕯️', blurb: 'Once the necromancers\' thralls. When their masters died, they woke up, and they have been trying to remember who they were ever since. Necromancy is outlawed, and so, in most places, are they.',
    bonus: { powP: .03 }, night: { powP: .04 }, bonusText: '+3% power · +4% more at night', skin: '#a8b8bc', scale: .98,
    ability: { name: 'Borrowed Breath', icon: '💨', cd: 180, desc: 'Racial. Draw the breath out of your target: it takes shadow damage and you heal 25% of your health.' } },
};
export const RACE_KEYS = Object.keys(RACES);
export const raceOf = e => !e ? 'human' : e.isHero ? (S.ext?.race || 'human') : e.race || 'human';
X.race = raceOf; X.RACES = RACES;

// ---------- the racial ability, shared by every class ----------
const racialAb = {
  key: 'racial', lvl: 1, kind: 'racial', cost: 0, gcd: false, tgt: 'self', range: 22,
  get name() { return RACES[raceOf(S.hero)].ability.name; }, get icon() { return RACES[raceOf(S.hero)].ability.icon; }, get desc() { return RACES[raceOf(S.hero)].ability.desc; },
  get cd() { return 180; },
  fx: (C, u) => {
    const r = raceOf(u);
    if (r === 'human') { u.buffs = u.buffs.filter(b => !(b.data?.slow || b.data?.root || b.id === 'slow' || b.id === 'root')); C.heal(u, u, u.maxHp * .2); C.fxRing(u, 3, [1, .7, .3]); }
    if (r === 'varr') { C.buff(u, 'bloodhowl', 12, { pow: .2 }, u); for (const p of C.partyOf(u)) if (p !== u && !p.dead && dist(u, p) < 30) C.buff(p, 'bloodhowl2', 12, { pow: .05 }, u); C.fxRing(u, 10, [.9, .3, .2]); }
    if (r === 'grael') { u.buffs = u.buffs.filter(b => !(b.data?.slow)); C.buff(u, 'stoneform', 8, { dr: .4 }, u); C.fxRing(u, 3, [.7, .65, .6]); }
    if (r === 'sallow') { const t = u.target && !u.target.dead && u.target.team !== u.team ? u.target : C.enemiesNear(u, u, 22)[0]; if (t) C.damage(u, t, C.pw(u) * 1.2 + 8, 'shadow'); C.heal(u, u, u.maxHp * .25); C.fxRing(u, 4, [.6, .8, .9]); }
  },
};
for (const k of CLASS_KEYS) CLASSES[k].abilities.racial = racialAb;
// put it on your bar if there's an empty slot
X.zone.push(() => { const bar = S.bar?.[S.heroCls]; if (bar && !bar.includes('racial')) { const i = bar.findIndex(k => !k); if (i >= 0) bar[i] = 'racial'; } });

// ---------- racial bonuses, folded in with the account bonuses (talents add theirs in talent9.js) ----------
const night = () => isNight();
export function raceBonus(e) {
  if (!e?.isHero) return null;
  const R0 = RACES[raceOf(e)]; const b = { ...R0.bonus };
  if (R0.night && night()) for (const [k, v] of Object.entries(R0.night)) b[k] = (b[k] || 0) + v;
  return b;
}

const NOA = {};
X.acctOf = e => { const a = e.acct || NOA, r = raceBonus(e), t = X.talentBonus ? X.talentBonus(e) : null; if (!r && !t) return a; const o = { ...a }; for (const b of [r, t]) if (b) for (const [k, v] of Object.entries(b)) o[k] = (o[k] || 0) + v; return o; };
X.repMul = () => raceOf(S.hero) === 'human' ? RACES.human.rep : 0;
// ---------- how they look: every class model, rebuilt for each people on first sight ----------
const SKINS = ['#e0b08a', '#c68e62', '#8d5a3b', '#f0c9a6'].map(c => new THREE.Color(c));
const EXTRA = {
  varr: () => [P(T(Cone(.06, .42, 5), -.13, 1.94, -.02, -.5, 0, .5), 5, HEAD, '#e8dcc4'), P(T(Cone(.06, .42, 5), .13, 1.94, -.02, -.5, 0, -.5), 5, HEAD, '#e8dcc4'),
    P(T(Cone(.05, .16, 4), -.19, 1.72, 0, 0, 0, 1.1), 5, HEAD, '#7a5a3a'), P(T(Cone(.05, .16, 4), .19, 1.72, 0, 0, 0, -1.1), 5, HEAD, '#7a5a3a'),
    P(T(Cone(.07, .7, 5), 0, .78, -.3, -2.3), 0, O, '#6a4a32'), P(T(Sph(.07, 5, 4), 0, 1.62, .17), 5, HEAD, '#2a1a10')],
  grael: () => [P(T(Dod(.13), -.3, 1.52, -.05), 0, O, '#6a6058'), P(T(Dod(.13), .3, 1.52, -.05), 0, O, '#6a6058'), P(T(Oct(.07), 0, 1.92, .02, 0, 0, 0, 1, 1.6, 1), 5, HEAD, '#ff8a3a', 1.6),
    P(T(Box(.16, .1, .05), 0, 1.15, .2), 0, O, '#ff7a2a', 1.4), P(T(Dod(.1), 0, 1.86, -.06), 5, HEAD, '#7a7068')],
  sallow: () => [P(T(Sph(.028, 5, 4), -.055, 1.66, .17), 5, HEAD, '#9affff', 2.4), P(T(Sph(.028, 5, 4), .055, 1.66, .17), 5, HEAD, '#9affff', 2.4),
    P(T(Oct(.05), 0, 1.2, .21), 0, O, '#9affff', 1.4), P(T(Box(.42, .03, .03), 0, 1.4, .2), 0, O, '#5a6a70')],
};
function raceGeo(base, race) {
  const RC = RACES[race], skin = new THREE.Color(RC.skin), extra = build(EXTRA[race]());
  const parts = [base, extra], names = ['position', 'normal', 'color', 'pivot', 'part', 'glow'], g = new THREE.BufferGeometry();
  for (const n of names) { const size = base.attributes[n].itemSize, arr = new Float32Array(parts.reduce((a, p) => a + p.attributes[n].count * size, 0)); let o = 0; for (const p of parts) { arr.set(p.attributes[n].array.subarray(0, p.attributes[n].count * size), o); o += p.attributes[n].count * size; } g.setAttribute(n, new THREE.BufferAttribute(arr, size)); }
  // skin
  const col = g.attributes.color, nb = base.attributes.position.count;
  for (let i = 0; i < nb; i++) { const r = col.getX(i), gg = col.getY(i), b = col.getZ(i);
    for (const s of SKINS) { const k = r / s.r; if (k > .9 && k < 1.06 && Math.abs(gg / s.g - k) < .02 && Math.abs(b / s.b - k) < .02) { col.setXYZ(i, skin.r * k, skin.g * k, skin.b * k); break; } } }
  // build: the Grael are broad, the Sallow thin
  const pos = g.attributes.position, piv = g.attributes.pivot, sx = race === 'grael' ? 1.1 : race === 'sallow' ? .93 : 1, sy = RC.scale || 1;
  for (let i = 0; i < pos.count; i++) { pos.setXYZ(i, pos.getX(i) * sx, pos.getY(i) * sy, pos.getZ(i) * sx); piv.setXYZ(i, piv.getX(i) * sx, piv.getY(i) * sy, piv.getZ(i) * sx); }
  g.computeBoundingSphere(); return g;
}
const ROBE = new Set(['cleric', 'elem', 'warlock', 'binder', 'illusionist', 'lifebinder', 'druid']);
X.lazyKind = kk => {
  if (!kk) return null;
  const i = kk.lastIndexOf('_'); if (i < 0) return null;
  const base = kk.slice(0, i), race = kk.slice(i + 1); if (!EXTRA[race] || !R.kinds[base]) return null;
  const robe = [...ROBE].some(c => base.startsWith(c));
  R.addKinds({ [kk]: [raceGeo(R.kinds[base].mesh.geometry, race), robe ? [.4, .35, 1.4, .1] : [.6, .4, 1.6, .15], robe ? .03 : .05, .03] });
  return R.kinds[kk];
};
const withRace = (kind, race) => { const base = kind.replace(/_(varr|grael|sallow)$/, ''); return race && race !== 'human' ? base + '_' + race : base; };
// keep everyone's model in step with their people (the hero, friends, and the fake players, who are a mix)
let rT = 0;
X.tick.push(dt => {
  if ((rT -= dt) > 0) return; rT = .5;
  for (const e of S.ents) {
    if (!e.cls || e.mob || !e.kind || e.dead && !e.isHero) continue;
    if (!e.isHero && !e.race) { const fr = (S.friends || []).find(f => f.name === e.name); if (fr && !fr.race) fr.race = pick(['human', 'human', 'varr', 'grael', 'sallow']); e.race = fr ? fr.race : Math.random() < .55 ? 'human' : pick(['varr', 'grael', 'sallow']); }
    const base = e.kind.replace(/_(varr|grael|sallow)$/, ''); if (!CLASSES[e.cls]?.models.includes(base)) continue;
    const want = withRace(base, raceOf(e)); if (e.kind !== want) e.kind = want;
  }
});

// ---------- starting out ----------
X.startZone = () => RACES[S.pendingRace || S.ext?.race || 'human']?.start || 'vale';
X.startScene = () => { const r = S.ext?.race || 'human'; return r === 'human' ? 'intro' : 'intro_' + r; };
// where you wake up and bind on your first visit to your people's home
X.zone.push(zone => {
  const r = S.ext?.race; if (!r || r === 'human' || RACES[r].start !== zone || S.bind) return;
  const t = (zoneTown => zoneTown)(S.ents.find(e => e.bindstone)); if (t) S.bind = { zone, x: t.x, z: t.z + 1.5 };
});
// the character screen: choose your people before your weapon
X.racePicker = (pick0) => `<div class="card" style="text-align:left"><h3>Choose your people</h3><div class="wpick">${RACE_KEYS.map(k => { const r = RACES[k]; return `<div class="card rpick ${pick0 === k ? 'on' : ''}" data-r="${k}"><span class="wi">${r.icon}</span><div><b>${r.name}</b><small>${r.bonusText}</small><p>${r.blurb}</p><p style="font-size:12px;color:#d8c890">${r.ability.icon} ${r.ability.name}: ${r.ability.desc.replace('Racial. ', '')}</p></div></div>`; }).join('')}</div></div>`;
