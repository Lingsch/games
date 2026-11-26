// Build 9: shared pieces for the three 20-25 lands (the Underdark, the Rimewild and the kingdom of Corrand),
// which all open off the Blighted Wastes once you reach level 20: down, north, and east.
import { S, X, chat, WH } from './core.js';
import { CLASSES, CLASS_KEYS, xpNeed, GIVERS } from './data.js';
import { world, zoneMarker, ZONE_SIZE } from './world.js';
import { LFG_D } from './social6.js';
import * as Rep from './rep6.js';
import * as Loot5 from './loot5.js';
import { addKinds } from './render.js';
import * as Craft from './crafting.js';
Object.assign(Craft.MATS, { starsteel: { name: 'Starsteel Ore', icon: '🌑' }, deepcap: { name: 'Deepcap', icon: '🍄' }, rimeiron: { name: 'Rime-Iron Ore', icon: '🧊' }, frostbloom: { name: 'Frostbloom', icon: '❄️' }, crowngold: { name: 'Crown-Gold Ore', icon: '🪙' }, kingsfoil: { name: 'Kingsfoil', icon: '🌿' } });

export const HI_ZONES = ['deep', 'north', 'crown'];
export const qx = (lvl, f) => Math.round(xpNeed(Math.min(lvl, 24)) * f * .5), qg = lvl => Math.round(8 + lvl * 4);
export const B = { beast: true }, U = { undead: true }, HU = { human: true };
export const mob = (name, kind, o) => ({ name, kind, hpM: 1.1, dmgM: 1.1, spd: 5.4, range: 2.4, weak: 'fire', resist: null, scale: 1, aggro: 12, social: 14, ...o });
export const boss = (name, kind, o) => ({ name, kind, hpM: 1.2, dmgM: 1.1, spd: 5.2, range: 2.8, weak: 'holy', resist: null, scale: 1.5, aggro: 15, social: 20, ...o });
export const rboss = (name, kind, o) => ({ name, kind, hpM: 2.3, dmgM: 1.5, spd: 5.2, range: 3.2, weak: null, resist: null, scale: 2, aggro: 18, social: 30, raidBoss: true, ...o });
// every 20-25 land is slow to level in, like the wastes
X.xpMul.push(() => HI_ZONES.includes(S.zone) || X.HI_INST?.has(S.zone) ? .7 : 1);
X.HI_INST = new Set();
X.RAIDS = X.RAIDS || new Set();
X.fakeLvlHooks = X.fakeLvlHooks || [];
X.fakeLvlHooks.push(zone => HI_ZONES.includes(zone) ? Math.max(20, Math.min(25, Math.round(20 + Math.random() ** 1.2 * 5))) : null);

// ---------- out of the wastes: three roads at level 20 ----------
const OUT = [{ to: 'north', x: -360, z: -616, ry: 0, label: 'North into the Rimewild (levels 20-25)' }, { to: 'crown', x: 616, z: 120, ry: Math.PI / 2, label: 'East into the kingdom of Corrand (levels 20-25)' },
  { to: 'deep', x: 230, z: -470, ry: 0, label: 'Climb down the chasm into the Underdark (levels 20-25)', chasm: true }];
X.edgeOpen = (zone, x, z) => zone === 'wastes' && OUT.some(o => !o.chasm && (o.ry === 0 ? Math.abs(x - o.x) < 12 && z < -WH + 70 : Math.abs(z - o.z) < 12 && x > WH - 70));
X.zone.push(zone => {
  if (zone !== 'wastes') return;
  for (const o of OUT) { world.zoneLines.push({ x: o.x, z: o.z, r: o.chasm ? 6 : 9, to: o.to, label: o.label }); zoneMarker(o.x, o.z, o.ry); world.places.push({ name: o.chasm ? 'The Chasm' : o.to === 'north' ? 'The Road to the Rimewild' : 'The Road to Corrand', x: o.x, z: o.z, R: 10, kind: 'place' }); }
});
const ARRIVE = { deep: { x: 0, z: 470 }, north: { x: 0, z: 470 }, crown: { x: -470, z: 0 } };
X.arriveHooks = X.arriveHooks || [];
X.arriveHooks.push((zone, from) => {
  if (ARRIVE[zone] && (from === 'wastes' || !from)) return ARRIVE[zone];
  if (zone === 'wastes' && HI_ZONES.includes(from)) { const o = OUT.find(v => v.to === from); return { x: o.x + (o.ry === 0 ? 0 : -22), z: o.z + (o.ry === 0 ? 22 : 0) + (o.chasm ? 10 : 0) }; }
  return null;
});
// you can't pass the borders of the wastes until you're 20
X.gate = X.gate || {};
for (const z of HI_ZONES) X.gate[z] = () => (S.hero?.lvl || 0) < 20 ? 'This road is for level 20 and beyond.' : null;

// ---------- raids: level 24, and one class from each family at 20 ----------
const FAMS = ['Fighter', 'Healer', 'Rogue', 'Mage'];
export function raidWhy25() {
  if ((S.hero?.lvl || 0) < 24) return 'This raid is for level 24 and above.';
  const missing = FAMS.filter(f => !CLASS_KEYS.some(k => CLASSES[k].family === f && (S.classes[k]?.lvl || 0) >= 20));
  return missing.length ? `You need a ${missing.join(', a ')} at level 20 first.` : null;
}
export function addRaid(key, name) { X.RAIDS.add(key); X.HI_INST.add(key); X.gate[key] = raidWhy25; LFG_D[key] = { name: `${name} (12-person raid)`, lvl: [24, 25], zone: key, raid: raidWhy25 }; }
export function addDungeonLFG(key, name, lvl) { X.HI_INST.add(key); LFG_D[key] = { name, lvl, zone: key }; }
export function tier(map) { Object.assign(Loot5.TIER, map); }

// ---------- factions and their rewards ----------
export function faction(key, name, icon, qmKey, rewards, mobs) {
  Rep.FACTIONS[key] = { name, icon, qm: 'vendor:' + qmKey };
  Rep.REWARDS[key] = rewards;
  for (const m of mobs) Rep.KILL_REP[m] = [key, 6];
}
export function mount(key, name, kind, coat, mane, tack, armored, from = 'rep') {
  addKinds({ [kind]: [Rep.horse(coat, mane, tack, armored), Rep.HORSE, .05, .03] });
  Loot5.COLLECT[key] = { type: 'mount', name, kind, spd: .85, ride: 1, from };
}
// quest defaults: xp and gold by level, and the text the quest log shows
export function finishQuests(list) { for (const q of list) { if (q.xp == null) q.xp = qx(q.lvl, q.daily ? .3 : q.story ? (q.obj.named ? .75 : .5) : q.obj.named ? .65 : .42); if (q.gold == null) q.gold = qg(q.lvl); q.text = q.text || (typeof q.say[0] === 'string' ? q.say[0] : q.say[0][1]); } return list; }
export const giver = (k, name, title, model) => { GIVERS[k] = { name, title, model }; };
