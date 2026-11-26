// Build 13: crafting for levels 30-35. Still two points of skill for every level of gear, so the cap rises to 70
// (stored as 175): 64 makes level-32 gear, 70 makes level-35 gear, and the Frost-King and the 24-person raids
// teach the best recipes. New materials come from the lands Vhorun broke: void-iron, gloomcap, gloomhide,
// lampsilk, and lampheart, a little of the Last Lamp's light that soaked into the things it touched.
import * as Craft from './crafting.js';

Object.assign(Craft.MATS, { voidiron: { name: 'Void-Iron Ore', icon: '🌑' }, gloomcap: { name: 'Gloomcap', icon: '🍄' }, gloomhide: { name: 'Gloomhide', icon: '🦇' }, lampsilk: { name: 'Lampsilk', icon: '🕸️' }, lampheart: { name: 'Lampheart', icon: '🔆' }, rimeglass: { name: 'Rimeglass', icon: '🧊' } });
Object.assign(Craft.CONS, {
  lampfeast: { name: 'Lampfall Feast', icon: '🍲', buff: 'fed', data: { hp: .12, pow: .12 }, desc: '+12% health and power for 30 minutes.' },
  dawnelixir: { name: 'Elixir of the Dawn', icon: '🧪', buff: 'elixir', data: { pow: .14, crit: .03 }, desc: '+14% power and +3% critical chance for 30 minutes.' },
  thawelixir: { name: 'Elixir of the Thaw', icon: '🧪', buff: 'elixir', data: { hp: .18, armor: .12 }, desc: '+18% health and +12% armor for 30 minutes.' },
});
const add = Craft.addRecipe, T8 = 155, T9 = 170;
for (const [t, req, lvl, ex] of [['Void-Iron', T8, 32, 'lampheart'], ['Lampforged', T9, 35, 'lampheart']]) {
  const k = 'vh' + t.toLowerCase().replace(/[^a-z]/g, ''), n = req === T9 ? 2 : 1;
  add(k + 'helm', 'smithing', `${t} Helm`, req, { voidiron: 7, [ex]: n }, { slot: 'head', armor: 'plate', lvl, sec: 'parry' });
  add(k + 'chest', 'smithing', `${t} Breastplate`, req + 3, { voidiron: 9, [ex]: n }, { slot: 'chest', armor: 'plate', lvl, sec: 'haste' });
  add(k + 'legs', 'smithing', `${t} Greaves`, req + 2, { voidiron: 8, [ex]: n }, { slot: 'legs', armor: 'plate', lvl, sec: 'block' });
  add(k + 'feet', 'smithing', `${t} Sabatons`, req, { voidiron: 7, [ex]: n }, { slot: 'feet', armor: 'plate', lvl, sec: 'dodge' });
  add(k + 'wpn', 'smithing', `${t} Weapon (for your class)`, req + 4, { voidiron: 10, [ex]: n + 1 }, { slot: 'weapon', weapon: true, lvl, sec: 'crit' });
  add(k + 'off', 'smithing', `${t} Off-hand (for your class)`, req + 5, { voidiron: 8, [ex]: n }, { slot: 'off', off: true, lvl, sec: 'haste' });
  add(k + 'ring', 'jewelcrafting', `${t} Ring`, req, { voidiron: 5, [ex]: n + 1 }, { slot: 'ring', jewel: true, lvl, sec: 'haste' });
  add(k + 'neck', 'jewelcrafting', `${t} Pendant`, req + 4, { voidiron: 4, [ex]: n + 2 }, { slot: 'neck', jewel: true, lvl, sec: 'spi' });
  add(k + 'rfrost', 'jewelcrafting', `${t} Band of the Thaw`, req + 2, { voidiron: 4, rimeglass: 3, [ex]: n }, { slot: 'ring', jewel: true, lvl, sec: 'rfrost' });
  add(k + 'rshadow', 'jewelcrafting', `${t} Band of the Dawn`, req + 3, { voidiron: 4, gloomcap: 4, [ex]: n }, { slot: 'ring', jewel: true, lvl, sec: 'rshadow' });
}
for (const [t, req, lvl, mat, armor, prof, parts, secs] of [['Gloomhide', T8, 32, 'gloomhide', 'leather', 'leatherworking', ['Hood', 'Jerkin', 'Leggings', 'Boots'], ['crit', 'haste', 'dodge', 'crit']], ['Nightstalker', T9, 35, 'gloomhide', 'leather', 'leatherworking', ['Hood', 'Jerkin', 'Leggings', 'Boots'], ['haste', 'crit', 'haste', 'dodge']],
  ['Lampsilk', T8, 32, 'lampsilk', 'cloth', 'tailoring', ['Cowl', 'Robe', 'Trousers', 'Slippers'], ['spi', 'haste', 'mreg', 'crit']], ['Dawnwoven', T9, 35, 'lampsilk', 'cloth', 'tailoring', ['Cowl', 'Robe', 'Trousers', 'Slippers'], ['haste', 'spi', 'crit', 'mreg']]]) {
  const k = 'vh' + t.toLowerCase();
  ['head', 'chest', 'legs', 'feet'].forEach((s, i) => add(k + s, prof, `${t} ${parts[i]}`, req + (s === 'chest' ? 3 : s === 'legs' ? 2 : 0), { [mat]: [7, 9, 8, 7][i], ...(req === T9 ? { lampheart: 1, gloomcap: 2 } : { gloomcap: 1 }) }, { slot: s, armor, lvl, sec: secs[i] }));
}
add('vhhpot', 'alchemy', 'Lampfall Draughts (6)', 155, { gloomcap: 3 }, { pot: 'hpot', n: 6 });
add('vhmpot', 'alchemy', 'Dawnlight Draughts (6)', 157, { gloomcap: 3, rimeglass: 1 }, { pot: 'mpot', n: 6 });
add('dawnelixir', 'alchemy', 'Elixir of the Dawn', 165, { gloomcap: 3, lampheart: 1 }, { cons: 'dawnelixir', n: 1 });
add('thawelixir', 'alchemy', 'Elixir of the Thaw', 168, { gloomcap: 3, rimeglass: 2 }, { cons: 'thawelixir', n: 1 });
add('lampfeast', 'cooking', 'Lampfall Feast', 160, { meat: 6, gloomcap: 2 }, { cons: 'lampfeast', n: 3 });
add('ench12', 'enchanting', 'Enchant Weapon: Lampfall', 158, { dust: 16, shard: 7, lampheart: 1 }, { ench: 'pow', n: 22, slot: 'weapon' });
add('ench13', 'enchanting', 'Enchant Chest: Hearthward', 162, { dust: 16, shard: 7 }, { ench: 'sta', n: 28, slot: 'chest' });
add('ench14', 'enchanting', 'Enchant Weapon: Quickening', 166, { dust: 18, shard: 8, lampheart: 1 }, { ench: 'haste', n: 4, slot: 'weapon' });
add('ench15', 'enchanting', 'Enchant Chest: Thawheart', 168, { dust: 16, shard: 7, rimeglass: 3 }, { ench: 'rfrost', n: 30, slot: 'chest' });
add('ench16', 'enchanting', 'Enchant Chest: Dawnheart', 172, { dust: 16, shard: 7, lampheart: 2 }, { ench: 'rshadow', n: 30, slot: 'chest' });
// rare recipes from the Frost-King and the three 24-person raids
for (const [d, t] of [['whitethrone', 'Thawbringer\'s'], ['undergate', 'Gatebreaker\'s'], ['lightlesscath', 'Dawnbringer\'s'], ['throat', 'Lampbearer\'s']]) {
  const k = d.slice(0, 6);
  add(k + 'plate', 'smithing', `${t} Warplate`, 175, { voidiron: 14, lampheart: 5, shard: 6 }, { slot: 'chest', armor: 'plate', lvl: 35, rar: 4, sec: 'parry' }, d);
  add(k + 'leather', 'leatherworking', `${t} Harness`, 175, { gloomhide: 16, lampheart: 5, shard: 6 }, { slot: 'chest', armor: 'leather', lvl: 35, rar: 4, sec: 'haste' }, d);
  add(k + 'robe', 'tailoring', `${t} Vestments`, 175, { lampsilk: 16, lampheart: 5, shard: 6 }, { slot: 'chest', armor: 'cloth', lvl: 35, rar: 4, sec: 'haste' }, d);
  add(k + 'ring', 'jewelcrafting', `${t} Signet`, 175, { voidiron: 7, lampheart: 6, shard: 5 }, { slot: 'ring', jewel: true, lvl: 35, rar: 4, sec: 'crit' }, d);
  add(k + 'wpn', 'smithing', `${t} Weapon (for your class)`, 175, { voidiron: 16, lampheart: 6, shard: 7 }, { slot: 'weapon', weapon: true, lvl: 35, rar: 4, sec: 'crit' }, d);
}
