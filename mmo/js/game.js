// The game: starting a world, the town's people, fake players, spawns, quests, loot, death, saving.
import { S, rnd, irnd, pick, dist, chat, floatText, clamp, TAU, fct, X } from './core.js';
import { CLASSES, CLASS_KEYS, MOBS, QUESTS, GIVERS, FAKE_NAMES, PERSONAS, GUILDS, CHAT, xpNeed, defaultBar, randomGear, makeItem, WTYPE, WEAR, POTIONS, NAMED_NAMES, MAX_LVL, roleOf, startRes, BASE_NAMES, SETS, SIGNATURE } from './data.js';
import * as Sea from './sea.js';
import { LORE, SCENES, PERKS } from './story.js';
import './valeplus.js';
import { INSTANCES, DBOSSES } from './dungeons.js';
import * as Craft from './crafting.js';
import * as Loot5 from './loot5.js';
import * as Mystery from './mystery.js';
import './dialogue.js';
import * as Banter from './banter.js';
import { FAMILIES } from './data.js';
import * as Cb from './combat.js';
import * as AI from './ai.js';
import { generateWorld, world, hgt, REGION_NAMES, regionAt, collide, depthAt, ZONE_SIZE } from './world.js';
import './zones.js';
import { defineHuntZones, zoneAt } from './hunt.js';
import * as R from './render.js';

const SAVE_KEY = 'ossuary-mmo-1';
// Build 4.4: quests give three quarters of the xp they used to, like everything else
for (const q of QUESTS) q.xp = Math.round((q.xp || 0) * Cb.XP_RATE);

// ---------- gear ----------
export function canWear(cls, it) {
  if (it.slot === 'ring' || it.slot === 'neck') return true;
  if (it.slot === 'recipe' || it.slot === 'collect' || it.slot === 'book' || it.slot === 'junk') return false;
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
function fakeGear(e) { e.gearPow = Math.round(e.lvl * 2.2 + 2); e.gearSta = Math.round(e.lvl * 3 + 3); e.gearArm = Math.round(e.lvl * (CLASSES[e.cls].armor === 'plate' ? 9 : 4)) + (e.bonusArm || 0); e.gearPow += e.bonusPow || 0; e.gearSta += e.bonusSta || 0; if (X.dollGear) X.dollGear(e); Cb.recalc(e); }
function starterGear(cls) {
  const t = WTYPE[cls], a = CLASSES[cls].armor, arm = a === 'plate' ? 4 : a === 'leather' ? 2 : 1;
  return {
    weapon: makeItem({ name: 'Plain ' + BASE_NAMES.weapon[t[0]][0], slot: 'weapon', type: t[0], lvl: 1, rarity: 0, stats: { pow: 3, sta: 1 }, value: 2 }),
    off: makeItem({ name: 'Plain ' + BASE_NAMES.off[t[1]][0], slot: 'off', type: t[1], armorType: t[1] === 'shield' ? 'plate' : null, lvl: 1, rarity: 0, stats: t[1] === 'shield' ? { sta: 2, arm: 8 } : { pow: 1, sta: 1 }, value: 2 }),
    chest: makeItem({ name: { plate: 'Dented Breastplate', leather: 'Patched Jerkin', cloth: 'Initiate Robe' }[a], slot: 'chest', type: a, armorType: a, lvl: 1, rarity: 0, stats: { sta: 2, arm: arm * 3 }, value: 2 }),
  };
}

// ---------- starting and loading ----------
export function newGame(cls, heroName, seed = (Math.random() * 1e9) | 0, friendCls = null) {
  S.pendingFriendCls = friendCls;
  S.seed = seed; S.time = 0; S.gold = 5; S.bag = []; S.pots = { hpot: 3, mpot: 3 }; S.quests = {}; S.friends = [];
  S.classes = {}; S.gear = {}; S.bar = {};
  for (const k of CLASS_KEYS) { S.classes[k] = { lvl: 1, xp: 0 }; S.gear[k] = starterGear(k); S.bar[k] = defaultBar(k); }
  S.heroCls = cls; S.heroName = heroName; S.owned = [cls]; S.unlockPicks = 0;
  S.pops = {}; S.bind = null; S.zone = X.startZone ? X.startZone() : 'vale'; S.pole = false;
  S.flags = {}; S.lore = {}; S.perks = []; S.bank = []; S.used = {}; S.scenesSeen = {}; S.vetXp = 0; S.huntOn = false; S.prof = {}; S.mats = {}; S.recipes = []; S.cons = {}; S.collection = []; S.title = null; S.pet = null; S.campOrder = null; S.cmd = 'follow'; S.ext = {};
  S.ext.race = S.pendingRace || 'human'; S.pendingRace = null; S.zone = X.startZone ? X.startZone() : 'vale';
  startWorld({ zone: S.zone });
  S.pendingScene = X.startScene ? X.startScene() : 'intro';
  makeFriends();
  chat('sys', null, `Welcome to ${world.names.town}.`);
}
// fake players as plain data, so they keep their levels between zones and saves
export function fakeData(f) { return { name: f.name, cls: f.cls, lvl: f.lvl, xp: f.xp || 0, pal: f.pal || 1, persona: f.fake.persona, guild: f.fake.guild, mood: f.fake.mood, friend: f.fake.friend, bff: !!f.fake.bff, bonusPow: f.bonusPow || 0, bonusSta: f.bonusSta || 0, bonusArm: f.bonusArm || 0 }; }
function startWorld(opts = {}) {
  const zone = opts.zone || 'vale', old = S.hero;
  S.scene = null; S.pendingScene = null; S.sceneEnd = null;
  S.ents.length = 0; S.party = []; S.dangers = []; S.meter = {}; S.target = null; S.dead = false; Cb.projectiles.length = 0;
  if (!opts.keepLog) S.log.length = 0;
  S.zone = zone; world.fleetT = 0; world.underwater = false;
  generateWorld(S.seed, zone); Craft.decorate(zone, S.seed); densify(zone); defineHuntZones();
  const tw = world.town, a = opts.arrive || { x: tw.x + 1, z: tw.z + 4 };
  const hero = Cb.makeHuman(S.heroCls, S.classes[S.heroCls].lvl, { name: S.heroName, isHero: true, inParty: true, x: a.x, z: a.z, pal: 0 });
  hero.xp = S.classes[S.heroCls].xp; hero.kind = CLASSES[S.heroCls].models[0];
  hero.acct = acctBonus(); applyGear(hero, S.corpse ? {} : S.gear[S.heroCls]); hero.hp = hero.maxHp; hero.res = startRes(hero);
  if (old && opts.carryHero && !old.dead) { hero.buffs = old.buffs.filter(b => b.dur > 20).map(b => ({ ...b, src: hero })); Cb.recalc(hero); hero.hp = Math.max(1, Math.round(hero.maxHp * old.hp / old.maxHp)); hero.res = old.res; hero.ult = old.ult; hero.yaw = old.yaw; }
  S.hero = hero; S.party = [hero];
  townsfolk(zone);
  // mobs
  for (const sp of world.spawns) if (!(sp.gate && S.flags[sp.gate + 'Yielded']) && (!sp.when || sp.when())) spawn(sp);
  if (zone === 'coast') for (const q of QUESTS) if (q.rival && S.quests[q.id]?.state === 'active') spawnRival(q.rival);
  // fake players live in each zone
  makeFakes(INSTANCES[zone] ? [] : S.pops?.[zone] || null, zone);
  if (S.corpse && (S.corpse.zone || 'vale') === zone) S.corpse.ent = Cb.makeEnt({ team: 'npc', name: `${S.heroName}'s corpse`, kind: 'corpse', x: S.corpse.x, z: S.corpse.z, corpse: true, maxHp: 1, hp: 1 });
  // the group comes with you
  for (const d of opts.carry || []) addMate(d, hero);
  Sea.setupZone();
  S.running = true;
  for (const f of X.zone) f(zone);
}
// Build 4.4: more enemies everywhere. Most spawns get a partner standing close by (dungeons a bit fewer).
function densify(zone) {
  let a = (S.seed ^ (zone.length * 2654435761)) >>> 0;
  const rng = () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const add = [];
  for (const sp of world.spawns) {
    if (sp.named || sp.ph || sp.boss || sp.boss2 || sp.gate || sp.elite) continue;
    if (rng() > (sp.dungeon || zone === 'fleet' ? .5 : .8)) continue;
    const wet = depthAt(sp.x, sp.z) > .5;
    for (let k = 0; k < 6; k++) {
      const ang = rng() * TAU, d = 2.6 + rng() * 2.4, x = sp.x + Math.sin(ang) * d, z = sp.z + Math.cos(ang) * d;
      if ((depthAt(x, z) > .5) !== wet && !world.underwater) continue;
      add.push({ ...sp, x, z, y: hgt(x, z), alive: null, timer: 0 }); break;
    }
  }
  world.spawns.push(...add);
}
// ---------- your two friends: always your level, always the roles you're missing ----------
// the four jobs in a starting group: you fill one, your three friends fill the rest
export const SLOT_OF = k => ['illusionist', 'bard'].includes(k) ? 'support' : CLASSES[k].role;
export const NEED_FOR = k => ['tank', 'healer', 'dps', 'support'].filter(r => r !== SLOT_OF(k));
export const FRIEND_CLS = { tank: ['bulwark', 'bladewarden', 'wardancer'], healer: ['cleric', 'lifebinder', 'aegis'], dps: ['longwatch', 'elementalist', 'knifeshade', 'warlock', 'blightblade'], support: ['illusionist', 'bard'] };
const FRIEND_HI = { tank: 'Shields up. I\'ll take the hits.', healer: "I've got heals. Don't stand in fire.", dps: "I'll make things fall over.", support: "I'll keep the buffs up and put the extras to sleep." };
export const defaultFriendCls = k => NEED_FOR(k).map(r => pick(FRIEND_CLS[r]));
export function makeFriends() {
  if (S.friendsMade) return;
  S.friendsMade = true;
  const used = new Set([...S.fakes.map(f => f.name), S.heroName]);
  const names = ['Tamsin', 'Brannoc', 'Mirelle', 'Odo', 'Finch', 'Rowena', 'Garrick', 'Ysolde'].filter(n => !used.has(n)).sort(() => Math.random() - .5);
  const room = 6 - S.party.length;
  if (room <= 0) return;
  const picks = (S.pendingFriendCls && S.pendingFriendCls.length ? S.pendingFriendCls : defaultFriendCls(S.heroCls)).slice(0, room); S.pendingFriendCls = null;
  S.friends = picks.map((cls, i) => ({ name: names[i] || 'Friend ' + (i + 1), pal: 1 + i, persona: 'friendly', cls }));
  for (const fr of S.friends) {
    const f = addMate({ name: fr.name, cls: fr.cls, lvl: S.hero.lvl, pal: fr.pal, persona: fr.persona, guild: null, friend: true, bff: true }, S.hero);
    chat('party', f.name, FRIEND_HI[SLOT_OF(fr.cls)]);
  }
  chat('sys', null, `${S.friends.map(f => f.name).slice(0, -1).join(', ')} and ${S.friends[S.friends.length - 1].name} join you.`);
}
// older characters started with two friends: a third (for crowd control and buffs) catches up with them
export function topUpFriends() {
  if (!S.friendsMade || (S.friends || []).length >= 3 || S.party.length >= 6) return;
  const used = new Set([...S.fakes.map(f => f.name), S.heroName, ...S.friends.map(f => f.name)]);
  const name = ['Wren', 'Pip', 'Lark', 'Sable', 'Quill', 'Juniper'].find(n => !used.has(n)) || 'Friend 3';
  const have = new Set([SLOT_OF(S.heroCls), ...S.friends.map(f => SLOT_OF(f.cls))]);
  const role = ['support', 'tank', 'healer', 'dps'].find(r => !have.has(r)) || 'support', cls = pick(FRIEND_CLS[role]);
  const fr = { name, pal: 3, persona: 'friendly', cls }; S.friends.push(fr);
  const f = addMate({ name, cls, lvl: S.hero.lvl, pal: fr.pal, persona: fr.persona, guild: null, friend: true, bff: true }, S.hero);
  chat('party', f.name, `Sorry I'm late! ${FRIEND_HI[SLOT_OF(cls)]}`);
}
// keep friends at your level, playing the classes you chose for them
export function syncFriends() {
  const h = S.hero; if (!h) return;
  const bffs = S.party.filter(p => p.fake?.bff);
  if (!bffs.length) return;
  for (const f of bffs) {
    let fr = (S.friends || []).find(x => x.name === f.name);
    if (!fr) { fr = { name: f.name, pal: f.pal || 1, persona: 'friendly' }; (S.friends = S.friends || []).push(fr); }
    if (!fr.cls) fr.cls = f.cls;                     // older saves: they keep what they were playing
    const cls = fr.cls;
    if (cls !== f.cls || f.lvl !== h.lvl) {
      const swap = cls !== f.cls, frac = f.dead ? .5 : f.hp / f.maxHp, at = { x: f.x, z: f.z };
      S.party = S.party.filter(p => p !== f); S.fakes = S.fakes.filter(p => p !== f); f.remove = true; f.dead = true;
      for (const p of petsOfAll(f)) { p.remove = true; p.dead = true; }
      const n = addMate({ ...fakeData(f), cls, lvl: h.lvl, xp: 0, hp: frac, bff: true, friend: true }, h);
      n.x = at.x; n.z = at.z; n.y = hgt(at.x, at.z);
      if (swap) chat('party', n.name, `Switching to my ${CLASSES[cls].name}. ${FRIEND_HI[CLASSES[cls].role]}`);
    }
  }
}
const petsOfAll = f => S.ents.filter(e => e.pet && e.owner === f);
// ---------- camp orders: the tank pulls the camp one at a time, or clears straight through; you follow the tank ----------
const tankOf = () => S.party.find(p => !p.isHero && !p.dead && CLASSES[p.cls].role === 'tank');
export function campOrder(mode) {
  const h = S.hero, tank = tankOf();
  if (!tank) { chat('sys', null, CLASSES[S.heroCls].role === 'tank' ? "You're the tank: lead the way in yourself." : 'You need a tank in your group to pull or clear a camp.'); return; }
  const t0 = S.target && S.target.mob && !S.target.dead && Cb.isEnemy(h, S.target) ? S.target : S.ents.filter(m => m.mob && !m.dead && !m.remove && Cb.isEnemy(h, m) && !m.charmed && dist(m, h) < 50).sort((a, b) => dist(a, h) - dist(b, h))[0];
  if (!t0) { chat('sys', null, 'No camp nearby. Walk closer to the enemies you want cleared.'); return; }
  // the camp is everything that spawns with this enemy, or everything close around it
  const mates = t0.camp ? S.ents.filter(m => m.mob && !m.dead && m.camp === t0.camp) : [t0];
  let cx = 0, cz = 0; for (const m of mates) { cx += m.x; cz += m.z; } cx /= mates.length; cz /= mates.length;
  S.campOrder = { mode, c: { x: cx, z: cz }, r: Math.max(12, ...mates.map(m => Math.hypot(m.x - cx, m.z - cz) + 6)), spot: { x: h.x, z: h.z }, tank, said: {} };
  S.cmd = mode; S.target = null;
  if (!S.quietCmd) chat('party', h.name, mode === 'pull' ? `${tank.name}, pull that camp to us. One at a time.` : `${tank.name}, take us through. Clear the camp.`);
  chat('party', tank.name, mode === 'pull' ? pick(["On it. Stay here, I'll bring them to you.", 'Pulling. Get ready.']) : pick(['Follow me in!', "Right behind me, everyone. Let's go."]));
}
export const campLeft = () => { const o = S.campOrder; return o ? S.ents.filter(m => m.mob && !m.dead && !m.remove && Cb.isEnemy(S.hero, m) && !m.charmed && Math.hypot(m.x - o.c.x, m.z - o.c.z) < o.r) : []; };
function campTick() {
  const o = S.campOrder; if (!o || o.mode === 'hunt') return;
  const tank = o.tank;
  if (!tank || tank.dead || !S.party.includes(tank) || S.hero.dead) { S.campOrder = null; S.cmd = 'follow'; return; }
  const left = campLeft(), fighting = S.ents.some(m => m.mob && !m.dead && m.threat && [...m.threat.keys()].some(k => S.party.includes(k)) && !m.evading);
  if (!left.length && !fighting) { chat('party', tank.name, pick(['Camp clear!', "That's the lot. Camp's clear.", 'All clear. Nice work.'])); S.campOrder = null; S.cmd = 'follow'; for (const p of S.party) p.pull = null; return; }
  // help: if you've no target, take the tank's
  if ((!S.target || S.target.dead) && tank.target && !tank.target.dead && Cb.isEnemy(S.hero, tank.target)) S.target = tank.target;
  if (o.mode === 'pull') {
    if (tank.pull || fighting || !left.length) return;
    const ready = S.party.every(p => p.dead || (p.hp > p.maxHp * .7 && !(p.resType === 'mana' && p.res < p.resMax * .45)));
    if (!ready) { if (!o.said.rest) { o.said.rest = 1; chat('party', tank.name, 'Resting up before the next pull.'); } return; }
    o.said.rest = 0;
    const t = left.sort((a, b) => Math.hypot(a.x - o.spot.x, a.z - o.spot.z) - Math.hypot(b.x - o.spot.x, b.z - o.spot.z))[0];
    tank.pull = { tgt: t, phase: 'go', spot: { ...o.spot } };
  }
}
// ---------- hunting: stays on until you switch it off; the tank works through whatever zone you're in ----------
export function setHunt(on) {
  const h = S.hero;
  S.huntOn = !!on;
  for (const p of S.party) p.pull = null;
  if (on) {
    S.campOrder = null; S.cmd = 'hunt'; S.target = null;
    const tank = tankOf(), zn = zoneAt(h.x, h.z);
    if (!S.quietCmd) chat('party', h.name, zn ? `Let's hunt ${zn.name}. Keep it going till I say stop.` : "Let's go hunting.");
    if (tank) chat('party', tank.name, pick(["Hunting it is. I'll keep pulling, you keep up.", "On it. I'll work my way through. Stay close.", "Right. Next one's mine. Follow me."]));
    
    huntTick(true);
  } else {
    if (S.campOrder?.mode === 'hunt') S.campOrder = null;
    S.cmd = 'follow';
    if (!S.quietCmd) chat('party', h.name, "That's enough hunting for now. Follow me.");
  }
  save();
}
const huntable = (zn, h) => S.ents.filter(m => m.mob && !m.dead && !m.remove && m.spawn?.hz === zn.id && !m.boss && !m.boss2 && !m.charmed && !m.evading
  && m.lvl <= h.lvl + (m.named ? 3 : 2) && Cb.isEnemy(h, m) && (world.underwater || depthAt(m.x, m.z) < 1.3) && Math.hypot(m.x - zn.x, m.z - zn.z) < zn.r + 15
  && !(m.threat && [...m.threat.keys()].some(k => !k.dead && !S.party.includes(k) && !(k.pet && S.party.includes(k.owner)))));
export const huntInfo = () => { const o = S.campOrder; return S.huntOn ? { zone: o?.mode === 'hunt' ? o.zone : zoneAt(S.hero.x, S.hero.z), rest: o?.rest, wait: o?.wait && !o?.next, next: o?.next } : null; };
function huntTick(first) {
  if (!S.huntOn) return;
  const h = S.hero; if (!h || h.dead || S.scene) return;
  let o = S.campOrder;
  if (o && o.mode !== 'hunt') return;             // a pull or clear you asked for runs first
  if (!o) { o = S.campOrder = { mode: 'hunt', tank: null, said: {}, zone: null, next: null }; S.cmd = 'hunt'; }
  const tank = tankOf(), heroTank = !tank && CLASSES[S.heroCls].role === 'tank';
  if (tank !== o.tank) { o.tank = tank; o.next = null; }
  // the zone: the one you're in, until you walk out of it
  if (!o.zone || Math.hypot(h.x - o.zone.x, h.z - o.zone.z) > o.zone.r + 8) {
    const zn = zoneAt(h.x, h.z);
    if (zn !== o.zone) { o.zone = zn; o.next = null; o.wait = null; o.said = {}; if (zn && !first) chat('party', (tank || h).name, `New hunting ground: ${zn.name}.`); }
  }
  const zn = o.zone;
  if (!zn) { if (!o.said.none) { o.said.none = 1; chat('sys', null, 'No hunting ground here. Walk to some enemies and your group will start hunting.'); } o.next = null; return; }
  o.said.none = 0;
  if (!tank && !heroTank) { if (!o.said.tank) { o.said.tank = 1; chat('sys', null, 'You need a tank in your group to hunt.'); } return; }
  const fighting = S.ents.some(m => m.mob && !m.dead && m.threat && [...m.threat.keys()].some(k => S.party.includes(k)) && !m.evading);
  if (fighting) { o.rest = false; return; }
  // rest when anyone is hurt or low on mana
  const ready = S.party.every(p => p.dead || (p.hp > p.maxHp * .7 && !(p.resType === 'mana' && p.res < p.resMax * .45)));
  if (!ready) { o.rest = true; o.next = null; if (!o.said.rest) { o.said.rest = 1; const healer = S.party.find(p => !p.isHero && CLASSES[p.cls].role === 'healer') || tank; if (healer) chat('party', healer.name, pick(['Quick breather. Let me get my mana back.', 'Resting up a moment.', 'Hold up, drinking.'])); } return; }
  if (o.rest) { o.rest = false; o.said.rest = 0; if (tank) chat('party', tank.name, pick(['Everyone topped up? Moving on.', 'Right, back to it.', 'Ready. Next one.'])); }
  const list = huntable(zn, h), from = tank || h;
  if (o.next && !list.includes(o.next)) o.next = null;
  if (!o.next && list.length) {
    o.next = list.sort((a, b) => dist(a, from) - dist(b, from))[0]; o.wait = null;
    if (o.said.empty) { o.said.empty = 0; chat('party', (tank || h).name, pick(['One just popped. Going.', "Something's up. Let's go.", 'Respawn! Moving.'])); }
  }
  if (heroTank && o.next && (!S.target || S.target.dead)) S.target = o.next;
  if (!list.length) {
    // nothing up: wait where the next one will appear
    o.next = null;
    const sp = world.spawns.filter(s => s.hz === zn.id && !s.boss && !s.boss2 && !(s.alive && !s.alive.dead)).sort((a, b) => (b.timer || 0) / (b.respawn || 60) - (a.timer || 0) / (a.respawn || 60))[0];
    if (sp) { const from = tank || h; let dx = from.x - sp.x, dz = from.z - sp.z; const d = Math.hypot(dx, dz) || 1; o.wait = { x: sp.x + dx / d * 16, z: sp.z + dz / d * 16 }; }
    else o.wait = { x: zn.x, z: zn.z };
    if (!o.said.empty) { o.said.empty = 1; chat('party', (tank || h).name, pick(["That's the zone cleared for now. We'll wait for respawns.", "Nothing left up. Let's wait for the next one.", 'All quiet. Waiting on respawns.'])); }
  }
}
// where you walk on your own while an order runs (null: stay put)
export function autoFollowPoint() {
  const o = S.campOrder, h = S.hero; if (!o || !o.tank || o.tank.dead) { if (h) h.autoFol = false; return null; }
  const t = o.tank;
  // pulling: you hold the spot the whole time and let the tank bring them to you
  if (o.mode === 'pull') { const d = Math.hypot(h.x - o.spot.x, h.z - o.spot.z); if (h.autoFol ? d > 1 : d > 4) { h.autoFol = true; return o.spot; } h.autoFol = false; return null; }
  // in a fight you stand where you like
  if (S.ents.some(m => m.mob && m.engaged && !m.dead && !m.evading && m.target && S.party.includes(m.target))) { h.autoFol = false; return null; }
  const d = dist(h, t), keep = CLASSES[S.heroCls].melee ? 4 : 7;
  // walk only once the tank is well ahead, then stop near them (no constant shuffling)
  if (h.autoFol ? d < keep + .5 : d < keep + 5) { h.autoFol = false; return null; }
  h.autoFol = true;
  const a = Math.atan2(h.x - t.x, h.z - t.z);
  return { x: t.x + Math.sin(a) * keep, z: t.z + Math.cos(a) * keep };
}
// the Vale's story people and the things you can inspect; rebuilt when a choice changes who is where
export const flagMatch = c => flagIs(c);
const flagIs = ([k, v]) => v === '*' ? S.flags[k] != null : typeof v === 'string' && v[0] === '!' ? S.flags[k] != null && S.flags[k] !== v.slice(1) : S.flags[k] === v;
export function storyFolk() {
  for (const e of S.ents) if (e.storyNpc || e.prop) { e.remove = true; e.dead = true; }
  for (const n of world.storyNpcs) {
    if (n.when && !flagIs(n.when)) continue;
    if (n.unless && flagIs(n.unless)) continue;
    if (n.yieldNpc && S.quests.m8?.state !== 'done') continue; // Ansel waits at the chapel only after he yields
    const g = GIVERS[n.key];
    const e = Cb.makeEnt({ team: 'npc', maxHp: 1, hp: 1, storyNpc: true, name: n.name || g?.name, title: n.title ?? g?.title ?? '', kind: n.kind || g?.model, x: n.x, z: n.z, giver: g && n.key !== 'banker' ? n.key : null, banker: n.key === 'banker', idle: g?.idle });
    e.yaw = n.yaw || 0; e.y = hgt(e.x, e.z);
    if (g && n.key !== 'villager') S.npcs[n.key] = e;
  }
  for (const p of world.props) {
    if (p.depleted) continue;
    if (p.when && !flagIs(p.when)) continue;
    if (p.unless && flagIs(p.unless)) continue;
    if (p.lore && S.lore[p.lore] && !(p.tag !== 'lore' && needFor(p))) continue;
    const e = Cb.makeEnt({ team: 'npc', maxHp: 1, hp: 1, prop: p, name: p.lore ? LORE[p.lore].title : p.name, kind: p.kind, x: p.x, z: p.z, scale: p.scale });
    e.yaw = p.yaw; e.y = p.y ?? hgt(e.x, e.z);
  }
}
export function spawnProp(p) {
  const e = Cb.makeEnt({ team: 'npc', maxHp: 1, hp: 1, prop: p, name: p.lore ? LORE[p.lore].title : p.name, kind: p.kind, x: p.x, z: p.z, scale: p.scale });
  e.yaw = p.yaw; e.y = p.y ?? hgt(e.x, e.z); return e;
}
const OBJ_VERB = { clue1: 'Examine', clue2: 'Examine', grave: 'Examine the grave', headstone: 'Set the headstone upright', bell: 'Ring the bell', wardstone: 'Touch the ward stone', journal: "Read Corwin's journal" };
function needFor(p) { return QUESTS.find(q => q.obj.inspect === p.tag && S.quests[q.id]?.state === 'active' && !(S.used[q.id] || []).includes(p.id)); }
// what the action button says for a prop, or null if there's nothing to do with it
export function inspectLabel(e) {
  const p = e.prop; if (!p) return null;
  if (p.node) return Craft.nodeLabel(p);
  if (p.station) return `Craft: ${Craft.STATIONS[p.station].name}`;
  if (needFor(p)) return (OBJ_VERB[p.tag] || 'Inspect') + (p.tag.startsWith('clue') ? ': ' + p.name : '');
  if (p.lore && !S.lore[p.lore]) return 'Read: ' + LORE[p.lore].title;
  return null;
}
export function inspect(e) {
  const p = e.prop, h = S.hero; if (!p || dist(h, e) > 6) return null;
  if (p.node) { Craft.gather(e); save(); return null; }
  if (p.station) return { station: p.station };
  const q = needFor(p);
  let read = null;
  if (q) {
    (S.used[q.id] = S.used[q.id] || []).push(p.id);
    const st = S.quests[q.id]; st.n = Math.min(q.obj.n, st.n + 1);
    floatText(h, `${q.name} ${st.n}/${q.obj.n}`, '#ffd34d');
    if (p.tag === 'grave') chat('sys', null, pick(['The earth is heaped outward. Whatever left this grave dug its way up.', 'Claw marks on the inside of the coffin lid. Lots of them.', 'Footprints lead out of the grave and north. Bare feet. Very bony feet.']));
    if (p.tag === 'headstone') { chat('sys', null, 'You heave the headstone upright.'); e.kind = 'shrine'; e.remove = true; e.dead = true; }
    if (p.tag === 'bell') { chat('sys', null, 'BONNNG. The bell rings out over Hollin... and something in the fields answers.'); R.burst(e.x, e.y + 2, e.z, 30, [1, .9, .5], 3, 1, .6); for (let k = 0; k < 2; k++) { const g = Cb.makeMob('ghost', irnd(4, 5), { x: e.x + rnd(-9, 9), z: e.z + rnd(-9, 9), home: { x: e.x, z: e.z }, add: true }); g.y = hgt(g.x, g.z); Cb.addThreat(g, h, 5); } }
    if (p.tag === 'wardstone') { chat('sys', null, 'The runes flare blue. The stone hums, faintly approving.'); R.burst(e.x, e.y + 1.5, e.z, 30, [.5, .8, 1], 2.5, 1, .6); }
    if (st.n >= q.obj.n) { st.state = 'done'; chat('sys', null, `${q.name}: done! Return to ${GIVERS[q.turnTo || q.giver].name}.`); Banter.onQuest('done', q); }
  }
  if (p.lore && !S.lore[p.lore]) { S.lore[p.lore] = true; read = p.lore; chat('sys', null, `Lore found: ${LORE[p.lore].title}. (${Object.keys(S.lore).length}/${Object.keys(LORE).length} · Book → Lore)`); }
  if (p.tag === 'lore' && S.lore[p.lore]) { e.remove = true; e.dead = true; }
  save();
  return read;
}
// ---------- progression: the level 10 lock, faster xp for later classes, account bonuses, perks ----------
export const levelOf = k => (k === S.heroCls && S.hero ? S.hero.lvl : S.classes[k]?.lvl || 1);
export const famBest = f => Math.max(...CLASS_KEYS.filter(k => CLASSES[k].family === f).map(levelOf));
export const lockedAt10 = () => FAMILIES.some(f => famBest(f) < 10);
export const lockedAt20 = () => FAMILIES.some(f => famBest(f) < 20);
export const raidReady = () => FAMILIES.every(f => famBest(f) >= 20);
export const perksOpen = () => CLASS_KEYS.filter(k => levelOf(k) >= 10);
export const xpBoost = () => Math.min(.6, .2 * CLASS_KEYS.filter(k => k !== S.heroCls && levelOf(k) >= 10).length);
export function acctBonus() {
  const n10 = CLASS_KEYS.filter(k => levelOf(k) >= 10).length, n20 = CLASS_KEYS.filter(k => levelOf(k) >= 20).length;
  const a = { sta: n10 + n20, pow: n20 };
  S.perks = (S.perks || []).filter(k => levelOf(k) >= 10).slice(0, 2);
  for (const k of S.perks) for (const [key, v] of Object.entries(PERKS[k].data)) a[key] = (a[key] || 0) + v;
  return a;
}
export function refreshAcct() { const h = S.hero; if (!h) return; h.acct = acctBonus(); Cb.recalc(h); }
export function togglePerk(k) {
  if (levelOf(k) < 10) return;
  const i = S.perks.indexOf(k);
  if (i >= 0) S.perks.splice(i, 1); else if (S.perks.length < 2) S.perks.push(k); else { chat('sys', null, 'You can slot two perks. Remove one first.'); return; }
  refreshAcct(); save();
}
let cappedSaid = false;
// ---------- the bank, shared by every class ----------
export const BANK_SLOTS = 40;
export function bankStore(it) { if (S.bank.length >= BANK_SLOTS) { chat('sys', null, 'Your bank is full.'); return; } S.bag = S.bag.filter(b => b !== it); S.bank.push(it); save(); }
export function bankTake(it) { if (S.bag.length >= 30) { chat('sys', null, 'Your bags are full.'); return; } S.bank = S.bank.filter(b => b !== it); S.bag.push(it); save(); }
// ---------- story scenes ----------
export function playScene(id, onEnd) {
  const shots = SCENES[id]; if (!shots || S.scene) return false;
  if (shots.some(sh => !world.spots[sh.spot])) return false;
  S.scenesSeen[id] = true; S.scene = { id, shots, i: 0, t: 0, onEnd };
  if (S.hero) { S.hero.casting = null; S.hero.moving = 0; }
  return true;
}
export function nextShot() {
  const sc = S.scene; if (!sc) return;
  sc.i++; sc.t = 0;
  if (sc.i >= sc.shots.length) { S.scene = null; if (sc.onEnd) sc.onEnd(); Banter.onScene(sc.id); }
}
export function endScene() { const sc = S.scene; S.scene = null; if (sc?.onEnd) sc.onEnd(); if (sc) Banter.onScene(sc.id); }
// fill {town}, {hero} and friends into story text
export function fill(t) {
  return String(t).replace(/\{(\w+)\}/g, (m, k) => k === 'hero' ? S.heroName : k === 'cls' ? CLASSES[S.heroCls].name : world.names?.[k] || (k === 'town' ? 'town' : m));
}
// a fake player (from saved data) joins your group beside you
export function addMate(d, hero) {
  const f = Cb.makeHuman(d.cls, d.lvl, { name: d.name, pal: d.pal || 1, x: hero.x + rnd(-2.5, 2.5), z: hero.z + rnd(-2.5, 2.5) });
  f.kind = CLASSES[d.cls].models[d.pal || 1]; f.xp = d.xp || 0; f.bonusPow = d.bonusPow || 0; f.bonusSta = d.bonusSta || 0; f.bonusArm = d.bonusArm || 0;
  f.fake = { persona: d.persona, guild: d.guild, mood: d.mood || 0, friend: !!d.friend, bff: !!d.bff, state: 'party', group: null };
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
    S.npcs.vendor = npc({ name: S.flags?.case1 === 'odda' ? 'Tobb Coin-Purse' : 'Odda Coin-Purse', title: S.flags?.case1 === 'odda' ? 'Supplies (minding his aunt\'s stall)' : 'Supplies', kind: 'bandit', x: tw.x + N.vendor.x, z: tw.z + N.vendor.z, vendor: 'vale' });
    S.npcs.armorer = S.npcs.armory = npc({ name: 'Master Corvin', title: 'Armory · class trials', kind: 'guard', x: tw.x + N.armory.x, z: tw.z + N.armory.z, armory: true, giver: 'armorer' });
    S.npcs.bind = npc({ name: 'Bind Stone', title: 'Bind here', kind: 'corpse', x: tw.x + N.bind.x, z: tw.z + N.bind.z, bindstone: true, scale: 1.6 });
    if (!S.bind) S.bind = { zone: 'vale', x: S.npcs.bind.x, z: S.npcs.bind.z + 1.5 };
    for (const [x, z] of N.guards) guard(tw, tw.x + x, tw.z + z, 'Town Guard');
    storyFolk();
    return;
  }
  const VEND = { port: 'Wexley the Chandler', fort: 'Quartermaster Bell', vill: 'Netmender Briggs', crook: 'Mother Ketch', light: 'Keeper Dunmore', ember: 'Quartermaster Rhoswen', refuge: 'Sister Ama' };
  for (const t of world.towns) {
    for (const [type, key, dx, dz] of t.npcs) {
      const x = t.x + dx, z = t.z + dz;
      if (type === 'giver') S.npcs[key] = npc({ name: GIVERS[key].name, title: GIVERS[key].title, kind: GIVERS[key].model, x, z, giver: key });
      if (type === 'vendor') { const xv = X.VEND?.[key]; npc({ name: xv ? xv[0] : VEND[key], title: key === 'vill' ? 'Supplies and fishing poles' : 'Supplies', kind: xv ? xv[1] : key === 'light' ? 'villager2' : key === 'crook' || key === 'refuge' ? 'villager1' : key === 'ember' ? 'guard' : 'pirate1', x, z, vendor: key }); }
      if (type === 'bind') npc({ name: 'Bind Stone', title: 'Bind here', kind: 'corpse', x, z, bindstone: true, scale: 1.6 });
      if (type === 'armory') S.npcs.armorer = npc({ name: 'Mistress Hale', title: 'Armory · class trials', kind: 'guard', x, z, armory: true, giver: 'armorer' });
    }
    for (const [dx, dz] of t.guards) guard(t, t.x + dx, t.z + dz, t.guardName || (t.key === 'fort' ? 'Halyard Marine' : 'Port Watch'));
    if (t.key === 'port') {
      S.npcs.banker = npc({ name: GIVERS.banker.name, title: GIVERS.banker.title, kind: 'villager2', x: t.x - 7, z: t.z + 9, banker: true });
      if (S.quests.m16) S.npcs.wick = npc({ name: GIVERS.wick.name, title: 'Came along', kind: 'wick', x: t.x + 4, z: t.z - 3, giver: 'wick' });
    }
  }
  storyFolk();   // the coast's own story people, trainers and gathering nodes (Build 6)
}
function guard(t, x, z, name) { return Cb.makeEnt({ team: 'ally', name, kind: t.guardKind || 'guard', x, z, guard: true, lvl: 30, maxHp: 9000, hp: 9000, power: 260, armor: 900, spd: 7, home: { x, z }, townC: { x: t.x, z: t.z, R: t.R } }); }
// travelling between zones: your group comes with you, the zone you leave remembers its people
export function travel(zone, arrive, force) {
  if (!force && S.party.some(p => !p.dead && Cb.inCombat(p) && dist(p, S.hero) < 40 && S.ents.some(m => m.mob && !m.dead && m.threat.has(p)))) { chat('sys', null, "You can't leave while your group is fighting."); return false; }
  const from = S.zone;
  if (!INSTANCES[from]) { S.pops = S.pops || {}; S.pops[from] = S.fakes.filter(f => !f.inParty).map(fakeData); }
  const carry = S.party.filter(p => !p.isHero).map(p => ({ ...fakeData(p), hp: p.dead ? .5 : p.hp / p.maxHp, res: p.resMax ? p.res / p.resMax : 1 }));
  S.classes[S.heroCls] = { lvl: S.hero.lvl, xp: S.hero.xp };
  startWorld({ zone, arrive: arrive || arrivalFor(zone, from), carry, carryHero: true, keepLog: true });
  chat('sys', null, `You enter ${world.names.zone || world.names.town}.`);
  save();
  return true;
}
function arrivalFor(zone, from) {
  for (const f of X.arriveHooks || []) { const r = f(zone, from); if (r) return r; }
  if (zone === 'coast' && from === 'fleet') return { x: world.buoy.x + 3, z: world.buoy.z + 3 };
  if (INSTANCES[from]?.out && zone === INSTANCES[from].parent) return { ...INSTANCES[from].out };
  if (INSTANCES[zone] && zone !== 'fleet') return { x: 0, z: 64 };
  if (zone === 'coast') return { x: -(ZONE_SIZE.coast || 300) + 26, z: 0 };
  if (zone === 'fleet') return { x: 0, z: 55 };
  if (zone === 'wastes') return { x: 0, z: ZONE_SIZE.wastes - 30 };
  if (zone === 'vale' && from === 'wastes') return { x: 0, z: -ZONE_SIZE.vale + 30 };
  const zx = ZONE_SIZE.vale - 22; return { x: zx, z: Math.sin(zx * .02) * 12 };
}
// a finished quest can whisk you (and your group) straight back to whoever gets the hand-in
export function returnToGiver(q) {
  const k = turnToOf(q), h = S.hero; if (!h || h.dead) return false;
  if (Cb.inCombat(h) && S.ents.some(m => m.mob && !m.dead && m.threat?.has(h))) { chat('sys', null, "You can't do that in the middle of a fight."); return false; }
  const find = () => (S.npcs[k] && !S.npcs[k].remove && !S.npcs[k].dead ? S.npcs[k] : S.ents.find(e => e.giver === k && !e.dead && !e.remove));
  let n = find();
  for (const z of ['coast', 'vale']) { if (n || z === S.zone) continue; if (!travel(z, null, false)) return false; n = find(); }
  if (!n) { chat('sys', null, `You can't find ${GIVERS[k]?.name || 'them'} right now.`); return false; }
  S.campOrder = null; for (const p of S.party) p.pull = null;
  R.burst(h.x, h.y + 1, h.z, 30, [1, .9, .5], 2.5, 1, .6);
  const spot = (dx, dz) => ({ x: n.x + dx, z: n.z + dz });
  const at = spot(Math.sin(n.yaw || 0) * 2.6, Math.cos(n.yaw || 0) * 2.6);
  h.x = at.x; h.z = at.z; collide(h, h.r); h.y = hgt(h.x, h.z); h.yaw = Math.atan2(n.x - h.x, n.z - h.z); S.camYaw = h.yaw;
  for (const p of S.party) if (p !== h) { p.x = h.x + rnd(-2.5, 2.5); p.z = h.z + rnd(-2.5, 2.5); collide(p, p.r); p.y = hgt(p.x, p.z); p.rx = p.x; p.rz = p.z; }
  h.rx = h.x; h.rz = h.z;
  R.burst(h.x, h.y + 1, h.z, 40, [1, .9, .5], 3, 1.2, .7);
  save(); return true;
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
  if (e.boss && (named === 'admiral' || named === 'boss') && world.names.boss) e.name = world.names.boss;   // only the zone's own boss takes the zone's boss name
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
    const lvl = sv ? sv.lvl : ((X.fakeLvlHooks || []).reduce((v, f) => v ?? f(zone), null) ?? (zone === 'coast' ? clamp(Math.round(9 + Math.random() ** 1.2 * 11), 9, 20) : clamp(Math.round(1 + Math.random() ** 1.4 * 9), 1, 10)));
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
  if (S.party.length >= partyCap()) { chat('sys', null, `Your group is full (${partyCap()}).`); return; }
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
  if (cmd === 'hunt') { setHunt(!S.huntOn); return; }
  if (S.huntOn) { S.huntOn = false; if (S.campOrder?.mode === 'hunt') S.campOrder = null; }
  if (cmd === 'pull' || cmd === 'clear') { campOrder(cmd); return; }
  S.cmd = cmd; S.campOrder = null;
  for (const p of S.party) p.pull = null;
  if (cmd === 'hold') for (const p of S.party) p.holdAt = { x: p.x, z: p.z };
  if (!S.quietCmd) chat('party', S.hero.name, { follow: 'Follow me.', assist: 'Assist me, and attack my target.', hold: 'Hold here.' }[cmd]);
}

// ---------- class switching ----------
// ---------- vanity pets: they follow you around and do nothing useful at all ----------
let petEnt = null, craftT = 0;
export function setPet(k) { S.pet = S.pet === k ? null : k; if (petEnt) { petEnt.remove = true; petEnt.dead = true; petEnt = null; } save(); }
function petTick(dt) {
  const h = S.hero; if (!h) return;
  if (!S.pet || !Loot5.COLLECT[S.pet]) { if (petEnt) { petEnt.remove = true; petEnt.dead = true; petEnt = null; } return; }
  if (!petEnt || petEnt.remove || !S.ents.includes(petEnt)) { const c = Loot5.COLLECT[S.pet]; petEnt = Cb.makeEnt({ team: 'npc', maxHp: 1, hp: 1, name: c.name, title: `${S.heroName}'s pet`, kind: c.kind, x: h.x + 1.5, z: h.z + 1.5, scale: c.scale, vanity: true }); petEnt.y = hgt(petEnt.x, petEnt.z); }
  const d = dist(petEnt, h);
  if (d > 30) { petEnt.x = h.x + 1; petEnt.z = h.z + 1; }
  if (d > 2.4) { const a = Math.atan2(h.x - petEnt.x, h.z - petEnt.z), sp = Math.min(d - 2, h.spd * 1.15 * dt); petEnt.x += Math.sin(a) * sp; petEnt.z += Math.cos(a) * sp; petEnt.yaw = a; petEnt.y = hgt(petEnt.x, petEnt.z); petEnt.moving = 1; } else petEnt.moving = Math.max(0, (petEnt.moving || 0) - dt * 4);
}
export function setTitle(k) { S.title = S.title === k ? null : k; save(); }
export const heroTitle = () => S.title && Loot5.COLLECT[S.title] ? Loot5.COLLECT[S.title].name : '';
// ---------- weapons: you play a class by equipping its weapon; the armory trials unlock new ones ----------
export const owns = k => (S.owned || []).includes(k);
export function weaponChoices() {
  const have = new Set((S.owned || []).map(k => CLASSES[k].family));
  const missing = CLASS_KEYS.filter(k => !owns(k) && !have.has(CLASSES[k].family));
  return missing.length ? missing : CLASS_KEYS.filter(k => !owns(k));
}
export function unlockClass(k) {
  if (owns(k) || !(S.unlockPicks > 0) || !weaponChoices().includes(k)) return false;
  S.owned.push(k); S.unlockPicks--;
  const w = S.gear[k]?.weapon;
  chat('sys', null, `You take up ${w ? 'the ' + w.name : 'a new weapon'}.`);
  save(); return true;
}
// your friends play whatever classes you choose for them
export function setFriendClass(name, k) {
  const fr = (S.friends || []).find(f => f.name === name); if (!fr || !CLASSES[k]) return;
  fr.cls = k; syncFriends(); save();
}
export function switchClass(cls) {
  if (!owns(cls)) return false;
  S.campOrder = null; if (S.cmd === 'pull' || S.cmd === 'clear') S.cmd = 'follow';
  const h = S.hero;
  if (Cb.inCombat(h)) { chat('sys', null, "You can't change class in combat."); return false; }
  if (h.dead) return false;
  S.classes[S.heroCls] = { lvl: h.lvl, xp: h.xp };
  for (const p of S.ents) if (p.pet && p.pet.owner === h && !p.charmed) { p.dead = true; p.remove = true; }
  S.heroCls = cls; h.cls = cls; h.lvl = S.classes[cls].lvl; h.xp = S.classes[cls].xp;
  h.resType = CLASSES[cls].res; h.kind = CLASSES[cls].models[0]; h.buffs = []; h.cds = {}; h.casting = null; h.ult = 0; h.autoOn = false;
  h.resMax = 0; h.acct = acctBonus(); applyGear(h, S.gear[cls]); h.hp = h.maxHp; h.res = startRes(h);
  R.burst(h.x, h.y + 1, h.z, 30, [1, .9, .6], 2.5, 1, .6);
  chat('sys', null, `You are now a level ${h.lvl} ${CLASSES[cls].name}.`);
  save(); return true;
}

// ---------- quests ----------
export const questsFor = giver => QUESTS.filter(q => (q.giver === giver || q.turnTo === giver) && (!q.cls || q.cls === S.heroCls));
export const turnToOf = q => q.turnTo || q.giver;
// quest givers offer one quest at a time, in order: the story first, then the lowest level; a declined quest waits at the back
export function offerQueue(k) {
  const h = S.hero, dec = S.declined || {};
  return QUESTS.map((q, i) => [q, i]).filter(([q]) => q.giver === k && (!q.cls || q.cls === S.heroCls) && questState(q) === 'open' && q.lvl <= h.lvl + (q.story ? 2 : 1))
    .sort(([a, i], [b, j]) => (dec[a.id] ? 1 : 0) - (dec[b.id] ? 1 : 0) || (b.story ? 1 : 0) - (a.story ? 1 : 0) || a.lvl - b.lvl || i - j).map(([q]) => q);
}
export const nextOffer = k => offerQueue(k)[0] || null;
export const turnInsFor = k => QUESTS.filter(q => turnToOf(q) === k && S.quests[q.id]?.state === 'done' && (!q.cls || q.cls === S.heroCls));
export const activeFrom = k => QUESTS.filter(q => q.giver === k && S.quests[q.id]?.state === 'active');
export function declineQuest(q) { S.declined = S.declined || {}; S.declined[q.id] = (S.declined[q.id] || 0) + 1; }
// questioning suspects: each one you've asked counts toward the quest
export const asksFor = key => QUESTS.filter(q => q.obj.ask && q.obj.ask.includes(key) && S.quests[q.id]?.state === 'active' && !(S.quests[q.id].asked || []).includes(key));
export function askSuspect(q, key) {
  const st = S.quests[q.id]; if (!st || st.state !== 'active') return;
  st.asked = st.asked || []; if (st.asked.includes(key)) return;
  st.asked.push(key); st.n = st.asked.length; floatText(S.hero, `${q.name} ${st.n}/${q.obj.n}`, '#ffd34d');
  if (st.n >= q.obj.n) { st.state = 'done'; chat('sys', null, `${q.name}: done! Return to ${GIVERS[turnToOf(q)].name}.`); Banter.onQuest('done', q); }
  save();
}
// a raid holds 12; everything else holds 6
export const partyCap = () => S.ext?.raid12 ? 12 : 6;
export function questState(q) { if (S.quests[q.id]) return S.quests[q.id].state; if (q.forCls && S.heroCls !== q.forCls) return 'locked'; if (q.when && !q.when()) return 'locked'; if (q.needLvl && levelOf(q.cls || S.heroCls) < q.needLvl) return 'locked'; if (q.pre && S.quests[q.pre]?.state !== 'turned' && !(X.preAlt?.[q.pre] || []).some(id => S.quests[id]?.state === 'turned')) return 'locked'; if (q.pre2 && S.quests[q.pre2]?.state !== 'turned') return 'locked'; if (q.req && Object.entries(q.req).some(([k, v]) => S.flags[k] !== v)) return 'locked'; return 'open'; }
export function acceptQuest(q) {
  S.quests[q.id] = { state: q.obj.talk ? 'done' : 'active', n: 0 };
  if (S.declined) delete S.declined[q.id];
  chat('sys', null, `Quest accepted: ${q.name}`);
  if (q.rival && S.zone === 'coast') spawnRival(q.rival);
  if (q.sceneOnAccept && !S.scenesSeen[q.sceneOnAccept]) S.pendingScene = q.sceneOnAccept;
  Banter.onQuest('accept', q);
  for (const f of X.accept) f(q);
  save();
}
export function turnIn(q, choice = null) {
  const st = S.quests[q.id]; if (!st || st.state !== 'done') return null;
  const ch = q.choices ? q.choices[choice ?? 0] : null;
  st.state = 'turned';
  if (ch) { Object.assign(S.flags, ch.set || {}); if (ch.gold) S.gold += ch.gold; st.choice = choice ?? 0; }
  S.gold += q.gold;
  Cb.giveXp(S.hero, q.xp);
  chat('sys', null, `Quest complete: ${q.name}. +${q.xp} xp, +${q.gold} gold.`);
  if (q.gear || ch?.gear) { const it = randomGear(q.lvl + 1, S.heroCls, .2); if (it.rarity < 1) { it.rarity = 1; } addToBag(it); chat('loot', null, `You receive ${it.name}.`); }
  if (q.signature) { const c = q.signature, t = WTYPE[c][0]; const it = makeItem({ name: SIGNATURE[c], slot: 'weapon', type: t, lvl: 16, rarity: 3, signature: true, stats: { pow: 32, sta: 14, crit: 3 }, value: 200 }); addToBag(it); chat('loot', null, `You receive your signature weapon: ${it.name}!`); }
  if (q.lore && !S.lore[q.lore]) { S.lore[q.lore] = true; chat('sys', null, `Lore found: ${LORE[q.lore].title}. (Book → Lore)`); }
  // choices move people around the Vale
  if (['m8', 'h5', 'm13'].includes(q.id)) storyFolk();
  Banter.onQuest('turnin', q);
  if (q.id === 'm16') S.flags.wickCoast = true;
  if (ch?.collect) Loot5.collect(ch.collect);
  { const v = Mystery.verdict(q, S.flags);
    if (v === false && q.id === 'c2d') { S.flags.mystery = 'failed'; chat('sys', null, 'Three nights later, Wick digs another grave in Little Hollin. Whoever is in the cells, the killing goes on.'); }
    if (v === true && q.id === 'c2d') { S.gold += 25; if (S.flags.case1 === 'linus') Loot5.collect('title_eye'); }
    if (v !== null) storyFolk(); }
  if (q.unlock) { S.unlockPicks = (S.unlockPicks || 0) + 1;  }
  for (const f of X.turnin) f(q, ch);
  save();
  return ch ? ch.reply : null;
}
function questProgress(mob, near) {
  if (mob.tagged !== 'party' || !near.includes(S.hero) && !S.party.some(p => near.includes(p))) return;
  for (const f of X.kill) f(mob);
  for (const q of QUESTS) {
    const st = S.quests[q.id]; if (!st || st.state !== 'active') continue;
    const o = q.obj; let hit = false;
    const nearOk = !o.near || (o.near === 'waste' ? regionAt(mob.x, mob.z) === 3 : world.spots[o.near] && Math.hypot(mob.x - world.spots[o.near].x, mob.z - world.spots[o.near].z) < (o.nearR || 70));
    if (o.kill && o.kill.includes(mob.mob) && nearOk && (!o.dungeon || mob.dungeon) && (!o.reef || mob.spawn?.area === 5) && !mob.named && !mob.add) hit = true;
    if (o.kill && o.kill.includes(mob.mob) && mob.add && mob.mob === 'ghost' && nearOk) hit = true;
    if (o.anyMin && mob.lvl >= o.anyMin && !mob.add) hit = true;
    if (o.bosses && o.bosses.includes(mob.named) && !(st.got || []).includes(mob.named)) { (st.got = st.got || []).push(mob.named); hit = true; }
    if (o.named && mob.named === o.named) hit = true;
    if (o.collect && o.collect.includes(mob.mob)) { if (Math.random() < o.chance) { hit = true; chat('loot', null, `You loot ${o.item}.`); } }
    if (hit) { st.n = Math.min(o.n, st.n + 1); floatText(S.hero, `${q.name} ${st.n}/${o.n}`, '#ffd34d'); if (st.n >= o.n) { st.state = 'done'; Banter.onQuest('done', q); chat('sys', null, `${q.name}: done! Return to ${GIVERS[turnToOf(q)].name}.`); } }
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
export { fakeGear };
export function assignLoot(mob, it, who) {
  mob.loot = mob.loot.filter(x => x !== it);
  if (it.recipe) { if (!Craft.learnRecipe(it.recipe)) chat('sys', null, 'You already know that recipe.'); save(); return; }
  if (it.collect) { Loot5.collect(it.collect); save(); return; }
  if (X.takeSmall && (it.pot || it.mat || it.junk) && who === S.hero) { if (!X.takeSmall(it)) mob.loot.push(it); return; }
  if (it.book && who !== S.hero) {
    // a companion studies a tome they can use; one they can't, they sell for the group
    const why = it.book.blank ? (X.blankOptions(who, it.book.rank).length ? null : 'no') : X.whyNot(who, it.book.cls, it.book.key, it.book.rank);
    if (!why) { const k = it.book.blank ? pick(X.blankOptions(who, it.book.rank)) : null; X.study(who, it, k); who.fake.mood += 2; }
    else { S.gold += it.value; chat('party', who.name, `can't use this one, sold it and put the ${it.value}g in your pocket`); }
    chat('loot', null, `${who.name} receives ${it.name}.`); save(); return;
  }
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
  if (X.compTake && X.compTake(who, it)) { save(); return; }
  const s = it.stats; who.bonusPow = (who.bonusPow || 0) + (s.pow || 0) * .5; who.bonusSta = (who.bonusSta || 0) + (s.sta || 0) * .5; who.bonusArm = (who.bonusArm || 0) + (s.arm || 0) * .3;
  fakeGear(who); who.fake.mood += canWear(who.cls, it) ? 2 : 1;
  chat('loot', null, `${who.name} receives ${it.name}.`); chat('party', who.name, pick(CHAT.thanks));
}

// ---------- death and the corpse run ----------
AI.aiHooks.gathered = e => { Craft.friendGather(e); save(); };
Cb.setHooks({
  bossLoot: (e, party) => Loot5.bossLoot(e, party),
  xpMod(p, amt) {
    let a = amt * (1 + xpBoost() + (X.xpBonus ? X.xpBonus() : 0)) * X.xpMul.reduce((k, f) => k * f(), 1);
    // veteran xp, earned while another class sat at the cap, doubles what this class earns until it runs out
    if (!(lockedAt10() && p.lvl >= 10) && p.lvl < MAX_LVL && S.vetXp > 0) { const x = Math.min(a, S.vetXp); S.vetXp -= x; a += x; }
    return a;
  },
  onOverflow(p, over) { if (over > 0) S.vetXp = Math.min(40000, (S.vetXp || 0) + Math.round(over)); },
  lvlCap: p => (lockedAt10() && p.lvl >= 10 ? 10 : lockedAt20() && p.lvl >= 20 ? 20 : MAX_LVL),
  onCapped(p) { if (cappedSaid) return; cappedSaid = true; chat('sys', null, `You have learned all this weapon can teach you, for now.`); },
  onYield(m, src) {
    // he only surrenders to your group, and only while you're on his quest
    const q = QUESTS.find(q => q.obj.named === m.named && q.obj.yield), st = q && S.quests[q.id];
    if (!st || st.state !== 'active' || !Cb.ownerOf(src)?.inParty) return false;
    m.hp = Math.max(1, m.hp); m.team = 'npc'; m.threat.clear(); m.engaged = false; m.target = null; m.buffs = []; m.casting = null; m.mcast = null;
    for (const e of S.ents) if (e.mob && e.threat) e.threat.delete(m);
    if (S.target === m) S.target = null;
    if (m.spawn) { m.spawn.alive = null; m.spawn.timer = 99999; }
    S.flags.anselYielded = true;
    floatText(m, 'I yield!', '#ffd34d', true); chat('say', m.name, 'Enough! Enough, I yield!');
    st.n = 1; st.state = 'done'; chat('sys', null, `${q.name}: done! Talk to ${m.name}.`); Banter.onQuest('done', q);
    m.remove = true; m.dead = true; storyFolk(); save();
    return true;
  },
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
    if (mob.tagged === 'party' && near.includes(S.hero)) Craft.mobMats(mob);
    if (mob.mob === 'abom' && mob.tagged === 'party' && !S.scenesSeen.gravelord) {
      const g = Cb.makeEnt({ team: 'npc', maxHp: 1, hp: 1, name: 'The Gravelord', title: 'An echo', kind: 'gravelord', x: world.spots.crypt.x, z: world.spots.crypt.z - 3, storyNpc: true, scale: 1.3 }); g.y = hgt(g.x, g.z) + .5;
      S.pendingScene = 'gravelord'; S.sceneEnd = () => { g.remove = true; g.dead = true; R.burst(g.x, g.y + 1.5, g.z, 60, [.5, 1, .6], 3, 1.2, .8); };
    }
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
      if (p.lvl === 10) { chat('sys', null, `Your ${CLASSES[p.cls].name} unlocked a perk: ${PERKS[p.cls].name} (${PERKS[p.cls].desc}) Slot it in Book → Character. Every other class now earns xp faster.`); }
      refreshAcct();
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
  if (X.bgRelease && X.bgRelease()) return;
  // the corpse keeps your gear; you wake at the bind stone without it
  const loss = Math.round(xpNeed(h.lvl) * .1); h.xp = Math.max(0, h.xp - loss);
  S.corpse = { zone: S.zone === 'fleet' ? 'coast' : S.zone, x: S.zone === 'fleet' ? world.names && 0 : h.x, z: h.z, cls: S.heroCls, gear: { ...S.gear[S.heroCls] } };
  const raidRun = X.release && X.release();   // Build 7: a corpse run inside the raid
  if (raidRun) { }
  else if (S.zone === 'fleet') { S.corpse.x = 160 + 3; S.corpse.z = 200 + 3; } // a body lost in the fleet washes up by the buoy
  else if (INSTANCES[S.zone]?.out) { S.corpse.zone = INSTANCES[S.zone].parent; S.corpse.x = INSTANCES[S.zone].out.x + 2; S.corpse.z = INSTANCES[S.zone].out.z + 2; } // a body lost below is carried out to the door
  else S.corpse.ent = Cb.makeEnt({ team: 'npc', name: `${h.name}'s corpse`, kind: 'corpse', x: h.x, z: h.z, corpse: true, maxHp: 1, hp: 1 });
  S.gear[S.heroCls] = {};
  h.dead = false; h.buffs = []; applyGear(h, {}); h.hp = Math.round(h.maxHp * .5); h.res = startRes(h) * .5; h.ult = 0;
  S.dead = false; S.target = null; S.dangers = [];
  for (const p of S.party) if (p !== h) { if (p.dead) Cb.revive(p, .5); p.casting = null; p.pull = null; }
  if (raidRun) return;
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
let chatT = 8, groupT = 30, saveT = 30, atT = 0;
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
    e.swim = wy !== gy; e.y += (wy + (e.rideY && !e.swim ? e.rideY : 0) - e.y) * Math.min(1, dt * 12);
  }
  separate();
  Sea.tick(dt);
  Banter.tick();
  craftT += dt; if (craftT > .5) { craftT = 0; Craft.tick({ spawnProp }); Craft.friendGatherTick(); }
  petTick(dt);
  if (world.levT && S.time >= world.levT) {
    world.levT = 0;
    const L = Cb.makeMob('leviathan', 20, { x: 0, z: -60, home: { x: 0, z: -60 }, named: 'leviathan', boss: true, dungeon: true });
    L.name = world.names.leviathan; L.yaw = 0; L.y = hgt(0, -60);
    for (const p of S.party) if (!p.dead) Cb.addThreat(L, p, roleOf(p) === 'tank' ? 50 : 5);
    chat('sys', null, 'The seabed shakes. Something enormous rises from the dark beyond the flagship!');
    R.burst(0, 3, -60, 80, [.3, .7, .9], 6, 1.6, 1.2);
  }
  for (const sp of world.spawns) if (!sp.alive) { sp.timer -= dt; if (sp.timer <= 0 && !nearParty(sp, S.huntOn ? 13 : 25) && !(sp.gate && S.flags[sp.gate + 'Yielded']) && (!sp.when || sp.when())) spawn(sp); }
  if ((atT -= dt) <= 0) {
    atT = .5;
    syncFriends(); campTick(); huntTick();
    for (const q of QUESTS) {
      if (!q.obj.at || S.quests[q.id]?.state !== 'active') continue;
      const sp = world.spots[q.obj.at]; if (!sp || (q.zone || 'vale') !== S.zone) continue;
      if (Math.hypot(h.x - sp.x, h.z - sp.z) < (q.obj.r || 10)) {
        S.quests[q.id].state = 'done'; S.quests[q.id].n = 1; if (!q.sceneAt) Banter.onQuest('done', q);
        chat('sys', null, `${q.name}: done! ${q.turnTo ? 'Talk to ' + GIVERS[q.turnTo].name + '.' : 'Return to ' + GIVERS[q.giver].name + '.'}`);
        if (q.sceneAt && !S.scenesSeen[q.sceneAt]) S.pendingScene = q.sceneAt;
        save();
      }
    }
  }
  if (S.pendingScene && !S.scene && !h.dead) { const id = S.pendingScene, end = S.sceneEnd; S.pendingScene = null; S.sceneEnd = null; playScene(id, end); }
  Cb.updateProjectiles(dt);
  AI.updateDangers(dt);
  // the general chat channel, and fake players forming groups
  if ((chatT -= dt) <= 0) { chatT = rnd(9, 22); generalChat(); }
  if ((groupT -= dt) <= 0) { groupT = rnd(40, 90); formFakeGroup(); }
  for (const f of X.tick) f(dt);
  if ((saveT -= dt) <= 0) { saveT = 10; save(); }
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
  for (const e of S.ents) { if (e.dead || e.remove || e.corpse || e.bindstone || e.mount) continue; const k = key(e.x, e.z); let c = sepGrid.get(k); if (!c) sepGrid.set(k, c = []); c.push(e); }
  const pushed = new Set();
  for (const e of S.ents) {
    if (e.dead || e.remove || e.corpse || e.bindstone || e.mount) continue;
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
        const tot = we + wo || 1, over = (min - d) * .35;
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
  const pops = { ...(S.pops || {}) }; if (!INSTANCES[S.zone]) pops[S.zone] = S.fakes.filter(f => !f.inParty).map(fakeData);
  return {
    v: 2, seed: S.seed, heroName: S.heroName, heroCls: S.heroCls, classes: S.classes, gold: S.gold, pots: S.pots, quests: S.quests, bar: S.bar, time: S.time,
    zone: S.zone, hx: h ? h.x : 0, hz: h ? h.z : 0, bind: S.bind, pole: !!S.pole, pops,
    flags: S.flags, lore: S.lore, perks: S.perks, vetXp: S.vetXp || 0, friendsMade: !!S.friendsMade, friends: S.friends || [], bank: S.bank.map(strip), used: S.used, scenesSeen: S.scenesSeen, huntOn: !!S.huntOn, owned: S.owned, unlockPicks: S.unlockPicks || 0, prof: S.prof || {}, mats: S.mats || {}, recipes: S.recipes || [], cons: S.cons || {}, collection: S.collection || [], title: S.title || null, pet: S.pet || null, ext: S.ext || {},
    gear: Object.fromEntries(Object.entries(S.gear).map(([k, g]) => [k, Object.fromEntries(Object.entries(g).map(([s, it]) => [s, strip(it)]))])),
    bag: S.bag.map(strip), corpse: S.corpse ? { zone: S.corpse.zone || 'vale', x: S.corpse.x, z: S.corpse.z, cls: S.corpse.cls, gear: S.corpse.gear } : null,
    partyData: S.party.filter(p => !p.isHero).map(fakeData),
  };
}
export function save() { if (!S.running) return; try { localStorage.setItem(SAVE_KEY, JSON.stringify(snapshot())); } catch (e) { } }
export function saveInfo() { try { const sv = JSON.parse(localStorage.getItem(SAVE_KEY)); if (!sv) return null; const lvl = sv.classes?.[sv.heroCls]?.lvl || 1; return { name: sv.heroName, cls: sv.heroCls, lvl }; } catch (e) { return null; } }
export function deleteSave() { try { localStorage.removeItem(SAVE_KEY); } catch (e) { } S.running = false; }
export function hasSave() { try { return !!localStorage.getItem(SAVE_KEY); } catch (e) { return false; } }
export function loadSave(data) {
  const sv = data || JSON.parse(localStorage.getItem(SAVE_KEY));
  Object.assign(S, { seed: sv.seed, heroName: sv.heroName, heroCls: sv.heroCls, classes: sv.classes, gold: sv.gold, pots: sv.pots || { hpot: 0, mpot: 0 }, quests: sv.quests || {}, bar: sv.bar, bag: sv.bag || [], gear: sv.gear, pole: !!sv.pole,
    flags: sv.flags || {}, lore: sv.lore || {}, vetXp: sv.vetXp || 0, friendsMade: !!sv.friendsMade, friends: sv.friends || [], perks: sv.perks || [], bank: sv.bank || [], used: sv.used || {}, scenesSeen: sv.scenesSeen || { intro: true }, huntOn: !!sv.huntOn, unlockPicks: sv.unlockPicks || 0, prof: sv.prof || {}, mats: sv.mats || {}, recipes: sv.recipes || [], cons: sv.cons || {}, collection: sv.collection || [], title: sv.title || null, pet: sv.pet || null, ext: sv.ext || {}, owned: sv.owned || CLASS_KEYS.filter(k => k === sv.heroCls || (sv.classes?.[k]?.lvl || 1) > 1) });
  // older saves: the old Ossuary quests are now part of the main story, so a hero who finished them skips ahead
  if (!sv.flags && S.quests.q9?.state === 'turned') for (const id of ['m1', 'm2', 'm3', 'm4', 'm5', 'm6', 'm7', 'm8', 'm9', 'm10', 'm11', 'm12', 'm13']) S.quests[id] = S.quests[id] || { state: 'turned', n: 0 };
  for (const k of CLASS_KEYS) { if (!S.classes[k]) S.classes[k] = { lvl: 1, xp: 0 }; if (!S.gear[k]) S.gear[k] = starterGear(k); if (!S.bar[k]) S.bar[k] = defaultBar(k); }
  // Build 3 added spells: slot any new ones you've learned into empty bar keys
  for (const k of CLASS_KEYS) { const bar = S.bar[k], all = defaultBar(k); for (const key of all) if (key && !bar.includes(key)) { const i = bar.indexOf(null); if (i >= 0) bar[i] = key; } }
  S.pops = sv.pops || { vale: sv.fakes || null };
  S.bind = sv.bind && sv.bind.x !== undefined ? { zone: sv.bind.zone || 'vale', ...sv.bind } : null;
  S.corpse = sv.corpse ? { ...sv.corpse, zone: sv.corpse.zone || 'vale' } : null;
  S.hero = null; S.party = [];
  const inst = INSTANCES[sv.zone], zone = inst ? inst.parent : (sv.zone || 'vale');
  const party = sv.partyData || [];
  startWorld({ zone, arrive: inst ? (inst.out ? { ...inst.out } : null) : (sv.hx !== undefined ? { x: sv.hx, z: sv.hz } : null), carry: party });
  if (sv.zone === 'fleet') { S.hero.x = world.buoy.x + 3; S.hero.z = world.buoy.z + 3; }
  // older saves kept only names: find those friends among the fake players
  if (!sv.partyData) for (const n of sv.party || []) { const f = S.fakes.find(x => x.name === n); if (f) { f.x = S.hero.x + rnd(-2, 2); f.z = S.hero.z + rnd(-2, 2); f.y = hgt(f.x, f.z); f.fake.group = null; f.inParty = true; f.fake.state = 'party'; S.party.push(f); } }
  S.time = sv.time || 0;
  S.campOrder = null; S.cmd = S.huntOn ? 'hunt' : 'follow';
  chat('sys', null, `Welcome back, ${S.heroName}.`);
  if (!S.friendsMade) makeFriends(); else topUpFriends();
}
// save codes: compressed JSON, so progress can move between builds and devices
export async function makeCode(fromStore) {
  const data = fromStore || !S.running ? JSON.parse(localStorage.getItem(SAVE_KEY)) : snapshot();
  const raw = new TextEncoder().encode(JSON.stringify(data));
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
try { addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') save(); }); addEventListener('pagehide', () => save()); } catch (e) { }

Banter.bindGame({ fill, partyCommand, nextOffer, inspectLabel, forceBuffs: p => AI.upkeepBuffs(p, S.party, false) });
export const partySay = t => Banter.partySay(t);
