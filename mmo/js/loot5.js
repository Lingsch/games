// Build 5: what the new dungeon bosses drop. Role set pieces (tank, healer, dps, mage, support) in two tiers,
// rare crafting recipes, and collectibles: vanity pets, titles and trophies.
import { S, pick, chat, X } from './core.js';
import { CLASSES, SETS, makeItem, RARITY, secondary } from './data.js';
import { DBOSSES, FINALS, dungeonOf } from './dungeons.js';
import { rareFrom, gearBudget } from './crafting.js';

// which set each class wears
export const SET_ROLE = { bulwark: 'tank', wardancer: 'tank', bladewarden: 'tank', cleric: 'healer', aegis: 'healer', lifebinder: 'healer',
  longwatch: 'dps', knifeshade: 'dps', blightblade: 'dps', elementalist: 'mage', warlock: 'mage', binder: 'mage', monk: 'support', druid: 'support', bard: 'support', illusionist: 'support' };
export const TIER = { keep: 0, grove: 0, catacombs: 1, mines: 1, teeth: 2, shrine: 2, brinevaults: 3, bonewhale: 3, barrows: 4, foundry: 4, witchroot: 4, cathedral: 4, gaol: 5, ossuary: 5, between: 6 };
export const TIER_LVL = [6, 10, 12, 15, 18, 20, 20, 22, 25, 25, 27, 30, 30, 32, 35, 35, 35, 37, 38, 39, 40, 40, 41, 42, 43, 44, 45, 45], TIER_K = [.5, 1, 1.25, 1.6, 1.9, 2.2, 2.8, 2.6, 3, 3.5, 3.6, 4.1, 4.6, 4.4, 5, 5.5, 6.2, 6.4, 6.8, 7.2, 7.6, 8.4, 8.2, 8.6, 9, 9.4, 9.9, 10.8], TIER_BUDGET = [1, 1, 1, 1, 1, 1.1, 1.35, 1.1, 1.2, 1.45, 1.1, 1.2, 1.45, 1.1, 1.2, 1.45, 1.7, 1.25, 1.3, 1.35, 1.5, 1.8, 1.4, 1.45, 1.5, 1.55, 1.7, 2];
const SETNAME = [{ tank: 'Gatewarden', healer: 'Mercyward', dps: 'Cutpurse', mage: 'Hedge-Witch', support: 'Wayfarer' }, { tank: 'Bonewall', healer: 'Lantern-Keeper', dps: 'Gravecutter', mage: 'Dirge-Weaver', support: 'Deepsong' },
  { tank: 'Saltbreaker', healer: 'Lamplight', dps: "Wrecker's", mage: 'Tidecaller', support: 'Driftwood' }, { tank: 'Admiralty', healer: 'Lightkeeper', dps: 'Riptide', mage: 'Abyssal', support: 'Shanty' },
  { tank: 'Emberguard', healer: 'Orrinite', dps: 'Ashstalker', mage: 'Blightbane', support: 'Barrowsong' }, { tank: 'Gaolbreaker', healer: "Pilgrim's", dps: 'Legionbane', mage: 'Hollowfire', support: 'Throne-Herald' },
  { tank: 'Gravebreaker', healer: 'Lifebound', dps: 'Riftreaver', mage: 'Voidwoven', support: 'Worldsinger' },
  { tank: 'Deepwarden', healer: 'Rimelight', dps: 'Crownsworn', mage: 'Starless', support: 'Wanderer' }, { tank: 'Bulwark-Royal', healer: 'Hearthmother', dps: 'Frostfang', mage: 'Undermage', support: 'Far-Traveller' },
  { tank: 'Kingsguard Eternal', healer: 'Dawnmantle', dps: 'Nightreaver', mage: 'Worldwright', support: 'Firstsong' },
  { tank: 'Skyward Aegis', healer: 'Cloudmender', dps: 'Galecutter', mage: 'Stormglass', support: 'Windsinger' }, { tank: 'Spire-Warden', healer: 'Starmantle', dps: 'Skyreaver', mage: 'Astral', support: 'Zenith' },
  { tank: 'Heavenbreaker', healer: 'Firmament', dps: 'Starfall', mage: 'Celestine', support: 'Empyrean' },
  // Build 13: the lands Vhorun broke, the Frost-King's halls, and the 24-person raids
  { tank: 'Woundwarden', healer: 'Emberlamp', dps: 'Cinderstalk', mage: 'Riftwoven', support: 'Lightless' }, { tank: 'Rimebound', healer: 'Thawmother', dps: 'Hoarfang', mage: 'Glacial', support: 'Snowsong' },
  { tank: 'Frost-King\'s Bane', healer: 'Hearthbringer', dps: 'Kingslayer', mage: 'Winterbreaker', support: 'Homecoming' }, { tank: 'Lampbearer', healer: 'Last Light', dps: 'Godbreaker', mage: 'Unmaker', support: 'Worldsong' },
  // Build 14: the Lamplighters' road, 36-40 (17 the Reach, 18 the Hollows, 19 Starfall and the Forge, 20 the Great Lamp, 21 its raids)
  { tank: 'Wayshrine', healer: 'Lampwick', dps: 'Darkstalker', mage: 'Gutterflame', support: 'Nightwalk' }, { tank: 'Tidewarden', healer: 'Pearl-Lamp', dps: 'Deepcutter', mage: 'Drowned Choir', support: 'Undertow' },
  { tank: 'Starforged', healer: 'Lightwright', dps: 'Scoutbreaker', mage: 'Eater\'s Bane', support: 'Starsinger' }, { tank: 'Lamplighter', healer: 'Curtainkeeper', dps: 'Wickcutter', mage: 'Lanternwright', support: 'Dawnwalker' },
  { tank: 'Hulrouhn\'s Shield', healer: 'Great Lamp', dps: 'Hungerbreaker', mage: 'Curtainweaver', support: 'Lightsong' },
  // Build 15: the moon road (tiers 22-27, levels 41-45)
  { tank: 'Faultwarden', healer: 'Vale-Mender', dps: 'Cracksplitter', mage: 'Quakecaller', support: 'Hearthward' }, { tank: 'Nestguard', healer: 'Broodmother', dps: 'Shellcutter', mage: 'Hatchling', support: 'Nursery' },
  { tank: 'Moonroad', healer: 'Pale Lantern', dps: 'Towerbreaker', mage: 'Moonbeam', support: 'Pilgrim\'s' }, { tank: 'Shellbound', healer: 'Silverblood', dps: 'Chitincleaver', mage: 'Shellsinger', support: 'Undercroft' },
  { tank: 'Sleeper\'s Wall', healer: 'Lullaby', dps: 'Wakebreaker', mage: 'Dreamweaver', support: 'Moonward' }, { tank: 'Last Lamplighter', healer: 'Hulrouhn\'s Mercy', dps: 'Sleeperbane', mage: 'Moonbreaker', support: 'Curtainbearer' }];
const BONUS = { tank: [{ sta: 8 }, { sta: 20, pow: 4 }], healer: [{ pow: 6 }, { pow: 10, crit: 3 }], dps: [{ crit: 3 }, { pow: 14 }], mage: [{ pow: 8 }, { pow: 8, crit: 3 }], support: [{ sta: 6, pow: 4 }, { sta: 8, pow: 8 }] };
for (const t of SETNAME.keys()) for (const [role, nm] of Object.entries(SETNAME[t])) {
  const b = BONUS[role], k = TIER_K[t], sc = o => Object.fromEntries(Object.entries(o).map(([s, v]) => [s, Math.round(v * k * 10) / 10]));
  const two = sc(b[0]), four = sc(b[1]), fmt = o => Object.entries(o).map(([s, v]) => `+${v}${s === 'crit' ? '% crit' : ' ' + ({ pow: 'to your main stat', sta: 'stamina' }[s] || s)}`).join(', ');
  SETS[`s${t}_${role}`] = { name: nm, bonus: { 2: two, 4: four }, desc: `2 pieces: ${fmt(two)}. 4 pieces: ${fmt(four)}.` };
}
const PIECE = { head: { plate: 'Helm', leather: 'Hood', cloth: 'Circlet' }, chest: { plate: 'Breastplate', leather: 'Jerkin', cloth: 'Robe' }, legs: { plate: 'Greaves', leather: 'Leggings', cloth: 'Trousers' }, feet: { plate: 'Sabatons', leather: 'Boots', cloth: 'Slippers' } };
export function setPieceFor(cls, tier) {
  const role = SET_ROLE[cls], slot = pick(['head', 'chest', 'legs', 'feet']), at = CLASSES[cls].armor, L = TIER_LVL[tier], budget = gearBudget(L, slot) * TIER_BUDGET[tier];
  const lean = { tank: [.65, .25], healer: [.4, .5], dps: [.3, .6], mage: [.3, .6], support: [.5, .45] }[role];
  const stats = { sta: Math.round(budget * lean[0]), pow: Math.round(budget * lean[1]), arm: Math.round((at === 'plate' ? 3 : at === 'leather' ? 2 : 1) * (1 + L * .8) * (role === 'tank' ? 2.3 : 1.9)) };
  if (role === 'dps' || role === 'mage') stats.crit = +(1 + L * .1).toFixed(1);
  // Build 13: the new tiers carry secondaries, and the raid tiers the resistance the next raid asks for
  if (tier >= 13) { const sec = { tank: pick(['dodge', 'parry']), healer: pick(['haste', 'spi', 'mreg']), dps: 'haste', mage: 'haste', support: pick(['haste', 'spi']) }[role]; secondary(stats, sec, L, 3, budget); if (tier >= 14) secondary(stats, tier === 14 ? 'rfrost' : 'rshadow', L, 3, budget * .7); }
  return makeItem({ forCls: cls, name: `${SETNAME[tier][role]} ${PIECE[slot][at]}`, slot, type: at, armorType: at, lvl: L, rarity: tier === 6 || tier === 9 || tier === 12 || tier === 15 || tier === 16 || tier === 20 || tier === 21 || tier >= 26 ? 4 : 3, set: `s${tier}_${role}`, stats, value: Math.round((3 + L * 4) * 6) });
}

// ---------- collectibles ----------
export const COLLECT = {
  pet_mastiff: { type: 'pet', name: 'Mastiff Pup', kind: 'wolf', scale: .45, from: 'keep' },
  pet_grovelet: { type: 'pet', name: 'Grovelet', kind: 'treant', scale: .45, from: 'grove' },
  pet_wisp: { type: 'pet', name: 'Little Wail', kind: 'ghostnpc', scale: .55, from: 'catacombs' },
  pet_pebble: { type: 'pet', name: 'Pebble', kind: 'golempet', scale: .4, from: 'mines' },
  title_king: { type: 'title', name: 'Kingbreaker', from: 'keep' },
  title_green: { type: 'title', name: 'of the Green', from: 'grove' },
  title_hymn: { type: 'title', name: 'Hymnbreaker', from: 'catacombs' },
  title_deep: { type: 'title', name: 'the Deep-Delver', from: 'mines' },
  title_eye: { type: 'title', name: 'the Sharp-Eyed', from: 'mystery' },
  trophy_crown: { type: 'trophy', name: "Varro's Melted Crown", desc: 'Made from melted church plate. It still smells faintly of incense.', from: 'keep' },
  trophy_seeds: { type: 'trophy', name: "Syra's Seed Pouch", desc: 'The seeds inside are grey. Fenna says to never, ever plant them.', from: 'grove' },
  trophy_fork: { type: 'trophy', name: "Seln's Tuning Fork", desc: 'Bent. If you strike it, the whole room goes cold for a moment.', from: 'catacombs' },
  trophy_pick: { type: 'trophy', name: "Korr's Pickaxe", desc: 'The handle is worn smooth by a century of digging that never stopped.', from: 'mines' },
};
export const owned = k => (S.collection || []).includes(k);
export function collect(k) { S.collection = S.collection || []; if (owned(k)) return false; S.collection.push(k); const c = COLLECT[k]; chat('loot', null, `New ${c.type}: ${c.name}!`); return true; }
const tokenItem = k => { const c = COLLECT[k]; return makeItem({ name: c.type === 'title' ? `Title: ${c.name}` : c.name, slot: 'collect', collect: k, lvl: 1, rarity: 3, stats: {}, value: 0 }); };
const recipeItem = r => makeItem({ name: `Recipe: ${r.name}`, slot: 'recipe', recipe: r.id, lvl: 1, rarity: 2, stats: {}, value: 20 });

// a boss's drop list (called from combat when a dungeon boss dies)
export function bossLoot(e, party) {
  const d = dungeonOf(e.mob); if (!d || !e.named) return null;
  const out = [], tier = X.hardTier?.() ?? (S.zone?.startsWith('h_') ? 5 : TIER[d] ?? 0), fin = FINALS.includes(e.mob);   // heroics drop level-20 sets
  const people = party.filter(p => p && p.cls);
  for (let i = 0; i < (fin ? 2 : 1); i++) { const who = Math.random() < .5 || !people.length ? S.hero : pick(people); out.push(setPieceFor(who.cls, tier)); }
  const rares = rareFrom(d).filter(r => !(S.recipes || []).includes(r.id));
  if (rares.length && Math.random() < (fin ? .45 : .2)) out.push(recipeItem(pick(rares)));
  const mine = Object.entries(COLLECT).filter(([k, c]) => c.from === d && !owned(k));
  if (fin) for (const [k, c] of mine) if (c.type !== 'pet' && c.type !== 'mount') out.push(tokenItem(k));
  const mt = mine.find(([, c]) => c.type === 'mount'); if (mt && fin && Math.random() < .1) out.push(tokenItem(mt[0]));
  const pet = mine.find(([, c]) => c.type === 'pet'); if (pet && Math.random() < (fin ? .35 : .12)) out.push(tokenItem(pet[0]));
  return out;
}
