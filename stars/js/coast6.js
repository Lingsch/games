// Build 6: the Saltreach Coast, twice as big. The mainland grows west and north and south of Saltmarrow:
// the Greywatch Light on its northern headland (the lighthouse keepers), Crookwater hidden in a southern hollow
// (smugglers and refugees), the Wreckers' Teeth and the Tidewater Shrine (open dungeons, 10-12), and the doors
// to the Brine Vaults and the Bonewhale Grotto (instanced, 13-15). Storms bring the drowned ashore; some things
// only walk at night.
import * as THREE from './three.js';
import { S, WH, TAU, chat, pick, rnd, isNight, X, clamp, mulberry32 } from './core.js';
import { world, H, HN, hgt, addWall, mat4, meshWithOutline, mergeBuilt, campVisual, ruinWallGeo, pillarGeo, ZONE_SIZE, registerZone, zoneMarker, linkDoors, depthAt } from './world.js';
import { coastHooks } from './zones.js';
import { MOBS } from './data.js';
import { build, P, T, Box, Cyl, Cone, Sph, Oct, Dod } from './models.js';
import * as M from './models.js';
import * as CO from './coastmodels.js';
import { houseGeo } from './town.js';
import { INSTANCES, DBOSSES, FINALS, buildInstance } from './dungeons.js';
import * as R from './render.js';
import { worldGroup, scene } from './render.js';
import { MOB_LORE } from './dialogue.js';
const O = [0, 0, 0];
const sm = t => t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t);

ZONE_SIZE.coast = 420;

// ---------- where everything is ----------
export const C6 = {
  light: { x: -176, z: -262, R: 13, base: 5.5 },     // the Greywatch Light, on the point of the headland
  hamlet: { x: -206, z: -248, R: 16, base: 3.4 },    // the keepers' cottages behind it
  crook: { x: -334, z: 252, R: 30, base: 1.8 },      // Crookwater, in a hollow with one way in
  teeth: { x: -194, z: 214, R: 24, base: 1.5 },      // the Wreckers' Teeth, on the shore
  shrine: { x: -318, z: -282, R: 32 },               // the Tidewater Shrine, in a salt lagoon
  vaults: { x: -376, z: -100 },                      // the door to the Brine Vaults, in an old sea-wall bastion
  grotto: { x: -214, z: 356 },                       // the Bonewhale Grotto, under a whale's ribs
};
const CROOK_GAP = Math.atan2(-252, 129);              // Crookwater's mouth faces Saltmarrow
export const INSTANCE_OUT = { brinevaults: { x: C6.vaults.x + 7, z: C6.vaults.z + 1 }, bonewhale: { x: C6.grotto.x + 1, z: C6.grotto.z - 9 } };
Object.assign(INSTANCES, {
  brinevaults: { parent: 'coast', out: INSTANCE_OUT.brinevaults, name: 'The Brine Vaults' },
  bonewhale: { parent: 'coast', out: INSTANCE_OUT.bonewhale, name: 'The Bonewhale Grotto' },
});

// ---------- the land ----------
function area(cx, cz, R, f) {
  for (let z = Math.floor(cz - R); z <= cz + R; z++) for (let x = Math.floor(cx - R); x <= cx + R; x++) {
    const xi = x + WH, zi = z + WH; if (xi < 0 || zi < 0 || xi >= HN || zi >= HN) continue;
    const d = Math.hypot(x - cx, z - cz); if (d > R) continue;
    const i = zi * HN + xi; H[i] = f(H[i], d, x, z);
  }
}
const flat = (s, fall = 16) => area(s.x, s.z, s.R + fall, (h, d) => h + (s.base - h) * (1 - sm((d - s.R) / fall)));
coastHooks.terrain.push(() => {
  // the headland juts out into the sea, high enough to see the whole coast from the lamp
  area(C6.light.x + 10, C6.light.z, 30, (h, d) => Math.max(h, 4.2 * (1 - sm((d - 14) / 16))));
  flat(C6.light, 12); flat(C6.hamlet, 14);
  // Crookwater: a flat floor, cliffs all round, and one way in
  const c = C6.crook;
  area(c.x, c.z, c.R + 22, (h, d, x, z) => {
    const a = Math.atan2(z - c.z, x - c.x), gap = Math.abs(((a - CROOK_GAP + Math.PI) % TAU + TAU) % TAU - Math.PI) < .2;
    if (d <= c.R) return c.base;
    const ring = sm((d - c.R) / 3) * (1 - sm((d - c.R - 12) / 10));
    return gap ? c.base + (h - c.base) * sm((d - c.R - 8) / 12) : Math.max(h, c.base + ring * 9);
  });
  flat(C6.teeth, 10);
  // the lagoon: an island with the shrine, a causeway from the south shore, salt water all round
  const L = C6.shrine;
  area(L.x, L.z, L.R + 16, (h, d, x, z) => {
    if (d < 9) return 1.7;
    if (z > L.z && Math.abs(x - L.x) < 2.6 && d < L.R + 2) return 1.25;
    if (d < L.R - 5) return -2.8;
    if (d < L.R) return -2.8 + (d - (L.R - 5)) / 5 * 4.4;
    return h + (1.6 - h) * (1 - sm((d - L.R) / 16));
  });
  flat({ ...C6.vaults, R: 9, base: 3 }, 12);
  area(C6.vaults.x - 10, C6.vaults.z, 16, (h, d) => h + 7 * (1 - sm(d / 16)));       // the cliff the bastion is cut into
  flat({ ...C6.grotto, R: 10, base: 1.4 }, 10);
  area(C6.grotto.x, C6.grotto.z + 13, 14, (h, d) => h + 6 * (1 - sm(d / 14)));        // rock over the grotto mouth
});
const COBBLE = new THREE.Color('#9a8f7c'), MUD = new THREE.Color('#7a6a4a'), STONE = new THREE.Color('#8a8a90');
coastHooks.color.push((x, z, c, h) => {
  for (const s of [C6.light, C6.hamlet]) if (Math.hypot(x - s.x, z - s.z) < s.R - 1) c.lerp(COBBLE, .5);
  if (Math.hypot(x - C6.crook.x, z - C6.crook.z) < C6.crook.R - 1) c.lerp(MUD, .45);
  if (Math.hypot(x - C6.teeth.x, z - C6.teeth.z) < C6.teeth.R) c.lerp(MUD, .3);
  if (Math.hypot(x - C6.shrine.x, z - C6.shrine.z) < 9 || (z > C6.shrine.z && Math.abs(x - C6.shrine.x) < 2.6 && Math.hypot(x - C6.shrine.x, z - C6.shrine.z) < C6.shrine.R + 2)) c.lerp(STONE, .55);
  if (Math.hypot(x - C6.vaults.x, z - C6.vaults.z) < 8) c.lerp(STONE, .5);
});

// ---------- models ----------
const lighthouseGeo = () => {
  const parts = [P(T(Cyl(4, 4.4, 1.2, 12), 0, .6), 0, O, '#8a8478')];
  for (let i = 0; i < 6; i++) { const y0 = 1.2 + i * 2.6, r0 = 3 - i * .2, r1 = r0 - .2; parts.push(P(T(Cyl(r1, r0, 2.6, 12), 0, y0 + 1.3), 0, O, i % 2 ? '#b83a32' : '#f0ece0')); }
  parts.push(P(T(Cyl(2.6, 2.2, .4, 12), 0, 17.1), 0, O, '#3a3a40'), P(T(Cyl(1.7, 1.7, 2.6, 10), 0, 18.6), 0, O, '#fff2a0', 3), P(T(Cone(2.1, 2.2, 10), 0, 21), 0, O, '#2a2a30'), P(T(Oct(.4), 0, 22.4), 0, O, '#ffd34d', 1.5));
  for (let k = 0; k < 10; k++) { const a = k / 10 * TAU; parts.push(P(T(Box(.1, 1, .1), Math.cos(a) * 2.5, 17.8, Math.sin(a) * 2.5), 0, O, '#2a2a30')); }
  parts.push(P(T(Box(1.4, 2.4, .2), 0, 2.4, 2.9), 0, O, '#4a3322'));
  return build(parts);
};
const signalFire = () => build([P(T(Cyl(.5, .7, 3.5, 6), 0, 1.75), 0, O, '#4a3322'), P(T(Cyl(1, .8, .5, 8), 0, 3.6), 0, O, '#3a3a40'), P(T(Cone(.8, 1.6, 6), 0, 4.6), 0, O, '#ff8a2a', 2.6)]);
const shack = (c = '#6b5a42') => build([P(T(Box(3.6, 2.4, 3), 0, 1.2), 0, O, c), P(T(Box(4, .2, 3.6), 0, 2.6, 0, .12), 0, O, '#4a3a2a'), P(T(Box(.9, 1.7, .1), 0, .85, 1.52), 0, O, '#3a2a1c'), P(T(Box(.6, .5, .08), 1.1, 1.6, 1.52), 0, O, '#f4d98a', .5)]);
const tent = (c = '#a89a7a') => build([P(T(Cone(2, 2.4, 4), 0, 1.2, 0, 0, Math.PI / 4), 0, O, c), P(T(Box(.8, 1.4, .05), 0, .7, 1.25), 0, O, '#2a221a')]);
const spire = s => build([P(T(Cone(1.6, 9, 6), 0, 3.5), 0, O, '#5e5a52'), P(T(Dod(1.4), .4, 1, .3), 0, O, '#6a6458')]);
const standing = () => build([P(T(Box(1, 3.6, .7), 0, 1.6, 0, .08, 0, .05), 0, O, '#7a8288'), P(T(Box(.5, .5, .08), 0, 2.6, .36), 0, O, '#5ad8c8', 1.2)]);
const brokenDome = () => build([P(T(Cyl(6.4, 6.8, .8, 16), 0, .4), 0, O, '#8a8a90'), ...[...Array(8).keys()].map(k => { const a = k / 8 * TAU, h = 3 + (k % 3) * 1.6; return P(T(Cyl(.45, .55, h, 8), Math.cos(a) * 5.2, h / 2 + .8, Math.sin(a) * 5.2), 0, O, '#c8c8c0'); }),
  P(T(Sph(5.6, 14, 8, 0, TAU, 0, Math.PI / 2), 0, 5.6, 0, .5, 0, .3), 0, O, '#9aa8a8'), P(T(Box(2, 3.4, 1.4), 0, 2.5, 0), 0, O, '#5a6a6a'), P(T(Oct(.6), 0, 4.8), 0, O, '#5ad8c8', 2)]);
const bastion = () => build([P(T(Box(12, 8, 6), 0, 4, -2), 0, O, '#6d6a62'), P(T(Box(12.6, .8, 6.4), 0, 8.2, -2), 0, O, '#5a5750'), ...[-5, -2.5, 0, 2.5, 5].map(x => P(T(Box(1.2, 1, 1), x, 9.1, .6), 0, O, '#6d6a62')),
  P(T(Box(4, 5, .6), 0, 2.5, 1.2), 0, O, '#0b0a0e'), P(T(Box(5, .7, .8), 0, 5.3, 1.2), 0, O, '#5a5750'), ...[-2.6, 2.6].map(x => P(T(Box(.8, 5.6, .9), x, 2.8, 1.2), 0, O, '#5a5750')),
  ...[-1.2, 1.2].map(x => P(T(Cyl(.06, .06, 3.4, 4), x, 3.4, 1.6, .3), 0, O, '#3a3a40')), P(T(Box(1.4, 1.4, .1), 0, 6.6, 1.65), 0, O, '#2e5a9e')]);
const ribs = () => { const parts = [P(T(Dod(5), 0, 2.5, -4, 0, 0, 0, 1.6, 1, 1), 0, O, '#5e5a52'), P(T(Box(4.6, 4.4, 1), 0, 2.2, -.6), 0, O, '#0b0a0e')];
  for (let i = 0; i < 6; i++) { const z = 2 + i * 2.2, s = 1 - i * .1; for (const sg of [-1, 1]) { parts.push(P(T(Cyl(.32, .4, 7 * s, 6), sg * 3.4 * s, 3.2 * s, z, 0, 0, sg * -.45), 0, O, '#e8e0cc'), P(T(Cyl(.28, .32, 3.6 * s, 6), sg * 1.3 * s, 6.6 * s, z, 0, 0, sg * -1.25), 0, O, '#e8e0cc')); } }
  parts.push(P(T(Cyl(.5, .6, 14, 8), 0, .5, 8, Math.PI / 2), 0, O, '#ddd4c0'), P(T(Box(3.4, 1.6, 4), 0, 1.4, 19.5, .2), 0, O, '#e8e0cc'));
  return build(parts); };
const boat = () => build([P(T(Box(1.6, .6, 4), 0, .3), 0, O, '#6b4a2e'), P(T(Box(1.2, .12, 3.4), 0, .62), 0, O, '#8a6a44'), P(T(Cone(.8, 1.2, 4), 0, .3, 2.4, Math.PI / 2, Math.PI / 4), 0, O, '#6b4a2e')]);
const lamp = () => build([P(T(Cyl(.08, .11, 3, 6), 0, 1.5), 0, O, '#2a2a30'), P(T(Box(.5, .55, .5), 0, 3.2), 0, O, '#ffcf6a', 1.8), P(T(Cone(.45, .35, 4), 0, 3.6, 0, 0, Math.PI / 4), 0, O, '#2a2a30')]);
const crates = () => build([P(T(Box(.9, .9, .9), 0, .45), 0, O, '#9a7a4a'), P(T(Box(.8, .8, .8), .95, .4, .2, 0, .4), 0, O, '#8a6a3a'), P(T(Box(.7, .7, .7), .4, 1.25, .1, 0, .2), 0, O, '#a08050'), P(T(Cyl(.38, .38, .9, 8), -.9, .45, .3), 0, O, '#7a5a36')]);
const stall = cl => build([P(T(Box(2.4, .9, 1), 0, .45), 0, O, '#6b4a2e'), ...[-1, 1].flatMap(s => [-1, 1].map(t => P(T(Box(.1, 2, .1), s * 1.1, 1, t * .45), 0, O, '#4a3322'))), P(T(Box(2.7, .08, 1.4), 0, 2, 0, .2), 0, O, cl)]);
const fence = len => build([...Array(Math.max(2, Math.round(len / 1.2) + 1)).keys()].map(i => P(T(Box(.12, .9, .12), -len / 2 + i * len / Math.max(1, Math.round(len / 1.2)), .45), 0, O, '#8a6a44')).concat([P(T(Box(len, .1, .08), 0, .7), 0, O, '#8a6a44')]));
const nets = () => build([...[-1, 1].map(s => P(T(Box(.1, 1.8, .1), s * 1.2, .9), 0, O, '#5a3e28')), P(T(Box(2.6, .06, .06), 0, 1.7), 0, O, '#5a3e28'), P(T(Box(2.2, 1.2, .03), 0, 1.05), 0, O, '#8a9a8a')]);

// ---------- enemies ----------
const U = { undead: true }, B = { beast: true }, HU = { human: true };
Object.assign(MOBS, {
  // the drowned navy, crawling ashore
  navymarine: { name: 'Drowned Marine', kind: 'drowned0', hpM: 1.05, dmgM: 1.05, spd: 5.4, range: 2.4, weak: 'storm', resist: 'frost', scale: 1.05, aggro: 11, social: 12, ...U },
  navyofficer: { name: 'Drowned Lieutenant', kind: 'drowned2', hpM: .95, dmgM: .95, spd: 5.2, range: 18, ranged: true, caster: true, school: 'frost', weak: 'storm', resist: 'frost', scale: 1.05, aggro: 13, social: 12, ...U },
  // sea beasts
  stormgull: { name: 'Stormbeak Gull', kind: 'harpy', hpM: .8, dmgM: .95, spd: 6.6, range: 2.2, weak: 'earth', resist: 'storm', scale: .85, aggro: 9, social: 6, fly: .8, ...B },
  shoreserpent: { name: 'Shore Serpent', kind: 'leviathan', hpM: 1.2, dmgM: 1.1, spd: 5.8, range: 3, weak: 'storm', resist: 'frost', scale: .16, aggro: 9, social: 4, ...B },
  // wreckers: living pirates who light false lamps and the Gravelord pays for what washes up
  wrecker: { name: 'Wrecker Cutthroat', kind: 'pirate0', hpM: 1, dmgM: 1.05, spd: 5.6, range: 2.2, weak: 'frost', resist: null, scale: 1, aggro: 12, social: 14, ...HU },
  wreckerlamp: { name: 'Wrecker Lamplighter', kind: 'pirate1', hpM: .85, dmgM: .9, spd: 5.4, range: 18, ranged: true, caster: true, school: 'fire', weak: 'frost', resist: 'fire', scale: 1, aggro: 14, social: 14, ...HU },
  wreckerbrute: { name: 'Wrecker Bruiser', kind: 'pirate2', hpM: 1.25, dmgM: 1.1, spd: 5.2, range: 2.4, weak: 'storm', resist: null, scale: 1.15, aggro: 12, social: 14, ...HU },
  // the tide cult and what they call up
  tidesworn: { name: 'Tide-Sworn Acolyte', kind: 'cultist0', hpM: 1, dmgM: 1, spd: 5.4, range: 2.2, weak: 'fire', resist: 'frost', scale: 1, aggro: 12, social: 14, ...HU },
  tidechanter: { name: 'Tide Chanter', kind: 'cultist1', hpM: .9, dmgM: .85, spd: 5.2, range: 18, ranged: true, caster: true, healer: true, school: 'frost', weak: 'fire', resist: 'frost', scale: 1, aggro: 13, social: 14, ...HU },
  brineling: { name: 'Brine Elemental', kind: 'waterpet', hpM: 1.15, dmgM: 1, spd: 5, range: 2.4, weak: 'storm', resist: 'frost', scale: 1.15, aggro: 10, social: 10 },
  // night and storm
  tidewight: { name: 'Tide Wight', kind: 'ghost', hpM: 1, dmgM: 1.1, spd: 5.8, range: 2.4, weak: 'holy', resist: 'frost', scale: 1.1, aggro: 12, social: 12, ...U },
  stormdrowned: { name: 'Storm-Risen Sailor', kind: 'drowned0', hpM: 1.1, dmgM: 1.1, spd: 5.6, range: 2.4, weak: 'storm', resist: 'frost', scale: 1.05, aggro: 13, social: 14, ...U },
  // roaming rares
  osserylord: { name: 'Captain Ossery Hale', kind: 'admiral', hpM: 1.7, dmgM: 1.1, spd: 5.4, range: 2.6, weak: 'storm', resist: 'frost', scale: 1.15, aggro: 14, social: 20, ...U, mechs: ['cleave', 'call'], adds: 'navymarine' },
  lanternjack: { name: 'Lantern Jack', kind: 'pirate1', hpM: 1.6, dmgM: 1.1, spd: 5.6, range: 18, ranged: true, caster: true, school: 'fire', weak: 'frost', resist: 'fire', scale: 1.2, aggro: 15, social: 20, ...HU, mechs: ['pool', 'volley'] },
  shrike: { name: 'Shrike of the Squall', kind: 'harpynamed', hpM: 1.6, dmgM: 1.1, spd: 6.4, range: 2.6, weak: 'earth', resist: 'storm', scale: 1.15, aggro: 14, social: 20, fly: .8, ...B, mechs: ['charge', 'fear'] },
  paleabbess: { name: 'The Pale Abbess', kind: 'cultist2', hpM: 1.7, dmgM: 1.05, spd: 5.2, range: 18, ranged: true, caster: true, school: 'frost', weak: 'fire', resist: 'frost', scale: 1.2, aggro: 15, social: 20, ...HU, mechs: ['heal', 'pool', 'call'], adds: 'tidesworn' },
  // the Wreckers' Teeth (10-11)
  gullet: { name: 'Mad Gullet', kind: 'pirate2', hpM: 1.1, dmgM: 1.05, spd: 5.4, range: 2.8, weak: 'storm', resist: null, scale: 1.45, aggro: 14, social: 20, ...HU, mechs: ['cleave', 'charge'],
    lines: { start: "Fresh cargo! Gullet LOVES fresh cargo!", half: 'Gullet is NOT having a good day!' } },
  lampjack: { name: 'Lamplighter Fenwick', kind: 'pirate1', hpM: .95, dmgM: 1, spd: 5.2, range: 20, ranged: true, caster: true, school: 'fire', weak: 'frost', resist: 'fire', scale: 1.3, aggro: 16, social: 20, ...HU, mechs: ['pool', 'volley'],
    lines: { start: "Every lamp I light is a ship on the rocks by morning. You're just a small ship.", half: 'More oil! MORE OIL!' } },
  saltmother: { name: 'Grandmother Salt', kind: 'smuggler', hpM: 1, dmgM: .95, spd: 5, range: 2.4, weak: 'frost', resist: null, scale: 1.3, aggro: 14, social: 20, ...HU, mechs: ['heal', 'call', 'pool'], adds: 'wrecker',
    lines: { start: "I keep the ledgers, dearie. And you, I'm afraid, are a debit.", half: 'Boys! Grandmother needs you!' } },
  blackhallow: { name: 'Morrigan Blackhallow, the Wreck-Queen', kind: 'captain', hpM: 1.7, dmgM: 1.05, spd: 5.4, range: 2.8, weak: 'storm', resist: null, scale: 1.45, aggro: 15, social: 30, ...HU, mechs: ['cleave', 'call', 'charge', 'enrage'], adds: 'wreckerbrute',
    lines: { start: "The dead man pays a crown for every sailor who drowns on my rocks. Do you know how many crowns that is? Neither do I. I stopped counting.", half: 'All hands! Light every lamp on the Teeth!' } },
  // the Tidewater Shrine (11-12)
  deepmaw: { name: 'Deepmaw', kind: 'crabbig', hpM: 1.2, dmgM: 1.05, spd: 4.8, range: 3, weak: 'storm', resist: 'frost', scale: 1.7, aggro: 14, social: 20, ...B, mechs: ['slam', 'shield'],
    lines: { start: '*The rocks by the causeway stand up. They were never rocks.*', half: '*Deepmaw pulls into its shell, grinding.*' } },
  lagoonwyrm: { name: 'The Lagoon Serpent', kind: 'leviathan', hpM: 1.1, dmgM: 1.05, spd: 5.6, range: 3.4, weak: 'storm', resist: 'frost', scale: .3, aggro: 14, social: 20, ...B, mechs: ['pool', 'knock', 'charge'],
    lines: { start: '*The lagoon boils, and something long and pale comes up out of it.*', half: '*It thrashes, and salt spray hides the sun.*' } },
  undertow: { name: 'Sister Undertow', kind: 'cultist2', hpM: 1, dmgM: 1, spd: 5.2, range: 18, ranged: true, caster: true, healer: true, school: 'frost', weak: 'fire', resist: 'frost', scale: 1.3, aggro: 15, social: 20, ...HU, mechs: ['heal', 'fear', 'call'], adds: 'tidesworn',
    lines: { start: "The tide takes everything back in the end. I'm only helping it along.", half: 'Sisters! Drag them under!' } },
  calloway: { name: 'Hierophant Calloway Drift', kind: 'cultist2', hpM: 1.6, dmgM: 1, spd: 5.2, range: 18, ranged: true, caster: true, school: 'frost', weak: 'fire', resist: 'frost', scale: 1.5, aggro: 16, social: 30, ...HU, mechs: ['pool', 'spawn', 'fear', 'enrage'], adds: 'brineling',
    lines: { start: 'The keepers light their little lamps against the dark. We are the dark. We are the tide that comes in under the door.', half: 'Rise, brine! Rise and fill their lungs!' } },
  // the Brine Vaults (13-14)
  rusk: { name: 'Quartermaster Rusk', kind: 'drowned0', hpM: 1.1, dmgM: 1.05, spd: 5.2, range: 3, weak: 'storm', resist: 'frost', scale: 1.6, aggro: 14, social: 20, ...U, mechs: ['cleave', 'call'], adds: 'navymarine',
    lines: { start: 'Requisition denied. Requisition denied. REQUISITION DENIED.', half: 'All hands to the armory!' } },
  chainwarden: { name: 'The Chainwarden', kind: 'abom', hpM: 1.15, dmgM: 1.05, spd: 4.8, range: 3.6, weak: 'fire', resist: 'frost', scale: 1.35, aggro: 14, social: 20, ...U, mechs: ['knock', 'web', 'slam'],
    lines: { start: '*Chains drag across the flooded floor, and something enormous drags with them.*', half: '*It wraps its chains around its fists.*' } },
  powdernell: { name: 'Powder Nell', kind: 'drowned1', hpM: 1, dmgM: 1.05, spd: 5, range: 20, ranged: true, caster: true, school: 'fire', weak: 'frost', resist: 'fire', scale: 1.5, aggro: 16, social: 20, ...U, mechs: ['pool', 'volley'],
    lines: { start: "Wet powder, they said. Can't fire wet powder, they said. Well. I've had a hundred years to dry it.", half: 'Fire in the hole! Fire in ALL the holes!' } },
  barnacle: { name: 'The Barnacle Hulk', kind: 'golempet', hpM: 1.25, dmgM: 1.1, spd: 4.6, range: 3, weak: 'storm', resist: 'earth', scale: 2.1, aggro: 14, social: 20, mechs: ['slam', 'shield', 'enrage'],
    lines: { start: '*A wall of barnacles shudders, and a fist the size of a door swings out of it.*', half: '*Its shell cracks, and seawater pours out.*' } },
  vey: { name: 'Commodore Sabine Vey', kind: 'admiral', hpM: 1.7, dmgM: 1.05, spd: 5.4, range: 2.8, weak: 'storm', resist: 'frost', scale: 1.35, aggro: 16, social: 30, ...U, mechs: ['cleave', 'call', 'charge', 'enrage'], adds: 'navyofficer',
    lines: { start: 'I kept the Admiralty\'s vaults for forty years alive and a hundred dead. The master needs ships. These are his ships now.', half: 'Officers! Form on me!' } },
  // the Bonewhale Grotto (14-15)
  ribcrawler: { name: 'The Ribcrawler', kind: 'crabbig', hpM: 1.2, dmgM: 1.05, spd: 5, range: 3, weak: 'storm', resist: 'frost', scale: 2.1, aggro: 14, social: 20, ...B, mechs: ['slam', 'spawn'], adds: 'crab',
    lines: { start: '*Something the size of a cart scuttles out from between the ribs.*', half: '*Little crabs pour out of its shell.*' } },
  vashh: { name: 'Eelking Vashh', kind: 'leviathan', hpM: 1.15, dmgM: 1.1, spd: 5.8, range: 3.6, weak: 'storm', resist: 'frost', scale: .38, aggro: 14, social: 20, ...B, mechs: ['charge', 'knock', 'pool'],
    lines: { start: '*The pool at the heart of the grotto goes very still. Then it explodes.*', half: '*Vashh coils, crackling with stolen lightning.*' } },
  shrikemother: { name: 'Shrikemother', kind: 'harpynamed', hpM: 1.1, dmgM: 1.05, spd: 6, range: 2.6, weak: 'earth', resist: 'storm', scale: 1.7, aggro: 14, social: 20, fly: .9, ...B, mechs: ['fear', 'spawn', 'charge'], adds: 'stormgull',
    lines: { start: '*Shrieks echo off the ribs from every direction at once.*', half: '*The whole roost takes wing.*' } },
  hollowwhale: { name: 'The Hollow Leviathan', kind: 'leviathan', hpM: 1.7, dmgM: 1.05, spd: 4.4, range: 5, weak: 'storm', resist: 'frost', scale: .55, aggro: 16, social: 30, ...U, mechs: ['slam', 'pool', 'spawn', 'enrage'], adds: 'shoreserpent',
    lines: { start: '*The whale\'s skull turns. There is a light inside it, green and cold, and it has been waiting a hundred years.*', half: '*The bones groan. The whole grotto groans with them.*' } },
});
Object.assign(DBOSSES, { teeth: ['gullet', 'lampjack', 'saltmother', 'blackhallow'], shrine: ['deepmaw', 'lagoonwyrm', 'undertow', 'calloway'],
  brinevaults: ['rusk', 'chainwarden', 'powdernell', 'barnacle', 'vey'], bonewhale: ['ribcrawler', 'vashh', 'shrikemother', 'hollowwhale'] });
FINALS.push('blackhallow', 'calloway', 'vey', 'hollowwhale');
Object.assign(MOB_LORE, {
  navymarine: 'A marine of the old navy, drowned in the last battle of the summoner wars and called back up by the Gravelord. He still salutes.',
  navyofficer: 'A drowned lieutenant. She gives orders in a voice like water going down a drain, and the marines obey.',
  stormgull: 'A gull grown huge and mean on storm-wind. It will steal your lunch and then come back for your eyes.',
  shoreserpent: 'A sea serpent that hunts the shallows. It can cross a beach faster than you can.',
  wrecker: 'A wrecker. On stormy nights they light false lamps on the rocks, and in the morning they pick over what washes in.',
  wreckerlamp: 'A wrecker lamplighter, who throws burning oil as easily as she lights a lamp.', wreckerbrute: 'A big wrecker who drags cargo off the rocks. And people.',
  tidesworn: 'An acolyte of the tide cult, who pray to the drowned dead and want very much to join them.', tidechanter: 'A tide chanter. Her songs heal her friends and pull the breath out of her enemies.',
  brineling: 'A knot of living seawater, called up by the tide cult. It smells of low tide.', tidewight: 'A wight that walks out of the sea at night and back into it before dawn.',
  stormdrowned: 'A sailor the storm has thrown back up onto the shore, still fighting a battle that ended a century ago.',
});

// ---------- the coast grows ----------
coastHooks.build.push(({ rng, put2, inTown }) => {
  const items = [], put = (geo, x, z, ry = 0, s = 1) => items.push({ geo, m: mat4(x, hgt(x, z), z, ry, s) });
  const solid = (x, z, w, d, ry = 0) => { const c = Math.cos(ry), s = Math.sin(ry), pt = (lx, lz) => [x + lx * c + lz * s, z - lx * s + lz * c]; const k = [pt(-w / 2, -d / 2), pt(w / 2, -d / 2), pt(w / 2, d / 2), pt(-w / 2, d / 2)]; for (let i = 0; i < 4; i++) addWall(k[i][0], k[i][1], k[(i + 1) % 4][0], k[(i + 1) % 4][1], .3); };
  const round = (x, z, r) => { for (let k = 0; k < 10; k++) { const a = k / 10 * TAU, b = (k + 1) / 10 * TAU; addWall(x + Math.cos(a) * r, z + Math.sin(a) * r, x + Math.cos(b) * r, z + Math.sin(b) * r, .3); } };
  const house = (x, z, ry, o = {}) => { const cols = [['#d8cdb5', '#8a4a32'], ['#cfc2a8', '#3a4a6a'], ['#e0d4b8', '#5a6a3a']][Math.floor(rng() * 3)]; put(houseGeo({ wall: cols[0], roof: cols[1], ...o }), x, z, ry); solid(x, z, o.w || 6, o.d || 5, ry); };
  // the Greywatch Light and the keepers' cottages
  const L = C6.light, Hm = C6.hamlet;
  put(lighthouseGeo(), L.x, L.z); round(L.x, L.z, 4.2);
  house(L.x - 7, L.z + 4, Math.PI / 2, { w: 6, d: 5, wall: '#f0ece0', roof: '#b83a32' });
  house(Hm.x - 6, Hm.z - 6, .4, { w: 6, d: 5 }); house(Hm.x + 4, Hm.z + 8, Math.PI + .2, { w: 6, d: 5, floors: 2, h: 5.2 }); house(Hm.x - 9, Hm.z + 7, 2.2, { w: 5.5, d: 5 });
  put(nets(), Hm.x + 6, Hm.z - 4, .6); put(boat(), Hm.x + 9, Hm.z + 1, 1.2); put(crates(), Hm.x - 2, Hm.z - 9, .3);
  for (const [dx, dz] of [[0, -10], [-12, 0], [10, 10], [4, -3]]) put(lamp(), Hm.x + dx, Hm.z + dz);
  // Crookwater: shacks and tents of the smugglers and the families they took in
  const C = C6.crook;
  for (const [dx, dz, r, kind] of [[-14, -8, .5, 'h'], [-18, 6, 1.6, 'h'], [-6, 18, 3, 'h'], [12, 16, 3.8, 's'], [18, 2, 4.6, 's'], [-8, -18, 0, 's'], [4, -20, -.3, 'h'], [20, -12, -.9, 'h']]) {
    const x = C.x + dx, z = C.z + dz;
    if (kind === 'h') house(x, z, r, { w: 5.5, d: 4.6, h: 3, wall: pick(['#b8a888', '#a8987a', '#c4b494']), roof: pick(['#5a4a3a', '#4a5a4a', '#6a4a3a']), chimney: rng() < .6 });
    else { put(shack(), x, z, r); solid(x, z, 3.6, 3, r); }
  }
  for (const [dx, dz] of [[-2, 10], [2, 13], [-24, -4], [-22, 14], [8, 24], [24, -2]]) put(tent(pick(['#a89a7a', '#8a9a8a', '#9a8a7a', '#b8a080'])), C.x + dx, C.z + dz, rng() * TAU);
  put(stall('#7a3a2a'), C.x + 6, C.z - 5, .2); put(stall('#3a5a3a'), C.x - 5, C.z - 4, -.3); put(crates(), C.x + 9, C.z - 8, .6); put(crates(), C.x - 12, C.z + 2, 2.2);
  put(fence(8), C.x - 20, C.z + 20, .7); put(nets(), C.x + 14, C.z + 8, -.4);
  for (const [dx, dz] of [[0, 0], [-10, 10], [10, -12], [-16, -14], [16, 10]]) put(lamp(), C.x + dx, C.z + dz);
  campVisual(C.x + 1, hgt(C.x + 1, C.z + 6), C.z + 6, 'human', rng);
  // the Wreckers' Teeth: shacks, cargo, false lights, and wrecks on the rocks
  const W = C6.teeth;
  for (const [dx, dz, r] of [[-14, -6, .4], [-10, 10, 1.4], [-2, -14, -.2], [4, 12, 2.6], [-18, 2, 1.2]]) { put(shack(pick(['#5a4a3a', '#6b5a42', '#4a4038'])), W.x + dx, W.z + dz, r); solid(W.x + dx, W.z + dz, 3.6, 3, r); }
  for (const [dx, dz] of [[10, -10], [14, 6], [6, 18], [-4, 0]]) put(signalFire(), W.x + dx, W.z + dz);
  for (const [dx, dz] of [[2, -4], [-8, 4], [-12, -12]]) put(crates(), W.x + dx, W.z + dz, rng() * TAU);
  for (const [dx, dz, r] of [[24, -14, .7], [30, 8, 2.2], [20, 26, 3.6]]) items.push({ geo: CO.wreckGeo(), m: mat4(W.x + dx, -1.2, W.z + dz, r) });
  for (const [dx, dz, s] of [[34, -6, 1], [38, 14, 1.3], [28, 30, .9], [42, -20, 1.1], [26, -26, .8]]) items.push({ geo: spire(), m: mat4(W.x + dx, -1, W.z + dz, rng() * TAU, s) });
  // the Tidewater Shrine: a broken temple on its island, standing stones round the shore
  const S2 = C6.shrine;
  put(brokenDome(), S2.x, S2.z); round(S2.x, S2.z, 1.4);
  for (let k = 0; k < 12; k++) { const a = k / 12 * TAU; if (Math.abs(a - Math.PI / 2) < .3) continue; put(standing(), S2.x + Math.cos(a) * (S2.R + 1.5), S2.z + Math.sin(a) * (S2.R + 1.5), -a); }
  for (let k = 0; k < 6; k++) put(pillarGeo(2 + rng() * 2), S2.x + (rng() < .5 ? -1.6 : 1.6), S2.z + 10 + k * 3.8);
  // the Brine Vaults' bastion and the Bonewhale Grotto's ribs
  put(bastion(), C6.vaults.x, C6.vaults.z, Math.PI / 2); solid(C6.vaults.x - 2, C6.vaults.z, 6, 12);
  put(ribs(), C6.grotto.x, C6.grotto.z, Math.PI);
  meshWithOutline(mergeBuilt(items), .05);
  // ---------- places, towns, doors ----------
  const towns = [
    { key: 'light', name: 'The Greywatch Light', x: Hm.x, z: Hm.z, R: Hm.R, guardName: 'Lightkeeper Warden',
      npcs: [['giver', 'hale', 3, -2], ['giver', 'brannagh', -3, 3], ['vendor', 'light', 8, 4], ['bind', null, 0, 6]], guards: [[12, -4], [-12, 4]] },
    { key: 'crook', name: 'Crookwater', x: C.x, z: C.z, R: C.R, guardName: 'Hollow Lookout',
      npcs: [['giver', 'ketchmor', 2, -2], ['giver', 'tamsy', -4, 6], ['giver', 'oldwyn', 8, 6], ['vendor', 'crook', 6, -7], ['bind', null, -2, 2]], guards: [[18, -20], [24, -14]] },
  ];
  world.towns.push(...towns);
  world.places.push({ name: 'The Greywatch Light', x: Hm.x + 10, z: Hm.z - 8, R: 26, kind: 'town' }, { name: 'Crookwater', x: C.x, z: C.z, R: C.R + 2, kind: 'town' },
    { name: "The Wreckers' Teeth", x: W.x, z: W.z, R: W.R + 6, kind: 'dungeon' }, { name: 'The Tidewater Shrine', x: S2.x, z: S2.z, R: S2.R, kind: 'dungeon' },
    { name: 'The Brine Vaults', x: C6.vaults.x, z: C6.vaults.z, R: 10, kind: 'dungeon' }, { name: 'The Bonewhale Grotto', x: C6.grotto.x, z: C6.grotto.z, R: 10, kind: 'dungeon' });
  world.clearSpots.push(...[Hm, L, C, W].map(s => ({ x: s.x, z: s.z, r: s.R + 4 })), { x: S2.x, z: S2.z, r: S2.R + 3 }, { x: C6.vaults.x, z: C6.vaults.z, r: 12 }, { x: C6.grotto.x, z: C6.grotto.z + 6, r: 16 });
  Object.assign(world.spots, { light: { x: L.x, z: L.z }, crook: { x: C.x, z: C.z }, teeth: { x: W.x, z: W.z }, shrine: { x: S2.x, z: S2.z }, vaults: { x: C6.vaults.x, z: C6.vaults.z }, grotto: { x: C6.grotto.x, z: C6.grotto.z },
    downs: { x: -300, z: -40 }, headland: { x: -220, z: -200 }, southshore: { x: -230, z: 160 }, lamp: { x: L.x, z: L.z, r: 7 } });
  world.zoneLines.push({ x: C6.vaults.x + 2, z: C6.vaults.z, r: 3, to: 'brinevaults', label: 'Enter the Brine Vaults' }, { x: C6.grotto.x, z: C6.grotto.z - 3, r: 3, to: 'bonewhale', label: 'Enter the Bonewhale Grotto' });
  zoneMarker(C6.vaults.x + 3, C6.vaults.z, -Math.PI / 2); zoneMarker(C6.grotto.x, C6.grotto.z - 4, Math.PI);
  world.mapLabels.push({ t: 'Drowned navy, gulls (10-12)', x: -230, z: -190 }, { t: 'Wreckers, serpents (10-12)', x: -260, z: 180 }, { t: 'Tide cult (12-14)', x: -320, z: -40 });
  // regions
  world.regionNames.push('The Greywatch Headland', 'Crookwater Hollow', 'The Salt Downs');
  const prevR = world.regionFn;
  world.regionFn = (x, z) => { const r = prevR(x, z); if (r !== 0) return r; if (z < -150) return 6; if (z > 150) return 7; if (x < -262) return 8; return 0; };
  // ---------- enemies ----------
  const away = p => !world.clearSpots.some(c => Math.hypot(c.x - p.x, c.z - p.z) < c.r + 6) && !inTown(p) && !world.towns.some(t => Math.hypot(t.x - p.x, t.z - p.z) < t.R + 12);
  world.spawns = world.spawns.filter(s => away(s) || s.mine6);
  const sp = world.spawns, put6 = o => { sp.push({ ...o, mine6: true, alive: null, timer: 0, y: hgt(o.x, o.z) }); };
  const road = p => p.x < -200 && Math.abs(p.z) < 34;   // the road in from the Vale stays clear
  const land = (x0, x1, z0, z1, ok = () => true) => { for (let i = 0; i < 300; i++) { const p = { x: x0 + rng() * (x1 - x0), z: z0 + rng() * (z1 - z0) }; const h = hgt(p.x, p.z); if (h > 1 && h < 9 && away(p) && !road(p) && ok(p) && !sp.some(s => Math.hypot(s.x - p.x, s.z - p.z) < 9)) return p; } return null; };
  const shoreline = p => depthAt(p.x + 10, p.z) > .3 || depthAt(p.x - 10, p.z) > .3 || depthAt(p.x, p.z + 10) > .3 || depthAt(p.x, p.z - 10) > .3;
  // the headland (10-12): the drowned navy crawling up the beaches, gulls, serpents in the shallows
  for (let i = 0; i < 22; i++) { const p = land(-300, -150, -400, -150); if (p) put6({ ...p, mob: pick(['navymarine', 'navymarine', 'navyofficer', 'stormgull', 'shoreserpent']), lvl: [10, 12], respawn: 60, area: 6 }); }
  // the south shore and Crookwater's approaches (10-12): wreckers' gangs, crabs, serpents
  for (let i = 0; i < 8; i++) { const p = land(-300, -160, 140, 330, q => Math.hypot(q.x - W.x, q.z - W.z) > 50); if (!p) continue; world.camps.push({ x: p.x, z: p.z, kind: 'pirate' });
    for (let k = 0; k < 3; k++) { const a = k / 3 * TAU; put6({ x: p.x + Math.cos(a) * 3, z: p.z + Math.sin(a) * 3, mob: ['wrecker', 'wreckerlamp', 'wreckerbrute'][k], lvl: [10, 12], respawn: 70, camp: 'wk' + i, area: 7 }); } }
  for (let i = 0; i < 12; i++) { const p = land(-320, -150, 140, 390, shoreline); if (p) put6({ ...p, mob: pick(['crab', 'shoreserpent', 'stormgull']), lvl: [10, 12], respawn: 55, area: 7 }); }
  // the Salt Downs (12-14): the tide cult's camps and what they call up
  for (let i = 0; i < 6; i++) { const p = land(-400, -270, -150, 150); if (!p) continue; world.camps.push({ x: p.x, z: p.z, kind: 'cult' }); campVisual(p.x, hgt(p.x, p.z), p.z, 'human', rng);
    for (let k = 0; k < 4; k++) { const a = k / 4 * TAU; put6({ x: p.x + Math.cos(a) * 3.5, z: p.z + Math.sin(a) * 3.5, mob: ['tidesworn', 'tidechanter', 'tidesworn', 'brineling'][k], lvl: [12, 14], respawn: 75, camp: 'tc' + i, area: 8 }); } }
  for (let i = 0; i < 14; i++) { const p = land(-405, -265, -150, 150); if (p) put6({ ...p, mob: pick(['brineling', 'navymarine', 'stormgull']), lvl: [12, 14], respawn: 60, area: 8 }); }
  // night tides: wights walk out of the sea after dark and back in before dawn
  const night = () => isNight();
  for (let i = 0; i < 14; i++) { const p = land(-330, -150, -400, 400, shoreline); if (p) put6({ ...p, mob: 'tidewight', lvl: p.z < -150 ? [11, 12] : p.z > 150 ? [11, 12] : [13, 14], respawn: 40, area: p.z < -150 ? 6 : p.z > 150 ? 7 : 8, when: night }); }
  // storms: the drowned come ashore in waves
  const storm = () => !!world.storm;
  for (let i = 0; i < 16; i++) { const p = land(-260, -150, -380, 380, shoreline); if (p) put6({ ...p, mob: 'stormdrowned', lvl: p.z < -150 || p.z > 150 ? [11, 12] : [12, 14], respawn: 25, area: p.z < -150 ? 6 : p.z > 150 ? 7 : 0, when: storm }); }
  // roaming rares: two by day, two that only come out at night
  { const p = land(-260, -170, -330, -200) || { x: -220, z: -220 }; put6({ ...p, mob: 'osserylord', lvl: [11, 11], respawn: 420, area: 6, named: 'osserylord', when: night }); }
  { const p = land(-300, -200, 260, 340) || { x: -260, z: 300 }; put6({ ...p, mob: 'lanternjack', lvl: [11, 11], respawn: 360, area: 7, named: 'lanternjack' }); }
  { const p = land(-280, -200, -150, -60) || { x: -240, z: -100 }; put6({ ...p, mob: 'shrike', lvl: [13, 13], respawn: 420, area: 8, named: 'shrike' }); }
  { const p = land(-400, -330, 40, 140) || { x: -360, z: 100 }; put6({ ...p, mob: 'paleabbess', lvl: [14, 14], respawn: 480, area: 8, named: 'paleabbess', when: night }); }
  // the Wreckers' Teeth (10-11, open): gangs round the fires, four bosses
  for (const [dx, dz, i] of [[-6, -8, 0], [-12, 4, 1], [0, 6, 2], [8, -4, 3], [-16, -12, 4], [12, 12, 5]]) for (let k = 0; k < 3; k++) put6({ x: W.x + dx + (k % 2) * 2, z: W.z + dz + (k > 1 ? 2 : 0), mob: ['wrecker', 'wreckerlamp', 'wreckerbrute'][k], lvl: [10, 11], respawn: 240, camp: 'tt' + i, area: 7, dungeon: true });
  put6({ x: W.x - 14, z: W.z - 2, mob: 'gullet', lvl: [10, 10], respawn: 900, named: 'gullet', area: 7, dungeon: true, boss2: true });
  put6({ x: W.x + 12, z: W.z - 12, mob: 'lampjack', lvl: [10, 10], respawn: 900, named: 'lampjack', area: 7, dungeon: true, boss2: true });
  put6({ x: W.x + 2, z: W.z + 16, mob: 'saltmother', lvl: [11, 11], respawn: 900, named: 'saltmother', area: 7, dungeon: true, boss2: true });
  put6({ x: W.x + 16, z: W.z + 2, mob: 'blackhallow', lvl: [11, 11], respawn: 1200, named: 'blackhallow', area: 7, dungeon: true, boss: true });
  // the Tidewater Shrine (11-12, open): cult camps round the shore and on the causeway, four bosses
  for (const [dx, dz, i] of [[-24, 10, 0], [24, 10, 1], [-22, -16, 2], [22, -16, 3], [0, 26, 4], [0, 16, 5]]) for (let k = 0; k < 3; k++) put6({ x: S2.x + dx + (k % 2) * 2, z: S2.z + dz + (k > 1 ? 2 : 0), mob: ['tidesworn', 'tidechanter', 'brineling'][k], lvl: [11, 12], respawn: 240, camp: 'ts' + i, area: 8, dungeon: true });
  put6({ x: S2.x - 30, z: S2.z - 4, mob: 'deepmaw', lvl: [11, 11], respawn: 900, named: 'deepmaw', area: 8, dungeon: true, boss2: true });
  put6({ x: S2.x + 30, z: S2.z - 4, mob: 'lagoonwyrm', lvl: [11, 11], respawn: 900, named: 'lagoonwyrm', area: 8, dungeon: true, boss2: true });
  put6({ x: S2.x, z: S2.z + 8, mob: 'undertow', lvl: [12, 12], respawn: 900, named: 'undertow', area: 8, dungeon: true, boss2: true });
  put6({ x: S2.x, z: S2.z - 3, mob: 'calloway', lvl: [12, 12], respawn: 1200, named: 'calloway', area: 8, dungeon: true, boss: true });
  world.huntAreas.push({ area: 6, lvl: [10, 12] }, { area: 7, lvl: [10, 12] }, { area: 8, lvl: [12, 14] });
});

// ---------- the instanced dungeons ----------
const lanternGeo = () => build([P(T(Box(.12, 2.6, .12), 0, 1.3), 0, O, '#3a3a40'), P(T(Box(.4, .5, .4), 0, 2.7), 0, O, '#5ad8c8', 1.6)]);
const cannon = () => build([P(T(Box(1.4, .6, 2), 0, .3), 0, O, '#4a3322'), P(T(Cyl(.32, .4, 2.6, 8), 0, .9, .4, Math.PI / 2), 0, O, '#2a2a30')]);
const barnacles = () => build([...[0, 1, 2, 3, 4].map(k => P(T(Dod(.6 + (k % 3) * .3), Math.cos(k * 1.3) * 1.2, .4, Math.sin(k * 1.3) * 1.2), 0, O, k % 2 ? '#7a8a7a' : '#9aa89a'))]);
const rib = () => build([P(T(Cyl(.45, .55, 9, 6), -3, 4, 0, 0, 0, .35), 0, O, '#e8e0cc'), P(T(Cyl(.45, .55, 9, 6), 3, 4, 0, 0, 0, -.35), 0, O, '#e8e0cc')]);
registerZone('brinevaults', seed => {
  world.names = { zone: 'The Brine Vaults', town: 'the Brine Vaults' };
  return buildInstance(seed, {
    name: 'The Brine Vaults', floor: '#4a5a5e', rock: '#263236', walls: true, fog: '#10202a', light: .5, exitTo: 'coast', exitLabel: 'Back out to the Salt Downs',
    rects: [[-8, 52, 8, 74], [-3, 36, 3, 52], [-22, 14, 22, 36], [-44, 18, -22, 26], [-64, 0, -44, 40], [22, 18, 44, 26], [44, 0, 64, 40], [-3, -4, 3, 14], [-26, -36, 26, -4], [-3, -46, 3, -36], [-18, -78, 18, -46]],
    doors: [[0, 52], [0, 36], [-22, 22], [-44, 22], [22, 22], [44, 22], [0, 14], [0, -4], [0, -36], [0, -46]],
    props: [[-16, 32, cannon], [16, 32, cannon], [-16, 18, cannon], [16, 18, cannon], [-58, 36, barnacles], [58, 4, barnacles], [-20, -8, () => pillarGeo(5)], [20, -8, () => pillarGeo(5)], [-20, -32, () => pillarGeo(5)], [20, -32, () => pillarGeo(5)],
      [-5, 62, lanternGeo], [5, 62, lanternGeo], [-12, -62, lanternGeo], [12, -62, lanternGeo], [-54, 20, lanternGeo], [54, 20, lanternGeo]],
    packs: [[-4, 60, ['navymarine', 'navymarine'], [13, 13]], [-10, 28, ['navymarine', 'navyofficer', 'navymarine'], [13, 13]], [10, 20, ['navyofficer', 'navymarine', 'brineling'], [13, 13]],
      [-54, 32, ['navymarine', 'brineling', 'navyofficer'], [13, 14]], [-54, 8, ['navymarine', 'navymarine', 'navyofficer'], [13, 14]], [54, 32, ['brineling', 'brineling', 'navyofficer'], [13, 14]], [54, 8, ['navymarine', 'navyofficer', 'navymarine'], [13, 14]],
      [-14, -12, ['navyofficer', 'navymarine', 'brineling'], [14, 14]], [14, -12, ['navymarine', 'navyofficer', 'navymarine'], [14, 14]], [-12, -28, ['brineling', 'navymarine', 'navyofficer'], [14, 14]], [12, -28, ['navyofficer', 'navyofficer', 'navymarine'], [14, 14]]],
    bosses: [[0, 24, 'rusk', 13], [-54, 20, 'chainwarden', 13], [54, 20, 'powdernell', 13], [0, -20, 'barnacle', 14], [0, -64, 'vey', 14, true]],
  });
});
registerZone('bonewhale', seed => {
  world.names = { zone: 'The Bonewhale Grotto', town: 'the Bonewhale Grotto' };
  return buildInstance(seed, {
    name: 'The Bonewhale Grotto', floor: '#6a6458', rock: '#3a3632', walls: false, fog: '#0e1a22', light: .55, exitTo: 'coast', exitLabel: 'Back out to the south shore',
    rects: [[-8, 52, 8, 74], [-4, 34, 4, 52], [-30, 6, 12, 34], [12, 16, 36, 24], [36, -14, 64, 38], [46, -36, 54, -14], [16, -70, 66, -36], [-8, -56, 16, -48], [-46, -80, -8, -26]],
    doors: [[0, 52], [0, 34], [12, 20], [36, 20], [50, -14], [50, -36], [16, -52], [-8, -52]],
    props: [[0, 44, rib], [0, 38, rib], [-10, 20, rib], [24, 20, rib], [50, -24, rib], [6, -52, rib], [-4, 60, lanternGeo], [-22, 26, lanternGeo], [52, 30, lanternGeo], [40, -60, lanternGeo], [-28, -60, lanternGeo]],
    packs: [[-3, 62, ['crab', 'crab'], [14, 14]], [-20, 28, ['shoreserpent', 'crab', 'crab'], [14, 14]], [2, 14, ['crab', 'stormgull', 'shoreserpent'], [14, 14]],
      [44, 30, ['stormgull', 'stormgull', 'stormgull'], [14, 15]], [58, 14, ['stormgull', 'shoreserpent', 'stormgull'], [14, 15]], [42, -4, ['shoreserpent', 'shoreserpent'], [14, 15]],
      [26, -44, ['brineling', 'shoreserpent', 'brineling'], [15, 15]], [60, -60, ['crab', 'shoreserpent', 'brineling'], [15, 15]], [-16, -36, ['shoreserpent', 'brineling', 'crab'], [15, 15]], [-38, -46, ['brineling', 'shoreserpent', 'stormgull'], [15, 15]]],
    bosses: [[-18, 14, 'ribcrawler', 14], [54, 2, 'shrikemother', 14], [42, -56, 'vashh', 15], [-26, -66, 'hollowwhale', 15, true]],
  });
});

// ---------- weather: storms roll in off the sea ----------
// a storm every 8-14 minutes on the coast, lasting about three. Rain, dark skies, and the drowned on the beaches.
let stormT = 300 + Math.random() * 240, rain = null;
function makeRain() {
  const N = 900, pos = new Float32Array(N * 6);
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  rain = new THREE.LineSegments(g, new THREE.LineBasicMaterial({ color: '#b8c8d8', transparent: true, opacity: .45 }));
  rain.frustumCulled = false; scene.add(rain); rain.userData.seed = Array.from({ length: N }, () => [Math.random() * 60 - 30, Math.random() * 30, Math.random() * 60 - 30]);
}
X.tick.push(dt => {
  if (S.zone !== 'coast') { if (S.zone !== 'wastes') world.storm = false; return; }
  stormT -= dt;
  if (stormT <= 0) {
    world.storm = !world.storm; stormT = world.storm ? 160 + Math.random() * 60 : 480 + Math.random() * 360;
    chat('sys', null, world.storm ? 'Thunder rolls in off the sea. A storm is coming ashore, and something is coming with it.' : 'The storm blows itself out. The sea goes quiet.');
    if (world.storm) for (const p of S.fakes || []) if (p.fake && Math.random() < .25) { chat('gen', p.name, pick(['storm! drowned on every beach, careful', 'here comes the rain. and the dead. lovely', 'storm up, grouping on the south shore', 'anyone else get one-shot by a storm sailor lol'])); break; }
  }
});
// things that only walk at night or in a storm go back where they came from when it ends
let gateT = 0;
X.tick.push(dt => {
  if ((gateT -= dt) > 0) return; gateT = 2;
  for (const sp of world.spawns) {
    if (!sp.when || !sp.alive || sp.alive.dead || sp.alive.remove || sp.when()) continue;
    const m = sp.alive; if (m.engaged || m.threat?.size) continue;
    m.remove = true; m.dead = true; sp.alive = null; sp.timer = 5;
  }
});
X.light.push(dt => {
  const on = S.zone === 'coast' && world.storm;
  if (on && !rain) makeRain();
  if (!rain) return;
  rain.visible = on || rain.material.opacity > .02;
  rain.material.opacity += ((on ? .5 : 0) - rain.material.opacity) * Math.min(1, dt * .8);
  const k = rain.material.opacity / .5;
  if (k > .01) darken(k);   // darker skies and closer fog while it rains
  if (!rain.visible) return;
  const pos = rain.geometry.attributes.position, h = S.hero, t = S.time;
  rain.userData.seed.forEach((s, i) => { const y = (s[1] - t * 22 + 3000) % 30, x = h.x + s[0], z = h.z + s[2], gy = h.y; pos.setXYZ(i * 2, x, gy + y, z); pos.setXYZ(i * 2 + 1, x - .2, gy + y - 1.1, z + .1); });
  pos.needsUpdate = true;
});
function darken(k) {
  R.sun.intensity *= 1 - .55 * k; R.hemi.intensity *= 1 - .3 * k;
  R.scene.fog.color.lerp(new THREE.Color('#4a5662'), .7 * k); R.scene.fog.far = 250 - 120 * k;
  R.skyMat.uniforms.top.value.lerp(new THREE.Color('#2a323c'), .8 * k); R.skyMat.uniforms.mid.value.lerp(new THREE.Color('#4a5662'), .8 * k); R.skyMat.uniforms.hor.value.lerp(new THREE.Color('#5a6670'), .8 * k);
}
// the Greywatch lamp turns all night long
let beam = null;
X.zone.push(zone => {
  if (beam) { beam.parent?.remove(beam); beam = null; }
  if (zone !== 'coast') return;
  const g = new THREE.ConeGeometry(4, 60, 16, 1, true); g.translate(0, -30, 0); g.rotateZ(Math.PI / 2);
  beam = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color: '#fff2a0', transparent: true, opacity: .14, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending }));
  beam.position.set(C6.light.x, hgt(C6.light.x, C6.light.z) + 18.6, C6.light.z); worldGroup.add(beam);
});
X.light.push(dt => { if (!beam) return; beam.rotation.y += dt * .6; const n = isNight() ? 1 : world.storm ? .8 : .15; beam.material.opacity += (n * .16 - beam.material.opacity) * Math.min(1, dt); });
