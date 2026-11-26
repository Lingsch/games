// Stars Beneath, Build 1: Dustfall, a frontier colony moon (levels 1-5). The smuggler's start.
// Dustfall Port sits in the south with the impound yard and the landing pad beside it. The homestead flats ring the
// port, the Scrap Fields lie east, Glass Canyon and the Dust Rats lie west, and the wreck of the hauler Marrow
// lies north, where the Rats' queen keeps what she steals.
import * as THREE from './three.js';
import { S, WH, TAU, lerp, mulberry32, makeNoise, X } from './core.js';
import { addChunked, propMat, worldGroup, addKinds } from './render.js';
import * as R from './render.js';
import * as M from './models.js';
import { podGeo } from './flora8.js';
import { build, P, T, Cone, Cyl, Box, Dod, Sph, Oct } from './models.js';
import { figure } from './classmodels.js';
import { H, HN, hgt, world, addWall, linkDoors, mergeBuilt, mat4, meshWithOutline, registerZone, ZONE_SIZE } from './world.js';
import { groundMesh } from './zones.js';
import { MOBS } from './data.js';
import { MOB_LORE } from './dialogue.js';
const O = [0, 0, 0], LR = [1, -1];
ZONE_SIZE.moon = 300;

export const D1 = {
  port: { x: 0, z: 185, R: 30, base: 3 },       // Dustfall Port
  pad: { x: 62, z: 190, R: 16 },                // the landing pad and the impound yard
  farm: { x: -130, z: 120, R: 14 },             // the Brannigan homestead
  scrap: { x: 185, z: 40, R: 60 },              // the Scrap Fields
  canyon: { x: -175, z: -60, R: 70 },           // Glass Canyon, Dust Rat country
  ratcamp: { x: -200, z: -95, R: 16 },          // the Rats' big camp, where they keep prisoners
  marrow: { x: 10, z: -195, R: 40 },            // the wreck of the hauler Marrow (open dungeon, 4-5)
};

// ---------- models ----------
const STILL = [0, 0, 0, 0], HUM = [.6, .4, 1.6, .15];
const droneGeo = () => build([
  P(T(Sph(.42, 9, 7), 0, 1.2, 0, 0, 0, 0, 1, .8, 1), 0, O, '#7a7f86'), P(T(Sph(.16, 6, 5), 0, 1.2, .36), 0, O, '#ff4a2a', 2.6),
  P(T(Cyl(.62, .62, .05, 12), 0, 1.5), 0, O, '#3a3e44'), P(T(Cyl(.05, .05, .5, 4), 0, .85), 0, O, '#3a3e44'),
  ...LR.map(s => P(T(Box(.12, .12, .6), .4 * s, 1.05, .2), 0, O, '#c8782a')),
]);
const raiderGeo = i => figure({ body: 'leather', head: i === 2 ? 'hood' : 'bandana', r: i === 1 ? 'dagger' : 'curved', l: i === 1 ? 'dagger' : null, sash: i === 0 },
  [{ a: '#8a4a2a', b: '#3a2a22', t: '#d8b24a', g: '#fff' }, { a: '#5a5a4a', b: '#2a2a24', t: '#c8782a', g: '#fff' }, { a: '#6a2a2a', b: '#2a1a1a', t: '#8dffef', g: '#8dffef' }][i], i);
const crateGeo = () => build([P(T(Box(1.1, .8, .8), 0, .4), 0, O, '#5a6a72'), P(T(Box(1.14, .08, .84), 0, .62), 0, O, '#c8782a'), P(T(Box(.2, .2, .04), 0, .35, .41), 0, O, '#8dffef', 1.6)]);
const cageGeo = () => build([P(T(Box(2.4, .12, 2.4), 0, .06), 0, O, '#3a3e44'), P(T(Box(2.4, .12, 2.4), 0, 2.5), 0, O, '#3a3e44'),
  ...[0, 1, 2, 3, 4, 5, 6, 7].map(k => P(T(Cyl(.05, .05, 2.4, 4), Math.cos(k / 8 * TAU) * 1.15, 1.25, Math.sin(k / 8 * TAU) * 1.15), 0, O, '#8a8f96'))]);
const consoleGeo = () => build([P(T(Box(1.2, .9, .5), 0, .45), 0, O, '#3a4450'), P(T(Box(1.1, .5, .06), 0, 1.1, .1, -.5), 0, O, '#8dffef', 1.6), P(T(Box(.3, .06, .2), -.3, .93, .15), 0, O, '#ffcf6a', 1.4)]);
addKinds({ sdrone: [droneGeo(), [0, 0, 0, .3], .03, .03], rat0: [raiderGeo(0), HUM, .05, .03], rat1: [raiderGeo(1), HUM, .05, .03], rat2: [raiderGeo(2), HUM, .05, .03],
  crate: [crateGeo(), STILL, 0, .03], cage: [cageGeo(), STILL, 0, .03], console: [consoleGeo(), STILL, 0, .03] });

// buildings: prefab habitats, domes, an antenna mast, a lamp post, and the ship herself
const habGeo = (w = 7, d = 5, col = '#b8a888', trim = '#c8782a') => build([P(T(Box(w, 2.6, d), 0, 1.3), 0, O, col), P(T(Cyl(d / 2, d / 2, w, 10, 1, false, 0, Math.PI), 0, 2.6, 0, 0, 0, Math.PI / 2), 0, O, '#8a8478'),
  P(T(Box(1.3, 2, .12), 0, 1, d / 2 + .02), 0, O, '#2a2e34'), P(T(Box(w + .1, .25, d + .1), 0, 2.5), 0, O, trim), ...LR.map(s => P(T(Box(.8, .5, .1), s * w * .3, 1.7, d / 2 + .02), 0, O, '#8dffef', 1.2))]);
const domeGeo = (r = 4, col = '#c8c0a8') => build([P(T(Sph(r, 14, 8, 0, TAU, 0, Math.PI / 2), 0, 0), 0, O, col), P(T(Box(1.4, 2, .6), 0, 1, r - .2), 0, O, '#2a2e34'), P(T(Cyl(.2, .2, 1.2, 5), 0, r + .4), 0, O, '#3a3e44'), P(T(Oct(.25), 0, r + 1.1), 0, O, '#ff6a3a', 2)]);
const mastGeo = () => build([P(T(Cyl(.15, .3, 14, 5), 0, 7), 0, O, '#5a5e64'), P(T(Cone(1.4, .8, 8, 1, true), 0, 12.5, .6, Math.PI / 2.4), 0, O, '#a8a8a0'), P(T(Oct(.3), 0, 14.3), 0, O, '#ff3a2a', 2.6)]);
const lampGeo = () => build([P(T(Cyl(.07, .1, 3.4, 5), 0, 1.7), 0, O, '#3a3e44'), P(T(Box(.5, .16, .5), 0, 3.45), 0, O, '#ffe0a0', 2)]);
export const shipGeo = (hull = '#8a8e96', trim = '#c8782a') => build([
  P(T(Sph(4, 14, 8), 0, 3.6, 0, 0, 0, 0, 1.25, .5, 2.6), 0, O, hull),                               // the hull: a fat, flattened teardrop
  P(T(Sph(1.6, 10, 6), 0, 4.6, 6.4, 0, 0, 0, 1, .6, 1.4), 0, O, '#2a3a4a'),                         // cockpit glass
  P(T(Box(11, .5, 4), 0, 3.3, -3), 0, O, hull), P(T(Box(11.2, .2, 1), 0, 3.6, -3), 0, O, trim),     // stub wings
  ...LR.map(s => P(T(Cyl(1.1, 1.3, 5, 10), 4.6 * s, 3.4, -5.5, Math.PI / 2), 0, O, '#5a5e66')),     // engines
  ...LR.map(s => P(T(Cyl(.9, .9, .3, 10), 4.6 * s, 3.4, -8.1, Math.PI / 2), 0, O, '#6ad8ff', 1.8)),
  ...[[-3, 4], [3, 4], [-3.4, -4], [3.4, -4]].map(([x, z]) => P(T(Cyl(.16, .2, 2.4, 5), x, 1.2, z), 0, O, '#3a3e44')),
  ...[[-3, 4], [3, 4], [-3.4, -4], [3.4, -4]].map(([x, z]) => P(T(Box(.9, .12, .9), x, .06, z), 0, O, '#3a3e44')),
  P(T(Box(2.2, .14, 4.4), 0, 1.25, -9.4, .46), 0, O, '#5a5e66'),                                    // the boarding ramp at the stern
  P(T(Box(2.2, 2, .1), 0, 2.6, -7.4), 0, O, '#ffe0a0', 1.2), P(T(Box(4, .2, .1), 0, 4.2, 2, 0, 0, 0), 0, O, trim),
]);
const ribGeo = (r, h) => build([P(T(new THREE.TorusGeometry(r, .5, 5, 14, Math.PI), 0, 0, 0), 0, O, '#5a5048'), P(T(Box(.9, h, .9), -r, h / 2 - .2), 0, O, '#4a423c'), P(T(Box(.9, h * .6, .9), r, h * .3 - .2), 0, O, '#4a423c')]);
const hullPlate = (w, h) => build([P(T(Box(w, h, .5), 0, h / 2, 0, 0, 0, .06), 0, O, '#6a5a50'), P(T(Box(w * .5, .3, .55), w * .1, h * .6), 0, O, '#8a3a22')]);
const scrapHeap = () => build([P(T(Dod(1.2), 0, .5, 0, 0, 0, 0, 1.4, .6, 1.1), 0, O, '#6a5e54'), P(T(Box(1.6, .2, .9), .4, 1.05, 0, .3, .5, .2), 0, O, '#8a8f96'), P(T(Cyl(.3, .3, 1.4, 6), -.6, .8, .3, 1.2, 0, .4), 0, O, '#8a3a22'), P(T(Box(.5, .9, .5), .2, .6, -.7, 0, .7, .2), 0, O, '#4a5560')]);
const spireGeo = () => build([P(T(Cone(.5, 3.6, 5), 0, 1.8), 0, O, '#b8d8d0'), P(T(Cone(.3, 2.2, 5), .5, 1.1, .2, 0, 0, -.3), 0, O, '#9ac8c0'), P(T(Cone(.25, 1.6, 5), -.4, .8, -.2, 0, 0, .35), 0, O, '#d8f0e8', .3)]);

// ---------- enemies ----------
// A captain starts alone, so the flats and the fields are tuned for one. The Rats come in gangs; bring company.
const mob = (name, kind, o) => ({ name, kind, hpM: 1, dmgM: 1, spd: 5.4, range: 2.4, weak: 'fire', resist: null, scale: 1, aggro: 9, social: 7, ...o });
const BE = { beast: true }, HU = { human: true };
Object.assign(MOBS, {
  jackal: mob('Dust Jackal', 'wolf', { hpM: .8, dmgM: .85, spd: 6.2, scale: .85, weak: 'frost', ...BE }),
  skitter: mob('Rock Skitter', 'spider', { hpM: .85, dmgM: .85, spd: 5.6, scale: .7, weak: 'fire', resist: 'earth', ...BE }),
  glasswing: mob('Glasswing', 'wasp', { hpM: .75, dmgM: .9, spd: 6.6, fly: .9, weak: 'frost', aggro: 8, social: 5, ...BE }),
  scrapdrone: mob('Scrap Drone', 'sdrone', { hpM: .85, dmgM: .85, range: 16, ranged: true, fly: .5, weak: 'storm', resist: 'poison', social: 9 }),
  loader: mob('Rogue Loader', 'golempet', { hpM: 1.15, dmgM: .9, spd: 4.6, range: 2.8, weak: 'storm', resist: 'earth', scale: .95, social: 9 }),
  ratthug: mob('Dust Rat Thug', 'rat0', { hpM: 1, dmgM: .95, weak: 'storm', aggro: 11, social: 12, ...HU }),
  ratgun: mob('Dust Rat Gunner', 'rat1', { hpM: .85, dmgM: .95, range: 20, ranged: true, weak: 'storm', aggro: 12, social: 12, ...HU }),
  rattech: mob('Dust Rat Patcher', 'rat2', { hpM: .85, dmgM: .8, range: 16, ranged: true, caster: true, healer: true, school: 'storm', weak: 'fire', aggro: 11, social: 12, ...HU }),
  ratdrone: mob('Rat-rigged Drone', 'sdrone', { hpM: .9, dmgM: .9, range: 16, ranged: true, fly: .5, weak: 'storm', resist: 'poison', aggro: 11, social: 12 }),
});
const boss = (name, kind, o) => ({ name, kind, hpM: 1.15, dmgM: 1, spd: 5.2, range: 2.8, weak: 'storm', resist: null, scale: 1.35, aggro: 14, social: 18, ...o });
Object.assign(MOBS, {
  glasseye: boss('Old Glasseye', 'spider', { ...BE, hpM: 1.2, dmgM: .8, scale: 1.7, weak: 'fire', resist: 'earth', mechs: ['pool', 'spawn'], adds: 'skitter', lines: { start: '*The ground shifts. Something the size of a cargo skiff unfolds eight legs and turns one cracked, glittering eye toward you.*', half: '*The dust boils. Its brood is coming.*' } }),
  knuckles: boss('Knuckles Varga', 'brute', { ...HU, scale: 1.15, mechs: ['cleave', 'slam'], lines: { start: "You're on Rat ground, spacer. The toll is everything in your pockets. And your pockets.", half: 'Vesna! Vesna, they hit HARD!' } }),
  sprocket: boss('Sprocket', 'golempet', { hpM: 1.3, scale: 1.4, resist: 'earth', mechs: ['slam', 'enrage'], lines: { start: 'UNIT SPROCKET. NEW DIRECTIVE: CRUSH VISITORS. THANK YOU FOR VISITING.', half: 'WARRANTY VOID. WARRANTY VOID.' } }),
  vesna: boss('Red Vesna, the Rat Queen', 'captain', { ...HU, hpM: 1.5, scale: 1.3, mechs: ['cleave', 'call', 'pool', 'enrage'], adds: 'ratgun', lines: { start: "So you're Osric's kin. He owed me a ship. I see the debt runs in the family.", half: 'Rats! Earn your keep!', enrage: "That core was MINE. The star on it was MINE." } }),
});
Object.assign(MOB_LORE, {
  jackal: 'A lean, six-legged scavenger that came to Dustfall in somebody\'s cargo hold three centuries ago and never left.', skitter: 'A flat grey crawler that eats lichen, cable insulation and, given the chance, ankles.',
  glasswing: 'Its wings are clear as window glass and sharp as the broken kind. They swarm when the dust blows.', scrapdrone: 'A salvage drone that slipped its owner\'s leash. It still collects scrap. It has broadened its definition of scrap.',
  loader: 'A cargo loader with a corrupted work order. It is trying, very sincerely, to stack you.', ratthug: 'A Dust Rat: one of the gang that taxes every road on the moon. This one does the hitting.',
  ratgun: 'A Dust Rat with a scavenged blaster and no idea how to service it, which makes it dangerous to everybody.', rattech: 'The Rats\' patchers keep the gang standing with stolen medigel and jump-leads. Deal with them first.',
  ratdrone: 'A salvage drone the Rats rewired. It has a gun now. Nobody asked it if it wanted one.',
  glasseye: 'The oldest skitter on Dustfall. Prospectors say it has one good eye and a hoard of everything shiny it ever took off a body.',
  knuckles: 'Red Vesna\'s toll collector. He has broken every bone in both hands at least once, mostly on other people.', sprocket: 'The Marrow\'s deck loader, still on shift three hundred years after the crash. The Rats feed it scrap and point it at visitors.',
  vesna: 'Red Vesna flew with Osric Vane before she ran the Dust Rats. Whatever came between them, she has been waiting a long time to collect.',
});

// ---------- the land ----------
const sm = t => t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t);
const roadX = z => Math.sin(z * .014) * 14;
function moonLand(x, z, N) {
  let h = 3 + N.fbm(x * .008, z * .008, 4) * 9 + (N.fbm(x * .04 + 5, z * .04, 2) - .5) * 1.6;
  // Glass Canyon: a long trench in the west with glassy walls
  const cx = -175 + Math.sin(z * .02) * 22, cd = Math.abs(x - cx);
  if (z < 60 && z > -190) { const k = sm(1 - cd / 46) * sm((60 - z) / 40) * sm((z + 190) / 40); h = lerp(h, 1.2, k); if (cd > 46 && cd < 62) h += (1 - Math.abs(cd - 54) / 8) * 7 * sm((60 - z) / 40) * sm((z + 190) / 40); }
  return h;
}
registerZone('moon', seed => {
  const rng = mulberry32(seed + 4242), N = makeNoise(seed + 4242), pk = a => a[(rng() * a.length) | 0];
  world.water = null;
  world.names = { zone: 'Dustfall', town: 'Dustfall Port', boss: 'Red Vesna', ruin: 'the Marrow', wood: 'Glass Canyon', fields: 'the Homestead Flats', waste: 'the Scrap Fields', road: 'the Haul Road', captain: 'Knuckles Varga', tusk: 'Old Glasseye' };
  const Pt = D1.port, Pad = D1.pad, Fm = D1.farm, Mw = D1.marrow, Rc = D1.ratcamp;
  for (let zi = 0; zi < HN; zi++) for (let xi = 0; xi < HN; xi++) {
    const x = xi - WH, z = zi - WH; let h = moonLand(x, z, N);
    h = lerp(Pt.base, h, sm((Math.hypot(x - Pt.x, z - Pt.z) - Pt.R - 2) / 20));
    h = lerp(Pt.base, h, sm((Math.hypot(x - Pad.x, z - Pad.z) - Pad.R - 1) / 12));
    h = lerp(4, h, sm((Math.hypot(x - Fm.x, z - Fm.z) - Fm.R) / 14));
    h = lerp(3.5, h, sm((Math.hypot(x - Mw.x, z - Mw.z) - Mw.R) / 22));
    h = lerp(1.4, h, sm((Math.hypot(x - Rc.x, z - Rc.z) - Rc.R) / 10));
    if (Math.abs(x - roadX(z)) < 6 && z > -160 && z < 160) h = lerp(h, Math.min(h, 4 + N.fbm(x * .01, z * .01, 2) * 2), .6);
    const edge = Math.max(Math.abs(x), Math.abs(z)) - (WH - 24); if (edge > 0) h += edge * edge * .1;
    H[zi * HN + xi] = h;
  }
  const DUST = new THREE.Color('#b8956a'), RUST = new THREE.Color('#a8683a'), SALT = new THREE.Color('#d8ccb0'), OIL = new THREE.Color('#4a443e'), GLASS = new THREE.Color('#8ab8b0'), ROCK = new THREE.Color('#7a6858'), PAVE = new THREE.Color('#6a6a68'), ROAD = new THREE.Color('#8a7458'), PADC = new THREE.Color('#4a4e54');
  const colorAt = (x, z) => {
    const h = hgt(x, z); let c = DUST.clone().lerp(RUST, N.fbm(x * .015, z * .015, 3));
    c.lerp(SALT, sm((N.fbm(x * .01 + 7, z * .01, 2) - .5) * 4) * .6);
    const ds = Math.hypot(x - D1.scrap.x, z - D1.scrap.z); if (ds < D1.scrap.R + 30) c.lerp(OIL, sm(1 - ds / (D1.scrap.R + 30)) * (.3 + N.n2(x * .12, z * .12) * .5));
    const cx = -175 + Math.sin(z * .02) * 22; if (z < 60 && z > -190 && Math.abs(x - cx) < 64) c.lerp(GLASS, sm(1 - Math.abs(x - cx) / 64) * .55);
    if (h > 11) c.lerp(ROCK, sm((h - 11) / 5));
    if (Math.abs(x - roadX(z)) < 4 && z > -160 && z < 160) c.lerp(ROAD, .55);
    if (Math.hypot(x - Pt.x, z - Pt.z) < Pt.R - 1) c.lerp(PAVE, .6);
    const dp = Math.hypot(x - Pad.x, z - Pad.z); if (dp < Pad.R) { c.lerp(PADC, .85); if (Math.abs(dp - Pad.R + 1.5) < .6 || Math.abs(dp - 6) < .4) c.lerp(new THREE.Color('#e8b83a'), .8); }
    const dm = Math.hypot(x - Mw.x, z - Mw.z); if (dm < Mw.R) c.lerp(OIL, .45);
    const sh = .9 + N.n2(x * .3, z * .3) * .18; return new THREE.Color(c.r * sh, c.g * sh, c.b * sh);
  };
  groundMesh(colorAt);
  world.regionNames = ['The Homestead Flats', 'The Scrap Fields', 'Glass Canyon', 'The Wreck of the Marrow'];
  world.regionFn = (x, z) => Math.hypot(x - Mw.x, z - Mw.z) < 90 || z < -140 ? 3 : x < -90 && z < 70 ? 2 : x > 90 && z < 150 ? 1 : 0;

  // ---------- Dustfall Port ----------
  const items = [], put = (geo, x, z, ry = 0, s = 1) => items.push({ geo, m: mat4(x, hgt(x, z), z, ry, s) });
  const solid = (x, z, w, d, ry = 0) => { const c = Math.cos(ry), s = Math.sin(ry), pt = (lx, lz) => [x + lx * c + lz * s, z - lx * s + lz * c]; const k = [pt(-w / 2, -d / 2), pt(w / 2, -d / 2), pt(w / 2, d / 2), pt(-w / 2, d / 2)]; for (let i = 0; i < 4; i++) addWall(k[i][0], k[i][1], k[(i + 1) % 4][0], k[(i + 1) % 4][1], .3); };
  const round = (x, z, r) => { for (let k = 0; k < 8; k++) { const a = k / 8 * TAU, b = (k + 1) / 8 * TAU; addWall(x + Math.cos(a) * r, z + Math.sin(a) * r, x + Math.cos(b) * r, z + Math.sin(b) * r, .3); } };
  // the cantina, the broker's office, the constabulary, the workshop and the supply shed
  for (const [dx, dz, ry, w, d, col, trim] of [[-14, -10, 0, 10, 6, '#b89a78', '#c8782a'], [12, -12, 0, 8, 5, '#a8a090', '#2e5a9e'], [-18, 8, Math.PI / 2, 7, 5, '#9aa0a8', '#3a6a9a'], [16, 6, -Math.PI / 2, 8, 6, '#a89078', '#8a3a22'], [-4, 18, Math.PI, 6, 4.5, '#b8a888', '#5a8a4a']]) { put(habGeo(w, d, col, trim), Pt.x + dx, Pt.z + dz, ry); solid(Pt.x + dx, Pt.z + dz, w, d, ry); }
  for (const [dx, dz, r] of [[-24, -4, 3.2], [22, -6, 3], [4, -22, 3.6], [-10, 22, 2.8]]) { put(domeGeo(r), Pt.x + dx, Pt.z + dz, rng() * TAU); round(Pt.x + dx, Pt.z + dz, r - .3); }
  put(mastGeo(), Pt.x + 2, Pt.z + 2); solid(Pt.x + 2, Pt.z + 2, .8, .8);
  for (const [dx, dz] of [[-6, -4], [8, -2], [-2, 10], [10, 12], [-12, 2], [24, 4], [34, 6], [46, 8]]) put(lampGeo(), Pt.x + dx, Pt.z + dz);
  for (let k = 0; k < 9; k++) put(crateGeo(), Pt.x + 14 + rng() * 6, Pt.z + 12 + rng() * 5, rng() * TAU, .8 + rng() * .5);
  // the pad and the Second Chance, nose to the north
  put(shipGeo(), Pad.x, Pad.z, Math.PI); solid(Pad.x, Pad.z - 1, 9, 13);
  for (let k = 0; k < 10; k++) { const a = k / 10 * TAU; if (Math.abs(a - Math.PI) < .5) continue; put(lampGeo(), Pad.x + Math.cos(a) * (Pad.R - .5), Pad.z + Math.sin(a) * (Pad.R - .5)); }
  // the Brannigan homestead
  put(habGeo(8, 5, '#c0a880', '#5a8a4a'), Fm.x, Fm.z - 4, 0); solid(Fm.x, Fm.z - 4, 8, 5); put(domeGeo(3, '#a8c8a0'), Fm.x + 9, Fm.z + 2); round(Fm.x + 9, Fm.z + 2, 2.7); put(domeGeo(3, '#a8c8a0'), Fm.x - 9, Fm.z + 3); round(Fm.x - 9, Fm.z + 3, 2.7);
  for (let k = 0; k < 14; k++) { const a = k / 14 * TAU; put(build([P(T(Box(.2, 1.2, .2), 0, .6), 0, O, '#8a8f96'), P(T(Box(.08, .08, 5.6), 0, 1, 2.8), 0, O, '#8dffef', .8)]), Fm.x + Math.cos(a) * 13, Fm.z + Math.sin(a) * 13, -a + Math.PI); }
  // the Scrap Fields
  for (let i = 0; i < 46; i++) { const a = rng() * TAU, d = rng() * (D1.scrap.R + 14); put(scrapHeap(), D1.scrap.x + Math.cos(a) * d, D1.scrap.z + Math.sin(a) * d, rng() * TAU, .8 + rng() * 1.4); }
  for (let i = 0; i < 5; i++) { const a = rng() * TAU, d = 14 + rng() * 40; put(hullPlate(6 + rng() * 5, 4 + rng() * 4), D1.scrap.x + Math.cos(a) * d, D1.scrap.z + Math.sin(a) * d, rng() * TAU); }
  // the Rats' camp: tents of hull plate around a fire barrel, and a cage
  for (let k = 0; k < 7; k++) { const a = k / 7 * TAU + .2; put(hullPlate(4.5, 3.2), Rc.x + Math.cos(a) * (Rc.R - 3), Rc.z + Math.sin(a) * (Rc.R - 3), -a + Math.PI / 2); }
  put(build([P(T(Cyl(.5, .5, 1.1, 8), 0, .55), 0, O, '#5a3a2a'), P(T(Cone(.4, .9, 6), 0, 1.5), 0, O, '#ff8a2a', 2.4)]), Rc.x, Rc.z);
  // the wreck of the Marrow: a broken spine of ribs running north, with a split hull to walk into
  for (let k = 0; k < 7; k++) { put(ribGeo(13 - Math.abs(k - 3) * 1.2, 5), Mw.x + Math.sin(k) * 1.5, Mw.z + 30 - k * 10, 0); }
  for (const [dx, dz, ry, w, h] of [[-17, 18, .2, 12, 7], [17, 14, -.25, 12, 8], [-19, -6, .1, 14, 9], [19, -10, -.1, 14, 8], [-15, -30, .5, 10, 6], [15, -32, -.5, 10, 6], [0, -40, 0, 16, 10]]) { put(hullPlate(w, h), Mw.x + dx, Mw.z + dz, ry + Math.PI / 2 * (dx ? 1 : 0)); const c = Math.cos(ry + (dx ? Math.PI / 2 : 0)), s = Math.sin(ry + (dx ? Math.PI / 2 : 0)); addWall(Mw.x + dx - c * w / 2, Mw.z + dz + s * w / 2, Mw.x + dx + c * w / 2, Mw.z + dz - s * w / 2, .5); }
  for (let i = 0; i < 16; i++) put(scrapHeap(), Mw.x + (rng() - .5) * 60, Mw.z + (rng() - .5) * 70, rng() * TAU, 1 + rng());
  meshWithOutline(mergeBuilt(items), .05);
  linkDoors();
  // a ringed world hangs in the sky: Dustfall is somebody's moon
  { const g = new THREE.Group(); g.position.set(-140, 300, -720);
    const pl = new THREE.Mesh(new THREE.SphereGeometry(150, 28, 18), new THREE.MeshBasicMaterial({ color: '#c89a6a', fog: false })); const band = new THREE.Mesh(new THREE.SphereGeometry(151, 28, 18, 0, TAU, 1.2, .5), new THREE.MeshBasicMaterial({ color: '#a8683a', fog: false }));
    const ring = new THREE.Mesh(new THREE.RingGeometry(190, 270, 48), new THREE.MeshBasicMaterial({ color: '#e8d8b8', fog: false, side: THREE.DoubleSide, transparent: true, opacity: .6 })); ring.rotation.set(1.25, .3, 0);
    g.add(pl, band, ring); worldGroup.add(g); }

  // ---------- places, towns, zone lines ----------
  world.places = [{ name: 'Dustfall Port', x: Pt.x, z: Pt.z, R: Pt.R + 2, kind: 'town' }, { name: 'The Landing Pad', x: Pad.x, z: Pad.z, R: Pad.R, kind: 'town' }, { name: 'Brannigan Homestead', x: Fm.x, z: Fm.z, R: Fm.R + 2, kind: 'town' },
    { name: 'The Scrap Fields', x: D1.scrap.x, z: D1.scrap.z, R: D1.scrap.R, kind: 'camp' }, { name: 'The Dust Rat Camp', x: Rc.x, z: Rc.z, R: Rc.R, kind: 'camp' }, { name: 'The Wreck of the Marrow', x: Mw.x, z: Mw.z, R: Mw.R, kind: 'dungeon' }];
  world.town = Pt;
  world.towns = [
    { key: 'dustfall', name: 'Dustfall Port', x: Pt.x, z: Pt.z, R: Pt.R, guardName: 'Port Constable', npcs: [['giver', 'dekk', 10, -7], ['giver', 'ruth', -13, 8], ['giver', 'sazz', -12, -5], ['vendor', 'dust', -4, 14], ['bind', null, 5, 6]], guards: [[-4, -Pt.R + 4], [4, -Pt.R + 4], [Pt.R - 4, 6], [-Pt.R + 5, -2]] },
    { key: 'farm', name: 'Brannigan Homestead', x: Fm.x, z: Fm.z, R: Fm.R, guardName: 'Farmhand', npcs: [['giver', 'mabel', 1, 1]], guards: [[6, 6]] },
  ];
  world.storyNpcs.push({ key: 'tilly', x: Pad.x - 11, z: Pad.z + 6, yaw: -1.2 }, { key: 'juno', x: Rc.x + 3, z: Rc.z - 3, yaw: 2.4, unless: ['junofree', '*'] }, { key: 'juno', x: Pad.x - 8, z: Pad.z + 12, yaw: -2, when: ['junofree', '*'], unless: ['crew1', '*'] });
  world.mapLabels = [{ t: 'Jackals, skitters (1-2)', x: -30, z: 110 }, { t: 'Drones, loaders (2-3)', x: 185, z: 70 }, { t: 'Dust Rats (3-4)', x: -175, z: -20 }, { t: 'The Rat Queen (4-5)', x: 10, z: -150 }];
  world.zoneLines.push({ x: Pad.x, z: Pad.z + 11, r: 2.6, to: 'ship', label: 'Board the Second Chance' });
  Object.assign(world.spots, { town: { x: Pt.x, z: Pt.z }, pad: { x: Pad.x, z: Pad.z }, flats: { x: -20, z: 110 }, farm: { x: Fm.x, z: Fm.z }, scrap: { x: D1.scrap.x, z: D1.scrap.z }, canyon: { x: D1.canyon.x, z: D1.canyon.z }, ratcamp: { x: Rc.x, z: Rc.z }, marrow: { x: Mw.x, z: Mw.z + 30, r: 30 }, marrowdeep: { x: Mw.x, z: Mw.z - 24 } });
  world.clearSpots = [{ x: Pt.x, z: Pt.z, r: Pt.R + 26 }, { x: Pad.x, z: Pad.z, r: Pad.R + 18 }, { x: Fm.x, z: Fm.z, r: Fm.R + 8 }, { x: Rc.x, z: Rc.z, r: Rc.R + 2 }, { x: Mw.x, z: Mw.z, r: Mw.R + 4 }];
  // things to pick over
  const prop = (kind, tag, name, x, z, o = {}) => world.props.push({ id: 'd' + world.props.length, kind, tag, name, x, z, yaw: o.yaw ?? rng() * TAU, lore: o.lore || null, scale: o.scale || 1, when: o.when, unless: o.unless });
  for (let i = 0; i < 9; i++) { const a = i / 9 * TAU + rng() * .4, d = 12 + rng() * 40; prop('crate', 'salvage', 'Salvage crate', D1.scrap.x + Math.cos(a) * d, D1.scrap.z + Math.sin(a) * d); }
  prop('cage', 'cage', 'Prisoner cage', Rc.x + 3, Rc.z - 3, { yaw: 0, unless: ['junofree', '*'] });
  prop('console', 'lore', "The Marrow's black box", Mw.x + 6, Mw.z - 30, { lore: 'marrowbox', yaw: 2 });
  prop('crate', 'lore', "Osric's footlocker", Pad.x - 9, Pad.z - 8, { lore: 'osricletter', yaw: .4 });

  // ---------- spawns ----------
  const sp = world.spawns, put2 = o => sp.push({ ...o, y: hgt(o.x, o.z), alive: null, timer: 0 });
  const clear = p => !world.clearSpots.some(c => Math.hypot(c.x - p.x, c.z - p.z) < c.r) && !(Math.abs(p.x - roadX(p.z)) < 8 && p.z > -160 && p.z < 160);
  const land = (x0, x1, z0, z1, min = 10) => { for (let i = 0; i < 300; i++) { const p = { x: x0 + rng() * (x1 - x0), z: z0 + rng() * (z1 - z0) }; if (clear(p) && hgt(p.x, p.z) < 13 && !sp.some(s => Math.hypot(s.x - p.x, s.z - p.z) < min)) return p; } return null; };
  const scatter = (n, box, mobs, lvl, area, o = {}) => { for (let i = 0; i < n; i++) { const p = land(...box, o.min || 12); if (p) put2({ ...p, mob: pk(mobs), lvl, respawn: 55, area, ...o }); } };
  const camp = (n, box, mobs, lvl, area, tag) => { for (let i = 0; i < n; i++) { const p = land(...box, 30); if (!p) continue; world.camps.push({ x: p.x, z: p.z, kind: 'bandit' });
    for (let k = 0; k < mobs.length; k++) { const a = k / mobs.length * TAU; put2({ x: p.x + Math.cos(a) * 3, z: p.z + Math.sin(a) * 3, mob: mobs[k], lvl, respawn: 80, camp: tag + i, area, solo: true }); } } };
  // the flats: one at a time, so a captain on their own can learn the ropes
  scatter(22, [-110, 110, 110, 150], ['jackal', 'jackal', 'skitter'], [1, 1], 0, { solo: true, min: 13 });
  scatter(26, [-260, 130, 40, 270], ['jackal', 'skitter', 'skitter', 'glasswing'], [1, 2], 0, { solo: true });
  scatter(12, [-200, -60, 60, 200], ['skitter', 'glasswing', 'glasswing'], [2, 2], 0, { solo: true });
  // the Scrap Fields
  scatter(24, [110, 270, -50, 140], ['scrapdrone', 'scrapdrone', 'loader', 'skitter'], [2, 3], 1, { solo: true });
  scatter(8, [110, 270, -50, 140], ['loader'], [2, 3], 1, { solo: true });   // always enough loaders for Tilly's errand
  // Glass Canyon: pairs on the rim, gangs of three on the floor
  scatter(14, [-270, -90, -190, 50], ['glasswing', 'skitter', 'ratthug'], [3, 3], 2, { solo: true });
  camp(7, [-250, -110, -180, 40], ['ratthug', 'ratgun'], [3, 4], 2, 'gc');
  camp(3, [-240, -120, -170, 20], ['ratthug', 'ratgun', 'rattech'], [3, 4], 2, 'gd');
  for (const [dx, dz, m] of [[-8, 4, 'ratthug'], [8, 5, 'ratgun'], [-7, -8, 'rattech'], [9, -7, 'ratthug'], [0, 10, 'ratgun']]) put2({ x: Rc.x + dx, z: Rc.z + dz, mob: m, lvl: [4, 4], respawn: 90, camp: 'rc' + (dx < 0 ? 0 : 1), area: 2, solo: true });
  // the Marrow: a group's work
  const packs = [[-10, 34, ['ratthug', 'ratgun']], [10, 30, ['ratthug', 'ratdrone']], [-12, 12, ['ratgun', 'rattech', 'ratthug']], [12, 8, ['ratdrone', 'ratdrone', 'ratthug']], [0, -6, ['ratthug', 'ratgun', 'rattech']], [-12, -20, ['ratgun', 'ratgun', 'ratthug']], [12, -22, ['ratthug', 'rattech', 'ratdrone']]];
  packs.forEach(([dx, dz, mobs], i) => mobs.forEach((m, k) => put2({ x: Mw.x + dx + (k % 2) * 2, z: Mw.z + dz + (k > 1 ? 2 : 0), mob: m, lvl: [4, 5], respawn: 240, camp: 'mw' + i, area: 3, dungeon: true, solo: true })));
  put2({ x: Mw.x - 14, z: Mw.z - 2, mob: 'sprocket', lvl: [4, 4], respawn: 900, named: 'sprocket', area: 3, dungeon: true, boss2: true });
  put2({ x: Mw.x, z: Mw.z - 32, mob: 'vesna', lvl: [5, 5], respawn: 1200, named: 'vesna', area: 3, dungeon: true, boss: true });
  // named: Knuckles holds the canyon mouth, Old Glasseye sleeps under the fields
  put2({ x: D1.canyon.x + 6, z: 20, mob: 'knuckles', lvl: [4, 4], respawn: 600, named: 'knuckles', area: 2 });
  { const p = land(150, 250, -30, 90) || { x: 200, z: 20 }; put2({ ...p, mob: 'glasseye', lvl: [3, 3], respawn: 600, named: 'glasseye', area: 1 }); }
  world.huntAreas = [{ area: 0, lvl: [1, 2] }, { area: 1, lvl: [2, 3] }, { area: 2, lvl: [3, 4] }, { area: 3, lvl: [4, 5] }];

  // ---------- scenery ----------
  const rocks = [], spires = [], cacti = [], tufts = [];
  for (let n = 0; n < 9000; n++) {
    const x = (rng() * 2 - 1) * (WH - 8), z = (rng() * 2 - 1) * (WH - 8), h = hgt(x, z);
    if (world.clearSpots.some(c => Math.hypot(c.x - x, c.z - z) < c.r - 14) || Math.abs(x - roadX(z)) < 5 && z > -160 && z < 160) continue;
    const r = rng(), cx = -175 + Math.sin(z * .02) * 22, inCanyon = z < 60 && z > -190 && Math.abs(x - cx) < 60;
    if (r < .05 || h > 11 && r < .2) rocks.push([x, h - .3, z, rng() * 6.3, 0, 0, .7 + rng() * 1.8]);
    else if (inCanyon && r < .16) spires.push([x, h - .2, z, rng() * 6.3, 0, 0, .8 + rng() * 1.6]);
    else if (r < .075) cacti.push([x, h - .1, z, rng() * 6.3, 0, 0, .7 + rng() * .8]);
    else if (r < .16) tufts.push([x, h - .15, z, rng() * 6.3, 0, 0, .25 + rng() * .3]);
  }
  addChunked(M.rockGeo('#9a7a5a', '#7a5a42'), propMat, rocks, .04); addChunked(spireGeo(), propMat, spires, .04); addChunked(podGeo(), propMat, cacti, .04);
  addChunked(build([P(T(Dod(1), 0, .2, 0, 0, 0, 0, 1, .4, 1), 0, O, '#8a9a6a')]), propMat, tufts, .02);
  world.trees = [...spires.map(t => ({ x: t[0], z: t[2], r: .5 })), ...cacti.map(t => ({ x: t[0], z: t[2], r: .3 }))];
  world.minimap = minimapFrom(colorAt);
  return world;
});
export function minimapFrom(colorAt) {
  const mm = document.createElement('canvas'); mm.width = mm.height = 200; const g = mm.getContext('2d'), img = g.createImageData(200, 200);
  for (let y = 0; y < 200; y++) for (let x = 0; x < 200; x++) { const wx = x * (2 * WH / 200) - WH, wz = y * (2 * WH / 200) - WH, c = colorAt(wx, wz), o = (y * 200 + x) * 4;
    img.data[o] = Math.min(255, c.r ** (1 / 2.2) * 255); img.data[o + 1] = Math.min(255, c.g ** (1 / 2.2) * 255); img.data[o + 2] = Math.min(255, c.b ** (1 / 2.2) * 255); img.data[o + 3] = 255; }
  g.putImageData(img, 0, 0); return mm;
}
// Dustfall's light: a rust-and-teal sky, and a hard little sun
X.light.push(() => {
  if (S.zone !== 'moon') return;
  const u = R.skyMat.uniforms; u.top.value.lerp(new THREE.Color('#1a2a3a'), .55); u.mid.value.lerp(new THREE.Color('#c88a5a'), .45); u.hor.value.lerp(new THREE.Color('#e8b888'), .5);
  R.scene.fog.color.lerp(new THREE.Color('#c89a6a'), .5);
});
export { habGeo, domeGeo, lampGeo, crateGeo, consoleGeo, mastGeo };
