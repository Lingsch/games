// Build 6: Fishing and Salvaging. Fish pools churn by the shore (rough water by the reefs, glowfin at night,
// storm eels in a storm); wrecks along the beaches give up timber, brass, rope and the odd coin.
// New coast-tier recipes use them, crafting stations stand in Crookwater, and the four coast dungeons drop rare recipes.
import { S, TAU, irnd, pick, chat, X, isNight, mulberry32 } from './core.js';
import { world, hgt, depthAt } from './world.js';
import { coastHooks } from './zones.js';
import { GIVERS, QUESTS } from './data.js';
import { TALK } from './dialogue.js';
import { build, P, T, Box, Cyl, Cone, Sph, Oct, Dod } from './models.js';
import { addKinds } from './render.js';
import * as Craft from './crafting.js';
import { C6 } from './coast6.js';
const O = [0, 0, 0], STILL = [0, 0, 0, 0];

Object.assign(Craft.PROFS, { fishing: { name: 'Fishing', icon: '🎣', gather: true }, salvaging: { name: 'Salvaging', icon: '⚓', gather: true } });
Object.assign(Craft.MATS, {
  cod: { name: 'Salt Cod', icon: '🐟' }, eel: { name: 'Storm Eel', icon: '🐍' }, glowfin: { name: 'Glowfin', icon: '🐠' },
  timber: { name: 'Seasoned Timber', icon: '🪵' }, brass: { name: "Ship's Brass", icon: '🔔' }, rope: { name: 'Tarred Rope', icon: '🪢' },
});
Object.assign(Craft.TRAINERS, { hallie: ['fishing'], oldwyn: ['salvaging'], smith6: ['smithing', 'mining', 'jewelcrafting'], weaver6: ['tailoring', 'enchanting', 'leatherworking', 'skinning'], herb6: ['alchemy', 'herbalism', 'cooking'] });
Object.assign(Craft.CONS, {
  chowder: { name: 'Salt Cod Chowder', icon: '🥣', buff: 'fed', data: { hp: .09, pow: .08 }, desc: '+9% health and +8% power for 30 minutes.' },
  eelpie: { name: 'Storm Eel Pie', icon: '🥧', buff: 'fed', data: { hp: .1, pow: .1 }, desc: '+10% health and power for 30 minutes.' },
  glowbroth: { name: 'Glowfin Broth', icon: '✨', buff: 'fed', data: { hp: .08, pow: .13 }, desc: '+8% health and +13% power for 30 minutes.' },
  tidecall: { name: 'Elixir of the Tide', icon: '🌊', buff: 'elixir', data: { hp: .12, pow: .12 }, desc: '+12% health and power for 30 minutes.' },
});

// ---------- what a pool or a wreck gives ----------
Craft.nodeHooks.roll.fish = (n) => {
  const got = [];
  if (world.storm && Math.random() < .5) got.push(['eel', 1]);
  else if (isNight() && Math.random() < .3) got.push(['glowfin', 1]);
  else got.push(['cod', irnd(1, 2)]);
  if (n.req >= 40 && Math.random() < .5) got.push([pick(['cod', 'eel']), 1]);
  if (Math.random() < .07) got.push(['pearl', 1]);
  return got;
};
Craft.nodeHooks.roll.wreck = (n) => {
  const got = [[pick(['timber', 'timber', 'brass', 'rope']), irnd(1, 2)]];
  if (Math.random() < .5) got.push([pick(['brass', 'rope']), 1]);
  if (n.req >= 40 && Math.random() < .2) got.push([pick(['seasilk', 'pearl']), 1]);
  if (Math.random() < .25) { const g = irnd(2, 6) + (n.req >= 40 ? 4 : 0); S.gold += g; chat('loot', null, `You find ${g} old coins in the wreck.`); }
  return got;
};
// quests that ask you to fish or salvage
X.gathered = X.gathered || [];
X.gathered.push((type, got) => {
  const kind = type === 'fish' ? 'fish' : type === 'wreck' ? 'salvage' : null; if (!kind) return;
  for (const q of QUESTS) {
    const st = S.quests[q.id]; if (!st || st.state !== 'active' || q.obj.gather !== kind) continue;
    st.n = Math.min(q.obj.n, st.n + 1); chat('sys', null, `${q.name}: ${st.n}/${q.obj.n}`);
    if (st.n >= q.obj.n) { st.state = 'done'; chat('sys', null, `${q.name}: done! Return to ${GIVERS[q.turnTo || q.giver].name}.`); }
  }
});

// ---------- models ----------
const pool = () => build([...[1.6, 1.1, .6].map((r, i) => P(T(Cyl(r, r, .04, 18), 0, .02 + i * .01), 0, O, i % 2 ? '#7fd0e0' : '#cff4ff', .4)),
  ...[0, 1, 2].map(k => P(T(Sph(.16, 5, 4), Math.cos(k * 2.1) * .8, .25, Math.sin(k * 2.1) * .8, 0, 0, 0, 1.6, .7, .6), 0, O, '#c8d8e0', .3))]);
const roughPool = () => build([...[2, 1.4, .8].map((r, i) => P(T(Cyl(r, r, .05, 18), 0, .02 + i * .01), 0, O, i % 2 ? '#5aa8c8' : '#e8ffff', .5)),
  ...[0, 1, 2, 3].map(k => P(T(Cone(.18, .5, 5), Math.cos(k * 1.6) * 1.1, .2, Math.sin(k * 1.6) * 1.1, .4, k), 0, O, '#ffffff', .6))]);
const wreckBits = () => build([P(T(Box(3.2, .8, 1.4), 0, .3, 0, 0, .3, .25), 0, O, '#5a4030'), ...[-1, 0, 1].map(k => P(T(Box(.2, 1.2, .1), k * .9, .7, .7, .3, 0, k * .2), 0, O, '#6b4a2e')),
  P(T(Cyl(.12, .14, 3.2, 5), 1.4, .7, -.5, 0, 0, 1.2), 0, O, '#4a3322'), P(T(Box(.7, .6, .6), -1.1, .5, -.6, 0, .5), 0, O, '#9a7a4a'), P(T(Cyl(.25, .25, .3, 8), .4, .9, .2), 0, O, '#c8a050', .4)]);
const bigWreck = () => build([P(T(Box(5, 1.6, 2.4), 0, .6, 0, 0, .2, .35), 0, O, '#4a3a2a'), P(T(Box(4.6, .2, 2), 0, 1.5, 0, 0, .2, .35), 0, O, '#6b5030'), P(T(Cyl(.18, .22, 5, 6), .6, 2.6, 0, .35, 0, .5), 0, O, '#3a2a1c'),
  ...[-1.6, -.4, .8, 2].map(x => P(T(Box(.18, 1.8, .14), x, 1.2, 1.2, .4, 0, 0), 0, O, '#5a4030')), P(T(Box(.8, .7, .7), -1.8, .9, -.8), 0, O, '#9a7a4a'), P(T(Sph(.3, 6, 5), 1.6, 1.8, -.4), 0, O, '#c8a050', .6)]);
const salvageBench = () => build([P(T(Box(2.4, .15, 1.1), 0, .95), 0, O, '#6b4a2e'), ...[-1, 1].flatMap(s => [-1, 1].map(t => P(T(Box(.12, .95, .12), s * 1.05, .47, t * .45), 0, O, '#4a3322'))),
  P(T(Box(.8, .5, .6), -.5, 1.27), 0, O, '#c8a050', .3), P(T(Cyl(.15, .15, 1, 6), .6, 1.15, 0, 0, 0, Math.PI / 2), 0, O, '#3a3a40'), P(T(Box(.5, .08, .3), .5, 1.06, .3), 0, O, '#2a2a30')]);
addKinds({ fishpool: [pool(), STILL, 0, .01], fishrough: [roughPool(), STILL, 0, .01], wreckbits: [wreckBits(), STILL, 0, .03], wreckbig: [bigWreck(), STILL, 0, .03], salvage: [salvageBench(), STILL, 0, .03] });
Craft.STATIONS.salvage = { name: 'Salvage Bench', profs: ['smithing', 'leatherworking', 'tailoring'] };

// ---------- placing pools and wrecks ----------
function placeNodes(zone, rng, W, nPool, nRough, nWreck, nBig) {
  const near = (x, z, r) => world.props.some(p => Math.hypot(p.x - x, p.z - z) < r) || (world.clearSpots || []).some(c => Math.hypot(c.x - x, c.z - z) < c.r) || (world.towns || []).some(t => Math.hypot(t.x - x, t.z - z) < (t.R || 20) + 6);
  const shore = (x, z) => [[6, 0], [-6, 0], [0, 6], [0, -6]].some(([a, b]) => hgt(x + a, z + b) > .4);
  const put = (n, test, mk) => { for (let i = 0, made = 0; i < 4000 && made < n; i++) { const x = (rng() * 2 - 1) * W, z = (rng() * 2 - 1) * W; if (!test(x, z) || near(x, z, 14)) continue; world.props.push(mk(x, z, i)); made++; } };
  put(nPool, (x, z) => { const d = depthAt(x, z); return d > .5 && d < 2.5 && shore(x, z); }, (x, z, i) => ({ id: 'f' + zone + i, kind: 'fishpool', tag: 'node', name: 'School of Fish', x, z, y: (world.water ?? 0) + .03, yaw: 0, scale: 1, node: { type: 'fish', req: 1, regrow: 90 } }));
  put(nRough, (x, z) => { const d = depthAt(x, z); return d > 1.2 && d < 4 && shore(x, z) && (zone !== 'coast' || Math.abs(x) < 260 || z < -150 || z > 150); }, (x, z, i) => ({ id: 'fr' + zone + i, kind: 'fishrough', tag: 'node', name: 'Churning Water', x, z, y: (world.water ?? 0) + .03, yaw: 0, scale: 1, node: { type: 'fish', req: 40, regrow: 120 } }));
  put(nWreck, (x, z) => { const h = hgt(x, z); return h > .5 && h < 2.4 && !shore(x + 99, z) && [[5, 0], [-5, 0], [0, 5], [0, -5]].some(([a, b]) => depthAt(x + a, z + b) > .3); }, (x, z, i) => ({ id: 'w' + zone + i, kind: 'wreckbits', tag: 'node', name: 'Washed-Up Wreckage', x, z, yaw: rng() * TAU, scale: 1, node: { type: 'wreck', req: 1, regrow: 160 } }));
  put(nBig, (x, z) => { const h = hgt(x, z); return h > .3 && h < 2 && [[7, 0], [-7, 0], [0, 7], [0, -7]].some(([a, b]) => depthAt(x + a, z + b) > .6); }, (x, z, i) => ({ id: 'wb' + zone + i, kind: 'wreckbig', tag: 'node', name: 'Broken Hull', x, z, yaw: rng() * TAU, scale: 1, node: { type: 'wreck', req: 40, regrow: 220 } }));
}
coastHooks.build.push(({ rng }) => {
  placeNodes('coast', rng, 400, 30, 16, 26, 10);
  // Crookwater's crafting yard: every station the Vale has, plus a salvage bench, and three trainers
  const C = C6.crook, Y = { x: C.x - 6, z: C.z + 12 };
  for (const [k, dx, dz] of [['forge', -5, -3], ['tanrack', -6, 2.5], ['loom', -2, 6], ['alchemy', 3.5, 5.5], ['cookfire', 5.5, 0], ['enchant', 1.5, -5], ['salvage', -1, -1], ['scribe', 4.2, -4.2]])
    world.props.push({ id: 'c6' + k, kind: k, tag: 'station', station: k, name: Craft.STATIONS[k].name, x: Y.x + dx, z: Y.z + dz, yaw: Math.atan2(-dx, -dz), scale: 1 });
  world.storyNpcs.push({ key: 'smith6', x: Y.x - 3, z: Y.z - 1, yaw: Math.PI / 3 }, { key: 'weaver6', x: Y.x - 4, z: Y.z + 5, yaw: Math.PI * .8 }, { key: 'herb6', x: Y.x + 5, z: Y.z + 3, yaw: -Math.PI * .7 });
  world.extraPlaces.push({ name: "Crookwater's Workyard", x: Y.x, z: Y.z, R: 7, kind: 'site' });
});
Object.assign(GIVERS, {
  smith6: { name: 'Gilly Rivet', title: 'Smithing, Mining, Jewelcrafting', model: 'villager0' },
  weaver6: { name: 'Patch', title: 'Tailoring, Enchanting, Leather, Skinning', model: 'villager3' },
  herb6: { name: 'Auntie Brack', title: 'Alchemy, Herbalism, Cooking', model: 'villager1' },
});
Object.assign(TALK, {
  smith6: { bio: "Gilly Rivet was a ship's smith until her ship sank. She swam ashore with her hammer in her teeth, and she has not let go of it since.", greet: ["Brass from the wrecks, iron from the hills. Bring me both and I'll make you something the navy would steal.", "Mind the sparks. Mind the anvil. Mostly mind the sparks."], topics: [] },
  weaver6: { bio: "Nobody in Crookwater knows Patch's real name. She stitches sails, mends coats, and puts a little magic in the seams when nobody's looking.", greet: ["Hold still. You've a hole in your sleeve the size of a cat.", "Rope, silk, leather and spite. That's all you need to make anything."], topics: [] },
  herb6: { bio: "Auntie Brack feeds Crookwater, doses Crookwater and occasionally scolds Crookwater, all from the same pot.", greet: ["Chowder's on. Potions are on the other fire. Don't mix them up again.", "Kelp, cod and a bit of patience. That's the coast's whole cookbook."], topics: [] },
});

// ---------- recipes ----------
const add = Craft.addRecipe;
add('chowder', 'cooking', 'Salt Cod Chowder', 40, { cod: 3, kelpbloom: 1 }, { cons: 'chowder', n: 2 });
add('eelpie', 'cooking', 'Storm Eel Pie', 60, { eel: 2, meat: 1 }, { cons: 'eelpie', n: 2 });
add('glowbroth', 'cooking', 'Glowfin Broth', 75, { glowfin: 1, cod: 2 }, { cons: 'glowbroth', n: 2 });
for (const [slot, nm, n] of [['head', 'Helm', 4], ['chest', 'Breastplate', 6], ['legs', 'Greaves', 5], ['feet', 'Sabatons', 4]]) add('salt' + slot, 'smithing', `Saltforged ${nm}`, 55 + (slot === 'chest' ? 4 : 0), { iron: n, brass: 2 }, { slot, armor: 'plate', lvl: 13 });
add('saltwpn', 'smithing', 'Saltforged Weapon (for your class)', 62, { iron: 6, brass: 3, timber: 2 }, { slot: 'weapon', weapon: true, lvl: 13 });
add('saltoff', 'smithing', 'Saltforged Off-hand (for your class)', 64, { iron: 4, brass: 2, timber: 1 }, { slot: 'off', off: true, lvl: 13 });
for (const [slot, nm, n] of [['head', 'Hood', 4], ['chest', 'Jerkin', 6], ['legs', 'Leggings', 5], ['feet', 'Boots', 4]]) add('rig' + slot, 'leatherworking', `Rigger's ${nm}`, 55 + (slot === 'chest' ? 4 : 0), { thickhide: n, rope: 2 }, { slot, armor: 'leather', lvl: 13 });
for (const [slot, nm, n] of [['head', 'Cowl', 4], ['chest', 'Robe', 6], ['legs', 'Trousers', 5], ['feet', 'Slippers', 4]]) add('sail' + slot, 'tailoring', `Sailcloth ${nm}`, 55 + (slot === 'chest' ? 4 : 0), { wool: n, rope: 2 }, { slot, armor: 'cloth', lvl: 13 });
add('brassring', 'jewelcrafting', 'Brass-Bound Pearl Ring', 58, { brass: 3, pearl: 1 }, { slot: 'ring', jewel: true, lvl: 13 });
add('brassneck', 'jewelcrafting', 'Compass Pendant', 62, { brass: 3, moonstone: 1, pearl: 1 }, { slot: 'neck', jewel: true, lvl: 13 });
add('ench6a', 'enchanting', 'Enchant Feet: Sea Legs', 50, { dust: 6, shard: 1, rope: 1 }, { ench: 'sta', n: 7, slot: 'feet' });
add('ench6b', 'enchanting', 'Enchant Head: Lamplight', 60, { dust: 6, shard: 2, brass: 1 }, { ench: 'pow', n: 6, slot: 'head' });
// rare recipes: from the coast's dungeon bosses
add('wreckblade', 'smithing', "Wreck-Queen's Weapon (for your class)", 60, { iron: 8, brass: 4, garnet: 1 }, { slot: 'weapon', weapon: true, lvl: 12, rar: 3 }, 'teeth');
add('lampcoat', 'leatherworking', "Lamplighter's Coat", 55, { thickhide: 7, rope: 3 }, { slot: 'chest', armor: 'leather', lvl: 12, rar: 3 }, 'teeth');
add('tidecall', 'alchemy', 'Elixir of the Tide', 60, { kelpbloom: 3, glowfin: 1, bonedust: 1 }, { cons: 'tidecall', n: 2 }, 'shrine');
add('tiderobe', 'tailoring', 'Tide-Chanter\'s Robe', 60, { wool: 6, seasilk: 2, pearl: 1 }, { slot: 'chest', armor: 'cloth', lvl: 12, rar: 3 }, 'shrine');
add('admiralplate', 'smithing', 'Admiralty Breastplate', 70, { silver: 6, brass: 4, pearl: 1 }, { slot: 'chest', armor: 'plate', lvl: 15, rar: 3 }, 'brinevaults');
add('veyring', 'jewelcrafting', "Commodore's Signet", 70, { silver: 3, brass: 2, pearl: 2 }, { slot: 'ring', jewel: true, lvl: 15, rar: 3 }, 'brinevaults');
add('whalering', 'jewelcrafting', 'Whalebone Pendant', 72, { pearl: 3, brass: 2, shard: 2 }, { slot: 'neck', jewel: true, lvl: 15, rar: 3 }, 'bonewhale');
add('whalewpn', 'smithing', 'Harpoon-Steel Weapon (for your class)', 75, { silver: 8, timber: 3, rope: 2 }, { slot: 'weapon', weapon: true, lvl: 15, rar: 3 }, 'bonewhale');
