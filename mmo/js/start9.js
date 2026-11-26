// Build 9: three new beginnings, one for each of the summoners' peoples. Each is a level 1-5 land as full as the
// Vale's start, and each story ends on the road to the Vale, where it joins the hunt for the Gravelord.
//   The Ironbark Weald (the Varr): the druids' old war-groves, where the bones of their war-beasts are going missing.
//   The Kilnlands (the Grael): the elementalists' cooled golem-forges, where the sleeping golems are waking wrong.
//   The Hushmoor (the Sallow): the fen of the old thrall-camps, where a voice is calling the Sallow back to their graves.
import { S, X, chat } from './core.js';
import { QUESTS, GIVERS, MOBS, xpNeed } from './data.js';
import { TALK, MOB_LORE } from './dialogue.js';
import { SCENES, LORE } from './story.js';
import { valeHooks, world, ZONE_SIZE, H, HN, zoneMarker } from './world.js';
import { WH } from './core.js';
import { defineZone } from './kit9.js';
import * as Rep from './rep6.js';

const qx = (lvl, f) => Math.round(xpNeed(Math.min(lvl, 19)) * f * .75), qg = lvl => Math.round(2 + lvl * 3.5);
const B = { beast: true }, U = { undead: true }, HU = { human: true };
const mob = (name, kind, o) => ({ name, kind, hpM: .95, dmgM: .9, spd: 5.6, range: 2.3, weak: 'fire', resist: null, scale: 1, aggro: 10, social: 10, ...o });
const boss = (name, kind, o) => ({ name, kind, hpM: 1.1, dmgM: 1, spd: 5.2, range: 2.8, weak: 'holy', resist: null, scale: 1.4, aggro: 14, social: 18, ...o });
// the land: gentle hills, rising at the edges
const hills = (amp, base = 2) => (x, z, N) => base + N.fbm(x * .008, z * .008, 4) * amp + (N.fbm(x * .04 + 5, z * .04, 2) - .5) * 2;

// ---------- the way in from the Vale ----------
const VALE_LINES = [{ to: 'weald', x: -406, z: -120, ry: -Math.PI / 2, label: 'West into the Ironbark Weald (the Varr, levels 1-5)' },
  { to: 'kiln', x: -406, z: 170, ry: -Math.PI / 2, label: 'West into the Kilnlands (the Grael, levels 1-5)' },
  { to: 'hush', x: 60, z: 406, ry: Math.PI, label: 'South into the Hushmoor (the Sallow, levels 1-5)' }];
valeHooks.build = (prev => a => {
  if (prev) prev(a);
  for (const l of VALE_LINES) { world.zoneLines.push({ x: l.x, z: l.z, r: 9, to: l.to, label: l.label }); zoneMarker(l.x, l.z, l.ry); }
})(valeHooks.build);
// open the Vale's edge where each road leaves it
valeHooks.terrain = (prev => a => {
  if (prev) prev(a);
  for (const l of VALE_LINES) for (let zi = 0; zi < HN; zi++) for (let xi = 0; xi < HN; xi++) {
    const x = xi - WH, z = zi - WH, west = l.x < 0 && x < -WH + 70 && Math.abs(z - l.z) < 12, south = l.z > 0 && z > WH - 70 && Math.abs(x - l.x) < 12;
    if (!west && !south) continue;
    const edge = Math.max(Math.abs(x), Math.abs(z)) - (WH - 26); if (edge > 0) H[zi * HN + xi] -= edge * edge * .08 * (1 - Math.max(0, (west ? Math.abs(z - l.z) : Math.abs(x - l.x)) - 8) / 4);
  }
})(valeHooks.terrain);
X.arriveHooks = X.arriveHooks || [];
X.arriveHooks.push((zone, from) => {
  const sp = { weald: { x: 270, z: 40 }, kiln: { x: 270, z: -30 }, hush: { x: 20, z: -270 } };
  if (sp[zone] && (from === 'vale' || !from)) return sp[zone];
  if (zone === 'vale') { const l = VALE_LINES.find(v => v.to === from); if (l) return { x: l.x + Math.sign(-l.x) * (Math.abs(l.x) > 300 ? 22 : 0), z: l.z + (Math.abs(l.z) > 300 ? -Math.sign(l.z) * 22 : 0) }; }
  return null;
});
X.fakeLvlHooks = X.fakeLvlHooks || [];
X.fakeLvlHooks.push(zone => ['weald', 'kiln', 'hush'].includes(zone) ? Math.max(1, Math.min(6, Math.round(1 + Math.random() ** 1.3 * 5))) : null);

// =====================================================================================================
// THE IRONBARK WEALD: the Varr
// =====================================================================================================
Object.assign(MOBS, {
  mossboar: mob('Mossback Boar', 'boar', { ...B, hpM: .9, weak: 'fire', resist: 'nature' }),
  thornwolf: mob('Thornwolf', 'wolf', { ...B, spd: 6.2, aggro: 9, social: 8 }),
  barkspider: mob('Barkspinner', 'spider', { ...B, scale: .9, resist: 'nature' }),
  nettlewasp: mob('Nettlewasp', 'wasp', { ...B, hpM: .7, fly: .9, weak: 'frost', resist: 'nature' }),
  sapling: mob('Wild Sapling', 'treant', { hpM: 1.05, spd: 4.6, scale: .7, resist: 'nature' }),
  poacher: mob('Kingdom Poacher', 'bandit', { ...HU, weak: 'storm', aggro: 12, social: 14, flee: true }),
  trapper: mob('Kingdom Trapper', 'xbow', { ...HU, hpM: .8, range: 20, ranged: true, weak: 'storm' }),
  choirseeker: mob('Pale Choir Seeker', 'cultist0', { ...HU, weak: 'holy', resist: 'shadow', aggro: 12, social: 14 }),
  boneseer: mob('Pale Choir Bone-Seer', 'cultist1', { ...HU, hpM: .8, range: 18, ranged: true, caster: true, healer: true, school: 'shadow', weak: 'holy', resist: 'shadow' }),
  warbones: mob('Risen War-Beast', 'ghoul', { ...U, hpM: 1.1, weak: 'holy', resist: 'shadow', scale: 1.1 }),
  // named
  wealdgreymane: boss('Greymane', 'wolf', { ...B, hpM: 1.4, scale: 1.7, spd: 6.4, mechs: ['charge', 'hounds'], adds: 'thornwolf' }),
  chainmaster: boss('Chain-Master Orrick', 'brute', { ...HU, mechs: ['cleave', 'knock', 'call'], adds: 'poacher', lines: { start: 'A horned one! You\'re worth twenty crowns to the right buyer. Hold still and this won\'t hurt much.', half: 'Lads! The nets!' } }),
  rootrot: boss('The Rootrot', 'treant', { hpM: 1.3, scale: 1.3, mechs: ['slam', 'spawn'], adds: 'sapling', lines: { start: '*The roots under your feet start to move.*', half: '*Saplings tear themselves out of the soil.*' } }),
  bonesingerveil: boss('Bonesinger Veil', 'cultist2', { ...HU, range: 18, ranged: true, caster: true, school: 'shadow', mechs: ['pool', 'heal', 'call'], adds: 'warbones', lines: { start: 'The beasts belonged to the summoners once. They will belong to the Lord of Graves next.', half: 'Wake, old warriors! Wake!' } }),
  hollowstag: boss('The Hollow Stag', 'ghoul', { ...U, hpM: 1.6, scale: 1.8, mechs: ['charge', 'cleave', 'call', 'enrage'], adds: 'warbones', lines: { start: '*A stag of bone and moss rises from the Heartwood. Your ancestors carried soldiers on its back.*', half: '*It bellows, and the dead of the grove answer.*' } }),
});
Object.assign(MOB_LORE, { mossboar: 'A boar so old and so lazy that moss grows on its back. It is not lazy about charging.', thornwolf: 'A wolf of the Weald with burrs in its coat and a grudge against everyone.',
  poacher: 'The kingdoms pay well for Varr horn and Varr hide. These men intend to collect.', choirseeker: 'A seeker of the Pale Choir, sent into the Weald to dig up what the druids buried.',
  warbones: 'One of the druids\' war-beasts, a hundred years dead, dragged up and stitched back together.', hollowstag: 'The war-stag of the druid Ysk, who led the Weald\'s beasts in the summoner wars. It was buried with honors. It was not supposed to get up.' });
Object.assign(GIVERS, {
  yrsa: { name: 'Elder Yrsa Ashmane', title: 'Hornstead · speaker of the Weald', model: 'druid1' },
  huntgarrow: { name: 'Hunt-Master Garrow', title: 'Hornstead · the hunt', model: 'archer2' },
  thane: { name: 'Thane Brannoch', title: 'Hornstead · the warband', model: 'wardancer1' },
  moss: { name: 'Old Moss', title: 'Hornstead · tanner and gossip', model: 'bard0' },
});
for (const k of ['yrsa', 'huntgarrow', 'thane', 'moss']) GIVERS[k].model += '_varr';
Object.assign(TALK, {
  yrsa: { bio: "Yrsa Ashmane is the oldest Varr in the Weald. Her grandmother was a druid's war-beast, wearing a collar and a saddle, and Yrsa still keeps the collar on a nail by her door so she never forgets what freedom cost.",
    greet: ["The Weald is quiet this morning, cub, and I don't trust it. Quiet woods are woods that are holding their breath.", "Sit, sit. The young never sit. That's why the young never notice anything."],
    topics: [{ q: 'Who are the Varr?', a: ["A hundred years ago the druids bred us for war: wolves that could hold a spear, stags that could carry a soldier, bears that understood orders. When the Fourfold Law ended the war, the druids went home. We stayed.", "We built Hornstead on the bones of the old kennels. The kingdoms call us beasts, and some of them hunt us. We call ourselves the Varr, which in the druids' tongue means 'the unleashed'."] },
      { q: 'Why are the graves empty?', a: ["Our war-beasts are buried in the Beast-Graves to the north-west, with honors, under the old oaks. Someone has been digging them up and carrying them off. Not robbers; robbers would take the bronze.", "These diggers leave the bronze and take the bones. Only one kind of person wants old bones that badly, cub, and it isn't a good kind."] }] },
  huntgarrow: { bio: 'Garrow lost an eye to a poacher\'s bolt and half an ear to a bear. He says the bear was the politer of the two.', greet: ["Bow strung? Knife sharp? Then you're halfway to being useful.", "The Weald feeds us if we're clever, and eats us if we're not. Be clever."], topics: [] },
  thane: { bio: 'Thane Brannoch leads Hornstead\'s warband: forty Varr with spears, and a great deal of shouting. He was a war-wolf\'s grandson and fights like one.', greet: ["Poachers in the east woods again. One day the kingdoms will send an army. Today they send men with nets. I prefer the men with nets.", "If you're looking for a fight, cub, you've come to the right Thane."], topics: [] },
  moss: { bio: 'Old Moss tans hides, brews something he calls tea, and knows everyone\'s business. He claims to be a hundred and ten. He is probably sixty.', greet: ["Tea? No? Your loss. It's mostly bark.", "You hear things, tanning hides. Mostly you hear people complaining about the smell."], topics: [] },
});
Object.assign(LORE, { wealdcollar: { title: "A War-Beast's Collar", where: 'beastgraves', text: "Bronze, green with age, stamped with a druid's sigil and a number: 4417. Inside the collar, scratched in the clumsy letters of something that had only just learned to write: 'I am not a number. I am Ysk's friend.'" } });
defineZone('weald', {
  size: 300, seed: 9101, name: 'The Ironbark Weald', bossName: 'The Hollow Stag', land: hills(10), hiH: 10,
  pal: { a: '#4a6a2e', b: '#5a7a34', hi: '#6a6a4a', road: '#7a6a4a', cob: '#7a6a50', low: '#3a5a2a' },
  towns: [{ key: 'hornstead', name: 'Hornstead', x: -110, z: 170, R: 24, wall: 'palisade', gates: [0, Math.PI * 1.5], roof: '#6a5a3a', guardName: 'Hornstead Spear', guardKind: 'wardancer0_varr',
    houses: [[-10, 8, .4, 'hut'], [10, 10, -.4, 'hut'], [-12, -8, .2, 'hut'], [12, -10, 2.2, 'hall', 9, 5]], props: [[0, 4, 'totem'], [-4, -14, 'totem'], [8, 0, 'lantern'], [-8, 2, 'lantern']],
    npcs: [['giver', 'yrsa', 0, 0], ['giver', 'huntgarrow', 6, 6], ['giver', 'thane', 10, -4], ['giver', 'moss', -6, 4], ['vendor', 'hornstead', -4, -6], ['bind', null, 2, -3]],
    guards: [[22, 2], [22, -2], [-2, -22], [2, -22]] }],
  roads: [[-86, 170, 40, 120], [40, 120, 160, 60], [160, 60, 286, 40], [-110, 146, -150, 0], [-150, 0, -60, -150], [-60, -150, 120, -170]],
  regions: { names: ['Hornstead Clearings', 'The East Woods', 'The Beast-Graves', 'The Heartwood'], fn: (x, z) => z > 40 ? (x < 0 ? 0 : 1) : x < 0 ? 2 : 3 },
  open: [{ key: 'heartwood', name: 'The Rotting Heartwood', x: 160, z: -170, R: 30, deco: 'dead', decoN: 30, centre: 'oak', lvl: [4, 5], area: 3,
    packs: [[-16, 0, ['warbones', 'choirseeker']], [16, 0, ['sapling', 'sapling', 'boneseer']], [0, -16, ['warbones', 'warbones']], [0, 16, ['choirseeker', 'boneseer', 'sapling']]],
    bosses: [[-20, -16, 'rootrot', 4], [20, -18, 'bonesingerveil', 5], [0, -4, 'hollowstag', 5, true]] }],
  landmarks: [{ g: 'stonecircle', x: -180, z: -40, name: 'The Beast-Graves', R: 26, clear: 20 }, { g: 'totem', x: 130, z: 100, name: 'The Leash-Posts', R: 14, clear: 10 }],
  lines: [{ x: 286, z: 40, to: 'vale', label: 'East to the Vale', ry: Math.PI / 2 }],
  spots: { clearing: { x: -40, z: 120 }, eastwoods: { x: 140, z: 130 }, beastgraves: { x: -180, z: -40 }, leashposts: { x: 130, z: 100 }, poachers: { x: 180, z: 20 }, heartwood: { x: 160, z: -170 }, seekers: { x: -100, z: -100 } },
  scatter: [[24, [-260, 40, 50, 280], ['mossboar', 'mossboar', 'thornwolf', 'nettlewasp'], [1, 2], 0], [26, [0, 270, 50, 270], ['thornwolf', 'barkspider', 'nettlewasp', 'mossboar'], [2, 3], 1],
    [26, [-270, 0, -260, 40], ['barkspider', 'sapling', 'choirseeker', 'warbones'], [3, 4], 2], [22, [0, 270, -270, 40], ['sapling', 'warbones', 'barkspider', 'choirseeker'], [4, 5], 3]],
  camps: [[4, [60, 270, -40, 120], ['poacher', 'trapper', 'poacher'], [2, 4], 1, 'pc'], [3, [-260, -20, -260, -20], ['choirseeker', 'boneseer', 'choirseeker'], [3, 4], 2, 'cs']],
  rares: [[[0, 260, 60, 260], 'wealdgreymane', 3, false], [[110, 150, 80, 120], 'chainmaster', 3, false]],
  hunt: [{ area: 0, lvl: [1, 2] }, { area: 1, lvl: [2, 3] }, { area: 2, lvl: [3, 4] }, { area: 3, lvl: [4, 5] }],
  labels: [{ t: 'Boars, wolves (1-2)', x: -150, z: 110 }, { t: 'Poachers, wolves (2-3)', x: 150, z: 110 }, { t: 'The Pale Choir (3-4)', x: -140, z: -120 }, { t: 'Risen war-beasts (4-5)', x: 120, z: -110 }],
  nodes: [['copper', 'ore', 'orecopper', 1, null, 12], ['meadowsweet', 'herb', 'herbmeadow', 1, null, 20]],
  scenery: { density: 24000, tuft: '#5a8a3a', kinds: [['oak', .05, 1.1, 2.2], ['pine', .03, 1, 1.8], ['birch', .015, 1, 1.5], ['dead', .004, 1, 1.6]] },
  sky: { fog: '#5a7a4a', top: '#4a7aa0', hor: '#a8c890', k: .35 },
});
const W = { zone: 'weald' };
QUESTS.push(
  { id: 'rv1', story: true, giver: 'huntgarrow', lvl: 1, name: 'The First Hunt', where: 'clearing', ...W, obj: { kill: ['mossboar'], n: 6, near: 'clearing', nearR: 140, what: 'Hunt 6 mossback boars in the clearings around Hornstead' },
    say: ["So you're the cub Yrsa wants trained. Good. Every Varr starts the same way: with a spear, a boar, and a lesson in which one of you is faster.", "Six mossbacks from the clearings. They're slow, they're stupid, and they will still put a tusk through your leg if you let them. Don't let them."],
    done: ["Six! And you're still walking. The boars of the Weald have been warned, cub. Go and tell the Elder you're blooded."] },
  { id: 'rv2', story: true, giver: 'yrsa', lvl: 1, pre: 'rv1', name: 'The Empty Graves', where: 'beastgraves', ...W, obj: { at: 'beastgraves', r: 22, what: 'Visit the Beast-Graves north-west of Hornstead' },
    say: ["The Beast-Graves lie north-west, under the old oaks: our war-beasts, the ones who fought in the summoner wars and died with their collars still on. We buried them with honors. Someone has been digging.", "Go and look, cub, with young eyes. Tell me what you see, and tell me honestly, even if it's ugly."],
    done: ["Open graves, the bronze left behind, and the bones carried off. Pale cloth caught on the brambles. Then it's what I feared, and worse than I hoped."] },
  { id: 'rv3', story: true, giver: 'yrsa', lvl: 2, pre: 'rv2', name: 'Pale Cloth in the Brambles', where: 'seekers', ...W, obj: { kill: ['choirseeker', 'boneseer'], n: 6, near: 'seekers', nearR: 160, what: 'Drive off 6 seekers of the Pale Choir in the woods west of the Beast-Graves' },
    say: ["The Pale Choir. They're a cult from the human lands who sing to the dead, and they've come into our woods with shovels and sacks.", "Six of them, cub. Drive them out. If they ask you to listen to their hymn, the answer is no."],
    done: ["They'll think twice before they come back. They will come back, mind you, because people who dig up graves never think twice about anything."] },
  { id: 'rv4', story: true, giver: 'yrsa', turnTo: 'thane', lvl: 2, pre: 'rv3', name: 'What the Seekers Carry', where: 'seekers', ...W, obj: { collect: ['choirseeker', 'boneseer'], item: 'Bone Coin', chance: .55, n: 5, what: 'Take 5 bone coins from the Pale Choir and bring them to Thane Brannoch' },
    say: ["The seekers carry coins made of bone. Bone coins, cub, stamped with a skull. Nobody mints money out of bone unless somebody else is willing to take it.", "Bring me five, no, bring them to the Thane. Brannoch will want to know who's buying our dead."],
    done: [['thane', "Bone coin. The same filth the kingdom poachers have been carrying all spring. So the Choir pays the poachers, and the poachers sell them our dead."], ['thane', "Well. That makes the poachers my business, and my business is spears."]] },
  { id: 'rv5', story: true, giver: 'thane', lvl: 3, pre: 'rv4', name: 'Men With Nets', where: 'poachers', ...W, obj: { kill: ['poacher', 'trapper'], n: 8, near: 'poachers', nearR: 170, what: 'Break up 8 kingdom poachers and trappers in the East Woods' },
    say: ["The poachers camp in the East Woods. They hunt our deer, they hunt our wolves, and when they think nobody's watching, they hunt us. A Varr hide fetches twenty crowns in the kingdoms.", "Eight of them, cub. Make the East Woods so expensive that the kingdoms decide twenty crowns isn't worth it."],
    done: ["The East Woods are quiet. The kind of quiet I like."] },
  { id: 'rv6', story: true, giver: 'thane', lvl: 3, pre: 'rv5', name: 'The Chain-Master', where: 'leashposts', ...W, obj: { named: 'chainmaster', n: 1, what: 'Defeat Chain-Master Orrick, who runs the poachers' },
    say: ["The poachers have a master: Orrick, who they call the Chain-Master, because he keeps the Varr he catches on chains until a buyer comes. He camps by the old Leash-Posts, where the druids used to tie up their beasts.", "He chose that place on purpose, to make a point. I'd like you to make a different point."],
    done: ["Orrick's done, and his chains are in the river. You've the makings of a warband Varr, cub. But the Elder will want you; she's found something worse."] },
  { id: 'rv7', story: true, giver: 'yrsa', lvl: 4, pre: 'rv6', name: "The Thornmother's Fever", where: 'heartwood', ...W, obj: { at: 'heartwood', r: 28, what: 'Go to the Rotting Heartwood, the great grove in the north-east' },
    say: ["The Heartwood is the oldest grove in the Weald. The druid Ysk raised it, and his war-stag is buried under its roots. This morning the trees there started to rot from the inside out.", "That isn't sickness, cub. That's somebody singing. Go and see."],
    done: ["The Choir has made the Heartwood their own. And the stag, cub. They've woken Ysk's stag."] },
  { id: 'rv8', story: true, giver: 'yrsa', lvl: 5, pre: 'rv7', name: 'The Hollow Stag', where: 'heartwood', ...W, obj: { named: 'hollowstag', n: 1, what: 'Put the Hollow Stag to rest in the Rotting Heartwood' },
    say: ["The stag carried Ysk through the whole of the war. When Ysk died, it lay down on his grave and didn't get up again. It doesn't deserve to be a puppet.", "Take friends, cub. It was the strongest thing in the Weald, alive or dead. Put it back to sleep, and break whatever the Choir is using to wake the dead."],
    done: ["It's resting. Thank you. And on the bone-singer, this: a letter, sealed with a skull, addressed to 'the Choir-Mother in the Vale'. Everything leads east, to the human lands."] },
  { id: 'rv9', story: true, giver: 'yrsa', turnTo: 'sister', lvl: 5, pre: 'rv8', name: 'East to the Vale', ...W, obj: { talk: true, what: 'Take the bone-singer\'s letter east to the Vale, to Sister Maren in {town}' },
    say: ["The letter names the Vale, and a sister there who keeps the old shrines: Sister Maren. The humans won't love a Varr walking into their town. Walk in anyway, cub, and walk tall.", "Our dead are being bought and carried east. Whatever is buying them is the same thing that is emptying the human graves. Find it."],
    done: [['sister', "A Varr? In {town}? Well, the Four made all of us, whatever the druids did afterwards. Sit down, and let me read that letter."], ['sister', "The Pale Choir again, and their Choir-Mother. Our graves have been emptying all year, and now I know where some of the bones went. You've come a long way to help strangers. Let's not waste it."]] },
  { id: 'vs1', giver: 'huntgarrow', lvl: 2, pre: 'rv1', name: 'Nettlewasp Nests', where: 'clearing', ...W, obj: { kill: ['nettlewasp'], n: 8, what: 'Clear out 8 nettlewasps' }, say: ["The nettlewasps are nesting in the hunting blinds again. A sting won't kill you. Twelve stings will make you wish it had.", "Eight of them, and then the blinds are ours again."], done: ["The blinds smell of smoke and dead wasp. Perfect."] },
  { id: 'vs2', giver: 'moss', lvl: 2, name: 'Silk for the Spring Weaving', where: 'eastwoods', ...W, obj: { collect: ['barkspider'], item: 'Barkspinner Silk', chance: .55, n: 6, what: 'Gather 6 barkspinner silk' }, say: ["The weavers want barkspinner silk, and I want the weavers to stop asking me for it. Six bundles. The spiders will object, so object back."], done: ["Lovely. They'll make cloaks out of that, and then complain the cloaks are sticky."] },
  { id: 'vs3', giver: 'huntgarrow', lvl: 3, pre: 'vs1', name: 'Greymane', where: 'eastwoods', ...W, obj: { named: 'wealdgreymane', n: 1, what: 'Hunt Greymane, the old grey wolf of the East Woods' }, say: ["There's a grey wolf in the East Woods older than you, cub, and twice as clever. Greymane, we call him. He leads the thornwolves, and he took my ear.", "I'd like you to take it back. Figuratively."], done: ["Greymane, at last. I'll hang his pelt by the fire, and tell everyone I did it. You'll forgive me."] },
  { id: 'vs4', giver: 'moss', lvl: 3, name: 'Saplings Where They Shouldn\'t Be', where: 'beastgraves', ...W, obj: { kill: ['sapling'], n: 7, what: 'Fell 7 wild saplings' }, say: ["Since the Choir came, the saplings have started walking, which saplings shouldn't do. Seven of them. Gently, if you can. Firmly, if you can't."], done: ["They're just wood again. Good wood, too. I'll make tea out of it."] },
  { id: 'vs5', giver: 'thane', lvl: 4, pre: 'rv5', name: 'The Leash-Posts', where: 'leashposts', ...W, obj: { at: 'leashposts', r: 12, what: 'Pull down the old Leash-Posts' }, say: ["The druids tied their beasts to the Leash-Posts every night of the war. Orrick's men use them to tie up Varr. I want them down, cub, every one, and I want you to be the one who does it."], done: ["Down. About time. A hundred years about time."] },
);

// =====================================================================================================
// THE KILNLANDS: the Grael
// =====================================================================================================
Object.assign(MOBS, {
  cinderling: mob('Cinderling', 'firepet', { hpM: .85, scale: .6, weak: 'frost', resist: 'fire' }),
  glassmite: mob('Glassmite', 'spider', { ...B, scale: .8, weak: 'earth', resist: 'fire' }),
  emberhound: mob('Emberhound', 'wolf', { ...B, spd: 6.2, weak: 'frost', resist: 'fire' }),
  slagbat: mob('Slagbat', 'wasp', { ...B, hpM: .7, fly: 1, weak: 'frost' }),
  rustgolem: mob('Woken Rustgolem', 'golempet', { hpM: 1.2, spd: 4.6, scale: .85, weak: 'storm', resist: 'earth' }),
  scavenger: mob('Core Scavenger', 'bandit2', { ...HU, weak: 'storm', aggro: 12, social: 14, flee: true }),
  sigilsmith: mob('Bone-Sigil Smith', 'cultist1', { ...HU, hpM: .8, range: 18, ranged: true, caster: true, healer: true, school: 'shadow', weak: 'holy', resist: 'shadow' }),
  grandfatherslag: boss('Grandfather Slag', 'golempet', { hpM: 1.4, scale: 1.6, weak: 'storm', resist: 'earth', mechs: ['slam', 'shield'] }),
  coremonger: boss('Dask the Coremonger', 'brute', { ...HU, mechs: ['cleave', 'call', 'knock'], adds: 'scavenger', lines: { start: 'A walking golem heart! Do you know what the Choir pays for one of those? Neither do I. I just know it\'s a lot.', half: 'Grab it! Grab the rock!' } }),
  glassqueen: boss('The Glass Queen', 'spider', { ...B, scale: 1.8, weak: 'earth', mechs: ['web', 'spawn'], adds: 'glassmite', lines: { start: '*Something enormous and transparent unfolds from the kiln wall.*', half: '*Her brood pours from the cracks in the glass.*' } }),
  sigilmother: boss('Sigil-Mother Cray', 'cultist2', { ...HU, range: 18, ranged: true, caster: true, school: 'shadow', mechs: ['pool', 'heal', 'call'], adds: 'rustgolem', lines: { start: 'Every golem in this forge will wear the Lord\'s sigil. You will too, when you are melted down.', half: 'Wake, servants!' } }),
  forgeheart: boss('The Forge-Heart', 'golempet', { hpM: 1.7, scale: 2.4, weak: 'storm', resist: 'earth', mechs: ['slam', 'pool', 'spawn', 'enrage'], adds: 'cinderling', lines: { start: '*The great golem of the First Forge opens its eyes. The bone sigil on its chest burns.*', half: '*Its furnace roars. The forge fills with cinders.*' } }),
});
Object.assign(MOB_LORE, { rustgolem: 'A war golem of the elementalists, asleep for a century. Something has woken it wrong.', cinderling: 'A spark from the old forges that never quite went out.', scavenger: 'A scavenger who cracks open sleeping golems for the fire-cores inside. Every Grael was once one of those cores.',
  forgeheart: 'The first and greatest golem of the elementalists\' forges. Its heart is the mother of the Grael, and it should never have been woken.' });
Object.assign(GIVERS, {
  ashka: { name: 'Forge-Mother Ashka', title: 'Cinderhall · keeper of the hearth', model: 'bulwark2' },
  tumble: { name: 'Old Tumble', title: 'Cinderhall · the first to wake', model: 'monk1' },
  kesh: { name: 'Kesh the Glasswright', title: 'Cinderhall · glass and fire', model: 'elem1' },
  brakk: { name: 'Warden Brakk', title: 'Cinderhall · the watch', model: 'bladewarden1' },
});
for (const k of ['ashka', 'tumble', 'kesh', 'brakk']) GIVERS[k].model += '_grael';
Object.assign(TALK, {
  ashka: { bio: "Ashka was the hundredth Grael to wake. She keeps the hearth of Cinderhall, where every new Grael is carried when its stone first cracks and something inside it starts, slowly, to think.",
    greet: ["Warm yourself. A Grael who lets the fire in their chest go cold doesn't wake up again.", "Every one of us was a golem's heart once, little stone. Some of us are still learning what to do with it."],
    topics: [{ q: 'Who are the Grael?', a: ["The elementalists built war golems out of stone and gave each one a heart of living fire. When the war ended they left the golems here in the Kilnlands, switched off, to cool.", "A golem's body cools in a year. A heart takes a century. When ours finally cooled enough, we cracked out of them and found we could think. We've been thinking ever since. Slowly. Grael do everything slowly, except fight."] },
      { q: 'What is waking the golems?', a: ["The sleepers in the Golem Field aren't waking the way we woke. They're getting up empty, with a bone sigil burned into their chests and nothing inside but orders.", "Somebody is cutting sigils into our grandparents and making them walk. I want to know who, and I want them to stop."] }] },
  tumble: { bio: 'Old Tumble was the first golem to wake as a Grael, ninety years ago. He spent the first ten years sitting perfectly still, looking at a flower. He says it was a very good flower.', greet: ["Hm. Hello. Take your time. I always do.", "The fire remembers being a weapon. The stone remembers being a mountain. You get to decide which one to listen to."], topics: [] },
  kesh: { bio: 'Kesh blows glass from the black sand of the kilns, and sells it to the kingdoms for more money than the kingdoms realise. She is the only Grael who talks quickly.', greet: ["Mind the shelves, mind the glass, mind your elbows. Grael elbows break things.", "Black glass, from the old kilns. Pretty, sharp, and worth a fortune in Corrand."], topics: [] },
  brakk: { bio: 'Warden Brakk was a siege golem, built to knock down walls. Now he stands at the gate of Cinderhall and keeps one up. He finds this funny.', greet: ["Halt. Who goes there. Oh, it's you. Carry on.", "Scavengers on the ridge again. They want our hearts, little stone, and they don't much care whether we're using them."], topics: [] },
});
Object.assign(LORE, { kilnledger: { title: 'An Elementalist\'s Ledger', where: 'oldforge', text: "Unit 1: the Forge-Heart. Primary core. All subsequent cores are cut from its flame. Note in the margin, later, in a shakier hand: 'If the Heart ever wakes, every core that came from it will hear. Every one. Seal the forge.'" } });
defineZone('kiln', {
  size: 300, seed: 9202, name: 'The Kilnlands', bossName: 'The Forge-Heart', land: (x, z, N) => 2 + N.fbm(x * .007, z * .007, 4) * 12 + Math.max(0, N.fbm(x * .02 + 9, z * .02, 2) - .55) * 18, hiH: 9,
  pal: { a: '#5a4a44', b: '#7a5a48', hi: '#3a3036', road: '#8a7a6a', cob: '#8a8070', low: '#2a2428' },
  towns: [{ key: 'cinderhall', name: 'Cinderhall', x: -120, z: 150, R: 26, wall: 'human', gates: [0, Math.PI * 1.5], roof: '#4a3a3a', hwall: '#8a8478', guardName: 'Cinderhall Warden', guardKind: 'bulwark0_grael',
    houses: [[-10, 8, .4, { stone: true, wall: '#8a8478', roof: '#5a3a32' }], [10, 10, -.4, { stone: true, wall: '#7a746a', roof: '#4a3a32' }], [-12, -8, .2, 'cavehouse'], [12, -10, 2.2, 'cavehouse']], props: [[0, 4, 'statue'], [8, 0, 'lantern'], [-8, 2, 'lantern'], [4, -12, 'crystal']],
    npcs: [['giver', 'ashka', 0, 0], ['giver', 'tumble', -6, 5], ['giver', 'kesh', 6, 6], ['giver', 'brakk', 10, -4], ['vendor', 'cinderhall', -4, -6], ['bind', null, 2, -3]],
    guards: [[24, 2], [24, -2], [-2, -24], [2, -24]] }],
  roads: [[-94, 150, 40, 100], [40, 100, 160, 0], [160, 0, 286, -30], [-120, 124, -160, -20], [-160, -20, 0, -150], [0, -150, 150, -170]],
  regions: { names: ['The Cinder Steps', 'The Glass Ridge', 'The Golem Field', 'The First Forge'], fn: (x, z) => z > 30 ? (x < 0 ? 0 : 1) : x < 0 ? 2 : 3 },
  open: [{ key: 'oldforge', name: 'The First Forge', x: 160, z: -170, R: 30, deco: 'crystal', decoN: 22, ring: true, gap: Math.PI * 1.5, centre: 'statue', lvl: [4, 5], area: 3,
    packs: [[-16, 0, ['rustgolem', 'sigilsmith']], [16, 0, ['cinderling', 'cinderling', 'sigilsmith']], [0, -16, ['rustgolem', 'rustgolem']], [0, 16, ['glassmite', 'glassmite', 'sigilsmith']]],
    bosses: [[-20, -16, 'glassqueen', 4], [20, -18, 'sigilmother', 5], [0, -4, 'forgeheart', 5, true]] }],
  landmarks: [{ g: 'statue', x: -170, z: -60, name: 'The Golem Field', R: 30, clear: 12 }, { g: 'crystal', x: 120, z: 90, name: 'The Glassfalls', R: 14, clear: 10, s: 2.4 }],
  lines: [{ x: 286, z: -30, to: 'vale', label: 'East to the Vale', ry: Math.PI / 2 }],
  spots: { steps: { x: -40, z: 110 }, ridge: { x: 140, z: 110 }, sleepers: { x: -170, z: -60 }, glassfalls: { x: 120, z: 90 }, scav: { x: 170, z: 10 }, oldforge: { x: 160, z: -170 }, smiths: { x: -100, z: -120 } },
  scatter: [[24, [-260, 40, 40, 280], ['cinderling', 'cinderling', 'slagbat', 'emberhound'], [1, 2], 0], [26, [0, 270, 40, 270], ['emberhound', 'glassmite', 'slagbat', 'cinderling'], [2, 3], 1],
    [26, [-270, 0, -260, 30], ['rustgolem', 'glassmite', 'sigilsmith', 'emberhound'], [3, 4], 2], [22, [0, 270, -270, 30], ['rustgolem', 'cinderling', 'glassmite', 'sigilsmith'], [4, 5], 3]],
  camps: [[4, [60, 270, -50, 110], ['scavenger', 'scavenger', 'scavenger'], [2, 4], 1, 'sv'], [3, [-260, -20, -260, -20], ['sigilsmith', 'rustgolem', 'sigilsmith'], [3, 4], 2, 'ss']],
  rares: [[[-260, 0, -200, 0], 'grandfatherslag', 3, false], [[150, 190, -10, 30], 'coremonger', 3, false]],
  hunt: [{ area: 0, lvl: [1, 2] }, { area: 1, lvl: [2, 3] }, { area: 2, lvl: [3, 4] }, { area: 3, lvl: [4, 5] }],
  labels: [{ t: 'Cinderlings, slagbats (1-2)', x: -150, z: 90 }, { t: 'Scavengers, hounds (2-3)', x: 150, z: 100 }, { t: 'Woken golems (3-4)', x: -140, z: -120 }, { t: 'The First Forge (4-5)', x: 120, z: -110 }],
  nodes: [['copper', 'ore', 'orecopper', 1, null, 22], ['iron', 'ore', 'oreiron', 40, null, 6]],
  scenery: { density: 20000, tuft: '#6a5a3a', kinds: [['crystal', .006, .8, 1.6], ['dead', .008, 1, 1.6], ['stalag', .012, .6, 1.2]] },
  sky: { fog: '#6a4a3a', top: '#5a3a3a', mid: '#8a5a3a', hor: '#c8784a', k: .45 },
});
const K = { zone: 'kiln' };
QUESTS.push(
  { id: 'kg1', story: true, giver: 'brakk', lvl: 1, name: 'Cooling Off', where: 'steps', ...K, obj: { kill: ['cinderling'], n: 6, near: 'steps', nearR: 140, what: 'Put out 6 cinderlings on the Cinder Steps' },
    say: ["You've just cracked, haven't you, little stone? You've got the look. Everything's bright and loud, and you keep wanting to sit still and stare at it. That passes.", "Here's something useful to stare at: the cinderlings on the Steps. Sparks from the old forges, and they set fire to everything. Six of them. Hit them hard; they're mostly air."],
    done: ["Six out. You've a good arm on you. Built for it, I expect. We all were. Go and see the Forge-Mother; she's been asking for you."] },
  { id: 'kg2', story: true, giver: 'ashka', lvl: 1, pre: 'kg1', name: 'The Sleepers Stir', where: 'sleepers', ...K, obj: { at: 'sleepers', r: 26, what: 'Go to the Golem Field to the south-west' },
    say: ["In the Golem Field, west of here, a thousand war golems lie where the elementalists left them, still cooling. Some of them are our grandparents. Some of them are us, not yet woken.", "Last night, three of them stood up. Go and look, little stone. Carefully."],
    done: ["Empty eyes and a sigil of bone on their chests. Those aren't Grael waking. Those are golems being worn like coats."] },
  { id: 'kg3', story: true, giver: 'ashka', lvl: 2, pre: 'kg2', name: 'Rust and Ruin', where: 'sleepers', ...K, obj: { kill: ['rustgolem'], n: 6, near: 'sleepers', nearR: 170, what: 'Put down 6 woken rustgolems in the Golem Field' },
    say: ["They're walking toward Cinderhall, and they're not walking slowly, which means there's nothing of us left in them. Put them down, little stone. Six of them.", "It's not murder. There's nobody home. I keep telling myself that."],
    done: ["Six. Thank you. Now I'd like to know who's knocking on the doors of empty houses."] },
  { id: 'kg4', story: true, giver: 'ashka', turnTo: 'kesh', lvl: 2, pre: 'kg3', name: 'A Sigil of Bone', where: 'sleepers', ...K, obj: { collect: ['rustgolem', 'sigilsmith'], item: 'Bone Sigil', chance: .5, n: 4, what: 'Pry 4 bone sigils from woken golems and take them to Kesh' },
    say: ["The sigils on their chests are carved bone. Bring me four, no, bring them to Kesh. She knows the old forge-marks better than anyone, and she owes me a favor."],
    done: [['kesh', "Bone, carved with a skull and a crown. This isn't elementalist work. Elementalists used glass and fire, never bone."], ['kesh', "But the scavengers on the ridge have been paying for food with bone coins stamped with the same skull. Brakk will want to hear that."]] },
  { id: 'kg5', story: true, giver: 'kesh', turnTo: 'brakk', lvl: 3, pre: 'kg4', name: 'Core Thieves', where: 'scav', ...K, obj: { kill: ['scavenger'], n: 8, near: 'scav', nearR: 170, what: 'Drive off 8 core scavengers on the Glass Ridge, then report to Warden Brakk' },
    say: ["The scavengers crack sleeping golems open for their cores and sell them in the kingdoms. Now they're paid in bone, which means they're selling to someone new.", "Eight of them, little stone. Then tell Brakk. He'll be pleased; he's been wanting an excuse."],
    done: [['brakk', "Eight scavengers! You've been busy. They're working for someone called Dask. Dask the Coremonger."]] },
  { id: 'kg6', story: true, giver: 'brakk', lvl: 3, pre: 'kg5', name: 'Dask the Coremonger', where: 'scav', ...K, obj: { named: 'coremonger', n: 1, what: 'Defeat Dask the Coremonger on the Glass Ridge' },
    say: ["Dask runs the scavengers from a camp on the Glass Ridge. He's cracked open more of our unborn than I can count, and he's proud of it.", "I was built to knock down walls, little stone. Knock this one down for me."],
    done: ["Dask's done. And in his pack, a letter: 'For the Sigil-Mother at the First Forge. The Lord of Graves wants the Heart.' The Heart, little stone. They want to wake the Forge-Heart."] },
  { id: 'kg7', story: true, giver: 'ashka', lvl: 4, pre: 'kg6', name: 'The First Forge', where: 'oldforge', ...K, obj: { at: 'oldforge', r: 28, what: 'Go to the First Forge in the south-east' },
    say: ["The Forge-Heart is the first golem the elementalists ever built. Every fire-core was cut from its flame, which means every Grael is its child.", "If someone wakes it with a sigil of bone, I don't know what happens to the rest of us. Go to the First Forge and see what they're doing."],
    done: ["They've already started. I felt it this morning: a pull, like a hand on my heart. All of us felt it. Hurry."] },
  { id: 'kg8', story: true, giver: 'ashka', lvl: 5, pre: 'kg7', name: 'The Forge-Heart', where: 'oldforge', ...K, obj: { named: 'forgeheart', n: 1, what: 'Stop the Forge-Heart in the First Forge' },
    say: ["The Heart is awake, and it's wearing the sigil. Take friends, little stone. Take every friend you have. Put it to sleep, and break that sigil.", "It's our mother, in a way. Be gentle if you can. You won't be able to."],
    done: ["The pull's gone. I can breathe again, if Grael breathed. Thank you. And this was on the Sigil-Mother: a map of the Vale, with a town circled, and a name beside it. Sister Maren."] },
  { id: 'kg9', story: true, giver: 'ashka', turnTo: 'sister', lvl: 5, pre: 'kg8', name: 'East to the Vale', ...K, obj: { talk: true, what: 'Take the Sigil-Mother\'s map east to the Vale, to Sister Maren in {town}' },
    say: ["Whoever wants the dead of the Kilnlands also wants the dead of the Vale. The Sigil-Mother marked a sister there: Maren. Maybe as a target. Maybe as a warning.", "Go east, little stone. Humans stare at Grael. Let them. We've had a century of practice at standing still."],
    done: [['sister', "Good heavens. A Grael. I'd heard of your people and never met one. You're bigger than the books said."], ['sister', "A sigil of bone, a coin of bone, and my name on a map. The Gravelord is reaching for every dead thing in the world, it seems. Then we'd better be quicker. Sit down; let me tell you what we know."]] },
  { id: 'kgs1', giver: 'kesh', lvl: 2, name: 'Glass Eyes', where: 'ridge', ...K, obj: { collect: ['glassmite'], item: 'Glassmite Eye', chance: .55, n: 6, what: 'Gather 6 glassmite eyes' }, say: ["Glassmite eyes are perfect lenses. The kingdoms pay a fortune for spectacles made from them. Six, please, and try not to scratch them."], done: ["Not a scratch. You've delicate hands, for a rock."] },
  { id: 'kgs2', giver: 'brakk', lvl: 2, pre: 'kg1', name: 'Hounds on the Steps', where: 'steps', ...K, obj: { kill: ['emberhound'], n: 8, what: 'Drive off 8 emberhounds' }, say: ["Emberhounds. They like the warmth of the town walls and they bite anything that walks past. Eight of them."], done: ["Good. Now the walls can be warm in peace."] },
  { id: 'kgs3', giver: 'tumble', lvl: 3, name: 'Grandfather Slag', where: 'sleepers', ...K, obj: { named: 'grandfatherslag', n: 1, what: 'Put Grandfather Slag back to sleep' }, say: ["Hm. There's an old golem in the Golem Field. Older than me. We call him Grandfather Slag. He woke up angry, which is a terrible way to wake up.", "Put him back to sleep, would you? Gently. Then come and sit with me for a bit."], done: ["Thank you. He was always cranky. Even asleep, he was cranky."] },
  { id: 'kgs4', giver: 'kesh', lvl: 3, pre: 'kgs1', name: 'The Glassfalls', where: 'glassfalls', ...K, obj: { at: 'glassfalls', r: 12, what: 'Visit the Glassfalls' }, say: ["The Glassfalls are where the old forges poured their slag over the cliff. It cooled into a waterfall of black glass. Go and look at it. Just look. Tumble says every Grael should, once."], done: ["Beautiful, isn't it? Tumble sat in front of it for a year."] },
  { id: 'kgs5', giver: 'tumble', lvl: 4, pre: 'kgs3', name: 'Slagbats', where: 'ridge', ...K, obj: { kill: ['slagbat'], n: 8, what: 'Clear out 8 slagbats' }, say: ["The slagbats nest in my chimney. I don't mind them. Everyone else minds them very much. Eight, please."], done: ["Hm. Quiet. I think I'll miss them. No, I won't."] },
);

// =====================================================================================================
// THE HUSHMOOR: the Sallow
// =====================================================================================================
Object.assign(MOBS, {
  bogwight: mob('Bogwight', 'ghost', { ...U, hpM: .85, weak: 'holy', resist: 'frost' }),
  mirecrawler: mob('Mirecrawler', 'spider', { ...B, weak: 'fire', resist: 'nature' }),
  marshfly: mob('Marsh Biter', 'wasp', { ...B, hpM: .7, fly: .9, weak: 'frost' }),
  fenghoul: mob('Fen Ghoul', 'ghoul', { ...U, hpM: 1.05, weak: 'holy', resist: 'shadow' }),
  lostone: mob('The Lost', 'warlock2_sallow', { ...HU, hpM: .95, range: 18, ranged: true, caster: true, school: 'shadow', weak: 'holy', resist: 'shadow', race: 'sallow' }),
  choircaller: mob('Pale Choir Caller', 'cultist2', { ...HU, hpM: .85, range: 18, ranged: true, caster: true, healer: true, school: 'shadow', weak: 'holy', resist: 'shadow' }),
  witchfinder: mob('Kingdom Witchfinder', 'guard', { ...HU, weak: 'shadow', resist: 'holy', aggro: 12, social: 14 }),
  finderbow: mob('Witchfinder Archer', 'xbow', { ...HU, hpM: .8, range: 20, ranged: true, weak: 'shadow', resist: 'holy' }),
  oldbogmother: boss('Old Bog-Mother', 'ghostnpc', { ...U, hpM: 1.4, range: 18, ranged: true, caster: true, school: 'frost', mechs: ['fear', 'pool'] }),
  captainvane: boss('Witchfinder-Captain Orla Vane', 'guard', { ...HU, weak: 'shadow', resist: 'holy', mechs: ['cleave', 'charge', 'call'], adds: 'witchfinder', lines: { start: 'Necromancy is outlawed, corpse. So are you. The Fourfold Law says the dead stay dead, and I am here to enforce it.', half: 'Finders! Burn it!' } }),
  pitwarden: boss('The Pit-Warden', 'abom', { ...U, scale: 1.4, mechs: ['slam', 'knock'], lines: { start: '*Something stitched from a dozen thralls stands up in the pit. It still wears their collars.*', half: '*It roars with a dozen voices.*' } }),
  choirmotheragent: boss('Cantor Ilse', 'cultist1', { ...HU, range: 18, ranged: true, caster: true, school: 'shadow', mechs: ['fear', 'heal', 'call'], adds: 'lostone', lines: { start: 'Come home, little Sallow. Your master is calling. Don\'t you hear him singing?', half: 'Children! Come to the Choir!' } }),
  overseer: boss('Overseer Grisk', 'gravelord', { ...HU, hpM: 1.6, scale: 1.3, range: 18, ranged: true, caster: true, school: 'shadow', mechs: ['pool', 'spawn', 'fear', 'enrage'], adds: 'fenghoul', lines: { start: 'I kept the thralls of the Hushmoor for twenty years, and I kept them well. The Lord of Graves gave me my old job back. Kneel, thrall.', half: 'Up! Up, all of you! Work!' } }),
});
Object.assign(MOB_LORE, { lostone: 'A Sallow who answered the voice in the night and walked into the fen. Their eyes have gone dark.', witchfinder: 'A witchfinder from the kingdoms. The Fourfold Law says the dead stay dead, and witchfinders count the Sallow as dead.',
  overseer: 'The necromancer\'s overseer who ran the thrall-pits of the Hushmoor. He died in the war. He did not stay dead.' });
Object.assign(GIVERS, {
  wend: { name: 'Lamp-Keeper Wend', title: 'Lanternrest · keeper of the lamps', model: 'cleric1' },
  noll: { name: 'Mother Noll', title: 'Lanternrest · healer', model: 'lifebinder0' },
  bask: { name: 'Corporal Bask', title: 'Lanternrest · the watch', model: 'bulwark1' },
  nameless: { name: 'The Nameless', title: 'Lanternrest · remembers for those who can\'t', model: 'illusionist1' },
});
for (const k of ['wend', 'noll', 'bask', 'nameless']) GIVERS[k].model += '_sallow';
Object.assign(TALK, {
  wend: { bio: "Wend keeps the lanterns of Lanternrest burning: one for every Sallow who has woken, each with a name painted on the glass. When a Sallow remembers their old name, Wend repaints the lantern. Most of the lanterns still say 'Unknown'.",
    greet: ["Every lamp is somebody, friend. That one's yours. It doesn't have a name on it yet. It will.", "Welcome back to the living. Mostly living. Living enough."],
    topics: [{ q: 'Who are the Sallow?', a: ["The necromancers' thralls. When they raised the dead for the war, they didn't raise soldiers; they raised servants, to dig and carry and fight. We were those servants.", "When the Fourfold Law killed the necromancy, it should have killed us too. It didn't. One by one, we woke up, with our own minds back and no memory of who we'd been before we died. That was eighty years ago. We're still waking."] },
      { q: 'What is the voice?', a: ["For a month now, at night, some of us hear singing. A voice, very far away, calling us back to work. It sounds like our old masters.", "Some of us don't wake up the next morning. We find their beds empty and their footprints going into the fen. We call them the Lost."] }] },
  noll: { bio: 'Mother Noll was a healer in her first life; she remembers that much, and nothing else. She heals the living who come to Lanternrest, and the Sallow, who need a different kind of healing.', greet: ["Sit down, love. Let me look at you. You're very grey, but that's normal for us.", "I can stitch a wound. I can't stitch a memory. I keep trying anyway."], topics: [] },
  bask: { bio: 'Corporal Bask remembers his rank and nothing else. He has drilled the watch of Lanternrest every morning for sixty years, because he cannot remember how to stop.', greet: ["Stand up straight. You're a thrall no longer. Act like it.", "Witchfinders on the causeway again. The kingdoms want us burned, and they're polite enough to bring their own torches."], topics: [] },
  nameless: { bio: 'The Nameless remembers nothing at all about their first life, and has decided that this is a gift. They keep the Book of Names, where every Sallow writes down what they remember, so that nobody has to remember it alone.', greet: ["Do you remember anything yet? A face, a song, a smell? Write it down. Everything goes in the Book.", "I don't know who I was. I know who I am. That turns out to be enough."], topics: [] },
});
Object.assign(LORE, { hushbook: { title: 'The Book of Names', where: 'lanternrest', text: "A page in many hands. 'I remember the sea.' 'I had a daughter. I don't know her name.' 'I remember the smell of bread.' 'I was a soldier of Vharos. I remember the walls falling.' At the bottom, in fresh ink: 'I remember the voice that's singing now. It was the last thing I heard before I died.'" } });
defineZone('hush', {
  size: 300, seed: 9303, name: 'The Hushmoor', bossName: 'Overseer Grisk', land: (x, z, N) => 1.2 + N.fbm(x * .009, z * .009, 4) * 6 + (N.fbm(x * .05, z * .05, 2) - .5) * 1.4, hiH: 6.5,
  pal: { a: '#3a4a3a', b: '#4a5a42', hi: '#5a5a4a', road: '#5a4e40', cob: '#6a6458', low: '#2a3a34' },
  towns: [{ key: 'lanternrest', name: 'Lanternrest', x: 110, z: 130, R: 24, wall: 'palisade', gates: [Math.PI * 1.5, Math.PI], roof: '#3a4a4a', guardName: 'Lanternrest Watch', guardKind: 'bulwark1_sallow',
    houses: [[-10, 8, .4, 'hut', 5, 5], [10, 10, -.4, 'hut', 5, 5], [-12, -8, .2, { wall: '#7a7468', roof: '#3a4a4a' }], [12, -10, 2.2, 'hall', 9, 5]],
    props: [[0, 4, 'bluelamp'], [-4, 10, 'bluelamp'], [6, -4, 'bluelamp'], [-8, -2, 'bluelamp'], [4, 12, 'bluelamp'], [-14, 2, 'bluelamp'], [14, 0, 'bluelamp']],
    npcs: [['giver', 'wend', 0, 0], ['giver', 'noll', -6, 5], ['giver', 'bask', 10, -4], ['giver', 'nameless', 6, 6], ['vendor', 'lanternrest', -4, -6], ['bind', null, 2, -3]],
    guards: [[-2, -22], [2, -22], [-22, 2], [-22, -2]] }],
  roads: [[110, 106, 40, -40], [40, -40, 20, -286], [86, 130, -60, 120], [-60, 120, -160, 0], [-160, 0, -150, -150]],
  regions: { names: ['The Lantern Fen', 'The Causeway', 'The Drowned Reeds', 'The Thrall-Pits'], fn: (x, z) => z > 40 ? (x > 0 ? 0 : 1) : x > 0 ? 2 : 3 },
  open: [{ key: 'thrallpits', name: 'The Thrall-Pits', x: -150, z: -170, R: 30, deco: 'bones', decoN: 30, ring: true, gap: Math.PI / 2, centre: 'stonecircle', lvl: [4, 5], area: 3,
    packs: [[-16, 0, ['fenghoul', 'lostone']], [16, 0, ['fenghoul', 'fenghoul', 'choircaller']], [0, -16, ['lostone', 'lostone']], [0, 16, ['fenghoul', 'choircaller', 'lostone']]],
    bosses: [[-20, -16, 'pitwarden', 4], [20, -18, 'choirmotheragent', 5], [0, -4, 'overseer', 5, true]] }],
  landmarks: [{ g: 'bluelamp', x: -80, z: 60, name: 'The Causeway Lamps', R: 14, clear: 8, s: 1.4 }, { g: 'statue', x: 150, z: -60, name: 'The Drowned Bell', R: 14, clear: 10 }],
  lines: [{ x: 20, z: -286, to: 'vale', label: 'North to the Vale', ry: 0 }],
  spots: { lampfen: { x: 160, z: 100 }, causeway: { x: -80, z: 60 }, reeds: { x: 150, z: -70 }, drownedbell: { x: 150, z: -60 }, finders: { x: -150, z: 120 }, thrallpits: { x: -150, z: -170 }, callers: { x: 120, z: -150 } },
  scatter: [[24, [0, 270, 40, 270], ['bogwight', 'marshfly', 'mirecrawler', 'bogwight'], [1, 2], 0], [24, [-270, 0, 40, 270], ['mirecrawler', 'marshfly', 'fenghoul', 'bogwight'], [2, 3], 1],
    [26, [0, 270, -270, 40], ['fenghoul', 'lostone', 'choircaller', 'mirecrawler'], [3, 4], 2], [22, [-270, 0, -270, 40], ['fenghoul', 'lostone', 'bogwight', 'choircaller'], [4, 5], 3]],
  camps: [[4, [-270, -20, 60, 270], ['witchfinder', 'finderbow', 'witchfinder'], [2, 4], 1, 'wf'], [3, [20, 270, -260, -20], ['choircaller', 'lostone', 'choircaller'], [3, 4], 2, 'cc']],
  rares: [[[0, 260, -260, 0], 'oldbogmother', 3, true], [[-170, -130, 100, 140], 'captainvane', 3, false]],
  hunt: [{ area: 0, lvl: [1, 2] }, { area: 1, lvl: [2, 3] }, { area: 2, lvl: [3, 4] }, { area: 3, lvl: [4, 5] }],
  labels: [{ t: 'Bogwights, biters (1-2)', x: 150, z: 200 }, { t: 'Witchfinders (2-3)', x: -150, z: 150 }, { t: 'The Lost, the Choir (3-4)', x: 140, z: -120 }, { t: 'The Thrall-Pits (4-5)', x: -120, z: -110 }],
  nodes: [['meadowsweet', 'herb', 'herbmeadow', 1, null, 20], ['graveroot', 'herb', 'herbgrave', 40, null, 8]],
  scenery: { density: 24000, tuft: '#5a6a4a', kinds: [['dead', .02, 1, 1.8], ['pine', .006, .9, 1.4], ['bones', .004, .8, 1.2]] },
  sky: { fog: '#4a5a5a', top: '#3a4a5a', mid: '#5a6a6a', hor: '#7a8a7a', k: .55, far: 190 },
});
const HZ = { zone: 'hush' };
QUESTS.push(
  { id: 'hs1', story: true, giver: 'wend', lvl: 1, name: 'The Lamps of Lanternrest', where: 'lampfen', ...HZ, obj: { kill: ['bogwight'], n: 6, near: 'lampfen', nearR: 150, what: 'Drive off 6 bogwights from the Lantern Fen' },
    say: ["You're awake. Good. It's a strange feeling, isn't it? Like coming up from very deep water. It passes, mostly.", "The bogwights have been snuffing out the lamps on the fen paths, and a Sallow lost in the fen at night doesn't always come home. Six of them, friend. Think of it as your first good deed."],
    done: ["The lamps are burning again. You did well. Go and see Mother Noll; she likes to look over the newly woken."] },
  { id: 'hs2', story: true, giver: 'noll', lvl: 1, pre: 'hs1', name: 'Those Who Walk Away', where: 'causeway', ...HZ, obj: { at: 'causeway', r: 14, what: 'Follow the footprints out to the Causeway Lamps' },
    say: ["Last night three more of us walked out of their beds and into the fen. Barefoot, in the dark, with their eyes closed. Their footprints go west, along the old causeway.", "Follow them, love. Don't follow them too far."],
    done: ["They went past the lamps and kept going, toward the old camp. Toward the Thrall-Pits. Oh, love. That's where we were kept."] },
  { id: 'hs3', story: true, giver: 'noll', turnTo: 'wend', lvl: 2, pre: 'hs2', name: 'The Lost', where: 'reeds', ...HZ, obj: { kill: ['lostone'], n: 6, near: 'reeds', nearR: 180, what: 'Put 6 of the Lost to rest, and tell the Lamp-Keeper' },
    say: ["The ones who walk away don't come back as themselves. Their eyes go dark and they attack anyone who tries to bring them home. We call them the Lost.", "If you find them, friend, set them free. Six of them. It's a kindness. I have to believe it's a kindness."],
    done: [['wend', "Six lamps go dark tonight. I'll paint 'Lost' on them, under 'Unknown'. That's two names more than most of them had."]] },
  { id: 'hs4', story: true, giver: 'wend', lvl: 2, pre: 'hs3', name: 'A Choir in the Reeds', where: 'callers', ...HZ, obj: { kill: ['choircaller'], n: 6, near: 'callers', nearR: 180, what: 'Silence 6 Pale Choir callers in the Drowned Reeds' },
    say: ["The Lost aren't going alone. There are humans in the reeds, in pale robes, singing. The same song we hear in our sleep.", "Silence them, friend. Six of them. If the singing stops, maybe the walking stops."],
    done: ["It's quieter. Not silent. Something further away is still singing, and they were only the echo."] },
  { id: 'hs5', story: true, giver: 'bask', lvl: 3, pre: 'hs4', name: 'The Witchfinders', where: 'finders', ...HZ, obj: { kill: ['witchfinder', 'finderbow'], n: 8, near: 'finders', nearR: 170, what: 'Drive off 8 witchfinders camped west of Lanternrest' },
    say: ["As if the Choir wasn't enough, the kingdoms have sent witchfinders. They've heard the Sallow are walking at night, and they've decided it means we're dangerous.", "Eight of them, soldier. Not to kill, if they run. To make them run."],
    done: ["They ran. Most of them. Their captain didn't, and she's the one who matters."] },
  { id: 'hs6', story: true, giver: 'bask', lvl: 3, pre: 'hs5', name: 'Witchfinder-Captain Vane', where: 'finders', ...HZ, obj: { named: 'captainvane', n: 1, what: 'Defeat Witchfinder-Captain Orla Vane' },
    say: ["Captain Orla Vane. She's burned four of us on the causeway this year and called it law. The Fourfold Law says the dead stay dead, and she's decided we count.", "We're not the dead, soldier. We're what's left over. Go and teach her the difference."],
    done: ["She's beaten, and her orders were on her: 'The Sallow are being called back by their old masters. Burn them before they answer.' She wasn't entirely wrong. That's the worst part."] },
  { id: 'hs7', story: true, giver: 'nameless', lvl: 4, pre: 'hs6', name: 'The Thrall-Pits', where: 'thrallpits', ...HZ, obj: { at: 'thrallpits', r: 28, what: 'Go to the Thrall-Pits in the south-west' },
    say: ["Every Sallow was once kept in the Thrall-Pits: the old camp where the necromancers stored their servants between battles. The Lost are walking there. Something is waiting for them.", "Go and look, friend. Write down what you see. I'll put it in the Book."],
    done: ["The overseer. You saw the overseer. I don't remember my name, but I remember him. Every Sallow does."] },
  { id: 'hs8', story: true, giver: 'nameless', lvl: 5, pre: 'hs7', name: 'Overseer Grisk', where: 'thrallpits', ...HZ, obj: { named: 'overseer', n: 1, what: 'Defeat Overseer Grisk in the Thrall-Pits' },
    say: ["Overseer Grisk kept the pits for the necromancers. He died in the war, and now something has given him his job back, and he's calling his thralls home.", "Take friends, friend. Take everyone. And when he's done, the Lost will stop walking. I hope."],
    done: ["The singing's stopped. For us, anyway. On Grisk's body there was a letter, in a woman's hand: 'The Choir-Mother of the Vale sends her blessing. The Lord of Graves will need every servant he ever had.'"] },
  { id: 'hs9', story: true, giver: 'nameless', turnTo: 'sister', lvl: 5, pre: 'hs8', name: 'North to the Vale', ...HZ, obj: { talk: true, what: 'Take the overseer\'s letter north to the Vale, to Sister Maren in {town}' },
    say: ["The letter names a Choir-Mother in the Vale. The Vale's sister, Maren, is said to be the only human there who doesn't spit at the Sallow. Take it to her.", "Go north, friend. They'll stare, and some of them will reach for torches. Go anyway. Whatever is calling the dead is calling theirs too."],
    done: [['sister', "A Sallow. In my chapel. Sit down before somebody sees you and fetches a torch; I'll deal with them if they do."], ['sister', "A Choir-Mother, and the Lord of Graves calling his servants home. My graves are emptying, and your people are walking into the fen. It's the same hand on both. Let's find out whose."]] },
  { id: 'hss1', giver: 'noll', lvl: 2, name: 'Lamp Oil', where: 'lampfen', ...HZ, obj: { collect: ['mirecrawler'], item: 'Mirecrawler Oil-Sac', chance: .55, n: 6, what: 'Gather 6 mirecrawler oil-sacs' }, say: ["The lamps burn mirecrawler oil. It smells awful and it never goes out. Six sacs, love. Squeeze gently."], done: ["Wonderful. Wend will be so pleased he'll almost smile."] },
  { id: 'hss2', giver: 'bask', lvl: 2, pre: 'hs1', name: 'Biters', where: 'lampfen', ...HZ, obj: { kill: ['marshfly'], n: 8, what: 'Swat 8 marsh biters' }, say: ["Marsh biters. They don't bite the Sallow; we're not warm enough. They bite our visitors, and our visitors complain. Eight of them, soldier."], done: ["Fewer complaints. Good."] },
  { id: 'hss3', giver: 'wend', lvl: 3, name: 'The Old Bog-Mother', where: 'reeds', ...HZ, obj: { named: 'oldbogmother', n: 1, what: 'Lay the Old Bog-Mother to rest (she only walks at night)' }, say: ["At night, out in the Drowned Reeds, there's a ghost who blows out every lamp she passes. The Old Bog-Mother. She was the first thrall of the Hushmoor, they say, and she hates the light.", "Find her after dark, friend, and give her some peace."], done: ["The lamps are burning all the way to the reeds tonight. Thank you."] },
  { id: 'hss4', giver: 'nameless', lvl: 3, name: 'The Drowned Bell', where: 'drownedbell', ...HZ, obj: { at: 'drownedbell', r: 12, what: 'Find the Drowned Bell in the reeds' }, say: ["There's a bell in the reeds, half sunk, that the necromancers rang to call the thralls to work. Some of us remember the sound. Go and find it. Then I'd like you to tell me what you felt."], done: ["Nothing? Good. That means you're free."] },
  { id: 'hss5', giver: 'noll', lvl: 4, pre: 'hss1', name: 'Fen Ghouls', where: 'callers', ...HZ, obj: { kill: ['fenghoul'], n: 8, what: 'Put down 8 fen ghouls' }, say: ["The fen ghouls aren't Sallow. They never woke up. They're just hunger in the shape of a person. Eight of them, love, before they find the road."], done: ["Thank you. They were somebody once, too. Everybody was."] },
);
// every racial start ends by joining the Vale's story where the Vale's own start ends
X.preAlt = X.preAlt || {}; X.preAlt.m9 = ['rv9', 'kg9', 'hs9'];
for (const q of QUESTS) if (['weald', 'kiln', 'hush'].includes(q.zone) && q.xp == null) { q.xp = qx(q.lvl, q.story ? (q.obj.named ? .75 : .52) : q.obj.named ? .65 : .45); q.gold = qg(q.lvl); q.text = q.say[0]; }
X.VEND = Object.assign(X.VEND || {}, { hornstead: ['Rook the Trader', 'bard1_varr'], cinderhall: ['Flint the Trader', 'monk2_grael'], lanternrest: ['Ferry-Woman Sill', 'cleric2_sallow'] });

// ---------- the opening of each story ----------
Object.assign(SCENES, {
  intro_varr: [
    { spot: 'hornstead', from: [40, 30, 50], look: [0, 4, 0], who: null, text: 'A hundred years ago, the druids bred beasts for war: wolves that could hold a spear, stags that could carry a soldier. When the war ended, the druids went home.' },
    { spot: 'hornstead', from: [-30, 18, -24], look: [0, 3, 0], who: null, text: 'The beasts stayed. They learned to speak, and to build, and to bury their dead. They call themselves the Varr: the unleashed.' },
    { spot: 'beastgraves', from: [20, 10, 20], look: [0, 1, 0], who: null, text: 'And this spring, in the Ironbark Weald, the graves of their war-beasts have started to empty.' }],
  intro_grael: [
    { spot: 'cinderhall', from: [40, 30, 50], look: [0, 4, 0], who: null, text: 'A hundred years ago, the elementalists built golems for war, and gave each one a heart of living fire. When the war ended, they left the golems in the Kilnlands to cool.' },
    { spot: 'sleepers', from: [30, 14, 24], look: [0, 2, 0], who: null, text: 'A golem\'s body cools in a year. A heart takes a century. When the hearts finally cooled, they cracked their stone open and started to think. They call themselves the Grael.' },
    { spot: 'cinderhall', from: [-26, 12, 20], look: [0, 3, 0], who: null, text: 'And this year, in the Golem Field, the sleepers have started to stand up wrong.' }],
  intro_sallow: [
    { spot: 'lanternrest', from: [40, 26, 50], look: [0, 4, 0], who: null, text: 'A hundred years ago, the necromancers raised the dead as servants for their war. When the Fourfold Law ended the necromancy, the servants should have fallen.' },
    { spot: 'lanternrest', from: [-30, 14, -24], look: [0, 3, 0], who: null, text: 'They didn\'t. One by one, they woke up with their own minds, and no memory of who they had been. They call themselves the Sallow. Most of the kingdoms call them abominations.' },
    { spot: 'causeway', from: [20, 10, 20], look: [0, 1, 0], who: null, text: 'And this month, in the Hushmoor, a voice has started singing in the night, calling the Sallow back to their graves.' }],
});
