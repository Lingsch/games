// Build 14: crafting for levels 36-40. The cap rises to 80 (stored as 200): 74 makes level-38 gear, 78 makes level-40
// gear, and the five raids of the Lamplighters' road teach the best recipes at 80. New materials come from the new
// lands: lumenite (Starwright alloy, from the Forge and the crash), duskbloom (a flower that grows in the Reach without
// light), duskhide, wickweave, and curtain-shard, a sliver of the Great Lamp's light.
import * as Craft from './crafting.js';
import { ZSPEC } from './kit9.js';
import { NODES } from './crafting.js';

Object.assign(Craft.MATS, { lumenite: { name: 'Lumenite', icon: '💠' }, duskbloom: { name: 'Duskbloom', icon: '🌑' }, duskhide: { name: 'Duskhide', icon: '🦇' }, wickweave: { name: 'Wickweave', icon: '🧵' }, curtainshard: { name: 'Curtain-Shard', icon: '✨' } });
Object.assign(Craft.CONS, {
  lampfootfeast: { name: 'Lampfoot Feast', icon: '🍲', buff: 'fed', data: { hp: .14, pow: .14 }, desc: '+14% health and power for 30 minutes.' },
  curtainelixir: { name: 'Elixir of the Curtain', icon: '🧪', buff: 'elixir', data: { pow: .16, crit: .04 }, desc: '+16% power and +4% critical chance for 30 minutes.' },
  deepelixir: { name: 'Elixir of the Deep', icon: '🧪', buff: 'elixir', data: { hp: .2, armor: .14 }, desc: '+20% health and +14% armor for 30 minutes.' },
});
// gathering in the new lands: lumenite and duskbloom, skill 74 (stored 185)
for (const z of ['lr14', 'dh14', 'sf14', 'mf14', 'gl14']) { NODES[z] = [['lumenite', 'ore', 'oresilver', 182, null, 22], ['duskbloom', 'herb', 'herbgrave', 182, null, 26]]; if (ZSPEC[z]) ZSPEC[z].nodes = NODES[z]; }
const add = Craft.addRecipe, T10 = 185, T11 = 195;
for (const [t, req, lvl, n] of [['Lumenite', T10, 38, 1], ['Curtainforged', T11, 40, 2]]) {
  const k = 'lc' + t.toLowerCase();
  add(k + 'helm', 'smithing', `${t} Helm`, req, { lumenite: 8, curtainshard: n }, { slot: 'head', armor: 'plate', lvl, sec: 'parry' });
  add(k + 'chest', 'smithing', `${t} Breastplate`, req + 3, { lumenite: 10, curtainshard: n }, { slot: 'chest', armor: 'plate', lvl, sec: 'haste' });
  add(k + 'legs', 'smithing', `${t} Greaves`, req + 2, { lumenite: 9, curtainshard: n }, { slot: 'legs', armor: 'plate', lvl, sec: 'block' });
  add(k + 'feet', 'smithing', `${t} Sabatons`, req, { lumenite: 8, curtainshard: n }, { slot: 'feet', armor: 'plate', lvl, sec: 'dodge' });
  add(k + 'wpn', 'smithing', `${t} Weapon (for your class)`, req + 4, { lumenite: 11, curtainshard: n + 1 }, { slot: 'weapon', weapon: true, lvl, sec: 'crit' });
  add(k + 'off', 'smithing', `${t} Off-hand (for your class)`, req + 5, { lumenite: 9, curtainshard: n }, { slot: 'off', off: true, lvl, sec: 'haste' });
  add(k + 'ring', 'jewelcrafting', `${t} Ring`, req, { lumenite: 6, curtainshard: n + 1 }, { slot: 'ring', jewel: true, lvl, sec: 'haste' });
  add(k + 'neck', 'jewelcrafting', `${t} Pendant`, req + 4, { lumenite: 5, curtainshard: n + 2 }, { slot: 'neck', jewel: true, lvl, sec: 'spi' });
  add(k + 'rshadow', 'jewelcrafting', `${t} Band of the Lamp`, req + 3, { lumenite: 5, duskbloom: 4, curtainshard: n }, { slot: 'ring', jewel: true, lvl, sec: 'rshadow' });
}
for (const [t, req, lvl, mat, armor, prof, parts, secs] of [
  ['Duskhide', T10, 38, 'duskhide', 'leather', 'leatherworking', ['Hood', 'Jerkin', 'Leggings', 'Boots'], ['crit', 'haste', 'dodge', 'crit']],
  ['Lampstalker', T11, 40, 'duskhide', 'leather', 'leatherworking', ['Hood', 'Jerkin', 'Leggings', 'Boots'], ['haste', 'crit', 'haste', 'dodge']],
  ['Wickweave', T10, 38, 'wickweave', 'cloth', 'tailoring', ['Cowl', 'Robe', 'Trousers', 'Slippers'], ['spi', 'haste', 'mreg', 'crit']],
  ['Lamplighter\'s', T11, 40, 'wickweave', 'cloth', 'tailoring', ['Cowl', 'Robe', 'Trousers', 'Slippers'], ['haste', 'spi', 'crit', 'mreg']]]) {
  const k = 'lc' + t.toLowerCase().replace(/[^a-z]/g, '');
  ['head', 'chest', 'legs', 'feet'].forEach((s, i) => add(k + s, prof, `${t} ${parts[i]}`, req + (s === 'chest' ? 3 : s === 'legs' ? 2 : 0), { [mat]: [8, 10, 9, 8][i], ...(req === T11 ? { curtainshard: 1, duskbloom: 2 } : { duskbloom: 1 }) }, { slot: s, armor, lvl, sec: secs[i] }));
}
add('lchpot', 'alchemy', 'Lampfoot Draughts (6)', 184, { duskbloom: 3 }, { pot: 'hpot', n: 6 });
add('lcmpot', 'alchemy', 'Curtainlight Draughts (6)', 186, { duskbloom: 3, curtainshard: 1 }, { pot: 'mpot', n: 6 });
add('curtainelixir', 'alchemy', 'Elixir of the Curtain', 192, { duskbloom: 4, curtainshard: 1 }, { cons: 'curtainelixir', n: 1 });
add('deepelixir', 'alchemy', 'Elixir of the Deep', 194, { duskbloom: 4, lumenite: 2 }, { cons: 'deepelixir', n: 1 });
add('lampfootfeast', 'cooking', 'Lampfoot Feast', 188, { meat: 7, duskbloom: 2 }, { cons: 'lampfootfeast', n: 3 });
add('ench17', 'enchanting', 'Enchant Weapon: Lamplight', 186, { dust: 18, shard: 8, curtainshard: 1 }, { ench: 'pow', n: 26, slot: 'weapon' });
add('ench18', 'enchanting', 'Enchant Chest: Wickward', 190, { dust: 18, shard: 8 }, { ench: 'sta', n: 32, slot: 'chest' });
add('ench19', 'enchanting', 'Enchant Weapon: Curtainswift', 194, { dust: 20, shard: 9, curtainshard: 1 }, { ench: 'haste', n: 5, slot: 'weapon' });
add('ench20', 'enchanting', 'Enchant Chest: Lampheart', 198, { dust: 18, shard: 8, curtainshard: 2 }, { ench: 'rshadow', n: 34, slot: 'chest' });
// rare recipes from the five raids of the Lamplighters' road, at the cap (80)
for (const [d, t] of [['glutted', 'Darkbreaker\'s'], ['drownedchoir', 'Tidewarden\'s'], ['scoutwreck', 'Eaterbane'], ['anvil', 'Maker\'s'], ['greatlamp', 'Lamplighter-Lord\'s']]) {
  const k = 'r14' + d.slice(0, 6);
  add(k + 'plate', 'smithing', `${t} Warplate`, 200, { lumenite: 16, curtainshard: 6, shard: 7 }, { slot: 'chest', armor: 'plate', lvl: 40, rar: 4, sec: 'parry' }, d);
  add(k + 'leather', 'leatherworking', `${t} Harness`, 200, { duskhide: 18, curtainshard: 6, shard: 7 }, { slot: 'chest', armor: 'leather', lvl: 40, rar: 4, sec: 'haste' }, d);
  add(k + 'robe', 'tailoring', `${t} Vestments`, 200, { wickweave: 18, curtainshard: 6, shard: 7 }, { slot: 'chest', armor: 'cloth', lvl: 40, rar: 4, sec: 'haste' }, d);
  add(k + 'ring', 'jewelcrafting', `${t} Signet`, 200, { lumenite: 8, curtainshard: 7, shard: 6 }, { slot: 'ring', jewel: true, lvl: 40, rar: 4, sec: 'crit' }, d);
  add(k + 'wpn', 'smithing', `${t} Weapon (for your class)`, 200, { lumenite: 18, curtainshard: 7, shard: 8 }, { slot: 'weapon', weapon: true, lvl: 40, rar: 4, sec: 'crit' }, d);
}
