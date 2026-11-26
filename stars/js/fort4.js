// Stars Beneath, Build 4: Cairn, a Republic border world (levels 1-5). The justice start.
// Fort Lastlight stands in the south with its landing pad. Snowfields ring it, deserters hold the Supply Road to the
// north-west, an Imperial listening post has gone up in the east, and in the Barrow Cut to the north somebody is
// digging up three hundred years of the garrison's dead.
import * as THREE from './three.js';
import { S, WH, TAU, lerp, mulberry32, makeNoise, chat, X } from './core.js';
import { addChunked, propMat, addKinds } from './render.js';
import * as R from './render.js';
import * as M from './models.js';
import { build, P, T, Cone, Cyl, Box, Sph, Oct } from './models.js';
import { H, HN, hgt, world, addWall, linkDoors, mergeBuilt, mat4, meshWithOutline, registerZone, ZONE_SIZE } from './world.js';
import { groundMesh } from './zones.js';
import { MOBS, QUESTS, GIVERS, xpNeed } from './data.js';
import { MOB_LORE, TALK } from './dialogue.js';
import { LORE, SCENES } from './story.js';
import { LFG_D } from './social6.js';
import * as Game from './game.js';
import { habGeo, domeGeo, lampGeo, crateGeo, mastGeo, shipGeo, minimapFrom } from './moon1.js';
import { sfig } from './models3.js';
import { CREW, PADS } from './ship1.js';
import { grantLamp } from './light4.js';
const O = [0, 0, 0], LR = [1, -1];
ZONE_SIZE.fort = 300;
export const D4 = { fort: { x: 0, z: 185, R: 32, base: 4 }, pad: { x: 72, z: 196, R: 16 }, road: { x: -110, z: 30 }, post: { x: 195, z: 25, R: 28 }, barrow: { x: 10, z: -200, R: 42 } };
PADS.fort = { x: D4.pad.x, z: D4.pad.z + 17 };

const pal = (a, b, t, g) => ({ a, b, t, g }), HUM = [.6, .4, 1.6, .15], HEAVY = [.55, .4, 1.9, .15], STILL = [0, 0, 0, 0];
const REP = pal('#3a5a8a', '#22303e', '#e8e2d0', '#6ad8ff'), DES = pal('#6a6a62', '#34342e', '#8a3a22', '#ff8a3a'), IMP = pal('#2e2e34', '#18181c', '#c0392b', '#ff4a3a'), CULT = pal('#3a2a4a', '#1e1626', '#8a8a6a', '#8dff5a');
addKinds({
  des0: [sfig({ body: 'armor', head: 'bare', r: 'baton', l: null }, DES, 1), HEAVY, .05, .035], des1: [sfig({ body: 'armor', head: 'cap', r: 'rifle', l: null }, DES, 2), HEAVY, .05, .035],
  des2: [sfig({ body: 'suit', vest: true, head: 'bare', r: 'injector', l: 'medkit' }, DES, 0), HUM, .05, .03], des_boss: [sfig({ body: 'armor', heavy: true, head: 'bald', r: 'hammer', l: null }, DES, 2), HEAVY, .05, .04],
  imp0: [sfig({ body: 'armor', head: 'helmet', r: 'rifle', l: null }, IMP, 0), HEAVY, .05, .035], imp1: [sfig({ body: 'armor', head: 'helmet', r: 'blade', l: 'pistol' }, IMP, 1), HEAVY, .05, .035],
  imp_boss: [sfig({ body: 'coat', head: 'visor', r: 'pistol', l: 'slate', hair: '#1c2026' }, IMP, 3), HUM, .05, .035],
  cult0: [sfig({ body: 'coat', head: 'hood', r: 'lantern', l: null, cloak: '#2a1e36' }, CULT, 2), HUM, .05, .03], cult_boss: [sfig({ body: 'coat', head: 'hood', r: 'lantern', l: 'slate', cloak: '#1a1222', scarf: '#8dff5a' }, CULT, 3), HUM, .05, .035],
  n_dray: [sfig({ body: 'coat', head: 'bare', r: 'lampblade', l: null, scarf: '#e8e2d0', hair: '#8a8a8a' }, pal('#e8e2d0', '#5a6a8a', '#d8b24a', '#ffe9a0'), 1), HUM, .05, .03],
  n_lind: [sfig({ body: 'armor', head: 'bare', r: null, l: 'slate', hair: '#e8e2d0' }, REP, 3), HEAVY, .05, .035], n_okoye: [sfig({ body: 'suit', vest: true, head: 'cap', r: null, l: 'slate' }, REP, 2), HUM, .05, .03],
  n_wynne: [sfig({ body: 'coat', head: 'hood', r: 'lantern', l: 'slate', cloak: '#e8e2d0' }, pal('#e8e2d0', '#c8b890', '#d8b24a', '#ffe9a0'), 0), HUM, .05, .03],
  n_rook: [sfig({ body: 'suit', knee: true, head: 'hood', r: 'rifle', l: null, cloak: '#d8dce4' }, pal('#d8dce4', '#8a9098', '#3a5a8a', '#6ad8ff'), 1), HUM, .05, .03],
  n_mira: [sfig({ body: 'suit', vest: true, head: 'headset', r: null, l: null, hair: '#2b1d14' }, REP, 2), HUM, .05, .03],
  gravemark: [build([P(T(Box(.7, 1.1, .16), 0, .55), 0, O, '#8a9098'), P(T(Box(.3, .3, .05), 0, .8, .09), 0, O, '#6ad8ff', .8), P(T(Box(1.4, .5, 2.2), 0, -.1, 1.3), 0, O, '#1c2026')]), STILL, 0, .03],
  cache: [build([P(T(Box(1.2, .7, .9), 0, .35), 0, O, '#3a5a8a'), P(T(Box(1.24, .1, .94), 0, .6), 0, O, '#e8e2d0'), P(T(Sph(.6, 8, 5, 0, TAU, 0, Math.PI / 2), .1, .5, 0, 0, 0, 0, 1.2, .5, 1), 0, O, '#f0f4f8')]), STILL, 0, .03],
});

const mob = (name, kind, o) => ({ name, kind, hpM: 1, dmgM: 1, spd: 5.4, range: 2.4, weak: 'fire', resist: 'frost', scale: 1, aggro: 9, social: 7, ...o });
const BE = { beast: true }, HU = { human: true }, UN = { undead: true };
Object.assign(MOBS, {
  icejackal: mob('Ice Jackal', 'wolf', { hpM: .8, dmgM: .85, spd: 6.2, scale: .9, ...BE }), rimecrawler: mob('Rime Crawler', 'spider', { hpM: .85, dmgM: .85, scale: .75, ...BE }),
  sleetkite: mob('Sleet Kite', 'wasp', { hpM: .75, dmgM: .9, spd: 6.6, fly: .9, aggro: 8, social: 5, ...BE }),
  deserter: mob('Deserter', 'des0', { hpM: .95, dmgM: .9, weak: 'storm', resist: null, aggro: 11, social: 12, ...HU }), desgun: mob('Deserter Rifleman', 'des1', { hpM: .8, dmgM: .9, range: 20, ranged: true, weak: 'storm', resist: null, aggro: 12, social: 12, ...HU }),
  desmed: mob('Deserter Medic', 'des2', { hpM: .8, dmgM: .75, range: 16, ranged: true, caster: true, healer: true, school: 'storm', resist: null, aggro: 11, social: 12, ...HU }),
  probe: mob('Imperial Probe', 'sdrone', { hpM: .8, dmgM: .9, range: 16, ranged: true, fly: .6, weak: 'storm', resist: 'poison', aggro: 12, social: 12 }),
  impscout: mob('Imperial Scout', 'imp0', { hpM: .95, dmgM: .95, range: 20, ranged: true, weak: 'holy', resist: 'shadow', aggro: 12, social: 12, ...HU }), impblade: mob('Imperial Pathfinder', 'imp1', { hpM: 1.05, dmgM: 1, weak: 'holy', resist: 'shadow', aggro: 12, social: 12, ...HU }),
  dimmer: mob('Dimmer Acolyte', 'cult0', { hpM: .9, dmgM: .95, range: 16, ranged: true, caster: true, school: 'shadow', weak: 'holy', resist: 'shadow', aggro: 12, social: 13, ...HU }),
  risen: mob('Risen Garrison', 'ghoul', { hpM: 1, dmgM: .95, weak: 'holy', resist: 'frost', aggro: 11, social: 12, ...UN }), risenold: mob('Old Guard', 'skeleton', { hpM: 1.05, dmgM: 1, weak: 'holy', resist: 'frost', aggro: 11, social: 12, ...UN }),
});
const boss = (name, kind, o) => ({ name, kind, hpM: 1.15, dmgM: 1, spd: 5.2, range: 2.8, weak: 'holy', resist: null, scale: 1.35, aggro: 14, social: 18, ...o });
Object.assign(MOBS, {
  frostmaw: boss('Old Frostmaw', 'bear', { ...BE, scale: 1.5, weak: 'fire', resist: 'frost', mechs: ['cleave', 'call'], adds: 'icejackal', lines: { start: '*A jackal the size of a supply sled rises out of a drift it had been lying under, apparently for some time.*', half: '*It howls, and the snowfield howls back.*' } }),
  marrin: boss('Sergeant Hobb Marrin', 'des_boss', { ...HU, scale: 1.15, weak: 'storm', mechs: ['cleave', 'slam'], lines: { start: "Twenty-two years I stood that wall. Then the pay stopped and the reinforcements never came. Don't you lecture me about oaths, novice.", half: "I trained half that garrison! I'll bury the other half!" } }),
  sable: boss('Agent Sable', 'imp_boss', { ...HU, scale: 1.1, range: 18, ranged: true, weak: 'holy', resist: 'shadow', mechs: ['pool', 'fear'], lines: { start: "A lamp-keeper. How convenient. My office has questions for your order, and you are much nearer than your masters.", half: 'Note for the file: the subject resists.' } }),
  roe: boss('Canon Thessaly Roe', 'cult_boss', { ...HU, hpM: 1.5, scale: 1.25, range: 18, ranged: true, caster: true, school: 'shadow', resist: 'shadow', mechs: ['call', 'pool', 'fear', 'enrage'], adds: 'risen', lines: { start: "Little keeper. You guard the lamps and never once ask what they are for. They are bars, child. I am only letting something out.", half: 'Rise. Rise and stand your watch again.', enrage: 'It is under everything. It has always been under everything!' } }),
});
Object.assign(MOB_LORE, {
  icejackal: 'Six legs, white fur and a patient temperament. It will follow a patrol for a day waiting for somebody to fall behind.', rimecrawler: 'It lives under the crust of the snow and comes up through it.', sleetkite: 'A glider with wings like sheet ice. They ride the wind off the glacier and stoop on anything warm.',
  deserter: 'A Republic soldier who walked off the wall when the pay stopped. The uniform is the same. The loyalty is to the next meal.', desgun: 'A deserter with a service rifle and three hundred rounds the quartermaster is still looking for.', desmed: 'A garrison medic gone over the wall. Still treats the wounded. Chooses them differently now.',
  probe: 'An Imperial survey probe. It is very interested in the sky, and it shoots at anything that looks up with it.', impscout: 'An Imperial scout in black plate. The Empire says it has no soldiers on Cairn. This one did not get the message.', impblade: 'A pathfinder: the Empire sends them ahead of everything else, to learn where the soft places are.',
  dimmer: "One of the Dimmers, a cult that teaches the stars are a cage and the dark is what the cage holds back. They carry lanterns that burn green and give no warmth.", risen: 'A soldier of Fort Lastlight, buried with honours. Somebody has dug him up and set him to guard duty again.', risenold: 'One of the first garrison, three centuries dead and still in step.',
  frostmaw: 'The fort has a standing wager on whether Old Frostmaw is one animal or several. Nobody has collected.', marrin: 'Hobb Marrin trained two generations of the garrison. When he walked off the wall, forty of them walked after him.',
  sable: 'An officer of an Imperial bureau that calls itself the Lamplighters. It appears on no list. Sable seems proud of that.', roe: 'Thessaly Roe was a canon of the lamp-keepers until she read something in the deep archive and stopped lighting lamps.',
});

const sm = t => t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t);
const roadX = z => -30 + Math.sin(z * .013) * 20 - sm((80 - z) / 220) * 70;
registerZone('fort', seed => {
  const rng = mulberry32(seed + 5151), N = makeNoise(seed + 5151), pk = a => a[(rng() * a.length) | 0];
  world.water = null;
  world.names = { zone: 'Cairn', town: 'Fort Lastlight', boss: 'Canon Roe', ruin: 'the Barrow Cut', wood: 'the Supply Road', fields: 'the Snowfields', waste: 'the Listening Post', road: 'the Supply Road', captain: 'Sergeant Marrin', tusk: 'Old Frostmaw' };
  const Ft = D4.fort, Pad = D4.pad, Ps = D4.post, Bw = D4.barrow;
  for (let zi = 0; zi < HN; zi++) for (let xi = 0; xi < HN; xi++) {
    const x = xi - WH, z = zi - WH; let h = 4 + N.fbm(x * .009, z * .009, 4) * 11 + (N.fbm(x * .05, z * .05, 2) - .5) * 1.4;
    h += sm((N.fbm(x * .005 + 7, z * .005, 3) - .6) * 9) * 9;
    for (const t of [Ft, Pad]) h = lerp(Ft.base, h, sm((Math.hypot(x - t.x, z - t.z) - t.R - 2) / 20));
    h = lerp(5, h, sm((Math.hypot(x - Ps.x, z - Ps.z) - Ps.R) / 18));
    // the Barrow Cut: a ravine running north
    const dB = Math.hypot((x - Bw.x) * 1.5, z - Bw.z); h = lerp(1.5, h, sm((dB - Bw.R) / 20)); if (dB > Bw.R + 14 && dB < Bw.R + 34 && z < Bw.z + 30) h += 5;
    if (Math.abs(x - roadX(z)) < 6 && z > -150 && z < 160) h = lerp(h, Math.min(h, 5 + N.fbm(x * .01, z * .01, 2) * 2), .65);
    const edge = Math.max(Math.abs(x), Math.abs(z)) - (WH - 24); if (edge > 0) h += edge * edge * .1;
    H[zi * HN + xi] = h;
  }
  const SNOW = new THREE.Color('#f0f4f8'), BLUE = new THREE.Color('#c8d8e8'), ROCK = new THREE.Color('#6a7078'), ICE = new THREE.Color('#a8d0e0'), PAVE = new THREE.Color('#7a8088'), ROAD = new THREE.Color('#b8b0a0'), PADC = new THREE.Color('#4a4e54'), GRAVE = new THREE.Color('#5a5a66');
  const colorAt = (x, z) => {
    const h = hgt(x, z); let c = SNOW.clone().lerp(BLUE, N.fbm(x * .02, z * .02, 3) * .9);
    c.lerp(ICE, sm((N.fbm(x * .012 + 4, z * .012, 2) - .58) * 6) * .6); if (h > 13) c.lerp(ROCK, sm((h - 13) / 4));
    if (Math.hypot((x - Bw.x) * 1.5, z - Bw.z) < Bw.R) c.lerp(GRAVE, .5);
    if (Math.abs(x - roadX(z)) < 4 && z > -150 && z < 160) c.lerp(ROAD, .45);
    if (Math.hypot(x - Ft.x, z - Ft.z) < Ft.R - 1) c.lerp(PAVE, .65);
    const dp = Math.hypot(x - Pad.x, z - Pad.z); if (dp < Pad.R) { c.lerp(PADC, .85); if (Math.abs(dp - Pad.R + 1.5) < .6) c.lerp(new THREE.Color('#6ad8ff'), .8); }
    const sh = .92 + N.n2(x * .3, z * .3) * .12; return new THREE.Color(c.r * sh, c.g * sh, c.b * sh);
  };
  groundMesh(colorAt);
  world.regionNames = ['The Snowfields', 'The Supply Road', 'The Listening Post', 'The Barrow Cut'];
  world.regionFn = (x, z) => Math.hypot(x - Bw.x, z - Bw.z) < 90 || z < -130 ? 3 : Math.hypot(x - Ps.x, z - Ps.z) < 80 ? 2 : x < -40 && z < 110 ? 1 : 0;
  const items = [], put = (geo, x, z, ry = 0, s = 1) => items.push({ geo, m: mat4(x, hgt(x, z), z, ry, s) });
  const solid = (x, z, w, d, ry = 0) => { const c = Math.cos(ry), s = Math.sin(ry), pt = (lx, lz) => [x + lx * c + lz * s, z - lx * s + lz * c]; const k = [pt(-w / 2, -d / 2), pt(w / 2, -d / 2), pt(w / 2, d / 2), pt(-w / 2, d / 2)]; for (let i = 0; i < 4; i++) addWall(k[i][0], k[i][1], k[(i + 1) % 4][0], k[(i + 1) % 4][1], .3); };
  const round = (x, z, r) => { for (let k = 0; k < 8; k++) { const a = k / 8 * TAU, b = (k + 1) / 8 * TAU; addWall(x + Math.cos(a) * r, z + Math.sin(a) * r, x + Math.cos(b) * r, z + Math.sin(b) * r, .3); } };
  // Fort Lastlight: a ring of blast wall with gates north and east, barracks, and the order's chapter house with its lamp
  { const Rr = Ft.R, n = 26, len = TAU * Rr / n + .3, seg = build([P(T(Box(len, 5, 1.2), 0, 2.5), 0, O, '#6a7480'), P(T(Box(len, .3, 1.3), 0, 4.2), 0, O, '#6ad8ff', 1.2), P(T(Box(len, .6, 1.6), 0, .3), 0, O, '#3a4048')]);
    for (let k = 0; k < n; k++) { const a = k / n * TAU; if (Math.abs(a - Math.PI * 1.5) < .2 || a < .16 || a > TAU - .16) continue; put(seg, Ft.x + Math.cos(a) * Rr, Ft.z + Math.sin(a) * Rr, -a - Math.PI / 2); const a1 = a - TAU / n / 2, a3 = a + TAU / n / 2; addWall(Ft.x + Math.cos(a1) * Rr, Ft.z + Math.sin(a1) * Rr, Ft.x + Math.cos(a3) * Rr, Ft.z + Math.sin(a3) * Rr, .9); }
    for (const a of [.5, 1.3, 2.1, 2.9, 3.7, 5.6]) put(build([P(T(Box(3, 8, 3), 0, 4), 0, O, '#5a6470'), P(T(Box(3.6, .8, 3.6), 0, 8.2), 0, O, '#3a4048'), P(T(Box(.5, .5, .5), 0, 9), 0, O, '#6ad8ff', 2.4)]), Ft.x + Math.cos(a) * Rr, Ft.z + Math.sin(a) * Rr); }
  for (const [dx, dz, ry, w, d, col, trim] of [[-15, -10, 0, 11, 6, '#8a94a0', '#2e5a9e'], [13, -13, 0, 9, 5, '#8a94a0', '#2e5a9e'], [-19, 8, Math.PI / 2, 8, 5, '#9aa4b0', '#e8e2d0'], [17, 9, -Math.PI / 2, 8, 6, '#8a94a0', '#c8782a']]) { put(habGeo(w, d, col, trim), Ft.x + dx, Ft.z + dz, ry); solid(Ft.x + dx, Ft.z + dz, w, d, ry); }
  put(domeGeo(4.4, '#e8e2d0'), Ft.x - 3, Ft.z + 17, Math.PI); round(Ft.x - 3, Ft.z + 17, 4);
  put(build([P(T(Cyl(.5, .7, 6, 6), 0, 3), 0, O, '#e8e2d0'), P(T(Oct(1), 0, 7.2), 0, O, '#ffe9a0', 3)]), Ft.x + 3, Ft.z + 1); solid(Ft.x + 3, Ft.z + 1, 1.2, 1.2);
  put(mastGeo(), Ft.x + 22, Ft.z - 18);
  for (const [dx, dz] of [[-8, -4], [9, -3], [-4, 8], [10, 12], [-14, 0], [36, 6], [48, 8]]) put(lampGeo(), Ft.x + dx, Ft.z + dz);
  put(shipGeo('#c8d0d8', '#2e5a9e'), Pad.x, Pad.z, Math.PI); solid(Pad.x, Pad.z - 1, 9, 13);
  // the listening post: Imperial dishes on a ridge
  for (let k = 0; k < 5; k++) { const a = k / 5 * TAU; put(build([P(T(Cyl(.3, .5, 7, 5), 0, 3.5), 0, O, '#2e2e34'), P(T(Cone(2.6, 1.4, 10), 0, 7.6, 0, Math.PI - .7), 0, O, '#3a3a40'), P(T(Oct(.3), 0, 8.4, 1), 0, O, '#ff4a3a', 2.4)]), Ps.x + Math.cos(a) * 14, Ps.z + Math.sin(a) * 14, a); }
  put(habGeo(7, 5, '#2e2e34', '#c0392b'), Ps.x, Ps.z, .5); solid(Ps.x, Ps.z, 7, 5, .5);
  // the Barrow Cut: rows of markers, and at the bottom the old vault door
  for (let i = 0; i < 44; i++) put(build([P(T(Box(.7, 1.1, .16), 0, .55, 0, 0, 0, (rng() - .5) * .3), 0, O, '#8a9098')]), Bw.x + (rng() - .5) * 46, Bw.z + (rng() - .5) * 76, rng() * .4);
  put(build([P(T(Box(12, 9, 4), 0, 4.5, -1), 0, O, '#4a5058'), P(T(Box(4.4, 6, .6), 0, 3, 1.2), 0, O, '#0b0a0e'), P(T(Oct(.6), 0, 7.4, 1.2), 0, O, '#8dff5a', 2.4)]), Bw.x, Bw.z - 40); addWall(Bw.x - 6, Bw.z - 40, Bw.x + 6, Bw.z - 40, 2);
  for (let k = 0; k < 9; k++) put(crateGeo(), Ft.x + 13 + rng() * 6, Ft.z + 15 + rng() * 5, rng() * TAU, .8 + rng() * .5);
  meshWithOutline(mergeBuilt(items), .05); linkDoors();
  world.places = [{ name: 'Fort Lastlight', x: Ft.x, z: Ft.z, R: Ft.R + 2, kind: 'town' }, { name: 'The Landing Pad', x: Pad.x, z: Pad.z, R: Pad.R, kind: 'town' }, { name: 'Deserters\' Camps', x: D4.road.x, z: D4.road.z, R: 50, kind: 'camp' }, { name: 'The Imperial Listening Post', x: Ps.x, z: Ps.z, R: Ps.R, kind: 'camp' }, { name: 'The Barrow Cut', x: Bw.x, z: Bw.z, R: Bw.R, kind: 'dungeon' }];
  world.town = Ft;
  world.towns = [{ key: 'lastlight', name: 'Fort Lastlight', x: Ft.x, z: Ft.z, R: Ft.R, guardName: 'Garrison Trooper', npcs: [['giver', 'dray', -2, 11], ['giver', 'lind', 10, -8], ['giver', 'okoye', 14, 5], ['giver', 'wynne', -8, 13], ['giver', 'rook', -12, -5], ['vendor', 'fortq', -15, 6], ['bind', null, 6, 8]], guards: [[-3, -Ft.R + 3], [3, -Ft.R + 3], [Ft.R - 3, 3], [Ft.R - 3, -3], [0, 6]] }];
  world.storyNpcs.push({ key: 'mira', x: Pad.x - 9, z: Pad.z + 10, yaw: -1.4, unless: ['jcrew1', '*'] });
  world.mapLabels = [{ t: 'Jackals, crawlers (1-2)', x: 40, z: 110 }, { t: 'Deserters (2-3)', x: -120, z: 60 }, { t: 'Imperial scouts (3-4)', x: 195, z: 70 }, { t: 'The Dimmers (4-5)', x: 10, z: -150 }];
  world.zoneLines.push({ x: Pad.x, z: Pad.z + 11, r: 2.6, to: 'ship', label: 'Board the Vigilant' });
  Object.assign(world.spots, { town: { x: Ft.x, z: Ft.z }, pad: { x: Pad.x, z: Pad.z }, snow: { x: 40, z: 110 }, road: { x: D4.road.x, z: D4.road.z }, post: { x: Ps.x, z: Ps.z + 30, r: 30 }, barrow: { x: Bw.x, z: Bw.z + 34, r: 30 }, barrowdeep: { x: Bw.x, z: Bw.z - 30 } });
  world.clearSpots = [{ x: Ft.x, z: Ft.z, r: Ft.R + 24 }, { x: Pad.x, z: Pad.z, r: Pad.R + 18 }, { x: Ps.x, z: Ps.z, r: Ps.R + 2 }, { x: Bw.x, z: Bw.z, r: Bw.R + 20 }];
  const prop = (kind, tag, name, x, z, o = {}) => world.props.push({ id: 'f' + world.props.length, kind, tag, name, x, z, yaw: o.yaw ?? rng() * TAU, lore: o.lore || null, scale: o.scale || 1, when: o.when, unless: o.unless });
  for (let i = 0; i < 9; i++) { const z = 120 - i * 26 + rng() * 10; prop('cache', 'cache', 'Buried supply cache', roadX(z) + (rng() - .5) * 26, z); }
  for (let i = 0; i < 6; i++) prop('gravemark', 'grave', 'Opened grave', Bw.x + (rng() - .5) * 36, Bw.z + 14 + rng() * 24, { yaw: 0 });
  prop('console', 'lore', "Agent Sable's cipher", Ps.x + 4, Ps.z + 3, { lore: 'sablecipher', yaw: 1 }); prop('crate', 'lore', "Roe's hymnal", Bw.x + 5, Bw.z - 34, { lore: 'roehymnal', yaw: 2 });
  const sp = world.spawns, put2 = o => sp.push({ ...o, y: hgt(o.x, o.z), alive: null, timer: 0 });
  const clear = p => !world.clearSpots.some(c => Math.hypot(c.x - p.x, c.z - p.z) < c.r) && !(Math.abs(p.x - roadX(p.z)) < 8 && p.z > -150 && p.z < 160);
  const land = (x0, x1, z0, z1, min = 10) => { for (let i = 0; i < 300; i++) { const p = { x: x0 + rng() * (x1 - x0), z: z0 + rng() * (z1 - z0) }; if (clear(p) && hgt(p.x, p.z) < 14 && !sp.some(s => Math.hypot(s.x - p.x, s.z - p.z) < min)) return p; } return null; };
  const scatter = (n, box, mobs, lvl, area, o = {}) => { for (let i = 0; i < n; i++) { const p = land(...box, o.min || 12); if (p) put2({ ...p, mob: pk(mobs), lvl, respawn: 55, area, ...o }); } };
  const camp = (n, box, mobs, lvl, area, tag) => { for (let i = 0; i < n; i++) { const p = land(...box, 30); if (!p) continue; world.camps.push({ x: p.x, z: p.z, kind: 'bandit' }); for (let k = 0; k < mobs.length; k++) { const a = k / mobs.length * TAU; put2({ x: p.x + Math.cos(a) * 3, z: p.z + Math.sin(a) * 3, mob: mobs[k], lvl, respawn: 80, camp: tag + i, area, solo: true }); } } };
  const group = (c, list, lvl, area, tag, o = {}) => list.forEach(([dx, dz, mobs], i) => mobs.forEach((m, k) => put2({ x: c.x + dx + (k % 2) * 2.2, z: c.z + dz + (k > 1 ? 2.2 : 0), mob: m, lvl, respawn: 240, camp: tag + i, area, solo: true, ...o })));
  scatter(24, [-110, 150, 100, 150], ['icejackal', 'icejackal', 'rimecrawler'], [1, 1], 0, { solo: true, min: 13 });
  scatter(30, [-260, 260, 60, 270], ['icejackal', 'rimecrawler', 'rimecrawler', 'sleetkite'], [1, 2], 0, { solo: true });
  scatter(10, [-260, -60, -40, 120], ['sleetkite', 'rimecrawler'], [2, 3], 1, { solo: true });
  scatter(10, [-230, -30, -80, 110], ['deserter', 'desgun'], [2, 3], 1, { solo: true });
  camp(7, [-250, -30, -100, 110], ['deserter', 'desgun'], [2, 3], 1, 'ds'); camp(3, [-240, -40, -110, 60], ['deserter', 'desgun', 'desmed'], [3, 3], 1, 'dt');
  scatter(12, [110, 280, -60, 120], ['probe', 'probe', 'sleetkite'], [3, 3], 2, { solo: true });
  camp(6, [110, 280, -70, 120], ['impscout', 'probe'], [3, 4], 2, 'im');
  group(Ps, [[-10, 8, ['impscout', 'impblade']], [10, 8, ['impscout', 'probe', 'impscout']], [0, -10, ['impblade', 'impscout']]], [4, 4], 2, 'lp');
  put2({ x: Ps.x + 3, z: Ps.z + 6, mob: 'sable', lvl: [4, 4], respawn: 700, named: 'sable', area: 2 });
  group(Bw, [[-10, 36, ['risen', 'risenold']], [10, 30, ['dimmer', 'risen']], [-12, 10, ['risen', 'risen', 'dimmer']], [12, 4, ['risenold', 'dimmer', 'risen']], [0, -12, ['dimmer', 'dimmer', 'risenold']], [-10, -26, ['risen', 'risenold', 'risen']], [10, -28, ['dimmer', 'risen', 'risenold']]], [4, 5], 3, 'bw', { dungeon: true });
  put2({ x: Bw.x, z: Bw.z - 34, mob: 'roe', lvl: [5, 5], respawn: 1200, named: 'roe', area: 3, dungeon: true, boss: true });
  { const p = land(-200, -80, -60, 40, 30) || { x: -140, z: 0 }; put2({ ...p, mob: 'marrin', lvl: [4, 4], respawn: 600, named: 'marrin', area: 1 }); put2({ x: p.x + 3, z: p.z + 2, mob: 'desgun', lvl: [3, 3], respawn: 600, camp: 'mar', area: 1, solo: true }); }
  { const p = land(60, 220, 180, 260) || { x: 150, z: 220 }; put2({ ...p, mob: 'frostmaw', lvl: [3, 3], respawn: 600, named: 'frostmaw', area: 0 }); }
  world.huntAreas = [{ area: 0, lvl: [1, 2] }, { area: 1, lvl: [2, 3] }, { area: 2, lvl: [3, 4] }, { area: 3, lvl: [4, 5] }];
  const pines = [], rocks = [];
  for (let n = 0; n < 9000; n++) { const x = (rng() * 2 - 1) * (WH - 8), z = (rng() * 2 - 1) * (WH - 8), h = hgt(x, z);
    if (world.clearSpots.some(c => Math.hypot(c.x - x, c.z - z) < c.r - 12) || Math.abs(x - roadX(z)) < 5 && z > -150 && z < 160) continue; const r = rng();
    if (r < .05 && N.fbm(x * .01 + 20, z * .01, 2) > .5) pines.push([x, h - .2, z, rng() * 6.3, 0, 0, 1 + rng() * 1.3]); else if (r < .03 || h > 13 && r < .15) rocks.push([x, h - .3, z, rng() * 6.3, 0, 0, .7 + rng() * 1.8]); }
  addChunked(M.pineGeo(true), propMat, pines, .04); addChunked(M.rockGeo('#8a9098', '#e8eef4'), propMat, rocks, .04);
  world.trees = pines.map(t => ({ x: t[0], z: t[2], r: .4 }));
  world.minimap = minimapFrom(colorAt);
  return world;
});
X.light.push(() => { if (S.zone !== 'fort') return; const u = R.skyMat.uniforms; u.top.value.lerp(new THREE.Color('#2a4a7a'), .5); u.mid.value.lerp(new THREE.Color('#b8d0e8'), .55); u.hor.value.lerp(new THREE.Color('#e8f0f8'), .6); R.scene.fog.color.lerp(new THREE.Color('#dce8f4'), .6); });
X.zone.push(zone => { if (zone === 'fort') { S.ext.sys = 'cairn'; if (!S.bind) S.bind = { zone: 'fort', x: D4.fort.x + 6, z: D4.fort.z + 9.5 }; } });
X.gate.ship = (prev => () => X.path() === 'justice' ? (S.flags.ship ? null : 'The Vigilant is sealed. A cutter needs a commission, and you do not have one yet.') : prev())(X.gate.ship);

// ---------- people ----------
Object.assign(X.vend, { fortq: 'Sutler Greeve' });
Object.assign(GIVERS, {
  dray: { name: 'Knight-Preceptor Anselm Dray', title: 'Lamp-keeper · your teacher', model: 'n_dray' }, lind: { name: 'Commandant Petra Lindqvist', title: 'Fort Lastlight', model: 'n_lind' },
  okoye: { name: 'Quartermaster Bram Okoye', title: 'Stores and supply', model: 'n_okoye' }, wynne: { name: 'Sister-Archivist Wynne', title: 'The chapter house', model: 'n_wynne' },
  rook: { name: 'Corporal Dessa Rook', title: 'Scout', model: 'n_rook' }, mira: { name: 'Ensign Mira Castellan', title: 'Pilot, unassigned', model: 'n_mira' },
});
Object.assign(TALK, {
  dray: { bio: "Anselm Dray has kept a lamp for forty years and taught eleven novices, nine of whom are still alive, which he says is a better record than the order deserves. He was sent to Fort Lastlight because the order had nobody else to send, and he brought you because it had nobody else to teach.",
    greet: ["Stand up straight, novice. The cold gets into a slouch.", "A lamp-keeper keeps one promise: the light does not go out on our watch. Everything else we do is detail."],
    topics: [{ q: 'What does the order actually do?', a: ["We keep the lamps. Two thousand years ago that meant a flame in a tower on the old homeworld, lit the night the Gravelord fell, and a vow that it would never go dark again.", "These days it means a great many things, most of them paperwork. But the vow is the same, and I have lately begun to think our founders meant it more literally than we do."] },
      { q: 'Why can I use the old power when most cannot?', a: ["Nobody knows. One child in a hundred thousand can feel the lamp lore, and the order finds perhaps half of those. The rest live their whole lives thinking they are merely lucky with candles.", "Use it sparingly, and never because you are angry. There is another road that begins with anger, and it is a short one, and it ends in a place like the Barrow Cut."] }] },
  lind: { bio: "Petra Lindqvist has commanded Fort Lastlight for nine years on half the garrison it was built for. She writes to the capital every month asking for reinforcements, and reads the replies aloud at mess as light entertainment.",
    greet: ["Novice. I asked the capital for a regiment and they sent me a knight and an apprentice. I intend to get a regiment's work out of you.", "Lastlight has never fallen. I'd take it kindly if that stayed true while I'm the one signing for it."],
    topics: [{ q: 'Why is the garrison so thin?', a: ["The Republic has forty border forts and the budget for twelve. Somebody in the capital decided Cairn was quiet, and a quiet fort gets what's left over.", "It isn't quiet. I have deserters on my supply road, Imperial dishes on my ridge and something digging in my cemetery. I put all of that in my reports. I am starting to wonder who reads them."] }] },
  okoye: { bio: "Bram Okoye can account for every ration pack, power cell and bootlace in Fort Lastlight, and it causes him physical pain that he cannot currently do so. He considers the deserters a personal insult, chiefly on inventory grounds.",
    greet: ["If you need it, I have it. If I don't have it, a deserter has it, and I'd like it back.", "Sign here. And here. The order may run on faith, novice, but this fort runs on forms."], topics: [] },
  wynne: { bio: "Sister-Archivist Wynne keeps the chapter house lamp and the fort's small library of order records. She has been comparing old star catalogues against new ones for six years, quietly, and has stopped sleeping well.",
    greet: ["Mind the lamp, dear. It has burned since the fort was built, and I should hate to be the archivist who let it gutter.", "Sit, if you can find a chair under the catalogues. I'm afraid I've been reading again."],
    topics: [{ q: 'What have you been reading?', a: ["Star catalogues. The order has kept them since before the Republic, and every century or so a scribe recopies them. I have been setting the old copies beside the new.", "Stars are missing, novice. They're in the old books and they aren't in the sky. And in every recopying, a careful hand has left them out, so that nobody would count."] }] },
  rook: { bio: "Dessa Rook has scouted Cairn's snowfields for six winters and can tell you who passed, how long ago and what they had for breakfast from a single bootprint. She prefers the snow to the fort, on the grounds that the snow doesn't hold meetings.",
    greet: ["Walk where I walk. The crust won't hold you anywhere else.", "There's more traffic on this glacier than there's any reason for. I count three kinds of boot that aren't ours."], topics: [] },
  mira: { bio: "Mira Castellan graduated top of her flight class and was posted to a fort with no ships, which she regards as either a clerical error or somebody's idea of a joke. She has spent four months maintaining a grounded cutter out of pure spite.",
    greet: ["If you're here about the Vigilant, she's fuelled, she's tuned, and she hasn't left that pad since before I got here.", "I can fly anything with an engine. I'd settle for flying one thing, once."], topics: [] },
  'vendor:fortq': { bio: 'Sutler Greeve sells to the garrison what the garrison is not issued, at prices he calls reasonable and the garrison calls other things.', greet: ["Medigel, cells and hot tea. The tea's the one that sells.", "Everything's rationed but my stock. Funny how that works."], topics: [] },
});
Object.assign(LORE, {
  sablecipher: { title: "Agent Sable's Cipher", where: 'post', text: "Decoded by Sister Wynne. 'To the office of the Lamplighters, from Sable, on Cairn. The post confirms the border sun has dimmed by a further part in ten thousand this quarter. The Republic garrison does not appear to know. The lamp-keepers here suspect something but hold no chart. Our office's instruction stands: find which star is next, and be standing under it with a fleet when it goes. The Emperor's question also stands. If the order's lamps truly hold something back, he wishes to know what, and whether it can be bargained with.'" },
  roehymnal: { title: "Canon Roe's Hymnal", where: 'barrowdeep', text: "The order's own hymnal, with every verse struck through and rewritten in green ink. 'We were taught the lamps were lit for joy when the Gravelord fell. They were not. They were lit as bars. What he served was not ended; it was shut out, behind a wall of small fires, and we have spent two thousand years tending the wall without knowing we were gaolers. The wall is failing now, one fire at a time. I have seen what waits. It is patient. It was promised the dead, and it means to collect. Better to open the door ourselves than be found holding it shut.'" },
});
SCENES.intro_j = [
  { spot: 'town', from: [48, 32, 62], look: [0, 5, 0], who: null, text: 'Two thousand years ago, on the night the Gravelord fell, the people of the old world lit a lamp and swore it would never go dark. An order grew up to keep that promise. It still does, though few of its keepers remember why.' },
  { spot: 'town', from: [-44, 20, -34], look: [6, 6, -10], who: null, text: 'The Republic those people built now spans a hundred suns, and it is tired. Its border forts stand half empty. Fort Lastlight, on the ice world of Cairn, has asked for reinforcements for nine years.' },
  { spot: 'pad', from: [-24, 12, 22], look: [0, 4, 0], who: null, text: 'This year the order answered. It sent one old knight and one first-year novice, who can feel the lamp lore and has never yet drawn a blade in anger. That novice is you. It is very cold.' },
];

// ---------- quests ----------
const qx = (lvl, f) => Math.round(xpNeed(lvl) * f * .36);
const Z = { zone: 'fort', path: 'justice' }, DES3 = ['deserter', 'desgun', 'desmed'], IMPS = ['impscout', 'impblade', 'probe'], DEAD = ['risen', 'risenold'];
QUESTS.push(
  { id: 'jf_j1', story: true, ...Z, giver: 'dray', turnTo: 'lind', lvl: 1, name: 'Reporting for Duty', where: 'town', xp: qx(1, .35), gold: 3, obj: { talk: true, what: 'Report to Commandant Petra Lindqvist in Fort Lastlight' },
    say: ["So this is Cairn. I had hoped the briefing exaggerated. Button your collar, novice, and listen. We are guests of the garrison here, and a guest who is useful is welcome a great deal longer than one who is merely holy.", "Go and report to Commandant Lindqvist. Be polite, be brief, and whatever she asks you to do, say yes. I shall be in the chapter house, finding out why Sister Wynne's letters have grown so strange."],
    done: [['lind', "So you're the novice. I asked for six hundred soldiers. I won't hold that against you personally, but I want you to know the number."], ['lind', "The Preceptor says you can feel the lamp lore. I don't know what that means and I don't need to. Can you fight? Good. Then I have work, and it starts just outside my walls."]] },
  { id: 'jf_j2', story: true, ...Z, giver: 'lind', lvl: 1, pre: 'jf_j1', name: 'Teeth in the Snow', where: 'snow', xp: qx(1, .7), gold: 4, obj: { kill: ['icejackal'], n: 6, what: 'Defeat 6 Ice Jackals on the Snowfields outside Fort Lastlight' },
    say: ["Ice jackals. They used to keep to the glacier, but with half my patrols cancelled they've learned the fort can't spare anyone to chase them. Last week a pack took a sentry's glove off, and the sentry was still wearing it.", "Six of them, novice. They hunt all around the walls. Think of it as your introduction to Cairn: everything here is hungry, and most of it is faster than you."],
    done: ["Six jackals, and you've still got both gloves. That's better than the sentry managed. All right. You can fight. Go and see my quartermaster, because he has a problem that's been ruining my breakfasts."] },
  { id: 'jf_j3', story: true, ...Z, giver: 'okoye', lvl: 2, pre: 'jf_j2', name: 'By the Book', where: 'road', xp: qx(2, .6), gold: 7, obj: { inspect: 'cache', n: 5, what: 'Recover 5 buried supply caches along the Supply Road, north-west of the fort' },
    say: ["I am short forty crates, novice. Forty. The convoys leave the depot full and reach my gate light, and the drivers tell me the load 'fell off', as though ration packs were known for their restlessness.", "The honest crews bury what they can't carry when the weather turns, and mark it. There are caches under the snow all along the Supply Road. Dig up five and log them. I should like, just once this winter, to have a column that adds up."],
    done: ["Five caches, logged and signed. That's the first good news my ledger's had since autumn. Though I notice two of them had been opened and resealed, and not by anybody who was issued a key."] },
  { id: 'jf_j4', story: true, ...Z, giver: 'okoye', lvl: 2, pre: 'jf_j3', name: 'Property of the Republic', where: 'road', xp: qx(2, .65), gold: 9, obj: { collect: DES3, item: 'Ration Pack', chance: .6, n: 6, what: 'Recover 6 Ration Packs from deserters along the Supply Road' },
    say: ["I know where my crates went. Sergeant Marrin walked off the wall last spring and took forty troopers with him, and they've been living on my road and out of my stores ever since. They are eating the fort, novice, one convoy at a time.", "Each of them will be carrying ration packs with my stamp on. Bring back six. It isn't the food so much as the principle. Those packs were signed for."],
    done: ["Six packs, and every one with my stamp. I'll tell you what hurts. I knew those troopers. I issued them their boots. Take this for your trouble, and don't tell the Commandant I got sentimental over rations."] },
  { id: 'jf_j5', story: true, ...Z, giver: 'rook', turnTo: 'dray', lvl: 3, pre: 'jf_j4', name: 'Three Kinds of Boot', where: 'post', xp: qx(3, .5), gold: 9, obj: { at: 'post', r: 32, what: 'Scout the ridge east of the fort, then report to Knight-Preceptor Dray' },
    say: ["I've been reading tracks on the glacier. Ours, I know. The deserters wear ours too, only more worn at the heel. But there's a third kind, novice, with a sole I've not seen before, and it comes down off the eastern ridge and goes back up the same night.", "Somebody's built something up there. I can see the lights when the cloud lifts. Go and take a look from a safe distance, and then tell your Preceptor rather than the Commandant. I think this is his sort of trouble and not hers."],
    done: [['dray', "Dishes, pointed at the sky, and soldiers in black plate. That is an Imperial listening post, novice, on Republic ground, and they have not troubled to hide it."], ['dray', "They are not watching the fort. A post like that watches the heavens. I should very much like to know what the Empire expects to see up there, and why it is in such a hurry to see it first."]] },
  { id: 'jf_j6', story: true, ...Z, giver: 'dray', lvl: 3, pre: 'jf_j5', name: 'Uninvited', where: 'post', xp: qx(3, .7), gold: 12, lore: 'sablecipher', obj: { kill: IMPS, n: 9, what: 'Defeat 9 Imperial Scouts, Pathfinders or Probes around the listening post' },
    say: ["The Commandant cannot move against that post. If the garrison fires on Imperial soldiers, it's a border incident, and two fleets start counting each other. But you and I are not the garrison. The order answers to no ministry, and it is occasionally useful to be nobody's problem.", "Thin them out, novice. Nine will do. Take somebody from the fort if anyone will come, because the scouts shoot straight. And bring me anything written that you find up there."],
    done: ["Nine, and a cipher pad. Wynne will have this open by morning. Sit down a moment. You fought well today, and I want you to notice that you did not enjoy it. Hold on to that. It is most of what separates us from the people we fight."] },
  { id: 'jf_j7', story: true, ...Z, giver: 'wynne', turnTo: 'dray', lvl: 4, pre: 'jf_j6', name: 'The Empty Rows', where: 'barrow', xp: qx(4, .6), gold: 14, obj: { inspect: 'grave', n: 4, what: 'Examine 4 opened graves at the mouth of the Barrow Cut, north of the fort' },
    say: ["I've read the Imperial cipher, dear, and I wish I hadn't. They say our border sun is dimming. They've measured it. And they wrote one more line, which is why I sent for you and not the Preceptor: 'the lamp-keepers here suspect something.' They mean me.", "There's a second thing, and it frightens me more. The garrison buries its dead in the Barrow Cut, north of here, and has done for three hundred years. The sexton came to me this morning. He says the rows are open. Go and look at four of the graves, and tell Anselm what you find, because I can't bring myself to."],
    done: [['dray', "Opened from above, and nothing left in them. Not robbed. Emptied. And you say there was green light further down the Cut."], ['dray', "I had hoped never to teach you this part. There is another road the lamp lore can take, novice. It is called necromancy, it has been forbidden since the Fourfold Law, and somebody is walking it half a mile from our lamp."]] },
  { id: 'jf_j8', story: true, ...Z, giver: 'dray', turnTo: 'lind', lvl: 5, pre: 'jf_j7', name: 'The Canon', where: 'barrowdeep', xp: qx(5, .9), gold: 28, gear: true, lore: 'roehymnal', obj: { named: 'roe', n: 1, what: 'Defeat Canon Thessaly Roe at the bottom of the Barrow Cut, then report to Commandant Lindqvist' },
    say: ["I know who is in the Cut. Thessaly Roe. She was a canon of our order, and she taught me my letters. She went into the deep archive nine years ago and came out saying the lamps were a lie. We thought she had simply left. It seems she found other work.", "She is raising the garrison's dead, and she will not stop for being asked. This is not a task for one novice. Fill your group from the fort before you go down. And listen to me: whatever she says to you down there, she believes it. That is what makes her dangerous."],
    done: [['lind', "A necromancer in my cemetery, an Imperial post on my ridge, and a star going out over my head. And I have had all of it from an apprentice and not one word from the capital."], ['lind', "That settles it. I am done writing reports that nobody reads. There's a patrol cutter on my pad, the Vigilant, with no crew and no orders. I'm commissioning her to you, as of now. Somebody is going to carry this to the capital in person, and they're going to listen."]] },
  { id: 'jf_j9', story: true, ...Z, giver: 'dray', turnTo: 'wynne', lvl: 5, pre: 'jf_j8', when: () => (S.hero?.lvl || 1) >= 5, name: 'The First Trial', where: 'town', xp: qx(5, .3), gold: 10, obj: { talk: true, what: 'Stand before the chapter house lamp with Sister-Archivist Wynne' },
    say: ["You went into the dark and you came back the same person. The order has a name for that. We call it the First Trial, and most novices take it in a quiet hall with a candle. You took yours in a grave. I think yours counts for rather more.", "Go to Sister Wynne and stand before the chapter house lamp. She will do the rest. It is an old rite and a short one, and I am not permitted to watch, which is as well, because I should only embarrass us both."],
    done: [['wynne', "Hold out your hands, dear. No, palms up. There. Do you feel that? The lamp knows you. It's been waiting to see whether you'd come back."], ['wynne', "By the vow and the flame, you are sworn. The order lights what you carry from this day. And between ourselves, Anselm was listening at the door the whole time."]] },
  { id: 'jf_j10', story: true, ...Z, giver: 'lind', turnTo: 'mira', lvl: 5, pre: 'jf_j8', when: () => (S.hero?.lvl || 1) >= 5, name: 'A Pilot for the Vigilant', where: 'pad', xp: qx(5, .3), gold: 10, obj: { talk: true, what: 'Offer Ensign Mira Castellan a berth aboard the Vigilant' },
    say: ["A cutter needs a pilot, and you have never flown anything larger than a training sled. Fortunately, the capital once sent me a pilot by mistake.", "Ensign Castellan has been on this fort four months with nothing to fly. She has polished that cutter until I can see my face in it, and I have had three written requests for transfer. Go and grant one."],
    done: [['mira', "You're giving me the Vigilant? With a real commission? And somewhere to actually go?"], ['mira', "Yes. Obviously yes. Give me ten minutes to get my kit, and four months of opinions about this posting that I've been saving for somebody."]] },
  { id: 'jf_j11', story: true, zone: 'city', path: 'justice', giver: 'lind', turnTo: 'varen', lvl: 5, pre: 'jf_j8', name: 'In Person', where: 'hall', xp: qx(5, .6), gold: 30, obj: { talk: true, what: 'Board the Vigilant, plot a jump to Aurelis at the helm, and carry the report to Lantern-Master Varen at the Lantern Hall' },
    say: ["Here is my report: the deserters, the Imperial post, the Barrow Cut and the dimming of the border sun, with Sister Wynne's catalogues attached. I have sent nine of these by courier. This one goes by hand.", "Take the Vigilant to Aurelis, by way of Halfway Station. Don't give it to a clerk, and don't give it to the Ministry. The Preceptor says the head of your order is a woman named Varen, and that she at least will read it. Put it in her hands."],
    done: [['varen', "From Fort Lastlight? By hand? Give it here. No, stay. I want to ask you about every line of it."], ['varen', "A dimming sun, an Imperial bureau that knows more than we do, and Thessaly Roe alive and raising the dead. I have asked the Senate about the stars four times, novice. Four times I was told there was nothing to discuss. Somebody in this city has been making sure of that."]] },
  { id: 'jf_a1', ...Z, giver: 'lind', lvl: 4, pre: 'jf_j4', name: 'The Sergeant', where: 'road', xp: qx(4, .7), gold: 20, gear: true, obj: { named: 'marrin', n: 1, what: 'Defeat Sergeant Hobb Marrin on the Supply Road' },
    say: ["Hobb Marrin trained me, novice. He taught me to hold a wall, and then he walked off this one and took forty of my people with him. I've left him alone for a year because I couldn't spare the troopers, and because I couldn't quite bear to.", "I can't leave him any longer. He's hitting every convoy. Bring him down. And if he'll surrender, let him. I'd rather have him in my cells than on my conscience."],
    done: ["He didn't surrender. No. He wouldn't have. Thank you for giving him the chance all the same. I'll write to his sister myself."] },
  { id: 'jf_a2', ...Z, giver: 'rook', lvl: 4, pre: 'jf_j6', name: 'Off the Record', where: 'post', xp: qx(4, .7), gold: 20, gear: true, obj: { named: 'sable', n: 1, what: 'Defeat Agent Sable at the Imperial listening post' },
    say: ["There's one up at that post who isn't a soldier. Long coat, no rank, and the scouts go quiet when he walks past. I've watched him three nights running. He doesn't look at the fort at all. He looks at the chapter house.", "I don't like a man who knows which building matters. He's the one who writes things down, novice. If you want that post blind, he's the eye."],
    done: ["Gone, is he? Good. The scouts were packing up when I came down off the ridge. Seems nobody up there knows what they're meant to be listening for without him."] },
  { id: 'jf_a3', ...Z, giver: 'okoye', lvl: 2, pre: 'jf_j2', name: 'Sleet Season', where: 'snow', xp: qx(2, .6), gold: 6, obj: { kill: ['sleetkite'], n: 6, what: 'Defeat 6 Sleet Kites on the Snowfields' },
    say: ["I'd like to register a complaint against the local wildlife. Sleet kites have discovered that my supply sleds are covered in tarpaulin, and that tarpaulin tears. I have lost eleven tarpaulins. I only had fourteen.", "Six kites, please. They ride the wind off the glacier, out over the snowfields. I'll write it up as 'pest control' and, for once, nobody will query it."],
    done: ["Six kites down and three tarpaulins still to my name. I'll take that. You've a talent for this, novice. The paperwork practically wrote itself."] },
  { id: 'jf_a4', ...Z, giver: 'rook', lvl: 3, pre: 'jf_j2', name: 'The Standing Wager', where: 'snow', xp: qx(3, .7), gold: 18, gear: true, obj: { named: 'frostmaw', n: 1, what: 'Defeat Old Frostmaw on the southern Snowfields' },
    say: ["There's a wager in the barracks that's older than I am. Is Old Frostmaw one jackal, or is it a name the garrison gives to whichever big one is about that year? There's nineteen years of pay in the pot, and nobody's ever collected.", "I've found its tracks, south of the walls. One animal, novice, and it's enormous. Bring it down and the pot's half yours. The other half's mine. I did find the tracks."],
    done: ["One animal. I knew it. Nineteen years of pay, and old Corporal Fenn bet on 'several' every single winter. Here's your half. I'm going to go and be unbearable in the mess."] },
  { id: 'jf_a5', ...Z, giver: 'wynne', lvl: 4, pre: 'jf_j7', name: 'Stand Down', where: 'barrow', xp: qx(4, .7), gold: 16, obj: { kill: DEAD, n: 10, what: 'Lay 10 of the Risen Garrison or the Old Guard to rest in the Barrow Cut' },
    say: ["Those are our dead walking in the Cut, dear. Troopers of this fort, three hundred years of them. I have their names in my registers. I buried some of them myself.", "They were given rest and it's been taken from them. Lay ten of them down again. I'll say the office for each, by name, as you do it. It's the least the order owes them, and very nearly the most I can do."],
    done: ["Ten, and I've said the office ten times. Trooper Hale. Corporal Imre. Old Sergeant Brandt, who was buried the year the fort was built. They can stand down now. Thank you. It matters more than you'd think, to be thanked properly at the end."] },
);
CREW.mira = { name: 'Mira Castellan', pal: 2, flag: 'jcrew1', hi: "Ensign Castellan, reporting aboard. She's the best-kept cutter in the Republic, Captain. I've had nothing else to do.", pick: role => role === 'healer' ? 'bulwark' : 'cleric' };
X.turnin.push(q => {
  if (q.id === 'jf_j8') { S.flags.ship = 1; chat('sys', null, 'The Vigilant is yours by commission. Her ramp is down on the landing pad.'); }
  if (q.id === 'jf_j9') grantLamp();
  if (q.id === 'jf_j10') X.recruit?.('mira');
});
Object.assign(LFG_D, { barrowcut: { name: 'The Barrow Cut', lvl: [4, 5], zone: 'fort', at: () => ({ x: D4.barrow.x, z: D4.barrow.z + 56 }) }, listening: { name: 'The Imperial listening post', lvl: [3, 4], zone: 'fort', at: () => ({ x: D4.post.x - 10, z: D4.post.z + 44 }) } });
