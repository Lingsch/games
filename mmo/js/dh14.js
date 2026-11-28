// Build 14: the Dusk Hollows (levels 37-38). Down the drowned stair, under the Dusk Sea, is the old city of the
// lamp-divers: air-bells of glass on the sea floor, and lamps that burn underwater. Everyone swims here. Vesper Varrow
// came down a month ago with the Dusk Covenant, and she wants the Pearl-Lamp at the bottom of the Hollows lit, because
// its beam goes straight up through the sea and into the sky, and the makers will see it. Something else sees it first.
import { S, X, chat } from './core.js';
import { QUESTS, MOBS } from './data.js';
import { TALK, MOB_LORE } from './dialogue.js';
import { LORE } from './story.js';
import { world } from './world.js';
import { defineZone, defineDungeon } from './kit9.js';
import { mob, boss, rboss, B, U, HU, tier, giver } from './hi9.js';
import * as Rep from './rep6.js';
import { finish40, addDungeon40, addRaid40, side, props14, st14, LL, K, C, N, A, I, TK } from './l14.js';

Object.assign(MOBS, {
  angler: mob('Lantern Angler', 'angler14', { ...B, hpM: 1.5, spd: 5, weak: 'storm', scale: 1.1 }),
  glasseel: mob('Glass Eel', 'eel14', { ...B, hpM: 1.1, spd: 7, range: 12, ranged: true, caster: true, school: 'storm', weak: 'fire' }),
  duskshark: mob('Dusk Shark', 'shark', { ...B, hpM: 1.4, spd: 6.8, weak: 'storm' }),
  hollowcrab: mob('Hollow Crab', 'crab', { ...B, hpM: 1.7, spd: 4.2, weak: 'storm', resist: 'frost' }),
  covdiver: mob('Covenant Diver', 'diver14', { ...HU, hpM: 1.3, weak: 'storm' }),
  drownedchor: mob('Drowned Chorister', 'drowned1', { ...U, hpM: 1.1, range: 16, ranged: true, caster: true, school: 'frost', weak: 'holy' }),
  // named, out in the water
  sixteeth14: boss('Old Sixteeth', 'shark', { ...B, scale: 2.6, mechs: ['charge', 'cleave'], lines: { start: '*Sixteen teeth left. It only needs one.*', half: '*It circles, and comes again, faster.*' } }),
  longeel14: boss('The Long Eel', 'eel14', { ...B, scale: 3, range: 14, ranged: true, caster: true, school: 'storm', mechs: ['volley', 'pool'], lines: { start: '*It goes on for a very long time. The far end of it is still arriving.*', half: '*The water crackles.*' } }),
  // the Kelp Cathedral (open, 37-38)
  anglermother14: boss('Mother of Anglers', 'angler14', { ...B, scale: 2.6, mechs: ['spawn', 'pool'], adds: 'angler', lines: { start: '*Her lure is the size of a lighthouse lamp. Every diver who drowned in the Hollows swam toward it.*', half: '*The lure brightens. Something in you wants to swim to it.*' } }),
  kelpbishop14: boss('The Kelp-Bishop', 'drowned2', { ...U, range: 16, ranged: true, caster: true, school: 'frost', mechs: ['heal', 'call', 'volley'], adds: 'drownedchor', lines: { start: 'The sea is a church, diver, and you are late for the service.', half: 'Sing. SING.' } }),
  greatlure14: boss('The Great Lure', 'angler14', { ...B, hpM: 1.8, scale: 3.6, mechs: ['fear', 'pool', 'spawn', 'enrage'], adds: 'angler', lines: { start: '*It has hung in the Cathedral\'s nave for three hundred years, glowing, and everything that came to look at it is in its belly.*', half: '*The lure goes dark. That is worse.*' } }),
  // the Pearl Vaults (open, 38)
  vaultcrab14: boss('The Vault-Crab', 'crabbig', { ...B, scale: 2.2, mechs: ['slam', 'shield'], lines: { start: '*The lamp-divers kept their pearls in a vault. The crab kept the vault.*', half: '*It tucks in, and the shell rings like a bell.*' } }),
  morrow14: boss('Diver-Captain Morrow', 'diver14', { ...HU, scale: 1.5, mechs: ['call', 'cleave', 'charge'], adds: 'covdiver', lines: { start: 'Lady Vesper sends her regards. And us.', half: 'Hold the vault! The pearls are for the Lamp!' } }),
  pearleater14: boss('The Pearl-Eater', 'leviathan', { ...B, hpM: 1.8, scale: .9, mechs: ['knock', 'pool', 'charge', 'enrage'], lines: { start: '*It has eaten every pearl in the Vaults. You can see them, glowing, all down its length.*', half: '*It thrashes, and the Vaults shake.*' } }),
  // the Sunken Lamphouse (instance, 37-38)
  sl_warden14: boss('The Lamphouse Warden', 'diver14', { ...HU, scale: 2, mechs: ['slam', 'shield'], lines: { start: '*A lamp-diver in old brass, still on watch. The Covenant gave it new orders.*', half: '*Its faceplate cracks. Bubbles stream out. It keeps fighting.*' } }),
  sl_undertow14: boss('The Undertow', 'waterpet', { scale: 2.6, range: 14, ranged: true, caster: true, school: 'frost', weak: 'storm', mechs: ['knock', 'pool', 'volley'], lines: { start: '*The current through the Lamphouse has a mind of its own. It is not a kind mind.*', half: '*The water pulls. Everything goes toward the dark.*' } }),
  sl_lens14: boss('The Great Lens', 'construct14', { scale: 2.2, weak: 'storm', range: 18, ranged: true, caster: true, school: 'holy', mechs: ['volley', 'pool', 'shield'], lines: { start: '*The Lamphouse\'s lens. It was built to throw light a hundred miles. The Covenant has turned it on you.*', half: '*It focuses.*' } }),
  sl_vesh14: boss('Hierophant Vesh', 'cultist2~spectral', { ...HU, hpM: 2, scale: 1.6, range: 16, ranged: true, caster: true, school: 'frost', mechs: ['heal', 'call', 'fear', 'enrage'], adds: 'covdiver', lines: { start: 'You lit the Reach for us. Now you will light the Hollows. You won\'t mean to. You never mean to.', half: 'The makers will see us! The makers will come home!' } }),
  // the Drowned Choir (24-person raid)
  dc_gate24: rboss('The Tide-Gate Guardians', 'diver14', { hpM: 2.3, scale: 2.4, mechs: ['cleave', 'slam', 'call'], adds: 'covdiver', lines: { start: '*Two lamp-divers in brass taller than houses, at the gate of the deepest place in the sea.*', half: '*One of them calls down into the dark. Something calls back.*' } }),
  dc_pearl24: rboss('The Pearl Mother', 'crabbig', { hpM: 2.4, scale: 3.2, weak: 'storm', mechs: ['slam', 'shield', 'pool', 'spawn'], adds: 'hollowcrab', lines: { start: '*Every pearl in the Dusk Sea came out of her. The Covenant have been feeding her lamp-oil, to make them shine.*', half: '*She opens. The light inside is blinding.*' } }),
  dc_chorus24: rboss('The Chorus of the Drowned', 'choir', { hpM: 2.3, scale: 2.6, fly: .6, range: 20, ranged: true, caster: true, school: 'frost', mechs: ['fear', 'volley', 'call', 'aura'], auraK: .1, adds: 'drownedchor', lines: { start: '*Every lamp-diver who ever drowned in the Hollows, singing the Pearl-Lamp awake.*', half: '*The song goes up an octave. The water shakes with it.*' } }),
  dc_lure24: rboss('The Leviathan Lure', 'angler14', { hpM: 2.5, scale: 5, mechs: ['fear', 'knock', 'pool', 'spawn', 'enrage'], adds: 'angler', lines: { start: '*An angler the size of a ship, and the Pearl-Lamp is its lure. The Covenant have been feeding it light for a month.*', half: '*The lure blazes. Somewhere far above, the sky lights up.*' } }),
  dc_maw24: rboss('The Second Mouth of the Remnant', 'remnant14', { hpM: 3.2, scale: 2.4, weak: 'holy', resist: 'shadow', school: 'shadow', mechs: ['cleave', 'pool', 'fear', 'call', 'aura', 'enrage'], auraK: .15, adds: 'drownedchor', lines: { start: '*Another piece of Vhorun\'s hunger, swollen fat on the Pearl-Lamp\'s light. It has been waiting at the bottom of the sea, under the beam, with its mouths open.*', half: '*It drinks the beam. All of it.*' } }),
});
Object.assign(MOB_LORE, {
  angler: 'The lamp-divers lit the Hollows to keep the anglers away. When the lamps went out, the anglers came back, and brought their own.',
  covdiver: 'The Dusk Covenant, in borrowed brass. They came down the drowned stair a month ago, with Vesper Varrow at their head.',
  dc_maw24: 'The Second Mouth of the Remnant. Vhorun\'s hunger had no reason to stay in one piece once he was dead.',
});
giver('brack14', 'Captain Isolde Brack', 'Bellglass · the Lamp-Divers', 'bulwark2');
giver('nhu14', 'Old Nhu', 'Bellglass · keeper of the Pearl-Lamp', 'villager3');
giver('teo14', 'Teo Sixfathom', 'Bellglass · diver', 'knifeshade1');
giver('quill14', 'Quill', 'Bellglass · bell-smith', 'villager1');
giver('ama14', 'Salt-Mother Ama', 'Pearl Watch · elder of the divers', 'cleric1');
giver('oona14h', 'Sister Oona', 'Bellglass · come to find her mother', 'priest');
Object.assign(TALK, {
  brack14: { bio: 'Isolde Brack has captained the lamp-divers of Bellglass for twenty years. She has buried more of them than she has trained. She does not like Lamplighters, on principle. She has not yet decided what the principle is.',
    greet: ["Breathe slow. The bell only holds so much air, and you're new, so you'll waste it.", "Lamplighters. Hm. We had lamplighters, once. They drowned."],
    topics: [{ q: 'What is Bellglass?', a: ["An air-bell. Glass, on the sea floor, full of air we pump down from the stair. Forty people live in it. Forty-one, now. Don't get used to it."] },
      { q: 'Where is Vesper?', a: ["Down. Everything bad in the Hollows is down. She's at the Pearl-Lamp, or the Lamphouse, or the Drowned Choir. She's everywhere. She's got a lot of friends."] }] },
  nhu14: { bio: 'Old Nhu has kept the Pearl-Lamp for sixty years: the great lamp at the bottom of the Hollows that the lamp-divers never lit, because the old rule said it must never be lit. He has forgotten why. He thinks that is why he is still alive.',
    greet: ["The Pearl-Lamp must never be lit. That's the rule. I've forgotten the reason. I'm sure it was a good one.", "You're very bright, you Lamplighters. Lamps everywhere. Mind they don't notice."],
    topics: [{ q: 'Why must it never be lit?', a: ["The beam goes up. Straight up, through the whole sea and out the top and into the sky. My grandmother said if you lit it, things in the sky would see.", "I thought she meant the gulls."] }] },
  teo14: { bio: 'Teo dives deeper than anyone in Bellglass, and further, and for longer, and is going to drown doing it, and knows it, and doesn\'t care.',
    greet: ["Six fathoms on one breath. That's my name. It used to be four. It's going to be ten.", "You swim like a cow. A brave cow. Come on."], topics: [] },
  quill14: { bio: 'Quill makes and mends the air-bells. Every breath in Bellglass passes through something Quill built. Quill would like that remembered, and would like a cup of tea.',
    greet: ["Don't touch the glass. Don't lean on the glass. Don't look at the glass funny.", "Every bell leaks. The trick is leaking slower than you breathe."], topics: [] },
  ama14: { bio: 'Ama is the oldest diver in Pearl Watch, and has stopped diving, and still smells of the sea. She remembers when the Hollows were lit.',
    greet: ["Pearl Watch watches the pearls. Somebody has to. They don't watch themselves.", "When I was a girl, you could see from here to the Cathedral. Lamps all the way. Now look."], topics: [] },
  oona14h: { bio: 'Oona followed you down the drowned stair. Her mother was a lamp-diver of Bellglass, and never came home. Oona has come to find out why.',
    greet: ["I've never been underwater before. I don't like it. I'm staying.", "My mother's name was Linnet. Somebody here must remember her."], topics: [] },
});
Object.assign(LORE, {
  pearllamp: { title: 'The Rule of the Pearl-Lamp', where: 'pearlwatch', text: "Carved inside the Pearl Watch bell: 'The Pearl-Lamp is not for us. It is a door with a light on. Do not light it unless you want someone to knock. — the first divers.'" },
  linnetnote: { title: 'Linnet\'s Last Dive', where: 'deepshelf', text: "A diver's slate, in a dead woman's hand: 'Found the Covenant at the Lamphouse. They want the Pearl-Lamp lit. They say the makers will come. Going down to stop them. Tell Oona I'm sorry about the cat.'" },
});
X.VEND = Object.assign(X.VEND || {}, { bellglass: ['Pumpwright Sal', 'villager2'], pearlwatch: ['Pearl-Trader Ivo', 'villager1'] });
X.inspectSay = Object.assign(X.inspectSay || {}, {
  pearlclam: ['The clam opens a crack, and you get your knife in. A lamp-pearl, the size of an egg, glowing.', 'A pearl. It is warm in your hand. They are always warm.', 'Empty. No. There, at the back. Small, but bright.'],
  airbell: ['An old air-bell. You check the seals. One is leaking. You plug it with what you have.', 'The bell still holds air. Somebody\'s left a cup inside, and a book, and a very old sandwich.', 'Cracked. You mark it for Quill.'],
  covsounder: ['A Covenant sounding-line, dropped down to measure the depth to the Pearl-Lamp. You cut it.', 'A sounding-line, knotted at every fathom. Someone has painted a star on the weight. You cut it.'],
  drownedlamp: ['A drowned street-lamp, still on its post. You light it. It burns green underwater.', 'You clear the weed off the lamp and light it. Little fish come to look.', 'The lamp catches. For a moment the whole street is visible: doors, windows, a bicycle.'],
  linnetmark: ['A diver\'s mark, scratched in the rock: a bird. Linnet\'s mark. It points down.', 'Another bird, scratched deeper. She was in a hurry.', 'The last bird. Under it: "OONA" and an arrow pointing home.'],
  kelpnest: ['An angler nest in the kelp. Eggs, glowing faintly. You crush them.', 'The kelp is full of eggs. You do what has to be done.'],
});

const H = { zone: 'dh14' }, SEA = ['angler', 'glasseel', 'duskshark', 'hollowcrab'], COVS = ['covdiver', 'drownedchor'];
for (const m of [...SEA, ...COVS]) Rep.KILL_REP[m] = ['lamp14', 6];
X.arriveHooks.push((zone, from) => zone === 'dh14' ? ({ sf14: { x: 450, z: -100 } }[from] || { x: -455, z: 100 }) : zone === 'lr14' && from === 'dh14' ? { x: 450, z: 100 } : null);
defineZone('dh14', {
  size: 500, seed: 14023, name: 'The Dusk Hollows', bossName: 'The Second Mouth of the Remnant', hiH: 16, maxSpawnH: 30,
  land: (x, z, N) => Math.max(1.5, 4 + N.fbm(x * .006, z * .006, 4) * 16 + Math.abs(N.fbm(x * .02, z * .02, 2)) * 8 - Math.max(0, 1 - Math.hypot(x - 40, z + 380) / 120) * 10),
  pal: { a: '#6a8a96', b: '#5a7a88', hi: '#8aa8a8', road: '#a8b8b0', cob: '#b8c4bc', low: '#3a5a6a' },
  towns: [{ key: 'bellglass', name: 'Bellglass', x: -380, z: 100, R: 30, wall: 'stones', gates: [0, Math.PI], guardName: 'Lamp-Diver', guardKind: 'bladewarden1',
    houses: [[-12, 10, .4, 'hut'], [12, 10, -.4, 'hut'], [-14, -10, .2, 'hall', 9, 5], [14, -10, 2.2, 'hut']], props: [[0, 4, 'bluelamp'], [-6, 0, 'bluelamp'], [6, 0, 'bluelamp'], [0, -6, 'banner', '#6affef']],
    npcs: [['giver', 'brack14', 0, 0], ['giver', 'nhu14', -8, 6], ['giver', 'teo14', 4, 8], ['giver', 'quill14', -10, -4], ['giver', 'oona14h', 9, -2], ['vendor', 'bellglass', 8, 6], ['bind', null, 3, -4], ['armory', null, -6, -6]], guards: [[28, 2], [28, -2], [-28, 2], [-28, -2]] },
    { key: 'pearlwatch', name: 'Pearl Watch', x: 220, z: 320, R: 22, wall: 'stones', gates: [Math.PI, Math.PI / 2], guardName: 'Pearl-Watcher', guardKind: 'archer1',
      houses: [[-6, 6, .3, 'hut'], [6, -6, -.4, 'hut']], props: [[0, 0, 'bluelamp'], [4, 4, 'banner', '#6affef']],
      npcs: [['giver', 'ama14', -5, -2], ['vendor', 'pearlwatch', 6, -4], ['bind', null, 0, 6]], guards: [[-20, 2], [-20, -2]] }],
  roads: [[-460, 100, -340, 100], [-340, 100, -120, 160], [-120, 160, 220, 300], [-120, 160, -60, -60], [-60, -60, 260, -60], [260, -60, 460, -100], [-60, -60, 40, -330]],
  regions: { names: ['Bellglass', 'Pearl Watch', 'The Kelp Cathedral', 'The Pearl Vaults', 'The Deep Shelf'], fn: (x, z) => z < -220 ? 4 : x < -220 && z > -60 ? 0 : z > 200 ? 1 : x < 60 ? 2 : 3 },
  open: [{ key: 'kelpcathedral', name: 'The Kelp Cathedral', x: -160, z: -60, R: 34, deco: 'kelp', decoN: 30, ring: true, gap: 0, centre: 'stonecircle', lvl: [37, 38], area: 2,
      packs: [[-18, 0, ['angler', 'angler', 'drownedchor']], [18, 0, ['drownedchor', 'drownedchor']], [0, -18, ['angler', 'glasseel', 'glasseel']], [0, 18, ['duskshark', 'angler']]],
      bosses: [[-22, -18, 'anglermother14', 37], [22, -20, 'kelpbishop14', 38], [0, -4, 'greatlure14', 38, true]] },
    { key: 'pearlvaults', name: 'The Pearl Vaults', x: 280, z: 40, R: 34, deco: 'glowcoral', decoN: 18, centre: 'statue', lvl: [38, 38], area: 3,
      packs: [[-18, 0, ['hollowcrab', 'hollowcrab', 'covdiver']], [18, 0, ['covdiver', 'covdiver']], [0, -18, ['hollowcrab', 'glasseel', 'covdiver']], [0, 18, ['duskshark', 'covdiver']]],
      bosses: [[-22, -18, 'vaultcrab14', 38], [22, -20, 'morrow14', 38], [0, -4, 'pearleater14', 38, true]] }],
  doors: [{ to: 'lamphouse', name: 'The Sunken Lamphouse', x: -320, z: -300, ry: 0, label: 'Swim into the Sunken Lamphouse (37-38)', col: '#6affef' },
    { to: 'drownedchoir', name: 'The Drowned Choir', x: 40, z: -420, ry: 0, label: 'Dive down to the Drowned Choir (24-person raid)', col: '#ffffff' }],
  landmarks: [{ g: 'drownedpillar', x: 0, z: 120, name: 'The Drowned Arch', R: 12, clear: 8, s: 2.4 }, { g: 'seashell', x: 340, z: -260, name: 'The Great Shell', R: 14, clear: 10, s: 3 }],
  lines: [{ x: -488, z: 100, to: 'lr14', label: 'Up the drowned stair to the Lampless Reach', ry: -Math.PI / 2 },
    { x: 488, z: -100, to: 'sf14', label: 'Up out of the sea, east, to where the star fell', ry: Math.PI / 2, why: () => (S.hero?.lvl || 0) < 38 ? 'Starfall is for level 38 and beyond.' : S.quests.zh9?.state !== 'turned' && S.quests.zh9?.state !== 'done' ? 'The sea floor rises toward the shore. Nothing up there yet.' : null }],
  spots: { bellglass: { x: -380, z: 100 }, kelproad: { x: -250, z: 130 }, arch: { x: 0, z: 120 }, pearlwatch: { x: 220, z: 320 }, cathedral: { x: -160, z: -60 }, vaults: { x: 280, z: 40 },
    deepshelf: { x: 40, z: -260 }, lamphouse: { x: -320, z: -290 }, choir: { x: 40, z: -400 }, shell: { x: 340, z: -260 }, eastshore: { x: 440, z: -100 } },
  scatter: [[40, [-480, -220, -60, 300], ['angler', 'glasseel', 'hollowcrab'], [37, 37], 0], [40, [-220, 480, 200, 480], ['angler', 'duskshark', 'glasseel'], [37, 38], 1],
    [44, [-480, 60, -220, 200], ['angler', 'drownedchor', 'glasseel', 'duskshark'], [37, 38], 2], [44, [60, 480, -220, 200], ['hollowcrab', 'covdiver', 'duskshark'], [38, 38], 3],
    [48, [-480, 480, -480, -220], ['covdiver', 'drownedchor', 'duskshark', 'angler'], [38, 38], 4]],
  camps: [[6, [60, 480, -220, 200], ['covdiver', 'covdiver', 'drownedchor'], [38, 38], 3, 'cd'], [5, [-480, 480, -480, -220], ['covdiver', 'drownedchor', 'drownedchor'], [38, 38], 4, 'dc']],
  rares: [[[-220, 480, 200, 480], 'sixteeth14', 38, false], [[-480, 480, -480, -220], 'longeel14', 38, true]],
  hunt: [{ area: 0, lvl: [37, 37] }, { area: 1, lvl: [37, 38] }, { area: 2, lvl: [37, 38] }, { area: 3, lvl: [38, 38] }, { area: 4, lvl: [38, 38] }],
  labels: [{ t: 'Around Bellglass (37)', x: -300, z: 200 }, { t: 'Pearl Watch (37-38)', x: 220, z: 240 }, { t: 'The Kelp Cathedral (37-38)', x: -160, z: 20 }, { t: 'The Pearl Vaults (38)', x: 280, z: 120 }, { t: 'The Deep Shelf (38)', x: 40, z: -320 }],
  nodes: [['voidiron', 'ore', 'oresilver', 140, null, 22], ['gloomcap', 'herb', 'herbgrave', 140, null, 26]],
  scenery: { density: 12000, tuft: '#3a7a6a', kinds: [['kelp', .05, 1, 2.4], ['coral', .02, .8, 1.8], ['glowcoral', .012, .8, 1.6], ['seashell', .004, .6, 1.2], ['drownedpillar', .003, .8, 1.4]] },
  sky: { fog: '#0e2c46', top: '#0a2238', hor: '#1a4a6a', k: 1, far: 100 },
  after: ({ rng }) => {
    world.underwater = true;
    props14([['pearlclam', 'A giant clam', 'clam14', 260, 180, 6, 90], ['airbell', 'An old air-bell', 'salvage14', -250, 180, 5, 80], ['covsounder', 'A Covenant sounding-line', 'altar14', 100, -160, 5, 90],
      ['drownedlamp', 'A drowned street-lamp', 'lampwreck14', 0, 120, 6, 70], ['linnetmark', 'A diver\'s mark', 'carving14', -120, -240, 3, 80, 'linnetnote'], ['kelpnest', 'An angler nest', 'opengrave', -180, 40, 5, 60]], rng);
    world.props.push({ id: 'pwlore', kind: 'lorebook', tag: 'lore', name: 'A carving in the bell', lore: 'pearllamp', x: 226, z: 314, yaw: 0, scale: 1 });
  },
});
defineDungeon({ key: 'lamphouse', name: 'The Sunken Lamphouse', parent: 'dh14', plan: 'winding', floor: '#4a6a72', rock: '#0e2230', fog: '#0e2c46', light: .4, lvl: [37, 38], prop: 'bluelamp',
  mobs: ['covdiver', 'drownedchor', 'angler', 'glasseel'], bosses: ['sl_warden14', 'sl_undertow14', 'sl_lens14', 'sl_vesh14'], exitLabel: 'Swim back out' });
defineDungeon({ key: 'drownedchoir', name: 'The Drowned Choir', parent: 'dh14', plan: 'nave', floor: '#3a5a66', rock: '#081822', fog: '#0a2236', light: .38, lvl: [38, 38], prop: 'bluelamp', raid: true,
  mobs: ['covdiver', 'drownedchor', 'angler', 'duskshark', 'hollowcrab'], bosses: ['dc_gate24', 'dc_pearl24', 'dc_chorus24', 'dc_lure24', 'dc_maw24'], exitLabel: 'Swim back up' });
addDungeon40('lamphouse', 'The Sunken Lamphouse', [37, 38]); addRaid40('drownedchoir', 'The Drowned Choir', 24, 38);
tier({ kelpcathedral: 18, pearlvaults: 18, lamphouse: 18, drownedchoir: 19 });
X.kill.push(m => {
  if (m.mob !== 'dc_maw24' || st14().mouth2) return; st14().mouth2 = true;
  chat('sys', null, 'The Second Mouth of the Remnant is dead, and the Pearl-Lamp goes dark. But for one long moment, before it did, its beam went all the way up.');
  setTimeout(() => chat('sys', null, 'Far to the east, something falls out of the sky. It is burning. It is very big.'), 4000);
});

// ---------- the story ----------
QUESTS.push(...finish40([
  { id: 'zh1', story: true, giver: 'brack14', lvl: 37, pre: 'zl11', name: 'Breathe Slow', where: 'kelproad', ...H, rep: LL(400), obj: K(['angler', 'glasseel'], 12, 'Clear 12 anglers and eels off the kelp road to Bellglass', 'kelproad', 200),
    say: ["Lamplighters. Underwater. Hm. Oona said you'd come. She said you were stubborn. She said it like it was a good thing.", "The kelp road's full of anglers. They follow the light from the bell and wait outside for anyone who swims out. Twelve, and I'll believe you can swim."],
    done: ["You can swim. Badly. You'll do."] },
  { id: 'zh2', story: true, giver: 'nhu14', lvl: 37, pre: 'zh1', name: 'Pearls for the Bell', where: 'vaults', ...H, rep: LL(400), obj: I('pearlclam', 4, 'Gather 4 lamp-pearls from the giant clams toward the Pearl Vaults'),
    say: ["The bell's lamps run on pearl-light. Lamp-pearls, from the big clams. They glow for a year. We've run low, since the Covenant came.", "Four. Don't let the clams close on your hand. They don't let go. They don't know how."],
    done: ["Lovely. Lovely warm pearls. Bellglass will see another year. Mind you don't light anything bigger with them."] },
  { id: 'zh3', story: true, giver: 'teo14', lvl: 37, pre: 'zh1', name: 'A Woman in Black', where: 'deepshelf', ...H, rep: LL(400), obj: K(['covdiver', 'drownedchor'], 10, 'Kill 10 of the Dusk Covenant on the Deep Shelf', 'deepshelf', 220),
    say: ["The Covenant are camped on the Deep Shelf, south. Divers in brass we used to own. A woman in black leads them. I've seen her. She doesn't wear a helm. She doesn't need to breathe, I don't think.", "Ten. I want them scared. They're never scared."],
    done: ["Ten. And they weren't scared, were they. They were happy. Happy to die for her. What has she promised them?"] },
  { id: 'zh4', story: true, giver: 'brack14', lvl: 37, pre: 'zh2', pre2: 'zh3', name: 'The Kelp Cathedral', where: 'cathedral', ...H, rep: LL(500), obj: N('greatlure14', 'Swim into the Kelp Cathedral and kill the Great Lure'),
    say: ["The anglers come from the Kelp Cathedral. There's a lure in the nave that's been glowing for three hundred years. Divers swim to it in their sleep. I've lost four this year.", "Kill it. Turn the light off. For once I want something in the Hollows to be dark."],
    done: ["Dark. Good. Good. That's four I can tell to sleep easy, wherever they are."] },
  { id: 'zh5', story: true, giver: 'ama14', lvl: 38, pre: 'zh4', name: 'The Pearl Vaults', where: 'vaults', ...H, rep: LL(500), obj: N('pearleater14', 'Go into the Pearl Vaults and kill the Pearl-Eater'),
    say: ["The Covenant have taken the Pearl Vaults. Every pearl the divers ever gathered. They're feeding them to something. It's getting very bright, out east.", "Whatever's eating them, kill it. The pearls are ours. We'd rather they stayed in the dark."],
    done: ["Captain Morrow was there? Morrow was a Bellglass diver once. He drowned. Or I thought he did. He went to her, didn't he. They all go to her."] },
  { id: 'zh6', story: true, giver: 'teo14', lvl: 38, pre: 'zh5', name: 'What Vesper Wants', where: 'bellglass', ...H, rep: LL(400), obj: TK('Hear what the captured diver says'),
    say: [["teo14", "We caught one. A Covenant diver, half-drowned in a cracked helm. He won't stop talking. You need to hear this."], ["nhu14", "He says Vesper means to light the Pearl-Lamp. The great lamp at the bottom of the Hollows. The one that's never been lit."], ["teo14", "He says its beam goes all the way up, through the sea and into the sky, and the makers will see it, and come home, and lift everyone up into the light between the stars."]],
    done: [["nhu14", "A door with a light on. That's what my grandmother called it. Do not light it unless you want someone to knock."], ["brack14", "Then we stop her. Lamplighters. Divers. Whoever. We stop her lighting it."]] },
  { id: 'zh7', story: true, giver: 'brack14', lvl: 38, pre: 'zh6', name: 'The Sunken Lamphouse', where: 'lamphouse', ...H, rep: LL(600), obj: N('sl_vesh14', 'Swim into the Sunken Lamphouse and stop Hierophant Vesh'),
    say: ["The Pearl-Lamp's lit from the Lamphouse. Big lens. Bigger valves. Vesper's put her hierophant in charge of it, a man called Vesh.", "Stop him, and she has to do it herself, down at the Drowned Choir. That's where she'll be. That's where we'll have her."],
    done: ["He said you'd light it for them? He's mad. They're all mad. ...Aren't they?"] },
  { id: 'zh8', story: true, giver: 'nhu14', lvl: 38, needLvl: 38, pre: 'zh7', name: 'The Drowned Choir', where: 'choir', ...H, rep: LL(1400), obj: N('dc_maw24', 'Dive to the Drowned Choir and stop the Pearl-Lamp being lit (24-person raid)'),
    say: ["Vesper's at the Drowned Choir, at the bottom of everything, where the Pearl-Lamp is. Her people are singing it awake. You can hear it in the bell. Can you hear it?", "Take everyone. The divers will come. The Lamplighters. Whoever you've got. Twenty-four, and swim fast."],
    done: [["nhu14", "It's dark. The Pearl-Lamp's dark. You did it."], ["brack14", "Not before it fired. I saw it from the bell. A beam like a sword, straight up. Just for a moment."], ["teo14", "And Vesper? She wasn't there? She was never there. She was somewhere else, watching it go up."]] },
  { id: 'zh9', story: true, giver: 'oona14h', lvl: 38, pre: 'zh8', name: 'Something Answered', where: 'eastshore', ...H, rep: LL(400), obj: TK('Talk with Oona about what fell'),
    say: [["oona14h", "Did you see it? When the beam went up? Something in the sky moved. Then it fell. East, burning, over the shore."], ["brack14", "The makers, the Covenant'll say. Come home at last."], ["oona14h", "Makers don't fall. Makers don't burn. Whatever that is, it isn't what they wanted. It's what they got."]],
    done: [["oona14h", "Ammara's coming. Mira sent for her. She knows about the stars. She'll meet you where it fell."], ["oona14h", "I found my mother's slate. She was trying to stop them too. I'm going to stay here a while. Somebody should light the drowned lamps."]] },
]));

// ---------- the smaller roads ----------
const bell = side('dh14', LL, 'zh1', [
  ['zhb1', 'quill14', 37, 'Leaky Bells', 'kelproad', I('airbell', 4, 'Check 4 of the old air-bells along the kelp road'), "There are old bells along the kelp road. Emergency air. Check them. Plug what leaks. Mark what's cracked. Don't break anything. Don't breathe on anything.", "Four. Two leaking, one cracked, one with a sandwich in it. Better than I thought."],
  ['zhb2', 'quill14', 37, 'Crab Shell for Seals', 'kelproad', C(['hollowcrab'], 'Crab-Shell Plate', 6, 'Bring Quill 6 crab-shell plates for the bell seals'), "Hollow crab shell makes the best seals. Six plates. Not cracked. Not chipped. Not breathed on.", "These will do. These will do very nicely. You've stopped breathing so loudly, I notice."],
  ['zhb3', 'teo14', 37, 'Eight Fathoms', 'arch', A('arch', 'Swim out to the Drowned Arch with Teo, on one breath'), "Race you to the Drowned Arch. One breath. Loser carries the pearls home.", "You made it! On one breath! You're lying, aren't you. I don't care. You made it."],
  ['zhb4', 'brack14', 37, 'Sharks in the Bell-Lights', 'kelproad', K(['duskshark'], 8, 'Kill 8 dusk sharks circling the Bellglass lights', 'bellglass', 200), "The sharks circle the bell when the lamps are lit. They think the light means food. It usually does. Eight.", "Eight. They'll be back. Fewer, though. You're good for fewer."],
  ['zhb5', 'nhu14', 37, 'Pearl-Light Recipe', 'kelproad', C(['angler'], 'Angler Lure-Sac', 5, 'Bring Old Nhu 5 lure-sacs from the anglers'), "An angler's lure-sac has a light in it you can mix into lamp-oil. Burns blue underwater. Five, and I'll make enough for the street.", "Blue light. Like the old days. I'll light the street tonight. Well. Whenever. It's always night down here."],
  ['zhb6', 'oona14h', 37, 'My Mother\'s Name', 'bellglass', TK('Ask around Bellglass about a diver called Linnet'), "My mother was Linnet. A diver. She went down after something a month before the dark, and didn't come up. Somebody here must have known her.", [["brack14", "Linnet. Course I knew Linnet. Best diver I ever had. She went after the Covenant, at the Lamphouse, alone. Never came back."], ["oona14h", "Alone. That's her. That's very her."]]],
  ['zhb7', 'oona14h', 37, 'Linnet\'s Marks', 'deepshelf', I('linnetmark', 3, 'Follow Linnet\'s diver marks toward the Deep Shelf'), "Divers leave marks when they go somewhere nobody's been. Linnet's mark was a bird. Find them. Follow them. I want to know where she went.", "A slate. Her slate. She was trying to stop them. She was sorry about the cat. Of course she was sorry about the cat."],
  ['zhb8', 'brack14', 37, 'Drowned Lamps', 'arch', I('drownedlamp', 4, 'Light 4 of the drowned street-lamps around the Drowned Arch'), "The old street past the Arch had lamps that burn underwater. Nobody's lit them since the Covenant came. Light four. Let's see what's left of the street.", "You can see the street from the bell now. All the doors. All the windows. I'd forgotten there were so many."],
  ['zhb9', 'quill14', 38, 'Pump Parts', 'deepshelf', C(['covdiver'], 'Brass Valve', 6, 'Take back 6 brass valves from the Covenant divers'), "The Covenant stole our spare helms, and the helms have our valves in them, and I need them back. Six. Take them off the divers. They won't need them. After.", "Bellglass valves, every one. I'd know my own work anywhere. I'd know it in the dark."],
  ['zhb10', 'teo14', 38, 'Old Sixteeth', 'pearlwatch', N('sixteeth14', 'Hunt down Old Sixteeth, the biggest shark in the Hollows'), "There's a shark called Old Sixteeth that took my father's leg, and my uncle's arm, and my cousin's whole everything. I want its teeth. All sixteen.", "Sixteen. I'll string them. I'll wear them. Everybody in the bell is going to have to look at them, every day, forever."],
  ['zhb11', 'nhu14', 38, 'Never Light the Lamp', 'bellglass', TK('Listen to Old Nhu\'s grandmother\'s story'), "Sit. You've been running about. I'll tell you what my grandmother told me about the Pearl-Lamp, and you'll forget it, and so will I, and that's fine.", "And she said: it's not a lamp to see by. It's a lamp to be seen by. I always thought that was a lovely thing to say. I don't think so any more."],
  ['zhb12', 'quill14', 38, 'Glass for the Bell', 'cathedral', C(['glasseel'], 'Eel-Glass', 6, 'Collect 6 lengths of eel-glass from the glass eels'), "Glass eels grow glass along their backs. Proper glass, clear as air. Six lengths, and I'll replace the cracked panes before they become a problem.", "Lovely. Lovely and clear. Don't tell anyone where I get my glass. They'd never sleep again."],
  ['zhbd', 'brack14', 37, 'Keep the Road Clear', 'kelproad', K(['angler', 'glasseel', 'duskshark'], 8, 'Clear 8 things off the kelp road', 'kelproad', 200), "The road fills up every day. Eight.", "Clear. Same tomorrow.", { daily: true }],
]);
const watch = side('dh14', LL, 'zh3', [
  ['zhw1', 'ama14', 37, 'The Watch Is Short', 'pearlwatch', K(['hollowcrab', 'duskshark'], 10, 'Kill 10 crabs and sharks around Pearl Watch', 'pearlwatch', 200), "Pearl Watch has six watchers and four of them are older than me. Ten crabs and sharks, so we can get some sleep.", "Ten. Bless you. I'll sleep tonight. I'll sleep like a stone. Like a drowned stone."],
  ['zhw2', 'ama14', 37, 'Pearls in the Shallows', 'pearlwatch', I('pearlclam', 2, 'Gather 2 more pearls from the clams near the Vaults for Pearl Watch'), "Two pearls. Just two. For the Watch's own lamp. We gave all ours to the Vaults and the Vaults gave them to the Covenant.", "Two lights. Enough to see by. Not enough to be seen by. That's the trick."],
  ['zhw3', 'ama14', 38, 'Captain Morrow', 'vaults', N('morrow14', 'Find Diver-Captain Morrow in the Pearl Vaults and stop him'), "Morrow was mine. My diver, my pupil. He drowned, we thought. He went to her. Stop him. Don't bring him back. I couldn't look at him.", "He said 'Lady Vesper'? Lady. She's a lady now. Of course she is."],
  ['zhw4', 'ama14', 38, 'The Vault-Crab', 'vaults', N('vaultcrab14', 'Kill the Vault-Crab in the Pearl Vaults'), "The crab in the Vaults was ours. We fed it, it guarded the pearls. The Covenant feed it lamp-oil now. It's not ours any more.", "Poor thing. It only did what it was fed to do. So do we all."],
  ['zhw5', 'teo14', 38, 'Cut the Lines', 'deepshelf', I('covsounder', 4, 'Cut 4 of the Covenant\'s sounding-lines on the Deep Shelf'), "The Covenant drop lines from the Shelf to measure how deep the Pearl-Lamp is. Cut them. Cut all of them. Make them measure again.", "Four. They'll put more down. They've got rope for days. So have I."],
  ['zhw6', 'teo14', 38, 'Brass Helms', 'deepshelf', C(['covdiver'], 'Covenant Helm', 5, 'Take 5 helms from the Covenant divers'), "Every helm they wear is a helm a Bellglass diver should be wearing. Five back. I'll paint over the stars.", "Five. Look, they painted stars on them. Little gold stars. I'm going to paint fish."],
  ['zhw7', 'ama14', 38, 'The Long Eel', 'deepshelf', N('longeel14', 'Hunt the Long Eel somewhere on the Deep Shelf'), "There's an eel on the Deep Shelf that goes on for ever. Long Eel. It took the Watch's bell-rope, and the bell, and the man ringing the bell. Kill it.", "The far end will keep twitching for a day or two. Don't let it worry you. It worries me."],
  ['zhw8', 'brack14', 38, 'Drowned Choristers', 'deepshelf', K(['drownedchor'], 10, 'Silence 10 drowned choristers on the Deep Shelf', 'deepshelf', 240), "There are dead divers singing on the Shelf. Singing. Underwater. You can hear it through the glass at night. Shut them up. Ten.", "Quiet. It's never been this quiet. I don't like it either. You can't win in the Hollows."],
  ['zhw9', 'ama14', 38, 'The Great Shell', 'shell', A('shell', 'Swim out to the Great Shell in the east and see what the Covenant are doing there'), "The Covenant swim out to the Great Shell, east, every night. Go and look. Don't be seen. If you're seen, be fast.", "Signalling. With lamps, out of the Shell, up toward the surface. To who? To what? Ask Nhu. Nhu knows everything and remembers none of it."],
  ['zhw10', 'nhu14', 38, 'Pearl-Light, Dimmed', 'pearlwatch', C(['angler', 'glasseel'], 'Dark Ink', 6, 'Bring Nhu 6 sacs of dark ink from the deep things'), "Squid ink. Eel ink. Anything dark. I want to make a pearl-lamp that only shines down. Six sacs.", "There. A lamp that shines down and not up. Nothing above us will see it. That's how the old divers did it. I've remembered something!"],
  ['zhwd', 'ama14', 38, 'Pearls for the Watch', 'vaults', C(['hollowcrab', 'covdiver'], 'Loose Pearl', 6, 'Recover 6 loose pearls around the Pearl Vaults'), "Six a day. The Watch needs light, and the Vaults are still full of thieves.", "Six. Same tomorrow.", { daily: true }],
]);
const cath = side('dh14', LL, 'zh4', [
  ['zhc1', 'brack14', 37, 'Angler Nests', 'cathedral', I('kelpnest', 4, 'Crush 4 angler nests in the kelp around the Cathedral'), "The anglers nest in the kelp around the Cathedral. Crush the eggs. Four nests. I know. I know. Do it anyway.", "Thank you. I'll buy you a drink. We've only got seawater. I'll buy you seawater."],
  ['zhc2', 'brack14', 37, 'Mother of Anglers', 'cathedral', N('anglermother14', 'Kill the Mother of Anglers in the Kelp Cathedral'), "All the anglers in the Hollows come from one mother, in the Cathedral. Her lure's the size of a lamp-house lamp. Don't look at it.", "Did you look at it? You looked at it. Everyone looks at it. Sit down for a bit."],
  ['zhc3', 'oona14h', 38, 'The Kelp-Bishop', 'cathedral', N('kelpbishop14', 'Lay the Kelp-Bishop to rest in the Cathedral'), "There's a priest in the Cathedral who drowned saying mass and never stopped. The divers call him the Kelp-Bishop. I'm a sister of the Abbey. I know a little about priests who won't stop.", "He's at peace. Or he's quiet. Sometimes it's hard to tell the difference."],
  ['zhc4', 'teo14', 37, 'Lure Hunting', 'cathedral', C(['angler'], 'Lure-Light', 6, 'Take 6 lure-lights from the anglers around the Cathedral'), "Lure-lights are worth a lot up top. I'm saving up. For what? For when there's an up top worth spending it in.", "Six. One day I'll swim up the stair with a bag of these and buy a house with a window. A real window. With sky in it."],
  ['zhc5', 'quill14', 38, 'Cathedral Glass', 'cathedral', A('cathedral', 'Look at the Cathedral\'s windows and tell Quill what\'s left'), "The Cathedral had the best windows in the Hollows. Stained glass, underwater. Go and look. Tell me if any are left. Tell me gently.", "One? Just one? The blue one? ...That was the one I liked. Thank you for telling me gently. You weren't very gentle."],
  ['zhc6', 'nhu14', 38, 'The Choir Is Waking', 'cathedral', K(['drownedchor', 'angler'], 12, 'Kill 12 things in the Kelp Cathedral', 'cathedral', 120), "The dead in the Cathedral have started to sing. Low, so you feel it in the floor. Twelve, and maybe they'll lose the tune.", "They've lost the tune. For now. It'll come back. Tunes always do."],
  ['zhc7', 'oona14h', 38, 'Light the Way Home', 'arch', I('drownedlamp', 2, 'Light 2 more drowned street-lamps, so the lost divers can find their way back'), "The divers say the dead swim toward light. I want them swimming toward the bell, not the Cathedral. Two more lamps.", "There. A street they can follow home. My mother might be on it. I'm going to leave the door unlatched."],
  ['zhc8', 'brack14', 38, 'Diver\'s Funeral', 'bellglass', TK('Stand with Captain Brack for the drowned divers'), "We're saying the names tonight. All the divers the Hollows took this year. Stand with us. You've earned it. Don't sing. You can't sing.", "That was all of them. That was a lot of them. Thank you for standing. You can go now. Go on."],
  ['zhcd', 'teo14', 38, 'Deep Dive', 'deepshelf', K(['covdiver', 'drownedchor', 'duskshark'], 8, 'Dive the Deep Shelf with Teo and clear 8 things', 'deepshelf', 240), "Every day I go a little deeper. Come with me. Eight things, and back before we run out of air.", "Nine fathoms today. Tomorrow, ten.", { daily: true }],
]);
const choir = side('dh14', LL, 'zh7', [
  ['zhr1', 'nhu14', 38, 'The Tide-Gate', 'choir', N('dc_gate24', 'Get past the Tide-Gate Guardians at the Drowned Choir (24-person raid)'), "There are two divers at the gate of the Choir. Big. Brass. Very old. Get past them. You won't talk them round. They don't talk.", "Down they went. That gate's been shut a hundred years. Now it's open. I hope we're right about this."],
  ['zhr2', 'ama14', 38, 'The Pearl Mother', 'choir', N('dc_pearl24', 'Kill the Pearl Mother in the Drowned Choir (24-person raid)'), "Every pearl in the Hollows came out of one mother, down in the Choir. The Covenant have been feeding her oil to make her pearls shine brighter. She's suffering. End it.", "It's done? I'm sorry for her. I'm not sorry it's done. Both things are true."],
  ['zhr3', 'oona14h', 38, 'The Chorus of the Drowned', 'choir', N('dc_chorus24', 'Silence the Chorus of the Drowned (24-person raid)'), "My mother's down there, singing, with all the others. I know she is. Stop the singing. Let her rest.", "Was she there? Don't tell me. I don't want to know. I want to know. Don't tell me."],
  ['zhr4', 'brack14', 38, 'The Leviathan Lure', 'choir', N('dc_lure24', 'Kill the Leviathan Lure, whose lure is the Pearl-Lamp itself (24-person raid)'), "The Pearl-Lamp isn't just a lamp. Teo's seen it. It's on a stalk, growing out of something the size of Bellglass. Kill the thing, and the lamp goes out.", "It went out. Just. A heartbeat late, Teo says. A heartbeat's a long time, for light."],
  ['zhr5', 'teo14', 38, 'Ten Fathoms', 'choir', A('choir', 'Dive all the way down to the gate of the Drowned Choir with Teo'), "Ten fathoms on one breath. Today. Right now. The Choir gate's ten fathoms down from the Shelf. Come with me.", "Ten! Ten! I'm changing my name! Teo Tenfathom! It's terrible! I love it!"],
  ['zhr6', 'quill14', 38, 'A Bell for Pearl Watch', 'pearlwatch', A('pearlwatch', 'Carry Quill\'s new air-bell to Pearl Watch'), "I've made Pearl Watch a new bell. Better than theirs. Better than ours, frankly. Carry it there. Don't drop it. Don't drop it. Don't.", [["ama14", "A new bell! From Quill? Quill hasn't made anyone a bell in years. Tell Quill... no, I'll tell Quill. I'll swim over."]]],
  ['zhr7', 'brack14', 38, 'Signal Lamps', 'shell', K(['covdiver', 'drownedchor'], 10, 'Kill 10 of the Covenant signalling from the Great Shell', 'shell', 200), "They're still signalling, out at the Great Shell. Lamps pointed up. They don't care that the Pearl-Lamp's dark. They want somebody to see something. Ten.", "Ten. The lamps are out. For now. Ama says they were signalling the same thing over and over. Three long, one short. Over and over."],
  ['zhr8', 'nhu14', 38, 'Nhu Remembers', 'bellglass', TK('Hear what Old Nhu has remembered'), "I remembered! I remembered the rest of it! What my grandmother said! Sit, sit, before I forget again.", "She said: the world is behind a curtain, and the curtain is a lamp, and the Pearl-Lamp is a hole in it. I don't know what it means. I've remembered it. That's enough for one day."],
  ['zhr9', 'teo14', 38, 'What Fell', 'eastshore', A('eastshore', 'Swim to the east shore and look at where the burning thing came down'), "Something fell out of the sky, east. I saw it through the water. Go and look. Up the slope, where the sea gets shallow. Then come and tell me. I'm not allowed. Brack says. I'm going anyway.", "Smoke? Lights? Moving lights? That's not a star. Stars don't move like that. Stars don't have lights on."],
  ['zhr10', 'oona14h', 38, 'Oona Stays', 'bellglass', TK('Say goodbye to Oona'), "I'm staying. The drowned lamps need lighting, and nobody here's got the knack. I'm a Lamplighter. That's what we do.", "Go on. Find out what fell. Come back and tell me. I'll leave a lamp lit."],
]);
const more = side('dh14', LL, 'zh2', [
  ['zhx1', 'quill14', 37, 'Bubbles', 'arch', K(['hollowcrab'], 8, 'Kill 8 hollow crabs chewing the air-lines near the Drowned Arch', 'arch', 700), "Something's chewing the air-lines out by the Arch. Crabs. Of course it's crabs. Eight.", "Eight. The lines are holding. I can hear them hiss from here. Lovely sound."],
  ['zhx2', 'teo14', 37, 'Eel Race', 'cathedral', C(['glasseel'], 'Eel Fin', 4, 'Take 4 fins from glass eels, fast, before Teo does'), "Race you. Four eel fins. First back to the bell wins. Go. GO.", "You won? You didn't win. You won. Fine. Rematch tomorrow."],
  ['zhx3', 'nhu14', 37, 'Oil That Burns Wet', 'kelproad', C(['angler'], 'Lantern Oil', 5, 'Bring Old Nhu 5 measures of angler lantern-oil'), "Anglers make their own oil. Burns wet. Burns blue. Five measures for the street lamps, and mind you don't drink any.", "Lovely and blue. Did you drink any? You've gone a bit blue. Sit down."],
  ['zhx4', 'brack14', 38, 'Brass for Brass', 'vaults', K(['covdiver'], 8, 'Kill 8 Covenant divers around the Pearl Vaults', 'vaults', 200), "There are Covenant divers in Bellglass brass all round the Vaults. I don't want them dead. I want my brass back. If they have to be dead for that, eight.", "Eight sets. Most of it needs mending. Quill will cry. Quill always cries."],
  ['zhx5', 'oona14h', 37, 'About the Cat', 'bellglass', TK('Ask Captain Brack about Linnet\'s cat'), "My mother's slate says she was sorry about the cat. We didn't have a cat. Ask Brack. Brack knows everything about everyone.", [["brack14", "The cat. Ha. Linnet had a cat in the bell. Against every rule. It's still here. It's enormous."], ["oona14h", "Mother had a cat. Mother had a whole cat. Where is it? Show me the cat."]]],
  ['zhx6', 'ama14', 38, 'Eels in the Kelp', 'cathedral', K(['glasseel'], 8, 'Clear 8 glass eels out of the kelp south of Pearl Watch', 'cathedral', 200), "The kelp is thick with glass eels. They sting. Nobody can harvest. Eight, and the kelp-cutters can go back out.", "Eight. The cutters are out. One of them said thank you. That's one more than usual."],
  ['zhx7', 'quill14', 38, 'The Last Old Bell', 'kelproad', I('airbell', 1, 'Find the last of the old air-bells and check its seals'), "There's one more old bell out there somewhere. I've counted. I always count. Find it.", "That's all of them. Every bell in the Hollows, accounted for. Do you know how long I've wanted to say that?"],
  ['zhx8', 'teo14', 38, 'The Bicycle', 'arch', A('arch', 'Go and look at the bicycle on the drowned street past the Arch'), "When you lit the street lamps you said there was a bicycle. A bicycle. Underwater. I want to see it. You go first. I'll pretend I'm not interested.", "A bicycle. With a basket. Somebody rode it to the shops, once, under the sea. I want one. I don't know where I'd go."],
  ['zhx9', 'nhu14', 38, 'A Lamp That Points Down', 'bellglass', TK('Help Old Nhu hang the new downward lamp'), "My new lamp's ready. The one that shines down. Help me hang it. Up a bit. Down a bit. There.", "Look. The whole floor of the bell, lit, and nothing above us any the wiser. That's how they used to do it. I'm going to make a hundred."],
]);
QUESTS.push(...finish40([...bell, ...watch, ...cath, ...choir, ...more]));
