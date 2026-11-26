// Build 3: life on the coast. Ferries, rowboats, swimming and breath, fishing, zone lines, the Grove Gate.
import * as THREE from './three.js';
import { S, dist, rnd, pick, chat, floatText, clamp, X } from './core.js';
import { world, hgt, depthAt } from './world.js';
import { worldGroup, propMat, propOutline, burst } from './render.js';
import * as CO from './coastmodels.js';
import * as Cb from './combat.js';
import { FISH, CLASSES, MOBS } from './data.js';

let G = null; // late-bound game module (avoids a circular import)
export function bindGame(g) { G = g; }

export const BREATH_MAX = 30;
const FERRY_SPD = 11, FERRY_WAIT = 15, ROW_SPD = 7.5;
export const sea = { ferry: null, boat: null, fish: null, armed: false, gate: false };

const meshOf = geo => { const g = new THREE.Group(); g.add(new THREE.Mesh(geo, propMat), new THREE.Mesh(geo, propOutline(.04))); worldGroup.add(g); return g; };
const dockBy = key => world.docks.find(d => d.key === key);

// ---------- zone set-up ----------
export function setupZone() {
  sea.ferry = null; sea.boat = null; sea.fish = null; sea.armed = false;
  for (const p of S.party) { p.onBoat = null; p.breath = BREATH_MAX; }
  if (world.zone === 'coast' && world.ferryRoute) {
    const route = world.ferryRoute.map(dockBy).filter(Boolean);
    const mesh = meshOf(CO.shipGeo('#e8e0c8'));
    // the ferry starts somewhere in its loop, so you sometimes wait and sometimes don't
    sea.ferry = { route, leg: 0, state: 'dock', t: rnd(2, FERRY_WAIT), x: route[0].berth.x, z: route[0].berth.z, yaw: 0, mesh, riders: [] };
    sea.ferry.yaw = route[0].ang + Math.PI / 2;
  }
}

// ---------- each frame ----------
export function tick(dt) {
  if (!S.hero) return;
  swimming(dt);
  if (sea.ferry) ferryTick(dt);
  if (sea.boat) boatTick(dt);
  if (sea.fish) fishTick(dt);
  zoneLines();
}

// swimming slows everyone who isn't a sea creature; breath runs out in deep water
function swimming(dt) {
  const under = world.water === null;
  for (const e of S.ents) {
    if (e.dead || e.remove || e.team === 'npc' || e.onBoat) continue;
    if (e.mob && MOBS[e.mob]?.aquatic) continue;
    if (!under && e.swim && !Cb.buffSum(e, 'swim')) Cb.buff(e, 'swimming', .35, { slow: .4 });
    if (!e.inParty) continue;
    const deep = !under && depthAt(e.x, e.z) > 3 && !Cb.buffSum(e, 'breath');
    if (e.breath === undefined) e.breath = BREATH_MAX;
    if (deep) {
      e.breath = Math.max(0, e.breath - dt);
      if (e.breath <= 0) { e.drownT = (e.drownT || 0) - dt; if (e.drownT <= 0) { e.drownT = 1; e.hp -= e.maxHp * .1; if (e.hp <= 0) { e.hp = 0; Cb.kill(e, e); } floatText(e, 'Drowning!', '#5fb8ff'); if (e.isHero && e.dead) chat('sys', null, 'You drowned.'); } }
      else if (e.isHero && e.breath < 8 && Math.ceil(e.breath) !== Math.ceil(e.breath + dt)) floatText(e, `Air: ${Math.ceil(e.breath)}`, '#5fb8ff');
    } else e.breath = Math.min(BREATH_MAX, e.breath + dt * 6);
  }
}

// ---------- the ferry ----------
function ferryTick(dt) {
  const f = sea.ferry, cur = f.route[f.leg], next = f.route[(f.leg + 1) % f.route.length];
  if (f.state === 'dock') {
    f.t -= dt;
    if (f.t <= 0) {
      f.state = 'sail';
      if (f.riders.length && f.riders.includes(S.hero)) chat('say', 'Ferryman Hobb', `Casting off for ${next.name}!`);
      else if (dist(S.hero, cur) < 30) chat('say', 'Ferryman Hobb', `Ferry for ${next.name} is leaving!`);
    }
  } else {
    const tx = next.berth.x, tz = next.berth.z, dx = tx - f.x, dz = tz - f.z, l = Math.hypot(dx, dz);
    const want = Math.atan2(dx, dz); let d = want - f.yaw; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI; f.yaw += d * Math.min(1, dt * 1.2);
    const step = Math.min(l, FERRY_SPD * dt * (l < 15 ? .5 + l / 30 : 1));
    if (l < .6) { f.x = tx; f.z = tz; f.leg = (f.leg + 1) % f.route.length; f.state = 'dock'; f.t = FERRY_WAIT; if (f.riders.includes(S.hero)) chat('say', 'Ferryman Hobb', `${next.name}! Mind the gap.`); }
    else { f.x += dx / l * step; f.z += dz / l * step; }
  }
  f.mesh.position.set(f.x, Math.sin(S.time * 1.3) * .12, f.z); f.mesh.rotation.y = f.yaw; f.mesh.rotation.z = Math.sin(S.time * .9) * .03;
  // riders stand on deck
  f.riders.forEach((p, i) => {
    if (p.dead || !S.party.includes(p)) return;
    const ox = ((i % 3) - 1) * 1.3, oz = Math.floor(i / 3) * 2 - 1.5, s = Math.sin(f.yaw), c = Math.cos(f.yaw);
    p.x = f.x + ox * c + oz * s; p.z = f.z - ox * s + oz * c; p.y = .9 + Math.sin(S.time * 1.3) * .12; p.moving = 0;
  });
  f.riders = f.riders.filter(p => !p.dead && S.party.includes(p));
}
export const ferryDocked = () => sea.ferry && sea.ferry.state === 'dock' ? sea.ferry.route[sea.ferry.leg] : null;
export function boardFerry() {
  const f = sea.ferry; if (!f) return;
  if (S.party.some(p => !p.dead && Cb.inCombat(p))) { chat('sys', null, "You can't board while your group is fighting."); return; }
  f.riders = S.party.filter(p => !p.dead && dist(p, S.hero) < 45);
  for (const p of f.riders) { p.onBoat = 'ferry'; p.casting = null; p.sit = false; }
  const nx = f.route[(f.leg + 1) % f.route.length];
  chat('sys', null, `You board the ferry. Next stop: ${nx.name}. Tap Disembark at any dock.`);
}
export function leaveFerry() {
  const f = sea.ferry, d = ferryDocked(); if (!f || !d) return;
  for (const [i, p] of f.riders.entries()) { p.onBoat = null; p.x = d.x - Math.cos(d.ang) * (2 + i * .8) + rnd(-.8, .8); p.z = d.z - Math.sin(d.ang) * (2 + i * .8) + rnd(-.8, .8); p.y = hgt(p.x, p.z); }
  f.riders = [];
  chat('sys', null, `You step off at ${d.name}.`);
}

// ---------- rowboats ----------
export function rentBoat() {
  const d = world.docks.find(k => dist(S.hero, k) < 6); if (!d) return;
  if (S.gold < 2) { chat('sys', null, 'A rowboat costs 2 credits.'); return; }
  if (S.party.some(p => !p.dead && Cb.inCombat(p))) { chat('sys', null, "Not while you're fighting."); return; }
  S.gold -= 2;
  const x = d.x + Math.cos(d.ang) * 2 + Math.sin(d.ang) * 2.6, z = d.z + Math.sin(d.ang) * 2 - Math.cos(d.ang) * 2.6;
  sea.boat = { x, z, yaw: Math.PI / 2 - d.ang, mesh: meshOf(CO.rowboatGeo()), riders: S.party.filter(p => !p.dead && dist(p, S.hero) < 40), spd: 0 };
  for (const p of sea.boat.riders) { p.onBoat = 'row'; p.casting = null; p.sit = false; }
  chat('sys', null, 'You rent a rowboat for 2 credits. Steer with the stick. Tap Go ashore near land.');
}
// called by the hero's movement code while rowing
export function steerBoat(vx, vz, l, dt) {
  const b = sea.boat; if (!b) return;
  if (l > .12) {
    let d = Math.atan2(vx, vz) - b.yaw; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI;
    b.yaw += d * Math.min(1, dt * 3); b.spd = Math.min(ROW_SPD * Math.min(1, l), b.spd + dt * 8);
  } else b.spd = Math.max(0, b.spd - dt * 6);
  const nx = b.x + Math.sin(b.yaw) * b.spd * dt, nz = b.z + Math.cos(b.yaw) * b.spd * dt;
  if (depthAt(nx, nz) > .7 && Math.abs(nx) < 296 && Math.abs(nz) < 296) { b.x = nx; b.z = nz; } else b.spd = 0;
}
function boatTick(dt) {
  const b = sea.boat;
  b.mesh.position.set(b.x, Math.sin(S.time * 2) * .06, b.z); b.mesh.rotation.y = b.yaw;
  b.riders.forEach((p, i) => {
    if (p.dead) return;
    const oz = (i - (b.riders.length - 1) / 2) * .75, s = Math.sin(b.yaw), c = Math.cos(b.yaw);
    p.x = b.x + oz * s; p.z = b.z + oz * c; p.y = .35 + Math.sin(S.time * 2) * .06; p.yaw = b.yaw; p.moving = 0;
  });
  // something big in the water tips you out
  if (S.ents.some(m => m.mob && !m.dead && m.target && b.riders.includes(m.target) && dist(m, b) < 4)) { chat('sys', null, 'Your rowboat capsizes!'); goAshore(true); }
}
export function shoreNear() {
  const b = sea.boat; if (!b) return null;
  for (let r = 2; r <= 7; r += 1) for (let k = 0; k < 16; k++) { const a = k / 16 * Math.PI * 2, x = b.x + Math.sin(a) * r, z = b.z + Math.cos(a) * r; if (depthAt(x, z) < .25) return { x, z }; }
  return null;
}
export function goAshore(tip) {
  const b = sea.boat; if (!b) return;
  const sh = tip ? null : shoreNear();
  b.riders.forEach((p, i) => { p.onBoat = null; if (sh) { p.x = sh.x + rnd(-1, 1); p.z = sh.z + rnd(-1, 1); } else { p.x = b.x + rnd(-2, 2); p.z = b.z + rnd(-2, 2); } p.y = hgt(p.x, p.z); });
  worldGroup.remove(b.mesh); sea.boat = null;
}

// ---------- fishing ----------
export function canFish() {
  const h = S.hero;
  if (!S.pole || world.water === null || h.swim || h.onBoat && h.onBoat !== 'row' || Cb.inCombat(h)) return false;
  const x = h.x + Math.sin(h.yaw) * 4, z = h.z + Math.cos(h.yaw) * 4;
  return depthAt(x, z) > .8 || !!h.onBoat;
}
export function castLine() {
  const h = S.hero, x = h.x + Math.sin(h.yaw) * 4.5, z = h.z + Math.cos(h.yaw) * 4.5;
  const mesh = meshOf(CO.bobberGeo()); mesh.position.set(x, 0, z);
  sea.fish = { x, z, mesh, t: rnd(3, 9), state: 'wait', hx: h.x, hz: h.z };
  h.anim.atk = 1; chat('sys', null, 'You cast your line.');
}
function fishTick(dt) {
  const f = sea.fish, h = S.hero;
  if (h.dead || Math.hypot(h.x - f.hx, h.z - f.hz) > 1.5 || Cb.inCombat(h)) { stopFish('Your line goes slack.'); return; }
  f.t -= dt;
  if (f.state === 'wait') { f.mesh.position.y = Math.sin(S.time * 3) * .05; if (f.t <= 0) { f.state = 'bite'; f.t = 1.2; burst(f.x, .1, f.z, 10, [.8, .9, 1], 1.5, .4, .3); } }
  else if (f.state === 'bite') { f.mesh.position.y = -.25 + Math.sin(S.time * 25) * .08; if (f.t <= 0) stopFish('It got away.'); }
}
export function reel() {
  const f = sea.fish; if (!f) return;
  if (f.state !== 'bite') { stopFish('You reel in too early. Nothing.'); return; }
  let r = Math.random() * FISH.reduce((s, x) => s + x.w, 0), fish = FISH[0];
  for (const x of FISH) { r -= x.w; if (r <= 0) { fish = x; break; } }
  stopFish(null);
  const it = { name: fish.name, slot: 'junk', type: 'fish', lvl: 1, rarity: fish.value >= 25 ? 2 : fish.value >= 10 ? 1 : 0, stats: {}, value: fish.value, junk: true, note: fish.note };
  if (G.addToBag(it)) chat('loot', null, `You catch ${/^[AEIOU]/.test(fish.name) ? 'an' : 'a'} ${fish.name}!${fish.note ? ' ' + fish.note : ''}`);
}
export function stopFish(msg) { if (!sea.fish) return; worldGroup.remove(sea.fish.mesh); sea.fish = null; if (msg) chat('sys', null, msg); }

// ---------- zone lines ----------
function zoneLines() {
  const h = S.hero; if (h.dead || h.onBoat) return;
  let near = null;
  for (const z of world.zoneLines) if (Math.hypot(h.x - z.x, h.z - z.z) < z.r) near = z;
  if (!near) { sea.armed = true; return; }
  if (!sea.armed || near.to === 'fleet') return; // the fleet needs a deliberate dive
  sea.armed = false;
  const why = X.gate?.[near.to]?.(); if (why) { chat('sys', null, why); return; }   // Build 7: the raid's door checks who you are
  G.travel(near.to);
}
export const fleetLine = () => { const h = S.hero; return world.zoneLines.find(z => z.to === 'fleet' && Math.hypot(h.x - z.x, h.z - z.z) < z.r + 2); };
export function dive() {
  if (S.party.length < 2) chat('sys', null, 'You dive alone. The fleet is tuned for a full group of six. Good luck.');
  sea.armed = false; G.travel('fleet');
}

// ---------- the Druid's Grove Gate ----------
export function gateTargets() {
  const out = [];
  if (S.bind) out.push({ label: 'Your bind point', zone: S.bind.zone || 'vale', x: S.bind.x, z: S.bind.z });
  out.push({ label: 'Saltmarrow (Saltreach Coast)', zone: 'coast', town: true });
  out.push({ label: 'The Vale town', zone: 'vale', town: true });
  return out;
}
export function gateTo(t) {
  const arrive = t.town ? null : { x: t.x, z: t.z };
  if (t.zone === S.zone) {
    const tw = world.town, a = arrive || { x: tw.x + 1, z: tw.z + 4 };
    for (const p of S.party) if (!p.dead && dist(p, S.hero) < 40) { p.x = a.x + rnd(-2, 2); p.z = a.z + rnd(-2, 2); p.y = hgt(p.x, p.z); }
    S.hero.x = a.x; S.hero.z = a.z; S.hero.y = hgt(a.x, a.z);
    burst(a.x, S.hero.y + 1, a.z, 40, [.4, 1, .5], 3, 1, .8);
    chat('sys', null, 'The grove gate opens and closes behind you.');
  } else {
    const tw = null; // the new zone decides where its town is
    G.travel(t.zone, arrive, true);
    if (!arrive) { const T = world.town; S.hero.x = T.x + 1; S.hero.z = T.z + 4; S.hero.y = hgt(S.hero.x, S.hero.z); for (const p of S.party) if (!p.isHero) { p.x = S.hero.x + rnd(-2, 2); p.z = S.hero.z + rnd(-2, 2); p.y = hgt(p.x, p.z); } }
  }
}

// ---------- the context button ----------
export function action() {
  const h = S.hero;
  if (sea.fish) return { label: sea.fish.state === 'bite' ? '🎣 REEL!' : '🎣 Reel', fn: reel };
  if (h.onBoat === 'ferry') { const d = ferryDocked(); return d ? { label: `Disembark at ${d.name}`, fn: leaveFerry } : null; }
  if (h.onBoat === 'row') { if (shoreNear()) return { label: 'Go ashore', fn: () => goAshore(false) }; return canFish() ? { label: '🎣 Fish', fn: castLine } : null; }
  const fl = fleetLine(); if (fl) return { label: 'Dive to the Sunken Fleet', fn: dive };
  const d = ferryDocked(); if (d && dist(h, d) < 8) return { label: `Board ferry (next: ${sea.ferry.route[(sea.ferry.leg + 1) % sea.ferry.route.length].name})`, fn: boardFerry };
  const dk = world.docks.find(k => dist(h, k) < 4); if (dk) return { label: 'Rent a rowboat (2g)', fn: rentBoat };
  if (canFish()) return { label: '🎣 Fish', fn: castLine };
  return null;
}
