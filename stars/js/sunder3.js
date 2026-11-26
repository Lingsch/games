// Stars Beneath, Build 3: Sunder, a desert trade world (levels 6-10). The smuggler's second world.
// Saltmarket sits on a dry seabed in the south. The Salt Flats ring it, Wellhead Nine pumps water to the west,
// the Glassworks mine lies east, the Ochre Syndicate taxes the caravan road, the Bonefields bleach in the north-west,
// and the Dry Dock, a hull the size of a town, holds the Syndicate's broker in the north.
import * as THREE from './three.js';
import { S, WH, TAU, lerp, mulberry32, makeNoise, chat, X } from './core.js';
import { addChunked, propMat, worldGroup, addKinds } from './render.js';
import * as R from './render.js';
import * as M from './models.js';
import { build, P, T, Cone, Cyl, Box, Dod, Sph, Oct } from './models.js';
import { H, HN, hgt, world, addWall, linkDoors, mergeBuilt, mat4, meshWithOutline, registerZone, ZONE_SIZE } from './world.js';
import { groundMesh } from './zones.js';
import { MOBS, QUESTS, GIVERS, xpNeed, CLASSES } from './data.js';
import { MOB_LORE, TALK } from './dialogue.js';
import { LORE } from './story.js';
import { LFG_D } from './social6.js';
import * as Loot5 from './loot5.js';
import * as Game from './game.js';
import * as Cb from './combat.js';
import { habGeo, domeGeo, lampGeo, crateGeo, mastGeo, shipGeo, minimapFrom } from './moon1.js';
import { sfig } from './models3.js';
import { SYSTEMS, CREW, PADS } from './ship1.js';
const O = [0, 0, 0], LR = [1, -1];
ZONE_SIZE.sunder = 320;

export const D3 = {
  town: { x: 0, z: 205, R: 34, base: 3 },         // Saltmarket
  pad: { x: 74, z: 212, R: 16 },                  // the landing field
  well: { x: -180, z: 95, R: 14 },                // Wellhead Nine
  glass: { x: 215, z: 30, R: 40 },                // the Glassworks (open dungeon, 7-8)
  toll: { x: -110, z: -30, R: 16 },               // the Syndicate's big toll post
  bones: { x: -215, z: -150, R: 60 },             // the Bonefields
  dock: { x: 20, z: -225, R: 44 },                // the Dry Dock (open dungeon, 9-10)
};

PADS.sunder = { x: D3.pad.x, z: D3.pad.z + 17 };

// ---------- models ----------
const pal = (a, b, t, g) => ({ a, b, t, g }), HUM = [.6, .4, 1.6, .15], HEAVY = [.55, .4, 1.9, .15], STILL = [0, 0, 0, 0];
const OCH = pal('#b8862a', '#3a2e22', '#2a2e34', '#ffcf6a');
const speederGeo = (c = '#a83a2a') => build([P(T(Box(.5, .3, 2.2), 0, .9, 0), 0, O, c), P(T(Cone(.3, .9, 5), 0, .9, 1.5, Math.PI / 2), 0, O, c), P(T(Box(.44, .14, .7), 0, 1.1, -.2), 0, O, '#2a2420'),
  P(T(Box(1.1, .06, .5), 0, .95, 1.0), 0, O, '#3a3f46'), ...LR.map(s => P(T(Box(.1, .5, .9), .5 * s, .8, -.8, 0, 0, .3 * s), 0, O, '#3a3f46')), P(T(Cyl(.2, .26, .5, 8), 0, .9, -1.3, Math.PI / 2), 0, O, '#4a5058'), P(T(Cyl(.17, .17, .06, 8), 0, .9, -1.58, Math.PI / 2), 0, O, '#6ad8ff', 2.6),
  P(T(Box(.7, .05, .06), 0, 1.3, .6), 0, O, '#1c2026'), P(T(Box(.3, .04, 1.4), 0, .7, .1), 0, O, '#6ad8ff', 1.2)]);
const pumpGeo = () => build([P(T(Cyl(.5, .6, 1.2, 8), 0, .6), 0, O, '#5a6a72'), P(T(Cyl(.12, .12, 2.6, 6), 0, 1.9), 0, O, '#3a3f46'), P(T(Box(1.8, .16, .2), .5, 3.0, 0, 0, 0, -.2), 0, O, '#c8782a'), P(T(Box(.3, .5, .3), 1.3, 2.6), 0, O, '#3a3f46'), P(T(Box(.3, .2, .06), 0, .9, .52), 0, O, '#6ad8ff', 1.8)]);
addKinds({
  syn0: [sfig({ body: 'armor', head: 'visor', r: 'baton', l: null }, OCH, 1), HEAVY, .05, .035],
  syn1: [sfig({ body: 'coat', head: 'visor', r: 'rifle', l: null, bandolier: true }, OCH, 2), HUM, .05, .03],
  syn2: [sfig({ body: 'suit', vest: true, head: 'headset', r: 'injector', l: 'medkit' }, pal('#d8c8a0', '#b8862a', '#2a2e34', '#ffcf6a'), 0), HUM, .05, .03],
  syn3: [sfig({ body: 'armor', heavy: true, head: 'helmet', r: 'cannon', l: null, pack: true, coils: true }, OCH, 3), HEAVY, .05, .04],
  syn_kade: [sfig({ body: 'coat', head: 'hat', r: 'pistol', l: 'slate', scarf: '#e8e2d0', hair: '#e8e2d0' }, pal('#e8e2d0', '#b8862a', '#2a2e34', '#ffcf6a'), 3), HUM, .05, .035],
  n_beck: [sfig({ body: 'suit', vest: true, head: 'cap', r: null, l: 'slate' }, pal('#2e6a6a', '#1e3a3a', '#e8e2d0', '#6ad8ff'), 2), HUM, .05, .03],
  n_hesk: [sfig({ body: 'coat', head: 'bare', tail: true, r: null, l: null, scarf: '#a83a2a', hair: '#8a8a8a' }, pal('#3a4a6a', '#22283a', '#d8b24a', '#ffcf6a'), 1), HUM, .05, .03],
  n_tamm: [sfig({ body: 'armor', head: 'hat', r: 'pistol', l: null }, pal('#6a5a4a', '#3a322a', '#d8dce4', '#ffcf6a'), 0), HEAVY, .05, .035],
  n_maren: [sfig({ body: 'coat', head: 'visor', r: null, l: 'slate', hair: '#e8e2d0' }, pal('#4a3a5a', '#2a2232', '#c8a25a', '#bfe6ff'), 3), HUM, .05, .03],
  n_tobin: [sfig({ body: 'suit', knee: true, head: 'hat', r: 'wrench', l: null }, pal('#6a8a9a', '#3a4a52', '#e8a03a', '#6ad8ff'), 2), HUM, .05, .03],
  n_brick: [sfig({ body: 'armor', heavy: true, head: 'bald', r: 'maul', l: null }, pal('#6a6058', '#34302c', '#b8862a', '#ffcf6a'), 2), HEAVY, .05, .04],
  speeder: [speederGeo(), STILL, 0, .03], speeder2: [speederGeo('#3a5a8a'), STILL, 0, .03], pump: [pumpGeo(), STILL, 0, .03],
});
Object.assign(Loot5.COLLECT, { mount_speeder: { type: 'mount', name: "Tobin's Old Speeder", kind: 'speeder', spd: .7, ride: .55, from: 'quest' } });
X.crewMount = 'speeder2';

// ---------- enemies ----------
const mob = (name, kind, o) => ({ name, kind, hpM: 1, dmgM: 1, spd: 5.4, range: 2.4, weak: 'frost', resist: null, scale: 1, aggro: 10, social: 9, ...o });
const BE = { beast: true }, HU = { human: true };
Object.assign(MOBS, {
  strider: mob('Salt Strider', 'bear', { hpM: .9, dmgM: .9, spd: 6, scale: 1.05, ...BE }),
  crawler: mob('Dune Crawler', 'spider', { hpM: .85, dmgM: .9, weak: 'fire', resist: 'earth', scale: 1.05, ...BE }),
  kite: mob('Carrion Kite', 'wasp', { hpM: .75, dmgM: .95, spd: 6.8, fly: 1.1, scale: 1.4, aggro: 9, social: 6, ...BE }),
  mdrone: mob('Mining Drone', 'sdrone', { hpM: .85, dmgM: .9, range: 16, ranged: true, fly: .5, weak: 'storm', resist: 'poison', social: 10 }),
  excavator: mob('Runaway Excavator', 'golempet', { hpM: 1.2, dmgM: .95, spd: 4.6, range: 2.8, weak: 'storm', resist: 'earth', scale: 1.15, social: 10 }),
  synthug: mob('Syndicate Enforcer', 'syn0', { hpM: 1, dmgM: 1, weak: 'storm', aggro: 12, social: 13, ...HU }),
  syngun: mob('Syndicate Gun', 'syn1', { hpM: .85, dmgM: 1, range: 22, ranged: true, weak: 'storm', aggro: 13, social: 13, ...HU }),
  synmed: mob('Syndicate Fixer', 'syn2', { hpM: .85, dmgM: .8, range: 16, ranged: true, caster: true, healer: true, school: 'storm', weak: 'fire', aggro: 12, social: 13, ...HU }),
  synheavy: mob('Syndicate Heavy', 'syn3', { hpM: 1.3, dmgM: 1.1, range: 18, ranged: true, weak: 'frost', resist: 'fire', aggro: 13, social: 13, scale: 1.08, ...HU }),
});
const boss = (name, kind, o) => ({ name, kind, hpM: 1.2, dmgM: 1.05, spd: 5.2, range: 2.8, weak: 'storm', resist: null, scale: 1.35, aggro: 14, social: 18, ...o });
Object.assign(MOBS, {
  duneking: boss('The Dune King', 'bear', { ...BE, scale: 1.7, weak: 'frost', mechs: ['cleave', 'call'], adds: 'strider', lines: { start: '*A strider twice the size of the rest lifts its plated head out of the dune and looks at you the way a landlord looks at a late tenant.*', half: '*It bellows. The dunes answer.*' } }),
  silk: boss('Silk Marrow', 'syn2', { ...HU, scale: 1.15, range: 16, ranged: true, caster: true, school: 'poison', weak: 'fire', mechs: ['pool', 'heal'], lines: { start: "A bounty? On me? Darling, I've poisoned better collectors than you, and I sent flowers after.", half: 'One moment. I do have something for this.' } }),
  foreman7: boss('Foreman Unit Seven', 'golempet', { hpM: 1.5, scale: 1.6, resist: 'earth', mechs: ['slam', 'spawn', 'enrage'], adds: 'mdrone', lines: { start: 'SHIFT QUOTA NOT MET. WORKERS WILL REMAIN ON SHIFT. YOU ARE NOW A WORKER.', half: 'REQUESTING ADDITIONAL LABOR.', enrage: 'OVERTIME AUTHORIZED.' } }),
  jor: boss('Twice-Paid Jor', 'brute', { ...HU, scale: 1.25, mechs: ['cleave', 'slam'], lines: { start: "Kade pays me to stand here. You could pay me to stand somewhere else. No? Pity. I do like being paid twice.", half: "This is coming out of somebody's wages!" } }),
  thresher: boss('The Thresher', 'treant', { ...BE, hpM: 1.6, scale: 2.2, weak: 'fire', resist: 'earth', mechs: ['slam', 'pool', 'enrage'], lines: { start: '*The bones shift. What you took for a ribcage turns out to have been a mouth.*', half: '*It thrashes, and the whole field moves with it.*' } }),
  kade: boss('Sevrin Kade, the Broker', 'syn_kade', { ...HU, hpM: 1.7, scale: 1.25, range: 18, ranged: true, mechs: ['pool', 'call', 'fear', 'enrage'], adds: 'synheavy', lines: { start: "Captain. Do sit. No? Then I'll be brief. That chart is worth more than this world, and I have already sold it. I only need to collect it from your ship.", half: 'Heavies. Earn your percentage.', enrage: "Do you know what the Empire does to a broker who fails to deliver? I do. I am not going to find out." } }),
});
Object.assign(MOB_LORE, {
  strider: 'A plated, six-legged grazer of the salt, as tall as a cargo skiff and far less patient.', crawler: 'It buries itself to the eyes and waits for something warm to walk across the dune.',
  kite: 'A leathery glider with a hooked beak. It follows caravans for days, on the sound theory that something will eventually fall behind.', mdrone: 'A Glassworks cutting drone. The mine closed four years ago. Nobody told the drones.',
  excavator: 'A walking excavator with its work order stuck on DIG. It has been digging the same hole for four years.', synthug: 'Muscle for the Ochre Syndicate, which sells protection, water and, for a fee, the absence of both.',
  syngun: 'A Syndicate rifle. They are paid per shot fired, and it shows.', synmed: 'The Syndicate keeps its people standing with fixers: half medic, half accountant.', synheavy: 'A Syndicate heavy in sealed plate with a repeater cannon. The Syndicate rents them out by the hour.',
  duneking: 'The oldest strider on the flats. Caravan masters route a full day around its dune rather than argue.', silk: 'Silk Marrow sold medicines in Saltmarket for ten years before anybody thought to test them.',
  foreman7: 'The Glassworks\' shift foreman, still enforcing a quota for a company that no longer exists.', jor: 'He guards the Dry Dock for Kade, and reports on Kade to somebody else. Nobody is sure who. Jor may not be sure either.',
  thresher: 'Something that lives under the Bonefields and made them. The bones are what it leaves.', kade: 'Sevrin Kade brokers everything the Ochre Syndicate sells: water, silence and, lately, a very old star chart.',
});

// ---------- the land ----------
const sm = t => t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t);
const roadX = z => Math.sin(z * .011) * 22 - 20 * sm((60 - z) / 200);
registerZone('sunder', seed => {
  const rng = mulberry32(seed + 9191), N = makeNoise(seed + 9191), pk = a => a[(rng() * a.length) | 0];
  world.water = null;
  world.names = { zone: 'Sunder', town: 'Saltmarket', boss: 'Sevrin Kade', ruin: 'the Dry Dock', wood: 'the Bonefields', fields: 'the Salt Flats', waste: 'the Glassworks', road: 'the Caravan Road', captain: 'Twice-Paid Jor', tusk: 'the Thresher' };
  const Tn = D3.town, Pad = D3.pad, Wl = D3.well, Gl = D3.glass, Tp = D3.toll, Dk = D3.dock;
  for (let zi = 0; zi < HN; zi++) for (let xi = 0; xi < HN; xi++) {
    const x = xi - WH, z = zi - WH;
    // a flat seabed in the south, rolling dunes north of it, and mesas where the noise runs high
    let dune = N.fbm(x * .012, z * .012, 3) * 9 + Math.abs(Math.sin(x * .03 + N.fbm(x * .006, z * .006, 2) * 6)) * 3;
    let h = 2.5 + dune * sm((150 - z) / 130) + N.fbm(x * .05, z * .05, 2) * .8;
    const mesa = sm((N.fbm(x * .006 + 11, z * .006 + 4, 3) - .62) * 12); h += mesa * 11 * sm((120 - z) / 80);
    for (const t of [Tn, Pad]) h = lerp(Tn.base, h, sm((Math.hypot(x - t.x, z - t.z) - t.R - 2) / 18));
    h = lerp(3.4, h, sm((Math.hypot(x - Wl.x, z - Wl.z) - Wl.R) / 14)); h = lerp(1.5, h, sm((Math.hypot(x - Gl.x, z - Gl.z) - Gl.R) / 22));
    h = lerp(4, h, sm((Math.hypot(x - Tp.x, z - Tp.z) - Tp.R) / 12)); h = lerp(3.2, h, sm((Math.hypot(x - Dk.x, z - Dk.z) - Dk.R) / 24));
    if (Math.abs(x - roadX(z)) < 7 && z > -190 && z < 175) h = lerp(h, Math.min(h, 3.6 + N.fbm(x * .01, z * .01, 2) * 2), .7);
    const edge = Math.max(Math.abs(x), Math.abs(z)) - (WH - 24); if (edge > 0) h += edge * edge * .1;
    H[zi * HN + xi] = h;
  }
  const SALT = new THREE.Color('#e8e0cc'), SAND = new THREE.Color('#d8b47a'), OCHRE = new THREE.Color('#c88a4a'), ROCK = new THREE.Color('#9a6a4a'), GLASS = new THREE.Color('#6a9a9a'), BONE = new THREE.Color('#d8d0b8'), PAVE = new THREE.Color('#8a8478'), ROAD = new THREE.Color('#a8906a'), PADC = new THREE.Color('#4a4e54'), RUSTC = new THREE.Color('#6a4a3a');
  const colorAt = (x, z) => {
    const h = hgt(x, z); let c = SAND.clone().lerp(OCHRE, N.fbm(x * .014, z * .014, 3));
    c.lerp(SALT, sm((z - 90) / 70) * .75 + sm((N.fbm(x * .02 + 3, z * .02, 2) - .6) * 5) * .3);
    if (h > 12) c.lerp(ROCK, sm((h - 12) / 5));
    const dg = Math.hypot(x - Gl.x, z - Gl.z); if (dg < Gl.R + 20) c.lerp(GLASS, sm(1 - dg / (Gl.R + 20)) * .6);
    const db = Math.hypot(x - D3.bones.x, z - D3.bones.z); if (db < D3.bones.R + 30) c.lerp(BONE, sm(1 - db / (D3.bones.R + 30)) * .5);
    const dd = Math.hypot(x - Dk.x, z - Dk.z); if (dd < Dk.R) c.lerp(RUSTC, .45);
    if (Math.abs(x - roadX(z)) < 4.5 && z > -190 && z < 175) c.lerp(ROAD, .55);
    if (Math.hypot(x - Tn.x, z - Tn.z) < Tn.R - 1) c.lerp(PAVE, .6);
    const dp = Math.hypot(x - Pad.x, z - Pad.z); if (dp < Pad.R) { c.lerp(PADC, .85); if (Math.abs(dp - Pad.R + 1.5) < .6) c.lerp(new THREE.Color('#e8b83a'), .8); }
    const sh = .9 + N.n2(x * .3, z * .3) * .16; return new THREE.Color(c.r * sh, c.g * sh, c.b * sh);
  };
  groundMesh(colorAt);
  world.regionNames = ['The Salt Flats', 'The Glassworks', 'The Caravan Road', 'The Bonefields', 'The Dry Dock'];
  world.regionFn = (x, z) => Math.hypot(x - Dk.x, z - Dk.z) < 100 || z < -170 ? 4 : Math.hypot(x - Gl.x, z - Gl.z) < 90 ? 1 : x < -110 && z < 10 ? 3 : z < 70 ? 2 : 0;

  // ---------- Saltmarket ----------
  const items = [], put = (geo, x, z, ry = 0, s = 1) => items.push({ geo, m: mat4(x, hgt(x, z), z, ry, s) });
  const solid = (x, z, w, d, ry = 0) => { const c = Math.cos(ry), s = Math.sin(ry), pt = (lx, lz) => [x + lx * c + lz * s, z - lx * s + lz * c]; const k = [pt(-w / 2, -d / 2), pt(w / 2, -d / 2), pt(w / 2, d / 2), pt(-w / 2, d / 2)]; for (let i = 0; i < 4; i++) addWall(k[i][0], k[i][1], k[(i + 1) % 4][0], k[(i + 1) % 4][1], .3); };
  const round = (x, z, r) => { for (let k = 0; k < 8; k++) { const a = k / 8 * TAU, b = (k + 1) / 8 * TAU; addWall(x + Math.cos(a) * r, z + Math.sin(a) * r, x + Math.cos(b) * r, z + Math.sin(b) * r, .3); } };
  const stall = c => build([P(T(Box(3.2, .9, 1.3), 0, .45), 0, O, '#6a5a4a'), P(T(Box(3.8, .1, 2.4), 0, 2.6, .3, .12), 0, O, c), ...LR.map(s => P(T(Cyl(.06, .06, 2.6, 4), 1.6 * s, 1.3, .9), 0, O, '#3a3f46')), P(T(Box(.5, .4, .5), -.8, 1.1), 0, O, '#c8782a'), P(T(Sph(.24, 6, 5), .6, 1.15), 0, O, '#8dffef', .8)]);
  const tower = () => build([P(T(Sph(3, 12, 8), 0, 9, 0, 0, 0, 0, 1, .8, 1), 0, O, '#a8b0b8'), ...[0, 1, 2, 3].map(k => P(T(Cyl(.2, .26, 8, 5), Math.cos(k * TAU / 4 + .8) * 2, 4, Math.sin(k * TAU / 4 + .8) * 2), 0, O, '#5a5e64')), P(T(Box(1.6, .5, .1), 0, 9, 3), 0, O, '#6ad8ff', 1.6)]);
  for (const [dx, dz, ry, w, d, col, trim] of [[-16, -12, 0, 11, 6, '#d8c8a8', '#a83a2a'], [14, -14, 0, 9, 6, '#c8b898', '#2e5a9e'], [-22, 8, Math.PI / 2, 8, 5, '#b8a888', '#b8862a'], [20, 6, -Math.PI / 2, 8, 6, '#d0c0a0', '#3a6a5a'], [-6, 22, Math.PI, 7, 5, '#c8b898', '#5a8a4a'], [8, 24, Math.PI, 6, 4.5, '#b8a888', '#8a3a6a']]) { put(habGeo(w, d, col, trim), Tn.x + dx, Tn.z + dz, ry); solid(Tn.x + dx, Tn.z + dz, w, d, ry); }
  for (const [dx, dz, r] of [[-28, -6, 3.4], [27, -8, 3.2], [2, -26, 3.8]]) { put(domeGeo(r, '#e8e0cc'), Tn.x + dx, Tn.z + dz, rng() * TAU); round(Tn.x + dx, Tn.z + dz, r - .3); }
  put(tower(), Tn.x - 2, Tn.z + 4); solid(Tn.x - 2, Tn.z + 4, 4.4, 4.4);
  for (const [dx, dz, c, ry] of [[-8, -3, '#a83a2a', 0], [-2, -8, '#2e5a9e', .3], [6, -4, '#b8862a', -.2], [9, 5, '#5a8a4a', 1.6], [-10, 8, '#8a3a6a', -1.5], [3, 13, '#d8dce4', 3.1]]) put(stall(c), Tn.x + dx, Tn.z + dz, ry);
  for (const [dx, dz] of [[-12, -6], [12, -8], [-4, 14], [14, 14], [-16, 2], [28, 6], [38, 8], [50, 8]]) put(lampGeo(), Tn.x + dx, Tn.z + dz);
  put(mastGeo(), Tn.x + 24, Tn.z - 20);
  put(shipGeo(), Pad.x, Pad.z, Math.PI); solid(Pad.x, Pad.z - 1, 9, 13);
  put(shipGeo('#6a5a4a', '#2e5a9e'), Pad.x + 34, Pad.z - 4, 2.4, .9); solid(Pad.x + 34, Pad.z - 4, 11, 11);
  // Wellhead Nine
  put(habGeo(8, 5, '#c8c0a8', '#3a6a9a'), Wl.x, Wl.z - 5, 0); solid(Wl.x, Wl.z - 5, 8, 5); put(tower(), Wl.x + 8, Wl.z + 4, 0, .7); solid(Wl.x + 8, Wl.z + 4, 3.2, 3.2);
  // the Glassworks: cut pits, gantries and slag
  for (let k = 0; k < 9; k++) { const a = k / 9 * TAU; put(build([P(T(Box(1, 9, 1), 0, 4.5), 0, O, '#5a5e64'), P(T(Box(9, .8, 1), 4, 8.6), 0, O, '#c8782a'), P(T(Box(.3, 4, .3), 8, 6.4), 0, O, '#3a3f46'), P(T(Oct(.5), 8, 4.2), 0, O, '#8dffef', 2)]), Gl.x + Math.cos(a) * (Gl.R - 6), Gl.z + Math.sin(a) * (Gl.R - 6), -a + Math.PI); }
  for (let i = 0; i < 30; i++) { const a = rng() * TAU, d = rng() * Gl.R; put(build([P(T(Cone(.8, 2.6, 5), 0, 1.3), 0, O, '#8ac8c0'), P(T(Cone(.5, 1.7, 5), .7, .8, .3, 0, 0, -.4), 0, O, '#b8e8e0', .4)]), Gl.x + Math.cos(a) * d, Gl.z + Math.sin(a) * d, rng() * TAU, .7 + rng() * 1.2); }
  put(habGeo(7, 5, '#8a9098', '#c8782a'), Gl.x - 8, Gl.z - 16, .4); solid(Gl.x - 8, Gl.z - 16, 7, 5, .4);
  // the toll post: a barricade across the road
  for (const dx of [-9, -5, 5, 9]) put(build([P(T(Box(3.4, 1.6, .8), 0, .8), 0, O, '#5a5048'), P(T(Box(3.5, .3, .9), 0, 1.2), 0, O, '#b8862a')]), Tp.x + dx, Tp.z, .1 * dx);
  put(build([P(T(Cyl(.2, .26, 7, 5), 0, 3.5), 0, O, '#3a3f46'), P(T(Box(2.6, 1.6, .1), 1.4, 6), 0, O, '#b8862a'), P(T(Oct(.4), 1.4, 6, .1), 0, O, '#2a2e34')]), Tp.x - 12, Tp.z + 2);
  // the Bonefields: ribs as tall as a house
  for (let i = 0; i < 26; i++) { const a = rng() * TAU, d = rng() * (D3.bones.R + 10), s = 1 + rng() * 2; put(build([P(T(new THREE.TorusGeometry(3, .28, 5, 10, Math.PI), 0, 0, 0), 0, O, '#e8e0cc'), P(T(new THREE.TorusGeometry(3, .28, 5, 10, Math.PI), 0, 0, 2.4), 0, O, '#d8d0b8'), P(T(Cyl(.3, .3, 6, 5), 0, .2, 1.2, Math.PI / 2), 0, O, '#c8c0a8')]), D3.bones.x + Math.cos(a) * d, D3.bones.z + Math.sin(a) * d, rng() * TAU, s); }
  // the Dry Dock: a freighter hull the size of a town, propped on gantries and never finished
  put(shipGeo('#6a5a50', '#b8862a'), Dk.x, Dk.z - 8, 0, 5.2);
  for (const [dx, dz, w] of [[-34, 10, 24], [34, 10, 24], [-36, -30, 20], [36, -30, 20]]) { put(build([P(T(Box(1.2, 16, 1.2), 0, 8), 0, O, '#4a4e54'), P(T(Box(w, 1, 1.4), 0, 15.6), 0, O, '#c8782a')]), Dk.x + dx, Dk.z + dz, Math.PI / 2); solid(Dk.x + dx, Dk.z + dz, 1.4, 1.4); }
  for (let i = 0; i < 14; i++) put(crateGeo(), Dk.x + (rng() - .5) * 70, Dk.z + 26 + rng() * 14, rng() * TAU, 1.2 + rng());
  meshWithOutline(mergeBuilt(items), .05);
  linkDoors();
  // two pale suns' worth of glare: one big, one small
  { const g = new THREE.Group(); g.position.set(260, 420, -700); g.add(new THREE.Mesh(new THREE.SphereGeometry(60, 20, 14), new THREE.MeshBasicMaterial({ color: '#fff4d8', fog: false }))); const s2 = new THREE.Mesh(new THREE.SphereGeometry(22, 16, 10), new THREE.MeshBasicMaterial({ color: '#ffd0a0', fog: false })); s2.position.set(-170, -60, 0); g.add(s2); worldGroup.add(g); }

  world.places = [{ name: 'Saltmarket', x: Tn.x, z: Tn.z, R: Tn.R + 2, kind: 'town' }, { name: 'The Landing Field', x: Pad.x, z: Pad.z, R: Pad.R, kind: 'town' }, { name: 'Wellhead Nine', x: Wl.x, z: Wl.z, R: Wl.R + 2, kind: 'town' },
    { name: 'The Glassworks', x: Gl.x, z: Gl.z, R: Gl.R, kind: 'dungeon' }, { name: 'The Syndicate Toll Post', x: Tp.x, z: Tp.z, R: Tp.R, kind: 'camp' }, { name: 'The Bonefields', x: D3.bones.x, z: D3.bones.z, R: D3.bones.R, kind: 'camp' }, { name: 'The Dry Dock', x: Dk.x, z: Dk.z, R: Dk.R, kind: 'dungeon' }];
  world.town = Tn;
  world.towns = [
    { key: 'saltmarket', name: 'Saltmarket', x: Tn.x, z: Tn.z, R: Tn.R, guardName: 'Ledger Deputy', npcs: [['giver', 'beck', 12, -9], ['giver', 'hesk', -14, -7], ['giver', 'tamm', -19, 8], ['vendor', 'salt', -6, 17], ['bind', null, 6, 8]], guards: [[-4, -Tn.R + 4], [4, -Tn.R + 4], [Tn.R - 4, 6], [-Tn.R + 5, -2], [0, 12]] },
    { key: 'well', name: 'Wellhead Nine', x: Wl.x, z: Wl.z, R: Wl.R, guardName: 'Wellhand', npcs: [['giver', 'tobin', 1, 1]], guards: [[5, 6], [-5, 5]] },
  ];
  world.storyNpcs.push({ key: 'maren', x: Gl.x - 6, z: Gl.z - 11, yaw: 2.6, unless: ['marenfree', '*'] }, { key: 'maren', x: Tn.x + 16, z: Tn.z + 9, yaw: -1.6, when: ['marenfree', '*'] },
    { key: 'brick', x: Tn.x - 11, z: Tn.z - 1, yaw: 1.2, when: ['marenfree', '*'], unless: ['crew2', '*'] });
  world.mapLabels = [{ t: 'Striders, crawlers (6-7)', x: -40, z: 130 }, { t: 'Drones, excavators (7-8)', x: 215, z: 80 }, { t: 'The Syndicate (7-9)', x: -100, z: 10 }, { t: 'Bonefield beasts (8-9)', x: -215, z: -110 }, { t: 'The Broker (9-10)', x: 20, z: -170 }];
  world.zoneLines.push({ x: Pad.x, z: Pad.z + 11, r: 2.6, to: 'ship', label: 'Board the Second Chance' });
  Object.assign(world.spots, { town: { x: Tn.x, z: Tn.z }, pad: { x: Pad.x, z: Pad.z }, flats: { x: -30, z: 120 }, well: { x: Wl.x, z: Wl.z }, glass: { x: Gl.x, z: Gl.z }, toll: { x: Tp.x, z: Tp.z }, road: { x: -60, z: 20 }, bones: { x: D3.bones.x, z: D3.bones.z }, dock: { x: Dk.x, z: Dk.z + 34, r: 30 }, dockdeep: { x: Dk.x, z: Dk.z - 10 } });
  world.clearSpots = [{ x: Tn.x, z: Tn.z, r: Tn.R + 28 }, { x: Pad.x, z: Pad.z, r: Pad.R + 30 }, { x: Wl.x, z: Wl.z, r: Wl.R + 8 }, { x: Gl.x, z: Gl.z, r: Gl.R + 4 }, { x: Tp.x, z: Tp.z, r: Tp.R + 2 }, { x: Dk.x, z: Dk.z, r: Dk.R + 6 }];
  const prop = (kind, tag, name, x, z, o = {}) => world.props.push({ id: 's' + world.props.length, kind, tag, name, x, z, yaw: o.yaw ?? rng() * TAU, lore: o.lore || null, scale: o.scale || 1, when: o.when, unless: o.unless });
  for (let i = 0; i < 8; i++) { const a = i / 8 * TAU + rng() * .5, d = 30 + rng() * 50; prop('pump', 'pump', 'Dry wellhead pump', Wl.x + Math.cos(a) * d, Wl.z + Math.sin(a) * d); }
  prop('cage', 'lockup', 'Shift lockup', Gl.x - 6, Gl.z - 11, { yaw: 0, unless: ['marenfree', '*'] });
  prop('crate', 'lore', "Kade's order book", Dk.x + 8, Dk.z - 14, { lore: 'kadebook', yaw: 1 });
  prop('console', 'lore', 'The Glassworks shift log', Gl.x + 10, Gl.z + 6, { lore: 'glasslog', yaw: 2.2 });

  // ---------- spawns ----------
  const sp = world.spawns, put2 = o => sp.push({ ...o, y: hgt(o.x, o.z), alive: null, timer: 0 });
  const clear = p => !world.clearSpots.some(c => Math.hypot(c.x - p.x, c.z - p.z) < c.r) && !(Math.abs(p.x - roadX(p.z)) < 9 && p.z > -190 && p.z < 175);
  const land = (x0, x1, z0, z1, min = 10) => { for (let i = 0; i < 300; i++) { const p = { x: x0 + rng() * (x1 - x0), z: z0 + rng() * (z1 - z0) }; if (clear(p) && hgt(p.x, p.z) < 12 && !sp.some(s => Math.hypot(s.x - p.x, s.z - p.z) < min)) return p; } return null; };
  const scatter = (n, box, mobs, lvl, area, o = {}) => { for (let i = 0; i < n; i++) { const p = land(...box, o.min || 13); if (p) put2({ ...p, mob: pk(mobs), lvl, respawn: 60, area, ...o }); } };
  const camp = (n, box, mobs, lvl, area, tag) => { for (let i = 0; i < n; i++) { const p = land(...box, 32); if (!p) continue; world.camps.push({ x: p.x, z: p.z, kind: 'bandit' });
    for (let k = 0; k < mobs.length; k++) { const a = k / mobs.length * TAU; put2({ x: p.x + Math.cos(a) * 3, z: p.z + Math.sin(a) * 3, mob: mobs[k], lvl, respawn: 85, camp: tag + i, area, solo: true }); } } };
  const group = (c, list, lvl, area, tag, o = {}) => list.forEach(([dx, dz, mobs], i) => mobs.forEach((m, k) => put2({ x: c.x + dx + (k % 2) * 2.2, z: c.z + dz + (k > 1 ? 2.2 : 0), mob: m, lvl, respawn: 240, camp: tag + i, area, solo: true, ...o })));
  scatter(40, [-290, 200, 100, 290], ['strider', 'crawler', 'crawler', 'kite'], [6, 7], 0, { solo: true });
  scatter(16, [-290, -120, 20, 180], ['kite', 'kite', 'crawler'], [6, 7], 0, { solo: true });
  scatter(22, [130, 300, -60, 130], ['mdrone', 'mdrone', 'excavator', 'crawler'], [7, 8], 1, { solo: true });
  group(Gl, [[-22, 14, ['mdrone', 'mdrone', 'excavator']], [20, 16, ['excavator', 'mdrone']], [-18, -24, ['mdrone', 'excavator', 'mdrone']], [22, -18, ['excavator', 'excavator']], [0, 26, ['mdrone', 'mdrone', 'mdrone']]], [7, 8], 1, 'gl', { dungeon: true });
  put2({ x: Gl.x + 2, z: Gl.z - 2, mob: 'foreman7', lvl: [8, 8], respawn: 1100, named: 'foreman7', area: 1, dungeon: true, boss: true });
  camp(8, [-240, 110, -150, 80], ['synthug', 'syngun'], [7, 8], 2, 'sy');
  camp(4, [-220, 100, -160, 60], ['synthug', 'syngun', 'synmed'], [8, 9], 2, 'sz');
  group(Tp, [[-8, 5, ['synthug', 'syngun', 'synthug']], [8, 5, ['syngun', 'synmed', 'synthug']], [0, -9, ['synheavy', 'syngun']]], [8, 8], 2, 'tp');
  scatter(26, [-300, -130, -250, -40], ['strider', 'strider', 'kite', 'crawler'], [8, 9], 3, { solo: true });
  group(Dk, [[-18, 40, ['synthug', 'syngun', 'synmed']], [18, 38, ['synheavy', 'synthug']], [-26, 14, ['syngun', 'syngun', 'synthug']], [26, 12, ['synthug', 'synmed', 'synheavy']], [-10, -6, ['synheavy', 'syngun', 'synmed']], [14, -8, ['synthug', 'synthug', 'syngun']], [0, 18, ['synheavy', 'synheavy']]], [9, 10], 4, 'dk', { dungeon: true });
  put2({ x: Dk.x - 22, z: Dk.z + 26, mob: 'jor', lvl: [9, 9], respawn: 900, named: 'jor', area: 4, dungeon: true, boss2: true });
  put2({ x: Dk.x + 2, z: Dk.z - 22, mob: 'kade', lvl: [10, 10], respawn: 1400, named: 'kade', area: 4, dungeon: true, boss: true });
  { const p = land(-120, 60, 110, 170) || { x: -40, z: 140 }; put2({ ...p, mob: 'duneking', lvl: [7, 7], respawn: 600, named: 'duneking', area: 0 }); }
  { const p = land(-200, 0, -120, 20, 30) || { x: -150, z: -60 }; put2({ ...p, mob: 'silk', lvl: [8, 8], respawn: 600, named: 'silk', area: 2 }); put2({ x: p.x + 3, z: p.z + 2, mob: 'synthug', lvl: [8, 8], respawn: 600, camp: 'silk', area: 2, solo: true }); }
  put2({ x: D3.bones.x, z: D3.bones.z, mob: 'thresher', lvl: [9, 9], respawn: 900, named: 'thresher', area: 3 });
  world.huntAreas = [{ area: 0, lvl: [6, 7] }, { area: 1, lvl: [7, 8] }, { area: 2, lvl: [7, 9] }, { area: 3, lvl: [8, 9] }, { area: 4, lvl: [9, 10] }];

  const rocks = [], cacti = [], bones = [];
  for (let n = 0; n < 9000; n++) {
    const x = (rng() * 2 - 1) * (WH - 8), z = (rng() * 2 - 1) * (WH - 8), h = hgt(x, z);
    if (world.clearSpots.some(c => Math.hypot(c.x - x, c.z - z) < c.r - 16) || Math.abs(x - roadX(z)) < 6 && z > -190 && z < 175) continue;
    const r = rng();
    if (r < .04 || h > 12 && r < .2) rocks.push([x, h - .3, z, rng() * 6.3, 0, 0, .7 + rng() * 2]);
    else if (r < .06 && z < 120) cacti.push([x, h - .1, z, rng() * 6.3, 0, 0, .8 + rng()]);
    else if (r < .075) bones.push([x, h - .05, z, rng() * 6.3, 0, 0, .7 + rng() * .8]);
  }
  addChunked(M.rockGeo('#b88a5a', '#8a5a3a'), propMat, rocks, .04); addChunked(M.cactusGeo(), propMat, cacti, .04);
  addChunked(build([P(T(Sph(.2, 6, 5), 0, .15), 0, O, '#e8e0cc'), P(T(Cyl(.05, .05, .7, 4), .25, .05, .1, 0, 0, Math.PI / 2), 0, O, '#e8e0cc')]), propMat, bones, .02);
  world.trees = cacti.map(t => ({ x: t[0], z: t[2], r: .3 }));
  world.minimap = minimapFrom(colorAt);
  return world;
});
X.light.push(() => {
  if (S.zone !== 'sunder') return;
  const u = R.skyMat.uniforms; u.top.value.lerp(new THREE.Color('#3a6a9a'), .5); u.mid.value.lerp(new THREE.Color('#e8d8b8'), .5); u.hor.value.lerp(new THREE.Color('#fff0d0'), .6);
  R.scene.fog.color.lerp(new THREE.Color('#f0e0c0'), .55);
});

// ---------- people ----------
Object.assign(X.vend, { salt: 'Okafor Lune' });
Object.assign(GIVERS, {
  beck: { name: 'Harbormistress Beck Arroyo', title: 'Saltmarket landing field', model: 'n_beck' },
  hesk: { name: 'Captain Odile Hesk', title: "The Free Captains' Hall", model: 'n_hesk' },
  tamm: { name: 'Marshal Io Tamm', title: 'The Ledger · bounties', model: 'n_tamm' },
  maren: { name: 'Quill Maren', title: 'Navigator, retired', model: 'n_maren' },
  tobin: { name: 'Tobin Ashe', title: 'Wellhead Nine', model: 'n_tobin' },
  brick: { name: 'Brakka "Brick" Oduya', title: 'Enforcer, between employers', model: 'n_brick' },
});
Object.assign(TALK, {
  beck: { bio: "Beck Arroyo has run the Saltmarket landing field for twenty years and can tell you the tonnage of any ship by the sound it makes setting down. She does not take bribes. She takes 'expedited handling fees', which are itemized.",
    greet: ["Saltmarket field. You're on pad three, the dust covers are extra, and yes, I know whose ship that is.", "Everything that's bought or sold in six systems crosses my field sooner or later. Most of it even gets declared."],
    topics: [{ q: 'What is Sunder?', a: ["A dry seabed with a market on it. There's nothing here anybody wants except a crossroads, and it turns out a crossroads is worth more than gold.", "The free captains run the trade, the Ledger keeps what passes for law, and the Ochre Syndicate takes a cut of both. You'll meet all three before lunch."] },
      { q: 'Who is the Ochre Syndicate?', a: ["They started out selling water at the wellheads. Then they started selling the right to not have your wellhead burned. It's the same business, really, with better margins.", "Their broker is a man called Sevrin Kade. If something valuable changes hands on this world, Kade either arranged it or is very annoyed about it."] }] },
  hesk: { bio: "Odile Hesk flew cargo for forty years and now runs the Free Captains' Hall, which is a union, a bank, a bar and a standing argument. She knew Osric Vane well enough to have thrown him out of the Hall on three separate occasions.",
    greet: ["Osric's kin, flying Osric's ship. Sit down before you owe somebody money standing up.", "The Hall looks after its own. You're not ours yet, but you're flying a ship we remember, and that's a start."],
    topics: [{ q: 'How did you know Osric?', a: ["He hauled for the Hall for a decade. Best pilot I ever signed and the worst bookkeeper. He'd deliver a cargo through a blockade and then forget to invoice for it.", "He came through two years back asking after an old navigator. He wouldn't say why. He had that chart with him even then, I'd bet the Hall on it."] }] },
  tamm: { bio: "Io Tamm is the Marshal of the Ledger, Saltmarket's bounty office, where the law is whatever somebody has paid to have written down. She is scrupulously honest about this, which unsettles people.",
    greet: ["The Ledger's open. Every name in it is somebody's grievance with a price attached. Pick one you can live with.", "I don't decide who's guilty, Captain. I decide who's posted. Mostly those are the same people."],
    topics: [{ q: "Why hasn't the Ledger posted the Syndicate?", a: ["Because nobody's paid to. A bounty needs a sponsor, and everybody who could afford to sponsor Kade is already paying him.", "Bring me a reason the free captains will put money behind, and I'll write his name in the book myself. I've had the page ready for years."] }] },
  maren: { bio: "Quill Maren navigated by hand for sixty years, on ships whose cores had failed, by stars she kept in her head. She is nearly blind now, and reads charts through a visor that she says shows her less than her memory does.",
    greet: ["Come closer, I can't see you from there. Ah. You stand like him. Osric always stood as though the floor might move.", "I have forgotten more stars than the Republic has catalogued. Some of them, I'm told, have forgotten themselves."],
    topics: [{ q: 'What is the chart in my nav core?', a: ["It's a copy of a copy of a copy, made by hand each time, and the first hand was holding a pen two thousand years ago on a world that hadn't yet left the ground. Somebody drew the sky as they saw it from the old homeworld.", "And then somebody else, much later, went through it marking stars in red. I thought for forty years those were errors. Osric was the one who checked, and found that every red star is one that has since gone out. The chart was marked before they went."] },
      { q: 'How could anyone know that in advance?', a: ["That's the right question, and I have turned it over every night since he showed me. Either somebody could see what was coming, or somebody was told.", "The old words run 'when the last lamp falls'. I used to think it was a poem. I think now it may have been a schedule."] }] },
  tobin: { bio: "Tobin Ashe keeps Wellhead Nine pumping, which makes him the most important man on the flats and the most frequently threatened. He has refused to sell to the Syndicate eleven times and has the scorch marks on his pumphouse to prove it.",
    greet: ["Water's two credits a liter, the conversation's free, and the Syndicate can whistle. That's the whole price list.", "Mind the kites. They've learned that where there's a pump there's a man standing still."],
    topics: [{ q: "Why won't you sell to the Syndicate?", a: ["My grandmother sank this well with her own hands, and she didn't do it so some broker in a white coat could put a meter on it.", "Besides, the day there's only one seller of water on Sunder is the day the price becomes whatever you've got. I've seen that world. I walked out of it."] }] },
  brick: { bio: "Brakka Oduya, called Brick, broke heads for the Ochre Syndicate for nine years and kept a private tally of every one he regretted. The tally got long. He walked out of the Dry Dock one night with his maul and no plan, which he says is the most honest thing he ever did.",
    greet: ["You're the one Kade's got the whole Dock stirred up about. You're shorter than they said.", "I know what I am, Captain. I'm trying to be something else. It's slow going, and I'd take help."],
    topics: [{ q: 'Why did you leave the Syndicate?', a: ["Kade had me collect from a wellhead family. Nine years I'd done that sort of work and never looked at the faces. That day I looked.", "I put the money back on their table and walked out. Then I remembered I'd have to walk out of the Syndicate as well, and that's a longer walk."] }] },
  'vendor:salt': { bio: 'Okafor Lune sells everything from one stall and swears each item is the last of its kind. The stall has not been empty in thirty years.', greet: ["Last one in stock, friend, and I mean that as sincerely as I meant it yesterday.", "Medigel, cells, and advice. The advice is: buy two."], topics: [] },
});
Object.assign(LORE, {
  glasslog: { title: 'The Glassworks Shift Log', where: 'glass', text: "Final entry, four years old. 'Company's pulling out. Says the seam's exhausted. It isn't. What happened is the night shift cut into something under the glass: a chamber, smooth as a lens, with a star map set into the floor in lights. Nine of the lights were dark. Yesterday a tenth went out while we were looking at it, and that same evening the survey ship said Corrin's Star had dropped off its scopes. The company sealed the shaft and left the drones to guard it. I am leaving this where somebody might find it. The map is still down there.'" },
  kadebook: { title: "Kade's Order Book", where: 'dockdeep', text: "'Item: one star chart, hand-copied, pre-Republic, held in the nav core of the freighter Second Chance. Buyer: an Imperial office that does not appear on any list, signing itself only as the Lamplighters. Price: named by the seller, and accepted without argument, which has never once happened to me before. Note to self: a buyer who does not haggle is a buyer who intends not to pay. Second note: they asked whether the chart shows which star is next. I said I would find out. I would very much like to know why they do not already know.'" },
  chartread: { title: "Maren's Reading of the Chart", where: 'town', text: "'There are forty-one red stars on this chart. By my count, thirty-eight have gone dark, in the order they are numbered. The numbers run inward, like a spiral closing. The thirty-ninth is a border sun between the Republic and the Empire, with a garrison world beneath it that both of them claim. If the pattern holds, that star has perhaps a year. Two fleets are already circling it, each sure the other is to blame. And at the centre of the spiral, where the last number should be, the copyist has written no number at all. Only: home.'" },
});

// ---------- quests ----------
const qx = (lvl, f) => Math.round(xpNeed(lvl) * f * .36);
const SYN = ['synthug', 'syngun', 'synmed', 'synheavy'], Z = { zone: 'sunder' };
QUESTS.push(
  { id: 'su_k1', story: true, ...Z, giver: 'imre', turnTo: 'beck', lvl: 6, pre: 'sb_s10', name: 'A Reader of Old Charts', where: 'pad', xp: qx(6, .4), gold: 20, obj: { talk: true, what: 'Plot a jump to Sunder at the helm, and find Harbormistress Beck Arroyo on the Saltmarket landing field' },
    say: ["I've been thinking about that chart of yours, Captain, which is more than I ought to do about anything on my own station. You can't read it, and neither can your core. It's drawn the old way, by eye, from a sky nobody has stood under for two thousand years.", "There's one person I know of who still navigates like that. Quill Maren. She retired to Sunder, to Saltmarket, the dry market world two lanes out. Osric went looking for her before he died. Ask for her at the landing field, and ask Beck Arroyo, because Beck knows where everybody is and what they owe."],
    done: [['beck', "Quill Maren? You're the second Vane to stand on my field and ask me that. I'll tell you what I told the first one. She was here, and she's gone, and I'd dearly like to know where."], ['beck', "She owed the Ochre Syndicate for her medicine, and one morning her rooms were empty. That's how debts end on Sunder. Stay a while, Captain. Make yourself useful, and people here start remembering things."]] },
  { id: 'su_k2', story: true, ...Z, giver: 'beck', lvl: 6, pre: 'su_k1', name: 'Expedited Handling', where: 'flats', xp: qx(6, .7), gold: 16, obj: { kill: ['strider', 'crawler'], n: 10, what: 'Defeat 10 Salt Striders or Dune Crawlers on the Salt Flats around Saltmarket' },
    say: ["Here's how you make yourself useful. My cargo crawlers cross the flats to the field four times a day, and lately they've been arriving with pieces missing. Striders charge anything that moves, and the dune crawlers wait under the sand for anything that stops.", "Clear ten of them off the approaches. I'll waive your pad fees for the month, which I have never done for anybody, so kindly don't mention it to the other captains."],
    done: ["Ten down, and this morning's crawler came in with all six wheels. Your pad fees are waived. I've written 'handling irregularity' in the book, because nobody ever reads that column."] },
  { id: 'su_k3', story: true, ...Z, giver: 'hesk', lvl: 7, pre: 'su_k2', name: 'What the Syndicate Took', where: 'road', xp: qx(7, .7), gold: 20, obj: { collect: ['synthug', 'syngun'], item: 'Stolen Cargo Seal', chance: .6, n: 8, what: 'Recover 8 Stolen Cargo Seals from Syndicate Enforcers and Guns along the Caravan Road' },
    say: ["Beck says you're asking after Quill Maren. So am I. She kept the Hall's star tables for thirty years, and no captain here would fly a blind lane without her say-so. The Syndicate took her, and I can't prove it.", "What I can prove is cargo. Every crate that leaves this Hall carries a seal, and Kade's people have been lifting them off my caravans on the road north. Bring me eight seals off Syndicate bodies. With those in my hand, I can stand up in the Hall and call it theft instead of bad luck."],
    done: ["Eight seals, and every one of them ours. That's theft, plain, with my own stamp on it. The Hall will vote now. Forty years I've been trying to get those captains to agree on anything, and all it took was somebody stealing from them."] },
  { id: 'su_k4', story: true, ...Z, giver: 'hesk', turnTo: 'tamm', lvl: 7, pre: 'su_k3', name: 'A Matter for the Ledger', where: 'toll', xp: qx(7, .5), gold: 16, obj: { at: 'toll', r: 30, what: 'Scout the Syndicate toll post on the Caravan Road, then report to Marshal Io Tamm at the Ledger in Saltmarket' },
    say: ["The Hall has voted to sponsor a bounty, and that means the Ledger. Marshal Tamm will want to know what she's posting against, because she's careful, and careful is why she's still alive.", "Kade's people have thrown a barricade across the Caravan Road, north of here where it bends. Go and count heads at that toll post, {hero}. Then take the count to Tamm and tell her the Free Captains are paying."],
    done: [['tamm', "A barricade, a heavy with a repeater, and a toll on a public road. And the Free Captains' Hall is sponsoring. Do you know how long I've waited for somebody to walk in here and say that?"], ['tamm', "I'm opening a page on the Ochre Syndicate. It's a good page. I've had it ready for years, with the ink dry and the heading done, and nothing under it but hope."]] },
  { id: 'su_k5', story: true, ...Z, giver: 'tamm', lvl: 8, pre: 'su_k4', name: 'Posted', where: 'road', xp: qx(8, .8), gold: 30, obj: { kill: SYN, n: 14, what: 'Defeat 14 members of the Ochre Syndicate along the Caravan Road' },
    say: ["The posting's up. Every Syndicate enforcer, gun, fixer and heavy on the Caravan Road is worth a bounty as of this morning, paid by the Hall and stamped by me.", "Fourteen will tell Kade that Saltmarket has stopped being afraid of him. Take company, Captain. Their fixers patch the others up as fast as you knock them down, so put the fixers down first."],
    done: ["Fourteen, counted and stamped. One of them talked on the way in, which they generally do once the Syndicate stops answering. He says Kade keeps 'the old woman' working at the Glassworks, reading something for him. I think we've found your navigator."] },
  { id: 'su_k6', story: true, ...Z, giver: 'tamm', turnTo: 'maren', lvl: 8, pre: 'su_k5', name: 'The Night Shift', where: 'glass', xp: qx(8, .6), gold: 24, obj: { inspect: 'lockup', n: 1, what: 'Open the shift lockup in the Glassworks, east of the Caravan Road' },
    say: ["The Glassworks is the old mine east of the road. The company walked away from it four years ago and left the machines running, so it's drones and excavators all the way down, and none of them know the shift is over.", "Kade's been keeping Quill Maren in the shift lockup there, because nobody goes into the Glassworks who has a choice. You don't have a choice, I'm afraid. Go and bring her out."],
    done: [['maren', "Is that the door? Somebody's opened the door. You're not one of Kade's, they don't breathe like that. Come here where I can see you. Oh. Oh, you're his. You're Osric's."], ['maren', "He promised he'd send somebody if he couldn't come himself. I'd stopped believing it. Take me to Saltmarket, child. I'll walk, I'm not that old. And then we must talk about what is in your ship."]] },
  { id: 'su_k7', story: true, ...Z, giver: 'maren', lvl: 8, pre: 'su_k6', name: 'Instruments', where: 'glass', xp: qx(8, .8), gold: 30, gear: true, lore: 'glasslog', obj: { named: 'foreman7', n: 1, what: 'Defeat Foreman Unit Seven in the Glassworks and recover Maren\'s instruments' },
    say: ["I can read your chart, but not with my eyes, and not with this visor. I need my instruments: a brass ring-dial and a set of sighting glasses older than the Republic. Kade took them from me and gave them to that machine to hold.", "Foreman Unit Seven, it calls itself. It runs what's left of the Glassworks and it has my dial bolted inside its chest like a stolen heart. Take friends, {hero}. It doesn't tire and it doesn't bargain, and it has a great many drones."],
    done: ["My dial. Give it here. Yes. Yes, that's the nick in the rim from the Tarsis run. Now I can work. Leave the chart with me tonight. And find the big man in the market who keeps staring at his own hands. He walked out on Kade last month, and he knows the Dry Dock."] },
  { id: 'su_k8', story: true, ...Z, giver: 'maren', turnTo: 'brick', lvl: 9, pre: 'su_k7', name: 'A Man Between Employers', where: 'town', xp: qx(9, .3), gold: 10, obj: { talk: true, what: 'Find Brakka "Brick" Oduya in the Saltmarket market square' },
    say: ["Kade will come for the chart now that he knows I've seen it. He sold it before he ever had it, to somebody who does not take disappointment well. He'll want your ship, and he will send the whole Dry Dock to get it.", "So we go to him first. The man you want is Brakka Oduya. They call him Brick. He was Kade's best enforcer until his conscience caught up with him, and he's been sitting in the market ever since, waiting for somebody to give him a reason."],
    done: [['brick', "Maren sent you. She would. She's the only one in this town who talks to me as though I were a person, and she can't even see me properly."], ['brick', "You want the Dry Dock. I can draw it for you from memory, every gantry and every guard. I'll do better than that. I'll walk you in. I've a few things to say to Sevrin Kade, and I'd like to say them with a maul."]] },
  { id: 'su_k9', story: true, ...Z, giver: 'brick', turnTo: 'maren', lvl: 10, pre: 'su_k8', name: 'The Broker', where: 'dockdeep', xp: qx(10, 1), gold: 60, gear: true, lore: 'chartread', obj: { named: 'kade', n: 1, what: 'Defeat Sevrin Kade, the Broker, in the Dry Dock, then return to Quill Maren in Saltmarket' },
    say: ["The Dry Dock's north, at the end of the Caravan Road. It's a freighter hull the size of a town that the Syndicate never finished building, and Kade runs his whole business out of its belly. He'll have heavies on every gantry, and Twice-Paid Jor on the door.", "Kade himself doesn't fight until he has to, and then he fights dirty. Bring a full group, Captain. I've seen what's in there. I used to be what's in there."],
    done: [['maren', "Kade is finished? Then sit down, both of you, because I have read your chart, and I have not slept."], ['maren', "There are forty-one red stars. Thirty-eight are dark already, in order, like a spiral closing. The next one is a border sun the Republic and the Empire both claim, and two fleets are circling it right now, each certain the other is to blame. That is where the road goes, child. Into a war. I'm sorry. I had hoped to read you something kinder."]] },
  { id: 'su_k10', story: true, ...Z, giver: 'maren', turnTo: 'brick', lvl: 10, pre: 'su_k9', when: () => (S.hero?.lvl || 1) >= 10, name: 'A Second Berth', where: 'town', xp: qx(10, .3), gold: 20, obj: { talk: true, what: 'Offer Brick a berth aboard the Second Chance' },
    say: ["I'm too old to fly with you, and too blind, and I would only argue with your helm. But you'll need more than one pair of hands where you're going.", "Brick has nowhere to be and a great deal to make up for. I have known a few men like that. They make the best crew there is, provided somebody trusts them first. Go and be the somebody."],
    done: [['brick', "A berth. On your ship. Captain, I've broken more doors than I've walked through politely. You understand what you'd be signing on."], ['brick', "Right. Then I'll say yes before you think better of it. I don't need much room. I've never owned anything that didn't fit in one hand, and I've only got the maul."]] },
  // ----- sides -----
  { id: 'su_a1', ...Z, giver: 'beck', lvl: 7, pre: 'su_k2', name: 'The Dune King', where: 'flats', xp: qx(7, .7), gold: 30, gear: true, obj: { named: 'duneking', n: 1, what: 'Defeat the Dune King on the Salt Flats' },
    say: ["There's one strider on the flats that the caravan masters call the Dune King. It's the size of a pump house and it has decided that my north approach belongs to it. I've rerouted four crawlers this week, and rerouting costs me fuel.", "I'll pay well to have my approach back. Mind how you go, Captain. When it calls, the other striders come, and they come quickly."],
    done: ["The Dune King, dethroned. I've put it in the book as 'obstruction cleared', which doesn't do you justice, but it's a very dignified book."] },
  { id: 'su_a2', ...Z, giver: 'tobin', lvl: 6, name: 'Kites Over the Pumps', where: 'well', xp: qx(6, .7), gold: 14, obj: { kill: ['kite'], n: 8, what: 'Defeat 8 Carrion Kites around Wellhead Nine' },
    say: ["See those shapes circling? Carrion kites. They've worked out that a man fixing a pump has both hands full and his back turned. I've lost two wellhands to the infirmary this month, and the kites looked very pleased about it.", "Bring down eight of them and the rest will go and circle somebody else. There's water in it for your ship's tanks, and that's worth more out here than anything I could count out in credits."],
    done: ["Eight kites, and the sky's clean for the first time since the dry wind. I've filled your ship's tanks from the good line. That's my grandmother's water, mind, so don't go wasting it on washing."] },
  { id: 'su_a3', ...Z, giver: 'tobin', lvl: 7, pre: 'su_a2', name: 'Prime the Wellheads', where: 'well', xp: qx(7, .7), gold: 16, obj: { inspect: 'pump', n: 5, what: 'Restart 5 dry wellhead pumps on the flats around Wellhead Nine' },
    say: ["The Syndicate couldn't buy me, so they've been shutting off my outlying pumps at night. They don't break them. They only switch them off, so that I spend every morning walking the flats instead of selling water. It's very patient. I almost admire it.", "There are pumps standing dry all around the wellhead. Restart five of them for me, {hero}. And since you'll be doing my walking, take my old speeder when you're done. She's ugly, but she'll get you across the flats before the kites notice."],
    done: ["All five running, and the gauges are climbing. Here, the speeder's yours. I've had her since before my knees went. Treat her gently and she'll throw you no more than twice."] },
  { id: 'su_a4', ...Z, giver: 'tamm', lvl: 8, pre: 'su_k4', name: 'Posted: Silk Marrow', where: 'road', xp: qx(8, .7), gold: 36, gear: true, obj: { named: 'silk', n: 1, what: 'Defeat Silk Marrow, the Syndicate poisoner, west of the Caravan Road' },
    say: ["Here's an old page. Silk Marrow sold medicine in this market for ten years, and one winter a great many of her customers died of the cure. She went to work for Kade the day I posted her, and I've not been able to reach her since.", "The sponsors are the families. They've been paying into this bounty a few credits at a time for six years. I'd be glad to close it for them."],
    done: ["Silk Marrow, closed. I'll send word to the families tonight. Six years they've been paying into that page, a few credits at a time. I'm going to give them every one of those credits back, and tell them the Ledger covered it."] },
  { id: 'su_a5', ...Z, giver: 'tamm', lvl: 9, pre: 'su_k5', name: 'Posted: Twice-Paid Jor', where: 'dock', xp: qx(9, .7), gold: 40, gear: true, obj: { named: 'jor', n: 1, what: 'Defeat Twice-Paid Jor at the gate of the Dry Dock' },
    say: ["Jor keeps the gate at the Dry Dock, and he's been posted in this book under four different sponsors, two of whom were also paying him at the time. I don't hold that against him. On this world it's very nearly a pension.", "He's between you and Kade either way, so you may as well be paid for it."],
    done: ["Jor's page closed at last. He'd been in the book so long I'd started to think of him as furniture. Here's the bounty, all four sponsors' worth. Two of them will be surprised to hear they paid."] },
  { id: 'su_a6', ...Z, giver: 'hesk', lvl: 9, pre: 'su_k3', name: 'What Made the Bonefields', where: 'bones', xp: qx(9, .8), gold: 44, gear: true, obj: { named: 'thresher', n: 1, what: 'Defeat the Thresher in the Bonefields' },
    say: ["The Hall lost a whole caravan in the Bonefields last season. Twelve crawlers and their crews, and we found the crawlers licked clean. There's something under those bones, {hero}. The old hands call it the Thresher, and they don't like to say it twice.", "The Hall will pay whoever puts it down, and I'll put your name on the wall beside the door myself, which is a thing we do for about one captain in a generation."],
    done: ["It's dead? You're certain? Then your name goes on the wall tonight, and the drinks are on the Hall until the barrel's empty. Osric never made the wall. He'd have been unbearable about this."] },
  { id: 'su_a7', ...Z, giver: 'hesk', lvl: 7, pre: 'su_k2', name: 'Company Property', where: 'glass', xp: qx(7, .7), gold: 20, obj: { kill: ['mdrone', 'excavator'], n: 10, what: 'Shut down 10 Mining Drones or Runaway Excavators around the Glassworks' },
    say: ["The Glassworks machines have started wandering. An excavator walked clean through a caravan camp last week, digging as it went, and it didn't so much as slow down for the tents.", "The mining company still owns them on paper and won't pay to have them collected. The Hall will, though. Ten of them shut down, anywhere around the Glassworks, and I'll send the company the bill with my compliments."],
    done: ["Ten machines off the road. I've sent the company an invoice for collection, storage and distress. They won't pay it, but their clerks will have to file it, and that's a small revenge of its own."] },
);

// ---------- what the story changes ----------
CREW.brick = { name: 'Brick Oduya', pal: 2, flag: 'crew2', hi: "Brick, signing on. Tell me who to stand in front of, Captain. It's the one thing I've always been good at.", pick: role => role === 'tank' ? 'bladewarden' : 'bulwark' };
X.turnin.push(q => {
  if (q.id === 'su_k6') { S.flags.marenfree = 1; Game.storyFolk(); }
  if (q.id === 'su_k10') X.recruit?.('brick');
  if (q.id === 'su_a3' && !(S.collection || []).includes('mount_speeder')) { S.collection = S.collection || []; S.collection.push('mount_speeder'); S.ext.mount = 'mount_speeder'; chat('loot', null, "You now own Tobin's Old Speeder. The ride button is beside your potions."); }
});
Object.assign(LFG_D, {
  glassworks: { name: 'The Glassworks', lvl: [7, 8], zone: 'sunder', at: () => ({ x: D3.glass.x - 50, z: D3.glass.z + 20 }) },
  drydock: { name: 'The Dry Dock', lvl: [9, 10], zone: 'sunder', at: () => ({ x: D3.dock.x, z: D3.dock.z + 60 }) },
});
// Sunder on the star map: the core gets its fix once Imre Sol has pointed the way
Object.assign(SYSTEMS, { sunder: { name: 'Sunder', sub: 'Desert trade world', path: 'smuggler', zone: 'sunder', x: .6, y: .34, info: 'A dry seabed with a market on it. Everything bought or sold in six systems crosses Saltmarket sooner or later.', need: () => !!S.quests.su_k1, why: 'The core has no fix for this lane yet.' } });
X.zone.push(zone => { if (zone === 'sunder') { S.ext.sys = 'sunder'; if (S.bind?.zone !== 'sunder' && !S.ext.sunderSeen) { S.ext.sunderSeen = 1; chat('sys', null, 'The air tastes of salt and hot metal. Somewhere a market is shouting.'); } } });
