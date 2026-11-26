// Build 9: a kit for building zones from a description. Six new zones (three racial starts and three 20-25 lands)
// and fifteen instanced dungeons and raids are all written as data and assembled here.
import * as THREE from './three.js';
import { S, WH, TAU, lerp, mulberry32, makeNoise, isNight, X } from './core.js';
import { addChunked, propMat, grassTex } from './render.js';
import * as R from './render.js';
import * as M from './models.js';
import { build, P, T, Cone, Cyl, Box, Sph, Oct, Dod } from './models.js';
import { H, HN, hgt, world, addWall, linkDoors, mergeBuilt, mat4, meshWithOutline, ruinWallGeo, pillarGeo, campVisual, registerZone, zoneMarker, ZONE_SIZE } from './world.js';
import { groundMesh } from './zones.js';
import { houseGeo } from './town.js';
import { INSTANCES, DBOSSES, FINALS, buildInstance } from './dungeons.js';
import { NODES } from './crafting.js';
const O = [0, 0, 0];
const sm = t => t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t);
const segD = (x, z, [ax, az, bx, bz]) => { const dx = bx - ax, dz = bz - az, L = dx * dx + dz * dz || 1, t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / L)); return Math.hypot(x - ax - dx * t, z - az - dz * t); };
export const ZSPEC = {};
// zone looks: fog, sky and light, applied while you stand in the zone
X.light.push(() => {
  const sp = ZSPEC[S.zone]?.sky; if (!sp) return;
  if (sp.sun != null) R.sun.intensity *= sp.sun;
  if (sp.fog) R.scene.fog.color.lerp(new THREE.Color(sp.fog), sp.k ?? .6);
  if (sp.far) R.scene.fog.far = Math.min(R.scene.fog.far, sp.far);
  for (const [u, c] of [['top', sp.top], ['mid', sp.mid], ['hor', sp.hor]]) if (c) R.skyMat.uniforms[u].value.lerp(new THREE.Color(c), sp.k ?? .6);
});

// ---------- scenery pieces ----------
export const GEO = {
  pine: () => M.pineGeo(false), snowpine: () => M.pineGeo(true), oak: () => M.oakGeo(), dead: () => M.deadGeo(),
  shroom: () => build([P(T(Cyl(.18, .26, 2.2, 6), 0, 1.1), 0, O, '#c8bca8'), P(T(Sph(1.3, 9, 5, 0, TAU, 0, Math.PI / 2), 0, 2.1, 0, 0, 0, 0, 1, .55, 1), 0, O, '#5a3a8a', .5), P(T(Sph(.16, 5, 4), .5, 2.5, .4), 0, O, '#c8f0ff', 1.6)]),
  crystal: () => build([P(T(Oct(.5), 0, .9, 0, 0, 0, 0, .6, 2, .6), 0, O, '#6ad8ff', 1.4), P(T(Oct(.35), .5, .5, .2, .3, 0, .4, .6, 1.6, .6), 0, O, '#8a6aff', 1.2)]),
  icerock: () => build([P(T(Dod(1), 0, .4, 0, 0, 0, 0, 1.3, .8, 1), 0, O, '#c8dcea'), P(T(Dod(.7), 0, .9, 0, 0, 0, 0, 1, .4, .9), 0, O, '#f4f8ff')]),
  stalag: () => build([P(T(Cone(.7, 3.4, 6), 0, 1.7), 0, O, '#4a4458'), P(T(Cone(.4, 2, 5), .7, 1, .3), 0, O, '#3a3448')]),
  birch: () => build([P(T(Cyl(.12, .16, 3.6, 6), 0, 1.8), 0, O, '#e8e4dc'), P(T(Sph(1.2, 7, 5), 0, 3.8, 0, 0, 0, 0, 1, 1.3, 1), 0, O, '#d89a3a')]),
  hedge: () => build([P(T(Box(3, 1.2, 1), 0, .6), 0, O, '#3a6a32')]),
  fence: () => build([...[-1.4, 0, 1.4].map(x => P(T(Box(.14, 1.1, .14), x, .55), 0, O, '#6b4a2e')), P(T(Box(3, .1, .08), 0, .8), 0, O, '#7a5a3a'), P(T(Box(3, .1, .08), 0, .45), 0, O, '#7a5a3a')]),
  bones: () => build([P(T(Sph(.2, 6, 5), 0, .15), 0, O, '#e8e0cc'), P(T(Cyl(.05, .05, .7, 4), .25, .05, .1, 0, 0, Math.PI / 2), 0, O, '#e8e0cc')]),
  totem: () => build([P(T(Cyl(.25, .3, 3.2, 6), 0, 1.6), 0, O, '#6b4a2e'), P(T(Box(.7, .5, .7), 0, 2.4), 0, O, '#a0502a'), P(T(Cone(.4, .6, 4), -.45, 2.9, 0, 0, 0, .8), 0, O, '#e8e0cc'), P(T(Cone(.4, .6, 4), .45, 2.9, 0, 0, 0, -.8), 0, O, '#e8e0cc')]),
  lantern: () => build([P(T(Cyl(.06, .08, 2.8, 5), 0, 1.4), 0, O, '#2a2a30'), P(T(Box(.4, .5, .4), 0, 2.9), 0, O, '#ffcf6a', 1.8)]),
  bluelamp: () => build([P(T(Cyl(.06, .08, 2.8, 5), 0, 1.4), 0, O, '#2a2a30'), P(T(Box(.4, .5, .4), 0, 2.9), 0, O, '#7ad8ff', 1.8)]),
  greenlamp: () => build([P(T(Cyl(.06, .08, 2.8, 5), 0, 1.4), 0, O, '#2a2a30'), P(T(Box(.4, .5, .4), 0, 2.9), 0, O, '#8aff8a', 1.8)]),
  statue: () => build([P(T(Box(1.4, .6, 1.4), 0, .3), 0, O, '#8a8478'), P(T(Cyl(.35, .45, 2.4, 6), 0, 1.8), 0, O, '#9a948a'), P(T(Sph(.35, 6, 5), 0, 3.2), 0, O, '#9a948a'), P(T(Box(1.6, .15, .3), 0, 2.6), 0, O, '#9a948a')]),
  banner: c => build([P(T(Cyl(.06, .06, 4, 5), 0, 2), 0, O, '#3a3a40'), P(T(Box(1.1, 1.8, .05), .6, 3), 0, O, c || '#3a5aaa')]),
  stonecircle: () => build([...[0, 1, 2, 3, 4, 5, 6].map(k => P(T(Box(.7, 2.2 + (k % 3) * .4, .5), Math.cos(k * .9) * 4, 1.1, Math.sin(k * .9) * 4, 0, -k * .9), 0, O, '#7a7468'))]),
  tent: c => build([P(T(Cone(1.8, 2.4, 4), 0, 1.2, 0, 0, Math.PI / 4), 0, O, c || '#a08a6a'), P(T(Box(.6, 1, .05), 0, .5, 1.2), 0, O, '#1a1410')]),
  hut: c => build([P(T(Cyl(2.2, 2.4, 2.2, 8), 0, 1.1), 0, O, '#7a5a3a'), P(T(Cone(2.8, 2.2, 8), 0, 3.3), 0, O, c || '#8a7a4a'), P(T(Box(.9, 1.5, .1), 0, .75, 2.3), 0, O, '#1a1410')]),
  hall: c => build([P(T(Box(9, 3.2, 5), 0, 1.6), 0, O, '#6b4a2e'), P(T(Cone(6.4, 3, 4), 0, 4.6, 0, 0, Math.PI / 4, 0, 1.1, 1, .62), 0, O, c || '#4a3a2a'), P(T(Box(1.3, 2, .1), 0, 1, 2.55), 0, O, '#1a1410')]),
  cavehouse: () => build([P(T(Dod(3), 0, 1.6, 0, 0, 0, 0, 1.3, .7, 1.1), 0, O, '#4a4458'), P(T(Box(1.2, 1.8, .1), 0, .9, 3.2), 0, O, '#ffcf6a', 1.2)]),
  icehut: () => build([P(T(Sph(2.6, 10, 6, 0, TAU, 0, Math.PI / 2), 0, 0), 0, O, '#e8f0f8'), P(T(Box(1, 1.4, 1.4), 0, .7, 2.4), 0, O, '#d8e4f0'), P(T(Box(.7, 1.1, .1), 0, .55, 3.1), 0, O, '#1a1a2a')]),
};

// ---------- a zone, from a description ----------
// spec: size, name, town, seed, land(x,z,N), pal {a,b,hi,road,cob,low}, towns, roads, open, doors, lines, spots, scatter, camps, rares, scenery, sky
export function defineZone(key, spec) {
  ZSPEC[key] = spec; ZONE_SIZE[key] = spec.size;
  if (spec.nodes) NODES[key] = spec.nodes;
  registerZone(key, seed => {
    const rng = mulberry32(seed + spec.seed), N = makeNoise(seed + spec.seed), pk = a => a[(rng() * a.length) | 0];
    world.water = null;
    world.names = { zone: spec.name, town: spec.towns[0].name, boss: spec.bossName || '' };
    const towns = spec.towns, roads = spec.roads || [], opens = spec.open || [], flats = [...towns.map(t => ({ ...t, base: t.base ?? 3 })), ...opens.map(o => ({ ...o, base: 3 })), ...(spec.flats || [])];
    for (let zi = 0; zi < HN; zi++) for (let xi = 0; xi < HN; xi++) {
      const x = xi - WH, z = zi - WH; let h = spec.land(x, z, N);
      for (const t of flats) h = lerp(t.base, h, sm((Math.hypot(x - t.x, z - t.z) - t.R - 3) / 22));
      for (const r of roads) { const d = segD(x, z, r); if (d < 9) h = lerp(Math.min(h, spec.roadH ?? h), h, sm((d - 4) / 5)); }
      const edge = Math.max(Math.abs(x), Math.abs(z)) - (WH - 24), open = (spec.lines || []).some(l => Math.hypot(x - l.x, z - l.z) < 30);
      if (edge > 0 && !open) h += edge * edge * .08;
      H[zi * HN + xi] = h;
    }
    const C = k => new THREE.Color(spec.pal[k]);
    const A = C('a'), B = C('b'), HI = C('hi'), ROAD = C('road'), COB = C('cob'), LOW = spec.pal.low ? C('low') : null;
    const colorAt = (x, z) => {
      const h = hgt(x, z); let c = A.clone().lerp(B, N.fbm(x * .02, z * .02, 2));
      if (LOW) c.lerp(LOW, sm((N.fbm(x * .008 + 3, z * .008, 3) - .5) * 3) * .6);
      if (h > (spec.hiH ?? 11)) c.lerp(HI, sm((h - (spec.hiH ?? 11)) / 6));
      for (const r of roads) if (segD(x, z, r) < 4.5) c.lerp(ROAD, .55);
      for (const t of towns) if (Math.hypot(x - t.x, z - t.z) < t.R - 1) c.lerp(COB, .5);
      const sh = .9 + N.n2(x * .3, z * .3) * .18; return new THREE.Color(c.r * sh, c.g * sh, c.b * sh);
    };
    groundMesh(colorAt);
    world.regionNames = spec.regions.names; world.regionFn = spec.regions.fn;
    // ---------- towns ----------
    const items = [], put = (geo, x, z, ry = 0, s = 1) => items.push({ geo, m: mat4(x, hgt(x, z), z, ry, s) });
    const solid = (x, z, w, d, ry = 0) => { const c = Math.cos(ry), s = Math.sin(ry), pt = (lx, lz) => [x + lx * c + lz * s, z - lx * s + lz * c]; const k = [pt(-w / 2, -d / 2), pt(w / 2, -d / 2), pt(w / 2, d / 2), pt(-w / 2, d / 2)]; for (let i = 0; i < 4; i++) addWall(k[i][0], k[i][1], k[(i + 1) % 4][0], k[(i + 1) % 4][1], .3); };
    world.towns = []; world.places = [];
    for (const t of towns) {
      const gates = t.gates || [Math.PI / 2, Math.PI * 1.5];
      if (t.wall && t.wall !== 'none') {
        const Rr = t.R, nseg = Math.max(16, Math.round(Rr)), list = [], segLen = TAU * Rr / nseg + .3;
        for (let k = 0; k < nseg; k++) { const a = k / nseg * TAU; if (gates.some(g => Math.abs(((a - g) % TAU + TAU + Math.PI) % TAU - Math.PI) < .24)) continue;
          if (t.wall === 'palisade' || t.wall === 'ice' || t.wall === 'stones') { put(t.wall === 'ice' ? GEO.icerock() : t.wall === 'stones' ? M.rockGeo('#6a6070', '#4a4458') : build([...[-.8, 0, .8].map(o => P(T(Cyl(.16, .2, 3, 5), o, 1.5), 0, O, '#6b4a2e')), ...[-.8, 0, .8].map(o => P(T(Cone(.2, .5, 5), o, 3.2), 0, O, '#5a3e28'))]), t.x + Math.cos(a) * Rr, t.z + Math.sin(a) * Rr, -a - Math.PI / 2, t.wall === 'palisade' ? segLen / 2.4 : 1.3); }
          else list.push([t.x + Math.cos(a) * Rr, hgt(t.x + Math.cos(a) * Rr, t.z + Math.sin(a) * Rr), t.z + Math.sin(a) * Rr, -a - Math.PI / 2, 0, 0, 1]);
          const a1 = a - TAU / nseg / 2, a3 = a + TAU / nseg / 2; addWall(t.x + Math.cos(a1) * Rr, t.z + Math.sin(a1) * Rr, t.x + Math.cos(a3) * Rr, t.z + Math.sin(a3) * Rr, .9); }
        if (list.length) R.addInstanced(M.wallGeo(t.wall, segLen), propMat, list, .04);
        if (t.wall === 'human' || t.wall === 'elem' || t.wall === 'necro' || t.wall === 'druid') for (let k = 0; k < 6; k++) { const a = k / 6 * TAU + .3; put(M.towerGeo(t.wall), t.x + Math.cos(a) * Rr, t.z + Math.sin(a) * Rr); }
        for (const g of gates) world.doors.push({ x: t.x + Math.cos(g) * Rr, z: t.z + Math.sin(g) * Rr });
      }
      // buildings: houses (spec.houses: [[dx,dz,ry,geoKey|opts]]), or a ring of them
      for (const [dx, dz, ry, g, w = 6, d = 5] of t.houses || []) { const geo = typeof g === 'string' ? GEO[g](t.roof) : houseGeo({ wall: t.hwall || '#cfc2a8', roof: t.roof || '#5a3a3a', ...(g || {}) }); put(geo, t.x + dx, t.z + dz, ry); solid(t.x + dx, t.z + dz, w, d, ry); }
      for (const [dx, dz, g, arg] of t.props || []) put(GEO[g](arg), t.x + dx, t.z + dz, rng() * TAU);
      world.towns.push({ key: t.key, name: t.name, x: t.x, z: t.z, R: t.R, guardName: t.guardName, guardKind: t.guardKind, npcs: t.npcs, guards: t.guards || [] });
      world.places.push({ name: t.name, x: t.x, z: t.z, R: t.R + 2, kind: 'town' });
    }
    world.town = towns[0];
    // ---------- open dungeons and landmarks ----------
    for (const o of opens) {
      world.places.push({ name: o.name, x: o.x, z: o.z, R: o.R, kind: 'dungeon' });
      for (let i = 0; i < (o.decoN || 24); i++) { const a = rng() * TAU, d = rng() * o.R; put(GEO[o.deco || 'dead'](o.decoArg), o.x + Math.cos(a) * d, o.z + Math.sin(a) * d, rng() * TAU, .9 + rng() * .9); }
      if (o.ring) for (let k = 0; k < 14; k++) { const a = k / 14 * TAU; if (Math.abs(a - (o.gap ?? Math.PI / 2)) < .4) continue; put(ruinWallGeo(TAU * o.R / 14 + .4, 2.5 + rng() * 2.5), o.x + Math.cos(a) * o.R, o.z + Math.sin(a) * o.R, -a - Math.PI / 2); }
      if (o.centre) put(GEO[o.centre](), o.x, o.z, 0, 1.6);
    }
    for (const l of spec.landmarks || []) { put(GEO[l.g](l.arg), l.x, l.z, l.ry || 0, l.s || 1); if (l.name) world.places.push({ name: l.name, x: l.x, z: l.z, R: l.R || 14, kind: l.kind || 'place' }); }
    // instanced dungeon and raid doors
    const doorGeo = col => build([P(T(Box(10, 9, 5), 0, 4.5, -1.5), 0, O, spec.doorCol || '#4a4652'), P(T(Box(4, 5.4, .6), 0, 2.7, 1.1), 0, O, '#0b0a0e'), ...[-2.6, 2.6].map(x => P(T(Box(.9, 6, .9), x, 3, 1.1), 0, O, '#3a3640')), P(T(Oct(.5), 0, 6.6, 1.3), 0, O, col || '#8ad8ff', 1.8)]);
    for (const d of spec.doors || []) {
      const ry = d.ry || 0; put(doorGeo(d.col), d.x, d.z, ry);
      const fx = Math.sin(ry), fz = Math.cos(ry);
      world.zoneLines.push({ x: d.x + fx * 3, z: d.z + fz * 3, r: 3, to: d.to, label: d.label }); zoneMarker(d.x + fx * 4, d.z + fz * 4, ry + Math.PI);
      world.places.push({ name: d.name, x: d.x, z: d.z, R: 10, kind: 'dungeon' });
      INSTANCES[d.to] = INSTANCES[d.to] || { parent: key, name: d.name }; INSTANCES[d.to].out = { x: d.x + fx * 9, z: d.z + fz * 9 }; INSTANCES[d.to].parent = key;
    }
    meshWithOutline(mergeBuilt(items), .05);
    linkDoors();
    for (const l of spec.lines || []) { world.zoneLines.push({ x: l.x, z: l.z, r: 9, to: l.to, label: l.label }); zoneMarker(l.x, l.z, l.ry || 0); }
    world.mapLabels = spec.labels || [];
    world.spots = Object.assign(world.spots || {}, spec.spots || {});
    for (const t of towns) world.spots[t.key] = world.spots[t.key] || { x: t.x, z: t.z };
    for (const o of opens) world.spots[o.key] = world.spots[o.key] || { x: o.x, z: o.z };
    for (const d of spec.doors || []) world.spots[d.to] = world.spots[d.to] || { x: d.x, z: d.z };
    world.clearSpots = [...towns.map(t => ({ x: t.x, z: t.z, r: t.R + 10 })), ...opens.map(o => ({ x: o.x, z: o.z, r: o.R + 4 })), ...(spec.doors || []).map(d => ({ x: d.x, z: d.z, r: 12 })), ...(spec.landmarks || []).filter(l => l.clear).map(l => ({ x: l.x, z: l.z, r: l.clear }))];
    // ---------- spawns ----------
    const sp = world.spawns, put2 = o => sp.push({ ...o, y: hgt(o.x, o.z), alive: null, timer: 0 });
    const onRoad = p => roads.some(r => segD(p.x, p.z, r) < 8);
    const clear = p => !world.clearSpots.some(c => Math.hypot(c.x - p.x, c.z - p.z) < c.r + 8) && !onRoad(p) && Math.max(Math.abs(p.x), Math.abs(p.z)) < WH - 30;
    const land = (x0, x1, z0, z1, min = 9) => { for (let i = 0; i < 300; i++) { const p = { x: x0 + rng() * (x1 - x0), z: z0 + rng() * (z1 - z0) }; if (clear(p) && hgt(p.x, p.z) < (spec.maxSpawnH ?? 16) && !sp.some(s => Math.hypot(s.x - p.x, s.z - p.z) < min)) return p; } return null; };
    for (const [n, box, mobs, lvl, area, resp = 70] of spec.scatter || []) for (let i = 0; i < n; i++) { const p = land(...box); if (p) put2({ ...p, mob: pk(mobs), lvl, respawn: resp, area }); }
    for (const [n, box, mobs, lvl, area, tag, kind = 'human'] of spec.camps || []) for (let i = 0; i < n; i++) { const p = land(...box, 30); if (!p) continue; world.camps.push({ x: p.x, z: p.z, kind }); if (kind === 'human') campVisual(p.x, hgt(p.x, p.z), p.z, 'human', rng);
      for (let k = 0; k < mobs.length; k++) { const a = k / mobs.length * TAU; put2({ x: p.x + Math.cos(a) * 3.5, z: p.z + Math.sin(a) * 3.5, mob: mobs[k], lvl, respawn: 80, camp: tag + i, area }); } }
    for (const o of opens) {
      (o.packs || []).forEach(([dx, dz, mobs], i) => mobs.forEach((m, k) => put2({ x: o.x + dx + (k % 2) * 2, z: o.z + dz + (k > 1 ? 2 : 0), mob: m, lvl: o.lvl, respawn: 300, camp: o.key + i, area: o.area, dungeon: true })));
      (o.bosses || []).forEach(([dx, dz, m, L, fin]) => put2({ x: o.x + dx, z: o.z + dz, mob: m, lvl: [L, L], respawn: fin ? 1500 : 1100, named: m, area: o.area, dungeon: true, [fin ? 'boss' : 'boss2']: true }));
      if (o.bosses) { DBOSSES[o.key] = o.bosses.map(b => b[2]); const f = o.bosses.find(b => b[4]); if (f && !FINALS.includes(f[2])) FINALS.push(f[2]); }
    }
    for (const [box, m, L, night] of spec.rares || []) { const p = land(...box) || { x: (box[0] + box[1]) / 2, z: (box[2] + box[3]) / 2 }; put2({ ...p, mob: m, lvl: [L, L], respawn: 600, named: m, area: spec.regions.fn(p.x, p.z), when: night ? isNight : undefined }); }
    for (const f of spec.extraSpawns || []) f(put2, land, rng);
    world.huntAreas = spec.hunt;
    // ---------- scenery ----------
    const sc = spec.scenery || {}, lists = (sc.kinds || []).map(() => []), tufts = [], tcol = [], tc = new THREE.Color(sc.tuft || '#6a8a4a');
    for (let n = 0, nN = (sc.density || 22000) * (WH / 300) ** 2; n < nN; n++) {
      const x = (rng() * 2 - 1) * (WH - 10), z = (rng() * 2 - 1) * (WH - 10), h = hgt(x, z);
      if (world.clearSpots.some(c => Math.hypot(c.x - x, c.z - z) < c.r) || roads.some(r => segD(x, z, r) < 6)) continue;
      const r = rng(); let acc = 0, placed = false;
      for (let i = 0; i < lists.length; i++) { const [, ch, s0, s1, hiOnly] = sc.kinds[i]; acc += ch * (sc.mask ? sc.mask(x, z, N, i) : 1); if (r < acc && (!hiOnly || h > (spec.hiH ?? 11))) { lists[i].push([x, h - .2, z, rng() * 6.3, 0, 0, s0 + rng() * (s1 - s0)]); placed = true; break; } }
      if (!placed && sc.tuft && r < acc + .25) { tufts.push([x, h - .05, z, rng() * 6.3, 0, 0, .6 + rng() * .6]); tcol.push(tc.clone().multiplyScalar(.85 + rng() * .3)); }
    }
    lists.forEach((l, i) => { const [g, , , , , arg] = sc.kinds[i]; addChunked(GEO[g](arg), propMat, l, .04); });
    if (tufts.length) { const gg = new THREE.PlaneGeometry(1, .75); gg.translate(0, .37, 0); const g2 = gg.clone().rotateY(Math.PI / 2), tuft = new THREE.BufferGeometry();
      for (const k of ['position', 'normal', 'uv']) tuft.setAttribute(k, new THREE.BufferAttribute(new Float32Array([...gg.attributes[k].array, ...g2.attributes[k].array]), gg.attributes[k].itemSize));
      tuft.setIndex([...gg.index.array, ...Array.from(g2.index.array, i => i + 4)]);
      addChunked(tuft, new THREE.MeshLambertMaterial({ map: grassTex, alphaTest: .45, side: THREE.DoubleSide }), tufts, 0, tcol, 50); }
    world.trees = lists.flatMap((l, i) => sc.kinds[i][4] === 'tree' || ['pine', 'snowpine', 'oak', 'dead', 'shroom', 'birch', 'stalag'].includes(sc.kinds[i][0]) ? l.map(t => ({ x: t[0], z: t[2], r: .35 })) : []);
    world.minimap = minimap(colorAt);
    if (spec.after) spec.after({ put2, land, rng });
    return world;
  });
}
export function minimap(colorAt) {
  const mm = document.createElement('canvas'); mm.width = mm.height = 200; const g = mm.getContext('2d'), img = g.createImageData(200, 200);
  for (let y = 0; y < 200; y++) for (let x = 0; x < 200; x++) { const wx = x * (2 * WH / 200) - WH, wz = y * (2 * WH / 200) - WH, c = colorAt(wx, wz), o = (y * 200 + x) * 4;
    img.data[o] = Math.min(255, c.r ** (1 / 2.2) * 255); img.data[o + 1] = Math.min(255, c.g ** (1 / 2.2) * 255); img.data[o + 2] = Math.min(255, c.b ** (1 / 2.2) * 255); img.data[o + 3] = 255; }
  g.putImageData(img, 0, 0); return mm;
}

// ---------- instanced dungeons, from three floor plans ----------
// every plan's entrance is at the top (z 52-74); packs and bosses are slotted into its rooms in order
const PLANS = {
  nave: { rects: [[-8, 52, 8, 74], [-3, 38, 3, 52], [-18, 6, 18, 38], [-4, -6, 4, 6], [-26, -50, 26, -6], [-44, -40, -26, -16], [26, -40, 44, -16], [-3, -62, 3, -50], [-20, -92, 20, -62]],
    doors: [[0, 52], [0, 38], [0, 6], [0, -6], [-26, -28], [26, -28], [0, -50], [0, -62]],
    packs: [[-4, 60], [-10, 28], [10, 16], [-16, -20], [16, -20], [-38, -34], [38, -34], [-10, -40]], bosses: [[0, 22], [-36, -24], [36, -24], [0, -30], [0, -80]], props: [[-12, 30], [12, 30], [-12, 14], [12, 14], [-20, -14], [20, -14], [-20, -42], [20, -42], [-14, -80], [14, -80]] },
  cells: { rects: [[-8, 52, 8, 74], [-3, 36, 3, 52], [-30, 18, 30, 36], [-46, -20, -30, 36], [30, -20, 46, 36], [-30, -38, 30, -20], [-3, -50, 3, -38], [-22, -86, 22, -50]],
    doors: [[0, 52], [0, 36], [-30, 26], [30, 26], [-38, -20], [38, -20], [0, -38], [0, -50]],
    packs: [[-4, 60], [-14, 24], [14, 24], [-38, 20], [38, 20], [-38, -12], [38, -12], [-12, -28], [12, -28]], bosses: [[0, 28], [-38, 4], [38, 4], [0, -30], [0, -70]], props: [[-20, 30], [20, 30], [-38, 10], [38, 10], [-20, -30], [20, -30], [-12, -76], [12, -76]] },
  winding: { rects: [[-8, 52, 8, 74], [-4, 34, 4, 52], [-28, 4, 14, 34], [14, 14, 40, 24], [40, -16, 66, 36], [48, -40, 56, -16], [14, -76, 66, -40], [-8, -62, 14, -54], [-50, -90, -8, -30]],
    doors: [[0, 52], [0, 34], [14, 19], [40, 19], [52, -16], [52, -40], [14, -58], [-8, -58]],
    packs: [[-3, 62], [-18, 26], [2, 12], [46, 30], [60, 12], [44, -6], [26, -48], [60, -66], [-20, -40], [-40, -56]], bosses: [[-16, 14], [54, 6], [40, -60], [-30, -50], [-28, -80]], props: [[-20, 24], [8, 10], [54, 30], [60, 0], [30, -60], [-4, 62], [58, 32], [40, -66], [-30, -70], [-40, -40]] },
};
// d: { key, name, parent, plan, floor, rock, fog, light, walls, lvl:[a,b], mobs:[...], bosses:[k1..k5], prop, exitLabel, raid }
export function defineDungeon(d) {
  const pl = PLANS[d.plan];
  INSTANCES[d.key] = INSTANCES[d.key] || { parent: d.parent, name: d.name };
  ZONE_SIZE[d.key] = ZONE_SIZE[d.key] || 150;
  DBOSSES[d.key] = d.bosses.slice();
  if (!FINALS.includes(d.bosses[d.bosses.length - 1])) FINALS.push(d.bosses[d.bosses.length - 1]);
  registerZone(d.key, seed => {
    world.names = { zone: d.name, town: d.name };
    const rng = mulberry32(seed + d.key.length * 977), pk = a => a[(rng() * a.length) | 0];
    const [l0, l1] = d.lvl, nP = pl.packs.length;
    const packs = pl.packs.map(([x, z], i) => { const L = Math.round(l0 + (l1 - l0) * i / Math.max(1, nP - 1)), n = d.raid ? 4 : 2 + (i % 2); return [x, z, Array.from({ length: n }, () => pk(d.mobs)), [L, L]]; });
    const bosses = d.bosses.map((b, i) => { const [x, z] = pl.bosses[i === d.bosses.length - 1 ? pl.bosses.length - 1 : i]; return [x, z, b, Math.round(l0 + (l1 - l0) * (i + 1) / d.bosses.length), i === d.bosses.length - 1]; });
    const w = buildInstance(seed, { name: d.name, floor: d.floor, rock: d.rock, walls: d.walls !== false, fog: d.fog, light: d.light ?? .5, exitTo: d.parent, exitLabel: d.exitLabel || 'Back outside',
      rects: pl.rects, doors: pl.doors, props: pl.props.map(([x, z]) => [x, z, () => GEO[d.prop || 'lantern'](d.propArg)]), packs, bosses });
    if (d.raid) for (const s of world.spawns) { s.elite = true; s.raid12 = true; }
    return w;
  });
}
