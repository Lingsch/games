// Build 13: Vhorun breaks out (levels 30-35). The Last Lamp goes dark, and the One Beneath climbs out of the
// Underdark through a wound in the world. Four lands: the Wound where he rose, the Lightless March he swallowed,
// the Frostcrown where Ulvhar the Frost-King rises again and keeps your parent prisoner, and the Throat of the
// World, where Vhorun's body waits. Three 24-person raids, and old towns under attack while he lives.
// This file holds the shared rules: levels, gates, 24-person raids, the invasions, and the story's first steps.
import { S, X, chat, pick, rnd, irnd, dist, TAU, floatText, clamp } from './core.js';
import { QUESTS, MOBS, CLASSES, CLASS_KEYS, xpNeed, GIVERS } from './data.js';
import { TALK, MOB_LORE } from './dialogue.js';
import { LORE } from './story.js';
import { world, zoneMarker, hgt, freeSpot } from './world.js';
import { LFG_D } from './social6.js';
import { mob, boss, rboss, B, U, HU, giver } from './hi9.js';
import * as Loot5 from './loot5.js';
import * as Cb from './combat.js';
import * as Game from './game.js';

// ---------- levels and gates ----------
export const VH = ['xw13', 'xm13', 'xf13', 'xt13'];
export const LAND_LVL = { xw13: 30, xm13: 31, xf13: 32, xt13: 34 };
X.VH_INST = new Set(); X.RAID24 = new Set();
export const qx35 = (lvl, f) => Math.round(xpNeed(Math.min(lvl, 34)) * f * .25), qg35 = lvl => Math.round(12 + lvl * 6);
X.xpMul.push(() => VH.includes(S.zone) || X.VH_INST.has(S.zone) ? .6 : 1);
X.fakeLvlHooks = X.fakeLvlHooks || [];
X.fakeLvlHooks.push(zone => VH.includes(zone) ? Math.max(30, Math.min(35, Math.round(30 + Math.random() ** 1.2 * 5))) : null);
export const st13 = () => (S.ext.vh13 = S.ext.vh13 || { shards: 0, vhorunDead: false, parentFree: false });
export const brokeOut = () => S.quests.xv1?.state === 'active' || S.quests.xv1?.state === 'done' || S.quests.xv1?.state === 'turned';
export const vhorunDead = () => st13().vhorunDead || S.quests.xt6?.state === 'turned';
X.gate = X.gate || {};
for (const z of VH) X.gate[z] = () => (S.hero?.lvl || 0) < LAND_LVL[z] ? `This land is for level ${LAND_LVL[z]} and beyond.` : null;
const FAMS = ['Fighter', 'Healer', 'Rogue', 'Mage'];
const famsAt = n => FAMS.filter(f => !CLASS_KEYS.some(k => CLASSES[k].family === f && (S.classes[k]?.lvl || 0) >= n));
export function raidWhy35() { if ((S.hero?.lvl || 0) < 34) return 'This raid is for level 34 and above.'; const m = famsAt(30); return m.length ? `You need a ${m.join(', a ')} at level 30 first.` : null; }
export function raidWhy24() { if ((S.hero?.lvl || 0) < 35) return 'The 24-person raids are for level 35.'; const m = famsAt(30); return m.length ? `You need a ${m.join(', a ')} at level 30 first.` : null; }
export function addRaid35(key, name) { X.RAIDS.add(key); X.VH_INST.add(key); X.gate[key] = raidWhy35; LFG_D[key] = { name: `${name} (12-person raid)`, lvl: [34, 35], zone: key, raid: raidWhy35 }; }
export function addRaid24(key, name) { X.RAIDS.add(key); X.RAID24.add(key); X.VH_INST.add(key); X.gate[key] = raidWhy24; LFG_D[key] = { name: `${name} (24-person raid)`, lvl: [35, 35], zone: key, raid: raidWhy24, raid24: true }; }
export function addDungeon35(key, name, lvl) { X.VH_INST.add(key); LFG_D[key] = { name, lvl, zone: key }; }
export function finish35(list) { for (const q of list) { if (q.xp == null) q.xp = qx35(q.lvl, q.daily ? .3 : q.story ? (q.obj.named ? .75 : .5) : q.obj.named ? .65 : .42); if (q.gold == null) q.gold = qg35(q.lvl); if (!('text' in q)) Object.defineProperty(q, 'text', { get() { const s = q.say[0]; return typeof s === 'string' ? s : s[1]; }, enumerable: true, configurable: true }); } return list; }
// everything in a 24-person raid is built for 24: more health, and the trash hits like raid bosses used to
X.spawned = X.spawned || [];
X.spawned.push(e => { if (!e.mob || !X.RAID24.has(S.zone.replace(/^x_/, ''))) return; e.hpMul = (e.hpMul || 1) * (e.boss || MOBS[e.mob]?.raidBoss ? 2.1 : 1.6); e.dmgMul = (e.dmgMul || 1) * 1.15; Cb.recalc(e); e.hp = e.maxHp; });
// the scenery of the new lands: blasted, lightless and frozen
export const PAL_WOUND = { a: '#4a4038', b: '#3a322c', hi: '#6a4a3a', road: '#5a4a3a', cob: '#6a5a4a', low: '#2a2420' };
export const PAL_DARK = { a: '#3a3a46', b: '#2e2e3a', hi: '#4a4a5a', road: '#4a4650', cob: '#5a5664', low: '#22222c' };
export const PAL_ICE = { a: '#e4ecf4', b: '#cfdbe8', hi: '#a8c0d8', road: '#b8c4d0', cob: '#c8d0d8', low: '#f2f6fa' };
export const PAL_THROAT = { a: '#2a1e24', b: '#22181e', hi: '#4a2a3a', road: '#3a2a30', cob: '#4a3a40', low: '#160e12' };

// ---------- the story begins: the Last Lamp goes out ----------
giver('lampwarden13', 'Lamp-Warden Ostrava', 'The Lantern Compact · wherever Vhorun\'s host strikes', 'aegis2');
Object.assign(TALK, {
  lampwarden13: { bio: 'Ostrava has carried a lantern for the Compact for thirty years, in places where a lantern is the only thing between you and the dark. Now the dark has come up to meet her, and she has taken it personally.',
    greet: ["Hold the line, Lightkeeper. The things coming over the walls have never seen daylight, and they don't like it. Show them more of it.", "Every town Vhorun's host strikes, I go. Every time, there's a little less of me left to go. Don't tell Mira."],
    topics: [{ q: 'Why are they attacking the towns?', a: ["Because we're bright. That's all. Vhorun is hungry for light, and every hearth and every lamp and every warm, living person is a little bit of it.", "He sends his host where the light is thickest. Wherever they strike, we answer. Wherever we answer, they learn to be afraid of us. That's the theory, anyway."] }] },
});
Object.assign(MOBS, {
  lightless: mob('Lightless Thrall', 'ghoul~ashen', { ...U, hpM: 1.25, weak: 'holy', resist: 'shadow' }),
  hollowhound: mob('Hollow Hound', 'wolf~ashen', { ...B, hpM: 1.1, spd: 6.4, weak: 'holy', resist: 'shadow', scale: 1.2 }),
  gloomcaster: mob('Gloomcaster', 'warlock2~ashen', { ...HU, hpM: .9, range: 20, ranged: true, caster: true, school: 'shadow', weak: 'holy', resist: 'shadow' }),
  voidspawn: mob('Spawn of Vhorun', 'abom~spectral', { hpM: 1.5, spd: 4.4, scale: 1.1, weak: 'holy', resist: 'shadow', }),
  siegelord13: boss('Siege-Lord of the Lightless', 'bladewarden2~ashen', { ...U, hpM: 1.8, scale: 1.6, weak: 'holy', resist: 'shadow', mechs: ['cleave', 'call', 'charge'], adds: 'lightless', lines: { start: 'This light is spoken for. The One Beneath is hungry, and you are lit up like a feast.', half: 'Thralls! Put them out!' } }),
});
Object.assign(MOB_LORE, { lightless: 'A person the dark has eaten the light out of. They still remember how to hold a sword.', voidspawn: 'A piece of Vhorun that broke off on the way up. It is looking for the rest of itself.' });
Object.assign(LORE, {
  lampout: { title: 'The Night the Lamp Went Out', where: 'lampdoor', text: "From the watch-log of Deepwatch, in Mira's hand: 'Third bell. The Lamp flickered. Fourth bell. The Lamp went out. Not dark: out, as if it had never burned. Then the ground opened, and something went past us, upward, for a very long time. Nobody spoke. Nobody could. It took eleven minutes to pass. I counted.'" },
});
QUESTS.push(...finish35([
  { id: 'xv1', story: true, giver: 'mira', lvl: 30, needLvl: 30, pre: 'vk5', zone: 'deep', where: 'lampdoor', rep: { lantern: 600 }, name: 'When the Last Lamp Falls', obj: { talk: true, what: 'Hear what happened to the Last Lamp' },
    say: ["The Lamp is out, Lightkeeper. Out. I have kept it lit for forty years, my mother for forty before me, and last night it went out like a candle in a draught.", "He grew another hand, like I said he would. But he didn't reach for the light this time. He took hold of it and pulled himself up by it, and he went up through the rock, through a hundred miles of rock, and out into the world.", "He's out. Vhorun is out. There's a wound in the ground where he came up, and the Compact is already camped on the edge of it. Go up the Wound. I'll be right behind you, as soon as I've stopped shaking."],
    done: [['mira', "The Wound is just past the Lamp, where the door used to be. The door is gone. Most of the mountain is gone."], ['mira', "One more thing. He's sending his host into the towns, all over the world. Wherever they strike, Ostrava will be there. Help her when you can. Every light we keep burning is one he can't eat."]] },
]));
X.turnin.push(q => { if (q.id === 'xv1') chat('sys', null, 'Somewhere far above, a town\'s bells start ringing. Vhorun\'s host is on the march.'); });
// the way up into the Wound, where the door below the Last Lamp used to be
X.zone.push(zone => {
  if (zone !== 'deep') return;
  world.zoneLines.push({ x: 60, z: -340, r: 5, to: 'xw13', label: 'Climb up through the Wound (levels 30-35)', why: () => S.quests.xv1?.state !== 'turned' ? 'There is only rock here. For now.' : null });
  zoneMarker(60, -340, 0); world.places.push({ name: 'The Wound', x: 60, z: -345, R: 10, kind: 'place' });
});

// ---------- 24-person raids ----------
X.zone.push(zone => { if (!X.RAIDS?.has(zone) && !X.RAIDS?.has(zone.replace(/^x_/, '')) && S.party.length <= 12) S.ext.raid24 = false; });

// ---------- the invasions: one old town at a time, every three days, while Vhorun lives ----------
const INV = [['vale', 'the Vale'], ['coast', 'the coast'], ['wastes', 'the Grey Waste'], ['north', 'the Rimewild'], ['crown', 'Corrand'], ['deep', 'the Underdark']], DAY = 864e5;
export const invadedZone = () => brokeOut() && !vhorunDead() ? INV[(Math.floor(Date.now() / DAY / 3) + 2) % INV.length] : null;
const INVADERS = ['lightless', 'hollowhound', 'gloomcaster', 'voidspawn'];
export const invLvl = () => clamp(S.hero?.lvl || 30, 30, 35);
X.zone.push(zone => {
  const inv = invadedZone(); if (!inv || inv[0] !== zone || !world.town) return;
  const t = world.town, R0 = (t.R || 24) + 18, L = invLvl();
  for (let i = 0; i < 6; i++) {
    const a = i / 6 * TAU + rnd(-.2, .2), x = t.x + Math.cos(a) * R0, z = t.z + Math.sin(a) * R0, camp = 'inv' + i;
    for (let j = 0; j < 3; j++) world.spawns.push({ x: x + rnd(-3, 3), z: z + rnd(-3, 3), y: hgt(x, z), mob: pick(INVADERS), lvl: [L - 1, L], respawn: 90, area: 0, alive: null, timer: rnd(0, 2), camp, inv: true });
  }
  const a = rnd(0, TAU), bx = t.x + Math.cos(a) * (R0 + 14), bz = t.z + Math.sin(a) * (R0 + 14);
  world.spawns.push({ x: bx, z: bz, y: hgt(bx, bz), mob: 'siegelord13', named: 'siegelord13', lvl: [L, L], respawn: 600, area: 0, alive: null, timer: 1, inv: true });
  world.places.push({ name: 'The Siege-Lord', x: bx, z: bz, R: 8, kind: 'place' });
  const avoid = S.ents.filter(e => e.team === 'npc' && dist(e, t) < 40), p = freeSpot(t.x, t.z, 6, 22, 4.1, avoid);
  const w = Cb.makeEnt({ team: 'npc', maxHp: 1, hp: 1, name: GIVERS.lampwarden13.name, title: GIVERS.lampwarden13.title, kind: 'aegis2', x: p.x, z: p.z, giver: 'lampwarden13' }); w.y = hgt(p.x, p.z);
  setTimeout(() => chat('sys', null, `${inv[1][0].toUpperCase() + inv[1].slice(1)} is under attack! Vhorun's host is at the walls.`), 1500);
});
X.kill.push(m => {
  const inv = invadedZone(); if (!inv || inv[0] !== S.zone || !m.spawn?.inv) return;
  const s = st13(), n = m.mob === 'siegelord13' ? 12 : 1; s.shards += n;
  if (n > 1) chat('loot', null, `The Siege-Lord falls, and the thralls waver. You gather ${n} Lampshards from what's left.`);
  else if (Math.random() < .25) floatText(S.hero, '+1 Lampshard', '#ffd34d');
});
QUESTS.push(...finish35([
  { id: 'vhinv', daily: true, giver: 'lampwarden13', lvl: 30, pre: 'xv1', get zone() { return invadedZone()?.[0] || 'vale'; }, name: 'Daily: Hold the Walls', obj: { kill: INVADERS, n: 15, what: 'Drive back 15 of Vhorun\'s host from the town walls' },
    say: ["They come up out of the ground at dusk, and they don't stop coming until dawn. Fifteen of them, Lightkeeper, before the walls give.", "If you see the Siege-Lord, kill him too. The thralls don't know what to do without someone shouting at them."],
    done: ["The walls held. They'll be back tomorrow night. So will we."] },
]));
X.turnin.push(q => { if (q.id === 'vhinv') { st13().shards += 6; chat('loot', null, 'Ostrava presses 6 Lampshards into your hand.'); } });
// Ostrava trades Lampshards for the Compact's spare gear
const SHOP = [[25, 'A Woundwarden piece for your class (level 32)', 13], [60, 'A Rimebound piece for your class (level 35)', 14]];
X.talk.push((k, n, { go }) => {
  if (k !== 'lampwarden13') return [];
  return [[`▸ What can the Compact spare? <span class="qn">🔆 ${st13().shards} Lampshards</span>`, () => {
    const { el, openSheet, refreshSheet, toast } = X.ui;
    openSheet('The Compact\'s stores', body => {
      body.appendChild(el(`<p style="margin-top:0">Lampshards: <b style="color:var(--acc)">${st13().shards}</b>. You earn them breaking sieges.</p>`));
      for (const [cost, label, tier] of SHOP) { const c = el(`<div class="card craft"><div><b>${label}</b></div><button ${st13().shards < cost ? 'disabled' : ''}>${cost} 🔆</button></div>`);
        c.querySelector('button').onclick = () => { if (st13().shards < cost) return; const it = Loot5.setPieceFor(S.heroCls, tier); if (!Game.addToBag(it)) return toast('Your bags are full.'); st13().shards -= cost; chat('loot', null, `You receive ${it.name}.`); Game.save(); refreshSheet(); };
        body.appendChild(c); }
    });
  }, 'hl']];
});
