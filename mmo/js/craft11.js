// Build 11: crafting for levels 25-30. Still two points of skill for every level of gear, so the cap rises to 60
// (stored as 150): 51 makes level-27 gear, 57 makes level-30 gear, and the three sky raids teach recipes at 60.
import * as Craft from './crafting.js';

Object.assign(Craft.CONS, {
  skyfeast: { name: 'Cloudbloom Feast', icon: '🍰', buff: 'fed', data: { hp: .1, pow: .1 }, desc: '+10% health and power for 30 minutes.' },
  starelixir: { name: 'Elixir of the Starward', icon: '🧪', buff: 'elixir', data: { pow: .12, crit: .03 }, desc: '+12% power and +3% critical chance for 30 minutes.' },
  stoneelixir: { name: 'Elixir of Cloudstone', icon: '🧪', buff: 'elixir', data: { hp: .15, armor: .1 }, desc: '+15% health and +10% armor for 30 minutes.' },
});
const add = Craft.addRecipe, T6 = 128, T7 = 143;
for (const [t, req, lvl, ex] of [['Skysilver', T6, 27, 'starstone'], ['Starforged', T7, 30, 'heartstar']]) {
  const k = 'sk' + t.toLowerCase();
  add(k + 'helm', 'smithing', `${t} Helm`, req, { skysilver: 6, [ex]: 1 }, { slot: 'head', armor: 'plate', lvl });
  add(k + 'chest', 'smithing', `${t} Breastplate`, req + 3, { skysilver: 8, [ex]: 1 }, { slot: 'chest', armor: 'plate', lvl });
  add(k + 'legs', 'smithing', `${t} Greaves`, req + 2, { skysilver: 7, [ex]: 1 }, { slot: 'legs', armor: 'plate', lvl });
  add(k + 'feet', 'smithing', `${t} Sabatons`, req, { skysilver: 6, [ex]: 1 }, { slot: 'feet', armor: 'plate', lvl });
  add(k + 'wpn', 'smithing', `${t} Weapon (for your class)`, req + 4, { skysilver: 9, [ex]: 2 }, { slot: 'weapon', weapon: true, lvl });
  add(k + 'off', 'smithing', `${t} Off-hand (for your class)`, req + 5, { skysilver: 7, [ex]: 1 }, { slot: 'off', off: true, lvl });
  add(k + 'ring', 'jewelcrafting', `${t} Ring`, req, { skysilver: 4, [ex]: 2 }, { slot: 'ring', jewel: true, lvl });
  add(k + 'neck', 'jewelcrafting', `${t} Pendant`, req + 4, { skysilver: 3, [ex]: 3 }, { slot: 'neck', jewel: true, lvl });
}
for (const [t, req, lvl, mat, armor, prof, parts] of [['Stormhide', T6, 27, 'stormhide', 'leather', 'leatherworking', ['Hood', 'Jerkin', 'Leggings', 'Boots']], ['Thunderborn', T7, 30, 'stormhide', 'leather', 'leatherworking', ['Hood', 'Jerkin', 'Leggings', 'Boots']],
  ['Starweave', T6, 27, 'starweave', 'cloth', 'tailoring', ['Cowl', 'Robe', 'Trousers', 'Slippers']], ['Firmament', T7, 30, 'starweave', 'cloth', 'tailoring', ['Cowl', 'Robe', 'Trousers', 'Slippers']]]) {
  const k = 'sk' + t.toLowerCase();
  ['head', 'chest', 'legs', 'feet'].forEach((s, i) => add(k + s, prof, `${t} ${parts[i]}`, req + (s === 'chest' ? 3 : s === 'legs' ? 2 : 0), { [mat]: [6, 8, 7, 6][i], ...(req === T7 ? { heartstar: 1, cloudbloom: 2 } : { cloudbloom: 1 }) }, { slot: s, armor, lvl }));
}
add('skhpot', 'alchemy', 'Sky Draughts (6)', 128, { cloudbloom: 3 }, { pot: 'hpot', n: 6 });
add('skmpot', 'alchemy', 'Starlight Draughts (6)', 130, { cloudbloom: 3, starstone: 1 }, { pot: 'mpot', n: 6 });
add('starelixir', 'alchemy', 'Elixir of the Starward', 140, { cloudbloom: 3, heartstar: 1 }, { cons: 'starelixir', n: 1 });
add('stoneelixir', 'alchemy', 'Elixir of Cloudstone', 145, { cloudbloom: 3, skysilver: 2 }, { cons: 'stoneelixir', n: 1 });
add('skyfeast', 'cooking', 'Cloudbloom Feast', 135, { meat: 5, cloudbloom: 2 }, { cons: 'skyfeast', n: 3 });
add('ench9', 'enchanting', 'Enchant Weapon: Thunderstrike', 132, { dust: 14, shard: 6, heartstar: 1 }, { ench: 'pow', n: 16, slot: 'weapon' });
add('ench10', 'enchanting', 'Enchant Chest: Cloudstone Ward', 138, { dust: 14, shard: 6 }, { ench: 'sta', n: 20, slot: 'chest' });
add('ench11', 'enchanting', 'Enchant Weapon: Starfall', 148, { dust: 16, shard: 7, heartstar: 2 }, { ench: 'crit', n: 6, slot: 'weapon' });
// rare recipes from the three sky raids: crafted pieces that stand beside raid drops
for (const [d, t] of [['thunderthrone', 'Thunder-King\'s'], ['prismcourt', 'Ascendant'], ['stargate', 'Gate-Closer\'s']]) {
  const k = d.slice(0, 5);
  add(k + 'plate', 'smithing', `${t} Warplate`, 150, { skysilver: 12, heartstar: 4, shard: 5 }, { slot: 'chest', armor: 'plate', lvl: 30, rar: 4 }, d);
  add(k + 'leather', 'leatherworking', `${t} Harness`, 150, { stormhide: 14, heartstar: 4, shard: 5 }, { slot: 'chest', armor: 'leather', lvl: 30, rar: 4 }, d);
  add(k + 'robe', 'tailoring', `${t} Vestments`, 150, { starweave: 14, heartstar: 4, shard: 5 }, { slot: 'chest', armor: 'cloth', lvl: 30, rar: 4 }, d);
  add(k + 'ring', 'jewelcrafting', `${t} Signet`, 150, { skysilver: 6, heartstar: 5, shard: 4 }, { slot: 'ring', jewel: true, lvl: 30, rar: 4 }, d);
  add(k + 'wpn', 'smithing', `${t} Weapon (for your class)`, 150, { skysilver: 14, heartstar: 5, shard: 6 }, { slot: 'weapon', weapon: true, lvl: 30, rar: 4 }, d);
}
