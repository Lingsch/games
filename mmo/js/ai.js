// AI: mobs (aggro, camp linking, leashing, fleeing, casters), the boss, your companions and the fake players.
import { S, clamp, dist, angTo, wrapA, rnd, pick, chat, floatText, TAU } from './core.js';
import { CLASSES, MOBS, CHAT, PETS, roleOf } from './data.js';
import * as Cb from './combat.js';
import { hgt, collide, blocked, world, route, depthAt } from './world.js';
import * as R from './render.js';

const { damage, heal, isEnemy, topThreat, addThreat, useAbility, cantUse, abilityOf, inCombat, hasBuff } = Cb;

// ---------- movement ----------
const turn = (a, b, k) => a + wrapA(b - a) * Math.min(1, k);
export function moveToward(e, tx, tz, dt, stop = .3, spdMul = 1) {
  const dx = tx - e.x, dz = tz - e.z, l = Math.hypot(dx, dz);
  if (e.mob && MOBS[e.mob].spd === 0) { e.yaw = turn(e.yaw, Math.atan2(dx, dz), dt * 2); return l <= stop; }
  if (e.mob && MOBS[e.mob].aquatic) { const nx = e.x + dx / (l || 1) * 2, nz = e.z + dz / (l || 1) * 2; if (depthAt(nx, nz) < 1.5) { e.moving = Math.max(0, e.moving - dt * 6); return true; } }
  if (l <= stop) { e.moving = Math.max(0, e.moving - dt * 6); return true; }
  if (Cb.rooted(e)) { e.moving = 0; return false; }
  const sp = e.spd * spdMul * Cb.spdOf(e) * (e.sit ? 0 : 1), st = Math.min(l - stop, sp * dt);
  e.sit = false;
  const ox = e.x, oz = e.z;
  e.x += dx / l * st; e.z += dz / l * st;
  if (collide(e, e.r)) { // slide along walls: if stuck, sidestep
    const moved = Math.hypot(e.x - ox, e.z - oz);
    if (moved < st * .3) { e.stuckT = (e.stuckT || 0) + dt; const side = (e.id % 2 ? 1 : -1); e.x += -dz / l * sp * dt * side; e.z += dx / l * sp * dt * side; collide(e, e.r); }
  } else e.stuckT = 0;
  e.yaw = turn(e.yaw, Math.atan2(dx, dz), dt * 10);
  e.moving = Math.min(1, e.moving + dt * 6);
  return false;
}
// like moveToward, but goes round walls through the nearest sensible doorway
export function goTo(e, tx, tz, dt, stop = .3, spdMul = 1) {
  if (!e.navT || e.navT < S.time || Math.hypot((e.navGoal?.x || 0) - tx, (e.navGoal?.z || 0) - tz) > 4) {
    e.navT = S.time + .4; e.navGoal = { x: tx, z: tz }; e.navWp = route(e.x, e.z, tx, tz);
  }
  const w = e.navWp;
  if (w) { if (Math.hypot(w.x - e.x, w.z - e.z) < 1.2) { e.navT = 0; } moveToward(e, w.x, w.z, dt, .2, spdMul); return false; }
  return moveToward(e, tx, tz, dt, stop, spdMul);
}
export function face(e, t, dt) { e.yaw = turn(e.yaw, angTo(e, t), dt * 12); }
function stopMove(e, dt) { e.moving = Math.max(0, e.moving - dt * 6); }

// ---------- dangers (boss telegraphs and pools) ----------
export function inDanger(x, z) {
  for (const g of S.dangers) {
    if (g.kind === 'circle' && Math.hypot(x - g.x, z - g.z) < g.r + .6) return g;
    if (g.kind === 'cone') { const dd = Math.hypot(x - g.x, z - g.z); if (dd < g.r + .6 && Math.abs(wrapA(Math.atan2(x - g.x, z - g.z) - g.yaw)) < g.w + .15) return g; }
  }
  return null;
}
function escapeDanger(e, dt) {
  const g = inDanger(e.x, e.z); if (!g) return false;
  let a = Math.atan2(e.x - g.x, e.z - g.z);
  if (g.kind === 'cone') a = g.yaw + (wrapA(a - g.yaw) > 0 ? 1 : -1) * (g.w + .9);
  const r = g.kind === 'cone' ? Math.max(3, Math.hypot(e.x - g.x, e.z - g.z)) : g.r + 2.2;
  moveToward(e, g.x + Math.sin(a) * r, g.z + Math.cos(a) * r, dt, .2, 1.1);
  return true;
}

// ---------- mobs ----------
export function mobAI(m, dt) {
  const M = MOBS[m.mob];
  m.attackT = (m.attackT || 0) - dt * Math.max(.3, 1 + Cb.buffSum(m, 'haste'));
  if (m.forcedT > 0) m.forcedT -= dt;
  if (m.evading) {
    // run home; if something is in the way and it can't get there in time, it simply resets at home
    m.evadeT = (m.evadeT || 0) + dt;
    const home = goTo(m, m.home.x, m.home.z, dt, 1.2, 1.6) || Math.hypot(m.x - m.home.x, m.z - m.home.z) < 2;
    if (home || m.evadeT > 7) {
      if (!home) { m.x = m.home.x; m.z = m.home.z; m.y = hgt(m.x, m.z); m.rx = m.x; m.rz = m.z; }
      m.evading = false; m.evadeT = 0; m.hp = m.maxHp; m.threat.clear(); m.engaged = false; m.tagged = null; m.buffs = []; m.target = null; m.fled = false; Cb.recalc(m);
    }
    m.hp = Math.min(m.maxHp, m.hp + m.maxHp * .3 * dt);
    return;
  }
  if (Cb.ccd(m)) { stopMove(m, dt); m.anim.atk = 0; return; }
  if (m.fleeT > 0) { m.fleeT -= dt; const t = m.target; if (t) { const a = angTo(t, m); moveToward(m, m.x + Math.sin(a) * 5, m.z + Math.cos(a) * 5, dt, .1, .8); } return; }
  if (!m.engaged) {
    // idle: wander a little around home, look for anyone to attack
    if (!m.wander || m.wanderT < S.time) { m.wanderT = S.time + rnd(4, 12); m.wander = { x: m.home.x + rnd(-3, 3), z: m.home.z + rnd(-3, 3) }; }
    if (moveToward(m, m.wander.x, m.wander.z, dt, .4, .35)) { }
    if ((m.scanT = (m.scanT || 0) - dt) <= 0) {
      m.scanT = .35;
      for (const e of S.ents) {
        if (e.dead || e.team === 'enemy' || e.team === 'npc' || e.evading) continue;
        if (e.lvl >= m.lvl + 4 && !m.boss) continue;           // too strong to bother
        const ar = M.aggro * (e.sit ? 1.2 : 1) + (m.lvl - e.lvl) * .8;
        if (Math.abs(e.x - m.x) > ar || Math.abs(e.z - m.z) > ar) continue;
        if (M.aquatic && depthAt(e.x, e.z) < 1.2) continue;
        if (dist(e, m) < ar && !blocked(m.x, m.z, e.x, e.z)) { addThreat(m, e, 1); if (m.boss) chat('say', m.name, 'You disturb the sewing. Stay. Be stitched.'); break; }
      }
    }
    return;
  }
  let t = (m.forcedT > 0 && m.forced && !m.forced.dead) ? m.forced : topThreat(m);
  // sharks won't follow you out of the water
  if (M.aquatic && t && depthAt(t.x, t.z) < 1.2) { m.threat.delete(t); t = topThreat(m); }
  if (!t) { m.evading = true; m.target = null; return; }
  m.target = t;
  const leash = m.dungeon ? 34 : 50;
  if (dist(m, m.home) > leash) { m.evading = true; m.target = null; return; }
  if (M.flee && !m.fled && m.hp < m.maxHp * .15) { m.fled = true; m.fleeT = 5; if (dist(m, S.hero) < 40) chat('say', m.name, pick(['I yield— no!', 'Run!', 'Not like this!'])); return; }
  if ((m.boss || m.boss2) && bossAI(m, t, dt)) return;
  // casters heal friends and throw bolts
  if (m.mcast) {
    m.mcast.t += dt; stopMove(m, dt); m.anim.atk = .5;
    if (m.mcast.t >= m.mcast.total) {
      const c = m.mcast; m.mcast = null;
      if (c.kind === 'heal' && !c.tgt.dead) { c.tgt.hp = Math.min(c.tgt.maxHp, c.tgt.hp + c.tgt.maxHp * .3); R.burst(c.tgt.x, c.tgt.y + 1, c.tgt.z, 16, [.5, 1, .4], 2, .7, .5); floatText(c.tgt, 'Healed', '#9be36b'); }
      else if (c.kind === 'bolt' && !c.tgt.dead) { Cb.bolt(m, c.tgt, m.power * (m.boltPow || 1.3), M.school || 'shadow'); m.boltPow = 0; }
    }
    return;
  }
  if (M.healer && (m.healCd = (m.healCd || 0) - dt) <= 0) {
    const hurt = S.ents.find(o => o.mob && !o.dead && o.engaged && o.hp < o.maxHp * .5 && dist(o, m) < 20);
    if (hurt) { m.mcast = { kind: 'heal', t: 0, total: 2.5, tgt: hurt }; m.healCd = 9; if (dist(m, S.hero) < 40) chat('say', m.name, 'casts a healing chant on ' + hurt.name + '.'); return; }
  }
  const rng = M.range + t.r;
  const dd = dist(m, t);
  if (dd > rng || (M.ranged && blocked(m.x, m.z, t.x, t.z))) {
    // spread out around the target so they don't stack
    const slot = (m.id % 7) / 7 * TAU, off = M.ranged ? 0 : 1;
    goTo(m, t.x + Math.sin(slot) * off, t.z + Math.cos(slot) * off, dt, Math.max(.3, rng - .6));
    return;
  }
  stopMove(m, dt); face(m, t, dt);
  if (m.attackT <= 0) {
    m.anim.atk = 1;
    if (M.caster) { m.mcast = { kind: 'bolt', t: 0, total: 2, tgt: t }; m.attackT = 3.2; }
    else if (M.ranged) { Cb.shoot(m, t, m.power); m.attackT = 2.4; }
    else { damage(m, t, m.power, 'phys'); m.attackT = m.boss ? 2.2 : 2.0; }
  }
}

// the boss in the crypt: cleave, bile pools, raising the dead, and an enrage timer
function bossAI(m, t, dt) {
  const f = { abom: abomAI, queen: queenAI, bosun: bosunAI, admiral: admiralAI, leviathan: levAI }[m.mob];
  return f ? f(m, t, dt) : false;
}
// shared boss tools
function bstate(m, o) { return m.bs || (m.bs = { time: 0, wind: null, enraged: false, said: {}, ...o }); }
function enrageAt(m, b, secs) { if (b.time > secs && !b.enraged) { b.enraged = true; Cb.buff(m, 'enrage', 999, { pow: 1 }); chat('sys', null, `${m.name} goes into a frenzy!`); floatText(m, 'ENRAGED', '#ff3a1a', true); } }
const partyIn = m => S.ents.filter(e => !e.dead && isEnemy(m, e) && (e.cls || e.pet) && dist(e, m) < 40);
const nonTank = (m, t) => { const L = partyIn(m).filter(e => e !== t && e.cls); return L.length ? pick(L) : t; };
function windup(m, b, kind, secs, g, data = {}) { g.t = secs; g.tele = true; S.dangers.push(g); b.wind = { kind, t: secs, g, ...data }; }
function inShape(g, e) {
  const d = Math.hypot(e.x - g.x, e.z - g.z);
  if (g.kind === 'circle') return d < g.r + (e.r || .5) * .5;
  return d < g.r && Math.abs(wrapA(Math.atan2(e.x - g.x, e.z - g.z) - g.yaw)) < g.w + .1;
}
// a wind-up in progress: count down, then hit everyone inside the shape
function runWind(m, b, dt, onHit) {
  if (!b.wind) return false;
  b.wind.t -= dt; stopMove(m, dt); m.anim.atk = .6;
  if (b.wind.t <= 0) {
    const w = b.wind; b.wind = null; S.dangers = S.dangers.filter(g => g !== w.g && !(w.extra || []).includes(g));
    for (const g of [w.g, ...(w.extra || [])]) for (const e of partyIn(m)) if (inShape(g, e)) onHit(w, e);
    if (w.after) w.after();
  }
  return true;
}
function addWave(m, n, lvl, kind, near, hpScale = 1) {
  const out = [], tgts = partyIn(m);
  for (let k = 0; k < n; k++) {
    const p = near[k % near.length], a = Cb.makeMob(kind, lvl, { x: p.x + rnd(-1.5, 1.5), z: p.z + rnd(-1.5, 1.5), home: { x: p.x, z: p.z }, dungeon: true, add: true });
    if (hpScale !== 1) { a.maxHp = Math.round(a.maxHp * hpScale); a.hp = a.maxHp; }
    const heal = tgts.filter(e => roleOf(e) === 'healer'), tg = (k % 2 && heal.length ? pick(heal) : pick(tgts)) || m.target;
    if (tg) addThreat(a, tg, 5);
    R.burst(a.x, a.y + 1, a.z, 18, [.5, 1, .8], 2.5, .8, .6); out.push(a);
  }
  return out;
}
// Mother Brine, the smuggler queen: smoke bombs, and her crew at half health
function queenAI(m, t, dt) {
  const b = bstate(m, { smoke: 8 }); b.time += dt; enrageAt(m, b, 240);
  if (!b.said.start) { b.said.start = 1; chat('say', m.name, 'Tessaly sent you? Then Tessaly can pay for your funerals.'); }
  if (m.hp < m.maxHp * .5 && !b.said.crew) { b.said.crew = 1; chat('say', m.name, 'Boys! Earn your share!'); addWave(m, 3, 16, 'smuggler', [{ x: m.x - 6, z: m.z - 5 }, { x: m.x - 6, z: m.z + 5 }, { x: m.x - 9, z: m.z }]); }
  if (runWind(m, b, dt, (w, e) => { damage(m, e, m.power * 1.6, 'phys', { noMiss: true }); Cb.buff(e, 'slow', 5, { slow: .5 }, m); })) return true;
  if ((b.smoke -= dt) <= 0) { b.smoke = rnd(11, 14); const v = nonTank(m, t); windup(m, b, 'smoke', 1.5, { kind: 'circle', x: v.x, z: v.z, r: 4, col: '#c8c8c8' }); chat('say', m.name, 'lobs a smoke bomb!'); return true; }
  return false;
}
// Bosun Graft: hooks a member of your group in, and cleaves
function bosunAI(m, t, dt) {
  const b = bstate(m, { hook: 9, cleave: 6 }); b.time += dt; enrageAt(m, b, 240);
  if (!b.said.start) { b.said.start = 1; chat('say', m.name, 'All hands! Boarders on the deck!'); }
  if (runWind(m, b, dt, (w, e) => damage(m, e, m.power * 1.9, 'phys', { noMiss: true }))) return true;
  if ((b.hook -= dt) <= 0) {
    b.hook = rnd(11, 13); const v = nonTank(m, t);
    if (v && v !== t) { const a = angTo(m, v); v.x = m.x + Math.sin(a) * 2.2; v.z = m.z + Math.cos(a) * 2.2; v.y = hgt(v.x, v.z); Cb.buff(v, 'stun', 1.5, { stun: 1 }, m); damage(m, v, m.power * .8, 'phys', { noMiss: true }); chat('say', m.name, `hooks ${v.name} across the deck!`); R.burst(v.x, v.y + 1, v.z, 16, [.8, .8, .8], 2, .5, .5); }
    return true;
  }
  if ((b.cleave -= dt) <= 0) { b.cleave = rnd(8, 10); const yaw = angTo(m, t); m.yaw = yaw; windup(m, b, 'cleave', 1.3, { kind: 'cone', x: m.x, z: m.z, r: 7.5, yaw, w: .9, col: '#ff3a1a' }); return true; }
  return false;
}
// Admiral Morrow Vane: waves of drowned sailors, tide bolts, anchor drag. When he falls, the leviathan comes.
function admiralAI(m, t, dt) {
  const b = bstate(m, { wave: 6, bolt: 5, anchor: 12 }); b.time += dt;
  world.fleetT = world.fleetT || S.time;
  enrageAt(m, b, 360);
  if (!b.said.start) { b.said.start = 1; chat('say', m.name, 'The Fourfold Law? I drowned before your grandfathers wrote it. Crew! To quarters!'); for (const p of S.party) if (p !== S.hero && Math.random() < .5) { chat('party', p.name, pick(CHAT.boss)); break; } }
  if (m.mcast) return false; // let the shared caster code finish the tide bolt
  if ((b.wave -= dt) <= 0) {
    b.wave = 22; chat('say', m.name, pick(['Up from the holds!', 'All hands on deck!', 'Rise, crew of the Vane!']));
    addWave(m, 6, 18, 'drowned', [{ x: -20, z: -30 }, { x: 20, z: -30 }, { x: -14, z: -44 }, { x: 14, z: -44 }], .55);
    return true;
  }
  if ((b.anchor -= dt) <= 0) { b.anchor = rnd(16, 20); const L = partyIn(m).filter(e => roleOf(e) === 'healer'); const v = L.length ? pick(L) : nonTank(m, t); if (v) { Cb.buff(v, 'root', 4, { root: 1 }, m); damage(m, v, m.power * .9, 'shadow', { noMiss: true }); chat('say', m.name, `drags ${v.name} down with a phantom anchor!`); } }
  if ((b.bolt -= dt) <= 0) { b.bolt = rnd(7, 9); const v = nonTank(m, t); if (v) { m.mcast = { kind: 'bolt', t: 0, total: 2, tgt: v }; m.boltPow = 2; } }
  return false;
}
// The leviathan: doesn't move, slams with tentacles, sends a tidal wave, spits ink
function levAI(m, t, dt) {
  const b = bstate(m, { slam: 6, wave: 12, ink: 16 }); b.time += dt;
  if (world.fleetT && S.time - world.fleetT > 420 && !b.enraged) enrageAt(m, b, 0);
  if (runWind(m, b, dt, (w, e) => damage(m, e, m.power * (w.kind === 'wave' ? 1.5 : 1.8), w.kind === 'wave' ? 'frost' : 'phys', { noMiss: true }))) return true;
  if ((b.slam -= dt) <= 0) {
    b.slam = rnd(9, 11); const L = partyIn(m); const g0 = { kind: 'circle', x: 0, z: 0, r: 3.4, col: '#ff3a1a' }, extra = [];
    const pts = [0, 1, 2].map(() => pick(L) || t);
    pts.forEach((v, i) => { const g = { kind: 'circle', x: v.x + rnd(-1, 1), z: v.z + rnd(-1, 1), r: 3.4, col: '#ff3a1a', t: 1.6, tele: true }; if (i === 0) Object.assign(g0, g); else { S.dangers.push(g); extra.push(g); } });
    windup(m, b, 'slam', 1.6, g0, { extra }); chat('say', m.name, 'raises its tentacles…'); return true;
  }
  if ((b.wave -= dt) <= 0) { b.wave = rnd(15, 18); const L = partyIn(m); let cx = 0, cz = 0; for (const e of L) { cx += e.x; cz += e.z; } const yaw = Math.atan2(cx / (L.length || 1) - m.x, cz / (L.length || 1) - m.z) + rnd(-.4, .4); windup(m, b, 'wave', 2, { kind: 'cone', x: m.x, z: m.z, r: 20, yaw, w: .55, col: '#3a8aff' }); chat('sys', null, 'The leviathan draws back a tidal wave!'); return true; }
  if ((b.ink -= dt) <= 0) { b.ink = rnd(18, 22); const v = pick(partyIn(m)) || t; S.dangers.push({ kind: 'circle', x: v.x, z: v.z, r: 4.5, t: 14, pool: true, dps: .05, slow: .5, col: '#3a2a5a' }); }
  return false;
}
function abomAI(m, t, dt) {
  const b = m.bs || (m.bs = { time: 0, cleave: 7, bile: 11, adds: [], wind: null, enraged: false, said: {} });
  b.time += dt;
  if (!b.said.start) { b.said.start = 1; chat('say', m.name, 'More pieces for the pattern.'); for (const p of S.party) if (p !== S.hero && Math.random() < .5) { chat('party', p.name, pick(CHAT.boss)); break; } }
  if (b.time > 240 && !b.enraged) { b.enraged = true; Cb.buff(m, 'enrage', 999, { pow: 1 }); chat('sys', null, `${m.name} goes into a frenzy!`); floatText(m, 'ENRAGED', '#ff3a1a', true); }
  for (const th of [.7, .35]) if (m.hp < m.maxHp * th && !b.said['add' + th]) {
    b.said['add' + th] = 1; chat('say', m.name, 'Rise, brothers. Rise and hold them.');
    const alt = { x: world.ruin.x, z: world.ruin.z - 27 };
    const healers = S.party.filter(p => roleOf(p) === 'healer' && !p.dead);
    for (let k = 0; k < 4; k++) {
      const a = Cb.makeMob('skeleton', 8, { x: alt.x + Math.cos(k * 1.6) * 3, z: alt.z + 2 + Math.sin(k * 1.6) * 2, home: { x: alt.x, z: alt.z + 3 }, dungeon: true, add: true });
      const tgt = healers[k % Math.max(1, healers.length)] || t; addThreat(a, tgt, 5);
      R.burst(a.x, a.y + 1, a.z, 20, [.55, 1, .35], 2.5, .8, .6);
    }
  }
  if (b.wind) {
    b.wind.t -= dt; stopMove(m, dt); m.anim.atk = .6;
    if (b.wind.t <= 0) {
      const w = b.wind; b.wind = null;
      if (w.kind === 'cleave') {
        for (const e of Cb.enemiesNear(m, m, 7.5)) if (Math.abs(wrapA(angTo(m, e) - w.yaw)) < .9) damage(m, e, m.power * 1.9, 'phys', { noMiss: true });
        R.burst(m.x + Math.sin(w.yaw) * 4, m.y + .5, m.z + Math.cos(w.yaw) * 4, 30, [.9, .3, .2], 4, .6, .6);
      } else if (w.kind === 'bile') S.dangers.push({ kind: 'circle', x: w.x, z: w.z, r: 3.6, t: 12, pool: true, dps: .08, col: '#7aff3a' });
      S.dangers = S.dangers.filter(g => g !== w.g);
    }
    return true;
  }
  b.cleave -= dt; b.bile -= dt;
  if (b.cleave <= 0) {
    b.cleave = rnd(8, 10); const yaw = angTo(m, t); m.yaw = yaw;
    const g = { kind: 'cone', x: m.x, z: m.z, r: 7.5, yaw, w: .9, t: 1.4, col: '#ff3a1a', tele: true };
    S.dangers.push(g); b.wind = { kind: 'cleave', t: 1.4, yaw, g };
    return true;
  }
  if (b.bile <= 0) {
    b.bile = rnd(12, 15);
    const pool = S.ents.filter(e => !e.dead && isEnemy(m, e) && e !== t && dist(e, m) < 30);
    const v = pool.length ? pick(pool) : t;
    const g = { kind: 'circle', x: v.x, z: v.z, r: 3.6, t: 1.7, col: '#b8ff3a', tele: true };
    S.dangers.push(g); b.wind = { kind: 'bile', t: 1.7, x: v.x, z: v.z, g };
    chat('say', m.name, 'retches a stream of grave-bile!');
    return true;
  }
  return false;
}
export function updateDangers(dt) {
  for (const g of S.dangers) {
    g.t -= dt;
    if (g.pool) { g.acc = (g.acc || 0) + dt; if (g.acc >= .5) { g.acc -= .5; for (const e of S.ents) if (!e.dead && e.team !== 'enemy' && e.team !== 'npc' && Math.hypot(e.x - g.x, e.z - g.z) < g.r) { const boss = S.ents.find(b => b.boss && !b.dead); damage(boss || e, e, e.maxHp * g.dps * .5, 'poison', { noMiss: true }); if (g.slow) Cb.buff(e, 'slow', 1.2, { slow: g.slow }, boss || e); } } }
  }
  S.dangers = S.dangers.filter(g => g.t > 0);
}

// ---------- class brains (companions and fake players share these) ----------
function ready(e, key, t) { return !cantUse(e, key, t); }
function tryUse(e, key, t) { if (ready(e, key, t)) { useAbility(e, key, t); return true; } return false; }
function hpPct(e) { return e.hp / e.maxHp; }
const isTank = p => roleOf(p) === 'tank' && !p.pet;
export const meleeClass = e => CLASSES[e.cls].melee && (CLASSES[e.cls].res !== 'mana' || e.cls === 'bard' || hasBuff(e, 'cat') || hasBuff(e, 'bear'));
const isHealer = p => roleOf(p) === 'healer' && !p.pet;
const inGroup = (k, group) => group.includes(k) || (k.pet && group.includes(k.pet.owner));
const cc = m => Cb.ccd(m);
// AoE wakes the mesmerized: don't swing one near a sleeping enemy
const mezNear = (c, r) => S.ents.some(m => m.mob && !m.dead && m.buffs.some(b => b.data.mez) && dist(m, c) < r + 1);
export function groupFoes(group) { return S.ents.filter(m => m.mob && !m.charmed && !m.dead && m.engaged && !m.evading && [...m.threat.keys()].some(k => inGroup(k, group))); }
// which buff each buff ability puts up
const BUFF_ID = { seasong: 'seasong', shout: 'shout', iron: 'iron', fort: 'fort', inner: 'inner', eagle: 'eagle', trueshot: 'trueshot', kindle: 'kindle', keen: 'keen', lightfeet: 'lightfeet', steel: 'steel',
  bladeward: 'bladeward', ironbody: 'ironbody', wind: 'wind', focus: 'focusmind', faith: 'faith', serenity: 'serenity', vigor: 'vigor', rooted: 'rooted', wolf: 'wolfspirit', thorns: 'thorns',
  mark: 'markwild', deadly: 'deadly', shadowpact: 'shadowpact', blades: 'poisonblades', antivenom: 'antivenom', valor: 'valor', rest: 'restsong', haste: 'hastesong', darkpact: 'darkpact',
  bloodpact: 'bloodpact', seal: 'seal', kinship: 'kinship', clarity: 'clarity', hasted: 'haste', insight: 'insight' };
const buffLeft = (p, id) => p.buffs.find(b => b.id === id)?.t || 0;
// keep buffs up: long ones out of combat, bard songs all the time
export function upkeepBuffs(e, group, combat = false) {
  if (e.casting || e.gcdT > 0) return false;
  if (!combat && inCombat(e)) return false;
  const ab = CLASSES[e.cls].abilities;
  for (const k in ab) {
    const a = ab[k], id = BUFF_ID[k]; if (a.kind !== 'buff' || a.lvl > e.lvl || !id) continue;
    if (combat && !a.song && k !== 'blades') continue;
    if (k === 'seasong' && !group.some(p => p.swim)) continue;
    if (k === 'travel') continue;
    if (a.song) { if (buffLeft(e, id) < 5 && tryUse(e, k, e)) return true; continue; }
    if (a.tgt === 'ally') { const t = group.find(p => isTank(p) && !p.dead) || e; if (!hasBuff(t, id) && dist(t, e) < 28 && tryUse(e, k, t)) return true; continue; }
    const need = a.tgt === 'party' ? group.some(p => !p.dead && p.cls && dist(p, e) < 30 && !hasBuff(p, id)) : !hasBuff(e, id);
    if (need && tryUse(e, k, e)) return true;
  }
  // a Binder keeps its four elementals bound
  if (e.cls === 'binder' && !combat) {
    const have = new Set(Cb.petsOf(e).map(p => p.pet.key));
    for (const [k, pk] of [['bindstone', 'golempet'], ['bindfire', 'firepet'], ['bindwater', 'waterpet'], ['bindstorm', 'stormpet']]) if (!have.has(pk) && tryUse(e, k, e)) return true;
  }
  return false;
}
// tanks grab anything chewing on someone else, then hold their target
function tankBrain(e, t, group, n, K) {
  if (hpPct(e) < .33 && K.save && tryUse(e, K.save, e)) return true;
  if (e.ult >= 100 && (n >= 3 || t.boss || hpPct(e) < .25) && tryUse(e, K.ult, e)) return true;
  const loose = S.ents.find(m => m.mob && !m.dead && !cc(m) && m.engaged && m.target && m.target !== e && inGroup(m.target, group) && !(m.target.pet && m.target.pet.role === 'tank') && dist(m, e) < 22);
  if (loose && tryUse(e, K.taunt, loose)) { if (e.inParty && Math.random() < .3) chat('party', e.name, 'got it'); return true; }
  if (topThreat(t) !== e && tryUse(e, K.taunt, t)) return true;
  if (n >= 2 && !mezNear(e, 9) && tryUse(e, K.aoe, e)) return true;
  if (hpPct(e) < .55 && K.heal && tryUse(e, K.heal, K.healSelf ? e : t)) return true;
  if (tryUse(e, K.big, t)) return true;
  return tryUse(e, K.builder, t);
}
const BRAINS = {
  bulwark(e, t, g, n) {
    if (t.mcast && tryUse(e, 'bash', t)) return true;
    if (g.filter(p => !p.dead && hpPct(p) < .5).length >= 3 && tryUse(e, 'rally', e)) return true;
    return tankBrain(e, t, g, n, { save: 'wall', ult: 'lastwall', taunt: 'taunt', aoe: 'clap', heal: 'revenge', big: 'slam', builder: 'heavy' });
  },
  wardancer(e, t, g, n) {
    if (S.ents.filter(m => m.mob && !m.dead && !cc(m) && m.target && m.target !== e && inGroup(m.target, g) && dist(m, e) < 10).length >= 2 && tryUse(e, 'flourish', e)) return true;
    if (tankBrain(e, t, g, n, { save: 'blur', ult: 'untouchable', taunt: 'challenge', aoe: 'whirl', heal: 'secondstep', big: 'counter', builder: 'flicker' })) return true;
    return e.res >= 35 && tryUse(e, 'flurry', t);
  },
  bladewarden(e, t, g, n) {
    if ((t.boss || t.elite || t.named) && !hasBuff(t, 'disarm') && tryUse(e, 'disarm', t)) return true;
    if (t.hp < t.maxHp * .3 && tryUse(e, 'execute', t)) return true;
    return tankBrain(e, t, g, n, { save: 'guard', ult: 'thousand', taunt: 'callout', aoe: 'sweep', heal: 'rally', healSelf: true, big: 'riposte', builder: 'hew' });
  },
  longwatch(e, t, g, n) {
    if (e.ult >= 100 && (t.boss || t.named || t.elite) && tryUse(e, 'moon', e)) return true;
    if (tryUse(e, 'deadeye', e)) return true;
    if ((t.boss || t.elite || t.named) && tryUse(e, 'rapid', e)) return true;
    if (Cb.enemiesNear(e, t, 10).length >= 2 && !mezNear(t, 10) && tryUse(e, 'multishot', t)) return true;
    if (dist(e, t) < 6 && t.target === e && tryUse(e, 'fallback', e)) return true;
    if (Cb.enemiesNear(e, t, 7).length >= 3 && !mezNear(t, 7) && tryUse(e, 'volley', t)) return true;
    const chaser = S.ents.find(m => m.mob && !m.dead && !cc(m) && m.target && isHealer(m.target) && g.includes(m.target) && !Cb.rooted(m));
    if (chaser && tryUse(e, 'pin', chaser)) return true;
    if (e.moving < .1 && e.res >= 35 && tryUse(e, 'aimed', t)) return true;
    return e.res >= 55 && tryUse(e, 'quick', t);
  },
  elementalist(e, t) {
    if (e.ult >= 100 && (t.boss || t.named || t.elite || t.hp > e.power * 8) && tryUse(e, 'cataclysm', t)) return true;
    if (t.target === e && dist(e, t) < 6 && !mezNear(e, 8) && tryUse(e, 'nova', e)) return true;
    if (Cb.weakOf(t) && tryUse(e, 'prism', t)) return true;
    if (Cb.enemiesNear(e, t, 8).length >= 3 && !mezNear(t, 8) && tryUse(e, 'meteor', t)) return true;
    if (t.target === e && tryUse(e, 'eward', e)) return true;
    if (Cb.enemiesNear(e, t, 10).length >= 2 && !mezNear(t, 10) && tryUse(e, 'chain', t)) return true;
    const w = Cb.weakOf(t), rs = t.mob ? MOBS[t.mob].resist : null;
    if (w === 'storm' && tryUse(e, 'storm', t)) return true;
    if (w === 'earth' && tryUse(e, 'stone', t)) return true;
    if (w === 'frost' && tryUse(e, 'frost', t)) return true;
    if (w === 'fire' && tryUse(e, 'fire', t)) return true;
    if (rs !== 'storm' && tryUse(e, 'storm', t)) return true;
    if (rs !== 'fire') return tryUse(e, 'fire', t);
    return tryUse(e, 'frost', t);
  },
  monk(e, t, g, n) {
    if (e.ult >= 100 && (t.boss || t.elite || t.named) && tryUse(e, 'fists', e)) return true;
    const caster = S.ents.find(m => m.mob && !m.dead && m.mcast && m.engaged && dist(m, e) < 4 && !m.boss && !m.named);
    if (caster && tryUse(e, 'stun', caster)) return true;
    if (hpPct(e) < .4 && tryUse(e, 'calm', e)) return true;
    if (hpPct(e) < .3 && S.ents.some(m => m.mob && !m.dead && m.target === e) && g.some(p => isTank(p) && !p.dead) && tryUse(e, 'feign', e)) return true;
    // off-tank: peel enemies off healers when no tank is up
    if (!g.some(p => isTank(p) && !p.dead)) { const loose = S.ents.find(m => m.mob && !m.dead && !cc(m) && m.target && isHealer(m.target) && g.includes(m.target)); if (loose && tryUse(e, 'provoke', loose)) return true; }
    if (dist(e, t) > 5 && tryUse(e, 'flyingkick', t)) return true;
    if (n >= 3 && !mezNear(e, 6) && tryUse(e, 'whirlkick', e)) return true;
    if (tryUse(e, 'claw', t)) return true;
    return e.res >= 45 && tryUse(e, 'palm', t);
  },
  knifeshade(e, t) {
    if (e.ult >= 100 && (t.boss || t.elite || t.named) && tryUse(e, 'deathmark', t)) return true;
    const onMe = S.ents.some(m => m.mob && !m.dead && m.target === e && !cc(m));
    if (onMe && hpPct(e) < .45 && tryUse(e, 'vanish', e)) return true;
    if (onMe && tryUse(e, 'evade', e)) return true;
    if (t.mcast && tryUse(e, 'gouge', t)) return true;
    if (!Cb.behind(e, t) && t.target !== e && tryUse(e, 'step', t)) return true;
    if (S.ents.filter(m => m.mob && !m.dead && !cc(m) && dist(m, e) < 7).length >= 3 && !mezNear(e, 7) && tryUse(e, 'fan', e)) return true;
    if (tryUse(e, 'ambush', t)) return true;
    if (tryUse(e, 'backstab', t)) return true;
    return (e.res >= 70 || !Cb.behind(e, t)) && e.res >= 25 && tryUse(e, 'stab', t);
  },
  blightblade(e, t, g, n) {
    if (e.ult >= 100 && (n >= 3 || t.boss || t.elite) && tryUse(e, 'pandemic', e)) return true;
    if ((t.boss || t.elite || t.named) && tryUse(e, 'lethal', e)) return true;
    if (n >= 3 && !mezNear(e, 6) && tryUse(e, 'cloud', e)) return true;
    const st = Cb.poisonStacks(t, e);
    if (st >= 5 && t.hp < t.maxHp * .35 && tryUse(e, 'burst', t)) return true;
    if (st >= 3 && Cb.enemiesNear(e, t, 8).length >= 2 && tryUse(e, 'plague', t)) return true;
    const chaser = S.ents.find(m => m.mob && !m.dead && !cc(m) && m.target && isHealer(m.target) && dist(m, e) < 4 && !Cb.slowOf(m));
    if (chaser && tryUse(e, 'cripple', chaser)) return true;
    if (!t.buffs.some(b => b.id === 'rupture:' + e.id) && tryUse(e, 'rupture', t)) return true;
    if (st < 5 && tryUse(e, 'envenom', t)) return true;
    return e.res >= 50 && tryUse(e, 'gash', t);
  },
  bard(e, t, g, n) {
    if (e.ult >= 100 && (t.boss || g.filter(p => !p.dead && hpPct(p) < .5).length >= 2) && tryUse(e, 'crescendo', e)) return true;
    if (upkeepBuffs(e, g, true)) return true;
    if (mezAdd(e, t, g, 'lullaby')) return true;
    if (n >= 3 && S.ents.filter(m => m.mob && !m.dead && !cc(m) && dist(m, e) < 8 && !m.boss).length >= 3 && tryUse(e, 'shriek', e)) return true;
    return tryUse(e, 'chord', t);
  },
  warlock(e, t, g, n) {
    if (e.ult >= 100 && n >= 2 && tryUse(e, 'harvest', e)) return true;
    const onMe = S.ents.find(m => m.mob && !m.dead && m.target === e && !cc(m) && !m.boss);
    if (onMe && tryUse(e, 'terror', onMe)) return true;
    if ((t.boss || t.elite || t.named) && !hasBuff(t, 'weakness') && tryUse(e, 'weakness', t)) return true;
    const has = id => t.buffs.some(b => b.id === id + ':' + e.id);
    if (!has('corruption') && tryUse(e, 'corruption', t)) return true;
    if (!has('agony') && t.hp > e.power * 3 && tryUse(e, 'agony', t)) return true;
    if (e.res < e.resMax * .3 && hpPct(e) > .6 && tryUse(e, 'bargain', e)) return true;
    if (Cb.enemiesNear(e, t, 8).length >= 3 && !mezNear(t, 8) && tryUse(e, 'rain', t)) return true;
    if (hpPct(e) < .6 && tryUse(e, 'drain', t)) return true;
    return tryUse(e, 'sbolt', t);
  },
  binder(e, t) {
    const pets = Cb.petsOf(e);
    if (e.ult >= 100 && (t.boss || t.elite || t.named) && pets.length >= 2 && tryUse(e, 'unbound', e)) return true;
    if (pets.some(p => hpPct(p) < .5) && tryUse(e, 'mendbond', e)) return true;
    if (pets.length >= 2 && tryUse(e, 'empower', e)) return true;
    if (pets.length >= 2 && tryUse(e, 'primal', t)) return true;
    if (S.ents.some(m => m.mob && !m.dead && m.target === e && !cc(m)) && tryUse(e, 'fourward', e)) return true;
    return tryUse(e, 'lash', t);
  },
  illusionist(e, t, g, n) {
    if (e.ult >= 100 && groupFoes(g).filter(m => !m.boss && !cc(m)).length >= 4 && tryUse(e, 'grand', e)) return true;
    if (S.ents.some(m => m.mob && !m.dead && m.target === e && !cc(m)) && (tryUse(e, 'mirror', e) || tryUse(e, 'fade', e))) return true;
    if (mezAdd(e, t, g, 'mez')) return true;
    if ((t.boss || t.elite || t.named) && !hasBuff(t, 'slowed') && tryUse(e, 'slow', t)) return true;
    if (!t.buffs.some(b => b.id === 'phantasm:' + e.id) && t.hp > e.power * 4 && tryUse(e, 'phantasm', t)) return true;
    return tryUse(e, 'spike', t);
  },
  // healers fight only when there's nothing to heal
  cleric: (e, t) => tryUse(e, 'smite', t),
  aegis: (e, t) => tryUse(e, 'judgment', t),
  lifebinder: (e, t) => tryUse(e, 'thorn', t),
  druid(e, t, g, n) {
    if (n >= 3 && !mezNear(t, 8) && tryUse(e, 'starfall', t)) return true;
    if (n >= 3 && !mezNear(t, 7) && tryUse(e, 'hurricane', t)) return true;
    const chaser = S.ents.find(m => m.mob && !m.dead && !cc(m) && m.target && isHealer(m.target) && g.includes(m.target) && !Cb.rooted(m) && !m.boss);
    if (chaser && tryUse(e, 'entangle', chaser)) return true;
    if (!t.buffs.some(b => b.id === 'moonfire:' + e.id) && tryUse(e, 'moonfire', t)) return true;
    return false;
  },
};
// crowd control: put to sleep an enemy nobody is fighting, and keep it asleep
function mezAdd(e, t, g, key) {
  const foes = groupFoes(g);
  if (foes.length < 2) return false;
  const tank = g.find(p => isTank(p) && !p.dead);
  const main = (tank && tank.target) || S.hero.target || t;
  const cand = foes.filter(m => m !== main && !m.boss && !m.named && dist(m, e) < 28 && !g.some(p => p !== e && p.casting && p.casting.tgt === m))
    .find(m => { const b = m.buffs.find(x => x.data.mez); return !b || b.t < 3; });
  if (!cand) return false;
  if (key === 'mez' && foes.filter(m => m !== main && !m.boss && !cc(m) && dist(m, cand) < 8).length >= 3 && tryUse(e, 'massmez', cand)) return true;
  if (tryUse(e, key, cand)) { if (e.inParty && Math.random() < .25) chat('party', e.name, `mezzing ${cand.name}`); return true; }
  return false;
}
function fight(e, t, group) {
  const n = Cb.enemiesNear(e, e, 9).filter(m => !cc(m)).length;
  const brain = BRAINS[e.cls];
  return brain ? brain(e, t, group, n) : false;
}
// a healer's whole turn: returns true if it did something
function healerTurn(e, group, inFight) {
  const live = group.filter(p => !p.dead && dist(p, e) < 34 && (p.cls || (p.pet && p.pet.role === 'tank')));
  if (!live.length) return false;
  const mana = e.res / e.resMax;
  const low = live.slice().sort((a, b) => hpPct(a) - hpPct(b))[0];
  const tank = group.find(p => isTank(p) && !p.dead) || live.find(p => p.pet);
  const nLow = th => live.filter(p => hpPct(p) < th).length;
  const busy = p => group.some(o => o !== e && isHealer(o) && !o.dead && o.casting && o.casting.tgt === p);
  if (S.ents.some(m => m.mob && !m.dead && m.target === e) && tryUse(e, 'fade', e)) return true;
  if (e.cls === 'cleric') {
    const other = group.find(p => p !== e && p.cls === 'cleric' && !p.dead && p.casting && p.casting.tgt);
    if (e.ult >= 100 && nLow(.35) >= 2 && tryUse(e, 'miracle', e)) return true;
    if (tank && hpPct(tank) < .25 && inFight && tryUse(e, 'guardian', tank)) return true;
    if (nLow(.6) >= 3 && tryUse(e, 'prayer', e)) return true;
    if (nLow(.65) >= 3 && tryUse(e, 'sanct', e)) return true;
    if (low && hpPct(low) < .35 && !(other && other.casting.tgt === low && other.casting.key === 'flash') && tryUse(e, 'flash', low)) return true;
    if (tank && hpPct(tank) < .55 && mana > .45 && !(other && other.casting.key === 'complete') && inFight && tryUse(e, 'complete', tank)) return true;
    if (low && hpPct(low) < .78 && !busy(low) && tryUse(e, 'mend', low)) return true;
  } else if (e.cls === 'aegis') {
    if (e.ult >= 100 && nLow(.4) >= 2 && tryUse(e, 'divine', e)) return true;
    if (nLow(.45) >= 3 && tryUse(e, 'barrier', e)) return true;
    if (nLow(.72) >= 3 && tryUse(e, 'echoes', e)) return true;
    if (tank && inFight && !hasBuff(tank, 'reflect') && tryUse(e, 'reflect', tank)) return true;
    if (tank && inFight && !hasBuff(tank, 'ward') && tryUse(e, 'ward', tank)) return true;
    if (tank && inFight && hpPct(tank) < .55 && tryUse(e, 'bastion', tank)) return true;
    if (tank && inFight && hpPct(tank) < .7 && live.filter(p => dist(p, tank) < 8).length >= 3 && tryUse(e, 'rune', tank)) return true;
    if (low && hpPct(low) < .45 && tryUse(e, 'purge', low)) return true;
    if (low && hpPct(low) < .6 && !hasBuff(low, 'ward') && tryUse(e, 'ward', low)) return true;
    if (low && hpPct(low) < .72 && !busy(low) && tryUse(e, 'word', low)) return true;
  } else if (e.cls === 'lifebinder') {
    const hasHot = (p, id) => hasBuff(p, id);
    if (e.ult >= 100 && nLow(.45) >= 2 && tryUse(e, 'treeoflife', e)) return true;
    if (nLow(.55) >= 3 && tryUse(e, 'tranq', e)) return true;
    if (nLow(.8) >= 3 && tryUse(e, 'wild', e)) return true;
    if (tank && inFight && !hasBuff(tank, 'lifebloom') && tryUse(e, 'lifebloom', tank)) return true;
    if (low && hpPct(low) < .45 && low.buffs.some(b => b.data.hot) && tryUse(e, 'swift', low)) return true;
    if (low && hpPct(low) < .4 && !busy(low) && tryUse(e, 'bloom', low)) return true;
    if (tank && inFight && !hasHot(tank, 'renew') && tryUse(e, 'renew', tank)) return true;
    const r1 = live.find(p => hpPct(p) < .85 && !hasHot(p, 'renew')); if (r1 && tryUse(e, 'renew', r1)) return true;
    const r2 = live.find(p => hpPct(p) < .7 && !hasHot(p, 'rejuv')); if (r2 && tryUse(e, 'rejuv', r2)) return true;
  } else if (e.cls === 'druid') {
    if (e.ult >= 100 && inFight && groupFoes(group).some(f => f.boss || f.elite || f.named) && tryUse(e, 'nature', e)) return true;
    if (low && hpPct(low) < .55 && !busy(low) && tryUse(e, 'touch', low)) return true;
    if (tank && inFight && hpPct(tank) < .9 && !hasBuff(tank, 'regrowth') && tryUse(e, 'grow', tank)) return true;
    const r = live.find(p => hpPct(p) < .75 && !hasBuff(p, 'regrowth')); if (r && tryUse(e, 'grow', r)) return true;
  }
  if (!inFight && e.cls === 'cleric') { const dead = group.find(p => p.dead && p.cls && dist(p, e) < 24); if (dead && tryUse(e, 'rez', dead)) { chat('party', e.name, `rezzing ${dead.name}`); return true; } }
  return false;
}
// the ability each puller opens with
export const PULL_AB = { bulwark: 'taunt', wardancer: 'challenge', bladewarden: 'callout', monk: 'provoke', bard: 'chord' };

// ---------- your companions ----------
export function companionAI(e, dt) {
  const hero = S.hero, group = S.party;
  if (e.dead || e.onBoat) return;
  if (Cb.ccd(e)) { stopMove(e, dt); return; }
  if (e.casting) { stopMove(e, dt); if (e.casting.tgt && e.casting.tgt !== e) face(e, e.casting.tgt, dt); return; }
  if (escapeDanger(e, dt)) return;
  const role = CLASSES[e.cls].role;
  const allFoes = groupFoes(group);
  const foes = allFoes.filter(m => !cc(m)).length ? allFoes.filter(m => !cc(m)) : allFoes;
  const inFight = foes.length > 0 && S.cmd !== 'hold';
  // pull order: go and open on the target from range, then run back to the group
  if (e.pull) {
    const p = e.pull, ab = PULL_AB[e.cls];
    if (p.phase === 'go') {
      const rng = Math.min(20, (CLASSES[e.cls].abilities[ab]?.range || 20)) - 1.5, d = p.tgt ? dist(e, p.tgt) : 0;
      if (!p.tgt || p.tgt.dead) { e.pull = null; }
      else if (p.tgt.threat?.has(e) || (d < rng && !blocked(e.x, e.z, p.tgt.x, p.tgt.z) && tryUse(e, ab, p.tgt))) { p.phase = 'back'; chat('party', e.name, pick(CHAT.pull).replace('{t}', p.tgt.name)); }
      else if (d < 3.5) { face(e, p.tgt, dt); Cb.addThreat(p.tgt, e, 10); e.anim.atk = 1; } // ability not ready: body pull
      else goTo(e, p.tgt.x, p.tgt.z, dt, d < rng + 4 ? 2.5 : rng - .5);
      return;
    }
    if (p.phase === 'back') { if (dist(e, p.spot) < 4 || goTo(e, p.spot.x, p.spot.z, dt, 3)) e.pull = null; else return; }
  }
  const ord = S.campOrder;
  if (!inFight && ord && ord.mode === 'hunt' && ord.tank === e) {
    const t = ord.next && !ord.next.dead && !ord.next.remove ? ord.next : null;
    if (!t) {
      if (ord.rest) { stopMove(e, dt); rest(e); return; }
      if (ord.wait) { if (Math.hypot(e.x - ord.wait.x, e.z - ord.wait.z) > 5) { e.sit = false; goTo(e, ord.wait.x, ord.wait.z, dt, 4, .8); } else { stopMove(e, dt); rest(e); } return; }
      stopMove(e, dt); return;
    }
    e.sit = false;
    if (dist(e, t) > 3.2) { goTo(e, t.x, t.z, dt, 2.4, .85); return; }
    face(e, t, dt); e.target = t;
    if (!tryUse(e, PULL_AB[e.cls], t)) { Cb.addThreat(t, e, 10); e.anim.atk = 1; }
    return;
  }
  if (!inFight && ord && ord.mode === 'clear' && ord.tank === e) {
    const left = S.ents.filter(m => m.mob && !m.dead && !m.remove && isEnemy(e, m) && !m.charmed && Math.hypot(m.x - ord.c.x, m.z - ord.c.z) < ord.r).sort((a, b) => dist(a, e) - dist(b, e));
    const t = left[0];
    if (t) {
      e.sit = false;
      if (dist(e, t) > 3.2) { goTo(e, t.x, t.z, dt, 2.4, .9); return; }
      face(e, t, dt); e.target = t;
      if (!tryUse(e, PULL_AB[e.cls], t)) { Cb.addThreat(t, e, 10); e.anim.atk = 1; }
      return;
    }
  }
  if (inFight) {
    e.sit = false;
    if (role === 'healer') {
      if (healerTurn(e, group, true)) { stopMove(e, dt); return; }
      if (upkeepBuffs(e, group, true)) return;
      const tank = group.find(p => isTank(p) && !p.dead) || hero, boss = foes.find(f => f.boss) || foes[0];
      const idle = e.cls === 'druid' ? e.res > e.resMax * .4 && !group.some(p => !p.dead && hpPct(p) < .75) : e.res > e.resMax * .6 && !group.some(p => !p.dead && hpPct(p) < .9);
      if (standBehind(e, boss, tank, 18, dt) && idle) { e.target = boss; fight(e, boss, group); }
      return;
    }
    let t;
    const tank = group.find(p => isTank(p) && !p.dead && p !== e);
    if (role === 'tank') {
      t = (e.target && !e.target.dead && foes.includes(e.target)) ? e.target : null;
      const htgt = hero.target && foes.includes(hero.target) ? hero.target : null;
      if (!t) t = htgt || foes.slice().sort((a, b) => dist(a, e) - dist(b, e))[0];
    } else {
      // adds chewing on a healer come first, then whatever you or the tank are hitting
      const onHealer = foes.find(f => f.target && isHealer(f.target) && group.includes(f.target) && !f.boss && !cc(f));
      t = (S.cmd === 'assist' && hero.target && foes.includes(hero.target)) ? hero.target : onHealer ? onHealer : (tank && tank.target && foes.includes(tank.target)) ? tank.target : (hero.target && foes.includes(hero.target)) ? hero.target : foes[0];
      // songs and crowd control don't wait for threat
      if (e.cls === 'bard' && upkeepBuffs(e, group, true)) return;
      if ((e.cls === 'illusionist' || e.cls === 'bard') && mezAdd(e, t, group, e.cls === 'illusionist' ? 'mez' : 'lullaby')) return;
      // wait for the tank to build some threat, and back off when close to pulling it
      if (tank && !tank.dead) {
        const tt = t.threat.get(tank) || 0, mine = t.threat.get(e) || 0;
        const tankOn = dist(tank, t) < 8;
        if (tankOn && tt < 20 && S.time - (t.engT || (t.engT = S.time)) < 1.5 && !t.boss) { stopMove(e, dt); return; }
        if (tankOn && mine > tt * .92 && t.target !== e) { stopMove(e, dt); e.autoOn = false; return; }
      }
    }
    e.target = t;
    const C0 = CLASSES[e.cls];
    if (role === 'tank') {
      if (dist(e, t) > C0.range + t.r - .3) { goTo(e, t.x, t.z, dt, C0.range + t.r - .6); return; }
      stopMove(e, dt); face(e, t, dt); e.autoOn = true;
      // turn the boss away from the group
      if (t.boss) { const g = groupCenter(group, e); const a = angTo(g, t); const px = t.x + Math.sin(a) * (t.r + 2), pz = t.z + Math.cos(a) * (t.r + 2); if (Math.hypot(px - e.x, pz - e.z) > 1.5) moveToward(e, px, pz, dt, .8, .7); }
      fight(e, t, group);
      return;
    }
    if (meleeClass(e)) {
      // melee damage: get behind the target (out of cleaves, and where backstabs land)
      const reach = C0.range + t.r - .5;
      let px = t.x, pz = t.z;
      if (t.target !== e) { const sideA = t.yaw + Math.PI + ((e.id % 3) - 1) * .5; px = t.x + Math.sin(sideA) * (t.r + 1.4); pz = t.z + Math.cos(sideA) * (t.r + 1.4); }
      const far = Math.hypot(px - e.x, pz - e.z);
      if (dist(e, t) > reach || (far > 1.2 && t.target !== e && (e.stuckT || 0) < .8)) { goTo(e, px, pz, dt, .4); if (dist(e, t) <= reach) { e.autoOn = true; fight(e, t, group); } return; }
      stopMove(e, dt); face(e, t, dt); e.autoOn = true;
      fight(e, t, group);
      return;
    }
    // ranged: stand back, behind the boss's facing
    const want = e.cls === 'longwatch' ? 22 : 20;
    let settled;
    if (t.boss) settled = standBehind(e, t, group.find(p => isTank(p) && !p.dead), want, dt);
    else if (dist(e, t) > want + 4 || blocked(e.x, e.z, t.x, t.z)) { goTo(e, t.x, t.z, dt, blocked(e.x, e.z, t.x, t.z) ? 2 : want); settled = false; }
    else { stopMove(e, dt); settled = true; }
    face(e, t, dt);
    if (settled) { e.autoOn = e.cls === 'longwatch'; fight(e, t, group); }
    return;
  }
  // out of combat
  e.autoOn = false;
  if (healerTurnOoc(e, group)) return;
  if (upkeepBuffs(e, group)) return;
  // follow in formation, rest when the group rests
  const slot = group.indexOf(e), a = formYaw() + Math.PI + (slot - 3) * .5, r = 3 + (slot % 2) * 1.6;
  const fx = hero.x + Math.sin(a) * r, fz = hero.z + Math.cos(a) * r;
  if (S.cmd === 'hold' && e.holdAt) { if (moveToward(e, e.holdAt.x, e.holdAt.z, dt, .6)) rest(e); return; }
  // a companion that falls far behind or stays stuck on a wall catches up
  if ((e.stuckT || 0) > 2.5 && dist(e, hero) > 6) e.followStuck = (e.followStuck || 0) + dt; else e.followStuck = 0;
  if (dist(e, hero) > 45 || e.followStuck > 1.5) { e.x = fx + rnd(-1, 1); e.z = fz + rnd(-1, 1); e.y = hgt(e.x, e.z); e.stuckT = 0; e.followStuck = 0; e.navT = 0; }
  const far = Math.hypot(fx - e.x, fz - e.z);
  // start moving only when you're well off your spot, then walk until you're on it
  if (far > 2.6) e.following = true; else if (far < .9) e.following = false;
  if (e.following) goTo(e, fx, fz, dt, .7, far > 8 ? 1.3 : far < 3.5 ? Math.max(.6, Math.min(1, (hero.moving || 0) + .2)) : 1);
  else { e.moving = Math.max(0, e.moving - dt * 6); rest(e); }
}
// the way the group faces: follows where you walk, and holds still while you stand
let fYaw = null, fX = 0, fZ = 0;
function formYaw() {
  const h = S.hero; if (fYaw === null) { fYaw = h.yaw; fX = h.x; fZ = h.z; }
  const dx = h.x - fX, dz = h.z - fZ, d = Math.hypot(dx, dz);
  if (d > 2) { const want = Math.atan2(dx, dz); fYaw = fYaw + wrapA(want - fYaw) * .35; fX = h.x; fZ = h.z; }
  return fYaw;
}
function healerTurnOoc(e, group) { if (CLASSES[e.cls].role !== 'healer' || e.casting) return false; return healerTurn(e, group, false); }
function rest(e) {
  const low = e.hp < e.maxHp * .8 || (e.resType === 'mana' && e.res < e.resMax * .7);
  if (low && !e.sit && S.hero.moving < .1) { e.sit = true; if (e.resType === 'mana' && e.res < e.resMax * .35 && (!e.oomT || S.time - e.oomT > 40)) { e.oomT = S.time; chat('party', e.name, pick(CHAT.oom)); } }
  if (e.sit && (S.hero.moving > .3) && !(e.resType === 'mana' && e.res < e.resMax * .2)) e.sit = false;
}
function groupCenter(group, not) { let x = 0, z = 0, n = 0; for (const p of group) if (p !== not && !p.dead) { x += p.x; z += p.z; n++; } return n ? { x: x / n, z: z / n } : { x: not.x, z: not.z }; }
// healers and ranged stand at range on the far side from the tank (out of the cleave)
// returns true when settled (close enough to its spot to fight)
function standBehind(e, foe, tank, rng, dt) {
  if (!foe) return true;
  let a;
  if (tank && foe.boss) a = angTo(tank, foe) + ((e.id % 5) - 2) * .25;
  else a = angTo(foe, e);
  // shorten the range until the spot is in the open, not behind a wall
  let px, pz;
  for (const k of [1, .75, .55, .4, .3]) { px = foe.x + Math.sin(a) * rng * k; pz = foe.z + Math.cos(a) * rng * k; if (!blocked(foe.x, foe.z, px, pz) && !inDanger(px, pz)) break; }
  if (e.casting?.tgt) face(e, e.casting.tgt, dt);
  const far = Math.hypot(px - e.x, pz - e.z);
  if (far > 2.5 && (e.stuckT || 0) < .8) { goTo(e, px, pz, dt, 1); return far < 6 && !blocked(e.x, e.z, foe.x, foe.z) && dist(e, foe) < 28 && e.cls === 'longwatch'; }
  stopMove(e, dt); return true;
}

// ---------- pets: elementals, treants, mirror images, charmed enemies ----------
export function petAI(e, dt) {
  const P = e.pet, o = P.owner;
  if (e.charmed && S.time > e.charmed.until) { Cb.endCharm(e); return; }
  if (!e.charmed && ((P.until && S.time > P.until) || o.dead || o.remove)) { e.dead = true; e.remove = true; R.burst(e.x, e.y + 1, e.z, 14, [.8, .8, .9], 2, .6, .5); return; }
  e.attackT = (e.attackT || 0) - dt; e.tauntT = (e.tauntT || 0) - dt; e.healT = (e.healT || 0) - dt;
  if (Cb.ccd(e)) { stopMove(e, dt); return; }
  const group = Cb.partyOf(o);
  if (P.role === 'decoy') { stopMove(e, dt); return; }
  const foes = groupFoes(group).filter(m => !cc(m));
  // the water spirit heals
  if (P.role === 'healer' && e.healT <= 0) {
    const low = group.filter(p => !p.dead && dist(p, e) < 25).sort((a, b) => hpPct(a) - hpPct(b))[0];
    if (low && hpPct(low) < .8) { e.healT = 3.5; e.anim.atk = 1; heal(e, low, e.power * 1.8 + 10); R.burst(low.x, low.y + 1, low.z, 12, [.4, .7, 1], 1.5, .6, .5); return; }
  }
  let t = o.target && !o.target.dead && isEnemy(e, o.target) && (o.target.engaged || o.autoOn || o.casting) && !cc(o.target) ? o.target : null;
  if (P.role === 'tank') { const loose = foes.find(m => m.target && m.target !== e && !isTank(m.target)); if (loose) t = loose; }
  if (!t) t = foes.slice().sort((a, b) => dist(a, e) - dist(b, e))[0];
  if (!t || dist(o, t) > 45) {
    // follow the owner
    const a = o.yaw + Math.PI + ((e.id % 4) - 1.5) * .6, fx = o.x + Math.sin(a) * 3.2, fz = o.z + Math.cos(a) * 3.2;
    if (Math.hypot(fx - e.x, fz - e.z) > 1.5) goTo(e, fx, fz, dt, .8, 1.15); else stopMove(e, dt);
    if (dist(e, o) > 50) { e.x = o.x; e.z = o.z; }
    return;
  }
  e.target = t;
  if (P.role === 'tank' && e.tauntT <= 0 && topThreat(t) !== e) { Cb.taunt(e, t); e.tauntT = 8; }
  const ranged = P.ranged || (e.mob && MOBS[e.mob].ranged), rng = ranged ? 16 : 2.2 + t.r;
  if (dist(e, t) > rng || (ranged && blocked(e.x, e.z, t.x, t.z))) { goTo(e, t.x, t.z, dt, rng - .5); return; }
  stopMove(e, dt); face(e, t, dt);
  if (e.attackT <= 0) {
    e.anim.atk = 1; e.attackT = PETS[P.key]?.swing || 2;
    if (ranged) Cb.bolt(e, t, e.power, P.school || 'shadow');
    else damage(e, t, e.power, 'phys', { threat: P.role === 'tank' ? 2.5 : 1 });
  }
}

// ---------- fake players out in the world ----------
const AREAS = () => (world.huntAreas || [{ area: 0, lvl: [1, 3] }, { area: 1, lvl: [3, 5] }, { area: 2, lvl: [5, 8] }, { area: 3, lvl: [7, 10] }])
  .map(a => ({ lvl: a.lvl, pts: world.spawns.filter(s => s.area === a.area && !s.dungeon) }));
let areaCache = null;
export function fakeAI(e, dt) {
  const f = e.fake;
  if (e.inParty) return companionAI(e, dt);
  if (e.dead) { if (S.time - e.deadT > 20) { Cb.revive(e, 1); const tw = world.town; e.x = tw.x + rnd(-4, 4); e.z = tw.z + rnd(-4, 4); e.y = hgt(e.x, e.z); f.state = 'town'; f.until = S.time + rnd(20, 60); if (Math.random() < .3) chat('gen', e.name, pick(CHAT.wipe)); } return; }
  if (e.casting) { stopMove(e, dt); return; }
  // group followers do what their leader does
  const lead = f.group && f.group[0] !== e ? f.group[0] : null;
  const group = f.group || [e];
  // fighting
  const foes = groupFoes(group).filter(m => !cc(m));
  if (foes.length) {
    const role = CLASSES[e.cls].role;
    if (role === 'healer' && healerTurn(e, group, true)) { stopMove(e, dt); return; }
    const t = (lead && lead.target && foes.includes(lead.target)) ? lead.target : foes.includes(e.target) ? e.target : foes[0];
    e.target = t;
    const C0 = CLASSES[e.cls], ml = meleeClass(e), want = ml ? C0.range + t.r - .4 : 20;
    if (dist(e, t) > want + (ml ? .3 : 4)) goTo(e, t.x, t.z, dt, want);
    else { stopMove(e, dt); face(e, t, dt); e.autoOn = true; fight(e, t, group); }
    return;
  }
  e.autoOn = false;
  if (upkeepBuffs(e, group)) return;
  if (CLASSES[e.cls].role === 'healer' && healerTurn(e, group, false)) return;
  if (lead) {
    if (lead.dead) return;
    const a = lead.yaw + Math.PI + (group.indexOf(e) - 1.5) * .6;
    const fx = lead.x + Math.sin(a) * 3, fz = lead.z + Math.cos(a) * 3;
    if (Math.hypot(fx - e.x, fz - e.z) > 1.2) goTo(e, fx, fz, dt, .8, 1.15); else if (e.hp < e.maxHp * .7 || (e.resType === 'mana' && e.res < e.resMax * .5)) e.sit = true;
    return;
  }
  // rest when hurt
  if (e.hp < e.maxHp * .6 || (e.resType === 'mana' && e.res < e.resMax * .4) || (e.sit && (e.hp < e.maxHp * .95 || (e.resType === 'mana' && e.res < e.resMax * .9)))) { if (e.moving < .1) { e.sit = true; return; } }
  e.sit = false;
  if (f.state === 'town') {
    if (!f.spot || goTo(e, f.spot.x, f.spot.z, dt, .5, .5)) {
      if (!f.idleT || f.idleT < S.time) { f.idleT = S.time + rnd(3, 12); const tw = world.town; const a = rnd(0, TAU), r = rnd(3, tw.R - 6); f.spot = { x: tw.x + Math.cos(a) * r, z: tw.z + Math.sin(a) * r }; }
    }
    if (S.time > f.until) { f.state = 'hunt'; f.area = pickArea(e); f.until = S.time + rnd(150, 420); f.spot = null; }
    return;
  }
  if (f.state === 'hunt') {
    if (S.time > f.until) { f.state = 'home'; return; }
    // find something to kill near the hunting spot
    if (!f.spot) { if (f.area === undefined || f.area === null || !areaCache || areaCache.seed !== world.seed + world.zone) f.area = pickArea(e); const pts = (areaCache[f.area] || areaCache[0] || { pts: [] }).pts; const p = pick(pts) || { x: 0, z: 40 }; f.spot = { x: p.x + rnd(-6, 6), z: p.z + rnd(-6, 6) }; }
    if (!f.prey || f.prey.dead || f.prey.evading || (f.prey.engaged && !group.some(g => f.prey.threat.has(g)))) {
      f.prey = null;
      if ((f.scanT = (f.scanT || 0) - dt) <= 0) {
        f.scanT = 1;
        let best = null, bd = 30;
        for (const m of S.ents) if (m.mob && !m.dead && !m.engaged && !m.evading && !m.boss && !m.named && m.lvl <= e.lvl + (group.length > 2 ? 2 : 0) && m.lvl >= e.lvl - 3 && !m.dungeon) { const dd = dist(m, e); if (dd < bd) { bd = dd; best = m; } }
        f.prey = best;
      }
    }
    if (f.prey) {
      const C0 = CLASSES[e.cls], ml = meleeClass(e), want = ml ? C0.range : 22;
      if (dist(e, f.prey) > want) goTo(e, f.prey.x, f.prey.z, dt, want - .5);
      else { e.target = f.prey; if (ml || e.cls === 'longwatch') { e.autoOn = true; addThreat(f.prey, e, 1); } fight(e, f.prey, group) || addThreat(f.prey, e, 1); }
      return;
    }
    if (goTo(e, f.spot.x, f.spot.z, dt, 2)) f.spot = null;
    return;
  }
  if (f.state === 'home') {
    const tw = world.town;
    if (goTo(e, tw.x + (e.id % 5) - 2, tw.z + (e.id % 3) - 1, dt, 4)) { f.state = 'town'; f.until = S.time + rnd(40, 160); if (f.group && f.group[0] === e) disbandFake(f.group); }
  }
}
function pickArea(e) { if (!areaCache || areaCache.seed !== world.seed + world.zone) { areaCache = AREAS(); areaCache.seed = world.seed + world.zone; } let best = 0, bd = 99; areaCache.forEach((a, i) => { const d = e.lvl < a.lvl[0] ? a.lvl[0] - e.lvl : e.lvl > a.lvl[1] ? e.lvl - a.lvl[1] : 0; if (d < bd && a.pts.length) { bd = d; best = i; } }); return best; }
export function disbandFake(g) { for (const m of g) if (m.fake) m.fake.group = null; }
