// Build 5: what the new dungeon bosses drop. Role set pieces (tank, healer, dps, mage, support) in two tiers,
// rare crafting recipes, and collectibles: vanity pets, titles and trophies.
import { S, pick, chat } from './core.js';
import { CLASSES, SETS, makeItem, RARITY } from './data.js';
import { DBOSSES, FINALS, dungeonOf } from './dungeons.js';
import { rareFrom, gearBudget } from './crafting.js';

// which set each class wears
export const SET_ROLE = { bulwark: 'tank', wardancer: 'tank', bladewarden: 'tank', cleric: 'healer', aegis: 'healer', lifebinder: 'healer',
  longwatch: 'dps', knifeshade: 'dps', blightblade: 'dps', elementalist: 'mage', warlock: 'mage', binder: 'mage', monk: 'support', druid: 'support', bard: 'support', illusionist: 'support' };
export const TIER = { keep: 0, grove: 0, catacombs: 1, mines: 1, teeth: 2, shrine: 2, brinevaults: 3, bonewhale: 3 };
const TIER_LVL = [6, 10, 12, 15], TIER_K = [.5, 1, 1.25, 1.6];
const SETNAME = [{ tank: 'Gatewarden', healer: 'Mercyward', dps: 'Cutpurse', mage: 'Hedge-Witch', support: 'Wayfarer' }, { tank: 'Bonewall', healer: 'Lantern-Keeper', dps: 'Gravecutter', mage: 'Dirge-Weaver', support: 'Deepsong' },
  { tank: 'Saltbreaker', healer: 'Lamplight', dps: "Wrecker's", mage: 'Tidecaller', support: 'Driftwood' }, { tank: 'Admiralty', healer: 'Lightkeeper', dps: 'Riptide', mage: 'Abyssal', support: 'Shanty' }];
const BONUS = { tank: [{ sta: 8 }, { sta: 20, pow: 4 }], healer: [{ pow: 6 }, { pow: 10, crit: 3 }], dps: [{ crit: 3 }, { pow: 14 }], mage: [{ pow: 8 }, { pow: 8, crit: 3 }], support: [{ sta: 6, pow: 4 }, { sta: 8, pow: 8 }] };
for (const t of [0, 1, 2, 3]) for (const [role, nm] of Object.entries(SETNAME[t])) {
  const b = BONUS[role], k = TIER_K[t], sc = o => Object.fromEntries(Object.entries(o).map(([s, v]) => [s, Math.round(v * k * 10) / 10]));
  const two = sc(b[0]), four = sc(b[1]), fmt = o => Object.entries(o).map(([s, v]) => `+${v}${s === 'crit' ? '% crit' : ' ' + { pow: 'power', sta: 'stamina' }[s]}`).join(', ');
  SETS[`s${t}_${role}`] = { name: nm, bonus: { 2: two, 4: four }, desc: `2 pieces: ${fmt(two)}. 4 pieces: ${fmt(four)}.` };
}
const PIECE = { head: { plate: 'Helm', leather: 'Hood', cloth: 'Circlet' }, chest: { plate: 'Breastplate', leather: 'Jerkin', cloth: 'Robe' }, legs: { plate: 'Greaves', leather: 'Leggings', cloth: 'Trousers' }, feet: { plate: 'Sabatons', leather: 'Boots', cloth: 'Slippers' } };
export function setPieceFor(cls, tier) {
  const role = SET_ROLE[cls], slot = pick(['head', 'chest', 'legs', 'feet']), at = CLASSES[cls].armor, L = TIER_LVL[tier], budget = gearBudget(L, slot);
  const lean = { tank: [.65, .25], healer: [.4, .5], dps: [.3, .6], mage: [.3, .6], support: [.5, .45] }[role];
  const stats = { sta: Math.round(budget * lean[0]), pow: Math.round(budget * lean[1]), arm: Math.round((at === 'plate' ? 3 : at === 'leather' ? 2 : 1) * (1 + L * .8) * (role === 'tank' ? 2.3 : 1.9)) };
  if (role === 'dps' || role === 'mage') stats.crit = +(1 + L * .1).toFixed(1);
  return makeItem({ name: `${SETNAME[tier][role]} ${PIECE[slot][at]}`, slot, type: at, armorType: at, lvl: L, rarity: 3, set: `s${tier}_${role}`, stats, value: Math.round((3 + L * 4) * 6) });
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
  const out = [], tier = TIER[d], fin = FINALS.includes(e.mob);
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
