// The starting zone. Seeded: names, camps, scenery and terrain change each new game,
// while the shape stays the same: a walled town in the middle, fields around it,
// a bandit road, the orc wood to the south and the blighted waste with the War Ruin to the north.
import * as THREE from './three.js';
import { buildTown } from './town.js';
import { WH, setWH, TAU, clamp, lerp, smooth, mulberry32, makeNoise } from './core.js';
import { worldGroup, toon, detailTex, grassTex, uTime, addInstanced, addChunked, propMat, propOutline } from './render.js';
import * as M from './models.js';
import { build, P, T, Cone, Cyl, Box, Dod, Sph, Oct } from './models.js';
const O = [0, 0, 0];

export let HN = 2 * WH + 1;
export let H = new Float32Array(HN * HN);
// each zone has its own size: the Vale is bigger since Build 5
export const ZONE_SIZE = { vale: 420 };
function sizeWorld(zone) { const w = ZONE_SIZE[zone] || 300; if (w !== WH || H.length !== (2 * w + 1) ** 2) { setWH(w); HN = 2 * WH + 1; H = new Float32Array(HN * HN); } }
export const world = { seed: 0, zone: 'vale', water: null, town: null, ruin: null, spawns: [], walls: [], areas: [], minimap: null, names: {}, places: [], zoneLines: [], towns: [] };

export function hgt(x, z) {
  const fx = clamp(x + WH, 0, HN - 1.001), fz = clamp(z + WH, 0, HN - 1.001), xi = fx | 0, zi = fz | 0, u = fx - xi, v = fz - zi, i = zi * HN + xi;
  const a = H[i], b = H[i + 1], c = H[i + HN], d = H[i + HN + 1];
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}

// ---------- names ----------
const TOWN_A = ['Harrow', 'Ash', 'Wyr', 'Dun', 'Hal', 'Brack', 'Kel', 'Vane', 'Holl', 'Iron', 'Mor'];
const TOWN_B = ['gate', 'ford', 'hold', 'mere', 'wick', 'reach', 'haven', 'stead', 'watch'];
const RUIN = ['Vael', 'Morrow', 'Sethrak', 'Ul-Garath', 'Kesh', 'the Pale Choir', 'Orrin'];
const CAPT = ['Captain Rusk', 'Red Maddock', 'Captain Ivry', 'Black Tam', 'Sergeant Holloway'];
const TUSK = ['Old Tusk', 'Gnarlback', 'Mossjaw', 'Grumble-Tusk'];
const BOSS = ['Grathul the Stitched', 'Morg the Sewn', 'Hollowgut', 'The Bone Warden'];

// ---------- wall collision ----------
// soft walls (houses, pillars) stop bodies but don't block routes or line of sight
export function addWall(x1, z1, x2, z2, th = .9, soft = false) { world.walls.push({ x1, z1, x2, z2, th, soft, dx: x2 - x1, dz: z2 - z1, l2: (x2 - x1) ** 2 + (z2 - z1) ** 2 }); }
// pushes a body of radius r out of every wall; returns true if it touched one
// walls bucketed into a coarse grid, so bodies only test the walls near them
let wgrid = null, wgridN = -1, wgridRef = null;
const WG = 16;
function wallsNear(x, z) {
  const W = world.walls;
  if (!wgrid || wgridN !== W.length || wgridRef !== W) {
    wgrid = new Map(); wgridN = W.length; wgridRef = W;
    for (const w of W) {
      const pad = w.th + 1.5, x0 = Math.floor((Math.min(w.x1, w.x2) - pad) / WG), x1 = Math.floor((Math.max(w.x1, w.x2) + pad) / WG), z0 = Math.floor((Math.min(w.z1, w.z2) - pad) / WG), z1 = Math.floor((Math.max(w.z1, w.z2) + pad) / WG);
      for (let i = x0; i <= x1; i++) for (let j = z0; j <= z1; j++) { const k = i * 4096 + j; let b = wgrid.get(k); if (!b) wgrid.set(k, b = []); b.push(w); }
    }
  }
  return wgrid.get(Math.floor(x / WG) * 4096 + Math.floor(z / WG)) || EMPTY;
}
const EMPTY = [];
export function collide(e, r = .5) {
  let hit = false;
  for (const w of wallsNear(e.x, e.z)) {
    const t = clamp(((e.x - w.x1) * w.dx + (e.z - w.z1) * w.dz) / w.l2, 0, 1);
    const px = w.x1 + w.dx * t, pz = w.z1 + w.dz * t, dx = e.x - px, dz = e.z - pz, d = Math.hypot(dx, dz), m = r + w.th;
    if (d < m && d > 1e-4) { e.x = px + dx / d * m; e.z = pz + dz / d * m; hit = true; }
  }
  const lim = WH - 8; e.x = clamp(e.x, -lim, lim); e.z = clamp(e.z, -lim, lim);
  return hit;
}
// true if the straight line from a to b crosses a wall (used for line of sight and casting)
export function blocked(ax, az, bx, bz) {
  for (const w of world.walls) {
    if (w.soft) continue;
    const d1x = bx - ax, d1z = bz - az, den = d1x * w.dz - d1z * w.dx;
    if (Math.abs(den) < 1e-6) continue;
    const t = ((w.x1 - ax) * w.dz - (w.z1 - az) * w.dx) / den, u = ((w.x1 - ax) * d1z - (w.z1 - az) * d1x) / den;
    if (t > .02 && t < .98 && u >= 0 && u <= 1) return true;
  }
  return false;
}

// how far along a→b (0..1) the first wall is; 1 if clear. Used to pull the camera in.
export function wallHit(ax, az, bx, bz, pad = .9) {
  let best = 1;
  for (const w of world.walls) {
    if (w.soft) continue;
    const d1x = bx - ax, d1z = bz - az, den = d1x * w.dz - d1z * w.dx;
    if (Math.abs(den) < 1e-6) continue;
    const t = ((w.x1 - ax) * w.dz - (w.z1 - az) * w.dx) / den, u = ((w.x1 - ax) * d1z - (w.z1 - az) * d1x) / den;
    if (t > 0 && t < best && u >= -.05 && u <= 1.05) best = t;
  }
  if (best < 1) { const L = Math.hypot(bx - ax, bz - az); best = Math.max(0, best - pad / Math.max(L, .01)); }
  return best;
}

// ---------- routing through doorways ----------
// When a wall blocks the straight line, walk to the doorway that leads toward the goal.
export function route(ax, az, bx, bz) {
  if (!blocked(ax, az, bx, bz)) return null;
  const D = world.doors, n = D.length;
  if (!n) return null;
  // Dijkstra over doorways: start = the walker, goal = the target
  const dist = new Array(n).fill(1e9), prev = new Array(n).fill(-1), done = new Array(n).fill(false);
  for (let i = 0; i < n; i++) if (!blocked(ax, az, D[i].x, D[i].z)) dist[i] = Math.hypot(D[i].x - ax, D[i].z - az);
  let best = -1, bestD = 1e9;
  for (let it = 0; it < n; it++) {
    let u = -1; for (let i = 0; i < n; i++) if (!done[i] && (u < 0 || dist[i] < dist[u])) u = i;
    if (u < 0 || dist[u] >= 1e9) break; done[u] = true;
    if (!blocked(D[u].x, D[u].z, bx, bz)) { const tot = dist[u] + Math.hypot(bx - D[u].x, bz - D[u].z); if (tot < bestD) { bestD = tot; best = u; } }
    for (let v = 0; v < n; v++) if (!done[v] && D[u].links.includes(v)) { const nd = dist[u] + Math.hypot(D[v].x - D[u].x, D[v].z - D[u].z); if (nd < dist[v]) { dist[v] = nd; prev[v] = u; } }
  }
  if (best < 0) return null;
  let u = best; while (prev[u] >= 0) u = prev[u];
  return D[u];
}
export function linkDoors() { const D = world.doors; D.forEach((d, i) => d.links = D.map((o, j) => j !== i && !blocked(d.x, d.z, o.x, o.z) ? j : -1).filter(j => j >= 0)); }

// ---------- helpers ----------
export function mergeBuilt(items) {
  let n = 0; for (const it of items) n += it.geo.attributes.position.count;
  const out = { position: new Float32Array(n * 3), normal: new Float32Array(n * 3), color: new Float32Array(n * 3), glow: new Float32Array(n) };
  let o = 0; const v = new THREE.Vector3(), nm = new THREE.Matrix3();
  for (const it of items) {
    const g = it.geo, c = g.attributes.position.count; nm.getNormalMatrix(it.m);
    for (let i = 0; i < c; i++) {
      v.fromBufferAttribute(g.attributes.position, i).applyMatrix4(it.m); out.position.set([v.x, v.y, v.z], (o + i) * 3);
      v.fromBufferAttribute(g.attributes.normal, i).applyMatrix3(nm).normalize(); out.normal.set([v.x, v.y, v.z], (o + i) * 3);
    }
    out.color.set(g.attributes.color.array, o * 3); out.glow.set(g.attributes.glow.array, o);
    o += c;
  }
  const g = new THREE.BufferGeometry();
  for (const k of ['position', 'normal', 'color']) g.setAttribute(k, new THREE.BufferAttribute(out[k], 3));
  g.setAttribute('glow', new THREE.BufferAttribute(out.glow, 1));
  g.computeBoundingSphere(); return g;
}
export const mat4 = (x, y, z, ry = 0, s = 1) => new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, ry, 0)), new THREE.Vector3(s, s, s));
export function meshWithOutline(geo, thick, parent = worldGroup) {
  const g = new THREE.Group(); g.add(new THREE.Mesh(geo, propMat), new THREE.Mesh(geo, propOutline(thick))); parent.add(g); return g;
}
export const ruinWallGeo = (len, h) => build([P(T(Box(len, h, .9), 0, h / 2), 0, O, '#6f6a72'), P(T(Box(len + .1, .25, 1.05), 0, h), 0, O, '#57525a'),
  ...[-1, 1].map(s => P(T(Dod(.45), s * len * .3, h + .1, .1), 0, O, '#57525a'))]);
export const pillarGeo = (h) => build([P(T(Cyl(.45, .55, h, 7), 0, h / 2), 0, O, '#7a7480'), P(T(Box(1.2, .35, 1.2), 0, h + .15), 0, O, '#5e5864'), P(T(Box(1.3, .3, 1.3), 0, .15), 0, O, '#5e5864')]);

export function disposeWorld() { worldGroup.traverse(o => { if (o.geometry) o.geometry.dispose(); }); worldGroup.clear(); world.walls = []; world.spawns = []; world.doors = []; }

// region by position: 0 fields, 1 road, 2 wood (south), 3 waste (north)
export function regionAt(x, z) {
  if (world.regionFn) return world.regionFn(x, z);
  const r = Math.hypot(x, z);
  if (z < -100 - Math.abs(x) * .25) return 3;
  if (z > 105 + Math.abs(x) * .15) return 2;
  if (r > 85) return 1;
  return 0;
}
export const REGION_NAMES = () => world.regionNames || [world.names.fields, world.names.road, world.names.wood, world.names.waste];
// how deep the water is here (0 on land)
export const depthAt = (x, z) => world.water === null ? 0 : Math.max(0, world.water - hgt(x, z));

let zoneGens = {};
export function registerZone(name, fn) { zoneGens[name] = fn; }
export const zoneGen = name => zoneGens[name];
// Build 4: the Vale's story places hook in here (js/valeplus.js)
export const valeHooks = { terrain: null, build: null };
// build a zone: 'vale' (the starting zone), 'coast', or 'fleet' (the instance)
let TOWN_SPOTS = null;
export function generateWorld(seed, zone = 'vale') {
  disposeWorld(); sizeWorld(zone);
  world.mapLabels = []; world.huntAreas = null; world.buoy = null; world.underwater = false; world.cave = null; world.mapBounds = null;
  world.seed = seed; world.zone = zone; world.water = null; world.regionFn = null; world.regionNames = null; world.places = []; world.zoneLines = []; world.towns = []; world.camps = []; world.ferries = []; world.docks = []; world.props = []; world.storyNpcs = []; world.spots = {}; world.extraPlaces = []; world.clearSpots = [];
  if (zone !== 'vale') return zoneGens[zone](seed);
  return generateVale(seed);
}
function generateVale(seed) {
  const rng = mulberry32(seed), N = makeNoise(seed), pick = a => a[(rng() * a.length) | 0];
  const townName = pick(TOWN_A) + pick(TOWN_B);
  world.names = { town: townName, fields: townName + ' Fields', road: 'The Kingsroad', wood: pick(['Tuskwood', 'Gnarlwood', 'Bristle Wood']), waste: pick(['The Grey Waste', 'The Hollow Moor', 'The Ashen Reach']),
    ruin: 'The Ossuary of ' + pick(RUIN), captain: pick(CAPT), tusk: pick(TUSK), boss: pick(BOSS) };
  const town = { x: 0, z: 0, R: 34, base: 2 };
  const ruin = { x: (rng() - .5) * 60, z: -228, R: 34, base: 0 };
  world.town = town; world.ruin = ruin;
  // heightmap
  for (let zi = 0; zi < HN; zi++) for (let xi = 0; xi < HN; xi++) {
    const x = xi - WH, z = zi - WH;
    let h = (N.fbm(x * .015, z * .015, 4) - .5) * 16 + (N.fbm(x * .05 + 9, z * .05 + 3, 2) - .5) * 2.5;
    const reg = regionAt(x, z);
    if (reg === 2) h += (N.fbm(x * .03 + 50, z * .03, 3) - .4) * 6;
    if (reg === 3) h -= 2 + Math.abs(N.fbm(x * .02 + 70, z * .02 + 70, 3) - .5) * 8;
    h = lerp(town.base, h, smooth((Math.hypot(x - town.x, z - town.z) - town.R - 4) / 26));
    h = lerp(ruin.base, h, smooth((Math.hypot(x - ruin.x, z - ruin.z) - ruin.R - 2) / 24));
    const edge = Math.max(Math.abs(x), Math.abs(z)) - (WH - 26), eastRoad = x > WH - 100 && Math.abs(z - Math.sin(x * .02) * 12) < 14, northRoad = z < -WH + 60 && Math.abs(x) < 12;
    if (edge > 0 && !eastRoad && !northRoad) h += edge * edge * .08;
    H[zi * HN + xi] = h;
  }
  town.base = hgt(0, 0); ruin.base = hgt(ruin.x, ruin.z);
  world.clearSpots = []; world.extraPlaces = []; world.props = []; world.storyNpcs = []; world.spots = {};
  if (valeHooks.terrain) valeHooks.terrain({ rng, town, ruin });
  // ground colour by region, blended near borders
  const REG_COL = [new THREE.Color('#9ea455'), new THREE.Color('#a89d5e'), new THREE.Color('#58763a'), new THREE.Color('#6d6878')];
  const SZ = 2 * WH + 40, SEG = Math.round(SZ / 2.15), gGeo = new THREE.PlaneGeometry(SZ, SZ, SEG, SEG).rotateX(-Math.PI / 2);
  { const p = gGeo.attributes.position, col = new Float32Array(p.count * 3), rock = new THREE.Color('#7b8094'), road = new THREE.Color('#9c8458'), cobble = new THREE.Color('#8f897c');
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), z = p.getZ(i); p.setY(i, hgt(x, z));
      const c = REG_COL[regionAt(x, z)].clone();
      for (const [dx, dz] of [[6, 0], [-6, 0], [0, 6], [0, -6]]) c.lerp(REG_COL[regionAt(x + dx * 2, z + dz * 2)], .12);
      if (Math.abs(x) < 3.2 + N.n2(z * .1, 3) * 1.5 && Math.abs(z) < 210) c.lerp(road, .75);       // north-south road
      if (Math.abs(z - Math.sin(x * .02) * 12) < 3 && Math.abs(x) > 20 && Math.abs(x) < WH - 50) c.lerp(road, .7); // east-west road
      if (Math.hypot(x, z) < town.R - 1) { c.lerp(cobble, .6); if (Math.abs(x) < 3 || Math.abs(z) < 3 || Math.hypot(x, z) < 10) c.lerp(new THREE.Color('#77716a'), .55); }
      if (Math.hypot(x - ruin.x, z - ruin.z) < ruin.R) c.lerp(new THREE.Color('#5a5560'), .6);
      const out = Math.max(Math.abs(x), Math.abs(z)) - (WH - 18); c.lerp(rock, smooth(out / 12));
      const sh = .9 + N.n2(x * .3, z * .3) * .18;
      col[i * 3] = c.r * sh; col[i * 3 + 1] = c.g * sh; col[i * 3 + 2] = c.b * sh;
    }
    gGeo.setAttribute('color', new THREE.BufferAttribute(col, 3)); gGeo.computeVertexNormals(); }
  const ground = new THREE.Mesh(gGeo, new THREE.MeshLambertMaterial({ map: detailTex, vertexColors: true })); worldGroup.add(ground); world.ground = ground;

  // ---------- the town ----------
  const tg = new THREE.Group(); tg.position.set(town.x, town.base, town.z); worldGroup.add(tg);
  { const nseg = Math.round(TAU * town.R / 3.2), segLen = TAU * town.R / nseg + .2, list = [], gates = [];
    for (let k = 0; k < nseg; k++) {
      // gates are three wall segments wide so a whole group can pass
      const a = k / nseg * TAU, gc = [nseg / 4, 3 * nseg / 4].find(g => Math.abs(k - Math.round(g)) <= 1);
      if (gc !== undefined) { if (k === Math.round(gc)) gates.push(a); continue; }
      list.push([Math.cos(a) * town.R, 0, Math.sin(a) * town.R, -a - Math.PI / 2, 0, 0, 1]);
      const a2 = (k + 1) / nseg * TAU, a1 = a - (segLen / town.R) * .5, a3 = a + (segLen / town.R) * .5;
      addWall(Math.cos(a1) * town.R, Math.sin(a1) * town.R, Math.cos(a3) * town.R, Math.sin(a3) * town.R, .8);
    }
    addInstanced(M.wallGeo('human', segLen), propMat, list, .04, tg);
    for (const a of gates) {
      const gr = new THREE.Group(); gr.position.set(Math.cos(a) * town.R, 0, Math.sin(a) * town.R); gr.rotation.y = -a - Math.PI / 2;
      const gg = M.gateGeo('human', segLen * 3 + .6); gr.add(new THREE.Mesh(gg, propMat), new THREE.Mesh(gg, propOutline(.04))); tg.add(gr);
    }
    addInstanced(M.towerGeo('human'), propMat, [0, 1, 2, 3].map(k => { const a = Math.PI / 4 + k * Math.PI / 2; return [Math.cos(a) * town.R, 0, Math.sin(a) * town.R, 0, 0, 0, 1]; }), .05, tg);
    const items = [];
    TOWN_SPOTS = buildTown(0, 0, rng, items);
    // well and a bind stone in the square
    items.push({ geo: build([P(T(Cyl(1.1, 1.2, .8, 10), 0, .4), 0, O, '#8f897c'), P(T(Cyl(.9, .9, .1, 10), 0, .78), 0, O, '#3a6ea8'),
      ...[-1, 1].map(s => P(T(Box(.15, 1.6, .15), s * .9, 1.4), 0, O, '#5a3e28')), P(T(Cone(1.3, .8, 4), 0, 2.4, 0, 0, Math.PI / 4), 0, O, '#7a1f1c')]), m: mat4(4, 0, 3) });
    addWall(4 - 1.1, 3, 4 + 1.1, 3, 1.1, true);
    items.push({ geo: build([P(T(Box(.9, 2.2, .5), 0, 1.1), 0, O, '#9aa3b4'), P(T(Oct(.25), 0, 2.5), 0, O, '#8dffef', 2.5), P(T(Cyl(1, 1.2, .3, 8), 0, .15), 0, O, '#6d685f')]), m: mat4(-4, 0, 4) });
    // stalls
    const stall = (cl) => build([P(T(Box(2.4, .9, 1), 0, .45), 0, O, '#6b4a2e'), ...[-1, 1].flatMap(s => [-1, 1].map(t => P(T(Box(.1, 2, .1), s * 1.1, 1, t * .45), 0, O, '#4a3322'))), P(T(Box(2.7, .08, 1.4), 0, 2, 0, .2), 0, O, cl)]);
    items.push({ geo: stall('#c0392b'), m: mat4(8.5, 0, 5.6, 0) }, { geo: stall('#2e5a9e'), m: mat4(-8, 0, -3.8, Math.PI) }, { geo: stall('#d8b24a'), m: mat4(7.5, 0, -4.2, Math.PI) });
    meshWithOutline(mergeBuilt(items), .05, tg);
  }
  // npc spots in town (game.js creates the people)
  town.npcs = {
    ...TOWN_SPOTS,
    guards: [[0, town.R - 3], [3, town.R - 3], [0, -town.R + 3], [3, -town.R + 3], [-town.R + 5, -6], [town.R - 5, 6]],
  };

  // ---------- the War Ruin (open-world dungeon) ----------
  const rg = new THREE.Group(); rg.position.set(ruin.x, ruin.base, ruin.z); worldGroup.add(rg);
  { const wl = [], pl = [], R = ruin.R, segs = 22;
    for (let k = 0; k < segs; k++) {
      const a = k / segs * TAU;
      if (Math.abs(wrapK(a - Math.PI / 2)) < .2) continue; // entrance faces the town (south, +z)
      const a1 = a - TAU / segs / 2, a3 = a + TAU / segs / 2, len = 2 * R * Math.sin(TAU / segs / 2) + .3, h = 2.5 + rng() * 2.2;
      wl.push({ len, h, x: Math.cos(a) * R, z: Math.sin(a) * R, ry: -a - Math.PI / 2 });
      addWall(ruin.x + Math.cos(a1) * R, ruin.z + Math.sin(a1) * R, ruin.x + Math.cos(a3) * R, ruin.z + Math.sin(a3) * R, .7);
    }
    // inner wall splits off the crypt (north end) with a doorway in the middle
    const cz = -10;
    for (const [x1, x2] of [[-R * .9, -3], [3, R * .9]]) {
      const len = x2 - x1; wl.push({ len, h: 3.4, x: (x1 + x2) / 2, z: cz, ry: 0 }); addWall(ruin.x + x1, ruin.z + cz, ruin.x + x2, ruin.z + cz, .6);
    }
    // a mid wall across the court with two gaps, so the hall is a second room
    for (const [x1, x2] of [[-R * .95, -16], [-9, 9], [16, R * .95]]) { const len = x2 - x1; wl.push({ len, h: 3, x: (x1 + x2) / 2, z: 10, ry: 0 }); addWall(ruin.x + x1, ruin.z + 10, ruin.x + x2, ruin.z + 10, .55); }
    const items = wl.map(w => ({ geo: ruinWallGeo(w.len, w.h), m: mat4(w.x, 0, w.z, w.ry) }));
    for (let k = 0; k < 10; k++) { const x = (k % 2 ? 1 : -1) * 6 * (1 + (k > 5 ? .4 : 0)), z = -4 - Math.floor(k / 2) * 5.5; if (z > -32) { items.push({ geo: pillarGeo(4.5 + rng() * 1.5), m: mat4(x, 0, z) }); addWall(ruin.x + x - .05, ruin.z + z, ruin.x + x + .05, ruin.z + z, .55); } }
    for (let k = 0; k < 8; k++) items.push({ geo: pillarGeo(1.2 + rng() * 2), m: mat4((rng() - .5) * 40, 0, 14 + rng() * 16, rng() * 6) });
    // the stitched altar in the crypt
    items.push({ geo: build([P(T(Box(5, 1, 3), 0, .5), 0, O, '#4a4550'), P(T(Box(4, .3, 2.2), 0, 1.15), 0, O, '#5e2a32'),
      ...[-1.6, 0, 1.6].map(x => P(T(Cyl(.12, .14, .8, 5), x, 1.7), 0, O, '#ebdfc2')), ...[-1.6, 0, 1.6].map(x => P(T(Oct(.12), x, 2.2), 0, O, '#8dff5a', 2.5))]), m: mat4(0, 0, -27) });
    meshWithOutline(mergeBuilt(items), .05, rg);
    addWall(ruin.x - 2.5, ruin.z - 27, ruin.x + 2.5, ruin.z - 27, 1.2);
  }

  // doorways: town gates, the ruin's entrance, the two gaps into the hall, the crypt door
  world.doors = [{ x: town.x, z: town.z + town.R }, { x: town.x, z: town.z - town.R },
    { x: ruin.x, z: ruin.z + ruin.R }, { x: ruin.x - 12.5, z: ruin.z + 10 }, { x: ruin.x + 12.5, z: ruin.z + 10 }, { x: ruin.x, z: ruin.z - 10 }];
  linkDoors();

  // ---------- spawns ----------
  const sp = world.spawns, put = (o) => { const y = hgt(o.x, o.z); sp.push({ ...o, y, alive: null, timer: 0 }); };
  const tryPos = (fn, test, n = 400) => { for (let i = 0; i < n; i++) { const p = fn(); if (test(p)) return p; } return null; };
  const okSpot = (p, min = 9) => Math.hypot(p.x, p.z) > town.R + 10 && Math.hypot(p.x - ruin.x, p.z - ruin.z) > ruin.R + 8 && !sp.some(s => Math.hypot(s.x - p.x, s.z - p.z) < min) && Math.abs(p.x) < WH - 25 && Math.abs(p.z) < WH - 25;
  // fields: wolves, wasps (levels 1-3)
  for (let i = 0; i < 32; i++) {
    const p = tryPos(() => { const a = rng() * TAU, d = 38 + rng() * 52; return { x: Math.cos(a) * d, z: Math.sin(a) * d * .9 }; }, p => okSpot(p) && regionAt(p.x, p.z) === 0);
    if (p) put({ ...p, mob: rng() < .75 ? 'wolf' : 'wasp', lvl: [1 + (Math.hypot(p.x, p.z) > 65 ? 1 : 0), 2 + (Math.hypot(p.x, p.z) > 70 ? 1 : 0)], respawn: 45, area: 0 });
  }
  // the road: three bandit camps (levels 3-5); one holds the captain's placeholder
  const campSpots = [[110, 18], [-118, -10], [70, -82]];
  world.camps = [];
  campSpots.forEach(([cx, cz], ci) => {
    const cx2 = cx + (rng() - .5) * 20, cz2 = cz + (rng() - .5) * 20, y0 = hgt(cx2, cz2);
    world.camps.push({ x: cx2, z: cz2, kind: 'bandit' });
    const n = 5 + ci;
    for (let k = 0; k < n; k++) {
      const a = k / n * TAU, r = 4 + rng() * 3;
      put({ x: cx2 + Math.cos(a) * r, z: cz2 + Math.sin(a) * r, mob: rng() < .3 ? 'xbow' : rng() < .5 ? 'bandit' : 'bandit2', lvl: [3, 5], respawn: 70, camp: 'b' + ci, area: 1,
        ph: ci === 0 && k === 0 ? { named: 'captain', chance: .25 } : null });
    }
    campVisual(cx2, y0, cz2, 'human', rng);
  });
  // scattered road wolves and a bear or two (levels 3-5)
  for (let i = 0; i < 14; i++) {
    const p = tryPos(() => { const a = rng() * TAU, d = 92 + rng() * 70; return { x: Math.cos(a) * d, z: Math.sin(a) * d }; }, p => okSpot(p, 12) && regionAt(p.x, p.z) === 1 && !world.camps.some(c => Math.hypot(c.x - p.x, c.z - p.z) < 18));
    if (p) put({ ...p, mob: rng() < .35 ? 'bear' : 'wolf', lvl: [3, 5], respawn: 60, area: 1 });
  }
  // the wood: two orc warcamps with shamans (levels 5-7), and the troll's hollow (named, level 8)
  const orcSpots = [[-60, 170], [70, 190]];
  orcSpots.forEach(([cx, cz], ci) => {
    const cx2 = cx + (rng() - .5) * 20, cz2 = cz + (rng() - .5) * 16, y0 = hgt(cx2, cz2);
    world.camps.push({ x: cx2, z: cz2, kind: 'orc' });
    for (let k = 0; k < 7; k++) { const a = k / 7 * TAU, r = 4.5 + rng() * 3.5; put({ x: cx2 + Math.cos(a) * r, z: cz2 + Math.sin(a) * r, mob: k % 3 === 2 ? 'shaman' : 'brute', lvl: [5, 7], respawn: 80, camp: 'o' + ci, area: 2 }); }
    campVisual(cx2, y0, cz2, 'orc', rng);
  });
  for (let i = 0; i < 12; i++) {
    const p = tryPos(() => ({ x: (rng() - .5) * 360, z: 130 + rng() * 120 }), p => okSpot(p, 12) && regionAt(p.x, p.z) === 2 && !world.camps.some(c => Math.hypot(c.x - p.x, c.z - p.z) < 20));
    if (p) put({ ...p, mob: rng() < .5 ? 'brute' : 'bear', lvl: [5, 7], respawn: 70, area: 2 });
  }
  { const hx = (rng() - .5) * 40, hz = 235; world.hollow = { x: hx, z: hz }; put({ x: hx, z: hz, mob: 'troll', lvl: [8, 8], respawn: 240, named: 'tusk', area: 2 }); }
  // the waste: undead packs (levels 7-9)
  for (let i = 0; i < 16; i++) {
    const p = tryPos(() => ({ x: (rng() - .5) * 400, z: -110 - rng() * 150 }), p => okSpot(p, 13) && regionAt(p.x, p.z) === 3);
    if (!p) continue;
    const n = rng() < .4 ? 2 : 1;
    for (let k = 0; k < n; k++) put({ x: p.x + k * 2.5, z: p.z + k * 1.5, mob: rng() < .6 ? 'skeleton' : 'ghoul', lvl: [7, 9], respawn: 75, camp: n > 1 ? 'w' + i : null, area: 3 });
  }
  // the ruin: court (8-9), hall (9), crypt boss (10)
  const rx = ruin.x, rz = ruin.z;
  const courtPacks = [[-12, 24], [12, 24], [0, 18], [-20, 14], [20, 14]];
  courtPacks.forEach(([x, z], i) => { for (let k = 0; k < (i < 2 ? 3 : 2); k++) put({ x: rx + x + k * 1.8, z: rz + z + (k % 2) * 1.5, mob: k === 2 ? 'ghoul' : 'skeleton', lvl: [8, 9], respawn: 150, camp: 'rc' + i, area: 4, dungeon: true }); });
  const hallPacks = [[-14, 2], [14, 2], [0, -2]];
  hallPacks.forEach(([x, z], i) => { for (let k = 0; k < 3; k++) put({ x: rx + x + k * 1.8, z: rz + z + (k % 2) * 1.5, mob: k === 1 ? 'wraith' : 'ghoul', lvl: [9, 9], respawn: 180, camp: 'rh' + i, area: 4, dungeon: true, elite: true }); });
  put({ x: rx, z: rz - 21, mob: 'abom', lvl: [10, 10], respawn: 420, named: 'boss', area: 4, dungeon: true, boss: true });

  if (valeHooks.build) valeHooks.build({ rng, town, ruin, put, tryPos, okSpot });
  // ---------- scenery ----------
  const lists = { pine: [], oak: [], dead: [], rock: [], grock: [] }, tufts = [], tcol = [];
  const clear = (x, z) => Math.hypot(x - town.x, z - town.z) < town.R + 6 || Math.hypot(x - ruin.x, z - ruin.z) < ruin.R + 4 || Math.abs(x) < 5 && Math.abs(z) < 210 ||
    world.camps.some(c => Math.hypot(x - c.x, z - c.z) < 12) || sp.some(s => Math.hypot(s.x - x, s.z - z) < 2.5) || world.clearSpots.some(c => Math.hypot(x - c.x, z - c.z) < c.r);
  const dens = [[['oak', .05], ['rock', .03]], [['oak', .04], ['rock', .05], ['dead', .01]], [['pine', .42], ['oak', .12], ['rock', .04]], [['dead', .12], ['grock', .07]]];
  const areaK = ((WH - 10) / 290) ** 2;
  for (let n = 0; n < 45000 * areaK; n++) {
    const x = (rng() * 2 - 1) * (WH - 10), z = (rng() * 2 - 1) * (WH - 10);
    if (clear(x, z)) continue;
    const reg = regionAt(x, z), r = rng(); let acc = 0;
    for (const [k, p] of dens[reg]) { acc += p; if (r < acc) { lists[k].push([x, hgt(x, z) - .2, z, rng() * 6.3, (rng() - .5) * .1, (rng() - .5) * .1, .8 + rng() * .9]); break; } }
  }
  const tuftCol = [[.62, .68, .32], [.7, .64, .38], [.36, .52, .24], [.48, .45, .5]];
  for (let n = 0; n < 60000 * Math.min(1.5, areaK); n++) {
    const x = (rng() * 2 - 1) * (WH - 6), z = (rng() * 2 - 1) * (WH - 6), reg = regionAt(x, z);
    if ((reg === 3 && rng() < .7) || clear(x, z)) continue;
    tufts.push([x, hgt(x, z) - .05, z, rng() * 6.3, 0, 0, .7 + rng() * .8]); tcol.push(tuftCol[reg]);
  }
  addChunked(M.pineGeo(false), propMat, lists.pine, .05); addChunked(M.oakGeo(), propMat, lists.oak, .05); addChunked(M.deadGeo(), propMat, lists.dead, .03);
  addChunked(M.rockGeo('#827c72', '#6c8a46'), propMat, lists.rock, .04); addChunked(M.rockGeo('#6a6670', '#55515a'), propMat, lists.grock, .04);
  // trees block movement a little: big trunks only
  world.trees = [...lists.pine, ...lists.oak].map(t => ({ x: t[0], z: t[2], r: .45 * t[6] }));
  {
    const gg = new THREE.PlaneGeometry(1, .75); gg.translate(0, .37, 0);
    const g2 = gg.clone().rotateY(Math.PI / 2), tuft = new THREE.BufferGeometry();
    for (const k of ['position', 'normal', 'uv']) tuft.setAttribute(k, new THREE.BufferAttribute(new Float32Array([...gg.attributes[k].array, ...g2.attributes[k].array]), gg.attributes[k].itemSize));
    tuft.setIndex([...gg.index.array, ...Array.from(g2.index.array, i => i + 4)]);
    const gm = new THREE.MeshLambertMaterial({ map: grassTex, alphaTest: .45, side: THREE.DoubleSide });
    gm.onBeforeCompile = s => {
      s.uniforms.uTime = uTime;
      s.vertexShader = s.vertexShader.replace('#include <common>', '#include <common>\nuniform float uTime;')
        .replace('#include <begin_vertex>', `#include <begin_vertex>\nvec3 ip=(instanceMatrix*vec4(0.,0.,0.,1.)).xyz;\ntransformed.x+=sin(uTime*2.1+ip.x*.35+ip.z*.2)*.12*position.y;`);
    };
    gm.customProgramCacheKey = () => 'grass';
    addChunked(tuft, gm, tufts, 0, tcol.map(c => new THREE.Color(c[0], c[1], c[2])), 50);
  }
  // distant mountains
  const mts = [];
  for (let i = 0; i < 110; i++) { const a = i / 110 * TAU + (rng() - .5) * .05, d = WH + 30 + rng() * 50; mts.push([Math.cos(a) * d, -2, Math.sin(a) * d, rng() * 6, 0, 0, 1]); }
  const mtMesh = addInstanced(new THREE.ConeGeometry(1, 1, 6), toon({ color: '#626a88' }), mts);
  { const o = new THREE.Object3D(); mts.forEach((t, i) => { o.position.set(t[0], t[1], t[2]); o.rotation.y = t[3]; o.scale.set(20 + rng() * 22, 26 + rng() * 40, 20 + rng() * 22); o.updateMatrix(); mtMesh.setMatrixAt(i, o.matrix); }); }

  // places for the map and zone names, and the zone line at the east end of the Kingsroad
  world.places = [{ name: world.names.town, x: town.x, z: town.z, R: town.R + 2, kind: 'town' }, { name: world.names.ruin, x: ruin.x, z: ruin.z, R: ruin.R, kind: 'dungeon' }, ...world.extraPlaces];
  world.towns = [{ name: world.names.town, x: town.x, z: town.z }];
  { const zx = WH - 14, zz = Math.sin(zx * .02) * 12; world.zoneLines.push({ x: zx, z: zz, r: 9, to: 'coast', label: 'To the Saltreach Coast (levels 10-20)' }); zoneMarker(zx, zz, Math.PI / 2); }
  // minimap base
  const mm = document.createElement('canvas'); mm.width = mm.height = 200;
  const g = mm.getContext('2d'), img = g.createImageData(200, 200), MC = ['#9a9e5a', '#a39866', '#4f6b35', '#5e5966'].map(c => new THREE.Color(c));
  for (let y = 0; y < 200; y++) for (let x = 0; x < 200; x++) {
    const wx = x * (2 * WH / 200) - WH, wz = y * (2 * WH / 200) - WH, c = MC[regionAt(wx, wz)], s = clamp(.85 + hgt(wx, wz) * .02, .6, 1.2), o = (y * 200 + x) * 4;
    img.data[o] = Math.min(255, c.r ** (1 / 2.2) * 255 * s); img.data[o + 1] = Math.min(255, c.g ** (1 / 2.2) * 255 * s); img.data[o + 2] = Math.min(255, c.b ** (1 / 2.2) * 255 * s); img.data[o + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  const toMM = (x, z) => [(x + WH) / (2 * WH) * 200, (z + WH) / (2 * WH) * 200];
  g.strokeStyle = '#8a7a5a'; g.lineWidth = 2; g.beginPath(); g.moveTo(...toMM(0, -210)); g.lineTo(...toMM(0, 210)); g.stroke();
  g.fillStyle = '#d8cdb0'; g.beginPath(); g.arc(...toMM(0, 0), 26 / (2 * WH) * 200, 0, TAU); g.fill();
  g.fillStyle = '#3a3540'; g.beginPath(); g.arc(...toMM(ruin.x, ruin.z), ruin.R / (2 * WH) * 200, 0, TAU); g.fill();
  world.minimap = mm;
  return world;
}
// a tall waystone and banners mark a zone line
export function zoneMarker(x, z, ry) {
  const y = hgt(x, z), g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = ry; worldGroup.add(g);
  const geo = build([...[-4, 4].flatMap(s => [P(T(Box(.7, 5, .7), s, 2.5), 0, O, '#8f897c'), P(T(Box(1, .4, 1), s, 5.2), 0, O, '#6d685f'), P(T(Box(.05, 2.2, 1.4), s, 3.4, .45), 0, O, '#2e5a9e')]),
    P(T(Box(9, .5, .6), 0, 5.4), 0, O, '#7a6448'), P(T(Oct(.5), 0, 6.3), 0, O, '#8dffef', 2.5)]);
  g.add(new THREE.Mesh(geo, propMat), new THREE.Mesh(geo, propOutline(.05)));
}
function wrapK(a) { while (a > Math.PI) a -= TAU; while (a < -Math.PI) a += TAU; return a; }

export function campVisual(cx, y0, cz, faction, rng) {
  const items = [], human = faction === 'human', put = (geo, x, z, ry = 0, s = 1) => items.push({ geo, m: mat4(x, hgt(cx + x, cz + z) - y0, z, ry, s) });
  const tent = human ? build([P(T(Cone(1.9, 2.4, 4), 0, 1.2, 0, 0, Math.PI / 4), 0, O, '#b59a6a'), P(T(Box(.7, 1, .05), 0, .5, 1.36), 0, O, '#3b2a1c')])
    : build([P(T(Cone(1.8, 2.6, 6), 0, 1.3), 0, O, '#5a3e28'), ...[0, 1, 2].map(k => P(T(Cyl(.05, .05, 1.2, 4), Math.cos(k * 2.1) * .2, 2.9, Math.sin(k * 2.1) * .2, Math.cos(k * 2.1) * .3, 0, Math.sin(k * 2.1) * .3), 0, O, '#e2d6b5'))]);
  for (let k = 0; k < 4; k++) { const a = k / 4 * TAU + rng() * .4, r = 9 + rng() * 2; put(tent, Math.cos(a) * r, Math.sin(a) * r, -a + Math.PI / 2, .9 + rng() * .3); }
  put(build([...Array.from({ length: 8 }, (_, k) => P(T(Dod(.28), Math.cos(k / 8 * TAU) * .9, .1, Math.sin(k / 8 * TAU) * .9), 0, O, '#6d685f')), P(T(Cone(.5, .9, 5), 0, .45), 0, O, '#ff7a2a', 1.8), P(T(Cone(.3, .6, 4), .1, .5, .1), 0, O, '#ffd34d', 2)]), 0, 0);
  put(build([P(T(Cyl(.06, .06, 4, 4), 0, 2), 0, O, '#3b2a1c'), P(T(Box(.05, 1.4, 1.1), 0, 3.2, .58), 0, O, human ? '#7a1f1c' : '#2c2c2c'), P(T(Dod(.25), 0, 4.1), 0, O, '#e2d6b5')]), 2.5, -2.5);
  const gr = new THREE.Group(); gr.position.set(cx, y0, cz); worldGroup.add(gr);
  const geo = mergeBuilt(items); gr.add(new THREE.Mesh(geo, propMat), new THREE.Mesh(geo, propOutline(.04)));
}
