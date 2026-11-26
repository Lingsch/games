// Build 10: open-world PvP against the fake players' rival guilds, in the three level 20-25 lands.
//   Contested ground: one region in each land is fought over. Rival war parties roam it and attack on sight.
//   The PvP flag: turn it on and you earn more, and rival hunters come looking for you anywhere in the open world.
//   Guild wars: each land has an outpost. Take it for your guild (power and experience in that land), and hold it
//   when the guild you took it from comes back for it.
import { S, X, chat, pick, rnd, irnd, TAU, dist } from './core.js';
import { CLASSES, FAKE_NAMES } from './data.js';
import { world, hgt, ZONE_SIZE } from './world.js';
import { INSTANCES } from './dungeons.js';
import * as Cb from './combat.js';
import * as Game from './game.js';
import * as AI from './ai.js';
import * as Loot5 from './loot5.js';
import { addKinds } from './render.js';
import { GEO } from './kit9.js';

const LANDS = { deep: { area: 2, post: 'The Glimmering Outpost' }, north: { area: 2, post: 'The Frozen Field Outpost' }, crown: { area: 2, post: 'The Blackwater Outpost' } };
export const RIVALS = ['The Crimson Hand', 'The Iron Oath', 'The Wolves of Kael', 'The Gravecallers'];
const ROLE = { tank: ['bulwark', 'bladewarden', 'wardancer'], healer: ['cleric', 'aegis', 'lifebinder', 'druid'], melee: ['knifeshade', 'blightblade', 'monk'], caster: ['elementalist', 'warlock', 'binder', 'longwatch', 'illusionist', 'bard'] };
const ROLE_MOB = { tank: 'bg_tank', healer: 'bg_healer', melee: 'bg_melee', caster: 'bg_caster' };
const RACE_SUF = ['', '', '_varr', '_grael', '_sallow'];
addKinds({ pvp_banner: [GEO.banner('#aa3a2a'), [0, 0, 0, 0], 0, .03], pvp_mybanner: [GEO.banner('#3a6aaa'), [0, 0, 0, 0], 0, .03], pvp_tent: [GEO.tent('#7a2a2a'), [0, 0, 0, 0], 0, .03] });
const st = () => (S.ext.pvp = S.ext.pvp || { on: false, since: 0, kills: 0, posts: {} });
const posts = () => st().posts;
const H = () => S.hero;
const L = () => H().lvl;
const openWorld = () => !INSTANCES[S.zone] && !(world.towns || []).some(t => Math.hypot(H().x - t.x, H().z - t.z) < (t.R || 20) + 8);
const inContested = () => LANDS[S.zone] && world.regionFn && world.regionFn(H().x, H().z) === LANDS[S.zone].area;
const myGuild = () => S.ext.guild?.name || null;

// a rival player, as a fighter
function rival(role, x, z, guild, tag) {
  const cls = pick(ROLE[role]), used = new Set(S.ents.filter(e => !e.dead).map(e => e.name)), name = pick(FAKE_NAMES.filter(n => !used.has(n))) || 'Rival';
  const m = Cb.makeMob(ROLE_MOB[role], Math.min(25, L() + irnd(0, 1)), { x, z, kind: CLASSES[cls].models[1 + irnd(0, 1)] + pick(RACE_SUF), name, title: `<${guild}>`, home: { x, z } });
  m.y = hgt(m.x, m.z); m.pvp = tag; m.guild = guild; m.cls2 = cls; return m;
}
const party = (n, x, z, guild, tag) => { const roles = ['tank', 'healer', 'melee', 'caster', 'caster', 'melee', 'healer'].slice(0, n); return roles.map((r, i) => rival(r, x + Math.cos(i * 1.3) * 3, z + Math.sin(i * 1.3) * 3, guild, tag)); };
// somewhere out of sight, on open ground
function farSpot(r0, r1) { for (let i = 0; i < 40; i++) { const a = rnd(0, TAU), r = rnd(r0, r1), x = H().x + Math.cos(a) * r, z = H().z + Math.sin(a) * r, lim = (ZONE_SIZE[S.zone] || 400) - 30; if (Math.abs(x) < lim && Math.abs(z) < lim && hgt(x, z) < 16) return { x, z }; } return { x: H().x + r0, z: H().z }; }

// ---------- contested ground and the flag ----------
let patrolT = 30, huntT = 150, tk = 0, wasIn = false;
X.tick.push(dt => {
  const h = H(); if (!h || h.dead || !S.running) return;
  tk += dt; if (tk < .5) return; const t = tk; tk = 0;
  const live = S.ents.filter(e => e.pvp && !e.dead && !e.remove);
  // contested ground
  const inC = inContested() && L() >= 20;
  if (inC && !wasIn) chat('sys', null, `You enter contested ground. Rival guilds fight over ${world.regionNames[LANDS[S.zone].area]}; anyone you meet here may attack you.`);
  wasIn = inC;
  if (inC && !live.some(e => e.pvp === 'patrol') && (patrolT -= t) <= 0) {
    patrolT = rnd(50, 100); const g = pick(RIVALS), p = farSpot(45, 65);
    for (const m of party(irnd(2, 3), p.x, p.z, g, 'patrol')) m.hunting = true;
    chat('sys', null, `A ${g} war party is moving through ${world.regionNames[LANDS[S.zone].area]}.`);
  }
  // the flag: hunters come for you
  if (st().on && openWorld() && L() >= 10 && !live.some(e => e.pvp === 'hunter') && (huntT -= t) <= 0) {
    huntT = rnd(120, 240); const g = pick(RIVALS), p = farSpot(40, 55), n = Math.min(3, 1 + Math.floor(L() / 10));
    for (const m of party(n, p.x, p.z, g, 'hunter')) m.hunting = true;
    chat('sys', null, pick([`You're being hunted. ${g} has your name on a list.`, `Word reaches you: ${g} has sent hunters after you.`, `Someone from ${g} has been asking where you are.`]));
  }
  // those hunting come to you
  for (const m of live) if (m.hunting && !m.engaged) { if (dist(m, h) > 60 && m.pvp === 'patrol' && !inC) { m.remove = true; m.dead = true; continue; } AI.goTo(m, h.x, h.z, .5, 6); m.home = { x: m.x, z: m.z }; m.wander = null; if (dist(m, h) < 22) Cb.addThreat(m, h, 2); }
  // a guild war
  outposts(t);
});
X.kill.push(m => {
  if (!m.pvp) return;
  const honor = m.pvp === 'hunter' ? 10 : m.pvp === 'patrol' ? 5 : m.pvp === 'raid' ? 6 : 8;
  S.ext.honor = (S.ext.honor || 0) + honor; st().kills = (st().kills || 0) + 1;
  if (Math.random() < .5) { const g = 2 + L(); S.gold += g; chat('loot', null, `You take ${g} gold from ${m.name}. +${honor} honor.`); } else chat('sys', null, `+${honor} honor.`);
  for (const [n, k] of [[25, 'title_pvp_blood'], [100, 'title_pvp_hunter'], [250, 'mount_pvp']]) if (st().kills >= n && !Loot5.owned(k)) Loot5.collect(k);
});
Object.assign(Loot5.COLLECT, { title_pvp_blood: { type: 'title', name: 'the Bloodied', from: 'open-world PvP' }, title_pvp_hunter: { type: 'title', name: 'Manhunter', from: 'open-world PvP' }, mount_pvp: { type: 'mount', name: 'Red-Barded Charger', kind: 'horse_war', spd: .9, ride: 1, from: 'open-world PvP' } });
// flagged, you earn more; your guild's outpost in a land helps you there
X.xpMul.push(() => (st().on ? 1.1 : 1) * (posts()[S.zone]?.owner === 'mine' ? 1.1 : 1));
{ const prev = X.acctOf; X.acctOf = e => { const a = prev(e); if (!e?.isHero || posts()[S.zone]?.owner !== 'mine') return a; return { ...a, powP: (a.powP || 0) + .05 }; }; }
export function setFlag(on) {
  const s = st(), h = H();
  if (on) { s.on = true; s.since = Date.now(); huntT = 60; chat('sys', null, 'You raise your colours. You are flagged for war: +10% experience, and the rival guilds will come for you.'); return null; }
  if (Cb.inCombat(h)) return 'Not in the middle of a fight.';
  if (Date.now() - s.since < 3e5) return `Your colours stay up for five minutes once raised (${Math.ceil((3e5 - (Date.now() - s.since)) / 6e4)} more).`;
  s.on = false; chat('sys', null, 'You lower your colours.'); return null;
}

// ---------- guild war outposts ----------
const spots = {};
function postSpot(zone) {
  if (spots[zone]) return spots[zone];
  const area = LANDS[zone].area, lim = (ZONE_SIZE[S.zone] || 400) - 40, c = [];
  for (let x = -lim; x <= lim; x += 16) for (let z = -lim; z <= lim; z += 16) if (world.regionFn(x, z) === area && hgt(x, z) < 12 && !(world.clearSpots || []).some(s => Math.hypot(s.x - x, s.z - z) < s.r + 12)) c.push({ x, z });
  if (!c.length) return null;
  const cx = c.reduce((a, p) => a + p.x, 0) / c.length, cz = c.reduce((a, p) => a + p.z, 0) / c.length;
  return spots[zone] = c.sort((a, b) => Math.hypot(a.x - cx, a.z - cz) - Math.hypot(b.x - cx, b.z - cz))[0];
}
let O = null;   // what's standing at the outpost in this land right now
X.zone.push(zone => {
  O = null; if (!LANDS[zone]) return;
  const p = postSpot(zone); if (!p) return;
  const P0 = posts()[zone] = posts()[zone] || { owner: pick(RIVALS) };
  world.places.push({ name: LANDS[zone].post, x: p.x, z: p.z, R: 14, kind: 'place' }); world.spots['post_' + zone] = p;
  O = { zone, p, tents: [], banner: null, def: [], raid: null };
  for (const [dx, dz] of [[-6, -5], [6, -5], [0, 7]]) O.tents.push(Game.spawnProp({ id: 'ptent' + dx, kind: 'pvp_tent', name: '', x: p.x + dx, z: p.z + dz, yaw: rnd(0, TAU), scale: 1 }));
  raiseBanner();
  if (P0.owner === 'mine' && P0.next && Date.now() > P0.next) setTimeout(() => counter(), 8000);
});
function raiseBanner() {
  const P0 = posts()[O.zone], mine = P0.owner === 'mine', p = O.p;
  if (O.banner) { O.banner.remove = true; O.banner.dead = true; if (O.banner.prop) world.props = world.props.filter(p => p !== O.banner.prop); }
  O.banner = mine ? Cb.makeEnt({ team: 'ally', guard: true, name: `<${myGuild() || 'Your guild'}> Banner`, title: LANDS[O.zone].post, kind: 'pvp_mybanner', x: p.x, z: p.z, maxHp: 4000 + L() * 400, hp: 4000 + L() * 400, lvl: L(), armor: 300, home: { x: p.x, z: p.z } })
    : Game.spawnProp({ id: 'pbanner', kind: 'pvp_banner', name: `<${P0.owner}> Banner`, x: p.x, z: p.z, yaw: 0, scale: 1 });
  O.banner.y = hgt(p.x, p.z); O.banner.postBanner = true; O.banner.spd = 0;
}
function outposts(t) {
  if (!O || O.zone !== S.zone) return;
  const h = H(), P0 = posts()[O.zone], d = Math.hypot(h.x - O.p.x, h.z - O.p.z);
  O.def = O.def.filter(e => !e.remove);
  // a rival's outpost: defenders turn out when you come near
  if (P0.owner !== 'mine') {
    if (d < 90 && !O.def.length && L() >= 20) { O.def = [...party(5, O.p.x, O.p.z, P0.owner, 'def')]; chat('sys', null, `${P0.owner} holds ${LANDS[O.zone].post}. Its defenders turn out.`); }
    if (O.def.length && O.def.every(e => e.dead) && d < 40) {
      if (!myGuild()) { if (!O.noGuildSaid) { O.noGuildSaid = true; chat('sys', null, `The outpost is empty, but you have no guild banner to raise. Join or found a guild to hold it.`); } }
      else { P0.owner = 'mine'; P0.from = O.def[0].guild; P0.next = Date.now() + rnd(20, 40) * 6e4; O.def = []; raiseBanner(); S.ext.honor = (S.ext.honor || 0) + 50;
        chat('sys', null, `<${myGuild()}> takes ${LANDS[O.zone].post}! +50 honor. In ${world.names.zone} your guild's fighters have +5% power and +10% experience. ${P0.from} will be back for it.`); X.ui?.toast?.('Outpost taken!'); Game.save(); }
    }
    if (d > 160 && O.def.length && O.def.every(e => !e.engaged || e.dead)) { for (const e of O.def) { e.remove = true; e.dead = true; } O.def = []; }
    return;
  }
  // yours: they come back for it
  if (!O.raid && P0.next && Date.now() > P0.next) counter();
  if (O.raid) {
    const R0 = O.raid; R0.t -= t;
    if (!R0.arrived && R0.t <= 0) { R0.arrived = true; const a = rnd(0, TAU); for (const m of party(6, O.p.x + Math.cos(a) * 45, O.p.z + Math.sin(a) * 45, R0.guild, 'raid')) R0.m.push(m); chat('sys', null, `${R0.guild} attacks ${LANDS[O.zone].post}!`); X.ui?.toast?.('Your outpost is under attack!'); }
    for (const m of R0.m) if (!m.dead && !m.engaged) { AI.goTo(m, O.p.x, O.p.z, .5, 3); m.home = { x: m.x, z: m.z }; m.wander = null; if (dist(m, O.banner) < 14) Cb.addThreat(m, O.banner, 5); }
    if (O.banner.dead) { P0.owner = R0.guild; P0.next = null; O.raid = null; chat('sys', null, `${R0.guild} has cut down your banner. ${LANDS[O.zone].post} is theirs again.`); for (const m of R0.m) { m.pvp = 'def'; } O.def = R0.m.filter(m => !m.dead); raiseBanner(); Game.save(); return; }
    if (R0.arrived && R0.m.every(m => m.dead)) { O.raid = null; P0.next = Date.now() + rnd(25, 45) * 6e4; S.ext.honor = (S.ext.honor || 0) + 30; O.banner.hp = O.banner.maxHp; chat('sys', null, `${R0.guild} is beaten back from ${LANDS[O.zone].post}. +30 honor. They'll try again.`); Game.save(); }
  }
}
function counter() {
  if (!O || O.raid || posts()[O.zone]?.owner !== 'mine') return;
  const g = posts()[O.zone].from || pick(RIVALS);
  O.raid = { guild: g, t: 60, m: [], arrived: false };
  chat('guild', pick(S.fakes?.filter(f => f.fake?.guild === myGuild()).map(f => f.name) || []) || 'A guildmate', `${g} is massing to take back ${LANDS[O.zone].post}! A minute, maybe less. Get there!`);
  X.ui?.toast?.(`${g} is coming for your outpost`);
}

// ---------- the war page: on the Battle tab's companion ----------
X.book.push(['war', 'War', body => {
  const { el, esc, toast, refreshSheet } = X.ui, s = st();
  body.appendChild(el(`<p style="margin:0 0 6px">Honor: <b>${S.ext.honor || 0}</b> · rivals defeated in the open: ${s.kills || 0}</p>`));
  const f = el(`<div class="card" style="text-align:left"><h3>Your colours ${s.on ? '(raised)' : '(lowered)'}</h3><p style="font-size:13px">Raised, you earn 10% more experience, and the rival guilds send hunters after you anywhere in the open world. Once raised they stay up for five minutes.</p><div class="acts"><button>${s.on ? 'Lower your colours' : 'Raise your colours'}</button></div></div>`);
  f.querySelector('button').onclick = () => { const m = setFlag(!s.on); if (m) toast(m); refreshSheet(); }; body.appendChild(f);
  const rows = Object.entries(LANDS).map(([z, l]) => { const P0 = posts()[z]; return `<div class="who"><div><b>${esc(l.post)}</b> <small>${P0 ? (P0.owner === 'mine' ? `held by &lt;${esc(myGuild() || 'your guild')}&gt;` : `held by ${esc(P0.owner)}`) : 'not yet seen'}</small></div></div>`; }).join('');
  body.appendChild(el(`<div class="card" style="text-align:left"><h3>Guild war</h3><p style="font-size:13px">Each of the three new lands has an outpost on its contested ground. Kill the defenders and your guild raises its banner: +5% power and +10% experience in that land. The guild you took it from will come back for it.</p>${rows}</div>`));
}, () => S.hero && S.hero.lvl >= 10]);
