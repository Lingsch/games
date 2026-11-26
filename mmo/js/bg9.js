// Build 9: battlegrounds against fake players. Queue from the Battlegrounds page (or the group finder); your
// group is filled out with fake players, and the other side is a rival company of them.
//   Ashvale Crossing: capture the flag, 6 vs 6, first to three captures.
//   The Mael Stones: hold the points, 6 vs 6 (three stones) or 12 vs 12 (five), first to 300.
//   Kingsbane Field: the war map, 12 vs 12. Two towers and a general on each side; kill theirs.
// Wins and losses pay honor, which buys gear and titles from the Battlemaster.
import { S, X, chat, pick, rnd, irnd, TAU, dist, clamp } from './core.js';
import { MOBS, CLASSES, CLASS_KEYS, FAKE_NAMES, GIVERS } from './data.js';
import { TALK } from './dialogue.js';
import { world, hgt } from './world.js';
import { INSTANCES } from './dungeons.js';
import { LFG_D } from './social6.js';
import * as Social from './social6.js';
import * as Cb from './combat.js';
import * as Game from './game.js';
import * as AI from './ai.js';
import * as Loot5 from './loot5.js';
import { defineZone } from './kit9.js';

// ---------- the other side: fake players, as fighters ----------
const ROLE = { tank: ['bulwark', 'bladewarden', 'wardancer'], healer: ['cleric', 'aegis', 'lifebinder', 'druid'], melee: ['knifeshade', 'blightblade', 'monk'], caster: ['elementalist', 'warlock', 'binder', 'longwatch', 'illusionist', 'bard'] };
Object.assign(MOBS, {
  bg_tank: { name: 'Rival Tank', kind: 'bulwark1', hpM: 2.6, dmgM: .9, spd: 6.2, range: 2.6, weak: null, resist: null, scale: 1, aggro: 22, social: 0, human: true },
  bg_healer: { name: 'Rival Healer', kind: 'cleric1', hpM: 1.8, dmgM: .7, spd: 6.2, range: 20, ranged: true, caster: true, healer: true, school: 'holy', weak: null, resist: null, scale: 1, aggro: 22, social: 0, human: true },
  bg_melee: { name: 'Rival Blade', kind: 'knifeshade1', hpM: 2, dmgM: 1.15, spd: 6.6, range: 2.4, weak: null, resist: null, scale: 1, aggro: 22, social: 0, human: true },
  bg_caster: { name: 'Rival Caster', kind: 'elem1', hpM: 1.8, dmgM: 1.1, spd: 6.2, range: 22, ranged: true, caster: true, school: 'fire', weak: null, resist: null, scale: 1, aggro: 22, social: 0, human: true },
  bg_soldier: { name: 'Kingsbane Soldier', kind: 'guard', hpM: 1.2, dmgM: .9, spd: 5.6, range: 2.4, weak: null, resist: null, scale: 1, aggro: 16, social: 0, human: true },
  bg_tower: { name: 'Watchtower', kind: 'golempet', hpM: 9, dmgM: 1.3, spd: 0, range: 24, ranged: true, caster: true, school: 'fire', weak: null, resist: null, scale: 1.8, aggro: 24, social: 0 },
  bg_general: { name: 'General Varric Kael', kind: 'bladewarden2', hpM: 4, dmgM: 1.3, spd: 5.4, range: 3, weak: null, resist: null, scale: 1.5, aggro: 18, social: 0, human: true, mechs: ['cleave', 'charge', 'call'], adds: 'bg_soldier', lines: { start: 'Kingsbane holds! Cut them down!', half: 'To me! To your general!' } },
});
const ROLE_MOB = { tank: 'bg_tank', healer: 'bg_healer', melee: 'bg_melee', caster: 'bg_caster' };
const RACES9 = ['', '', '_varr', '_grael', '_sallow'];
const BG = {
  bg_ctf: { name: 'Ashvale Crossing', size: 6, how: 'ctf', home: { x: 0, z: 160 }, away: { x: 0, z: -160 }, win: 3, time: 900 },
  bg_hold: { name: 'The Mael Stones', size: 6, how: 'hold', home: { x: -165, z: 0 }, away: { x: 165, z: 0 }, points: [[0, 0], [-60, -110], [60, 110]], win: 300, time: 1200 },
  bg_hold12: { name: 'The Mael Stones (12 vs 12)', map: 'bg_hold', size: 12, how: 'hold', home: { x: -165, z: 0 }, away: { x: 165, z: 0 }, points: [[0, 0], [-60, -110], [60, 110], [-90, 100], [90, -100]], win: 300, time: 1200 },
  bg_war: { name: 'Kingsbane Field', size: 12, how: 'war', home: { x: 0, z: 165 }, away: { x: 0, z: -165 }, time: 1800 },
};
const POINT_NAMES = ['the Heartstone', 'the Mill-Stone', 'the Grave-Stone', 'the Weeping Stone', 'the Crown-Stone'];
// ---------- the maps ----------
const field = amp => (x, z, N) => 2 + N.fbm(x * .01, z * .01, 3) * amp;
const base = (key, name, x, z, banner) => ({ key, name, x, z, R: 20, wall: 'none', houses: [[-8, -6, 0, 'tent', 3, 3], [8, -6, 0, 'tent', 3, 3]], props: [[0, 0, 'banner', banner], [-5, 4, 'banner', banner], [5, 4, 'banner', banner]], npcs: key.endsWith('h') ? [['giver', 'battlemaster', 0, 6]] : [], guards: [] });
defineZone('bg_ctf', { size: 200, seed: 9701, name: 'Ashvale Crossing', land: field(6), pal: { a: '#8a9a5a', b: '#7a8a4a', hi: '#7a7468', road: '#8a7a5a', cob: '#9a9284' },
  towns: [base('ctfh', 'The Silver Camp', 0, 160, '#3a6aaa'), base('ctfa', 'The Red Camp', 0, -160, '#aa3a2a')], roads: [[0, 140, 0, -140]], flats: [{ x: 0, z: 0, R: 30, base: 3 }],
  regions: { names: ['Ashvale Crossing'], fn: () => 0 }, landmarks: [{ g: 'stonecircle', x: 0, z: 0, s: 1.4 }, { g: 'statue', x: -60, z: 40 }, { g: 'statue', x: 60, z: -40 }], lines: [], hunt: [],
  scenery: { density: 9000, tuft: '#7a9a4a', kinds: [['oak', .02, 1, 1.8], ['dead', .004, 1, 1.4]] } });
defineZone('bg_hold', { size: 200, seed: 9702, name: 'The Mael Stones', land: field(8), pal: { a: '#7a8a5a', b: '#6a7a4a', hi: '#7a7468', road: '#8a7a5a', cob: '#9a9284' },
  towns: [base('holdh', 'The Silver Camp', -165, 0, '#3a6aaa'), base('holda', 'The Red Camp', 165, 0, '#aa3a2a')], roads: [[-145, 0, 145, 0]],
  flats: BG.bg_hold12.points.map(([x, z]) => ({ x, z, R: 10, base: 3 })), landmarks: BG.bg_hold12.points.map(([x, z]) => ({ g: 'stonecircle', x, z, s: .8, clear: 10 })),
  regions: { names: ['The Mael Stones'], fn: () => 0 }, lines: [], hunt: [], scenery: { density: 9000, tuft: '#6a8a4a', kinds: [['pine', .015, 1, 1.8], ['dead', .004, 1, 1.4]] } });
defineZone('bg_war', { size: 200, seed: 9703, name: 'Kingsbane Field', land: field(5), pal: { a: '#8a8a5a', b: '#7a7a4a', hi: '#7a7468', road: '#7a6a4a', cob: '#8a8274' },
  towns: [base('warh', 'Silver Keep', 0, 165, '#3a6aaa'), base('wara', 'Red Keep', 0, -165, '#aa3a2a')], roads: [[-70, 150, -70, -150], [70, 150, 70, -150], [0, 140, 0, -140]],
  regions: { names: ['Kingsbane Field'], fn: () => 0 }, landmarks: [{ g: 'banner', x: -40, z: 100, arg: '#3a6aaa' }, { g: 'banner', x: 40, z: 100, arg: '#3a6aaa' }, { g: 'banner', x: -40, z: -100, arg: '#aa3a2a' }, { g: 'banner', x: 40, z: -100, arg: '#aa3a2a' }], lines: [], hunt: [],
  scenery: { density: 8000, tuft: '#7a8a4a', kinds: [['dead', .006, 1, 1.6], ['bones', .004, .8, 1.2]] } });
for (const k of Object.keys(BG)) INSTANCES[k] = { parent: 'vale', name: BG[k].name, out: { x: 0, z: 0 } };
X.arriveHooks = X.arriveHooks || [];
X.arriveHooks.push((zone, from) => BG[zone] ? { x: BG[zone].home.x + rnd(-3, 3), z: BG[zone].home.z + rnd(-3, 3) } : null);
// the map for a 12-person hold match is the same map
X.zoneAlias = X.zoneAlias || {};

// ---------- queueing ----------
for (const [k, b] of Object.entries(BG)) LFG_D[k] = { name: `Battleground: ${b.name}${b.size === 6 && !b.name.includes('6') ? ' (6 vs 6)' : b.size === 12 && !b.name.includes('12') ? ' (12 vs 12)' : ''}`, lvl: [10, 25], zone: b.map || k, raid: b.size === 12 ? () => null : undefined, bg: k };
// the group finder takes you to the battleground's map; remember where you came from
const prevGo = Social.goTo;
X.zone.push(zone => {
  const key = Object.keys(BG).find(k => (BG[k].map || k) === zone && (S.ext.bgKey === k || !S.ext.bgKey && k === zone));
  if (!key) { if (M) endMatch(null, true); return; }
  startMatch(key);
});

// ---------- the match ----------
let M = null;
const H = () => S.hero;
function enemyMob(role, b, i) {
  const cls = pick(ROLE[role]), kind = CLASSES[cls].models[1 + (i % 2)] + pick(RACES9), at = b.away, x = at.x + rnd(-6, 6), z = at.z + rnd(-6, 6);
  const used = new Set(S.party.map(p => p.name)), name = pick(FAKE_NAMES.filter(n => !used.has(n))) || 'Rival';
  const m = Cb.makeMob(ROLE_MOB[role], H().lvl, { x, z, kind, name: `${name}`, title: CLASSES[cls].name, home: { x, z }, bgRole: role, bgCls: cls });
  m.y = hgt(m.x, m.z); m.bg = true; return m;
}
function startMatch(key) {
  const b = BG[key];
  M = { key, b, score: [0, 0], t: 0, over: false, enemies: [], respawn: [], points: (b.points || []).map(([x, z], i) => ({ x, z, name: POINT_NAMES[i], owner: 0, prog: 0 })), flag: { ours: 'home', theirs: 'home', carrier: null, theirCarrier: null }, waveT: 20, towers: [] };
  S.ext.bgKey = key;
  const n = b.size, roles = n === 6 ? ['tank', 'healer', 'melee', 'caster', 'caster', 'melee'] : ['tank', 'tank', 'healer', 'healer', 'healer', 'melee', 'melee', 'melee', 'caster', 'caster', 'caster', 'caster'];
  roles.forEach((r, i) => M.enemies.push(enemyMob(r, b, i)));
  if (b.how === 'war') {
    for (const [side, z, zz] of [[1, b.away.z + 65, b.away.z], [0, b.home.z - 65, b.home.z]]) {
      for (const x of [-40, 40]) { const t = side ? Cb.makeMob('bg_tower', H().lvl, { x, z, home: { x, z }, named: 'tower', name: (side ? 'Red' : 'Silver') + ' Watchtower', elite: true }) : Cb.makeEnt({ team: 'ally', name: 'Silver Watchtower', kind: 'golempet', x, z, guard: true, lvl: H().lvl + 2, maxHp: 30000, hp: 30000, power: 120 + H().lvl * 12, armor: 400, spd: 0, scale: 1.8, home: { x, z }, townC: { x, z, R: 24 } });
        t.y = hgt(t.x, t.z); t.bgTower = side ? 'theirs' : 'ours'; M.towers.push(t); }
      if (side) { const g = Cb.makeMob('bg_general', H().lvl + 2, { x: 0, z: zz, home: { x: 0, z: zz }, named: 'bg_general', boss: true }); g.y = hgt(g.x, g.z); M.general = g; }
      else { const g = Cb.makeEnt({ team: 'ally', name: 'Marshal Odessa Vane', title: 'Your general', kind: 'bulwark2', x: 0, z: zz, guard: true, lvl: H().lvl + 2, maxHp: 60000, hp: 60000, power: 200 + H().lvl * 14, armor: 600, spd: 6, scale: 1.4, home: { x: 0, z: zz }, townC: { x: 0, z: zz, R: 30 } }); g.y = hgt(g.x, g.z); M.ourGeneral = g; }
    }
  }
  chat('sys', null, `${b.name} begins! ${b.how === 'ctf' ? 'Take their banner from the Red Camp and bring it home. First to three.' : b.how === 'hold' ? 'Hold the standing stones. First to 300.' : 'Break their towers and kill their general. Protect yours.'}`);
}
function endMatch(won, quiet) {
  if (!M) return; const b = M.b, key = M.key; M.over = true;
  for (const e of [...M.enemies, ...M.towers]) { e.dead = true; e.remove = true; } if (M.general) { M.general.remove = true; } if (M.ourGeneral) M.ourGeneral.remove = true;
  M = null; S.ext.bgKey = null;
  // the players the battlemaster found for you go their own way
  const pre = S.ext.bgPre; if (pre) { for (const p of [...S.party]) if (!p.isHero && !pre.includes(p.name)) Game.kick(p); S.ext.bgPre = null; }
  if (quiet) return;
  const L = H().lvl, honor = won ? 100 : 40, gold = (won ? 20 : 8) + L * (won ? 3 : 1);
  S.ext.honor = (S.ext.honor || 0) + honor; S.gold += gold; S.ext.bgWins = (S.ext.bgWins || 0) + (won ? 1 : 0); S.ext.bgPlayed = (S.ext.bgPlayed || 0) + 1;
  Cb.giveXp(H(), Math.round(Cb.XP_RATE * (won ? 1 : .5) * (40 + L * L * 6)));
  chat('sys', null, won ? `Victory at ${b.name}! +${honor} honor, +${gold} gold.` : won === false ? `Defeat at ${b.name}. +${honor} honor, +${gold} gold for the trying.` : `${b.name} ends in a draw. +${honor} honor.`);
  for (const [n, t] of [[10, 'title_bg_banner'], [30, 'mount_bg'], [50, 'title_bg_war']]) if (S.ext.bgWins >= n && !Loot5.owned(t)) Loot5.collect(t);
  X.ui?.toast?.(won ? 'Victory!' : won === false ? 'Defeat' : 'Draw');
  setTimeout(() => { if (Object.keys(BG).some(k => (BG[k].map || k) === S.zone)) Game.travel(INSTANCES[key].parent || 'vale', null, true); }, 6000);
}
Loot5.COLLECT.title_bg_banner = { type: 'title', name: 'the Bannerman', from: 'battlegrounds' };
Loot5.COLLECT.title_bg_war = { type: 'title', name: 'Warmaster', from: 'battlegrounds' };
Loot5.COLLECT.mount_bg = { type: 'mount', name: 'Silver Warhorse', kind: 'horse_war', spd: .85, ride: 1, from: 'battlegrounds' };
// dying in a battleground: back to your camp after a short wait, with nothing lost
X.bgRelease = () => { if (!M) return false; const h = H(); h.dead = false; h.buffs = []; h.hp = h.maxHp; h.res = h.resType === 'rage' ? 0 : h.resMax; S.dead = false; S.target = null; S.dangers = [];
  if (M.flag.carrier === h) dropFlag(); const at = M.b.home; h.x = at.x + rnd(-3, 3); h.z = at.z + rnd(-3, 3); h.y = hgt(h.x, h.z); chat('sys', null, 'You wake at your camp.'); return true; };
function dropFlag() { M.flag.carrier = null; M.flag.theirs = 'home'; Cb.dropBuff?.(H(), 'flag'); H().buffs = H().buffs.filter(b => b.id !== 'redbanner'); chat('sys', null, 'The red banner returns to its camp.'); }

// ---------- running the match ----------
let tk = 0;
X.tick.push(dt => {
  if (!M || M.over) return;
  M.t += dt; tk += dt;
  const b = M.b, h = H();
  // allies who fall get up again at camp
  for (const p of S.party) if (p !== h && p.dead) { p.bgDead = (p.bgDead || 0) + dt; if (p.bgDead > 12) { Cb.revive(p, 1); p.bgDead = 0; p.x = b.home.x + rnd(-3, 3); p.z = b.home.z + rnd(-3, 3); p.y = hgt(p.x, p.z); } }
  // the enemy's dead come back too
  for (const e of M.enemies) if (e.dead && !e.bgGone) { e.bgGone = true; if (e.bgRole !== 'soldier') M.respawn.push({ role: e.bgRole, t: 12 }); if (M.flag.theirCarrier === e) { M.flag.theirCarrier = null; M.flag.ours = 'home'; chat('sys', null, 'Your banner is returned to the Silver Camp.'); } }
  for (const r of M.respawn) r.t -= dt;
  for (const r of M.respawn.filter(r => r.t <= 0)) M.enemies.push(enemyMob(r.role, b, irnd(0, 9)));
  M.respawn = M.respawn.filter(r => r.t > 0);
  M.enemies = M.enemies.filter(e => !e.remove);
  if (b.how === 'ctf') ctf(dt, b, h); else if (b.how === 'hold') hold(dt, b, h); else war(dt, b, h);
  if (!M) return;
  if (M && tk > .5) { tk = 0; steer(.5, b); }
  if (M && M.t > b.time) endMatch(M.score[0] > M.score[1] ? true : M.score[0] < M.score[1] ? false : null);
});
// the rivals march: each one has a job, and goes to do it when nothing is in front of them
function steer(dt, b) {
  for (const e of M.enemies) {
    if (e.dead || e.engaged) continue;
    let goal = null;
    if (b.how === 'ctf') goal = e === M.flag.theirCarrier ? b.away : e.bgRole === 'tank' || e.bgRole === 'melee' ? (M.flag.carrier ? M.flag.carrier : b.home) : e.bgRole === 'healer' ? b.away : { x: 0, z: 0 };
    if (b.how === 'hold') { const mine = M.points.filter(p => p.owner !== -1); goal = (mine.sort((p, q) => dist(p, e) - dist(q, e))[0]) || pick(M.points); }
    if (b.how === 'war') goal = M.towers.find(t => t.bgTower === 'ours' && !t.dead && t.x * (e.id % 2 ? 1 : -1) >= 0) || M.towers.find(t => t.bgTower === 'ours' && !t.dead) || M.ourGeneral;
    if (!goal) continue;
    const gx = goal.x + ((e.id * 7) % 9 - 4), gz = goal.z + ((e.id * 5) % 9 - 4);
    if (Math.hypot(e.x - gx, e.z - gz) > 4) { AI.goTo(e, gx, gz, .5, 2); e.home = { x: e.x, z: e.z }; e.wander = null; }
    // in a war, the soldiers and rivals attack whatever they reach
    if (b.how === 'war' && Math.hypot(e.x - goal.x, e.z - goal.z) < 18 && !goal.dead) Cb.addThreat(e, goal, 5);
  }
}
function ctf(dt, b, h) {
  // take their banner
  if (M.flag.theirs === 'home' && !h.dead && Math.hypot(h.x - b.away.x, h.z - b.away.z) < 4) { M.flag.theirs = 'carried'; M.flag.carrier = h; Cb.buff(h, 'redbanner', 9999, { slow: .15 }, h); chat('sys', null, 'You have the red banner! Bring it home!'); X.ui?.toast?.('You have the banner!'); for (const e of M.enemies) if (!e.dead) Cb.addThreat(e, h, 3); }
  if (M.flag.carrier === h && M.flag.ours === 'home' && Math.hypot(h.x - b.home.x, h.z - b.home.z) < 5) { M.score[0]++; M.flag.carrier = null; M.flag.theirs = 'home'; h.buffs = h.buffs.filter(x => x.id !== 'redbanner'); chat('sys', null, `Captured! Silver ${M.score[0]}, Red ${M.score[1]}.`); X.ui?.toast?.('Banner captured!'); }
  // they take yours
  if (M.flag.ours === 'home') { const r = M.enemies.find(e => !e.dead && Math.hypot(e.x - b.home.x, e.z - b.home.z) < 4); if (r) { M.flag.ours = 'carried'; M.flag.theirCarrier = r; chat('sys', null, `${r.name} has taken the silver banner! Stop them!`); X.ui?.toast?.('They have your banner!'); } }
  const tc = M.flag.theirCarrier; if (tc && !tc.dead && Math.hypot(tc.x - b.away.x, tc.z - b.away.z) < 5) { M.score[1]++; M.flag.theirCarrier = null; M.flag.ours = 'home'; chat('sys', null, `They captured your banner. Silver ${M.score[0]}, Red ${M.score[1]}.`); }
  if (M.score[0] >= b.win) endMatch(true); else if (M.score[1] >= b.win) endMatch(false);
}
function hold(dt, b, h) {
  for (const p of M.points) {
    const us = S.party.filter(e => !e.dead && Math.hypot(e.x - p.x, e.z - p.z) < 9).length, them = M.enemies.filter(e => !e.dead && Math.hypot(e.x - p.x, e.z - p.z) < 9).length;
    if (us && !them && p.owner !== 1) { p.prog += dt; if (p.prog > 6) { p.owner = 1; p.prog = 0; chat('sys', null, `You hold ${p.name}.`); } }
    else if (them && !us && p.owner !== -1) { p.prog += dt; if (p.prog > 6) { p.owner = -1; p.prog = 0; chat('sys', null, `The Red Company has taken ${p.name}.`); } }
    else p.prog = Math.max(0, p.prog - dt);
  }
  M.tick = (M.tick || 0) + dt; if (M.tick >= 2) { M.tick = 0; for (const p of M.points) { if (p.owner === 1) M.score[0] += 2; if (p.owner === -1) M.score[1] += 2; } }
  if (M.score[0] >= b.win) endMatch(true); else if (M.score[1] >= b.win) endMatch(false);
}
function war(dt, b, h) {
  // waves of soldiers march from their keep every 45 seconds
  if ((M.waveT -= dt) <= 0) { M.waveT = 45; for (let i = 0; i < 4; i++) { const x = (i % 2 ? 1 : -1) * 70 + rnd(-4, 4), z = b.away.z + 30; const s = Cb.makeMob('bg_soldier', Math.max(1, H().lvl - 1), { x, z, home: { x, z } }); s.y = hgt(s.x, s.z); s.bgRole = 'soldier'; s.bg = true; M.enemies.push(s); } }
  M.score = [M.towers.filter(t => t.bgTower === 'theirs' && t.dead).length + (M.general?.dead ? 3 : 0), M.towers.filter(t => t.bgTower === 'ours' && t.dead).length + (M.ourGeneral?.dead ? 3 : 0)];
  if (M.general?.dead) endMatch(true); else if (M.ourGeneral?.dead) endMatch(false);
}

// ---------- the Battlegrounds page and the Battlemaster ----------
GIVERS.battlemaster = { name: 'Battlemaster Orrin Greaves', title: 'Battlegrounds · honor', model: 'bladewarden0' };
TALK.battlemaster = { bio: 'Orrin Greaves fought in four wars and won two of them. Now he runs mock battles for the eight kingdoms, and says it is the same thing with fewer funerals.', greet: ['Win or lose, you learn something. Mostly you learn where not to stand.', 'Honor is the only coin nobody can steal from you. Spend it here.'], topics: [] };
const honorItem = () => { const L = H().lvl, tier = L >= 25 ? 8 : L >= 22 ? 7 : L >= 20 ? 5 : L >= 15 ? 3 : L >= 10 ? 1 : 0; return Loot5.setPieceFor(S.heroCls, tier); };
X.book.push(['bg', 'Battle', body => {
  const { el, esc, toast, refreshSheet } = X.ui;
  body.appendChild(el(`<p style="margin:0 0 6px">Honor: <b>${S.ext.honor || 0}</b> · wins ${S.ext.bgWins || 0} of ${S.ext.bgPlayed || 0}</p>`));
  if (M) { body.appendChild(el(`<div class="card" style="text-align:left"><h3>${esc(M.b.name)}</h3><p>Silver ${M.score[0]} · Red ${M.score[1]}${M.b.how === 'hold' ? '<br>' + M.points.map(p => `${p.owner === 1 ? '🔵' : p.owner === -1 ? '🔴' : '⚪'} ${esc(p.name)}`).join(' · ') : ''}${M.b.how === 'ctf' ? `<br>Your banner: ${M.flag.ours === 'home' ? 'safe' : 'taken!'} · Theirs: ${M.flag.carrier ? 'you have it' : 'in their camp'}` : ''} · ${Math.max(0, Math.round((M.b.time - M.t) / 60))} min left</p><div class="acts"><button>Leave the battle</button></div></div>`));
    body.lastChild.querySelector('button').onclick = () => { const k = M.key; endMatch(false); refreshSheet(); }; }
  else for (const [k, b] of Object.entries(BG)) {
    const c = el(`<div class="who"><div><b>${esc(b.name)}</b> <small>${b.size} vs ${b.size} · ${b.how === 'ctf' ? 'capture the flag' : b.how === 'hold' ? 'hold the points' : 'towers and a general'}</small></div><button ${H().lvl < 10 ? 'disabled' : ''}>${H().lvl < 10 ? 'Level 10' : 'Queue'}</button></div>`);
    c.querySelector('button').onclick = () => { S.ext.bgPre = S.party.map(p => p.name); INSTANCES[k].parent = S.zone; INSTANCES[k].out = { x: H().x, z: H().z }; if (b.map) { INSTANCES[b.map].parent = S.zone; INSTANCES[b.map].out = { x: H().x, z: H().z }; } S.ext.bgKey = k; const m = Social.queue(k); if (m) toast(m); refreshSheet(); };
    body.appendChild(c);
  }
  const cost = 150, c2 = el(`<div class="card" style="text-align:left"><h3>The Battlemaster's stores</h3><p style="font-size:13px">A set piece for your level and class, for ${cost} honor. Ten wins earns a title, thirty a warhorse, and fifty another title.</p><div class="acts"><button ${(S.ext.honor || 0) >= cost ? '' : 'disabled'}>Buy (${cost} honor)</button></div></div>`);
  c2.querySelector('button').onclick = () => { if ((S.ext.honor || 0) < cost) return; const it = honorItem(); if (!Game.addToBag(it)) return toast('Your bags are full.'); S.ext.honor -= cost; chat('loot', null, `You buy ${it.name}.`); refreshSheet(); };
  body.appendChild(c2);
}, () => S.hero && S.hero.lvl >= 10]);
