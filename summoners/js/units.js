// Every creature on the field lives in these flat arrays. One loop moves, fights and paints the land.
import * as THREE from './three.js';
import { S, WH, TAU, clamp, rnd } from './core.js';
import { MAXU, hordes, shadows, arrows, magic, dust, glowGeo, GLOWN, cellT, TT, TS, paint } from './render.js';
import { hgt, world } from './world.js';
import * as Game from './game.js';
import { M } from './progress.js';
import { AURA } from './upgrades.js';

// el: which order group (squad) a summon answers to. land: what it leaves on the ground. col: its spark colour.
const FIRE = [1, .45, .12], WATER = [.35, .75, 1], EARTH = [1, .75, .3], AIR = [.72, .55, 1], WILD = [1, .78, .3], DEAD = [.55, 1, .35];
export const K = [
  { name: 'Fire Spirit', hp: 6, dmg: 2.5, spd: 7, r: .45, s: 1, stride: 1.2, el: 0, land: 1, col: FIRE, cd: .8, life: 40, floats: 1, glow: [.22, .08, .015, 2.6] },
  { name: 'Undine', hp: 8, dmg: 1.2, spd: 6, r: .45, s: 1, stride: 1.2, el: 1, land: 2, col: WATER, cd: .9, life: 45, heal: 1.4, floats: 1, glow: [.04, .1, .18, 2.2] },
  { name: 'Stone Golem', hp: 34, dmg: 4, spd: 4.2, r: .85, s: 1.45, stride: 1.4, el: 2, land: 3, col: EARTH, cd: 1.2, life: 80, siege: 3 },
  { name: 'Storm Sprite', hp: 3, dmg: 1.4, spd: 11, r: .38, s: .9, stride: 1, el: 3, land: 4, col: AIR, cd: .4, life: 30, floats: 1, glow: [.14, .09, .26, 1.8] },
  { name: 'Orc Brute', hp: 6, dmg: 1.5, spd: 5.2, r: .55, s: 1.12, stride: 2.1, cd: 1, xp: 3, iron: .1 },
  { name: 'Archer', hp: 4, dmg: 1.2, spd: 5, r: .45, s: 1, stride: 2.2, cd: 1.8, range: 13, xp: 3 },
  { name: 'Knight', hp: 14, dmg: 2.4, spd: 4.6, r: .6, s: 1.05, stride: 2, cd: 1.1, xp: 6, iron: .2 },
  { name: 'Dire Wolf', hp: 14, dmg: 3, spd: 8, r: .6, s: 1.15, stride: 1.7, el: 0, land: 5, col: WILD, cd: .8 },
  { name: 'Cave Bear', hp: 42, dmg: 6, spd: 5.2, r: .95, s: 1.3, stride: 1.3, el: 1, land: 5, col: WILD, cd: 1.1, siege: 2 },
  { name: 'Treant', hp: 60, dmg: 5, spd: 3.6, r: .9, s: 1.4, stride: 1.2, el: 2, land: 5, col: WILD, cd: 1.4, siege: 4 },
  { name: 'Hornet Swarm', hp: 3, dmg: 1.2, spd: 12, r: .35, s: 1, stride: 1, el: 3, land: 5, col: WILD, cd: .35, life: 35, floats: 1 },
  { name: 'Skeleton', hp: 5, dmg: 1.8, spd: 6, r: .45, s: 1, stride: 2.2, el: 0, land: 6, col: DEAD, cd: .9, rot: .03 },
  { name: 'Ghoul', hp: 10, dmg: 2.5, spd: 8, r: .5, s: 1, stride: 2.4, el: 1, land: 6, col: DEAD, cd: .7, rot: .02 },
  { name: 'Abomination', hp: 55, dmg: 5, spd: 3.8, r: 1, s: 1.3, stride: 1.3, el: 2, land: 6, col: DEAD, cd: 1.3, siege: 3 },
  { name: 'Wraith', hp: 6, dmg: 2, spd: 9, r: .4, s: 1, stride: 1, el: 3, land: 6, col: DEAD, cd: .8, life: 45, floats: 1, ghost: 1, glow: [.03, .14, .1, 2] },
  { name: 'Pikeman', hp: 10, dmg: 2, spd: 4.6, r: .5, s: 1.05, stride: 2, cd: 1.2, xp: 4, iron: .15, antiBig: 1.6 },
  { name: 'Lancer', hp: 22, dmg: 4, spd: 8.5, r: .9, s: 1.15, stride: 1.6, cd: 1.3, xp: 8, iron: .25, charge: 1 },
  { name: 'Priest', hp: 6, dmg: .8, spd: 4.4, r: .45, s: 1, stride: 2, cd: 1.5, xp: 5, heal: 2.5, crystal: .25 },
  { name: 'Crossbowman', hp: 5, dmg: 3, spd: 4.6, r: .45, s: 1, stride: 2.2, cd: 2.6, range: 16, xp: 4, iron: .1 },
  { name: 'Orc Shaman', hp: 7, dmg: 1, spd: 4.6, r: .45, s: 1, stride: 2, cd: 1.4, xp: 5, rally: 1, crystal: .25 },
  { name: 'Troll', hp: 60, dmg: 6, spd: 4, r: 1.1, s: 1.35, stride: 1.3, cd: 1.6, xp: 20, regen: 2 },
  { name: 'Magma Brute', hp: 30, dmg: 4.5, spd: 5, r: .75, s: 1.35, stride: 1.3, el: 2, land: 1, col: FIRE, cd: 1.1, life: 60, siege: 2, boom: 12, glow: [.3, .1, .02, 3] },
  { name: 'Giant Spider', hp: 9, dmg: 2.2, spd: 9, r: .6, s: 1.1, stride: 1.7, el: 0, land: 5, col: WILD, cd: .7, web: 2 },
  { name: 'Skeleton Mage', hp: 5, dmg: 2.4, spd: 5.5, r: .45, s: 1, stride: 2.2, el: 0, land: 6, col: DEAD, cd: 1.7, range: 12, proj: 4, rot: .03 }];

export const X = new Float32Array(MAXU), Z = new Float32Array(MAXU), VX = new Float32Array(MAXU), VZ = new Float32Array(MAXU);
export const HP = new Float32Array(MAXU), HPM = new Float32Array(MAXU), CD = new Float32Array(MAXU), AGE = new Float32Array(MAXU);
export const RISE = new Float32Array(MAXU), FL = new Float32Array(MAXU), SA = new Float32Array(MAXU), SB = new Float32Array(MAXU);
export const YAW = new Float32Array(MAXU), PH = new Float32Array(MAXU), ATK = new Float32Array(MAXU), LIFE = new Float32Array(MAXU);
export const AX = new Float32Array(MAXU), AZ = new Float32Array(MAXU), BD = new Float32Array(MAXU), BS = new Float32Array(MAXU);
export const BF = new Float32Array(MAXU), SLOW = new Float32Array(MAXU), SC = new Float32Array(MAXU), DM = new Float32Array(MAXU);
export const CURSE = new Float32Array(MAXU), MARK = new Float32Array(MAXU), FEAR = new Float32Array(MAXU), TGT = new Int32Array(MAXU).fill(-1);
export const SPM = new Float32Array(MAXU), ABT = new Float32Array(MAXU), CHG = new Float32Array(MAXU), ELITE = new Uint8Array(MAXU), BFL = new Uint8Array(MAXU);
export const TEAM = new Uint8Array(MAXU), KIND = new Uint8Array(MAXU), ROLE = new Uint8Array(MAXU), CITY = new Int8Array(MAXU), CAMP = new Int8Array(MAXU);
const ARRS = [X, Z, VX, VZ, HP, HPM, CD, AGE, RISE, FL, SA, SB, YAW, PH, ATK, LIFE, AX, AZ, BD, BS, BF, SLOW, SC, DM, SPM, CURSE, MARK, FEAR, TGT, ABT, CHG, ELITE, BFL, TEAM, KIND, ROLE, CITY, CAMP];
export const U = { N: 0 };

export const ENEMY_HP = 1.35, ENEMY_DMG = 1.25;   // enemies got tougher when the skill tree went away
export function spawn(team, kind, x, z, o = {}) {
  if (U.N >= MAXU) return -1;
  const i = U.N++, st = K[kind];
  X[i] = clamp(x, -WH + 2, WH - 2); Z[i] = clamp(z, -WH + 2, WH - 2); VX[i] = VZ[i] = 0;
  HPM[i] = HP[i] = st.hp * (o.hpMul || 1); CD[i] = Math.random(); AGE[i] = 0; RISE[i] = o.rise ? 0 : 1;
  FL[i] = 0; SA[i] = Math.random(); SB[i] = Math.random(); YAW[i] = Math.random() * TAU; PH[i] = Math.random() * TAU; ATK[i] = 1;
  LIFE[i] = o.life ?? (st.life || 0); AX[i] = o.ax ?? X[i]; AZ[i] = o.az ?? Z[i];
  BD[i] = BS[i] = BF[i] = SLOW[i] = CHG[i] = CURSE[i] = MARK[i] = FEAR[i] = 0; TGT[i] = -1; ABT[i] = 3 + Math.random() * 4; BFL[i] = 0; SC[i] = o.sc || 1; DM[i] = o.dm || 1; SPM[i] = 1; ELITE[i] = 0;
  if (team === 0) { // your creatures carry your skills, gear and relics
    HPM[i] = HP[i] = HP[i] * (1 + M('hp:' + kind) + M('hp:all')); DM[i] *= 1 + M('dmg:' + kind) + M('dmg:all'); SPM[i] = 1 + M('spd:' + kind) + M('spd:all');
    if (LIFE[i] > 0) LIFE[i] = (kind === 2 && M('flag:mountain')) ? 0 : LIFE[i] * (1 + M('life:' + kind));
    HPM[i] = HP[i] = Math.max(1, HP[i]); const mu = S.kMut && S.kMut[kind]; if (mu) SC[i] *= mu.scale;
    if (o.child) BFL[i] |= 4; if (o.reborn) BFL[i] |= 8;
  } else { HPM[i] = HP[i] = HP[i] * ENEMY_HP; DM[i] *= ENEMY_DMG; }
  if (o.elite) { ELITE[i] = 1; HPM[i] = HP[i] = HP[i] * 2.5; DM[i] *= 1.5; SC[i] *= 1.25; }
  TEAM[i] = team; KIND[i] = kind; ROLE[i] = o.role || 0; CITY[i] = o.city ?? -1; CAMP[i] = o.camp ?? -1;
  return i;
}
export function remove(i) { const l = --U.N; if (i !== l) for (const a of ARRS) a[i] = a[l]; }
export function clearUnits() { U.N = 0; PN = 0; }

const CS = 4, GW = Math.ceil(2 * WH / CS);
const HEAD = new Int32Array(GW * GW), NEXT = new Int32Array(MAXU), ZONE = new Int8Array(MAXU);
const gi = v => Math.min(GW - 1, Math.max(0, ((v + WH) / CS) | 0));

export function hitUnit(j, dmg) {
  if (TEAM[j] === 0) {
    if (BS[j] > 0) dmg *= S.bMul ? S.bMul.BS : .5;
    const mu = S.kMut && S.kMut[KIND[j]]; if (mu && mu.armor) dmg *= 1 - mu.armor;
    const c = cellT(X[j], Z[j]); if (TT[c] === 3 && TS[c] > .4) dmg *= .75;
  } else { if (CURSE[j] > 0) dmg *= 1.25; if (MARK[j] > 0) dmg *= 2; if (CAMP[j] >= 0) world.camps[CAMP[j]].alert = true; }
  HP[j] -= dmg; FL[j] = 1;
}
// units of one team within r of a point, nearest first
export function unitsNear(x, z, r, team, max = 999) {
  const out = [];
  for (let i = 0; i < U.N; i++) if (TEAM[i] === team && HP[i] > 0) { const d = (X[i] - x) ** 2 + (Z[i] - z) ** 2; if (d < r * r) out.push([d, i]); }
  out.sort((a, b) => a[0] - b[0]);
  return out.slice(0, max).map(o => o[1]);
}

export function step(dt) {
  const h = S.hero, hx = h.x, hz = h.z, N = U.N, cities = world.cities, pc = S.pc;
  let fd = 32 * 32, fx = 0, fz = 0, found = false, ec = 0;
  // which walled city (if any) each unit stands inside: melee can't reach across a standing wall
  const walled = cities.filter(c => c.state === 'hostile');
  const zoneOf = (x, z) => { for (const c of walled) if ((x - c.x) ** 2 + (z - c.z) ** 2 < c.R * c.R) return c.i; return -1; };
  for (let i = 0; i < N; i++) ZONE[i] = walled.length ? zoneOf(X[i], Z[i]) : -1;
  const heroZone = walled.length ? zoneOf(hx, hz) : -1;
  pc[0] = pc[1] = pc[2] = pc[3] = 0;
  for (let i = 0; i < N; i++) {
    if (TEAM[i]) { ec++; const d2 = (X[i] - hx) ** 2 + (Z[i] - hz) ** 2; if (d2 < fd && ROLE[i] !== 1 && ZONE[i] === heroZone) { fd = d2; fx = X[i]; fz = Z[i]; found = true; } }
    else pc[K[KIND[i]].el]++;
  }
  S.ec = ec; S.pcTotal = pc[0] + pc[1] + pc[2] + pc[3];
  S.focus = found ? { x: fx, z: fz, d: Math.sqrt(fd) } : null;
  const formR = Math.sqrt(S.pcTotal + 1) * 1.1, dmgPerk = Game.stat('dmgMul');
  const near = []; for (let j = 0; j < N; j++) if (TEAM[j] === 1 && HP[j] > 0 && (X[j] - hx) ** 2 + (Z[j] - hz) ** 2 < 40 * 40) near.push(j);
  HEAD.fill(-1);
  for (let i = 0; i < N; i++) { const c = gi(Z[i]) * GW + gi(X[i]); NEXT[i] = HEAD[c]; HEAD[c] = i; }
  for (let i = 0; i < N; i++) {
    const k = KIND[i], st = K[k], t = TEAM[i];
    AGE[i] += dt; FL[i] = Math.max(0, FL[i] - dt * 5); ATK[i] = Math.min(1, ATK[i] + dt * 2.8);
    if (CURSE[i] > 0) CURSE[i] -= dt; if (MARK[i] > 0) MARK[i] -= dt;
    if (BD[i] > 0) BD[i] -= dt; if (BS[i] > 0) BS[i] -= dt; if (BF[i] > 0) BF[i] -= dt; if (SLOW[i] > 0) SLOW[i] -= dt;
    if (RISE[i] < 1) { RISE[i] = Math.min(1, RISE[i] + dt * 1.5); continue; }
    if (LIFE[i] > 0) { LIFE[i] -= dt; if (LIFE[i] <= 0) { HP[i] = 0; continue; } }
    CD[i] -= dt;
    if (st.rally) ABT[i] -= dt;
    const ri = st.r * SC[i];
    let best = -1, bd = t ? (st.range ? st.range * st.range : 30) : 22, sepx = 0, sepz = 0, n = 0;
    const gx0 = gi(X[i]), gz0 = gi(Z[i]);
    scan: for (let cz = Math.max(0, gz0 - 1); cz <= Math.min(GW - 1, gz0 + 1); cz++)
      for (let cx = Math.max(0, gx0 - 1); cx <= Math.min(GW - 1, gx0 + 1); cx++)
        for (let j = HEAD[cz * GW + cx]; j !== -1; j = NEXT[j]) {
          if (j === i) continue;
          const dx = X[j] - X[i], dz = Z[j] - Z[i], d2 = dx * dx + dz * dz;
          if (TEAM[j] !== t) { if (d2 < bd && HP[j] > 0 && (ZONE[j] === ZONE[i] || st.range || st.ghost)) { bd = d2; best = j; } }
          else if (st.heal && d2 < (t ? 16 : 6.25) && HP[j] < HPM[j]) HP[j] = Math.min(HPM[j], HP[j] + st.heal * (t ? 1 : 1 + M('heal:undine')) * dt);
          else if (st.rally && ABT[i] <= 0 && d2 < 64) BD[j] = 4;
          const rr = ri + K[KIND[j]].r * SC[j];
          if (d2 < rr * rr && d2 > 1e-6) { const d = Math.sqrt(d2), p = (rr - d) / d; sepx -= dx * p; sepz -= dz * p; }
          if (++n > 40) break scan;
        }
    if (st.rally && ABT[i] <= 0) { ABT[i] = 6; for (let q = 0; q < 8; q++) magic.emit(X[i], hgt(X[i], Z[i]) + 1.5, Z[i], rnd(-2, 2), rnd(1, 2), rnd(-2, 2), .5, .8, .55, 1, .35); }
    let toHero = false;
    if (t === 1 && !S.over) {
      const d2 = (hx - X[i]) ** 2 + (hz - Z[i]) ** 2, lim = best >= 0 ? bd : (st.range ? st.range * st.range : 30);
      if (d2 < lim && (ZONE[i] === heroZone || st.range)) { toHero = true; bd = d2; best = -1; }
    }
    const c = cellT(X[i], Z[i]), tt = TT[c], ts = TS[c];
    let gx = X[i], gz = Z[i], spd = st.spd, mode = 'follow';
    if (t === 0) {
      const ord = S.orders[st.el]; mode = ord.mode;
      if (mode === 'charge') {
        if (!S.siegeCity) { // roam the ground around you
          const an = SA[i] * TAU + S.time * .12 * (SB[i] > .5 ? 1 : -1), rr = 5 + SB[i] * 14;
          gx = hx + Math.cos(an) * rr; gz = hz + Math.sin(an) * rr;
        } else { const sc = S.siegeCity;
          if (sc.state === 'hostile') { const dx = X[i] - sc.x, dz = Z[i] - sc.z, d = Math.hypot(dx, dz) || 1; gx = sc.x + dx / d * (sc.R + 1.4); gz = sc.z + dz / d * (sc.R + 1.4); }
          else { gx = sc.x + (SA[i] - .5) * 6; gz = sc.z + (SB[i] - .5) * 6; } }
      } else if (mode === 'target') { gx = ord.x + (SA[i] - .5) * formR * 1.4; gz = ord.z + (SB[i] - .5) * formR * 1.4; }
      else if (mode === 'hold') { gx = AX[i]; gz = AZ[i]; }
      if (mode === 'follow') { const a = SA[i] * TAU, rad = Math.sqrt(SB[i]) * formR + 2; gx = hx + Math.cos(a) * rad; gz = hz + Math.sin(a) * rad; }
      if (mode === 'follow' || mode === 'charge') {
        const hunt = mode === 'charge', ax = hunt ? hx : gx, az = hunt ? hz : gz, L = hunt ? 20 : 5;
        let tg = TGT[i];
        if (tg >= 0 && (TEAM[tg] !== 1 || HP[tg] <= 0 || (X[tg] - ax) ** 2 + (Z[tg] - az) ** 2 > (L + 2) ** 2)) tg = -1;
        if (tg < 0 && ((i + S.frame) & 3) === 0) {
          let bb = 1e9;
          for (const j of near) { if ((X[j] - ax) ** 2 + (Z[j] - az) ** 2 > L * L || (ZONE[j] !== ZONE[i] && !st.ghost)) continue; const d2 = (X[j] - X[i]) ** 2 + (Z[j] - Z[i]) ** 2; if (d2 < bb) { bb = d2; tg = j; } }
        }
        TGT[i] = tg;
        if (tg >= 0) {
          const d2 = (X[tg] - X[i]) ** 2 + (Z[tg] - Z[i]) ** 2;
          if (best < 0 || d2 < bd) { best = tg; bd = d2; }
          const mu = S.kMut && S.kMut[k];   // Phasing creatures blink onto their prey
          if (mu && mu.blink && d2 > 16 && d2 < 225 && ABT[i] <= 0) {
            for (let q = 0; q < 10; q++) magic.emit(X[i], hgt(X[i], Z[i]) + 1, Z[i], rnd(-2, 2), rnd(0, 3), rnd(-2, 2), .4, .8, .7, .4, 1);
            const an = Math.random() * TAU; X[i] = X[tg] + Math.cos(an) * 1.3; Z[i] = Z[tg] + Math.sin(an) * 1.3; ABT[i] = 2.5 + Math.random();
            for (let q = 0; q < 10; q++) magic.emit(X[i], hgt(X[i], Z[i]) + 1, Z[i], rnd(-2, 2), rnd(0, 3), rnd(-2, 2), .4, .8, .7, .4, 1);
          }
        }
        if (ABT[i] > 0) ABT[i] -= dt;
      }
      if (ts > .4) { if (tt === 4) spd *= 1.25; else if (tt === 5) HP[i] = Math.min(HPM[i], HP[i] + dt); }
      if (st.rot) HP[i] -= st.rot * (1 - M('rot:' + k)) * dt;
    } else {
      const role = ROLE[i], city = CITY[i] >= 0 ? cities[CITY[i]] : null;
      if (role === 1 && city && city.state === 'hostile' && !city.sally) { gx = AX[i]; gz = AZ[i]; }
      else if (role === 2 && city) {
        gx = city.x + (SA[i] - .5) * 4; gz = city.z + (SB[i] - .5) * 4;
        if (city.state === 'owned' && (X[i] - city.x) ** 2 + (Z[i] - city.z) ** 2 < (city.R * .45) ** 2 && CD[i] <= 0 && best < 0 && !toHero) { Game.hitHeart(city, st.dmg * DM[i]); CD[i] = st.cd; ATK[i] = 0; }
      } else if ((role === 4 || role === 5) && CAMP[i] >= 0) { // camp guards hold their camp until roused, and never stray far
        const cp = world.camps[CAMP[i]];
        if ((X[i] - cp.x) ** 2 + (Z[i] - cp.z) ** 2 > 48 * 48) { gx = AX[i]; gz = AZ[i]; best = -1; toHero = false; }
        else if (cp.alert || (hx - cp.x) ** 2 + (hz - cp.z) ** 2 < 26 * 26) { gx = hx; gz = hz; }
        else { gx = AX[i]; gz = AZ[i]; }
      } else if (role === 3 && city) {
        const d2 = (hx - X[i]) ** 2 + (hz - Z[i]) ** 2;
        if (d2 < 30 * 30) { gx = hx; gz = hz; } else { gx = AX[i]; gz = AZ[i]; }
      } else { gx = hx; gz = hz; }
      if (ts > .4) { if (tt === 1) HP[i] -= dt * .4; else if (tt === 2 || tt === 5) spd *= .6; else if (tt === 6) HP[i] -= dt * .35; }
      if (SLOW[i] > 0) spd *= .5;
    }
    if (BF[i] > 0) spd *= t === 0 && S.bMul ? S.bMul.BF : 1.6;
    spd *= SPM[i]; if (CHG[i] > 0) { CHG[i] -= dt; spd *= 3; }
    const rg = t === 0 ? (S.regenK && S.regenK[k]) || 0 : st.regen; if (rg) HP[i] = Math.min(HPM[i], HP[i] + rg * dt);
    let dx = 0, dz = 0, face = null;
    const mul = t === 0 ? dmgPerk * DM[i] * (BD[i] > 0 ? (S.bMul ? S.bMul.BD : 1.6) : 1) : DM[i] * (BD[i] > 0 ? 1.4 : 1) * (CURSE[i] > 0 ? .5 : 1);
    if (st.charge && best >= 0 && bd > 16) spd *= 1.4;
    if (t === 1 && FEAR[i] > 0) { // terrified: run from the necromancer
      FEAR[i] -= dt; const d = Math.hypot(X[i] - hx, Z[i] - hz) || 1; dx = (X[i] - hx) / d; dz = (Z[i] - hz) / d; face = Math.atan2(dx, dz);
    } else if (toHero) {
      const d = Math.sqrt(bd) || 1, ux = (hx - X[i]) / d, uz = (hz - Z[i]) / d; face = Math.atan2(ux, uz);
      if (st.range && d > 2.5) { if (CD[i] <= 0) { fire(X[i], hgt(X[i], Z[i]) + 1.3, Z[i], hx, h.y + 1.2, hz, .35 + d / 30, 1, st.dmg * mul, 0); CD[i] = st.cd; ATK[i] = 0; } }
      else if (d < ri + 1) { if (CD[i] <= 0) { Game.damageHero(st.dmg * mul, i); CD[i] = st.cd; ATK[i] = 0; } }
      else { dx = ux; dz = uz; }
    } else if (best >= 0) {
      const d = Math.sqrt(bd) || 1, ux = (X[best] - X[i]) / d, uz = (Z[best] - Z[i]) / d; face = Math.atan2(ux, uz);
      if (st.range && d > 2.5) { if (CD[i] <= 0) { fire(X[i], hgt(X[i], Z[i]) + 1.3, Z[i], X[best], hgt(X[best], Z[best]) + .9, Z[best], .35 + d / 30, t, st.dmg * mul, st.proj || 0); CD[i] = st.cd / (t === 0 && S.kMut ? 1 + S.kMut[k].haste : 1); ATK[i] = 0; } }
      else if (d < ri + K[KIND[best]].r * SC[best] + .35) {
        if (CD[i] <= 0) {
          const big = st.antiBig && K[KIND[best]].s * SC[best] >= 1.3 ? st.antiBig : 1;
          hitUnit(best, st.dmg * mul * big); CD[i] = st.cd * (.85 + Math.random() * .3) / (t === 0 && S.kMut ? 1 + S.kMut[k].haste : 1); ATK[i] = 0;
          if (t === 0) { const oh = S.onHit && S.onHit[k]; if (oh) { if (oh.slow) SLOW[best] = Math.max(SLOW[best], oh.slow); if (oh.leech) HP[i] = Math.min(HPM[i], HP[i] + oh.leech); } }
          if (Math.random() < .3) { const y = hgt(X[best], Z[best]) + 1.1; magic.emit(X[best], y, Z[best], rnd(-2, 2), rnd(1, 3), rnd(-2, 2), .3, .5, 1, .8, .5, 6); }
        }
      } else { dx = ux; dz = uz; }
    } else {
      let walled = false;
      if (t === 0 && (mode === 'charge' || mode === 'target')) for (const city of cities) {
        if (city.state !== 'hostile') continue;
        const ox = X[i] - city.x, oz = Z[i] - city.z, d = Math.hypot(ox, oz);
        if (d > city.R && d < city.R + 2.3) {
          walled = true; face = Math.atan2(-ox, -oz);
          if (CD[i] <= 0) { Game.hitWall(city, st.dmg * (st.siege || 1) * (1 + M('siege:' + k) + M('siege:all')) * mul, X[i], Z[i]); CD[i] = st.cd; ATK[i] = 0; }
          break;
        }
      }
      if (!walled) {
        dx = gx - X[i]; dz = gz - Z[i];
        const d = Math.hypot(dx, dz);
        if (d < .6) dx = dz = 0; else { const f = Math.min(1, d / 3) / d; dx *= f; dz *= f; }
      }
    }
    const a = Math.min(1, dt * 6), px = X[i], pz = Z[i];
    VX[i] += (dx * spd + sepx * 6 - VX[i]) * a; VZ[i] += (dz * spd + sepz * 6 - VZ[i]) * a;
    X[i] = clamp(X[i] + VX[i] * dt, -WH + 2, WH - 2); Z[i] = clamp(Z[i] + VZ[i] * dt, -WH + 2, WH - 2);
    for (const city of cities) { // the keep is solid; walls stand until breached
      const ox = X[i] - city.x, oz = Z[i] - city.z, d = Math.hypot(ox, oz);
      if (d < 4.2) { const s = 4.2 / (d || 1); X[i] = city.x + ox * s; Z[i] = city.z + oz * s; continue; }
      if (city.state !== 'hostile' || st.ghost) continue;
      if (d > city.R + 1.5 || d < city.R - 1.5) continue;
      const inside = Math.hypot(px - city.x, pz - city.z) < city.R, lim = inside ? city.R - .7 : city.R + .7;
      if ((inside && d > lim) || (!inside && d < lim)) { const s = lim / (d || 1); X[i] = city.x + ox * s; Z[i] = city.z + oz * s; }
    }
    const sp = Math.hypot(VX[i], VZ[i]);
    PH[i] += sp * st.stride * dt;
    if (face === null && sp > .3) face = Math.atan2(VX[i], VZ[i]);
    if (face !== null) { let df = face - YAW[i]; df -= Math.round(df / TAU) * TAU; YAW[i] += df * Math.min(1, dt * 10); }
    if (t === 0 && ((i + S.frame) & 3) === 0) paint(c, st.land, st.siege ? .06 : .03);
    else if (t === 1 && ((i + S.frame) & 7) === 0 && TT[c]) TS[c] = Math.max(0, TS[c] - .003);
  }
  // the fallen
  const later = [];
  for (let i = U.N - 1; i >= 0; i--) {
    if (HP[i] > 0) continue;
    const y = hgt(X[i], Z[i]);
    if (TEAM[i] === 1) {
      const raise = Game.onEnemyDeath(i);
      if (raise) { // the necromancer's will: the fallen get up again, on your side
        const nk = raise === 3 ? 13 : raise === 2 ? 12 : 11;
        TEAM[i] = 0; KIND[i] = nk; HPM[i] = HP[i] = K[nk].hp * (1 + M('hp:' + nk) + M('hp:all')); ELITE[i] = 0; BFL[i] = 0; SPM[i] = 1; CHG[i] = 0; SLOW[i] = 0; CURSE[i] = 0; MARK[i] = 0; RISE[i] = 0; AGE[i] = 0; CD[i] = .5; FL[i] = 0; ATK[i] = 1; ROLE[i] = 0; CITY[i] = -1; CAMP[i] = -1; SC[i] = S.kMut && S.kMut[nk] ? S.kMut[nk].scale : 1; DM[i] = 1 + M('dmg:' + nk); LIFE[i] = 0;
        for (let q = 0; q < 5; q++) magic.emit(X[i] + rnd(-.3, .3), y + .2, Z[i] + rnd(-.3, .3), rnd(-.3, .3), rnd(1.5, 3), rnd(-.3, .3), rnd(.8, 1.4), rnd(.6, 1.1), .55, 1, .35);
        paint(cellT(X[i], Z[i]), 6, .5); continue;
      }
      for (let q = 0; q < 4; q++) dust.emit(X[i] + rnd(-.4, .4), y + rnd(.2, 1), Z[i] + rnd(-.4, .4), rnd(-.6, .6), rnd(.4, 1.2), rnd(-.6, .6), rnd(.6, 1), rnd(1, 1.8) * SC[i], .45, .4, .36);
    } else {
      const col = K[KIND[i]].col;
      const boom = TEAM[i] === 0 ? M('boom:' + KIND[i]) + M('boom:all') + (K[KIND[i]].boom || 0) : 0, mu = S.kMut && S.kMut[KIND[i]];
      // splitting and rising again happen once per line, so they can't snowball
      const kid = !!(BFL[i] & 4), back = !!(BFL[i] & 8);
      if (mu && mu.split && !kid) for (let q = 0; q < 2; q++) later.push([KIND[i], X[i] + rnd(-1, 1), Z[i] + rnd(-1, 1), { child: true, reborn: back, hpMul: .5, sc: .7 }]);
      if (mu && mu.rebirth && !back) later.push([KIND[i], X[i], Z[i], { rise: true, reborn: true, child: kid, sc: kid ? .7 : 1, hpMul: kid ? .5 : 1 }]);
      if (boom && mu && mu.boomR > 1) { for (let q = 0; q < 40; q++) magic.emit(X[i], y + 1, Z[i], rnd(-7, 7), rnd(1, 6), rnd(-7, 7), .6, 1.4, 1, .55, .15); }
      if (boom || (KIND[i] === 0 && M('flag:pyre')) || M('flag:burst')) { for (const j of unitsNear(X[i], Z[i], (boom ? 3.5 : 3) * (mu ? mu.boomR : 1), 1)) hitUnit(j, Math.max(4, boom)); for (let q = 0; q < 14; q++) magic.emit(X[i], y + 1, Z[i], rnd(-3, 3), rnd(1, 4), rnd(-3, 3), .5, 1, 1, .5, .12); }
      for (let q = 0; q < 6; q++) magic.emit(X[i], y + rnd(.3, 1.6), Z[i], rnd(-1.5, 1.5), rnd(.5, 2.5), rnd(-1.5, 1.5), rnd(.4, .8), rnd(.5, 1), ...col);
    }
    remove(i);
  }
  for (const [k, x, z, o] of later) { const j = spawn(0, k, x, z, { ...o, hpMul: (o.hpMul || 1) * (1 + (S.hero.level - 1) * .06) }); if (j >= 0) { for (let q = 0; q < 12; q++) magic.emit(x, hgt(x, z) + 1, z, rnd(-2, 2), rnd(1, 3), rnd(-2, 2), .5, 1, ...K[k].col); } }
}

// ---------- projectiles ----------
const PMAX = 600, PG = 14;
const PX = new Float32Array(PMAX), PY = new Float32Array(PMAX), PZ = new Float32Array(PMAX), PVX = new Float32Array(PMAX), PVY = new Float32Array(PMAX), PVZ = new Float32Array(PMAX);
const PT = new Float32Array(PMAX), PD = new Float32Array(PMAX), PDMG = new Float32Array(PMAX), PAOE = new Float32Array(PMAX);
const PTEAM = new Uint8Array(PMAX), PK = new Uint8Array(PMAX);
let PN = 0;
// kind: 0 arrow, 1 fireball, 2 ember bolt (hero), 3 spire bolt
export function fire(x, y, z, tx, ty, tz, dur, team, dmg, kind, aoe = 0) {
  if (PN >= PMAX) return;
  const i = PN++;
  PX[i] = x; PY[i] = y; PZ[i] = z; PT[i] = 0; PD[i] = dur; PTEAM[i] = team; PDMG[i] = dmg; PK[i] = kind; PAOE[i] = aoe;
  PVX[i] = (tx - x) / dur; PVZ[i] = (tz - z) / dur; PVY[i] = (ty - y) / dur + (kind === 0 ? .5 * PG * dur : 0);
}
function impact(i) {
  const x = PX[i], z = PZ[i], team = PTEAM[i], foe = team ? 0 : 1, dmg = PDMG[i];
  if (PAOE[i] > 0) { for (const j of unitsNear(x, z, PAOE[i], foe)) hitUnit(j, dmg); }
  else {
    let best = -1, bd = 1.6 * 1.6;
    const gx0 = gi(x), gz0 = gi(z);
    for (let cz = Math.max(0, gz0 - 1); cz <= Math.min(GW - 1, gz0 + 1); cz++) for (let cx = Math.max(0, gx0 - 1); cx <= Math.min(GW - 1, gx0 + 1); cx++)
      for (let j = HEAD[cz * GW + cx]; j !== -1; j = NEXT[j]) { if (j >= U.N || TEAM[j] !== foe) continue; const d2 = (X[j] - x) ** 2 + (Z[j] - z) ** 2; if (d2 < bd) { bd = d2; best = j; } }
    if (best >= 0) hitUnit(best, dmg);
  }
  if (team === 1 && (S.hero.x - x) ** 2 + (S.hero.z - z) ** 2 < 1.6 * 1.6) Game.damageHero(dmg);
  if (PK[i] === 1) Game.fireballImpact(x, z, PAOE[i]);
  else if (PK[i] !== 0) for (let q = 0; q < 6; q++) magic.emit(x, PY[i], z, rnd(-2, 2), rnd(0, 2.5), rnd(-2, 2), .35, .6, 1, .55, .15);
}
export function updateProjectiles(dt) {
  for (let i = PN - 1; i >= 0; i--) {
    PT[i] += dt; if (PK[i] === 0) PVY[i] -= PG * dt;
    PX[i] += PVX[i] * dt; PY[i] += PVY[i] * dt; PZ[i] += PVZ[i] * dt;
    if (PK[i] === 1 && Math.random() < .9) magic.emit(PX[i], PY[i], PZ[i], rnd(-.5, .5), rnd(-.2, .8), rnd(-.5, .5), .4, 1.1, 1, .5, .12);
    if (PK[i] >= 2 && Math.random() < .6) { if (PK[i] === 4) magic.emit(PX[i], PY[i], PZ[i], 0, .3, 0, .25, .5, .5, 1, .3); else magic.emit(PX[i], PY[i], PZ[i], 0, .3, 0, .25, .5, 1, .6, .2); }
    if (PT[i] >= PD[i]) {
      impact(i);
      const l = --PN; if (i !== l) for (const a of [PX, PY, PZ, PVX, PVY, PVZ, PT, PD, PDMG, PAOE, PTEAM, PK]) a[i] = a[l];
    }
  }
}

// ---------- drawing ----------
const tmpM = new THREE.Matrix4(), tmpQ = new THREE.Quaternion(), tmpE = new THREE.Euler(), tmpV = new THREE.Vector3(), one = new THREE.Vector3(1, 1, 1);
export function draw() {
  const cnt = new Array(K.length).fill(0);
  const ma = hordes.map(h => h.mesh.instanceMatrix.array), aa = hordes.map(h => h.anim.array), sa = shadows.instanceMatrix.array;
  const gp = glowGeo.attributes.position.array, gc = glowGeo.attributes.pcol.array, gs = glowGeo.attributes.size.array;
  let gn = 0;
  const glow = (x, y, z, r, g, b, s) => { if (gn >= GLOWN) return; gp[gn * 3] = x; gp[gn * 3 + 1] = y; gp[gn * 3 + 2] = z; gc[gn * 3] = r; gc[gn * 3 + 1] = g; gc[gn * 3 + 2] = b; gs[gn] = s; gn++; };
  for (let i = 0; i < U.N; i++) {
    const k = KIND[i], idx = cnt[k]++, o = idx * 16, m = ma[k], an = aa[k];
    const s = K[k].s * SC[i] * (.5 + .5 * RISE[i]), gy = hgt(X[i], Z[i]);
    let y = gy - 1.8 * (1 - RISE[i]) * K[k].s * SC[i];
    const floats = K[k].floats;
    if (floats) y += .25 + Math.sin(AGE[i] * 3 + SA[i] * 9) * .18;
    const c = Math.cos(YAW[i]) * s, sn = Math.sin(YAW[i]) * s;
    m[o] = c; m[o + 1] = 0; m[o + 2] = -sn; m[o + 3] = 0; m[o + 4] = 0; m[o + 5] = s; m[o + 6] = 0; m[o + 7] = 0;
    m[o + 8] = sn; m[o + 9] = 0; m[o + 10] = c; m[o + 11] = 0; m[o + 12] = X[i]; m[o + 13] = y; m[o + 14] = Z[i]; m[o + 15] = 1;
    const sp = Math.hypot(VX[i], VZ[i]);
    an[idx * 4] = PH[i] + (floats ? AGE[i] * 3 : 0); an[idx * 4 + 1] = floats ? .6 : Math.min(1, sp / 2.5); an[idx * 4 + 2] = ATK[i]; an[idx * 4 + 3] = FL[i];
    const so = i * 16, ss = K[k].r * SC[i] * 2.8 * RISE[i];
    sa[so] = ss; sa[so + 1] = 0; sa[so + 2] = 0; sa[so + 3] = 0; sa[so + 4] = 0; sa[so + 5] = 1; sa[so + 6] = 0; sa[so + 7] = 0;
    sa[so + 8] = 0; sa[so + 9] = 0; sa[so + 10] = ss; sa[so + 11] = 0; sa[so + 12] = X[i]; sa[so + 13] = gy + .04; sa[so + 14] = Z[i]; sa[so + 15] = 1;
    if (ELITE[i]) glow(X[i], y + 1.2 * SC[i], Z[i], .35, .26, .05, 3.5 * SC[i]);
    if (TEAM[i] === 0 && S.kMut) { const mu = S.kMut[k]; if (mu && mu.aura) { const g = AURA[mu.aura]; glow(X[i], y + .9 * SC[i], Z[i], g[0], g[1], g[2], 2.6 * SC[i]); }
      if (mu && mu.trail && (VX[i] * VX[i] + VZ[i] * VZ[i]) > 4 && Math.random() < .5) magic.emit(X[i], y + .8 * SC[i], Z[i], -VX[i] * .2, .3, -VZ[i] * .2, .35, .8, .85, .9, 1); }
    if (K[k].glow) { const g = K[k].glow; glow(X[i], y + 1.5, Z[i], g[0], g[1], g[2], g[3]); }
    if (k === 0) { if (Math.random() < .06) magic.emit(X[i] + rnd(-.3, .3), y + 2, Z[i] + rnd(-.3, .3), rnd(-.3, .3), rnd(1.5, 3), rnd(-.3, .3), rnd(.5, .9), rnd(.3, .6), 1, .55, .15, -1); }
    if (BD[i] > 0) glow(X[i], y + 1, Z[i], .3, .07, 0, 2.4 * SC[i]);
    if (CURSE[i] > 0) glow(X[i], y + 1, Z[i], .16, .05, .26, 2.4 * SC[i]);
    if (MARK[i] > 0) { glow(X[i], y + 1.2, Z[i], .2, .4, .15, 3.4 * SC[i]); glow(X[i], y + 3.2, Z[i], .15, .3, .1, 1.6); }
    if (BS[i] > 0) glow(X[i], y + .8, Z[i], .2, .14, .03, 2.8 * SC[i]);
    if (BF[i] > 0 && Math.random() < .08) magic.emit(X[i], y + .6, Z[i], -VX[i] * .3, .3, -VZ[i] * .3, .4, .5, .7, .55, 1);
  }
  hordes.forEach((h, k) => {
    h.mesh.count = cnt[k]; h.ol.count = S.outlines ? cnt[k] : 0;
    for (const [at, w] of [[h.mesh.instanceMatrix, 16], [h.anim, 4]]) {
      if (at.clearUpdateRanges) { at.clearUpdateRanges(); at.addUpdateRange(0, Math.max(1, cnt[k]) * w); }
      at.needsUpdate = true;
    }
  });
  shadows.count = U.N; shadows.instanceMatrix.needsUpdate = true;
  // projectiles
  let an = 0;
  for (let i = 0; i < PN; i++) {
    if (PK[i] === 0) {
      tmpE.set(-Math.atan2(PVY[i], Math.hypot(PVX[i], PVZ[i])), Math.atan2(PVX[i], PVZ[i]), 0, 'YXZ'); tmpQ.setFromEuler(tmpE);
      tmpM.compose(tmpV.set(PX[i], PY[i], PZ[i]), tmpQ, one); arrows.setMatrixAt(an++, tmpM);
    } else if (PK[i] === 1) glow(PX[i], PY[i], PZ[i], .9, .4, .1, 5);
    else if (PK[i] === 4) glow(PX[i], PY[i], PZ[i], .25, .7, .2, 2.2);
    else glow(PX[i], PY[i], PZ[i], .7, .35, .1, 2.2);
  }
  arrows.count = an; arrows.instanceMatrix.needsUpdate = true;
  Game.drawGlows(glow);
  glowGeo.setDrawRange(0, gn);
  for (const a of ['position', 'pcol', 'size']) glowGeo.attributes[a].needsUpdate = true;
}
