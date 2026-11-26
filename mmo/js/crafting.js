// Build 5: professions. Gather from nodes in the world and from what enemies leave behind; craft at stations in town.
// One hero can learn every profession. Skills run 1-125 inside and show as 1-50 (Build 10: two points of skill for every level of gear); recipes come from the trainers or, the rare ones, from dungeon bosses.
import { S, TAU, rnd, irnd, pick, chat, floatText, mulberry32, clamp, X, WH } from './core.js';
import { world, hgt, regionAt, depthAt } from './world.js';
import { CLASSES, MOBS, WTYPE, BASE_NAMES, makeItem, GIVERS } from './data.js';
import { build, P, T, Box, Cyl, Cone, Sph, Oct, Dod } from './models.js';
import { addKinds } from './render.js';
import { TALK } from './dialogue.js';
import * as Cb from './combat.js';
const O = [0, 0, 0];

// ---------- materials ----------
export const MATS = {
  copper: { name: 'Copper Ore', icon: '🟠' }, iron: { name: 'Iron Ore', icon: '⚙️' }, silver: { name: 'Silver Ore', icon: '⚪' },
  meadowsweet: { name: 'Meadowsweet', icon: '🌼' }, graveroot: { name: 'Graveroot', icon: '🥀' }, kelpbloom: { name: 'Kelpbloom', icon: '🌿' },
  lighthide: { name: 'Light Hide', icon: '🟫' }, thickhide: { name: 'Thick Hide', icon: '🟤' }, scalehide: { name: 'Scaled Hide', icon: '🐊' },
  linen: { name: 'Linen Scraps', icon: '🧵' }, wool: { name: 'Wool Bolt', icon: '🧶' }, seasilk: { name: 'Sea Silk', icon: '🪡' },
  meat: { name: 'Game Meat', icon: '🍖' }, crabmeat: { name: 'Crab Meat', icon: '🦀' }, bonedust: { name: 'Grave Dust', icon: '💀' },
  garnet: { name: 'Rough Garnet', icon: '🔴' }, moonstone: { name: 'Moonstone', icon: '🔵' }, pearl: { name: 'Sea Pearl', icon: '🫧' },
  dust: { name: 'Arcane Dust', icon: '✨' }, shard: { name: 'Glimmer Shard', icon: '💠' },
};
export const PROFS = {
  mining: { name: 'Mining', icon: '⛏️', gather: true }, herbalism: { name: 'Herbalism', icon: '🌿', gather: true }, skinning: { name: 'Skinning', icon: '🔪', gather: true },
  smithing: { name: 'Smithing', icon: '🔨' }, leatherworking: { name: 'Leatherworking', icon: '🧤' }, tailoring: { name: 'Tailoring', icon: '🧵' },
  alchemy: { name: 'Alchemy', icon: '⚗️' }, cooking: { name: 'Cooking', icon: '🍲' }, enchanting: { name: 'Enchanting', icon: '✨' }, jewelcrafting: { name: 'Jewelcrafting', icon: '💍' },
};
// who teaches what, and which station each craft uses
export const TRAINERS = { smith: ['smithing', 'mining', 'jewelcrafting'], tanner: ['leatherworking', 'skinning'], weaver: ['tailoring', 'enchanting'], herbalist: ['alchemy', 'herbalism'], cook: ['cooking'] };
export const STATIONS = { forge: { name: 'Forge and Anvil', profs: ['smithing', 'jewelcrafting'] }, tanrack: { name: 'Tanning Rack', profs: ['leatherworking'] }, loom: { name: 'Loom', profs: ['tailoring'] },
  alchemy: { name: 'Alchemy Table', profs: ['alchemy'] }, cookfire: { name: 'Cooking Fire', profs: ['cooking'] }, enchant: { name: 'Enchanting Circle', profs: ['enchanting'] } };

// ---------- consumables you make (food and elixirs) ----------
export const CONS = {
  roast: { name: 'Roast Game', icon: '🍖', buff: 'fed', data: { hp: .05 }, desc: '+5% health for 30 minutes.' },
  stew: { name: 'Herb-Crusted Stew', icon: '🍲', buff: 'fed', data: { pow: .05 }, desc: '+5% power for 30 minutes.' },
  pie: { name: 'Gravewood Pie', icon: '🥧', buff: 'fed', data: { hp: .06, pow: .06 }, desc: '+6% health and power for 30 minutes.' },
  crabcake: { name: 'Crab Cakes', icon: '🦀', buff: 'fed', data: { hp: .08, pow: .08 }, desc: '+8% health and power for 30 minutes.' },
  might: { name: 'Elixir of Might', icon: '🧪', buff: 'elixir', data: { pow: .08 }, desc: '+8% power for 30 minutes.' },
  fortitude: { name: 'Elixir of Fortitude', icon: '🧪', buff: 'elixir', data: { hp: .1 }, desc: '+10% health for 30 minutes.' },
  grove: { name: 'Elixir of the Grove', icon: '🌳', buff: 'elixir', data: { hp: .1, pow: .1 }, desc: '+10% health and power for 30 minutes.' },
};

// ---------- recipes ----------
// out: gear {slot, armor|weapon|off|jewel, lvl, rar} · pot {key, n} · cons {key, n} · ench {stat, n, slot}
const R = [];
const rec = (id, prof, name, req, mats, out, rare = null) => R.push({ id, prof, name, req, mats, out, rare });
for (const [t, req, lvl, ore, extra] of [['Copper', 1, 5, 'copper', 'lighthide'], ['Iron', 40, 10, 'iron', 'thickhide'], ['Silver', 75, 16, 'silver', 'scalehide']]) {
  const k = t.toLowerCase();
  rec(k + 'helm', 'smithing', `${t} Helm`, req, { [ore]: 4 }, { slot: 'head', armor: 'plate', lvl });
  rec(k + 'chest', 'smithing', `${t} Breastplate`, req + 4, { [ore]: 6 }, { slot: 'chest', armor: 'plate', lvl });
  rec(k + 'legs', 'smithing', `${t} Greaves`, req + 2, { [ore]: 5 }, { slot: 'legs', armor: 'plate', lvl });
  rec(k + 'feet', 'smithing', `${t} Sabatons`, req, { [ore]: 4 }, { slot: 'feet', armor: 'plate', lvl });
  rec(k + 'wpn', 'smithing', `${t} Weapon (for your class)`, req + 6, { [ore]: 7, [extra]: 1 }, { slot: 'weapon', weapon: true, lvl });
  rec(k + 'off', 'smithing', `${t} Off-hand (for your class)`, req + 8, { [ore]: 5, [extra]: 1 }, { slot: 'off', off: true, lvl });
}
for (const [t, req, lvl, hide] of [['Rawhide', 1, 5, 'lighthide'], ['Thickhide', 40, 10, 'thickhide'], ['Scaleskin', 75, 16, 'scalehide']]) {
  const k = t.toLowerCase();
  rec(k + 'head', 'leatherworking', `${t} Hood`, req, { [hide]: 4 }, { slot: 'head', armor: 'leather', lvl });
  rec(k + 'chest', 'leatherworking', `${t} Jerkin`, req + 4, { [hide]: 6 }, { slot: 'chest', armor: 'leather', lvl });
  rec(k + 'legs', 'leatherworking', `${t} Leggings`, req + 2, { [hide]: 5 }, { slot: 'legs', armor: 'leather', lvl });
  rec(k + 'feet', 'leatherworking', `${t} Boots`, req, { [hide]: 4 }, { slot: 'feet', armor: 'leather', lvl });
}
for (const [t, req, lvl, cloth] of [['Linen', 1, 5, 'linen'], ['Woolen', 40, 10, 'wool'], ['Seasilk', 75, 16, 'seasilk']]) {
  const k = t.toLowerCase();
  rec(k + 'head', 'tailoring', `${t} Cowl`, req, { [cloth]: 4 }, { slot: 'head', armor: 'cloth', lvl });
  rec(k + 'chest', 'tailoring', `${t} Robe`, req + 4, { [cloth]: 6 }, { slot: 'chest', armor: 'cloth', lvl });
  rec(k + 'legs', 'tailoring', `${t} Trousers`, req + 2, { [cloth]: 5 }, { slot: 'legs', armor: 'cloth', lvl });
  rec(k + 'feet', 'tailoring', `${t} Slippers`, req, { [cloth]: 4 }, { slot: 'feet', armor: 'cloth', lvl });
}
for (const [t, req, lvl, metal, gem] of [['Copper', 1, 5, 'copper', 'garnet'], ['Iron', 40, 10, 'iron', 'moonstone'], ['Silver', 75, 16, 'silver', 'pearl']]) {
  const k = t.toLowerCase();
  rec(k + 'ring', 'jewelcrafting', `${t} Ring`, req, { [metal]: 3, [gem]: 1 }, { slot: 'ring', jewel: true, lvl });
  rec(k + 'neck', 'jewelcrafting', `${t} Pendant`, req + 5, { [metal]: 2, [gem]: 2 }, { slot: 'neck', jewel: true, lvl });
}
rec('hpot', 'alchemy', 'Healing Draughts (2)', 1, { meadowsweet: 2 }, { pot: 'hpot', n: 2 });
rec('mpot', 'alchemy', 'Clarity Draughts (2)', 10, { meadowsweet: 2 }, { pot: 'mpot', n: 2 });
rec('might', 'alchemy', 'Elixir of Might', 40, { graveroot: 2, bonedust: 1 }, { cons: 'might', n: 1 });
rec('fortitude', 'alchemy', 'Elixir of Fortitude', 50, { graveroot: 2, meadowsweet: 1 }, { cons: 'fortitude', n: 1 });
rec('hpot3', 'alchemy', 'Healing Draughts (4)', 75, { kelpbloom: 2, meadowsweet: 1 }, { pot: 'hpot', n: 4 });
rec('mpot3', 'alchemy', 'Clarity Draughts (4)', 80, { kelpbloom: 2, graveroot: 1 }, { pot: 'mpot', n: 4 });
rec('roast', 'cooking', 'Roast Game', 1, { meat: 2 }, { cons: 'roast', n: 2 });
rec('stew', 'cooking', 'Herb-Crusted Stew', 25, { meat: 2, meadowsweet: 1 }, { cons: 'stew', n: 2 });
rec('pie', 'cooking', 'Gravewood Pie', 50, { meat: 3, graveroot: 1 }, { cons: 'pie', n: 2 });
rec('crabcake', 'cooking', 'Crab Cakes', 75, { crabmeat: 3, kelpbloom: 1 }, { cons: 'crabcake', n: 2 });
rec('ench1', 'enchanting', 'Enchant Weapon: Power', 1, { dust: 4 }, { ench: 'pow', n: 3, slot: 'weapon' });
rec('ench2', 'enchanting', 'Enchant Chest: Vigor', 10, { dust: 4 }, { ench: 'sta', n: 5, slot: 'chest' });
rec('ench3', 'enchanting', 'Enchant Weapon: Greater Power', 40, { dust: 6, shard: 1 }, { ench: 'pow', n: 7, slot: 'weapon' });
rec('ench4', 'enchanting', 'Enchant Chest: Greater Vigor', 45, { dust: 6, shard: 1 }, { ench: 'sta', n: 10, slot: 'chest' });
rec('ench5', 'enchanting', 'Enchant Weapon: Keen Edge', 75, { dust: 8, shard: 3 }, { ench: 'crit', n: 3, slot: 'weapon' });
// rare recipes: only from dungeon bosses
rec('giltcrown', 'smithing', 'Gilt Crown', 35, { copper: 6, iron: 2, garnet: 1 }, { slot: 'head', armor: 'plate', lvl: 8, rar: 3 }, 'keep');
rec('kennelcoat', 'leatherworking', "Kennelmaster's Coat", 35, { lighthide: 6, thickhide: 2 }, { slot: 'chest', armor: 'leather', lvl: 8, rar: 3 }, 'keep');
rec('mossrobe', 'tailoring', 'Mossweave Robe', 35, { linen: 6, wool: 2 }, { slot: 'chest', armor: 'cloth', lvl: 8, rar: 3 }, 'grove');
rec('grove', 'alchemy', 'Elixir of the Grove', 45, { graveroot: 2, meadowsweet: 2, bonedust: 1 }, { cons: 'grove', n: 2 }, 'grove');
rec('hymnal', 'enchanting', 'Enchant Weapon: Hymnal Edge', 55, { dust: 8, shard: 2 }, { ench: 'pow', n: 10, slot: 'weapon' }, 'catacombs');
rec('dirge', 'jewelcrafting', 'Dirge Pendant', 55, { iron: 3, moonstone: 3, bonedust: 2 }, { slot: 'neck', jewel: true, lvl: 11, rar: 3 }, 'catacombs');
rec('deepwpn', 'smithing', 'Deepforged Weapon (for your class)', 60, { iron: 10, moonstone: 1 }, { slot: 'weapon', weapon: true, lvl: 12, rar: 3 }, 'mines');
rec('slagring', 'jewelcrafting', 'Slagheart Ring', 60, { iron: 4, garnet: 2, moonstone: 1 }, { slot: 'ring', jewel: true, lvl: 12, rar: 3 }, 'mines');
export const RECIPES = Object.fromEntries(R.map(r => [r.id, r]));
export const rareFrom = d => R.filter(r => r.rare === d);
export function addRecipe(id, prof, name, req, mats, out, rare = null) { rec(id, prof, name, req, mats, out, rare); RECIPES[id] = R[R.length - 1]; }

// ---------- state ----------
// Build 10: skill shows at two points per level of what it makes: 50 makes level-25 gear
export const SKILL_CAP = 125, shown = v => v == null ? v : Math.max(1, Math.round(v * .4));
export function initState() { S.prof = S.prof || {}; S.mats = S.mats || {}; S.recipes = S.recipes || []; S.cons = S.cons || {}; }
export const skill = (p, who) => who ? (who.craft && (who.craft.gather === p || who.craft.make === p) ? (who.craft.skill?.[p] ?? 1) : null) : S.prof?.[p] ?? null;      // null: not learned
// friends can be given one gathering job and one crafting job; they level those skills themselves
export const GATHER_JOBS = ['mining', 'herbalism', 'skinning', 'fishing', 'salvaging'], MAKE_JOBS = ['smithing', 'leatherworking', 'tailoring', 'alchemy', 'cooking', 'enchanting', 'jewelcrafting'];
export function setJob(fr, kind, p) { fr.craft = fr.craft || { gather: null, make: null, skill: {} }; fr.craft[kind] = p || null; if (p && fr.craft.skill[p] == null) fr.craft.skill[p] = 1; }
const friendsOn = () => (S.friends || []).filter(fr => S.party.some(p => p.name === fr.name && p.fake?.bff && !p.dead));
export const friendWith = (kind, p) => friendsOn().find(fr => fr.craft?.[kind] === p);
export const craftersAt = st => { const out = []; for (const p of STATIONS[st].profs) { if (skill(p) !== null) out.push({ who: null, p }); for (const fr of friendsOn()) if (fr.craft?.make === p) out.push({ who: fr, p }); } return out; };
export const knows = (r, who) => skill(r.prof, who) !== null && (!r.rare || S.recipes.includes(r.id));
export function learn(p) { initState(); if (S.prof[p] != null) return false; S.prof[p] = 1; chat('sys', null, `You learn ${PROFS[p].name}.`); return true; }
export function addMat(k, n = 1, quiet) { initState(); S.mats[k] = (S.mats[k] || 0) + n; if (!quiet) chat('loot', null, `You gather ${n} ${MATS[k].name}.`); }
export function skillUp(p, req, who) {
  const s = skill(p, who); if (s == null || s >= SKILL_CAP) return;
  const ch = s < req + 15 ? 1 : s < req + 30 ? .5 : s < req + 45 ? .2 : 0;
  if (Math.random() < ch) { if (who) who.craft.skill[p] = s + 1; else S.prof[p] = s + 1; const ent = who ? S.party.find(x => x.name === who.name) : S.hero; if (ent) { if (shown(s + 1) !== shown(s)) floatText(ent, `${PROFS[p].name} ${shown(s + 1)}`, '#8fe8ff'); } }
}
export const learnRecipe = id => { initState(); if (S.recipes.includes(id)) return false; S.recipes.push(id); chat('sys', null, `You learn a rare recipe: ${RECIPES[id].name}.`); return true; };

// ---------- gear you craft: as strong as dungeon set pieces of the same level ----------
const JEWEL_NAMES = { ring: 'Ring', neck: 'Pendant' };
export function gearBudget(L, slot, rar = 3) { return (2 + L * 1.6) * (1 + 3 * .45) * (slot === 'weapon' ? 1.6 : slot === 'chest' ? 1.2 : slot === 'ring' || slot === 'neck' ? .7 : 1) * (rar > 3 ? 1.15 : 1); }
function makeGear(r) {
  const o = r.out, cls = S.heroCls, L = o.lvl, rar = o.rar || 2, budget = gearBudget(L, o.slot) * (o.rar ? 1.12 : 1);
  const stats = {};
  if (o.slot === 'weapon') { stats.pow = Math.round(budget * .7); stats.sta = Math.round(budget * .3); }
  else if (o.jewel) { stats.pow = Math.round(budget * .5); stats.sta = Math.round(budget * .3); stats.crit = +(1 + L * .08).toFixed(1); }
  else { stats.sta = Math.round(budget * .55); stats.pow = Math.round(budget * .35); }
  let type = o.armor, armorType = o.armor || null, name = r.name.replace(' (for your class)', '');
  if (o.weapon) { type = WTYPE[cls][0]; name = name.replace('Weapon', BASE_NAMES.weapon[type][1]); }
  if (o.off) { type = WTYPE[cls][1]; armorType = type === 'shield' ? 'plate' : null; name = name.replace('Off-hand', BASE_NAMES.off[type][0]); }
  if (armorType) stats.arm = Math.round((armorType === 'plate' ? 3 : armorType === 'leather' ? 2 : 1) * (1 + L * .8) * 1.9);
  if (o.jewel) type = o.slot;
  return makeItem({ name, slot: o.slot, type, armorType, lvl: L, rarity: rar, stats, value: Math.round((3 + L * 4) * 4), crafted: true });
}
export const craftHooks = {};          // Build 8: tome -> blank tome item, mat -> add a material
export function haveMats(r, n = 1) { return Object.entries(r.mats).every(([k, v]) => (S.mats[k] || 0) >= v * n); }
// returns a message for the player
export function craft(id, G, who = null) {
  initState();
  const r = RECIPES[id]; if (!r || !knows(r, who)) return "You don't know that recipe.";
  if (skill(r.prof, who) < r.req) return `${who ? who.name + ' needs' : 'You need'} ${PROFS[r.prof].name} ${shown(r.req)}.`;
  if (!haveMats(r)) return "You don't have the materials.";
  const o = r.out;
  if (o.ench) { const it = S.gear[S.heroCls][o.slot]; if (!it) return `You have no ${o.slot} equipped to enchant.`; }
  if ((o.slot || o.tome) && !o.ench && S.bag.length >= 30) return 'Your bags are full.';
  if (o.need && !o.need()) return o.needWhy || "You can't make that here.";
  for (const [k, v] of Object.entries(r.mats)) S.mats[k] -= v;
  if (o.pot) { S.pots[o.pot] = (S.pots[o.pot] || 0) + o.n; chat('loot', null, `You make ${r.name}.`); }
  else if (o.cons) { S.cons[o.cons] = (S.cons[o.cons] || 0) + o.n; chat('loot', null, `You make ${o.n} ${CONS[o.cons].name}.`); }
  else if (o.mat) { craftHooks.mat(o.mat, o.n); chat('loot', null, `${who ? who.name + ' makes' : 'You make'} ${r.name}.`); }
  else if (o.tome) { const it = craftHooks.tome(o.tome); G.addToBag(it); chat('loot', null, `${who ? who.name + ' writes' : 'You write'} a ${it.name}.`); }
  else if (o.ench) { const it = S.gear[S.heroCls][o.slot]; if (it.ench) it.stats[it.ench.stat] = Math.max(0, (it.stats[it.ench.stat] || 0) - it.ench.n); it.ench = { stat: o.ench, n: o.n, name: r.name.replace(/^Enchant \w+: /, '') }; it.stats[o.ench] = +((it.stats[o.ench] || 0) + o.n).toFixed(1); G.applyGear(S.hero, S.gear[S.heroCls]); chat('loot', null, `${it.name} glows: ${it.ench.name}.`); }
  else if (o.furn && craftHooks.furn) { craftHooks.furn(o.furn, o.n || 1); chat('loot', null, `${who ? who.name + ' makes' : 'You make'} ${r.name}.`); }
  else { const it = makeGear(r); if (craftHooks.gear) craftHooks.gear(it, r, who); G.addToBag(it); chat('loot', null, `${who ? who.name + ' makes' : 'You make'} ${it.name}.`); }
  skillUp(r.prof, r.req, who);
  G.save();
  return null;
}
// enchanters break down gear into dust and shards
export function disenchant(it, G) {
  if (skill('enchanting') === null) return 'You need to learn Enchanting.';
  if (it.rarity < 1) return 'Only uncommon or better gear holds enough magic.';
  S.bag = S.bag.filter(b => b !== it);
  addMat('dust', irnd(1, 2) + it.rarity, true); if (it.rarity >= 2) addMat('shard', irnd(1, it.rarity), true);
  chat('loot', null, `You disenchant ${it.name} into arcane dust${it.rarity >= 2 ? ' and glimmer shards' : ''}.`);
  skillUp('enchanting', Math.min(70, it.lvl * 5)); G.save(); return null;
}
export function useCons(k) {
  initState(); if (!(S.cons[k] > 0)) return;
  const c = CONS[k]; S.cons[k]--; Cb.buff(S.hero, c.buff, 1800, { ...c.data }, S.hero); chat('sys', null, `You ${c.buff === 'fed' ? 'eat' : 'drink'} the ${c.name}. ${c.desc}`);
}

// ---------- gathering from what enemies leave behind ----------
export function mobMats(m) {
  initState();
  const D = MOBS[m.mob] || {}, L = m.lvl, tier = L < 6 ? 0 : L < 11 ? 1 : L < 20 ? 2 : 3, got = [];
  if (D.beast) {
    if (Math.random() < .45) got.push([m.mob === 'crab' || m.mob === 'crabbig' ? 'crabmeat' : 'meat', 1]);
    const sk = skill('skinning') !== null ? null : friendWith('gather', 'skinning'), sv = skill('skinning', sk);
    if (sv !== null) { const h = ['lighthide', 'thickhide', 'scalehide', 'wyrmhide'][tier], req = [1, 40, 75, 100][tier]; if (sv >= req) { got.push([h, irnd(1, 2)]); skillUp('skinning', req, sk); } }
  }
  if (m.mob === 'crab' || m.mob === 'crabbig') { if (Math.random() < .5) got.push(['crabmeat', 1]); }
  if (D.human && Math.random() < .35) got.push([['linen', 'wool', 'seasilk', 'moonweave'][tier], irnd(1, 2)]);
  if (D.undead && Math.random() < .3) got.push(['bonedust', 1]);
  if (D.ore && Math.random() < .6) got.push([tier < 2 ? 'iron' : tier < 3 ? 'silver' : 'starsteel', irnd(1, 2)]);
  if (m.named && Math.random() < .5) got.push([['garnet', 'moonstone', 'pearl', 'starstone'][tier], 1]);
  for (const [k, n] of got) addMat(k, n, true);
  if (got.length) chat('loot', null, `You gather ${got.map(([k, n]) => `${n} ${MATS[k].name}`).join(', ')}.`);
}

// ---------- models: ore veins, herbs, stations ----------
const vein = c => build([P(T(Dod(1.1), 0, .5, 0, 0, 0, 0, 1.2, .8, 1), 0, O, '#6d6878'), ...[[.5, .9, .3], [-.4, .7, .5], [.1, 1.1, -.4], [.6, .5, -.4]].map(([x, y, z]) => P(T(Oct(.28), x, y, z), 0, O, c, .9))]);
const herb = (c, l) => build([...[0, 1, 2, 3, 4].map(k => P(T(Cone(.12, .9, 4), Math.cos(k * 1.3) * .25, .45, Math.sin(k * 1.3) * .25, 0, 0, (k - 2) * .2), 0, O, l)), ...[0, 1, 2].map(k => P(T(Sph(.16, 5, 4), Math.cos(k * 2.1) * .22, .95, Math.sin(k * 2.1) * .22), 0, O, c, .6))]);
const STILL = [0, 0, 0, 0];
addKinds({
  orecopper: [vein('#e08a3a'), STILL, 0, .03], oreiron: [vein('#b8c0d0'), STILL, 0, .03], oresilver: [vein('#f0f4ff'), STILL, 0, .03],
  herbmeadow: [herb('#ffe25a', '#5a8a3a'), [.05, 0, 0, 0], 0, .02], herbgrave: [herb('#9a4ab0', '#3a4a3a'), [.05, 0, 0, 0], 0, .02], herbkelp: [herb('#5ad8b8', '#2a6a5a'), [.05, 0, 0, 0], 0, .02],
  forge: [build([P(T(Box(2.2, 1.4, 1.6), 0, .7), 0, O, '#5e5966'), P(T(Box(1.4, .5, 1), 0, 1.5), 0, O, '#ff7a2a', 1.4), P(T(Cyl(.3, .4, 2.2, 6), .7, 2.4, -.4), 0, O, '#3a3640'),
    P(T(Box(1, .5, .45), -1.9, .85), 0, O, '#2a2a30'), P(T(Box(.4, .6, .35), -1.9, .3), 0, O, '#4a3322')]), STILL, 0, .04],
  tanrack: [build([...[-1, 1].map(s => P(T(Box(.15, 2.2, .15), s * 1.1, 1.1), 0, O, '#5a3e28')), P(T(Box(2.4, .12, .12), 0, 2.1), 0, O, '#5a3e28'), P(T(Box(1.8, 1.6, .05), 0, 1.25), 0, O, '#a07850')]), STILL, 0, .03],
  loom: [build([P(T(Box(2, .15, 1.2), 0, .9), 0, O, '#6b4a2e'), ...[-1, 1].flatMap(s => [-1, 1].map(t => P(T(Box(.12, 1.8, .12), s * .9, .9, t * .5), 0, O, '#5a3e28'))), P(T(Box(1.7, 1, .05), 0, 1.5), 0, O, '#c84a4a')]), STILL, 0, .03],
  alchemy: [build([P(T(Box(2, .15, 1), 0, .9), 0, O, '#6b4a2e'), ...[-1, 1].map(s => P(T(Box(.12, .9, .8), s * .85, .45), 0, O, '#5a3e28')), P(T(Sph(.25, 6, 5), -.5, 1.2), 0, O, '#5ad85a', 1), P(T(Cyl(.12, .2, .5, 6), .1, 1.2), 0, O, '#c85ad8', 1), P(T(Sph(.2, 6, 5), .6, 1.15), 0, O, '#5a9aff', 1)]), STILL, 0, .03],
  cookfire: [build([...[0, 1, 2, 3, 4, 5].map(k => P(T(Dod(.25), Math.cos(k) * .7, .15, Math.sin(k) * .7), 0, O, '#6d6878')), P(T(Cone(.45, .9, 5), 0, .45), 0, O, '#ff9a3a', 1.6), ...[-1, 1].map(s => P(T(Box(.08, 1.4, .08), s * .8, .7), 0, O, '#3a2a1c')), P(T(Box(1.8, .08, .08), 0, 1.4), 0, O, '#3a2a1c'), P(T(Cyl(.35, .3, .4, 8), 0, 1.05), 0, O, '#2a2a30')]), STILL, 0, .03],
  enchant: [build([P(T(Cyl(1.4, 1.4, .1, 16), 0, .05), 0, O, '#4a4652'), ...[0, 1, 2, 3, 4].map(k => P(T(Oct(.18), Math.cos(k * 1.26) * 1.1, .5, Math.sin(k * 1.26) * 1.1), 0, O, '#c88aff', 1.5)), P(T(Box(.3, 1, .3), 0, .5), 0, O, '#6f6a72'), P(T(Oct(.25), 0, 1.3), 0, O, '#8affff', 2)]), STILL, 0, .03],
});

// ---------- placing nodes, stations and trainers when a zone is built ----------
export const NODES = {
  vale: [['copper', 'ore', 'orecopper', 1, [0, 1], 22], ['iron', 'ore', 'oreiron', 40, [2, 3], 18], ['meadowsweet', 'herb', 'herbmeadow', 1, [0, 1], 22], ['graveroot', 'herb', 'herbgrave', 40, [2, 3], 18]],
  coast: [['silver', 'ore', 'oresilver', 75, null, 18], ['iron', 'ore', 'oreiron', 40, null, 8], ['kelpbloom', 'herb', 'herbkelp', 75, null, 20]],
};
export const YARD = { x: -15, z: 15 };
export function decorate(zone, seed) {
  initState();
  const list = NODES[zone]; if (!list) return;
  const rng = mulberry32(seed + (zone === 'vale' ? 77 : 177)), W = WH - 20;
  const tooClose = (x, z) => (world.towns || []).some(t => Math.hypot(t.x - x, t.z - z) < (t.R || 26) + 10) || (world.town && Math.hypot(world.town.x - x, world.town.z - z) < 40) ||
    world.props.some(p => Math.hypot(p.x - x, p.z - z) < 8) || (world.clearSpots || []).some(c => Math.hypot(c.x - x, c.z - z) < c.r);
  for (const [mat, type, kind, req, regs, n] of list) {
    for (let i = 0, made = 0; i < 600 && made < n; i++) {
      const x = (rng() * 2 - 1) * W, z = (rng() * 2 - 1) * W;
      if (depthAt(x, z) > .05 || tooClose(x, z)) continue;
      if (regs && !regs.includes(regionAt(x, z))) continue;
      if (zone === 'coast' && type === 'herb' && !(depthAt(x + 6, z) > .3 || depthAt(x - 6, z) > .3 || depthAt(x, z + 6) > .3 || depthAt(x, z - 6) > .3)) continue; // kelpbloom grows by the water
      world.props.push({ id: 'n' + zone + i, kind, tag: 'node', name: MATS[mat].name, x, z, yaw: rng() * TAU, scale: type === 'ore' ? 1 : 1.2, node: { mat, type, req } });
      made++;
    }
  }
  if (zone === 'vale') {
    // the crafters' quarter, inside the walls in the south-west of town
    const Y = YARD, st = [['forge', -5, -3.5], ['tanrack', -6.5, 2], ['loom', -2, 6], ['alchemy', 3.5, 5.5], ['cookfire', 5.5, -.5], ['enchant', 1.5, -5.5], ['scribe', -3, -6.8]];
    for (const [k, dx, dz] of st) world.props.push({ id: 's' + k, kind: k, tag: 'station', station: k, name: STATIONS[k].name, x: Y.x + dx, z: Y.z + dz, yaw: Math.atan2(-dx, -dz), scale: 1 });
    world.storyNpcs.push({ key: 'smith', x: Y.x - 2.8, z: Y.z - 2.2, yaw: Math.PI / 4 }, { key: 'weaver', x: Y.x - .6, z: Y.z + 3.2, yaw: Math.PI }, { key: 'herbalist', x: Y.x + 2.2, z: Y.z + 2.6, yaw: Math.PI * .8 },
      { key: 'cook', x: Y.x + 3, z: Y.z - .6, yaw: -Math.PI / 2 }, { key: 'tanner2', x: Y.x - 3.8, z: Y.z + 1, yaw: Math.PI / 2 }, { key: 'quill', x: Y.x - 1.2, z: Y.z - 4.6, yaw: Math.PI * .1 });
    world.extraPlaces.push({ name: "The Crafters' Quarter", x: Y.x, z: Y.z, R: 8, kind: 'site' });
    // nothing hostile spawns on top of the yard
    world.spawns = world.spawns.filter(sp => Math.hypot(sp.x - Y.x, sp.z - Y.z) > 26);
  }
}
Object.assign(GIVERS, {
  smith: { name: 'Hilde Ironhand', title: 'Smithing, Mining, Jewelcrafting', model: 'guard' },
  weaver: { name: 'Mistress Pim', title: 'Tailoring, Enchanting', model: 'villager1' },
  herbalist: { name: 'Granny Rue', title: 'Alchemy, Herbalism', model: 'villager3' },
  cook: { name: 'Cookie Mabb', title: 'Cooking', model: 'villager0' },
  tanner2: { name: 'Sedge the Skinner', title: 'Leatherworking, Skinning', model: 'bandit2' },
});
TRAINERS.tanner2 = TRAINERS.tanner;
Object.assign(TALK, {
  smith: { bio: 'Hilde Ironhand has hammered out horseshoes, swords and, once, a very small anvil for a very small dog. She can teach anyone to mine, smith and set a stone.',
    greet: ["Hammer's hot. You want to learn, or you want to stand there looking at my anvil? Both are fine, but one's more useful.", 'Bring me ore and I\'ll show you what it wants to become.'],
    topics: [{ q: 'Where do I find ore?', a: ["Copper shows orange in the rocks of the fields and along the road. Iron likes the wood and the Waste. Out on the coast they say there's silver in the islands."] }] },
  weaver: { bio: "Mistress Pim weaves cloth so fine the Watch captains wear it under their armor, and she pulls magic out of old gear the way other people pull threads.",
    greet: ['Mind the loom, dear. It bites.', "Linen, wool, a little magic. Everything unravels if you know which thread to pull."],
    topics: [{ q: 'Where does cloth come from?', a: ["People, mostly. Bandits and cultists carry linen and wool, and they won't be needing it after you've had a word with them."] }] },
  herbalist: { bio: 'Granny Rue has brewed potions for three generations of the Watch, and only one of them ever turned anyone blue. Permanently.',
    greet: ['Sniff that. No, really. Smells like Meadowsweet, doesn\'t it? Lovely stuff.', "Healing draughts don't brew themselves, more's the pity."],
    topics: [{ q: 'What herbs do I need?', a: ["Meadowsweet grows yellow in the fields. Graveroot grows purple and sullen in the wood and the Waste. Kelpbloom grows by the sea, if you ever get that far."] }] },
  cook: { bio: 'Cookie Mabb feeds the Watch, the crafters and anybody who looks hungry, which by her count is everybody.',
    greet: ['Sit down, you look thin. Everybody looks thin to me, mind.', "A good stew wins more fights than a sharp sword. Ask any soldier."],
    topics: [{ q: 'What should I cook?', a: ["Game meat from boars, wolves and bears. Add a sprig of Meadowsweet and you've got a stew that'll put fire in your arms for half an hour."] }] },
  tanner2: { bio: 'Sedge skins whatever the hunters bring back and tans it into leather fit for a scout. He does not talk much, and he likes it that way.',
    greet: ['Hides.', "You'll want a sharp knife and a strong stomach."],
    topics: [{ q: 'How does skinning work?', a: ["Kill a beast. Take its hide. The thicker the beast, the thicker the hide, and the more you'll need to know to take it off clean."] }] },
});
// the old tanner in town teaches leather too
TALK.tanner = TALK.tanner || {};

// gathering: the action button on a node. Ore and herbs, and from Build 6 fish and wrecks.
export const NODE_PROF = { ore: 'mining', herb: 'herbalism', fish: 'fishing', wreck: 'salvaging' };
const NODE_VERB = { ore: 'Mine', herb: 'Pick', fish: 'Fish', wreck: 'Salvage' };
export const nodeHooks = { roll: {} };          // type -> (node, who) => [[mat, n], ...] and a line of loot text
const rollNode = (n, who) => {
  if (nodeHooks.roll[n.type]) return nodeHooks.roll[n.type](n, who);
  const k = irnd(1, 3), got = [[n.mat, k]];
  if (n.type === 'ore' && Math.random() < .15) got.push([n.mat === 'copper' ? 'garnet' : n.mat === 'iron' ? 'moonstone' : 'pearl', 1]);
  return got;
};
const lootLine = got => got.map(([k, n]) => `${n} ${MATS[k].name}`).join(' and ');
export function nodeLabel(p) {
  const n = p.node; if (!n || p.depleted) return null;
  const prof = NODE_PROF[n.type];
  return `${NODE_VERB[n.type]}: ${p.name}${skill(prof) === null ? ' (needs ' + PROFS[prof].name + ')' : S.prof[prof] < n.req ? ` (needs ${shown(n.req)})` : ''}`;
}
export function gather(e) {
  initState();
  const p = e.prop, n = p.node, prof = NODE_PROF[n.type];
  if (skill(prof) === null) { chat('sys', null, `You need to learn ${PROFS[prof].name}. A trainer can teach you.`); return false; }
  if (S.prof[prof] < n.req) { chat('sys', null, `You need ${PROFS[prof].name} ${shown(n.req)} to gather this.`); return false; }
  const got = rollNode(n, null); for (const [k, c] of got) addMat(k, c, true);
  if (got.length) chat('loot', null, `You gather ${lootLine(got)}.`);
  skillUp(prof, n.req);
  for (const f of X.gathered || []) f(n.type, got);
  p.depleted = S.time + (n.regrow || 150); e.remove = true; e.dead = true;
  return true;
}
// friends with a gathering job pick from nodes near you when nothing's going on
export function friendGatherTick(G) {
  const h = S.hero; if (!h || h.dead) return;
  for (const fr of friendsOn()) {
    const job = fr.craft?.gather, type = Object.keys(NODE_PROF).find(t => NODE_PROF[t] === job); if (!type) continue;
    const e = S.party.find(p => p.name === fr.name); if (!e || e.gatherTask || e.combatT && S.time - e.combatT < 4) continue;
    const sk = skill(job, fr);
    const n = S.ents.find(x => x.prop?.node && !x.remove && x.prop.node.type === type && x.prop.node.req <= sk && Math.hypot(x.x - h.x, x.z - h.z) < 16 && !S.party.some(p => p.gatherTask?.ent === x));
    if (n) e.gatherTask = { ent: n, t: 0, fr };
  }
}
// called by the friend's AI once it's standing at the node
export function friendGather(e) {
  const g = e.gatherTask; e.gatherTask = null; if (!g || g.ent.remove) return;
  const p = g.ent.prop, n = p.node, got = rollNode(n, g.fr); for (const [k, c] of got) addMat(k, c, true);
  if (got.length) chat('loot', null, `${g.fr.name} gathers ${lootLine(got)}.`);
  skillUp(NODE_PROF[n.type], n.req, g.fr);
  p.depleted = S.time + (n.regrow || 150); g.ent.remove = true; g.ent.dead = true;
}
// depleted nodes grow back
export function tick(G) {
  for (const p of world.props) if (p.depleted && S.time > p.depleted) { p.depleted = 0; G.spawnProp(p); }
}
