// Build 4: the Vale's story places. The graveyard, Little Hollin, Corwin's tower, the Pale Choir's camps,
// and the creatures that live around them. Runs inside the Vale generator through valeHooks.
import * as THREE from './three.js';
import { WH, TAU } from './core.js';
import { world, H, HN, hgt, addWall, valeHooks, mat4, meshWithOutline, mergeBuilt, campVisual } from './world.js';
import * as M from './models.js';
import * as VM from './valemodels.js';

const SP = {
  graveyard: { x: 28, z: -50 }, drag: { x: -46, z: -64 }, hollin: { x: -196, z: 66 }, choircamp: { x: -150, z: 118 }, shrine: { x: -150, z: 26 },
  spiders: { x: -212, z: 126 }, tower: { x: -178, z: -172 }, crag: { x: -228, z: -208 }, deacon: { x: 112, z: -178 }, gristle: { x: 64, z: -160 }, waste: { x: -30, z: -150 },
};
const FLAT = [['graveyard', 12], ['hollin', 28], ['tower', 14], ['choircamp', 9], ['deacon', 10], ['shrine', 6]];
const smooth = t => t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t);

valeHooks.terrain = ({ town, ruin }) => {
  Object.assign(world.spots, JSON.parse(JSON.stringify(SP)), { town: { x: town.x, z: town.z }, ruin: { x: ruin.x, z: ruin.z + ruin.R - 8 }, crypt: { x: ruin.x, z: ruin.z - 21 } });
  // level the ground where people live
  for (const [k, r] of FLAT) {
    const c = SP[k], base = hgt(c.x, c.z), R = r + 12;
    for (let zi = Math.max(0, Math.floor(c.z - R + WH)); zi <= Math.min(HN - 1, Math.ceil(c.z + R + WH)); zi++)
      for (let xi = Math.max(0, Math.floor(c.x - R + WH)); xi <= Math.min(HN - 1, Math.ceil(c.x + R + WH)); xi++) {
        const d = Math.hypot(xi - WH - c.x, zi - WH - c.z), k2 = smooth((d - r) / 12), i = zi * HN + xi;
        H[i] = base + (H[i] - base) * k2;
      }
  }
};

valeHooks.build = ({ rng, town, ruin, put }) => {
  const items = [], S = world.spots, yAt = (x, z) => hgt(x, z);
  const place = (geo, x, z, ry = 0, s = 1) => items.push({ geo, m: mat4(x, yAt(x, z), z, ry, s) });
  const prop = (kind, tag, name, x, z, o = {}) => world.props.push({ id: 'p' + world.props.length, kind, tag, name, x, z, yaw: o.yaw ?? rng() * TAU, lore: o.lore || null, scale: o.scale || 1 });
  const lore = (id, x, z) => prop('lorebook', 'lore', 'An old page', x, z, { lore: id, yaw: 0 });
  const npc = (key, x, z, o = {}) => world.storyNpcs.push({ key, x, z, ...o });
  const clear = (k, r) => world.clearSpots.push({ x: S[k].x, z: S[k].z, r });

  // ---------- the graveyard outside the north gate ----------
  { const g = S.graveyard; clear('graveyard', 13);
    for (let k = 0; k < 4; k++) { const a = k * Math.PI / 2, len = 18;
      const cx = g.x + Math.cos(a) * 9, cz = g.z + Math.sin(a) * 9;
      items.push({ geo: M.build([M.P(M.T(M.Box(len, .12, .12), 0, .8), 0, [0, 0, 0], '#5a4a3a'), M.P(M.T(M.Box(len, .12, .12), 0, .4), 0, [0, 0, 0], '#5a4a3a'), ...[-8, -4, 0, 4, 8].map(x => M.P(M.T(M.Box(.16, 1.1, .16), x, .55), 0, [0, 0, 0], '#4a3a2a'))]), m: mat4(cx, yAt(cx, cz), cz, a + Math.PI / 2) });
    }
    const up = VM.headstoneGeo(false);
    for (let i = 0; i < 12; i++) { const x = g.x - 6 + (i % 4) * 4, z = g.z - 5 + Math.floor(i / 4) * 4.5; if ([1, 6, 9].includes(i)) continue; place(up, x, z, Math.PI, .9); }
    [[g.x - 2, g.z - 5], [g.x + 6, g.z + 4], [g.x - 6, g.z + 4]].forEach(([x, z]) => prop('opengrave', 'grave', 'Open Grave', x, z, { yaw: Math.PI }));
    [[g.x + 2, g.z - 5], [g.x + 6, g.z - 1], [g.x - 2, g.z + 4], [g.x - 6, g.z - 1]].forEach(([x, z]) => prop('headstone', 'headstone', 'Fallen Headstone', x, z, { yaw: rng() * TAU }));
    lore('ledger', g.x + 8, g.z - 7);
    npc('wick', g.x + 1.5, g.z + 7.5, { yaw: Math.PI });
    world.extraPlaces.push({ name: 'The Old Graveyard', x: g.x, z: g.z, R: 10, kind: 'site' });
  }
  // the drag marks and the law in town
  lore('drag', S.drag.x + 1.5, S.drag.z);
  { const b = town.npcs.bind; lore('law', town.x + b.x + 2.8, town.z + b.z); const v = town.npcs.vendor; npc('banker', town.x + v.x - 3, town.z + v.z + 1.5, { yaw: Math.PI }); }
  lore('dedication', S.ruin.x + 4, S.ruin.z);
  { const c = world.camps.find(c => c.kind === 'orc'); if (c) lore('warchant', c.x + 6, c.z + 3); const b = world.camps.find(c => c.kind === 'bandit'); if (b) lore('bounty', b.x + 6, b.z + 3); }

  // ---------- Little Hollin, the haunted village ----------
  { const h = S.hollin; clear('hollin', 30);
    const hg = M.houseGeo('human');
    const houses = [[-12, -10, .4], [12, -12, -.5], [-14, 9, 2.6], [14, 10, 3.6], [0, 15, 3.14]];
    for (const [dx, dz, r] of houses) { place(hg, h.x + dx, h.z + dz, r, .75); soft(h.x + dx, h.z + dz, 1.8); }
    const ch = { x: h.x + 8, z: h.z - 16 }; S.chapel = ch; place(VM.chapelGeo(), ch.x, ch.z, Math.PI, 1);
    hardBox(ch.x, ch.z, 2.5, 3.75);
    const ml = { x: h.x - 18, z: h.z + 2 }; S.mill = ml; place(VM.millGeo(), ml.x, ml.z, Math.PI / 2, 1); hardCircle(ml.x, ml.z, 2.2);
    place(M.build([M.P(M.T(M.Cyl(1, 1.1, .8, 10), 0, .4), 0, [0, 0, 0], '#8a8680'), M.P(M.T(M.Cyl(.85, .85, .1, 10), 0, .75), 0, [0, 0, 0], '#3a5a8a')]), h.x, h.z, 0, 1);
    for (let k = 0; k < 3; k++) { const a = -Math.PI / 2 + k * TAU / 3 + .3, x = h.x + Math.cos(a) * 25, z = h.z + Math.sin(a) * 25; prop('bell', 'bell', 'Warding Bell', x, z, { yaw: a + Math.PI / 2 }); }
    lore('register', ch.x - 3, ch.z + 5); lore('flour', ml.x + 3.5, ml.z + 2);
    npc('pell', h.x + 2, h.z + 3, { yaw: Math.PI }); npc('wenlow', h.x - 7, h.z - 4, { yaw: 1 }); npc('haskett', ml.x + 3, ml.z - 1.5, { yaw: -Math.PI / 2, unless: ['haskett', 'rest'] });
    npc('villager', h.x + 5, h.z + 8, { kind: 'villager1', name: 'Hollin Villager' }); npc('villager', h.x - 3, h.z + 10, { kind: 'villager2', name: 'Hollin Villager' }); npc('villager', h.x + 10, h.z - 2, { kind: 'ghostnpc', name: 'Mrs. Gubbins', title: 'Rearranging the furniture' });
    npc('ansel', ch.x - 1, ch.z + 6, { yieldNpc: true });
    world.extraPlaces.push({ name: 'Little Hollin', x: h.x, z: h.z, R: 26, kind: 'village' });
    // the restless dead in the fields round the village (4-6)
    for (let i = 0; i < 9; i++) { const a = rng() * TAU, d = 36 + rng() * 22; put({ x: h.x + Math.cos(a) * d, z: h.z + Math.sin(a) * d, mob: 'ghost', lvl: [4, 6], respawn: 60, area: 1 }); }
    // Ansel and the Choir at the chapel (5)
    for (let k = 0; k < 4; k++) put({ x: ch.x - 8 + k * 4, z: ch.z - 8 - (k % 2) * 2, mob: k % 2 ? 'chanter' : 'cultist', lvl: [5, 5], respawn: 90, camp: 'chapel', area: 1 });
    put({ x: ch.x, z: ch.z + 7, mob: 'ansel', lvl: [5, 5], respawn: 90, named: 'ansel', area: 1, gate: 'ansel' });
  }
  // the Choir's camp in the west (4-5) and the old shrine (Choirmaster, 6)
  { const c = S.choircamp; campVisual(c.x, yAt(c.x, c.z), c.z, 'human', rng); world.camps.push({ x: c.x, z: c.z, kind: 'choir' }); lore('hymn', c.x + 4, c.z - 3);
    for (let k = 0; k < 6; k++) { const a = k / 6 * TAU, r = 4 + rng() * 3; put({ x: c.x + Math.cos(a) * r, z: c.z + Math.sin(a) * r, mob: k % 3 === 1 ? 'chanter' : 'cultist', lvl: [4, 5], respawn: 75, camp: 'choir', area: 1 }); }
    const s = S.shrine; place(VM.shrineGeo(), s.x, s.z, 0, 1.4); clear('shrine', 7);
    put({ x: s.x, z: s.z + 3, mob: 'choirmaster', lvl: [6, 6], respawn: 150, named: 'choirmaster', area: 1 });
    for (let k = 0; k < 3; k++) put({ x: s.x - 4 + k * 4, z: s.z + 6, mob: k === 1 ? 'chanter' : 'cultist', lvl: [5, 6], respawn: 90, camp: 'shrine', area: 1 });
  }
  // spiders south of Hollin and boars along the west road (3-5), Grumblesnout (5)
  for (let i = 0; i < 8; i++) { const a = rng() * TAU, d = 4 + rng() * 16; put({ x: S.spiders.x + Math.cos(a) * d, z: S.spiders.z + Math.sin(a) * d, mob: 'spider', lvl: [4, 5], respawn: 60, area: 1 }); }
  for (let i = 0; i < 10; i++) { const x = -130 - rng() * 110, z = -60 + rng() * 80; put({ x, z, mob: 'boar', lvl: [3, 5], respawn: 60, area: 1 }); }
  put({ x: -236, z: 4, mob: 'grumble', lvl: [5, 5], respawn: 200, named: 'grumble', area: 1 });

  // ---------- Corwin's tower at the edge of the Waste ----------
  { const t = S.tower; clear('tower', 16); place(VM.hermitTowerGeo(), t.x, t.z, 0, 1); hardCircle(t.x, t.z, 3.5);
    for (let k = 0; k < 3; k++) { const a = k * TAU / 3 + .6; prop('wardstone', 'wardstone', 'Ward Stone', t.x + Math.cos(a) * 11, t.z + Math.sin(a) * 11, { yaw: -a + Math.PI / 2 }); }
    world.props.push({ id: 'p' + world.props.length, kind: 'lorebook', tag: 'journal', name: "Corwin's old journal", lore: 'journal', x: t.x - 4.5, z: t.z + 5, yaw: 0, scale: 1 });
    npc('corwin', t.x + 1.5, t.z + 5.5, { yaw: 0 }); npc('ansel', t.x - 2.5, t.z + 6.5, { yaw: .4, when: ['ansel', 'free'] });
    world.extraPlaces.push({ name: "Corwin's Tower", x: t.x, z: t.z, R: 14, kind: 'site' });
    for (let k = 0; k < 7; k++) { const a = k / 7 * TAU + rng() * .3, d = 20 + rng() * 9; put({ x: t.x + Math.cos(a) * d, z: t.z + Math.sin(a) * d, mob: k % 3 === 1 ? 'chanter' : 'cultist', lvl: [7, 8], respawn: 80, area: 3 }); }
    // the harpy crag (6-8) and Shrieka (8)
    const c = S.crag; place(M.build([M.P(M.T(M.Dod(6), 0, 3), 0, [0, 0, 0], '#6a6670'), M.P(M.T(M.Dod(4), 4, 5, 2), 0, [0, 0, 0], '#5e5a64'), M.P(M.T(M.Dod(3), -3, 7, -1), 0, [0, 0, 0], '#6a6670')]), c.x, c.z, 0, 1); hardCircle(c.x, c.z, 5.5);
    for (let i = 0; i < 9; i++) { const a = rng() * TAU, d = 9 + rng() * 14; put({ x: c.x + Math.cos(a) * d, z: c.z + Math.sin(a) * d, mob: 'harpy', lvl: [6, 8], respawn: 60, area: 3 }); }
    put({ x: c.x + 7, z: c.z + 7, mob: 'shrieka', lvl: [8, 8], respawn: 160, named: 'shrieka', area: 3 });
  }
  // ---------- the Deacon's camp and Gristlebones in the Waste (8-9) ----------
  { const d = S.deacon; campVisual(d.x, yAt(d.x, d.z), d.z, 'human', rng); world.camps.push({ x: d.x, z: d.z, kind: 'choir' });
    for (let k = 0; k < 6; k++) { const a = k / 6 * TAU, r = 5 + rng() * 3; put({ x: d.x + Math.cos(a) * r, z: d.z + Math.sin(a) * r, mob: k % 2 ? 'chanter' : 'cultist', lvl: [8, 9], respawn: 90, camp: 'deacon', area: 3 }); }
    put({ x: d.x, z: d.z - 2, mob: 'deacon', lvl: [9, 9], respawn: 140, named: 'deacon', camp: 'deacon', area: 3 });
    put({ x: S.gristle.x, z: S.gristle.z, mob: 'gristle', lvl: [8, 8], respawn: 180, named: 'gristle', area: 3 });
    lore('soldier', S.waste.x, S.waste.z);
    for (let i = 0; i < 8; i++) { const x = (rng() - .5) * 380, z = -120 - rng() * 120; if (Math.hypot(x - ruin.x, z - ruin.z) < ruin.R + 10) continue; put({ x, z, mob: 'ghost', lvl: [7, 9], respawn: 70, area: 3 }); }
  }
  meshWithOutline(mergeBuilt(items), .05);
  linkSoft();
  world.names = { ...world.names, ansel: 'Brother Ansel', grumble: 'Grumblesnout', choirmaster: 'Choirmaster Venn', deacon: 'Deacon Mortlake', shrieka: 'Shrieka', gristle: 'Gristlebones' };
};

// houses block bodies but not route planning (like the town's)
function soft(x, z, r) { for (let k = 0; k < 4; k++) { const a = k * Math.PI / 2; addWall(x + Math.cos(a) * r, z + Math.sin(a) * r, x + Math.cos(a + Math.PI / 2) * r, z + Math.sin(a + Math.PI / 2) * r, .5, true); } }
function hardCircle(x, z, r) { const n = 8; for (let k = 0; k < n; k++) { const a = k / n * TAU, b = (k + 1) / n * TAU; addWall(x + Math.cos(a) * r, z + Math.sin(a) * r, x + Math.cos(b) * r, z + Math.sin(b) * r, .5, true); } }
function hardBox(x, z, hx, hz) { const c = [[-hx, -hz], [hx, -hz], [hx, hz], [-hx, hz]]; for (let k = 0; k < 4; k++) { const [a1, b1] = c[k], [a2, b2] = c[(k + 1) % 4]; addWall(x + a1, z + b1, x + a2, z + b2, .5, true); } }
function linkSoft() { }
