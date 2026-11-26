// Build 12: the early game bites back, and there's more of it.
//   Smarter enemies: a wounded brigand or beast may run for help and bring friends back; casters step away from
//   anyone who gets in their face. (Healers already heal.) Tougher packs and harder numbers live in game.js and data.js.
//   Professions from level 1: everyone starts knowing Mining, Herbalism and Skinning; each race's start town has
//   a trainer for the rest, a full set of crafting stations, and copper and meadowsweet in the hills around it.
//   Events in the early lands: wandering elites, ambushes, travellers in trouble, and treasure.
//   And nobody stands inside a wall any more.
import { S, X, chat, pick, rnd, irnd, TAU, dist } from './core.js';
import { MOBS, GIVERS, CLASSES } from './data.js';
import { TALK } from './dialogue.js';
import { world, hgt, freeSpot, insideBuilding, wallNear } from './world.js';
import { INSTANCES } from './dungeons.js';
import * as Cb from './combat.js';
import * as Game from './game.js';
import { moveToward } from './ai.js';
import * as Craft from './crafting.js';
import * as Loot5 from './loot5.js';
import { randomGear } from './data.js';

export const EARLY = ['vale', 'weald', 'kiln', 'hush', 'coast'];
const STARTS = ['weald', 'kiln', 'hush'];

// ---------- smarter enemies ----------
X.mobSmart = (m, t, dt, M) => {
  if (m.lvl > 12 || m.charmed) return false;
  // running for help
  if (m.runTo) {
    const r = m.runTo; if (S.time - r.t0 > 9) { m.runTo = null; return false; }
    if (Math.hypot(m.x - r.x, m.z - r.z) > 3.5) { moveToward(m, r.x, r.z, dt, 1, 1.15); return true; }
    for (const h of r.helpers) if (!h.dead && !h.engaged) { Cb.addThreat(h, t, 2); h.camp = m.camp || h.camp; }
    if (dist(m, S.hero) < 45) chat('say', m.name, M.beast ? '*howls, and something howls back*' : pick(['Over here! Help!', 'Get up, you lot! We\'ve got company!', 'They\'re right behind me!']));
    m.runTo = null; return false;
  }
  if (!m.ranHelp && m.hp < m.maxHp * .4 && !m.dungeon && (M.human || M.beast || M.social)) {
    m.ranHelp = true;
    if (Math.random() < .4) {
      const helpers = S.ents.filter(o => o.mob && !o.dead && !o.engaged && !o.boss && !o.named && o !== m && o.team === 'enemy' && dist(o, m) < 45 && dist(o, m) > 8 && Math.abs(o.lvl - m.lvl) <= 3).sort((a, b) => dist(a, m) - dist(b, m)).slice(0, 2);
      if (helpers.length) { const h0 = helpers[0], a = Math.atan2(m.x - h0.x, m.z - h0.z); m.runTo = { x: h0.x + Math.sin(a) * 2.5, z: h0.z + Math.cos(a) * 2.5, helpers, t0: S.time }; m.mcast = null;
        if (dist(m, S.hero) < 45) chat('say', m.name, M.beast ? '*yelps and bolts*' : pick(['I\'m getting the others!', 'You\'ll be sorry!', 'Help! HELP!'])); return true; }
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

// ---------- professions from level 1 ----------
let learned = false;
X.tick.push(() => {
  if (learned || !S.hero) return; learned = true;
  Craft.initState(); S.ext.prof12 = true;
  for (const p of ['mining', 'herbalism', 'skinning']) if (S.prof[p] == null) S.prof[p] = 1;
});
for (const z of STARTS) Craft.NODES[z] = Craft.NODES[z] || [['copper', 'ore', 'orecopper', 1, null, 16], ['meadowsweet', 'herb', 'herbmeadow', 1, null, 16]];
GIVERS.jack12 = { name: 'Old Hobb Allhands', title: 'Every trade, a little', model: 'villager3' };
Craft.TRAINERS.jack12 = ['smithing', 'leatherworking', 'tailoring', 'alchemy', 'cooking', 'enchanting', 'jewelcrafting', 'scribing', 'mining', 'herbalism', 'skinning'];
TALK.jack12 = { bio: 'Hobb has been a smith, a tanner, a tailor, a cook, a brewer, a scribe, and, for one very bad summer, an enchanter. He is not a master of any of it, and he says that makes him the perfect teacher, because he remembers what it was like to be terrible.',
  greet: ["Want to learn a trade? I know a bit of all of them. Not a lot. A bit. Enough to get you started, and enough to make you dangerous.", "Never let anybody tell you a hero shouldn't know how to sew. Who do you think fixes your trousers after a troll?"],
  topics: [{ q: 'Why do you know every trade?', a: ["Because I've failed at all of them, one after another, and every time I failed I learned something. That's the secret, really. Fail a lot, and pay attention while you're doing it."] }] };
const STN = ['forge', 'tanrack', 'loom', 'alchemy', 'cookfire', 'enchant', 'scribe'];
X.zone.push(zone => {
  if (!STARTS.includes(zone) || !world.town) return;
  const t = world.town, avoid = [];
  const j = freeSpot(t.x, t.z, 6, 20, 3.6, avoid); avoid.push(j);
  const e = Cb.makeEnt({ team: 'npc', maxHp: 1, hp: 1, name: GIVERS.jack12.name, title: GIVERS.jack12.title, kind: 'villager3', x: j.x, z: j.z, giver: 'jack12' }); e.y = hgt(e.x, e.z);
  STN.forEach((k, i) => { const p = freeSpot(j.x, j.z, 3, 12, i / STN.length * TAU, avoid); avoid.push(p); Game.spawnProp({ id: 's12' + k, kind: k, tag: 'station', station: k, name: Craft.STATIONS[k]?.name || k, x: p.x, z: p.z, yaw: Math.atan2(j.x - p.x, j.z - p.z), scale: 1 }); });
});
// a few more things to make at the very start
Object.assign(Craft.CONS, {
  whetstone: { name: 'Whetstone', icon: '🪨', buff: 'kit', data: { pow: .04 }, desc: '+4% power for 30 minutes.' },
  armorkit: { name: 'Rawhide Armor Kit', icon: '🧰', buff: 'kit', data: { armor: .06 }, desc: '+6% armor for 30 minutes.' },
  trailmix: { name: 'Trail Rations', icon: '🥨', buff: 'fed', data: { hp: .04 }, desc: '+4% health for 30 minutes.' },
});
Craft.addRecipe('whetstone', 'smithing', 'Whetstones (2)', 4, { copper: 2 }, { cons: 'whetstone', n: 2 });
Craft.addRecipe('armorkit', 'leatherworking', 'Rawhide Armor Kits (2)', 4, { lighthide: 3 }, { cons: 'armorkit', n: 2 });
Craft.addRecipe('trailmix', 'cooking', 'Trail Rations (3)', 3, { meat: 2, meadowsweet: 1 }, { cons: 'trailmix', n: 3 });
Craft.addRecipe('bandage', 'tailoring', 'Linen Bandages (3)', 2, { linen: 3 }, { pot: 'hpot', n: 3 });

// ---------- nobody inside a wall ----------
function unstick(e, strict) {
  if (!(insideBuilding(e.x, e.z) || (strict && wallNear(e.x, e.z, .35)))) return;
  const p = freeSpot(e.x, e.z, 1.5, 16, rnd(0, TAU), S.ents.filter(o => o !== e && !o.dead && (o.team === 'npc' || o.fake) && !o.prop && dist(o, e) < 20));
  e.x = e.rx = p.x; e.z = e.rz = p.z; e.y = hgt(p.x, p.z); if (e.home) e.home = { x: p.x, z: p.z }; if (e.holdAt) e.holdAt = { x: p.x, z: p.z };
}
const fixable = e => !e.dead && !e.remove && !e.prop && !e.mob && !e.isHero && !e.inParty && !e.corpse && (e.team === 'npc' || e.fake || e.guard);
X.zone.push(() => { setTimeout(() => { for (const e of S.ents) if (fixable(e)) unstick(e, !e.guard); }, 50); });
let uT = 0;
X.tick.push(dt => { if ((uT += dt) < 4) return; uT = 0; for (const e of S.ents) if (fixable(e) && (e.fake || e.idle || e.wanders)) unstick(e, false); });

// ---------- events in the early lands ----------
let evT = rnd(180, 300), ev = null;
const ADJ = ['Old', 'Scarred', 'Hungry', 'Great', 'One-Eyed', 'Grey', 'Mad'];
const inTown = () => (world.towns || []).some(t => Math.hypot(S.hero.x - t.x, S.hero.z - t.z) < (t.R || 24) + 10) || (world.town && Math.hypot(S.hero.x - world.town.x, S.hero.z - world.town.z) < (world.town.R || 30) + 10);
function nearMobs() { const h = S.hero; return world.spawns.filter(s => !s.named && !s.boss && !s.dungeon && s.lvl[1] <= h.lvl + 3 && s.lvl[0] >= h.lvl - 4 && Math.hypot(s.x - h.x, s.z - h.z) < 140).map(s => s.mob); }
function spot(r0, r1) { const h = S.hero; for (let i = 0; i < 30; i++) { const a = rnd(0, TAU), r = rnd(r0, r1), x = h.x + Math.cos(a) * r, z = h.z + Math.sin(a) * r; if (Math.abs(x) < 380 && Math.abs(z) < 380 && !insideBuilding(x, z)) return { x, z }; } return { x: h.x + r0, z: h.z }; }
const EVENTS = {
  elite() {
    const pool = nearMobs(); if (!pool.length) return false; const k = pick(pool), p = spot(35, 55), L = S.hero.lvl + 1;
    const m = Cb.makeMob(k, L, { x: p.x, z: p.z, home: { ...p }, elite: true }); m.name = `${pick(ADJ)} ${MOBS[k].name}`; m.scale = (m.scale || 1) * 1.35; m.ev12 = 'elite'; m.wander12 = true; Cb.recalc(m); m.hp = m.maxHp; m.y = hgt(p.x, p.z);
    chat('sys', null, pick([`Something big is moving nearby: ${m.name}.`, `The birds go quiet. ${m.name} is out hunting.`, `Tracks in the mud, bigger than they should be. ${m.name} is close.`])); return true;
  },
  ambush() {
    const pool = nearMobs().filter(k => MOBS[k].human || MOBS[k].beast); if (pool.length < 1) return false;
    const h = S.hero, a = h.yaw + Math.PI, k = pick(pool);
    for (let i = 0; i < 3; i++) { const x = h.x + Math.sin(a + (i - 1) * .5) * 14, z = h.z + Math.cos(a + (i - 1) * .5) * 14; const m = Cb.makeMob(k, Math.max(1, h.lvl), { x, z, home: { x, z } }); m.y = hgt(x, z); m.ev12 = 'ambush'; Cb.addThreat(m, h, 3); }
    chat('sys', null, MOBS[k].beast ? 'A snap of twigs behind you. You\'re being hunted!' : 'Ambush! They were waiting for you.'); return true;
  },
  traveller() {
    const pool = nearMobs().filter(k => !MOBS[k].fly); if (!pool.length) return false; const p = spot(25, 40), k = pick(pool);
    const NAMES = ['Tamsin the Pedlar', 'Old Gaffer Wythe', 'Pilgrim Ennis', 'Merrit the Carter', 'Sister Agathe', 'Young Pip'];
    const v = Cb.makeEnt({ team: 'ally', guard: true, maxHp: 60 + S.hero.lvl * 40, hp: 60 + S.hero.lvl * 40, name: pick(NAMES), title: 'In trouble', kind: pick(['villager1', 'villager2', 'villager3']), x: p.x, z: p.z, lvl: S.hero.lvl, home: { ...p } });
    v.maxHp = v.hp; v.y = hgt(p.x, p.z); v.ev12 = 'traveller'; v.spd = 0;
    const foes = []; for (let i = 0; i < 2; i++) { const x = p.x + rnd(-3, 3), z = p.z + rnd(-3, 3), m = Cb.makeMob(k, Math.max(1, S.hero.lvl - 1), { x, z, home: { x, z } }); m.y = hgt(x, z); m.ev12 = 'raider'; Cb.addThreat(m, v, 5); foes.push(m); }
    ev = { kind: 'traveller', v, foes, t: 90 };
    chat('say', v.name, pick(['Help! Somebody, please help!', 'Get away from me! Somebody help!', 'I\'ve only got turnips! Take the turnips!'])); return true;
  },
  treasure() {
    const p = spot(20, 35);
    Game.spawnProp({ id: 'tr12_' + Math.round(S.time), kind: 'furn_chest', name: 'A Half-Buried Chest', x: p.x, z: p.z, yaw: rnd(0, TAU), scale: 1, use: 'treasure12' });
    world.places.push({ name: 'A Half-Buried Chest', x: p.x, z: p.z, R: 4, kind: 'place' });
    chat('sys', null, pick(['Something glints in the grass not far off.', 'You notice a lid of an old chest poking out of the earth nearby.', 'A crow is pecking at something shiny over there.'])); return true;
  },
};
X.ev12 = EVENTS;
X.tick.push(dt => {
  const h = S.hero; if (!h || !S.running || h.dead) return;
  if (ev?.kind === 'traveller') {
    ev.t -= dt; const { v, foes } = ev;
    if (v.dead) { chat('sys', null, `${v.name} didn't make it.`); ev = null; }
    else if (foes.every(f => f.dead)) { const g = 5 + h.lvl * 3; S.gold += g; chat('say', v.name, pick([`You saved my life! Here, it's not much, but take it.`, `Bless you! Take this, please. And watch the road.`])); chat('loot', null, `${v.name} gives you ${g} gold${Math.random() < .5 ? ' and a little something' : ''}.`);
      if (Math.random() < .5) { const it = randomGear(h.lvl, S.heroCls, .3); if (it.rarity < 1) it.rarity = 1; Game.addToBag(it); }
      setTimeout(() => { v.remove = true; v.dead = true; }, 8000); ev = null; }
    else if (ev.t <= 0) { for (const f of foes) if (!f.engaged) { f.remove = true; f.dead = true; } v.remove = true; v.dead = true; ev = null; }
  }
  if (!EARLY.includes(S.zone) || INSTANCES[S.zone] || h.lvl > 14) return;
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
  X.propLabel = e => e.prop.use === 'treasure12' ? 'Open the chest' : pl ? pl(e) : null;
  X.propUse = e => { if (e.prop.use !== 'treasure12') return pu?.(e);
    const h = S.hero, g = 8 + h.lvl * irnd(3, 6); S.gold += g; let txt = `${g} gold`;
    if (Math.random() < .6) { const it = randomGear(h.lvl, Math.random() < .7 ? S.heroCls : null, .45); if (it.rarity < 1) it.rarity = 1; if (Game.addToBag(it)) txt += ` and ${it.name}`; }
    if (Math.random() < .3) { Craft.addMat(pick(['copper', 'iron', 'garnet', 'moonstone']), irnd(1, 3), true); }
    chat('loot', null, `Inside the chest: ${txt}.`); e.remove = true; e.dead = true; world.props = world.props.filter(p => p !== e.prop);
    if (Math.random() < .25) { const pool = nearMobs(); if (pool.length) { const k = pick(pool); for (let i = 0; i < 2; i++) { const m = Cb.makeMob(k, h.lvl, { x: e.x + rnd(-6, 6), z: e.z + rnd(-6, 6), home: { x: e.x, z: e.z } }); m.y = hgt(m.x, m.z); Cb.addThreat(m, h, 2); } chat('sys', null, 'It was bait!'); } } };
}
