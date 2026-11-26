// Build 11: the Starward Reach (levels 28-30). Above the Empress's Stair, where the sky gets thin and dark: the
// Halcyon's ruined observatory, the scar where a star fell, and the Gate of Stars the Starwrights have built
// to bring the rest of their kind down. Here the player meets what made Vhorun, and hears what is coming.
import { S, X, chat } from './core.js';
import { QUESTS, MOBS } from './data.js';
import { TALK, MOB_LORE } from './dialogue.js';
import { LORE } from './story.js';
import { defineZone, defineDungeon } from './kit9.js';
import { mob, boss, rboss, B, U, HU, tier, giver } from './hi9.js';
import * as Rep from './rep6.js';
import * as Loot5 from './loot5.js';
import { finish30, addDungeon30, addRaid30, isles, SKYPAL } from './sky11.js';

Object.assign(MOBS, {
  unmade: mob('Unmade', 'ghoul~spectral', { ...U, hpM: 1.25, spd: 5.8, weak: 'holy', resist: 'shadow', scale: 1.15 }),
  unmadehulk: mob('Unmade Hulk', 'abom~ashen', { ...U, hpM: 1.6, dmgM: 1.2, spd: 4.6, range: 3, weak: 'holy', resist: 'shadow', scale: 1.1 }),
  starwright: mob('Starwright Seeker', 'wraith~spectral', { hpM: 1.15, fly: .5, range: 20, ranged: true, caster: true, school: 'shadow', weak: 'holy', resist: 'shadow', scale: 1.35 }),
  starwrightmender: mob('Starwright Mender', 'ghostnpc~spectral', { hpM: .95, range: 18, ranged: true, caster: true, healer: true, school: 'shadow', weak: 'holy', resist: 'shadow', scale: 1.2 }),
  starsworn: mob('Starsworn Acolyte', 'cultist2~gilded', { ...HU, hpM: 1, range: 18, ranged: true, caster: true, school: 'shadow', weak: 'holy' }),
  starswornblade: mob('Starsworn Blade', 'knifeshade1~gilded', { ...HU, hpM: 1.2, weak: 'holy' }),
  voidmoth: mob('Void Moth', 'wasp~spectral', { ...B, hpM: .9, fly: 1.4, weak: 'holy', resist: 'shadow', scale: 1.4 }),
  fallenstar: mob('Fallen Starlight', 'firepet~gilded', { hpM: 1.1, range: 16, ranged: true, caster: true, school: 'holy', weak: 'shadow', resist: 'holy' }),
  lensconstruct: mob('Lens Construct', 'golempet~spectral', { hpM: 1.5, spd: 4.6, range: 2.8, weak: 'storm', resist: 'earth', scale: 1.25 }),
  // named
  themothking: boss('The Moth King', 'wasp~spectral', { ...B, scale: 2.6, fly: 1.4, mechs: ['pool', 'spawn'], adds: 'voidmoth' }),
  stargazerquill: boss('Stargazer Quill', 'priest~spectral', { ...U, range: 18, ranged: true, caster: true, school: 'shadow', mechs: ['fear', 'volley'] }),
  // the Shattered Observatory (open)
  thearmillary: boss('The Armillary', 'golempet~gilded', { scale: 2.2, mechs: ['slam', 'knock'], lines: { start: '*A great brass model of the heavens begins to turn, and its rings are sharp.*', half: '*The rings spin faster.*' } }),
  astronomerkeel: boss('Astronomer Keel', 'elem2~spectral', { ...U, range: 18, ranged: true, caster: true, school: 'shadow', mechs: ['pool', 'volley', 'shield'], lines: { start: 'I found them, you know. I was the one who saw them coming. I told the Empress. I was so proud.', half: 'Look up! Look up!' } }),
  thegreatlens2: boss('The Great Lens', 'golempet~spectral', { hpM: 1.8, scale: 2.6, mechs: ['pool', 'volley', 'enrage'], lines: { start: '*The largest lens ever made turns its gaze from the stars to you.*', half: '*It burns.*' } }),
  // Starfall Scar (open)
  shardbeast: boss('The Shard-Beast', 'boarbig~spectral', { ...B, scale: 2, mechs: ['charge', 'knock'], lines: { start: '*Something that ate a piece of fallen star and grew around it.*', half: '*Starlight bleeds from its wounds.*' } }),
  thefallen: boss('The Fallen', 'firepet~gilded', { scale: 2.4, range: 18, ranged: true, caster: true, school: 'holy', mechs: ['pool', 'volley'], lines: { start: '*A star fell here. Part of it is still alive, and very far from home.*', half: '*It remembers the sky.*' } }),
  scarwarden: boss('The Scar-Warden', 'abom~ashen', { ...U, hpM: 1.8, scale: 2.2, mechs: ['slam', 'pool', 'spawn', 'enrage'], adds: 'unmade', lines: { start: '*The Starwrights made this from the Halcyon who came to see the fallen star. It does not remember being them.*', half: '*It splits, and the pieces stand up.*' } }),
  // the Unmaking Halls (instance, 29-30)
  thetailor: boss('The Tailor of Flesh', 'abom~spectral', { ...U, scale: 1.8, mechs: ['web', 'slam'], lines: { start: '*It is sewing something. It looks up, measures you, and nods.*', half: '*It needs more thread.*' } }),
  namelessmany: boss('The Nameless Many', 'ghoul~spectral', { ...U, scale: 1.6, mechs: ['spawn', 'fear'], adds: 'unmade', lines: { start: '*They all turn at once. They all have the same face now.*', half: '*More of them. Always more.*' } }),
  thesculptor: boss('The Sculptor', 'wraith~gilded', { range: 18, ranged: true, caster: true, school: 'shadow', mechs: ['pool', 'shield', 'volley'], lines: { start: 'We are not cruel. We are curious. We made something once that we did not understand. We are trying to understand it now.', half: 'Hold still. This is for science.' } }),
  theunmaker: boss('The Unmaker', 'gravelord~spectral', { hpM: 2, scale: 2, range: 18, ranged: true, caster: true, school: 'shadow', mechs: ['pool', 'fear', 'call', 'enrage'], adds: 'unmadehulk', lines: { start: 'I take things apart to see how they were made. Halcyon. Ground-folk. One day, if we find him, my own child.', half: 'Let me see inside you.' } }),
  // the Great Lens (instance, 29-30)
  lenswarden: boss('The Lens-Warden', 'golempet~spectral', { scale: 2.2, mechs: ['slam', 'shield'], lines: { start: '*A construct of glass and starlight stands between you and the lens.*', half: '*Light gathers in its chest.*' } }),
  twinastronomers: boss('The Twin Astronomers', 'warlock2~spectral', { ...U, range: 18, ranged: true, caster: true, school: 'shadow', mechs: ['volley', 'heal', 'fear'], lines: { start: 'We charted every star. Then the stars began to move toward us.', half: 'Recalculate!' } }),
  voidmothqueen: boss('The Void-Moth Queen', 'wasp~spectral', { ...B, scale: 2.8, fly: 1.4, mechs: ['pool', 'spawn', 'fear'], adds: 'voidmoth', lines: { start: '*She has been drawn to the lens for a hundred years. Tonight it is lit.*', half: '*The swarm blots out the stars.*' } }),
  highastronomer: boss('High Astronomer Selun', 'elem2~gilded', { ...HU, hpM: 2, scale: 1.5, range: 18, ranged: true, caster: true, school: 'holy', mechs: ['pool', 'volley', 'shield', 'enrage'], adds: 'lensconstruct', lines: { start: 'I opened the Gate. I aimed the Lens at their sky and I sang, and they came. Everything that has happened is my fault. I am going to finish it.', half: 'Open! Open!' } }),
  // the Gate of Stars (raid)
  gateguardian: rboss('The Guardian of the Gate', 'golempet~gilded', { hpM: 2.4, scale: 3, mechs: ['slam', 'shield', 'knock', 'pool'], lines: { start: '*The Gate\'s guardian is made of the same dark as the space between stars.*', half: '*It drinks the light around it.*' } }),
  unmadehost: rboss('The Unmade Host', 'abom~ashen', { hpM: 2.4, ...U, scale: 2.4, mechs: ['spawn', 'slam', 'fear', 'call'], adds: 'unmade', lines: { start: '*Every Halcyon who gave their name stands here, and they have been made into one thing.*', half: '*It begins to come apart into all of them.*' } }),
  collector: rboss('The Collector of Names', 'wraith~spectral', { hpM: 2.5, fly: .5, scale: 2, range: 20, ranged: true, caster: true, school: 'shadow', mechs: ['fear', 'pool', 'volley', 'heal'], adds: 'starwright', lines: { start: 'Forty thousand names. We keep them all. We will give them back, when we have finished reading them. That may take some time.', half: 'Tell us your name. Tell us. Tell us.' } }),
  starherald: rboss('Ithrel, the Starwright Herald', 'gravelord~gilded', { hpM: 2.8, scale: 2.6, range: 20, ranged: true, caster: true, school: 'shadow', weak: 'holy', resist: 'shadow', mechs: ['pool', 'fear', 'volley', 'call', 'knock', 'enrage'], adds: 'starwright', lines: { start: 'Small thing. You have touched our child. We can smell him on you: the hand under the Lamp. We made him, a long time ago, to eat the dark between stars. He ate too much. He fell. We have come to take him home.', half: 'You cannot close the Gate. You can only make us wait. We are very good at waiting.' } }),
});
Object.assign(MOB_LORE, { starwright: 'A Starwright: one of the makers of Vhorun, come down from beyond the sky to find what they lost.', unmade: 'A Halcyon who gave their name to the Starwrights, taken apart and put back together wrong.', starherald: 'Ithrel, the Starwrights\' herald, who came first, and who is waiting for the rest.' });
giver('astrin', 'Astrin Vael', 'Zenith Camp · the Archon\'s daughter', 'cleric2~gilded');
giver('mott', 'Old Mott', 'Zenith Camp · Sky Fleet lookout', 'villager1');
giver('velde', 'Warden-Captain Oriel', 'Old Lens · the Wardens', 'bladewarden2');
Object.assign(TALK, {
  astrin: { bio: 'Astrin is the daughter of Archon Vael, who held the top of the Spire. She came up to the Observatory to study the stars when she was twelve, and stayed when the Starwrights came, because somebody had to write down what they did.',
    greet: ["My father held the Spire. You beat him. He'd have been glad it was someone strong. He always said the stair should be climbed by someone who meant it.", "I've filled eleven notebooks about the Starwrights. Would you like to read them? You'll need to sit down."],
    topics: [{ q: 'What are the Starwrights?', a: ["Makers. Builders of things that live. A long time ago, before this world had a name, they made something to eat the dark between stars, so their worlds would be bright forever.", "It ate too much. It got too big. It fell, through the sky, through the ground, all the way to the bottom of the world, and they lost it. Its name, in their language, means 'the one we made too hungry'. We'd say Vhorun."] },
      { q: 'What do they want?', a: ["Their child back. They want to take him home. And they don't care what's between them and him.", "That's what the Gate is for: to bring the rest of them down. Ithrel came first, to look. The others are waiting for Ithrel to say it's safe."] }] },
  mott: { bio: 'Mott was a lookout on the Resolute for eleven minutes in 1031, and is still annoyed that nobody let him look at anything. He has now looked at the stars from closer than anyone on the ground ever has, and says they look smaller than he expected.', greet: ["Stars look smaller from up here. I was promised bigger.", "See that bright one? It's moving. Stars shouldn't move."], topics: [] },
  velde: { bio: 'Oriel came all the way up. She says it is the furthest any Warden has ever been from the bottom of the Spire, and she would like it noted in the records that she was the one who did it.', greet: ["Old Lens. The top of the sky. My grandmother's grandmother would never have believed it.", "The Gate's up there. I can feel it, like a draught under a door."], topics: [] },
});
Object.assign(LORE, {
  astrinnotes: { title: 'Astrin\'s Eleventh Notebook', where: 'zenith', text: "'They do not hate us. That is the worst part. They are kind, the way a child is kind to an ant it is carrying somewhere else. Ithrel told me today that their child was beautiful once, and that they have missed him for longer than our sun has burned. I asked what they would do when they found him. Ithrel said: take him home, and start again. I asked what they would do with us. Ithrel did not understand the question.'" },
});
const W3 = { zone: 'sky3' }, F = r => ({ fleet: r }), Wd = r => ({ spire: r });
const SW = ['starwright', 'starwrightmender', 'unmade', 'unmadehulk'], SSW = ['starsworn', 'starswornblade'], SKYB = ['voidmoth', 'fallenstar', 'lensconstruct'];
for (const m of SKYB) Rep.KILL_REP[m] = ['fleet', 6]; for (const m of [...SW, ...SSW]) Rep.KILL_REP[m] = ['spire', 6];
defineZone('sky3', {
  size: 500, seed: 9833, name: 'The Starward Reach', bossName: 'Ithrel, the Starwright Herald', hiH: 9, maxSpawnH: 40,
  land: isles([[0, 390, 90], [330, 40, 85], [-320, 80, 85], [0, 40, 70], [300, -220, 85], [-300, -220, 85], [0, -420, 95], [-150, 260, 55], [160, 240, 55], [0, -180, 60]]),
  pal: { a: '#3a3a5a', b: '#2a2a48', hi: '#8a8aa8', road: '#6a6a8a', cob: '#7a7890', low: '#1a1a34' },
  towns: [{ key: 'zenith', name: 'Zenith Camp', x: 0, z: 380, R: 28, base: 18, wall: 'stones', gates: [Math.PI / 2, Math.PI * 1.5], guardName: 'Fleet Marine', guardKind: 'bulwark1',
    houses: [[-12, 10, .4, 'tent', 4, 4], [12, 10, -.4, 'tent', 4, 4], [-14, -10, .2, 'hut'], [14, -10, 2.2, 'tent']], props: [[0, 4, 'bluelamp'], [-6, 0, 'lantern'], [6, 0, 'lantern']],
    npcs: [['giver', 'astrin', 0, 0], ['giver', 'mott', -8, 6], ['vendor', 'zenith', 8, 6], ['bind', null, 3, -4], ['armory', null, -6, -6]], guards: [[2, 26], [-2, 26], [2, -26], [-2, -26]] },
    { key: 'oldlens', name: 'Old Lens', x: 330, z: 40, R: 20, base: 18, wall: 'none', guardName: 'Warden of the Spire', guardKind: 'bladewarden1',
      houses: [[-6, 6, .3, 'tent'], [6, -6, -.4, 'tent']], props: [[0, 0, 'crystal'], [4, 4, 'banner', '#c8a050']],
      npcs: [['giver', 'velde', -5, -2], ['vendor', 'oldlens', 6, -4], ['bind', null, 0, 6]], guards: [[-12, 2], [-12, -2]] }],
  roads: [],
  regions: { names: ['The High Camp', 'The Lens-Fields', 'Starfall Scar', 'The Unmade Wastes', 'The Gate of Stars'], fn: (x, z) => z > 220 ? 0 : z < -320 ? 4 : x > 150 ? 1 : x < -150 ? 2 : 3 },
  open: [{ key: 'observatory', name: 'The Shattered Observatory', x: 0, z: 40, R: 34, base: 18, deco: 'statue', decoN: 10, ring: true, gap: Math.PI / 2, centre: 'stonecircle', lvl: [28, 29], area: 3,
      packs: [[-18, 0, ['lensconstruct', 'starsworn', 'starswornblade']], [18, 0, ['starswornblade', 'starsworn']], [0, -18, ['lensconstruct', 'fallenstar']], [0, 18, ['starsworn', 'starsworn', 'starswornblade']]],
      bosses: [[-22, -18, 'thearmillary', 28], [22, -20, 'astronomerkeel', 29], [0, -4, 'thegreatlens2', 29, true]] },
    { key: 'starfallscar', name: 'Starfall Scar', x: -320, z: 80, R: 34, base: 18, deco: 'crystal', decoN: 26, centre: 'crystal', lvl: [28, 29], area: 2,
      packs: [[-18, 0, ['fallenstar', 'voidmoth', 'voidmoth']], [18, 0, ['unmade', 'unmade']], [0, -18, ['fallenstar', 'fallenstar']], [0, 18, ['voidmoth', 'unmade', 'fallenstar']]],
      bosses: [[-22, -18, 'shardbeast', 28], [22, -20, 'thefallen', 29], [0, -4, 'scarwarden', 29, true]] }],
  doors: [{ to: 'unmaking', name: 'The Unmaking Halls', x: -300, z: -220, ry: 0, label: 'Enter the Unmaking Halls (29-30)', col: '#c88aff' },
    { to: 'greatlens', name: 'The Great Lens', x: 300, z: -220, ry: 0, label: 'Enter the Great Lens (29-30)', col: '#9ad8ff' },
    { to: 'stargate', name: 'The Gate of Stars', x: 40, z: -440, ry: 0, label: 'Approach the Gate of Stars (12-person raid)', col: '#ffffff' }],
  landmarks: [{ g: 'stonecircle', x: 0, z: -180, name: 'The Ring of Names', R: 16, clear: 12 }],
  lines: [{ x: 0, z: 488, to: 'sky2', label: 'Climb back down the Starward Stair to the Crystal Shelf', ry: Math.PI }],
  spots: { highcamp: { x: 0, z: 320 }, lensfields: { x: 330, z: 100 }, scar: { x: -320, z: 80 }, unmadewastes: { x: 0, z: -100 }, gate: { x: 0, z: -400 }, ringofnames: { x: 0, z: -180 } },
  scatter: [[40, [-480, 480, 220, 480], ['voidmoth', 'fallenstar', 'lensconstruct'], [28, 29], 0], [44, [150, 480, -320, 220], ['lensconstruct', 'starsworn', 'starswornblade', 'voidmoth'], [28, 29], 1],
    [44, [-480, -150, -320, 220], ['fallenstar', 'voidmoth', 'unmade'], [28, 29], 2], [44, [-150, 150, -320, 220], ['unmade', 'unmadehulk', 'starwright', 'starwrightmender'], [29, 30], 3],
    [44, [-480, 480, -480, -320], ['starwright', 'unmade', 'unmadehulk', 'starwrightmender'], [29, 30], 4]],
  camps: [[6, [150, 480, -320, 220], ['starsworn', 'starswornblade', 'starsworn'], [28, 29], 1, 'ss'], [6, [-480, 480, -480, -320], ['starwright', 'starwrightmender', 'unmade'], [29, 30], 4, 'sg']],
  rares: [[[-480, -150, -320, 220], 'themothking', 29, true], [[150, 480, -320, 220], 'stargazerquill', 29, false]],
  hunt: [{ area: 0, lvl: [28, 29] }, { area: 1, lvl: [28, 29] }, { area: 2, lvl: [28, 29] }, { area: 3, lvl: [29, 30] }, { area: 4, lvl: [29, 30] }],
  labels: [{ t: 'The High Camp (28-29)', x: 0, z: 300 }, { t: 'The Lens-Fields (28-29)', x: 330, z: 140 }, { t: 'Starfall Scar (28-29)', x: -320, z: 160 }, { t: 'The Unmade Wastes (29-30)', x: 0, z: -60 }, { t: 'The Gate of Stars (29-30)', x: 0, z: -360 }],
  nodes: [['skysilver', 'ore', 'oresilver', 140, null, 29], ['cloudbloom', 'herb', 'herbmeadow', 140, null, 29]],
  scenery: { density: 14000, tuft: '#6a6a9a', kinds: [['crystal', .03, .8, 2.2, 'hi'], ['icerock', .02, .8, 2.2], ['dead', .006, 1, 1.6, 'hi']] },
  sky: { fog: '#1a1a3a', top: '#05051a', hor: '#3a3a6a', k: .75, far: 220, sun: .7 },
});
defineDungeon({ key: 'unmaking', name: 'The Unmaking Halls', parent: 'sky3', plan: 'winding', floor: '#3a3448', rock: '#0e0c18', fog: '#0c0a18', light: .45, lvl: [29, 30], prop: 'crystal',
  mobs: ['unmade', 'unmadehulk', 'starwright', 'starwrightmender'], bosses: ['thetailor', 'namelessmany', 'thesculptor', 'theunmaker'], exitLabel: 'Back out to Starfall Scar' });
defineDungeon({ key: 'greatlens', name: 'The Great Lens', parent: 'sky3', plan: 'cells', floor: '#c8d0e8', rock: '#3a4058', fog: '#2a3050', light: .55, lvl: [29, 30], prop: 'bluelamp',
  mobs: ['lensconstruct', 'starsworn', 'starswornblade', 'voidmoth'], bosses: ['lenswarden', 'twinastronomers', 'voidmothqueen', 'highastronomer'], exitLabel: 'Back out to the Lens-Fields' });
defineDungeon({ key: 'stargate', name: 'The Gate of Stars', parent: 'sky3', plan: 'winding', floor: '#1a1a2a', rock: '#050510', fog: '#05050f', light: .45, lvl: [30, 30], prop: 'crystal', raid: true,
  mobs: ['starwright', 'unmade', 'unmadehulk', 'starwrightmender'], bosses: ['gateguardian', 'unmadehost', 'collector', 'starherald'], exitLabel: 'Back down from the Gate' });
addDungeon30('unmaking', 'The Unmaking Halls', [29, 30]); addDungeon30('greatlens', 'The Great Lens', [29, 30]); addRaid30('stargate', 'The Gate of Stars');
tier({ observatory: 11, starfallscar: 11, unmaking: 11, greatlens: 11, stargate: 12 });
Object.assign(Loot5.COLLECT, { title_starward: { type: 'title', name: 'Who Closed the Gate', from: 'stargate' }, trophy_starshard: { type: 'trophy', name: 'A Shard of the Gate', desc: 'It is cold, and very dark, and if you hold it to your ear you can hear something enormous breathing.', from: 'stargate' }, mount_starward: { type: 'mount', name: 'Starlit Charger', kind: 'horse_ghost', spd: .95, ride: 1, from: 'stargate' } });
X.kill.push(m => {
  if (m.mob !== 'starherald') return;
  for (const k of ['title_starward', 'trophy_starshard']) if (!Loot5.owned(k)) Loot5.collect(k);
  if (!Loot5.owned('mount_starward') && Math.random() < .3) Loot5.collect('mount_starward');
  chat('say', 'Ithrel', 'Close it, then. Close it, and listen to us knocking. We have waited longer than your sun has burned. We will wait for your sun to go out. We will come back for him. And when we do, we will remember your name.');
  setTimeout(() => chat('sys', null, 'The Gate of Stars goes dark. Far above, a light that was moving toward the world stops, and waits.'), 2500);
});

QUESTS.push(...finish30([
  { id: 'yrs1', story: true, giver: 'lirael', turnTo: 'astrin', lvl: 28, pre: 'ycs5', name: 'The Starward Stair', where: 'highcamp', ...W3, rep: F(300), obj: { talk: true, what: 'Climb the Starward Stair and find Astrin Vael at Zenith Camp' },
    say: ["The Starwrights went up the Starward Stair, to the old Observatory at the top of the sky. There's a girl up there, the Archon's daughter, who's been watching them for a year. Go and find her."], done: [['astrin', "You came. My father said someone would. Sit down. You'll want to sit down for this."]] },
  { id: 'yrs2', story: true, giver: 'astrin', lvl: 28, pre: 'yrs1', name: 'What the Lens Saw', where: 'lensfields', ...W3, rep: F(300), obj: { kill: SSW, n: 12, near: 'lensfields', nearR: 240, what: 'Break 12 of the Starsworn on the Lens-Fields' },
    say: ["Some Halcyon gave their names gladly. The Starsworn. They think the Starwrights are gods, and they guard the Lens-Fields so that nobody can look up and see what's really coming. Twelve of them."], done: ["Thank you. Now look up. That bright one, moving. That's not a star."] },
  { id: 'yrs3', story: true, giver: 'astrin', lvl: 29, pre: 'yrs2', name: 'The Shattered Observatory', where: 'unmadewastes', ...W3, rep: F(400), obj: { named: 'thegreatlens2', n: 1, what: 'Break the Great Lens in the Shattered Observatory' },
    say: ["The Observatory's Great Lens is how the Starwrights see down to the Underdark, to the door, to him. Break it, and they're blind to the ground."], done: ["Blind. Good. Let them grope for him in the dark like everyone else."] },
  { id: 'yrs4', story: true, giver: 'astrin', lvl: 29, pre: 'yrs3', name: 'The Unmaking Halls', where: 'scar', ...W3, rep: F(400), obj: { named: 'theunmaker', n: 1, what: 'Destroy the Unmaker in the Unmaking Halls' },
    say: ["Under Starfall Scar the Starwrights take things apart to see how they were made. Halcyon. Animals. Anything. They're practising, Lightkeeper. Practising for when they find their child."], done: ["It said it wanted to look inside its own child. Gods. They'd take Vhorun apart to see why he went wrong. And everything he's eaten with him."] },
  { id: 'yrs5', story: true, giver: 'astrin', lvl: 30, pre: 'yrs4', name: 'The Gate of Stars', where: 'gate', ...W3, rep: F(600), obj: { named: 'starherald', n: 1, what: 'Defeat Ithrel, the Starwright Herald, at the Gate of Stars (12-person raid)' },
    say: ["The Gate is open. Ithrel is standing in it, waiting for the others to come through. If they come through, there'll be no world left for them to find Vhorun in.", "Raise a raid. Everyone. Close the Gate."], done: ["Closed. It's closed. And the light up there has stopped moving.", "Stopped. Not gone. Ithrel said they'd wait. My father used to say the Wardens were the only ones patient enough to hold a stair for a thousand years. I think we've just met someone more patient."] },
  { id: 'yrw1', story: true, giver: 'velde', lvl: 28, pre: 'ycw3', name: 'The Top of the Sky', where: 'lensfields', ...W3, rep: Wd(300), obj: { kill: ['lensconstruct', 'voidmoth', 'fallenstar'], n: 12, near: 'lensfields', nearR: 240, what: 'Clear 12 creatures from around Old Lens' },
    say: ["The Wardens hold Old Lens now. Nineteen of us came up the Spire. Nine are here. The rest are holding the way down. Twelve of the things around the camp, and we'll sleep tonight."], done: ["Sleep. What a thought."] },
  { id: 'yrw2', story: true, giver: 'velde', lvl: 29, pre: 'yrw1', name: 'Starfall', where: 'scar', ...W3, rep: Wd(400), obj: { named: 'scarwarden', n: 1, what: 'Destroy the Scar-Warden at Starfall Scar' },
    say: ["A star fell on the western isles before the Starwrights came. Halcyon sent people to look at it. The Starwrights made them into a guard for it. Unmake it."], done: ["The Scar's quiet. The fallen starlight is just light now. Sad, and beautiful, and harmless."] },
  { id: 'yrw3', story: true, giver: 'velde', lvl: 30, pre: 'yrw2', name: 'The Great Lens', where: 'lensfields', ...W3, rep: Wd(400), obj: { named: 'highastronomer', n: 1, what: 'Stop High Astronomer Selun in the Great Lens' },
    say: ["The High Astronomer opened the Gate. She aimed the Great Lens at the Starwrights' sky and sang, and they came. She's still in there, trying to open it wider."], done: ["She said it was her fault. It was. But she also said she would finish it. I hope she meant closing it."] },
  { id: 'yrq1', giver: 'mott', lvl: 28, pre: 'yrs1', name: 'Moth Wings', where: 'highcamp', ...W3, rep: F(250), obj: { collect: ['voidmoth'], item: 'Void Moth Wing', chance: .5, n: 8, what: 'Gather 8 void moth wings' },
    say: ["Void moth wings are black on one side and starlight on the other. Eight of them, and I'll make a telescope cover that hides it from the Starwrights."], done: ["Fits perfectly. Can't see a thing through it now. That's the point."] },
  { id: 'yrq2', giver: 'astrin', lvl: 29, pre: 'yrs2', name: 'The Ring of Names', where: 'ringofnames', ...W3, rep: F(250), obj: { at: 'ringofnames', r: 16, what: 'Visit the Ring of Names in the Unmade Wastes' },
    say: ["The Starwrights carved every name they took into a circle of stones in the Wastes. Forty thousand names. I'd like you to go and stand in it, so someone from the ground has seen it."], done: ["You stood in it. Then they've been seen. That matters. I don't know why. It does."] },
  { id: 'yrq3', giver: 'velde', lvl: 29, pre: 'yrw1', name: 'Unmade', where: 'unmadewastes', ...W3, rep: Wd(300), obj: { kill: SW, n: 12, what: 'Destroy 12 Starwrights or Unmade' },
    say: ["The Unmade Wastes are full of what's left. Twelve of them, Lightkeeper. Gently, if you can."], done: ["Gently. Thank you."] },
  { id: 'yrr1', giver: 'mott', lvl: 29, name: 'The Moth King', where: 'scar', ...W3, rep: F(300), obj: { named: 'themothking', n: 1, what: 'Hunt the Moth King at Starfall Scar (he flies only at night)' },
    say: ["At night a moth the size of an airship comes to the Scar to drink the starlight. Mott wants its wings. Mott always wants something."], done: ["Wings! Wings big enough to make a sail. Bramwell's going to cry."] },
  { id: 'yrr2', giver: 'velde', lvl: 29, name: 'Stargazer Quill', where: 'lensfields', ...W3, rep: Wd(300), obj: { named: 'stargazerquill', n: 1, what: 'Lay Stargazer Quill to rest on the Lens-Fields' },
    say: ["Quill was Astrin's teacher. He gave his name to the Starwrights and now he walks the Lens-Fields, still pointing at stars. She can't bear to see him. Help her."], done: ["I'll tell her he's resting. That's true now."] },
  { id: 'yry1', daily: true, giver: 'astrin', lvl: 28, pre: 'yrs2', name: 'Daily: Keep Them Blind', ...W3, rep: F(200), obj: { kill: SSW, n: 10, what: 'Defeat 10 Starsworn' },
    say: ["The Starsworn rebuild the lenses every night. Ten of them today."], done: ["Blind another day."] },
  { id: 'yry2', daily: true, giver: 'velde', lvl: 29, pre: 'yrw1', name: 'Daily: The Last Watch', ...W3, rep: Wd(250), obj: { kill: SW, n: 10, what: 'Defeat 10 Starwrights or Unmade' },
    say: ["The Wardens watch. That's what we do. Ten of them today, before they come any closer to the edge."], done: ["The edge holds."] },
]));
