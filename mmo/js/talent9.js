// Build 9: at level 20 every class splits in two, EverQuest 2 style. You choose which new class to become; it
// brings two signature abilities and its own talent tree. Points come from levels 21-25 (three a level, plus one
// for the choice), and after 25 from experience, one point for every level's worth, up to the top of the tree.
import { S, X, chat, dist } from './core.js';
import { CLASSES, CLASS_KEYS, BOOK, xpNeed, MAX_LVL } from './data.js';
import * as Cb from './combat.js';

// ---------- signature abilities, from a handful of patterns ----------
const A = {
  strike: (m, school, extra) => ({ kind: 'attack', tgt: 'enemy', range: 4, fx: (C, u, t) => { C.damage(u, t, C.pw(u) * m + 10, school, { threat: 1.5 }); extra?.(C, u, t); } }),
  bolt: (m, school, extra) => ({ kind: 'attack', tgt: 'enemy', range: 26, fx: (C, u, t) => { C.damage(u, t, C.pw(u) * m + 10, school); extra?.(C, u, t); } }),
  nova: (r, m, school, extra) => ({ kind: 'attack', tgt: 'self', range: 0, fx: (C, u) => { for (const e of C.enemiesNear(u, u, r)) { C.damage(u, e, C.pw(u) * m + 6, school, { threat: 1.5 }); extra?.(C, u, e); } C.fxRing(u, r, COL[school] || [1, 1, 1]); } }),
  around: (r, m, school) => ({ kind: 'attack', tgt: 'enemy', range: 26, fx: (C, u, t) => { for (const e of C.enemiesNear(u, t, r)) C.damage(u, e, C.pw(u) * m + 6, school); C.fxRing(t, r, COL[school] || [1, 1, 1]); } }),
  dot: (perS, dur, school) => ({ kind: 'attack', tgt: 'enemy', range: 26, fx: (C, u, t) => C.dot(u, t, 'sig', C.pw(u) * perS + 2, dur, school) }),
  execute: (m, school) => ({ kind: 'attack', tgt: 'enemy', range: 4, fx: (C, u, t) => C.damage(u, t, (C.pw(u) * m + 10) * (t.hp / t.maxHp < .3 ? 2.2 : 1), school) }),
  leech: (m, school, r = 0) => ({ kind: 'attack', tgt: r ? 'self' : 'enemy', range: r ? 0 : 4, fx: (C, u, t) => { const list = r ? C.enemiesNear(u, u, r) : [t]; for (const e of list) C.damage(u, e, C.pw(u) * m + 6, school, { threat: 1.5 }); C.heal(u, u, u.maxHp * .04 * Math.max(1, list.length)); if (r) C.fxRing(u, r, COL[school]); } }),
  heal: m => ({ kind: 'heal', tgt: 'ally', range: 30, fx: (C, u, t) => C.heal(u, t, C.pw(u) * m + 30) }),
  group: m => ({ kind: 'heal', tgt: 'party', range: 0, fx: (C, u) => { for (const p of C.partyOf(u)) if (!p.dead && dist(u, p) < 30) C.heal(u, p, C.pw(u) * m + 20); C.fxRing(u, 30, [1, .95, .6]); } }),
  hot: (tot, dur, all) => ({ kind: 'heal', tgt: all ? 'party' : 'ally', range: 30, fx: (C, u, t) => { for (const p of all ? C.partyOf(u).filter(p => !p.dead && dist(u, p) < 30) : [t]) C.hot(u, p, 'sighot', C.pw(u) * tot + 30, dur); } }),
  self: (id, dur, data) => ({ kind: 'util', tgt: 'self', range: 0, fx: (C, u) => C.buff(u, id, dur, data, u) }),
  party: (id, dur, data) => ({ kind: 'util', tgt: 'self', range: 0, fx: (C, u) => C.partyBuff(u, id, dur, data) }),
  taunts: (r, data) => ({ kind: 'util', tgt: 'self', range: 0, fx: (C, u) => { for (const e of C.enemiesNear(u, u, r)) C.taunt(u, e); if (data) C.buff(u, 'sigdr', 10, data, u); C.fxRing(u, r, [1, .8, .4]); } }),
};
const COL = { phys: [1, .9, .7], holy: [1, .95, .6], fire: [1, .5, .2], frost: [.6, .85, 1], storm: [.7, .7, 1], nature: [.5, 1, .4], shadow: [.6, .3, .9], earth: [.8, .6, .4], poison: [.5, .9, .3] };
const stun = s => (C, u, t) => C.stun(u, t, s), slow = (C, u, t) => C.buff(t, 'slow', 6, { slow: .4 }, u), selfHeal = p => (C, u) => C.heal(u, u, u.maxHp * p);
// a signature ability: name, icon, cost, cooldown, description, pattern
const sig = (name, icon, cost, cd, desc, pat) => ({ name, icon, cost, cd, desc, ...pat });

// ---------- the thirty-two new classes ----------
// [key, name, blurb, focus, passive bonus, [signature 1, signature 2], ability adjective]
export const SUBS = {
  bulwark: [
    ['sentinel', 'Sentinel', 'The wall that does not fall. More armor, more patience, and a shield that stops kings.', 'tank', { armorP: .08 }, [sig('Unbroken Bastion', '🏰', 20, 45, 'Every enemy within 10 m must attack you, and you take 30% less damage for 10 seconds.', A.taunts(10, { dr: .3 })), sig('Shieldbreaker', '🛡️', 25, 12, 'A crushing shield blow that stuns for 2 seconds.', A.strike(1.4, 'phys', stun(2)))], 'Unbroken'],
    ['templar', 'Templar', 'A holy knight of the Four, who heals by striking and blesses by standing in the way.', 'tank', { hpP: .05 }, [sig('Judgement', '⚖️', 20, 8, 'Holy damage, and you heal 6% of your health.', A.strike(1.3, 'holy', selfHeal(.06))), sig('Consecration', '✨', 25, 14, 'Holy fire around you hits every enemy within 8 m, with extra threat.', A.nova(8, .8, 'holy'))], 'Sanctified']],
  bladewarden: [
    ['warlord', 'Warlord', 'A general with a greatsword, who makes everyone around them braver.', 'tank', { hpP: .04, powP: .02 }, [sig('Warlord\'s Call', '📯', 0, 90, 'Your group gains 10% health and 10% armor for 20 seconds.', A.party('rally', 20, { hp: .1, armor: .1 })), sig('Sundering Blow', '⚔️', 25, 10, 'A huge two-handed blow.', A.strike(1.7, 'phys'))], 'Commanding'],
    ['reaver', 'Reaver', 'A tank who drinks the blood of whatever is hitting them, and asks for more.', 'tank', { powP: .04 }, [sig('Crimson Cleave', '🩸', 25, 10, 'Cleaves every enemy within 6 m and heals you for each one hit.', A.leech(.9, 'shadow', 6)), sig('Crimson Pact', '🧛', 0, 60, 'For 15 seconds you deal 20% more damage.', A.self('bloodpact', 15, { pow: .2 }))], 'Crimson']],
  wardancer: [
    ['bladedancer', 'Bladedancer', 'Never where the blow lands. Two curved blades and a lot of footwork.', 'tank', { dodge: .03 }, [sig('Whirling Steel', '🌀', 25, 10, 'Spin, hitting every enemy within 6 m.', A.nova(6, 1, 'phys')), sig('Mirage Step', '💨', 0, 45, 'Gain 30% dodge for 8 seconds.', A.self('mirage', 8, { dodge: .3 }))], 'Whirling'],
    ['ironwind', 'Ironwind', 'A storm in a dancer\'s shape. Every step is a gust; every blade, a lightning strike.', 'tank', { parry: .03 }, [sig('Tempest Strike', '⚡', 20, 8, 'Storm damage to your target and everything within 5 m of it.', A.around(5, 1, 'storm')), sig('Gale Guard', '🌬️', 0, 90, 'Your group gains 15% armor for 20 seconds.', A.party('galeguard', 20, { armor: .15 }))], 'Stormborne']],
  monk: [
    ['wayfinder', 'Wayfinder', 'A monk of the healing palm, who mends bones as easily as breaking them.', 'support', { hpP: .03, crit: .01 }, [sig('Mending Palm', '🤲', 20, 6, 'A strong heal on a friend.', A.heal(1.8)), sig('Still Water', '💧', 30, 30, 'Your whole group heals over 10 seconds.', A.hot(1.2, 10, true))], 'Serene'],
    ['stormfist', 'Stormfist', 'A monk of the closed fist, who hits like thunder and moves like rain.', 'support', { powP: .04 }, [sig('Thunder Palm', '👊', 20, 10, 'A thunderous palm strike that stuns for 1.5 seconds.', A.strike(1.5, 'storm', stun(1.5))), sig('Storm of Fists', '🥊', 30, 14, 'A flurry that hits every enemy within 5 m.', A.nova(5, 1.1, 'phys'))], 'Thundering']],
  cleric: [
    ['inquisitor', 'Inquisitor', 'A cleric who finds the wicked and sets them on fire. Heals, too, if you ask nicely.', 'healer', { powP: .03, crit: .01 }, [sig('Holy Fire', '🔥', 20, 0, 'Sets your target alight with holy fire for 12 seconds.', A.dot(.25, 12, 'holy')), sig('Sentence', '⚖️', 25, 12, 'Holy damage; double against an enemy below 30% health.', A.execute(1.3, 'holy'))], 'Zealous'],
    ['lightbringer', 'Lightbringer', 'The light of the Four, poured out on everyone at once.', 'healer', { hpP: .03, powP: .02 }, [sig('Radiance', '☀️', 35, 12, 'Heals your whole group.', A.group(1.1)), sig('Lightbringer\'s Sanctuary', '⛪', 0, 90, 'Your group takes 15% less damage for 12 seconds.', A.party('sanctuary', 12, { dr: .15 }))], 'Radiant']],
  aegis: [
    ['shieldmaiden', 'Shieldmaiden', 'A healer with a shield who stands at the front and dares anyone to touch her people.', 'healer', { armorP: .06, hpP: .02 }, [sig('Aegis Wall', '🛡️', 25, 30, 'Your target takes 30% less damage for 8 seconds.', { kind: 'heal', tgt: 'ally', range: 30, fx: (C, u, t) => C.buff(t, 'aegiswall', 8, { dr: .3 }, u) }), sig('Maiden\'s Rebuke', '💥', 15, 12, 'Bash an enemy, stunning it for 2 seconds.', A.strike(1, 'phys', stun(2)))], 'Shielding'],
    ['oracle', 'Oracle', 'A seer who heals what hasn\'t happened yet.', 'healer', { crit: .02 }, [sig('Foresight', '🔮', 0, 90, 'Your group gains 5% critical chance and 10% dodge for 20 seconds.', A.party('foresight', 20, { crit: .05, dodge: .1 })), sig('Prophecy', '🌟', 35, 15, 'A huge heal on a friend.', A.heal(3))], 'Prescient']],
  lifebinder: [
    ['rootwarden', 'Rootwarden', 'A lifebinder of the deep roots: thorns for enemies, sap for friends.', 'healer', { hpP: .04 }, [sig('Thornbind', '🌿', 20, 10, 'Thorns wrap your target: nature damage over 10 seconds, and slowed.', { kind: 'attack', tgt: 'enemy', range: 26, fx: (C, u, t) => { C.dot(u, t, 'thornbind', C.pw(u) * .2 + 2, 10, 'nature'); slow(C, u, t); } }), sig('Living Ward', '🌱', 25, 8, 'A friend heals strongly over 12 seconds.', A.hot(2.4, 12, false))], 'Deep-Rooted'],
    ['bloodbinder', 'Bloodbinder', 'A lifebinder who heals with their own blood, and takes it back from enemies.', 'healer', { powP: .04 }, [sig('Transfusion', '🩸', 15, 6, 'A strong heal on a friend that costs you a little health.', { kind: 'heal', tgt: 'ally', range: 30, fx: (C, u, t) => { C.heal(u, t, C.pw(u) * 2.2 + 30); if (t !== u) u.hp = Math.max(1, u.hp - u.maxHp * .04); } }), sig('Sanguine Burst', '💉', 30, 14, 'Heals your whole group.', A.group(1))], 'Sanguine']],
  druid: [
    ['wildkeeper', 'Wildkeeper', 'A druid who runs with the herd and calls the stampede.', 'healer', { powP: .03, dodge: .01 }, [sig('Stampede', '🦬', 25, 12, 'Spirit beasts trample every enemy within 8 m.', A.nova(8, 1, 'nature')), sig('Pack Bond', '🐺', 0, 90, 'Your group deals 10% more damage for 20 seconds.', A.party('packbond', 20, { pow: .1 }))], 'Feral'],
    ['grovewarden', 'Grovewarden', 'A druid who grows a grove around their friends wherever they stand.', 'healer', { hpP: .04 }, [sig('Bloom', '🌸', 30, 12, 'Your whole group heals over 10 seconds.', A.hot(1.4, 10, true)), sig('Barkskin Grove', '🌳', 0, 90, 'Your group gains 20% armor for 20 seconds.', A.party('barkgrove', 20, { armor: .2 }))], 'Verdant']],
  longwatch: [
    ['ranger', 'Ranger', 'A hunter of the wild places, with a quiver of thorns and a hawk\'s patience.', 'dps', { crit: .01, dodge: .02 }, [sig('Volley of Thorns', '🏹', 25, 10, 'Arrows rain on your target and everything within 6 m of it.', A.around(6, .9, 'nature')), sig("Hunter's Mark", '🎯', 15, 0, 'Wounds your target for heavy damage over 15 seconds.', A.dot(.3, 15, 'phys'))], 'Wild'],
    ['sharpshooter', 'Sharpshooter', 'One arrow. One shot. Usually one body.', 'dps', { crit: .03 }, [sig('Perfect Shot', '👁️', 30, 12, 'A single perfect shot.', A.bolt(2.2, 'phys')), sig('Steady Aim', '🧘', 0, 60, 'Gain 15% critical chance for 12 seconds.', A.self('steadyaim', 12, { crit: .15 }))], 'Deadeye']],
  knifeshade: [
    ['assassin', 'Assassin', 'A knife in the dark that only needs to find the right place once.', 'dps', { crit: .02, powP: .02 }, [sig('Deathmark', '☠️', 30, 12, 'A killing blow; double against an enemy below 30% health.', A.execute(1.6, 'phys')), sig('Shadowstep Strike', '🗡️', 20, 8, 'Step through the shadows and strike.', A.strike(1.5, 'shadow'))], 'Lethal'],
    ['nightblade', 'Nightblade', 'A blade that fights in the dark with a dozen knives at once.', 'dps', { dodge: .02, powP: .02 }, [sig('Fan of Shadows', '🌑', 25, 10, 'Throws shadow-knives at every enemy within 7 m.', A.nova(7, .9, 'shadow')), sig('Into the Night', '🫥', 0, 45, 'Drop out of sight: you lose your enemies\' attention and gain 15% power for 8 seconds.', { kind: 'util', tgt: 'self', range: 0, fx: (C, u) => { C.dropThreat(u, .9); C.buff(u, 'vanish', 8, { pow: .15 }, u); } })], 'Night-Born']],
  blightblade: [
    ['plaguebringer', 'Plaguebringer', 'A blightblade who carries the plague like a banner.', 'dps', { powP: .04 }, [sig('Pestilence', '🦠', 30, 12, 'Plague bursts from your target onto everything within 6 m.', { kind: 'attack', tgt: 'enemy', range: 26, fx: (C, u, t) => { for (const e of C.enemiesNear(u, t, 6)) C.dot(u, e, 'pestilence', C.pw(u) * .18 + 2, 10, 'poison'); C.fxRing(t, 6, COL.poison); } }), sig('Contagion', '☣️', 20, 0, 'Heavy poison on your target for 15 seconds.', A.dot(.3, 15, 'poison'))], 'Pestilent'],
    ['witchblade', 'Witchblade', 'A blightblade who learned hexes from the witches of the wastes.', 'dps', { crit: .02, hpP: .02 }, [sig('Hex Strike', '🪄', 20, 8, 'Shadow damage that slows your target.', A.strike(1.4, 'shadow', slow)), sig('Blight Ward', '🧿', 0, 60, 'Take 25% less damage for 10 seconds.', A.self('blightward', 10, { dr: .25 }))], 'Hexed']],
  bard: [
    ['skald', 'Skald', 'A bard of war sagas, whose songs make heroes and whose voice breaks shields.', 'support', { powP: .03, hpP: .02 }, [sig('War Saga', '📜', 0, 90, 'Your group deals 12% more damage for 20 seconds.', A.party('warsaga', 20, { pow: .12 })), sig('Thundering Verse', '🎶', 25, 10, 'A verse like thunder hits every enemy within 8 m.', A.nova(8, .9, 'storm'))], 'Heroic'],
    ['minstrel', 'Minstrel', 'A bard of soft songs, who heals the weary and puts the angry to sleep.', 'support', { hpP: .03, crit: .01 }, [sig('Ballad of Mending', '🎻', 30, 12, 'Your whole group heals over 10 seconds.', A.hot(1.3, 10, true)), sig('Minstrel\'s Lullaby', '😴', 20, 20, 'Sing your target to sleep for 8 seconds.', { kind: 'util', tgt: 'enemy', range: 26, fx: (C, u, t) => C.mez(u, t, 8) })], 'Lilting']],
  elementalist: [
    ['pyromancer', 'Pyromancer', 'An elementalist who has decided that fire is the answer to every question.', 'dps', { powP: .04 }, [sig('Inferno', '🔥', 30, 10, 'Fire erupts around you, burning every enemy within 7 m.', A.nova(7, 1.1, 'fire')), sig('Skyfall', '☄️', 40, 14, 'A falling star hits your target and everything within 5 m.', A.around(5, 1.6, 'fire'))], 'Blazing'],
    ['stormcaller', 'Stormcaller', 'An elementalist who calls the storm down and rides it.', 'dps', { crit: .03 }, [sig('Skyfork', '⚡', 30, 8, 'Lightning leaps from your target to everything within 8 m of it.', A.around(8, 1, 'storm')), sig('Storm Ward', '🌩️', 0, 60, 'Take 25% less damage and gain 10% power for 10 seconds.', A.self('stormward', 10, { dr: .25, pow: .1 }))], 'Thunderous']],
  warlock: [
    ['soulreaper', 'Soulreaper', 'A warlock who harvests souls, and eats what they harvest.', 'dps', { powP: .03, hpP: .02 }, [sig('Reap the Soul', '💀', 25, 8, 'Shadow damage that heals you.', A.leech(1.4, 'shadow')), sig('Doom', '⏳', 30, 20, 'Your target suffers huge shadow damage over 15 seconds.', A.dot(.45, 15, 'shadow'))], 'Reaping'],
    ['shadowbinder', 'Shadowbinder', 'A warlock who binds the dark itself and wears it.', 'dps', { crit: .02, powP: .02 }, [sig('Curse of Ruin', '🌘', 20, 0, 'Shadow damage over 12 seconds.', A.dot(.32, 12, 'shadow')), sig('Pact of Shadow', '🖤', 0, 60, 'Gain 20% power for 12 seconds.', A.self('darkpact', 12, { pow: .2 }))], 'Umbral']],
  binder: [
    ['golemancer', 'Golemancer', 'A binder who became the golem: stone skin, and fists like boulders.', 'dps', { armorP: .06, hpP: .02 }, [sig('Earthen Avatar', '🗿', 0, 60, 'Take 25% less damage and gain 15% power for 12 seconds.', A.self('avatar', 12, { dr: .25, pow: .15 })), sig('Quake', '🌋', 30, 10, 'The ground breaks under every enemy within 8 m.', A.nova(8, 1, 'earth'))], 'Stone-Bound'],
    ['spiritcaller', 'Spiritcaller', 'A binder who calls the spirits of the elements to fight beside their friends.', 'dps', { powP: .03, crit: .01 }, [sig('Spirit Link', '🔗', 0, 90, 'Your group gains 10% health for 30 seconds.', A.party('spiritlink', 30, { hp: .1 })), sig('Wisp Storm', '✨', 30, 10, 'Wisps strike your target and everything within 6 m of it.', A.around(6, 1.1, 'storm'))], 'Spirit-Called']],
  illusionist: [
    ['enchanter', 'Enchanter', 'An illusionist who enchants friends and shatters minds.', 'support', { powP: .02, crit: .02 }, [sig('Mind Shatter', '🧠', 25, 10, 'Psychic damage that stuns for 2 seconds.', A.bolt(1.3, 'shadow', stun(2))), sig('Haste Weave', '🌀', 0, 90, 'Your group gains 8% critical chance for 20 seconds.', A.party('hasteweave', 20, { crit: .08 }))], 'Enchanted'],
    ['phantasmist', 'Phantasmist', 'An illusionist whose illusions are sharp enough to bleed.', 'support', { dodge: .02, powP: .02 }, [sig('Phantasm Blades', '🗡️', 25, 10, 'Phantom blades cut every enemy within 7 m.', A.nova(7, 1, 'shadow')), sig('Mirror Veil', '🪞', 0, 45, 'Gain 30% dodge for 8 seconds.', A.self('mirrorveil', 8, { dodge: .3 }))], 'Phantasmal']],
};
const subOf = (cls, key) => SUBS[cls]?.find(s => s[0] === key);
// which new class the hero chose for each class, and the points spent
const T = () => (S.ext.tal = S.ext.tal || {});
export const chosen = cls => T()[cls]?.sub || null;
X.clsName = e => { const sub = e?.isHero ? chosen(e.cls) : S.ext?.allySub?.[e?.name]; const s = sub && subOf(e.cls, sub); return s ? s[1] : CLASSES[e.cls].name; };

// add the signature abilities to each class: only the hero who chose that new class ever sees them
for (const cls of CLASS_KEYS) for (const [sk, , , , , sigs] of SUBS[cls] || []) sigs.forEach((ab, i) => {
  const key = `sig_${sk}${i + 1}`, need = i ? 23 : 20;
  CLASSES[cls].abilities[key] = Object.defineProperty({ ...ab, key, sub: sk, gcd: ab.cd === 0 ? true : undefined }, 'lvl', { get: () => chosen(cls) === sk ? need : 99, enumerable: true });
});

// ---------- the talent trees ----------
const ROLE_STATS = { tank: [['hpP', .03, 'Hardened'], ['armorP', .04, 'Iron'], ['parry', .01, 'Steady']], healer: [['powP', .03, 'Devoted'], ['crit', .01, 'Blessed'], ['hpP', .02, 'Enduring']], dps: [['powP', .03, 'Ruthless'], ['crit', .01, 'Keen'], ['dodge', .01, 'Quick']], support: [['powP', .02, 'Inspired'], ['hpP', .02, 'Hearty'], ['crit', .01, 'Clever']] };
const STAT_NAME = { hpP: 'Toughness', armorP: 'Armor', parry: 'Guard', powP: 'Power', crit: 'Precision', dodge: 'Footwork' };
const STAT_DESC = { hpP: v => `+${v * 100}% health`, armorP: v => `+${v * 100}% armor`, parry: v => `+${v * 100}% parry`, powP: v => `+${v * 100}% power`, crit: v => `+${v * 100}% critical chance`, dodge: v => `+${v * 100}% dodge` };
const trees = {};
export function treeOf(cls, sk) {
  const id = cls + ':' + sk; if (trees[id]) return trees[id];
  const s = subOf(cls, sk), [, , , focus, , , adj] = s, C = CLASSES[cls].abilities;
  const own = Object.entries(C).filter(([k, a]) => !a.sub && k !== 'racial' && a.kind !== 'ult');
  const hit = own.filter(([, a]) => a.kind === 'attack' || a.kind === 'heal').sort((x, y) => (y[1].lvl || 0) - (x[1].lvl || 0)).slice(0, 3);
  const cds = own.filter(([, a]) => a.cd >= 20).slice(0, 2);
  const t = [];
  ROLE_STATS[focus].forEach(([st, v, w]) => t.push({ id: 's_' + st, tier: 0, max: 3, name: `${w} ${STAT_NAME[st]}`, desc: r => STAT_DESC[st](+(v * r).toFixed(3)), stat: [st, v] }));
  hit.forEach(([k, a]) => t.push({ id: 'a_' + k, tier: 1, max: 3, name: `${adj} ${a.name}`, desc: r => `${a.name} is ${r * 8}% stronger.`, ab: [k, .08] }));
  cds.forEach(([k, a]) => t.push({ id: 'c_' + k, tier: 2, max: 2, name: `Swift ${a.name}`, desc: r => `${a.name}'s cooldown is ${r * 12}% shorter.`, cdab: [k, .12] }));
  t.push({ id: 'g1', tier: 2, max: 2, name: `${adj} ${s[5][0].name}`, desc: r => `${s[5][0].name} is ${r * 12}% stronger.`, ab: [`sig_${sk}1`, .12] });
  t.push({ id: 'g2', tier: 3, max: 1, name: `Mastery of ${s[5][1].name}`, desc: () => `${s[5][1].name} is 20% stronger and its cooldown 20% shorter.`, ab: [`sig_${sk}2`, .2], cdab: [`sig_${sk}2`, .2] });
  const cap = { tank: ['hpP', .08], healer: ['powP', .06], dps: ['powP', .06], support: ['powP', .05] }[focus];
  t.push({ id: 'cap1', tier: 3, max: 1, name: `Heart of the ${s[1]}`, desc: () => STAT_DESC[cap[0]](cap[1]), stat: cap });
  t.push({ id: 'cap2', tier: 3, max: 1, name: `${s[1]}'s Instinct`, desc: () => STAT_DESC.crit(.03), stat: ['crit', .03] });
  while (t.filter(x => x.tier === 2).length < 3) t.push({ id: 'pad' + t.length, tier: 2, max: 2, name: `${adj} Resolve`, desc: r => STAT_DESC.hpP(+(.02 * r).toFixed(2)), stat: ['hpP', .02] });
  return (trees[id] = t);
}
const TIER_NEED = [0, 3, 7, 11];
export const ptsTotal = cls => { const L = (CLASS_KEYS.includes(cls) && (cls === S.heroCls ? S.hero?.lvl : S.classes[cls]?.lvl)) || 0; if (L < 20 || !chosen(cls)) return 0; return 1 + (L - 20) * 3 + Math.min(11, T()[cls].aa || 0); };
export const ptsSpent = cls => Object.values(T()[cls]?.pts || {}).reduce((a, b) => a + b, 0);
export function canTake(cls, tal) {
  const st = T()[cls]; if (!st?.sub) return 'Choose your new class first.';
  if ((st.pts[tal.id] || 0) >= tal.max) return 'Already at its highest rank.';
  if (ptsSpent(cls) >= ptsTotal(cls)) return 'No points left. Points come from levels past 20, and from experience at 25.';
  if (ptsSpent(cls) < TIER_NEED[tal.tier]) return `Spend ${TIER_NEED[tal.tier]} points in this tree first.`;
  return null;
}
export function take(cls, tal) { const why = canTake(cls, tal); if (why) return why; const st = T()[cls]; st.pts[tal.id] = (st.pts[tal.id] || 0) + 1; bumpCache(); if (S.hero) Cb.recalc(S.hero); return null; }
export function choose(cls, sk) {
  T()[cls] = { sub: sk, pts: {}, aa: T()[cls]?.aa || 0 }; bumpCache();
  const bar = S.bar?.[cls]; if (bar) for (const k of [`sig_${sk}1`, `sig_${sk}2`]) { if (bar.includes(k)) continue; const i = bar.findIndex(x => !x); if (i >= 0) bar[i] = k; }
  if (S.hero) Cb.recalc(S.hero);
}
export function respec(cls) { const st = T()[cls]; if (!st) return; st.pts = {}; bumpCache(); if (S.hero) Cb.recalc(S.hero); }
// experience past 25 turns into points, one for every level's worth
X.capXp = (p, amt) => { const st = T()[p.cls]; if (!st?.sub || (st.aa || 0) >= 11) return; st.aaXp = (st.aaXp || 0) + amt; const need = xpNeed(MAX_LVL - 1); while (st.aaXp >= need && st.aa < 11) { st.aaXp -= need; st.aa = (st.aa || 0) + 1; chat('sys', null, 'You feel your craft deepen. A talent point is waiting for you.'); } };

// ---------- folding talents into the numbers ----------
let ver = 0, cache = new Map(); const bumpCache = () => { ver++; cache.clear(); };
function talFor(e) {
  if (!e?.cls) return null;
  if (e.isHero) { const st = T()[e.cls]; if (!st?.sub) return null; const k = e.cls + ver; if (cache.has(k)) return cache.get(k);
    const tree = treeOf(e.cls, st.sub), stats = { ...subOf(e.cls, st.sub)[4] }, ab = {}, cd = {};
    for (const tal of tree) { const r = st.pts[tal.id] || 0; if (!r) continue; if (tal.stat) stats[tal.stat[0]] = (stats[tal.stat[0]] || 0) + tal.stat[1] * r; if (tal.ab) ab[tal.ab[0]] = (ab[tal.ab[0]] || 1) * (1 + tal.ab[1] * r); if (tal.cdab) cd[tal.cdab[0]] = (cd[tal.cdab[0]] || 1) * (1 - tal.cdab[1] * r); }
    const out = { stats, ab, cd }; cache.set(k, out); return out; }
  // a companion who has passed 20 has a new class too, and its passive bonus
  if (e.fake && e.lvl >= 20) { S.ext.allySub = S.ext.allySub || {}; let sk = S.ext.allySub[e.name]; if (!sk && SUBS[e.cls]) sk = S.ext.allySub[e.name] = SUBS[e.cls][Math.random() < .5 ? 0 : 1][0]; const s = sk && subOf(e.cls, sk); return s ? { stats: s[4], ab: {}, cd: {} } : null; }
  return null;
}
X.talentBonus = e => talFor(e)?.stats || null;
BOOK.tal = (e, ab) => talFor(e)?.ab[ab.key] || 1;
BOOK.talCd = (e, ab) => talFor(e)?.cd[ab.key] || 1;

// ---------- the Talents page ----------
X.book.push(['talents', 'Talents', body => {
  const { el, esc, refreshSheet, toast } = X.ui, cls = S.heroCls, C = CLASSES[cls], st = T()[cls], L = S.hero.lvl;
  if (!st?.sub) {
    body.appendChild(el(`<p style="margin:0 0 8px">At level 20, every ${esc(C.name)} becomes one of two new classes. The choice gives you two new abilities and a talent tree of your own.</p>`));
    for (const [sk, name, blurb, focus, , sigs] of SUBS[cls]) {
      const c = el(`<div class="card" style="text-align:left;border-color:${C.color}"><h3 style="color:${C.color}">${esc(name)}</h3><p>${esc(blurb)}</p>${sigs.map((a, i) => `<p style="font-size:12.5px;margin:3px 0">${a.icon} <b>${esc(a.name)}</b> (level ${i ? 23 : 20}): ${esc(a.desc)}</p>`).join('')}<div class="acts"><button ${L >= 20 ? '' : 'disabled'}>${L >= 20 ? 'Become a ' + esc(name) : 'Reach level 20'}</button></div></div>`);
      c.querySelector('button').onclick = () => { choose(cls, sk); chat('sys', null, `You are a ${name} now.`); X.ui.refreshKeys?.(true); refreshSheet(); };
      body.appendChild(c);
    }
    return;
  }
  const s = subOf(cls, st.sub), tree = treeOf(cls, st.sub), left = ptsTotal(cls) - ptsSpent(cls);
  body.appendChild(el(`<div class="card" style="text-align:left"><h3 style="color:${C.color}">${esc(s[1])}</h3><p style="margin:2px 0">${left} point${left === 1 ? '' : 's'} to spend · ${ptsSpent(cls)} spent</p></div>`));
  ['Foundations', 'Specialty', 'Discipline', 'Mastery'].forEach((tn, ti) => {
    body.appendChild(el(`<p style="margin:10px 0 4px;font:700 13px Cinzel;color:var(--acc)">${tn}${TIER_NEED[ti] ? ` <small class="dim">(${TIER_NEED[ti]} points in the tree)</small>` : ''}</p>`));
    for (const tal of tree.filter(x => x.tier === ti)) {
      const r = st.pts[tal.id] || 0, why = canTake(cls, tal);
      const c = el(`<div class="who" style="opacity:${ptsSpent(cls) >= TIER_NEED[ti] ? 1 : .55}"><div><b>${esc(tal.name)}</b> <small>${r}/${tal.max}</small><br><small>${esc(tal.desc(Math.max(1, r)))}${r < tal.max && r ? ` · next: ${esc(tal.desc(r + 1))}` : ''}</small></div><button ${why ? 'disabled' : ''}>+</button></div>`);
      c.querySelector('button').onclick = () => { const m = take(cls, tal); if (m) toast(m); refreshSheet(); };
      body.appendChild(c);
    }
  });
  const cost = 20 + (L - 20) * 10, b = el(`<div class="acts" style="margin-top:10px"><button>Forget my talents (${cost}g)</button><button>Change class (${cost * 4}g)</button></div>`), [b1, b2] = b.querySelectorAll('button');
  b1.onclick = () => { if (S.gold < cost) return toast('Not enough gold.'); S.gold -= cost; respec(cls); refreshSheet(); };
  b2.onclick = () => { if (S.gold < cost * 4) return toast('Not enough gold.'); S.gold -= cost * 4; delete T()[cls].sub; T()[cls].pts = {}; bumpCache(); Cb.recalc(S.hero); refreshSheet(); };
  body.appendChild(b);
}, () => S.hero && S.hero.lvl >= 20]);
