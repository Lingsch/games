// Build 11: hard modes. At level 30 every instanced dungeon and raid gets a hard version: everything in it is
// your level (30 now, up to 50 as the cap rises) and elite, tougher and meaner, with the week's two affixes.
// Every hard run is timed. Beat the par time for a bonus chest, and your time goes on a leaderboard against the
// fake guilds. Hard bosses pay Valor, which buys the sky's best sets from the Trials page.
import { S, X, chat, pick, rnd, clamp, dist } from './core.js';
import { MOBS, GUILDS } from './data.js';
import { world, registerZone, zoneGen, ZONE_SIZE } from './world.js';
import { INSTANCES, DBOSSES, FINALS } from './dungeons.js';
import { LFG_D } from './social6.js';
import * as Social from './social6.js';
import * as Cb from './combat.js';
import * as Game from './game.js';
import * as Loot5 from './loot5.js';

const H = () => (S.ext.hard = S.ext.hard || { valor: 0, best: {}, runs: 0 });
export const hardLvl = () => clamp(S.hero?.lvl || 30, 30, 50);
export const isHard = (z = S.zone) => !!z && z.startsWith('x_');
const isRaid = k => X.RAIDS?.has(k) || k === 'between';
// ---------- the week's affixes ----------
export const AFFIXES = {
  fortified: ['Fortified', 'Enemies that aren\'t bosses have 30% more health and hit 20% harder.'],
  tyrannical: ['Tyrannical', 'Bosses have 30% more health and hit 15% harder.'],
  enraged: ['Enraged', 'Enemies that aren\'t bosses go into a frenzy below 30% health.'],
  bolstering: ['Bolstering', 'When an enemy dies, the enemies near it grow stronger.'],
  bursting: ['Bursting', 'When an enemy dies, it bursts, hurting your whole group a little. It adds up.'],
  volcanic: ['Volcanic', 'Fire erupts under your group\'s feet during fights. Keep moving.'],
};
const WEEK = 6048e5, weekNo = () => Math.floor((Date.now() + 3 * 864e5) / WEEK);
export function affixes() { const keys = Object.keys(AFFIXES), w = weekNo(); return [['fortified', 'tyrannical'][w % 2], keys.slice(2)[(w * 3) % 4]]; }
const has = a => isHard() && affixes().includes(a);

// ---------- making the hard versions ----------
const HARD = {};
function makeHard(k) {
  if (HARD[k] || !INSTANCES[k] || !zoneGen(k) || !DBOSSES[k] || k.startsWith('h_') || k.startsWith('x_') || ['house', 'ghall', 'plot', 'fleet', 'spire'].includes(k) || k.startsWith('bg_')) return;
  const xk = 'x_' + k, raid = isRaid(k), base = INSTANCES[k];
  HARD[k] = { xk, raid, name: base.name || LFG_D[k]?.name?.replace(/ \(.*\)$/, '') || k };
  ZONE_SIZE[xk] = ZONE_SIZE[k] || 150;
  INSTANCES[xk] = { parent: base.parent, out: base.out || { x: 0, z: 0 }, name: `Hard: ${HARD[k].name}` };
  registerZone(xk, seed => { const w = zoneGen(k)(seed); world.names = { ...world.names, zone: `Hard: ${HARD[k].name}` }; const L = hardLvl();
    for (const s of world.spawns) { s.lvl = [L, L]; s.elite = true; s.hard = true; if (raid) s.raid12 = true; }
    for (const z of world.zoneLines) { z.to = INSTANCES[xk].parent; z.label = 'Leave the hard run'; }
    return w; });
  const r24 = !!X.RAID24?.has(k); LFG_D[xk] = { name: `Hard: ${HARD[k].name}${raid ? (r24 ? ' (24-person raid)' : ' (12-person raid)') : ''}`, lvl: [30, 50], zone: xk, raid: raid ? hardWhy : undefined, raid24: r24, hard: true };
  X.gate[xk] = hardWhy; if (raid) { X.RAIDS.add(xk); }
  DBOSSES[xk] = DBOSSES[k];
}
export function hardWhy() { if ((S.hero?.lvl || 0) < 30) return 'Hard modes open at level 30.'; return null; }
// build the list once everything else has loaded
let built = false;
export function buildHard() { if (built) return; built = true; for (const k of Object.keys(INSTANCES)) makeHard(k); }

// ---------- inside a hard run ----------
let run = null;
X.zone.push(zone => {
  buildHard();
  if (!isHard(zone)) { run = null; return; }
  const k = zone.slice(2), bosses = (DBOSSES[k] || []).length, par = Math.round((HARD[k]?.raid ? 6 : 4) * bosses * 60 + 120);
  run = { k, t: 0, par, killed: 0, done: false };
  const [a, b] = affixes();
  chat('sys', null, `${INSTANCES[zone].name}. Everything here is level ${hardLvl()}. This week: ${AFFIXES[a][0]} and ${AFFIXES[b][0]}. Par time: ${fmt(par)}.`);
});
const fmt = s => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
X.spawned = X.spawned || [];
X.spawned.push((e, sp) => {
  if (!isHard() || !sp.hard) return;
  const boss = e.boss || e.boss2 || e.named;
  e.hpMul = 1.5 * (has('fortified') && !boss ? 1.3 : 1) * (has('tyrannical') && boss ? 1.3 : 1);
  e.dmgMul = 1.25 * (has('fortified') && !boss ? 1.2 : 1) * (has('tyrannical') && boss ? 1.15 : 1);
  Cb.recalc(e); e.hp = e.maxHp; e.hard = true;
});
let vT = 0;
X.tick.push(dt => {
  if (!run || !isHard()) return;
  run.t += dt;
  // enraged: the wounded go wild
  if (has('enraged')) for (const m of S.ents) if (m.hard && !m.dead && !m.boss && !m.named && !m.enragedA && m.hp < m.maxHp * .3) { m.enragedA = true; Cb.buff(m, 'enrage', 999, { pow: .5 }); }
  // volcanic: fire under your feet in a fight
  if (has('volcanic') && (vT -= dt) <= 0) { vT = rnd(6, 9); if (S.party.some(p => Cb.inCombat(p))) { const v = pick(S.party.filter(p => !p.dead)); if (v) S.dangers.push({ kind: 'circle', x: v.x + rnd(-1, 1), z: v.z + rnd(-1, 1), r: 3, t: 5, pool: true, dps: .07, col: '#ff6a1a' }); } }
});
X.kill.push(m => {
  if (!run || !m.hard) return;
  if (has('bolstering')) for (const o of S.ents) if (o.hard && !o.dead && !o.boss && o !== m && dist(o, m) < 20) { o.hpMul = (o.hpMul || 1) * 1.2; o.dmgMul = (o.dmgMul || 1) * 1.2; const f = o.hp / o.maxHp; Cb.recalc(o); o.hp = Math.round(o.maxHp * f); }
  if (has('bursting') && !m.boss) { run.burst = (run.burst || 0) + 1; setTimeout(() => { if (!run) return; run.burst = Math.max(0, run.burst - 1); }, 4000); for (const p of S.party) if (!p.dead) Cb.damage(m, p, p.maxHp * .03 * Math.min(4, run.burst), 'shadow', { noThreat: true }); }
  if (!(m.boss || m.boss2 || m.named)) return;
  const fin = FINALS.includes(m.mob) || m.boss, v = fin ? (HARD[run.k]?.raid ? 40 : 15) : HARD[run.k]?.raid ? 12 : 5;
  H().valor += v; chat('loot', null, `+${v} Valor.`);
  if (!fin || run.done) return;
  run.done = true; H().runs++;
  const t = Math.round(run.t), best = H().best[run.k];
  if (!best || t < best) H().best[run.k] = t;
  if (t <= run.par) {
    H().valor += v; const it = Loot5.setPieceFor(S.heroCls, HARD[run.k]?.raid ? 12 : 11); if (Game.addToBag(it)) chat('loot', null, `In time! The bonus chest holds ${it.name}, and another ${v} Valor.`);
    X.ui?.toast?.(`Timed! ${fmt(t)} (par ${fmt(run.par)})`);
  } else chat('sys', null, `Done in ${fmt(t)}. Par was ${fmt(run.par)}. No bonus chest this time.`);
  const rank = board(run.k).findIndex(r => r.you) + 1; chat('sys', null, `You stand ${rank}${['st', 'nd', 'rd'][rank - 1] || 'th'} on the ${HARD[run.k].name} board this week.`);
  Game.save();
});
// hard bosses drop level-30 sets (raids: the best)
X.hardTier = () => isHard() ? (HARD[S.zone.slice(2)]?.raid ? 12 : 11) : null;

// ---------- leaderboards: you against the fake guilds ----------
export function board(k) {
  const h = HARD[k]; if (!h) return [];
  const par = Math.round((h.raid ? 6 : 4) * (DBOSSES[k] || []).length * 60 + 120), w = weekNo();
  let seed = 0; for (const c of k + w) seed = (seed * 31 + c.charCodeAt(0)) | 0;
  const rng = () => { seed = (seed * 1103515245 + 12345) | 0; return ((seed >>> 0) % 10000) / 10000; };
  const rows = [...GUILDS, 'Lamplighters', 'Sky Fleet Irregulars'].map(g => ({ who: `<${g}>`, t: Math.round(par * (.62 + rng() * .55)) }));
  const mine = H().best[k]; if (mine) rows.push({ who: S.ext.guild ? `You, <${S.ext.guild.name}>` : 'You', t: mine, you: true });
  return rows.sort((a, b) => a.t - b.t);
}

// ---------- the Trials page ----------
const COST = { 11: 120, 12: 300 };
X.book.push(['trials', 'Trials', body => {
  buildHard();
  const { el, esc, toast, refreshSheet } = X.ui, [a, b] = affixes();
  body.appendChild(el(`<div class="card" style="text-align:left"><h3>This week</h3><p style="font-size:13px;margin:2px 0"><b>${AFFIXES[a][0]}:</b> ${esc(AFFIXES[a][1])}</p><p style="font-size:13px;margin:2px 0"><b>${AFFIXES[b][0]}:</b> ${esc(AFFIXES[b][1])}</p><p style="font-size:13px;margin:4px 0 0">Valor: <b>${H().valor}</b> · hard runs finished: ${H().runs}</p></div>`));
  const shop = el(`<div class="card" style="text-align:left"><h3>The Trial-Master's stores</h3><p style="font-size:13px">A set piece for your class: the sky's dungeon sets for ${COST[11]} Valor, the raid sets for ${COST[12]}.</p><div class="acts"><button data-t="11">Dungeon set piece</button><button data-t="12">Raid set piece</button></div></div>`);
  shop.onclick = ev => { const t = +ev.target.dataset?.t; if (!t) return; if (H().valor < COST[t]) return toast('Not enough Valor.'); const it = Loot5.setPieceFor(S.heroCls, t); if (!Game.addToBag(it)) return; H().valor -= COST[t]; chat('loot', null, `You buy ${it.name}.`); refreshSheet(); };
  body.appendChild(shop);
  for (const [k, h] of Object.entries(HARD)) {
    const rows = board(k), mineI = rows.findIndex(r => r.you), best = H().best[k];
    const c = el(`<div class="card" style="text-align:left"><h3>${esc(h.name)}${h.raid ? ' <small>(raid)</small>' : ''}</h3><p style="font-size:12px;margin:2px 0">${rows.slice(0, 3).map((r, i) => `${i + 1}. ${esc(r.who)} ${fmt(r.t)}`).join(' · ')}${mineI >= 3 ? ` · … ${mineI + 1}. You ${fmt(best)}` : ''}</p><div class="acts"><button ${(S.hero?.lvl || 0) < 30 ? 'disabled' : ''}>${(S.hero?.lvl || 0) < 30 ? 'Level 30' : 'Find a group'}</button></div></div>`);
    c.querySelector('button').onclick = () => { const r = Social.queue(h.xk); if (r) toast(r); else toast('Looking for a group…'); refreshSheet(); };
    body.appendChild(c);
  }
}, () => S.hero && S.hero.lvl >= 25]);

// every instance that exists by now (this file loads last) gets its hard version
buildHard();
