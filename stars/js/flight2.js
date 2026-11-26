// Stars Beneath, Build 2: flight. You take the helm and fly the Second Chance on a flat plane of space around each
// system: arcade dogfights (steer to aim, hold to fire, fly to dodge), wrecks to salvage, a ring to land or dock at,
// and a jump buoy. Jumps can be broken by pirates, distress calls, derelicts and patrols.
import * as THREE from './three.js';
import { S, X, chat, TAU, clamp, rnd, pick, wrapA } from './core.js';
import * as R from './render.js';
import { build, P, T, Box, Cyl, Sph, Oct, Dod, Cone } from './models.js';
import { shipGeo, D1 } from './moon1.js';
import * as Ship from './ship1.js';
import * as Game from './game.js';
import * as UI from './ui.js';
import * as Cb from './combat.js';
import { world } from './world.js';
import { CLASSES, RARITY, mobXp } from './data.js';
const O = [0, 0, 0], LR = [1, -1];

// ---------- ship parts: guns, shields and engines, found in space ----------
export const SLOT = { gun: ['Guns', '🔫'], shield: ['Shields', '🛡️'], engine: ['Engines', '🚀'] };
const PART_NAMES = { gun: ['Pulse Guns', 'Twin Lances', 'Scatter Cannons', 'Rail Repeaters'], shield: ['Deflector', 'Bulwark Screen', 'Phase Shield', 'Aegis Lattice'], engine: ['Ion Drive', 'Burner Array', 'Slipstream Drive', 'Comet Engines'] };
const BASE_FIT = () => ({ gun: { slot: 'gun', name: 'Worn Pulse Guns', mk: 1, q: 0, m: 1 }, shield: { slot: 'shield', name: 'Patched Deflector', mk: 1, q: 0, m: 1 }, engine: { slot: 'engine', name: 'Tired Ion Drive', mk: 1, q: 0, m: 1 } });
export const fit = () => { S.ext.fit = S.ext.fit || BASE_FIT(); S.ext.parts = S.ext.parts || []; return S.ext.fit; };
export function makePart(tier = 1, boost = 0) {
  const slot = pick(['gun', 'shield', 'engine']), mk = clamp(tier + (Math.random() < .25 ? 1 : 0), 1, 4), r = Math.random() - boost, q = r < .04 ? 3 : r < .16 ? 2 : r < .45 ? 1 : 0;
  const m = +(1 + .1 * (mk - 1) + .07 * q + Math.random() * .06 + (mk > 1 || q ? .04 : 0)).toFixed(2);
  return { slot, name: `${['', 'Tuned ', 'Military ', 'Prototype '][q]}${PART_NAMES[slot][mk - 1]} Mk ${['I', 'II', 'III', 'IV'][mk - 1]}`, mk, q, m };
}
function gainPart(p, why) {
  fit(); const cur = S.ext.fit[p.slot];
  if (S.ext.parts.length >= 12) { const w = S.ext.parts.reduce((a, b) => a.m < b.m ? a : b); if (w.m >= p.m) { S.gold += 4 * p.mk; chat('loot', null, `${why}: ${p.name}. Your hold is full, so you sell it for ${4 * p.mk} credits.`); return; } S.ext.parts.splice(S.ext.parts.indexOf(w), 1); }
  S.ext.parts.push(p); chat('loot', null, `${why}: ${p.name} (${SLOT[p.slot][0]} ×${p.m.toFixed(2)})${p.m > cur.m ? '. Better than what is fitted.' : '.'}`);
}
export function openFittings() {
  fit();
  UI.openSheet('Ship fittings', body => {
    const st = stats(), card = h => { const d = document.createElement('div'); d.className = 'card'; d.style.textAlign = 'left'; d.innerHTML = h; body.appendChild(d); return d; };
    card(`<h3 style="margin:0">The Second Chance</h3><p style="margin:4px 0 0">Hull ${st.hull} · Shields ${st.shield} · Gun damage ${st.dmg.toFixed(1)} · Top speed ${Math.round(st.spd)}</p>`);
    for (const k of Object.keys(SLOT)) { const p = S.ext.fit[k]; card(`<b style="color:${RARITY[p.q].c}">${SLOT[k][1]} ${p.name}</b><p class="dim" style="margin:2px 0 0">${SLOT[k][0]} · fitted · ×${p.m.toFixed(2)}</p>`); }
    if (!S.ext.parts.length) card('<p class="dim" style="margin:0">No spare parts in the hold.</p>');
    S.ext.parts.slice().sort((a, b) => b.m - a.m).forEach(p => { const cur = S.ext.fit[p.slot], c = card(`<b style="color:${RARITY[p.q].c}">${SLOT[p.slot][1]} ${p.name}</b><p class="dim" style="margin:2px 0 6px">${SLOT[p.slot][0]} · ×${p.m.toFixed(2)} <span style="color:${p.m > cur.m ? '#9be36b' : '#ff8a6a'}">(${p.m > cur.m ? '+' : ''}${Math.round((p.m - cur.m) * 100)}%)</span></p><div class="acts"><button class="pri" data-a="fit">Fit</button><button data-a="sell">Sell for ${4 * p.mk + 3 * p.q} credits</button></div>`);
      c.onclick = ev => { const a = ev.target.closest('button')?.dataset.a; if (!a) return; const i = S.ext.parts.indexOf(p); if (i < 0) return; S.ext.parts.splice(i, 1);
        if (a === 'fit') { S.ext.parts.push(cur); S.ext.fit[p.slot] = p; } else S.gold += 4 * p.mk + 3 * p.q; Game.save(); UI.refreshSheet(); }; });
  });
}
const lvl = () => S.hero?.lvl || 1;
export const crewN = () => (S.friends || []).length;
function stats() { const f = fit(), L = lvl(); return { hull: Math.round(180 + 14 * L), shield: Math.round((70 + 6 * L) * f.shield.m), dmg: (5 + .6 * L) * f.gun.m, spd: 40 * f.engine.m, rate: 4 }; }

// ---------- models ----------
const mat = R.propMat;
const mk = (geo, thick = .08) => { const g = new THREE.Group(); g.add(new THREE.Mesh(geo, mat), new THREE.Mesh(geo, R.propOutline(thick))); return g; };
const skiffGeo = (c = '#8a4a2a', t = '#d8b24a') => build([P(T(Cone(1.3, 5, 5), 0, 0, .5, Math.PI / 2), 0, O, c), P(T(Box(6.4, .3, 1.8), 0, 0, -1.2), 0, O, '#4a443e'), P(T(Box(6.6, .12, .5), 0, .2, -1.2), 0, O, t),
  ...LR.map(s => P(T(Cyl(.5, .6, 2, 6), 2.6 * s, 0, -1.6, Math.PI / 2), 0, O, '#3a3e44')), ...LR.map(s => P(T(Cyl(.4, .4, .2, 6), 2.6 * s, 0, -2.7, Math.PI / 2), 0, O, '#ff8a3a', 2.2)), P(T(Sph(.6, 6, 5), 0, .5, .6), 0, O, '#2a3a4a')]);
const raiderGeo = (c = '#6a2a2a') => build([P(T(Box(3, 1.6, 8), 0, 0, 0), 0, O, c), P(T(Cone(1.6, 4, 4), 0, 0, 5.8, Math.PI / 2, Math.PI / 4), 0, O, c), P(T(Box(10, .4, 3), 0, 0, -2), 0, O, '#3a3430'), P(T(Box(10.2, .15, .6), 0, .3, -2), 0, O, '#d8b24a'),
  ...LR.map(s => P(T(Cyl(.8, 1, 3.4, 6), 4.2 * s, 0, -3, Math.PI / 2), 0, O, '#3a3e44')), ...LR.map(s => P(T(Cyl(.7, .7, .2, 6), 4.2 * s, 0, -4.8, Math.PI / 2), 0, O, '#ff6a2a', 2.4)), P(T(Box(1.6, .8, 2), 0, 1.1, 1.5), 0, O, '#2a3a4a'), ...LR.map(s => P(T(Box(.3, .3, 3), 1.9 * s, .2, 4), 0, O, '#8a8f96'))]);
const droneGeo = () => build([P(T(Oct(1.6), 0, 0, 0), 0, O, '#6a7078'), P(T(Sph(.6, 6, 5), 0, 0, 1.2), 0, O, '#ff3a2a', 2.6), ...[0, 1, 2].map(k => P(T(Box(.3, .3, 3.2), Math.cos(k * TAU / 3) * 1.4, Math.sin(k * TAU / 3) * 1.4, -.6), 0, O, '#c8782a'))]);
const cutterGeo = c => build([P(T(Box(3.4, 2, 12), 0, 0, 0), 0, O, c), P(T(Box(2.2, 1.4, 5), 0, 0, 8, 0, 0, 0), 0, O, c), P(T(Box(9, .5, 4), 0, 0, -3), 0, O, c), P(T(Box(9.2, .2, .7), 0, .4, -3), 0, O, '#ffffff', .6), P(T(Box(1.8, 1.2, 2.4), 0, 1.6, -1), 0, O, '#2a3a4a'),
  ...LR.map(s => P(T(Cyl(1, 1.1, 4, 8), 3.4 * s, 0, -5.4, Math.PI / 2), 0, O, '#4a5058')), ...LR.map(s => P(T(Cyl(.9, .9, .2, 8), 3.4 * s, 0, -7.5, Math.PI / 2), 0, O, '#6ad8ff', 2.4))]);
const freighterGeo = () => build([P(T(Box(6, 5, 22), 0, 0, 0), 0, O, '#8a8478'), P(T(Box(4, 3, 5), 0, 1.5, 13), 0, O, '#6a6a68'), ...[-6, 0, 6].map(z => P(T(Box(6.4, 5.2, .6), 0, 0, z), 0, O, '#c8782a')), P(T(Box(2.4, 1.2, 2), 0, 3.2, 13), 0, O, '#2a3a4a'),
  ...LR.map(s => P(T(Cyl(1.6, 1.8, 5, 8), 2 * s, 0, -13, Math.PI / 2), 0, O, '#4a5058')), ...LR.map(s => P(T(Cyl(1.4, 1.4, .3, 8), 2 * s, 0, -15.6, Math.PI / 2), 0, O, '#ffcf6a', 2))]);
const wreckGeo = () => build([P(T(Box(7, 4, 14), 0, 0, 0, .3, .5, .2), 0, O, '#5a5048'), P(T(Box(9, .5, 4), 2, 1, -5, .8, .2, .6), 0, O, '#4a423c'), P(T(Cyl(1.2, 1.4, 5, 7), -4, -1, 5, 1.2, .3, .4), 0, O, '#3a3e44'), P(T(Oct(.5), 0, 2.6, 0), 0, O, '#ffcf6a', 2.4)]);
const rockGeo = () => build([P(T(Dod(1), 0, 0, 0, 0, 0, 0, 1.2, .8, 1), 0, O, '#6a5e54'), P(T(Dod(.6), .7, .3, .2), 0, O, '#7a6a5c')]);
const ringGeo = (r, col) => build([P(T(new THREE.TorusGeometry(r, .6, 6, 28), 0, 0, 0), 0, O, col, 2.2), ...[0, 1, 2, 3].map(k => P(T(Box(1.6, 1.6, 1.6), Math.cos(k * TAU / 4) * r, Math.sin(k * TAU / 4) * r, 0), 0, O, '#4a5058'))]);
const stationGeo = () => build([P(T(Cyl(16, 16, 10, 16), 0, 0, 0), 0, O, '#5a6470'), P(T(Cyl(5, 5, 60, 10), 0, 0, 0), 0, O, '#4a5058'), P(T(new THREE.TorusGeometry(40, 3, 6, 28), 0, 0, 0, Math.PI / 2), 0, O, '#6a727c'),
  ...[0, 1, 2, 3].map(k => P(T(Box(40, 1.6, 2.4), Math.cos(k * TAU / 4) * 20, 0, Math.sin(k * TAU / 4) * 20, 0, -k * TAU / 4), 0, O, '#4a5058')), ...[0, 1, 2, 3, 4, 5, 6, 7].map(k => P(T(Box(2, 1.2, .4), Math.cos(k * TAU / 8) * 43.2, 0, Math.sin(k * TAU / 8) * 43.2, 0, -k * TAU / 8 + Math.PI / 2), 0, O, '#6ad8ff', 2)),
  P(T(Oct(2), 0, 32, 0), 0, O, '#ff3a2a', 2.6), P(T(Oct(2), 0, -32, 0), 0, O, '#ff3a2a', 2.6)]);

// ---------- who is out here ----------
// hull and damage scale with the captain's level, so space stays a fight as the ship improves
const KIND = {
  skiff: { name: 'Dust Rat Skiff', geo: () => skiffGeo(), hull: 95, shield: 0, dmg: 9, spd: 33, turn: 1.7, rate: 1.1, r: 3.2, xp: .5, loot: .14, cr: [2, 5] },
  pirate: { name: 'Lane Pirate', geo: () => skiffGeo('#3a4a5a', '#8dffef'), hull: 130, shield: 30, dmg: 12, spd: 35, turn: 1.8, rate: 1.2, r: 3.2, xp: .6, loot: .18, cr: [3, 7] },
  raider: { name: 'Pirate Raider', geo: () => raiderGeo(), hull: 295, shield: 90, dmg: 18, spd: 29, turn: 1.25, rate: 1.4, r: 5, xp: 1.1, loot: .4, cr: [8, 16] },
  drone: { name: 'Scavenger Drone', geo: droneGeo, hull: 60, shield: 0, dmg: 7.5, spd: 40, turn: 2.5, rate: 1.4, r: 2.2, xp: .35, loot: .08, cr: [1, 3] },
  cutter: { name: 'Patrol Cutter', geo: () => cutterGeo('#4a6a9a'), hull: 460, shield: 210, dmg: 19.5, spd: 34, turn: 1.4, rate: 1.7, r: 6, xp: 1.5, loot: .5, cr: [0, 0] },
  ace: { name: 'Scarback Mollo', geo: () => raiderGeo('#2a2a2e'), hull: 650, shield: 260, dmg: 21, spd: 34, turn: 1.6, rate: 1.8, r: 5.4, xp: 3, loot: 1, cr: [30, 45], named: true },
  bait: { name: 'The "Freighter"', geo: freighterGeo, hull: 565, shield: 130, dmg: 18, spd: 18, turn: .7, rate: 1.9, r: 9, xp: 2, loot: .8, cr: [15, 25] },
};
const scale = () => .85 + Math.max(0, lvl() - 3) * .11;

// ---------- the scene ----------
const G = new THREE.Group(); G.visible = false; R.scene.add(G);
let stars = null;
const F = { on: false, sys: null, P: null, ents: [], shots: [], objs: [], rocks: [], msgT: 0, obj: '', ev: null, onDone: null, t: 0, fireHeld: false, paused: false, wreck: null, spawnT: 0 };
export const on = () => F.on;
const SHOTS = 240, shotGeo = new THREE.BoxGeometry(.35, .35, 3.4);
const shotMesh = [new THREE.InstancedMesh(shotGeo, new THREE.MeshBasicMaterial({ color: '#8dffef', fog: false }), SHOTS), new THREE.InstancedMesh(shotGeo, new THREE.MeshBasicMaterial({ color: '#ff5a3a', fog: false }), SHOTS)];
for (const m of shotMesh) { m.frustumCulled = false; m.count = 0; G.add(m); }
const o3 = new THREE.Object3D();
function clearScene() {
  for (const c of [...G.children]) if (!shotMesh.includes(c) && c !== stars) { G.remove(c); c.traverse(n => { if (n.geometry && n.geometry !== shotGeo) n.geometry.dispose(); }); }
  F.ents = []; F.shots = []; F.objs = []; F.rocks = [];
}
function ensureStars() {
  if (stars) return;
  const n = 1400, pos = new Float32Array(n * 3), col = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { const a = Math.random() * TAU, e = (Math.random() - .5) * Math.PI, r = 700; pos.set([Math.cos(a) * Math.cos(e) * r, Math.sin(e) * r, Math.sin(a) * Math.cos(e) * r], i * 3); const b = .5 + Math.random() * .5, t = Math.random(); col.set([b, b * (.85 + t * .15), b * (.7 + t * .3)], i * 3); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  stars = new THREE.Points(g, new THREE.PointsMaterial({ size: 2.2, sizeAttenuation: false, vertexColors: true, fog: false })); stars.frustumCulled = false; G.add(stars);
}
function addObj(o) { o.mesh.position.set(o.x, o.y || 0, o.z); G.add(o.mesh); F.objs.push(o); return o; }
function spawn(kind, x, z, o = {}) {
  const K = KIND[kind], s = scale() * (o.mul || 1), mesh = mk(K.geo());
  const e = { kind, name: K.name, x, z, yaw: Math.random() * TAU, v: K.spd * .6, hull: Math.round(K.hull * s), max: Math.round(K.hull * s), shield: Math.round(K.shield * s), maxS: Math.round(K.shield * s), dmg: K.dmg * s, K, mesh, fireT: rnd(.5, 2), brk: 0, jink: 0, team: 'foe', hitT: 0, ...o };
  mesh.position.set(x, 0, z); G.add(mesh); F.ents.push(e); return e;
}
const hostiles = () => F.ents.filter(e => e.team === 'foe' && !e.dead);
const fwd = y => [Math.sin(y), Math.cos(y)];

function buildSystem(sys) {
  clearScene(); ensureStars();
  const rng = Math.random;
  if (sys === 'moon') {
    const pl = new THREE.Mesh(new THREE.SphereGeometry(520, 40, 24), new THREE.MeshLambertMaterial({ color: '#b8885a', fog: false })); addObj({ type: 'decor', x: 0, y: -560, z: 60, mesh: pl });
    const ringed = new THREE.Group(); ringed.add(new THREE.Mesh(new THREE.SphereGeometry(160, 28, 18), new THREE.MeshBasicMaterial({ color: '#c89a6a', fog: false }))); const rg = new THREE.Mesh(new THREE.RingGeometry(200, 290, 48), new THREE.MeshBasicMaterial({ color: '#e8d8b8', fog: false, side: THREE.DoubleSide, transparent: true, opacity: .6 })); rg.rotation.set(1.3, .3, 0); ringed.add(rg);
    addObj({ type: 'decor', x: -520, y: 40, z: -640, mesh: ringed });
    addObj({ type: 'dock', name: 'Dustfall Port', label: 'Land at Dustfall Port', x: 0, z: 0, r: 13, mesh: mk(ringGeo(12, '#9be36b'), .1) });
    addObj({ type: 'buoy', name: 'Jump buoy', label: 'Open the star map', x: 60, z: -330, r: 13, mesh: mk(ringGeo(12, '#6ad8ff'), .1) });
    rocksAt(150, -120, 150, 46); rocksAt(-230, 130, 110, 26);
    for (const [x, z] of [[190, -150], [-250, 170], [-120, -260]]) addObj({ type: 'wreck', name: 'Drifting wreck', x: x + rnd(-30, 30), z: z + rnd(-30, 30), r: 15, prog: 0, mesh: mk(wreckGeo(), .1) });
    for (const [x, z] of [[170, -90], [-220, 100], [-60, -230]]) pack(x, z, ['skiff', 'skiff']);
    pack(250, -230, ['skiff', 'drone', 'drone']);
  } else if (sys === 'halfway') {
    addObj({ type: 'decor', x: 0, y: -6, z: 70, mesh: mk(stationGeo(), .25) });
    addObj({ type: 'dock', name: 'Halfway Station', label: 'Dock at lock six', x: 0, z: 0, r: 13, mesh: mk(ringGeo(12, '#9be36b'), .1) });
    addObj({ type: 'buoy', name: 'Jump buoy', label: 'Open the star map', x: -80, z: -330, r: 13, mesh: mk(ringGeo(12, '#6ad8ff'), .1) });
    rocksAt(260, -60, 130, 40); rocksAt(-270, -160, 120, 34);
    for (const [x, z] of [[280, -80], [-290, -190], [140, -300], [-200, 260]]) addObj({ type: 'wreck', name: 'Drifting wreck', x: x + rnd(-30, 30), z: z + rnd(-30, 30), r: 15, prog: 0, mesh: mk(wreckGeo(), .1) });
    for (const [x, z] of [[250, -40], [-260, -140], [200, -280]]) pack(x, z, ['pirate', 'pirate', 'skiff']);
    pack(-220, 280, ['raider', 'pirate']);
    if (!S.ext.aceDown || S.time - S.ext.aceDown > 1200) pack(330, -250, ['ace', 'pirate', 'pirate']);
    for (let i = 0; i < 3; i++) { const a = rng() * TAU; const e = spawn('bait', Math.cos(a) * 120, 70 + Math.sin(a) * 120, { team: 'neutral', name: 'Free hauler', lane: a }); e.hull = e.max = 9999; }
  }
  const w = S.ext.wreck; if (w && w.sys === sys) F.wreck = addObj({ type: 'wreck', mine: true, name: 'Your lost cargo', x: w.x, z: w.z, r: 15, prog: 0, mesh: mk(wreckGeo(), .1) });
}
function rocksAt(cx, cz, rad, n) { for (let i = 0; i < n; i++) { const a = Math.random() * TAU, d = Math.sqrt(Math.random()) * rad, s = 2 + Math.random() * 5, m = mk(rockGeo(), .05); m.scale.setScalar(s); m.rotation.set(rnd(0, 6), rnd(0, 6), rnd(0, 6)); const o = { x: cx + Math.cos(a) * d, z: cz + Math.sin(a) * d, r: s * 1.1, mesh: m, spin: rnd(-.3, .3) }; m.position.set(o.x, rnd(-2, 2), o.z); G.add(m); F.rocks.push(o); } }
function pack(x, z, kinds, o = {}) { return kinds.map((k, i) => spawn(k, x + Math.cos(i * 2.1) * 14, z + Math.sin(i * 2.1) * 14, { home: { x, z }, ...o })); }
function buildDeep(seedRocks = true) { clearScene(); ensureStars(); if (seedRocks) { rocksAt(rnd(-200, 200), rnd(-200, 200), 120, 30); rocksAt(rnd(-200, 200), rnd(-200, 200), 90, 20); } }

// ---------- the heads-up display ----------
let hud = null, radar = null;
function makeHud() {
  if (hud) return;
  hud = document.createElement('div'); hud.id = 'fly'; hud.className = 'hide';
  hud.innerHTML = `<div id="flyTop" class="plate"><div class="fname"><b>The Second Chance</b><small id="flySpd"></small></div><div class="bar tall" id="flyS"><i style="background:#6ad8ff"></i><span></span></div><div class="bar tall" id="flyH" style="margin-top:2px"><i style="background:var(--hp)"></i><span></span></div><div class="bar thin" id="flyE" style="margin-top:2px"><i style="background:#ffcf6a"></i></div></div>
    <div id="flyTgt" class="plate hide"><div class="fname"><b id="flyTn"></b><small id="flyTd"></small></div><div class="bar" id="flyTh"><i style="background:var(--hp)"></i></div></div>
    <div id="flyObj"></div><div id="flyMsg"></div><canvas id="flyRadar" width="220" height="220"></canvas>
    <button id="flyHome" class="hide"></button><div id="flyProg" class="hide"><div class="bar tall"><i style="background:#ffcf6a"></i><span></span></div></div>
    <button id="flyFire">FIRE</button><button id="flyBoost">Boost</button><button id="flyMis">🚀<small></small></button>`;
  document.body.appendChild(hud);
  radar = hud.querySelector('#flyRadar');
  const hold = (id, set) => { const b = hud.querySelector(id); const dn = ev => { ev.preventDefault(); set(true); b.classList.add('on'); }, up = ev => { ev.preventDefault(); set(false); b.classList.remove('on'); }; b.addEventListener('pointerdown', dn); b.addEventListener('pointerup', up); b.addEventListener('pointercancel', up); b.addEventListener('pointerleave', up); b.addEventListener('contextmenu', e => e.preventDefault()); };
  hold('#flyFire', v => F.fireHeld = v); hold('#flyBoost', v => F.boostHeld = v);
  hud.querySelector('#flyMis').addEventListener('pointerdown', ev => { ev.preventDefault(); missile(); });
  hud.querySelector('#flyHome').addEventListener('click', () => F.homeFn && F.homeFn());
  addEventListener('keydown', e => { if (!F.on || F.paused) return; if (e.code === 'Space') { F.fireHeld = true; e.preventDefault(); } if (e.key === 'Shift') F.boostHeld = true; if (e.key === 'f' || e.key === 'F') missile(); if (e.key === 'Enter') F.homeFn && F.homeFn(); });
  addEventListener('keyup', e => { if (e.code === 'Space') F.fireHeld = false; if (e.key === 'Shift') F.boostHeld = false; });
  const css = document.createElement('style');
  css.textContent = `body.flying #me,body.flying #party,body.flying #tgt,body.flying #hot,body.flying #xp,body.flying #util,body.flying #act,body.flying #track,body.flying #castbar,body.flying #mapbox,body.flying #rolls,body.flying .np,body.flying #vig,body.flying #breath{display:none!important}
#fly{position:fixed;inset:0;pointer-events:none;z-index:5}#fly button{pointer-events:auto;touch-action:none;-webkit-user-select:none;user-select:none}
#flyTop{position:absolute;top:var(--st);left:var(--sl);width:170px;padding:4px 7px;transform:scale(var(--ui));transform-origin:top left}
#flyTgt{position:absolute;top:calc(var(--st) + 56px * var(--ui));left:var(--sl);width:170px;padding:4px 7px}#flyTgt b{color:#ff8a7a}
@media(min-aspect-ratio:4/3){#flyTgt{top:var(--st);left:50%;margin-left:-85px}}
body.flying #chat{bottom:auto!important;right:auto!important;left:var(--sl);top:calc(var(--st) + 100px * var(--ui));width:min(230px,58vw)!important}
@media(min-aspect-ratio:4/3){body.flying #chat{top:calc(var(--st) + 62px * var(--ui))}}
#flyRadar{position:absolute;top:var(--st);right:var(--sr);width:104px;height:104px;border-radius:50%;border:2px solid var(--line);background:rgba(6,10,18,.7)}
#flyObj{position:absolute;top:calc(var(--st) + 112px);right:var(--sr);max-width:170px;text-align:right;font:600 11px "Exo 2",sans-serif;color:var(--acc);text-shadow:0 1px 2px #000,0 0 3px #000}
#flyMsg{position:absolute;top:24%;left:0;right:0;text-align:center;font:700 16px Orbitron,sans-serif;color:#fff;text-shadow:0 0 10px #6ad8ff,0 1px 2px #000;opacity:0;transition:opacity .4s;padding:0 20px}
#flyHome{position:absolute;left:50%;bottom:calc(var(--sb) + 150px);transform:translateX(-50%);min-height:42px;background:var(--acc);color:#1a1208;font-weight:700;box-shadow:0 2px 12px #000}
#flyProg{position:absolute;left:50%;bottom:calc(var(--sb) + 204px);transform:translateX(-50%);width:200px}
#flyFire{position:absolute;right:calc(var(--sr) + 10px);bottom:calc(var(--sb) + 26px);width:calc(96px * var(--joy));height:calc(96px * var(--joy));border-radius:50%;font:700 15px Orbitron,sans-serif;background:rgba(255,90,58,.28);border:2px solid #ff8a6a}
#flyFire.on{background:rgba(255,90,58,.7)}
#flyBoost{position:absolute;right:calc(var(--sr) + 18px + 96px * var(--joy));bottom:calc(var(--sb) + 20px);width:66px;height:66px;border-radius:50%;font-size:12px;background:rgba(255,207,106,.2);border:2px solid #ffcf6a;padding:0}#flyBoost.on{background:rgba(255,207,106,.6)}
#flyMis{position:absolute;right:calc(var(--sr) + 22px);bottom:calc(var(--sb) + 34px + 96px * var(--joy));width:58px;height:58px;border-radius:50%;font-size:20px;background:rgba(106,216,255,.2);border:2px solid #6ad8ff;padding:0}#flyMis small{display:block;font-size:10px}#flyMis.cd{opacity:.45}`;
  document.head.appendChild(css);
}
function say(t, hold = 2.6) { const m = hud.querySelector('#flyMsg'); m.textContent = t; m.style.opacity = 1; F.msgT = hold; }

// ---------- starting and stopping ----------
function begin(mode, sys) {
  makeHud(); fit();
  const st = stats();
  F.on = true; F.paused = false; F.sys = sys; F.mode = mode; F.t = 0; F.ev = null; F.homeFn = null; F.fireHeld = F.boostHeld = false; F.spawnT = 50; F.misT = 0; F.wreck = null;
  F.P = { x: 0, z: 30, yaw: Math.PI, vx: 0, vz: 0, v: 20, hull: st.hull, max: st.hull, shield: st.shield, maxS: st.shield, energy: 100, fireT: 0, hitT: 0, bank: 0, side: 1, mesh: mk(shipGeo(), .1), safeT: 3, repT: 0 };
  // the model was built to sit on landing legs; in flight it rides its own centre
  F.P.mesh.children.forEach(c => c.position.y = -3.4); F.P.mesh.scale.setScalar(.62);
  if (mode === 'system') buildSystem(sys); else buildDeep();
  G.add(F.P.mesh); G.visible = true; R.worldGroup.visible = false;
  for (const k in R.kinds) { const K = R.kinds[k]; K.mesh.count = K.ol.count = 0; } R.shadows.count = 0; R.arrows.count = 0; R.selRing.visible = false; R.tankRing.visible = false; R.clearTelegraphs();
  document.body.classList.add('flying'); hud.classList.remove('hide');
  S.target = null;
}
function end() {
  F.on = false; G.visible = false; R.worldGroup.visible = true; clearScene(); if (F.P) { G.remove(F.P.mesh); F.P = null; }
  document.body.classList.remove('flying'); hud?.classList.add('hide'); for (const m of shotMesh) m.count = 0;
  R.cam.far = F.far0 || 1200; R.cam.updateProjectionMatrix(); Game.save();
}
export function launch() {
  if (S.zone !== 'ship' || F.on) return;
  const sys = Ship.here(); begin('system', sys);
  F.obj = ''; say(sys === 'moon' ? 'Dustfall falls away beneath you' : 'Clear of lock six', 3);
  chat('sys', null, `You take the helm. ${Ship.SYSTEMS[sys].name} drops away behind the Second Chance.`);
  const crew = (S.friends || [])[0]; if (crew && !S.ext.flown) setTimeout(() => chat('party', crew.name, "I'll be in the engine room keeping her in one piece. Try not to make that difficult, Captain."), 1800);
  S.ext.flown = (S.ext.flown || 0) + 1;
}
function dock() { const sys = F.sys, name = Ship.SYSTEMS[sys].name; end(); chat('sys', null, sys === 'moon' ? 'The Second Chance settles onto the pad at Dustfall Port.' : `The Second Chance noses into lock six at ${name}.`); }

// ---------- fighting ----------
function fire(e, isP) {
  const [fx, fz] = fwd(e.yaw); let dx = fx, dz = fz;
  if (isP) { // a little aim assist: bolts lean toward a target that is nearly in the sights
    let best = null, ba = .2; for (const t of hostiles()) { const a = Math.abs(wrapA(Math.atan2(t.x - e.x, t.z - e.z) - e.yaw)), d = Math.hypot(t.x - e.x, t.z - e.z); if (a < ba && d < 150) { ba = a; best = t; } }
    if (best) { const d = Math.hypot(best.x - e.x, best.z - e.z), tt = d / 170, [tfx, tfz] = fwd(best.yaw), lx = best.x + tfx * best.v * tt - e.x, lz = best.z + tfz * best.v * tt - e.z, l = Math.hypot(lx, lz); dx = lx / l; dz = lz / l; }
    e.side = -e.side; F.shots.push({ x: e.x + fz * 2.6 * e.side + fx * 3, z: e.z - fx * 2.6 * e.side + fz * 3, dx, dz, spd: 170, life: 1.1, dmg: stats().dmg, mine: true });
  } else { const aim = Math.atan2(F.aimX - e.x, F.aimZ - e.z), ok = Math.abs(wrapA(aim - e.yaw)) < .3, sp = rnd(-.06, .06), a = (ok ? aim : e.yaw) + sp; dx = Math.sin(a); dz = Math.cos(a); F.shots.push({ x: e.x + fx * (e.K.r + 1), z: e.z + fz * (e.K.r + 1), dx, dz, spd: 125, life: 1.5, dmg: e.dmg, mine: false, from: e }); }
}
function missile() {
  const p = F.P; if (!F.on || F.paused || !p || F.misT > 0) return;
  let best = null, bd = 1e9; for (const t of hostiles()) { const a = Math.abs(wrapA(Math.atan2(t.x - p.x, t.z - p.z) - p.yaw)), d = Math.hypot(t.x - p.x, t.z - p.z); if (a < .7 && d < 220 && d < bd) { bd = d; best = t; } }
  if (!best) { say('No target in front', 1.2); return; }
  F.misT = 9; const [fx, fz] = fwd(p.yaw);
  for (const s of LR) F.shots.push({ x: p.x + fz * 3 * s, z: p.z - fx * 3 * s, dx: fx, dz: fz, spd: 95, life: 3.2, dmg: stats().dmg * 5, mine: true, home: best, mis: true });
}
function hurt(e, dmg, by) {
  if (e.dead) return; e.hitT = .15;
  if (e.shield > 0) { const a = Math.min(e.shield, dmg); e.shield -= a; dmg -= a; R.burst(e.x, 0, e.z, 4, [.4, .8, 1], 6, .3, 1.2); }
  if (dmg > 0) { e.hull -= dmg; R.burst(e.x, 0, e.z, 5, [1, .6, .2], 7, .35, 1.2); }
  e.sT = 4; // shields wait before recharging
  if (e === F.P) { S.shake = Math.min(.5, (S.shake || 0) + dmg / 60); if (e.hull <= 0) lost(); return; }
  if (e.team === 'neutral' && by === F.P && e.kind === 'cutter') e.team = 'foe';
  if (e.hull <= 0) destroyed(e);
}
function destroyed(e) {
  e.dead = true; G.remove(e.mesh); R.burst(e.x, 0, e.z, 50, [1, .7, .3], 22, .9, 2.4); R.burst(e.x, 0, e.z, 24, [1, 1, .8], 9, .5, 3);
  if (e.team === 'ally') { say(`${e.name} is lost`, 3); return; }
  if (e.team !== 'foe' && e.kind !== 'cutter') return;
  const K = e.K, cr = Math.round(rnd(K.cr[0], K.cr[1]) * (1 + lvl() * .08));
  if (cr) S.gold += cr;
  Cb.giveXp(S.hero, Math.round(mobXp(lvl()) * K.xp * Cb.XP_RATE));
  S.ext.spaceKills = (S.ext.spaceKills || 0) + 1;
  chat('loot', null, `${e.name} destroyed.${cr ? ` You scoop ${cr} credits from the debris.` : ''}`);
  if (Math.random() < K.loot) gainPart(makePart(F.sys === 'moon' && F.mode === 'system' ? 1 : 2, K.named ? .3 : 0), 'Salvaged');
  if (K.named) { S.ext.aceDown = S.time; chat('sys', null, 'Scarback Mollo will not be taxing the lanes again for a while.'); }
}
// the ship is lost: near a world you ride the pod down; out in the lanes you wake at the nearest station
function lost() {
  const p = F.P, sys = F.sys, deep = F.mode !== 'system', cut = Math.round(S.gold * .15), ev = F.ev;
  R.burst(p.x, 0, p.z, 80, [1, .7, .3], 26, 1.1, 3);
  F.paused = true; say('The Second Chance is breaking up', 3);
  setTimeout(() => {
    const wx = p.x, wz = p.z; end(); F.onDone = null;
    if (sys === 'moon' && !deep) {
      S.gold -= Math.round(cut * .6); S.ext.sys = 'moon';
      const a = Math.random() * TAU; Game.travel('moon', { x: D1.port.x + Math.cos(a) * 70, z: D1.port.z - 40 - Math.abs(Math.sin(a)) * 60 }, true);
      S.hero.hp = Math.max(1, Math.round(S.hero.maxHp * .35));
      chat('sys', null, `Your escape pod ploughs a furrow across the Homestead Flats. Tilly's tow skiff brings what is left of the Second Chance home to the pad, and Dekk's repair bill is ${Math.round(cut * .6)} credits.`);
    } else {
      S.gold -= cut; S.ext.wreck = cut > 0 ? { sys: 'halfway', x: deep ? rnd(-250, 250) : wx, z: deep ? rnd(-320, -150) : wz, credits: cut } : null; S.ext.sys = 'halfway';
      for (const z of world.zoneLines) { z.to = 'halfway'; z.label = 'Down the ramp to Halfway Station'; }
      chat('sys', null, `A station tug hauls the Second Chance into lock six at Halfway.${cut > 0 ? ` ${cut} credits of cargo are still drifting where you went down. Fly back out and salvage them.` : ''}`);
      if (ev) chat('sys', null, 'The jump is lost. The core will need a fresh fix.');
    }
    Game.save();
  }, 2200);
}

// ---------- each frame ----------
const camP = new THREE.Vector3(), camL = new THREE.Vector3();
export function frame(dt, inp) {
  if (!F.on) return;
  S.time += dt;
  const p = F.P, st = stats();
  if (!F.paused) {
    F.t += dt; F.misT = Math.max(0, F.misT - dt);
    // steering: left and right turn her, forward opens the throttle, back eases off
    p.yaw -= inp.mx * 2.1 * dt; p.bank += (-inp.mx * .55 - p.bank) * Math.min(1, dt * 6);
    const boosting = F.boostHeld && p.energy > 2; if (boosting) p.energy -= 34 * dt; else p.energy = Math.min(100, p.energy + 13 * dt);
    const want = st.spd * clamp(.65 - inp.mz * .7, 0, 1.3) * (boosting ? 1.75 : 1);   // pull right back and she holds still p.v += (want - p.v) * Math.min(1, dt * 2.2);
    const [fx, fz] = fwd(p.yaw); p.vx += (fx * p.v - p.vx) * Math.min(1, dt * 3.2); p.vz += (fz * p.v - p.vz) * Math.min(1, dt * 3.2);
    p.x += p.vx * dt; p.z += p.vz * dt;
    const far = Math.hypot(p.x, p.z); if (far > 430) { const k = 430 / far; p.x *= k; p.z *= k; if (F.msgT <= 0) say('The lanes end here. Come about.', 1.6); }
    if (boosting && Math.random() < .8) R.magic.emit(p.x - fx * 6, 0, p.z - fz * 6, -fx * 12 + rnd(-2, 2), rnd(-1, 1), -fz * 12 + rnd(-2, 2), .4, 2, .5, .85, 1, 0);
    p.fireT -= dt; if (F.fireHeld && p.fireT <= 0) { p.fireT = 1 / st.rate; fire(p, true); }
    p.sT = Math.max(0, (p.sT || 0) - dt); if (p.sT <= 0) p.shield = Math.min(p.maxS, p.shield + p.maxS * .09 * dt);
    p.safeT -= dt;
    // the crew at their stations: an engineer mends the hull, a second hand speeds the guns (later builds add more)
    if (crewN() > 0 && p.hull < p.max) { p.hull = Math.min(p.max, p.hull + p.max * (hostiles().some(e => e.aggro) ? .006 : .03) * dt); }
    for (const r of F.rocks) { r.mesh.rotation.y += r.spin * dt; const d = Math.hypot(p.x - r.x, p.z - r.z); if (d < r.r + 3) { const nx = (p.x - r.x) / (d || 1), nz = (p.z - r.z) / (d || 1); p.x = r.x + nx * (r.r + 3.1); p.z = r.z + nz * (r.r + 3.1); p.vx = nx * 14; p.vz = nz * 14; p.v *= .5; if (p.safeT <= 0) { hurt(p, 10 * scale(), null); p.safeT = .6; } } }
    for (const e of F.ents) if (!e.dead) ai(e, dt, p);
    shots(dt, p);
    objects(dt, p);
    if (F.ev) F.ev.tick?.(dt);
    else if (F.mode === 'system') { F.spawnT -= dt; if (F.spawnT <= 0 && hostiles().length < 9) { F.spawnT = rnd(45, 80); const a = Math.random() * TAU; const d = 330; const x = Math.cos(a) * d, z = Math.sin(a) * d; if (Math.hypot(x - p.x, z - p.z) > 160) pack(x, z, F.sys === 'moon' ? ['skiff', pick(['skiff', 'drone'])] : ['pirate', pick(['pirate', 'skiff', 'raider'])]); } }
  }
  // drawing
  p.mesh.position.set(p.x, 0, p.z); p.mesh.rotation.set(0, p.yaw, p.bank, 'YXZ');
  for (const e of F.ents) if (!e.dead) { e.mesh.position.set(e.x, 0, e.z); e.mesh.rotation.set(0, e.yaw, e.roll || 0, 'YXZ'); }
  for (const o of F.objs) if (o.type === 'dock' || o.type === 'buoy') o.mesh.rotation.z += dt * .5; else if (o.type === 'wreck') o.mesh.rotation.y += dt * .12;
  let n0 = 0, n1 = 0;
  for (const s of F.shots) { const m = shotMesh[s.mine ? 0 : 1], i = s.mine ? n0++ : n1++; if (i >= SHOTS) continue; o3.position.set(s.x, 0, s.z); o3.rotation.set(0, Math.atan2(s.dx, s.dz), 0); o3.scale.set(s.mis ? 2.2 : 1, s.mis ? 2.2 : 1, s.mis ? .8 : 1); o3.updateMatrix(); m.setMatrixAt(i, o3.matrix); }
  shotMesh[0].count = Math.min(n0, SHOTS); shotMesh[1].count = Math.min(n1, SHOTS); for (const m of shotMesh) m.instanceMatrix.needsUpdate = true;
  // camera: behind and above, looking ahead
  const [fx, fz] = fwd(p.yaw), tall = innerHeight > innerWidth, back = tall ? 38 : 26, up = tall ? 34 : 17;
  camP.set(p.x - fx * back, up, p.z - fz * back); camL.set(p.x + fx * (tall ? 12 : 34), 0, p.z + fz * (tall ? 12 : 34));
  const k = S.shake || 0; S.shake = Math.max(0, k - dt);
  R.cam.position.lerp(camP, Math.min(1, dt * 7)); if (F.t < .1) R.cam.position.copy(camP);
  R.cam.position.x += rnd(-k, k); R.cam.position.y += rnd(-k, k); R.cam.lookAt(camL);
  if (stars) stars.position.copy(R.cam.position);
  const u = R.skyMat.uniforms; u.top.value.set('#02030a'); u.mid.value.set('#070b1a'); u.hor.value.set(F.mode === 'system' && F.sys === 'moon' ? '#1a1420' : '#0c1226');
  R.scene.fog.color.set('#05070f'); R.scene.fog.near = 500; R.scene.fog.far = 2400; R.sun.intensity = 2.6; R.sun.color.set('#fff0d8'); R.hemi.intensity = 1.5;
  if (R.cam.far < 2000) { F.far0 = R.cam.far; R.cam.far = 2400; R.cam.updateProjectionMatrix(); }
  drawHud(dt, p, st);
}
function ai(e, dt, p) {
  const K = e.K; e.hitT = Math.max(0, e.hitT - dt);
  e.sT = Math.max(0, (e.sT || 0) - dt); if (e.sT <= 0 && e.maxS) e.shield = Math.min(e.maxS, e.shield + e.maxS * .05 * dt);
  let tgt = null, want = e.yaw, spd = K.spd;
  if (e.team === 'neutral') { // traffic flies its lane around the station
    if (e.lane !== undefined) { e.lane += dt * .1; const tx = Math.cos(e.lane) * 130, tz = 70 + Math.sin(e.lane) * 130; want = Math.atan2(tx - e.x, tz - e.z); spd = K.spd; }
    else { want = Math.atan2(p.x - e.x, p.z - e.z); spd = Math.hypot(p.x - e.x, p.z - e.z) > 50 ? K.spd : 8; }
  } else if (e.team === 'ally') { want = e.yaw + .12; spd = K.spd * .6; }
  else {
    const ally = F.ents.find(a => a.team === 'ally' && !a.dead), dP = Math.hypot(p.x - e.x, p.z - e.z);
    tgt = ally && !e.onP && (e.pref === 'ally' || dP > 70) ? ally : p;
    const d = Math.hypot(tgt.x - e.x, tgt.z - e.z);
    if (!e.aggro) { if (dP < (e.home ? 120 : 9999) || e.hull < e.max || e.ev) e.aggro = true; else { const h = e.home; e.orb = (e.orb || Math.random() * 6) + dt * .5; want = Math.atan2(h.x + Math.cos(e.orb) * 30 - e.x, h.z + Math.sin(e.orb) * 30 - e.z); spd = K.spd * .5; tgt = null; } }
    if (tgt) {
      e.brk -= dt;
      if (e.brk > 0) want = e.brkYaw;
      else if (d < 18 + K.r * 2) { e.brk = rnd(.7, 1.3); e.brkYaw = e.yaw + pick([-1, 1]) * rnd(1.2, 2); want = e.brkYaw; }
      else { const tt = d / 110, lx = tgt.x + (tgt.vx || 0) * tt, lz = tgt.z + (tgt.vz || 0) * tt; want = Math.atan2(lx - e.x, lz - e.z); }
      e.jink -= dt; if (e.hitT > 0 && e.jink <= 0) { e.jink = 2.6; e.brk = .35; e.brkYaw = e.yaw + pick([-1, 1]) * .9; }
      { const tt = d / 125; F.aimX = tgt.x + (tgt.vx || 0) * tt; F.aimZ = tgt.z + (tgt.vz || 0) * tt; }
      e.fireT -= dt; const off = Math.abs(wrapA(Math.atan2(tgt.x - e.x, tgt.z - e.z) - e.yaw));
      if (e.fireT <= 0 && off < .28 && d < 135) { e.fireT = 1 / K.rate * rnd(.8, 1.3); fire(e, false); }
      if (e.home && F.mode === 'system' && Math.hypot(e.x - e.home.x, e.z - e.home.z) > 330 && e.hull >= e.max) e.aggro = false;
    }
  }
  const dy = wrapA(want - e.yaw), tr = K.turn * dt; e.yaw += clamp(dy, -tr, tr); e.roll = ((e.roll || 0) * .9) + clamp(-dy, -.6, .6) * .1;
  e.v += (spd - e.v) * Math.min(1, dt * 2); const [fx, fz] = fwd(e.yaw); e.vx = fx * e.v; e.vz = fz * e.v; e.x += e.vx * dt; e.z += e.vz * dt;
  for (const r of F.rocks) { const d = Math.hypot(e.x - r.x, e.z - r.z); if (d < r.r + K.r) { e.x = r.x + (e.x - r.x) / (d || 1) * (r.r + K.r + .1); e.z = r.z + (e.z - r.z) / (d || 1) * (r.r + K.r + .1); e.brk = .8; e.brkYaw = e.yaw + 1.6; } }
}
const near = (s, e, r) => { const ax = s.px, az = s.pz, bx = s.x - ax, bz = s.z - az, l2 = bx * bx + bz * bz || 1, t = clamp(((e.x - ax) * bx + (e.z - az) * bz) / l2, 0, 1); return Math.hypot(e.x - ax - bx * t, e.z - az - bz * t) < r; };
function shots(dt, p) {
  for (const s of F.shots) {
    s.px = s.x; s.pz = s.z;
    if (s.home && !s.home.dead) { const want = Math.atan2(s.home.x - s.x, s.home.z - s.z), cur = Math.atan2(s.dx, s.dz), a = cur + clamp(wrapA(want - cur), -3.2 * dt, 3.2 * dt); s.dx = Math.sin(a); s.dz = Math.cos(a); if (Math.random() < .6) R.magic.emit(s.x, 0, s.z, 0, 0, 0, .35, 1.4, 1, .7, .3, 0); }
    s.x += s.dx * s.spd * dt; s.z += s.dz * s.spd * dt; s.life -= dt;
    if (s.mine) { for (const e of F.ents) if (!e.dead && (e.team === 'foe' || e.kind === 'cutter') && near(s, e, e.K.r + 1.4)) { hurt(e, s.dmg, p); e.aggro = true; e.onP = e.onP || Math.random() < .6; s.life = 0; break; } }
    else { if (near(s, p, 3.2)) { hurt(p, s.dmg, s.from); s.life = 0; } else for (const e of F.ents) if (!e.dead && e.team === 'ally' && near(s, e, e.K.r + 1)) { hurt(e, s.dmg, s.from); s.life = 0; break; } }
    if (s.life > 0) for (const r of F.rocks) if (near(s, r, r.r)) { s.life = 0; R.burst(s.x, 0, s.z, 3, [.7, .6, .5], 5, .3, 1); break; }
  }
  F.shots = F.shots.filter(s => s.life > 0);
}
function objects(dt, p) {
  const hot = hostiles().some(e => e.aggro && Math.hypot(e.x - p.x, e.z - p.z) < 170);
  let prog = null; F.homeFn = null; let homeLabel = '';
  for (const o of F.objs) {
    if (o.type === 'decor' || o.gone) continue;
    const d = Math.hypot(p.x - o.x, p.z - o.z);
    if (o.type === 'wreck' && d < o.r + 14) {
      if (hot && !o.mine) { prog = [o.prog / (o.need || 3.5), 'Hostiles too close to salvage']; continue; }
      o.prog += dt * (p.v < 20 ? 1 : .4); prog = [o.prog / (o.need || 3.5), o.mine ? 'Recovering your cargo' : 'Salvaging'];
      if (o.prog >= (o.need || 3.5)) { o.gone = true; G.remove(o.mesh); salvage(o); }
      if (o.onHalf && !o.halfDone && o.prog >= (o.need || 3.5) / 2) { o.halfDone = true; o.onHalf(); }
    }
    if ((o.type === 'dock' || o.type === 'buoy') && d < o.r + 8) { homeLabel = hot ? 'Hostiles too close' : o.label; F.homeFn = hot ? null : () => o.type === 'dock' ? dock() : openMapInFlight(); }
  }
  const hb = hud.querySelector('#flyHome'); hb.classList.toggle('hide', !homeLabel); if (homeLabel) { hb.textContent = homeLabel; hb.disabled = !F.homeFn; }
  const pg = hud.querySelector('#flyProg'); pg.classList.toggle('hide', !prog); if (prog) { pg.querySelector('i').style.width = clamp(prog[0], 0, 1) * 100 + '%'; pg.querySelector('span').textContent = prog[1]; }
}
function salvage(o) {
  if (o.mine) { const w = S.ext.wreck; if (w) { S.gold += w.credits; chat('loot', null, `You haul your lost cargo back aboard: ${w.credits} credits.`); S.ext.wreck = null; } return; }
  const cr = Math.round(rnd(6, 14) * (1 + lvl() * .1) * (o.rich || 1)); S.gold += cr; chat('loot', null, `Salvage: ${cr} credits of scrap and fittings.`);
  if (Math.random() < (o.rich ? 1 : .35)) gainPart(makePart(F.mode === 'system' && F.sys === 'moon' ? 1 : 2, o.rich ? .2 : 0), 'Pulled from the wreck');
  Cb.giveXp(S.hero, Math.round(mobXp(lvl()) * .5 * Cb.XP_RATE));
  if (F.ev?.onSalvage) F.ev.onSalvage(o);
}
function openMapInFlight() { F.paused = true; F.fireHeld = false; Ship.openStarMap(); const iv = setInterval(() => { if (document.getElementById('sheet').classList.contains('hide')) { clearInterval(iv); if (F.on) F.paused = false; } }, 200); }

function drawHud(dt, p, st) {
  const bar = (id, v, m, txt) => { const b = hud.querySelector(id); b.querySelector('i').style.width = clamp(v / m, 0, 1) * 100 + '%'; const s = b.querySelector('span'); if (s) s.textContent = txt ?? `${Math.max(0, Math.round(v))} / ${m}`; };
  bar('#flyS', p.shield, p.maxS, `Shields ${Math.max(0, Math.round(p.shield))}`); bar('#flyH', p.hull, p.max, `Hull ${Math.max(0, Math.round(p.hull))}`); bar('#flyE', p.energy, 100);
  hud.querySelector('#flySpd').textContent = Math.round(p.v * 10) + ' m/s';
  const mb = hud.querySelector('#flyMis'); mb.classList.toggle('cd', F.misT > 0); mb.querySelector('small').textContent = F.misT > 0 ? Math.ceil(F.misT) : '';
  if (F.msgT > 0) { F.msgT -= dt; if (F.msgT <= 0) hud.querySelector('#flyMsg').style.opacity = 0; }
  // nearest hostile in front becomes the target readout
  let best = null, bs = 1e9; for (const e of hostiles()) { const d = Math.hypot(e.x - p.x, e.z - p.z), a = Math.abs(wrapA(Math.atan2(e.x - p.x, e.z - p.z) - p.yaw)); const sc = d * (1 + a * 1.5); if (sc < bs && d < 260) { bs = sc; best = e; } }
  const tg = hud.querySelector('#flyTgt'); tg.classList.toggle('hide', !best);
  if (best) { hud.querySelector('#flyTn').textContent = best.name; hud.querySelector('#flyTd').textContent = Math.round(Math.hypot(best.x - p.x, best.z - p.z) * 10) + ' m'; hud.querySelector('#flyTh i').style.width = clamp((best.hull + best.shield) / (best.max + best.maxS), 0, 1) * 100 + '%'; }
  hud.querySelector('#flyObj').textContent = F.ev ? F.ev.text() : F.obj || '';
  // radar: you are the centre, forward is up
  const g = radar.getContext('2d'), W = 220, sc = 110 / 300, c = Math.cos(p.yaw), s = Math.sin(p.yaw);
  g.clearRect(0, 0, W, W); g.strokeStyle = 'rgba(140,200,255,.25)'; g.lineWidth = 1; for (const r of [36, 73, 108]) { g.beginPath(); g.arc(110, 110, r, 0, TAU); g.stroke(); }
  const dot = (x, z, col, sz, ring) => { const dx = x - p.x, dz = z - p.z; let rx = (dx * c - dz * s) * -sc, ry = -(dx * s + dz * c) * sc; const l = Math.hypot(rx, ry); if (l > 104) { rx *= 104 / l; ry *= 104 / l; } g.fillStyle = g.strokeStyle = col; g.beginPath(); g.arc(110 + rx, 110 + ry, sz, 0, TAU); if (ring) { g.lineWidth = 3; g.stroke(); } else g.fill(); };
  for (const r of F.rocks) dot(r.x, r.z, 'rgba(150,140,130,.35)', 2);
  for (const o of F.objs) if (!o.gone && o.type !== 'decor') dot(o.x, o.z, o.type === 'dock' ? '#9be36b' : o.type === 'buoy' ? '#6ad8ff' : '#ffcf6a', o.type === 'wreck' ? 5 : 8, o.type !== 'wreck');
  for (const e of F.ents) if (!e.dead) dot(e.x, e.z, e.team === 'foe' ? (e.aggro ? '#ff5a3a' : '#c8782a') : e.team === 'ally' ? '#9be36b' : '#9aa8b8', e.K.r > 4.5 ? 7 : 5);
  g.fillStyle = '#fff'; g.beginPath(); g.moveTo(110, 100); g.lineTo(117, 118); g.lineTo(103, 118); g.fill();
}

// ---------- jump events ----------
const crewSay = (t, d = 1500) => { const c = (S.friends || [])[0]; if (c) setTimeout(() => chat('party', c.name, t), d); };
function eventDone(msg, cb) { F.ev = null; F.obj = ''; say(msg, 2.6); const done = F.onDone; F.onDone = null; setTimeout(() => { if (!F.on) return; cb?.(); end(); done?.(); }, 2600); }
const around = (d0, d1) => { const a = Math.random() * TAU, d = rnd(d0, d1); return [F.P.x + Math.cos(a) * d, F.P.z + Math.sin(a) * d]; };
const EVENTS = {
  ambush() {
    begin('deep', 'deep'); say('PULLED OUT OF THE JUMP', 3);
    chat('sys', null, 'An interdiction snare slams the Second Chance back into real space. Pirates were waiting on the lane.'); crewSay("That's a snare! Somebody knew this lane. Guns are hot, Captain.");
    const n = 2 + Math.min(2, Math.floor(lvl() / 4)); for (let i = 0; i < n; i++) { const [x, z] = around(130, 190); spawn(i === 0 && lvl() >= 6 ? 'raider' : 'pirate', x, z, { ev: true, aggro: true }); }
    F.ev = { text: () => `Destroy the pirates: ${hostiles().length} left`, tick() { if (!hostiles().length) { const cr = Math.round(18 + lvl() * 4); S.gold += cr; chat('loot', null, `The snare buoy had a strongbox bolted to it: ${cr} credits.`); eventDone('Lane clear. Resuming the jump.'); } } };
  },
  distress() {
    const trap = Math.random() < .25;
    begin('deep', 'deep'); say('DISTRESS CALL', 3);
    chat('sys', null, 'The Second Chance drops out of the jump beside a freighter trailing sparks. Her captain is shouting on every channel at once.');
    const [x, z] = around(120, 150);
    if (trap) {
      const b = spawn('bait', x, z, { team: 'neutral', name: 'Stricken freighter' }); let sprung = false;
      F.ev = { text: () => sprung ? `It was bait. Destroy them: ${hostiles().length} left` : 'Close with the stricken freighter', tick() {
        if (!sprung && Math.hypot(b.x - F.P.x, b.z - F.P.z) < 70) { sprung = true; b.team = 'foe'; b.aggro = true; b.name = 'The "Freighter"'; say("IT'S A TRAP", 3); crewSay('Her gun ports just opened. That is no freighter!', 300); for (let i = 0; i < 2; i++) { const [px, pz] = around(100, 150); spawn('pirate', px, pz, { ev: true, aggro: true }); } }
        if (sprung && !hostiles().length) { const cr = Math.round(30 + lvl() * 6); S.gold += cr; chat('loot', null, `You strip the decoy for ${cr} credits.`); gainPart(makePart(2, .15), 'Cut from the decoy'); eventDone('Trap sprung and broken. Resuming the jump.'); } } };
    } else {
      const f = spawn('bait', x, z, { team: 'ally', name: 'Hauler Ostrander', ev: true }); f.hull = f.max = Math.round(520 * scale()); f.shield = f.maxS = 0;
      for (let i = 0; i < 3 + (lvl() >= 7 ? 1 : 0); i++) { const [px, pz] = [x + rnd(-70, 70), z + rnd(-70, 70)]; spawn(i ? 'pirate' : 'skiff', px, pz, { ev: true, aggro: true, pref: 'ally' }); }
      F.ev = { text: () => f.dead ? 'The hauler is lost' : `Protect the hauler (${Math.round(f.hull / f.max * 100)}%): ${hostiles().length} pirates`, tick() {
        if (f.dead) { chat('sys', null, 'The Ostrander breaks apart. There is nothing left to save, and nobody on the channel.'); eventDone('Too late. Resuming the jump.'); return; }
        if (!hostiles().length) { const cr = Math.round(35 + lvl() * 7); S.gold += cr; chat('sys', null, `Captain Ostrander: "I had forty years on this run and never once needed rescuing. I owe you, Second Chance." She sends over ${cr} credits.`); S.ext.rescues = (S.ext.rescues || 0) + 1; eventDone('Hauler saved. Resuming the jump.'); } } };
    }
  },
  derelict() {
    begin('deep', 'deep'); say('SOMETHING ON THE SCOPE', 3);
    chat('sys', null, "The core drops you out of the jump on its own. There is a dead ship here, cold for a long time, that isn't on any chart."); crewSay("She's old. Older than the lanes. Somebody ought to look, and I suppose that's us.");
    const [x, z] = around(140, 180); let woke = false;
    const o = addObj({ type: 'wreck', name: 'Derelict', x, z, r: 16, prog: 0, need: 7, rich: 2.5, mesh: mk(wreckGeo(), .1), onHalf() { woke = true; say('Scavengers inbound', 2.4); for (let i = 0; i < 3; i++) { const [px, pz] = around(150, 200); spawn('drone', px, pz, { ev: true, aggro: true }); } } }); o.mesh.scale.setScalar(1.8);
    F.ev = { text: () => o.gone ? 'Derelict stripped' : woke && hostiles().length ? `Drive off the scavengers: ${hostiles().length} left` : 'Hold beside the derelict to salvage it', onSalvage() { chat('sys', null, pick(["Her log is gone, but the last entry is scratched into the bulkhead by hand: 'The lamp went out. We never saw what took it.'", "Her nav plot still shows a heading: straight for a star that the tables say was never there.", "Every clock aboard stopped at the same second. Juno says that doesn't happen. Then she stops talking about it."])); eventDone('Salvage aboard. Resuming the jump.'); }, tick() { } };
  },
  patrol(proceed) {
    const rep = Math.random() < .5, who = rep ? 'Republic' : 'Imperial', fine = Math.min(S.gold, Math.round(12 + lvl() * 3)), smooth = ['blightblade', 'bard'].includes(S.heroCls);
    chat('sys', null, `A ${who} patrol cutter matches your course and paints the Second Chance with a targeting beam.`);
    UI.openSheet(`${who} patrol`, body => {
      const el = h => { const d = document.createElement('div'); d.innerHTML = h; body.appendChild(d.firstElementChild); return body.lastElementChild; };
      el(`<div class="card" style="text-align:left"><p style="margin:0"><b>${rep ? 'Lieutenant on the cutter Probity' : 'Watch officer on the cutter Iron Vow'}:</b> ${rep ? '"Unregistered freighter, you are flying a Republic lane without papers. Cut your drive and stand by for inspection. This will go more quickly if you do not attempt to be charming."' : '"Freighter. You are in a lane the Empire has taken an interest in. You will heave to. You will be scanned. If you are carrying nothing, you will have lost nothing but time."'}</p></div>`);
      const opt = (label, fn) => { const b = el(`<button class="opt" style="display:block;width:100%;margin:6px 0;text-align:left">${label}</button>`); b.onclick = () => { UI.closeSheet(); fn(); }; };
      opt('▸ Heave to and let them scan the hold.', () => { if (Math.random() < .3 && fine > 0) { S.gold -= fine; chat('sys', null, `They find nothing, and fine you ${fine} credits anyway for "irregular registration". The receipt is very official.`); } else chat('sys', null, 'They scan the hold, find nothing worth a report, and wave you on with obvious disappointment.'); proceed(); });
      opt(`▸ Talk your way through.${smooth ? ' <span class="qn">You have a knack for this</span>' : ''}`, () => { if (smooth || Math.random() < .5) { chat('sys', null, 'By the time you have finished explaining, the officer is apologizing to you. The cutter peels away.'); S.ext.talked = (S.ext.talked || 0) + 1; } else if (fine > 0) { const f2 = Math.min(S.gold, fine * 2); S.gold -= f2; chat('sys', null, `The officer has heard that one before. The fine is ${f2} credits, and the lecture is free.`); } else chat('sys', null, 'The officer has heard that one before, but you have nothing worth fining.'); proceed(); });
      opt('▸ Run for it.', () => { begin('deep', 'deep'); F.onDone = proceed; say('RUN', 2.4); S.ext.heat = (S.ext.heat || 0) + 1; chat('sys', null, `You slam the throttle open. The ${who} cutter opens fire, and the core starts spooling for a fresh jump.`); crewSay('Thirty seconds to spool the core! Keep us in one piece until then!', 600);
        for (let i = 0; i < 2; i++) { const [x, z] = around(120, 160); spawn('cutter', x, z, { ev: true, aggro: true, name: `${who} Cutter`, mul: i ? .8 : 1 }); }
        let t = 30; F.ev = { text: () => t > 0 ? `Survive until the core spools: ${Math.ceil(t)} s` : 'Jumping', tick(dt) { t -= dt; if (t <= 0 || !hostiles().length) eventDone(hostiles().length ? 'Core spooled. Jumping.' : 'Patrol destroyed. Jumping.'); } }; });
    });
  },
};
// called by the star map: now and then a jump does not go to plan
X.jumpEvent = (to, proceed) => {
  if (!S.ext.jumps || S.ext.jumps < 1) return false;                    // the first jump is always clean
  const force = X.forceEvent; X.forceEvent = null;
  if (!force && Math.random() > .5) return false;
  const kind = force || pick(['ambush', 'ambush', 'distress', 'derelict', 'patrol']);
  if (F.on) end();
  if (kind === 'patrol') { EVENTS.patrol(proceed); return true; }
  EVENTS[kind](); F.onDone = proceed; return true;
};
// the helm: take her up yourself, or look over her fittings
X.talk.push((k, n, api) => k === 'helm' ? [['▸ Take the helm and fly.', () => { api.close(); launch(); }, 'hl'], ['▸ Look over the ship\'s fittings.', () => { api.close(); openFittings(); }]] : null);
export const state = F;
X.flightEnd = () => { if (F.on) end(); };
export { EVENTS, end };
