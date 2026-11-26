// Build 12: six small dungeons for the early game, one in each early land.
//   The Smugglers' Cellars (the Vale, 3-5), the Hollow Oak (the Weald, 4-5), the Slag Pits (the Kiln, 4-5),
//   the Sunken Belfry (the Hush, 4-5), Thorne's Folly (the Vale, 9-10: the rival's last stand), and
//   Saint Brine's Undercroft (the coast, 11-12: where the trail of your missing parent leads).
import { S, X } from './core.js';
import { MOBS } from './data.js';
import { MOB_LORE } from './dialogue.js';
import { world, hgt, depthAt, wallNear, zoneMarker, ZONE_SIZE } from './world.js';
import { INSTANCES } from './dungeons.js';
import { LFG_D } from './social6.js';
import { build, P, T, Box, Cyl } from './models.js';
import { addKinds } from './render.js';
import * as Game from './game.js';
import { defineDungeon } from './kit9.js';
import { boss, B, U, HU, tier } from './hi9.js';

// a stone doorway for dungeons that sit in the open
const O = [0, 0, 0];
addKinds({ door12: [build([P(T(Box(.9, 4, .9), -1.9, 2), 0, O, '#6f6a64'), P(T(Box(.9, 4, .9), 1.9, 2), 0, O, '#6f6a64'), P(T(Box(4.8, .9, 1), 0, 4.2), 0, O, '#5e5954'), P(T(Box(2.9, 3.7, .2), 0, 1.85, -.2), 0, O, '#0d0b0a'), P(T(Cyl(.12, .12, .6, 5), -1.9, 4.9), 0, O, '#3a3430'), P(T(Box(.25, .3, .25), -1.9, 5.3), 0, O, '#ffb84a', 2)]), [0, 0, 0, 0], 0, .04] });

Object.assign(MOBS, {
  // the Smugglers' Cellars
  ratking12: boss('The Rat King', 'wolf~ashen', { ...B, scale: 1.3, mechs: ['spawn', 'charge'], adds: 'wolf', lines: { start: '*Something under the barrels squeaks, and then a great many somethings squeak back.*', half: '*The rats pour out of the walls.*' } }),
  mags12: boss('Mags the Fence', 'bandit2', { ...HU, scale: 1.2, mechs: ['call', 'cleave'], adds: 'bandit', lines: { start: 'Nobody comes down my stairs without an appointment, love. Boys!', half: 'Get the good stuff out the back door!' } }),
  bigodd12: boss('Big Odd', 'brute', { ...HU, scale: 1.4, hpM: 1.5, mechs: ['slam', 'charge', 'enrage'], lines: { start: 'Mags says nobody touches the crates. ODD SMASH NOBODY.', half: 'ODD IS ANGRY NOW.' } }),
  // the Hollow Oak
  rootmaw12: boss('Rootmaw', 'treant~verdant', { scale: 1.6, weak: 'fire', resist: 'nature', mechs: ['web', 'slam'], lines: { start: '*The roots of the Hollow Oak open like a mouth.*', half: '*The floor writhes.*' } }),
  wren12: boss('Choir-Seeker Wren', 'cultist1', { ...HU, range: 18, ranged: true, caster: true, school: 'shadow', mechs: ['fear', 'call', 'heal'], adds: 'choirseeker', lines: { start: 'The Varr buried their beast-gods under this tree. The Choir would like them back. They make lovely singers, once they\'re dead.', half: 'Sing, beasts! Sing!' } }),
  heartrot12: boss('The Heartrot', 'treant~ashen', { hpM: 1.5, scale: 2, weak: 'fire', mechs: ['pool', 'spawn', 'enrage'], adds: 'sapling', lines: { start: '*The heart of the old oak is black, and it beats.*', half: '*Rot spreads across the floor.*' } }),
  // the Slag Pits
  slagjaw12: boss('Slagjaw', 'golempet~ashen', { scale: 1.6, weak: 'frost', resist: 'fire', mechs: ['slam', 'shield'], lines: { start: '*A golem of cooling slag pulls itself out of the pit.*', half: '*Its cracks glow white.*' } }),
  cindermother12: boss('The Cinder-Mother', 'firepet', { scale: 1.8, weak: 'frost', resist: 'fire', range: 16, ranged: true, caster: true, school: 'fire', mechs: ['pool', 'spawn'], adds: 'cinderling', lines: { start: '*Every cinderling in the Pits came from her, and she would like to make some more out of you.*', half: '*She splits off sparks that grow legs.*' } }),
  foreman12: boss('Foreman Brask Ashgrip', 'bulwark1~ashen', { ...HU, hpM: 1.5, scale: 1.3, weak: 'frost', mechs: ['cleave', 'charge', 'call', 'enrage'], adds: 'scavenger', lines: { start: 'The Pits are mine, tunnel-born. Every ounce of slag-iron in them belongs to whoever is holding the biggest hammer. Guess who that is.', half: 'Shift! All of you, shift!' } }),
  // the Sunken Belfry
  ringer12: boss('The Bell-Ringer', 'ghoul', { ...U, scale: 1.3, mechs: ['fear', 'knock'], lines: { start: '*Something drowned still pulls the bell-rope, and the bell under the water still rings.*', half: '*DONG.*' } }),
  sexton12: boss('Sexton Mallow', 'priest~spectral', { ...U, range: 18, ranged: true, caster: true, school: 'shadow', mechs: ['heal', 'call', 'volley'], adds: 'bogwight', lines: { start: 'The bell rings for the drowned. It rang for me. Now it is ringing for you.', half: 'Rise, rise, the bell is calling!' } }),
  bellwraith12: boss('The Drowned Bell', 'wraith', { ...U, hpM: 1.5, scale: 1.8, mechs: ['fear', 'pool', 'knock', 'enrage'], lines: { start: '*The bell itself has a ghost, and the ghost is very loud.*', half: '*The sound shakes the water.*' } }),
  // Thorne's Folly
  thornehound12: boss('Gilt, Thorne\'s Hound', 'wolf', { ...B, scale: 1.6, mechs: ['charge', 'cleave'], lines: { start: '*A big hound in a gold collar. The collar says GILT. The hound says nothing, very loudly.*', half: '*It howls for its master.*' } }),
  vesper12: boss('Vesper Gale', 'warlock1', { ...HU, range: 18, ranged: true, caster: true, school: 'shadow', mechs: ['fear', 'pool', 'shield'], lines: { start: 'Aurelian said you\'d come. He said you\'d be tiresome about it. You\'re very tiresome.', half: 'Aurelian! Your little shadow is winning!' } }),
  thornefinal12: boss('Aurelian Thorne', 'knifeshade2~gilded', { ...HU, hpM: 1.8, scale: 1.2, weak: 'holy', mechs: ['cleave', 'charge', 'call', 'enrage'], adds: 'bandit2', lines: { start: 'There you are. Do you know how much the Choir is paying me to keep you away from your parent? Enough to buy this house. Enough to buy you. Let\'s finish it.', half: 'No! Not to you! Not to a nobody from the sticks!' } }),
  // Saint Brine's Undercroft
  gaoler12: boss('The Drowned Gaoler', 'skeleton~spectral', { ...U, scale: 1.4, mechs: ['slam', 'call'], adds: 'drowned', lines: { start: '*Keys rattle on a dead man\'s belt. He has kept these cells for a hundred years and he isn\'t stopping now.*', half: '*He bangs on the bars, and the cells answer.*' } }),
  brinesister12: boss('Sister of the Brine', 'priest~spectral', { ...U, range: 18, ranged: true, caster: true, school: 'frost', mechs: ['heal', 'pool', 'fear'], lines: { start: 'The prisoner you\'re looking for prayed in that cell every night. We listened. It was very sweet.', half: 'The tide! The tide!' } }),
  abbot12: boss('The Hollow Abbot', 'gravelord~spectral', { hpM: 1.6, scale: 1.4, range: 18, ranged: true, caster: true, school: 'shadow', mechs: ['pool', 'fear', 'call', 'enrage'], adds: 'drowned', lines: { start: 'Your parent was a guest of the Choir in this place. A long guest. A difficult guest. The Choir-Mother sent for them, and they have gone north. You are, I am afraid, a little late.', half: 'The Choir keeps what it takes!' } }),
});
Object.assign(MOB_LORE, { thornefinal12: 'Aurelian Thorne of the Gilded Hand: a hero for hire, very good at it, and very pleased with himself.' });

const DUNS = [
  { key: 'cellars12', name: 'The Smugglers\' Cellars', parent: 'vale', at: [-60, 150], plan: 'cells', floor: '#5a4a38', rock: '#2a2018', fog: '#2a2014', light: .55, lvl: [3, 5], prop: 'lantern', mobs: ['bandit', 'bandit2', 'xbow', 'spider'], bosses: ['ratking12', 'mags12', 'bigodd12'] },
  { key: 'hollowoak12', name: 'The Hollow Oak', parent: 'weald', at: [-60, -220], plan: 'winding', floor: '#4a3a24', rock: '#2a2010', fog: '#1a2a14', light: .5, lvl: [4, 5], prop: 'greenlamp', mobs: ['barkspider', 'sapling', 'choirseeker'], bosses: ['rootmaw12', 'wren12', 'heartrot12'] },
  { key: 'slagpits12', name: 'The Slag Pits', parent: 'kiln', at: [40, -220], plan: 'cells', floor: '#3a2a24', rock: '#1a1210', fog: '#3a1a10', light: .55, lvl: [4, 5], prop: 'lantern', mobs: ['cinderling', 'rustgolem', 'slagbat', 'scavenger'], bosses: ['slagjaw12', 'cindermother12', 'foreman12'] },
  { key: 'belfry12', name: 'The Sunken Belfry', parent: 'hush', at: [210, -110], plan: 'nave', floor: '#3a4a3a', rock: '#1a2420', fog: '#1a2a24', light: .45, lvl: [4, 5], prop: 'greenlamp', mobs: ['bogwight', 'fenghoul', 'choircaller'], bosses: ['ringer12', 'sexton12', 'bellwraith12'] },
  { key: 'folly12', name: 'Thorne\'s Folly', parent: 'vale', at: [-120, -250], plan: 'nave', floor: '#6a5a48', rock: '#2a2420', fog: '#2a2018', light: .6, lvl: [9, 10], prop: 'banner', propArg: '#c8a050', mobs: ['bandit2', 'xbow', 'bandit', 'wolf'], bosses: ['thornehound12', 'vesper12', 'thornefinal12'] },
  { key: 'undercroft12', name: 'Saint Brine\'s Undercroft', parent: 'coast', at: [-260, -300], plan: 'winding', floor: '#3a4048', rock: '#141820', fog: '#101820', light: .45, lvl: [11, 12], prop: 'bluelamp', mobs: ['drowned', 'tidesworn', 'tidechanter', 'brineling'], bosses: ['gaoler12', 'brinesister12', 'abbot12'] },
];
for (const d of DUNS) {
  defineDungeon({ ...d, exitLabel: `Back out to the daylight` }); INSTANCES[d.key].out = { x: d.at[0], z: d.at[1] + 8 };
  LFG_D[d.key] = { name: d.name, lvl: d.lvl, zone: d.key };
}
tier({ cellars12: 0, hollowoak12: 0, slagpits12: 0, belfry12: 0, folly12: 1, undercroft12: 2 });
export const DUNGEONS12 = DUNS;

// put each door on dry, open ground near where it was meant to go
function landAt(x, z) {
  const lim = (ZONE_SIZE[S.zone] || 300) - 40;
  for (let r = 0; r < 120; r += 6) for (let k = 0; k < 12; k++) {
    const a = k / 12 * Math.PI * 2, px = Math.max(-lim, Math.min(lim, x + Math.cos(a) * r)), pz = Math.max(-lim, Math.min(lim, z + Math.sin(a) * r));
    if (depthAt(px, pz) > .02 || wallNear(px, pz, 3)) continue;
    if ((world.towns || []).some(t => Math.hypot(t.x - px, t.z - pz) < (t.R || 26) + 18) || (world.town && Math.hypot(world.town.x - px, world.town.z - pz) < (world.town.R || 30) + 18)) continue;
    const h0 = hgt(px, pz); if ([[3, 0], [-3, 0], [0, 3], [0, -3]].some(([dx, dz]) => Math.abs(hgt(px + dx, pz + dz) - h0) > 1.6)) continue;
    return { x: px, z: pz };
  }
  return { x, z };
}
X.zone.push(zone => {
  for (const d of DUNS) {
    if (d.parent !== zone) continue;
    const p = landAt(...d.at);
    Game.spawnProp({ id: 'door_' + d.key, kind: 'door12', name: d.name, x: p.x, z: p.z, yaw: 0, scale: 1 });
    world.zoneLines.push({ x: p.x, z: p.z + 2.5, r: 3, to: d.key, label: `Enter ${d.name} (${d.lvl[0]}-${d.lvl[1]})` }); zoneMarker(p.x, p.z + 3, Math.PI);
    world.places.push({ name: d.name, x: p.x, z: p.z, R: 10, kind: 'dungeon' }); world.spots[d.key] = { x: p.x, z: p.z + 6 };
    INSTANCES[d.key].out = { x: p.x, z: p.z + 8 };
  }
});
