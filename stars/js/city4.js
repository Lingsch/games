// Stars Beneath, Build 4: Aurelis, the Republic's capital (levels 6-10). The justice path's second world.
// The Lamp Quarter: the Lantern Hall and its plaza in the south, the Gardens west, the Lower Streets east, Dockside
// in the north-east, the Underway cutting in the north-west, and the Old Observatory on its hill in the north.
import * as THREE from './three.js';
import { S, WH, TAU, lerp, mulberry32, makeNoise, chat, X } from './core.js';
import { addChunked, propMat, addKinds } from './render.js';
import * as R from './render.js';
import * as M from './models.js';
import { fanTreeGeo } from './flora8.js';
import { build, P, T, Cone, Cyl, Box, Sph, Oct } from './models.js';
import { H, HN, hgt, world, addWall, linkDoors, mergeBuilt, mat4, meshWithOutline, registerZone, ZONE_SIZE } from './world.js';
import { groundMesh } from './zones.js';
import { MOBS, QUESTS, GIVERS, xpNeed, makeItem } from './data.js';
import { MOB_LORE, TALK } from './dialogue.js';
import { LORE } from './story.js';
import { LFG_D } from './social6.js';
import * as Game from './game.js';
import * as UI from './ui.js';
import { habGeo, lampGeo, crateGeo, shipGeo, minimapFrom } from './moon1.js';
import { sfig } from './models3.js';
import { CREW, PADS } from './ship1.js';
import { BLADE_COLS } from './light4.js';
const O = [0, 0, 0], LR = [1, -1];
ZONE_SIZE.city = 300;
export const D5 = { hall: { x: 0, z: 150, R: 38, base: 4 }, pad: { x: 86, z: 168, R: 16 }, gardens: { x: -160, z: 110, R: 70 }, streets: { x: 165, z: 40, R: 60 }, dockside: { x: 175, z: -125, R: 50 }, underway: { x: -170, z: -85, R: 42 }, obs: { x: 0, z: -205, R: 46 } };
PADS.city = { x: D5.pad.x, z: D5.pad.z + 17 };

const pal = (a, b, t, g) => ({ a, b, t, g }), HUM = [.6, .4, 1.6, .15], HEAVY = [.55, .4, 1.9, .15], STILL = [0, 0, 0, 0];
const BUR = pal('#d8dce4', '#5a6068', '#2a2e34', '#ff4a3a'), CULT = pal('#3a2a4a', '#1e1626', '#8a8a6a', '#8dff5a'), IMP = pal('#2e2e34', '#18181c', '#c0392b', '#ff4a3a'), WATCH = pal('#4a7aaa', '#2a3e56', '#e8e2d0', '#6ad8ff');
addKinds({
  bur0: [sfig({ body: 'armor', head: 'helmet', r: 'baton', l: 'shield' }, BUR, 0), HEAVY, .05, .035], bur1: [sfig({ body: 'armor', head: 'helmet', r: 'rifle', l: null }, BUR, 1), HEAVY, .05, .035],
  bur2: [sfig({ body: 'suit', vest: true, head: 'visor', r: 'injector', l: 'medkit' }, BUR, 2), HUM, .05, .03], bur_cap: [sfig({ body: 'armor', heavy: true, head: 'bare', r: 'blade', l: 'pistol', hair: '#8a8a8a' }, BUR, 3), HEAVY, .05, .04],
  bur_boss: [sfig({ body: 'coat', head: 'visor', r: 'pistol', l: 'slate', hair: '#e8e2d0', scarf: '#ff4a3a' }, pal('#f0f0f0', '#5a6068', '#2a2e34', '#ff4a3a'), 0), HUM, .05, .035],
  cult1: [sfig({ body: 'coat', head: 'hood', r: 'baton', l: null }, CULT, 1), HUM, .05, .03], cult_deacon: [sfig({ body: 'coat', head: 'hood', r: 'lantern', l: 'lantern', cloak: '#1a1222' }, CULT, 0), HUM, .05, .035],
  imp_envoy: [sfig({ body: 'coat', head: 'bare', r: 'pistol', l: 'slate', hair: '#1c2026', scarf: '#c0392b' }, IMP, 3), HUM, .05, .035],
  n_varen: [sfig({ body: 'coat', head: 'bare', tail: true, r: 'lantern', l: null, scarf: '#d8b24a', hair: '#e8e2d0' }, pal('#f0ead8', '#8a7a5a', '#d8b24a', '#fff2b0'), 3), HUM, .05, .03],
  n_voss: [sfig({ body: 'armor', head: 'cap', r: 'pistol', l: null }, WATCH, 2), HEAVY, .05, .035], n_abel: [sfig({ body: 'suit', head: 'droid', r: null, l: 'slate', skin: '#8a9098' }, pal('#8a9098', '#4a5058', '#d8b24a', '#6ad8ff'), 0), HUM, .05, .03],
  n_harrow: [sfig({ body: 'coat', head: 'bare', r: null, l: null, scarf: '#d8b24a', hair: '#8a8a8a' }, pal('#2a3a5a', '#1a2438', '#d8b24a', '#ffe9a0'), 0), HUM, .05, .03],
  n_kato: [sfig({ body: 'armor', head: 'bare', r: 'rifle', l: null, hair: '#2b1d14' }, pal('#8a9098', '#4a5058', '#2a2e34', '#6ad8ff'), 2), HEAVY, .05, .035], n_pim: [sfig({ body: 'suit', knee: true, head: 'hat', r: 'canister', l: null }, pal('#5a8a4a', '#34502c', '#e8d8a8', '#9be36b'), 1), HUM, .05, .03],
  terminal: [build([P(T(Box(.9, 1.5, .4), 0, .75), 0, O, '#d8dce4'), P(T(Box(.7, .5, .06), 0, 1.2, .2, -.2), 0, O, '#6ad8ff', 1.8), P(T(Box(.92, .1, .42), 0, .1), 0, O, '#d8b24a')]), STILL, 0, .03],
  forge: [build([P(T(Cyl(.9, 1.1, 1, 8), 0, .5), 0, O, '#e8e2d0'), P(T(Cyl(.6, .6, .2, 8), 0, 1.1), 0, O, '#d8b24a'), P(T(Oct(.4), 0, 1.8), 0, O, '#fff2b0', 3.2)]), STILL, 0, .03],
});

const mob = (name, kind, o) => ({ name, kind, hpM: 1, dmgM: 1, spd: 5.4, range: 2.4, weak: 'storm', resist: null, scale: 1, aggro: 10, social: 9, ...o });
const BE = { beast: true }, HU = { human: true }, UN = { undead: true };
Object.assign(MOBS, {
  gdrone: mob('Groundskeeper Drone', 'sdrone', { hpM: .85, dmgM: .9, range: 16, ranged: true, fly: .5, resist: 'poison' }), servo: mob('Maintenance Loader', 'golempet', { hpM: 1.15, dmgM: .95, spd: 4.6, range: 2.8, resist: 'earth', scale: 1.05 }),
  stalker: mob('Menagerie Stalker', 'wolf', { hpM: .9, dmgM: .95, spd: 6.4, weak: 'fire', scale: 1.05, ...BE }),
  dimthug: mob('Dimmer Zealot', 'cult1', { hpM: 1, dmgM: 1, weak: 'holy', resist: 'shadow', aggro: 12, social: 13, ...HU }), dimpreacher: mob('Dimmer Preacher', 'cult0', { hpM: .85, dmgM: 1, range: 16, ranged: true, caster: true, healer: true, school: 'shadow', weak: 'holy', resist: 'shadow', aggro: 12, social: 13, ...HU }),
  impagent: mob('Imperial Agent', 'imp1', { hpM: 1.05, dmgM: 1.05, weak: 'holy', resist: 'shadow', aggro: 12, social: 13, ...HU }), impgun: mob('Imperial Marksman', 'imp0', { hpM: .9, dmgM: 1.05, range: 22, ranged: true, weak: 'holy', resist: 'shadow', aggro: 13, social: 13, ...HU }),
  cityrisen: mob('Risen Citizen', 'ghoul', { hpM: 1, dmgM: 1, weak: 'holy', resist: 'frost', aggro: 11, social: 12, ...UN }),
  burguard: mob('Bureau Guard', 'bur0', { hpM: 1.15, dmgM: 1, aggro: 12, social: 13, ...HU }), burgun: mob('Bureau Rifle', 'bur1', { hpM: .9, dmgM: 1.05, range: 22, ranged: true, aggro: 13, social: 13, ...HU }), burmed: mob('Bureau Technician', 'bur2', { hpM: .85, dmgM: .8, range: 16, ranged: true, caster: true, healer: true, school: 'storm', weak: 'fire', aggro: 12, social: 13, ...HU }),
});
const boss = (name, kind, o) => ({ name, kind, hpM: 1.2, dmgM: 1.05, spd: 5.2, range: 2.8, weak: 'holy', resist: null, scale: 1.3, aggro: 14, social: 18, ...o });
Object.assign(MOBS, {
  bramble: boss('Bramble', 'bear', { ...BE, scale: 1.6, weak: 'fire', mechs: ['cleave', 'slam'], lines: { start: '*The pride of the Senate Menagerie pads out of the rose beds. The plaque said it was docile. The plaque is in its mouth.*', half: '*It shakes itself, and decides it is no longer playing.*' } }),
  kessler: boss('Envoy Kessler', 'imp_envoy', { ...HU, scale: 1.1, range: 18, ranged: true, resist: 'shadow', mechs: ['pool', 'call'], adds: 'impagent', lines: { start: "A lamp-keeper on the docks. Do put the blade away. I am an accredited envoy, and everything in this warehouse was sold to me quite legally by your own government.", half: 'Agents. The novice is being tiresome.' } }),
  crane: boss('Deacon Hollis Crane', 'cult_deacon', { ...HU, hpM: 1.5, scale: 1.25, range: 18, ranged: true, caster: true, school: 'shadow', resist: 'shadow', mechs: ['call', 'pool', 'fear', 'enrage'], adds: 'cityrisen', lines: { start: "Under your own Hall, keeper. Did you never wonder what the foundations were built over? We did. We dug.", half: 'Citizens! Rise, and be counted!', enrage: 'Roe has seen it! I have seen it! You will see it too!' } }),
  roth: boss('Captain Ilan Roth', 'bur_cap', { ...HU, scale: 1.2, weak: 'storm', mechs: ['cleave', 'slam'], lines: { start: "This hill is closed by order of the Bureau of Stellar Survey. I don't know why, and I've found I sleep better for not asking.", half: "Hold the stair! Nobody goes up!" } }),
  strand: boss('Director Maeve Strand', 'bur_boss', { ...HU, hpM: 1.7, scale: 1.2, range: 18, ranged: true, weak: 'storm', mechs: ['pool', 'call', 'fear', 'enrage'], adds: 'burgun', lines: { start: "You want me to tell a hundred million people that the stars are going out and nobody knows why. I have kept this city calm for nine years, novice. I will not have it undone by a child with a candle.", half: 'Security to the dome. All of it.', enrage: "There is no plan! Do you understand? There was never a plan! There is only keeping it quiet!" } }),
});
Object.assign(MOB_LORE, {
  gdrone: "A parks drone whose pruning routine has been altered. Somebody wanted the Gardens empty.", servo: 'A maintenance loader, wandering the paths and moving benches to no purpose it can explain.', stalker: 'A hunting cat from the Senate Menagerie. All the cages were opened on the same night.',
  dimthug: 'A Dimmer zealot. A year ago he was a clerk. Then a star he had been taught to wish on went out.', dimpreacher: "A Dimmer preacher. 'The lamps are failing,' she says, and the frightening part is that she is right.",
  impagent: 'An Imperial agent with diplomatic papers and a knife. The papers are genuine.', impgun: 'An Imperial marksman on a warehouse roof, accredited as a cultural attaché.', cityrisen: 'A citizen of Aurelis, taken from the old undercity vaults and set walking.',
  burguard: 'Security for the Bureau of Stellar Survey: white plate, no insignia, and orders nobody will show you.', burgun: 'A Bureau rifle. Their briefing was one sentence long: nobody goes up the hill.', burmed: 'A Bureau technician. Most of them are astronomers who were handed a medkit and told not to talk.',
  bramble: 'The Senate Menagerie called it docile and let children feed it. It weighs as much as a groundcar.', kessler: "The Empire's envoy on Aurelis, who has been buying the Republic's suppressed star reports by the crate.",
  crane: 'Deacon Crane leads the Dimmers of the capital from the old transit cutting, directly beneath the Lantern Hall.', roth: 'Ilan Roth guards the Observatory. He has never been told what is in it.', strand: 'Maeve Strand has run the Bureau of Stellar Survey for nine years, and has spent every one of them deciding what the Republic is not ready to hear.',
});

const sm = t => t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t);
registerZone('city', seed => {
  const rng = mulberry32(seed + 7373), N = makeNoise(seed + 7373), pk = a => a[(rng() * a.length) | 0];
  world.water = null;
  world.names = { zone: 'Aurelis', town: 'the Lamp Quarter', boss: 'Director Strand', ruin: 'the Old Observatory', wood: 'the Gardens', fields: 'the Gardens', waste: 'Dockside', road: 'the Processional', captain: 'Captain Roth', tusk: 'Bramble' };
  const Hl = D5.hall, Pad = D5.pad, Gd = D5.gardens, St = D5.streets, Dk = D5.dockside, Uw = D5.underway, Ob = D5.obs;
  const onRoad = (x, z) => (Math.abs(x) < 7 && z > -170 && z < 120) || (Math.abs(z - 40) < 6 && Math.abs(x) < 230) || (Math.abs(z + 110) < 6 && Math.abs(x) < 230);
  for (let zi = 0; zi < HN; zi++) for (let xi = 0; xi < HN; xi++) {
    const x = xi - WH, z = zi - WH; let h = 4 + N.fbm(x * .008, z * .008, 3) * 3;
    h += sm(1 - Math.hypot(x - Ob.x, z - Ob.z) / 110) * 12;                                      // Observatory Hill
    h = lerp(1, h, sm((Math.hypot((x - Uw.x) * .7, z - Uw.z) - Uw.R + 8) / 12));                  // the Underway cutting
    for (const t of [Hl, Pad]) h = lerp(Hl.base, h, sm((Math.hypot(x - t.x, z - t.z) - t.R - 2) / 16));
    h = lerp(16.5, h, sm((Math.hypot(x - Ob.x, z - Ob.z) - Ob.R * .55) / 12));
    const edge = Math.max(Math.abs(x), Math.abs(z)) - (WH - 24); if (edge > 0) h += edge * edge * .1;
    H[zi * HN + xi] = h;
  }
  const STONE = new THREE.Color('#d8d4c8'), PALE = new THREE.Color('#ece8dc'), GRASS = new THREE.Color('#7aa85a'), DEEP = new THREE.Color('#4a7a42'), ROADC = new THREE.Color('#b8b4a8'), GOLD = new THREE.Color('#d8b24a'), GRIT = new THREE.Color('#7a7872'), DARKC = new THREE.Color('#4a4a52'), PADC = new THREE.Color('#5a5e64');
  const colorAt = (x, z) => {
    let c = STONE.clone().lerp(PALE, N.fbm(x * .03, z * .03, 2));
    const dg = Math.hypot(x - Gd.x, z - Gd.z); if (dg < Gd.R + 30) c.lerp(GRASS.clone().lerp(DEEP, N.fbm(x * .04, z * .04, 2)), sm(1 - (dg - Gd.R) / 30));
    if (Math.hypot(x - St.x, z - St.z) < St.R + 20 || Math.hypot(x - Dk.x, z - Dk.z) < Dk.R + 20) c.lerp(GRIT, .5);
    if (Math.hypot((x - Uw.x) * .7, z - Uw.z) < Uw.R) c.lerp(DARKC, .6);
    if (onRoad(x, z)) { c.lerp(ROADC, .7); if (Math.abs(Math.abs(x) - 6.5) < .5 && z > -170 && z < 120) c.lerp(GOLD, .6); }
    const dh = Math.hypot(x - Hl.x, z - Hl.z); if (dh < Hl.R) { c.lerp(PALE, .7); if (Math.abs(dh - 14) < .7 || Math.abs(dh - Hl.R + 2) < .7) c.lerp(GOLD, .7); }
    const dp = Math.hypot(x - Pad.x, z - Pad.z); if (dp < Pad.R) { c.lerp(PADC, .85); if (Math.abs(dp - Pad.R + 1.5) < .6) c.lerp(new THREE.Color('#6ad8ff'), .8); }
    const sh = .94 + N.n2(x * .3, z * .3) * .1; return new THREE.Color(c.r * sh, c.g * sh, c.b * sh);
  };
  groundMesh(colorAt);
  world.regionNames = ['The Gardens', 'The Lower Streets', 'Dockside', 'The Underway', 'Observatory Hill', 'The Lantern Plaza'];
  world.regionFn = (x, z) => Math.hypot(x - Ob.x, z - Ob.z) < 100 ? 4 : Math.hypot(x - Uw.x, z - Uw.z) < 80 ? 3 : Math.hypot(x - Dk.x, z - Dk.z) < 90 ? 2 : x > 70 && z < 130 ? 1 : x < -70 ? 0 : 5;
  const items = [], put = (geo, x, z, ry = 0, s = 1) => items.push({ geo, m: mat4(x, hgt(x, z), z, ry, s) });
  const solid = (x, z, w, d, ry = 0) => { const c = Math.cos(ry), s = Math.sin(ry), pt = (lx, lz) => [x + lx * c + lz * s, z - lx * s + lz * c]; const k = [pt(-w / 2, -d / 2), pt(w / 2, -d / 2), pt(w / 2, d / 2), pt(-w / 2, d / 2)]; for (let i = 0; i < 4; i++) addWall(k[i][0], k[i][1], k[(i + 1) % 4][0], k[(i + 1) % 4][1], .3); };
  const tower = (w, h, col, glow) => build([P(T(Box(w, h, w), 0, h / 2), 0, O, col), ...Array.from({ length: Math.floor(h / 4) }, (_, k) => P(T(Box(w + .1, .5, w + .1), 0, 3 + k * 4), 0, O, glow, 1.4)), P(T(Box(w * .6, 2, w * .6), 0, h + 1), 0, O, col), P(T(Oct(.6), 0, h + 2.8), 0, O, glow, 2.6)]);
  // the Lantern Hall: the order's seat, a great dome with the First Lamp's heir burning above it
  put(build([P(T(Cyl(13, 14, 7, 16), 0, 3.5), 0, O, '#ece8dc'), P(T(Sph(12, 18, 10, 0, TAU, 0, Math.PI / 2), 0, 7), 0, O, '#f4f0e4'), P(T(Cyl(1, 1.6, 9, 8), 0, 22), 0, O, '#d8b24a'), P(T(Oct(2.6), 0, 29), 0, O, '#fff2b0', 3.4),
    ...Array.from({ length: 12 }, (_, k) => P(T(Cyl(.5, .5, 7, 6), Math.cos(k / 12 * TAU) * 14.4, 3.5, Math.sin(k / 12 * TAU) * 14.4), 0, O, '#d8d4c8')), P(T(Box(4, 5, 1), 0, 2.5, -14), 0, O, '#2a2e34')]), Hl.x, Hl.z + 20);
  for (let k = 0; k < 10; k++) { const a = k / 10 * TAU, b = (k + 1) / 10 * TAU; addWall(Hl.x + Math.cos(a) * 14, Hl.z + 20 + Math.sin(a) * 14, Hl.x + Math.cos(b) * 14, Hl.z + 20 + Math.sin(b) * 14, .5); }
  for (const [dx, dz, ry, w, d, col, trim] of [[-24, -10, .2, 12, 7, '#ece8dc', '#2e5a9e'], [24, -12, -.2, 10, 6, '#e0dcd0', '#4a7aaa'], [-28, 10, Math.PI / 2, 8, 5, '#ece8dc', '#d8b24a']]) { put(habGeo(w, d, col, trim), Hl.x + dx, Hl.z + dz, ry); solid(Hl.x + dx, Hl.z + dz, w, d, ry); }
  for (const [dx, dz] of [[-10, -8], [10, -8], [-16, 2], [16, 2], [-6, -22], [6, -22], [40, 12], [60, 14]]) put(lampGeo(), Hl.x + dx, Hl.z + dz);
  put(shipGeo('#c8d0d8', '#2e5a9e'), Pad.x, Pad.z, Math.PI); solid(Pad.x, Pad.z - 1, 9, 13);
  // towers along the Processional and through the quarters
  for (let i = 0; i < 46; i++) { const x = (rng() * 2 - 1) * 250, z = (rng() * 2 - 1) * 250; if (onRoad(x, z) || Math.abs(x) < 16 && z > -170 && z < 120 || [Hl, Pad, Gd, Uw, Ob].some(t => Math.hypot(x - t.x, z - t.z) < t.R + 22) || Math.hypot(x - St.x, z - St.z) < 30 || Math.hypot(x - Dk.x, z - Dk.z) < 26) continue;
    const w = 7 + rng() * 6, h = 16 + rng() * 34; put(tower(w, h, pk(['#e8e4d8', '#d8dce4', '#dcd4c4', '#c8d0d8']), pk(['#6ad8ff', '#ffe9a0', '#bfe6ff'])), x, z, 0); solid(x, z, w, w); }
  // the Gardens: trees, hedges and a fountain
  put(build([P(T(Cyl(5, 5.4, .8, 14), 0, .4), 0, O, '#d8d4c8'), P(T(Cyl(4.4, 4.4, .3, 14), 0, .8), 0, O, '#6ad8ff', .8), P(T(Cyl(.5, .8, 4, 6), 0, 2.4), 0, O, '#ece8dc'), P(T(Oct(.7), 0, 5), 0, O, '#ffe9a0', 2.4)]), Gd.x, Gd.z); solid(Gd.x, Gd.z, 8, 8);
  for (let i = 0; i < 26; i++) { const a = rng() * TAU, d = 12 + rng() * (Gd.R - 10); put(build([P(T(Box(5, 1.4, 1), 0, .7), 0, O, '#3a6a32')]), Gd.x + Math.cos(a) * d, Gd.z + Math.sin(a) * d, rng() * TAU); }
  // the Lower Streets and Dockside: low blocks, stalls, warehouses and berthed haulers
  for (let i = 0; i < 12; i++) { const a = i / 12 * TAU, d = 22 + rng() * 26, w = 7 + rng() * 3; put(habGeo(w, 5, pk(['#8a8478', '#7a7872', '#9a8a78']), pk(['#8a3a22', '#3a6a5a', '#5a4a6a'])), St.x + Math.cos(a) * d, St.z + Math.sin(a) * d, a); solid(St.x + Math.cos(a) * d, St.z + Math.sin(a) * d, w, 5, a); }
  for (let i = 0; i < 7; i++) { const a = i / 7 * TAU, d = 24 + rng() * 16; put(habGeo(12, 8, '#6a6a68', '#c8782a'), Dk.x + Math.cos(a) * d, Dk.z + Math.sin(a) * d, a + 1); solid(Dk.x + Math.cos(a) * d, Dk.z + Math.sin(a) * d, 12, 8, a + 1); }
  put(shipGeo('#4a4a52', '#c0392b'), Dk.x + 4, Dk.z - 2, .8, 1.3); solid(Dk.x + 4, Dk.z - 2, 14, 14);
  for (let i = 0; i < 16; i++) put(crateGeo(), Dk.x + (rng() - .5) * 50, Dk.z + (rng() - .5) * 50, rng() * TAU, 1 + rng());
  // the Underway: arches over a sunken transit cutting
  for (let k = 0; k < 7; k++) put(build([P(T(new THREE.TorusGeometry(11, 1, 5, 12, Math.PI), 0, 0, 0), 0, O, '#6a6a72'), ...LR.map(s => P(T(Box(2, 4, 2), 11 * s, 1), 0, O, '#5a5a62')), P(T(Oct(.5), 0, 9.6, 0), 0, O, '#8dff5a', 2)]), Uw.x, Uw.z + 34 - k * 11, 0);
  // the Old Observatory
  put(build([P(T(Cyl(11, 12, 6, 14), 0, 3), 0, O, '#e0dcd0'), P(T(Sph(10.4, 16, 9, 0, TAU, 0, Math.PI / 2), 0, 6), 0, O, '#c8d0d8'), P(T(Box(2.4, 9, 12), 0, 9, 2, .5), 0, O, '#1c2026'), P(T(Cyl(1.2, 1.6, 12, 8), 0, 12, 5, .9), 0, O, '#8a9098'), P(T(Box(3.6, 4.4, 1), 0, 2.2, 11.8), 0, O, '#2a2e34')]), Ob.x, Ob.z - 6);
  for (let k = 0; k < 10; k++) { const a = k / 10 * TAU, b = (k + 1) / 10 * TAU; addWall(Ob.x + Math.cos(a) * 11.6, Ob.z - 6 + Math.sin(a) * 11.6, Ob.x + Math.cos(b) * 11.6, Ob.z - 6 + Math.sin(b) * 11.6, .5); }
  meshWithOutline(mergeBuilt(items), .05); linkDoors();
  world.places = [{ name: 'The Lantern Plaza', x: Hl.x, z: Hl.z, R: Hl.R, kind: 'town' }, { name: 'The Landing Terrace', x: Pad.x, z: Pad.z, R: Pad.R, kind: 'town' }, { name: 'The Gardens', x: Gd.x, z: Gd.z, R: Gd.R, kind: 'camp' }, { name: 'The Lower Streets', x: St.x, z: St.z, R: St.R, kind: 'camp' },
    { name: 'Dockside', x: Dk.x, z: Dk.z, R: Dk.R, kind: 'camp' }, { name: 'The Underway', x: Uw.x, z: Uw.z, R: Uw.R, kind: 'dungeon' }, { name: 'The Old Observatory', x: Ob.x, z: Ob.z, R: Ob.R, kind: 'dungeon' }];
  world.town = Hl;
  world.towns = [{ key: 'lamp', name: 'The Lantern Plaza', x: Hl.x, z: Hl.z, R: Hl.R, guardName: 'City Watch', npcs: [['giver', 'varen', 0, 3], ['giver', 'voss', 18, -8], ['giver', 'abel', -18, -6], ['giver', 'harrow', -9, -16], ['vendor', 'aur', 12, 8], ['bind', null, -8, 6], ['armory', null, 20, 4]], guards: [[-5, -Hl.R + 4], [5, -Hl.R + 4], [Hl.R - 5, 0], [-Hl.R + 5, 0], [26, 14], [-12, -4]] },
    { key: 'gard', name: 'The Gardens', x: Gd.x + 40, z: Gd.z + 30, R: 8, guardName: 'City Watch', npcs: [['giver', 'pim', 0, 0]], guards: [[4, 3]] }];
  world.storyNpcs.push({ key: 'kato', x: Hl.x + 14, z: Hl.z - 20, yaw: 2.4, unless: ['jcrew2', '*'] });
  world.mapLabels = [{ t: 'Rogue drones, stalkers (6-7)', x: Gd.x, z: Gd.z + 40 }, { t: 'The Dimmers (7-8)', x: St.x, z: St.z + 30 }, { t: 'Imperial agents (8-9)', x: Dk.x, z: Dk.z + 30 }, { t: 'The Underway (8-9)', x: Uw.x, z: Uw.z + 40 }, { t: 'The Bureau (9-10)', x: Ob.x, z: Ob.z + 60 }];
  world.zoneLines.push({ x: Pad.x, z: Pad.z + 11, r: 2.6, to: 'ship', label: 'Board the Vigilant' });
  Object.assign(world.spots, { town: { x: Hl.x, z: Hl.z }, hall: { x: Hl.x, z: Hl.z }, pad: { x: Pad.x, z: Pad.z }, gardens: { x: Gd.x, z: Gd.z }, streets: { x: St.x, z: St.z }, dockside: { x: Dk.x - 30, z: Dk.z + 30, r: 30 }, underway: { x: Uw.x, z: Uw.z + 20 }, underdeep: { x: Uw.x, z: Uw.z - 30 }, obs: { x: Ob.x, z: Ob.z + 40 }, obsdeep: { x: Ob.x, z: Ob.z + 10 } });
  world.clearSpots = [{ x: Hl.x, z: Hl.z, r: Hl.R + 24 }, { x: Pad.x, z: Pad.z, r: Pad.R + 20 }, { x: Gd.x + 40, z: Gd.z + 30, r: 14 }];
  const prop = (kind, tag, name, x, z, o = {}) => world.props.push({ id: 'c' + world.props.length, kind, tag, name, x, z, yaw: o.yaw ?? rng() * TAU, lore: o.lore || null, scale: o.scale || 1, when: o.when, unless: o.unless });
  for (let i = 0; i < 8; i++) { const a = i / 8 * TAU, d = 12 + rng() * 34; prop('terminal', 'terminal', 'Public records terminal', St.x + Math.cos(a) * d, St.z + Math.sin(a) * d); }
  prop('forge', 'forge', 'The Lamp Forge', Hl.x + 9, Hl.z + 2, { yaw: 0 });
  prop('crate', 'lore', "Kessler's manifest", Dk.x - 6, Dk.z + 8, { lore: 'kesslerbill', yaw: 1 }); prop('console', 'lore', "Crane's sermon", Uw.x + 4, Uw.z - 34, { lore: 'cranesermon', yaw: 2 }); prop('console', 'lore', 'The observatory plate', Ob.x - 6, Ob.z + 12, { lore: 'strandplate', yaw: 0 });
  const sp = world.spawns, put2 = o => sp.push({ ...o, y: hgt(o.x, o.z), alive: null, timer: 0 });
  const free = p => !world.clearSpots.some(c => Math.hypot(c.x - p.x, c.z - p.z) < c.r) && !world.walls.some(w => Math.hypot((w.x1 + w.x2) / 2 - p.x, (w.z1 + w.z2) / 2 - p.z) < 6);
  const land = (c, rad, min = 10) => { for (let i = 0; i < 300; i++) { const a = rng() * TAU, d = Math.sqrt(rng()) * rad, p = { x: c.x + Math.cos(a) * d, z: c.z + Math.sin(a) * d }; if (free(p) && !sp.some(s => Math.hypot(s.x - p.x, s.z - p.z) < min)) return p; } return null; };
  const scatter = (n, c, rad, mobs, lvl, area, o = {}) => { for (let i = 0; i < n; i++) { const p = land(c, rad, o.min || 12); if (p) put2({ ...p, mob: pk(mobs), lvl, respawn: 60, area, ...o }); } };
  const camp = (n, c, rad, mobs, lvl, area, tag, o = {}) => { for (let i = 0; i < n; i++) { const p = land(c, rad, 24); if (!p) continue; for (let k = 0; k < mobs.length; k++) { const a = k / mobs.length * TAU; put2({ x: p.x + Math.cos(a) * 3, z: p.z + Math.sin(a) * 3, mob: mobs[k], lvl, respawn: 85, camp: tag + i, area, solo: true, ...o }); } } };
  scatter(34, Gd, Gd.R + 10, ['gdrone', 'gdrone', 'servo', 'stalker', 'stalker'], [6, 7], 0, { solo: true });
  scatter(12, St, St.R, ['dimthug', 'dimpreacher'], [7, 7], 1, { solo: true }); camp(8, St, St.R, ['dimthug', 'dimpreacher'], [7, 8], 1, 'ls'); camp(3, St, St.R, ['dimthug', 'dimthug', 'dimpreacher'], [8, 8], 1, 'lt');
  camp(8, Dk, Dk.R, ['impagent', 'impgun'], [8, 9], 2, 'dk'); camp(3, Dk, Dk.R - 10, ['impagent', 'impgun', 'impagent'], [8, 9], 2, 'dl');
  put2({ x: Dk.x - 8, z: Dk.z + 6, mob: 'kessler', lvl: [8, 8], respawn: 900, named: 'kessler', area: 2 });
  [[-6, 30, ['dimthug', 'cityrisen']], [6, 22, ['cityrisen', 'dimpreacher', 'cityrisen']], [-6, 8, ['dimthug', 'dimthug', 'dimpreacher']], [6, -4, ['cityrisen', 'cityrisen', 'dimthug']], [-5, -16, ['dimpreacher', 'cityrisen', 'dimthug']], [5, -26, ['cityrisen', 'dimthug', 'dimpreacher']]].forEach(([dx, dz, mobs], i) => mobs.forEach((m, k) => put2({ x: Uw.x + dx + (k % 2) * 2.2, z: Uw.z + dz + (k > 1 ? 2.2 : 0), mob: m, lvl: [8, 9], respawn: 240, camp: 'uw' + i, area: 3, dungeon: true, solo: true })));
  put2({ x: Uw.x, z: Uw.z - 34, mob: 'crane', lvl: [9, 9], respawn: 1200, named: 'crane', area: 3, dungeon: true, boss: true });
  [[-20, 44, ['burguard', 'burgun']], [20, 42, ['burguard', 'burmed', 'burgun']], [-26, 16, ['burgun', 'burgun', 'burguard']], [26, 14, ['burguard', 'burmed', 'burgun']], [-14, 24, ['burguard', 'burguard', 'burmed']], [14, 26, ['burgun', 'burguard', 'burgun']]].forEach(([dx, dz, mobs], i) => mobs.forEach((m, k) => put2({ x: Ob.x + dx + (k % 2) * 2.2, z: Ob.z + dz + (k > 1 ? 2.2 : 0), mob: m, lvl: [9, 10], respawn: 240, camp: 'ob' + i, area: 4, dungeon: true, solo: true })));
  put2({ x: Ob.x + 10, z: Ob.z + 34, mob: 'roth', lvl: [9, 9], respawn: 900, named: 'roth', area: 4, dungeon: true, boss2: true });
  put2({ x: Ob.x, z: Ob.z + 12, mob: 'strand', lvl: [10, 10], respawn: 1400, named: 'strand', area: 4, dungeon: true, boss: true });
  { const p = land({ x: Gd.x - 20, z: Gd.z - 10 }, 30, 20) || { x: Gd.x - 30, z: Gd.z }; put2({ ...p, mob: 'bramble', lvl: [7, 7], respawn: 600, named: 'bramble', area: 0 }); }
  world.huntAreas = [{ area: 0, lvl: [6, 7] }, { area: 1, lvl: [7, 8] }, { area: 2, lvl: [8, 9] }, { area: 3, lvl: [8, 9] }, { area: 4, lvl: [9, 10] }];
  const trees = [];
  for (let n = 0; n < 700; n++) { const a = rng() * TAU, d = 8 + Math.sqrt(rng()) * (Gd.R + 16), x = Gd.x + Math.cos(a) * d, z = Gd.z + Math.sin(a) * d; if (onRoad(x, z) || Math.hypot(x - (Gd.x + 40), z - (Gd.z + 30)) < 12) continue; if (rng() < .35) trees.push([x, hgt(x, z) - .1, z, rng() * 6.3, 0, 0, 1.2 + rng() * 1.2]); }
  for (let z = -160; z < 110; z += 16) for (const s of LR) trees.push([s * 12, hgt(s * 12, z) - .1, z, rng() * 6.3, 0, 0, 1.3]);
  addChunked(fanTreeGeo(), propMat, trees, .04);
  world.trees = trees.map(t => ({ x: t[0], z: t[2], r: .4 }));
  world.minimap = minimapFrom(colorAt);
  return world;
});
X.light.push(() => { if (S.zone !== 'city') return; const u = R.skyMat.uniforms; u.top.value.lerp(new THREE.Color('#3a6ab0'), .5); u.mid.value.lerp(new THREE.Color('#c8dcf0'), .5); u.hor.value.lerp(new THREE.Color('#fff0d8'), .5); R.scene.fog.color.lerp(new THREE.Color('#e8eef4'), .5); });
X.zone.push(zone => { if (zone === 'city') S.ext.sys = 'aurelis'; });

// ---------- people ----------
Object.assign(X.vend, { aur: 'Provisioner Lys' });
Object.assign(GIVERS, {
  varen: { name: 'Lantern-Master Ilse Varen', title: 'Head of the lamp-keepers', model: 'n_varen' }, voss: { name: 'Inspector Nadia Voss', title: 'City Watch', model: 'n_voss' },
  abel: { name: 'ABEL-7', title: 'Records droid · Senate archive', model: 'n_abel' }, harrow: { name: 'Senator Lucan Harrow', title: 'Chair, Committee on Stellar Survey', model: 'n_harrow' },
  kato: { name: 'Sergeant Kato Renn', title: 'Formerly of the Bureau', model: 'n_kato' }, pim: { name: 'Head Groundskeeper Pim Alder', title: 'The Gardens', model: 'n_pim' },
});
Object.assign(TALK, {
  varen: { bio: "Ilse Varen has led the lamp-keepers for twenty-two years, through four governments and one attempt to turn the Lantern Hall into a museum. She is eighty-one, sharp as a pin, and has begun to suspect that the order's founders left out the important part.",
    greet: ["Come in out of the plaza, novice. The Senate has ears there, and so, I am beginning to think, does everybody else.", "The lamp above this Hall was lit from a flame that was lit from a flame, back two thousand years to the first one. I have never let it go out. I should like to know what happens if it does."],
    topics: [{ q: 'What do you think the lamps are for?', a: ["I was taught they are a memorial. We lit one when the Gravelord fell, and we have kept it out of gratitude ever since. It is a lovely story and I told it to novices for forty years.", "But our oldest texts do not say 'memorial'. They say 'ward'. I had always taken that for an old word meaning much the same thing. I no longer think it means the same thing at all."] },
      { q: 'Can the order trust the Senate?', a: ["Most of it. The Senate is three hundred people who mainly want to be re-elected, and that is a fear you can reason with.", "It is the handful who are not afraid that worry me. Somebody has been managing what this city knows about the sky, calmly and well, for years. Calm people are much harder to move than frightened ones."] }] },
  voss: { bio: "Nadia Voss has been an inspector of the City Watch for fifteen years and has closed every case she was allowed to finish. There is a drawer in her desk for the others. It is a large drawer.",
    greet: ["Inspector Voss, City Watch. If you've come to tell me the order has a problem, get in line behind the cult, the docks and the Gardens.", "I like evidence, novice. Evidence doesn't have a patron in the Senate."],
    topics: [{ q: 'Who are the Dimmers?', a: ["A year ago, nobody. Then people started noticing that the star charts their children brought home from school didn't match the sky. The Dimmers were the only ones offering an explanation.", "It's a bad explanation. But I'll tell you what bothers me: they have money. Halls, printing, lanterns by the thousand. Frightened clerks don't fund that. Somebody is paying for this city to be afraid."] }] },
  abel: { bio: "ABEL-7 has kept the Senate's public archive for a hundred and sixty years and takes a professional pride in never having lost a document. It has recently discovered that documents can be removed without being lost, and it finds the distinction upsetting.",
    greet: ["Good day. I am ABEL-7, records. I am required to say that all public records are available on request. I am not required to believe it any longer.", "You are from the Lantern Hall. I have been hoping somebody would come. I am not permitted to raise concerns. I am, however, permitted to answer questions."],
    topics: [{ q: 'What is wrong with the archive?', a: ["There are gaps. Reports from the Bureau of Stellar Survey, filed over nine years, each withdrawn within a day. A withdrawn record is not deleted. It is merely unavailable, to everyone, permanently.", "I have counted thirty-eight withdrawals. I am a records droid. I notice when a number keeps going up."] }] },
  harrow: { bio: "Lucan Harrow has chaired the Committee on Stellar Survey for nine years and is widely agreed to be the most reasonable man in the Senate. He remembers everyone's name, never raises his voice, and has not once in his career been surprised by anything.",
    greet: ["A novice of the lamp-keepers! Welcome to Aurelis. Your order is very dear to this city, you know. Very dear. Do tell the Lantern-Master I said so.", "Stars? My dear novice, stars are a matter for specialists. I merely chair the committee. I assure you that if there were anything to be concerned about, I should be the very first to be concerned."],
    topics: [{ q: 'Are the stars going out?', a: ["What a question. Stars are born and stars fade; that is simply astronomy, and has been since long before either of us. There are a great many stars. I should not lose sleep over one or two.", "People frighten so easily, don't you find? That is really the whole of government: seeing to it that they have no reason to. Now, you must excuse me. Do enjoy the Gardens. They are lovely at this time of year, once the drones are dealt with."] }] },
  kato: { bio: "Kato Renn served eleven years in Bureau security, guarding a hill he was never allowed to climb. He resigned the day he finally asked what was at the top and was told that asking had been noted.",
    greet: ["You're the order's novice. Voss said you'd come. Sit where I can see the door.", "Eleven years I stood on that hill. I knew every guard's name and not one thing about what we were guarding."], topics: [] },
  pim: { bio: "Pim Alder has kept the Gardens for thirty years and knows every tree by its planting date. Somebody reprogrammed his drones and opened the Menagerie on the same night, and he would like a word with them, preferably with a spade.",
    greet: ["Keep to the paths, if there are any left. My own drones chased me out of the rose walk this morning.", "Thirty years I've kept these beds. I won't have them ruined by a machine that's forgotten the difference between pruning and assault."], topics: [] },
  'vendor:aur': { bio: 'Provisioner Lys keeps a stall on the plaza and supplies half the Lantern Hall, which pays late and blesses the invoices.', greet: ["Medigel, cells, and lamp oil for the devout. The oil's very popular this year.", "Everything's dearer since the Dimmers started buying up lanterns. I don't ask what for."], topics: [] },
});
Object.assign(LORE, {
  kesslerbill: { title: "Kessler's Manifest", where: 'dockside', text: "A bill of lading in good order. 'Thirty-eight sealed reports of the Bureau of Stellar Survey, withdrawn from public record, sold as waste paper by the Committee's own clerk. Purchaser: the Imperial Office of Lamplighters, by its accredited envoy. Price: nominal.' And below, in Kessler's hand: 'They are selling us their own blindness. The Senator believes he is merely tidying. I have not corrected him. Query to my office: we now know as much as the Republic knew and hid. It is still not enough. Neither of us knows what is doing this.'" },
  cranesermon: { title: "Deacon Crane's Sermon", where: 'underdeep', text: "'Brothers, sisters. The keepers above us light their lamp and call it remembrance. Canon Roe has read the first book, the one they keep locked, and it does not say remembrance. It says: so long as these burn, it cannot pass. They have known for two thousand years that something stands outside. They chose to forget. And who feeds us, you ask? Who buys our lanterns and prints our tracts? I do not know his name. His letters come from the Senate hill, and they say only: let them be afraid of you, so that they do not look up.'" },
  strandplate: { title: 'The Observatory Plate', where: 'obsdeep', text: "A photographic plate of the Republic's border sun, taken last week, beside one taken nine years ago. The newer is visibly dimmer. Clipped to it, a memorandum: 'Director Strand to Senator Harrow. The thirty-ninth is failing faster than the others did. Perhaps a year. The Imperial bureau has the same figure; they are moving a fleet. I recommend we move ours, publicly, as an exercise. I recommend we tell the fleet nothing. I have told you for nine years that we have no explanation and no remedy. You have told me for nine years that this is therefore not yet a matter for the public. I no longer know which of us is right. I know that I am tired.'" },
});

// ---------- quests ----------
const qx = (lvl, f) => Math.round(xpNeed(lvl) * f * .36);
const Z = { zone: 'city', path: 'justice' }, DIM = ['dimthug', 'dimpreacher'], IMPA = ['impagent', 'impgun'];
QUESTS.push(
  { id: 'jc_c1', story: true, ...Z, giver: 'varen', lvl: 6, pre: 'jf_j11', name: 'The Lamps Are Failing', where: 'streets', xp: qx(6, .7), gold: 16, obj: { kill: DIM, n: 10, what: 'Defeat 10 Dimmer Zealots or Preachers in the Lower Streets, east of the plaza' },
    say: ["You met Thessaly Roe's work on Cairn. Come and see it in my own city. They call themselves the Dimmers. They stand on corners in the Lower Streets with green lanterns and tell frightened people that the stars are going out and that we in this Hall have always known.", "The first half is true, novice, which is why it works. I cannot have them beating clerks in the street for wearing our badge. Ten of them. And listen to what they shout. I want to know who taught it to them."],
    done: ["Ten, and they all had the same phrases, word for word, as if from a printed sheet. Frightened people do not print sheets. Somebody is organising this, and paying for it. Go and speak to the Senate's records droid. If the truth has been tidied away, ABEL will have noticed the dust."] },
  { id: 'jc_c2', story: true, ...Z, giver: 'abel', lvl: 7, pre: 'jc_c1', name: 'Withdrawn', where: 'streets', xp: qx(7, .65), gold: 18, obj: { inspect: 'terminal', n: 5, what: 'Query 5 public records terminals in the Lower Streets for withdrawn Bureau reports' },
    say: ["I am not permitted to restore a withdrawn record. I am, however, required to maintain the public terminals, and I have observed that a terminal keeps a local copy of whatever was displayed on it last. This is a known fault. I have declined to report it for nine years.", "There are terminals throughout the Lower Streets. If someone were to query five of them for Bureau of Stellar Survey filings, that someone might find the local copies intact. I could not possibly suggest it. I merely describe the fault."],
    done: ["You have recovered fragments of thirty-eight reports. Each describes a star that has ceased to be observable. Each was withdrawn within a day, on the authority of the Committee on Stellar Survey. I am a records droid. I am not built for alarm. I find that I am alarmed."] },
  { id: 'jc_c3', story: true, ...Z, giver: 'abel', turnTo: 'voss', lvl: 8, pre: 'jc_c2', name: 'Waste Paper', where: 'dockside', xp: qx(8, .5), gold: 18, obj: { at: 'dockside', r: 34, what: 'Scout the Dockside warehouses in the north-east, then report to Inspector Voss on the plaza' },
    say: ["There is a further irregularity. Withdrawn records are meant to be held in sealed storage. Mine were instead released for disposal, as waste paper, to a carter. I have the carter's docket. The paper was delivered to a warehouse at Dockside.", "Waste paper is pulped. It is not delivered to a bonded warehouse under guard. Please go and look, and take what you see to Inspector Voss of the Watch. She is the only official in this city who has ever asked me a question and waited for the answer."],
    done: [['voss', "Imperial agents, at Dockside, with diplomatic papers, sitting on thirty-eight crates of Republic state secrets that the Republic sold them as scrap. I want to be surprised. I've worked this city too long."], ['voss', "I can't arrest an accredited envoy. But there's no law says a lamp-keeper can't walk into a warehouse. Funny thing, the order's charter. It's older than the diplomatic code, and nobody ever thought to bring it up to date."]] },
  { id: 'jc_c4', story: true, ...Z, giver: 'voss', lvl: 8, pre: 'jc_c3', name: 'Diplomatic Immunity', where: 'dockside', xp: qx(8, .8), gold: 28, obj: { kill: IMPA, n: 12, what: 'Defeat 12 Imperial Agents or Marksmen at Dockside' },
    say: ["Here's how this works. If the Watch touches them, the Empire files a protest and I'm directing traffic by the weekend. If the order touches them, the Empire has to explain what its agents were doing with our withdrawn records, and it would rather not.", "So I'm going to be looking the other way, quite hard, for about an hour. Twelve of them, novice. Mind the roofs. Their marksmen are listed as cultural attachés, and they're very cultured at two hundred metres."],
    done: ["Twelve, and not one protest filed. Thought not. Now for the envoy himself. Kessler's the one who signs for the crates, and a man who signs for things keeps the receipts."] },
  { id: 'jc_c5', story: true, ...Z, giver: 'voss', lvl: 8, pre: 'jc_c4', name: 'The Envoy', where: 'dockside', xp: qx(8, .8), gold: 32, gear: true, lore: 'kesslerbill', obj: { named: 'kessler', n: 1, what: 'Defeat Envoy Kessler in the Dockside warehouse and take his manifest' },
    say: ["Kessler's in the big warehouse by the berthed hauler. He won't run. Men like that never do, they think the paperwork will protect them. Bring me his manifest. I want to see whose signature is on the selling side.", "Take company. He keeps agents close, and he'll talk the whole time. Don't let him. Every word out of that man is a negotiation."],
    done: ["'Sold as waste paper by the Committee's own clerk.' The Committee on Stellar Survey. That's Senator Harrow's committee, novice. The most reasonable man in the Senate. I've shaken his hand. He asked after my mother."] },
  { id: 'jc_c6', story: true, ...Z, giver: 'varen', lvl: 9, pre: 'jc_c5', name: 'Beneath the Hall', where: 'underdeep', xp: qx(9, .9), gold: 40, gear: true, lore: 'cranesermon', obj: { named: 'crane', n: 1, what: 'Defeat Deacon Hollis Crane in the Underway, the old transit cutting north-west of the plaza' },
    say: ["While you were at the docks, the Dimmers moved. They have taken the Underway, the old transit cutting that runs beneath this quarter, and my keepers tell me there is green light in it at night. Their deacon is a man named Crane. He was Thessaly Roe's pupil.", "He is raising the dead from the old undercity vaults, novice, in my city, under my lamp. I will not have it. Take a full group. And if he says anything about who has been paying for all this, remember it exactly."],
    done: ["'His letters come from the Senate hill.' So the hand that hides the truth is the same hand that pays the Dimmers to shout it. Do you see? He lets them frighten the city so that nobody looks up, and so that anyone who does sounds like one of them. It is very clever. I am quite angry."] },
  { id: 'jc_c7', story: true, ...Z, giver: 'voss', turnTo: 'kato', lvl: 9, pre: 'jc_c6', name: 'A Man Who Stood on the Hill', where: 'town', xp: qx(9, .3), gold: 10, obj: { talk: true, what: 'Find Sergeant Kato Renn on the Lantern Plaza' },
    say: ["Everything points up the same hill. The Old Observatory. The Bureau closed it to the public nine years ago and put security round it thick as a wall. I can't get a warrant. I've asked. The judge was very reasonable about refusing.", "But I know a man who used to guard it. Kato Renn. He quit the Bureau last year and he's been drinking tea on the plaza ever since, watching that hill. Go and tell him somebody finally wants to know what's up there."],
    done: [['kato', "Eleven years on that hill and nobody ever asked me what I thought. Then I asked one question myself, and a clerk wrote my name down. I resigned that afternoon. Seemed wise."], ['kato', "I know the patrols, the stair and where the captain stands. I'll take you up. I've wanted to see the inside of that dome for eleven years, and I'd like to do it standing next to somebody who isn't afraid of it."]] },
  { id: 'jc_c8', story: true, ...Z, giver: 'kato', turnTo: 'varen', lvl: 10, pre: 'jc_c7', name: 'The Director', where: 'obsdeep', xp: qx(10, 1), gold: 60, gear: true, lore: 'strandplate', obj: { named: 'strand', n: 1, what: 'Defeat Director Maeve Strand in the Old Observatory, then return to Lantern-Master Varen' },
    say: ["The Observatory's on the hill at the north end of the Processional. Bureau guards on the slope, rifles on the terrace, and Captain Roth on the stair. He's a decent man who never asked. Go round him if you can. You won't be able to.", "Director Strand works in the dome. She's not a soldier, but she's had nine years to plan for the day somebody came up, and she won't let the plates leave. Full group, Captain. That's what Mira calls you, isn't it? It suits."],
    done: [['varen', "Give me the plate. Yes. Our border sun, nine years ago and last week. One does not need to be an astronomer."], ['varen', "Strand told the Senator it has perhaps a year. Two fleets are already moving to stand under it, ours and the Empire's, and neither admiral has been told why. That is where this goes next, novice: to the border, before two navies who know nothing start a war over a dying star. And Harrow sits in the Senate still, and is very reasonable, and I cannot touch him. Yet."]] },
  { id: 'jc_c9', story: true, ...Z, giver: 'varen', turnTo: 'kato', lvl: 10, pre: 'jc_c8', when: () => (S.hero?.lvl || 1) >= 10, name: 'One More for the Vigilant', where: 'town', xp: qx(10, .3), gold: 20, obj: { talk: true, what: 'Offer Sergeant Kato Renn a berth aboard the Vigilant' },
    say: ["You will need more than a pilot where you are going. The border is about to hold two fleets and a great deal of fear.", "Sergeant Renn went up that hill with you when he had every reason to stay on his bench. A man who has finally asked his question does not go back to not asking. Offer him a place. I think he has been waiting eleven years to be offered one."],
    done: [['kato', "A berth on an order ship. My old captain would have a fit. Mind you, my old captain is having rather a bad week already."], ['kato', "I'm in. I'll tell you now, I don't pray and I don't understand your lamps. But I know how to stand a watch, and it seems to me that's most of what you people do."]] },
  { id: 'jc_c10', story: true, ...Z, cls: 'wardancer', giver: 'varen', lvl: 10, pre: 'jc_c8', when: () => (S.hero?.lvl || 1) >= 10, name: 'Light Your Own', where: 'town', xp: qx(10, .5), gold: 0, obj: { inspect: 'forge', n: 1, what: 'Kindle your own lamp blade at the Lamp Forge beside the Lantern Hall' },
    say: ["You have carried a training blade since Cairn. It was lit by another hand, and it shows. A dim, borrowed thing. A Lamp Knight's true blade is lit by the knight, once, from the Hall's own flame, and it burns in whatever colour that knight's nature gives it.", "The Lamp Forge stands on the plaza, there by the Hall. Go and put your hand in the flame. It will not burn you. If it does, we shall both have learned something, and I shall be very sorry."],
    done: ["There. Look at it. That is yours, novice, and nobody else's, and it will not go out while you live. I lit mine sixty years ago and I remember thinking the same thing you are thinking now. Go carefully with it."] },
  { id: 'jc_g1', ...Z, giver: 'pim', lvl: 6, name: 'Pruning', where: 'gardens', xp: qx(6, .7), gold: 14, obj: { kill: ['gdrone', 'servo'], n: 10, what: 'Shut down 10 Groundskeeper Drones or Maintenance Loaders in the Gardens' },
    say: ["Somebody got into my drones' routines. Thirty years they've trimmed hedges, and overnight they've decided visitors are a kind of weed. I had a senator's aide up a tree for two hours this morning. I left him there a while. He once walked on my lawn.", "Shut down ten of them for me. Don't be gentle, I can rebuild a drone. I can't rebuild a three-hundred-year-old rose walk."],
    done: ["Ten off. That's the east lawn safe, at least. Whoever did this knew what they were about. You don't empty a public garden by accident. Somebody wanted fewer people out walking and talking under the open sky."] },
  { id: 'jc_g2', ...Z, giver: 'pim', lvl: 7, pre: 'jc_g1', name: 'Docile', where: 'gardens', xp: qx(7, .7), gold: 30, gear: true, obj: { named: 'bramble', n: 1, what: 'Defeat Bramble, the escaped menagerie beast, in the Gardens' },
    say: ["The Menagerie cages were opened the same night as my drones went wrong. Most of the animals we've rounded up. One we haven't. Bramble. The plaque called it docile, and I've been telling the Senate for years that the plaque was written by somebody who'd never met it.", "It's in the rose beds on the west side. I'm fond of the old brute, but it's had a gardener's arm, and I can't have that."],
    done: ["Poor old Bramble. It never asked to be put in a cage in the first place. Here, for your trouble. And if you ever find out who opened those gates, you tell me before you tell the Watch."] },
  { id: 'jc_h1', ...Z, giver: 'harrow', lvl: 6, name: 'A Matter of Public Confidence', where: 'gardens', xp: qx(6, .7), gold: 24, obj: { kill: ['stalker'], n: 8, what: 'Defeat 8 Menagerie Stalkers in the Gardens' },
    say: ["My dear novice, might I impose? The Gardens are in a dreadful state. Hunting cats loose from the Menagerie, of all things. The public is quite upset, and an upset public is such a tiresome thing to govern.", "If the order could see its way to removing, say, eight of the creatures, I should be most grateful, and so would the Committee. It would be a great comfort to people to see the lamp-keepers out doing something visible and ordinary. So much better than all this talk about the sky."],
    done: ["Splendid. Eight, and done so quietly. You have a real gift for reassurance, novice. Do take this. And do, please, give my warmest regards to the Lantern-Master. Tell her I think of the order often. Very often indeed."] },
  { id: 'jc_v1', ...Z, giver: 'voss', lvl: 9, pre: 'jc_c5', name: 'The Captain on the Stair', where: 'obs', xp: qx(9, .7), gold: 36, gear: true, obj: { named: 'roth', n: 1, what: 'Defeat Captain Ilan Roth on Observatory Hill' },
    say: ["Bureau security has started stopping my officers at the foot of Observatory Hill. Their captain's a man named Roth. I looked him up. Clean record, two commendations, never asked a question in his life.", "I've no quarrel with him, but he's standing on a public stair with rifles and no warrant, and I've a city to run. Move him."],
    done: ["Roth's down and the stair's open. I'll have the Watch post it tonight. He'll wake up in my infirmary, and I'm going to sit by the bed and ask him what he thought he was guarding. I'd like to see his face when he realises he doesn't know."] },
);
CREW.kato = { name: 'Kato Renn', pal: 1, flag: 'jcrew2', hi: "Sergeant Renn, coming aboard. Show me where the watch rota is, Captain. If there isn't one, I'll write it.", pick: role => role === 'dps' ? 'bulwark' : 'longwatch' };
function pickBlade() {
  UI.openSheet('Your lamp blade', body => {
    const p = document.createElement('p'); p.textContent = 'The flame takes your hand and does not burn. What colour does it turn?'; body.appendChild(p);
    for (const [k, [n, c]] of Object.entries(BLADE_COLS)) { const b = document.createElement('button'); b.className = 'opt'; b.style.cssText = `display:block;width:100%;margin:6px 0;text-align:left;border-left:6px solid ${c}`; b.textContent = n; b.onclick = () => {
      S.ext.blade = k; const L = S.hero.lvl, it = makeItem({ name: `${n} Lamp Blade`, slot: 'weapon', type: 'lampblade', lvl: L, rarity: 3, stats: { pow: 10 + L * 3, sta: 4 + L * 2, crit: 2 }, value: 0 });
      const g = S.gear.wardancer; if (g) { g.weapon = it; Game.applyGear(S.hero, g); } S.hero.kind = 'lk_' + k; chat('loot', null, `You kindle your own lamp blade. It burns ${n.toLowerCase()}.`); Game.save(); UI.closeSheet(); }; body.appendChild(b); }
  });
}
X.turnin.push(q => { if (q.id === 'jc_c9') X.recruit?.('kato'); if (q.id === 'jc_c10') setTimeout(pickBlade, 400); });
Object.assign(LFG_D, { underway: { name: 'The Underway', lvl: [8, 9], zone: 'city', at: () => ({ x: D5.underway.x, z: D5.underway.z + 52 }) }, observatory: { name: 'The Old Observatory', lvl: [9, 10], zone: 'city', at: () => ({ x: D5.obs.x, z: D5.obs.z + 70 }) } });
