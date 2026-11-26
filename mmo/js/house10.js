// Build 10: houses. Buy a house in any of eight towns, a private plot of your own, and (once your guild is
// level 2) a guild hall. Place and move furniture freely; set up your own crafting stations; your friends live
// there when they're not with you, and other players drop in. Homes give rested xp, trophy bonuses and a garden.
import { S, X, chat, pick, rnd, TAU, dist } from './core.js';
import { GIVERS, CLASSES, FAKE_NAMES, xpNeed } from './data.js';
import { TALK } from './dialogue.js';
import { world, hgt, registerZone, ZONE_SIZE, addWall } from './world.js';
import { INSTANCES, buildInstance } from './dungeons.js';
import { build, P, T, Box, Cyl, Sph, Cone, Oct, Dod, Tor } from './models.js';
import { addKinds } from './render.js';
import * as Cb from './combat.js';
import * as Game from './game.js';
import * as Craft from './crafting.js';
import * as Loot5 from './loot5.js';
import { guildLvl } from './social6.js';
import { defineZone, GEO } from './kit9.js';
const O = [0, 0, 0], STILL = [0, 0, 0, 0];

// ---------- furniture ----------
const W = '#6b4a2e', W2 = '#8a6a44', CL = '#7a2a2a';
const FG = {
  bed: () => build([P(T(Box(1.6, .5, 2.4), 0, .35), 0, O, W), P(T(Box(1.5, .2, 2.2), 0, .7), 0, O, '#e8e0cc'), P(T(Box(1.5, .12, 1.2), 0, .82, .45), 0, O, CL), P(T(Box(1.6, 1, .15), 0, .8, -1.15), 0, O, W2), P(T(Box(.6, .15, .4), 0, .85, -.85), 0, O, '#f4f0e8')]),
  table: () => build([P(T(Box(2, .12, 1.2), 0, .9), 0, O, W2), ...[[-.85, -.5], [.85, -.5], [-.85, .5], [.85, .5]].map(([x, z]) => P(T(Box(.12, .9, .12), x, .45, z), 0, O, W))]),
  chair: () => build([P(T(Box(.6, .1, .6), 0, .5), 0, O, W2), P(T(Box(.6, .8, .1), 0, .9, -.25), 0, O, W), ...[[-.25, -.25], [.25, -.25], [-.25, .25], [.25, .25]].map(([x, z]) => P(T(Box(.08, .5, .08), x, .25, z), 0, O, W))]),
  armchair: () => build([P(T(Box(1, .45, .9), 0, .3), 0, O, CL), P(T(Box(1, .9, .25), 0, .75, -.35), 0, O, CL), P(T(Box(.2, .4, .9), -.45, .6), 0, O, '#6a2222'), P(T(Box(.2, .4, .9), .45, .6), 0, O, '#6a2222')]),
  rug: () => build([P(T(Box(3, .03, 2), 0, .02), 0, O, '#8a3a2a'), P(T(Box(2.5, .035, 1.5), 0, .02), 0, O, '#c8a050')]),
  shelf: () => build([P(T(Box(2, 2.2, .45), 0, 1.1), 0, O, W), ...[.4, 1, 1.6].map(y => P(T(Box(1.8, .5, .38), 0, y + .25, .03), 0, O, ['#7a2a2a', '#2a4a7a', '#3a6a2a'][Math.round(y * 2) % 3]))]),
  chest: () => build([P(T(Box(1.2, .7, .7), 0, .35), 0, O, W), P(T(Box(1.22, .1, .72), 0, .7), 0, O, '#3a3a40'), P(T(Box(.15, .2, .05), 0, .55, .36), 0, O, '#d8b24a', .4)]),
  hearth: () => build([P(T(Box(2.4, 2.2, .9), 0, 1.1), 0, O, '#7a7468'), P(T(Box(1.3, 1, .3), 0, .6, .35), 0, O, '#1a1410'), P(T(Cone(.4, .7, 5), 0, .5, .4), 0, O, '#ff8a3a', 2), P(T(Box(2.6, .2, 1.1), 0, 2.2), 0, O, '#5a5448')]),
  candles: () => build([P(T(Cyl(.08, .14, 1.4, 6), 0, .7), 0, O, '#3a3a40'), ...[-.25, 0, .25].map((x, i) => P(T(Cyl(.04, .04, .25, 5), x, 1.5 + (i % 2) * .1), 0, O, '#f4ecd8')), ...[-.25, 0, .25].map((x, i) => P(T(Cone(.03, .08, 4), x, 1.7 + (i % 2) * .1), 0, O, '#ffcf5a', 2))]),
  weaprack: () => build([P(T(Box(1.8, 1.6, .2), 0, .8), 0, O, W), ...[-.6, 0, .6].map(x => P(T(Box(.08, 1.4, .08), x, 1, .15), 0, O, '#c9ccd2'))]),
  mirror: () => build([P(T(Box(.9, 1.9, .1), 0, 1.05), 0, O, '#c8a050'), P(T(Box(.75, 1.7, .05), 0, 1.05, .05), 0, O, '#bfe6ff', .5)]),
  crystallamp: () => build([P(T(Cyl(.15, .25, .8, 6), 0, .4), 0, O, '#4a4652'), P(T(Oct(.3), 0, 1.05, 0, 0, 0, 0, .8, 1.4, .8), 0, O, '#8affff', 1.8)]),
  orb: () => build([P(T(Cyl(.25, .35, .9, 6), 0, .45), 0, O, '#3a3448'), P(T(Sph(.35, 10, 8), 0, 1.2), 0, O, '#c88aff', 1.6)]),
  planter: () => build([P(T(Box(2, .5, 1), 0, .25), 0, O, W), P(T(Box(1.9, .1, .9), 0, .5), 0, O, '#4a3a2a'), ...[-.6, 0, .6].map(x => P(T(Cone(.18, .6, 5), x, .85), 0, O, '#5a9a3a')), ...[-.6, 0, .6].map(x => P(T(Sph(.1, 5, 4), x, 1.15), 0, O, '#ffe25a'))]),
  pedestal: () => build([P(T(Cyl(.45, .55, 1, 8), 0, .5), 0, O, '#9a948a'), P(T(Oct(.3), 0, 1.35), 0, O, '#d8b24a', .8)]),
  bannerwall: () => GEO.banner('#3a5a8a'),
  statue: () => GEO.statue(), lantern: () => GEO.lantern(), fence: () => GEO.fence(), hedge: () => GEO.hedge(), tree: () => GEO.oak(), totem: () => GEO.totem(),
};
// key: [name, model, price in gold (0 = crafted or earned only), station, use]
export const FURN = {
  bed: ['Feather Bed', 'bed', 60], table: ['Oak Table', 'table', 30], chair: ['Oak Chair', 'chair', 12], armchair: ['Velvet Armchair', 'armchair', 45], rug: ['Woven Rug', 'rug', 25],
  shelf: ['Bookshelf', 'shelf', 50], chest: ['Iron-Bound Chest', 'chest', 35], hearth: ['Stone Hearth', 'hearth', 90], candles: ['Candelabra', 'candles', 20], weaprack: ['Weapon Rack', 'weaprack', 0],
  mirror: ['Gilt Mirror', 'mirror', 0], crystallamp: ['Crystal Lamp', 'crystallamp', 0], orb: ['Enchanted Orb', 'orb', 0], bannerwall: ['House Banner', 'bannerwall', 0], pedestal: ['Trophy Pedestal', 'pedestal', 0],
  lantern: ['Lamp Post', 'lantern', 15], statue: ['Garden Statue', 'statue', 80], fence: ['Fence', 'fence', 6], hedge: ['Hedge', 'hedge', 8], tree: ['Young Oak', 'tree', 20], totem: ['Varr Totem', 'totem', 30],
  planter: ['Garden Bed', 'planter', 40, null, 'garden'],
  st_forge: ['Forge', 'forge', 0, 'forge'], st_tanrack: ['Tanning Rack', 'tanrack', 0, 'tanrack'], st_loom: ['Loom', 'loom', 0, 'loom'], st_alchemy: ["Alchemist's Bench", 'alchemy', 0, 'alchemy'],
  st_cookfire: ['Kitchen Fire', 'cookfire', 0, 'cookfire'], st_enchant: ['Enchanting Circle', 'enchant', 0, 'enchant'], st_scribe: ["Scribe's Lectern", 'scribe', 0, 'scribe'],
};
addKinds(Object.fromEntries(Object.entries(FG).map(([k, f]) => ['furn_' + k, [f(), STILL, 0, .03]])));
const kindOf = k => FURN[k] ? (FURN[k][5] || (FURN[k][3] ? FURN[k][1] : 'furn_' + FURN[k][1])) : 'furn_pedestal';
const furn = () => (S.ext.furn = S.ext.furn || {});
Craft.craftHooks.furn = (k, n) => { furn()[k] = (furn()[k] || 0) + n; };
// trophies you've collected become furniture too
const trophyKeys = () => (S.collection || []).filter(k => Loot5.COLLECT[k]?.type === 'trophy');

// ---------- the towns you can buy in ----------
export const TOWNS = { vale: ['The Vale', 150], weald: ['Hornstead', 200], kiln: ['Cinderhall', 200], hush: ['Lanternrest', 200], coast: ['Crookwater', 300], wastes: ['Emberwatch', 400], north: ['Hearthfrost', 600], crown: ['Corrandel', 600] };
const PLOT_COST = 500, HOMES = ['house', 'plot', 'ghall'];
const st = () => (S.ext.home = S.ext.home || { houses: {}, plot: false, layouts: {} });
const layoutKey = () => S.zone === 'house' ? 'house:' + st().at : S.zone;
const layout = k => (st().layouts[k] = st().layouts[k] || []);
export const inHome = () => HOMES.includes(S.zone);
const townName = z => st().names?.[z] || TOWNS[z]?.[0] || 'town';

// ---------- the home zones ----------
const ROOMS = { house: [[-10, 54, 10, 76], [-14, 30, 14, 54], [-26, 34, -14, 50], [14, 34, 26, 50]], ghall: [[-12, 54, 12, 76], [-30, 10, 30, 54], [-46, 14, -30, 30], [30, 14, 46, 30], [-46, 34, -30, 50], [30, 34, 46, 50]] };
const DOORS = { house: [[0, 54], [-14, 42], [14, 42]], ghall: [[0, 54], [-30, 22], [30, 22], [-30, 42], [30, 42]] };
for (const z of ['house', 'ghall']) {
  ZONE_SIZE[z] = 150; INSTANCES[z] = { parent: 'vale', name: z === 'house' ? 'Your House' : 'The Guild Hall', out: { x: 0, z: 0 } };
  registerZone(z, seed => {
    const nm = z === 'house' ? `Your House in ${townName(st().at)}` : `The Hall of <${S.ext.guild?.name || 'your guild'}>`;
    world.names = { zone: nm, town: nm };
    const w = buildInstance(seed, { name: nm, floor: z === 'house' ? '#8a6a48' : '#7a6a5a', rock: '#3a2a1e', walls: true, fog: '#2a1e14', light: .75, exitTo: INSTANCES[z].parent, exitLabel: 'Step outside',
      rects: ROOMS[z], doors: DOORS[z], props: [[-6, 74, () => GEO.lantern()], [6, 74, () => GEO.lantern()], ...(z === 'house' ? [[-12, 32], [12, 32], [-12, 52], [12, 52]] : [[-28, 12], [28, 12], [-28, 52], [28, 52], [0, 12]]).map(([x, zz]) => [x, zz, () => GEO.lantern()])], packs: [], bosses: [] });
    return w;
  });
}
INSTANCES.plot = { parent: 'vale', name: 'Your Plot', out: { x: 0, z: 0 } };
defineZone('plot', { size: 90, seed: 9801, name: 'Your Plot', land: (x, z, N) => 2 + N.fbm(x * .02, z * .02, 2) * 2, pal: { a: '#6a9a4a', b: '#7aaa52', hi: '#7a7468', road: '#9a8a6a', cob: '#9a9284' },
  towns: [{ key: 'cottage', name: 'Your Cottage', x: 0, z: 0, R: 12, wall: 'none', houses: [[0, -6, 0, { wall: '#e8dcc4', roof: '#7a3a2a', w: 7, d: 5, chimney: true }, 7, 5]], npcs: [], guards: [] }],
  roads: [[0, -2, 0, 76]], regions: { names: ['Your Plot'], fn: () => 0 }, lines: [{ x: 0, z: 76, to: 'vale', label: 'Leave your plot', ry: Math.PI }], hunt: [],
  scenery: { density: 6000, tuft: '#6a9a4a', kinds: [['oak', .01, 1, 1.8], ['birch', .006, 1, 1.4]] } });
X.arriveHooks = X.arriveHooks || [];
X.arriveHooks.push((zone, from) => zone === 'house' || zone === 'ghall' ? { x: 0, z: 64 } : zone === 'plot' ? { x: 0, z: 10 } : HOMES.includes(from) && INSTANCES[from].parent === zone ? { ...INSTANCES[from].out } : null);
// what's been placed, as props (so stations work and the garden can be harvested)
function propFor(f, i) { const F = FURN[f.k] || ['Trophy', 'pedestal', 0]; const p = { id: 'furn' + i, kind: f.k.startsWith('trophy:') ? 'furn_pedestal' : kindOf(f.k), tag: 'furn', name: f.k.startsWith('trophy:') ? Loot5.COLLECT[f.k.slice(7)]?.name || 'Trophy' : F[0], x: f.x, z: f.z, yaw: f.ry, scale: 1, furn: f };
  if (F[3]) p.station = F[3]; if (F[4]) p.use = F[4]; return p; }
function placeLayout() { const L = layout(layoutKey()); world.props = world.props || []; L.forEach((f, i) => { const p = propFor(f, i); world.props.push(p); Game.spawnProp(p); }); }
X.zone.push(zone => { if (!HOMES.includes(zone)) return; for (const l of world.zoneLines) l.to = INSTANCES[zone].parent; placeLayout(); });
// travelling home
export function goHome(kind, town) {
  const h = S.hero; if (!h || h.dead) return 'Not now.';
  if (Cb.inCombat(h) && S.ents.some(m => m.mob && !m.dead && m.threat?.has(h))) return "You can't go home in the middle of a fight.";
  const back = inHome() ? null : { zone: S.zone, x: h.x, z: h.z };
  if (kind === 'house') { if (!st().houses[town]) return 'You don\'t own a house there.'; st().at = town; }
  if (kind === 'plot' && !st().plot) return 'You need the deed to a plot first. Any housing steward sells one.';
  if (kind === 'ghall' && !(S.ext.guild && guildLvl() >= 2)) return 'Your guild needs to reach level 2 for a hall.';
  if (back) { INSTANCES[kind].parent = back.zone; INSTANCES[kind].out = { x: back.x, z: back.z }; }
  else { INSTANCES[kind].parent = INSTANCES[S.zone].parent; INSTANCES[kind].out = INSTANCES[S.zone].out; }
  Game.travel(kind, null, true); return null;
}
// placing and moving furniture
export function place(k) {
  if (!inHome()) return 'You can only place furniture at home.';
  const tro = k.startsWith('trophy:'), have = tro ? !layout(layoutKey()).some(f => f.k === k) : (furn()[k] || 0) > 0; if (!have) return 'You have none of those.';
  const h = S.hero, f = { k, x: +(h.x + Math.sin(h.yaw) * 2).toFixed(1), z: +(h.z + Math.cos(h.yaw) * 2).toFixed(1), ry: +(h.yaw + Math.PI).toFixed(2) };
  if (!tro) furn()[k]--;
  const L = layout(layoutKey()); L.push(f); const p = propFor(f, L.length - 1); world.props.push(p); Game.spawnProp(p); Cb.recalc(h); Game.save(); return null;
}
export function nearby() { return S.ents.filter(e => e.prop?.furn && !e.remove && dist(e, S.hero) < 5).sort((a, b) => dist(a, S.hero) - dist(b, S.hero)); }
export function rotate(e) { e.prop.furn.ry = +(e.prop.furn.ry + Math.PI / 4).toFixed(2); e.yaw = e.prop.yaw = e.prop.furn.ry; Game.save(); }
export function nudge(e, dx, dz) { const c = Math.cos(S.hero.yaw), s = Math.sin(S.hero.yaw), f = e.prop.furn; f.x = +(f.x + dx * c + dz * s).toFixed(1); f.z = +(f.z - dx * s + dz * c).toFixed(1); e.x = e.prop.x = f.x; e.z = e.prop.z = f.z; e.y = hgt(e.x, e.z); Game.save(); }
export function pickUp(e) { const f = e.prop.furn, L = layout(layoutKey()); L.splice(L.indexOf(f), 1); if (!f.k.startsWith('trophy:')) furn()[f.k] = (furn()[f.k] || 0) + 1; e.remove = true; e.dead = true; world.props = world.props.filter(p => p !== e.prop); Cb.recalc(S.hero); Game.save(); }

// ---------- people at home: your friends who aren't with you, and visitors ----------
X.zone.push(zone => {
  if (!HOMES.includes(zone)) return;
  const around = zone === 'plot' ? { x: 0, z: 4, r: 10 } : { x: 0, z: 40, r: 8 };
  const folk = (S.friends || []).filter(fr => !S.party.some(p => p.name === fr.name)).map(fr => ({ name: fr.name, cls: fr.cls, race: fr.race, title: 'Lives here' }));
  if (zone === 'ghall') { const g = S.ext.guild?.name; for (const f of (S.fakes || []).filter(f => f.fake?.guild === g).slice(0, 6)) folk.push({ name: f.name, cls: f.cls, race: f.race, title: `<${g}>` }); }
  const n = zone === 'ghall' ? 4 : Math.floor(rnd(1, 3.99)); for (let i = 0; i < n; i++) folk.push({ name: pick(FAKE_NAMES), cls: pick(Object.keys(CLASSES)), title: 'Visiting' });
  for (const f of folk) {
    const a = rnd(0, TAU), r = rnd(2, around.r), kind = CLASSES[f.cls].models[1] + (f.race && f.race !== 'human' ? '_' + f.race : '');
    const e = Cb.makeEnt({ team: 'npc', maxHp: 1, hp: 1, name: f.name, title: f.title, kind, x: around.x + Math.cos(a) * r, z: around.z + Math.sin(a) * r, resident: true, home: { x: around.x, z: around.z } });
    e.y = hgt(e.x, e.z); e.yaw = rnd(0, TAU);
  }
});
const SAY = ["Make yourself at home. Oh, wait, it's your home.", "I moved the chair. I liked it better over there.", "Someone left a sock in the hearth again.", "Nice place. Needs more trophies.", "I'm not staying long. I've been here three days."];
let rT = 0;
X.tick.push(dt => { if (!inHome() || (rT -= dt) > 0) return; rT = rnd(25, 60); const r = pick(S.ents.filter(e => e.resident && !e.remove)); if (r) chat('say', r.name, pick(SAY)); });

// ---------- bonuses ----------
// rested: time away from the game while your last stop was a home builds a pool that doubles kill xp
let restChecked = false;
X.tick.push(() => {
  const s = st(), now = Date.now();
  if (!restChecked && S.hero) { restChecked = true; const seen = S.ext.seen; if (seen?.home && now - seen.t > 6e5) { const h = (now - seen.t) / 36e5, add = Math.round(xpNeed(S.hero.lvl) * .05 * h); s.rest = Math.min(Math.round(xpNeed(S.hero.lvl) * 1.5), (s.rest || 0) + add); if (add > 0) chat('sys', null, 'You feel well rested.'); } }
  if (!S.ext.seenT || now - S.ext.seenT > 5000) { S.ext.seenT = now; S.ext.seen = { t: now, home: inHome() }; }
});
X.rested = (p, a) => { const s = st(); if (!(s.rest > 0)) return a; const b = Math.min(a, s.rest); s.rest -= b; return a + b; };
// trophies on display: each is worth a little, up to ten
const trophiesShown = () => Object.values(st().layouts).flat().filter(f => f.k.startsWith('trophy:')).length;
{ const prev = X.acctOf; X.acctOf = e => { const a = prev(e); if (!e?.isHero) return a; const n = Math.min(10, trophiesShown()); if (!n) return a; return { ...a, powP: (a.powP || 0) + .005 * n, hpP: (a.hpP || 0) + .005 * n }; }; }
// the garden grows while you're away: one herb every half hour, up to six
X.propLabel = e => { const f = e.prop.furn; if (e.prop.use !== 'garden') return null; const n = gardenCount(f); return n ? `Harvest the garden (${n})` : 'The garden is growing'; };
const gardenCount = f => Math.min(6, Math.floor((Date.now() - (f.t || (f.t = Date.now()))) / 18e5));
X.propUse = e => { const f = e.prop.furn, n = gardenCount(f); if (!n) { chat('sys', null, 'Nothing is ready yet. Come back in a while.'); return; }
  const sk = Craft.skill('herbalism') || 0, pool = sk >= 100 ? ['kingsfoil', 'frostbloom', 'deepcap'] : sk >= 75 ? ['kelpbloom', 'graveroot'] : sk >= 40 ? ['graveroot', 'meadowsweet'] : ['meadowsweet'];
  const got = {}; for (let i = 0; i < n; i++) { const k = pick(pool); got[k] = (got[k] || 0) + 1; } for (const [k, c] of Object.entries(got)) Craft.addMat(k, c, true);
  f.t = Date.now(); chat('loot', null, `You harvest ${Object.entries(got).map(([k, c]) => `${c} ${Craft.MATS[k].name}`).join(' and ')}.`); };

// ---------- housing stewards, in every town you can buy in ----------
GIVERS.steward = { name: 'Housing Steward', title: 'Houses, plots and furniture', model: 'villager2' };
TALK.steward = { bio: 'The stewards of the eight kingdoms\' housing office are all, somehow, called Pell, and none of them are related. They will sell you a house, a plot of land, or a chair, and they will tell you the chair was a bargain.', greet: ['Looking for a place to put your feet up? Every hero needs a home, and every home needs a very expensive rug.', 'Houses, plots and furniture. Mostly furniture. People always need more chairs.'], topics: [] };
X.zone.push(zone => {
  if (!TOWNS[zone] || !world.town) return;
  const t = world.town, a = .7; const e = Cb.makeEnt({ team: 'npc', maxHp: 1, hp: 1, name: 'Pell, Housing Steward', title: GIVERS.steward.title, kind: 'villager2', x: t.x + Math.cos(a) * ((t.R || 20) * .5), z: t.z + Math.sin(a) * ((t.R || 20) * .5), giver: 'steward' });
  e.y = hgt(e.x, e.z);
});
X.talk.push((k, n, api) => {
  if (k !== 'steward') return [];
  const out = [], z = S.zone, T0 = TOWNS[z] && [world.names?.town || TOWNS[z][0], TOWNS[z][1]];
  if (T0 && !st().houses[z]) out.push([`▸ Buy a house in ${T0[0]} (${T0[1]} gold).`, () => { if (S.gold < T0[1]) { X.ui.toast('Not enough gold.'); return; } S.gold -= T0[1]; st().houses[z] = true; (st().names = st().names || {})[z] = T0[0]; furn().bed = (furn().bed || 0) + 1; furn().chair = (furn().chair || 0) + 1; chat('sys', null, `You own a house in ${T0[0]}. The steward throws in a bed and a chair.`); api.close(); Game.save(); }, 'hl']);
  if (T0 && st().houses[z]) out.push([`▸ Take me to my house.`, () => { api.close(); const m = goHome('house', z); if (m) X.ui.toast(m); }, 'hl']);
  if (!st().plot) out.push([`▸ Buy the deed to a private plot (${PLOT_COST} gold).`, () => { if (S.gold < PLOT_COST) { X.ui.toast('Not enough gold.'); return; } S.gold -= PLOT_COST; st().plot = true; furn().planter = (furn().planter || 0) + 1; chat('sys', null, 'You own a plot of land. The deed comes with a garden bed.'); api.close(); Game.save(); }, 'hl']);
  out.push(['▸ Show me your furniture.', () => { api.close(); openShop(); }, 'hl']);
  return out;
});
function openShop() {
  X.ui.openSheet('Furniture', body => {
    const { el, esc, refreshSheet } = X.ui;
    body.appendChild(el(`<p>You have ${S.gold} gold. The finer pieces are made by crafters.</p>`));
    for (const [k, [name, , price]] of Object.entries(FURN)) { if (!price) continue;
      const c = el(`<div class="who"><div><b>${esc(name)}</b> <small>owned: ${furn()[k] || 0}</small></div><button ${S.gold >= price ? '' : 'disabled'}>${price}g</button></div>`);
      c.querySelector('button').onclick = () => { if (S.gold < price) return; S.gold -= price; furn()[k] = (furn()[k] || 0) + 1; Game.save(); refreshSheet(); }; body.appendChild(c); }
  });
}

// ---------- the Home page ----------
X.book.push(['home', 'Home', body => {
  const { el, esc, toast, refreshSheet } = X.ui, s = st();
  const restLvl = (s.rest || 0) / xpNeed(S.hero.lvl);
  body.appendChild(el(`<p style="margin:0 0 6px">${restLvl > .01 ? `Rested: ${Math.round(restLvl * 100)}% of a level. ` : ''}Trophies on display: ${Math.min(10, trophiesShown())} (+${(Math.min(10, trophiesShown()) * .5).toFixed(1)}% power and health)</p>`));
  if (!inHome()) {
    const owned = Object.keys(s.houses);
    const go = el(`<div class="card" style="text-align:left"><h3>Go home</h3><div class="acts">${owned.map(z => `<button data-h="${z}">${esc(townName(z))}</button>`).join('')}${s.plot ? '<button data-p="1">My plot</button>' : ''}${S.ext.guild ? '<button data-g="1">Guild hall</button>' : ''}</div>${!owned.length && !s.plot ? '<p style="font-size:13px">Any housing steward will sell you a house or a plot.</p>' : ''}</div>`);
    go.onclick = ev => { const b = ev.target.closest('button'); if (!b) return; const m = b.dataset.h ? goHome('house', b.dataset.h) : b.dataset.p ? goHome('plot') : goHome('ghall'); if (m) toast(m); else X.ui.closeSheet(); };
    body.appendChild(go);
  } else {
    const near = nearby()[0];
    if (near) { const c = el(`<div class="card" style="text-align:left"><h3>${esc(near.prop.name)}</h3><div class="acts"><button data-a="rot">Turn</button><button data-a="f">Push</button><button data-a="b">Pull</button><button data-a="l">Left</button><button data-a="r">Right</button><button data-a="up">Pick up</button></div></div>`);
      c.onclick = ev => { const a = ev.target.closest('button')?.dataset.a; if (!a) return; if (a === 'rot') rotate(near); if (a === 'f') nudge(near, 0, .5); if (a === 'b') nudge(near, 0, -.5); if (a === 'l') nudge(near, .5, 0); if (a === 'r') nudge(near, -.5, 0); if (a === 'up') pickUp(near); refreshSheet(); };
      body.appendChild(c); }
    const inv = Object.entries(furn()).filter(([, n]) => n > 0), tro = trophyKeys().filter(k => !Object.values(s.layouts).flat().some(f => f.k === 'trophy:' + k));
    body.appendChild(el(`<p class="setl" style="margin:8px 0 4px">Place in front of you</p>`));
    if (!inv.length && !tro.length) body.appendChild(el('<p style="font-size:13px">No furniture in storage. Stewards sell the basics; crafters make the rest.</p>'));
    for (const [k, n] of inv) { const c = el(`<div class="who"><div><b>${esc(FURN[k]?.[0] || k)}</b> <small>×${n}</small></div><button>Place</button></div>`); c.querySelector('button').onclick = () => { const m = place(k); if (m) toast(m); refreshSheet(); }; body.appendChild(c); }
    for (const k of tro) { const c = el(`<div class="who"><div><b>🏆 ${esc(Loot5.COLLECT[k].name)}</b> <small>trophy</small></div><button>Place</button></div>`); c.querySelector('button').onclick = () => { const m = place('trophy:' + k); if (m) toast(m); refreshSheet(); }; body.appendChild(c); }
  }
}]);
