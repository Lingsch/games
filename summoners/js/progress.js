// Run-long progression: skill trees, gear, relics. All of it folds into one table of modifiers, S.mods.
import { S } from './core.js';

// ---------- skill trees: four branches of five nodes per summoner, taken in order ----------
// effect keys: dmg:<kind> hp:<kind> life:<kind> spd:<kind> rot:<kind> siege:<kind> (summons, as +fractions)
//   n:<spell> (+count)  sp:<spell> (damage)  rad:<spell>  dur:<spell>  heal:<spell>  cost:<spell>
//   hp mana regen cap melee heroRegen (hero)   flag:<name> (special behaviour)
const N = (id, name, desc, fx) => ({ id, name, desc, fx });
export const TREES = {
  elem: [
    { name: 'Fire', col: '#ff6a2b', nodes: [N('ef1', 'Hotter Spirits', 'Fire Spirits deal 25% more damage', { 'dmg:0': .25 }), N('ef2', 'Wildfire', 'Fireball hits 30% harder and 25% wider', { 'sp:fireball': .3, 'rad:fireball': .25 }),
      N('ef3', 'Kindling', 'Fire Spirits: one more per cast', { 'n:imps': 1 }), N('ef4', 'Long Fury', 'Kindle lasts 50% longer', { 'dur:kindle': .5 }), N('ef5', 'Pyre', 'Fire Spirits explode when they die or burn out', { 'flag:pyre': 1 })] },
    { name: 'Water', col: '#4fb0e8', nodes: [N('ew1', 'Deep Springs', 'Undines heal 40% more', { 'heal:undine': .4 }), N('ew2', 'Hard Frost', 'Frost Nova reaches 30% wider', { 'rad:nova': .3 }),
      N('ew3', 'Monsoon', 'Mending Rain heals 50% more', { 'heal:rain': .5 }), N('ew4', 'Still Waters', '+1 mana per second', { regen: 1 }), N('ew5', 'Tidecaller', 'Undines slow whatever they strike', { 'flag:tide': 1 })] },
    { name: 'Earth', col: '#d9a441', nodes: [N('ee1', 'Granite', 'Stone Golems have 30% more health', { 'hp:2': .3 }), N('ee2', 'Siege Stone', 'Stone Golems break walls 40% faster', { 'siege:2': .4 }),
      N('ee3', 'Bedrock', 'Stoneskin lasts 4 seconds longer', { 'dur:stoneskin': .35 }), N('ee4', 'Fault Line', 'Earthquake reaches 25% wider', { 'rad:quake': .25 }), N('ee5', "Mountain's Heart", 'Stone Golems no longer crumble with time', { 'flag:mountain': 1 })] },
    { name: 'Air', col: '#a58cff', nodes: [N('ea1', 'Gale', 'Storm Sprites: two more per cast', { 'n:sprites': 2 }), N('ea2', 'Arc', 'Chain Lightning jumps to 4 more foes', { 'n:chain': 4 }),
      N('ea3', 'Jet Stream', 'Tailwind lasts 40% longer', { 'dur:tailwind': .4 }), N('ea4', 'Static', 'Storm Sprites deal 30% more damage', { 'dmg:3': .3 }), N('ea5', 'Eye of the Storm', 'Every fourth spell you cast is free', { 'flag:eye': 1 })] }],
  druid: [
    { name: 'Pack', col: '#c9a46e', nodes: [N('dp1', 'Thick Pelts', 'Wolves have 25% more health', { 'hp:7': .25 }), N('dp2', 'Big Litter', 'Call Wolves: one more wolf', { 'n:wolves': 1 }),
      N('dp3', 'Fangs', 'Wolves deal 20% more damage', { 'dmg:7': .2 }), N('dp4', 'Easy Call', 'Call Wolves costs 25% less', { 'cost:wolves': .25 }), N('dp5', 'Alpha', 'Wolves heal themselves with every bite', { 'flag:alpha': 1 })] },
    { name: 'Grove', col: '#6aa844', nodes: [N('dg1', 'Old Growth', 'Treants have 30% more health', { 'hp:9': .3 }), N('dg2', 'Lush', 'Wild Growth heals 50% more', { 'heal:wildgrowth': .5 }),
      N('dg3', 'Bramble', 'Thorn Burst hits 30% harder and wider', { 'sp:thorns': .3, 'rad:thorns': .3 }), N('dg4', 'Taproot', 'Treants break walls 40% faster', { 'siege:9': .4 }), N('dg5', 'Heartwood', 'Treants root what they strike', { 'flag:heartwood': 1 })] },
    { name: 'Claw', col: '#e0a33a', nodes: [N('dc1', 'Sharp Claws', 'Your own strikes deal 40% more', { melee: .4 }), N('dc2', 'Thick Hide', '+30 maximum health', { hp: 30 }),
      N('dc3', 'Mauling', 'Your strikes also hit foes beside the target', { 'flag:splash': 1 }), N('dc4', 'Bark Skin', 'Barkskin also halves damage to you', { 'flag:barkhero': 1 }), N('dc5', 'Shapeshifter', 'Your strikes heal you', { 'flag:shape': 1 })] },
    { name: 'Swarm', col: '#f0c020', nodes: [N('ds1', 'Nest', 'Hornet Swarm: three more hornets', { 'n:hornets': 3 }), N('ds2', 'Long Summer', 'Hornets last 50% longer', { 'life:10': .5 }),
      N('ds3', 'Stampede Lord', 'Stampede hits 40% harder', { 'sp:stampede': .4 }), N('ds4', 'Venom', 'Hornets deal 30% more damage', { 'dmg:10': .3 }), N('ds5', 'Plague of Wings', 'Hornets slow what they sting', { 'flag:wings': 1 })] }],
  necro: [
    { name: 'Bone', col: '#ebdfc2', nodes: [N('nb1', 'Dense Bone', 'Skeletons have 30% more health', { 'hp:11': .3 }), N('nb2', 'Embalming', 'Skeletons rot 50% slower', { 'rot:11': .5 }),
      N('nb3', 'Long Reach', 'The fallen rise from 10 units farther away', { raise: 10 }), N('nb4', 'Ossuary', 'Raise Skeletons: two more per cast', { 'n:raise': 2 }), N('nb5', 'Legion', 'One in four of the risen comes back as a ghoul', { 'flag:legion': 1 })] },
    { name: 'Flesh', col: '#a8949a', nodes: [N('nf1', 'Bloat', 'Abominations have 30% more health', { 'hp:13': .3 }), N('nf2', 'Ravenous', 'Ghouls are 20% faster and hit 20% harder', { 'spd:12': .2, 'dmg:12': .2 }),
      N('nf3', 'Battering Meat', 'Abominations break walls 50% faster', { 'siege:13': .5 }), N('nf4', 'Volatile', 'Corpse Explosion hits 40% harder', { 'sp:corpse': .4 }), N('nf5', 'Feast', 'Ghouls heal with every bite', { 'flag:feast': 1 })] },
    { name: 'Spirit', col: '#7fffd4', nodes: [N('ns1', 'Host', 'Wraiths: two more per cast', { 'n:wraiths': 2 }), N('ns2', 'Lingering', 'Wraiths last 50% longer', { 'life:14': .5 }),
      N('ns3', 'Hunger', 'Death Pulse heals you 50% more', { 'heal:pulse': .5 }), N('ns4', 'Wide Grave', 'Death Pulse reaches 30% wider', { 'rad:pulse': .3 }), N('ns5', 'Haunt', 'Wraiths chill and slow what they touch', { 'flag:haunt': 1 })] },
    { name: 'Command', col: '#9be36b', nodes: [N('nc1', 'Taskmaster', 'Unholy Frenzy lasts 40% longer', { 'dur:frenzy': .4 }), N('nc2', 'Ribcage', 'Bone Armor lasts 40% longer', { 'dur:bonearmor': .4 }),
      N('nc3', 'Grave Hunger', '+1 mana per second', { regen: 1 }), N('nc4', 'Great Host', '+15 horde cap', { cap: 15 }), N('nc5', 'Lord of the Dead', 'All your undead deal 25% more damage', { 'dmg:all': .25 })] }]};
export const allNodes = cls => (TREES[cls] || []).flatMap(b => b.nodes);
export function canTake(cls, id) {
  for (const b of TREES[cls]) { const k = b.nodes.findIndex(n => n.id === id); if (k >= 0) return !S.skills.includes(id) && (k === 0 || S.skills.includes(b.nodes[k - 1].id)) && S.skillPts > 0; }
  return false;
}
export function takeSkill(id) { if (!canTake(S.cls, id)) return false; S.skills.push(id); S.skillPts--; return true; }

// ---------- relics: rare, run-changing ----------
export const RELICS = [
  { id: 'emberheart', name: 'Ember Heart', desc: 'Your creatures burst into flame when they fall.', lore: 'Still warm. It has been warm for three hundred years.', fx: { 'flag:burst': 1 } },
  { id: 'hourglass', name: 'Hourglass of Ash', desc: 'Your buffs last 50% longer.', lore: 'The sand falls upward when no one is looking.', fx: { 'dur:all': .5 } },
  { id: 'miser', name: "Miser's Coin", desc: '+50% gold from every source.', lore: 'Whoever held it last starved on a pile of gold.', fx: { gold: .5 } },
  { id: 'flute', name: 'Bone Flute', desc: '+20 horde cap.', lore: 'It plays only one note, and everything dead hears it.', fx: { cap: 20 } },
  { id: 'thorncrown', name: 'Crown of Thorns', desc: 'Foes who strike you take 4 damage back.', lore: 'Worn by a king who would not be touched.', fx: { thorns: 4 } },
  { id: 'sapling', name: 'Sapling Ring', desc: 'You regain 2 health per second.', lore: 'A green shoot grows from the band. It will not be cut.', fx: { heroRegen: 2 } },
  { id: 'stormglass', name: 'Stormglass', desc: 'Attack spells cost 20% less mana.', lore: 'A storm in a bottle, sulking.', fx: { 'cost:attack': .2 } },
  { id: 'banner', name: "Warlord's Banner", desc: 'Your creatures deal 15% more damage.', lore: 'The cloth is rot. The pole is a femur. It still rallies.', fx: { 'dmg:all': .15 } },
  { id: 'lantern', name: 'Soul Lantern', desc: 'Every kill restores 1 mana.', lore: 'The flame inside is someone. It would like out.', fx: { manaKill: 1 } },
  { id: 'hammer', name: "Mason's Hammer", desc: 'Walls and gates fall 50% faster.', lore: 'It built a city once. It remembers how to unbuild one.', fx: { 'siege:all': .5 } },
  { id: 'twinmoons', name: 'Twin Moons', desc: 'Summoning spells call one extra creature.', lore: 'Two pale coins on a black cloth. Everything comes in pairs now.', fx: { 'n:all': 1 } },
  { id: 'lastbreath', name: 'Last Breath', desc: 'Once per run, survive a killing blow and heal to half.', lore: 'A held breath, kept in a jar for just such a day.', fx: { 'flag:lastbreath': 1 } }];

// ---------- gear: five slots, random stats, a line of lore ----------
// ---------- gear ----------
// Eight places to wear things. Rings fit either ring slot.
export const SLOTS = ['staff', 'hood', 'robe', 'gloves', 'boots', 'amulet', 'ring', 'ring2'];
export const SLOT_NAME = { staff: 'Staff', hood: 'Hood', robe: 'Robe', gloves: 'Gloves', boots: 'Boots', amulet: 'Amulet', ring: 'Ring', ring2: 'Ring' };
const ITEM_SLOTS = ['staff', 'hood', 'robe', 'gloves', 'boots', 'amulet', 'ring'];
export const RARITY = [{ name: 'Common', col: '#cfc8b4', stats: 1, mul: 1 }, { name: 'Rare', col: '#4fb0e8', stats: 2, mul: 1.25 }, { name: 'Epic', col: '#b98cff', stats: 3, mul: 1.6 },
  { name: 'Legendary', col: '#ff9a2e', stats: 2, mul: 1.8 }, { name: 'Set', col: '#5fd36a', stats: 2, mul: 1.4 }];
const STAT_POOL = {
  staff: [['dmg:all', .06, '% creature damage', 100], ['sp:all', .08, '% spell damage', 100], ['melee', .1, '% strike damage', 100], ['regen', .6, ' mana per second', 1]],
  robe: [['hp', 14, ' health', 1], ['hp:all', .06, '% creature health', 100], ['mana', 12, ' maximum mana', 1], ['heroRegen', .5, ' health per second', 1]],
  hood: [['regen', .6, ' mana per second', 1], ['mana', 14, ' maximum mana', 1], ['cost:all', .04, '% cheaper spells', 100], ['cap', 4, ' horde cap', 1]],
  gloves: [['sp:all', .07, '% spell damage', 100], ['melee', .12, '% strike damage', 100], ['haste:all', .06, '% creature attack speed', 100], ['dmg:all', .05, '% creature damage', 100]],
  boots: [['heroSpd', .06, '% move speed', 100], ['spd:all', .06, '% creature speed', 100], ['hp', 12, ' health', 1], ['heroRegen', .5, ' health per second', 1]],
  amulet: [['cap', 5, ' horde cap', 1], ['dmg:all', .05, '% creature damage', 100], ['n:all', 1, ' creature per summon', 1], ['gold', .15, '% gold', 100]],
  ring: [['regen', .5, ' mana per second', 1], ['hp', 12, ' health', 1], ['dur:all', .12, '% longer buffs', 100], ['heroRegen', .5, ' health per second', 1]]};
const ALL_STATS = Object.values(STAT_POOL).flat();
const NAMES = {
  staff: ['Staff', 'Rod', 'Crook', 'Stave'], robe: ['Robe', 'Vestment', 'Mantle', 'Shroud'], hood: ['Hood', 'Cowl', 'Circlet', 'Veil'], gloves: ['Gloves', 'Grips', 'Gauntlets', 'Wraps'],
  boots: ['Boots', 'Treads', 'Sandals', 'Greaves'], amulet: ['Amulet', 'Charm', 'Locket', 'Talisman'], ring: ['Ring', 'Band', 'Signet', 'Loop']};
const ADJ = ['Ashen', 'Hollow', 'Pilgrim\'s', 'Drowned', 'Thorned', 'Gravewarden\'s', 'Cinder', 'Weeping', 'Old King\'s', 'Moth-eaten', 'Bright', 'Unquiet'];
const LORE = ['It belonged to someone who did not need it at the end.', 'Taken from a lord who swore it brought him luck.', 'The previous owner is still looking for it. Gently.',
  'Smells of rain and old smoke.', 'Whatever was written on it has been scratched out with care.', 'Warm when danger is near. It is often warm.',
  'Carried across three wars and lost in none of them.', 'A gift, once. The giver is ash.'];

// Named legendary items: each has a power that changes how you play. Some belong to one summoner.
export const UNIQUES = [
  { id: 'hourglass', slot: 'amulet', name: 'Hourglass of the Last Hour', fx: { 'dur:all': .6 }, power: 'All your buffs last 60% longer', lore: 'The sand only ever runs out for other people.' },
  { id: 'sevenleague', slot: 'boots', name: 'Sevenleague Boots', fx: { heroSpd: .4 }, power: 'You move 40% faster', lore: 'The cobbler was never paid. He is still walking after them.' },
  { id: 'banners', slot: 'hood', name: 'Crown of a Hundred Banners', fx: { cap: 25 }, power: '+25 horde cap', lore: 'Every banner on it was taken from someone who outnumbered its owner.' },
  { id: 'endlesswell', slot: 'ring', name: 'Ring of the Endless Well', fx: { regen: 4, 'cost:all': .15 }, power: '+4 mana per second and spells cost 15% less', lore: 'Drop it in a dry well and the well remembers.' },
  { id: 'thornmantle', slot: 'robe', name: 'Mantle of Thorns', fx: { thorns: 12, hp: 40 }, power: 'Anything that hits you takes 12 damage back, and +40 health', lore: 'Comfortable, if you are already bleeding.' },
  { id: 'mountainheart', slot: 'amulet', name: 'Heart of the Mountain', fx: { 'armor:all': .25 }, power: 'All your creatures take 25% less damage', lore: 'It still beats, very slowly, once a year.' },
  { id: 'warhorn', slot: 'gloves', name: 'Grips of the Warhorn', fx: { 'haste:all': .35 }, power: 'All your creatures attack 35% faster', lore: 'Clap them together and somewhere a drum answers.' },
  { id: 'misers', slot: 'gloves', name: 'The Miser\'s Grip', fx: { gold: .8 }, power: '+80% gold from everything', lore: 'They do not open easily. Neither did he.' },
  { id: 'choir', cls: 'elem', slot: 'staff', name: 'Staff of the Burning Choir', fx: { 'echo:fireball': 2 }, power: 'Fireball casts itself twice more, for free', lore: 'Three voices sing in it. Only one of them is yours.' },
  { id: 'golemheart', cls: 'elem', slot: 'amulet', name: 'Golemheart', fx: { 'scale:2': .7, 'hp:2': 2, 'dmg:2': 1, 'armor:2': .3, 'aura:2': 1 }, power: 'Your Stone Golems are Giants: bigger, triple health, double damage, tougher', lore: 'The mountain gave it up only because you asked politely, and loudly.' },
  { id: 'stormhood', cls: 'elem', slot: 'hood', name: 'Stormcaller\'s Hood', fx: { 'spd:3': 1.2, 'haste:3': 1, 'trail:3': 1, 'aura:3': 5 }, power: 'Your Storm Sprites become Quicksilver: more than twice as fast, attacking twice as fast', lore: 'Your hair will never lie flat again.' },
  { id: 'firstwolf', cls: 'druid', slot: 'amulet', name: 'Fang of the First Wolf', fx: { 'rebirth:7': 1, 'aura:7': 6 }, power: 'Your Dire Wolves are Undying: each rises again once', lore: 'The first wolf never died. It just got bored.' },
  { id: 'thornmother', cls: 'druid', slot: 'staff', name: 'Thornmother\'s Staff', fx: { 'barrage:thorns': 4 }, power: 'Thorn Burst also erupts in four more places around your aim', lore: 'Grows a little every time you water it with someone else.' },
  { id: 'greatbear', cls: 'druid', slot: 'robe', name: 'Pelt of the Great Bear', fx: { 'od:shape': 1, hp: 30 }, power: 'Wild Shape becomes Dire form: 4× claw damage, you take a quarter of the damage', lore: 'It was not taken. It was given, with a warning.' },
  { id: 'legions', cls: 'necro', slot: 'hood', name: 'Crown of Legions', fx: { 'n:raise': 4 }, power: 'Raise Skeletons brings 4 more', lore: 'Heavy. The dead insist on it anyway.' },
  { id: 'gravewalker', cls: 'necro', slot: 'ring', name: 'Gravewalker\'s Ring', fx: { 'split:11': 1, 'hp:11': .3 }, power: 'Your Skeletons split in two when they die', lore: 'Whoever wears it is never buried alone.' },
  { id: 'palechoir', cls: 'necro', slot: 'staff', name: 'Staff of the Pale Choir', fx: { 'fan:bonespear': 1, 'sp:bonespear': .3 }, power: 'Bone Spear fires three at once and hits 30% harder', lore: 'Each hollow in the wood was once someone\'s voice.' }];

// Sets: wear more pieces for bigger bonuses
export const SETS = [
  { id: 'gravelord', name: 'Gravelord\'s Raiment', slots: ['hood', 'robe', 'gloves', 'boots'], bonus: [null, null, [{ 'hp:all': .2 }, '+20% creature health'], [{ 'n:all': 1 }, '+1 creature per summon'], [{ 'boom:all': 8 }, 'All your creatures explode when they die']] },
  { id: 'stormweaver', name: 'Stormweaver\'s Regalia', slots: ['staff', 'hood', 'amulet', 'ring'], bonus: [null, null, [{ 'sp:all': .2 }, '+20% spell damage'], [{ 'cost:all': .15 }, 'Spells cost 15% less'], [{ 'echo:all': 1 }, 'Every attack spell casts itself once more']] },
  { id: 'warden', name: 'Warden\'s Bulwark', slots: ['robe', 'gloves', 'boots', 'amulet'], bonus: [null, null, [{ hp: 50 }, '+50 health'], [{ heroRegen: 3 }, '+3 health per second'], [{ 'armor:all': .3 }, 'All your creatures take 30% less damage']] },
  { id: 'mammon', name: 'Mammon\'s Hoard', slots: ['ring', 'amulet', 'gloves', 'boots'], bonus: [null, null, [{ gold: .3 }, '+30% gold'], [{ cap: 15 }, '+15 horde cap'], [{ 'n:all': 2 }, '+2 creatures per summon']] }];

let uid = 1;
const newUid = () => Date.now() % 1e7 * 10 + uid++;
const rollStats = (slot, n, mul, tier, rnd) => [...STAT_POOL[slot]].sort(() => rnd() - .5).slice(0, n)
  .map(([k, v]) => [k, +(v * mul * (1 + (tier - 1) * .35) * (.8 + rnd() * .4)).toFixed(k === 'n:all' ? 0 : 3) || 1]);
// a rough measure of how good an item is, for auto-equip and auto-sell
export function itemScore(it) {
  let s = 0; for (const [k, v] of it.stats) { const p = ALL_STATS.find(q => q[0] === k); s += p ? v / p[1] : 1; }
  return s + (it.unique ? 8 : 0) + (it.set ? 2 : 0);
}
export function makeUnique(cls, tier = 2, rnd = Math.random, id) {
  const pool = UNIQUES.filter(u => !u.cls || u.cls === cls), u = id ? UNIQUES.find(u => u.id === id) : pool[(rnd() * pool.length) | 0];
  return { uid: newUid(), slot: u.slot, r: 3, tier, unique: u.id, name: u.name, stats: rollStats(u.slot, 2, RARITY[3].mul, tier, rnd), power: u.power, lore: u.lore };
}
export function makeSetPiece(tier = 2, rnd = Math.random) {
  const set = SETS[(rnd() * SETS.length) | 0], slot = set.slots[(rnd() * 4) | 0];
  return { uid: newUid(), slot, r: 4, tier, set: set.id, name: `${set.name.split(' ')[0]} ${NAMES[slot][0]}`, stats: rollStats(slot, 2, RARITY[4].mul, tier, rnd), lore: 'Part of a set. It looks lonely on its own.' };
}
export function makeItem(tier = 1, minRarity = 0, rnd = Math.random, cls) {
  const x = rnd();
  if (cls && x < .02 + tier * .008) return makeUnique(cls, tier, rnd);
  if (x < .1 + tier * .01 && x >= .02 + tier * .008) return makeSetPiece(tier, rnd);
  const slot = ITEM_SLOTS[(rnd() * ITEM_SLOTS.length) | 0], r = Math.min(2, Math.max(minRarity, rnd() < .1 + tier * .05 ? 2 : rnd() < .35 + tier * .08 ? 1 : 0)), R = RARITY[r];
  return { uid: newUid(), slot, r, tier, name: `${ADJ[(rnd() * ADJ.length) | 0]} ${NAMES[slot][(rnd() * 4) | 0]}`, stats: rollStats(slot, R.stats, R.mul, tier, rnd), lore: LORE[(rnd() * LORE.length) | 0] };
}
export function statText([k, v]) {
  const p = ALL_STATS.find(s => s[0] === k);
  return p ? `+${p[3] === 100 ? Math.round(v * 100) : v >= 5 ? Math.round(v) : +(+v).toFixed(1)}${p[2]}` : `${k} ${v}`;
}
export const setCount = id => SLOTS.filter(sl => S.equip && S.equip[sl] && S.equip[sl].set === id).length;
export const sellPrice = it => Math.round(10 * (Math.min(it.r, 3) + 1) * (it.tier || 1) * (it.unique ? 3 : 1));

// ---------- fold everything into S.mods ----------
export function recomputeMods() {
  const m = {};
  const add = fx => { for (const k in fx) m[k] = (m[k] || 0) + fx[k]; };
  for (const id of S.skills || []) { const n = allNodes(S.cls).find(n => n.id === id); if (n) add(n.fx); }
  for (const id of S.relics || []) { const r = RELICS.find(r => r.id === id); if (r) add(r.fx); }
  for (const slot of SLOTS) { const it = S.equip && S.equip[slot]; if (!it) continue; for (const [k, v] of it.stats) m[k] = (m[k] || 0) + v; if (it.unique) { const u = UNIQUES.find(u => u.id === it.unique); if (u) add(u.fx); } }
  for (const set of SETS) { const n = setCount(set.id); for (let q = 2; q <= Math.min(4, n); q++) add(set.bonus[q][0]); }
  S.mods = m;
}
export const M = k => (S.mods && S.mods[k]) || 0;
