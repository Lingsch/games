// Build 15: the abilities of levels 41-45. Each class learns two more (at 42 and 45; the 45 one is its moonlit
// capstone), and levels 41, 43 and 44 each bring a stronger version of a core spell, the same rule as Build 14.
import { CLASSES } from './data.js';
import { VERS } from './spells14.js';

const near = (C, u, c, r) => C.enemiesNear(u, c, r);
const party = (C, u, r) => C.partyOf(u).filter(p => !p.dead && C.d(u, p) < r);
const noBoss = t => !t.boss && !t.named && !t.raidBoss;
const MOON = [.75, .85, 1];
const NEW = {
  bulwark: {
    crescentguard: { name: 'Crescent Guard', icon: '🌙', lvl: 42, kind: 'util', cost: 20, cd: 20, range: 0, tgt: 'self', ai: 'taunt', desc: 'Every enemy within 12 m turns on you, and you take 15% less damage for 8 seconds.',
      fx: (C, u) => { for (const m of near(C, u, u, 12)) C.taunt(u, m); C.buff(u, 'crescentguard', 8, { dr: .15 }, u); C.fxRing(u, 12, MOON); } },
    moonbreaker: { name: 'Moonbreaker', icon: '🌕', lvl: 45, kind: 'attack', cost: 35, cd: 20, range: 3.2, tgt: 'enemy', school: 'holy', ai: 'big', desc: 'Bring down a blow with the moon behind it: huge holy damage, triple threat, and your group takes 10% less damage for 8 seconds.',
      fx: (C, u, t) => { C.damage(u, t, C.pw(u) * 3.2 + 30, 'holy', { threat: 3 }); for (const p of party(C, u, 30)) C.buff(p, 'moonbreaker', 8, { dr: .1 }, u); } },
  },
  wardancer: {
    tideturn: { name: 'Turn of the Tide', icon: '🌊', lvl: 42, kind: 'util', cd: 30, gcd: false, tgt: 'self', ai: 'def', desc: '+40% dodge for 6 seconds, and every blow you dodge gives you momentum.',
      fx: (C, u) => { C.buff(u, 'tideturn', 6, { dodge: .4 }, u); C.gain(u, 30); } },
    waningdance: { name: 'The Waning Dance', icon: '🌘', lvl: 45, kind: 'attack', cost: 30, cd: 20, range: 0, tgt: 'self', ai: 'aoe', desc: 'Dance through every enemy within 9 m, three times, with triple threat.',
      fx: (C, u) => { for (let i = 0; i < 3; i++) for (const e of near(C, u, u, 9)) C.damage(u, e, C.pw(u) * .8 + 8, 'phys', { threat: 3 }); C.fxRing(u, 9, MOON); } },
  },
  bladewarden: {
    eclipsecut: { name: 'Eclipse Cut', icon: '🌑', lvl: 42, kind: 'attack', cost: 35, cd: 12, range: 3.2, tgt: 'enemy', ai: 'exec', desc: 'A cut that finishes: enormous damage to a target under 30% health, heavy damage otherwise.',
      fx: (C, u, t) => C.damage(u, t, C.pw(u) * (t.hp < t.maxHp * .3 ? 4 : 2) + 20, 'phys') },
    thousandcuts: { name: 'A Thousand Cuts', icon: '⚔️', lvl: 45, kind: 'util', cd: 120, gcd: false, tgt: 'self', ai: 'big', desc: 'For 12 seconds your attacks are 35% faster and 15% more likely to strike critically.',
      fx: (C, u) => C.buff(u, 'thousandcuts', 12, { haste: .35, crit: .15 }, u) },
  },
  monk: {
    stillwater: { name: 'Still Water', icon: '💧', lvl: 42, kind: 'util', cd: 60, gcd: false, tgt: 'self', ai: 'def', desc: 'Go still: heal 25% of your health over 6 seconds and take 25% less damage.',
      fx: (C, u) => { C.hot(u, u, 'stillwater', u.maxHp * .25, 6); C.buff(u, 'stillwaterdr', 6, { dr: .25 }, u); } },
    moonpalm: { name: 'Moon Palm', icon: '✋', lvl: 45, kind: 'attack', cost: 40, cd: 18, range: 3.2, tgt: 'enemy', school: 'holy', ai: 'nuke', desc: 'Huge holy damage, and the target is stunned for 2 seconds (bosses are staggered: 20% slower).',
      fx: (C, u, t) => { C.damage(u, t, C.pw(u) * 3 + 25, 'holy'); if (noBoss(t)) C.stun(u, t, 2); else C.buff(t, 'moonpalm', 6, { slow: .2 }, u); } },
  },
  cleric: {
    moonwell: { name: 'Moonwell', icon: '⛲', lvl: 42, kind: 'heal', cost: 28, cd: 25, range: 0, tgt: 'self', ai: 'healG', desc: 'Heal everyone within 25 m, and leave them healing for 8 seconds more.',
      fx: (C, u) => { for (const p of party(C, u, 25)) { C.heal(u, p, C.pw(u) * 1.6 + 16); C.hot(u, p, 'moonwell', C.pw(u) * 1.2 + 12, 8); } C.fxRing(u, 25, MOON); } },
    lampofmercy: { name: 'Lamp of Mercy', icon: '🏮', lvl: 45, kind: 'heal', cost: 30, cd: 45, range: 30, tgt: 'ally', ai: 'tankSave', desc: 'A great heal on one ally, and a ward that soaks a third of their health for 10 seconds.',
      fx: (C, u, t) => { C.heal(u, t, C.pw(u) * 4 + 40); C.ward(u, t, t.maxHp * .33, 10); } },
  },
  aegis: {
    silveraegis: { name: 'Silver Aegis', icon: '🛡️', lvl: 42, kind: 'heal', cost: 24, cd: 20, range: 30, tgt: 'ally', ai: 'tankSave', desc: 'Wrap an ally in silver: a ward that soaks 40% of their health for 8 seconds.',
      fx: (C, u, t) => C.ward(u, t, t.maxHp * .4, 8) },
    curtainward: { name: 'Curtain Ward', icon: '🌌', lvl: 45, kind: 'heal', cost: 34, cd: 90, range: 0, tgt: 'self', ai: 'gdef', desc: 'Draw the curtain over your group: everyone within 30 m gets a ward that soaks a quarter of their health, and takes 15% less damage for 10 seconds.',
      fx: (C, u) => { for (const p of party(C, u, 30)) { C.ward(u, p, p.maxHp * .25, 10); C.buff(p, 'curtainward', 10, { dr: .15 }, u); } C.fxRing(u, 30, MOON); } },
  },
  lifebinder: {
    tidebinding: { name: 'Tidebinding', icon: '🌊', lvl: 42, kind: 'heal', cost: 26, cd: 20, range: 0, tgt: 'self', ai: 'healG', desc: 'Bind your group to the tide: everyone within 25 m heals a lot over 10 seconds.',
      fx: (C, u) => { for (const p of party(C, u, 25)) C.hot(u, p, 'tidebinding', C.pw(u) * 2.4 + 24, 10); C.fxRing(u, 25, MOON); } },
    seconddawn: { name: 'Second Dawn', icon: '🌅', lvl: 45, kind: 'heal', cost: 40, cd: 120, range: 0, tgt: 'self', ai: 'gdef', desc: 'Heal everyone within 30 m for 40% of their health, and for 10 seconds nobody in the group can fall below 1 health.',
      fx: (C, u) => { for (const p of party(C, u, 30)) { C.heal(u, p, p.maxHp * .4); C.buff(p, 'seconddawn', 10, { floor: 1 }, u); } C.fxRing(u, 30, [1, .9, .6]); } },
  },
  druid: {
    moonbloom: { name: 'Moonbloom', icon: '🌸', lvl: 42, kind: 'heal', cost: 20, cd: 8, range: 30, tgt: 'ally', ai: 'hot', desc: 'A flower opens on an ally and heals them a lot over 12 seconds.',
      fx: (C, u, t) => C.hot(u, t, 'moonbloom', C.pw(u) * 3 + 30, 12) },
    groveofnight: { name: 'Grove of Night', icon: '🌳', lvl: 45, kind: 'heal', cost: 34, cd: 60, range: 0, tgt: 'self', ai: 'healG', desc: 'A night grove grows round you: everyone within 25 m heals over 12 seconds and takes 10% less damage.',
      fx: (C, u) => { for (const p of party(C, u, 25)) { C.hot(u, p, 'groveofnight', C.pw(u) * 2.6 + 26, 12); C.buff(p, 'groveofnightdr', 12, { dr: .1 }, u); } C.fxRing(u, 25, [.5, .9, .6]); } },
  },
  longwatch: {
    moonshot: { name: 'Moonshot', icon: '🎯', lvl: 42, kind: 'attack', cost: 30, cd: 10, range: 40, tgt: 'enemy', ai: 'nuke', desc: 'An arrow loosed at the moon that comes down on your target: heavy damage from very far away.',
      fx: (C, u, t) => C.damage(u, t, C.pw(u) * 2.6 + 22, 'phys') },
    rainofstars: { name: 'Rain of Stars', icon: '🌠', lvl: 45, kind: 'attack', cost: 45, cd: 30, range: 40, tgt: 'enemy', ai: 'aoe', desc: 'Arrows fall like stars on everything within 10 m of the target, three times.',
      fx: (C, u, t) => { for (let i = 0; i < 3; i++) for (const e of near(C, u, t, 10)) C.damage(u, e, C.pw(u) * .9 + 8, 'phys'); C.fxRing(t, 10, MOON); } },
  },
  knifeshade: {
    eclipsestep: { name: 'Eclipse Step', icon: '🌑', lvl: 42, kind: 'attack', cost: 35, cd: 15, range: 25, tgt: 'enemy', ai: 'gap', desc: 'Step out of the dark behind your target and cut deep.',
      fx: (C, u, t) => { C.leapTo(u, t); C.damage(u, t, C.pw(u) * 2.4 + 20, 'phys'); } },
    nightteeth: { name: 'The Night Has Teeth', icon: '🦷', lvl: 45, kind: 'attack', cost: 50, cd: 20, range: 3.2, tgt: 'enemy', ai: 'exec', desc: 'Enormous damage to a target under 30% health, heavy damage otherwise.',
      fx: (C, u, t) => C.damage(u, t, C.pw(u) * (t.hp < t.maxHp * .3 ? 5 : 2.2) + 30, 'phys') },
  },
  blightblade: {
    rotofages: { name: 'Rot of Ages', icon: '🦠', lvl: 42, kind: 'attack', cost: 30, cd: 12, range: 3.2, tgt: 'enemy', school: 'poison', ai: 'dotBig', desc: 'A poison that has been waiting a long time: heavy poison damage over 18 seconds.',
      fx: (C, u, t) => C.dot(u, t, 'rotofages', C.pw(u) * .5 + 5, 18, 'poison') },
    blighttide: { name: 'Blight Tide', icon: '☣️', lvl: 45, kind: 'attack', cost: 45, cd: 30, range: 0, tgt: 'self', ai: 'aoe', desc: 'Poison every enemy within 10 m, heavily, for 12 seconds.',
      fx: (C, u) => { for (const e of near(C, u, u, 10)) C.dot(u, e, 'blighttide', C.pw(u) * .45 + 4, 12, 'poison'); C.fxRing(u, 10, [.5, 1, .4]); } },
  },
  bard: {
    moonlullaby: { name: 'Lullaby of the Moon', icon: '🌙', lvl: 42, kind: 'util', cost: 20, cd: 30, range: 30, tgt: 'enemy', ai: 'cc', desc: 'Sing one enemy (not a boss) to sleep for 12 seconds.',
      fx: (C, u, t) => { if (noBoss(t)) C.mez(u, t, 12); } },
    wakingsong: { name: 'Song of the Waking', icon: '🎶', lvl: 45, kind: 'util', cost: 24, cd: 120, range: 0, tgt: 'self', ai: 'big', desc: 'For 15 seconds your whole group hits 15% harder and 15% faster.',
      fx: (C, u) => { for (const p of party(C, u, 40)) C.buff(p, 'wakingsong', 15, { pow: .15, haste: .15 }, u); C.fxRing(u, 30, [1, .9, .6]); } },
  },
  elementalist: {
    moonfire: { name: 'Moonfire', icon: '🔥', lvl: 42, kind: 'attack', cost: 24, cast: 2, cd: 8, range: 34, tgt: 'enemy', school: 'fire', ai: 'nuke', desc: 'Silver fire: heavy fire damage and more burning for 8 seconds.',
      fx: (C, u, t) => { C.bolt(u, t, C.pw(u) * 2.2 + 18, 'fire'); C.dot(u, t, 'moonfire', C.pw(u) * .3 + 3, 8, 'fire'); } },
    starfallspell: { name: 'Starfall', icon: '☄️', lvl: 45, kind: 'attack', cost: 34, cd: 30, range: 34, tgt: 'enemy', school: 'fire', ai: 'aoe', desc: 'Pull stars down on everything within 12 m of the target.',
      fx: (C, u, t) => { for (const e of near(C, u, t, 12)) C.damage(u, e, C.pw(u) * 2.6 + 20, 'fire'); C.fxRing(t, 12, [1, .7, .4]); } },
  },
  warlock: {
    eclipse: { name: 'Eclipse', icon: '🌑', lvl: 42, kind: 'attack', cost: 22, cd: 12, range: 32, tgt: 'enemy', school: 'shadow', ai: 'dotBig', desc: 'Put out the light in your target: heavy shadow damage over 18 seconds, and it hits 10% softer.',
      fx: (C, u, t) => { C.dot(u, t, 'eclipse', C.pw(u) * .55 + 5, 18, 'shadow'); C.buff(t, 'eclipseweak', 18, { pow: -.1 }, u); } },
    hungerdeep: { name: 'Hunger of the Deep', icon: '🕳️', lvl: 45, kind: 'attack', cost: 28, cd: 30, range: 32, tgt: 'enemy', school: 'shadow', ai: 'nuke', desc: 'Huge shadow damage, and you take back half of it as health.',
      fx: (C, u, t) => { const d = C.pw(u) * 3.4 + 30; C.damage(u, t, d, 'shadow'); C.heal(u, u, d * .5, true); } },
  },
  binder: {
    tideservitor: { name: 'Tidal Servitor', icon: '🌊', lvl: 42, kind: 'util', cost: 20, cd: 45, range: 0, tgt: 'self', ai: 'big', desc: 'Your bound servants hit 30% harder and take 20% less damage for 15 seconds.',
      fx: (C, u) => { for (const p of C.petsOf(u)) C.buff(p, 'tideservitor', 15, { pow: .3, dr: .2 }, u); C.fxRing(u, 10, MOON); } },
    lunarbinding: { name: 'Lunar Binding', icon: '🌕', lvl: 45, kind: 'attack', cost: 30, cd: 30, range: 30, tgt: 'enemy', school: 'arcane', ai: 'aoe', desc: 'Bind everything within 10 m of the target to the moon: arcane damage, and they slow by 40% for 6 seconds.',
      fx: (C, u, t) => { for (const e of near(C, u, t, 10)) { C.damage(u, e, C.pw(u) * 2.2 + 16, 'arcane'); C.buff(e, 'lunarbinding', 6, { slow: .4 }, u); } C.fxRing(t, 10, MOON); } },
  },
  illusionist: {
    mirrormoon: { name: 'Mirror Moon', icon: '🪞', lvl: 42, kind: 'util', cd: 45, gcd: false, tgt: 'self', ai: 'def', desc: 'A reflection takes the blows: +50% dodge for 6 seconds.',
      fx: (C, u) => C.buff(u, 'mirrormoon', 6, { dodge: .5 }, u) },
    sleeperdream: { name: 'Dream of the Sleeper', icon: '💤', lvl: 45, kind: 'util', cost: 30, cd: 60, range: 30, tgt: 'enemy', ai: 'cc', desc: 'Everything (not bosses) within 8 m of the target falls asleep for 8 seconds, and takes arcane damage when it wakes.',
      fx: (C, u, t) => { for (const e of near(C, u, t, 8)) if (noBoss(e)) { C.mez(u, e, 8); C.dot(u, e, 'sleeperdream', C.pw(u) * .2 + 2, 8, 'arcane'); } C.fxRing(t, 8, [.7, .5, 1]); } },
  },
};
for (const [cls, list] of Object.entries(NEW)) for (const [k, a] of Object.entries(list)) { a.key = k; a.b14 = true; a.b15 = true; CLASSES[cls].abilities[k] = a; }
// versions at 41, 43 and 44, to the core lines with the fewest so far (a fourth is allowed now)
const fxSrc = a => { try { return a.fx ? a.fx.toString() : ''; } catch (e) { return ''; } };
for (const [cls, C] of Object.entries(CLASSES)) {
  const A = C.abilities, V = VERS[cls] = VERS[cls] || {};
  const order = Object.entries(A).filter(([k, a]) => !a.sub && k !== 'racial' && a.kind !== 'ult' && a.kind !== 'racial' && a.kind !== 'buff' && a.lvl < 99 && !a.b15
    && (a.kind === 'attack' || a.kind === 'heal' || fxSrc(a).includes('pw('))).map(([k]) => k);
  for (const L of [41, 43, 44]) {
    const ok = order.filter(k => A[k].lvl <= L - 3 && (V[k]?.length || 0) < 4);
    if (!ok.length) continue;
    ok.sort((x, y) => (V[x]?.length || 0) - (V[y]?.length || 0) || A[x].lvl - A[y].lvl);
    (V[ok[0]] = V[ok[0]] || []).push(L);
  }
}
export const NEW15 = NEW;
