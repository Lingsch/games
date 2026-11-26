// Stars Beneath, Build 11: the early game bites back. Carried over from the Single-Player MMO's Build 12 and
// re-dressed: wounded raiders and beasts run for help, casters step back from a blade, and out in the wilds of the six
// starting worlds things happen to you: a prowling elite, an ambush, a stranger in trouble, a half-buried supply pod.
// (Harder numbers and linked packs are small edits in data.js, game.js and combat.js.)
import { S, X, chat, pick, rnd, irnd, TAU, dist } from './core.js';
import { MOBS, randomGear } from './data.js';
import { world, hgt, insideBuilding } from './world.js';
import * as Cb from './combat.js';
import * as Game from './game.js';
import { moveToward } from './ai.js';
import * as Craft from './crafting.js';
export const EARLY = ['moon', 'sunder', 'fort', 'city', 'cinder', 'hollow'];
const INSTANCES = {};

// ---------- smarter enemies ----------
X.mobSmart = (m, t, dt, M) => {
  if (m.lvl > 12 || m.charmed) return false;
  // running for help
  if (m.runTo) {
    const r = m.runTo; if (S.time - r.t0 > 9) { m.runTo = null; return false; }
    if (Math.hypot(m.x - r.x, m.z - r.z) > 3.5) { moveToward(m, r.x, r.z, dt, 1, 1.15); return true; }
    for (const h of r.helpers) if (!h.dead && !h.engaged) { Cb.addThreat(h, t, 2); h.camp = m.camp || h.camp; }
    if (dist(m, S.hero) < 45) chat('say', m.name, M.beast ? '*shrieks, and something answers*' : pick(['Over here! Help!', 'Get up, you lot! We\'ve got company!', 'They\'re right behind me!']));
    m.runTo = null; return false;
  }
  if (!m.ranHelp && m.hp < m.maxHp * .4 && !m.dungeon && (M.human || M.beast || M.social)) {
    m.ranHelp = true;
    if (Math.random() < .4) {
      const helpers = S.ents.filter(o => o.mob && !o.dead && !o.engaged && !o.boss && !o.named && o !== m && o.team === 'enemy' && dist(o, m) < 45 && dist(o, m) > 8 && Math.abs(o.lvl - m.lvl) <= 3).sort((a, b) => dist(a, m) - dist(b, m)).slice(0, 2);
      if (helpers.length) { const h0 = helpers[0], a = Math.atan2(m.x - h0.x, m.z - h0.z); m.runTo = { x: h0.x + Math.sin(a) * 2.5, z: h0.z + Math.cos(a) * 2.5, helpers, t0: S.time }; m.mcast = null;
        if (dist(m, S.hero) < 45) chat('say', m.name, M.beast ? '*shrills and bolts*' : pick(['I\'m getting the others!', 'You\'ll be sorry!', 'Help! HELP!'])); return true; }
    }
  }
  // casters don't stand still for a sword
  if (m.kiteTo) { if (Math.hypot(m.x - m.kiteTo.x, m.z - m.kiteTo.z) > .8 && S.time - m.kiteTo.t0 < 1.6) { moveToward(m, m.kiteTo.x, m.kiteTo.z, dt, .4, 1.05); return true; } m.kiteTo = null; }
  if (M.caster && !m.mcast && t && dist(m, t) < 3 && (m.kiteT || 0) < S.time) {
    m.kiteT = S.time + rnd(6, 9); const a = Math.atan2(m.x - t.x, m.z - t.z) + rnd(-.6, .6);
    m.kiteTo = { x: m.x + Math.sin(a) * 6, z: m.z + Math.cos(a) * 6, t0: S.time }; return true;
  }
  return false;
};

// ---------- events in the early lands ----------
let evT = rnd(180, 300), ev = null;
const ADJ = ['Old', 'Scarred', 'Hungry', 'Great', 'One-Eyed', 'Pale', 'Mad'];
const inTown = () => (world.towns || []).some(t => Math.hypot(S.hero.x - t.x, S.hero.z - t.z) < (t.R || 24) + 10) || (world.town && Math.hypot(S.hero.x - world.town.x, S.hero.z - world.town.z) < (world.town.R || 30) + 10);
function nearMobs() { const h = S.hero; return world.spawns.filter(s => !s.named && !s.boss && !s.dungeon && s.lvl[1] <= h.lvl + 3 && s.lvl[0] >= h.lvl - 4 && Math.hypot(s.x - h.x, s.z - h.z) < 140).map(s => s.mob); }
function spot(r0, r1) { const h = S.hero; for (let i = 0; i < 30; i++) { const a = rnd(0, TAU), r = rnd(r0, r1), x = h.x + Math.cos(a) * r, z = h.z + Math.sin(a) * r; if (Math.abs(x) < 250 && Math.abs(z) < 250 && !insideBuilding(x, z)) return { x, z }; } return { x: h.x + r0, z: h.z }; }
const EVENTS = {
  elite() {
    const pool = nearMobs(); if (!pool.length) return false; const k = pick(pool), p = spot(35, 55), L = S.hero.lvl + 1;
    const m = Cb.makeMob(k, L, { x: p.x, z: p.z, home: { ...p }, elite: true }); m.name = `${pick(ADJ)} ${MOBS[k].name}`; m.scale = (m.scale || 1) * 1.35; m.ev12 = 'elite'; m.wander12 = true; Cb.recalc(m); m.hp = m.maxHp; m.y = hgt(p.x, p.z);
    chat('sys', null, pick([`Something big is moving nearby: ${m.name}.`, `Your scanner chirps twice and goes quiet. ${m.name} is out hunting.`, `Tracks in the dust, bigger than they should be. ${m.name} is close.`])); return true;
  },
  ambush() {
    const pool = nearMobs().filter(k => MOBS[k].human || MOBS[k].beast); if (pool.length < 1) return false;
    const h = S.hero, a = h.yaw + Math.PI, k = pick(pool);
    for (let i = 0; i < 3; i++) { const x = h.x + Math.sin(a + (i - 1) * .5) * 14, z = h.z + Math.cos(a + (i - 1) * .5) * 14; const m = Cb.makeMob(k, Math.max(1, h.lvl), { x, z, home: { x, z } }); m.y = hgt(x, z); m.ev12 = 'ambush'; Cb.addThreat(m, h, 3); }
    chat('sys', null, MOBS[k].beast ? 'Something moves behind you. You\'re being hunted!' : 'Ambush! They were waiting for you.'); return true;
  },
  traveller() {
    const pool = nearMobs().filter(k => !MOBS[k].fly); if (!pool.length) return false; const p = spot(25, 40), k = pick(pool);
    const NAMES = ['Surveyor Odell', 'Courier Jun', 'Prospector Wick', 'Tinker Massa', 'Pilgrim Ennis', 'Young Pip'];
    const v = Cb.makeEnt({ team: 'ally', guard: true, maxHp: 60 + S.hero.lvl * 40, hp: 60 + S.hero.lvl * 40, name: pick(NAMES), title: 'In trouble', kind: pick(['villager0', 'villager1', 'villager2']), x: p.x, z: p.z, lvl: S.hero.lvl, home: { ...p } });
    v.maxHp = v.hp; v.y = hgt(p.x, p.z); v.ev12 = 'traveller'; v.spd = 0;
    const foes = []; for (let i = 0; i < 2; i++) { const x = p.x + rnd(-3, 3), z = p.z + rnd(-3, 3), m = Cb.makeMob(k, Math.max(1, S.hero.lvl - 1), { x, z, home: { x, z } }); m.y = hgt(x, z); m.ev12 = 'raider'; Cb.addThreat(m, v, 5); foes.push(m); }
    ev = { kind: 'traveller', v, foes, t: 90 };
    chat('say', v.name, pick(['Help! Somebody, please help!', 'Get away from me! Somebody help!', 'I\'ve only got ration bars! Take the ration bars!'])); return true;
  },
  treasure() {
    const p = spot(20, 35);
    Game.spawnProp({ id: 'tr12_' + Math.round(S.time), kind: 'crate', name: 'A Half-Buried Supply Pod', x: p.x, z: p.z, yaw: rnd(0, TAU), scale: 1, use: 'treasure12' });
    world.places.push({ name: 'A Half-Buried Supply Pod', x: p.x, z: p.z, R: 4, kind: 'place' });
    chat('sys', null, pick(['Something glints in the dirt not far off.', 'You notice the lid of an old supply pod poking out of the ground nearby.', 'Your scanner picks up a faint beacon, very close and very old.'])); return true;
  },
};
X.ev12 = EVENTS;
X.tick.push(dt => {
  const h = S.hero; if (!h || !S.running || h.dead) return;
  if (ev?.kind === 'traveller') {
    ev.t -= dt; const { v, foes } = ev;
    if (v.dead) { chat('sys', null, `${v.name} didn't make it.`); ev = null; }
    else if (foes.every(f => f.dead)) { const g = 5 + h.lvl * 3; S.gold += g; chat('say', v.name, pick([`You saved my life! Here, it's not much, but take it.`, `Bless you! Take this, please. And watch the road.`])); chat('loot', null, `${v.name} gives you ${g} credits${Math.random() < .5 ? ' and a little something' : ''}.`);
      if (Math.random() < .5) { const it = randomGear(h.lvl, S.heroCls, .3); if (it.rarity < 1) it.rarity = 1; Game.addToBag(it); }
      setTimeout(() => { v.remove = true; v.dead = true; }, 8000); ev = null; }
    else if (ev.t <= 0) { for (const f of foes) if (!f.engaged) { f.remove = true; f.dead = true; } v.remove = true; v.dead = true; ev = null; }
  }
  if (!EARLY.includes(S.zone) || INSTANCES[S.zone] || h.lvl > 12) return;
  if (Cb.inCombat(h) || inTown()) return;
  if ((evT -= dt) > 0) return; evT = rnd(240, 420);
  const order = Object.keys(EVENTS).sort(() => Math.random() - .5);
  for (const k of order) if (EVENTS[k]()) break;
});
// the wandering elite wanders; its loot is worth the trouble
X.tick.push(dt => { for (const m of S.ents) if (m.wander12 && !m.dead && !m.engaged && (m.wT = (m.wT || 0) - dt) <= 0) { m.wT = rnd(8, 14); const a = rnd(0, TAU); m.home = { x: m.home.x + Math.sin(a) * 12, z: m.home.z + Math.cos(a) * 12 }; m.wander = null; } });
X.kill.push(m => { if (m.ev12 !== 'elite') return; const it = randomGear(m.lvl, Math.random() < .6 ? S.heroCls : null, .4); if (it.rarity < 1) it.rarity = 1; (m.loot = m.loot || []).push(it); });
// treasure chests
{ const pl = X.propLabel, pu = X.propUse;
  X.propLabel = e => e.prop.use === 'treasure12' ? 'Open the pod' : pl ? pl(e) : null;
  X.propUse = e => { if (e.prop.use !== 'treasure12') return pu?.(e);
    const h = S.hero, g = 8 + h.lvl * irnd(3, 6); S.gold += g; let txt = `${g} credits`;
    if (Math.random() < .6) { const it = randomGear(h.lvl, Math.random() < .7 ? S.heroCls : null, .45); if (it.rarity < 1) it.rarity = 1; if (Game.addToBag(it)) txt += ` and ${it.name}`; }
    if (Math.random() < .3) { Craft.addMat(pick(['copper', 'iron', 'garnet', 'moonstone']), irnd(1, 3), true); }
    chat('loot', null, `Inside the pod: ${txt}.`); e.remove = true; e.dead = true; world.props = world.props.filter(p => p !== e.prop);
    if (Math.random() < .25) { const pool = nearMobs(); if (pool.length) { const k = pick(pool); for (let i = 0; i < 2; i++) { const m = Cb.makeMob(k, h.lvl, { x: e.x + rnd(-6, 6), z: e.z + rnd(-6, 6), home: { x: e.x, z: e.z } }); m.y = hgt(m.x, m.z); Cb.addThreat(m, h, 2); } chat('sys', null, 'It was bait!'); } } };
}
