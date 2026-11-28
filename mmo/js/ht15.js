// Build 15: the Hatchery (levels 41-42). South of the Vale is a plain of warm ash, where the hot springs never froze.
// The moon-grubs fall here thickest, and lie together, and grow, and lay. The Covenant's Brood-Keepers tend the eggs
// like a garden. Walk too close to an egg and it hatches. Smash it first.
import { S, X, chat } from './core.js';
import { QUESTS, MOBS } from './data.js';
import { TALK, MOB_LORE } from './dialogue.js';
import { LORE } from './story.js';
import { world } from './world.js';
import { defineZone, defineDungeon } from './kit9.js';
import { mob, boss, rboss, B, U, HU, tier, giver } from './hi9.js';
import * as Rep from './rep6.js';
import { side, props14, K, C, N, A, I, TK } from './l14.js';
import { finish45, addDungeon45, addRaid45, st15, MW } from './l15.js';

Object.assign(MOBS, {
  hatchling: mob('Moon-Hatchling', 'larva15', { ...B, hpM: 1.1, spd: 6.2, scale: .7, weak: 'fire', resist: 'arcane' }),
  nestgrub: mob('Nesting Grub', 'larvagold15', { ...B, hpM: 1.8, spd: 4.2, scale: 1.1, weak: 'fire', resist: 'arcane' }),
  ashhound: mob('Ash Hound', 'hound14~ashen', { ...B, hpM: 1.4, spd: 6.8, weak: 'frost', resist: 'fire' }),
  eggmoth: mob('Egg-Moth', 'mothpale14', { ...B, hpM: 1.2, spd: 6.4, fly: .9, weak: 'storm' }),
  broodkeeper: mob('Covenant Brood-Keeper', 'cultist1~gilded', { ...HU, hpM: 1.2, range: 16, ranged: true, caster: true, school: 'arcane', weak: 'shadow' }),
  eggwarden: mob('Covenant Egg-Warden', 'cultist2~gilded', { ...HU, hpM: 1.5, weak: 'shadow' }),
  // named, out on the ash
  eggthief15: boss('The Egg-Thief', 'mothpale14', { ...B, scale: 2.8, fly: 1.2, range: 14, ranged: true, caster: true, school: 'storm', mechs: ['volley', 'spawn'], adds: 'eggmoth', lines: { start: '*It steals eggs from the nests and eats them in the air. Even the Covenant hate it.*', half: '*It drops an egg. The egg hatches on the way down.*' } }),
  oldcinder15: boss('Old Cinder', 'hound14~ashen', { ...B, scale: 2.4, mechs: ['charge', 'pool', 'call'], adds: 'ashhound', lines: { start: '*The ash hounds\' alpha. It sleeps in the hot springs. It is awake now.*', half: '*It shakes, and hot ash flies.*' } }),
  // the Egg Fields (open, 41)
  clutchwarden15: boss('The Clutch-Warden', 'cultist2~gilded', { ...HU, scale: 1.5, mechs: ['cleave', 'call', 'shield'], adds: 'eggwarden', lines: { start: 'These are children. Would you kill children?', half: 'They will go up to their mother and she will love us for it!' } }),
  goldgrub15: boss('The Gilded Grub', 'larvagold15', { ...B, scale: 2.4, mechs: ['spawn', 'pool'], adds: 'hatchling', lines: { start: '*The fattest grub in the fields. It has stopped crawling. It just lays.*', half: '*Eggs pour out of it.*' } }),
  clutchmother15: boss('The Clutch-Mother', 'larvagold15', { hpM: 1.9, scale: 3.2, weak: 'fire', resist: 'arcane', mechs: ['spawn', 'pool', 'knock', 'enrage'], adds: 'hatchling', lines: { start: '*Every egg in the fields came out of her. She is lying on the warmest spring in the ash, and she is not finished.*', half: '*She rolls over. Under her, a hundred more eggs.*' } }),
  // the Ash Nests (open, 42)
  cinderpack15: boss('The Cinder Pack-Leader', 'hound14~ashen', { ...B, scale: 2.2, mechs: ['charge', 'call'], adds: 'ashhound', lines: { start: '*The ash hounds hunt hatchlings. And anything near hatchlings. And anything.*', half: '*It howls, and the pack circles.*' } }),
  broodpriest15: boss('Brood-Priest Oswyn', 'cultist1~gilded', { ...HU, scale: 1.4, range: 16, ranged: true, caster: true, school: 'arcane', mechs: ['heal', 'fear', 'call'], adds: 'broodkeeper', lines: { start: 'When they hatch they will go up, all of them, and feed their mother, and she will wake, and she will thank us.', half: 'Or she will eat the world. We have made our peace with either.' } }),
  firsthatched15: boss('The First Hatched', 'larva15', { hpM: 2, scale: 3.6, weak: 'fire', resist: 'arcane', mechs: ['charge', 'pool', 'fear', 'enrage'], adds: 'nestgrub', lines: { start: '*The first egg that hatched here grew up. This is what they grow up into.*', half: '*It rears, and its mouth opens all the way down.*' } }),
  // the Warm Deep (instance, 41-42)
  wd_heat15: boss('The Heat', 'firepet~gilded', { scale: 2.4, weak: 'frost', resist: 'fire', school: 'fire', range: 14, ranged: true, caster: true, mechs: ['pool', 'volley', 'spawn'], adds: 'hatchling', lines: { start: '*The spring that keeps the Hatchery warm has woken up, and it does not want to cool down.*', half: '*It gets hotter.*' } }),
  wd_keeper15: boss('Keeper of the Clutch', 'cultist2~gilded', { ...HU, scale: 1.6, mechs: ['cleave', 'shield', 'call'], adds: 'eggwarden', lines: { start: 'Not one step further. Not one egg.', half: 'MOTHER, SEE ME.' } }),
  wd_nurse15: boss('The Nurse-Moth', 'mothpale14', { scale: 2.8, fly: 1, range: 16, ranged: true, caster: true, school: 'storm', mechs: ['heal', 'volley', 'spawn'], adds: 'eggmoth', lines: { start: '*It feeds the hatchlings. It is the size of a sail.*', half: '*It spreads its wings over the eggs.*' } }),
  wd_brood15: boss('The Brood That Waits', 'larvagold15', { hpM: 2, scale: 3, weak: 'fire', mechs: ['spawn', 'pool', 'fear', 'enrage'], adds: 'nestgrub', lines: { start: '*Deep under the ash, a brood of grubs that has stopped growing outward and started growing together.*', half: '*It splits, and comes at you from three sides.*' } }),
  // the Brood-Mother's Nest (24-person raid)
  bn_twins24: rboss('The Egg-Warden Twins', 'cultist2~gilded', { hpM: 2.3, scale: 1.8, mechs: ['cleave', 'shield', 'call', 'heal'], adds: 'eggwarden', lines: { start: '*Two brothers who swore to guard the Brood-Mother\'s nest with their lives. They meant it.*', half: '*One of them goes down on one knee. The other one gets angrier.*' } }),
  bn_swarm24: rboss('The Hatching Swarm', 'larva15', { hpM: 2.2, scale: 2.6, mechs: ['spawn', 'pool', 'aura'], auraK: .1, adds: 'hatchling', lines: { start: '*A thousand eggs, hatching at once.*', half: '*More.*' } }),
  bn_moth24: rboss('The Moonmoth Queen', 'mothpale14', { hpM: 2.4, scale: 4.2, fly: 1.4, range: 20, ranged: true, caster: true, school: 'storm', mechs: ['volley', 'pool', 'knock', 'spawn'], adds: 'eggmoth', lines: { start: '*She carries the hatchlings up. Up to the moon. One at a time, for a month. She is very tired. She is very big.*', half: '*She takes off, and the whole nest blows over.*' } }),
  bn_mother24: rboss('The Brood-Mother', 'larvagold15', { hpM: 3.2, scale: 5, weak: 'fire', resist: 'arcane', school: 'arcane', mechs: ['cleave', 'pool', 'fear', 'call', 'knock', 'aura', 'spawn', 'enrage'], auraK: .15, adds: 'nestgrub', lines: { start: '*The first grub that fell, a month ago, grown huge on hot ash and the Covenant\'s care. Every egg on the plain is hers. She looks up, at the moon, the way a child looks for its mother.*', half: '*She screams. High in the sky, the moon screams back.*' } }),
});
Object.assign(MOB_LORE, {
  hatchling: 'A moon-grub, newly out of its egg, and already hungry. They are the Sleeper\'s dreams, Seventh says, falling to earth and hatching.',
  broodkeeper: 'The Covenant\'s gardeners of the Hatchery. They tend the eggs the way you\'d tend tomatoes, and sing to them.',
  bn_mother24: 'The first grub that fell to Hulrouhn, a month ago. The Covenant fed her and kept her warm. She has laid ten thousand eggs.',
});
giver('bria15', 'Foreman Bria Cole', 'Cinderford · the ash mines', 'bladewarden1');
giver('cael15', 'Brother Cael', 'Cinderford · once a Brood-Keeper', 'priest');
giver('crane15', 'Engineer Hollis Crane', 'Corrand\'s Iron Legion', 'bladewarden2');
Object.assign(TALK, {
  bria15: { bio: 'Bria runs the ash mines at Cinderford, where the hot springs make the ground soft enough to dig. The grubs came a month ago. She has lost eleven miners and no mornings.',
    greet: ["Warm, isn't it? Always is, here. That's why they came. That's why we came. Same reason. Different teeth.", "Don't step on anything round and silver. Don't step NEAR anything round and silver."], topics: [] },
  cael15: { bio: 'Cael was a Brood-Keeper of the Covenant. He tended eggs for a month and sang to them. Then one hatched in his hands and looked at him, and he walked out of the Hatchery and did not stop until Cinderford.',
    greet: ["I sang to them. Every night. They liked it. That's the worst part.", "Don't let them hatch near you. They look at you first. Then they decide."],
    topics: [{ q: 'What are the eggs for?', a: ["Vesper says they go up. When they hatch, the moth carries them up to the moon, and they feed their mother, and she wakes.", "Some don't go up. Some stay. They eat what's here. Vesper says that's fine. Either way she wakes. Either way we're lifted up."] }] },
  crane15: { bio: 'Hollis Crane came south from the Forge with a cart of tools and a bad idea, as usual. He wants to know how the eggs keep warm. He wants to know a lot of things.',
    greet: ["The eggs are thermal. Perfectly thermal. I could heat a town with one. I'm not going to. Probably.", "Sorrel's gone back to Corrand. She said she'd had enough of me. She'll be back. She always comes back."], topics: [] },
});
Object.assign(LORE, {
  broodbook: { title: 'The Brood-Keepers\' Hymnal', where: 'eggfields', text: "A hymnal, written in a careful hand: 'Sing low, sing slow, the moon is your mother. Hatch and go up, little one, go up to your mother. Feed her and wake her and she will remember us.' In the margin, in a shakier hand: 'It looked at me. — C.'" },
});
X.VEND = Object.assign(X.VEND || {}, { cinderford: ['Ash-Wife Nell', 'villager2'], theperch: ['Perch Quartermaster', 'bulwark1'] });
X.inspectSay = Object.assign(X.inspectSay || {}, {
  ashvent: ['A hot spring vent, choked with ash and eggs. You stamp the eggs and clear the vent.', 'The vent hisses. Warm. The grubs love it. You cap it with a stone.'],
  minecart: ['A mine-cart, overturned, full of ore. You right it and push it to the track.', 'A cart, and a miner\'s helmet, and nothing else. You take the helmet back.'],
  hymnstone: ['A stone where the Brood-Keepers stood to sing. Wax, from a hundred candles. You scrape it clean.', 'A singing-stone. Someone has carved a lullaby on it. Wrong notes. On purpose.'],
});

const H = { zone: 'ht15' }, BROOD = ['hatchling', 'nestgrub', 'eggmoth'], ASH = ['ashhound'], KEEP = ['broodkeeper', 'eggwarden'];
for (const m of [...BROOD, ...ASH, ...KEEP]) Rep.KILL_REP[m] = ['moon15', 6];
X.arriveHooks.push((zone, from) => zone === 'ht15' ? ({ mr15: { x: 455, z: -100 } }[from] || { x: 0, z: 455 }) : zone === 'cv15' && from === 'ht15' ? { x: 0, z: -450 } : null);
// the eggs: forty of them across the fields and nests
const EGGS = []; for (let i = 0; i < 40; i++) { const a = i * 2.4, r = 40 + (i % 7) * 30; EGGS.push([Math.round(Math.cos(a) * r - 60 + (i % 3) * 60), Math.round(Math.sin(a) * r - 60)]); }
defineZone('ht15', {
  size: 500, seed: 15023, name: 'The Hatchery', bossName: 'The Brood-Mother', hiH: 14, maxSpawnH: 28,
  land: (x, z, N) => Math.max(1.5, 4 + N.fbm(x * .006, z * .006, 4) * 10 + Math.max(0, N.fbm(x * .02 + 5, z * .02, 2) - .3) * 14),
  pal: { a: '#5a5048', b: '#4e4640', hi: '#7a6a5a', road: '#8a7a6a', cob: '#9a8a7a', low: '#3a3430' },
  towns: [{ key: 'cinderford', name: 'Cinderford', x: 0, z: 380, R: 30, wall: 'palisade', gates: [Math.PI / 2, Math.PI * 1.5], guardName: 'Ash Miner', guardKind: 'bladewarden1',
    houses: [[-12, 10, .4, 'hut'], [12, 10, -.4, 'hut'], [-14, -10, .2, 'hall', 9, 5], [14, -10, 2.2, 'tent', 4, 4]], props: [[0, 4, 'lantern'], [-6, 0, 'lantern'], [0, -6, 'banner', '#c87a3a']],
    npcs: [['giver', 'bria15', 0, 0], ['giver', 'cael15', -8, 6], ['giver', 'crane15', 8, -4], ['vendor', 'cinderford', 8, 6], ['bind', null, 3, -4], ['armory', null, -6, -6]], guards: [[2, 28], [-2, 28], [2, -28], [-2, -28]] },
    { key: 'theperch', name: 'The Perch', x: -340, z: -60, R: 24, wall: 'stones', gates: [0, Math.PI / 2], guardName: 'Lamplighter', guardKind: 'aegis1',
      houses: [[-6, 6, .3, 'tent'], [8, -6, -.4, 'tent']], props: [[0, 0, 'lantern'], [4, 4, 'banner', '#ffd27a']],
      npcs: [['giver', 'ammara14', -5, -2], ['giver', 'wenna14f', 5, 4], ['vendor', 'theperch', 6, -4], ['bind', null, 0, 6]], guards: [[22, 2], [22, -2]] }],
  roads: [[0, 470, 0, 340], [0, 340, -60, 120], [-60, 120, -340, -60], [-60, 120, 240, 0], [240, 0, 460, -100], [-60, 120, 0, -380]],
  regions: { names: ['Cinderford', 'The Perch', 'The Egg Fields', 'The Ash Nests', 'The Deep Nest'], fn: (x, z) => z < -260 ? 4 : z > 240 ? 0 : x < -220 ? 1 : x < 120 ? 2 : 3 },
  open: [{ key: 'eggfields', name: 'The Egg Fields', x: -60, z: -60, R: 34, deco: 'nest', decoN: 14, ring: true, gap: 0, centre: 'stonecircle', lvl: [41, 41], area: 2,
      packs: [[-18, 0, ['hatchling', 'hatchling', 'broodkeeper']], [18, 0, ['eggwarden', 'broodkeeper']], [0, -18, ['nestgrub', 'hatchling']], [0, 18, ['broodkeeper', 'eggwarden', 'hatchling']]],
      bosses: [[-22, -18, 'clutchwarden15', 41], [22, -20, 'goldgrub15', 41], [0, -4, 'clutchmother15', 41, true]] },
    { key: 'ashnests', name: 'The Ash Nests', x: 280, z: -40, R: 34, deco: 'nest', decoN: 10, centre: 'crater', lvl: [42, 42], area: 3,
      packs: [[-18, 0, ['ashhound', 'ashhound', 'nestgrub']], [18, 0, ['broodkeeper', 'eggwarden']], [0, -18, ['nestgrub', 'eggmoth', 'eggmoth']], [0, 18, ['ashhound', 'broodkeeper']]],
      bosses: [[-22, -18, 'cinderpack15', 42], [22, -20, 'broodpriest15', 42], [0, -4, 'firsthatched15', 42, true]] }],
  doors: [{ to: 'warmdeep', name: 'The Warm Deep', x: -280, z: -300, ry: 0, label: 'Climb down into the Warm Deep (41-42)', col: '#ffb04a' },
    { to: 'broodnest', name: 'The Brood-Mother\'s Nest', x: 0, z: -420, ry: 0, label: 'Enter the Brood-Mother\'s Nest (24-person raid)', col: '#ffffff' }],
  landmarks: [{ g: 'crater', x: 140, z: 200, name: 'The First Fall', R: 14, clear: 10, s: 3 }, { g: 'silvertree', x: -200, z: 200, name: 'The Pale Tree', R: 10, clear: 6, s: 2.4 }],
  lines: [{ x: 0, z: 488, to: 'cv15', label: 'North, back to the Cracked Vale', ry: 0 },
    { x: 488, z: -100, to: 'mr15', label: 'East, where the lamp-towers point at the moon: the Moonfall Road', ry: Math.PI / 2, why: () => (S.hero?.lvl || 0) < 42 ? 'The Moonfall Road is for level 42 and beyond.' : S.quests.zt9?.state !== 'turned' && S.quests.zt9?.state !== 'done' ? 'East, the light is very bright. Ammara wants a word first.' : null }],
  spots: { cinderford: { x: 0, z: 380 }, cinderroad: { x: -30, z: 240 }, theperch: { x: -340, z: -60 }, eggfields: { x: -60, z: -60 }, ashnests: { x: 280, z: -40 }, firstfall: { x: 140, z: 200 },
    paletree: { x: -200, z: 200 }, warmdeep: { x: -280, z: -290 }, broodnest: { x: 0, z: -400 }, eastroad: { x: 420, z: -100 }, springs: { x: 200, z: -220 } },
  scatter: [[40, [-480, 480, 240, 480], ['hatchling', 'ashhound', 'eggmoth'], [41, 41], 0], [40, [-480, -220, -260, 240], ['broodkeeper', 'hatchling', 'eggwarden'], [41, 41], 1],
    [44, [-220, 120, -260, 240], ['hatchling', 'nestgrub', 'broodkeeper'], [41, 42], 2], [44, [120, 480, -260, 240], ['ashhound', 'nestgrub', 'eggmoth', 'eggwarden'], [42, 42], 3],
    [48, [-480, 480, -480, -260], ['nestgrub', 'eggwarden', 'broodkeeper', 'ashhound'], [42, 42], 4]],
  camps: [[6, [-480, -220, -260, 240], ['broodkeeper', 'broodkeeper', 'eggwarden'], [41, 41], 1, 'bk'], [5, [-480, 480, -480, -260], ['eggwarden', 'eggwarden', 'broodkeeper'], [42, 42], 4, 'ew']],
  rares: [[[-480, 480, 240, 480], 'eggthief15', 41, false], [[120, 480, -260, 240], 'oldcinder15', 42, true]],
  hunt: [{ area: 0, lvl: [41, 41] }, { area: 1, lvl: [41, 41] }, { area: 2, lvl: [41, 42] }, { area: 3, lvl: [42, 42] }, { area: 4, lvl: [42, 42] }],
  labels: [{ t: 'Around Cinderford (41)', x: 0, z: 300 }, { t: 'The Perch (41)', x: -340, z: 20 }, { t: 'The Egg Fields (41-42)', x: -60, z: 20 }, { t: 'The Ash Nests (42)', x: 280, z: 40 }, { t: 'The Deep Nest (42)', x: 0, z: -320 }],
  scenery: { density: 9000, tuft: '#6a5a4a', kinds: [['dead', .02, 1, 2.2], ['nest', .006, .7, 1.4], ['crater', .004, .8, 1.6], ['moonrock', .01, .6, 1.2]] },
  sky: { fog: '#5a4048', top: '#120818', hor: '#a87a6a', k: .7, far: 220 },
  after: ({ rng }) => {
    EGGS.forEach(([x, z], i) => world.props.push({ id: 'egg' + i, kind: 'egg15', tag: 'egg', use: 'egg15', name: 'A silver egg', x, z, yaw: rng() * 6.28, scale: 1 }));
    props14([['ashvent', 'A choked hot spring', 'opengrave', 200, -220, 5, 90], ['minecart', 'An overturned mine-cart', 'cache14', 60, 260, 5, 90], ['hymnstone', 'A Brood-Keepers\' singing-stone', 'altar14', -320, 60, 5, 90, 'broodbook']], rng);
  },
});
defineDungeon({ key: 'warmdeep', name: 'The Warm Deep', parent: 'ht15', plan: 'winding', floor: '#6a4a3a', rock: '#1a0e0a', fog: '#3a2018', light: .46, lvl: [41, 42], prop: 'lantern',
  mobs: ['hatchling', 'nestgrub', 'eggwarden', 'eggmoth'], bosses: ['wd_heat15', 'wd_keeper15', 'wd_nurse15', 'wd_brood15'], exitLabel: 'Climb back up to the ash' });
defineDungeon({ key: 'broodnest', name: 'The Brood-Mother\'s Nest', parent: 'ht15', plan: 'nave', floor: '#5a4a40', rock: '#140c08', fog: '#2a1a14', light: .44, lvl: [42, 42], prop: 'lantern', raid: true,
  mobs: ['hatchling', 'nestgrub', 'eggwarden', 'broodkeeper', 'eggmoth'], bosses: ['bn_twins24', 'bn_swarm24', 'bn_moth24', 'bn_mother24'], exitLabel: 'Back out of the nest' });
addDungeon45('warmdeep', 'The Warm Deep', [41, 42]); addRaid45('broodnest', 'The Brood-Mother\'s Nest', 24, 42);
tier({ eggfields: 23, ashnests: 23, warmdeep: 23, broodnest: 24 });
X.kill.push(m => { if (m.mob === 'bn_mother24' && !st15().brood) { st15().brood = true; chat('sys', null, 'The Brood-Mother is dead. All over the Hatchery, eggs go dark at once. High above, the moon is very quiet.'); } });

// ---------- the story ----------
QUESTS.push(...finish45([
  { id: 'zt1', story: true, giver: 'bria15', lvl: 41, pre: 'zv10', name: 'The Ground Is Warm', where: 'cinderroad', ...H, rep: MW(400), obj: K(['hatchling', 'ashhound'], 12, 'Clear 12 hatchlings and ash hounds off the road into Cinderford', 'cinderroad', 220),
    say: ["Lamplighters. From the Vale? Then you've seen them falling. They all land here. The ground's warm. Hot springs. They like it.", "So do my miners. Twelve, off the road. I want my night shift back."],
    done: ["Twelve. The night shift went down. All of them came up. First time in a month. I'll buy you a drink. We've only got hot water. I'll buy you hot water."] },
  { id: 'zt2', story: true, giver: 'crane15', lvl: 41, pre: 'zt1', name: 'Eggs', where: 'eggfields', ...H, rep: MW(400), obj: I('egg', 5, 'Smash 5 of the silver eggs before they hatch'),
    say: ["The eggs are everywhere. Silver. Warm. They hatch when anything comes close, like they can smell you. Smash five. Get close fast and stamp hard.", "I'd like one intact, for study. I'd also like to live. I'm choosing to live."],
    done: ["Five. The yolk's silver. It hums. It stops humming when you stamp on it. I've learned so much and I hate all of it."] },
  { id: 'zt3', story: true, giver: 'bria15', lvl: 41, pre: 'zt1', name: 'The Night Shift', where: 'firstfall', ...H, rep: MW(400), obj: I('minecart', 3, 'Recover 3 of the mine-carts the grubs overturned'),
    say: ["The grubs tip the carts. Looking for warm. Three carts, back on the track, and the mine runs again."],
    done: ["Three. Ore's moving. We're digging lumenite down there now. Did you know it was down there? Neither did we. The grubs did."] },
  { id: 'zt4', story: true, giver: 'cael15', lvl: 41, pre: 'zt2', pre2: 'zt3', name: 'Brother Cael', where: 'cinderford', ...H, rep: MW(400), obj: TK('Hear what Brother Cael did in the Hatchery'),
    say: [["cael15", "I was a Brood-Keeper. I tended them. I sang to them. Every night, the same song. Vesper's song."], ["cael15", "When they hatch, the big moth carries them up. To the moon. To their mother. They feed her. Every one that goes up makes her a little more awake."], ["cael15", "And one hatched in my hands. And it looked at me. Not like a baby looks at you. Like a cook looks at a chicken."]],
    done: [["cael15", "I walked out. I didn't stop till here. I want to help. I know where everything is. I know the songs. I know which eggs are closest to hatching."], ["bria15", "He's been sleeping in my barn. He's no trouble. He cries a lot."]] },
  { id: 'zt5', story: true, giver: 'cael15', lvl: 41, pre: 'zt4', name: 'The Egg Fields', where: 'eggfields', ...H, rep: MW(500), obj: N('clutchmother15', 'Go into the Egg Fields and kill the Clutch-Mother'),
    say: ["The Clutch-Mother lies on the warmest spring in the fields. Every egg out there came from her. I fed her. Every day. I'm sorry. Kill her."],
    done: ["She's gone? The fields will go cold now. Slowly. The eggs need her warmth. Without it... most of them won't hatch. Thank you. I'll stop being sorry eventually."] },
  { id: 'zt6', story: true, giver: 'bria15', lvl: 42, pre: 'zt5', name: 'The Ash Nests', where: 'ashnests', ...H, rep: MW(500), obj: N('firsthatched15', 'Go into the Ash Nests and kill the First Hatched'),
    say: ["East, in the ash, the first egg that hatched has grown up. It's the size of a barn. It sleeps in the nests. My miners hear it breathing through the rock.", "Kill it. I want to know what they grow into. Then I want to never know again."],
    done: ["That's what they grow into? If one of those goes up to the moon, or stays here... Kill the rest. Kill them all. Sorry, Cael."] },
  { id: 'zt7', story: true, giver: 'ammara14', lvl: 42, pre: 'zt6', name: 'The Warm Deep', where: 'warmdeep', ...H, rep: MW(600), obj: N('wd_brood15', 'Go down into the Warm Deep and destroy the Brood That Waits'),
    say: ["Cael says there's a brood under the ash that's stopped growing outward. It's growing together. Into one thing. Under where the springs come from.", "I've seen what the scout was. I don't want to see what a grown one looks like. Go down there. Stop it growing."],
    done: ["It was growing into a scout. Wasn't it. A little one. Cael's face says yes. Mine says I need to sit down."] },
  { id: 'zt8', story: true, giver: 'cael15', lvl: 42, needLvl: 42, pre: 'zt7', name: 'The Brood-Mother\'s Nest', where: 'broodnest', ...H, rep: MW(1400), obj: N('bn_mother24', 'Enter the Brood-Mother\'s Nest and kill the Brood-Mother (24-person raid)'),
    say: ["At the south of the Hatchery is the nest. The first grub that ever fell. The Brood-Mother. Every egg in the world is hers. The moth carries her children up every night.", "Bring everyone. Twenty-four. She has guards. She has the moth. She has ten thousand children. And she looks at the moon like it's her mother. It is."],
    done: [["cael15", "She's dead. And all the eggs went dark at once. I felt it. Like a candle going out in another room."], ["ammara14", "And the moon went quiet. Halden sent a runner. He says it stopped moving closer. For a night."], ["cael15", "Only a night. The Covenant won't stop. They've got the towers."]] },
  { id: 'zt9', story: true, giver: 'ammara14', lvl: 42, pre: 'zt8', name: 'Where the Lamps Point', where: 'eastroad', ...H, rep: MW(400), obj: TK('Hear Cael and Ammara talk about the towers'),
    say: [["cael15", "East of here is the Moonfall Road. The Covenant built towers along it. Mirrors at the top. They take every light in the land and throw it up. At the moon."], ["ammara14", "The scout's song was 'found one, lit, come'. The Covenant are writing a different song. In light. 'Wake up.'"]],
    done: [["ammara14", "East, then. Wenna's coming. She wants to break mirrors. I've never seen her want to break anything."], ["wenna14f", "I used to carry lamps for them. Now I'm going to break their mirrors. That's growing up, Ammara says."]] },
]));

// ---------- the smaller roads ----------
const ford = side('ht15', MW, 'zt1', [
  ['ztc1', 'bria15', 41, 'Ash Hounds', 'cinderroad', K(['ashhound'], 10, 'Kill 10 ash hounds hunting round Cinderford', 'cinderroad', 260), "The ash hounds hunt hatchlings. Good. They also hunt miners. Bad. Ten.", "Ten. The hounds'll be back. The hatchlings will be back. My miners will be back. It's the being back that counts."],
  ['ztc2', 'bria15', 41, 'Vents', 'springs', I('ashvent', 4, 'Clear 4 hot-spring vents choked with eggs'), "The eggs cluster on the vents for warmth. Clear four. Stamp the eggs, cap the vents. Wear boots. Good boots.", "Four. The springs are cooler. The grubs'll move on. To somewhere warmer. That's somebody else's problem. Sorry, somebody else."],
  ['ztc3', 'crane15', 41, 'An Intact Egg', 'eggfields', C(['broodkeeper'], 'Cradled Egg', 1, 'Take one intact egg from a Brood-Keeper, carefully', .6), "The Brood-Keepers carry eggs in slings. Like babies. Get me one. Intact. I'll keep it cold. Cold eggs don't hatch, I think. I'm fairly sure.", "Cold. Not hatching. Humming, though. I'm going to sit and watch it all night. Somebody bring me tea."],
  ['ztc4', 'bria15', 41, 'Lost Miners', 'firstfall', A('firstfall', 'Go to the First Fall crater and look for the miners who went missing there'), "Three miners went to the First Fall to dig. Where the first grub landed. They didn't come back. Look. Tell me plainly.", "Picks. Lamps. No miners. I'll tell their families. Plainly. That's how they'd want it."],
  ['ztc5', 'cael15', 41, 'Moth Wings', 'cinderroad', K(['eggmoth'], 8, 'Shoot down 8 egg-moths carrying hatchlings', 'cinderroad', 260), "The egg-moths carry hatchlings up. Small ones. Practising. Eight. Every one you bring down is one that doesn't go up.", "Eight. I watched them fall. I used to watch them rise. I prefer falling."],
  ['ztc6', 'crane15', 41, 'Thermal Study', 'springs', C(['nestgrub'], 'Warm Shell', 5, 'Bring Crane 5 warm shells from nesting grubs'), "The nesting grubs hold heat in their shells. Five. For science. For heating Cinderford. Science that heats things is the best science.", "Cinderford's warm tonight. Warm from grub shells. Don't tell the miners. Actually, tell them. They'll think it's funny."],
  ['ztc7', 'bria15', 41, 'The Lumenite Seam', 'cinderford', C(['nestgrub', 'hatchling'], 'Lumenite Chip', 6, 'Collect 6 chips of lumenite the grubs have been chewing'), "The grubs chew lumenite. They know where it is. Follow the chewing. Six chips.", "Lumenite. Starwright stuff, Crane says. Under my mine. The grubs smelled it from the moon. I've got questions for the ground."],
  ['ztc8', 'cael15', 42, 'The Hymn', 'theperch', I('hymnstone', 3, 'Scrape clean 3 of the Brood-Keepers\' singing-stones'), "We sang from stones. Wrong notes, carved in. Scrape three clean. I can't look at them.", "Three. Clean. I'm going to carve the right notes. Seventh's notes. The lullaby, the proper way."],
  ['ztc9', 'crane15', 42, 'Egg Heater', 'cinderford', TK('Look at Crane\'s egg-powered heater'), "Look at this. One egg, cold-sealed, in a copper jacket. Heats a whole house. Totally safe. Ninety percent safe.", "It hummed. Then it stopped humming. Then it hatched. In the copper jacket. It's fine. The jacket held. Mostly."],
  ['ztcd', 'bria15', 41, 'Mine Watch', 'cinderroad', K(['hatchling', 'ashhound', 'eggmoth'], 8, 'Clear 8 things off the mine road', 'cinderroad', 240), "Eight a shift.", "Clear. Same tomorrow.", { daily: true }],
]);
const perch = side('ht15', MW, 'zt3', [
  ['ztp1', 'ammara14', 41, 'Brood-Keepers', 'theperch', K(['broodkeeper', 'eggwarden'], 10, 'Break 10 of the Covenant tending eggs near the Perch', 'theperch', 240), "The Covenant's gardeners walk the fields singing to eggs. Ten. Stop the singing.", "Ten. They died holding eggs. Wrapped up. Like babies. I'm going to dream about that."],
  ['ztp2', 'wenna14f', 41, 'Lamps for the Perch', 'theperch', C(['broodkeeper'], 'Keeper\'s Lamp', 5, 'Take 5 lamps from the Brood-Keepers'), "The Brood-Keepers keep lamps over the eggs. To warm them. Five. Our lamps now. Pointed at people.", "Five. The Perch is lit. Hesk would like the ugly ones best. I'll send them to her."],
  ['ztp3', 'ammara14', 41, 'Eggs on the Perch Road', 'eggfields', I('egg', 4, 'Smash 4 more eggs between the Perch and the fields'), "The road from the Perch to the fields is lined with eggs. Four. Fast. Don't stop to look at them. They look back.", "Four. Did they look back? They looked back. I told you not to stop."],
  ['ztp4', 'wenna14f', 41, 'The Pale Tree', 'paletree', A('paletree', 'Go to the Pale Tree and see what the Covenant hang on it'), "The Covenant hang things on the Pale Tree. North of the Perch. I don't know what. I don't want to. Go and look.", "Bells. Little silver bells. One for every egg that went up. Hundreds. They ring when the wind blows. Like a nursery."],
  ['ztp5', 'ammara14', 42, 'The Egg-Thief', 'cinderroad', N('eggthief15', 'Hunt the Egg-Thief somewhere over the north of the Hatchery'), "There's a moth even the Covenant hate. It steals eggs and eats them in the air. Kill it. I'm aware it's on our side, technically.", "Technically on our side. Technically dead. I don't feel bad. Do you feel bad? Don't."],
  ['ztp6', 'wenna14f', 42, 'Cradles', 'eggfields', C(['eggwarden'], 'Egg Sling', 6, 'Take 6 egg-slings from the Egg-Wardens'), "The Wardens carry eggs in slings across their chests. Six slings. I'm going to cut them up and make bandages. Something good from something bad.", "Bandages. Soft ones. Hesk taught me that. 'Everything's for something, girl.'"],
  ['ztp7', 'ammara14', 42, 'Above the Hatchery', 'theperch', TK('Watch the moth go up with Ammara'), "Sit with me. Look up. At moonrise the big moth carries them up. You can see it from the Perch. I want somebody to see it with me.", "There. Like a speck crossing the moon. Carrying a child to its mother. If it were anything else it would be beautiful."],
  ['ztp8', 'cael15', 42, 'Brood-Priest Oswyn', 'ashnests', N('broodpriest15', 'Stop Brood-Priest Oswyn in the Ash Nests'), "Oswyn taught me the songs. He's in the Ash Nests, singing to the big ones. Stop him. I would, but I'd listen.", "He said they'd made their peace with either? That's Oswyn. Peace with anything. He was so kind. He was so kind to me."],
  ['ztp9', 'wenna14f', 42, 'Song Sheets', 'ashnests', C(['broodkeeper'], 'Song Sheet', 5, 'Take 5 song-sheets from the Brood-Keepers'), "Their songs are written down. I want them. Not to sing. To know what they say, so I know what we're singing against.", "'Hatch and go up, little one.' It's a lullaby. Seventh's lullaby. Backwards. Every line backwards."],
  ['ztpd', 'ammara14', 42, 'Perch Patrol', 'theperch', K(['broodkeeper', 'eggwarden', 'hatchling'], 8, 'Patrol the Perch road', 'theperch', 240), "Eight. Every day.", "Done. Same tomorrow.", { daily: true }],
]);
const nests = side('ht15', MW, 'zt4', [
  ['ztn1', 'bria15', 41, 'The Gilded Grub', 'eggfields', N('goldgrub15', 'Kill the Gilded Grub in the Egg Fields'), "There's a gold one in the fields. Fatter than the rest. It doesn't crawl. It lays. Stop it.", "Gold. Like a coin. Worth nothing. I checked."],
  ['ztn2', 'cael15', 41, 'The Clutch-Warden', 'eggfields', N('clutchwarden15', 'Get past the Clutch-Warden in the Egg Fields'), "The Clutch-Warden guards the middle of the fields. He asked me once if I'd kill children. I said no. I'd say yes now. They're not children.", "'Would you kill children.' He asks everyone that. Nobody's ever answered him right."],
  ['ztn3', 'crane15', 42, 'Nesting Grubs', 'ashnests', K(['nestgrub'], 10, 'Kill 10 nesting grubs in the Ash Nests', 'ashnests', 200), "The nesting grubs are the ones that stayed. Grew. Didn't go up. Ten. They're the ones that'll eat us.", "Ten. They're slower than the little ones. Bigger, slower, hungrier. Like me after lunch."],
  ['ztn4', 'bria15', 42, 'Old Cinder', 'ashnests', N('oldcinder15', 'Hunt Old Cinder, the ash hounds\' alpha, near the Ash Nests'), "Old Cinder sleeps in the hottest spring in the Nests. The pack leader's pack leader. Kill it and the hounds will scatter for a month.", "Scattered. A month of quiet. I'll take a month. I'll take a week."],
  ['ztn5', 'cael15', 42, 'The Pack-Leader', 'ashnests', N('cinderpack15', 'Kill the Cinder Pack-Leader in the Ash Nests'), "The hounds in the Nests follow one big one. It hunts hatchlings. It hunts us more.", "Good. The hounds will fight each other now for who's next. Let them."],
  ['ztn6', 'crane15', 42, 'The Springs', 'springs', I('ashvent', 1, 'Cap the last of the hot-spring vents'), "One vent left. The big one. Cap it, and the eggs on this side go cold.", "Capped. Can you feel it? The ground's cooler. Already. Science."],
  ['ztn7', 'ammara14', 42, 'The Twins', 'broodnest', N('bn_twins24', 'Get past the Egg-Warden Twins at the Brood-Mother\'s Nest (24-person raid)'), "Two brothers guard the nest. Cael knew them. They meant every word of their oath. Get past them.", "Down. Both. Cael's gone quiet. Leave him a while."],
  ['ztn8', 'cael15', 42, 'The Hatching Swarm', 'broodnest', N('bn_swarm24', 'Break the Hatching Swarm in the Brood-Mother\'s Nest (24-person raid)'), "Inside the nest, a thousand eggs hatch at once when anything comes in. A swarm. Break it.", "A thousand. I sang to most of them. I'm glad you didn't hear the song. I'm glad they didn't."],
  ['ztn9', 'ammara14', 42, 'The Moonmoth Queen', 'broodnest', N('bn_moth24', 'Bring down the Moonmoth Queen (24-person raid)'), "The moth that carries them up. Every night for a month. Bring her down. Nothing goes up tonight.", "Nothing went up. I watched. All night. The moon was alone."],
]);
const more = side('ht15', MW, 'zt2', [
  ['ztx1', 'crane15', 41, 'Hatchling Teeth', 'eggfields', C(['hatchling'], 'Tiny Tooth', 6, 'Bring Crane 6 hatchling teeth'), "Six teeth. Tiny ones. I want to see if they're the same as the scout's. Teeth inside teeth.", "Teeth inside teeth inside teeth. Same as the scout. Same family. Same awful family."],
  ['ztx2', 'bria15', 41, 'Carts Again', 'firstfall', I('minecart', 2, 'Right 2 more mine-carts near the First Fall'), "Two more carts down. Near the crater. The grubs love the crater. Of course they do. Mother's first footprint.", "Up and rolling. The mine runs. That's all I've ever wanted. Rolling carts."],
  ['ztx3', 'cael15', 41, 'Cael\'s Egg', 'cinderford', TK('Help Cael decide what to do with the egg he carried out'), "I carried one out. When I ran. It's in Bria's barn. Wrapped in a blanket. Cold. It hasn't hatched. I don't know what to do with it.", [["cael15", "I'll keep it cold. Forever. Crane can have it when I'm dead. That's a decision. Isn't it?"], ["crane15", "I'd like it before you're dead, frankly. But fine."]]],
  ['ztx4', 'wenna14f', 41, 'Eggs by the Perch', 'theperch', I('egg', 3, 'Smash 3 eggs near the Perch before anyone else gets hurt'), "Three eggs, by the Perch wall. The guards keep hearing them hum. Smash them. Quickly. I'll hold the lamp.", "Done. The guards slept. First night. I held the lamp the whole time."],
  ['ztx5', 'ammara14', 41, 'Moths at the Perch', 'theperch', K(['eggmoth'], 8, 'Shoot down 8 egg-moths over the Hatchery', 'theperch', 700), "The moths circle the Perch at night. They like our lamps. Eight.", "Eight. The lamps can stay lit. That was the deal."],
  ['ztx6', 'bria15', 42, 'Grub-Proof Doors', 'cinderford', C(['ashhound'], 'Ash Hide', 6, 'Bring Bria 6 ash hides for grub-proof doors'), "Ash hide's thick. Grubs can't chew it. Six, and every house in Cinderford gets a door."],
  ['ztx7', 'crane15', 42, 'What Grows Under', 'warmdeep', A('warmdeep', 'Go to the mouth of the Warm Deep and listen'), "There's a crack down to where the springs come from. The Warm Deep. Go and listen at the mouth. Tell me what you hear.", "Breathing? Lots of breathing? In time with each other? That's not a brood. That's one thing with a lot of mouths. Tell Ammara."],
  ['ztx8', 'cael15', 42, 'Keeper Robes', 'eggfields', C(['broodkeeper'], 'Keeper\'s Robe', 4, 'Take 4 robes from the Brood-Keepers'), "I want to burn the robes. Mine's in the barn. Four more and we'll have a fire. A proper one."],
  ['ztx9', 'wenna14f', 42, 'The Bells', 'paletree', A('paletree', 'Cut the silver bells down from the Pale Tree'), "The bells on the Pale Tree. Every egg that went up. Cut them down. I'll melt them into a lamp. One lamp for all of them.", "Hundreds of bells. One lamp. Hesk's going to make it. She said it'll be the ugliest lamp she's ever made, and the most important."],
  ['ztx10', 'ammara14', 42, 'A Letter from Halden', 'theperch', TK('Read Halden\'s letter with Ammara'), "A runner came from the Vale. From Halden. Read it with me. I'm not good with letters. I'm good with skies.", "'The moon stopped coming closer for one night after the nest. Then it started again. Faster. Light is getting to it from the east. — H.' The towers. The road."],
  ['ztx11', 'bria15', 42, 'A Drink', 'cinderford', TK('Have a hot water with Foreman Bria'), "Hot water. Promised you a drink. Here it is. Cheers.", "To the night shift. All of them came home this week. All of them."],
  ['ztxd', 'crane15', 42, 'Hatchling Patrol', 'eggfields', K(['hatchling', 'nestgrub'], 8, 'Clear 8 hatchlings from the fields\' edge', 'eggfields', 220), "Eight a day. They keep coming.", "Eight. Same tomorrow.", { daily: true }],
]);
const deep = side('ht15', MW, 'zt6', [
  ['zty1', 'ammara14', 42, 'The Heat', 'warmdeep', N('wd_heat15', 'Cool the Heat in the Warm Deep'), "The spring that warms the Hatchery has woken up. It doesn't want to cool down. Make it.", "Cooler. Already. The eggs above it will go quiet now."],
  ['zty2', 'cael15', 42, 'Keeper of the Clutch', 'warmdeep', N('wd_keeper15', 'Get past the Keeper of the Clutch in the Warm Deep'), "The Keeper of the Clutch was my teacher. Before Oswyn. She'll be in the Deep. She won't let anyone near the brood.", "She called to the moon? 'Mother, see me'? She always said that. I thought it was a prayer. It was a request."],
  ['zty3', 'crane15', 42, 'The Nurse-Moth', 'warmdeep', N('wd_nurse15', 'Kill the Nurse-Moth in the Warm Deep'), "A moth the size of a sail feeds the hatchlings down in the Deep. Kill it. The young ones will starve. I'm a terrible person. Kill it anyway.", "Dead. It had wings like stained glass. I'm going to make a window. I'm a terrible person and I'm going to make a window."],
  ['zty4', 'bria15', 42, 'Under the Mine', 'warmdeep', K(['nestgrub', 'eggwarden', 'hatchling'], 12, 'Clear 12 things near the mouth of the Warm Deep', 'warmdeep', 220), "My deepest shaft broke into the Warm Deep last week. Things are coming up. Twelve, and I'll seal it.", "Sealed. Twelve feet of rock. If they want to come up now they'll have to dig. They can dig. Let them try."],
  ['zty5', 'wenna14f', 42, 'Lamps Pointed Down', 'theperch', C(['eggwarden', 'broodkeeper'], 'Lamp-Oil', 6, 'Take 6 flasks of lamp-oil from the Covenant'), "The Covenant burn oil to keep the eggs warm. Six flasks. We'll burn it in lamps pointed at the ground. At people. That's where lamps go."],
  ['zty6', 'ammara14', 42, 'East, Very Bright', 'eastroad', A('eastroad', 'Go to the east road and look at the light'), "Something's very bright, east. It wasn't last month. Go and look. Tell me how many."],
  ['zty7', 'cael15', 42, 'The Song, Right', 'cinderford', TK('Help Cael teach Cinderford the right lullaby'), "I know the lullaby. The real one. Seventh's. I want to teach it to Cinderford. Every miner. Stand with me. I'm nervous. I used to sing the other one."],
  ['zty8', 'bria15', 42, 'Ash Hounds at the Shafts', 'springs', K(['ashhound'], 10, 'Kill 10 ash hounds prowling the mine shafts by the springs', 'springs', 260), "The hounds lie by the shafts, in the warm. When a miner comes up, they're waiting. Ten."],
  ['zty9', 'crane15', 42, 'Egg Jackets', 'cinderford', C(['nestgrub'], 'Warm Shell', 4, 'Bring Crane 4 more warm shells for copper jackets'), "Four more shells. I've improved the jacket. It holds now. Ninety-nine percent of the time.", "Ninety-nine percent. Cinderford's warmest winter ever coming up. Nobody ask about the one percent."],
  ['zty10', 'wenna14f', 42, 'Wenna\'s Lamp, Again', 'theperch', TK('Watch Wenna relight her lamp on the Perch wall'), "My lamp went out. The ugly one. Hesk's. I want to light it again here, on the Perch wall, where the moth can see it. So it knows we're not afraid."],
  ['zty11', 'ammara14', 42, 'The Perch Holds', 'theperch', K(['broodkeeper', 'eggwarden'], 12, 'Hold the Perch against a Covenant push', 'theperch', 260), "The Covenant are coming for the Perch. They want the eggs we've smashed counted. They want to know who. Twelve."],
]);
const DONE_HT = { zty5: "Six. The Perch burns their oil now. Pointing down. It smells the same. It feels different.", zty6: "Towers? Dozens? Lit, all of them, pointing up? Cael was right. That's the road east. That's where the light's going.", zty7: [["cael15", "They sang it. All of them. The right way. Bria cried. Don't tell her I told you."], ["bria15", "I did not cry. It was ash. It's always ash."]], zty8: "Ten. The shafts are clear. The miners came up singing. The right song.", zty10: "Lit. On the wall. It's so ugly. Look at it shine.", zty11: "Held. They know who now. It's us. Let them know.", ztx6: "Doors! Real doors! The grubs chewed the old ones in a night. These ones they just lick. Disgusting. Effective.", ztx8: [["cael15", "There. A fire. Five robes. Mine on top. I'm not going to cry. ...Fine."], ["bria15", "He cried. It's fine. It was a good fire."]] };
for (const q of [...ford, ...perch, ...nests, ...more, ...deep]) if (DONE_HT[q.id]) q.done = [].concat(typeof DONE_HT[q.id] === 'string' ? [DONE_HT[q.id]] : DONE_HT[q.id]);
QUESTS.push(...finish45([...ford, ...perch, ...nests, ...more, ...deep]));
