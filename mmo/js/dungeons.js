// Build 5: the Vale's four new dungeons.
// Out on the new ground beyond the old edges: Varro's Keep (the bandit king, open-world, 4-6) on the far western Kingsroad,
// the Blighted Grove (open-world, 4-6) deep in the wood, and two instanced dungeons in the far Waste:
// the Choir Catacombs and the Mines under the Waste (8-10). Each has its own quest chain and 4-5 bosses.
import * as THREE from './three.js';
import { WH, TAU } from './core.js';
import { world, H, HN, hgt, addWall, valeHooks, mat4, meshWithOutline, mergeBuilt, campVisual, registerZone, zoneMarker, linkDoors, ruinWallGeo, pillarGeo } from './world.js';
import { groundMesh } from './zones.js';
import * as M from './models.js';
import { build, P, T, Box, Cyl, Cone, Sph, Oct, Dod } from './models.js';
import { worldGroup } from './render.js';
import { MOBS, QUESTS, GIVERS, xpNeed } from './data.js';
import { LORE } from './story.js';
import { TALK } from './dialogue.js';
const O = [0, 0, 0];

// ---------- where they are (Vale coordinates; the Vale is 840 wide since Build 5) ----------
export const DSITES = {
  keep: { x: -352, z: -26, R: 27 },
  grove: { x: 150, z: 352, R: 34 },
  cata: { x: -300, z: -332 },      // the catacombs' door in the Waste
  mines: { x: 300, z: -336 },      // the mine head in the Waste
};
// instanced dungeons: where you come out in the Vale, and what they're called
export const INSTANCES = {
  fleet: { parent: 'coast' },
  catacombs: { parent: 'vale', out: { x: DSITES.cata.x + 1, z: DSITES.cata.z + 7 }, name: 'The Choir Catacombs' },
  mines: { parent: 'vale', out: { x: DSITES.mines.x + 1, z: DSITES.mines.z + 8 }, name: 'The Mines under the Waste' },
};

// ---------- enemies ----------
const H2 = { human: true }, U = { undead: true }, B = { beast: true };
Object.assign(MOBS, {
  // Varro's Keep (4-6)
  keepguard: { name: 'Gilt Sworn', kind: 'bandit2', hpM: 1, dmgM: 1.05, spd: 5.6, range: 2.2, weak: 'frost', resist: null, scale: 1.05, aggro: 12, social: 14, ...H2 },
  keepthug: { name: 'Gilt Bruiser', kind: 'bandit', hpM: 1.2, dmgM: 1.1, spd: 5.4, range: 2.4, weak: 'storm', resist: null, scale: 1.15, aggro: 12, social: 14, ...H2 },
  keepxbow: { name: 'Gilt Crossbow', kind: 'xbow', hpM: .85, dmgM: .95, spd: 5.4, range: 22, ranged: true, weak: 'earth', resist: null, scale: 1, aggro: 15, social: 14, ...H2 },
  keephound: { name: 'Keep Mastiff', kind: 'wolf', hpM: .9, dmgM: 1, spd: 6.4, range: 2.2, weak: 'fire', resist: null, scale: 1.15, aggro: 10, social: 12, ...B },
  brask: { name: 'Gatemaster Brask', kind: 'bandit2', hpM: 1, dmgM: 1, spd: 5.4, range: 2.8, weak: 'frost', resist: null, scale: 1.4, aggro: 14, social: 20, ...H2, mechs: ['cleave', 'call'], adds: 'keepguard',
    lines: { start: "Gate's shut, friend. Toll's your life.", half: 'Lads! To the gate!' } },
  dregg: { name: 'Kennelmaster Dregg', kind: 'bandit', hpM: .9, dmgM: 1, spd: 5.6, range: 2.4, weak: 'storm', resist: null, scale: 1.3, aggro: 14, social: 20, ...H2, mechs: ['hounds', 'charge'], adds: 'keephound',
    lines: { start: 'Dinner time, my darlings!', half: 'Fetch! FETCH!' } },
  moll: { name: 'Old Moll', kind: 'villager1', hpM: 1.1, dmgM: .9, spd: 5, range: 2.4, weak: 'frost', resist: 'fire', scale: 1.35, aggro: 12, social: 20, ...H2, mechs: ['pool', 'heal'],
    lines: { start: "Nobody leaves my kitchen hungry. Nobody leaves my kitchen at all.", half: 'Mind the grease, dearie!' } },
  kettle: { name: 'Sergeant Kettle', kind: 'xbow', hpM: .9, dmgM: 1, spd: 5.2, range: 24, ranged: true, weak: 'earth', resist: null, scale: 1.35, aggro: 16, social: 20, ...H2, mechs: ['volley', 'knock'],
    lines: { start: 'Volley on my mark! Mark! Mark! Oh, just shoot them!', half: 'Reload! RELOAD!' } },
  varro: { name: 'Varro Gilt, the Bandit King', kind: 'captain', hpM: 1.7, dmgM: 1.05, spd: 5.4, range: 2.8, weak: 'storm', resist: null, scale: 1.45, aggro: 15, social: 30, ...H2, mechs: ['cleave', 'call', 'charge', 'enrage'], adds: 'keepthug',
    lines: { start: 'You know what the Choir pays for a fresh body? More than you, apparently.', half: 'Guards! A crown for whoever brings me their heads!' } },
  // the Blighted Grove (4-6)
  rotwolf: { name: 'Blighted Wolf', kind: 'wolf', hpM: 1, dmgM: 1, spd: 6.2, range: 2.2, weak: 'fire', resist: 'shadow', scale: 1.1, aggro: 10, social: 10, ...B },
  rotboar: { name: 'Rotting Boar', kind: 'boar', hpM: 1.15, dmgM: 1.05, spd: 6, range: 2.2, weak: 'fire', resist: null, scale: 1.15, aggro: 9, social: 8, ...B },
  thornling: { name: 'Thornling', kind: 'spider', hpM: .8, dmgM: .95, spd: 6.4, range: 2.2, weak: 'fire', resist: 'earth', scale: .85, aggro: 10, social: 10, ...B },
  blightsprite: { name: 'Blight Sprite', kind: 'wasp', hpM: .75, dmgM: .9, spd: 6.6, range: 2, weak: 'frost', resist: 'earth', scale: 1.5, aggro: 9, social: 6, fly: 1.2 },
  blightbear: { name: 'Blight-Sick Bear', kind: 'bear', hpM: 1.45, dmgM: 1.15, spd: 5.4, range: 2.6, weak: 'fire', resist: 'frost', scale: 1.1, aggro: 8, social: 4, ...B },
  rotfang: { name: 'Rotfang', kind: 'wolf', hpM: 1, dmgM: 1.05, spd: 6.6, range: 2.8, weak: 'fire', resist: 'shadow', scale: 1.8, aggro: 14, social: 20, ...B, mechs: ['charge', 'cleave'],
    lines: { start: '*Rotfang howls, and the whole grove howls with him.*', half: '*The great wolf tears at the earth, frothing black.*' } },
  thornmother: { name: 'The Thornmother', kind: 'spider', hpM: 1.05, dmgM: 1, spd: 5.6, range: 2.8, weak: 'fire', resist: 'earth', scale: 2.1, aggro: 14, social: 20, ...B, mechs: ['spawn', 'web', 'pool'], adds: 'thornling',
    lines: { start: '*The Thornmother rises from her nest of briars.*', half: '*Her brood boils out of the roots.*' } },
  mossgut: { name: 'Mossgut', kind: 'troll', hpM: 1.15, dmgM: 1.05, spd: 5.2, range: 3.2, weak: 'fire', resist: 'frost', scale: 1.45, aggro: 14, social: 20, mechs: ['slam', 'heal'],
    lines: { start: 'Mossgut was sleeping. Mossgut is NOT sleeping now.', half: 'Mossgut eat moss. Moss make Mossgut better. Watch.' } },
  syra: { name: 'Blightcaller Syra', kind: 'cultist2', hpM: 1.6, dmgM: 1, spd: 5.2, range: 18, ranged: true, caster: true, school: 'nature', weak: 'fire', resist: 'nature', scale: 1.35, aggro: 16, social: 30, ...H2, mechs: ['pool', 'spawn', 'fear', 'enrage'], adds: 'rotwolf',
    lines: { start: 'The Gravelord showed me what the wood could be. Rot is only a kind of growing.', half: 'Grow, my darlings. Grow over them.' } },
  // the Choir Catacombs (8-10)
  catacult: { name: 'Choir Gravetender', kind: 'cultist0', hpM: 1, dmgM: 1.05, spd: 5.4, range: 2.2, weak: 'holy', resist: 'shadow', scale: 1.05, aggro: 12, social: 14, ...H2 },
  catachant: { name: 'Choir Dirge-Singer', kind: 'cultist1', hpM: .9, dmgM: .85, spd: 5.2, range: 18, ranged: true, caster: true, healer: true, school: 'shadow', weak: 'holy', resist: 'shadow', scale: 1, aggro: 13, social: 14, ...H2 },
  catabone: { name: 'Catacomb Bones', kind: 'skeleton', hpM: 1.05, dmgM: 1.05, spd: 5.4, range: 2.4, weak: 'earth', resist: 'frost', scale: 1.05, aggro: 11, social: 12, ...U },
  cataghoul: { name: 'Crypt Ghoul', kind: 'ghoul', hpM: 1.1, dmgM: 1.1, spd: 6, range: 2.2, weak: 'fire', resist: 'earth', scale: 1.05, aggro: 11, social: 12, ...U },
  catawraith: { name: 'Hymn Wraith', kind: 'wraith', hpM: .9, dmgM: 1, spd: 5.4, range: 18, ranged: true, caster: true, weak: 'storm', resist: 'frost', scale: 1, aggro: 12, social: 12, ...U, fly: .4 },
  ulric: { name: 'Bonewarden Ulric', kind: 'skeleton', hpM: 1.1, dmgM: 1.05, spd: 5.2, range: 3, weak: 'earth', resist: 'frost', scale: 1.7, aggro: 14, social: 20, ...U, mechs: ['cleave', 'shield'],
    lines: { start: 'I guarded the Watch dead for two hundred years. I guard the Choir\'s dead now. The work is the same.', half: 'Bone to bone. Wall to wall.' } },
  wail: { name: 'Sister Wail', kind: 'ghost', hpM: 1, dmgM: 1, spd: 5, range: 2.6, weak: 'holy', resist: 'frost', scale: 1.7, aggro: 14, social: 20, ...U, mechs: ['fear', 'pool'],
    lines: { start: 'Sing with me. Sing with me forever.', half: '*Her scream shakes dust from the vaults.*' } },
  ossuarist: { name: 'The Ossuarist', kind: 'ghoul', hpM: 1.1, dmgM: 1.1, spd: 5.4, range: 2.8, weak: 'fire', resist: 'earth', scale: 1.7, aggro: 14, social: 20, ...U, mechs: ['spawn', 'slam'], adds: 'catabone',
    lines: { start: 'Such lovely bones. Hold still. I only need the long ones.', half: 'Up, my collection! Up and dance!' } },
  vess: { name: 'Archdeacon Vess', kind: 'cultist2', hpM: 1.05, dmgM: 1, spd: 5.2, range: 18, ranged: true, caster: true, school: 'shadow', weak: 'holy', resist: 'shadow', scale: 1.35, aggro: 15, social: 25, ...H2, mechs: ['heal', 'pool', 'call'], adds: 'catacult',
    lines: { start: 'Mortlake was a deacon. I am an ARCHdeacon. The difference is about to become very clear.', half: 'Choir! Raise your voices!' } },
  seln: { name: 'Archcantor Seln', kind: 'wraith', hpM: 1, dmgM: 1, spd: 5.2, range: 18, ranged: true, caster: true, weak: 'storm', resist: 'frost', scale: 2.1, aggro: 16, social: 30, ...U, fly: .5, mechs: ['pool', 'fear', 'spawn', 'enrage'], adds: 'catawraith',
    lines: { start: 'The last hymn of the war was never finished. Lend me your voices, and I will finish it.', half: 'Sing, my wraiths! Sing them down into the dark!' } },
  // the Mines under the Waste (8-10)
  minedead: { name: 'Dead Miner', kind: 'skeleton', hpM: 1.05, dmgM: 1.05, spd: 5.2, range: 2.4, weak: 'earth', resist: 'frost', scale: 1.05, aggro: 11, social: 12, ...U },
  minebrute: { name: 'Tusk Thrall', kind: 'brute', hpM: 1.2, dmgM: 1.1, spd: 5.4, range: 2.6, weak: 'frost', resist: 'fire', scale: 1.15, aggro: 12, social: 14 },
  minespider: { name: 'Deep Crawler', kind: 'spider', hpM: 1, dmgM: 1.05, spd: 6.2, range: 2.2, weak: 'fire', resist: 'shadow', scale: 1.25, aggro: 10, social: 10, ...B },
  slagling: { name: 'Slagling', kind: 'golempet', hpM: 1.15, dmgM: 1, spd: 5, range: 2.4, weak: 'frost', resist: 'fire', scale: 1.1, aggro: 10, social: 12, ore: true },
  grisk: { name: 'Foreman Grisk', kind: 'brute', hpM: 1.1, dmgM: 1.05, spd: 5.4, range: 3, weak: 'frost', resist: 'fire', scale: 1.55, aggro: 14, social: 20, mechs: ['slam', 'call'], adds: 'minebrute',
    lines: { start: 'Back to WORK! Oh. You don\'t work here. Then you\'re ore.', half: 'Shift change! Everybody in!' } },
  tunnelqueen: { name: 'The Tunnel Queen', kind: 'spider', hpM: 1.1, dmgM: 1.05, spd: 5.6, range: 3, weak: 'fire', resist: 'shadow', scale: 2.3, aggro: 14, social: 20, ...B, mechs: ['spawn', 'web', 'charge'], adds: 'minespider',
    lines: { start: '*Something enormous unfolds from the ceiling.*', half: '*The walls crawl.*' } },
  slag: { name: 'The Living Slag', kind: 'golempet', hpM: 1.2, dmgM: 1.1, spd: 4.6, range: 3, weak: 'frost', resist: 'fire', school: 'fire', scale: 2.3, aggro: 14, social: 20, ore: true, mechs: ['pool', 'slam', 'enrage'],
    lines: { start: '*The pit of molten slag heaves itself upright.*', half: '*It glows white-hot.*' } },
  korr: { name: 'Deepwarden Korr', kind: 'abom', hpM: 1, dmgM: 1, spd: 5, range: 3.6, weak: 'fire', resist: 'earth', scale: 1.7, aggro: 16, social: 30, ...U, mechs: ['cleave', 'slam', 'spawn', 'enrage'], adds: 'minedead',
    lines: { start: 'Dig, they told me. Dig for the bones of the war. I dug so deep I forgot how to stop.', half: 'Miners! The shift is never over!' } },
});
// boss rosters for quests and loot: which tier each boss's loot belongs to
export const DBOSSES = {
  keep: ['brask', 'dregg', 'moll', 'kettle', 'varro'], grove: ['rotfang', 'thornmother', 'mossgut', 'syra'],
  catacombs: ['ulric', 'wail', 'ossuarist', 'vess', 'seln'], mines: ['grisk', 'tunnelqueen', 'slag', 'korr'],
};
export const FINALS = ['varro', 'syra', 'seln', 'korr'];
export const dungeonOf = k => Object.keys(DBOSSES).find(d => DBOSSES[d].includes(k));

// ---------- static models ----------
const keepHallGeo = () => build([P(T(Box(16, 6, 11), 0, 3), 0, O, '#6e665c'), P(T(Box(16.6, .5, 11.6), 0, 6.2), 0, O, '#55504a'),
  P(T(Cone(10.5, 4, 4), 0, 8.4, 0, 0, Math.PI / 4, 0, 1, 1, .72), 0, O, '#7a2a20'), P(T(Box(3, 3.6, .3), 0, 1.8, 5.6), 0, O, '#2a1f16'),
  ...[-6, 6].map(x => P(T(Box(1.2, 2.2, .2), x, 3.6, 5.6), 0, O, '#2a2a30')), P(T(Box(.15, 2.6, .15), 0, 7.6, 5.4), 0, O, '#4a3322'), P(T(Box(1.6, 1, .05), .8, 8.4, 5.4), 0, O, '#d8b24a')]);
const banner = c => build([P(T(Cyl(.08, .08, 4.5, 5), 0, 2.25), 0, O, '#4a3322'), P(T(Box(1.1, 1.6, .05), .55, 3.6), 0, O, c)]);
const cryptDoorGeo = () => build([P(T(Box(7, 5.5, 4.5), 0, 2.75), 0, O, '#5e5966'), P(T(Cone(5, 2.4, 4), 0, 6.7, 0, 0, Math.PI / 4, 0, 1, 1, .7), 0, O, '#4a4652'),
  P(T(Box(2.4, 3.4, .3), 0, 1.7, 2.3), 0, O, '#0b0a0e'), ...[-2.6, 2.6].map(x => P(T(Cyl(.3, .35, 5.6, 6), x, 2.8, 2.3), 0, O, '#6f6a72')), P(T(Oct(.4), 0, 4.6, 2.4), 0, O, '#8dff5a', 2)]);
const mineHeadGeo = () => build([P(T(Dod(5), 0, 2.4, -1.5, 0, 0, 0, 1.4, .9, 1), 0, O, '#5e5a64'), P(T(Box(3.4, 3.4, 1), 0, 1.7, 2.6), 0, O, '#0b0a0e'),
  ...[-1.9, 1.9].map(x => P(T(Box(.4, 3.8, .4), x, 1.9, 3.1), 0, O, '#5a3e28')), P(T(Box(4.4, .45, .5), 0, 3.9, 3.1), 0, O, '#5a3e28'),
  P(T(Box(1.4, .9, 2), 3.6, .45, 4.4), 0, O, '#6b4a2e'), P(T(Dod(.6), 3.6, 1.1, 4.4), 0, O, '#9a8a70'), ...[-1, 1].map(s => P(T(Box(.12, .12, 7), s * .5, .06, 6.5), 0, O, '#4a4a50'))]);
const hutGeo = () => build([P(T(Box(3, 2.2, 3), 0, 1.1), 0, O, '#7a6448'), P(T(Cone(2.6, 1.6, 4), 0, 3, 0, 0, Math.PI / 4), 0, O, '#5a6a3a')]);
const supportGeo = () => build([...[-1.8, 1.8].map(x => P(T(Box(.35, 4, .35), x, 2), 0, O, '#5a3e28')), P(T(Box(4.2, .4, .45), 0, 4.1), 0, O, '#5a3e28')]);
const lanternGeo = () => build([P(T(Box(.12, 2.6, .12), 0, 1.3), 0, O, '#3a3a40'), P(T(Box(.4, .5, .4), 0, 2.7), 0, O, '#ffcf6a', 1.6)]);

// ---------- the Vale: flatten the sites, then build them ----------
const smooth = t => t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t);
function flatten(c, r) {
  const base = hgt(c.x, c.z), R = r + 14;
  for (let zi = Math.max(0, Math.floor(c.z - R + WH)); zi <= Math.min(HN - 1, Math.ceil(c.z + R + WH)); zi++)
    for (let xi = Math.max(0, Math.floor(c.x - R + WH)); xi <= Math.min(HN - 1, Math.ceil(c.x + R + WH)); xi++) {
      const d = Math.hypot(xi - WH - c.x, zi - WH - c.z), i = zi * HN + xi; H[i] = base + (H[i] - base) * smooth((d - r) / 14);
    }
}
const prevT = valeHooks.terrain, prevB = valeHooks.build;
valeHooks.terrain = a => {
  if (prevT) prevT(a);
  flatten(DSITES.keep, DSITES.keep.R + 4); flatten(DSITES.grove, DSITES.grove.R); flatten(DSITES.cata, 10); flatten(DSITES.mines, 10);
  Object.assign(world.spots, { keep: { x: DSITES.keep.x, z: DSITES.keep.z }, grove: { x: DSITES.grove.x, z: DSITES.grove.z }, cata: { ...DSITES.cata }, mines: { ...DSITES.mines },
    keepcamp: { x: DSITES.keep.x + 44, z: DSITES.keep.z + 8 }, grovecamp: { x: DSITES.grove.x - 6, z: DSITES.grove.z - 48 } });
};
valeHooks.build = a => {
  if (prevB) prevB(a);
  const { rng, put } = a, items = [], yAt = (x, z) => hgt(x, z);
  const place = (geo, x, z, ry = 0, s = 1) => items.push({ geo, m: mat4(x, yAt(x, z), z, ry, s) });
  const npc = (key, x, z, o = {}) => world.storyNpcs.push({ key, x, z, ...o });
  const RS = 300, BOSS = 600;   // slow respawns in the open-world dungeons
  // ----- Varro's Keep: a walled fort, its gate facing east toward the town -----
  { const k = DSITES.keep, R = k.R, segs = 26; world.clearSpots.push({ x: k.x, z: k.z, r: R + 4 });
    for (let s = 0; s < segs; s++) {
      const ang = s / segs * TAU; if (Math.abs(Math.atan2(Math.sin(ang), Math.cos(ang))) < .17) continue; // the gate (east)
      const a1 = ang - TAU / segs / 2, a3 = ang + TAU / segs / 2, len = 2 * R * Math.sin(TAU / segs / 2) + .3;
      items.push({ geo: ruinWallGeo(len, 4.2), m: mat4(k.x + Math.cos(ang) * R, yAt(k.x + Math.cos(ang) * R, k.z + Math.sin(ang) * R), k.z + Math.sin(ang) * R, -ang - Math.PI / 2) });
      addWall(k.x + Math.cos(a1) * R, k.z + Math.sin(a1) * R, k.x + Math.cos(a3) * R, k.z + Math.sin(a3) * R, .7);
    }
    for (const dz of [-4.5, 4.5]) place(M.towerGeo('human'), k.x + R + 1, k.z + dz, 0, .8);
    const hx = k.x - 12, hz = k.z; place(keepHallGeo(), hx, hz, -Math.PI / 2, 1);
    // the hall's walls, its door facing east
    addWall(hx - 5.5, hz - 8, hx - 5.5, hz + 8, .5); addWall(hx + 5.5, hz - 8, hx + 5.5, hz - 1.8, .5); addWall(hx + 5.5, hz + 1.8, hx + 5.5, hz + 8, .5);
    addWall(hx - 5.5, hz - 8, hx + 5.5, hz - 8, .5); addWall(hx - 5.5, hz + 8, hx + 5.5, hz + 8, .5);
    for (const [dx, dz] of [[10, -14], [10, 14], [-4, 18], [-4, -18]]) place(banner('#d8b24a'), k.x + dx, k.z + dz, rng() * 6, 1);
    campVisual(k.x + 6, yAt(k.x + 6, k.z - 14), k.z - 14, 'human', rng); campVisual(k.x + 6, yAt(k.x + 6, k.z + 14), k.z + 14, 'human', rng);
    world.doors.push({ x: k.x + R, z: k.z }, { x: hx + 5.5, z: hz }, { x: hx + 9, z: hz });
    world.extraPlaces.push({ name: "Varro's Keep", x: k.x, z: k.z, R: R + 2, kind: 'dungeon' });
    // the yard: sworn, bruisers, crossbows and dogs; then the four lieutenants and the king in his hall
    const packs = [[14, -6], [14, 7], [4, -16], [4, 16], [0, 0], [-2, -10], [-2, 10], [18, 0]];
    packs.forEach(([dx, dz], i) => { for (let j = 0; j < 3; j++) put({ x: k.x + dx + (j % 2) * 2, z: k.z + dz + (j > 1 ? 2 : 0), mob: ['keepguard', 'keepthug', 'keepxbow', 'keephound'][(i + j) % 4], lvl: [4, 6], respawn: RS, camp: 'kp' + i, area: 1, dungeon: true }); });
    put({ x: k.x + R - 5, z: k.z, mob: 'brask', lvl: [5, 5], respawn: BOSS, named: 'brask', area: 1, dungeon: true, boss2: true });
    put({ x: k.x + 2, z: k.z - 20, mob: 'dregg', lvl: [5, 5], respawn: BOSS, named: 'dregg', area: 1, dungeon: true, boss2: true });
    put({ x: k.x + 2, z: k.z + 20, mob: 'moll', lvl: [5, 5], respawn: BOSS, named: 'moll', area: 1, dungeon: true, boss2: true });
    put({ x: hx + 8, z: hz + 3, mob: 'kettle', lvl: [6, 6], respawn: BOSS, named: 'kettle', area: 1, dungeon: true, boss2: true });
    put({ x: hx - 2, z: hz, mob: 'varro', lvl: [6, 6], respawn: BOSS, named: 'varro', area: 1, dungeon: true, boss2: true });
    // Lieutenant Dace's camp outside, east along the road
    const c = world.spots.keepcamp; campVisual(c.x, yAt(c.x, c.z), c.z, 'human', rng); world.clearSpots.push({ x: c.x, z: c.z, r: 9 });
    npc('dace', c.x + 2, c.z + 3, { yaw: -Math.PI / 2 });
    world.props.push({ id: 'p' + world.props.length, kind: 'lorebook', tag: 'lore', name: 'An old page', lore: 'giltletter', x: hx - 3, z: hz + 4, yaw: 0, scale: 1 });
  }
  // ----- the Blighted Grove: dead trees in a ring, the rot thickest at the heart -----
  { const g = DSITES.grove, R = g.R; world.clearSpots.push({ x: g.x, z: g.z, r: R - 4 });
    const dg = M.deadGeo();
    for (let i = 0; i < 90; i++) { const ang = rng() * TAU, d = R - 6 + rng() * 14; if (Math.abs(Math.atan2(Math.sin(ang + Math.PI / 2), Math.cos(ang + Math.PI / 2))) < .22) continue; place(dg, g.x + Math.cos(ang) * d, g.z + Math.sin(ang) * d, rng() * 6, 1.3 + rng() * .9); }
    for (let i = 0; i < 26; i++) { const ang = rng() * TAU, d = rng() * (R - 8); place(dg, g.x + Math.cos(ang) * d, g.z + Math.sin(ang) * d, rng() * 6, .9 + rng() * .8); }
    for (let i = 0; i < 18; i++) { const ang = rng() * TAU, d = rng() * R; place(build([P(T(Sph(.9, 6, 4), 0, .3, 0, 0, 0, 0, 1, .45, 1), 0, O, '#5a3a5a'), P(T(Sph(.35, 5, 4), .5, .6), 0, O, '#8a5a9a', .8)]), g.x + Math.cos(ang) * d, g.z + Math.sin(ang) * d, 0, 1 + rng()); }
    // the rot stains the ground
    const geo = world.ground.geometry, pos = geo.attributes.position, col = geo.attributes.color, rot = new THREE.Color('#4a3a40');
    for (let i = 0; i < pos.count; i++) { const d = Math.hypot(pos.getX(i) - g.x, pos.getZ(i) - g.z); if (d > R + 16) continue; const t = 1 - smooth((d - R + 6) / 22) * 1; const c0 = new THREE.Color(col.getX(i), col.getY(i), col.getZ(i)).lerp(rot, .75 * t); col.setXYZ(i, c0.r, c0.g, c0.b); }
    col.needsUpdate = true;
    world.extraPlaces.push({ name: 'The Blighted Grove', x: g.x, z: g.z, R, kind: 'dungeon' });
    const kinds = ['rotwolf', 'rotboar', 'thornling', 'blightsprite', 'blightbear'];
    for (let i = 0; i < 9; i++) { const ang = i / 9 * TAU + .3, d = 9 + (i % 3) * 7; for (let j = 0; j < 2 + (i % 2); j++) put({ x: g.x + Math.cos(ang) * d + j * 1.8, z: g.z + Math.sin(ang) * d + (j % 2) * 1.6, mob: kinds[(i + j) % 5], lvl: [4, 6], respawn: RS, camp: 'gv' + i, area: 2, dungeon: true }); }
    put({ x: g.x - 14, z: g.z - 12, mob: 'rotfang', lvl: [5, 5], respawn: BOSS, named: 'rotfang', area: 2, dungeon: true, boss2: true });
    put({ x: g.x + 16, z: g.z + 4, mob: 'thornmother', lvl: [5, 5], respawn: BOSS, named: 'thornmother', area: 2, dungeon: true, boss2: true });
    put({ x: g.x - 12, z: g.z + 16, mob: 'mossgut', lvl: [6, 6], respawn: BOSS, named: 'mossgut', area: 2, dungeon: true, boss2: true });
    put({ x: g.x, z: g.z + 4, mob: 'syra', lvl: [6, 6], respawn: BOSS, named: 'syra', area: 2, dungeon: true, boss2: true });
    const c = world.spots.grovecamp; place(hutGeo(), c.x - 4, c.z - 3, .4, 1); world.clearSpots.push({ x: c.x, z: c.z, r: 8 });
    npc('fenna', c.x + 1, c.z + 2, { yaw: Math.PI });
    world.props.push({ id: 'p' + world.props.length, kind: 'lorebook', tag: 'lore', name: 'An old page', lore: 'blightnotes', x: g.x + 3, z: g.z + 7, yaw: 0, scale: 1 });
  }
  // ----- the two instanced dungeons' doors in the far Waste -----
  { const c = DSITES.cata; place(cryptDoorGeo(), c.x, c.z, 0, 1); addWall(c.x - 3.5, c.z - 2.2, c.x + 3.5, c.z - 2.2, 1.2, true);
    world.zoneLines.push({ x: c.x, z: c.z + 3.4, r: 2.4, to: 'catacombs', label: 'Enter the Choir Catacombs (8-10)' });
    world.extraPlaces.push({ name: 'The Choir Catacombs', x: c.x, z: c.z, R: 8, kind: 'dungeon' }); world.clearSpots.push({ x: c.x, z: c.z, r: 9 });
    place(lanternGeo(), c.x - 4, c.z + 4); place(lanternGeo(), c.x + 4, c.z + 4);
    npc('ottoline', c.x + 5, c.z + 8, { yaw: Math.PI }); }
  { const c = DSITES.mines; place(mineHeadGeo(), c.x, c.z, 0, 1); addWall(c.x - 4, c.z - 1, c.x + 4, c.z - 1, 2, true);
    world.zoneLines.push({ x: c.x, z: c.z + 3.6, r: 2.4, to: 'mines', label: 'Enter the Mines under the Waste (8-10)' });
    world.extraPlaces.push({ name: 'The Mines under the Waste', x: c.x, z: c.z, R: 8, kind: 'dungeon' }); world.clearSpots.push({ x: c.x, z: c.z, r: 9 });
    place(lanternGeo(), c.x - 3.5, c.z + 5); npc('hobb', c.x - 5, c.z + 8, { yaw: Math.PI }); }
  // a few wandering packs on the new outer ground, so it isn't empty
  for (let i = 0; i < 26; i++) {
    const p = a.tryPos(() => { const ang = rng() * TAU, d = 310 + rng() * 80; return { x: Math.cos(ang) * d, z: Math.sin(ang) * d }; }, p => Math.abs(p.x) < WH - 30 && Math.abs(p.z) < WH - 30 && !Object.values(DSITES).some(s => Math.hypot(s.x - p.x, s.z - p.z) < 55));
    if (!p) continue;
    const reg = (p.z < -100 - Math.abs(p.x) * .25) ? 3 : (p.z > 105 + Math.abs(p.x) * .15) ? 2 : 1;
    const [mob, lvl] = reg === 3 ? [rng() < .5 ? 'skeleton' : 'ghoul', [8, 10]] : reg === 2 ? [rng() < .5 ? 'brute' : 'bear', [6, 8]] : [rng() < .5 ? 'boar' : 'bear', [4, 6]];
    put({ x: p.x, z: p.z, mob, lvl, respawn: 90, area: reg });
  }
  meshWithOutline(mergeBuilt(items), .05);
  linkDoors();
};

// ---------- instanced dungeons: floor plans made of rooms and tunnels ----------
function buildInstance(seed, plan) {
  const C = 2;                              // the floor grid, in world units
  const inFloor = (x, z) => plan.rects.some(([x0, z0, x1, z1]) => x >= x0 && x <= x1 && z >= z0 && z <= z1);
  // heights: flat floor inside, a rock face rising outside
  for (let zi = 0; zi < HN; zi++) for (let xi = 0; xi < HN; xi++) {
    const x = xi - WH, z = zi - WH; let d = 99;
    if (Math.abs(x) < 90 && Math.abs(z) < 100) for (const [x0, z0, x1, z1] of plan.rects) { const dx = Math.max(x0 - x, 0, x - x1), dz = Math.max(z0 - z, 0, z - z1); d = Math.min(d, Math.hypot(dx, dz)); }
    H[zi * HN + xi] = d <= 0 ? 0 : Math.min(14, 2 + d * 3.5) + Math.sin(x * .7) * Math.cos(z * .6) * .8;
  }
  const floorC = new THREE.Color(plan.floor), rockC = new THREE.Color(plan.rock);
  groundMesh((x, z) => { const h = hgt(x, z); return floorC.clone().lerp(rockC, smooth(h / 3)).multiplyScalar(.85 + ((Math.sin(x * 1.7) * Math.cos(z * 1.3)) + 1) * .08); });
  // walls along every floor edge, merged into long straight runs
  const segs = [];
  const x0 = -90, z0 = -100, nx = 90, nz = 100;
  const fl = (i, j) => inFloor(x0 + i * C + C / 2, z0 + j * C + C / 2);
  for (let j = 0; j < nz; j++) { let run = null; for (let i = 0; i <= nx; i++) { const e = i < nx && fl(i, j) && !fl(i, j - 1); if (e && run === null) run = i; if (!e && run !== null) { segs.push([x0 + run * C, z0 + j * C, x0 + i * C, z0 + j * C]); run = null; } }
    run = null; for (let i = 0; i <= nx; i++) { const e = i < nx && fl(i, j) && !fl(i, j + 1); if (e && run === null) run = i; if (!e && run !== null) { segs.push([x0 + run * C, z0 + (j + 1) * C, x0 + i * C, z0 + (j + 1) * C]); run = null; } } }
  for (let i = 0; i < nx; i++) { let run = null; for (let j = 0; j <= nz; j++) { const e = j < nz && fl(i, j) && !fl(i - 1, j); if (e && run === null) run = j; if (!e && run !== null) { segs.push([x0 + i * C, z0 + run * C, x0 + i * C, z0 + j * C]); run = null; } }
    run = null; for (let j = 0; j <= nz; j++) { const e = j < nz && fl(i, j) && !fl(i + 1, j); if (e && run === null) run = j; if (!e && run !== null) { segs.push([x0 + (i + 1) * C, z0 + run * C, x0 + (i + 1) * C, z0 + j * C]); run = null; } } }
  const items = [];
  for (const [ax, az, bx, bz] of segs) {
    addWall(ax, az, bx, bz, .5);
    if (plan.walls) { const len = Math.hypot(bx - ax, bz - az), ry = Math.atan2(-(bz - az), bx - ax); items.push({ geo: ruinWallGeo(len + .4, 4.5), m: mat4((ax + bx) / 2, 0, (az + bz) / 2, ry) }); }
  }
  for (const [px, pz, geo, s] of plan.props || []) items.push({ geo: geo(), m: mat4(px, hgt(px, pz), pz, 0, s || 1) });
  if (items.length) meshWithOutline(mergeBuilt(items), .05);
  world.doors = plan.doors.map(([x, z]) => ({ x, z })); linkDoors();
  world.cave = { fog: plan.fog, light: plan.light };
  world.town = { x: 0, z: 64, R: 4 }; world.towns = [];
  world.regionNames = [plan.name]; world.regionFn = () => 0;
  world.places = [{ name: plan.name, x: 0, z: 0, R: 80, kind: 'dungeon' }];
  world.zoneLines.push({ x: 0, z: 70, r: 3.2, to: 'vale', label: 'Back up to the Waste' });
  zoneMarker(0, 71, 0);
  const sp = world.spawns, put = o => sp.push({ ...o, y: hgt(o.x, o.z), alive: null, timer: 0, respawn: 99999, area: 0, dungeon: true });
  for (const [x, z, list, lvl] of plan.packs) list.forEach((mob, k) => put({ x: x + (k % 2) * 2 - 1, z: z + Math.floor(k / 2) * 2, mob, lvl, camp: 'p' + x + z }));
  for (const [x, z, mob, lvl, fin] of plan.bosses) put({ x, z, mob, lvl: [lvl, lvl], named: mob, boss: !!fin, boss2: !fin });
  world.huntAreas = [];
  world.minimap = null;
  const xs = plan.rects.flatMap(r => [r[0], r[2]]), zs = plan.rects.flatMap(r => [r[1], r[3]]);
  world.mapBounds = { x0: Math.min(...xs) - 12, x1: Math.max(...xs) + 12, z0: Math.min(...zs) - 12, z1: Math.max(...zs) + 12 };
  return world;
}
registerZone('catacombs', seed => {
  world.names = { zone: 'The Choir Catacombs', town: 'the Choir Catacombs' };
  return buildInstance(seed, {
    name: 'The Choir Catacombs', floor: '#57525a', rock: '#2e2a32', walls: true, fog: '#16141c', light: .45,
    rects: [[-8, 50, 8, 74], [-3, 36, 3, 50], [-20, 12, 20, 36], [-36, 20, -20, 28], [-60, 2, -36, 40], [20, 20, 36, 28], [36, 2, 60, 40], [-3, -6, 3, 12], [-24, -40, 24, -6], [-3, -48, 3, -40], [-16, -76, 16, -48]],
    doors: [[0, 50], [0, 36], [0, 24], [-20, 24], [-36, 24], [20, 24], [36, 24], [0, 12], [0, -6], [0, -40], [0, -48]],
    props: [[-14, 30, () => pillarGeo(5)], [14, 30, () => pillarGeo(5)], [-14, 16, () => pillarGeo(5)], [14, 16, () => pillarGeo(5)], [-18, -12, () => pillarGeo(5.5)], [18, -12, () => pillarGeo(5.5)], [-18, -34, () => pillarGeo(5.5)], [18, -34, () => pillarGeo(5.5)],
      [-5, 60, lanternGeo], [5, 60, lanternGeo], [-10, -60, lanternGeo], [10, -60, lanternGeo]],
    packs: [[-4, 58, ['catacult', 'catabone'], [8, 9]], [-8, 28, ['catabone', 'cataghoul', 'catacult'], [8, 9]], [8, 20, ['catacult', 'catachant', 'catabone'], [8, 9]],
      [-48, 32, ['cataghoul', 'catabone', 'catachant'], [9, 9]], [-48, 10, ['catawraith', 'catabone', 'cataghoul'], [9, 9]], [48, 32, ['catabone', 'catabone', 'catachant'], [9, 9]], [48, 10, ['catawraith', 'cataghoul', 'catacult'], [9, 9]],
      [-12, -12, ['catacult', 'catachant', 'catawraith'], [9, 10]], [12, -12, ['catacult', 'catachant', 'cataghoul'], [9, 10]], [-10, -30, ['catawraith', 'catabone', 'catacult'], [9, 10]], [10, -30, ['catachant', 'catawraith', 'cataghoul'], [9, 10]]],
    bosses: [[0, 18, 'ulric', 9], [-50, 20, 'wail', 9], [50, 20, 'ossuarist', 9], [0, -26, 'vess', 10], [0, -64, 'seln', 10, true]],
  });
});
registerZone('mines', seed => {
  world.names = { zone: 'The Mines under the Waste', town: 'the Mines' };
  return buildInstance(seed, {
    name: 'The Mines under the Waste', floor: '#5a5248', rock: '#3a332e', walls: false, fog: '#1c1612', light: .5,
    rects: [[-8, 52, 8, 74], [-3, 34, 3, 52], [-26, 8, 10, 34], [10, 18, 34, 24], [34, -10, 62, 36], [44, -34, 50, -10], [20, -64, 64, -34], [-6, -52, 20, -46], [-40, -76, -6, -30]],
    doors: [[0, 52], [0, 34], [10, 21], [34, 21], [47, -10], [47, -34], [20, -49], [-6, -49]],
    props: [[0, 44, supportGeo], [0, 38, supportGeo], [20, 21, supportGeo], [47, -20, supportGeo], [6, -49, supportGeo], [-4, 60, lanternGeo], [-20, 20, lanternGeo], [50, 10, lanternGeo], [40, -50, lanternGeo], [-22, -54, lanternGeo]],
    packs: [[-3, 60, ['minedead', 'minedead'], [8, 9]], [-18, 26, ['minedead', 'minebrute', 'minedead'], [8, 9]], [2, 14, ['minebrute', 'minedead', 'slagling'], [8, 9]],
      [42, 28, ['minespider', 'minespider', 'minespider'], [9, 9]], [56, 14, ['minespider', 'minedead', 'minespider'], [9, 9]], [40, -2, ['minespider', 'minespider'], [9, 9]],
      [28, -42, ['slagling', 'minebrute', 'slagling'], [9, 10]], [58, -58, ['slagling', 'slagling', 'minedead'], [9, 10]], [-14, -38, ['minedead', 'minebrute', 'minedead'], [9, 10]], [-34, -44, ['minebrute', 'slagling', 'minedead'], [9, 10]]],
    bosses: [[-16, 16, 'grisk', 9], [52, 2, 'tunnelqueen', 9], [42, -54, 'slag', 10], [-24, -62, 'korr', 10, true]],
  });
});

// ---------- people ----------
Object.assign(GIVERS, {
  dace: { name: 'Lieutenant Dace', title: 'The Watch, west road', model: 'guard' },
  fenna: { name: 'Fenna Mosswhistle', title: 'Warden of the Wood', model: 'villager3' },
  ottoline: { name: 'Grave-Keeper Ottoline', title: 'Keeper of the catacomb door', model: 'villager1' },
  hobb: { name: 'Prospector Hobb', title: 'Late of the Ashdeep Mine', model: 'villager2' },
});
Object.assign(TALK, {
  dace: { bio: 'Lieutenant Dace of the Watch, sent out with six men to keep an eye on Varro\'s Keep. He is down to four men, two of whom are asleep.',
    greet: ["Keep your head down. Their crossbows can reach the road on a windy day, and every day out here is windy.", "If you're here about the keep, you're the best news I've had all week. Also the only news."],
    topics: [{ q: 'Who is Varro Gilt?', a: ['He calls himself the Bandit King. He used to be a smuggler with a nice smile and a bad habit. Then somebody started paying him in gold for every corpse he could deliver, and now he has a keep and a crown.'] },
      { q: 'Who pays for corpses?', a: ["That's the question, isn't it? The carts go east by night, toward the Waste. My money's on that choir of yours. The pale lot."] }] },
  fenna: { bio: 'Fenna Mosswhistle has walked the wood for forty years. She talks to the trees, and she swears that, lately, they have been talking back in a voice she does not like.',
    greet: ['Mind your step. The ground in there bites now.', "The wood is sick, friend. I can feel it in my teeth."],
    topics: [{ q: 'What happened to the grove?', a: ["A woman came in spring, robed in grey, singing. Where she sang, things rotted. Then the rotten things got up and kept walking.", "Her name was Syra. She was one of us once, a druid of the old grove. Now she calls the rot a kind of growing."] }] },
  ottoline: { bio: 'Ottoline has kept the door to the old catacombs for thirty years. She has never been inside. Lately, things inside have been trying to get out.',
    greet: ["That door's been locked since my grandmother's time. Somebody unlocked it from the inside.", 'Hear that? Singing. It comes up through the stones at night.'],
    topics: [{ q: 'What is down there?', a: ["The war dead. Rows and rows of them, laid down after the summoner wars, and the Watch dead before them. And now the Choir, singing to them all."] }] },
  hobb: { bio: 'Hobb dug iron in the Ashdeep Mine until the night the miners who had died there came back to work. He has not been underground since.',
    greet: ["Don't go down there. Or do. Honestly, somebody should.", 'Thirty years I worked that seam. Never once had a dead man ask me for a shovel.'],
    topics: [{ q: 'What happened in the mine?', a: ["We broke into an old tunnel. War tunnels, full of bones. Next morning, the foreman came out with grey eyes and told us to keep digging deeper. The ones who said no... well. They're still down there. Digging."] }] },
});
Object.assign(LORE, {
  giltletter: { title: "A Letter to the Bandit King", where: 'keep', text: "Varro. The last cart was short by six. I pay for the whole body, not the parts your dogs leave. Deliver to the Deacon's camp before the new moon, and see that your men keep their mouths shut. The Choir has a use for loose tongues too. It is signed with a single black thumbprint." },
  blightnotes: { title: "Syra's Growing Notes", where: 'grove', text: "Day 40. The oak by the spring has gone soft and grey and lovely. The wolves that ate from its roots no longer need to breathe. He was right. Death is not an ending. It is a kind of soil." },
  hymnal: { title: 'The Unfinished Hymn', where: 'catacombs', text: "The Choir's oldest hymnbook. The last page is a song begun on the final night of the summoner wars and never finished. The margin reads, in a newer hand: when the last verse is sung, every grave in the Vale will answer." },
  deepledger: { title: "The Deepwarden's Ledger", where: 'mines', text: "Bones raised this week: 212. Bones shipped south to the Choir: 180. Bones shipped east, to the coast, for the master's fleet: 32. The master says the sea will need many more." },
});

// ---------- the quest chains ----------
const qx = (lvl, f) => Math.round(xpNeed(Math.min(lvl, 19)) * f);
const KEEP_KILL = ['keepguard', 'keepthug', 'keepxbow', 'keephound'], GROVE_KILL = ['rotwolf', 'rotboar', 'thornling', 'blightsprite', 'blightbear'];
const CATA_KILL = ['catacult', 'catachant', 'catabone', 'cataghoul', 'catawraith'], MINE_KILL = ['minedead', 'minebrute', 'minespider', 'slagling'];
QUESTS.push(
  // Varro's Keep
  { id: 'dk1', giver: 'warden', turnTo: 'dace', lvl: 4, pre: 'm5', name: 'The King of the Kingsroad', xp: qx(4, .3), gold: 6, obj: { talk: true, what: "Find Lieutenant Dace's camp outside Varro's Keep, far to the west along the Kingsroad" },
    say: ["Those bone coins you found came from somewhere, and I think I know where. There's a fort out past the end of the western road, and a man in it who calls himself the Bandit King.", "His name is Varro Gilt. I sent Lieutenant Dace to watch him. Go and find Dace, and tell him I said to give you whatever you need."],
    done: [['dace', "Ilse sent you? Thank the Four. I asked her for twenty men, and she sent me one adventurer. Honestly, that might be better."]] },
  { id: 'dk2', giver: 'dace', lvl: 4, pre: 'dk1', name: 'Rats in the Walls', xp: qx(4, .45), gold: 8, obj: { kill: KEEP_KILL, n: 12, what: "Defeat 12 of Varro's sworn, bruisers, crossbows or mastiffs inside the keep" },
    say: ["Varro's yard is full of men he pays in other people's gold, and dogs he pays in other people's legs.", "Thin them out. Twelve should do it. Then the lieutenants will have to come out of hiding, and so will he."],
    done: ["Twelve! I watched through my spyglass and only fainted once. Good work."] },
  { id: 'dk3', giver: 'dace', lvl: 5, pre: 'dk2', name: "The King's Men", xp: qx(5, .55), gold: 12, gear: true, obj: { bosses: ['brask', 'dregg', 'moll', 'kettle'], n: 4, what: 'Defeat Gatemaster Brask, Kennelmaster Dregg, Old Moll and Sergeant Kettle' },
    say: ["Four lieutenants hold that keep together. Brask has the gate, Dregg has the kennels, Old Moll runs the kitchen and poisons anyone who complains, and Sergeant Kettle stands on the hall steps with a crossbow.", "Take all four down, and Varro will be alone in his hall with nobody left to hide behind."],
    done: ["All four! The keep's gone quiet. Even the dogs have stopped barking, which is either good or very bad."] },
  { id: 'dk4', giver: 'dace', turnTo: 'warden', lvl: 6, pre: 'dk3', name: 'Long Live the King', xp: qx(6, .7), gold: 25, gear: true, lore: 'giltletter', obj: { named: 'varro', n: 1, what: 'Defeat Varro Gilt, the Bandit King, in his hall' },
    say: ["Now for the man himself. Varro sits in his hall wearing a crown he made from melted church plate, surrounded by gold that should have been spent on shovels.", "When he falls, search his things. Somebody has been paying him, and I want to know who."],
    done: [['warden', "A letter, signed with a thumbprint. The Deacon's camp, the Choir, and a 'master' who pays for whole bodies."], ['warden', "Varro was never the real problem, was he? He was a shop. Somebody else is the customer. Well done, {hero}. Truly."]] },
  // the Blighted Grove
  { id: 'dg1', giver: 'wenlow', turnTo: 'fenna', lvl: 4, pre: 'm7', name: 'Something Rotten in the Wood', xp: qx(4, .3), gold: 6, obj: { talk: true, what: 'Find Fenna Mosswhistle at the edge of the Blighted Grove, deep in the southern wood' },
    say: ["My charm bags have been turning black, dear. All of them, from the south side of the house. Something in the deep wood is spoiling.", "Go and find Fenna Mosswhistle, the Warden of the Wood. If anybody knows what's rotting, it's her. Bring her a scone. She won't eat it, but she'll appreciate it."],
    done: [['fenna', 'A scone? From Wenlow? ...I will treasure it. Now listen closely, because the wood is dying.']] },
  { id: 'dg2', giver: 'fenna', lvl: 4, pre: 'dg1', name: 'Cutting Out the Rot', xp: qx(4, .45), gold: 8, obj: { kill: GROVE_KILL, n: 12, what: 'Put down 12 of the rotting creatures inside the Blighted Grove' },
    say: ["The wolves, the boars, even the bees. Everything that drinks from that grove comes back wrong. Grey-eyed. Hungry.", "Put twelve of them down. It's a mercy, I promise you. They aren't really alive anymore."],
    done: ["Thank you. I heard the grove sigh while you worked. A good sigh, I think."] },
  { id: 'dg3', giver: 'fenna', lvl: 5, pre: 'dg2', name: 'Roots of the Blight', xp: qx(5, .55), gold: 12, gear: true, obj: { bosses: ['rotfang', 'thornmother', 'mossgut'], n: 3, what: 'Defeat Rotfang, the Thornmother and Mossgut' },
    say: ["Three great beasts anchor the rot: Rotfang the wolf, the Thornmother in her briar nest, and Mossgut, a troll who has eaten so much blighted moss that he has become mostly moss himself.", "Bring them down, and Syra will have nothing left to sing to but herself."],
    done: ["The roots are cut. Now there is only her."] },
  { id: 'dg4', giver: 'fenna', lvl: 6, pre: 'dg3', name: 'The Blightcaller', xp: qx(6, .7), gold: 25, gear: true, lore: 'blightnotes', obj: { named: 'syra', n: 1, what: 'Defeat Blightcaller Syra at the heart of the grove' },
    say: ["Syra was my apprentice once. She was gentle. She cried when we pruned the roses.", "Whatever the Gravelord whispered to her, it hollowed her out. End it, please. For her sake as much as the wood's."],
    done: ["It's over. The grey is already draining out of the soil.", "She kept notes, you know. Neat little notes. She always did. Thank you, {hero}. The wood will remember you, and so will I."] },
  // the Choir Catacombs
  { id: 'dc1', giver: 'sister', turnTo: 'ottoline', lvl: 8, pre: 'm11', name: 'Beneath the Choir', xp: qx(8, .3), gold: 10, obj: { talk: true, what: 'Find Grave-Keeper Ottoline at the catacomb door, in the far north-west of the Waste' },
    say: ["The Choir sings at night, and the singing comes from under the ground. There are catacombs beneath the far Waste, older than the Watch, filled with the war dead.", "Grave-Keeper Ottoline keeps the door. Go to her. Take friends. Take more friends than you think you need."],
    done: [['ottoline', "The Sister sent you? Good. Somebody unlocked my door from the inside last week, and I've been too frightened to lock it again."]] },
  { id: 'dc2', where: 'cata', giver: 'ottoline', lvl: 8, pre: 'dc1', name: 'Silence the Dirge', xp: qx(8, .45), gold: 14, obj: { kill: CATA_KILL, n: 15, what: 'Defeat 15 of the Choir and the dead they keep in the Choir Catacombs' },
    say: ["Down there, the Choir tends the dead like a garden. Gravetenders, dirge-singers, and the bones and ghouls they wake.", "Silence fifteen of them. Maybe then I'll get a night's sleep."],
    done: ['Fifteen fewer voices. I can almost hear the wind again.'] },
  { id: 'dc3', where: 'cata', giver: 'ottoline', lvl: 9, pre: 'dc2', name: 'Keepers of the Crypt', xp: qx(9, .55), gold: 20, gear: true, obj: { bosses: ['ulric', 'wail', 'ossuarist', 'vess'], n: 4, what: 'Defeat Bonewarden Ulric, Sister Wail, the Ossuarist and Archdeacon Vess' },
    say: ["Four keepers hold the catacombs. Ulric, the old bonewarden, still guards the dead out of habit. Sister Wail sings and never stops. The Ossuarist collects bones. Archdeacon Vess leads the singing.", "Bring them down, and the Archcantor will be alone in the deepest vault."],
    done: ["Four keepers gone. The singing has a hole in it now. I can hear it."] },
  { id: 'dc4', where: 'cata', giver: 'ottoline', turnTo: 'sister', lvl: 10, pre: 'dc3', name: 'The Last Hymn', xp: qx(10, .7), gold: 35, gear: true, lore: 'hymnal', obj: { named: 'seln', n: 1, what: 'Defeat Archcantor Seln in the deepest vault of the Choir Catacombs' },
    say: ["Archcantor Seln is trying to finish a hymn that was started on the last night of the war. I don't know what happens when it's finished, and I don't want to know.", "Stop the song, {hero}. Whatever it costs."],
    done: [['sister', "Every grave in the Vale will answer, it says. The Gravelord isn't raising soldiers one by one. He wants all of them at once."], ['sister', "You stopped that song before its last verse. I don't think you understand how many people are alive tonight because of it."]] },
  // the Mines under the Waste
  { id: 'dm1', giver: 'corwin', turnTo: 'hobb', lvl: 8, pre: 'm10', name: 'Bones in the Ore', xp: qx(8, .3), gold: 10, obj: { talk: true, what: 'Find Prospector Hobb at the mine head in the far north-east of the Waste' },
    say: ["My wards keep picking up something to the north-east. Something deep, and old, and digging.", "There was an iron mine out there, the Ashdeep. A prospector named Hobb lives at the mine head now and refuses to go down. Ask him why."],
    done: [['hobb', "Corwin sent you? The hermit? Well. If he says it's worth going down there, maybe I'll stop telling people not to."]] },
  { id: 'dm2', where: 'mines', giver: 'hobb', lvl: 8, pre: 'dm1', name: 'Down the Shaft', xp: qx(8, .45), gold: 14, obj: { kill: MINE_KILL, n: 15, what: 'Defeat 15 dead miners, thralls, crawlers or slaglings in the Mines under the Waste' },
    say: ["My old crew is down there. Dead, mostly, but still working. The Choir brought orc thralls to help, and something woke up in the slag pits.", "Clear out fifteen of them. Be kind to the miners if you can. They were good men, before."],
    done: ['Fifteen. I hope some of them were Jory. Jory owed me money.'] },
  { id: 'dm3', where: 'mines', giver: 'hobb', lvl: 9, pre: 'dm2', name: 'The Deep Ones', xp: qx(9, .55), gold: 20, gear: true, obj: { bosses: ['grisk', 'tunnelqueen', 'slag'], n: 3, what: 'Defeat Foreman Grisk, the Tunnel Queen and the Living Slag' },
    say: ["Grisk, the orc foreman, drives the thralls. A spider bigger than my hut lives in the eastern den. And the slag pit has started moving on its own.", "Put all three down, and the way to the deep vault will be open."],
    done: ["The deep vault. Nobody's been down there since the war. Nobody living, anyway."] },
  { id: 'dm4', where: 'mines', giver: 'hobb', turnTo: 'corwin', lvl: 10, pre: 'dm3', name: 'Deepwarden', xp: qx(10, .7), gold: 35, gear: true, lore: 'deepledger', obj: { named: 'korr', n: 1, what: 'Defeat Deepwarden Korr in the deep vault of the Mines under the Waste' },
    say: ["Whatever is giving the orders down there lives in the deep vault. The old miners called it the Deepwarden. I called it a story. I was wrong.", "End it. Then bring whatever you find to the hermit. He'll know what it means."],
    done: [['corwin', "Thirty-two bodies shipped east, to the coast, for the master's fleet. He is building a navy out of the dead, {hero}."], ['corwin', "That's where he's going. The sea. Well. At least now we know which way to look."]] },
);
