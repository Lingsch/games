// Seeded world: heightmap, biomes, scenery, and four walled cities with their lore.
import * as THREE from './three.js';
import { WH, TAU, clamp, lerp, smooth, mulberry32, makeNoise } from './core.js';
import { worldGroup, toon, detailTex, grassTex, uCorr, uTime, corrUV, addInstanced, addChunked, propMat, propOutline } from './render.js';
import * as M from './models.js';
import { build, P, T, Cone, Cyl, Box, Dod } from './models.js';
const O = [0, 0, 0];

export const HN = 2 * WH + 1;
export const H = new Float32Array(HN * HN), B = new Uint8Array(HN * HN);
export const BIOMES = [
  { name: 'Meadow', col: '#a3a058', map: '#9c9a5a' }, { name: 'Forest', col: '#5f7f3c', map: '#4f6b35' },
  { name: 'Desert', col: '#dcc086', map: '#d6bb82' }, { name: 'Tundra', col: '#eef3f5', map: '#e3ebee' }, { name: 'Swamp', col: '#5c6a44', map: '#56603e' }];
export const world = { seed: 0, cities: [], camps: [], minimap: null };

export function hgt(x, z) {
  const fx = clamp(x + WH, 0, HN - 1.001), fz = clamp(z + WH, 0, HN - 1.001), xi = fx | 0, zi = fz | 0, u = fx - xi, v = fz - zi, i = zi * HN + xi;
  const a = H[i], b = H[i + 1], c = H[i + HN], d = H[i + HN + 1];
  let h = a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  const out = Math.max(Math.abs(x), Math.abs(z)) - WH; if (out > 0) h += out * 1.6;
  return h;
}
export const biomeAt = (x, z) => B[clamp(Math.round(z + WH), 0, HN - 1) * HN + clamp(Math.round(x + WH), 0, HN - 1)];

// ---------- lore ----------
const SYL_A = ['Ash', 'Thorn', 'Vel', 'Mor', 'Gal', 'Iron', 'Wyr', 'Crow', 'Dun', 'Grim', 'Hal', 'Brack', 'Sorrow', 'Kel', 'Vane', 'Holl'];
const SYL_B = ['ford', 'hold', 'mere', 'gate', 'wick', 'fell', 'moor', 'reach', 'haven', 'crag', 'stead', 'barrow'];
const ORC_A = ['Gor', 'Skar', 'Uzg', 'Brak', 'Mug', 'Thrak', 'Krul', 'Zog'];
const ORC_B = ['nash', 'gul', 'mok', 'dur', 'rakk', 'zug', 'grim'];
const LORDS_H = ['Varric', 'Aldous', 'Merel', 'Osric', 'Ysolde', 'Corwen', 'Hestia', 'Bran'];
const LORDS_O = ['Gruk', 'Maw-Hagra', 'Skullgnaw', 'Old Tusk', 'Brakka', 'Ulgra'];
const CAMP_H = ['Captain', 'Bandit-lord', 'Sergeant', 'Old', 'Red'];
const CAMP_O = ['the Flayer', 'Skullsplitter', 'the Hungry', 'Ironjaw', 'the Burned'];
const DESC_H = [
  'raised its walls the year the rivers burned. The stones remember heat, and do not welcome it.',
  'still rings its tithe-bells at dusk. No one living recalls what is being paid for.',
  'swears by a crown that was melted down for coin three generations past.',
  'drew pilgrims to its healing wells. The wells are dry. The pilgrims stayed.',
  'teaches its archers to aim for the light. Summoners burn brightest.',
  'keeps a water-stained charter: "No flame shall be kindled within these walls save by the Warden\'s leave."'];
const DESC_O = [
  'was built from the bones of the town that stood here first. The orcs found the bones sturdy.',
  'counts its wealth in iron teeth. Each tooth was once in someone\'s mouth.',
  'sends up smoke that can be seen three days off. They burn what they cannot eat.',
  'is ruled by whoever last survived the pit. The pit is never empty for long.'];
export const CAPTURE_LINES = [
  'is ash and glass now. Its people remember you as weather.',
  'takes the flame. The old banners curl like leaves.',
  'raises a spire of living ember where its keep once stood.',
  'falls quiet. Only the wind, which is yours, still speaks there.'];
export const PERKS = [
  { id: 'dmg', text: 'Horde strikes 10% harder' }, { id: 'regen', text: '+1 mana per second' },
  { id: 'cap', text: '+20 horde cap' }, { id: 'gold', text: '+25% gold income' },
  { id: 'cheap', text: 'Spells cost 10% less mana' }, { id: 'hp', text: '+15 maximum health' }];

// ---------- helpers ----------
function mergeBuilt(items) { // items: [{geo (from build), m: Matrix4}]
  let n = 0; for (const it of items) n += it.geo.attributes.position.count;
  const out = { position: new Float32Array(n * 3), normal: new Float32Array(n * 3), color: new Float32Array(n * 3), pivot: new Float32Array(n * 3), part: new Float32Array(n), glow: new Float32Array(n) };
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
  for (const k of ['position', 'normal', 'color', 'pivot']) g.setAttribute(k, new THREE.BufferAttribute(out[k], 3));
  g.setAttribute('part', new THREE.BufferAttribute(out.part, 1)); g.setAttribute('glow', new THREE.BufferAttribute(out.glow, 1));
  g.computeBoundingSphere(); return g;
}
const mat4 = (x, y, z, ry = 0, s = 1) => new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, ry, 0)), new THREE.Vector3(s, s, s));
function meshWithOutline(geo, thick, parent) {
  const m = new THREE.Mesh(geo, propMat), ol = new THREE.Mesh(geo, propOutline(thick));
  const g = new THREE.Group(); g.add(m, ol); parent.add(g); return g;
}

export function disposeWorld() {
  worldGroup.traverse(o => { if (o.geometry) o.geometry.dispose(); });
  worldGroup.clear();
  world.cities = [];
}

export function generateWorld(seed, style = 'elem') {
  disposeWorld();
  world.seed = seed;
  const rng = mulberry32(seed), N = makeNoise(seed), pick = a => a[(rng() * a.length) | 0];
  // biome + raw height
  const climate = (x, z) => [N.fbm(x * .007 + 31, z * .007 + 17, 3), N.fbm(x * .007 + 211, z * .007 + 97, 3)];
  const biomeOf = (x, z, t, m) => {
    if (Math.hypot(x, z) < 26) return 0;
    if (t < .4) return 3; if (t > .57 && m < .48) return 2; if (m > .57) return 4; if (m > .5) return 1; return 0;
  };
  const rawH = (x, z, t, m) => {
    const base = (N.fbm(x * .018, z * .018, 4) - .5) * 18;
    const desert = smooth((t - .55) / .05) * smooth((.5 - m) / .05);
    return base + Math.max(0, .42 - t) * 45 - Math.max(0, m - .57) * 14 + Math.sin(x * .16 + z * .05) * 1.3 * desert;
  };
  // cities
  const cities = [], a0 = rng() * TAU, dists = [250, 268, 286, 300, 400, 420, 440, 460], perks = [...PERKS].sort(() => rng() - .5);
  // an inner ring of four cities, and an outer ring of four harder ones between them
  for (let i = 0; i < 8; i++) {
    const a = a0 + (i % 4) * TAU / 4 + (i >= 4 ? TAU / 8 : 0) + (rng() - .5) * (i >= 4 ? .5 : .9), d = dists[i];
    const x = clamp(Math.cos(a) * d, -WH + 34, WH - 34), z = clamp(Math.sin(a) * d, -WH + 34, WH - 34);
    const tier = i < 4 ? i + 1 : i - 1, faction = i % 2 ? 'orc' : 'human';
    const [t, m] = climate(x, z);
    const name = faction === 'human' ? pick(SYL_A) + pick(SYL_B) : pick(ORC_A) + pick(ORC_B);
    cities.push({
      i, name, tier, faction, x, z, R: 10 + tier * 1.6, base: rawH(x, z, t, m), state: 'hostile',
      wallMax: 450 * tier, wallHP: 450 * tier, gateMax: 160 * tier, gateHP: 160 * tier, towerHP: [0, 1, 2, 3].map(() => 70 * tier), sally: false, gateAng: Math.atan2(-z, -x),
      heartMax: 150, heartHP: 150, lordAlive: true,
      lordName: faction === 'human' ? `Lord ${pick(LORDS_H)} of ${name}` : `${pick(LORDS_O)}, Warlord of ${name}`,
      desc: `${name} ${pick(faction === 'human' ? DESC_H : DESC_O)}`, capLine: `${name} ${pick(CAPTURE_LINES)}`,
      perk: perks[i % perks.length], discovered: false, garrison: false, buildings: [0, 1, 2, 3].map(() => ({ type: null, lvl: 0 })),
      towerCD: [0, 0, 0, 0], spireCD: [0, 0, 0, 0], raid: false, lordSpawned: false,
    });
  }
  // camps: pockets of enemies with a chieftain, spread between you and the cities
  const camps = [];
  const campDists = [46, 62, 78];
  for (let n = 0; n < 9000 && camps.length < 72; n++) {
    const forced = camps.length < campDists.length;
    const a = rng() * TAU, d = forced ? campDists[camps.length] : 40 + Math.sqrt(rng()) * 430;
    const x = Math.cos(a) * d, z = Math.sin(a) * d;
    if (Math.abs(x) > WH - 30 || Math.abs(z) > WH - 30) continue;
    if (camps.some(c => Math.hypot(c.x - x, c.z - z) < 38) || cities.some(c => Math.hypot(c.x - x, c.z - z) < c.R + 40)) continue;
    const tier = clamp(1 + Math.floor((d - 30) / 55), 1, 6), faction = rng() < .5 ? 'human' : 'orc';
    const nm = faction === 'human' ? `${pick(CAMP_H)} ${pick(LORDS_H)}` : `${pick(LORDS_O)} ${pick(CAMP_O)}`;
    camps.push({ i: camps.length, x, z, tier, faction, chief: nm, place: faction === 'human' ? `${pick(SYL_A)}${pick(SYL_B)} Bandit Camp` : `${pick(ORC_A)}${pick(ORC_B)} Warcamp`,
      spawned: false, cleared: false, alive: 0, alert: false, discovered: false });
  }
  world.camps = camps;
  const startH = (() => { const [t, m] = climate(0, 0); return rawH(0, 0, t, m); })();
  // heightmap + biome grid
  for (let zi = 0; zi < HN; zi++) for (let xi = 0; xi < HN; xi++) {
    const x = xi - WH, z = zi - WH, [t, m] = climate(x, z);
    let h = rawH(x, z, t, m);
    h = lerp(startH, h, smooth((Math.hypot(x, z) - 10) / 24));
    for (const c of cities) h = lerp(c.base, h, smooth((Math.hypot(x - c.x, z - c.z) - c.R - 4) / 30));
    const edge = Math.max(Math.abs(x), Math.abs(z)) - (WH - 14); if (edge > 0) h += edge * edge * .12;
    H[zi * HN + xi] = h; B[zi * HN + xi] = biomeOf(x, z, t, m);
  }
  // ground
  const SZ = 2 * WH + 90, gGeo = new THREE.PlaneGeometry(SZ, SZ, 460, 460).rotateX(-Math.PI / 2);
  { const p = gGeo.attributes.position, col = new Float32Array(p.count * 3), cs = BIOMES.map(b => new THREE.Color(b.col)), rock = new THREE.Color('#7b8094');
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), z = p.getZ(i); p.setY(i, hgt(x, z));
      const out = Math.max(Math.abs(x), Math.abs(z)) - (WH - 10), c = cs[biomeAt(x, z)].clone().lerp(rock, smooth(out / 12)), sh = .93 + N.n2(x * .3, z * .3) * .14;
      col[i * 3] = c.r * sh; col[i * 3 + 1] = c.g * sh; col[i * 3 + 2] = c.b * sh;
    }
    gGeo.setAttribute('color', new THREE.BufferAttribute(col, 3)); gGeo.computeVertexNormals(); }
  const gMat = new THREE.MeshLambertMaterial({ map: detailTex, vertexColors: true });
  gMat.onBeforeCompile = s => {
    s.uniforms.uCorr = uCorr;
    s.vertexShader = s.vertexShader.replace('#include <common>', '#include <common>\nvarying vec2 vCuv;').replace('#include <begin_vertex>', '#include <begin_vertex>\n' + corrUV('position'));
    s.fragmentShader = s.fragmentShader.replace('#include <common>', '#include <common>\nuniform sampler2D uCorr;varying vec2 vCuv;')
      .replace('#include <color_fragment>', '#include <color_fragment>\nvec4 cr=texture2D(uCorr,vCuv);diffuseColor.rgb=mix(diffuseColor.rgb,cr.rgb,cr.a);')
      .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\ntotalEmissiveRadiance+=cr.rgb*cr.a*step(.45,cr.r-cr.g)*1.6;');
  };
  gMat.customProgramCacheKey = () => 'ground';
  const ground = new THREE.Mesh(gGeo, gMat); worldGroup.add(ground); world.ground = ground;

  // scenery
  const lists = { pine: [], spine: [], oak: [], dead: [], rock: [], srock: [], irock: [], cactus: [] }, tufts = [], tcol = [];
  const blocked = (x, z) => Math.hypot(x, z) < 9 || cities.some(c => Math.hypot(x - c.x, z - c.z) < c.R + 5) || camps.some(c => Math.hypot(x - c.x, z - c.z) < 11);
  const dens = [ // per biome: [list, chance]
    [['oak', .1], ['rock', .08], ['dead', .02]], [['pine', .5], ['oak', .05], ['rock', .05]],
    [['cactus', .09], ['srock', .1], ['dead', .02]], [['spine', .28], ['irock', .1]], [['dead', .22], ['rock', .05]]];
  for (let n = 0; n < 80000; n++) {
    const x = (rng() * 2 - 1) * (WH - 6), z = (rng() * 2 - 1) * (WH - 6);
    if (blocked(x, z)) continue;
    const b = biomeAt(x, z), r = rng();
    let acc = 0;
    for (const [k, p] of dens[b]) { acc += p; if (r < acc) { lists[k].push([x, hgt(x, z) - .2, z, rng() * 6.3, (rng() - .5) * .1, (rng() - .5) * .1, .7 + rng() * .8]); break; } }
  }
  const tuftCol = [[.62, .66, .32], [.4, .55, .26], [.72, .62, .4], null, [.32, .4, .22]];
  for (let n = 0; n < 110000; n++) {
    const x = (rng() * 2 - 1) * (WH - 4), z = (rng() * 2 - 1) * (WH - 4), b = biomeAt(x, z);
    if (!tuftCol[b] || (b === 2 && rng() < .8) || blocked(x, z)) continue;
    tufts.push([x, hgt(x, z) - .05, z, rng() * 6.3, 0, 0, .7 + rng() * .8]); tcol.push(tuftCol[b]);
  }
  addChunked(M.pineGeo(false), propMat, lists.pine, .05); addChunked(M.pineGeo(true), propMat, lists.spine, .05);
  addChunked(M.oakGeo(), propMat, lists.oak, .05); addChunked(M.deadGeo(), propMat, lists.dead, .03);
  addChunked(M.rockGeo('#827c72', '#6c8a46'), propMat, lists.rock, .04); addChunked(M.rockGeo('#c9a46e', '#b58f5e'), propMat, lists.srock, .04);
  addChunked(M.rockGeo('#aeb9c4', '#dfe8ee'), propMat, lists.irock, .04); addChunked(M.cactusGeo(), propMat, lists.cactus, .04);
  { // grass tufts that take on the land's colour
    const gg = new THREE.PlaneGeometry(1, .75); gg.translate(0, .37, 0);
    const g2 = gg.clone().rotateY(Math.PI / 2), tuft = new THREE.BufferGeometry();
    for (const k of ['position', 'normal', 'uv']) tuft.setAttribute(k, new THREE.BufferAttribute(new Float32Array([...gg.attributes[k].array, ...g2.attributes[k].array]), gg.attributes[k].itemSize));
    tuft.setIndex([...gg.index.array, ...Array.from(g2.index.array, i => i + 4)]);
    const gm = new THREE.MeshLambertMaterial({ map: grassTex, alphaTest: .45, side: THREE.DoubleSide });
    gm.onBeforeCompile = s => {
      s.uniforms.uTime = uTime; s.uniforms.uCorr = uCorr;
      s.vertexShader = s.vertexShader.replace('#include <common>', '#include <common>\nuniform float uTime;uniform sampler2D uCorr;varying vec4 vCr;')
        .replace('#include <begin_vertex>', `#include <begin_vertex>
vec3 ip=(instanceMatrix*vec4(0.,0.,0.,1.)).xyz;
vCr=texture2D(uCorr,vec2((ip.x+${WH.toFixed(1)})/${(2 * WH).toFixed(1)},(${WH.toFixed(1)}-ip.z)/${(2 * WH).toFixed(1)}));
transformed.y*=1.-vCr.a*.45;
transformed.x+=sin(uTime*2.1+ip.x*.35+ip.z*.2)*.12*position.y;`);
      s.fragmentShader = s.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec4 vCr;')
        .replace('#include <map_fragment>', '#include <map_fragment>\ndiffuseColor.rgb=mix(diffuseColor.rgb,vCr.rgb*1.25,vCr.a*.85);');
    };
    gm.customProgramCacheKey = () => 'grass';
    addChunked(tuft, gm, tufts, 0, tcol.map(c => new THREE.Color(c[0], c[1], c[2])), 60);
  }
  // distant mountains
  const mts = [];
  for (let i = 0; i < 140; i++) { const a = i / 140 * TAU + (rng() - .5) * .05, d = WH + 40 + rng() * 60; mts.push([Math.cos(a) * d, -2, Math.sin(a) * d, rng() * 6, 0, 0, 1]); }
  const mtMesh = addInstanced(new THREE.ConeGeometry(1, 1, 6), toon({ color: '#626a88' }), mts);
  { const o = new THREE.Object3D(); mts.forEach((t, i) => { o.position.set(t[0], t[1], t[2]); o.rotation.y = t[3]; o.scale.set(22 + rng() * 22, 30 + rng() * 40, 22 + rng() * 22); o.updateMatrix(); mtMesh.setMatrixAt(i, o.matrix); }); }

  // city meshes
  for (const c of cities) {
    const grp = new THREE.Group(); grp.position.set(c.x, c.base, c.z); worldGroup.add(grp); c.group = grp;
    const nseg = Math.round(TAU * c.R / 3.2), segLen = TAU * c.R / nseg + .2;
    c.wallList = []; c.collapse = [];
    for (let k = 0; k < nseg; k++) { const a = k / nseg * TAU; c.wallList.push([Math.cos(a) * c.R, 0, Math.sin(a) * c.R, -a - Math.PI / 2, 0, 0, 1]); c.collapse.push(rng()); }
    c.walls = addInstanced(M.wallGeo(c.faction, segLen), propMat, c.wallList, .04, grp);
    // the gate faces the way you came from
    c.gateSeg = Math.round(((c.gateAng + TAU) % TAU) / TAU * nseg) % nseg;
    { const t = c.wallList[c.gateSeg]; c.gate = new THREE.Group(); c.gate.position.set(t[0], 0, t[2]); c.gate.rotation.y = t[3];
      const gg = M.gateGeo(c.faction, segLen + .6), dg = M.doorGeo(segLen + .6);
      c.gate.add(new THREE.Mesh(gg, propMat), new THREE.Mesh(gg, propOutline(.04))); c.door = new THREE.Group(); c.door.add(new THREE.Mesh(dg, propMat), new THREE.Mesh(dg, propOutline(.03)));
      c.gate.add(c.door); grp.add(c.gate); }
    c.towerPos = [0, 1, 2, 3].map(k => { const a = Math.PI / 4 + k * Math.PI / 2; return [Math.cos(a) * c.R, Math.sin(a) * c.R]; });
    c.towerList = c.towerPos.map(([x, z]) => [x, 0, z, 0, 0, 0, 1]);
    c.towers = addInstanced(M.towerGeo(c.faction), propMat, c.towerList, .05, grp);
    c.plots = [0, 1, 2, 3].map(k => { const a = Math.PI / 4 + k * Math.PI / 2 + .35; return { x: Math.cos(a) * c.R * .55, z: Math.sin(a) * c.R * .55 }; });
    const items = [{ geo: M.keepGeo(c.faction), m: mat4(0, 0, 0, rng() * 6) }], houseG = M.houseGeo(c.faction);
    let placed = 0;
    for (let n = 0; n < 200 && placed < 5 + c.tier * 2; n++) {
      const a = rng() * TAU, r = c.R * (.38 + rng() * .42), x = Math.cos(a) * r, z = Math.sin(a) * r;
      if (c.plots.some(p => Math.hypot(p.x - x, p.z - z) < 3.4)) continue;
      if (items.slice(1).some(it => Math.hypot(it.x - x, it.z - z) < 3.2)) continue;
      items.push({ geo: houseG, m: mat4(x, 0, z, -a + Math.PI / 2, .9 + rng() * .3), x, z }); placed++;
    }
    c.core = meshWithOutline(mergeBuilt(items), .05, grp);
    c.citadel = meshWithOutline(M.citadelGeo(c.R, style), .05, grp); c.citadel.visible = false;
    c.plotMarks = c.plots.map(p => {
      const m = new THREE.Mesh(new THREE.RingGeometry(1.5, 1.8, 24).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: '#ffb347', transparent: true, opacity: .55, depthWrite: false }));
      m.position.set(p.x, .08, p.z); m.visible = false; grp.add(m); return m;
    });
    c.bmesh = [null, null, null, null];
    updateWalls(c);
  }
  world.cities = cities;
  // camp visuals: tents, a fire ring, stakes and a banner, each piece seated on the ground
  for (const c of camps) {
    const items = [], human = c.faction === 'human', y0 = hgt(c.x, c.z), put = (geo, x, z, ry = 0, s = 1) => items.push({ geo, m: mat4(x, hgt(c.x + x, c.z + z) - y0, z, ry, s) });
    const tent = human ? build([P(T(Cone(1.9, 2.4, 4), 0, 1.2, 0, 0, Math.PI / 4), 0, O, '#b59a6a'), P(T(Box(.7, 1, .05), 0, .5, 1.36), 0, O, '#3b2a1c')])
      : build([P(T(Cone(1.8, 2.6, 6), 0, 1.3), 0, O, '#5a3e28'), ...[0, 1, 2].map(k => P(T(Cyl(.05, .05, 1.2, 4), Math.cos(k * 2.1) * .2, 2.9, Math.sin(k * 2.1) * .2, Math.cos(k * 2.1) * .3, 0, Math.sin(k * 2.1) * .3), 0, O, '#e2d6b5'))]);
    const n = 3 + c.tier;
    for (let k = 0; k < n; k++) { const a = k / n * TAU + rng() * .4, r = 6 + rng() * 2.5; put(tent, Math.cos(a) * r, Math.sin(a) * r, -a + Math.PI / 2, .9 + rng() * .3); }
    put(build([...Array.from({ length: 8 }, (_, k) => P(T(Dod(.28), Math.cos(k / 8 * TAU) * .9, .1, Math.sin(k / 8 * TAU) * .9), 0, O, '#6d685f')), P(T(Cone(.5, .9, 5), 0, .45), 0, O, '#ff7a2a', 1.8), P(T(Cone(.3, .6, 4), .1, .5, .1), 0, O, '#ffd34d', 2)]), 0, 0);
    const stake = build([P(T(Cyl(.1, .14, 1.6, 5), 0, .8), 0, O, '#5c3f27'), P(T(Cone(.1, .3, 5), 0, 1.75), 0, O, '#4a3322')]);
    for (let k = 0; k < 22; k++) { const a = k / 22 * TAU; if (k % 7 === 3) continue; put(stake, Math.cos(a) * 11, Math.sin(a) * 11, rng() * 6, .9 + rng() * .3); }
    put(build([P(T(Cyl(.06, .06, 4, 4), 0, 2), 0, O, '#3b2a1c'), P(T(Box(.05, 1.4, 1.1), 0, 3.2, .58), 0, O, human ? '#7a1f1c' : '#2c2c2c'), P(T(Dod(.25), 0, 4.1), 0, O, '#e2d6b5')]), 2.5, -2.5);
    const g = new THREE.Group(); g.position.set(c.x, y0, c.z); worldGroup.add(g); c.y = y0;
    const geo = mergeBuilt(items); g.add(new THREE.Mesh(geo, propMat), new THREE.Mesh(geo, propOutline(.04)));
  }

  // minimap base image
  const mm = document.createElement('canvas'); mm.width = mm.height = 150;
  const g = mm.getContext('2d'), img = g.createImageData(150, 150), bc = BIOMES.map(b => new THREE.Color(b.map));
  for (let y = 0; y < 150; y++) for (let x = 0; x < 150; x++) {
    const wx = x * (2 * WH / 150) - WH, wz = y * (2 * WH / 150) - WH, c = bc[biomeAt(wx, wz)], s = .95, o = (y * 150 + x) * 4;
    img.data[o] = Math.min(255, c.r ** (1 / 2.2) * 255 * s); img.data[o + 1] = Math.min(255, c.g ** (1 / 2.2) * 255 * s); img.data[o + 2] = Math.min(255, c.b ** (1 / 2.2) * 255 * s); img.data[o + 3] = 255;
  }
  g.putImageData(img, 0, 0); world.minimap = mm;
  return world;
}

// walls crumble segment by segment as their health drops
export function updateWalls(c) {
  const hostile = c.state === 'hostile', f = hostile ? 1 - c.wallHP / c.wallMax : 1, o = new THREE.Object3D();
  c.wallList.forEach((t, k) => {
    const down = c.collapse[k] < f * 1.05, gone = k === c.gateSeg;
    o.position.set(t[0], down ? -.6 : 0, t[2]); o.rotation.set(down ? .25 : 0, t[3], down ? .2 * (c.collapse[k] - .5) : 0); o.scale.set(gone ? .001 : 1, down ? .35 : gone ? .001 : 1, 1);
    o.updateMatrix(); c.walls.setMatrixAt(k, o.matrix);
  });
  c.walls.instanceMatrix.needsUpdate = true;
  c.towersUp = c.towerList.map((t, k) => hostile && c.towerHP[k] > 0 && f < .85);
  c.towerList.forEach((t, k) => {
    const down = !c.towersUp[k];
    o.position.set(t[0], down ? -1.5 : 0, t[2]); o.rotation.set(down ? .3 : 0, 0, down ? .2 : 0); o.scale.set(1, down ? .4 : 1, 1);
    o.updateMatrix(); c.towers.setMatrixAt(k, o.matrix);
  });
  c.towers.instanceMatrix.needsUpdate = true;
  if (c.gate) { const gf = hostile ? 1 - c.gateHP / c.gateMax : 1; c.door.visible = gf < 1; c.door.position.y = -gf * 1.2; c.door.rotation.x = gf * .5; c.gate.scale.y = hostile ? 1 : .55; }
}
// the city becomes yours, or is lost again
export function setCityLook(c) {
  const owned = c.state === 'owned';
  c.core.visible = !owned; c.citadel.visible = owned;
  c.plotMarks.forEach(m => m.visible = false);
  c.bmesh.forEach((m, k) => { if (m) { c.group.remove(m); c.bmesh[k] = null; } });
  if (owned) c.buildings.forEach((b, k) => { if (b.type) placeBuilding(c, k); });
  updateWalls(c);
}
const bGeoCache = {};
export function placeBuilding(c, k) {
  const b = c.buildings[k];
  if (c.bmesh[k]) c.group.remove(c.bmesh[k]);
  const geo = bGeoCache[b.type] || (bGeoCache[b.type] = M.buildingGeo[b.type]());
  const g = new THREE.Group(), m = new THREE.Mesh(geo, propMat), ol = new THREE.Mesh(geo, propOutline(.04));
  g.add(m, ol); g.position.set(c.plots[k].x, 0, c.plots[k].z); g.scale.setScalar(.85 + b.lvl * .15);
  c.group.add(g); c.bmesh[k] = g; c.plotMarks[k].visible = false;
}
