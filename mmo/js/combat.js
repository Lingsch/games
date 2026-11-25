// Entities, stats, tab-target combat, threat, buffs, casting, death, experience and loot.
import { S, clamp, dist, angTo, rnd, pick, chat, floatText, nextId } from './core.js';
import { CLASSES, MOBS, GCD, mobHp, mobDmg, mobXp, xpNeed, MAX_LVL, SCHOOL_COL, randomGear, NAMED_LOOT, makeItem, QUESTS, CHAT, RES, startRes, PETS, roleOf, rankOf, specialLoot } from './data.js';
import { hgt, blocked, world } from './world.js';
import * as R from './render.js';

// ---------- entities ----------
export function makeEnt(o) {
  const e = {
    id: nextId(), name: '?', team: 'enemy', lvl: 1, x: 0, z: 0, y: 0, yaw: 0, spd: 6, r: .5,
    hp: 1, maxHp: 1, res: 0, resMax: 0, resType: null, power: 10, armor: 0, crit: .05,
    dead: false, deadT: 0, target: null, casting: null, gcdT: 0, cds: {}, buffs: [], swingT: 0, autoOn: false,
    threat: new Map(), combatT: -99, lastCast: -99, ult: 0, still: 0, moving: 0, sit: false,
    anim: { ph: Math.random() * 6, mv: 0, atk: 0, flash: 0 }, scale: 1, gearPow: 0, gearSta: 0, gearArm: 0, gearCrit: 0,
    ...o,
  };
  e.y = hgt(e.x, e.z);
  S.ents.push(e);
  return e;
}
// a player-class body: the hero, a companion or a fake player
export function makeHuman(cls, lvl, o = {}) {
  const C = CLASSES[cls];
  const e = makeEnt({ team: 'ally', cls, lvl, resType: C.res, spd: 7, kind: C.models[o.pal || 0], ...o });
  recalc(e); e.hp = e.maxHp; e.res = startRes(e);
  return e;
}
export const XP_RATE = .75;          // Build 4.4: every source of xp gives three quarters of what it did
export function makeMob(key, lvl, o = {}) {
  const M = MOBS[key];
  const e = makeEnt({ team: 'enemy', mob: key, lvl, kind: M.kind, spd: M.spd, name: M.name, scale: M.scale, r: .5 * M.scale, ...o });
  recalc(e); e.hp = e.maxHp;
  return e;
}
export const buffSum = (e, k) => { let s = 0; for (const b of e.buffs) if (b.data[k]) s += b.data[k]; return s; };
export const hasBuff = (e, id) => e.buffs.some(b => b.id === id);
const NOACCT = {};
export function recalc(e) {
  if (e.cls) {
    const C = CLASSES[e.cls], L = e.lvl;
    const frac = e.maxHp > 0 ? e.hp / e.maxHp : 1;
    // the hero's account-wide bonuses and slotted perks (Build 4)
    const A = e.acct || NOACCT;
    e.maxHp = Math.round((C.hp[0] + C.hp[1] * L + (e.gearSta + (A.sta || 0)) * 8) * (1 + buffSum(e, 'hp') + (A.hpP || 0)));
    if (!e.dead) e.hp = Math.min(e.maxHp, Math.max(1, Math.round(frac * e.maxHp)));
    e.power = (C.pow[0] + C.pow[1] * L + e.gearPow + (A.pow || 0)) * (1 + buffSum(e, 'pow') + (A.powP || 0));
    e.armor = (e.gearArm + L * 3) * (1 + buffSum(e, 'armor') + (A.armorP || 0));
    e.crit = .05 + e.gearCrit / 100 + buffSum(e, 'crit') + (A.crit || 0);
    e.dodge = .03 + (C.dodge ? C.dodge + L * .006 : 0) + buffSum(e, 'dodge') + (A.dodge || 0);
    e.parry = (C.parry ? C.parry + L * .006 : 0) + buffSum(e, 'parry') + (A.parry || 0);
    if (C.res === 'mana') { const mf = e.resMax > 0 ? e.res / e.resMax : 1; e.resMax = Math.round((C.mana[0] + C.mana[1] * L) * (1 + buffSum(e, 'mana'))); e.res = Math.min(e.resMax, mf * e.resMax); }
    else e.resMax = 100;
  } else if (e.mob) {
    const M = MOBS[e.mob], L = e.lvl;
    let hpM = M.hpM * (e.elite ? 3.5 : 1) * (e.named && !e.boss ? (e.boss2 ? 14 : 5) : 1) * (e.boss ? 80 : 1);
    e.maxHp = Math.round(mobHp(L) * hpM);
    e.power = mobDmg(L) * M.dmgM * (e.elite ? 1.35 : 1) * (e.named ? 1.5 : 1) * (e.boss ? 1.6 : 1) * (1 + buffSum(e, 'pow'));
    e.armor = L * 5; e.crit = .05; e.dodge = .03; e.parry = 0;
    if (e.pet && e.charmed) e.power *= 1.1;
  } else if (e.pet) recalcPet(e);
}
// a summoned pet's stats follow its owner's level and gear
export function recalcPet(e) {
  const o = e.pet.owner, L = o.lvl, D = PETS[e.pet.key];
  if (!D) { e.maxHp = Math.max(e.maxHp, 1); return; }
  const frac = e.maxHp > 0 ? e.hp / e.maxHp : 1;
  e.lvl = L;
  e.maxHp = Math.round((40 + 22 * L) * D.hpM * (hasBuff(o, 'seal') ? 1.2 : 1));
  e.hp = Math.min(e.maxHp, Math.max(1, Math.round(frac * e.maxHp)));
  e.power = (8 + 3.6 * L + (o.gearPow || 0) * .5) * D.powM * (1 + buffSum(e, 'pow'));
  e.armor = L * (D.role === 'tank' ? 12 : 4); e.crit = .05; e.dodge = .03; e.parry = 0;
}
export const isEnemy = (a, b) => a && b && a.team !== 'npc' && b.team !== 'npc' && ((a.team === 'enemy') !== (b.team === 'enemy'));
export const alive = e => e && !e.dead;
export const inCombat = e => S.time - e.combatT < 6;
export const d = (a, b) => dist(a, b);
// Rank II spells hit 35% harder: the multiplier is set while a spell's effect runs
let curRank = 1;
export const pw = e => e.power * curRank;
export const ownerOf = e => e && e.pet ? e.pet.owner : e;
export function partyOf(e) {
  if (e.pet) return partyOf(e.pet.owner);
  if (e.inParty) return S.party;
  if (e.fake && e.fake.group) return e.fake.group;
  return [e];
}
export function enemiesNear(u, c, r) { const out = []; for (const e of S.ents) if (!e.dead && !e.remove && isEnemy(u, e) && dist(e, c) <= r + e.r && !e.evading) out.push(e); return out; }
export const weakOf = t => t.mob ? MOBS[t.mob].weak : null;
export const conColor = (L, mob) => { const dL = mob - L; return dL >= 3 ? '#ff4a3a' : dL >= 1 ? '#ffd34d' : dL === 0 ? '#ffffff' : dL >= -2 ? '#4fa0ff' : dL >= -3 ? '#5fd35a' : '#9a9a9a'; };

// ---------- threat ----------
export function addThreat(mob, src, amt) {
  if (!mob.mob || mob.dead || mob.evading) return;
  const k = roleOf(src) === 'tank' ? (src.pet ? 2.6 : 2.2) : 1;
  mob.threat.set(src, (mob.threat.get(src) || 0) + amt * k * (1 + buffSum(src, 'threat') + (src.acct?.threatP || 0)));
  mob.combatT = S.time; src.combatT = S.time;
  const own = ownerOf(src);
  if (!mob.tagged) mob.tagged = own.inParty ? 'party' : own.fake?.group ? own.fake.group : own;
  if (!mob.engaged) engage(mob, src);
}
// a mob that enters combat calls the rest of its camp
function engage(mob, src) {
  mob.engaged = true;
  const M = MOBS[mob.mob];
  if (mob.camp && M.social) for (const o of S.ents) if (o !== mob && !o.dead && o.camp === mob.camp && !o.engaged && dist(o, mob) < M.social + 10) { o.threat.set(src, 1); o.combatT = S.time; o.engaged = true; }
}
export function topThreat(mob) {
  let best = null, bv = -1;
  for (const [e, v] of mob.threat) { if (e.dead || e.remove || (e.feignT || 0) > S.time || e.team === mob.team) { mob.threat.delete(e); continue; } if (v > bv) { bv = v; best = e; } }
  return best;
}
export function taunt(u, t) {
  if (!t.mob || t.dead) return;
  let top = 0; for (const v of t.threat.values()) top = Math.max(top, v);
  t.threat.set(u, top * 1.1 + 20); t.forced = u; t.forcedT = 3; t.combatT = S.time; u.combatT = S.time;
  if (!t.engaged) engage(t, u);
  if (u.isHero) floatText(t, 'Taunted', '#ffd34d');
}
export function dropThreat(u, frac) { for (const e of S.ents) if (e.mob && e.threat.has(u)) e.threat.set(u, e.threat.get(u) * (1 - frac)); if (u.isHero) floatText(u, 'Threat reduced', '#bfe6ff'); }

// ---------- resources and the ultimate meter ----------
export function gain(u, n) { u.res = clamp(u.res + n, 0, u.resMax); }
function ultCharge(u, n) { if (u.cls) u.ult = Math.min(100, u.ult + n); }

// ---------- damage and healing ----------
export function damage(src, tgt, amt, school = 'phys', opts = {}) {
  if (!tgt || tgt.dead || tgt.evading || tgt.immune) return 0;
  let crit = false, mult = 1;
  const M = tgt.mob ? MOBS[tgt.mob] : null;
  if (M) {
    if (school === M.weak) mult *= 1.5;
    else if (school === M.resist) mult *= .5;
    if (school === 'holy' && M.undead) mult *= 1.3;
  }
  // a Longwatch standing still crits more; Deadeye guarantees it
  let cc = src.crit + (opts.crit || 0) + (src.cls === 'longwatch' && src.still > 1 ? .15 : 0);
  if (opts.sureCrit) cc = 1;
  if (Math.random() < cc) { crit = true; mult *= 1.75; }
  if (!opts.noMiss && Math.random() < .04) { if (src.isHero || tgt.isHero) floatText(tgt, 'Miss', '#cfcfcf'); return 0; }
  // dodge and parry turn aside physical blows from monsters
  if (school === 'phys' && !opts.noMiss && src.mob && !src.charmed && tgt.dodge !== undefined) {
    if (Math.random() < Math.min(.95, tgt.dodge || 0)) {
      if (src.isHero || tgt.isHero) floatText(tgt, 'Dodge', '#cfe8ff');
      if (tgt.resType === 'momentum') gain(tgt, 20);
      addThreat(src, tgt, 10 + tgt.power * .4); ultCharge(tgt, 3); tgt.combatT = S.time;
      return 0;
    }
    if (Math.random() < Math.min(.9, tgt.parry || 0)) {
      if (src.isHero || tgt.isHero) floatText(tgt, 'Parry', '#cfe8ff');
      if (tgt.resType === 'rage') gain(tgt, 12);
      const ch = Math.min(5, chainOf(tgt) + 1); buff(tgt, 'chain', 10, { stacks: ch }, tgt);
      const k = hasBuff(tgt, 'thousand') ? 2 : 1;
      for (let i = 0; i < k; i++) damage(tgt, src, tgt.power * .5 * (1 + ch * .08), 'phys', { threat: 2, noMiss: true, riposte: true });
      if (k > 1) heal(tgt, tgt, tgt.maxHp * .03);
      ultCharge(tgt, 3); tgt.combatT = S.time;
      return 0;
    }
  }
  // level matters: higher-level enemies hit much harder, and shrug off more of what you throw at them
  if (src.mob && !src.charmed && tgt.cls) { const dL = src.lvl - tgt.lvl; mult *= dL > 0 ? 1 + .18 * dL : Math.max(.55, 1 + .09 * dL); }
  if (tgt.mob && (src.cls || src.pet)) { const dL = tgt.lvl - (src.lvl || 1); if (dL > 0) { mult *= Math.max(.45, 1 - .08 * dL); if (!opts.noMiss && Math.random() < .05 * dL) { if (src.isHero) floatText(tgt, 'Miss', '#cfcfcf'); return 0; } } }
  for (const b of tgt.buffs) if (b.data.vuln) mult *= 1 + b.data.vuln;
  amt *= mult * rnd(.92, 1.08);
  if (school === 'phys') amt *= 1 - tgt.armor / (tgt.armor + 60 + tgt.lvl * 14);
  if (tgt.cls) amt *= 1 - (CLASSES[tgt.cls].armorPct || 0);
  for (const b of tgt.buffs) if (b.data.dr) amt *= 1 - b.data.dr;
  amt = Math.max(1, Math.round(amt));
  // absorbing shields take it first
  for (const b of tgt.buffs) if (b.data.absorb > 0) { const a = Math.min(b.data.absorb, amt); b.data.absorb -= a; amt -= a; if (b.data.absorb <= 0) b.t = 0; if (!amt) { if (src.isHero || tgt.isHero) floatText(tgt, 'Absorbed', '#bfe6ff'); return 0; } }
  tgt.hp -= amt; tgt.combatT = S.time; src.combatT = S.time;
  if (tgt.hp < tgt.maxHp * .1 && tgt.buffs.length) { const g = tgt.buffs.find(b => b.data.floor); if (g) { tgt.hp = Math.max(tgt.hp, tgt.maxHp * g.data.floor); if (tgt.isHero || src.isHero) floatText(tgt, 'Guarded', '#fff2a0'); } }
  if (tgt.buffs.length) {
    // any damage wakes the mesmerized
    if (tgt.buffs.some(b => b.data.mez)) { tgt.buffs = tgt.buffs.filter(b => !b.data.mez); if (src.isHero || tgt.isHero || tgt === S.target) floatText(tgt, 'Awake', '#e0b0ff'); }
    const th = tgt.buffs.find(b => b.data.thorns);
    if (th && src.mob && school === 'phys' && !opts.reflect && !src.dead) damage(th.src || tgt, src, th.data.thorns, 'nature', { reflect: true, noMiss: true });
  }
  tgt.anim.flash = 1;
  if (tgt.sit) tgt.sit = false;
  if (tgt.casting && tgt.cls && Math.random() < .25) tgt.casting.t -= .35; // pushback
  if (tgt.mob && !tgt.charmed) addThreat(tgt, src, amt * (opts.threat || 1));
  else if (src.mob && !src.charmed && !src.threat.has(tgt)) src.threat.set(tgt, 1);
  if (tgt.resType === 'rage') gain(tgt, amt / tgt.maxHp * 140);
  ultCharge(src, amt / Math.max(40, tgt.maxHp) * 18 + 1); ultCharge(tgt, amt / tgt.maxHp * 30);
  const col = src.isHero ? SCHOOL_COL[school] || '#fff' : tgt.isHero ? '#ff6a5a' : null;
  if (col) floatText(tgt, (crit ? amt + '!' : '' + amt), col, crit);
  if (ownerOf(src).inParty) { const o = ownerOf(src); S.meter[o.id] = (S.meter[o.id] || 0) + amt; }
  if (M && M.yields && tgt.hp < tgt.maxHp * .18 && hooks.onYield && hooks.onYield(tgt, src)) { tgt.hp = Math.max(1, tgt.hp); return amt; }
  if (tgt.hp <= 0) kill(tgt, src);
  return amt;
}
export function heal(src, tgt, amt, quiet = false) {
  if (!tgt || tgt.dead) return 0;
  let crit = !quiet && Math.random() < src.crit;
  amt = Math.round(amt * (crit ? 1.5 : 1) * rnd(.95, 1.05) * (1 + (src.acct?.healP || 0) + (tgt.acct?.healIn || 0)));
  const real = Math.min(amt, tgt.maxHp - tgt.hp);
  tgt.hp += real;
  if ((src.isHero || tgt.isHero) && (!quiet || src.isHero) && amt > 0) floatText(tgt, '+' + amt, '#7dff7a', crit);
  ultCharge(src, real / Math.max(40, tgt.maxHp) * 22);
  // healing makes every mob fighting the healed one angry at the healer
  if (real > 0) {
    const mobs = S.ents.filter(e => e.mob && !e.dead && e.engaged && (e.threat.has(tgt) || e.target === tgt));
    for (const m of mobs) addThreat(m, src, real * .5 / mobs.length);
    if (mobs.length) src.combatT = S.time;
  }
  return real;
}
export function revive(t, frac) {
  t.dead = false; t.hp = Math.round(t.maxHp * frac); t.res = RES[t.resType]?.kind === 'build' ? 0 : t.resMax * frac; t.buffs = []; t.casting = null; recalc(t);
  floatText(t, 'Resurrected', '#fff2a0', true);
  if (t.isHero) { S.dead = false; S.corpse = null; S.ui.deathShown = false; chat('sys', null, 'You have been resurrected.'); }
}

// ---------- buffs ----------
export function buff(t, id, dur, data = {}, src = null) {
  const old = t.buffs.find(b => b.id === id);
  if (old) { old.t = dur; old.dur = dur; old.data = { ...data }; old.src = src; }
  else t.buffs.push({ id, t: dur, dur, data: { ...data }, src });
  if (data.pow || data.hp || data.armor || data.crit || data.mana) recalc(t);
}
export function partyBuff(u, id, dur, data) { for (const p of partyOf(u)) if (!p.dead && dist(u, p) < 40) buff(p, id, dur, data, u); }
export function updateBuffs(e, dt) {
  let changed = false;
  for (const b of e.buffs) {
    b.t -= dt;
    if ((b.data.dot || b.data.hot || b.data.rest) && !e.dead) {
      b.acc = (b.acc || 0) + dt;
      if (b.acc >= 1) {
        b.acc -= 1;
        if (b.data.dot && b.src && !b.src.remove) damage(b.src, e, b.data.dot, b.data.school || 'poison', { noMiss: true });
        if (b.data.hot) heal(b.src || e, e, b.data.hot * (b.src && hasBuff(b.src, 'treeoflife') ? 2 : 1), true);
        if (b.data.rest) { if (e.hp < e.maxHp) e.hp = Math.min(e.maxHp, e.hp + e.maxHp * .012); if (e.resType === 'mana') e.res = Math.min(e.resMax, e.res + e.resMax * .008); }
      }
    }
  }
  for (const b of e.buffs) if (b.t <= 0 && b.data.bloom && !e.dead) { heal(b.src || e, e, b.data.bloom); R.burst(e.x, e.y + 1.2, e.z, 16, [1, .6, .8], 2, .6, .5); }
  const n = e.buffs.length; e.buffs = e.buffs.filter(b => b.t > 0); if (e.buffs.length !== n) changed = true;
  if (changed) recalc(e);
}
export const slowOf = e => { let s = 0; for (const b of e.buffs) if (b.data.slow) s = Math.max(s, b.data.slow); return s; };
export const spdOf = e => (1 - slowOf(e)) * (1 + buffSum(e, 'spd') + (e.acct?.spdP || 0));
export const chainOf = e => e.buffs.find(b => b.id === 'chain')?.data.stacks || 0;
export const ccd = e => e.buffs.some(b => b.data.mez || b.data.stun);
export const rooted = e => e.buffs.some(b => b.data.root);

// ---------- projectiles ----------
export const projectiles = [];
export function shoot(u, t, amt, opts = {}) {
  if (hasBuff(u, 'moon')) opts = { ...opts, sureCrit: true };
  projectiles.push({ kind: 'arrow', src: u, tgt: t, x: u.x, y: u.y + 1.3, z: u.z, amt, school: 'phys', opts, spd: 45 });
}
export function bolt(u, t, amt, school, opts = {}) {
  projectiles.push({ kind: 'bolt', src: u, tgt: t, x: u.x, y: u.y + 1.6, z: u.z, amt, school, opts, spd: 30 });
}
export function chain(u, t, amt, school, n) {
  const hit = [t]; let cur = t;
  bolt(u, t, amt, school);
  for (let i = 1; i < n; i++) {
    const nx = enemiesNear(u, cur, 10).filter(e => !hit.includes(e)).sort((a, b) => dist(a, cur) - dist(b, cur))[0];
    if (!nx) break; hit.push(nx);
    projectiles.push({ kind: 'bolt', src: u, tgt: nx, x: cur.x, y: cur.y + 1.2, z: cur.z, amt: amt * .75, school, opts: {}, spd: 40 });
    cur = nx;
  }
}
const SC = { fire: [1, .5, .15], frost: [.6, .9, 1], storm: [.85, .8, 1], earth: [.85, .65, .4], holy: [1, .95, .6], shadow: [.7, .4, 1], phys: [1, 1, 1], poison: [.6, 1, .4] };
export function updateProjectiles(dt) {
  for (let i = projectiles.length - 1; i >= 0; i--) {
    const p = projectiles[i], t = p.tgt;
    if (!t || t.dead) { projectiles.splice(i, 1); continue; }
    const tx = t.x, ty = t.y + 1.1 * (t.scale || 1), tz = t.z, dx = tx - p.x, dy = ty - p.y, dz = tz - p.z, l = Math.hypot(dx, dy, dz), st = p.spd * dt;
    if (l <= st) {
      const dealt = damage(p.src, t, p.amt, p.school, p.opts);
      if (p.opts.slow && dealt) buff(t, 'slow', 5, { slow: p.opts.slow }, p.src);
      if (p.kind === 'bolt') R.burst(tx, ty, tz, 10, SC[p.school] || SC.phys, 2.5, .5, .5);
      projectiles.splice(i, 1); continue;
    }
    p.x += dx / l * st; p.y += dy / l * st; p.z += dz / l * st; p.dx = dx / l; p.dy = dy / l; p.dz = dz / l;
    if (p.kind === 'bolt') { const c = SC[p.school] || SC.phys; R.magic.emit(p.x, p.y, p.z, 0, 0, 0, .3, .7, c[0], c[1], c[2]); }
  }
}
export function fxRing(c, r, col) { for (let i = 0; i < 40; i++) { const a = i / 40 * Math.PI * 2; R.magic.emit(c.x + Math.cos(a) * r, c.y + .4, c.z + Math.sin(a) * r, 0, 1.2, 0, .7, .7, col[0], col[1], col[2]); } }
export function leap(u, d) {
  const a = u.target ? angTo(u, u.target) : u.yaw;
  u.x += Math.sin(a) * d; u.z += Math.cos(a) * d; u.y = hgt(u.x, u.z); R.burst(u.x, u.y + .3, u.z, 14, [.8, .75, .6], 2, .5, .5);
}
// ---------- the new classes' tools ----------
const IMMUNE = t => t.boss || t.named || !t.mob;
export function hot(u, t, id, total, dur) { buff(t, id, dur, { hot: total / dur }, u); }
export function dot(u, t, id, perSec, dur, school) { buff(t, id + ':' + u.id, dur, { dot: perSec, school }, u); }
export function poison(u, t, n) {
  if (!t || t.dead) return;
  if (hasBuff(u, 'lethal')) n *= 2;
  const id = 'poison:' + u.id, b = t.buffs.find(x => x.id === id), st = Math.min(5, (b?.data.stacks || 0) + n);
  buff(t, id, 12, { dot: (u.power * .09 + 1) * st, school: 'poison', stacks: st }, u);
}
export const poisonStacks = (t, u) => t.buffs.find(x => x.id === 'poison:' + u.id)?.data.stacks || 0;
export function clearPoison(t, u) { t.buffs = t.buffs.filter(x => x.id !== 'poison:' + u.id); }
export function ward(u, t, amt, dur, ignoreLock) {
  if (!t || t.dead) return;
  if (!ignoreLock && hasBuff(t, 'wardlock')) { if (u.isHero) floatText(t, 'Ward not ready', '#bfe6ff'); return; }
  buff(t, 'ward', dur, { absorb: amt }, u); if (!ignoreLock) buff(t, 'wardlock', 6, {}, u);
  R.burst(t.x, t.y + 1.2, t.z, 14, [.6, .85, 1], 1.5, .6, .5);
}
export function interrupt(t) { if (t.mcast) { t.mcast = null; floatText(t, 'Interrupted', '#ffd34d'); } if (t.casting) t.casting = null; }
export function stun(u, t, dur) { if (IMMUNE(t)) { floatText(t, 'Immune', '#cfcfcf'); return; } buff(t, 'stun', dur, { stun: 1 }, u); t.mcast = null; addThreat(t, u, 5); }
export function mez(u, t, dur) {
  if (IMMUNE(t)) { floatText(t, 'Immune', '#cfcfcf'); return; }
  buff(t, 'mez', dur, { mez: 1 }, u); t.mcast = null; addThreat(t, u, 8);
  if (u.isHero || t === S.target) floatText(t, 'Mesmerized', '#e0b0ff');
}
export function fear(u, t, dur) { if (IMMUNE(t)) { floatText(t, 'Immune', '#cfcfcf'); return; } addThreat(t, u, 5); t.fleeT = dur; t.target = u; floatText(t, 'Terrified', '#c08aff'); }
export const petsOf = u => S.ents.filter(e => e.pet && e.pet.owner === u && !e.dead && !e.remove && PETS[e.pet.key]);
export function summon(u, key, dur = 0) {
  const D = PETS[key];
  if (key !== 'treant') { const mine = petsOf(u).filter(p => p.pet.key !== 'treant'); if (mine.length >= 4) { const old = mine[0]; old.dead = true; old.remove = true; } }
  const a = u.yaw + Math.PI + (Math.random() - .5) * 2;
  const e = makeEnt({ team: u.team, name: (u.isHero ? '' : u.name + "'s ") + D.name, kind: D.kind, x: u.x + Math.sin(a) * 2, z: u.z + Math.cos(a) * 2, spd: D.spd, r: D.r, scale: D.scale || 1,
    pet: { owner: u, key, role: D.role, ranged: D.ranged, school: D.school, until: dur ? S.time + dur : 0 } });
  recalcPet(e); e.hp = e.maxHp;
  R.burst(e.x, e.y + 1, e.z, 24, key === 'firepet' ? [1, .5, .2] : key === 'waterpet' ? [.4, .7, 1] : key === 'stormpet' ? [.85, .8, 1] : [.7, .9, .5], 2.5, .8, .6);
  return e;
}
export function charm(u, t, dur) {
  if (IMMUNE(t) || t.lvl > u.lvl) { floatText(t, t.lvl > u.lvl ? 'Too strong' : 'Immune', '#cfcfcf'); return; }
  if (Math.random() < .12) { floatText(t, 'Resisted', '#cfcfcf'); addThreat(t, u, 30); return; }
  for (const m of S.ents) if (m.mob) m.threat.delete(t);
  t.threat.clear(); t.engaged = false; t.mcast = null; t.buffs = t.buffs.filter(b => !b.data.mez && !b.data.stun);
  t.team = u.team; t.charmed = { owner: u, until: S.time + dur };
  t.pet = { owner: u, role: 'dps', ranged: MOBS[t.mob].ranged, charm: true };
  floatText(t, 'Charmed', '#ff9ae6', true); R.burst(t.x, t.y + 1.2, t.z, 24, [1, .6, .9], 2, .8, .6);
  if (u.isHero) chat('sys', null, `${t.name} is charmed for ${dur} seconds.`);
}
export function endCharm(t) {
  const u = t.charmed.owner; t.charmed = null; t.pet = null; t.team = 'enemy'; t.tagged = null;
  floatText(t, 'Charm broke!', '#ff6a5a', true);
  if (!u.dead) addThreat(t, u, 60);
  if (u.isHero) chat('sys', null, `${t.name} breaks free of your charm!`);
}
export function mirror(u) {
  const imgs = [];
  for (let i = 0; i < 2; i++) {
    const a = u.yaw + (i ? 1.2 : -1.2);
    const e = makeEnt({ team: u.team, name: u.name, kind: u.kind, x: u.x + Math.sin(a) * 2.5, z: u.z + Math.cos(a) * 2.5, spd: u.spd, r: .5, pet: { owner: u, key: 'mirror', role: 'decoy', until: S.time + 12 } });
    e.maxHp = e.hp = Math.round(u.maxHp * .35); e.armor = 0; e.dodge = .3; e.power = 0; imgs.push(e);
  }
  for (const m of S.ents) if (m.mob && !m.dead && m.threat.has(u)) { const top = Math.max(...m.threat.values()); m.threat.set(imgs[m.id % 2], top * 1.2 + 10); }
  R.burst(u.x, u.y + 1.2, u.z, 30, [.85, .6, 1], 2.5, .8, .6);
}
export function teleport(u) {
  if (u.isHero && hooks.gate) { hooks.gate(u); return; }
  for (const p of partyOf(u)) if (!p.dead && dist(p, u) < 30) { p.x = S.bind.x + rnd(-2.5, 2.5); p.z = S.bind.z + rnd(-2.5, 2.5); p.y = hgt(p.x, p.z); R.burst(p.x, p.y + 1, p.z, 24, [.6, 1, .5], 2, .8, .6); }
  for (const pt of S.ents) if (pt.pet && partyOf(u).includes(pt.pet.owner)) { pt.x = S.bind.x + rnd(-3, 3); pt.z = S.bind.z + rnd(-3, 3); }
}
export function consumeHot(t) { const i = t.buffs.findIndex(b => b.data.hot); if (i < 0) return false; t.buffs.splice(i, 1); return true; }
export function harvest(u, e) {
  let tot = 0;
  for (const b of e.buffs) if (b.data.dot && b.src === u) { tot += b.data.dot * Math.max(0, b.t); b.t = 0; }
  if (tot > 0) damage(u, e, tot, 'shadow', { noMiss: true });
  return tot;
}
export function feign(u) {
  u.feignT = S.time + 1.2; u.autoOn = false; u.casting = null;
  for (const m of S.ents) if (m.mob && m.threat.has(u)) { m.threat.delete(u); if (m.forced === u) m.forcedT = 0; }
  floatText(u, 'Feign Death', '#cfcfcf'); u.sit = true;
}
export function shift(u, form, data) {
  const had = hasBuff(u, form);
  u.buffs = u.buffs.filter(b => b.id !== 'bear' && b.id !== 'cat');
  if (!had) buff(u, form, 3600, data, u); else recalc(u);
  R.burst(u.x, u.y + 1, u.z, 20, [.8, .7, .5], 2, .6, .6);
}
export function leapTo(u, t) { const a = angTo(t, u), r = (t.r || .5) + 1.2; u.x = t.x + Math.sin(a) * r; u.z = t.z + Math.cos(a) * r; u.y = hgt(u.x, u.z); u.yaw = angTo(u, t); R.burst(u.x, u.y + .4, u.z, 16, [.9, .8, .6], 2.5, .5, .5); }
export function stepBehind(u, t) { const r = (t.r || .5) + 1.3; u.x = t.x - Math.sin(t.yaw) * r; u.z = t.z - Math.cos(t.yaw) * r; u.y = hgt(u.x, u.z); u.yaw = t.yaw; R.burst(u.x, u.y + 1, u.z, 20, [.4, .3, .6], 2, .6, .6); }
export const C = { leapTo, stepBehind, pw, damage, heal, gain, taunt, dropThreat, buff, partyBuff, enemiesNear, partyOf, d, revive, shoot, bolt, chain, fxRing, leap, weakOf,
  hot, dot, poison, poisonStacks, clearPoison, ward, interrupt, stun, mez, fear, summon, petsOf, recalcPet, charm, mirror, teleport, consumeHot, harvest, feign, shift, chainOf };

// ---------- using abilities ----------
export function abilityOf(e, key) { return key === 'attack' ? null : CLASSES[e.cls]?.abilities[key]; }
export function costOf(e, ab) { const c = ab.cost || 0; return e.resType === 'mana' ? Math.round(c / 100 * e.resMax) : c; }
// why an ability can't be used right now, or null if it can
export function cantUse(e, key, t) {
  const ab = abilityOf(e, key); if (!ab) return 'none';
  if (e.dead) return 'You are dead';
  if (e.buffs.some(b => b.data.stun || b.data.mez)) return 'Stunned';
  if (ab.lvl > e.lvl) return `Learned at level ${ab.lvl}`;
  if (ab.kind === 'ult' && e.ult < 100) return 'Ultimate not charged';
  if ((e.cds[key] || 0) > 0) return 'Not ready';
  if (ab.gcd !== false && e.gcdT > 0) return 'gcd';
  if (e.casting) return 'Already casting';
  if (costOf(e, ab) > e.res + .01) return 'Not enough ' + e.resType;
  if (hasBuff(e, 'bear') && (ab.kind === 'heal' || ab.cast)) return 'Not in bear form';
  if (ab.ooc && inCombat(e)) return 'Not in combat';
  const tt = resolveTarget(e, ab, t);
  if (tt === false) return ab.tgt === 'enemy' ? 'Need an enemy target' : ab.tgt === 'dead' ? 'Target a fallen ally' : 'Need a target';
  if (tt && tt !== e && ab.range) {
    const range = ab.range + (tt.r || .5);
    if (dist(e, tt) > range) return 'Out of range';
    if (blocked(e.x, e.z, tt.x, tt.z)) return 'Not in line of sight';
  }
  if (ab.behind && tt && !hasBuff(e, 'shadowstep') && !behind(e, tt)) return 'Must be behind the target';
  if (CC_KEYS.has(key) && tt && (tt.boss || tt.named)) return 'Immune';
  return null;
}
const CC_KEYS = new Set(['mez', 'lullaby', 'charm', 'siren', 'stun', 'gouge', 'terror']);
// behind = the target is facing more than about 110 degrees away from you
export function behind(e, t) { const a = Math.atan2(e.x - t.x, e.z - t.z); let dd = a - t.yaw; while (dd > Math.PI) dd -= 2 * Math.PI; while (dd < -Math.PI) dd += 2 * Math.PI; return Math.abs(dd) > 1.9; }
export function resolveTarget(e, ab, t) {
  if (ab.tgt === 'self' || ab.tgt === 'party') return ab.range && t && isEnemy(e, t) && !t.dead ? t : e;
  if (ab.tgt === 'enemy') return t && !t.dead && isEnemy(e, t) ? t : false;
  if (ab.tgt === 'ally') return t && !t.dead && !isEnemy(e, t) && t.team !== 'npc' && (t.cls || t.pet) ? t : e;
  if (ab.tgt === 'dead') return t && t.dead && t.cls && !isEnemy(e, t) ? t : false;
  return e;
}
export function useAbility(e, key, t) {
  if (key === 'attack') {
    if (!t || !isEnemy(e, t) || t.dead) return 'Need an enemy target';
    if (e.autoOn && e.target === t) e.autoOn = false; else { e.target = t; e.autoOn = true; if (t.mob && !t.engaged) addThreat(t, e, 1); }
    return null;
  }
  const why = cantUse(e, key, t); if (why) return why;
  const ab = abilityOf(e, key), tt = resolveTarget(e, ab, t);
  if (tt && tt !== e) e.yaw = angTo(e, tt);
  let cast = ab.cast || 0;
  if (key === 'aimed' && hasBuff(e, 'deadeye')) cast = 0;
  if (ab.gcd !== false) e.gcdT = GCD;
  if (cast > 0) { e.casting = { key, t: 0, total: cast, tgt: tt }; e.sit = false; return null; }
  finish(e, key, tt);
  return null;
}
function finish(e, key, tt) {
  const ab = abilityOf(e, key);
  e.res -= costOf(e, ab);
  if (ab.cd) e.cds[key] = ab.cd;
  if (ab.kind === 'ult') e.ult = 0;
  e.lastCast = S.time; e.anim.atk = 1; e.sit = false;
  if (ab.tgt === 'enemy' && tt && !e.autoOn && (CLASSES[e.cls].res !== 'mana' || e.cls === 'bard' || hasBuff(e, 'cat') || hasBuff(e, 'bear'))) { e.target = tt; e.autoOn = true; }
  if (key === 'aimed' && hasBuff(e, 'deadeye')) { e.buffs = e.buffs.filter(b => b.id !== 'deadeye'); curRank = rankOf(e, ab) > 1 ? 1.35 : 1; try { CLASSES.longwatch.abilities.aimed.fx(C, e, tt); } finally { curRank = 1; } const p = projectiles[projectiles.length - 1]; if (p) p.opts = { ...p.opts, sureCrit: true }; }
  else { curRank = rankOf(e, ab) > 1 ? 1.35 : 1; try { ab.fx(C, e, tt, ab); } finally { curRank = 1; } }
  if (ab.kind === 'attack' || ab.kind === 'util') { if (tt && tt !== e && tt.mob && !tt.engaged) addThreat(tt, e, 1); }
  const col = SC[ab.school || (ab.kind === 'heal' ? 'holy' : 'phys')] || SC.phys;
  R.burst(e.x, e.y + 1.6, e.z, 8, col, 1.5, .5, .4);
}
export function updateCasting(e, dt) {
  if (e.gcdT > 0) e.gcdT -= dt;
  for (const k in e.cds) if (e.cds[k] > 0) e.cds[k] -= dt;
  const c = e.casting; if (!c) return;
  if (e.dead) { e.casting = null; return; }
  const ab = abilityOf(e, c.key);
  if (c.tgt && c.tgt !== e && ((ab.tgt === 'dead' ? !c.tgt.dead : c.tgt.dead) || dist(e, c.tgt) > (ab.range || 30) + 6)) { e.casting = null; if (e.isHero) floatText(e, 'Interrupted', '#ff9a8a'); return; }
  c.t += dt; e.anim.atk = Math.max(e.anim.atk, .35);
  const sc = SC[ab.school || (ab.kind === 'heal' ? 'holy' : 'phys')] || SC.phys;
  if (Math.random() < .5) R.magic.emit(e.x + rnd(-.4, .4), e.y + rnd(.3, 2), e.z + rnd(-.4, .4), 0, 1, 0, .5, .4, sc[0], sc[1], sc[2]);
  if (c.t >= c.total) {
    e.casting = null;
    if (costOf(e, ab) > e.res + .01) return;
    if (c.tgt && c.tgt !== e) e.yaw = angTo(e, c.tgt);
    finish(e, c.key, c.tgt);
  }
}
export function interruptCast(e) { if (e.casting) { e.casting = null; if (e.isHero) floatText(e, 'Interrupted', '#ff9a8a'); } }

// ---------- auto attack and regeneration ----------
export function updateAuto(e, dt) {
  e.swingT -= dt;
  const t = e.target;
  if (!e.autoOn || !t || t.dead || !isEnemy(e, t) || t.evading) { if (t && (t.dead || t.evading)) e.autoOn = false; return; }
  if (e.swingT > 0 || e.casting) return;
  const C0 = CLASSES[e.cls]; if (!C0) return;
  const range = C0.melee ? C0.range + t.r : C0.range + t.r;
  if (dist(e, t) > range) return;
  if (!C0.melee && e.moving > .2) return;
  if (blocked(e.x, e.z, t.x, t.z)) return;
  e.swingT = C0.swing / (1 + buffSum(e, 'haste')); e.anim.atk = 1; e.yaw = angTo(e, t);
  const form = hasBuff(e, 'cat') ? 1.8 : hasBuff(e, 'bear') ? 1.3 : 1;
  const amt = (e.power * C0.swingMult + e.lvl * 1.5 + 3) * form;
  if (C0.melee) {
    const n = damage(e, t, amt, 'phys', { threat: hasBuff(e, 'bear') ? 2 : 1 });
    if (e.resType === 'rage') gain(e, 6); if (e.resType === 'momentum') gain(e, 3);
    if (n && hasBuff(e, 'poisonblades')) poison(e, t, 1);
  }
  else shoot(e, t, amt);
}
export function regen(e, dt) {
  if (e.dead) return;
  const ooc = !inCombat(e), sit = e.sit && ooc;
  const hpR = (ooc ? (sit ? .06 : .012) : 0) * (1 + (e.acct?.regenP || 0)), inner = 1 + buffSum(e, 'regen') + (e.acct?.resP || 0);
  if (hpR && e.hp < e.maxHp) e.hp = Math.min(e.maxHp, e.hp + e.maxHp * hpR * dt);
  if (e.resType === 'mana') {
    const five = S.time - e.lastCast > 5;
    const r = (sit ? .06 : five ? (ooc ? .015 : .01) : .004) * inner;
    e.res = Math.min(e.resMax, e.res + e.resMax * r * dt);
  } else if (RES[e.resType]?.kind === 'regen') e.res = Math.min(100, e.res + RES[e.resType].rate * (hasBuff(e, 'moon') ? 2 : 1) * (1 + (e.acct?.resP || 0)) * dt);
  else if (RES[e.resType]?.kind === 'build' && ooc) e.res = Math.max(0, e.res - RES[e.resType].decay * dt);
  if (e.mob && !e.engaged && e.hp < e.maxHp) e.hp = Math.min(e.maxHp, e.hp + e.maxHp * .05 * dt);
}

// ---------- death, experience, loot ----------
export function kill(e, src) {
  if (e.dead) return;
  e.dead = true; e.hp = 0; e.deadT = S.time; e.casting = null; e.autoOn = false; e.buffs = [];
  R.burst(e.x, e.y + 1, e.z, 16, e.mob && MOBS[e.mob].undead ? [.55, 1, .35] : [.9, .85, .8], 2.5, .8, .5);
  for (const o of S.ents) { if (o.target === e && o.mob) o.target = null; if (o.mob) o.threat.delete(e); }
  if (e.pet && !e.charmed) { e.remove = true; return; }
  // pets vanish when their owner falls
  for (const p of S.ents) if (p.pet && !p.charmed && p.pet.owner === e && !p.dead) { p.dead = true; p.remove = true; }
  for (const p of S.ents) if (p.charmed && p.charmed.owner === e) endCharm(p);
  if (e.charmed) { e.charmed = null; e.pet = null; e.team = 'enemy'; e.tagged = null; }
  if (e.mob) mobDied(e, src);
  else onHumanDeath(e, src);
}
let hooks = { onHumanDeath: () => { }, onMobDeath: () => { }, onLevel: () => { } };
export function setHooks(h) { hooks = { ...hooks, ...h }; }
function onHumanDeath(e, src) { hooks.onHumanDeath(e, src); }
function mobDied(e, src) {
  e.threat.clear(); e.engaged = false;
  // who gets credit: the party or fake group that tagged it
  const credit = e.tagged === 'party' ? S.party : Array.isArray(e.tagged) ? e.tagged : e.tagged ? [e.tagged] : [src];
  const near = credit.filter(p => p && p.cls && !p.dead && dist(p, e) < 70);
  const base = XP_RATE * mobXp(e.lvl) * (e.elite ? 2 : 1) * (e.named ? 4 : 1) * (e.boss ? 3 : 1);
  for (const p of near) {
    const dL = e.lvl - p.lvl;
    const mod = dL <= -4 ? 0 : dL < 0 ? 1 + dL * .2 : 1 + Math.min(4, dL) * .1;
    giveXp(p, Math.round(base * mod * (.4 + .6 / near.length) * (near.length > 1 ? 1.15 : 1)));
  }
  // loot: only bodies your party tagged get looted by you; fake groups loot their own
  e.loot = [];
  e.lootGold = Math.round(e.lvl * rnd(.8, 2.2) * (e.elite ? 2 : 1) * (e.named ? 5 : 1) * (e.boss ? 4 : 1));
  const spec = (e.tagged === 'party' && hooks.bossLoot && hooks.bossLoot(e, S.party)) || (e.named ? specialLoot(e.named, (e.tagged === 'party' ? S.party : credit).filter(p => p && p.cls)) : null);
  if (spec) e.loot.push(...spec);
  else if (e.named && NAMED_LOOT[e.named]) {
    const pool = [...NAMED_LOOT[e.named]].sort(() => Math.random() - .5);
    for (let i = 0; i < (e.boss ? 2 : 1); i++) e.loot.push(makeItem({ ...pool[i], named: true }));
  } else {
    const ch = e.elite ? .35 : .14;
    if (Math.random() < ch) e.loot.push(randomGear(e.lvl, null, e.elite ? .1 : 0));
  }
  e.lootFor = e.tagged === 'party' ? 'party' : 'other';
  hooks.onMobDeath(e, credit, near);
}
export function giveXp(p, amt) {
  if (amt <= 0) return;
  if (p.isHero && hooks.xpMod) amt = Math.round(hooks.xpMod(p, amt));
  const cap = p.isHero && hooks.lvlCap ? hooks.lvlCap(p) : MAX_LVL;
  if (p.lvl >= MAX_LVL) { p.xp = 0; return; }
  if (p.lvl >= cap) { const was = p.xp || 0; p.xp = Math.min(xpNeed(p.lvl) - 1, was + amt); if (hooks.onOverflow) hooks.onOverflow(p, was + amt - p.xp); if (p.xp >= xpNeed(p.lvl) - 1 && hooks.onCapped) hooks.onCapped(p); return; }
  p.xp = (p.xp || 0) + amt;
  if (p.isHero) floatText(p, `+${amt} xp`, '#c8a2ff');
  while (p.lvl < cap && p.xp >= xpNeed(p.lvl)) {
    p.xp -= xpNeed(p.lvl); p.lvl++;
    recalc(p); p.hp = p.maxHp; if (p.resType !== 'rage') p.res = p.resMax;
    R.burst(p.x, p.y + 1, p.z, 40, [1, .85, .4], 3, 1.2, .7);
    hooks.onLevel(p);
  }
  if (p.lvl >= MAX_LVL) p.xp = 0;
  else if (p.lvl >= cap) { if (hooks.onOverflow && p.xp > xpNeed(p.lvl) - 1) hooks.onOverflow(p, p.xp - (xpNeed(p.lvl) - 1)); p.xp = Math.min(p.xp, xpNeed(p.lvl) - 1); if (p.xp >= xpNeed(p.lvl) - 1 && hooks.onCapped) hooks.onCapped(p); }
}
