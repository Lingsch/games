// Build 15: the Waking Heart (levels 44-45). The top of the silver thread, on the moon itself. Grey dust, black sky,
// and Hulrouhn hanging overhead, blue and green and very small. You bound when you walk. Under the dust, the Sleeper's
// shell; under the shell, its eye. Vesper Varrow is at the eye with everyone who climbed, singing it awake. Down on
// Hulrouhn, every Lamplighter is waiting with a lamp for the signal to sing it back to sleep.
import { S, X, chat } from './core.js';
import { QUESTS, MOBS } from './data.js';
import { TALK, MOB_LORE } from './dialogue.js';
import { LORE } from './story.js';
import { defineZone, defineDungeon } from './kit9.js';
import { mob, boss, rboss, B, U, HU, tier, giver } from './hi9.js';
import * as Rep from './rep6.js';
import { pfill } from './vf13.js';
import { side, props14, K, C, N, A, I, TK } from './l14.js';
import { finish45, addDungeon45, addRaid45, st15, MW } from './l15.js';

Object.assign(MOBS, {
  dreamling: mob('Dreamling', 'larvagold15', { ...B, hpM: 1.5, spd: 5.4, weak: 'holy', resist: 'arcane' }),
  dustgolem: mob('Moondust Golem', 'golempet~spectral', { hpM: 2, spd: 4.4, scale: 1.2, weak: 'storm', ore: true }),
  watcheye: mob('Watching Eye', 'sleeper15', { hpM: 1.4, scale: .45, fly: .8, range: 18, ranged: true, caster: true, school: 'arcane', weak: 'holy' }),
  ascended: mob('Ascended Moonsworn', 'wraith~spectral', { ...U, hpM: 1.3, fly: .5, range: 16, ranged: true, caster: true, school: 'arcane', weak: 'holy' }),
  hallowed: mob('Vesper\'s Hallowed', 'cultist2~spectral', { ...HU, hpM: 1.6, weak: 'shadow' }),
  // named, out on the moon
  oldcrater15: boss('The Thing in the Old Crater', 'golempet~gilded', { scale: 3, weak: 'storm', mechs: ['slam', 'knock', 'call'], adds: 'dustgolem', lines: { start: '*Something has been sitting in this crater for ten thousand years, waiting for something to happen. Something is happening.*', half: '*It stands up, very slowly, and the dust falls off it for a long time.*' } }),
  wanderingeye15: boss('The Wandering Eye', 'sleeper15', { scale: 1, fly: 1, range: 20, ranged: true, caster: true, school: 'arcane', weak: 'holy', mechs: ['volley', 'fear', 'call'], adds: 'watcheye', lines: { start: '*One of its eyes has come loose and is looking for you.*', half: '*It blinks. Everything goes dark for a second.*' } }),
  // the Sea of Dust (open, 44)
  dustwyrm15: boss('The Dust-Wyrm', 'eel14', { scale: 3.4, weak: 'storm', mechs: ['charge', 'pool', 'knock'], lines: { start: '*It swims through the dust like a fish through water, and comes up under you.*', half: '*It dives.*' } }),
  seren15: boss('Captain Seren of the Hallowed', 'cultist2~spectral', { ...HU, scale: 1.6, mechs: ['cleave', 'call', 'charge'], adds: 'hallowed', lines: { start: 'You climbed the thread? So did I. Isn\'t it beautiful up here? Look at the world. Look how small it is.', half: 'We\'ll be bigger than that soon. All of us.' } }),
  dustheart15: boss('The Heart of the Dust', 'golempet~spectral', { hpM: 1.9, scale: 3.8, weak: 'storm', mechs: ['slam', 'pool', 'spawn', 'enrage'], adds: 'dustgolem', lines: { start: '*The dust of the sea pulls together into a heart, and the heart starts to beat.*', half: '*The sea moves with it.*' } }),
  // the Eyelid (open, 45)
  lashes15: boss('The Lashes', 'spider~spectral', { scale: 3, mechs: ['web', 'spawn', 'pool'], adds: 'dreamling', lines: { start: '*Round the edge of the Eyelid, the moon grows lashes, each as long as a tree. They move.*', half: '*They flutter.*' } }),
  dreamer15: boss('The Dreamer', 'wraith~spectral', { scale: 2.4, fly: .6, range: 18, ranged: true, caster: true, school: 'arcane', mechs: ['fear', 'volley', 'heal'], adds: 'ascended', lines: { start: '*The Sleeper\'s dream of you, walking about, trying to understand what you are.*', half: '*It looks like you now. Nearly.*' } }),
  thelid15: boss('The Lid', 'sleeper15', { hpM: 2, scale: 2.2, weak: 'holy', resist: 'arcane', range: 20, ranged: true, caster: true, school: 'arcane', mechs: ['fear', 'pool', 'call', 'knock', 'enrage'], adds: 'watcheye', lines: { start: '*The Eyelid itself, a plain of shell as big as a valley, is lifting. Under it, something wet and violet.*', half: '*It lifts higher.*' } }),
  // the Moonhold (instance, 44-45)
  mh_gate15: boss('The Hallowed Gate', 'construct14~gilded', { scale: 2.6, weak: 'storm', mechs: ['slam', 'shield', 'call'], adds: 'hallowed', lines: { start: 'ONLY THE HALLOWED MAY ENTER.', half: 'YOU ARE NOT HALLOWED. YOU ARE ENTERING ANYWAY.' } }),
  mh_garden15: boss('The Moon Garden', 'treant~spectral', { scale: 2.8, weak: 'fire', mechs: ['web', 'spawn', 'heal'], adds: 'dreamling', lines: { start: '*Vesper planted a garden on the moon, from seeds she carried up the thread. Everything in it has the Sleeper\'s dreams in it now.*', half: '*It blooms violet.*' } }),
  mh_choir15: boss('The Hallowed Choir', 'choir', { hpM: 1.6, scale: 2.4, fly: .5, range: 18, ranged: true, caster: true, school: 'arcane', mechs: ['fear', 'volley', 'call'], adds: 'ascended', lines: { start: '*Everyone who climbed the thread, singing in Vesper\'s hall. Wake up. Wake up. Wake up.*', half: '*Below the hall, something stirs in time with the song.*' } }),
  mh_ilsandre15: boss('Ilsandre, First of the Hallowed', 'cultist1~spectral', { ...HU, hpM: 2, scale: 1.6, range: 18, ranged: true, caster: true, school: 'arcane', mechs: ['heal', 'call', 'fear', 'pool', 'enrage'], adds: 'hallowed', lines: { start: 'I was the first to climb after her. I held her hand at the top. She is at the Eye. You will not reach her.', half: 'She promised. She promised we would see everything.' } }),
  // the Waking Heart (24-person raid)
  wk_dream24: rboss('The Dream of Hulrouhn', 'wraith~spectral', { hpM: 2.3, scale: 3, fly: .8, range: 20, ranged: true, caster: true, school: 'arcane', mechs: ['fear', 'volley', 'pool', 'heal', 'aura'], auraK: .1, adds: 'dreamling', lines: { start: '*The Sleeper is dreaming of your world. Here it is: every town you\'ve walked through, small and lit and tasty, turning in the dark.*', half: '*The dream gets hungrier.*' } }),
  wk_host24: rboss('The Hallowed Host', 'cultist2~spectral', { hpM: 2.4, scale: 2.2, mechs: ['cleave', 'charge', 'call', 'shield'], adds: 'hallowed', lines: { start: '*Everyone Vesper brought up the thread, between you and the Eye. They are not afraid. They have never been less afraid.*', half: '*They link arms.*' } }),
  wk_vesper24: rboss('Vesper Varrow, at the Eye', 'cultist1~spectral', { hpM: 2.8, scale: 1.6, fly: .5, range: 22, ranged: true, caster: true, school: 'arcane', mechs: ['volley', 'fear', 'heal', 'call', 'pool', 'aura', 'enrage'], auraK: .12, adds: 'ascended', lines: { start: 'Lamplighter. You came all this way. You lit every shrine I asked for, in the Reach. You broke every mirror. You climbed my thread. Look down. Look at your little lit world. Wouldn\'t you like to be more than that?', half: 'It is opening! Can\'t you feel it? It sees me! It SEES me!' } }),
  wk_sleeper24: rboss('The Sleeper', 'sleeper15', { hpM: 3.8, scale: 4.6, weak: 'holy', resist: 'arcane', school: 'arcane', range: 7, mechs: ['cleave', 'pool', 'fear', 'call', 'knock', 'aura', 'spawn', 'enrage'], auraK: .2, adds: 'watcheye', lines: { start: '*The Eye opens. It is violet, and patient, and very young, and it has never in its life seen anything that was not food. It looks at you. It looks past you, at Hulrouhn.*', half: '*Far below, on the dark side of the world, a light comes on. Then another. Then thousands.*' } }),
});
Object.assign(MOB_LORE, {
  dreamling: 'The Sleeper\'s dreams, walking about on its moon. They are shaped like what it dreams about. Lately, that is grubs, and you.',
  hallowed: 'The ones who climbed Vesper\'s thread and lived. They call themselves the Hallowed, and they are waiting to be lifted up into the light between the stars.',
  wk_vesper24: 'Vesper Varrow, who founded the Dusk Covenant, lit the Reach, the Hollows, the towers and the thread, and climbed to the moon to wake the thing inside it. She has never doubted anything in her life.',
  wk_sleeper24: 'A young star-eater, borrowed by the Starwrights from the things that make them, and put to sleep inside Hulrouhn\'s moon ten thousand years ago. Vhorun fed it. Vesper woke it. You have a lullaby.',
});
giver('ilsa15', 'Ilsa, Who Came Down', 'Tetherfoot · once one of the Hallowed', 'villager2');
Object.assign(TALK, {
  ilsa15: { bio: 'Ilsa climbed the thread with the Hallowed, and reached the top, and looked down at Hulrouhn, and saw her own village, and turned round. She was halfway back down when you came up. She came back up with you.',
    greet: ["I saw my village. From up here. You can see everything. I could see the smoke from my mum's chimney. I wanted to go home.", "Vesper's at the Eye. She doesn't sleep. She doesn't eat. She sings."], topics: [] },
});
Object.assign(LORE, {
  vespersong: { title: 'Vesper\'s Song', where: 'moonhold', text: "Written on the wall of Vesper's hall in the Moonhold, over and over: 'Wake up, wake up, the lamps are lit, the world is small and bright and waiting. Wake up and see us. Wake up and lift us out.' At the bottom, in a different, smaller hand, very recent: 'Mum, I'm sorry. — Ilsa.'" },
  lastpage: { title: 'Seventh\'s Last Page', where: 'tetherfoot', text: "In Seventh's hand: 'The lenders keep very good accounts. They lent us one of their children, ten thousand years ago, and they will want it back. Not soon. Two thousand years, Halden thinks, before its dream reaches them, if it dreams loudly enough. When they come, I hope there is still someone with a lamp. — S.'" },
});
X.VEND = Object.assign(X.VEND || {}, { tetherfoot: ['Unit Twelve', 'automaton14'], quietcrater: ['Moonwatch Supply', 'villager3'] });
X.inspectSay = Object.assign(X.inspectSay || {}, {
  hallowedcamp: ['A Hallowed camp, abandoned in a hurry. Bedrolls, lamps, a hymnal. You take the lamps.', 'A camp of the Hallowed. Someone has written their name in the dust, and a drawing of Hulrouhn. You leave it.'],
  bootprint: ['Bootprints in the moondust. A thousand of them, all heading to the Eye. You follow them a while.', 'A single set of bare footprints. Small. Going toward the Eye. Vesper\'s, Ilsa says.'],
  earthshard: ['A shard of something that fell up from Hulrouhn: a roof-tile, from a village, carried up with the lights. You take it home.', 'A cup. From Hulrouhn. It fell up, with the stolen lights, a long time ago. Someone drank tea from it once.'],
  eyevein: ['A violet vein in the dust, pulsing. You cut it. The ground shivers.', 'You cut the vein. Somewhere under you, an eye flinches.'],
});
X.objVerb = Object.assign(X.objVerb || {}, { eyevein: 'Cut the vein', earthshard: 'Pick it up' });

const W = { zone: 'wh15' }, MOON = ['dreamling', 'dustgolem', 'watcheye'], HALL = ['ascended', 'hallowed'];
for (const m of [...MOON, ...HALL]) Rep.KILL_REP[m] = ['moon15', 6];
X.arriveHooks.push((zone, from) => zone === 'wh15' ? { x: 0, z: 455 } : null);
defineZone('wh15', {
  size: 500, seed: 15053, name: 'The Waking Heart', bossName: 'The Sleeper', hiH: 14, maxSpawnH: 30,
  land: (x, z, N) => { let h = 5 + N.fbm(x * .005, z * .005, 3) * 8; for (const [cx, cz, r] of [[-200, 100, 90], [180, -60, 70], [0, -260, 140], [260, 260, 60], [-300, -300, 80]]) { const d = Math.hypot(x - cx, z - cz) / r; if (d < 1.3) h += d < 1 ? -(1 - d * d) * 9 : (1.3 - d) * 12; } return Math.max(1.5, h); },
  pal: { a: '#9a9aa4', b: '#8a8a94', hi: '#b8b8c4', road: '#c8c8d0', cob: '#d8d8e0', low: '#5a5a68' },
  towns: [{ key: 'tetherfoot', name: 'Tetherfoot', x: 0, z: 380, R: 28, wall: 'stones', gates: [Math.PI / 2, Math.PI * 1.5], guardName: 'Lamplighter', guardKind: 'aegis1',
    houses: [[-12, 10, .4, 'tent', 4, 4], [12, 10, -.4, 'tent', 4, 4], [-14, -10, .2, 'tent', 5, 4]], props: [[0, 4, 'lantern'], [-6, 0, 'lantern'], [6, 0, 'lantern'], [0, -6, 'banner', '#ffd27a'], [10, -12, 'moonbeam']],
    npcs: [['giver', 'seventh14', 0, 0], ['giver', 'ammara14', -8, 6], ['giver', 'ilsa15', 8, -4], ['giver', 'vesk15', 4, 9], ['vendor', 'tetherfoot', 8, 6], ['bind', null, 3, -4], ['armory', null, -6, -6]], guards: [[2, 26], [-2, 26]] },
    { key: 'quietcrater', name: 'The Quiet Crater', x: -330, z: -40, R: 24, wall: 'stones', gates: [0, Math.PI / 2], guardName: 'Moonwatcher', guardKind: 'aegis1',
      houses: [[-6, 6, .3, 'tent'], [8, -6, -.4, 'tent']], props: [[0, 0, 'lantern'], [4, 4, 'banner', '#b07aff'], [-6, -8, 'ring']],
      npcs: [['giver', 'halden15', -5, -2], ['giver', 'unitnine14', 5, 4], ['giver', 'crane15', -2, 8], ['vendor', 'quietcrater', 6, -4], ['bind', null, 0, 6]], guards: [[22, 2], [22, -2]] }],
  roads: [[0, 470, 0, 340], [0, 340, 40, 120], [40, 120, -330, -40], [40, 120, 280, -40], [40, 120, 0, -380]],
  regions: { names: ['Tetherfoot', 'The Quiet Crater', 'The Sea of Dust', 'The Eyelid', 'The Eye'], fn: (x, z) => z < -260 ? 4 : z > 240 ? 0 : x < -220 ? 1 : x < 140 ? 2 : 3 },
  open: [{ key: 'dustsea', name: 'The Sea of Dust', x: -60, z: 0, R: 34, deco: 'moonrock', decoN: 14, ring: true, gap: 0, centre: 'crater', lvl: [44, 44], area: 2,
      packs: [[-18, 0, ['dustgolem', 'dreamling']], [18, 0, ['hallowed', 'ascended']], [0, -18, ['dreamling', 'dreamling', 'watcheye']], [0, 18, ['dustgolem', 'hallowed']]],
      bosses: [[-22, -18, 'dustwyrm15', 44], [22, -20, 'seren15', 44], [0, -4, 'dustheart15', 44, true]] },
    { key: 'eyelid', name: 'The Eyelid', x: 300, z: -80, R: 34, deco: 'vein', decoN: 18, centre: 'shellwall', lvl: [45, 45], area: 3,
      packs: [[-18, 0, ['watcheye', 'watcheye', 'dreamling']], [18, 0, ['ascended', 'hallowed']], [0, -18, ['dreamling', 'watcheye', 'ascended']], [0, 18, ['hallowed', 'dustgolem']]],
      bosses: [[-22, -18, 'lashes15', 45], [22, -20, 'dreamer15', 45], [0, -4, 'thelid15', 45, true]] }],
  doors: [{ to: 'moonhold', name: 'The Moonhold', x: -280, z: -300, ry: 0, label: 'Enter the Moonhold (44-45)', col: '#b07aff' },
    { to: 'wakingheart', name: 'The Waking Heart', x: 0, z: -400, ry: 0, label: 'Go down into the Waking Heart (24-person raid)', col: '#ffffff' }],
  landmarks: [{ g: 'crater', x: 0, z: -260, name: 'The Eye', R: 40, clear: 20, s: 6 }, { g: 'moonbeam', x: 0, z: 420, name: 'The Top of the Thread', R: 10, clear: 6, s: 1.4 }],
  lines: [{ x: 0, z: 488, to: 'sh15', label: 'Down the silver thread, back to the Shell', ry: 0 }],
  spots: { tetherfoot: { x: 0, z: 380 }, tetherroad: { x: 20, z: 240 }, quietcrater: { x: -330, z: -40 }, dustsea: { x: -60, z: 0 }, eyelid: { x: 300, z: -80 }, earthview: { x: 260, z: 260 },
    oldcrater: { x: -200, z: 100 }, moonhold: { x: -280, z: -290 }, eye: { x: 0, z: -380 }, hallowedroad: { x: 160, z: 60 } },
  scatter: [[40, [-480, 480, 240, 480], ['dreamling', 'dustgolem', 'watcheye'], [44, 44], 0], [40, [-480, -220, -260, 240], ['dustgolem', 'dreamling', 'ascended'], [44, 44], 1],
    [44, [-220, 140, -260, 240], ['dreamling', 'hallowed', 'dustgolem', 'watcheye'], [44, 45], 2], [44, [140, 480, -260, 240], ['ascended', 'hallowed', 'watcheye'], [45, 45], 3],
    [48, [-480, 480, -480, -260], ['hallowed', 'ascended', 'watcheye', 'dreamling'], [45, 45], 4]],
  camps: [[6, [140, 480, -260, 240], ['hallowed', 'hallowed', 'ascended'], [45, 45], 3, 'hw'], [5, [-480, 480, -480, -260], ['hallowed', 'ascended', 'ascended'], [45, 45], 4, 'ha']],
  rares: [[[-480, -220, -260, 240], 'oldcrater15', 44, false], [[140, 480, -260, 240], 'wanderingeye15', 45, true]],
  hunt: [{ area: 0, lvl: [44, 44] }, { area: 1, lvl: [44, 44] }, { area: 2, lvl: [44, 45] }, { area: 3, lvl: [45, 45] }, { area: 4, lvl: [45, 45] }],
  labels: [{ t: 'Around Tetherfoot (44)', x: 0, z: 300 }, { t: 'The Quiet Crater (44)', x: -330, z: 40 }, { t: 'The Sea of Dust (44-45)', x: -60, z: 80 }, { t: 'The Eyelid (45)', x: 300, z: 0 }, { t: 'The Eye (45)', x: 0, z: -330 }],
  scenery: { density: 5000, tuft: '#8a8a94', kinds: [['moonrock', .02, .6, 2], ['crater', .006, .8, 2], ['silvercrack', .006, .8, 1.6], ['vein', .004, .6, 1.2]] },
  sky: { fog: '#0a0a14', top: '#000004', hor: '#101028', k: 1, far: 300, sun: 1.3 },
  after: ({ rng }) => props14([['hallowedcamp', 'An abandoned Hallowed camp', 'cache14', 160, 60, 5, 120], ['bootprint', 'Footprints in the dust', 'carving14', 40, -120, 5, 130], ['earthshard', 'Something that fell up', 'salvage14', 260, 260, 6, 110],
    ['eyevein', 'A violet vein', 'coil14', 260, -140, 6, 100], ['vsong', 'Writing on the wall', 'lorebook', -274, -284, 1, 1, 'vespersong'], ['slast', 'Seventh\'s notebook', 'lorebook', 6, 386, 1, 1, 'lastpage']], rng),
});
defineDungeon({ key: 'moonhold', name: 'The Moonhold', parent: 'wh15', plan: 'nave', floor: '#b8b8c8', rock: '#1a1a28', fog: '#14142a', light: .5, lvl: [44, 45], prop: 'bluelamp',
  mobs: ['hallowed', 'ascended', 'dreamling', 'watcheye'], bosses: ['mh_gate15', 'mh_garden15', 'mh_choir15', 'mh_ilsandre15'], exitLabel: 'Back out onto the moon' });
defineDungeon({ key: 'wakingheart', name: 'The Waking Heart', parent: 'wh15', plan: 'nave', floor: '#7a6a9a', rock: '#0a0414', fog: '#1a0a2a', light: .48, lvl: [45, 45], prop: 'bluelamp', raid: true,
  mobs: ['dreamling', 'watcheye', 'hallowed', 'ascended'], bosses: ['wk_dream24', 'wk_host24', 'wk_vesper24', 'wk_sleeper24'], exitLabel: 'Climb back up to the surface' });
addDungeon45('moonhold', 'The Moonhold', [44, 45]); addRaid45('wakingheart', 'The Waking Heart', 24, 45);
tier({ dustsea: 26, eyelid: 26, moonhold: 26, wakingheart: 27 });
X.kill.push(m => {
  if (m.mob === 'wk_vesper24' && !st15().vesper) {
    st15().vesper = true;
    chat('sys', null, 'Vesper Varrow falls at the edge of the Eye, still smiling, still looking into it. "It saw me," she says. "It saw me." Then nothing.');
  }
  if (m.mob === 'wk_sleeper24' && !st15().asleep) {
    st15().asleep = true;
    chat('sys', null, 'On Hulrouhn, on the dark side of the world, every lamp comes on at once. Deepwatch. The Reach. Bellglass. Cinderford. New Hollin. Pip\'s ugly one. Everyone hums.');
    setTimeout(() => chat('sys', null, 'The Sleeper looks down at all those little lights, and hears the song it heard ten thousand years ago, and its eye closes.'), 4000);
    setTimeout(() => chat('sys', null, 'The moon stops falling. It is asleep. It will sleep for a very long time.'), 8000);
  }
});

// ---------- the story ----------
const pLine = (a, b) => (S.friends || []).some(f => f.parent) ? ['parent13', pfill(a)] : ['mira14', b];
QUESTS.push(...finish45([
  { id: 'zw1', story: true, giver: 'seventh14', lvl: 44, pre: 'zk9', name: 'Footprints on the Moon', where: 'tetherroad', ...W, rep: MW(400), obj: K(['dreamling', 'dustgolem'], 12, 'Clear 12 dreamlings and dust golems off the road from the thread', 'tetherroad', 240),
    say: ["We are on the moon. I have not been here in ten thousand years. It has not been dusted.", "The dust is dreaming. Things walk out of it. Twelve, and we can set up a camp. Mind how you walk. You will bounce. Everyone bounces. Do not laugh at Crane."],
    done: ["Twelve. Crane fell over. Twice. He laughed. I have never seen anyone laugh on the moon before. It is a nice sound, up here."] },
  { id: 'zw2', story: true, giver: 'ammara14', lvl: 44, pre: 'zw1', name: 'Hulrouhn From Above', where: 'earthview', ...W, rep: MW(300), obj: A('earthview', 'Climb to the crater rim east of Tetherfoot and look at Hulrouhn'),
    say: ["Come with me. East, to the crater rim. I want to look at it. The world. From here. I've flown higher than anyone, and I've never seen it all at once."],
    done: ["Look at it. Blue. Green. White at the top. All of it. Everyone. ...I'm not crying. Halcyon don't cry. I'm a Lamplighter now. Lamplighters can cry."] },
  { id: 'zw3', story: true, giver: 'halden15', lvl: 44, pre: 'zw1', name: 'Vesper\'s Trail', where: 'hallowedroad', ...W, rep: MW(400), obj: I('bootprint', 4, 'Follow 4 sets of footprints toward the Eye'),
    say: ["I came up. Of course I came up. Somebody has to measure the moon from the moon. Follow the footprints. A thousand pairs. And one pair of bare feet. Four places. I want to know where they all went."],
    done: ["All of them go to the Eye. The bare ones go furthest. Right to the edge. She's standing on its eyelid. Singing."] },
  { id: 'zw4', story: true, giver: 'ilsa15', lvl: 44, pre: 'zw2', pre2: 'zw3', name: 'Ilsa', where: 'tetherfoot', ...W, rep: MW(400), obj: TK('Hear Ilsa\'s story'),
    say: [["ilsa15", "I climbed with them. With Vesper. All the way. At the top she told us to look down at the world, and see how small it was, and how small we were."], ["ilsa15", "I looked down. And I saw my village. My mum's chimney. And I didn't feel small. I felt far away. I wanted to go home."], ["ilsa15", "She's at the Eye. She's got everyone who climbed. They call themselves the Hallowed now. She sings and it moves. Every verse, it moves."]],
    done: [["ilsa15", "I'll show you the way. I know where the Hallowed camp. I know the Moonhold, her hall. I know the song. The wrong one."], ["seventh14", "And now you will learn the right one. Sit with me, Ilsa."]] },
  { id: 'zw5', story: true, giver: 'ilsa15', lvl: 44, pre: 'zw4', name: 'The Sea of Dust', where: 'dustsea', ...W, rep: MW(500), obj: N('dustheart15', 'Cross the Sea of Dust and break the Heart of the Dust'),
    say: ["Between here and the Eye is a sea of dust. It moves. Something in the middle of it beats. Vesper says it's the moon's heart. It isn't. It's just dust that's dreaming it's a heart. Break it."],
    done: ["It stopped. The sea's still. You can walk across it now. I walked across it. My mum would kill me."] },
  { id: 'zw6', story: true, giver: 'halden15', lvl: 45, pre: 'zw5', name: 'The Eyelid', where: 'eyelid', ...W, rep: MW(500), obj: N('thelid15', 'Climb onto the Eyelid and stop the Lid lifting'),
    say: ["East of the Eye is the Eyelid. A plain of shell. It's lifting. A little every hour. My instruments say it's lifting. My eyes say it too.", "Stop it lifting. Hold it shut as long as you can. Every hour is an hour Mira's runners have to reach another village."],
    done: ["It dropped. A little. Holding. My instruments say holding. My eyes say holding. I'm going to sit down on the moon now."] },
  { id: 'zw7', story: true, giver: 'seventh14', lvl: 45, pre: 'zw6', name: 'The Moonhold', where: 'moonhold', ...W, rep: MW(600), obj: N('mh_ilsandre15', 'Go into the Moonhold and stop Ilsandre, First of the Hallowed'),
    say: ["Vesper built a hall on the moon. The Moonhold. Her Hallowed live there when they are not at the Eye. Her first follower keeps it. Ilsandre.", "Go in. Stop her. Then Vesper is alone at the Eye, with only the ones still singing."],
    done: ["'She promised we would see everything.' Yes. They would have. Everything sees everything, out there. That is why we hid you."] },
  { id: 'zw8', story: true, giver: 'seventh14', lvl: 45, needLvl: 45, pre: 'zw7', name: 'The Waking Heart', where: 'eye', ...W, rep: MW(2500), obj: N('wk_sleeper24', 'Go down into the Waking Heart, stop Vesper, and sing the Sleeper back to sleep (24-person raid)'),
    get say() { return ["Mira has sent word to every village. Every lamp on Hulrouhn is waiting. When you reach the Eye, Halden will signal from the rim. Every lamp comes on, all at once, and everyone hums.", pLine("{rel} is down there with a lamp. {She} sent word up the thread. '{you}, I'm holding it as high as I can.'", "Pip is down there with his ugly lamp. Hesk. Brack. Abigail. Everyone. Holding them as high as they can."), "Go down into the heart. Stop Vesper. Then stand in front of its eye, and sing. Twenty-four. Everyone who climbed."]; },
    done: [["seventh14", "It is asleep. Its eye is closed. The moon has stopped falling."], ["halden15", "I saw them. From the rim. Every lamp on the dark side of Hulrouhn, all at once. Like the whole world was a candle."], ["seventh14", "That is what it saw. Ten thousand years ago it saw a sky full of stars and fell asleep. Tonight it saw a world full of lamps. I think it liked them better."]] },
  { id: 'zw9', story: true, giver: 'seventh14', lvl: 45, pre: 'zw8', name: 'Two Thousand Years', where: 'tetherfoot', ...W, rep: MW(800), obj: TK('Stand with the Lamplighters at the top of the thread'),
    say: [["seventh14", "Before we go down. I have to tell you one more thing. While it was waking, it dreamed. Out loud. A cry, the way a child cries in its sleep. It went out, past the curtain."], ["seventh14", "The lenders keep very good accounts. They lent us one of their children. In time, they will hear it, and they will come to collect."], ["halden15", "How long?"], ["seventh14", "Halden?"], ["halden15", "...If it travels like light. Two thousand years. Give or take."]],
    get done() { return [["ammara14", "Two thousand years. Then we have two thousand years to get ready."], ["seventh14", "You will not be here. Neither will I, perhaps. But someone with a lamp will be. The Lamplighters will be. Make sure of it."], pLine("{rel} says {she}'ll start a school. For Lamplighters. {She} says two thousand years is a lot of children to teach.", "Mira says she'll start a school. For Lamplighters. She says two thousand years is a lot of children to teach."), ["seventh14", "Light it. Keep it lit. Light the next one. That is the whole of it. Now. Shall we go home?"]]; } },
]));
X.turnin.push(q => { if (q.id === 'zw9') setTimeout(() => chat('sys', null, 'The Lamplighters of Hulrouhn: the Sleeper sleeps, the curtain holds, and the order you founded will keep the lamps lit for two thousand years. What comes to collect is another story.'), 1500); });

// ---------- the smaller roads ----------
const foot = side('wh15', MW, 'zw1', [
  ['zwf1', 'vesk15', 44, 'Bounce', 'tetherroad', A('tetherroad', 'Bound down the road from the thread as far as you can in one go'), "Low gravity. I've waited my whole life to bounce. Race me. Down the road. Biggest bounces win.", "You won. I fell in a crater. It was the best fall of my life."],
  ['zwf2', 'ammara14', 44, 'Watching Eyes', 'tetherroad', K(['watcheye'], 10, 'Put out 10 of the eyes floating round Tetherfoot', 'tetherroad', 260), "Little eyes, floating. Watching the camp. It sends them. Ten. I don't like being watched by a moon.", "Ten. It can't see the camp now. Small mercies, on a big moon."],
  ['zwf3', 'seventh14', 44, 'Things That Fell Up', 'earthview', I('earthshard', 4, 'Gather 4 things that fell up from Hulrouhn with the stolen light'), "When Vhorun ate a light, it rose. Sometimes it brought things with it. Cups. Tiles. A shoe. They are scattered on the moon. Bring four home."],
  ['zwf4', 'vesk15', 44, 'Dust Golems', 'tetherroad', K(['dustgolem'], 8, 'Break 8 moondust golems', 'tetherroad', 260), "The dust stands up and walks about. Eight. I'm making a path. Bouncing paths need clearing."],
  ['zwf5', 'ilsa15', 44, 'Hallowed Camps', 'hallowedroad', I('hallowedcamp', 4, 'Search 4 abandoned Hallowed camps'), "The Hallowed camped on the way to the Eye. Left things. Lamps, mostly. Bring the lamps back. They're lamps from home."],
  ['zwf6', 'ammara14', 44, 'Halcyon Wings', 'earthview', TK('Watch Ammara fly on the moon'), "Low gravity. I can fly properly here. Higher than I've ever flown. Watch me. If I don't come down, tell Mira I was happy."],
  ['zwf7', 'seventh14', 44, 'Ten Thousand Years of Dust', 'tetherfoot', TK('Help Seventh sweep the place where the Starwrights stood'), "There is a place near Tetherfoot where we stood, when we put it to sleep. Seven of us. Help me sweep it. Unit Nine would want me to."],
  ['zwfd', 'vesk15', 44, 'Path Clearing', 'tetherroad', K(['dreamling', 'dustgolem', 'watcheye'], 8, 'Clear 8 things off the bounce path', 'tetherroad', 240), "Eight a day. The path keeps filling.", "Clear. Same tomorrow.", { daily: true }],
]);
const crater = side('wh15', MW, 'zw3', [
  ['zwc1', 'halden15', 44, 'The Quiet Crater', 'quietcrater', K(['dreamling', 'dustgolem'], 10, 'Clear 10 things from round the Quiet Crater', 'quietcrater', 240), "The Quiet Crater. Best seeing on the moon. I'm building an observatory. On the moon. Clear ten things off my lawn."],
  ['zwc2', 'unitnine14', 44, 'Unit Nine on the Moon', 'quietcrater', TK('Hear Unit Nine\'s report'), "UNIT NINE REPORTS. Unit Nine has come up the thread. Unit Nine does not need air. Unit Nine is the only one who does not need air. Unit Nine is useful."],
  ['zwc3', 'crane15', 44, 'Moon Rock', 'quietcrater', C(['dustgolem'], 'Moon Rock', 6, 'Bring Crane 6 samples of moon rock'), "Six samples. Real moon rock. I'm going to be the first engineer to build something out of the moon. A bench, probably. I'm tired."],
  ['zwc4', 'halden15', 44, 'The Thing in the Old Crater', 'oldcrater', N('oldcrater15', 'Wake and defeat the thing sitting in the Old Crater'), "There's something sitting in the Old Crater. It hasn't moved in ten thousand years. My instruments say it's started breathing."],
  ['zwc5', 'unitnine14', 44, 'Lamps on the Moon', 'quietcrater', C(['ascended'], 'Cold Light', 5, 'Take 5 cold lights from the Ascended Moonsworn'), "UNIT NINE REPORTS. The Quiet Crater needs lamps. Unit Nine is very good at sweeping and very bad at lamps. The Ascended carry cold lights. Five."],
  ['zwc6', 'crane15', 44, 'A Bench', 'quietcrater', TK('Sit on Crane\'s bench'), "It's a bench. Made of moon. The first thing ever built on the moon by people. Sit on it. Look at the world. Tell me it's a good bench."],
  ['zwc7', 'halden15', 45, 'The Signal', 'earthview', A('earthview', 'Set Halden\'s signal-lamp on the crater rim'), "When it's time, I'll signal from the rim. A lamp. A big one. Every village is watching for it. Set it up on the rim. Point it at home."],
  ['zwcd', 'halden15', 44, 'Observatory Watch', 'quietcrater', K(['dreamling', 'watcheye'], 8, 'Keep 8 things away from the observatory', 'quietcrater', 240), "Eight a day. The telescope's very expensive. And on the moon.", "Kept. Same tomorrow.", { daily: true }],
]);
const sea = side('wh15', MW, 'zw4', [
  ['zws1', 'ilsa15', 44, 'Captain Seren', 'dustsea', N('seren15', 'Stop Captain Seren of the Hallowed in the Sea of Dust'), "Seren was a ship's captain. She climbed first after Ilsandre. She guards the sea crossing. She was kind to me on the thread. She gave me her water."],
  ['zws2', 'vesk15', 44, 'The Dust-Wyrm', 'dustsea', N('dustwyrm15', 'Kill the Dust-Wyrm swimming in the Sea of Dust'), "Something swims in the dust. Comes up under you. I've been bounced into the air by it twice. Kill it before it gets a third."],
  ['zws3', 'ilsa15', 44, 'Hallowed', 'dustsea', K(['hallowed', 'ascended'], 12, 'Stop 12 of the Hallowed in the Sea of Dust', 'dustsea', 200), "The Hallowed cross the sea to the Eye in shifts. Twelve. Fewer singing. I knew most of them. I'm going to stop saying that."],
  ['zws4', 'seventh14', 44, 'Dreamlings', 'dustsea', C(['dreamling'], 'Dream', 6, 'Catch 6 dreams from the dreamlings'), "The dreamlings carry its dreams. Six. I want to know what it is dreaming now. Close to waking. It will be dreaming of breakfast."],
  ['zws5', 'ammara14', 44, 'Crossing', 'dustsea', A('dustsea', 'Cross the Sea of Dust with Ammara flying overhead'), "I'll fly. You walk. I'll call out when something's coming up under you. Trust me. Look up, not down."],
  ['zws6', 'ilsa15', 45, 'Mum', 'tetherfoot', TK('Help Ilsa write to her mother'), "I want to write to my mum. Send it down the thread. I don't know what to say. 'I went to the moon and came back'? She'll think I've gone mad."],
  ['zws7', 'vesk15', 45, 'The Old Weaver\'s Thread', 'dustsea', C(['dreamling', 'dustgolem'], 'Moon Thread', 4, 'Gather 4 lengths of moon-thread for Vesk\'s rope'), "I'm making a rope to go down into the Eye. If we have to. Moon-thread's the only thing strong enough. Four."],
]);
const lid = side('wh15', MW, 'zw5', [
  ['zwl1', 'halden15', 45, 'Violet Veins', 'eyelid', I('eyevein', 4, 'Cut 4 of the violet veins round the Eyelid'), "The veins round the Eyelid pump something up into it. Waking fluid, Crane calls it. He made that up. Cut four."],
  ['zwl2', 'seventh14', 45, 'The Lashes', 'eyelid', N('lashes15', 'Cut down the Lashes round the Eyelid'), "Its lashes. As long as trees. They flutter when it dreams. They are fluttering a lot. Cut them. It will not miss them."],
  ['zwl3', 'ilsa15', 45, 'The Dreamer', 'eyelid', N('dreamer15', 'Stop the Dreamer walking the Eyelid'), "There's a dream of a person walking on the Eyelid. It looks a bit like everyone. It looked like me, when I passed it. Stop it. Before it looks like you."],
  ['zwl4', 'ammara14', 45, 'Watching Eyes, Many', 'eyelid', K(['watcheye', 'ascended'], 12, 'Put out 12 of the eyes and Ascended round the Eyelid', 'eyelid', 220), "The Eyelid's covered in little eyes. And Ascended guarding them. Twelve. We need it blind as long as we can."],
  ['zwl5', 'halden15', 45, 'The Wandering Eye', 'eyelid', N('wanderingeye15', 'Find the Wandering Eye somewhere near the Eyelid'), "One of its eyes has come loose. Wanders. Looks for us. Find it first."],
  ['zwl6', 'vesk15', 45, 'Rope Down', 'eye', A('eye', 'Fix Vesk\'s rope at the edge of the Eye'), "My rope. Fix it at the edge of the Eye. If anyone falls in, at least there's a rope. I'm not going to fall in. I'm going to hold the rope."],
  ['zwl7', 'crane15', 45, 'Waking Fluid', 'eyelid', I('eyevein', 2, 'Cut 2 more violet veins for Crane to study'), "Two more veins. I want to see what's in them. It's not waking fluid. I made that up. I want to know what it really is."],
]);
const hold = side('wh15', MW, 'zw6', [
  ['zwh1', 'seventh14', 45, 'The Hallowed Gate', 'moonhold', N('mh_gate15', 'Get past the Hallowed Gate of the Moonhold'), "Vesper took a Forge unit up the thread to guard her door. Unit Nine wants it freed. Get past it."],
  ['zwh2', 'ilsa15', 45, 'The Moon Garden', 'moonhold', N('mh_garden15', 'Cut down the Moon Garden in the Moonhold'), "Vesper planted a garden. From home. Apple seeds. Roses. It's all violet now. It's all dreaming. Cut it down. I helped plant it."],
  ['zwh3', 'halden15', 45, 'The Hallowed Choir', 'moonhold', N('mh_choir15', 'Silence the Hallowed Choir in the Moonhold'), "Every verse they sing, the Eyelid lifts. I've measured it. Silence them."],
  ['zwh4', 'ilsa15', 45, 'The Dream of Hulrouhn', 'wakingheart', N('wk_dream24', 'Wake from the Dream of Hulrouhn in the Waking Heart (24-person raid)'), "Inside the heart, it's dreaming of home. Our home. You'll walk through it. Don't stay. However nice it looks. It's not home. It's a menu."],
  ['zwh5', 'ammara14', 45, 'The Hallowed Host', 'wakingheart', N('wk_host24', 'Break through the Hallowed Host in the Waking Heart (24-person raid)'), "Everyone Vesper brought. Between you and the Eye. Arms linked. Break through."],
  ['zwh6', 'seventh14', 45, 'Vesper', 'wakingheart', N('wk_vesper24', 'Stop Vesper Varrow at the Eye (24-person raid)'), "She will be at the edge of the Eye. Singing. She will talk to you. Let her. Then stop her. She will not stop on her own. She has never stopped on her own."],
  ['zwh7', 'halden15', 45, 'Ready', 'earthview', TK('Tell Halden you\'re ready'), "Tell me when. I'll light the signal. Every village is waiting. Mira's at Deepwatch. Pip's at New Hollin. Brack's at Bellglass. Tell me when."],
]);
const more = side('wh15', MW, 'zw2', [
  ['zwx1', 'crane15', 44, 'Footprints', 'quietcrater', TK('Look at Crane\'s first footprint on the moon'), "Look. My footprint. In the dust. It'll be there forever. No wind on the moon. Forever. I'm going to cry and then I'm going to measure it."],
  ['zwx2', 'ammara14', 44, 'Earthrise', 'earthview', A('earthview', 'Watch Hulrouhn rise over the crater rim with Ammara'), "It rises. The world. Over the rim. Every few hours. Come and watch. I want to see it rise with someone who lives there."],
  ['zwx3', 'vesk15', 44, 'Bootprints', 'hallowedroad', I('bootprint', 1, 'Find the last set of footprints: the bare ones'), "One set of prints is bare feet. Small. Vesper's. Find the start of them. I want to know where she first stood."],
  ['zwx4', 'unitnine14', 44, 'Unit Nine Sweeps the Moon', 'quietcrater', K(['dustgolem', 'dreamling'], 10, 'Clear 10 things so Unit Nine can sweep a path', 'quietcrater', 260), "UNIT NINE REPORTS. The moon is dusty. Unit Nine is going to sweep it. All of it. Unit Nine has time. Unit Nine requests the dust stop attacking Unit Nine. Ten."],
  ['zwx5', 'ilsa15', 44, 'Hymnals', 'hallowedroad', C(['hallowed'], 'Hymnal', 4, 'Take 4 hymnals from the Hallowed'), "The Hallowed carry hymnals. The wrong song. Four. I'm going to write the right one in the back of each, and leave them where they'll find them."],
  ['zwx6', 'seventh14', 45, 'The Other Six', 'tetherfoot', TK('Ask Seventh if the others will come'), "You want to know if the six will come. Now that it nearly woke. Sit."],
  ['zwx7', 'halden15', 45, 'Measuring a Moon', 'eyelid', A('eyelid', 'Take a reading on the Eyelid for Halden'), "One more reading. On the Eyelid itself. I want to know how open. Exactly. Don't look down. There's an eye down there."],
  ['zwx8', 'crane15', 45, 'Moon Bench Two', 'quietcrater', C(['dustgolem'], 'Moon Rock', 4, 'Bring Crane 4 more moon rocks for a second bench'), "Another bench. For Halden. He's been standing for a week. Four rocks."],
  ['zwx9', 'ammara14', 45, 'Last Look', 'earthview', TK('Take one last look at Hulrouhn from the moon'), "Before the end. One last look. Whatever happens down there, I want to remember it from up here."],
  ['zwx10', 'vesk15', 45, 'Lark\'s Message', 'tetherfoot', TK('Read the message Lark sent up the thread'), "Lark sent a message. Up the thread. From Shellfoot. Tied to a rock. Read it to me. My hands are shaking."],
  ['zwx12', 'ilsa15', 44, 'Ascended', 'hallowedroad', K(['ascended'], 10, 'Put to rest 10 Ascended Moonsworn on the road to the Eye', 'hallowedroad', 260), "Some of the ones who climbed... changed. Up here. Ascended, they call it. Ten. They don't remember their names. I do.", "Ten. I said their names. Out loud. Up here there's no air to carry it, Crane says. I said them anyway."],
  ['zwx13', 'seventh14', 45, 'The Song, Once More', 'tetherfoot', TK('Practise the lullaby with Seventh one last time'), "Once more. The tune. Hum it with me. I want to hear it from you before we go down. In case I have forgotten how it goes. I have not forgotten. Hum it anyway.", "Yes. That is it. That is exactly it. Ten thousand years and it is exactly it."],
  ['zwx14', 'crane15', 45, 'Sealing the Thread', 'tetherfoot', C(['dustgolem'], 'Moon Rock', 3, 'Bring Crane 3 moon rocks to anchor the top of the thread'), "When this is over, the thread needs anchoring. Properly. So nothing comes down it. Ever. Three rocks. Big ones.", "Anchored. Nothing comes down this thread unless we say so. Engineering. The best kind. The kind that keeps things where they are."],
  ['zwx15', 'ammara14', 45, 'The Edge of the Eye', 'eye', A('eye', 'Walk to the edge of the Eye with Ammara, and look'), "Walk with me to the edge. Before we go down. I want to see it. The thing that hunted Hulrouhn. I want to look at it once, while it can't look back.", "...It's so young. Seventh said. I didn't believe her. It's a child. A hungry child. That doesn't make it better. It makes it worse."],
  ['zwx11', 'unitnine14', 45, 'Unit Nine\'s Lamp', 'quietcrater', TK('Watch Unit Nine light a lamp'), "UNIT NINE REPORTS. Unit Nine would like to hold a lamp when the signal comes. Unit Nine has never held a lamp. Unit Nine requests instruction."],
]);
const DONE_WH = { zwf3: "A cup. A tile. A shoe. A wooden horse, painted. Someone's. We will take them home. All the way home.", zwf4: "Eight. The path's clear. Bounce lanes. That's what I'm calling them.", zwf5: "Lamps from home. All of them. One's from my village. I'd know it anywhere. My cousin painted that flower.", zwf6: [["ammara14", "Did you see? Did you see how high? I touched the curtain. I think. Something warm, all round, like a hand. I'm down. I'm down. I'm happy."]], zwf7: "There. Seven places, swept. I stood in mine. Thank you. Unit Nine would be proud. Do not tell Unit Nine I said that. He will log it.", zwc1: "Ten. The observatory's going up. On the moon. I'm a hundred and twelve percent happy.", zwc2: "UNIT NINE REPORTS. Unit Nine has been asked to carry Halden's telescope. Unit Nine is carrying it. Unit Nine is useful on the moon.", zwc3: "Six. Grey. Boring. Amazing. I'm going to build a bench.", zwc4: "Breathing? It was breathing? And now it's not. Good. I'll put it in the notes as 'formerly breathing'.", zwc5: "UNIT NINE REPORTS. The Quiet Crater is lit. Unit Nine is pleased. Unit Nine is sure.", zwc6: "It's a good bench. You said so. I'm going to sit on it until we go home.", zwc7: "Set. Pointing home. When I light it, the whole world will see it. And every lamp will answer.", zws1: "She gave me her water, on the thread. I should have given her mine. ...Thank you.", zws2: "Gone. No more bouncing. Well. Normal bouncing. Moon bouncing.", zws3: "Twelve. The verses are quieter. Halden says the Eyelid stopped lifting for an hour. An hour.", zws4: "It is dreaming of a town. With a mill. And a bridge. And a lamp on the bridge. It is dreaming of New Hollin. Pip is in it. He is waving.", zws5: "Didn't look down once. Did you? Good. I didn't either. I'm a liar.", zws6: "'Mum. I went to the moon. I came back down. I'm coming home. Light the lamp. — Ilsa.' She'll think I've gone mad. Good.", zws7: "Four. The rope's done. Strong enough to hold a Starwright. Seventh tested it. She's heavier than she looks.", zwl1: "Four. The Eyelid's sagging. Like it's tired. Good. Be tired.", zwl2: "Cut. It will grow them back. In a thousand years. We will not be here. Somebody will.", zwl3: "Stopped. It looked like you at the end. Nearly. I'm glad you didn't see it. I'm glad I did.", zwl4: "Twelve. It's blind. Nearly. Halden says another day. One more day.", zwl5: "Found it first. It was looking for you. It found you. You found it harder.", zwl6: "Fixed. Good knot. I'll hold it. All night if I have to. I'm a guide. That's what guides do. We hold the rope.", zwl7: "It's light. Liquid light. Every light Vhorun ever ate, pumped up into its eye. It's been fed on us for ten thousand years. That's what's in the veins. Us.", zwh1: [["unitnine14", "UNIT NINE REPORTS. The gate unit is freed. It has asked what it should do now. Unit Nine has told it: sweep. Unit Nine had to start somewhere."]], zwh2: "Down. All of it. I saved one apple. Not violet. Red. One. I'm taking it home.", zwh3: "Silenced. The Eyelid dropped a foot. A foot. Halden cheered. I've never heard Halden cheer.", zwh4: "You didn't stay. Good. It was nice, wasn't it. That's why it's dangerous.", zwh5: "Through. They're sitting in the dust now, some of them. Crying. Waking up. Ilsa's with them.", zwh6: "She is gone. 'It saw me.' Yes. It did. That is all she ever wanted. I am sorry it was the last thing.", zwh7: "Then go. I'll light it the moment you reach the Eye. Every lamp on the world is waiting for you.", zwx1: "Forever. My footprint. Measured. Eleven inches. I knew that already. It's different on the moon.", zwx2: "There it comes. Over the rim. Blue. Ours. ...Every few hours it does that. I could watch it for a hundred years.", zwx3: "There. Where the thread ends. She stood there first, and took her shoes off, and walked. Like a pilgrim. She thought she was going home.", zwx4: "UNIT NINE REPORTS. A path is swept. It is four hundred metres long. The moon is four thousand kilometres across. Unit Nine estimates completion in some time. Unit Nine is content.", zwx5: "Four. The right song in the back of each. If even one of them reads it... that's one.", zwx6: "I do not know. I hope so. I hope they come and see what you did, and are ashamed of what we did, and proud of you. All of that. At once. Like a person.", zwx7: "A hand's width. Still a hand's width. Thank you. Don't tell me if you looked down.", zwx8: [["halden15", "A bench. For me? I'll sit on it after. After."]], zwx9: "There. I'll remember it. Blue. Green. White at the top. Ours.", zwx10: [["vesk15", "'Vesk. I'm sorry I tried to go up. Come back down. I'll hold your rope this time. — Lark.' ...She'll hold my rope. Did you hear that? She'll hold my rope."]], zwx11: [["unitnine14", "UNIT NINE REPORTS. Unit Nine is holding a lamp. Up. Not too high. Not too low. Unit Nine is ready. Unit Nine is... Unit Nine does not have a word. Unit Nine will find one."]] };
for (const q of [...foot, ...crater, ...sea, ...lid, ...hold, ...more]) if (DONE_WH[q.id]) q.done = [].concat(typeof DONE_WH[q.id] === 'string' ? [DONE_WH[q.id]] : DONE_WH[q.id]);
QUESTS.push(...finish45([...foot, ...crater, ...sea, ...lid, ...hold, ...more]));
