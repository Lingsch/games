// Stars Beneath, Build 5: Hollow, an Imperial tithe world (levels 6-10). The dark path's second world, and the
// hero's birthplace. Ore Terminal Six in the south, the Strip (a terraced open pit) to the west, the Tithe Rows where
// the miners live to the east, the Smelter in the north-east, the Deep Cut in the north-west, and the
// Governor's Spire on its hill at the top of the haul road.
import * as THREE from './three.js';
import { S, WH, TAU, lerp, mulberry32, makeNoise, chat, X } from './core.js';
import { addKinds } from './render.js';
import * as R from './render.js';
import { build, P, T, Cone, Cyl, Box, Sph, Oct } from './models.js';
import { H, HN, hgt, world, addWall, linkDoors, mergeBuilt, mat4, meshWithOutline, registerZone, ZONE_SIZE } from './world.js';
import { groundMesh } from './zones.js';
import { MOBS, QUESTS, GIVERS, xpNeed, makeItem } from './data.js';
import { MOB_LORE, TALK } from './dialogue.js';
import { LORE } from './story.js';
import { LFG_D } from './social6.js';
import * as Game from './game.js';
import * as UI from './ui.js';
import { habGeo, lampGeo, crateGeo, mastGeo, shipGeo, minimapFrom } from './moon1.js';
import { sfig } from './models3.js';
import { CREW, PADS } from './ship1.js';
import { DUSK_COLS } from './dark5.js';
const O = [0, 0, 0], LR = [1, -1];
ZONE_SIZE.hollow = 300;
export const D7 = { term: { x: 0, z: 165, R: 36, base: 6 }, pad: { x: 88, z: 182, R: 16 }, strip: { x: -150, z: 75, R: 78 }, rows: { x: 165, z: 50, R: 58 }, smelter: { x: 172, z: -120, R: 46 }, cut: { x: -165, z: -100, R: 44 }, spire: { x: 0, z: -205, R: 46 } };
PADS.hollow = { x: D7.pad.x, z: D7.pad.z + 17 };

const pal = (a, b, t, g) => ({ a, b, t, g }), HUM = [.6, .4, 1.6, .15], HEAVY = [.55, .4, 1.9, .15], STILL = [0, 0, 0, 0];
const IMP = pal('#2e2e34', '#18181c', '#c0392b', '#ff4a3a'), UB = pal('#5a6a52', '#2e362a', '#c8c8a8', '#9be36b'), GOV = pal('#e8e0c8', '#8a7a4a', '#d8b24a', '#ffcf6a'), MINER = pal('#8a7a4a', '#4a4026', '#e8a03a', '#ffcf6a');
addKinds({
  ub0: [sfig({ body: 'suit', knee: true, head: 'cap', r: 'wrench', l: null, scarf: '#9be36b' }, UB, 2), HUM, .05, .03], ub1: [sfig({ body: 'suit', vest: true, head: 'hood', r: 'rifle', l: null, scarf: '#9be36b' }, UB, 1), HUM, .05, .03],
  ub2: [sfig({ body: 'suit', head: 'bare', r: 'injector', l: 'medkit', scarf: '#9be36b' }, UB, 3), HUM, .05, .03], ub_boss: [sfig({ body: 'coat', head: 'bare', r: 'pistol', l: 'blade', scarf: '#9be36b', hair: '#a83a2a' }, UB, 3), HUM, .05, .035],
  gov0: [sfig({ body: 'armor', head: 'helmet', r: 'baton', l: 'shield' }, GOV, 0), HEAVY, .05, .035], gov1: [sfig({ body: 'armor', head: 'helmet', r: 'rifle', l: null }, GOV, 1), HEAVY, .05, .035], gov2: [sfig({ body: 'suit', vest: true, head: 'visor', r: 'injector', l: 'medkit' }, GOV, 2), HUM, .05, .03],
  gov_cap: [sfig({ body: 'armor', heavy: true, head: 'bare', r: 'maul', l: null, hair: '#1c2026', cloak: '#8a1a1a' }, GOV, 2), HEAVY, .05, .04],
  gov_boss: [sfig({ body: 'coat', head: 'bald', r: 'pistol', l: 'slate', scarf: '#d8b24a', cloak: '#f0ead8', skin: '#e8c8a8' }, pal('#f0ead8', '#8a7a4a', '#d8b24a', '#ffcf6a'), 0), HUM, .05, .035],
  n_marr: [sfig({ body: 'armor', head: 'cap', r: null, l: 'slate', hair: '#8a8a8a' }, IMP, 2), HEAVY, .05, .035],
  n_tacit: [sfig({ body: 'coat', head: 'droid', r: 'injector', l: null, skin: '#3a3a40' }, pal('#26262c', '#121216', '#c0392b', '#ff3a2a'), 0), HUM, .05, .03],
  n_fenn: [sfig({ body: 'suit', vest: true, knee: true, head: 'hat', r: null, l: 'slate', hair: '#8a8a8a' }, MINER, 1), HUM, .05, .03],
  tallypost: [build([P(T(Box(.5, 1.5, .3), 0, .75), 0, O, '#4a4a40'), P(T(Box(.4, .5, .05), 0, 1.15, .16, -.15), 0, O, '#ffcf6a', 1.6), P(T(Box(.7, .08, .5), 0, .04), 0, O, '#e8a03a'), P(T(Cyl(.03, .03, .6, 4), .2, 1.8), 0, O, '#2a2a2e'), P(T(Sph(.06, 5, 4), .2, 2.12), 0, O, '#ff4a3a', 2.4)]), STILL, 0, .03],
  duskanvil: [build([P(T(Cyl(.9, 1.1, .9, 6), 0, .45), 0, O, '#18181c'), P(T(Box(1.6, .3, .7), 0, 1.05), 0, O, '#26262c'), P(T(Box(1.5, .05, .1), 0, 1.22), 0, O, '#ff3a2a', 2.8), P(T(Oct(.36), 0, 1.9), 0, O, '#ff3a2a', 3.2)]), STILL, 0, .03],
});

const mob = (name, kind, o) => ({ name, kind, hpM: 1, dmgM: 1, spd: 5.4, range: 2.4, weak: 'fire', resist: null, scale: 1, aggro: 10, social: 9, ...o });
const BE = { beast: true }, HU = { human: true };
Object.assign(MOBS, {
  burrower: mob('Tunnel Burrower', 'a_crawler_deep', { hpM: 1, dmgM: .95, resist: 'earth', ...BE }), shaftfloater: mob('Shaft Floater', 'a_floater_deep', { hpM: .8, dmgM: .95, spd: 6, fly: .9, range: 14, ranged: true, school: 'poison', resist: 'poison', ...BE }),
  hauler: mob('Rogue Hauler', 'golempet', { hpM: 1.2, dmgM: .95, spd: 4.6, range: 2.8, weak: 'storm', resist: 'earth', scale: 1.05 }),
  unbowed: mob('Unbowed Fighter', 'ub0', { hpM: 1, dmgM: 1, weak: 'shadow', aggro: 12, social: 13, ...HU }), ubgun: mob('Unbowed Rifle', 'ub1', { hpM: .9, dmgM: 1.05, range: 22, ranged: true, weak: 'shadow', aggro: 13, social: 13, ...HU }),
  ubmed: mob('Unbowed Medic', 'ub2', { hpM: .85, dmgM: .8, range: 16, ranged: true, caster: true, healer: true, school: 'storm', weak: 'shadow', aggro: 12, social: 13, ...HU }),
  enforcer: mob('Spire Enforcer', 'gov0', { hpM: 1.15, dmgM: 1, weak: 'storm', aggro: 12, social: 13, ...HU }), spiregun: mob('Spire Marksman', 'gov1', { hpM: .9, dmgM: 1.05, range: 22, ranged: true, weak: 'storm', aggro: 13, social: 13, ...HU }),
  adjutant: mob('Spire Adjutant', 'gov2', { hpM: .85, dmgM: .8, range: 16, ranged: true, caster: true, healer: true, school: 'storm', weak: 'storm', aggro: 12, social: 13, ...HU }),
  ochrebuyer: mob('Syndicate Buyer', 'syn1', { hpM: .95, dmgM: 1.05, range: 20, ranged: true, weak: 'storm', aggro: 12, social: 13, ...HU }), ochreheavy: mob('Syndicate Loader', 'syn3', { hpM: 1.2, dmgM: 1, weak: 'storm', aggro: 12, social: 13, ...HU }),
  deepburrower: mob('Deep Burrower', 'a_crawler_deep', { hpM: 1.15, dmgM: 1.05, resist: 'earth', scale: 1.25, aggro: 12, social: 12, ...BE }), broodfloater: mob('Brood Floater', 'a_floater_deep', { hpM: .85, dmgM: 1, fly: .9, range: 14, ranged: true, school: 'poison', resist: 'poison', aggro: 12, social: 12, ...BE }),
});
const boss = (name, kind, o) => ({ name, kind, hpM: 1.2, dmgM: 1.05, spd: 5.2, range: 2.8, weak: 'storm', resist: null, scale: 1.3, aggro: 14, social: 18, ...o });
Object.assign(MOBS, {
  bigshift: boss('Big Shift', 'golempet', { scale: 1.7, resist: 'earth', mechs: ['slam', 'cleave'], lines: { start: '*An ore hauler the size of a bunkhouse swings round on its treads. Somebody has painted a smile on the front. It has not helped.*', half: '*QUOTA NOT MET. QUOTA NOT MET.*' } }),
  lark: boss('Tamsin Reyes, the Lark', 'ub_boss', { ...HU, scale: 1.1, range: 18, ranged: true, weak: 'shadow', mechs: ['pool', 'call'], adds: 'unbowed', lines: { start: "I know you. You're the Okoro Street kid they took in the last levy. Look at you, all in black. Did they tell you what happened to the other thirty-nine?", half: "To me! Don't let them take the satchel!" } }),
  oyel: boss('Three-Finger Oyelaran', 'syn_kade', { ...HU, scale: 1.1, range: 18, ranged: true, mechs: ['pool', 'call'], adds: 'ochreheavy', lines: { start: "Covenant! Now, friend, before anything hasty: the Ochre Syndicate has a very fair rate for looking the other way, and I am authorised to round it up.", half: "Loaders! Earn your cut!" } }),
  deepmother: boss('The Deep Mother', 'a_mauler_deep', { ...BE, hpM: 1.5, scale: 1.7, weak: 'fire', resist: 'earth', mechs: ['cleave', 'slam', 'call', 'enrage'], adds: 'deepburrower', lines: { start: '*The floor of the cut is not a floor. It unfolds, plate by plate, from around something it has been nesting on, and the mouth that opens is wider than the tunnel.*', half: '*She calls, and the walls answer.*', enrage: '*She will not be moved off it. Whatever it is, she has decided it is hers.*' } }),
  sull: boss('Praetor Kaius Sull', 'gov_cap', { ...HU, scale: 1.25, mechs: ['cleave', 'slam'], lines: { start: "The Governor-General is not receiving. He is particularly not receiving the Covenant. I'm told you were a miner's brat. Go back down the hill, brat.", half: "Guard! To the stair!" } }),
  prask: boss('Governor-General Aurel Prask', 'gov_boss', { ...HU, hpM: 1.7, scale: 1.2, range: 18, ranged: true, mechs: ['pool', 'call', 'fear', 'enrage'], adds: 'spiregun', lines: { start: "Venn's new creature. Come in, wipe your feet. Yes, I sold the ore. I have seen the plans for his fleet, child. Do you know what those ships are fitted to carry? Not guns. I would sooner arm pirates.", half: "Guards! Guards! I am the Governor-General of this world!", enrage: "He is going to feed you to it! All of you! Why do you think he only wants the ones who listen?" } }),
});
Object.assign(MOB_LORE, {
  burrower: 'A chain of armoured segments with a ring of teeth at the front. They lived a mile down and bothered nobody until the Deep Cut reached them.', shaftfloater: 'A gas bag that rises out of the ventilation shafts trailing stinging threads. The miners call them lanterns, and do not mean it kindly.',
  hauler: 'An ore hauler running on a damaged quota routine. It is still trying to make its numbers, with whatever is nearest.',
  unbowed: 'A miner of the Tithe Rows who has stopped going down the shaft and started keeping a list.', ubgun: 'One of the Unbowed with a rifle older than the occupation.', ubmed: 'A Rows medic. She has set more broken miners than the company doctor has ever met.',
  enforcer: "The Governor's own guard: gilt plate, paid in ore, loyal to the man and not the Empire.", spiregun: 'A Spire marksman. The Governor likes to know who is coming up his hill.', adjutant: "One of the Governor's adjutants, who keeps two sets of books and a medkit.",
  ochrebuyer: 'A buyer for the Ochre Syndicate, a long way from Sunder and very well dressed for a smelter.', ochreheavy: 'Syndicate muscle, here to load carts that are not on any manifest.',
  deepburrower: 'A burrower from the bottom of the cut. Larger, paler, and guarding something.', broodfloater: 'A floater from the deep galleries. It glows the same green as the thing at the bottom.',
  bigshift: 'Hauler Nine, known as Big Shift. A crew painted a smile on it for luck in a good year.', lark: 'Tamsin Reyes sang in the Rows before the occupation. Now she leads the Unbowed, and carries a satchel she will not put down.',
  oyel: 'The Ochre Syndicate’s man on Hollow. He lost two fingers to a business disagreement and learned to count on the other hand.', deepmother: 'Whatever the miners broke into at the bottom of the Deep Cut, something very old had already made a nest of it.',
  sull: "Commander of the Governor's guard. He was a miner's son himself once and has spent thirty years making sure nobody mentions it.", prask: 'Governor-General of Hollow for eleven years. He has seen the plans for the fleet his ore is building, and decided he would rather steal.',
});

const sm = t => t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t);
registerZone('hollow', seed => {
  const rng = mulberry32(seed + 4747), N = makeNoise(seed + 4747), pk = a => a[(rng() * a.length) | 0];
  world.water = null;
  world.names = { zone: 'Hollow', town: 'Ore Terminal Six', boss: 'Governor-General Prask', ruin: "the Governor's Spire", wood: 'the Strip', fields: 'the Strip', waste: 'the Tithe Rows', road: 'the Haul Road', captain: 'Praetor Sull', tusk: 'Big Shift' };
  const Tm = D7.term, Pad = D7.pad, St = D7.strip, Rw = D7.rows, Sm = D7.smelter, Ct = D7.cut, Sp = D7.spire;
  const onRoad = (x, z) => (Math.abs(x) < 6 && z > -165 && z < 130) || (Math.abs(z - 55) < 5 && x > -90 && x < 170) || (Math.abs(z + 110) < 5 && Math.abs(x) < 180);
  const pool = (x, z) => sm((N.fbm(x * .02 + 5, z * .02 + 1, 2) - .68) * 12);            // tailings ponds
  for (let zi = 0; zi < HN; zi++) for (let xi = 0; xi < HN; xi++) {
    const x = xi - WH, z = zi - WH; let h = 6 + N.fbm(x * .01, z * .01, 3) * 5;
    h += sm(1 - Math.hypot(x - Sp.x, z - Sp.z) / 110) * 13;                               // the Spire's hill
    const ds = Math.hypot(x - St.x, z - St.z); if (ds < St.R) h = Math.min(h, 6 - Math.min(3, Math.floor((St.R - ds) / 14)) * 2.4);   // the Strip, cut in terraces
    h = lerp(-1, h, sm((Math.hypot((x - Ct.x) * 1.5, z - Ct.z) - Ct.R + 6) / 10));         // the Deep Cut
    for (const t of [Tm, Pad]) h = lerp(Tm.base, h, sm((Math.hypot(x - t.x, z - t.z) - t.R - 2) / 16));
    for (const t of [Rw, Sm]) h = lerp(6, h, sm((Math.hypot(x - t.x, z - t.z) - t.R * .7) / 18));
    h = lerp(18.5, h, sm((Math.hypot(x - Sp.x, z - Sp.z) - Sp.R * .55) / 12));
    if (onRoad(x, z) && ds > St.R) h = lerp(h, Math.max(h, 6), .5);
    const edge = Math.max(Math.abs(x), Math.abs(z)) - (WH - 24); if (edge > 0) h += edge * edge * .1;
    H[zi * HN + xi] = h;
  }
  const ROCK = new THREE.Color('#6a6a5a'), PALE = new THREE.Color('#8a8672'), ORE = new THREE.Color('#8a5a3a'), TAIL = new THREE.Color('#7adf5a'), ROADC = new THREE.Color('#4a4a44'), MUD = new THREE.Color('#5a5244'), DARKC = new THREE.Color('#2a2e2a'), HAZ = new THREE.Color('#e8a03a'), PADC = new THREE.Color('#44444a'), GILT = new THREE.Color('#d8b24a');
  const colorAt = (x, z) => {
    let c = ROCK.clone().lerp(PALE, N.fbm(x * .03, z * .03, 2));
    const ds = Math.hypot(x - St.x, z - St.z); if (ds < St.R + 6) { c.lerp(ORE, .55); if ((St.R - ds) % 14 < 1.2 && ds < St.R) c.lerp(DARKC, .6); }
    const p = pool(x, z); if (p > 0 && ds > St.R + 8 && !onRoad(x, z) && ![Tm, Pad, Rw, Sm, Sp].some(t => Math.hypot(x - t.x, z - t.z) < t.R + 8)) c.lerp(TAIL, p * .85);
    if (Math.hypot(x - Rw.x, z - Rw.z) < Rw.R + 14) c.lerp(MUD, .6);
    if (Math.hypot((x - Ct.x) * 1.5, z - Ct.z) < Ct.R) c.lerp(DARKC, .7);
    if (onRoad(x, z)) { c.lerp(ROADC, .75); if (Math.abs(x) < .5 && z > -165 && z < 130 && Math.floor(z / 4) % 2) c.lerp(HAZ, .8); }
    const dt = Math.hypot(x - Tm.x, z - Tm.z); if (dt < Tm.R) { c.lerp(ROADC, .7); if (Math.abs(dt - Tm.R + 2) < .7) c.lerp(HAZ, .8); }
    const dp = Math.hypot(x - Pad.x, z - Pad.z); if (dp < Pad.R) { c.lerp(PADC, .85); if (Math.abs(dp - Pad.R + 1.5) < .6) c.lerp(new THREE.Color('#c0392b'), .9); }
    const dg = Math.hypot(x - Sp.x, z - Sp.z); if (dg < Sp.R * .6) { c.lerp(new THREE.Color('#e8e0c8'), .7); if (Math.abs(dg - Sp.R * .5) < .7) c.lerp(GILT, .8); }
    const sh = .93 + N.n2(x * .3, z * .3) * .1; return new THREE.Color(c.r * sh, c.g * sh, c.b * sh);
  };
  groundMesh(colorAt);
  world.regionNames = ['The Strip', 'The Tithe Rows', 'The Smelter', 'The Deep Cut', "The Governor's Hill", 'Ore Terminal Six'];
  world.regionFn = (x, z) => Math.hypot(x - Sp.x, z - Sp.z) < 100 ? 4 : Math.hypot(x - Ct.x, z - Ct.z) < 80 ? 3 : Math.hypot(x - Sm.x, z - Sm.z) < 85 ? 2 : x > 80 && z < 130 ? 1 : x < -60 ? 0 : 5;
  const items = [], put = (geo, x, z, ry = 0, s = 1) => items.push({ geo, m: mat4(x, hgt(x, z), z, ry, s) });
  const solid = (x, z, w, d, ry = 0) => { const c = Math.cos(ry), s = Math.sin(ry), pt = (lx, lz) => [x + lx * c + lz * s, z - lx * s + lz * c]; const k = [pt(-w / 2, -d / 2), pt(w / 2, -d / 2), pt(w / 2, d / 2), pt(-w / 2, d / 2)]; for (let i = 0; i < 4; i++) addWall(k[i][0], k[i][1], k[(i + 1) % 4][0], k[(i + 1) % 4][1], .3); };
  const ring = (cx, cz, r, n = 10) => { for (let k = 0; k < n; k++) { const a = k / n * TAU, b = (k + 1) / n * TAU; addWall(cx + Math.cos(a) * r, cz + Math.sin(a) * r, cx + Math.cos(b) * r, cz + Math.sin(b) * r, .5); } };
  const gantry = () => build([...LR.map(s => P(T(Box(.8, 12, .8), 5 * s, 6), 0, O, '#e8a03a')), P(T(Box(12, 1, 1.2), 0, 12), 0, O, '#c8782a'), P(T(Box(1.6, 3, 1.6), 1.5, 9.6), 0, O, '#3a3f46'), P(T(Cyl(.08, .08, 5, 4), 1.5, 6), 0, O, '#1c2026'), P(T(Sph(.3, 6, 5), -5, 12.8), 0, O, '#ff4a3a', 2.4)]);
  const silo = (h, col) => build([P(T(Cyl(3.4, 3.4, h, 10), 0, h / 2), 0, O, col), P(T(Sph(3.4, 10, 5, 0, TAU, 0, Math.PI / 2), 0, h), 0, O, '#4a4a44'), P(T(Box(1, h, .3), 0, h / 2, 3.4), 0, O, '#e8a03a')]);
  // Ore Terminal Six: silos, a loading gantry, the garrison block and the company store
  for (const [dx, dz, h] of [[-12, 24, 16], [-4, 28, 20], [5, 27, 14]]) { put(silo(h, pk(['#6a6a5a', '#7a7462'])), Tm.x + dx, Tm.z + dz); ring(Tm.x + dx, Tm.z + dz, 3.6, 8); }
  put(gantry(), Tm.x + 20, Tm.z + 22, .3);
  for (const [dx, dz, ry, w, d, col, trim] of [[-24, -8, .2, 12, 7, '#34343a', '#c0392b'], [24, -10, -.2, 10, 6, '#5a5a4e', '#e8a03a'], [-27, 12, Math.PI / 2, 8, 5, '#4a4a44', '#c0392b']]) { put(habGeo(w, d, col, trim), Tm.x + dx, Tm.z + dz, ry); solid(Tm.x + dx, Tm.z + dz, w, d, ry); }
  for (const [dx, dz] of [[-10, -8], [10, -8], [-16, 4], [16, 4], [-6, -24], [6, -24], [42, 12], [62, 14]]) put(lampGeo(), Tm.x + dx, Tm.z + dz);
  put(mastGeo(), Tm.x - 30, Tm.z - 16);
  put(shipGeo('#2c2c34', '#c0392b'), Pad.x, Pad.z, Math.PI); solid(Pad.x, Pad.z - 1, 9, 13);
  // the Strip: gantries on the terraces, and ore carts nobody is pushing
  for (let i = 0; i < 6; i++) { const a = i / 6 * TAU + .4, d = St.R - 8 - (i % 3) * 14; put(gantry(), St.x + Math.cos(a) * d, St.z + Math.sin(a) * d, a); }
  for (let i = 0; i < 22; i++) { const a = rng() * TAU, d = rng() * (St.R - 6); put(build([P(T(Box(2.2, 1.2, 1.4), 0, .9), 0, O, '#5a5244'), P(T(Box(2, .5, 1.2), 0, 1.6), 0, O, '#8a5a3a'), ...LR.map(s => P(T(Cyl(.4, .4, 1.6, 6), .7 * s, .4, 0, Math.PI / 2), 0, O, '#1c2026'))]), St.x + Math.cos(a) * d, St.z + Math.sin(a) * d, rng() * TAU); }
  // the Tithe Rows: three streets of bunkhouses in rows, very close together
  for (let r = 0; r < 4; r++) for (let k = 0; k < 6; k++) { const x = Rw.x - 34 + k * 13.5, z = Rw.z - 30 + r * 19; if (Math.abs(z - 55) < 9 || Math.hypot(x - (Rw.x + 6), z - (Rw.z - 4)) < 12) continue; put(habGeo(9, 5, pk(['#5a5244', '#62584a', '#4e483c']), pk(['#9be36b', '#8a5a3a', '#6a6a5a'])), x, z, 0); solid(x, z, 9, 5); }
  for (let i = 0; i < 14; i++) put(crateGeo(), Rw.x + (rng() - .5) * 90, Rw.z + (rng() - .5) * 70, rng() * TAU, .8 + rng() * .6);
  // the Smelter: one long hall, three stacks and the glow of something being poured that is on no manifest
  put(build([P(T(Box(30, 10, 16), 0, 5), 0, O, '#4a443c'), P(T(Box(31, 1, 17), 0, 10.5), 0, O, '#2e2a26'), ...[-10, 0, 10].map(x => P(T(Box(4, 5, .4), x, 2.5, 8.1), 0, O, '#ff8a2a', 1.8)), ...[-10, 0, 10].map((x, i) => P(T(Cyl(1.8, 2.4, 20 + i * 4, 8), x, 10 + i * 2, -5), 0, O, '#3a342e')), ...[-10, 0, 10].map((x, i) => P(T(Cyl(1.5, 1.5, .5, 8), x, 20.3 + i * 4, -5), 0, O, '#ff6a1a', 2.4))]), Sm.x, Sm.z - 20); solid(Sm.x, Sm.z - 20, 30, 16);
  put(shipGeo('#7a5a2a', '#e8a03a'), Sm.x - 22, Sm.z + 16, 1.1, 1.2); solid(Sm.x - 22, Sm.z + 16, 13, 13);
  for (let i = 0; i < 18; i++) put(crateGeo(), Sm.x + (rng() - .5) * 60, Sm.z + (rng() - .1) * 40, rng() * TAU, 1 + rng());
  // the Deep Cut: props across a slot in the ground, and a green light at the far end that is not a lamp
  for (let k = 0; k < 7; k++) put(build([P(T(Box(26, .8, 1), 0, 9, 0), 0, O, '#e8a03a'), ...LR.map(s => P(T(Box(1, 10, 1), 12.5 * s, 4.5), 0, O, '#8a7a4a')), P(T(Sph(.3, 6, 5), 0, 8.2, 0), 0, O, k > 4 ? '#8dff5a' : '#ffcf6a', 2.4)]), Ct.x, Ct.z + 34 - k * 11, 0);
  put(build([P(T(Cyl(4.6, 5, .5, 12), 0, .25), 0, O, '#1c2420'), P(T(Cyl(3.6, 3.6, .1, 12), 0, .55), 0, O, '#8dff5a', 1.6), ...Array.from({ length: 12 }, (_, k) => P(T(Box(.7, 2.4, .5), Math.cos(k / 12 * TAU) * 5.6, 1.2, Math.sin(k / 12 * TAU) * 5.6, 0, -k / 12 * TAU), 0, O, k % 4 === 3 ? '#3a4a42' : '#22262a'))]), Ct.x, Ct.z - 36);
  // the Governor's Spire: white and gilt, on the only hill the mine was told to leave alone
  put(build([P(T(Cyl(10, 11.5, 7, 8), 0, 3.5), 0, O, '#e8e0c8'), P(T(Cyl(6.5, 8, 12, 8), 0, 13), 0, O, '#f0ead8'), P(T(Cyl(3.4, 5, 12, 8), 0, 25), 0, O, '#e8e0c8'), P(T(Cone(3.6, 9, 8), 0, 35.5), 0, O, '#d8b24a'), ...[7, 19, 31].map(y => P(T(Cyl(11 - y * .22, 11 - y * .22, .5, 8), 0, y), 0, O, '#d8b24a')), P(T(Box(4, 5, 1), 0, 2.5, 10.9), 0, O, '#2a2e34'), P(T(Oct(1.1), 0, 41), 0, O, '#ffcf6a', 3)]), Sp.x, Sp.z - 8);
  ring(Sp.x, Sp.z - 8, 11.4);
  meshWithOutline(mergeBuilt(items), .05); linkDoors();
  world.places = [{ name: 'Ore Terminal Six', x: Tm.x, z: Tm.z, R: Tm.R, kind: 'town' }, { name: 'The Landing Field', x: Pad.x, z: Pad.z, R: Pad.R, kind: 'town' }, { name: 'The Strip', x: St.x, z: St.z, R: St.R, kind: 'camp' }, { name: 'The Tithe Rows', x: Rw.x, z: Rw.z, R: Rw.R, kind: 'camp' },
    { name: 'The Smelter', x: Sm.x, z: Sm.z, R: Sm.R, kind: 'camp' }, { name: 'The Deep Cut', x: Ct.x, z: Ct.z, R: Ct.R, kind: 'dungeon' }, { name: "The Governor's Spire", x: Sp.x, z: Sp.z, R: Sp.R, kind: 'dungeon' }];
  world.town = Tm;
  world.towns = [{ key: 'term', name: 'Ore Terminal Six', x: Tm.x, z: Tm.z, R: Tm.R, guardName: 'Garrison Trooper', npcs: [['giver', 'marr', 0, 2], ['giver', 'tacit', -19, -5], ['giver', 'fenn', 19, -8], ['vendor', 'holl', 12, 8], ['bind', null, -8, 8]], guards: [[-5, -Tm.R + 4], [5, -Tm.R + 4], [Tm.R - 5, 0], [-Tm.R + 5, 0], [28, 14], [-12, -18]] }];
  world.storyNpcs.push({ key: 'venn', x: Tm.x + 8, z: Tm.z - 14, yaw: 2.6, when: ['vennhere', '*'] });
  world.mapLabels = [{ t: 'Burrowers, rogue haulers (6-7)', x: St.x, z: St.z + 46 }, { t: 'The Unbowed (7-8)', x: Rw.x, z: Rw.z + 40 }, { t: "The Governor's skim (8-9)", x: Sm.x, z: Sm.z + 34 }, { t: 'The Deep Cut (8-9)', x: Ct.x, z: Ct.z + 44 }, { t: "The Governor's Spire (9-10)", x: Sp.x, z: Sp.z + 60 }];
  world.zoneLines.push({ x: Pad.x, z: Pad.z + 11, r: 2.6, to: 'ship', label: 'Board the Eventide' });
  Object.assign(world.spots, { town: { x: Tm.x, z: Tm.z }, pad: { x: Pad.x, z: Pad.z }, strip: { x: St.x, z: St.z }, rows: { x: Rw.x, z: Rw.z }, rowsdeep: { x: Rw.x + 6, z: Rw.z - 4 }, smelter: { x: Sm.x - 8, z: Sm.z + 14, r: 30 }, cut: { x: Ct.x, z: Ct.z + 20 }, cutdeep: { x: Ct.x, z: Ct.z - 30 }, spire: { x: Sp.x, z: Sp.z + 40 }, spiredeep: { x: Sp.x, z: Sp.z + 10 } });
  world.clearSpots = [{ x: Tm.x, z: Tm.z, r: Tm.R + 24 }, { x: Pad.x, z: Pad.z, r: Pad.R + 20 }];
  const prop = (kind, tag, name, x, z, o = {}) => world.props.push({ id: 'h' + world.props.length, kind, tag, name, x, z, yaw: o.yaw ?? rng() * TAU, lore: o.lore || null, scale: o.scale || 1, when: o.when, unless: o.unless });
  for (let i = 0; i < 8; i++) { const x = Rw.x - 40 + (i % 4) * 27, z = Rw.z - 20.5 + Math.floor(i / 4) * 38; prop('tallypost', 'tally', 'Tithe tally post', x, z, { yaw: 0 }); }
  prop('duskanvil', 'anvil', 'The Dusk Anvil', Tm.x - 10, Tm.z + 2, { yaw: 0 });
  prop('crate', 'lore', "The Lark's satchel", Rw.x + 8, Rw.z - 2, { lore: 'larkletter', yaw: 1 }); prop('console', 'lore', 'The chamber under the cut', Ct.x + 4, Ct.z - 30, { lore: 'wickchamber', yaw: 2 }); prop('console', 'lore', "The Governor's ledger", Sp.x - 6, Sp.z + 14, { lore: 'praskledger', yaw: 0 });
  const sp = world.spawns, put2 = o => sp.push({ ...o, y: hgt(o.x, o.z), alive: null, timer: 0 });
  const free = p => !world.clearSpots.some(c => Math.hypot(c.x - p.x, c.z - p.z) < c.r) && Math.max(Math.abs(p.x), Math.abs(p.z)) < WH - 30 && !world.walls.some(w => Math.hypot((w.x1 + w.x2) / 2 - p.x, (w.z1 + w.z2) / 2 - p.z) < 5);
  const land = (c, rad, min = 10) => { for (let i = 0; i < 300; i++) { const a = rng() * TAU, d = Math.sqrt(rng()) * rad, p = { x: c.x + Math.cos(a) * d, z: c.z + Math.sin(a) * d }; if (free(p) && !sp.some(s => Math.hypot(s.x - p.x, s.z - p.z) < min)) return p; } return null; };
  const scatter = (n, c, rad, mobs, lvl, area, o = {}) => { for (let i = 0; i < n; i++) { const p = land(c, rad, o.min || 12); if (p) put2({ ...p, mob: pk(mobs), lvl, respawn: 60, area, ...o }); } };
  const camp = (n, c, rad, mobs, lvl, area, tag, o = {}) => { for (let i = 0; i < n; i++) { const p = land(c, rad, 22); if (!p) continue; for (let k = 0; k < mobs.length; k++) { const a = k / mobs.length * TAU; put2({ x: p.x + Math.cos(a) * 3, z: p.z + Math.sin(a) * 3, mob: mobs[k], lvl, respawn: 85, camp: tag + i, area, solo: true, ...o }); } } };
  scatter(36, St, St.R + 8, ['burrower', 'burrower', 'shaftfloater', 'hauler', 'hauler'], [6, 7], 0, { solo: true }); scatter(8, { x: -70, z: 0 }, 40, ['burrower', 'shaftfloater'], [7, 7], 0, { solo: true });
  scatter(12, Rw, Rw.R, ['unbowed', 'ubgun'], [7, 7], 1, { solo: true }); camp(8, Rw, Rw.R, ['unbowed', 'ubgun'], [7, 8], 1, 'rw'); camp(3, Rw, Rw.R, ['unbowed', 'ubgun', 'ubmed'], [8, 8], 1, 'rx');
  put2({ x: Rw.x + 6, z: Rw.z - 4, mob: 'lark', lvl: [8, 8], respawn: 900, named: 'lark', area: 1 });
  camp(7, Sm, Sm.R, ['enforcer', 'ochrebuyer'], [8, 9], 2, 'sm'); camp(4, Sm, Sm.R - 8, ['enforcer', 'spiregun', 'ochreheavy'], [8, 9], 2, 'sn');
  put2({ x: Sm.x - 16, z: Sm.z + 10, mob: 'oyel', lvl: [8, 8], respawn: 900, named: 'oyel', area: 2 });
  [[-5, 30, ['deepburrower', 'broodfloater']], [5, 20, ['deepburrower', 'deepburrower', 'broodfloater']], [-5, 8, ['broodfloater', 'deepburrower']], [5, -4, ['deepburrower', 'broodfloater', 'deepburrower']], [-4, -16, ['deepburrower', 'deepburrower']], [4, -24, ['broodfloater', 'deepburrower', 'broodfloater']]].forEach(([dx, dz, mobs], i) => mobs.forEach((m, k) => put2({ x: Ct.x + dx + (k % 2) * 2.2, z: Ct.z + dz + (k > 1 ? 2.2 : 0), mob: m, lvl: [8, 9], respawn: 240, camp: 'ct' + i, area: 3, dungeon: true, solo: true })));
  put2({ x: Ct.x, z: Ct.z - 34, mob: 'deepmother', lvl: [9, 9], respawn: 1200, named: 'deepmother', area: 3, dungeon: true, boss: true });
  [[-20, 46, ['enforcer', 'spiregun']], [20, 44, ['enforcer', 'adjutant', 'spiregun']], [-26, 18, ['spiregun', 'spiregun', 'enforcer']], [26, 16, ['enforcer', 'adjutant', 'spiregun']], [-14, 28, ['enforcer', 'enforcer', 'adjutant']], [14, 30, ['spiregun', 'enforcer', 'spiregun']]].forEach(([dx, dz, mobs], i) => mobs.forEach((m, k) => put2({ x: Sp.x + dx + (k % 2) * 2.2, z: Sp.z + dz + (k > 1 ? 2.2 : 0), mob: m, lvl: [9, 10], respawn: 240, camp: 'sp' + i, area: 4, dungeon: true, solo: true })));
  put2({ x: Sp.x + 10, z: Sp.z + 36, mob: 'sull', lvl: [9, 9], respawn: 900, named: 'sull', area: 4, dungeon: true, boss2: true });
  put2({ x: Sp.x, z: Sp.z + 14, mob: 'prask', lvl: [10, 10], respawn: 1400, named: 'prask', area: 4, dungeon: true, boss: true });
  { const p = land({ x: St.x + 10, z: St.z - 10 }, 26, 16) || { x: St.x + 10, z: St.z - 10 }; put2({ ...p, mob: 'bigshift', lvl: [7, 7], respawn: 600, named: 'bigshift', area: 0 }); }
  world.huntAreas = [{ area: 0, lvl: [6, 7] }, { area: 1, lvl: [7, 8] }, { area: 2, lvl: [8, 9] }, { area: 3, lvl: [8, 9] }, { area: 4, lvl: [9, 10] }];
  world.trees = [];
  world.minimap = minimapFrom(colorAt);
  return world;
});
X.light.push(() => { if (S.zone !== 'hollow') return; const u = R.skyMat.uniforms; u.top.value.lerp(new THREE.Color('#4a5038'), .6); u.mid.value.lerp(new THREE.Color('#9a9a6a'), .6); u.hor.value.lerp(new THREE.Color('#d8c88a'), .6); R.scene.fog.color.lerp(new THREE.Color('#8a8a62'), .6); });
X.zone.push(zone => { if (zone === 'hollow') S.ext.sys = 'hollow'; });

// ---------- people ----------
Object.assign(X.vend, { holl: 'Company Store Clerk Odd' });
Object.assign(GIVERS, {
  marr: { name: 'Legate Odessa Marr', title: 'Commanding, Hollow garrison', model: 'n_marr' }, tacit: { name: 'TACIT-4', title: 'Interrogation droid · unassigned', model: 'n_tacit' },
  fenn: { name: 'Shift-Boss Garrow Fenn', title: 'The Strip', model: 'n_fenn' },
});
Object.assign(TALK, {
  marr: { bio: "Odessa Marr has commanded the Hollow garrison for six years and has asked to be relieved of it for five. She is an honest officer in a posting that punishes the habit, and she has a drawer full of reports about the Governor that nobody upstairs has ever answered.",
    greet: ["Acolyte. If you've come to tell me the Covenant has taken an interest, I'd like it noted that I asked for an auditor.", "I hold the terminal, the road and the landing field. The Governor holds the mine, the smelter and the payroll. You can see how well that's going from here."],
    topics: [{ q: 'What is wrong with Hollow?', a: ["The tithe's short, the miners are in revolt, and things are coming up out of the Deep Cut that aren't on any survey. Other than that it's a lovely posting.", "And every time I try to pull one of those threads, it runs up that hill to the white tower with the gold roof. I'm a legate. He's a Governor-General. I can't so much as knock."] },
      { q: 'What do you think of the Covenant?', a: ["Honestly? You frighten my troopers and you give me a headache. But your Veil-Lord can walk into that Spire and I can't, so today I think you're marvellous.", "Ask me again when you've finished. I've noticed that when the Covenant solves a problem, it tends to stay solved in a way nobody enjoys."] }] },
  tacit: { bio: "TACIT-4 is a Covenant interrogation droid, assigned to the Hollow garrison nine years ago and given almost nothing to do since. It has exquisite manners, eleven attachments and a deep professional sadness. It dislikes the word 'torture', which it considers lazy.",
    greet: ["Good day. I am TACIT-4. I am told I should say at once that I am not going to hurt you. I find it puts people at their ease, briefly.", "It has been four hundred and six days since anyone was sent to me for a conversation. One does begin to feel unappreciated."],
    topics: [{ q: 'What exactly do you do?', a: ["I am a conversational facilitator. A subject arrives not wishing to discuss a matter, and leaves having discussed it thoroughly. The attachments are largely for emphasis.", "In my experience, nine subjects in ten will tell you everything if you simply sit quietly and look as though you already know. I am very good at sitting quietly. I have no eyelids."] },
      { q: 'Why have you had no work?', a: ["The Governor-General prefers to conduct his own inquiries, up at the Spire, with his own people. Subjects go up the hill. They do not come down to me, and they do not, as a rule, come down.", "I do not object to being replaced. I object to being replaced by amateurs. They ask the wrong questions. Chiefly, they never ask about the ore."] }] },
  fenn: { bio: "Garrow Fenn has been a shift-boss on the Strip for thirty years, the last eleven of them for the Empire. He kept his crews fed by keeping the quota, and half the Rows have never forgiven him for it. The other half are alive.",
    greet: ["Well. Look at you. Covenant black. I knew your people on Okoro Street. Keep your hood up in the Rows, is my advice. Folk won't know whether to spit or salute.", "I make quota. That's all I do. I make quota, and my crews eat, and I don't look up the hill. It's not much of a creed but I've buried fewer than most."],
    topics: [{ q: 'What happened after the levy took me?', a: ["They took forty of you. Told the Rows it was an honour. Your street lit candles for a month, the way you do for the dead. Nobody here expected to see any of the forty again.", "And now one comes back wearing that. I'm not judging. I work for them too. I only say: the Rows remember what you were. Whether that's a comfort to you or a warning, I couldn't tell you."] }] },
  'vendor:holl': { bio: 'Odd runs the company store, where a miner’s wages go to die. He did not set the prices and he would like that understood.', greet: ["Medigel, cells, boots. Prices are on the board. I don't set 'em. I just get shouted at for 'em.", "Covenant gets the garrison rate. Don't tell the Rows. They get the other rate."], topics: [] },
});
Object.assign(LORE, {
  larkletter: { title: "The Lark's Satchel", where: 'rowsdeep', text: "A satchel of tally slips, two years of them, each copied by hand from a post in the Rows and matched against a shipping docket. On top, a letter never sent: 'To Legate Marr. You think we steal your tithe. We have never touched it. One cart in ten leaves the Smelter by the back gate, at night, under the Governor's seal, and goes into the hold of an Ochre Syndicate hauler. We have counted every one. I cannot bring this to you. Your gate guards are his. So I am giving it to the only people on Hollow who will carry it up that hill for me, and God help me, they will do it with rifles. Tamsin Reyes.'" },
  wickchamber: { title: 'The Chamber Under the Cut', where: 'cutdeep', text: "Where the miners' last gallery broke through, there is a round room that nobody on Hollow built. The ceiling is a map of stars picked out in points of light. Forty-one of them are red. Thirty-eight are dark. The thirty-ninth flickers. Around the wall stand forty-one alcoves, each the height of a person. Three are empty. In each of the other thirty-eight there is a standing shape of grey ash, with its hands held out as if carrying something. When the air from the tunnel reaches the nearest one, it comes apart very gently." },
  praskledger: { title: "The Governor's Ledger", where: 'spiredeep', text: "Two sets of books, and tucked into the second, a stolen copy of a fleet order under Veil-Lord Venn's seal. 'Sixty hulls, Hollow ore. Armament: none. Each to be fitted with a shielded hold of the attached pattern.' The attached pattern is a round room with one alcove. In the margin, in Prask's hand: 'He is not building a fleet. He is building sixty of that thing under my mine and flying them to a dying star. I do not know what goes in the alcove. I have seen the Winnowing lists. I think I know what goes in the alcove. I would rather sell his ore to pirates than be the man who smelted it.'" },
});

// ---------- quests ----------
const qx = (lvl, f) => Math.round(xpNeed(lvl) * f * .36);
const Z = { zone: 'hollow', path: 'dark' }, UBS = ['unbowed', 'ubgun', 'ubmed'], SKIM = ['enforcer', 'spiregun', 'ochrebuyer', 'ochreheavy'];
QUESTS.push(
  { id: 'dh_h1', story: true, ...Z, giver: 'marr', lvl: 6, pre: 'de_e11', name: 'What Comes Up', where: 'strip', xp: qx(6, .7), gold: 16, obj: { kill: ['burrower', 'shaftfloater'], n: 10, what: 'Kill 10 Tunnel Burrowers or Shaft Floaters in the Strip, west of the terminal' },
    say: ["Before you go hunting for missing ore, you can do me a favour and find out why I'm missing miners. Since the Governor opened the Deep Cut, things have been coming up into the Strip. Segmented things with teeth. Gas bags with stingers.", "I've lost a shift and a half. The Governor says wildlife is a garrison matter and the garrison says the mine is a Governor matter, and meanwhile the Strip is empty and the tithe gets shorter. Ten of them, acolyte. Call it a courtesy between services."],
    done: ["Ten. That'll get one crew back on the terraces. You'll have noticed they're not like any animal you grew up with here. They aren't from here. Not from the surface, anyway. They were a mile down, minding their business, until somebody dug into the ceiling."] },
  { id: 'dh_h2', story: true, ...Z, giver: 'tacit', lvl: 7, pre: 'dh_h1', name: 'The Arithmetic', where: 'rows', xp: qx(7, .65), gold: 18, obj: { inspect: 'tally', n: 5, what: 'Read 5 tithe tally posts in the Tithe Rows, east of the terminal' },
    say: ["Acolyte. I understand you are inquiring after the ore. How delightful. I have had nothing to do for four hundred and six days, so I have been doing arithmetic. It is not my field, but one must keep the attachments supple.", "Every cart a miner fills is weighed at a tally post in the Rows. I should like those figures. I cannot fetch them. The Rows dislike me, which is unjust, as I have never interrogated a single one of them. You grew up there. Read me five posts."],
    done: ["Thank you. Now observe. The posts say the Rows filled ten carts in every ten. The Legate's dockets say nine in every ten reached the terminal. The miners are not short. The road is not short. Somewhere between the weighing and the shipping, there is one building. I do so enjoy it when a subject narrows."] },
  { id: 'dh_h3', story: true, ...Z, giver: 'marr', lvl: 7, pre: 'dh_h2', name: 'The Unbowed', where: 'rows', xp: qx(7, .75), gold: 20, obj: { kill: UBS, n: 10, what: 'Defeat 10 of the Unbowed in the Tithe Rows' },
    say: ["You went into the Rows in Covenant black and read their tallies, and now the Unbowed are out on the streets in numbers. I can't say I blame them. I can't allow it, either.", "They're miners with old rifles, led by a woman called Reyes. Put ten of them down and the rest will go to ground. I know they're your people, acolyte. That's why I'm asking you and not sending a platoon. A platoon wouldn't stop at ten."],
    done: ["Ten, and the streets are clear. Thank you for keeping it to that. I've served on three tithe worlds. The ones that go quiet are the ones where somebody was careful. The ones that burn are the ones where somebody was thorough."] },
  { id: 'dh_h4', story: true, ...Z, giver: 'marr', lvl: 8, pre: 'dh_h3', name: 'The Lark', where: 'rowsdeep', xp: qx(8, .8), gold: 30, gear: true, lore: 'larkletter', obj: { named: 'lark', n: 1, what: 'Defeat Tamsin Reyes, the Lark, in the Tithe Rows and take her satchel' },
    say: ["Tamsin Reyes. They call her the Lark, because she sang in the Rows before we came. She runs the Unbowed, and my scouts say she carries a satchel she never puts down. I want to know what's in it.", "She's in the middle of the Rows with her best people round her. Take company. And acolyte, bring me the satchel unread, if you can stand to. I'd like to be the first officer on this world to actually look at something."],
    done: ["She was writing to me. Two years of counting carts, and she was writing to me, and my own gate guards stopped the letter. One cart in ten, out the back of the Smelter, into a Syndicate hold. I've been hunting that woman for a year. She was doing my job."] },
  { id: 'dh_h5', story: true, ...Z, giver: 'tacit', turnTo: 'venn', lvl: 8, pre: 'dh_h4', name: 'The Back Gate', where: 'smelter', xp: qx(8, .5), gold: 18, obj: { at: 'smelter', r: 34, what: 'Scout the Smelter in the north-east, then report to Veil-Lord Venn at the terminal' },
    say: ["The subject has narrowed to a single building, as I predicted. I am rarely wrong, and it gives me no pleasure, because I am not equipped for pleasure. Go and look at the Smelter's back gate.", "And acolyte: your Veil-Lord's shuttle put down an hour ago. He did not announce himself to the Legate. He is standing by the mast, looking at the Spire, and smiling. I have interviewed a great many people. I should not care to interview him."],
    done: [['venn', "Acolyte. Yes, I came myself. You stopped at Halfway for fuel, I expect. I do not stop. A Syndicate hauler at an Imperial smelter, loading under a Governor's seal. How very ordinary. I had hoped for a more interesting traitor."], ['venn', "Understand why I am here in person. That ore is not for the navy. It is for sixty hulls I am having built to a pattern of my own, and they have an appointment to keep. A governor who is late with my ore is stealing something from me that cannot be bought back. Time."]] },
  { id: 'dh_h6', story: true, ...Z, giver: 'venn', lvl: 8, pre: 'dh_h5', name: 'One Cart in Ten', where: 'smelter', xp: qx(8, .8), gold: 28, obj: { kill: SKIM, n: 12, what: 'Defeat 12 Spire Enforcers, Marksmen or Syndicate crew at the Smelter' },
    say: ["The Governor's guard holds the Smelter, and the Syndicate's people are loading at the back. Legate Marr cannot touch either. A legate does not fire on a Governor-General's seal. It is one of the Empire's sillier rules, and I have never troubled to change it, because it does not apply to me.", "Nor to you. Twelve of them, acolyte. Leave the hauler. I want its captain to fly home to Sunder and explain to his masters exactly who it was that closed the gate."],
    done: ["Twelve. The back gate is shut, and the Syndicate has learned the price of ore on Hollow. Good. That was housekeeping. Now I am going to show you why I really crossed half the Empire, and it is not a thief on a hill."] },
  { id: 'dh_h7', story: true, ...Z, giver: 'venn', lvl: 9, pre: 'dh_h6', name: 'The Bottom of the Cut', where: 'cutdeep', xp: qx(9, .9), gold: 40, gear: true, lore: 'wickchamber', obj: { named: 'deepmother', n: 1, what: 'Kill the Deep Mother at the bottom of the Deep Cut, north-west of the terminal, and see what she was nesting on' },
    say: ["Eleven months ago the Governor's miners broke through the floor of the Deep Cut into a room. He sealed the report. He is a thief, but not a fool, and he knew at once that it was the sort of thing my office kills people for knowing.", "Something has nested on it since. The burrowers in the Strip are its young. Take a full group, go to the bottom, and kill it. Then stand in that room and look, acolyte. Look at the walls. I want you to see it with your own eyes before I say one word about it."],
    done: ["You counted the alcoves. Of course you did. Forty-one, and thirty-eight filled. There is a room like it under every tithe world, and older ones than this. My office did not build them. We found them, three hundred years ago, and we learned what they were for. Now you know what a wick is. No. You know what one looks like afterward."] },
  { id: 'dh_h8', story: true, ...Z, giver: 'marr', turnTo: 'tacit', lvl: 9, pre: 'dh_h7', name: 'Questions for the Governor', where: 'town', xp: qx(9, .3), gold: 10, obj: { talk: true, what: 'Ask TACIT-4 at the terminal how to get into the Spire' },
    say: ["Your Veil-Lord has told me, in that quiet way of his, that the Governor-General is to be 'relieved'. I didn't ask relieved of what. I've got eleven years of reports in a drawer and I find I don't much care.", "But I can't storm the Spire. My troopers won't fire on the seal, and they'd be right not to. You need a way in. Talk to the droid. It's spent nine years watching who goes up that hill, and it has been dying for somebody to ask."],
    done: [['tacit', "The Spire. At last. Acolyte, I have waited nine years for this conversation, and you will forgive me if I savour it."], ['tacit', "The guard changes on the stair at the turn of each shift. Praetor Sull stands the stair himself, because he trusts nobody, which is sound. The Governor-General will be in the upper hall with his ledgers. He keeps two sets. I should dearly love to ask him about the second. If you find yourself with a vacancy aboard your ship, I have references."]] },
  { id: 'dh_h9', story: true, ...Z, giver: 'venn', lvl: 10, pre: 'dh_h8', name: 'Relieved', where: 'spiredeep', xp: qx(10, 1), gold: 60, gear: true, lore: 'praskledger', obj: { named: 'prask', n: 1, what: "Defeat Governor-General Aurel Prask in the Governor's Spire, at the top of the Haul Road" },
    say: ["Aurel Prask has governed Hollow for eleven years, and for the last three he has stolen from me. I could have him recalled. There would be a tribunal, and he would say things at it. I would rather he said nothing, anywhere, to anyone.", "Go up the hill, acolyte. Take a full group. His Praetor will be on the stair. And when Prask talks, and he will, he is a talker, listen carefully. He has seen something he was never meant to see. I should like to know how much of it he understood."],
    done: ["He understood nearly all of it. A clever man. What a waste. So. You have read his ledger and you have stood in the room under the Cut, and you are looking at me the way Gaunt used to. Sixty ships, sixty rooms, sixty alcoves, and a dying star on the border where two fleets are about to meet. Yes, acolyte. You will be aboard. You will be at the very centre of it. I told you once that I am careful with what I value. Go and rest. We sail when the hulls are done."] },
  { id: 'dh_h10', story: true, ...Z, giver: 'marr', turnTo: 'tacit', lvl: 10, pre: 'dh_h9', when: () => (S.hero?.lvl || 1) >= 10, name: 'A Vacancy', where: 'town', xp: qx(10, .3), gold: 20, obj: { talk: true, what: 'Offer TACIT-4 a berth aboard the Eventide' },
    say: ["The Spire's mine now, by default, which is the last thing I wanted. I'll make the tithe. I'll even try to make it without hanging anybody. Somebody on this rock should.", "One thing. Take the droid with you. Please. It's been asking my troopers how they slept, and then just waiting. It's the politest thing on Hollow and nobody can stand to be in a room with it. It likes you. I don't know what that says about either of you."],
    done: [['tacit', "A berth. Acolyte, I am moved. I am not equipped to be moved, so I shall simply say that my references are excellent and none of them are living."], ['tacit', "I shall serve as ship's physician. The skills transfer perfectly. One merely performs them in the opposite order. And should you ever require a conversation with someone who does not wish to have one, Captain, you need only ask. I have missed it so."]] },
  { id: 'dh_h11', story: true, ...Z, cls: 'wardancer', giver: 'venn', lvl: 10, pre: 'dh_h9', when: () => (S.hero?.lvl || 1) >= 10, name: 'Quench Your Own', where: 'town', xp: qx(10, .5), gold: 0, obj: { inspect: 'anvil', n: 1, what: 'Quench your own dusk blade at the Dusk Anvil in Ore Terminal Six' },
    say: ["You still carry the training blade from Cinder. It was quenched by an armourer, in oil, like a kitchen knife. A Dusk Knight's true blade is quenched once, by the knight, in whatever that knight is most willing to give up.", "I have had an anvil brought down from my shuttle. Put the blade on it and decide what you are feeding it. The blade will show you the colour afterward. Mine came out the colour of bone. I was a very serious young man."],
    done: ["There. That is yours, and it will drink for you as long as you live. Do not tell me what you gave it. Nobody ever tells. But I can see the colour, acolyte, and I can guess, and I think rather more of you than I did this morning."] },
  { id: 'dh_g1', ...Z, giver: 'fenn', lvl: 6, name: 'Runaway Stock', where: 'strip', xp: qx(6, .7), gold: 14, obj: { kill: ['hauler'], n: 8, what: 'Shut down 8 Rogue Haulers in the Strip' },
    say: ["Half my haulers have gone wrong since the Cut opened. Something in the dust down there gets in the quota boards. They're still trying to make their numbers, only now they'll load anything. Rock, carts, a foreman. They got Big Hari last week. Weighed him in and everything.", "Shut down eight of them, would you? Don't be precious about it, they're company property and the company's not looking. I'd do it myself, but I'm sixty-one and I've a shift to run."],
    done: ["Eight off the terraces. That's the lower benches workable again. Here, it's from the shift fund. And listen. Whatever they've made you up at that Citadel, you came back and did a day's work on the Strip. Your mother would've... well. She'd have had words. But she'd have noticed that."] },
  { id: 'dh_g2', ...Z, giver: 'fenn', lvl: 7, pre: 'dh_g1', name: 'Big Shift', where: 'strip', xp: qx(7, .7), gold: 30, gear: true, obj: { named: 'bigshift', n: 1, what: 'Destroy Big Shift, the rogue ore hauler, in the Strip' },
    say: ["There's one hauler left that I'd not ask anyone to face alone. Number Nine. Big Shift, we called it. My old crew painted a smile on the front in a good year, back before the levy.", "It's the size of a bunkhouse and it thinks it's behind on quota. It's been behind on quota for a month. Take a few with you. And if you can, leave the smile. I know that's daft."],
    done: ["It's down, then. And the smile? Still there? Ha. Good. Good. I'll have the lads cut that plate off and hang it in the shed. Daftest thing. Thirty years on this pit and that's what I'll have kept: a painted smile off a hauler that tried to weigh me in."] },
  { id: 'dh_v1', ...Z, giver: 'marr', lvl: 8, pre: 'dh_h5', name: 'Three Fingers', where: 'smelter', xp: qx(8, .7), gold: 32, gear: true, obj: { named: 'oyel', n: 1, what: 'Defeat Three-Finger Oyelaran, the Syndicate buyer, at the Smelter' },
    say: ["The Syndicate's man on Hollow is called Oyelaran. Three fingers on his left hand, and I'm told he lost the others in a negotiation, which tells you how the Ochre Syndicate negotiates.", "He's been buying my tithe out from under me for three years and tipping his hat to my patrols while he did it. I can't arrest him under the Governor's seal. You can do rather better than arrest. Go and close his account."],
    done: ["He offered to round it up? Of course he did. That's the Syndicate for you: everything's a price, right up to the end. Well. That's one hat I won't see tipped again. Thank you, acolyte. That one was personal, and I don't get many."] },
  { id: 'dh_v2', ...Z, giver: 'marr', lvl: 9, pre: 'dh_h6', name: 'The Man on the Stair', where: 'spire', xp: qx(9, .7), gold: 36, gear: true, obj: { named: 'sull', n: 1, what: "Defeat Praetor Kaius Sull on the Governor's Hill" },
    say: ["Praetor Sull commands the Governor's guard. He's Rows-born, same as you, though he'd shoot you for saying so. He's the one who stops my letters, turns my patrols back at the hill, and takes the Governor's 'subjects' up the stair.", "None of them ever came down, acolyte. Not one. I kept a list. It's forty-three names long and the droid tells me every one of them worked a tally post. Go and discuss it with him."],
    done: ["Sull's finished. Forty-three names. I'll have them cut on a stone and set it in the Rows, with the garrison's seal on it, and the Governor's nowhere. It won't mean much to them. But it'll be the first true thing the Empire's put in writing on this world."] },
);
CREW.tacit = { name: 'TACIT-4', pal: 0, flag: 'dcrew2', hi: "TACIT-4, reporting as ship's physician. Do sit down, Captain. No, there is nothing wrong. I simply prefer people seated.", pick: role => role === 'healer' ? 'elementalist' : 'cleric' };
function pickBlade() {
  UI.openSheet('Your dusk blade', body => {
    const p = document.createElement('p'); p.textContent = 'The blade goes dark on the anvil, and waits. What colour does it come back?'; body.appendChild(p);
    for (const [k, [n, c]] of Object.entries(DUSK_COLS)) { const b = document.createElement('button'); b.className = 'opt'; b.style.cssText = `display:block;width:100%;margin:6px 0;text-align:left;border-left:6px solid ${c}`; b.textContent = n; b.onclick = () => {
      S.ext.blade = k; const L = S.hero.lvl, it = makeItem({ name: `${n} Dusk Blade`, slot: 'weapon', type: 'duskblade', lvl: L, rarity: 3, stats: { pow: 10 + L * 3, sta: 4 + L * 2, crit: 2 }, value: 0 });
      const g = S.gear.wardancer; if (g) { g.weapon = it; Game.applyGear(S.hero, g); } S.hero.kind = 'dn_' + k; chat('loot', null, `You quench your own dusk blade. It comes back ${n.toLowerCase()}.`); Game.save(); UI.closeSheet(); }; body.appendChild(b); }
  });
}
X.turnin.push(q => {
  if (q.id === 'dh_h4') { S.flags.vennhere = 1; setTimeout(() => Game.storyFolk(), 50); }
  if (q.id === 'dh_h10') X.recruit?.('tacit');
  if (q.id === 'dh_h11' && S.heroCls === 'wardancer') setTimeout(pickBlade, 400);
});
Object.assign(LFG_D, { deepcut: { name: 'The Deep Cut', lvl: [8, 9], zone: 'hollow', at: () => ({ x: D7.cut.x, z: D7.cut.z + 54 }) }, govspire: { name: "The Governor's Spire", lvl: [9, 10], zone: 'hollow', at: () => ({ x: D7.spire.x, z: D7.spire.z + 72 }) } });
// TACIT-4 is a droid whatever job it is doing aboard
const droidCrew = () => { for (const p of S.party || []) if (p.name === 'TACIT-4') p.kind = 'n_tacit'; };
X.zone.push(droidCrew); X.turnin.push(q => { if (q.id === 'dh_h10') setTimeout(droidCrew, 60); });
