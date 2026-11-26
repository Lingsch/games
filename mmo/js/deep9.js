// Build 9: the Underdark (levels 20-25). Under the Blighted Wastes the world goes down a long way: caverns of
// glowing fungus and crystal, the exiles' town of Lowmarket, and the Lantern Compact, who keep the Last Lamp.
// The Hollowborn, a cult of the One Beneath, want the Lamp put out. "When the last lamp falls..."
import { S, X } from './core.js';
import { QUESTS, MOBS } from './data.js';
import { TALK, MOB_LORE } from './dialogue.js';
import { LORE } from './story.js';
import { defineZone, defineDungeon } from './kit9.js';
import { mob, boss, rboss, B, U, HU, addRaid, addDungeonLFG, tier, faction, mount, finishQuests, giver } from './hi9.js';
import * as Loot5 from './loot5.js';
import * as Rep from './rep6.js';

const dark = (x, z, N) => 2 + N.fbm(x * .007, z * .007, 4) * 9 + Math.max(0, N.fbm(x * .03 + 4, z * .03, 2) - .5) * 14;
Object.assign(MOBS, {
  deepcrawler: mob('Deepcrawler', 'spider', { ...B, scale: 1.25, weak: 'fire', resist: 'nature' }),
  sporeback: mob('Sporeback Boar', 'boarbig', { ...B, hpM: 1.15, weak: 'fire', resist: 'nature' }),
  cavebat: mob('Duskwing', 'wasp', { ...B, hpM: .8, fly: 1.2, weak: 'holy', resist: 'shadow' }),
  sporeling: mob('Sporeling', 'treant', { hpM: 1.2, spd: 4.6, scale: .8, weak: 'fire', resist: 'nature' }),
  blindtroll: mob('Blind Troll', 'troll', { hpM: 1.4, dmgM: 1.15, range: 2.8, weak: 'fire', resist: 'frost', scale: 1.15 }),
  crystalgolem: mob('Crystal Golem', 'golempet', { hpM: 1.4, spd: 4.6, range: 2.8, weak: 'storm', resist: 'earth', scale: 1.2 }),
  echo: mob('Echo', 'wraith', { ...U, hpM: .9, range: 18, ranged: true, caster: true, school: 'shadow', weak: 'holy', resist: 'shadow', fly: .4 }),
  hollowborn: mob('Hollowborn Zealot', 'cultist0', { ...HU, weak: 'holy', resist: 'shadow' }),
  hollowpriest: mob('Hollowborn Lightdrinker', 'cultist1', { ...HU, hpM: .9, range: 18, ranged: true, caster: true, healer: true, school: 'shadow', weak: 'holy', resist: 'shadow' }),
  hollowknight: mob('Hollowborn Darkguard', 'guard', { ...HU, hpM: 1.3, weak: 'holy', resist: 'shadow' }),
  starless: mob('Starless Thing', 'ghost', { ...U, hpM: 1.1, weak: 'holy', resist: 'shadow', scale: 1.3 }),
  // named
  thepalegrub: boss('The Pale Grub', 'spider', { ...B, scale: 2.4, mechs: ['web', 'spawn'], adds: 'deepcrawler' }),
  oldlamplighter: boss('The Old Lamplighter', 'ghostnpc', { ...U, range: 18, ranged: true, caster: true, school: 'frost', mechs: ['fear', 'pool'] }),
  // the Mycelium Court
  sporequeen: boss('The Spore-Queen', 'treant', { scale: 2, weak: 'fire', resist: 'nature', mechs: ['pool', 'spawn'], adds: 'sporeling', lines: { start: '*The whole cavern exhales. The air turns gold with spores.*', half: '*Her children burst from the soil.*' } }),
  capwarden: boss('Capwarden Grull', 'troll', { scale: 1.6, mechs: ['cleave', 'slam'], lines: { start: 'Grull guards the Queen. Grull is very good at guarding.', half: 'Grull angry now!' } }),
  mycelius: boss('Mycelius, the Thinking Rot', 'treant', { hpM: 1.7, scale: 2.4, weak: 'fire', resist: 'nature', mechs: ['web', 'pool', 'spawn', 'enrage'], adds: 'sporeling', lines: { start: 'We are one mind under the earth, little light. We remember every root of the world. Join us.', half: 'Grow! Grow and cover them!' } }),
  // the Drowned Mines
  foremanbrask: boss('Foreman Crede', 'brute', { mechs: ['knock', 'charge'], lines: { start: 'Nobody told me the mine flooded. Nobody told me I drowned. I\'ve still got a quota.', half: 'Back to work, lads!' } }),
  thecavein: boss('The Cave-In', 'golempet', { scale: 2.2, weak: 'storm', resist: 'earth', mechs: ['slam', 'shield'], lines: { start: '*The ceiling of the mine stands up and walks toward you.*', half: '*Rocks rain from above.*' } }),
  deepmawsmith: boss('Old Deepmaw', 'crabbig', { hpM: 1.7, scale: 2.2, weak: 'storm', resist: 'frost', mechs: ['cleave', 'pool', 'enrage'], lines: { start: '*Something vast and pale stirs in the flooded shaft.*', half: '*The water boils around it.*' } }),
  // the Hollowborn Temple
  thedimmer: boss('The Dimmer', 'cultist0', { ...HU, mechs: ['cleave', 'fear'], lines: { start: 'Every light you carry is a lie. Let me put it out for you.', half: 'Darkness! Darkness!' } }),
  candleeater: boss('The Candle-Eater', 'abom', { ...U, scale: 1.6, mechs: ['slam', 'pool'], lines: { start: '*It is chewing a lantern. It looks at yours.*', half: '*It swallows the light around you.*' } }),
  sisterdusk: boss('Sister Dusk', 'cultist2', { ...HU, range: 18, ranged: true, caster: true, school: 'shadow', mechs: ['heal', 'volley', 'call'], adds: 'hollowborn', lines: { start: 'The One Beneath has been waiting a very long time. Will you make it wait longer?', half: 'Brothers! Sisters! To me!' } }),
  hierophant: boss('Hierophant Saal', 'gravelord', { ...HU, hpM: 1.8, scale: 1.6, range: 18, ranged: true, caster: true, school: 'shadow', mechs: ['pool', 'fear', 'spawn', 'enrage'], adds: 'starless', lines: { start: 'The Gravelord was a herald, and he failed. I will not fail. When the last lamp falls, the One Beneath will rise, and I will be the first thing it sees.', half: 'Come, starless ones! Feast!' } }),
  // the Vault of Echoes
  echoofsong: boss('The Echo of a Song', 'wraith', { ...U, fly: .4, range: 18, ranged: true, caster: true, school: 'shadow', mechs: ['fear', 'volley'], lines: { start: '*Somewhere in the vault, a choir sings a hymn that ended ten thousand years ago.*', half: '*The hymn grows louder.*' } }),
  vaultguardian: boss('The Vault-Guardian', 'golempet', { scale: 2.4, weak: 'storm', resist: 'earth', mechs: ['slam', 'shield', 'knock'], lines: { start: '*A golem of black crystal steps out of the wall. It was here before the summoners.*', half: '*Cracks of light run across it.*' } }),
  starlessmother: boss('The Starless Mother', 'ghost', { ...U, scale: 2, mechs: ['pool', 'spawn', 'fear'], adds: 'starless', lines: { start: '*Darkness folds itself into a shape, and the shape is hungry.*', half: '*Her children fall from the ceiling.*' } }),
  thelastecho: boss('The Last Echo', 'ghostnpc', { ...U, hpM: 1.8, scale: 1.6, range: 18, ranged: true, caster: true, school: 'shadow', mechs: ['pool', 'fear', 'volley', 'enrage'], lines: { start: 'I am the last thing anyone said down here before the door was shut. Do you want to hear it? It is a name.', half: 'Vhorun. VHORUN.' } }),
  // the Starless Vault: raid
  doorwarden: rboss('The Doorwarden', 'golempet', { hpM: 2.1, weak: 'storm', resist: 'earth', mechs: ['slam', 'knock', 'shield'], lines: { start: '*Four arms. One door. It will not let you pass.*', half: '*The door behind it shudders.*' } }),
  thehungrydark: rboss('The Hungry Dark', 'ghost', { hpM: 2.2, ...U, mechs: ['pool', 'fear', 'spawn'], adds: 'starless', lines: { start: '*The lamps in the vault go out one by one.*', half: '*The dark eats the floor where you were standing.*' } }),
  lampkiller: rboss('Saint Lampkiller', 'priest', { hpM: 2.3, ...HU, range: 18, ranged: true, caster: true, school: 'shadow', mechs: ['heal', 'volley', 'call', 'pool'], adds: 'hollowknight', lines: { start: 'I was a saint of the Four once. I put out the first lamp myself. It was easier than I expected.', half: 'Darkguard! Hold them!' } }),
  herald: rboss('The Herald of the One Beneath', 'gravelord', { hpM: 2.6, ...U, scale: 2.4, range: 18, ranged: true, caster: true, school: 'shadow', mechs: ['pool', 'fear', 'spawn', 'volley', 'enrage'], adds: 'starless', lines: { start: 'The Gravelord was a voice. I am a mouth. Behind me is the door, and behind the door is Vhorun, and Vhorun is very, very hungry.', half: 'Open! OPEN!' } }),
});
Object.assign(MOB_LORE, { hollowborn: 'A zealot of the Hollowborn, who worship the One Beneath and want every light in the world put out.', echo: 'A memory that the Underdark has kept for too long. It whispers in a language no one speaks any more.',
  starless: 'Something from below the Underdark. It has no face, and it is hungry for light.', blindtroll: 'A troll that has lived in the dark so long it forgot how to see. It remembers how to smell.' });
// ---------- people ----------
giver('mira', 'Lamp-Warden Mira Holt', 'Lowmarket · the Lantern Compact', 'cleric2');
giver('obb', 'Obb the Exile', 'Lowmarket · trader and liar', 'bard2_grael');
giver('delverkettle', 'Delver Kettle', 'Deepwatch · the Compact\'s scouts', 'archer1_varr');
giver('sorrel', 'Old Sorrel', 'Deepwatch · keeper of the Last Lamp', 'illusionist2_sallow');
Object.assign(TALK, {
  mira: { bio: "Mira Holt came down into the Underdark at nineteen with a lamp and a grudge, and has stayed for thirty years. She leads the Lantern Compact: exiles, outcasts and stubborn people who keep the lamps of the deep roads burning.",
    greet: ["Lamp lit? Good. Down here, the dark isn't just dark. Some of it is looking at you.", "Welcome to Lowmarket. Everybody here was thrown out of somewhere. You'll fit right in."],
    topics: [{ q: 'What is the Lantern Compact?', a: ["A promise, mostly. A thousand years ago, someone lit a lamp in the deepest part of the world and told the people who came after: keep it burning. We've kept it burning.", "Nobody remembers why any more. But every time the Lamp flickers, things come up out of the deep that shouldn't. So we keep it burning."] },
      { q: 'Who are the Hollowborn?', a: ["A cult. They came down from the surface ten years ago, and they pray to something they call the One Beneath. They believe it's a god, sleeping under the world, and that the Last Lamp is the only thing keeping it asleep.", "They want the Lamp put out. I'd very much like them not to."] }] },
  obb: { bio: 'Obb is a Grael who was thrown out of Cinderhall for selling the Forge-Mother\'s furniture. He insists it was a misunderstanding. He has been misunderstood in four kingdoms.', greet: ["Crystal? Fungus? Very slightly used maps of tunnels that probably still exist? Obb has everything.", "Don't believe anything Obb tells you. Except that. That's true."], topics: [] },
  delverkettle: { bio: 'Kettle is a Varr who scouts the deep roads with a lamp tied to each horn. She can smell a Hollowborn at two hundred paces, and says they smell of wet candles.', greet: ["Mind your step. The floor's honest, but the ceiling lies.", "Deepwatch holds the road to the Last Lamp. It's a short road. It feels like a long one."], topics: [] },
  sorrel: { bio: "Old Sorrel is a Sallow who has tended the Last Lamp for sixty years. Sallow don't need sleep, and the Lamp needs watching every hour of every day. It seemed, Sorrel says, like the obvious job.", greet: ["The Lamp's still burning. Every morning I check. Every morning it is.", "It's flickered three times this year. It's never flickered before. I count things. That's what I'm for."], topics: [] },
});
Object.assign(LORE, {
  deeplamp: { title: 'The First Keeper\'s Charge', where: 'deepwatch', text: "Carved above the Last Lamp, in a language older than the eight kingdoms: 'Keep it burning. Below the deepest root there is a door, and behind the door is one who hungers. While the lamp burns, the door is shut. When the last lamp falls, it opens.'" },
  hollowscript: { title: 'A Hollowborn Hymn', where: 'hollowtemple', text: "'Put out the lamps, children, one by one. The Lord of Graves gathers the dead, the Choir sings them home, and the One Beneath shall wake in a world of dark, and feed, and be grateful.'" },
});
faction('lantern', 'The Lantern Compact', '🏮', 'lowmarket', [[1, 160, "Lamp-Warden's Band", Rep.ring("Lamp-Warden's Band", 22, 2)], [2, 400, 'Glowcap Strider (mount)', 'mount_glowcap'], [3, 400, 'Lantern of the Deep', Rep.ring('Lantern of the Deep', 25, 3, 'neck')], [4, 0, 'Title: Lightkeeper of the Deep', 'title_lantern']],
  ['deepcrawler', 'sporeback', 'cavebat', 'sporeling', 'blindtroll', 'crystalgolem', 'echo', 'hollowborn', 'hollowpriest', 'hollowknight', 'starless']);
mount('mount_glowcap', 'Glowcap Strider', 'horse_glowcap', '#5a3a7a', '#8affff', '#2a2a3a', false);
Loot5.COLLECT.title_lantern = { type: 'title', name: 'Lightkeeper of the Deep', from: 'rep' };
X.VEND = Object.assign(X.VEND || {}, { lowmarket: ['Obb\'s Cousin Pebb', 'monk2_grael'], deepwatch: ['Quartermaster Fen', 'bulwark1_sallow'] });

// ---------- the land ----------
defineZone('deep', {
  size: 500, seed: 9404, name: 'The Underdark', bossName: 'The Herald of the One Beneath', land: dark, hiH: 10, maxSpawnH: 15,
  pal: { a: '#2a2632', b: '#3a3440', hi: '#4a4458', road: '#5a5048', cob: '#4a4448', low: '#1e2a2a' },
  towns: [{ key: 'lowmarket', name: 'Lowmarket', x: 0, z: 380, R: 32, wall: 'stones', gates: [Math.PI / 2, Math.PI * 1.5], guardName: 'Compact Lampguard', guardKind: 'aegis1',
    houses: [[-14, 10, .4, 'cavehouse', 6, 6], [14, 12, -.4, 'cavehouse', 6, 6], [-16, -10, .2, 'cavehouse', 6, 6], [16, -10, 2.2, 'cavehouse', 6, 6], [0, -18, 0, 'cavehouse', 6, 6]],
    props: [[0, 4, 'lantern'], [-6, 0, 'lantern'], [6, 0, 'lantern'], [-10, 18, 'crystal'], [10, -20, 'crystal'], [20, 0, 'shroom']],
    npcs: [['giver', 'mira', 0, 0], ['giver', 'obb', -8, 6], ['vendor', 'lowmarket', 8, 6], ['bind', null, 3, -4], ['armory', null, -6, -6]], guards: [[2, 30], [-2, 30], [2, -30], [-2, -30]] },
    { key: 'deepwatch', name: 'Deepwatch', x: 60, z: -260, R: 20, wall: 'stones', gates: [Math.PI / 2], guardName: 'Compact Lampguard', guardKind: 'aegis1',
      houses: [[-8, 6, .3, 'cavehouse', 6, 6]], props: [[0, 0, 'statue'], [4, 4, 'lantern'], [-4, -4, 'lantern']],
      npcs: [['giver', 'delverkettle', -5, -4], ['giver', 'sorrel', 4, -2], ['vendor', 'deepwatch', 6, 6], ['bind', null, 0, 6]], guards: [[2, 18], [-2, 18]] }],
  roads: [[0, 350, -40, 200], [-40, 200, 0, 0], [0, 0, 60, -240], [0, 0, -260, 80], [0, 0, 260, 40]],
  regions: { names: ['The Lowmarket Approach', 'The Fungal Reach', 'The Glimmering Depths', 'The Hollowborn Warrens', 'The Starless Steps'],
    fn: (x, z) => z > 240 ? 0 : z < -220 ? 4 : x < -120 ? 1 : x > 120 ? 2 : z < 0 ? 3 : 0 },
  open: [{ key: 'mycelium', name: 'The Mycelium Court', x: -330, z: 120, R: 36, deco: 'shroom', decoN: 26, lvl: [21, 22], area: 1,
      packs: [[-18, 0, ['sporeling', 'sporeling', 'sporeback']], [18, 0, ['sporeling', 'deepcrawler']], [0, -18, ['sporeling', 'sporeling', 'sporeling']], [0, 18, ['sporeback', 'deepcrawler', 'sporeling']]],
      bosses: [[-22, -18, 'sporequeen', 21], [22, -20, 'capwarden', 22], [0, -4, 'mycelius', 22, true]] },
    { key: 'drownedmines', name: 'The Drowned Mines', x: 320, z: 60, R: 34, deco: 'stalag', decoN: 26, ring: true, gap: Math.PI, lvl: [22, 23], area: 2,
      packs: [[-18, 0, ['crystalgolem', 'blindtroll']], [18, 0, ['echo', 'echo', 'crystalgolem']], [0, -18, ['blindtroll', 'blindtroll']], [0, 18, ['crystalgolem', 'echo', 'echo']]],
      bosses: [[-22, -18, 'foremanbrask', 22], [22, -20, 'thecavein', 23], [0, -4, 'deepmawsmith', 23, true]] }],
  doors: [{ to: 'hollowtemple', name: 'The Hollowborn Temple', x: -200, z: -150, ry: 0, label: 'Enter the Hollowborn Temple (23-24)', col: '#8a6aff' },
    { to: 'echovault', name: 'The Vault of Echoes', x: 260, z: -330, ry: 0, label: 'Enter the Vault of Echoes (24-25)', col: '#8a6aff' },
    { to: 'starless', name: 'The Starless Vault', x: -40, z: -430, ry: 0, label: 'Enter the Starless Vault (12-person raid)', col: '#ffffff' }],
  landmarks: [{ g: 'crystal', x: 230, z: 220, s: 3, name: 'The Glimmering Pool', R: 20, clear: 14 }, { g: 'statue', x: -200, z: -30, name: 'The Warrens', R: 20, clear: 10 }],
  lines: [{ x: 0, z: 486, to: 'wastes', label: 'Climb back up to the Blighted Wastes', ry: Math.PI }],
  spots: { approach: { x: -20, z: 260 }, fungal: { x: -280, z: 160 }, glimmer: { x: 260, z: 180 }, warrens: { x: -200, z: -60 }, steps: { x: 0, z: -360 }, glimmerpool: { x: 230, z: 220 } },
  scatter: [[40, [-480, 480, 240, 480], ['deepcrawler', 'sporeback', 'cavebat'], [20, 21], 0], [44, [-480, -120, -220, 240], ['sporeling', 'sporeback', 'deepcrawler', 'cavebat'], [21, 22], 1],
    [44, [120, 480, -220, 240], ['crystalgolem', 'blindtroll', 'echo', 'cavebat'], [22, 23], 2], [40, [-120, 120, -220, 240], ['hollowborn', 'echo', 'blindtroll'], [22, 23], 3],
    [44, [-480, 480, -480, -220], ['starless', 'echo', 'hollowknight', 'crystalgolem'], [24, 25], 4]],
  camps: [[6, [-480, 0, -220, 60], ['hollowborn', 'hollowpriest', 'hollowknight'], [23, 24], 3, 'hb'], [6, [-480, 480, -480, -240], ['hollowknight', 'hollowpriest', 'hollowborn', 'hollowknight'], [24, 25], 4, 'hs']],
  rares: [[[-480, -120, -200, 200], 'thepalegrub', 22, false], [[-120, 480, -460, -230], 'oldlamplighter', 24, true]],
  hunt: [{ area: 0, lvl: [20, 21] }, { area: 1, lvl: [21, 22] }, { area: 2, lvl: [22, 23] }, { area: 3, lvl: [23, 24] }, { area: 4, lvl: [24, 25] }],
  labels: [{ t: 'Crawlers, boars (20-21)', x: 0, z: 290 }, { t: 'The Fungal Reach (21-22)', x: -300, z: 40 }, { t: 'Golems, trolls (22-23)', x: 300, z: -40 }, { t: 'The Hollowborn (23-24)', x: -150, z: -120 }, { t: 'The Starless Steps (24-25)', x: 100, z: -380 }],
  nodes: [['starsteel', 'ore', 'oresilver', 100, null, 24], ['deepcap', 'herb', 'herbgrave', 100, null, 24]],
  scenery: { density: 20000, tuft: '#3a5a5a', kinds: [['shroom', .012, .7, 1.6], ['crystal', .008, .7, 1.8], ['stalag', .03, .7, 1.6]] },
  sky: { sun: .45, fog: '#141a22', top: '#05060a', mid: '#0a0c14', hor: '#1a2030', k: .9, far: 150 },
});
// ---------- the instanced dungeons and the raid ----------
defineDungeon({ key: 'hollowtemple', name: 'The Hollowborn Temple', parent: 'deep', plan: 'nave', floor: '#2a2430', rock: '#0c0a10', fog: '#0a080e', light: .42, lvl: [23, 24], prop: 'greenlamp',
  mobs: ['hollowborn', 'hollowpriest', 'hollowknight', 'starless'], bosses: ['thedimmer', 'candleeater', 'sisterdusk', 'hierophant'], exitLabel: 'Back out to the Warrens' });
defineDungeon({ key: 'echovault', name: 'The Vault of Echoes', parent: 'deep', plan: 'winding', floor: '#22222e', rock: '#08080e', fog: '#06060c', light: .4, lvl: [24, 25], prop: 'crystal',
  mobs: ['echo', 'crystalgolem', 'starless', 'hollowknight'], bosses: ['echoofsong', 'vaultguardian', 'starlessmother', 'thelastecho'], exitLabel: 'Back out to the Starless Steps' });
defineDungeon({ key: 'starless', name: 'The Starless Vault', parent: 'deep', plan: 'cells', floor: '#1a1a22', rock: '#040408', fog: '#030306', light: .38, lvl: [25, 25], prop: 'bluelamp', raid: true,
  mobs: ['starless', 'hollowknight', 'hollowpriest', 'echo', 'crystalgolem'], bosses: ['doorwarden', 'thehungrydark', 'lampkiller', 'herald'], exitLabel: 'Back out to the Starless Steps' });
addDungeonLFG('hollowtemple', 'The Hollowborn Temple', [23, 24]); addDungeonLFG('echovault', 'The Vault of Echoes', [24, 25]); addRaid('starless', 'The Starless Vault');
tier({ mycelium: 7, drownedmines: 7, hollowtemple: 8, echovault: 8, starless: 9 });

// ---------- quests ----------
const D = { zone: 'deep' }, L = r => ({ lantern: r });
const LOW = ['deepcrawler', 'sporeback', 'cavebat'], REACH = ['sporeling', 'sporeback', 'deepcrawler'], GLIM = ['crystalgolem', 'blindtroll', 'echo'], HOLLOW = ['hollowborn', 'hollowpriest', 'hollowknight'];
QUESTS.push(...finishQuests([
  { id: 'dd1', story: true, giver: 'hesper', turnTo: 'mira', lvl: 20, needLvl: 20, name: 'The Lamp Below', rep: L(250), obj: { talk: true, what: 'Climb down the chasm north-east of the Hollow Throne and find Lamp-Warden Mira Holt in Lowmarket' },
    say: ["The Gravelord is beaten, child, and still the lamp in my chapel flickers every night. Something is pulling at it from underneath. From very far underneath.", "There's a chasm by the Hollow Throne that goes down into the Underdark. The people who live down there keep a lamp of their own: the oldest light in the world, they say. Go down, find their warden, Mira Holt, and ask her why the lamps are frightened."],
    done: [['mira', "Hesper sent you? She's a good woman, for a surface-dweller. And she's right. The Last Lamp has flickered three times this year, and it has never flickered before."], ['mira', "Every time it does, things come up out of the deep. Let me show you what I mean."]] },
  { id: 'dd2', story: true, giver: 'mira', lvl: 20, pre: 'dd1', name: 'The Roads of Lowmarket', where: 'approach', ...D, rep: L(250), obj: { kill: LOW, n: 14, near: 'approach', nearR: 220, what: 'Clear 14 deepcrawlers, sporebacks or duskwings from the Lowmarket roads' },
    say: ["The roads out of Lowmarket used to be safe enough. Now the crawlers come up from below and wait for the caravans. Fourteen of them, and the traders might come back.", "Keep your lamp lit. Crawlers hate light. So do most things down here."],
    done: ["The caravans are moving again. Obb has already raised his prices, which is how I know things are back to normal."] },
  { id: 'dd3', story: true, giver: 'mira', turnTo: 'delverkettle', lvl: 21, pre: 'dd2', name: 'Spores on the Wind', where: 'fungal', ...D, rep: L(250), obj: { at: 'fungal', r: 40, what: 'Scout the Fungal Reach in the west, then report to Delver Kettle at Deepwatch' },
    say: ["The Fungal Reach is spreading. The mushrooms there think, a little, all together, and lately they've been thinking about us. Go and look, then take the long road south to Deepwatch and tell Kettle what you saw."],
    done: [['kettle', "Gold spores, in the air? Then the Mycelius is awake. That's a mind made of rot, older than Lowmarket. The Hollowborn have been feeding it."], ['kettle', "Welcome to Deepwatch, by the way. It's the last fort before the Last Lamp. Don't touch anything."]] },
  { id: 'dd4', story: true, giver: 'delverkettle', lvl: 22, pre: 'dd3', name: 'The Hollowborn', where: 'warrens', ...D, rep: L(300), obj: { kill: HOLLOW, n: 12, near: 'warrens', nearR: 220, what: 'Drive back 12 Hollowborn in the Warrens' },
    say: ["The Hollowborn have dug themselves into the Warrens, west of here. Every night they creep up the road with buckets of water for the Lamp. Every night we chase them off.", "Twelve of them, surface-friend. Let's give them something else to think about."],
    done: ["They'll remember that. Hollowborn don't learn, but they do remember."] },
  { id: 'dd5', story: true, giver: 'sorrel', lvl: 22, pre: 'dd4', name: 'Shards of the Starless', where: 'steps', ...D, rep: L(300), obj: { collect: ['starless', 'echo'], item: 'Starless Shard', chance: .45, n: 6, what: 'Gather 6 starless shards from the things on the Starless Steps' },
    say: ["When the Lamp flickers, things come up the Starless Steps: things without faces. When they die, they leave shards of something like black glass.", "Bring me six. I want to know what they're made of. I'm afraid I already know."],
    done: ["Night. Solid night, from before the world had a sun. They're from behind the door, friend. The door's opening."] },
  { id: 'dd6', story: true, giver: 'sorrel', lvl: 23, pre: 'dd5', name: 'The Hierophant', where: 'hollowtemple', ...D, rep: L(400), obj: { named: 'hierophant', n: 1, what: 'Defeat Hierophant Saal in the Hollowborn Temple' },
    say: ["The Hollowborn have a leader, Hierophant Saal, in a temple they carved under the Warrens. He's the one teaching them to drown lamps. He's the one opening the door from this side.", "Take a full group. He's had ten years to get ready for you."],
    done: ["Saal's dead, and the Lamp burned steady for the first time in a month. I lit a candle for you. Then I put it out, because we don't waste light."] },
  { id: 'dd7', story: true, giver: 'mira', lvl: 24, pre: 'dd6', name: 'The Last Echo', where: 'steps', ...D, rep: L(400), obj: { named: 'thelastecho', n: 1, what: 'Silence the Last Echo in the Vault of Echoes' },
    say: ["Saal's papers talk about the Vault of Echoes, down the Starless Steps. Everything ever said in the Underdark echoes there forever, and the oldest echo is the last thing anyone said before the door was shut.", "Saal wanted to hear it. So does whatever's behind the door. Go and make sure it stops repeating."],
    done: ["A name. You heard a name. Vhorun. Sorrel's gone white, which is a trick, for a Sallow. Hesper's 'One Beneath' has a name now, and names have power."] },
  { id: 'dd8', story: true, giver: 'mira', lvl: 25, pre: 'dd7', name: 'Behind the Door', where: 'steps', ...D, rep: L(600), obj: { named: 'herald', n: 1, what: 'Defeat the Herald of the One Beneath in the Starless Vault (12-person raid)' },
    say: ["At the bottom of the Starless Steps is a vault, and in the vault is the door, and in front of the door is something the Hollowborn call the Herald. It speaks for Vhorun. It's trying to open the door from this side.", "Bring a raid, friend. Bring everyone. And when it's done, come home, and we'll keep the Lamp burning together."],
    done: ["The Herald's gone, and the door is shut, and the Lamp burns. It won't stay shut forever. But today, it's shut. Thank you, Lightkeeper."] },
  { id: 'dq1', giver: 'delverkettle', lvl: 21, pre: 'dd3', name: 'The Thinking Rot', where: 'fungal', ...D, rep: L(300), obj: { named: 'mycelius', n: 1, what: 'Destroy Mycelius at the heart of the Mycelium Court' },
    say: ["The Mycelius is in the Court, a cavern in the Reach where the mushrooms grow taller than houses. It thinks with every root it has, and it has a lot of roots.", "Burn it if you can. Hit it very hard if you can't."], done: ["The spores have settled. The Reach smells like an ordinary cave again: damp and disappointing."] },
  { id: 'dq2', giver: 'obb', lvl: 22, pre: 'dd2', name: 'Obb\'s Investment', where: 'glimmer', ...D, rep: L(300), obj: { named: 'deepmawsmith', n: 1, what: 'Clear Old Deepmaw out of the Drowned Mines' },
    say: ["Obb has bought the Drowned Mines. Very cheap. Suspiciously cheap. It turns out there's a monster in them. And the dead foreman. And the ceiling walks around.", "Clear it out, and Obb will make you a partner. A very small partner. Tiny, really."], done: ["Wonderful! Obb is rich! Obb will pay you in shares. No? Gold, then. Fine. Here."] },
  { id: 'dq3', giver: 'delverkettle', lvl: 23, pre: 'dd4', name: 'Into the Temple', where: 'warrens', ...D, rep: L(300), obj: { collect: ['hollowborn', 'hollowpriest', 'hollowknight'], item: 'Hollowborn Temple Key', chance: .3, n: 1, what: 'Take a temple key from the Hollowborn' },
    say: ["The temple door has a lock. The Hollowborn carry keys. Bring me one, and we'll have a way in that isn't through the front of a hundred zealots."], done: ["A key, still warm. Lovely. I'll copy it for anyone who's going in."] },
  { id: 'dds1', giver: 'obb', lvl: 21, name: 'Glowcaps for Sale', where: 'fungal', ...D, rep: L(200), obj: { collect: ['sporeling'], item: 'Glowcap', chance: .5, n: 8, what: 'Gather 8 glowcaps from sporelings' },
    say: ["Glowcaps! The surface pays a fortune for mushrooms that glow. Bring Obb eight, and Obb will pay you almost what they're worth."], done: ["Beautiful. Obb will tell the surface they're very rare. They are very rare, on the surface."] },
  { id: 'dds2', giver: 'mira', lvl: 22, name: 'The Pale Grub', where: 'fungal', ...D, rep: L(300), obj: { named: 'thepalegrub', n: 1, what: 'Kill the Pale Grub in the Fungal Reach' },
    say: ["There's a grub in the Reach the size of a barn. It eats crawlers. It also eats caravans. One of those I don't mind."], done: ["Good riddance. The crawlers will breed like rabbits now, but rabbits I can handle."] },
  { id: 'dds3', giver: 'sorrel', lvl: 24, name: 'The Old Lamplighter', where: 'steps', ...D, rep: L(300), obj: { named: 'oldlamplighter', n: 1, what: 'Lay the Old Lamplighter to rest (he walks only at night)' },
    say: ["Before me, there was a keeper of the Lamp who didn't stop when he died. At night he walks the Starless Steps, putting out lamps that aren't his. Give him his rest, friend. He's earned it, and so have I."], done: ["Thank you. I'll be him one day, I suppose. Remind me to stop when I'm done."] },
  { id: 'dds4', giver: 'delverkettle', lvl: 23, name: 'Blind Trolls', where: 'glimmer', ...D, rep: L(250), obj: { kill: ['blindtroll'], n: 8, what: 'Defeat 8 blind trolls in the Glimmering Depths' },
    say: ["The blind trolls are coming up out of the Glimmering Depths, following the smell of our cooking. Eight of them. Don't let them smell you first."], done: ["Eight trolls! I'll put it in the log. 'Surface-friend: very good with trolls.'"] },
  { id: 'dy1', daily: true, giver: 'mira', lvl: 21, pre: 'dd2', name: 'Daily: Keep the Roads Lit', ...D, rep: L(200), obj: { kill: [...LOW, ...REACH], n: 12, what: 'Defeat 12 creatures on the roads of the Underdark' },
    say: ["Every day the crawlers come back, and every day we push them out again. It's not glamorous, but neither is being eaten."], done: ["Roads lit for another day. Thank you."] },
  { id: 'dy2', daily: true, giver: 'sorrel', lvl: 24, pre: 'dd5', name: 'Daily: Oil for the Lamp', ...D, rep: L(250), obj: { collect: GLIM, item: 'Flask of Deep-Oil', chance: .4, n: 5, what: 'Gather 5 flasks of deep-oil' },
    say: ["The Last Lamp burns a very particular oil, and the creatures of the Depths carry it in them. Five flasks today, friend, and the Lamp will thank you, in its way."], done: ["The Lamp is fed. One more day."] },
  { id: 'dy3', daily: true, giver: 'delverkettle', lvl: 24, pre: 'dd4', name: 'Daily: Hollowborn Patrol', ...D, rep: L(250), obj: { kill: HOLLOW, n: 10, what: 'Defeat 10 Hollowborn' },
    say: ["Ten Hollowborn, today and every day, until they run out of zealots or we run out of patience. I've got lots of patience."], done: ["Ten more. They must breed them."] },
]));
