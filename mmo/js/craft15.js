// Build 15: crafting for levels 41-45. The cap rises to 90 (stored as 225): 85 makes level-43 gear, 89 makes level-45
// gear, and the five raids of the road to the moon teach the best recipes at 90. New materials: moonsilver (ore from
// the Vale's cracks and the moon), moonmoss, shellhide, silverweave, and sleeper-shard, a sliver of the Sleeper's dream.
import * as Craft from './crafting.js';
import { ZSPEC } from './kit9.js';
import { NODES } from './crafting.js';

Object.assign(Craft.MATS, { moonsilver: { name: 'Moonsilver', icon: '🌕' }, moonmoss: { name: 'Moonmoss', icon: '🌿' }, shellhide: { name: 'Shellhide', icon: '🐚' }, silverweave: { name: 'Silverweave', icon: '🧵' }, sleepershard: { name: 'Sleeper-Shard', icon: '💜' } });
Object.assign(Craft.CONS, {
  moonfeast: { name: 'Tetherfoot Feast', icon: '🍲', buff: 'fed', data: { hp: .16, pow: .16 }, desc: '+16% health and power for 30 minutes.' },
  lullabyelixir: { name: 'Elixir of the Lullaby', icon: '🧪', buff: 'elixir', data: { pow: .18, crit: .05 }, desc: '+18% power and +5% critical chance for 30 minutes.' },
  shellelixir: { name: 'Elixir of the Shell', icon: '🧪', buff: 'elixir', data: { hp: .22, armor: .16 }, desc: '+22% health and +16% armor for 30 minutes.' },
});
for (const z of ['cv15', 'ht15', 'mr15', 'sh15', 'wh15']) { NODES[z] = [['moonsilver', 'ore', 'oresilver', 208, null, 22], ['moonmoss', 'herb', 'herbgrave', 208, null, 26]]; if (ZSPEC[z]) ZSPEC[z].nodes = NODES[z]; }
const add = Craft.addRecipe, T12 = 212, T13 = 222;
for (const [t, req, lvl, n] of [['Moonsilver', T12, 43, 1], ['Lullaby-Forged', T13, 45, 2]]) {
  const k = 'mc' + t.toLowerCase().replace(/[^a-z]/g, '');
  add(k + 'helm', 'smithing', `${t} Helm`, req, { moonsilver: 9, sleepershard: n }, { slot: 'head', armor: 'plate', lvl, sec: 'parry' });
  add(k + 'chest', 'smithing', `${t} Breastplate`, req + 3, { moonsilver: 11, sleepershard: n }, { slot: 'chest', armor: 'plate', lvl, sec: 'haste' });
  add(k + 'legs', 'smithing', `${t} Greaves`, req + 2, { moonsilver: 10, sleepershard: n }, { slot: 'legs', armor: 'plate', lvl, sec: 'block' });
  add(k + 'feet', 'smithing', `${t} Sabatons`, req, { moonsilver: 9, sleepershard: n }, { slot: 'feet', armor: 'plate', lvl, sec: 'dodge' });
  add(k + 'wpn', 'smithing', `${t} Weapon (for your class)`, req + 4, { moonsilver: 12, sleepershard: n + 1 }, { slot: 'weapon', weapon: true, lvl, sec: 'crit' });
  add(k + 'off', 'smithing', `${t} Off-hand (for your class)`, req + 3, { moonsilver: 10, sleepershard: n }, { slot: 'off', off: true, lvl, sec: 'haste' });
  add(k + 'ring', 'jewelcrafting', `${t} Ring`, req, { moonsilver: 7, sleepershard: n + 1 }, { slot: 'ring', jewel: true, lvl, sec: 'haste' });
  add(k + 'neck', 'jewelcrafting', `${t} Pendant`, req + 3, { moonsilver: 6, sleepershard: n + 2 }, { slot: 'neck', jewel: true, lvl, sec: 'spi' });
  add(k + 'rarc', 'jewelcrafting', `${t} Band of the Sleeper`, req + 2, { moonsilver: 6, moonmoss: 4, sleepershard: n }, { slot: 'ring', jewel: true, lvl, sec: 'rshadow' });
}
for (const [t, req, lvl, mat, armor, prof, parts, secs] of [
  ['Shellhide', T12, 43, 'shellhide', 'leather', 'leatherworking', ['Hood', 'Jerkin', 'Leggings', 'Boots'], ['crit', 'haste', 'dodge', 'crit']],
  ['Tetherwalker', T13, 45, 'shellhide', 'leather', 'leatherworking', ['Hood', 'Jerkin', 'Leggings', 'Boots'], ['haste', 'crit', 'haste', 'dodge']],
  ['Silverweave', T12, 43, 'silverweave', 'cloth', 'tailoring', ['Cowl', 'Robe', 'Trousers', 'Slippers'], ['spi', 'haste', 'mreg', 'crit']],
  ['Moonwatcher\'s', T13, 45, 'silverweave', 'cloth', 'tailoring', ['Cowl', 'Robe', 'Trousers', 'Slippers'], ['haste', 'spi', 'crit', 'mreg']]]) {
  const k = 'mc' + t.toLowerCase().replace(/[^a-z]/g, '');
  ['head', 'chest', 'legs', 'feet'].forEach((s, i) => add(k + s, prof, `${t} ${parts[i]}`, req + (s === 'chest' ? 3 : s === 'legs' ? 2 : 0), { [mat]: [9, 11, 10, 9][i], ...(req === T13 ? { sleepershard: 1, moonmoss: 2 } : { moonmoss: 1 }) }, { slot: s, armor, lvl, sec: secs[i] }));
}
add('mchpot', 'alchemy', 'Tetherfoot Draughts (6)', 210, { moonmoss: 3 }, { pot: 'hpot', n: 6 });
add('mcmpot', 'alchemy', 'Moonlight Draughts (6)', 212, { moonmoss: 3, sleepershard: 1 }, { pot: 'mpot', n: 6 });
add('lullabyelixir', 'alchemy', 'Elixir of the Lullaby', 219, { moonmoss: 4, sleepershard: 1 }, { cons: 'lullabyelixir', n: 1 });
add('shellelixir', 'alchemy', 'Elixir of the Shell', 221, { moonmoss: 4, moonsilver: 2 }, { cons: 'shellelixir', n: 1 });
add('moonfeast', 'cooking', 'Tetherfoot Feast', 215, { meat: 8, moonmoss: 2 }, { cons: 'moonfeast', n: 3 });
add('ench21', 'enchanting', 'Enchant Weapon: Moonlit', 214, { dust: 20, shard: 9, sleepershard: 1 }, { ench: 'pow', n: 30, slot: 'weapon' });
add('ench22', 'enchanting', 'Enchant Chest: Shellward', 217, { dust: 20, shard: 9 }, { ench: 'sta', n: 36, slot: 'chest' });
add('ench23', 'enchanting', 'Enchant Weapon: Tideswift', 220, { dust: 22, shard: 10, sleepershard: 1 }, { ench: 'haste', n: 6, slot: 'weapon' });
add('ench24', 'enchanting', 'Enchant Chest: Lullaby', 223, { dust: 20, shard: 9, sleepershard: 2 }, { ench: 'rshadow', n: 38, slot: 'chest' });
for (const [d, t] of [['faultbelow', 'Faultsealer\'s'], ['broodnest', 'Broodbreaker\'s'], ['moonwardeye', 'Mirrorbreaker\'s'], ['tether', 'Threadclimber\'s'], ['wakingheart', 'Sleepsinger\'s']]) {
  const k = 'r15' + d.slice(0, 6);
  add(k + 'plate', 'smithing', `${t} Warplate`, 225, { moonsilver: 18, sleepershard: 7, shard: 8 }, { slot: 'chest', armor: 'plate', lvl: 45, rar: 4, sec: 'parry' }, d);
  add(k + 'leather', 'leatherworking', `${t} Harness`, 225, { shellhide: 20, sleepershard: 7, shard: 8 }, { slot: 'chest', armor: 'leather', lvl: 45, rar: 4, sec: 'haste' }, d);
  add(k + 'robe', 'tailoring', `${t} Vestments`, 225, { silverweave: 20, sleepershard: 7, shard: 8 }, { slot: 'chest', armor: 'cloth', lvl: 45, rar: 4, sec: 'haste' }, d);
  add(k + 'ring', 'jewelcrafting', `${t} Signet`, 225, { moonsilver: 9, sleepershard: 8, shard: 7 }, { slot: 'ring', jewel: true, lvl: 45, rar: 4, sec: 'crit' }, d);
  add(k + 'wpn', 'smithing', `${t} Weapon (for your class)`, 225, { moonsilver: 20, sleepershard: 8, shard: 9 }, { slot: 'weapon', weapon: true, lvl: 45, rar: 4, sec: 'crit' }, d);
}
