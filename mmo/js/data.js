// Game data: the four Milestone 1 classes, mobs, items, quests, fake-player names and chat.
// Ability effects receive C (the combat API in combat.js), the user u, the target t and the ability.

export const MAX_LVL = 30;
export const xpNeed = L => Math.round(80 * L ** 1.7 + 120);
export const GCD = 1.5;

// ---------- classes ----------
// Each class: family, role, resource, health/power curves, auto attack, abilities.
// Ability fields: lvl unlock, kind (attack/heal/buff/util/ult), cost (rage/focus points, or % of max mana),
// cast seconds, cd seconds, gcd (default true), range, tgt ('enemy','ally','self','party','dead'), icon.
export const CLASSES = {
  bulwark: {
    name: 'Bulwark', family: 'Fighter', role: 'tank', res: 'rage', armor: 'plate', weapon: 'mace', off: 'shield',
    color: '#c9a25a', models: ['bulwark0', 'bulwark1', 'bulwark2'],
    blurb: 'Meatshield. Plate, a tower shield, and rage that rises every time something hits you.',
    hp: [90, 24], pow: [9, 3.6], armorPct: .3, melee: true, swing: 2.0, swingMult: .55, range: 3,
    abilities: {
      heavy: { name: 'Heavy Strike', icon: '🔨', lvl: 1, kind: 'attack', cost: 0, range: 3, tgt: 'enemy', desc: 'A heavy blow. Builds 8 rage and double threat.',
        fx: (C, u, t) => { C.damage(u, t, C.pw(u) * .9 + 6, 'phys', { threat: 2 }); C.gain(u, 8); } },
      taunt: { name: 'Taunt', icon: '📣', lvl: 1, kind: 'util', cost: 0, cd: 8, gcd: false, range: 22, tgt: 'enemy', desc: 'Forces the target to attack you and puts you at the top of its threat.',
        fx: (C, u, t) => C.taunt(u, t) },
      slam: { name: 'Shield Slam', icon: '🛡️', lvl: 2, kind: 'attack', cost: 15, cd: 6, range: 3, tgt: 'enemy', desc: 'Slams with your shield for big threat.',
        fx: (C, u, t) => C.damage(u, t, C.pw(u) * 1.3 + 10, 'phys', { threat: 3.5 }) },
      clap: { name: 'Thunderclap', icon: '💥', lvl: 4, kind: 'attack', cost: 20, cd: 6, range: 0, tgt: 'self', desc: 'Hits every enemy within 8 m, with triple threat, and slows them.',
        fx: (C, u) => { for (const e of C.enemiesNear(u, u, 8)) { C.damage(u, e, C.pw(u) * .6 + 5, 'phys', { threat: 3 }); C.buff(e, 'slow', 6, { slow: .3 }, u); } C.fxRing(u, 8, [1, .85, .5]); } },
      wall: { name: 'Shield Wall', icon: '🧱', lvl: 6, kind: 'util', cost: 0, cd: 60, gcd: false, tgt: 'self', desc: 'Take 50% less damage for 8 seconds.',
        fx: (C, u) => C.buff(u, 'shieldwall', 8, { dr: .5 }, u) },
      revenge: { name: 'Second Wind', icon: '❤️‍🔥', lvl: 8, kind: 'attack', cost: 25, cd: 12, range: 3, tgt: 'enemy', desc: 'Strikes and heals you for 15% of your health.',
        fx: (C, u, t) => { C.damage(u, t, C.pw(u) * .8 + 6, 'phys', { threat: 2 }); C.heal(u, u, u.maxHp * .15); } },
      shout: { name: 'Battle Shout', icon: '🎺', lvl: 1, kind: 'buff', cost: 0, tgt: 'party', desc: 'Party buff: +10% power for 15 minutes.',
        fx: (C, u) => C.partyBuff(u, 'shout', 900, { pow: .1 }) },
      iron: { name: 'Iron Resolve', icon: '⚙️', lvl: 5, kind: 'buff', cost: 0, tgt: 'self', desc: 'Self buff: +25% armor and +25% threat for an hour.',
        fx: (C, u) => C.buff(u, 'iron', 3600, { armor: .25, threat: .25 }, u) },
      lastwall: { name: 'Unbreakable', icon: '⛰️', lvl: 5, kind: 'ult', cost: 0, gcd: false, tgt: 'self', desc: 'Ultimate. For 12 seconds you take 60% less damage and every enemy within 15 m must attack you.',
        fx: (C, u) => { C.buff(u, 'unbreak', 12, { dr: .6 }, u); for (const e of C.enemiesNear(u, u, 15)) C.taunt(u, e); C.fxRing(u, 15, [1, .9, .4]); } },
    },
  },
  cleric: {
    name: 'High Cleric', family: 'Healer', role: 'healer', res: 'mana', armor: 'cloth', weapon: 'staff', off: 'tome',
    color: '#f2e6b0', models: ['cleric0', 'cleric1', 'cleric2'],
    blurb: 'Big heals for big mana. Slow, enormous casts like Complete Heal. Mana is the limit.',
    hp: [62, 15], pow: [10, 3.8], mana: [110, 20], armorPct: .08, melee: true, swing: 2.4, swingMult: .3, range: 3,
    abilities: {
      smite: { name: 'Smite', icon: '☀️', lvl: 1, kind: 'attack', cost: 7, cast: 2, range: 30, tgt: 'enemy', school: 'holy', desc: 'Holy damage. Undead take 30% more.',
        fx: (C, u, t) => C.damage(u, t, C.pw(u) * 1.1 + 8, 'holy') },
      mend: { name: 'Mending Light', icon: '✨', lvl: 1, kind: 'heal', cost: 12, cast: 2.5, range: 30, tgt: 'ally', desc: 'A strong, efficient heal.',
        fx: (C, u, t) => C.heal(u, t, C.pw(u) * 2.0 + 22) },
      rez: { name: 'Resurrect', icon: '🕯️', lvl: 1, kind: 'util', cost: 20, cast: 8, range: 25, tgt: 'dead', ooc: true, desc: 'Brings a fallen ally back with a third of their health. Out of combat only.',
        fx: (C, u, t) => C.revive(t, .33) },
      flash: { name: 'Swift Light', icon: '⚡', lvl: 3, kind: 'heal', cost: 14, cast: 1.3, range: 30, tgt: 'ally', desc: 'A quick, costly heal.',
        fx: (C, u, t) => C.heal(u, t, C.pw(u) * 1.1 + 14) },
      fade: { name: 'Hide in Light', icon: '🌫️', lvl: 4, kind: 'util', cost: 0, cd: 20, gcd: false, tgt: 'self', desc: 'Halves your threat on every enemy.',
        fx: (C, u) => C.dropThreat(u, .5) },
      complete: { name: 'Complete Heal', icon: '🌕', lvl: 6, kind: 'heal', cost: 45, cast: 6, range: 30, tgt: 'ally', desc: 'Six seconds to cast. Heals the target to full.',
        fx: (C, u, t) => C.heal(u, t, t.maxHp) },
      sanct: { name: 'Sanctuary', icon: '⛪', lvl: 8, kind: 'heal', cost: 30, cast: 3, range: 0, tgt: 'self', desc: 'Heals every party member within 25 m.',
        fx: (C, u) => { for (const p of C.partyOf(u)) if (!p.dead && C.d(u, p) < 25) C.heal(u, p, C.pw(u) * 1.1 + 16); C.fxRing(u, 25, [1, .95, .6]); } },
      fort: { name: 'Fortitude', icon: '🛐', lvl: 1, kind: 'buff', cost: 15, tgt: 'party', desc: 'Party buff: +12% maximum health for 15 minutes.',
        fx: (C, u) => C.partyBuff(u, 'fort', 900, { hp: .12 }) },
      inner: { name: 'Inner Light', icon: '🔆', lvl: 5, kind: 'buff', cost: 0, tgt: 'self', desc: 'Self buff: +50% mana regeneration for 15 minutes.',
        fx: (C, u) => C.buff(u, 'inner', 900, { regen: .5 }, u) },
      miracle: { name: 'Miracle', icon: '👼', lvl: 5, kind: 'ult', cost: 0, gcd: false, tgt: 'self', desc: 'Ultimate. Instantly heals your whole party to full.',
        fx: (C, u) => { for (const p of C.partyOf(u)) if (!p.dead) C.heal(u, p, p.maxHp); C.fxRing(u, 30, [1, 1, .7]); } },
    },
  },
  longwatch: {
    name: 'Longwatch', family: 'Rogue', role: 'dps', res: 'focus', armor: 'leather', weapon: 'bow', off: 'quiver',
    color: '#8fc46a', models: ['archer0', 'archer1', 'archer2'],
    blurb: 'Archer. Long aimed shots and crit builds. Stand still a moment and your shots crit more.',
    hp: [66, 16], pow: [11, 4.2], armorPct: .15, melee: false, swing: 2.5, swingMult: .55, range: 32,
    abilities: {
      quick: { name: 'Quick Shot', icon: '🏹', lvl: 1, kind: 'attack', cost: 20, range: 32, tgt: 'enemy', desc: 'An instant shot.',
        fx: (C, u, t) => C.shoot(u, t, C.pw(u) * .85 + 5) },
      aimed: { name: 'Aimed Shot', icon: '🎯', lvl: 1, kind: 'attack', cost: 35, cast: 2.5, range: 36, tgt: 'enemy', desc: 'A long draw for a huge hit, with +25% crit chance.',
        fx: (C, u, t) => C.shoot(u, t, C.pw(u) * 1.9 + 16, { crit: .25 }) },
      pin: { name: 'Pinning Shot', icon: '📌', lvl: 3, kind: 'util', cost: 15, cd: 12, range: 32, tgt: 'enemy', desc: 'Roots the target in place for 6 seconds.',
        fx: (C, u, t) => { C.shoot(u, t, C.pw(u) * .4); C.buff(t, 'root', 6, { root: 1 }, u); } },
      fallback: { name: 'Fall Back', icon: '🦘', lvl: 4, kind: 'util', cost: 0, cd: 15, gcd: false, tgt: 'self', desc: 'Leap back 9 m and shed 30% of your threat.',
        fx: (C, u) => { C.leap(u, -9); C.dropThreat(u, .3); } },
      volley: { name: 'Volley', icon: '🌧️', lvl: 6, kind: 'attack', cost: 40, cd: 20, range: 32, tgt: 'enemy', desc: 'Arrows rain on every enemy within 7 m of the target.',
        fx: (C, u, t) => { for (const e of C.enemiesNear(u, t, 7)) C.shoot(u, e, C.pw(u) * .9 + 6); C.fxRing(t, 7, [.8, .7, .5]); } },
      deadeye: { name: 'Deadeye', icon: '👁️', lvl: 8, kind: 'util', cost: 0, cd: 30, gcd: false, tgt: 'self', desc: 'Your next Aimed Shot is instant and always crits.',
        fx: (C, u) => C.buff(u, 'deadeye', 20, {}, u) },
      eagle: { name: 'Eagle Eye', icon: '🦅', lvl: 1, kind: 'buff', cost: 0, tgt: 'self', desc: 'Self buff: +10% crit chance for 15 minutes.',
        fx: (C, u) => C.buff(u, 'eagle', 900, { crit: .1 }, u) },
      trueshot: { name: 'Trueshot Aura', icon: '🎖️', lvl: 5, kind: 'buff', cost: 0, tgt: 'party', desc: 'Party buff: +5% crit chance for 15 minutes.',
        fx: (C, u) => C.partyBuff(u, 'trueshot', 900, { crit: .05 }) },
      moon: { name: "Hunter's Moon", icon: '🌙', lvl: 5, kind: 'ult', cost: 0, gcd: false, tgt: 'self', desc: 'Ultimate. For 10 seconds every shot crits and focus returns twice as fast.',
        fx: (C, u) => C.buff(u, 'moon', 10, { crit: 1, focus: 1 }, u) },
    },
  },
  elementalist: {
    name: 'Elementalist', family: 'Mage', role: 'dps', res: 'mana', armor: 'cloth', weapon: 'staff', off: 'orb',
    color: '#ff8a3a', models: ['elem0', 'elem1', 'elem2'],
    blurb: 'Elemental advantage. Every enemy is weak to one element. Find it, switch to it, and hit 50% harder.',
    hp: [56, 13], pow: [12, 4.4], mana: [120, 22], armorPct: .06, melee: true, swing: 2.4, swingMult: .25, range: 3,
    abilities: {
      fire: { name: 'Fire Bolt', icon: '🔥', lvl: 1, kind: 'attack', cost: 8, cast: 2, range: 32, tgt: 'enemy', school: 'fire', desc: 'Fire damage.',
        fx: (C, u, t) => C.bolt(u, t, C.pw(u) * 1.45 + 10, 'fire') },
      frost: { name: 'Frost Shard', icon: '❄️', lvl: 1, kind: 'attack', cost: 7, cast: 1.5, range: 32, tgt: 'enemy', school: 'frost', desc: 'Frost damage that slows by 30%.',
        fx: (C, u, t) => C.bolt(u, t, C.pw(u) * 1.0 + 8, 'frost', { slow: .3 }) },
      storm: { name: 'Lightning Lash', icon: '🌩️', lvl: 3, kind: 'attack', cost: 9, cd: 6, range: 30, tgt: 'enemy', school: 'storm', desc: 'Instant storm damage.',
        fx: (C, u, t) => C.bolt(u, t, C.pw(u) * 1.15 + 8, 'storm') },
      stone: { name: 'Stone Spike', icon: '🪨', lvl: 4, kind: 'attack', cost: 12, cast: 2.5, range: 30, tgt: 'enemy', school: 'earth', desc: 'Heavy earth damage.',
        fx: (C, u, t) => C.bolt(u, t, C.pw(u) * 2.0 + 14, 'earth') },
      nova: { name: 'Frost Nova', icon: '💠', lvl: 6, kind: 'util', cost: 10, cd: 20, tgt: 'self', school: 'frost', desc: 'Freezes every enemy within 8 m in place for 6 seconds.',
        fx: (C, u) => { for (const e of C.enemiesNear(u, u, 8)) { C.damage(u, e, C.pw(u) * .4, 'frost'); C.buff(e, 'root', 6, { root: 1 }, u); } C.fxRing(u, 8, [.6, .9, 1]); } },
      chain: { name: 'Chain Lightning', icon: '⛓️', lvl: 8, kind: 'attack', cost: 15, cast: 2, cd: 10, range: 30, tgt: 'enemy', school: 'storm', desc: 'Storm damage that jumps to two more enemies.',
        fx: (C, u, t) => C.chain(u, t, C.pw(u) * 1.1 + 8, 'storm', 3) },
      kindle: { name: 'Kindled Mind', icon: '🕯️', lvl: 1, kind: 'buff', cost: 15, tgt: 'party', desc: 'Party buff: +12% maximum mana for 15 minutes.',
        fx: (C, u) => C.partyBuff(u, 'kindle', 900, { mana: .12 }) },
      eward: { name: 'Elemental Ward', icon: '🔮', lvl: 5, kind: 'buff', cost: 10, cd: 30, tgt: 'self', desc: 'Self shield that absorbs about three of your bolts’ worth of damage.',
        fx: (C, u) => C.buff(u, 'eward', 30, { absorb: C.pw(u) * 3 + 20 }, u) },
      cataclysm: { name: 'Cataclysm', icon: '☄️', lvl: 5, kind: 'ult', cost: 0, gcd: false, range: 32, tgt: 'enemy', desc: 'Ultimate. Strikes the target with its own weakness for massive damage, and splashes enemies near it.',
        fx: (C, u, t) => { const sc = C.weakOf(t) || 'fire'; C.bolt(u, t, C.pw(u) * 4 + 40, sc); for (const e of C.enemiesNear(u, t, 6)) if (e !== t) C.damage(u, e, C.pw(u) * 1.5, sc); C.fxRing(t, 6, [1, .5, .2]); } },
    },
  },
};
// ---------- the other twelve classes ----------
const NEW = {
  // ===== Fighters =====
  wardancer: {
    name: 'Wardancer', family: 'Fighter', role: 'tank', res: 'momentum', armor: 'leather', color: '#e06a4a',
    blurb: 'Dodge tank. Light armour and two blades. Every dodge builds momentum you spend on counters.',
    hp: [80, 21], pow: [9, 3.7], armorPct: .12, dodge: .22, melee: true, swing: 1.6, swingMult: .45, range: 3,
    abilities: {
      flicker: { name: 'Flicker Strike', icon: '🗡️', lvl: 1, kind: 'attack', cost: 0, range: 3, tgt: 'enemy', desc: 'A quick cut with double threat. Builds 8 momentum.',
        fx: (C, u, t) => { C.damage(u, t, C.pw(u) * .8 + 5, 'phys', { threat: 2.5 }); C.gain(u, 8); } },
      challenge: { name: 'Challenge', icon: '📣', lvl: 1, kind: 'util', cd: 8, gcd: false, range: 22, tgt: 'enemy', desc: 'Forces the target to attack you and puts you at the top of its threat.', fx: (C, u, t) => C.taunt(u, t) },
      counter: { name: 'Counter', icon: '↩️', lvl: 2, kind: 'attack', cost: 30, cd: 4, range: 3, tgt: 'enemy', desc: 'Spend momentum on a big riposte with heavy threat.',
        fx: (C, u, t) => C.damage(u, t, C.pw(u) * 1.6 + 10, 'phys', { threat: 3.5 }) },
      whirl: { name: 'Whirling Blades', icon: '🌀', lvl: 4, kind: 'attack', cost: 25, cd: 6, tgt: 'self', desc: 'Spin through every enemy within 8 m with triple threat.',
        fx: (C, u) => { for (const e of C.enemiesNear(u, u, 8)) C.damage(u, e, C.pw(u) * .6 + 5, 'phys', { threat: 3 }); C.fxRing(u, 8, [1, .6, .4]); } },
      blur: { name: 'Blur', icon: '💨', lvl: 6, kind: 'util', cd: 45, gcd: false, tgt: 'self', desc: '+40% dodge for 8 seconds.', fx: (C, u) => C.buff(u, 'blur', 8, { dodge: .4 }, u) },
      secondstep: { name: 'Second Step', icon: '💃', lvl: 8, kind: 'attack', cost: 20, cd: 12, range: 3, tgt: 'enemy', desc: 'Strike and heal 12% of your health.',
        fx: (C, u, t) => { C.damage(u, t, C.pw(u) * .8 + 6, 'phys', { threat: 2 }); C.heal(u, u, u.maxHp * .12); } },
      keen: { name: 'Keen Edge', icon: '✴️', lvl: 1, kind: 'buff', tgt: 'party', desc: 'Party buff: +4% crit chance for 15 minutes.', fx: (C, u) => C.partyBuff(u, 'keen', 900, { crit: .04 }) },
      lightfeet: { name: 'Light Feet', icon: '🪶', lvl: 5, kind: 'buff', tgt: 'self', desc: 'Self buff: +8% dodge and +25% threat for an hour.', fx: (C, u) => C.buff(u, 'lightfeet', 3600, { dodge: .08, threat: .25 }, u) },
      untouchable: { name: 'Untouchable', icon: '🌪️', lvl: 5, kind: 'ult', gcd: false, tgt: 'self', desc: 'Ultimate. For 8 seconds you dodge every melee blow, and every enemy within 12 m must attack you.',
        fx: (C, u) => { C.buff(u, 'untouch', 8, { dodge: 1 }, u); for (const e of C.enemiesNear(u, u, 12)) C.taunt(u, e); C.fxRing(u, 12, [1, .7, .4]); } },
    },
  },
  bladewarden: {
    name: 'Bladewarden', family: 'Fighter', role: 'tank', res: 'rage', armor: 'plate', color: '#9fb4d8',
    blurb: 'Parry tank. A greatsword and plate. Parries strike back on their own and stack a riposte chain.',
    hp: [88, 23], pow: [9.5, 3.8], armorPct: .25, parry: .22, melee: true, swing: 2.3, swingMult: .6, range: 3.2,
    abilities: {
      hew: { name: 'Hew', icon: '⚔️', lvl: 1, kind: 'attack', cost: 0, range: 3.2, tgt: 'enemy', desc: 'A wide cut with double threat. Builds 6 rage.',
        fx: (C, u, t) => { C.damage(u, t, C.pw(u) * 1.0 + 6, 'phys', { threat: 2 }); C.gain(u, 6); } },
      callout: { name: 'Call Out', icon: '📣', lvl: 1, kind: 'util', cd: 8, gcd: false, range: 22, tgt: 'enemy', desc: 'Forces the target to attack you and puts you at the top of its threat.', fx: (C, u, t) => C.taunt(u, t) },
      riposte: { name: 'Riposte', icon: '🤺', lvl: 2, kind: 'attack', cost: 15, cd: 5, range: 3.2, tgt: 'enemy', desc: 'A heavy return blow, stronger for each link in your riposte chain.',
        fx: (C, u, t) => C.damage(u, t, C.pw(u) * 1.3 + 8 + C.chainOf(u) * C.pw(u) * .2, 'phys', { threat: 3.5 }) },
      sweep: { name: 'Sweeping Arc', icon: '🌙', lvl: 4, kind: 'attack', cost: 20, cd: 6, tgt: 'self', desc: 'Cleave every enemy within 6 m with triple threat.',
        fx: (C, u) => { for (const e of C.enemiesNear(u, u, 6)) C.damage(u, e, C.pw(u) * .7 + 6, 'phys', { threat: 3 }); C.fxRing(u, 6, [.8, .85, 1]); } },
      guard: { name: 'Guard Stance', icon: '🛡️', lvl: 6, kind: 'util', cd: 45, gcd: false, tgt: 'self', desc: '+45% parry for 8 seconds.', fx: (C, u) => C.buff(u, 'guard', 8, { parry: .45 }, u) },
      rally: { name: 'Rally', icon: '❤️‍🔥', lvl: 8, kind: 'util', cost: 25, cd: 15, gcd: false, tgt: 'self', desc: 'Heal 15% of your health.', fx: (C, u) => C.heal(u, u, u.maxHp * .15) },
      steel: { name: 'Steel Discipline', icon: '🔩', lvl: 1, kind: 'buff', tgt: 'party', desc: 'Party buff: +12% armor for 15 minutes.', fx: (C, u) => C.partyBuff(u, 'steel', 900, { armor: .12 }) },
      bladeward: { name: 'Blade Ward', icon: '⚜️', lvl: 5, kind: 'buff', tgt: 'self', desc: 'Self buff: +8% parry and +25% threat for an hour.', fx: (C, u) => C.buff(u, 'bladeward', 3600, { parry: .08, threat: .25 }, u) },
      thousand: { name: 'Thousand Cuts', icon: '✨', lvl: 5, kind: 'ult', gcd: false, tgt: 'self', desc: 'Ultimate. For 10 seconds: +40% parry, every riposte hits twice and heals you, and every enemy within 12 m must attack you.',
        fx: (C, u) => { C.buff(u, 'thousand', 10, { parry: .4 }, u); for (const e of C.enemiesNear(u, u, 12)) C.taunt(u, e); C.fxRing(u, 12, [.8, .85, 1]); } },
    },
  },
  monk: {
    name: 'Monk', family: 'Fighter', role: 'dps', support: true, res: 'energy', armor: 'leather', color: '#e8b04a',
    blurb: 'Fighter support. Pulls with Feign Death, fights with fists, stuns casters, off-tanks, and brings group buffs.',
    hp: [72, 18], pow: [10.5, 4.1], armorPct: .12, dodge: .15, melee: true, swing: 1.6, swingMult: .5, range: 3,
    abilities: {
      palm: { name: 'Palm Strike', icon: '🖐️', lvl: 1, kind: 'attack', cost: 25, range: 3, tgt: 'enemy', desc: 'A fast open-hand strike.', fx: (C, u, t) => C.damage(u, t, C.pw(u) * 1.0 + 6, 'phys') },
      feign: { name: 'Feign Death', icon: '💤', lvl: 1, kind: 'util', cd: 30, gcd: false, tgt: 'self', desc: 'Drop to the ground and wipe your threat. Enemies with nobody else to fight go home. The classic way to split a pull.',
        fx: (C, u) => C.feign(u) },
      provoke: { name: 'Provoke', icon: '👊', lvl: 2, kind: 'util', cd: 10, gcd: false, range: 24, tgt: 'enemy', desc: 'Taunt from range. Pulls a single enemy to you, or peels one off a healer.', fx: (C, u, t) => C.taunt(u, t) },
      claw: { name: 'Tiger Claw', icon: '🐯', lvl: 3, kind: 'attack', cost: 35, cd: 4, range: 3, tgt: 'enemy', desc: 'A raking strike.', fx: (C, u, t) => C.damage(u, t, C.pw(u) * 1.5 + 8, 'phys') },
      stun: { name: 'Stunning Palm', icon: '💫', lvl: 4, kind: 'util', cost: 20, cd: 12, range: 3, tgt: 'enemy', desc: 'Stun for 3 seconds and stop any spell being cast. Not bosses.', fx: (C, u, t) => { C.interrupt(t); C.stun(u, t, 3); C.damage(u, t, C.pw(u) * .4, 'phys'); } },
      whirlkick: { name: 'Whirlwind Kick', icon: '🦵', lvl: 6, kind: 'attack', cost: 30, cd: 8, tgt: 'self', desc: 'Kick every enemy within 5 m.',
        fx: (C, u) => { for (const e of C.enemiesNear(u, u, 5)) C.damage(u, e, C.pw(u) * .8 + 6, 'phys'); C.fxRing(u, 5, [1, .8, .4]); } },
      calm: { name: 'Inner Calm', icon: '🧘', lvl: 8, kind: 'util', cd: 30, gcd: false, tgt: 'self', desc: 'Heal 20% of your health.', fx: (C, u) => C.heal(u, u, u.maxHp * .2) },
      ironbody: { name: 'Iron Body', icon: '🪨', lvl: 1, kind: 'buff', tgt: 'party', desc: 'Party buff: +12% armor for 15 minutes.', fx: (C, u) => C.partyBuff(u, 'ironbody', 900, { armor: .12 }) },
      wind: { name: 'Way of the Wind', icon: '🌬️', lvl: 3, kind: 'buff', tgt: 'party', desc: 'Party buff: +12% run speed for 15 minutes.', fx: (C, u) => C.partyBuff(u, 'wind', 900, { spd: .12 }) },
      focus: { name: 'Focused Mind', icon: '🎯', lvl: 5, kind: 'buff', tgt: 'party', desc: 'Party buff: +5% crit chance for 15 minutes.', fx: (C, u) => C.partyBuff(u, 'focusmind', 900, { crit: .05 }) },
      fists: { name: 'Hundred Fists', icon: '👐', lvl: 5, kind: 'ult', gcd: false, tgt: 'self', desc: 'Ultimate. For 8 seconds you attack four times as fast.', fx: (C, u) => C.buff(u, 'fists', 8, { haste: 3 }, u) },
    },
  },
  // ===== Healers =====
  aegis: {
    name: 'Aegis', family: 'Healer', role: 'healer', res: 'mana', armor: 'cloth', color: '#9fd0ff',
    blurb: 'Ward healer. Shields that soak hits before they land. Read the fight and ward ahead of the big blows.',
    hp: [60, 15], pow: [10, 3.8], mana: [110, 20], armorPct: .08, melee: true, swing: 2.4, swingMult: .3, range: 3,
    abilities: {
      judgment: { name: 'Judgment', icon: '⚖️', lvl: 1, kind: 'attack', cost: 6, cast: 1.8, range: 30, tgt: 'enemy', school: 'holy', desc: 'Holy damage.', fx: (C, u, t) => C.damage(u, t, C.pw(u) * 1.0 + 8, 'holy') },
      ward: { name: 'Aegis Ward', icon: '🛡️', lvl: 1, kind: 'heal', cost: 10, range: 30, tgt: 'ally', desc: 'Instantly shields an ally for a large amount for 20 seconds. The same ally can be warded again after 6 seconds.',
        fx: (C, u, t) => C.ward(u, t, C.pw(u) * 2.4 + 24, 20) },
      word: { name: 'Mending Word', icon: '✨', lvl: 1, kind: 'heal', cost: 9, cast: 1.8, range: 30, tgt: 'ally', desc: 'A modest direct heal.', fx: (C, u, t) => C.heal(u, t, C.pw(u) * 1.2 + 12) },
      echoes: { name: 'Ward of Echoes', icon: '🔔', lvl: 3, kind: 'heal', cost: 22, cd: 15, tgt: 'self', desc: 'A smaller ward on every party member within 25 m.',
        fx: (C, u) => { for (const p of C.partyOf(u)) if (!p.dead && C.d(u, p) < 25) C.ward(u, p, C.pw(u) * 1.1 + 10, 15, true); C.fxRing(u, 25, [.6, .85, 1]); } },
      rune: { name: 'Rune of Shelter', icon: '🔯', lvl: 4, kind: 'util', cost: 15, cd: 30, tgt: 'ally', range: 30, desc: 'Allies within 8 m of the target take 25% less damage for 10 seconds.',
        fx: (C, u, t) => { for (const p of C.partyOf(u)) if (!p.dead && C.d(t, p) < 8) C.buff(p, 'shelter', 10, { dr: .25 }, u); C.fxRing(t, 8, [.6, .85, 1]); } },
      bastion: { name: 'Bastion', icon: '🏰', lvl: 6, kind: 'heal', cost: 25, cast: 2, cd: 20, range: 30, tgt: 'ally', desc: 'A huge ward, five times your power, for 15 seconds.', fx: (C, u, t) => C.ward(u, t, C.pw(u) * 5 + 40, 15, true) },
      purge: { name: 'Purging Light', icon: '🌟', lvl: 8, kind: 'heal', cost: 14, cd: 8, range: 30, tgt: 'ally', desc: 'An instant heal.', fx: (C, u, t) => C.heal(u, t, C.pw(u) * 1.3 + 14) },
      faith: { name: 'Aegis of Faith', icon: '🔰', lvl: 1, kind: 'buff', cost: 12, tgt: 'party', desc: 'Party buff: +10% armor and +6% maximum health for 15 minutes.', fx: (C, u) => C.partyBuff(u, 'faith', 900, { armor: .1, hp: .06 }) },
      serenity: { name: 'Serenity', icon: '🔆', lvl: 5, kind: 'buff', tgt: 'self', desc: 'Self buff: +50% mana regeneration for 15 minutes.', fx: (C, u) => C.buff(u, 'serenity', 900, { regen: .5 }, u) },
      divine: { name: 'Divine Bulwark', icon: '👼', lvl: 5, kind: 'ult', gcd: false, tgt: 'self', desc: 'Ultimate. Every party member gets a ward of six times your power for 10 seconds.',
        fx: (C, u) => { for (const p of C.partyOf(u)) if (!p.dead) C.ward(u, p, C.pw(u) * 6 + 40, 10, true); C.fxRing(u, 30, [.7, .9, 1]); } },
    },
  },
  lifebinder: {
    name: 'Lifebinder', family: 'Healer', role: 'healer', res: 'mana', armor: 'cloth', color: '#8fe07a',
    blurb: 'Heal over time. Keep several heals ticking on everyone and roll them forward. Very efficient on mana.',
    hp: [62, 15], pow: [10, 3.8], mana: [110, 20], armorPct: .08, melee: true, swing: 2.4, swingMult: .3, range: 3,
    abilities: {
      thorn: { name: 'Thornlash', icon: '🌿', lvl: 1, kind: 'attack', cost: 6, cast: 1.8, range: 30, tgt: 'enemy', school: 'nature', desc: 'Nature damage.', fx: (C, u, t) => C.damage(u, t, C.pw(u) * 1.0 + 8, 'nature') },
      renew: { name: 'Renew', icon: '🌱', lvl: 1, kind: 'heal', cost: 8, range: 30, tgt: 'ally', desc: 'Heals over 12 seconds.', fx: (C, u, t) => C.hot(u, t, 'renew', C.pw(u) * 2.6 + 30, 12) },
      bloom: { name: 'Mending Bloom', icon: '🌸', lvl: 3, kind: 'heal', cost: 11, cast: 1.5, range: 30, tgt: 'ally', desc: 'A quick direct heal.', fx: (C, u, t) => C.heal(u, t, C.pw(u) * 1.1 + 12) },
      rejuv: { name: 'Rejuvenate', icon: '🍃', lvl: 4, kind: 'heal', cost: 9, range: 30, tgt: 'ally', desc: 'A second heal over 9 seconds that stacks with Renew.', fx: (C, u, t) => C.hot(u, t, 'rejuv', C.pw(u) * 2 + 22, 9) },
      wild: { name: 'Wild Growth', icon: '🌳', lvl: 6, kind: 'heal', cost: 24, cd: 10, tgt: 'self', desc: 'A heal over time on every party member within 25 m.',
        fx: (C, u) => { for (const p of C.partyOf(u)) if (!p.dead && C.d(u, p) < 25) C.hot(u, p, 'wild', C.pw(u) * 1.6 + 16, 8); C.fxRing(u, 25, [.6, 1, .5]); } },
      swift: { name: 'Swiftmend', icon: '💚', lvl: 8, kind: 'heal', cost: 10, cd: 12, range: 30, tgt: 'ally', desc: 'Consumes a heal over time on the target to heal at once.',
        fx: (C, u, t) => { const got = C.consumeHot(t); C.heal(u, t, got ? C.pw(u) * 2.4 + 24 : C.pw(u) * .8); } },
      vigor: { name: 'Verdant Vigor', icon: '🌾', lvl: 1, kind: 'buff', cost: 12, tgt: 'party', desc: 'Party buff: +10% maximum health for 15 minutes.', fx: (C, u) => C.partyBuff(u, 'vigor', 900, { hp: .1 }) },
      rooted: { name: 'Rooted Mind', icon: '🪴', lvl: 5, kind: 'buff', tgt: 'self', desc: 'Self buff: +50% mana regeneration for 15 minutes.', fx: (C, u) => C.buff(u, 'rooted', 900, { regen: .5 }, u) },
      treeoflife: { name: 'Tree of Life', icon: '🌲', lvl: 5, kind: 'ult', gcd: false, tgt: 'self', desc: 'Ultimate. For 12 seconds your heals over time heal twice as much, and the whole party gets Renew.',
        fx: (C, u) => { C.buff(u, 'treeoflife', 12, {}, u); for (const p of C.partyOf(u)) if (!p.dead) C.hot(u, p, 'renew', C.pw(u) * 2.6 + 30, 12); C.fxRing(u, 30, [.6, 1, .5]); } },
    },
  },
  druid: {
    name: 'Druid', family: 'Healer', role: 'healer', support: true, res: 'mana', armor: 'leather', color: '#d89a4a',
    blurb: 'Healer support. Off-heals, roots and snares, Moonfire, travel and ports, and bear or cat form.',
    hp: [66, 16], pow: [10, 3.9], mana: [105, 19], armorPct: .12, melee: true, swing: 2.2, swingMult: .4, range: 3,
    abilities: {
      moonfire: { name: 'Moonfire', icon: '🌒', lvl: 1, kind: 'attack', cost: 7, range: 30, tgt: 'enemy', school: 'nature', desc: 'Instant damage, then more over 12 seconds.',
        fx: (C, u, t) => { C.damage(u, t, C.pw(u) * .5 + 5, 'nature'); C.dot(u, t, 'moonfire', C.pw(u) * .12 + 1, 12, 'nature'); } },
      touch: { name: 'Healing Touch', icon: '🤲', lvl: 1, kind: 'heal', cost: 11, cast: 2, range: 30, tgt: 'ally', desc: 'A solid direct heal.', fx: (C, u, t) => C.heal(u, t, C.pw(u) * 1.5 + 16) },
      entangle: { name: 'Entangle', icon: '🪢', lvl: 2, kind: 'util', cost: 8, cd: 10, range: 30, tgt: 'enemy', desc: 'Roots the target for 8 seconds.', fx: (C, u, t) => C.buff(t, 'root', 8, { root: 1 }, u) },
      grow: { name: 'Regrowth', icon: '🍀', lvl: 3, kind: 'heal', cost: 9, range: 30, tgt: 'ally', desc: 'Heals over 12 seconds.', fx: (C, u, t) => C.hot(u, t, 'regrowth', C.pw(u) * 2 + 20, 12) },
      bear: { name: 'Bear Form', icon: '🐻', lvl: 4, kind: 'util', cd: 2, gcd: false, tgt: 'self', desc: 'Become a bear: +60% armor, +30% health and double threat. Use again to return to normal.',
        fx: (C, u) => C.shift(u, 'bear', { armor: .6, hp: .3, threat: 1 }) },
      cat: { name: 'Cat Form', icon: '🐆', lvl: 6, kind: 'util', cd: 2, gcd: false, tgt: 'self', desc: 'Become a cat: +30% power and +10% crit. Use again to return to normal.',
        fx: (C, u) => C.shift(u, 'cat', { pow: .3, crit: .1 }) },
      hurricane: { name: 'Hurricane', icon: '🌪️', lvl: 8, kind: 'attack', cost: 20, cd: 12, range: 30, tgt: 'enemy', school: 'nature', desc: 'Storms over every enemy within 7 m of the target and slows them.',
        fx: (C, u, t) => { for (const e of C.enemiesNear(u, t, 7)) { C.damage(u, e, C.pw(u) * .9 + 6, 'nature'); C.buff(e, 'slow', 5, { slow: .3 }, u); } C.fxRing(t, 7, [.7, .9, .7]); } },
      gate: { name: 'Grove Gate', icon: '🌀', lvl: 5, kind: 'util', cost: 20, cast: 6, ooc: true, tgt: 'self', desc: 'Out of combat: opens a grove gate for you and your group. Choose your bind stone, Saltmarrow or the Vale town.', fx: (C, u) => C.teleport(u) },
      wolf: { name: 'Spirit of the Wolf', icon: '🐺', lvl: 1, kind: 'buff', cost: 8, tgt: 'party', desc: 'Party buff: +25% run speed for 15 minutes.', fx: (C, u) => C.partyBuff(u, 'wolfspirit', 900, { spd: .25 }) },
      thorns: { name: 'Thorns', icon: '🌵', lvl: 3, kind: 'buff', cost: 8, tgt: 'ally', range: 30, desc: 'Buff: anything that hits the target in melee is hurt. 15 minutes.', fx: (C, u, t) => C.buff(t, 'thorns', 900, { thorns: C.pw(u) * .25 + 3 }, u) },
      mark: { name: 'Mark of the Wild', icon: '🐾', lvl: 5, kind: 'buff', cost: 14, tgt: 'party', desc: 'Party buff: +5% power, +5% health, +10% armor for 15 minutes.', fx: (C, u) => C.partyBuff(u, 'markwild', 900, { pow: .05, hp: .05, armor: .1 }) },
      nature: { name: 'Force of Nature', icon: '🌳', lvl: 5, kind: 'ult', gcd: false, tgt: 'self', desc: 'Ultimate. Three treants fight beside you for 20 seconds.',
        fx: (C, u) => { for (let i = 0; i < 3; i++) C.summon(u, 'treant', 20); } },
    },
  },
  // ===== Rogues =====
  knifeshade: {
    name: 'Knifeshade', family: 'Rogue', role: 'dps', res: 'energy', armor: 'leather', color: '#c05a6a',
    blurb: 'Assassin. Positional backstabs: huge damage from behind while the tank holds the target.',
    hp: [64, 16], pow: [11, 4.3], armorPct: .14, dodge: .08, melee: true, swing: 1.8, swingMult: .55, range: 3,
    abilities: {
      stab: { name: 'Stab', icon: '🔪', lvl: 1, kind: 'attack', cost: 25, range: 3, tgt: 'enemy', desc: 'A quick stab from any side.', fx: (C, u, t) => C.damage(u, t, C.pw(u) * .9 + 6, 'phys') },
      backstab: { name: 'Backstab', icon: '🗡️', lvl: 1, kind: 'attack', cost: 40, range: 3, tgt: 'enemy', behind: true, desc: 'Must be behind the target. A huge strike.', fx: (C, u, t) => C.damage(u, t, C.pw(u) * 2.3 + 14, 'phys') },
      gouge: { name: 'Gouge', icon: '👁️', lvl: 3, kind: 'util', cost: 20, cd: 15, range: 3, tgt: 'enemy', desc: 'Stun for 4 seconds and stop any spell. Not bosses.', fx: (C, u, t) => { C.interrupt(t); C.stun(u, t, 4); } },
      evade: { name: 'Evade', icon: '💨', lvl: 4, kind: 'util', cd: 30, gcd: false, tgt: 'self', desc: '+50% dodge for 6 seconds.', fx: (C, u) => C.buff(u, 'evade', 6, { dodge: .5 }, u) },
      vanish: { name: 'Vanish', icon: '🌫️', lvl: 6, kind: 'util', cd: 60, gcd: false, tgt: 'self', desc: 'Wipe all your threat.', fx: (C, u) => C.dropThreat(u, 1) },
      ambush: { name: 'Ambush', icon: '🥷', lvl: 8, kind: 'attack', cost: 50, cd: 10, range: 3, tgt: 'enemy', behind: true, desc: 'Must be behind the target. Enormous damage.', fx: (C, u, t) => C.damage(u, t, C.pw(u) * 3.2 + 20, 'phys') },
      deadly: { name: 'Deadly Focus', icon: '🎯', lvl: 1, kind: 'buff', tgt: 'self', desc: 'Self buff: +10% power for 15 minutes.', fx: (C, u) => C.buff(u, 'deadly', 900, { pow: .1 }, u) },
      shadowpact: { name: 'Shadow Pact', icon: '🌑', lvl: 5, kind: 'buff', tgt: 'party', desc: 'Party buff: +4% crit chance for 15 minutes.', fx: (C, u) => C.partyBuff(u, 'shadowpact', 900, { crit: .04 }) },
      deathmark: { name: 'Death Mark', icon: '☠️', lvl: 5, kind: 'ult', gcd: false, range: 3, tgt: 'enemy', desc: 'Ultimate. The target takes 30% more damage from everyone for 10 seconds, and you can backstab it from any side.',
        fx: (C, u, t) => { C.buff(t, 'deathmark', 10, { vuln: .3 }, u); C.buff(u, 'shadowstep', 10, {}, u); } },
    },
  },
  blightblade: {
    name: 'Blightblade', family: 'Rogue', role: 'dps', res: 'energy', armor: 'leather', color: '#9be36b',
    blurb: 'Poisoner. Stack poison on one target, up to five deep. Ramps slowly, hits hardest in long fights.',
    hp: [64, 16], pow: [10.5, 4.1], armorPct: .14, dodge: .06, melee: true, swing: 1.8, swingMult: .45, range: 3,
    abilities: {
      envenom: { name: 'Envenom', icon: '🧪', lvl: 1, kind: 'attack', cost: 30, range: 3, tgt: 'enemy', desc: 'A strike that adds two stacks of poison.', fx: (C, u, t) => { C.damage(u, t, C.pw(u) * .6 + 4, 'phys'); C.poison(u, t, 2); } },
      gash: { name: 'Gash', icon: '🔪', lvl: 1, kind: 'attack', cost: 20, range: 3, tgt: 'enemy', desc: 'A quick cut that adds one stack of poison.', fx: (C, u, t) => { C.damage(u, t, C.pw(u) * .7 + 5, 'phys'); C.poison(u, t, 1); } },
      rupture: { name: 'Rupture', icon: '🩸', lvl: 3, kind: 'attack', cost: 30, cd: 10, range: 3, tgt: 'enemy', desc: 'A bleed for 10 seconds.', fx: (C, u, t) => C.dot(u, t, 'rupture', C.pw(u) * .3 + 2, 10, 'phys') },
      cripple: { name: 'Crippling Poison', icon: '🐌', lvl: 4, kind: 'util', cost: 20, cd: 10, range: 3, tgt: 'enemy', desc: 'Slows by 50% for 10 seconds and adds a stack.', fx: (C, u, t) => { C.buff(t, 'slow', 10, { slow: .5 }, u); C.poison(u, t, 1); } },
      plague: { name: 'Plague Spread', icon: '☣️', lvl: 6, kind: 'util', cost: 25, cd: 12, range: 3, tgt: 'enemy', desc: 'Copies the target’s poison stacks onto every enemy within 8 m.',
        fx: (C, u, t) => { const n = C.poisonStacks(t, u); for (const e of C.enemiesNear(u, t, 8)) if (e !== t) C.poison(u, e, n); C.fxRing(t, 8, [.6, 1, .4]); } },
      burst: { name: 'Toxic Burst', icon: '💥', lvl: 8, kind: 'attack', cost: 30, cd: 8, range: 3, tgt: 'enemy', desc: 'Detonates the poison: big damage for each stack, then the stacks are gone.',
        fx: (C, u, t) => { const n = C.poisonStacks(t, u); C.clearPoison(t, u); C.damage(u, t, C.pw(u) * .7 * n + 6, 'poison'); } },
      blades: { name: 'Poisoned Blades', icon: '🗡️', lvl: 1, kind: 'buff', tgt: 'self', desc: 'Self buff: your weapon swings add a stack of poison. One hour.', fx: (C, u) => C.buff(u, 'poisonblades', 3600, {}, u) },
      antivenom: { name: 'Antivenom', icon: '💚', lvl: 5, kind: 'buff', tgt: 'party', desc: 'Party buff: +6% maximum health for 15 minutes.', fx: (C, u) => C.partyBuff(u, 'antivenom', 900, { hp: .06 }) },
      pandemic: { name: 'Pandemic', icon: '🦠', lvl: 5, kind: 'ult', gcd: false, tgt: 'self', desc: 'Ultimate. Every enemy within 12 m is filled to five stacks of poison.',
        fx: (C, u) => { for (const e of C.enemiesNear(u, u, 12)) C.poison(u, e, 5); C.fxRing(u, 12, [.6, 1, .4]); } },
    },
  },
  bard: {
    name: 'Bard', family: 'Rogue', role: 'dps', support: true, res: 'mana', armor: 'leather', color: '#ff9ad0',
    blurb: 'Rogue support. Songs for the whole group, regen, charm and mesmerize, and a fast puller and kiter.',
    hp: [66, 16], pow: [10, 3.9], mana: [100, 18], armorPct: .14, melee: true, swing: 1.9, swingMult: .45, range: 3,
    abilities: {
      chord: { name: 'Dissonant Chord', icon: '🎸', lvl: 1, kind: 'attack', cost: 5, range: 28, tgt: 'enemy', school: 'storm', desc: 'An instant clash of sound at range. Good for pulling.', fx: (C, u, t) => C.damage(u, t, C.pw(u) * .9 + 6, 'storm') },
      lullaby: { name: 'Lullaby', icon: '😴', lvl: 3, kind: 'util', cost: 8, cast: 2, range: 28, tgt: 'enemy', desc: 'Mesmerize the target for 18 seconds. Any damage wakes it. Not bosses.', fx: (C, u, t) => C.mez(u, t, 18) },
      siren: { name: "Siren's Call", icon: '🧜', lvl: 6, kind: 'util', cost: 15, cast: 2.5, cd: 20, range: 25, tgt: 'enemy', desc: 'Charm a normal enemy no higher than your level to fight for you for 30 seconds. When it wears off, it remembers.',
        fx: (C, u, t) => C.charm(u, t, 30) },
      valor: { name: 'Song of Valor', icon: '🎶', lvl: 1, kind: 'buff', song: true, cost: 3, tgt: 'party', desc: 'Song: +8% power for the group. Lasts 24 seconds, so keep singing.', fx: (C, u) => C.partyBuff(u, 'valor', 24, { pow: .08 }) },
      travel: { name: "Traveler's Tune", icon: '🎵', lvl: 2, kind: 'buff', song: true, cost: 3, tgt: 'party', desc: 'Song: +30% run speed for the group for a minute.', fx: (C, u) => C.partyBuff(u, 'travel', 60, { spd: .3 }) },
      rest: { name: 'Song of Rest', icon: '🎼', lvl: 4, kind: 'buff', song: true, cost: 3, tgt: 'party', desc: 'Song: the group regains health and mana even in combat. 24 seconds.', fx: (C, u) => C.partyBuff(u, 'restsong', 24, { rest: 1 }) },
      haste: { name: 'Song of Haste', icon: '🥁', lvl: 8, kind: 'buff', song: true, cost: 3, tgt: 'party', desc: 'Song: +20% attack speed for the group. 24 seconds.', fx: (C, u) => C.partyBuff(u, 'hastesong', 24, { haste: .2 }) },
      crescendo: { name: 'Crescendo', icon: '🎺', lvl: 5, kind: 'ult', gcd: false, tgt: 'self', desc: 'Ultimate. For 12 seconds the group heals 3% a second and hits 15% harder.',
        fx: (C, u) => { for (const p of C.partyOf(u)) if (!p.dead) C.buff(p, 'crescendo', 12, { pow: .15, hot: p.maxHp * .03 }, u); C.fxRing(u, 25, [1, .6, .8]); } },
    },
  },
  // ===== Mages =====
  warlock: {
    name: 'Warlock', family: 'Mage', role: 'dps', res: 'mana', armor: 'cloth', color: '#b86bff',
    blurb: 'Curses and damage over time. What’s left of outlawed necromancy. Drains life to heal itself.',
    hp: [58, 14], pow: [12, 4.3], mana: [115, 21], armorPct: .06, melee: true, swing: 2.4, swingMult: .25, range: 3,
    abilities: {
      sbolt: { name: 'Shadow Bolt', icon: '🟣', lvl: 1, kind: 'attack', cost: 8, cast: 2, range: 32, tgt: 'enemy', school: 'shadow', desc: 'Shadow damage.', fx: (C, u, t) => C.bolt(u, t, C.pw(u) * 1.35 + 10, 'shadow') },
      corruption: { name: 'Corruption', icon: '🦠', lvl: 1, kind: 'attack', cost: 7, range: 32, tgt: 'enemy', school: 'shadow', desc: 'Shadow damage over 15 seconds.', fx: (C, u, t) => C.dot(u, t, 'corruption', C.pw(u) * .22 + 2, 15, 'shadow') },
      agony: { name: 'Curse of Agony', icon: '😖', lvl: 3, kind: 'attack', cost: 8, range: 32, tgt: 'enemy', school: 'shadow', desc: 'A curse: heavy shadow damage over 20 seconds.', fx: (C, u, t) => C.dot(u, t, 'agony', C.pw(u) * .3 + 2, 20, 'shadow') },
      drain: { name: 'Drain Life', icon: '🩸', lvl: 4, kind: 'attack', cost: 10, cast: 3, range: 28, tgt: 'enemy', school: 'shadow', desc: 'Steals health: deals shadow damage and heals you for it.',
        fx: (C, u, t) => { const n = C.damage(u, t, C.pw(u) * 1.3 + 10, 'shadow'); C.heal(u, u, n); } },
      weakness: { name: 'Curse of Weakness', icon: '🥀', lvl: 6, kind: 'util', cost: 8, range: 32, tgt: 'enemy', desc: 'The target deals 25% less damage for 20 seconds.', fx: (C, u, t) => C.buff(t, 'weakness', 20, { pow: -.25 }, u) },
      terror: { name: 'Terror', icon: '😱', lvl: 8, kind: 'util', cost: 10, cd: 20, range: 25, tgt: 'enemy', desc: 'The target flees in terror for 6 seconds. Not bosses.', fx: (C, u, t) => C.fear(u, t, 6) },
      darkpact: { name: 'Dark Pact', icon: '🔮', lvl: 1, kind: 'buff', tgt: 'self', desc: 'Self buff: +10% power for 15 minutes.', fx: (C, u) => C.buff(u, 'darkpact', 900, { pow: .1 }, u) },
      bloodpact: { name: 'Blood Pact', icon: '🩸', lvl: 5, kind: 'buff', cost: 10, tgt: 'party', desc: 'Party buff: +8% maximum health for 15 minutes.', fx: (C, u) => C.partyBuff(u, 'bloodpact', 900, { hp: .08 }) },
      harvest: { name: 'Soul Harvest', icon: '💀', lvl: 5, kind: 'ult', gcd: false, tgt: 'self', desc: 'Ultimate. Every damage-over-time of yours on enemies within 25 m deals all its remaining damage at once. You heal for a third of it.',
        fx: (C, u) => { let tot = 0; for (const e of C.enemiesNear(u, u, 25)) tot += C.harvest(u, e); C.heal(u, u, tot / 3); C.fxRing(u, 25, [.7, .4, 1]); } },
    },
  },
  binder: {
    name: 'Binder', family: 'Mage', role: 'dps', res: 'mana', armor: 'cloth', color: '#ffc85a',
    blurb: 'Summoner. Binds up to four elementals (the Fourfold Law allows no more). They fight on their own; you buff them.',
    hp: [60, 14], pow: [10, 3.6], mana: [120, 22], armorPct: .06, melee: true, swing: 2.4, swingMult: .25, range: 3,
    abilities: {
      lash: { name: 'Elemental Lash', icon: '🔆', lvl: 1, kind: 'attack', cost: 6, cast: 1.5, range: 30, tgt: 'enemy', school: 'storm', desc: 'Storm damage.', fx: (C, u, t) => C.bolt(u, t, C.pw(u) * 1.0 + 8, 'storm') },
      bindfire: { name: 'Bind Fire Spirit', icon: '🔥', lvl: 1, kind: 'util', cost: 20, cast: 3, tgt: 'self', desc: 'Binds a fire spirit that throws fire at your foes.', fx: (C, u) => C.summon(u, 'firepet') },
      bindstone: { name: 'Bind Stone Guardian', icon: '🗿', lvl: 3, kind: 'util', cost: 25, cast: 3, tgt: 'self', desc: 'Binds a stone guardian that taunts and holds enemies.', fx: (C, u) => C.summon(u, 'golempet') },
      empower: { name: 'Empower Bond', icon: '💪', lvl: 4, kind: 'util', cost: 10, cd: 30, gcd: false, tgt: 'self', desc: 'Your elementals deal 40% more damage for 12 seconds.', fx: (C, u) => { for (const p of C.petsOf(u)) C.buff(p, 'empower', 12, { pow: .4 }, u); } },
      bindwater: { name: 'Bind Water Spirit', icon: '💧', lvl: 5, kind: 'util', cost: 25, cast: 3, tgt: 'self', desc: 'Binds a water spirit that heals your group.', fx: (C, u) => C.summon(u, 'waterpet') },
      bindstorm: { name: 'Bind Storm Sprite', icon: '⚡', lvl: 6, kind: 'util', cost: 20, cast: 3, tgt: 'self', desc: 'Binds a fast storm sprite that strikes in melee.', fx: (C, u) => C.summon(u, 'stormpet') },
      mendbond: { name: 'Mend Bond', icon: '💞', lvl: 8, kind: 'util', cost: 15, cd: 15, tgt: 'self', desc: 'Heals all your elementals by 40%.', fx: (C, u) => { for (const p of C.petsOf(u)) C.heal(u, p, p.maxHp * .4); } },
      seal: { name: 'Fourfold Seal', icon: '🔱', lvl: 1, kind: 'buff', tgt: 'self', desc: 'Self buff: your elementals have +20% health. One hour.', fx: (C, u) => { C.buff(u, 'seal', 3600, {}, u); for (const p of C.petsOf(u)) C.recalcPet(p); } },
      kinship: { name: 'Elemental Kinship', icon: '🌐', lvl: 5, kind: 'buff', cost: 12, tgt: 'party', desc: 'Party buff: +10% maximum mana for 15 minutes.', fx: (C, u) => C.partyBuff(u, 'kinship', 900, { mana: .1 }) },
      unbound: { name: 'Unbound', icon: '🌋', lvl: 5, kind: 'ult', gcd: false, tgt: 'self', desc: 'Ultimate. Your elementals heal to full and deal double damage for 12 seconds.',
        fx: (C, u) => { for (const p of C.petsOf(u)) { C.heal(u, p, p.maxHp); C.buff(p, 'unbound', 12, { pow: 1 }, u); } C.fxRing(u, 10, [1, .8, .4]); } },
    },
  },
  illusionist: {
    name: 'Illusionist', family: 'Mage', role: 'dps', support: true, res: 'mana', armor: 'cloth', color: '#d08aff',
    blurb: 'Mage support. The crowd-control master: mesmerize, charm, mana and haste buffs, decoys.',
    hp: [56, 13], pow: [11, 4], mana: [125, 23], armorPct: .06, melee: true, swing: 2.4, swingMult: .25, range: 3,
    abilities: {
      spike: { name: 'Mind Spike', icon: '🔹', lvl: 1, kind: 'attack', cost: 7, cast: 1.5, range: 32, tgt: 'enemy', school: 'arcane', desc: 'Arcane damage.', fx: (C, u, t) => C.bolt(u, t, C.pw(u) * 1.05 + 8, 'arcane') },
      mez: { name: 'Mesmerize', icon: '🌀', lvl: 1, kind: 'util', cost: 8, cast: 1.5, range: 30, tgt: 'enemy', desc: 'Mesmerize the target for 24 seconds. Any damage wakes it. Not bosses.', fx: (C, u, t) => C.mez(u, t, 24) },
      mirror: { name: 'Mirror Image', icon: '🪞', lvl: 4, kind: 'util', cost: 15, cd: 30, gcd: false, tgt: 'self', desc: 'Two copies of you appear and take your enemies’ attention for 12 seconds.', fx: (C, u) => C.mirror(u) },
      fade: { name: 'Fade from Mind', icon: '🌫️', lvl: 5, kind: 'util', cd: 20, gcd: false, tgt: 'self', desc: 'Halves your threat on every enemy.', fx: (C, u) => C.dropThreat(u, .5) },
      charm: { name: 'Charm', icon: '💜', lvl: 6, kind: 'util', cost: 15, cast: 2.5, cd: 15, range: 25, tgt: 'enemy', desc: 'Charm a normal enemy no higher than your level to fight for you for 40 seconds. When it wears off, it remembers.',
        fx: (C, u, t) => C.charm(u, t, 40) },
      massmez: { name: 'Mass Mesmerize', icon: '💤', lvl: 8, kind: 'util', cost: 25, cast: 2, cd: 30, range: 30, tgt: 'enemy', desc: 'Mesmerize every enemy within 8 m of the target for 12 seconds.', fx: (C, u, t) => { for (const e of C.enemiesNear(u, t, 8)) C.mez(u, e, 12); } },
      clarity: { name: 'Clarity', icon: '💎', lvl: 2, kind: 'buff', cost: 12, tgt: 'party', desc: 'Party buff: +60% mana regeneration for 15 minutes.', fx: (C, u) => C.partyBuff(u, 'clarity', 900, { regen: .6 }) },
      hasted: { name: 'Haste', icon: '⏩', lvl: 3, kind: 'buff', cost: 12, tgt: 'party', desc: 'Party buff: +15% attack speed for 15 minutes.', fx: (C, u) => C.partyBuff(u, 'haste', 900, { haste: .15 }) },
      insight: { name: 'Gift of Insight', icon: '👁️', lvl: 5, kind: 'buff', cost: 10, tgt: 'party', desc: 'Party buff: +5% crit chance for 15 minutes.', fx: (C, u) => C.partyBuff(u, 'insight', 900, { crit: .05 }) },
      grand: { name: 'Grand Illusion', icon: '🎭', lvl: 5, kind: 'ult', gcd: false, tgt: 'self', desc: 'Ultimate. Mesmerizes every non-boss enemy within 20 m for 10 seconds and halves the whole group’s threat.',
        fx: (C, u) => { for (const e of C.enemiesNear(u, u, 20)) C.mez(u, e, 10); for (const p of C.partyOf(u)) C.dropThreat(p, .5); C.fxRing(u, 20, [.8, .5, 1]); } },
    },
  },
};
for (const k in NEW) { NEW[k].models = [0, 1, 2].map(i => k + i); CLASSES[k] = NEW[k]; }
export const CLASS_KEYS = ['bulwark', 'wardancer', 'bladewarden', 'monk', 'cleric', 'aegis', 'lifebinder', 'druid', 'longwatch', 'knifeshade', 'blightblade', 'bard', 'elementalist', 'warlock', 'binder', 'illusionist'];
export const FAMILIES = ['Fighter', 'Healer', 'Rogue', 'Mage'];
export const roleOf = e => e && e.cls ? CLASSES[e.cls].role : e && e.pet ? e.pet.role : null;
// how each resource behaves: build (starts empty, earned in combat), regen (refills on its own), pool (mana)
export const RES = { mana: { kind: 'pool' }, rage: { kind: 'build', decay: 3 }, momentum: { kind: 'build', decay: 4 }, focus: { kind: 'regen', rate: 10 }, energy: { kind: 'regen', rate: 12 } };
export const startRes = e => RES[e.resType]?.kind === 'build' ? 0 : e.resMax;
// the Binder's elementals and the Druid's treants
export const PETS = {
  firepet: { name: 'Fire Spirit', kind: 'firepet', role: 'dps', ranged: true, school: 'fire', hpM: .55, powM: .8, spd: 7, r: .45 },
  golempet: { name: 'Stone Guardian', kind: 'golempet', role: 'tank', hpM: 1.3, powM: .45, spd: 6, r: .6, scale: .9 },
  waterpet: { name: 'Water Spirit', kind: 'waterpet', role: 'healer', ranged: true, school: 'frost', hpM: .55, powM: .5, spd: 7, r: .45 },
  stormpet: { name: 'Storm Sprite', kind: 'stormpet', role: 'dps', hpM: .45, powM: .85, spd: 8, r: .4, swing: 1.2 },
  treant: { name: 'Treant', kind: 'treant', role: 'dps', hpM: .9, powM: .6, spd: 6, r: .6, scale: .8 },
};
// default 12-key bars: actives first, then buffs, then the ultimate
export function defaultBar(cls) {
  const ab = CLASSES[cls].abilities, keys = Object.keys(ab);
  const act = keys.filter(k => ab[k].kind !== 'buff' && ab[k].kind !== 'ult'), buf = keys.filter(k => ab[k].kind === 'buff'), ult = keys.filter(k => ab[k].kind === 'ult');
  let bar = ['attack', ...act, ...buf, ...ult];
  if (bar.length > 12) bar = bar.filter(k => k !== 'attack');
  if (bar.length > 12) bar = [...act, ...buf].slice(0, 12 - ult.length).concat(ult);
  while (bar.length < 12) bar.push(null);
  return bar.slice(0, 12);
}
export const ELEMENTS = { fire: '🔥', frost: '❄️', storm: '🌩️', earth: '🪨' };
export const SCHOOL_COL = { phys: '#ffffff', fire: '#ff8a3a', frost: '#9fe6ff', storm: '#e0d0ff', earth: '#d8b27a', holy: '#fff2a0', shadow: '#c08aff', poison: '#9be36b', nature: '#9be36b', arcane: '#e0b0ff' };

// ---------- mobs ----------
// hpM/dmgM scale the level curve; weak/resist drive the Elementalist's advantage.
export const MOBS = {
  wolf: { name: 'Plains Wolf', kind: 'wolf', hpM: .9, dmgM: .9, spd: 6.2, range: 2.2, weak: 'fire', resist: 'frost', scale: 1, aggro: 9, social: 8, beast: true, drop: 'pelt' },
  wasp: { name: 'Meadow Stinger', kind: 'wasp', hpM: .7, dmgM: .9, spd: 6.5, range: 2, weak: 'frost', resist: 'storm', scale: 1.3, aggro: 7, social: 0, fly: 1.2 },
  bear: { name: 'Grizzled Bear', kind: 'bear', hpM: 1.4, dmgM: 1.15, spd: 5.4, range: 2.6, weak: 'storm', resist: 'frost', scale: 1, aggro: 7, social: 0, beast: true, drop: 'pelt' },
  bandit: { name: 'Kingsroad Brigand', kind: 'bandit', hpM: 1, dmgM: 1, spd: 5.6, range: 2.2, weak: 'storm', resist: null, scale: 1, aggro: 12, social: 14, human: true, flee: true },
  bandit2: { name: 'Kingsroad Cutthroat', kind: 'bandit2', hpM: .95, dmgM: 1.1, spd: 5.8, range: 2.2, weak: 'frost', resist: null, scale: 1, aggro: 12, social: 14, human: true, flee: true },
  xbow: { name: 'Brigand Marksman', kind: 'xbow', hpM: .85, dmgM: .9, spd: 5.4, range: 22, ranged: true, weak: 'earth', resist: null, scale: 1, aggro: 15, social: 14, human: true },
  brute: { name: 'Tusk Brute', kind: 'brute', hpM: 1.25, dmgM: 1.15, spd: 5.6, range: 2.6, weak: 'frost', resist: 'fire', scale: 1.1, aggro: 12, social: 15 },
  shaman: { name: 'Tusk Bonecaller', kind: 'shaman', hpM: .9, dmgM: .8, spd: 5.2, range: 20, ranged: true, caster: true, healer: true, weak: 'earth', resist: 'storm', scale: 1, aggro: 13, social: 15 },
  troll: { name: 'Old Tusk', kind: 'troll', hpM: 1.3, dmgM: 1.4, spd: 5.6, range: 3.2, weak: 'fire', resist: 'frost', scale: 1.15, aggro: 12, social: 0 },
  skeleton: { name: 'Restless Bones', kind: 'skeleton', hpM: 1, dmgM: 1, spd: 5.4, range: 2.4, weak: 'earth', resist: 'frost', scale: 1, aggro: 11, social: 12, undead: true },
  ghoul: { name: 'Waste Ghoul', kind: 'ghoul', hpM: 1.05, dmgM: 1.05, spd: 6, range: 2.2, weak: 'fire', resist: 'earth', scale: 1, aggro: 11, social: 12, undead: true },
  wraith: { name: 'Choir Wraith', kind: 'wraith', hpM: .9, dmgM: 1, spd: 5.4, range: 18, ranged: true, caster: true, weak: 'storm', resist: 'frost', scale: 1, aggro: 12, social: 12, undead: true, fly: .4 },
  abom: { name: 'Grathul the Stitched', kind: 'abom', hpM: 1, dmgM: 1, spd: 5, range: 3.6, weak: 'fire', resist: 'earth', scale: 1.5, aggro: 14, social: 30, undead: true },
};
// Build 4.4: enemies are tougher and hit harder across the board
export const mobHp = L => (42 + 28 * L) * 1.5;
export const mobDmg = L => (4 + 2.3 * L) * 1.75;
export const mobXp = L => 18 + 13 * L + .9 * L * L;

// ---------- items ----------
export const SLOTS = ['weapon', 'off', 'head', 'chest', 'legs', 'feet', 'neck', 'ring'];
export const SLOT_NAMES = { weapon: 'Weapon', off: 'Off-hand', head: 'Head', chest: 'Chest', legs: 'Legs', feet: 'Feet', neck: 'Neck', ring: 'Ring', recipe: 'Recipe', collect: 'Collectible' };
export const RARITY = [{ n: 'Common', c: '#d8d2c2' }, { n: 'Uncommon', c: '#5fd35a' }, { n: 'Rare', c: '#4fa0ff' }, { n: 'Epic', c: '#b86bff' }, { n: 'Legendary', c: '#ff9a2a' }];
// which armour each class can wear
export const WEAR = { plate: ['plate', 'leather', 'cloth'], leather: ['leather', 'cloth'], cloth: ['cloth'] };
export const BASE_NAMES = {
  weapon: { mace: ['Mace', 'Warhammer', 'Flanged Mace'], staff: ['Staff', 'Quarterstaff', 'Rod'], bow: ['Shortbow', 'Longbow', 'Recurve Bow'],
    blade: ['Sabre', 'Scimitar', 'Shamshir'], greatsword: ['Greatsword', 'Claymore', 'Zweihander'], wraps: ['Hand Wraps', 'Knuckle Guards', 'Fist Bands'],
    dagger: ['Dirk', 'Stiletto', 'Kris'], rapier: ['Rapier', 'Smallsword', 'Estoc'], wand: ['Wand', 'Sceptre', 'Spellrod'] },
  off: { shield: ['Kite Shield', 'Buckler', 'Tower Shield'], tome: ['Prayer Book', 'Censer'], orb: ['Focus Orb', 'Ember Stone'], quiver: ['Quiver', 'Arrow Case'],
    sabre: ['Off-hand Sabre', 'Parrying Blade'], charm: ['Warrior\'s Charm', 'Prayer Beads', 'Lucky Coin'], relic: ['Ward Relic', 'Holy Icon'], totem: ['Totem', 'Antler Fetish', 'Seed Pouch'],
    knife: ['Main Gauche', 'Throwing Knife'], vial: ['Venom Vial', 'Toxin Kit'], lute: ['Lute', 'Lyre', 'Hand Drum'], grimoire: ['Grimoire', 'Skull Lantern'], bond: ['Binding Chain', 'Sigil Stone'] },
  head: { plate: ['Helm', 'Sallet'], leather: ['Hood', 'Cap'], cloth: ['Cowl', 'Circlet'] },
  chest: { plate: ['Breastplate', 'Hauberk'], leather: ['Jerkin', 'Brigandine'], cloth: ['Robe', 'Vestments'] },
  legs: { plate: ['Greaves', 'Legplates'], leather: ['Leggings', 'Breeches'], cloth: ['Trousers', 'Kilt'] },
  feet: { plate: ['Sabatons', 'Warboots'], leather: ['Boots', 'Treads'], cloth: ['Slippers', 'Sandals'] },
};
const PREFIX = ['Worn', 'Sturdy', 'Fine', 'Polished', 'Militia', 'Wayfarer\'s', 'Harrow', 'Veteran\'s'];
const SUFFIX = [['of the Bear', 'sta'], ['of Might', 'pow'], ['of the Eagle', 'crit'], ['of Fortitude', 'sta'], ['of Power', 'pow'], ['of Precision', 'crit']];
// weapon and off-hand types per class
export const WTYPE = { bulwark: ['mace', 'shield'], cleric: ['staff', 'tome'], longwatch: ['bow', 'quiver'], elementalist: ['staff', 'orb'],
  wardancer: ['blade', 'sabre'], bladewarden: ['greatsword', 'charm'], monk: ['wraps', 'charm'], aegis: ['wand', 'relic'], lifebinder: ['staff', 'totem'], druid: ['staff', 'totem'],
  knifeshade: ['dagger', 'knife'], blightblade: ['dagger', 'vial'], bard: ['rapier', 'lute'], warlock: ['staff', 'grimoire'], binder: ['wand', 'bond'], illusionist: ['wand', 'orb'] };
let itemSeq = 1;
export function makeItem(o) { return { uid: itemSeq++, ...o }; }
// a random piece of gear for a level; cls biases it toward something that class can use
export function randomGear(L, cls, rarityBoost = 0) {
  const r = Math.random() + rarityBoost, rarity = r > .985 ? 2 : r > .82 ? 1 : 0;
  const slot = ['weapon', 'off', 'head', 'chest', 'legs', 'feet'][(Math.random() * 6) | 0];
  let type;
  if (slot === 'weapon' || slot === 'off') { const pool = cls ? [WTYPE[cls][slot === 'weapon' ? 0 : 1]] : Object.values(WTYPE).map(w => w[slot === 'weapon' ? 0 : 1]); type = pool[(Math.random() * pool.length) | 0]; }
  else type = cls && Math.random() < .7 ? CLASSES[cls].armor : ['plate', 'leather', 'cloth'][(Math.random() * 3) | 0];
  const names = BASE_NAMES[slot][type], base = names[(Math.random() * names.length) | 0];
  const budget = (2 + L * 1.6) * (1 + rarity * .45) * (slot === 'weapon' ? 1.6 : slot === 'chest' ? 1.2 : 1);
  const stats = { sta: 0, pow: 0, crit: 0, arm: 0 };
  const armorType = slot === 'weapon' ? null : slot === 'off' ? (type === 'shield' ? 'plate' : null) : type;
  if (armorType) stats.arm = Math.round((armorType === 'plate' ? 3 : armorType === 'leather' ? 2 : 1) * (1 + L * .8) * (1 + rarity * .3));
  let name = base, suf = null;
  if (rarity > 0) { suf = SUFFIX[(Math.random() * SUFFIX.length) | 0]; name = `${base} ${suf[0]}`; }
  else name = `${PREFIX[(Math.random() * PREFIX.length) | 0]} ${base}`;
  if (slot === 'weapon') { stats.pow = Math.round(budget * .7); stats.sta = Math.round(budget * .3); }
  else { stats.sta = Math.round(budget * .55); stats.pow = Math.round(budget * .35); }
  if (suf) { stats[suf[1]] += suf[1] === 'crit' ? 0 : Math.round(budget * .4); if (suf[1] === 'crit') stats.crit = +(1 + rarity + L * .15).toFixed(1); }
  for (const k in stats) if (!stats[k]) delete stats[k];
  return makeItem({ name, slot, type, armorType, lvl: L, rarity, stats, value: Math.round((3 + L * 4) * (1 + rarity * 2)) });
}
// named mobs always drop from their own list
export const NAMED_LOOT = {
  captain: [
    { name: "Rusk's Brigandine", slot: 'chest', type: 'leather', armorType: 'leather', lvl: 5, rarity: 2, stats: { sta: 12, pow: 7, crit: 2, arm: 14 }, value: 60 },
    { name: "Captain's Buckler", slot: 'off', type: 'shield', armorType: 'plate', lvl: 5, rarity: 2, stats: { sta: 10, arm: 26 }, value: 55 },
    { name: 'Roadwarden Cowl', slot: 'head', type: 'cloth', armorType: 'cloth', lvl: 5, rarity: 2, stats: { sta: 7, pow: 9, arm: 5 }, value: 50 }],
  tusk: [
    { name: 'Tuskbreaker Maul', slot: 'weapon', type: 'mace', lvl: 8, rarity: 2, stats: { pow: 22, sta: 10 }, value: 120 },
    { name: 'Mossjaw Hide Mantle', slot: 'chest', type: 'leather', armorType: 'leather', lvl: 8, rarity: 2, stats: { sta: 15, pow: 10, crit: 3, arm: 20 }, value: 110 },
    { name: 'Bonecaller\'s Rattle', slot: 'off', type: 'tome', lvl: 8, rarity: 2, stats: { pow: 12, sta: 6 }, value: 90 },
    { name: 'Trollhide Greaves', slot: 'legs', type: 'plate', armorType: 'plate', lvl: 8, rarity: 2, stats: { sta: 16, pow: 6, arm: 34 }, value: 100 },
    { name: 'Tusk-Tooth Kris', slot: 'weapon', type: 'dagger', lvl: 8, rarity: 2, stats: { pow: 20, sta: 8, crit: 2 }, value: 110 },
    { name: 'Hollow Antler Totem', slot: 'off', type: 'totem', lvl: 8, rarity: 2, stats: { pow: 11, sta: 7 }, value: 90 }],
  boss: [
    { name: 'Stitched Bulwark', slot: 'off', type: 'shield', armorType: 'plate', lvl: 10, rarity: 3, stats: { sta: 22, pow: 6, arm: 60 }, value: 260 },
    { name: "Warden's Bone Staff", slot: 'weapon', type: 'staff', lvl: 10, rarity: 3, stats: { pow: 34, sta: 12, crit: 3 }, value: 280 },
    { name: 'Ossuary Longbow', slot: 'weapon', type: 'bow', lvl: 10, rarity: 3, stats: { pow: 34, sta: 10, crit: 4 }, value: 280 },
    { name: 'Shroud of the Pale Choir', slot: 'chest', type: 'cloth', armorType: 'cloth', lvl: 10, rarity: 3, stats: { sta: 18, pow: 20, crit: 2, arm: 12 }, value: 240 },
    { name: 'Grave-iron Helm', slot: 'head', type: 'plate', armorType: 'plate', lvl: 10, rarity: 3, stats: { sta: 20, pow: 8, arm: 40 }, value: 220 },
    { name: 'Gutstring Treads', slot: 'feet', type: 'leather', armorType: 'leather', lvl: 10, rarity: 3, stats: { sta: 12, pow: 14, crit: 4, arm: 16 }, value: 220 },
    { name: 'Choir-Ender Greatsword', slot: 'weapon', type: 'greatsword', lvl: 10, rarity: 3, stats: { pow: 32, sta: 16 }, value: 280 },
    { name: 'Stitchripper', slot: 'weapon', type: 'dagger', lvl: 10, rarity: 3, stats: { pow: 30, sta: 10, crit: 4 }, value: 270 },
    { name: 'Sceptre of the Pale Choir', slot: 'weapon', type: 'wand', lvl: 10, rarity: 3, stats: { pow: 34, sta: 10, crit: 2 }, value: 270 },
    { name: 'Bone-Strung Lute', slot: 'off', type: 'lute', lvl: 10, rarity: 3, stats: { pow: 14, sta: 12 }, value: 220 }],
};
export const NAMED_NAMES = w => ({ captain: w.names.captain, tusk: w.names.tusk, boss: w.names.boss });
export const POTIONS = {
  hpot: { name: 'Healing Draught', icon: '🧪', price: 8, desc: 'Restores 40% of your health. 60 s cooldown.' },
  mpot: { name: 'Clarity Draught', icon: '💧', price: 8, desc: 'Restores 40% of your mana, rage or focus. 60 s cooldown.' },
};

// ---------- quests ----------
// obj: kill (mob keys), collect (item from mob keys, chance), named (named key)
export const QUESTS = [
  { id: 'q1', giver: 'warden', lvl: 1, name: 'Wolves at the Wall', text: 'The plains wolves have grown bold since the harvest. They take sheep within sight of the gate. Thin them out.', obj: { kill: ['wolf'], n: 8 }, xp: 260, gold: 4 },
  { id: 'q2', giver: 'tanner', lvl: 2, name: 'Pelts for the Tanner', text: "Winter's coming and I've hides to make. Bring me good wolf or bear pelts, six of them.", obj: { collect: ['wolf', 'bear'], item: 'Thick Pelt', chance: .5, n: 6 }, xp: 330, gold: 6, pre: 'q1' },
  { id: 'q3', giver: 'warden', lvl: 3, name: 'Roadside Brigands', text: 'Brigands camp along the Kingsroad and rob anyone who walks it alone. Take a group. Break them.', obj: { kill: ['bandit', 'bandit2', 'xbow'], n: 10 }, xp: 620, gold: 10, pre: 'q1' },
  { id: 'q4', giver: 'warden', lvl: 5, name: 'The Captain of Cutthroats', text: 'Their leader styles himself a captain. He keeps to the eastern camp and only shows himself when his men fall. Camp him. Bring me his head.', obj: { named: 'captain', n: 1 }, xp: 1100, gold: 20, pre: 'q3', gear: true },
  { id: 'q5', giver: 'tanner', lvl: 5, name: 'The Tusk Warband', text: 'Orcs out of the wood, painted for war. Their bonecallers heal the brutes, so kill the callers first.', obj: { kill: ['brute', 'shaman'], n: 10 }, xp: 1300, gold: 18, pre: 'q2' },
  { id: 'q6', giver: 'sister', lvl: 7, name: 'Bones That Walk', text: 'The Grey Waste was necromancer land in the wars. A hundred years on, the dead still stand up. Put them down.', obj: { kill: ['skeleton', 'ghoul'], n: 12 }, xp: 1900, gold: 24 },
  { id: 'q7', giver: 'tanner', lvl: 8, name: 'The Old Troll', text: 'An old troll holds the hollow at the far end of the wood. He\'s killed every hunter I sent. You\'ll want a full group.', obj: { named: 'tusk', n: 1 }, xp: 2400, gold: 35, pre: 'q5', gear: true },
  { id: 'q8', giver: 'sister', lvl: 8, name: 'Into the Ossuary', text: 'The War Ruin to the north was a necromancer\'s stronghold. Clear its court and hall. The Fourfold Law forbids what was done there.', obj: { kill: ['skeleton', 'ghoul', 'wraith'], n: 15, dungeon: true }, xp: 2800, gold: 40, pre: 'q6' },
  { id: 'q9', giver: 'warden', lvl: 9, name: 'The Stitched Thing', text: 'Something sewn together from the war dead waits in the Ossuary\'s crypt. Kill it. Bring six. Bring a healer you trust.', obj: { named: 'boss', n: 1 }, xp: 4200, gold: 80, pre: 'q8', gear: true },
];
export const GIVERS = {
  warden: { name: 'Warden Ilse', title: 'Captain of the Watch', model: 'guard' },
  tanner: { name: 'Bram the Tanner', title: 'Hides and Leathers', model: 'bandit2' },
  sister: { name: 'Sister Maren', title: 'Keeper of the Fourfold Law', model: 'priest' },
};

// ---------- fake players ----------
export const FAKE_NAMES = ['Thrognar', 'Elyndra', 'Kaelith', 'Shadowstep', 'Healzorz', 'Arrowyn', 'Pyrelli', 'Brannoc', 'Tankard', 'Mendria', 'Vexis', 'Lumara',
  'Grimwald', 'Fizzbolt', 'Sylvara', 'Dorran', 'Kestrel', 'Ironmaw', 'Beldin', 'Moonwhisper', 'Rhaegis', 'Zoltra', 'Pippa', 'Torvin', 'Cindrel', 'Halvard', 'Nyxie',
  'Oakhart', 'Quillan', 'Raxxa', 'Stormy', 'Tidra', 'Ulfric', 'Wynne', 'Xandor', 'Yselle', 'Zeph', 'Pewpewpew', 'Tankenstein', 'Pullsalot', 'Notacleric', 'Lootgoblin',
  'Bubblez', 'Critney', 'Smitey', 'Boltzmann', 'Aggromagnet', 'Sirheals', 'Dotsy', 'Quivera', 'Hammerdin', 'Frostyflakes'];
// personalities flavour the chat
export const PERSONAS = ['chill', 'tryhard', 'joker', 'newbie', 'veteran', 'grumpy'];
export const GUILDS = ['Ashen Covenant', 'Wallbreakers', 'Order of the Fourfold', 'Bad Pullers', 'Mana Break', 'Sleepy Wolves'];
export const CHAT = {
  general: [
    'LFG {area}, {role} here', 'LF {role} for {ruin}, need {n} more', 'anyone seen {named}? been camping 20 min', '{named} up!! east camp', 'WTS {item} 12g',
    'how do i get to {ruin}', 'is the {ruin} boss hard?', 'remember when the {wood} was empty lol', 'need a healer, will pay', 'LF tank, we have heals',
    'gz on the ding {pname}', 'who keeps training wolves to the gate', 'just hit {lvl}!', 'what drops pelts best', 'bears hit HARD', 'selling pelts, cheap',
    'any {role} around? {ruin} run', 'guild {guild} recruiting, all classes', 'is it true necromancy is still outlawed in {town}', 'the Fourfold Law is so dumb, four pets max??',
    'corpse run #3 tonight', 'anyone wanna duo bandits', 'LF1M {role} {ruin}', 'shaman healed the brute 4 times. FOUR.', 'that troll took my whole group',
  ],
  joinYes: ['sure!', 'omw', 'yes pls', 'inv accepted', 'ok lets go', 'sweet, I need xp', 'finally a group'],
  joinNo: ['sorry, in a group', 'busy questing, maybe later', 'brb', 'no thx', 'too low for that lol'],
  pull: ['Pulling {t}', 'Incoming!', '{t} inc', 'pulling, get ready', 'here they come'],
  oom: ['OOM, sitting', 'need mana', 'low mana, give me a sec', 'drinking'],
  died: ['ugh im down', 'dead...', 'rip me', 'that hurt', 'why me'],
  ding: ['DING!', 'ding {lvl}!', 'level {lvl} woo'],
  gz: ['gz', 'grats!', 'gz!', 'nice', 'grats'],
  wipe: ['wipe :(', 'well that went great', 'corpse run time', 'who pulled that??', 'lol'],
  boss: ['boss time', 'everyone ready?', 'dont stand in the green', 'tank face it away pls'],
  aggro: ['oops, aggro', 'its on me!!', 'help!', 'tank??'],
  loot: ['nice drop', 'grats on loot', 'gz on the item'],
  ninja: ['ty for the loot ;)', 'mine now', 'i needed that, sry'],
  thanks: ['ty', 'thanks!', 'appreciated', 'ty boss'],
  grumble: ['hm, ok', 'could have used that', 'guess not', 'fine i guess'],
  idle: ['brb', 'gotta feed the cat', 'this group is good', 'love this game', 'lag?', 'nice pull', 'heals are great today'],
};

// =====================================================================
// Build 3: levels 11-20, the Saltreach Coast, the Sunken Fleet
// =====================================================================
// spells you learned ten levels ago become Rank II: 35% stronger, same bar slot
export const rankOf = (e, ab) => ab && e.lvl >= ab.lvl + 10 ? 2 : 1;
// Build 8: spell books add two more ranks on top, Adept and Master. BOOK.rank is filled in by spell8.js.
export const BOOK = { rank: () => 0, names: ['', 'Adept', 'Master'], pow: [1, 1.15, 1.3], cost: [1, .9, .8], cd: [1, 1, .85] };
export const rankMul = (e, ab) => (rankOf(e, ab) > 1 ? 1.35 : 1) * BOOK.pow[BOOK.rank(e, ab)] * (BOOK.tal ? BOOK.tal(e, ab) : 1);
export const costMul = (e, ab) => BOOK.cost[BOOK.rank(e, ab)];
export const cdMul = (e, ab) => BOOK.cd[BOOK.rank(e, ab)] * (BOOK.talCd ? BOOK.talCd(e, ab) : 1);
export const rankName = (e, ab) => { const b = ab ? BOOK.rank(e, ab) : 0; return (b ? BOOK.names[b] + ' ' : '') + ab.name + (rankOf(e, ab) > 1 ? ' II' : ''); };
const NEW_SPELLS = {
  bulwark: {
    bash: { name: 'Shield Bash', icon: '🛡️', lvl: 12, kind: 'util', cost: 15, cd: 12, range: 3, tgt: 'enemy', desc: 'Interrupts any spell and stuns for 2 seconds (bosses are only interrupted).',
      fx: (C, u, t) => { C.interrupt(t); if (!t.boss && !t.named) C.stun(u, t, 2); C.damage(u, t, C.pw(u) * .6, 'phys', { threat: 3 }); } },
    rally: { name: 'Rallying Cry', icon: '📯', lvl: 16, kind: 'util', cd: 60, gcd: false, tgt: 'self', desc: 'The party heals 10% and takes 15% less damage for 8 seconds.',
      fx: (C, u) => { for (const p of C.partyOf(u)) if (!p.dead && C.d(u, p) < 30) { C.heal(u, p, p.maxHp * .1); C.buff(p, 'rallycry', 8, { dr: .15 }, u); } C.fxRing(u, 15, [1, .9, .5]); } },
  },
  cleric: {
    prayer: { name: 'Prayer of Healing', icon: '🙏', lvl: 12, kind: 'heal', cost: 35, cast: 3.5, tgt: 'self', desc: 'A big heal on every party member within 30 m.',
      fx: (C, u) => { for (const p of C.partyOf(u)) if (!p.dead && C.d(u, p) < 30) C.heal(u, p, C.pw(u) * 1.8 + 20); C.fxRing(u, 30, [1, .95, .6]); } },
    guardian: { name: 'Guardian Spirit', icon: '😇', lvl: 16, kind: 'heal', cost: 12, cd: 60, gcd: false, range: 30, tgt: 'ally', desc: 'For 10 seconds the target cannot fall below 10% health.',
      fx: (C, u, t) => C.buff(t, 'guardian', 10, { floor: .1 }, u) },
  },
  longwatch: {
    multishot: { name: 'Multi-Shot', icon: '🎇', lvl: 12, kind: 'attack', cost: 30, cd: 8, range: 32, tgt: 'enemy', desc: 'Shoots the target and two enemies near it.',
      fx: (C, u, t) => { const L = C.enemiesNear(u, t, 10).sort((a, b) => C.d(a, t) - C.d(b, t)).slice(0, 3); for (const e of L) C.shoot(u, e, C.pw(u) * 1.0 + 8); } },
    rapid: { name: 'Rapid Fire', icon: '⏩', lvl: 16, kind: 'util', cd: 45, gcd: false, tgt: 'self', desc: 'Shoot 50% faster for 12 seconds.', fx: (C, u) => C.buff(u, 'rapid', 12, { haste: .5 }, u) },
  },
  elementalist: {
    meteor: { name: 'Meteor', icon: '☄️', lvl: 12, kind: 'attack', cost: 18, cast: 2.5, cd: 15, range: 32, tgt: 'enemy', school: 'fire', desc: 'Fire crashes down on every enemy within 8 m of the target.',
      fx: (C, u, t) => { for (const e of C.enemiesNear(u, t, 8)) C.damage(u, e, C.pw(u) * 1.6 + 12, 'fire'); C.fxRing(t, 8, [1, .5, .2]); } },
    prism: { name: 'Prismatic Bolt', icon: '🌈', lvl: 16, kind: 'attack', cost: 12, cd: 8, range: 32, tgt: 'enemy', desc: 'Instant: strikes with whatever element the target is weak to.',
      fx: (C, u, t) => C.bolt(u, t, C.pw(u) * 1.7 + 12, C.weakOf(t) || 'fire') },
  },
  wardancer: {
    flurry: { name: 'Blade Flurry', icon: '⚔️', lvl: 12, kind: 'attack', cost: 35, cd: 8, range: 3, tgt: 'enemy', desc: 'Four quick cuts with heavy threat.',
      fx: (C, u, t) => { for (let i = 0; i < 4; i++) C.damage(u, t, C.pw(u) * .45 + 3, 'phys', { threat: 3 }); } },
    flourish: { name: 'Taunting Flourish', icon: '🎭', lvl: 16, kind: 'util', cd: 30, gcd: false, tgt: 'self', desc: 'Every enemy within 10 m must attack you.', fx: (C, u) => { for (const e of C.enemiesNear(u, u, 10)) C.taunt(u, e); C.fxRing(u, 10, [1, .6, .4]); } },
  },
  bladewarden: {
    disarm: { name: 'Disarm', icon: '🪓', lvl: 12, kind: 'util', cost: 15, cd: 20, range: 3.2, tgt: 'enemy', desc: 'The target deals 40% less damage for 8 seconds.', fx: (C, u, t) => { C.buff(t, 'disarm', 8, { pow: -.4 }, u); C.damage(u, t, C.pw(u) * .4, 'phys', { threat: 3 }); } },
    execute: { name: 'Execution', icon: '🗡️', lvl: 16, kind: 'attack', cost: 30, cd: 6, range: 3.2, tgt: 'enemy', desc: 'A huge blow, doubled on targets below 30% health.',
      fx: (C, u, t) => C.damage(u, t, (C.pw(u) * 1.6 + 10) * (t.hp < t.maxHp * .3 ? 2 : 1), 'phys', { threat: 2 }) },
  },
  monk: {
    flyingkick: { name: 'Flying Kick', icon: '🦶', lvl: 14, kind: 'attack', cost: 20, cd: 10, range: 20, tgt: 'enemy', desc: 'Leap to the target and kick it.', fx: (C, u, t) => { C.leapTo(u, t); C.damage(u, t, C.pw(u) * 1.2 + 8, 'phys'); } },
  },
  aegis: {
    reflect: { name: 'Reflective Ward', icon: '🪞', lvl: 12, kind: 'heal', cost: 14, cd: 10, range: 30, tgt: 'ally', desc: 'A ward that also burns anything striking the target in melee for 12 seconds.',
      fx: (C, u, t) => { C.ward(u, t, C.pw(u) * 1.6 + 16, 12, true); C.buff(t, 'reflect', 12, { thorns: C.pw(u) * .5 + 4 }, u); } },
    barrier: { name: 'Barrier', icon: '🔵', lvl: 16, kind: 'heal', cost: 25, cd: 60, gcd: false, tgt: 'self', desc: 'The whole party takes 30% less damage for 6 seconds.',
      fx: (C, u) => { for (const p of C.partyOf(u)) if (!p.dead && C.d(u, p) < 30) C.buff(p, 'barrier', 6, { dr: .3 }, u); C.fxRing(u, 20, [.6, .85, 1]); } },
  },
  lifebinder: {
    lifebloom: { name: 'Lifebloom', icon: '🌺', lvl: 12, kind: 'heal', cost: 10, range: 30, tgt: 'ally', desc: 'A small heal over 8 seconds that bursts into a big heal when it ends.',
      fx: (C, u, t) => C.buff(t, 'lifebloom', 8, { hot: (C.pw(u) * .8 + 8) / 8, bloom: C.pw(u) * 1.6 + 16 }, u) },
    tranq: { name: 'Tranquility', icon: '🕊️', lvl: 16, kind: 'heal', cost: 40, cast: 3, cd: 30, tgt: 'self', desc: 'A large heal on every party member within 30 m.',
      fx: (C, u) => { for (const p of C.partyOf(u)) if (!p.dead && C.d(u, p) < 30) C.heal(u, p, C.pw(u) * 2.2 + 24); C.fxRing(u, 30, [.6, 1, .5]); } },
  },
  druid: {
    starfall: { name: 'Starfall', icon: '🌠', lvl: 14, kind: 'attack', cost: 18, cd: 15, range: 30, tgt: 'enemy', school: 'nature', desc: 'Stars fall on every enemy within 8 m of the target and slow them.',
      fx: (C, u, t) => { for (const e of C.enemiesNear(u, t, 8)) { C.damage(u, e, C.pw(u) * 1.2 + 8, 'nature'); C.buff(e, 'slow', 6, { slow: .3 }, u); } C.fxRing(t, 8, [.8, .8, 1]); } },
  },
  knifeshade: {
    step: { name: 'Shadowstep', icon: '👣', lvl: 12, kind: 'util', cd: 15, gcd: false, range: 24, tgt: 'enemy', desc: 'Step out of the shadows right behind the target.', fx: (C, u, t) => C.stepBehind(u, t) },
    fan: { name: 'Fan of Knives', icon: '🌟', lvl: 16, kind: 'attack', cost: 40, cd: 8, tgt: 'self', desc: 'Knives into every enemy within 7 m.', fx: (C, u) => { for (const e of C.enemiesNear(u, u, 7)) C.damage(u, e, C.pw(u) * 1.0 + 8, 'phys'); C.fxRing(u, 7, [.9, .9, 1]); } },
  },
  blightblade: {
    cloud: { name: 'Noxious Cloud', icon: '☁️', lvl: 12, kind: 'attack', cost: 30, cd: 15, tgt: 'self', desc: 'Two stacks of poison on every enemy within 6 m.', fx: (C, u) => { for (const e of C.enemiesNear(u, u, 6)) C.poison(u, e, 2); C.fxRing(u, 6, [.6, 1, .4]); } },
    lethal: { name: 'Lethal Doses', icon: '⚗️', lvl: 16, kind: 'util', cd: 40, gcd: false, tgt: 'self', desc: 'For 10 seconds every poison you apply adds twice the stacks.', fx: (C, u) => C.buff(u, 'lethal', 10, {}, u) },
  },
  bard: {
    seasong: { name: 'Song of the Sea', icon: '🌊', lvl: 12, kind: 'buff', song: true, cost: 3, tgt: 'party', desc: 'Song: the group never runs out of breath and swims 40% faster. 60 seconds.', fx: (C, u) => C.partyBuff(u, 'seasong', 60, { breath: 1, swim: .4 }) },
    shriek: { name: 'Discordant Shriek', icon: '📢', lvl: 16, kind: 'util', cost: 15, cd: 30, tgt: 'self', desc: 'Stuns every non-boss enemy within 8 m for 3 seconds.', fx: (C, u) => { for (const e of C.enemiesNear(u, u, 8)) { C.interrupt(e); if (!e.boss && !e.named) C.stun(u, e, 3); } C.fxRing(u, 8, [1, .6, .8]); } },
  },
  warlock: {
    rain: { name: 'Rain of Fire', icon: '🔥', lvl: 12, kind: 'attack', cost: 18, cast: 2.5, cd: 12, range: 32, tgt: 'enemy', school: 'fire', desc: 'Fire rains on every enemy within 8 m of the target.',
      fx: (C, u, t) => { for (const e of C.enemiesNear(u, t, 8)) C.damage(u, e, C.pw(u) * 1.3 + 10, 'fire'); C.fxRing(t, 8, [1, .5, .2]); } },
    bargain: { name: 'Dark Bargain', icon: '🩸', lvl: 16, kind: 'util', cd: 30, gcd: false, tgt: 'self', desc: 'Trade 15% of your health for 30% of your mana.', fx: (C, u) => { u.hp = Math.max(1, u.hp - u.maxHp * .15); C.gain(u, u.resMax * .3); } },
  },
  binder: {
    primal: { name: 'Primal Strike', icon: '💥', lvl: 12, kind: 'attack', cost: 12, cd: 10, range: 30, tgt: 'enemy', desc: 'All your elementals strike the target at once for heavy damage.',
      fx: (C, u, t) => { for (const p of C.petsOf(u)) C.damage(p, t, p.power * 2 + 6, 'phys'); C.fxRing(t, 3, [1, .8, .4]); } },
    fourward: { name: 'Fourfold Ward', icon: '🔰', lvl: 16, kind: 'util', cd: 45, gcd: false, tgt: 'self', desc: 'Take 20% less damage, plus 5% for each bound elemental, for 10 seconds.', fx: (C, u) => C.buff(u, 'fourward', 10, { dr: .2 + .05 * C.petsOf(u).length }, u) },
  },
  illusionist: {
    slow: { name: 'Slow', icon: '🐢', lvl: 12, kind: 'util', cost: 10, range: 30, tgt: 'enemy', desc: 'The target attacks 35% slower for 20 seconds. Works on bosses.', fx: (C, u, t) => C.buff(t, 'slowed', 20, { haste: -.35 }, u) },
    phantasm: { name: 'Phantasmal Killer', icon: '👻', lvl: 16, kind: 'attack', cost: 14, range: 32, tgt: 'enemy', school: 'arcane', desc: 'The target’s worst fear eats at it: heavy damage over 12 seconds.', fx: (C, u, t) => C.dot(u, t, 'phantasm', C.pw(u) * .45 + 3, 12, 'arcane') },
  },
};
for (const c in NEW_SPELLS) {
  // new spells go before the buffs and the ultimate so default bars stay in order
  const old = CLASSES[c].abilities, out = {};
  for (const [k, a] of Object.entries(old)) if (a.kind !== 'buff' && a.kind !== 'ult') out[k] = a;
  Object.assign(out, NEW_SPELLS[c]);
  for (const [k, a] of Object.entries(old)) if (a.kind === 'buff' || a.kind === 'ult') out[k] = a;
  CLASSES[c].abilities = out;
}

// ---------- coast and fleet mobs ----------
Object.assign(MOBS, {
  pirate: { name: 'Redwake Corsair', kind: 'pirate0', hpM: 1, dmgM: 1.05, spd: 5.8, range: 2.2, weak: 'storm', resist: null, scale: 1, aggro: 12, social: 14, human: true, flee: true, drop: 'token' },
  redwake: { name: 'Captain Redwake', kind: 'captain', hpM: 1, dmgM: 1.2, spd: 5.8, range: 2.4, weak: 'storm', resist: null, scale: 1.15, aggro: 12, social: 14, human: true },
  smuggler: { name: 'Saltreach Smuggler', kind: 'smuggler', hpM: .95, dmgM: 1.1, spd: 6, range: 2.2, weak: 'frost', resist: null, scale: 1, aggro: 12, social: 14, human: true, drop: 'cipher' },
  crab: { name: 'Shore Crab', kind: 'crab', hpM: 1.15, dmgM: .9, spd: 5, range: 2.2, weak: 'storm', resist: 'fire', scale: 1, aggro: 7, social: 6, beast: true, drop: 'pearl' },
  crabbig: { name: 'Old Snapper', kind: 'crabbig', hpM: 1.4, dmgM: 1.3, spd: 5, range: 3.4, weak: 'storm', resist: 'fire', scale: 1.9, aggro: 9, social: 0, beast: true },
  shark: { name: 'Reef Shark', kind: 'shark', hpM: 1.1, dmgM: 1.25, spd: 7.5, range: 2.6, weak: 'storm', resist: 'frost', scale: 1, aggro: 14, social: 0, beast: true, aquatic: true, drop: 'fin' },
  merfolk: { name: 'Merrow Raider', kind: 'merfolk', hpM: 1, dmgM: 1.05, spd: 5.8, range: 2.6, weak: 'earth', resist: 'frost', scale: 1, aggro: 12, social: 14 },
  stormelem: { name: 'Wild Squall', kind: 'stormpet', hpM: .9, dmgM: 1, spd: 6, range: 18, ranged: true, caster: true, school: 'storm', weak: 'earth', resist: 'storm', scale: 1.6, aggro: 13, social: 10, fly: .5, drop: 'shard' },
  drowned: { name: 'Drowned Sailor', kind: 'drowned0', hpM: 1.05, dmgM: 1.05, spd: 5.4, range: 2.4, weak: 'fire', resist: 'frost', scale: 1, aggro: 11, social: 12, undead: true },
  drownedcaster: { name: 'Drowned Gunner', kind: 'drowned1', hpM: .9, dmgM: 1, spd: 5.2, range: 20, ranged: true, caster: true, school: 'frost', weak: 'storm', resist: 'frost', scale: 1, aggro: 12, social: 12, undead: true },
  drownedpriest: { name: 'Drowned Chaplain', kind: 'drowned2', hpM: .9, dmgM: .8, spd: 5.2, range: 20, ranged: true, caster: true, healer: true, school: 'shadow', weak: 'earth', resist: 'frost', scale: 1, aggro: 12, social: 12, undead: true },
  queen: { name: 'Mother Brine', kind: 'queen', hpM: 1, dmgM: 1.1, spd: 5.6, range: 2.6, weak: 'frost', resist: null, scale: 1.25, aggro: 14, social: 30, human: true },
  bosun: { name: 'Bosun Graft', kind: 'pirate2', hpM: 2.6, dmgM: 1.35, spd: 5.4, range: 3, weak: 'fire', resist: 'frost', scale: 1.45, aggro: 14, social: 30, undead: true },
  admiral: { name: 'Admiral Morrow Vane', kind: 'admiral', hpM: 1.15, dmgM: 1.3, spd: 5, range: 3, weak: 'fire', resist: 'frost', scale: 1.35, aggro: 16, social: 0, undead: true },
  leviathan: { name: 'The Leviathan of the Fleet', kind: 'leviathan', hpM: 1.25, dmgM: 1.1, spd: 0, range: 9, weak: 'storm', resist: 'frost', scale: 1, aggro: 40, social: 0 },
  rival: { name: 'Rival', kind: 'pirate0', hpM: 1.1, dmgM: 1.1, spd: 6, range: 2.6, weak: null, resist: null, scale: 1.05, aggro: 14, social: 0, human: true },
});

// ---------- armour sets, epics, special loot ----------
export const SETS = {
  admiralty: { name: 'Drowned Admiralty', bonus: { 2: { crit: 4 }, 4: { pow: 12, sta: 10 } }, desc: '2 pieces: +4% crit. 4 pieces: +12 power, +10 stamina.' },
};
export function setPiece(armorType, slot) {
  const nm = { head: { plate: 'Helm', leather: 'Tricorne', cloth: 'Cowl' }, chest: { plate: 'Cuirass', leather: 'Greatcoat', cloth: 'Vestments' }, legs: { plate: 'Greaves', leather: 'Breeches', cloth: 'Kilt' }, feet: { plate: 'Sabatons', leather: 'Seaboots', cloth: 'Slippers' } }[slot][armorType];
  const arm = (armorType === 'plate' ? 3 : armorType === 'leather' ? 2 : 1) * 18;
  return makeItem({ name: `Admiralty ${nm}`, slot, type: armorType, armorType, lvl: 20, rarity: 3, set: 'admiralty', stats: { sta: 16, pow: 12, arm, crit: slot === 'chest' ? 2 : 0 }, value: 160 });
}
const EPICS = { Fighter: 'Anchorbreaker', Healer: 'Tidesong', Rogue: "Leviathan's Fang", Mage: 'Abyssal Sceptre' };
export function epicFor(cls) {
  const fam = CLASSES[cls].family, t = WTYPE[cls][0];
  return makeItem({ name: EPICS[fam], slot: 'weapon', type: t, lvl: 20, rarity: 3, epic: true, stats: { pow: 52, sta: 20, crit: 5 }, value: 600 });
}
// named mobs of the coast and the fleet
Object.assign(NAMED_LOOT, {
  redwake: [{ name: "Redwake's Cutlass", slot: 'weapon', type: 'blade', lvl: 14, rarity: 2, stats: { pow: 28, sta: 10 }, value: 140 }, { name: 'Corsair Tricorne', slot: 'head', type: 'leather', armorType: 'leather', lvl: 14, rarity: 2, stats: { sta: 14, pow: 10, crit: 2, arm: 22 }, value: 120 },
    { name: 'Powder-Stained Gloves', slot: 'feet', type: 'cloth', armorType: 'cloth', lvl: 14, rarity: 2, stats: { sta: 10, pow: 14, arm: 10 }, value: 110 }],
  snapper: [{ name: 'Snapper-Shell Buckler', slot: 'off', type: 'shield', armorType: 'plate', lvl: 14, rarity: 2, stats: { sta: 18, arm: 50 }, value: 130 }, { name: 'Pearl of the Old Crab', slot: 'off', type: 'orb', lvl: 14, rarity: 2, stats: { pow: 16, sta: 8 }, value: 130 }],
  tidecaller: [{ name: 'Stormglass Rod', slot: 'weapon', type: 'wand', lvl: 17, rarity: 2, stats: { pow: 34, sta: 10, crit: 3 }, value: 180 }, { name: 'Squall-Woven Robe', slot: 'chest', type: 'cloth', armorType: 'cloth', lvl: 17, rarity: 2, stats: { sta: 18, pow: 20, arm: 16 }, value: 170 },
    { name: 'Lightning-Rod Greaves', slot: 'legs', type: 'plate', armorType: 'plate', lvl: 17, rarity: 2, stats: { sta: 22, pow: 8, arm: 60 }, value: 170 }],
  queen: [{ name: "Brine's Stiletto", slot: 'weapon', type: 'dagger', lvl: 17, rarity: 3, stats: { pow: 36, sta: 12, crit: 4 }, value: 240 }, { name: "Smuggler Queen's Coat", slot: 'chest', type: 'leather', armorType: 'leather', lvl: 17, rarity: 3, stats: { sta: 22, pow: 18, crit: 3, arm: 34 }, value: 230 },
    { name: 'Cave-Pearl Circlet', slot: 'head', type: 'cloth', armorType: 'cloth', lvl: 17, rarity: 3, stats: { sta: 16, pow: 22, arm: 14 }, value: 220 }, { name: 'Tidewall Greatsword', slot: 'weapon', type: 'greatsword', lvl: 17, rarity: 3, stats: { pow: 38, sta: 16 }, value: 240 }],
});
export function specialLoot(named, party) {
  const armorOf = () => { const p = party[(Math.random() * party.length) | 0]; return CLASSES[p.cls].armor; };
  const slot = () => ['head', 'chest', 'legs', 'feet'][(Math.random() * 4) | 0];
  if (named === 'bosun') return [setPiece(armorOf(), slot())];
  if (named === 'admiral') return [setPiece(armorOf(), slot()), setPiece(armorOf(), slot())];
  if (named === 'leviathan') { const p = party[(Math.random() * party.length) | 0]; return [epicFor(p.cls), setPiece(armorOf(), slot()), setPiece(armorOf(), slot())]; }
  return null;
}

// ---------- fishing ----------
export const FISH = [
  { name: 'Silverfin', w: 40, value: 2 }, { name: 'Saltreach Cod', w: 30, value: 3 }, { name: 'Spotted Eel', w: 14, value: 5 }, { name: 'Old Boot', w: 8, value: 0 },
  { name: 'Glimmerfish', w: 6, value: 12, note: 'It glows faintly.' }, { name: 'Drowned Locket', w: 2, value: 25 }, { name: 'Black Pearl', w: 1, value: 60 },
];
POTIONS.pole = { name: 'Fishing Pole', icon: '🎣', price: 6, desc: 'Stand at the water’s edge and tap Fish. Tap Reel when the bobber dips.', once: true };

// ---------- coast quest givers and quests ----------
Object.assign(GIVERS, {
  quell: { name: 'Harbormaster Quell', title: 'Saltmarrow Free Port', model: 'pirate1' },
  tessaly: { name: 'Madame Tessaly', title: 'Fence and Informant', model: 'smuggler' },
  steward: { name: 'Guild Steward Orne', title: 'Class quests', model: 'guard' },
  ashby: { name: 'Commodore Ashby', title: 'Fort Halyard', model: 'guard' },
  wenna: { name: 'Old Wenna', title: 'Gullwick', model: 'priest' },
});
QUESTS.push(
  { id: 'c1', giver: 'quell', lvl: 11, name: 'Crabs on the Quay', text: 'Shore crabs are into the fish barrels again. Ten of them. Bring a stick.', obj: { kill: ['crab'], n: 10 }, xp: 3200, gold: 30 },
  { id: 'c2', giver: 'quell', lvl: 12, name: 'Rival Crews', text: 'Redwake’s corsairs camp up and down the shore and tax anyone who lands. Free port means free. Remind them.', obj: { kill: ['pirate', 'smuggler'], n: 12 }, xp: 4200, gold: 40, pre: 'c1' },
  { id: 'c3', giver: 'quell', lvl: 14, name: "Redwake's Bounty", text: 'Captain Redwake only shows when his crew is thin. Camp the north camp. Bring me his hat.', obj: { named: 'redwake', n: 1 }, xp: 6000, gold: 70, pre: 'c2', gear: true },
  { id: 'c4', giver: 'tessaly', lvl: 15, name: 'Contraband', text: 'The smugglers on the Rock carry sealed crates. I want six. What’s in them is my business.', obj: { collect: ['smuggler'], item: 'Sealed Crate', chance: .5, n: 6 }, xp: 6500, gold: 60 },
  { id: 'c5', giver: 'tessaly', lvl: 16, name: 'The Smuggler Queen', text: 'Mother Brine runs the sea caves and owes me a great deal of money. She won’t pay. Take a group.', obj: { named: 'queen', n: 1 }, xp: 9000, gold: 90, pre: 'c4', gear: true },
  { id: 'c6', giver: 'ashby', lvl: 13, name: 'Merrow Raiders', text: 'Merrow raiders come up the beaches at every tide. Drive them back into the sea.', obj: { kill: ['merfolk'], n: 10 }, xp: 5000, gold: 45 },
  { id: 'c7', giver: 'ashby', lvl: 15, name: 'Storm on the Cliffs', text: 'Wild squalls, unbound since the wars, wreck our signal towers. Disperse eight.', obj: { kill: ['stormelem'], n: 8 }, xp: 6500, gold: 55, pre: 'c6' },
  { id: 'c8', giver: 'ashby', lvl: 17, name: 'The Tidecaller', text: 'One squall has grown old and clever on the peak of Smuggler’s Rock. It calls the storms. End it.', obj: { named: 'tidecaller', n: 1 }, xp: 10000, gold: 90, pre: 'c7', gear: true },
  { id: 'c9', giver: 'wenna', lvl: 12, name: 'They Come Out of the Sea', text: 'The drowned crawl up our beach at night. My husband’s among them, I think. Put them to rest.', obj: { kill: ['drowned', 'drownedcaster'], n: 10 }, xp: 4500, gold: 35 },
  { id: 'c10', giver: 'wenna', lvl: 14, name: 'Old Snapper', text: 'There’s a crab on the south beach older than me. He took two of our boats. Bring me his claw.', obj: { named: 'snapper', n: 1 }, xp: 6000, gold: 60, pre: 'c9', gear: true },
  { id: 'c11', giver: 'wenna', lvl: 15, name: 'Shark Fin Soup', text: 'Five fins from the reef sharks, and I’ll feed the whole village. Mind your breath out there.', obj: { collect: ['shark'], item: 'Shark Fin', chance: .6, n: 5 }, xp: 6500, gold: 50 },
  { id: 'c12', giver: 'ashby', lvl: 18, name: 'The Fleet Below', text: 'The reef north-east of here is where the necromancer fleet went down. The drowned there are armed. Clear twelve.', obj: { kill: ['drowned', 'drownedcaster'], n: 12, zone: 'coast', reef: true }, xp: 12000, gold: 100, pre: 'c8' },
  { id: 'c13', giver: 'ashby', lvl: 19, name: 'The Drowned Admiral', text: 'Admiral Morrow Vane drowned with his fleet and did not stay dead. He holds the seabed in a bubble of dark water. Dive at the buoy with six. Hard.', obj: { named: 'admiral', n: 1 }, xp: 16000, gold: 150, pre: 'c12' },
  { id: 'c14', giver: 'ashby', lvl: 20, name: 'What Sleeps Beneath', text: 'When the admiral fell, something answered him from the deep. The Fourfold Law has no clause for that. Kill it.', obj: { named: 'leviathan', n: 1 }, xp: 20000, gold: 250, pre: 'c13', gear: true },
);
// class quests: one chain per class from the guild steward
const REAGENT = { Fighter: ['Duelist Token', ['pirate', 'smuggler']], Healer: ['Tidepool Pearl', ['crab', 'crabbig']], Rogue: ["Smuggler's Cipher", ['smuggler']], Mage: ['Storm Shard', ['stormelem']] };
export const SIGNATURE = { bulwark: 'Harborwall Maul', wardancer: 'Twin Gulls', bladewarden: 'Tidecleaver', monk: 'Wavebreaker Wraps', cleric: 'Lighthouse Staff', aegis: 'Ward of the Deep', lifebinder: 'Kelpheart Staff', druid: 'Tidegrove Staff',
  longwatch: 'Gullwing Longbow', knifeshade: 'Saltknife', blightblade: 'Stonefish Kris', bard: 'Siren’s Rapier', elementalist: 'Stormglass Staff', warlock: 'Drowned Grimoire-Staff', binder: 'Fourfold Seal-Rod', illusionist: 'Mirage Wand' };
for (const c in CLASSES) {
  const C = CLASSES[c], [item, mobs] = REAGENT[C.family];
  QUESTS.push({ id: 'cq1_' + c, giver: 'steward', cls: c, lvl: 12, name: `${C.name}: Proving`, text: `Every ${C.name} who earns a signature weapon starts the same way: bring me six ${item}s, taken from the coast with your own hands.`, obj: { collect: mobs, item, chance: .45, n: 6 }, xp: 5000, gold: 30 });
  QUESTS.push({ id: 'cq2_' + c, giver: 'steward', cls: c, lvl: 15, name: `${C.name}: The Rival`, text: `A rogue ${C.name} has set up on the beach below Smuggler's Rock, selling our secrets to pirates. Beat them in a fair fight. Or any fight.`, obj: { named: 'rival_' + c, n: 1 }, xp: 9000, gold: 60, pre: 'cq1_' + c, rival: c, signature: c });
}
