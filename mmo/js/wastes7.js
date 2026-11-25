// Build 7: the Blighted Wastes of Vharos (levels 15-20). The kingdom of Vharos died in the summoner wars, and the
// Gravelord rules what is left. 1260 across, the biggest zone yet, and the slowest to level in.
// Emberwatch (the last garrison of Corrand) holds the south; Saint Orrin's Refuge the west; the Hollow Throne,
// the ruined citadel at the top of the map, holds the rift into Between Worlds.
import * as THREE from './three.js';
import { S, WH, TAU, clamp, lerp, smooth, mulberry32, makeNoise, chat, pick, rnd, isNight, X } from './core.js';
import { worldGroup, addChunked, propMat, grassTex, scene } from './render.js';
import * as R from './render.js';
import * as M from './models.js';
import { build, P, T, Cone, Cyl, Box, Dod, Sph, Oct } from './models.js';
import { H, HN, hgt, world, addWall, linkDoors, mergeBuilt, mat4, meshWithOutline, ruinWallGeo, pillarGeo, campVisual, registerZone, zoneMarker, ZONE_SIZE, valeHooks } from './world.js';
import { groundMesh } from './zones.js';
import { MOBS } from './data.js';
import { MOB_LORE } from './dialogue.js';
import { houseGeo } from './town.js';
import { INSTANCES, DBOSSES, FINALS, buildInstance } from './dungeons.js';
import * as Cb from './combat.js';
const O = [0, 0, 0];
ZONE_SIZE.wastes = 630;

export const W7 = {
  ember: { x: 0, z: 460, R: 32, base: 3 },            // Emberwatch, the garrison
  refuge: { x: -360, z: 60, R: 20, base: 4 },         // Saint Orrin's Refuge
  barrows: { x: -300, z: 320, R: 34 },                // open dungeon, 15-16
  foundry: { x: 330, z: 290, R: 32 },                 // open dungeon, 16-17
  witchroot: { x: 380, z: -100, R: 36 },              // open dungeon, 17-18
  cathedral: { x: -440, z: -130 },                    // door: the Bone Cathedral, 17-18
  gaol: { x: -260, z: -380 },                         // door: the Gaol of Kings, 18-19
  ossuary: { x: 270, z: -390 },                       // door: the Black Ossuary, 19-20
  throne: { x: 0, z: -500, R: 46 },                   // the Hollow Throne: the rift to Between Worlds
};
Object.assign(INSTANCES, {
  cathedral: { parent: 'wastes', out: { x: W7.cathedral.x + 8, z: W7.cathedral.z }, name: 'The Bone Cathedral' },
  gaol: { parent: 'wastes', out: { x: W7.gaol.x, z: W7.gaol.z + 9 }, name: 'The Gaol of Kings' },
  ossuary: { parent: 'wastes', out: { x: W7.ossuary.x, z: W7.ossuary.z + 9 }, name: 'The Black Ossuary' },
  between: { parent: 'wastes', out: { x: W7.throne.x, z: W7.throne.z + 20 }, name: 'Between Worlds' },
});
export const WASTE_ZONES = ['wastes', 'cathedral', 'gaol', 'ossuary', 'between'];
// the wastes are the slowest place in the world to grow stronger
X.xpMul.push(() => WASTE_ZONES.includes(S.zone) || S.zone?.startsWith('h_') ? .7 : 1);

// ---------- the way north out of the Vale ----------
valeHooks.build = (prev => a => {
  if (prev) prev(a);
  const zx = 0, zz = -WH + 14;
  world.zoneLines.push({ x: zx, z: zz, r: 9, to: 'wastes', label: 'North to the Blighted Wastes (levels 15-20)' }); zoneMarker(zx, zz, 0);
})(valeHooks.build);

// ---------- enemies ----------
const U = { undead: true }, B = { beast: true }, HU = { human: true };
const mob = (name, kind, o) => ({ name, kind, hpM: 1, dmgM: 1, spd: 5.4, range: 2.4, weak: 'holy', resist: 'shadow', scale: 1, aggro: 12, social: 14, ...o });
Object.assign(MOBS, {
  // the dead of Vharos
  bonewarden: mob('Vharosi Bonewarden', 'skeleton', { hpM: 1.1, ...U, scale: 1.1 }),
  blightghoul: mob('Blightghoul', 'ghoul', { hpM: 1, dmgM: 1.1, spd: 5.8, weak: 'fire', ...U }),
  plaguehulk: mob('Plague Hulk', 'abom', { hpM: 1.4, dmgM: 1.15, spd: 4.8, range: 2.8, weak: 'fire', scale: 1.1, ...U }),
  ashwraith: mob('Ashwraith', 'wraith', { hpM: .9, range: 18, ranged: true, caster: true, school: 'shadow', weak: 'holy', resist: 'frost', fly: .4, ...U }),
  vharosghost: mob('Vharosi Shade', 'ghost', { hpM: .9, dmgM: 1.05, weak: 'holy', resist: 'frost', ...U }),
  // the blight's beasts
  blightwolf: mob('Blightwolf', 'wolf', { hpM: .95, dmgM: 1.05, spd: 6.6, weak: 'fire', resist: 'nature', scale: 1.15, aggro: 10, social: 8, ...B }),
  rotweaver: mob('Rotweaver', 'spider', { hpM: 1, dmgM: 1.05, spd: 6, weak: 'fire', resist: 'nature', scale: 1.2, aggro: 10, social: 8, ...B }),
  carrionwasp: mob('Carrion Wasp', 'wasp', { hpM: .75, dmgM: .95, spd: 6.8, weak: 'frost', resist: 'nature', fly: .9, aggro: 10, social: 6, ...B }),
  ashtroll: mob('Ashen Troll', 'troll', { hpM: 1.35, dmgM: 1.15, spd: 5.2, range: 2.8, weak: 'fire', resist: 'frost', scale: 1.15, aggro: 11, social: 10 }),
  // the Gravelord's Black Legion and his Deathsworn
  legionknight: mob('Black Legion Knight', 'guard', { hpM: 1.25, dmgM: 1.1, weak: 'holy', resist: 'shadow', ...HU }),
  legionbow: mob('Black Legion Crossbow', 'xbow', { hpM: .85, range: 22, ranged: true, weak: 'storm', resist: null, ...HU }),
  deathsworn: mob('Deathsworn Acolyte', 'cultist0', { hpM: .95, weak: 'holy', resist: 'shadow', ...HU }),
  deathcaller: mob('Deathsworn Caller', 'cultist1', { hpM: .85, range: 18, ranged: true, caster: true, healer: true, school: 'shadow', weak: 'holy', resist: 'shadow', ...HU }),
  boneguard: mob('Bone Golem', 'golempet', { hpM: 1.5, dmgM: 1.1, spd: 4.6, range: 2.8, weak: 'storm', resist: 'earth', scale: 1.3 }),
  cinder: mob('Cinder Elemental', 'firepet', { hpM: 1, dmgM: 1.1, weak: 'frost', resist: 'fire', scale: 1.1 }),
  witchroot: mob('Witchroot', 'treant', { hpM: 1.35, dmgM: 1.1, spd: 4.8, range: 2.8, weak: 'fire', resist: 'nature', scale: .95 }),
  blightspawn: mob('Blightspawn', 'ghoul', { hpM: 1.1, dmgM: 1.15, spd: 6, weak: 'fire', resist: 'nature', scale: 1.05, aggro: 14, social: 16, ...U }),
});
Object.assign(MOB_LORE, {
  bonewarden: 'A soldier of dead Vharos, still standing the watch he was given a hundred years ago.', blightghoul: 'A ghoul swollen with blight. It eats what the war left and is always hungry.',
  plaguehulk: 'Stitched from the war dead by the Gravelord\'s surgeons. Mostly arms.', ashwraith: 'The ash of a burned city, gathered into a shape that hates you specifically.',
  vharosghost: 'A citizen of Vharos who never noticed the city fell.', blightwolf: 'A wolf that has eaten blight for three generations. Its pups are born with green eyes.',
  rotweaver: 'A spider that webs the dead trees and waits.', carrionwasp: 'A wasp the size of a cat that lays its eggs in corpses. The wastes have a lot of corpses.',
  ashtroll: 'A troll grey with ash, too stubborn to die and too hungry to leave.', legionknight: 'A knight of the Black Legion: the living who sold their swords to the Gravelord for a promise of never dying.',
  legionbow: 'A Black Legion crossbowman.', deathsworn: 'A Deathsworn acolyte, who prays every night to be killed and raised.', deathcaller: 'A Deathsworn caller. Her chants heal the living and wake the dead, sometimes in the same breath.',
  boneguard: 'A golem of fused bone, built to guard the Gravelord\'s roads.', cinder: 'Living fire from the war-forges, still burning a century later.', witchroot: 'A tree that drank blight until it learned to walk.',
  blightspawn: 'What the blight storms rain down: the dead of the wastes, half-melted and furious.',
});

// ---------- the land ----------
const EMBER_GAP = Math.PI / 2;    // Emberwatch's gate faces north, into the wastes; a back gate faces the Vale
function wastesLand(x, z, N) {
  let h = 2 + N.fbm(x * .006, z * .006, 4) * 14 + (N.fbm(x * .03 + 5, z * .03, 2) - .5) * 3;
  // long ridges cut the wastes into bands
  h += Math.max(0, Math.sin(z * .012 + N.fbm(x * .004, z * .004, 2) * 4)) ** 6 * 10;
  return h;
}
const sm = t => t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t);
registerZone('wastes', seed => {
  const rng = mulberry32(seed + 1777), N = makeNoise(seed + 1777), pk = a => a[(rng() * a.length) | 0];
  world.water = null;
  world.names = { zone: 'The Blighted Wastes', town: 'Emberwatch', boss: 'The Gravelord' };
  const E = W7.ember, Rf = W7.refuge, Th = W7.throne;
  const pools = [];  // blight pools: low, green, and they hurt
  for (let i = 0; i < 34; i++) { const x = (rng() * 2 - 1) * (WH - 60), z = (rng() * 2 - 1) * (WH - 120); if (Math.hypot(x - E.x, z - E.z) < 90 || Math.hypot(x - Rf.x, z - Rf.z) < 50 || Math.abs(x) < 16) continue; pools.push({ x, z, r: 6 + rng() * 9 }); }
  world.blightPools = pools;
  for (let zi = 0; zi < HN; zi++) for (let xi = 0; xi < HN; xi++) {
    const x = xi - WH, z = zi - WH; let h = wastesLand(x, z, N);
    for (const p of pools) { const d = Math.hypot(x - p.x, z - p.z); if (d < p.r + 6) h = lerp(h - 1.6, h, sm((d - p.r) / 6)); }
    for (const t of [E, Rf]) h = lerp(t.base, h, sm((Math.hypot(x - t.x, z - t.z) - t.R - 3) / 22));
    for (const k of ['barrows', 'foundry', 'witchroot']) { const t = W7[k]; h = lerp(4, h, sm((Math.hypot(x - t.x, z - t.z) - t.R) / 20)); }
    h = lerp(6, h, sm((Math.hypot(x - Th.x, z - Th.z) - Th.R) / 30));
    // the road north from the Vale, through Emberwatch, to the Throne
    const roadX = Math.sin(z * .008) * 18; if (Math.abs(x - roadX) < 7) h = lerp(h, Math.min(h, 4 + N.fbm(x * .01, z * .01, 2) * 3), .6);
    const edge = Math.max(Math.abs(x), Math.abs(z)) - (WH - 26), southRoad = z > WH - 80 && Math.abs(x) < 12;
    if (edge > 0 && !southRoad) h += edge * edge * .08;
    H[zi * HN + xi] = h;
  }
  const ASH = new THREE.Color('#8a8478'), DUST = new THREE.Color('#a8987a'), BLIGHT = new THREE.Color('#5a7a3a'), POOL = new THREE.Color('#4aff6a'), ROCK = new THREE.Color('#6a6058'), COB = new THREE.Color('#8a8070'), ROAD = new THREE.Color('#6a5e50'), SCORCH = new THREE.Color('#3a3430');
  const colorAt = (x, z) => {
    const h = hgt(x, z); let c = ASH.clone().lerp(DUST, N.fbm(x * .02, z * .02, 2));
    c.lerp(BLIGHT, sm((N.fbm(x * .008 + 3, z * .008, 3) - .45) * 3) * .7);
    c.lerp(SCORCH, sm((N.fbm(x * .03 + 9, z * .03, 2) - .6) * 4) * .6);
    if (h > 12) c.lerp(ROCK, sm((h - 12) / 6));
    for (const p of pools) { const d = Math.hypot(x - p.x, z - p.z); if (d < p.r) c.lerp(POOL, .75 * (1 - d / p.r) + .2); }
    if (Math.abs(x - Math.sin(z * .008) * 18) < 5) c.lerp(ROAD, .5);
    for (const t of [E, Rf]) if (Math.hypot(x - t.x, z - t.z) < t.R - 1) c.lerp(COB, .55);
    if (Math.hypot(x - Th.x, z - Th.z) < Th.R) c.lerp(SCORCH, .5);
    const sh = .9 + N.n2(x * .3, z * .3) * .18; return new THREE.Color(c.r * sh, c.g * sh, c.b * sh);
  };
  groundMesh(colorAt);
  // ---------- the regions ----------
  world.regionNames = ['The Emberwatch March', 'The Ashfields', 'The Weeping Hills', 'The Witchroot', 'The Bone Barrens', 'The Hollow Throne'];
  world.regionFn = (x, z) => { if (Math.hypot(x - Th.x, z - Th.z) < 160 || z < -430) return 5; if (z > 240) return x < -150 ? 1 : x > 150 ? 2 : 0; if (z > 40) return x < -100 ? 1 : x > 100 ? 2 : 0; if (x > 60) return 3; return 4; };
  // ---------- Emberwatch: the last garrison of Corrand ----------
  const items = [], put = (geo, x, z, ry = 0, s = 1) => items.push({ geo, m: mat4(x, hgt(x, z), z, ry, s) });
  const solid = (x, z, w, d, ry = 0) => { const c = Math.cos(ry), s = Math.sin(ry), pt = (lx, lz) => [x + lx * c + lz * s, z - lx * s + lz * c]; const k = [pt(-w / 2, -d / 2), pt(w / 2, -d / 2), pt(w / 2, d / 2), pt(-w / 2, d / 2)]; for (let i = 0; i < 4; i++) addWall(k[i][0], k[i][1], k[(i + 1) % 4][0], k[(i + 1) % 4][1], .3); };
  { const Rr = E.R, nseg = 30, segLen = TAU * Rr / nseg + .3; const list = [];
    for (let k = 0; k < nseg; k++) { const a = k / nseg * TAU; if (Math.abs(((a - Math.PI * 1.5) % TAU + TAU) % TAU - 0) < .22 || Math.abs(a - Math.PI / 2) < .22) continue;
      list.push([E.x + Math.cos(a) * Rr, hgt(E.x + Math.cos(a) * Rr, E.z + Math.sin(a) * Rr), E.z + Math.sin(a) * Rr, -a - Math.PI / 2, 0, 0, 1]);
      const a1 = a - TAU / nseg / 2, a3 = a + TAU / nseg / 2; addWall(E.x + Math.cos(a1) * Rr, E.z + Math.sin(a1) * Rr, E.x + Math.cos(a3) * Rr, E.z + Math.sin(a3) * Rr, .9); }
    R.addInstanced(M.wallGeo('human', segLen), propMat, list, .04);
    for (const a of [.4, 1.2, 1.95, 2.75, 3.55, 4.35, 5.1, 5.9]) put(M.towerGeo('human'), E.x + Math.cos(a) * Rr, E.z + Math.sin(a) * Rr);
    put(M.keepGeo('human'), E.x + 14, E.z + 8, Math.PI, 1.2); solid(E.x + 14, E.z + 8, 7.5, 7.5, Math.PI);
    for (const [dx, dz, r, o] of [[-14, 10, .3, {}], [-18, -4, Math.PI / 2, { floors: 2, h: 5.4 }], [-8, 20, 0, {}], [16, -10, -Math.PI / 2, { stone: true, wall: '#8f897c', roof: '#4a4652' }], [4, 22, Math.PI, { w: 9, d: 6, floors: 2, h: 5.4, sign: '#c8782a' }]]) { put(houseGeo({ wall: '#cfc2a8', roof: '#5a3a3a', ...o }), E.x + dx, E.z + dz, r); solid(E.x + dx, E.z + dz, o.w || 6, o.d || 5, r); }
    for (const [dx, dz] of [[-6, -8], [6, -8], [-22, 8], [22, -2], [0, 14]]) put(build([P(T(Cyl(.08, .1, 4, 5), 0, 2), 0, O, '#3a3a40'), P(T(Box(1.2, 1.6, .05), .65, 3.1), 0, O, '#c0392b'), P(T(Box(.5, .5, .06), .65, 3.2), 0, O, '#ffcf6a', .8)]), E.x + dx, E.z + dz);
    for (const [dx, dz] of [[-4, -2], [4, 4], [-10, -14], [12, -18]]) put(build([P(T(Cyl(.08, .11, 3, 6), 0, 1.5), 0, O, '#2a2a30'), P(T(Box(.5, .55, .5), 0, 3.2), 0, O, '#ffcf6a', 1.8)]), E.x + dx, E.z + dz);
    world.doors.push({ x: E.x, z: E.z - Rr }, { x: E.x, z: E.z + Rr });
  }
  // Saint Orrin's Refuge: an abbey with a lamp that never goes out
  { put(M.keepGeo('human'), Rf.x - 6, Rf.z - 4, .3, .9); solid(Rf.x - 6, Rf.z - 4, 5.6, 5.6, .3);
    put(houseGeo({ wall: '#d8d2c4', roof: '#3a5a8a', w: 7, d: 5 }), Rf.x + 8, Rf.z + 4, -Math.PI / 2); solid(Rf.x + 8, Rf.z + 4, 7, 5, -Math.PI / 2);
    put(build([P(T(Box(.6, 3, .5), 0, 1.5), 0, O, '#d8d2c4'), P(T(Oct(.5), 0, 3.6), 0, O, '#fff2a0', 2.6)]), Rf.x + 2, Rf.z + 8);
    for (let k = 0; k < 16; k++) { const a = k / 16 * TAU; if (Math.abs(a - .1) < .3) continue; put(build([P(T(Box(.3, 1.6, .3), 0, .8), 0, O, '#6b4a2e')]), Rf.x + Math.cos(a) * Rf.R, Rf.z + Math.sin(a) * Rf.R); } }
  // the Hollow Throne: the ruined citadel of Vharos, and the rift in its heart
  { put(M.citadelGeo(Th.R * .7, 'necro'), Th.x, Th.z - 24, 0, 1.4); for (let k = 0; k < 18; k++) { const a = k / 18 * TAU; if (Math.abs(a - Math.PI / 2) < .3) continue; put(ruinWallGeo(TAU * Th.R / 18 + .4, 3 + rng() * 3), Th.x + Math.cos(a) * Th.R, Th.z + Math.sin(a) * Th.R, -a - Math.PI / 2); }
    for (let k = 0; k < 8; k++) { const a = k / 8 * TAU; put(pillarGeo(4 + rng() * 4), Th.x + Math.cos(a) * 18, Th.z + Math.sin(a) * 18); } }
  // open dungeons: barrow mounds, the foundry's furnaces, the witchroot grove
  { const B2 = W7.barrows; for (let i = 0; i < 9; i++) { const a = i / 9 * TAU + .3, d = 10 + rng() * 18; put(build([P(T(Sph(4, 10, 6, 0, TAU, 0, Math.PI / 2), 0, 0, 0, 0, 0, 0, 1.3, .7, 1), 0, O, '#6a6a52'), P(T(Box(1.6, 2, .4), 0, 1, 4.6), 0, O, '#0b0a0e'), ...[-1, 1].map(s => P(T(Box(.5, 2.4, .5), s * 1.1, 1.2, 4.7), 0, O, '#7a7468'))]), B2.x + Math.cos(a) * d, B2.z + Math.sin(a) * d, rng() * TAU); }
    for (let i = 0; i < 20; i++) put(VMhead(), B2.x + (rng() - .5) * 60, B2.z + (rng() - .5) * 60, rng() * TAU); }
  { const F = W7.foundry; for (const [dx, dz] of [[-12, -8], [10, -10], [0, 12], [-16, 10], [16, 8]]) { put(build([P(T(Cyl(3, 3.6, 7, 8), 0, 3.5), 0, O, '#4a4440'), P(T(Cyl(1, 1, 4, 6), 0, 9), 0, O, '#3a3430'), P(T(Box(1.6, 1.4, .5), 0, 1.2, 3.2), 0, O, '#ff6a1a', 2.2)]), F.x + dx, F.z + dz, rng() * TAU); addWall(F.x + dx - 3, F.z + dz, F.x + dx + 3, F.z + dz, 3, true); }
    for (let k = 0; k < 14; k++) { const a = k / 14 * TAU; if (Math.abs(a - Math.PI * 1.5) < .4) continue; put(ruinWallGeo(TAU * F.R / 14 + .4, 2.5 + rng() * 2.5), F.x + Math.cos(a) * F.R, F.z + Math.sin(a) * F.R, -a - Math.PI / 2); } }
  { const Wr = W7.witchroot; for (let i = 0; i < 40; i++) { const a = rng() * TAU, d = rng() * Wr.R; put(M.deadGeo(), Wr.x + Math.cos(a) * d, Wr.z + Math.sin(a) * d, rng() * TAU, 1.6 + rng() * 1.6); }
    put(build([P(T(Cyl(2.2, 3.4, 12, 8), 0, 6), 0, O, '#3a2a20'), ...[0, 1, 2, 3, 4].map(k => P(T(Cyl(.4, .8, 8, 5), Math.cos(k * 1.3) * 2, 11, Math.sin(k * 1.3) * 2, Math.cos(k) * .8, 0, Math.sin(k) * .8), 0, O, '#3a2a20')), P(T(Oct(.8), 0, 7, 2.4), 0, O, '#8aff5a', 2)]), Wr.x, Wr.z); addWall(Wr.x - 3, Wr.z, Wr.x + 3, Wr.z, 3, true); }
  // dungeon doors
  const door = (p, ry) => { put(build([P(T(Box(10, 9, 5), 0, 4.5, -1.5), 0, O, '#4a4652'), P(T(Box(4, 5.4, .6), 0, 2.7, 1.1), 0, O, '#0b0a0e'), ...[-2.6, 2.6].map(x => P(T(Box(.9, 6, .9), x, 3, 1.1), 0, O, '#3a3640')), P(T(Oct(.5), 0, 6.6, 1.3), 0, O, '#8aff5a', 1.8)]), p.x, p.z, ry); };
  door(W7.cathedral, Math.PI / 2); door(W7.gaol, 0); door(W7.ossuary, 0);
  meshWithOutline(mergeBuilt(items), .05);
  linkDoors();
  // ---------- places, towns, zone lines ----------
  world.places = [{ name: 'Emberwatch', x: E.x, z: E.z, R: E.R + 2, kind: 'town' }, { name: "Saint Orrin's Refuge", x: Rf.x, z: Rf.z, R: Rf.R + 4, kind: 'town' },
    { name: 'The Ashfield Barrows', x: W7.barrows.x, z: W7.barrows.z, R: W7.barrows.R, kind: 'dungeon' }, { name: 'The Weeping Foundry', x: W7.foundry.x, z: W7.foundry.z, R: W7.foundry.R, kind: 'dungeon' },
    { name: 'Witchroot Hollow', x: W7.witchroot.x, z: W7.witchroot.z, R: W7.witchroot.R, kind: 'dungeon' }, { name: 'The Bone Cathedral', x: W7.cathedral.x, z: W7.cathedral.z, R: 10, kind: 'dungeon' },
    { name: 'The Gaol of Kings', x: W7.gaol.x, z: W7.gaol.z, R: 10, kind: 'dungeon' }, { name: 'The Black Ossuary', x: W7.ossuary.x, z: W7.ossuary.z, R: 10, kind: 'dungeon' },
    { name: 'The Hollow Throne', x: Th.x, z: Th.z, R: Th.R, kind: 'dungeon' }];
  world.town = E;
  world.towns = [
    { key: 'ember', name: 'Emberwatch', x: E.x, z: E.z, R: E.R, guardName: 'Ember Guard', npcs: [['giver', 'vael', 0, 4], ['giver', 'pike', -6, -10], ['giver', 'wrenash', 8, -4], ['vendor', 'ember', -10, 4], ['bind', null, 2, -4], ['armory', null, 10, 12]], guards: [[2, -E.R + 3], [-2, -E.R + 3], [2, E.R - 3], [-2, E.R - 3], [E.R - 6, 0], [-E.R + 6, 0]] },
    { key: 'refuge', name: "Saint Orrin's Refuge", x: Rf.x, z: Rf.z, R: Rf.R, guardName: 'Orrinite Brother', npcs: [['giver', 'hesper', 2, 2], ['giver', 'cadwy', -4, 6], ['vendor', 'refuge', 6, -4], ['bind', null, 0, -2]], guards: [[Rf.R - 3, 2], [-Rf.R + 3, -2]] },
  ];
  world.mapLabels = [{ t: 'Bonewardens, wolves (15-16)', x: -40, z: 330 }, { t: 'Barrow dead (15-17)', x: -280, z: 230 }, { t: 'Legion, golems (16-18)', x: 260, z: 180 },
    { t: 'Witchroot, spiders (17-19)', x: 330, z: -10 }, { t: 'Shades, trolls (18-19)', x: -250, z: -170 }, { t: 'The Black Legion (19-20)', x: 0, z: -380 }];
  world.zoneLines.push({ x: 0, z: WH - 14, r: 9, to: 'vale', label: 'South to the Vale' }); zoneMarker(0, WH - 14, Math.PI);
  world.zoneLines.push({ x: W7.cathedral.x + 3, z: W7.cathedral.z, r: 3, to: 'cathedral', label: 'Enter the Bone Cathedral' }, { x: W7.gaol.x, z: W7.gaol.z + 3, r: 3, to: 'gaol', label: 'Enter the Gaol of Kings' },
    { x: W7.ossuary.x, z: W7.ossuary.z + 3, r: 3, to: 'ossuary', label: 'Enter the Black Ossuary' }, { x: Th.x, z: Th.z, r: 4, to: 'between', label: 'Step through the rift into Between Worlds (12-person raid)' });
  for (const [p, ry] of [[{ x: W7.cathedral.x + 4, z: W7.cathedral.z }, -Math.PI / 2], [{ x: W7.gaol.x, z: W7.gaol.z + 4 }, Math.PI], [{ x: W7.ossuary.x, z: W7.ossuary.z + 4 }, Math.PI]]) zoneMarker(p.x, p.z, ry);
  Object.assign(world.spots, { ember: { x: E.x, z: E.z }, refuge: { x: Rf.x, z: Rf.z }, barrows: { x: W7.barrows.x, z: W7.barrows.z }, foundry: { x: W7.foundry.x, z: W7.foundry.z }, witchroot: { x: W7.witchroot.x, z: W7.witchroot.z },
    cathedral: W7.cathedral, gaol: W7.gaol, ossuary: W7.ossuary, throne: { x: Th.x, z: Th.z + 14, r: 30 }, march: { x: 0, z: 320 }, ashfields: { x: -250, z: 250 }, hills: { x: 260, z: 160 }, witchwood: { x: 300, z: -60 }, barrens: { x: -250, z: -150 }, legion: { x: 0, z: -360 },
    proving: { x: E.x + 40, z: E.z - 40 } });
  world.clearSpots = [{ x: E.x, z: E.z, r: E.R + 10 }, { x: Rf.x, z: Rf.z, r: Rf.R + 8 }, ...['barrows', 'foundry', 'witchroot'].map(k => ({ x: W7[k].x, z: W7[k].z, r: W7[k].R + 4 })), { x: Th.x, z: Th.z, r: Th.R + 6 }, { x: W7.cathedral.x, z: W7.cathedral.z, r: 12 }, { x: W7.gaol.x, z: W7.gaol.z, r: 12 }, { x: W7.ossuary.x, z: W7.ossuary.z, r: 12 }];
  // ---------- spawns ----------
  const sp = world.spawns, put2 = o => sp.push({ ...o, y: hgt(o.x, o.z), alive: null, timer: 0 });
  const clear = p => !world.clearSpots.some(c => Math.hypot(c.x - p.x, c.z - p.z) < c.r + 8) && !(Math.abs(p.x - Math.sin(p.z * .008) * 18) < 10 && p.z > 300) && !pools.some(q => Math.hypot(q.x - p.x, q.z - p.z) < q.r + 2);
  const land = (x0, x1, z0, z1, min = 9) => { for (let i = 0; i < 300; i++) { const p = { x: x0 + rng() * (x1 - x0), z: z0 + rng() * (z1 - z0) }; if (clear(p) && hgt(p.x, p.z) < 16 && !sp.some(s => Math.hypot(s.x - p.x, s.z - p.z) < min)) return p; } return null; };
  const scatter = (n, box, mobs, lvl, area, resp = 70) => { for (let i = 0; i < n; i++) { const p = land(...box); if (p) put2({ ...p, mob: pk(mobs), lvl, respawn: resp, area }); } };
  const camp = (n, box, mobs, lvl, area, tag, kind = 'human') => { for (let i = 0; i < n; i++) { const p = land(...box, 30); if (!p) continue; world.camps.push({ x: p.x, z: p.z, kind }); if (kind === 'human') campVisual(p.x, hgt(p.x, p.z), p.z, 'human', rng);
    for (let k = 0; k < mobs.length; k++) { const a = k / mobs.length * TAU; put2({ x: p.x + Math.cos(a) * 3.5, z: p.z + Math.sin(a) * 3.5, mob: mobs[k], lvl, respawn: 80, camp: tag + i, area }); } } };
  scatter(34, [-200, 200, 240, 600], ['bonewarden', 'blightwolf', 'blightwolf', 'carrionwasp'], [15, 16], 0, 65);
  scatter(30, [-600, -150, 100, 600], ['bonewarden', 'blightghoul', 'vharosghost', 'carrionwasp'], [15, 17], 1);
  camp(5, [-600, -150, 100, 600], ['bonewarden', 'blightghoul', 'plaguehulk'], [16, 17], 1, 'af', 'undead');
  scatter(30, [150, 600, 60, 600], ['boneguard', 'cinder', 'blightwolf', 'ashtroll'], [16, 18], 2);
  camp(6, [150, 600, 60, 600], ['legionknight', 'legionbow', 'deathsworn', 'deathcaller'], [16, 18], 2, 'wh');
  scatter(34, [60, 600, -420, 40], ['witchroot', 'rotweaver', 'rotweaver', 'carrionwasp', 'ashtroll'], [17, 19], 3);
  camp(4, [60, 600, -420, 40], ['deathsworn', 'deathcaller', 'witchroot'], [17, 19], 3, 'wr');
  scatter(34, [-600, 60, -420, 100], ['vharosghost', 'ashwraith', 'ashtroll', 'plaguehulk', 'blightghoul'], [18, 19], 4);
  camp(5, [-600, 60, -420, 100], ['bonewarden', 'ashwraith', 'plaguehulk'], [18, 19], 4, 'bb', 'undead');
  camp(8, [-300, 300, -620, -300], ['legionknight', 'legionknight', 'legionbow', 'deathcaller'], [19, 20], 5, 'bl');
  scatter(16, [-300, 300, -620, -300], ['boneguard', 'ashwraith', 'plaguehulk'], [19, 20], 5);
  // open dungeons
  const dun = (key, packs, lvl, area, bosses) => { const D = W7[key];
    packs.forEach(([dx, dz, mobs], i) => mobs.forEach((m, k) => put2({ x: D.x + dx + (k % 2) * 2, z: D.z + dz + (k > 1 ? 2 : 0), mob: m, lvl, respawn: 300, camp: key + i, area, dungeon: true })));
    bosses.forEach(([dx, dz, m, L, fin]) => put2({ x: D.x + dx, z: D.z + dz, mob: m, lvl: [L, L], respawn: fin ? 1500 : 1100, named: m, area, dungeon: true, [fin ? 'boss' : 'boss2']: true })); };
  dun('barrows', [[-20, 0, ['bonewarden', 'blightghoul', 'bonewarden']], [20, 0, ['blightghoul', 'vharosghost', 'bonewarden']], [0, -20, ['bonewarden', 'plaguehulk']], [0, 20, ['vharosghost', 'vharosghost', 'blightghoul']], [-14, -14, ['bonewarden', 'bonewarden', 'vharosghost']], [14, 14, ['plaguehulk', 'blightghoul']]], [15, 16], 1,
    [[-24, -20, 'barrowking', 15], [24, -18, 'gravemoth', 15], [22, 22, 'mournwife', 16], [0, 0, 'oldkingaldous', 16, true]]);
  dun('foundry', [[-18, 0, ['boneguard', 'cinder']], [18, 0, ['cinder', 'deathsworn', 'cinder']], [0, -18, ['legionknight', 'deathcaller', 'legionbow']], [0, 20, ['boneguard', 'deathsworn', 'deathsworn']], [-14, 16, ['cinder', 'cinder', 'deathcaller']], [16, -14, ['legionknight', 'boneguard']]], [16, 17], 2,
    [[-22, -18, 'slagmaw', 16], [22, -20, 'bellowsjack', 16], [-22, 20, 'mistressanvil', 17], [0, 0, 'forgemasterkael', 17, true]]);
  dun('witchroot', [[-22, 0, ['witchroot', 'rotweaver', 'rotweaver']], [22, 0, ['rotweaver', 'witchroot']], [0, -22, ['deathsworn', 'deathcaller', 'witchroot']], [0, 22, ['rotweaver', 'rotweaver', 'carrionwasp']], [-16, -16, ['witchroot', 'deathcaller']], [16, 16, ['carrionwasp', 'carrionwasp', 'rotweaver']]], [17, 18], 3,
    [[-26, 18, 'mothergrub', 17], [26, 18, 'hollowmen', 17], [24, -24, 'sistersnare', 18], [0, -6, 'grandmotherroot', 18, true]]);
  // the Hollow Throne's guard: elites at the rift
  for (const [dx, dz, i] of [[-14, 18, 0], [14, 18, 1], [-20, 0, 2], [20, 0, 3]]) for (let k = 0; k < 3; k++) put2({ x: Th.x + dx + (k % 2) * 2, z: Th.z + dz + (k > 1 ? 2 : 0), mob: ['legionknight', 'deathcaller', 'legionknight'][k], lvl: [20, 20], respawn: 400, camp: 'ht' + i, area: 5, elite: true });
  // rares: two by day, two by night
  const rare = (box, m, L, night) => { const p = land(...box) || { x: (box[0] + box[1]) / 2, z: (box[2] + box[3]) / 2 }; put2({ ...p, mob: m, lvl: [L, L], respawn: 600, named: m, area: world.regionFn(p.x, p.z), when: night ? isNight : undefined }); };
  rare([-150, 150, 260, 560], 'greytooth', 16, false); rare([-560, -200, 120, 500], 'lanternless', 17, true); rare([200, 560, 80, 500], 'ironmaw', 18, false); rare([-560, 0, -400, 60], 'thepalequeen', 19, true);
  // blight storms: the dead rain down
  for (let i = 0; i < 30; i++) { const p = land(-560, 560, -560, 560, 14); if (p) put2({ ...p, mob: 'blightspawn', lvl: [Math.max(15, Math.min(20, Math.round(16 + (300 - p.z) / 200))), Math.max(15, Math.min(20, Math.round(17 + (300 - p.z) / 200)))], respawn: 25, area: world.regionFn(p.x, p.z), when: () => !!world.storm }); }
  world.huntAreas = [{ area: 0, lvl: [15, 16] }, { area: 1, lvl: [15, 17] }, { area: 2, lvl: [16, 18] }, { area: 3, lvl: [17, 19] }, { area: 4, lvl: [18, 19] }, { area: 5, lvl: [19, 20] }];
  // ---------- scenery ----------
  const dead = [], rocks = [], bones = [], tufts = [], tcol = [];
  for (let n = 0, nN = 26000 * (WH / 300) ** 2; n < nN; n++) {
    const x = (rng() * 2 - 1) * (WH - 10), z = (rng() * 2 - 1) * (WH - 10), h = hgt(x, z);
    if (world.clearSpots.some(c => Math.hypot(c.x - x, c.z - z) < c.r) || Math.abs(x - Math.sin(z * .008) * 18) < 6 || pools.some(q => Math.hypot(q.x - x, q.z - z) < q.r)) continue;
    const r = rng();
    if (r < .02) dead.push([x, h - .2, z, rng() * 6.3, 0, 0, 1 + rng() * 1.2]);
    else if (r < .04 || h > 13 && r < .1) rocks.push([x, h - .3, z, rng() * 6.3, 0, 0, .8 + rng() * 1.6]);
    else if (r < .05) bones.push([x, h - .05, z, rng() * 6.3, 0, 0, .7 + rng() * .6]);
    else if (r < .3) { tufts.push([x, h - .05, z, rng() * 6.3, 0, 0, .6 + rng() * .6]); tcol.push(new THREE.Color(.5, .55, .32)); }
  }
  addChunked(M.deadGeo(), propMat, dead, .04); addChunked(M.rockGeo('#7a7268', '#5a6a3a'), propMat, rocks, .04);
  addChunked(build([P(T(Sph(.2, 6, 5), 0, .15), 0, O, '#e8e0cc'), P(T(Cyl(.05, .05, .7, 4), .25, .05, .1, 0, 0, Math.PI / 2), 0, O, '#e8e0cc'), P(T(Cyl(.05, .05, .6, 4), -.2, .05, -.15, 0, .8, Math.PI / 2), 0, O, '#d8d0bc')]), propMat, bones, .02);
  { const gg = new THREE.PlaneGeometry(1, .75); gg.translate(0, .37, 0); const g2 = gg.clone().rotateY(Math.PI / 2), tuft = new THREE.BufferGeometry();
    for (const k of ['position', 'normal', 'uv']) tuft.setAttribute(k, new THREE.BufferAttribute(new Float32Array([...gg.attributes[k].array, ...g2.attributes[k].array]), gg.attributes[k].itemSize));
    tuft.setIndex([...gg.index.array, ...Array.from(g2.index.array, i => i + 4)]);
    addChunked(tuft, new THREE.MeshLambertMaterial({ map: grassTex, alphaTest: .45, side: THREE.DoubleSide }), tufts, 0, tcol, 50); }
  world.trees = dead.map(t => ({ x: t[0], z: t[2], r: .3 }));
  world.minimap = minimapFromLocal(colorAt);
  return world;
});
const VMhead = () => build([P(T(Box(.7, .95, .16), 0, .45, 0, 0, 0, .1), 0, O, '#6a6670'), P(T(Box(.5, .1, .1), 0, .7, .09), 0, O, '#5a5660')]);
function minimapFromLocal(colorAt) {
  const mm = document.createElement('canvas'); mm.width = mm.height = 200; const g = mm.getContext('2d'), img = g.createImageData(200, 200);
  for (let y = 0; y < 200; y++) for (let x = 0; x < 200; x++) { const wx = x * (2 * WH / 200) - WH, wz = y * (2 * WH / 200) - WH, c = colorAt(wx, wz), o = (y * 200 + x) * 4;
    img.data[o] = Math.min(255, c.r ** (1 / 2.2) * 255); img.data[o + 1] = Math.min(255, c.g ** (1 / 2.2) * 255); img.data[o + 2] = Math.min(255, c.b ** (1 / 2.2) * 255); img.data[o + 3] = 255; }
  g.putImageData(img, 0, 0); return mm;
}

// ---------- the bosses of the open dungeons, and the rares ----------
const boss = (name, kind, o) => ({ name, kind, hpM: 1.15, dmgM: 1.05, spd: 5.2, range: 2.8, weak: 'holy', resist: 'shadow', scale: 1.45, aggro: 15, social: 20, ...o });
Object.assign(MOBS, {
  barrowking: boss('The Barrow-King', 'skeleton', { ...U, mechs: ['cleave', 'call'], adds: 'bonewarden', lines: { start: 'I was crowned in this mound, and I will be crowned in it again. Kneel.', half: 'My guard! My guard!' } }),
  gravemoth: boss('Gravemoth', 'wasp', { ...B, scale: 2.4, fly: .9, mechs: ['pool', 'spawn'], adds: 'carrionwasp', lines: { start: '*Something huge and grey unfolds its wings over the barrows.*', half: '*Grubs pour out of the mounds.*' } }),
  mournwife: boss('The Mourning Wife', 'ghostnpc', { ...U, range: 18, ranged: true, caster: true, school: 'frost', resist: 'frost', mechs: ['fear', 'pool', 'heal'], lines: { start: 'He went to war and the war came home in a box. Why are YOU still breathing?', half: 'Weep with me!' } }),
  oldkingaldous: boss('Old King Aldous of Vharos', 'skeleton', { ...U, hpM: 1.7, scale: 1.7, mechs: ['cleave', 'slam', 'call', 'enrage'], adds: 'bonewarden', lines: { start: 'Vharos stands. Vharos has always stood. Who are you to tell a king his city has fallen?', half: 'To me, Vharos! To your king!' } }),
  slagmaw: boss('Slagmaw', 'golempet', { hpM: 1.3, scale: 2.2, weak: 'storm', resist: 'earth', mechs: ['slam', 'shield'], lines: { start: '*The slag heap stands up.*', half: '*Molten iron runs from its cracks.*' } }),
  bellowsjack: boss('Bellows-Jack', 'brute', { ...HU, mechs: ['knock', 'charge'], lines: { start: 'Pump, pump, PUMP! The forge must never go cold!', half: 'Hotter! HOTTER!' } }),
  mistressanvil: boss('Mistress Anvil', 'cultist2', { ...HU, range: 18, ranged: true, caster: true, school: 'fire', weak: 'frost', resist: 'fire', mechs: ['pool', 'volley', 'heal'], lines: { start: 'Every blade the Legion carries, I made. Every one of them remembers my name.', half: 'Quench them!' } }),
  forgemasterkael: boss('Forgemaster Kael', 'troll', { hpM: 1.7, scale: 1.8, weak: 'frost', resist: 'fire', mechs: ['cleave', 'pool', 'spawn', 'enrage'], adds: 'cinder', lines: { start: 'The Gravelord pays me in years. I have a lot of years. And I have a forge full of your death.', half: 'Feed the fires!' } }),
  mothergrub: boss('Mother Grub', 'spider', { ...B, scale: 2.4, weak: 'fire', resist: 'nature', mechs: ['web', 'spawn'], adds: 'rotweaver', lines: { start: '*The roots shiver. The web above you shivers back.*', half: '*Her egg sacs split.*' } }),
  hollowmen: boss('The Hollow Man', 'treant', { scale: 1.4, weak: 'fire', resist: 'nature', mechs: ['slam', 'knock', 'fear'], lines: { start: '*A tree with a face carved in it turns to look at you. The face is smiling.*', half: '*The smile gets wider.*' } }),
  sistersnare: boss('Sister Snare', 'cultist1', { ...HU, range: 18, ranged: true, caster: true, school: 'nature', weak: 'fire', resist: 'nature', mechs: ['web', 'pool', 'call'], adds: 'deathsworn', lines: { start: 'Grandmother sees you. Grandmother sees everything that walks on her roots.', half: 'Wake, sisters!' } }),
  grandmotherroot: boss('Grandmother Root', 'treant', { hpM: 1.75, scale: 2.2, weak: 'fire', resist: 'nature', mechs: ['slam', 'web', 'spawn', 'enrage'], adds: 'witchroot', lines: { start: 'I was a tree when Vharos was a village. I drank its dead, and I am still thirsty.', half: 'Children! Rise from the soil!' } }),
  greytooth: boss('Greytooth', 'wolf', { ...B, hpM: 1.6, scale: 1.9, spd: 6.6, weak: 'fire', resist: 'nature', mechs: ['charge', 'hounds'], adds: 'blightwolf' }),
  lanternless: boss('The Lanternless', 'ghostnpc', { ...U, hpM: 1.6, range: 18, ranged: true, caster: true, school: 'shadow', mechs: ['fear', 'pool'] }),
  ironmaw: boss('Ironmaw', 'troll', { hpM: 1.7, scale: 1.7, weak: 'fire', resist: 'frost', mechs: ['cleave', 'slam', 'enrage'] }),
  thepalequeen: boss('The Pale Queen of Vharos', 'ghostnpc', { ...U, hpM: 1.7, scale: 1.4, range: 18, ranged: true, caster: true, school: 'frost', resist: 'frost', mechs: ['pool', 'fear', 'call'], adds: 'vharosghost' }),
});
Object.assign(DBOSSES, { barrows: ['barrowking', 'gravemoth', 'mournwife', 'oldkingaldous'], foundry: ['slagmaw', 'bellowsjack', 'mistressanvil', 'forgemasterkael'], witchroot: ['mothergrub', 'hollowmen', 'sistersnare', 'grandmotherroot'] });
FINALS.push('oldkingaldous', 'forgemasterkael', 'grandmotherroot');

// ---------- blight storms and blight pools ----------
let stormT = 360 + Math.random() * 300, rain = null, poolT = 0;
X.tick.push(dt => {
  if (S.zone !== 'wastes') return;
  if ((stormT -= dt) <= 0) {
    world.storm = !world.storm; stormT = world.storm ? 150 + Math.random() * 60 : 540 + Math.random() * 360;
    chat('sys', null, world.storm ? 'The sky turns the green of a bruise. A blight storm is breaking, and the dead come down with the rain.' : 'The blight storm passes. The ground is still twitching.');
  }
  // the pools burn: a little, constantly, and it adds up
  if ((poolT -= dt) <= 0 && world.blightPools) { poolT = 1;
    for (const e of S.party) if (!e.dead && world.blightPools.some(p => Math.hypot(e.x - p.x, e.z - p.z) < p.r * .9)) { Cb.damage(e, e, e.maxHp * .03, 'poison', { noMiss: true }); Cb.buff(e, 'blighted', 4, { slow: .25 }, e); } }
});
X.light.push(dt => {
  const on = S.zone === 'wastes';
  if (!on) { if (rain && S.zone !== 'coast') rain.visible = false; return; }
  // the wastes are always a little grey and green; a storm turns them dark
  const k = world.storm ? 1 : .35;
  R.sun.intensity *= 1 - .35 * k; R.scene.fog.color.lerp(new THREE.Color('#5a6a4a'), .5 * k); R.scene.fog.far = 260 - 110 * k;
  R.skyMat.uniforms.top.value.lerp(new THREE.Color('#2a3a2a'), .7 * k); R.skyMat.uniforms.mid.value.lerp(new THREE.Color('#4a5a3a'), .6 * k); R.skyMat.uniforms.hor.value.lerp(new THREE.Color('#6a7a4a'), .6 * k);
  if (world.storm && !rain) { const N2 = 700, pos = new Float32Array(N2 * 6), g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); rain = new THREE.LineSegments(g, new THREE.LineBasicMaterial({ color: '#9aff6a', transparent: true, opacity: .4 })); rain.frustumCulled = false; scene.add(rain); rain.userData.seed = Array.from({ length: N2 }, () => [Math.random() * 60 - 30, Math.random() * 30, Math.random() * 60 - 30]); }
  if (!rain) return; rain.visible = !!world.storm; if (!rain.visible) return;
  const pos = rain.geometry.attributes.position, h = S.hero;
  rain.userData.seed.forEach((s, i) => { const y = (s[1] - S.time * 16 + 3000) % 30, x = h.x + s[0], z = h.z + s[2]; pos.setXYZ(i * 2, x, h.y + y, z); pos.setXYZ(i * 2 + 1, x - .1, h.y + y - 1, z); });
  pos.needsUpdate = true;
});
// the Hollow Throne's rift glows
let rift = null;
X.zone.push(() => { world.storm = false; });
X.zone.push(zone => {
  if (rift) { rift.parent?.remove(rift); rift = null; }
  if (zone !== 'wastes') return;
  rift = new THREE.Mesh(new THREE.TorusGeometry(3.2, .5, 8, 24), new THREE.MeshBasicMaterial({ color: '#8aff5a', transparent: true, opacity: .8 }));
  rift.position.set(W7.throne.x, hgt(W7.throne.x, W7.throne.z) + 3.6, W7.throne.z); worldGroup.add(rift);
  const core = new THREE.Mesh(new THREE.CircleGeometry(3, 24), new THREE.MeshBasicMaterial({ color: '#0a1a0a', side: THREE.DoubleSide })); rift.add(core);
});
X.light.push(dt => { if (rift) { rift.rotation.y += dt * .4; rift.material.opacity = .6 + Math.sin(S.time * 2) * .2; } });

// ---------- the instanced dungeons ----------
const lantern = () => build([P(T(Box(.12, 2.6, .12), 0, 1.3), 0, O, '#3a3a40'), P(T(Box(.4, .5, .4), 0, 2.7), 0, O, '#8aff5a', 1.6)]);
const pews = () => build([...[-1.2, 1.2].map(z => P(T(Box(3, .5, .6), 0, .45, z), 0, O, '#4a3a2a'))]);
const cage = () => build([P(T(Box(2.4, .2, 2.4), 0, .1), 0, O, '#3a3a40'), P(T(Box(2.4, .2, 2.4), 0, 3), 0, O, '#3a3a40'), ...[...Array(8).keys()].map(i => P(T(Box(.08, 2.8, .08), -1.1 + (i % 4) * .73, 1.5, i < 4 ? -1.1 : 1.1), 0, O, '#2a2a30'))]);
const bonepile = () => build([...[0, 1, 2, 3, 4, 5].map(k => P(T(Sph(.3 + (k % 3) * .1, 6, 5), Math.cos(k) * .8, .2 + (k % 2) * .2, Math.sin(k * 1.7) * .8), 0, O, k % 2 ? '#e8e0cc' : '#d8d0bc'))]);
registerZone('cathedral', seed => {
  world.names = { zone: 'The Bone Cathedral', town: 'the Bone Cathedral' };
  return buildInstance(seed, { name: 'The Bone Cathedral', floor: '#5a5450', rock: '#2a2622', walls: true, fog: '#14121a', light: .5, exitTo: 'wastes', exitLabel: 'Back out to the Bone Barrens',
    rects: [[-8, 52, 8, 74], [-3, 38, 3, 52], [-18, 6, 18, 38], [-4, -6, 4, 6], [-26, -50, 26, -6], [-44, -40, -26, -16], [26, -40, 44, -16], [-3, -62, 3, -50], [-20, -92, 20, -62]],
    doors: [[0, 52], [0, 38], [0, 6], [0, -6], [-26, -28], [26, -28], [0, -50], [0, -62]],
    props: [[-12, 30, pews], [12, 30, pews], [-12, 20, pews], [12, 20, pews], [-12, 12, pews], [12, 12, pews], [-20, -14, () => pillarGeo(6)], [20, -14, () => pillarGeo(6)], [-20, -42, () => pillarGeo(6)], [20, -42, () => pillarGeo(6)], [-5, 62, lantern], [5, 62, lantern], [-36, -28, bonepile], [36, -28, bonepile], [-14, -80, lantern], [14, -80, lantern]],
    packs: [[-4, 60, ['bonewarden', 'bonewarden'], [17, 17]], [-10, 28, ['deathsworn', 'deathcaller', 'bonewarden'], [17, 17]], [10, 16, ['bonewarden', 'ashwraith', 'deathsworn'], [17, 18]],
      [-16, -20, ['plaguehulk', 'deathcaller'], [18, 18]], [16, -20, ['bonewarden', 'bonewarden', 'ashwraith'], [18, 18]], [-38, -34, ['deathsworn', 'deathsworn', 'deathcaller'], [18, 18]], [38, -34, ['ashwraith', 'ashwraith', 'bonewarden'], [18, 18]], [-10, -40, ['plaguehulk', 'deathcaller', 'bonewarden'], [18, 18]]],
    bosses: [[0, 22, 'deaconbleak', 17], [-36, -24, 'choirmaster', 17], [36, -24, 'theflayed', 18], [0, -30, 'bishopmarrow', 18], [0, -80, 'archdeaconvesh', 18, true]] });
});
registerZone('gaol', seed => {
  world.names = { zone: 'The Gaol of Kings', town: 'the Gaol of Kings' };
  return buildInstance(seed, { name: 'The Gaol of Kings', floor: '#4a4a50', rock: '#22222a', walls: true, fog: '#10101a', light: .45, exitTo: 'wastes', exitLabel: 'Back out to the barrens',
    rects: [[-8, 52, 8, 74], [-3, 36, 3, 52], [-30, 18, 30, 36], [-46, -20, -30, 36], [30, -20, 46, 36], [-30, -38, 30, -20], [-3, -50, 3, -38], [-22, -86, 22, -50]],
    doors: [[0, 52], [0, 36], [-30, 26], [30, 26], [-38, -20], [38, -20], [0, -38], [0, -50]],
    props: [[-20, 30, cage], [-10, 30, cage], [10, 30, cage], [20, 30, cage], [-38, 10, cage], [-38, -4, cage], [38, 10, cage], [38, -4, cage], [-20, -30, cage], [20, -30, cage], [-5, 62, lantern], [5, 62, lantern], [-12, -76, lantern], [12, -76, lantern]],
    packs: [[-4, 60, ['legionknight', 'legionbow'], [18, 18]], [-14, 24, ['legionknight', 'deathcaller', 'legionbow'], [18, 18]], [14, 24, ['vharosghost', 'vharosghost', 'ashwraith'], [18, 18]],
      [-38, 20, ['legionknight', 'legionknight'], [18, 19]], [38, 20, ['ashwraith', 'vharosghost', 'legionbow'], [18, 19]], [-38, -12, ['plaguehulk', 'deathcaller'], [19, 19]], [38, -12, ['legionknight', 'legionbow', 'deathcaller'], [19, 19]], [-12, -28, ['vharosghost', 'ashwraith', 'vharosghost'], [19, 19]], [12, -28, ['legionknight', 'legionknight', 'deathcaller'], [19, 19]]],
    bosses: [[0, 28, 'turnkey', 18], [-38, 4, 'hangedprince', 18], [38, 4, 'warlordbrask', 19], [0, -30, 'queenmisrule', 19], [0, -70, 'gaolerking', 19, true]] });
});
registerZone('ossuary', seed => {
  world.names = { zone: 'The Black Ossuary', town: 'the Black Ossuary' };
  return buildInstance(seed, { name: 'The Black Ossuary', floor: '#3a3438', rock: '#181418', walls: false, fog: '#0c0a0e', light: .42, exitTo: 'wastes', exitLabel: 'Back out to the Hollow Throne road',
    rects: [[-8, 52, 8, 74], [-4, 34, 4, 52], [-28, 4, 14, 34], [14, 14, 40, 24], [40, -16, 66, 36], [48, -40, 56, -16], [14, -76, 66, -40], [-8, -62, 14, -54], [-50, -90, -8, -30]],
    doors: [[0, 52], [0, 34], [14, 19], [40, 19], [52, -16], [52, -40], [14, -58], [-8, -58]],
    props: [[-20, 24, bonepile], [8, 10, bonepile], [54, 30, bonepile], [60, 0, bonepile], [30, -60, bonepile], [-4, 62, lantern], [-22, 28, lantern], [58, 32, lantern], [40, -66, lantern], [-30, -70, lantern], [-40, -40, () => pillarGeo(7)], [-18, -40, () => pillarGeo(7)]],
    packs: [[-3, 62, ['legionknight', 'deathcaller'], [19, 19]], [-18, 26, ['boneguard', 'deathsworn', 'deathsworn'], [19, 19]], [2, 12, ['ashwraith', 'legionknight', 'legionbow'], [19, 19]],
      [46, 30, ['legionknight', 'legionknight', 'deathcaller'], [19, 20]], [60, 12, ['boneguard', 'ashwraith'], [19, 20]], [44, -6, ['plaguehulk', 'deathcaller', 'deathsworn'], [20, 20]],
      [26, -48, ['legionknight', 'legionbow', 'deathcaller'], [20, 20]], [60, -66, ['boneguard', 'boneguard'], [20, 20]], [-20, -40, ['ashwraith', 'ashwraith', 'deathcaller'], [20, 20]], [-40, -56, ['legionknight', 'legionknight', 'deathcaller'], [20, 20]]],
    bosses: [[-16, 14, 'marrowsmith', 19], [54, 6, 'thetithe', 19], [40, -60, 'lordvanthe', 20], [-30, -50, 'thehollowtwins', 20], [-28, -80, 'gravelordshand', 20, true]] });
});
Object.assign(MOBS, {
  deaconbleak: boss('Deacon Bleak', 'cultist1', { ...HU, range: 18, ranged: true, caster: true, school: 'shadow', mechs: ['pool', 'heal'], lines: { start: 'Welcome, pilgrims. The service is about to begin, and you are the sacrament.', half: 'Brothers! Sing!' } }),
  choirmaster: boss('The Choirmaster', 'wraith', { ...U, fly: .4, range: 18, ranged: true, caster: true, school: 'shadow', mechs: ['fear', 'volley'], lines: { start: '*A thousand voices start singing a hymn with no words.*', half: '*The hymn becomes a scream.*' } }),
  theflayed: boss('The Flayed Saint', 'abom', { ...U, scale: 1.6, mechs: ['cleave', 'pool', 'enrage'], lines: { start: 'They took my skin for the cathedral doors. I would like it back.', half: 'Give it BACK!' } }),
  bishopmarrow: boss('Bishop Marrow', 'priest', { ...HU, range: 18, ranged: true, caster: true, school: 'holy', weak: 'shadow', resist: 'holy', mechs: ['heal', 'shield', 'call'], adds: 'deathsworn', lines: { start: 'The Four are dead, child. I watched them die. The Gravelord is the only god left.', half: 'Faithful, defend your bishop!' } }),
  archdeaconvesh: boss('Archdeacon Vesh', 'gravelord', { ...HU, hpM: 1.75, scale: 1.5, range: 18, ranged: true, caster: true, school: 'shadow', mechs: ['pool', 'spawn', 'fear', 'enrage'], adds: 'bonewarden', lines: { start: 'I built this cathedral from the bones of a kingdom, and I will add yours to the altar.', half: 'Rise, congregation! RISE!' } }),
  turnkey: boss('The Turnkey', 'brute', { ...HU, mechs: ['knock', 'web', 'cleave'], lines: { start: 'Nobody leaves the Gaol. Nobody. Not even the dead. Especially the dead.', half: 'Lock-down! LOCK-DOWN!' } }),
  hangedprince: boss('The Hanged Prince', 'ghostnpc', { ...U, range: 18, ranged: true, caster: true, school: 'frost', resist: 'frost', mechs: ['fear', 'pool', 'charge'], lines: { start: 'My brother hanged me for a crown. Then the Gravelord hanged my brother. Now there is nobody to hang but you.', half: 'The rope! Feel the rope!' } }),
  warlordbrask: boss('Warlord Brask', 'troll', { scale: 1.6, mechs: ['cleave', 'charge', 'call'], adds: 'legionknight', lines: { start: 'Brask was a prisoner here. Then Brask was the warden. Brask likes being the warden better.', half: 'Legion! To Brask!' } }),
  queenmisrule: boss('Queen Misrule', 'cultist2', { ...HU, range: 18, ranged: true, caster: true, school: 'shadow', mechs: ['heal', 'fear', 'volley'], lines: { start: 'Every king in this gaol bowed to me eventually. You will too.', half: 'Off with their heads!' } }),
  gaolerking: boss('The Gaoler-King', 'guard', { ...HU, hpM: 1.75, scale: 1.8, mechs: ['cleave', 'slam', 'call', 'enrage'], adds: 'legionknight', lines: { start: 'Kings, princes, queens: I kept them all. The Gravelord gave me the keys to Vharos, and I will give him yours.', half: 'Release the prisoners!' } }),
  marrowsmith: boss('The Marrowsmith', 'abom', { ...U, scale: 1.6, mechs: ['slam', 'spawn'], adds: 'boneguard', lines: { start: '*Bone grinds on bone. Something is building something.*', half: '*It pulls a golem out of the pile, half-finished.*' } }),
  thetithe: boss('The Tithe', 'wraith', { ...U, fly: .4, range: 18, ranged: true, caster: true, school: 'shadow', mechs: ['pool', 'fear', 'heal'], lines: { start: 'Every soul in the wastes pays the Tithe. Yours is overdue.', half: 'Collect!' } }),
  lordvanthe: boss('Lord Vanthe of the Black Legion', 'guard', { ...HU, scale: 1.6, mechs: ['cleave', 'charge', 'shield', 'call'], adds: 'legionbow', lines: { start: 'I swore my sword to a man who cannot die. What did you swear yours to?', half: 'Legion! Hold the line!' } }),
  thehollowtwins: boss('The Hollow Twins', 'ghostnpc', { ...U, scale: 1.4, range: 18, ranged: true, caster: true, school: 'frost', mechs: ['pool', 'volley', 'heal'], lines: { start: 'We were born in the same hour. We died in the same hour. We will kill you in the same hour.', half: 'Sister! Brother!' } }),
  gravelordshand: boss("The Gravelord's Hand", 'gravelord', { ...HU, hpM: 1.8, scale: 1.6, range: 18, ranged: true, caster: true, school: 'shadow', mechs: ['pool', 'spawn', 'fear', 'enrage'], adds: 'ashwraith', lines: { start: 'He sees through my eyes. Wave to him. He is watching you right now, and he is smiling.', half: 'Master! They are at the door!' } }),
});
Object.assign(DBOSSES, { cathedral: ['deaconbleak', 'choirmaster', 'theflayed', 'bishopmarrow', 'archdeaconvesh'], gaol: ['turnkey', 'hangedprince', 'warlordbrask', 'queenmisrule', 'gaolerking'], ossuary: ['marrowsmith', 'thetithe', 'lordvanthe', 'thehollowtwins', 'gravelordshand'] });
FINALS.push('archdeaconvesh', 'gaolerking', 'gravelordshand');
