// Build 14: abilities the way EverQuest 2 hands them out. From level 17 to 40 every class gets something every level:
// a brand-new ability every three levels or so, and in between a stronger version of one it already has (Fireball II,
// Fireball III...), which takes the old one's place on the bar. Tiers (Apprentice, Adept I-IV, Master I-IV) belong to
// a version; see spell8.js for how they carry over. Every three levels from 10 you also earn Master's Marks, which
// raise a spell already at Master by one tier.
import { S, X, chat, pick, dist } from './core.js';
import { CLASSES, BOOK, MAX_LVL } from './data.js';
import * as Cb from './combat.js';
import { ranksOf, needLvl } from './spell8.js';
import { aiHooks, tryUse, isTank, isHealer, cc, hpPct, groupFoes } from './ai.js';

// ---------- 1. the new abilities ----------
const near = (C, u, c, r) => C.enemiesNear(u, c, r);
const party = (C, u, r) => C.partyOf(u).filter(p => !p.dead && C.d(u, p) < r);
const noBoss = t => !t.boss && !t.named && !t.raidBoss;
const NEW = {
  bulwark: {
    skullcrack: { name: 'Skull Crack', icon: '💥', lvl: 18, kind: 'attack', cost: 20, cd: 8, range: 3, tgt: 'enemy', ai: 'nuke', desc: 'A hard blow with triple threat. The target deals 15% less damage for 8 seconds.',
      fx: (C, u, t) => { C.damage(u, t, C.pw(u) * 1.4 + 10, 'phys', { threat: 3 }); C.buff(t, 'skullcrack', 8, { pow: -.15 }, u); } },
    shieldcharge: { name: 'Shield Charge', icon: '🐂', lvl: 21, kind: 'util', cost: 10, cd: 15, range: 22, tgt: 'enemy', ai: 'gap', desc: 'Charge to the target and knock it senseless for 1.5 seconds (bosses only take the threat).',
      fx: (C, u, t) => { C.leapTo(u, t); if (noBoss(t)) C.stun(u, t, 1.5); C.damage(u, t, C.pw(u) * .6 + 6, 'phys', { threat: 4 }); } },
    earthshaker: { name: 'Earthshaker', icon: '🌋', lvl: 24, kind: 'attack', cost: 25, cd: 12, range: 0, tgt: 'self', ai: 'aoe', desc: 'Stamp the ground: every enemy within 8 m is hit with triple threat and staggered for a second.',
      fx: (C, u) => { for (const e of near(C, u, u, 8)) { C.damage(u, e, C.pw(u) * 1.1 + 8, 'phys', { threat: 3 }); if (noBoss(e)) C.stun(u, e, 1); } C.fxRing(u, 8, [.8, .6, .4]); } },
    intervene: { name: 'Intervene', icon: '🤝', lvl: 27, kind: 'util', cd: 25, gcd: false, range: 25, tgt: 'ally', ai: 'peel', desc: 'An ally takes 30% less damage for 6 seconds, and everything hitting them turns on you.',
      fx: (C, u, t) => { C.buff(t, 'intervene', 6, { dr: .3 }, u); for (const m of near(C, u, t, 10)) if (m.target === t) C.taunt(u, m); } },
    laststand: { name: 'Last Stand', icon: '❤️‍🔥', lvl: 30, kind: 'util', cd: 90, gcd: false, tgt: 'self', ai: 'def', desc: '+30% maximum health for 15 seconds, and you heal 30%.',
      fx: (C, u) => { C.buff(u, 'laststand', 15, { hp: .3 }, u); C.heal(u, u, u.maxHp * .3); } },
    lampbreaker: { name: 'Lampbreaker Blow', icon: '🔨', lvl: 36, kind: 'attack', cost: 30, cd: 10, range: 3, tgt: 'enemy', school: 'holy', ai: 'nuke', desc: 'A blow wrapped in lamplight: heavy holy damage, triple threat, and you heal 8% of your health.',
      fx: (C, u, t) => { C.damage(u, t, C.pw(u) * 2.2 + 20, 'holy', { threat: 3 }); C.heal(u, u, u.maxHp * .08); } },
    ironbastion: { name: 'Bastion of Iron', icon: '🏰', lvl: 39, kind: 'util', cd: 120, gcd: false, tgt: 'self', ai: 'gdef', desc: 'For 10 seconds you take 40% less damage and your group takes 20% less.',
      fx: (C, u) => { for (const p of party(C, u, 40)) C.buff(p, 'ironbastion', 10, { dr: p === u ? .4 : .2 }, u); C.fxRing(u, 10, [.8, .8, .9]); } },
  },
  wardancer: {
    feint: { name: 'Feint', icon: '💫', lvl: 18, kind: 'attack', cost: 0, cd: 6, range: 3, tgt: 'enemy', ai: 'nuke', desc: 'A false cut and a true one: triple threat, and 10 momentum.',
      fx: (C, u, t) => { C.damage(u, t, C.pw(u) * 1.1 + 8, 'phys', { threat: 3 }); C.gain(u, 10); } },
    dancestep: { name: 'Dance Step', icon: '🩰', lvl: 21, kind: 'util', cd: 20, gcd: false, tgt: 'self', ai: 'def', desc: '+30% dodge and +20% attack speed for 6 seconds.',
      fx: (C, u) => C.buff(u, 'dancestep', 6, { dodge: .3, haste: .2 }, u) },
    bladestorm: { name: 'Bladestorm', icon: '⚔️', lvl: 24, kind: 'attack', cost: 20, cd: 12, range: 0, tgt: 'self', ai: 'aoe', desc: 'Cut through every enemy within 8 m with triple threat.',
      fx: (C, u) => { for (const e of near(C, u, u, 8)) C.damage(u, e, C.pw(u) * 1.2 + 8, 'phys', { threat: 3 }); C.fxRing(u, 8, [.9, .9, 1]); } },
    stealshow: { name: 'Steal the Show', icon: '🎭', lvl: 27, kind: 'util', cd: 25, range: 0, tgt: 'self', ai: 'taunt', desc: 'Every enemy within 12 m that is hitting someone else turns on you.',
      fx: (C, u) => { for (const m of near(C, u, u, 12)) if (m.target !== u) C.taunt(u, m); } },
    perfectform: { name: 'Perfect Form', icon: '🌀', lvl: 30, kind: 'util', cd: 90, gcd: false, tgt: 'self', ai: 'def', desc: '+50% dodge for 10 seconds, and you heal 20%.',
      fx: (C, u) => { C.buff(u, 'perfectform', 10, { dodge: .5 }, u); C.heal(u, u, u.maxHp * .2); } },
    cyclonestrike: { name: 'Cyclone Strike', icon: '🌪️', lvl: 36, kind: 'attack', cost: 30, cd: 10, range: 3, tgt: 'enemy', ai: 'nuke', desc: 'A spinning strike: heavy damage to the target and a third as much to everything within 6 m, all with triple threat.',
      fx: (C, u, t) => { C.damage(u, t, C.pw(u) * 2.4 + 18, 'phys', { threat: 3 }); for (const e of near(C, u, t, 6)) if (e !== t) C.damage(u, e, C.pw(u) * .8, 'phys', { threat: 3 }); } },
    lastdance: { name: 'The Last Dance', icon: '💃', lvl: 39, kind: 'util', cd: 120, gcd: false, tgt: 'self', ai: 'gdef', desc: 'For 10 seconds you dodge 40% more and your group takes 20% less damage.',
      fx: (C, u) => { for (const p of party(C, u, 40)) C.buff(p, 'lastdance', 10, p === u ? { dodge: .4 } : { dr: .2 }, u); C.fxRing(u, 10, [1, .7, .9]); } },
  },
  bladewarden: {
    crossguard: { name: 'Crossguard', icon: '✝️', lvl: 18, kind: 'util', cd: 20, gcd: false, tgt: 'self', ai: 'def', desc: '+30% parry for 6 seconds.',
      fx: (C, u) => C.buff(u, 'crossguard', 6, { parry: .3 }, u) },
    rend: { name: 'Rend', icon: '🩸', lvl: 21, kind: 'attack', cost: 15, range: 3.2, tgt: 'enemy', ai: 'dot', desc: 'A cut with double threat that bleeds for 12 seconds.',
      fx: (C, u, t) => { C.damage(u, t, C.pw(u) * .6 + 5, 'phys', { threat: 2 }); C.dot(u, t, 'rend', C.pw(u) * .3 + 2, 12, 'phys'); } },
    ironcleave: { name: 'Iron Cleave', icon: '🪓', lvl: 24, kind: 'attack', cost: 20, cd: 8, range: 0, tgt: 'self', ai: 'aoe', desc: 'Cleave every enemy within 6 m with triple threat.',
      fx: (C, u) => { for (const e of near(C, u, u, 6)) C.damage(u, e, C.pw(u) * 1.3 + 9, 'phys', { threat: 3 }); C.fxRing(u, 6, [.9, .9, .9]); } },
    roar: { name: 'Challenging Roar', icon: '📢', lvl: 27, kind: 'util', cd: 30, range: 0, tgt: 'self', ai: 'taunt', desc: 'Every enemy within 12 m must attack you.',
      fx: (C, u) => { for (const m of near(C, u, u, 12)) C.taunt(u, m); C.fxRing(u, 12, [1, .5, .3]); } },
    sunder: { name: 'Sunder', icon: '🔩', lvl: 30, kind: 'attack', cost: 20, cd: 12, range: 3.2, tgt: 'enemy', ai: 'nuke', desc: 'Crack the target\'s guard: damage, and it takes 8% more damage from everyone for 12 seconds.',
      fx: (C, u, t) => { C.damage(u, t, C.pw(u) * 1.5 + 10, 'phys', { threat: 2 }); C.buff(t, 'sunder', 12, { vuln: .08 }, u); } },
    wardenstand: { name: 'Warden\'s Stand', icon: '🛡️', lvl: 36, kind: 'util', cd: 90, gcd: false, tgt: 'self', ai: 'def', desc: 'Take 40% less damage for 10 seconds.',
      fx: (C, u) => C.buff(u, 'wardenstand', 10, { dr: .4 }, u) },
    verdict: { name: 'Final Verdict', icon: '⚖️', lvl: 39, kind: 'attack', cost: 35, cd: 15, range: 3.2, tgt: 'enemy', ai: 'exec', desc: 'A huge blow with triple threat, doubled on targets below 30% health.',
      fx: (C, u, t) => C.damage(u, t, (C.pw(u) * 3 + 24) * (t.hp < t.maxHp * .3 ? 2 : 1), 'phys', { threat: 3 }) },
  },
  monk: {
    crane: { name: 'Crane Kick', icon: '🦩', lvl: 18, kind: 'attack', cost: 30, cd: 6, range: 3, tgt: 'enemy', ai: 'nuke', desc: 'A high, hard kick.',
      fx: (C, u, t) => C.damage(u, t, C.pw(u) * 1.6 + 10, 'phys') },
    chiburst: { name: 'Chi Burst', icon: '☯️', lvl: 21, kind: 'attack', cost: 25, cd: 15, range: 0, tgt: 'self', ai: 'aoe', desc: 'Hits every enemy within 8 m, and heals your group within 15 m a little.',
      fx: (C, u) => { for (const e of near(C, u, u, 8)) C.damage(u, e, C.pw(u) * 1.1 + 8, 'phys'); for (const p of party(C, u, 15)) C.heal(u, p, C.pw(u) * .5 + 6); C.fxRing(u, 8, [.6, 1, .8]); } },
    dragonpunch: { name: 'Dragon Punch', icon: '🐉', lvl: 24, kind: 'attack', cost: 35, cd: 10, range: 3, tgt: 'enemy', ai: 'nuke', desc: 'Heavy damage, and a one-second stun (not bosses).',
      fx: (C, u, t) => { C.damage(u, t, C.pw(u) * 2.2 + 14, 'phys'); if (noBoss(t)) C.stun(u, t, 1); } },
    stillwater: { name: 'Still Water', icon: '🧘', lvl: 27, kind: 'util', cd: 45, gcd: false, tgt: 'self', ai: 'def', desc: 'Heal 25% of your health and take 20% less damage for 6 seconds.',
      fx: (C, u) => { C.heal(u, u, u.maxHp * .25); C.buff(u, 'stillwater', 6, { dr: .2 }, u); } },
    pressure: { name: 'Pressure Point', icon: '👉', lvl: 30, kind: 'util', cost: 20, cd: 20, range: 3, tgt: 'enemy', ai: 'nuke', desc: 'Stops any spell being cast, and the target takes 10% more damage for 10 seconds.',
      fx: (C, u, t) => { C.interrupt(t); C.buff(t, 'pressure', 10, { vuln: .1 }, u); } },
    fiststorm: { name: 'Storm of Fists', icon: '🌪️', lvl: 36, kind: 'attack', cost: 40, cd: 14, range: 0, tgt: 'self', ai: 'aoe', desc: 'Heavy damage to every enemy within 6 m.',
      fx: (C, u) => { for (const e of near(C, u, u, 6)) C.damage(u, e, C.pw(u) * 1.8 + 12, 'phys'); C.fxRing(u, 6, [1, .9, .6]); } },
    lotus: { name: 'Open the Lotus', icon: '🪷', lvl: 39, kind: 'util', cd: 120, gcd: false, tgt: 'self', ai: 'big', desc: '+40% attack speed and +15% critical chance for 12 seconds.',
      fx: (C, u) => C.buff(u, 'lotus', 12, { haste: .4, crit: .15 }, u) },
  },
  cleric: {
    holyrenewal: { name: 'Holy Renewal', icon: '🌟', lvl: 18, kind: 'heal', cost: 10, range: 30, tgt: 'ally', ai: 'hot', desc: 'Heals over 12 seconds.',
      fx: (C, u, t) => C.hot(u, t, 'holyrenewal', C.pw(u) * 2.2 + 24, 12) },
    holyfire: { name: 'Holy Fire', icon: '🔥', lvl: 21, kind: 'attack', cost: 10, cast: 2, range: 30, tgt: 'enemy', school: 'holy', ai: 'nuke', desc: 'Holy damage that keeps burning for 6 seconds.',
      fx: (C, u, t) => { C.bolt(u, t, C.pw(u) * 1.6 + 12, 'holy'); C.dot(u, t, 'holyfire', C.pw(u) * .15 + 2, 6, 'holy'); } },
    circle: { name: 'Circle of Light', icon: '⭕', lvl: 24, kind: 'heal', cost: 24, cd: 10, range: 30, tgt: 'ally', ai: 'healG', desc: 'Heals the target and every ally within 10 m of them.',
      fx: (C, u, t) => { for (const p of C.partyOf(u)) if (!p.dead && C.d(t, p) < 10) C.heal(u, p, C.pw(u) * 1.2 + 14); C.fxRing(t, 10, [1, .95, .6]); } },
    greaterheal: { name: 'Greater Heal', icon: '💛', lvl: 27, kind: 'heal', cost: 20, cast: 3, range: 30, tgt: 'ally', ai: 'heal1', desc: 'A slow, very big heal.',
      fx: (C, u, t) => C.heal(u, t, C.pw(u) * 3.4 + 40) },
    purify: { name: 'Purify', icon: '✨', lvl: 30, kind: 'heal', cost: 8, cd: 6, range: 30, tgt: 'ally', ai: 'heal1', desc: 'An instant heal that also clears one harmful effect.',
      fx: (C, u, t) => { C.heal(u, t, C.pw(u) * .8 + 8); const i = t.buffs.findIndex(b => b.data.dot || b.data.slow || b.data.root || (b.data.pow < 0)); if (i >= 0) t.buffs.splice(i, 1); } },
    salvation: { name: 'Word of Salvation', icon: '🕊️', lvl: 36, kind: 'heal', cost: 26, cd: 45, range: 0, tgt: 'self', ai: 'healG', desc: 'Heals everyone in your group within 30 m, and they take 15% less damage for 6 seconds.',
      fx: (C, u) => { for (const p of party(C, u, 30)) { C.heal(u, p, C.pw(u) * 1.6 + 20); C.buff(p, 'salvation', 6, { dr: .15 }, u); } C.fxRing(u, 30, [1, 1, .8]); } },
    halo: { name: 'Halo of Dawn', icon: '😇', lvl: 39, kind: 'heal', cost: 22, cd: 30, range: 0, tgt: 'self', ai: 'healG', desc: 'A ring of light: heals your group within 25 m and burns enemies within 12 m.',
      fx: (C, u) => { for (const p of party(C, u, 25)) C.heal(u, p, C.pw(u) * 1.4 + 16); for (const e of near(C, u, u, 12)) C.damage(u, e, C.pw(u) * 1.0 + 8, 'holy'); C.fxRing(u, 12, [1, .9, .5]); } },
  },
  aegis: {
    wardinglight: { name: 'Warding Light', icon: '💠', lvl: 18, kind: 'heal', cost: 14, range: 30, tgt: 'ally', ai: 'heal1', desc: 'A ward and a heal at once.',
      fx: (C, u, t) => { C.ward(u, t, C.pw(u) * 1.6 + 16, 15, true); C.heal(u, t, C.pw(u) * .8 + 8); } },
    lance: { name: 'Lance of Faith', icon: '⚡', lvl: 21, kind: 'attack', cost: 9, cast: 1.5, range: 30, tgt: 'enemy', school: 'holy', ai: 'nuke', desc: 'Holy damage, and a small ward on the most hurt person in your group.',
      fx: (C, u, t) => { C.bolt(u, t, C.pw(u) * 1.3 + 10, 'holy'); const low = party(C, u, 30).sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0]; if (low) C.ward(u, low, C.pw(u) * .6 + 6, 10, true); } },
    linkedwards: { name: 'Linked Wards', icon: '🔗', lvl: 24, kind: 'heal', cost: 22, cd: 15, range: 0, tgt: 'self', ai: 'healG', desc: 'A ward on everyone in your group within 25 m.',
      fx: (C, u) => { for (const p of party(C, u, 25)) C.ward(u, p, C.pw(u) * 1.0 + 10, 15, true); C.fxRing(u, 25, [.6, .8, 1]); } },
    restoringward: { name: 'Restoring Ward', icon: '💧', lvl: 27, kind: 'heal', cost: 12, range: 30, tgt: 'ally', ai: 'hot', desc: 'A ward, and healing over 10 seconds.',
      fx: (C, u, t) => { C.ward(u, t, C.pw(u) * 1.2 + 12, 15, true); C.hot(u, t, 'restoringward', C.pw(u) * 1.2 + 12, 10); } },
    hallowed: { name: 'Hallowed Ground', icon: '⛪', lvl: 30, kind: 'util', cd: 45, range: 30, tgt: 'ally', ai: 'gdefAt', desc: 'Allies within 10 m of the target take 30% less damage for 8 seconds.',
      fx: (C, u, t) => { for (const p of C.partyOf(u)) if (!p.dead && C.d(t, p) < 10) C.buff(p, 'hallowed', 8, { dr: .3 }, u); C.fxRing(t, 10, [1, .95, .7]); } },
    aegisofages: { name: 'Aegis of Ages', icon: '🛡️', lvl: 36, kind: 'heal', cost: 24, cd: 20, range: 30, tgt: 'ally', ai: 'tankSave', desc: 'A ward of seven times your power for 15 seconds.',
      fx: (C, u, t) => C.ward(u, t, C.pw(u) * 7 + 40, 15, true) },
    dawnshield: { name: 'Dawnshield', icon: '🌅', lvl: 39, kind: 'heal', cost: 30, cd: 60, range: 0, tgt: 'self', ai: 'healG', desc: 'A ward of three times your power on everyone in your group.',
      fx: (C, u) => { for (const p of party(C, u, 40)) C.ward(u, p, C.pw(u) * 3 + 20, 15, true); C.fxRing(u, 12, [1, .85, .5]); } },
  },
  lifebinder: {
    seedoflife: { name: 'Seed of Life', icon: '🌰', lvl: 18, kind: 'heal', cost: 10, range: 30, tgt: 'ally', ai: 'hot', desc: 'A third heal over time that stacks with Renew and Rejuvenate.',
      fx: (C, u, t) => C.hot(u, t, 'seedoflife', C.pw(u) * 1.8 + 20, 12) },
    lashingvines: { name: 'Lashing Vines', icon: '🌿', lvl: 21, kind: 'attack', cost: 8, cast: 1.5, range: 30, tgt: 'enemy', school: 'nature', ai: 'nuke', desc: 'Nature damage, and the vines keep cutting for 8 seconds.',
      fx: (C, u, t) => { C.bolt(u, t, C.pw(u) * 1.2 + 9, 'nature'); C.dot(u, t, 'lashingvines', C.pw(u) * .2 + 2, 8, 'nature'); } },
    healinggrove: { name: 'Healing Grove', icon: '🌳', lvl: 24, kind: 'heal', cost: 20, cd: 20, range: 0, tgt: 'self', ai: 'healG', desc: 'Heals everyone in your group within 20 m over 10 seconds.',
      fx: (C, u) => { for (const p of party(C, u, 20)) C.hot(u, p, 'healinggrove', C.pw(u) * 1.6 + 16, 10); C.fxRing(u, 20, [.5, 1, .5]); } },
    nourish: { name: 'Nourish', icon: '🍃', lvl: 27, kind: 'heal', cost: 14, cast: 2, range: 30, tgt: 'ally', ai: 'heal1', desc: 'A direct heal, 25% stronger for each of your heals over time on the target.',
      fx: (C, u, t) => { const n = t.buffs.filter(b => b.data.hot && b.src === u).length; C.heal(u, t, (C.pw(u) * 1.6 + 16) * (1 + .25 * n)); } },
    barkward: { name: 'Barkward', icon: '🪵', lvl: 30, kind: 'util', cd: 40, gcd: false, range: 30, tgt: 'ally', ai: 'tankSave', desc: 'The target takes 25% less damage for 8 seconds.',
      fx: (C, u, t) => C.buff(t, 'barkward', 8, { dr: .25 }, u) },
    verdanttide: { name: 'Verdant Tide', icon: '🌊', lvl: 36, kind: 'heal', cost: 24, cd: 30, range: 0, tgt: 'self', ai: 'healG', desc: 'Heals everyone in your group within 30 m, then keeps healing them for 8 seconds.',
      fx: (C, u) => { for (const p of party(C, u, 30)) { C.heal(u, p, C.pw(u) * 1.4 + 14); C.hot(u, p, 'verdanttide', C.pw(u) * 1.0 + 10, 8); } C.fxRing(u, 30, [.4, 1, .6]); } },
    worldtree: { name: 'Bloom of the World-Tree', icon: '🌸', lvl: 39, kind: 'heal', cost: 30, cd: 90, range: 0, tgt: 'self', ai: 'healG', desc: 'A big heal over 12 seconds on everyone in your group.',
      fx: (C, u) => { for (const p of party(C, u, 40)) C.hot(u, p, 'worldtree', C.pw(u) * 4 + 40, 12); C.fxRing(u, 14, [1, .7, .85]); } },
  },
  druid: {
    swarm: { name: 'Insect Swarm', icon: '🐝', lvl: 18, kind: 'attack', cost: 8, range: 30, tgt: 'enemy', school: 'nature', ai: 'dot', desc: 'Nature damage over 12 seconds.',
      fx: (C, u, t) => C.dot(u, t, 'swarm', C.pw(u) * .3 + 3, 12, 'nature') },
    wrath: { name: 'Wrath', icon: '⚡', lvl: 21, kind: 'attack', cost: 9, cast: 2, range: 30, tgt: 'enemy', school: 'nature', ai: 'nuke', desc: 'Nature damage.',
      fx: (C, u, t) => C.bolt(u, t, C.pw(u) * 1.5 + 10, 'nature') },
    swiftness: { name: 'Nature\'s Swiftness', icon: '🍀', lvl: 24, kind: 'heal', cost: 14, cd: 30, range: 30, tgt: 'ally', ai: 'heal1', desc: 'An instant, big heal.',
      fx: (C, u, t) => C.heal(u, t, C.pw(u) * 2.6 + 28) },
    cyclone: { name: 'Cyclone', icon: '🌪️', lvl: 27, kind: 'util', cost: 10, cd: 20, range: 30, tgt: 'enemy', ai: 'cc', desc: 'Lifts the target off its feet for 4 seconds. Not bosses.',
      fx: (C, u, t) => { if (noBoss(t)) C.stun(u, t, 4); } },
    tranquilgrove: { name: 'Tranquil Grove', icon: '🏞️', lvl: 30, kind: 'heal', cost: 22, cd: 40, range: 0, tgt: 'self', ai: 'healG', desc: 'Heals everyone in your group within 25 m, then keeps healing them for 8 seconds.',
      fx: (C, u) => { for (const p of party(C, u, 25)) { C.heal(u, p, C.pw(u) * 1.3 + 12); C.hot(u, p, 'tranquilgrove', C.pw(u) * .8 + 8, 8); } C.fxRing(u, 25, [.5, 1, .6]); } },
    moonstorm: { name: 'Moonstorm', icon: '🌕', lvl: 36, kind: 'attack', cost: 20, cd: 18, range: 30, tgt: 'enemy', school: 'nature', ai: 'aoe', desc: 'Moonlight hammers every enemy within 8 m of the target and slows them.',
      fx: (C, u, t) => { for (const e of near(C, u, t, 8)) { C.damage(u, e, C.pw(u) * 1.6 + 12, 'nature'); C.buff(e, 'moonstorm', 6, { slow: .3 }, u); } C.fxRing(t, 8, [.8, .85, 1]); } },
    wildheart: { name: 'Heart of the Wild', icon: '🐾', lvl: 39, kind: 'util', cd: 120, gcd: false, tgt: 'self', ai: 'big', desc: 'Your group gets +10% power and +10% health for 20 seconds.',
      fx: (C, u) => { for (const p of party(C, u, 40)) C.buff(p, 'wildheart', 20, { pow: .1, hp: .1 }, u); C.fxRing(u, 12, [.6, 1, .5]); } },
  },
  longwatch: {
    serpent: { name: 'Serpent Sting', icon: '🐍', lvl: 18, kind: 'attack', cost: 15, range: 36, tgt: 'enemy', school: 'nature', ai: 'dot', desc: 'Nature damage over 15 seconds.',
      fx: (C, u, t) => C.dot(u, t, 'serpent', C.pw(u) * .25 + 3, 15, 'nature') },
    arcaneshot: { name: 'Arcane Shot', icon: '✴️', lvl: 21, kind: 'attack', cost: 25, cd: 6, range: 36, tgt: 'enemy', ai: 'nuke', desc: 'An instant, hard-hitting shot.',
      fx: (C, u, t) => C.shoot(u, t, C.pw(u) * 1.5 + 12) },
    explosive: { name: 'Explosive Shot', icon: '💣', lvl: 24, kind: 'attack', cost: 35, cd: 12, range: 36, tgt: 'enemy', school: 'fire', ai: 'nuke', desc: 'A shot that bursts: damage to the target and half as much fire to everything within 5 m of it.',
      fx: (C, u, t) => { C.shoot(u, t, C.pw(u) * 1.4 + 10); for (const e of near(C, u, t, 5)) if (e !== t) C.damage(u, e, C.pw(u) * .7, 'fire'); C.fxRing(t, 5, [1, .5, .2]); } },
    huntersmark: { name: 'Hunter\'s Mark', icon: '🎯', lvl: 27, kind: 'util', cost: 10, cd: 30, range: 40, tgt: 'enemy', ai: 'debuff', desc: 'The target takes 10% more damage from everyone for 15 seconds.',
      fx: (C, u, t) => C.buff(t, 'huntersmark', 15, { vuln: .1 }, u) },
    barrage: { name: 'Barrage', icon: '🏹', lvl: 30, kind: 'attack', cost: 40, cd: 20, range: 36, tgt: 'enemy', ai: 'nuke', desc: 'Five quick arrows at the target.',
      fx: (C, u, t) => { for (let i = 0; i < 5; i++) C.shoot(u, t, C.pw(u) * .6 + 4); } },
    killshot: { name: 'Kill Shot', icon: '☠️', lvl: 36, kind: 'attack', cost: 30, cd: 10, range: 36, tgt: 'enemy', ai: 'exec', desc: 'A heavy shot, doubled on targets below 25% health.',
      fx: (C, u, t) => C.shoot(u, t, (C.pw(u) * 2.6 + 20) * (t.hp < t.maxHp * .25 ? 2 : 1)) },
    starvolley: { name: 'Starfall Volley', icon: '🌠', lvl: 39, kind: 'attack', cost: 45, cd: 30, range: 36, tgt: 'enemy', ai: 'aoe', desc: 'Arrows like falling stars on every enemy within 9 m of the target, slowing them.',
      fx: (C, u, t) => { for (const e of near(C, u, t, 9)) { C.damage(u, e, C.pw(u) * 1.5 + 12, 'phys'); C.buff(e, 'starvolley', 6, { slow: .3 }, u); } C.fxRing(t, 9, [.9, .9, 1]); } },
  },
  knifeshade: {
    eviscerate: { name: 'Eviscerate', icon: '🔪', lvl: 18, kind: 'attack', cost: 35, cd: 6, range: 3, tgt: 'enemy', ai: 'nuke', desc: 'A vicious strike from any side.',
      fx: (C, u, t) => C.damage(u, t, C.pw(u) * 1.9 + 12, 'phys') },
    kidney: { name: 'Kidney Shot', icon: '🥊', lvl: 21, kind: 'util', cost: 25, cd: 20, range: 3, tgt: 'enemy', ai: 'cc', desc: 'Stun for 3 seconds and stop any spell. Not bosses.',
      fx: (C, u, t) => { C.interrupt(t); if (noBoss(t)) C.stun(u, t, 3); } },
    shadowstrike: { name: 'Shadow Strike', icon: '🌑', lvl: 24, kind: 'attack', cost: 40, cd: 12, range: 3, tgt: 'enemy', school: 'shadow', ai: 'nuke', desc: 'Heavy shadow damage from any side.',
      fx: (C, u, t) => C.damage(u, t, C.pw(u) * 2.4 + 16, 'shadow') },
    blind: { name: 'Blind', icon: '🙈', lvl: 27, kind: 'util', cost: 20, cd: 30, range: 8, tgt: 'enemy', ai: 'cc', desc: 'The target wanders blind for 8 seconds. Any damage ends it. Not bosses.',
      fx: (C, u, t) => { if (noBoss(t)) C.mez(u, t, 8); } },
    cloak: { name: 'Cloak of Shadows', icon: '🧥', lvl: 30, kind: 'util', cd: 60, gcd: false, tgt: 'self', ai: 'def', desc: 'Take 50% less damage for 5 seconds and shed half your threat.',
      fx: (C, u) => { C.buff(u, 'cloak', 5, { dr: .5 }, u); C.dropThreat(u, .5); } },
    assassinate: { name: 'Assassinate', icon: '💀', lvl: 36, kind: 'attack', cost: 50, cd: 15, range: 3, tgt: 'enemy', ai: 'exec', desc: 'Enormous damage, doubled on targets below 30% health.',
      fx: (C, u, t) => C.damage(u, t, (C.pw(u) * 3.2 + 24) * (t.hp < t.maxHp * .3 ? 2 : 1), 'phys') },
    bladefury: { name: 'Blade Fury', icon: '🌀', lvl: 39, kind: 'attack', cost: 45, cd: 18, range: 0, tgt: 'self', ai: 'aoe', desc: 'Knives through every enemy within 7 m.',
      fx: (C, u) => { for (const e of near(C, u, u, 7)) C.damage(u, e, C.pw(u) * 1.8 + 12, 'phys'); C.fxRing(u, 7, [.7, .7, .8]); } },
  },
  blightblade: {
    venomspit: { name: 'Venom Spit', icon: '🫗', lvl: 18, kind: 'attack', cost: 20, range: 15, tgt: 'enemy', ai: 'nuke', desc: 'A ranged poison spit: damage and two stacks of poison.',
      fx: (C, u, t) => { C.damage(u, t, C.pw(u) * .8 + 6, 'poison'); C.poison(u, t, 2); } },
    hemorrhage: { name: 'Hemorrhage', icon: '🩸', lvl: 21, kind: 'attack', cost: 25, cd: 8, range: 3, tgt: 'enemy', ai: 'nuke', desc: 'A deep cut. The target takes 5% more damage for 10 seconds.',
      fx: (C, u, t) => { C.damage(u, t, C.pw(u) * 1.3 + 9, 'phys'); C.buff(t, 'hemorrhage', 10, { vuln: .05 }, u); } },
    mire: { name: 'Blight Mire', icon: '🟢', lvl: 24, kind: 'attack', cost: 30, cd: 15, range: 20, tgt: 'enemy', ai: 'aoe', desc: 'Two stacks of poison on every enemy within 7 m of the target, and they slow by 30%.',
      fx: (C, u, t) => { for (const e of near(C, u, t, 7)) { C.poison(u, e, 2); C.buff(e, 'mire', 8, { slow: .3 }, u); } C.fxRing(t, 7, [.5, 1, .3]); } },
    dose: { name: 'Concentrated Dose', icon: '💉', lvl: 27, kind: 'attack', cost: 30, cd: 12, range: 3, tgt: 'enemy', ai: 'nuke', desc: 'Four stacks of poison at once.',
      fx: (C, u, t) => C.poison(u, t, 4) },
    vapors: { name: 'Toxic Vapors', icon: '☁️', lvl: 30, kind: 'util', cd: 60, gcd: false, tgt: 'self', ai: 'def', desc: '+30% dodge for 6 seconds, and you shed 30% of your threat.',
      fx: (C, u) => { C.buff(u, 'vapors', 6, { dodge: .3 }, u); C.dropThreat(u, .3); } },
    blackrot: { name: 'Black Rot', icon: '🦠', lvl: 36, kind: 'attack', cost: 35, cd: 10, range: 3, tgt: 'enemy', school: 'poison', ai: 'nuke', desc: 'Damage for every stack of your poison on the target, without using the stacks up.',
      fx: (C, u, t) => C.damage(u, t, (C.pw(u) * .55 + 4) * Math.max(1, C.poisonStacks(t, u)), 'poison') },
    outbreak: { name: 'Outbreak', icon: '☣️', lvl: 39, kind: 'attack', cost: 40, cd: 45, range: 0, tgt: 'self', ai: 'aoe', desc: 'Three stacks of poison on every enemy within 12 m, and they rot for 8 seconds.',
      fx: (C, u) => { for (const e of near(C, u, u, 12)) { C.poison(u, e, 3); C.dot(u, e, 'outbreak', C.pw(u) * .4 + 3, 8, 'poison'); } C.fxRing(u, 12, [.5, 1, .2]); } },
  },
  bard: {
    dirge: { name: 'Dirge of Ruin', icon: '🎻', lvl: 18, kind: 'attack', cost: 8, range: 28, tgt: 'enemy', school: 'storm', ai: 'nuke', desc: 'A sour chord: damage, and the target deals 10% less for 10 seconds.',
      fx: (C, u, t) => { C.damage(u, t, C.pw(u) * 1.2 + 8, 'storm'); C.buff(t, 'dirge', 10, { pow: -.1 }, u); } },
    mending: { name: 'Ballad of Mending', icon: '🎶', lvl: 21, kind: 'heal', cost: 12, cd: 15, range: 0, tgt: 'self', ai: 'healG', desc: 'Song: your group heals over 10 seconds.',
      fx: (C, u) => { for (const p of party(C, u, 30)) C.hot(u, p, 'mending', C.pw(u) * 1.4 + 14, 10); } },
    refrain: { name: 'Thunderous Refrain', icon: '⛈️', lvl: 24, kind: 'attack', cost: 16, cd: 12, range: 28, tgt: 'enemy', school: 'storm', ai: 'aoe', desc: 'Storm damage to every enemy within 8 m of the target.',
      fx: (C, u, t) => { for (const e of near(C, u, t, 8)) C.damage(u, e, C.pw(u) * 1.2 + 8, 'storm'); C.fxRing(t, 8, [.7, .8, 1]); } },
    aria: { name: 'Aria of Warding', icon: '🎼', lvl: 27, kind: 'util', cost: 14, cd: 40, range: 0, tgt: 'self', ai: 'gdef', desc: 'A ward on everyone in your group within 30 m.',
      fx: (C, u) => { for (const p of party(C, u, 30)) C.ward(u, p, C.pw(u) * 1.5 + 12, 15, true); } },
    discord: { name: 'Discordant Note', icon: '🎵', lvl: 30, kind: 'util', cost: 10, cd: 15, range: 28, tgt: 'enemy', ai: 'nuke', desc: 'Stops any spell being cast and slows the target by 30% for 8 seconds.',
      fx: (C, u, t) => { C.interrupt(t); C.buff(t, 'discord', 8, { slow: .3 }, u); } },
    anthem: { name: 'War Anthem', icon: '🥁', lvl: 36, kind: 'util', cost: 16, cd: 60, range: 0, tgt: 'self', ai: 'big', desc: 'Song: your group gets +12% power and +10% attack speed for 20 seconds.',
      fx: (C, u) => { for (const p of party(C, u, 40)) C.buff(p, 'anthem', 20, { pow: .12, haste: .1 }, u); C.fxRing(u, 12, [1, .8, .5]); } },
    finale: { name: 'Grand Finale', icon: '🎺', lvl: 39, kind: 'attack', cost: 24, cd: 30, range: 0, tgt: 'self', ai: 'aoe', desc: 'Storm damage to every enemy within 12 m, and your group heals a little.',
      fx: (C, u) => { for (const e of near(C, u, u, 12)) C.damage(u, e, C.pw(u) * 2.0 + 14, 'storm'); for (const p of party(C, u, 30)) C.heal(u, p, C.pw(u) * .6 + 6); C.fxRing(u, 12, [1, .9, .5]); } },
  },
  elementalist: {
    flamewave: { name: 'Flame Wave', icon: '🔥', lvl: 18, kind: 'attack', cost: 16, cd: 10, range: 0, tgt: 'self', school: 'fire', ai: 'aoe', desc: 'Fire rolls out over every enemy within 8 m.',
      fx: (C, u) => { for (const e of near(C, u, u, 8)) C.damage(u, e, C.pw(u) * 1.2 + 8, 'fire'); C.fxRing(u, 8, [1, .5, .2]); } },
    icelance: { name: 'Ice Lance', icon: '🧊', lvl: 21, kind: 'attack', cost: 9, range: 32, tgt: 'enemy', school: 'frost', ai: 'nuke', desc: 'Instant frost damage, doubled on a slowed or rooted target.',
      fx: (C, u, t) => C.bolt(u, t, (C.pw(u) * 1.1 + 8) * (t.buffs.some(b => b.data.slow || b.data.root) ? 2 : 1), 'frost') },
    tempest: { name: 'Tempest', icon: '🌩️', lvl: 24, kind: 'attack', cost: 20, cd: 15, range: 32, tgt: 'enemy', school: 'storm', ai: 'aoe', desc: 'Lightning that jumps to four more enemies.',
      fx: (C, u, t) => C.chain(u, t, C.pw(u) * 1.4 + 10, 'storm', 4) },
    magma: { name: 'Magma Pool', icon: '🌋', lvl: 27, kind: 'attack', cost: 18, cd: 18, range: 32, tgt: 'enemy', school: 'earth', ai: 'aoe', desc: 'Molten stone under every enemy within 6 m of the target: earth damage over 8 seconds.',
      fx: (C, u, t) => { for (const e of near(C, u, t, 6)) C.dot(u, e, 'magma', C.pw(u) * .4 + 3, 8, 'earth'); C.fxRing(t, 6, [1, .4, .1]); } },
    ebarrier: { name: 'Elemental Barrier', icon: '🔷', lvl: 30, kind: 'util', cd: 45, gcd: false, tgt: 'self', ai: 'def', desc: 'A shield of four times your power for 15 seconds.',
      fx: (C, u) => C.ward(u, u, C.pw(u) * 4 + 30, 15, true) },
    fourfold: { name: 'Fourfold Bolt', icon: '🔆', lvl: 36, kind: 'attack', cost: 22, cast: 2.5, cd: 8, range: 32, tgt: 'enemy', ai: 'nuke', desc: 'Heavy damage of whatever element the target is weakest to.',
      fx: (C, u, t) => C.bolt(u, t, C.pw(u) * 2.8 + 20, C.weakOf ? C.weakOf(t) || 'arcane' : 'arcane') },
    firestorm: { name: 'Firestorm', icon: '🌋', lvl: 39, kind: 'attack', cost: 30, cd: 25, range: 32, tgt: 'enemy', school: 'fire', ai: 'aoe', desc: 'A storm of fire on every enemy within 10 m of the target, and they keep burning.',
      fx: (C, u, t) => { for (const e of near(C, u, t, 10)) { C.damage(u, e, C.pw(u) * 2.0 + 14, 'fire'); C.dot(u, e, 'firestorm', C.pw(u) * .3 + 2, 6, 'fire'); } C.fxRing(t, 10, [1, .45, .1]); } },
  },
  warlock: {
    immolate: { name: 'Immolate', icon: '🔥', lvl: 18, kind: 'attack', cost: 10, cast: 1.5, range: 32, tgt: 'enemy', school: 'fire', ai: 'dot', desc: 'Fire damage, then more over 15 seconds.',
      fx: (C, u, t) => { C.bolt(u, t, C.pw(u) * .9 + 6, 'fire'); C.dot(u, t, 'immolate', C.pw(u) * .3 + 2, 15, 'fire'); } },
    siphon: { name: 'Siphon Soul', icon: '👻', lvl: 21, kind: 'attack', cost: 9, range: 32, tgt: 'enemy', school: 'shadow', ai: 'dot', desc: 'Shadow damage over 12 seconds, and you heal a little as it bites.',
      fx: (C, u, t) => { C.dot(u, t, 'siphon', C.pw(u) * .35 + 3, 12, 'shadow'); C.hot(u, u, 'siphon', C.pw(u) * 1.2 + 10, 12); } },
    seedcorr: { name: 'Seed of Corruption', icon: '🌱', lvl: 24, kind: 'attack', cost: 18, cd: 12, range: 32, tgt: 'enemy', school: 'shadow', ai: 'aoe', desc: 'Shadow damage over 12 seconds on every enemy within 8 m of the target.',
      fx: (C, u, t) => { for (const e of near(C, u, t, 8)) C.dot(u, e, 'seedcorr', C.pw(u) * .25 + 2, 12, 'shadow'); C.fxRing(t, 8, [.6, .2, .8]); } },
    doom: { name: 'Curse of Doom', icon: '⚰️', lvl: 27, kind: 'attack', cost: 15, cd: 30, range: 32, tgt: 'enemy', school: 'shadow', ai: 'dotBig', desc: 'A slow curse: very heavy shadow damage over 30 seconds.',
      fx: (C, u, t) => C.dot(u, t, 'doom', (C.pw(u) * 1.8 + 20) / 6, 30, 'shadow') },
    shadowfury: { name: 'Shadowfury', icon: '🌑', lvl: 30, kind: 'util', cost: 14, cd: 30, range: 30, tgt: 'enemy', school: 'shadow', ai: 'aoe', desc: 'Shadow damage to every enemy within 6 m of the target, and they are stunned for 2 seconds (not bosses).',
      fx: (C, u, t) => { for (const e of near(C, u, t, 6)) { C.damage(u, e, C.pw(u) * .8 + 6, 'shadow'); if (noBoss(e)) C.stun(u, e, 2); } C.fxRing(t, 6, [.5, .2, .7]); } },
    chaosbolt: { name: 'Chaos Bolt', icon: '☄️', lvl: 36, kind: 'attack', cost: 20, cast: 2.5, cd: 10, range: 32, tgt: 'enemy', school: 'fire', ai: 'nuke', desc: 'Very heavy fire damage.',
      fx: (C, u, t) => C.bolt(u, t, C.pw(u) * 3 + 20, 'fire') },
    darkharvest: { name: 'Dark Harvest', icon: '🌘', lvl: 39, kind: 'attack', cost: 24, cd: 45, range: 32, tgt: 'enemy', school: 'shadow', ai: 'nuke', desc: 'Damage for every one of your curses on the target, and you heal for half of it.',
      fx: (C, u, t) => { const n = t.buffs.filter(b => b.data.dot && b.src === u).length; const amt = (C.pw(u) * .9 + 8) * Math.max(1, n); C.damage(u, t, amt, 'shadow'); C.heal(u, u, amt * .5); } },
  },
  binder: {
    stormlash: { name: 'Storm Lash', icon: '⚡', lvl: 18, kind: 'attack', cost: 9, cast: 1.5, range: 30, tgt: 'enemy', school: 'storm', ai: 'nuke', desc: 'Heavy storm damage.',
      fx: (C, u, t) => C.bolt(u, t, C.pw(u) * 1.3 + 10, 'storm') },
    bondstone: { name: 'Bond of Stone', icon: '🪨', lvl: 21, kind: 'util', cd: 30, gcd: false, tgt: 'self', ai: 'def', desc: 'You and your elementals get a stone ward for 15 seconds.',
      fx: (C, u) => { for (const p of [u, ...C.petsOf(u)]) C.ward(u, p, C.pw(u) * 1.5 + 12, 15, true); } },
    surge: { name: 'Elemental Surge', icon: '🌊', lvl: 24, kind: 'attack', cost: 18, cd: 12, range: 30, tgt: 'enemy', school: 'storm', ai: 'aoe', desc: 'Storm damage to every enemy within 8 m of the target.',
      fx: (C, u, t) => { for (const e of near(C, u, t, 8)) C.damage(u, e, C.pw(u) * 1.3 + 9, 'storm'); C.fxRing(t, 8, [.5, .8, 1]); } },
    commune: { name: 'Commune', icon: '♾️', lvl: 27, kind: 'util', cd: 45, gcd: false, tgt: 'self', ai: 'mana', desc: 'Draw on your bond: get back 25% of your mana.',
      fx: (C, u) => C.gain(u, u.resMax * .25) },
    primalfury: { name: 'Primal Fury', icon: '🔥', lvl: 30, kind: 'util', cd: 60, gcd: false, tgt: 'self', ai: 'big', desc: 'Your elementals attack 40% faster and hit 20% harder for 12 seconds.',
      fx: (C, u) => { for (const p of C.petsOf(u)) C.buff(p, 'primalfury', 12, { haste: .4, pow: .2 }, u); } },
    fallfour: { name: 'Fall of the Four', icon: '🌠', lvl: 36, kind: 'attack', cost: 26, cd: 20, range: 30, tgt: 'enemy', ai: 'nuke', desc: 'Heavy damage to the target and a third as much to everything within 6 m of it.',
      fx: (C, u, t) => { C.damage(u, t, C.pw(u) * 2.6 + 18, 'arcane'); for (const e of near(C, u, t, 6)) if (e !== t) C.damage(u, e, C.pw(u) * .9, 'arcane'); C.fxRing(t, 6, [1, .9, .6]); } },
    avatar: { name: 'Avatar of the Elements', icon: '🌀', lvl: 39, kind: 'util', cd: 120, gcd: false, tgt: 'self', ai: 'big', desc: 'For 15 seconds you have +25% power and take 20% less damage.',
      fx: (C, u) => C.buff(u, 'avatar', 15, { pow: .25, dr: .2 }, u) },
  },
  illusionist: {
    mindblast: { name: 'Mind Blast', icon: '🧠', lvl: 18, kind: 'attack', cost: 10, cast: 2, range: 32, tgt: 'enemy', school: 'arcane', ai: 'nuke', desc: 'Heavy arcane damage.',
      fx: (C, u, t) => C.bolt(u, t, C.pw(u) * 1.6 + 12, 'arcane') },
    confusion: { name: 'Confusion', icon: '😵', lvl: 21, kind: 'util', cost: 10, cd: 20, range: 30, tgt: 'enemy', ai: 'debuff', desc: 'The target deals 20% less damage and moves 20% slower for 12 seconds.',
      fx: (C, u, t) => C.buff(t, 'confusion', 12, { pow: -.2, slow: .2 }, u) },
    shatter: { name: 'Shatter Mind', icon: '💥', lvl: 24, kind: 'attack', cost: 18, cd: 12, range: 30, tgt: 'enemy', school: 'arcane', ai: 'aoe', desc: 'Arcane damage to every enemy within 7 m of the target.',
      fx: (C, u, t) => { for (const e of near(C, u, t, 7)) C.damage(u, e, C.pw(u) * 1.2 + 8, 'arcane'); C.fxRing(t, 7, [.7, .5, 1]); } },
    echomind: { name: 'Echoing Mind', icon: '🔮', lvl: 27, kind: 'util', cd: 45, gcd: false, tgt: 'self', ai: 'mana', desc: 'Everyone in your group who uses mana gets back 15% of it.',
      fx: (C, u) => { for (const p of party(C, u, 40)) if (p.resType === 'mana') C.gain(p, p.resMax * .15); } },
    mirrorstep: { name: 'Mirror Step', icon: '🪞', lvl: 30, kind: 'util', cd: 30, gcd: false, tgt: 'self', ai: 'def', desc: 'Shed 60% of your threat, and dodge 30% more for 5 seconds.',
      fx: (C, u) => { C.dropThreat(u, .6); C.buff(u, 'mirrorstep', 5, { dodge: .3 }, u); } },
    nightmare: { name: 'Waking Nightmare', icon: '😱', lvl: 36, kind: 'attack', cost: 18, cd: 10, range: 30, tgt: 'enemy', school: 'arcane', ai: 'dot', desc: 'Heavy arcane damage over 10 seconds.',
      fx: (C, u, t) => C.dot(u, t, 'nightmare', C.pw(u) * .6 + 5, 10, 'arcane') },
    mindstorm: { name: 'Mind Storm', icon: '🌩️', lvl: 39, kind: 'attack', cost: 26, cd: 30, range: 30, tgt: 'enemy', school: 'arcane', ai: 'aoe', desc: 'Arcane damage to every enemy within 10 m of the target, and they slow by 30%.',
      fx: (C, u, t) => { for (const e of near(C, u, t, 10)) { C.damage(u, e, C.pw(u) * 2.0 + 14, 'arcane'); C.buff(e, 'mindstorm', 6, { slow: .3 }, u); } C.fxRing(t, 10, [.6, .4, 1]); } },
  },
};
for (const [cls, list] of Object.entries(NEW)) for (const [k, a] of Object.entries(list)) { a.key = k; a.b14 = true; CLASSES[cls].abilities[k] = a; }
export const NEW14 = NEW;

// ---------- 2. stronger versions ----------
// Every level from 17 to 40 that doesn't bring a new ability brings a version: the class's core spells take turns.
const NEW_LVLS = new Set([18, 21, 24, 27, 30, 33, 36, 39]);
const VER_LVLS = []; for (let L = 17; L <= 40; L++) if (!NEW_LVLS.has(L)) VER_LVLS.push(L);
const ROMAN = ['', 'I', 'II', 'III', 'IV', 'V', 'VI'];
export const VERS = {};
const fxSrc = a => { try { return a.fx ? a.fx.toString() : ''; } catch (e) { return ''; } };
for (const [cls, C] of Object.entries(CLASSES)) {
  const A = C.abilities, V = VERS[cls] = {};
  // lines that can grow: attacks and heals, and anything else whose strength comes from your power; never ultimates or racials
  const cand = Object.entries(A).filter(([k, a]) => !a.sub && k !== 'racial' && a.kind !== 'ult' && a.kind !== 'racial' && a.kind !== 'buff' && a.lvl < 99
    && (a.kind === 'attack' || a.kind === 'heal' || fxSrc(a).includes('pw(')));
  const order = cand.map(([k]) => k);
  // each version level goes to the line with the fewest versions so far (earliest learned first), at most three each
  for (const L of VER_LVLS) {
    const ok = order.filter(k => A[k].lvl <= L - 3 && (V[k]?.length || 0) < 3);
    if (!ok.length) continue;
    ok.sort((x, y) => (V[x]?.length || 0) - (V[y]?.length || 0) || A[x].lvl - A[y].lvl);
    (V[ok[0]] = V[ok[0]] || []).push(L);
  }
}
// which version of a spell someone has, and the level it arrived
BOOK.verOf = (e, ab) => {
  const L = VERS[e?.cls]?.[ab?.key]; if (!L || !e) return { v: 1, Lv: ab?.lvl || 1 };
  let v = 1, Lv = ab.lvl; for (const x of L) if (e.lvl >= x) { v++; Lv = x; }
  return { v, Lv };
};
const rr = (e, cls = e.cls) => e.isHero ? S.ext.ranks?.[cls] : S.ext.allyRanks?.[e.name]?.[cls];
const app2 = (e, ab, ver) => ver.v === 1 ? e.lvl >= ab.lvl + 10 : (e.lvl >= ver.Lv + 5 || rr(e)?.['a2:' + ab.key] === ver.v);
// the version and Apprentice part of a spell's strength: a first version gets +35% at Apprentice II (as before);
// every later version is 12% stronger again, and its own Apprentice II adds 6%
BOOK.app = (e, ab) => {
  if (!e || !ab) return 1; const ver = BOOK.verOf(e, ab), a2 = app2(e, ab, ver);
  if (ver.v === 1) return a2 ? 1.35 : 1;
  return 1.35 * 1.12 ** (ver.v - 1) * (a2 && !BOOK.rank(e, ab) ? 1.06 : 1);
};
BOOK.label = (e, ab) => {
  if (!ab) return ''; const ver = BOOK.verOf(e, ab), q = BOOK.rank(e, ab);
  return `${ab.name}${ver.v > 1 ? ' ' + ROMAN[ver.v] : ''} · ${q ? BOOK.names[q] : app2(e, ab, ver) ? 'Apprentice II' : 'Apprentice I'}`;
};
// one number for the bar badge: 1 Apprentice I, 2 Apprentice II, 3-6 Adept I-IV, 7-10 Master I-IV
BOOK.code = (e, ab) => { if (!e || !ab) return 1; const q = BOOK.rank(e, ab); return q ? 2 + q : app2(e, ab, BOOK.verOf(e, ab)) ? 2 : 1; };

// ---------- 3. Master's Marks: three every ten levels, each raises a Master spell one tier ----------
export const marksEarned = (cls = S.heroCls) => 3 * Math.floor((S.classes?.[cls]?.lvl || (cls === S.heroCls ? S.hero?.lvl : 0) || 0) / 10);
export const marksLeft = (cls = S.heroCls) => Math.max(0, marksEarned(cls) - (S.ext.marks14?.[cls] || 0));
export function useMark(key) {
  const h = S.hero, ab = CLASSES[h.cls].abilities[key], q = BOOK.rank(h, ab);
  if (!marksLeft()) return 'No Master\'s Marks left. You earn three every ten levels.';
  if (q < 5) return 'A mark only works on a spell already at Master.';
  if (q >= 8) return 'Already Master IV.';
  if (h.lvl < needLvl(ab, q + 1, h)) return `Requires level ${needLvl(ab, q + 1, h)}.`;
  const r = ranksOf(h); r[key] = q + 1; r['v:' + key] = BOOK.verOf(h, ab).v;
  S.ext.marks14 = S.ext.marks14 || {}; S.ext.marks14[h.cls] = (S.ext.marks14[h.cls] || 0) + 1;
  chat('sys', null, `${ab.name} is now ${BOOK.names[q + 1]}.`); X.ui?.refreshKeys?.(true); return null;
}
X.marks14 = { left: marksLeft, use: useMark };

// ---------- 4. new things to say: abilities and versions as you level, and new ones onto the bar if there's room ----------
function announce() {
  const h = S.hero; if (!h || !S.running) return;
  S.ext.seen14 = S.ext.seen14 || {}; const seen = S.ext.seen14[h.cls] ?? h.lvl;
  if (seen === h.lvl) { S.ext.seen14[h.cls] = h.lvl; return; }
  const A = CLASSES[h.cls].abilities, got = [];
  for (let L = seen + 1; L <= h.lvl; L++) {
    for (const [k, a] of Object.entries(A)) if (a.b14 && a.lvl === L) {
      got.push(`New ability: ${a.name}.`);
      const bar = S.bar?.[h.cls]; if (bar && !bar.includes(k)) { const i = bar.indexOf(null); if (i >= 0) bar[i] = k; }
    }
    for (const [k, Ls] of Object.entries(VERS[h.cls] || {})) if (Ls.includes(L)) { const v = Ls.indexOf(L) + 2; got.push(`${A[k].name} becomes ${A[k].name} ${ROMAN[v]}.`); }
  }
  S.ext.seen14[h.cls] = h.lvl;
  if (got.length) { for (const g of got) chat('sys', null, g); X.ui?.toast?.(got[got.length - 1]); X.ui?.refreshKeys?.(true); }
}
setInterval(announce, 1500);

// ---------- 5. teammates use the new abilities ----------
const mezNear = (c, r) => S.ents.some(m => m.mob && !m.dead && m.buffs.some(b => b.data.mez) && Math.hypot(m.x - c.x, m.z - c.z) < r + 1);
const hasMine = (t, e, id) => t.buffs.some(b => b.src === e && (b.id === id || b.id === id + ':' + e.id));
const pre0 = aiHooks.preFight;
aiHooks.preFight = (e, t, g, n) => {
  if (pre0 && pre0(e, t, g, n)) return true;
  const A = CLASSES[e.cls]?.abilities; if (!A || e.casting || e.gcdT > 0) return false;
  const foes = groupFoes(g), live = g.filter(p => !p.dead && dist(p, e) < 34 && p.cls);
  const low = live.slice().sort((a, b) => hpPct(a) - hpPct(b))[0], tank = g.find(p => isTank(p) && !p.dead);
  const mana = e.resType === 'mana' ? e.res / e.resMax : 1;
  for (const [k, a] of Object.entries(A)) {
    if (!a.b14 || a.lvl > e.lvl) continue;
    let tgt = null;
    switch (a.ai) {
      case 'nuke': case 'debuff': if (t && !t.dead && !cc(t) && (a.ai === 'nuke' || !hasMine(t, e, k)) && (isHealer(e) ? mana > .5 : mana > .2)) tgt = t; break;
      case 'exec': if (t && !t.dead && t.hp < t.maxHp * .3) tgt = t; break;
      case 'gap': if (t && dist(e, t) > 8 && isTank(e)) tgt = t; break;
      case 'dot': if (t && !t.dead && !cc(t) && !hasMine(t, e, k) && t.hp > t.maxHp * .25 && mana > .25) tgt = t; break;
      case 'dotBig': if (t && (t.boss || t.named || t.elite) && !hasMine(t, e, k)) tgt = t; break;
      case 'aoe': { const c = a.tgt === 'self' ? e : t; if (c && foes.filter(m => dist(m, c) < 9).length >= 3 && !mezNear(c, 12) && mana > .3) tgt = a.tgt === 'self' ? e : t; break; }
      case 'taunt': if (isTank(e) && foes.filter(m => m.target && m.target !== e && dist(m, e) < 12).length >= 2) tgt = e; break;
      case 'peel': if (isTank(e)) { const v = live.find(p => p !== e && !isTank(p) && foes.some(m => m.target === p)); if (v) tgt = v; } break;
      case 'def': if (hpPct(e) < (isTank(e) ? .35 : .45) && foes.some(m => m.target === e)) tgt = e; break;
      case 'gdef': if (live.filter(p => hpPct(p) < .5).length >= Math.min(3, live.length) || (isTank(e) && t?.boss && hpPct(e) < .5)) tgt = e; break;
      case 'gdefAt': if (tank && hpPct(tank) < .55 && live.filter(p => dist(p, tank) < 10).length >= 3) tgt = tank; break;
      case 'big': if (t && (t.boss || t.named || foes.length >= 4)) tgt = e; break;
      case 'mana': if (mana < .4) tgt = e; break;
      case 'heal1': if (low && hpPct(low) < .55) tgt = low; break;
      case 'tankSave': if (tank && hpPct(tank) < .4) tgt = tank; break;
      case 'hot': if (low && hpPct(low) < .85 && !hasMine(low, e, k)) tgt = low; break;
      case 'healG': if (live.filter(p => hpPct(p) < .7).length >= 3) tgt = a.tgt === 'ally' ? (low || e) : e; break;
      case 'cc': { if (foes.length >= 3 && !(t?.boss)) { const loose = foes.find(m => m !== t && !m.boss && !m.named && !cc(m) && m.target && m.target !== tank); if (loose) tgt = loose; } break; }
    }
    if (tgt && tryUse(e, k, tgt)) return true;
  }
  return false;
};
