// Build 9: world bosses, one in every land. Three kinds:
//   timed: it wakes on its own every 30-45 minutes you spend in its land, and the whole zone hears it;
//   summoned: EverQuest style, with three offerings gathered from the land's creatures, at an old altar;
//   events: the land is invaded in three stages (a wave, its champions, then the boss).
// The fake players hear the shout too, and come running.
import { S, X, chat, pick, rnd, TAU, dist } from './core.js';
import { MOBS, GIVERS, CLASSES } from './data.js';
import { TALK } from './dialogue.js';
import { world, hgt } from './world.js';
import * as Cb from './combat.js';
import * as Craft from './crafting.js';
import * as Loot5 from './loot5.js';
import { boss } from './hi9.js';

const wb = (name, kind, o) => ({ ...boss(name, kind, o), hpM: o.hpM || 3.2, scale: o.scale || 2.4, worldBoss: true });
Object.assign(MOBS, {
  kingsroadgiant: wb('Grathul\'s Mother', 'abom', { undead: true, lines: { start: 'WHERE IS MY BOY? WHO PUT MY BOY IN THE GROUND?', half: 'BOY! BOY!' }, mechs: ['slam', 'call', 'enrage'], adds: 'skeleton' }),
  saltjaw: wb('Old Saltjaw', 'crabbig', { scale: 3, weak: 'storm', resist: 'frost', mechs: ['cleave', 'pool', 'enrage'], lines: { start: '*The tide goes out all at once. Something the size of a house climbs up the beach.*', half: '*It clacks its claws, and the sea answers.*' } }),
  ashencolossus: wb('The Ashen Colossus', 'abom', { undead: true, scale: 3, weak: 'fire', mechs: ['slam', 'pool', 'spawn', 'enrage'], adds: 'blightspawn', lines: { start: 'EMBERWATCH. I HAVE COME FOR THE LAST WALL.', half: 'FALL. FALL!' } }),
  grovetitan: wb('Ironbark, the Grove Titan', 'treant', { scale: 2.6, weak: 'fire', resist: 'nature', mechs: ['slam', 'spawn'], adds: 'sapling', lines: { start: '*The oldest tree in the Weald pulls its roots out of the ground, and walks.*', half: '*Its children follow it.*' } }),
  slagtitan: wb('The Slag Titan', 'golempet', { scale: 2.6, weak: 'storm', resist: 'earth', mechs: ['slam', 'pool'], lines: { start: '*Three cores flare in the offering bowl. The slag heap stands up.*', half: '*Molten rock pours from its joints.*' } }),
  drownedchoir: wb('The Drowned Choir', 'wraith', { undead: true, scale: 2.4, range: 18, ranged: true, caster: true, school: 'frost', mechs: ['fear', 'pool', 'call'], adds: 'lostone', lines: { start: 'Every lamp in the fen goes out tonight, little Sallow. Come home. Come HOME.', half: 'Sing, drowned ones! Sing!' } }),
  eyelesswyrm: wb('The Eyeless Wyrm', 'leviathan', { scale: 1, weak: 'holy', resist: 'shadow', mechs: ['pool', 'slam', 'fear', 'enrage'], lines: { start: '*Three starless shards fall into the pit. Something old and blind smells them, and rises.*', half: '*It screams, and the crystals of the Underdark crack.*' } }),
  rimegiant: wb('Hrafn the Rime Giant', 'troll', { scale: 3, weak: 'fire', resist: 'frost', mechs: ['slam', 'knock', 'pool', 'enrage'], lines: { start: 'SMALL WARM THINGS. HRAFN HAS SLEPT A HUNDRED WINTERS. HRAFN IS HUNGRY.', half: 'HRAFN WILL EAT THE SUN.' } }),
  blacklion: wb('Captain Leontes, the Black Lion', 'bladewarden2', { scale: 1.8, weak: 'storm', mechs: ['cleave', 'charge', 'call', 'enrage'], adds: 'mercenary', lines: { start: 'The Regent is dead, so nobody is paying us. We have decided Corrandel will pay us instead. All of it.', half: 'Lions! Take the gate!' } }),
});
// one boss in each land
export const WB = {
  vale: { mob: 'kingsroadgiant', lvl: 10, how: 'timed' }, coast: { mob: 'saltjaw', lvl: 15, how: 'summon', item: 'Drowned Offering' }, wastes: { mob: 'ashencolossus', lvl: 20, how: 'event', wave: ['blightspawn', 'bonewarden', 'blightghoul'], champ: 'plaguehulk', wl: [18, 20] },
  weald: { mob: 'grovetitan', lvl: 6, how: 'timed' }, kiln: { mob: 'slagtitan', lvl: 6, how: 'summon', item: 'Glowing Core' }, hush: { mob: 'drownedchoir', lvl: 6, how: 'event', wave: ['lostone', 'fenghoul', 'bogwight'], champ: 'choircaller', wl: [4, 5] },
  deep: { mob: 'eyelesswyrm', lvl: 25, how: 'summon', item: 'Starless Offering' }, north: { mob: 'rimegiant', lvl: 25, how: 'timed' }, crown: { mob: 'blacklion', lvl: 25, how: 'event', wave: ['mercenary', 'rebelbow', 'mercenary'], champ: 'mercenary', wl: [23, 25] },
};
const EVENT_TEXT = {
  wastes: ['The Dead Tide: the dead of the wastes are marching on Emberwatch! Hold the walls.', 'The tide\'s champions are at the gate!', 'The Ashen Colossus is coming for Emberwatch!'],
  hush: ['The Night of Lamps: the Lost are walking on Lanternrest! Keep the lamps lit.', 'The Choir\'s callers have come to sing the town down!', 'The Drowned Choir rises out of the fen!'],
  crown: ['The Black Lion Siege: the unpaid mercenaries are storming Corrandel!', 'The Black Lion\'s officers are at the gates!', 'Captain Leontes leads the charge himself!'],
};
// summoning offerings drop from the land's creatures, and stack like materials
for (const [z, w] of Object.entries(WB)) if (w.item) Craft.MATS['offer_' + z] = { name: w.item, icon: z === 'coast' ? '🐚' : z === 'kiln' ? '🔶' : '🌑' };
X.kill.push(m => {
  if (m.tagged !== 'party' || !m.loot) return;
  const w = WB[S.zone]; if (w?.item && !m.worldBoss && Math.random() < (m.named ? .5 : .05)) m.loot.push({ uid: Math.random(), name: w.item, slot: 'junk', mat: 'offer_' + S.zone, n: 1, lvl: 1, rarity: 2, stats: {}, value: 0 });
});
// collectibles for each boss
for (const [z, w] of Object.entries(WB)) Loot5.COLLECT['title_wb_' + z] = { type: 'title', name: MOBS[w.mob].name.split(',')[0].replace(/^(The|Old) /, '') + '-Slayer', from: 'world boss' };

// ---------- state: real-world timers, so short visits still count ----------
const st = () => (S.ext.wb = S.ext.wb || {});
const now = () => Date.now();
const live = () => S.ents.find(e => e.worldBoss && !e.dead && !e.remove);
function shout(text) { chat('sys', null, text); X.ui?.toast?.(text.length > 70 ? text.slice(0, 68) + '…' : text); }
// where things happen: a walkable spawn point near the top of the land, or near the town for events
const farPoint = () => { const pts = world.spawns.filter(s => !s.dungeon && !s.named && !s.camp); if (!pts.length) return null; const top = Math.max(...pts.map(s => s.area || 0)); return pick(pts.filter(s => (s.area || 0) === top)); };
const nearTown = () => { const t = world.town, pts = world.spawns.filter(s => !s.dungeon && Math.hypot(s.x - t.x, s.z - t.z) < (t.R || 30) + 120 && Math.hypot(s.x - t.x, s.z - t.z) > (t.R || 30) + 15); return pts.length ? pick(pts) : farPoint(); };
function summonBoss(z, at) {
  const w = WB[z]; at = at || farPoint(); if (!at) return null;
  const e = Cb.makeMob(w.mob, w.lvl, { x: at.x, z: at.z, home: { x: at.x, z: at.z }, named: w.mob, boss: true, worldBoss: true });
  e.y = hgt(e.x, e.z);
  // the zone hears it, and the fake players come running
  const reg = world.regionNames && world.regionFn ? world.regionNames[world.regionFn(e.x, e.z)] : null;
  shout(`${e.name} has risen${reg ? ' in ' + reg : ''}! Every sword in ${world.names?.zone || 'the land'} is needed.`);
  for (const f of S.ents) if (f.fake && !f.inParty && !f.dead && Math.abs(f.lvl - w.lvl) <= 6 && Math.random() < .8) f.fake.rally = e;
  return e;
}
const sec = s => s * 1000;
function plan(z) { const w = WB[z], s = st(); s[z] = s[z] || { next: now() + sec(w.how === 'event' ? rnd(900, 1500) : rnd(600, 1200)) }; return s[z]; }
// ---------- the clock ----------
let tickT = 0, ev = null;
X.tick.push(dt => {
  if ((tickT -= dt) > 0) return; tickT = 2;
  const z = S.zone, w = WB[z]; if (!w || !S.hero) return;
  const p = plan(z);
  if (w.how === 'timed' && !live() && now() > p.next) { if (p.warned) { summonBoss(z); p.next = now() + sec(rnd(1800, 2700)); p.warned = false; } else { p.warned = true; p.next = now() + sec(rnd(40, 90)); shout(`The ground trembles somewhere in ${world.names?.zone || 'the land'}. Something enormous is waking.`); } }
  if (w.how === 'event') tickEvent(z, w, p);
});
X.zone.push(() => { ev = null; });
function tickEvent(z, w, p) {
  if (!ev && now() > p.next && !live()) {
    ev = { stage: 0, left: 0, mobs: [] }; shout(EVENT_TEXT[z][0]);
    for (let i = 0; i < 18; i++) { const at = nearTown(); if (!at) break; const m = Cb.makeMob(pick(w.wave), Math.round(rnd(w.wl[0], w.wl[1])), { x: at.x + rnd(-4, 4), z: at.z + rnd(-4, 4) }); m.y = hgt(m.x, m.z); m.home = { x: world.town.x, z: world.town.z }; m.invader = true; ev.mobs.push(m); }
    ev.left = ev.mobs.length;
    for (const f of S.ents) if (f.fake && !f.inParty && !f.dead && Math.random() < .6) f.fake.rally = pick(ev.mobs);
  }
  if (!ev) return;
  // the invaders march on the town
  for (const m of ev.mobs) if (!m.dead && !m.engaged && Math.random() < .3) { const t = world.town; m.home = { x: t.x + rnd(-8, 8), z: t.z + rnd(-8, 8) }; m.wander = m.home; }
  const alive = ev.mobs.filter(m => !m.dead && !m.remove).length;
  if (alive) return;
  if (ev.stage === 0) { ev.stage = 1; shout(EVENT_TEXT[z][1]); ev.mobs = []; for (let i = 0; i < 3; i++) { const at = nearTown(); if (!at) continue; const m = Cb.makeMob(w.champ, w.wl[1], { x: at.x, z: at.z, elite: true, name: MOBS[w.champ].name + ' Champion' }); m.y = hgt(m.x, m.z); m.home = { x: world.town.x, z: world.town.z }; ev.mobs.push(m); } return; }
  if (ev.stage === 1) { ev.stage = 2; shout(EVENT_TEXT[z][2]); const b = summonBoss(z, nearTown()); ev.mobs = b ? [b] : []; return; }
  if (ev.stage === 2) { shout(`${world.names?.zone || 'The land'} is safe again. For now.`); ev = null; p.next = now() + sec(rnd(2400, 3600)); }
}
// the fake players answer the call
X.fakeRally = true;
// ---------- the altars for summoned bosses ----------
GIVERS.altar = { name: 'Old Altar', title: 'Something sleeps here', model: 'shrine' };
TALK.altar = { bio: 'A ring of old stones with a bowl in the middle, stained dark. People who know about these things leave it alone. People who don\'t, sometimes leave offerings.', get greet() { const w = WB[S.zone]; return w?.item ? [`The bowl is empty. Three ${w.item}s would fill it. Something below is waiting to be fed.`] : ['The bowl is empty.']; }, topics: [] };
X.talk.push((k, n, api) => {
  if (k !== 'altar') return [];
  const w = WB[S.zone]; if (!w?.item) return [];
  const have = S.mats['offer_' + S.zone] || 0;
  return [[`▸ Make the offering (${have}/3 ${w.item}s)`, () => { if (have < 3) { X.ui.toast(`You need three ${w.item}s.`); return; } if (live()) { X.ui.toast('Something has already answered.'); return; } S.mats['offer_' + S.zone] -= 3; api.close(); summonBoss(S.zone, { x: n.x + 8, z: n.z + 8 }); }, 'hl']];
});
X.zone.push(zone => {
  const w = WB[zone]; if (w?.how !== 'summon') return;
  const at = farPoint(); if (!at) return;
  const e = Cb.makeEnt({ team: 'npc', maxHp: 1, hp: 1, name: GIVERS.altar.name, title: GIVERS.altar.title, kind: 'shrine', x: at.x + 6, z: at.z + 6, giver: 'altar', scale: 1.6 });
  e.y = hgt(e.x, e.z); world.places.push({ name: 'The Old Altar', x: e.x, z: e.z, R: 10, kind: 'place' });
});
// ---------- loot ----------
X.kill.push(m => {
  if (!m.worldBoss) return;
  const z = Object.keys(WB).find(k => WB[k].mob === m.mob), L = m.lvl, tier = L >= 25 ? 8 : L >= 20 ? 6 : L >= 15 ? 4 : L >= 10 ? 2 : 0;
  m.loot = m.loot || [];
  const people = S.party.filter(p => p.cls && !p.dead);
  for (let i = 0; i < 3; i++) { const who = Math.random() < .5 ? S.hero : pick(people); m.loot.push(Loot5.setPieceFor(who.cls, tier)); }
  if (z && !Loot5.owned('title_wb_' + z)) Loot5.collect('title_wb_' + z);
  m.lootGold = (m.lootGold || 0) + 40 + L * 12;
  shout(`${m.name} has fallen!`);
  for (const f of S.ents) if (f.fake?.rally === m) f.fake.rally = null;
  if (z && WB[z].how !== 'event') st()[z] = { next: now() + sec(rnd(1800, 2700)) };
});
