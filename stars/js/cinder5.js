// Stars Beneath, Build 5: Cinder, the Dusk Covenant's furnace world (levels 1-5). The dark path's first world.
// The Ember Citadel in the south, the Slag Fields west of the road, the Culls where washed-out initiates hide in the
// east, the Old Foundry and its rebel cell in the north-west, a Republic watch post in the north-east, and the
// Proving Vault at the head of the valley, where each cohort is reduced to one.
import * as THREE from './three.js';
import { S, WH, TAU, lerp, mulberry32, makeNoise, chat, X } from './core.js';
import { addKinds } from './render.js';
import * as R from './render.js';
import { build, P, T, Cone, Cyl, Box, Sph, Oct, Dod } from './models.js';
import { H, HN, hgt, world, addWall, linkDoors, mergeBuilt, mat4, meshWithOutline, registerZone, ZONE_SIZE } from './world.js';
import { groundMesh } from './zones.js';
import { MOBS, QUESTS, GIVERS, xpNeed } from './data.js';
import { MOB_LORE, TALK } from './dialogue.js';
import { LORE, SCENES } from './story.js';
import { LFG_D } from './social6.js';
import { habGeo, lampGeo, crateGeo, mastGeo, shipGeo, minimapFrom } from './moon1.js';
import { sfig } from './models3.js';
import { CREW, PADS } from './ship1.js';
import { grantLamp } from './light4.js';
import * as Game from './game.js';
const O = [0, 0, 0], LR = [1, -1];
ZONE_SIZE.cinder = 300;
export const D6 = { cit: { x: 0, z: 172, R: 36, base: 5 }, pad: { x: 84, z: 188, R: 16 }, slag: { x: -135, z: 70, R: 70 }, culls: { x: 165, z: 55, R: 55 }, foundry: { x: -170, z: -115, R: 44 }, blind: { x: 180, z: -120, R: 30 }, vault: { x: 0, z: -205, R: 44 } };
PADS.cinder = { x: D6.pad.x, z: D6.pad.z + 17 };

const pal = (a, b, t, g) => ({ a, b, t, g }), HUM = [.6, .4, 1.6, .15], HEAVY = [.55, .4, 1.9, .15], STILL = [0, 0, 0, 0];
const IMP = pal('#2e2e34', '#18181c', '#c0392b', '#ff4a3a'), GREY = pal('#6a6a6e', '#3a3a3e', '#2a2a2e', '#ff8a3a'), REB = pal('#7a6a4a', '#3e3626', '#c8782a', '#ffcf6a'), REPB = pal('#3a5a8a', '#22303e', '#e8e2d0', '#6ad8ff'), COV = pal('#2c2c34', '#16161a', '#8a1a1a', '#ff3a2a');
addKinds({
  unc0: [sfig({ body: 'wraps', head: 'bald', r: 'baton', l: null, skin: '#b8a898' }, GREY, 0), HUM, .05, .03], unc1: [sfig({ body: 'wraps', head: 'hood', r: 'pistol', l: null, skin: '#b8a898' }, GREY, 1), HUM, .05, .03],
  unc_boss: [sfig({ body: 'wraps', head: 'bare', r: 'lampblade', l: 'knuckles', skin: '#a89888', hair: '#e8e2d0', cloak: '#3a3a3e' }, pal('#5a5a5e', '#2e2e32', '#2a2a2e', '#ff5a2a'), 0), HUM, .05, .035],
  reb0: [sfig({ body: 'suit', vest: true, head: 'cap', r: 'wrench', l: 'pistol' }, REB, 2), HUM, .05, .03], reb1: [sfig({ body: 'suit', knee: true, head: 'headset', r: 'rifle', l: null }, REB, 1), HUM, .05, .03],
  reb2: [sfig({ body: 'suit', vest: true, head: 'bare', r: 'injector', l: 'medkit' }, REB, 3), HUM, .05, .03], reb_boss: [sfig({ body: 'armor', heavy: true, head: 'bare', r: 'hammer', l: null, bandolier: true, hair: '#8a8a8a' }, REB, 2), HEAVY, .05, .04],
  repw0: [sfig({ body: 'armor', head: 'helmet', r: 'rifle', l: null }, REPB, 0), HEAVY, .05, .035], repw1: [sfig({ body: 'suit', knee: true, head: 'hood', r: 'lampknife', l: 'lampknife', cloak: '#8a9098' }, pal('#8a9098', '#4a5058', '#d8b24a', '#ffe9a0'), 1), HUM, .05, .03],
  rep_thorn: [sfig({ body: 'suit', knee: true, head: 'bare', r: 'lampknife', l: 'slate', cloak: '#8a9098', hair: '#c8a25a' }, pal('#8a9098', '#4a5058', '#d8b24a', '#ffe9a0'), 3), HUM, .05, .035],
  nyx_foe: [sfig({ body: 'armor', head: 'bare', r: 'lampblade', l: 'pistol', hair: '#1c2026', scarf: '#8a1a1a' }, COV, 3), HEAVY, .05, .035],
  n_venn: [sfig({ body: 'coat', head: 'bald', r: null, l: null, cloak: '#16161a', scarf: '#8a1a1a', skin: '#d8ccc0' }, pal('#22222a', '#101014', '#a8843a', '#ff3a2a'), 0), HUM, .05, .03],
  n_ilka: [sfig({ body: 'armor', heavy: true, head: 'bare', r: 'baton', l: null, hair: '#a83a2a' }, IMP, 2), HEAVY, .05, .035], n_prax: [sfig({ body: 'suit', vest: true, head: 'visor', r: null, l: 'slate', hair: '#8a8a8a' }, pal('#4a4a52', '#2a2a30', '#c0392b', '#ffcf6a'), 3), HUM, .05, .03],
  n_kell: [sfig({ body: 'coat', head: 'hood', r: 'lantern', l: null, cloak: '#1c2a1c', hair: '#e8e2d0' }, pal('#2a3a2e', '#141c16', '#b8b89a', '#8dff5a'), 1), HUM, .05, .03],
  n_tole: [sfig({ body: 'armor', head: 'cap', r: 'rifle', l: null }, IMP, 2), HEAVY, .05, .035], n_nyx: [sfig({ body: 'armor', head: 'bare', r: null, l: null, hair: '#1c2026', scarf: '#8a1a1a' }, COV, 3), HEAVY, .05, .035],
  tagpost: [build([P(T(Cyl(.05, .05, 1.3, 5), 0, .65), 0, O, '#2a2a2e'), P(T(Box(.3, .16, .03), 0, 1.2), 0, O, '#8a9098'), P(T(Box(.22, .05, .04), 0, 1.2), 0, O, '#ff5a2a', 1.6), P(T(Box(.9, .1, .5), 0, .03, .5), 0, O, '#3a3a3e')]), STILL, 0, .03],
});

const mob = (name, kind, o) => ({ name, kind, hpM: 1, dmgM: 1, spd: 5.4, range: 2.4, weak: 'frost', resist: 'fire', scale: 1, aggro: 9, social: 7, ...o });
const BE = { beast: true }, HU = { human: true }, UN = { undead: true };
Object.assign(MOBS, {
  slagskitter: mob('Slag Skitter', 'a_skitter_ash', { hpM: .8, dmgM: .8, scale: .8, ...BE }), cinderhound: mob('Cinder Lurcher', 'a_hound_ash', { hpM: .85, dmgM: .9, spd: 6.2, scale: .95, ...BE }),
  emberray: mob('Ember Ray', 'a_ray_ash', { hpM: .75, dmgM: .9, spd: 6.6, fly: .9, aggro: 8, social: 5, ...BE }),
  unchosen: mob('Unchosen', 'unc0', { hpM: .9, dmgM: .9, weak: 'shadow', resist: null, aggro: 11, social: 12, ...HU }), uncgun: mob('Unchosen Scavenger', 'unc1', { hpM: .8, dmgM: .9, range: 18, ranged: true, weak: 'shadow', resist: null, aggro: 12, social: 12, ...HU }),
  rebel: mob('Foundry Rebel', 'reb0', { hpM: .95, dmgM: .95, weak: 'shadow', resist: null, aggro: 11, social: 12, ...HU }), rebgun: mob('Rebel Sharpshooter', 'reb1', { hpM: .8, dmgM: 1, range: 22, ranged: true, weak: 'shadow', resist: null, aggro: 13, social: 12, ...HU }),
  rebmed: mob('Rebel Medic', 'reb2', { hpM: .8, dmgM: .75, range: 16, ranged: true, caster: true, healer: true, school: 'storm', weak: 'shadow', resist: null, aggro: 11, social: 12, ...HU }),
  repwatch: mob('Republic Watcher', 'repw0', { hpM: .95, dmgM: 1, range: 20, ranged: true, weak: 'shadow', resist: 'holy', aggro: 13, social: 13, ...HU }), repsent: mob('Keeper Sentinel', 'repw1', { hpM: 1, dmgM: 1.05, spd: 6, weak: 'shadow', resist: 'holy', aggro: 12, social: 13, ...HU }),
  vaultthrall: mob('Vault Thrall', 'ghoul', { hpM: 1, dmgM: .95, weak: 'holy', resist: 'shadow', aggro: 11, social: 12, ...UN }), provdrone: mob('Proving Drone', 'sdrone', { hpM: .8, dmgM: .95, range: 16, ranged: true, fly: .6, weak: 'storm', resist: 'poison', aggro: 12, social: 12 }),
});
const boss = (name, kind, o) => ({ name, kind, hpM: 1.15, dmgM: 1, spd: 5.2, range: 2.8, weak: 'shadow', resist: null, scale: 1.3, aggro: 14, social: 18, ...o });
Object.assign(MOBS, {
  cinderjaw: boss('Old Cinderjaw', 'a_mauler_ash', { ...BE, scale: 1.25, weak: 'frost', resist: 'fire', mechs: ['cleave', 'slam'], lines: { start: '*What you took for a slag heap stands up, opens like a flower, and shows you a mouth with a furnace at the back of it.*', half: '*The plates along its back begin to glow.*' } }),
  gaunt: boss('Old Gaunt, First of the Unchosen', 'unc_boss', { ...HU, scale: 1.15, mechs: ['cleave', 'call'], adds: 'unchosen', lines: { start: "Fresh greys. You still think you were chosen. Sit down, child, and I'll tell you what for.", half: 'Up! All of you, up! They send one a year, and this year we send it back!' } }),
  dask: boss('Foreman Hale Dask', 'reb_boss', { ...HU, scale: 1.2, weak: 'storm', mechs: ['slam', 'call'], adds: 'rebel', lines: { start: "I poured the steel in half the guns on this rock. You'd think that would buy a man a vote on where they point.", half: 'Shift change, lads! Everybody on the floor!' } }),
  kthorn: boss('Keeper Alise Thorn', 'rep_thorn', { ...HU, scale: 1.1, spd: 6, resist: 'holy', mechs: ['pool', 'fear'], school: 'holy', lines: { start: "An initiate. You poor thing, how old are you? No, don't answer. I wasn't sent here to watch your fort. I was sent to watch your sky.", half: "Listen to me! Ask your master why he is not afraid! Ask him!" } }),
  nyx: boss('Initiate Nyx Varrow', 'nyx_foe', { ...HU, hpM: 1.5, scale: 1.1, mechs: ['cleave', 'pool', 'enrage'], school: 'shadow', lines: { start: "There you are. I've been down here an hour and I was starting to think you'd found a way out, which would have been cleverer than I gave you credit for. Nothing personal. One of us is leaving as an acolyte.", half: "Fine. Fine! You're better than the last four.", enrage: "I did not survive the Winnowing to lose to someone from a mining town!" } }),
});
Object.assign(MOB_LORE, {
  slagskitter: 'A flat shell crusted with cooled slag, and one claw that can shear a power coupling. They eat insulation and have opinions about boots.', cinderhound: 'Eyeless, split-jawed and warm to the touch. Lurchers hunt by heat, and on Cinder everything alive is the coldest thing for a mile.',
  emberray: 'A glider of black glass that rides the thermals over the fire rivers. The humming is the last warning you get.',
  unchosen: 'An initiate who failed the Winnowing and ran before the Overseer could tidy up. The Covenant considers them a training aid.', uncgun: 'One of the Unchosen with a stolen sidearm and nothing left to be graded on.',
  rebel: 'A foundry hand from the conquered worlds. The Empire brought them here to pour steel and is surprised they kept some.', rebgun: 'A rebel with a hunting rifle and a clear line down the foundry road.', rebmed: 'The cell’s medic. She used to patch burns for the Empire, on the Empire’s time.',
  repwatch: 'A Republic trooper, a very long way from home, guarding a hole in the rocks and a telescope.', repsent: 'A Sentinel of the lamp-keepers: grey cloak, lit knife, and the patience to sit on a furnace world counting stars.',
  vaultthrall: 'A failed initiate from an earlier cohort, kept on in the Proving Vault. Mortician Kell calls them staff.', provdrone: 'A proving drone. It grades on a curve, and the curve is lethal.',
  cinderjaw: 'The garrison has been reporting the same slag heap in three different places for a year.', gaunt: 'The first initiate ever to walk out of the Winnowing the wrong way. He has kept a count on his wall ever since.',
  dask: 'Foreman of the Old Foundry for thirty years, and of its rebel cell for two.', kthorn: 'A senior Sentinel of the lamp-keepers. Her post faces away from the Citadel, toward the open sky.', nyx: "Veil-Lady Corriden's initiate, top of the cohort in everything but patience.",
});

const sm = t => t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t);
registerZone('cinder', seed => {
  const rng = mulberry32(seed + 6161), N = makeNoise(seed + 6161), pk = a => a[(rng() * a.length) | 0];
  world.water = null;
  world.names = { zone: 'Cinder', town: 'the Ember Citadel', boss: 'Initiate Varrow', ruin: 'the Proving Vault', wood: 'the Slag Fields', fields: 'the Slag Fields', waste: 'the Culls', road: 'the Ash Road', captain: 'Old Gaunt', tusk: 'Old Cinderjaw' };
  const Ci = D6.cit, Pad = D6.pad, Sl = D6.slag, Cu = D6.culls, Fo = D6.foundry, Bl = D6.blind, Va = D6.vault;
  const river = (x, z) => Math.abs(N.fbm(x * .006 + 3, z * .006 - 2, 2) - .5);          // slow rivers of fire wander the low ground
  const onRoad = (x, z) => (Math.abs(x + Math.sin(z * .02) * 10) < 5 && z > -170 && z < 140) || (Math.abs(z - 55) < 4 && x > -150 && x < 170) || (Math.abs(z + 115) < 4 && Math.abs(x) < 185);
  for (let zi = 0; zi < HN; zi++) for (let xi = 0; xi < HN; xi++) {
    const x = xi - WH, z = zi - WH; let h = 5 + N.fbm(x * .012, z * .012, 4) * 9 + Math.abs(N.fbm(x * .03, z * .03, 2) - .5) * 5;
    h = lerp(h, 2.2, sm(1 - river(x, z) / .035) * .9);
    for (const t of [Ci, Pad]) h = lerp(Ci.base, h, sm((Math.hypot(x - t.x, z - t.z) - t.R - 2) / 16));
    for (const t of [Cu, Fo, Bl]) h = lerp(5, h, sm((Math.hypot(x - t.x, z - t.z) - t.R * .7) / 18));
    h = lerp(3, h, sm((Math.hypot(x - Va.x, z - Va.z) - Va.R * .8) / 12));                  // the vault is a pit
    if (onRoad(x, z)) h = lerp(h, 5, .7);
    const edge = Math.max(Math.abs(x), Math.abs(z)) - (WH - 24); if (edge > 0) h += edge * edge * .12;
    H[zi * HN + xi] = h;
  }
  const GLASS = new THREE.Color('#4a4246'), ASHC = new THREE.Color('#6e6468'), RUST = new THREE.Color('#7a4a3a'), FIRE = new THREE.Color('#ff6a1a'), HOT = new THREE.Color('#ffd86a'), ROADC = new THREE.Color('#7a7276'), STONE = new THREE.Color('#5a545a'), RED = new THREE.Color('#c0392b'), PADC = new THREE.Color('#44444a');
  const fireAt = (x, z) => !onRoad(x, z) && ![Ci, Pad, Cu, Fo, Bl, Va].some(t => Math.hypot(x - t.x, z - t.z) < t.R + 12) ? sm(1 - river(x, z) / .03) : 0;
  const colorAt = (x, z) => {
    let c = GLASS.clone().lerp(ASHC, N.fbm(x * .03, z * .03, 2)).lerp(RUST, sm(N.fbm(x * .015 + 9, z * .015, 2) * 2 - .9) * .6);
    const f = fireAt(x, z); if (f > 0) { c.lerp(FIRE, sm(f * 1.6)); if (f > .7) c.lerp(HOT, (f - .7) * 2.4); }
    if (onRoad(x, z)) c.lerp(ROADC, .7);
    const dc = Math.hypot(x - Ci.x, z - Ci.z); if (dc < Ci.R) { c.lerp(STONE, .8); if (Math.abs(dc - 12) < .7 || Math.abs(dc - Ci.R + 2) < .7) c.lerp(RED, .8); }
    const dp = Math.hypot(x - Pad.x, z - Pad.z); if (dp < Pad.R) { c.lerp(PADC, .85); if (Math.abs(dp - Pad.R + 1.5) < .6) c.lerp(RED, .9); }
    if (Math.hypot(x - Va.x, z - Va.z) < Va.R * .8) c.lerp(new THREE.Color('#1a1618'), .6);
    const sh = .92 + N.n2(x * .3, z * .3) * .12; return new THREE.Color(c.r * sh, c.g * sh, c.b * sh);
  };
  groundMesh(colorAt);
  world.regionNames = ['The Slag Fields', 'The Culls', 'The Old Foundry', 'The Lantern Blind', 'The Proving Vault', 'The Ember Citadel'];
  world.regionFn = (x, z) => Math.hypot(x - Va.x, z - Va.z) < 90 ? 4 : Math.hypot(x - Bl.x, z - Bl.z) < 70 ? 3 : Math.hypot(x - Fo.x, z - Fo.z) < 85 ? 2 : x > 80 && z < 140 ? 1 : z > 120 && Math.abs(x) < 110 ? 5 : 0;
  const items = [], put = (geo, x, z, ry = 0, s = 1) => items.push({ geo, m: mat4(x, hgt(x, z), z, ry, s) });
  const solid = (x, z, w, d, ry = 0) => { const c = Math.cos(ry), s = Math.sin(ry), pt = (lx, lz) => [x + lx * c + lz * s, z - lx * s + lz * c]; const k = [pt(-w / 2, -d / 2), pt(w / 2, -d / 2), pt(w / 2, d / 2), pt(-w / 2, d / 2)]; for (let i = 0; i < 4; i++) addWall(k[i][0], k[i][1], k[(i + 1) % 4][0], k[(i + 1) % 4][1], .3); };
  const ring = (cx, cz, r, n = 10) => { for (let k = 0; k < n; k++) { const a = k / n * TAU, b = (k + 1) / n * TAU; addWall(cx + Math.cos(a) * r, cz + Math.sin(a) * r, cx + Math.cos(b) * r, cz + Math.sin(b) * r, .5); } };
  const brazier = () => build([P(T(Cyl(.3, .5, 2.4, 6), 0, 1.2), 0, O, '#2a2a2e'), P(T(Cyl(.7, .4, .4, 6), 0, 2.6), 0, O, '#1c1c20'), P(T(Cone(.5, 1.1, 5), 0, 3.3), 0, O, '#ff5a1a', 3), P(T(Cone(.26, .7, 4), 0, 3.4), 0, O, '#ffd86a', 3.4)]);
  const shard = (h, col = '#1c1a1e') => build([P(T(Cone(h * .22, h, 5), 0, h / 2, 0, .12, 0, .1), 0, O, col), P(T(Cone(h * .12, h * .6, 4), h * .2, h * .3, .1, -.2, 0, -.3), 0, O, '#2a2628')]);
  // the Ember Citadel: a stepped black spire with a slit of red light down its face
  put(build([P(T(Cyl(12, 14, 8, 6), 0, 4), 0, O, '#26262c'), P(T(Cyl(8.5, 10.5, 9, 6), 0, 12.5), 0, O, '#1e1e24'), P(T(Cyl(5, 7, 10, 6), 0, 22), 0, O, '#18181c'), P(T(Cone(4.4, 14, 6), 0, 34), 0, O, '#121216'),
    P(T(Box(.8, 26, .5), 0, 16, -12.2, .12), 0, O, '#ff3a2a', 2.6), ...[4, 13, 22].map(y => P(T(Cyl(13 - y * .3, 13 - y * .3, .4, 6), 0, y + 4), 0, O, '#8a1a1a')), P(T(Box(4.4, 5.4, 1), 0, 2.7, -12.4), 0, O, '#0a0a0c'), P(T(Oct(1.6), 0, 43), 0, O, '#ff3a2a', 3.4)]), Ci.x, Ci.z + 20);
  ring(Ci.x, Ci.z + 20, 13.6);
  for (const [dx, dz, ry, w, d, trim] of [[-24, -8, .25, 12, 7, '#c0392b'], [24, -10, -.25, 10, 6, '#8a1a1a'], [-27, 12, Math.PI / 2, 9, 5, '#8dff5a']]) { put(habGeo(w, d, '#34343a', trim), Ci.x + dx, Ci.z + dz, ry); solid(Ci.x + dx, Ci.z + dz, w, d, ry); }
  for (const [dx, dz] of [[-9, -10], [9, -10], [-9, -26], [9, -26], [-18, 2], [18, 2]]) put(brazier(), Ci.x + dx, Ci.z + dz);
  for (const [dx, dz] of [[40, 14], [58, 16], [70, 4]]) put(lampGeo(), Ci.x + dx, Ci.z + dz);
  put(mastGeo(), Ci.x + 30, Ci.z + 18);
  put(shipGeo('#2c2c34', '#c0392b'), Pad.x, Pad.z, Math.PI); solid(Pad.x, Pad.z - 1, 9, 13);
  // obsidian shards everywhere the ground is not on fire
  for (let i = 0; i < 260; i++) { const x = (rng() * 2 - 1) * 270, z = (rng() * 2 - 1) * 270; if (onRoad(x, z) || fireAt(x, z) > .2 || [Ci, Pad].some(t => Math.hypot(x - t.x, z - t.z) < t.R + 14) || [Cu, Fo, Bl, Va].some(t => Math.hypot(x - t.x, z - t.z) < 14)) continue; const h = 1.5 + rng() * rng() * 9; put(shard(h), x, z, rng() * TAU); if (h > 4) solid(x, z, h * .3, h * .3); }
  // the Culls: lean-tos of hull plate round a cold hearth, and Gaunt's wall
  for (let i = 0; i < 9; i++) { const a = i / 9 * TAU, d = 16 + rng() * 22; put(build([P(T(Box(4.4, 2.6, .2), 0, 1.3, 0, .5), 0, O, pk(['#4a4448', '#5a3a30', '#3a363a'])), P(T(Box(.2, 2.2, .2), -2, 1.1, 1), 0, O, '#2a2628'), P(T(Box(.2, 2.2, .2), 2, 1.1, 1), 0, O, '#2a2628')]), Cu.x + Math.cos(a) * d, Cu.z + Math.sin(a) * d, a + Math.PI / 2); }
  put(build([P(T(Box(9, 4.4, .8), 0, 2.2), 0, O, '#2e2a2c'), ...Array.from({ length: 30 }, (_, k) => P(T(Box(.08, .5, .1), -4 + (k % 15) * .56, 2.9 - Math.floor(k / 15) * 1.1, .42), 0, O, '#e8e2d0', .4))]), Cu.x + 6, Cu.z - 14, .3); solid(Cu.x + 6, Cu.z - 14, 9, 1, .3);
  // the Old Foundry: a casting hall with one stack still hot
  put(build([P(T(Box(26, 9, 16), 0, 4.5), 0, O, '#4a3a34'), P(T(Box(27, 1, 17), 0, 9.5), 0, O, '#2e2624'), ...[-8, 0, 8].map(x => P(T(Box(3, 4, .4), x, 2, 8.1), 0, O, '#ff6a1a', 1.6)), P(T(Cyl(2, 2.6, 22, 8), -9, 11, -4), 0, O, '#3a302c'), P(T(Cyl(1.6, 1.6, .6, 8), -9, 22.2, -4), 0, O, '#ff5a1a', 2.6), P(T(Cyl(1.6, 2, 14, 8), 8, 7, -4), 0, O, '#3a302c')]), Fo.x, Fo.z - 18); solid(Fo.x, Fo.z - 18, 26, 16);
  for (let i = 0; i < 14; i++) put(crateGeo(), Fo.x + (rng() - .5) * 60, Fo.z + (rng() - .2) * 40, rng() * TAU, 1 + rng());
  // the Lantern Blind: a Republic hide dug into the rocks, with a telescope pointing straight up
  put(habGeo(8, 5, '#3a3a40', '#3a5a8a'), Bl.x, Bl.z - 8, 0); solid(Bl.x, Bl.z - 8, 8, 5);
  put(build([P(T(Cyl(.8, 1.1, 1.4, 8), 0, .7), 0, O, '#4a5058'), P(T(Cyl(.5, .7, 4.4, 8), 0, 3, .6, -.3), 0, O, '#8a9098'), P(T(Cyl(.72, .72, .2, 8), 0, 5, 1.2, -.3), 0, O, '#6ad8ff', 1.8)]), Bl.x + 8, Bl.z + 2); solid(Bl.x + 8, Bl.z + 2, 2, 2);
  // the Proving Vault: a ring of black pylons round a sunken floor
  for (let k = 0; k < 12; k++) { const a = k / 12 * TAU + .26; put(build([P(T(Box(2.4, 11, 2.4), 0, 5.5), 0, O, '#18181c'), P(T(Box(.4, 9, .2), 0, 5.5, 1.24), 0, O, k % 3 ? '#ff3a2a' : '#8dff5a', 2.2)]), Va.x + Math.cos(a) * (Va.R - 6), Va.z + Math.sin(a) * (Va.R - 6), -a + Math.PI / 2); solid(Va.x + Math.cos(a) * (Va.R - 6), Va.z + Math.sin(a) * (Va.R - 6), 2.6, 2.6); }
  put(build([P(T(Cyl(5, 6, 1, 8), 0, .5), 0, O, '#1c1c20'), P(T(Cyl(4, 4, .2, 8), 0, 1.05), 0, O, '#ff3a2a', 1.4)]), Va.x, Va.z - 22);
  meshWithOutline(mergeBuilt(items), .05); linkDoors();
  world.places = [{ name: 'The Ember Citadel', x: Ci.x, z: Ci.z, R: Ci.R, kind: 'town' }, { name: 'The Landing Pad', x: Pad.x, z: Pad.z, R: Pad.R, kind: 'town' }, { name: 'The Slag Fields', x: Sl.x, z: Sl.z, R: Sl.R, kind: 'camp' }, { name: 'The Culls', x: Cu.x, z: Cu.z, R: Cu.R, kind: 'camp' },
    { name: 'The Old Foundry', x: Fo.x, z: Fo.z, R: Fo.R, kind: 'dungeon' }, { name: 'The Lantern Blind', x: Bl.x, z: Bl.z, R: Bl.R, kind: 'camp' }, { name: 'The Proving Vault', x: Va.x, z: Va.z, R: Va.R, kind: 'dungeon' }];
  world.town = Ci;
  world.towns = [{ key: 'ember', name: 'The Ember Citadel', x: Ci.x, z: Ci.z, R: Ci.R, guardName: 'Citadel Trooper', npcs: [['giver', 'venn', 0, 4], ['giver', 'ilka', 14, -12], ['giver', 'prax', -20, -4], ['giver', 'kell', -22, 13], ['giver', 'tole', 20, -24], ['vendor', 'cind', 21, -7], ['bind', null, -8, 8]], guards: [[-5, -Ci.R + 4], [5, -Ci.R + 4], [Ci.R - 5, 0], [-Ci.R + 5, 0], [30, 12], [-12, -16]] }];
  world.storyNpcs.push({ key: 'nyx', x: Pad.x - 9, z: Pad.z + 10, yaw: -1.4, when: ['nyxyield', '*'], unless: ['dcrew1', '*'] });
  world.mapLabels = [{ t: 'Skitters, lurchers, rays (1-2)', x: Sl.x, z: Sl.z + 40 }, { t: 'The Unchosen (2-3)', x: Cu.x, z: Cu.z + 34 }, { t: 'Rebel cell (3-4)', x: Fo.x, z: Fo.z + 34 }, { t: 'Republic watchers (4)', x: Bl.x, z: Bl.z + 26 }, { t: 'The Proving Vault (4-5)', x: Va.x, z: Va.z + 50 }];
  world.zoneLines.push({ x: Pad.x, z: Pad.z + 11, r: 2.6, to: 'ship', label: 'Board the Eventide' });
  Object.assign(world.spots, { town: { x: Ci.x, z: Ci.z }, pad: { x: Pad.x, z: Pad.z }, slag: { x: Sl.x, z: Sl.z }, culls: { x: Cu.x, z: Cu.z }, cullsdeep: { x: Cu.x + 4, z: Cu.z - 8 }, foundry: { x: Fo.x, z: Fo.z + 10 }, foundrydeep: { x: Fo.x, z: Fo.z - 4 }, blind: { x: Bl.x, z: Bl.z }, vault: { x: Va.x, z: Va.z + 20 }, vaultdeep: { x: Va.x, z: Va.z - 18 } });
  world.clearSpots = [{ x: Ci.x, z: Ci.z, r: Ci.R + 24 }, { x: Pad.x, z: Pad.z, r: Pad.R + 20 }];
  const prop = (kind, tag, name, x, z, o = {}) => world.props.push({ id: 'd' + world.props.length, kind, tag, name, x, z, yaw: o.yaw ?? rng() * TAU, lore: o.lore || null, scale: o.scale || 1, when: o.when, unless: o.unless });
  for (let i = 0; i < 9; i++) { const a = i / 9 * TAU + .3, d = 14 + rng() * 30; prop('tagpost', 'tagpost', "A fallen initiate's tag", Cu.x + Math.cos(a) * d, Cu.z + Math.sin(a) * d); }
  for (let i = 0; i < 7; i++) { const a = i / 7 * TAU, d = 20 + rng() * 40; prop('crate', 'dcache', 'Lost supply crate', Sl.x + Math.cos(a) * d, Sl.z + Math.sin(a) * d); }
  prop('console', 'lore', "Gaunt's wall", Cu.x + 5, Cu.z - 11, { lore: 'gauntwall', yaw: .3 }); prop('console', 'lore', "Keeper Thorn's log", Bl.x + 5, Bl.z + 4, { lore: 'thornlog', yaw: 1 }); prop('console', 'lore', 'The cohort roll', Va.x - 6, Va.z - 20, { lore: 'cohortroll', yaw: 0 });
  const sp = world.spawns, put2 = o => sp.push({ ...o, y: hgt(o.x, o.z), alive: null, timer: 0 });
  const free = p => !world.clearSpots.some(c => Math.hypot(c.x - p.x, c.z - p.z) < c.r) && Math.max(Math.abs(p.x), Math.abs(p.z)) < WH - 30 && !world.walls.some(w => Math.hypot((w.x1 + w.x2) / 2 - p.x, (w.z1 + w.z2) / 2 - p.z) < 5);
  const land = (c, rad, min = 10) => { for (let i = 0; i < 300; i++) { const a = rng() * TAU, d = Math.sqrt(rng()) * rad, p = { x: c.x + Math.cos(a) * d, z: c.z + Math.sin(a) * d }; if (free(p) && !sp.some(s => Math.hypot(s.x - p.x, s.z - p.z) < min)) return p; } return null; };
  const scatter = (n, c, rad, mobs, lvl, area, o = {}) => { for (let i = 0; i < n; i++) { const p = land(c, rad, o.min || 12); if (p) put2({ ...p, mob: pk(mobs), lvl, respawn: 60, area, ...o }); } };
  const camp = (n, c, rad, mobs, lvl, area, tag, o = {}) => { for (let i = 0; i < n; i++) { const p = land(c, rad, 22); if (!p) continue; for (let k = 0; k < mobs.length; k++) { const a = k / mobs.length * TAU; put2({ x: p.x + Math.cos(a) * 3, z: p.z + Math.sin(a) * 3, mob: mobs[k], lvl, respawn: 85, camp: tag + i, area, solo: true, ...o }); } } };
  scatter(22, { x: -60, z: 100 }, 60, ['slagskitter'], [1, 1], 0, { solo: true }); scatter(30, Sl, Sl.R + 15, ['slagskitter', 'cinderhound', 'cinderhound', 'emberray'], [1, 2], 0, { solo: true }); scatter(12, { x: -80, z: -20 }, 50, ['cinderhound', 'emberray', 'emberray'], [2, 3], 0, { solo: true });
  scatter(12, Cu, Cu.R, ['unchosen', 'uncgun'], [2, 3], 1, { solo: true }); camp(7, Cu, Cu.R, ['unchosen', 'uncgun'], [2, 3], 1, 'cu');
  put2({ x: Cu.x + 4, z: Cu.z - 8, mob: 'gaunt', lvl: [3, 3], respawn: 700, named: 'gaunt', area: 1 });
  [[-14, 22, ['rebel', 'rebgun']], [12, 20, ['rebel', 'rebmed', 'rebgun']], [-22, 4, ['rebel', 'rebel']], [20, 2, ['rebgun', 'rebel', 'rebmed']], [-10, -2, ['rebel', 'rebgun']], [24, 22, ['rebel', 'rebgun']], [-28, 26, ['rebel', 'rebmed']]].forEach(([dx, dz, mobs], i) => mobs.forEach((m, k) => put2({ x: Fo.x + dx + (k % 2) * 2.2, z: Fo.z + dz + (k > 1 ? 2.2 : 0), mob: m, lvl: [3, 4], respawn: 200, camp: 'fo' + i, area: 2, dungeon: true, solo: true })));
  put2({ x: Fo.x + 2, z: Fo.z - 5, mob: 'dask', lvl: [4, 4], respawn: 900, named: 'dask', area: 2, dungeon: true, boss2: true });
  camp(4, Bl, Bl.R, ['repwatch', 'repsent'], [4, 4], 3, 'bl'); put2({ x: Bl.x + 2, z: Bl.z, mob: 'kthorn', lvl: [4, 4], respawn: 900, named: 'kthorn', area: 3 });
  [[-12, 24, ['vaultthrall', 'provdrone']], [12, 22, ['vaultthrall', 'vaultthrall', 'provdrone']], [-20, 4, ['provdrone', 'vaultthrall']], [20, 2, ['vaultthrall', 'provdrone', 'vaultthrall']], [-10, -8, ['vaultthrall', 'vaultthrall']], [10, -10, ['provdrone', 'vaultthrall', 'provdrone']]].forEach(([dx, dz, mobs], i) => mobs.forEach((m, k) => put2({ x: Va.x + dx + (k % 2) * 2.2, z: Va.z + dz + (k > 1 ? 2.2 : 0), mob: m, lvl: [4, 5], respawn: 240, camp: 'va' + i, area: 4, dungeon: true, solo: true })));
  put2({ x: Va.x, z: Va.z - 18, mob: 'nyx', lvl: [5, 5], respawn: 1200, named: 'nyx', area: 4, dungeon: true, boss: true });
  { const p = land({ x: Sl.x - 30, z: Sl.z - 20 }, 30, 18) || { x: Sl.x - 30, z: Sl.z - 20 }; put2({ ...p, mob: 'cinderjaw', lvl: [3, 3], respawn: 600, named: 'cinderjaw', area: 0 }); }
  world.huntAreas = [{ area: 0, lvl: [1, 2] }, { area: 1, lvl: [2, 3] }, { area: 2, lvl: [3, 4] }, { area: 3, lvl: [4, 4] }, { area: 4, lvl: [4, 5] }];
  world.trees = [];
  world.minimap = minimapFrom(colorAt);
  return world;
});
X.light.push(() => { if (S.zone !== 'cinder') return; const u = R.skyMat.uniforms; u.top.value.lerp(new THREE.Color('#2a1418'), .6); u.mid.value.lerp(new THREE.Color('#8a3a22'), .6); u.hor.value.lerp(new THREE.Color('#ff8a3a'), .6); R.scene.fog.color.lerp(new THREE.Color('#8a4a34'), .5); });
X.zone.push(zone => { if (zone === 'cinder') S.ext.sys = 'cinder'; });
X.gate.ship = (prev => () => X.path() === 'dark' ? (S.flags.ship ? null : 'The Eventide is sealed. Initiates do not have ships. Initiates have bunks.') : prev())(X.gate.ship);

// ---------- people ----------
Object.assign(X.vend, { cind: 'Canteen-Keeper Dob' });
Object.assign(GIVERS, {
  venn: { name: 'Veil-Lord Sarkath Venn', title: 'Dusk Covenant · Office of Lamplighters', model: 'n_venn' }, ilka: { name: 'Overseer Ilka Dross', title: 'Mistress of initiates', model: 'n_ilka' },
  prax: { name: 'Quartermaster Odo Prax', title: 'Citadel armory', model: 'n_prax' }, kell: { name: 'Mortician Hesper Kell', title: 'Keeper of the Ossuary', model: 'n_kell' },
  tole: { name: 'Sergeant Bram Tole', title: 'Citadel garrison', model: 'n_tole' }, nyx: { name: 'Nyx Varrow', title: 'Initiate of the Covenant', model: 'n_nyx' },
});
Object.assign(TALK, {
  venn: { bio: "Sarkath Venn is a Veil-Lord of the Dusk Covenant and the head of the Imperial Office of Lamplighters, a department whose budget is secret and whose purpose is a matter of polite speculation. He has never been heard to raise his voice. He has people for that.",
    greet: ["Initiate. You may stand closer. I do not bite, and the ones who do are kept downstairs.", "I chose you from the Winnowing myself. Do not take it as a compliment. I choose tools the way a surgeon does, and for the same reason."],
    topics: [{ q: 'What is the Office of Lamplighters?', a: ["A small office with a quaint name. Officially, we maintain the Empire's navigation beacons. It is dull work and nobody asks about it, which is the whole point of the name.", "Unofficially, we count stars. There are fewer than there were. The Republic knows it too, and is frightened. I am not, and one day I will tell you why. Today you have not earned it."] },
      { q: 'Why did you choose me?', a: ["Because the dark answered you quickly. Forty went into the Winnowing. Most begged it, some fought it, and you simply listened. That is rarer than strength, and a good deal more useful.", "Also, you are from Hollow. People from Hollow are accustomed to being spent. I find it saves time."] }] },
  ilka: { bio: "Ilka Dross has trained nineteen cohorts of initiates and can tell you, to the hour, how long each of them lasted. She is relentlessly cheerful about it. The initiates find this worse than shouting.",
    greet: ["Still breathing! Good. Keep that up, it reflects well on me.", "There are two kinds of initiate on Cinder: the useful and the Unchosen. Have a think about which you'd like to be. Take your time. Not too much."],
    topics: [{ q: 'What happens to initiates who fail?', a: ["Officially they're 'released from the Covenant'. Cinder being what it is, release tends to be brief. The ones who run end up in the Culls, eating skitters and feeling sorry for themselves.", "We leave them there. Every cohort needs something to practise on, and they're free. Waste not, want not."] }] },
  prax: { bio: "Odo Prax has been quartermaster of the Ember Citadel for twenty-six years and has survived four Veil-Lords by being the only person who knows where anything is. He fears nothing in the galaxy except an audit.",
    greet: ["If it's a requisition, it needs a form. If it's a complaint, it needs a different form, and I'm out of those.", "Do you know what the dark side of the old power cannot do, initiate? It cannot reconcile an inventory. I have asked."],
    topics: [{ q: 'Does the Covenant really need all this paperwork?', a: ["The Covenant runs on terror, ambition and betrayal. Somebody has to write down who betrayed whom, or we would be issuing boots to dead men.", "We do issue boots to dead men, as it happens. Mortician Kell signs for them. It is all quite in order."] }] },
  kell: { bio: "Hesper Kell keeps the Citadel's Ossuary and teaches the Gravelord's art to those with the stomach for it. She is seventy, knits, and refers to the dead as 'my staff'. They have never once complained.",
    greet: ["Come in, dear, mind the step. And mind Corporal Renn, he's just there by the door. He can't help staring, he's no eyelids.", "People say dreadful things about necromancy. It's only housekeeping, really. Nothing wasted, everything put back where it's useful."],
    topics: [{ q: 'Where does the art come from?', a: ["From the Gravelord, dear, two thousand years back. He lost, of course, and the lamp people have been very smug about it ever since. But you can't un-learn a thing. We kept what he taught. Carefully, in jars.", "I'll tell you something the Veil-Lord doesn't like said aloud. The Gravelord didn't invent it either. He was taught. I have often wondered who by, and whether they're the sort to come and check on their pupil."] }] },
  tole: { bio: "Bram Tole is a career garrison sergeant who was posted to Cinder as a punishment and has made the best of it. He thinks the Covenant are a pack of ghouls, says so quietly, and has outlived everyone who said so loudly.",
    greet: ["You're one of the robed lot. No offence. Some offence. What do you need?", "Regular army, me. We do the guarding and the dying, your lot do the chanting. It's a living. For now."], topics: [] },
  nyx: { bio: "Nyx Varrow was Veil-Lady Corriden's chosen initiate and the best blade of her cohort. She lost exactly one duel in her life, and she is now standing next to the person she lost it to.",
    greet: ["Captain. I'm practising saying it. It still tastes like ash.", "I want it understood that I intend to betray you. Not soon. I'll give reasonable notice. I just don't want it to be a surprise and spoil things between us."], topics: [] },
  'vendor:cind': { bio: 'Dob runs the Citadel canteen and sells whatever falls off the back of the supply lighter. Prax knows. Prax gets a cut.', greet: ["Medigel, cells, ration bars. The bars are grey. Don't ask what flavour grey is.", "No credit for initiates. Nothing personal. It's an actuarial matter."], topics: [] },
});
Object.assign(LORE, {
  gauntwall: { title: "Gaunt's Wall", where: 'cullsdeep', text: "A wall of hull plate, scratched with tally marks in rows of forty. Nineteen rows. In each row, one mark is circled. Beneath, in a careful hand: 'They tell you the Winnowing picks the strong. I was the strongest of my forty. I have watched nineteen cohorts from this hill. He never takes the strongest. He takes the one the dark comes to quickest, the one that catches like dry paper. He is not raising an army. An army you feed. He is laying in a stock of something. I have heard him use the word once, when he thought he was alone. He called them wicks.'" },
  thornlog: { title: "Keeper Thorn's Log", where: 'blind', text: "'Day 212. The Covenant's Lamplighters keep the same count we do. Thirty-eight gone, and the thirty-ninth, the border sun, failing. They have known longer than the Senate has. What I cannot report, because I cannot explain it, is this: in Aurelis the men who know are terrified, and hide it. Here the men who know are not afraid at all. Venn's office is moving ships toward the thirty-ninth, quietly, as you would move furniture before a guest arrives. Nobody prepares like that for a catastrophe. They are preparing for an appointment.'" },
  cohortroll: { title: 'The Cohort Roll', where: 'vaultdeep', text: "A slab of black glass listing nineteen cohorts. In each, forty names, and one of them lit in red: the acolyte. Under the nineteenth, two names are lit, yours and Nyx Varrow's, and the slab seems undecided. Further down, older and half worn away, is a different list in the same hand. It has forty-one lines. Thirty-eight have been struck through. The oldest strikes are in faded hands, generations apart. The last eleven are in Venn's, and beside each of those he has written a name from the roll above." },
});
SCENES.intro_d = [
  { spot: 'town', from: [46, 34, 60], look: [0, 12, 20], who: null, text: 'Two thousand years ago the Gravelord fell, and the people who beat him lit a lamp and called that the end of it. But his art was not burned with him. It was copied, hidden, carried off-world, and kept. The Empire has it now. The Empire calls its keepers the Dusk Covenant.' },
  { spot: 'culls', from: [-30, 22, 36], look: [0, 3, 0], who: null, text: 'Every year the Covenant takes forty conscripts from the conquered worlds and puts them through the Winnowing, to see which of them the dark will answer. It usually answers one. The other thirty-nine are not discussed.' },
  { spot: 'pad', from: [-24, 12, 22], look: [0, 4, 0], who: null, text: 'This year the conscripts came from Hollow, a mining world the Empire dug out and kept. Forty went in. You came out, which makes you an initiate, and makes this furnace of a planet your home. The other initiates have already noticed your bunk.' },
];

// ---------- quests ----------
const qx = (lvl, f) => Math.round(xpNeed(lvl) * f * .36);
const Z = { zone: 'cinder', path: 'dark' }, UNC = ['unchosen', 'uncgun'], REBS = ['rebel', 'rebgun', 'rebmed'];
QUESTS.push(
  { id: 'de_e1', story: true, ...Z, giver: 'ilka', turnTo: 'prax', lvl: 1, name: 'Sign Here', where: 'town', xp: qx(1, .4), gold: 2, obj: { talk: true, what: 'Report to Quartermaster Prax at the Citadel armory' },
    say: ["You're the one off the Hollow transport. Forty conscripts went into the Winnowing with you and you're what walked out, so congratulations: you are an initiate of the Dusk Covenant. The pay is nothing and the pension is a niche in the Ossuary.", "First lesson, and it's free. The Covenant doesn't care whether you're strong. It cares whether you're useful. Go and be useful to Quartermaster Prax in the armory. He'll issue your kit and he'll make you sign for it, and the dark help you if you walk off with his pen."],
    done: [['prax', "Initiate. Yes. I have you on the manifest as 'one, surviving'. Sign here, and here, and initial here to confirm that you have read the page you just signed."], ['prax', "One weapon, training. One set of greys. If you die, the kit comes back to me. If the kit dies, you come back to me, and I am a great deal worse than death. Death does not make you fill in a loss report."]] },
  { id: 'de_e2', story: true, ...Z, giver: 'prax', lvl: 1, pre: 'de_e1', name: 'Inventory Shrinkage', where: 'slag', xp: qx(1, .7), gold: 4, gear: true, obj: { kill: ['slagskitter'], n: 6, what: 'Kill 6 Slag Skitters on the edge of the Slag Fields, west of the Citadel' },
    say: ["I am four power couplings short this quarter, initiate, and I have traced the loss. Slag Skitters. They come in from the fields west of the wall, they eat the insulation, and they do not sign for it.", "Kill six of them. I would send the garrison, but the garrison would want it in writing, and then it would be on file that my armory has vermin. You, on the other hand, do not officially exist until you make acolyte."],
    done: ["Six. Good. I shall enter them as 'shrinkage, resolved'. Here, this was surplus. It was surplus because the initiate it was issued to turned out to be surplus too. Don't dwell on it."] },
  { id: 'de_e3', story: true, ...Z, giver: 'kell', lvl: 2, pre: 'de_e2', name: 'The Staff', where: 'culls', xp: qx(2, .65), gold: 5, obj: { inspect: 'tagpost', n: 5, what: "Collect the tags of 5 fallen initiates in the Culls, east of the Citadel" },
    say: ["There you are, dear. Odo says you're reliable, which from Odo is practically a love letter. I need a little errand run. Out east, in the Culls, there are initiates from the old cohorts lying about where they fell. Such a waste. Nobody's even collected their tags.", "Bring me five tags. I can't call a person back to work without their name, it's only polite. The Unchosen will object. They're very sentimental about their dead, for people who keep making more of them."],
    done: ["Five. Oh, I remember this one, she had a lovely singing voice. She'll be on the door by the end of the week. You see, dear? That's the art. Nothing dreadful about it. Nobody in the Covenant is ever really let go."] },
  { id: 'de_e4', story: true, ...Z, giver: 'ilka', lvl: 2, pre: 'de_e3', name: 'Practice', where: 'culls', xp: qx(2, .75), gold: 6, obj: { kill: UNC, n: 10, what: 'Defeat 10 Unchosen or Unchosen Scavengers in the Culls' },
    say: ["Hesper says the Unchosen took exception to you tidying up. Good! That means they're feeling lively, and a lively target teaches you more than a dummy does.", "Go back and put down ten of them. Don't feel bad about it. They had exactly the same chance you did, and they flinched. The dark doesn't want the ones who flinch, and neither do I."],
    done: ["Ten! And you're not even limping. I'm putting a note on your file. It says 'promising', which is the second-best word I use. The best is 'alive at the end'. We'll see."] },
  { id: 'de_e5', story: true, ...Z, giver: 'venn', lvl: 3, pre: 'de_e4', name: 'The First of Them', where: 'cullsdeep', xp: qx(3, .8), gold: 12, gear: true, lore: 'gauntwall', obj: { named: 'gaunt', n: 1, what: 'Defeat Old Gaunt, First of the Unchosen, at his wall in the Culls' },
    say: ["The Unchosen have a leader. A man called Gaunt, who failed my first Winnowing nineteen years ago and has sat on that hill ever since, watching me through a spyglass and writing on a wall. I have let him. An old enemy who does nothing is a kind of pet.", "But he has started telling the new failures what he thinks I am doing here, and a pet that talks is another matter. Go and end it. And read his wall before you leave, initiate. I would rather you saw it from him than wondered."],
    done: ["You read it. Good. He was wrong about a great deal, and right about one word. Yes. Wicks. You are wondering whether to be afraid. Don't trouble yourself yet. A wick is a valuable thing, and I am very careful with what I value."] },
  { id: 'de_e6', story: true, ...Z, giver: 'venn', lvl: 3, pre: 'de_e5', name: 'Poured Steel', where: 'foundry', xp: qx(3, .8), gold: 12, obj: { kill: REBS, n: 10, what: 'Defeat 10 rebels at the Old Foundry, north-west along the Ash Road' },
    say: ["The Old Foundry poured the Citadel's steel until we brought in machines. The hands we had shipped here to work it were told to go home. It did not occur to anyone that home had been dug up in the meantime.", "So they stayed, and now they have rifles, and they shoot at my supply lighters. Ten of them, initiate. Do not make speeches at them. They have a grievance and it is a fair one, which is precisely why it cannot be allowed to stand."],
    done: ["Ten. And you made no speeches. I asked Sergeant Tole to watch. You may find this strange, but I have more respect for those rebels than for half my own Covenant. They know exactly what they want. Very few people do."] },
  { id: 'de_e7', story: true, ...Z, giver: 'venn', lvl: 4, pre: 'de_e6', name: 'The Sky-Watcher', where: 'blind', xp: qx(4, .85), gold: 18, gear: true, lore: 'thornlog', obj: { named: 'kthorn', n: 1, what: 'Defeat Keeper Alise Thorn at the Lantern Blind, in the rocks to the north-east, and take her log' },
    say: ["The rebels' rifles are Republic pattern. Somebody is feeding them, and Sergeant Tole's scouts have found where from: a hide in the north-east rocks, with a telescope. The Republic's lamp-keepers have a Sentinel on my world.", "Her name is Alise Thorn. She is good, or she would not have lasted two hundred days out there. Kill her and bring me her log. I want to know what she has been telling Aurelis, and I particularly want to know which way her telescope points."],
    done: ["Straight up. Not at the Citadel at all. 'They are preparing for an appointment.' She was a perceptive woman. It is almost a pity. She asked an excellent question, initiate, about why I am not afraid. You will not ask it. Not yet. You will earn the answer, or you will not need it."] },
  { id: 'de_e8', story: true, ...Z, giver: 'ilka', turnTo: 'venn', lvl: 5, pre: 'de_e7', name: 'The Proving', where: 'vaultdeep', xp: qx(5, .9), gold: 28, gear: true, lore: 'cohortroll', obj: { named: 'nyx', n: 1, what: 'Defeat Initiate Nyx Varrow in the Proving Vault at the head of the valley, then report to Veil-Lord Venn' },
    say: ["It's time, and I'm ever so pleased. There are two of you left in the nineteenth cohort: you, and Veil-Lady Corriden's girl, Nyx Varrow. The roll only has room for one acolyte. That's not a rule, it's just how the slab was cut.", "She's waiting in the Proving Vault at the head of the valley. Mind the thralls on the way down, they're last year's. Take friends if you've made any. She won't have. Off you go! One of you come back."],
    done: [['venn', "You are here, so she is not. No? You left her breathing. Interesting. Explain yourself. No, don't. I can see it. You have understood something that takes most of us years."], ['venn', "A blade you have broken yourself is the only kind you can ever trust. Keep her. As for her mistress, Veil-Lady Corriden staked her seat on that duel, and she has lost it, along with certain other things. She no longer requires her ship. The Eventide is on the pad. It is yours, acolyte."]] },
  { id: 'de_e9', story: true, ...Z, giver: 'venn', turnTo: 'kell', lvl: 5, pre: 'de_e8', when: () => (S.hero?.lvl || 1) >= 5, name: 'The Dusk Rite', where: 'town', xp: qx(5, .3), gold: 10, obj: { talk: true, what: 'Go to Mortician Kell at the Ossuary for the Dusk Rite' },
    say: ["An acolyte carries the dusk. Those of you with the art will have it woken properly. Those without will have a dusk core seated in whatever you fight with, which does the same work less elegantly.", "Hesper performs the rite. She will tell you it does not hurt. She is a kind woman, in her way, and she lies beautifully."],
    done: ["Hold still, dear. This won't hurt a bit. There. Well, a bit. Well, quite a lot, but it's done now, and you were ever so brave. Look at that. It's taken beautifully. You'll feel the cold for a day or two. Then you'll stop noticing, and that's when to worry."] },
  { id: 'de_e10', story: true, ...Z, giver: 'venn', turnTo: 'nyx', lvl: 5, pre: 'de_e8', when: () => (S.hero?.lvl || 1) >= 5, name: 'A Blade You Broke Yourself', where: 'pad', xp: qx(5, .3), gold: 10, obj: { talk: true, what: 'Claim Nyx Varrow for your crew at the landing pad' },
    say: ["Your ship wants a crew, and the Empire does not issue one. You take what you can hold.", "Varrow is on the pad. She has no mistress, no rank and nowhere to go, and she knows every system on the Eventide, having expected to inherit it. Go and tell her who she works for. Be gracious. It costs nothing, and it is so much more annoying."],
    done: [['nyx', "So I belong to you now. Wonderful. I spent four years learning to fly that ship so that I could have it, and I'm to fly it for the one person on Cinder who's beaten me."], ['nyx', "Fine. Here are my terms, Captain. I'll fly, I'll fight, and I'll watch your back, because if anybody else kills you I lose my chance to. And one day, when I'm ready, I'll tell you to your face. Agreed? Good. Get aboard, your boots are on my ramp."]] },
  { id: 'de_e11', story: true, zone: 'hollow', path: 'dark', giver: 'venn', turnTo: 'marr', lvl: 5, pre: 'de_e8', name: 'The Tithe Is Short', where: 'town', xp: qx(5, .6), gold: 30, obj: { talk: true, what: 'Board the Eventide, plot a jump to Hollow at the helm, and report to Legate Marr at Ore Terminal Six' },
    say: ["Your first work as an acolyte. The tithe world of Hollow has sent the Empire nine parts in ten of the ore it owes, three quarters running. Ore does not go missing. People take it. I want to know who, and I want it stopped before the fleet I am assembling notices that its hulls are late.", "Legate Marr commands the garrison at Ore Terminal Six. Report to her. You were born on Hollow, I believe. You will find it smaller than you remember, and the people there will find you a good deal larger. That will be instructive for everyone."],
    done: [['marr', "Covenant. Wonderful. I ask for a battalion and an auditor, and the Empire sends me one acolyte in a dead woman's ship."], ['marr', "No, stay. I've read your file. You're from the Tithe Rows. That makes you the only officer on this rock who knows what the place is, so sit down. I'm Odessa Marr. I run the garrison, I don't run the mine, and that difference is the whole of my problem."]] },
  { id: 'de_a1', ...Z, giver: 'tole', lvl: 1, name: 'Heat Seekers', where: 'slag', xp: qx(1, .7), gold: 4, obj: { kill: ['cinderhound'], n: 8, what: 'Kill 8 Cinder Lurchers in the Slag Fields' },
    say: ["You'll do. I've lost two sentries off the west wall this month to lurchers. Eyeless things, hunt by body heat. A man standing still on a wall at night is the warmest thing for a mile.", "Thin them out for me. Eight would do it. I'd ask your Overseer for help, but the last time I did she offered to raise my sentries and send them back on duty. I had to sit down."],
    done: ["Eight. That's the wall quiet for a week or two. Ta. You're all right, for one of the robed lot. Don't tell them I said so. Don't tell them I said anything, come to that."] },
  { id: 'de_a2', ...Z, giver: 'tole', lvl: 3, pre: 'de_a1', name: 'The Slag Heap That Moves', where: 'slag', xp: qx(3, .7), gold: 14, gear: true, obj: { named: 'cinderjaw', n: 1, what: 'Kill Old Cinderjaw in the Slag Fields' },
    say: ["I've had the same report three times: a slag heap, big as a lighter, sat in the western fields. Three different grid squares. Slag heaps aren't meant to travel, as a rule.", "The lads call it Old Cinderjaw. I'd shell it, but your Veil-Lord doesn't like artillery near his rocks. So it's you. Take somebody along. Somebody who can run."],
    done: ["It opened like a flower? With a furnace in it? Right. I'm putting in for a transfer. I've put in for eleven. Here, that's the bounty. The whole garrison chipped in. That's how much nobody wanted to do it themselves."] },
  { id: 'de_a3', ...Z, giver: 'prax', lvl: 2, pre: 'de_e2', name: 'Loss Report', where: 'slag', xp: qx(2, .6), gold: 6, obj: { inspect: 'dcache', n: 4, what: 'Recover 4 lost supply crates from the Slag Fields' },
    say: ["A supply lighter came down short of the pad last month and shed its load across the Slag Fields. The pilot has been reassigned. To Mortician Kell.", "There are crates out there with my stencil on them, initiate, and every day they sit in the ash is a day my ledger is a lie. Find four. I do not mind what is in them. I mind that they are counted."],
    done: ["Four crates. Unopened? You didn't even look. Initiate, I have served four Veil-Lords and that is the most trustworthy thing anyone on Cinder has ever done. It worries me. Take this and go away before I start to like you."] },
  { id: 'de_a4', ...Z, giver: 'kell', lvl: 4, pre: 'de_e5', name: 'Misfiled', where: 'vault', xp: qx(4, .7), gold: 14, obj: { kill: ['vaultthrall'], n: 8, what: 'Put down 8 Vault Thralls in the Proving Vault' },
    say: ["Bit of an embarrassment, dear. The thralls in the Proving Vault were supposed to be stood down after last year's cohort, and somebody, I shan't say who, it was Odo, never sent me the form. So they're still down there, proving people.", "Be a love and put eight of them back to rest. Gently, if you can. They were initiates once, same as you. I do try to look after my staff."],
    done: ["Eight, all quiet. Thank you, dear. I'll have them brought up and given a proper niche. You've a kind heart, under all that. Do try to hide it. It's not the sort of thing that gets a person on in the Covenant."] },
  { id: 'de_a5', ...Z, giver: 'tole', lvl: 4, pre: 'de_e6', name: 'The Foreman', where: 'foundrydeep', xp: qx(4, .7), gold: 18, gear: true, obj: { named: 'dask', n: 1, what: 'Defeat Foreman Hale Dask at the Old Foundry' },
    say: ["The foundry cell's run by their old foreman, Hale Dask. I knew him. Used to play cards with him, back when the foundry was running. He cheated, but fairly, if you follow me.", "He'll not stop while he's standing, and my orders say he has to stop. I'd rather it was quick, and I'd rather it wasn't me. Go on. I'll be here not thinking about it."],
    done: ["It's done, then. Right. He'd have wanted it from someone who looked him in the eye. Here. And acolyte, or whatever they're calling you now. If you ever find yourself running things, remember he only wanted to go home. That's all any of that lot wanted."] },
);
CREW.nyx = { name: 'Nyx Varrow', pal: 2, flag: 'dcrew1', hi: "Varrow, aboard. I've adjusted the pilot's seat. It was set for a dead woman, and I'd rather not take the hint.", pick: role => role === 'tank' ? 'knifeshade' : 'wardancer' };
X.turnin.push(q => {
  if (q.id === 'de_e8') { S.flags.ship = 1; S.flags.nyxyield = 1; setTimeout(() => Game.storyFolk(), 50); chat('sys', null, 'The Eventide is yours by right of survival. Her ramp is down on the landing pad.'); }
  if (q.id === 'de_e9') grantLamp();
  if (q.id === 'de_e10') X.recruit?.('nyx');
});
Object.assign(LFG_D, { oldfoundry: { name: 'The Old Foundry', lvl: [3, 4], zone: 'cinder', at: () => ({ x: D6.foundry.x, z: D6.foundry.z + 50 }) }, provingvault: { name: 'The Proving Vault', lvl: [4, 5], zone: 'cinder', at: () => ({ x: D6.vault.x, z: D6.vault.z + 56 }) } });
