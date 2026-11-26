// Stars Beneath, Build 1: the Second Chance (a ship you walk around in), her helm and star map, the first jump,
// Halfway Station at the other end of it, and the crew you sign on along the way.
import * as THREE from './three.js';
import { S, X, chat, TAU } from './core.js';
import { GIVERS, CLASSES } from './data.js';
import { TALK, VILLAGER_LINES } from './dialogue.js';
import { build, P, T, Box, Cyl, Oct, Sph } from './models.js';
import { world, hgt, registerZone, mat4, mergeBuilt, meshWithOutline } from './world.js';
import { buildInstance } from './dungeons.js';
import * as Cb from './combat.js';
import * as Game from './game.js';
import * as UI from './ui.js';
import { openAH } from './social6.js';
import { D1, crateGeo, consoleGeo, lampGeo, shipGeo } from './moon1.js';
import { addKinds } from './render.js';
const O = [0, 0, 0];

// ---------- where the ship can go ----------
export const SYSTEMS = {
  moon: { name: 'Dustfall', sub: 'Frontier colony moon', zone: 'moon', x: .2, y: .72, info: 'One port, one cantina and no questions. Home, for now.' },
  halfway: { name: 'Halfway Station', sub: 'Free port', zone: 'halfway', x: .47, y: .5, info: 'A fuel depot that grew a market. Everyone trades here, because nobody can agree on who gets to blow it up.' },
  sarn: { name: 'The Lamp of Sarn', sub: 'No star on the current tables', x: .82, y: .2, dark: true, info: "The core's old chart marks a star here in red. The scope shows nothing but a cold spot. The core will not plot a jump to it. Not yet." },
  core1: { name: 'Republic space', sub: 'Lanes closed to unregistered ships', x: .7, y: .78, locked: true, info: 'The Republic checks papers at every lane. The Second Chance has none.' },
  core2: { name: 'Imperial space', sub: 'Lanes closed to unregistered ships', x: .3, y: .16, locked: true, info: 'The Empire does not check papers. It checks ships, and keeps the ones it likes.' },
};
export const LANES = [['moon', 'halfway'], ['halfway', 'sunder'], ['halfway', 'core1'], ['halfway', 'core2'], ['halfway', 'sarn']];
export const PADS = { moon: { x: D1.pad.x, z: D1.pad.z + 17 } };   // where you stand after walking down the ramp
const open = s => s && s.zone && (!s.need || s.need());
export const here = () => SYSTEMS[S.ext?.sys] ? S.ext.sys : 'moon';
X.noFakes = ['ship', 'halfway'];
X.gate = X.gate || {};
X.gate.ship = () => S.flags.ship ? null : 'The ramp is locked. A port impound seal blinks on the hatch.';
X.arrive = (zone, from) => {
  if (zone === 'ship') return { x: 0, z: 60 };
  if (from === 'ship' && PADS[zone]) return { ...PADS[zone] };
  if (zone === 'halfway') return { x: 0, z: 60 };
  return null;
};

// ---------- interiors ----------
const panelGeo = (len, col, strip) => build([P(T(Box(len, 3.4, .35), 0, 1.7), 0, O, col), P(T(Box(len, .12, .4), 0, 2.6), 0, O, strip, 1.6), P(T(Box(len, .3, .45), 0, .15), 0, O, '#2a2e34')]);
// metal bulkheads along every wall the instance builder laid down
function bulkheads(col, strip) {
  const items = [];
  for (const w of world.walls) { const len = Math.hypot(w.x2 - w.x1, w.z2 - w.z1); if (len < .5) continue; items.push({ geo: panelGeo(len + .3, col, strip), m: mat4((w.x1 + w.x2) / 2, 0, (w.z1 + w.z2) / 2, Math.atan2(-(w.z2 - w.z1), w.x2 - w.x1)) }); }
  return items;
}
const bunkGeo = () => build([P(T(Box(1.1, .4, 2.2), 0, .5), 0, O, '#4a5560'), P(T(Box(1, .16, 2), 0, .78), 0, O, '#8a6a4a'), P(T(Box(1.1, .4, 2.2), 0, 1.9), 0, O, '#4a5560'), P(T(Box(1, .16, 2), 0, 2.18), 0, O, '#6a8a9a'), ...[-1, 1].map(s => P(T(Box(.1, 2.2, .1), .5, 1.1, s), 0, O, '#3a3e44'))]);
const tableGeo = () => build([P(T(Cyl(1.3, 1.3, .12, 10), 0, .9), 0, O, '#5a6068'), P(T(Cyl(.2, .4, .9, 6), 0, .45), 0, O, '#3a3e44'), P(T(Oct(.18), 0, 1.15), 0, O, '#8dffef', 1.8)]);
const engineGeo = () => build([P(T(Cyl(1.6, 1.6, 3, 10), 0, 1.5), 0, O, '#4a5058'), P(T(Cyl(1.1, 1.1, 3.1, 10), 0, 1.5), 0, O, '#6ad8ff', 1.6), P(T(Box(3.6, .3, 3.6), 0, .15), 0, O, '#3a3e44'), P(T(Box(3.6, .3, 3.6), 0, 3.1), 0, O, '#3a3e44')]);
const chairGeo = () => build([P(T(Box(.8, .2, .8), 0, .6), 0, O, '#5a4a3a'), P(T(Box(.8, 1.1, .16), 0, 1.15, -.36), 0, O, '#5a4a3a'), P(T(Cyl(.12, .3, .6, 5), 0, .3), 0, O, '#3a3e44')]);
const viewGeo = () => build([P(T(Box(11, 2.6, .2), 0, 2.2), 0, O, '#0a1020'), ...Array.from({ length: 40 }, (_, i) => P(T(Box(.07, .07, .05), ((i * 7919) % 100) / 10 - 5, 1.2 + ((i * 104729) % 22) / 10, .12), 0, O, '#ffffff', 2.4))]);
const stallGeo = col => build([P(T(Box(3.4, 1, 1.4), 0, .5), 0, O, '#4a5058'), P(T(Box(3.6, .12, 2), 0, 2.7), 0, O, col), ...[-1, 1].map(s => P(T(Cyl(.07, .07, 2.7, 4), 1.6 * s, 1.35, .6), 0, O, '#3a3e44')), P(T(Box(.5, .4, .5), -.8, 1.2), 0, O, '#c8782a'), P(T(Sph(.25, 6, 5), .6, 1.25), 0, O, '#8dffef', 1)]);
const sealGeo = () => build([P(T(Box(5.6, 3.6, .4), 0, 1.8), 0, O, '#3a3e44'), P(T(Box(5.8, .3, .5), 0, 1.8), 0, O, '#e8b83a', 1), P(T(Box(.5, .5, .5), 0, 1.8, .2), 0, O, '#ff3a2a', 2.4)]);
addKinds({ helm: [build([P(T(Box(2.4, 1, .8), 0, .5), 0, O, '#3a4450'), P(T(Box(2.2, .9, .08), 0, 1.5, .1, -.45), 0, O, '#6ad8ff', 1.8), P(T(Sph(.3, 8, 6), 0, 1.25, .1), 0, O, '#ffcf6a', 2)]), [0, 0, 0, 0], 0, .03],
  locker: [build([P(T(Box(1.6, 2.2, .7), 0, 1.1), 0, O, '#4a5560'), P(T(Box(.7, 2, .06), -.4, 1.1, .36), 0, O, '#5a6a78'), P(T(Box(.7, 2, .06), .4, 1.1, .36), 0, O, '#5a6a78'), P(T(Box(.12, .12, .1), 0, 1.2, .4), 0, O, '#9be36b', 2)]), [0, 0, 0, 0], 0, .03],
  bunk: [bunkGeo(), [0, 0, 0, 0], 0, .03] });

registerZone('ship', seed => {
  world.names = { zone: 'The Second Chance', town: 'the Second Chance' };
  const w = buildInstance(seed, { name: 'The Second Chance', floor: '#565c64', rock: '#12151b', walls: false, fog: '#0c1018', light: 1.05, noMarker: true, exitTo: SYSTEMS[here()].zone, exitLabel: 'Down the ramp',
    rects: [[-6, 52, 6, 72], [-2, 36, 2, 52], [-8, 16, 8, 36], [-18, 20, -8, 32], [8, 20, 18, 32], [-2, 6, 2, 16], [-8, -8, 8, 6]],
    doors: [[0, 52], [0, 36], [-8, 26], [8, 26], [0, 16], [0, 6]], props: [], packs: [], bosses: [] });
  const items = bulkheads('#6a727c', '#ffcf6a'), put = (geo, x, z, ry = 0, s = 1) => items.push({ geo, m: mat4(x, 0, z, ry, s) });
  for (const [x, z] of [[-4, 66], [-4.5, 63], [4, 67], [4.2, 64.5], [3.6, 56]]) put(crateGeo(), x, z, x * .7, 1.1);
  put(tableGeo(), 0, 27); for (let k = 0; k < 4; k++) put(chairGeo(), Math.sin(k * TAU / 4 + .8) * 2.2, 27 + Math.cos(k * TAU / 4 + .8) * 2.2, k * TAU / 4 + .8 + Math.PI);
  put(bunkGeo(), -15, 30); put(engineGeo(), 14, 26); put(consoleGeo(), 10.5, 21.5, Math.PI / 2);
  put(viewGeo(), 0, -7.6); for (const s of [-1, 1]) { put(chairGeo(), 3 * s, -2.5, Math.PI); put(consoleGeo(), 6.6 * s, 0, -Math.PI / 2 * s); }
  for (const [x, z] of [[0, 44], [0, 11], [-5, 33], [5, 19]]) put(build([P(T(Box(.6, .1, .6), 0, 3.3), 0, O, '#ffe0a0', 2)]), x, z);
  meshWithOutline(mergeBuilt(items), .04);
  world.town = { x: 0, z: 26, R: 6 };
  world.places = [{ name: 'The Second Chance', x: 0, z: 30, R: 44, kind: 'town' }];
  world.regionNames = ['Aboard the Second Chance'];
  Object.assign(world.spots, { bridge: { x: 0, z: -2 }, hold: { x: 0, z: 62 } });
  return w;
});

registerZone('halfway', seed => {
  world.names = { zone: 'Halfway Station', town: 'Halfway Station' };
  const w = buildInstance(seed, { name: 'Halfway Station', floor: '#4e5660', rock: '#0e1118', walls: false, fog: '#101624', light: 1.0, noMarker: true, exitTo: 'ship', exitLabel: 'Back aboard the Second Chance',
    rects: [[-8, 48, 8, 74], [-4, 30, 4, 48], [-30, 2, 30, 30], [-30, -18, -12, 2], [12, -18, 30, 2], [-4, -6, 4, 2]],
    doors: [[0, 48], [0, 30], [-20, 2], [20, 2], [0, 2]], props: [], packs: [], bosses: [] });
  const items = bulkheads('#5a6470', '#6ad8ff'), put = (geo, x, z, ry = 0, s = 1) => items.push({ geo, m: mat4(x, 0, z, ry, s) });
  put(shipGeo(), 0, 86, 0, .9);                                     // the Second Chance, nose out, through the lock
  for (const [x, z, c] of [[-22, 24, '#c8782a'], [-12, 26, '#5a8a4a'], [12, 26, '#8a3a6a'], [22, 24, '#2e5a9e'], [-22, 6, '#c8b83a'], [22, 6, '#3a8a8a']]) put(stallGeo(c), x, z, z > 20 ? Math.PI : 0);
  for (const [x, z] of [[-24, -10], [-18, -12], [18, -10], [24, -13], [20, -4]]) { put(tableGeo(), x, z); put(chairGeo(), x + 2, z, -Math.PI / 2); put(chairGeo(), x - 2, z, Math.PI / 2); }
  put(sealGeo(), 0, -5.6); for (const [x, z] of [[-6, 70], [6, 70], [-6, 52], [6, 52], [-14, 15], [14, 15], [0, 15]]) put(lampGeo(), x, z);
  for (let k = 0; k < 8; k++) put(crateGeo(), -6 + (k % 4) * .1 + (k < 4 ? 0 : 11.5), 56 + (k % 4) * 3, k, 1.1);
  meshWithOutline(mergeBuilt(items), .04);
  world.town = { x: 0, z: 16, R: 30 };
  world.towns = [{ key: 'halfway', name: 'Halfway Station', x: 0, z: 16, R: 30, guardName: 'Station Security', npcs: [['giver', 'imre', 4, 36], ['vendor', 'half', -22, 6], ['bind', null, 8, 8]], guards: [[-3, 16], [3, 16], [-26, -4], [26, -4]] }];
  world.places = [{ name: 'Lock Six', x: 0, z: 60, R: 12, kind: 'town' }, { name: 'The Concourse', x: 0, z: 16, R: 16, kind: 'town' }, { name: 'The Market Arm', x: -21, z: -8, R: 9, kind: 'town' }, { name: 'The Halfway House', x: 21, z: -8, R: 9, kind: 'town' }, { name: 'Sealed lock', x: 0, z: -4, R: 4, kind: 'dungeon' }];
  world.regionNames = ['Halfway Station'];
  Object.assign(world.spots, { dock: { x: 0, z: 56 }, concourse: { x: 0, z: 16 } });
  return w;
});
const IDLERS = [['Republic Clerk', 'n_clerk', -6, 22, "Papers, please. I'm joking, of course. I'm off duty. I would still quite like to see your papers."], ['Imperial Attaché', 'n_officer', 7, 21, "The Empire wishes the free captains nothing but prosperity. It also wishes to know where each of them is at all times, purely out of warmth."],
  ['Hauler Captain', 'pirate2', 20, -8, "I've flown the Sarn run for twenty years, and I won't fly it again. I can't tell you why. I looked out the port one night and I just knew I shouldn't be there."], ['Scrap Merchant', 'villager1', -22, 22, "Everything on this stall fell off a ship. Some of it fell off while the ship was still using it, which is why it's so reasonably priced."],
  ['Off-shift Docker', 'villager0', 18, -11, "Lock four's been sealed a month now. They say it's a pressure fault. I've fixed pressure faults, and they don't generally need six guards."], ['Wandering Preacher', 'priest', -3, 8, "The old words were never a curse, friend, they were a count. 'When the last lamp falls.' Somebody was counting them, even then. I wonder how many are left."]];
for (const [n, , , , line] of IDLERS) VILLAGER_LINES[n] = line;

// ---------- the helm and the star map ----------
Object.assign(GIVERS, { helm: { name: 'Helm', title: 'Helm and star map', model: 'helm' },
  auct3: { name: 'Odalys Finch', title: 'Halfway Exchange', model: 'villager1' }, reg3: { name: 'Registrar Pell-Ames', title: 'Crew and guild charters', model: 'villager2' }, bank3: { name: 'Teller Unit Nine', title: 'Halfway Vaults', model: 'sdrone' } });
Object.assign(TALK, {
  helm: { bio: "The Second Chance's helm has been rebuilt so many times that only the brass compass rose in the middle is original. Tilly says the ship was built around the nav core. The helm seems to agree, and hums when you put a hand on it.", greet: ['The console wakes under your hand. A map of small, patient lights unfolds above it.'], topics: [] },
  vault: { bio: 'A strongbox welded to the deck in the hold. Osric scratched a tally on the door: nineteen marks, each one a time somebody tried to open it who should not have.', greet: ['The vault hums and unlocks at your touch.'], topics: [] },
});
Object.assign(TALK, {
  auct3: { bio: "Odalys Finch runs the Halfway Exchange from a booth with three screens and one rule: everything has a price, and she already knows it. She has sold the same crate of fuses eleven times and bought it back ten.", greet: ["Welcome to the Exchange. Buying or selling? Do say both, because both is where I make my living.", "Power cells are up, hull plate is down, and somebody keeps paying silly money for old star charts. I'd love to know why."], topics: [] },
  reg3: { bio: "Registrar Pell-Ames charters every crew and guild that flies out of Halfway, and files each one under the name it gave and the name it deserves. The second list is longer and much funnier.", greet: ["Charters, rosters and disputes. Take a number. You're the only one here, so the number is one.", "A guild is only a crew that has learned to argue in writing. Which will it be today?"], topics: [] },
  bank3: { bio: "Teller Unit Nine has guarded the Halfway Vaults for a hundred and forty years without a single loss, a single holiday or a single joke. Units One through Eight are not discussed.", greet: ['WELCOME, DEPOSITOR. YOUR VALUABLES ARE SAFE. YOUR VALUABLES HAVE ALWAYS BEEN SAFE.', 'UNIT NINE IS PLEASED TO SEE YOU. THIS IS A FIGURE OF SPEECH.'], topics: [] },
});
X.talk.push((k, n, api) => k === 'helm' ? [['▸ Open the star map.', () => { api.close(); openStarMap(); }, 'hl']] : k === 'auct3' ? [["▸ I'd like to see the Exchange.", () => { api.close(); openAH(n); }, 'hl']] : k === 'reg3' ? [["▸ I'm here about guilds.", () => { api.close(); UI.openBook('guild'); }, 'hl']] : null);

function mapCanvas(sel) {
  const c = document.createElement('canvas'); c.width = 600; c.height = 380; c.style.cssText = 'width:100%;border-radius:10px;background:#070b14;touch-action:manipulation';
  const g = c.getContext('2d'), px = s => [s.x * 600, s.y * 380];
  for (let i = 0; i < 140; i++) { g.fillStyle = `rgba(255,255,255,${.15 + ((i * 37) % 10) / 22})`; g.fillRect((i * 7919) % 600, (i * 104729) % 380, 1.5, 1.5); }
  g.lineWidth = 1.5;
  for (const [a, b] of LANES) { const A = SYSTEMS[a], B = SYSTEMS[b]; if (!A || !B) continue; const open = !A.locked && !B.locked && !A.dark && !B.dark && (!A.need || A.need()) && (!B.need || B.need()); g.strokeStyle = open ? 'rgba(106,216,255,.7)' : 'rgba(160,170,190,.25)'; g.setLineDash(open ? [] : [5, 6]); g.beginPath(); g.moveTo(...px(A)); g.lineTo(...px(B)); g.stroke(); }
  g.setLineDash([]);
  for (const [k, s] of Object.entries(SYSTEMS)) { const [x, y] = px(s);
    if (s.dark) { g.strokeStyle = '#ff3a2a'; g.lineWidth = 2; g.beginPath(); g.arc(x, y, 9, 0, TAU); g.stroke(); g.fillStyle = '#070b14'; g.beginPath(); g.arc(x, y, 7, 0, TAU); g.fill(); }
    else { g.fillStyle = s.locked || (s.need && !s.need()) ? '#7a8496' : '#ffe0a0'; g.beginPath(); g.arc(x, y, s.locked ? 5 : 7, 0, TAU); g.fill(); }
    if (k === here()) { g.strokeStyle = '#9be36b'; g.lineWidth = 2; g.beginPath(); g.arc(x, y, 13, 0, TAU); g.stroke(); }
    if (k === sel) { g.strokeStyle = '#ffffff'; g.lineWidth = 1.5; g.strokeRect(x - 17, y - 17, 34, 34); }
    g.fillStyle = s.dark ? '#ff8a7a' : s.locked ? '#9aa4b6' : '#eee4cc'; g.font = '600 15px sans-serif'; g.textAlign = 'center'; g.fillText(s.name, x, y + 31); }
  return c;
}
export function openStarMap() {
  let sel = here();
  UI.openSheet('Star map', body => {
    const c = mapCanvas(sel); body.appendChild(c);
    c.onclick = ev => { const r = c.getBoundingClientRect(), mx = (ev.clientX - r.left) / r.width, my = (ev.clientY - r.top) / r.height; let best = null, bd = .12; for (const [k, s] of Object.entries(SYSTEMS)) { const d = Math.hypot(s.x - mx, (s.y - my) * .63); if (d < bd) { bd = d; best = k; } } if (best) { sel = best; UI.refreshSheet(); } };
    const s = SYSTEMS[sel], card = document.createElement('div'); card.className = 'card'; card.style.textAlign = 'left';
    card.innerHTML = `<h3 style="margin:0">${s.name}</h3><p class="dim" style="margin:2px 0 6px">${s.sub}${sel === here() ? ' · you are here' : ''}</p><p style="margin:0 0 8px">${s.info}</p>`;
    const linked = LANES.some(([a, b]) => (a === here() && b === sel) || (b === here() && a === sel));
    if (sel !== here() && s.zone && linked && s.need && !s.need()) { const p = document.createElement('p'); p.className = 'dim'; p.style.margin = '0'; p.textContent = s.why || 'The core has no fix for this lane yet.'; card.appendChild(p); }
    else if (sel !== here() && s.zone && linked) { const b = document.createElement('button'); b.className = 'pri'; b.textContent = `Jump to ${s.name}`; b.style.width = '100%'; b.onclick = () => { UI.closeSheet(); jump(sel); }; card.appendChild(b); }
    body.appendChild(card);
  });
}
export function jump(to) {
  if (S.zone !== 'ship' || !open(SYSTEMS[to]) || to === here()) return;
  if (X.jumpEvent && X.jumpEvent(to, () => arrive(to))) return;     // Build 2: a jump can be broken on the way
  arrive(to);
}
function arrive(to) {
  if (S.zone !== 'ship' || !SYSTEMS[to]?.zone || to === here()) return;
  X.flightEnd?.();
  const from = SYSTEMS[here()].name;
  S.ext.sys = to; S.ext.jumps = (S.ext.jumps || 0) + 1;
  for (const z of world.zoneLines) { z.to = SYSTEMS[to].zone; z.label = `Down the ramp to ${SYSTEMS[to].name}`; }
  const ov = document.createElement('div'); ov.id = 'jumpfx'; ov.innerHTML = '<i></i><b>' + SYSTEMS[to].name + '</b>'; document.body.appendChild(ov);
  setTimeout(() => ov.classList.add('out'), 2300); setTimeout(() => ov.remove(), 3100);
  S.shake = .6;
  chat('sys', null, `The Second Chance leaves ${from}. The stars stretch, hold, and snap back around ${SYSTEMS[to].name}.`);
  const crew = S.party.find(p => p.fake?.bff); if (crew) setTimeout(() => chat('party', crew.name, S.ext.jumps === 1 ? "First jump on a two-year-cold core, and we're all still the right way out. I'm calling that a good omen." : 'Clean jump, Captain.'), 2600);
  Game.save();
}

// ---------- crew: one signs on every five levels ----------
export const CREW = { juno: { name: 'Juno Tak', pal: 1, flag: 'crew1', hi: "Juno Tak, signing on. Point me at whatever's broken, Captain, and that includes people." } };
X.recruit = key => {
  const c = CREW[key]; if (!c || S.flags[c.flag]) return;
  const role = CLASSES[S.heroCls].role, cls = c.pick ? c.pick(role) : role === 'healer' ? 'bulwark' : 'cleric';   // each fills a job the captain does not
  S.flags[c.flag] = key; S.friends = S.friends || []; S.friends.push({ name: c.name, pal: c.pal, persona: 'friendly', cls });
  const f = Game.addMate({ name: c.name, cls, lvl: S.hero.lvl, pal: c.pal, persona: 'friendly', guild: null, friend: true, bff: true }, S.hero);
  chat('sys', null, `${c.name} joins your crew.`); chat('party', f.name, c.hi);
  Game.storyFolk(); Game.save();
};

// ---------- what lives aboard, and on the station ----------
X.zone.push(zone => {
  const npc = o => { const e = Cb.makeEnt({ team: 'npc', maxHp: 1, hp: 1, ...o }); e.y = hgt(e.x, e.z); return e; };
  if (zone === 'moon') { if (!S.ext.sys || S.ext.sys !== 'moon') S.ext.sys = 'moon'; if (!S.bind) S.bind = { zone: 'moon', x: D1.port.x + 5, z: D1.port.z + 7.5 }; }
  if (zone === 'halfway') { S.npcs.auct3 = npc({ name: GIVERS.auct3.name, title: GIVERS.auct3.title, kind: 'villager1', x: -12, z: 22, giver: 'auct3' }); S.npcs.reg3 = npc({ name: GIVERS.reg3.name, title: GIVERS.reg3.title, kind: 'villager2', x: 12, z: 22, giver: 'reg3' });
    npc({ name: GIVERS.bank3.name, title: GIVERS.bank3.title, kind: 'sdrone', x: 22, z: 10, banker: true, tk: 'bank3' }).yaw = -Math.PI / 2; }
  if (zone === 'halfway') { S.ext.sys = 'halfway'; for (const [name, kind, x, z] of IDLERS) { const e = npc({ name, title: 'Halfway Station', kind, x, z }); e.yaw = Math.atan2(-x, 16 - z); } }
  if (zone === 'ship') {
    for (const z of world.zoneLines) { z.to = SYSTEMS[here()].zone; z.label = `Down the ramp to ${SYSTEMS[here()].name}`; }
    S.npcs.helm = npc({ name: 'Helm', title: 'Star map', kind: 'helm', x: 0, z: -5, giver: 'helm' }); S.npcs.helm.yaw = 0;
    npc({ name: "Ship's Vault", title: 'Your vault', kind: 'locker', x: -5.2, z: 58, banker: true, tk: 'vault' }).yaw = Math.PI / 2;
    npc({ name: 'Your Bunk', title: 'Set your recovery point here', kind: 'bunk', x: -15, z: 22, bindstone: true });
    if (!S.ext.boarded) { S.ext.boarded = 1; chat('sys', null, 'The hold smells of machine oil and old coffee. Somebody has left the lights on for you.'); }
  }
});
