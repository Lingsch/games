// Build 7: Between Worlds, the 12-person raid. Eight bosses: the early ones are EverQuest-style slugfests (big
// numbers, tank and spank), the later ones have real mechanics (tank them apart, spread, soak, interrupt), and the
// Gravelord waits at the end. Dying inside means a corpse run from the rift. The raid can lead itself, or you can
// lead it: assign tanks and healers, call stack, spread, focus and interrupts. Loot is need/greed unless your
// guild has chosen master loot, DKP or a loot council.
import * as THREE from './three.js';
import { S, TAU, chat, pick, rnd, irnd, clamp, floatText, X } from './core.js';
import { world, hgt, registerZone, ZONE_SIZE } from './world.js';
import { MOBS, QUESTS, GIVERS, CLASSES, CLASS_KEYS, xpNeed, makeItem, RARITY } from './data.js';
import { LORE } from './story.js';
import { DBOSSES, FINALS, buildInstance } from './dungeons.js';
import * as Cb from './combat.js';
import * as Game from './game.js';
import * as Loot5 from './loot5.js';
import * as Craft from './crafting.js';
import { LFG_D } from './social6.js';
import { W7 } from './wastes7.js';
const RAID = 'between';
export const inRaid = (z = S.zone) => z === RAID || !!X.RAIDS?.has(z);   // Build 9: three more raids use the same rules
ZONE_SIZE.between = 300;

// ---------- who may enter: level 20, and one class from each family at 20 ----------
const FAMS = ['Fighter', 'Healer', 'Rogue', 'Mage'];
export function raidLockWhy() {
  if ((S.hero?.lvl || 0) < 20) return 'Between Worlds is for level 20.';
  const missing = FAMS.filter(f => !CLASS_KEYS.some(k => CLASSES[k].family === f && (S.classes[k]?.lvl || 0) >= 20));
  return missing.length ? `The rift won't open for you until you have reached 20 as a ${missing.join(', a ')}.` : null;
}
X.gate = X.gate || {}; X.gate[RAID] = raidLockWhy;
LFG_D.between = { name: 'Between Worlds (12-person raid)', lvl: [20, 20], zone: RAID, raid: raidLockWhy };

// ---------- the raid's map ----------
registerZone(RAID, seed => {
  world.names = { zone: 'Between Worlds', town: 'Between Worlds', boss: 'The Gravelord' };
  const w = buildInstance(seed, { name: 'Between Worlds', floor: '#2e3a30', rock: '#0a120c', walls: true, fog: '#0a160e', light: .42, exitTo: 'wastes', exitLabel: 'Step back through the rift',
    rects: [[-10, 52, 10, 76], [-4, 36, 4, 52], [-26, 6, 26, 36], [-4, -6, 4, 6], [-26, -40, 26, -6], [-60, -32, -26, -16], [-92, -62, -60, -2], [26, -32, 60, -16], [60, -62, 92, -2],
      [-4, -56, 4, -40], [-30, -96, 30, -56], [-4, -110, 4, -96], [-32, -148, 32, -110], [-4, -162, 4, -148], [-34, -204, 34, -162], [-4, -218, 4, -204], [-42, -270, 42, -218]],
    doors: [[0, 52], [0, 36], [0, 6], [0, -6], [-26, -24], [-60, -24], [26, -24], [60, -24], [0, -40], [0, -56], [0, -96], [0, -110], [0, -148], [0, -162], [0, -204], [0, -218]],
    props: [],
    packs: [[-6, 62, ['legionknight', 'deathcaller', 'legionknight'], [20, 20]], [-16, 28, ['boneguard', 'deathsworn', 'deathsworn', 'deathcaller'], [20, 20]], [16, 28, ['ashwraith', 'ashwraith', 'plaguehulk'], [20, 20]],
      [-16, -12, ['legionknight', 'legionknight', 'deathcaller', 'legionbow'], [20, 20]], [-80, -14, ['ashwraith', 'vharosghost', 'vharosghost'], [20, 20]], [80, -14, ['plaguehulk', 'deathcaller', 'deathsworn'], [20, 20]],
      [-18, -64, ['boneguard', 'boneguard', 'deathcaller'], [20, 20]], [18, -64, ['legionknight', 'legionbow', 'legionbow', 'deathcaller'], [20, 20]], [-20, -118, ['ashwraith', 'ashwraith', 'deathcaller'], [20, 20]],
      [20, -118, ['legionknight', 'legionknight', 'deathcaller'], [20, 20]], [-22, -170, ['boneguard', 'plaguehulk', 'deathcaller'], [20, 20]], [22, -170, ['legionknight', 'ashwraith', 'deathcaller', 'legionbow'], [20, 20]]],
    bosses: [[0, 18, 'gatewarden', 20], [0, -24, 'bonefather', 20], [-80, -36, 'sorrow', 20], [-70, -40, 'spite', 20], [76, -32, 'choir', 20], [0, -78, 'colossus', 20], [0, -130, 'nocturne', 20], [0, -184, 'engine', 20], [0, -248, 'gravelord', 20, true]] });
  // every enemy in Between Worlds is raid-strength
  for (const s of world.spawns) { s.elite = true; s.raid12 = true; }
  return w;
});
const rboss = (name, kind, o) => ({ name, kind, hpM: 3.4, dmgM: 1.5, spd: 5.2, range: 3.2, weak: null, resist: 'shadow', scale: 2, aggro: 18, social: 30, undead: true, raidBoss: true, ...o });
Object.assign(MOBS, {
  gatewarden: rboss('The Gatewarden of Between', 'abom', { scale: 2.5, hpM: 2, dmgM: 1.7, mechs: ['cleave', 'slam', 'enrage'], lines: { start: '*The thing at the gate has stood here since before the world had a name. It does not move aside.*', half: '*It roars, and the rift shudders.*' } }),
  bonefather: rboss('Mourngrave the Bonefather', 'skeleton', { scale: 2.4, hpM: 2.1, dmgM: 1.6, mechs: ['cleave', 'call', 'enrage'], adds: 'bonewarden', lines: { start: 'Every bone in the eight kingdoms has a father. I am he. Come home, children.', half: 'Children! To your father!' } }),
  sorrow: rboss('Sorrow, the Left Hand', 'ghostnpc', { scale: 1.8, hpM: 1.6, range: 18, ranged: true, caster: true, school: 'frost', resist: 'frost', mechs: ['pool', 'fear'], lines: { start: 'Spite, my love. They have come to part us.', half: 'Spite! Come to me!' } }),
  spite: rboss('Spite, the Right Hand', 'troll', { scale: 2, hpM: 1.7, dmgM: 1.6, mechs: ['cleave', 'charge'], lines: { start: 'Nobody parts us. NOBODY.', half: 'Sorrow! I am coming!' } }),
  choir: rboss('The Choir of a Thousand Throats', 'wraith', { scale: 2.2, hpM: 2.2, range: 18, ranged: true, caster: true, school: 'shadow', fly: .5, mechs: ['fear', 'volley'], lines: { start: '*A thousand voices start a hymn that was old when the summoner wars began.*', half: '*The hymn breaks into a thousand separate screams.*' } }),
  colossus: rboss('The Bone Colossus of Vharos', 'golempet', { scale: 3.3, hpM: 2.4, dmgM: 1.7, weak: 'storm', resist: 'earth', mechs: ['slam', 'knock'], lines: { start: '*Every bone of the old Vharosi army, fused into one shape. It remembers marching.*', half: '*Its ribs open. The doom inside is getting heavier.*' } }),
  nocturne: rboss('Lady Nocturne, the Gravelord\'s Bride', 'ghostnpc', { scale: 2, hpM: 2.2, range: 18, ranged: true, caster: true, school: 'shadow', mechs: ['pool', 'heal'], lines: { start: 'He promised me forever. He keeps his promises. Do you keep yours?', half: 'Husband! They are at the door of our house!' } }),
  engine: rboss('The Marrow Engine', 'abom', { scale: 2.8, hpM: 2.5, dmgM: 1.6, mechs: ['slam', 'cleave', 'enrage'], lines: { start: '*Bone grinds against bone. The Engine is making something, and it needs more material.*', half: '*It speeds up. The floor begins to grind.*' } }),
  gravelord: rboss('The Gravelord', 'gravelord', { scale: 2.4, hpM: .7, dmgM: 1.6, range: 18, ranged: true, caster: true, school: 'shadow', mechs: ['pool', 'call', 'fear'], adds: 'deathsworn', lines: { start: "So. The child from the Vale. I emptied your graves, I drowned your coast, I burned a kingdom, and still you walk. Very well. Walk to me.", half: 'Enough. Let us see how you fare between worlds.' } }),
});
DBOSSES.between = ['gatewarden', 'bonefather', 'sorrow', 'spite', 'choir', 'colossus', 'nocturne', 'engine', 'gravelord'];
FINALS.push('gravelord');

// ---------- the raid's own mechanics ----------
const st = new Map();
const members = () => S.party.filter(p => !p.dead);
const nonTanks = () => members().filter(p => CLASSES[p.cls].role !== 'tank');
const lead = () => !!S.ext.raidLead;
function telegraph(o) { const g = { kind: 'circle', t: 5, col: '#ff3a1a', tele: true, ...o }; S.dangers.push(g); return g; }
function blast(g, fn) { for (const e of members()) if (Math.hypot(e.x - g.x, e.z - g.z) < g.r + .3) fn(e); }
const say = (m, t) => chat('say', m.name, t);
function interruptible(m, name, secs, onFinish) {
  // a long cast: the raid has to stop it. On rails, someone usually does; leading, the interrupters you named do.
  m.mcast = { name, t: secs, raid: true }; floatText(m, name, '#c88aff', true); chat('sys', null, `${m.name} begins to cast ${name}!`);
  const b = st.get(m); b.cast = { name, t: secs, t0: secs, fin: onFinish };
  const auto = !lead(), named = lead() && (S.ext.raidInterrupt || []).length;
  if (auto || named) { const who = members().filter(p => !p.isHero && (named ? S.ext.raidInterrupt.includes(p.name) : true)); const p = pick(who);
    if (p && Math.random() < (named ? .95 : .8)) b.cast.kick = { at: rnd(.9, secs - .6), by: p }; }
}
function tickCast(m, b, dt) {
  const c = b.cast; if (!c) return false;
  c.t -= dt;
  if (!m.mcast) { b.cast = null; return true; }               // somebody interrupted it (maybe you)
  if (c.kick && c.t <= c.t0 - c.kick.at) { Cb.interrupt(m); chat('party', c.kick.by.name, pick(['kicked!', 'interrupted', 'got it', 'stopped the cast'])); b.cast = null; return true; }
  if (c.t <= 0) { m.mcast = null; b.cast = null; c.fin(); }
  return true;
}
// tank assignments on rails: the main tank on the boss, the off-tank on the second boss or the adds
function autoTanks(m) {
  if (lead()) return;
  const tanks = members().filter(p => CLASSES[p.cls].role === 'tank' && !p.isHero);
  const other = S.ents.find(e => e !== m && e.raidBoss && !e.dead && e.engaged);
  if (tanks[0]) tanks[0].assignTgt = m;
  if (tanks[1]) tanks[1].assignTgt = other || S.ents.find(e => e.mob && !e.dead && e.engaged && !e.raidBoss && e.target && e.target.cls && CLASSES[e.target.cls].role !== 'tank') || null;
}
const SCRIPT = {
  // the twins grow stronger when they stand together: tank them apart
  sorrow(m, b, dt) { twins(m, dt, b); }, spite(m, b, dt) { twins(m, dt, b); },
  // the Choir marks three of you: run out, or everyone near you shares the scream
  choir(m, b, dt) {
    b.mark = (b.mark ?? 8) - dt;
    if (b.mark <= 0) { b.mark = 16; const tgts = nonTanks().sort(() => Math.random() - .5).slice(0, 3);
      for (const v of tgts) { const g = telegraph({ x: v.x, z: v.z, r: 6, t: 5, col: '#b05aff', follow: v, mine: v === S.hero });
        if (v === S.hero) chat('sys', null, 'The Choir marks you. Get away from the others!');
        setTimeout(() => { if (m.dead) return; for (const e of members()) if (e !== v && Math.hypot(e.x - g.x, e.z - g.z) < 6) Cb.damage(m, e, e.maxHp * .45, 'shadow', { noMiss: true }); Cb.damage(m, v, v.maxHp * .2, 'shadow', { noMiss: true }); }, 5000); }
      if (!lead()) for (const v of tgts) if (!v.isHero) { const a = rnd(0, TAU); v.forceTo = { x: m.x + Math.sin(a) * 16, z: m.z + Math.cos(a) * 16, until: S.time + 5, r: 2 }; } }
  },
  // the Colossus drops a Shared Doom: stand in it together, or everyone pays
  colossus(m, b, dt) {
    b.doom = (b.doom ?? 12) - dt;
    if (b.doom <= 0) { b.doom = 22; const a = rnd(0, TAU), g = telegraph({ x: m.x + Math.sin(a) * 7, z: m.z + Math.cos(a) * 7, r: 5, t: 6, col: '#ffd34d', soak: true });
      chat('sys', null, 'Shared Doom! Stand in the golden circle together.'); say(m, '*Its ribcage opens over the floor.*');
      if (!lead()) for (const e of nonTanks()) if (!e.isHero) e.forceTo = { x: g.x + rnd(-2, 2), z: g.z + rnd(-2, 2), until: S.time + 6, r: 2.5, g };
      setTimeout(() => { if (m.dead) return; const inside = members().filter(e => Math.hypot(e.x - g.x, e.z - g.z) < g.r + .4), n = Math.max(1, inside.length);
        for (const e of inside) Cb.damage(m, e, e.maxHp * 2.4 / n, 'shadow', { noMiss: true });
        if (inside.length < 5) { chat('sys', null, 'Too few shared the Doom. It spills over the whole raid.'); for (const e of members()) Cb.damage(m, e, e.maxHp * .3, 'shadow', { noMiss: true }); } }, 6000); }
  },
  // Lady Nocturne's Kiss of Death: interrupt it, or it hits everyone. Her mourners come every 30 seconds.
  nocturne(m, b, dt) {
    b.kiss = (b.kiss ?? 10) - dt; b.adds = (b.adds ?? 25) - dt;
    if (b.kiss <= 0 && !b.cast) { b.kiss = 17; interruptible(m, 'Kiss of Death', 4, () => { chat('sys', null, 'The Kiss of Death lands on the whole raid.'); for (const e of members()) Cb.damage(m, e, e.maxHp * .38, 'shadow', { noMiss: true }); }); }
    if (b.adds <= 0) { b.adds = 30; say(m, 'Mourners! Weep for them!'); for (let k = 0; k < 3; k++) { const a = Cb.makeMob('deathcaller', 20, { x: m.x + Math.cos(k * 2.1) * 10, z: m.z + Math.sin(k * 2.1) * 10, home: { x: m.x, z: m.z }, add: true, elite: true, dungeon: true }); Cb.addThreat(a, pick(members()), 5); } }
  },
  // the Engine grinds the floor away from the edges inward, and builds golems as it breaks
  engine(m, b, dt) {
    b.grind = (b.grind ?? 18) - dt;
    if (b.grind <= 0) { b.grind = 24; b.ring = (b.ring || 0) + 1; say(m, '*The floor grinds.*');
      for (let k = 0; k < 10 + b.ring * 2; k++) { const a = k / (10 + b.ring * 2) * TAU, r = 28 - b.ring * 3.5; S.dangers.push({ kind: 'circle', x: m.home.x + Math.cos(a) * r, z: m.home.z + Math.sin(a) * r, r: 4.2, t: 60, pool: true, dps: .1, col: '#c86a3a' }); } }
    for (const th of [.66, .33]) if (m.hp / m.maxHp < th && !b['g' + th]) { b['g' + th] = 1; say(m, '*A half-built golem falls out of the Engine and stands up.*'); for (let k = 0; k < 2; k++) { const a = Cb.makeMob('boneguard', 20, { x: m.x + rnd(-6, 6), z: m.z + rnd(-6, 6), home: { x: m.x, z: m.z }, add: true, elite: true, dungeon: true }); Cb.addThreat(a, pick(members()), 5); } }
  },
  // the Gravelord: three phases
  gravelord(m, b, dt) {
    const hp = m.hp / m.maxHp;
    if (hp < .7 && !b.p2) { b.p2 = 1; say(m, 'You think you are fighting me? You are fighting the dead of eight kingdoms.'); }
    if (hp < .4 && !b.p3) { b.p3 = 1; say(m, 'Enough. Come and stand Between with me.'); Cb.buff(m, 'enraged', 999, { pow: .2, haste: .15 }, m); }
    if (b.p2) { b.mark = (b.mark ?? 6) - dt; b.soul = (b.soul ?? 14) - dt;
      if (b.mark <= 0) { b.mark = 20; for (const v of nonTanks().sort(() => Math.random() - .5).slice(0, 2)) { const g = telegraph({ x: v.x, z: v.z, r: 6, t: 5, col: '#8aff5a', follow: v, mine: v === S.hero }); if (v === S.hero) chat('sys', null, 'Grave Mark! Get away from the others!');
        if (!lead() && !v.isHero) { const a = rnd(0, TAU); v.forceTo = { x: m.x + Math.sin(a) * 15, z: m.z + Math.cos(a) * 15, until: S.time + 5, r: 2 }; }
        setTimeout(() => { if (m.dead) return; for (const e of members()) if (e !== v && Math.hypot(e.x - g.x, e.z - g.z) < 6) Cb.damage(m, e, e.maxHp * .4, 'shadow', { noMiss: true }); }, 5000); } }
      if (b.soul <= 0) { b.soul = 26; const a = rnd(0, TAU), g = telegraph({ x: m.x + Math.sin(a) * 8, z: m.z + Math.cos(a) * 8, r: 5, t: 6, col: '#ffd34d', soak: true }); chat('sys', null, 'Soul Harvest! Share it in the golden circle.');
        if (!lead()) for (const e of nonTanks()) if (!e.isHero) e.forceTo = { x: g.x + rnd(-2, 2), z: g.z + rnd(-2, 2), until: S.time + 6, r: 2.5, g };
        setTimeout(() => { if (m.dead) return; const inside = members().filter(e => Math.hypot(e.x - g.x, e.z - g.z) < g.r + .4); for (const e of inside) Cb.damage(m, e, e.maxHp * 2.6 / Math.max(1, inside.length), 'shadow', { noMiss: true }); if (inside.length < 5) for (const e of members()) Cb.damage(m, e, e.maxHp * .25, 'shadow', { noMiss: true }); }, 6000); } }
    if (b.p3) { b.pull = (b.pull ?? 8) - dt; b.kiss = (b.kiss ?? 12) - dt;
      if (b.pull <= 0) { b.pull = 18; say(m, 'Come closer.'); for (const e of members()) { const d = Math.hypot(e.x - m.x, e.z - m.z); if (d > 4) { e.x += (m.x - e.x) / d * Math.min(d - 3, 9); e.z += (m.z - e.z) / d * Math.min(d - 3, 9); e.y = hgt(e.x, e.z); } }
        for (let k = 0; k < 6; k++) { const a = k / 6 * TAU + rnd(0, .5); S.dangers.push({ kind: 'circle', x: m.x + Math.cos(a) * 9, z: m.z + Math.sin(a) * 9, r: 3.6, t: 10, pool: true, dps: .08, col: '#8aff5a' }); } }
      if (b.kiss <= 0 && !b.cast) { b.kiss = 20; interruptible(m, 'Unmaking', 4, () => { chat('sys', null, 'The Unmaking tears through the raid.'); for (const e of members()) Cb.damage(m, e, e.maxHp * .38, 'shadow', { noMiss: true }); }); } }
  },
};
function twins(m, dt, b) {
  const o = S.ents.find(e => e !== m && (e.mob === 'sorrow' || e.mob === 'spite') && !e.dead); if (!o) { if (!b.alone) { b.alone = 1; say(m, m.mob === 'spite' ? 'SORROW! You will pay for her!' : 'Spite... oh, my Spite.'); Cb.buff(m, 'enraged', 999, { pow: .3, haste: .25 }, m); } return; }
  const near = Math.hypot(m.x - o.x, m.z - o.z) < 14; b.tog = (b.tog || 0) + (near ? dt : -dt); b.tog = clamp(b.tog, 0, 6);
  if (b.tog > 2 && !m.buffs.some(x => x.id === 'empowered')) { Cb.buff(m, 'empowered', 4, { pow: .5 }, m); if (!b.warned) { b.warned = 1; chat('sys', null, 'Sorrow and Spite draw strength from each other. Pull them apart!'); } }
  if (b.tog > 2) Cb.buff(m, 'empowered', 2, { pow: .5 }, m);
}
// run every engaged raid boss's script, move the marks with their targets, and steer the tanks on rails
X.tick.push(dt => {
  if (!inRaid()) return;
  for (const g of S.dangers) if (g.follow) { if (g.follow.dead) g.t = 0; else { g.x = g.follow.x; g.z = g.follow.z; } }
  for (const m of S.ents) {
    if (!m.raidBoss && !MOBS[m.mob]?.raidBoss || m.dead || !m.engaged) { if (m.raidBoss || MOBS[m.mob]?.raidBoss) st.delete(m); continue; }
    m.raidBoss = true; if (!st.has(m)) st.set(m, {}); const b = st.get(m);
    autoTanks(m);
    tickCast(m, b, dt);
    SCRIPT[m.mob]?.(m, b, dt);
  }
});

// ---------- the corpse run ----------
// dying Between Worlds leaves your body where it fell; the raid wakes at the rift and runs back
X.release = () => {
  if (!inRaid()) return false;
  const h = S.hero;
  S.corpse.zone = S.zone; S.corpse.x = h.x; S.corpse.z = h.z;
  S.corpse.ent = Cb.makeEnt({ team: 'npc', name: `${h.name}'s corpse`, kind: 'corpse', x: h.x, z: h.z, corpse: true, maxHp: 1, hp: 1 });
  const wipe = S.party.every(p => p === h || p.dead);
  h.x = 0; h.z = 60; h.y = hgt(0, 60);
  // the fallen wake with you at the rift; anyone still standing keeps fighting
  for (const p of S.party) if (p !== h && p.dead) { p.x = rnd(-4, 4); p.z = 60 + rnd(-3, 3); p.y = hgt(p.x, p.z); }
  if (wipe) for (const m of S.ents) if (m.mob && !m.dead && m.engaged) m.evading = true;
  chat('sys', null, wipe ? 'The raid wipes. You all wake at the rift; your bodies lie where you fell.' : 'You wake at the rift. Your body lies where you fell, and the raid is still fighting.');
  return true;
};

// ---------- loot: need/greed, master looter, DKP or a loot council ----------
export const LOOT_MODES = { needgreed: 'Need / Greed', master: 'Master looter', dkp: 'DKP', council: 'Loot council' };
const lootMode = () => (inRaid() || S.zone?.startsWith('h_') || S.party.length > 6) ? (S.ext.guild?.loot || 'needgreed') : 'master';
const wants = (p, it) => it.book ? X.canStudy(p, it) : it.slot !== 'collect' && it.slot !== 'recipe' && Game.canWear(p.cls, it);
X.kill.push(m => {
  if (!(m.raidBoss || MOBS[m.mob]?.raidBoss) || !inRaid()) return;
  S.ext.dkp = S.ext.dkp || {}; for (const p of S.party) S.ext.dkp[p.name] = (S.ext.dkp[p.name] || 0) + 10;
  setTimeout(() => { const mode = lootMode(); if (mode === 'master' || !m.loot?.length) return; distribute(m, mode); }, 50);
});
function distribute(m, mode) {
  const items = m.loot.filter(it => it.slot !== 'collect' && !X.isSmall?.(it)); if (!items.length) return;
  m.loot = m.loot.filter(it => it.slot === 'collect' || X.isSmall?.(it));     // collectibles stay on the body for you
  const { el, esc, openSheet, refreshSheet, closeSheet } = X.ui;
  const rolls = items.map(it => ({ it, mine: null, done: false }));
  const resolve = r => {
    const it = r.it, fakes = S.party.filter(p => !p.isHero && !p.dead);
    let winner = null, line = '';
    if (mode === 'needgreed') {
      const need = fakes.filter(p => wants(p, it) && Math.random() < .8), greed = fakes.filter(p => !need.includes(p) && Math.random() < .35);
      const all = [...need.map(p => ({ p, kind: 'need', n: irnd(1, 100) })), ...greed.map(p => ({ p, kind: 'greed', n: irnd(1, 100) }))];
      if (r.mine && r.mine !== 'pass') all.push({ p: S.hero, kind: r.mine, n: irnd(1, 100) });
      const best = all.sort((a, b) => (a.kind === 'need' ? 0 : 1) - (b.kind === 'need' ? 0 : 1) || b.n - a.n)[0];
      if (best) { winner = best.p; line = `${best.p.name} wins ${it.name} (${best.kind} ${best.n}).`; } else line = `Everyone passed on ${it.name}.`;
    } else if (mode === 'dkp') {
      const bids = fakes.filter(p => wants(p, it)).map(p => ({ p, n: Math.round((S.ext.dkp[p.name] || 0) * rnd(.2, .6)) }));
      if (r.mine === 'need') bids.push({ p: S.hero, n: r.bid || Math.round((S.ext.dkp[S.hero.name] || 0) * .5) });
      const best = bids.sort((a, b) => b.n - a.n)[0];
      if (best) { winner = best.p; S.ext.dkp[best.p.name] = Math.max(0, (S.ext.dkp[best.p.name] || 0) - best.n); line = `${best.p.name} wins ${it.name} for ${best.n} DKP.`; } else line = `Nobody bid on ${it.name}.`;
    } else if (mode === 'council') {
      winner = r.pick || null; line = winner ? `The council awards ${it.name} to ${winner.name}.` : `The council holds ${it.name} for later.`;
      if (winner) { const off = S.party.filter(p => p.fake && p !== winner)[0]; if (off) setTimeout(() => chat('guild', off.name, pick(['fair call', 'hm. ok', `grats ${winner.name}`, 'council has spoken', 'i would have picked differently but ok'])), 1500); }
    }
    chat('party', null, line);
    if (winner && !winner.isHero && it.book) Game.assignLoot({ loot: [it] }, it, winner);
    if (winner?.isHero) { if (!Game.addToBag(it)) chat('sys', null, 'Your bags are full; the item goes to the guild bank.'); }
    r.done = true;
  };
  openSheet(`${m.name}: ${LOOT_MODES[mode]}`, body => {
    body.appendChild(el(`<p class="dim" style="margin:0 0 6px">${mode === 'dkp' ? `Your DKP: ${S.ext.dkp[S.hero.name] || 0}` : mode === 'council' ? 'You and your officers decide.' : 'Roll for what you want.'}</p>`));
    for (const r of rolls) {
      const it = r.it, can = it.book ? X.canStudy(S.hero, it) : Game.canWear(S.heroCls, it);
      const c = el(`<div class="card it" style="--c:${RARITY[it.rarity].c}"><b style="color:${RARITY[it.rarity].c}">${esc(it.name)}</b> <span class="dim">L${it.lvl} ${it.slot}${can ? '' : ' · not for you'}</span><div class="acts"></div></div>`);
      const acts = c.querySelector('.acts');
      if (r.done) acts.textContent = 'Done.';
      else if (mode === 'council') { for (const p of S.party.filter(p => !p.dead)) { const b = el(`<button>${p.isHero ? 'Me' : esc(p.name)}${wants(p, it) ? ' ✓' : ''}</button>`); b.onclick = () => { r.pick = p; resolve(r); refreshSheet(); }; acts.appendChild(b); } }
      else for (const [k, t] of mode === 'dkp' ? [['need', 'Bid'], ['pass', 'Pass']] : [['need', 'Need'], ['greed', 'Greed'], ['pass', 'Pass']]) { const b = el(`<button ${k === 'need' && !can ? 'disabled' : ''}>${t}</button>`); b.onclick = () => { r.mine = k; resolve(r); refreshSheet(); }; acts.appendChild(b); }
      body.appendChild(c);
    }
  });
  // anything you don't answer is decided after 20 seconds
  setTimeout(() => { let any = false; for (const r of rolls) if (!r.done) { if (mode === 'council') { r.pick = pick(S.party.filter(p => !p.isHero && wants(p, r.it))) || null; } resolve(r); any = true; } if (any) X.ui.refreshSheet?.(); }, 20000);
}

// ---------- raid recipes and the story's end ----------
const add = Craft.addRecipe;
add('riftplate', 'smithing', 'Riftforged Breastplate', 90, { silver: 10, brass: 6, shard: 4 }, { slot: 'chest', armor: 'plate', lvl: 20, rar: 3 }, RAID);
add('riftweave', 'tailoring', 'Voidwoven Robe', 90, { seasilk: 8, wool: 8, shard: 4 }, { slot: 'chest', armor: 'cloth', lvl: 20, rar: 3 }, RAID);
add('riftleather', 'leatherworking', 'Riftreaver Jerkin', 90, { scalehide: 8, thickhide: 8, shard: 4 }, { slot: 'chest', armor: 'leather', lvl: 20, rar: 3 }, RAID);
add('riftring', 'jewelcrafting', 'Band of the One Beneath', 92, { moonstone: 3, pearl: 3, shard: 3 }, { slot: 'ring', jewel: true, lvl: 20, rar: 3 }, RAID);
add('riftwpn', 'smithing', 'Gravebreaker Weapon (for your class)', 95, { silver: 12, brass: 6, shard: 5, garnet: 2 }, { slot: 'weapon', weapon: true, lvl: 20, rar: 3 }, RAID);
Object.assign(Loot5.COLLECT, {
  title_gravebreaker: { type: 'title', name: 'Gravebreaker', from: RAID }, trophy_crown: { type: 'trophy', name: "The Gravelord's Crown", desc: 'Cold iron and old bone. Something has been whispering in it, and it has not stopped.', from: RAID },
  mount_bonedrake: { type: 'mount', name: 'Rift-Touched Bonesteed', kind: 'horse_ghost', spd: .9, ride: 1, from: RAID }, pet_wisp: { type: 'pet', name: 'A Wisp of Between', kind: 'ghost', scale: .3, from: RAID },
});
Object.assign(LORE, { patron: { title: 'The Voice Between Worlds', where: 'throne', text: "When the Gravelord fell, something else spoke through his mouth. It did not sound angry. It sounded patient. 'You have broken my herald. No matter. I was promised the dead of eight kingdoms, and I am owed. I am Vhorun, the One Beneath. We will meet when the last lamp falls.' Then the green light went out of his eyes, and it was gone." } });
X.kill.push(m => {
  if (m.mob !== 'gravelord' || S.zone !== RAID) return;
  const lines = ['*The Gravelord falls to his knees. The green light in his eyes flickers, and goes out.*', '*Then it comes back, colder, and his mouth opens, and a voice that is not his speaks.*',
    'You have broken my herald. No matter.', 'I was promised the dead of eight kingdoms, and I am owed. I am Vhorun, the One Beneath.', 'We will meet when the last lamp falls.', '*The light goes out. Whatever was here is gone.*'];
  lines.forEach((t, i) => setTimeout(() => chat('say', i < 2 || i === 5 ? 'The Gravelord' : 'A voice Between Worlds', t), 1200 + i * 2600));
  S.flags.gravelordDead = true;
});
// the raid's quest, and the last word at Emberwatch
const qx = (lvl, f) => Math.round(xpNeed(19) * f);
QUESTS.push(
  { id: 'w8', story: true, giver: 'vael', lvl: 20, pre: 'w7', name: 'Between Worlds', xp: qx(20, .5), gold: 200, gear: true, rep: { ember: 1000, light: 500, vale: 500, law: 500 }, lore: 'patron', obj: { named: 'gravelord', n: 1, what: 'Lead a raid of twelve into Between Worlds and destroy the Gravelord' },
    say: ["Twelve of you, through the rift. The Gravelord is waiting, with everything he has left: his gatekeeper, his bride, his engines and his dead.", "Bring him down, {hero}. For the Vale, for the coast, for every grave he emptied. The Ember Garrison will hold the rift until you come back. All of you, if I have any say in it."],
    done: [['vael', "Vhorun. The One Beneath. So the Gravelord was a herald, and the war he started is somebody else's war."], ['vael', "Not today's problem. Today, the Gravelord is dead, the wastes are quiet, and every bell in Emberwatch is ringing for you. Go and listen to them, {hero}. You've earned it."]] },
);
X.turnin.push(q => { if (q.id === 'w8') { Loot5.collect('title_gravebreaker'); } });

// ---------- the raid panel: lead it yourself, or let it run on rails ----------
X.book.push(['raid', 'Raid', body => {
  const { el, esc, toast, refreshSheet } = X.ui;
  const lay = S.ext.raidFrames || 'grid', ld = lead();
  body.appendChild(el(`<p style="margin:0 0 6px">Raid group: ${S.party.length}/${Game.partyCap()} · loot: ${LOOT_MODES[S.ext.guild?.loot || 'needgreed']}${S.ext.guild ? ` (set by &lt;${esc(S.ext.guild.name)}&gt;)` : ''}</p>`));
  const row = (label, opts, cur, set) => { const r = el(`<div class="who"><div><b>${label}</b></div><div>${opts.map(([k, t]) => `<button data-k="${k}" class="${cur === k ? 'on' : ''}">${t}</button>`).join(' ')}</div></div>`); r.onclick = ev => { const k = ev.target.dataset?.k; if (k) { set(k); refreshSheet(); } }; body.appendChild(r); };
  row('Who leads', [['ai', 'The AI'], ['me', 'Me']], ld ? 'me' : 'ai', k => { S.ext.raidLead = k === 'me'; if (!S.ext.raidLead) clearOrders(); });
  row('Raid frames', [['grid', 'Grid'], ['group', 'My group + bars'], ['side', 'Side panel']], lay, k => S.ext.raidFrames = k);
  if (S.ext.guild?.own) row('Guild loot rule', Object.entries(LOOT_MODES), S.ext.guild.loot || 'needgreed', k => S.ext.guild.loot = k);
  if (!ld) { body.appendChild(el('<p class="dim" style="font-size:13px">The raid assigns its own tanks and healers, dodges, spreads, soaks and interrupts. You play your role.</p>')); return; }
  const mem = S.party.filter(p => !p.isHero);
  body.appendChild(el('<h3 style="font:700 13px Cinzel;margin:8px 0 4px;color:var(--dim)">Tanks</h3>'));
  for (const p of mem.filter(p => CLASSES[p.cls].role === 'tank')) { const r = el(`<div class="who"><div><b>${esc(p.name)}</b> <small>${p.assignTgt && !p.assignTgt.dead ? 'on ' + esc(p.assignTgt.name) : 'free'}</small></div><div><button data-a="t">On my target</button> <button data-a="f">Free</button></div></div>`);
    r.onclick = ev => { const a = ev.target.dataset?.a; if (a === 't') { if (S.target && Cb.isEnemy(S.hero, S.target)) p.assignTgt = S.target; else toast('Target an enemy first.'); } if (a === 'f') p.assignTgt = null; refreshSheet(); }; body.appendChild(r); }
  body.appendChild(el('<h3 style="font:700 13px Cinzel;margin:8px 0 4px;color:var(--dim)">Healers</h3>'));
  const tanks = S.party.filter(p => CLASSES[p.cls].role === 'tank');
  for (const p of mem.filter(p => CLASSES[p.cls].role === 'healer')) { const r = el(`<div class="who"><div><b>${esc(p.name)}</b> <small>${p.healFocus ? 'on ' + esc(p.healFocus.name) : 'raid'}</small></div><div>${tanks.map((t, i) => `<button data-i="${i}">${esc(t.name)}</button>`).join(' ')} <button data-i="-1">Raid</button></div></div>`);
    r.onclick = ev => { const i = ev.target.dataset?.i; if (i !== undefined) { p.healFocus = +i >= 0 ? tanks[+i] : null; refreshSheet(); } }; body.appendChild(r); }
  body.appendChild(el('<h3 style="font:700 13px Cinzel;margin:8px 0 4px;color:var(--dim)">Interrupters</h3>'));
  const ints = S.ext.raidInterrupt || [];
  const ir = el(`<div style="display:flex;flex-wrap:wrap;gap:4px">${mem.map(p => `<button data-n="${esc(p.name)}" class="${ints.includes(p.name) ? 'on' : ''}">${esc(p.name)}</button>`).join('')}</div>`);
  ir.onclick = ev => { const n = ev.target.dataset?.n; if (!n) return; S.ext.raidInterrupt = ints.includes(n) ? ints.filter(x => x !== n) : [...ints, n]; refreshSheet(); }; body.appendChild(ir);
}, () => S.party.length > 6 || inRaid()]);
function clearOrders() { for (const p of S.party) { p.assignTgt = null; p.healFocus = null; p.forceTo = null; } S.raidFocus = null; }
export function order(kind) {
  const h = S.hero, mem = S.party.filter(p => !p.isHero && !p.dead);
  if (kind === 'stack') { for (const p of mem) if (CLASSES[p.cls].role !== 'tank') p.forceTo = { x: h.x + rnd(-1.5, 1.5), z: h.z + rnd(-1.5, 1.5), until: S.time + 8, r: 2 }; chat('party', h.name, 'Stack on me!'); }
  if (kind === 'spread') { const boss = S.ents.find(e => e.raidBoss && e.engaged && !e.dead) || h; mem.filter(p => CLASSES[p.cls].role !== 'tank').forEach((p, i, a) => { const ang = i / a.length * TAU; p.forceTo = { x: boss.x + Math.sin(ang) * 14, z: boss.z + Math.cos(ang) * 14, until: S.time + 8, r: 2 }; }); chat('party', h.name, 'Spread out!'); }
  if (kind === 'move') { for (const p of mem) p.forceTo = { x: h.x + rnd(-3, 3), z: h.z + rnd(-3, 3), until: S.time + 12, r: 2.5 }; chat('party', h.name, 'Move to me!'); }
  if (kind === 'focus') { if (S.target && Cb.isEnemy(h, S.target)) { S.raidFocus = S.target; chat('party', h.name, `Focus ${S.target.name}!`); } else X.ui.toast('Target an enemy first.'); }
}
// the quick bar: three raid calls beside the group orders, only while you lead
let qbT = 0;
X.light.push(dt => {
  if ((qbT -= dt) > 0) return; qbT = .3;
  const show = lead() && S.party.length > 6, cmds = document.getElementById('cmds'); if (!cmds) return;
  let q = document.getElementById('raidq');
  if (show && !q) { q = document.createElement('div'); q.id = 'raidq'; q.style.cssText = 'display:flex;gap:2px;margin-top:2px'; q.innerHTML = ['stack', 'spread', 'move', 'focus'].map(k => `<button data-r="${k}">${{ stack: 'Stack', spread: 'Spread', move: 'To me', focus: 'Focus' }[k]}</button>`).join(''); q.onclick = ev => { const k = ev.target.closest('button')?.dataset.r; if (k) order(k); }; cmds.after(q); }
  if (q) q.style.display = show ? 'flex' : 'none';
  const box = document.getElementById('party'); if (!box) return;
  const raid = S.party.length > 6, lay = S.ext.raidFrames || 'grid'; box.classList.toggle('raid', raid); box.classList.toggle('r24', S.party.length > 12); box.dataset.lay = raid ? lay : '';
  box.querySelectorAll('.pf').forEach((d, i) => d.classList.toggle('mini', raid && lay === 'group' && i >= 5));
  let tog = document.getElementById('raidTog');
  if (raid && !tog) { tog = document.createElement('button'); tog.id = 'raidTog'; tog.onclick = () => box.classList.toggle('shut'); box.prepend(tog); }
  if (tog) tog.textContent = box.classList.contains('shut') ? `👥 ${S.party.length} ▸` : '◂ hide';
  if (!raid || lay !== 'side') box.classList.remove('shut');
});

// a raid holds 12 only while there's a raid
X.zone.push(zone => { if (!inRaid(zone) && S.party.length <= 6) S.ext.raid12 = false; if (!inRaid(zone)) { st.clear(); for (const p of S.party) { p.forceTo = null; p.assignTgt = null; } S.raidFocus = null; } });
