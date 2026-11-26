// Build 11: the Crystal Shelf (levels 26-28). The heart of the Halcyon Empire: its glass gardens, the ruins of its
// lower city, and the Prism Court, where the Ascendant Empress made her bargain with the Starwrights.
import { S, X } from './core.js';
import { QUESTS, MOBS } from './data.js';
import { TALK, MOB_LORE } from './dialogue.js';
import { LORE } from './story.js';
import { defineZone, defineDungeon } from './kit9.js';
import { mob, boss, rboss, B, U, HU, tier, giver } from './hi9.js';
import * as Rep from './rep6.js';
import { finish30, addDungeon30, addRaid30, isles, SKYPAL } from './sky11.js';

Object.assign(MOBS, {
  prismgolem: mob('Prism Golem', 'golempet~spectral', { hpM: 1.45, spd: 4.6, range: 2.8, weak: 'storm', resist: 'earth', scale: 1.25 }),
  glassspider: mob('Glass Spider', 'spider~spectral', { ...B, hpM: 1.1, scale: 1.2, weak: 'earth', resist: 'holy' }),
  shardwing: mob('Shardwing', 'wasp~gilded', { ...B, hpM: .85, fly: 1.2, weak: 'earth' }),
  gardenwarden: mob('Garden Warden', 'treant~gilded', { hpM: 1.35, spd: 4.4, weak: 'fire', resist: 'nature', scale: 1.1 }),
  legionary: mob('Halcyon Legionary', 'bulwark1~gilded', { ...HU, hpM: 1.35, weak: 'shadow', resist: 'holy' }),
  lightmage: mob('Halcyon Light-Mage', 'elem1~gilded', { ...HU, hpM: .9, range: 20, ranged: true, caster: true, school: 'holy', weak: 'shadow', resist: 'holy' }),
  courtier: mob('Hollowed Courtier', 'villager2~spectral', { ...U, hpM: 1.1, weak: 'holy', resist: 'shadow' }),
  sunpriest2: mob('Halcyon Dawn-Priest', 'cleric1~gilded', { ...HU, hpM: .9, range: 18, ranged: true, caster: true, healer: true, school: 'holy', weak: 'shadow', resist: 'holy' }),
  starwrightwatch: mob('Starwright Watcher', 'wraith~spectral', { hpM: 1.1, fly: .5, range: 20, ranged: true, caster: true, school: 'shadow', weak: 'holy', resist: 'shadow', scale: 1.3 }),
  // named
  thecrystalmother: boss('The Crystal Mother', 'spider~spectral', { ...B, scale: 2.4, mechs: ['web', 'spawn'], adds: 'glassspider' }),
  gardenerbel: boss('Old Gardener Bel', 'treant~verdant', { scale: 1.8, mechs: ['pool', 'heal'] }),
  // the Glass Gardens (open)
  thornofglass: boss('The Thorn of Glass', 'treant~spectral', { scale: 2, weak: 'fire', mechs: ['web', 'pool'], lines: { start: '*A rosebush made of glass, twice your height, turns every flower toward you.*', half: '*Glass petals fall like knives.*' } }),
  headgardener: boss('Head Gardener Orsolin', 'druid2~gilded', { ...HU, range: 18, ranged: true, caster: true, school: 'nature', mechs: ['heal', 'spawn', 'volley'], adds: 'gardenwarden', lines: { start: 'The Empress walked here every morning. Then she walked here with them. Then she stopped coming.', half: 'Grow!' } }),
  thesunflower: boss('The Sunflower', 'treant~gilded', { hpM: 1.7, scale: 2.4, mechs: ['pool', 'volley', 'spawn', 'enrage'], adds: 'shardwing', lines: { start: '*A flower the size of a tower turns from the sun to look at you instead.*', half: '*It drinks the light out of the air.*' } }),
  // the Ruins of Lower Halcyon (open)
  legatecass: boss('Legate Cassia Varo', 'bladewarden1~gilded', { ...HU, mechs: ['cleave', 'call'], adds: 'legionary', lines: { start: 'The lower city was abandoned when the Starwrights came. We were ordered to guard the empty streets. We have done so.', half: 'Legion, to me!' } }),
  thesilentbell: boss('The Silent Bell', 'golempet~spectral', { scale: 2.2, mechs: ['fear', 'knock'], lines: { start: '*A bell the size of a house rings, and makes no sound at all.*', half: '*The silence presses on your ears.*' } }),
  magistratevenn: boss('Magistrate Venn', 'priest~spectral', { ...U, hpM: 1.7, scale: 1.4, range: 18, ranged: true, caster: true, school: 'shadow', mechs: ['fear', 'pool', 'call', 'enrage'], adds: 'courtier', lines: { start: 'Name? Name? I need your name for the register. Everyone must give their name. Everyone has given their name.', half: 'Next! Next!' } }),
  // the Prism Vault (instance, 27-28)
  vaultkeeper: boss('The Vault-Keeper', 'golempet~gilded', { scale: 2.2, weak: 'storm', mechs: ['slam', 'shield'], lines: { start: '*Gold and glass, standing guard over nothing.*', half: '*Its shield flares.*' } }),
  prismatic: boss('The Prismatic', 'firepet~spectral', { scale: 2.2, range: 18, ranged: true, caster: true, school: 'holy', mechs: ['volley', 'pool'], lines: { start: '*Light, split into seven colours, and every colour hates you.*', half: '*The colours separate.*' } }),
  treasurerash: boss('Lord Treasurer Asheld', 'villager2~gilded', { ...HU, range: 18, ranged: true, caster: true, school: 'holy', mechs: ['heal', 'call', 'shield'], adds: 'legionary', lines: { start: 'The treasury of Halcyon is not for groundlings. It is not for anyone. It is for counting.', half: 'Guards! Thieves in the vault!' } }),
  thelens: boss('The First Lens', 'golempet~spectral', { hpM: 1.9, scale: 2.4, weak: 'shadow', mechs: ['pool', 'volley', 'shield', 'enrage'], lines: { start: '*The Halcyon\'s first great lens, which they used to find the sky. Someone has turned it toward the ground. Toward you.*', half: '*It focuses.*' } }),
  // the Sun Palace (instance, 27-28)
  palaceguard: boss('Captain of the Sun Guard', 'bulwark2~gilded', { ...HU, scale: 1.5, mechs: ['cleave', 'shield', 'charge'], lines: { start: 'No one enters the Sun Palace. No one has entered in a year. No one has left.', half: 'Hold the door!' } }),
  thechamberlain: boss('Chamberlain Ovid', 'villager1~spectral', { ...U, range: 18, ranged: true, caster: true, school: 'shadow', mechs: ['fear', 'call'], adds: 'courtier', lines: { start: 'Her Radiance is in the garden with her guests. You may not interrupt. No one may interrupt.', half: 'Courtiers! Attend!' } }),
  hollowprince: boss('Prince Elric, the Hollow Heir', 'knifeshade2~spectral', { ...U, scale: 1.3, mechs: ['charge', 'cleave'], lines: { start: 'They asked me my name. I told them. I was so proud of it. What was it?', half: 'What was my name?' } }),
  lordtempest2: boss('Lord Tempest, Unbowed', 'bladewarden2~gilded', { ...HU, hpM: 1.9, scale: 1.5, weak: 'shadow', resist: 'storm', mechs: ['cleave', 'knock', 'pool', 'enrage'], lines: { start: 'You came back. I told you to go down. I would have told you a hundred times. Now I have to stop you, or they will take my name too.', half: 'Forgive me, sister!' } }),
  // the Prism Court (raid)
  courtchampion: rboss('The Champion of the Court', 'bladewarden0~gilded', { hpM: 2.3, ...HU, mechs: ['cleave', 'charge', 'shield', 'knock'], lines: { start: 'I have fought a thousand duels before the Empress, and lost none. You will be a thousand and one.', half: 'A worthy opponent! At last!' } }),
  thenamekeepers: rboss('The Name-Keepers', 'wraith~spectral', { hpM: 2.3, fly: .5, range: 20, ranged: true, caster: true, school: 'shadow', mechs: ['fear', 'pool', 'volley', 'call'], adds: 'courtier', lines: { start: 'We keep the names we are given. We keep them very carefully. Give us yours.', half: 'Your name. Your name. Your name.' } }),
  theglassdragon: rboss('Vitrion, the Glass Dragon', 'leviathan~spectral', { hpM: 2.4, scale: .9, weak: 'earth', resist: 'holy', mechs: ['pool', 'slam', 'knock', 'enrage'], lines: { start: '*The Empress\'s dragon, made of living glass, uncoils from the ceiling of the Court.*', half: '*Its scales split the light into blades.*' } }),
  empress: rboss('Seraphine, the Ascendant Empress', 'lifebinder2~gilded', { hpM: 2.7, scale: 2, range: 18, ranged: true, caster: true, school: 'holy', weak: 'shadow', resist: 'holy', mechs: ['pool', 'heal', 'fear', 'volley', 'spawn', 'enrage'], adds: 'starwrightwatch', lines: { start: 'My people were dying, groundling. Slowly, up here, alone. The Starwrights offered us the stars. All they wanted in return was help finding something they lost. Is that so much? Is that so much?', half: 'They promised! They promised us!' } }),
});
Object.assign(MOB_LORE, { starwrightwatch: 'A Starwright\'s watcher: a shape like a tall, kind person, made of the dark between stars. It is looking for something.', empress: 'Seraphine, the Ascendant Empress of Halcyon, who bargained with the Starwrights to save her dying empire.' });
giver('lirael', 'Lirael the Unbowed', 'Prismhold · the Halcyon who said no', 'aegis1~gilded');
giver('bramwell', 'Engineer Bramwell', 'Prismhold · Sky Fleet', 'villager3');
giver('sefa', 'Warden Sefa Coll', 'Shardwatch · the Wardens', 'archer1');
Object.assign(TALK, {
  lirael: { bio: 'Lirael was a captain of the Empress\'s guard who refused to give the Starwrights her name, and walked out of the Sun Palace with forty soldiers who refused with her. They call themselves the Unbowed. There are eleven of them left.',
    greet: ["Ground-folk in the Crystal Shelf. A year ago I'd have arrested you. Today I'd hug you, if I thought it wouldn't frighten you.", "We are Halcyon. We are still Halcyon. We just aren't hers any more."],
    topics: [{ q: 'Why did the Empress agree?', a: ["Because we are dying. Halcyon has been in the sky for a thousand years and no child has been born up here for twenty. The cloudstone does something to us. The Empress has buried everyone she loves.", "Then the Starwrights came, and said they could take us higher, to the stars, where we'd live forever. She said yes before they finished asking."] }] },
  bramwell: { bio: 'Bramwell is Fennick\'s cousin, and builds things that work slightly more often than Fennick\'s do. He came up on the third airship and has been happily dismantling Halcyon technology ever since.', greet: ["Have you seen their lenses? They used them to look at the stars. I'm going to use one to boil a kettle.", "The Commodore wants a second ship. I want a second ship. Everyone wants a second ship."], topics: [] },
  sefa: { bio: 'Sefa Coll climbed the Spire with Oriel and went on alone across the cloud-bridge, because someone had to hold Shardwatch and she was the only Warden who wasn\'t scared of heights.', greet: ["Shardwatch is two tents and a lot of glass. Watch your feet.", "The crystals sing at night. Don't sing back."], topics: [] },
});
Object.assign(LORE, {
  firstempress: { title: 'The First Empress\'s Vow', where: 'lowerhalcyon', text: "Carved over the gate of the lower city: 'We have risen so that we will never have to kneel to the ground, to the war, or to the dark beneath it. Let Halcyon never bargain with what it fled.' Below, newer, in gold: 'By order of Her Radiance Seraphine, this inscription is to be removed.'" },
});
const W2 = { zone: 'sky2' }, F = r => ({ fleet: r }), Wd = r => ({ spire: r });
const GLASS = ['prismgolem', 'glassspider', 'shardwing', 'gardenwarden'], HAL2 = ['legionary', 'lightmage', 'sunpriest2'], HOLLOW = ['courtier', 'starwrightwatch'];
for (const m of GLASS) Rep.KILL_REP[m] = ['fleet', 6]; for (const m of [...HAL2, ...HOLLOW]) Rep.KILL_REP[m] = ['spire', 6];
defineZone('sky2', {
  size: 500, seed: 9822, name: 'The Crystal Shelf', bossName: 'Seraphine, the Ascendant Empress', hiH: 9, maxSpawnH: 40,
  land: isles([[0, 390, 90], [-320, 0, 85], [300, 120, 90], [-280, 280, 70], [0, 60, 85], [300, -200, 85], [-300, -240, 80], [0, -420, 90], [150, 300, 55], [-120, -150, 55], [140, -330, 50]]),
  pal: { ...SKYPAL, hi: '#a8c8d8' },
  towns: [{ key: 'prismhold', name: 'Prismhold', x: 0, z: 380, R: 30, base: 18, wall: 'stones', gates: [Math.PI / 2, Math.PI * 1.5], guardName: 'Unbowed Guard', guardKind: 'aegis1',
    houses: [[-12, 10, .4, 'hall', 9, 5], [12, 10, -.4, 'tent'], [-14, -10, .2, 'hut'], [14, -10, 2.2, 'tent']], props: [[0, 4, 'crystal'], [-6, 0, 'bluelamp'], [6, 0, 'bluelamp']],
    npcs: [['giver', 'lirael', 0, 0], ['giver', 'bramwell', -8, 6], ['vendor', 'prismhold', 8, 6], ['bind', null, 3, -4], ['armory', null, -6, -6]], guards: [[2, 28], [-2, 28], [2, -28], [-2, -28]] },
    { key: 'shardwatch', name: 'Shardwatch', x: -320, z: 0, R: 20, base: 18, wall: 'none', guardName: 'Warden of the Spire', guardKind: 'bladewarden1',
      houses: [[-6, 6, .3, 'tent'], [6, -6, -.4, 'tent']], props: [[0, 0, 'crystal'], [4, 4, 'banner', '#c8a050']],
      npcs: [['giver', 'sefa', -5, -2], ['vendor', 'shardwatch', 6, -4], ['bind', null, 0, 6]], guards: [[12, 2], [12, -2]] }],
  roads: [],
  regions: { names: ['The Prism Fields', 'The Shard Wastes', 'The Glass Gardens', 'The Ruins of Lower Halcyon', 'The Empress\'s Stair'], fn: (x, z) => z > 220 ? 0 : z < -300 ? 4 : x < -150 ? 1 : x > 150 ? 2 : 3 },
  open: [{ key: 'glassgarden', name: 'The Glass Gardens', x: 300, z: 120, R: 34, base: 18, deco: 'crystal', decoN: 24, centre: 'statue', lvl: [26, 27], area: 2,
      packs: [[-18, 0, ['gardenwarden', 'shardwing', 'shardwing']], [18, 0, ['gardenwarden', 'glassspider']], [0, -18, ['shardwing', 'shardwing', 'glassspider']], [0, 18, ['gardenwarden', 'gardenwarden']]],
      bosses: [[-22, -18, 'thornofglass', 26], [22, -20, 'headgardener', 27], [0, -4, 'thesunflower', 27, true]] },
    { key: 'lowerhalcyon', name: 'The Ruins of Lower Halcyon', x: 0, z: 60, R: 36, base: 18, deco: 'statue', decoN: 12, ring: true, gap: Math.PI / 2, centre: 'stonecircle', lvl: [27, 28], area: 3,
      packs: [[-18, 0, ['legionary', 'lightmage', 'courtier']], [18, 0, ['courtier', 'courtier', 'legionary']], [0, -18, ['legionary', 'sunpriest2']], [0, 18, ['courtier', 'lightmage', 'legionary']]],
      bosses: [[-22, -18, 'legatecass', 27], [22, -20, 'thesilentbell', 28], [0, -4, 'magistratevenn', 28, true]] }],
  doors: [{ to: 'prismvault', name: 'The Prism Vault', x: 300, z: -200, ry: 0, label: 'Enter the Prism Vault (27-28)', col: '#9ad8ff' },
    { to: 'sunpalace', name: 'The Sun Palace', x: -300, z: -240, ry: 0, label: 'Enter the Sun Palace (27-28)', col: '#ffd34d' },
    { to: 'prismcourt', name: 'The Prism Court', x: 40, z: -440, ry: 0, label: 'Climb the Empress\'s Stair to the Prism Court (12-person raid)', col: '#ffffff' }],
  landmarks: [{ g: 'statue', x: -120, z: -150, name: 'The Gate of the First Empress', R: 14, clear: 10, s: 1.8 }],
  lines: [{ x: 0, z: 488, to: 'sky1', label: 'Cross the cloud-bridge back to the Stormreach', ry: Math.PI }, { x: -40, z: -470, to: 'sky3', label: 'Climb the Starward Stair to the Starward Reach', ry: 0, why: () => (S.hero?.lvl || 0) < 28 ? 'The Starward Reach is for level 28 and beyond.' : null }],
  spots: { prismfields: { x: 0, z: 320 }, shardwastes: { x: -320, z: 60 }, gardens: { x: 300, z: 120 }, lowerhalcyon: { x: 0, z: 60 }, empressstair: { x: 0, z: -380 }, firstgate: { x: -120, z: -150 } },
  scatter: [[40, [-480, 480, 220, 480], ['shardwing', 'glassspider', 'prismgolem'], [26, 27], 0], [44, [-480, -150, -300, 220], ['prismgolem', 'glassspider', 'shardwing'], [26, 27], 1],
    [44, [150, 480, -300, 220], ['gardenwarden', 'shardwing', 'glassspider'], [26, 27], 2], [44, [-150, 150, -300, 220], ['legionary', 'lightmage', 'courtier', 'sunpriest2'], [27, 28], 3],
    [44, [-480, 480, -480, -300], ['legionary', 'courtier', 'starwrightwatch', 'lightmage'], [27, 28], 4]],
  camps: [[6, [-150, 150, -300, 220], ['legionary', 'legionary', 'sunpriest2'], [27, 28], 3, 'hl'], [6, [-480, 480, -480, -300], ['legionary', 'lightmage', 'sunpriest2'], [27, 28], 4, 'hs']],
  rares: [[[-480, -150, -300, 220], 'thecrystalmother', 27, false], [[150, 480, -300, 220], 'gardenerbel', 27, false]],
  hunt: [{ area: 0, lvl: [26, 27] }, { area: 1, lvl: [26, 27] }, { area: 2, lvl: [26, 27] }, { area: 3, lvl: [27, 28] }, { area: 4, lvl: [27, 28] }],
  labels: [{ t: 'The Prism Fields (26-27)', x: 0, z: 300 }, { t: 'The Shard Wastes (26-27)', x: -320, z: 120 }, { t: 'The Glass Gardens (26-27)', x: 300, z: 200 }, { t: 'Lower Halcyon (27-28)', x: 0, z: 0 }, { t: 'The Empress\'s Stair (27-28)', x: 0, z: -360 }],
  nodes: [['skysilver', 'ore', 'oresilver', 125, null, 27], ['cloudbloom', 'herb', 'herbmeadow', 125, null, 27]],
  scenery: { density: 16000, tuft: '#b8d8e0', kinds: [['crystal', .03, .8, 2, 'hi'], ['birch', .01, 1, 1.6, 'hi'], ['icerock', .02, .8, 2.2]] },
  sky: { fog: '#e4ecf8', top: '#6a8ae0', hor: '#f8f4ff', k: .55, far: 260 },
});
defineDungeon({ key: 'prismvault', name: 'The Prism Vault', parent: 'sky2', plan: 'cells', floor: '#c8d8e8', rock: '#4a5a6a', fog: '#8aa0c0', light: .65, lvl: [27, 28], prop: 'crystal',
  mobs: ['prismgolem', 'legionary', 'lightmage', 'glassspider'], bosses: ['vaultkeeper', 'prismatic', 'treasurerash', 'thelens'], exitLabel: 'Back out to the Glass Gardens' });
defineDungeon({ key: 'sunpalace', name: 'The Sun Palace', parent: 'sky2', plan: 'nave', floor: '#e8dcb8', rock: '#6a5a3a', fog: '#c8b888', light: .7, lvl: [27, 28], prop: 'banner', propArg: '#c8a050',
  mobs: ['legionary', 'courtier', 'sunpriest2', 'lightmage'], bosses: ['palaceguard', 'thechamberlain', 'hollowprince', 'lordtempest2'], exitLabel: 'Back out to the Shard Wastes' });
defineDungeon({ key: 'prismcourt', name: 'The Prism Court', parent: 'sky2', plan: 'nave', floor: '#f4ecd8', rock: '#8a7a5a', fog: '#d8d0e8', light: .7, lvl: [29, 30], prop: 'crystal', raid: true,
  mobs: ['legionary', 'courtier', 'starwrightwatch', 'lightmage', 'prismgolem'], bosses: ['courtchampion', 'thenamekeepers', 'theglassdragon', 'empress'], exitLabel: 'Back down the Empress\'s Stair' });
addDungeon30('prismvault', 'The Prism Vault', [27, 28]); addDungeon30('sunpalace', 'The Sun Palace', [27, 28]); addRaid30('prismcourt', 'The Prism Court');
tier({ glassgarden: 10, lowerhalcyon: 11, prismvault: 11, sunpalace: 11, prismcourt: 12 });

QUESTS.push(...finish30([
  { id: 'ycs1', story: true, giver: 'isolde', turnTo: 'lirael', lvl: 26, pre: 'yss6', name: 'The Unbowed', where: 'prismfields', ...W2, rep: F(300), obj: { talk: true, what: 'Cross to the Crystal Shelf and find Lirael the Unbowed at Prismhold' },
    say: ["Ammara says there are Halcyon on the Crystal Shelf who never gave their names. A captain called Lirael, and some of her soldiers. They're holding an old fort on the edge of the Shelf.", "Go and meet them. We need friends up here who know the way to the Empress."], done: [['lirael', "You walked across the cloud-bridge? On foot? Ground-folk are mad. Come in, come in. We have a great deal to talk about."]] },
  { id: 'ycs2', story: true, giver: 'lirael', lvl: 26, pre: 'ycs1', name: 'Glass and Thorns', where: 'prismfields', ...W2, rep: F(300), obj: { kill: GLASS, n: 14, near: 'prismfields', nearR: 240, what: 'Clear 14 glass creatures from the Prism Fields' },
    say: ["The Empress's gardeners grew guardians out of glass and set them loose on the Shelf. With nobody left to tend them they've gone feral. Fourteen of them, and the road to Prismhold is safe."], done: ["You fight like the old songs. Halcyon used to sing about the ground-folk. Not kindly, mostly. I'll write new ones."] },
  { id: 'ycs3', story: true, giver: 'lirael', lvl: 27, pre: 'ycs2', name: 'The Empty City', where: 'lowerhalcyon', ...W2, rep: F(400), obj: { named: 'magistratevenn', n: 1, what: 'Silence Magistrate Venn in the Ruins of Lower Halcyon' },
    say: ["Lower Halcyon is where the ordinary people lived. When the Starwrights came, the Magistrate took a register of every name in the city, for the guests. The people gave their names because the Magistrate asked.", "He's still there, still taking names. Make him stop."], done: ["The register is ash now. Whatever the Starwrights took, they won't have the list of who to come back for."] },
  { id: 'ycs4', story: true, giver: 'lirael', lvl: 27, pre: 'ycs3', name: 'The Hollow Heir', where: 'shardwastes', ...W2, rep: F(400), obj: { named: 'lordtempest2', n: 1, what: 'Face Lord Tempest in the Sun Palace' },
    say: ["The Empress's son gave his name the first day. Lord Tempest, her brother, has kept his, and now he guards the Sun Palace, because they've told him they'll take it if he doesn't.", "He told you once to go back down. He'll tell you again. Don't listen this time."], done: ["He's alive? He's alive, and he asked you to tell me something. 'Lirael was right.' Three words. I've waited a year for those three words."] },
  { id: 'ycs5', story: true, giver: 'lirael', lvl: 28, pre: 'ycs4', name: 'The Prism Court', where: 'empressstair', ...W2, rep: F(600), obj: { named: 'empress', n: 1, what: 'Face Seraphine, the Ascendant Empress, in the Prism Court (12-person raid)' },
    say: ["The Empress holds court at the top of her Stair, with the Starwrights' watchers beside her throne. She was my Empress. She's still my Empress, somewhere.", "Raise a raid. End her bargain. And if you can, bring her down alive."], done: ["She's alive. She's weeping. She keeps asking where they went, the Starwrights. She says they left as soon as she fell, back up the Starward Stair, to whatever they've built there. Lightkeeper, they were never going to take her to the stars."] },
  { id: 'ycw1', story: true, giver: 'sefa', lvl: 26, pre: 'yws3', name: 'Shardwatch', where: 'shardwastes', ...W2, rep: Wd(300), obj: { kill: ['prismgolem', 'glassspider'], n: 12, near: 'shardwastes', nearR: 240, what: 'Clear 12 prism golems and glass spiders from the Shard Wastes' },
    say: ["Oriel sent me ahead to hold the far edge of the Shelf. Two tents, me, and a lot of things made of glass that want me gone. Twelve of them, and I'll put up a third tent."], done: ["Third tent! It's practically a fortress."] },
  { id: 'ycw2', story: true, giver: 'sefa', lvl: 27, pre: 'ycw1', name: 'The First Lens', where: 'gardens', ...W2, rep: Wd(400), obj: { named: 'thelens', n: 1, what: 'Break the First Lens in the Prism Vault' },
    say: ["The Halcyon found the sky with a lens. The first one is in the Prism Vault, and the Starwrights have turned it round to look at the ground. At the Underdark. At the door below the Lamp.", "They're still looking for Vhorun, Lightkeeper. Break their eye."], done: ["Shattered. Good. Let them go looking with their own eyes for a while."] },
  { id: 'ycw3', story: true, giver: 'sefa', lvl: 27, pre: 'ycw2', name: 'The Garden Where She Walked', where: 'gardens', ...W2, rep: Wd(400), obj: { named: 'thesunflower', n: 1, what: 'Cut down the Sunflower at the heart of the Glass Gardens' },
    say: ["The Starwrights spoke to the Empress in the Glass Gardens for a month. Something grew there while they talked. Something that drinks light. Cut it down."], done: ["The light's back in the garden. Not much. Enough."] },
  { id: 'ycq1', giver: 'bramwell', lvl: 26, pre: 'ycs1', name: 'Lens Glass', where: 'gardens', ...W2, rep: F(250), obj: { collect: ['prismgolem', 'glassspider'], item: 'Shard of Lens-Glass', chance: .45, n: 6, what: 'Gather 6 shards of lens-glass from prism golems and glass spiders' },
    say: ["The golems are made of the same glass as the Halcyon lenses. Six shards, and I'll build the Commodore a lens that can see the Spire from here. Or boil a kettle. One or the other."], done: ["Kettle first, I think. Priorities."] },
  { id: 'ycq2', giver: 'lirael', lvl: 27, pre: 'ycs2', name: 'The Gate of the First Empress', where: 'firstgate', ...W2, rep: F(250), obj: { at: 'firstgate', r: 14, what: 'Read the vow over the Gate of the First Empress' },
    say: ["The First Empress carved a vow over the gate of the old city. Seraphine had it removed. I want to know whether her masons actually did it. They were always lazy."], done: ["They didn't finish. Of course they didn't. 'Let Halcyon never bargain with what it fled.' I'm going to have that carved over Prismhold."] },
  { id: 'ycq3', giver: 'sefa', lvl: 27, pre: 'ycw1', name: 'Name-Keepers', where: 'empressstair', ...W2, rep: Wd(300), obj: { kill: HOLLOW, n: 10, what: 'Destroy 10 hollowed courtiers or Starwright watchers' },
    say: ["The watchers on the Empress's Stair never sleep. The courtiers follow them like dogs. Ten of them, so we can get close enough to see the Court."], done: ["I saw it. Glass, and gold, and a dragon on the ceiling. We're going to need a bigger raid."] },
  { id: 'ycr1', giver: 'sefa', lvl: 27, name: 'The Crystal Mother', where: 'shardwastes', ...W2, rep: Wd(300), obj: { named: 'thecrystalmother', n: 1, what: 'Hunt the Crystal Mother in the Shard Wastes' },
    say: ["Every glass spider on the Shelf comes from one nest, and the thing that lays them is the size of a house. I've named her the Crystal Mother. She's not a good mother."], done: ["No more spiders. Well. Fewer spiders."] },
  { id: 'ycr2', giver: 'lirael', lvl: 27, name: 'Old Gardener Bel', where: 'gardens', ...W2, rep: F(300), obj: { named: 'gardenerbel', n: 1, what: 'Lay Old Gardener Bel to rest in the Glass Gardens' },
    say: ["Bel tended the Empress's roses for sixty years. When the Starwrights came, he gave them his name, and now he's a tree. A walking tree. He still prunes the roses. Please. Let him rest."], done: ["Thank you. He'd have liked to be planted. We'll plant him."] },
  { id: 'ycy1', daily: true, giver: 'lirael', lvl: 26, pre: 'ycs2', name: 'Daily: Hold Prismhold', ...W2, rep: F(200), obj: { kill: HAL2, n: 10, what: 'Defeat 10 Halcyon loyalists' },
    say: ["The Empress's loyalists test our walls every morning. Ten of them today."], done: ["Prismhold stands. Thank you."] },
  { id: 'ycy2', daily: true, giver: 'sefa', lvl: 27, pre: 'ycw1', name: 'Daily: Broken Glass', ...W2, rep: Wd(250), obj: { kill: GLASS, n: 12, what: 'Defeat 12 glass creatures' },
    say: ["The glass keeps growing back. Twelve today."], done: ["Swept up. For now."] },
]));
