// Build 14: Starfall (levels 38-39). The Pearl-Lamp's beam went up for one heartbeat, and something above the sky saw
// it, and came down to look. It came down hard. It is a ship, and it is alive, and it is a scout for things that eat
// the light of whole worlds. The Covenant have come to welcome it home. Ammara knows better: Starwrights don't have teeth.
import { S, X, chat } from './core.js';
import { QUESTS, MOBS } from './data.js';
import { TALK, MOB_LORE } from './dialogue.js';
import { LORE } from './story.js';
import { world } from './world.js';
import { defineZone, defineDungeon } from './kit9.js';
import { mob, boss, rboss, B, U, HU, tier, giver } from './hi9.js';
import * as Rep from './rep6.js';
import { finish40, addDungeon40, addRaid40, side, props14, st14, LL, K, C, N, A, I, TK } from './l14.js';

const TECH = { weak: 'storm', resist: 'shadow' };
Object.assign(MOBS, {
  scoutdrone: mob('Scout Drone', 'drone14', { ...TECH, hpM: 1.1, spd: 6.4, fly: .9, range: 16, ranged: true, caster: true, school: 'storm' }),
  hunterdrone: mob('Hunter Drone', 'dronered14', { ...TECH, hpM: 1.3, spd: 7, fly: .9, range: 14, ranged: true, caster: true, school: 'fire' }),
  eaterfrag: mob('Star-Eater Fragment', 'eater14', { hpM: 1.6, spd: 5.6, weak: 'holy', resist: 'shadow', scale: 1.1 }),
  wreckwalker: mob('Wreck-Walker', 'constructv14', { ...TECH, hpM: 1.8, spd: 4.4, scale: 1.1, ore: true }),
  signalghost: mob('Signal Ghost', 'wraith~spectral', { ...U, hpM: 1.1, fly: .4, range: 18, ranged: true, caster: true, school: 'storm', weak: 'holy' }),
  covwatcher: mob('Covenant Starwatcher', 'cultist1~gilded', { ...HU, hpM: 1.1, range: 16, ranged: true, caster: true, school: 'holy', weak: 'shadow' }),
  covpilgrim: mob('Covenant Pilgrim', 'cultist2~gilded', { ...HU, hpM: 1.3, weak: 'shadow' }),
  // named, out on the crater
  ninenine14: boss('Unit Ninety-Nine', 'dronered14', { ...TECH, scale: 2.4, fly: 1.2, range: 18, ranged: true, caster: true, school: 'fire', mechs: ['volley', 'pool', 'call'], adds: 'hunterdrone', lines: { start: '*A drone painted with ninety-nine kill-marks. It is trying for a hundred.*', half: '*It calls its friends. It has a lot of friends.*' } }),
  fallingthing14: boss('The Thing Still Falling', 'eater14', { scale: 2.6, weak: 'holy', resist: 'shadow', mechs: ['charge', 'pool', 'knock'], lines: { start: '*It came down after the scout, a day late, and it is still angry about it.*', half: '*It hits the ground again, harder.*' } }),
  // the Hull Field (open, 38)
  salvagemind14: boss('The Salvage-Mind', 'construct14', { ...TECH, scale: 2.2, mechs: ['shield', 'call', 'slam'], adds: 'wreckwalker', lines: { start: 'SALVAGE IN PROGRESS. YOU ARE SALVAGE.', half: 'REPRIORITISING.' } }),
  hullcrawler14: boss('The Hull-Crawler', 'eater14', { scale: 2.4, weak: 'holy', mechs: ['web', 'charge', 'spawn'], adds: 'eaterfrag', lines: { start: '*It crawls across the outside of the wreck, patching it with itself.*', half: '*It sheds pieces. The pieces get up.*' } }),
  breach14: boss('The Breach', 'eater14', { hpM: 1.9, scale: 3.4, weak: 'holy', resist: 'shadow', mechs: ['pool', 'knock', 'spawn', 'enrage'], adds: 'eaterfrag', lines: { start: '*Where the hull split open, something grew to fill the hole. It is not a door. It has teeth.*', half: '*The hull groans, and the Breach opens wider.*' } }),
  // the Signal Spire (open, 39)
  repeater14: boss('The Repeater', 'construct14', { ...TECH, scale: 2.2, range: 18, ranged: true, caster: true, school: 'storm', mechs: ['volley', 'pool'], lines: { start: 'FOUND ONE. FOUND ONE. FOUND ONE.', half: 'LIT. LIT. LIT.' } }),
  ysra14: boss('Signal-Mother Ysra', 'cultist1~gilded', { ...HU, scale: 1.5, range: 16, ranged: true, caster: true, school: 'holy', mechs: ['heal', 'call', 'volley'], adds: 'covwatcher', lines: { start: 'They\'re singing to us! Can\'t you hear it? They\'re coming home!', half: 'Why won\'t you LISTEN?' } }),
  antenna14: boss('The Antenna That Sings', 'beacon14', { hpM: 1.9, scale: 2.6, range: 22, ranged: true, caster: true, school: 'storm', weak: 'storm', mechs: ['volley', 'pool', 'call', 'enrage'], adds: 'signalghost', lines: { start: '*It is singing into the sky. It has been singing for a week. Something up there is starting to sing back.*', half: '*The song changes key.*' } }),
  // the Scout's Heart (instance, 38-39)
  sh_lock14: boss('The Lock', 'constructv14', { ...TECH, scale: 2.4, mechs: ['slam', 'shield', 'knock'], lines: { start: '*The scout does not want you inside. The scout has a doorman.*', half: '*It locks down. So do you.*' } }),
  sh_garden14: boss('The Garden', 'treant', { scale: 2.4, weak: 'fire', mechs: ['web', 'spawn', 'pool'], adds: 'eaterfrag', lines: { start: '*Something grows inside the scout. Not plants. It just looks like plants, to eyes like yours.*', half: '*It blooms.*' } }),
  sh_pilot14: boss('The Pilot', 'eater14', { scale: 2.2, weak: 'holy', resist: 'shadow', range: 16, ranged: true, caster: true, school: 'shadow', mechs: ['volley', 'fear', 'call'], adds: 'scoutdrone', lines: { start: '*It turns to look at you with something that is not a face. It has never seen anything like you. It has seen a great many things.*', half: '*It speaks. It is not words. It is a number. It is how many worlds.*' } }),
  sh_core14: boss('The Heart of the Scout', 'coil14', { hpM: 2, scale: 2.4, range: 18, ranged: true, caster: true, school: 'storm', mechs: ['pool', 'volley', 'call', 'enrage'], adds: 'hunterdrone', lines: { start: '*The scout\'s heart. It beats in light. It is still sending.*', half: '*It beats faster.*' } }),
  // the Wreck of the Scout (24-person raid)
  ws_sentries24: rboss('The Wreck-Sentries', 'constructv14', { hpM: 2.3, scale: 2.6, mechs: ['slam', 'cleave', 'call'], adds: 'wreckwalker', lines: { start: '*Two of them, at the mouth of the wreck, the size of siege towers. They are not damaged. They were never in the crash. They were waiting for it.*', half: '*One of them rebuilds the other.*' } }),
  ws_hive24: rboss('The Drone-Hive', 'beacon14', { hpM: 2.3, scale: 2.2, range: 20, ranged: true, caster: true, school: 'fire', mechs: ['volley', 'spawn', 'pool', 'aura'], auraK: .1, adds: 'hunterdrone', lines: { start: '*Every drone in Starfall comes from here. It has been very busy.*', half: '*It opens every bay at once.*' } }),
  ws_navigator24: rboss('The Navigator', 'eater14', { hpM: 2.4, scale: 3.2, weak: 'holy', resist: 'shadow', range: 18, ranged: true, caster: true, school: 'shadow', mechs: ['volley', 'fear', 'knock', 'pool'], lines: { start: '*It knows the way between the stars. It knows the way here now. It would like very much to tell somebody.*', half: '*It draws a map in the air. Hulrouhn is on it. It is circled.*' } }),
  ws_eye24: rboss('The Eye That Fell', 'eater14', { hpM: 3.3, scale: 5, weak: 'holy', resist: 'shadow', school: 'shadow', mechs: ['cleave', 'pool', 'fear', 'call', 'knock', 'aura', 'spawn', 'enrage'], auraK: .16, adds: 'eaterfrag', lines: { start: '*The scout itself. It opens one eye, the size of a house, violet and patient. It has found a lit world. It has called home. It is waiting for an answer.*', half: '*The eye closes. Something in the sky, very far away, opens one.*' } }),
});
Object.assign(MOB_LORE, {
  eaterfrag: 'Pieces of the star-eater scout. The scout sheds them like skin, and they get up and go about its business.',
  scoutdrone: 'The scout\'s eyes and hands. They are mapping Starfall. They are very thorough.',
  ws_eye24: 'A scout of the star-eaters: the things the Starwrights hid Hulrouhn from. It saw the Pearl-Lamp\'s beam, and came down to look.',
});
giver('ammara14', 'Ammara of the Clouds', 'a Halcyon defector, and a Lamplighter', 'illusionist1~gilded');
giver('crane14', 'Engineer Hollis Crane', 'Crater Camp · Corrand\'s Iron Legion', 'bladewarden2');
giver('sorrel14', 'Sergeant Sorrel', 'Crater Camp · Corrand\'s Iron Legion', 'bulwark1');
giver('wenna14', 'Wenna Starling', 'Ammara\'s Lookout · a pilgrim of the Covenant, having doubts', 'villager2');
giver('halden14', 'Halden the Star-Reader', 'Ammara\'s Lookout · astronomer', 'illusionist1');
Object.assign(TALK, {
  ammara14: { bio: 'Ammara ran from the Halcyon and the Starwrights both, and came to the Throat to watch Vhorun die. She has seen the Starwrights up close. She is the only person in Starfall who is not surprised by anything.',
    greet: ["Lamplighter. You lit a lamp in the sea and a ship fell out of the sky. Most people just get moths.", "Don't touch anything purple. Don't touch anything that hums. Don't touch anything."],
    topics: [{ q: 'Is it a Starwright?', a: ["No. I've stood in a room with the Starwrights. They're tall and quiet and they smell like cold. This thing has teeth.", "The Starwrights made things. This eats things. They're not the same family. They might be the same neighbourhood."] },
      { q: 'What does the Covenant think it is?', a: ["The makers, come home. They've been walking here from all over, singing. They want to be taken up into the light.", "It might take them up. It won't be into any light."] }] },
  crane14: { bio: 'Hollis Crane built siege engines for Corrand\'s Iron Legion until the war ended, and then built bridges, and then heard a ship had fallen out of the sky and walked two hundred miles to look at it.',
    greet: ["Look at the welds on that hull. There aren't any. It's all one piece. It grew.", "I've learned more in a week here than in thirty years. Most of it is how many ways something can kill you."], topics: [] },
  sorrel14: { bio: 'Sorrel was sent by Corrand to keep Crane alive. She considers it the hardest posting of her career, and she held the Ruinwatch wall for a month.',
    greet: ["If Crane asks you to hold something, don't.", "Drones at three o'clock. Drones at nine o'clock. Drones o'clock."], topics: [] },
  wenna14: { bio: 'Wenna walked from Corrandel with the Dusk Covenant to welcome the makers home. She got here, and looked at it, and started to wonder.',
    greet: ["It's very beautiful. Isn't it? Isn't it?", "Vesper said they'd be like us, only brighter. That doesn't look like us. Does it look like us to you?"], topics: [] },
  halden14: { bio: 'Halden has watched the sky over Hulrouhn for forty years, and never seen anything move up there that wasn\'t a bird or a cloud. Until last week. Now he can\'t sleep.',
    greet: ["It's talking. The wreck. Into the sky. I've been writing it down. It's the same thing, over and over.", "Before the Pearl-Lamp, the sky was empty. I'd have sworn to it. I wonder now if it was only dark."], topics: [] },
});
Object.assign(LORE, {
  scoutlog: { title: 'What the Scout Is Saying', where: 'lookout', text: "Halden's notes, decoded: 'FOUND ONE. LIT. COME.' Over and over. Under it, in a shakier hand: 'It was dark for so long. Why was it dark for so long? Because somebody kept it dark. On purpose. Who? And from what?'" },
  starmap: { title: 'The Navigator\'s Map', where: 'scoutwreck', text: "Burned into a sheet of the scout's hull: a spray of lights, thousands of them, most of them crossed out. One near the edge, circled, still lit. Under it, in a hand that is not a hand: a number. It is very long." },
});
X.VEND = Object.assign(X.VEND || {}, { cratercamp: ['Quartermaster Lusk', 'bulwark1'], lookout: ['Pedlar Finn', 'villager1'] });
X.inspectSay = Object.assign(X.inspectSay || {}, {
  wreckage: ['A piece of the hull, warm to the touch. It is not metal. It flinches when you pick it up.', 'A shard of the hull. Crane will want this. Crane wants everything.', 'Something like a panel. It shows you a picture of yourself, from behind.'],
  console: ['A console in the wreck. You press the glowing part. It shows a map of the stars, and Hulrouhn on it, circled.', 'The console speaks. A number. It keeps getting bigger.', 'You pull the core out of the console. It stops talking. Everything goes very quiet.'],
  starglass: ['A spar of starglass, grown out of the crater wall. It rings when you touch it.', 'Starglass. It hums a note you feel in your teeth. You snap it off.'],
  covshrine: ['A Covenant shrine to the makers, facing the wreck. Flowers. Candles. A child\'s drawing of a tall shining man. You leave the drawing. You knock over the rest.', 'An altar, and an offering: a lamp, lit, for the makers to see. You put it out.'],
  probe: ['A probe, driven into the ground. It is listening. You pull it out. It keeps listening.', 'A probe. It has been counting the stars in the sky. It has got to a number. It is not a big number.'],
});

const F = { zone: 'sf14' }, WRECK = ['scoutdrone', 'hunterdrone', 'eaterfrag', 'wreckwalker', 'signalghost'], PIL = ['covwatcher', 'covpilgrim'];
for (const m of [...WRECK, ...PIL]) Rep.KILL_REP[m] = ['lamp14', 6];
X.arriveHooks.push((zone, from) => zone === 'sf14' ? ({ mf14: { x: 450, z: 0 } }[from] || { x: -455, z: -100 }) : zone === 'dh14' && from === 'sf14' ? { x: 450, z: -100 } : null);
defineZone('sf14', {
  size: 500, seed: 14037, name: 'Starfall', bossName: 'The Eye That Fell', hiH: 18, maxSpawnH: 30,
  land: (x, z, N) => { const d = Math.hypot(x - 40, z + 260); const rim = Math.exp(-((d - 150) ** 2) / 1800) * 18, bowl = d < 150 ? -(1 - d / 150) * 8 : 0; return Math.max(1.5, 5 + N.fbm(x * .006, z * .006, 4) * 10 + rim + bowl); },
  pal: { a: '#4a4258', b: '#3e3850', hi: '#6a5a7a', road: '#5a5266', cob: '#6a6276', low: '#2a2438' },
  towns: [{ key: 'cratercamp', name: 'Crater Camp', x: -380, z: -100, R: 30, wall: 'palisade', gates: [0, Math.PI], guardName: 'Iron Legionary', guardKind: 'bladewarden1',
    houses: [[-12, 10, .4, 'tent', 4, 4], [12, 10, -.4, 'tent', 4, 4], [-14, -10, .2, 'hall', 9, 5], [14, -10, 2.2, 'tent', 4, 4]], props: [[0, 4, 'lantern'], [-6, 0, 'lantern'], [0, -6, 'banner', '#c8a050']],
    npcs: [['giver', 'ammara14', 0, 0], ['giver', 'crane14', -8, 6], ['giver', 'sorrel14', 8, -4], ['vendor', 'cratercamp', 8, 6], ['bind', null, 3, -4], ['armory', null, -6, -6]], guards: [[28, 2], [28, -2], [-28, 2], [-28, -2]] },
    { key: 'lookout', name: 'Ammara\'s Lookout', x: 220, z: 330, R: 22, wall: 'stones', gates: [Math.PI, Math.PI / 2], guardName: 'Lookout Guard', guardKind: 'archer1',
      houses: [[-6, 6, .3, 'hut'], [6, -6, -.4, 'tent']], props: [[0, 0, 'lantern'], [4, 4, 'banner', '#c86aff']],
      npcs: [['giver', 'wenna14', -5, -2], ['giver', 'halden14', 5, 4], ['vendor', 'lookout', 6, -4], ['bind', null, 0, 6]], guards: [[-20, 2], [-20, -2]] }],
  roads: [[-460, -100, -340, -100], [-340, -100, -140, 60], [-140, 60, 220, 300], [-140, 60, -100, -120], [-100, -120, 260, -60], [260, -60, 460, 0], [-100, -120, 40, -380]],
  regions: { names: ['Crater Camp', 'Ammara\'s Lookout', 'The Hull Field', 'The Signal Spire', 'The Crater'], fn: (x, z) => Math.hypot(x - 40, z + 260) < 150 ? 4 : x < -220 && z < 100 ? 0 : z > 180 ? 1 : x < 80 ? 2 : 3 },
  open: [{ key: 'hullfield', name: 'The Hull Field', x: -140, z: 60, R: 34, deco: 'hullshard', decoN: 10, ring: true, gap: 0, centre: 'starglass', lvl: [38, 38], area: 2,
      packs: [[-18, 0, ['wreckwalker', 'eaterfrag']], [18, 0, ['scoutdrone', 'scoutdrone', 'eaterfrag']], [0, -18, ['eaterfrag', 'eaterfrag']], [0, 18, ['wreckwalker', 'scoutdrone']]],
      bosses: [[-22, -18, 'salvagemind14', 38], [22, -20, 'hullcrawler14', 38], [0, -4, 'breach14', 38, true]] },
    { key: 'signalspire', name: 'The Signal Spire', x: 290, z: -40, R: 34, deco: 'pylon', decoN: 8, centre: 'ring', lvl: [39, 39], area: 3,
      packs: [[-18, 0, ['covwatcher', 'covpilgrim', 'signalghost']], [18, 0, ['signalghost', 'signalghost']], [0, -18, ['hunterdrone', 'covwatcher']], [0, 18, ['covpilgrim', 'covpilgrim', 'signalghost']]],
      bosses: [[-22, -18, 'repeater14', 39], [22, -20, 'ysra14', 39], [0, -4, 'antenna14', 39, true]] }],
  doors: [{ to: 'scoutheart', name: 'The Scout\'s Heart', x: -300, z: -320, ry: 0, label: 'Climb into the Scout\'s Heart (38-39)', col: '#c86aff' },
    { to: 'scoutwreck', name: 'The Wreck of the Scout', x: 40, z: -260, ry: 0, label: 'Go into the Wreck of the Scout (24-person raid)', col: '#ffffff' }],
  landmarks: [{ g: 'hullshard', x: 40, z: -200, name: 'The Scout', R: 30, clear: 26, s: 6 }, { g: 'monolith', x: -200, z: 260, name: 'The Pilgrims\' Stone', R: 10, clear: 8, s: 1.4 }],
  lines: [{ x: -488, z: -100, to: 'dh14', label: 'Back down into the Dusk Hollows', ry: -Math.PI / 2 },
    { x: 488, z: 0, to: 'mf14', label: 'East, along the scout\'s scar, to the Makers\' Forge', ry: Math.PI / 2, why: () => (S.hero?.lvl || 0) < 39 ? 'The Makers\' Forge is for level 39 and beyond.' : S.quests.zs10?.state !== 'turned' && S.quests.zs10?.state !== 'done' ? 'The scar runs on east into a haze. Ammara will know what\'s out there.' : null }],
  spots: { cratercamp: { x: -380, z: -100 }, camproad: { x: -260, z: 0 }, hullfield: { x: -140, z: 60 }, lookout: { x: 220, z: 330 }, pilgrims: { x: -200, z: 260 }, spire: { x: 290, z: -40 },
    crater: { x: 40, z: -180 }, scoutheart: { x: -300, z: -310 }, scoutwreck: { x: 40, z: -250 }, eastscar: { x: 440, z: 0 }, rim: { x: 160, z: -120 } },
  scatter: [[40, [-480, -220, -300, 100], ['scoutdrone', 'eaterfrag', 'hunterdrone'], [38, 38], 0], [40, [-220, 480, 180, 480], ['covpilgrim', 'covwatcher', 'scoutdrone'], [38, 38], 1],
    [44, [-220, 80, -100, 180], ['wreckwalker', 'eaterfrag', 'scoutdrone'], [38, 38], 2], [44, [80, 480, -200, 180], ['signalghost', 'hunterdrone', 'covwatcher'], [38, 39], 3],
    [48, [-480, 480, -480, -200], ['eaterfrag', 'wreckwalker', 'hunterdrone', 'signalghost'], [39, 39], 4]],
  camps: [[6, [-220, 480, 180, 480], ['covpilgrim', 'covpilgrim', 'covwatcher'], [38, 38], 1, 'pg'], [5, [80, 480, -200, 180], ['covwatcher', 'covwatcher', 'covpilgrim'], [39, 39], 3, 'cw']],
  rares: [[[-480, -220, -300, 100], 'ninenine14', 38, false], [[-480, 480, -480, -200], 'fallingthing14', 39, true]],
  hunt: [{ area: 0, lvl: [38, 38] }, { area: 1, lvl: [38, 38] }, { area: 2, lvl: [38, 38] }, { area: 3, lvl: [38, 39] }, { area: 4, lvl: [39, 39] }],
  labels: [{ t: 'Around Crater Camp (38)', x: -300, z: 0 }, { t: 'The pilgrims\' road (38)', x: -40, z: 260 }, { t: 'The Hull Field (38)', x: -140, z: 140 }, { t: 'The Signal Spire (38-39)', x: 290, z: 40 }, { t: 'The Crater (39)', x: 40, z: -120 }],
  nodes: [['voidiron', 'ore', 'oresilver', 130, null, 22], ['gloomcap', 'herb', 'herbgrave', 130, null, 26]],
  scenery: { density: 10000, tuft: '#5a4a6a', kinds: [['starglass', .02, .8, 2], ['hullshard', .004, .5, 1.2], ['techtree', .006, .8, 1.4], ['crystal', .01, .8, 1.6]] },
  sky: { fog: '#3a2050', top: '#0a0418', hor: '#5a3a7a', k: .95, far: 200, sun: .75 },
  after: ({ rng }) => props14([['wreckage', 'A piece of the scout', 'salvage14', -100, 0, 8, 120], ['console', 'A console from the wreck', 'console14', 40, -150, 5, 70], ['starglass', 'A spar of starglass', 'coil14', 160, -120, 5, 60],
    ['covshrine', 'A shrine to the makers', 'altar14', -120, 260, 5, 90], ['probe', 'A probe in the ground', 'beacon14', 300, 100, 5, 120, 'scoutlog']], rng),
});
defineDungeon({ key: 'scoutheart', name: 'The Scout\'s Heart', parent: 'sf14', plan: 'winding', floor: '#3a2a4a', rock: '#0e0818', fog: '#1a0e2a', light: .42, lvl: [38, 39], prop: 'bluelamp',
  mobs: ['eaterfrag', 'scoutdrone', 'wreckwalker', 'hunterdrone'], bosses: ['sh_lock14', 'sh_garden14', 'sh_pilot14', 'sh_core14'], exitLabel: 'Climb back out of the scout' });
defineDungeon({ key: 'scoutwreck', name: 'The Wreck of the Scout', parent: 'sf14', plan: 'nave', floor: '#2e2440', rock: '#0a0614', fog: '#140a22', light: .4, lvl: [39, 39], prop: 'bluelamp', raid: true,
  mobs: ['eaterfrag', 'wreckwalker', 'hunterdrone', 'signalghost', 'scoutdrone'], bosses: ['ws_sentries24', 'ws_hive24', 'ws_navigator24', 'ws_eye24'], exitLabel: 'Back out onto the crater' });
addDungeon40('scoutheart', 'The Scout\'s Heart', [38, 39]); addRaid40('scoutwreck', 'The Wreck of the Scout', 24, 39);
tier({ hullfield: 19, signalspire: 19, scoutheart: 19, scoutwreck: 20 });
X.kill.push(m => {
  if (m.mob !== 'ws_eye24' || st14().scout) return; st14().scout = true;
  chat('sys', null, 'The Eye That Fell closes, and does not open again. The scout is dead.');
  setTimeout(() => chat('sys', null, 'High above Starfall, very faint, a single violet light that was not there last week blinks once, and goes on blinking.'), 4000);
});

// ---------- the story ----------
QUESTS.push(...finish40([
  { id: 'zs1', story: true, giver: 'ammara14', lvl: 38, pre: 'zh9', name: 'Where the Star Fell', where: 'camproad', ...F, rep: LL(400), obj: K(['scoutdrone', 'hunterdrone'], 12, 'Shoot down 12 of the drones around Crater Camp', 'camproad', 200),
    say: ["Lamplighter. Mira sent for me. She said a star fell, and you'd want someone who'd met the people who own the stars. That's me. Lucky me.", "The thing that fell is sending out drones. Little flying eyes. They're mapping everything. Twelve. I'd like them to have a gap in the map."],
    done: ["Twelve. And look: they're not made. They're grown. Like fruit. Like teeth."] },
  { id: 'zs2', story: true, giver: 'crane14', lvl: 38, pre: 'zs1', name: 'Salvage Rights', where: 'hullfield', ...F, rep: LL(400), obj: I('wreckage', 4, 'Bring Crane 4 pieces of the scout from the Hull Field'),
    say: ["Corrand sent me to find out what it is. I'm an engineer. I find out what things are by taking them apart.", "Four pieces of the hull from the field. Big as you can carry. If they bite, let go."],
    done: ["It's not metal. It's not anything. It's warm and it flinches and I think it's healing. In my tent. On my table."] },
  { id: 'zs3', story: true, giver: 'ammara14', lvl: 38, pre: 'zs1', name: 'That\'s Not a Starwright', where: 'hullfield', ...F, rep: LL(400), obj: C(['eaterfrag'], 'Star-Eater Tooth', 6, 'Take 6 teeth from the star-eater fragments'),
    say: ["The Covenant are calling it the makers. Come home. I've stood in a room with the makers. I'd like to show you something. Bring me six of the teeth off the pieces it sheds.", "The Starwrights don't have teeth."],
    done: ["There. Look at them. Each tooth has a smaller tooth inside. And a smaller one inside that.", "This isn't the makers, Lamplighter. This is the thing the makers were afraid of."] },
  { id: 'zs4', story: true, giver: 'wenna14', lvl: 38, pre: 'zs3', name: 'The Pilgrims', where: 'lookout', ...F, rep: LL(300), obj: TK('Talk to Wenna about why she came'),
    say: [["wenna14", "I walked here from Corrandel. Three hundred miles, singing. Vesper said the makers would come home, if we lit the way. And they did. Look. There they are."], ["wenna14", "Only... it doesn't look like us. Vesper said they'd look like us, only brighter. And the drones took Ansel. They took him up. He's not come down."]],
    done: [["wenna14", "You think it's not the makers. Ammara thinks so too. I don't want you to be right. I think you're right."], ["halden14", "Then you'd better stay here, at the Lookout, girl. Don't go back to the pilgrims. They'll be going up next."]] },
  { id: 'zs5', story: true, giver: 'crane14', lvl: 38, pre: 'zs2', pre2: 'zs4', name: 'The Hull Field', where: 'hullfield', ...F, rep: LL(500), obj: N('breach14', 'Go into the Hull Field and kill the Breach'),
    say: ["Where the hull split open in the crash, something grew to fill the hole. Sorrel calls it the Breach. It's eating the Legion's sentries one at a time.", "Kill it. I want to get inside the hull. I want to see what makes it go."],
    done: ["It's healing. The whole wreck. The Breach was a scab and you pulled it off and it's healing anyway. What does it need to heal for? Where's it going?"] },
  { id: 'zs6', story: true, giver: 'halden14', lvl: 39, pre: 'zs5', name: 'The Signal Spire', where: 'spire', ...F, rep: LL(500), obj: N('antenna14', 'Climb the Signal Spire and silence the Antenna That Sings'),
    say: ["The scout grew a spire, east of the crater. It sings into the sky, all day, all night. The Covenant have built a shrine at the bottom and sing along.", "Silence it. Whatever it's saying, I'd rather it stopped saying it."],
    done: ["Quiet. For the first time in a week. I can hear myself think. I'm not sure I like what I'm thinking."] },
  { id: 'zs7', story: true, giver: 'ammara14', lvl: 39, pre: 'zs6', name: 'What It\'s Saying', where: 'lookout', ...F, rep: LL(400), obj: TK('Hear what Halden has decoded'),
    say: [["halden14", "I've decoded it. The song. It's three words. Over and over. 'Found one. Lit. Come.'"], ["ammara14", "Found one. A world. Lit. Ours. Come. Come and what?"], ["halden14", "And the sky before the Pearl-Lamp. Dark. I always thought the sky was empty. What if it wasn't empty? What if somebody kept it dark? So nothing could see us?"]],
    done: [["ammara14", "The Starwrights. They hid the world. All these years. Not from us. From that."], ["ammara14", "And Vesper lit a hole in it. And something saw."]] },
  { id: 'zs8', story: true, giver: 'crane14', lvl: 39, pre: 'zs7', name: 'The Scout\'s Heart', where: 'scoutheart', ...F, rep: LL(600), obj: N('sh_core14', 'Climb into the Scout\'s Heart and stop it beating'),
    say: ["There's a way in, at the tail. It goes to something that beats. Light, not blood. That's what's sending the song now the spire's quiet.", "Stop the heart. The scout won't die of it. But it'll stop calling."],
    done: ["It's stopped. The heart. But Halden says something's still sending, from the head. The scout itself. Awake."] },
  { id: 'zs9', story: true, giver: 'ammara14', lvl: 39, needLvl: 39, pre: 'zs8', name: 'The Wreck of the Scout', where: 'scoutwreck', ...F, rep: LL(1400), obj: N('ws_eye24', 'Go into the Wreck of the Scout and kill the Eye That Fell (24-person raid)'),
    say: ["The scout's awake. Halden says it's sending everything it knows. Where we are. How bright we are. How many of us.", "Kill it. Before it finishes. Get everybody. The Legion, the Lamplighters, the divers, the pilgrims who've stopped believing. Twenty-four, Lamplighter."],
    done: [["ammara14", "It's dead. The Eye's dead."], ["halden14", "And look up. That violet light, there. That wasn't there last week. It's blinking."], ["ammara14", "Something heard."]] },
  { id: 'zs10', story: true, giver: 'ammara14', lvl: 39, pre: 'zs9', name: 'The Makers\' Forge', where: 'eastscar', ...F, rep: LL(400), obj: TK('Talk to Ammara about where to go next'),
    say: [["ammara14", "The Starwrights hid this world, once. They can do it again. We need to ask them how."], ["ammara14", "East of here, past the scar, is the Makers' Forge. Where they made Vhorun. When the seven came down for his hunger, one of them didn't go back up. I'd like to meet her."]],
    done: [["ammara14", "East, then. Along the scar. Crane's coming. He wants to see where they made things. I'll tell Mira."], ["wenna14", "Can I come? I don't know how to do anything. I can carry lamps."]] },
]));

// ---------- the smaller roads ----------
const camp = side('sf14', LL, 'zs1', [
  ['zsc1', 'sorrel14', 38, 'Drones O\'Clock', 'camproad', K(['scoutdrone', 'hunterdrone'], 10, 'Shoot down 10 drones over the camp road', 'camproad', 200), "Drones at every o'clock. They're mapping the camp. I don't want to be on their map. Ten.", "Ten. They'll be back with friends. They're very friendly."],
  ['zsc2', 'crane14', 38, 'Drone Cores', 'camproad', C(['scoutdrone'], 'Drone Core', 6, 'Bring Crane 6 drone cores'), "Six cores from the scout drones. Unbroken, if you can. Lightly broken, if you can't. Very broken, if it's that or your arm.", "Grown, not made. Every one slightly different. Like fingerprints. Like faces."],
  ['zsc3', 'sorrel14', 38, 'Walkers in the Wreckage', 'hullfield', K(['wreckwalker'], 8, 'Bring down 8 wreck-walkers on the Hull Field', 'hullfield', 160), "The walkers carry bits of wreck back to the crater. They're rebuilding it. Eight. Make them carry each other.", "Eight. The Legion's going to name a drinking song after you. It's going to be terrible."],
  ['zsc4', 'ammara14', 38, 'The Taken', 'pilgrims', K(['hunterdrone'], 8, 'Shoot down 8 hunter drones over the pilgrims\' road', 'pilgrims', 700), "The red drones take people. Up. Pilgrims, mostly, because the pilgrims walk toward them with their arms open. Eight. Fewer people going up.", "Eight. Nobody went up today. Tomorrow, somebody will. They keep walking toward it."],
  ['zsc5', 'crane14', 38, 'What Makes It Go', 'crater', I('console', 3, 'Pull the cores out of 3 consoles on the crater floor'), "There are consoles in the crater. Fell out of the wreck. They're still on. Still talking. Pull the cores. I want to know what they're saying, and I want them to stop.", "A map. All of them show a map. Stars, crossed out. One circled. Ours."],
  ['zsc6', 'sorrel14', 38, 'Unit Ninety-Nine', 'camproad', N('ninenine14', 'Hunt down Unit Ninety-Nine, the drone with ninety-nine kill-marks'), "There's a drone with marks painted on its side. Ninety-nine. Two of them are my soldiers. Kill it before it gets to a hundred.", "Ninety-nine. It stays ninety-nine. Good."],
  ['zsc7', 'crane14', 38, 'Starglass', 'rim', I('starglass', 3, 'Snap off 3 spars of starglass from the crater rim'), "Starglass is growing out of the crater rim, where the scout hit. It rings. I want to know why it rings. Three spars.", "It's tuned. Every spar, the same note. It's an antenna. Everything here is an antenna. The whole crater is listening."],
  ['zsc8', 'sorrel14', 39, 'Legion Rations', 'cratercamp', C(['wreckwalker', 'eaterfrag'], 'Supply Crate', 5, 'Recover 5 Legion supply crates taken by the walkers'), "The walkers stole our supplies. They take everything back to the crater. Everything. Even the biscuits. Five crates.", "Biscuits. Thank the old gods. The Legion marches on biscuits. Mostly it complains on them."],
  ['zsc9', 'ammara14', 39, 'Ammara\'s Wings', 'cratercamp', TK('Ask Ammara about the Halcyon and the Starwrights'), "You want to know why I'm not surprised by anything? Sit. It's a short story with a long middle.", "So yes. I've met them. Tall, and quiet, and kind, the way a gardener is kind to the garden. I didn't like being a garden. I left."],
  ['zscd', 'sorrel14', 38, 'Morning Sweep', 'camproad', K(['scoutdrone', 'eaterfrag', 'hunterdrone'], 8, 'Sweep 8 things off the camp road', 'camproad', 200), "Morning sweep. Eight. Every morning. It's always morning somewhere.", "Swept. Same tomorrow.", { daily: true }],
]);
const field = side('sf14', LL, 'zs2', [
  ['zsf1', 'crane14', 38, 'The Salvage-Mind', 'hullfield', N('salvagemind14', 'Kill the Salvage-Mind in the Hull Field'), "Something's running the walkers. A big one, in the Hull Field. Thinks it's in charge. Let's tell it otherwise.", "SALVAGE IN PROGRESS. Ha. Not any more. I'm having its head. For science."],
  ['zsf2', 'ammara14', 38, 'The Hull-Crawler', 'hullfield', N('hullcrawler14', 'Kill the Hull-Crawler patching the wreck'), "There's a thing crawling on the outside of the hull, patching it with itself. The scout wants to fly again. I'd rather it didn't.", "The patches are rotting. It won't fly. Not soon. Not ever, if we're lucky."],
  ['zsf3', 'crane14', 38, 'More Pieces', 'hullfield', I('wreckage', 4, 'Bring Crane 4 more pieces of the scout'), "More pieces. I've got a theory and I need four more bits to be wrong about it.", "I was right. I didn't want to be right. It's not a ship. It's an animal that's learned to be a ship."],
  ['zsf4', 'sorrel14', 38, 'Shed Skin', 'hullfield', K(['eaterfrag'], 12, 'Kill 12 star-eater fragments in the Hull Field', 'hullfield', 160), "The pieces it sheds get up and walk off. Twelve. Before they get anywhere.", "Twelve. And they all walked the same way. East. Toward the Forge. What's at the Forge?"],
  ['zsf5', 'crane14', 39, 'Grown Not Made', 'hullfield', C(['wreckwalker'], 'Living Plate', 6, 'Bring Crane 6 living hull-plates from the wreck-walkers'), "The walkers have plates on them that are still alive. I want six. In a box. With a lid. A heavy lid.", "They're moving in the box. Sorrel's sitting on the lid. Sorrel is not happy."],
  ['zsf6', 'ammara14', 39, 'Burn the Patches', 'crater', K(['eaterfrag', 'wreckwalker'], 10, 'Kill 10 things repairing the scout in the crater', 'crater', 160), "Everything in the crater is working on the scout. Ten of them. Make the job go slower.", "Slower. It's still healing. Healing slower is still healing."],
  ['zsf7', 'wenna14', 39, 'Ansel', 'crater', A('crater', 'Go into the crater and look for any sign of Ansel'), "Ansel was taken up. A red drone. He was waving. He thought it was the makers taking him to heaven. Go into the crater. See if anything's left. I'm not brave enough.", "Just his hat? Just his hat. Thank you. I'm going to keep it. I'm not going to cry. I'm going to cry later."],
  ['zsf8', 'crane14', 39, 'The Long Number', 'crater', I('console', 2, 'Read the number on 2 more of the crater consoles'), "Halden says the consoles all show a number. Read me two. I want to know if it's the same number.", "It's going up. Every console, the number's higher. Halden says it's counting. Counting what?"],
  ['zsfd', 'crane14', 39, 'Samples', 'hullfield', C(['eaterfrag', 'wreckwalker'], 'Wreck Sample', 6, 'Bring Crane 6 samples from the Hull Field'), "Six samples a day. I need a lot of samples. Science is mostly samples.", "Six. Same tomorrow.", { daily: true }],
]);
const spire = side('sf14', LL, 'zs4', [
  ['zsp1', 'halden14', 38, 'Probes', 'spire', I('probe', 4, 'Pull up 4 probes the drones have driven into the ground'), "The drones drive probes into the ground. Listening. Counting. Pull four up. I want to see what they've counted.", "Stars. They're counting the stars. And it's a small number. Because the sky's dark. Because somebody kept it dark."],
  ['zsp2', 'wenna14', 38, 'The Shrines', 'pilgrims', I('covshrine', 4, 'Knock over 4 of the Covenant shrines along the pilgrims\' road'), "There are shrines all along the road, facing the wreck. With lamps. For the makers to see. I helped build some of them. Knock them over. I can't. You can.", "Thank you. I feel sick. I feel better. Both."],
  ['zsp3', 'halden14', 38, 'Signal Ghosts', 'spire', K(['signalghost'], 10, 'Silence 10 signal ghosts around the Spire', 'spire', 180), "The Spire makes ghosts. Signal ghosts. Echoes of the song, walking about. Ten. They make my telescope shake.", "Steady. The telescope's steady. I can see the sky again. Still dark. Still empty. I hope."],
  ['zsp4', 'wenna14', 38, 'Pilgrims Who Won\'t Listen', 'pilgrims', K(['covpilgrim', 'covwatcher'], 8, 'Stop 8 Covenant pilgrims marching on the wreck', 'pilgrims', 220), "They won't stop. They won't listen. They're walking to the crater to be taken up. Some of them have children. Stop them. Any way you can.", "I knew some of them. I keep saying that. I knew all of them, really. We walked three hundred miles together."],
  ['zsp5', 'halden14', 39, 'The Repeater', 'spire', N('repeater14', 'Destroy the Repeater at the Signal Spire'), "There's a thing at the Spire that just repeats. FOUND ONE. FOUND ONE. Kill it. I'd like the last word.", "Quiet. I had the last word. It was a rude word. Don't tell Wenna."],
  ['zsp6', 'wenna14', 39, 'Signal-Mother Ysra', 'spire', N('ysra14', 'Stop Signal-Mother Ysra at the Signal Spire'), "Ysra leads the singing at the Spire. She was kind to me, on the road. She shared her food. She's the one who told the pilgrims to walk into the crater.", "Did she say anything? About me? No. She wouldn't. She'd forgotten me. She'd forgotten everyone except them."],
  ['zsp7', 'halden14', 39, 'A Lens for the Lookout', 'spire', C(['scoutdrone', 'hunterdrone'], 'Drone Lens', 4, 'Take 4 lenses from the drones'), "The drones see further than my telescope. Four of their lenses, and I'll see what they see.", "I can see the violet light. It's not a star. It's moving. Slowly. Toward us."],
  ['zsp8', 'wenna14', 39, 'Carry the Lamps', 'lookout', TK('Help Wenna decide what to do'), "I came here to carry a lamp for the makers. I don't want to carry it for them any more. Ammara says the Lamplighters carry lamps for everyone. Is that true?", "Then I'm a Lamplighter. If you'll have me. I'm very good at carrying things. It's the only thing I'm good at."],
  ['zspd', 'halden14', 39, 'Static', 'spire', K(['signalghost', 'covwatcher'], 8, 'Clear 8 things off the Spire road', 'spire', 200), "Eight a day keeps the static down.", "Clear. Same tomorrow.", { daily: true }],
]);
const wreck = side('sf14', LL, 'zs7', [
  ['zsr1', 'sorrel14', 39, 'The Wreck-Sentries', 'scoutwreck', N('ws_sentries24', 'Get past the Wreck-Sentries at the mouth of the scout (24-person raid)'), "Two big walkers at the mouth of the wreck. They weren't in the crash. They were waiting for it. Get past them.", "Down. Both. The Legion will be insufferable for a week. You're welcome."],
  ['zsr2', 'crane14', 39, 'The Drone-Hive', 'scoutwreck', N('ws_hive24', 'Destroy the Drone-Hive inside the scout (24-person raid)'), "Every drone comes out of one place in the scout. A hive. Kill it, and the sky's ours again.", "No drones. I looked up and there were no drones. I'd forgotten what the sky looked like without them."],
  ['zsr3', 'halden14', 39, 'The Navigator', 'scoutwreck', N('ws_navigator24', 'Kill the Navigator in the Wreck of the Scout (24-person raid)'), "Somewhere inside is the part that knows the way. The way here. Kill it. Make the way home harder to remember.", "A map? It drew a map? With us circled? Bring me the map. No. Burn the map. No. Bring it. Then burn it."],
  ['zsr4', 'ammara14', 39, 'Burn the Map', 'lookout', TK('Watch Ammara burn the Navigator\'s map'), "Halden's copied it. All of it. Now I'm burning it. I want you to watch. I want somebody to see that it was burned.", "Gone. The copy's in Halden's head. That's the only one. Let's hope nothing ever reads Halden's head."],
  ['zsr5', 'sorrel14', 39, 'Fallen Thing', 'crater', N('fallingthing14', 'Find and kill the Thing Still Falling, somewhere in the Crater'), "Something came down a day after the scout. Smaller. Angrier. It hits the ground every few minutes, like it's still falling. Make it stop.", "Stopped. Finally. Ground's not shaking. I didn't notice it was shaking until it stopped."],
  ['zsr6', 'wenna14', 39, 'Lamps for Starfall', 'pilgrims', K(['covpilgrim', 'covwatcher'], 10, 'Clear 10 of the last Covenant from the pilgrims\' road so Wenna can light it again', 'pilgrims', 240), "The pilgrims who stayed with the Covenant are still on the road. Ten, and I'll light the road again. Our lamps. Not theirs.", "Lit. All the way to the Lookout. Ammara says it's a good start for a Lamplighter. Did I do it right?"],
  ['zsr7', 'crane14', 39, 'Crane\'s Theory', 'cratercamp', TK('Hear Crane\'s theory about the scout'), "I've got a theory. Sit down. You'll want to sit down.", "It's not one animal. It's the smallest piece of a much bigger one. A finger. A whisker. Whatever's on the other end of it is the size of... I don't know. I don't have a word. Sorrel says 'big'. I'm going with 'big'."],
  ['zsr8', 'halden14', 39, 'The Violet Light', 'lookout', TK('Look through Halden\'s telescope at the violet light'), "Look. Through here. That violet light. Is it closer? Tell me it isn't closer.", "It's not closer. It's not closer. Good. Halden, you're imagining things. Good. Good."],
]);
const more = side('sf14', LL, 'zs3', [
  ['zsx1', 'sorrel14', 38, 'Hold This', 'cratercamp', TK('Help Sorrel find out what Crane asked her to hold'), "Crane asked me to hold something. I'm holding it. It's warm. It's getting warmer. What do I do.", [["crane14", "Oh, that. Put it in the water bucket. Gently. Gently! Thank you. That was going to be very interesting in about a minute."], ["sorrel14", "I hate him. I'd die for him. I hate him."]]],
  ['zsx2', 'crane14', 38, 'Fuel for the Forge-Camp', 'camproad', C(['wreckwalker'], 'Walker Battery', 5, 'Take 5 batteries from the wreck-walkers'), "The walkers run on something. Little cells of light. Five, and I can run the camp lamps on them instead of oil.", "Look at that. No smoke. No smell. Burns for a week. Mira's going to want a hundred of these."],
  ['zsx3', 'ammara14', 38, 'Ammara\'s Old Feathers', 'pilgrims', C(['covwatcher'], 'Halcyon Feather', 4, 'Take back 4 Halcyon feathers the Covenant wear as charms'), "The Covenant wear Halcyon feathers. Mine, some of them. I left them behind when I ran. They think feathers bring you closer to the sky. Bring me four.", "They're mine. I know they're mine. I don't want them. I just don't want them to have them."],
  ['zsx4', 'halden14', 38, 'Cloud Cover', 'lookout', A('pilgrims', 'Climb to the Pilgrims\' Stone and tell Halden what the sky is doing'), "My knees won't take the climb to the Pilgrims' Stone. Yours will. Go up. Look at the sky. Tell me if there's anything in it.", "Nothing? Nothing at all? Not even the violet one? It's behind a cloud. I hope it's behind a cloud."],
  ['zsx5', 'sorrel14', 38, 'Shelter', 'camproad', C(['eaterfrag'], 'Hide-Plate', 6, 'Bring Sorrel 6 hide-plates from star-eater fragments for the camp walls'), "The drones see through tents. They don't see through the scout's own skin. Six plates and we'll have a wall it can't see past.", "It can't see us. Good. Now I can get dressed without being mapped."],
  ['zsx6', 'wenna14', 38, 'Ansel\'s Mother', 'lookout', TK('Go with Wenna to tell Ansel\'s mother'), "Ansel's mother is at the Lookout. She doesn't know. I've got his hat. Come with me. I can't do it on my own.", "She knew. She said she knew when he started singing on the road. She said thank you. Why does everyone say thank you?"],
  ['zsx7', 'crane14', 39, 'Listening Back', 'spire', I('probe', 1, 'Find the last of the drones\' probes near the Spire'), "One more probe. Halden says there's one left, and it's the one that heard the most. I want it.", "It's still counting. Even in my hand. I'm going to put it under a bucket. I'm going to put the bucket under a bigger bucket."],
  ['zsx8', 'halden14', 39, 'Ghosts in the Wire', 'spire', C(['signalghost'], 'Echo', 6, 'Catch 6 echoes from the signal ghosts'), "The signal ghosts are made of echoes. If I catch six, I can play them back slow, and hear the rest of the song.", "There's more to the song. Under 'found one, lit, come'. Something like an answer. Very quiet. Very far."],
  ['zsx9', 'ammara14', 39, 'Rim Walk', 'rim', K(['eaterfrag', 'wreckwalker', 'hunterdrone'], 12, 'Clear 12 things along the crater rim', 'rim', 220), "Walk the rim with me. I want to see the whole crater. Twelve things will want to stop us. Let's not let them.", "From up here you can see it all. It's not a crater. It's a footprint. Something stepped here."],
  ['zsx10', 'sorrel14', 39, 'Legion Honours', 'cratercamp', TK('Stand for the Legion\'s honours'), "The Legion gives out honours tonight. Crane's getting one for bravery. He doesn't know. Don't tell him. You're getting one too. Don't tell you.", "Iron Star of Corrand. Second class. First class is for dying. Don't."],
  ['zsx11', 'crane14', 39, 'Walker Legs', 'hullfield', C(['wreckwalker'], 'Walker Leg', 4, 'Bring Crane 4 walker legs'), "I want to build something. Something that walks. Four legs. Don't ask. You'll see.", "It walks. It walks into things, mostly. It's carrying Sorrel's tent. She doesn't know yet."],
  ['zsx12', 'wenna14', 39, 'The Pilgrims\' Stone', 'pilgrims', I('covshrine', 1, 'Knock over the last Covenant shrine, the one Wenna built'), "There's one shrine left. The one at the Pilgrims' Stone. I built it. With my hands. I want you to knock it over and I want to watch.", "There. It's gone. Ansel helped me build it. He'd understand. He'd laugh. He'd have knocked it over himself."],
  ['zsx13', 'halden14', 39, 'Starlight', 'lookout', TK('Sit up with Halden and watch the sky'), "Sit with me. Just for an hour. I've watched the sky alone for forty years. I'd like company, now that I know what's out there.", "Nothing moved. All night. I'm going to call that a good night. We'll need a few more of those."],
  ['zsx14', 'ammara14', 39, 'Letters to Mira', 'cratercamp', A('lookout', 'Carry Ammara\'s letter to the Lookout\'s runner, for Mira'), "Mira needs to know what we've found. Take this to the runner at the Lookout. Don't read it. Read it if you want. It doesn't say anything nice.", [["halden14", "For Mira? The runner's gone east already. I'll send it with the next one. Is it bad? It's bad, isn't it."]]],
]);
QUESTS.push(...finish40([...camp, ...field, ...spire, ...wreck, ...more]));
