// Build 7: deeds. A list of things worth doing, with titles and a little gold for the best of them.
import { S, chat, floatText, X } from './core.js';
import { QUESTS, CLASSES, CLASS_KEYS } from './data.js';
import { FINALS } from './dungeons.js';
import * as Loot5 from './loot5.js';
import * as Rep from './rep6.js';
const C = () => (S.ext.cnt = S.ext.cnt || {});
const turned = () => Object.values(S.quests || {}).filter(q => q.state === 'turned').length;
const fin = k => !!S.ext.finals?.[k], hfin = k => !!S.ext.hfinals?.[k];
const at20 = k => (S.classes[k]?.lvl || 0) >= 20;
const VALE_F = ['varro', 'syra', 'seln', 'korr'], COAST_F = ['blackhallow', 'calloway', 'vey', 'hollowwhale'], WASTE_F = ['oldkingaldous', 'forgemasterkael', 'grandmotherroot', 'archdeaconvesh', 'gaolerking', 'gravelordshand'];
export const DEEDS = [
  // [id, name, how, test, reward]
  ['k100', 'Blooded', 'Defeat 100 enemies with your group.', () => C().kills >= 100, { gold: 10 }],
  ['k1000', 'Veteran', 'Defeat 1,000 enemies.', () => C().kills >= 1000, { gold: 50 }],
  ['k5000', 'Scourge of the Dead', 'Defeat 5,000 enemies.', () => C().kills >= 5000, { title: 'the Scourge' }],
  ['n10', 'Rare Hunter', 'Defeat 10 named rares.', () => C().named >= 10, { gold: 25 }],
  ['n30', 'Trophy Wall', 'Defeat 30 named rares.', () => C().named >= 30, { title: 'the Huntsman' }],
  ['l10', 'Coming of Age', 'Reach level 10.', () => S.hero?.lvl >= 10, { gold: 10 }],
  ['l20', 'At the Summit', 'Reach level 20.', () => S.hero?.lvl >= 20, { gold: 50 }],
  ['fam', 'Fourfold', 'Reach 20 as a Fighter, a Healer, a Rogue and a Mage.', () => ['Fighter', 'Healer', 'Rogue', 'Mage'].every(f => CLASS_KEYS.some(k => CLASSES[k].family === f && at20(k))), { title: 'the Fourfold' }],
  ['all16', 'Sixteen Souls', 'Reach 20 in all sixteen classes.', () => CLASS_KEYS.every(at20), { title: 'of Sixteen Souls' }],
  ['q50', 'Helpful', 'Complete 50 quests.', () => turned() >= 50, { gold: 20 }],
  ['q150', 'Errand-Runner of the Realm', 'Complete 150 quests.', () => turned() >= 150, { gold: 60 }],
  ['q250', 'Loremaster', 'Complete 250 quests.', () => turned() >= 250, { title: 'the Loremaster' }],
  ['vale', 'Delver of the Vale', "Defeat the final bosses of the Vale's four dungeons.", () => VALE_F.every(fin), { gold: 30 }],
  ['coast', 'Saltwise', "Defeat the final bosses of the coast's four dungeons.", () => COAST_F.every(fin), { gold: 40 }],
  ['waste', 'Wastewalker', "Defeat the final bosses of the wastes' six dungeons.", () => WASTE_F.every(fin), { title: 'the Wastewalker' }],
  ['h1', 'Heroic', 'Defeat the final boss of any heroic dungeon.', () => Object.keys(S.ext.hfinals || {}).length >= 1, { gold: 50 }],
  ['h8', 'Heroic of the Realm', 'Defeat the final boss of all eight heroic dungeons.', () => [...VALE_F, ...COAST_F].every(hfin), { title: 'the Heroic' }],
  ['raid', 'Between Worlds', 'Defeat the Gravelord.', () => !!S.flags?.gravelordDead, { gold: 100 }],
  ['raidall', 'Rift-Walker', 'Defeat every boss in Between Worlds.', () => ['gatewarden', 'bonefather', 'sorrow', 'spite', 'choir', 'colossus', 'nocturne', 'engine', 'gravelord'].every(fin), { title: 'the Rift-Walker' }],
  ['case3', 'Three for Three', 'Name the right killer in all three murder cases.', () => S.flags?.case1 === 'linus' && ['rennick', 'linus'].includes(S.flags?.case2) && S.flags?.case3 === 'tally', { title: 'the Unfooled' }],
  ['prof', 'Master Crafter', 'Reach 100 in any profession.', () => Object.values(S.prof || {}).some(v => v >= 100), { title: 'the Master Crafter' }],
  ['g500', 'Busy Hands', 'Gather from 500 nodes, pools or wrecks.', () => C().gathered >= 500, { gold: 30 }],
  ['ex1', 'Exalted', 'Reach Exalted with any faction.', () => Object.keys(Rep.FACTIONS).some(f => Rep.standing(f) >= 4), { gold: 50 }],
  ['ex5', 'Beloved of the Realm', 'Reach Exalted with all five factions.', () => Object.keys(Rep.FACTIONS).every(f => Rep.standing(f) >= 4), { title: 'the Beloved' }],
  ['m5', 'Stablemaster', 'Own 5 mounts.', () => Rep.mounts().length >= 5, { gold: 30 }],
  ['m10', 'A Horse for Every Day', 'Own 10 mounts.', () => Rep.mounts().length >= 10, { title: 'the Horselord' }],
  ['guild', 'Joiner', 'Join or found a guild.', () => !!S.ext.guild, { gold: 5 }],
  ['glv5', 'Guild of Renown', 'Reach guild level 5.', () => (S.ext.guild?.lvl || 0) >= 5, { gold: 50 }],
  ['ah20', 'Merchant Prince', 'Sell 20 things at the auction house.', () => C().sold >= 20, { title: 'the Merchant Prince' }],
  ['raids5', 'Farmer\'s Friend', 'Break 5 brigand raids in the Vale.', () => C().raids >= 5, { gold: 30 }],
  ['soul1', 'Soulbound', 'Earn a soulbound weapon.', () => QUESTS.some(q => q.soul && S.quests[q.id]?.state === 'turned'), { gold: 40 }],
  ['soul4', 'Four Souls', 'Earn a soulbound weapon in each of the four families.', () => ['Fighter', 'Healer', 'Rogue', 'Mage'].every(f => QUESTS.some(q => q.soul && CLASSES[q.soul].family === f && S.quests[q.id]?.state === 'turned')), { title: 'the Soul-Forged' }],
  ['world', 'Wayfarer', 'Set foot in the Vale, the coast and the wastes.', () => ['vale', 'coast', 'wastes'].every(z => S.ext.seen?.[z]), { gold: 10 }],
];
// titles the deeds give
for (const [id, , , , r] of DEEDS) if (r.title) Loot5.COLLECT['title_d_' + id] = { type: 'title', name: r.title, from: 'deed' };
X.kill.push(m => {
  const c = C(); c.kills = (c.kills || 0) + 1; if (m.named && !m.boss && !m.boss2) c.named = (c.named || 0) + 1;
  if (FINALS.includes(m.mob) || m.raidBoss) { S.ext.finals = S.ext.finals || {}; S.ext.finals[m.mob] = 1; if (S.zone?.startsWith('h_')) { S.ext.hfinals = S.ext.hfinals || {}; S.ext.hfinals[m.mob] = 1; } }
});
X.gathered = X.gathered || []; X.gathered.push(() => { C().gathered = (C().gathered || 0) + 1; });
X.zone.push(zone => { S.ext.seen = S.ext.seen || {}; S.ext.seen[zone] = 1; });
let dT = 3;
X.tick.push(dt => {
  if ((dT -= dt) > 0 || !S.hero) return; dT = 3;
  S.ext.ach = S.ext.ach || {}; let shown = false;
  for (const [id, name, , test, r] of DEEDS) {
    if (S.ext.ach[id]) continue;
    let ok = false; try { ok = test(); } catch (e) { }
    if (!ok) continue;
    S.ext.ach[id] = Date.now();
    chat('sys', null, `Deed done: ${name}!`); if (!shown) { shown = true; floatText(S.hero, `Deed: ${name}`, '#ffd34d', true); }
    if (r.gold) S.gold += r.gold;
    if (r.title) Loot5.collect('title_d_' + id);
  }
});
X.book.push(['deeds', 'Deeds', body => {
  const { el, esc } = X.ui, done = S.ext.ach || {};
  body.appendChild(el(`<p style="margin:0 0 6px">${Object.keys(done).length} of ${DEEDS.length} done.</p>`));
  for (const [id, name, how, , r] of DEEDS) body.appendChild(el(`<div class="who" style="opacity:${done[id] ? 1 : .6}"><div><b>${done[id] ? '✓' : '·'} ${esc(name)}</b> <small>${esc(how)}${r.title ? ` · title: ${esc(r.title)}` : r.gold ? ` · ${r.gold}g` : ''}</small></div></div>`));
}]);
