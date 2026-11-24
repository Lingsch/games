// The game: starting a world, the town's people, fake players, spawns, quests, loot, death, saving.
import { S, rnd, irnd, pick, dist, chat, floatText, clamp, TAU, fct } from './core.js';
import { CLASSES, CLASS_KEYS, MOBS, QUESTS, GIVERS, FAKE_NAMES, PERSONAS, GUILDS, CHAT, xpNeed, defaultBar, randomGear, makeItem, WTYPE, WEAR, POTIONS, NAMED_NAMES, MAX_LVL, roleOf, startRes, BASE_NAMES, SETS, SIGNATURE } from './data.js';
import * as Sea from './sea.js';
import * as Cb from './combat.js';
import * as AI from './ai.js';
import { generateWorld, world, hgt, REGION_NAMES, regionAt, collide, depthAt } from './world.js';
import './zones.js';
import * as R from './render.js';

const SAVE_KEY = 'ossuary-mmo-1';

// ---------- gear ----------
export function canWear(cls, it) {
  if (it.slot === 'weapon') return WTYPE[cls][0] === it.type;
  if (it.slot === 'off') return WTYPE[cls][1] === it.type;
  return WEAR[CLASSES[cls].armor].includes(it.armorType);
}
export function applyGear(e, set) {
  e.gearPow = e.gearSta = e.gearArm = e.gearCrit = 0;
  const sets = {};
  for (const k in set) { const it = set[k]; if (!it) continue; const s = it.stats; e.gearPow += s.pow || 0; e.gearSta += s.sta || 0; e.gearArm += s.arm || 0; e.gearCrit += s.crit || 0; if (it.set) sets[it.set] = (sets[it.set] || 0) + 1; }
  // armour sets: bonuses at 2 and 4 pieces
  for (const [id, n] of Object.entries(sets)) for (const [need, b] of Object.entries(SETS[id]?.bonus || {})) if (n >= +need) { e.gearPow += b.pow || 0; e.gearSta += b.sta || 0; e.gearCrit += b.crit || 0; }
  e.setCount = sets;
  Cb.recalc(e);
}
// fake players wear gear that keeps up with their level
function fakeGear(e) { e.gearPow = Math.round(e.lvl * 2.2 + 2); e.gearSta = Math.round(e.lvl * 3 + 3); e.gearArm = Math.round(e.lvl * (CLASSES[e.cls].armor === 'plate' ? 9 : 4)) + (e.bonusArm || 0); e.gearPow += e.bonusPow || 0; e.gearSta += e.bonusSta || 0; Cb.recalc(e); }
function starterGear(cls) {
  const t = WTYPE[cls], a = CLASSES[cls].armor, arm = a === 'plate' ? 4 : a === 'leather' ? 2 : 1;
  return {
    weapon: makeItem({ name: 'Plain ' + BASE_NAMES.weapon[t[0]][0], slot: 'weapon', type: t[0], lvl: 1, rarity: 0, stats: { pow: 3, sta: 1 }, value: 2 }),
    off: makeItem({ name: 'Plain ' + BASE_NAMES.off[t[1]][0], slot: 'off', type: t[1], armorType: t[1] === 'shield' ? 'plate' : null, lvl: 1, rarity: 0, stats: t[1] === 'shield' ? { sta: 2, arm: 8 } : { pow: 1, sta: 1 }, value: 2 }),
    chest: makeItem({ name: { plate: 'Dented Breastplate', leather: 'Patched Jerkin', cloth: 'Initiate Robe' }[a], slot: 'chest', type: a, armorType: a, lvl: 1, rarity: 0, stats: { sta: 2, arm: arm * 3 }, value: 2 }),
  };
}

// ---------- starting and loading ----------
export function newGame(cls, heroName, seed = (Math.random() * 1e9) | 0) {
  S.seed = seed; S.time = 0; S.gold = 5; S.bag = []; S.pots = { hpot: 3, mpot: 3 }; S.quests = {}; S.friends = [];
  S.classes = {}; S.gear = {}; S.bar = {};
  for (const k of CLASS_KEYS) { S.classes[k] = { lvl: 1, xp: 0 }; S.gear[k] = starterGear(k); S.bar[k] = defaultBar(k); }
  S.heroCls = cls; S.heroName = heroName;
  S.pops = {}; S.bind = null; S.zone = 'vale'; S.pole = false;
  startWorld({ zone: 'vale' });
  chat('sys', null, `Welcome to ${world.names.town}. Tap a fake player to invite them, or open Social to see who's around.`);
  chat('sys', null, 'Quest givers have a ! over their heads. Your group can be up to 6.');
}
// fake players as plain data, so they keep their levels between zones and saves
export function fakeData(f) { return { name: f.name, cls: f.cls, lvl: f.lvl, xp: f.xp || 0, pal: f.pal || 1, persona: f.fake.persona, guild: f.fake.guild, mood: f.fake.mood, friend: f.fake.friend, bonusPow: f.bonusPow || 0, bonusSta: f.bonusSta || 0, bonusArm: f.bonusArm || 0 }; }
function startWorld(opts = {}) {
  const zone = opts.zone || 'vale', old = S.hero;
  S.ents.length = 0; S.party = []; S.dangers = []; S.meter = {}; S.target = null; S.dead = false; Cb.projectiles.length = 0;
  if (!opts.keepLog) S.log.length = 0;
  S.zone = zone; world.fleetT = 0; world.underwater = false;
  generateWorld(S.seed, zone);
  const tw = world.town, a = opts.arrive || { x: tw.x + 1, z: tw.z + 4 };
  const hero = Cb.makeHuman(S.heroCls, S.classes[S.heroCls].lvl, { name: S.heroName, isHero: true, inParty: true, x: a.x, z: a.z, pal: 0 });
  hero.xp = S.classes[S.heroCls].xp; hero.kind = CLASSES[S.heroCls].models[0];
  applyGear(hero, S.corpse ? {} : S.gear[S.heroCls]); hero.hp = hero.maxHp; hero.res = startRes(hero);
  if (old && opts.carryHero && !old.dead) { hero.buffs = old.buffs.filter(b => b.dur > 20).map(b => ({ ...b, src: hero })); Cb.recalc(hero); hero.hp = Math.max(1, Math.round(hero.maxHp * old.hp / old.maxHp)); hero.res = old.res; hero.ult = old.ult; hero.yaw = old.yaw; }
  S.hero = hero; S.party = [hero];
  townsfolk(zone);
  // mobs
  for (const sp of world.spawns) spawn(sp);
  if (zone === 'coast') for (const q of QUESTS) if (q.rival && S.quests[q.id]?.state === 'active') spawnRival(q.rival);
  // fake players live in each zone
  makeFakes(zone === 'fleet' ? [] : S.pops?.[zone] || null, zone);
  if (S.corpse && (S.corpse.zone || 'vale') === zone) S.corpse.ent = Cb.makeEnt({ team: 'npc', name: `${S.heroName}'s corpse`, kind: 'corpse', x: S.corpse.x, z: S.corpse.z, corpse: true, maxHp: 1, hp: 1 });
  // the group comes with you
  for (const d of opts.carry || []) addMate(d, hero);
  Sea.setupZone();
  S.running = true;
}
// a fake player (from saved data) joins your group beside you
function addMate(d, hero) {
  const f = Cb.makeHuman(d.cls, d.lvl, { name: d.name, pal: d.pal || 1, x: hero.x + rnd(-2.5, 2.5), z: hero.z + rnd(-2.5, 2.5) });
  f.kind = CLASSES[d.cls].models[d.pal || 1]; f.xp = d.xp || 0; f.bonusPow = d.bonusPow || 0; f.bonusSta = d.bonusSta || 0; f.bonusArm = d.bonusArm || 0;
  f.fake = { persona: d.persona, guild: d.guild, mood: d.mood || 0, friend: !!d.friend, state: 'party', group: null };
  fakeGear(f); f.hp = Math.max(1, Math.round(f.maxHp * (d.hp ?? 1))); f.res = d.res !== undefined ? f.resMax * d.res : startRes(f);
  f.inParty = true; S.party.push(f); S.fakes.push(f);
  return f;
}
// the people of each zone's towns
function townsfolk(zone) {
  S.npcs = {};
  const npc = o => Cb.makeEnt({ team: 'npc', maxHp: 1, hp: 1, ...o });
  if (zone === 'vale') {
    const tw = world.town, N = tw.npcs;
    for (const [k, g] of Object.entries(GIVERS)) { const p = { warden: N.quest1, tanner: N.quest2, sister: N.quest3 }[k]; if (p) S.npcs[k] = npc({ name: g.name, title: g.title, kind: g.model, x: tw.x + p.x, z: tw.z + p.z, giver: k }); }
    S.npcs.vendor = npc({ name: 'Odda Coin-Purse', title: 'Supplies', kind: 'bandit', x: tw.x + N.vendor.x, z: tw.z + N.vendor.z, vendor: 'vale' });
    S.npcs.armory = npc({ name: 'Master Corvin', title: 'Armory (change class)', kind: 'guard', x: tw.x + N.armory.x, z: tw.z + N.armory.z, armory: true });
    S.npcs.bind = npc({ name: 'Bind Stone', title: 'Bind here', kind: 'corpse', x: tw.x + N.bind.x, z: tw.z + N.bind.z, bindstone: true, scale: 1.6 });
    if (!S.bind) S.bind = { zone: 'vale', x: S.npcs.bind.x, z: S.npcs.bind.z + 1.5 };
    for (const [x, z] of N.guards) guard(tw, tw.x + x, tw.z + z, 'Town Guard');
    return;
  }
  const VEND = { port: 'Wexley the Chandler', fort: 'Quartermaster Bell', vill: 'Netmender Pell' };
  for (const t of world.towns) {
    for (const [type, key, dx, dz] of t.npcs) {
      const x = t.x + dx, z = t.z + dz;
      if (type === 'giver') S.npcs[key] = npc({ name: GIVERS[key].name, title: GIVERS[key].title, kind: GIVERS[key].model, x, z, giver: key });
      if (type === 'vendor') npc({ name: VEND[key], title: key === 'vill' ? 'Supplies and fishing poles' : 'Supplies', kind: 'pirate1', x, z, vendor: key });
      if (type === 'bind') npc({ name: 'Bind Stone', title: 'Bind here', kind: 'corpse', x, z, bindstone: true, scale: 1.6 });
      if (type === 'armory') npc({ name: 'Mistress Hale', title: 'Armory (change class)', kind: 'guard', x, z, armory: true });
    }
    for (const [dx, dz] of t.guards) guard(t, t.x + dx, t.z + dz, t.key === 'fort' ? 'Halyard Marine' : 'Port Watch');
  }
}
function guard(t, x, z, name) { return Cb.makeEnt({ team: 'ally', name, kind: 'guard', x, z, guard: true, lvl: 30, maxHp: 9000, hp: 9000, power: 260, armor: 900, spd: 7, home: { x, z }, townC: { x: t.x, z: t.z, R: t.R } }); }
// travelling between zones: your group comes with you, the zone you leave remembers its people
export function travel(zone, arrive, force) {
  if (!force && S.party.some(p => !p.dead && Cb.inCombat(p) && dist(p, S.hero) < 40 && S.ents.some(m => m.mob && !m.dead && m.threat.has(p)))) { chat('sys', null, "You can't leave while your group is fighting."); return false; }
  const from = S.zone;
  if (from !== 'fleet') { S.pops = S.pops || {}; S.pops[from] = S.fakes.filter(f => !f.inParty).map(fakeData); }
  const carry = S.party.filter(p => !p.isHero).map(p => ({ ...fakeData(p), hp: p.dead ? .5 : p.hp / p.maxHp, res: p.resMax ? p.res / p.resMax : 1 }));
  S.classes[S.heroCls] = { lvl: S.hero.lvl, xp: S.hero.xp };
  startWorld({ zone, arrive: arrive || arrivalFor(zone, from), carry, carryHero: true, keepLog: true });
  chat('sys', null, `You enter ${world.names.zone || world.names.town}.`);
  save();
  return true;
}
function arrivalFor(zone, from) {
  if (zone === 'coast' && from === 'fleet') return { x: world.buoy.x + 3, z: world.buoy.z + 3 };
  if (zone === 'coast') return { x: -280, z: 0 };
  if (zone === 'fleet') return { x: 0, z: 55 };
  const zx = 278; return { x: zx, z: Math.sin(zx * .02) * 12 };
}
// a class quest's rival waits on the beach below Smuggler's Rock
function spawnRival(cls) {
  if (S.ents.some(e => e.named === 'rival_' + cls && !e.dead)) return;
  const d = world.docks.find(k => k.key === 'rock'), x = (d.land?.x ?? d.x) + 10, z = (d.land?.z ?? d.z) + 8;
  const e = Cb.makeMob('rival', 16, { x, z, home: { x, z }, named: 'rival_' + cls, kind: CLASSES[cls].models[2], name: 'Rogue ' + CLASSES[cls].name });
  e.hp = e.maxHp;
  return e;
}
function spawn(sp) {
  let key = sp.mob, named = sp.named || null, L = irnd(sp.lvl[0], sp.lvl[1]);
  if (sp.ph && Math.random() < sp.ph.chance) { named = sp.ph.named; key = sp.ph.key || 'bandit2'; L = sp.ph.lvl || Math.max(L, 5); }
  const e = Cb.makeMob(key, L, { x: sp.x, z: sp.z, home: { x: sp.x, z: sp.z }, camp: sp.camp, spawn: sp, dungeon: sp.dungeon, elite: sp.elite, named, boss: sp.boss, boss2: sp.boss2 });
  if (named) {
    e.name = world.names[named] || NAMED_NAMES(world)[named] || MOBS[key].name;
    if (sp.ph) { e.scale = 1.15; Cb.recalc(e); e.hp = e.maxHp; }
    if (sp.ph && S.fakes && S.fakes.length) chat('gen', pick(S.fakes).name, `${e.name} is up!`);
  }
  if (e.boss && world.names.boss) e.name = named === 'admiral' ? world.names.boss : world.names.boss;
  e.y = hgt(e.x, e.z);
  sp.alive = e; sp.timer = 0;
  return e;
}
function makeFakes(saved, zone = 'vale') {
  S.fakes = [];
  const used = new Set([...Object.values(S.pops || {}).flat().map(f => f.name), ...S.party.map(p => p.name)]);
  const names = [...FAKE_NAMES, 'Brinehart', 'Saltjaw', 'Kelpie', 'Wavecrest', 'Anchora', 'Tidewalker', 'Gullet', 'Mariner', 'Coralyn', 'Riptide', 'Barnacle', 'Seafoam', 'Squallbringer', 'Marlow', 'Pearlie', 'Drift', 'Skiff', 'Harpoona', 'Undertow', 'Galeheart', 'Selkie', 'Foghorn', 'Bilgewater', 'Sternmast']
    .filter(n => !used.has(n)).sort(() => Math.random() - .5);
  const n = saved ? saved.length : zone === 'coast' ? 24 : 30;
  const byRole = r => CLASS_KEYS.filter(k => CLASSES[k].role === r);
  const tw = world.town, areas = (world.huntAreas || [{ area: 0 }, { area: 1 }, { area: 2 }, { area: 3 }]);
  for (let i = 0; i < n; i++) {
    const sv = saved ? saved[i] : null;
    // roughly one tank and one and a half healers for every three damage dealers, across all sixteen classes
    const roll = Math.random(), cls = sv ? sv.cls : pick(byRole(roll < .22 ? 'tank' : roll < .48 ? 'healer' : 'dps'));
    const lvl = sv ? sv.lvl : zone === 'coast' ? clamp(Math.round(9 + Math.random() ** 1.2 * 11), 9, 20) : clamp(Math.round(1 + Math.random() ** 1.4 * 9), 1, 10);
    const pal = sv ? sv.pal : 1 + (i % 2);
    const inTown = i % 2 === 0;
    const e = Cb.makeHuman(cls, lvl, { name: sv ? sv.name : names[i % names.length], pal, x: tw.x + rnd(-12, 12), z: tw.z + rnd(-12, 12) });
    e.kind = CLASSES[cls].models[pal];
    e.xp = sv ? sv.xp : 0; e.bonusPow = sv?.bonusPow || 0; e.bonusSta = sv?.bonusSta || 0; e.bonusArm = sv?.bonusArm || 0;
    e.fake = { persona: sv ? sv.persona : pick(PERSONAS), guild: sv ? sv.guild : (Math.random() < .55 ? pick(GUILDS) : null), mood: sv ? sv.mood : 0, friend: sv ? sv.friend : false, state: inTown ? 'town' : 'hunt', until: S.time + rnd(20, 200), group: null };
    fakeGear(e); e.hp = e.maxHp; e.res = startRes(e);
    if (!inTown) { const pts = world.spawns.filter(s => !s.dungeon && areas.some(a => a.area === s.area) && depthAt(s.x, s.z) < 1); const p = pick(pts); if (p) { e.x = p.x + rnd(-8, 8); e.z = p.z + rnd(-8, 8); e.y = hgt(e.x, e.z); } }
    S.fakes.push(e);
  }
}

// ---------- party ----------
export function invite(f) {
  if (!f.fake || f.inParty || f.dead) return;
  if (S.party.length >= 6) { chat('sys', null, 'Your group is full (6).'); return; }
  const me = S.hero, fr = f.fake.friend;
  const busy = f.fake.group && f.fake.group.length > 1 && f.fake.group[0] !== f;
  let yes = fr || (Math.abs(f.lvl - me.lvl) <= 4 && f.fake.mood > -3 && !busy && Math.random() < .85);
  if (f.fake.group && f.fake.group[0] === f && f.fake.group.length > 1 && !fr) yes = false;
  if (!yes) { chat('whisper', f.name, pick(CHAT.joinNo)); return; }
  if (f.fake.group) { f.fake.group = f.fake.group.filter(x => x !== f); if (f.fake.group.length < 2) for (const m of f.fake.group) m.fake.group = null; f.fake.group = null; }
  f.inParty = true; f.sit = false; f.fake.state = 'party';
  S.party.push(f);
  chat('party', f.name, pick(CHAT.joinYes));
}
export function kick(f) {
  if (!f.inParty || f.isHero) return;
  f.inParty = false; f.fake.state = 'home'; S.party = S.party.filter(p => p !== f);
  if (f.dead) Cb.revive(f, 1);
  chat('sys', null, `${f.name} leaves the group.`);
}
export function befriend(f) { if (!f.fake) return; f.fake.friend = !f.fake.friend; chat('sys', null, f.fake.friend ? `${f.name} is now your friend. Friends always say yes when they're free.` : `${f.name} removed from friends.`); save(); }
export function partyCommand(cmd) {
  S.cmd = cmd;
  // monks and bards are the best pullers, then any tank
  const mates = S.party.filter(p => p !== S.hero && !p.dead);
  const puller = mates.find(p => p.cls === 'monk') || mates.find(p => p.cls === 'bard') || mates.find(p => roleOf(p) === 'tank');
  if (cmd === 'pull') {
    S.cmd = 'follow';
    const t = S.target;
    if (!puller) { chat('sys', null, 'You need a tank, Monk or Bard companion to pull for you.'); return; }
    if (!t || !t.mob || t.dead) { chat('sys', null, 'Target the enemy you want pulled first.'); return; }
    puller.pull = { tgt: t, phase: 'go', spot: { x: S.hero.x, z: S.hero.z } };
    return;
  }
  if (cmd === 'hold') for (const p of S.party) p.holdAt = { x: p.x, z: p.z };
  chat('party', S.hero.name, { follow: 'Follow me.', assist: 'Assist me — attack my target.', hold: 'Hold here.' }[cmd]);
}

// ---------- class switching ----------
export function switchClass(cls) {
  const h = S.hero;
  if (Cb.inCombat(h)) { chat('sys', null, "You can't change class in combat."); return false; }
  if (h.dead) return false;
  S.classes[S.heroCls] = { lvl: h.lvl, xp: h.xp };
  for (const p of S.ents) if (p.pet && p.pet.owner === h && !p.charmed) { p.dead = true; p.remove = true; }
  S.heroCls = cls; h.cls = cls; h.lvl = S.classes[cls].lvl; h.xp = S.classes[cls].xp;
  h.resType = CLASSES[cls].res; h.kind = CLASSES[cls].models[0]; h.buffs = []; h.cds = {}; h.casting = null; h.ult = 0; h.autoOn = false;
  h.resMax = 0; applyGear(h, S.gear[cls]); h.hp = h.maxHp; h.res = startRes(h);
  R.burst(h.x, h.y + 1, h.z, 30, [1, .9, .6], 2.5, 1, .6);
  chat('sys', null, `You are now a level ${h.lvl} ${CLASSES[cls].name}.`);
  save(); return true;
}

// ---------- quests ----------
export const questsFor = giver => QUESTS.filter(q => q.giver === giver && (!q.cls || q.cls === S.heroCls));
export function questState(q) { return S.quests[q.id]?.state || (q.pre && S.quests[q.pre]?.state !== 'turned' ? 'locked' : 'open'); }
export function acceptQuest(q) { S.quests[q.id] = { state: 'active', n: 0 }; chat('sys', null, `Quest accepted: ${q.name}`); if (q.rival && S.zone === 'coast') spawnRival(q.rival); save(); }
export function turnIn(q) {
  const st = S.quests[q.id]; if (!st || st.state !== 'done') return;
  st.state = 'turned';
  S.gold += q.gold;
  Cb.giveXp(S.hero, q.xp);
  chat('sys', null, `Quest complete: ${q.name}. +${q.xp} xp, +${q.gold} gold.`);
  if (q.gear) { const it = randomGear(q.lvl + 1, S.heroCls, .2); if (it.rarity < 1) { it.rarity = 1; } addToBag(it); chat('loot', null, `You receive ${it.name}.`); }
  if (q.signature) { const c = q.signature, t = WTYPE[c][0]; const it = makeItem({ name: SIGNATURE[c], slot: 'weapon', type: t, lvl: 16, rarity: 3, signature: true, stats: { pow: 32, sta: 14, crit: 3 }, value: 200 }); addToBag(it); chat('loot', null, `You receive your signature weapon: ${it.name}!`); }
  save();
}
function questProgress(mob, near) {
  if (mob.tagged !== 'party' || !near.includes(S.hero) && !S.party.some(p => near.includes(p))) return;
  for (const q of QUESTS) {
    const st = S.quests[q.id]; if (!st || st.state !== 'active') continue;
    const o = q.obj; let hit = false;
    if (o.kill && o.kill.includes(mob.mob) && (!o.dungeon || mob.dungeon) && (!o.reef || mob.spawn?.area === 5) && !mob.named && !mob.add) hit = true;
    if (o.named && mob.named === o.named) hit = true;
    if (o.collect && o.collect.includes(mob.mob)) { if (Math.random() < o.chance) { hit = true; chat('loot', null, `You loot ${o.item}.`); } }
    if (hit) { st.n = Math.min(o.n, st.n + 1); floatText(S.hero, `${q.name} ${st.n}/${o.n}`, '#ffd34d'); if (st.n >= o.n) { st.state = 'done'; chat('sys', null, `${q.name}: done! Return to ${GIVERS[q.giver].name}.`); } }
  }
}

// ---------- bags and loot ----------
export function addToBag(it) { if (S.bag.length >= 30) { chat('sys', null, 'Your bags are full.'); return false; } S.bag.push(it); return true; }
export function equip(it) {
  const cls = S.heroCls; if (!canWear(cls, it)) { chat('sys', null, `A ${CLASSES[cls].name} can't use that.`); return; }
  const old = S.gear[cls][it.slot]; S.gear[cls][it.slot] = it; S.bag = S.bag.filter(b => b !== it); if (old) S.bag.push(old);
  applyGear(S.hero, S.gear[cls]); save();
}
export function unequip(slot) { const cls = S.heroCls, it = S.gear[cls][slot]; if (!it || S.bag.length >= 30) return; S.gear[cls][slot] = null; S.bag.push(it); applyGear(S.hero, S.gear[cls]); save(); }
export function sell(it) { S.bag = S.bag.filter(b => b !== it); S.gold += it.value; chat('sys', null, `Sold ${it.name} for ${it.value} gold.`); save(); }
export function buyPot(k) { const p = POTIONS[k]; if (S.gold < p.price) { chat('sys', null, 'Not enough gold.'); return; } if (p.once && S.pole) return; S.gold -= p.price; if (p.once) { S.pole = true; chat('sys', null, `You buy a ${p.name}.`); } else S.pots[k]++; save(); }
export function drinkPot(k) {
  const h = S.hero; if (h.dead || !S.pots[k]) return 'None left';
  if ((h.cds['pot'] || 0) > 0) return 'Potion not ready';
  S.pots[k]--; h.cds['pot'] = 60;
  if (k === 'hpot') Cb.heal(h, h, h.maxHp * .4); else h.res = Math.min(h.resMax, h.res + h.resMax * .4);
  R.burst(h.x, h.y + 1.2, h.z, 16, k === 'hpot' ? [1, .4, .4] : [.4, .7, 1], 1.5, .7, .5);
  return null;
}
// a looted item goes to someone in the party. Companions remember whether you were fair.
export function assignLoot(mob, it, who) {
  mob.loot = mob.loot.filter(x => x !== it);
  if (who === S.hero) {
    if (!addToBag(it)) { mob.loot.push(it); return; }
    chat('loot', null, `You receive ${it.name}.`);
    if (!canWear(S.heroCls, it)) {
      const wants = S.party.find(p => p !== S.hero && canWear(p.cls, it));
      if (wants) { wants.fake.mood--; chat('party', wants.name, pick(CHAT.grumble)); }
    }
    return;
  }
  // a companion wears it if it's an upgrade on what their level gives them
  const s = it.stats; who.bonusPow = (who.bonusPow || 0) + (s.pow || 0) * .5; who.bonusSta = (who.bonusSta || 0) + (s.sta || 0) * .5; who.bonusArm = (who.bonusArm || 0) + (s.arm || 0) * .3;
  fakeGear(who); who.fake.mood += canWear(who.cls, it) ? 2 : 1;
  chat('loot', null, `${who.name} receives ${it.name}.`); chat('party', who.name, pick(CHAT.thanks));
}

// ---------- death and the corpse run ----------
Cb.setHooks({
  onHumanDeath(e) {
    if (e.isHero) {
      S.dead = true; S.deathAt = { x: e.x, z: e.z }; chat('sys', null, 'You have died.');
      const alive = S.party.filter(p => !p.dead);
      if (!alive.length) chat('party', pick(S.party.filter(p => p !== e) || [e])?.name || e.name, pick(CHAT.wipe));
    } else if (e.inParty) { chat('party', e.name, pick(CHAT.died)); }
    else if (e.fake && Math.random() < .3) chat('gen', e.name, pick(CHAT.died));
  },
  onMobDeath(mob, credit, near) {
    if (mob.tagged === 'party') questProgress(mob, near);
    if (mob.boss && mob.mob === 'abom') { chat('sys', null, `${mob.name} falls. The Ossuary is quiet.`); for (const p of S.party) if (p !== S.hero) { chat('party', p.name, pick(['GG!!', 'we did it', 'gg nice tanking', 'loot time'])); break; } S.dangers = []; }
    if (mob.named === 'captain' && mob.tagged !== 'party') chat('gen', credit[0]?.name || 'Someone', `got ${mob.name}, sorry campers`);
    if (mob.named === 'admiral') {
      chat('say', mob.name, 'Then let the deep take you. Wake, old friend. WAKE.');
      world.levT = S.time + 3;
    }
    if (mob.named === 'leviathan') { chat('sys', null, 'The leviathan sinks into the dark. The bubble shudders: swim back up when you\'re ready.'); for (const p of S.party) if (p !== S.hero) { chat('party', p.name, pick(['WE DID IT', 'gg!!! that was insane', 'loot!!', 'I need a drink'])); break; } }
  },
  onLevel(p) {
    if (p.isHero) {
      S.classes[S.heroCls] = { lvl: p.lvl, xp: p.xp };
      chat('sys', null, `You reached level ${p.lvl}!`);
      const nw = Object.values(CLASSES[p.cls].abilities).filter(a => a.lvl === p.lvl);
      for (const a of nw) chat('sys', null, `New ability: ${a.name}. ${a.desc}`);
      for (const q of S.party) if (q !== p && Math.random() < .6) setTimeout(() => chat('party', q.name, pick(CHAT.gz)), 600 + Math.random() * 1500);
      save();
    } else {
      if (p.fake) fakeGear(p);
      if (p.inParty) { chat('party', p.name, pick(CHAT.ding).replace('{lvl}', p.lvl)); }
      else if (Math.random() < .25) chat('gen', p.name, pick(CHAT.ding).replace('{lvl}', p.lvl));
    }
  },
});
export function release() {
  const h = S.hero; if (!h.dead) return;
  // the corpse keeps your gear; you wake at the bind stone without it
  const loss = Math.round(xpNeed(h.lvl) * .1); h.xp = Math.max(0, h.xp - loss);
  S.corpse = { zone: S.zone === 'fleet' ? 'coast' : S.zone, x: S.zone === 'fleet' ? world.names && 0 : h.x, z: h.z, cls: S.heroCls, gear: { ...S.gear[S.heroCls] } };
  if (S.zone === 'fleet') { S.corpse.x = 160 + 3; S.corpse.z = 200 + 3; } // a body lost in the fleet washes up by the buoy
  else S.corpse.ent = Cb.makeEnt({ team: 'npc', name: `${h.name}'s corpse`, kind: 'corpse', x: h.x, z: h.z, corpse: true, maxHp: 1, hp: 1 });
  S.gear[S.heroCls] = {};
  h.dead = false; h.buffs = []; applyGear(h, {}); h.hp = Math.round(h.maxHp * .5); h.res = startRes(h) * .5; h.ult = 0;
  S.dead = false; S.target = null; S.dangers = [];
  for (const p of S.party) if (p !== h) { if (p.dead) Cb.revive(p, .5); p.casting = null; p.pull = null; }
  if ((S.bind.zone || 'vale') !== S.zone) travel(S.bind.zone || 'vale', { x: S.bind.x, z: S.bind.z }, true);
  else { h.x = S.bind.x; h.z = S.bind.z; h.y = hgt(h.x, h.z); for (const p of S.party) if (p !== h) { p.x = h.x + rnd(-3, 3); p.z = h.z + rnd(-3, 3); p.y = hgt(p.x, p.z); } }
  chat('sys', null, `You wake at the bind stone with ${loss} less xp and without your gear. Run back to your corpse to get it (it's marked on the map).`);
  save();
}
export function lootCorpse() {
  const c = S.corpse; if (!c || !c.ent || dist(S.hero, c) > 6) return;
  for (const k in c.gear) if (c.gear[k]) { const cur = S.gear[c.cls][k]; if (cur) S.bag.push(cur); S.gear[c.cls][k] = c.gear[k]; }
  if (c.cls === S.heroCls) applyGear(S.hero, S.gear[c.cls]);
  c.ent.dead = true; c.ent.remove = true; S.corpse = null;
  chat('sys', null, 'You recover your gear from your corpse.'); save();
}

// ---------- the guards of the town ----------
function guardAI(g, dt) {
  const tw = g.townC || world.town;
  g.attackT = (g.attackT || 0) - dt;
  let t = g.target;
  if (!t || t.dead || t.evading || t.charmed || Math.hypot(t.x - tw.x, t.z - tw.z) > tw.R + 18) {
    t = g.target = S.ents.find(m => m.mob && !m.dead && !m.evading && !m.charmed && Math.hypot(m.x - tw.x, m.z - tw.z) < tw.R + 12) || null;
  }
  if (!t) { AI.goTo(g, g.home.x, g.home.z, dt, .5, .6); return; }
  if (dist(g, t) > 2.8) { AI.goTo(g, t.x, t.z, dt, 2.4, 1.2); return; }
  AI.face(g, t, dt);
  if (g.attackT <= 0) { g.attackT = 1.4; g.anim.atk = 1; Cb.damage(g, t, g.power, 'phys', { threat: 3 }); }
}

// ---------- the world ticking ----------
let chatT = 8, groupT = 30, saveT = 30;
export function tick(dt) {
  S.time += dt;
  const h = S.hero;
  for (let i = S.ents.length - 1; i >= 0; i--) {
    const e = S.ents[i];
    if (e.remove) { S.ents.splice(i, 1); continue; }
    if (e.team === 'npc') { if (e.vendor || e.giver || e.armory) { e.anim.mv = 0; } continue; }
    if (e.onBoat && !e.dead) { Cb.updateBuffs(e, dt); Cb.regen(e, dt); e.anim.mv = 0; continue; }
    Cb.updateBuffs(e, dt);
    if (!e.dead) {
      Cb.updateCasting(e, dt);
      Cb.regen(e, dt);
      if (e.pet) AI.petAI(e, dt);
      else if (e.mob) AI.mobAI(e, dt);
      else if (e.guard) guardAI(e, dt);
      else if (e.fake) AI.fakeAI(e, dt);
      if (e.cls) Cb.updateAuto(e, dt);
      e.still = e.moving > .1 ? 0 : (e.still || 0) + dt;
    } else if (e.pet && !e.mob) { e.remove = true;
    } else if (e.mob) {
      // bodies stay a while to be looted, then fade and the spawn point starts its timer
      const looted = !e.loot?.length || e.lootFor !== 'party';
      if (S.time - e.deadT > (looted ? 25 : 90)) { e.remove = true; if (e.spawn) { e.spawn.alive = null; e.spawn.timer = e.spawn.respawn * rnd(.8, 1.2); } }
    }
    // animation state
    const a = e.anim;
    a.ph += dt * (e.spd || 5) * 1.6 * Math.min(1, e.moving);
    a.mv = e.dead ? 0 : e.sit ? 2 : e.moving;
    a.atk = Math.max(0, a.atk - dt * 3); a.flash = Math.max(0, a.flash - dt * 5);
    const gy = hgt(e.x, e.z), wy = world.water !== null && world.water - gy > 1.3 && !(e.mob && MOBS[e.mob].fly) ? world.water - 1.15 : gy;
    e.swim = wy !== gy; e.y += (wy - e.y) * Math.min(1, dt * 12);
  }
  separate();
  Sea.tick(dt);
  if (world.levT && S.time >= world.levT) {
    world.levT = 0;
    const L = Cb.makeMob('leviathan', 20, { x: 0, z: -60, home: { x: 0, z: -60 }, named: 'leviathan', boss: true, dungeon: true });
    L.name = world.names.leviathan; L.yaw = 0; L.y = hgt(0, -60);
    for (const p of S.party) if (!p.dead) Cb.addThreat(L, p, roleOf(p) === 'tank' ? 50 : 5);
    chat('sys', null, 'The seabed shakes. Something enormous rises from the dark beyond the flagship!');
    R.burst(0, 3, -60, 80, [.3, .7, .9], 6, 1.6, 1.2);
  }
  for (const sp of world.spawns) if (!sp.alive) { sp.timer -= dt; if (sp.timer <= 0 && !nearParty(sp, 25)) spawn(sp); }
  Cb.updateProjectiles(dt);
  AI.updateDangers(dt);
  // the general chat channel, and fake players forming groups
  if ((chatT -= dt) <= 0) { chatT = rnd(9, 22); generalChat(); }
  if ((groupT -= dt) <= 0) { groupT = rnd(40, 90); formFakeGroup(); }
  if ((saveT -= dt) <= 0) { saveT = 30; save(); }
  if (S.target && (S.target.remove || (S.target.dead && S.target.mob && !S.target.loot?.length && S.time - S.target.deadT > 3))) S.target = null;
  // leaving combat clears the damage meter after a while
  if (!S.party.some(p => Cb.inCombat(p)) && S.time - (S.meterT || 0) > 12) { S.meter = {}; S.meterT = S.time; }
  if (S.party.some(p => Cb.inCombat(p))) S.meterT = S.time;
}
// bodies push apart so nobody stands inside anybody else. Town people don't budge,
// big things move less than small ones, and you barely get nudged.
const sepGrid = new Map();
function separate() {
  sepGrid.clear();
  const CELL = 3, key = (x, z) => (Math.floor(x / CELL) + 1000) * 4000 + Math.floor(z / CELL) + 1000;
  for (const e of S.ents) { if (e.dead || e.remove || e.corpse || e.bindstone) continue; const k = key(e.x, e.z); let c = sepGrid.get(k); if (!c) sepGrid.set(k, c = []); c.push(e); }
  const pushed = new Set();
  for (const e of S.ents) {
    if (e.dead || e.remove || e.corpse || e.bindstone) continue;
    const cx = Math.floor(e.x / CELL), cz = Math.floor(e.z / CELL);
    for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
      const cell = sepGrid.get((cx + dx + 1000) * 4000 + cz + dz + 1000); if (!cell) continue;
      for (const o of cell) {
        if (o.id <= e.id) continue;
        const min = ((e.r || .5) + (o.r || .5)) * .95, ddx = o.x - e.x, ddz = o.z - e.z, d2 = ddx * ddx + ddz * ddz;
        if (d2 >= min * min) continue;
        let d = Math.sqrt(d2), nx = ddx / (d || 1), nz = ddz / (d || 1);
        if (d < 1e-3) { const a = (e.id * 2.39) % (Math.PI * 2); nx = Math.cos(a); nz = Math.sin(a); d = 0; }
        const fixedE = e.team === 'npc', fixedO = o.team === 'npc';
        if (fixedE && fixedO) continue;
        let we = (o.r || .5) ** 2 * (e.isHero ? .25 : 1), wo = (e.r || .5) ** 2 * (o.isHero ? .25 : 1);
        if (fixedE) { we = 0; wo = 1; } else if (fixedO) { we = 1; wo = 0; }
        const tot = we + wo || 1, over = (min - d) * .6;
        e.x -= nx * over * we / tot; e.z -= nz * over * we / tot; o.x += nx * over * wo / tot; o.z += nz * over * wo / tot;
        if (we) pushed.add(e); if (wo) pushed.add(o);
      }
    }
  }
  for (const e of pushed) collide(e, e.r || .5);
}
const nearParty = (sp, r) => S.party.some(p => Math.hypot(p.x - sp.x, p.z - sp.z) < r);
function generalChat() {
  const pool = S.fakes.filter(f => !f.inParty && !f.dead); if (!pool.length) return;
  const f = pick(pool), N = world.names, coast = S.zone === 'coast';
  const named = coast ? pick([N.redwake, N.queen, N.tidecaller, N.snapper].filter(Boolean)) : pick([N.captain, N.tusk]);
  const roles = ['tank', 'healer', 'dps', ...CLASS_KEYS.map(k => CLASSES[k].name)];
  const items = coast ? ['Coral Hauberk', 'Fine Cutlass', 'a Black Pearl', 'Brined Boots', 'Admiralty Gloves'] : ['Thick Pelt x5', 'Fine Mace', "Wayfarer's Boots", 'a Clarity Draught'];
  const dungeon = coast ? 'Sea Caves' : (N.ruin || 'the dungeon').replace('The ', '');
  let line = pick(CHAT.general.filter(l => f.lvl > 1 || !l.includes('{lvl}')));
  if (coast && Math.random() < .35) line = pick(['LFG Sunken Fleet, need {role}', 'ferry to Fort Halyard just left, ugh', 'anyone fishing? Black Pearls sell for 60g', 'sharks off Gull Isle are brutal, swim fast', '{named} up at {area}?', 'WTS {item}', 'LF healer for Sea Caves', 'who has Seasong? need a bard for the reef', 'drowned on the reef again lol', 'any druids for a port to the Vale?']);
  line = line.replace('{area}', pick(REGION_NAMES())).replace('{role}', pick(roles)).replace('{ruin}', dungeon).replace('{named}', named || 'the named')
    .replace('{item}', pick(items)).replace('{n}', irnd(1, 3)).replace('{pname}', pick(pool).name).replace('{lvl}', f.lvl)
    .replace('{guild}', f.fake.guild || pick(GUILDS)).replace('{town}', N.town || N.port || 'town').replace('{wood}', N.wood || N.gull || 'the woods');
  chat(f.fake.guild && Math.random() < .2 ? 'guild' : 'gen', f.name, line);
}
function formFakeGroup() {
  const free = S.fakes.filter(f => !f.inParty && !f.dead && !f.fake.group && f.fake.state === 'town');
  if (free.length < 3) return;
  const lead = pick(free), mates = free.filter(f => f !== lead && Math.abs(f.lvl - lead.lvl) <= 2).slice(0, irnd(1, 3));
  if (!mates.length) return;
  const g = [lead, ...mates];
  for (const m of g) { m.fake.group = g; m.fake.state = 'hunt'; m.fake.until = S.time + rnd(240, 480); m.fake.spot = null; }
  lead.fake.area = lead.lvl <= 3 ? 0 : lead.lvl <= 5 ? 1 : lead.lvl <= 7 ? 2 : 3;
  chat('gen', lead.name, `group of ${g.length} heading to ${REGION_NAMES()[lead.fake.area]}`);
}

// ---------- saving ----------
export function snapshot() {
  const h = S.hero;
  if (h) S.classes[S.heroCls] = { lvl: h.lvl, xp: h.xp };
  const strip = it => it ? { ...it } : null;
  const pops = { ...(S.pops || {}) }; if (S.zone !== 'fleet') pops[S.zone] = S.fakes.filter(f => !f.inParty).map(fakeData);
  return {
    v: 2, seed: S.seed, heroName: S.heroName, heroCls: S.heroCls, classes: S.classes, gold: S.gold, pots: S.pots, quests: S.quests, bar: S.bar, time: S.time,
    zone: S.zone, hx: h ? h.x : 0, hz: h ? h.z : 0, bind: S.bind, pole: !!S.pole, pops,
    gear: Object.fromEntries(Object.entries(S.gear).map(([k, g]) => [k, Object.fromEntries(Object.entries(g).map(([s, it]) => [s, strip(it)]))])),
    bag: S.bag.map(strip), corpse: S.corpse ? { zone: S.corpse.zone || 'vale', x: S.corpse.x, z: S.corpse.z, cls: S.corpse.cls, gear: S.corpse.gear } : null,
    partyData: S.party.filter(p => !p.isHero).map(fakeData),
  };
}
export function save() { if (!S.running) return; try { localStorage.setItem(SAVE_KEY, JSON.stringify(snapshot())); } catch (e) { } }
export function hasSave() { try { return !!localStorage.getItem(SAVE_KEY); } catch (e) { return false; } }
export function loadSave(data) {
  const sv = data || JSON.parse(localStorage.getItem(SAVE_KEY));
  Object.assign(S, { seed: sv.seed, heroName: sv.heroName, heroCls: sv.heroCls, classes: sv.classes, gold: sv.gold, pots: sv.pots || { hpot: 0, mpot: 0 }, quests: sv.quests || {}, bar: sv.bar, bag: sv.bag || [], gear: sv.gear, pole: !!sv.pole });
  for (const k of CLASS_KEYS) { if (!S.classes[k]) S.classes[k] = { lvl: 1, xp: 0 }; if (!S.gear[k]) S.gear[k] = starterGear(k); if (!S.bar[k]) S.bar[k] = defaultBar(k); }
  // Build 3 added spells: slot any new ones you've learned into empty bar keys
  for (const k of CLASS_KEYS) { const bar = S.bar[k], all = defaultBar(k); for (const key of all) if (key && !bar.includes(key)) { const i = bar.indexOf(null); if (i >= 0) bar[i] = key; } }
  S.pops = sv.pops || { vale: sv.fakes || null };
  S.bind = sv.bind && sv.bind.x !== undefined ? { zone: sv.bind.zone || 'vale', ...sv.bind } : null;
  S.corpse = sv.corpse ? { ...sv.corpse, zone: sv.corpse.zone || 'vale' } : null;
  S.hero = null; S.party = [];
  const zone = sv.zone === 'fleet' ? 'coast' : (sv.zone || 'vale');
  const party = sv.partyData || [];
  startWorld({ zone, arrive: sv.zone === 'fleet' ? null : (sv.hx !== undefined ? { x: sv.hx, z: sv.hz } : null), carry: party });
  if (sv.zone === 'fleet') { S.hero.x = world.buoy.x + 3; S.hero.z = world.buoy.z + 3; }
  // older saves kept only names: find those friends among the fake players
  if (!sv.partyData) for (const n of sv.party || []) { const f = S.fakes.find(x => x.name === n); if (f) { f.x = S.hero.x + rnd(-2, 2); f.z = S.hero.z + rnd(-2, 2); f.y = hgt(f.x, f.z); f.fake.group = null; f.inParty = true; f.fake.state = 'party'; S.party.push(f); } }
  S.time = sv.time || 0;
  chat('sys', null, `Welcome back, ${S.heroName}.`);
}
// save codes: compressed JSON, so progress can move between builds and devices
export async function makeCode() {
  const raw = new TextEncoder().encode(JSON.stringify(snapshot()));
  const cs = new Blob([raw]).stream().pipeThrough(new CompressionStream('deflate-raw'));
  const buf = new Uint8Array(await new Response(cs).arrayBuffer());
  let s = ''; for (const b of buf) s += String.fromCharCode(b);
  return 'OSSU1.' + btoa(s);
}
export async function readCode(code) {
  code = code.trim(); if (!code.startsWith('OSSU1.')) throw new Error('Not a save code');
  const bin = atob(code.slice(6)), buf = Uint8Array.from(bin, c => c.charCodeAt(0));
  const ds = new Blob([buf]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
  return JSON.parse(await new Response(ds).text());
}

Sea.bindGame({ travel, addToBag, save });
