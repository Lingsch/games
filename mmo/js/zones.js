// The Saltreach Coast (levels 11-20) and the Sunken Fleet instance.
// Coast: a mainland shore with the free port of Saltmarrow, the navy's Halyard Isle, the fishing village on Gull Isle,
// Smuggler's Rock with the open sea caves, and a reef where the drowned war fleet lies.
import * as THREE from './three.js';
import { WH, TAU, clamp, lerp, smooth, mulberry32, makeNoise } from './core.js';
import { worldGroup, toon, detailTex, grassTex, uTime, addInstanced, addChunked, propMat, propOutline, scene } from './render.js';
import * as M from './models.js';
import { build, P, T, Cone, Cyl, Box, Dod, Sph, Oct } from './models.js';
import * as CO from './coastmodels.js';
import { H, HN, hgt, world, addWall, linkDoors, mergeBuilt, mat4, meshWithOutline, ruinWallGeo, pillarGeo, campVisual, registerZone, zoneMarker, depthAt } from './world.js';
const O = [0, 0, 0];

// ---------- water ----------
let waterMesh = null;
const waterMat = new THREE.ShaderMaterial({
  transparent: true, depthWrite: false, fog: true,
  uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, { uTime: { value: 0 }, deep: { value: new THREE.Color('#1c5a78') }, shallow: { value: new THREE.Color('#4fb0b8') } }]),
  vertexShader: `uniform float uTime; varying vec3 vW; varying float vD;
    #include <fog_pars_vertex>
    void main(){ vec3 p=position; p.y+=sin(p.x*.08+uTime*1.1)*.12+cos(p.z*.07+uTime*.9)*.12; vec4 w=modelMatrix*vec4(p,1.); vW=w.xyz; vec4 mvPosition=viewMatrix*w; gl_Position=projectionMatrix*mvPosition;
    #include <fog_vertex>
    }`,
  fragmentShader: `uniform float uTime; uniform vec3 deep, shallow; varying vec3 vW;
    #include <fog_pars_fragment>
    void main(){ float r=sin(vW.x*.35+uTime*1.6)*sin(vW.z*.3-uTime*1.3); vec3 c=mix(deep,shallow,.35+.25*r); c+=vec3(.9,1.,1.)*smoothstep(.85,1.,r)*.35; gl_FragColor=vec4(c,.82);
    #include <fog_fragment>
    }`,
});
export function updateWater(t) { waterMat.uniforms.uTime.value = t; }
function addWater() { const g = new THREE.PlaneGeometry(2 * WH + 400, 2 * WH + 400, 80, 80).rotateX(-Math.PI / 2); waterMesh = new THREE.Mesh(g, waterMat); waterMesh.position.y = 0; worldGroup.add(waterMesh); }

// ---------- shared ground building ----------
function groundMesh(colorAt) {
  const SZ = 2 * WH + 40, gGeo = new THREE.PlaneGeometry(SZ, SZ, 300, 300).rotateX(-Math.PI / 2), p = gGeo.attributes.position, col = new Float32Array(p.count * 3);
  for (let i = 0; i < p.count; i++) { const x = p.getX(i), z = p.getZ(i); p.setY(i, hgt(x, z)); const c = colorAt(x, z); col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b; }
  gGeo.setAttribute('color', new THREE.BufferAttribute(col, 3)); gGeo.computeVertexNormals();
  const m = new THREE.Mesh(gGeo, new THREE.MeshLambertMaterial({ map: detailTex, vertexColors: true })); worldGroup.add(m); world.ground = m;
}
function minimapFrom(colorAt) {
  const mm = document.createElement('canvas'); mm.width = mm.height = 200;
  const g = mm.getContext('2d'), img = g.createImageData(200, 200);
  for (let y = 0; y < 200; y++) for (let x = 0; x < 200; x++) {
    const wx = x * (2 * WH / 200) - WH, wz = y * (2 * WH / 200) - WH, c = colorAt(wx, wz), o = (y * 200 + x) * 4;
    img.data[o] = Math.min(255, c.r ** (1 / 2.2) * 255); img.data[o + 1] = Math.min(255, c.g ** (1 / 2.2) * 255); img.data[o + 2] = Math.min(255, c.b ** (1 / 2.2) * 255); img.data[o + 3] = 255;
  }
  g.putImageData(img, 0, 0); return mm;
}

// ---------- the coast ----------
const ISLES = { navy: { x: -40, z: -150, R: 60 }, gull: { x: -30, z: 140, R: 52 }, rock: { x: 150, z: 20, R: 70 }, reef: { x: 160, z: 200, R: 16 } };
function coastLand(x, z, N) {
  // mainland: everything west of a wavy shore around x = -160
  const shore = -160 + (N.fbm(z * .01, 3) - .5) * 40;
  let f = smooth((shore - x) / 22);
  for (const k in ISLES) { const I = ISLES[k], d = Math.hypot(x - I.x, z - I.z) * (1 + (N.fbm(x * .02 + I.x, z * .02, 2) - .5) * .5); f = Math.max(f, smooth((I.R - d) / 24) * (k === 'reef' ? .55 : 1)); }
  return f;
}
registerZone('coast', seed => {
  const rng = mulberry32(seed + 777), N = makeNoise(seed + 777), pick = a => a[(rng() * a.length) | 0];
  world.water = 0;
  world.names = { zone: 'The Saltreach Coast', town: 'Saltmarrow', port: 'Saltmarrow', fort: 'Fort Halyard', village: 'Gullwick', navy: 'Halyard Isle', gull: 'Gull Isle', rock: "Smuggler's Rock", reef: 'The Drowned Reef', caves: 'The Smugglers’ Sea Caves',
    redwake: 'Captain Redwake', snapper: 'Old Snapper', tidecaller: 'The Tidecaller', queen: 'Mother Brine', boss: 'Admiral Morrow Vane', leviathan: 'The Leviathan of the Fleet', bosun: 'Bosun Graft' };
  const port = { x: -205, z: 0, R: 24, base: 2.2 }, fort = { x: ISLES.navy.x, z: ISLES.navy.z - 8, R: 22, base: 3 }, vill = { x: ISLES.gull.x + 6, z: ISLES.gull.z + 4, R: 16, base: 2 };
  const caves = { x: ISLES.rock.x + 40, z: ISLES.rock.z, R: 26 };
  world.port = port; world.fort = fort; world.vill = vill; world.caves = caves;
  for (let zi = 0; zi < HN; zi++) for (let xi = 0; xi < HN; xi++) {
    const x = xi - WH, z = zi - WH, f = coastLand(x, z, N);
    let h = lerp(-11 + (N.fbm(x * .02, z * .02, 2) - .5) * 4, 1.2 + N.fbm(x * .015 + 9, z * .015, 4) * 9, f);
    if (f > .2 && f < .7) h = lerp(h, 1, .4); // flatter beaches
    for (const t of [port, fort, vill]) h = lerp(t.base, h, smooth((Math.hypot(x - t.x, z - t.z) - t.R - 3) / 18));
    h = lerp(1.5, h, smooth((Math.hypot(x - caves.x, z - caves.z) - caves.R - 2) / 16));
    const edge = Math.max(Math.abs(x), Math.abs(z)) - (WH - 26), westRoad = x < -200 && Math.abs(z) < 14;
    if (edge > 0 && !westRoad) h += edge * edge * .05;
    H[zi * HN + xi] = h;
  }
  const SAND = new THREE.Color('#d8c08a'), GRASS = new THREE.Color('#7a9a4a'), ROCK = new THREE.Color('#7b8094'), SEA = new THREE.Color('#2a6a7a'), DEEP = new THREE.Color('#1a3a5a'), COB = new THREE.Color('#9a8f7c');
  const colorAt = (x, z) => {
    const h = hgt(x, z); let c;
    if (h < -4) c = DEEP.clone().lerp(SEA, smooth((h + 11) / 7)); else if (h < 1.2) c = SEA.clone().lerp(SAND, smooth((h + 4) / 4)); else c = SAND.clone().lerp(GRASS, smooth((h - 1.6) / 1.6));
    if (h > 7) c.lerp(ROCK, smooth((h - 7) / 4));
    for (const t of [port, fort, vill]) if (Math.hypot(x - t.x, z - t.z) < t.R - 1) c.lerp(COB, .55);
    if (Math.hypot(x - caves.x, z - caves.z) < caves.R) c.lerp(ROCK, .6);
    const sh = .9 + N.n2(x * .3, z * .3) * .18; return new THREE.Color(c.r * sh, c.g * sh, c.b * sh);
  };
  groundMesh(colorAt); addWater();
  world.regionNames = [world.names.port + ' Shore', world.names.navy, world.names.gull, world.names.rock, 'The Open Sea', world.names.reef];
  world.regionFn = (x, z) => { if (Math.hypot(x - ISLES.reef.x, z - ISLES.reef.z) < 40) return 5; if (x < -140) return 0; for (const [k, i] of [['navy', 1], ['gull', 2], ['rock', 3]]) if (Math.hypot(x - ISLES[k].x, z - ISLES[k].z) < ISLES[k].R + 10) return i; return 4; };

  // ---------- towns ----------
  const items = [], put = (geo, x, z, ry = 0, s = 1) => items.push({ geo, m: mat4(x, hgt(x, z), z, ry, s) });
  const soft = (x, z, r) => addWall(x - r, z, x + r, z, r * .8, true);
  // Saltmarrow: a lawless free port behind a wooden palisade
  for (let k = 0; k < 28; k++) {
    const a = k / 28 * TAU; if (Math.abs(Math.cos(a)) > .9) continue; // open to the sea (east) and the road (west)
    const x = port.x + Math.cos(a) * port.R, z = port.z + Math.sin(a) * port.R; put(build([P(T(Cyl(.25, .3, 3.2, 5), 0, 1.6), 0, O, '#6b4a2e'), P(T(Cone(.25, .5, 5), 0, 3.4), 0, O, '#6b4a2e')]), x, z);
    const a2 = (k + 1) / 28 * TAU; if (Math.abs(Math.cos(a2)) <= .9) addWall(x, z, port.x + Math.cos(a2) * port.R, port.z + Math.sin(a2) * port.R, .35);
  }
  for (const [dx, dz, r] of [[-10, -12, 0], [-14, 6, .5], [-4, 14, 1.2], [6, -14, -.4], [-18, -2, .2], [10, 12, 2.6]]) { put(M.houseGeo('human'), port.x + dx, port.z + dz, r, .9); soft(port.x + dx, port.z + dz, 1.6); }
  put(CO.hutGeo('#7a1f1c'), port.x + 4, port.z + 6, .3); soft(port.x + 4, port.z + 6, 1.5);
  // Fort Halyard: a navy fort with stone walls
  { const R = fort.R, nseg = 22, segLen = TAU * R / nseg + .2, list = [];
    for (let k = 0; k < nseg; k++) { const a = k / nseg * TAU; if (Math.abs(a - Math.PI / 2) < .45) continue; list.push([fort.x + Math.cos(a) * R, hgt(fort.x + Math.cos(a) * R, fort.z + Math.sin(a) * R), fort.z + Math.sin(a) * R, -a - Math.PI / 2, 0, 0, 1]);
      const a1 = a - TAU / nseg / 2, a3 = a + TAU / nseg / 2; addWall(fort.x + Math.cos(a1) * R, fort.z + Math.sin(a1) * R, fort.x + Math.cos(a3) * R, fort.z + Math.sin(a3) * R, .8); }
    addInstanced(M.wallGeo('human', segLen), propMat, list, .04);
    put(M.keepGeo('human'), fort.x, fort.z - 6, 0, .7); soft(fort.x, fort.z - 6, 3);
    for (const [dx, dz] of [[-9, 4], [9, 4]]) { put(M.houseGeo('human'), fort.x + dx, fort.z + dz, Math.atan2(-dx, -dz), .8); soft(fort.x + dx, fort.z + dz, 1.5); }
    world.doors.push({ x: fort.x, z: fort.z + R });
  }
  // Gullwick: a few huts and drying racks
  for (const [dx, dz, r] of [[-8, -4, .4], [6, -8, 2.2], [9, 5, 3.8], [-5, 8, 5.2]]) { put(CO.hutGeo(), vill.x + dx, vill.z + dz, r, .9); soft(vill.x + dx, vill.z + dz, 1.4); }
  for (const [dx, dz] of [[0, -2], [2, 4]]) put(build([...[-1, 1].map(s => P(T(Box(.1, 1.8, .1), s, .9), 0, O, '#5a3e28')), P(T(Box(2.2, .06, .06), 0, 1.7), 0, O, '#5a3e28'), ...[-.6, 0, .6].map(x => P(T(Sph(.15, 5, 3), x, 1.4, 0, 0, 0, 0, .5, 1.6, .4), 0, O, '#b8c8d0'))]), vill.x + dx, vill.z + dz, .5);
  meshWithOutline(mergeBuilt(items), .05);

  // ---------- docks: scan from each town toward open sea for a ferry berth ----------
  const dock = (key, name, t, ang) => {
    let x = t.x, z = t.z, land = null;
    for (let d = 0; d < 120; d += .5) { x = t.x + Math.cos(ang) * d; z = t.z + Math.sin(ang) * d; if (!land && depthAt(x, z) > .4) land = { x: t.x + Math.cos(ang) * (d - 2), z: t.z + Math.sin(ang) * (d - 2) }; if (depthAt(x, z) > 3.2) break; }
    const len = Math.hypot(x - land.x, z - land.z) + 3, ry = Math.PI / 2 - ang;
    const g = new THREE.Group(); g.position.set(land.x, 0, land.z); g.rotation.y = ry; worldGroup.add(g);
    const geo = CO.dockGeo(len); g.add(new THREE.Mesh(geo, propMat), new THREE.Mesh(geo, propOutline(.04)));
    // the dock is walkable: a thin strip of raised ground under it
    for (let d = 0; d <= len; d += .5) for (let w = -1.4; w <= 1.4; w += .5) { const px = land.x + Math.cos(ang) * d - Math.sin(ang) * w, pz = land.z + Math.sin(ang) * d + Math.cos(ang) * w, xi = Math.round(px + WH), zi = Math.round(pz + WH); if (xi > 0 && zi > 0 && xi < HN && zi < HN) H[zi * HN + xi] = Math.max(H[zi * HN + xi], 1.15); }
    const end = { key, name, x: land.x + Math.cos(ang) * (len - 1), z: land.z + Math.sin(ang) * (len - 1), ang, berth: { x: land.x + Math.cos(ang) * (len + 2.5) - Math.sin(ang) * 3.2, z: land.z + Math.sin(ang) * (len + 2.5) + Math.cos(ang) * 3.2 } };
    world.docks.push(end); return end;
  };
  dock('port', 'Saltmarrow', port, 0); dock('fort', 'Fort Halyard', fort, Math.PI / 2 + .3); dock('rock', "Smuggler's Rock", { x: ISLES.rock.x - 40, z: ISLES.rock.z }, Math.PI); dock('vill', 'Gullwick', vill, -Math.PI / 2 - .2);
  world.ferryRoute = ['port', 'fort', 'rock', 'vill'];
  // rebuild the ground now the docks raised it
  worldGroup.remove(world.ground); world.ground.geometry.dispose(); groundMesh(colorAt); worldGroup.remove(waterMesh); addWater();

  // ---------- the sea caves (open dungeon) on the east of Smuggler's Rock ----------
  { const R = caves.R, rockGeo = (len, h) => build([P(T(Box(len, h, 1.2), 0, h / 2), 0, O, '#6a6458'), ...[-1, 0, 1].map(k => P(T(Dod(1 + rng() * .6), k * len * .33, h + .2, (rng() - .5)), 0, O, '#5a554a'))]);
    const ws = [], segs = 22;
    for (let k = 0; k < segs; k++) { const a = k / segs * TAU; if (Math.abs(wrap(a - Math.PI)) < .22) continue; const a1 = a - TAU / segs / 2, a3 = a + TAU / segs / 2;
      ws.push({ geo: rockGeo(2 * R * Math.sin(TAU / segs / 2) + .6, 5 + rng() * 3), m: mat4(caves.x + Math.cos(a) * R, 1.5, caves.z + Math.sin(a) * R, -a - Math.PI / 2) });
      addWall(caves.x + Math.cos(a1) * R, caves.z + Math.sin(a1) * R, caves.x + Math.cos(a3) * R, caves.z + Math.sin(a3) * R, .8); }
    // two inner rock ridges make three caverns: the landing, the grotto, the queen's lair
    for (const [x1, x2, z] of [[-R * .9, -4, 6], [4, R * .9, 6], [-R * .9, -3, -8], [3, R * .9, -8]]) { const len = x2 - x1; ws.push({ geo: rockGeo(len, 4.5), m: mat4(caves.x + 0, 1.5, caves.z, 0) }); }
    // (ridges run north-south so the path goes east: rotate them)
    ws.length -= 4;
    for (const [z1, z2, x] of [[-R * .9, -4, -6], [4, R * .9, -6], [-R * .9, -3, 9], [3, R * .9, 9]]) { const len = z2 - z1; ws.push({ geo: rockGeo(len, 4.5), m: mat4(caves.x + x, 1.5, caves.z + (z1 + z2) / 2, Math.PI / 2) }); addWall(caves.x + x, caves.z + z1, caves.x + x, caves.z + z2, .7); }
    for (let k = 0; k < 6; k++) ws.push({ geo: build([P(T(Cyl(.05, .05, 1.2, 4), 0, .6), 0, O, '#3b2a1c'), P(T(Cone(.18, .4, 5), 0, 1.35), 0, O, '#ff9a3a', 2.5)]), m: mat4(caves.x - 18 + k * 7, 1.5, caves.z + (k % 2 ? 10 : -10)) });
    meshWithOutline(mergeBuilt(ws), .05);
    world.doors.push({ x: caves.x - R, z: caves.z }, { x: caves.x - 6, z: caves.z }, { x: caves.x + 9, z: caves.z });
  }
  // the reef: wrecks breaking the surface and a buoy over the deep wreck
  { const ws = []; for (const [dx, dz, r] of [[-8, 4, .6], [9, -6, 2.4], [2, 12, 4]]) ws.push({ geo: CO.wreckGeo(), m: mat4(ISLES.reef.x + dx, -1.6, ISLES.reef.z + dz, r) });
    ws.push({ geo: build([P(T(Cyl(.6, .8, 1.2, 8), 0, .2), 0, O, '#c0392b'), P(T(Cyl(.08, .08, 2.5, 4), 0, 1.8), 0, O, '#3b2a1c'), P(T(Oct(.3), 0, 3.2), 0, O, '#8dffef', 3)]), m: mat4(ISLES.reef.x, -.3, ISLES.reef.z) });
    meshWithOutline(mergeBuilt(ws), .05);
    world.buoy = { x: ISLES.reef.x, z: ISLES.reef.z };
  }
  linkDoors();

  // ---------- places, towns, zone line ----------
  world.places = [{ name: 'Saltmarrow', x: port.x, z: port.z, R: port.R + 2, kind: 'town' }, { name: 'Fort Halyard', x: fort.x, z: fort.z, R: fort.R + 2, kind: 'town' }, { name: 'Gullwick', x: vill.x, z: vill.z, R: vill.R + 4, kind: 'town' },
    { name: world.names.caves, x: caves.x, z: caves.z, R: caves.R, kind: 'dungeon' }];
  world.town = port;
  world.mapLabels = [{ t: 'Crabs (11-12) · Pirates (12-13)', x: -230, z: 70 }, { t: 'Merfolk, storms (13-15)', x: ISLES.navy.x, z: ISLES.navy.z + 22 }, { t: 'Drowned, crabs (12-14)', x: ISLES.gull.x, z: ISLES.gull.z + 30 },
    { t: 'Smugglers (15-16)', x: ISLES.rock.x - 20, z: ISLES.rock.z + 46 }, { t: 'Sharks (14-16)', x: 60, z: 90 }, { t: 'Drowned Reef (17-19)', x: ISLES.reef.x, z: ISLES.reef.z + 22 }];
  world.towns = [
    { key: 'port', name: 'Saltmarrow', x: port.x, z: port.z, R: port.R, npcs: [['giver', 'quell', -2, -6], ['giver', 'tessaly', 6, 2], ['giver', 'steward', -8, 4], ['vendor', 'port', 2, 8], ['bind', null, -2, 4], ['armory', null, 8, -6]], guards: [[18, 0], [-20, 0]] },
    { key: 'fort', name: 'Fort Halyard', x: fort.x, z: fort.z, R: fort.R, npcs: [['giver', 'ashby', 0, 2], ['vendor', 'fort', -5, -2], ['bind', null, 4, -2]], guards: [[2, fort.R - 3], [-2, fort.R - 3], [6, 0], [-6, 0]] },
    { key: 'vill', name: 'Gullwick', x: vill.x, z: vill.z, R: vill.R, npcs: [['giver', 'wenna', 2, 0], ['vendor', 'vill', -3, 3], ['bind', null, 0, -4]], guards: [] },
  ];
  { const zx = -WH + 14, zz = 0; world.zoneLines.push({ x: zx, z: zz, r: 9, to: 'vale', label: 'To the Vale (levels 1-10)' }); zoneMarker(zx, zz, Math.PI / 2); }
  world.zoneLines.push({ x: world.buoy.x, z: world.buoy.z, r: 4, to: 'fleet', label: 'Dive to the Sunken Fleet (6-person instance, level 20, hard)' });

  // ---------- spawns ----------
  const sp = world.spawns, put2 = o => sp.push({ ...o, alive: null, timer: 0 });
  const near = (p, min) => sp.some(s => Math.hypot(s.x - p.x, s.z - p.z) < min);
  const inTown = p => world.towns.some(t => Math.hypot(p.x - t.x, p.z - t.z) < t.R + 12) || Math.hypot(p.x - caves.x, p.z - caves.z) < caves.R + 6;
  const tryP = (fn, test) => { for (let i = 0; i < 300; i++) { const p = fn(); if (test(p)) return p; } return null; };
  const landIn = (I, minD = 8) => tryP(() => { const a = rng() * TAU, d = rng() * I.R * .9; return { x: I.x + Math.cos(a) * d, z: I.z + Math.sin(a) * d }; }, p => hgt(p.x, p.z) > .8 && !inTown(p) && !near(p, minD));
  const shore = (minD = 8) => tryP(() => ({ x: -150 - rng() * 120, z: (rng() - .5) * 520 }), p => hgt(p.x, p.z) > .6 && hgt(p.x, p.z) < 6 && !inTown(p) && !near(p, minD) && Math.abs(p.z) > 30);
  // mainland shore: crabs and two pirate camps, levels 11-13; the captain's placeholder
  for (let i = 0; i < 16; i++) { const p = shore(); if (p) put2({ ...p, mob: 'crab', lvl: [11, 12], respawn: 50, area: 0 }); }
  [[-180, -110], [-178, 115]].forEach(([cx, cz], ci) => { world.camps.push({ x: cx, z: cz, kind: 'pirate' }); campVisual(cx, hgt(cx, cz), cz, 'human', rng);
    for (let k = 0; k < 6; k++) { const a = k / 6 * TAU, r = 4 + rng() * 3; put2({ x: cx + Math.cos(a) * r, z: cz + Math.sin(a) * r, mob: k % 3 === 2 ? 'smuggler' : 'pirate', lvl: [12, 13], respawn: 70, camp: 'pc' + ci, area: 0, ph: ci === 0 && k === 0 ? { named: 'redwake', key: 'redwake', chance: .25, lvl: 14 } : null }); } });
  // Halyard Isle: merfolk on the beaches, storm elementals on the heights, levels 13-15
  for (let i = 0; i < 12; i++) { const p = landIn(ISLES.navy); if (p) put2({ ...p, mob: hgt(p.x, p.z) > 6 ? 'stormelem' : 'merfolk', lvl: [13, 15], respawn: 70, area: 1 }); }
  // Gull Isle: crabs and the drowned crawling ashore, levels 12-14; Old Snapper on the south beach
  for (let i = 0; i < 12; i++) { const p = landIn(ISLES.gull); if (p) put2({ ...p, mob: i % 3 ? 'drowned' : 'crab', lvl: [12, 14], respawn: 65, area: 1 }); }
  { const p = landIn(ISLES.gull, 4) || { x: ISLES.gull.x, z: ISLES.gull.z + 30 }; put2({ ...p, mob: 'crabbig', lvl: [14, 14], respawn: 240, named: 'snapper', area: 1 }); }
  // Smuggler's Rock: a smugglers' camp and storm elementals, 15-17; the Tidecaller on the peak
  { const cx = ISLES.rock.x - 15, cz = ISLES.rock.z - 30; world.camps.push({ x: cx, z: cz, kind: 'smuggler' }); campVisual(cx, hgt(cx, cz), cz, 'human', rng);
    for (let k = 0; k < 7; k++) { const a = k / 7 * TAU, r = 4 + rng() * 3; put2({ x: cx + Math.cos(a) * r, z: cz + Math.sin(a) * r, mob: k % 3 === 1 ? 'pirate' : 'smuggler', lvl: [15, 16], respawn: 75, camp: 'sc', area: 2 }); } }
  for (let i = 0; i < 9; i++) { const p = landIn(ISLES.rock, 10); if (p) put2({ ...p, mob: hgt(p.x, p.z) > 5 ? 'stormelem' : 'merfolk', lvl: [15, 17], respawn: 75, area: 2 }); }
  { const p = landIn({ ...ISLES.rock, R: 25 }, 4) || ISLES.rock; put2({ x: p.x, z: p.z, mob: 'stormelem', lvl: [17, 17], respawn: 300, named: 'tidecaller', area: 2 }); }
  // the sea caves: smugglers and the drowned, elite, 15-17, and Mother Brine
  [[-14, 0], [-14, 9], [-14, -9]].forEach(([x, z], i) => { for (let k = 0; k < 2; k++) put2({ x: caves.x + x + k * 1.8, z: caves.z + z, mob: 'smuggler', lvl: [15, 16], respawn: 150, camp: 'cv' + i, area: 3, dungeon: true, elite: true }); });
  [[2, 10], [2, -10], [2, 0]].forEach(([x, z], i) => { for (let k = 0; k < 3; k++) put2({ x: caves.x + x + (k % 2) * 1.8, z: caves.z + z + k, mob: k === 1 ? 'drownedcaster' : 'drowned', lvl: [16, 16], respawn: 170, camp: 'cg' + i, area: 3, dungeon: true, elite: true }); });
  put2({ x: caves.x + 18, z: caves.z, mob: 'queen', lvl: [17, 17], respawn: 400, named: 'queen', area: 3, dungeon: true, boss2: true });
  // open sea: sharks between the islands, 14-16
  for (let i = 0; i < 10; i++) { const p = tryP(() => ({ x: (rng() - .5) * 360, z: (rng() - .5) * 400 }), p => depthAt(p.x, p.z) > 5 && !near(p, 25)); if (p) put2({ ...p, mob: 'shark', lvl: [14, 16], respawn: 80, area: 4 }); }
  // the reef: the drowned on the wrecks, 17-19
  for (let i = 0; i < 8; i++) { const a = i / 8 * TAU, r = 7 + rng() * 6; put2({ x: ISLES.reef.x + Math.cos(a) * r, z: ISLES.reef.z + Math.sin(a) * r, mob: i % 3 === 2 ? 'drownedcaster' : 'drowned', lvl: [17, 19], respawn: 90, area: 5, camp: 'rf' + (i >> 1) }); }
  for (const s of sp) s.y = hgt(s.x, s.z);
  world.huntAreas = [{ area: 0, lvl: [10, 13] }, { area: 1, lvl: [12, 15] }, { area: 2, lvl: [15, 18] }, { area: 5, lvl: [17, 20] }];

  // ---------- scenery ----------
  const palms = [], rocks = [], tufts = [], tcol = [];
  for (let n = 0; n < 30000; n++) {
    const x = (rng() * 2 - 1) * (WH - 10), z = (rng() * 2 - 1) * (WH - 10), h = hgt(x, z);
    if (h < 1 || inTown({ x, z }) || sp.some(s => Math.hypot(s.x - x, s.z - z) < 2.5) || Math.abs(z) < 5 && x < -200) continue;
    const r = rng();
    if (h < 3.5 && r < .035) palms.push([x, h - .2, z, rng() * 6.3, 0, 0, .8 + rng() * .5]);
    else if (h > 5 && r < .05) rocks.push([x, h - .3, z, rng() * 6.3, 0, 0, .8 + rng() * 1.2]);
    else if (h > 1.8 && r < .5) { tufts.push([x, h - .05, z, rng() * 6.3, 0, 0, .7 + rng() * .7]); tcol.push(new THREE.Color(.62, .66, .36)); }
  }
  addChunked(CO.palmGeo(), propMat, palms, .04); addChunked(M.rockGeo('#8a8478', '#6c8a46'), propMat, rocks, .04);
  { const gg = new THREE.PlaneGeometry(1, .75); gg.translate(0, .37, 0); const g2 = gg.clone().rotateY(Math.PI / 2), tuft = new THREE.BufferGeometry();
    for (const k of ['position', 'normal', 'uv']) tuft.setAttribute(k, new THREE.BufferAttribute(new Float32Array([...gg.attributes[k].array, ...g2.attributes[k].array]), gg.attributes[k].itemSize));
    tuft.setIndex([...gg.index.array, ...Array.from(g2.index.array, i => i + 4)]);
    addChunked(tuft, new THREE.MeshLambertMaterial({ map: grassTex, alphaTest: .45, side: THREE.DoubleSide }), tufts, 0, tcol, 50); }
  world.trees = palms.map(t => ({ x: t[0], z: t[2], r: .3 }));
  world.minimap = minimapFrom(colorAt);
  return world;
});
function wrap(a) { while (a > Math.PI) a -= TAU; while (a < -Math.PI) a += TAU; return a; }

// ---------- the Sunken Fleet (instance) ----------
// The drowned admiral holds the seabed inside a bubble of dark water, so you can walk and breathe.
registerZone('fleet', seed => {
  const rng = mulberry32(seed + 999), N = makeNoise(seed + 999);
  world.names = { zone: 'The Sunken Fleet', town: 'the Sunken Fleet', bosun: 'Bosun Graft', boss: 'Admiral Morrow Vane', leviathan: 'The Leviathan of the Fleet' };
  world.underwater = true;
  for (let zi = 0; zi < HN; zi++) for (let xi = 0; xi < HN; xi++) { const x = xi - WH, z = zi - WH, d = Math.hypot(x, z); H[zi * HN + xi] = (N.fbm(x * .04, z * .04, 3) - .5) * 1.6 + smooth((d - 70) / 20) * 14; }
  const SANDD = new THREE.Color('#5a6a6a'), WEED = new THREE.Color('#3a5a4a');
  const colorAt = (x, z) => SANDD.clone().lerp(WEED, N.fbm(x * .1, z * .1, 2)).multiplyScalar(.9 + N.n2(x * .3, z * .3) * .2);
  groundMesh(colorAt);
  // the bubble
  const dome = new THREE.Mesh(new THREE.SphereGeometry(74, 32, 16, 0, TAU, 0, Math.PI / 2), new THREE.MeshBasicMaterial({ color: '#4fb0b8', transparent: true, opacity: .12, side: THREE.BackSide, depthWrite: false }));
  worldGroup.add(dome);
  for (let k = 0; k < 40; k++) { const a = k / 40 * TAU, a2 = (k + 1) / 40 * TAU; addWall(Math.cos(a) * 68, Math.sin(a) * 68, Math.cos(a2) * 68, Math.sin(a2) * 68, 1); }
  // wrecks form the lanes: the approach (south), the gun decks (sides), the flagship arena (north)
  const ws = [], hull = (x, z, ry, s = 1) => { ws.push({ geo: CO.wreckGeo(), m: mat4(x, 0, z, ry, s) }); const L = 6 * s, dx = Math.sin(ry) * L, dz = Math.cos(ry) * L; addWall(x - dx, z - dz, x + dx, z + dz, 1.8 * s); };
  hull(-12, 40, .1); hull(12, 40, -.1); hull(-26, 12, .6); hull(26, 12, -.6); hull(-14, -8, 1.3); hull(14, -8, -1.3);
  ws.push({ geo: CO.wreckGeo(), m: mat4(0, 0, -52, Math.PI / 2, 2.2) });
  for (let k = 0; k < 30; k++) { const a = rng() * TAU, d = 20 + rng() * 45; ws.push({ geo: build([P(T(Cyl(.05, .08, 2 + rng() * 3, 4), 0, 1.5), 0, O, '#3a6a4a'), P(T(Sph(.3, 5, 4), 0, 3.2), 0, O, '#5a9a6a', .6)]), m: mat4(Math.cos(a) * d, 0, Math.sin(a) * d, rng() * 6) }); }
  meshWithOutline(mergeBuilt(ws), .05);
  world.doors = [{ x: 0, z: 40 }, { x: 0, z: 12 }, { x: 0, z: -8 }];
  linkDoors();
  world.places = [{ name: 'The Sunken Fleet', x: 0, z: 0, R: 70, kind: 'dungeon' }];
  world.regionNames = ['The Sunken Fleet']; world.regionFn = () => 0;
  world.town = { x: 0, z: 58, R: 4 }; world.towns = [];
  world.zoneLines.push({ x: 0, z: 62, r: 3.5, to: 'coast', label: 'Swim back up to the reef' });
  const sp = world.spawns, put2 = o => sp.push({ ...o, y: hgt(o.x, o.z), alive: null, timer: 0 });
  // four elite packs, then the bosun, then the admiral (and what he calls)
  [[0, 30], [-22, 22], [22, 22], [0, 4]].forEach(([x, z], i) => { for (let k = 0; k < 4; k++) put2({ x: x + (k % 2) * 2.2 - 1.1, z: z + (k > 1 ? 2 : 0), mob: k === 3 ? 'drownedpriest' : k === 2 ? 'drownedcaster' : 'drowned', lvl: [19, 20], respawn: 99999, camp: 'f' + i, area: 0, dungeon: true, elite: true }); });
  put2({ x: 0, z: -14, mob: 'bosun', lvl: [20, 20], respawn: 99999, named: 'bosun', area: 0, dungeon: true, boss2: true });
  put2({ x: 0, z: -40, mob: 'admiral', lvl: [20, 20], respawn: 99999, named: 'admiral', area: 0, dungeon: true, boss: true });
  world.huntAreas = [];
  world.minimap = minimapFrom((x, z) => Math.hypot(x, z) > 68 ? new THREE.Color('#0e2030') : colorAt(x, z));
  return world;
});
