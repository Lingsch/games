// Build 10: crafting for levels 20-25, on Rod's scale of two points of skill for every level of gear (50 makes
// level-25 gear). New materials from the new lands; a top tier for every profession; rare recipes from the four
// raids that rival raid drops; furniture for your home; and masterworks, a chance at a better piece.
import { S, X, chat } from './core.js';
import * as Craft from './crafting.js';
import { DBOSSES } from './dungeons.js';
import * as Loot5 from './loot5.js';

Object.assign(Craft.MATS, { wyrmhide: { name: 'Wyrmhide', icon: '🐉' }, moonweave: { name: 'Moonweave', icon: '🌙' }, starstone: { name: 'Starstone', icon: '💫' } });
Object.assign(Craft.CONS, {
  feast: { name: 'Hearthfrost Feast', icon: '🍗', buff: 'fed', data: { hp: .08, pow: .08 }, desc: '+8% health and power for 30 minutes.' },
  deepstew: { name: 'Deepcap Stew', icon: '🍄', buff: 'fed', data: { pow: .1 }, desc: '+10% power for 30 minutes.' },
  titan: { name: 'Elixir of the Titan', icon: '🧪', buff: 'elixir', data: { hp: .12, armor: .08 }, desc: '+12% health and +8% armor for 30 minutes.' },
  kingsblood: { name: "Elixir of Kingsblood", icon: '🍷', buff: 'elixir', data: { pow: .1, crit: .02 }, desc: '+10% power and +2% critical chance for 30 minutes.' },
  scrollcrown: { name: 'Scroll of the Crown', icon: '📜', buff: 'scroll', data: { pow: .08, hp: .08 }, desc: '+8% power and health for 30 minutes.' },
});
const add = Craft.addRecipe;
// internal skill runs to 125 and shows at 0.4 per point: 102 shows as 41, 112 as 45, 122 as 49
const T4 = 102, T5 = 118;
for (const [t, req, lvl, mat, mat2] of [['Starsteel', T4, 22, 'starsteel', 'wyrmhide'], ['Rime-Iron', T5, 25, 'rimeiron', 'starstone']]) {
  const k = t.toLowerCase().replace(/[^a-z]/g, '');
  add(k + 'helm', 'smithing', `${t} Helm`, req, { [mat]: 5 }, { slot: 'head', armor: 'plate', lvl });
  add(k + 'chest', 'smithing', `${t} Breastplate`, req + 3, { [mat]: 7 }, { slot: 'chest', armor: 'plate', lvl });
  add(k + 'legs', 'smithing', `${t} Greaves`, req + 2, { [mat]: 6 }, { slot: 'legs', armor: 'plate', lvl });
  add(k + 'feet', 'smithing', `${t} Sabatons`, req, { [mat]: 5 }, { slot: 'feet', armor: 'plate', lvl });
  add(k + 'wpn', 'smithing', `${t} Weapon (for your class)`, req + 4, { [mat]: 8, [mat2]: 2 }, { slot: 'weapon', weapon: true, lvl });
  add(k + 'off', 'smithing', `${t} Off-hand (for your class)`, req + 5, { [mat]: 6, [mat2]: 1 }, { slot: 'off', off: true, lvl });
}
for (const [t, req, lvl, hide, x] of [['Wyrmhide', T4, 22, 'wyrmhide', 'deepcap'], ['Frostfang', T5, 25, 'wyrmhide', 'frostbloom']]) {
  const k = t.toLowerCase();
  for (const [s, nm, n] of [['head', 'Hood', 5], ['chest', 'Jerkin', 7], ['legs', 'Leggings', 6], ['feet', 'Boots', 5]]) add(k + s, 'leatherworking', `${t} ${nm}`, req + (s === 'chest' ? 3 : s === 'legs' ? 2 : 0), { [hide]: n, ...(req === T5 ? { [x]: 2 } : {}) }, { slot: s, armor: 'leather', lvl });
}
for (const [t, req, lvl, cloth, x] of [['Moonweave', T4, 22, 'moonweave', 'deepcap'], ['Kingsweave', T5, 25, 'moonweave', 'kingsfoil']]) {
  const k = t.toLowerCase();
  for (const [s, nm, n] of [['head', 'Cowl', 5], ['chest', 'Robe', 7], ['legs', 'Trousers', 6], ['feet', 'Slippers', 5]]) add(k + s, 'tailoring', `${t} ${nm}`, req + (s === 'chest' ? 3 : s === 'legs' ? 2 : 0), { [cloth]: n, ...(req === T5 ? { [x]: 2 } : {}) }, { slot: s, armor: 'cloth', lvl });
}
for (const [t, req, lvl, metal, gem] of [['Starsteel', T4, 22, 'starsteel', 'starstone'], ['Crown-Gold', T5, 25, 'crowngold', 'starstone']]) {
  const k = t.toLowerCase().replace(/[^a-z]/g, '');
  add(k + 'ring', 'jewelcrafting', `${t} Ring`, req, { [metal]: 4, [gem]: 1 }, { slot: 'ring', jewel: true, lvl });
  add(k + 'neck', 'jewelcrafting', `${t} Pendant`, req + 4, { [metal]: 3, [gem]: 2 }, { slot: 'neck', jewel: true, lvl });
}
add('hpot5', 'alchemy', 'Healing Draughts (6)', 102, { deepcap: 2, kingsfoil: 1 }, { pot: 'hpot', n: 6 });
add('mpot5', 'alchemy', 'Clarity Draughts (6)', 104, { deepcap: 2, frostbloom: 1 }, { pot: 'mpot', n: 6 });
add('titan', 'alchemy', 'Elixir of the Titan', 110, { frostbloom: 2, starstone: 1 }, { cons: 'titan', n: 1 });
add('kingsblood', 'alchemy', 'Elixir of Kingsblood', 120, { kingsfoil: 2, deepcap: 1 }, { cons: 'kingsblood', n: 1 });
add('deepstew', 'cooking', 'Deepcap Stew', 102, { meat: 3, deepcap: 1 }, { cons: 'deepstew', n: 2 });
add('feast', 'cooking', 'Hearthfrost Feast', 115, { meat: 4, frostbloom: 1, kingsfoil: 1 }, { cons: 'feast', n: 3 });
add('ench6', 'enchanting', 'Enchant Weapon: Starfire', 104, { dust: 10, shard: 4, starstone: 1 }, { ench: 'pow', n: 13, slot: 'weapon' });
add('ench7', 'enchanting', 'Enchant Chest: Titan\'s Vigor', 110, { dust: 10, shard: 4 }, { ench: 'sta', n: 16, slot: 'chest' });
add('ench8', 'enchanting', 'Enchant Weapon: Deadly Edge', 120, { dust: 12, shard: 5, starstone: 2 }, { ench: 'crit', n: 5, slot: 'weapon' });
add('scrollcrown', 'scribing', 'Scroll of the Crown (2)', 108, { hvellum: 2, tideink: 2, kingsfoil: 1 }, { cons: 'scrollcrown', n: 2 });
add('tome2b', 'scribing', "Blank Master's Tome, Star-Bound", 118, { hvellum: 3, tideink: 2, starstone: 1, page: 3 }, { tome: 2 });

// ---------- rare recipes from the raids: crafted pieces that stand beside raid drops ----------
const RAIDS = { starless: ['Starless', 'deep'], wintercrown: ['Winter-Crowned', 'north'], gilded: ['Gilded', 'crown'], door: ['Doorbreaker', 'door'] };
for (const [d, [t]] of Object.entries(RAIDS)) {
  const k = d.slice(0, 4);
  add(k + 'plate', 'smithing', `${t} Warplate`, 124, { rimeiron: 10, starsteel: 6, starstone: 3, shard: 4 }, { slot: 'chest', armor: 'plate', lvl: 25, rar: 4 }, d);
  add(k + 'leather', 'leatherworking', `${t} Harness`, 124, { wyrmhide: 12, frostbloom: 3, starstone: 3, shard: 4 }, { slot: 'chest', armor: 'leather', lvl: 25, rar: 4 }, d);
  add(k + 'robe', 'tailoring', `${t} Vestments`, 124, { moonweave: 12, kingsfoil: 3, starstone: 3, shard: 4 }, { slot: 'chest', armor: 'cloth', lvl: 25, rar: 4 }, d);
  add(k + 'ring', 'jewelcrafting', `${t} Signet`, 124, { crowngold: 5, starstone: 4, shard: 3 }, { slot: 'ring', jewel: true, lvl: 25, rar: 4 }, d);
  add(k + 'wpn', 'smithing', `${t} Weapon (for your class)`, 125, { rimeiron: 12, crowngold: 4, starstone: 4, shard: 5 }, { slot: 'weapon', weapon: true, lvl: 25, rar: 4 }, d);
}

// ---------- furniture: every crafter can make something for a home ----------
for (const [id, prof, name, req, mats, furn] of [
  ['f_weaprack', 'smithing', 'Weapon Rack', 30, { iron: 6, timber: 2 }, 'weaprack'], ['f_candles', 'smithing', 'Candelabra', 10, { copper: 4 }, 'candles'], ['f_forge', 'smithing', 'Forge (for your home)', 60, { iron: 12, silver: 4 }, 'st_forge'],
  ['f_armchair', 'leatherworking', 'Velvet Armchair', 30, { thickhide: 6, wool: 2 }, 'armchair'], ['f_rug', 'leatherworking', 'Woven Rug', 10, { lighthide: 6 }, 'rug'], ['f_tanrack', 'leatherworking', 'Tanning Rack (for your home)', 60, { thickhide: 10, scalehide: 4 }, 'st_tanrack'],
  ['f_bed', 'tailoring', 'Feather Bed', 25, { wool: 8, linen: 4 }, 'bed'], ['f_banner', 'tailoring', 'House Banner', 40, { wool: 6, seasilk: 2 }, 'bannerwall'], ['f_loom', 'tailoring', 'Loom (for your home)', 60, { wool: 10, seasilk: 4 }, 'st_loom'],
  ['f_mirror', 'jewelcrafting', 'Gilt Mirror', 45, { silver: 4, pearl: 1 }, 'mirror'], ['f_lamp', 'jewelcrafting', 'Crystal Lamp', 55, { silver: 3, moonstone: 2 }, 'crystallamp'], ['f_pedestal', 'jewelcrafting', 'Trophy Pedestal', 35, { iron: 4, garnet: 2 }, 'pedestal'],
  ['f_planter', 'alchemy', 'Garden Bed', 30, { meadowsweet: 6, graveroot: 2 }, 'planter'], ['f_bench', 'alchemy', "Alchemist's Bench (for your home)", 60, { graveroot: 8, kelpbloom: 4 }, 'st_alchemy'],
  ['f_kitchen', 'cooking', 'Kitchen Fire (for your home)', 40, { meat: 10, timber: 4 }, 'st_cookfire'], ['f_hearth', 'cooking', 'Stone Hearth', 25, { copper: 4, timber: 4 }, 'hearth'],
  ['f_orb', 'enchanting', 'Enchanted Orb', 45, { dust: 10, shard: 2 }, 'orb'], ['f_circle', 'enchanting', 'Enchanting Circle (for your home)', 60, { dust: 14, shard: 4 }, 'st_enchant'],
  ['f_shelf', 'scribing', 'Bookshelf', 25, { vellum: 4, ink: 4 }, 'shelf'], ['f_lectern', 'scribing', "Scribe's Lectern (for your home)", 50, { hvellum: 4, gloomink: 4 }, 'st_scribe'],
]) add(id, prof, name, req, mats, { furn, n: 1 });

// ---------- masterworks: a chance of something better than the recipe promises ----------
Craft.craftHooks.gear = (it, r, who) => {
  const s = Craft.skill(r.prof, who) || 0, ch = Math.min(.3, .08 + Math.max(0, s - r.req) * .004);
  if (Math.random() >= ch) return;
  it.rarity = Math.min(4, it.rarity + 1); for (const k of Object.keys(it.stats)) it.stats[k] = k === 'crit' ? +(it.stats[k] * 1.15).toFixed(1) : Math.round(it.stats[k] * 1.15);
  it.name = 'Masterwork ' + it.name; it.value = Math.round(it.value * 1.6);
  chat('sys', null, `${who ? who.name + ' has' : 'You have'} made a masterwork!`); X.ui?.toast?.('Masterwork!');
};
